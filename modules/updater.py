"""GitHub Release Update Checker & Stage-3 Auto-Updater for thomo.ART StudioCockpit."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

GITHUB_OWNER = "tmode-1960"
GITHUB_REPO = "TA-StudioCockpit"
GITHUB_API_LATEST = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases/latest"
GITHUB_RELEASES_URL = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases"
_ALLOWED_DOWNLOAD_HOSTS = frozenset({
    "github.com",
    "objects.githubusercontent.com",
    "release-assets.githubusercontent.com",
    "github-releases.githubusercontent.com",
    "codeload.github.com",
})
_MAX_UPDATE_ARCHIVE_BYTES = 512 * 1024 * 1024  # 512 MB safety cap


def _is_allowed_download_url(url: str) -> bool:
    """Allow only HTTPS release asset URLs hosted on official GitHub domains."""
    val = str(url or "").strip()
    if not val or any(ch in val for ch in ("\r", "\n", "\x00")) or any(ch.isspace() for ch in val):
        return False
    try:
        parsed = urllib.parse.urlparse(val)
    except Exception:
        return False
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and host in _ALLOWED_DOWNLOAD_HOSTS

_CACHE_TTL_SEC = 1800  # 30 minutes

_STATE = {
    "app_version": "0.00",
    "data_root": "",
    "request_exit_cb": None,
}

_CACHE_LOCK = threading.Lock()
_CHECK_CACHE: dict = {
    "ts": 0.0,
    "payload": None,
}

_INSTALL_LOCK = threading.Lock()
_INSTALL_STATE: dict = {
    "status": "idle",  # idle | downloading | extracting | applying | restarting | error
    "progress": 0,
    "message": "",
    "error": "",
    "target_version": "",
}


def init_module(app_version: str, data_root: str, request_exit_cb=None) -> None:
    _STATE["app_version"] = str(app_version or "0.00").strip()
    _STATE["data_root"] = data_root
    _STATE["request_exit_cb"] = request_exit_cb


def _parse_version(ver_str: str) -> tuple[int, ...]:
    cleaned = str(ver_str or "").strip().lstrip("vV")
    nums = re.findall(r"\d+", cleaned)
    if not nums:
        return (0,)
    return tuple(int(n) for n in nums)


def _is_newer_version(latest: str, current: str) -> bool:
    a = _parse_version(latest)
    b = _parse_version(current)
    max_len = max(len(a), len(b))
    a_pad = a + (0,) * (max_len - len(a))
    b_pad = b + (0,) * (max_len - len(b))
    return a_pad > b_pad


def _pick_release_asset(assets: list[dict]) -> dict | None:
    if not isinstance(assets, list):
        return None
    # Prefer win64 zip from build_dist.bat
    for asset in assets:
        name = str(asset.get("name", "")).lower()
        if name.endswith(".zip") and "win64" in name:
            return asset
    # Fallback: any .zip
    for asset in assets:
        name = str(asset.get("name", "")).lower()
        if name.endswith(".zip"):
            return asset
    # Fallback: standalone .exe
    for asset in assets:
        name = str(asset.get("name", "")).lower()
        if name.endswith(".exe"):
            return asset
    return None


def check_for_updates(force: bool = False) -> dict:
    current_ver = _STATE["app_version"]
    is_frozen = bool(getattr(sys, "frozen", False))

    now = time.time()
    with _CACHE_LOCK:
        if (
            not force
            and _CHECK_CACHE["payload"] is not None
            and (now - _CHECK_CACHE["ts"]) < _CACHE_TTL_SEC
        ):
            return dict(_CHECK_CACHE["payload"])

    req = urllib.request.Request(
        GITHUB_API_LATEST,
        headers={
            "User-Agent": f"TA-StudioCockpit/{current_ver}",
            "Accept": "application/vnd.github+json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        err_msg = f"GitHub HTTP {exc.code}"
        if exc.code == 404:
            err_msg = "No GitHub releases published yet."
        elif exc.code == 403:
            err_msg = "GitHub API rate limit reached."
        return {
            "ok": False,
            "update_available": False,
            "current_version": current_ver,
            "is_frozen": is_frozen,
            "can_auto_install": False,
            "releases_url": GITHUB_RELEASES_URL,
            "error": err_msg,
        }
    except Exception as exc:
        return {
            "ok": False,
            "update_available": False,
            "current_version": current_ver,
            "is_frozen": is_frozen,
            "can_auto_install": False,
            "releases_url": GITHUB_RELEASES_URL,
            "error": str(exc),
        }

    tag_name = str(data.get("tag_name") or "").strip()
    latest_ver = tag_name.lstrip("vV") or str(data.get("name") or "").strip()
    update_available = bool(latest_ver) and _is_newer_version(latest_ver, current_ver)

    asset = _pick_release_asset(data.get("assets") or [])
    raw_download_url = str(asset.get("browser_download_url") or "") if asset else ""
    download_url = raw_download_url if _is_allowed_download_url(raw_download_url) else ""
    asset_name = str(asset.get("name") or "") if asset else ""
    asset_size = int(asset.get("size") or 0) if asset else 0

    payload = {
        "ok": True,
        "current_version": current_ver,
        "latest_version": latest_ver,
        "tag_name": tag_name or f"v{latest_ver}",
        "update_available": update_available,
        "is_frozen": is_frozen,
        "can_auto_install": bool(is_frozen and sys.platform == "win32" and download_url),
        "release_name": str(data.get("name") or tag_name or ""),
        "release_notes": str(data.get("body") or "").strip(),
        "release_url": str(data.get("html_url") or GITHUB_RELEASES_URL),
        "releases_url": GITHUB_RELEASES_URL,
        "asset_name": asset_name,
        "asset_size": asset_size,
        "download_url": download_url,
    }

    with _CACHE_LOCK:
        _CHECK_CACHE["ts"] = now
        _CHECK_CACHE["payload"] = dict(payload)

    return payload


def _sanitize_cli_args_for_batch(argv: list[str]) -> str:
    """Return safely quoted CLI arguments for batch relaunch, stripping unsafe shell characters."""
    safe_args = [
        a for a in argv
        if isinstance(a, str) and re.fullmatch(r"[A-Za-z0-9_.:/\\=-]+", a)
    ]
    return " ".join(f'"{a}"' for a in safe_args)


def _set_install_state(**kwargs) -> None:
    with _INSTALL_LOCK:
        _INSTALL_STATE.update(kwargs)


def get_install_state() -> dict:
    with _INSTALL_LOCK:
        return dict(_INSTALL_STATE)


def _safe_extract_zip(zip_path: str, dest_dir: str) -> None:
    dest_abs = os.path.abspath(dest_dir)
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            target = os.path.abspath(os.path.join(dest_abs, member.filename))
            if not (target == dest_abs or target.startswith(dest_abs + os.sep)):
                raise RuntimeError("Unsafe path in update archive.")
        zf.extractall(dest_abs)


def _find_extracted_root(extract_dir: str) -> str:
    """Locate the directory containing StudioCockpit.exe inside the extracted archive."""
    for root, _dirs, files in os.walk(extract_dir):
        for fname in files:
            if fname.lower() == "studiocockpit.exe":
                return root
    return extract_dir


def _run_install_worker(info: dict) -> None:
    download_url = info.get("download_url", "")
    asset_name = info.get("asset_name", "update.zip")
    target_ver = info.get("latest_version", "")
    staging_dir = tempfile.mkdtemp(prefix="ta_cockpit_update_")

    try:
        if not _is_allowed_download_url(download_url):
            raise RuntimeError("Untrusted update download URL.")

        _set_install_state(
            status="downloading",
            progress=5,
            message="Downloading update…",
            error="",
            target_version=target_ver,
        )

        archive_path = os.path.join(staging_dir, asset_name)
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": f"TA-StudioCockpit/{_STATE['app_version']}"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            final_url = resp.geturl() or download_url
            if not _is_allowed_download_url(final_url):
                raise RuntimeError("Untrusted redirect target for update download.")
            total = int(resp.headers.get("Content-Length") or info.get("asset_size") or 0)
            if total > _MAX_UPDATE_ARCHIVE_BYTES:
                raise RuntimeError("Update archive exceeds maximum allowed size.")
            downloaded = 0
            chunk_size = 65536
            with open(archive_path, "wb") as out_fh:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    downloaded += len(chunk)
                    if downloaded > _MAX_UPDATE_ARCHIVE_BYTES:
                        raise RuntimeError("Update archive exceeds maximum allowed size.")
                    out_fh.write(chunk)
                    if total > 0:
                        pct = min(75, 5 + int((downloaded / total) * 70))
                        _set_install_state(progress=pct)

        _set_install_state(
            status="extracting",
            progress=80,
            message="Extracting update files…",
        )

        source_dir = os.path.join(staging_dir, "extracted")
        os.makedirs(source_dir, exist_ok=True)
        if asset_name.lower().endswith(".zip"):
            _safe_extract_zip(archive_path, source_dir)
            payload_dir = _find_extracted_root(source_dir)
        else:
            # Standalone .exe asset
            shutil.copy2(archive_path, os.path.join(source_dir, "StudioCockpit.exe"))
            payload_dir = source_dir

        new_exe = os.path.join(payload_dir, "StudioCockpit.exe")
        if not os.path.isfile(new_exe):
            raise RuntimeError("StudioCockpit.exe was not found in the update package.")

        _set_install_state(
            status="applying",
            progress=92,
            message="Preparing installation & restart…",
        )

        app_exe = os.path.abspath(sys.executable)
        app_dir = os.path.dirname(app_exe)
        pid = os.getpid()
        cli_args = _sanitize_cli_args_for_batch(sys.argv[1:])

        bat_path = os.path.join(staging_dir, "apply_update.bat")
        # Wait for current PID to exit, copy updated files (preserving data/config.json), relaunch, cleanup
        bat_lines = [
            "@echo off",
            "setlocal enabledelayedexpansion",
            "chcp 65001 >nul",
            f"set \"PID={pid}\"",
            f"set \"SRC={payload_dir}\"",
            f"set \"DST={app_dir}\"",
            f"set \"EXE={app_exe}\"",
            f"set \"STAGING={staging_dir}\"",
            "for /L %%i in (1,1,25) do (",
            "    tasklist /FI \"PID eq %PID%\" 2>nul | find /I \"%PID%\" >nul",
            "    if errorlevel 1 goto :do_copy",
            "    timeout /t 1 /nobreak >nul",
            ")",
            ":do_copy",
            "timeout /t 1 /nobreak >nul",
            "for /L %%r in (1,1,5) do (",
            "    copy /y \"%SRC%\\StudioCockpit.exe\" \"%EXE%\" >nul 2>&1",
            "    if not errorlevel 1 goto :copied_exe",
            "    timeout /t 1 /nobreak >nul",
            ")",
            ":copied_exe",
            "if exist \"%SRC%\\README.md\" copy /y \"%SRC%\\README.md\" \"%DST%\\README.md\" >nul 2>&1",
            "if exist \"%SRC%\\data\\config.example.json\" (",
            "    if not exist \"%DST%\\data\" mkdir \"%DST%\\data\" >nul 2>&1",
            "    copy /y \"%SRC%\\data\\config.example.json\" \"%DST%\\data\\config.example.json\" >nul 2>&1",
            ")",
            f"start \"\" \"%EXE%\" {cli_args}".strip(),
            "timeout /t 2 /nobreak >nul",
            "rmdir /s /q \"%STAGING%\" >nul 2>&1",
            "exit /b 0",
        ]
        with open(bat_path, "w", encoding="utf-8", newline="\r\n") as bfh:
            bfh.write("\r\n".join(bat_lines) + "\r\n")

        creation_flags = (
            getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
            | getattr(subprocess, "DETACHED_PROCESS", 0)
            | getattr(subprocess, "CREATE_NO_WINDOW", 0)
        )
        subprocess.Popen(
            ["cmd", "/c", bat_path],
            close_fds=True,
            creationflags=creation_flags,
        )

        _set_install_state(
            status="restarting",
            progress=100,
            message="Update installed – restarting StudioCockpit…",
        )

        def _delayed_exit():
            time.sleep(0.9)
            cb = _STATE.get("request_exit_cb")
            if callable(cb):
                cb()

        t = threading.Thread(target=_delayed_exit, daemon=True)
        t.start()

    except Exception as exc:
        _set_install_state(
            status="error",
            progress=0,
            message="Update failed.",
            error=str(exc),
        )
        try:
            shutil.rmtree(staging_dir, ignore_errors=True)
        except Exception:
            pass


def start_install() -> tuple[int, dict]:
    if not getattr(sys, "frozen", False) or sys.platform != "win32":
        return 400, {
            "ok": False,
            "error": "Auto-update is only available in the compiled Windows app (StudioCockpit.exe).",
        }

    with _INSTALL_LOCK:
        if _INSTALL_STATE["status"] in ("downloading", "extracting", "applying", "restarting"):
            return 200, {"ok": True, "state": dict(_INSTALL_STATE)}

    info = check_for_updates(force=True)
    if not info.get("ok") or not info.get("update_available"):
        return 400, {
            "ok": False,
            "error": info.get("error") or "No new update available.",
        }
    if not info.get("download_url"):
        return 400, {
            "ok": False,
            "error": "No matching release asset (.zip / .exe) found on GitHub.",
        }

    t = threading.Thread(target=_run_install_worker, args=(info,), daemon=True)
    t.start()
    return 200, {"ok": True, "state": get_install_state()}


def handle_get(handler, path: str, parsed) -> bool:
    if path == "/api/update/check":
        qs = urllib.parse.parse_qs(parsed.query)
        force = qs.get("force", ["0"])[0] in ("1", "true", "yes")
        handler.send_json(check_for_updates(force=force))
        return True
    if path == "/api/update/status":
        handler.send_json(get_install_state())
        return True
    return False


def handle_post(handler, path: str, parsed, post_body: bytes | None) -> bool:
    if path == "/api/update/install":
        code, payload = start_install()
        handler.send_json(payload, status_code=code)
        return True
    return False
