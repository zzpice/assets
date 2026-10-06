"""Game-cover metadata checks shared by the catalog and the manual image workflow."""

from datetime import date
import re
from urllib.parse import urlparse

SLUG = r"[a-z0-9][a-z0-9-]*"


def require_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} 应为非空字符串")


def require_url(value, field):
    require_text(value, field)
    url = urlparse(value)
    if url.scheme not in {"http", "https"} or not url.hostname:
        raise ValueError(f"{field} 应为 HTTP(S) 来源链接")


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
        if key in game_index:
            raise ValueError(f"{key}: games 不能重复")
        game_index[key] = game
    return series_index, game_index


def cover_metadata(path, old, image, image_format, games):
    match = re.fullmatch(rf"game-covers/({SLUG})/({SLUG})/({SLUG})\.(jpg|png)", path)
    if not match or match[1] + "/" + match[2] not in games:
        raise ValueError(f"{path}: 封面路径应为 game-covers/<已登记系列>/<已登记作品>/<平台-地区[-版本]>.jpg 或 .png")
    series, game, _, extension = match.groups()
    if image is None or image_format != {"jpg": "JPEG", "png": "PNG"}[extension] or image.size != (1000, 1500) or image.mode != "RGB":
        raise ValueError(f"{path}: 封面必须为 1000×1500（2:3）、RGB 的 JPEG 或 PNG")
    edition, cover, source = (old.get(key) for key in ("edition", "cover", "source"))
    if edition not in {"main", "alternate"} or not isinstance(cover, dict):
        raise ValueError(f"{path}: 须登记 edition（main/alternate）和 cover")
    for field in ("platform", "region"):
        require_text(cover.get(field), path + ".cover." + field)
    if "version" in cover:
        require_text(cover["version"], path + ".cover.version")
    require_url(source, path + ".source")
    # Work identity and display title have one source of truth, independent of edition.
    details = {field: cover[field] for field in ("platform", "region", "version") if field in cover}
    return series, {"title": games[series + "/" + game]["title"], "game": game, "edition": edition, "cover": details, "source": source}


def validate_main_covers(assets):
    mains = set()
    for item in assets:
        if item["kind"] != "game-cover" or item["edition"] != "main":
            continue
        key = item["category"] + "/" + item["game"]
        if key in mains:
            raise ValueError(f"{key}: 每款游戏最多只能登记一个主封面")
        mains.add(key)
