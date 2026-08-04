#!/usr/bin/env python3
"""把 assets/img/src/ 里的候选原片处理成游戏正式素材。

用法:  ./.venv/Scripts/python tools/process_assets.py
输入:  assets/img/src/<key>__<n>.jpg + 下方 PICK 选定候选
输出:  assets/img/<key>.jpg(背景 1920x480 / 风物 512x512)+ assets/img/CREDITS.md
"""
import json, random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "src"
OUT = ROOT / "assets" / "img"

# 看图后选定每个 key 用第几张候选(序号对应 <key>__<n>.jpg)
PICK = {
    "bg_zhonghua": 2, "bg_jiming": 9, "bg_sunyard": 9,
    "bg_zhaobi": 1, "bg_observatory": 9, "bg_bridge": 2,
    "bg_menu": 1, "bg_yihe": 2, "bg_mendong": 2, "bg_qixia": 1, "bg_baoen": 1,
    "it_duck": 2, "it_fans": 1,
    "it_taro": 1, "it_plum": 1, "it_stone": 2,
    "it_tea": 2,        # 雨花茶无本尊 CC 照片,用茶园实景(打开思路后的替代)
    "it_pot": 1, "it_bean": 2, "it_cloud": 1, "it_gold": 2,
    "it_leaf": 2, "it_lamp": 1,
    "it_cake": 1, "it_root": 9, "it_egg": 9,
    "it_elephant": 3, "it_sakura": 1, "it_book": 2,
}

# 每关调色:warm(色温,-100~100)/ bright / contrast / sat;crop_y 为横幅裁剪中心(0=上,0.5=中,1=下)
# tint=(r,g,b,alpha) 叠加色罩,用于夜景化等强风格(如天文台日转夜)
GRADE = {
    "bg_zhonghua":    dict(warm=14, bright=1.02, contrast=1.02, sat=1.05, crop_y=0.46),
    "bg_jiming":      dict(warm=2,  bright=1.00, contrast=0.98, sat=1.02, crop_y=0.28),
    "bg_sunyard":     dict(warm=-6, bright=1.03, contrast=0.98, sat=0.98, crop_y=0.38),
    "bg_zhaobi":      dict(warm=12, bright=1.00, contrast=1.00, sat=1.08, crop_y=0.42),
    # 紫金山关是夜奔主题(路面/天空深紫):白天原片压暗 + 蓝紫色罩,调成黄昏入夜
    "bg_observatory": dict(warm=-22, bright=0.52, contrast=1.06, sat=0.72, crop_y=0.48, tint=(58,42,110,0.38)),
    "bg_bridge":      dict(warm=6,  bright=1.00, contrast=1.00, sat=1.00, crop_y=0.50),
    "bg_menu":        dict(warm=2,  bright=1.03, contrast=1.03, sat=1.06, crop_y=0.55),  # 南京眼:环脚+桥面+江面,裁掉前景摊位
    "bg_yihe":        dict(warm=8,  bright=1.01, contrast=1.02, sat=1.06, crop_y=0.45),  # 黄墙瓦顶+远处高楼
    "bg_mendong":     dict(warm=6,  bright=1.02, contrast=1.02, sat=1.08, crop_y=0.30),  # 牌幌灯笼屋面,裁掉街道人群
    "bg_qixia":       dict(warm=10, bright=1.01, contrast=1.02, sat=1.12, crop_y=0.50),  # 枫叶+白石桥
    "bg_baoen":       dict(warm=2,  bright=1.01, contrast=1.02, sat=1.06, crop_y=0.42),  # 塔身+金墙+天空
    "it_duck":  dict(warm=8, bright=1.02, contrast=1.05, sat=1.10),
    "it_fans":  dict(warm=8, bright=1.02, contrast=1.05, sat=1.10),
    "it_tea":   dict(warm=2, bright=1.02, contrast=1.03, sat=1.06),
    "it_taro":  dict(warm=8, bright=1.02, contrast=1.05, sat=1.08),
    "it_plum":  dict(warm=4, bright=1.02, contrast=1.03, sat=1.06),
    "it_stone": dict(warm=4, bright=1.02, contrast=1.05, sat=1.08),
    "it_pot":  dict(warm=8, bright=1.02, contrast=1.05, sat=1.10),
    "it_bean": dict(warm=8, bright=1.02, contrast=1.04, sat=1.08),
    "it_cloud": dict(warm=4, bright=1.02, contrast=1.04, sat=1.08),
    "it_gold": dict(warm=4, bright=1.02, contrast=1.04, sat=1.06),
    "it_leaf": dict(warm=4, bright=1.02, contrast=1.03, sat=1.04),
    "it_lamp": dict(warm=6, bright=1.03, contrast=1.04, sat=1.10),
    "it_cake": dict(warm=6, bright=1.02, contrast=1.04, sat=1.08),
    "it_root": dict(warm=6, bright=1.02, contrast=1.04, sat=1.06),
    "it_egg":  dict(warm=6, bright=1.03, contrast=1.04, sat=1.05),
    "it_elephant": dict(warm=6, bright=1.02, contrast=1.03, sat=1.06),
    "it_sakura": dict(warm=2, bright=1.02, contrast=1.02, sat=1.05),
    "it_book": dict(warm=2, bright=1.02, contrast=1.02, sat=1.02),
}

BG_SIZE = (1920, 480)
IT_SIZE = (512, 512)


def grade(im, g):
    """色温/亮度/对比/饱和 (+可选色罩 tint)。"""
    if g.get("warm"):
        w = g["warm"] / 100.0
        r, gr, b = im.split()[:3]
        r = r.point(lambda v: max(0, min(255, v * (1 + 0.35 * w))))
        b = b.point(lambda v: max(0, min(255, v * (1 - 0.35 * w))))
        im = Image.merge("RGB", (r, gr, b))
    if g.get("bright", 1) != 1:
        im = ImageEnhance.Brightness(im).enhance(g["bright"])
    if g.get("contrast", 1) != 1:
        im = ImageEnhance.Contrast(im).enhance(g["contrast"])
    if g.get("sat", 1) != 1:
        im = ImageEnhance.Color(im).enhance(g["sat"])
    if g.get("tint"):
        tr, tg, tb, ta = g["tint"]
        overlay = Image.new("RGB", im.size, (tr, tg, tb))
        im = Image.blend(im, overlay, ta)
    return im


def grain(im, sigma=6, alpha=0.05):
    noise = Image.effect_noise(im.size, sigma).convert("L")
    return Image.blend(im, Image.merge("RGB", (noise, noise, noise)), alpha)


def vignette(im, strength=0.22):
    mask = Image.radial_gradient("L").resize(im.size)          # 中心 0 → 边缘 255
    dark = Image.new("RGB", im.size, (8, 6, 12))
    return Image.composite(dark, im, mask.point(lambda v: int(v * strength * 2) // 2 * 2 if False else int(v * strength)))


def crop_banner(im, ratio, cy):
    w, h = im.size
    ch = min(h, int(w / ratio))
    top = int(max(0, min(h - ch, cy * h - ch / 2)))
    return im.crop((0, top, w, top + ch))


def crop_square(im):
    w, h = im.size
    s = min(w, h)
    return im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))


def main():
    credits = json.loads((OUT / "CREDITS.json").read_text(encoding="utf-8"))
    used = []
    for key, n in PICK.items():
        src = SRC / f"{key}__{n}.jpg"
        if not src.exists():
            print(f"!! 缺候选 {src.name},跳过")
            continue
        im = Image.open(src).convert("RGB")
        g = GRADE.get(key, {})
        if key.startswith("bg_"):
            im = crop_banner(im, BG_SIZE[0] / BG_SIZE[1], g.get("crop_y", 0.55))
            im = im.resize(BG_SIZE, Image.LANCZOS)
            im = vignette(grade(im, g), 0.20)
            im = grain(im, 7, 0.05)
            q = 82
        else:
            im = crop_square(im).resize(IT_SIZE, Image.LANCZOS)
            im = grade(im, g)
            im = grain(im, 5, 0.03)
            q = 85
        dest = OUT / f"{key}.jpg"
        im.save(dest, "JPEG", quality=q, optimize=True)
        if key.startswith("bg_"):
            # 运行时优先 WebP，失败再回退同名 JPEG。
            im.save(OUT / f"{key}.webp", "WEBP", quality=78, method=6)
        kb = dest.stat().st_size // 1024
        print(f"{dest.name}  {im.size[0]}x{im.size[1]}  {kb}KB")
        c = next((c for c in credits if c["file"] == src.name), None)
        if c:
            used.append(c)
    # CREDITS.md(只列正式采用的图)
    lines = ["# 实景照片署名(CREDITS)", "",
             "游戏内实景照片来自 Wikimedia Commons 与 Openverse 聚合的 CC 图床,按各自授权使用。", ""]
    for c in used:
        lines.append(f"- `{c['key']}` — [{c['title']}]({c['page']}),作者:{c['author']},授权:{c['license']}")
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nCREDITS.md 已生成({len(used)} 张)")


if __name__ == "__main__":
    main()
