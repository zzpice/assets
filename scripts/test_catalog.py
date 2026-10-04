import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from update_catalog import update


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


if __name__ == "__main__":
    unittest.main()
