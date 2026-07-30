#!/usr/bin/env python3
"""兜底抓图:取维基百科条目头图(必定位精准),过授权检查后下载。

用法:  ./.venv/Scripts/python tools/fetch_pageimages.py
输出:  assets/img/src/<key>__9.jpg + 追加 assets/img/CREDITS.json
"""
import json, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "src"
CREDITS_PATH = ROOT / "assets" / "img" / "CREDITS.json"
UA = {"User-Agent": "JinlingDash/0.1 (non-commercial local indie game; python-urllib)"}

# key: (站点, 条目名, 缩图宽)
PAGES = {
    "bg_jiming":      ("zh", "鸡鸣寺", 1920),
    "bg_sunyard":     ("zh", "中山陵", 1920),
    "bg_observatory": ("zh", "中国科学院紫金山天文台", 1920),
    "it_tea":         ("zh", "雨花茶", 1024),
    "it_pot":         ("zh", "牛肉锅贴", 1024),
    "it_bean":        ("zh", "赤豆元宵", 1024),
    "it_cloud":       ("zh", "南京云锦", 1024),
    "it_gold":        ("zh", "金箔", 1024),
    "it_leaf":        ("zh", "二球悬铃木", 1024),
    "it_lamp":        ("zh", "秦淮灯彩", 1024),
    "it_cake":        ("zh", "梅花糕", 1024),
    "it_root":        ("zh", "糯米藕", 1024),
    "it_egg":         ("zh", "活珠子", 1024),
    "it_elephant":    ("zh", "明孝陵", 1024),
    "it_sakura":      ("zh", "鸡鸣寺路", 1024),
    "it_book":        ("zh", "先锋书店", 1024),
}

LICENSE_OK = re.compile(r"(cc0|cc[ -]by|cc[ -]by[ -]sa|public domain|pd\b)", re.I)


def http_get(url, timeout=60, binary=False):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read() if binary else json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(12 * (attempt + 1))
                continue
            raise


def api(site, params):
    params = {**params, "format": "json"}
    url = f"https://{site}.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
    time.sleep(1.2)
    return http_get(url, 30)


def commons_api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    time.sleep(1.2)
    return http_get(url, 30)


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def main():
    credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8")) if CREDITS_PATH.exists() else []
    for key, (site, title, thumbw) in PAGES.items():
        print(f"== {key}: {site}:{title}")
        d = api(site, {"action": "query", "prop": "pageimages", "titles": title,
                       "pithumbsize": str(thumbw), "redirects": "1"})
        pages = (d.get("query") or {}).get("pages") or {}
        p = next(iter(pages.values()), {})
        img_title = p.get("pageimage")
        if not img_title:
            print("   !! 条目无头图")
            continue
        # 到 Commons 查授权与高清缩图
        cd = commons_api({"action": "query", "titles": "File:" + img_title,
                          "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
                          "iiurlwidth": str(thumbw)})
        cpages = (cd.get("query") or {}).get("pages") or {}
        cp = next(iter(cpages.values()), {})
        ii = (cp.get("imageinfo") or [None])[0]
        if not ii:
            print(f"   !! 查不到 {img_title} 的 imageinfo")
            continue
        meta = ii.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        if not LICENSE_OK.search(lic):
            print(f"   !! 授权不符: {lic}")
            continue
        url = ii.get("thumburl") or ii.get("url")
        dest = SRC / f"{key}__9.jpg"
        blob = http_get(url, 90, binary=True)
        dest.write_bytes(blob)
        time.sleep(3)
        w = ii.get("thumbwidth") or ii.get("width", 0)
        h = ii.get("thumbheight") or ii.get("height", 0)
        print(f"   [9] File:{img_title} {w}x{h} {lic}")
        credits.append({
            "title": "File:" + img_title,
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(("File:" + img_title).replace(" ", "_")),
            "url": url, "width": w, "height": h, "license": lic,
            "author": strip_html((meta.get("Artist") or {}).get("value")) or "未知",
            "key": key, "file": dest.name,
        })
    CREDITS_PATH.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n候选共 {len(credits)} 张")


if __name__ == "__main__":
    main()
