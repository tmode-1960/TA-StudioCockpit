"""Unit tests for modules/updater.py."""

from __future__ import annotations

import io
import json
import os
import sys
import tempfile
import unittest
import urllib.error
import zipfile
from pathlib import Path
from unittest import mock

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from modules import updater  # noqa: E402


class _FakeResponse:
    """Minimal context-manager mock for urllib.request.urlopen."""

    def __init__(self, data: bytes, url: str = "", headers: dict | None = None):
        self._bio = io.BytesIO(data)
        self._url = url
        self.headers = headers or {}

    def read(self, amt: int = -1) -> bytes:
        return self._bio.read(amt)

    def geturl(self) -> str:
        return self._url

    def __enter__(self) -> "_FakeResponse":
        return self

    def __exit__(self, *_args) -> None:
        self._bio.close()


class UpdaterTests(unittest.TestCase):
    def setUp(self) -> None:
        self._orig_state = dict(updater._STATE)
        self._orig_cache = dict(updater._CHECK_CACHE)
        self._orig_install = dict(updater._INSTALL_STATE)
        updater.init_module("1.47", "", None)
        with updater._CACHE_LOCK:
            updater._CHECK_CACHE["ts"] = 0.0
            updater._CHECK_CACHE["payload"] = None
        updater._set_install_state(
            status="idle", progress=0, message="", error="", target_version=""
        )

    def tearDown(self) -> None:
        updater._STATE.update(self._orig_state)
        with updater._CACHE_LOCK:
            updater._CHECK_CACHE.update(self._orig_cache)
        updater._set_install_state(**self._orig_install)

    def test_version_parsing_and_comparison(self) -> None:
        self.assertEqual(updater._parse_version("v1.47"), (1, 47))
        self.assertEqual(updater._parse_version("V2.0.1"), (2, 0, 1))
        self.assertEqual(updater._parse_version(""), (0,))

        self.assertTrue(updater._is_newer_version("v1.48", "1.47"))
        self.assertTrue(updater._is_newer_version("1.10", "1.9"))
        self.assertTrue(updater._is_newer_version("2.0", "1.99"))
        self.assertFalse(updater._is_newer_version("1.47", "1.47"))
        self.assertFalse(updater._is_newer_version("1.46", "1.47"))

    def test_pick_release_asset_priority(self) -> None:
        assets = [
            {"name": "notes.txt", "browser_download_url": "https://github.com/a/b/notes.txt"},
            {"name": "StudioCockpit.exe", "browser_download_url": "https://github.com/a/b/StudioCockpit.exe"},
            {"name": "StudioCockpit-other.zip", "browser_download_url": "https://github.com/a/b/other.zip"},
            {"name": "tA-Studio-Cockpit-win64.zip", "browser_download_url": "https://github.com/a/b/win64.zip"},
        ]
        picked = updater._pick_release_asset(assets)
        self.assertIsNotNone(picked)
        self.assertEqual(picked["name"], "tA-Studio-Cockpit-win64.zip")

        # Fallback to any .zip, then .exe
        self.assertEqual(
            updater._pick_release_asset(assets[:3])["name"],
            "StudioCockpit-other.zip",
        )
        self.assertEqual(
            updater._pick_release_asset(assets[:2])["name"],
            "StudioCockpit.exe",
        )
        self.assertIsNone(updater._pick_release_asset([]))
        self.assertIsNone(updater._pick_release_asset(None))  # type: ignore[arg-type]

    def test_is_allowed_download_url(self) -> None:
        self.assertTrue(
            updater._is_allowed_download_url(
                "https://github.com/tmode-1960/TA-StudioCockpit/releases/download/v1.48/app.zip"
            )
        )
        self.assertTrue(
            updater._is_allowed_download_url(
                "https://objects.githubusercontent.com/github-production-release-asset/123"
            )
        )
        self.assertFalse(updater._is_allowed_download_url("http://github.com/a/b.zip"))
        self.assertFalse(updater._is_allowed_download_url("https://evil.example.com/app.zip"))
        self.assertFalse(updater._is_allowed_download_url("https://github.com/bad url.zip"))
        self.assertFalse(updater._is_allowed_download_url(""))

    def test_safe_extract_zip_blocks_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            good_zip = os.path.join(tmp, "good.zip")
            with zipfile.ZipFile(good_zip, "w") as zf:
                zf.writestr("App/StudioCockpit.exe", b"exe-bytes")
            out_good = os.path.join(tmp, "out_good")
            os.makedirs(out_good)
            updater._safe_extract_zip(good_zip, out_good)
            self.assertTrue(os.path.isfile(os.path.join(out_good, "App", "StudioCockpit.exe")))

            bad_zip = os.path.join(tmp, "bad.zip")
            with zipfile.ZipFile(bad_zip, "w") as zf:
                zf.writestr("../../evil.txt", b"pwn")
            out_bad = os.path.join(tmp, "out_bad")
            os.makedirs(out_bad)
            with self.assertRaises(RuntimeError):
                updater._safe_extract_zip(bad_zip, out_bad)

    def test_check_for_updates_success_and_cache(self) -> None:
        release_json = json.dumps({
            "tag_name": "v1.48",
            "name": "Release 1.48",
            "body": "Bugfixes",
            "html_url": "https://github.com/tmode-1960/TA-StudioCockpit/releases/tag/v1.48",
            "assets": [
                {
                    "name": "tA-Studio-Cockpit-win64.zip",
                    "size": 1024,
                    "browser_download_url": (
                        "https://github.com/tmode-1960/TA-StudioCockpit/releases/download/v1.48/app-win64.zip"
                    ),
                }
            ],
        }).encode("utf-8")

        with mock.patch(
            "urllib.request.urlopen",
            side_effect=lambda *_a, **_kw: _FakeResponse(release_json),
        ) as m_open:
            with mock.patch.object(sys, "frozen", True, create=True), mock.patch.object(
                sys, "platform", "win32"
            ):
                res1 = updater.check_for_updates(force=False)
                res2 = updater.check_for_updates(force=False)
                res3 = updater.check_for_updates(force=True)

        self.assertEqual(m_open.call_count, 2)
        self.assertTrue(res1["ok"])
        self.assertTrue(res1["update_available"])
        self.assertTrue(res1["can_auto_install"])
        self.assertEqual(res1["latest_version"], "1.48")
        self.assertEqual(res2["latest_version"], "1.48")
        self.assertEqual(res3["latest_version"], "1.48")

    def test_check_for_updates_http_errors(self) -> None:
        err_404 = urllib.error.HTTPError(
            updater.GITHUB_API_LATEST, 404, "Not Found", hdrs=None, fp=None
        )
        with mock.patch("urllib.request.urlopen", side_effect=err_404):
            res = updater.check_for_updates(force=True)
        self.assertFalse(res["ok"])
        self.assertIn("No GitHub releases", res["error"])

    def test_start_install_requires_frozen_windows(self) -> None:
        with mock.patch.object(sys, "frozen", False, create=True):
            code, payload = updater.start_install()
        self.assertEqual(code, 400)
        self.assertFalse(payload["ok"])

    def test_run_install_worker_stages_and_writes_batch(self) -> None:
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w") as zf:
            zf.writestr("tA-Studio-Cockpit/StudioCockpit.exe", b"NEW_EXE")
            zf.writestr("tA-Studio-Cockpit/README.md", b"# Updated")
        zip_bytes = zip_buf.getvalue()

        download_url = (
            "https://github.com/tmode-1960/TA-StudioCockpit/releases/download/v1.48/app-win64.zip"
        )
        info = {
            "download_url": download_url,
            "asset_name": "app-win64.zip",
            "asset_size": len(zip_bytes),
            "latest_version": "1.48",
        }

        captured: dict = {}

        def _fake_popen(cmd, **_kwargs):
            bat_path = cmd[2]
            captured["bat_path"] = bat_path
            with open(bat_path, "r", encoding="utf-8") as fh:
                captured["bat_content"] = fh.read()
            return mock.MagicMock()

        with tempfile.TemporaryDirectory() as staging_parent:
            staging_dir = os.path.join(staging_parent, "ta_cockpit_update_test")
            os.makedirs(staging_dir, exist_ok=True)
            fake_resp = _FakeResponse(
                zip_bytes,
                url=download_url,
                headers={"Content-Length": str(len(zip_bytes))},
            )
            with mock.patch("tempfile.mkdtemp", return_value=staging_dir), mock.patch(
                "urllib.request.urlopen", return_value=fake_resp
            ), mock.patch("subprocess.Popen", side_effect=_fake_popen):
                updater._run_install_worker(info)

            state = updater.get_install_state()
            self.assertEqual(state["status"], "restarting")
            self.assertEqual(state["progress"], 100)
            self.assertIn("apply_update.bat", captured.get("bat_path", ""))
            self.assertIn("StudioCockpit.exe", captured.get("bat_content", ""))
            self.assertIn("README.md", captured.get("bat_content", ""))


if __name__ == "__main__":
    unittest.main()
