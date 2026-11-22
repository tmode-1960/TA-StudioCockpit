# thomo.ART StudioCockpit (v0.91 - FLEXMOD Edition)

Eine moderne, schlanke Benutzeroberfläche zur Steuerung des komplexen **TA-FLEXMOD-LLM** ComfyUI-Workflows im unverwechselbaren **thomo.ART** Dark Studio UI Design (analog zu `tA-VideoMaker` und `tA-MusicMaker`).

---

## 🎨 Features & Highlights

* **Modell- & LoRA-Zentrale:**
  * Direkte Auswahl deiner Modell-Presets (`TAModelPreset` wie *Minimax H3 Image*, *FLUX1 DEV FP8*, *Krea2-Turbo*, *ZImage*, *Qwen-Image*).
  * Schnellzugriffs-Pills für deine Lieblingsmodelle.
  * Vollständig integrierter LoRA-Stack mit Live-Schiebereglern und Trigger-Word-Erkennung.
* **Sampler-Presets (`TASamplerPreset`):**
  * 1-Klick-Auswahl optimierter Sampling-Profile (Steps, CFG, Sampler, Scheduler).
* **Prompt-Hub & KI-Prompt-Engine:**
  * Vollwertiger Zugriff auf alle 3 Kanäle des `TAPromptHub` (Haupt-Prompt `positive_prompt`, Stil-Booster `additional_prompt`, `negative_prompt`).
  * 3-Wege KI-Prompt-Engine (`TASmartLLM`):
    * `🚫 Manuell`: Direkte Prompt-Eingabe ohne KI-Eingriff.
    * `✨ T2I Booster`: Automatische Veredelung und Detaillierung über Text-LLMs (Dolphin-Mistral, Qwen etc.).
    * `🖼️ I2I Analyse`: Analyse von Referenzbildern via Vision-LLM (Qwen-VL) inklusive direktem Bild-Upload (`LoadImage`).
  * Volle Kontrolle über den `TAPromptController` (`Generated Only`, `Combine: Manual + Generated`, `Combine: Generated + Manual`).
  * Schnellauswahl für Standardformate (`16:9`, `1:1`, `9:16`, `4:3`, `21:9`).
* **Sekundär-Tabs für Feintuning:**
  * Seed-Steuerung (Zufall / Fest / Wiederholen).
  * `TASeedVR2Gate` Upscaler & `TAFastLaplacianSharpen` Schärferegler.
  * Negativ-Prompt.
* **Studio-Viewer & Verlaufs-Filmstreifen:**
  * Großformatige Bildansicht mit Aktionen (*Download*, *Prompt kopieren*, *Seed übernehmen*).
  * Verlaufsleiste der aktuellen Sitzung.
* **Hardware & Verbindungs-Monitoring:**
  * Automatische GPU- und VRAM-Erkennung über ComfyUI.
  * Statusampel für ComfyUI auf Port `8188`.

---

## 🚀 Schnellstart

1. ComfyUI wie gewohnt starten (`http://127.0.0.1:8188`).
2. Doppelklick auf **`start.bat`**.
3. Der Browser öffnet automatisch **`http://127.0.0.1:8095`**.
