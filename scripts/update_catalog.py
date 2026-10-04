#!/usr/bin/env python3
"""Update image metadata and small previews without modifying original images."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"}
CARD_REGIONS = {"hong-kong", "china-mainland", "singapore"}
CARD_WALLETS = {"Apple Pay", "Google Pay", "Samsung Pay", "PayPal"}


def card_bank_index(banks):
    if not isinstance(banks, list):
        raise ValueError("cardBanks 应为按展示顺序排列的银行清单")
    index = {}
    for bank in banks:
        if not isinstance(bank, dict) or bank.get("region") not in CARD_REGIONS or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", bank.get("bank", "")):
            raise ValueError("cardBanks 的地区或银行目录名无效")
        if not all(isinstance(bank.get(key), str) and bank[key].strip() for key in ("name", "englishName")):
            raise ValueError("cardBanks 须记录机构名称及英文名称")
        key = (bank["region"], bank["bank"])
        if key in index:
            raise ValueError("cardBanks 的地区与银行不能重复")
        index[key] = bank
    return index


def card_metadata(root, path, old, data, sha, banks):
    match = re.fullmatch(r"bank-cards/(originals|custom)/([a-z0-9-]+)/([a-z0-9-]+)/[a-z0-9][a-z0-9-]*\.[a-z0-9]+", path)
    if not match or (match[2], match[3]) not in banks:
        raise ValueError(f"{path}: 卡面路径应为 bank-cards/<originals或custom>/<地区>/<已登记银行>/<名称>.<格式>")
    edition, region, bank = match.groups()
    info = {"edition": edition, "bank": bank}
    if edition == "originals":
        if old.get("sha") and old["sha"] != sha:
            raise ValueError(f"{path}: 原始卡面不能覆盖，请为不同版本使用新文件名")
        source = old.get("source")
        if not isinstance(source, dict) or source.get("wallet") not in CARD_WALLETS:
            raise ValueError(f"{path}: 原始卡面须记录已确认的 Apple Pay、Google Pay、Samsung Pay 或 PayPal 来源")
        url = urlparse(source.get("url", ""))
        if url.scheme != "https" or not url.netloc or source.get("sha256") != hashlib.sha256(data).hexdigest():
            raise ValueError(f"{path}: 原始卡面须记录 HTTPS 原文件地址和匹配的 SHA-256")
        info["source"] = source
    else:
        original = old.get("derivedFrom", "")
        prefix = f"bank-cards/originals/{region}/{bank}/"
        if not isinstance(original, str) or not re.fullmatch(re.escape(prefix) + r"[a-z0-9][a-z0-9-]*\.[a-z0-9]+", original) or not (root / original).is_file():
            raise ValueError(f"{path}: 修改版须用 derivedFrom 指向同地区、同银行的原始卡面")
        info["derivedFrom"] = original
    return region, info


def source_paths(root):
    if (root / ".git").exists():
        output = subprocess.check_output(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root
        )
        paths = {Path(path) for path in output.decode("utf-8").split("\0") if path}
    else:
        paths = {path.relative_to(root) for path in root.rglob("*") if path.is_file()}
    return sorted(
        path for path in paths
        if path.suffix.lower() in EXTENSIONS
        and path.parts[0] not in {"app", "scripts", ".git"}
        and (root / path).exists()
    )


def git_blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def infer_device(width, height):
    if not width or not height:
        return "unknown"
    if width < height and 720 <= width <= 1800 and 1.9 <= height / width <= 2.6:
        return "phone"
    if tuple(sorted((width, height))) in {(1536, 2048), (1668, 2224), (1668, 2388), (1640, 2360), (2048, 2732)}:
        return "tablet"
    if width >= 1920 and 1.7 <= width / height <= 3.6:
        return "desktop"
    return "unknown"


def svg_size(data):
    node = ET.fromstring(data)
    width, height = node.get("width", ""), node.get("height", "")
    if re.fullmatch(r"\d+(?:\.\d+)?(?:px)?", width) and re.fullmatch(r"\d+(?:\.\d+)?(?:px)?", height):
        return round(float(width.removesuffix("px"))), round(float(height.removesuffix("px")))
    viewbox = re.split(r"[\s,]+", node.get("viewBox", "").strip())
    if len(viewbox) == 4:
        return round(float(viewbox[2])), round(float(viewbox[3]))
    return 0, 0


def validate_icon(image, image_format, path):
    if not path.endswith(".png") or image_format != "PNG" or image is None:
        raise ValueError(f"{path}: 图标必须使用 PNG 格式")
    if image.size != (512, 512) or image.mode != "RGBA":
        raise ValueError(f"{path}: 图标必须为 512×512 PNG、RGBA，实际为 {image.size[0]}×{image.size[1]}、{image.mode}")
    mask = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 511, 511], radius=115, fill=255)
    outside = ImageChops.multiply(image.getchannel("A"), ImageChops.invert(mask))
    if outside.getbbox() is not None:
        raise ValueError(f"{path}: r=115 圆角外侧必须完全透明")


def usable_preview(root, path, width, height):
    if not isinstance(path, str) or not path.startswith("app/previews/"):
        return False
    file = root / path
    if file.is_symlink() or (root / "app/previews").resolve() not in file.resolve().parents:
        return False
    try:
        data = file.read_bytes()
        if not file.name.endswith("-" + hashlib.sha256(data).hexdigest()[:10] + ".webp"):
            return False
        with Image.open(io.BytesIO(data)) as image:
            tw, th = image.size
            image.verify()
        return 0 < tw <= 420 and 0 < th <= 1024 and abs(tw * height - th * width) <= max(width, height)
    except (OSError, ValueError):
        return False


def build_catalog(root):
    catalog_path = root / "catalog.json"
    previous = json.loads(catalog_path.read_text("utf-8")) if catalog_path.exists() else {}
    metadata = {item["path"]: item for item in previous.get("assets", [])}
    card_banks = previous.get("cardBanks", [])
    banks = card_bank_index(card_banks)
    assets, previews = [], {}
    for relative in source_paths(root):
        path = relative.as_posix()
        file = root / relative
        if file.is_symlink():
            raise ValueError(f"{path}: 图片不能使用符号链接")
        if not re.fullmatch(r"[a-z0-9][a-z0-9/.-]*", path) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", relative.stem):
            raise ValueError(f"{path}: 路径请使用小写英文、数字和短横线")
        data = file.read_bytes()
        sha = git_blob_sha(data)
        old = metadata.get(path, {})
        card_info = {}
        same_source = old.get("sha") in {None, sha}
        image = None
        image_format = None
        if relative.suffix == ".svg":
            width, height = svg_size(data)
        else:
            with Image.open(io.BytesIO(data)) as original:
                image_format = original.format
                image = ImageOps.exif_transpose(original)
                image.load()
            width, height = image.size
        if path.startswith(("wallpapers/", "avatars/")):
            folder = relative.parts[0]
            label = "壁纸" if folder == "wallpapers" else "头像"
            match = re.fullmatch(folder + r"/([a-z0-9-]+)/(\d+)x(\d+)/[a-z0-9][a-z0-9-]*\.[a-z0-9]+", path)
            if not match:
                raise ValueError(f"{path}: {label}路径应为 {folder}/<种类>/<宽>x<高>/<名称>.<格式>")
            if (int(match[2]), int(match[3])) != (width, height):
                raise ValueError(f"{path}: 目录尺寸与图片实际尺寸 {width}x{height} 不一致")
            kind, category = ("wallpaper" if folder == "wallpapers" else "avatar"), match[1]
        elif path.startswith("icons/"):
            match = re.fullmatch(r"icons/([a-z0-9-]+)/[a-z0-9][a-z0-9-]*\.[a-z0-9]+", path)
            if not match:
                raise ValueError(f"{path}: 图标路径应为 icons/<种类>/<名称>.<格式>")
            validate_icon(image, image_format, path)
            kind, category = "icon", match[1]
        elif path.startswith("bank-cards/"):
            category, card_info = card_metadata(root, path, old, data, sha, banks)
            kind = "bank-card"
        else:
            kind = "other"
            category = None
        item = {"path": path, "title": old.get("title") or relative.stem.replace("-", " "), "kind": kind}
        item.update(card_info)
        if category:
            item["category"] = category
        if old.get("device"):
            if old["device"] not in {"phone", "desktop", "tablet", "unknown"}:
                raise ValueError(f"{path}: device 应为 phone、desktop、tablet 或 unknown，也可以不填写")
            item["device"] = old["device"]
        elif kind == "wallpaper":
            item["device"] = infer_device(width, height)
        item.update(width=width, height=height)
        if same_source and old.get("note"):
            item["note"] = old["note"]
        if image is not None and kind != "icon":
            if same_source and usable_preview(root, old.get("thumbnail"), width, height):
                item["thumbnail"] = old["thumbnail"]
            else:
                image.thumbnail((420, 1024), Image.Resampling.LANCZOS)
                if image.mode not in {"RGB", "RGBA"}:
                    image = image.convert("RGBA" if "transparency" in image.info else "RGB")
                buffer = io.BytesIO()
                image.save(buffer, "WEBP", quality=82, method=6)
                preview = buffer.getvalue()
                preview_path = f"app/previews/{relative.stem}-{hashlib.sha256(preview).hexdigest()[:10]}.webp"
                previews[preview_path] = preview
                item["thumbnail"] = preview_path
        if image is not None:
            image.close()
        item.update(size=len(data), sha=sha)
        assets.append(item)
    catalog = {"version": 1, "assets": assets}
    if card_banks:
        catalog["cardBanks"] = card_banks
    text = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    referenced = {item["thumbnail"] for item in assets if item.get("thumbnail")}
    stale = [path for path in (root / "app/previews").glob("*.webp") if path.relative_to(root).as_posix() not in referenced]
    return text, previews, stale


def versioned_html(root):
    page = root / "index.html"
    if not page.exists():
        return None
    text = page.read_text("utf-8")
    for path in ["app/site.js", "app/site.css"]:
        file = root / path
        if file.exists():
            version = hashlib.sha256(file.read_bytes()).hexdigest()[:10]
            pattern = r'((?:src|href)="' + re.escape(path) + r')(?:\?v=[a-f0-9]+)?(")'
            text = re.sub(pattern, lambda match: match[1] + "?v=" + version + match[2], text)
    return text


def versioned_service_worker(root, catalog_text, html):
    worker = root / "sw.js"
    if not worker.exists():
        return None
    text = worker.read_text("utf-8")
    pattern = r'(const CACHE_NAME = CACHE_PREFIX \+ ")[^"]+(";)'
    normalized = re.sub(pattern, r'\g<1>VERSION\g<2>', text, count=1)
    digest = hashlib.sha256(normalized.encode("utf-8"))
    digest.update(("\0catalog.json\0" + catalog_text + "\0index.html\0" + (html or "")).encode("utf-8"))
    for path in ["app/site.js", "app/site.css", "app/manifest.webmanifest", "app/icon.svg", "app/icon-180.png", "app/icon-192.png", "app/icon-512.png"]:
        file = root / path
        if file.exists():
            digest.update(("\0" + path + "\0").encode("utf-8"))
            digest.update(file.read_bytes())
    version = "v2-" + digest.hexdigest()[:12]
    return re.sub(pattern, lambda match: match[1] + version + match[2], text, count=1)


def update(root=ROOT, check=False):
    text, previews, stale = build_catalog(root)
    catalog = root / "catalog.json"
    changed = not catalog.exists() or catalog.read_text("utf-8") != text
    page = root / "index.html"
    html = versioned_html(root)
    page_changed = html is not None and page.read_text("utf-8") != html
    worker = root / "sw.js"
    worker_text = versioned_service_worker(root, text, html)
    worker_changed = worker_text is not None and worker.read_text("utf-8") != worker_text
    if check:
        if changed or previews or stale or page_changed or worker_changed:
            raise ValueError("目录、预览、页面或离线缓存版本需要更新，请运行 python3 scripts/update_catalog.py 后提交生成的文件")
    else:
        for path, data in previews.items():
            destination = root / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
        if changed:
            temporary = catalog.with_suffix(".json.tmp")
            temporary.write_text(text, encoding="utf-8")
            temporary.replace(catalog)
        if page_changed:
            page.write_text(html, encoding="utf-8")
        if worker_changed:
            worker.write_text(worker_text, encoding="utf-8")
        for path in stale:
            path.unlink()
    return len(json.loads(text)["assets"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="只检查，不修改文件")
    args = parser.parse_args()
    try:
        count = update(check=args.check)
    except (ValueError, OSError, ET.ParseError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        return 1
    print(f"{'检查通过' if args.check else '更新完成'}：{count} 张图片；原图未修改")
    return 0


if __name__ == "__main__":
    sys.exit(main())
