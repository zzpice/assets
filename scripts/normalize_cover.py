#!/usr/bin/env python3
"""Adapt a verified release cover with proportional resize and manual crop or padding."""

import argparse
import json
from pathlib import Path
import re

from PIL import Image, ImageOps


def normalize(input_path, output_path, *, mode, crop=None, background="#ffffff"):
    input_path, output_path = Path(input_path), Path(output_path)
    if output_path.exists() or input_path.resolve() == output_path.resolve():
        raise ValueError("输出文件已存在；请使用新名称，不覆盖封面或源文件")
    if output_path.suffix not in {".jpg", ".png"}:
        raise ValueError("输出须为 .jpg 或 .png")
    if mode not in {"crop", "contain"} or not re.fullmatch(r"#[0-9a-fA-F]{6}", background):
        raise ValueError("须明确选择 crop/contain 和 #RRGGBB 背景色")
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
    resized = image.crop(crop).resize((round(cw * scale), round(ch * scale)), Image.Resampling.LANCZOS)
    result = Image.new("RGB", (1000, 1500), background)
    result.paste(resized, ((1000 - resized.width) // 2, (1500 - resized.height) // 2), resized)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.suffix == ".jpg":
        result.save(output_path, "JPEG", quality=95, subsampling=0, optimize=True)
    else:
        result.save(output_path, "PNG", optimize=True)
    adaptation = "" if resized.size == (1000, 1500) else "、纯色留边"
    cropped = "、人工裁切" if crop != [0, 0, width, height] else ""
    return {
        "note": f"源图 {width}×{height}，等比{'放大' if scale > 1 else '缩小' if scale < 1 else '保留尺寸'}{cropped}{adaptation}。",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--mode", choices=("crop", "contain"), required=True)
    parser.add_argument("--crop", nargs=4, type=int, metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"))
    parser.add_argument("--background", default="#ffffff")
    args = parser.parse_args()
    try:
        report = normalize(args.input, args.output, mode=args.mode, crop=args.crop, background=args.background)
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
