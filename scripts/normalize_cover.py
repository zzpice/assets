#!/usr/bin/env python3
"""Manually adapt a verified official cover; never fetch, stretch, or invent artwork."""

import argparse
import hashlib
import json
from pathlib import Path
import re

from PIL import Image, ImageOps


def normalize(input_path, output_path, *, mode, crop=None, background="#ffffff", allow_upscale=False):
    input_path, output_path = Path(input_path), Path(output_path)
    if output_path.exists() or input_path.resolve() == output_path.resolve():
        raise ValueError("输出文件已存在；请使用新名称，不覆盖封面或源文件")
    if output_path.suffix not in {".jpg", ".png"}:
        raise ValueError("输出须为 .jpg 或 .png")
    if mode not in {"crop", "contain"} or not re.fullmatch(r"#[0-9a-fA-F]{6}", background):
        raise ValueError("须明确选择 crop/contain 和 #RRGGBB 背景色")
    source_data = input_path.read_bytes()
    with Image.open(input_path) as original:
        if getattr(original, "n_frames", 1) != 1:
            raise ValueError("只接受单帧封面")
        image = ImageOps.exif_transpose(original).convert("RGBA")
    width, height = image.size
    if mode == "crop" and crop is None:
        raise ValueError("crop 模式须显式提供人工确认的 --crop 左 上 右 下")
    crop = list(crop) if crop is not None else [0, 0, width, height]
    if len(crop) != 4 or any(type(v) is not int for v in crop) or not (0 <= crop[0] < crop[2] <= width and 0 <= crop[1] < crop[3] <= height):
        raise ValueError("裁切坐标超出原图范围")
    cw, ch = crop[2] - crop[0], crop[3] - crop[1]
    if mode == "crop" and cw * 3 != ch * 2:
        raise ValueError("crop 模式的裁切区域须为 2:3；其他比例请使用 contain 留边")
    scale = min(1000 / cw, 1500 / ch)
    if scale > 1 and not allow_upscale:
        raise ValueError("素材需要放大；先寻找更高质量来源，确认可用后显式添加 --allow-upscale")
    resized = image.crop(crop).resize((round(cw * scale), round(ch * scale)), Image.Resampling.LANCZOS)
    result = Image.new("RGB", (1000, 1500), background)
    result.paste(resized, ((1000 - resized.width) // 2, (1500 - resized.height) // 2), resized)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.suffix == ".jpg":
        result.save(output_path, "JPEG", quality=95, subsampling=0, optimize=True)
    else:
        result.save(output_path, "PNG", optimize=True)
    adaptation = "无留边适配为 1000×1500" if resized.size == (1000, 1500) else "纯色居中留边至 1000×1500"
    return {
        "source": {"width": width, "height": height, "sha256": hashlib.sha256(source_data).hexdigest()},
        "processing": {"mode": mode, "crop": crop, "background": background, "scale": round(scale, 6), "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest()},
        "note": f"官方源图 {width}×{height}；{'完整保留原图' if crop == [0, 0, width, height] else '按人工确认范围裁切'}；等比{'放大' if scale > 1 else '缩放'} {scale:.3f} 倍至 {resized.width}×{resized.height}，{adaptation}。未重绘或更改官方美术。",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--mode", choices=("crop", "contain"), required=True)
    parser.add_argument("--crop", nargs=4, type=int, metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"))
    parser.add_argument("--background", default="#ffffff")
    parser.add_argument("--allow-upscale", action="store_true")
    args = parser.parse_args()
    try:
        report = normalize(args.input, args.output, mode=args.mode, crop=args.crop, background=args.background, allow_upscale=args.allow_upscale)
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
