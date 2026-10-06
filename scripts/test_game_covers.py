import copy
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from normalize_cover import normalize
from update_catalog import update


class CoverTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = "game-covers/example/first/nds-jp.png"
        (self.root / self.path).parent.mkdir(parents=True)
        Image.new("RGB", (1000, 1500), "red").save(self.root / self.path)
        self.asset = {"path": self.path, "edition": "main", "cover": {
            "platform": "Nintendo DS", "region": "Japan"
        }, "source": "https://example.com/cover.png"}
        self.metadata = {"gameSeries": [{"id": "example", "title": "示例系列"}], "games": [
            {"series": "example", "id": "first", "title": "首作", "firstReleaseYear": 2009}
        ], "assets": [self.asset]}
        self.save()

    def save(self):
        (self.root / "catalog.json").write_text(json.dumps(self.metadata), encoding="utf-8")

    def read(self):
        return json.loads((self.root / "catalog.json").read_text())

    def add_cover(self, path, **changes):
        asset = copy.deepcopy(self.asset)
        asset.update(path=path, **changes)
        destination = self.root / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes((self.root / self.path).read_bytes())
        self.metadata["assets"].append(asset)
        return asset

    def test_minimal_metadata_generates_work_identity_and_title(self):
        # An accidentally copied title/work key must not mix up two games.
        self.asset.update(title="另一款作品", game="wrong", category="wrong")
        self.save()
        before = (self.root / self.path).read_bytes()
        update(self.root)
        update(self.root, check=True)
        asset = self.read()["assets"][0]
        self.assertEqual((asset["title"], asset["category"], asset["game"]), ("首作", "example", "first"))
        for field in ("source", "edition", "cover"):
            self.assertEqual(asset[field], self.asset[field])
        self.assertEqual(self.read()["games"], self.metadata["games"])
        self.assertEqual((asset["width"], asset["height"]), (1000, 1500))
        self.assertNotIn("processing", asset)
        self.assertNotIn("note", asset)
        self.assertEqual(before, (self.root / self.path).read_bytes())

    def test_other_versions_keep_the_work_first_release(self):
        later = self.add_cover("game-covers/example/first/ps4-jp-remaster.png", edition="alternate")
        later["cover"].update(version="高清版（2017）", platform="PlayStation 4")
        self.save()
        update(self.root)
        self.assertEqual(self.read()["games"][0]["firstReleaseYear"], 2009)
        self.assertEqual({a["edition"] for a in self.read()["assets"]}, {"main", "alternate"})

    def test_remake_and_collection_can_each_have_their_own_main(self):
        for game, title, year in [("remake", "首作重制版", 2023), ("bundle", "系列合集", 2017)]:
            self.metadata["games"].append({"series": "example", "id": game, "title": title, "firstReleaseYear": year})
            self.add_cover(f"game-covers/example/{game}/ps4-jp.png")
        self.save()
        update(self.root)
        assets = {a["game"]: a for a in self.read()["assets"]}
        self.assertEqual(set(assets), {"first", "remake", "bundle"})
        self.assertTrue(all(a["edition"] == "main" for a in assets.values()))
        self.assertEqual(assets["first"]["title"], "首作")
        self.assertEqual(assets["bundle"]["title"], "系列合集")

    def test_two_mains_for_the_same_work_are_rejected(self):
        self.add_cover("game-covers/example/first/nds-na.png")
        self.save()
        with self.assertRaisesRegex(ValueError, "一个主封面"):
            update(self.root)

    def test_alternate_is_not_automatically_promoted(self):
        self.asset["edition"] = "alternate"
        self.save()
        update(self.root)
        self.assertEqual(self.read()["assets"][0]["edition"], "alternate")

    def test_exact_dimensions_rgb_and_actual_format_are_required(self):
        for mode, size, format in [("RGB", (1000, 1499), "PNG"), ("RGBA", (1000, 1500), "PNG"), ("RGB", (1000, 1500), "JPEG")]:
            with self.subTest(mode=mode, size=size, format=format):
                Image.new(mode, size).save(self.root / self.path, format)
                with self.assertRaisesRegex(ValueError, "1000×1500"):
                    update(self.root)

    def test_unknown_identity_and_invalid_core_fields_fail(self):
        baseline = copy.deepcopy(self.metadata)
        cases = [
            ("game", "firstReleaseYear", "2009"), ("game", "firstReleaseYear", True),
            ("game", "series", "missing"), ("game", "id", "different"),
            ("cover", "region", ""), ("cover", "platform", ""), ("cover", "version", 2017),
            ("asset", "edition", "remake"), ("asset", "source", "javascript:alert(1)"),
            ("asset", "source", "https://"), ("asset", "source", {"url": "https://example.com"})
        ]
        for section, field, value in cases:
            with self.subTest(section=section, field=field):
                self.metadata = copy.deepcopy(baseline)
                target = self.metadata["games"][0] if section == "game" else self.metadata["assets"][0]["cover"] if section == "cover" else self.metadata["assets"][0]
                target[field] = value
                self.save()
                with self.assertRaises(ValueError):
                    update(self.root)

    def test_historical_http_source_and_optional_note_are_allowed(self):
        self.asset.update(source="http://example.com/archive/cover.png", note="低分辨率历史扫描，等比放大。")
        self.save()
        update(self.root)
        self.assertEqual(self.read()["assets"][0]["note"], self.asset["note"])

    def test_changed_image_updates_generated_hash_and_drops_stale_note(self):
        self.asset["note"] = "旧图说明"
        self.save()
        update(self.root)
        old = self.read()["assets"][0]
        Image.new("RGB", (1000, 1500), "blue").save(self.root / self.path)
        update(self.root)
        new = self.read()["assets"][0]
        self.assertNotEqual(new["sha"], old["sha"])
        self.assertNotEqual(new["thumbnail"], old["thumbnail"])
        self.assertNotIn("note", new)


class NormalizationTests(unittest.TestCase):
    def test_contain_keeps_geometry_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "source.png", Path(temp) / "cover.png"
            Image.new("RGB", (1200, 1200), "red").save(source)
            before = source.read_bytes()
            report = normalize(source, output, mode="contain")
            with Image.open(output) as image:
                self.assertEqual((image.size, image.mode), ((1000, 1500), "RGB"))
                self.assertEqual(image.getpixel((500, 249)), (255, 255, 255))
                self.assertEqual(image.getpixel((500, 250)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1249)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1250)), (255, 255, 255))
            self.assertEqual(before, source.read_bytes())
            self.assertEqual(set(report), {"note"})
            with self.assertRaisesRegex(ValueError, "输出文件已存在"):
                normalize(source, output, mode="contain")

    def test_crop_requires_explicit_bounds_and_safe_ratio(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "source.png", Path(temp) / "cover.png"
            Image.new("RGB", (600, 900), "red").save(source)
            for crop, message in [(None, "显式提供"), ([0, 0, 600, 600], "2:3"), ([0, 0, 700, 900], "范围")]:
                with self.subTest(crop=crop), self.assertRaisesRegex(ValueError, message):
                    normalize(source, output, mode="crop", crop=crop)
            report = normalize(source, output, mode="crop", crop=[0, 0, 600, 900])
            self.assertIn("600×900，等比放大", report["note"])
            with Image.open(output) as image:
                self.assertEqual((image.size, image.mode), ((1000, 1500), "RGB"))

    def test_low_resolution_can_be_padded_without_stretching(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "source.png", Path(temp) / "cover.png"
            Image.new("RGBA", (400, 500), (255, 0, 0, 255)).save(source)
            report = normalize(source, output, mode="contain")
            self.assertIn("等比放大", report["note"])
            with Image.open(output) as image:
                self.assertEqual((image.size, image.mode), ((1000, 1500), "RGB"))
                self.assertEqual(image.getpixel((500, 124)), (255, 255, 255))
                self.assertEqual(image.getpixel((500, 125)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1374)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1375)), (255, 255, 255))
