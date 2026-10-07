import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from actresses import directory
from actress_sources import audit_portraits, fetch_annual, parse_ranking, ranking_url, SERIES
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

    def test_ai_restoration_requires_explicit_original_provenance(self):
        source = self.people[0]["portrait"]["source"]
        source.update(provider="Gfriends", revision="a" * 40, path="Content/example/AI-Fix-person.jpg",
                      url="https://raw.githubusercontent.com/gfriends/gfriends/" + "a" * 40 + "/Content/example/AI-Fix-person.jpg")
        self.write()
        with self.assertRaisesRegex(ValueError, "AI-Fix requires"): directory(self.root)
        source["restoration"] = {"method": "Upstream AI-Fix", "originalUrl": "https://example.test/original.jpg",
                                 "originalSha256": "b" * 64, "reviewed": "2026-01-01"}
        self.write(); directory(self.root)
        source["restoration"]["originalSha256"] = source["sha256"]
        self.write()
        with self.assertRaisesRegex(ValueError, "distinct original"): directory(self.root)

    def test_portrait_license_preserves_credit_and_rejects_incomplete_or_unsafe_terms(self):
        source = self.people[0]["portrait"]["source"]
        credit = {"name": "CC BY 3.0", "url": "https://creativecommons.org/licenses/by/3.0/", "author": "摄影者"}
        source["license"] = credit
        self.write()
        compiled, _ = directory(self.root)
        self.assertEqual(compiled["people"][0]["portrait"]["source"]["license"], credit)
        for license_info in [None, {"name": "CC BY 3.0"}, {**credit, "author": ""}, {**credit, "url": "javascript:alert(1)"}]:
            with self.subTest(license_info=license_info):
                source["license"] = license_info
                self.write()
                with self.assertRaises(ValueError): directory(self.root)

    def test_missing_page_rank_and_incompatible_scope_never_publish(self):
        initial = copy.deepcopy(self.snapshot)
        for field, value, message in [("pages", self.snapshot["pages"][:4], "all five"), ("rows", self.snapshot["rows"][:99], "without gaps"), ("series", "video-sales", "incompatible")]:
            self.snapshot[field] = value; self.write()
            with self.assertRaisesRegex(ValueError, message): update(self.root)
            self.snapshot = copy.deepcopy(initial)

    def test_reviewed_crop_changes_preview_content_and_keeps_original(self):
        path = self.root / self.people[0]["portrait"]["path"]
        image = Image.new("RGB", (80, 80), "red")
        image.paste("blue", (40, 0, 80, 80)); image.save(path)
        original = path.read_bytes()
        digest = hashlib.sha256(original).hexdigest()
        portrait = self.people[0]["portrait"]
        portrait["source"]["sha256"] = digest
        portrait["display"] = {"crop": [0, 0, 40, 50], "sourceSha256": digest, "reviewed": "2026-01-01"}
        self.write(); update(self.root)
        first = json.loads((self.root / "catalog.json").read_text())["assets"][0]
        self.assertEqual((first["width"], first["height"]), (80, 80))
        with Image.open(self.root / first["thumbnail"]) as preview:
            self.assertEqual(preview.size, (40, 50))
        portrait["display"]["crop"] = [40, 0, 40, 50]  # Same ratio, different pixels: must invalidate cache.
        self.write(); update(self.root)
        second = json.loads((self.root / "catalog.json").read_text())["assets"][0]
        self.assertNotEqual(first["thumbnail"], second["thumbnail"])
        self.assertFalse((self.root / first["thumbnail"]).exists())
        self.assertEqual(path.read_bytes(), original)
        portrait.pop("display"); self.write(); update(self.root)
        final = json.loads((self.root / "catalog.json").read_text())["assets"][0]
        with Image.open(self.root / final["thumbnail"]) as preview:
            self.assertEqual(preview.size, (80, 80))
        update(self.root, check=True)

    def test_crop_requires_current_source_review_and_valid_bounds(self):
        portrait = self.people[0]["portrait"]
        portrait["display"] = {"crop": [0, 0, 24, 32], "sourceSha256": "a" * 64, "reviewed": "2026-01-01"}
        self.write()
        with self.assertRaisesRegex(ValueError, "current portrait digest"): update(self.root)
        portrait["display"]["sourceSha256"] = portrait["source"]["sha256"]
        for crop, message in [([-1, 0, 20, 25], "nonnegative"), ([0, 0, 30, 32], "exceeds source")]:
            portrait["display"]["crop"] = crop; self.write()
            with self.assertRaisesRegex(ValueError, message): update(self.root)

    def test_enduring_profiles_preserve_precision_and_reviewed_identity(self):
        self.people[0]["profile"] = {"sourceName": "人物1", "heightCm": 169, "birthYear": 2000, "debutYear": 2020,
                                     "source": {"url": "https://example.test/profile", "sha256": "a" * 64, "retrieved": "2026-01-01"}, "reviewed": "2026-01-01"}
        self.write(); update(self.root)
        self.people[0].update(name="中文常用名", japaneseName="人物1", aliases=[{"name": "人物1", "source": "https://example.test/name"}])
        self.write(); update(self.root)
        person = json.loads((self.root / "catalog.json").read_text())["actresses"]["people"][0]
        self.assertEqual(person["profile"]["birthYear"], 2000)
        self.assertEqual(person["profile"]["debutYear"], 2020)
        self.assertEqual(person["japaneseName"], "人物1")
        self.assertNotIn("birthDate", person["profile"])
        self.assertEqual(person["id"], "p0001")
        for field, value, message in [("heightCm", "169 cm", "heightCm"), ("sourceName", "another person", "identity mapping"), ("birthDate", "2000-02-30", "valid ISO date"), ("debutYear", 1999, "invalid AV debutYear"), ("debutYear", True, "invalid AV debutYear")]:
            profile = self.people[0]["profile"]; before = profile.copy(); profile[field] = value; self.write()
            with self.assertRaisesRegex(ValueError, message): update(self.root)
            self.people[0]["profile"] = before

        for field in ["agency", "measurementsCm", "cup", "status", "socialAccounts", "label"]:
            profile = self.people[0]["profile"]; profile[field] = "unsupported"; self.write()
            with self.assertRaisesRegex(ValueError, "unsupported profile fields"): update(self.root)
            profile.pop(field)
        self.people[0]["japaneseName"] = "unreviewed name"; self.write()
        with self.assertRaisesRegex(ValueError, "sourced name or alias"): update(self.root)

    def test_field_evidence_requires_a_recorded_fact_and_reviewed_identity(self):
        evidence = {"sourceName": "人物1", "source": {"url": "https://example.test/birthday", "sha256": "a" * 64, "retrieved": "2026-01-01"}, "reviewed": "2026-01-01"}
        height = copy.deepcopy(evidence)
        height["source"]["url"] = "https://example.test/height"
        profile = {**evidence, "birthYear": 2000, "heightCm": 169, "fieldSources": {"heightCm": [height]}}
        self.people[0]["profile"] = profile
        self.write(); update(self.root)
        recorded = json.loads((self.root / "catalog.json").read_text())["actresses"]["people"][0]["profile"]
        self.assertEqual(recorded["fieldSources"]["heightCm"][0]["source"]["url"], "https://example.test/height")
        self.assertEqual(recorded["source"]["url"], "https://example.test/birthday")
        invalid = [
            ({"debutYear": [height]}, "recorded enduring facts"),
            ({"heightCm": []}, "nonempty evidence"),
            ({"heightCm": [height, height]}, "duplicate fieldSources URL"),
            ({"heightCm": [{**height, "sourceName": "other person"}]}, "identity mapping"),
            ({"heightCm": [{**height, "reviewed": "not a date"}]}, "valid ISO date"),
            ({"heightCm": [{**height, "source": {**height["source"], "sha256": "missing"}}]}, "snapshot SHA-256"),
        ]
        for overrides, error in invalid:
            with self.subTest(error=error):
                profile["fieldSources"] = overrides; self.write()
                with self.assertRaisesRegex(ValueError, error): update(self.root)

    def test_registry_rejects_obsolete_agency_mapping(self):
        self.data["agencies"] = {}; self.write()
        with self.assertRaisesRegex(ValueError, "not part of the enduring person registry"): update(self.root)

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

    def test_portrait_review_matches_actual_ai_fix_filename_without_changing_live_data(self):
        self.data["people"] = self.people[:4]
        revision = "a" * 40
        for person, filename in zip(self.people, ["普通.jpg", "AI-Fix-修复.jpg", "missing.jpg"]):
            person["portrait"]["source"].update(provider="Gfriends", path="Content/group/" + filename)
        self.write()
        before = (self.root / "actresses/data.json").read_bytes()
        tree = {"Content": {"group": {"普通.jpg": "普通.jpg?t=1", "修复.jpg": "AI-Fix-修复.jpg?t=2"}}}
        images = {"%E6%99%AE%E9%80%9A.jpg": self.people[0], "AI-Fix-%E4%BF%AE%E5%A4%8D.jpg": self.people[1]}

        def download(url):
            if url.endswith("commits/master"):
                return json.dumps({"sha": revision}).encode()
            if url.endswith("Filetree.json"):
                return json.dumps(tree).encode()
            person = images[url.rsplit("/", 1)[1]]
            return (self.root / person["portrait"]["path"]).read_bytes()

        output = self.root / "review"
        with patch("actress_sources.ROOT", self.root), patch("actress_sources.download", side_effect=download):
            audit_portraits(output)
        report = json.loads((output / "portraits.json").read_text())
        self.assertEqual([row["status"] for row in report], ["unchanged", "unchanged", "missing-upstream", "manual-source"])
        self.assertIn("AI-Fix-", report[1]["url"])
        self.assertEqual((self.root / "actresses/data.json").read_bytes(), before)


if __name__ == "__main__": unittest.main()
