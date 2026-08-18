"""把纯绿幕生成图转成带透明通道的轻量 WebP 游戏素材。"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def remove_green_screen(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    other = np.maximum(red, blue)

    # 只抠明显高饱和绿，保留素材本身的青色轮廓光与桂花叶。
    dominance = green - other * 1.35
    strength = np.clip((dominance - 22.0) / 92.0, 0.0, 1.0)
    strength *= np.clip((green - 105.0) / 110.0, 0.0, 1.0)
    alpha = np.rint((1.0 - strength) * 255.0).astype(np.uint8)

    # 半透明边缘去绿溢色，避免贴到深色场景时出现荧光绿边。
    edge = (alpha > 0) & (alpha < 255)
    rgb[..., 1] = np.where(edge, np.minimum(green, other * 1.08 + 10.0), green)
    rgba = np.dstack((np.clip(rgb, 0, 255).astype(np.uint8), alpha))
    return Image.fromarray(rgba, "RGBA")


def align_sprite_grid(image: Image.Image, cols: int, rows: int, baseline: float) -> Image.Image:
    """把每格角色按脚底基线重新排齐，避免不同动作在游戏里上下漂。"""
    width, height = image.size
    aligned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    alpha_threshold = 32

    for row in range(rows):
        sy0 = round(row * height / rows)
        sy1 = round((row + 1) * height / rows)
        for col in range(cols):
            sx0 = round(col * width / cols)
            sx1 = round((col + 1) * width / cols)
            cell = image.crop((sx0, sy0, sx1, sy1))
            mask = cell.getchannel("A").point(lambda value: 255 if value > alpha_threshold else 0)
            bbox = mask.getbbox()
            if not bbox:
                continue
            target_x = round((cell.width - (bbox[2] - bbox[0])) / 2 - bbox[0])
            target_y = round(cell.height * baseline - bbox[3])
            aligned.alpha_composite(cell, (sx0 + target_x, sy0 + target_y))
    return aligned


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--quality", type=int, default=88)
    parser.add_argument("--opaque", action="store_true")
    parser.add_argument("--size", help="不透明背景输出尺寸，例如 1920x480")
    parser.add_argument("--crop-y", type=float, default=0.5)
    parser.add_argument("--grid", help="透明图集按脚底重新排齐，例如 4x3")
    parser.add_argument("--baseline", type=float, default=0.88)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as image:
        if args.opaque:
            result = image.convert("RGB")
            if args.size:
                width, height = (int(part) for part in args.size.lower().split("x", 1))
                source_w, source_h = result.size
                target_ratio = width / height
                if source_w / source_h > target_ratio:
                    crop_w = round(source_h * target_ratio)
                    left = (source_w - crop_w) // 2
                    result = result.crop((left, 0, left + crop_w, source_h))
                else:
                    crop_h = round(source_w / target_ratio)
                    top = round(max(0, min(source_h - crop_h, args.crop_y * source_h - crop_h / 2)))
                    result = result.crop((0, top, source_w, top + crop_h))
                result = result.resize((width, height), Image.Resampling.LANCZOS)
            result.save(args.output, "WEBP", quality=args.quality, method=6)
        else:
            result = remove_green_screen(image)
            if args.grid:
                cols, rows = (int(part) for part in args.grid.lower().split("x", 1))
                result = align_sprite_grid(result, cols, rows, args.baseline)
            result.save(args.output, "WEBP", quality=args.quality, method=6, exact=True)


if __name__ == "__main__":
    main()
