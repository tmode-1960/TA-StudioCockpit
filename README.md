# thomo.ART StudioCockpit (v1.01 - FLEXMOD & Multi-Module Edition)

An all-in-one Windows desktop & web studio for AI image generation, media management, animated Discord GIFs, and AI video production — powered by **ComfyUI** and **TA-FLEXMOD-LLM** in the signature **thomo.ART** Studio UI design.

---

## 🧩 Integrated Studio Modules

### 🎨 Image Studio (`Bilder`)
* **Model & LoRA Hub:**
  * Direct selection of `TAModelPreset` profiles (*Minimax H3 Image*, *FLUX1 DEV FP8*, *Krea2-Turbo*, *ZImage*, *Qwen-Image*, etc.) and quick-access favorite pills.
  * Integrated LoRA stack with live strength sliders and automatic trigger-word detection.
* **Sampler Presets (`TASamplerPreset`):** 1-click sampling profiles (Steps, CFG, Sampler, Scheduler).
* **Prompt Hub & AI Prompt Engine (`TASmartLLM`):**
  * Full access to `TAPromptHub` channels (`positive_prompt`, `additional_prompt`, `negative_prompt`) and `TAPromptController` modes.
  * 3-way AI engine: `🚫 Manual`, `✨ T2I Booster`, and `🖼️ I2I Analysis` (Vision-LLM + `LoadImage` upload).
  * Supports local LLMs (LM Studio, Ollama) and optional cloud providers (Gemini, OpenAI, OpenRouter, Groq) with Windows DPAPI-encrypted key storage.
* **Post-Processing & Viewer:**
  * `TASeedVR2Gate` upscaler, `TAFastLaplacianSharpen`, background removal, before/after comparison, and quick aspect-ratio presets (`16:9`, `1:1`, `9:16`, `4:3`, `21:9`).
  * Studio viewer & session filmstrip with 1-click actions (*Reuse Seed*, *Apply All Parameters*, *Send to DiscordGIF*, *Send to VideoMaker*).

### 🖼️ Gallery (`Galerie`)
* Fast local media indexer with persistent JPEG/FFmpeg thumbnail cache for images and videos (`.png`, `.jpg`, `.webp`, `.mp4`, `.webm`, `.mov`).
* Lightbox inspector displaying embedded generation metadata (Model, Seed, Prompts) with **1-click parameter reload** back into the Image Studio.
* Favorites, search/filtering, and direct cross-module handoff to **DiscordGIF** or **VideoMaker**.

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

---

## ⚙️ Platform & Desktop Features
* **Native Desktop App (`pywebview` / Edge WebView2):** Runs as a standalone Windows app (`StudioCockpit.exe`) or in any browser via `--browser` on port `8095`.
* **Themes & Localization:** Multiple dark/light studio themes + accent colors, bilingual UI (**Deutsch / English**).
* **Hardware & ComfyUI Control:** Live GPU/VRAM monitoring, ComfyUI launcher & status indicator (port `8188`), and built-in GitHub release updater.

---

## 🚀 Quick Start

1. Start ComfyUI (`http://127.0.0.1:8188`) — or launch it directly from the StudioCockpit header.
2. Double-click **`start.bat`** or run **`StudioCockpit.exe`**.
3. The desktop window opens automatically (browser fallback: **`http://127.0.0.1:8095`**).
