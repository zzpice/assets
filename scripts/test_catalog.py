import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image, ImageDraw, ImageOps

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

    def test_exif_orientation_preserves_source_and_preview_pixels(self):
        self.image.unlink()
        for orientation in (1, 2, 3, 4, 5, 6, 7, 8):
            with self.subTest(orientation=orientation):
                image = Image.new("RGB", (60, 120), "navy")
                ImageDraw.Draw(image).rectangle((0, 0, 29, 39), fill="red")
                exif = Image.Exif()
                exif[274] = orientation
                size = "120x60" if orientation >= 5 else "60x120"
                source = self.root / f"avatars/anime/{size}/oriented.jpg"
                source.parent.mkdir(parents=True, exist_ok=True)
                image.save(source, exif=exif)
                before = source.read_bytes()
                with Image.open(io.BytesIO(before)) as original:
                    expected = ImageOps.exif_transpose(original)
                buffer = io.BytesIO()
                expected.save(buffer, "WEBP", quality=82, method=6)
                update(self.root)
                item = next(item for item in self.catalog()["assets"] if item["path"] == source.relative_to(self.root).as_posix())
                self.assertEqual((item["width"], item["height"]), expected.size)
                self.assertEqual((self.root / item["thumbnail"]).read_bytes(), buffer.getvalue())
                self.assertEqual(source.read_bytes(), before)
                update(self.root, check=True)
                source.unlink()

    def test_gif_preview_keeps_first_frame_and_original_animation(self):
        self.image.unlink()
        source = self.root / "other/animated.gif"
        source.parent.mkdir()
        Image.new("RGB", (24, 32), "red").save(source, save_all=True, append_images=[Image.new("RGB", (24, 32), "blue")], duration=100, loop=0)
        before = source.read_bytes()
        update(self.root)
        item = self.catalog()["assets"][0]
        with Image.open(self.root / item["thumbnail"]) as preview:
            red, green, blue = preview.convert("RGB").getpixel((12, 16))
            self.assertGreater(red, 240)
            self.assertLess(green, 15)
            self.assertLess(blue, 15)
        self.assertEqual(source.read_bytes(), before)
        with Image.open(source) as original:
            self.assertEqual(original.n_frames, 2)
        update(self.root, check=True)

    def test_replacement_preserves_manual_metadata_and_removes_stale_previews(self):
        update(self.root)
        catalog = self.catalog()
        catalog["assets"][0].update(title="中文标题", note="已核对的说明", source="维护者提供", license="待核实")
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        old_preview = catalog["assets"][0]["thumbnail"]
        Image.new("RGB", (120, 260), "red").save(self.image)
        with self.assertRaises(ValueError):
            update(self.root, check=True)
        update(self.root)
        item = self.catalog()["assets"][0]
        self.assertEqual(item["title"], "中文标题")
        self.assertEqual(item["note"], "已核对的说明")
        self.assertEqual(item["source"], "维护者提供")
        self.assertEqual(item["license"], "待核实")
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
        (self.root / "symbols").mkdir()
        (self.root / "symbols/mark.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"/>')
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item["path"].endswith(".svg"))
        self.assertEqual((item["width"], item["height"]), (40, 20))
        self.assertEqual(item["kind"], "other")
        self.assertNotIn("thumbnail", item)

    def test_icons_keep_originals_without_duplicate_previews(self):
        icon = self.root / "icons/ai/example.png"
        icon.parent.mkdir(parents=True)
        image = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        ImageDraw.Draw(image).ellipse([100, 100, 411, 411], fill="red")
        image.save(icon)
        before = icon.read_bytes()
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item["path"] == "icons/ai/example.png")
        self.assertEqual((item["kind"], item["category"]), ("icon", "ai"))
        self.assertNotIn("thumbnail", item)
        self.assertNotIn("device", item)
        self.assertEqual(icon.read_bytes(), before)
        referenced = {item[key] for item in self.catalog()["assets"] for key in ("thumbnail", "background") if item.get(key)}
        self.assertEqual({path.relative_to(self.root).as_posix() for path in (self.root / "app/previews").glob("*.webp")}, referenced)
        update(self.root, check=True)

    def test_icons_reject_wrong_dimensions_or_color_mode(self):
        icon = self.root / "icons/ai/example.png"
        icon.parent.mkdir(parents=True)
        for mode, size in [("RGB", (512, 512)), ("RGBA", (256, 256))]:
            with self.subTest(mode=mode, size=size):
                Image.new(mode, size).save(icon)
                with self.assertRaisesRegex(ValueError, "512×512 PNG、RGBA"):
                    update(self.root)

    def test_icons_reject_visible_pixels_outside_the_rounded_mask(self):
        icon = self.root / "icons/ai/example.png"
        icon.parent.mkdir(parents=True)
        for point in [(0, 0), (30, 30)]:
            with self.subTest(point=point):
                image = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
                image.putpixel(point, (255, 0, 0, 255))
                image.save(icon)
                with self.assertRaisesRegex(ValueError, "r=115 圆角外侧必须完全透明"):
                    update(self.root)

    def test_icons_reject_non_png_formats_and_disguised_jpeg(self):
        icon = self.root / "icons/ai/example.png"
        icon.parent.mkdir(parents=True)
        Image.new("RGB", (512, 512)).save(icon, format="JPEG")
        with self.assertRaisesRegex(ValueError, "PNG 格式"):
            update(self.root)
        icon.unlink()
        (icon.parent / "example.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"/>')
        with self.assertRaisesRegex(ValueError, "PNG 格式"):
            update(self.root)

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

    def add_card(self):
        path = "bank-cards/originals/hong-kong/example/debit.png"
        file = self.root / path
        file.parent.mkdir(parents=True)
        Image.new("RGB", (160, 100), "navy").save(file)
        source = {"collection": "Cardentify", "wallet": "Apple Pay", "url": "https://example.com/debit.png", "sha256": hashlib.sha256(file.read_bytes()).hexdigest(), "cardId": 1, "assetId": 2, "retrieved": "2026-10-04"}
        catalog = {"assets": [{"path": path, "title": "示例借记卡", "source": source}], "cardBanks": [{"region": "hong-kong", "bank": "example", "name": "示例银行", "englishName": "Example Bank"}]}
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        return file

    def test_original_card_keeps_source_bank_order_and_bytes(self):
        file = self.add_card()
        before = file.read_bytes()
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item["kind"] == "bank-card")
        self.assertEqual((item["category"], item["bank"], item["edition"]), ("hong-kong", "example", "originals"))
        self.assertEqual(item["source"]["wallet"], "Apple Pay")
        self.assertEqual(self.catalog()["cardBanks"][0]["name"], "示例银行")
        self.assertEqual(file.read_bytes(), before)
        update(self.root, check=True)

    def test_original_card_rejects_unknown_wallet_or_changed_source(self):
        self.add_card()
        catalog = self.catalog()
        for wallet in ["Mi Pay", "云闪付", "", "Amazon Pay"]:
            catalog["assets"][0]["source"]["wallet"] = wallet
            (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "已确认"):
                update(self.root)
        catalog["assets"][0]["source"]["wallet"] = "Apple Pay"
        catalog["assets"][0]["source"]["sha256"] = "0" * 64
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            update(self.root)

    def test_original_card_cannot_be_overwritten(self):
        file = self.add_card()
        update(self.root)
        Image.new("RGB", (160, 100), "red").save(file)
        with self.assertRaisesRegex(ValueError, "不能覆盖"):
            update(self.root)

    def test_custom_card_requires_and_keeps_original_link(self):
        original = self.add_card()
        update(self.root)
        path = "bank-cards/custom/hong-kong/example/debit-blue.png"
        custom = self.root / path
        custom.parent.mkdir(parents=True)
        Image.new("RGB", (160, 100), "blue").save(custom)
        with self.assertRaisesRegex(ValueError, "derivedFrom"):
            update(self.root)
        catalog = self.catalog()
        catalog["assets"].append({"path": path, "derivedFrom": original.relative_to(self.root).as_posix()})
        (self.root / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        update(self.root)
        item = next(item for item in self.catalog()["assets"] if item.get("edition") == "custom")
        self.assertEqual(item["derivedFrom"], original.relative_to(self.root).as_posix())
        self.assertNotIn("source", item)
        update(self.root, check=True)

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

    def test_offline_content_updates_cache_version_without_repeated_changes(self):
        worker = self.root / "sw.js"
        worker.write_text('const CACHE_NAME = CACHE_PREFIX + "v1";\n')
        app = self.root / "app"
        app.mkdir()
        stylesheet = app / "site.css"
        stylesheet.write_text("body { color: navy; }")
        manifest = app / "manifest.webmanifest"
        manifest.write_text('{"name":"Gallery"}')
        update(self.root)
        previous = worker.read_text()
        update(self.root, check=True)
        self.assertEqual(worker.read_text(), previous)
        for file, content in [(stylesheet, "body { color: red; }"), (manifest, '{"name":"Images"}')]:
            with self.subTest(file=file.name):
                file.write_text(content)
                with self.assertRaises(ValueError):
                    update(self.root, check=True)
                update(self.root)
                self.assertNotEqual(worker.read_text(), previous)
                previous = worker.read_text()
                update(self.root, check=True)
        Image.new("RGB", (120, 260), "red").save(self.image)
        update(self.root)
        self.assertNotEqual(worker.read_text(), previous)
        update(self.root, check=True)

    def test_service_worker_behavior_changes_also_update_cache_version(self):
        worker = self.root / "sw.js"
        worker.write_text('const CACHE_NAME = CACHE_PREFIX + "v1";\nconst limit = 24;\n')
        update(self.root)
        previous = worker.read_text()
        worker.write_text(previous.replace("limit = 24", "limit = 32"))
        with self.assertRaises(ValueError):
            update(self.root, check=True)
        update(self.root)
        self.assertNotEqual(worker.read_text().splitlines()[0], previous.splitlines()[0])
        update(self.root, check=True)

    def test_invalid_metadata_types_and_duplicate_paths_fail_before_writing(self):
        update(self.root)
        catalog = self.catalog()
        for field in ("title", "note", "device", "sha", "thumbnail", "derivedFrom"):
            for value in (None, 42, {}, []):
                with self.subTest(field=field, value=value):
                    invalid = json.loads(json.dumps(catalog))
                    invalid["assets"][0][field] = value
                    text = json.dumps(invalid)
                    (self.root / "catalog.json").write_text(text)
                    for check in (False, True):
                        with self.assertRaisesRegex(ValueError, field):
                            update(self.root, check=check)
                    self.assertEqual((self.root / "catalog.json").read_text(), text)
        catalog["assets"].append(catalog["assets"][0])
        (self.root / "catalog.json").write_text(json.dumps(catalog))
        with self.assertRaisesRegex(ValueError, "路径不能重复"):
            update(self.root)

    def test_invalid_catalog_structure_has_clear_errors(self):
        for invalid in ([], {"assets": {}}, {"assets": [None]}, {"assets": [{"path": []}]}):
            with self.subTest(catalog=invalid):
                (self.root / "catalog.json").write_text(json.dumps(invalid))
                with self.assertRaises(ValueError):
                    update(self.root)

    def test_original_card_requires_complete_source_identifiers_and_date(self):
        self.add_card()
        catalog = self.catalog()
        invalid_fields = [("collection", ""), ("collection", []), ("cardId", True), ("cardId", 0), ("assetId", "2"), ("retrieved", "2026-02-30"), ("retrieved", "2026-1-1"), ("url", [])]
        for field in ("collection", "cardId", "assetId", "retrieved"):
            invalid = json.loads(json.dumps(catalog))
            del invalid["assets"][0]["source"][field]
            (self.root / "catalog.json").write_text(json.dumps(invalid))
            with self.assertRaisesRegex(ValueError, field):
                update(self.root)
        for field, value in invalid_fields:
            with self.subTest(field=field, value=value):
                invalid = json.loads(json.dumps(catalog))
                invalid["assets"][0]["source"][field] = value
                (self.root / "catalog.json").write_text(json.dumps(invalid))
                with self.assertRaisesRegex(ValueError, field):
                    update(self.root)

    def test_worker_pins_the_generated_page_catalog_and_versioned_scripts(self):
        app = self.root / "app"
        app.mkdir()
        (app / "site.js").write_text("const version = 1;")
        (app / "site.css").write_text("body { color: navy; }")
        page = self.root / "index.html"
        page.write_text('<script src="app/site.js"></script><link href="app/site.css">')
        worker = self.root / "sw.js"
        worker.write_text('const CACHE_NAME = CACHE_PREFIX + "v1";\nconst SHELL_HASHES = {};\n')
        update(self.root)
        source = worker.read_text()
        hashes = json.loads(source.split("const SHELL_HASHES = ")[1].split(";")[0])
        for name in ("index.html", "catalog.json", "app/site.js", "app/site.css"):
            digest = hashlib.sha256((self.root / name).read_bytes()).hexdigest()
            key = name + "?v=" + digest[:10] if name.startswith("app/site.") else name
            self.assertEqual(hashes[key], digest)
        update(self.root, check=True)


if __name__ == "__main__":
    unittest.main()
