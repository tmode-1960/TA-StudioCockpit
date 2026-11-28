# thomo.ART StudioCockpit (v1.89 - FLEXMOD Edition)

An all-in-one Windows desktop & web studio for AI image generation, media management, animated Discord GIFs, AI video production, and AI music creation — powered by **ComfyUI** and **TA-FLEXMOD-LLM** in the signature **thomo.ART** Studio UI design.

![thomo.ART StudioCockpit](assets/screenshot.jpg)

---

## 🧩 Integrated Studio Modules

### 🎨 Image Studio
* **Model & LoRA Hub:** Select model presets (*ZImage*, *Qwen-Image 2.1*, *Krea2-Turbo*, *FLUX3-Klein*, *MOSS-Image*, *FLUX1-DEV-FP8*, *Minimax H3 Image*, etc.) with quick-access favorite pills, plus an integrated LoRA stack with live strength sliders and automatic trigger-word detection.
* **AI Prompt Engine (3-Way):** Switch between `🚫 Manual`, `✨ T2I Booster`, and `🖼️ I2I Analysis` (Vision-LLM + image upload) across `positive`, `additional`, and `negative` prompt channels using local LLMs (LM Studio, Ollama) or optional cloud providers (Gemini, OpenAI, OpenRouter, Groq).
* **Sampling, Upscaling & Overlays:** 1-click sampler & aspect-ratio presets (`16:9`, `1:1`, `9:16`, `4:3`, `21:9`), AI upscaling, sharpening, background removal, signature/text overlays with auto-contrast font color, and before/after comparison.
* **Studio Viewer & Session Filmstrip:** Review generations with 1-click actions (*Reuse Seed*, *Apply All Parameters*, *Send to DiscordGIF*, *Send to VideoMaker*).

<details>
<summary>Technical details & tabs (Image Studio)</summary>

* **ComfyUI / FLEXMOD Nodes ([TA-ComfyUI-Nodes-Pack](https://github.com/tmode-1960/TA-ComfyUI-Nodes-Pack)):** Powered by `TAModelPreset`, `TASamplerPreset`, `TASmartLLM`, `TAPromptHub`, `TAPromptController`, `TASeedVR2Gate`, and `TAFastLaplacianSharpen`.
* **Right-Panel Tabs:** Organized into **Sampling** (seed mode, sampler presets, dimensions), **Upscale & FX** (SeedVR2, sharpening & film grain), **Export** (lossless PNG & output options), and **Signature** (signature & text overlays).
* **Security:** Cloud LLM API keys are stored encrypted via Windows DPAPI (`CryptProtectData`).

</details>

### 🖼️ Gallery
* **Fast Multi-Root Indexer:** Browse local images and videos (`.png`, `.jpg`, `.webp`, `.mp4`, `.webm`, `.mov`) across multiple persisted root folders with a persistent JPEG/FFmpeg thumbnail cache and infinite scroll auto-loading.
* **Flexible Views & Organization:** Switch between **Masonry**, **1:1 Grid**, and **Explorer Rows** with live layout tuning, custom user folders, favorites, search/filtering, and a personal-notes filter.
* **Lightbox Inspector & 1-Click Reuse:** Inspect zoomable media with a bottom filmstrip, personal notes, and embedded generation metadata — and jump straight back into **Image Studio** via **Reload Parameters**, **Prompt to T2I**, or **Use as I2I**, or hand off directly to **DiscordGIF** / **VideoMaker**.
* **Batch Actions & Safe Delete:** Multi-select items to move, copy, stage in **Purgatory** (with 1-click rescue), or permanently delete (with themed confirmation modal) plus a built-in keyboard shortcuts modal.

<details>
<summary>Metadata & workflow details (Gallery)</summary>

* **Metadata Extraction:** Resolves wired text nodes, `UnetLoaderGGUF` checkpoints, and LLM/I2I sidecar prompts directly from generated files.
* **Pure View & Zoom:** Supports 1:1 pixel zoom, fit-to-screen, and distraction-free pure mode in the Lightbox.

</details>

### 👾 DiscordGIF
* **Local Library & Tenor Search:** Manage your local animated GIF collection, browse category pills, organize favorites, and search/download GIFs directly from Tenor.
* **AI Image-to-GIF:** Animate any uploaded image — or an image sent directly from **Image Studio** or **Gallery** — using ComfyUI animation workflows.
* **Discord Quick-Paste (`Alt+G`):** Send or copy GIFs straight into Discord via Win32 clipboard/file-drop integration with optional auto-paste and a configurable global hotkey.

<details>
<summary>Workflow & configuration details (DiscordGIF)</summary>

* **Direct Cross-Module Handoff:** Both the Image Studio viewer and Gallery Lightbox include a 1-click *Send to DiscordGIF* action that preloads the image into the AI GIF generator.
* **Custom GIF Folder:** Configure and rescan any local folder as your active GIF collection.

</details>

### 🎬 VideoMaker
* **Complete MiniMax H3 / Wan 2.2 Suite:** Integrated 7-tab ComfyUI video production workspace directly inside StudioCockpit:
  * **Storyboard & Director:** Multi-shot sequences with FL2V continuity (`from_prev`) and an integrated AI Storyboard Assistant.
  * **Quick Clip, Morph & Transform, Long Clip:** Fast single takes, frame-to-frame morphing, and extended multi-segment clips (with optional **BExplains RefPacks** for reusable VAE-cached character, outfit, location, and style references).
  * **Lipsync & Avatar Studio:** Audio-driven portrait animation (MiniMax H3 + Wav2Vec2 + Eclipse) with optional Demucs vocal isolation and captions.
  * **Player & FFmpeg Stitcher:** Combine scenes, apply bundled film LUTs (`.cube`), add auto-matched soundscapes, and upscale Eco renders to 1080p.
  * **Models:** Pre-flight checkpoint verification, disk-space checks, and a resumable multi-part downloader.
* **Project & Cross-Module Handoff:** Save/load entire video projects and send images straight from **Image Studio** or **Gallery** into VideoMaker.

<details>
<summary>Hardware & setup details (VideoMaker)</summary>

* **Hardware Profiles & Turbo Mode:** Adapts resolution/preset defaults to your GPU profile and tracks live ComfyUI render progress with cancel support.
* **Extensions & ComfyUI Control:** Built-in extension status check, installer, and ComfyUI restart trigger (including optional `BExplains RefPacks` + `MiniMax H3 RefPacks`, reusing existing H3 weights with no extra AI model downloads).

</details>

### 🎵 MusicMaker
* **AI Song Generation (`YuE2-Song`):** Create full songs from style prompts, **Lyrics & Song Sheet** structures, and Plenio templates, complete with generated cover artwork and a persistent **History** tab.
* **Mastering, Refine & Voice Swap:** Optional 48 kHz audio refinement (`Refine`) and custom voice conversion (**RVC**) via a local Applio backend with selectable voice models.
* **Subtitles & Translation:** Automatic `.srt` lyric alignment via `faster-whisper`, bidirectional **EN ↔ DE** `.srt` translation, and DaVinci Resolve-ready subtitle export.
* **Integrated Player & Results:** Preview tracks with synchronized lyrics in the **Player** tab and download audio, cover artwork, and `.srt` files from **Results**.

<details>
<summary>Tab structure & audio backends (MusicMaker)</summary>

* **5 Tabs:** **Lyrics & Sheet**, **Mastering & Refine**, **Player**, **Results**, and **History**.
* **Optional RVC Setup:** Configure a custom voice models directory (or use the Applio default) in MusicMaker settings; includes a reference voice-recording guide (`Stimmaufnahme-Vorlage-RVC.pdf`).
* **Antigravity Skills (`.exe` & Repo):** Repo users get both `studio-cockpit` (all 4 modules + cross-module pipelines) and `music-maker` automatically from `.agents/skills/`. Standalone `.exe` / release-ZIP users can copy `antigravity\skills\*` into `%USERPROFILE%\.gemini\config\skills\` (requires Python 3 and a running Studio Cockpit on port `8095`) to control Image Studio, VideoMaker, MusicMaker, and DiscordGIF directly from Antigravity.

</details>

---

## ⚙️ Platform & Desktop Features
* **Native Desktop App (`pywebview` / Edge WebView2):** Runs as a standalone Windows app (`StudioCockpit.exe`) or in any browser via `--browser` on port `8095`.
* **Themes & Localization:** Multiple dark/light studio themes + accent colors, bilingual UI (**Deutsch / English**), and persisted active module across restarts.
* **Hardware & ComfyUI Control:** Live GPU/VRAM monitoring, ComfyUI launcher & status indicator (port `8188`), and built-in GitHub release updater.

---

## 📋 Requirements & Setup

### Option A: Standalone Windows Release (`StudioCockpit.exe`)
1. Download the latest `tA-Studio-Cockpit_vX.XX_win64.zip` from [GitHub Releases](https://github.com/tmode-1960/TA-StudioCockpit/releases) and extract it.
2. Start **ComfyUI** (`http://127.0.0.1:8188`) — or configure the ComfyUI launcher inside StudioCockpit.
3. Run **`StudioCockpit.exe`** (or **`start.bat`** when running from source). The desktop window opens automatically (browser fallback: `http://127.0.0.1:8095`).

> **Note on Windows SmartScreen:** `StudioCockpit.exe` is currently not code-signed (`codesign_identity=None`), so Windows Defender SmartScreen may display an "Unknown publisher" warning on first launch. Verify the release archive if needed and choose *More info → Run anyway*.

### Option B: Running from Python Source
1. Python **3.11+** (Windows) and Git.
2. Clone the repository:
   ```bash
   git clone https://github.com/tmode-1960/TA-StudioCockpit.git
   cd TA-StudioCockpit
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the app:
   ```bash
   python server.py
   ```
   Use `python server.py --browser` to open in your default web browser instead of the desktop window.

### Required External Backends & ComfyUI Nodes
* **ComfyUI (`http://127.0.0.1:8188`):** Required backend for **Image Studio**, **VideoMaker**, **MusicMaker**, and **DiscordGIF** (AI Image-to-GIF; local GIF library, Tenor search, and Quick-Paste work standalone).
* **Image Studio Core Nodes ([TA-ComfyUI-Nodes-Pack](https://github.com/tmode-1960/TA-ComfyUI-Nodes-Pack)):** **Required** for image generation in **Image Studio** (`TA-FLEXMOD-LLM` & `TA-*` nodes in ComfyUI `custom_nodes`).
* **Module-Specific ComfyUI Nodes:** Required only when using those modules — e.g., MiniMax H3 / Wan 2.2 / VHS / Eclipse (for **VideoMaker**), `SeedVR2` / background-removal (for **Upscale & FX** / **BG-Remover**), or `YuE2` (for **MusicMaker**).

### Optional External Tools & Backends
* **FFmpeg (`ffmpeg` / `ffprobe` in `PATH`):** Required for video stitching, LUT grading, GIF compilation, and gallery video thumbnails.
* **LM Studio / Ollama:** Optional local LLM backends for prompt boosting and I2I image analysis.
* **Applio (RVC):** Optional local installation for voice conversion in MusicMaker.
* **BExplains RefPacks (`ComfyUI-RefPacks` + `ComfyUI-MiniMax-H3-RefPacks`):** Optional extensions for reusable VAE-cached reference packs in **VideoMaker** (installable from the Extensions tab; no extra AI model weights required).

---

## 🔒 Security Notes
* **Local-only by default:** StudioCockpit binds to `127.0.0.1:8095` and validates `Host` and `Origin` / `Sec-Fetch-Site` headers to protect against DNS rebinding and cross-site requests.
* **Encrypted API keys:** Cloud LLM API keys are encrypted at rest via Windows DPAPI (`CryptProtectData`) and never sent unmasked to the browser.
* **Network exposure (`--host 0.0.0.0`):** StudioCockpit currently has **no built-in user authentication**. Do **not** expose `--host 0.0.0.0` on untrusted or public networks.

---

## 📝 Recent Changes (Changelog)

* **v1.89:** Removed the `-90deg` rotation on `.card.collapsible.collapsed` and `.field-collapsible.collapsed` (`web/style.css`) so all collapsible sections consistently display the downward `▾` arrow.
* **v1.88:** Made the **🔑 Plato's Key (Opt-in)** subsection inside **Model Preset** collapsible with the standard `▾` arrow (`#platoKeyGroup` in `web/index.html`, `web/app.js`), collapsed by default.
* **v1.87:** Improved `handle_restart_comfy()` and `_stop_comfy_on_port()` (`server.py`) for both Windows native and WSL: prefers ComfyUI-Manager's in-place `/api/manager/reboot` endpoint first and falls back to graceful `SIGTERM`/`taskkill` + settle delay before relaunching.
* **v1.86:** Added a **Restart ComfyUI** button (`#btnRestartComfy`, `POST /api/restart_comfy` in `server.py`) active while ComfyUI is running with a themed confirmation dialog, and replaced the browser-native `confirm()` popup in the TA Model Preset Editor iframe with a centered, themed modal (`#cockpitConfirmModal` in `web/index.html`, `web/app.js`).
* **v1.85:** Fixed `updateModelSelection()` (`web/app.js`) so model quick-pills only use fuzzy family matching when no exact pill match exists, preventing both `Krea2-Turbo` and `Krea2-Turbo (Qwen3.5-9B PK)` from highlighting at the same time.
* **v1.84:** Added a pre-flight encoder compatibility check in `handle_generate()` and runtime `PlatoKey` dimension-error translation (`server.py`) to catch mismatched `clip_name_1` / `plato_key` combinations before or during ComfyUI execution.
* **v1.83:** Updated `StudioCockpit.spec` to bundle `workflows/TA-FLEXMOD-LLM_v2.93.json` in the standalone `.exe` (fixing `[Errno 2] ... TA-FLEXMOD-LLM_v2.93.json` in PyInstaller builds).
* **v1.82:** Fixed `handle_plato_keys()` (`server.py`) via `_extract_combo_options()` to support ComfyUI V3 `["COMBO", {"options": [...]}]` `/object_info` schemas used by `ComfyUI-PlatoKeys` (`plato_keys.Load`).
* **v1.81:** Fixed `_seed_or_repair_presets()` and `handle_generate()` (`server.py`) so Krea2 presets using Plato's Keys donor encoders (e.g. `Qwen 3.5` with `clip_type = qwen_image`) are no longer overwritten to `clip_type = krea2`, allowing any preset name.
* **v1.80:** Added `POST /api/comfy/restart` (`server.py`) and prominent amber restart banners with a 1-click **`🔄 ComfyUI jetzt neu starten`** button (`web/index.html`, `web/app.js`) after Plato's Key downloads and custom node installations, auto-refreshing presets and keys once ComfyUI is back online.
* **v1.79:** Fixed WSL temp-path conversion (`_to_wsl_path`) in `handle_plato_key_download()` and added `extra_model_paths.yaml` + `extra_models_dir` resolution/auto-registration for `clip_projections` and `plato_keys` on both native Windows and WSL (`server.py`).
* **v1.78:** Added WSL Linux-path support (`wslpath -u` + `wsl bash`) to `handle_plato_keys()` and `handle_plato_key_download()` (`server.py`) so the Plato's Keys downloader works identically under both native Windows and WSL ComfyUI.
* **v1.77:** Added 1-click optional node installation (`ComfyUI-H3-Text-Encoders`, `ComfyUI-PlatoKeys`) and a Hugging Face `.safetensors` key downloader (`POST /api/plato_keys/download`) in both the Model Preset card (`#cardModel`) and ComfyUI Settings (`server.py`, `web/index.html`, `web/app.js`).
* **v1.76:** Added opt-in **Plato's Keys** support via `TA-FLEXMOD-LLM_v2.93.json` (`PlatosKeyPatchCLIP` & `plato_keys.PatchCLIP` bypassed by default via `MODE_BYPASS`), `GET /api/plato_keys` discovery + pre-flight validation (`server.py`, `comfy_client.py`), and `#selPlatoKey` in Image Studio (`web/index.html`, `web/app.js`) with zero breaking changes for existing setups.
* **v1.74:** Fixed a WinForms/WebView2 UI thread deadlock in `on_closing()` (`server.py`) by dispatching `window.__requestCloseConfirm()` asynchronously via `threading.Timer` so the themed close confirmation modal remains fully clickable.
* **v1.73:** Moved the collapse/expand arrow (`▾`) from the Prompt Controller card header directly onto the **Delimiter** label (`.field-collapsible` in `web/index.html`, `web/style.css`, `web/app.js`), collapsed by default.
* **v1.72:** Replaced the native Windows close confirmation dialog with a themed in-app modal (`#confirmAppCloseModal` in `web/index.html`, `web/app.js`, `POST /api/app/confirm_close` in `server.py`) matching the active Cockpit theme and DE/EN UI language.
* **v1.71:** Made the **Prompt Controller** **Delimiter** field collapsible via the standard header chevron (`▾`, collapsed by default while keeping **Controller Mode** visible) in `web/index.html`, `web/style.css`, and `web/app.js`.
* **v1.70:** Stacked the Gallery Lightbox **Filmstrip** and **Full View** buttons vertically and anchored `.gal-lb-hud-right` with `margin-left: auto` (`web/style.css`) so **`✕ Vollbild schließen` / `✕ Exit Full View`** stays consistently at the top-right in Pure View.
* **v1.69:** Added labeled DE/EN **Filmstrip** and **Full View / Pure View** buttons in the Gallery Lightbox with a clearly visible **`✕ Vollbild schließen` / `✕ Exit Full View`** state (`web/index.html`, `web/style.css`, `web/gallery_module.js`), plus a configurable **Close Confirmation** dialog (`confirm_close`, enabled by default) in Settings and `server.py` (`on_closing`).
* **v1.68:** Fixed the Gallery Lightbox left navigation button (`.gal-lb-prev`) hit area in `web/style.css` by adding `z-index: 6` to `.gal-lb-nav` so `.gal-lb-canvas` no longer overlaps it.
* **v1.67:** Suppressed transient `Failed to fetch` / disconnect error toasts during the auto-updater restart (`web/app.js`, `web/video_module.js`), keeping the progress/restarting state visible while `window.__studioUpdating` is active.
* **v1.66:** Added a pre-flight VAE check in `/api/generate` (`server.py`) verifying `vae_name` and `/models/vae` availability for the active `TAModelPreset`, plus a clear error translation for `'NoneType' object has no attribute 'decode'` when a preset's VAE is missing or invalid.
* **v1.65:** Added an optional **Extra Models & LoRAs Folder** (`extra_models_dir`) with **Browse / Durchsuchen** in ComfyUI Settings (`web/index.html`, `web/app.js`, `server.py`), generating a separate `data/studio_extra_model_paths.yaml` passed via `--extra-model-paths-config` on launch (supporting Windows & WSL paths without overwriting existing `extra_model_paths.yaml` files).
* **v1.64:** Fixed the **Browse / Durchsuchen** button in VideoMaker's Models modal by implementing `POST /api/video/browse_folder` in `modules/video_maker.py` (`_pick_folder_dialog` with `pywebview`, PowerShell `FolderBrowserDialog`, and `tkinter` fallbacks) so users can select custom model/LoRA folders on any drive.
* **v1.62:** Added inline `?` help toggle buttons and localized DE/EN help boxes (`helpPromptController`, `helpLLM`) to **Prompt Controller** and **LLM (Local / Cloud) – T2I & I2I** (`web/index.html`, `web/app.js`).
* **v1.61:** Fixed per-provider LLM availability checks in `web/app.js` (`checkLLMStatus`, `updateLLMModelBadge`), added automatic fallback to an available model, marked unreachable provider models as `offline` in the dropdown (`web/style.css`), and blocked generation with a clear toast if the selected LLM provider is offline.
* **v1.60:** Fixed the Windows auto-updater (`server.py`, `modules/updater.py`, `web/app.js`) to cleanly terminate the app process, run a silent PowerShell update script without opening Windows Terminal, strip inherited PyInstaller `_MEIPASS*`/`_PYI_*` variables on relaunch, and suppress transient `"Failed to fetch"` toasts during restart.
* **v1.57:** Rebuilt the distribution package with the updated **`studio-cockpit`** skill (`video adopt-audio`, `video adopt` upload fallback, and corrected `first_frame` / `audio_file` `/api/video/uploads/...` URL docs).
* **v1.56:** Added the unified **`studio-cockpit`** Antigravity skill (`.agents/skills/studio-cockpit/`) covering **Image Studio**, **VideoMaker**, **MusicMaker**, and **DiscordGIF** (including cross-module pipelines), and bundled it into `dist\tA-Studio-Cockpit\antigravity\skills\` and the release ZIP (`build_dist.bat`).
* **v1.55:** Bundled the `music-maker` Antigravity skill into `dist\tA-Studio-Cockpit\antigravity\skills\music-maker` and the release ZIP (`build_dist.bat`), with setup instructions in `README.md` for standalone `.exe` users.
* **v1.54:** Switching to the **History** tab in **MusicMaker** (`web/music/app.js`) now automatically refreshes the song list (`loadHistory()`), and added the `.agents/skills/music-maker/` skill + CLI client for direct `/api/music/*` integration.
* **v1.53:** Updated the **Fine-Tuning & Finish** help text (`help_tuning_html` in `web/app.js`, DE & EN) to match the **Upscale & FX** tab and cover SeedVR2 upscaling, sharpening, and film grain.
* **v1.52:** Added consistent icons to all VideoMaker tabs (`web/video_module.js`) and moved **Morph & Transform** after **Lipsync Studio** (`web/index.html`).
* **v1.51:** Fixed `.frame-box-label` wrapping for VideoMaker's Start Frame label (`web/style.css`) and wired Gallery's **DiscordGIF** button (`web/gallery_module.js`, `web/gif_module.js`) to open the **AI GIF** tab with the selected image loaded.
* **v1.50:** `sendImageToVideoMaker` (`web/video_module.js`) now populates both the **Quick Clip** and **Long Clip** first-frame slots simultaneously when sending an image to VideoMaker.
* **v1.49:** Fixed `sendImageToVideoMaker` not switching to the **Quick Clip** tab (`#vm_tabs button[data-tab="quick"]`) and updated `/api/video/adopt_studio_image` + Gallery Lightbox (`web/gallery_module.js`, `modules/video_maker.py`) to resolve `/api/gallery/media?root=...&path=...` and relative gallery paths.

<details>
<summary>Older releases (v1.21 – v1.48)</summary>

* **v1.48:** Fixed `sendImageToVideoMaker` in `web/video_module.js` so images sent from Gallery, Image Studio, or DiscordGIF render immediately in the **Quick Clip** first-frame (and **Lipsync** portrait) dropzone.
* **v1.47:** Switched `app.ico`, `web/favicon.ico`, `web/logo.png`, and `assets/branding/logo_tA.png` to the original connected 3D glassmorphic **`tA` squircle logo**.
* **v1.46:** Replaced the placeholder palette emoji and legacy icon with the new sharp 3D glassmorphic **`tA` App Logo** (`app.ico`, `web/favicon.ico`, `web/logo.png`, `web/index.html`, `web/style.css`, bundled in `StudioCockpit.spec`).
* **v1.44:** Added optional **BExplains RefPacks / MiniMax H3 RefPacks** support in **VideoMaker** (opt-in, reuses existing H3 models without extra AI downloads; Quick Clip & Long Clip UI + `/api/video/refpacks/*` endpoints).
* **v1.43:** Added optional custom output folder settings for **VideoMaker** and **MusicMaker** (ordered **VideoMaker → MusicMaker → DiscordGIF** in Settings).
* **v1.42:** Renamed the Image Studio **Upscale** tab to **Upscale & FX** so users immediately see where SeedVR2, sharpness, and film grain live (`web/index.html`, `web/app.js`).
* **v1.41:** Changed default application language to **English (`en`)** across all modules (German remains selectable in Settings).
* **v1.40:** Hid `#emptyState` and showed `#mainPreview` when loading an image from the session filmstrip/gallery (`web/app.js`).
* **v1.39:** Disabled artist signature overlay by default and removed the prefilled `thomo.ART` signature text (`web/index.html`, `web/app.js`).
* **v1.38:** Fixed broken initial preview image icon in the standalone `.exe` by showing the empty-state prompt canvas on startup (`web/index.html`).
* **v1.37:** Switched project license to **GNU GPL v3.0** (`LICENSE`, `NOTICE`, `README.md`) and added the **Credits & Acknowledgements** section (`HammelArt-Atelier`, `Plenio Music Production System`, VideoMaker workflow references, `CodexMundi`).
* **v1.36:** Expanded the **Integrated Studio Modules** documentation in `README.md` with balanced module overviews, collapsible `<details>` sections, and a live UI screenshot (`assets/screenshot.jpg`).
* **v1.35:** Hardened updater download URLs to official GitHub domains, added 256 MB `do_POST` payload cap (`HTTP 413`), added `requirements.txt`, automatic `.sha256` checksums in `build_dist.bat`, and GitHub bug report template.
* **v1.34:** Added infinite scroll auto-loading to Gallery.
* **v1.33:** Added **Prompt to T2I** button in Gallery Lightbox.
* **v1.32:** Added multi-root parameter loading and **Use as I2I** button in Gallery Lightbox.
* **v1.31:** Persisted selected gallery root folder across restarts.
* **v1.30:** Resolved wired text nodes and `UnetLoaderGGUF` in gallery metadata.
* **v1.23–v1.29:** Persisted active studio module, explicit permanent delete buttons, gallery shortcuts modal, themed delete confirmation modal, user-only custom folders in sidebar, selectable Lightbox prompt text, LLM/I2I sidecar prompt extraction, and auto-contrast text overlays.
* **v1.21–v1.22:** Security hardening (path traversal, Zip-Slip, command/filter injection, `Host`/`Origin` validation, `ALLOWED_CONFIG_KEYS` whitelist, download caps) and repository cleanup.

</details>

👉 Full history: [CHANGELOG.md](CHANGELOG.md)

---

## 🙏 Credits & Acknowledgements

* **Integrated Concepts & Workflow References:**
  * **[HammelArt-Atelier](https://github.com/HammelArt/HammelArt-Atelier)** — Inspiration and feature concepts behind the **Gallery** module.
  * **[Plenio Music Production System](https://github.com/jplenio/Plenio-Music-Production-System)** — Reference templates and concepts behind the **MusicMaker** module.
  * **VideoMaker Workflow Base:** Built around ComfyUI **MiniMax H3 / Wan 2.2** video & lipsync workflows (including `minimaxH3Lipsync_v41.json` as reference).
  * **[BExplains ComfyUI-RefPacks](https://github.com/BExplains/ComfyUI-RefPacks) & [ComfyUI-MiniMax-H3-RefPacks](https://github.com/BExplains/ComfyUI-MiniMax-H3-RefPacks):** Optional reusable VAE-cached reference packs & role-aware MiniMax H3 prompting support in VideoMaker.
* **Core Ecosystem & Backends:** ComfyUI, MiniMax H3, Wan 2.2, Wav2Vec2, Eclipse, Demucs, `YuE2-Song`, `faster-whisper`, Applio (RVC), and FFmpeg.
* **Special Thanks:** **CodexMundi** for testing and valuable feedback.

---

## 📄 License

Copyright © 2026 Thomas Möhrling (thomo.ART)  
Licensed under the **GNU General Public License v3.0 (GPL-3.0)** — see [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.  
`thomo.ART`, `StudioCockpit`, logos, and application icons remain reserved brand assets of **Thomas Möhrling (thomo.ART)**.
