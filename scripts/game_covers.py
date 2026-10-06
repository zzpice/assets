"""Minimal work identity and source checks for the curated game-cover gallery."""

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


def cover_identity(path):
    selected = re.fullmatch(rf"game-covers/({SLUG})/({SLUG})\.(jpg|png)", path)
    extra = re.fullmatch(rf"game-covers/({SLUG})/extras/({SLUG})/{SLUG}\.(jpg|png)", path)
    match = selected or extra
    if not match:
        raise ValueError(f"{path}: 封面路径应为 game-covers/<系列>/<作品>.jpg 或 extras/<作品>/<名称>.jpg（也支持 PNG）")
    return *match.groups(), bool(extra)


def cover_metadata(path, old, image, image_format, games):
    series, game, extension, _ = cover_identity(path)
    if series + "/" + game not in games:
        raise ValueError(f"{path}: 系列与作品须先在 catalog 登记")
    if image is None or image_format != {"jpg": "JPEG", "png": "PNG"}[extension]:
        raise ValueError(f"{path}: 须为真实 JPEG 或 PNG；保留源图尺寸与比例")
    require_url(old.get("source"), path + ".source")
    info = {"title": games[series + "/" + game]["title"], "game": game, "source": old["source"]}
    if "cover" in old:
        if not isinstance(old["cover"], dict):
            raise ValueError(f"{path}: cover 应为可选的说明对象")
        details = {key: value for key, value in old["cover"].items() if key in {"platform", "region", "version"}}
        for field, value in details.items():
            require_text(value, path + ".cover." + field)
        if details:
            info["cover"] = details
    return series, info


def validate_selected_covers(assets):
    selected, extras = set(), set()
    for item in assets:
        if item["kind"] != "game-cover":
            continue
        key = item["category"] + "/" + item["game"]
        if cover_identity(item["path"])[3]:
            extras.add(key)
        elif key in selected:
            raise ValueError(f"{key}: 每部作品只保留一张默认封面；少数额外收藏放在 extras")
        else:
            selected.add(key)
    if extras - selected:
        raise ValueError(f"{', '.join(sorted(extras - selected))}: 额外收藏须有对应的默认封面")
