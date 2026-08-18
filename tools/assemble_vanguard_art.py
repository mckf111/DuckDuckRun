"""把本轮生成的绿幕图拼成标杆关 WebP 图集。"""
from pathlib import Path

from PIL import Image, ImageChops


def remove_green_screen(image):
    rgb = image.convert("RGB")
    r, g, b = rgb.split()
    # 高绿且明显压过红蓝 = 幕布；留给鸭子身上的浅青轮廓。
    dominance = ImageChops.subtract(g, ImageChops.lighter(r, b))
    mask = ImageChops.multiply(g.point(lambda v: 255 if v > 110 else 0), dominance.point(lambda v: 255 if v > 28 else 0))
    alpha = mask.point(lambda v: 0 if v else 255)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out

IMG = Path(r"C:\Users\wenhu\.grok\sessions\E%3A%5CAI%5CCode%5Cformal%5C%E5%8D%97%E4%BA%AC\01a01328-92b3-7ba2-b68b-6f3b164dc905\images")
OUT = Path(__file__).resolve().parents[1] / "assets" / "game"


def keyed(name):
    return remove_green_screen(Image.open(IMG / name))


def place_on_cell(src, cw, ch, baseline=0.90, max_fill=0.86):
    alpha = src.getchannel("A")
    bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bbox:
        return Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    crop = src.crop(bbox)
    scale = min((cw * max_fill) / crop.width, (ch * max_fill) / crop.height)
    nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - nw) // 2
    y = round(ch * baseline) - nh
    cell.alpha_composite(crop, (x, max(0, y)))
    return cell


def build_duck():
    # 4x3: 跑0-3 / 备用4 / 跳5 / 二段6 / 下落7 / 铲8 / 慌9 / 撞10 / 闲11
    frames = [
        "4.jpg", "13.jpg", "4.jpg", "12.jpg",
        "4.jpg", "6.jpg", "6.jpg", "11.jpg",
        "10.jpg", "8.jpg", "9.jpg", "4.jpg",
    ]
    cw, ch, cols, rows = 384, 512, 4, 3
    sheet = Image.new("RGBA", (cw * cols, ch * rows), (0, 0, 0, 0))
    for i, name in enumerate(frames):
        cell = place_on_cell(keyed(name), cw, ch)
        sheet.alpha_composite(cell, ((i % cols) * cw, (i // cols) * ch))
    dest = OUT / "duck-atlas.webp"
    sheet.save(dest, "WEBP", quality=90, method=6, exact=True)
    print("duck", dest, sheet.size)


def build_obstacles():
    src = keyed("5.jpg")
    w, h = src.size
    cuts = (0.0, 0.37, 0.68, 1.0)
    thirds = [src.crop((round(w * cuts[i]), 0, round(w * cuts[i + 1]), h)) for i in range(3)]
    cw, ch = 420, 480
    strip = Image.new("RGBA", (cw * 3, ch), (0, 0, 0, 0))
    for i, part in enumerate(thirds):
        strip.alpha_composite(place_on_cell(part, cw, ch, baseline=0.94, max_fill=0.92), (i * cw, 0))
    dest = OUT / "obstacles-crenel.webp"
    strip.save(dest, "WEBP", quality=90, method=6, exact=True)
    print("obstacles", dest, strip.size)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build_duck()
    build_obstacles()
