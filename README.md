# thomo.ART StudioCockpit (v1.35 - FLEXMOD Edition)

An all-in-one Windows desktop & web studio for AI image generation, media management, animated Discord GIFs, AI video production, and AI music creation — powered by **ComfyUI** and **TA-FLEXMOD-LLM** in the signature **thomo.ART** Studio UI design.

---

## 🧩 Integrated Studio Modules

### 🎨 Image Studio (`Bilder`)
* **Model & LoRA Hub:**
  * Direct selection of `TAModelPreset` profiles (*ZImage*, *Qwen-Image 2.1*, *Krea2-Turbo*, *FLUX3-Klein*, *MOSS-Image*, *FLUX1-DEV-FP8*, *Minimax H3 Image*, etc.) and quick-access favorite pills.
  * Integrated LoRA stack with live strength sliders and automatic trigger-word detection.
* **Sampler Presets (`TASamplerPreset`):** 1-click sampling profiles (Steps, CFG, Sampler, Scheduler).
* **Prompt Hub & AI Prompt Engine (`TASmartLLM`):**
  * Full access to `TAPromptHub` channels (`positive_prompt`, `additional_prompt`, `negative_prompt`) and `TAPromptController` modes.
  * 3-way AI engine: `🚫 Manual`, `✨ T2I Booster`, and `🖼️ I2I Analysis` (Vision-LLM + `LoadImage` upload).
  * Supports local LLMs (LM Studio, Ollama) and optional cloud providers (Gemini, OpenAI, OpenRouter, Groq) with Windows DPAPI-encrypted key storage.
* **Post-Processing & Viewer:**
  * `TASeedVR2Gate` upscaler, `TAFastLaplacianSharpen`, background removal, text overlays (with auto-contrast font color), before/after comparison, and quick aspect-ratio presets (`16:9`, `1:1`, `9:16`, `4:3`, `21:9`).
  * Studio viewer & session filmstrip with 1-click actions (*Reuse Seed*, *Apply All Parameters*, *Send to DiscordGIF*, *Send to VideoMaker*).

### 🖼️ Gallery (`Galerie`)
* Fast local media indexer with persistent JPEG/FFmpeg thumbnail cache for images and videos (`.png`, `.jpg`, `.webp`, `.mp4`, `.webm`, `.mov`), multi-root support, and infinite scroll auto-loading.
* Lightbox inspector displaying embedded generation metadata (Model, Seed, Prompts, wired text nodes & `UnetLoaderGGUF`) with **1-click parameter reload**, **Prompt to T2I**, and **Use as I2I** back into the Image Studio.
* User-created custom folders, favorites, search/filtering, keyboard shortcuts modal, themed confirmation dialogs, and direct cross-module handoff to **DiscordGIF** or **VideoMaker**.

### 👾 DiscordGIF
* **Local Library & Tenor:** Manage custom animated GIFs, search & download from Tenor, and organize favorites.
* **AI Image-to-GIF:** Animate any generated or gallery image via ComfyUI workflows.
* **Discord Quick-Paste:** Win32 clipboard/file-drop integration with optional auto-paste and global hotkey (`Alt+G`).

### 🎬 VideoMaker
* Full **MiniMax H3 / Wan 2.2** ComfyUI video suite directly inside StudioCockpit with 7 specialized sub-tabs:
  * **Storyboard & Director:** Multi-shot sequences with FL2V continuity (`from_prev`) and integrated AI Storyboard Assistant.
  * **Quick Clip, Morph & Transform, Long Clip:** Fast single takes, frame-to-frame morphing, and extended multi-segment clips.
  * **Lipsync & Avatar Studio:** Audio-driven portrait animation (MiniMax H3 + Wav2Vec2 + Eclipse) with optional Demucs vocal isolation and captions.
  * **Player & FFmpeg Stitcher:** Combine scenes, apply bundled film LUTs (`.cube`), auto-matched soundscapes, and Eco-to-1080p upscaling.
  * **Models:** Pre-flight checkpoint verification, disk-space check, and resumable multi-part downloader.
* Direct **Image → VideoMaker** handoff from both the Image Studio viewer and the Gallery lightbox.

### 🎵 MusicMaker
* **AI Song Generation:** Integrated `YuE2-Song` ComfyUI workflow with style/lyrics prompting, Plenio templates, and generation history.
* **Lyrics, SRT & Audio Tools:** Whisper-based SRT generation & translation (`faster-whisper`), vocal alignment, and optional RVC voice-swap backend support.

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
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the app:
   ```bash
   python server.py
   ```
   Use `python server.py --browser` to open in your default web browser instead of the desktop window.

### Optional External Tools & Backends
* **FFmpeg (`ffmpeg` / `ffprobe` in `PATH`):** Required for video stitching, LUT grading, GIF compilation, and gallery video thumbnails.
* **LM Studio / Ollama:** Optional local LLM backends for prompt boosting and I2I image analysis.
* **Applio (RVC):** Optional local installation for voice conversion in MusicMaker.
* **ComfyUI Custom Nodes:** Depending on the modules you use, your ComfyUI installation needs the corresponding `TA-FLEXMOD-LLM`, MiniMax H3 / Wan 2.2, `SeedVR2`, background-removal, or `YuE2` custom nodes.

---

## 🔒 Security Notes
* **Local-only by default:** StudioCockpit binds to `127.0.0.1:8095` and validates `Host` and `Origin` / `Sec-Fetch-Site` headers to protect against DNS rebinding and cross-site requests.
* **Encrypted API keys:** Cloud LLM API keys are encrypted at rest via Windows DPAPI (`CryptProtectData`) and never sent unmasked to the browser.
* **Network exposure (`--host 0.0.0.0`):** StudioCockpit currently has **no built-in user authentication**. Do **not** expose `--host 0.0.0.0` on untrusted or public networks.

---

## 📝 Recent Changes (Changelog)

* **v1.34:** Added infinite scroll auto-loading to Gallery.
* **v1.33:** Added **Prompt to T2I** button in Gallery Lightbox.
* **v1.32:** Added multi-root parameter loading and **Use as I2I** button in Gallery Lightbox.
* **v1.31:** Persisted selected gallery root folder across restarts.
* **v1.30:** Resolved wired text nodes and `UnetLoaderGGUF` in gallery metadata.
* **v1.23–v1.29:** Persisted active studio module, explicit permanent delete buttons, gallery shortcuts modal, themed delete confirmation modal, user-only custom folders in sidebar, selectable Lightbox prompt text, LLM/I2I sidecar prompt extraction, and auto-contrast text overlays.
* **v1.21–v1.22:** Security hardening (path traversal, Zip-Slip, command/filter injection, `Host`/`Origin` validation, `ALLOWED_CONFIG_KEYS` whitelist, download caps) and repository cleanup.

👉 Full history: [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

Licensed under the **Apache License 2.0** — see [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.  
`thomo.ART`, `StudioCockpit`, logos, and application icons remain reserved brand assets of **Thomas Möhrling (thomo.ART)**.
