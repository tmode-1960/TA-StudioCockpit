---
trigger: always_on
description: Automatically rebuild the distributable Windows bundle in dist/ after code or asset changes.
---

# Auto-Build Rule for tA-Studio-Cockpit

Whenever you modify application code, web UI assets, workflow files, or build configuration (`server.py`, `comfy_client.py`, `web/`, `workflows/`, `app.ico`, `StudioCockpit.spec`, `version.txt`):

1. Always run `cmd /c build_dist.bat --nopause` before finishing your task so that `dist/tA-Studio-Cockpit/StudioCockpit.exe` and the release `.zip` in `dist/` are always up to date.
2. Always update `CHANGELOG.md` and the `Recent Changes (Changelog)` section in `README.md` with the changes for the resulting version in `version.txt` on every build (keeping `README.md` and `dist/tA-Studio-Cockpit/README.md` in sync if updated after the bump).
3. Do not ask the user to run build scripts or watchers manually.
