---
trigger: always_on
description: Automatically commit changes locally after completing code or build changes; push only on explicit user request.
---

# Auto-Git-Sync Rule for tA-Studio-Cockpit

Whenever you modify files and finish a task (after running `cmd /c build_dist.bat --nopause` if applicable):

1. Check `git status --short`. If there are changes, stage (`git add -A`) and commit locally with a concise message (including the current version from `version.txt`).
2. **Never** push to `origin` (`TA-StudioCockpit-Dev`) or `release` (`TA-StudioCockpit`) unless the user explicitly asks to push or publish a release.
