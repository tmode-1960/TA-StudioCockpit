"""thomo.ART StudioCockpit - Local Backend Server and Desktop App

Lightweight HTTP server and native desktop wrapper interfacing with ComfyUI.
Features:
- Native Windows desktop app window via pywebview (Edge WebView2)
- Zero CORS/Origin proxy forwarding to ComfyUI (eliminates ComfyUI 403 warnings)
- Direct output folder integration (configurable local ComfyUI output directory)
- Support for ComfyUI in WSL, native Windows, or remote networks
"""

from __future__ import annotations

import argparse
import base64
import ctypes
import glob
import http.server
import io
import json
import os
import random
import re
import shlex
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import webbrowser
import zipfile
from typing import Any
from PIL import Image

import comfy_client
from comfy_client import ComfyClient, build_flexmod_api_prompt, KNOWN_LORA_TRIGGERS
from modules import discord_gif, gallery_indexer, music_maker, updater, video_maker

APP_VERSION = "1.17"
BIND_HOST = "127.0.0.1"
PORT = 8095
COMFY_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = ""
LMS_URL = "http://127.0.0.1:1234"
OLLAMA_URL = "http://127.0.0.1:11434"

if getattr(sys, "frozen", False):
    BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(sys.executable)))
    DATA_ROOT = os.path.dirname(os.path.abspath(sys.executable))
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_ROOT = BUNDLE_DIR

BASE_DIR = DATA_ROOT
WEB_DIR = os.path.join(BUNDLE_DIR, "web")
CONFIG_PATH = os.path.join(DATA_ROOT, "data", "config.json")
WORKFLOW_PATH = os.path.join(BUNDLE_DIR, "workflows", "TA-FLEXMOD-LLM_v2.92.json")
WORKFLOW_VERSION = "v2.92"
WORKFLOW_NAME = "TA-FLEXMOD-LLM v2.92"

# In-memory job state
ACTIVE_JOBS: dict[str, dict] = {}
ACTIVE_JOBS_LOCK = threading.Lock()
_ACTIVE_JOBS_TTL_SEC = 1800
_ACTIVE_JOBS_MAX_ENTRIES = 200


DEFAULT_LAUNCH_CMD = ""
CONFIG_LOCK = threading.Lock()
_NO_WINDOW_FLAGS = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
_FORBIDDEN_LAUNCH_TOKENS = (";", "&&", "||", "|", "&", "`", "$(", "<", ">")


def _prune_active_jobs_locked(now: float | None = None) -> None:
    """Prune expired or excess completed entries in ACTIVE_JOBS (caller must hold ACTIVE_JOBS_LOCK)."""
    ts = now if now is not None else time.time()
    cutoff = ts - _ACTIVE_JOBS_TTL_SEC
    terminal_statuses = ("done", "error", "cancelled", "interrupted")
    expired = [
        pid for pid, job in ACTIVE_JOBS.items()
        if job.get("status") in terminal_statuses
        and (job.get("finished_at") or job.get("start_time") or 0) < cutoff
    ]
    for pid in expired:
        ACTIVE_JOBS.pop(pid, None)
    if len(ACTIVE_JOBS) > _ACTIVE_JOBS_MAX_ENTRIES:
        removable = sorted(
            (job.get("finished_at") or job.get("start_time") or 0, pid)
            for pid, job in ACTIVE_JOBS.items()
            if job.get("status") != "running"
        )
        excess = len(ACTIVE_JOBS) - _ACTIVE_JOBS_MAX_ENTRIES
        for _, pid in removable[:excess]:
            ACTIVE_JOBS.pop(pid, None)


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


def _is_allowed_origin(origin: str) -> bool:
    """Return True if Origin is empty or matches the local Cockpit host and port."""
    if not origin:
        return True
    if origin.strip().lower() == "null":
        return False
    try:
        parsed = urllib.parse.urlparse(origin)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    allowed_hosts = {"127.0.0.1", "localhost", "::1"}
    if BIND_HOST and BIND_HOST not in ("", "0.0.0.0", "::"):
        allowed_hosts.add(BIND_HOST.lower())
    if host not in allowed_hosts:
        return False
    port = parsed.port
    if port is None:
        return (parsed.scheme == "http" and PORT == 80) or (parsed.scheme == "https" and PORT == 443)
    return port == PORT


def _validate_http_url(url: str, field_name: str = "url") -> str:
    """Validate that a configured service URL uses http:// or https:// without control characters."""
    val = str(url or "").strip()
    if not val:
        return ""
    if any(ch in val for ch in ("\r", "\n", "\x00")) or any(ch.isspace() for ch in val):
        raise ValueError(f"Ungültige URL für {field_name}: Steuer- oder Leerzeichen nicht erlaubt.")
    try:
        parsed = urllib.parse.urlparse(val)
    except Exception as exc:
        raise ValueError(f"Ungültige URL für {field_name}: {exc}") from exc
    if parsed.scheme not in ("http", "https") or not parsed.netloc or not parsed.hostname:
        raise ValueError(f"Ungültige URL für {field_name}: nur http:// und https:// erlaubt.")
    return val


def _validate_launch_command(cmd: str) -> str:
    """Reject control characters and shell injection operators in configured launch commands."""
    val = str(cmd or "").strip()
    if not val:
        return ""
    if any(ch in val for ch in ("\r", "\n", "\x00")) or any(tok in val for tok in _FORBIDDEN_LAUNCH_TOKENS):
        raise ValueError(
            "Ungültige Zeichen im Start-Befehl (Shell-Operatoren wie ; & | < > ` $() sind nicht erlaubt)."
        )
    return val

DEFAULT_MODEL_PRESETS = [
    {"name": "ZImage (BF16)", "model_file": "[D] zimage/z_image_turbo_bf16.safetensors", "clip_name_1": "zimage/qwen_3_4b_bf16.safetensors", "clip_name_2": "", "clip_type": "lumina2", "clip_device": "default", "vae_name": "zimage/zImage_vae.safetensors", "shift": 3, "weight_dtype": "auto"},
    {"name": "Qwen-Image 2.1", "model_file": "[D] qwen/qwen_image_2.1_int8_convrot.safetensors", "clip_name_1": "qwen/qwen3vl_8b_int8_convrot.safetensors", "clip_name_2": "", "clip_type": "qwen_image", "clip_device": "default", "vae_name": "qwen/qwen_image_2.1_vae_bf16.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "Qwen-Image 2.1 Turbo", "model_file": "[D] qwen/qwen_image_2.1_turbo_bf16.safetensors", "clip_name_1": "qwen/qwen3vl_8b_bf16.safetensors", "clip_name_2": "", "clip_type": "qwen_image", "clip_device": "default", "vae_name": "qwen/qwen_image_2.1_vae_bf16.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "Krea2-Turbo", "model_file": "[D] krea2/sickOllie_krea2_full_bf16.safetensors", "clip_name_1": "krea2/qwen3vl_4b_fp8_scaled.safetensors", "clip_name_2": "", "clip_type": "krea2", "clip_device": "default", "vae_name": "krea2/qwen_image_vae.safetensors", "weight_dtype": "auto", "shift": "1.0"},
    {"name": "FLUX3-Klein-Image", "model_file": "[D] flux3/flux3_image_klein_bf16.safetensors", "clip_name_1": "flux3/qwen3vl_4b_bf16.safetensors", "clip_name_2": "", "clip_type": "flux3", "clip_device": "default", "vae_name": "flux3/flux2-vae.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "MOSS-Image JIB", "model_file": "[D] moss/Jib_Mix_Moss_V2_H_int8_00001_.safetensors", "clip_name_1": "moss/qwen3.5_9b_moss_image_sft_w4a8_gptq.safetensors", "clip_name_2": "", "clip_type": "moss_image", "clip_device": "default", "vae_name": "moss/moss_image_vae_bf16.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "MOSS-Image 8 Step", "model_file": "[D] moss/moss_image_sft_turbo_int8_convrot.safetensors", "clip_name_1": "moss/qwen3.5_9b_moss_image_sft_w4a8_gptq.safetensors", "clip_name_2": "", "clip_type": "moss_image", "clip_device": "default", "vae_name": "moss/moss_image_vae_bf16.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "FLUX1-DEV-FP8", "model_file": "[D] flux/flux1-dev-fp8.safetensors", "clip_name_1": "FLUX/clip_l.safetensors", "clip_name_2": "flux/t5xxl_fp16.safetensors", "clip_type": "flux", "clip_device": "default", "vae_name": "flux/FLUX_VAE.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "KROMOSS", "model_file": "[D] moss/kromoss_int8_convrot.safetensors", "clip_name_1": "moss/qwen3.5_9b_moss_image_sft_w4a8_gptq.safetensors", "clip_name_2": "", "clip_type": "moss_image", "clip_device": "default", "vae_name": "moss/moss_image_vae_bf16.safetensors", "weight_dtype": "auto", "shift": ""},
    {"name": "Minimax H3 Image", "model_file": "[D] minimax_h3_image/minimax_h3_image_pruned_int8_convrot.safetensors", "clip_name_1": "minimax_h3/qwen3vl_32b_minimax_h3_int8_convrot.safetensors", "clip_name_2": "", "clip_type": "auto", "clip_device": "default", "vae_name": "minimax_h3_image/minimax_h3_image_vae_fp16.safetensors", "weight_dtype": "auto", "shift": ""},
]

DEFAULT_SAMPLER_PRESETS = {
    "Z-Image Turbo": {"steps": 9, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "beta"},
    "Qwen-Image 2.1": {"steps": 25, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "simple"},
    "Qwen-Image 2.1 Turbo": {"steps": 8, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "normal"},
    "Krea2-Turbo": {"steps": 9, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "beta"},
    "FLUX3-Klein-Image": {"steps": 25, "cfg": 3.5, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "normal"},
    "MOSS-Image SFT": {"steps": 50, "cfg": 3.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "sgm_uniform"},
    "MOSS-Image 8 Step": {"steps": 8, "cfg": 2.5, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "er_sde", "scheduler": "simple"},
    "FLUX1-DEV-FP8": {"steps": 20, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "simple"},
    "Minimax H3 Image": {"steps": 6, "cfg": 1.0, "start_at_step": 0, "end_at_step": 9999, "sampler_name": "euler", "scheduler": "simple"},
}


def load_config() -> dict:
    global COMFY_URL, OUTPUT_DIR, LMS_URL, OLLAMA_URL
    cfg = {
        "comfy_url": COMFY_URL,
        "comfy_launch_cmd": DEFAULT_LAUNCH_CMD,
        "output_dir": OUTPUT_DIR,
        "lms_url": LMS_URL,
        "ollama_url": OLLAMA_URL,
        "language": "de",
    }
    if os.path.isfile(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                cfg.update(saved)
                COMFY_URL = cfg.get("comfy_url", COMFY_URL)
                OUTPUT_DIR = cfg.get("output_dir", OUTPUT_DIR)
                LMS_URL = cfg.get("lms_url", LMS_URL)
                OLLAMA_URL = cfg.get("ollama_url", OLLAMA_URL)
        except Exception:
            pass

    # Authoritative constants always override stale values from JSON
    cfg["app_version"] = APP_VERSION
    cfg["workflow_version"] = WORKFLOW_VERSION
    cfg["workflow_name"] = WORKFLOW_NAME
    return cfg


CLOUD_API_KEY_FIELDS = {
    "gemini_api_key": ("Gemini", "GEMINI_API_KEY"),
    "openai_api_key": ("OpenAI", "OPENAI_API_KEY"),
    "openrouter_api_key": ("OpenRouter", "OPENROUTER_API_KEY"),
    "groq_api_key": ("Groq", "GROQ_API_KEY"),
}


class _DATA_BLOB(ctypes.Structure):
    _fields_ = [
        ("cbData", ctypes.c_uint32),
        ("pbData", ctypes.POINTER(ctypes.c_ubyte)),
    ]


def _dpapi_encrypt(plaintext: str) -> str:
    """Encrypt a secret string with Windows DPAPI (CurrentUser scope)."""
    if not plaintext:
        return ""
    if plaintext.startswith("dpapi:") or plaintext.startswith("plain:"):
        return plaintext
    if sys.platform != "win32":
        return f"plain:{base64.b64encode(plaintext.encode('utf-8')).decode('ascii')}"
    raw = plaintext.encode("utf-8")
    in_buf = (ctypes.c_ubyte * len(raw)).from_buffer_copy(raw)
    blob_in = _DATA_BLOB(len(raw), in_buf)
    blob_out = _DATA_BLOB()
    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    if not crypt32.CryptProtectData(
        ctypes.byref(blob_in), None, None, None, None, 0x01, ctypes.byref(blob_out)
    ):
        raise OSError("Windows DPAPI CryptProtectData failed")
    try:
        encrypted = ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        kernel32.LocalFree(blob_out.pbData)
    return "dpapi:" + base64.b64encode(encrypted).decode("ascii")


def _dpapi_decrypt(token: str) -> str:
    """Decrypt a DPAPI-protected secret string stored in config.json."""
    if not token or not isinstance(token, str):
        return ""
    current = token.strip()
    for _ in range(5):
        if current.startswith("plain:"):
            try:
                current = base64.b64decode(current[6:].encode("ascii")).decode("utf-8").strip()
            except Exception:
                return ""
            continue
        if not current.startswith("dpapi:"):
            return current
        if sys.platform != "win32":
            return ""
        try:
            raw = base64.b64decode(current[6:].encode("ascii"))
        except Exception:
            return ""
        if not raw:
            return ""
        in_buf = (ctypes.c_ubyte * len(raw)).from_buffer_copy(raw)
        blob_in = _DATA_BLOB(len(raw), in_buf)
        blob_out = _DATA_BLOB()
        crypt32 = ctypes.windll.crypt32
        kernel32 = ctypes.windll.kernel32
        if not crypt32.CryptUnprotectData(
            ctypes.byref(blob_in), None, None, None, None, 0x01, ctypes.byref(blob_out)
        ):
            return ""
        try:
            decrypted = ctypes.string_at(blob_out.pbData, blob_out.cbData)
        finally:
            kernel32.LocalFree(blob_out.pbData)
        current = decrypted.decode("utf-8", errors="ignore").strip()
    return "" if (current.startswith("dpapi:") or current.startswith("plain:")) else current


def get_cloud_api_keys(cfg: dict | None = None) -> dict[str, str]:
    """Return decrypted {ENV_VAR: key} for all configured cloud LLM providers."""
    if cfg is None:
        cfg = load_config()
    result: dict[str, str] = {}
    for field, (_provider, env_var) in CLOUD_API_KEY_FIELDS.items():
        val = _dpapi_decrypt(cfg.get(field, ""))
        if val:
            result[env_var] = val
    return result


def _mask_api_key(secret: str) -> str:
    if not secret:
        return ""
    if len(secret) > 6:
        return f"••••{secret[-4:]}"
    return "••••"


def sanitize_config_for_client(cfg: dict) -> dict:
    """Return a copy of cfg safe to send to the browser (never exposes raw API keys)."""
    safe = dict(cfg)
    status: dict[str, dict] = {}
    for field, (_provider, env_var) in CLOUD_API_KEY_FIELDS.items():
        raw_token = safe.pop(field, "")
        studio_val = _dpapi_decrypt(raw_token)
        env_val = os.environ.get(env_var, "").strip()
        effective = studio_val or env_val
        source = "studio" if studio_val else ("env" if env_val else "none")
        status[field] = {
            "configured": bool(effective),
            "source": source,
            "masked": _mask_api_key(effective),
        }
    safe["cloud_api_keys_status"] = status
    return safe


def save_config(updates: dict) -> None:
    global COMFY_URL, OUTPUT_DIR, LMS_URL, OLLAMA_URL
    with CONFIG_LOCK:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        current = load_config()
        updates_copy = dict(updates)
        key_updates = updates_copy.pop("cloud_api_keys_updates", None)
        # Never persist raw API key fields directly from unencrypted payloads
        for field in CLOUD_API_KEY_FIELDS:
            if field in updates_copy:
                raw_val = str(updates_copy.pop(field) or "").strip()
                if raw_val:
                    current[field] = _dpapi_encrypt(raw_val)
                else:
                    current.pop(field, None)
        if isinstance(key_updates, dict):
            for field, op in key_updates.items():
                if field not in CLOUD_API_KEY_FIELDS or not isinstance(op, dict):
                    continue
                action = op.get("action")
                if action == "clear":
                    current.pop(field, None)
                elif action == "set":
                    val = str(op.get("value") or "").strip()
                    if val:
                        current[field] = _dpapi_encrypt(val)
        current.update(updates_copy)
        for url_field in ("comfy_url", "lms_url", "ollama_url"):
            if url_field in updates_copy:
                raw_url = str(updates_copy.get(url_field) or "").strip()
                if raw_url:
                    current[url_field] = _validate_http_url(raw_url, url_field)
                else:
                    current[url_field] = ""
        if "comfy_launch_cmd" in updates_copy:
            current["comfy_launch_cmd"] = _validate_launch_command(
                str(updates_copy.get("comfy_launch_cmd") or "")
            )
        # Don't persist runtime version constants into config.json
        current.pop("app_version", None)
        current.pop("workflow_version", None)
        current.pop("workflow_name", None)
        current.pop("cloud_api_keys_status", None)
        COMFY_URL = current.get("comfy_url", COMFY_URL)
        OUTPUT_DIR = current.get("output_dir", OUTPUT_DIR)
        LMS_URL = current.get("lms_url", LMS_URL)
        OLLAMA_URL = current.get("ollama_url", OLLAMA_URL)
        tmp_path = f"{CONFIG_PATH}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(current, f, indent=2)
        os.replace(tmp_path, CONFIG_PATH)


load_config()


IMAGE_EXTENSIONS = (".png", ".webp", ".jpg", ".jpeg")

REQUIRED_NODE_PACKS = [
    {
        "id": "TA-ComfyUI-Nodes-Pack",
        "name": "TA-ComfyUI-Nodes-Pack",
        "repo": "https://github.com/tmode-1960/TA-ComfyUI-Nodes-Pack",
        "required": True,
        "description_de": "Kern-Nodes für Presets, SmartLLM, PromptHub, KSampler & Export",
        "description_en": "Core nodes for Presets, SmartLLM, PromptHub, KSampler & Export",
        "nodes": [
            "TAModelPreset", "TASamplerPreset", "TAKSampler", "TASmartLLM",
            "TAPromptHub", "TAPromptController", "TA_LLM_PromptSelector",
            "TASageAttentionToggler", "TAFastLaplacianSharpen", "TAFilenameGenerator",
            "TAFluxGuidanceGate", "TASaveImageWithPrompt", "TASaveImageOptional",
            "TASeedVR2Gate", "TACleanupSwitch", "TAFilmGrain",
        ],
    },
    {
        "id": "ComfyUI-GGUF",
        "name": "ComfyUI-GGUF",
        "repo": "https://github.com/city96/ComfyUI-GGUF",
        "required": True,
        "description_de": "GGUF-Loader für quantisierte Flux/Z-Image/Qwen-Modelle",
        "description_en": "GGUF loader for quantized Flux/Z-Image/Qwen models",
        "nodes": ["UnetLoaderGGUF", "CLIPLoaderGGUF"],
    },
    {
        "id": "ComfyUI-Lora-Manager",
        "name": "ComfyUI-Lora-Manager",
        "repo": "https://github.com/willmiao/ComfyUI-Lora-Manager",
        "required": True,
        "description_de": "LoRA-Loader, Trigger-Words und integrierter LoRA-Manager",
        "description_en": "LoRA loader, trigger words and integrated LoRA Manager",
        "nodes": ["Lora Loader (LoraManager)", "TriggerWord Toggle (LoraManager)"],
    },
    {
        "id": "ComfyUI-Pixaroma",
        "name": "ComfyUI-Pixaroma",
        "repo": "https://github.com/pixaroma/ComfyUI-Pixaroma",
        "required": True,
        "description_de": "Seitenverhältnis- & Auflösungs-Auswahl (PixaromaResolution)",
        "description_en": "Aspect ratio & resolution selector (PixaromaResolution)",
        "nodes": ["PixaromaResolution", "PixaromaRunTimer"],
    },
    {
        "id": "SeedVarianceEnhancer",
        "name": "SeedVarianceEnhancer",
        "repo": "https://github.com/ChangeTheConstants/SeedVarianceEnhancer",
        "required": True,
        "description_de": "Mehr Bildvariation bei Turbo-/Distilled-Modellen",
        "description_en": "Enhanced seed variance for turbo/distilled models",
        "nodes": ["SeedVarianceEnhancer"],
    },
    {
        "id": "ComfyUI-Easy-Use",
        "name": "ComfyUI-Easy-Use",
        "repo": "https://github.com/yolain/ComfyUI-Easy-Use",
        "required": True,
        "description_de": "Seed-Steuerung und Hilfs-Nodes (easy seed)",
        "description_en": "Seed control and utility nodes (easy seed)",
        "nodes": ["easy seed", "easy showAnything"],
    },
    {
        "id": "ComfyUI-KJNodes",
        "name": "ComfyUI-KJNodes",
        "repo": "https://github.com/kijai/ComfyUI-KJNodes",
        "required": True,
        "description_de": "Workflow-Weichen & String-Hilfsnodes (LazySwitchKJ)",
        "description_en": "Workflow switches & string utilities (LazySwitchKJ)",
        "nodes": ["LazySwitchKJ", "StringConstant"],
    },
    {
        "id": "ComfyUI-Custom-Scripts",
        "name": "ComfyUI-Custom-Scripts",
        "repo": "https://github.com/pythongosssss/ComfyUI-Custom-Scripts",
        "required": True,
        "description_de": "Mathematik- & Textanzeige-Nodes (pysssss)",
        "description_en": "Math expression & text display nodes (pysssss)",
        "nodes": ["MathExpression|pysssss", "ShowText|pysssss"],
    },
    {
        "id": "ComfyUI_Comfyroll_CustomNodes",
        "name": "ComfyUI_Comfyroll_CustomNodes",
        "repo": "https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes",
        "required": True,
        "description_de": "Text- & Bild-Overlay für Signatur, Logo & KI-Hinweis (CR Overlay Text / Transparent Image)",
        "description_en": "Text & image overlay for signature, logo & AI disclaimer (CR Overlay Text / Transparent Image)",
        "nodes": ["CR Overlay Text", "CR Overlay Transparent Image"],
    },
    {
        "id": "ComfyUI-SeedVR2_VideoUpscaler",
        "name": "ComfyUI-SeedVR2_VideoUpscaler",
        "repo": "https://github.com/ainvfx/ComfyUI-SeedVR2_VideoUpscaler",
        "required": False,
        "description_de": "Optional für das integrierte SeedVR2-Detail-Upscaling",
        "description_en": "Optional for integrated SeedVR2 detail upscaling",
        "nodes": ["SeedVR2LoadDiTModel", "SeedVR2LoadVAEModel", "SeedVR2VideoUpscaler"],
    },
    {
        "id": "rgthree-comfy",
        "name": "rgthree-comfy",
        "repo": "https://github.com/rgthree/rgthree-comfy",
        "required": False,
        "description_de": "Optional für Vorher/Nachher-Vergleich im ComfyUI-Graph",
        "description_en": "Optional for before/after image comparer in ComfyUI graph",
        "nodes": ["Image Comparer (rgthree)"],
    },
]

NODE_INSTALL_LOCK = threading.Lock()
NODE_INSTALL_JOB: dict = {
    "status": "idle",
    "current_pack": "",
    "completed": 0,
    "total": 0,
    "logs": [],
    "results": {},
    "error": "",
}


def _detect_comfy_output_dir(cfg: dict | None = None) -> str:
    """Infer ComfyUI's local output directory from comfy_launch_cmd when available."""
    if cfg is None:
        cfg = load_config()
    cmd = (cfg.get("comfy_launch_cmd") or "").strip()
    if not cmd:
        return ""
    # Extract script/executable path (handles quoted paths or plain paths)
    if cmd.startswith('"'):
        end_q = cmd.find('"', 1)
        script_path = cmd[1:end_q] if end_q > 1 else cmd.strip('"')
    else:
        script_path = cmd
        if not os.path.exists(script_path):
            script_path = cmd.split()[0]
    if not script_path or not os.path.exists(script_path):
        return ""
    base = script_path if os.path.isdir(script_path) else os.path.dirname(os.path.abspath(script_path))
    for candidate in (
        os.path.join(base, "ComfyUI", "output"),
        os.path.join(base, "output"),
        os.path.join(os.path.dirname(base), "ComfyUI", "output"),
    ):
        if os.path.isdir(candidate):
            return candidate
    return ""


def get_output_dir() -> str:
    """Return the configured output directory, or auto-detected ComfyUI output dir if unset."""
    cfg = load_config()
    configured = (cfg.get("output_dir") or "").strip()
    if configured:
        return configured
    return _detect_comfy_output_dir(cfg)


def scan_output_images(out_dir: str) -> list[tuple[float, str, str]]:
    """Recursively scan out_dir for generated image files.

    Returns a list of (mtime, rel_path_unix, full_path) sorted newest-first.
    """
    results: list[tuple[float, str, str]] = []
    if not out_dir or not os.path.isdir(out_dir):
        return results
    for root, _, filenames in os.walk(out_dir):
        for name in filenames:
            if name.lower().endswith(IMAGE_EXTENSIONS):
                full_path = os.path.join(root, name)
                try:
                    mtime = os.path.getmtime(full_path)
                    rel_path = os.path.relpath(full_path, out_dir).replace("\\", "/")
                    results.append((mtime, rel_path, full_path))
                except Exception:
                    pass
    results.sort(key=lambda x: x[0], reverse=True)
    return results


def extract_image_metadata(img_path: str) -> dict:
    meta = {
        "positive_prompt": "",
        "additional_prompt": "",
        "negative_prompt": "",
        "seed": None,
        "model": "",
    }
    # 1. Prioritize embedded PNG/WebP metadata (contains clean TAPromptHub inputs without concatenated tags)
    try:
        from PIL import Image
        with Image.open(img_path) as im:
            raw_prompt = im.info.get("prompt")
            if raw_prompt and isinstance(raw_prompt, str):
                pdata = json.loads(raw_prompt)
                for n in pdata.values():
                    if n.get("class_type") == "TAPromptHub":
                        inp = n.get("inputs", {})
                        pos = inp.get("positive_prompt")
                        add_p = inp.get("additional_prompt")
                        neg = inp.get("negative_prompt")
                        if isinstance(pos, str) and pos.strip():
                            meta["positive_prompt"] = pos.strip()
                        if isinstance(add_p, str) and add_p.strip():
                            meta["additional_prompt"] = add_p.strip()
                        if isinstance(neg, str) and neg.strip():
                            meta["negative_prompt"] = neg.strip()
                        break

                if not meta["positive_prompt"]:
                    for n in pdata.values():
                        if n.get("class_type") == "CLIPTextEncode":
                            txt = n.get("inputs", {}).get("text")
                            if isinstance(txt, str) and txt.strip():
                                meta["positive_prompt"] = txt.strip()
                                break

                # Extract seed (prefer easy seed node 1204 or any integer seed)
                for nid, n in pdata.items():
                    if n.get("class_type") == "easy seed":
                        s = n.get("inputs", {}).get("seed")
                        if isinstance(s, (int, float)):
                            meta["seed"] = int(s)
                            break
                if meta["seed"] is None:
                    for nid, n in pdata.items():
                        s = n.get("inputs", {}).get("seed")
                        if isinstance(s, (int, float)):
                            meta["seed"] = int(s)
                            break

                # Extract model
                for nid, n in pdata.items():
                    if n.get("class_type") == "TAModelPreset":
                        meta["model"] = n.get("inputs", {}).get("preset", "")
                        break
    except Exception:
        pass

    # 2. Fallback to sidecar .txt file (standard for TASaveImageWithPrompt) if positive_prompt not found
    if not meta["positive_prompt"]:
        txt_path = os.path.splitext(img_path)[0] + ".txt"
        if os.path.isfile(txt_path):
            try:
                with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                m_pos = re.search(r"POSITIVE PROMPT:\s*\n(.*?)(?=\nNEGATIVE PROMPT:|\n=+|\Z)", content, re.DOTALL)
                if m_pos:
                    raw_pos = m_pos.group(1).strip()
                    # Clean out workflow-added boilerplate if present
                    raw_pos = re.sub(r",\s*This image is a masterpiece\. The subject is sharply depicted with outstanding detail\.?", "", raw_pos, flags=re.IGNORECASE)
                    meta["positive_prompt"] = raw_pos.strip(" ,")
                m_neg = re.search(r"NEGATIVE PROMPT:\s*\n(.*?)(?=\n=+|\Z)", content, re.DOTALL)
                if m_neg:
                    meta["negative_prompt"] = m_neg.group(1).strip()
            except Exception:
                pass

    return meta


def get_wt_wsl_profile() -> str | None:
    """Finds the WSL Ubuntu profile name configured in Windows Terminal settings."""
    try:
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        settings_path = os.path.join(
            local_app_data, "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json"
        )
        if os.path.isfile(settings_path):
            with open(settings_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            profiles = data.get("profiles", {}).get("list", [])
            for p in profiles:
                if p.get("source") == "Microsoft.WSL" and "26.04" in p.get("name", ""):
                    return p.get("name")
            for p in profiles:
                if p.get("source") == "Microsoft.WSL":
                    return p.get("name")
            for p in profiles:
                if "ubuntu" in p.get("name", "").lower():
                    return p.get("name")
    except Exception:
        pass
    return None


class StudioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _send_cors_origin_header(self):
        origin = self.headers.get("Origin", "").strip()
        if origin and _is_allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _check_post_origin(self) -> bool:
        origin = self.headers.get("Origin", "").strip()
        sec_fetch_site = self.headers.get("Sec-Fetch-Site", "").strip().lower()
        if (origin and not _is_allowed_origin(origin)) or sec_fetch_site == "cross-site":
            self.send_json({"error": "Cross-Origin-Anfrage blockiert."}, status=403)
            return False
        return True

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "").strip()
        if origin and not _is_allowed_origin(origin):
            self.send_response(403)
            self.end_headers()
            return
        self.send_response(200)
        self._send_cors_origin_header()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            self.handle_status()
            return
        elif path == "/api/hw_monitor":
            self.handle_hw_monitor()
            return
        elif path == "/api/config":
            self.send_json(sanitize_config_for_client(load_config()))
            return
        elif path == "/api/history":
            self.handle_history()
            return
        elif path == "/api/poll_generation":
            query_params = urllib.parse.parse_qs(parsed.query)
            pid = query_params.get("prompt_id", [""])[0]
            with ACTIVE_JOBS_LOCK:
                job = dict(ACTIVE_JOBS.get(pid, {"status": "unknown"}))
            self.send_json(job)
            return
        elif path.startswith("/output/"):
            self.handle_output_file(path[len("/output/"):])
            return
        elif path.startswith("/proxy/comfy/"):
            self.forward_to_comfy("GET", path[len("/proxy/comfy/"):], parsed.query, None)
            return
        elif path.startswith("/ta_model_presets/") or path.startswith("/ta_sampler_presets/"):
            self.forward_to_comfy("GET", path, parsed.query, None)
            return
        elif path == "/api/presets":
            self.handle_presets()
            return
        elif path == "/api/llm_models":
            self.handle_llm_models()
            return
        elif path == "/api/llm_defaults":
            self.handle_llm_defaults()
            return
        elif path == "/api/check_llm":
            self.handle_check_llm()
            return
        elif path == "/api/check_nodes":
            self.handle_check_nodes()
            return
        elif path == "/api/bg_remove/status":
            self.handle_bg_remove_status()
            return
        elif path == "/api/install_nodes_status":
            self.handle_install_nodes_status()
            return
        elif path == "/api/browse_folder":
            self.handle_browse_folder(parsed.query)
            return
        elif path == "/api/browse_file":
            self.handle_browse_file(parsed.query)
            return
        elif path == "/api/browse_i2i_image":
            self.handle_browse_i2i_image()
            return
        elif path in ("/api/workflow/loras", "/api/loras"):
            self.handle_workflow_loras()
            return
        elif path.startswith("/view"):
            self.forward_to_comfy("GET", "view", parsed.query, None)
            return
        elif discord_gif.handle_get(self, path, parsed):
            return
        elif video_maker.handle_get(self, path, parsed):
            return
        elif gallery_indexer.handle_get(self, path, parsed):
            return
        elif updater.handle_get(self, path, parsed):
            return
        elif music_maker.handle_get(self, path, parsed):
            return

        super().do_GET()

    def do_POST(self):
        if not self._check_post_origin():
            return
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else None

        if path == "/api/config":
            try:
                data = json.loads(post_body.decode("utf-8"))
                save_config(data)
                self.send_json({"status": "saved", "config": sanitize_config_for_client(load_config())})
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(e).encode("utf-8"))
            return
        elif path == "/api/generate":
            self.handle_generate(post_body)
            return
        elif path == "/api/cancel_generation":
            self.handle_cancel_generation()
            return
        elif path == "/api/free_vram":
            self.handle_free_vram()
            return
        elif path == "/api/delete_image":
            self.handle_delete_image(post_body)
            return
        elif path == "/api/extract_image_params":
            self.handle_extract_image_params(post_body)
            return
        elif path == "/api/open_folder":
            self.handle_open_folder()
            return
        elif path == "/api/launch_comfy":
            self.handle_launch_comfy(post_body)
            return
        elif path == "/api/install_nodes":
            self.handle_install_nodes(post_body)
            return
        elif path == "/api/bg_remove":
            self.handle_bg_remove(post_body)
            return
        elif path in ("/upload/image", "/api/upload_image"):
            self.forward_to_comfy("POST", "upload/image", parsed.query, post_body)
            return
        elif path.startswith("/proxy/comfy/"):
            self.forward_to_comfy("POST", path[len("/proxy/comfy/"):], parsed.query, post_body)
            return
        elif path.startswith("/ta_model_presets/") or path.startswith("/ta_sampler_presets/"):
            self.forward_to_comfy("POST", path, parsed.query, post_body)
            return
        elif discord_gif.handle_post(self, path, parsed, post_body):
            return
        elif video_maker.handle_post(self, path, parsed, post_body):
            return
        elif gallery_indexer.handle_post(self, path, parsed, post_body):
            return
        elif updater.handle_post(self, path, parsed, post_body):
            return
        elif music_maker.handle_post(self, path, parsed, post_body):
            return

        self.send_response(404)
        self.end_headers()

    def handle_cancel_generation(self):
        try:
            client = ComfyClient(COMFY_URL)
            int_ok = client.interrupt()
            q_ok = client.clear_queue()
            now = time.time()
            with ACTIVE_JOBS_LOCK:
                for pid, job in list(ACTIVE_JOBS.items()):
                    if job.get("status") == "running":
                        job["status"] = "cancelled"
                        job["finished_at"] = now
            self.send_json({"status": "cancelled", "interrupt": int_ok, "queue_cleared": q_ok})
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_delete_image(self, post_body: bytes | None):
        if not post_body:
            self.send_json({"error": "Keine Daten empfangen."}, status=400)
            return
        try:
            data = json.loads(post_body.decode("utf-8"))
            fname = data.get("filename")
            if not fname:
                self.send_json({"error": "Kein Dateiname angegeben."}, status=400)
                return
            cfg = load_config()
            out_dir = cfg.get("output_dir", OUTPUT_DIR)
            bname = os.path.basename(fname)
            target = os.path.join(out_dir, bname)
            deleted = False
            if os.path.isfile(target):
                os.remove(target)
                deleted = True

            # Also delete associated .txt prompt file if present
            base_no_ext = os.path.splitext(target)[0]
            txt_file = base_no_ext + ".txt"
            if os.path.isfile(txt_file):
                try:
                    os.remove(txt_file)
                except Exception:
                    pass

            if deleted:
                self.send_json({"success": True, "filename": bname})
            else:
                self.send_json({"error": f"Datei nicht gefunden: {bname}"}, status=404)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_llm_defaults(self):
        defaults = {"t2i": {}, "i2i": {}}
        try:
            with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
                wf = json.load(f)
            for n in wf.get("nodes", []):
                nid = n.get("id")
                w = n.get("widgets_values_named")
                if not isinstance(w, dict):
                    continue
                if nid == 1878:
                    defaults["t2i"] = {
                        "model": w.get("model", ""),
                        "system_prompt": w.get("system_prompt", ""),
                        "temperature": float(w.get("temperature", 0.7)),
                        "max_tokens": int(w.get("max_tokens", 2048)),
                        "request_timeout": int(w.get("request_timeout", 120)),
                        "thinking_mode": bool(w.get("thinking_mode", False)),
                        "unload_image_models_first": bool(w.get("unload_image_models_first", True)),
                        "unload_llm_after": bool(w.get("unload_llm_after", True)),
                    }
                elif nid == 1879:
                    defaults["i2i"] = {
                        "model": w.get("model", ""),
                        "user_prompt": w.get("user_prompt", ""),
                        "system_prompt": w.get("system_prompt", ""),
                        "temperature": float(w.get("temperature", 0.3)),
                        "max_tokens": int(w.get("max_tokens", 1024)),
                        "request_timeout": int(w.get("request_timeout", 120)),
                        "thinking_mode": bool(w.get("thinking_mode", False)),
                        "unload_image_models_first": bool(w.get("unload_image_models_first", True)),
                        "unload_llm_after": bool(w.get("unload_llm_after", True)),
                    }
        except Exception:
            pass
        self.send_json(defaults)

    def _fetch_comfy_json(self, url, timeout=2.5):
        req = urllib.request.Request(url, headers={"User-Agent": "tA-StudioCockpit"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
        return None

    def _sanitize_smart_llm_nodes(self, prompt_dict: dict) -> None:
        """Ensure TASmartLLM (1878/1879) model inputs match ComfyUI's live enum list."""
        try:
            data = self._fetch_comfy_json(f"{COMFY_URL}/object_info/TASmartLLM", timeout=2.5)
        except Exception:
            return
        if not isinstance(data, dict):
            return
        model_spec = data.get("TASmartLLM", {}).get("input", {}).get("required", {}).get("model")
        if not isinstance(model_spec, list) or not model_spec or not isinstance(model_spec[0], list):
            return
        valid_models = model_spec[0]

        if valid_models:
            for nid in ("1878", "1879"):
                node = prompt_dict.get(nid)
                if not isinstance(node, dict):
                    continue
                inputs = node.get("inputs")
                if not isinstance(inputs, dict):
                    continue
                if inputs.get("model") not in valid_models:
                    # Disabled nodes only need a valid enum entry to pass ComfyUI validation;
                    # enabled nodes with a stale/missing model also fall back to the first available entry.
                    inputs["model"] = valid_models[0]
        else:
            # If ComfyUI reports an empty model list (e.g. LLM server offline), prune disabled
            # TASmartLLM nodes and replace their STRING wire outputs with "".
            disabled_nids = [
                nid for nid in ("1878", "1879")
                if isinstance(prompt_dict.get(nid), dict)
                and not prompt_dict[nid].get("inputs", {}).get("llm_enable", False)
            ]
            if disabled_nids:
                disabled_set = set(disabled_nids)
                for node in prompt_dict.values():
                    inputs = node.get("inputs") if isinstance(node, dict) else None
                    if not isinstance(inputs, dict):
                        continue
                    for k, v in list(inputs.items()):
                        if isinstance(v, list) and len(v) == 2 and str(v[0]) in disabled_set:
                            inputs[k] = ""
                for nid in disabled_nids:
                    prompt_dict.pop(nid, None)

    @staticmethod
    def _detect_model_family(name: str) -> str:
        n = (name or "").lower()
        if "zimage" in n or "z-image" in n or "zit" in n or "wan" in n:
            return "zimage"
        if "krea" in n:
            return "krea2"
        if "moss" in n or "kromoss" in n:
            return "moss"
        if "minimax" in n:
            return "minimax"
        if "qwen" in n:
            return "qwen"
        if "flux" in n:
            return "flux"
        return ""

    def _collect_installed_comfy_models(self, comfy_url: str):
        """Query ComfyUI /models/* and /object_info/* for installed UNet/Checkpoint/GGUF files (includes extra_model_paths.yaml)."""
        installed_paths = set()
        installed_basenames = set()

        def _add_entry(entry: str):
            if not isinstance(entry, str):
                return
            cleaned = re.sub(r"^\[[A-Za-z0-9_]+\]\s*", "", entry.strip())
            if not cleaned:
                return
            norm = cleaned.lower().replace("\\", "/")
            installed_paths.add(norm)
            installed_basenames.add(norm.split("/")[-1])

        # 1. Direct ComfyUI /models/{folder} REST endpoints (reads folder_paths + extra_model_paths.yaml)
        for folder in ("diffusion_models", "unet", "checkpoints"):
            try:
                data = self._fetch_comfy_json(f"{comfy_url}/models/{folder}", timeout=2.5)
                if isinstance(data, list):
                    for entry in data:
                        _add_entry(entry)
            except Exception:
                continue

        # 2. Fallback/supplement via /object_info/{loader_node} (also covers GGUF / custom loaders)
        loader_nodes = (
            "UNETLoader",
            "UnetLoaderGGUF",
            "CheckpointLoaderSimple",
            "CheckpointLoader",
            "DiffusionModelLoader",
        )
        file_keys = ("unet_name", "ckpt_name", "model_name", "gguf_name", "diffusion_model")
        for node_name in loader_nodes:
            try:
                data = self._fetch_comfy_json(f"{comfy_url}/object_info/{node_name}", timeout=2.5)
                if not isinstance(data, dict):
                    continue
                node_info = data.get(node_name, {}).get("input", {})
                for section in ("required", "optional"):
                    sec_dict = node_info.get(section, {})
                    if not isinstance(sec_dict, dict):
                        continue
                    for fk in file_keys:
                        spec = sec_dict.get(fk)
                        if isinstance(spec, list) and spec and isinstance(spec[0], list):
                            for entry in spec[0]:
                                _add_entry(entry)
            except Exception:
                continue
        return installed_paths, installed_basenames

    @staticmethod
    def _extract_model_refs(preset: dict) -> list[str]:
        """Extract candidate model filenames referenced by a TAModelPreset entry."""
        if not isinstance(preset, dict):
            return []
        preset_name = str(preset.get("name", "")).strip()
        model_keys = (
            "unet_name", "ckpt_name", "model_name", "diffusion_model",
            "model_file", "model_path", "unet_path", "ckpt_path", "filename",
            "unet", "checkpoint", "gguf_name", "file", "model",
        )
        containers = [preset]
        for sub in ("inputs", "config", "params", "settings"):
            if isinstance(preset.get(sub), dict):
                containers.append(preset[sub])
        refs = []
        for c in containers:
            for k in model_keys:
                val = c.get(k)
                if isinstance(val, str):
                    v = re.sub(r"^\[[A-Za-z0-9_]+\]\s*", "", val.strip())
                    if not v or v.lower() in ("none", "null"):
                        continue
                    # Ignore if `model` just repeats the preset display name without a file extension/path
                    if k in ("model", "model_name") and v == preset_name and "." not in v and "/" not in v and "\\" not in v:
                        continue
                    refs.append(v)

        # Fallback: scan string values for model file extensions if no known key matched
        if not refs:
            model_exts = (".safetensors", ".gguf", ".ckpt", ".pt", ".bin", ".sft")
            ignore_key_parts = ("clip", "vae", "lora", "text_encoder", "t5")
            for c in containers:
                for k, val in c.items():
                    if not isinstance(val, str):
                        continue
                    kl = str(k).lower()
                    if any(p in kl for p in ignore_key_parts):
                        continue
                    v = re.sub(r"^\[[A-Za-z0-9_]+\]\s*", "", val.strip())
                    if v.lower().endswith(model_exts):
                        refs.append(v)
        return refs

    def _post_comfy_json(self, url: str, payload: dict, timeout: float = 3.0):
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", "User-Agent": "tA-StudioCockpit"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
        return None

    def _check_krea2_support(self, comfy_url: str) -> tuple[bool | None, bool | None, list[str]]:
        """Verify whether ComfyUI CLIPLoader and TA-ComfyUI-Nodes-Pack support clip_type 'krea2'."""
        comfy_ok: bool | None = None
        nodes_ok: bool | None = None
        warnings: list[str] = []
        try:
            cl = self._fetch_comfy_json(f"{comfy_url}/object_info/CLIPLoader", timeout=2.5)
            types = cl.get("CLIPLoader", {}).get("input", {}).get("required", {}).get("type", [[]])[0] if isinstance(cl, dict) else None
            if isinstance(types, list) and types:
                comfy_ok = "krea2" in types
                if not comfy_ok:
                    warnings.append("ComfyUI ist für Krea2 zu alt (CLIPLoader-Typ 'krea2' fehlt). Bitte ComfyUI aktualisieren.")
        except Exception:
            pass
        try:
            opts = self._fetch_comfy_json(f"{comfy_url}/ta_model_presets/options", timeout=2.5)
            ct = opts.get("clip_types") if isinstance(opts, dict) else None
            if isinstance(ct, list) and ct:
                nodes_ok = "krea2" in ct
                if not nodes_ok:
                    warnings.append("TA-ComfyUI-Nodes-Pack ist für Krea2 zu alt (clip_type 'krea2' fehlt). Bitte in den Settings aktualisieren.")
        except Exception:
            pass
        return comfy_ok, nodes_ok, warnings

    def _is_preset_installed(self, preset: dict, installed_paths: set, installed_basenames: set) -> bool:
        """Return True if any model file referenced by preset exists in ComfyUI's installed models."""
        if not installed_paths and not installed_basenames:
            return False
        refs = self._extract_model_refs(preset)
        if not refs:
            return False
        return any(
            ((norm := r.lower().replace("\\", "/")) in installed_paths)
            or (norm.split("/")[-1] in installed_basenames)
            for r in refs
        )

    def _seed_or_repair_presets(
        self,
        comfy_url: str,
        raw_models: list,
        raw_samplers: dict,
        installed_paths: set,
        installed_basenames: set,
    ):
        """Adopt missing default presets when their models exist locally, without overwriting user presets."""
        models_list = list(raw_models) if isinstance(raw_models, list) else []
        samplers_dict = dict(raw_samplers) if isinstance(raw_samplers, dict) else {}
        models_dirty = False
        warnings: list[str] = []

        existing_model_names = {
            str(m.get("name", "")).strip().lower()
            for m in models_list if isinstance(m, dict)
        }
        for dm in DEFAULT_MODEL_PRESETS:
            if dm["name"].strip().lower() in existing_model_names:
                continue
            if self._is_preset_installed(dm, installed_paths, installed_basenames):
                models_list.append(dict(dm))
                models_dirty = True

        existing_sampler_names = {k.strip().lower() for k in samplers_dict}
        for s_name, s_data in DEFAULT_SAMPLER_PRESETS.items():
            if s_name.strip().lower() in existing_sampler_names:
                continue
            try:
                self._post_comfy_json(
                    f"{comfy_url}/ta_sampler_presets/save",
                    {"name": s_name, "data": dict(s_data)},
                )
                samplers_dict[s_name] = dict(s_data)
            except Exception as exc:
                warnings.append(f"Sampler-Preset '{s_name}' konnte nicht gespeichert werden: {exc}")

        # Always ensure Krea2 presets use clip_type 'krea2' (required for 12-layer Qwen3-VL conditioning)
        for m in models_list:
            if isinstance(m, dict) and "krea2" in str(m.get("name", "")).strip().lower():
                if m.get("clip_type") != "krea2":
                    m["clip_type"] = "krea2"
                    models_dirty = True

        if models_dirty:
            try:
                res = self._post_comfy_json(
                    f"{comfy_url}/ta_model_presets/save",
                    {"presets": models_list},
                )
                if isinstance(res, dict) and res.get("ok") is False:
                    warnings.append(f"Model-Presets konnten nicht gespeichert werden: {res.get('error', 'Unbekannter Fehler')}")
            except Exception as exc:
                warnings.append(f"Model-Presets konnten nicht gespeichert werden: {exc}")

        return models_list, samplers_dict, warnings

    def handle_presets(self):
        cfg = load_config()
        comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
        comfy_online = False
        raw_models = []
        raw_samplers = {}

        try:
            m_data = self._fetch_comfy_json(f"{comfy_url}/ta_model_presets/list", timeout=3.0)
            if m_data is not None:
                comfy_online = True
                raw_models = m_data if isinstance(m_data, list) else m_data.get("presets", [])
        except Exception:
            pass

        try:
            s_data = self._fetch_comfy_json(f"{comfy_url}/ta_sampler_presets/list", timeout=3.0)
            if isinstance(s_data, dict):
                comfy_online = True
                raw_samplers = s_data
        except Exception:
            pass

        installed_paths, installed_basenames = (set(), set())
        warnings: list[str] = []
        if comfy_online:
            installed_paths, installed_basenames = self._collect_installed_comfy_models(comfy_url)
            raw_models, raw_samplers, seed_warnings = self._seed_or_repair_presets(
                comfy_url, raw_models, raw_samplers, installed_paths, installed_basenames
            )
            warnings.extend(seed_warnings)
            _, _, krea2_warnings = self._check_krea2_support(comfy_url)
            warnings.extend(krea2_warnings)

        models_out = []
        available_families = set()
        for m in (raw_models or []):
            if not isinstance(m, dict) or not m.get("name"):
                continue
            m_copy = dict(m)
            is_installed = True
            if m.get("available") is False or m.get("installed") is False:
                is_installed = False
            elif installed_paths:
                refs = self._extract_model_refs(m)
                if refs:
                    is_installed = any(
                        ((norm := r.lower().replace("\\", "/")) in installed_paths)
                        or ("/" not in norm and norm in installed_basenames)
                        for r in refs
                    )
            m_copy["installed"] = is_installed
            models_out.append(m_copy)
            if is_installed:
                fam = self._detect_model_family(str(m_copy.get("name", "")))
                if fam:
                    available_families.add(fam)

        filtered_samplers = {}
        for s_name, s_val in (raw_samplers or {}).items():
            if not isinstance(s_val, dict):
                continue
            # Only filter samplers if we actually have an installed model preset list to filter against
            if comfy_online and available_families:
                s_fam = self._detect_model_family(
                    str(s_val.get("model_preset") or s_val.get("model") or s_val.get("category") or s_name)
                )
                if s_fam and s_fam not in available_families:
                    continue
            filtered_samplers[s_name] = s_val

        self.send_json({
            "comfy_online": comfy_online,
            "models": models_out,
            "samplers": filtered_samplers,
            "total_models": len(raw_models or []),
            "total_samplers": len(raw_samplers or {}),
            "warnings": warnings,
        })

    GEMINI_SKIP_SUBSTRINGS = (
        "gemini-1.",
        "gemini-2.0",
        "gemini-2.5",
        "-image",
        "native-audio",
        "computer-use",
        "deep-research",
        "antigravity",
        "lyria",
        "nano-banana",
        "robotics",
        "-live",
        "transcribe",
        "translate",
        "customtools",
        "decision-",
    )

    @classmethod
    def _filter_llm_models(cls, models: list[str]) -> list[str]:
        filtered = []
        for m in models:
            if not isinstance(m, str):
                continue
            low = m.lower()
            if "text-embedding" in low or "nomic-embed" in low:
                continue
            if m.startswith("Gemini/"):
                if any(skip in low for skip in cls.GEMINI_SKIP_SUBSTRINGS):
                    continue
            filtered.append(m)
        return filtered if filtered else models

    def handle_llm_models(self):
        models = [
            "LMStudio/cognitivecomputations_dolphin-mistral-24b-venice-edition",
            "LMStudio/huihui-qwen3-vl-8b-instruct-abliterated [Vision]",
            "LMStudio/llama-3.1-unhinged-vision-8b [Vision]",
            "LMStudio/qwen3-vl-8b-instruct [Vision]",
            "LMStudio/ministral-3-14b-reasoning-2512",
            "LMStudio/qwen3-coder-30b-a3b-instruct",
            "LMStudio/qwen3.8-27b",
        ]
        try:
            req = urllib.request.Request(f"{COMFY_URL}/object_info/TASmartLLM", headers={"User-Agent": "tA-StudioCockpit"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    fetched = data.get("TASmartLLM", {}).get("input", {}).get("required", {}).get("model", [[]])[0]
                    if fetched and isinstance(fetched, list):
                        models = self._filter_llm_models(fetched)
        except Exception:
            pass
        self.send_json({"models": models})

    CLOUD_LLM_PROVIDERS = {
        "Gemini": "GEMINI_API_KEY",
        "OpenAI": "OPENAI_API_KEY",
        "OpenRouter": "OPENROUTER_API_KEY",
        "Groq": "GROQ_API_KEY",
    }

    def handle_check_llm(self):
        cfg = load_config()
        lms_url = cfg.get("lms_url", LMS_URL)
        ollama_url = cfg.get("ollama_url", OLLAMA_URL)
        comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
        lms_ok = False
        ollama_ok = False
        studio_keys = get_cloud_api_keys(cfg)
        cloud_providers = {
            name for name, env_var in self.CLOUD_LLM_PROVIDERS.items()
            if os.environ.get(env_var, "").strip() or studio_keys.get(env_var, "").strip()
        }

        try:
            req = urllib.request.Request(f"{lms_url}/v1/models", headers={"User-Agent": "tA-StudioCockpit"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    lms_ok = True
        except Exception:
            pass

        try:
            req = urllib.request.Request(f"{ollama_url}/api/tags", headers={"User-Agent": "tA-StudioCockpit"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    ollama_ok = True
        except Exception:
            pass

        try:
            data = self._fetch_comfy_json(f"{comfy_url}/object_info/TASmartLLM", timeout=1.5)
            if isinstance(data, dict):
                fetched = data.get("TASmartLLM", {}).get("input", {}).get("required", {}).get("model", [[]])[0]
                if isinstance(fetched, list):
                    for model_name in fetched:
                        if not isinstance(model_name, str):
                            continue
                        for provider in self.CLOUD_LLM_PROVIDERS:
                            if model_name.startswith(f"{provider}/"):
                                cloud_providers.add(provider)
        except Exception:
            pass

        cloud_ok = bool(cloud_providers)
        self.send_json({
            "lm_studio": lms_ok,
            "ollama": ollama_ok,
            "cloud": cloud_ok,
            "cloud_providers": sorted(cloud_providers),
            "reachable": bool(lms_ok or ollama_ok or cloud_ok),
        })

    def handle_workflow_loras(self):
        try:
            cfg = load_config()
            comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
            loras = []
            trigger_map = dict(getattr(comfy_client, "KNOWN_LORA_TRIGGERS", {}))

            KNOWN_LORA_CATEGORIES = {
                "cm_scandes": "krea2",
                "duffyart_v1": "moss",
                "blurred_moss_v1_moss": "moss",
                "mtg_style_moss_v1_moss_copy": "moss",
            }

            def detect_lora_category(name: str) -> str:
                n = name.lower().replace("\\", "/").replace(".safetensors", "")
                for k, v in KNOWN_LORA_CATEGORIES.items():
                    if k in n or n in k:
                        return v
                if n.startswith("zimage/") or "zimage" in n or "zit" in n:
                    return "zimage"
                if n.startswith("krea2/") or "krea2" in n or "krea" in n:
                    return "krea2"
                if n.startswith("moss/") or "moss" in n:
                    return "moss"
                if n.startswith("minimax") or "minimax" in n:
                    return "minimax"
                if n.startswith("qwen/") or "qwen" in n:
                    return "qwen"
                if n.startswith("flux/") or "flux" in n:
                    return "flux"
                return "other"

            if os.path.isfile(WORKFLOW_PATH):
                with open(WORKFLOW_PATH, "r", encoding="utf-8") as fh:
                    wf = json.load(fh)

                # 1. Check Node 1517 for trigger words
                for n in wf.get("nodes", []):
                    if n.get("id") == 1517:
                        tw = n.get("widgets_values_named", {}).get("toggle_trigger_words", [])
                        if not tw and len(n.get("widgets_values", [])) > 3:
                            tw = n.get("widgets_values", [])[3]
                        if isinstance(tw, list):
                            for item in tw:
                                if isinstance(item, dict) and item.get("text"):
                                    t_text = item["text"].strip()
                                    trigger_map[t_text.lower()] = t_text

                # 2. Extract base configured LoRAs from Node 1518
                for n in wf.get("nodes", []):
                    if n.get("id") == 1518:
                        raw = n.get("widgets_values_named", {}).get("loras", [])
                        if not raw and len(n.get("widgets_values", [])) > 2:
                            raw = n.get("widgets_values", [])[2]
                        if isinstance(raw, list):
                            for l in raw:
                                if isinstance(l, dict) and l.get("name"):
                                    name = l["name"]
                                    norm = name.lower().replace("\\", "/").replace(".safetensors", "")
                                    bare_norm = norm.split("/")[-1]
                                    trig = ""
                                    for k, v in trigger_map.items():
                                        if k in norm or norm in k or k in bare_norm or bare_norm in k:
                                            trig = v
                                            break
                                    loras.append({
                                        "name": name,
                                        "strength": float(l.get("strength", 1.0)),
                                        "clipStrength": float(l.get("clipStrength", l.get("strength", 1.0))),
                                        "active": bool(l.get("active", False)),
                                        "trigger": trig,
                                        "category": detect_lora_category(name),
                                    })
                        break

            # 3. Query live ComfyUI instance for all installed LoRAs on disk
            existing_map = {}
            for item in loras:
                norm = item["name"].lower().replace("\\", "/").replace(".safetensors", "")
                existing_map[norm] = item
                existing_map[norm.split("/")[-1]] = item

            comfy_loras = []
            node_candidates = ("LoraLoader", "LoraLoaderModelOnly", "CR Load LoRA", "Lora Loader (LoraManager)")
            for nc in node_candidates:
                try:
                    req = urllib.request.Request(
                        f"{comfy_url}/object_info/{nc}",
                        headers={"User-Agent": "tA-StudioCockpit"}
                    )
                    with urllib.request.urlopen(req, timeout=2.5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode("utf-8"))
                            raw_names = data.get(nc, {}).get("input", {}).get("required", {}).get("lora_name", [[]])[0]
                            if raw_names and isinstance(raw_names, list) and len(raw_names) > 0:
                                comfy_loras = raw_names
                                break
                except Exception:
                    pass

            for cl in comfy_loras:
                if not isinstance(cl, str):
                    continue
                cl_clean = cl.strip()
                if not cl_clean:
                    continue
                norm = cl_clean.lower().replace("\\", "/").replace(".safetensors", "")
                bare_norm = norm.split("/")[-1]
                if norm not in existing_map and bare_norm not in existing_map:
                    trig = ""
                    for k, v in trigger_map.items():
                        if k in norm or norm in k or k in bare_norm or bare_norm in k:
                            trig = v
                            break
                    new_item = {
                        "name": cl_clean,
                        "strength": 1.0,
                        "clipStrength": 1.0,
                        "active": False,
                        "trigger": trig,
                        "category": detect_lora_category(cl_clean),
                    }
                    loras.append(new_item)
                    existing_map[norm] = new_item
                    existing_map[bare_norm] = new_item

            # Fallback to loras_cache.json if ComfyUI returned nothing
            cache_file = os.path.join(BASE_DIR, "data", "loras_cache.json")
            if not comfy_loras and os.path.isfile(cache_file):
                try:
                    with open(cache_file, "r", encoding="utf-8") as cf:
                        cached = json.load(cf)
                        cached_list = cached.get("loras", [])
                        for cl in cached_list:
                            if isinstance(cl, dict) and cl.get("name"):
                                norm = cl["name"].lower().replace("\\", "/").replace(".safetensors", "")
                                bare_norm = norm.split("/")[-1]
                                if norm not in existing_map and bare_norm not in existing_map:
                                    loras.append(cl)
                                    existing_map[norm] = cl
                                    existing_map[bare_norm] = cl
                except Exception:
                    pass
            elif comfy_loras and len(loras) > 0:
                try:
                    with open(cache_file, "w", encoding="utf-8") as cf:
                        json.dump({"loras": loras}, cf, indent=2)
                except Exception:
                    pass

            # 4. Merge previously saved user state from data/config.json
            saved_loras = cfg.get("ui_state", {}).get("loras", [])
            if isinstance(saved_loras, list):
                saved_map = {}
                for sl in saved_loras:
                    if isinstance(sl, dict) and sl.get("name"):
                        s_norm = sl["name"].lower().replace("\\", "/").replace(".safetensors", "")
                        saved_map[s_norm] = sl
                        saved_map[s_norm.split("/")[-1]] = sl
                for l in loras:
                    l_norm = l["name"].lower().replace("\\", "/").replace(".safetensors", "")
                    l_bare = l_norm.split("/")[-1]
                    s_item = saved_map.get(l_norm) or saved_map.get(l_bare)
                    if s_item:
                        l["active"] = bool(s_item.get("active", False))
                        if s_item.get("strength") is not None:
                            l["strength"] = float(s_item["strength"])
                        if s_item.get("clipStrength") is not None:
                            l["clipStrength"] = float(s_item["clipStrength"])
                        if s_item.get("trigger"):
                            l["trigger"] = s_item["trigger"]

            self.send_json({
                "success": True,
                "loras": loras,
                "count": len(loras),
                "comfy_url": comfy_url,
                "lora_manager_url": f"{comfy_url}/loras",
            })
        except Exception as e:
            self.send_json({"success": False, "error": str(e), "loras": []}, status=500)

    def handle_generate(self, post_body: bytes | None):
        if not post_body:
            self.send_json({"error": "No body provided"}, status=400)
            return

        try:
            params = json.loads(post_body.decode("utf-8"))
        except Exception as e:
            self.send_json({"error": f"Invalid JSON: {e}"}, status=400)
            return

        # 1. Persist the UI state in config.json
        cfg = load_config()
        cfg["ui_state"] = params
        save_config(cfg)

        # 2. Build the ComfyUI API prompt
        try:
            job_client_id = str(uuid.uuid4())
            client = ComfyClient(COMFY_URL, client_id=job_client_id)
            if not client.check_online():
                self.send_json({"error": f"ComfyUI ist nicht erreichbar unter {COMFY_URL}!"}, status=503)
                return

            # Snapshot existing output files
            out_dir = get_output_dir()
            existing_files = {rel for _, rel, _ in scan_output_images(out_dir)}

            seed_val = int(params.get("seed", 0))
            if params.get("seedMode") == "randomize" or seed_val == 0:
                seed_val = random.randint(100000000000, 999999999999999)

            sampler_preset_name = params.get("sampler_preset", "Minimax H3 Image")
            resolved_sampler_cfg = None
            if params.get("sampler_cfg") is not None:
                try:
                    resolved_sampler_cfg = float(params["sampler_cfg"])
                except (TypeError, ValueError):
                    resolved_sampler_cfg = None
            if resolved_sampler_cfg is None:
                sampler_map = dict(DEFAULT_SAMPLER_PRESETS)
                try:
                    live_samplers = self._fetch_comfy_json(f"{COMFY_URL}/ta_sampler_presets/list", timeout=1.5)
                    if isinstance(live_samplers, dict):
                        sampler_map.update(live_samplers)
                except Exception:
                    pass
                norm_target = re.sub(r"[^a-z0-9]", "", str(sampler_preset_name).lower())
                for s_key, s_val in sampler_map.items():
                    if isinstance(s_val, dict) and (
                        s_key == sampler_preset_name
                        or re.sub(r"[^a-z0-9]", "", s_key.lower()) == norm_target
                    ):
                        if s_val.get("cfg") is not None:
                            try:
                                resolved_sampler_cfg = float(s_val["cfg"])
                            except (TypeError, ValueError):
                                pass
                        break

            prompt_dict = build_flexmod_api_prompt(
                wf_path=WORKFLOW_PATH,
                model_preset=params.get("model_preset", "Minimax H3 Image"),
                sampler_preset=sampler_preset_name,
                prompt=params.get("prompt", ""),
                additional_prompt=params.get("additional_prompt", ""),
                neg_prompt=params.get("neg_prompt", ""),
                width=int(params.get("width", 1920)),
                height=int(params.get("height", 1088)),
                aspect_ratio=params.get("aspect_ratio", "16:9"),
                snap=int(params.get("snap", 16)),
                batch_size=int(params.get("batch_size", 1)),
                smart_llm=bool(params.get("smart_llm", False)),
                llm_mode=params.get("llm_mode", "t2i" if params.get("smart_llm") else "off"),
                llm_model=params.get("llm_model", ""),
                llm_system_prompt=str(params.get("llm_system_prompt", "")),
                llm_user_prompt=str(params.get("llm_user_prompt", "")),
                llm_temperature=float(params["llm_temperature"]) if params.get("llm_temperature") is not None else None,
                llm_max_tokens=int(params["llm_max_tokens"]) if params.get("llm_max_tokens") is not None else None,
                llm_request_timeout=int(params["llm_request_timeout"]) if params.get("llm_request_timeout") is not None else None,
                llm_thinking_mode=bool(params.get("llm_thinking_mode", False)),
                llm_unload_image_models_first=bool(params.get("llm_unload_image_models_first", True)),
                llm_unload_llm_after=bool(params.get("llm_unload_llm_after", True)),
                llm_controller_mode=params.get("llm_controller_mode", "Generated Only"),
                prompt_controller_mode=params.get("prompt_controller_mode", params.get("llm_controller_mode", "Manual Only")),
                delimiter=params.get("delimiter", ", "),
                i2i_image=params.get("i2i_image", ""),
                seed=seed_val,
                flux_guidance=float(params.get("flux_guidance", 3.5)),
                sharpen_enabled=bool(params.get("sharpen_enabled", True)),
                sharpen=float(params.get("sharpen", 0.26)),
                sve_enabled=bool(params.get("sve_enabled", False)),
                sve_auto=bool(params.get("sve_auto", True)),
                sve_strength=float(params.get("sve_strength", 25.0)),
                sve_randomize_percent=float(params.get("sve_randomize_percent", 60.0)),
                sve_noise_insert=str(params.get("sve_noise_insert", "noise on beginning steps")),
                sve_steps_switchover_percent=float(params.get("sve_steps_switchover_percent", 20.0)),
                sve_mask_starts_at=str(params.get("sve_mask_starts_at", "beginning")),
                sve_mask_percent=float(params.get("sve_mask_percent", 0.0)),
                film_grain_enabled=bool(params.get("film_grain_enabled", False)),
                film_grain_gray_scale=bool(params.get("film_grain_gray_scale", False)),
                film_grain_type=str(params.get("film_grain_type", "Fine")),
                film_grain_sat=float(params.get("film_grain_sat", 0.15)),
                film_grain_power=float(params.get("film_grain_power", 0.40)),
                film_grain_shadows=float(params.get("film_grain_shadows", 0.20)),
                film_grain_highs=float(params.get("film_grain_highs", 0.20)),
                film_grain_scale=float(params.get("film_grain_scale", 0.65)),
                film_grain_sharpen=int(params.get("film_grain_sharpen", 0)),
                film_grain_src_gamma=float(params.get("film_grain_src_gamma", 1.0)),
                use_seed_vr2=bool(params.get("use_seed_vr2", False)),
                seedvr2_model=str(params.get("seedvr2_model", "seedvr2_ema_7b_fp16.safetensors")),
                seedvr2_resolution=int(params.get("seedvr2_resolution", 3840)),
                seedvr2_max_resolution=int(params.get("seedvr2_max_resolution", 3840)),
                seedvr2_color_correction=str(params.get("seedvr2_color_correction", "lab")),
                seedvr2_blocks_to_swap=int(params.get("seedvr2_blocks_to_swap", 15)),
                seedvr2_attention_mode=str(params.get("seedvr2_attention_mode", "sageattn_2")),
                seedvr2_input_noise_scale=float(params.get("seedvr2_input_noise_scale", 0.0)),
                seedvr2_latent_noise_scale=float(params.get("seedvr2_latent_noise_scale", 0.0)),
                seedvr2_tiled=bool(params.get("seedvr2_tiled", True)),
                seedvr2_cache_model=bool(params.get("seedvr2_cache_model", False)),
                save_format=params.get("save_format", "webp"),
                save_txt_main=bool(params.get("save_txt_main", True)),
                extra_save_enabled=bool(params.get("extra_save_enabled", False)),
                extra_save_format=str(params.get("extra_save_format", "webp")),
                extra_save_quality=str(params.get("extra_save_quality", "95")),
                extra_save_txt=bool(params.get("extra_save_txt", False)),
                fn_output_folder=str(params.get("fn_output_folder", "")),
                fn_subfolder=str(params.get("fn_subfolder", "")),
                fn_extra_subfolder=str(params.get("fn_extra_subfolder", "JPEG")),
                fn_name_prefix=str(params.get("fn_name_prefix", "")),
                fn_wf_version=str(params.get("fn_wf_version", "TA-FLEXMOD")),
                fn_upscaled_suffix=str(params.get("fn_upscaled_suffix", "UPSCALED")),
                fn_delimiter=str(params.get("fn_delimiter", "-")),
                fn_date_format=str(params.get("fn_date_format", "%Y%m%d%H%M")),
                overlay_ai_enabled=bool(params.get("overlay_ai_enabled", False)),
                overlay_ai_text=str(params.get("overlay_ai_text", "Created with AI '26")),
                overlay_ai_font=str(params.get("overlay_ai_font", "Caveat-VariableFont_wght.ttf")),
                overlay_ai_size=int(params.get("overlay_ai_size", 14)),
                overlay_ai_color=str(params.get("overlay_ai_color", "white")),
                overlay_ai_align=str(params.get("overlay_ai_align", "bottom")),
                overlay_ai_justify=str(params.get("overlay_ai_justify", "left")),
                overlay_ai_pos_x=int(params.get("overlay_ai_pos_x", 10)),
                overlay_ai_pos_y=int(params.get("overlay_ai_pos_y", -15)),
                overlay_ai_rotation=float(params.get("overlay_ai_rotation", 0)),
                overlay_ai_margins=int(params.get("overlay_ai_margins", 0)),
                overlay_sig_enabled=bool(params.get("overlay_sig_enabled", True)),
                overlay_sig_text=str(params.get("overlay_sig_text", "thomo.ART")),
                overlay_sig_font=str(params.get("overlay_sig_font", "Caveat-VariableFont_wght.ttf")),
                overlay_sig_size=int(params.get("overlay_sig_size", 14)),
                overlay_sig_color=str(params.get("overlay_sig_color", "white")),
                overlay_sig_align=str(params.get("overlay_sig_align", "bottom")),
                overlay_sig_justify=str(params.get("overlay_sig_justify", "right")),
                overlay_sig_pos_x=int(params.get("overlay_sig_pos_x", -15)),
                overlay_sig_pos_y=int(params.get("overlay_sig_pos_y", -15)),
                overlay_sig_rotation=float(params.get("overlay_sig_rotation", 0)),
                overlay_sig_margins=int(params.get("overlay_sig_margins", 0)),
                overlay_img_enabled=bool(params.get("overlay_img_enabled", False)),
                overlay_img_file=str(params.get("overlay_img_file", "")),
                overlay_img_pos_x=int(params.get("overlay_img_pos_x", 0)),
                overlay_img_pos_y=int(params.get("overlay_img_pos_y", 0)),
                overlay_img_scale=float(params.get("overlay_img_scale", 1.0)),
                overlay_img_opacity=float(params.get("overlay_img_opacity", 100.0)),
                overlay_img_rotation=float(params.get("overlay_img_rotation", 0)),
                sage_enable=bool(params.get("sage_enable", False)),
                torch_enable=bool(params.get("torch_enable", False)),
                sage_mode=str(params.get("sage_mode", "sageattn_qk_int8_pv_fp16_cuda")),
                kitchen_enable=bool(params.get("kitchen_enable", True)),
                loras=params.get("loras", []),
                sampler_cfg=resolved_sampler_cfg,
            )

            with open(WORKFLOW_PATH, "r", encoding="utf-8") as wf_f:
                wf_data = json.load(wf_f)

            # Sync Pixaroma Node 2120 and EmptyLatentImage Node 2121 into workflow metadata
            res_obj = {
                "mode": params.get("pix_mode", "preset"),
                "ratio": params.get("aspect_ratio", "16:9"),
                "w": int(params.get("width", 1920)),
                "h": int(params.get("height", 1088)),
                "custom_w": int(params.get("width", 1920)),
                "custom_h": int(params.get("height", 1088)),
                "custom_ratio_w": int(params.get("custom_ratio_w", 16)),
                "custom_ratio_h": int(params.get("custom_ratio_h", 9)),
                "snap": int(params.get("snap", 16)),
                "batch": int(params.get("batch_size", 1)),
            }
            for n in wf_data.get("nodes", []):
                if n.get("id") == 2120:
                    if "properties" in n:
                        n["properties"]["resolutionState"] = json.dumps(res_obj)
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = res_obj
                    if "widgets_values_named" in n and "resolution_ui" in n["widgets_values_named"]:
                        n["widgets_values_named"]["resolution_ui"] = res_obj
                elif n.get("id") == 2121:
                    if "widgets_values" in n and len(n["widgets_values"]) >= 3:
                        n["widgets_values"][0] = int(params.get("width", 1920))
                        n["widgets_values"][1] = int(params.get("height", 1088))
                        n["widgets_values"][2] = int(params.get("batch_size", 1))
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["width"] = int(params.get("width", 1920))
                        n["widgets_values_named"]["height"] = int(params.get("height", 1088))
                        n["widgets_values_named"]["batch_size"] = int(params.get("batch_size", 1))
                elif n.get("id") == 1981:
                    sw_ai = bool(params.get("overlay_ai_enabled", False))
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = sw_ai
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["switch"] = sw_ai
                elif n.get("id") == 1978:
                    txt_ai = str(params.get("overlay_ai_text", "Created with AI '26"))
                    font_ai = str(params.get("overlay_ai_font", "Caveat-VariableFont_wght.ttf"))
                    sz_ai = int(params.get("overlay_ai_size", 14))
                    col_ai = str(params.get("overlay_ai_color", "white"))
                    align_ai = str(params.get("overlay_ai_align", "bottom"))
                    justify_ai = str(params.get("overlay_ai_justify", "left"))
                    pos_x_ai = int(params.get("overlay_ai_pos_x", 10))
                    pos_y_ai = int(params.get("overlay_ai_pos_y", -15))
                    rot_ai = float(params.get("overlay_ai_rotation", 0))
                    margins_ai = int(params.get("overlay_ai_margins", 0))
                    if "widgets_values" in n and len(n["widgets_values"]) >= 4:
                        n["widgets_values"][0] = txt_ai
                        n["widgets_values"][1] = font_ai
                        n["widgets_values"][2] = sz_ai
                        n["widgets_values"][3] = col_ai
                        if len(n["widgets_values"]) > 4:
                            n["widgets_values"][4] = align_ai
                        if len(n["widgets_values"]) > 5:
                            n["widgets_values"][5] = justify_ai
                        if len(n["widgets_values"]) > 6:
                            n["widgets_values"][6] = margins_ai
                        if len(n["widgets_values"]) > 8:
                            n["widgets_values"][8] = pos_x_ai
                        if len(n["widgets_values"]) > 9:
                            n["widgets_values"][9] = pos_y_ai
                        if len(n["widgets_values"]) > 10:
                            n["widgets_values"][10] = rot_ai
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["text"] = txt_ai
                        n["widgets_values_named"]["font_name"] = font_ai
                        n["widgets_values_named"]["font_size"] = sz_ai
                        n["widgets_values_named"]["font_color"] = col_ai
                        n["widgets_values_named"]["align"] = align_ai
                        n["widgets_values_named"]["justify"] = justify_ai
                        n["widgets_values_named"]["margins"] = margins_ai
                        n["widgets_values_named"]["position_x"] = pos_x_ai
                        n["widgets_values_named"]["position_y"] = pos_y_ai
                        n["widgets_values_named"]["rotation_angle"] = rot_ai
                elif n.get("id") == 1982:
                    sw_sig = bool(params.get("overlay_sig_enabled", True))
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = sw_sig
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["switch"] = sw_sig
                elif n.get("id") == 1979:
                    txt_sig = str(params.get("overlay_sig_text", "thomo.ART"))
                    font_sig = str(params.get("overlay_sig_font", "Caveat-VariableFont_wght.ttf"))
                    sz_sig = int(params.get("overlay_sig_size", 14))
                    col_sig = str(params.get("overlay_sig_color", "white"))
                    align_sig = str(params.get("overlay_sig_align", "bottom"))
                    justify_sig = str(params.get("overlay_sig_justify", "right"))
                    pos_x_sig = int(params.get("overlay_sig_pos_x", -15))
                    pos_y_sig = int(params.get("overlay_sig_pos_y", -15))
                    rot_sig = float(params.get("overlay_sig_rotation", 0))
                    margins_sig = int(params.get("overlay_sig_margins", 0))
                    if "widgets_values" in n and len(n["widgets_values"]) >= 4:
                        n["widgets_values"][0] = txt_sig
                        n["widgets_values"][1] = font_sig
                        n["widgets_values"][2] = sz_sig
                        n["widgets_values"][3] = col_sig
                        if len(n["widgets_values"]) > 4:
                            n["widgets_values"][4] = align_sig
                        if len(n["widgets_values"]) > 5:
                            n["widgets_values"][5] = justify_sig
                        if len(n["widgets_values"]) > 6:
                            n["widgets_values"][6] = margins_sig
                        if len(n["widgets_values"]) > 8:
                            n["widgets_values"][8] = pos_x_sig
                        if len(n["widgets_values"]) > 9:
                            n["widgets_values"][9] = pos_y_sig
                        if len(n["widgets_values"]) > 10:
                            n["widgets_values"][10] = rot_sig
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["text"] = txt_sig
                        n["widgets_values_named"]["font_name"] = font_sig
                        n["widgets_values_named"]["font_size"] = sz_sig
                        n["widgets_values_named"]["font_color"] = col_sig
                        n["widgets_values_named"]["align"] = align_sig
                        n["widgets_values_named"]["justify"] = justify_sig
                        n["widgets_values_named"]["margins"] = margins_sig
                        n["widgets_values_named"]["position_x"] = pos_x_sig
                        n["widgets_values_named"]["position_y"] = pos_y_sig
                        n["widgets_values_named"]["rotation_angle"] = rot_sig
                elif n.get("id") == 2134:
                    sw_img = bool(params.get("overlay_img_enabled", False))
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = sw_img
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["switch"] = sw_img
                elif n.get("id") == 2131:
                    img_file = str(params.get("overlay_img_file", ""))
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = img_file
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["image"] = img_file
                elif n.get("id") in (2135, 2137):
                    scale_img = round(max(0.05, min(0.50, float(params.get("overlay_img_scale", 0.25)))), 3)
                    if "widgets_values" in n and len(n["widgets_values"]) >= 2:
                        n["widgets_values"][1] = scale_img
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["scale_by"] = scale_img
                elif n.get("id") == 2133:
                    pos_x_img = max(0, int(params.get("overlay_img_pos_x", 0)))
                    pos_y_img = max(0, int(params.get("overlay_img_pos_y", 0)))
                    if "widgets_values" in n and len(n["widgets_values"]) >= 3:
                        n["widgets_values"][0] = pos_x_img
                        n["widgets_values"][1] = pos_y_img
                        n["widgets_values"][2] = False
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["x"] = pos_x_img
                        n["widgets_values_named"]["y"] = pos_y_img
                        n["widgets_values_named"]["resize_source"] = False
                elif n.get("id") == 1229:
                    txt_mode = "enabled" if bool(params.get("save_txt_main", True)) else "disabled"
                    if "widgets_values" in n and len(n["widgets_values"]) >= 2:
                        n["widgets_values"][1] = txt_mode
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["save_txt"] = txt_mode
                elif n.get("id") in (1619, 1620):
                    is_extra = bool(params.get("extra_save_enabled", False))
                    if n.get("id") == 1620:
                        is_extra = is_extra and bool(params.get("use_seed_vr2", False))
                    ex_format = str(params.get("extra_save_format", "webp"))
                    ex_qual = str(params.get("extra_save_quality", "95"))
                    ex_txt = "enabled" if bool(params.get("extra_save_txt", False)) else "disabled"
                    if "widgets_values" in n and len(n["widgets_values"]) >= 5:
                        n["widgets_values"][1] = is_extra
                        n["widgets_values"][2] = ex_txt
                        n["widgets_values"][3] = ex_format
                        n["widgets_values"][4] = ex_qual
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["enabled"] = is_extra
                        n["widgets_values_named"]["save_txt"] = ex_txt
                        n["widgets_values_named"]["save_format"] = ex_format
                        n["widgets_values_named"]["jpeg_quality"] = ex_qual
                elif n.get("id") in (1216, 2041, 1583):
                    fn_out = str(params.get("fn_output_folder", ""))
                    fn_sub = str(params.get("fn_subfolder", "")) if n.get("id") == 1216 else str(params.get("fn_extra_subfolder", "JPEG"))
                    fn_pre = str(params.get("fn_name_prefix", ""))
                    fn_ver = str(params.get("fn_wf_version", "TA-FLEXMOD"))
                    fn_ups = str(params.get("fn_upscaled_suffix", "UPSCALED"))
                    fn_del = str(params.get("fn_delimiter", "-"))
                    fn_dat = str(params.get("fn_date_format", "%Y%m%d%H%M"))
                    if "widgets_values" in n and len(n["widgets_values"]) >= 7:
                        n["widgets_values"][0] = fn_out
                        n["widgets_values"][1] = fn_sub
                        n["widgets_values"][2] = fn_pre
                        n["widgets_values"][3] = fn_ver
                        n["widgets_values"][4] = fn_ups
                        n["widgets_values"][5] = fn_del
                        n["widgets_values"][6] = fn_dat
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["output_folder"] = fn_out
                        n["widgets_values_named"]["subfolder"] = fn_sub
                        n["widgets_values_named"]["name_prefix"] = fn_pre
                        n["widgets_values_named"]["wf_version"] = fn_ver
                        n["widgets_values_named"]["upscaled_suffix"] = fn_ups
                        n["widgets_values_named"]["delimiter"] = fn_del
                        n["widgets_values_named"]["date_format"] = fn_dat
                elif n.get("id") == 2122:
                    sh_enabled = bool(params.get("sharpen_enabled", True))
                    n["mode"] = 0 if sh_enabled else 4
                    sh_val = float(params.get("sharpen", 0.26))
                    if "widgets_values" in n and n["widgets_values"]:
                        n["widgets_values"][0] = sh_val
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["strength"] = sh_val
                elif n.get("id") == 1912:
                    s_en = bool(params.get("sage_enable", False))
                    t_en = bool(params.get("torch_enable", False))
                    s_mode = str(params.get("sage_mode", "sageattn_qk_int8_pv_fp16_cuda"))
                    k_en = bool(params.get("kitchen_enable", True))
                    if "widgets_values" in n and len(n["widgets_values"]) >= 4:
                        n["widgets_values"][0] = s_en
                        n["widgets_values"][1] = t_en
                        n["widgets_values"][2] = s_mode
                        n["widgets_values"][3] = k_en
                    if "widgets_values_named" in n:
                        n["widgets_values_named"]["sage_enable"] = s_en
                        n["widgets_values_named"]["torch_enable"] = t_en
                        n["widgets_values_named"]["sage_mode"] = s_mode
                        n["widgets_values_named"]["kitchen_enable"] = k_en

            if "krea" in str(params.get("model_preset", "")).lower():
                comfy_url_base = COMFY_URL.rstrip("/")
                comfy_ok, nodes_ok, _ = self._check_krea2_support(comfy_url_base)
                if comfy_ok is False:
                    self.send_json({
                        "error": "Deine ComfyUI-Version ist für Krea2 zu alt (CLIPLoader-Typ 'krea2' fehlt). Bitte ComfyUI aktualisieren und neu starten."
                    }, status=400)
                    return
                if nodes_ok is False:
                    self.send_json({
                        "error": "Dein TA-ComfyUI-Nodes-Pack ist für Krea2 zu alt (clip_type 'krea2' fehlt). Bitte in den Settings aktualisieren und ComfyUI neu starten."
                    }, status=400)
                    return
                # Verify the active Krea2 preset itself has clip_type == 'krea2' and a valid clip_name_1
                try:
                    m_data = self._fetch_comfy_json(f"{comfy_url_base}/ta_model_presets/list", timeout=2.5)
                    m_list = m_data if isinstance(m_data, list) else (m_data.get("presets", []) if isinstance(m_data, dict) else [])
                    target_name = str(params.get("model_preset", "")).strip().lower()
                    matched_p = next((p for p in m_list if isinstance(p, dict) and str(p.get("name", "")).strip().lower() == target_name), None)
                    if matched_p is None:
                        self.send_json({
                            "error": f"Model-Preset '{params.get('model_preset')}' existiert in ComfyUI nicht. Bitte im Model Preset Editor anlegen."
                        }, status=400)
                        return
                    if matched_p.get("clip_type") != "krea2":
                        matched_p["clip_type"] = "krea2"
                        self._post_comfy_json(f"{comfy_url_base}/ta_model_presets/save", {"presets": m_list})
                    c1 = str(matched_p.get("clip_name_1", "")).lower()
                    if not c1:
                        self.send_json({
                            "error": f"Im Preset '{matched_p.get('name')}' fehlt der Text-Encoder (clip_name_1). Bitte im Model Preset Editor einen Qwen3-VL Text-Encoder wählen."
                        }, status=400)
                        return
                    if "qwen_3_4b" in c1 or "qwen3_4b" in c1:
                        self.send_json({
                            "error": f"Im Preset '{matched_p.get('name')}' ist '{matched_p.get('clip_name_1')}' (Z-Image) gewählt – Krea2 benötigt einen Qwen3-VL Text-Encoder (z. B. qwen3vl_4b)."
                        }, status=400)
                        return
                except Exception:
                    pass

            self._sanitize_smart_llm_nodes(prompt_dict)
            prompt_id = client.queue_prompt(prompt_dict, workflow=wf_data)
            if not prompt_id:
                self.send_json({"error": "ComfyUI konnte den Job nicht in die Queue einreihen."}, status=500)
                return

            with ACTIVE_JOBS_LOCK:
                _prune_active_jobs_locked()
                ACTIVE_JOBS[prompt_id] = {
                    "status": "running",
                    "prompt_id": prompt_id,
                    "seed": seed_val,
                    "start_time": time.time(),
                }

            # Spawn watcher thread with real-time WebSocket streaming
            def watch_job(pid: str, start_files: set, cid: str):
                llm_prompt = ""
                llm_status = ""
                ws_url = COMFY_URL.replace("http://", "ws://").replace("https://", "wss://").rstrip("/") + f"/ws?clientId={cid}"

                # 1. Real-time WebSocket streaming for early LLM prompt and progress
                try:
                    from websockets.sync.client import connect
                    with connect(ws_url, close_timeout=2) as ws:
                        start_time = time.time()
                        while time.time() - start_time < 240.0:
                            with ACTIVE_JOBS_LOCK:
                                if ACTIVE_JOBS.get(pid, {}).get("status") in ("cancelled", "interrupted"):
                                    break
                            try:
                                raw = ws.recv(timeout=0.8)
                            except TimeoutError:
                                continue
                            except Exception:
                                break

                            if not isinstance(raw, str):
                                continue

                            try:
                                msg = json.loads(raw)
                            except Exception:
                                continue

                            m_type = msg.get("type")
                            m_data = msg.get("data", {})
                            m_pid = m_data.get("prompt_id")

                            if m_type == "executed" and (m_pid == pid or not m_pid):
                                m_node = str(m_data.get("node", "") or "")
                                out = m_data.get("output", {})

                                def _first_str(d: dict, keys: tuple[str, ...]) -> str:
                                    for k in keys:
                                        val = d.get(k)
                                        if isinstance(val, list) and val and isinstance(val[0], str) and val[0].strip():
                                            return val[0].strip()
                                        if isinstance(val, str) and val.strip():
                                            return val.strip()
                                    return ""

                                if m_node in ("2115", "2116"):
                                    s_txt = _first_str(out, ("text", "string", "STRING"))
                                    if s_txt and (s_txt.upper() != "DISABLED" or not llm_status):
                                        llm_status = s_txt
                                        with ACTIVE_JOBS_LOCK:
                                            if pid in ACTIVE_JOBS:
                                                ACTIVE_JOBS[pid]["llm_status"] = llm_status
                                else:
                                    p_txt = _first_str(out, ("prompt", "text", "string", "STRING"))
                                    if p_txt:
                                        llm_prompt = p_txt
                                        with ACTIVE_JOBS_LOCK:
                                            if pid in ACTIVE_JOBS:
                                                ACTIVE_JOBS[pid]["llm_prompt"] = llm_prompt

                                    s_txt = _first_str(out, ("status",))
                                    if s_txt and (s_txt.upper() != "DISABLED" or not llm_status):
                                        llm_status = s_txt
                                        with ACTIVE_JOBS_LOCK:
                                            if pid in ACTIVE_JOBS:
                                                ACTIVE_JOBS[pid]["llm_status"] = llm_status

                            elif m_type == "progress" and (m_pid == pid or not m_pid):
                                val = m_data.get("value")
                                max_val = m_data.get("max")
                                if val is not None and max_val is not None:
                                    with ACTIVE_JOBS_LOCK:
                                        if pid in ACTIVE_JOBS:
                                            ACTIVE_JOBS[pid]["progress"] = {"value": val, "max": max_val}

                            elif m_type == "execution_interrupted" and (m_pid == pid or not m_pid):
                                with ACTIVE_JOBS_LOCK:
                                    if pid in ACTIVE_JOBS:
                                        ACTIVE_JOBS[pid]["status"] = "interrupted"
                                        ACTIVE_JOBS[pid]["finished_at"] = time.time()
                                break

                            elif m_type == "execution_error" and (m_pid == pid or not m_pid):
                                err_msg = m_data.get("exception_message") or "Fehler in ComfyUI"
                                if "'nonetype' object has no attribute 'lower'" in err_msg.lower():
                                    sel_model = params.get("model_preset", "FLUX1-DEV-FP8")
                                    err_msg = (
                                        f"Basis-Modell nicht gefunden! Für das Preset '{sel_model}' fehlt die Modelldatei "
                                        f"(z.B. 'flux/flux1-dev-fp8.safetensors') im ComfyUI-Ordner 'models/diffusion_models/' bzw. 'models/unet/'."
                                    )
                                with ACTIVE_JOBS_LOCK:
                                    if pid in ACTIVE_JOBS:
                                        ACTIVE_JOBS[pid]["status"] = "error"
                                        ACTIVE_JOBS[pid]["error"] = err_msg
                                        ACTIVE_JOBS[pid]["finished_at"] = time.time()
                                break

                            elif m_type == "execution_success" and (m_pid == pid or not m_pid):
                                break
                except Exception:
                    pass

                # If job was cancelled or interrupted, return early
                with ACTIVE_JOBS_LOCK:
                    if ACTIVE_JOBS.get(pid, {}).get("status") in ("cancelled", "interrupted"):
                        return

                def _pick_node_image(outputs_dict: dict, node_ids: list[str]):
                    for nid in node_ids:
                        node_out = outputs_dict.get(nid, {})
                        imgs = node_out.get("images")
                        if isinstance(imgs, list):
                            for img_info in imgs:
                                if isinstance(img_info, dict) and img_info.get("type", "output") == "output" and img_info.get("filename"):
                                    fname = img_info["filename"]
                                    sub = img_info.get("subfolder", "") or ""
                                    img_type = img_info.get("type", "output") or "output"
                                    rel_path = f"{sub}/{fname}".lstrip("/") if sub else fname
                                    local_candidate = os.path.join(out_dir, rel_path.replace("/", os.sep)) if out_dir else ""
                                    if local_candidate and os.path.isfile(local_candidate):
                                        # Wait briefly for WSL2 -> Windows /mnt/ flush to stabilize on large 4K PNGs
                                        prev_sz = -1
                                        for _ in range(10):
                                            try:
                                                sz = os.path.getsize(local_candidate)
                                                if sz > 0 and sz == prev_sz:
                                                    break
                                                prev_sz = sz
                                            except OSError:
                                                pass
                                            time.sleep(0.3)
                                        url = f"/output/{urllib.parse.quote(rel_path, safe='/')}"
                                    else:
                                        # ComfyUI saved into its own output folder; move (preferred) or sync to user's out_dir
                                        synced = False
                                        if local_candidate and out_dir:
                                            comfy_out_dir = _detect_comfy_output_dir()
                                            src_file = (
                                                os.path.join(comfy_out_dir, rel_path.replace("/", os.sep))
                                                if comfy_out_dir else ""
                                            )
                                            if (
                                                src_file
                                                and os.path.isfile(src_file)
                                                and os.path.normcase(os.path.abspath(comfy_out_dir))
                                                != os.path.normcase(os.path.abspath(out_dir))
                                            ):
                                                try:
                                                    prev_sz = -1
                                                    for _ in range(10):
                                                        sz = os.path.getsize(src_file)
                                                        if sz > 0 and sz == prev_sz:
                                                            break
                                                        prev_sz = sz
                                                        time.sleep(0.2)
                                                    os.makedirs(os.path.dirname(local_candidate), exist_ok=True)
                                                    shutil.move(src_file, local_candidate)
                                                    src_txt = os.path.splitext(src_file)[0] + ".txt"
                                                    if os.path.isfile(src_txt):
                                                        dst_txt = os.path.splitext(local_candidate)[0] + ".txt"
                                                        shutil.move(src_txt, dst_txt)
                                                    synced = True
                                                except Exception:
                                                    pass
                                            if not synced:
                                                try:
                                                    view_url = (
                                                        f"{COMFY_URL.rstrip('/')}/view"
                                                        f"?filename={urllib.parse.quote(fname)}"
                                                        f"&subfolder={urllib.parse.quote(sub)}"
                                                        f"&type={urllib.parse.quote(img_type)}"
                                                    )
                                                    vreq = urllib.request.Request(view_url, headers={"User-Agent": "tA-StudioCockpit"})
                                                    with urllib.request.urlopen(vreq, timeout=15.0) as vresp:
                                                        if vresp.status == 200:
                                                            os.makedirs(os.path.dirname(local_candidate), exist_ok=True)
                                                            with open(local_candidate, "wb") as lf:
                                                                lf.write(vresp.read())
                                                            synced = True
                                                except Exception:
                                                    pass
                                        if synced:
                                            url = f"/output/{urllib.parse.quote(rel_path, safe='/')}"
                                        else:
                                            url = (
                                                f"/view?filename={urllib.parse.quote(fname)}"
                                                f"&subfolder={urllib.parse.quote(sub)}"
                                                f"&type={urllib.parse.quote(img_type)}"
                                            )
                                    return rel_path, url
                    return None, None

                # 2. Check ComfyUI history & output files
                history = client.get_history(pid, timeout=120.0)
                time.sleep(1.0) # ensure file write completed
                out_dir = get_output_dir()
                new_image = None
                image_url = None
                before_image_url = None

                if isinstance(history, dict):
                    outputs = history.get("outputs", {})
                    upscaled_rel, upscaled_url = _pick_node_image(outputs, ["1597", "1620"])
                    base_rel, base_url = _pick_node_image(outputs, ["1229", "1619"])
                    if upscaled_url:
                        new_image, image_url = upscaled_rel, upscaled_url
                        if base_url and base_url != upscaled_url:
                            before_image_url = base_url
                    elif base_url:
                        new_image, image_url = base_rel, base_url
                    else:
                        other_nodes = [nid for nid in outputs.keys() if nid not in ("1597", "1620", "1229", "1619")]
                        new_image, image_url = _pick_node_image(outputs, other_nodes)

                if not new_image:
                    for _, rel, _ in scan_output_images(out_dir):
                        if rel not in start_files:
                            new_image = rel
                            image_url = f"/output/{urllib.parse.quote(new_image, safe='/')}"
                            break

                # Fallback extraction from history outputs if not captured via WebSocket
                if not llm_prompt and isinstance(history, dict):
                    outputs = history.get("outputs", {})
                    for nid in ("1108", "2118", "1878", "1879"):
                        node_out = outputs.get(nid, {})
                        for key in ("prompt", "text", "string", "STRING"):
                            v = node_out.get(key)
                            if v and isinstance(v, list) and len(v) > 0 and isinstance(v[0], str) and v[0].strip():
                                llm_prompt = v[0].strip()
                                break
                            elif v and isinstance(v, str) and v.strip():
                                llm_prompt = v.strip()
                                break
                        if llm_prompt:
                            break

                if (not llm_status or llm_status.upper() == "DISABLED") and isinstance(history, dict):
                    outputs = history.get("outputs", {})
                    status_candidates = [
                        ("1878", ("status",)),
                        ("1879", ("status",)),
                        ("2115", ("text", "string", "STRING")),
                        ("2116", ("text", "string", "STRING")),
                    ]
                    for nid, keys in status_candidates:
                        node_out = outputs.get(nid, {})
                        for key in keys:
                            s_out = node_out.get(key)
                            val = ""
                            if isinstance(s_out, list) and s_out and isinstance(s_out[0], str):
                                val = s_out[0].strip()
                            elif isinstance(s_out, str) and s_out.strip():
                                val = s_out.strip()
                            if val:
                                if val.upper() != "DISABLED":
                                    llm_status = val
                                    break
                                if not llm_status:
                                    llm_status = val
                        if llm_status and llm_status.upper() != "DISABLED":
                            break

                with ACTIVE_JOBS_LOCK:
                    cur_job = ACTIVE_JOBS.get(pid, {})
                    if cur_job.get("status") in ("cancelled", "interrupted"):
                        return
                    ACTIVE_JOBS[pid] = {
                        "status": "done",
                        "prompt_id": pid,
                        "start_time": cur_job.get("start_time", time.time()),
                        "finished_at": time.time(),
                        "image": new_image,
                        "image_url": image_url,
                        "before_image_url": before_image_url,
                        "llm_prompt": llm_prompt,
                        "llm_status": llm_status,
                    }

            threading.Thread(target=watch_job, args=(prompt_id, existing_files, job_client_id), daemon=True).start()

            self.send_json({
                "status": "queued",
                "prompt_id": prompt_id,
                "seed": seed_val,
            })
        except Exception as e:
            self.send_json({"error": f"Fehler bei Workflow-Generierung: {e}"}, status=500)

    def send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._send_cors_origin_header()
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def handle_extract_image_params(self, post_body: bytes | None):
        if not post_body:
            self.send_json({"error": "Keine Bilddaten empfangen."}, status=400)
            return

        img = None
        img_name = ""
        try:
            # Check if JSON payload (e.g. from gallery filename reference)
            if post_body.strip().startswith(b"{"):
                data = json.loads(post_body.decode("utf-8"))
                fname = data.get("filename") or data.get("path")
                if fname:
                    if not isinstance(fname, str):
                        self.send_json({"error": "Ungültiger Dateiname."}, status=400)
                        return
                    out_dir = get_output_dir()
                    img_name = os.path.basename(fname)
                    if os.path.isabs(fname):
                        target_path = os.path.normpath(fname)
                    else:
                        target_path = os.path.normpath(
                            os.path.join(out_dir, fname.lstrip("/\\").replace("/", os.sep))
                        )
                    if not out_dir or not _is_path_within(out_dir, target_path):
                        self.send_json({"error": "Ungültiger Dateipfad (außerhalb des Ausgabeordners)."}, status=403)
                        return
                    if not os.path.isfile(target_path):
                        self.send_json({"error": f"Datei nicht gefunden: {img_name}"}, status=404)
                        return
                    img = Image.open(target_path)
            else:
                # Raw image binary or multipart
                content_type = self.headers.get("Content-Type", "")
                if "multipart/form-data" in content_type and b"boundary=" in content_type.encode():
                    boundary = content_type.split("boundary=")[-1].strip().encode()
                    parts = post_body.split(b"--" + boundary)
                    for p in parts:
                        if b"filename=" in p:
                            # Try to extract filename
                            m = re.search(rb'filename="([^"]+)"', p)
                            if m:
                                img_name = m.group(1).decode("utf-8", errors="ignore")
                            header_end = p.find(b"\r\n\r\n")
                            if header_end != -1:
                                fbytes = p[header_end + 4 :].rstrip(b"\r\n")
                                img = Image.open(io.BytesIO(fbytes))
                                break
                if img is None:
                    img = Image.open(io.BytesIO(post_body))
        except Exception as e:
            self.send_json({"error": f"Bild konnte nicht gelesen werden: {e}"}, status=400)
            return

        if not img:
            self.send_json({"error": "Ungültiges Bildformat."}, status=400)
            return

        info = img.info or {}
        prompt_str = info.get("prompt")
        workflow_str = info.get("workflow")

        # Check WebP EXIF tags if not in info
        if not prompt_str and not workflow_str:
            exif = getattr(img, "getexif", lambda: None)()
            if exif:
                for tag_id in (0x9286, 0x010E):
                    val = exif.get(tag_id)
                    if val and isinstance(val, str):
                        try:
                            parsed = json.loads(val)
                            if isinstance(parsed, dict):
                                if "prompt" in parsed:
                                    prompt_str = json.dumps(parsed["prompt"])
                                if "workflow" in parsed:
                                    workflow_str = json.dumps(parsed["workflow"])
                        except Exception:
                            pass

        if not prompt_str and not workflow_str:
            self.send_json({
                "error": "Dieses Bild enthält keine ComfyUI-Metadaten (Workflow/Prompt). Wurde es mit ComfyUI generiert?"
            }, status=422)
            return

        pr = json.loads(prompt_str) if prompt_str else {}
        wf = json.loads(workflow_str) if workflow_str else {}

        params: dict[str, Any] = {
            "source_image": img_name,
            "success": True,
        }

        # 1. Prompts (TAPromptHub Node 2061 or by class_type, with workflow & CLIPTextEncode fallback)
        prompt_hub = pr.get("2061") if isinstance(pr.get("2061"), dict) and "inputs" in pr["2061"] else None
        if not prompt_hub:
            for ndata in pr.values():
                if isinstance(ndata, dict) and ndata.get("class_type") == "TAPromptHub" and "inputs" in ndata:
                    prompt_hub = ndata
                    break
        if prompt_hub:
            inp = prompt_hub["inputs"]
            if isinstance(inp.get("positive_prompt"), str):
                params["prompt"] = inp["positive_prompt"]
            if isinstance(inp.get("additional_prompt"), str):
                params["additional_prompt"] = inp["additional_prompt"]
            if isinstance(inp.get("negative_prompt"), str):
                params["neg_prompt"] = inp["negative_prompt"]

        if "prompt" not in params and isinstance(wf.get("nodes"), list):
            for n in wf["nodes"]:
                if isinstance(n, dict) and (n.get("id") == 2061 or n.get("type") == "TAPromptHub"):
                    wvn = n.get("widgets_values_named") or {}
                    if isinstance(wvn.get("positive_prompt"), str):
                        params["prompt"] = wvn["positive_prompt"]
                    if isinstance(wvn.get("additional_prompt"), str) and "additional_prompt" not in params:
                        params["additional_prompt"] = wvn["additional_prompt"]
                    if isinstance(wvn.get("negative_prompt"), str) and "neg_prompt" not in params:
                        params["neg_prompt"] = wvn["negative_prompt"]
                    wv = n.get("widgets_values")
                    if "prompt" not in params and isinstance(wv, list):
                        if len(wv) > 0 and isinstance(wv[0], str):
                            params["prompt"] = wv[0]
                        if len(wv) > 1 and isinstance(wv[1], str) and "additional_prompt" not in params:
                            params["additional_prompt"] = wv[1]
                        if len(wv) > 2 and isinstance(wv[2], str) and "neg_prompt" not in params:
                            params["neg_prompt"] = wv[2]
                    break

        if "prompt" not in params:
            for nid, ndata in pr.items():
                ctype = ndata.get("class_type", "")
                if ctype in ("CLIPTextEncode", "CLIPTextEncodeFlux", "ShowText|pysssss"):
                    t = ndata.get("inputs", {}).get("text", "")
                    if isinstance(t, str) and t:
                        params["prompt"] = t
                        break

        # 2. Model & Sampler Presets
        model_node = pr.get("2079") if isinstance(pr.get("2079"), dict) and "inputs" in pr["2079"] else None
        if not model_node:
            model_node = next((n for n in pr.values() if isinstance(n, dict) and n.get("class_type") == "TAModelPreset" and "inputs" in n), None)
        if model_node and isinstance(model_node["inputs"].get("preset"), str):
            params["model_preset"] = model_node["inputs"]["preset"]

        sampler_node = pr.get("2108") if isinstance(pr.get("2108"), dict) and "inputs" in pr["2108"] else None
        if not sampler_node:
            sampler_node = next((n for n in pr.values() if isinstance(n, dict) and n.get("class_type") == "TASamplerPreset" and "inputs" in n), None)
        if sampler_node and isinstance(sampler_node["inputs"].get("preset"), str):
            params["sampler_preset"] = sampler_node["inputs"]["preset"]

        # 3. Seed
        if "1204" in pr and "inputs" in pr["1204"]:
            params["seed"] = pr["1204"]["inputs"].get("seed", 0)
            params["seedMode"] = "fixed"
        else:
            for nid, ndata in pr.items():
                if "seed" in ndata.get("inputs", {}):
                    s = ndata["inputs"]["seed"]
                    if isinstance(s, int):
                        params["seed"] = s
                        params["seedMode"] = "fixed"
                        break

        # 4. Latent & Resolution (Node 2121 EmptyLatentImage)
        if "2121" in pr and "inputs" in pr["2121"]:
            inp = pr["2121"]["inputs"]
            params["width"] = int(inp.get("width", 1920))
            params["height"] = int(inp.get("height", 1088))
            params["batch_size"] = int(inp.get("batch_size", 1))

        # 5. Flux Guidance & Sharpen
        if "2109" in pr and "inputs" in pr["2109"]:
            params["flux_guidance"] = float(pr["2109"]["inputs"].get("guidance", 3.5))
        if "2122" in pr and "inputs" in pr["2122"]:
            params["sharpen_enabled"] = True
            params["sharpen"] = float(pr["2122"]["inputs"].get("strength", 0.26))
        else:
            params["sharpen_enabled"] = False

        # 5a. SeedVarianceEnhancer (Nodes 1995 & 1241)
        if "1995" in pr and "inputs" in pr["1995"]:
            params["sve_enabled"] = bool(pr["1995"]["inputs"].get("switch", False))
        if "1241" in pr and "inputs" in pr["1241"]:
            inp1241 = pr["1241"]["inputs"]
            params["sve_auto"] = False
            if "strength" in inp1241:
                params["sve_strength"] = float(inp1241["strength"])
            if "randomize_percent" in inp1241:
                params["sve_randomize_percent"] = float(inp1241["randomize_percent"])
            if "noise_insert" in inp1241:
                params["sve_noise_insert"] = str(inp1241["noise_insert"])
            if "steps_switchover_percent" in inp1241:
                params["sve_steps_switchover_percent"] = float(inp1241["steps_switchover_percent"])
            if "mask_starts_at" in inp1241:
                params["sve_mask_starts_at"] = str(inp1241["mask_starts_at"])
            if "mask_percent" in inp1241:
                params["sve_mask_percent"] = float(inp1241["mask_percent"])

        # 5b. ProPostFilmGrain (Nodes 1980 & 1983)
        if "1980" in pr and "inputs" in pr["1980"]:
            params["film_grain_enabled"] = bool(pr["1980"]["inputs"].get("switch", False))
        if "1983" in pr and "inputs" in pr["1983"]:
            inp1983 = pr["1983"]["inputs"]
            params["film_grain_gray_scale"] = bool(inp1983.get("gray_scale", False))
            params["film_grain_type"] = str(inp1983.get("grain_type", "Fine"))
            params["film_grain_sat"] = float(inp1983.get("grain_sat", 0.15))
            params["film_grain_power"] = float(inp1983.get("grain_power", 0.40))
            params["film_grain_shadows"] = float(inp1983.get("shadows", 0.20))
            params["film_grain_highs"] = float(inp1983.get("highs", 0.20))
            params["film_grain_scale"] = float(inp1983.get("scale", 0.65))
            params["film_grain_sharpen"] = int(inp1983.get("sharpen", 0))
            params["film_grain_src_gamma"] = float(inp1983.get("src_gamma", 1.0))

        # 6. SeedVR2 Gate & Detail Nodes (2023, 1592, 1593, 1595)
        if "2023" in pr and "inputs" in pr["2023"]:
            params["use_seed_vr2"] = bool(pr["2023"]["inputs"].get("enabled", False))
        if "1593" in pr and "inputs" in pr["1593"]:
            inp1593 = pr["1593"]["inputs"]
            if "model" in inp1593:
                params["seedvr2_model"] = str(inp1593["model"])
            if "blocks_to_swap" in inp1593:
                params["seedvr2_blocks_to_swap"] = int(inp1593["blocks_to_swap"])
            if "attention_mode" in inp1593:
                params["seedvr2_attention_mode"] = str(inp1593["attention_mode"])
            if "cache_model" in inp1593:
                params["seedvr2_cache_model"] = bool(inp1593["cache_model"])
        if "1595" in pr and "inputs" in pr["1595"]:
            inp1595 = pr["1595"]["inputs"]
            if "resolution" in inp1595:
                params["seedvr2_resolution"] = int(inp1595["resolution"])
            if "max_resolution" in inp1595:
                params["seedvr2_max_resolution"] = int(inp1595["max_resolution"])
            if "color_correction" in inp1595:
                params["seedvr2_color_correction"] = str(inp1595["color_correction"])
            if "input_noise_scale" in inp1595:
                params["seedvr2_input_noise_scale"] = float(inp1595["input_noise_scale"])
            if "latent_noise_scale" in inp1595:
                params["seedvr2_latent_noise_scale"] = float(inp1595["latent_noise_scale"])
        if "1592" in pr and "inputs" in pr["1592"]:
            inp1592 = pr["1592"]["inputs"]
            if "encode_tiled" in inp1592:
                params["seedvr2_tiled"] = bool(inp1592["encode_tiled"])

        # 7. TA SageAttention Toggler (Node 1912)
        if "1912" in pr and "inputs" in pr["1912"]:
            inp1912 = pr["1912"]["inputs"]
            params["sage_enable"] = bool(inp1912.get("sage_enable", False))
            params["torch_enable"] = bool(inp1912.get("torch_enable", False))
            params["sage_mode"] = str(inp1912.get("sage_mode", "sageattn_qk_int8_pv_fp16_cuda"))
            params["kitchen_enable"] = bool(inp1912.get("kitchen_enable", True))

        # 8. Prompt Controller
        if "1118" in pr and "inputs" in pr["1118"]:
            params["prompt_controller_mode"] = pr["1118"]["inputs"].get("mode", "Manual Only")
            params["delimiter"] = pr["1118"]["inputs"].get("delimiter", ", ")

        # 8b. TASmartLLM (1878 T2I / 1879 I2I)
        active_llm_inp = None
        for llm_nid, llm_m in (("1879", "i2i"), ("1878", "t2i")):
            if llm_nid in pr and "inputs" in pr[llm_nid] and pr[llm_nid]["inputs"].get("llm_enable"):
                active_llm_inp = pr[llm_nid]["inputs"]
                params["llm_mode"] = llm_m
                break
        if active_llm_inp is None and "1878" in pr and "inputs" in pr["1878"]:
            active_llm_inp = pr["1878"]["inputs"]
        if active_llm_inp:
            if active_llm_inp.get("model"):
                params["llm_model"] = str(active_llm_inp["model"])
            if "temperature" in active_llm_inp:
                params["llm_temperature"] = float(active_llm_inp["temperature"])
            if "max_tokens" in active_llm_inp:
                params["llm_max_tokens"] = int(active_llm_inp["max_tokens"])
            if "request_timeout" in active_llm_inp:
                params["llm_request_timeout"] = int(active_llm_inp["request_timeout"])
            if "thinking_mode" in active_llm_inp:
                params["llm_thinking_mode"] = bool(active_llm_inp["thinking_mode"])
            if "unload_image_models_first" in active_llm_inp:
                params["llm_unload_image_models_first"] = bool(active_llm_inp["unload_image_models_first"])
            if "unload_llm_after" in active_llm_inp:
                params["llm_unload_llm_after"] = bool(active_llm_inp["unload_llm_after"])
            if "system_prompt" in active_llm_inp:
                params["llm_system_prompt"] = str(active_llm_inp["system_prompt"])
            if params.get("llm_mode") == "i2i" and "user_prompt" in active_llm_inp and isinstance(active_llm_inp["user_prompt"], str):
                params["llm_user_prompt"] = active_llm_inp["user_prompt"]

        # 8. LoRAs (Node 1518)
        raw_loras = None
        if "1518" in pr and "inputs" in pr["1518"]:
            val = pr["1518"]["inputs"].get("loras", [])
            if isinstance(val, dict) and "__value__" in val:
                raw_loras = val["__value__"]
            elif isinstance(val, list):
                raw_loras = val

        if not raw_loras and isinstance(wf, dict):
            for n in wf.get("nodes", []):
                if n.get("id") == 1518:
                    wvn = n.get("widgets_values_named", {})
                    if "loras" in wvn and isinstance(wvn["loras"], list):
                        raw_loras = wvn["loras"]
                    elif "widgets_values" in n and len(n["widgets_values"]) > 2 and isinstance(n["widgets_values"][2], list):
                        raw_loras = n["widgets_values"][2]
                    break

        if isinstance(raw_loras, list):
            parsed_loras = []
            for l in raw_loras:
                if isinstance(l, dict) and l.get("name"):
                    parsed_loras.append({
                        "name": l.get("name", ""),
                        "strength": float(l.get("strength", 1.0)),
                        "clipStrength": float(l.get("clipStrength", l.get("strength", 1.0))),
                        "active": bool(l.get("active", False)),
                    })
            params["loras"] = parsed_loras

        # 9. Pixaroma Resolution from workflow (Node 2120)
        for n in wf.get("nodes", []):
            if n.get("id") == 2120:
                res_state_str = n.get("properties", {}).get("resolutionState", "")
                if res_state_str:
                    try:
                        res_state = json.loads(res_state_str)
                        params["pix_mode"] = res_state.get("mode", "preset")
                        params["aspect_ratio"] = res_state.get("ratio", "16:9")
                        if "custom_ratio_w" in res_state:
                            params["custom_ratio_w"] = res_state.get("custom_ratio_w")
                        if "custom_ratio_h" in res_state:
                            params["custom_ratio_h"] = res_state.get("custom_ratio_h")
                        if "snap" in res_state:
                            params["snap"] = res_state.get("snap")
                    except Exception:
                        pass
                break

        # 10. Text Overlays (Watermark & Signature)
        if "1981" in pr and "inputs" in pr["1981"]:
            params["overlay_ai_enabled"] = bool(pr["1981"]["inputs"].get("switch", False))
        if "1978" in pr and "inputs" in pr["1978"]:
            params["overlay_ai_text"] = pr["1978"]["inputs"].get("text", "Created with AI '26")
            params["overlay_ai_font"] = pr["1978"]["inputs"].get("font_name", "Caveat-VariableFont_wght.ttf")
            params["overlay_ai_size"] = int(pr["1978"]["inputs"].get("font_size", 14))
            params["overlay_ai_color"] = str(pr["1978"]["inputs"].get("font_color", "white"))
            params["overlay_ai_align"] = str(pr["1978"]["inputs"].get("align", "bottom"))
            params["overlay_ai_justify"] = str(pr["1978"]["inputs"].get("justify", "left"))
            params["overlay_ai_pos_x"] = int(pr["1978"]["inputs"].get("position_x", 10))
            params["overlay_ai_pos_y"] = int(pr["1978"]["inputs"].get("position_y", -15))
            params["overlay_ai_rotation"] = float(pr["1978"]["inputs"].get("rotation_angle", 0))
            params["overlay_ai_margins"] = int(pr["1978"]["inputs"].get("margins", 0))

        if "1982" in pr and "inputs" in pr["1982"]:
            params["overlay_sig_enabled"] = bool(pr["1982"]["inputs"].get("switch", True))
        if "1979" in pr and "inputs" in pr["1979"]:
            params["overlay_sig_text"] = pr["1979"]["inputs"].get("text", "thomo.ART")
            params["overlay_sig_font"] = pr["1979"]["inputs"].get("font_name", "Caveat-VariableFont_wght.ttf")
            params["overlay_sig_size"] = int(pr["1979"]["inputs"].get("font_size", 14))
            params["overlay_sig_color"] = str(pr["1979"]["inputs"].get("font_color", "white"))
            params["overlay_sig_align"] = str(pr["1979"]["inputs"].get("align", "bottom"))
            params["overlay_sig_justify"] = str(pr["1979"]["inputs"].get("justify", "right"))
            params["overlay_sig_pos_x"] = int(pr["1979"]["inputs"].get("position_x", -15))
            params["overlay_sig_pos_y"] = int(pr["1979"]["inputs"].get("position_y", -15))
            params["overlay_sig_rotation"] = float(pr["1979"]["inputs"].get("rotation_angle", 0))
            params["overlay_sig_margins"] = int(pr["1979"]["inputs"].get("margins", 0))

        # 11. Export & Save settings
        if "1229" in pr and "inputs" in pr["1229"]:
            params["save_txt_main"] = (pr["1229"]["inputs"].get("save_txt") == "enabled")
        if "1619" in pr and "inputs" in pr["1619"]:
            inp1619 = pr["1619"]["inputs"]
            params["extra_save_enabled"] = bool(inp1619.get("enabled", False))
            params["extra_save_format"] = str(inp1619.get("save_format", "webp"))
            params["extra_save_quality"] = str(inp1619.get("jpeg_quality", "95"))
            params["extra_save_txt"] = (inp1619.get("save_txt") == "enabled")
        def _resolve_fn_str(val, default: str) -> str:
            if isinstance(val, list):
                if val and str(val[0]) in pr and isinstance(pr[str(val[0])], dict):
                    src_inp = pr[str(val[0])].get("inputs", {})
                    for key in ("string", "value", "text"):
                        if isinstance(src_inp.get(key), str):
                            return src_inp[key]
                return default
            if val is None:
                return default
            return str(val)

        if "1216" in pr and "inputs" in pr["1216"]:
            inp1216 = pr["1216"]["inputs"]
            params["fn_output_folder"] = _resolve_fn_str(inp1216.get("output_folder"), "")
            params["fn_subfolder"] = _resolve_fn_str(inp1216.get("subfolder"), "")
            params["fn_name_prefix"] = _resolve_fn_str(inp1216.get("name_prefix"), "")
            params["fn_wf_version"] = _resolve_fn_str(inp1216.get("wf_version"), "TA-FLEXMOD")
            params["fn_upscaled_suffix"] = _resolve_fn_str(inp1216.get("upscaled_suffix"), "UPSCALED")
            params["fn_delimiter"] = _resolve_fn_str(inp1216.get("delimiter"), "-")
            params["fn_date_format"] = _resolve_fn_str(inp1216.get("date_format"), "%Y%m%d%H%M")
        if "2041" in pr and "inputs" in pr["2041"]:
            params["fn_extra_subfolder"] = _resolve_fn_str(pr["2041"]["inputs"].get("subfolder"), "JPEG")

        if isinstance(wf, dict):
            for n in wf.get("nodes", []):
                nid = n.get("id")
                w_vals = n.get("widgets_values", [])
                if nid == 1229 and len(w_vals) >= 2 and "save_txt_main" not in params:
                    params["save_txt_main"] = (w_vals[1] == "enabled")
                elif nid == 1619 and len(w_vals) >= 5:
                    if "extra_save_enabled" not in params:
                        params["extra_save_enabled"] = bool(w_vals[1])
                    if "extra_save_txt" not in params:
                        params["extra_save_txt"] = (w_vals[2] == "enabled")
                    if "extra_save_format" not in params:
                        params["extra_save_format"] = str(w_vals[3])
                    if "extra_save_quality" not in params:
                        params["extra_save_quality"] = str(w_vals[4])
                elif nid == 1216 and len(w_vals) >= 7:
                    params.setdefault("fn_output_folder", str(w_vals[0]))
                    params.setdefault("fn_subfolder", str(w_vals[1]))
                    params.setdefault("fn_name_prefix", str(w_vals[2]))
                    params.setdefault("fn_wf_version", str(w_vals[3]))
                    params.setdefault("fn_upscaled_suffix", str(w_vals[4]))
                    params.setdefault("fn_delimiter", str(w_vals[5]))
                    params.setdefault("fn_date_format", str(w_vals[6]))
                elif nid == 2041 and len(w_vals) >= 2:
                    params.setdefault("fn_extra_subfolder", str(w_vals[1]))
                elif nid == 2122:
                    if "sharpen_enabled" not in params:
                        params["sharpen_enabled"] = (n.get("mode", 0) != 4)
                    if w_vals and "sharpen" not in params:
                        params["sharpen"] = float(w_vals[0])
                elif nid == 1980 and w_vals and "film_grain_enabled" not in params:
                    params["film_grain_enabled"] = bool(w_vals[0])
                elif nid == 1995 and w_vals and "sve_enabled" not in params:
                    params["sve_enabled"] = bool(w_vals[0])
                elif nid == 1241 and len(w_vals) >= 8:
                    if "sve_randomize_percent" not in params:
                        params["sve_randomize_percent"] = float(w_vals[0])
                    if "sve_strength" not in params:
                        params["sve_strength"] = float(w_vals[1])
                    if "sve_noise_insert" not in params:
                        params["sve_noise_insert"] = str(w_vals[2])
                    if "sve_steps_switchover_percent" not in params:
                        params["sve_steps_switchover_percent"] = float(w_vals[3])
                    if "sve_mask_starts_at" not in params:
                        params["sve_mask_starts_at"] = str(w_vals[6])
                    if "sve_mask_percent" not in params:
                        params["sve_mask_percent"] = float(w_vals[7])
                elif nid == 1983 and len(w_vals) >= 9:
                    if "film_grain_gray_scale" not in params:
                        params["film_grain_gray_scale"] = bool(w_vals[0])
                    if "film_grain_type" not in params:
                        params["film_grain_type"] = str(w_vals[1])
                    if "film_grain_sat" not in params:
                        params["film_grain_sat"] = float(w_vals[2])
                    if "film_grain_power" not in params:
                        params["film_grain_power"] = float(w_vals[3])
                    if "film_grain_shadows" not in params:
                        params["film_grain_shadows"] = float(w_vals[4])
                    if "film_grain_highs" not in params:
                        params["film_grain_highs"] = float(w_vals[5])
                    if "film_grain_scale" not in params:
                        params["film_grain_scale"] = float(w_vals[6])
                    if "film_grain_sharpen" not in params:
                        params["film_grain_sharpen"] = int(w_vals[7])
                    if "film_grain_src_gamma" not in params:
                        params["film_grain_src_gamma"] = float(w_vals[8])
                elif nid == 1912 and len(w_vals) >= 4:
                    if "sage_enable" not in params:
                        params["sage_enable"] = bool(w_vals[0])
                    if "torch_enable" not in params:
                        params["torch_enable"] = bool(w_vals[1])
                    if "sage_mode" not in params:
                        params["sage_mode"] = str(w_vals[2])
                    if "kitchen_enable" not in params:
                        params["kitchen_enable"] = bool(w_vals[3])
                if nid == 1981 and w_vals and "overlay_ai_enabled" not in params:
                    params["overlay_ai_enabled"] = bool(w_vals[0])
                elif nid == 1978 and len(w_vals) >= 4:
                    if "overlay_ai_text" not in params:
                        params["overlay_ai_text"] = str(w_vals[0])
                    if "overlay_ai_font" not in params:
                        params["overlay_ai_font"] = str(w_vals[1])
                    if "overlay_ai_size" not in params:
                        params["overlay_ai_size"] = int(w_vals[2])
                    if "overlay_ai_color" not in params:
                        params["overlay_ai_color"] = str(w_vals[3])
                    if len(w_vals) > 4 and "overlay_ai_align" not in params:
                        params["overlay_ai_align"] = str(w_vals[4])
                    if len(w_vals) > 5 and "overlay_ai_justify" not in params:
                        params["overlay_ai_justify"] = str(w_vals[5])
                    if len(w_vals) > 6 and "overlay_ai_margins" not in params:
                        params["overlay_ai_margins"] = int(w_vals[6])
                    if len(w_vals) > 8 and "overlay_ai_pos_x" not in params:
                        params["overlay_ai_pos_x"] = int(w_vals[8])
                    if len(w_vals) > 9 and "overlay_ai_pos_y" not in params:
                        params["overlay_ai_pos_y"] = int(w_vals[9])
                    if len(w_vals) > 10 and "overlay_ai_rotation" not in params:
                        params["overlay_ai_rotation"] = float(w_vals[10])
                elif nid == 1982 and w_vals and "overlay_sig_enabled" not in params:
                    params["overlay_sig_enabled"] = bool(w_vals[0])
                elif nid == 1979 and len(w_vals) >= 4:
                    if "overlay_sig_text" not in params:
                        params["overlay_sig_text"] = str(w_vals[0])
                    if "overlay_sig_font" not in params:
                        params["overlay_sig_font"] = str(w_vals[1])
                    if "overlay_sig_size" not in params:
                        params["overlay_sig_size"] = int(w_vals[2])
                    if "overlay_sig_color" not in params:
                        params["overlay_sig_color"] = str(w_vals[3])
                    if len(w_vals) > 4 and "overlay_sig_align" not in params:
                        params["overlay_sig_align"] = str(w_vals[4])
                    if len(w_vals) > 5 and "overlay_sig_justify" not in params:
                        params["overlay_sig_justify"] = str(w_vals[5])
                    if len(w_vals) > 6 and "overlay_sig_margins" not in params:
                        params["overlay_sig_margins"] = int(w_vals[6])
                    if len(w_vals) > 8 and "overlay_sig_pos_x" not in params:
                        params["overlay_sig_pos_x"] = int(w_vals[8])
                    if len(w_vals) > 9 and "overlay_sig_pos_y" not in params:
                        params["overlay_sig_pos_y"] = int(w_vals[9])
                    if len(w_vals) > 10 and "overlay_sig_rotation" not in params:
                        params["overlay_sig_rotation"] = float(w_vals[10])
                elif nid == 2134 and w_vals and "overlay_img_enabled" not in params:
                    params["overlay_img_enabled"] = bool(w_vals[0])
                elif nid == 2131 and w_vals and "overlay_img_file" not in params:
                    params["overlay_img_file"] = str(w_vals[0])
                elif nid == 2135 and len(w_vals) >= 2:
                    if "overlay_img_scale" not in params:
                        params["overlay_img_scale"] = round(max(0.05, min(0.50, float(w_vals[1]))), 3)
                elif nid == 2133 and len(w_vals) >= 2:
                    if "overlay_img_pos_x" not in params:
                        params["overlay_img_pos_x"] = int(w_vals[0])
                    if "overlay_img_pos_y" not in params:
                        params["overlay_img_pos_y"] = int(w_vals[1])

        # Fallback ratio calculation
        if "aspect_ratio" not in params and "width" in params and "height" in params:
            w, h = params["width"], params["height"]
            from math import gcd
            g = gcd(w, h)
            params["aspect_ratio"] = f"{w // g}:{h // g}"

        self.send_json(params)

    def handle_open_folder(self):
        folder = os.path.abspath(OUTPUT_DIR)
        if os.path.exists(folder):
            if sys.platform == "win32":
                os.startfile(folder)
            else:
                subprocess.Popen(["xdg-open", folder])
            self.send_json({"status": "opened", "folder": folder})
        else:
            self.send_json({"error": "Folder not found", "folder": folder}, status=404)

    def _is_wsl_configured(self) -> bool:
        """Checks silently via Windows Registry whether at least one WSL distro is installed."""
        if sys.platform != "win32":
            return True
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Lxss") as key:
                subkey_count, _, _ = winreg.QueryInfoKey(key)
                return subkey_count > 0
        except OSError:
            return False

    def _pick_native_path(self, is_file: bool, initial_dir: str = "", kind: str = "script") -> str:
        selected = ""
        try:
            import webview
            if webview.windows:
                if is_file:
                    dialog_type = getattr(getattr(webview, "FileDialog", None), "OPEN", None) or getattr(webview, "OPEN_DIALOG", 10)
                    if kind == "image":
                        file_types = ("Bilder (*.png;*.jpg;*.jpeg;*.webp;*.bmp)", "Alle Dateien (*.*)")
                    else:
                        file_types = ("Skripte & Programme (*.bat;*.cmd;*.sh;*.exe;*.ps1)", "Alle Dateien (*.*)")
                    kwargs = {"allow_multiple": False, "file_types": file_types}
                    if initial_dir:
                        kwargs["directory"] = initial_dir
                    res = webview.windows[0].create_file_dialog(dialog_type, **kwargs)
                else:
                    dialog_type = getattr(getattr(webview, "FileDialog", None), "FOLDER", None) or getattr(webview, "FOLDER_DIALOG", 20)
                    kwargs = {}
                    if initial_dir:
                        kwargs["directory"] = initial_dir
                    res = webview.windows[0].create_file_dialog(dialog_type, **kwargs)
                if res and len(res) > 0:
                    selected = str(res[0])
        except Exception:
            pass

        if not selected:
            try:
                import tkinter as tk
                from tkinter import filedialog
                root = tk.Tk()
                root.withdraw()
                root.attributes("-topmost", True)
                if is_file:
                    if kind == "image":
                        ftypes = [("Bilder", "*.png *.jpg *.jpeg *.webp *.bmp"), ("Alle Dateien", "*.*")]
                        title = "Referenzbild auswählen"
                    else:
                        ftypes = [("Skripte & Programme", "*.bat *.cmd *.sh *.exe *.ps1"), ("Alle Dateien", "*.*")]
                        title = "Datei auswählen"
                    kwargs = {"title": title, "filetypes": ftypes}
                    if initial_dir:
                        kwargs["initialdir"] = initial_dir
                    selected = filedialog.askopenfilename(**kwargs) or ""
                else:
                    kwargs = {"title": "Ordner auswählen"}
                    if initial_dir:
                        kwargs["initialdir"] = initial_dir
                    selected = filedialog.askdirectory(**kwargs) or ""
                root.destroy()
            except Exception:
                pass
        return selected

    def handle_browse_i2i_image(self):
        """Open native image picker starting in last_i2i_dir (or OUTPUT_DIR), remember folder, return image payload."""
        cfg = load_config()
        initial_dir = str(cfg.get("last_i2i_dir") or "").strip()
        if not initial_dir or not os.path.isdir(initial_dir):
            out_dir = get_output_dir()
            initial_dir = out_dir if out_dir and os.path.isdir(out_dir) else ""
        selected = self._pick_native_path(is_file=True, initial_dir=initial_dir, kind="image")
        if not selected or not os.path.isfile(selected):
            self.send_json({"path": ""})
            return
        parent_dir = os.path.dirname(os.path.abspath(selected))
        if parent_dir and os.path.isdir(parent_dir):
            save_config({"last_i2i_dir": parent_dir})
        ext = os.path.splitext(selected)[1].lower()
        mime = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
        }.get(ext, "image/png")
        try:
            with open(selected, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            self.send_json({
                "path": selected,
                "name": os.path.basename(selected),
                "mime": mime,
                "b64": b64,
            })
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def _open_browse_dialog(self, is_file: bool, query: str = ""):
        """Open a native file or folder selection dialog and return the chosen path as JSON."""
        params = urllib.parse.parse_qs(query or "")
        initial = (params.get("initial") or [""])[0].strip()
        initial_dir = ""
        if initial:
            if os.path.isdir(initial):
                initial_dir = initial
            else:
                parent = os.path.dirname(initial)
                if parent and os.path.isdir(parent):
                    initial_dir = parent
        selected = self._pick_native_path(is_file=is_file, initial_dir=initial_dir, kind="script")

        if selected:
            selected = os.path.normpath(selected)

        self.send_json({"path": selected})

    def handle_browse_folder(self, query: str = ""):
        self._open_browse_dialog(is_file=False, query=query)

    def handle_browse_file(self, query: str = ""):
        self._open_browse_dialog(is_file=True, query=query)

    @staticmethod
    def _resolve_comfy_paths(cfg: dict, override_dir: str = "") -> dict:
        """Resolve local ComfyUI root, custom_nodes directory, and Python executable."""
        comfy_url = str(cfg.get("comfy_url", COMFY_URL)).strip().lower()
        parsed_url = urllib.parse.urlparse(comfy_url)
        host = (parsed_url.hostname or "").lower()
        is_remote = host not in ("", "127.0.0.1", "localhost", "::1")

        launch_cmd = str(cfg.get("comfy_launch_cmd", DEFAULT_LAUNCH_CMD)).strip()
        is_wsl = launch_cmd.startswith("wsl") or "~/" in launch_cmd or ".sh" in launch_cmd
        norm_override = override_dir.strip().strip('"').strip("'")
        if norm_override.startswith("\\\\wsl.localhost\\") or norm_override.startswith("\\\\wsl$\\"):
            parts = norm_override.split("\\")
            if len(parts) > 4:
                norm_override = "/" + "/".join(parts[4:])
                is_wsl = True
        elif norm_override.startswith("/"):
            is_wsl = True

        comfy_root = ""
        custom_nodes_dir = ""
        python_exe = ""

        # WSL auto-detection from running ComfyUI process or explicit Linux path
        if sys.platform == "win32" and is_wsl and not is_remote:
            if norm_override.startswith("/"):
                ov = norm_override.rstrip("/")
                try:
                    for cand in (ov, f"{ov}/ComfyUI"):
                        chk = subprocess.run(
                            ["wsl", "test", "-d", f"{cand}/custom_nodes"],
                            timeout=3,
                            creationflags=_NO_WINDOW_FLAGS,
                        )
                        if chk.returncode == 0:
                            comfy_root = cand
                            custom_nodes_dir = f"{cand}/custom_nodes"
                            break
                except Exception:
                    pass

            if not custom_nodes_dir:
                try:
                    proc = subprocess.run(
                        ["wsl", "bash", "-c", "ps -eo args | grep -E 'python.*main\\.py' | grep -v grep | head -n 1"],
                        capture_output=True, text=True, timeout=5,
                        creationflags=_NO_WINDOW_FLAGS,
                    )
                    line = (proc.stdout or "").strip()
                    if line:
                        tokens = line.split()
                        if tokens:
                            python_exe = tokens[0].strip()
                        for tok in tokens:
                            if tok.endswith("main.py") and "/" in tok:
                                cand_root = tok.rsplit("/", 1)[0]
                                chk = subprocess.run(
                                    ["wsl", "test", "-d", f"{cand_root}/custom_nodes"],
                                    timeout=3,
                                    creationflags=_NO_WINDOW_FLAGS,
                                )
                                if chk.returncode == 0:
                                    comfy_root = cand_root
                                    custom_nodes_dir = f"{cand_root}/custom_nodes"
                                break
                except Exception:
                    pass

            return {
                "comfy_root": comfy_root,
                "custom_nodes_dir": custom_nodes_dir,
                "python_exe": python_exe,
                "is_wsl": True,
                "is_remote": False,
            }

        candidates: list[str] = []
        if override_dir and override_dir.strip():
            candidates.append(override_dir.strip().strip('"').strip("'"))
        if cfg.get("comfy_dir"):
            candidates.append(str(cfg["comfy_dir"]).strip().strip('"').strip("'"))
        if launch_cmd and not is_wsl:
            clean_cmd = launch_cmd.strip('"').strip("'")
            if os.path.isfile(clean_cmd):
                candidates.append(os.path.dirname(clean_cmd))
            elif os.path.isdir(clean_cmd):
                candidates.append(clean_cmd)
        out_dir = str(cfg.get("output_dir", "")).strip()
        if out_dir and os.path.isdir(out_dir):
            parent = os.path.dirname(os.path.normpath(out_dir))
            candidates.append(parent)
            candidates.append(os.path.dirname(parent))

        for cand in candidates:
            if not cand or not os.path.isdir(cand):
                continue
            norm = os.path.normpath(cand)
            if os.path.basename(norm).lower() == "custom_nodes":
                custom_nodes_dir = norm
                comfy_root = os.path.dirname(norm)
                break
            portable_cn = os.path.join(norm, "ComfyUI", "custom_nodes")
            direct_cn = os.path.join(norm, "custom_nodes")
            if os.path.isdir(portable_cn):
                comfy_root = os.path.join(norm, "ComfyUI")
                custom_nodes_dir = portable_cn
                break
            if os.path.isdir(direct_cn):
                comfy_root = norm
                custom_nodes_dir = direct_cn
                break
            if os.path.isfile(os.path.join(norm, "main.py")) and os.path.isdir(os.path.join(norm, "nodes.py")):
                comfy_root = norm
                custom_nodes_dir = direct_cn
                break

        if comfy_root:
            search_bases = [comfy_root, os.path.dirname(comfy_root)]
            py_rel_paths = [
                os.path.join("python_embeded", "python.exe"),
                os.path.join("python_embedded", "python.exe"),
                os.path.join("venv", "Scripts", "python.exe"),
                os.path.join(".venv", "Scripts", "python.exe"),
                os.path.join("venv", "bin", "python"),
                os.path.join(".venv", "bin", "python"),
            ]
            for base in search_bases:
                for rel in py_rel_paths:
                    p = os.path.join(base, rel)
                    if os.path.isfile(p):
                        python_exe = p
                        break
                if python_exe:
                    break

        return {
            "comfy_root": comfy_root,
            "custom_nodes_dir": custom_nodes_dir,
            "python_exe": python_exe,
            "is_wsl": is_wsl,
            "is_remote": is_remote,
        }

    def handle_check_nodes(self):
        cfg = load_config()
        comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
        paths = self._resolve_comfy_paths(cfg)

        try:
            stats = self._fetch_comfy_json(f"{comfy_url}/system_stats", timeout=3.0)
            comfy_online = isinstance(stats, dict)
        except Exception:
            comfy_online = False

        if not comfy_online:
            self.send_json({
                "comfy_online": False,
                "missing_packs": [],
                "total_missing_nodes": 0,
                "paths": paths,
            })
            return

        all_nodes = [n for pack in REQUIRED_NODE_PACKS for n in pack["nodes"]]
        installed_nodes = set()

        def _check_one(node_name: str):
            try:
                encoded = urllib.parse.quote(node_name, safe="")
                data = self._fetch_comfy_json(f"{comfy_url}/object_info/{encoded}", timeout=3.0)
                if isinstance(data, dict) and node_name in data:
                    return node_name
            except Exception:
                pass
            return None

        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=6) as pool:
            for res_name in pool.map(_check_one, all_nodes):
                if res_name:
                    installed_nodes.add(res_name)

        custom_nodes_dir = paths.get("custom_nodes_dir", "")
        is_wsl = bool(paths.get("is_wsl"))
        missing_packs = []
        total_missing_nodes = 0

        for pack in REQUIRED_NODE_PACKS:
            missing = [n for n in pack["nodes"] if n not in installed_nodes]
            if missing:
                total_missing_nodes += len(missing)
                folder_exists = False
                if custom_nodes_dir:
                    if is_wsl and custom_nodes_dir.startswith("/"):
                        try:
                            chk = subprocess.run(
                                ["wsl", "test", "-d", f"{custom_nodes_dir.rstrip('/')}/{pack['id']}"],
                                timeout=3,
                                creationflags=_NO_WINDOW_FLAGS,
                            )
                            folder_exists = chk.returncode == 0
                        except Exception:
                            folder_exists = False
                    else:
                        folder_exists = os.path.isdir(os.path.join(custom_nodes_dir, pack["id"]))
                missing_packs.append({
                    "id": pack["id"],
                    "name": pack["name"],
                    "repo": pack["repo"],
                    "required": pack["required"],
                    "description_de": pack["description_de"],
                    "description_en": pack["description_en"],
                    "missing_nodes": missing,
                    "folder_exists": folder_exists,
                })

        self.send_json({
            "comfy_online": True,
            "missing_packs": missing_packs,
            "total_missing_nodes": total_missing_nodes,
            "paths": paths,
        })

    _BG_REMOVE_CANDIDATES = (
        ("RMBG", "ComfyUI-RMBG"),
        ("InspyrenetRembg", "ComfyUI-Inspyrenet-Rembg"),
        ("InspyrenetRembgAdvanced", "ComfyUI-Inspyrenet-Rembg"),
        ("Image Remove Background (rembg)", "rembg-comfyui-node"),
        ("RemoveBackground", "ComfyUI / RemoveBackground"),
        ("ImageRembg", "rembg"),
        ("RembgNode", "rembg"),
    )

    def _detect_bg_remove_node(self, comfy_url: str) -> tuple[bool, str | None, dict | None, str | None]:
        """Return (comfy_online, node_type, node_info, pack_label)."""
        try:
            stats = self._fetch_comfy_json(f"{comfy_url}/system_stats", timeout=3.0)
            if not isinstance(stats, dict):
                return False, None, None, None
        except Exception:
            return False, None, None, None

        for node_name, pack_label in self._BG_REMOVE_CANDIDATES:
            try:
                encoded = urllib.parse.quote(node_name, safe="")
                data = self._fetch_comfy_json(f"{comfy_url}/object_info/{encoded}", timeout=3.0)
                if isinstance(data, dict) and node_name in data and isinstance(data[node_name], dict):
                    return True, node_name, data[node_name], pack_label
            except Exception:
                continue
        return True, None, None, None

    @staticmethod
    def _resolve_node_input_default(key: str, spec: list):
        """Resolve a sensible default value from a ComfyUI object_info input spec."""
        first = spec[0]
        meta = spec[1] if len(spec) > 1 and isinstance(spec[1], dict) else {}

        if isinstance(first, list):
            if key == "model" and "RMBG-2.0" in first:
                return "RMBG-2.0"
            if "default" in meta:
                return meta["default"]
            return first[0] if first else None
        if "default" in meta:
            return meta["default"]
        if first == "INT":
            return 0
        if first == "FLOAT":
            return 0.0
        if first == "BOOLEAN":
            return False
        if first == "STRING":
            return ""
        return None

    @classmethod
    def _build_bg_remove_prompt(cls, node_type: str, node_info: dict, uploaded_filename: str, filename_prefix: str) -> dict:
        """Build a minimal standalone ComfyUI API prompt for background removal."""
        prompt: dict[str, dict] = {
            "1": {
                "class_type": "LoadImage",
                "inputs": {"image": uploaded_filename},
            }
        }
        input_spec = node_info.get("input") or {}
        req_inputs = input_spec.get("required") or {}
        opt_inputs = input_spec.get("optional") or {}
        node_inputs: dict = {}
        image_wired = False

        for key, spec in req_inputs.items():
            if not isinstance(spec, list) or not spec:
                continue
            if spec[0] == "IMAGE" and not image_wired:
                node_inputs[key] = ["1", 0]
                image_wired = True
            else:
                val = cls._resolve_node_input_default(key, spec)
                if val is not None:
                    node_inputs[key] = val

        for key, spec in opt_inputs.items():
            if key in node_inputs or not isinstance(spec, list) or not spec:
                continue
            if spec[0] == "IMAGE":
                continue
            val = cls._resolve_node_input_default(key, spec)
            if val is not None:
                node_inputs[key] = val

        if not image_wired:
            node_inputs["image"] = ["1", 0]

        prompt["2"] = {
            "class_type": node_type,
            "inputs": node_inputs,
        }

        outputs = node_info.get("output") or []
        if "IMAGE" in outputs:
            img_slot = outputs.index("IMAGE")
            prompt["3"] = {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["2", img_slot],
                    "filename_prefix": filename_prefix,
                },
            }
        elif "MASK" in outputs:
            mask_slot = outputs.index("MASK")
            prompt["3"] = {
                "class_type": "JoinImageWithAlpha",
                "inputs": {
                    "image": ["1", 0],
                    "alpha": ["2", mask_slot],
                },
            }
            prompt["4"] = {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["3", 0],
                    "filename_prefix": filename_prefix,
                },
            }
        else:
            prompt["3"] = {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["2", 0],
                    "filename_prefix": filename_prefix,
                },
            }

        return prompt

    def handle_bg_remove_status(self):
        cfg = load_config()
        comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
        comfy_online, node_type, _, pack_label = self._detect_bg_remove_node(comfy_url)
        if not comfy_online:
            self.send_json({
                "comfy_online": False,
                "available": False,
                "node_type": None,
                "pack_label": None,
                "reason": "comfy_offline",
            })
            return
        self.send_json({
            "comfy_online": True,
            "available": bool(node_type),
            "node_type": node_type,
            "pack_label": pack_label,
            "reason": "ok" if node_type else "no_node",
        })

    def handle_bg_remove(self, post_body: bytes | None):
        if not post_body:
            self.send_json({"error": "Empty request body"}, status=400)
            return
        try:
            payload = json.loads(post_body.decode("utf-8"))
        except Exception as e:
            self.send_json({"error": f"Invalid JSON: {e}"}, status=400)
            return

        cfg = load_config()
        comfy_url = cfg.get("comfy_url", COMFY_URL).rstrip("/")
        comfy_online, node_type, node_info, _ = self._detect_bg_remove_node(comfy_url)
        if not comfy_online:
            self.send_json({"error": "ComfyUI ist nicht erreichbar."}, status=503)
            return
        if not node_type or not node_info:
            self.send_json({"error": "Kein Background-Remover-Node in ComfyUI gefunden."}, status=400)
            return

        rel_filename = (payload.get("filename") or "").strip()
        image_base64 = (payload.get("image_base64") or "").strip()
        orig_name = (payload.get("original_filename") or rel_filename or "image.png").strip()

        img_bytes = None
        out_dir = get_output_dir()

        if rel_filename and out_dir and os.path.isdir(out_dir):
            safe_rel = rel_filename.lstrip("/\\").replace("/", os.sep)
            candidate = os.path.realpath(os.path.join(out_dir, safe_rel))
            root_real = os.path.realpath(out_dir)
            if (candidate == root_real or candidate.startswith(root_real + os.sep)) and os.path.isfile(candidate):
                with open(candidate, "rb") as f:
                    img_bytes = f.read()

        if img_bytes is None and image_base64:
            try:
                b64_data = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
                img_bytes = base64.b64decode(b64_data)
            except Exception as e:
                self.send_json({"error": f"Ungültige Bilddaten: {e}"}, status=400)
                return

        if not img_bytes:
            self.send_json({"error": "Kein gültiges Eingabebild gefunden."}, status=400)
            return

        try:
            base_only = os.path.basename(orig_name.replace("\\", "/")) or "image.png"
            stem = os.path.splitext(base_only)[0] or "image"
            upload_name = f"cockpit_bg_src_{uuid.uuid4().hex[:8]}.png"
            uploaded = discord_gif.comfy_upload_image(comfy_url, img_bytes, upload_name)

            api_prompt = self._build_bg_remove_prompt(
                node_type=node_type,
                node_info=node_info,
                uploaded_filename=uploaded,
                filename_prefix=f"nobg_{stem}",
            )
            client = ComfyClient(comfy_url)
            prompt_id = client.queue_prompt(api_prompt)
            if not prompt_id:
                self.send_json({"error": "ComfyUI konnte den Background-Remove-Job nicht einreihen."}, status=500)
                return

            with ACTIVE_JOBS_LOCK:
                _prune_active_jobs_locked()
                ACTIVE_JOBS[prompt_id] = {
                    "status": "running",
                    "prompt_id": prompt_id,
                    "type": "bg_remove",
                    "node_type": node_type,
                    "start_time": time.time(),
                }

            def watch_bg_remove(pid: str):
                try:
                    deadline = time.time() + 180.0
                    out_img_info = None
                    while time.time() < deadline:
                        with ACTIVE_JOBS_LOCK:
                            if ACTIVE_JOBS.get(pid, {}).get("status") in ("cancelled", "interrupted"):
                                return
                        time.sleep(0.4)
                        with ACTIVE_JOBS_LOCK:
                            if ACTIVE_JOBS.get(pid, {}).get("status") in ("cancelled", "interrupted"):
                                return
                        try:
                            entry = client.get_history(pid, timeout=2.0)
                        except Exception:
                            continue
                        if not entry:
                            continue
                        status_obj = entry.get("status") or {}
                        if status_obj.get("status_str") == "error":
                            err_msg = "ComfyUI Fehler bei der Hintergrundentfernung."
                            for msg_item in status_obj.get("messages") or []:
                                if isinstance(msg_item, list) and len(msg_item) >= 2 and msg_item[0] == "execution_error":
                                    if isinstance(msg_item[1], dict) and msg_item[1].get("exception_message"):
                                        err_msg = str(msg_item[1]["exception_message"]).strip()
                                        break
                            with ACTIVE_JOBS_LOCK:
                                if pid in ACTIVE_JOBS:
                                    ACTIVE_JOBS[pid]["status"] = "error"
                                    ACTIVE_JOBS[pid]["error"] = err_msg
                                    ACTIVE_JOBS[pid]["finished_at"] = time.time()
                            return
                        if status_obj.get("status_str") == "interrupted":
                            with ACTIVE_JOBS_LOCK:
                                if pid in ACTIVE_JOBS:
                                    ACTIVE_JOBS[pid]["status"] = "interrupted"
                                    ACTIVE_JOBS[pid]["finished_at"] = time.time()
                            return
                        outputs = entry.get("outputs") or {}
                        for node_out in outputs.values():
                            imgs = node_out.get("images") or []
                            if imgs:
                                out_img_info = imgs[0]
                                break
                        if out_img_info:
                            break

                    with ACTIVE_JOBS_LOCK:
                        if ACTIVE_JOBS.get(pid, {}).get("status") in ("cancelled", "interrupted"):
                            return

                    if not out_img_info:
                        with ACTIVE_JOBS_LOCK:
                            if pid in ACTIVE_JOBS:
                                ACTIVE_JOBS[pid]["status"] = "error"
                                ACTIVE_JOBS[pid]["error"] = "Zeitüberschreitung bei der Hintergrundentfernung."
                                ACTIVE_JOBS[pid]["finished_at"] = time.time()
                        return

                    view_qs = urllib.parse.urlencode({
                        "filename": out_img_info.get("filename", ""),
                        "subfolder": out_img_info.get("subfolder", ""),
                        "type": out_img_info.get("type", "output"),
                    })
                    view_req = urllib.request.Request(
                        f"{comfy_url}/view?{view_qs}",
                        headers={"User-Agent": "tA-StudioCockpit", "Host": urllib.parse.urlparse(comfy_url).netloc},
                    )
                    with urllib.request.urlopen(view_req, timeout=20.0) as resp:
                        result_bytes = resp.read()

                    if out_dir and os.path.isdir(out_dir):
                        rel_dir = os.path.dirname(rel_filename.replace("\\", "/")).strip("/") if rel_filename else ""
                        target_dir = os.path.join(out_dir, rel_dir.replace("/", os.sep)) if rel_dir else out_dir
                        os.makedirs(target_dir, exist_ok=True)
                        clean_stem = stem[:-5] if stem.endswith("_nobg") else stem
                        candidate_name = f"{clean_stem}_nobg.png"
                        idx = 2
                        while os.path.exists(os.path.join(target_dir, candidate_name)):
                            candidate_name = f"{clean_stem}_nobg_{idx}.png"
                            idx += 1
                        target_path = os.path.join(target_dir, candidate_name)
                        with open(target_path, "wb") as f:
                            f.write(result_bytes)
                        rel_out = f"{rel_dir}/{candidate_name}" if rel_dir else candidate_name
                        out_fn = rel_out
                        out_url = f"/output/{urllib.parse.quote(rel_out, safe='/')}"
                    else:
                        out_fn = out_img_info.get("filename", f"{stem}_nobg.png")
                        out_url = f"/view?{view_qs}"

                    with ACTIVE_JOBS_LOCK:
                        if pid in ACTIVE_JOBS and ACTIVE_JOBS[pid].get("status") not in ("cancelled", "interrupted"):
                            ACTIVE_JOBS[pid]["filename"] = out_fn
                            ACTIVE_JOBS[pid]["image_url"] = out_url
                            ACTIVE_JOBS[pid]["node_type"] = node_type
                            ACTIVE_JOBS[pid]["status"] = "done"
                            ACTIVE_JOBS[pid]["finished_at"] = time.time()
                except Exception as e:
                    with ACTIVE_JOBS_LOCK:
                        if pid in ACTIVE_JOBS and ACTIVE_JOBS[pid].get("status") not in ("cancelled", "interrupted"):
                            ACTIVE_JOBS[pid]["status"] = "error"
                            ACTIVE_JOBS[pid]["error"] = str(e)
                            ACTIVE_JOBS[pid]["finished_at"] = time.time()

            threading.Thread(target=watch_bg_remove, args=(prompt_id,), daemon=True).start()
            self.send_json({
                "status": "started",
                "prompt_id": prompt_id,
                "node_type": node_type,
            })
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    @staticmethod
    def _append_install_log(msg: str):
        with NODE_INSTALL_LOCK:
            NODE_INSTALL_JOB["logs"].append(msg)
            if len(NODE_INSTALL_JOB["logs"]) > 200:
                NODE_INSTALL_JOB["logs"] = NODE_INSTALL_JOB["logs"][-200:]

    @classmethod
    def _install_single_pack(cls, pack: dict, custom_nodes_dir: str, python_exe: str, is_wsl: bool = False, lang: str = "de") -> tuple[bool, str]:
        en = lang == "en"
        pack_id = pack["id"]
        repo_url = pack["repo"].rstrip("/")
        cls._append_install_log(f"▶ {pack_id}: {'Starting installation...' if en else 'Starte Installation...'}")

        if is_wsl and custom_nodes_dir.startswith("/"):
            target_wsl = f"{custom_nodes_dir.rstrip('/')}/{pack_id}"
            try:
                cls._append_install_log(f"  [WSL] {'Target' if en else 'Ziel'}: {target_wsl}")
                cmd_script = (
                    f'mkdir -p "{custom_nodes_dir}" && '
                    f'if [ -d "{target_wsl}/.git" ]; then git -C "{target_wsl}" pull; '
                    f'else rm -rf "{target_wsl}" && git clone --depth 1 "{repo_url}.git" "{target_wsl}"; fi'
                )
                proc = subprocess.run(
                    ["wsl", "bash", "-l", "-c", cmd_script],
                    capture_output=True, text=True, timeout=240,
                    creationflags=_NO_WINDOW_FLAGS,
                )
                if proc.returncode != 0:
                    err = (proc.stderr or proc.stdout or ("WSL git failed" if en else "WSL git fehlgeschlagen")).strip()
                    cls._append_install_log(f"  ✖ {'WSL git error' if en else 'WSL git Fehler'}: {err}")
                    return False, err

                if python_exe:
                    req_cmd = (
                        f'if [ -f "{target_wsl}/requirements.txt" ]; then '
                        f'"{python_exe}" -m pip install -r "{target_wsl}/requirements.txt"; fi'
                    )
                    cls._append_install_log(f"  [WSL] {'Checking' if en else 'Prüfe'} requirements.txt ({python_exe})...")
                    p_req = subprocess.run(
                        ["wsl", "bash", "-l", "-c", req_cmd],
                        capture_output=True, text=True, timeout=300,
                        creationflags=_NO_WINDOW_FLAGS,
                    )
                    if p_req.returncode != 0:
                        err = (p_req.stderr or p_req.stdout or ("WSL pip error" if en else "WSL pip Fehler")).strip().splitlines()[-1]
                        cls._append_install_log(f"  ⚠ {'WSL pip error' if en else 'WSL pip Fehler'}: {err}")
                        return False, f"requirements.txt: {err}"

                cls._append_install_log(
                    f"  ✓ {pack_id} {'successfully installed in WSL.' if en else 'erfolgreich in WSL installiert.'}"
                )
                return True, "ok"
            except Exception as e:
                cls._append_install_log(f"  ✖ {'WSL error for' if en else 'WSL Fehler bei'} {pack_id}: {e}")
                return False, str(e)

        target_dir = os.path.join(custom_nodes_dir, pack_id)
        git_exe = shutil.which("git")

        os.makedirs(custom_nodes_dir, exist_ok=True)

        try:
            if git_exe:
                if os.path.isdir(os.path.join(target_dir, ".git")):
                    cls._append_install_log(f"  git pull in {target_dir}")
                    proc = subprocess.run(
                        [git_exe, "-C", target_dir, "pull"],
                        capture_output=True, text=True, timeout=180,
                        creationflags=_NO_WINDOW_FLAGS,
                    )
                else:
                    if os.path.isdir(target_dir):
                        shutil.rmtree(target_dir, ignore_errors=True)
                    cls._append_install_log(f"  git clone {repo_url}.git")
                    proc = subprocess.run(
                        [git_exe, "clone", "--depth", "1", f"{repo_url}.git", target_dir],
                        capture_output=True, text=True, timeout=240,
                        creationflags=_NO_WINDOW_FLAGS,
                    )
                if proc.returncode != 0:
                    err = (proc.stderr or proc.stdout or ("git failed" if en else "git fehlgeschlagen")).strip()
                    cls._append_install_log(f"  ✖ {'git error' if en else 'git Fehler'}: {err}")
                    return False, err
            else:
                cls._append_install_log(
                    "  git not found – downloading GitHub ZIP..." if en else "  git nicht gefunden – lade GitHub-ZIP herunter..."
                )
                zip_bytes = None
                for branch in ("main", "master"):
                    zip_url = f"{repo_url}/archive/refs/heads/{branch}.zip"
                    try:
                        req = urllib.request.Request(zip_url, headers={"User-Agent": "tA-StudioCockpit"})
                        with urllib.request.urlopen(req, timeout=60.0) as resp:
                            if resp.status == 200:
                                zip_bytes = resp.read()
                                break
                    except Exception:
                        continue
                if not zip_bytes:
                    msg = f"ZIP download from {repo_url} failed." if en else f"ZIP-Download von {repo_url} fehlgeschlagen."
                    cls._append_install_log(f"  ✖ {msg}")
                    return False, msg

                if os.path.isdir(target_dir):
                    shutil.rmtree(target_dir, ignore_errors=True)
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                    top_dirs = {name.split("/")[0] for name in zf.namelist() if "/" in name}
                    zf.extractall(custom_nodes_dir)
                extracted_root = os.path.join(custom_nodes_dir, next(iter(top_dirs), ""))
                if extracted_root and os.path.isdir(extracted_root) and extracted_root != target_dir:
                    os.rename(extracted_root, target_dir)

            req_file = os.path.join(target_dir, "requirements.txt")
            if os.path.isfile(req_file):
                if python_exe and os.path.isfile(python_exe):
                    cls._append_install_log(f"  pip install -r requirements.txt ({os.path.basename(python_exe)})")
                    env = os.environ.copy()
                    env["PIP_DISABLE_PIP_VERSION_CHECK"] = "1"
                    proc = subprocess.run(
                        [python_exe, "-m", "pip", "install", "-r", req_file],
                        capture_output=True, text=True, timeout=300, env=env,
                        creationflags=_NO_WINDOW_FLAGS,
                    )
                    if proc.returncode != 0:
                        err = (proc.stderr or proc.stdout or "pip error").strip().splitlines()[-1]
                        cls._append_install_log(f"  ⚠ {'pip warning/error' if en else 'pip Warnung/Fehler'}: {err}")
                        return False, f"requirements.txt: {err}"
                else:
                    cls._append_install_log(
                        "  ⚠ ComfyUI Python not found – skipping requirements.txt." if en else "  ⚠ ComfyUI Python nicht gefunden – requirements.txt übersprungen."
                    )

            cls._append_install_log(f"  ✓ {pack_id} {'installed successfully.' if en else 'erfolgreich installiert.'}")
            return True, "ok"
        except Exception as e:
            cls._append_install_log(f"  ✖ {'Error for' if en else 'Fehler bei'} {pack_id}: {e}")
            return False, str(e)

    def handle_install_nodes_status(self):
        with NODE_INSTALL_LOCK:
            self.send_json(dict(NODE_INSTALL_JOB))

    def handle_install_nodes(self, post_body: bytes | None):
        with NODE_INSTALL_LOCK:
            if NODE_INSTALL_JOB.get("status") == "running":
                self.send_json({"error": "Installation läuft bereits."}, status=409)
                return

        payload = {}
        if post_body:
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                pass

        cfg = load_config()
        override_dir = str(payload.get("comfy_dir", "")).strip()
        paths = self._resolve_comfy_paths(cfg, override_dir=override_dir)

        if paths.get("is_remote"):
            self.send_json({
                "error": "ComfyUI läuft auf einem Remote-Rechner. Bitte installiere die Custom Nodes direkt dort (z. B. über ComfyUI-Manager)."
            }, status=400)
            return

        custom_nodes_dir = paths.get("custom_nodes_dir", "")
        is_wsl = bool(paths.get("is_wsl"))
        dir_ok = bool(custom_nodes_dir) and (
            (is_wsl and custom_nodes_dir.startswith("/")) or os.path.isdir(os.path.dirname(custom_nodes_dir))
        )
        if not dir_ok:
            self.send_json({
                "code": "NO_COMFY_DIR",
                "error": "Der ComfyUI-Ordner konnte nicht automatisch gefunden werden. Bitte wähle deinen ComfyUI-Ordner aus."
            }, status=400)
            return

        if override_dir and paths.get("comfy_root"):
            save_config({"comfy_dir": override_dir})

        requested_ids = payload.get("pack_ids")
        pack_map = {p["id"]: p for p in REQUIRED_NODE_PACKS}
        if isinstance(requested_ids, list) and requested_ids:
            packs_to_install = [pack_map[pid] for pid in requested_ids if pid in pack_map]
        else:
            packs_to_install = list(REQUIRED_NODE_PACKS)

        if not packs_to_install:
            self.send_json({"error": "Keine gültigen Node-Packs ausgewählt."}, status=400)
            return

        python_exe = paths.get("python_exe", "")
        lang = str(payload.get("lang") or cfg.get("language") or "de").strip().lower()
        en = lang == "en"
        with NODE_INSTALL_LOCK:
            NODE_INSTALL_JOB.update({
                "status": "running",
                "current_pack": packs_to_install[0]["id"],
                "completed": 0,
                "total": len(packs_to_install),
                "logs": [f"{'Target folder' if en else 'Zielordner'}: {custom_nodes_dir}"],
                "results": {},
                "error": "",
            })

        def worker():
            all_ok = True
            for idx, pack in enumerate(packs_to_install):
                with NODE_INSTALL_LOCK:
                    NODE_INSTALL_JOB["current_pack"] = pack["id"]
                ok, msg = self._install_single_pack(pack, custom_nodes_dir, python_exe, is_wsl=is_wsl, lang=lang)
                if not ok:
                    all_ok = False
                with NODE_INSTALL_LOCK:
                    NODE_INSTALL_JOB["results"][pack["id"]] = {"ok": ok, "message": msg}
                    NODE_INSTALL_JOB["completed"] = idx + 1

            with NODE_INSTALL_LOCK:
                NODE_INSTALL_JOB["current_pack"] = ""
                NODE_INSTALL_JOB["status"] = "done" if all_ok else "error"
                if not all_ok:
                    NODE_INSTALL_JOB["error"] = (
                        "At least one pack could not be installed completely."
                        if en else
                        "Mindestens ein Pack konnte nicht vollständig installiert werden."
                    )

        threading.Thread(target=worker, daemon=True).start()
        self.send_json({"status": "started", "total": len(packs_to_install), "custom_nodes_dir": custom_nodes_dir})

    def handle_launch_comfy(self, post_body: bytes = b""):
        cfg = load_config()
        cmd = cfg.get("comfy_launch_cmd", DEFAULT_LAUNCH_CMD).strip()
        if not cmd and post_body:
            try:
                body = json.loads(post_body.decode("utf-8"))
                cand_cmd = str(body.get("comfy_launch_cmd", "")).strip()
                if cand_cmd:
                    cmd = _validate_launch_command(cand_cmd)
                    save_config({"comfy_launch_cmd": cmd})
            except ValueError as ve:
                self.send_json({"error": str(ve)}, status=400)
                return
            except Exception:
                pass
        if not cmd:
            self.send_json(
                {
                    "code": "NO_LAUNCH_CMD",
                    "error": "Kein ComfyUI Start-Befehl konfiguriert. Bitte trage in den Einstellungen (⚙️) den Pfad zu deiner eigenen Windows-.bat (z. B. run_nvidia_gpu.bat) oder deinem Start-Befehl ein."
                },
                status=400,
            )
            return

        try:
            cmd = _validate_launch_command(cmd)
        except ValueError as ve:
            self.send_json({"error": str(ve)}, status=400)
            return

        try:
            wt_used = False
            is_wsl = cmd.startswith("wsl") or "~/" in cmd or ".sh" in cmd

            if is_wsl and sys.platform == "win32" and not self._is_wsl_configured():
                self.send_json(
                    {
                        "error": "WSL ist auf diesem PC nicht eingerichtet. Bitte trage in den Einstellungen (⚙️) stattdessen den Pfad zu deiner Windows-.bat (z. B. run_nvidia_gpu.bat) ein."
                    },
                    status=400,
                )
                return

            # Prepare WSL login invocation if target is WSL
            wsl_argv: list[str] = []
            if is_wsl:
                clean_subcmd = cmd
                if clean_subcmd.startswith("wsl"):
                    clean_subcmd = clean_subcmd[3:].strip()
                if clean_subcmd.startswith("bash"):
                    clean_subcmd = clean_subcmd[4:].strip()
                if not clean_subcmd:
                    self.send_json({"error": "Unvollständiger WSL-Start-Befehl. Bitte Skriptpfad angeben."}, status=400)
                    return
                if any(ch in clean_subcmd for ch in ("$", "(", ")")):
                    self.send_json(
                        {"error": "Ungültige Zeichen im WSL-Start-Befehl ($ und Klammern sind nicht erlaubt)."},
                        status=400,
                    )
                    return

                # -l (login): sources /etc/profile and ~/.bashrc (ensuring conda base and lm-studio path are active).
                # Do NOT use -i (interactive monitor mode) on script execution, as job-control conflicts with setsid in cei1-dev.sh.
                wsl_argv = ["wsl", "--cd", "~", "bash", "-l", "-c", clean_subcmd]

            launch_env = os.environ.copy()
            studio_cloud_keys = get_cloud_api_keys(cfg)
            for env_var, val in studio_cloud_keys.items():
                if val:
                    launch_env[env_var] = val
            if is_wsl and studio_cloud_keys:
                existing_wslenv = launch_env.get("WSLENV", "")
                wsl_parts = [p for p in existing_wslenv.split(":") if p]
                for env_var in studio_cloud_keys:
                    if env_var not in wsl_parts and f"{env_var}/u" not in wsl_parts:
                        wsl_parts.append(env_var)
                launch_env["WSLENV"] = ":".join(wsl_parts)

            # Launch in Windows Terminal or classic fallback without shell=True
            if sys.platform == "win32":
                wt_exe = shutil.which("wt") or shutil.which("wt.exe")
                if not wt_exe:
                    local_app_data = os.environ.get("LOCALAPPDATA", "")
                    cand = os.path.join(local_app_data, "Microsoft", "WindowsApps", "wt.exe")
                    if os.path.isfile(cand):
                        wt_exe = cand

                if wt_exe:
                    wt_used = True
                    profile = get_wt_wsl_profile() if is_wsl else None
                    if is_wsl:
                        argv = [wt_exe, "-w", "0", "new-tab"]
                        if profile:
                            argv.extend(["-p", profile])
                        argv.extend(["--title", "ComfyUI (WSL)"])
                        argv.extend(wsl_argv)
                    else:
                        unquoted = cmd.strip().strip('"')
                        if unquoted.lower().endswith((".bat", ".cmd")):
                            argv = [wt_exe, "-w", "0", "new-tab", "--title", "ComfyUI", "cmd.exe", "/k", unquoted]
                        else:
                            parts = [p.strip('"') for p in shlex.split(cmd, posix=False) if p.strip('"')]
                            if not parts:
                                self.send_json({"error": "Ungültiger Start-Befehl."}, status=400)
                                return
                            argv = [wt_exe, "-w", "0", "new-tab", "--title", "ComfyUI", *parts]
                    subprocess.Popen(argv, env=launch_env)
                else:
                    # Fallback to classic console
                    new_console = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
                    if is_wsl:
                        subprocess.Popen(wsl_argv, env=launch_env, creationflags=new_console)
                    else:
                        unquoted = cmd.strip().strip('"')
                        if unquoted.lower().endswith((".bat", ".cmd")):
                            subprocess.Popen(["cmd.exe", "/k", unquoted], env=launch_env, creationflags=new_console)
                        else:
                            parts = [p.strip('"') for p in shlex.split(cmd, posix=False) if p.strip('"')]
                            if not parts:
                                self.send_json({"error": "Ungültiger Start-Befehl."}, status=400)
                                return
                            subprocess.Popen(["cmd.exe", "/k", *parts], env=launch_env, creationflags=new_console)
            else:
                parts = shlex.split(cmd, posix=True)
                if not parts:
                    self.send_json({"error": "Ungültiger Start-Befehl."}, status=400)
                    return
                subprocess.Popen(parts, env=launch_env)

            self.send_json({"status": "launched", "command": cmd, "terminal": "wt" if wt_used else "classic"})
        except Exception as e:
            self.send_json({"error": f"Fehler beim Starten: {e}"}, status=500)

    def handle_output_file(self, filename: str):
        out_dir = get_output_dir()
        rel = urllib.parse.unquote(filename).lstrip("/\\").replace("/", os.sep)
        filepath = os.path.normpath(os.path.join(out_dir, rel))
        if not _is_path_within(out_dir, filepath) or not os.path.isfile(filepath):
            self.send_response(404)
            self.end_headers()
            return

        content_type = "image/png"
        if filepath.lower().endswith(".jpg") or filepath.lower().endswith(".jpeg"):
            content_type = "image/jpeg"
        elif filepath.lower().endswith(".webp"):
            content_type = "image/webp"

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache")
        self._send_cors_origin_header()
        self.send_header("Content-Length", str(os.path.getsize(filepath)))
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def handle_history(self):
        """Scans OUTPUT_DIR recursively for recently generated PNG, JPG, and WEBP files with prompt metadata."""
        out_dir = get_output_dir()
        files = scan_output_images(out_dir)
        top_files = []
        for mtime, rel_path, fullpath in files[:50]:
            meta = extract_image_metadata(fullpath)
            top_files.append({
                "filename": rel_path,
                "url": f"/output/{urllib.parse.quote(rel_path, safe='/')}?t={int(mtime * 1000)}",
                "mtime": mtime,
                "prompt": meta.get("positive_prompt", ""),
                "additional_prompt": meta.get("additional_prompt", ""),
                "neg_prompt": meta.get("negative_prompt", ""),
                "seed": meta.get("seed"),
                "model": meta.get("model", ""),
            })
        self.send_json({"files": top_files, "output_dir": out_dir})

    def forward_to_comfy(self, method: str, target_path: str, query: str, body: bytes | None):
        """Forwards request to ComfyUI without Origin header to prevent ComfyUI 403 Forbidden."""
        try:
            comfy_base = _validate_http_url(COMFY_URL, "comfy_url")
            if not comfy_base:
                raise ValueError("ComfyUI-URL ist nicht konfiguriert.")
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=400)
            return

        clean_target = target_path.lstrip("/")
        first_seg = clean_target.split("/", 1)[0]
        if clean_target.startswith("/") or "://" in clean_target or "@" in first_seg:
            self.send_json({"error": "Ungültiger Proxy-Zielpfad."}, status=400)
            return

        target_url = f"{comfy_base.rstrip('/')}/{clean_target}"
        if query:
            target_url += f"?{query}"

        comfy_netloc = urllib.parse.urlparse(comfy_base).netloc
        headers = {
            "User-Agent": "tA-StudioCockpit",
            "Host": comfy_netloc,
        }
        content_type = self.headers.get("Content-Type")
        if content_type:
            headers["Content-Type"] = content_type

        try:
            req = urllib.request.Request(target_url, data=body, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                self.send_response(resp.status)
                for header, val in resp.getheaders():
                    if header.lower() not in ("server", "date", "transfer-encoding", "content-length"):
                        self.send_header(header, val)
                self._send_cors_origin_header()
                data = resp.read()
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as err:
            self.send_response(err.code)
            self.send_header("Content-Type", "application/json")
            self._send_cors_origin_header()
            self.end_headers()
            self.wfile.write(err.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self._send_cors_origin_header()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_status(self):
        online = False
        gpu_info = "RTX 3090"
        vram_free = "21.4"

        try:
            req = urllib.request.Request(
                f"{COMFY_URL}/system_stats",
                headers={"User-Agent": "tA-StudioCockpit", "Host": urllib.parse.urlparse(COMFY_URL).netloc}
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                if resp.status == 200:
                    online = True
                    data = json.loads(resp.read().decode("utf-8"))
                    devices = data.get("devices", [])
                    if devices:
                        gpu = devices[0]
                        gpu_info = gpu.get("name", "NVIDIA GPU")
                        vram_free = f"{gpu.get('vram_free', 0) / (1024**3):.1f}"
        except Exception:
            online = False

        resp_data = {
            "online": online,
            "comfy_url": COMFY_URL,
            "output_dir": OUTPUT_DIR,
            "gpu": gpu_info,
            "vram_free": vram_free,
        }
        self.send_json(resp_data)

    def handle_hw_monitor(self):
        self.send_json(_collect_hw_monitor())

    def handle_free_vram(self):
        ok = False
        error_msg = ""
        try:
            payload = json.dumps({"unload_models": True, "free_memory": True}).encode("utf-8")
            req = urllib.request.Request(
                f"{COMFY_URL}/free",
                data=payload,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "tA-StudioCockpit",
                    "Host": urllib.parse.urlparse(COMFY_URL).netloc,
                },
            )
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                ok = 200 <= resp.status < 300
        except Exception as e:
            error_msg = str(e)

        stats = _collect_hw_monitor()
        stats["free_vram_ok"] = ok
        if error_msg:
            stats["free_vram_error"] = error_msg
        self.send_json(stats)


_HW_LOCK = threading.Lock()
_CPU_PREV_TIMES = None
_NVSMI_CACHE = {"ts": 0.0, "data": None}


def _is_local_comfy_url(url: str) -> bool:
    try:
        host = (urllib.parse.urlparse(url).hostname or "").lower()
        return host in ("127.0.0.1", "localhost", "0.0.0.0", "::1")
    except Exception:
        return False


def _get_windows_ram():
    """Return (ram_total_bytes, ram_free_bytes) on Windows via GlobalMemoryStatusEx."""
    if sys.platform != "win32":
        return None, None
    try:
        class _MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = _MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(_MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
            return int(stat.ullTotalPhys), int(stat.ullAvailPhys)
    except Exception:
        pass
    return None, None


def _get_windows_cpu_percent():
    """Return system-wide CPU utilization percent on Windows via GetSystemTimes delta."""
    global _CPU_PREV_TIMES
    if sys.platform != "win32":
        return None
    try:
        class _FILETIME(ctypes.Structure):
            _fields_ = [("dwLowDateTime", ctypes.c_ulong), ("dwHighDateTime", ctypes.c_ulong)]

        def _ft_to_int(ft):
            return (ft.dwHighDateTime << 32) | ft.dwLowDateTime

        idle_ft, kernel_ft, user_ft = _FILETIME(), _FILETIME(), _FILETIME()
        if not ctypes.windll.kernel32.GetSystemTimes(
            ctypes.byref(idle_ft), ctypes.byref(kernel_ft), ctypes.byref(user_ft)
        ):
            return None

        cur = (_ft_to_int(idle_ft), _ft_to_int(kernel_ft), _ft_to_int(user_ft))
        with _HW_LOCK:
            prev = _CPU_PREV_TIMES
            _CPU_PREV_TIMES = cur

        if prev is None:
            return None

        d_idle = cur[0] - prev[0]
        d_total = (cur[1] - prev[1]) + (cur[2] - prev[2])
        if d_total <= 0:
            return None
        pct = max(0.0, min(100.0, (1.0 - (d_idle / d_total)) * 100.0))
        return round(pct, 1)
    except Exception:
        return None


def _parse_float_safe(val: str):
    try:
        s = val.strip()
        if not s or s.startswith("["):
            return None
        return float(s)
    except Exception:
        return None


def _get_nvidia_smi_stats():
    """Query local NVIDIA GPU telemetry via nvidia-smi with a short 1.5s cache."""
    now = time.monotonic()
    with _HW_LOCK:
        if _NVSMI_CACHE["data"] is not None and (now - _NVSMI_CACHE["ts"]) < 1.5:
            return _NVSMI_CACHE["data"]

    result = None
    try:
        proc = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw,power.limit",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=2.0,
            creationflags=_NO_WINDOW_FLAGS,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            first_line = proc.stdout.strip().splitlines()[0]
            parts = [p.strip() for p in first_line.split(",")]
            if len(parts) >= 8:
                result = {
                    "name": parts[0],
                    "vram_total_mib": _parse_float_safe(parts[1]),
                    "vram_used_mib": _parse_float_safe(parts[2]),
                    "vram_free_mib": _parse_float_safe(parts[3]),
                    "gpu_util": _parse_float_safe(parts[4]),
                    "gpu_temp": _parse_float_safe(parts[5]),
                    "gpu_power_w": _parse_float_safe(parts[6]),
                    "gpu_power_limit_w": _parse_float_safe(parts[7]),
                }
    except Exception:
        result = None

    with _HW_LOCK:
        _NVSMI_CACHE["ts"] = time.monotonic()
        _NVSMI_CACHE["data"] = result
    return result


def _collect_hw_monitor() -> dict:
    """Collect combined ComfyUI /system_stats and local GPU/RAM/CPU telemetry."""
    is_local = _is_local_comfy_url(COMFY_URL)
    online = False
    gpu_raw_name = ""
    comfy_vram_total_b = None
    comfy_vram_free_b = None
    comfy_ram_total_b = None
    comfy_ram_free_b = None

    try:
        req = urllib.request.Request(
            f"{COMFY_URL}/system_stats",
            headers={"User-Agent": "tA-StudioCockpit", "Host": urllib.parse.urlparse(COMFY_URL).netloc},
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                online = True
                data = json.loads(resp.read().decode("utf-8"))
                devices = data.get("devices", [])
                if devices:
                    gpu = devices[0]
                    gpu_raw_name = gpu.get("name", "") or ""
                    comfy_vram_total_b = gpu.get("vram_total")
                    comfy_vram_free_b = gpu.get("vram_free")
                sys_info = data.get("system", {})
                comfy_ram_total_b = sys_info.get("ram_total")
                comfy_ram_free_b = sys_info.get("ram_free")
    except Exception:
        online = False

    nvsmi = _get_nvidia_smi_stats() if is_local else None
    local_ram_total_b, local_ram_free_b = _get_windows_ram() if is_local else (None, None)
    cpu_util = _get_windows_cpu_percent() if is_local else None

    gib = 1024 ** 3
    mib_to_gib = 1024.0

    vram_total_gb = None
    vram_free_gb = None
    vram_used_gb = None
    if comfy_vram_total_b is not None and comfy_vram_free_b is not None:
        vram_total_gb = round(comfy_vram_total_b / gib, 2)
        vram_free_gb = round(comfy_vram_free_b / gib, 2)
        vram_used_gb = round(max(0.0, comfy_vram_total_b - comfy_vram_free_b) / gib, 2)
    elif nvsmi and nvsmi.get("vram_total_mib") is not None:
        vram_total_gb = round(nvsmi["vram_total_mib"] / mib_to_gib, 2)
        vram_used_gb = round((nvsmi.get("vram_used_mib") or 0.0) / mib_to_gib, 2)
        vram_free_gb = round((nvsmi.get("vram_free_mib") or 0.0) / mib_to_gib, 2)

    vram_pct = None
    if vram_total_gb and vram_total_gb > 0 and vram_used_gb is not None:
        vram_pct = round(min(100.0, (vram_used_gb / vram_total_gb) * 100.0), 1)

    ram_total_b = local_ram_total_b if local_ram_total_b is not None else comfy_ram_total_b
    ram_free_b = local_ram_free_b if local_ram_free_b is not None else comfy_ram_free_b
    ram_total_gb = round(ram_total_b / gib, 1) if ram_total_b else None
    ram_used_gb = round(max(0.0, ram_total_b - ram_free_b) / gib, 1) if (ram_total_b and ram_free_b is not None) else None
    ram_pct = round(min(100.0, (ram_used_gb / ram_total_gb) * 100.0), 1) if (ram_total_gb and ram_used_gb is not None) else None

    return {
        "online": online,
        "is_local": is_local,
        "gpu": gpu_raw_name or (nvsmi.get("name") if nvsmi else ""),
        "vram_total_gb": vram_total_gb,
        "vram_used_gb": vram_used_gb,
        "vram_free_gb": vram_free_gb,
        "vram_pct": vram_pct,
        "sys_vram_used_gb": round(nvsmi["vram_used_mib"] / mib_to_gib, 2) if (nvsmi and nvsmi.get("vram_used_mib") is not None) else None,
        "ram_total_gb": ram_total_gb,
        "ram_used_gb": ram_used_gb,
        "ram_pct": ram_pct,
        "gpu_util": nvsmi.get("gpu_util") if nvsmi else None,
        "gpu_temp": round(nvsmi["gpu_temp"], 0) if (nvsmi and nvsmi.get("gpu_temp") is not None) else None,
        "gpu_power_w": round(nvsmi["gpu_power_w"], 0) if (nvsmi and nvsmi.get("gpu_power_w") is not None) else None,
        "gpu_power_limit_w": round(nvsmi["gpu_power_limit_w"], 0) if (nvsmi and nvsmi.get("gpu_power_limit_w") is not None) else None,
        "cpu_util": cpu_util,
    }


def run_native_window(url: str, server: socketserver.TCPServer) -> bool:
    try:
        import webview
    except ImportError:
        return False

    try:
        webview.settings["ALLOW_DOWNLOADS"] = True
        webview.settings["OPEN_EXTERNAL_LINKS_IN_BROWSER"] = True

        threading.Thread(target=server.serve_forever, daemon=True).start()

        icon_path = os.path.join(BUNDLE_DIR, "app.ico")
        storage_dir = os.path.join(DATA_ROOT, "data", "webview")
        os.makedirs(storage_dir, exist_ok=True)

        cfg = load_config()
        win_cfg = cfg.get("window") if isinstance(cfg.get("window"), dict) else {}
        try:
            win_w = max(1020, int(win_cfg.get("width", 1400)))
        except (TypeError, ValueError):
            win_w = 1400
        try:
            win_h = max(700, int(win_cfg.get("height", 940)))
        except (TypeError, ValueError):
            win_h = 940

        create_kwargs = {
            "width": win_w,
            "height": win_h,
            "min_size": (1020, 700),
            "background_color": "#0f1117",
        }
        win_x = win_cfg.get("x")
        win_y = win_cfg.get("y")
        if isinstance(win_x, int) and isinstance(win_y, int) and win_x >= -200 and win_y >= -50:
            create_kwargs["x"] = win_x
            create_kwargs["y"] = win_y

        window = webview.create_window(
            "thomo.ART StudioCockpit",
            url,
            **create_kwargs,
        )

        win_state = {"width": win_w, "height": win_h}
        if "x" in create_kwargs and "y" in create_kwargs:
            win_state["x"] = create_kwargs["x"]
            win_state["y"] = create_kwargs["y"]
        save_timer_lock = threading.Lock()
        save_timer: list[threading.Timer | None] = [None]

        def _persist_window_state():
            try:
                save_config({"window": dict(win_state)})
            except Exception:
                pass

        def _schedule_save():
            with save_timer_lock:
                if save_timer[0] is not None:
                    save_timer[0].cancel()
                t = threading.Timer(0.6, _persist_window_state)
                t.daemon = True
                save_timer[0] = t
                t.start()

        def on_resized(w, h):
            if isinstance(w, int) and isinstance(h, int) and w >= 1020 and h >= 700:
                win_state["width"] = w
                win_state["height"] = h
                _schedule_save()

        def on_moved(x, y):
            if isinstance(x, int) and isinstance(y, int) and x >= -200 and y >= -50:
                win_state["x"] = x
                win_state["y"] = y
                _schedule_save()

        def on_closing():
            with save_timer_lock:
                if save_timer[0] is not None:
                    save_timer[0].cancel()
                    save_timer[0] = None
            try:
                if isinstance(window.width, int) and isinstance(window.height, int) and window.width >= 1020 and window.height >= 700:
                    win_state["width"] = window.width
                    win_state["height"] = window.height
                if isinstance(window.x, int) and isinstance(window.y, int) and window.x >= -200 and window.y >= -50:
                    win_state["x"] = window.x
                    win_state["y"] = window.y
            except Exception:
                pass
            _persist_window_state()

        window.events.resized += on_resized
        window.events.moved += on_moved
        window.events.closing += on_closing

        def _on_gif_hotkey():
            try:
                window.evaluate_js("window.openDiscordGifFromHotkey && window.openDiscordGifFromHotkey()")
            except Exception:
                pass

        discord_gif.start_hotkey_listener(_on_gif_hotkey)

        webview.start(
            icon=icon_path if os.path.isfile(icon_path) else None,
            private_mode=False,
            storage_path=storage_dir,
        )
        server.shutdown()
        server.server_close()
        return True
    except Exception as exc:
        print("[pywebview] Hinweis: Desktop-Fenster konnte nicht gestartet werden, wechsle zu Browser:", exc)
        return False


def main():
    global PORT, BIND_HOST
    parser = argparse.ArgumentParser(description="thomo.ART StudioCockpit")
    parser.add_argument("--browser", action="store_true", help="Im Browser öffnen statt pywebview Desktop-Fenster")
    parser.add_argument("--port", type=int, default=PORT, help=f"HTTP-Port (Standard: {PORT})")
    parser.add_argument("--host", default=BIND_HOST, help=f"Bind-Adresse (Standard: {BIND_HOST})")
    args = parser.parse_args()
    PORT = args.port
    BIND_HOST = args.host

    load_config()
    discord_gif.init_module(DATA_ROOT, BUNDLE_DIR, load_config)
    video_maker.init_module(
        DATA_ROOT,
        BUNDLE_DIR,
        load_config,
        get_output_dir,
        lambda field: get_decrypted_api_keys().get("GEMINI_API_KEY", "") if field == "gemini_api_key" else "",
    )
    gallery_indexer.init_module(DATA_ROOT, get_output_dir, extract_image_metadata, load_config)
    music_maker.init_module(DATA_ROOT, BUNDLE_DIR, load_config)

    socketserver.TCPServer.allow_reuse_address = sys.platform != "win32"
    try:
        httpd = http.server.ThreadingHTTPServer((BIND_HOST, PORT), StudioHandler)
    except OSError as exc:
        msg = (
            f"Port {PORT} ist bereits belegt ({exc}).\n"
            "Möglicherweise läuft thomo.ART StudioCockpit bereits."
        )
        print(f"[FEHLER] {msg}")
        if sys.platform == "win32" and getattr(sys, "frozen", False):
            try:
                ctypes.windll.user32.MessageBoxW(
                    0, msg, "thomo.ART StudioCockpit", 0x10
                )
            except Exception:
                pass
        sys.exit(1)

    def _request_app_exit():
        try:
            if "webview" in sys.modules:
                import webview
                if webview.windows:
                    webview.windows[0].destroy()
                    return
        except Exception:
            pass
        try:
            httpd.shutdown()
        except Exception:
            pass
        os._exit(0)

    updater.init_module(APP_VERSION, DATA_ROOT, _request_app_exit)

    display_host = "127.0.0.1" if BIND_HOST in ("", "0.0.0.0", "::") else BIND_HOST
    url = f"http://{display_host}:{PORT}"

    print("=" * 60)
    print(f"  thomo.ART StudioCockpit läuft unter: {url}")
    print(f"  Verbindungsziel ComfyUI:             {COMFY_URL}")
    print(f"  Ausgabeordner:                       {OUTPUT_DIR}")
    print("=" * 60)

    if not args.browser:
        success = run_native_window(url, httpd)
        if success:
            return

    # Fallback to browser
    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")


if __name__ == "__main__":
    main()
