#!/usr/bin/env python3
"""从 Wikimedia Commons 抓取南京实景照片候选(仅 CC0/CC-BY/CC-BY-SA/PD)。

用法:  ./.venv/Scripts/python tools/fetch_assets.py [key ...]
输出:  assets/img/src/<key>__<n>.jpg   候选图(每题材最多 2 张)
        assets/img/CREDITS.json        每张候选的授权/作者/来源信息

注意:Commons 对批量抓取有限流,脚本已内置礼貌延时与 429 退避重试,全量跑约 3~5 分钟。
"""
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "src"
SRC.mkdir(parents=True, exist_ok=True)
CREDITS_PATH = ROOT / "assets" / "img" / "CREDITS.json"

UA = {"User-Agent": "JinlingDash/0.1 (non-commercial local indie game; python-urllib; respects robot policy)"}

# key: (搜索词, 缩图宽度, 候选数)
ASSETS = {
    "bg_zhonghua":    ("Zhonghua Gate Nanjing", 1920, 2),
    "bg_jiming":      ("Jiming Temple pagoda Nanjing", 1920, 2),
    "bg_sunyard":     ("Sun Yat-sen Mausoleum sacrificial hall", 1920, 2),
    "bg_zhaobi":      ("Qinhuai River Confucius Temple night", 1920, 2),
    "bg_observatory": ("Purple Mountain Observatory dome", 1920, 2),
    "bg_bridge":      ("Nanjing Yangtze River Bridge", 1920, 2),
    "bg_menu":        ("Nanjing Eye Hexi Nanjing", 1920, 4),
    "bg_yihe":        ("颐和路 南京", 1920, 3),
    "bg_mendong":     ("老门东", 1920, 3),
    "bg_qixia":       ("栖霞山 南京 秋", 1920, 3),
    "bg_baoen":       ("大报恩寺 琉璃塔", 1920, 3),
    "it_duck":        ("Nanjing salted duck", 1024, 2),
    "it_fans":        ("鸭血粉丝汤", 1024, 2),
    "it_tea":         ("茶园", 1024, 3),
    "it_taro":        ("糖芋苗", 1024, 2),
    "it_plum":        ("梅花山 南京", 1024, 2),
    "it_stone":       ("雨花石", 1024, 2),
    "it_pot":         ("牛肉锅贴", 1024, 3),
    "it_bean":        ("赤豆元宵", 1024, 3),
    "it_cloud":       ("南京云锦", 1024, 3),
    "it_gold":        ("金箔", 1024, 3),
    "it_leaf":        ("梧桐 南京", 1024, 3),
    "it_lamp":        ("秦淮花灯", 1024, 3),
    "it_cake":        ("梅花糕 南京", 1024, 3),
    "it_root":        ("糯米藕", 1024, 3),
    "it_egg":         ("活珠子", 1024, 3),
    "it_elephant":    ("石象路", 1024, 3),
    "it_sakura":      ("鸡鸣寺 樱花", 1024, 3),
    "it_book":        ("先锋书店 南京", 1024, 3),
}

LICENSE_OK = re.compile(r"(cc0|cc[ -]by|cc[ -]by[ -]sa|public domain|pd\b)", re.I)


def http_get(url, timeout=60, binary=False):
    """带 429 退避重试的请求。"""
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read() if binary else json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                wait = 12 * (attempt + 1)
                print(f"   (429 限流,等 {wait}s 重试)")
                time.sleep(wait)
                continue
            raise
    return None


def api(params):
    params = {**params, "format": "json"}
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    time.sleep(1.2)                      # API 礼貌延时
    return http_get(url, timeout=30)


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search_files(term, thumbw, limit=15):
    data = api({
        "action": "query", "generator": "search",
        "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": "6", "gsrlimit": str(limit),
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": str(thumbw),
    })
    pages = ((data or {}).get("query") or {}).get("pages") or {}
    out = []
    for p in sorted(pages.values(), key=lambda p: p.get("index", 99)):
        ii = (p.get("imageinfo") or [None])[0]
        if not ii or ii.get("mime") != "image/jpeg":
            continue
        meta = ii.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        if not LICENSE_OK.search(lic):
            continue
        out.append({
            "title": p.get("title"),
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(p.get("title", "").replace(" ", "_")),
            "url": ii.get("thumburl") or ii.get("url"),
            "width": ii.get("thumbwidth") or ii.get("width", 0),
            "height": ii.get("thumbheight") or ii.get("height", 0),
            "license": lic,
            "author": strip_html((meta.get("Artist") or {}).get("value")) or "未知",
        })
    return out


def main():
    only = sys.argv[1:] or None          # 可选:只抓指定 key
    credits = []
    if CREDITS_PATH.exists():
        credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8"))
    done_files = {c["file"] for c in credits}
    for key, (term, thumbw, n) in ASSETS.items():
        if only and key not in only:
            continue
        have = sum(1 for c in credits if c["key"] == key)
        if have >= n and not only:
            print(f"== {key}: 已有 {have} 张,跳过")
            continue
        if only and have:
            print(f"== {key}: 已有 {have} 张,按新词追加候选")
        print(f"== {key}: {term}")
        try:
            cands = search_files(term, thumbw)
        except Exception as e:
            print(f"   搜索失败: {e}")
            continue
        got = have
        for c in cands:
            if got >= n:
                break
            if c["width"] < thumbw * 0.98:
                continue
            if key.startswith("bg_") and c["width"] < c["height"]:
                continue                     # 背景只要横构图
            dest = SRC / f"{key}__{got+1}.jpg"
            if dest.name in done_files or dest.exists():
                got += 1
                continue
            try:
                blob = http_get(c["url"], timeout=90, binary=True)
                dest.write_bytes(blob)
                time.sleep(3.0)              # 下载礼貌延时
            except Exception as e:
                print(f"   下载失败 {c['title']}: {e}")
                continue
            print(f"   [{got+1}] {c['title']} {c['width']}x{c['height']} {c['license']}")
            credits.append({**c, "key": key, "file": dest.name})
            got += 1
        if got == 0:
            print("   !! 无合格候选,需要换搜索词")
    CREDITS_PATH.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n候选共 {len(credits)} 张 → assets/img/src/;授权 → assets/img/CREDITS.json")


if __name__ == "__main__":
    main()
