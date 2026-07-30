#!/usr/bin/env python3
"""第三源抓图:Openverse(聚合 Flickr 等 CC 图床,api.openverse.org 免 key)。

用法:  ./.venv/Scripts/python tools/fetch_openverse.py [key ...]
输出:  assets/img/src/<key>__<n>.jpg + 追加 assets/img/CREDITS.json
仅取可改作授权(cc0 / cc-by / cc-by-sa / pdm;排除 ND),仅对候选不足的 key 补抓。
"""
import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "src"
SRC.mkdir(parents=True, exist_ok=True)
CREDITS_PATH = ROOT / "assets" / "img" / "CREDITS.json"

UA = {"User-Agent": "JinlingDash/0.1 (non-commercial local indie game; python-urllib)"}

# key: (搜索词, 每词最多收几张)
QUERIES = {
    "it_tea":   ("tea plantation", 2),
    "it_pot":   ("beef potstickers Nanjing", 2),
    "it_bean":  ("red bean tangyuan", 2),
    "it_cloud": ("Nanjing brocade", 2),
    "it_gold":  ("gold leaf sheets", 2),
    "it_leaf":  ("London plane tree leaves autumn", 2),
    "it_lamp":  ("Qinhuai lantern festival", 2),
    "it_cake":  ("plum blossom cake", 2),
    "it_root":  ("sticky rice lotus root", 2),
    "it_egg":   ("balut egg", 2),
    "it_elephant": ("Stone Elephant Road Nanjing", 2),
    "it_sakura": ("Nanjing cherry blossom", 2),
    "it_book":  ("Librairie Avant-Garde", 2),
}
WANT = 3          # 每个 key 候选总数达到即跳过
LICENSES = "cc0,by,by-sa,pdm"
MIN_SIDE = 512    # 方卡裁 512x512,短边不能更小


def http_get(url, timeout=60, binary=False):
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


def lic_name(lic, ver):
    lic = (lic or "").lower()
    if lic == "cc0":
        return "CC0"
    if lic == "pdm":
        return "Public Domain Mark"
    return f"CC {lic.upper().replace('-', ' ')} {ver or ''}".strip()


def main():
    only = sys.argv[1:] or None
    credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8")) if CREDITS_PATH.exists() else []
    done_files = {c["file"] for c in credits}
    for key, (term, per) in QUERIES.items():
        if only and key not in only:
            continue
        have = sum(1 for c in credits if c["key"] == key)
        if have >= WANT and not only:
            print(f"== {key}: 已有 {have} 张,跳过")
            continue
        print(f"== {key}: {term}")
        q = urllib.parse.urlencode({
            "q": term, "license": LICENSES, "license_type": "commercial",
            "page_size": "20",
            "fields": "title,url,foreign_landing_url,license,license_version,creator,width,height",
        })
        try:
            data = http_get(f"https://api.openverse.org/v1/images/?{q}", timeout=30)
        except Exception as e:
            print(f"   搜索失败: {e}")
            continue
        time.sleep(2)                       # 匿名限额 ~20/min,礼貌延时
        got = have
        for r in (data or {}).get("results") or []:
            if got >= WANT:
                break
            w, h = r.get("width") or 0, r.get("height") or 0
            if min(w, h) < MIN_SIDE:
                continue
            dest = SRC / f"{key}__{got+1}.jpg"
            if dest.name in done_files or dest.exists():
                got += 1
                continue
            try:
                blob = http_get(r["url"], timeout=90, binary=True)
                if not blob or len(blob) < 30 * 1024:    # 太小的图/占位图不收
                    continue
                dest.write_bytes(blob)
                time.sleep(2)
            except Exception as e:
                print(f"   下载失败 {r.get('title')}: {e}")
                continue
            lic = lic_name(r.get("license"), r.get("license_version"))
            print(f"   [{got+1}] {r.get('title')} {w}x{h} {lic}")
            credits.append({
                "title": r.get("title") or dest.name,
                "page": r.get("foreign_landing_url") or r["url"],
                "url": r["url"], "width": w, "height": h, "license": lic,
                "author": r.get("creator") or "未知",
                "key": key, "file": dest.name,
            })
            got += 1
        if got == have:
            print("   !! 无合格候选,需要换搜索词")
    CREDITS_PATH.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n候选共 {len(credits)} 张 → assets/img/src/;授权 → assets/img/CREDITS.json")


if __name__ == "__main__":
    main()
