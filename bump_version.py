"""Version manager and bumper for thomo.ART StudioCockpit.

Increments version by 0.01 on each bump.
Usage:
    python bump_version.py --bump       # Increments by 0.01 (e.g. 0.50 -> 0.51)
    python bump_version.py --set 0.5    # Sets specific version
    python bump_version.py --sync       # Syncs current version across project files
    python bump_version.py              # Defaults to --bump
"""

from __future__ import annotations

import argparse
from decimal import Decimal
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VERSION_FILE = os.path.join(BASE_DIR, "version.txt")
SERVER_FILE = os.path.join(BASE_DIR, "server.py")
HTML_FILE = os.path.join(BASE_DIR, "web", "index.html")
README_FILE = os.path.join(BASE_DIR, "README.md")


def read_version() -> str:
    if os.path.isfile(VERSION_FILE):
        with open(VERSION_FILE, "r", encoding="utf-8") as fh:
            v = fh.read().strip()
            if v:
                return v
    return "0.5"


def write_version(ver: str) -> None:
    with open(VERSION_FILE, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(ver + "\n")


def bump_version_str(ver: str) -> str:
    try:
        current = Decimal(ver)
    except Exception:
        current = Decimal("0.5")
    new_ver = current + Decimal("0.01")
    return f"{new_ver:.2f}"


def update_server_py(ver: str) -> None:
    if not os.path.isfile(SERVER_FILE):
        return
    with open(SERVER_FILE, "r", encoding="utf-8") as fh:
        content = fh.read()
    if re.search(r'APP_VERSION\s*=\s*"[^"]*"', content):
        content = re.sub(r'APP_VERSION\s*=\s*"[^"]*"', f'APP_VERSION = "{ver}"', content, count=1)
    else:
        content = f'APP_VERSION = "{ver}"\n' + content
    with open(SERVER_FILE, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(content)


def update_html(ver: str) -> None:
    if not os.path.isfile(HTML_FILE):
        return
    with open(HTML_FILE, "r", encoding="utf-8") as fh:
        content = fh.read()

    # Update <title>
    content = re.sub(
        r"<title>.*?</title>",
        f"<title>thomo.ART StudioCockpit v{ver} (FLEXMOD Edition)</title>",
        content,
        count=1,
    )

    # Update header brand
    content = re.sub(
        r'<span class="brand-badge"[^>]*id="brandVersion"[^>]*>.*?</span>',
        f'<span class="brand-badge" id="brandVersion">v{ver}</span>',
        content,
        count=1,
    )

    # Update app.js cache buster
    content = re.sub(
        r'/app\.js\?v=[^"]*',
        f'/app.js?v={ver}',
        content,
        count=1,
    )

    with open(HTML_FILE, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(content)


def update_readme(ver: str) -> None:
    if not os.path.isfile(README_FILE):
        return
    with open(README_FILE, "r", encoding="utf-8") as fh:
        content = fh.read()
    content = re.sub(
        r"# thomo\.ART StudioCockpit.*",
        f"# thomo.ART StudioCockpit (v{ver} - FLEXMOD Edition)",
        content,
        count=1,
    )
    with open(README_FILE, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(content)


def main():
    parser = argparse.ArgumentParser(description="thomo.ART StudioCockpit Version Manager")
    parser.add_argument("--bump", action="store_true", help="Version um 0.01 erhoehen")
    parser.add_argument("--set", type=str, help="Spezifische Version setzen")
    parser.add_argument("--sync", action="store_true", help="Versionuebernahme synchronisieren")
    args = parser.parse_args()

    current_ver = read_version()

    if args.set:
        new_ver = args.set.strip()
        print(f"Setze Version manuell: {current_ver} -> {new_ver}")
    elif args.sync:
        new_ver = current_ver
        print(f"Synchronisiere bestehende Version: {new_ver}")
    else:
        new_ver = bump_version_str(current_ver)
        print(f"Bumpe Version (+0.01): {current_ver} -> {new_ver}")

    write_version(new_ver)
    update_server_py(new_ver)
    update_html(new_ver)
    update_readme(new_ver)
    print("Fertig! Version ueberall aktualisiert.")


if __name__ == "__main__":
    main()
