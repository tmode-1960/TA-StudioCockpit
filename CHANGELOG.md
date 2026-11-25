# Changelog

All notable changes to **thomo.ART StudioCockpit** are documented in this file.

## [v1.45] – 2026-11-25
### Branding & UI
- **New `tA` App Icon & Header Logo:** Replaced the placeholder palette emoji and legacy icon with a sharp, 3D glassmorphic `tA` squircle logo across `app.ico`, `web/favicon.ico`, `web/logo.png`, and the top navigation bar (`web/index.html`, `web/style.css`).

## [v1.44] – 2026-11-25
### VideoMaker (Optional RefPacks)
- **Optional BExplains RefPacks & MiniMax H3 RefPacks Support:** Added opt-in support for `ComfyUI-RefPacks` and `ComfyUI-MiniMax-H3-RefPacks` (`required: False` in Extensions, reusing existing MiniMax H3 models without extra AI weight downloads). Includes `/api/video/refpacks/list` & `/api/video/refpacks/create` endpoints, role-aware `<Character>`/`<Outfit>`/`<Location>`/`<Style>`/`<Item>`/`<Motion>` tag protection, optional RefPack workflow wiring in Quick Clip, Long Clip, Scene, and H3 Image workflows, and a collapsible RefPacks panel in Quick Clip & Long Clip (`modules/video_comfy.py`, `modules/video_maker.py`, `web/index.html`, `web/video_module.js`).

## [v1.43] – 2026-11-25
### Settings & Storage
- **Module Output Folders:** Added optional custom output folder settings for **VideoMaker** (`video_output_dir`) and **MusicMaker** (`music_output_dir`) in **Settings & Connections** (ordered **VideoMaker → MusicMaker → DiscordGIF**), falling back to the default ComfyUI / App output directories when left empty (`server.py`, `modules/music_maker/music_service.py`, `web/index.html`, `web/app.js`).

## [v1.42] – 2026-11-25
### UI / UX
- **Tab Naming:** Renamed the Image Studio **Upscale** tab to **Upscale & FX** (`web/index.html`, `web/app.js`) to better surface Laplacian Sharpness and Film Grain controls.

## [v1.41] – 2026-11-25
### Localization
- **Default Language (`en`):** Changed the default UI language from German (`de`) to English (`en`) in `server.py`, `web/app.js`, `web/gallery_module.js`, `web/gif_module.js`, and `web/video_module.js` (German can still be selected in Settings).

## [v1.40] – 2026-11-25
### UI Fix
- **Filmstrip Preview State:** Ensured `#emptyState` is hidden and `#mainPreview` is shown when loading an image from the session filmstrip/gallery (`web/app.js`).

## [v1.39] – 2026-11-25
### Release Defaults
- **Neutral Signature Defaults:** Unchecked `#chkOverlaySig` by default, cleared the prefilled `thomo.ART` signature text in `#txtOverlaySig`, and replaced the `"thomo.ART"` fallback label in `web/app.js` with localized `"Signatur"` (`web/index.html`, `web/app.js`).

## [v1.38] – 2026-11-25
### UI Fix
- **Initial Preview State:** Fixed a broken `Vorschau` image icon in the standalone `.exe` by displaying `#emptyState` on startup and hiding `#mainPreview` until an image is loaded or generated (`web/index.html`).

## [v1.37] – 2026-11-25
### License & Documentation
- **GNU GPL v3.0:** Switched project license from Apache 2.0 to **GNU General Public License v3.0** (`LICENSE`, `NOTICE`, `README.md`) while preserving `thomo.ART` / `StudioCockpit` trademark and brand asset notices.
- **Credits & Acknowledgements:** Added credits in `README.md` for `HammelArt-Atelier`, `Plenio Music Production System`, VideoMaker workflow references (`minimaxH3Lipsync_v41.json`), and `CodexMundi`.

## [v1.36] – 2026-11-25
### Documentation
- **README overhaul:** Expanded the **Integrated Studio Modules** section in `README.md` with balanced, user-focused descriptions, collapsible `<details>` technical blocks, and a UI screenshot (`assets/screenshot.jpg`).

## [v1.35] – 2026-11-25
### Security, Release & Documentation
- **Updater hardening:** Restricted `modules/updater.py` download and redirect targets to official GitHub release domains (`github.com`, `*.githubusercontent.com`) and added a 512 MB archive size cap.
- **POST payload limit:** Added `Content-Length` validation and a 256 MB body limit (`HTTP 413`) in `server.py`.
- **Release tooling & repo hygiene:** Added `requirements.txt`, automatic `.sha256` checksum generation in `build_dist.bat`, `.github/ISSUE_TEMPLATE/bug_report.md`, and excluded local gallery cache/history files from Git.

## [v1.34] – 2026-11-25
### Gallery UX
- **Infinite scroll auto-loading:** Automatically loads additional gallery pages when scrolling near the bottom of the grid.

## [v1.33] – 2026-11-25
### Gallery Lightbox
- **Prompt to T2I:** Added a **Prompt to T2I** button in the Gallery Lightbox to send the image's prompt directly into the Image Studio.

## [v1.32] – 2026-11-25
### Gallery & Image Studio Handoff
- **Multi-root parameter reload:** Supported loading generation parameters from all configured gallery root folders.
- **Use as I2I:** Added a **Use as I2I** button in the Gallery Lightbox.

## [v1.31] – 2026-11-25
### Gallery Navigation
- **Persist gallery root:** Saved the selected gallery root folder across app restarts.

## [v1.30] – 2026-11-25
### Gallery Metadata
- **Deep node resolution:** Resolved wired text nodes and `UnetLoaderGGUF` entries when extracting ComfyUI metadata in the gallery indexer.

## [v1.29] – 2026-11-25
### Studio Navigation
- **Persist active module:** StudioCockpit now remembers the last opened module (`Images`, `Gallery`, `DiscordGIF`, `VideoMaker`, `MusicMaker`) across restarts via `localStorage`.

## [v1.28] – 2026-11-25
### Gallery UX & Discoverability
- **Explicit permanent delete buttons:** Labeled the permanent delete buttons clearly (`🔥 Endgültig löschen` / `🔥 Delete Permanently`) in both the Gallery batch bar and the Lightbox.
- **Shortcuts overview modal:** Added a `⌨️ Shortcuts` button in the Gallery toolbar that opens a themed modal listing all active Gallery Grid and Lightbox keyboard shortcuts.

## [v1.27] – 2026-11-25
### Gallery Dialogs
- **Themed confirmation modal:** Replaced native `window.confirm` delete dialogs with a centered, theme-matching `#galConfirmModal` supporting `Escape`/`Enter` and backdrop dismissal.

## [v1.26] – 2026-11-25
### Gallery Sidebar
- **User-created folders only:** Tracked folders created via `+ Neu` in `custom_folders.json` and filtered the sidebar `FOLDERS` list so auto-discovered or empty ComfyUI subfolders are no longer shown.

## [v1.25] – 2026-11-25
### Desktop Window & Selection
- **Text selection in prompt fields:** Enabled `text_select: True` in `pywebview.create_window` and added `user-select: text` on Lightbox prompt fields so prompt text can be selected and copied with the mouse.

## [v1.24] – 2026-11-25
### Gallery Metadata
- **LLM/I2I prompt extraction:** Updated `extract_image_metadata` to prefer the sidecar `.txt` prompt when `TAPromptController` is not in `Manual Only` mode or `TASmartLLM` is enabled, instead of showing the inactive `TAPromptHub` manual prompt. Bumped gallery index `meta_v` to `2` to refresh existing entries automatically.

## [v1.23] – 2026-11-25
### Text Overlays
- **Auto-contrast font color:** Added an auto-contrast black/white font color option for text overlays.

## [v1.22] – 2026-11-25
### Security & Repository Hygiene
- **Repository cleanup:** Reset personal/local paths in `data/gif_config.json` and `music_maker/config.json` to neutral defaults; removed internal analysis report.
- **VideoMaker endpoint hardening:**
  - Validated `comfy_url` in `/api/video/config` to allow only `http://` / `https://` URLs without control characters or whitespace.
  - Restricted `/api/video/open_output_folder` to `get_output_dir()`, `UPLOADS_DIR`, and `DATA_DIR`.
- **Download safety limits:** Added a 100 GB cap on sparse pre-allocation from `Content-Range` in `modules/video_maker.py` and a 2 GB cap in `ComfyClient.download_file` (`modules/video_comfy.py`).
- **DOM-XSS hardening:** Escaped dynamic image URLs with `escapeHtml(...)` in `web/video_module.js`.

## [v1.21] – 2026-11-25
### Security Hardening
- **Path traversal & Zip-Slip protection:**
  - Added `_is_path_within` checks for write paths in `handle_bg_remove`, `handle_delete_image`, `adopt_studio_image`, `resolve_image_file`, and `resolve_audio_file`.
  - Added Zip-Slip validation in `server.py` (`_install_single_pack`) and `modules/video_comfy.py` (`install_extension`), plus `repo_url` / `folder_name` validation and `--` argument separation for `git clone`.
- **Command & filter injection protection:**
  - Restricted `/api/open_file` and `/api/reveal_file` in `modules/music_maker/music_service.py` to allowed directories and blocked executable file extensions on `/api/open_file`.
  - Quoted WSL shell arguments with `shlex.quote` in `_install_single_pack`, hardened `_FORBIDDEN_LAUNCH_TOKENS` and WSL start commands, sanitized FFmpeg font/concat strings, and validated `f0_method` in `modules/music_maker/voice_swap.py`.
- **DNS rebinding & config protection:**
  - Added `Host` header validation (`_check_host_header`) for both `do_GET` and `do_POST` in `server.py`.
  - Added an explicit `ALLOWED_CONFIG_KEYS` whitelist to `save_config`.
- **Stability & DoS protection:**
  - Added `timeout=` parameters to FFmpeg/ffprobe/Demucs subprocess calls, capped WebSocket frame sizes to 16 MB in `modules/music_maker/comfy_client.py`, fixed `ACTIVE_JOBS` state updates to preserve existing fields, and fixed `rel_depth` off-by-one in `modules/video_models.py`.

## [v1.20] – 2026-11-24
- Added Apache License 2.0 (`LICENSE` and `NOTICE`).
- Added `TODO.md` with RVC voice conversion roadmap.
- Hid console windows when generating gallery video thumbnails with FFmpeg.

## [v1.19]
- Added Gallery Purgatory, Lightbox zoom/filmstrip/pure-view, deep metadata + Clean PNG, and notes/filters.

## [v1.18]
- Fixed VideoMaker duration preset button active highlight.

## [v1.17]
- Fixed VideoMaker column scrolling in grid layout.

## [v1.16]
- Added `mtime` cache-buster and `no-cache` headers to gallery `/output/` images.

## [v1.15]
- Fixed I2I upload status indicator and blocked I2I generation without an uploaded image.

## [v1.14]
- Added friendly ComfyUI-offline notice in the Preset Editor modal.

## [v1.13]
- Fixed core StudioCockpit DE/EN localization attributes and keys.

## [v1.12]
- Fixed VideoMaker DE/EN localization, i18n keys, and language sync.

## [v1.11]
- Fixed DiscordGIF DE/EN localization and `escHtml` scope.

## [v1.10]
- Fixed MusicMaker DE/EN localization and studio sync.
