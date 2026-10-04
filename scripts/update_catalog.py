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
import xml.etree.ElementTree as ET

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"}


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
        same_source = old.get("sha") in {None, sha}
        image = None
        if relative.suffix == ".svg":
            width, height = svg_size(data)
        else:
            with Image.open(io.BytesIO(data)) as original:
                image = ImageOps.exif_transpose(original)
                image.load()
            width, height = image.size
        if path.startswith("wallpapers/"):
            match = re.fullmatch(r"wallpapers/([a-z0-9-]+)/(\d+)x(\d+)/[a-z0-9][a-z0-9-]*\.[a-z0-9]+", path)
            if not match:
                raise ValueError(f"{path}: 壁纸路径应为 wallpapers/<种类>/<宽>x<高>/<名称>.<格式>")
            if (int(match[2]), int(match[3])) != (width, height):
                raise ValueError(f"{path}: 目录尺寸与图片实际尺寸 {width}x{height} 不一致")
            kind, category = "wallpaper", match[1]
        else:
            kind = "avatar" if path == "avatar.png" or path.startswith("avatars/") else "other"
            category = None
        item = {"path": path, "title": old.get("title") or relative.stem.replace("-", " "), "kind": kind}
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
        if image is not None:
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
            image.close()
        item.update(size=len(data), sha=sha)
        assets.append(item)
    catalog = {"version": 1, "assets": assets}
    text = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    referenced = {item["thumbnail"] for item in assets if item.get("thumbnail")}
    stale = [path for path in (root / "app/previews").glob("*.webp") if path.relative_to(root).as_posix() not in referenced]
    return text, previews, stale


def update(root=ROOT, check=False):
    text, previews, stale = build_catalog(root)
    catalog = root / "catalog.json"
    changed = not catalog.exists() or catalog.read_text("utf-8") != text
    if check:
        if changed or previews or stale:
            raise ValueError("目录或预览需要更新，请运行 python3 scripts/update_catalog.py 后提交生成的文件")
    else:
        for path, data in previews.items():
            destination = root / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
        if changed:
            temporary = catalog.with_suffix(".json.tmp")
            temporary.write_text(text, encoding="utf-8")
            temporary.replace(catalog)
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
