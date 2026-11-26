#!/usr/bin/env python3
"""Minimal CLI client for tA-Studio-Cockpit's local MusicMaker HTTP API."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request


DEFAULT_URL = os.environ.get("STUDIO_COCKPIT_URL", "http://127.0.0.1:8095").rstrip("/")


def _request(base_url: str, path: str, method: str = "GET", payload: dict | None = None) -> dict:
    url = f"{base_url}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
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


def _wait_for_job(base_url: str, job_id: str, interval: float, timeout: float) -> dict:
    deadline = time.monotonic() + timeout
    last_phase = None
    while True:
        job = _request(base_url, f"/api/music/job/{job_id}")
        status = job.get("status")
        phase = job.get("phase")
        progress = job.get("progress", 0.0)
        if phase != last_phase:
            print(f"[{job_id}] status={status} phase={phase} progress={progress:.0%}", file=sys.stderr)
            last_phase = phase
        if status in ("done", "error", "cancelled", "canceled"):
            return job
        if time.monotonic() >= deadline:
            raise SystemExit(f"Timed out waiting for job {job_id} (last status={status}, phase={phase})")
        time.sleep(interval)


def main() -> None:
    parser = argparse.ArgumentParser(description="tA-Studio-Cockpit MusicMaker API client")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Base URL (default: {DEFAULT_URL})")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="GET /api/music/status")
    sub.add_parser("options", help="GET /api/music/options")
    sub.add_parser("defaults", help="GET /api/music/defaults")
    sub.add_parser("history", help="GET /api/music/history")

    for name in ("draft", "render"):
        p = sub.add_parser(name, help=f"POST /api/music/{name}")
        p.add_argument("--json", help="Inline JSON payload")
        p.add_argument("--file", help="Path to JSON payload file (or '-' for stdin)")
        p.add_argument("--wait", action="store_true", help="Poll job until finished")
        p.add_argument("--interval", type=float, default=2.0, help="Poll interval in seconds")
        p.add_argument("--timeout", type=float, default=900.0, help="Wait timeout in seconds")

    p_take = sub.add_parser("new-take", help="POST /api/music/song/new_take")
    p_take.add_argument("--id", help="History entry ID (defaults to latest song)")
    p_take.add_argument("--wait", action="store_true", help="Poll job until finished")
    p_take.add_argument("--interval", type=float, default=2.0, help="Poll interval in seconds")
    p_take.add_argument("--timeout", type=float, default=900.0, help="Wait timeout in seconds")

    p_job = sub.add_parser("job", help="GET /api/music/job/<id>")
    p_job.add_argument("job_id", help="Job ID")
    p_job.add_argument("--wait", action="store_true", help="Poll job until finished")
    p_job.add_argument("--interval", type=float, default=2.0, help="Poll interval in seconds")
    p_job.add_argument("--timeout", type=float, default=900.0, help="Wait timeout in seconds")

    args = parser.parse_args()
    base_url = args.url.rstrip("/")

    if args.cmd in ("status", "options", "defaults", "history"):
        out = _request(base_url, f"/api/music/{args.cmd}")
    elif args.cmd in ("draft", "render"):
        payload = _load_payload(args)
        out = _request(base_url, f"/api/music/{args.cmd}", method="POST", payload=payload)
        if args.wait and out.get("id"):
            out = _wait_for_job(base_url, out["id"], args.interval, args.timeout)
    elif args.cmd == "new-take":
        payload = {"id": args.id} if args.id else {}
        out = _request(base_url, "/api/music/song/new_take", method="POST", payload=payload)
        if args.wait and out.get("id"):
            out = _wait_for_job(base_url, out["id"], args.interval, args.timeout)
    elif args.cmd == "job":
        if args.wait:
            out = _wait_for_job(base_url, args.job_id, args.interval, args.timeout)
        else:
            out = _request(base_url, f"/api/music/job/{args.job_id}")
    else:
        raise SystemExit(f"Unknown command: {args.cmd}")

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
