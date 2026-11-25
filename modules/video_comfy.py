"""Robust ComfyUI Client for tA-VideoMaker.

Handles REST queries, WebSocket live event streaming, hardware/VRAM profiling,
node presence verification, and prompt queueing.
"""

from __future__ import annotations

import copy
import io
import json
import math
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from typing import Any, Callable, Dict, List, Optional, Tuple

try:
    from websockets.sync.client import connect as _ws_connect
except ImportError:
    _ws_connect = None


class ComfyError(Exception):
    pass


FRONTEND_ONLY_NODES = {
    "MarkdownNote",
    "Note",
    "Markdown Note [Eclipse]",
    "Fast Mode Toggle [Eclipse]",
    "Fast Mode Toggle Native [Eclipse]",
    "Mode Bridge Set [Eclipse]",
    "Mode Bridge Get [Eclipse]",
}
CONTROL_VALUES = {"fixed", "randomize", "increment", "decrement"}
MODE_BYPASS = 4
MODE_MUTE = 2


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


def _extract_combo_options(spec: Any) -> Optional[List[Any]]:
    """Extracts allowed COMBO options from either ComfyUI V1 [[...], {...}] or V3 ['COMBO', {'options': [...]}] input specs."""
    if not isinstance(spec, list) or len(spec) == 0:
        return None
    if isinstance(spec[0], list):
        return spec[0]
    if spec[0] == "COMBO" and len(spec) > 1 and isinstance(spec[1], dict):
        opts = spec[1].get("options")
        if isinstance(opts, list):
            return opts
    return None


H3_CAMERA_PRESETS: dict[str, str] = {
    "steady_closeup": "Medium close-up portrait shot, steady camera, natural eye contact and subtle expressive head movement.",
    "slow_push_in": "Smooth slow camera push-in toward the subject's face, shallow depth of field, cinematic focus.",
    "subtle_orbit": "Smooth subtle camera orbit and gentle tilt around the subject, volumetric rim lighting, seamless motion.",
    "subtle_tilt": "Gentle vertical camera tilt following the subject's posture and gaze, natural cinematic framing.",
    "over_shoulder": "Conversational medium portrait framing with subtle natural breathing motion and soft background bokeh.",
    "dynamic_stage": "Expressive music video performance framing, rhythmic camera movement synchronized with the audio beat.",
}


def format_h3_structured_prompt(
    visual_prompt: str = "",
    subject_name: str = "",
    has_first_image: bool = True,
    has_second_image: bool = False,
    dialogue_text: str = "",
    dialogue_lang: str = "German",
    camera_instruction: str = "",
    music_style: str = "",
) -> str:
    """Formats a prompt using MiniMax H3 Storyboard conventions:
    - Anchors uploaded reference images via <Subject 1> / <Picture 1> (and <Subject 2> / <Picture 2>).
    - Wraps spoken lines in protected <d>[Language] ...</d> dialogue tags.
    - Separates non-diegetic music_style from spoken dialogue.
    """
    parts: List[str] = []

    subj_clean = (subject_name or "").strip()
    if has_first_image:
        if subj_clean:
            anchor = f"{subj_clean} (<Subject 1>, <Picture 1>)"
        else:
            anchor = "<Subject 1> (<Picture 1>)"
        if has_second_image:
            anchor += " transitioning smoothly toward <Picture 2>"
    else:
        anchor = subj_clean

    vis_clean = (visual_prompt or "").strip()
    if vis_clean and "@ref" in vis_clean.lower():
        vis_clean = re.sub(
            r"@ref([1-9])\b",
            lambda m: f"<Subject {m.group(1)}> (<Picture {m.group(1)}>)",
            vis_clean,
            flags=re.IGNORECASE,
        )
    if anchor and vis_clean:
        if "<Subject" not in vis_clean and "<Picture" not in vis_clean:
            parts.append(f"{anchor}: {vis_clean}")
        else:
            parts.append(vis_clean)
    elif vis_clean:
        parts.append(vis_clean)
    elif anchor:
        parts.append(
            f"{anchor} speaking and singing expressively with natural lip synchronization, "
            "subtle head movement, and realistic cinematic lighting."
        )

    cam_clean = (camera_instruction or "").strip()
    if cam_clean and cam_clean not in vis_clean:
        parts.append(f"Camera direction: {cam_clean}")

    dlg_clean = (dialogue_text or "").strip()
    if dlg_clean:
        lang_tag = "German"
        dl_low = (dialogue_lang or "").strip().lower()
        if dl_low in ("en", "english", "englisch"):
            lang_tag = "English"
        elif dl_low in ("de", "german", "deutsch"):
            lang_tag = "German"
        elif dl_low and dl_low not in ("auto", "automatisch"):
            lang_tag = dialogue_lang.strip()

        speaker_ref = f"{subj_clean} (<Subject 1>) (S1)" if subj_clean else "<Subject 1> (S1)"
        if "<d>" in dlg_clean and "</d>" in dlg_clean:
            parts.append(f"{speaker_ref} says: {dlg_clean}")
        else:
            parts.append(f"{speaker_ref} says: <d>[{lang_tag}] {dlg_clean}</d>")

    mus_clean = (music_style or "").strip()
    if mus_clean:
        parts.append(f"[Music Style: {mus_clean}]")

    return " ".join(parts).strip()


_H3_REF_TAG_RE = re.compile(
    r"<(?:Subject|Picture|Audio|Video|Character|Item|Outfit|Location|Style|Motion)\s+\d+>",
    re.IGNORECASE,
)
_H3_DIALOGUE_TAG_RE = re.compile(r"<d>([\s\S]*?)</d>", re.IGNORECASE)
_H3_AT_REF_RE = re.compile(r"@ref\d+\b", re.IGNORECASE)
_H3_SHOT_TAG_RE = re.compile(r"\[Shot\s+\d+\]", re.IGNORECASE)


def extract_h3_protected_tokens(text: str) -> dict:
    """Extracts MiniMax H3 structural tags that must survive prompt rewrites."""
    src = str(text or "")
    return {
        "refs": [m.lower() for m in _H3_REF_TAG_RE.findall(src)],
        "at_refs": [m.lower() for m in _H3_AT_REF_RE.findall(src)],
        "dialogues": [d.strip() for d in _H3_DIALOGUE_TAG_RE.findall(src)],
        "shots": [m.lower() for m in _H3_SHOT_TAG_RE.findall(src)],
    }


def validate_and_preserve_h3_tags(original_prompt: str, candidate_prompt: str) -> Tuple[str, bool]:
    """Validates a rewritten/normalized prompt against the original H3 structural tags.

    Returns (prompt_to_use, is_valid). If any protected tag (<Subject N>, <Picture N>,
    <d>...</d>, @refN, [Shot N]) from original_prompt was dropped or corrupted, falls
    back safely to original_prompt without raising an error.
    """
    orig = (original_prompt or "").strip()
    cand = (candidate_prompt or "").strip()
    if not cand:
        return orig, False
    if not orig:
        return cand, True

    orig_tokens = extract_h3_protected_tokens(orig)
    cand_tokens = extract_h3_protected_tokens(cand)

    for key in ("refs", "at_refs", "shots"):
        for token in orig_tokens[key]:
            if token not in cand_tokens[key]:
                return orig, False

    if len(cand_tokens["dialogues"]) < len(orig_tokens["dialogues"]):
        return orig, False
    for dlg in orig_tokens["dialogues"]:
        if dlg and dlg not in cand_tokens["dialogues"]:
            return orig, False

    return cand, True


class _GraphScope:
    def __init__(self, nodes, links, prefix="", subgraph=None, outer_node=None, outer_scope=None):
        self.nodes = {n["id"]: n for n in nodes}
        self.links = {}
        for raw in links:
            link = _norm_link(raw)
            self.links[link["id"]] = link
        self.prefix = prefix
        self.subgraph = subgraph
        self.outer_node = outer_node
        self.outer_scope = outer_scope


class EclipseWorkflowConverter:
    """Converts a ComfyUI UI-format workflow (such as minimaxH3Lipsync_v41.json)
    with Eclipse SetNode/GetNode/GetAllActiveNode and Subgraphs into a clean
    ComfyUI API-format prompt dict.
    """

    def __init__(self, workflow: dict, object_info: Optional[dict] = None):
        self.wf = copy.deepcopy(workflow)
        self.object_info = object_info or {}
        self.subgraphs = {s["id"]: s for s in self.wf.get("definitions", {}).get("subgraphs", [])}
        self.top = _GraphScope(self.wf["nodes"], self.wf.get("links", []))
        self.api: dict[str, dict] = {}
        self.overrides: dict[str, dict] = {}
        self.modes: dict[int, int] = {}
        self.unlinks: dict[str, list[str]] = {}
        self.set_registry: dict[str, tuple[_GraphScope, dict]] = {}

    def _build_set_registry(self):
        self.set_registry = {}
        for nid, node in self.top.nodes.items():
            if node.get("type") == "SetNode [Eclipse]":
                if self._mode(self.top, node) == 0:
                    wvals = node.get("widgets_values") or []
                    if wvals and isinstance(wvals[0], str):
                        self.set_registry[wvals[0]] = (self.top, node)

    @staticmethod
    def _node_widgets(node: dict) -> dict[str, Any]:
        res: dict[str, Any] = {}
        ntype = node.get("type", "")
        w_vals = node.get("widgets_values")
        if isinstance(w_vals, dict):
            res.update(w_vals)
        elif isinstance(w_vals, list):
            inp_defs = [i for i in node.get("inputs", []) if "widget" in i]
            inp_widgets = [i["name"] for i in inp_defs]
            inp_types = {i["name"]: i.get("type") for i in inp_defs}
            if not inp_widgets and "widgets" in node:
                for w in node["widgets"]:
                    if isinstance(w, dict) and "name" in w:
                        inp_widgets.append(w["name"])
                    elif isinstance(w, str):
                        inp_widgets.append(w)

            val_idx = 0
            if ntype == "Smart Folder [Eclipse]" and len(w_vals) > len(inp_widgets) and isinstance(w_vals[0], list):
                val_idx = 1
            elif ntype == "Lora Stack [Eclipse]" and len(w_vals) == len(inp_widgets) + 1:
                val_idx = 1

            for idx_w, wname in enumerate(inp_widgets):
                if val_idx >= len(w_vals):
                    break
                if ntype == "Load Batch From Folder (Step Advanced) [Eclipse]" and wname == "include_subfolders" and w_vals[val_idx] is None:
                    val_idx += 1
                    if val_idx >= len(w_vals):
                        break

                val = w_vals[val_idx]
                val_idx += 1

                if isinstance(val, list) and inp_types.get(wname) == "STRING":
                    val = ",".join(str(x) for x in val)

                next_wname = inp_widgets[idx_w + 1] if (idx_w + 1) < len(inp_widgets) else ""
                if (
                    val_idx < len(w_vals)
                    and isinstance(w_vals[val_idx], str)
                    and w_vals[val_idx] in CONTROL_VALUES
                    and not next_wname.endswith("_control")
                    and wname in ("seed", "noise_seed", "batch_index")
                ):
                    val_idx += 1

                res[wname] = val

        named = node.get("widgets_values_named")
        if isinstance(named, dict):
            for k, v in named.items():
                if k not in res:
                    res[k] = v
        return res

    def _mode(self, scope: _GraphScope, node: dict) -> int:
        if scope is self.top and node["id"] in self.modes:
            return self.modes[node["id"]]
        return node.get("mode", 0) or 0

    def _key(self, scope: _GraphScope, node: dict) -> str:
        return f"{scope.prefix}{node['id']}"

    def _input_source(self, scope: _GraphScope, node: dict, inp: dict):
        key = self._key(scope, node)
        if inp["name"] in self.unlinks.get(key, []) or (scope is self.top and inp["name"] in self.unlinks.get(str(node["id"]), [])):
            return None
        link_id = inp.get("link")
        if link_id is not None:
            link = scope.links.get(link_id)
            if link is None:
                return None
            return self._resolve_output(scope, link["origin_id"], link["origin_slot"])
        if "widget" in inp:
            named = self._node_widgets(node)
            value = named.get(inp["name"])
            if value is not None:
                return ("value", value)
        return None

    def _resolve_subgraph_input(self, scope: _GraphScope, slot: int):
        sg_inputs = scope.subgraph["inputs"]
        if slot >= len(sg_inputs):
            return None
        name = sg_inputs[slot]["name"]
        outer = scope.outer_node
        if scope.outer_scope is self.top:
            forced = self.overrides.get(str(outer["id"]), {})
            if name in forced:
                return ("value", forced[name])
        for inp in outer.get("inputs", []):
            if inp.get("name") == name:
                src = self._input_source(scope.outer_scope, outer, inp)
                if src is not None:
                    return src
                break
        named = self._node_widgets(outer)
        if named.get(name) is not None:
            return ("value", named[name])
        return None

    def _resolve_var(self, var_name: str):
        entry = self.set_registry.get(var_name)
        if not entry:
            return None
        set_scope, set_node = entry
        inputs = set_node.get("inputs", [])
        if not inputs:
            return None
        return self._input_source(set_scope, set_node, inputs[0])

    def _resolve_output(self, scope: _GraphScope, node_id: int, slot: int):
        if node_id == -10:
            return self._resolve_subgraph_input(scope, slot)
        node = scope.nodes.get(node_id)
        if node is None:
            return None
        mode = self._mode(scope, node)
        if mode == MODE_MUTE:
            return None
        if mode == MODE_BYPASS:
            return self._bypass(scope, node, slot)
        ntype = node["type"]
        if ntype in FRONTEND_ONLY_NODES:
            return None
        if ntype in ("Reroute", "SetNode [Eclipse]"):
            inputs = node.get("inputs", [])
            return self._input_source(scope, node, inputs[0]) if inputs else None
        if ntype == "GetNode [Eclipse]":
            wvals = node.get("widgets_values") or []
            return self._resolve_var(wvals[0]) if wvals else None
        if ntype == "GetAllActiveNode":
            wvals = node.get("widgets_values") or []
            var_idx = 2 + slot
            if var_idx < len(wvals):
                return self._resolve_var(wvals[var_idx])
            return None
        if ntype == "PrimitiveNode":
            vals = node.get("widgets_values") or []
            return ("value", vals[0]) if vals else None
        if ntype in self.subgraphs:
            sg = self.subgraphs[ntype]
            inner = _GraphScope(
                sg["nodes"], sg["links"], prefix=f"{scope.prefix}{node['id']}:",
                subgraph=sg, outer_node=node, outer_scope=scope,
            )
            for link in inner.links.values():
                if link["target_id"] == -20 and link["target_slot"] == slot:
                    return self._resolve_output(inner, link["origin_id"], link["origin_slot"])
            return None
        self._emit(scope, node)
        return ("link", self._key(scope, node), slot)

    def _bypass(self, scope: _GraphScope, node: dict, slot: int):
        outputs = node.get("outputs", [])
        if slot >= len(outputs):
            return None
        want = outputs[slot].get("type")
        want_types = {t.strip() for t in str(want or "").split(",") if t.strip()}
        for inp in node.get("inputs", []):
            if inp.get("link") is None:
                continue
            inp_type = inp.get("type")
            inp_types = {t.strip() for t in str(inp_type or "").split(",") if t.strip()}
            if (
                inp_type == want
                or want == "*"
                or inp_type == "*"
                or "*" in want_types
                or "*" in inp_types
                or bool(want_types & inp_types)
            ):
                return self._input_source(scope, node, inp)
        return None

    def _emit(self, scope: _GraphScope, node: dict) -> None:
        key = self._key(scope, node)
        if key in self.api:
            return
        entry: dict[str, Any] = {"class_type": node["type"], "inputs": {}}
        self.api[key] = entry
        inputs = entry["inputs"]
        seen = set()
        for inp in node.get("inputs", []):
            name = inp["name"]
            src = self._input_source(scope, node, inp)
            if src is None:
                continue
            inputs[name] = [src[1], src[2]] if src[0] == "link" else src[1]
            seen.add(name)
        named = self._node_widgets(node)
        for name, value in named.items():
            if name in seen or value is None:
                continue
            if name == "control_after_generate":
                continue
            if name.startswith("_") or " " in name:
                continue
            inputs[name] = value
        for name, value in self.overrides.get(key, {}).items():
            inputs[name] = value
        for name in self.unlinks.get(key, []):
            inputs.pop(name, None)
        if scope is self.top:
            for name, value in self.overrides.get(str(node["id"]), {}).items():
                inputs[name] = value
            for name in self.unlinks.get(str(node["id"]), []):
                inputs.pop(name, None)

        # Normalize COMBO inputs against ComfyUI object_info (resolves \ vs / and subfolder vs root paths for both V1 & V3 schemas)
        ntype = node.get("type", "")
        if ntype and ntype in self.object_info:
            cinfo = self.object_info[ntype].get("input", {})
            spec_map = {}
            if isinstance(cinfo.get("required"), dict):
                spec_map.update(cinfo["required"])
            if isinstance(cinfo.get("optional"), dict):
                spec_map.update(cinfo["optional"])

            for k, val in list(inputs.items()):
                if isinstance(val, list) and len(val) == 2:
                    continue
                spec = spec_map.get(k)
                allowed = _extract_combo_options(spec)
                if isinstance(allowed, list):
                    if val not in allowed and isinstance(val, str):
                        val_fwd = val.replace("\\", "/")
                        val_bck = val.replace("/", "\\")
                        if val_fwd in allowed:
                            inputs[k] = val_fwd
                        elif val_bck in allowed:
                            inputs[k] = val_bck
                        else:
                            base = os.path.basename(val_fwd).lower()
                            matched = None
                            for a in allowed:
                                if isinstance(a, str) and os.path.basename(a.replace("\\", "/")).lower() == base:
                                    matched = a
                                    break
                            if matched is not None:
                                inputs[k] = matched
                            elif "None" in allowed:
                                inputs[k] = "None"
                                if ntype == "Lora Stack [Eclipse]" and k.startswith("lora_name_"):
                                    sw_key = k.replace("lora_name_", "switch_")
                                    if sw_key in inputs:
                                        inputs[sw_key] = False

    def convert(
        self,
        outputs: list[int],
        overrides: dict[int | str, dict] | None = None,
        modes: dict[int, int] | None = None,
        unlinks: dict[int | str, list[str]] | None = None,
    ) -> dict:
        self.api = {}
        self.overrides = {str(k): v for k, v in (overrides or {}).items()}
        self.modes = dict(modes or {})
        self.unlinks = {str(k): v for k, v in (unlinks or {}).items()}
        self._build_set_registry()
        for node_id in outputs:
            if node_id in self.top.nodes and self._mode(self.top, self.top.nodes[node_id]) == 0:
                self._emit(self.top, self.top.nodes[node_id])
        self._prune([str(n) for n in outputs if str(n) in self.api])
        return self.api

    def _prune(self, roots: list[str]) -> None:
        keep: set[str] = set()
        stack = list(roots)
        while stack:
            key = stack.pop()
            if key in keep or key not in self.api:
                continue
            keep.add(key)
            for value in self.api[key]["inputs"].values():
                if isinstance(value, list) and len(value) == 2 and isinstance(value[0], str):
                    stack.append(value[0])
        self.api = {k: v for k, v in self.api.items() if k in keep}


def _format_http_error(code: int, detail: any, lang: str = "de") -> str:
    is_en = str(lang or "").lower().startswith("en")
    if isinstance(detail, dict):
        err_obj = detail.get("error") if isinstance(detail.get("error"), dict) else detail
        err_type = err_obj.get("type", "") if isinstance(err_obj, dict) else ""
        if err_type == "missing_node_type":
            extra = err_obj.get("extra_info", {}) if isinstance(err_obj, dict) else {}
            node_name = extra.get("class_type") or (err_obj.get("message") if isinstance(err_obj, dict) else "Custom Node")
            if is_en:
                return (
                    f"ComfyUI Custom Node missing: '{node_name}'. "
                    f"This extension is not installed in your ComfyUI setup. "
                    f"Please install 'ComfyUI-MiniMaxH3-Director' (https://github.com/seesee75-commits/ComfyUI-MiniMaxH3-Director) "
                    f"into ComfyUI/custom_nodes/ and restart ComfyUI."
                )
            return (
                f"ComfyUI Custom Node fehlt: '{node_name}'. "
                f"Diese Erweiterung ist in deiner ComfyUI-Installation nicht vorhanden. "
                f"Bitte installiere 'ComfyUI-MiniMaxH3-Director' (https://github.com/seesee75-commits/ComfyUI-MiniMaxH3-Director) "
                f"in ComfyUI/custom_nodes/ und starte ComfyUI neu."
            )
        msg = err_obj.get("message") or err_obj.get("error") or str(err_obj) if isinstance(err_obj, dict) else str(err_obj)
    else:
        msg = str(detail)
    return f"ComfyUI HTTP {code}: {msg}"


def _find_subfolder_recursive(root_dir: str, target_name: str, max_depth: int = 4) -> Optional[str]:
    """Searches for a subfolder by name up to max_depth levels deep, prioritizing shallower matches."""
    if not root_dir or not os.path.isdir(root_dir):
        return None
    root_norm = os.path.abspath(root_dir)
    target_lower = target_name.lower()

    if os.path.basename(root_norm).lower() == target_lower:
        return root_norm

    current_level = [root_norm]
    for _ in range(max_depth):
        next_level = []
        for parent in current_level:
            try:
                with os.scandir(parent) as it:
                    for entry in it:
                        try:
                            if entry.is_dir(follow_symlinks=False):
                                if entry.name.lower() == target_lower:
                                    return entry.path
                                if entry.name.lower() in ("models", "output", "temp", "inputs", ".git", "__pycache__", "venv", "node_modules"):
                                    continue
                                next_level.append(entry.path)
                        except Exception:
                            continue
            except Exception:
                continue
        current_level = next_level
        if not current_level:
            break
    return None


def format_comfy_execution_error(msgs: Any) -> str:
    """Formats raw ComfyUI execution errors into clean, actionable diagnostic messages."""
    if not msgs:
        return "ComfyUI meldete einen unbekannten Ausführungsfehler."

    err_info = None
    if isinstance(msgs, list):
        for item in msgs:
            if isinstance(item, list) and len(item) >= 2 and item[0] == "execution_error":
                err_info = item[1]
                break
            elif isinstance(item, dict) and item.get("type") == "execution_error":
                err_info = item
                break

    if isinstance(err_info, dict):
        exc_msg = str(err_info.get("exception_message") or "").strip()
        exc_type = str(err_info.get("exception_type") or "RuntimeError")
        node_type = str(err_info.get("node_type") or "")
        node_id = str(err_info.get("node_id") or "")

        # Specific diagnosis for common issues
        if "VAE is invalid: None" in exc_msg or "VAE is invalid" in exc_msg:
            return (
                "ComfyUI Fehler: VAE ist ungültig oder konnte nicht initialisiert werden (VAE is invalid: None).\n\n"
                "Ursache: Entweder fehlt das Video-VAE im Ordner 'models/vae/' (z. B. 'minimax_h3_video_vae_fp16.safetensors'), "
                "oder ComfyUI konnte das VAE im Workflow nicht an den Decoder übergeben.\n"
                "Lösung: Bitte überprüfe im Modell-Manager von tA-VideoMaker oder in ComfyUI, ob das Video-VAE vorhanden ist."
            )
        if "CUDA out of memory" in exc_msg or "OutOfMemoryError" in exc_msg:
            return (
                f"ComfyUI Grafikspeicher-Fehler (CUDA Out of Memory) in Node {node_type} (#{node_id}):\n\n"
                "Der VRAM deiner Grafikkarte reicht für diese Auflösung oder Szenenlänge nicht aus.\n"
                "Lösung: Verringere die Auflösung (z. B. auf 540p oder 480p) oder kürze die Szenendauer."
            )

        res = f"ComfyUI Ausführungsfehler in Node '{node_type}' (#{node_id}): {exc_type}"
        if exc_msg:
            res += f"\n{exc_msg}"
        return res

    return f"ComfyUI Fehler bei der Generierung: {msgs}"


class ComfyClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8188", lang: str = "de"):
        self.base_url = base_url.rstrip("/")
        self.client_id = uuid.uuid4().hex
        self.lang = lang

    def _request(self, path: str, data: dict | None = None, timeout: float = 30,
                 headers: dict | None = None, method: str | None = None):
        url = self.base_url + path
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", **(headers or {})},
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                payload = resp.read()
                return json.loads(payload.decode("utf-8")) if payload else {}
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")
            try:
                detail = json.loads(detail)
            except ValueError:
                pass
            raise ComfyError(_format_http_error(err.code, detail, lang=self.lang)) from err
        except (urllib.error.URLError, socket.timeout, ConnectionError) as err:
            is_en = str(self.lang or "").lower().startswith("en")
            errMsg = f"ComfyUI is not reachable ({self.base_url}): {err}" if is_en else f"ComfyUI ist nicht erreichbar ({self.base_url}): {err}"
            raise ComfyError(errMsg) from err

    def is_alive(self) -> bool:
        try:
            self._request("/system_stats", timeout=3)
            return True
        except Exception:
            return False

    def system_stats(self) -> dict:
        return self._request("/system_stats", timeout=5)

    def get_hardware_profile(self) -> dict:
        """Determines GPU name, total VRAM and selects the appropriate profile (eco/balanced/ultra)."""
        stats = {}
        try:
            stats = self.system_stats()
        except Exception:
            return {
                "connected": False,
                "gpu_name": "Unbekannt",
                "vram_gb": 8.0,
                "profile": "eco",
                "recommended_res": "480p",
                "max_shot_seconds": 4.5,
            }

        devices = stats.get("devices") or []
        gpu_name = "CPU / Standard"
        vram_bytes = 8 * 1024 * 1024 * 1024  # default to 8GB assumption

        for dev in devices:
            if dev.get("type") == "cuda" or "vram_total" in dev:
                gpu_name = dev.get("name", "NVIDIA GPU")
                vram_bytes = dev.get("vram_total", vram_bytes)
                break

        vram_gb = round(vram_bytes / (1024 ** 3), 1)

        # Profile selection
        if vram_gb <= 8.5:
            profile = "eco"
            rec_res = "480p"
            max_shot = 4.5
            auto_upscale = True
        elif vram_gb < 18.0:
            profile = "balanced"
            rec_res = "720p"
            max_shot = 6.0
            auto_upscale = False
        else:
            profile = "ultra"
            rec_res = "1080p"
            max_shot = 10.0
            auto_upscale = False

        return {
            "connected": True,
            "gpu_name": gpu_name,
            "vram_gb": vram_gb,
            "profile": profile,
            "recommended_res": rec_res,
            "max_shot_seconds": max_shot,
            "auto_upscale": auto_upscale,
        }

    def get_custom_nodes_path(self, configured_comfy_dir: str = "") -> Optional[str]:
        """Resolves the physical directory of ComfyUI custom_nodes (local Windows, WSL, Portable, or Desktop App)."""
        # 1. Configured directory from Settings (direct + deep recursive search up to 4 levels)
        if configured_comfy_dir and os.path.isdir(configured_comfy_dir):
            if os.path.basename(configured_comfy_dir.rstrip("/\\")).lower() == "custom_nodes":
                return configured_comfy_dir
            p1 = os.path.join(configured_comfy_dir, "custom_nodes")
            if os.path.isdir(p1):
                return p1
            p2 = os.path.join(configured_comfy_dir, "ComfyUI", "custom_nodes")
            if os.path.isdir(p2):
                return p2
            # Deep search handles nested folders like ...\Easy-Install\Easy-Install\ComfyUI\custom_nodes
            rec = _find_subfolder_recursive(configured_comfy_dir, "custom_nodes", max_depth=4)
            if rec:
                return rec

        # 2. Derive from ComfyUI /system_stats argv
        try:
            stats = self.system_stats()
            argv = stats.get("system", {}).get("argv", [])
            if argv and isinstance(argv, list) and argv:
                # 2a. Check if --base-directory or --user-directory argument was passed
                for idx, arg in enumerate(argv):
                    if arg in ("--base-directory", "--base_directory", "--user-directory", "--user_directory") and idx + 1 < len(argv):
                        base_val = argv[idx + 1]
                        if os.path.isdir(base_val):
                            cn_base = _find_subfolder_recursive(base_val, "custom_nodes", max_depth=3)
                            if cn_base:
                                return cn_base

                main_py = argv[0]
                comfy_dir = os.path.dirname(main_py)

                # Local Windows / native path check first
                p_local = os.path.join(comfy_dir, "custom_nodes")
                if os.path.isdir(p_local):
                    return p_local
                p_parent = os.path.join(os.path.dirname(comfy_dir), "custom_nodes")
                if os.path.isdir(p_parent):
                    return p_parent
                rec_argv = _find_subfolder_recursive(comfy_dir, "custom_nodes", max_depth=3)
                if rec_argv:
                    return rec_argv

                # If path indicates WSL / Linux and not Windows drive letter
                if "/" in main_py and not (len(main_py) >= 2 and main_py[1] == ":"):
                    linux_custom_nodes = os.path.join(comfy_dir, "custom_nodes").replace("\\", "/")
                    for distro in ["Ubuntu-26.04", "Ubuntu-24.04", "Ubuntu-22.04", "Ubuntu", "Debian"]:
                        candidate = f"\\\\wsl.localhost\\{distro}" + linux_custom_nodes.replace("/", "\\")
                        if os.path.isdir(candidate):
                            return candidate
                        candidate2 = f"\\\\wsl$\\{distro}" + linux_custom_nodes.replace("/", "\\")
                        if os.path.isdir(candidate2):
                            return candidate2
        except Exception:
            pass

        # 3. Discover running ComfyUI process on Windows via netstat listening port & CommandLine
        if sys.platform == "win32":
            try:
                parsed_port = urllib.parse.urlparse(self.base_url).port or 8188
                no_win = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                netstat_proc = subprocess.run(
                    ["netstat", "-ano", "-p", "tcp"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5,
                    creationflags=no_win,
                )
                pid = None
                if netstat_proc.returncode == 0:
                    for line in netstat_proc.stdout.splitlines():
                        if f":{parsed_port}" in line and "LISTENING" in line:
                            parts = line.strip().split()
                            if parts:
                                pid = parts[-1]
                                break
                if pid and pid.isdigit() and int(pid) > 0:
                    ps_cmd = [
                        "powershell", "-NoProfile", "-Command",
                        f"(Get-CimInstance Win32_Process -Filter 'ProcessId = {pid}').CommandLine"
                    ]
                    ps_proc = subprocess.run(
                        ps_cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        timeout=5,
                        creationflags=no_win,
                    )
                    cmd_line = ps_proc.stdout.strip()
                    if cmd_line:
                        import re
                        paths_found = re.findall(r'[A-Za-z]:\\[^"\'\r\n\t]+', cmd_line)
                        for pf in paths_found:
                            curr = pf.strip()
                            while curr and len(curr) > 3:
                                cand_cn = os.path.join(curr, "custom_nodes")
                                if os.path.isdir(cand_cn):
                                    return cand_cn
                                cand_cn2 = os.path.join(curr, "ComfyUI", "custom_nodes")
                                if os.path.isdir(cand_cn2):
                                    return cand_cn2
                                rec_pid = _find_subfolder_recursive(curr, "custom_nodes", max_depth=3)
                                if rec_pid:
                                    return rec_pid
                                parent = os.path.dirname(curr)
                                if parent == curr:
                                    break
                                curr = parent
            except Exception:
                pass

        # 4. ComfyUI Desktop App detection (APPDATA config & Documents folder)
        if sys.platform == "win32":
            try:
                appdata = os.environ.get("APPDATA")
                if appdata:
                    desktop_cfg = os.path.join(appdata, "ComfyUI", "config.json")
                    if os.path.isfile(desktop_cfg):
                        with open(desktop_cfg, "r", encoding="utf-8") as f:
                            cfg_data = json.load(f)
                            base_p = cfg_data.get("basePath") or cfg_data.get("base_path") or cfg_data.get("baseDirectory")
                            if base_p and os.path.isdir(base_p):
                                cn_dt = _find_subfolder_recursive(base_p, "custom_nodes", max_depth=3)
                                if cn_dt:
                                    return cn_dt
            except Exception:
                pass

            try:
                user_docs = os.path.join(os.path.expanduser("~"), "Documents")
                if os.path.isdir(user_docs):
                    # Direct standard ComfyUI Documents folder
                    dt_std = os.path.join(user_docs, "ComfyUI", "custom_nodes")
                    if os.path.isdir(dt_std):
                        return dt_std
                    # Scan ComfyUI or Easy-Install folders inside Documents (handles Pixaroma / Easy-Install layouts)
                    with os.scandir(user_docs) as it:
                        for entry in it:
                            try:
                                if entry.is_dir(follow_symlinks=False) and "comfy" in entry.name.lower():
                                    cn_cand = _find_subfolder_recursive(entry.path, "custom_nodes", max_depth=4)
                                    if cn_cand:
                                        return cn_cand
                            except Exception:
                                continue
            except Exception:
                pass

        # 5. Scan common ComfyUI portable locations across all drives
        common_candidates = [
            os.path.expanduser("~/ComfyUI"),
            os.path.expanduser("~/ComfyUI_windows_portable"),
            os.path.expanduser("~/Desktop/ComfyUI_windows_portable"),
            os.path.expanduser("~/Desktop/ComfyUI"),
            os.path.expanduser("~/Documents/ComfyUI"),
            os.path.expanduser("~/Documents/ComfyUI-Easy-Install"),
        ]
        for drive in ["C", "D", "E", "F", "G"]:
            common_candidates.extend([
                f"{drive}:\\ComfyUI_windows_portable",
                f"{drive}:\\ComfyUI",
                f"{drive}:\\AI\\ComfyUI_windows_portable",
                f"{drive}:\\AI\\ComfyUI",
                f"{drive}:\\ComfyUI-Easy-Install",
            ])
        for c in common_candidates:
            if not os.path.isdir(c):
                continue
            cand_cn = os.path.join(c, "custom_nodes")
            if os.path.isdir(cand_cn):
                return cand_cn
            cand_cn2 = os.path.join(c, "ComfyUI", "custom_nodes")
            if os.path.isdir(cand_cn2):
                return cand_cn2
            rec_c = _find_subfolder_recursive(c, "custom_nodes", max_depth=3)
            if rec_c:
                return rec_c

        return None

    def get_comfy_output_dir(self, configured_comfy_dir: str = "") -> Optional[str]:
        """Resolves the physical directory where ComfyUI saves its outputs on Windows."""
        try:
            stats = self.system_stats()
            argv = stats.get("system", {}).get("argv", [])
            if argv and isinstance(argv, list):
                if "--output-directory" in argv:
                    out_idx = argv.index("--output-directory") + 1
                    linux_out = argv[out_idx]
                    for drive_letter in ["c", "d", "e", "f", "g", "h"]:
                        linux_out = linux_out.replace(f"/mnt/{drive_letter}/", f"{drive_letter.upper()}:\\")
                    win_out = linux_out.replace("/", "\\")
                    if os.path.isdir(win_out):
                        return win_out

                # Standard ComfyUI output directory: <comfy_dir>/output
                if argv:
                    main_py = argv[0]
                    c_dir = os.path.dirname(main_py)
                    candidate_out = os.path.join(c_dir, "output")
                    if os.path.isdir(candidate_out):
                        return candidate_out
                    candidate_parent_out = os.path.join(os.path.dirname(c_dir), "output")
                    if os.path.isdir(candidate_parent_out):
                        return candidate_parent_out

            # Fallback based on resolved custom_nodes directory
            cn_cand = self.get_custom_nodes_path(configured_comfy_dir)
            if cn_cand:
                p_root = os.path.dirname(cn_cand)
                out_c1 = os.path.join(p_root, "output")
                if os.path.isdir(out_c1):
                    return out_c1
                out_c2 = os.path.join(os.path.dirname(p_root), "output")
                if os.path.isdir(out_c2):
                    return out_c2
        except Exception:
            pass

        if configured_comfy_dir and os.path.isdir(configured_comfy_dir):
            c_out = os.path.join(configured_comfy_dir, "output")
            if os.path.isdir(c_out):
                return c_out

        return None

    def get_comfy_base_dir(self, configured_comfy_dir: str = "") -> Optional[str]:
        """Resolves the physical base directory of ComfyUI (e.g. D:\\ComfyUI)."""
        if configured_comfy_dir and os.path.isdir(configured_comfy_dir):
            return configured_comfy_dir
        try:
            stats = self.system_stats()
            argv = stats.get("system", {}).get("argv", [])
            if argv and isinstance(argv, list) and argv:
                main_py = argv[0]
                c_dir = os.path.dirname(main_py)
                if os.path.isdir(c_dir):
                    return c_dir
        except Exception:
            pass
        return None

    def get_comfy_python_exe(self, configured_comfy_dir: str = "") -> Optional[str]:
        """Finds the local Python executable used by ComfyUI under Windows (e.g. portable or venv)."""
        search_dirs = []
        if configured_comfy_dir and os.path.isdir(configured_comfy_dir):
            search_dirs.append(configured_comfy_dir)
            search_dirs.append(os.path.dirname(configured_comfy_dir))

        try:
            stats = self.system_stats()
            argv = stats.get("system", {}).get("argv", [])
            if argv and isinstance(argv, list) and argv:
                main_py = argv[0]
                c_dir = os.path.dirname(main_py)
                if os.path.isdir(c_dir):
                    search_dirs.append(c_dir)
                    search_dirs.append(os.path.dirname(c_dir))
        except Exception:
            pass

        for d in search_dirs:
            candidates = [
                os.path.join(d, "python_embeded", "python.exe"),
                os.path.join(d, "venv", "Scripts", "python.exe"),
                os.path.join(d, ".venv", "Scripts", "python.exe"),
            ]
            for cand in candidates:
                if os.path.isfile(cand):
                    return os.path.abspath(cand)

        return None

    def check_node_exists(self, node_name: str) -> bool:
        """Checks if a specific node class is registered in ComfyUI."""
        try:
            encoded_name = urllib.parse.quote(node_name, safe="")
            res = self._request(f"/object_info/{encoded_name}", timeout=3)
            return bool(res and isinstance(res, dict) and node_name in res and res[node_name].get("input"))
        except Exception:
            return False

    def list_essential_extensions(self, configured_comfy_dir: str = "", lang: str = "") -> List[dict]:
        """Returns the installation status of all essential video and audio node packages."""
        eff_lang = (lang or self.lang or "de").lower()
        is_en = eff_lang.startswith("en")
        extensions = [
            {
                "id": "vhs",
                "folder": "comfyui-videohelpersuite",
                "title": "ComfyUI VideoHelperSuite (VHS)",
                "repo_url": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git",
                "description": "Video combination, audio multiplexing and H.264/MP4 export" if is_en else "Video-Kombinierung, Audio-Multiplexing und H.264/MP4 Export",
                "check_node": "VHS_VideoCombine",
                "required": True,
            },
            {
                "id": "eclipse",
                "folder": "ComfyUI_Eclipse",
                "title": "ComfyUI Eclipse (MiniMax H3 Lipsync Suite)",
                "repo_url": "https://github.com/r-vage/ComfyUI_Eclipse.git",
                "description": "MiniMax H3 Audio Timeline Planner V2, Demucs Isolation, Lyric Captions & Lipsync" if is_en else "MiniMax H3 Audio Timeline Planner V2, Demucs Isolation, Lyric Captions & Lipsync",
                "check_node": "MiniMax H3 Audio Timeline Planner V2 [Eclipse]",
                "required": True,
            },
            {
                "id": "minimax_director",
                "folder": "ComfyUI-MiniMaxH3-Director",
                "title": "MiniMax H3 Director Extension (NextGen)",
                "repo_url": "https://github.com/seesee75-commits/ComfyUI-MiniMaxH3-Director.git",
                "description": "Required for Video & Quick Clip rendering (NGContextConnector, NGH3Director)" if is_en else "Erforderlich für Video- & Quick-Clip-Rendering (NGContextConnector, NGH3Director)",
                "check_node": "NGContextConnector",
                "required": True,
            },
            {
                "id": "comfyui_manager",
                "folder": "comfyui-manager",
                "title": "ComfyUI Manager",
                "repo_url": "https://github.com/ltdrdata/ComfyUI-Manager.git",
                "description": "Package manager for automatic updates and node management" if is_en else "Zentraler Paketmanager für automatische Updates und Node-Verwaltung",
                "check_node": None,
                "required": False,
            },
            {
                "id": "teacache",
                "folder": "ComfyUI-TeaCache",
                "title": "ComfyUI TeaCache (1.5x-2x Speedup)",
                "repo_url": "https://github.com/welltop-cn/ComfyUI-TeaCache.git",
                "description": "Timestep Embedding Aware Cache for 1.5x-2x faster video diffusion" if is_en else "Timestep Embedding Aware Cache für 1.5x-2x schnellere Video-Generierung",
                "check_node": "TeaCache",
                "required": False,
            },
            {
                "id": "magcache",
                "folder": "ComfyUI-MagCache",
                "title": "ComfyUI MagCache (Magnitude-Aware Speedup)",
                "repo_url": "https://github.com/Zehong-Ma/ComfyUI-MagCache.git",
                "description": "Magnitude-aware timestep caching for 1.5x-2x faster video diffusion with minimal detail loss" if is_en else "Magnitude-Aware Caching für 1,5x-2x schnelleres Rendering mit geringem Detailverlust",
                "check_node": "MagCache",
                "required": False,
            },
            {
                "id": "sol_attn",
                "folder": "ComfyUI-sol-attn",
                "title": "ComfyUI Sol-Attn (Sparse Attention for H3)",
                "repo_url": "https://github.com/r-vage/ComfyUI-sol-attn.git",
                "description": "Triton sparse attention & memory optimization tailored for MiniMax H3" if is_en else "Triton Sparse Attention & Speicher-Optimierung speziell für MiniMax H3",
                "check_node": None,
                "required": False,
            },
            {
                "id": "mmaudio",
                "folder": "ComfyUI-MMAudio",
                "title": "ComfyUI MMAudio (Synchformer Audio AI)",
                "repo_url": "https://github.com/kijai/ComfyUI-MMAudio.git",
                "description": "Multimodal video-to-audio and sound effect synthesis synchronized with video" if is_en else "Video-zu-Audio und bildsynchrone Foley- und Soundeffekt-Synthese",
                "check_node": "MMAudioSampler",
                "required": False,
            },
            {
                "id": "infinitetalk",
                "folder": "ComfyUI-WanInfiniteTalk",
                "title": "Wan 2.1 InfiniteTalk Suite",
                "repo_url": "https://github.com/MeiGen-AI/InfiniteTalk.git",
                "description": "Audio-driven talking-head and expressive character video generation for Wan 2.1" if is_en else "Audio-gesteuerte Charakteranimation und Mimik für Wan 2.1",
                "check_node": "WanInfiniteTalkToVideo",
                "required": False,
            },
            {
                "id": "bexplains_refpacks",
                "folder": "BExplains_RefPacks",
                "folder_aliases": ["BExplains_RefPacks", "ComfyUI-RefPacks", "bexplains-refpacks"],
                "title": "BExplains RefPacks (Optional Core)",
                "repo_url": "https://github.com/BExplains/ComfyUI-RefPacks.git",
                "description": "Optional: Save & reuse VAE-cached character, outfit, location and style packs (.safetensors) without extra AI models" if is_en else "Optional: VAE-gecachte Charakter-, Outfit-, Location- & Stil-Packs (.safetensors) wiederverwenden (ohne neue KI-Modelle)",
                "check_node": "BExplainsLoadRefPack",
                "required": False,
            },
            {
                "id": "bexplains_h3_refpacks",
                "folder": "BExplains_H3_RefPacks",
                "folder_aliases": ["BExplains_H3_RefPacks", "ComfyUI-MiniMax-H3-RefPacks", "bexplains-h3-refpacks"],
                "title": "BExplains MiniMax H3 RefPacks (Optional)",
                "repo_url": "https://github.com/BExplains/ComfyUI-MiniMax-H3-RefPacks.git",
                "description": "Optional: Role-aware <Character>/<Outfit>/<Style> prompting & RefPack conditioning for your existing MiniMax H3 models" if is_en else "Optional: Rollenbasiertes <Character>/<Outfit>/<Style>-Prompting & RefPack-Conditioning für vorhandene MiniMax-H3-Modelle",
                "check_node": "BExplainsRefPackToH3",
                "required": False,
            },
        ]

        cn_path = self.get_custom_nodes_path(configured_comfy_dir)
        installed_folders = []
        if cn_path and os.path.isdir(cn_path):
            try:
                installed_folders = [f.lower() for f in os.listdir(cn_path)]
            except Exception:
                pass

        results = []
        for ext in extensions:
            chk = ext.get("check_node")
            is_node_ok = self.check_node_exists(chk) if chk else False
            aliases = [a.lower() for a in ext.get("folder_aliases", [ext["folder"]])]
            folder_present = any(a in installed_folders for a in aliases) if installed_folders else False

            # If a specific check_node is defined:
            # - installed is True ONLY if the node is actually loaded in ComfyUI
            # - needs_restart is True if the files exist on disk, but ComfyUI hasn't loaded the node yet
            if chk:
                is_installed = is_node_ok
                needs_restart = folder_present and not is_node_ok
            else:
                is_installed = folder_present
                needs_restart = False

            results.append({
                **ext,
                "installed": is_installed,
                "node_active": is_node_ok,
                "folder_present": folder_present,
                "needs_restart": needs_restart,
                "custom_nodes_dir": cn_path,
            })

        return results

    def install_extension(self, repo_url: str, folder_name: str, configured_comfy_dir: str = "") -> Tuple[bool, str]:
        """Installs a custom node repository into ComfyUI's custom_nodes folder.
        Uses git clone if git is available, otherwise falls back to pure-Python GitHub ZIP download.
        """
        raw_url = str(repo_url or "").strip()
        if (
            not raw_url
            or raw_url.startswith("-")
            or any(ch in raw_url for ch in ("\r", "\n", "\x00"))
            or any(ch.isspace() for ch in raw_url)
        ):
            return False, "Ungültige Repository-URL."
        parsed_repo = urllib.parse.urlparse(raw_url)
        if parsed_repo.scheme not in ("https", "http") or not parsed_repo.netloc:
            return False, "Repository-URL muss mit https:// oder http:// beginnen."

        safe_folder = os.path.basename(str(folder_name or "").strip().rstrip("/\\"))
        if not safe_folder or safe_folder in (".", "..") or any(sep in safe_folder for sep in ("/", "\\", "\x00")):
            return False, "Ungültiger Zielordnername."

        cn_path = self.get_custom_nodes_path(configured_comfy_dir)
        if not cn_path or not os.path.isdir(cn_path):
            return False, "ComfyUI custom_nodes Verzeichnis konnte nicht lokalisiert werden. Bitte ComfyUI-Pfad in den Einstellungen prüfen."

        cn_real = os.path.realpath(os.path.abspath(cn_path))
        target_dir = os.path.realpath(os.path.join(cn_real, safe_folder))
        if os.path.commonpath([cn_real, target_dir]) != cn_real or target_dir == cn_real:
            return False, "Ungültiger Zielordner (außerhalb von custom_nodes)."

        if os.path.isdir(target_dir):
            try:
                # If target directory already has python files, consider it installed
                files = os.listdir(target_dir)
                if any(f.endswith(".py") for f in files):
                    return True, f"Erweiterung '{safe_folder}' ist bereits im custom_nodes Ordner vorhanden."
            except Exception:
                pass

        # 1. Try git clone first if git binary is present in system PATH
        git_exe = shutil.which("git")
        if git_exe:
            no_win = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            try:
                cmd = [git_exe, "clone", "--depth", "1", "--", raw_url, target_dir]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120, creationflags=no_win)
                if proc.returncode == 0 and os.path.isdir(target_dir):
                    self._auto_install_requirements(target_dir, cn_path)
                    return True, f"'{safe_folder}' erfolgreich installiert! Bitte ComfyUI neu starten."
            except Exception as ex:
                print(f"[Extensions] Git clone fehlgeschlagen ({ex}), versuche automatischen ZIP-Download...")

        # 2. Fallback: Pure-Python GitHub ZIP download & extraction (0 external tools required)
        try:
            clean_url = raw_url.rstrip("/")
            if clean_url.endswith(".git"):
                clean_url = clean_url[:-4]

            zip_candidates = [
                f"{clean_url}/archive/refs/heads/main.zip",
                f"{clean_url}/archive/refs/heads/master.zip",
            ]

            zip_bytes = None
            last_err = None
            for z_url in zip_candidates:
                try:
                    req = urllib.request.Request(z_url, headers={"User-Agent": "tA-VideoMaker-Installer"})
                    with urllib.request.urlopen(req, timeout=60) as resp:
                        if resp.status == 200:
                            zip_bytes = resp.read()
                            break
                except Exception as ex:
                    last_err = ex
                    continue

            if not zip_bytes:
                return False, f"Download fehlgeschlagen: Kein Git vorhanden und ZIP konnte nicht geladen werden ({last_err})"

            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                names = zf.namelist()
                top_dir = names[0].split("/")[0] if names else ""

                os.makedirs(target_dir, exist_ok=True)
                for member in zf.infolist():
                    m_path = member.filename
                    if top_dir and m_path.startswith(f"{top_dir}/"):
                        rel_path = m_path[len(top_dir) + 1:]
                    else:
                        rel_path = m_path
                    if not rel_path:
                        continue

                    dest_file = os.path.realpath(os.path.join(target_dir, os.path.normpath(rel_path)))
                    if os.path.commonpath([target_dir, dest_file]) != target_dir:
                        raise ValueError(f"Unsicherer ZIP-Eintrag: {m_path}")
                    if member.is_dir():
                        os.makedirs(dest_file, exist_ok=True)
                    else:
                        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
                        with zf.open(member) as source, open(dest_file, "wb") as target:
                            target.write(source.read())

            self._auto_install_requirements(target_dir, cn_path)
            return True, f"'{safe_folder}' erfolgreich per Direkt-Download installiert! Bitte ComfyUI neu starten."
        except Exception as ex:
            return False, f"Fehler bei Installation: {ex}"

    def _auto_install_requirements(self, target_dir: str, cn_path: str) -> None:
        """Installs requirements.txt if ComfyUI embedded python environment is detected."""
        try:
            req_file = os.path.join(target_dir, "requirements.txt")
            if not os.path.isfile(req_file):
                return
            p_nodes = os.path.abspath(cn_path)
            embed_py = None
            for cand_root in [
                os.path.dirname(p_nodes),
                os.path.dirname(os.path.dirname(p_nodes)),
                os.path.join(os.path.dirname(p_nodes), "python_embeded"),
                os.path.join(os.path.dirname(os.path.dirname(p_nodes)), "python_embeded"),
            ]:
                cand_exe = os.path.join(cand_root, "python.exe") if os.path.basename(cand_root).lower() == "python_embeded" else os.path.join(cand_root, "python_embeded", "python.exe")
                if os.path.isfile(cand_exe):
                    embed_py = cand_exe
                    break
            if embed_py and os.path.isfile(embed_py):
                no_win = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                subprocess.run(
                    [embed_py, "-m", "pip", "install", "-r", req_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=90,
                    creationflags=no_win,
                )
        except Exception:
            pass

    def install_extension_git(self, repo_url: str, folder_name: str, configured_comfy_dir: str = "") -> Tuple[bool, str]:
        """Backward compatible alias pointing to robust install_extension."""
        return self.install_extension(repo_url, folder_name, configured_comfy_dir)

    def restart_comfyui(self) -> Tuple[bool, str]:
        """Attempts to reboot ComfyUI (via ComfyUI-Manager API) and waits until it is responsive again."""
        try:
            rebooted = False
            for ep in ["/manager/reboot", "/manager/restart"]:
                try:
                    res = self._request(ep, data={}, timeout=5, method="POST")
                    if res is not None:
                        rebooted = True
                        break
                except Exception:
                    pass

            if not rebooted:
                return False, "ComfyUI Neustart-Schnittstelle nicht erreichbar. Bitte ComfyUI manuell neu starten."

            time.sleep(3)
            for _ in range(25):
                time.sleep(1)
                if self.is_alive():
                    time.sleep(1.5)
                    return True, "ComfyUI wurde erfolgreich neu gestartet!"

            return False, "ComfyUI brauchte zu lange für den Neustart."
        except Exception as ex:
            return False, f"Fehler beim Neustart von ComfyUI: {ex}"

    def ensure_director_node(self, configured_comfy_dir: str = "") -> Tuple[bool, str, bool]:
        """Ensures ComfyUI-MiniMaxH3-Director is installed and active in ComfyUI.
        Returns: (is_ready: bool, message: str, needs_manual_restart: bool)
        """
        if self.check_minimax_director_node():
            return True, "MiniMax H3 Director ist einsatzbereit.", False

        print("[AutoFix] MiniMax H3 Director fehlt in ComfyUI. Starte automatische Installation...")
        ok_install, install_msg = self.install_extension(
            repo_url="https://github.com/seesee75-commits/ComfyUI-MiniMaxH3-Director.git",
            folder_name="ComfyUI-MiniMaxH3-Director",
            configured_comfy_dir=configured_comfy_dir,
        )
        if not ok_install:
            return False, f"Automatische Installation fehlgeschlagen: {install_msg}", False

        # Attempt automatic restart via ComfyUI Manager API
        print("[AutoFix] Installation im custom_nodes Ordner abgeschlossen. Versuche automatischen ComfyUI-Neustart...")
        ok_restart, restart_msg = self.restart_comfyui()
        if ok_restart and self.check_minimax_director_node():
            return True, "MiniMax H3 Director wurde automatisch installiert und erfolgreich aktiviert!", False

        return (
            False,
            "Erweiterung 'ComfyUI-MiniMaxH3-Director' wurde erfolgreich installiert. "
            "Bitte starte ComfyUI kurz neu (Fenster schließen und erneut starten), damit die Nodes aktiv werden.",
            True
        )

    def check_minimax_director_node(self) -> bool:
        """Verifies if ComfyUI-MiniMaxH3-Director (NGContextConnector / NGH3Director) is installed."""
        try:
            if self.check_node_exists("NGContextConnector"):
                return True
            if self.check_node_exists("NGH3Director"):
                return True
            return self.check_node_exists("MiniMaxH3Director")
        except Exception:
            return False

    def get_folder_paths(self) -> dict:
        try:
            return self._request("/internal/folder_paths", timeout=5)
        except Exception:
            return {}

    def queue_prompt(self, prompt: dict) -> str:
        res = self._request("/prompt", {"prompt": prompt, "client_id": self.client_id}, timeout=30)
        node_errors = res.get("node_errors")
        if isinstance(node_errors, dict) and len(node_errors) > 0:
            self.interrupt()
            err_parts = []
            for nid, ninfo in node_errors.items():
                ctype = ninfo.get("class_type", f"Node {nid}") if isinstance(ninfo, dict) else f"Node {nid}"
                errs = ninfo.get("errors", []) if isinstance(ninfo, dict) else []
                details = "; ".join(
                    f"{e.get('message', '')} ({e.get('details', '')})" for e in errs if isinstance(e, dict)
                ) or str(ninfo)
                err_parts.append(f"{ctype} [{nid}]: {details}")
            raise ComfyError("ComfyUI Node-Validierungsfehler: " + " | ".join(err_parts))
        if "prompt_id" not in res:
            raise ComfyError(f"Unerwartete Antwort von ComfyUI: {res}")
        return res["prompt_id"]

    def interrupt(self) -> None:
        try:
            self._request("/interrupt", data={}, timeout=5)
        except Exception:
            pass
        try:
            self._request("/queue", data={"clear": True}, timeout=5)
        except Exception:
            pass

    def clear_cache(self) -> None:
        """Triggers torch empty cache if supported endpoint exists."""
        try:
            self._request("/free", data={"unload_models": False, "free_memory": True}, timeout=5)
        except Exception:
            pass

    def upload_image(self, file_path: str, overwrite: bool = True) -> str:
        """Uploads an image file to ComfyUI /upload/image endpoint and returns the image filename."""
        if not os.path.isfile(file_path):
            raise ComfyError(f"Bilddatei nicht gefunden: {file_path}")

        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        filename = os.path.basename(file_path)

        with open(file_path, "rb") as f:
            file_data = f.read()

        parts = []
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\n{'true' if overwrite else 'false'}\r\n".encode("utf-8")
        )

        content_type = "image/png"
        if filename.lower().endswith((".jpg", ".jpeg")):
            content_type = "image/jpeg"
        elif filename.lower().endswith(".webp"):
            content_type = "image/webp"

        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8")
        )
        parts.append(file_data)
        parts.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        payload = b"".join(parts)
        req = urllib.request.Request(
            f"{self.base_url}/upload/image",
            data=payload,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(payload)),
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("name", filename)
        except Exception as ex:
            raise ComfyError(f"Upload nach ComfyUI fehlgeschlagen: {ex}") from ex

    def upload_audio(self, file_path: str, overwrite: bool = True) -> str:
        """Uploads an audio file (.mp3, .wav, .flac, .ogg, .m4a) to ComfyUI's input folder via /upload/image."""
        if not os.path.isfile(file_path):
            raise ComfyError(f"Audiodatei nicht gefunden: {file_path}")

        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        filename = os.path.basename(file_path)

        with open(file_path, "rb") as f:
            file_data = f.read()

        parts = []
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\n{'true' if overwrite else 'false'}\r\n".encode("utf-8")
        )

        ext = os.path.splitext(filename)[1].lower()
        mime_map = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".flac": "audio/flac",
            ".ogg": "audio/ogg",
            ".m4a": "audio/mp4",
        }
        content_type = mime_map.get(ext, "application/octet-stream")

        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8")
        )
        parts.append(file_data)
        parts.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        payload = b"".join(parts)
        req = urllib.request.Request(
            f"{self.base_url}/upload/image",
            data=payload,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(payload)),
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("name", filename)
        except Exception as ex:
            raise ComfyError(f"Audio-Upload nach ComfyUI fehlgeschlagen: {ex}") from ex

    def get_history(self, prompt_id: str, timeout: float = 30) -> dict:
        """Fetches status and outputs of a queued prompt."""
        return self._request(f"/history/{prompt_id}", timeout=timeout)

    def extract_outputs_from_history(self, prompt_entry: dict) -> List[dict]:
        """Extracts list of video/image artifacts from a single prompt's history object."""
        outputs = prompt_entry.get("outputs", {})
        result_files = []
        seen = set()
        audio_exts = (".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac")

        def _add_candidate(item_dict: dict, nid: str = ""):
            fn = str(item_dict.get("filename", "")).strip()
            if not fn or fn.lower().endswith(audio_exts):
                return
            ftype = str(item_dict.get("type", "output") or "output")
            if ftype == "input":
                return
            sub = str(item_dict.get("subfolder", "") or "")
            sig = (fn, sub, ftype)
            if sig not in seen:
                seen.add(sig)
                result_files.append({
                    **item_dict,
                    "filename": fn,
                    "subfolder": sub,
                    "type": ftype,
                    "_node_id": str(nid),
                })

        for node_id, out_data in outputs.items():
            if not isinstance(out_data, dict):
                continue
            for key, val in out_data.items():
                if key == "audio":
                    continue
                if isinstance(val, list):
                    for item in val:
                        if isinstance(item, dict) and "filename" in item:
                            _add_candidate(item, str(node_id))
                        elif isinstance(item, str) and "filename=" in item:
                            try:
                                qs = urllib.parse.parse_qs(urllib.parse.urlsplit(item).query)
                                fn_list = qs.get("filename", [])
                                if fn_list:
                                    _add_candidate(
                                        {
                                            "filename": fn_list[0],
                                            "subfolder": (qs.get("subfolder") or [""])[0],
                                            "type": (qs.get("type") or ["output"])[0],
                                        },
                                        str(node_id),
                                    )
                            except Exception:
                                pass

        # Prioritize node 208 / non-temp video files (.mp4, .webm, .mkv, .mov) first
        def _priority(item: dict) -> Tuple[int, int, int]:
            fn = str(item.get("filename", "")).lower()
            is_video = 0 if fn.endswith((".mp4", ".webm", ".mkv", ".mov")) else 1
            is_temp = 1 if item.get("type") == "temp" else 0
            is_final_node = 0 if item.get("_node_id") == "208" else 1
            return (is_temp, is_video, is_final_node)

        result_files.sort(key=_priority)
        return result_files

    def get_output_files(self, prompt_id: str) -> List[dict]:
        """Returns list of video or image output files produced by prompt_id."""
        try:
            hist = self.get_history(prompt_id)
            if prompt_id not in hist:
                return []
            return self.extract_outputs_from_history(hist[prompt_id])
        except Exception:
            return []

    def download_file(self, filename: str, subfolder: str = "", folder_type: str = "output", dest_path: str = "") -> str:
        """Downloads an output artifact from ComfyUI /view endpoint."""
        params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
        url = f"{self.base_url}/view?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "tA-VideoMaker"})
        max_bytes = 2 * (1024 ** 3)  # 2 GB safety cap
        copied = 0
        with urllib.request.urlopen(req, timeout=120) as resp, open(dest_path, "wb") as out_f:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                copied += len(chunk)
                if copied > max_bytes:
                    raise ValueError("ComfyUI output file exceeds 2 GB safety limit")
                out_f.write(chunk)
        return dest_path

    def _start_ws_progress_listener(self, prompt_id: str, ws_state: dict, ws_stop: threading.Event) -> None:
        """Listens to ComfyUI WebSocket events for live step-by-step progress."""
        if _ws_connect is None:
            return
        ws_base = self.base_url.replace("https://", "wss://").replace("http://", "ws://").rstrip("/")
        ws_url = f"{ws_base}/ws?clientId={self.client_id}"

        def _worker():
            try:
                with _ws_connect(ws_url, open_timeout=5, close_timeout=2) as ws:
                    ws_state["connected"] = True
                    while not ws_stop.is_set():
                        try:
                            raw = ws.recv(timeout=0.5)
                        except TimeoutError:
                            continue
                        except Exception:
                            break
                        if not isinstance(raw, str):
                            continue
                        try:
                            pkt = json.loads(raw)
                        except Exception:
                            continue
                        ev_type = pkt.get("type")
                        data = pkt.get("data") or {}
                        ev_pid = data.get("prompt_id")
                        if ev_pid and ev_pid != prompt_id:
                            continue

                        if ev_type == "execution_start":
                            ws_state["has_progress"] = True
                            ws_state["pct"] = max(ws_state["pct"], 12)
                            ws_state["msg"] = "ComfyUI startet Workflow..."
                        elif ev_type == "executing":
                            node = data.get("node")
                            if node is None and ev_pid == prompt_id:
                                ws_state["done"] = True
                                ws_state["pct"] = max(ws_state["pct"], 94)
                                ws_state["msg"] = "Video wird gespeichert..."
                                break
                            elif node is not None and not ws_state["sampling_started"]:
                                ws_state["has_progress"] = True
                                ws_state["pct"] = max(ws_state["pct"], 14)
                                ws_state["msg"] = f"ComfyUI lädt Modell / Node {node}..."
                        elif ev_type == "progress":
                            val = int(data.get("value") or 0)
                            mx = int(data.get("max") or 0)
                            if mx > 0:
                                ws_state["sampling_started"] = True
                                ws_state["has_progress"] = True
                                step_pct = int((val / mx) * 100)
                                ws_state["pct"] = min(92, 15 + int((val / mx) * 77))
                                ws_state["msg"] = f"Sampling Step {val}/{mx} ({step_pct}%)"
                        elif ev_type == "progress_state":
                            nodes = data.get("nodes") or {}
                            for n_info in nodes.values():
                                if isinstance(n_info, dict) and n_info.get("state") == "running":
                                    val = int(n_info.get("value") or 0)
                                    mx = int(n_info.get("max") or 0)
                                    if mx > 0:
                                        ws_state["sampling_started"] = True
                                        ws_state["has_progress"] = True
                                        step_pct = int((val / mx) * 100)
                                        ws_state["pct"] = min(92, 15 + int((val / mx) * 77))
                                        ws_state["msg"] = f"Sampling Step {val}/{mx} ({step_pct}%)"
                                        break
                        elif ev_type == "execution_error" and ev_pid == prompt_id:
                            ws_state["error"] = format_comfy_execution_error([["execution_error", data]])
                            break
            except Exception:
                pass

        t = threading.Thread(target=_worker, daemon=True)
        t.start()

    def wait_for_completion(
        self,
        prompt_id: str,
        timeout: float = 1200,
        poll_interval: float = 2.0,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> List[dict]:
        """Waits for ComfyUI prompt completion via live WebSocket progress + /history polling fallback."""
        start_time = time.time()
        last_step_key = None
        consecutive_net_errors = 0

        ws_state = {
            "connected": False,
            "has_progress": False,
            "sampling_started": False,
            "pct": 10,
            "msg": "ComfyUI startet...",
            "done": False,
            "error": None,
        }
        ws_stop = threading.Event()
        self._start_ws_progress_listener(prompt_id, ws_state, ws_stop)

        try:
            while time.time() - start_time < timeout:
                if cancel_check and cancel_check():
                    self.interrupt()
                    raise ComfyError("Generierung wurde vom Benutzer abgebrochen.")

                if ws_state.get("error"):
                    raise ComfyError(ws_state["error"])

                elapsed = int(time.time() - start_time)
                try:
                    hist = self.get_history(prompt_id, timeout=25)
                    consecutive_net_errors = 0
                except (ComfyError, urllib.error.URLError, socket.timeout, ConnectionError, OSError) as net_err:
                    consecutive_net_errors += 1
                    if consecutive_net_errors > 35:
                        raise ComfyError(f"Verbindung zu ComfyUI nach {consecutive_net_errors} Versuchen abgebrochen: {net_err}") from net_err

                    pct = ws_state["pct"] if ws_state["has_progress"] else min(92, max(10, int((elapsed / max(45, timeout * 0.35)) * 90)))
                    msg = f"{ws_state['msg']} ({elapsed}s)" if ws_state["has_progress"] else f"ComfyUI lädt Modell in VRAM... ({elapsed}s)"
                    step_key = (pct, msg)
                    if step_key != last_step_key:
                        last_step_key = step_key
                        if progress_callback:
                            progress_callback(pct, msg)
                    time.sleep(0.6 if ws_state["connected"] else poll_interval)
                    continue

                if prompt_id in hist:
                    prompt_data = hist[prompt_id]
                    status = prompt_data.get("status", {})
                    if status.get("status_str") == "error":
                        msgs = status.get("messages", [])
                        raise ComfyError(format_comfy_execution_error(msgs))

                    outputs = self.extract_outputs_from_history(prompt_data)
                    if outputs:
                        return outputs

                    if status.get("completed", False):
                        return outputs

                if ws_state["has_progress"]:
                    pct = ws_state["pct"]
                    msg = ws_state["msg"]
                else:
                    pct = min(92, max(10, int((elapsed / max(45, timeout * 0.4)) * 90)))
                    msg = f"ComfyUI generiert Frames... ({elapsed}s)"

                step_key = (pct, msg)
                if step_key != last_step_key:
                    last_step_key = step_key
                    if progress_callback:
                        progress_callback(pct, msg)

                time.sleep(0.5 if (ws_state["connected"] or ws_state["done"]) else poll_interval)

            raise ComfyError(f"Zeitüberschreitung ({int(timeout)}s) beim Warten auf ComfyUI Video-Generierung.")
        finally:
            ws_stop.set()

    def _get_all_model_search_roots(self, configured_comfy_dir: str = "") -> List[str]:
        """Resolves all candidate physical root directories containing models (models/ or ComfyUI/models)."""
        roots: List[str] = []

        def _add_if_dir(p: Optional[str]):
            if p and os.path.isdir(p):
                norm = os.path.abspath(p)
                if norm not in roots:
                    roots.append(norm)

        # 1. Configured directory from Settings
        if configured_comfy_dir and os.path.isdir(configured_comfy_dir):
            if os.path.basename(configured_comfy_dir.rstrip("/\\")).lower() == "models":
                _add_if_dir(configured_comfy_dir)
            else:
                _add_if_dir(os.path.join(configured_comfy_dir, "models"))
                _add_if_dir(os.path.join(configured_comfy_dir, "ComfyUI", "models"))
                _add_if_dir(configured_comfy_dir)

        # 2. Derive from ComfyUI Base Directory
        base_dir = self.get_comfy_base_dir(configured_comfy_dir)
        if base_dir and os.path.isdir(base_dir):
            _add_if_dir(os.path.join(base_dir, "models"))
            _add_if_dir(os.path.join(base_dir, "ComfyUI", "models"))
            # Check parent directory (common in portable / easy-install setups)
            parent = os.path.dirname(base_dir)
            if parent and os.path.isdir(parent):
                _add_if_dir(os.path.join(parent, "models"))
                parent_parent = os.path.dirname(parent)
                if parent_parent and os.path.isdir(parent_parent):
                    _add_if_dir(os.path.join(parent_parent, "models"))

            # Check extra_model_paths.yaml
            for yaml_cand in [
                os.path.join(base_dir, "extra_model_paths.yaml"),
                os.path.join(base_dir, "extra_model_paths.yaml.example"),
                os.path.join(parent, "extra_model_paths.yaml") if parent else "",
            ]:
                if yaml_cand and os.path.isfile(yaml_cand):
                    try:
                        with open(yaml_cand, "r", encoding="utf-8", errors="ignore") as yf:
                            for y_line in yf:
                                y_line = y_line.strip()
                                if y_line.startswith("base_path:") or "base_path" in y_line:
                                    parts = y_line.split(":", 1)
                                    if len(parts) > 1:
                                        p_val = parts[1].strip().strip("'\"")
                                        if os.path.isdir(p_val):
                                            _add_if_dir(p_val)
                                            _add_if_dir(os.path.join(p_val, "models"))
                    except Exception:
                        pass

        # 3. Environment Variables
        for env_key in ("COMFYUI_PATH", "COMFY_HOME"):
            if os.environ.get(env_key) and os.path.isdir(os.environ[env_key]):
                _add_if_dir(os.path.join(os.environ[env_key], "models"))

        # 4. Local App models fallback
        if getattr(sys, "frozen", False):
            app_root = os.path.dirname(os.path.abspath(sys.executable))
        else:
            app_root = os.path.dirname(os.path.abspath(__file__))
        _add_if_dir(os.path.abspath(os.path.join(app_root, "models")))

        return roots

    def _scan_disk_models_for_category(self, category: str) -> List[str]:
        """Scans disk folders for model files in subfolders, returning relative paths matching ComfyUI combo names."""
        category_dir_map = {
            "unets": ["diffusion_models", "unet"],
            "clips": ["text_encoders", "clip"],
            "vaes": ["vae"],
            "loras": ["loras", "lora"],
            "audio_encoders": ["audio_encoders"],
        }
        subdirs = category_dir_map.get(category, [category])
        valid_exts = {".safetensors", ".ckpt", ".pt", ".bin", ".gguf"}
        discovered: List[str] = []
        seen_keys: set = set()

        roots = self._get_all_model_search_roots()
        for r in roots:
            for sdir in subdirs:
                cat_root = os.path.join(r, sdir)
                if not os.path.isdir(cat_root):
                    continue
                try:
                    for root_w, dirs_w, files_w in os.walk(cat_root):
                        rel_depth = os.path.relpath(root_w, cat_root).count(os.sep)
                        if rel_depth > 4:
                            dirs_w[:] = []
                            continue
                        for fname in files_w:
                            ext = os.path.splitext(fname)[1].lower()
                            if ext in valid_exts:
                                full_p = os.path.join(root_w, fname)
                                try:
                                    if os.path.getsize(full_p) < 1024 * 1024:
                                        continue
                                except Exception:
                                    pass
                                rel_p = os.path.relpath(full_p, cat_root).replace("/", "\\")
                                key = rel_p.lower()
                                if key not in seen_keys:
                                    seen_keys.add(key)
                                    discovered.append(rel_p)
                except Exception:
                    pass
        return discovered

    def get_available_models(self) -> dict:
        """Queries ComfyUI for currently recognized unet, clip, vae, lora, and audio_encoder filenames,
        with automatic disk scan fallback for arbitrary user-defined subfolder structures."""
        res = {"unets": [], "clips": [], "vaes": [], "loras": [], "audio_encoders": []}
        try:
            u_info = self._request("/object_info/UNETLoader", timeout=8)
            spec = u_info.get("UNETLoader", {}).get("input", {}).get("required", {}).get("unet_name")
            res["unets"] = _extract_combo_options(spec) or []
            if not res["unets"]:
                d_info = self._request("/object_info/DiffusionModelLoader", timeout=8)
                spec = d_info.get("DiffusionModelLoader", {}).get("input", {}).get("required", {}).get("model_name")
                res["unets"] = _extract_combo_options(spec) or []
        except Exception:
            pass
        try:
            c_info = self._request("/object_info/CLIPLoader", timeout=8)
            spec = c_info.get("CLIPLoader", {}).get("input", {}).get("required", {}).get("clip_name")
            res["clips"] = _extract_combo_options(spec) or []
        except Exception:
            pass
        try:
            v_info = self._request("/object_info/VAELoader", timeout=8)
            spec = v_info.get("VAELoader", {}).get("input", {}).get("required", {}).get("vae_name")
            res["vaes"] = _extract_combo_options(spec) or []
        except Exception:
            pass
        try:
            l_info = self._request("/object_info/LoraLoader", timeout=8)
            spec = l_info.get("LoraLoader", {}).get("input", {}).get("required", {}).get("lora_name")
            res["loras"] = _extract_combo_options(spec) or []
        except Exception:
            pass
        try:
            a_info = self._request("/object_info/AudioEncoderLoader", timeout=8)
            spec = a_info.get("AudioEncoderLoader", {}).get("input", {}).get("required", {}).get("audio_encoder_name")
            res["audio_encoders"] = _extract_combo_options(spec) or []
        except Exception:
            pass

        # Supplement with disk scan so arbitrary subfolders (e.g. MINIMAX\, MINIMAX H3\, etc.) are always discovered
        for cat in ["unets", "clips", "vaes", "loras", "audio_encoders"]:
            disk_found = self._scan_disk_models_for_category(cat)
            existing_bases = {os.path.basename(str(x).replace("/", "\\")).lower() for x in res.get(cat, [])}
            existing_fulls = {str(x).replace("/", "\\").lower() for x in res.get(cat, [])}
            for df in disk_found:
                df_clean = df.replace("/", "\\")
                b_low = os.path.basename(df_clean).lower()
                f_low = df_clean.lower()
                if f_low not in existing_fulls and b_low not in existing_bases:
                    res[cat].append(df_clean)
                    existing_bases.add(b_low)
                    existing_fulls.add(f_low)

        return res

    def resolve_minimax_models(self) -> dict:
        """Resolves the exact installed filenames for MiniMax H3 models from ComfyUI."""
        avail = self.get_available_models()

        def _pick(
            candidates: List[str],
            available_list: List[str],
            default_val: str,
            fallback_keywords: Optional[List[str]] = None,
            exclude_keywords: Optional[List[str]] = None,
        ) -> str:
            norm_avail = {a.replace("\\", "/"): a for a in available_list}
            for cand in candidates:
                c_norm = cand.replace("\\", "/")
                if c_norm in norm_avail:
                    return norm_avail[c_norm]
                base_lower = os.path.basename(c_norm).lower()
                for k, orig in norm_avail.items():
                    if os.path.basename(k).lower() == base_lower:
                        return orig
            if fallback_keywords:
                for k, orig in norm_avail.items():
                    b_low = os.path.basename(k).lower()
                    if all(kw.lower() in b_low for kw in fallback_keywords):
                        if exclude_keywords and any(ex.lower() in b_low for ex in exclude_keywords):
                            continue
                        return orig
            return default_val

        chosen_unet = _pick(
            [
                "fastvideo_fasth3_8step_v2_pruned_int8_convrot.safetensors",
                "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                "minimax_h3_hybrid_fl2va_ref2va_b30-49-int8.safetensors",
                "MiniMax_H3_Ref2VA_pruned_int8_convrot.safetensors",
                "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
                "minimax_h3_fl2va_bf16.safetensors",
                "minimax_h3_ref2va_bf16.safetensors",
            ],
            avail.get("unets", []),
            "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
            fallback_keywords=["fasth3"],
        )
        if chosen_unet == "minimax_h3_fl2va_pruned_int8_convrot.safetensors" and chosen_unet not in avail.get("unets", []):
            chosen_unet = _pick([], avail.get("unets", []), chosen_unet, fallback_keywords=["minimax"])

        # Avoid nvfp4 emulation on pre-Blackwell GPUs (e.g. RTX 3090/4090) when native int4/int8 is available.
        is_blackwell = False
        try:
            gpu_low = (self.get_hardware_profile().get("gpu_name") or "").lower()
            is_blackwell = any(tag in gpu_low for tag in ("5090", "5080", "5070", "rtx 50", "blackwell", "b100", "b200"))
        except Exception:
            pass

        clip_candidates = (
            [
                "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                "qwen3vl_32b_minimax_h3_int4_convrot.safetensors",
                "qwen3vl_32b_minimax_h3_int8_convrot.safetensors",
                "qwen3vl_32b_minimax_h3_bf16.safetensors",
            ]
            if is_blackwell
            else [
                "qwen3vl_32b_minimax_h3_int4_convrot.safetensors",
                "qwen3vl_32b_minimax_h3_int8_convrot.safetensors",
                "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                "qwen3vl_32b_minimax_h3_bf16.safetensors",
            ]
        )
        chosen_clip = _pick(
            clip_candidates,
            avail.get("clips", []),
            "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
            fallback_keywords=["qwen3vl", "minimax"],
        )

        chosen_vae = _pick(
            [
                "minimax_h3_video_vae_fp16.safetensors",
                "minimax_h3_video_vae_bf16.safetensors",
                "minimax_h3_video_vae_int8_convrot.safetensors",
                "minimax_h3_video_vae.safetensors",
                "minimax_video_vae_fp16.safetensors",
                "minimax_video_vae.safetensors",
                "minimax_h3_vae_fp16.safetensors",
                "minimax_h3_vae.safetensors",
                "minimax_vae.safetensors",
            ],
            avail.get("vaes", []),
            "minimax_h3_video_vae_fp16.safetensors",
            fallback_keywords=["minimax"],
            exclude_keywords=["audio", "sound"],
        )

        chosen_audio_vae = _pick(
            [
                "minimax_h3_audio_vae_fp32.safetensors",
                "minimax_h3_audio_vae_fp16.safetensors",
                "minimax_h3_audio_vae.safetensors",
                "minimax_audio_vae.safetensors",
            ],
            avail.get("vaes", []),
            "minimax_h3_audio_vae_fp32.safetensors",
            fallback_keywords=["minimax", "audio"],
        )

        is_8step_unet = ("8step" in chosen_unet.lower() or "fasth3" in chosen_unet.lower())
        if is_8step_unet:
            chosen_lora = "None"
        else:
            chosen_lora = _pick(
                [
                    "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
                ],
                avail.get("loras", []),
                "None",
                fallback_keywords=["minimax", "turbo"],
            )

        chosen_audio_enc = _pick(
            [
                "wav2vec2_large_english_fp16.safetensors",
            ],
            avail.get("audio_encoders", []),
            "wav2vec2_large_english_fp16.safetensors",
            fallback_keywords=["wav2vec2"],
        )

        return {
            "unet": chosen_unet,
            "clip": chosen_clip,
            "vae": chosen_vae,
            "audio_vae": chosen_audio_vae,
            "lora": chosen_lora,
            "audio_encoder": chosen_audio_enc,
            "is_8step_unet": is_8step_unet,
        }

    def ensure_minimax_vaes(
        self,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Tuple[bool, str]:
        """Automatically downloads missing MiniMax H3 Video VAE and Audio VAE if absent."""
        avail = self.get_available_models()
        avail_vaes = [os.path.basename(str(v).replace("\\", "/")).lower() for v in avail.get("vaes", [])]

        vae_specs = [
            {
                "filename": "minimax_h3_video_vae_fp16.safetensors",
                "label": "MiniMax H3 Video VAE (FP16)",
                "size_mb": 400,
                "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors",
            },
            {
                "filename": "minimax_h3_audio_vae_fp32.safetensors",
                "label": "MiniMax H3 Audio VAE (FP32)",
                "size_mb": 300,
                "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors",
            },
        ]

        roots = self._get_all_model_search_roots()
        target_vae_dir = None
        for r in roots:
            candidate = r if os.path.basename(r.rstrip("/\\")).lower() == "vae" else os.path.join(r, "vae")
            if os.path.isdir(candidate):
                target_vae_dir = candidate
                break
        if not target_vae_dir:
            if roots:
                target_vae_dir = os.path.join(roots[0], "vae")
            else:
                target_vae_dir = os.path.abspath(os.path.join("models", "vae"))
        os.makedirs(target_vae_dir, exist_ok=True)

        downloaded_any = False
        import urllib.request

        for spec in vae_specs:
            fname = spec["filename"]
            floc = os.path.join(target_vae_dir, fname)
            if fname.lower() in avail_vaes or (os.path.isfile(floc) and os.path.getsize(floc) > 50 * 1024 * 1024):
                continue

            if progress_callback:
                progress_callback(1, f"Lade {spec['label']} automatisch herunter (~{spec['size_mb']} MB)...")

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            }
            temp_path = floc + ".download"
            try:
                req = urllib.request.Request(spec["url"], headers=headers)
                with urllib.request.urlopen(req, timeout=60) as resp, open(temp_path, "wb") as out_f:
                    total_bytes = int(resp.headers.get("Content-Length", 0))
                    downloaded_b = 0
                    last_pct = 0
                    while True:
                        chunk = resp.read(1024 * 512)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        downloaded_b += len(chunk)
                        if total_bytes > 0:
                            pct = int((downloaded_b / total_bytes) * 100)
                            if pct != last_pct and pct % 5 == 0:
                                last_pct = pct
                                if progress_callback:
                                    progress_callback(
                                        max(1, min(99, pct)),
                                        f"Lade {spec['label']}: {pct}% ({downloaded_b // (1024 * 1024)}/{total_bytes // (1024 * 1024)} MB)..."
                                    )
                if os.path.isfile(temp_path) and os.path.getsize(temp_path) > 10 * 1024 * 1024:
                    if os.path.isfile(floc):
                        try:
                            os.remove(floc)
                        except Exception:
                            pass
                    os.rename(temp_path, floc)
                    downloaded_any = True
                else:
                    if os.path.isfile(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception:
                            pass
                    return False, f"Heruntergeladene Datei {fname} ist unvollständig oder ungültig."
            except Exception as ex:
                if os.path.isfile(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass
                return False, f"Automatischer Download von {spec['label']} fehlgeschlagen: {ex}"

        if downloaded_any:
            try:
                self._request("/object_info/VAELoader", timeout=10)
            except Exception:
                pass
            if progress_callback:
                progress_callback(100, "MiniMax VAEs erfolgreich eingerichtet.")

        return True, "VAEs bereit."

    def check_minimax_render_prerequisites(
        self,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Tuple[bool, str, dict]:
        """
        Validates that required MiniMax H3 models (UNET, CLIP, VAE, Audio VAE)
        are actually detected in ComfyUI prior to dispatching a render job.
        Automatically downloads missing VAEs if absent.
        Returns: (is_ok, error_message, resolved_dict)
        """
        resolved = self.resolve_minimax_models()
        avail = self.get_available_models()

        avail_vaes = [os.path.basename(str(v).replace("\\", "/")).lower() for v in avail.get("vaes", [])]
        avail_unets = [os.path.basename(str(u).replace("\\", "/")).lower() for u in avail.get("unets", [])]
        avail_clips = [os.path.basename(str(c).replace("\\", "/")).lower() for c in avail.get("clips", [])]

        chosen_vae = resolved.get("vae", "")
        chosen_vae_base = os.path.basename(chosen_vae).lower()
        chosen_audio_vae = resolved.get("audio_vae", "")
        chosen_audio_vae_base = os.path.basename(chosen_audio_vae).lower()

        # If any VAE is missing, attempt auto-download
        need_download_vae = (chosen_vae_base not in avail_vaes) or (chosen_audio_vae_base not in avail_vaes)
        if need_download_vae:
            if progress_callback:
                progress_callback(2, "Fehlende MiniMax VAEs werden automatisch geladen...")
            vae_ok, vae_msg = self.ensure_minimax_vaes(progress_callback=progress_callback)
            if not vae_ok:
                print(f"[MiniMax] Auto-Download Warnung: {vae_msg}")
            # Re-fetch models after download attempt
            avail = self.get_available_models()
            avail_vaes = [os.path.basename(str(v).replace("\\", "/")).lower() for v in avail.get("vaes", [])]
            resolved = self.resolve_minimax_models()
            chosen_vae = resolved.get("vae", "")
            chosen_vae_base = os.path.basename(chosen_vae).lower()
            chosen_audio_vae = resolved.get("audio_vae", "")
            chosen_audio_vae_base = os.path.basename(chosen_audio_vae).lower()

        missing = []

        # If vaes list was successfully retrieved from ComfyUI
        if avail.get("vaes") is not None and len(avail.get("vaes", [])) > 0:
            if chosen_vae_base not in avail_vaes:
                missing.append(
                    f"• Video-VAE fehlt: '{chosen_vae}'\n"
                    f"  -> Speicherort: ComfyUI/models/vae/\n"
                    f"  -> Behebung: Im tA-VideoMaker Modell-Manager herunterladen (MiniMax H3 Video VAE)"
                )

        if avail.get("vaes") is not None and len(avail.get("vaes", [])) > 0:
            if chosen_audio_vae_base not in avail_vaes:
                missing.append(
                    f"• Audio-VAE fehlt: '{chosen_audio_vae}'\n"
                    f"  -> Speicherort: ComfyUI/models/vae/\n"
                    f"  -> Behebung: Im tA-VideoMaker Modell-Manager herunterladen (MiniMax H3 Audio VAE)"
                )

        chosen_unet = resolved.get("unet", "")
        chosen_unet_base = os.path.basename(chosen_unet).lower()
        if avail.get("unets") is not None and len(avail.get("unets", [])) > 0:
            if chosen_unet_base not in avail_unets:
                missing.append(
                    f"• Diffusion-Modell (UNET) fehlt: '{chosen_unet}'\n"
                    f"  -> Speicherort: ComfyUI/models/diffusion_models/ oder models/unet/\n"
                    f"  -> Behebung: Im Modell-Manager herunterladen"
                )

        chosen_clip = resolved.get("clip", "")
        chosen_clip_base = os.path.basename(chosen_clip).lower()
        if avail.get("clips") is not None and len(avail.get("clips", [])) > 0:
            if chosen_clip_base not in avail_clips:
                missing.append(
                    f"• Text-Encoder (CLIP) fehlt: '{chosen_clip}'\n"
                    f"  -> Speicherort: ComfyUI/models/text_encoders/ oder models/clip/\n"
                    f"  -> Behebung: Im Modell-Manager herunterladen"
                )

        if missing:
            msg = (
                "ComfyUI Rendering kann nicht gestartet werden, da erforderliche Modelldateien in ComfyUI fehlen:\n\n"
                + "\n\n".join(missing)
                + "\n\nBitte öffne den Modell-Manager in tA-VideoMaker (Zahnrad / Modelle) und lade die fehlenden Modelle herunter, "
                "oder kopiere die entsprechenden Dateien in den jeweiligen ComfyUI/models Ordner."
            )
            return False, msg, resolved

        return True, "", resolved

        return True, "", resolved

    def build_director_storyboard_workflow(
        self,
        scenes: List[dict],
        width: int = 1280,
        height: int = 704,
        seed: int = 424242,
        steps: int = 20,
        music_style: str = "",
        turbo: bool = True,
    ) -> dict:
        """Constructs an official MiniMax H3 Director storyboard workflow."""
        resolved = self.resolve_minimax_models()
        chosen_unet = resolved["unet"]
        chosen_clip = resolved["clip"]
        chosen_vae = resolved["vae"]
        chosen_audio_vae = resolved["audio_vae"]
        chosen_lora = resolved.get("lora", "None")
        use_turbo_lora = bool(turbo and not resolved.get("is_8step_unet") and chosen_lora and chosen_lora != "None")
        if (turbo and resolved.get("is_8step_unet")) or use_turbo_lora:
            steps = min(int(steps), 8)

        shots_list = []
        curr_t = 0.0
        context_image_nodes = {}
        image_connector_links = {}
        next_node_id = 9
        image_counter = 1

        for idx, sc in enumerate(scenes):
            dur = float(sc.get("duration", 4.0))
            shot_media = []

            # Process First Frame (Start Frame / Keyframe)
            ff_path = sc.get("first_frame")
            has_ff = bool(ff_path and os.path.isfile(ff_path))
            if has_ff:
                try:
                    ff_comfy_name = self.upload_image(ff_path)
                    node_id = str(next_node_id)
                    next_node_id += 1
                    ctx_id = f"ctx_s{idx + 1}_first"

                    context_image_nodes[node_id] = {
                        "class_type": "NGContextImage",
                        "inputs": {
                            "image": ff_comfy_name,
                            "name": sc.get("subject_name") or f"Shot_{idx + 1}_Start",
                            "description": "Opening keyframe (<Picture 1> / <Subject 1>)",
                            "content": "scene",
                            "usage": "first_frame",
                            "preserve": "high",
                            "context_id": ctx_id,
                            "color": "",
                        }
                    }
                    image_connector_links[f"context_image.image_{image_counter - 1}"] = [node_id, 0]
                    image_connector_links[f"image_{image_counter}"] = [node_id, 0]
                    image_counter += 1

                    shot_media.append({
                        "schema_version": 1,
                        "context_id": ctx_id,
                        "role": "first_frame",
                    })
                except Exception as ex:
                    print(f"[Director] Startframe Upload fehlgeschlagen: {ex}")

            # Process Last Frame (End Frame / Target Keyframe)
            lf_path = sc.get("last_frame")
            has_lf = bool(lf_path and os.path.isfile(lf_path))
            if has_lf:
                try:
                    lf_comfy_name = self.upload_image(lf_path)
                    node_id = str(next_node_id)
                    next_node_id += 1
                    ctx_id = f"ctx_s{idx + 1}_last"

                    context_image_nodes[node_id] = {
                        "class_type": "NGContextImage",
                        "inputs": {
                            "image": lf_comfy_name,
                            "name": f"Shot_{idx + 1}_End",
                            "description": "Ending keyframe (<Picture 2>)",
                            "content": "scene",
                            "usage": "last_frame",
                            "preserve": "high",
                            "context_id": ctx_id,
                            "color": "",
                        }
                    }
                    image_connector_links[f"context_image.image_{image_counter - 1}"] = [node_id, 0]
                    image_connector_links[f"image_{image_counter}"] = [node_id, 0]
                    image_counter += 1

                    shot_media.append({
                        "schema_version": 1,
                        "context_id": ctx_id,
                        "role": "last_frame",
                    })
                except Exception as ex:
                    print(f"[Director] Endframe Upload fehlgeschlagen: {ex}")

            cam_preset = str(sc.get("camera_preset", "") or "")
            cam_text = H3_CAMERA_PRESETS.get(cam_preset, str(sc.get("camera_instruction", "") or ""))
            dlg_text = str(sc.get("dialogue", "") or "").strip()
            dlg_lang = str(sc.get("dialogue_lang", "German") or "German")
            subj_name = str(sc.get("subject_name", "") or "").strip()

            formatted_shot_text = format_h3_structured_prompt(
                visual_prompt=sc.get("prompt", "") or f"Cinematic shot {idx + 1}",
                subject_name=subj_name,
                has_first_image=has_ff,
                has_second_image=has_lf,
                dialogue_text=dlg_text,
                dialogue_lang=dlg_lang,
                camera_instruction=cam_text,
                music_style="",
            )

            spoken_entries = []
            if dlg_text:
                spoken_entries.append({
                    "speaker": subj_name or "S1",
                    "language": "English" if dlg_lang.lower().startswith("en") else "German",
                    "text": dlg_text,
                })

            shots_list.append({
                "id": f"s{idx + 1}",
                "start": round(curr_t, 2),
                "end": round(curr_t + dur, 2),
                "text": formatted_shot_text,
                "media": shot_media,
                "spoken": spoken_entries,
                "locked_fields": [],
                "draft": None,
            })
            curr_t += dur

        shots_payload = json.dumps({
            "format": "h3-director-shots",
            "schema_version": 1,
            "shots": shots_list,
            "look": "Cinematic live action, 8k, natural lighting, anamorphic lens",
        })

        w = (width // 32) * 32
        h = (height // 32) * 32
        clean_music = (music_style or "").strip()

        wf = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": chosen_unet,
                    "weight_dtype": "default",
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": chosen_clip,
                    "type": "minimax",
                }
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_vae,
                }
            },
            "4": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_audio_vae,
                }
            },
            "5": {
                "class_type": "NGContextConnector",
                "inputs": {
                    "clip": ["2", 0],
                    "vae": ["3", 0],
                    "video_vae": ["3", 0],
                    "vae_video": ["3", 0],
                    "audio_vae": ["4", 0],
                    "vae_audio": ["4", 0],
                    "model": ["1", 0],
                    "model_fl2va": ["1", 0],
                    "model_ref2va": ["1", 0],
                    **image_connector_links,
                }
            },
            "6": {
                "class_type": "NGH3Director",
                "inputs": {
                    "context": ["5", 0],
                    "idea": scenes[0].get("prompt", "Cinematic Film"),
                    "shots": shots_payload,
                    "project_seconds": round(curr_t, 2),
                    "chunk_seconds": 0.0,
                    "width": w,
                    "height": h,
                    "mode": "auto",
                    "continuity": "video_audio",
                    "pin_frames": "22",
                    "soundscape": clean_music or "ambient cinematic soundscape",
                    "music": clean_music,
                    "style": "None",
                    "seed": seed,
                    "steps": steps,
                    "sampler_name": "res_multistep",
                    "scheduler": "simple",
                    "shift_video": 12.0,
                    "shift_audio": 3.0,
                    "turbo": bool(use_turbo_lora),
                    "turbo_lora_fl2va": chosen_lora if use_turbo_lora else "none",
                    "turbo_lora_ref2va": chosen_lora if use_turbo_lora else "none",
                    "resize_method": "crop",
                    "ref_image_size": "match",
                }
            },
            "7": {
                "class_type": "NGProjectRender",
                "inputs": {
                    "sequence": ["6", 0],
                }
            },
            "8": {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": ["7", 0],
                    "filename_prefix": f"tA_VideoMaker_{uuid.uuid4().hex[:8]}",
                    "format": "auto",
                }
            },
            **context_image_nodes,
        }
        return wf

    def render_storyboard_ai(
        self,
        scenes: List[dict],
        resolution: str,
        fps: int,
        seed: int,
        dest_path: str,
        music_style: str = "",
        turbo: bool = True,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Renders an entire multi-scene storyboard using MiniMax H3 Director."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        is_ok, err_msg, _ = self.check_minimax_render_prerequisites(progress_callback=progress_callback)
        if not is_ok:
            return False, err_msg

        if not self.check_minimax_director_node():
            if progress_callback:
                progress_callback(2, "Richte MiniMax H3 Director Erweiterung automatisch ein...")
            ready, msg, needs_restart = self.ensure_director_node()
            if not ready:
                return False, msg

        res_map = {
            "480p": (832, 480),
            "512x512": (512, 512),
            "720p": (1280, 704),
            "1080p": (1920, 1088),
            # Portrait (9:16)
            "480p_portrait": (480, 832),
            "720p_portrait": (704, 1280),
            "1080p_portrait": (1088, 1920),
            "480x832": (480, 832),
            "720x1280": (704, 1280),
            "1080x1920": (1088, 1920),
        }
        w, h = res_map.get(resolution, (1280, 704))

        if progress_callback:
            progress_callback(5, "Initialisiere MiniMax H3 Director Storyboard...")

        workflow = self.build_director_storyboard_workflow(
            scenes=scenes,
            width=w,
            height=h,
            seed=seed,
            steps=20,
            music_style=music_style,
            turbo=turbo,
        )

        if progress_callback:
            progress_callback(10, "Reiht Film-Workflow in ComfyUI ein...")

        try:
            prompt_id = self.queue_prompt(workflow)
        except Exception as ex:
            return False, f"ComfyUI Prompt-Validierung fehlgeschlagen: {ex}"

        try:
            outputs = self.wait_for_completion(
                prompt_id=prompt_id,
                timeout=3600,
                progress_callback=progress_callback,
                cancel_check=cancel_check,
            )
        except Exception as ex:
            return False, f"ComfyUI Rendering fehlgeschlagen: {ex}"

        if not outputs:
            # Fallback: check ComfyUI output directory directly
            try:
                win_out = self.get_comfy_output_dir()
                if win_out and os.path.isdir(win_out):
                    files = sorted(
                        [os.path.join(win_out, f) for f in os.listdir(win_out) if f.startswith("tA_VideoMaker") and f.endswith((".mp4", ".mkv", ".webm"))],
                        key=os.path.getmtime,
                        reverse=True,
                    )
                    if files:
                        shutil.copyfile(files[0], dest_path)
                        try:
                            if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                                os.remove(files[0])
                        except Exception:
                            pass
                        return True, dest_path
            except Exception:
                pass
            return False, "ComfyUI hat die Generierung beendet, aber keine Ausgabedatei erzeugt."

        target_file = outputs[0]
        for out_item in outputs:
            fn = out_item.get("filename", "")
            if fn.endswith((".mp4", ".webm", ".mkv", ".mov")):
                target_file = out_item
                break

        if progress_callback:
            progress_callback(95, "Lade fertigen Film herunter...")

        try:
            # Direct copy if physical ComfyUI output directory is accessible
            c_dir = self.get_comfy_output_dir()
            fname = target_file.get("filename")
            sub = target_file.get("subfolder", "")
            if c_dir:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    shutil.copyfile(cand, dest_path)
                    try:
                        if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                            os.remove(cand)
                    except Exception:
                        pass
                    return True, dest_path

            self.download_file(
                filename=fname,
                subfolder=sub,
                folder_type=target_file.get("type", "output"),
                dest_path=dest_path,
            )
            if c_dir:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    try:
                        os.remove(cand)
                    except Exception:
                        pass
            return True, dest_path
        except Exception as ex:
            return False, f"Download des fertigen Films fehlgeschlagen: {ex}"

    # ------------------------------------------------------------------
    # Optional BExplains RefPacks + MiniMax H3 RefPacks Integration
    # ------------------------------------------------------------------
    def has_refpacks_support(self) -> bool:
        """Returns True when both ComfyUI-RefPacks and ComfyUI-MiniMax-H3-RefPacks are loaded."""
        return (
            self.check_node_exists("BExplainsLoadRefPack")
            and self.check_node_exists("BExplainsAddRefPack")
            and self.check_node_exists("BExplainsRefPackToH3")
        )

    def get_refpacks_dir(self, configured_comfy_dir: str = "") -> Optional[str]:
        """Returns ComfyUI/models/refpacks if a ComfyUI base directory can be resolved."""
        base = self.get_comfy_base_dir(configured_comfy_dir)
        if not base:
            return None
        return os.path.join(base, "models", "refpacks")

    def list_refpacks(self, configured_comfy_dir: str = "") -> dict:
        """Lists available individual RefPacks (.safetensors) and reference bundles."""
        packs: List[str] = []
        bundles: List[str] = []
        installed = self.has_refpacks_support() if self.is_alive() else False

        if self.is_alive():
            try:
                info = self._request("/object_info/BExplainsLoadRefPack", timeout=10)
                node_info = info.get("BExplainsLoadRefPack", {}) if isinstance(info, dict) else {}
                req = node_info.get("input", {}).get("required", {})
                opts = _extract_combo_options(req.get("filename"))
                if opts:
                    packs = sorted({str(x) for x in opts if str(x).endswith(".safetensors") and not str(x).endswith(".references.safetensors")})
            except Exception:
                pass
            try:
                b_info = self._request("/object_info/BExplainsLoadRefPacksReferences", timeout=10)
                b_node = b_info.get("BExplainsLoadRefPacksReferences", {}) if isinstance(b_info, dict) else {}
                b_req = b_node.get("input", {}).get("required", {})
                b_opts = _extract_combo_options(b_req.get("filename"))
                if b_opts:
                    bundles = sorted({str(x) for x in b_opts if str(x).endswith(".references.safetensors")})
            except Exception:
                pass

        rp_dir = self.get_refpacks_dir(configured_comfy_dir)
        if rp_dir and os.path.isdir(rp_dir):
            disk_packs: List[str] = []
            disk_bundles: List[str] = []
            for root, _dirs, files in os.walk(rp_dir):
                for fn in files:
                    if not fn.endswith(".safetensors"):
                        continue
                    rel = os.path.relpath(os.path.join(root, fn), rp_dir).replace("\\", "/")
                    if fn.endswith(".references.safetensors"):
                        rel_b = rel[len("references/"):] if rel.startswith("references/") else rel
                        disk_bundles.append(rel_b)
                    else:
                        disk_packs.append(rel)
            if not packs:
                packs = sorted(set(disk_packs))
            if not bundles:
                bundles = sorted(set(disk_bundles))

        return {
            "installed": installed,
            "refpacks_dir": rp_dir,
            "refpacks": packs,
            "bundles": bundles,
        }

    def encode_image_refpack(
        self,
        image_paths: List[str],
        pack_name: str,
        reference_megapixels: float = 0.3,
        overwrite: bool = False,
        use_image_vae: bool = False,
    ) -> Tuple[bool, str]:
        """Encodes one or more images into a reusable .safetensors RefPack using existing H3 VAEs."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar."
        if not (self.check_node_exists("BExplainsH3EncodeImages") and self.check_node_exists("BExplainsSaveRefPack")):
            return False, "Die optionalen RefPacks-Extensions (ComfyUI-RefPacks & ComfyUI-MiniMax-H3-RefPacks) sind in ComfyUI nicht aktiv."

        valid_paths = [p for p in image_paths if p and os.path.isfile(p)]
        if not valid_paths:
            return False, "Keine gültige Bilddatei zum Encoden gefunden."

        clean_name = re.sub(r"[^a-zA-Z0-9_\-/]", "_", (pack_name or "").strip()).strip("/_")
        if not clean_name:
            clean_name = f"refpack_{int(time.time())}"

        chosen_vae = None
        if use_image_vae:
            try:
                img_models = self.resolve_minimax_image_models()
                chosen_vae = img_models.get("vae")
            except Exception:
                chosen_vae = None
        if not chosen_vae:
            resolved = self.resolve_minimax_models()
            chosen_vae = resolved.get("vae")
        if not chosen_vae:
            return False, "Kein MiniMax H3 VAE in ComfyUI gefunden."

        wf: dict = {
            "1": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": chosen_vae},
            }
        }
        img_refs: List[list] = []
        for idx, p in enumerate(valid_paths):
            up_name = self.upload_image(p)
            nid = str(10 + idx)
            wf[nid] = {"class_type": "LoadImage", "inputs": {"image": up_name}}
            img_refs.append([nid, 0])

        images_out = img_refs[0]
        if len(img_refs) > 1 and self.check_node_exists("ImageBatch"):
            cur = img_refs[0]
            for idx, nxt in enumerate(img_refs[1:]):
                bid = f"batch_{idx}"
                wf[bid] = {
                    "class_type": "ImageBatch",
                    "inputs": {"image1": cur, "image2": nxt},
                }
                cur = [bid, 0]
            images_out = cur

        wf["2"] = {
            "class_type": "BExplainsH3EncodeImages",
            "inputs": {
                "vae": ["1", 0],
                "images": images_out,
                "name": clean_name,
                "reference_megapixels": max(0.05, min(4.0, float(reference_megapixels))),
            },
        }
        wf["3"] = {
            "class_type": "BExplainsSaveRefPack",
            "inputs": {
                "refpack": ["2", 0],
                "filename": clean_name,
                "overwrite": bool(overwrite),
            },
        }

        try:
            prompt_id = self.queue_prompt(wf)
            self.wait_for_completion(prompt_id, timeout=300)
            saved = clean_name if clean_name.endswith(".safetensors") else f"{clean_name}.safetensors"
            return True, saved
        except Exception as ex:
            return False, f"RefPack-Encoding fehlgeschlagen: {ex}"

    def _attach_refpacks_to_h3_workflow(
        self,
        wf: dict,
        model_out: list,
        clip_out: list,
        vae_out: list,
        refpacks: List[dict],
        prompt: str,
        width: int,
        height: int,
        length: int,
        generation_mode: str = "Auto",
        auto_outfit: bool = True,
        negative_prompt: str = "",
        node_prefix: str = "rp",
    ) -> Tuple[list, list, list, list, list]:
        """Wires LoadRefPack -> AddRefPack -> RefPackToH3 into an existing H3 workflow dict."""
        if not self.has_refpacks_support():
            raise RuntimeError(
                "RefPacks wurden ausgewählt, aber 'ComfyUI-RefPacks' / 'ComfyUI-MiniMax-H3-RefPacks' "
                "sind in ComfyUI nicht installiert oder nicht neu gestartet."
            )

        valid_roles = {"subject", "character", "item", "video", "motion", "outfit", "location", "reference", "audio", "style"}
        prev_refs = None
        for idx, item in enumerate(refpacks):
            if isinstance(item, str):
                fname = item.strip()
                role = "character"
            elif isinstance(item, dict):
                fname = str(item.get("filename") or "").strip()
                role = str(item.get("role") or "character").lower().strip()
            else:
                continue
            if not fname:
                continue
            if role not in valid_roles:
                role = "reference"

            load_id = f"{node_prefix}_load_{idx}"
            add_id = f"{node_prefix}_add_{idx}"
            wf[load_id] = {
                "class_type": "BExplainsLoadRefPack",
                "inputs": {
                    "filename": fname,
                    "enabled": True,
                },
            }
            add_inputs: dict = {
                "refpack": [load_id, 0],
                "role": role,
            }
            if prev_refs is not None:
                add_inputs["references"] = prev_refs
            wf[add_id] = {
                "class_type": "BExplainsAddRefPack",
                "inputs": add_inputs,
            }
            prev_refs = [add_id, 0]

        if prev_refs is None:
            raise ValueError("Keine gültigen RefPack-Dateinamen übergeben.")

        enc_id = f"{node_prefix}_h3_enc"
        wf[enc_id] = {
            "class_type": "BExplainsRefPackToH3",
            "inputs": {
                "model": model_out,
                "clip": clip_out,
                "references": prev_refs,
                "vae": vae_out,
                "prompt": prompt or "Cinematic scene, high quality, natural lighting",
                "negative_prompt": negative_prompt or "",
                "width": int(width),
                "height": int(height),
                "length": int(length),
                "auto_outfit": bool(auto_outfit),
                "generation_mode": generation_mode,
                "log_performance": True,
                "compress_motion": False,
                "allow_raw_prompt": False,
            },
        }
        # Outputs: (model, positive, negative, latent, reference_map_and_prompt, vae)
        return [enc_id, 0], [enc_id, 1], [enc_id, 2], [enc_id, 3], [enc_id, 5]

    def build_native_quick_clip_workflow(
        self,
        prompt: str,
        duration: float = 4.0,
        fps: int = 24,
        width: int = 1280,
        height: int = 704,
        seed: int = 424242,
        first_frame_path: Optional[str] = None,
        last_frame_path: Optional[str] = None,
        turbo: bool = True,
        extra_lora: Optional[str] = None,
        extra_lora_strength: float = 0.85,
        refpacks: Optional[List[dict]] = None,
    ) -> dict:
        """Constructs a native ComfyUI MiniMax H3 image/text-to-video workflow."""
        resolved = self.resolve_minimax_models()
        chosen_unet = resolved["unet"]
        chosen_clip = resolved["clip"]
        chosen_vae = resolved["vae"]
        chosen_audio_vae = resolved["audio_vae"]
        chosen_lora = resolved.get("lora", "None")
        use_turbo_lora = bool(
            turbo and not resolved.get("is_8step_unet") and chosen_lora and chosen_lora != "None"
        )
        steps = 8 if (resolved.get("is_8step_unet") or use_turbo_lora) else 20
        length = max(17, int(round(duration * fps)))
        w = (width // 32) * 32
        h = (height // 32) * 32

        wf = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": chosen_unet,
                    "weight_dtype": "default",
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": chosen_clip,
                    "type": "minimax",
                }
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_vae,
                }
            },
            "4": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_audio_vae,
                }
            },
        }

        model_out = ["1", 0]
        clip_out = ["2", 0]
        if use_turbo_lora:
            wf["1_lora"] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "model": model_out,
                    "clip": clip_out,
                    "lora_name": chosen_lora,
                    "strength_model": 1.0,
                    "strength_clip": 1.0,
                }
            }
            model_out = ["1_lora", 0]
            clip_out = ["1_lora", 1]

        if extra_lora and extra_lora != "None":
            strength = max(0.0, min(1.5, float(extra_lora_strength)))
            wf["1_extra_lora"] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "model": model_out,
                    "clip": clip_out,
                    "lora_name": extra_lora,
                    "strength_model": strength,
                    "strength_clip": strength,
                }
            }
            model_out = ["1_extra_lora", 0]
            clip_out = ["1_extra_lora", 1]

        # Handle optional RefPacks OR standard input keyframes
        if refpacks:
            model_out, pos_cond, neg_cond, lat_out, vae_out = self._attach_refpacks_to_h3_workflow(
                wf=wf,
                model_out=model_out,
                clip_out=clip_out,
                vae_out=["3", 0],
                refpacks=refpacks,
                prompt=prompt or "Cinematic scene, high quality, natural lighting",
                width=w,
                height=h,
                length=length,
                generation_mode="Video",
            )
        else:
            h3_inputs = {
                "clip": clip_out,
                "vae": ["3", 0],
                "prompt": prompt or "Cinematic scene, high quality, natural lighting",
                "width": w,
                "height": h,
                "length": length,
            }

            if first_frame_path and os.path.isfile(first_frame_path):
                try:
                    ff_name = self.upload_image(first_frame_path)
                    wf["5"] = {
                        "class_type": "LoadImage",
                        "inputs": {"image": ff_name}
                    }
                    wf["5_scale"] = {
                        "class_type": "ImageScale",
                        "inputs": {
                            "image": ["5", 0],
                            "upscale_method": "lanczos",
                            "width": w,
                            "height": h,
                            "crop": "center",
                        }
                    }
                    h3_inputs["first_frame"] = ["5_scale", 0]
                except Exception as ex:
                    print(f"[QuickClip] First frame upload error: {ex}")

            if last_frame_path and os.path.isfile(last_frame_path):
                try:
                    lf_name = self.upload_image(last_frame_path)
                    wf["6"] = {
                        "class_type": "LoadImage",
                        "inputs": {"image": lf_name}
                    }
                    wf["6_scale"] = {
                        "class_type": "ImageScale",
                        "inputs": {
                            "image": ["6", 0],
                            "upscale_method": "lanczos",
                            "width": w,
                            "height": h,
                            "crop": "center",
                        }
                    }
                    h3_inputs["last_frame"] = ["6_scale", 0]
                except Exception as ex:
                    print(f"[QuickClip] Last frame upload error: {ex}")

            wf["7"] = {
                "class_type": "MiniMaxH3ImageToVideo",
                "inputs": h3_inputs,
            }
            pos_cond = ["7", 0]
            neg_cond = ["7", 0]
            lat_out = ["7", 1]
            vae_out = ["3", 0]

        # Model sampling / sigma shift
        sigma_node = None
        if self.check_node_exists("MiniMaxH3SigmaShift"):
            sigma_node = "MiniMaxH3SigmaShift"
        elif self.check_node_exists("ModelSamplingMiniMaxH3"):
            sigma_node = "ModelSamplingMiniMaxH3"

        if sigma_node:
            wf["8"] = {
                "class_type": sigma_node,
                "inputs": {
                    "model": model_out,
                    "shift_video": 12.0,
                    "shift_audio": 3.0,
                }
            }
            sampler_model = ["8", 0]
        else:
            sampler_model = model_out

        wf["9"] = {
            "class_type": "KSampler",
            "inputs": {
                "model": sampler_model,
                "seed": seed,
                "steps": steps,
                "cfg": 1.0,
                "sampler_name": "res_multistep",
                "scheduler": "simple",
                "positive": pos_cond,
                "negative": neg_cond,
                "latent_image": lat_out,
                "denoise": 1.0,
            }
        }

        wf["10"] = {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["9", 0],
                "vae": vae_out,
            }
        }

        has_audio = False
        if self.check_node_exists("VAEDecodeAudio"):
            wf["11"] = {
                "class_type": "VAEDecodeAudio",
                "inputs": {
                    "samples": ["9", 0],
                    "vae": ["4", 0],
                }
            }
            has_audio = True

        # Video combining and saving (unique prefix prevents ComfyUI from caching SaveVideo after cleanup)
        qc_prefix = f"tA_VideoMaker/QuickClip_{uuid.uuid4().hex[:8]}"
        if self.check_node_exists("CreateVideo") and self.check_node_exists("SaveVideo"):
            create_inputs = {
                "images": ["10", 0],
                "fps": float(fps),
            }
            if has_audio:
                create_inputs["audio"] = ["11", 0]
            wf["12"] = {
                "class_type": "CreateVideo",
                "inputs": create_inputs,
            }
            wf["13"] = {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": ["12", 0],
                    "filename_prefix": qc_prefix,
                    "format": "auto",
                }
            }
        elif self.check_node_exists("VHS_VideoCombine"):
            vhs_inputs = {
                "images": ["10", 0],
                "frame_rate": float(fps),
                "format": "video/h264-mp4",
                "filename_prefix": qc_prefix,
                "save_metadata": True,
            }
            if has_audio:
                vhs_inputs["audio"] = ["11", 0]
            wf["12"] = {
                "class_type": "VHS_VideoCombine",
                "inputs": vhs_inputs,
            }
        else:
            wf["12"] = {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": ["10", 0],
                    "filename_prefix": qc_prefix,
                }
            }

        return wf

    def render_quick_clip_native(
        self,
        prompt: str,
        duration: float,
        fps: int,
        resolution: str,
        seed: int,
        dest_path: str,
        first_frame_path: Optional[str] = None,
        last_frame_path: Optional[str] = None,
        turbo: bool = True,
        extra_lora: Optional[str] = None,
        extra_lora_strength: float = 0.85,
        refpacks: Optional[List[dict]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Renders a single scene using ComfyUI's native MiniMax H3 pipeline."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        is_ok, err_msg, _ = self.check_minimax_render_prerequisites(progress_callback=progress_callback)
        if not is_ok:
            return False, err_msg

        res_map = {
            "480p": (832, 480),
            "512x512": (512, 512),
            "720p": (1280, 704),
            "1080p": (1920, 1088),
            # Portrait (9:16)
            "480p_portrait": (480, 832),
            "720p_portrait": (704, 1280),
            "1080p_portrait": (1088, 1920),
            "480x832": (480, 832),
            "720x1280": (704, 1280),
            "1080x1920": (1088, 1920),
        }
        w, h = res_map.get(resolution, (1280, 704))

        if progress_callback:
            progress_callback(5, "Initialisiere MiniMax H3 Quick-Clip Workflow...")

        try:
            workflow = self.build_native_quick_clip_workflow(
                prompt=prompt,
                duration=duration,
                fps=fps,
                width=w,
                height=h,
                seed=seed,
                first_frame_path=first_frame_path,
                last_frame_path=last_frame_path,
                turbo=turbo,
                extra_lora=extra_lora,
                extra_lora_strength=extra_lora_strength,
                refpacks=refpacks,
            )
        except Exception as ex:
            return False, f"Fehler beim Erstellen des Quick-Clip-Workflows: {ex}"

        if progress_callback:
            progress_callback(10, "Reiht Quick-Clip in ComfyUI ein...")

        try:
            prompt_id = self.queue_prompt(workflow)
        except Exception as ex:
            return False, f"ComfyUI Prompt-Validierung fehlgeschlagen: {ex}"

        try:
            outputs = self.wait_for_completion(
                prompt_id=prompt_id,
                timeout=2400,
                progress_callback=progress_callback,
                cancel_check=cancel_check,
            )
        except Exception as ex:
            return False, f"ComfyUI Rendering fehlgeschlagen: {ex}"

        if not outputs:
            # Fallback: check ComfyUI output directory directly
            try:
                win_out = self.get_comfy_output_dir()
                if win_out and os.path.isdir(win_out):
                    files = sorted(
                        [os.path.join(win_out, f) for f in os.listdir(win_out) if f.startswith("tA_VideoMaker") and f.endswith((".mp4", ".mkv", ".webm"))],
                        key=os.path.getmtime,
                        reverse=True,
                    )
                    if files:
                        shutil.copyfile(files[0], dest_path)
                        try:
                            if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                                os.remove(files[0])
                        except Exception:
                            pass
                        return True, dest_path
            except Exception:
                pass
            return False, "ComfyUI hat die Generierung beendet, aber keine Ausgabedatei erzeugt."

        target_file = outputs[0]
        for out_item in outputs:
            fn = out_item.get("filename", "")
            if fn.endswith((".mp4", ".webm", ".mkv", ".mov")):
                target_file = out_item
                break

        if progress_callback:
            progress_callback(95, "Lade fertigen Clip herunter...")

        try:
            c_dir = self.get_comfy_output_dir()
            fname = target_file.get("filename")
            sub = target_file.get("subfolder", "")
            if c_dir:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    shutil.copyfile(cand, dest_path)
                    try:
                        if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                            os.remove(cand)
                    except Exception:
                        pass
                    return True, dest_path

            self.download_file(
                filename=fname,
                subfolder=sub,
                folder_type=target_file.get("type", "output"),
                dest_path=dest_path,
            )
            if c_dir:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    try:
                        os.remove(cand)
                    except Exception:
                        pass
            return True, dest_path
        except Exception as ex:
            return False, f"Download des fertigen Clips fehlgeschlagen: {ex}"

    def build_native_long_clip_workflow(
        self,
        prompt: str,
        duration: float,
        fps: int = 24,
        width: int = 1280,
        height: int = 704,
        seed: int = 424242,
        first_frame_path: Optional[str] = None,
        last_frame_path: Optional[str] = None,
        audio_file_path: Optional[str] = None,
        turbo: bool = True,
        refpacks: Optional[List[dict]] = None,
    ) -> dict:
        """Constructs a native MiniMax H3 Long Clip workflow with optional audio-sync and turbo acceleration."""
        resolved = self.resolve_minimax_models()
        chosen_unet = resolved["unet"]
        chosen_clip = resolved["clip"]
        chosen_vae = resolved["vae"]
        chosen_audio_vae = resolved["audio_vae"]
        chosen_lora = resolved["lora"]

        if resolved.get("is_8step_unet") or turbo:
            steps = 8
        else:
            steps = 20

        w = (width // 32) * 32
        h = (height // 32) * 32
        length = max(17, int(round(duration * fps)))

        wf = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": chosen_unet,
                    "weight_dtype": "default",
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": chosen_clip,
                    "type": "minimax",
                }
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_vae,
                }
            },
            "4": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": chosen_audio_vae,
                }
            },
        }

        model_out = ["1", 0]
        clip_out = ["2", 0]
        if turbo and chosen_lora and chosen_lora != "None":
            wf["1_lora"] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "model": model_out,
                    "clip": clip_out,
                    "lora_name": chosen_lora,
                    "strength_model": 1.0,
                    "strength_clip": 1.0,
                }
            }
            model_out = ["1_lora", 0]
            clip_out = ["1_lora", 1]

        first_frame_node = None
        if first_frame_path and os.path.isfile(first_frame_path):
            try:
                ff_name = self.upload_image(first_frame_path)
                wf["5"] = {
                    "class_type": "LoadImage",
                    "inputs": {"image": ff_name}
                }
                wf["5_scale"] = {
                    "class_type": "ImageScale",
                    "inputs": {
                        "image": ["5", 0],
                        "upscale_method": "lanczos",
                        "width": w,
                        "height": h,
                        "crop": "center",
                    }
                }
                first_frame_node = ["5_scale", 0]
            except Exception as ex:
                print(f"[LongClip] First frame upload error: {ex}")

        last_frame_node = None
        if last_frame_path and os.path.isfile(last_frame_path):
            try:
                lf_name = self.upload_image(last_frame_path)
                wf["6"] = {
                    "class_type": "LoadImage",
                    "inputs": {"image": lf_name}
                }
                wf["6_scale"] = {
                    "class_type": "ImageScale",
                    "inputs": {
                        "image": ["6", 0],
                        "upscale_method": "lanczos",
                        "width": w,
                        "height": h,
                        "crop": "center",
                    }
                }
                last_frame_node = ["6_scale", 0]
            except Exception as ex:
                print(f"[LongClip] Last frame upload error: {ex}")

        audio_node = None
        if audio_file_path and os.path.isfile(audio_file_path):
            try:
                uploaded_audio_name = self.upload_audio(audio_file_path)
                if self.check_node_exists("LoadAudio"):
                    wf["7_audio"] = {
                        "class_type": "LoadAudio",
                        "inputs": {"audio": uploaded_audio_name}
                    }
                    audio_node = ["7_audio", 0]
                elif self.check_node_exists("VHS_LoadAudio"):
                    wf["7_audio"] = {
                        "class_type": "VHS_LoadAudio",
                        "inputs": {"audio_file": uploaded_audio_name}
                    }
                    audio_node = ["7_audio", 0]
            except Exception as ex:
                print(f"[LongClip] Audio upload error: {ex}")

        # MiniMax H3 conditioning:
        # If RefPacks are supplied, use BExplainsRefPackToH3;
        # else if an audio reference is supplied, use MiniMaxH3ReferenceToVideo with ComfyUI V3 autogrow path prefixes;
        # otherwise use MiniMaxH3ImageToVideo which natively accepts first_frame and optional last_frame.
        vae_out = ["3", 0]
        has_ref2vid = self.check_node_exists("MiniMaxH3ReferenceToVideo")
        if refpacks:
            model_out, pos_cond, neg_cond_rp, lat_out, vae_out = self._attach_refpacks_to_h3_workflow(
                wf=wf,
                model_out=model_out,
                clip_out=clip_out,
                vae_out=vae_out,
                refpacks=refpacks,
                prompt=prompt or "Cinematic performance, highly detailed, fluid movement",
                width=w,
                height=h,
                length=length,
                generation_mode="Video",
            )
        elif audio_node and has_ref2vid:
            ref_inputs = {
                "clip": clip_out,
                "vae": ["3", 0],
                "audio_vae": ["4", 0],
                "prompt": prompt or "Cinematic performance, highly detailed, fluid movement",
                "width": w,
                "height": h,
                "length": length,
                "ref_image_size": "match",
            }
            if first_frame_node:
                ref_inputs["ref_images.ref_image_0"] = first_frame_node
            if last_frame_node:
                ref_inputs["ref_images.ref_image_1"] = last_frame_node
            if audio_node:
                ref_inputs["ref_audios.ref_audio_0"] = audio_node

            wf["7"] = {
                "class_type": "MiniMaxH3ReferenceToVideo",
                "inputs": ref_inputs,
            }
            pos_cond = ["7", 0]
            lat_out = ["7", 1]
        else:
            h3_inputs = {
                "clip": clip_out,
                "vae": ["3", 0],
                "prompt": prompt or "Cinematic performance, highly detailed, fluid movement",
                "width": w,
                "height": h,
                "length": length,
            }
            if first_frame_node:
                h3_inputs["first_frame"] = first_frame_node
            if last_frame_node:
                h3_inputs["last_frame"] = last_frame_node

            wf["7"] = {
                "class_type": "MiniMaxH3ImageToVideo",
                "inputs": h3_inputs,
            }
            pos_cond = ["7", 0]
            lat_out = ["7", 1]

        sigma_node = None
        if self.check_node_exists("MiniMaxH3SigmaShift"):
            sigma_node = "MiniMaxH3SigmaShift"
        elif self.check_node_exists("ModelSamplingMiniMaxH3"):
            sigma_node = "ModelSamplingMiniMaxH3"

        if sigma_node:
            wf["8"] = {
                "class_type": sigma_node,
                "inputs": {
                    "model": model_out,
                    "shift_video": 12.0,
                    "shift_audio": 3.0,
                }
            }
            sampler_model = ["8", 0]
        else:
            sampler_model = model_out

        if refpacks:
            neg_cond = neg_cond_rp
        elif self.check_node_exists("ConditioningZeroOut"):
            wf["8_zero"] = {
                "class_type": "ConditioningZeroOut",
                "inputs": {
                    "conditioning": pos_cond,
                }
            }
            neg_cond = ["8_zero", 0]
        else:
            neg_cond = pos_cond

        wf["9"] = {
            "class_type": "KSampler",
            "inputs": {
                "model": sampler_model,
                "seed": seed,
                "steps": steps,
                "cfg": 1.0,
                "sampler_name": "euler" if self.check_node_exists("KSampler") else "res_multistep",
                "scheduler": "simple",
                "positive": pos_cond,
                "negative": neg_cond,
                "latent_image": lat_out,
                "denoise": 1.0,
            }
        }

        wf["10"] = {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["9", 0],
                "vae": vae_out if refpacks else ["3", 0],
            }
        }

        has_decoded_audio = False
        if self.check_node_exists("VAEDecodeAudio"):
            wf["11"] = {
                "class_type": "VAEDecodeAudio",
                "inputs": {
                    "samples": ["9", 0],
                    "vae": ["4", 0],
                }
            }
            has_decoded_audio = True

        video_audio_source = ["11", 0] if has_decoded_audio else (audio_node if audio_node else None)

        lc_prefix = f"tA_VideoMaker/LongClip_{uuid.uuid4().hex[:8]}"
        if self.check_node_exists("CreateVideo") and self.check_node_exists("SaveVideo"):
            create_inputs = {
                "images": ["10", 0],
                "fps": float(fps),
            }
            if video_audio_source:
                create_inputs["audio"] = video_audio_source
            wf["12"] = {
                "class_type": "CreateVideo",
                "inputs": create_inputs,
            }
            wf["13"] = {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": ["12", 0],
                    "filename_prefix": lc_prefix,
                    "format": "auto",
                }
            }
        elif self.check_node_exists("VHS_VideoCombine"):
            vhs_inputs = {
                "images": ["10", 0],
                "frame_rate": float(fps),
                "format": "video/h264-mp4",
                "filename_prefix": lc_prefix,
                "save_metadata": True,
            }
            if video_audio_source:
                vhs_inputs["audio"] = video_audio_source
            wf["12"] = {
                "class_type": "VHS_VideoCombine",
                "inputs": vhs_inputs,
            }
        else:
            wf["12"] = {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": ["10", 0],
                    "filename_prefix": lc_prefix,
                }
            }

        return wf

    def render_long_clip_ai(
        self,
        prompt: str,
        duration: float,
        fps: int,
        resolution: str,
        seed: int,
        dest_path: str,
        first_frame_path: Optional[str] = None,
        last_frame_path: Optional[str] = None,
        audio_file_path: Optional[str] = None,
        turbo: bool = True,
        refpacks: Optional[List[dict]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Renders a continuous Long Clip with MiniMax H3 (audio-synced, fast sampling)."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        is_ok, err_msg, _ = self.check_minimax_render_prerequisites(progress_callback=progress_callback)
        if not is_ok:
            return False, err_msg

        res_map = {
            "480p": (832, 480),
            "512x512": (512, 512),
            "720p": (1280, 704),
            "1080p": (1920, 1088),
            "480p_portrait": (480, 832),
            "720p_portrait": (704, 1280),
            "1080p_portrait": (1088, 1920),
            "480x832": (480, 832),
            "720x1280": (704, 1280),
            "1080x1920": (1088, 1920),
        }
        w, h = res_map.get(resolution, (1280, 704))

        # Check if native MiniMax H3 Ref2Vid/Image2Vid exists
        if self.check_node_exists("MiniMaxH3ReferenceToVideo") or self.check_node_exists("MiniMaxH3ImageToVideo"):
            if progress_callback:
                progress_callback(5, "Erstelle MiniMax H3 Long-Clip Workflow...")

            try:
                workflow = self.build_native_long_clip_workflow(
                    prompt=prompt,
                    duration=duration,
                    fps=fps,
                    width=w,
                    height=h,
                    seed=seed,
                    first_frame_path=first_frame_path,
                    last_frame_path=last_frame_path,
                    audio_file_path=audio_file_path,
                    turbo=turbo,
                    refpacks=refpacks,
                )
            except Exception as ex:
                return False, f"Fehler beim Erstellen des Long-Clip-Workflows: {ex}"

            if progress_callback:
                progress_callback(10, "Reiht Long-Clip in ComfyUI ein...")

            try:
                prompt_id = self.queue_prompt(workflow)
            except Exception as ex:
                return False, f"ComfyUI Prompt-Validierung fehlgeschlagen: {ex}"

            try:
                outputs = self.wait_for_completion(
                    prompt_id=prompt_id,
                    timeout=2400,
                    progress_callback=progress_callback,
                    cancel_check=cancel_check,
                )
            except Exception as ex:
                return False, f"ComfyUI Rendering fehlgeschlagen: {ex}"

            if not outputs:
                try:
                    win_out = self.get_comfy_output_dir()
                    if win_out and os.path.isdir(win_out):
                        files = sorted(
                            [os.path.join(win_out, f) for f in os.listdir(win_out) if f.startswith("tA_VideoMaker") and f.endswith((".mp4", ".mkv", ".webm"))],
                            key=os.path.getmtime,
                            reverse=True,
                        )
                        if files and os.path.isfile(files[0]):
                            shutil.copyfile(files[0], dest_path)
                            return True, dest_path
                except Exception:
                    pass
                return False, "Keine Video-Ausgabe von ComfyUI empfangen."

            target_file = None
            if isinstance(outputs, list) and len(outputs) > 0:
                target_file = outputs[0]
                for out_item in outputs:
                    fn = out_item.get("filename", "")
                    if fn.endswith((".mp4", ".webm", ".mkv", ".mov")):
                        target_file = out_item
                        break
            elif isinstance(outputs, dict):
                for node_id, node_out in outputs.items():
                    for key in ("videos", "images", "gifs"):
                        if key in node_out and len(node_out[key]) > 0:
                            target_file = node_out[key][0]
                            break
                    if target_file:
                        break

            if not target_file:
                return False, "Keine Video-Datei im ComfyUI Output-JSON gefunden."

            if progress_callback:
                progress_callback(95, "Lade fertigen Long Clip herunter...")

            try:
                c_dir = self.get_comfy_output_dir()
                fname = target_file.get("filename")
                sub = target_file.get("subfolder", "")
                if c_dir:
                    cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                    if os.path.isfile(cand):
                        shutil.copyfile(cand, dest_path)
                        try:
                            if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                                os.remove(cand)
                        except Exception:
                            pass
                        return True, dest_path

                self.download_file(
                    filename=fname,
                    subfolder=sub,
                    folder_type=target_file.get("type", "output"),
                    dest_path=dest_path,
                )
                return True, dest_path
            except Exception as ex:
                return False, f"Download des Long Clips fehlgeschlagen: {ex}"

        # Fallback to Director Engine
        scenes = [{
            "duration": duration,
            "prompt": prompt,
            "first_frame": first_frame_path,
            "last_frame": last_frame_path,
        }]
        return self.render_storyboard_ai(
            scenes=scenes,
            resolution=resolution,
            fps=fps,
            seed=seed,
            dest_path=dest_path,
            progress_callback=progress_callback,
            cancel_check=cancel_check,
        )

    def render_scene(
        self,
        prompt: str,
        duration: float,
        fps: int,
        resolution: str,
        seed: int,
        dest_path: str,
        first_frame_path: Optional[str] = None,
        last_frame_path: Optional[str] = None,
        dialogue: str = "",
        dialogue_lang: str = "German",
        camera_preset: str = "",
        subject_name: str = "",
        music_style: str = "",
        turbo: bool = True,
        extra_lora: Optional[str] = None,
        extra_lora_strength: float = 0.85,
        refpacks: Optional[List[dict]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Submits a single scene prompt. Uses native MiniMaxH3 pipeline if available, otherwise Director."""
        if self.check_node_exists("MiniMaxH3ImageToVideo") or (refpacks and self.has_refpacks_support()):
            full_prompt = prompt or ""
            if camera_preset and camera_preset.lower() not in full_prompt.lower():
                full_prompt = f"{camera_preset}, {full_prompt}" if full_prompt else camera_preset
            if dialogue:
                full_prompt += f". Spoken dialogue in {dialogue_lang}: \"{dialogue}\""
            if music_style:
                full_prompt += f". Music style: {music_style}"

            return self.render_quick_clip_native(
                prompt=full_prompt,
                duration=duration,
                fps=fps,
                resolution=resolution,
                seed=seed,
                dest_path=dest_path,
                first_frame_path=first_frame_path,
                last_frame_path=last_frame_path,
                turbo=turbo,
                extra_lora=extra_lora,
                extra_lora_strength=extra_lora_strength,
                refpacks=refpacks,
                progress_callback=progress_callback,
                cancel_check=cancel_check,
            )

        scenes = [{
            "duration": duration,
            "prompt": prompt,
            "first_frame": first_frame_path,
            "last_frame": last_frame_path,
            "dialogue": dialogue,
            "dialogue_lang": dialogue_lang,
            "camera_preset": camera_preset,
            "subject_name": subject_name,
        }]
        return self.render_storyboard_ai(
            scenes=scenes,
            resolution=resolution,
            fps=fps,
            seed=seed,
            dest_path=dest_path,
            music_style=music_style,
            turbo=turbo,
            progress_callback=progress_callback,
            cancel_check=cancel_check,
        )

    def _resolve_workflow_template_path(self, rel_path: str = "media/minimaxH3Lipsync_v41.json") -> Optional[str]:
        """Finds a bundled or workspace workflow JSON file."""
        candidates = []
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            candidates.append(os.path.join(sys._MEIPASS, rel_path))
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates.append(os.path.join(os.path.dirname(base_dir), rel_path))
        candidates.append(os.path.join(base_dir, rel_path))
        candidates.append(os.path.abspath(rel_path))
        for cand in candidates:
            if os.path.isfile(cand):
                return cand
        return None

    def build_lipsync_workflow(
        self,
        portrait_image_path: str,
        audio_path: str,
        prompt: str = "",
        cut_instruction: str = "",
        start_time: float = 0.0,
        duration: float = 10.0,
        width: int = 864,
        height: int = 496,
        fps: int = 24,
        seed: int = 424242,
        visual_strength: float = 0.99,
        use_demucs: bool = False,
        use_captions: bool = False,
        captions_text: str = "",
        second_image_path: Optional[str] = None,
        subject_name: str = "",
        dialogue_text: str = "",
        dialogue_lang: str = "German",
        music_style: str = "",
        camera_preset: str = "",
        align_to_activity_gap: bool = True,
        turbo: bool = True,
    ) -> dict:
        """Builds the headless API prompt for MiniMax H3 Lipsync (via media/minimaxH3Lipsync_v41.json or fallback)."""
        if not os.path.isfile(portrait_image_path):
            raise ComfyError(f"Porträtbild nicht gefunden: {portrait_image_path}")
        if not os.path.isfile(audio_path):
            raise ComfyError(f"Audiodatei nicht gefunden: {audio_path}")

        comfy_img1 = self.upload_image(portrait_image_path)
        comfy_img2 = None
        if second_image_path and os.path.isfile(second_image_path):
            comfy_img2 = self.upload_image(second_image_path)
        comfy_audio = self.upload_audio(audio_path)

        w = max(256, (int(width) // 16) * 16)
        h = max(256, (int(height) // 16) * 16)
        dur = max(1.0, float(duration))
        start_sec = max(0.0, float(start_time))
        vis_str = max(0.1, min(1.0, float(visual_strength)))

        preset_cam = H3_CAMERA_PRESETS.get((camera_preset or "").strip(), "")
        effective_cam = (cut_instruction or "").strip() or preset_cam or "Medium close-up portrait shot, steady camera."

        structured_scene_prompt = format_h3_structured_prompt(
            visual_prompt=prompt,
            subject_name=subject_name,
            has_first_image=True,
            has_second_image=bool(comfy_img2),
            dialogue_text=dialogue_text,
            dialogue_lang=dialogue_lang,
            camera_instruction="",
            music_style=music_style,
        )

        resolved = self.resolve_minimax_models()
        chosen_unet = resolved["unet"]
        chosen_clip = resolved["clip"]
        chosen_vae = resolved["vae"]
        chosen_audio_vae = resolved["audio_vae"]
        chosen_lora = resolved["lora"]
        chosen_audio_enc = resolved["audio_encoder"]

        # Check if the Eclipse H3 Lipsync workflow template & nodes are available
        wf_path = self._resolve_workflow_template_path("media/minimaxH3Lipsync_v41.json")
        has_eclipse_h3 = self.check_node_exists("MiniMax H3 Audio Timeline Planner V2 [Eclipse]")

        if wf_path and has_eclipse_h3:
            try:
                object_info = self._request("/object_info", timeout=15)
            except Exception:
                object_info = {}

            with open(wf_path, "r", encoding="utf-8") as f:
                wf_json = json.load(f)

            scene_prompt = structured_scene_prompt
            cam_cuts = effective_cam

            modes = {
                32: 4,   # Bypass interactive Image Selector [Eclipse]
                71: 2,   # Mute YuE2 Music Generation subgraph
                101: 4,  # Bypass intermediate Base Task Preview Video [Eclipse]
                178: 4,  # Bypass intermediate Loop Preview Video [Eclipse]
                89: 0 if use_demucs else 2,
                91: 0 if use_demucs else 2,
                200: 0 if use_captions else 2,
                203: 0 if use_captions else 2,
                205: 0 if use_captions else 2,
            }

            overrides = {
                1: {
                    "unet_name": chosen_unet,
                    "clip_name1": chosen_clip,
                    "vae_name": chosen_vae,
                    "audio_vae_name": chosen_audio_vae,
                },
                2: {
                    "lora_name_1": chosen_lora if turbo else "None",
                    "lora_name_2": "None",
                    "lora_name_3": "None",
                },
                12: {
                    "audio_encoder_name": chosen_audio_enc,
                },
                25: {
                    "width": w,
                    "height": h,
                    "video_width": w,
                    "video_height": h,
                    "frame_rate": float(fps),
                },
                81: {
                    "align_to_activity_gap": bool(align_to_activity_gap),
                    "max_render_frames": 17 * max(7, min(21, int(math.ceil((int(round(dur * fps)) - 5) / 17.0)))) + 5,
                    "reset_anchor": "first_only",
                    "technical_split_source": "generated_continuation",
                    "technical_seam_style": "plain_reset",
                },
                197: {
                    "value": round(start_sec, 2),
                },
                196: {
                    "source": "Selected file",
                    "audio": comfy_audio,
                    "start_time": 0.0,
                    "duration": 0.0,
                    "stop_review": False,
                },
                76: {
                    "audio": comfy_audio,
                    "duration": round(dur, 2),
                    "stop_review": False,
                },
                96: {
                    "string": scene_prompt,
                },
                86: {
                    "wildcard_text": cam_cuts,
                },
                93: {
                    "value": round(vis_str, 2),
                },
                98: {
                    "seed": int(seed),
                },
                208: {
                    "filename_prefix": f"tA_Lipsync_H3_{uuid.uuid4().hex[:8]}",
                },
            }

            if use_captions:
                effective_lyrics = (captions_text or "").strip() or (dialogue_text or "").strip()
                lang_code = "de" if str(dialogue_lang).lower().startswith(("de", "ger")) else "en"
                overrides[200] = {"string": effective_lyrics}
                overrides[66] = {"string": effective_lyrics}
                overrides[203] = {
                    "language": lang_code,
                    "width": w,
                    "height": h,
                    "fps": int(fps),
                }

            conv = EclipseWorkflowConverter(wf_json, object_info=object_info)
            api_prompt = conv.convert(
                modes=modes,
                overrides=overrides,
                unlinks={196: ["audio_in"]},
                outputs=[208],
            )

            # Replace Node 31 ("Load Batch From Folder") with standard LoadImage (or ImageBatch of 2 LoadImages)
            if comfy_img2:
                api_prompt["31_img1"] = {
                    "class_type": "LoadImage",
                    "inputs": {"image": comfy_img1},
                }
                api_prompt["31_img2"] = {
                    "class_type": "LoadImage",
                    "inputs": {"image": comfy_img2},
                }
                api_prompt["31"] = {
                    "class_type": "ImageBatch",
                    "inputs": {
                        "image1": ["31_img1", 0],
                        "image2": ["31_img2", 0],
                    },
                }
            else:
                api_prompt["31"] = {
                    "class_type": "LoadImage",
                    "inputs": {"image": comfy_img1},
                }

            return api_prompt

        # Fallback: MiniMax H3 Director with uploaded portrait + audio reference
        scenes = [{
            "duration": dur,
            "prompt": prompt,
            "first_frame": portrait_image_path,
            "last_frame": second_image_path,
            "subject_name": subject_name,
            "dialogue": dialogue_text,
            "dialogue_lang": dialogue_lang,
            "camera_preset": camera_preset,
            "camera_instruction": effective_cam,
        }]
        return self.build_director_storyboard_workflow(
            scenes=scenes,
            width=w,
            height=h,
            seed=seed,
            steps=12,
            music_style=music_style,
        )

    def render_lipsync_ai(
        self,
        portrait_image_path: str,
        audio_path: str,
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
        dest_path: str,
        second_image_path: Optional[str] = None,
        subject_name: str = "",
        dialogue_text: str = "",
        dialogue_lang: str = "German",
        music_style: str = "",
        camera_preset: str = "",
        align_to_activity_gap: bool = True,
        turbo: bool = True,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Executes the MiniMax H3 Lipsync workflow headlessly in ComfyUI and downloads the finished MP4."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        is_ok, err_msg, _ = self.check_minimax_render_prerequisites(progress_callback=progress_callback)
        if not is_ok:
            return False, err_msg

        if not self.check_node_exists("MiniMax H3 Audio Timeline Planner V2 [Eclipse]"):
            return False, (
                "Erforderliche ComfyUI-Erweiterung 'ComfyUI_Eclipse' fehlt. "
                "Bitte installiere 'ComfyUI_Eclipse' (https://github.com/r-vage/ComfyUI_Eclipse.git) "
                "in deinem ComfyUI 'custom_nodes'-Ordner und starte ComfyUI neu."
            )

        res_map = {
            "480p": (864, 496),
            "512x512": (512, 512),
            "720p": (1280, 720),
            "1080p": (1920, 1088),
            # Portrait (9:16)
            "480p_portrait": (496, 864),
            "720p_portrait": (720, 1280),
            "1080p_portrait": (1088, 1920),
            "480x832": (480, 832),
            "720x1280": (720, 1280),
            "1080x1920": (1088, 1920),
        }
        w, h = res_map.get(resolution, (864, 496))

        if progress_callback:
            progress_callback(5, "Lade Porträtbild & Audio in ComfyUI hoch...")

        try:
            workflow = self.build_lipsync_workflow(
                portrait_image_path=portrait_image_path,
                audio_path=audio_path,
                prompt=prompt,
                cut_instruction=cut_instruction,
                start_time=start_time,
                duration=duration,
                width=w,
                height=h,
                fps=fps,
                seed=seed,
                visual_strength=visual_strength,
                use_demucs=use_demucs,
                use_captions=use_captions,
                turbo=turbo,
                captions_text=captions_text,
                second_image_path=second_image_path,
                subject_name=subject_name,
                dialogue_text=dialogue_text,
                dialogue_lang=dialogue_lang,
                music_style=music_style,
                camera_preset=camera_preset,
                align_to_activity_gap=align_to_activity_gap,
            )
        except Exception as ex:
            return False, f"Fehler beim Erstellen des Lipsync-Workflows: {ex}"

        if progress_callback:
            progress_callback(10, "Starte MiniMax H3 Lipsync-Pipeline in ComfyUI...")

        run_start_time = time.time()
        try:
            prompt_id = self.queue_prompt(workflow)
        except Exception as ex:
            return False, f"ComfyUI Prompt-Validierung fehlgeschlagen: {ex}"

        try:
            outputs = self.wait_for_completion(
                prompt_id=prompt_id,
                timeout=3600,
                progress_callback=progress_callback,
                cancel_check=cancel_check,
            )
        except Exception as ex:
            return False, f"ComfyUI Lipsync-Rendering fehlgeschlagen: {ex}"

        video_outputs = [
            o for o in (outputs or [])
            if str(o.get("filename", "")).lower().endswith((".mp4", ".webm", ".mkv", ".mov"))
        ]

        if not video_outputs:
            # Fallback: search ComfyUI output directory recursively for newly created video files
            try:
                win_out = self.get_comfy_output_dir()
                if win_out and os.path.isdir(win_out):
                    candidates = []
                    for root_dir, _, files in os.walk(win_out):
                        for f in files:
                            if f.lower().endswith((".mp4", ".mkv", ".webm", ".mov")):
                                fpath = os.path.join(root_dir, f)
                                try:
                                    if os.path.getmtime(fpath) >= run_start_time - 2.0:
                                        candidates.append(fpath)
                                except OSError:
                                    pass
                    candidates.sort(key=os.path.getmtime, reverse=True)
                    if candidates:
                        shutil.copyfile(candidates[0], dest_path)
                        try:
                            if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                                os.remove(candidates[0])
                        except Exception:
                            pass
                        return True, dest_path
            except Exception:
                pass
            return False, "ComfyUI hat das Lipsync-Rendering beendet, aber keine Videodatei zurückgegeben."

        target_file = video_outputs[0]

        if progress_callback:
            progress_callback(95, "Lade fertiges Lipsync-Video herunter...")

        try:
            c_dir = self.get_comfy_output_dir()
            fname = target_file.get("filename")
            sub = target_file.get("subfolder", "")
            if c_dir and fname:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    shutil.copyfile(cand, dest_path)
                    try:
                        if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
                            os.remove(cand)
                    except Exception:
                        pass
                    return True, dest_path

            self.download_file(
                filename=fname,
                subfolder=sub,
                folder_type=target_file.get("type", "output"),
                dest_path=dest_path,
            )
            if c_dir and fname:
                cand = os.path.join(c_dir, sub, fname) if sub else os.path.join(c_dir, fname)
                if os.path.isfile(cand):
                    try:
                        os.remove(cand)
                    except Exception:
                        pass
            return True, dest_path
        except Exception as ex:
            return False, f"Download des fertigen Lipsync-Videos fehlgeschlagen: {ex}"

    def resolve_minimax_image_models(self) -> dict:
        """Resolves UNet, CLIP, VAE, and optional Seedream style LoRA for MiniMax H3 Image."""
        avail = self.get_available_models()
        unets = avail.get("unets", [])
        clips = avail.get("clips", [])
        vaes = avail.get("vaes", [])
        loras = avail.get("loras", [])

        def _pick(candidates: List[str], patterns: List[str]) -> Optional[str]:
            for pat in patterns:
                for item in candidates:
                    if pat in item.lower():
                        return item
            return None

        unet = _pick(unets, [
            "minimax_h3_image_pruned_int8_convrot",
            "minimax_h3_image_pruned_w4a8",
            "minimax_h3_image_pruned_bf16",
            "minimax_h3_image",
        ])
        clip = _pick(clips, [
            "qwen3vl_32b_minimax_h3_nvfp4_awq",
            "qwen3vl_32b_minimax_h3_int4",
            "qwen3vl_32b_minimax_h3_int8",
            "qwen3vl_32b_minimax_h3",
            "qwen3.5_9b",
        ])
        vae = _pick(vaes, [
            "minimax_h3_image_vae_fp16",
            "minimax_h3_image_vae",
        ])
        style_lora = _pick(loras, [
            "seedreamstyle_h3_resume_6k",
            "seedreamstyle_h3",
        ])
        return {"unet": unet, "clip": clip, "vae": vae, "style_lora": style_lora}

    def build_minimax_image_workflow(
        self,
        prompt_text: str,
        width: int = 1280,
        height: int = 720,
        seed: Optional[int] = None,
        steps: int = 6,
        cfg: float = 1.0,
        models: Optional[dict] = None,
        use_style_lora: bool = True,
        refpacks: Optional[List[dict]] = None,
    ) -> dict:
        """Builds a ComfyUI API workflow for MiniMax H3 Image start-frame / character-sheet generation."""
        resolved = models or self.resolve_minimax_image_models()
        eff_seed = int(seed) if seed is not None else int(time.time() * 1000) % 2147483647
        w = max(512, (int(width) // 16) * 16)
        h = max(512, (int(height) // 16) * 16)

        has_style_lora = bool(
            use_style_lora
            and resolved.get("style_lora")
            and self.check_node_exists("LoraLoaderModelOnly")
        )
        eff_prompt = prompt_text
        if has_style_lora and "seedreamstyle" not in eff_prompt.lower():
            eff_prompt = f"seedreamstyle. {eff_prompt}"

        wf: dict = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": resolved["unet"],
                    "weight_dtype": "default",
                },
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": resolved["clip"],
                    "type": "minimax",
                },
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": resolved["vae"],
                },
            },
            "4": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": eff_prompt,
                    "clip": ["2", 0],
                },
            },
            "5": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "",
                    "clip": ["2", 0],
                },
            },
            "6": {
                "class_type": "EmptySD3LatentImage",
                "inputs": {
                    "width": w,
                    "height": h,
                    "batch_size": 1,
                },
            },
        }
        model_ref: list = ["1", 0]
        if has_style_lora:
            wf["10"] = {
                "class_type": "LoraLoaderModelOnly",
                "inputs": {
                    "model": model_ref,
                    "lora_name": resolved["style_lora"],
                    "strength_model": 0.85,
                },
            }
            model_ref = ["10", 0]

        if refpacks:
            model_ref, pos_ref, neg_ref, lat_ref, vae_ref = self._attach_refpacks_to_h3_workflow(
                wf=wf,
                model_out=model_ref,
                clip_out=["2", 0],
                vae_out=["3", 0],
                refpacks=refpacks,
                prompt=eff_prompt,
                width=w,
                height=h,
                length=1,
                generation_mode="Image",
            )
        else:
            pos_ref = ["4", 0]
            neg_ref = ["5", 0]
            lat_ref = ["6", 0]
            vae_ref = ["3", 0]

        wf["7"] = {
            "class_type": "KSampler",
            "inputs": {
                "seed": eff_seed,
                "steps": max(1, int(steps)),
                "cfg": float(cfg),
                "sampler_name": "lcm" if has_style_lora else "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": model_ref,
                "positive": pos_ref,
                "negative": neg_ref,
                "latent_image": lat_ref,
            },
        }
        wf["8"] = {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["7", 0],
                "vae": vae_ref,
            },
        }
        wf["9"] = {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "tAVideoMaker_H3Img",
                "images": ["8", 0],
            },
        }
        return wf

    def render_minimax_image(
        self,
        prompt_text: str,
        dest_path: str,
        width: int = 1280,
        height: int = 720,
        seed: Optional[int] = None,
        steps: int = 6,
        refpacks: Optional[List[dict]] = None,
    ) -> Tuple[bool, str]:
        """Generates a start image / keyframe via MiniMax H3 Image in ComfyUI."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        models = self.resolve_minimax_image_models()
        missing = [k for k in ("unet", "clip", "vae") if not models.get(k)]
        if missing:
            return (
                False,
                "MiniMax H3 Image Modelle fehlen in ComfyUI ("
                + ", ".join(missing)
                + "). Bitte im Modell-Manager unter 'MiniMax H3 Image' herunterladen.",
            )

        wf = self.build_minimax_image_workflow(
            prompt_text=prompt_text,
            width=width,
            height=height,
            seed=seed,
            steps=steps,
            models=models,
            refpacks=refpacks,
        )
        try:
            prompt_id = self.queue_prompt(wf)
            outputs = self.wait_for_completion(prompt_id, timeout_sec=300)
        except Exception as ex:
            return False, f"MiniMax H3 Image Generierung fehlgeschlagen: {ex}"

        img_outputs = [
            o for o in outputs
            if str(o.get("filename", "")).lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
        ]
        if not img_outputs:
            return False, "ComfyUI hat kein Bild zurückgegeben."

        target = img_outputs[0]
        try:
            self.download_file(
                filename=target.get("filename"),
                subfolder=target.get("subfolder", ""),
                folder_type=target.get("type", "output"),
                dest_path=dest_path,
            )
            return True, dest_path
        except Exception as ex:
            return False, f"Download des generierten Bildes fehlgeschlagen: {ex}"

    def _apply_video_cache_node(
        self,
        wf: dict,
        model_ref: list,
        next_id: int,
        cache_mode: str = "auto",
    ) -> Tuple[list, int]:
        """Attaches EasyCache (native), MagCache, or TeaCache when enabled and available."""
        mode = (cache_mode or "auto").lower().strip()
        if mode in ("off", "none", "false", "0"):
            return model_ref, next_id

        candidates = (
            ["easycache", "magcache", "teacache"]
            if mode == "auto"
            else [mode]
        )
        for cand in candidates:
            if cand == "easycache" and self.check_node_exists("EasyCache"):
                nid = str(next_id)
                wf[nid] = {
                    "class_type": "EasyCache",
                    "inputs": {
                        "model": model_ref,
                        "reuse_threshold": 0.2,
                        "start_percent": 0.15,
                        "end_percent": 0.95,
                        "verbose": False,
                    },
                }
                return [nid, 0], next_id + 1
            if cand == "magcache" and self.check_node_exists("MagCache"):
                nid = str(next_id)
                wf[nid] = {
                    "class_type": "MagCache",
                    "inputs": {
                        "model": model_ref,
                        "magcache_thresh": 0.24,
                        "K": 2,
                        "retention_ratio": 0.2,
                    },
                }
                return [nid, 0], next_id + 1
            if cand == "teacache" and self.check_node_exists("TeaCache"):
                nid = str(next_id)
                wf[nid] = {
                    "class_type": "TeaCache",
                    "inputs": {
                        "model": model_ref,
                        "rel_l1_thresh": 0.25,
                    },
                }
                return [nid, 0], next_id + 1
        return model_ref, next_id

    def _append_video_export_nodes(
        self,
        wf: dict,
        images_ref: list,
        fps: int,
        filename_prefix: str,
        next_id: int,
        audio_ref: Optional[list] = None,
    ) -> int:
        """Appends CreateVideo+SaveVideo, VHS_VideoCombine (with metadata), or SaveVideo."""
        if self.check_node_exists("CreateVideo") and self.check_node_exists("SaveVideo"):
            c_id = str(next_id)
            s_id = str(next_id + 1)
            create_inputs: dict = {"images": images_ref, "fps": float(fps)}
            if audio_ref is not None:
                create_inputs["audio"] = audio_ref
            wf[c_id] = {"class_type": "CreateVideo", "inputs": create_inputs}
            wf[s_id] = {
                "class_type": "SaveVideo",
                "inputs": {
                    "video": [c_id, 0],
                    "filename_prefix": filename_prefix,
                    "format": "auto",
                },
            }
            return next_id + 2

        if self.check_node_exists("VHS_VideoCombine"):
            vhs_inputs: dict = {
                "images": images_ref,
                "frame_rate": float(fps),
                "format": "video/h264-mp4",
                "filename_prefix": filename_prefix,
                "save_metadata": True,
            }
            if audio_ref is not None:
                vhs_inputs["audio"] = audio_ref
            wf[str(next_id)] = {"class_type": "VHS_VideoCombine", "inputs": vhs_inputs}
            return next_id + 1

        wf[str(next_id)] = {
            "class_type": "SaveVideo",
            "inputs": {
                "video": images_ref,
                "filename_prefix": filename_prefix,
            },
        }
        return next_id + 1

    def resolve_wan22_models(self) -> dict:
        """Resolves Wan 2.2 diffusion model, CLIP, VAE, and optional LightX2V 4-step LoRA."""
        avail = self.get_available_models()
        unets = avail.get("unets", [])
        clips = avail.get("clips", [])
        vaes = avail.get("vaes", [])
        loras = avail.get("loras", [])

        def _pick(items: List[str], patterns: List[str]) -> Optional[str]:
            for pat in patterns:
                for it in items:
                    if pat in it.lower():
                        return it
            return None

        unet_5b = _pick(unets, ["wan2.2_ti2v_5b"])
        unet_i2v = _pick(unets, ["wan2.2_i2v_high_noise", "wan2.2_i2v"])
        unet_t2v = _pick(unets, ["wan2.2_t2v_high_noise", "wan2.2_t2v"])
        unet = unet_5b or unet_i2v or unet_t2v
        is_5b = bool(unet and "5b" in unet.lower())

        clip = _pick(clips, ["umt5_xxl_fp8_e4m3fn_scaled", "umt5_xxl"])
        vae = _pick(vaes, ["wan2.2_vae"] if is_5b else ["wan_2.1_vae", "wan2.2_vae"])
        lora = _pick(loras, ["wan2.2_i2v_lightx2v_4steps", "wan2.2_t2v_lightx2v_4steps", "lightx2v"])
        return {
            "unet": unet,
            "is_5b": is_5b,
            "clip": clip,
            "vae": vae,
            "lora": lora,
        }

    def build_wan22_video_workflow(
        self,
        prompt: str,
        duration: float = 5.0,
        fps: int = 24,
        resolution: str = "480p",
        seed: Optional[int] = None,
        uploaded_first_img: Optional[str] = None,
        cache_mode: str = "auto",
        models: Optional[dict] = None,
    ) -> dict:
        """Builds a ComfyUI API workflow for Wan 2.2 (TI2V 5B / T2V / I2V + optional LightX2V & cache)."""
        resolved = models or self.resolve_wan22_models()
        eff_seed = int(seed) if seed is not None else int(time.time() * 1000) % 2147483647
        res_map = {
            "480p": (832, 480),
            "540p": (960, 544),
            "720p": (1280, 720),
            "1080p": (1280, 720),
        }
        width, height = res_map.get(str(resolution or "480p").lower(), (832, 480))
        num_frames = max(17, min(241, ((int(round(float(duration) * fps)) - 1) // 4) * 4 + 1))

        wf: dict = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {"unet_name": resolved["unet"], "weight_dtype": "default"},
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {"clip_name": resolved["clip"], "type": "wan"},
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": resolved["vae"]},
            },
            "4": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": prompt, "clip": ["2", 0]},
            },
            "5": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "blurry, low quality, distorted, watermark, static, deformed",
                    "clip": ["2", 0],
                },
            },
        }

        model_ref: list = ["1", 0]
        next_id = 6
        use_lightx2v = bool(resolved.get("lora") and self.check_node_exists("LoraLoaderModelOnly"))
        if use_lightx2v:
            wf[str(next_id)] = {
                "class_type": "LoraLoaderModelOnly",
                "inputs": {
                    "model": model_ref,
                    "lora_name": resolved["lora"],
                    "strength_model": 1.0,
                },
            }
            model_ref = [str(next_id), 0]
            next_id += 1

        model_ref, next_id = self._apply_video_cache_node(wf, model_ref, next_id, cache_mode=cache_mode)

        if uploaded_first_img and resolved.get("is_5b") and self.check_node_exists("Wan22ImageToVideoLatent"):
            img_id = str(next_id)
            lat_id = str(next_id + 1)
            wf[img_id] = {"class_type": "LoadImage", "inputs": {"image": uploaded_first_img}}
            wf[lat_id] = {
                "class_type": "Wan22ImageToVideoLatent",
                "inputs": {
                    "vae": ["3", 0],
                    "start_image": [img_id, 0],
                    "width": width,
                    "height": height,
                    "length": num_frames,
                    "batch_size": 1,
                },
            }
            latent_ref = [lat_id, 0]
            pos_ref, neg_ref = ["4", 0], ["5", 0]
            next_id += 2
        elif uploaded_first_img and self.check_node_exists("WanImageToVideo"):
            img_id = str(next_id)
            i2v_id = str(next_id + 1)
            wf[img_id] = {"class_type": "LoadImage", "inputs": {"image": uploaded_first_img}}
            wf[i2v_id] = {
                "class_type": "WanImageToVideo",
                "inputs": {
                    "positive": ["4", 0],
                    "negative": ["5", 0],
                    "vae": ["3", 0],
                    "start_image": [img_id, 0],
                    "width": width,
                    "height": height,
                    "length": num_frames,
                    "batch_size": 1,
                },
            }
            pos_ref, neg_ref, latent_ref = [i2v_id, 0], [i2v_id, 1], [i2v_id, 2]
            next_id += 2
        else:
            lat_id = str(next_id)
            wf[lat_id] = {
                "class_type": "EmptyHunyuanLatentVideo",
                "inputs": {
                    "width": width,
                    "height": height,
                    "length": num_frames,
                    "batch_size": 1,
                },
            }
            latent_ref = [lat_id, 0]
            pos_ref, neg_ref = ["4", 0], ["5", 0]
            next_id += 1

        samp_id = str(next_id)
        dec_id = str(next_id + 1)
        wf[samp_id] = {
            "class_type": "KSampler",
            "inputs": {
                "seed": eff_seed,
                "steps": 4 if use_lightx2v else 20,
                "cfg": 1.0 if use_lightx2v else 5.0,
                "sampler_name": "uni_pc",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": model_ref,
                "positive": pos_ref,
                "negative": neg_ref,
                "latent_image": latent_ref,
            },
        }
        wf[dec_id] = {
            "class_type": "VAEDecode",
            "inputs": {"samples": [samp_id, 0], "vae": ["3", 0]},
        }
        self._append_video_export_nodes(
            wf=wf,
            images_ref=[dec_id, 0],
            fps=fps,
            filename_prefix="tA_VideoMaker/Wan22",
            next_id=next_id + 2,
        )
        return wf

    def render_wan22_video(
        self,
        prompt: str,
        duration: float,
        fps: int,
        resolution: str,
        seed: int,
        dest_path: str,
        first_image_path: Optional[str] = None,
        cache_mode: str = "auto",
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Tuple[bool, str]:
        """Renders a video clip via Wan 2.2 in ComfyUI."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188."

        models = self.resolve_wan22_models()
        missing = [k for k in ("unet", "clip", "vae") if not models.get(k)]
        if missing:
            return (
                False,
                "Wan 2.2 Modelle fehlen in ComfyUI ("
                + ", ".join(missing)
                + "). Bitte im Modell-Manager unter 'Wan 2.2' herunterladen.",
            )

        uploaded_first = None
        if first_image_path and os.path.isfile(first_image_path):
            uploaded_first = self.upload_image(first_image_path)

        if progress_callback:
            progress_callback(10, "Starte Wan 2.2 Pipeline in ComfyUI...")

        wf = self.build_wan22_video_workflow(
            prompt=prompt,
            duration=duration,
            fps=fps,
            resolution=resolution,
            seed=seed,
            uploaded_first_img=uploaded_first,
            cache_mode=cache_mode,
            models=models,
        )
        try:
            prompt_id = self.queue_prompt(wf)
            outputs = self.wait_for_completion(prompt_id, timeout_sec=900, progress_callback=progress_callback)
        except Exception as ex:
            return False, f"Wan 2.2 Rendering fehlgeschlagen: {ex}"

        vid_outputs = [
            o for o in outputs
            if str(o.get("filename", "")).lower().endswith((".mp4", ".webm", ".mov", ".mkv"))
        ]
        if not vid_outputs:
            return False, "ComfyUI hat keine Wan 2.2 Videodatei zurückgegeben."

        target = vid_outputs[0]
        try:
            self.download_file(
                filename=target.get("filename"),
                subfolder=target.get("subfolder", ""),
                folder_type=target.get("type", "output"),
                dest_path=dest_path,
            )
            return True, dest_path
        except Exception as ex:
            return False, f"Download des Wan 2.2 Videos fehlgeschlagen: {ex}"

    def resolve_morph_lora(self) -> Optional[str]:
        """Returns the installed AnimateDiff-Style Morph LoRA filename in ComfyUI, or None."""
        avail = self.get_available_models()
        for item in avail.get("loras", []):
            low = os.path.basename(str(item).replace("\\", "/")).lower()
            if "animatediff_style" in low:
                return str(item)
        return None

    def resolve_relayvsr_models(self) -> dict:
        """Resolves installed RelayVSR 2x/4x UNET and Flash VAE filenames from ComfyUI."""
        avail = self.get_available_models()
        unet = None
        vae = None
        for u in avail.get("unets", []):
            low = os.path.basename(str(u).replace("\\", "/")).lower()
            if "relayvsr" in low:
                unet = str(u)
                if "x2" in low:
                    break
        for v in avail.get("vaes", []):
            low = os.path.basename(str(v).replace("\\", "/")).lower()
            if "relayvsr" in low:
                vae = str(v)
                if "x2" in low:
                    break
        return {"unet": unet, "vae": vae}

    def upscale_video_relayvsr(
        self,
        video_path: str,
        dest_path: str,
        fps: int = 24,
        detail: float = 1.0,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Tuple[bool, str]:
        """Upscales an existing MP4 video using ComfyUI's RelayVSR 2x AI super-resolution."""
        if not self.is_alive():
            return False, "ComfyUI ist nicht erreichbar."
        if not self.check_node_exists("RelayVSRConditioning") or not self.check_node_exists("VSRDecode"):
            return False, "RelayVSR Nodes (RelayVSRConditioning / VSRDecode) fehlen in ComfyUI."
        if not self.check_node_exists("VHS_LoadVideo") or not self.check_node_exists("VHS_VideoCombine"):
            return False, "VideoHelperSuite (VHS_LoadVideo / VHS_VideoCombine) fehlt in ComfyUI."

        models = self.resolve_relayvsr_models()
        if not models.get("unet") or not models.get("vae"):
            return False, "RelayVSR Modelle fehlen in ComfyUI."

        if progress_callback:
            progress_callback(88, "RelayVSR KI-Upscaling wird vorbereitet...")

        try:
            uploaded_vid = self.upload_image(video_path)
        except Exception as ex:
            return False, f"Video-Upload für RelayVSR fehlgeschlagen: {ex}"

        wf = {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {"unet_name": models["unet"], "weight_dtype": "default"},
            },
            "2": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": models["vae"]},
            },
            "3": {
                "class_type": "VHS_LoadVideo",
                "inputs": {
                    "video": uploaded_vid,
                    "force_rate": 0,
                    "force_size": "Disabled",
                    "custom_width": 0,
                    "custom_height": 0,
                    "frame_load_cap": 0,
                    "skip_first_frames": 0,
                    "select_every_nth": 1,
                },
            },
            "4": {
                "class_type": "RelayVSRConditioning",
                "inputs": {"model": ["1", 0], "images": ["3", 0]},
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "seed": 42,
                    "steps": 1,
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "positive": ["4", 0],
                    "negative": ["4", 1],
                    "latent_image": ["4", 2],
                    "denoise": 1.0,
                },
            },
            "6": {
                "class_type": "VSRDecode",
                "inputs": {
                    "vae": ["2", 0],
                    "samples": ["5", 0],
                    "images": ["3", 0],
                    "detail": float(detail),
                },
            },
            "7": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["6", 0],
                    "audio": ["3", 2],
                    "frame_rate": float(fps),
                    "loop_count": 0,
                    "filename_prefix": "tA_VideoMaker/RelayVSR",
                    "format": "video/h264-mp4",
                    "pingpong": False,
                    "save_output": True,
                },
            },
        }

        try:
            prompt_id = self.queue_prompt(wf)
            outputs = self.wait_for_completion(
                prompt_id=prompt_id,
                timeout=1200,
                progress_callback=progress_callback,
                cancel_check=cancel_check,
            )
        except Exception as ex:
            return False, f"RelayVSR Upscaling fehlgeschlagen: {ex}"

        vid_outputs = [
            o for o in outputs
            if str(o.get("filename", "")).lower().endswith((".mp4", ".webm", ".mov", ".mkv"))
        ]
        if not vid_outputs:
            return False, "RelayVSR hat keine Ausgabedatei erzeugt."

        target = vid_outputs[0]
        try:
            self.download_file(
                filename=target.get("filename"),
                subfolder=target.get("subfolder", ""),
                folder_type=target.get("type", "output"),
                dest_path=dest_path,
            )
            return True, dest_path
        except Exception as ex:
            return False, f"Download des RelayVSR Videos fehlgeschlagen: {ex}"



