import copy
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from update_catalog import update


class CoverTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = "game-covers/example/first.png"
        (self.root / self.path).parent.mkdir(parents=True)
        Image.new("RGB", (600, 540), "red").save(self.root / self.path)
        self.asset = {"path": self.path, "source": "https://example.com/cover.png"}
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
        Image.new("RGB", (400, 520), "blue").save(destination)
        self.metadata["assets"].append(asset)
        return asset

    def test_minimal_metadata_derives_identity_and_preserves_native_image(self):
        self.asset.update(title="另一款作品", game="wrong", category="wrong", edition="alternate", note="旧处理说明")
        self.save()
        before = (self.root / self.path).read_bytes()
        update(self.root)
        update(self.root, check=True)
        asset = self.read()["assets"][0]
        self.assertEqual((asset["title"], asset["category"], asset["game"]), ("首作", "example", "first"))
        self.assertEqual(asset["source"], self.asset["source"])
        self.assertEqual(self.read()["games"], self.metadata["games"])
        self.assertEqual((asset["width"], asset["height"]), (600, 540))
        self.assertTrue({"edition", "processing", "note", "cover"}.isdisjoint(asset))
        self.assertEqual(before, (self.root / self.path).read_bytes())
        with Image.open(self.root / asset["thumbnail"]) as thumbnail:
            self.assertEqual(thumbnail.size, (420, 378))

    def test_optional_identity_details_are_kept_without_release_history(self):
        self.asset["cover"] = {"platform": "Nintendo DS", "region": "North America", "version": "再版", "releaseType": "original", "publisher": "旧字段"}
        self.save()
        update(self.root)
        self.assertEqual(self.read()["assets"][0]["cover"], {"platform": "Nintendo DS", "region": "North America", "version": "再版"})
        self.assertEqual(self.read()["games"][0]["firstReleaseYear"], 2009)

    def test_sourced_synopsis_belongs_to_the_work_and_survives_generation(self):
        synopsis = {"text": "九人被困，必须解谜寻找出口。", "source": "https://example.com/official-story"}
        self.metadata["games"][0]["synopsis"] = synopsis
        self.add_cover("game-covers/example/extras/first/scan.png")
        self.save()
        update(self.root)
        update(self.root, check=True)
        catalog = self.read()
        self.assertEqual(catalog["games"][0]["synopsis"], synopsis)
        self.assertTrue(all("synopsis" not in asset for asset in catalog["assets"]))

    def test_synopsis_requires_text_and_a_safe_source_before_publication(self):
        for synopsis in [None, "简介", {"text": "简介"}, {"source": "https://example.com"},
                         {"text": " ", "source": "https://example.com"},
                         {"text": "简介", "source": "javascript:alert(1)"}]:
            with self.subTest(synopsis=synopsis):
                self.metadata["games"][0]["synopsis"] = synopsis
                self.save()
                with self.assertRaises(ValueError): update(self.root)
                self.assertFalse((self.root / "app/previews").exists())

    def test_rare_extra_cover_does_not_change_selected_work_or_first_year(self):
        self.add_cover("game-covers/example/extras/first/ps4-jp.png", cover={"version": "高清版（2017）"})
        self.save()
        update(self.root)
        self.assertEqual(self.read()["games"][0]["firstReleaseYear"], 2009)
        self.assertEqual(len(self.read()["assets"]), 2)
        self.assertTrue(all("edition" not in asset for asset in self.read()["assets"]))

    def test_distinct_remake_and_collection_are_independent_works(self):
        for game, title, year in [("remake", "首作重制版", 2023), ("bundle", "系列合集", 2017)]:
            self.metadata["games"].append({"series": "example", "id": game, "title": title, "firstReleaseYear": year})
            self.add_cover(f"game-covers/example/{game}.png")
        self.save()
        update(self.root)
        assets = {asset["game"]: asset for asset in self.read()["assets"]}
        self.assertEqual(set(assets), {"first", "remake", "bundle"})
        self.assertEqual(assets["first"]["title"], "首作")
        self.assertEqual(assets["bundle"]["title"], "系列合集")

    def test_duplicate_selected_jpeg_and_png_are_rejected(self):
        self.add_cover("game-covers/example/first.jpg")
        self.save()
        with self.assertRaisesRegex(ValueError, "一张默认封面"):
            update(self.root)

    def test_extra_requires_a_selected_image(self):
        self.add_cover("game-covers/example/extras/first/scan.png")
        (self.root / self.path).unlink()
        self.metadata["assets"].pop(0)
        self.save()
        with self.assertRaisesRegex(ValueError, "额外收藏须有对应"):
            update(self.root)

    def test_small_images_and_native_color_modes_are_not_rejected_or_upscaled(self):
        for mode, size in [("RGB", (150, 230)), ("RGBA", (400, 510)), ("L", (320, 270))]:
            with self.subTest(mode=mode, size=size):
                Image.new(mode, size).save(self.root / self.path)
                before = (self.root / self.path).read_bytes()
                update(self.root)
                asset = self.read()["assets"][0]
                self.assertEqual((asset["width"], asset["height"]), size)
                self.assertEqual(before, (self.root / self.path).read_bytes())
                with Image.open(self.root / asset["thumbnail"]) as preview:
                    self.assertEqual(preview.size, size)

    def test_actual_format_must_match_extension(self):
        Image.new("RGB", (600, 540)).save(self.root / self.path, "JPEG")
        with self.assertRaisesRegex(ValueError, "真实 JPEG 或 PNG"):
            update(self.root)

    def test_unknown_identity_and_invalid_required_or_optional_fields_fail(self):
        baseline = copy.deepcopy(self.metadata)
        cases = [
            ("game", "firstReleaseYear", "2009"), ("game", "firstReleaseYear", True),
            ("game", "series", "missing"), ("game", "id", "different"),
            ("cover", "region", ""), ("cover", "platform", ""), ("cover", "version", 2017),
            ("asset", "cover", []), ("asset", "source", "javascript:alert(1)"),
            ("asset", "source", "https://"), ("asset", "source", {"url": "https://example.com"})
        ]
        for section, field, value in cases:
            with self.subTest(section=section, field=field):
                self.metadata = copy.deepcopy(baseline)
                target = self.metadata["games"][0] if section == "game" else self.metadata["assets"][0]
                if section == "cover":
                    target["cover"] = {field: value}
                else:
                    target[field] = value
                self.save()
                with self.assertRaises(ValueError):
                    update(self.root)

    def test_historical_http_sources_are_allowed_and_obsolete_notes_removed(self):
        self.asset.update(source="http://example.com/archive/cover.png", note="已无需固定尺寸处理")
        self.save()
        update(self.root)
        asset = self.read()["assets"][0]
        self.assertEqual(asset["source"], self.asset["source"])
        self.assertNotIn("note", asset)

    def test_image_replacement_refreshes_hash_and_preview(self):
        update(self.root)
        old = self.read()["assets"][0]
        Image.new("RGB", (800, 1100), "blue").save(self.root / self.path)
        update(self.root)
        new = self.read()["assets"][0]
        self.assertNotEqual(new["sha"], old["sha"])
        self.assertNotEqual(new["thumbnail"], old["thumbnail"])
        self.assertEqual((new["width"], new["height"]), (800, 1100))
