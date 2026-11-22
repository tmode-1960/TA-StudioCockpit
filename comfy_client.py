"""ComfyUI Client and Automated Workflow Converter for thomo.ART StudioCockpit.

Automatically translates the TA-FLEXMOD-LLM v2.89 visual workflow into the
exact ComfyUI API format, injects user UI selections, queues the prompt,
and streams live execution progress over WebSocket.
"""

from __future__ import annotations

import copy
import json
import os
import random
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple

FRONTEND_ONLY_NODES = {
    "MarkdownNote",
    "Note",
    "Markdown Note [Eclipse]",
    "CRZLabel",
}
MODE_BYPASS = 4
MODE_MUTE = 2

KNOWN_LORA_TRIGGERS = {
    "cm_bubblegum_krea2": "cm_bubblegum",
    "cm_oldman_krea2": "cm_oldman",
    "cm_bubblegum_zit": "cm_bubblegum",
    "cm_oldman_zit": "cm_oldman",
    "bubblegum": "cm_bubblegum",
    "oldman": "cm_oldman",
    "horror": "HORROR",
    "wraith": "Wraith_BW",
    "wraith_bw": "Wraith_BW",
}


def _norm_link(link: Any) -> dict:
    if isinstance(link, dict):
        return link
    return {
        "id": link[0],
        "origin_id": link[1],
        "origin_slot": link[2],
        "target_id": link[3],
        "target_slot": link[4],
        "type": link[5] if len(link) > 5 else None,
    }


class _GraphScope:
    def __init__(self, nodes: list[dict], links: list[Any], prefix: str = ""):
        self.prefix = prefix
        self.nodes = {n["id"]: n for n in nodes}
        self.links: dict[int, dict] = {}
        self.target_links: dict[tuple[int, int], dict] = {}
        for link in links:
            nl = _norm_link(link)
            self.links[nl["id"]] = nl
            self.target_links[(nl["target_id"], nl["target_slot"])] = nl


class EclipseWorkflowConverter:
    """Converts a ComfyUI UI-format workflow (such as TA-FLEXMOD-LLM) into an API-format prompt dict."""

    def __init__(self, workflow: dict):
        self.wf = copy.deepcopy(workflow)
        self.top = _GraphScope(self.wf["nodes"], self.wf.get("links", []))
        self.api: dict[str, dict] = {}
        self.overrides: dict[str, dict] = {}
        self.set_registry: dict[str, tuple[_GraphScope, dict]] = {}

    def _build_set_registry(self):
        self.set_registry = {}
        for nid, node in self.top.nodes.items():
            ntype = node.get("type", "")
            if ntype in ("SetNode", "SetNode [Eclipse]"):
                wvals = node.get("widgets_values") or []
                if wvals and isinstance(wvals[0], str):
                    self.set_registry[wvals[0]] = (self.top, node)

    def _key(self, scope: _GraphScope, node: dict) -> str:
        return f"{scope.prefix}{node['id']}"

    def _resolve_var(self, name: str):
        if name not in self.set_registry:
            return None
        set_scope, set_node = self.set_registry[name]
        inputs = set_node.get("inputs", [])
        if not inputs:
            return None
        return self._input_source(set_scope, set_node, inputs[0])

    def _resolve_output(self, scope: _GraphScope, node_id: int, slot: int):
        node = scope.nodes.get(node_id)
        if node is None:
            return None
        mode = node.get("mode", 0)
        if mode == MODE_MUTE:
            return None
        if mode == MODE_BYPASS:
            inputs = node.get("inputs", [])
            return self._input_source(scope, node, inputs[0]) if inputs else None
        ntype = node.get("type", "")
        if ntype in FRONTEND_ONLY_NODES:
            return None
        if ntype in ("Reroute", "SetNode", "SetNode [Eclipse]"):
            inputs = node.get("inputs", [])
            return self._input_source(scope, node, inputs[0]) if inputs else None
        if ntype in ("GetNode", "GetNode [Eclipse]"):
            wvals = node.get("widgets_values") or []
            return self._resolve_var(wvals[0]) if wvals else None
        if ntype == "PrimitiveNode":
            vals = node.get("widgets_values") or []
            return ("value", vals[0]) if vals else None

        self._emit(scope, node)
        return ("link", self._key(scope, node), slot)

    def _input_source(self, scope: _GraphScope, node: dict, inp: dict):
        link_id = inp.get("link")
        if link_id is None:
            return None
        link = scope.links.get(link_id)
        if not link:
            return None
        return self._resolve_output(scope, link["origin_id"], link["origin_slot"])

    def _emit(self, scope: _GraphScope, node: dict) -> None:
        key = self._key(scope, node)
        if key in self.api:
            return
        entry: dict[str, Any] = {"class_type": node["type"], "inputs": {}}
        self.api[key] = entry
        inputs = entry["inputs"]

        # 1. Wire links
        for inp in node.get("inputs", []):
            name = inp["name"]
            # If input is directly overridden with a primitive value, skip wiring links or traversing upstream
            if key in self.overrides and name in self.overrides[key]:
                val = self.overrides[key][name]
                if not (isinstance(val, list) and len(val) == 2 and isinstance(val[0], str)):
                    inputs[name] = val
                    continue
            src = self._input_source(scope, node, inp)
            if src is not None:
                inputs[name] = [src[1], src[2]] if src[0] == "link" else src[1]

        # 2. Extract widget inputs (ONLY if not already linked!)
        IGNORED_WIDGET_KEYS = {
            "control_after_generate",
            "__lm_autocomplete_meta_text",
            "discord_widget",
            "✏️ Model Preset Editor öffnen",
            "✏️ Preset Editor öffnen",
            "🎲 Manual Random Seed",
            "rgthree_comparer",
            "llm_status",
            "loras",  # Frontend stack widget on LoRA Manager; loader operates purely on 'text'
        }

        w_named = node.get("widgets_values_named")
        if isinstance(w_named, dict):
            for wname, wval in w_named.items():
                if wname in IGNORED_WIDGET_KEYS:
                    continue
                # Do NOT overwrite a wire-linked input
                if wname not in inputs:
                    inputs[wname] = wval
        else:
            w_vals = node.get("widgets_values")
            if isinstance(w_vals, dict):
                for wname, wval in w_vals.items():
                    if wname not in IGNORED_WIDGET_KEYS and wname not in inputs:
                        inputs[wname] = wval
            elif isinstance(w_vals, list):
                inp_widgets = [i["name"] for i in node.get("inputs", []) if "widget" in i]
                for idx_w, wname in enumerate(inp_widgets):
                    if idx_w < len(w_vals) and wname not in inputs:
                        inputs[wname] = w_vals[idx_w]

        # 3. Apply custom overrides
        if key in self.overrides:
            inputs.update(self.overrides[key])

    def convert(self, outputs: list[int], overrides: dict[str, dict] | None = None) -> dict:
        self.api = {}
        self.overrides = overrides or {}
        self._build_set_registry()
        for node_id in outputs:
            if node_id in self.top.nodes:
                self._emit(self.top, self.top.nodes[node_id])
        return self.api


class ComfyClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8188", client_id: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id or str(uuid.uuid4())

    def check_online(self, retries: int = 3, timeout: float = 3.5) -> bool:
        for attempt in range(retries):
            try:
                req = urllib.request.Request(f"{self.base_url}/system_stats", headers={"User-Agent": "tA-StudioCockpit"})
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    if resp.status == 200:
                        return True
            except Exception:
                if attempt < retries - 1:
                    time.sleep(1.0)
        return False

    def queue_prompt(self, prompt: dict, workflow: dict | None = None) -> str:
        payload: dict[str, Any] = {"prompt": prompt, "client_id": self.client_id}
        if workflow is not None:
            payload["extra_data"] = {"extra_pnginfo": {"workflow": workflow}}
        else:
            payload["extra_data"] = {"extra_pnginfo": {"workflow": {}}}
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/prompt",
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "tA-StudioCockpit"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                return res.get("prompt_id", "")
        except urllib.error.HTTPError as he:
            body_txt = ""
            try:
                body_txt = he.read().decode("utf-8", errors="replace")
                err_json = json.loads(body_txt)
                err_obj = err_json.get("error")
                msg = err_obj.get("message", "") if isinstance(err_obj, dict) else str(err_obj or "")
                node_errs = err_json.get("node_errors") or {}
                if isinstance(node_errs, dict) and node_errs:
                    details = []
                    for nid, nerr in node_errs.items():
                        ctype = nerr.get("class_type", "")
                        for e in nerr.get("errors", []):
                            em = e.get("message") or e.get("details") or ""
                            if em:
                                details.append(f"Node {nid} ({ctype}): {em}")
                    if details:
                        msg = (f"{msg} — " if msg else "") + "; ".join(details[:5])
                if msg:
                    raise RuntimeError(msg) from he
            except RuntimeError:
                raise
            except Exception:
                pass
            raise RuntimeError(f"HTTP {he.code}: {body_txt or he.reason}") from he

    def interrupt(self) -> bool:
        """Interrupts currently executing prompt in ComfyUI."""
        try:
            req = urllib.request.Request(f"{self.base_url}/interrupt", data=b"", method="POST")
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                return resp.status == 200
        except Exception:
            return False

    def clear_queue(self) -> bool:
        """Clears pending prompt queue in ComfyUI."""
        try:
            req = urllib.request.Request(
                f"{self.base_url}/queue",
                data=json.dumps({"clear": True}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                return resp.status == 200
        except Exception:
            return False

    def get_history(self, prompt_id: str, timeout: float = 60.0) -> dict:
        start_t = time.time()
        while time.time() - start_t < timeout:
            try:
                req = urllib.request.Request(f"{self.base_url}/history/{prompt_id}")
                with urllib.request.urlopen(req, timeout=3.0) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        if prompt_id in data:
                            return data[prompt_id]
            except Exception:
                pass
            time.sleep(1.0)
        return {}


def build_flexmod_api_prompt(
    wf_path: str,
    model_preset: str,
    sampler_preset: str,
    prompt: str,
    additional_prompt: str = "",
    neg_prompt: str = "",
    width: int = 1920,
    height: int = 1088,
    aspect_ratio: str = "16:9",
    snap: int = 16,
    batch_size: int = 1,
    smart_llm: bool | None = None,
    llm_mode: str = "off",
    llm_model: str = "",
    llm_system_prompt: str = "",
    llm_user_prompt: str = "",
    llm_temperature: float | None = None,
    llm_max_tokens: int | None = None,
    llm_request_timeout: int | None = None,
    llm_thinking_mode: bool = False,
    llm_unload_image_models_first: bool = True,
    llm_unload_llm_after: bool = True,
    llm_controller_mode: str = "Generated Only",
    prompt_controller_mode: str = "",
    delimiter: str = ", ",
    i2i_image: str = "",
    seed: int = 0,
    flux_guidance: float = 3.5,
    sharpen_enabled: bool = True,
    sharpen: float = 0.26,
    sve_enabled: bool = False,
    sve_auto: bool = True,
    sve_strength: float = 25.0,
    sve_randomize_percent: float = 60.0,
    sve_noise_insert: str = "noise on beginning steps",
    sve_steps_switchover_percent: float = 20.0,
    sve_mask_starts_at: str = "beginning",
    sve_mask_percent: float = 0.0,
    film_grain_enabled: bool = False,
    film_grain_gray_scale: bool = False,
    film_grain_type: str = "Fine",
    film_grain_sat: float = 0.15,
    film_grain_power: float = 0.40,
    film_grain_shadows: float = 0.20,
    film_grain_highs: float = 0.20,
    film_grain_scale: float = 0.65,
    film_grain_sharpen: int = 0,
    film_grain_src_gamma: float = 1.0,
    use_seed_vr2: bool = False,
    seedvr2_model: str = "seedvr2_ema_7b_fp16.safetensors",
    seedvr2_resolution: int = 3840,
    seedvr2_max_resolution: int = 3840,
    seedvr2_color_correction: str = "lab",
    seedvr2_blocks_to_swap: int = 15,
    seedvr2_attention_mode: str = "sageattn_2",
    seedvr2_input_noise_scale: float = 0.0,
    seedvr2_latent_noise_scale: float = 0.0,
    seedvr2_tiled: bool = True,
    seedvr2_cache_model: bool = False,
    save_format: str = "webp",
    save_txt_main: bool = True,
    extra_save_enabled: bool = False,
    extra_save_format: str = "webp",
    extra_save_quality: str = "95",
    extra_save_txt: bool = False,
    fn_output_folder: str = "",
    fn_subfolder: str = "",
    fn_extra_subfolder: str = "JPEG",
    fn_name_prefix: str = "",
    fn_wf_version: str = "TA-FLEXMOD",
    fn_upscaled_suffix: str = "UPSCALED",
    fn_delimiter: str = "-",
    fn_date_format: str = "%Y%m%d%H%M",
    overlay_ai_enabled: bool = False,
    overlay_ai_text: str = "Created with AI '26",
    overlay_ai_font: str = "Caveat-VariableFont_wght.ttf",
    overlay_ai_size: int = 14,
    overlay_ai_color: str = "white",
    overlay_ai_align: str = "bottom",
    overlay_ai_justify: str = "left",
    overlay_ai_pos_x: int = 10,
    overlay_ai_pos_y: int = -15,
    overlay_ai_rotation: float = 0.0,
    overlay_ai_margins: int = 0,
    overlay_sig_enabled: bool = True,
    overlay_sig_text: str = "thomo.ART",
    overlay_sig_font: str = "Caveat-VariableFont_wght.ttf",
    overlay_sig_size: int = 14,
    overlay_sig_color: str = "white",
    overlay_sig_align: str = "bottom",
    overlay_sig_justify: str = "right",
    overlay_sig_pos_x: int = -15,
    overlay_sig_pos_y: int = -15,
    overlay_sig_rotation: float = 0.0,
    overlay_sig_margins: int = 0,
    overlay_img_enabled: bool = False,
    overlay_img_file: str = "",
    overlay_img_pos_x: int = 0,
    overlay_img_pos_y: int = 0,
    overlay_img_scale: float = 1.0,
    overlay_img_opacity: float = 100.0,
    overlay_img_rotation: float = 0.0,
    sage_enable: bool = False,
    torch_enable: bool = False,
    sage_mode: str = "sageattn_qk_int8_pv_fp16_cuda",
    kitchen_enable: bool = True,
    loras: list[dict] | None = None,
    sampler_cfg: float | None = None,
) -> dict:
    with open(wf_path, "r", encoding="utf-8") as f:
        wf = json.load(f)

    if not sharpen_enabled:
        for n in wf.get("nodes", []):
            if n.get("id") == 2122:
                n["mode"] = MODE_BYPASS

    if smart_llm is True and llm_mode == "off":
        llm_mode = "t2i"

    is_t2i = (llm_mode == "t2i")
    is_i2i = (llm_mode == "i2i")

    # Determine final Prompt Controller mode
    final_ctrl_mode = prompt_controller_mode or llm_controller_mode or ("Generated Only" if (is_t2i or is_i2i) else "Manual Only")

    # Auto-calibrated SeedVarianceEnhancer defaults per model architecture
    mp_low = (model_preset or "").lower()
    if sve_auto:
        if "zimage" in mp_low or "z-image" in mp_low or "zit" in mp_low or "wan" in mp_low:
            eff_sve_strength = 25.0
            eff_sve_rand = 60.0
            eff_sve_switch = 20.0
        elif "krea" in mp_low:
            eff_sve_strength = 0.35
            eff_sve_rand = 50.0
            eff_sve_switch = 15.0
        elif "moss" in mp_low or "kromoss" in mp_low:
            eff_sve_strength = 0.45
            eff_sve_rand = 50.0
            eff_sve_switch = 15.0
        elif "flux" in mp_low:
            eff_sve_strength = 0.30
            eff_sve_rand = 50.0
            eff_sve_switch = 20.0
        elif "qwen" in mp_low:
            eff_sve_strength = 0.50
            eff_sve_rand = 50.0
            eff_sve_switch = 20.0
        elif "minimax" in mp_low:
            eff_sve_strength = 0.25
            eff_sve_rand = 40.0
            eff_sve_switch = 35.0
        else:
            eff_sve_strength = 0.40
            eff_sve_rand = 50.0
            eff_sve_switch = 20.0
    else:
        eff_sve_strength = float(sve_strength)
        eff_sve_rand = float(sve_randomize_percent)
        eff_sve_switch = float(sve_steps_switchover_percent)

    # Output nodes:
    # 1229 (main save with prompt .txt)
    # 1619 (optional secondary save: webp / jpg with optional .txt)
    # 1597 (SeedVR2 upscaled main save)
    # 1620 (SeedVR2 upscaled secondary save)
    output_ids = [1229]
    if extra_save_enabled:
        output_ids.append(1619)
    if use_seed_vr2:
        output_ids.append(1597)
        if extra_save_enabled:
            output_ids.append(1620)

    # Normalize sampler_preset against ComfyUI TASamplerPreset enum values
    VALID_SAMPLER_PRESETS = [
        "Z-Image Turbo",
        "Qwen-Image 2.1",
        "Qwen-Image 2.1 Turbo",
        "Krea2-Turbo",
        "FLUX3-Klein-Image",
        "MOSS-Image SFT",
        "MOSS-Image 8 Step",
        "FLUX1-DEV-FP8",
        "Minimax H3 Image",
    ]
    norm_sampler = sampler_preset.lower().replace("-", "").replace(" ", "").replace("_", "")
    for v in VALID_SAMPLER_PRESETS:
        if v.lower().replace("-", "").replace(" ", "").replace("_", "") == norm_sampler:
            sampler_preset = v
            break

    # Negative Conditioning switch (node 2130 LazySwitchKJ):
    # Skip CLIPTextEncode negative (node 1869) automatically when CFG <= 1.0
    use_negative_conditioning = (float(sampler_cfg) > 1.0) if (sampler_cfg is not None) else True

    # Build node overrides
    overrides: dict[str, dict] = {
        # Model Preset (node 2079)
        "2079": {"preset": model_preset},
        # Sampler Preset (node 2108)
        "2108": {"preset": sampler_preset},
        # Negative Conditioning? (node 2130 LazySwitchKJ)
        "2130": {"switch": bool(use_negative_conditioning)},
        # Smart LLM (node 1878: Text2Prompt)
        "1878": {
            "llm_enable": is_t2i,
            "thinking_mode": bool(llm_thinking_mode),
            "unload_image_models_first": bool(llm_unload_image_models_first),
            "unload_llm_after": bool(llm_unload_llm_after),
            **({"model": llm_model} if (is_t2i and llm_model) else {}),
            **({"system_prompt": llm_system_prompt} if (is_t2i and llm_system_prompt and llm_system_prompt.strip()) else {}),
            **({"temperature": float(llm_temperature)} if (is_t2i and llm_temperature is not None) else {}),
            **({"max_tokens": int(llm_max_tokens)} if (is_t2i and llm_max_tokens is not None) else {}),
            **({"request_timeout": int(llm_request_timeout)} if (is_t2i and llm_request_timeout is not None) else {}),
        },
        # Smart LLM (node 1879: Image2Prompt)
        "1879": {
            "llm_enable": is_i2i,
            "thinking_mode": bool(llm_thinking_mode),
            "unload_image_models_first": bool(llm_unload_image_models_first),
            "unload_llm_after": bool(llm_unload_llm_after),
            **({"model": llm_model} if (is_i2i and llm_model) else {}),
            **({"user_prompt": llm_user_prompt} if (is_i2i and llm_user_prompt and llm_user_prompt.strip()) else {}),
            **({"system_prompt": llm_system_prompt} if (is_i2i and llm_system_prompt and llm_system_prompt.strip()) else {}),
            **({"temperature": float(llm_temperature)} if (is_i2i and llm_temperature is not None) else {}),
            **({"max_tokens": int(llm_max_tokens)} if (is_i2i and llm_max_tokens is not None) else {}),
            **({"request_timeout": int(llm_request_timeout)} if (is_i2i and llm_request_timeout is not None) else {}),
        },
        # TAPromptController (node 1118)
        "1118": {
            "mode": final_ctrl_mode,
            "delimiter": delimiter if delimiter is not None else ", ",
        },
        # Resolution (node 2120) and Latent Generator (node 2121)
        "2120": {
            "ResolutionState": json.dumps({
                "mode": "preset",
                "ratio": aspect_ratio,
                "w": int(width),
                "h": int(height),
                "custom_w": int(width),
                "custom_h": int(height),
                "custom_ratio_w": 16,
                "custom_ratio_h": 9,
                "snap": int(snap),
                "batch": int(batch_size),
            }),
            "resolution_ui": {
                "mode": "preset",
                "ratio": aspect_ratio,
                "w": int(width),
                "h": int(height),
                "custom_w": int(width),
                "custom_h": int(height),
                "custom_ratio_w": 16,
                "custom_ratio_h": 9,
                "snap": int(snap),
                "batch": int(batch_size),
            }
        },
        "2121": {
            "width": int(width),
            "height": int(height),
            "batch_size": int(batch_size),
        },
        # Seed (node 1204)
        "1204": {"seed": seed},
        # TA SageAttention Toggler (node 1912)
        "1912": {
            "sage_enable": bool(sage_enable),
            "torch_enable": bool(torch_enable),
            "sage_mode": sage_mode,
            "kitchen_enable": bool(kitchen_enable),
        },
        # Flux Guidance Gate (node 2109)
        "2109": {"guidance": flux_guidance},
        # SeedVarianceEnhancer (nodes 1995 LazySwitchKJ & 1241 SeedVarianceEnhancer)
        "1995": {"switch": bool(sve_enabled)},
        "1241": {
            "randomize_percent": eff_sve_rand,
            "strength": eff_sve_strength,
            "noise_insert": str(sve_noise_insert or "noise on beginning steps"),
            "steps_switchover_percent": eff_sve_switch,
            "seed": int(seed),
            "mask_starts_at": str(sve_mask_starts_at or "beginning"),
            "mask_percent": float(sve_mask_percent),
        },
        # Fast Laplacian Sharpen (node 2122)
        "2122": {"strength": sharpen if sharpen_enabled else 0.0, "use_gpu": True},
        # ProPostFilmGrain (nodes 1980 LazySwitchKJ & 1983 ProPostFilmGrain)
        "1980": {"switch": bool(film_grain_enabled)},
        "1983": {
            "gray_scale": bool(film_grain_gray_scale),
            "grain_type": str(film_grain_type or "Fine"),
            "grain_sat": float(film_grain_sat),
            "grain_power": float(film_grain_power),
            "shadows": float(film_grain_shadows),
            "highs": float(film_grain_highs),
            "scale": float(film_grain_scale),
            "sharpen": int(film_grain_sharpen),
            "src_gamma": float(film_grain_src_gamma),
        },
        # SeedVR2 Gate (node 2023) & Detail Nodes (1592, 1593, 1595)
        "2023": {"enabled": bool(use_seed_vr2)},
        "1592": {
            "encode_tiled": bool(seedvr2_tiled),
            "decode_tiled": bool(seedvr2_tiled),
            "cache_model": bool(seedvr2_cache_model),
        },
        "1593": {
            "model": str(seedvr2_model or "seedvr2_ema_7b_fp16.safetensors"),
            "blocks_to_swap": int(seedvr2_blocks_to_swap),
            "attention_mode": str(seedvr2_attention_mode or "sageattn_2"),
            "cache_model": bool(seedvr2_cache_model),
        },
        "1595": {
            "resolution": int(seedvr2_resolution),
            "max_resolution": int(seedvr2_max_resolution),
            "color_correction": str(seedvr2_color_correction or "lab"),
            "input_noise_scale": float(seedvr2_input_noise_scale),
            "latent_noise_scale": float(seedvr2_latent_noise_scale),
        },
        # CR Overlay Text 1 / LazySwitchKJ (nodes 1981 & 1978: KI-Wasserzeichen)
        "1981": {"switch": bool(overlay_ai_enabled)},
        "1978": {
            "text": overlay_ai_text,
            "font_name": overlay_ai_font,
            "font_size": int(overlay_ai_size),
            "font_color": overlay_ai_color,
            "align": overlay_ai_align,
            "justify": overlay_ai_justify,
            "position_x": int(overlay_ai_pos_x),
            "position_y": int(overlay_ai_pos_y),
            "rotation_angle": float(overlay_ai_rotation),
            "margins": int(overlay_ai_margins),
        },
        # CR Overlay Text 2 / LazySwitchKJ (nodes 1982 & 1979: Signatur)
        "1982": {"switch": bool(overlay_sig_enabled)},
        "1979": {
            "text": overlay_sig_text,
            "font_name": overlay_sig_font,
            "font_size": int(overlay_sig_size),
            "font_color": overlay_sig_color,
            "align": overlay_sig_align,
            "justify": overlay_sig_justify,
            "position_x": int(overlay_sig_pos_x),
            "position_y": int(overlay_sig_pos_y),
            "rotation_angle": float(overlay_sig_rotation),
            "margins": int(overlay_sig_margins),
        },
        # CR Overlay Transparent Image / LazySwitchKJ (nodes 2131, 2133 & 2134: Bild-Logo)
        **(
            {
                "2134": {"switch": True},
                "2131": {"image": str(overlay_img_file)},
                "2133": {
                    "transparency": round(max(0.0, min(1.0, 1.0 - float(overlay_img_opacity) / 100.0)), 3),
                    "offset_x": int(overlay_img_pos_x),
                    "offset_y": int(overlay_img_pos_y),
                    "rotation_angle": float(overlay_img_rotation),
                    "overlay_scale_factor": float(overlay_img_scale),
                },
            }
            if (overlay_img_enabled and overlay_img_file)
            else {}
        ),
        # Main Save with Prompt Text (node 1229)
        "1229": {
            "save_txt": "enabled" if save_txt_main else "disabled",
        },
        # Optional Save (node 1619 & 1620)
        "1619": {
            "enabled": bool(extra_save_enabled),
            "save_format": extra_save_format,
            "jpeg_quality": str(extra_save_quality),
            "save_txt": "enabled" if extra_save_txt else "disabled",
        },
        "1620": {
            "enabled": bool(extra_save_enabled and use_seed_vr2),
            "save_format": extra_save_format,
            "jpeg_quality": str(extra_save_quality),
            "save_txt": "enabled" if extra_save_txt else "disabled",
        },
        # Filename Generators (1216 = main PNG, 2041 = extra copy, 1583 = extra copy upscaled)
        "1216": {
            "output_folder": str(fn_output_folder),
            "subfolder": str(fn_subfolder),
            "name_prefix": str(fn_name_prefix),
            "wf_version": str(fn_wf_version),
            "upscaled_suffix": str(fn_upscaled_suffix),
            "delimiter": str(fn_delimiter),
            "date_format": str(fn_date_format),
        },
        "2041": {
            "output_folder": str(fn_output_folder),
            "subfolder": str(fn_extra_subfolder),
            "name_prefix": str(fn_name_prefix),
            "wf_version": str(fn_wf_version),
            "upscaled_suffix": str(fn_upscaled_suffix),
            "delimiter": str(fn_delimiter),
            "date_format": str(fn_date_format),
        },
        "1583": {
            "output_folder": str(fn_output_folder),
            "subfolder": str(fn_extra_subfolder),
            "name_prefix": str(fn_name_prefix),
            "wf_version": str(fn_wf_version),
            "upscaled_suffix": str(fn_upscaled_suffix),
            "delimiter": str(fn_delimiter),
            "date_format": str(fn_date_format),
        },
    }

    if is_i2i and i2i_image:
        overrides["1880"] = {"image": i2i_image}

    KNOWN_LORA_TRIGGERS = {
        "cm_bubblegum_krea2": "cm_bubblegum",
        "cm_oldman_krea2": "cm_oldman",
        "cm_bubblegum_zit": "cm_bubblegum",
        "cm_oldman_zit": "cm_oldman",
        "bubblegum": "cm_bubblegum",
        "oldman": "cm_oldman",
    }

    # LoRA Loader (LoraManager node 1518)
    n1518 = next((n for n in wf.get("nodes", []) if n.get("id") == 1518), {})
    base_loras = n1518.get("widgets_values_named", {}).get("loras", [])

    active_model_cat = ""
    if model_preset:
        mp = str(model_preset).lower()
        if "zimage" in mp or "z-image" in mp or "wan" in mp:
            active_model_cat = "zimage"
        elif "krea" in mp:
            active_model_cat = "krea2"
        elif "moss" in mp or "kromoss" in mp:
            active_model_cat = "moss"
        elif "minimax" in mp:
            active_model_cat = "minimax"
        elif "qwen" in mp:
            active_model_cat = "qwen"
        elif "flux" in mp:
            active_model_cat = "flux"

    KNOWN_LORA_CATEGORIES = {
        "cm_scandes": "krea2",
        "duffyart_v1": "moss",
        "blurred_moss_v1_moss": "moss",
        "mtg_style_moss_v1_moss_copy": "moss",
    }

    def detect_lora_cat(n_str: str) -> str:
        s = n_str.lower().replace(".safetensors", "")
        for k, v in KNOWN_LORA_CATEGORIES.items():
            if k in s or s in k:
                return v
        if s.startswith("zimage/") or "zimage" in s or "zit" in s: return "zimage"
        if s.startswith("krea2/") or "krea2" in s or "krea" in s: return "krea2"
        if s.startswith("moss/") or "moss" in s: return "moss"
        if s.startswith("minimax") or "minimax" in s: return "minimax"
        if s.startswith("qwen/") or "qwen" in s: return "qwen"
        if s.startswith("flux/") or "flux" in s: return "flux"
        return "other"

    def _lora_lm_name(raw_name: str) -> str:
        """Convert a LoRA path/filename to the bare stem expected by LoraManager."""
        return os.path.splitext(os.path.basename(str(raw_name).replace("\\", "/").strip()))[0]

    loras_list: list[dict] = []
    active_tags: list[str] = []
    active_triggers: list[str] = []
    if isinstance(loras, list):
        for l in loras:
            if isinstance(l, dict) and l.get("name"):
                lm_name = _lora_lm_name(l["name"])
                norm = lm_name.lower()
                # Only activate if matching the active model architecture
                l_cat = l.get("category") or detect_lora_cat(l["name"])
                is_compat = (not active_model_cat) or (l_cat == "other") or (l_cat == active_model_cat)
                if l.get("active") and is_compat:
                    s_val = float(l.get("strength", 1.0))
                    s_str = f"{s_val:.2f}"
                    active_tags.append(f"<lora:{lm_name}:{s_str}>")
                    loras_list.append({
                        "name": lm_name,
                        "strength": s_str,
                        "clipStrength": s_str,
                        "active": True,
                        "expanded": False,
                        "selected": False,
                        "locked": False,
                    })
                    trig = l.get("trigger")
                    if not trig:
                        for k, v in KNOWN_LORA_TRIGGERS.items():
                            if k.lower() in norm or norm in k.lower():
                                trig = v
                                break
                    if trig and trig.strip():
                        active_triggers.append(trig.strip())
    elif isinstance(base_loras, list):
        for item in copy.deepcopy(base_loras):
            if item.get("active") and item.get("name"):
                item["name"] = _lora_lm_name(item["name"])
                loras_list.append(item)

    active_trigger_str = ", ".join(active_triggers) if active_triggers else ""

    # Prompt Hub (node 2061) - enforce active trigger words & prompts
    overrides["2061"] = {
        "positive_prompt": prompt,
        "additional_prompt": additional_prompt,
        "negative_prompt": neg_prompt,
        "lora_trigger_words": active_trigger_str,
    }

    # TriggerWord Toggle (node 1517) - override completely so it cannot leak saved default triggers
    overrides["1517"] = {
        "trigger_words": ["1518", 2],
        "group_mode": False,
        "default_active": False,
        "allow_strength_adjustment": False,
        "toggle_trigger_words": [],
        "orinalMessage": active_trigger_str,
    }

    # In ComfyUI-Lora-Manager, kwargs['loras'] must be passed as {'__value__': loras_list}.
    # This prevents ComfyUI's core validator from misinterpreting a bare list as a wire [node_id, slot_index],
    # while satisfying LoraLoaderLM's required 'loras' parameter without triggering 'Unexpected loras format'.
    overrides["1518"] = {
        "text": " ".join(active_tags),
        "loras": {"__value__": loras_list},
    }

    converter = EclipseWorkflowConverter(wf)
    # Bypass image-overlay switch (2134) when disabled or no logo file is set,
    # so LoadImage (2131) is not emitted into the API prompt and cannot fail validation.
    if not (overlay_img_enabled and overlay_img_file) and 2134 in converter.top.nodes:
        converter.top.nodes[2134]["mode"] = MODE_BYPASS
    api_prompt = converter.convert(outputs=output_ids, overrides=overrides)
    return api_prompt
