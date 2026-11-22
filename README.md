# thomo.ART StudioCockpit (v0.96 - FLEXMOD Edition)

A modern, streamlined user interface for controlling the **TA-FLEXMOD-LLM** ComfyUI workflow in the signature **thomo.ART** Dark Studio UI design (similar to `tA-VideoMaker` and `tA-MusicMaker`).

---

## 🎨 Features & Highlights

* **Model & LoRA Hub:**
  * Direct selection of your model presets (`TAModelPreset` such as *Minimax H3 Image*, *FLUX1 DEV FP8*, *Krea2-Turbo*, *ZImage*, *Qwen-Image*).
  * Quick-access pills for your favorite models.
  * Fully integrated LoRA stack with live sliders and trigger word detection.
* **Sampler Presets (`TASamplerPreset`):**
  * 1-click selection of optimized sampling profiles (Steps, CFG, Sampler, Scheduler).
* **Prompt Hub & AI Prompt Engine:**
  * Full access to all 3 channels of `TAPromptHub` (main prompt `positive_prompt`, style booster `additional_prompt`, `negative_prompt`).
  * 3-way AI Prompt Engine (`TASmartLLM`):
    * `🚫 Manual`: Direct prompt input without AI intervention.
    * `✨ T2I Booster`: Automatic enhancement and detailing via text LLMs (Dolphin-Mistral, Qwen, etc.).
    * `🖼️ I2I Analysis`: Reference image analysis via Vision-LLM (Qwen-VL) including direct image upload (`LoadImage`).
  * Full control over `TAPromptController` (`Generated Only`, `Combine: Manual + Generated`, `Combine: Generated + Manual`).
  * Quick aspect-ratio presets (`16:9`, `1:1`, `9:16`, `4:3`, `21:9`).
* **Secondary Tabs for Fine-Tuning:**
  * Seed control (Random / Fixed / Repeat).
  * `TASeedVR2Gate` upscaler & `TAFastLaplacianSharpen` sharpening slider.
  * Negative prompt.
* **Studio Viewer & History Filmstrip:**
  * Full-size image viewer with actions (*Download*, *Copy Prompt*, *Use Seed*).
  * History strip for the current session.
* **Hardware & Connection Monitoring:**
  * Automatic GPU and VRAM detection via ComfyUI.
  * Live status indicator for ComfyUI on port `8188`.

---

## 🚀 Quick Start

1. Start ComfyUI as usual (`http://127.0.0.1:8188`).
2. Double-click **`start.bat`** (or launch **`StudioCockpit.exe`**).
3. Your browser opens **`http://127.0.0.1:8095`** automatically.
