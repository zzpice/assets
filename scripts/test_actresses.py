import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from actresses import directory
from actress_sources import fetch_annual, parse_ranking, ranking_url, SERIES
from update_catalog import update


class ActressTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "actresses/portraits").mkdir(parents=True)
        self.people = []
        for index in range(1, 101):
            pid = f"p{index:04d}"
            path = f"actresses/portraits/{pid}.jpg"
            Image.new("RGB", (24, 32), (index, index * 2, index // 2)).save(self.root / path, quality=100)
            self.people.append({"id": pid, "name": f"人物{index}", "aliases": [], "identities": {"fanza": [str(index)]}, "nameSource": "https://example.test/person",
                                "portrait": {"path": path, "reviewed": "2026-01-01", "source": {"provider": "Example", "url": "https://example.test/image.jpg", "sha256": hashlib.sha256((self.root / path).read_bytes()).hexdigest(), "retrieved": "2026-01-01"}}})
        self.data = {"version": 1, "redirects": {}, "people": self.people}
        self.snapshot = {"series": SERIES, "year": 2023, "retrieved": "2026-01-01", "pages": [{"url": ranking_url(2023, page), "sha256": "a" * 64} for page in range(1, 6)],
                         "rows": [{"rank": index, "sourceId": str(index), "name": f"人物{index}", "profile": f"https://www.dmm.co.jp/rental/-/list/=/article=actress/id={index}/", "portrait": "https://pics.dmm.co.jp/mono/actjpgs/example.jpg"} for index in range(1, 101)]}
        self.write()

    def write(self):
        (self.root / "actresses/data.json").write_text(json.dumps(self.data), encoding="utf-8")
        (self.root / "actresses/rankings").mkdir(exist_ok=True)
        (self.root / "actresses/rankings/2023.json").write_text(json.dumps(self.snapshot), encoding="utf-8")

    def test_one_identity_can_have_names_years_and_hall_membership_without_extra_photo(self):
        self.people[0].update(name="新艺名", aliases=[{"name": "人物1", "source": "https://example.test/rename"}], hallOfFame={"reason": "Historical selection", "sources": ["https://example.test/history"], "reviewed": "2026-01-01"})
        self.people[0]["identities"]["fanza"].append("10001")
        self.write()
        next_year = copy.deepcopy(self.snapshot)
        next_year["year"] = 2024
        for page, record in enumerate(next_year["pages"], 1): record["url"] = ranking_url(2024, page)
        next_year["rows"][0].update(sourceId="10001", name="新艺名", profile="https://www.dmm.co.jp/rental/-/list/=/article=actress/id=10001/")
        (self.root / "actresses/rankings/2024.json").write_text(json.dumps(next_year), encoding="utf-8")
        self.assertEqual(update(self.root), 100)
        catalog = json.loads((self.root / "catalog.json").read_text("utf-8"))
        self.assertEqual([ranking["entries"][0]["person"] for ranking in catalog["actresses"]["rankings"]], ["p0001", "p0001"])
        self.assertEqual(len([item for item in catalog["assets"] if item["person"] == "p0001"]), 1)
        self.assertTrue(catalog["actresses"]["people"][0]["hallOfFame"])
        update(self.root, check=True)

    def test_unknown_identity_and_unreviewed_rename_stop_generation_without_writes(self):
        for changes, message in [({"sourceId": "99999"}, "unmapped source identity"), ({"name": "未经确认"}, "unreviewed source name")]:
            with self.subTest(changes=changes):
                before = self.snapshot["rows"][0].copy()
                self.snapshot["rows"][0].update(changes); self.write()
                with self.assertRaisesRegex(ValueError, message): update(self.root)
                self.assertFalse((self.root / "catalog.json").exists())
                self.snapshot["rows"][0] = before

    def test_duplicate_person_source_photo_and_orphan_image_are_rejected(self):
        initial = copy.deepcopy(self.data)
        mutations = [
            (lambda: self.people[1].update(id="p0001"), "IDs must be unique"),
            (lambda: self.people[1].update(identities={"fanza": ["1"]}), "duplicate or invalid"),
            (lambda: self.people[1].update(name="人物1"), "duplicate primary name"),
            (lambda: self.people[1]["portrait"].pop("reviewed"), "portrait.reviewed"),
            (lambda: self.people[1]["portrait"]["source"].update(provider="Gfriends", revision="a" * 40, path="Content/photo.jpg", url="https://example.test/image.jpg"), "pinned commit"),
        ]
        for mutate, message in mutations:
            mutate(); self.write()
            with self.assertRaisesRegex(ValueError, message): directory(self.root)
            self.data = copy.deepcopy(initial); self.people = self.data["people"]
        self.write()
        orphan = self.root / "actresses/portraits/orphan.jpg"
        orphan.write_bytes(b"unregistered")
        with self.assertRaisesRegex(ValueError, "Every portrait"): directory(self.root)
        orphan.unlink()
        source = self.root / self.people[0]["portrait"]["path"]
        target = self.root / self.people[1]["portrait"]["path"]
        target.write_bytes(source.read_bytes())
        self.people[1]["portrait"]["source"]["sha256"] = self.people[0]["portrait"]["source"]["sha256"]
        self.write()
        with self.assertRaisesRegex(ValueError, "identical photo"): directory(self.root)
        target.write_bytes(b"unreviewed replacement")
        with self.assertRaisesRegex(ValueError, "changed portrait"): directory(self.root)

    def test_merge_redirect_preserves_old_links_and_cannot_reassign_id(self):
        update(self.root)
        self.people[0]["id"] = "p9999"
        old = self.root / self.people[0]["portrait"]["path"]
        old.rename(old.with_name("p9999.jpg"))
        self.people[0]["portrait"]["path"] = "actresses/portraits/p9999.jpg"
        self.write()
        with self.assertRaisesRegex(ValueError, "stable ID changed"): directory(self.root)
        self.data["redirects"] = {"p0001": "p9999"}; self.write()
        compiled, _ = directory(self.root)
        self.assertEqual(compiled["rankings"][0]["entries"][0]["person"], "p9999")
        self.data["redirects"]["p9999"] = "p0001"; self.write()
        with self.assertRaisesRegex(ValueError, "without chains or cycles"): directory(self.root)

    def test_missing_page_rank_and_incompatible_scope_never_publish(self):
        initial = copy.deepcopy(self.snapshot)
        for field, value, message in [("pages", self.snapshot["pages"][:4], "all five"), ("rows", self.snapshot["rows"][:99], "without gaps"), ("series", "video-sales", "incompatible")]:
            self.snapshot[field] = value; self.write()
            with self.assertRaisesRegex(ValueError, message): update(self.root)
            self.snapshot = copy.deepcopy(initial)

    def test_source_parser_ignores_products_and_detects_gate_or_missing_rank(self):
        cells = "".join(f'<td class=""><span class="rank">{rank}</span><img src="https://pics.dmm.co.jp/mono/actjpgs/example.jpg"><a href="https://www.dmm.co.jp/rental/-/list/=/article=actress/id={rank}/">人物{rank}</a><a href="https://example.test/product">Do not import product descriptions</a></td>' for rank in range(1, 21))
        page = ("2023年 年間 AV女優ランキング" + cells).encode()
        rows = parse_ranking(page, 2023, 1)
        self.assertEqual(len(rows), 20)
        self.assertNotIn("product", json.dumps(rows))
        with self.assertRaisesRegex(ValueError, "missing annual heading"): parse_ranking(b"not available in your region", 2023, 1)
        with self.assertRaisesRegex(ValueError, "exactly 20"): parse_ranking(page.replace(b'<span class="rank">20</span>', b""), 2023, 1)
        with patch("actress_sources.download", return_value=b"not available"):
            output = self.root / "review"
            with self.assertRaises(ValueError): fetch_annual(2023, output)
            self.assertFalse(output.exists())


if __name__ == "__main__": unittest.main()
