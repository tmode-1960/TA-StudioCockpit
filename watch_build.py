"""Auto-build file watcher for thomo.ART StudioCockpit.

Monitors relevant source files and automatically runs `build_dist.bat --nopause`
whenever a change is detected (with debouncing and loop protection).

Usage:
    python watch_build.py              # Watch and rebuild dist/ on changes
    python watch_build.py --bump       # Also bump version (+0.01) before each build
    python watch_build.py --interval 1 # Poll interval in seconds (default: 1.0)
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WATCH_FILES = [
    "server.py",
    "comfy_client.py",
    "StudioCockpit.spec",
    "app.ico",
    "version.txt",
]

WATCH_DIRS = {
    "web": {".html", ".js", ".css", ".ico"},
    "workflows": {".json"},
}


def collect_snapshot() -> dict[str, tuple[int, int]]:
    """Return a mapping of relative path -> (mtime_ns, size) for all watched files."""
    snapshot: dict[str, tuple[int, int]] = {}

    for rel in WATCH_FILES:
        full = os.path.join(BASE_DIR, rel)
        if os.path.isfile(full):
            st = os.stat(full)
            snapshot[rel] = (st.st_mtime_ns, st.st_size)

    for rel_dir, exts in WATCH_DIRS.items():
        full_dir = os.path.join(BASE_DIR, rel_dir)
        if not os.path.isdir(full_dir):
            continue
        for entry in os.scandir(full_dir):
            if not entry.is_file():
                continue
            _, ext = os.path.splitext(entry.name)
            if ext.lower() in exts:
                st = entry.stat()
                rel_path = os.path.join(rel_dir, entry.name)
                snapshot[rel_path] = (st.st_mtime_ns, st.st_size)

    return snapshot


def find_changes(
    prev: dict[str, tuple[int, int]],
    curr: dict[str, tuple[int, int]],
) -> list[str]:
    """Return list of changed, added, or removed relative paths."""
    changed: list[str] = []
    all_keys = set(prev.keys()) | set(curr.keys())
    for key in sorted(all_keys):
        if prev.get(key) != curr.get(key):
            changed.append(key)
    return changed


def run_build(bump: bool) -> int:
    """Run optional version bump and build_dist.bat --nopause."""
    if bump:
        print("[Auto-Build] Erhoehe Versionsnummer (+0.01)...")
        res = subprocess.run(
            [sys.executable, "bump_version.py", "--bump"],
            cwd=BASE_DIR,
        )
        if res.returncode != 0:
            print("[Auto-Build] FEHLER beim Version-Bump.")
            return res.returncode

    print("[Auto-Build] Starte build_dist.bat ...")
    res = subprocess.run(
        ["cmd", "/c", "build_dist.bat", "--nopause"],
        cwd=BASE_DIR,
    )
    if res.returncode == 0:
        print("[Auto-Build] Build erfolgreich abgeschlossen.")
    else:
        print(f"[Auto-Build] FEHLER: Build beendet mit Code {res.returncode}.")
    return res.returncode


def main() -> None:
    parser = argparse.ArgumentParser(description="Auto-Build Watcher fuer thomo.ART StudioCockpit")
    parser.add_argument("--bump", action="store_true", help="Vor jedem Auto-Build Version um 0.01 erhoehen")
    parser.add_argument("--interval", type=float, default=1.0, help="Pruef-Intervall in Sekunden (Standard: 1.0)")
    parser.add_argument("--debounce", type=float, default=2.5, help="Wartezeit nach letzter Aenderung (Standard: 2.5s)")
    args = parser.parse_args()

    print("=" * 60)
    print("  thomo.ART StudioCockpit - Auto-Build Watcher aktiv")
    print(f"  Ordner:   {BASE_DIR}")
    print(f"  Bump:     {'Ja (+0.01)' if args.bump else 'Nein (aktuelle Version)'}")
    print(f"  Debounce: {args.debounce:.1f}s | Strg+C zum Beenden")
    print("=" * 60)

    baseline = collect_snapshot()
    pending_since: float | None = None
    last_changed_files: list[str] = []

    try:
        while True:
            time.sleep(max(0.2, args.interval))
            current = collect_snapshot()
            diff = find_changes(baseline, current)
            if diff:
                baseline = current
                pending_since = time.monotonic()
                for f in diff:
                    if f not in last_changed_files:
                        last_changed_files.append(f)
                print(f"[{time.strftime('%H:%M:%S')}] Aenderung erkannt: {', '.join(diff)}")

            if pending_since is not None and (time.monotonic() - pending_since) >= args.debounce:
                print(f"\n[{time.strftime('%H:%M:%S')}] Baue dist/ neu ({len(last_changed_files)} Datei(en) geaendert)...")
                run_build(args.bump)
                # Refresh baseline after build so sync steps don't retrigger a build
                baseline = collect_snapshot()
                pending_since = None
                last_changed_files.clear()
                print(f"[{time.strftime('%H:%M:%S')}] Warte auf weitere Aenderungen...\n")
    except KeyboardInterrupt:
        print("\n[Auto-Build] Watcher beendet.")


if __name__ == "__main__":
    main()
