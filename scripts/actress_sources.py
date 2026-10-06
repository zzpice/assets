"""Read public source data into review files; never change the live directory."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import hashlib
from html import unescape
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SERIES = "fanza-monthly-dvd-rental"


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "assets-directory/1.0", "Cookie": "age_check_done=1"})
    with urllib.request.urlopen(request, timeout=15) as response:
        data = response.read(12_000_001)
        if len(data) > 12_000_000:
            raise ValueError("Source response exceeds 12 MB")
        return data


def ranking_url(year, page=1):
    return f"https://www.dmm.co.jp/rental/-/ranking/=/article=actress/t=year_{year}/" + (f"page={page}/" if page > 1 else "")


def parse_ranking(data, year, page):
    text = data.decode("utf-8")
    if not re.search(rf"{year}年\s*年間\s*AV女優ランキング", text):
        raise ValueError(f"{year}/{page}: missing annual heading (region, age gate or page changed)")
    rows = []
    for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", text, re.S):
        rank = re.search(r'<span class="rank">(\d+)</span>', cell)
        if not rank:
            continue
        identity = re.search(r'<a href="(https://www\.dmm\.co\.jp/rental/-/list/=/article=actress/id=(\d+)/)">\s*([^<]+)</a>', cell)
        portrait = re.search(r'<img src="(https://pics\.dmm\.co\.jp/mono/actjpgs/[^\"]+)"', cell)
        if not rank or not identity or not portrait:
            raise ValueError(f"{year}/{page}: incomplete actress row")
        rows.append({"rank": int(rank[1]), "sourceId": identity[2], "name": unescape(identity[3]).strip(), "profile": unescape(identity[1]), "portrait": unescape(portrait[1])})
    if [row["rank"] for row in rows] != list(range((page - 1) * 20 + 1, page * 20 + 1)):
        raise ValueError(f"{year}/{page}: expected exactly 20 consecutive ranks")
    return rows


def fetch_annual(year, output):
    if not 2023 <= year < date.today().year:
        raise ValueError("Only completed modern years (2023 onward) are accepted")
    pages, rows = [], []
    for page in range(1, 6):
        url = ranking_url(year, page)
        data = download(url)
        rows.extend(parse_ranking(data, year, page))
        pages.append({"url": url, "sha256": hashlib.sha256(data).hexdigest()})
    if len({row["sourceId"] for row in rows}) != 100:
        raise ValueError("Duplicate source identity in annual ranking")
    snapshot = {"series": SERIES, "year": year, "retrieved": date.today().isoformat(), "pages": pages, "rows": rows}
    output.mkdir(parents=True, exist_ok=True)
    (output / f"{year}.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return snapshot


def audit_portraits(output):
    directory = json.loads((ROOT / "actresses/data.json").read_text("utf-8"))
    revision = json.loads(download("https://api.github.com/repos/gfriends/gfriends/commits/master"))["sha"]
    tree = json.loads(download(f"https://raw.githubusercontent.com/gfriends/gfriends/{revision}/Filetree.json"))["Content"]

    def check(person):
        source = person["portrait"]["source"]
        try:
            if source["provider"] != "Gfriends":
                return {"id": person["id"], "status": "manual-source"}
            folder, filename = source["path"].split("/", 2)[1:]
            upstream = tree.get(folder, {}).get(filename)
            if not upstream:
                return {"id": person["id"], "status": "missing-upstream"}
            path = f"Content/{folder}/{upstream.split('?')[0]}"
            url = "https://raw.githubusercontent.com/gfriends/gfriends/" + revision + "/" + urllib.parse.quote(path)
            digest = hashlib.sha256(download(url)).hexdigest()
            return {"id": person["id"], "status": "unchanged" if digest == source["sha256"] else "candidate", "sha256": digest, "url": url, "revision": revision}
        except Exception as error:
            return {"id": person["id"], "status": "unavailable", "error": str(error)}

    with ThreadPoolExecutor(max_workers=4) as pool:
        report = list(pool.map(check, directory["people"]))
    output.mkdir(parents=True, exist_ok=True)
    (output / "portraits.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(report)} portraits checked; {sum(row['status'] == 'candidate' for row in report)} candidates; live data unchanged")


def review_duplicates(output):
    from PIL import Image, ImageOps
    from actresses import normalized
    people = json.loads((ROOT / "actresses/data.json").read_text("utf-8"))["people"]
    fingerprints, aliases = [], {}
    for person in people:
        with Image.open(ROOT / person["portrait"]["path"]) as original:
            image = ImageOps.exif_transpose(original).convert("L").resize((9, 8), Image.Resampling.LANCZOS)
            pixels = list(image.get_flattened_data())
            fingerprint = sum((pixels[y * 9 + x] > pixels[y * 9 + x + 1]) << (y * 8 + x) for y in range(8) for x in range(8))
            fingerprints.append((person["id"], fingerprint))
        for name in [person["name"], *(alias["name"] for alias in person["aliases"])]:
            aliases.setdefault(normalized(name), set()).add(person["id"])
    similar = [{"people": [a, b], "distance": (left ^ right).bit_count()} for i, (a, left) in enumerate(fingerprints) for b, right in fingerprints[i + 1:] if (left ^ right).bit_count() <= 5]
    report = {"similarImages": similar, "sharedNames": {name: sorted(ids) for name, ids in aliases.items() if len(ids) > 1}, "method": "64-bit difference hash, Hamming distance <= 5; review hints only, never identity proof"}
    output.mkdir(parents=True, exist_ok=True)
    (output / "duplicates.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(similar)} visually similar pairs, {len(report['sharedNames'])} shared names; manual review only")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["annual", "portraits", "duplicates"])
    parser.add_argument("--year", type=int)
    parser.add_argument("--output", type=Path, required=True, help="Review directory outside the repository")
    args = parser.parse_args()
    if args.output.resolve() == ROOT or ROOT in args.output.resolve().parents:
        parser.error("Review output must be outside the live repository")
    if args.command == "annual":
        if not args.year:
            parser.error("annual requires --year")
        snapshot = fetch_annual(args.year, args.output)
        print(f"{snapshot['year']}: {len(snapshot['rows'])} verified source rows; review required")
    elif args.command == "portraits":
        audit_portraits(args.output)
    else:
        review_duplicates(args.output)


if __name__ == "__main__":
    main()
