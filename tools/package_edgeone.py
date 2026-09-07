"""把已验证的正式 dist 制品原样打成 EdgeOne 直接上传包；不重新构建。"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]


def validate_artifact(artifact: Path):
    artifact = artifact.resolve()
    info_bytes = (artifact / "build-info.json").read_bytes()
    info = json.loads(info_bytes)
    assert info.get("distribution") == "production", "只接受正式制品"
    assert info.get("pendingAssetReviews") == 0, "素材发布审核尚未完成"
    build_id = info.get("buildId", "")
    assert re.fullmatch(r"[0-9a-f]{12}", build_id), "构建 ID 无效"
    assert info.get("publicSiteUrl") == "https://jinlingrun.caowenhu.com", "正式入口与已选域名不一致"
    assert info.get("publicBasePath") == "", "正式入口应在域名根目录"
    prefix = f"releases/{build_id}/"
    assert info.get("releasePath") == prefix, "版本路径错误"
    assert (artifact / prefix / "build-info.json").read_bytes() == info_bytes, "根与版本清单不一致"
    assert prefix in (artifact / "index.html").read_text(encoding="utf-8"), "根入口没有指向该版本"
    config = json.loads((artifact / "edgeone.json").read_text(encoding="utf-8"))
    assert set(config) <= {"headers", "redirects", "rewrites"}, "直接上传包含不支持的配置"
    expected = {"index.html", "build-info.json", "edgeone.json", prefix + "build-info.json"}
    expected.update(prefix + name for name in info["files"])
    actual = {p.relative_to(artifact).as_posix() for p in artifact.rglob("*") if p.is_file()}
    assert actual == expected, f"制品文件集合不匹配：{actual ^ expected}"
    for name in actual:
        path = artifact / name
        assert path.resolve().is_relative_to(artifact) and not path.is_symlink(), "制品包含越界路径或链接"
    return info, {name: artifact / name for name in actual}


def package(artifact: Path, output: Path, commit: str, retain_artifacts=()):
    assert re.fullmatch(r"[0-9a-f]{40}", commit), "须提供生成该制品的完整 Git 提交 SHA"
    info, sources = validate_artifact(artifact)
    build_id = info["buildId"]
    retained = []
    for old in retain_artifacts:
        old_info, old_sources = validate_artifact(old)
        old_id = old_info["buildId"]
        assert old_id != build_id and old_id not in retained, "保留版本重复或与新版相同"
        # 只增加旧版本目录，根入口、根清单与缓存配置始终来自新制品。
        sources.update({name: path for name, path in old_sources.items() if name.startswith(old_info["releasePath"])})
        retained.append(old_id)
    expected = set(sources)
    assert len(sources) <= 20000, "超出 EdgeOne 直接上传文件数量限制"
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f"jinlingrun-{build_id}.zip"
    with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        for name in sorted(sources):
            path = sources[name]
            data = path.read_bytes()
            assert len(data) <= 25 * 1024 * 1024, f"单文件过大：{name}"
            entry = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            bundle.writestr(entry, data)
    with ZipFile(archive) as bundle:
        assert set(bundle.namelist()) == expected and bundle.testzip() is None
        for name in expected:
            assert bundle.read(name) == sources[name].read_bytes(), f"压缩包字节不一致：{name}"
    receipt = {"buildId": build_id, "commit": commit, "site": "https://jinlingrun.caowenhu.com/",
               "retainedBuildIds": retained, "files": len(sources), "bytes": archive.stat().st_size,
               "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
               "scope": "packaging validation only; CI approval and online verification recorded separately"}
    archive.with_suffix(".json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(archive)
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact-dir", type=Path, default=ROOT / "dist")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "tools/e2e/shots/edgeone")
    parser.add_argument("--retain-artifact", type=Path, action="append", default=[], help="保留上一已验证正式制品的版本资源；不替换新根入口")
    parser.add_argument("--commit", required=True, help="必须对应通过验收的制品来源提交")
    args = parser.parse_args()
    package(args.artifact_dir, args.output_dir, args.commit, args.retain_artifact)
