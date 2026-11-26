#!/usr/bin/env python3
"""Unified CLI client for tA-Studio-Cockpit (Image Studio, VideoMaker, MusicMaker, DiscordGIF)."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


DEFAULT_URL = os.environ.get("STUDIO_COCKPIT_URL", "http://127.0.0.1:8095").rstrip("/")
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _request(
    base_url: str,
    path: str,
    method: str = "GET",
    payload: dict | None = None,
    timeout: float = 30.0,
) -> dict:
    url = f"{base_url}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with _OPENER.open(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} from {url}: {body}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to reach {url}: {exc.reason}") from exc


def _fetch_bytes(base_url: str, path: str, timeout: float = 30.0) -> bytes:
    url = f"{base_url}{path}" if path.startswith("/") else path
    req = urllib.request.Request(url, method="GET")
    try:
        with _OPENER.open(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} from {url}: {body}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to reach {url}: {exc.reason}") from exc


def _load_payload(args: argparse.Namespace) -> dict:
    if getattr(args, "json", None):
        return json.loads(args.json)
    if getattr(args, "file", None):
        if args.file == "-":
            return json.load(sys.stdin)
        with open(args.file, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def _wait_image(base_url: str, prompt_id: str, interval: float, timeout: float) -> dict:
    deadline = time.monotonic() + timeout
    last_status = None
    while True:
        res = _request(base_url, f"/api/poll_generation?prompt_id={urllib.parse.quote(prompt_id)}")
        st = res.get("status")
        if st != last_status:
            print(f"[image:{prompt_id}] status={st}", file=sys.stderr)
            last_status = st
        if st in ("done", "error", "cancelled", "canceled"):
            return res
        if time.monotonic() >= deadline:
            raise SystemExit(f"Timed out waiting for image job {prompt_id} (last status={st})")
        time.sleep(interval)


def _wait_music(base_url: str, job_id: str, interval: float, timeout: float) -> dict:
    deadline = time.monotonic() + timeout
    last_phase = None
    while True:
        job = _request(base_url, f"/api/music/job/{job_id}")
        status = job.get("status")
        phase = job.get("phase")
        progress = job.get("progress", 0.0)
        if phase != last_phase:
            print(f"[music:{job_id}] status={status} phase={phase} progress={progress:.0%}", file=sys.stderr)
            last_phase = phase
        if status in ("done", "error", "cancelled", "canceled"):
            return job
        if time.monotonic() >= deadline:
            raise SystemExit(f"Timed out waiting for music job {job_id} (last status={status})")
        time.sleep(interval)


def _wait_gif(base_url: str, interval: float, timeout: float) -> dict:
    deadline = time.monotonic() + timeout
    last_text = None
    while True:
        st = _request(base_url, "/api/gif/ai/progress")
        txt = st.get("status_text")
        pct = st.get("progress", 0)
        if txt != last_text:
            print(f"[gif] progress={pct}% status={txt}", file=sys.stderr)
            last_text = txt
        if not st.get("busy"):
            return st
        if time.monotonic() >= deadline:
            raise SystemExit(f"Timed out waiting for AI GIF job (last status={txt})")
        time.sleep(interval)


def _add_payload_args(p: argparse.ArgumentParser, with_wait: bool = False) -> None:
    p.add_argument("--json", help="Inline JSON payload")
    p.add_argument("--file", help="Path to JSON payload file (or '-' for stdin)")
    if with_wait:
        p.add_argument("--wait", action="store_true", help="Poll job until finished")
        p.add_argument("--interval", type=float, default=2.0, help="Poll interval in seconds")
        p.add_argument("--timeout", type=float, default=900.0, help="Wait timeout in seconds")


def main() -> None:
    parser = argparse.ArgumentParser(description="tA-Studio-Cockpit unified API client")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Base URL (default: {DEFAULT_URL})")
    sub = parser.add_subparsers(dest="module", required=True)

    sub.add_parser("status", help="Combined status across Image, Video, Music, and GIF")

    # ---- image ----
    p_img = sub.add_parser("image", help="Image Studio endpoints")
    sub_img = p_img.add_subparsers(dest="cmd", required=True)
    sub_img.add_parser("presets", help="GET /api/presets")
    sub_img.add_parser("history", help="GET /api/history")
    _add_payload_args(sub_img.add_parser("generate", help="POST /api/generate"), with_wait=True)
    p_img_poll = sub_img.add_parser("poll", help="GET /api/poll_generation")
    p_img_poll.add_argument("prompt_id")
    p_img_poll.add_argument("--wait", action="store_true")
    p_img_poll.add_argument("--interval", type=float, default=2.0)
    p_img_poll.add_argument("--timeout", type=float, default=600.0)

    # ---- video ----
    p_vid = sub.add_parser("video", help="VideoMaker endpoints")
    sub_vid = p_vid.add_subparsers(dest="cmd", required=True)
    sub_vid.add_parser("status", help="GET /api/video/status")
    sub_vid.add_parser("job", help="GET /api/video/jobs/active")
    sub_vid.add_parser("media", help="GET /api/video/media")
    p_adopt = sub_vid.add_parser("adopt", help="POST /api/video/adopt_studio_image")
    p_adopt.add_argument("image_url", help="Studio image URL (e.g. /output/...) or path")
    for vcmd in ("quick", "long", "scene"):
        pv = sub_vid.add_parser(vcmd, help=f"POST /api/video/render_{vcmd}")
        _add_payload_args(pv)
        pv.add_argument("--timeout", type=float, default=1200.0, help="HTTP timeout in seconds")

    # ---- music ----
    p_mus = sub.add_parser("music", help="MusicMaker endpoints")
    sub_mus = p_mus.add_subparsers(dest="cmd", required=True)
    for mget in ("status", "options", "defaults", "history"):
        sub_mus.add_parser(mget, help=f"GET /api/music/{mget}")
    for mpost in ("draft", "render"):
        _add_payload_args(sub_mus.add_parser(mpost, help=f"POST /api/music/{mpost}"), with_wait=True)
    p_take = sub_mus.add_parser("new-take", help="POST /api/music/song/new_take")
    p_take.add_argument("--id", help="History entry ID (defaults to latest song)")
    p_take.add_argument("--wait", action="store_true")
    p_take.add_argument("--interval", type=float, default=2.0)
    p_take.add_argument("--timeout", type=float, default=900.0)
    p_mjob = sub_mus.add_parser("job", help="GET /api/music/job/<id>")
    p_mjob.add_argument("job_id")
    p_mjob.add_argument("--wait", action="store_true")
    p_mjob.add_argument("--interval", type=float, default=2.0)
    p_mjob.add_argument("--timeout", type=float, default=900.0)

    # ---- gif ----
    p_gif = sub.add_parser("gif", help="DiscordGIF endpoints")
    sub_gif = p_gif.add_subparsers(dest="cmd", required=True)
    sub_gif.add_parser("status", help="GET /api/gif/status")
    sub_gif.add_parser("workflows", help="GET /api/gif/ai/workflows")
    sub_gif.add_parser("list", help="GET /api/gif/list")
    sub_gif.add_parser("progress", help="GET /api/gif/ai/progress")
    p_ggen = sub_gif.add_parser("generate", help="POST /api/gif/ai/generate")
    _add_payload_args(p_ggen, with_wait=True)
    p_ggen.add_argument("--image", help="Local image file path to encode as base64")
    p_ggen.add_argument("--image-url", help="Studio image URL (e.g. /output/...) to encode as base64")
    p_ggen.add_argument("--prompt", help="Optional animation prompt override")
    p_ggen.add_argument("--workflow-id", help="Optional workflow_id override")
    p_gsend = sub_gif.add_parser("send", help="POST /api/gif/send")
    p_gsend.add_argument("id", help="GIF ID")

    args = parser.parse_args()
    base_url = args.url.rstrip("/")

    if args.module == "status":
        out = {
            "image": _request(base_url, "/api/status"),
            "video": _request(base_url, "/api/video/status"),
            "music": _request(base_url, "/api/music/status"),
            "gif": _request(base_url, "/api/gif/status"),
        }
    elif args.module == "image":
        if args.cmd in ("presets", "history"):
            out = _request(base_url, f"/api/{args.cmd}")
        elif args.cmd == "generate":
            out = _request(base_url, "/api/generate", method="POST", payload=_load_payload(args))
            if args.wait and out.get("prompt_id"):
                out = _wait_image(base_url, out["prompt_id"], args.interval, args.timeout)
        elif args.cmd == "poll":
            if args.wait:
                out = _wait_image(base_url, args.prompt_id, args.interval, args.timeout)
            else:
                out = _request(base_url, f"/api/poll_generation?prompt_id={urllib.parse.quote(args.prompt_id)}")
    elif args.module == "video":
        if args.cmd == "status":
            out = _request(base_url, "/api/video/status")
        elif args.cmd == "job":
            out = _request(base_url, "/api/video/jobs/active")
        elif args.cmd == "media":
            out = _request(base_url, "/api/video/media")
        elif args.cmd == "adopt":
            out = _request(base_url, "/api/video/adopt_studio_image", method="POST", payload={"image_url": args.image_url})
        elif args.cmd in ("quick", "long", "scene"):
            ep = {"quick": "render_quick", "long": "render_long_clip", "scene": "render_scene"}[args.cmd]
            out = _request(base_url, f"/api/video/{ep}", method="POST", payload=_load_payload(args), timeout=args.timeout)
    elif args.module == "music":
        if args.cmd in ("status", "options", "defaults", "history"):
            out = _request(base_url, f"/api/music/{args.cmd}")
        elif args.cmd in ("draft", "render"):
            out = _request(base_url, f"/api/music/{args.cmd}", method="POST", payload=_load_payload(args))
            if args.wait and out.get("id"):
                out = _wait_music(base_url, out["id"], args.interval, args.timeout)
        elif args.cmd == "new-take":
            payload = {"id": args.id} if args.id else {}
            out = _request(base_url, "/api/music/song/new_take", method="POST", payload=payload)
            if args.wait and out.get("id"):
                out = _wait_music(base_url, out["id"], args.interval, args.timeout)
        elif args.cmd == "job":
            if args.wait:
                out = _wait_music(base_url, args.job_id, args.interval, args.timeout)
            else:
                out = _request(base_url, f"/api/music/job/{args.job_id}")
    elif args.module == "gif":
        if args.cmd == "status":
            out = _request(base_url, "/api/gif/status")
        elif args.cmd == "workflows":
            out = _request(base_url, "/api/gif/ai/workflows")
        elif args.cmd == "list":
            out = _request(base_url, "/api/gif/list")
        elif args.cmd == "progress":
            out = _request(base_url, "/api/gif/ai/progress")
        elif args.cmd == "generate":
            payload = _load_payload(args)
            if args.image:
                with open(args.image, "rb") as fh:
                    payload["image_data"] = base64.b64encode(fh.read()).decode("ascii")
            elif args.image_url:
                raw = _fetch_bytes(base_url, args.image_url)
                payload["image_data"] = base64.b64encode(raw).decode("ascii")
            if args.prompt:
                payload["prompt"] = args.prompt
            if args.workflow_id:
                payload["workflow_id"] = args.workflow_id
            out = _request(base_url, "/api/gif/ai/generate", method="POST", payload=payload)
            if args.wait and out.get("ok"):
                out = _wait_gif(base_url, args.interval, args.timeout)
        elif args.cmd == "send":
            out = _request(base_url, "/api/gif/send", method="POST", payload={"id": args.id})
    else:
        raise SystemExit(f"Unknown module: {args.module}")

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
