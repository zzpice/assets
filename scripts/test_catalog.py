import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from update_catalog import infer_device, update


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.image = self.root / "wallpapers/anime/120x260/example.png"
        self.image.parent.mkdir(parents=True)
        Image.new("RGB", (120, 260), "navy").save(self.image)

    def catalog(self):
        return json.loads((self.root / "catalog.json").read_text("utf-8"))

    def test_update_is_repeatable_and_preserves_original(self):
        before = hashlib.sha256(self.image.read_bytes()).hexdigest()
        self.assertEqual(update(self.root), 1)
        self.assertEqual(update(self.root, check=True), 1)
        self.assertEqual(hashlib.sha256(self.image.read_bytes()).hexdigest(), before)
        self.assertEqual(self.catalog()["assets"][0]["height"], 260)

    def test_wrong_resolution_fails_before_writing(self):
        Image.new("RGB", (120, 240), "navy").save(self.image)
        with self.assertRaisesRegex(ValueError, "实际尺寸 120x240"):
            update(self.root)
        self.assertFalse((self.root / "catalog.json").exists())

    def test_replacement_keeps_title_and_removes_stale_note(self):
        update(self.root)
        catalog = self.catalog()
        catalog["assets"][0].update(title="中文标题", note="旧的处理说明")
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        old_preview = catalog["assets"][0]["thumbnail"]
        Image.new("RGB", (120, 260), "red").save(self.image)
        with self.assertRaises(ValueError):
            update(self.root, check=True)
        update(self.root)
        item = self.catalog()["assets"][0]
        self.assertEqual(item["title"], "中文标题")
        self.assertNotIn("note", item)
        self.assertNotEqual(item["thumbnail"], old_preview)
        self.assertFalse((self.root / old_preview).exists())

    def test_deleted_images_remove_metadata_and_previews(self):
        update(self.root)
        self.image.unlink()
        self.assertEqual(update(self.root), 0)
        self.assertEqual(list((self.root / "app/previews").glob("*.webp")), [])

    def test_corrupt_preview_is_rebuilt(self):
        update(self.root)
        thumbnail = self.root / self.catalog()["assets"][0]["thumbnail"]
        thumbnail.write_bytes(b"not an image")
        with self.assertRaises(ValueError):
            update(self.root, check=True)
        update(self.root)
        update(self.root, check=True)

    def test_symbols_and_vector_sizes(self):
        (self.root / "icons").mkdir()
        (self.root / "icons/mark.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"/>')
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item["path"].endswith(".svg"))
        self.assertEqual((item["width"], item["height"]), (40, 20))
        self.assertNotIn("thumbnail", item)

    def test_device_is_explicit_and_preserved(self):
        update(self.root)
        catalog = self.catalog()
        self.assertEqual(catalog["assets"][0]["device"], "unknown")
        catalog["assets"][0]["device"] = "tablet"
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        update(self.root)
        self.assertEqual(self.catalog()["assets"][0]["device"], "tablet")
        update(self.root, check=True)

    def test_invalid_device_fails(self):
        update(self.root)
        catalog = self.catalog()
        catalog["assets"][0]["device"] = "guess-from-ratio"
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "device 应为"):
            update(self.root)

    def test_common_devices_and_ambiguous_portrait(self):
        for size, expected in [((1440, 3120), "phone"), ((1080, 2400), "phone"), ((3840, 2160), "desktop"), ((3440, 1440), "desktop"), ((2048, 2732), "tablet"), ((2732, 2048), "tablet"), ((1080, 1920), "unknown"), ((1000, 1000), "unknown")]:
            with self.subTest(size=size):
                self.assertEqual(infer_device(*size), expected)

    def test_avatar_category_and_resolution(self):
        avatar = self.root / "avatars/anime/64x64/example.png"
        avatar.parent.mkdir(parents=True)
        Image.new("RGB", (64, 64), "red").save(avatar)
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item["kind"] == "avatar")
        self.assertEqual(item["category"], "anime")
        self.assertEqual((item["width"], item["height"]), (64, 64))
        self.assertNotIn("device", item)
        update(self.root, check=True)

    def test_avatar_resolution_mismatch(self):
        avatar = self.root / "avatars/anime/64x64/example.png"
        avatar.parent.mkdir(parents=True)
        Image.new("RGB", (64, 48), "red").save(avatar)
        with self.assertRaisesRegex(ValueError, "实际尺寸 64x48"):
            update(self.root)

    def test_changed_scripts_refresh_page_versions(self):
        script = self.root / "app/site.js"
        script.parent.mkdir(parents=True)
        script.write_text("const version = 1;")
        page = self.root / "index.html"
        page.write_text('<script src="app/site.js"></script>')
        update(self.root)
        previous = page.read_text()
        self.assertIn("?v=", previous)
        update(self.root, check=True)
        script.write_text("const version = 2;")
        with self.assertRaises(ValueError):
            update(self.root, check=True)
        update(self.root)
        self.assertNotEqual(page.read_text(), previous)
        self.assertEqual(page.read_text().count("?v="), 1)


if __name__ == "__main__":
    unittest.main()
