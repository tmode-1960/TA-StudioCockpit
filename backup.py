"""Backup utility for thomo.ART StudioCockpit.
Creates a timestamped snapshot of all code, templates, and configurations in `backups/`.
"""
import os
import shutil
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")


def create_backup(label: str = "") -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ver = "v?"
    ver_file = os.path.join(BASE_DIR, "version.txt")
    if os.path.isfile(ver_file):
        with open(ver_file, "r", encoding="utf-8") as f:
            ver = f"v{f.read().strip()}"

    folder_name = f"{timestamp}_{ver}"
    if label:
        safe_label = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in label)
        folder_name += f"_{safe_label}"

    dest_dir = os.path.join(BACKUPS_DIR, folder_name)
    os.makedirs(dest_dir, exist_ok=True)

    # 1. Copy web folder
    shutil.copytree(os.path.join(BASE_DIR, "web"), os.path.join(dest_dir, "web"), dirs_exist_ok=True)

    # 2. Copy root python files and configs
    files_to_copy = [
        "server.py",
        "comfy_client.py",
        "bump_version.py",
        "version.txt",
        "start.bat",
        "start_console.bat",
        "build_app.bat",
        "README.md",
    ]
    for fn in files_to_copy:
        src = os.path.join(BASE_DIR, fn)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(dest_dir, fn))

    # 3. Copy data config if present
    data_dir = os.path.join(dest_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    cfg_src = os.path.join(BASE_DIR, "data", "config.json")
    if os.path.isfile(cfg_src):
        shutil.copy2(cfg_src, os.path.join(data_dir, "config.json"))

    print(f"BACKUP_SUCCESS: {dest_dir}")
    return dest_dir


if __name__ == "__main__":
    lbl = sys.argv[1] if len(sys.argv) > 1 else ""
    create_backup(lbl)
