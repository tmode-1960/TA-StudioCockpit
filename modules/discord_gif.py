"""thomo.ART StudioCockpit - DiscordGIF Module

Encapsulates animated GIF library management, Tenor search/download,
Win32 Discord clipboard/auto-paste integration, and ComfyUI Image-to-GIF
generation under the unified `/api/gif/...` namespace.
"""

from __future__ import annotations

import base64
import ctypes
from ctypes import wintypes
import glob
import hashlib
import html
import io
import json
import os
import re
import shutil
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Callable

# ---------------------------------------------------------------------------
# Module Paths & Shared Studio Hooks (initialized via init_module)
# ---------------------------------------------------------------------------
DATA_DIR = ""
GIFS_DIR = ""
CONFIG_PATH = ""
LIBRARY_PATH = ""
WORKFLOWS_DIR = ""
BUNDLE_DIR = ""
APP_DIR = ""
_GET_STUDIO_CONFIG: Callable[[], dict] | None = None

_NO_WINDOW_FLAGS = 0x08000000 if sys.platform == "win32" else 0

CUSTOM_GIF_INDEX: dict[str, dict] = {}
TENOR_CACHE: dict[str, dict] = {}
LAST_TARGET_HWND: int | None = None
OUR_WINDOW_HWND: int | None = None
HOTKEY_REGISTERED: bool = False
_HOTKEY_THREAD_STARTED: bool = False
_ON_HOTKEY_CALLBACK: Callable[[], None] | None = None

AI_STATE_LOCK = threading.Lock()
CONFIG_FILE_LOCK = threading.RLock()
LIBRARY_FILE_LOCK = threading.RLock()
AI_STATE: dict = {
    "busy": False,
    "progress": 0,
    "status_text": "",
    "error": None,
    "current_gif": None,
    "prompt_id": None,
    "start_time": 0,
}

DOWNLOAD_STATE_LOCK = threading.Lock()
DOWNLOAD_STATE: dict = {
    "downloading": False,
    "progress": 0.0,
    "downloaded_mb": 0.0,
    "total_mb": 0.0,
    "speed_mb": 0.0,
    "status_text": "",
    "error": None,
}


def _is_path_within(base_dir: str, target_path: str) -> bool:
    """Return True iff target_path resolves inside base_dir."""
    if not base_dir or not target_path:
        return False
    try:
        base_real = os.path.realpath(os.path.abspath(base_dir))
        target_real = os.path.realpath(os.path.abspath(target_path))
        return os.path.commonpath([base_real, target_real]) == base_real
    except (ValueError, OSError):
        return False


def _atomic_write_json(path: str, payload) -> None:
    """Atomically write JSON via a thread-unique temp file and os.replace()."""
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    tmp_path = f"{path}.tmp.{threading.get_ident()}"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)


def _get_ssl_context() -> ssl.SSLContext:
    """Return a verifying TLS context using the OS trust store (with certifi fallback)."""
    ctx = ssl.create_default_context()
    if not ctx.get_ca_certs():
        try:
            import certifi
            ctx.load_verify_locations(certifi.where())
        except Exception:
            pass
    return ctx


def _is_http_url(url: str) -> bool:
    """Return True iff url is an http:// or https:// URL with a valid host."""
    try:
        parsed = urllib.parse.urlparse(str(url or "").strip())
        return parsed.scheme in ("http", "https") and bool(parsed.netloc) and bool(parsed.hostname)
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Windows Win32 Clipboard & Window Helpers
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalUnlock.restype = wintypes.BOOL

    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.OpenClipboard.restype = wintypes.BOOL
    user32.EmptyClipboard.restype = wintypes.BOOL
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    user32.SetClipboardData.restype = wintypes.HANDLE
    user32.CloseClipboard.restype = wintypes.BOOL

    CF_UNICODETEXT = 13
    CF_HDROP = 15
    GMEM_MOVEABLE = 0x0002
    GMEM_ZEROINIT = 0x0040
    VK_CONTROL = 0x11
    VK_V = 0x56
    VK_RETURN = 0x0D
    KEYEVENTF_KEYUP = 0x0002

    class DROPFILES(ctypes.Structure):
        _fields_ = [
            ("pFiles", wintypes.DWORD),
            ("pt", wintypes.POINT),
            ("fNC", wintypes.BOOL),
            ("fWide", wintypes.BOOL),
        ]
else:
    user32 = None
    kernel32 = None


def init_module(data_root: str, bundle_dir: str, get_studio_config: Callable[[], dict]) -> None:
    """Initialize paths and shared StudioCockpit config hook."""
    global DATA_DIR, GIFS_DIR, CONFIG_PATH, LIBRARY_PATH, WORKFLOWS_DIR
    global BUNDLE_DIR, APP_DIR, _GET_STUDIO_CONFIG

    APP_DIR = data_root
    BUNDLE_DIR = bundle_dir
    _GET_STUDIO_CONFIG = get_studio_config

    DATA_DIR = os.path.join(data_root, "data")
    GIFS_DIR = os.path.join(DATA_DIR, "gifs")
    CONFIG_PATH = os.path.join(DATA_DIR, "gif_config.json")
    LIBRARY_PATH = os.path.join(DATA_DIR, "gif_library.json")
    WORKFLOWS_DIR = os.path.join(bundle_dir, "workflows", "discord_gif")

    os.makedirs(GIFS_DIR, exist_ok=True)
    create_starter_gifs()


def _studio_cfg() -> dict:
    if _GET_STUDIO_CONFIG:
        try:
            return _GET_STUDIO_CONFIG() or {}
        except Exception:
            pass
    return {}


def _get_comfy_url(override_url: str = "") -> str:
    if override_url and override_url.strip():
        return override_url.strip().rstrip("/")
    scfg = _studio_cfg()
    cfg = load_config()
    return (scfg.get("comfy_url") or cfg.get("comfyui_url") or "http://127.0.0.1:8188").rstrip("/")


def _srv_t(de: str, en: str) -> str:
    lang = str(_studio_cfg().get("language") or load_config().get("language") or "de").lower()
    return de if lang.startswith("de") else en


# ---------------------------------------------------------------------------
# Config & Library Persistence
# ---------------------------------------------------------------------------
def _migrate_legacy_discord_gif_config(defaults: dict) -> None:
    """Import gif_dir / comfyui_dir from standalone tA-DiscordGIF if not yet configured."""
    candidates = [
        os.path.join(APP_DIR, "..", "tA-DiscordGIF", "dist", "data", "config.json"),
        os.path.join(APP_DIR, "..", "tA-DiscordGIF", "data", "config.json"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "tA-DiscordGIF", "data", "config.json"),
    ]
    for cand in candidates:
        if cand and os.path.isfile(cand):
            try:
                with open(cand, "r", encoding="utf-8") as fh:
                    old = json.load(fh)
                if old.get("gif_dir") and os.path.isdir(old["gif_dir"]):
                    defaults["gif_dir"] = old["gif_dir"]
                if old.get("comfyui_dir") and not defaults.get("comfyui_dir"):
                    defaults["comfyui_dir"] = old["comfyui_dir"]
                if old.get("tenor_api_key") and not defaults.get("tenor_api_key"):
                    defaults["tenor_api_key"] = old["tenor_api_key"]
                if "paste_mode" in old:
                    defaults["paste_mode"] = old["paste_mode"]
                if "auto_send" in old:
                    defaults["auto_send"] = bool(old["auto_send"])
                if defaults.get("gif_dir"):
                    save_config(defaults)
                    return
            except Exception:
                pass


def load_config() -> dict:
    with CONFIG_FILE_LOCK:
        defaults = {
            "gif_dir": "",
            "paste_mode": "file",
            "auto_send": False,
            "tenor_api_key": "",
            "comfyui_url": "http://127.0.0.1:8188",
            "comfyui_dir": "",
            "ai_workflow": "minimax_h3",
        }
        if CONFIG_PATH and os.path.isfile(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
                    saved = json.load(fh)
                    defaults.update(saved)
            except Exception:
                pass
        if not defaults.get("gif_dir"):
            _migrate_legacy_discord_gif_config(defaults)
        # Always mirror central ComfyUI URL from StudioCockpit
        scfg = _studio_cfg()
        if scfg.get("comfy_url"):
            defaults["comfyui_url"] = scfg["comfy_url"]
        return defaults


def save_config(cfg: dict) -> None:
    with CONFIG_FILE_LOCK:
        _atomic_write_json(CONFIG_PATH, cfg)


def load_library() -> list[dict]:
    with LIBRARY_FILE_LOCK:
        if LIBRARY_PATH and os.path.isfile(LIBRARY_PATH):
            try:
                with open(LIBRARY_PATH, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                    return data if isinstance(data, list) else []
            except Exception:
                pass
        return []


def save_library(lib: list[dict]) -> None:
    with LIBRARY_FILE_LOCK:
        _atomic_write_json(LIBRARY_PATH, lib)


def create_starter_gifs() -> None:
    """Create a few friendly starter animated GIFs if library is completely empty."""
    lib = load_library()
    if lib:
        return
    try:
        from PIL import Image, ImageDraw

        starter_defs = [
            (_srv_t("Lachender Smiley", "Laughing Smiley"), ["lachen", "funny", "lol", "happy"], (255, 184, 77)),
            ("Thumbs Up!", ["super", "yes", "top", "nice"], (51, 214, 166)),
            ("Party Hype", ["party", "dance", "hype", "feier"], (139, 92, 246)),
            ("Mind Blown", ["wow", "boom", "mindblown"], (255, 93, 108)),
        ]
        created_items = []
        for title, tags, color in starter_defs:
            gid = str(uuid.uuid4())[:8]
            fname = f"starter_{gid}.gif"
            fpath = os.path.join(GIFS_DIR, fname)
            frames = []
            for i in range(8):
                img = Image.new("RGBA", (140, 140), (23, 26, 35, 255))
                draw = ImageDraw.Draw(img)
                offset = int((i % 4) * 3)
                radius = 45 + (offset if i < 4 else -offset)
                draw.ellipse((70 - radius, 70 - radius, 70 + radius, 70 + radius), outline=color, width=4)
                frames.append(img)
            frames[0].save(fpath, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=False)
            created_items.append({
                "id": gid,
                "title": title,
                "filename": fname,
                "url": "",
                "tags": tags,
                "favorite": "funny" in tags,
                "use_count": 0,
                "created_at": int(time.time()),
            })
        save_library(created_items)
    except Exception as ex:
        print("[discord_gif] Could not create starter GIFs:", ex)


# ---------------------------------------------------------------------------
# Tenor Search & Custom Folder Scan
# ---------------------------------------------------------------------------
def fetch_tenor_gifs(query: str = "", limit: int = 36) -> list[dict]:
    global TENOR_CACHE
    cfg = load_config()
    api_key = cfg.get("tenor_api_key", "").strip()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": _srv_t("de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7", "en-US,en;q=0.9,de;q=0.7"),
    }
    ssl_ctx = _get_ssl_context()

    q_clean = query.strip()
    if not q_clean or q_clean.lower() in ("trending", "featured", "all"):
        urls = ["https://tenor.com/search/trending-gifs", "https://tenor.com/"]
    else:
        slug = re.sub(r"[\s_]+", "-", q_clean.lower())
        encoded_slug = urllib.parse.quote(slug)
        urls = [f"https://tenor.com/search/{encoded_slug}-gifs", f"https://tenor.com/search/{encoded_slug}"]

    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as resp:
                content = resp.read().decode("utf-8", "ignore")

            if not content:
                continue

            matches = re.findall(
                r'<img[^>]+src=["\'](https://media[0-9]*\.tenor\.com/[^"\']+)["\'][^>]*alt=["\']([^"\']*)["\']',
                content,
            )
            if not matches:
                matches_rev = re.findall(
                    r'<img[^>]+alt=["\']([^"\']*)["\'][^>]*src=["\'](https://media[0-9]*\.tenor\.com/[^"\']+)["\']',
                    content,
                )
                matches = [(src, alt) for alt, src in matches_rev]
            if not matches:
                raw_urls = re.findall(
                    r'https://media[0-9]*\.tenor\.com/[a-zA-Z0-9_\-]+AAAAM/[a-zA-Z0-9_\-]+\.gif', content
                )
                matches = [(u, "") for u in raw_urls]

            results = []
            seen_urls = set()
            for src, alt in matches:
                if not src.endswith(".gif") or src in seen_urls:
                    continue
                seen_urls.add(src)
                full_url = src.replace("AAAAM/", "AAAAC/") if "AAAAM/" in src else src
                raw_alt = html.unescape(alt).strip()
                filename_part = src.rsplit("/", 1)[-1].replace(".gif", "")
                clean_title = re.sub(r"[-_]+", " ", filename_part).strip().title()
                if not clean_title or len(clean_title) < 3:
                    clean_title = raw_alt[:35].title() if raw_alt else "Discord GIF"
                words = re.findall(r"\w+", (filename_part + " " + raw_alt).lower())
                tags = [w for w in words if len(w) > 2 and not w.isdigit()]
                gid = "tenor_" + hashlib.md5(src.encode("utf-8")).hexdigest()[:10]
                entry = {
                    "id": gid,
                    "title": clean_title,
                    "url": full_url,
                    "preview_url": src,
                    "tags": list(dict.fromkeys(tags))[:6] if tags else ["discord", "tenor"],
                    "is_tenor": True,
                    "favorite": False,
                    "use_count": 0,
                    "created_at": int(time.time()),
                }
                results.append(entry)
                TENOR_CACHE[gid] = entry
                if len(results) >= limit:
                    break
            if results:
                return results
        except Exception as ex:
            print(f"[discord_gif] Tenor scrape error: {ex}")

    if api_key:
        encoded_q = urllib.parse.quote(query) if query else ""
        api_url = (
            f"https://tenor.googleapis.com/v2/search?q={encoded_q}&key={api_key}&limit={limit}"
            if encoded_q
            else f"https://tenor.googleapis.com/v2/featured?key={api_key}&limit={limit}"
        )
        try:
            req = urllib.request.Request(api_url, headers=headers)
            with urllib.request.urlopen(req, timeout=7, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            results = []
            for item in data.get("results", []):
                gid = "tenor_" + str(item.get("id", uuid.uuid4().hex[:8]))
                title = item.get("title", "") or item.get("content_description", "GIF").title()
                mf = item.get("media_formats", {}) if isinstance(item.get("media_formats"), dict) else {}
                gif_url = mf.get("gif", {}).get("url") or mf.get("mediumgif", {}).get("url") or item.get("url", "")
                preview_url = mf.get("tinygif", {}).get("url") or mf.get("nanogif", {}).get("url") or gif_url
                tags = item.get("tags", [])
                if isinstance(tags, str):
                    tags = [tags]
                entry = {
                    "id": gid,
                    "title": title or "Discord GIF",
                    "url": gif_url,
                    "preview_url": preview_url,
                    "tags": tags[:6] if tags else ["discord", "tenor"],
                    "is_tenor": True,
                    "favorite": False,
                    "use_count": 0,
                    "created_at": int(time.time()),
                }
                results.append(entry)
                TENOR_CACHE[gid] = entry
            if results:
                return results
        except Exception as ex:
            print(f"[discord_gif] Tenor API failed: {ex}")
    return []


def scan_custom_directory(custom_dir: str) -> list[dict]:
    global CUSTOM_GIF_INDEX
    if not os.path.isdir(custom_dir):
        return []
    results = []
    try:
        for root, _, files in os.walk(custom_dir):
            for file in files:
                if not file.lower().endswith(".gif"):
                    continue
                full_path = os.path.abspath(os.path.join(root, file))
                rel = os.path.relpath(full_path, custom_dir)
                parts = rel.split(os.sep)
                category = parts[0] if len(parts) > 1 else ""
                raw_name = os.path.splitext(file)[0]
                clean_raw = re.sub(r"_[0-9a-fA-F]{4,8}$", "", raw_name)
                clean_name = re.sub(r"[-_.]+", " ", clean_raw).strip()
                title = clean_name.title() if clean_name else "GIF"
                tags = [category.lower()] if category else []
                gid = "ext_" + hashlib.sha1(rel.encode("utf-8", "ignore")).hexdigest()[:10]
                base_no_ext = os.path.splitext(full_path)[0]
                meta_path = base_no_ext + ".meta.json"
                source_path = base_no_ext + ".source.png"
                ai_params = None
                if os.path.isfile(meta_path):
                    try:
                        with open(meta_path, "r", encoding="utf-8") as mfh:
                            ai_params = json.load(mfh)
                    except Exception:
                        pass
                item = {
                    "id": gid,
                    "title": title,
                    "category": category,
                    "filename": None,
                    "abs_path": full_path,
                    "rel_path": rel,
                    "url": f"/api/gif/file?id={gid}",
                    "tags": tags,
                    "is_custom_folder": True,
                    "favorite": False,
                    "use_count": 0,
                    "created_at": int(os.path.getmtime(full_path)),
                    "ai_params": ai_params,
                    "has_ai_meta": bool(ai_params),
                    "has_source": os.path.isfile(source_path),
                }
                results.append(item)
                CUSTOM_GIF_INDEX[gid] = item
    except Exception as ex:
        print("[discord_gif] Error scanning custom gif directory:", ex)
    results.sort(key=lambda x: (x["category"].lower(), x["title"].lower()))
    return results


def get_active_library() -> list[dict]:
    cfg = load_config()
    custom_dir = cfg.get("gif_dir", "").strip()
    saved_lib = load_library()
    saved_meta = {item.get("id"): item for item in saved_lib if item.get("id")}

    if custom_dir and os.path.isdir(custom_dir):
        custom_items = scan_custom_directory(custom_dir)
        for item in custom_items:
            gid = item["id"]
            if gid in saved_meta:
                meta = saved_meta[gid]
                item["favorite"] = meta.get("favorite", False)
                item["use_count"] = meta.get("use_count", 0)
                if meta.get("title"):
                    item["title"] = meta["title"]
                if "tags" in meta and isinstance(meta["tags"], list):
                    item["tags"] = meta["tags"]
        return custom_items

    for item in saved_lib:
        if item.get("filename"):
            CUSTOM_GIF_INDEX[item["id"]] = item
            full_path = os.path.join(GIFS_DIR, item["filename"])
            if not item.get("abs_path"):
                item["abs_path"] = full_path
            item["url"] = f"/gifs/{urllib.parse.quote(item['filename'])}"
            base_no_ext = os.path.splitext(full_path)[0]
            meta_path = base_no_ext + ".meta.json"
            source_path = base_no_ext + ".source.png"
            if os.path.isfile(meta_path) and "ai_params" not in item:
                try:
                    with open(meta_path, "r", encoding="utf-8") as mfh:
                        item["ai_params"] = json.load(mfh)
                        item["has_ai_meta"] = True
                except Exception:
                    pass
            if os.path.isfile(source_path):
                item["has_source"] = True
    return saved_lib


def select_folder_dialog(initial_dir: str = "", title: str = "") -> str | None:
    if sys.platform != "win32":
        return None
    env = os.environ.copy()
    env["TA_DIALOG_TITLE"] = str(title or _srv_t("Ordner auswählen", "Select folder"))
    env["TA_DIALOG_INIT"] = initial_dir if (initial_dir and os.path.isdir(initial_dir)) else ""
    ps_script = """
    [System.Reflection.Assembly]::LoadWithPartialName('System.windows.forms') | Out-Null
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $env:TA_DIALOG_TITLE
    $dialog.ShowNewFolderButton = $true
    if ($env:TA_DIALOG_INIT -and (Test-Path -LiteralPath $env:TA_DIALOG_INIT)) { $dialog.SelectedPath = $env:TA_DIALOG_INIT }
    $top = New-Object System.Windows.Forms.Form
    $top.TopMost = $true
    if ($dialog.ShowDialog($top) -eq 'OK') { Write-Output $dialog.SelectedPath }
    """
    try:
        out = subprocess.check_output(
            ["powershell", "-NoProfile", "-STA", "-Command", ps_script],
            text=True,
            env=env,
            creationflags=_NO_WINDOW_FLAGS,
        )
        res = out.strip()
        return res if res and os.path.isdir(res) else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Win32 Clipboard & Discord Paste
# ---------------------------------------------------------------------------
def get_window_title(hwnd: int) -> str:
    if not user32:
        return ""
    length = user32.GetWindowTextLengthW(hwnd)
    if length > 0:
        buff = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buff, length + 1)
        return buff.value
    return ""


def find_discord_window() -> int | None:
    if not user32:
        return None
    discord_hwnd = None
    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def enum_cb(hwnd, _lparam):
        nonlocal discord_hwnd
        if user32.IsWindowVisible(hwnd):
            if "Discord" in get_window_title(hwnd):
                discord_hwnd = hwnd
                return False
        return True

    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return discord_hwnd


def copy_file_to_clipboard(file_path: str) -> bool:
    if not user32 or not kernel32:
        return False
    try:
        abs_path = os.path.abspath(file_path)
        files_bytes = (abs_path + "\0\0").encode("utf-16le")
        df = DROPFILES()
        df.pFiles = ctypes.sizeof(DROPFILES)
        df.pt = wintypes.POINT(0, 0)
        df.fNC = False
        df.fWide = True
        total_bytes = bytes(df) + files_bytes

        hGlobal = kernel32.GlobalAlloc(GMEM_MOVEABLE | GMEM_ZEROINIT, len(total_bytes))
        if not hGlobal:
            return False
        pGlobal = kernel32.GlobalLock(hGlobal)
        if not pGlobal:
            return False
        ctypes.memmove(pGlobal, total_bytes, len(total_bytes))
        kernel32.GlobalUnlock(hGlobal)

        user32.OpenClipboard(0)
        user32.EmptyClipboard()
        user32.SetClipboardData(CF_HDROP, hGlobal)
        user32.CloseClipboard()
        return True
    except Exception as ex:
        print("[discord_gif] Error copying file:", ex)
        return False


def copy_text_to_clipboard(text: str) -> bool:
    if not user32 or not kernel32:
        return False
    try:
        text_bytes = (text + "\0").encode("utf-16le")
        hGlobal = kernel32.GlobalAlloc(GMEM_MOVEABLE | GMEM_ZEROINIT, len(text_bytes))
        if not hGlobal:
            return False
        pGlobal = kernel32.GlobalLock(hGlobal)
        if not pGlobal:
            return False
        ctypes.memmove(pGlobal, text_bytes, len(text_bytes))
        kernel32.GlobalUnlock(hGlobal)

        user32.OpenClipboard(0)
        user32.EmptyClipboard()
        user32.SetClipboardData(CF_UNICODETEXT, hGlobal)
        user32.CloseClipboard()
        return True
    except Exception as ex:
        print("[discord_gif] Error copying text:", ex)
        return False


def activate_window_and_paste(hwnd: int, send_enter: bool = False) -> bool:
    if not user32 or not kernel32:
        return False
    try:
        cur_thread = kernel32.GetCurrentThreadId()
        target_pid = wintypes.DWORD()
        target_thread = user32.GetWindowThreadProcessId(hwnd, ctypes.byref(target_pid))
        if cur_thread != target_thread:
            user32.AttachThreadInput(cur_thread, target_thread, True)
        user32.ShowWindow(hwnd, 9)
        user32.SetForegroundWindow(hwnd)
        if cur_thread != target_thread:
            user32.AttachThreadInput(cur_thread, target_thread, False)

        time.sleep(0.12)
        user32.keybd_event(VK_CONTROL, 0, 0, 0)
        user32.keybd_event(VK_V, 0, 0, 0)
        time.sleep(0.02)
        user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)

        if send_enter:
            time.sleep(0.06)
            user32.keybd_event(VK_RETURN, 0, 0, 0)
            time.sleep(0.02)
            user32.keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0)
        return True
    except Exception as ex:
        print("[discord_gif] Paste error:", ex)
        return False


def _bring_our_window_to_front() -> None:
    global OUR_WINDOW_HWND
    if not user32 or not kernel32:
        return
    if not OUR_WINDOW_HWND or not user32.IsWindow(OUR_WINDOW_HWND):
        OUR_WINDOW_HWND = user32.FindWindowW(None, "thomo.ART StudioCockpit") or None
    if not OUR_WINDOW_HWND:
        return
    try:
        fg_hwnd = user32.GetForegroundWindow()
        cur_thread = kernel32.GetCurrentThreadId()
        fg_pid = wintypes.DWORD()
        fg_thread = user32.GetWindowThreadProcessId(fg_hwnd, ctypes.byref(fg_pid)) if fg_hwnd else 0
        if fg_thread and cur_thread != fg_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, True)
        user32.ShowWindow(OUR_WINDOW_HWND, 9)  # SW_RESTORE
        user32.SetForegroundWindow(OUR_WINDOW_HWND)
        if fg_thread and cur_thread != fg_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, False)
    except Exception as ex:
        print("[discord_gif] Could not bring StudioCockpit window to front:", ex)


def _hotkey_thread_worker() -> None:
    global LAST_TARGET_HWND, HOTKEY_REGISTERED
    if not user32:
        return
    MOD_ALT = 0x0001
    VK_G = 0x47
    HOTKEY_ID = 101

    if not user32.RegisterHotKey(0, HOTKEY_ID, MOD_ALT, VK_G):
        print("[discord_gif] Could not register global hotkey Alt+G (might already be in use).")
        return

    HOTKEY_REGISTERED = True
    print("[discord_gif] Registered global hotkey: Alt + G")

    msg = wintypes.MSG()
    while user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
        if msg.message == 0x0312 and msg.wParam == HOTKEY_ID:  # WM_HOTKEY
            fg_hwnd = user32.GetForegroundWindow()
            fg_title = get_window_title(fg_hwnd)
            if "StudioCockpit" not in fg_title and "DiscordGIF" not in fg_title:
                LAST_TARGET_HWND = fg_hwnd
            _bring_our_window_to_front()
            if _ON_HOTKEY_CALLBACK:
                try:
                    _ON_HOTKEY_CALLBACK()
                except Exception:
                    pass
        user32.TranslateMessage(ctypes.byref(msg))
        user32.DispatchMessageW(ctypes.byref(msg))


def start_hotkey_listener(on_hotkey: Callable[[], None] | None = None) -> None:
    """Start global Alt+G hotkey listener thread once (Windows only)."""
    global _HOTKEY_THREAD_STARTED, _ON_HOTKEY_CALLBACK
    if on_hotkey is not None:
        _ON_HOTKEY_CALLBACK = on_hotkey
    if sys.platform != "win32" or _HOTKEY_THREAD_STARTED:
        return
    _HOTKEY_THREAD_STARTED = True
    threading.Thread(target=_hotkey_thread_worker, daemon=True).start()


# ---------------------------------------------------------------------------
# FFmpeg, ComfyUI & GIF Compilation
# ---------------------------------------------------------------------------
def _is_backup_path(p: str) -> bool:
    if not p:
        return False
    low = p.lower()
    return low.startswith("i:") or any(
        x in low for x in ["backup", "veeam", "clonezilla", "$recycle.bin", "system volume information"]
    )


def _parse_extra_model_paths_yaml(yaml_path: str) -> str | None:
    try:
        with open(yaml_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        base_path = ""
        checkpoints_path = ""
        for line in lines:
            line_s = line.strip()
            if line_s.startswith("base_path:"):
                base_path = line_s.split(":", 1)[1].strip().strip('"\'')
            elif line_s.startswith("checkpoints:"):
                checkpoints_path = line_s.split(":", 1)[1].strip().strip('"\'')
        target = checkpoints_path or (base_path + "/checkpoints" if base_path else "")
        if target and not target.startswith("/home/") and not target.startswith("/"):
            if os.path.isdir(target) and not _is_backup_path(target):
                return target
    except Exception:
        pass
    return None


def auto_detect_comfy_checkpoints() -> str | None:
    cfg = load_config()
    saved = cfg.get("comfyui_dir", "").strip()
    if saved and os.path.isdir(saved) and not _is_backup_path(saved):
        for sub in [os.path.join(saved, "models", "checkpoints"), os.path.join(saved, "checkpoints"), saved]:
            if os.path.isdir(sub):
                return sub

    known_candidates = [
        r"C:\ComfyUI_windows_portable\ComfyUI",
        r"D:\ComfyUI_windows_portable\ComfyUI",
        r"E:\ComfyUI_windows_portable\ComfyUI",
        r"C:\ComfyUI",
        r"D:\ComfyUI",
        r"E:\ComfyUI",
    ]
    for k in known_candidates:
        if os.path.isdir(k) and not _is_backup_path(k):
            yaml_path = os.path.join(k, "extra_model_paths.yaml")
            if os.path.isfile(yaml_path):
                parsed = _parse_extra_model_paths_yaml(yaml_path)
                if parsed:
                    return parsed
            for sub in [os.path.join(k, "models", "checkpoints"), os.path.join(k, "checkpoints")]:
                if os.path.isdir(sub):
                    return sub
    return None


def get_comfy_model_folder(folder_type: str = "checkpoints") -> str | None:
    ckpt_dir = auto_detect_comfy_checkpoints()
    if not ckpt_dir:
        return None
    if folder_type == "checkpoints":
        return ckpt_dir
    models_base = os.path.dirname(ckpt_dir.rstrip(r"\/")) if ckpt_dir.rstrip(r"\/").endswith("checkpoints") else ckpt_dir
    if folder_type in ("text_encoders", "clip"):
        for cand in [
            os.path.join(models_base, "text_encoders"),
            os.path.join(models_base, "clip"),
            os.path.join(models_base, "models", "text_encoders"),
            os.path.join(models_base, "models", "clip"),
        ]:
            if os.path.isdir(cand):
                return cand
        target = os.path.join(models_base, "text_encoders")
        os.makedirs(target, exist_ok=True)
        return target
    target = os.path.join(models_base, folder_type)
    os.makedirs(target, exist_ok=True)
    return target


def get_ffmpeg_path() -> str | None:
    found = shutil.which("ffmpeg")
    if found:
        return found
    candidates = [
        os.path.join(APP_DIR, "bin", "ffmpeg.exe"),
        os.path.join(BUNDLE_DIR, "bin", "ffmpeg.exe"),
        r"C:\PortableApps\FFmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\FFmpeg\bin\ffmpeg.exe",
        r"C:\Program Files (x86)\FFmpeg\bin\ffmpeg.exe",
    ]
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        candidates.append(os.path.join(local_app_data, "Microsoft", "WinGet", "Links", "ffmpeg.exe"))
    for probe in candidates:
        if probe and os.path.isfile(probe):
            return probe
    if local_app_data:
        winget_pkgs = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages")
        if os.path.isdir(winget_pkgs):
            matches = glob.glob(os.path.join(winget_pkgs, "*FFmpeg*", "**", "ffmpeg.exe"), recursive=True)
            if matches:
                return matches[0]
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.isfile(exe):
            return exe
    except Exception:
        pass
    return None


def get_workflows_list() -> list[dict]:
    manifest_path = os.path.join(WORKFLOWS_DIR, "workflows.json")
    if os.path.isfile(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception as ex:
            print("[discord_gif] Error reading workflows.json:", ex)
    return []


def check_comfyui_status(comfy_url: str = "") -> dict:
    url = _get_comfy_url(comfy_url)
    ffmpeg_exe = get_ffmpeg_path()
    result = {
        "online": False,
        "url": url,
        "ffmpeg_installed": ffmpeg_exe is not None,
        "ffmpeg_path": ffmpeg_exe or "",
        "installed_models": [],
        "models_by_folder": {
            "checkpoints": [],
            "text_encoders": [],
            "diffusion_models": [],
            "vae": [],
            "loras": [],
        },
        "devices": [],
        "workflows": get_workflows_list(),
    }
    try:
        req = urllib.request.Request(f"{url}/system_stats", headers={"User-Agent": "tA-StudioCockpit"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            result["online"] = True
            result["devices"] = data.get("devices", [])
    except Exception:
        return result

    for loader, param, folder_type in [
        ("ImageOnlyCheckpointLoader", "ckpt_name", "checkpoints"),
        ("CheckpointLoaderSimple", "ckpt_name", "checkpoints"),
        ("CLIPLoader", "clip_name", "text_encoders"),
        ("DualCLIPLoader", "clip_name1", "text_encoders"),
        ("UNETLoader", "unet_name", "diffusion_models"),
        ("VAELoader", "vae_name", "vae"),
        ("LoraLoader", "lora_name", "loras"),
    ]:
        try:
            req_ckpt = urllib.request.Request(f"{url}/object_info/{loader}", headers={"User-Agent": "tA-StudioCockpit"})
            with urllib.request.urlopen(req_ckpt, timeout=1.8) as resp_ckpt:
                info = json.loads(resp_ckpt.read().decode("utf-8"))
                ckpts = info.get(loader, {}).get("input", {}).get("required", {}).get(param, [[]])[0]
                if isinstance(ckpts, list):
                    bucket = result["models_by_folder"][folder_type]
                    for c in ckpts:
                        if c not in bucket:
                            bucket.append(c)
                        if c not in result["installed_models"]:
                            result["installed_models"].append(c)
        except Exception:
            pass
    return result


def comfy_upload_image(comfy_url: str, img_bytes: bytes, filename: str) -> str:
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    crlf = b"\r\n"
    body = b"".join([
        b"--" + boundary.encode("ascii") + crlf,
        f'Content-Disposition: form-data; name="image"; filename="{filename}"'.encode("utf-8") + crlf,
        b"Content-Type: image/png" + crlf + crlf,
        img_bytes + crlf,
        b"--" + boundary.encode("ascii") + crlf,
        b'Content-Disposition: form-data; name="overwrite"' + crlf + crlf,
        b"true" + crlf,
        b"--" + boundary.encode("ascii") + b"--" + crlf,
    ])
    req = urllib.request.Request(
        f"{comfy_url.rstrip('/')}/upload/image",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "User-Agent": "tA-StudioCockpit"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8")).get("name", filename)


def _check_workflow_missing_models(workflow_id: str, comfy_status: dict) -> tuple[str, list[dict]]:
    """Check whether all required_files for workflow_id exist in ComfyUI."""
    workflows = comfy_status.get("workflows") or get_workflows_list()
    wf_entry = next((w for w in workflows if w.get("id") == workflow_id), None)
    if not wf_entry:
        return workflow_id, []
    wf_name = wf_entry.get("name") or workflow_id
    installed_all = comfy_status.get("installed_models", [])
    models_by_folder = comfy_status.get("models_by_folder", {})
    missing = []
    for req_file in wf_entry.get("required_files") or []:
        folder_type = req_file.get("folder_type", "")
        pool = models_by_folder.get(folder_type, installed_all) if folder_type else installed_all
        candidates = [req_file.get("filename", "")] + list(req_file.get("alternatives") or [])
        candidates = [c.lower().replace("\\", "/") for c in candidates if c]
        found = False
        for m in pool:
            ml = m.lower().replace("\\", "/")
            if any(ml == c or ml.endswith("/" + c) for c in candidates):
                found = True
                break
        if not found:
            missing.append(req_file)
    return wf_name, missing


def _format_comfy_validation_error(err_body: str) -> str:
    """Turn ComfyUI's raw JSON prompt validation error into a readable message."""
    try:
        data = json.loads(err_body)
    except Exception:
        return _srv_t(f"ComfyUI-Fehler: {err_body}", f"ComfyUI error: {err_body}")

    node_errors = data.get("node_errors") or {}
    missing_items = []
    other_items = []
    for node_info in node_errors.values():
        cls_type = node_info.get("class_type", "Node")
        for err in node_info.get("errors") or []:
            etype = err.get("type", "")
            if etype == "value_not_in_list":
                val = err.get("received_value") or "?"
                inp = (err.get("extra_info") or {}).get("input_name") or "model"
                missing_items.append(f"• {val} ({cls_type} → {inp})")
            else:
                msg = err.get("message") or err.get("details") or etype
                other_items.append(f"• {cls_type}: {msg}")

    if missing_items:
        lines = "\n".join(missing_items)
        return _srv_t(
            f"ComfyUI-Validierungsfehler – folgende Modelle fehlen in ComfyUI:\n{lines}\nBitte lade die fehlenden Dateien in die entsprechenden ComfyUI/models/-Ordner herunter.",
            f"ComfyUI validation error – the following models are missing in ComfyUI:\n{lines}\nPlease download the missing files into the corresponding ComfyUI/models/ folders.",
        )
    if other_items:
        lines = "\n".join(other_items)
        return _srv_t(
            f"ComfyUI-Validierungsfehler:\n{lines}",
            f"ComfyUI validation error:\n{lines}",
        )
    err_msg = (data.get("error") or {}).get("message")
    return _srv_t(f"ComfyUI-Fehler: {err_msg}", f"ComfyUI error: {err_msg}") if err_msg else _srv_t(f"ComfyUI-Fehler: {err_body}", f"ComfyUI error: {err_body}")


def comfy_queue_prompt(comfy_url: str, workflow_dict: dict, client_id: str) -> str:
    payload = json.dumps({"prompt": workflow_dict, "client_id": client_id}).encode("utf-8")
    req = urllib.request.Request(
        f"{comfy_url.rstrip('/')}/prompt",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "tA-StudioCockpit"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return json.loads(resp.read().decode("utf-8")).get("prompt_id", "")
    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8", "ignore")
        raise RuntimeError(_format_comfy_validation_error(err_body))


def comfy_interrupt(comfy_url: str) -> bool:
    try:
        req = urllib.request.Request(
            f"{comfy_url.rstrip('/')}/interrupt",
            data=b"{}",
            headers={"Content-Type": "application/json", "User-Agent": "tA-StudioCockpit"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


def compile_frames_to_gif_pillow(
    frames_dir: str, output_path: str, fps: int = 12, scale_width: int = 400, pingpong: bool = True, reverse: bool = False
) -> tuple[bool, str]:
    try:
        from PIL import Image
    except Exception as ex:
        return False, _srv_t(f"Pillow-Importfehler: {ex}", f"Pillow import error: {ex}")

    frame_files = sorted(f for f in os.listdir(frames_dir) if f.lower().startswith("frame_") and f.lower().endswith(".png"))
    if not frame_files:
        return False, _srv_t("Keine PNG-Frames gefunden.", "No PNG frames found.")
    try:
        loaded = []
        resample = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
        for fn in frame_files:
            with Image.open(os.path.join(frames_dir, fn)) as im:
                rgb = im.convert("RGB")
                if scale_width and rgb.width > 0 and rgb.width != scale_width:
                    new_h = max(1, int(round(rgb.height * (scale_width / float(rgb.width)))))
                    rgb = rgb.resize((scale_width, new_h), resample)
                loaded.append(rgb)
        if reverse:
            loaded = list(reversed(loaded))
        if pingpong and len(loaded) > 1:
            loaded = loaded + list(reversed(loaded))
        duration_ms = max(20, int(round(1000.0 / max(1, fps))))
        quantized = [
            f.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
            if hasattr(Image, "Quantize")
            else f.convert("P", palette=Image.ADAPTIVE, colors=128)
            for f in loaded
        ]
        quantized[0].save(output_path, save_all=True, append_images=quantized[1:], duration=duration_ms, loop=0, optimize=True)
        ok = os.path.isfile(output_path) and os.path.getsize(output_path) > 0
        return ok, "" if ok else _srv_t("Pillow hat ein leeres GIF geschrieben.", "Pillow wrote empty GIF.")
    except Exception as ex:
        return False, _srv_t(f"Pillow-GIF-Fehler: {ex}", f"Pillow GIF error: {ex}")


def compile_frames_to_gif(
    frames_dir: str, output_path: str, fps: int = 12, scale_width: int = 400, pingpong: bool = True, reverse: bool = False
) -> tuple[bool, str]:
    ffmpeg = get_ffmpeg_path()
    ffmpeg_err = ""
    if ffmpeg:
        input_pattern = os.path.join(frames_dir, "frame_%05d.png")
        if pingpong:
            chain = "[0:v]reverse[r];[r][0:v]concat=n=2:v=1[full];" if reverse else "[0:v]reverse[r];[0:v][r]concat=n=2:v=1[full];"
            filter_str = f"{chain}[full]fps={fps},scale={scale_width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3"
        else:
            chain = "[0:v]reverse[r];[r]" if reverse else "[0:v]"
            filter_str = f"{chain}fps={fps},scale={scale_width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3"
        cmd = [ffmpeg, "-y", "-framerate", str(fps), "-i", input_pattern, "-filter_complex", filter_str, "-loop", "0", output_path]
        try:
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60, creationflags=_NO_WINDOW_FLAGS)
            if proc.returncode == 0 and os.path.isfile(output_path) and os.path.getsize(output_path) > 0:
                return True, ""
            ffmpeg_err = (proc.stderr or "").strip().splitlines()[-1] if proc.stderr else _srv_t(f"Exit-Code {proc.returncode}", f"exit code {proc.returncode}")
        except Exception as ex:
            ffmpeg_err = str(ex)
    else:
        ffmpeg_err = _srv_t("FFmpeg nicht gefunden", "FFmpeg not found")

    pil_ok, pil_err = compile_frames_to_gif_pillow(frames_dir, output_path, fps=fps, scale_width=scale_width, pingpong=pingpong, reverse=reverse)
    if pil_ok:
        return True, ""
    return False, f"FFmpeg: {ffmpeg_err} | Pillow: {pil_err}"


def apply_text_overlay_to_frames(frames_dir: str, text: str, position: str = "bottom", effect: str = "fade_in") -> bool:
    if not text or not frames_dir or not os.path.isdir(frames_dir):
        return False
    from PIL import Image, ImageDraw, ImageFont

    frame_files = sorted(f for f in os.listdir(frames_dir) if f.lower().startswith("frame_") and f.lower().endswith(".png"))
    if not frame_files:
        return False
    with Image.open(os.path.join(frames_dir, frame_files[0])) as im:
        img_w, img_h = im.size

    def _get_font(size: int):
        for c in ["impact.ttf", "arialbd.ttf", "segoeuib.ttf", "arial.ttf"]:
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
            win_p = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", c)
            if os.path.isfile(win_p):
                try:
                    return ImageFont.truetype(win_p, size)
                except Exception:
                    pass
        return ImageFont.load_default()

    max_w, max_h = int(img_w * 0.90), int(img_h * 0.22)
    dummy_draw = ImageDraw.Draw(Image.new("RGB", (img_w, img_h)))
    font_size = max(16, min(48, int(img_h * 0.08)))
    chosen_lines, chosen_font, chosen_sw, chosen_metrics, chosen_spacing = [text], _get_font(16), 2, [], 4

    while font_size >= 14:
        font = _get_font(font_size)
        sw = max(2, int(font_size * 0.08))
        lines = []
        for para in text.split("\n"):
            cur = []
            for w in para.strip().split():
                cand = " ".join(cur + [w])
                bbox = dummy_draw.textbbox((0, 0), cand, font=font, stroke_width=sw)
                if (bbox[2] - bbox[0]) <= max_w or not cur:
                    cur.append(w)
                else:
                    lines.append(" ".join(cur))
                    cur = [w]
            if cur:
                lines.append(" ".join(cur))
        if not lines:
            lines = [text]
        metrics = [(b[2] - b[0], b[3] - b[1]) for b in (dummy_draw.textbbox((0, 0), l, font=font, stroke_width=sw) for l in lines)]
        spacing = int(font_size * 0.22)
        total_h = sum(m[1] for m in metrics) + spacing * (len(lines) - 1)
        max_line_w = max((m[0] for m in metrics), default=0)
        chosen_lines, chosen_font, chosen_sw, chosen_metrics, chosen_spacing = lines, font, sw, metrics, spacing
        if total_h <= max_h and max_line_w <= max_w:
            break
        font_size -= 2

    total_h = sum(m[1] for m in chosen_metrics) + chosen_spacing * (len(chosen_lines) - 1)
    start_y = max(8, int(img_h * 0.05)) if position == "top" else max(8, img_h - total_h - int(img_h * 0.06))
    text_layer = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(text_layer)
    cur_y = start_y
    for i, line in enumerate(chosen_lines):
        layer_draw.text((img_w // 2, cur_y), line, font=chosen_font, fill="white", stroke_width=chosen_sw, stroke_fill="black", anchor="mt")
        cur_y += chosen_metrics[i][1] + chosen_spacing

    _, _, _, base_alpha = text_layer.split()
    total_frames = len(frame_files)
    eff = str(effect or "fade_in").lower()

    for idx, fn in enumerate(frame_files):
        if eff == "fade_in":
            a_val = min(1.0, max(0.0, float(idx) / float(max(4, int(total_frames * 0.35)))))
        elif eff == "delayed_fade":
            d_end = max(2, int(total_frames * 0.25))
            f_end = max(d_end + 3, int(total_frames * 0.55))
            a_val = 0.0 if idx < d_end else min(1.0, max(0.0, float(idx - d_end) / float(f_end - d_end)))
        else:
            a_val = 1.0
        if a_val <= 0.001:
            continue
        fpath = os.path.join(frames_dir, fn)
        with Image.open(fpath) as im:
            im_rgba = im.convert("RGBA")
            if a_val >= 0.999:
                im_rgba.alpha_composite(text_layer)
            else:
                cur_layer = text_layer.copy()
                cur_layer.putalpha(base_alpha.point(lambda p: int(p * a_val)))
                im_rgba.alpha_composite(cur_layer)
            im_rgba.convert("RGB").save(fpath, "PNG")
    return True


def _safe_json_str(val: str) -> str:
    return json.dumps(str(val))[1:-1]


def _run_ai_generation_thread(params: dict) -> None:
    client_id = str(uuid.uuid4())
    temp_frames_dir = None
    try:
        with AI_STATE_LOCK:
            AI_STATE["busy"] = True
            AI_STATE["progress"] = 5
            AI_STATE["status_text"] = _srv_t("Prüfe ComfyUI...", "Checking ComfyUI...")
            AI_STATE["error"] = None
            AI_STATE["current_gif"] = None
            AI_STATE["start_time"] = time.time()

        cfg = load_config()
        comfy_url = _get_comfy_url()

        workflow_id = params.get("workflow_id") or cfg.get("ai_workflow") or "minimax_h3"
        workflow_path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
        if not os.path.isfile(workflow_path):
            raise FileNotFoundError(_srv_t(f"Workflow '{workflow_id}.json' nicht gefunden.", f"Workflow '{workflow_id}.json' not found."))

        comfy_status = check_comfyui_status(comfy_url)
        if not comfy_status.get("online"):
            raise RuntimeError(_srv_t(
                f"ComfyUI ist nicht erreichbar ({comfy_url}). Bitte ComfyUI zuerst starten.",
                f"ComfyUI is not reachable ({comfy_url}). Please start ComfyUI first.",
            ))

        wf_name, missing_files = _check_workflow_missing_models(workflow_id, comfy_status)
        if missing_files:
            lines = []
            for mf in missing_files:
                fname = mf.get("filename") or mf.get("name") or "?"
                folder = mf.get("folder_type") or "checkpoints"
                size_str = f" ({mf['size_str']})" if mf.get("size_str") else ""
                url_str = f"\n  Download: {mf['url']}" if mf.get("url") else ""
                lines.append(f"• {fname}{size_str} → ComfyUI/models/{folder}/{url_str}")
            joined = "\n".join(lines)
            raise RuntimeError(_srv_t(
                f"Fehlende ComfyUI-Modelle für '{wf_name}':\n{joined}\nBitte in die genannten Ordner herunterladen und ComfyUI neu laden.",
                f"Missing ComfyUI models for '{wf_name}':\n{joined}\nPlease download them into the folders above and reload ComfyUI.",
            ))

        img_b64 = params.get("image_data", "")
        if "," in img_b64:
            img_b64 = img_b64.split(",", 1)[1]
        img_bytes = base64.b64decode(img_b64)
        source_filename = f"tA_source_{str(uuid.uuid4())[:8]}.png"

        with AI_STATE_LOCK:
            AI_STATE["progress"] = 12
            AI_STATE["status_text"] = _srv_t("Lade Ausgangsbild zu ComfyUI hoch...", "Uploading source image to ComfyUI...")

        uploaded_name = comfy_upload_image(comfy_url, img_bytes, source_filename)

        with open(workflow_path, "r", encoding="utf-8") as fh:
            wf_str = fh.read()

        from PIL import Image
        orig_w, orig_h = 512, 512
        try:
            with Image.open(io.BytesIO(img_bytes)) as pil_img:
                orig_w, orig_h = pil_img.size
        except Exception:
            pass

        req_w = int(params.get("width") or 512)
        req_h = int(params.get("height") or 512)
        target_area = req_w * req_h
        if orig_w > 0 and orig_h > 0:
            aspect = float(orig_w) / float(orig_h)
            calc_h = (target_area / aspect) ** 0.5
            calc_w = calc_h * aspect
            width = max(192, min(832, int(round(calc_w / 32.0)) * 32))
            height = max(192, min(832, int(round(calc_h / 32.0)) * 32))
        else:
            width, height = req_w, req_h

        frames = int(params.get("frames") or 44)
        fps = int(params.get("fps") or 12)
        motion_bucket = int(params.get("motion_bucket") or 100)
        seed = int(params.get("seed") or int(time.time() * 1000) % 1000000000)
        steps = int(params.get("steps") or 20)

        if "ltx" in workflow_id.lower():
            width = max(64, (width // 32) * 32)
            height = max(64, (height // 32) * 32)
            frames = max(9, (((frames - 1) // 8) * 8) + 1)
            t = max(0.0, min(1.0, (motion_bucket - 20) / 180.0))
            ltx_strength = round(0.85 - (t * 0.37), 2)
            ltx_cfg = 3.5
            steps = max(25, steps)
        elif "minimax" in workflow_id.lower() or "h3" in workflow_id.lower():
            width = max(64, (width // 32) * 32)
            height = max(64, (height // 32) * 32)
            ltx_strength = 0.85
            ltx_cfg = 1.0
            steps = 8

            avail_models = comfy_status.get("installed_models", [])
            models_by_folder = comfy_status.get("models_by_folder", {})

            def _resolve_model_name(candidates, default_val, keywords=None, folder_type=None):
                pool = models_by_folder.get(folder_type, avail_models) if folder_type else avail_models
                for cand in candidates:
                    for m in pool:
                        ml = m.lower().replace("\\", "/")
                        cl = cand.lower().replace("\\", "/")
                        if ml == cl or ml.endswith("/" + cl):
                            return m
                if keywords:
                    for m in pool:
                        if all(kw.lower() in m.lower() for kw in keywords):
                            return m
                return default_val

            unet_name = _resolve_model_name(
                [
                    "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                    "fastvideo_fasth3_8step_v2_pruned_int8_convrot.safetensors",
                    "minimax_h3_hybrid_fl2va_ref2va_b30-49-int8.safetensors",
                    "MiniMax_H3_Ref2VA_pruned_int8_convrot.safetensors",
                    "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
                    "minimax_h3_fl2va_bf16.safetensors",
                ],
                "minimax_h3/minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                ["minimax", "fl2va"],
                "diffusion_models",
            )
            clip_name = _resolve_model_name(
                [
                    "qwen3vl_32b_minimax_h3_int8_convrot.safetensors",
                    "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                    "qwen3vl_32b_minimax_h3_int4_convrot.safetensors",
                    "qwen3vl_32b_minimax_h3_bf16.safetensors",
                ],
                "minimax_h3/qwen3vl_32b_minimax_h3_int8_convrot.safetensors",
                ["qwen3vl", "minimax"],
                "text_encoders",
            )
            vae_name = _resolve_model_name(
                [
                    "minimax_h3_video_vae_fp16.safetensors",
                    "minimax_h3_video_vae_bf16.safetensors",
                    "minimax_h3_video_vae.safetensors",
                    "minimax_video_vae_fp16.safetensors",
                ],
                "minimax_h3/minimax_h3_video_vae_fp16.safetensors",
                ["minimax", "vae"],
                "vae",
            )
            wf_str = wf_str.replace("{{UNET_NAME}}", _safe_json_str(unet_name))
            wf_str = wf_str.replace("{{CLIP_NAME}}", _safe_json_str(clip_name))
            wf_str = wf_str.replace("{{VAE_NAME}}", _safe_json_str(vae_name))
        else:
            ltx_strength = 0.85
            ltx_cfg = 3.0

        prompt_txt = str(params.get("prompt") or "").strip()
        for key, val in [
            ("{{IMAGE_FILENAME}}", _safe_json_str(uploaded_name)),
            ("{{WIDTH}}", str(width)),
            ("{{HEIGHT}}", str(height)),
            ("{{FRAMES}}", str(frames)),
            ("{{FPS}}", str(float(fps))),
            ("{{MOTION_BUCKET}}", str(motion_bucket)),
            ("{{STRENGTH}}", str(ltx_strength)),
            ("{{CFG}}", str(ltx_cfg)),
            ("{{SEED}}", str(seed)),
            ("{{STEPS}}", str(steps)),
            ("{{PROMPT}}", _safe_json_str(prompt_txt)),
        ]:
            wf_str = wf_str.replace(key, val)

        wf_dict = json.loads(wf_str)
        with AI_STATE_LOCK:
            AI_STATE["progress"] = 20
            AI_STATE["status_text"] = _srv_t("Sende Prompt an ComfyUI Queue...", "Sending prompt to ComfyUI queue...")

        prompt_id = comfy_queue_prompt(comfy_url, wf_dict, client_id)
        if not prompt_id:
            raise RuntimeError(_srv_t("ComfyUI hat keine Prompt-ID zurückgegeben.", "ComfyUI did not return a prompt ID."))

        with AI_STATE_LOCK:
            AI_STATE["prompt_id"] = prompt_id
            AI_STATE["progress"] = 25
            AI_STATE["status_text"] = _srv_t("ComfyUI rendert Video-Frames...", "ComfyUI is rendering video frames...")

        history_url = f"{comfy_url}/history/{prompt_id}"
        poll_start = time.time()
        output_images = []
        while True:
            if not AI_STATE["busy"]:
                comfy_interrupt(comfy_url)
                return
            try:
                req_h = urllib.request.Request(history_url, headers={"User-Agent": "tA-StudioCockpit"})
                with urllib.request.urlopen(req_h, timeout=5) as resp_h:
                    h_data = json.loads(resp_h.read().decode("utf-8"))
                    if prompt_id in h_data:
                        for node_out in h_data[prompt_id].get("outputs", {}).values():
                            if "images" in node_out:
                                output_images.extend(node_out["images"])
                        break
            except Exception:
                pass
            elapsed = int(time.time() - poll_start)
            with AI_STATE_LOCK:
                AI_STATE["progress"] = min(85, 25 + int(elapsed * 1.5))
                AI_STATE["status_text"] = _srv_t(
                    f"Generiere AI Video-Frames ({elapsed}s)...",
                    f"Generating AI video frames ({elapsed}s)...",
                )
            time.sleep(0.8)

        if not output_images:
            raise RuntimeError(_srv_t("ComfyUI hat keine gerenderten Bilder ausgegeben.", "ComfyUI did not output any rendered images."))

        with AI_STATE_LOCK:
            AI_STATE["progress"] = 88
            AI_STATE["status_text"] = _srv_t("Lade gerenderte Frames herunter...", "Downloading rendered frames...")

        temp_frames_dir = os.path.join(DATA_DIR, "temp", f"ai_{client_id[:8]}")
        os.makedirs(temp_frames_dir, exist_ok=True)
        for idx, img_info in enumerate(output_images):
            fn = img_info.get("filename")
            subf = img_info.get("subfolder", "")
            img_type = img_info.get("type", "output")
            view_url = f"{comfy_url}/view?filename={urllib.parse.quote(fn)}&subfolder={urllib.parse.quote(subf)}&type={img_type}"
            dest_frame = os.path.join(temp_frames_dir, f"frame_{idx:05d}.png")
            req_v = urllib.request.Request(view_url, headers={"User-Agent": "tA-StudioCockpit"})
            with urllib.request.urlopen(req_v, timeout=15) as resp_v, open(dest_frame, "wb") as out_f:
                shutil.copyfileobj(resp_v, out_f)

        overlay_enabled = bool(params.get("overlay_enabled", False))
        overlay_text = str(params.get("overlay_text") or "").strip()
        overlay_pos = str(params.get("overlay_position") or "bottom").strip().lower()
        overlay_eff = str(params.get("overlay_effect") or "fade_in").strip().lower()
        if overlay_enabled and overlay_text:
            with AI_STATE_LOCK:
                AI_STATE["status_text"] = _srv_t("Füge Text-Overlay ein...", "Applying text overlay...")
            try:
                apply_text_overlay_to_frames(temp_frames_dir, overlay_text, position=overlay_pos, effect=overlay_eff)
            except Exception as ex_ov:
                print("[discord_gif] Overlay warning:", ex_ov)

        with AI_STATE_LOCK:
            AI_STATE["progress"] = 93
            AI_STATE["status_text"] = _srv_t("Optimiere Discord-GIF (FFmpeg Palette)...", "Optimizing Discord GIF (FFmpeg palette)...")

        custom_dir = cfg.get("gif_dir", "").strip()
        target_base = custom_dir if custom_dir and os.path.isdir(custom_dir) else GIFS_DIR
        ai_folder = os.path.join(target_base, "AI-Generated")
        os.makedirs(ai_folder, exist_ok=True)

        user_title = params.get("title", "").strip() or "AI_GIF"
        clean_title = re.sub(r'[\\/*?:"<>|]+', "", user_title).strip().replace(" ", "_") or "AI_GIF"
        existing = set(os.listdir(ai_folder))
        idx = 1
        while f"{clean_title}_{idx:03d}.gif" in existing:
            idx += 1
        gif_filename = f"{clean_title}_{idx:03d}.gif"
        final_gif_path = os.path.join(ai_folder, gif_filename)

        scale_width = int(params.get("scale_width") or (480 if width > height else 400))
        if width > height and scale_width < 480:
            scale_width = 480
        pingpong = bool(params.get("loop_mode", "pingpong") == "pingpong")
        reverse = bool(params.get("reverse", False))

        compile_ok, compile_err = compile_frames_to_gif(
            temp_frames_dir, final_gif_path, fps=fps, scale_width=scale_width, pingpong=pingpong, reverse=reverse
        )
        if not compile_ok:
            raise RuntimeError(_srv_t(f"GIF-Erstellung fehlgeschlagen ({compile_err}).", f"GIF creation failed ({compile_err})."))

        base_no_ext = os.path.splitext(final_gif_path)[0]
        try:
            with open(base_no_ext + ".source.png", "wb") as sf:
                sf.write(img_bytes)
        except Exception:
            pass

        ai_meta = {
            "prompt": prompt_txt,
            "workflow_id": workflow_id,
            "motion_bucket": motion_bucket,
            "resolution": params.get("resolution", "high"),
            "frames": frames,
            "fps": fps,
            "width": width,
            "height": height,
            "scale_width": scale_width,
            "loop_mode": "pingpong" if pingpong else "normal",
            "reverse": reverse,
            "title": user_title,
            "overlay_text": overlay_text if overlay_enabled else "",
            "overlay_position": overlay_pos if overlay_enabled else "",
            "overlay_effect": overlay_eff if overlay_enabled else "",
            "created_at": int(time.time()),
        }
        try:
            with open(base_no_ext + ".meta.json", "w", encoding="utf-8") as mf:
                json.dump(ai_meta, mf, indent=2, ensure_ascii=False)
        except Exception:
            pass

        file_size_mb = round(os.path.getsize(final_gif_path) / (1024 * 1024), 2)
        rel_path = f"AI-Generated/{gif_filename}"
        gid = "ai_" + hashlib.sha1(rel_path.encode("utf-8", "ignore")).hexdigest()[:10]
        gif_item = {
            "id": gid,
            "title": clean_title.replace("_", " ").title(),
            "category": "AI-Generated",
            "filename": rel_path if target_base == GIFS_DIR else None,
            "abs_path": final_gif_path,
            "rel_path": rel_path,
            "url": f"/api/gif/file?id={gid}",
            "tags": ["ai", "animated", "reaction"],
            "favorite": False,
            "use_count": 0,
            "created_at": int(time.time()),
            "file_size_mb": file_size_mb,
            "ai_params": ai_meta,
            "has_ai_meta": True,
            "has_source": True,
        }
        CUSTOM_GIF_INDEX[gid] = gif_item
        lib = load_library()
        lib.insert(0, gif_item)
        save_library(lib)

        with AI_STATE_LOCK:
            AI_STATE["busy"] = False
            AI_STATE["progress"] = 100
            AI_STATE["status_text"] = _srv_t(
                f"Fertig! GIF erstellt ({file_size_mb} MB)",
                f"Done! GIF created ({file_size_mb} MB)",
            )
            AI_STATE["current_gif"] = gif_item
    except Exception as ex:
        print("[discord_gif] AI generation error:", ex)
        with AI_STATE_LOCK:
            AI_STATE["busy"] = False
            AI_STATE["error"] = str(ex)
            AI_STATE["status_text"] = _srv_t(f"Fehler: {ex}", f"Error: {ex}")
    finally:
        if temp_frames_dir and os.path.isdir(temp_frames_dir):
            shutil.rmtree(temp_frames_dir, ignore_errors=True)


def _run_model_download_thread(model_url: str, dest_dir: str, custom_filename: str = "") -> None:
    try:
        with DOWNLOAD_STATE_LOCK:
            DOWNLOAD_STATE.update({
                "downloading": True,
                "progress": 0.0,
                "downloaded_mb": 0.0,
                "total_mb": 0.0,
                "speed_mb": 0.0,
                "status_text": _srv_t("Starte Download...", "Starting download..."),
                "error": None,
            })
        if not _is_http_url(model_url):
            raise ValueError(_srv_t("Ungültige Download-URL (nur http/https erlaubt).", "Invalid download URL (only http/https allowed)."))
        filename = custom_filename or os.path.basename(urllib.parse.urlparse(model_url).path)
        os.makedirs(dest_dir, exist_ok=True)
        dest_file = os.path.join(dest_dir, filename)
        ssl_ctx = _get_ssl_context()
        req = urllib.request.Request(model_url, headers={"User-Agent": "Mozilla/5.0"})
        start_time = time.time()
        last_time = start_time
        downloaded = 0
        resp = urllib.request.urlopen(req, timeout=30, context=ssl_ctx)
        with resp, open(dest_file, "wb") as out_f:
            total_size = int(resp.headers.get("content-length", 0))
            total_mb = round(total_size / (1024 * 1024), 1)
            with DOWNLOAD_STATE_LOCK:
                DOWNLOAD_STATE["total_mb"] = total_mb
            while True:
                chunk = resp.read(1024 * 1024 * 2)
                if not chunk:
                    break
                out_f.write(chunk)
                downloaded += len(chunk)
                now = time.time()
                if now - last_time >= 0.5:
                    downloaded_mb = round(downloaded / (1024 * 1024), 1)
                    speed = round((downloaded / (1024 * 1024)) / max(0.1, now - start_time), 2)
                    pct = round((downloaded / total_size) * 100, 1) if total_size else 0.0
                    with DOWNLOAD_STATE_LOCK:
                        DOWNLOAD_STATE.update({
                            "progress": pct,
                            "downloaded_mb": downloaded_mb,
                            "speed_mb": speed,
                            "status_text": f"{downloaded_mb} MB / {total_mb} MB ({pct}%) • {speed} MB/s",
                        })
                    last_time = now
        with DOWNLOAD_STATE_LOCK:
            DOWNLOAD_STATE.update({
                "downloading": False,
                "progress": 100.0,
                "status_text": _srv_t(f"Download abgeschlossen! ({filename})", f"Download complete! ({filename})"),
            })
    except Exception as ex:
        with DOWNLOAD_STATE_LOCK:
            DOWNLOAD_STATE.update({"downloading": False, "error": str(ex), "status_text": _srv_t(f"Fehler: {ex}", f"Error: {ex}")})


# ---------------------------------------------------------------------------
# HTTP Dispatchers for StudioHandler
# ---------------------------------------------------------------------------
def _send_file(handler, file_path: str, content_type: str = "image/gif") -> None:
    if not os.path.isfile(file_path):
        handler.send_response(404)
        handler.end_headers()
        return
    with open(file_path, "rb") as fh:
        data = fh.read()
    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Cache-Control", "no-cache")
    handler.end_headers()
    handler.wfile.write(data)


def handle_get(handler, path: str, parsed) -> bool:
    """Handle GET requests for /api/gif/... and /gifs/... Returns True if handled."""
    if path == "/api/gif/status":
        discord_hwnd = find_discord_window()
        target_title = get_window_title(LAST_TARGET_HWND) if LAST_TARGET_HWND else (
            get_window_title(discord_hwnd) if discord_hwnd else ""
        )
        handler.send_json({
            "ok": True,
            "discord_found": discord_hwnd is not None,
            "discord_title": get_window_title(discord_hwnd) if discord_hwnd else None,
            "target_window": target_title or "Discord",
            "ffmpeg_installed": get_ffmpeg_path() is not None,
            "hotkey_registered": HOTKEY_REGISTERED,
        })
        return True

    if path == "/api/gif/list":
        lib = get_active_library()
        cfg = load_config()
        handler.send_json({
            "ok": True,
            "gifs": lib,
            "gif_dir": cfg.get("gif_dir", ""),
            "is_custom": bool(cfg.get("gif_dir") and os.path.isdir(cfg.get("gif_dir"))),
        })
        return True

    if path == "/api/gif/file":
        gid = urllib.parse.parse_qs(parsed.query).get("id", [""])[0]
        item = CUSTOM_GIF_INDEX.get(gid)
        if item and item.get("abs_path") and os.path.isfile(item["abs_path"]):
            _send_file(handler, item["abs_path"], "image/gif")
            return True
        handler.send_response(404)
        handler.end_headers()
        return True

    if path.startswith("/gifs/"):
        rel_name = urllib.parse.unquote(path[len("/gifs/"):]).lstrip("/\\").replace("/", os.sep)
        full_path = os.path.abspath(os.path.join(GIFS_DIR, rel_name))
        if _is_path_within(GIFS_DIR, full_path) and os.path.isfile(full_path):
            _send_file(handler, full_path, "image/gif")
            return True
        handler.send_response(404)
        handler.end_headers()
        return True

    if path == "/api/gif/tenor/search":
        q_dict = urllib.parse.parse_qs(parsed.query)
        q = q_dict.get("q", [""])[0]
        limit = int(q_dict.get("limit", [28])[0])
        handler.send_json({"ok": True, "gifs": fetch_tenor_gifs(q, limit=limit), "query": q})
        return True

    if path == "/api/gif/settings":
        handler.send_json({"ok": True, "settings": load_config()})
        return True

    if path == "/api/gif/ai/status":
        url_param = urllib.parse.parse_qs(parsed.query).get("url", [""])[0]
        handler.send_json(check_comfyui_status(url_param))
        return True

    if path == "/api/gif/ai/workflows":
        handler.send_json({"ok": True, "workflows": get_workflows_list()})
        return True

    if path == "/api/gif/ai/progress":
        with AI_STATE_LOCK:
            handler.send_json(dict(AI_STATE))
        return True

    if path == "/api/gif/ai/download_progress":
        with DOWNLOAD_STATE_LOCK:
            handler.send_json(dict(DOWNLOAD_STATE))
        return True

    if path == "/api/gif/ai/get_gif_source":
        gid = urllib.parse.parse_qs(parsed.query).get("id", [""])[0]
        item = CUSTOM_GIF_INDEX.get(gid) or next((x for x in load_library() if x.get("id") == gid), None)
        if not item:
            handler.send_json({"ok": False, "error": _srv_t("GIF nicht gefunden", "GIF not found")})
            return True
        abs_path = item.get("abs_path") or (os.path.join(GIFS_DIR, item["filename"]) if item.get("filename") else "")
        if not abs_path or not os.path.isfile(abs_path):
            handler.send_json({"ok": False, "error": _srv_t("GIF-Datei nicht gefunden", "GIF file not found")})
            return True
        base_no_ext = os.path.splitext(abs_path)[0]
        source_path = base_no_ext + ".source.png"
        meta_path = base_no_ext + ".meta.json"
        img_data = None
        if os.path.isfile(source_path):
            with open(source_path, "rb") as sf:
                img_data = "data:image/png;base64," + base64.b64encode(sf.read()).decode("ascii")
        ai_params = item.get("ai_params")
        if not ai_params and os.path.isfile(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as mf:
                    ai_params = json.load(mf)
            except Exception:
                pass
        handler.send_json({"ok": True, "image_data": img_data, "ai_params": ai_params, "title": item.get("title", "")})
        return True

    return False


def handle_post(handler, path: str, parsed, post_body: bytes | None) -> bool:
    """Handle POST requests for /api/gif/... Returns True if handled."""
    if not path.startswith("/api/gif/"):
        return False

    try:
        body = json.loads(post_body.decode("utf-8")) if post_body else {}
    except Exception:
        body = {}

    if path == "/api/gif/settings":
        with CONFIG_FILE_LOCK:
            cfg = load_config()
            cfg.update(body)
            save_config(cfg)
        handler.send_json({"ok": True, "settings": cfg})
        return True

    if path == "/api/gif/ai/generate":
        with AI_STATE_LOCK:
            if AI_STATE["busy"]:
                handler.send_json({"ok": False, "error": _srv_t("Eine GIF-Generierung läuft bereits.", "A GIF generation is already in progress.")}, status=400)
                return True
        threading.Thread(target=_run_ai_generation_thread, args=(body,), daemon=True).start()
        handler.send_json({"ok": True, "status": "started"})
        return True

    if path == "/api/gif/ai/cancel":
        with AI_STATE_LOCK:
            AI_STATE["busy"] = False
            AI_STATE["status_text"] = _srv_t("Abgebrochen", "Canceled")
        comfy_interrupt(_get_comfy_url())
        handler.send_json({"ok": True})
        return True

    if path == "/api/gif/ai/download_model":
        model_url = body.get("model_url", "").strip()
        folder_type = body.get("folder_type", "checkpoints").strip()
        custom_filename = body.get("filename", "").strip()
        if not model_url:
            handler.send_json({"ok": False, "error": _srv_t("Keine Download-URL angegeben", "No download URL specified")}, status=400)
            return True
        dest_dir = get_comfy_model_folder(folder_type)
        if not dest_dir:
            handler.send_json({"ok": False, "error": _srv_t("ComfyUI-Ordner konnte nicht gefunden werden.", "Could not find the ComfyUI folder.")}, status=400)
            return True
        with DOWNLOAD_STATE_LOCK:
            if DOWNLOAD_STATE["downloading"]:
                handler.send_json({"ok": False, "error": _srv_t("Download läuft bereits.", "Download is already in progress.")}, status=400)
                return True
        threading.Thread(target=_run_model_download_thread, args=(model_url, dest_dir, custom_filename), daemon=True).start()
        handler.send_json({"ok": True, "dest_dir": dest_dir})
        return True

    if path == "/api/gif/select_folder":
        cfg = load_config()
        chosen = select_folder_dialog(cfg.get("gif_dir", ""))
        handler.send_json({"ok": True, "path": chosen or ""})
        return True

    if path == "/api/gif/add":
        title = body.get("title", "").strip() or _srv_t("Neues GIF", "New GIF")
        tags_raw = body.get("tags", "")
        tags = [t.strip().lower() for t in tags_raw.split(",") if t.strip()] if isinstance(tags_raw, str) else tags_raw
        url = body.get("url", "").strip()
        item_id = str(uuid.uuid4())[:8]
        local_filename = None
        data_b64 = body.get("data")

        if data_b64:
            try:
                if "," in data_b64:
                    data_b64 = data_b64.split(",", 1)[1]
                raw_bytes = base64.b64decode(data_b64)
                local_filename = f"{item_id}.gif"
                with open(os.path.join(GIFS_DIR, local_filename), "wb") as out:
                    out.write(raw_bytes)
            except Exception:
                local_filename = None
        elif url and _is_http_url(url):
            try:
                local_filename = f"{item_id}.gif"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10, context=_get_ssl_context()) as resp, open(os.path.join(GIFS_DIR, local_filename), "wb") as out:
                    shutil.copyfileobj(resp, out)
            except Exception:
                local_filename = None

        gif_item = {
            "id": item_id,
            "title": title,
            "filename": local_filename,
            "url": f"/gifs/{local_filename}" if local_filename else url,
            "tags": tags,
            "favorite": False,
            "use_count": 0,
            "created_at": int(time.time()),
        }
        with LIBRARY_FILE_LOCK:
            lib = load_library()
            lib.insert(0, gif_item)
            save_library(lib)
        handler.send_json({"ok": True, "gif": gif_item})
        return True

    if path == "/api/gif/update":
        gid = body.get("id")
        with LIBRARY_FILE_LOCK:
            lib = load_library()
            found = False
            for item in lib:
                if item.get("id") == gid:
                    if "title" in body:
                        item["title"] = body["title"]
                    if "tags" in body:
                        tr = body["tags"]
                        item["tags"] = [t.strip().lower() for t in tr.split(",") if t.strip()] if isinstance(tr, str) else tr
                    if "favorite" in body:
                        item["favorite"] = bool(body["favorite"])
                    found = True
                    break
            if not found and gid:
                entry = {"id": gid}
                if "favorite" in body:
                    entry["favorite"] = bool(body["favorite"])
                if "title" in body:
                    entry["title"] = body["title"].strip()
                if "tags" in body:
                    tr = body["tags"]
                    entry["tags"] = [t.strip().lower() for t in tr.split(",") if t.strip()] if isinstance(tr, str) else tr
                lib.append(entry)
            save_library(lib)
        handler.send_json({"ok": True})
        return True

    if path == "/api/gif/delete":
        gid = body.get("id")
        with LIBRARY_FILE_LOCK:
            lib = load_library()
            item_to_remove = next((item for item in lib if item.get("id") == gid), None) or CUSTOM_GIF_INDEX.get(gid)
            if item_to_remove:
                file_path = item_to_remove.get("abs_path") or (
                    os.path.join(GIFS_DIR, item_to_remove["filename"]) if item_to_remove.get("filename") else None
                )
                if file_path and os.path.exists(file_path):
                    for p in [file_path, os.path.splitext(file_path)[0] + ".meta.json", os.path.splitext(file_path)[0] + ".source.png"]:
                        if os.path.exists(p):
                            try:
                                os.remove(p)
                            except Exception:
                                pass
                save_library([x for x in lib if x.get("id") != gid])
                CUSTOM_GIF_INDEX.pop(gid, None)
                handler.send_json({"ok": True})
            else:
                handler.send_json({"ok": False, "error": _srv_t("GIF nicht gefunden", "GIF not found")}, status=404)
        return True

    if path == "/api/gif/tenor/download":
        url = body.get("url", "").strip()
        title = body.get("title", "").strip() or "Discord_GIF"
        subfolder = body.get("subfolder", "").strip()
        if not url:
            handler.send_json({"ok": False, "error": _srv_t("Keine URL angegeben", "No URL provided")}, status=400)
            return True
        if not _is_http_url(url):
            handler.send_json({"ok": False, "error": _srv_t("Ungültige URL (nur http/https erlaubt).", "Invalid URL (only http/https allowed).")}, status=400)
            return True
        cfg = load_config()
        target_base = cfg.get("gif_dir", "").strip()
        if not target_base or not os.path.isdir(target_base):
            target_base = GIFS_DIR
        clean_sub = subfolder.lstrip("/\\") or "Downloads"
        dest_dir = os.path.normpath(os.path.join(target_base, clean_sub))
        if not _is_path_within(target_base, dest_dir):
            handler.send_json({"ok": False, "error": _srv_t("Ungültiger Unterordner.", "Invalid subfolder.")}, status=400)
            return True
        os.makedirs(dest_dir, exist_ok=True)
        safe_title = re.sub(r'[\\/*?:"<>|]+', "", title).strip().replace(" ", "_") or "GIF"
        filename = f"{safe_title}_{str(uuid.uuid4())[:6]}.gif"
        dest_file = os.path.join(dest_dir, filename)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=14, context=_get_ssl_context()) as resp, open(dest_file, "wb") as out:
                shutil.copyfileobj(resp, out)
            handler.send_json({"ok": True, "path": dest_file, "filename": filename})
        except Exception as ex:
            handler.send_json({"ok": False, "error": _srv_t(f"Download fehlgeschlagen: {ex}", f"Download failed: {ex}")}, status=500)
        return True

    if path == "/api/gif/send":
        gid = body.get("id")
        cfg = load_config()
        paste_mode = body.get("mode") or cfg.get("paste_mode", "file")
        auto_enter = body.get("auto_send") if "auto_send" in body else cfg.get("auto_send", False)

        all_gifs = get_active_library()
        item = next((x for x in all_gifs if x["id"] == gid), None) or CUSTOM_GIF_INDEX.get(gid) or TENOR_CACHE.get(gid)
        if not item:
            handler.send_json({"ok": False, "error": _srv_t("GIF nicht gefunden", "GIF not found")}, status=404)
            return True

        with LIBRARY_FILE_LOCK:
            lib = load_library()
            found = False
            for x in lib:
                if x.get("id") == gid:
                    x["use_count"] = x.get("use_count", 0) + 1
                    found = True
                    break
            if not found and gid:
                lib.append({"id": gid, "use_count": 1})
            save_library(lib)

        local_path = None
        if item.get("abs_path") and os.path.isfile(item["abs_path"]):
            local_path = item["abs_path"]
        elif item.get("filename"):
            cand = os.path.join(GIFS_DIR, item["filename"])
            if os.path.isfile(cand):
                local_path = cand

        if item.get("is_tenor") and paste_mode == "file" and item.get("url") and _is_http_url(item["url"]):
            temp_dir = os.path.join(DATA_DIR, "temp")
            os.makedirs(temp_dir, exist_ok=True)
            temp_file = os.path.join(temp_dir, f"{item['id']}.gif")
            if not os.path.isfile(temp_file):
                try:
                    req = urllib.request.Request(item["url"], headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=12, context=_get_ssl_context()) as resp, open(temp_file, "wb") as out:
                        shutil.copyfileobj(resp, out)
                except Exception:
                    pass
            if os.path.isfile(temp_file):
                local_path = temp_file

        copied = False
        if paste_mode == "file" and local_path and os.path.isfile(local_path):
            copied = copy_file_to_clipboard(local_path)
        elif item.get("url"):
            copied = copy_text_to_clipboard(item["url"])
        elif local_path and os.path.isfile(local_path):
            copied = copy_file_to_clipboard(local_path)

        if not copied:
            handler.send_json({"ok": False, "error": _srv_t("Konnte Daten nicht in die Zwischenablage kopieren.", "Could not copy data to the clipboard.")}, status=500)
            return True

        target_hwnd = LAST_TARGET_HWND if (LAST_TARGET_HWND and user32 and user32.IsWindowVisible(LAST_TARGET_HWND)) else find_discord_window()
        if not target_hwnd:
            handler.send_json({
                "ok": True,
                "warning": _srv_t(
                    "Discord-Fenster nicht gefunden. GIF in Zwischenablage kopiert (Strg+V zum Einfügen).",
                    "Discord window not found. GIF copied to clipboard (press Ctrl+V to paste).",
                ),
            })
            return True

        def delayed_paste():
            time.sleep(0.05)
            activate_window_and_paste(target_hwnd, send_enter=auto_enter)

        threading.Thread(target=delayed_paste, daemon=True).start()
        handler.send_json({"ok": True, "message": _srv_t("GIF erfolgreich in Discord eingefügt!", "GIF pasted to Discord!")})
        return True

    return False
