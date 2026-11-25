"""thomo.ART StudioCockpit - VideoMaker Module

Encapsulates MiniMax H3 / Wan 2.2 multi-shot storyboard, quick clip, morph,
long clip, lipsync, FFmpeg stitching, and pre-flight model management under
the unified `/api/video/...` namespace.
"""

from __future__ import annotations

import base64
import json
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Dict, List, Optional, Tuple

from modules.video_comfy import ComfyClient, validate_and_preserve_h3_tags
from modules.video_models import (
    KNOWN_VIDEO_MODELS,
    check_models_status,
    get_disk_free_gb,
)
from modules.video_stitcher import concat_segments, is_ffmpeg_available, extract_last_frame

# ---------------------------------------------------------------------------
# Module Paths & Shared Studio Hooks (initialized via init_module)
# ---------------------------------------------------------------------------
DATA_DIR = ""
UPLOADS_DIR = ""
DEFAULT_OUTPUT_DIR = ""
CONFIG_FILE = ""
CONFIG_BACKUP_FILE = ""
BUNDLE_DIR = ""
APP_DIR = ""
_GET_STUDIO_CONFIG: Callable[[], dict] | None = None
_GET_STUDIO_OUTPUT_DIR: Callable[[], str] | None = None
_GET_EFFECTIVE_API_KEY: Callable[[str], str] | None = None

NO_WINDOW_FLAG = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
_CONFIG_LOCK = threading.RLock()

DEFAULT_VIDEO_CONFIG = {
    "models_dir": "",
    "teacache_enabled": True,
    "cache_mode": "auto",
    "video_engine": "minimax_h3",
    "subtitles_enabled": False,
    "comfy_dir": "",
}


def init_module(
    data_root: str,
    bundle_dir: str,
    get_studio_config: Callable[[], dict],
    get_studio_output_dir: Callable[[], str],
    get_effective_api_key: Optional[Callable[[str], str]] = None,
) -> None:
    """Initialize VideoMaker paths and shared StudioCockpit hooks."""
    global DATA_DIR, UPLOADS_DIR, DEFAULT_OUTPUT_DIR, CONFIG_FILE, CONFIG_BACKUP_FILE
    global BUNDLE_DIR, APP_DIR, _GET_STUDIO_CONFIG, _GET_STUDIO_OUTPUT_DIR, _GET_EFFECTIVE_API_KEY

    BUNDLE_DIR = bundle_dir
    APP_DIR = os.path.dirname(data_root) if data_root else bundle_dir
    DATA_DIR = os.path.join(data_root, "video_maker")
    UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
    DEFAULT_OUTPUT_DIR = get_studio_output_dir()
    CONFIG_FILE = os.path.join(DATA_DIR, "config.json")
    CONFIG_BACKUP_FILE = os.path.join(DATA_DIR, "config.json.bak")

    _GET_STUDIO_CONFIG = get_studio_config
    _GET_STUDIO_OUTPUT_DIR = get_studio_output_dir
    _GET_EFFECTIVE_API_KEY = get_effective_api_key

    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    if DEFAULT_OUTPUT_DIR:
        os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)
    _migrate_legacy_videomaker_config()


def _migrate_legacy_videomaker_config() -> None:
    """Import comfy_dir / models_dir from standalone tA-VideoMaker if not yet configured."""
    if os.path.isfile(CONFIG_FILE):
        return
    candidates = [
        os.path.join(APP_DIR, "..", "tA-VideoMaker", "data", "config.json"),
    ]
    for cand in candidates:
        if os.path.isfile(cand):
            try:
                with open(cand, "r", encoding="utf-8") as f:
                    legacy = json.load(f)
                if isinstance(legacy, dict):
                    imported = dict(DEFAULT_VIDEO_CONFIG)
                    for k in DEFAULT_VIDEO_CONFIG:
                        if k in legacy:
                            imported[k] = legacy[k]
                    _atomic_write_json(CONFIG_FILE, imported)
                    return
            except Exception:
                pass


def _read_config_json(path: str) -> Optional[dict]:
    if not path or not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return None


def _atomic_write_json(path: str, cfg: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_path, path)


def load_config() -> dict:
    """Merge StudioCockpit global config with VideoMaker-specific settings."""
    studio = _GET_STUDIO_CONFIG() if _GET_STUDIO_CONFIG else {}
    with _CONFIG_LOCK:
        local = _read_config_json(CONFIG_FILE) or _read_config_json(CONFIG_BACKUP_FILE) or {}
    merged = {
        "comfy_url": studio.get("comfy_url", "http://127.0.0.1:8188"),
        "comfy_dir": local.get("comfy_dir") or studio.get("comfy_dir", ""),
        "models_dir": local.get("models_dir", ""),
        "output_dir": get_output_dir(),
        "language": studio.get("language", "de"),
        "llm_provider": studio.get("llm_provider", "auto"),
        "ollama_url": studio.get("ollama_url", "http://127.0.0.1:11434"),
        "ollama_model": studio.get("ollama_model", "llama3.2"),
        "lmstudio_url": studio.get("lms_url", "http://127.0.0.1:1234/v1"),
        "gemini_model": studio.get("gemini_model", "gemini-3.8-flash"),
        "teacache_enabled": local.get("teacache_enabled", True),
        "cache_mode": local.get("cache_mode", "auto"),
        "video_engine": local.get("video_engine", "minimax_h3"),
        "subtitles_enabled": local.get("subtitles_enabled", False),
    }
    return merged


def save_config(cfg: dict) -> None:
    """Save VideoMaker-specific settings without overwriting StudioCockpit global config."""
    with _CONFIG_LOCK:
        current = _read_config_json(CONFIG_FILE) or dict(DEFAULT_VIDEO_CONFIG)
        for k in DEFAULT_VIDEO_CONFIG:
            if k in cfg:
                current[k] = cfg[k]
        try:
            _atomic_write_json(CONFIG_FILE, current)
            _atomic_write_json(CONFIG_BACKUP_FILE, current)
        except Exception as ex:
            print("[video_maker] Error saving config:", ex)


def get_output_dir() -> str:
    if _GET_STUDIO_OUTPUT_DIR:
        try:
            out = _GET_STUDIO_OUTPUT_DIR()
            if out:
                os.makedirs(out, exist_ok=True)
                return out
        except Exception:
            pass
    if DEFAULT_OUTPUT_DIR:
        os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)
        return DEFAULT_OUTPUT_DIR
    return os.getcwd()


def _get_comfy() -> ComfyClient:
    cfg = load_config()
    return ComfyClient(cfg.get("comfy_url", "http://127.0.0.1:8188"), lang=cfg.get("language", "de"))


def _resolve_gemini_key(config: dict) -> str:
    if _GET_EFFECTIVE_API_KEY:
        try:
            k = _GET_EFFECTIVE_API_KEY("gemini_api_key")
            if k:
                return k.strip()
        except Exception:
            pass
    return (config.get("gemini_api_key", "") or os.environ.get("GEMINI_API_KEY", "")).strip()


def sanitize_video_title(raw_title: str, default_prefix: str = "video") -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_\-\s]", "", raw_title or "").strip()
    cleaned = re.sub(r"\s+", "_", cleaned)
    if not cleaned:
        return f"{default_prefix}_{int(time.time())}.mp4"
    if not cleaned.lower().endswith(".mp4"):
        cleaned += ".mp4"
    return cleaned


def _send_json(handler, data: dict, status: int = 200) -> None:
    payload = json.dumps(data).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def _serve_file_with_range(handler, full_path: str) -> None:
    low = full_path.lower()
    if low.endswith(".mp4"):
        ctype = "video/mp4"
    elif low.endswith(".webm"):
        ctype = "video/webm"
    elif low.endswith(".png"):
        ctype = "image/png"
    elif low.endswith((".jpg", ".jpeg")):
        ctype = "image/jpeg"
    elif low.endswith(".webp"):
        ctype = "image/webp"
    elif low.endswith(".gif"):
        ctype = "image/gif"
    elif low.endswith(".mp3"):
        ctype = "audio/mpeg"
    elif low.endswith(".wav"):
        ctype = "audio/wav"
    else:
        ctype = "application/octet-stream"

    size = os.path.getsize(full_path)
    range_hdr = handler.headers.get("Range")
    if range_hdr and range_hdr.startswith("bytes="):
        try:
            spec = range_hdr[6:].split(",")[0].strip()
            start_s, end_s = spec.split("-", 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else size - 1
            start = max(0, min(start, size - 1))
            end = max(start, min(end, size - 1))
            length = end - start + 1
            handler.send_response(206)
            handler.send_header("Content-Type", ctype)
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            handler.send_header("Content-Length", str(length))
            handler.end_headers()
            with open(full_path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    handler.wfile.write(chunk)
                    remaining -= len(chunk)
            return
        except Exception:
            pass

    handler.send_response(200)
    handler.send_header("Content-Type", ctype)
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Length", str(size))
    handler.end_headers()
    with open(full_path, "rb") as f:
        shutil.copyfileobj(f, handler.wfile)



def detect_local_gpu() -> dict:
    """Queries local NVIDIA GPU via nvidia-smi if ComfyUI is offline."""
    try:
        res = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=3,
            creationflags=NO_WINDOW_FLAG,
        )
        if res.returncode == 0 and res.stdout.strip():
            first_line = res.stdout.strip().split("\n")[0]
            parts = [p.strip() for p in first_line.split(",")]
            name = parts[0]
            vram_mb = float(parts[1]) if len(parts) > 1 else 8192
            vram_gb = round(vram_mb / 1024, 1)

            profile = "ultra" if vram_gb >= 18 else ("balanced" if vram_gb >= 10 else "eco")
            return {
                "detected": True,
                "gpu_name": name,
                "vram_gb": vram_gb,
                "profile": profile,
                "source": "nvidia-smi (lokal)",
            }
    except Exception:
        pass

    return {
        "detected": False,
        "gpu_name": "Standard GPU",
        "vram_gb": 8.0,
        "profile": "eco",
        "source": "fallback",
    }


def get_server_lang() -> str:
    return load_config().get("language", "de")

def msg_comfy_offline() -> str:
    return "ComfyUI is not reachable at http://127.0.0.1:8188. Please start ComfyUI or choose Animatic Preview." if get_server_lang().startswith("en") else "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188. Bitte starte ComfyUI oder wähle Animatic-Preview."

def msg_job_running() -> str:
    return "Another render job is already running." if get_server_lang().startswith("en") else "Ein Render-Job läuft bereits."

def msg_no_scenes() -> str:
    return "No scenes found in the storyboard." if get_server_lang().startswith("en") else "Keine Szenen im Storyboard vorhanden."

def msg_portrait_required() -> str:
    return "Please upload a portrait image (reference frame) first." if get_server_lang().startswith("en") else "Bitte zuerst ein Porträtbild (Referenzbild) hochladen."

def msg_audio_required() -> str:
    return "Please upload an audio file (.mp3, .wav, .flac) first." if get_server_lang().startswith("en") else "Bitte zuerst eine Audiodatei (.mp3, .wav, .flac) hochladen."

# Global state
download_state = {
    "is_downloading": False,
    "current_file": "",
    "downloaded_bytes": 0,
    "total_bytes": 0,
    "progress_pct": 0.0,
    "speed_mbps": 0.0,
    "error": None,
    "done": False,
}

active_job = {
    "is_running": False,
    "job_id": None,
    "type": "none",
    "stage": "idle",
    "progress_pct": 0,
    "current_segment": 0,
    "total_segments": 0,
    "output_file": None,
    "error": None,
    "cancel_requested": False,
}


def _download_file_highspeed(
    url: str,
    dest_path: str,
    temp_dest: str,
    stats_lock: threading.Lock,
    base_downloaded_ref: List[int],
    total_job_bytes: int,
    num_workers: int = 8,
    chunk_size: int = 24 * 1024 * 1024,
) -> None:
    """High-speed multi-part concurrent downloader with resume support and DNS error resilience."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # Probe file size and Range support
    file_size = 0
    supports_ranges = False
    current_final_url = url

    for probe_att in range(5):
        if download_state.get("cancel_requested"):
            return
        try:
            probe_req = urllib.request.Request(url, headers={**headers, "Range": "bytes=0-0"})
            with urllib.request.urlopen(probe_req, timeout=25) as resp:
                current_final_url = resp.geturl()
                crange = resp.headers.get("Content-Range")
                if crange and "/" in crange:
                    total_str = crange.split("/")[-1].strip()
                    if total_str.isdigit():
                        file_size = int(total_str)
                        supports_ranges = True
                elif resp.headers.get("Content-Length"):
                    file_size = int(resp.headers.get("Content-Length"))
                    supports_ranges = (resp.headers.get("Accept-Ranges") == "bytes")
                break
        except Exception as ex:
            if probe_att >= 4:
                print(f"[Downloader] Final probe warning: {ex}")
            time.sleep(1.0 + random.uniform(0.5, 1.5))

    t_start = time.time()
    last_speed_time = [t_start]
    last_speed_bytes = [base_downloaded_ref[0]]
    meta_file = temp_dest + ".meta.json"

    if supports_ranges and file_size > (chunk_size * 2):
        completed_chunks = set()
        if os.path.isfile(temp_dest) and os.path.isfile(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as mf:
                    meta = json.load(mf)
                    if meta.get("file_size") == file_size:
                        completed_chunks = set(meta.get("completed_chunks", []))
            except Exception:
                completed_chunks = set()

        # Pre-allocate sparse file if needed (cap at 100 GB to prevent Content-Range DoS)
        max_dl_bytes = 100 * (1024 ** 3)
        if file_size > max_dl_bytes:
            raise ValueError(f"Download size ({file_size} bytes) exceeds 100 GB safety limit.")
        if not os.path.isfile(temp_dest) or os.path.getsize(temp_dest) != file_size:
            with open(temp_dest, "wb") as f:
                if file_size > 0:
                    f.seek(file_size - 1)
                    f.write(b"\0")
            completed_chunks.clear()

        # Build chunks and credit already finished parts
        chunks = []
        curr = 0
        chunk_idx = 0
        already_credited_bytes = 0

        while curr < file_size:
            next_end = min(curr + chunk_size - 1, file_size - 1)
            part_len = (next_end - curr) + 1
            if chunk_idx in completed_chunks:
                already_credited_bytes += part_len
            else:
                chunks.append((chunk_idx, curr, next_end))
            curr = next_end + 1
            chunk_idx += 1

        with stats_lock:
            base_downloaded_ref[0] += already_credited_bytes
            if total_job_bytes > 0:
                download_state["progress_pct"] = round(
                    min(100.0, (base_downloaded_ref[0] / total_job_bytes) * 100), 1
                )

        def download_chunk(c_idx: int, start_b: int, end_b: int):
            nonlocal current_final_url
            if download_state.get("cancel_requested"):
                return
            chunk_headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Range": f"bytes={start_b}-{end_b}",
            }

            for attempt in range(6):
                if download_state.get("cancel_requested"):
                    return
                try:
                    creq = urllib.request.Request(current_final_url, headers=chunk_headers)
                    with urllib.request.urlopen(creq, timeout=35) as cresp:
                        with open(temp_dest, "r+b") as out_f:
                            out_f.seek(start_b)
                            while True:
                                if download_state.get("cancel_requested"):
                                    return
                                buf = cresp.read(512 * 1024)
                                if not buf:
                                    break
                                out_f.write(buf)
                                with stats_lock:
                                    n = len(buf)
                                    base_downloaded_ref[0] += n
                                    now = time.time()
                                    dt = now - last_speed_time[0]
                                    if dt >= 0.25:
                                        speed = (base_downloaded_ref[0] - last_speed_bytes[0]) / dt / (1024 * 1024)
                                        download_state["speed_mbps"] = round(speed, 2)
                                        last_speed_time[0] = now
                                        last_speed_bytes[0] = base_downloaded_ref[0]
                                    download_state["downloaded_bytes"] = base_downloaded_ref[0]
                                    if total_job_bytes > 0:
                                        download_state["progress_pct"] = round(
                                            min(100.0, (base_downloaded_ref[0] / total_job_bytes) * 100), 1
                                        )

                    with stats_lock:
                        completed_chunks.add(c_idx)
                        try:
                            with open(meta_file, "w", encoding="utf-8") as mf:
                                json.dump({"file_size": file_size, "completed_chunks": list(completed_chunks)}, mf)
                        except Exception:
                            pass
                    return

                except Exception as ex:
                    if attempt >= 5:
                        raise ex
                    # Refresh expired Hugging Face signed URLs if 403 occurs
                    if "403" in str(ex) or "expired" in str(ex).lower():
                        try:
                            ref_req = urllib.request.Request(url, headers={**headers, "Range": "bytes=0-0"})
                            with urllib.request.urlopen(ref_req, timeout=15) as ref_resp:
                                current_final_url = ref_resp.geturl()
                        except Exception:
                            pass
                    # Exponential backoff + randomized jitter to avoid Windows DNS rate limits
                    sleep_s = (1.5 ** attempt) + random.uniform(0.5, 2.0)
                    time.sleep(sleep_s)

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [executor.submit(download_chunk, c_id, s, e) for c_id, s, e in chunks]
            for fut in as_completed(futures):
                if download_state.get("cancel_requested"):
                    executor.shutdown(wait=False, cancel_futures=True)
                    return
                fut.result()

        # All chunks completed successfully, remove meta file
        if os.path.isfile(meta_file):
            try:
                os.remove(meta_file)
            except Exception:
                pass

    else:
        # Fallback single stream
        initial_bytes = os.path.getsize(temp_dest) if os.path.isfile(temp_dest) else 0
        if initial_bytes > 0:
            headers["Range"] = f"bytes={initial_bytes}-"
        req = urllib.request.Request(current_final_url, headers=headers)
        with urllib.request.urlopen(req, timeout=35) as resp:
            mode = "ab" if initial_bytes > 0 else "wb"
            with open(temp_dest, mode) as out_f:
                while True:
                    if download_state.get("cancel_requested"):
                        return
                    buf = resp.read(1024 * 1024)
                    if not buf:
                        break
                    out_f.write(buf)
                    with stats_lock:
                        n = len(buf)
                        base_downloaded_ref[0] += n
                        now = time.time()
                        dt = now - last_speed_time[0]
                        if dt >= 0.25:
                            speed = (base_downloaded_ref[0] - last_speed_bytes[0]) / dt / (1024 * 1024)
                            download_state["speed_mbps"] = round(speed, 2)
                            last_speed_time[0] = now
                            last_speed_bytes[0] = base_downloaded_ref[0]
                        download_state["downloaded_bytes"] = base_downloaded_ref[0]
                        if total_job_bytes > 0:
                            download_state["progress_pct"] = round(
                                min(100.0, (base_downloaded_ref[0] / total_job_bytes) * 100), 1
                            )

    if download_state.get("cancel_requested"):
        return

    if os.path.isfile(dest_path):
        os.remove(dest_path)
    os.rename(temp_dest, dest_path)


def _download_worker(missing_models: List[dict], target_dir: str):
    global download_state
    download_state["is_downloading"] = True
    download_state["done"] = False
    download_state["error"] = None
    download_state["cancel_requested"] = False

    total_size = sum(m.get("size_gb", 1.0) * (1024 ** 3) for m in missing_models)
    download_state["total_bytes"] = int(total_size)
    download_state["downloaded_bytes"] = 0

    stats_lock = threading.Lock()
    overall_downloaded = [0]

    for model in missing_models:
        if download_state.get("cancel_requested"):
            break

        fname = model["name"]
        cat_dir = model.get("directory", "diffusion_models")
        url = model["url"]
        dest_folder = os.path.join(target_dir, cat_dir)
        os.makedirs(dest_folder, exist_ok=True)
        dest_path = os.path.join(dest_folder, fname)

        download_state["current_file"] = fname
        temp_dest = dest_path + ".download"

        try:
            _download_file_highspeed(
                url=url,
                dest_path=dest_path,
                temp_dest=temp_dest,
                stats_lock=stats_lock,
                base_downloaded_ref=overall_downloaded,
                total_job_bytes=int(total_size),
                num_workers=8,
            )
        except Exception as ex:
            download_state["error"] = f"Download von {fname} fehlgeschlagen: {ex}"
            download_state["is_downloading"] = False
            return

    download_state["is_downloading"] = False
    if download_state.get("cancel_requested"):
        download_state["done"] = False
    else:
        download_state["done"] = True
        download_state["progress_pct"] = 100.0




def handle_get(handler, path: str, parsed) -> bool:
    if not path.startswith("/api/video/"):
        return False

    if path.startswith("/api/video/output/"):
        rel = urllib.parse.unquote(path[len("/api/video/output/"):])
        candidate_dirs = [get_output_dir(), DEFAULT_OUTPUT_DIR]
        try:
            c_out = _get_comfy().get_comfy_output_dir()
            if c_out and c_out not in candidate_dirs:
                candidate_dirs.append(c_out)
        except Exception:
            pass

        full_path = None
        for c_dir in candidate_dirs:
            abs_base = os.path.abspath(c_dir)
            cand = os.path.abspath(os.path.join(abs_base, rel.lstrip("/\\")))
            try:
                if os.path.commonpath([cand, abs_base]) == abs_base and os.path.isfile(cand):
                    full_path = cand
                    break
            except ValueError:
                continue

        if full_path and os.path.isfile(full_path):
            handler.send_response(200)
            low = full_path.lower()
            if low.endswith(".mp4"):
                handler.send_header("Content-Type", "video/mp4")
            elif low.endswith(".webm"):
                handler.send_header("Content-Type", "video/webm")
            elif low.endswith(".png"):
                handler.send_header("Content-Type", "image/png")
            elif low.endswith((".jpg", ".jpeg")):
                handler.send_header("Content-Type", "image/jpeg")
            elif low.endswith(".webp"):
                handler.send_header("Content-Type", "image/webp")
            elif low.endswith(".gif"):
                handler.send_header("Content-Type", "image/gif")
            elif low.endswith(".mp3"):
                handler.send_header("Content-Type", "audio/mpeg")
            elif low.endswith(".wav"):
                handler.send_header("Content-Type", "audio/wav")
            else:
                handler.send_header("Content-Type", "application/octet-stream")
            handler.send_header("Content-Length", str(os.path.getsize(full_path)))
            handler.end_headers()
            with open(full_path, "rb") as f:
                shutil.copyfileobj(f, handler.wfile)
            return
        handler.send_error(404, "File not found")
        return

    if path.startswith("/api/video/uploads/"):
        rel = urllib.parse.unquote(path[len("/api/video/uploads/"):])
        full_path = None
        for base_dir in _get_upload_search_dirs():
            abs_uploads = os.path.abspath(base_dir)
            cand = os.path.abspath(os.path.join(abs_uploads, rel.lstrip("/\\")))
            try:
                if os.path.commonpath([cand, abs_uploads]) == abs_uploads and os.path.isfile(cand):
                    full_path = cand
                    break
            except ValueError:
                continue

        if full_path and os.path.isfile(full_path):
            handler.send_response(200)
            low = full_path.lower()
            if low.endswith(".png"):
                handler.send_header("Content-Type", "image/png")
            elif low.endswith((".jpg", ".jpeg")):
                handler.send_header("Content-Type", "image/jpeg")
            elif low.endswith(".webp"):
                handler.send_header("Content-Type", "image/webp")
            elif low.endswith(".mp3"):
                handler.send_header("Content-Type", "audio/mpeg")
            elif low.endswith(".wav"):
                handler.send_header("Content-Type", "audio/wav")
            elif low.endswith(".flac"):
                handler.send_header("Content-Type", "audio/flac")
            elif low.endswith(".ogg"):
                handler.send_header("Content-Type", "audio/ogg")
            elif low.endswith(".m4a"):
                handler.send_header("Content-Type", "audio/mp4")
            else:
                handler.send_header("Content-Type", "application/octet-stream")
            handler.send_header("Content-Length", str(os.path.getsize(full_path)))
            handler.end_headers()
            with open(full_path, "rb") as f:
                shutil.copyfileobj(f, handler.wfile)
            return
        handler.send_error(404, "File not found")
        return

    if path == "/api/video/status":
        alive = _get_comfy().is_alive()
        if alive:
            hw = _get_comfy().get_hardware_profile()
        else:
            local_hw = detect_local_gpu()
            hw = {
                "connected": False,
                "gpu_name": local_hw["gpu_name"],
                "vram_gb": local_hw["vram_gb"],
                "profile": local_hw["profile"],
                "recommended_res": "1080p" if local_hw["vram_gb"] >= 18 else "720p",
                "max_shot_seconds": 10.0 if local_hw["vram_gb"] >= 18 else 6.0,
                "auto_upscale": False if local_hw["vram_gb"] >= 18 else True,
                "source": local_hw["source"],
            }

        node_installed = _get_comfy().check_minimax_director_node() if alive else False
        ffmpeg_ok = is_ffmpeg_available()

        _send_json(handler, {
            "comfy_alive": alive,
            "hardware": hw,
            "minimax_node_installed": node_installed,
            "ffmpeg_available": ffmpeg_ok,
        })
        return

    elif path == "/api/video/config":
        _send_json(handler, load_config())
        return

    elif path == "/api/video/models/check":
        query = urllib.parse.parse_qs(parsed.query)
        tier = query.get("tier", ["minimax_h3"])[0]
        include_opt = query.get("include_optional", ["0"])[0] in ("1", "true", "yes")
        custom_dir = query.get("custom_dir", [None])[0] or load_config().get("models_dir")
        status = check_models_status(
            comfy_base_dir=load_config().get("comfy_dir") or _get_comfy().get_comfy_base_dir(),
            custom_target_dir=custom_dir,
            tier=tier,
            comfy_available=_get_comfy().get_available_models() if _get_comfy().is_alive() else None,
            lang=get_server_lang(),
            include_optional=include_opt,
        )
        _send_json(handler, status)
        return

    elif path == "/api/video/models/download_progress":
        _send_json(handler, download_state)
        return

    elif path == "/api/video/jobs/active":
        _send_json(handler, active_job)
        return

    elif path == "/api/video/comfy/extensions":
        comfy_cfg_dir = load_config().get("comfy_dir", "")
        exts = _get_comfy().list_essential_extensions(comfy_cfg_dir, lang=get_server_lang())
        _send_json(handler, {"extensions": exts, "comfy_connected": _get_comfy().is_alive()})
        return

    elif path == "/api/video/media":
        files = []
        seen_names = set()
        scan_dirs = [get_output_dir(), DEFAULT_OUTPUT_DIR]
        try:
            c_out = _get_comfy().get_comfy_output_dir()
            if c_out and c_out not in scan_dirs:
                scan_dirs.append(c_out)
        except Exception:
            pass

        for s_dir in scan_dirs:
            if os.path.isdir(s_dir):
                try:
                    for f in sorted(os.listdir(s_dir), reverse=True):
                        if f.endswith((".mp4", ".webm", ".png", ".jpg")) and f not in seen_names:
                            seen_names.add(f)
                            fp = os.path.join(s_dir, f)
                            files.append({
                                "name": f,
                                "size_mb": round(os.path.getsize(fp) / (1024 * 1024), 2),
                                "modified": os.path.getmtime(fp),
                                "url": f"/api/video/output/{f}",
                                "path": fp,
                            })
                except Exception:
                    pass
        files.sort(key=lambda x: x["modified"], reverse=True)
        _send_json(handler, {"items": files})
        return

    elif path == "/api/video/luts":
        _send_json(handler, {"ok": True, "luts": list_available_luts()})
        return

    elif path == "/api/video/refpacks/list":
        comfy_cfg_dir = load_config().get("comfy_dir", "")
        data = _get_comfy().list_refpacks(comfy_cfg_dir)
        _send_json(handler, {"ok": True, **data})
        return

    super().do_GET()

    return False


def handle_post(handler, path: str, parsed, post_body: bytes | None) -> bool:
    if not path.startswith("/api/video/"):
        return False

    try:
        body = json.loads(post_body.decode("utf-8")) if post_body else {}
    except Exception:
        body = {}

    if path == "/api/video/adopt_studio_image":
        url_or_path = (body.get("url") or body.get("path") or "").strip()
        if not url_or_path:
            _send_json(handler, {"error": "Missing url or path"}, status=400)
            return True
        out_dir = get_output_dir()
        c_out = _get_comfy().get_comfy_output_dir()
        allowed_bases = [b for b in (out_dir, c_out, UPLOADS_DIR) if b]
        src_path = None
        if os.path.isfile(url_or_path) and any(_is_path_within(b, url_or_path) for b in allowed_bases):
            src_path = os.path.realpath(url_or_path)
        else:
            # Resolve /output/... or /api/gallery/file?... or /view?...
            parsed_ref = urllib.parse.urlparse(url_or_path)
            qs = urllib.parse.parse_qs(parsed_ref.query)
            if "path" in qs:
                cand_q = qs["path"][0]
                if os.path.isfile(cand_q) and any(_is_path_within(b, cand_q) for b in allowed_bases):
                    src_path = os.path.realpath(cand_q)
            elif parsed_ref.path.startswith("/output/") and out_dir:
                rel = urllib.parse.unquote(parsed_ref.path[len("/output/"):]).lstrip("/\\")
                cand = os.path.normpath(os.path.join(out_dir, rel))
                if _is_path_within(out_dir, cand) and os.path.isfile(cand):
                    src_path = cand
            elif "filename" in qs:
                fname = os.path.basename(qs["filename"][0])
                sub = qs.get("subfolder", [""])[0].lstrip("/\\")
                for base in (out_dir, c_out):
                    if base:
                        cand = os.path.normpath(os.path.join(base, sub, fname) if sub else os.path.join(base, fname))
                        if _is_path_within(base, cand) and os.path.isfile(cand):
                            src_path = cand
                            break
        if not src_path or not os.path.isfile(src_path):
            _send_json(handler, {"error": "Source image not found on disk"}, status=404)
            return True
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        ext = os.path.splitext(src_path)[1] or ".png"
        dst_name = f"studio_{int(time.time() * 1000)}{ext}"
        dst_path = os.path.join(UPLOADS_DIR, dst_name)
        shutil.copy2(src_path, dst_path)
        _send_json(handler, {"ok": True, "filename": dst_name, "url": f"/api/video/uploads/{dst_name}", "path": dst_path})
        return True


    if path == "/api/video/upload_image":
        # Saves base64 encoded image or raw file to data/uploads
        b64_data = body.get("image_base64", "")
        fname = body.get("filename", f"frame_{int(time.time() * 1000)}.png")
        # sanitize filename
        fname = os.path.basename(fname).replace(" ", "_")

        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]

        target_path = os.path.join(UPLOADS_DIR, fname)
        try:
            with open(target_path, "wb") as f:
                f.write(base64.b64decode(b64_data))
            _send_json(handler, {"ok": True, "url": f"/api/video/uploads/{fname}", "path": target_path})
        except Exception as ex:
            _send_json(handler, {"ok": False, "error": str(ex)}, status=500)
        return

    elif path == "/api/video/upload_audio":
        # Saves base64 encoded audio file (.mp3, .wav, .flac, .ogg, .m4a) to data/uploads
        b64_data = body.get("audio_base64", "")
        fname = body.get("filename", f"audio_{int(time.time() * 1000)}.mp3")
        fname = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', os.path.basename(fname))
        if not fname.lower().endswith((".mp3", ".wav", ".flac", ".ogg", ".m4a")):
            fname += ".mp3"

        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]

        target_path = os.path.join(UPLOADS_DIR, fname)
        try:
            with open(target_path, "wb") as f:
                f.write(base64.b64decode(b64_data))
            _send_json(handler, {"ok": True, "url": f"/api/video/uploads/{fname}", "path": target_path, "filename": fname})
        except Exception as ex:
            _send_json(handler, {"ok": False, "error": str(ex)}, status=500)
        return

    elif path == "/api/video/config":
        if "comfy_url" in body:
            raw_c_url = str(body.get("comfy_url") or "").strip()
            if raw_c_url:
                parsed_c = urllib.parse.urlparse(raw_c_url)
                if (
                    any(ch in raw_c_url for ch in ("\r", "\n", "\x00"))
                    or any(ch.isspace() for ch in raw_c_url)
                    or parsed_c.scheme not in ("http", "https")
                    or not parsed_c.netloc
                ):
                    _send_json(handler, {"ok": False, "error": "Ungültige comfy_url (nur http/https erlaubt)."}, status=400)
                    return True
                body["comfy_url"] = raw_c_url
        with _CONFIG_LOCK:
            current = load_config()
            updated = {**current, **body}
            save_config(updated)
        global comfy
        if "comfy_url" in body:
            comfy = ComfyClient(updated["comfy_url"], lang=updated.get("language", "de"))
        else:
            _get_comfy().lang = updated.get("language", "de")
        _send_json(handler, {"ok": True, "config": updated, "effective_output_dir": get_output_dir()})
        return

    elif path == "/api/video/open_output_folder":
        custom_dir = str(body.get("dir", "") or "").strip()
        allowed_open_dirs = [d for d in (get_output_dir(), UPLOADS_DIR, DATA_DIR) if d]
        if custom_dir and os.path.isdir(custom_dir) and any(_is_path_within(b, custom_dir) for b in allowed_open_dirs):
            target = os.path.realpath(custom_dir)
        else:
            target = get_output_dir()
        os.makedirs(target, exist_ok=True)
        try:
            if sys.platform == "win32":
                os.startfile(target)
            else:
                subprocess.Popen(["xdg-open", target])
            _send_json(handler, {"ok": True, "path": target})
        except Exception as ex:
            _send_json(handler, {"ok": False, "error": str(ex)}, status=500)
        return

    elif path == "/api/video/models/download":
        if download_state["is_downloading"]:
            _send_json(handler, {"ok": False, "error": "Ein Download läuft bereits."}, status=400)
            return

        tier = body.get("tier", "minimax_h3")
        model_name = (body.get("model_name") or "").strip()
        custom_dir = body.get("target_dir") or load_config().get("models_dir")
        status = check_models_status(
            comfy_base_dir=load_config().get("comfy_dir") or _get_comfy().get_comfy_base_dir(),
            custom_target_dir=custom_dir,
            tier=tier,
            comfy_available=_get_comfy().get_available_models() if _get_comfy().is_alive() else None,
        )

        if model_name:
            target_model = KNOWN_VIDEO_MODELS.get(model_name)
            if not target_model:
                _send_json(handler, {"ok": False, "error": f"Unbekanntes Modell: {model_name}"}, status=404)
                return
            req_gb = float(target_model.get("size_gb", 0.0)) + 0.5
            if status["free_space_gb"] < req_gb:
                _send_json(handler, {
                    "ok": False,
                    "error": f"Nicht genügend Speicherplatz auf {status['target_dir']}! Benötigt: {req_gb:.2f} GB, Frei: {status['free_space_gb']} GB",
                }, status=400)
                return
            models_to_dl = [dict(target_model)]
        else:
            if not status["has_sufficient_space"]:
                _send_json(handler, {
                    "ok": False,
                    "error": f"Nicht genügend Speicherplatz auf {status['target_dir']}! Benötigt: {status['total_download_size_gb']} GB, Frei: {status['free_space_gb']} GB"
                }, status=400)
                return
            models_to_dl = status["missing_models"]

        download_state["is_downloading"] = True
        download_state["cancel_requested"] = False
        download_state["error"] = None
        t = threading.Thread(
            target=_download_worker,
            args=(models_to_dl, status["target_dir"]),
            daemon=True,
        )
        t.start()
        _send_json(handler, {"ok": True, "message": "Download gestartet.", "target_dir": status["target_dir"]})
        return

    elif path == "/api/video/models/download_cancel":
        download_state["cancel_requested"] = True
        download_state["is_downloading"] = False
        download_state["error"] = "Download vom Benutzer abgebrochen."
        _send_json(handler, {"ok": True, "message": "Download abgebrochen."})
        return

    elif path == "/api/video/cancel_render":
        active_job["cancel_requested"] = True
        active_job["stage"] = "cancelled"
        try:
            _get_comfy().interrupt()
        except Exception:
            pass
        _send_json(handler, {"ok": True, "message": "Render-Abbruch angefordert."})
        return

    elif path == "/api/video/comfy/install_extension":
        repo_url = body.get("repo_url", "")
        folder_name = body.get("folder", "")
        if not repo_url or not folder_name:
            _send_json(handler, {"ok": False, "error": "Fehlende Parameter: repo_url und folder erforderlich."}, status=400)
            return

        comfy_cfg_dir = load_config().get("comfy_dir", "")
        ok, msg = _get_comfy().install_extension(repo_url, folder_name, comfy_cfg_dir)
        if ok:
            _send_json(handler, {"ok": True, "message": msg})
        else:
            _send_json(handler, {"ok": False, "error": msg}, status=500)
        return

    elif path == "/api/video/comfy/auto_fix_director":
        comfy_cfg_dir = load_config().get("comfy_dir", "")
        ready, msg, needs_restart = _get_comfy().ensure_director_node(comfy_cfg_dir)
        _send_json(handler, {
            "ok": ready,
            "message": msg,
            "needs_restart": needs_restart,
            "node_ready": _get_comfy().check_minimax_director_node(),
        })
        return

    elif path == "/api/video/comfy/restart":
        ok_reboot, msg = _get_comfy().restart_comfyui()
        _send_json(handler, {
            "ok": ok_reboot,
            "message": msg,
            "comfy_alive": _get_comfy().is_alive(),
            "node_ready": _get_comfy().check_minimax_director_node(),
        })
        return

    elif path == "/api/video/refpacks/create":
        if not _get_comfy().is_alive():
            _send_json(handler, {"ok": False, "error": msg_comfy_offline()}, status=400)
            return
        pack_name = str(body.get("name") or "").strip()
        raw_imgs = body.get("images") or ([body.get("image")] if body.get("image") else [])
        img_paths = [p for p in (resolve_image_file(x) for x in raw_imgs) if p]
        if not img_paths:
            _send_json(handler, {"ok": False, "error": "Bitte zuerst ein gültiges Bild auswählen oder hochladen."}, status=400)
            return
        mp = float(body.get("reference_megapixels", 0.3) or 0.3)
        overwrite = bool(body.get("overwrite", False))
        use_image_vae = bool(body.get("use_image_vae", False))
        ok, res = _get_comfy().encode_image_refpack(
            image_paths=img_paths,
            pack_name=pack_name,
            reference_megapixels=mp,
            overwrite=overwrite,
            use_image_vae=use_image_vae,
        )
        _send_json(handler, {"ok": ok, "filename": res if ok else None, "error": None if ok else res}, status=200 if ok else 400)
        return

    elif path == "/api/video/stitch":
        clips = body.get("clips", [])
        output_name = body.get("output_name", f"film_{int(time.time())}.mp4")
        upscale = body.get("upscale_1080p", False)
        bgm = body.get("bgm_path", None)
        lut_path = resolve_lut_file(body.get("lut", ""))

        # Resolve clip URLs, filenames or absolute paths to real filesystem files
        resolved_clips: List[str] = []
        candidate_dirs = [get_output_dir(), DEFAULT_OUTPUT_DIR]
        try:
            c_out = _get_comfy().get_comfy_output_dir()
            if c_out and c_out not in candidate_dirs:
                candidate_dirs.append(c_out)
        except Exception:
            pass

        for c in clips:
            if not c:
                continue
            c_str = str(c).strip()
            if os.path.isfile(c_str):
                resolved_clips.append(os.path.abspath(c_str))
                continue
            if c_str.startswith("/api/video/output/"):
                rel = urllib.parse.unquote(c_str[len("/api/video/output/"):].lstrip("/\\"))
                found = False
                for c_dir in candidate_dirs:
                    cand = os.path.abspath(os.path.join(c_dir, rel))
                    if os.path.isfile(cand):
                        resolved_clips.append(cand)
                        found = True
                        break
                if not found:
                    resolved_clips.append(os.path.abspath(os.path.join(get_output_dir(), rel)))
            elif c_str.startswith("/api/video/uploads/"):
                rel = urllib.parse.unquote(c_str[len("/api/video/uploads/"):].lstrip("/\\"))
                cand = os.path.abspath(os.path.join(UPLOADS_DIR, rel))
                resolved_clips.append(cand)
            else:
                fname = os.path.basename(c_str)
                found = False
                for c_dir in candidate_dirs:
                    cand = os.path.abspath(os.path.join(c_dir, fname))
                    if os.path.isfile(cand):
                        resolved_clips.append(cand)
                        found = True
                        break
                if not found:
                    resolved_clips.append(os.path.abspath(os.path.join(get_output_dir(), fname)))

        target = os.path.join(get_output_dir(), output_name)
        ok, msg = concat_segments(
            resolved_clips,
            target,
            upscale_1080p=upscale,
            bgm_path=bgm,
            lut_path=lut_path,
        )
        if ok:
            _send_json(handler, {"ok": True, "output_file": f"/api/video/output/{output_name}", "path": target})
        else:
            _send_json(handler, {"ok": False, "error": msg}, status=500)
        return

    elif path == "/api/video/render_scene":
        scene_id = body.get("scene_id", 1)
        prompt = body.get("prompt", "")
        duration = float(body.get("duration", 4.0))
        resolution = body.get("resolution", "720p")
        fps = int(body.get("fps", 24))
        seed = int(body.get("seed", 424242))
        engine = body.get("engine", "comfyui" if _get_comfy().is_alive() else "animatic")
        first_frame = resolve_image_file(body.get("first_frame"))
        last_frame = resolve_image_file(body.get("last_frame"))
        dialogue = body.get("dialogue", "")
        dialogue_lang = body.get("dialogue_lang", "German")
        camera_preset = body.get("camera_preset", "")
        subject_name = body.get("subject_name", "")
        music_style = body.get("music_style", "")
        turbo = bool(body.get("turbo", True))
        refpacks = body.get("refpacks") or []

        clip_name = f"scene_{scene_id}_{int(time.time())}.mp4"
        clip_path = os.path.join(get_output_dir(), clip_name)

        if engine == "comfyui":
            if not _get_comfy().is_alive():
                _send_json(handler, {
                    "ok": False,
                    "error": msg_comfy_offline()
                }, status=400)
                return
            cfg_now = load_config()
            v_engine = body.get("video_engine") or cfg_now.get("video_engine", "minimax_h3")
            if v_engine == "wan_2.2":
                ok, out_path = _get_comfy().render_wan22_video(
                    prompt=prompt,
                    duration=duration,
                    fps=fps,
                    resolution=resolution,
                    seed=seed,
                    dest_path=clip_path,
                    first_frame_path=first_frame,
                    cache_mode=cfg_now.get("cache_mode", "auto"),
                )
            else:
                ok, out_path = _get_comfy().render_scene(
                    prompt=prompt,
                    duration=duration,
                    fps=fps,
                    resolution=resolution,
                    seed=seed,
                    dest_path=clip_path,
                    first_frame_path=first_frame,
                    last_frame_path=last_frame,
                    dialogue=dialogue,
                    dialogue_lang=dialogue_lang,
                    camera_preset=camera_preset,
                    subject_name=subject_name,
                    music_style=music_style,
                    turbo=turbo,
                    refpacks=refpacks,
                )
        else:
            ok, out_path = generate_preview_clip(
                image_path=first_frame,
                last_image_path=last_frame,
                prompt=prompt,
                duration=duration,
                output_path=clip_path,
                fps=fps,
                resolution=resolution,
                title=f"Scene {scene_id}",
            )

        if ok:
            _send_json(handler, {"ok": True, "video_url": f"/api/video/output/{clip_name}", "path": out_path})
        else:
            _send_json(handler, {"ok": False, "error": out_path}, status=500)
        return

    elif path == "/api/video/render_quick":
        if active_job["is_running"]:
            _send_json(handler, {"ok": False, "error": msg_job_running()}, status=400)
            return

        title = body.get("title", "")
        prompt = body.get("prompt", "")
        duration = float(body.get("duration", 5.0))
        resolution = body.get("resolution", "720p")
        fps = int(body.get("fps", 24))
        seed = int(body.get("seed", 424242))
        engine = body.get("engine", "comfyui" if _get_comfy().is_alive() else "animatic")
        first_frame = resolve_image_file(body.get("first_frame"))
        last_frame = resolve_image_file(body.get("last_frame"))
        auto_sound = bool(body.get("auto_sound", False))
        audio_file = body.get("audio_file", "")
        audio_start = float(body.get("audio_start", 0.0))
        audio_volume = float(body.get("audio_volume", 1.0))
        refpacks = body.get("refpacks") or []
        morph_mode = bool(body.get("morph_mode", False))
        lora_strength = float(body.get("lora_strength", 0.85))
        end_hold = max(0.0, min(5.0, float(body.get("end_hold", 0.0) or 0.0)))
        auto_upscale = bool(body.get("auto_upscale", False))
        upscale_engine = body.get("upscale_engine", "ffmpeg")
        refpacks = body.get("refpacks") or []

        extra_lora = None
        if morph_mode and engine == "comfyui":
            if not _get_comfy().is_alive():
                _send_json(handler, {"ok": False, "error": msg_comfy_offline()}, status=400)
                return
            extra_lora = _get_comfy().resolve_morph_lora()
            if not extra_lora:
                _send_json(handler, {
                    "ok": False,
                    "missing_tier": "morph_lora",
                    "error": "Die Morph-LoRA (animatediff_style_h3.safetensors, 0.16 GB) fehlt in ComfyUI.",
                }, status=400)
                return

        clip_name = sanitize_video_title(title, default_prefix="morph_clip" if morph_mode else "quick_clip")
        clip_path = os.path.join(get_output_dir(), clip_name)
        t_start = time.time()

        active_job["is_running"] = True
        active_job["type"] = "quick_clip"
        active_job["stage"] = "Quick Clip Generierung..."
        active_job["progress"] = 0
        active_job["progress_pct"] = 0
        active_job["error"] = None
        active_job["cancel_requested"] = False
        active_job["start_time"] = t_start

        try:
            if engine == "comfyui":
                if not _get_comfy().is_alive():
                    _send_json(handler, {
                        "ok": False,
                        "error": msg_comfy_offline()
                    }, status=400)
                    return
                def _quick_progress(pct, msg):
                    active_job["progress"] = pct
                    active_job["progress_pct"] = pct
                    active_job["stage"] = msg

                def _quick_cancel():
                    return active_job.get("cancel_requested", False)

                cfg_now = load_config()
                v_engine = body.get("video_engine") or cfg_now.get("video_engine", "minimax_h3")
                if v_engine == "wan_2.2":
                    ok, out_path = _get_comfy().render_wan22_video(
                        prompt=prompt,
                        duration=duration,
                        fps=fps,
                        resolution=resolution,
                        seed=seed,
                        dest_path=clip_path,
                        first_frame_path=first_frame,
                        cache_mode=cfg_now.get("cache_mode", "auto"),
                        progress_callback=_quick_progress,
                    )
                else:
                    ok, out_path = _get_comfy().render_scene(
                        prompt=prompt,
                        duration=duration,
                        fps=fps,
                        resolution=resolution,
                        seed=seed,
                        dest_path=clip_path,
                        first_frame_path=first_frame,
                        last_frame_path=last_frame,
                        turbo=bool(body.get("turbo", True)),
                        extra_lora=extra_lora,
                        extra_lora_strength=lora_strength,
                        refpacks=refpacks,
                        progress_callback=_quick_progress,
                        cancel_check=_quick_cancel,
                    )
            else:
                ok, out_path = generate_preview_clip(
                    image_path=first_frame,
                    last_image_path=last_frame,
                    prompt=prompt,
                    duration=duration,
                    output_path=clip_path,
                    fps=fps,
                    resolution=resolution,
                    title=title or "Quick Clip",
                )

            elapsed_sec = round(time.time() - t_start, 1)
            mins = int(elapsed_sec // 60)
            secs = int(elapsed_sec % 60)
            formatted_time = f"{mins} Min. {secs} Sek." if mins > 0 else f"{secs} Sekunden"

            if ok:
                if end_hold > 0 and os.path.isfile(out_path):
                    _quick_progress(88, f"Halte Endframe ({end_hold:.1f}s)...")
                    apply_end_frame_hold(out_path, end_hold)

                used_sound_name = None
                if auto_sound:
                    resolved_audio = None
                    if audio_file:
                        resolved_audio = resolve_audio_file(audio_file)
                        if resolved_audio:
                            used_sound_name = os.path.basename(resolved_audio)
                    else:
                        resolved_audio, mood_name = match_auto_soundscape(prompt)
                        if resolved_audio:
                            used_sound_name = f"Auto: {mood_name}"

                    if resolved_audio and os.path.isfile(resolved_audio):
                        ok_mix, mix_msg = mix_audio_to_quick_clip(
                            video_path=out_path,
                            audio_path=resolved_audio,
                            output_path=out_path,
                            start_time=audio_start if audio_file else 0.0,
                            volume=audio_volume,
                        )
                        if not ok_mix:
                            print(f"[QuickClip] Audio-Mix Warnung: {mix_msg}")

                if auto_upscale and os.path.isfile(out_path):
                    _quick_progress(92, f"Upscaling ({upscale_engine.upper()}) auf 1080p+...")
                    apply_upscale_if_requested(
                        video_path=out_path,
                        upscale_engine=upscale_engine,
                        fps=fps,
                        progress_cb=_quick_progress,
                        cancel_cb=_quick_cancel,
                    )

                _send_json(handler, {
                    "ok": True,
                    "video_url": f"/api/video/output/{clip_name}",
                    "path": out_path,
                    "elapsed_sec": elapsed_sec,
                    "duration_formatted": formatted_time,
                    "sound_track": used_sound_name,
                })
            else:
                _send_json(handler, {
                    "ok": False,
                    "error": out_path,
                    "elapsed_sec": elapsed_sec,
                    "duration_formatted": formatted_time
                }, status=500)
            return
        except Exception as ex:
            print(f"[LongClip] Unerwarteter Ausnahmefehler: {ex}")
            _send_json(handler, {
                "ok": False,
                "error": f"Unerwarteter Fehler bei Long-Clip-Verarbeitung: {ex}",
            }, status=500)
            return
        finally:
            active_job["is_running"] = False

    elif path == "/api/video/render_long_clip":
        if active_job["is_running"]:
            _send_json(handler, {"ok": False, "error": msg_job_running()}, status=400)
            return

        title = body.get("title", "")
        prompt = body.get("prompt", "")
        duration = float(body.get("duration", 30.0))
        resolution = body.get("resolution", "720p")
        fps = int(body.get("fps", 24))
        seed = int(body.get("seed", 424242))
        turbo = bool(body.get("turbo", True))
        engine = body.get("engine", "comfyui" if _get_comfy().is_alive() else "animatic")
        first_frame = resolve_image_file(body.get("first_frame"))
        last_frame = resolve_image_file(body.get("last_frame"))
        audio_file = body.get("audio_file", "")
        audio_start = float(body.get("audio_start", 0.0))
        audio_volume = float(body.get("audio_volume", 1.0))
        refpacks = body.get("refpacks") or []

        clip_name = sanitize_video_title(title, default_prefix="long_clip")
        clip_path = os.path.join(get_output_dir(), clip_name)
        t_start = time.time()

        active_job["is_running"] = True
        active_job["type"] = "long_clip"
        active_job["stage"] = "Long Clip Generierung..."
        active_job["error"] = None
        active_job["cancel_requested"] = False
        active_job["start_time"] = t_start

        try:
            resolved_audio = None
            trimmed_audio = None
            if audio_file:
                resolved_audio = resolve_audio_file(audio_file)
                if resolved_audio and os.path.isfile(resolved_audio) and is_ffmpeg_available():
                    temp_dir = tempfile.mkdtemp(prefix="tavideo_longaudio_")
                    trimmed_audio = os.path.join(temp_dir, "trimmed_" + os.path.basename(resolved_audio))
                    cmd = [
                        "ffmpeg", "-y",
                        "-ss", str(max(0.0, audio_start)),
                        "-t", str(duration),
                        "-i", resolved_audio,
                        "-map_chapters", "-1",
                        "-filter:a", f"volume={max(0.0, min(2.0, audio_volume))}",
                        trimmed_audio,
                    ]
                    try:
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180, check=True)
                    except Exception as ex:
                        print(f"[LongClip] Audio trim warning: {ex}")
                        trimmed_audio = resolved_audio

            if engine == "comfyui":
                if not _get_comfy().is_alive():
                    _send_json(handler, {
                        "ok": False,
                        "error": msg_comfy_offline()
                    }, status=400)
                    return

                def _long_progress(pct, msg):
                    active_job["progress"] = pct
                    active_job["progress_pct"] = pct
                    active_job["stage"] = msg

                def _long_cancel():
                    return active_job.get("cancel_requested", False)

                cfg_now = load_config()
                v_engine = body.get("video_engine") or cfg_now.get("video_engine", "minimax_h3")
                if v_engine == "wan_2.2":
                    ok, out_path = _get_comfy().render_wan22_video(
                        prompt=prompt,
                        duration=duration,
                        fps=fps,
                        resolution=resolution,
                        seed=seed,
                        dest_path=clip_path,
                        first_frame_path=first_frame,
                        cache_mode=cfg_now.get("cache_mode", "auto"),
                        progress_callback=_long_progress,
                    )
                else:
                    ok, out_path = _get_comfy().render_long_clip_ai(
                        prompt=prompt,
                        duration=duration,
                        fps=fps,
                        resolution=resolution,
                        seed=seed,
                        dest_path=clip_path,
                        first_frame_path=first_frame,
                        last_frame_path=last_frame,
                        audio_file_path=trimmed_audio or resolved_audio,
                        turbo=turbo,
                        refpacks=refpacks,
                        progress_callback=_long_progress,
                        cancel_check=_long_cancel,
                    )
            else:
                ok, out_path = generate_preview_clip(
                    image_path=first_frame,
                    last_image_path=last_frame,
                    prompt=prompt,
                    duration=duration,
                    output_path=clip_path,
                    fps=fps,
                    resolution=resolution,
                    title=title or "Long Clip",
                )

            elapsed_sec = round(time.time() - t_start, 1)
            mins = int(elapsed_sec // 60)
            secs = int(elapsed_sec % 60)
            formatted_time = f"{mins} Min. {secs} Sek." if mins > 0 else f"{secs} Sekunden"

            if ok:
                used_sound_name = None
                if resolved_audio and os.path.isfile(resolved_audio):
                    used_sound_name = os.path.basename(resolved_audio)
                    has_audio_stream = False
                    try:
                        probe = subprocess.run(
                            ["ffprobe", "-v", "error", "-show_streams", "-select_streams", "a", "-of", "json", out_path],
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=30
                        )
                        if probe.stdout and '"codec_type": "audio"' in probe.stdout:
                            has_audio_stream = True
                    except Exception:
                        has_audio_stream = False

                    if not has_audio_stream:
                        ok_mix, mix_msg = mix_audio_to_quick_clip(
                            video_path=out_path,
                            audio_path=trimmed_audio or resolved_audio,
                            output_path=out_path,
                            start_time=0.0 if trimmed_audio else audio_start,
                            volume=1.0 if trimmed_audio else audio_volume,
                        )
                        if not ok_mix:
                            print(f"[LongClip] Audio-Mix Warnung: {mix_msg}")

                _send_json(handler, {
                    "ok": True,
                    "video_url": f"/api/video/output/{clip_name}",
                    "path": out_path,
                    "elapsed_sec": elapsed_sec,
                    "duration_formatted": formatted_time,
                    "sound_track": used_sound_name,
                })
            else:
                _send_json(handler, {
                    "ok": False,
                    "error": out_path,
                    "elapsed_sec": elapsed_sec,
                    "duration_formatted": formatted_time
                }, status=500)
            return
        finally:
            active_job["is_running"] = False

    elif path == "/api/video/render_storyboard":
        if active_job["is_running"]:
            _send_json(handler, {"ok": False, "error": msg_job_running()}, status=400)
            return

        scenes = body.get("scenes", [])
        if not scenes:
            _send_json(handler, {"ok": False, "error": msg_no_scenes()}, status=400)
            return

        title = body.get("title", "")
        resolution = body.get("resolution", "720p")
        fps = int(body.get("fps", 24))
        seed = int(body.get("seed", 424242))
        auto_upscale = bool(body.get("auto_upscale", False))
        bgm_path = body.get("bgm_path", "")
        music_style = body.get("music_style", "")
        engine = body.get("engine", "comfyui" if _get_comfy().is_alive() else "animatic")
        turbo = bool(body.get("turbo", True))
        lut = str(body.get("lut", "") or "").strip()

        if engine == "comfyui" and not _get_comfy().is_alive():
            _send_json(handler, {
                "ok": False,
                "error": msg_comfy_offline()
            }, status=400)
            return

        active_job["is_running"] = True
        active_job["type"] = "storyboard"
        active_job["stage"] = "Initialisiere Storyboard-Generierung..."
        active_job["error"] = None
        active_job["cancel_requested"] = False
        active_job["start_time"] = time.time()
        active_job["progress_pct"] = 0
        active_job["elapsed_sec"] = 0
        active_job["duration_formatted"] = ""

        t = threading.Thread(
            target=_render_storyboard_worker,
            args=(scenes, resolution, fps, seed, auto_upscale, bgm_path, engine, title, music_style, turbo, lut),
            daemon=True,
        )
        t.start()
        _send_json(handler, {"ok": True, "message": "Storyboard-Rendering gestartet.", "engine": engine})
        return

    elif path == "/api/video/render_lipsync":
        if active_job["is_running"]:
            _send_json(handler, {"ok": False, "error": msg_job_running()}, status=400)
            return

        portrait_ref = body.get("portrait_image", "")
        second_ref = body.get("second_image", "")
        audio_ref = body.get("audio_file", "")

        portrait_path = resolve_image_file(portrait_ref)
        second_path = resolve_image_file(second_ref)
        audio_path = resolve_audio_file(audio_ref)

        if not portrait_path or not os.path.isfile(portrait_path):
            _send_json(handler, {"ok": False, "error": msg_portrait_required()}, status=400)
            return
        if not audio_path or not os.path.isfile(audio_path):
            _send_json(handler, {"ok": False, "error": msg_audio_required()}, status=400)
            return

        title = body.get("title", "")
        prompt = body.get("prompt", "")
        cut_instruction = body.get("cut_instruction", "")
        start_time = float(body.get("start_time", 0.0))
        duration = float(body.get("duration", 10.0))
        resolution = body.get("resolution", "480p")
        fps = int(body.get("fps", 24))
        seed = int(body.get("seed", 424242))
        visual_strength = float(body.get("visual_strength", 0.99))
        use_demucs = bool(body.get("use_demucs", False))
        use_captions = bool(body.get("use_captions", False))
        captions_text = body.get("captions_text", "")
        subject_name = body.get("subject_name", "")
        dialogue_text = body.get("dialogue_text", "")
        dialogue_lang = body.get("dialogue_lang", "German")
        music_style = body.get("music_style", "")
        camera_preset = body.get("camera_preset", "")
        align_to_activity_gap = bool(body.get("align_to_activity_gap", True))
        engine = body.get("engine", "comfyui" if _get_comfy().is_alive() else "animatic")

        bgm_ref = body.get("bgm_file", "")
        bgm_path = resolve_audio_file(bgm_ref) if bgm_ref else None
        bgm_volume = float(body.get("bgm_volume", 0.25))
        turbo = bool(body.get("turbo", True))

        if engine == "comfyui" and not _get_comfy().is_alive():
            _send_json(handler, {
                "ok": False,
                "error": msg_comfy_offline()
            }, status=400)
            return

        active_job["is_running"] = True
        active_job["type"] = "lipsync"
        active_job["stage"] = "Initialisiere Lipsync-Generierung..."
        active_job["error"] = None
        active_job["cancel_requested"] = False
        active_job["start_time"] = time.time()
        active_job["progress_pct"] = 0
        active_job["elapsed_sec"] = 0
        active_job["duration_formatted"] = ""

        t = threading.Thread(
            target=_render_lipsync_worker,
            args=(
                portrait_path,
                second_path,
                audio_path,
                title,
                prompt,
                cut_instruction,
                start_time,
                duration,
                resolution,
                fps,
                seed,
                visual_strength,
                use_demucs,
                use_captions,
                captions_text,
                engine,
                subject_name,
                dialogue_text,
                dialogue_lang,
                music_style,
                camera_preset,
                align_to_activity_gap,
                bgm_path,
                bgm_volume,
                turbo,
            ),
            daemon=True,
        )
        t.start()
        _send_json(handler, {"ok": True, "message": "Lipsync-Rendering gestartet.", "engine": engine})
        return

    elif path == "/api/video/transcribe_audio":
        audio_ref = body.get("audio_file", "")
        audio_path = resolve_audio_file(audio_ref)
        if not audio_path or not os.path.isfile(audio_path):
            _send_json(handler, {"ok": False, "error": "Bitte zuerst eine Audiodatei hochladen."}, status=400)
            return
        start_time = float(body.get("start_time", 0.0))
        duration = float(body.get("duration", 15.0))
        language = body.get("language", "German")
        ok_tr, res_tr = transcribe_audio_local(audio_path, start_time, duration, language)
        if ok_tr:
            try:
                parsed_res = json.loads(res_tr)
                _send_json(handler, {"ok": True, **parsed_res})
            except Exception:
                _send_json(handler, {"ok": True, "text": res_tr, "srt": "", "segments": []})
        else:
            _send_json(handler, {"ok": False, "error": res_tr}, status=400)
        return

    elif path == "/api/video/ai/storyboard_assistant":
        idea = body.get("idea", "")
        shot_count = int(body.get("shot_count", 4))
        vibe = body.get("vibe", "cinematic")

        storyboard, provider = generate_ai_storyboard_director(idea, shot_count, vibe, load_config())
        _send_json(handler, {"ok": True, "storyboard": storyboard, "provider": provider})
        return

    elif path == "/api/video/ai/analyze_image":
        img_ref = str(body.get("image_url", "")).strip()
        img_path = resolve_image_file(img_ref)
        if not img_path or not os.path.isfile(img_path):
            _send_json(handler, {"ok": False, "error": "Bilddatei nicht gefunden."}, status=400)
            return
        prompt_res, prov_used = analyze_image_prompt(img_path, load_config())
        if not prompt_res:
            _send_json(handler, {
                "ok": False,
                "error": "Kein VLM-Modell (Ollama Vision oder Gemini API Key) verfügbar.",
            }, status=400)
            return
        _send_json(handler, {"ok": True, "prompt": prompt_res, "provider": prov_used})
        return

    return False

def _get_upload_search_dirs() -> List[str]:
    """Return current and legacy tA-VideoMaker upload directories."""
    dirs = [UPLOADS_DIR]
    for cand in (
        os.path.join(APP_DIR, "data", "uploads"),
        os.path.join(BUNDLE_DIR, "data", "uploads"),
        os.path.join(APP_DIR, "..", "tA-VideoMaker", "dist", "data", "uploads"),
        os.path.join(APP_DIR, "..", "tA-VideoMaker", "data", "uploads"),
    ):
        abs_c = os.path.abspath(cand)
        if abs_c not in dirs and os.path.isdir(abs_c):
            dirs.append(abs_c)
    return dirs


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


def _get_allowed_media_dirs() -> List[str]:
    """Return directories from which local media files may be resolved."""
    dirs = list(_get_upload_search_dirs())
    out_dir = get_output_dir()
    if out_dir:
        dirs.append(out_dir)
    for d in (
        DATA_DIR,
        os.path.join(APP_DIR, "data") if APP_DIR else "",
        os.path.join(BUNDLE_DIR, "data") if BUNDLE_DIR else "",
        os.path.join(BUNDLE_DIR, "assets") if BUNDLE_DIR else "",
    ):
        if d:
            abs_d = os.path.abspath(d)
            if abs_d not in dirs and os.path.isdir(abs_d):
                dirs.append(abs_d)
    return dirs


def resolve_image_file(img_ref: Optional[str]) -> Optional[str]:
    """Resolves a web URL like /api/video/uploads/abc.png or allowed local path to absolute file path."""
    if not img_ref:
        return None
    for prefix in ("/api/video/uploads/", "/uploads/"):
        if img_ref.startswith(prefix):
            rel = urllib.parse.unquote(img_ref[len(prefix):]).lstrip("/\\")
            for cand_dir in _get_upload_search_dirs():
                p = os.path.abspath(os.path.join(cand_dir, rel))
                if _is_path_within(cand_dir, p) and os.path.isfile(p):
                    return os.path.realpath(p)
    if os.path.isfile(img_ref):
        abs_p = os.path.realpath(os.path.abspath(img_ref))
        if any(_is_path_within(base, abs_p) for base in _get_allowed_media_dirs()):
            return abs_p
    return None


def resolve_audio_file(audio_ref: Optional[str]) -> Optional[str]:
    """Resolves a web URL like /uploads/song.mp3 or allowed local path to absolute file path."""
    if not audio_ref:
        return None
    if audio_ref.startswith("/api/video/uploads/"):
        rel = urllib.parse.unquote(audio_ref[len("/api/video/uploads/"):]).lstrip("/\\")
        for cand_dir in _get_upload_search_dirs():
            p = os.path.abspath(os.path.join(cand_dir, rel))
            if _is_path_within(cand_dir, p) and os.path.isfile(p):
                return os.path.realpath(p)
    if os.path.isfile(audio_ref):
        abs_p = os.path.realpath(os.path.abspath(audio_ref))
        if any(_is_path_within(base, abs_p) for base in _get_allowed_media_dirs()):
            return abs_p
    return None


SOUNDSCAPE_KEYWORDS: Dict[str, List[str]] = {
    "nature_wind_birds.mp3": [
        "natur", "nature", "wald", "forest", "wind", "baum", "tree", "vogel", "bird", "birds",
        "berg", "mountain", "mountains", "alpin", "alpine", "see", "lake", "adler", "eagle",
        "outdoor", "gras", "grass", "wiese", "meadow", "sunset", "sunrise", "sonnenuntergang",
        "sonnenaufgang", "tier", "wildlife", "hügel", "hill", "fluss", "river", "stream",
        "landschaft", "landscape", "wildnis", "wilderness", "herbst", "autumn", "frühling", "spring"
    ],
    "ocean_waves_breeze.mp3": [
        "meer", "ocean", "sea", "ozean", "wasser", "water", "welle", "wellen", "wave", "waves",
        "strand", "beach", "küste", "coast", "coastal", "insel", "island", "surf", "surfen",
        "ufer", "shore", "boot", "boat", "schiff", "ship", "underwater", "unterwasser", "hafen", "harbor"
    ],
    "rain_thunder_storm.mp3": [
        "regen", "rain", "gewitter", "thunder", "storm", "sturm", "blitz", "lightning", "nass",
        "wet", "wolken", "clouds", "puddle", "pfütze", "regenschirm", "umbrella", "dunkel", "dark",
        "unwetter", "drizzle", "heavy rain"
    ],
    "cyberpunk_neon_synth.mp3": [
        "cyberpunk", "neon", "futur", "future", "synth", "synthwave", "robot", "roboter", "cyborg",
        "hologram", "hologramm", "ki", "ai", "matrix", "dystop", "blade runner", "high-tech",
        "hightech", "techno", "sci-fi", "scifi", "flying car", "android", "cyber"
    ],
    "space_deep_drone.mp3": [
        "space", "weltall", "all", "cosmos", "kosmos", "galaxy", "galaxie", "stern", "sterne",
        "star", "stars", "planet", "planeten", "nebel", "nebula", "orbit", "astronaut", "alien",
        "universum", "universe", "schwerelos", "deep space", "interstellar"
    ],
    "action_tension_drive.mp3": [
        "action", "speed", "schnell", "fast", "auto", "car", "race", "racing", "rennen", "chase",
        "verfolgung", "fahrt", "drive", "drift", "driften", "sport", "rush", "adrenalin",
        "adrenaline", "motor", "vehicle", "fahrzeug", "flucht", "explosion", "kampf"
    ],
    "fantasy_magical_wonder.mp3": [
        "fantasy", "magie", "magic", "magisch", "magical", "fee", "fairy", "mystic", "mystisch",
        "mystical", "zauber", "zauberer", "wizard", "schloss", "castle", "drache", "dragon",
        "märchen", "enchanted", "verzaubert", "fabel", "mittelalter", "medieval"
    ],
    "urban_city_traffic.mp3": [
        "stadt", "city", "urban", "straße", "street", "verkehr", "traffic", "metro", "u-bahn",
        "metropole", "wolkenkratzer", "skyscraper", "downtown", "crowd", "menschenmenge", "gasse", "alley"
    ],
    "acoustic_peaceful_calm.mp3": [
        "friedlich", "peaceful", "ruhig", "calm", "relax", "entspannt", "akustik", "acoustic",
        "sanft", "gentle", "warm", "gemütlich", "cozy", "morgen", "morning", "meditation",
        "soft", "love", "liebe", "romantisch", "romantic", "kaffee", "coffee", "lächeln", "smile"
    ],
    "cinematic_epic_trailer.mp3": [
        "episch", "epic", "cinematic", "trailer", "held", "hero", "heroic", "battle", "fight",
        "krieger", "warrior", "climax", "dramatisch", "dramatic", "blockbuster", "orchester",
        "orchestral", "monumental", "kino", "movie", "film"
    ]
}


def find_sound_file_path(filename: str) -> Optional[str]:
    """Finds a soundscape file in candidate directories (media/sounds, BUNDLE_DIR, APP_DIR)."""
    cand_dirs = [
        os.path.join(APP_DIR, "media", "sounds"),
        os.path.join(BUNDLE_DIR, "media", "sounds"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media", "sounds"),
    ]
    for d in cand_dirs:
        p = os.path.abspath(os.path.join(d, filename))
        if os.path.isfile(p):
            return p
    return None


def _get_lut_dirs() -> List[str]:
    return [
        os.path.join(APP_DIR, "media", "luts"),
        os.path.join(BUNDLE_DIR, "media", "luts"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media", "luts"),
    ]


def _read_cube_title(cube_path: str, fallback: str) -> str:
    try:
        with open(cube_path, "r", encoding="utf-8", errors="ignore") as f:
            for _ in range(10):
                line = f.readline()
                if not line:
                    break
                m = re.match(r'^\s*TITLE\s+"([^"]+)"', line, re.IGNORECASE)
                if m:
                    return m.group(1).strip()
    except Exception:
        pass
    return fallback


def list_available_luts() -> List[dict]:
    """Lists all available .cube LUT files from media/luts."""
    luts: List[dict] = []
    seen = set()
    for d in _get_lut_dirs():
        if not os.path.isdir(d):
            continue
        try:
            for fname in sorted(os.listdir(d)):
                if not fname.lower().endswith(".cube") or fname in seen:
                    continue
                fp = os.path.abspath(os.path.join(d, fname))
                if os.path.isfile(fp):
                    seen.add(fname)
                    stem = os.path.splitext(fname)[0].replace("_", " ").title()
                    luts.append({"id": fname, "label": _read_cube_title(fp, stem)})
        except Exception:
            pass
    return luts


def resolve_lut_file(lut_ref: Optional[str]) -> Optional[str]:
    """Resolves a LUT filename or .cube path safely to an existing file."""
    ref = str(lut_ref or "").strip()
    if not ref:
        return None
    if os.path.isfile(ref) and ref.lower().endswith(".cube"):
        return os.path.abspath(ref)
    safe_name = os.path.basename(ref)
    if not safe_name.lower().endswith(".cube"):
        return None
    for d in _get_lut_dirs():
        cand = os.path.abspath(os.path.join(d, safe_name))
        if os.path.isfile(cand):
            return cand
    return None


def match_auto_soundscape(prompt: str) -> Tuple[Optional[str], str]:
    """Analyzes the prompt text and picks randomly (weighted by score) from the top 3 matching soundscapes."""
    clean_p = (prompt or "").lower()
    clean_words = set(re.findall(r'[a-zA-ZäöüÄÖÜß0-9\-]+', clean_p))

    scored: List[Tuple[int, str]] = []
    for filename, kws in SOUNDSCAPE_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in clean_p or kw in clean_words)
        if score > 0:
            scored.append((score, filename))

    if scored:
        scored.sort(key=lambda item: item[0], reverse=True)
        top_candidates = scored[:3]
        best_match = random.choices(
            [fn for _, fn in top_candidates],
            weights=[s for s, _ in top_candidates],
            k=1,
        )[0]
    else:
        best_match = random.choice(list(SOUNDSCAPE_KEYWORDS.keys()))

    sound_path = find_sound_file_path(best_match)
    if not sound_path:
        best_match = "cinematic_epic_trailer.mp3"
        sound_path = find_sound_file_path(best_match)

    mood_name = best_match.replace(".mp3", "").replace("_", " ").title()
    return sound_path, mood_name


def apply_end_frame_hold(video_path: str, hold_seconds: float) -> None:
    """Extends the final frame of video_path in-place by hold_seconds via FFmpeg tpad."""
    if hold_seconds <= 0 or not video_path or not os.path.isfile(video_path) or not is_ffmpeg_available():
        return
    tmp_hold = video_path + ".hold.mp4"
    try:
        res = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", f"tpad=stop_mode=clone:stop_duration={hold_seconds:.2f}",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "veryfast",
                "-c:a", "copy",
                tmp_hold,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if res.returncode == 0 and os.path.isfile(tmp_hold) and os.path.getsize(tmp_hold) > 0:
            os.replace(tmp_hold, video_path)
        else:
            print(f"[MorphHold] FFmpeg Warnung: {res.stderr[-200:] if res.stderr else 'Unbekannt'}")
    except Exception as ex:
        print(f"[MorphHold] Fehler: {ex}")
    finally:
        if os.path.isfile(tmp_hold):
            try:
                os.remove(tmp_hold)
            except Exception:
                pass


def apply_upscale_if_requested(
    video_path: str,
    upscale_engine: str = "ffmpeg",
    fps: int = 24,
    progress_cb=None,
    cancel_cb=None,
) -> None:
    """Upscales video_path in-place via RelayVSR (AI 2x) with FFmpeg Lanczos 1080p fallback."""
    if not video_path or not os.path.isfile(video_path):
        return
    if upscale_engine == "relayvsr" and _get_comfy().is_alive():
        tmp_vsr = video_path + ".relayvsr.mp4"
        ok_vsr, res_vsr = _get_comfy().upscale_video_relayvsr(
            video_path=video_path,
            dest_path=tmp_vsr,
            fps=fps,
            progress_callback=progress_cb,
            cancel_check=cancel_cb,
        )
        if ok_vsr and os.path.isfile(tmp_vsr) and os.path.getsize(tmp_vsr) > 0:
            os.replace(tmp_vsr, video_path)
            return
        print(f"[Upscale] RelayVSR Fallback auf FFmpeg Lanczos: {res_vsr}")

    tmp_up = video_path + ".upscale.mp4"
    try:
        upscale_video_1080p(video_path, tmp_up)
        if os.path.isfile(tmp_up) and os.path.getsize(tmp_up) > 0:
            os.replace(tmp_up, video_path)
    except Exception as ex:
        print(f"[Upscale] FFmpeg Lanczos Warnung: {ex}")
        if os.path.isfile(tmp_up):
            try:
                os.remove(tmp_up)
            except Exception:
                pass


def mix_audio_to_quick_clip(
    video_path: str,
    audio_path: str,
    output_path: str,
    start_time: float = 0.0,
    volume: float = 1.0,
) -> Tuple[bool, str]:
    """Muxes an audio track with start_time offset and volume into a video clip without re-encoding video."""
    if not is_ffmpeg_available():
        return False, "FFmpeg ist nicht verfügbar."
    if not os.path.isfile(video_path):
        return False, f"Videodatei nicht gefunden: {video_path}"
    if not os.path.isfile(audio_path):
        return False, f"Audiodatei nicht gefunden: {audio_path}"

    start_s = max(0.0, float(start_time))
    vol = max(0.0, min(2.0, float(volume)))

    temp_dir = tempfile.mkdtemp(prefix="tavideo_quickaudio_")
    temp_out = os.path.join(temp_dir, os.path.basename(output_path))

    try:
        # -ss start_s seeks into audio
        # -map 0:v:0 keeps video stream copy without re-encoding
        # -map 1:a:0 takes audio, applies volume and apad (pad silence so video length is never truncated)
        # -c:a aac standard AAC audio
        # -shortest stops when video stream ends
        cmd = [
            "ffmpeg", "-y",
            "-i", os.path.abspath(video_path),
            "-ss", str(start_s),
            "-i", os.path.abspath(audio_path),
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-map_chapters", "-1",
            "-c:v", "copy",
            "-filter:a", f"volume={vol},apad",
            "-c:a", "aac",
            "-b:a", "256k",
            "-shortest",
            os.path.abspath(temp_out),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60, creationflags=NO_WINDOW_FLAG)
        if res.returncode == 0 and os.path.isfile(temp_out) and os.path.getsize(temp_out) > 0:
            shutil.move(temp_out, os.path.abspath(output_path))
            return True, output_path
        else:
            err_msg = res.stderr[-400:] if res.stderr else "Unbekannter Fehler"
            return False, f"FFmpeg Audio-Mix Fehler: {err_msg}"
    except Exception as ex:
        return False, str(ex)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)



def generate_lipsync_preview_clip(
    portrait_path: str,
    second_image_path: Optional[str],
    audio_path: str,
    start_time: float,
    duration: float,
    output_path: str,
    fps: int = 24,
    resolution: str = "480p",
) -> Tuple[bool, str]:
    """Generates a fast FFmpeg audio-synced preview video combining the portrait image(s) with the trimmed audio."""
    if not is_ffmpeg_available():
        return False, "FFmpeg nicht verfügbar."

    res_map = {
        "480p": (864, 496),
        "512x512": (512, 512),
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        # Portrait (9:16)
        "480p_portrait": (496, 864),
        "720p_portrait": (720, 1280),
        "1080p_portrait": (1080, 1920),
        "480x832": (480, 832),
        "720x1280": (720, 1280),
        "1080x1920": (1080, 1920),
    }
    w, h = res_map.get(resolution, (864, 496))
    dur = max(1.0, float(duration))
    start_s = max(0.0, float(start_time))
    total_frames = max(1, int(dur * fps))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    try:
        if second_image_path and os.path.isfile(second_image_path):
            trans_dur = min(1.5, max(0.4, dur * 0.25))
            offset = max(0.2, (dur * 0.5) - (trans_dur * 0.5))
            vf = (
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];"
                f"[1:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v1];"
                f"[v0][v1]xfade=transition=fade:duration={trans_dur}:offset={offset},format=yuv420p[outv]"
            )
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-t", str(dur), "-i", os.path.abspath(portrait_path),
                "-loop", "1", "-t", str(dur), "-i", os.path.abspath(second_image_path),
                "-ss", str(start_s), "-t", str(dur), "-i", os.path.abspath(audio_path),
                "-filter_complex", vf,
                "-map", "[outv]", "-map", "2:a:0",
                "-map_chapters", "-1",
                "-t", str(dur),
                "-c:v", "libx264", "-c:a", "aac",
                "-pix_fmt", "yuv420p", "-preset", "veryfast", "-shortest",
                os.path.abspath(output_path),
            ]
        else:
            vf = (
                f"scale={w*2}:{h*2}:force_original_aspect_ratio=decrease,"
                f"pad={w*2}:{h*2}:(ow-iw)/2:(oh-ih)/2,"
                f"zoompan=z='min(zoom+0.0008,1.12)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},"
                f"format=yuv420p"
            )
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", os.path.abspath(portrait_path),
                "-ss", str(start_s), "-t", str(dur), "-i", os.path.abspath(audio_path),
                "-vf", vf,
                "-map", "0:v:0", "-map", "1:a:0",
                "-map_chapters", "-1",
                "-t", str(dur),
                "-c:v", "libx264", "-c:a", "aac",
                "-pix_fmt", "yuv420p", "-preset", "veryfast", "-shortest",
                os.path.abspath(output_path),
            ]

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180, creationflags=NO_WINDOW_FLAG)
        if res.returncode == 0 and os.path.isfile(output_path):
            return True, output_path
        return False, f"FFmpeg Audio-Preview Fehler: {res.stderr[-250:] if res.stderr else 'Unbekannt'}"
    except Exception as ex:
        return False, str(ex)


def transcribe_audio_local(
    audio_path: str,
    start_time: float = 0.0,
    duration: float = 15.0,
    language: str = "German",
) -> Tuple[bool, str]:
    """Transcribes a trimmed segment of an audio file locally using faster-whisper / whisper or Windows Speech Recognition."""
    if not os.path.isfile(audio_path):
        return False, "Audiodatei nicht gefunden."

    lang_code = "de" if str(language).lower().startswith(("de", "ger")) else "en"
    start_s = max(0.0, float(start_time))
    dur_s = max(1.0, min(120.0, float(duration)))

    temp_wav = os.path.join(DATA_DIR, f"transcribe_{int(time.time() * 1000)}.wav")
    try:
        if is_ffmpeg_available():
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_s),
                "-t", str(dur_s),
                "-i", os.path.abspath(audio_path),
                "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                os.path.abspath(temp_wav),
            ]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30, creationflags=NO_WINDOW_FLAG)
        if not os.path.isfile(temp_wav):
            temp_wav = os.path.abspath(audio_path)

        # 1. Try local Python faster_whisper / whisper
        try:
            from faster_whisper import WhisperModel  # type: ignore
            model = WhisperModel("base", device="auto", compute_type="int8")
            raw_segs, _ = model.transcribe(temp_wav, language=lang_code, word_timestamps=True)
            seg_list = []
            text_parts = []
            for s in raw_segs:
                stxt = s.text.strip()
                if stxt:
                    text_parts.append(stxt)
                    seg_list.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": stxt})
            text = " ".join(text_parts).strip()
            if text:
                srt_content = generate_srt_content(seg_list)
                return True, json.dumps({"text": text, "srt": srt_content, "segments": seg_list})
        except Exception:
            pass

        try:
            import whisper  # type: ignore
            model = whisper.load_model("base")
            res = model.transcribe(temp_wav, language=lang_code)
            text = str(res.get("text", "")).strip()
            if text:
                return True, text
        except Exception:
            pass

        # 2. Try ComfyUI Python environment on Windows (portable or venv)
        try:
            py_candidates = []
            comfy_py = _get_comfy().get_comfy_python_exe(load_config().get("comfy_dir", ""))
            if comfy_py and os.path.isfile(comfy_py):
                py_candidates.append(comfy_py)

            if sys.executable and sys.executable not in py_candidates and os.path.isfile(sys.executable):
                py_candidates.append(sys.executable)

            py_script = (
                "import sys\n"
                f"wav = {repr(os.path.abspath(temp_wav))}\n"
                f"lang = {repr(lang_code)}\n"
                "try:\n"
                "    from faster_whisper import WhisperModel\n"
                "    m = WhisperModel('base', device='auto', compute_type='int8')\n"
                "    segs, _ = m.transcribe(wav, language=lang)\n"
                "    print('TRANSCRIPT_OK:' + ' '.join(s.text.strip() for s in segs).strip())\n"
                "    sys.exit(0)\n"
                "except Exception:\n"
                "    pass\n"
                "try:\n"
                "    import whisper\n"
                "    m = whisper.load_model('base')\n"
                "    r = m.transcribe(wav, language=lang)\n"
                "    print('TRANSCRIPT_OK:' + str(r.get('text', '')).strip())\n"
                "    sys.exit(0)\n"
                "except Exception as e:\n"
                "    sys.exit(1)\n"
            )
            for py_bin in py_candidates:
                proc = subprocess.run([py_bin, "-c", py_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=45, creationflags=NO_WINDOW_FLAG)
                if proc.returncode == 0 and "TRANSCRIPT_OK:" in proc.stdout:
                    out_txt = proc.stdout.split("TRANSCRIPT_OK:", 1)[1].strip()
                    if out_txt:
                        return True, out_txt
        except Exception:
            pass

        # 3. Fallback: Windows Offline System.Speech.Recognition
        if sys.platform == "win32" and os.path.isfile(temp_wav):
            culture = "de-DE" if lang_code == "de" else "en-US"
            ps_env = os.environ.copy()
            ps_env["TA_WAV_PATH"] = os.path.abspath(temp_wav)
            ps_script = (
                "Add-Type -AssemblyName System.Speech; "
                f"$culture = New-Object System.Globalization.CultureInfo('{culture}'); "
                "try { $rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture) } "
                "catch { $rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine }; "
                "$rec.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar)); "
                "$rec.SetInputToWaveFile($env:TA_WAV_PATH); "
                "$sb = New-Object System.Text.StringBuilder; "
                "while ($true) { $r = $rec.Recognize(); if ($null -eq $r) { break }; [void]$sb.Append($r.Text + ' ') }; "
                "$rec.Dispose(); "
                "Write-Output ('TRANSCRIPT_OK:' + $sb.ToString().Trim())"
            )
            proc = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=45,
                env=ps_env,
                creationflags=NO_WINDOW_FLAG,
            )
            if "TRANSCRIPT_OK:" in (proc.stdout or ""):
                out_txt = proc.stdout.split("TRANSCRIPT_OK:", 1)[1].strip()
                if out_txt:
                    return True, out_txt

        return False, "Keine Sprache im gewählten Audio-Abschnitt erkannt (oder kein lokales Whisper-/Sprachpaket verfügbar). Bitte Text direkt eingeben."
    except Exception as ex:
        return False, f"Transkription fehlgeschlagen: {ex}"
    finally:
        if os.path.isfile(temp_wav) and temp_wav != os.path.abspath(audio_path):
            try:
                os.remove(temp_wav)
            except Exception:
                pass


def _render_lipsync_worker(
    portrait_path: str,
    second_path: Optional[str],
    audio_path: str,
    title: str,
    prompt: str,
    cut_instruction: str,
    start_time: float,
    duration: float,
    resolution: str,
    fps: int,
    seed: int,
    visual_strength: float,
    use_demucs: bool,
    use_captions: bool,
    captions_text: str,
    engine: str = "comfyui",
    subject_name: str = "",
    dialogue_text: str = "",
    dialogue_lang: str = "German",
    music_style: str = "",
    camera_preset: str = "",
    align_to_activity_gap: bool = True,
    bgm_path: Optional[str] = None,
    bgm_volume: float = 0.25,
    turbo: bool = True,
):
    global active_job
    t_start = time.time()
    active_job["is_running"] = True
    active_job["type"] = "lipsync"
    active_job["stage"] = "Initialisiere Lipsync Studio..."
    active_job["error"] = None
    active_job["cancel_requested"] = False
    active_job["total_segments"] = max(1, int((float(duration) + 4.9) // 5.0))
    active_job["current_segment"] = 1
    active_job["progress_pct"] = 2
    active_job["start_time"] = t_start
    active_job["elapsed_sec"] = 0
    active_job["duration_formatted"] = ""

    try:
        clip_name = sanitize_video_title(title, default_prefix="lipsync_h3")
        clip_path = os.path.join(get_output_dir(), clip_name)

        if engine == "comfyui":
            if not _get_comfy().is_alive():
                raise Exception("ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188.")

            def comfy_progress(pct, msg):
                if active_job.get("cancel_requested"):
                    raise InterruptedError("Generierung wurde vom Benutzer abgebrochen.")
                active_job["progress_pct"] = min(96, pct)
                active_job["elapsed_sec"] = round(time.time() - t_start, 1)
                active_job["stage"] = f"MiniMax H3 Lipsync: {msg}"

            ok, out_path = _get_comfy().render_lipsync_ai(
                portrait_image_path=portrait_path,
                audio_path=audio_path,
                prompt=prompt,
                cut_instruction=cut_instruction,
                start_time=start_time,
                duration=duration,
                resolution=resolution,
                fps=fps,
                seed=seed,
                visual_strength=visual_strength,
                use_demucs=use_demucs,
                use_captions=use_captions,
                captions_text=captions_text,
                dest_path=clip_path,
                second_image_path=second_path,
                subject_name=subject_name,
                dialogue_text=dialogue_text,
                dialogue_lang=dialogue_lang,
                music_style=music_style,
                camera_preset=camera_preset,
                align_to_activity_gap=align_to_activity_gap,
                turbo=turbo,
                progress_callback=comfy_progress,
                cancel_check=lambda: bool(active_job.get("cancel_requested")),
            )
            if not ok:
                raise Exception(out_path)
        else:
            active_job["stage"] = "Erstelle schnelle Audio-Video-Vorschau (FFmpeg)..."
            active_job["progress_pct"] = 40
            ok, out_path = generate_lipsync_preview_clip(
                portrait_path=portrait_path,
                second_image_path=second_path,
                audio_path=audio_path,
                start_time=start_time,
                duration=duration,
                output_path=clip_path,
                fps=fps,
                resolution=resolution,
            )
            if not ok:
                raise Exception(out_path)

        if bgm_path and os.path.isfile(bgm_path):
            active_job["stage"] = "Mische Hintergrundmusik hinzu..."
            mixed_name = f"bgm_{clip_name}"
            mixed_path = os.path.join(get_output_dir(), mixed_name)
            ok_mix, _ = concat_segments(
                [out_path],
                mixed_path,
                bgm_path=bgm_path,
                bgm_volume=float(bgm_volume),
                native_audio_volume=1.0,
            )
            if ok_mix and os.path.isfile(mixed_path):
                clip_name = mixed_name

        elapsed_sec = round(time.time() - t_start, 1)
        mins = int(elapsed_sec // 60)
        secs = int(elapsed_sec % 60)
        active_job["elapsed_sec"] = elapsed_sec
        active_job["duration_formatted"] = f"{mins} Min. {secs} Sek." if mins > 0 else f"{secs} Sekunden"
        active_job["progress_pct"] = 100
        active_job["stage"] = "done"
        active_job["output_file"] = f"/api/video/output/{clip_name}"
    except Exception as ex:
        if active_job.get("cancel_requested") or "abgebrochen" in str(ex).lower():
            active_job["stage"] = "cancelled"
            active_job["error"] = "Generierung durch Benutzer abgebrochen."
        else:
            active_job["error"] = str(ex)
            active_job["stage"] = "error"
    finally:
        active_job["is_running"] = False


def create_animatic_card(
    title: str,
    prompt: str,
    duration: float,
    fps: int,
    width: int,
    height: int,
    output_image_path: str,
) -> bool:
    """Generates a high-contrast, beautiful Dark Studio Director Animatic Card using Pillow."""
    try:
        from PIL import Image, ImageDraw

        img = Image.new("RGB", (width, height), color=(14, 16, 26))
        draw = ImageDraw.Draw(img)

        # Draw decorative cinematic frame lines
        draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(35, 42, 65), width=2)
        draw.rectangle([(30, 30), (width - 30, height - 30)], outline=(22, 26, 40), width=1)

        # Glowing corner accents
        cyan_accent = (0, 229, 255)
        purple_accent = (168, 85, 247)
        c_len = min(40, width // 20)
        corners = [
            (30, 30, 1, 1),
            (width - 30, 30, -1, 1),
            (30, height - 30, 1, -1),
            (width - 30, height - 30, -1, -1),
        ]
        for cx, cy, dx, dy in corners:
            draw.line([(cx, cy), (cx + dx * c_len, cy)], fill=cyan_accent, width=3)
            draw.line([(cx, cy), (cx, cy + dy * c_len)], fill=cyan_accent, width=3)

        # Header Badge
        header_text = f"🎬 {title.upper()}  •  [ {duration:.1f}s  •  {fps} FPS ]"
        draw.text((60, 50), header_text, fill=purple_accent)

        # Prompt text (wrapped)
        clean_prompt = prompt.strip() or "Cinematic Shot Description"
        max_chars = max(28, int(width / 16))
        lines = textwrap.wrap(clean_prompt, width=max_chars)

        y_pos = 110
        line_height = 34 if height >= 720 else 24
        for line in lines[:8]:
            draw.text((60, y_pos), line, fill=(240, 245, 255))
            y_pos += line_height

        # Footer branding
        footer = "thomo.ART VideoMaker • Storyboard Director Animatic"
        draw.text((60, height - 60), footer, fill=(100, 115, 145))

        img.save(output_image_path)
        return True
    except Exception as ex:
        print("[Animatic Card] Error:", ex)
        return False


def generate_preview_clip(
    image_path: Optional[str],
    last_image_path: Optional[str],
    prompt: str,
    duration: float,
    output_path: str,
    fps: int = 24,
    resolution: str = "720p",
    title: str = "Scene Animatic",
) -> Tuple[bool, str]:
    """Generates an FL2VA animatic video clip with subtle motion or crossfade transition, never a black rectangle."""
    if not is_ffmpeg_available():
        return False, "FFmpeg nicht verfügbar."

    res_map = {
        "480p": (854, 480),
        "512x512": (512, 512),
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        # Portrait (9:16)
        "480p_portrait": (480, 854),
        "720p_portrait": (720, 1280),
        "1080p_portrait": (1080, 1920),
        "480x832": (480, 832),
        "720x1280": (720, 1280),
        "1080x1920": (1080, 1920),
    }
    w, h = res_map.get(resolution, (1280, 720))
    total_frames = max(1, int(duration * fps))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_card_path = None
    try:
        # Case A: Both first frame and last frame provided (FL2VA Transition)
        if image_path and os.path.isfile(image_path) and last_image_path and os.path.isfile(last_image_path):
            trans_dur = min(1.8, max(0.5, duration / 2))
            offset = max(0.2, duration - trans_dur)
            vf = (
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];"
                f"[1:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v1];"
                f"[v0][v1]xfade=transition=fade:duration={trans_dur}:offset={offset},format=yuv420p"
            )
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-t", str(duration), "-i", os.path.abspath(image_path),
                "-loop", "1", "-t", str(duration), "-i", os.path.abspath(last_image_path),
                "-f", "lavfi", "-t", str(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-filter_complex", vf,
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                os.path.abspath(output_path),
            ]
        # Case B: First frame only (Ken Burns subtle motion)
        elif image_path and os.path.isfile(image_path):
            vf = f"scale={w*2}:{h*2},zoompan=z='min(zoom+0.0015,1.2)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},format=yuv420p"
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", os.path.abspath(image_path),
                "-f", "lavfi", "-t", str(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-vf", vf,
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                os.path.abspath(output_path),
            ]
        # Case C: Last frame only
        elif last_image_path and os.path.isfile(last_image_path):
            vf = f"scale={w*2}:{h*2},zoompan=z='max(1.2-0.0015*on,1.0)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},format=yuv420p"
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", os.path.abspath(last_image_path),
                "-f", "lavfi", "-t", str(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-vf", vf,
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                os.path.abspath(output_path),
            ]
        # Case D: Text-to-Video scene with no image -> generate Director Animatic Card!
        else:
            temp_card_path = os.path.join(DATA_DIR, f"card_{int(time.time() * 1000)}.png")
            create_animatic_card(title, prompt, duration, fps, w, h, temp_card_path)

            vf = f"scale={w*2}:{h*2},zoompan=z='min(zoom+0.0008,1.1)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},format=yuv420p"
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", os.path.abspath(temp_card_path),
                "-f", "lavfi", "-t", str(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-vf", vf,
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                os.path.abspath(output_path),
            ]

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120, creationflags=NO_WINDOW_FLAG)
        if res.returncode == 0 and os.path.isfile(output_path):
            return True, output_path
        return False, f"FFmpeg Fehler: {res.stderr[-200:] if res.stderr else 'Unbekannt'}"
    except Exception as ex:
        return False, str(ex)
    finally:
        if temp_card_path and os.path.isfile(temp_card_path):
            try:
                os.remove(temp_card_path)
            except Exception:
                pass


def _render_storyboard_worker(
    scenes: List[dict],
    resolution: str,
    fps: int,
    seed: int,
    auto_upscale: bool,
    bgm_path: Optional[str],
    engine: str = "comfyui",
    title: str = "",
    music_style: str = "",
    turbo: bool = True,
    lut: str = "",
):
    global active_job
    lut_path = resolve_lut_file(lut)
    t_start = time.time()
    active_job["is_running"] = True
    active_job["type"] = "storyboard"
    active_job["stage"] = "Initialisiere..."
    active_job["error"] = None
    active_job["cancel_requested"] = False
    active_job["total_segments"] = len(scenes)
    active_job["current_segment"] = 0
    active_job["progress_pct"] = 0
    active_job["start_time"] = t_start
    active_job["elapsed_sec"] = 0
    active_job["duration_formatted"] = ""

    try:
        if engine == "comfyui":
            if not _get_comfy().is_alive():
                raise Exception("ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188. Bitte ComfyUI starten oder Animatic-Preview wählen.")
            if not _get_comfy().check_minimax_director_node():
                active_job["stage"] = "Richte MiniMax H3 Director automatisch ein..."
                comfy_cfg_dir = load_config().get("comfy_dir", "")
                ready, msg, needs_restart = _get_comfy().ensure_director_node(comfy_cfg_dir)
                if not ready:
                    raise Exception(msg)

            film_name = sanitize_video_title(title, default_prefix="film")
            film_path = os.path.join(get_output_dir(), film_name)

            resolved_scenes = []
            for sc in scenes:
                sc_copy = dict(sc)
                if sc.get("first_frame"):
                    sc_copy["first_frame"] = resolve_image_file(sc.get("first_frame"))
                if sc.get("last_frame"):
                    sc_copy["last_frame"] = resolve_image_file(sc.get("last_frame"))
                resolved_scenes.append(sc_copy)

            def comfy_progress(pct, msg):
                if active_job.get("cancel_requested"):
                    raise InterruptedError("Generierung wurde vom Benutzer abgebrochen.")
                active_job["progress_pct"] = min(95, pct)
                active_job["elapsed_sec"] = round(time.time() - t_start, 1)
                active_job["stage"] = f"MiniMax H3 Diffusion: {msg}"

            ok, out_path = _get_comfy().render_storyboard_ai(
                scenes=resolved_scenes,
                resolution=resolution,
                fps=fps,
                seed=seed,
                dest_path=film_path,
                music_style=music_style,
                turbo=turbo,
                progress_callback=comfy_progress,
                cancel_check=lambda: bool(active_job.get("cancel_requested")),
            )

            if not ok:
                raise Exception(out_path)

            if auto_upscale or (bgm_path and os.path.isfile(bgm_path)) or lut_path:
                active_job["stage"] = "Post-Processing Film..."
                final_film = os.path.join(get_output_dir(), f"final_{film_name}")
                ok_s, msg = concat_segments(
                    [film_path],
                    final_film,
                    upscale_1080p=auto_upscale,
                    bgm_path=bgm_path,
                    lut_path=lut_path,
                )
                if ok_s:
                    film_name = os.path.basename(final_film)

            elapsed_sec = round(time.time() - t_start, 1)
            mins = int(elapsed_sec // 60)
            secs = int(elapsed_sec % 60)
            active_job["elapsed_sec"] = elapsed_sec
            active_job["duration_formatted"] = f"{mins} Min. {secs} Sek." if mins > 0 else f"{secs} Sekunden"
            active_job["progress_pct"] = 100
            active_job["stage"] = "done"
            active_job["output_file"] = f"/api/video/output/{film_name}"

        else:
            # Storyboard Animatic Preview
            rendered_clips = []
            prev_video_path = None
            for idx, sc in enumerate(scenes):
                if active_job.get("cancel_requested"):
                    raise InterruptedError("Generierung wurde vom Benutzer abgebrochen.")
                active_job["current_segment"] = idx + 1
                active_job["stage"] = f"Szene {idx + 1} von {len(scenes)} (Animatic-Preview)"
                active_job["progress_pct"] = int((idx / len(scenes)) * 85)
                active_job["elapsed_sec"] = round(time.time() - t_start, 1)

                duration = float(sc.get("duration", 4.0))
                prompt = sc.get("prompt", "")
                first_frame_path = resolve_image_file(sc.get("first_frame"))
                last_frame_path = resolve_image_file(sc.get("last_frame"))

                if sc.get("from_prev") and prev_video_path and os.path.isfile(prev_video_path):
                    ext_path = os.path.join(UPLOADS_DIR, f"auto_prev_frame_scene_{idx + 1}.png")
                    ok_ext, _ = extract_last_frame(prev_video_path, ext_path)
                    if ok_ext and os.path.isfile(ext_path):
                        first_frame_path = ext_path

                clip_name = f"scene_{idx + 1}_{int(time.time())}.mp4"
                clip_path = os.path.join(get_output_dir(), clip_name)

                ok, out_path = generate_preview_clip(
                    image_path=first_frame_path,
                    last_image_path=last_frame_path,
                    prompt=prompt,
                    duration=duration,
                    output_path=clip_path,
                    fps=fps,
                    resolution=resolution,
                    title=f"Szene {idx + 1}: {sc.get('title', 'Shot')}",
                )

                if not ok:
                    raise Exception(f"Fehler bei Szene {idx + 1}: {out_path}")

                rendered_clips.append(out_path)
                prev_video_path = out_path

            if active_job.get("cancel_requested"):
                raise InterruptedError("Generierung wurde vom Benutzer abgebrochen.")

            active_job["stage"] = "Stitching Animatic Preview..."
            active_job["progress_pct"] = 90
            active_job["elapsed_sec"] = round(time.time() - t_start, 1)

            film_name = sanitize_video_title(title, default_prefix="film_animatic")
            film_path = os.path.join(get_output_dir(), film_name)

            ok_stitch, msg = concat_segments(
                segment_paths=rendered_clips,
                output_path=film_path,
                upscale_1080p=auto_upscale,
                bgm_path=bgm_path if bgm_path and os.path.isfile(bgm_path) else None,
                lut_path=lut_path,
            )

            if not ok_stitch:
                raise Exception(f"Fehler beim Zusammenfügen: {msg}")

            elapsed_sec = round(time.time() - t_start, 1)
            mins = int(elapsed_sec // 60)
            secs = int(elapsed_sec % 60)
            active_job["elapsed_sec"] = elapsed_sec
            active_job["duration_formatted"] = f"{mins} Min. {secs} Sek." if mins > 0 else f"{secs} Sekunden"
            active_job["progress_pct"] = 100
            active_job["stage"] = "done"
            active_job["output_file"] = f"/api/video/output/{film_name}"

    except Exception as ex:
        if active_job.get("cancel_requested") or "abgebrochen" in str(ex).lower():
            active_job["stage"] = "cancelled"
            active_job["error"] = "Generierung durch Benutzer abgebrochen."
        else:
            active_job["error"] = str(ex)
            active_job["stage"] = "error"
    finally:
        active_job["is_running"] = False


def format_srt_time(seconds: float) -> str:
    millis = int((seconds - int(seconds)) * 1000)
    secs = int(seconds) % 60
    mins = (int(seconds) // 60) % 60
    hours = int(seconds) // 3600
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def generate_srt_content(segments: List[dict]) -> str:
    lines = []
    for i, seg in enumerate(segments, 1):
        s_time = format_srt_time(float(seg.get("start", 0.0)))
        e_time = format_srt_time(float(seg.get("end", 0.0)))
        txt = str(seg.get("text", "")).strip()
        lines.append(f"{i}\n{s_time} --> {e_time}\n{txt}\n")
    return "\n".join(lines)


def _normalize_storyboard_scenes(raw_scenes: list, fallback_concept: str, vibe: str) -> List[dict]:
    normalized = []
    for i, sc in enumerate(raw_scenes):
        if not isinstance(sc, dict):
            continue
        sc_id = sc.get("id") or (i + 1)
        title = sc.get("title") or f"Szene {i + 1}"
        raw_prompt = sc.get("prompt") or fallback_concept
        prompt, _ = validate_and_preserve_h3_tags(fallback_concept, raw_prompt) if "<" in fallback_concept else (raw_prompt, True)
        duration = float(sc.get("duration", 4.0))
        camera = sc.get("camera") or "Cinematic motion"
        from_prev = bool(sc.get("from_prev", True if i > 0 else False))
        normalized.append({
            "id": sc_id,
            "title": title,
            "duration": max(2.5, min(10.0, duration)),
            "prompt": prompt,
            "camera": camera,
            "from_prev": from_prev if i > 0 else False,
            "status": "ready"
        })
    return normalized if normalized else _generate_storyboard_template(fallback_concept, len(raw_scenes) or 4, vibe)


def query_ollama_storyboard(idea: str, shot_count: int, vibe: str, base_url: str = "http://127.0.0.1:11434", model: str = "llama3.2") -> Optional[List[dict]]:
    try:
        url = base_url.rstrip("/") + "/api/generate"
        prompt = (
            f"You are a professional film director. Create a continuous {shot_count}-shot cinematic storyboard for: '{idea}'. "
            f"Style/Vibe: '{vibe}'. Return ONLY a JSON array of {shot_count} scene objects with fields: "
            f"'id', 'title', 'prompt', 'duration', 'camera', 'from_prev'. "
            f"Prompts must be in English, highly detailed for video diffusion models. No markdown ticks, just JSON."
        )
        req_data = json.dumps({
            "model": model or "llama3.2",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "keep_alive": 0,
        }).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw = data.get("response", "").strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return _normalize_storyboard_scenes(parsed, idea, vibe)
            if isinstance(parsed, dict) and "scenes" in parsed and isinstance(parsed["scenes"], list):
                return _normalize_storyboard_scenes(parsed["scenes"], idea, vibe)
    except Exception:
        pass
    return None


def query_gemini_storyboard(
    idea: str,
    shot_count: int,
    vibe: str,
    api_key: str,
    model: str = "gemini-3.8-flash",
) -> Optional[List[dict]]:
    if not api_key or not api_key.strip():
        return None
    eff_model = re.sub(r"[^a-zA-Z0-9._-]", "", (model or "gemini-3.8-flash").strip()) or "gemini-3.8-flash"
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{eff_model}:generateContent?key={api_key.strip()}"
        prompt = (
            f"You are a professional film director. Create a continuous {shot_count}-shot cinematic storyboard for: '{idea}'. "
            f"Style: '{vibe}'. Return ONLY a valid JSON array of {shot_count} scene objects with fields: "
            f"'id', 'title', 'prompt', 'duration', 'camera', 'from_prev'. "
            f"Prompts must be in English with rich cinematic lighting, lens type and movement."
        )
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        req_data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            cands = data.get("candidates", [])
            if cands:
                text_part = cands[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                parsed = json.loads(text_part)
                if isinstance(parsed, list):
                    return _normalize_storyboard_scenes(parsed, idea, vibe)
                if isinstance(parsed, dict) and "scenes" in parsed and isinstance(parsed["scenes"], list):
                    return _normalize_storyboard_scenes(parsed["scenes"], idea, vibe)
    except Exception:
        pass
    return None


def generate_ai_storyboard_director(idea: str, shot_count: int, vibe: str, cfg: Optional[dict] = None) -> Tuple[List[dict], str]:
    config = cfg or load_config()
    provider = str(config.get("llm_provider", "auto")).lower()

    if provider in ("auto", "ollama"):
        scenes = query_ollama_storyboard(
            idea, shot_count, vibe,
            base_url=config.get("ollama_url", "http://127.0.0.1:11434"),
            model=config.get("ollama_model", "llama3.2")
        )
        if scenes:
            return scenes, f"Ollama ({config.get('ollama_model', 'llama3.2')})"

    if provider in ("auto", "gemini"):
        api_key = _resolve_gemini_key(config)
        gemini_model = (config.get("gemini_model") or "gemini-3.8-flash").strip()
        if api_key:
            scenes = query_gemini_storyboard(idea, shot_count, vibe, api_key, model=gemini_model)
            if scenes:
                return scenes, f"Gemini AI ({gemini_model})"

    # Fallback to enhanced cinematic heuristics
    return _generate_storyboard_template(idea, shot_count, vibe), "Cinematic Director Engine"


def analyze_image_prompt(image_path: str, cfg: Optional[dict] = None) -> Tuple[Optional[str], str]:
    """Generates a detailed English video diffusion prompt from a reference image using Gemini or Ollama Vision."""
    config = cfg or load_config()
    provider = str(config.get("llm_provider", "auto")).lower()
    instruction = (
        "Describe this image as a concise, vivid English prompt for AI video generation "
        "(MiniMax H3 / Wan 2.2). Include subject, clothing/details, setting, lighting, "
        "camera framing, and natural subtle motion. Return ONLY the prompt text, no markdown."
    )

    try:
        with open(image_path, "rb") as f:
            img_bytes = f.read()
        img_b64 = base64.b64encode(img_bytes).decode("ascii")
    except Exception:
        return None, ""

    ext = os.path.splitext(image_path)[1].lower()
    mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")

    if provider in ("auto", "gemini"):
        api_key = _resolve_gemini_key(config)
        gemini_model = re.sub(
            r"[^a-zA-Z0-9._-]",
            "",
            (config.get("gemini_model") or "gemini-3.8-flash").strip(),
        ) or "gemini-3.8-flash"
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"
                body = {
                    "contents": [{
                        "parts": [
                            {"text": instruction},
                            {"inline_data": {"mime_type": mime, "data": img_b64}},
                        ]
                    }]
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    cands = data.get("candidates", [])
                    if cands:
                        txt = cands[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if txt:
                            return txt, f"Gemini ({gemini_model})"
            except Exception:
                pass

    if provider in ("auto", "ollama"):
        ollama_url = config.get("ollama_url", "http://127.0.0.1:11434").rstrip("/")
        ollama_model = (config.get("ollama_model") or "llama3.2").strip()
        try:
            req_data = json.dumps({
                "model": ollama_model,
                "prompt": instruction,
                "images": [img_b64],
                "stream": False,
                "keep_alive": 0,
            }).encode("utf-8")
            req = urllib.request.Request(
                ollama_url + "/api/generate",
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                txt = (data.get("response") or "").strip()
                if txt:
                    return txt, f"Ollama ({ollama_model})"
        except Exception:
            pass

    return None, ""


def _generate_storyboard_template(idea: str, shot_count: int, vibe: str) -> List[dict]:
    base_concept = idea.strip() or "Ein cineastisches Science-Fiction Abenteuer in einer futuristischen Neon-Stadt"
    styles = {
        "cinematic": "cinematic lighting, anamorphic lens, 8k, photorealistic, shallow depth of field",
        "anime": "high quality anime style, makoto shinkai aesthetics, vibrant colors, detailed lineart",
        "documentary": "natural documentary style, handheld camera, raw realism, natural ambient sunlight",
        "cyberpunk": "neon lights, rainy reflective asphalt, holographic billboards, volumetric mist",
    }
    style_suffix = styles.get(vibe, styles["cinematic"])

    phases = [
        ("Establishing Shot", "Weitwinkel-Panorama der Szenerie, ruhige Kamerabewegung nach vorne.", 5.0),
        ("Medium Shot / Subject Focus", "Die Kamera nähert sich der Hauptfigur, Fokus auf Bewegung und Detail.", 4.5),
        ("Close-Up & Action", "Nahaufnahme von Emotion und Mimik, dynamischer Lichteinfall, dramatische Akzente.", 4.0),
        ("Climax / Tension", "Dynamische Kameradrehung oder schnelle Vorwärtsfahrt, Höhepunkt der Handlung.", 4.0),
        ("Resolution / Final Glow", "Sanftes Weggleiten der Kamera in die Totale, Ausklingen der Atmosphäre.", 5.0),
    ]

    segments = []
    for i in range(shot_count):
        phase_idx = min(i, len(phases) - 1)
        phase_title, camera_move, duration = phases[phase_idx]

        prompt_text = f"{base_concept}. {camera_move}. {style_suffix}"
        segments.append({
            "id": i + 1,
            "title": f"Szene {i + 1}: {phase_title}",
            "duration": duration,
            "prompt": prompt_text,
            "from_prev": True if i > 0 else False,
            "camera": camera_move,
            "status": "ready",
        })

    return segments


