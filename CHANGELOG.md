# Changelog

All notable changes to **thomo.ART StudioCockpit** are documented in this file.

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
