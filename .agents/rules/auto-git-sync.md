---
trigger: always_on
description: Automatically commit and push changes to the private dev repo (origin) after completing code or build changes.
---

# Auto-Git-Sync Rule for tA-Studio-Cockpit

Whenever you modify files and finish a task (after running `cmd /c build_dist.bat --nopause` if applicable):

1. Check `git status --short`. If there are changes, stage (`git add -A`), commit with a concise message (including the current version from `version.txt`), and push to `origin` (`TA-StudioCockpit-Dev` on branch `main`).
2. **Never** push to `release` (`TA-StudioCockpit`) unless the user explicitly asks to publish a release.
