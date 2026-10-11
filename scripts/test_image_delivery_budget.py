"""Guard image delivery budgets without modifying or recompressing originals."""

import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
THUMBNAIL_LIMIT = 128 * 1024
BACKGROUND_LIMIT = 400 * 1024


class ImageDeliveryBudgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assets = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))["assets"]

    def test_preview_files_exist_and_are_small(self):
        for item in self.assets:
            for field, limit in (("thumbnail", THUMBNAIL_LIMIT), ("background", BACKGROUND_LIMIT)):
                relative = item.get(field)
                if not relative:
                    continue
                with self.subTest(path=item.get("path"), field=field):
                    self.assertTrue(relative.startswith("app/previews/") and relative.endswith(".webp"))
                    path = ROOT / relative
                    self.assertTrue(path.is_file(), f"Missing preview: {relative}")
                    self.assertLessEqual(path.stat().st_size, limit, f"Oversized preview: {relative}")


if __name__ == "__main__":
    unittest.main()
