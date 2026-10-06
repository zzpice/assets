"""Game-cover metadata checks shared by the catalog and the manual image workflow."""

from datetime import date
import hashlib
import math
import re
from urllib.parse import urlparse

SLUG = r"[a-z0-9][a-z0-9-]*"
RELEASE_TYPES = {"original", "port", "remaster", "remake", "collection", "reissue"}


def require_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} 应为非空字符串")


def require_url(value, field):
    require_text(value, field)
    url = urlparse(value)
    if url.scheme != "https" or not url.netloc:
        raise ValueError(f"{field} 应为 HTTPS 来源链接")


def require_year(value, field):
    if type(value) is not int or not 1970 <= value <= date.today().year:
        raise ValueError(f"{field} 应为已正式发行的年份（1970 至今年）")


def game_indexes(series, games):
    if not isinstance(series, list) or not isinstance(games, list):
        raise ValueError("gameSeries 与 games 应为清单")
    series_index, game_index = {}, {}
    for item in series:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not re.fullmatch(SLUG, item["id"]):
            raise ValueError("gameSeries.id 应为小写英文、数字和短横线")
        require_text(item.get("title"), "gameSeries.title")
        if item["id"] in series_index:
            raise ValueError("gameSeries.id 不能重复")
        series_index[item["id"]] = item
    for game in games:
        if not isinstance(game, dict) or not isinstance(game.get("series"), str) or game["series"] not in series_index or not isinstance(game.get("id"), str) or not re.fullmatch(SLUG, game["id"]):
            raise ValueError("games 须记录已登记的 series 与有效 id")
        key = game["series"] + "/" + game["id"]
        require_text(game.get("title"), key + ".title")
        require_year(game.get("firstReleaseYear"), key + ".firstReleaseYear")
        require_url(game.get("firstReleaseSource"), key + ".firstReleaseSource")
        if key in game_index:
            raise ValueError(f"{key}: games 不能重复")
        game_index[key] = game
    for key, game in game_index.items():
        if "includes" in game:
            included = game["includes"]
            if not isinstance(included, list) or not included or any(not isinstance(ref, str) or ref not in game_index or ref == key or "includes" in game_index[ref] for ref in included) or len(set(included)) != len(included):
                raise ValueError(f"{key}: includes 须关联不同的已登记原作品，不能嵌套合集")
    return series_index, game_index


def cover_metadata(path, old, image, image_format, data, games):
    match = re.fullmatch(rf"game-covers/({SLUG})/({SLUG})/({SLUG})\.(jpg|png)", path)
    if not match or match[1] + "/" + match[2] not in games:
        raise ValueError(f"{path}: 封面路径应为 game-covers/<已登记系列>/<已登记作品>/<版本-平台-地区>.jpg 或 .png")
    series, game, _, extension = match.groups()
    if image is None or image_format != {"jpg": "JPEG", "png": "PNG"}[extension] or image.size != (1000, 1500) or image.mode != "RGB":
        raise ValueError(f"{path}: 封面必须为 1000×1500（2:3）、RGB 的 JPEG 或 PNG")
    edition, cover, source, processing = (old.get(key) for key in ("edition", "cover", "source", "processing"))
    if edition not in {"main", "alternate"} or not all(isinstance(item, dict) for item in (cover, source, processing)):
        raise ValueError(f"{path}: 须登记 edition（main/alternate）、cover、source 和 processing")
    for field in ("version", "platform", "region"):
        require_text(cover.get(field), path + ".cover." + field)
    if cover.get("releaseType") not in RELEASE_TYPES:
        raise ValueError(f"{path}: cover.releaseType 无效")
    info = games[series + "/" + game]
    if edition == "main" and (cover["releaseType"] != "original" or "includes" in info):
        raise ValueError(f"{path}: 主封面只能是原作品的独立首发版本，后续版本及合集不能作为主封面")
    if "includes" in info and cover["releaseType"] != "collection":
        raise ValueError(f"{path}: 合集封面须标为 collection")
    require_year(cover.get("releaseYear"), path + ".cover.releaseYear")
    if cover["releaseYear"] < info["firstReleaseYear"]:
        raise ValueError(f"{path}: 当前版本年份不能早于作品首发年份")
    require_url(cover.get("releaseSource"), path + ".cover.releaseSource")
    require_text(source.get("publisher"), path + ".source.publisher")
    for field in ("page", "url"):
        require_url(source.get(field), path + ".source." + field)
    if not isinstance(source.get("sha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", source["sha256"]):
        raise ValueError(f"{path}: source.sha256 须记录下载源文件的 SHA-256")
    for field in ("width", "height"):
        if type(source.get(field)) is not int or source[field] <= 0:
            raise ValueError(f"{path}: source.{field} 须记录原图实际尺寸")
    retrieved = source.get("retrieved")
    if not isinstance(retrieved, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", retrieved):
        raise ValueError(f"{path}: source.retrieved 应为 YYYY-MM-DD 获取日期")
    date.fromisoformat(retrieved)
    if processing.get("sha256") != hashlib.sha256(data).hexdigest():
        raise ValueError(f"{path}: processing.sha256 与封面不符，请重新核对来源和处理记录")
    if processing.get("mode") not in {"crop", "contain"}:
        raise ValueError(f"{path}: processing.mode 应为 crop 或 contain")
    crop = processing.get("crop")
    if not isinstance(crop, list) or len(crop) != 4 or any(type(v) is not int for v in crop) or not (0 <= crop[0] < crop[2] <= source["width"] and 0 <= crop[1] < crop[3] <= source["height"]):
        raise ValueError(f"{path}: processing.crop 须为原图范围内的 [左, 上, 右, 下] 像素坐标")
    if processing["mode"] == "crop" and (crop[2] - crop[0]) * 3 != (crop[3] - crop[1]) * 2:
        raise ValueError(f"{path}: 裁切区域须为 2:3，禁止拉伸")
    if processing["mode"] == "contain" and (not isinstance(processing.get("background"), str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", processing["background"])):
        raise ValueError(f"{path}: 留边须记录 #RRGGBB 背景色")
    scale = min(1000 / (crop[2] - crop[0]), 1500 / (crop[3] - crop[1]))
    if type(processing.get("scale")) not in {float, int} or not math.isfinite(processing["scale"]) or abs(processing["scale"] - scale) > 0.00001:
        raise ValueError(f"{path}: processing.scale 须记录实际等比缩放倍数")
    require_text(old.get("note"), path + ".note（原图尺寸及处理说明）")
    return series, {"game": game, "edition": edition, "cover": cover, "source": source, "processing": processing}


def validate_main_covers(assets):
    mains = set()
    for item in assets:
        if item["kind"] != "game-cover" or item["edition"] != "main":
            continue
        key = item["category"] + "/" + item["game"]
        if key in mains:
            raise ValueError(f"{key}: 每款游戏最多只能登记一个主封面")
        mains.add(key)
