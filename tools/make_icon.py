#!/usr/bin/env python3
"""从正式鸭子动作图生成应用图标，避免图标与局内角色长得像两个物种。"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ATLAS = ROOT / "assets" / "game" / "duck-atlas.webp"
OUT = ROOT / "assets" / "icons"
OUT.mkdir(parents=True, exist_ok=True)


def atlas_frame(index: int) -> Image.Image:
    atlas = Image.open(ATLAS).convert("RGBA")
    cols, rows = 4, 3
    col, row = index % cols, index // cols
    x0, x1 = round(col * atlas.width / cols), round((col + 1) * atlas.width / cols)
    y0, y1 = round(row * atlas.height / rows), round((row + 1) * atlas.height / rows)
    frame = atlas.crop((x0, y0, x1, y1))
    bbox = frame.getchannel("A").getbbox()
    return frame.crop(bbox) if bbox else frame


def make_icon(size: int) -> Image.Image:
    radius = round(size * 0.2)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)

    top = Image.new("RGB", (size, size), "#102843")
    bottom = Image.new("RGB", (size, size), "#07111f")
    gradient = Image.linear_gradient("L").resize((size, size))
    base = Image.composite(bottom, top, gradient).convert("RGBA")

    duck = atlas_frame(0)
    duck.thumbnail((round(size * 0.82), round(size * 0.78)), Image.Resampling.LANCZOS)
    x = (size - duck.width) // 2
    y = round(size * 0.53 - duck.height / 2)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((size * 0.17, size * 0.18, size * 0.83, size * 0.88), fill=(71, 173, 218, 86))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.08))
    base.alpha_composite(glow)
    base.alpha_composite(duck, (x, y))

    draw = ImageDraw.Draw(base)
    inset = max(4, round(size * 0.045))
    draw.rounded_rectangle(
        (inset, inset, size - inset - 1, size - inset - 1),
        radius=max(1, radius - inset),
        outline="#e7c367",
        width=max(2, round(size * 0.012)),
    )
    base.putalpha(mask)
    return base


for icon_size in (512, 192):
    path = OUT / f"duck-{icon_size}.png"
    make_icon(icon_size).save(path, optimize=True)
    print(f"OK {path}")
