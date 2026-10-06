"""Validate one person registry and compile annual views from source snapshots."""

from datetime import date
import hashlib
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import unquote, urlparse

from actress_sources import SERIES, ranking_url


def required_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: expected a nonempty string")
    return value


def https(value, field):
    required_text(value, field)
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError(f"{field}: expected an HTTPS source URL")


def dated(value, field):
    required_text(value, field)
    try:
        date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{field}: expected a valid ISO date") from error
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError(f"{field}: expected YYYY-MM-DD")


def normalized(value):
    return "".join(unicodedata.normalize("NFKC", value).casefold().split())


def validate_profile(profile, agencies, names, pid):
    """A reviewed official profile snapshot; missing facts are deliberately absent."""
    allowed = {"sourceName", "source", "reviewed", "agency", "heightCm", "birthDate", "birthYear", "measurementsCm"}
    if not isinstance(profile, dict) or set(profile) - allowed:
        raise ValueError(f"{pid}: unsupported profile fields")
    if normalized(required_text(profile.get("sourceName"), pid + ".profile.sourceName")) not in names:
        raise ValueError(f"{pid}: profile name requires reviewed identity mapping")
    dated(profile.get("reviewed"), pid + ".profile.reviewed")
    source = profile.get("source", {})
    https(source.get("url"), pid + ".profile.source.url")
    dated(source.get("retrieved"), pid + ".profile.source.retrieved")
    if not re.fullmatch(r"[a-f0-9]{64}", source.get("sha256", "")):
        raise ValueError(f"{pid}: profile source needs a snapshot SHA-256")
    if "agency" in profile and profile["agency"] not in agencies:
        raise ValueError(f"{pid}: unknown agency ID")
    if "heightCm" in profile and (type(profile["heightCm"]) is not int or not 100 <= profile["heightCm"] <= 230):
        raise ValueError(f"{pid}: heightCm must be a plausible integer in cm")
    if "birthDate" in profile:
        dated(profile["birthDate"], pid + ".profile.birthDate")
        if date.fromisoformat(profile["birthDate"]) > date.today() or "birthYear" in profile:
            raise ValueError(f"{pid}: conflicting or future birth date")
    if "birthYear" in profile and (type(profile["birthYear"]) is not int or not 1900 <= profile["birthYear"] <= date.today().year):
        raise ValueError(f"{pid}: invalid birthYear")
    if "measurementsCm" in profile:
        values = profile["measurementsCm"]
        if not isinstance(values, list) or len(values) != 3 or any(type(v) is not int or not 30 <= v <= 200 for v in values):
            raise ValueError(f"{pid}: measurementsCm requires bust, waist, hip in cm")


def directory(root):
    file = root / "actresses/data.json"
    if not file.exists():
        if (root / "actresses").exists() and any((root / "actresses").rglob("*.jpg")):
            raise ValueError("Actress portraits require actresses/data.json")
        return {}, {}
    data = json.loads(file.read_text("utf-8"))
    if data.get("version") != 1 or not isinstance(data.get("people"), list) or not data["people"]:
        raise ValueError("actresses/data.json: invalid person registry")
    agencies = data.get("agencies", {})
    if not isinstance(agencies, dict):
        raise ValueError("agencies must be an ID mapping")
    for aid, agency in agencies.items():
        if not re.fullmatch(r"[a-z][a-z0-9-]*", aid) or not isinstance(agency, dict):
            raise ValueError("Agencies need stable internal IDs")
        required_text(agency.get("name"), aid + ".name")
        https(agency.get("url"), aid + ".url")
    ids, identities, paths, hashes, names = {}, {}, set(), set(), {}
    for person in data["people"]:
        pid = person.get("id")
        if not isinstance(pid, str) or not re.fullmatch(r"p\d{4,}", pid) or pid in ids:
            raise ValueError("Person IDs must be unique stable p0001-style identifiers")
        name = required_text(person.get("name"), pid + ".name")
        if normalized(name) in names:
            raise ValueError(f"{pid}: duplicate primary name; review identity before adding")
        names[normalized(name)] = pid
        https(person.get("nameSource"), pid + ".nameSource")
        source_ids = person.get("identities", {})
        source_ids = source_ids.get("fanza")
        if not isinstance(source_ids, list) or not source_ids:
            raise ValueError(f"{pid}: missing FANZA identities")
        for sid in source_ids:
            if not isinstance(sid, str) or not re.fullmatch(r"\d+", sid) or sid in identities:
                raise ValueError(f"{pid}: duplicate or invalid FANZA identity")
            identities[sid] = pid
        if not isinstance(person.get("aliases"), list):
            raise ValueError(f"{pid}: aliases must be an attributed list")
        aliases = {normalized(name)}
        for alias in person["aliases"]:
            label = normalized(required_text(alias.get("name"), pid + ".alias"))
            if label in aliases:
                raise ValueError(f"{pid}: duplicate alias")
            aliases.add(label)
            https(alias.get("source"), pid + ".alias.source")
        roman = person.get("romanization")
        if roman is not None and (not isinstance(roman, str) or normalized(roman) not in aliases):
            raise ValueError(f"{pid}: romanization must be a sourced name or alias")
        if "profile" in person:
            validate_profile(person["profile"], agencies, aliases, pid)
        photo = person.get("portrait", {})
        path = photo.get("path")
        if not isinstance(path, str) or not re.fullmatch(r"actresses/portraits/" + re.escape(pid) + r"\.(jpg|png|webp)", path) or path in paths:
            raise ValueError(f"{pid}: exactly one portrait at actresses/portraits/<id>.<source format> is required")
        paths.add(path)
        dated(photo.get("reviewed"), pid + ".portrait.reviewed")
        source = photo.get("source", {})
        https(source.get("url"), pid + ".portrait.source.url")
        required_text(source.get("provider"), pid + ".portrait.source.provider")
        dated(source.get("retrieved"), pid + ".portrait.source.retrieved")
        if "profile" in source:
            https(source["profile"], pid + ".portrait.source.profile")
        digest = source.get("sha256")
        if not isinstance(digest, str) or not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise ValueError(f"{pid}: portrait source requires SHA-256")
        image = root / path
        if not image.is_file() or image.is_symlink() or hashlib.sha256(image.read_bytes()).hexdigest() != digest:
            raise ValueError(f"{pid}: missing, linked or changed portrait; review source attribution")
        if digest in hashes:
            raise ValueError(f"{pid}: identical photo belongs to two people; review duplicate identity")
        hashes.add(digest)
        display = photo.get("display")
        if display is not None:
            if not isinstance(display, dict) or set(display) != {"crop", "sourceSha256", "reviewed"} or display.get("sourceSha256") != digest:
                raise ValueError(f"{pid}: display crop requires review against the current portrait digest")
            dated(display["reviewed"], pid + ".portrait.display.reviewed")
            crop = display["crop"]
            if not isinstance(crop, list) or len(crop) != 4 or any(type(v) is not int for v in crop) or min(crop[:2]) < 0 or min(crop[2:]) <= 0:
                raise ValueError(f"{pid}: crop requires nonnegative x/y and positive width/height")
        if source["provider"] == "Gfriends":
            revision = source.get("revision", "")
            upstream = source.get("path", "")
            expected = f"https://raw.githubusercontent.com/gfriends/gfriends/{revision}/{upstream}"
            if not re.fullmatch(r"[a-f0-9]{40}", revision) or not upstream.startswith("Content/") or unquote(source["url"]) != expected:
                raise ValueError(f"{pid}: Gfriends source requires a pinned commit and upstream path")
        if "hallOfFame" in person:
            hall = person["hallOfFame"]
            required_text(hall.get("reason"), pid + ".hallOfFame.reason")
            dated(hall.get("reviewed"), pid + ".hallOfFame.reviewed")
            if not isinstance(hall.get("sources"), list) or not hall["sources"]:
                raise ValueError(f"{pid}: hall selection needs evidence")
            for url in hall["sources"]:
                https(url, pid + ".hallOfFame.source")
        ids[pid] = person
    redirects = data.get("redirects", {})
    if not isinstance(redirects, dict):
        raise ValueError("redirects must be an ID mapping")
    for old, current in redirects.items():
        if not re.fullmatch(r"p\d{4,}", old) or old in ids or current not in ids:
            raise ValueError("Merged IDs must point directly to a live person, without chains or cycles")
    previous_file = root / "catalog.json"
    previous = json.loads(previous_file.read_text("utf-8")).get("actresses", {}).get("people", []) if previous_file.exists() else []
    for person in previous:
        old = person["id"]
        former_ids = person["identities"]["fanza"]
        if isinstance(former_ids, str):
            former_ids = [former_ids]
        for sid in former_ids:
            current = identities.get(sid)
            if current and current != old and redirects.get(old) != current:
                raise ValueError(f"{old}: stable ID changed without an explicit merge redirect")
        if old in ids and not set(former_ids).intersection(ids[old]["identities"]["fanza"]):
            raise ValueError(f"{old}: stable ID cannot be reassigned to another person")
    found = {path.relative_to(root).as_posix() for path in (root / "actresses/portraits").glob("*") if path.is_file()}
    if found != paths:
        raise ValueError("Every portrait must belong to exactly one registered person")
    rankings = []
    for file in sorted((root / "actresses/rankings").glob("*.json")):
        snapshot = json.loads(file.read_text("utf-8"))
        year = snapshot.get("year")
        if type(year) is not int or not 2023 <= year < date.today().year or file.stem != str(year) or snapshot.get("series") != SERIES:
            raise ValueError(f"{file.name}: invalid completed year or incompatible ranking series")
        dated(snapshot.get("retrieved"), file.name + ".retrieved")
        pages = snapshot.get("pages")
        if not isinstance(pages, list) or len(pages) != 5:
            raise ValueError(f"{year}: annual ranking needs all five source pages")
        for page, record in enumerate(pages, 1):
            if record.get("url") != ranking_url(year, page) or not re.fullmatch(r"[a-f0-9]{64}", record.get("sha256", "")):
                raise ValueError(f"{year}: source page URL or digest invalid")
        rows = snapshot.get("rows")
        if not isinstance(rows, list) or [row.get("rank") for row in rows] != list(range(1, 101)):
            raise ValueError(f"{year}: annual ranking must contain ranks 1–100 without gaps")
        entries, seen = [], set()
        for row in rows:
            sid = row.get("sourceId")
            if sid not in identities:
                raise ValueError(f"{year}: unmapped source identity {sid}; manual person review required")
            pid = identities[sid]
            if pid in seen:
                raise ValueError(f"{year}: a person occurs twice in one ranking")
            seen.add(pid)
            name = required_text(row.get("name"), str(year) + ".source.name")
            known = {normalized(ids[pid]["name"]), *(normalized(alias["name"]) for alias in ids[pid]["aliases"])}
            raw_names = [name.split("（")[0]] + re.findall(r"（([^）]+)）", name)
            if not all(normalized(value) in known for value in raw_names):
                raise ValueError(f"{year}/{pid}: unreviewed source name or rename")
            if row.get("profile") != f"https://www.dmm.co.jp/rental/-/list/=/article=actress/id={sid}/":
                raise ValueError(f"{year}/{pid}: profile identity mismatch")
            https(row.get("portrait"), str(year) + ".source.portrait")
            entries.append({"person": pid, "rank": row["rank"], "sourceName": name})
        rankings.append({"series": SERIES, "year": year, "source": pages[0]["url"], "retrieved": snapshot["retrieved"], "snapshot": f"actresses/rankings/{year}.json", "entries": entries})
    compiled = {"people": data["people"], "redirects": redirects, "rankings": rankings,
                "series": {"id": SERIES, "title": "FANZA 月额 DVD 租赁", "method": "官方年度榜原始顺序；不进行月榜换算。仅反映该平台月额 DVD 租赁口径，不代表全行业人气；官方未公开本数、销售额及完整计算细则。"}}
    if agencies:
        compiled["agencies"] = agencies
    return compiled, {person["portrait"]["path"]: person for person in ids.values()}


def portrait_metadata(path, image, image_format, people):
    person = people.get(path)
    formats = {".jpg": "JPEG", ".png": "PNG", ".webp": "WEBP"}
    if not person or image is None or image_format != formats.get(Path(path).suffix):
        raise ValueError(f"{path}: portrait must be registered with its actual source image format")
    metadata = {"title": person["name"], "person": person["id"]}
    display = person["portrait"].get("display")
    if display:
        x, y, width, height = display["crop"]
        if x + width > image.width or y + height > image.height:
            raise ValueError(f"{path}: reviewed display crop exceeds source dimensions")
        metadata["previewCrop"] = display["crop"]
    return metadata
