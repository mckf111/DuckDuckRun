import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile
from tools.package_edgeone import package


class PackageTest(unittest.TestCase):
    def artifact(self, parent, build_id, production=True):
        root = parent / build_id
        release = root / "releases" / build_id
        release.mkdir(parents=True)
        info = {"distribution": "production" if production else "internal-preview",
                "pendingAssetReviews": 0, "buildId": build_id,
                "publicSiteUrl": "https://jinlingrun.caowenhu.com", "publicBasePath": "",
                "releasePath": f"releases/{build_id}/", "files": ["index.html", "picture.webp"]}
        raw = json.dumps(info)
        (root / "build-info.json").write_text(raw)
        (release / "build-info.json").write_text(raw)
        (root / "edgeone.json").write_text('{"headers": []}')
        (root / "index.html").write_text(info["releasePath"])
        (release / "index.html").write_text(build_id)
        (release / "picture.webp").write_bytes(build_id.encode())
        return root

    def test_retains_old_files_but_new_root_wins(self):
        with tempfile.TemporaryDirectory() as folder, contextlib.redirect_stdout(io.StringIO()):
            root = Path(folder)
            new = self.artifact(root, "a" * 12)
            old = self.artifact(root, "b" * 12)
            package(new, root / "out", "c" * 40, [old])
            with ZipFile(root / "out" / ("jinlingrun-" + "a" * 12 + ".zip")) as archive:
                self.assertEqual(len(archive.namelist()), 9)
                self.assertEqual(archive.read("index.html"), (new / "index.html").read_bytes())
                self.assertEqual(archive.read("build-info.json"), (new / "build-info.json").read_bytes())
                self.assertEqual(archive.read("releases/" + "b" * 12 + "/picture.webp"), b"b" * 12)

    def test_refuses_preview_or_extra_files_in_retained_artifact(self):
        with tempfile.TemporaryDirectory() as folder, contextlib.redirect_stdout(io.StringIO()):
            root = Path(folder)
            new = self.artifact(root, "a" * 12)
            preview = self.artifact(root, "b" * 12, False)
            with self.assertRaises(AssertionError):
                package(new, root / "out", "c" * 40, [preview])
            old = self.artifact(root, "d" * 12)
            (old / "private.txt").write_text("must not ship")
            with self.assertRaises(AssertionError):
                package(new, root / "out", "c" * 40, [old])


if __name__ == "__main__":
    unittest.main()
