#!/usr/bin/env python3
"""生成游戏图标:简笔白胖鸭(深底圆角 + 白鸭 + 橙喙 + 桂花枝)。
产出 assets/icons/duck-512.png 与 duck-192.png(192 供 apple-touch-icon)。

用法: ./.venv/Scripts/python tools/make_icon.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "icons"
OUT.mkdir(parents=True, exist_ok=True)


def draw_duck(size: int) -> Image.Image:
    S = size
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 深色圆角底
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.18), fill="#0d0a14")
    d.rounded_rectangle([S * 0.05, S * 0.05, S * 0.95, S * 0.95],
                        radius=int(S * 0.14), outline="#3a2f1f", width=max(2, S // 110))
    # 桂花枝(在头顶)
    bx, by = S * 0.30, S * 0.24
    d.line([S * 0.30, S * 0.30, S * 0.38, S * 0.13], fill="#7ba05b", width=max(3, S // 40))
    for (ox, oy, rr) in [(0.40, 0.12, 0.05), (0.45, 0.18, 0.04), (0.35, 0.10, 0.04)]:
        d.ellipse([S * ox - rr * S, S * oy - rr * S, S * ox + rr * S, S * oy + rr * S], fill="#f0b64c")
    # 头
    hx, hy, hr = S * 0.42, S * 0.52, S * 0.17
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill="#f5f0e6")
    # 喙(右缘,3/4 视角)
    d.polygon([(hx + hr * 0.55, hy - hr * 0.18), (hx + hr * 1.55, hy), (hx + hr * 0.55, hy + hr * 0.18)], fill="#f08c1e")
    # 眼睛
    d.ellipse([hx + hr * 0.15, hy - hr * 0.5, hx + hr * 0.6, hy - hr * 0.08], fill="#1a1220")
    # 身体(梨形)
    d.ellipse([S * 0.16, S * 0.56, S * 0.68, S * 0.88], fill="#f5f0e6")
    # 腹影
    d.ellipse([S * 0.24, S * 0.66, S * 0.60, S * 0.86], fill="#e3d9c8")
    # 尾羽
    d.polygon([(S * 0.24, S * 0.62), (S * 0.10, S * 0.68), (S * 0.26, S * 0.72)], fill="#e3d9c8")
    # 脚蹼(两片橙)
    d.ellipse([S * 0.34, S * 0.87, S * 0.52, S * 0.95], fill="#f08c1e")
    d.ellipse([S * 0.55, S * 0.87, S * 0.72, S * 0.95], fill="#f08c1e")
    return img


for size in (512, 192):
    draw_duck(size).save(OUT / f"duck-{size}.png")
    print(f"OK {OUT / f'duck-{size}.png'}")
