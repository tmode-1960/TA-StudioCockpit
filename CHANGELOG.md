# Changelog

All notable changes to **thomo.ART StudioCockpit** are documented in this file.

## [v1.85] – 2026-11-28
### Model Quick-Pill Highlight Fix
- **Exact-First Pill Matching (`web/app.js`):** Updated `updateModelSelection()` so fuzzy family matching (`krea`, `qwen`, `flux`, etc.) only runs when no quick-pill matches the selected preset exactly, preventing two pills (e.g. `Krea2-Turbo` and `Krea2-Turbo (Qwen3.5-9B PK)`) from being highlighted simultaneously.

## [v1.84] – 2026-11-28
### Plato's Keys Pre-Flight Validation & Error Translation
- **Encoder Mismatch Pre-Flight Check (`server.py`):** `handle_generate()` now verifies that the active preset's `clip_name_1` matches the donor encoder expected by the selected `plato_key` (e.g. `Qwen 3.5 9B/4B/2B/0.8B`, `Gemma 4`, `Qwen3-VL 4B`) before queuing the workflow.
- **Runtime Error Translation (`server.py`):** Translates ComfyUI `Multi-layer PlatoKey expects ...` / `PlatosKey` dimension errors into a clear, actionable message.

## [v1.83] – 2026-11-28
### PyInstaller Bundle Fix (`TA-FLEXMOD-LLM_v2.93.json`)
- **Fixed `.exe` Workflow Bundle (`StudioCockpit.spec`):** Updated `datas` in `StudioCockpit.spec` from `TA-FLEXMOD-LLM_v2.92.json` to `TA-FLEXMOD-LLM_v2.93.json` so the standalone `.exe` bundles the active workflow.

## [v1.82] – 2026-11-28
### ComfyUI V3 `COMBO` Parsing Fix for Plato's Keys
- **Fixed `plato_keys.Load` Key Discovery (`server.py`):** Added `_extract_combo_options()` to parse both ComfyUI V1 (`[[...], {...}]`) and ComfyUI V3 (`["COMBO", {"options": [...]}]`) `/object_info` schemas so `ComfyUI-PlatoKeys` keys appear in `#selPlatoKey`.

## [v1.81] – 2026-11-28
### Krea2 Preset Naming Freedom with Plato's Keys
- **No `clip_type` Override for Donor Encoders (`server.py`):** `_seed_or_repair_presets()` now only enforces `clip_type = "krea2"` on Krea2 presets that actually use a `Qwen3-VL` encoder, and `handle_generate()` skips the `krea2` `clip_type` check when a `plato_key` is active — so users can freely name Plato's Keys presets (e.g. `Krea2-Turbo (Qwen3.5-9B PK)`).

## [v1.80] – 2026-11-28
### In-App ComfyUI Restart Banner & 1-Click Reboot
- **ComfyUI Restart Endpoint (`server.py`):** Added `POST /api/comfy/restart` and `GET /api/comfy/restart_status` to trigger a ComfyUI reboot via ComfyUI-Manager (`/manager/reboot` / `/manager/restart`) and wait until ComfyUI is back online.
- **Prominent Restart Banners (`web/index.html`, `web/app.js`):** Added amber warning banners (`#platoRestartBanner`, `#nodesRestartBanner`) with a 1-click **`🔄 ComfyUI jetzt neu starten`** button after key downloads and custom node installations, automatically refreshing presets and Plato's Keys once ComfyUI reconnects.

## [v1.79] – 2026-11-28
### `extra_model_paths.yaml` Support & WSL Path Fix
- **Fixed WSL Temp-Path Conversion (`server.py`):** Replaced `wsl wslpath -u` with `self._to_wsl_path(tmp_path)` in `handle_plato_key_download()` so Windows backslashes are never stripped by WSL shell argument parsing.
- **`extra_model_paths.yaml` Integration (`server.py`):** Added `_resolve_plato_target_dir()` supporting `extra_models_dir` and ComfyUI's own `extra_model_paths.yaml` on both native Windows and WSL, automatically adding `clip_projections` / `plato_keys` entries if missing and including them in `studio_extra_model_paths.yaml`.

## [v1.78] – 2026-11-28
### WSL + Native Windows Support for Plato's Keys Downloader
- **WSL Key Downloader & Disk Check (`server.py`):** Updated `handle_plato_keys()` and `handle_plato_key_download()` to support both native Windows ComfyUI directories and WSL Linux paths (via `wslpath -u` and `wsl bash -c`), fixing the false `NO_COMFY_DIR` error when ComfyUI runs in WSL.

## [v1.77] – 2026-11-28
### Plato's Keys Auto-Installer & Hugging Face Key Downloader
- **Optional Node Packs (`server.py`):** Added `OPTIONAL_NODE_PACKS` (`ComfyUI-H3-Text-Encoders`, `ComfyUI-PlatoKeys`) with `required: False` so they never trigger startup missing-node popups while remaining 1-click installable via `POST /api/install_nodes`.
- **Key Downloader (`server.py`):** Added `PLATO_KEY_CATALOG`, `POST /api/plato_keys/download`, and `GET /api/plato_keys/download_status` with path-safety validation and progress tracking to download `.safetensors` keys from Hugging Face directly into `ComfyUI/models/clip_projections/` or `ComfyUI/models/plato_keys/`.
- **UI Integration (`web/index.html`, `web/app.js`):** Added contextual **Nodes installieren** / **Keys laden** actions directly under `🔑 Plato's Key (Opt-in)` in `#cardModel` as well as a dedicated **Plato's Keys** management & downloader section in Settings.

## [v1.76] – 2026-11-28
### Opt-In Plato's Keys Support (`TA-FLEXMOD-LLM v2.93`)
- **Workflow `TA-FLEXMOD-LLM_v2.93.json`:** Added opt-in `PlatosKeyPatchCLIP` (`ComfyUI-H3-Text-Encoders`) and `plato_keys.Load` / `plato_keys.PatchCLIP` (`ComfyUI-PlatoKeys`) nodes behind `TAModelPreset` (`2079`), bypassed (`MODE_BYPASS`) by default so users without Plato's Keys nodes experience zero breaking changes.
- **Backend & API (`comfy_client.py`, `server.py`):** Added `plato_key` routing in `build_flexmod_api_prompt()`, `GET /api/plato_keys` to discover installed keys and nodes from ComfyUI, and pre-flight node validation in `/api/generate`.
- **Image Studio UI (`web/index.html`, `web/app.js`):** Added an opt-in **Plato's Key** selector (`#selPlatoKey`) and status badge in `#cardModel`, persisted across restarts.

## [v1.74] – 2026-11-27
### Close Confirmation Modal UI Freeze Fix
- **Non-Blocking `on_closing()` Dispatch:** Dispatched `window.evaluate_js("window.__requestCloseConfirm ...")` via `threading.Timer(0.01, ...)` in `server.py` so `on_closing()` returns `False` immediately without deadlocking the WinForms/WebView2 UI thread, keeping the themed close confirmation modal responsive.

## [v1.73] – 2026-11-27
### Delimiter Label Collapse Arrow
- **Inline Collapse Arrow on Delimiter Label:** Moved the collapse/expand arrow (`▾`) from the Prompt Controller card header directly onto the **Delimiter** label (`.field-collapsible` in `web/index.html`, `web/style.css`, `web/app.js`), collapsed by default so clicking the label toggles `#inpDelimiter`.

## [v1.72] – 2026-11-27
### Themed App Close Confirmation Modal
- **Themed In-App Close Dialog:** Replaced the native Windows `MessageBoxW` close confirmation with a themed HTML modal (`#confirmAppCloseModal` in `web/index.html`, `web/app.js`) that matches the active Cockpit theme and UI language (`DE`/`EN`), triggered by `on_closing()` in `server.py` and confirmed via `POST /api/app/confirm_close`.

## [v1.71] – 2026-11-27
### Collapsible Prompt Controller Delimiter
- **Collapsible Delimiter Field:** Added `.card.collapsible-partial` with the standard header chevron (`▾`) to `#cardPromptController` (`web/index.html`, `web/style.css`, `web/app.js`) so the **Delimiter** field is collapsed by default while keeping **Controller Mode** visible, and can be expanded/collapsed by clicking the card header.

## [v1.70] – 2026-11-27
### Gallery Lightbox HUD Alignment
- **Stacked Right HUD Controls:** Arranged the **Filmstrip** and **Full View** buttons vertically (`.gal-lb-hud-right { flex-direction: column; align-items: stretch; }`) and aligned `.gal-lb-stage-hud` to `flex-start` (`web/style.css`).
- **Consistent Top-Right Exit Button:** Added `margin-left: auto` to `.gal-lb-hud-right` so **`✕ Vollbild schließen` / `✕ Exit Full View`** remains anchored at the top-right in Pure View when the left zoom bar is hidden.

## [v1.69] – 2026-11-27
### Gallery Pure View Buttons & Window Close Confirmation
- **Labeled Gallery Lightbox Controls:** Added localized DE/EN labels to the **Filmstrip** (`🎞️ Filmstrip`) and **Full View / Pure View** (`👁️ Vollbild` / `👁️ Full View`) HUD buttons (`web/index.html`, `web/gallery_module.js`, `web/style.css`).
- **Clear Exit Full View Button:** In active Pure View, the toggle button now clearly displays `✕ Vollbild schließen` / `✕ Exit Full View` at high visibility (`opacity: 0.92` instead of `0.35`) so users don't accidentally click the window close button. (`Esc` continues to exit Pure View first before closing the Lightbox.)
- **Configurable Close Confirmation (`confirm_close`):** Added a localized confirmation dialog when closing the Cockpit window in `server.py` (`on_closing`, bypassed automatically during auto-updater restarts) and a **Show confirmation dialog when closing Cockpit** checkbox in Settings (`web/index.html`, `web/app.js`, enabled by default).

## [v1.68] – 2026-11-27
### Gallery Lightbox Previous Button Fix
- **Fixed Left Navigation Button Hit Area (`.gal-lb-nav`):** Added `z-index: 6` to `.gal-lb-nav` in `web/style.css` so `.gal-lb-prev` (`‹`) renders and receives pointer events above `.gal-lb-canvas` (`will-change: transform`) across its entire button area instead of only at the far left edge.

## [v1.67] – 2026-11-27
### Clean Auto-Updater Disconnect Handling
- **Suppress `Failed to fetch` During Update Restart:** Updated the `Install now` click handler in `web/app.js` so connection-reset / disconnect errors (`Failed to fetch`, `NetworkError`, `Load failed`) during `/api/update/install` keep `window.__studioUpdating = true`, show a calm restarting status, and never flash a red `Failed to fetch` toast.
- **VideoMaker Toast Guard:** Updated `showToast()` in `web/video_module.js` to also respect `window.__studioUpdating` and suppress error toasts while an update restart is in progress.

## [v1.66] – 2026-11-27
### Pre-Flight VAE Check & Error Handling
- **Pre-Flight VAE Check & Clear Error Message:** Added a pre-generation check in `server.py` (`/api/generate`) verifying that the active `TAModelPreset` has a configured `vae_name` and that the VAE file exists in ComfyUI's `/models/vae`, plus a clear translation for `'NoneType' object has no attribute 'decode'` in `watch_job` so missing/invalid VAEs no longer surface as a cryptic Python error.

## [v1.65] – 2026-11-27
### Extra Models & LoRAs Folder Setting
- **Optional Extra Models & LoRAs Folder (`extra_models_dir`):** Added an optional **Extra Models & LoRAs Folder** input with **Browse / Durchsuchen** in the ComfyUI Settings section (`web/index.html`, `web/app.js`, `server.py`).
- **Safe Non-Destructive ComfyUI Config:** When configured, `handle_launch_comfy` in `server.py` generates a separate `data/studio_extra_model_paths.yaml` (translating Windows/WSL UNC paths to `/mnt/<drive>/...` or `/...` for WSL launches) and passes it via `--extra-model-paths-config` without touching or overwriting any existing user `extra_model_paths.yaml`.

## [v1.64] – 2026-11-27
### VideoMaker Models Folder Browser Fix
- **Fixed `/api/video/browse_folder`:** Implemented the missing `POST /api/video/browse_folder` endpoint in `modules/video_maker.py` (`_pick_folder_dialog`) so clicking **Browse / Durchsuchen** in VideoMaker's Models modal opens the native folder picker (supporting `pywebview`, Windows PowerShell `FolderBrowserDialog` in `--browser` mode, and `tkinter` fallback) and returns `path` + `free_space_gb` for custom model/LoRA drives and folders.

## [v1.62] – 2026-11-27
### Inline Card Help (`Prompt Controller` & `LLM`)
- **Inline Card Help (`Prompt Controller` & `LLM`):** Added `?` help toggle buttons and localized DE/EN `.card-help-box` explanations (`helpPromptController`, `helpLLM`) to `#cardPromptController` and `#cardLLM` in `web/index.html` and `web/app.js`.

## [v1.61] – 2026-11-27
### LLM Provider Status & Selection Fixes
- **Per-Provider LLM Status Check:** Updated `checkLLMStatus()` and `updateLLMModelBadge()` in `web/app.js` so the status badge validates the *currently selected model's provider* (`LM Studio`, `Ollama`, or specific cloud provider like `Gemini`) instead of showing `Online` whenever any unrelated provider is reachable.
- **Automatic Fallback & Offline Tagging:** Added automatic fallback to an available model (`findBestAvailableLLMModel`) when switching to `T2I`/`I2I` or on initial/inactive checks, and marked unreachable provider models with an `offline` badge in the model dropdown (`web/app.js`, `web/style.css`).
- **Pre-Generation Offline Guard:** `startGeneration()` now re-checks `/api/check_llm` when LLM mode is active and blocks submission with a clear error toast if the selected model's provider is offline.

## [v1.60] – 2026-11-26
### Windows Auto-Updater Fixes
- **Clean Process Exit on Update:** Fixed `_request_app_exit()` in `server.py` so the HTTP server and Python process always shut down (`httpd.shutdown()` + `os._exit(0)`) after destroying the WebView window.
- **Silent PowerShell Updater:** Replaced `cmd /c apply_update.bat` (`tasklist | find`) in `modules/updater.py` with a hidden PowerShell script (`apply_update.ps1` using `Wait-Process`, `Stop-Process`, `Copy-Item`, and `Start-Process`) launched with `DEVNULL` stdio and `SW_HIDE` so Windows 11 Terminal never pops up or hangs.
- **Clean PyInstaller Relaunch:** Stripped inherited `_MEIPASS*` and `_PYI_*` environment variables both in `subprocess.Popen` and inside `apply_update.ps1` so the updated `StudioCockpit.exe` unpacks its own temporary `_MEI` directory instead of failing with `Failed to load Python DLL`.
- **Suppress Restart Fetch Toasts:** Set `window.__studioUpdating = true` in `web/app.js` as soon as the user clicks **Install now** so transient `"Failed to fetch"` error toasts are suppressed during server shutdown.

## [v1.57] – 2026-11-26
### Antigravity Skill Packaging (`studio-cockpit`)
- **Updated Bundled `studio-cockpit` Skill:** Included the `video adopt-audio` command, `/api/video/upload_image` fallback in `video adopt`, and corrected `first_frame` / `audio_file` `/api/video/uploads/...` URL documentation in the release build (`dist\tA-Studio-Cockpit\antigravity\skills\studio-cockpit` and release `.zip`).

## [v1.56] – 2026-11-26
### Unified Antigravity Integration (`studio-cockpit` Skill)
- **All-in-One Studio Skill & CLI:** Added `.agents/skills/studio-cockpit/SKILL.md` and `.agents/skills/studio-cockpit/scripts/cockpit_client.py` to control **Image Studio**, **VideoMaker**, **MusicMaker**, and **DiscordGIF** directly via `/api/*` (including cross-module workflows such as Image → VideoMaker Quick Clip / AI GIF + MusicMaker soundtrack).
- **Release Packaging:** Updated `build_dist.bat` and `README.md` to bundle both `studio-cockpit` and `music-maker` skills into `antigravity\skills\` in the distribution folder and release `.zip`.

## [v1.55] – 2026-11-26
### Release Packaging & Documentation
- **Bundled Antigravity MusicMaker Skill:** Updated `build_dist.bat` to include `.agents/skills/music-maker/` under `antigravity\skills\music-maker` in both `dist\tA-Studio-Cockpit\` and the release `.zip`, and documented the one-step global install (`%USERPROFILE%\.gemini\config\skills\music-maker`) for `.exe` users in `README.md`.

## [v1.54] – 2026-11-26
### MusicMaker & Antigravity Integration
- **History Tab Auto-Refresh:** Switching to the **History** tab in `web/music/app.js` (`showTab`) now calls `loadHistory()` so songs rendered externally via `/api/music/render` appear immediately without a page reload.
- **MusicMaker Antigravity Skill:** Added `.agents/skills/music-maker/SKILL.md` and `.agents/skills/music-maker/scripts/music_client.py` to send song briefs, drafts, lyrics, and render jobs directly to Studio Cockpit's `/api/music/*` API.

## [v1.53] – 2026-11-26
### Image Studio UI
- **Upscale & FX Help Text:** Updated `help_tuning_html` (DE & EN) in `web/app.js` to reference **Upscale & FX** instead of **Upscale** and to mention SeedVR2 upscaling, sharpening, and film grain.

## [v1.52] – 2026-11-26
### VideoMaker UI
- **Consistent Tab Icons & Order:** Added matching icons to all VideoMaker tabs (`🎬`, `⚡`, `🎵`, `🗣️`, `🌀`, `🎞️`, `⚙️`) in `web/video_module.js` and moved **Morph & Transform** after **Lipsync Studio** in both `#vm_tabs` and `#vm_modeSeg` (`web/index.html`).

## [v1.51] – 2026-11-26
### UI & Gallery Fixes
- **Long Clip Start Frame Label Layout:** Allowed `.studio-layout-video .frame-box-label` in `web/style.css` to wrap cleanly so the Start Frame label sits on its own line above the `Image→Prompt` / `H3 Image` buttons instead of squeezing into 4 narrow lines.
- **Gallery → DiscordGIF AI GIF Tab:** Added `window.sendImageToDiscordGif` in `web/gif_module.js` and wired `btnGalLbGif` in `web/gallery_module.js` to initialize DiscordGIF, switch directly to the **AI GIF** tab, and load the image into the AI-GIF dropzone.

## [v1.50] – 2026-11-26
### VideoMaker
- **Quick Clip & Long Clip First Frame Sync:** Sending an image to VideoMaker (`sendImageToVideoMaker` in `web/video_module.js`) now populates both **Quick Clip** (`vm_quickFirstFrameDrop`) and **Long Clip** (`vm_longFirstFrameDrop`) first-frame slots simultaneously while opening the Quick Clip tab.

## [v1.49] – 2026-11-26
### VideoMaker / Gallery Fix
- **Auto-Switch to Quick Clip & Gallery Media Resolution:** Fixed `sendImageToVideoMaker` in `web/video_module.js` calling a non-existent `switchTab()` instead of clicking `#vm_tabs button[data-tab="quick"]`, switched Gallery's VideoMaker button (`web/gallery_module.js`) to pass `item.url || item.path`, and updated `/api/video/adopt_studio_image` in `modules/video_maker.py` to resolve `/api/gallery/media?root=...&path=...` and relative paths via `gallery_indexer`.

<details>
<summary>Older releases (v1.10 – v1.48)</summary>

## [v1.48] – 2026-11-26
### VideoMaker / Gallery Fix
- **Send Image to VideoMaker Preview:** Fixed `sendImageToVideoMaker` in `web/video_module.js` targeting non-existent `quickFirstPreview`/`lipsyncPortraitPreview` IDs instead of `vm_quickFirstFrameDrop`/`vm_lipsyncPortraitDrop`, so images sent from Gallery, Image Studio, or DiscordGIF now render immediately in the Quick Clip first-frame (and Lipsync portrait) dropzone.

## [v1.47] – 2026-11-26
### Branding & UI
- **Original Glassmorphic `tA` Logo:** Switched `app.ico`, `web/favicon.ico`, `web/logo.png`, and `assets/branding/logo_tA.png` to the original connected 3D glassmorphic `tA` squircle design.

## [v1.46] – 2026-11-25
### Branding & UI
- **New `tA` App Icon & Header Logo:** Replaced the placeholder palette emoji and legacy icon with a sharp, 3D glassmorphic `tA` squircle logo across `app.ico`, `web/favicon.ico`, `web/logo.png`, and the top navigation bar (`web/index.html`, `web/style.css`), and bundled `web/logo.png` in `StudioCockpit.spec` for the standalone `.exe`.

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

</details>
