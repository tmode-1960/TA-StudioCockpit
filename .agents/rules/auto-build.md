---
trigger: always_on
description: Automatically rebuild the distributable Windows bundle in dist/ after code or asset changes.
---

# Auto-Build Rule for tA-Studio-Cockpit

Whenever you modify application code, web UI assets, workflow files, or build configuration (`server.py`, `comfy_client.py`, `web/`, `workflows/`, `app.ico`, `StudioCockpit.spec`, `version.txt`):

1. Always run `cmd /c build_dist.bat --nopause` before finishing your task so that `dist/tA-Studio-Cockpit/StudioCockpit.exe` and the release `.zip` in `dist/` are always up to date.
2. Do not ask the user to run build scripts or watchers manually.
