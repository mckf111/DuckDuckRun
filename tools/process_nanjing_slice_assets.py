#!/usr/bin/env python3
"""将南京切片生成原图压缩为运行时 WebP；原始 PNG 仅作本地生成记录。"""
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "game" / "nanjing-slice"
SOURCE_DIR = Path(os.environ.get("NANJING_SLICE_SOURCE_DIR", ASSET_DIR))


def crop_transparent(image: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return rgba
    left, top, right, bottom = bbox
    pad = int(max(right - left, bottom - top) * pad_ratio)
    return rgba.crop((max(0, left - pad), max(0, top - pad), min(rgba.width, right + pad), min(rgba.height, bottom + pad)))


def square_webp(source: str, output: str, size: int) -> None:
    image = crop_transparent(Image.open(SOURCE_DIR / source))
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    canvas.save(ASSET_DIR / output, "WEBP", lossless=True, method=6)


def target_webp() -> None:
    image = Image.open(SOURCE_DIR / "nanjing-vertical-slice-target.png").convert("RGB")
    image.thumbnail((1280, 720), Image.Resampling.LANCZOS)
    image.save(ASSET_DIR / "nanjing-vertical-slice-target.webp", "WEBP", quality=82, method=6)


def main() -> None:
    target_webp()
    square_webp("salted-duck-token.png", "salted-duck-token.webp", 256)
    square_webp("qinhuai-lantern-marker.png", "qinhuai-lantern-marker.webp", 192)


if __name__ == "__main__":
    main()
