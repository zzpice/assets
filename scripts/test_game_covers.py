import copy
import hashlib
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
        self.source = self.root / "source.png"
        Image.new("RGB", (1200, 1200), "red").save(self.source)
        self.path = "game-covers/example/first/original-nds-jp.png"
        report = normalize(self.source, self.root / self.path, mode="contain")
        self.source.unlink()  # The source is a local working file, not a gallery asset.
        self.asset = dict(report, path=self.path, title="首作", edition="main", cover={
            "version": "独立首版", "platform": "Nintendo DS", "region": "Japan", "releaseType": "original", "releaseYear": 2009, "releaseSource": "https://example.com/release"
        })
        self.asset["source"].update(publisher="官方发行商", page="https://example.com/game", url="https://example.com/cover.png", retrieved="2026-10-06")
        self.metadata = {"gameSeries": [{"id": "example", "title": "示例系列"}], "games": [{"series": "example", "id": "first", "title": "首作", "firstReleaseYear": 2009, "firstReleaseSource": "https://example.com/history"}], "assets": [self.asset]}
        self.save()

    def save(self):
        (self.root / "catalog.json").write_text(json.dumps(self.metadata), encoding="utf-8")

    def test_metadata_survives_rebuild_and_source_file_is_unchanged(self):
        before = (self.root / self.path).read_bytes()
        update(self.root)
        update(self.root, check=True)
        catalog = json.loads((self.root / "catalog.json").read_text())
        asset = catalog["assets"][0]
        for field in ("source", "processing", "edition", "cover", "note"):
            self.assertEqual(asset[field], self.asset[field])
        self.assertEqual(catalog["games"], self.metadata["games"])
        self.assertEqual(asset["kind"], "game-cover")
        self.assertEqual(asset["game"], "first")
        self.assertEqual(before, (self.root / self.path).read_bytes())

    def test_later_cover_does_not_change_original_first_release(self):
        second = copy.deepcopy(self.asset)
        second.update(path="game-covers/example/first/remaster-ps4-jp.png", edition="alternate")
        second["cover"].update(version="高清版", releaseType="remaster", releaseYear=2017, platform="PlayStation 4")
        (self.root / second["path"]).write_bytes((self.root / self.path).read_bytes())
        self.metadata["assets"].append(second)
        self.save()
        update(self.root)
        catalog = json.loads((self.root / "catalog.json").read_text())
        self.assertEqual(catalog["games"][0]["firstReleaseYear"], 2009)
        self.assertEqual([x["edition"] for x in catalog["assets"]], ["main", "alternate"])

    def test_original_regional_release_can_postdate_global_first_release(self):
        self.asset["cover"]["releaseYear"] = 2010
        self.save()
        update(self.root)

    def test_two_mains_and_later_version_as_main_are_rejected(self):
        for kind in ("port", "remaster", "remake", "collection", "reissue"):
            self.asset["cover"]["releaseType"] = kind
            self.save()
            with self.assertRaisesRegex(ValueError, "主封面只能"):
                update(self.root)
        self.asset["cover"]["releaseType"] = "original"
        second = copy.deepcopy(self.asset)
        second["path"] = "game-covers/example/first/original-nds-na.png"
        (self.root / second["path"]).write_bytes((self.root / self.path).read_bytes())
        self.metadata["assets"].append(second)
        self.save()
        with self.assertRaisesRegex(ValueError, "一个主封面"):
            update(self.root)

    def test_only_later_cover_stays_alternate_when_main_is_missing(self):
        self.asset.update(edition="alternate")
        self.asset["cover"].update(releaseType="port", releaseYear=2017)
        self.save()
        update(self.root)
        self.assertEqual(json.loads((self.root / "catalog.json").read_text())["assets"][0]["edition"], "alternate")

    def test_collection_is_separate_and_links_original_works(self):
        self.metadata["games"].append({"series": "example", "id": "bundle", "title": "合集", "firstReleaseYear": 2017, "firstReleaseSource": "https://example.com/bundle", "includes": ["example/first"]})
        second = copy.deepcopy(self.asset)
        second.update(path="game-covers/example/bundle/collection-ps4-jp.png", edition="alternate")
        second["cover"].update(releaseType="collection", releaseYear=2017)
        (self.root / second["path"]).parent.mkdir()
        (self.root / second["path"]).write_bytes((self.root / self.path).read_bytes())
        self.metadata["assets"].append(second)
        self.save()
        update(self.root, check=False)
        second["edition"] = "main"
        self.save()
        with self.assertRaisesRegex(ValueError, "主封面只能"):
            update(self.root)

    def test_bad_dimensions_unknown_series_and_changed_bytes_fail(self):
        Image.new("RGB", (1000, 1499)).save(self.root / self.path)
        with self.assertRaisesRegex(ValueError, "1000×1500"):
            update(self.root)
        Image.new("RGB", (1000, 1500)).save(self.root / self.path)
        with self.assertRaisesRegex(ValueError, "processing.sha256"):
            update(self.root)
        self.metadata["gameSeries"] = []
        self.save()
        with self.assertRaisesRegex(ValueError, "已登记的 series"):
            update(self.root)

    def test_invalid_year_source_region_and_processing_fail(self):
        baseline = copy.deepcopy(self.metadata)
        cases = [
            ("game", "firstReleaseYear", "2009"), ("game", "firstReleaseSource", "http://example.com"),
            ("cover", "releaseYear", 2008), ("cover", "region", ""),
            ("source", "sha256", "unknown"), ("source", "url", "http://example.com"),
            ("source", "retrieved", "2026-02-30"), ("processing", "crop", [0, 0, 1300, 1200]),
            ("processing", "scale", 2), ("processing", "mode", "stretch")
        ]
        for section, field, value in cases:
            with self.subTest(section=section, field=field):
                self.metadata = copy.deepcopy(baseline)
                target = self.metadata["games"][0] if section == "game" else self.metadata["assets"][0][section]
                target[field] = value
                self.save()
                with self.assertRaises(ValueError):
                    update(self.root)


class NormalizationTests(unittest.TestCase):
    def test_contain_keeps_square_geometry_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "source.png", Path(temp) / "cover.png"
            Image.new("RGB", (1200, 1200), "red").save(source)
            before = hashlib.sha256(source.read_bytes()).hexdigest()
            report = normalize(source, output, mode="contain", background="#ffffff")
            with Image.open(output) as image:
                self.assertEqual(image.size, (1000, 1500))
                self.assertEqual(image.getpixel((500, 249)), (255, 255, 255))
                self.assertEqual(image.getpixel((500, 250)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1249)), (255, 0, 0))
                self.assertEqual(image.getpixel((500, 1250)), (255, 255, 255))
            self.assertEqual(before, report["source"]["sha256"])
            self.assertEqual(before, hashlib.sha256(source.read_bytes()).hexdigest())
            with self.assertRaisesRegex(ValueError, "输出文件已存在"):
                normalize(source, output, mode="contain")

    def test_crop_requires_explicit_safe_ratio_and_upscale_requires_opt_in(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "source.png", Path(temp) / "cover.png"
            Image.new("RGB", (600, 900), "red").save(source)
            for crop, message in [(None, "显式提供"), ([0, 0, 600, 600], "2:3"), ([0, 0, 700, 900], "范围")]:
                with self.subTest(crop=crop), self.assertRaisesRegex(ValueError, message):
                    normalize(source, output, mode="crop", crop=crop)
            with self.assertRaisesRegex(ValueError, "更高质量"):
                normalize(source, output, mode="contain")
            normalize(source, output, mode="crop", crop=[0, 0, 600, 900], allow_upscale=True)
            with Image.open(output) as image:
                self.assertEqual(image.size, (1000, 1500))
