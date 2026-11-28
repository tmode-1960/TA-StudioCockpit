// thomo.ART StudioCockpit - Frontend Logic
(function() {
  "use strict";

  // ==========================================
  // Bilingual i18n System (Deutsch / Englisch)
  // ==========================================
  const TRANSLATIONS = {
    de: {
      brand_wf_title: "Verwendeter ComfyUI Workflow",
      gpu_checking: "GPU…",
      gpu_connected: "GPU",
      gpu_offline: "GPU: —",
      gpu_toggle_title: "GPU- & VRAM-Details anzeigen",
      gpu_vram_label: "VRAM frei",
      gpu_device_label: "Device",
      gpu_allocator_label: "Allocator",
      gpu_offline_detail: "ComfyUI ist nicht verbunden.",
      gpu_peak_label: "Peak",
      gpu_ram_label: "System-RAM",
      gpu_load_label: "GPU",
      cpu_load_label: "CPU",
      gpu_temp_label: "Temp",
      gpu_power_label: "Power",
      btn_free_vram: "🧹 VRAM freigeben",
      btn_free_vram_busy: "⏳ Gebe VRAM frei…",
      btn_free_vram_done: "✓ VRAM freigegeben",
      btn_reset_peak: "↺ Peak",
      btn_reset_peak_title: "VRAM-Peak zurücksetzen",
      gpu_free_suffix: "frei",
      custom_slot_filled_title: "Custom Slot {slot} ({color}) – Linksklick: Anwenden · Rechtsklick: Leeren",
      custom_slot_empty_title: "Custom Slot {slot} (leer) – Klick speichert aktuelle Akzentfarbe",
      col_resizer_title: "Ziehen zum Anpassen · Doppelklick für Standard",
      aria_studio_nav: "Studio-Module",
      aria_gpu_details: "GPU-Details",
      aria_custom_accent: "Eigene Akzentfarbe",
      aria_resize_setup: "Setup-Spaltenbreite anpassen",
      aria_resize_prompt: "Prompt-Spaltenbreite anpassen",
      nav_images: "🎨 Bilder",
      brand_version_title: "Klicken, um auf GitHub nach Updates zu suchen",
      update_badge_text: "⬆️ Update",
      update_badge_title: "Neues Update verfügbar – zum Installieren klicken",
      comfy_connecting: "Verbinde ComfyUI...",
      comfy_connected: "ComfyUI verbunden",
      comfy_disconnected: "ComfyUI getrennt",
      btn_launch_comfy: "⚡ ComfyUI starten",
      btn_launch_comfy_running: "✓ ComfyUI läuft",
      btn_restart_comfy: "🔄 ComfyUI neu starten",
      btn_restart_comfy_title: "Laufendes ComfyUI stoppen und neu starten",
      btn_restart_comfy_restarting: "⏳ Neustart…",
      restart_comfy_modal_title: "ComfyUI neu starten?",
      restart_comfy_modal_desc: "Möchtest du ComfyUI wirklich neu starten? Laufende Generierungen werden dadurch unterbrochen.",
      restart_comfy_confirm_btn: "Neu starten",
      preset_confirm_title: "Preset-Bestätigung",
      btn_confirm_ok: "OK",
      btn_launch_comfy_opening: "⏳ Öffne Terminal…",
      btn_launch_comfy_tab: "⏳ Neuer Tab geöffnet…",
      btn_launch_comfy_started: "⏳ Terminal gestartet…",
      btn_launch_comfy_title: "ComfyUI im Terminal-Fenster starten",
      btn_launch_comfy_running_title: "ComfyUI ist verbunden und läuft",
      btn_settings_title: "ComfyUI Verbindungseinstellungen",
      btn_reload_title: "Oberfläche neu laden (F5)",
      btn_reload_app: "🔄 App neu laden",

      // Setup
      card_model: "Modell-Preset",
      badge_custom_model: "Eigenes Modell",
      badge_custom_sampler: "Eigener Sampler",
      models_none_installed: "— Keine installierten Modelle gefunden —",
      samplers_none_found: "— Keine passenden Sampler-Presets —",
      btn_edit_preset: "✏️ Editor / + Neu",
      btn_edit_preset_title: "Neues Preset anlegen oder bearbeiten",
      card_sampler: "Sampler-Preset",
      help_btn_title: "Hilfe zu diesem Bereich ein-/ausblenden",
      help_model_html: "<p><b>Wofür ist das?</b> Hier wählst du das Basis-KI-Modell für die Bildgenerierung.</p><ul><li><b>Auswählen:</b> Nutze das Dropdown oder die Schnellwahl-Buttons darunter.</li><li><b>Automatik:</b> Beim Wechsel passt das Cockpit passende Sampler-Vorschläge, LoRA-Filter und Flux-Guidance automatisch an.</li><li><b>Anpassen:</b> Über <b>✏️ Editor / + Neu</b> kannst du eigene Modell-Presets anlegen oder Schnellwahl-Favoriten verwalten.</li></ul>",
      help_sampler_html: "<p><b>Wofür ist das?</b> Bestimmt, wie das Bild berechnet wird (<b>Steps</b>, <b>Sampler/Scheduler</b> und <b>CFG</b>).</p><ul><li><b>Auswählen:</b> Wähle das Preset passend zum Modell (Turbo-Modelle nutzen meist 4–9 Steps &amp; CFG 1, Standard/Dev-Modelle oft 20–25 Steps).</li><li><b>Status-Badge:</b> Das Status-Badge oben links zeigt jederzeit die aktuell aktiven Werte.</li><li><b>Anpassen:</b> Über <b>✏️ Editor / + Neu</b> kannst du eigene Sampler-Presets anlegen oder bestehende Werte (Steps, Sampler, Scheduler, CFG) direkt bearbeiten.</li></ul>",
      help_lora_html: "<p><b>Wofür ist das?</b> Mit LoRAs ergänzt du das gewählte Basis-Modell um bestimmte Stile, Personen, Details oder Effekte.</p><ul><li><b>Aktivieren &amp; Stärke:</b> Schalte gewünschte LoRAs in der Liste ein und passe bei Bedarf deren Stärke an. Das Badge oben zeigt aktive LoRAs und warnt bei Modell-Inkompatibilität.</li><li><b>Filtern &amp; Suchen:</b> Nutze <b>Alle</b>, <b>🎯 Passend zum Modell</b> oder <b>⚡ Nur Aktive</b> sowie Suche, Kategorie-Filter und <b>Alle umschalten</b>.</li><li><b>Manager &amp; Sync:</b> <b>L</b> öffnet den ComfyUI LoRA-Manager; <b>🔄 Sync</b> lädt LoRAs aus dem aktuellen Workflow neu.</li></ul>",
      help_tuning_html: "<p><b>Wofür ist das?</b> Hier steuerst du Seed, Beschleunigung, Upscaling &amp; FX, Dateiausgabe und Signatur über 4 Tabs:</p><ul><li><b>⚙️ Sampling:</b> Seed-Modus (Zufall/Fest/Wiederholen), Flux-Guidance (bei FLUX), Attention Engine (Sage/Kitchen) und SeedVarianceEnhancer.</li><li><b>🔍 Upscale &amp; FX:</b> Bild vergrößern (SeedVR2), nachschärfen und mit Film Grain versehen.</li><li><b>💾 Export:</b> Prompt als <code>.txt</code> speichern, Zusatzkopien anlegen sowie Ordner- und Dateinamen festlegen.</li><li><b>✒️ Signatur:</b> Wasserzeichen-, Signatur- und AI-Hinweis-Overlays einrichten.</li></ul>",
      help_prompthub_html: "<p><b>Wofür ist das?</b> Hier formulierst du die Bildbeschreibung und legst Format sowie Anzahl der Bilder fest:</p><ul><li><b>Haupt-Bildidee (Positive):</b> Beschreibe Motiv, Szene, Licht und Stil (am besten auf Englisch).</li><li><b>Zusatz-Prompt (Additional):</b> Optionale Stil- und Qualitätszusätze, die automatisch ergänzt werden.</li><li><b>Negativ-Prompt:</b> Dinge, die im Bild vermieden werden sollen (z. B. Rahmen, Text, Artefakte).</li><li><b>Resolution Pixaroma &amp; Batch:</b> Wähle das Seitenverhältnis und stelle über <b>batch</b> (1–64) ein, wie viele Bilder pro Lauf erzeugt werden.</li></ul>",
      help_prompt_controller_html: "<p><b>Wofür ist das?</b> Steuert, ob dein manueller Prompt aus dem Prompt-Hub, der KI-Prompt vom LLM oder eine Kombination aus beiden verwendet wird.</p><ul><li><b>Controller-Modus:</b> Wähle <b>Manual Only</b> (nur deine Eingabe), <b>Generated Only</b> (nur LLM-Ausgabe), eine <b>Combine</b>-Variante oder <b>Clear / Empty</b>.</li><li><b>Automatik:</b> Beim Umschalten des LLM-Modus (T2I/I2I/Aus) passt sich der Controller-Modus automatisch passend an.</li><li><b>Trennzeichen:</b> Legt fest, womit manueller und generierter Prompt im Combine-Modus verbunden werden (Standard: <code>, </code>).</li></ul>",
      help_llm_html: "<p><b>Wofür ist das?</b> Erweitert oder erstellt Prompts automatisch per lokalem LLM (LM Studio / Ollama) oder Cloud-API.</p><ul><li><b>Modi:</b> <b>🚫 LLM Aus</b> nutzt nur deinen Prompt, <b>✨ Text2Prompt (T2I)</b> formuliert deine Idee aus und <b>🖼️ Image2Prompt (I2I)</b> beschreibt ein Referenzbild per Vision-Modell.</li><li><b>Modell &amp; Status:</b> Wähle ein verfügbares Modell; die Badges zeigen Quelle (Lokal/Cloud) und Online-Status an.</li><li><b>Feineinstellungen:</b> Unter <b>⚙️ LLM-Feineinstellungen</b> lassen sich Temperatur, Max Tokens, System-/User-Prompts sowie das automatische Entladen aus dem VRAM steuern.</li></ul>",
      card_lora: "LoRA-Stack",
      card_lora_title: "Klicken zum Ein-/Ausklappen",
      btn_lora_manager_title: "LoRA Manager in ComfyUI aufrufen (http://127.0.0.1:8188/loras)",
      lora_mgr_modal_title: "ComfyUI LoRA-Manager",
      lora_mgr_btn_sync: "🔄 Sync",
      lora_mgr_btn_sync_title: "LoRAs ins Cockpit synchronisieren",
      lora_mgr_btn_reload: "↻ Neu laden",
      lora_mgr_btn_reload_title: "LoRA-Manager neu laden",
      lora_mgr_btn_external: "↗ Browser",
      lora_mgr_btn_external_title: "Im externen Browser öffnen",
      lora_mgr_loading: "LoRA-Manager wird geladen...",
      btn_sync_loras: "🔄 Sync",
      btn_sync_loras_title: "LoRAs aus aktuellem Workflow neu synchronisieren",
      lora_filter_all: "Alle",
      lora_filter_match: "🎯 Passend zum Modell",
      lora_filter_match_title: "Nur LoRAs passend zum aktuell ausgewählten Modell-Preset",
      lora_filter_active: "⚡ Nur Aktive",
      lora_filter_active_title: "Nur aktivierte LoRAs anzeigen",
      lora_search_placeholder: "🔍 LoRA suchen...",
      lora_cat_all: "Alle Kategorien",
      lora_cat_other: "Andere",
      lora_cat_title: "Nach Kategorie/Architektur filtern",
      lora_toggle_all: "Alle umschalten",
      lora_toggle_all_title: "Alle sichtbaren LoRAs aktivieren / deaktivieren",
      lora_none_found: "Keine LoRAs für den aktuellen Filter gefunden.",
      lora_none_found_sub: "Klicke auf <b>Alle</b> oder passe die Suche an.",
      lora_active_none: "0 aktiv",
      lora_active_some: "{count} aktiv",
      lora_active_incompatible: "{count} aktiv (⚠️ Inkompatibel)",
      lora_trigger_title: "Trigger-Wort: {trigger}",
      lora_cat_badge_title: "Architektur/Kategorie: {cat}",

      // Fine-Tuning
      card_tuning: "Feintuning & Finish",
      tab_sampling: "⚙️ Sampling",
      tab_sampling_title: "Sampling & Seed",
      tab_upscale: "🔍 Upscale & FX",
      tab_upscale_title: "Upscaling, Schärfe & Filmgrain",
      tab_export: "💾 Export",
      tab_export_title: "Speichern & Export",
      tab_overlay: "✒️ Signatur",
      tab_overlay_title: "Signatur & Text-Overlays",
      export_main_header: "Haupt-Ausgabe (Node 1229)",
      save_txt_main: "📄 Prompt als .txt-Datei mitspeichern",
      save_extra_image: "🖼️ Zusätzliche Kopie speichern (Node 1619)",
      extra_format_label: "Format",
      extra_quality_label: "Qualität",
      extra_subfolder_label: "Unterordner",
      save_extra_txt: "📄 Auch für diese Kopie eine .txt-Datei anlegen",
      fn_gen_header: "📁 Dateinamen & Ordner",
      fn_output_folder_label: "Ausgabeordner",
      fn_subfolder_label: "Unterordner (Haupt)",
      fn_prefix_label: "Präfix",
      fn_wf_version_label: "Workflow-Tag",
      fn_upscaled_suffix_label: "Upscale-Suffix",
      fn_delimiter_label: "Trennzeichen",
      fn_date_format_label: "Datumsformat (strftime)",
      overlay_status_title: "Status der Signatur/Wasserzeichen",
      extra_qual_95: "95% (Empfohlen)",
      extra_qual_90: "90% (Kompakt)",
      extra_qual_100: "100% (Maximal)",
      fn_output_ph: "(ComfyUI Standard)",
      fn_subfolder_ph: "z. B. 2026",
      fn_prefix_ph: "z. B. TA",
      fn_preview_prefix: "Vorschau:",
      seed_mode: "Seed-Modus",
      seed_random: "🎲 Zufall",
      seed_fixed: "🔒 Fest",
      seed_last: "🔄 Letzten Seed",
      seed_badge_random: "Zufall",
      seed_badge_fixed: "Fest",
      seed_badge_last: "Wiederholen",
      flux_guidance_gate: "Flux-Guidance Gate",
      flux_guidance_bypassed: "Inaktiv (Bypassed)",
      flux_guidance_hint_inactive: "Im Workflow automatisch inaktiv (nur bei FLUX-Modellen aktiv)",
      flux_guidance_hint_active: "Aktiv für das gewählte FLUX-Modell",
      lbl_attention_toggler: "⚡ Attention Engine",
      attn_none: "Standard",
      attn_sage: "SageAttention",
      attn_kitchen: "Kitchen INT8",
      lbl_sage_mode: "Kernel-Variante",
      sage_mode_auto: "auto (Standard sageattn)",
      lbl_torch_enable: "🚀 PyTorch FP16 Matmul (torch_enable)",
      badge_kitchen_on: "Kitchen AN",
      badge_sage_on: "Sage AN",
      badge_attn_standard: "Standard",
      sve_title: "🧬 SeedVarianceEnhancer",
      sve_off: "Aus",
      sve_badge_manual: "Manuell",
      sve_auto: "✨ Auto-Richtwert je Modell (empfohlen)",
      sve_adv_title: "⚙️ Erweiterte Einstellungen",
      sve_strength: "Stärke (strength)",
      sve_rand_pct: "Randomize (%)",
      sve_switch_pct: "Switchover (%)",
      sve_noise_insert: "Noise-Phase",
      sve_noise_begin: "Anfangs-Steps",
      sve_noise_end: "End-Steps",
      sve_noise_all: "Alle Steps",
      sve_noise_disabled: "Deaktiviert",
      sve_mask_start: "Mask-Schutz ab",
      sve_mask_begin: "Anfang",
      sve_mask_end: "Ende",
      sve_mask_pct: "Mask-Schutz (%)",
      sharpen_disabled: "Aus",
      use_seedvr2: "SeedVR2 Video/Image Upscaler nutzen",
      seedvr2_off: "Aus",
      seedvr2_model: "DiT-Modell (Node 1593)",
      seedvr2_res: "Auflösung (kurze Kante)",
      seedvr2_max_res: "Max. Auflösung",
      seedvr2_color_corr: "Farbkorrektur (color_correction)",
      seedvr2_cc_lab: "lab (Empfohlen)",
      seedvr2_cc_none: "Keine (none)",
      seedvr2_adv_title: "⚙️ Erweiterte SeedVR2-Optionen (VRAM & Noise)",
      seedvr2_blocks: "Blocks tauschen (0–36)",
      seedvr2_attn: "Attention-Modus",
      seedvr2_in_noise: "Input-Noise-Skala",
      seedvr2_lat_noise: "Latent-Noise-Skala",
      seedvr2_tiled: "VAE Tiling (Encode/Decode)",
      seedvr2_cache: "Modell cachen",
      laplacian_sharpen: "Laplacian-Schärfe (TAFastLaplacianSharpen)",
      film_grain: "🎞️ Filmkorn (ProPostFilmGrain)",
      film_grain_off: "Aus",
      film_grain_type: "Körnungstyp",
      fg_type_fine: "Fein (Fine)",
      fg_type_fine_simple: "Fein einfach (Fine Simple)",
      fg_type_coarse: "Grob (Coarse)",
      fg_type_coarser: "Gröber (Coarser)",
      film_grain_gray: "Graustufen",
      film_grain_power: "Stärke",
      film_grain_sat: "Sättigung",
      film_grain_shadows: "Schatten",
      film_grain_highs: "Lichter",
      film_grain_scale: "Skalierung",
      film_grain_gamma: "Quell-Gamma",
      film_grain_sharpen: "Korn-Schärfe",
      llm_adv_title: "⚙️ LLM-Feineinstellungen (1878 / 1879)",
      llm_temperature: "Temperatur",
      llm_max_tokens: "Max Tokens",
      llm_thinking_mode: "🧠 Thinking Mode (thinking_mode)",
      llm_unload_img_first: "🧹 Bildmodelle vorher entladen (unload_image_models_first)",
      llm_unload_after: "♻️ LLM danach entladen (unload_llm_after)",
      llm_system_prompt: "System-Prompt (T2I / I2I)",
      llm_system_prompt_ph: "Wird aus Workflow geladen...",
      llm_timeout: "Timeout (s)",
      llm_reset_defaults: "↺ Workflow-Standard",
      llm_user_prompt_i2i: "User-Prompt (I2I · Node 1879)",
      save_format: "Speicherformat",
      save_webp: "WebP (95% Qualität - empfohlen)",
      save_jpg: "JPEG (95% Qualität)",
      save_png: "PNG (Verlustfrei)",
      overlay_sig: "✒️ Künstler-Signatur",
      pos_bottom_right: "Unten rechts",
      pos_bottom_left: "Unten links",
      pos_bottom_center: "Unten zentriert",
      pos_top_right: "Oben rechts",
      pos_top_left: "Oben links",
      pos_top_center: "Oben zentriert",
      pos_center: "Mitte",
      pos_center_center: "Mitte",
      pos_center_left: "Mitte links",
      pos_center_right: "Mitte rechts",
      sig_placeholder: "Signaturtext...",
      font_label: "Schriftart (Font)",
      font_caveat: "Caveat (Handschrift / Signatur)",
      font_roboto: "Roboto (Klar & Modern)",
      font_quicksand: "Quicksand (Bold & Rund)",
      font_young_serif: "Young Serif (Klassisch)",
      font_oswald: "Oswald (Kompakt / Bold)",
      font_impact: "Impact (Kräftig)",
      font_pixelify: "Pixelify (Retro Pixel)",
      size_label: "Größe (px)",
      color_label: "Farbe",
      color_auto: "Auto (Kontrast)",
      color_white: "Weiß (white)",
      color_black: "Schwarz (black)",
      color_red: "Rot (red)",
      color_yellow: "Gelb (yellow)",
      align_label: "Vertikal (Align)",
      justify_label: "Horizontal (Justify)",
      offset_x_label: "Versatz X (px)",
      offset_y_label: "Versatz Y (px)",
      rotation_label: "Drehung (°)",
      margins_label: "Rand (px)",
      align_bottom: "Unten (bottom)",
      align_top: "Oben (top)",
      align_center: "Mitte (center)",
      justify_left: "Links (left)",
      justify_center: "Zentriert (center)",
      justify_right: "Rechts (right)",
      overlay_ai: "🤖 KI-Kennzeichnung",
      ai_disclaimer_placeholder: "KI-Hinweistext...",
      badge_overlay_both: "✒️ Sig + KI",
      badge_overlay_ai: "🤖 KI-Hinweis",
      badge_overlay_off: "Aus",
      overlay_img: "🖼️ Bild-Signatur / Logo",
      btn_overlay_img_upload: "📁 Logo wählen (PNG)",
      btn_overlay_img_clear_title: "Logo entfernen",
      pos_x_label: "Position X (px)",
      pos_y_label: "Position Y (px)",
      scale_max_label: "Skalierung (max. 0.50)",
      overlay_img_xy_hint: "0, 0 = Oben links",
      btn_overlay_img_br: "↘️ Unten rechts",
      btn_overlay_img_preview: "👁️ Vorschau",

      // Prompt Hub
      card_prompthub: "Prompt-Hub",
      lbl_positive_prompt: "Haupt-Bildidee (Positive Prompt)",
      placeholder_positive_prompt: "Beschreibe dein Bild...",
      lbl_additional_prompt: "Zusatz-Prompt / Stil-Booster (Additional)",
      badge_quality_style: "Qualität & Stil",
      placeholder_additional_prompt: "Zusätzliche Stilanweisungen / Qualität...",
      lbl_neg_prompt: "Negativ-Prompt (Negative Prompt)",
      badge_exclude: "Ausschließen",
      placeholder_neg_prompt: "Was soll vermieden werden...",
      pix_batch_title: "Batch-Größe: Wie viele Bilder pro Durchlauf generiert werden (1 bis 64)",
      pix_batch_dec_title: "Batch verringern",
      pix_batch_inc_title: "Batch erhöhen",
      pix_custom_ratio: "Eigenes Verhältnis",
      pix_custom_res: "Eigene Auflösung",
      pix_ratio_w: "Verhältnis B",
      pix_ratio_h: "Verhältnis H",
      pix_lbl_resolution: "Auflösung:",
      pix_swap_ratio_title: "Verhältnis umkehren",
      pix_lbl_width: "Breite (Width)",
      pix_lbl_height: "Höhe (Height)",
      pix_placeholder_custom_w: "z.B. 1024+128",
      pix_placeholder_custom_h: "z.B. 512*2",
      pix_swap_res_title: "Breite & Höhe tauschen",
      pix_save_custom_res: "💾 Merken",
      pix_save_custom_res_title: "Aktuelle Custom-Auflösung als Preset merken",
      pix_remove_custom_res: "Preset entfernen",

      // Prompt Controller
      card_prompt_controller: "Prompt-Controller",
      lbl_controller_mode: "Controller-Modus (mode)",
      opt_mode_manual: "Manual Only (Reine Prompt-Hub-Eingabe)",
      opt_mode_gen: "Generated Only (Nur KI-Prompt)",
      opt_mode_combo_mg: "Combine: Manual + Generated (Manuell + KI)",
      opt_mode_combo_gm: "Combine: Generated + Manual (KI + Manuell)",
      opt_mode_clear: "Clear / Empty (Prompt leeren)",
      ctrl_badge_manual: "Nur Manuell",
      ctrl_badge_gen: "Nur KI",
      ctrl_badge_combo_mg: "Manuell + KI",
      ctrl_badge_combo_gm: "KI + Manuell",
      ctrl_badge_clear: "Leer",
      lbl_delimiter: "Trennzeichen (delimiter)",

      // LLM
      card_llm: "LLM (Lokal / Cloud) – T2I & I2I",
      badge_llm_off: "Aus (Manuell)",
      badge_llm_t2i: "✨ Text2Prompt (T2I) Aktiv",
      badge_llm_i2i: "🖼️ Image2Prompt (I2I) Aktiv",
      btn_llm_off: "🚫 LLM Aus",
      btn_llm_t2i: "✨ Text2Prompt (T2I)",
      btn_llm_i2i: "🖼️ Image2Prompt (I2I)",
      lbl_llm_model: "LLM-Modell (LM Studio / Ollama / Cloud)",
      badge_llm_ready: "Bereit",
      badge_llm_ready_inactive: "Bereit (Inaktiv)",
      badge_llm_text_model: "Text-Modell",
      badge_llm_vision_model: "Vision-Modell",
      badge_llm_source_local: "🖥️ Lokal",
      badge_llm_source_cloud: "☁️ Cloud",
      llm_model_search_placeholder: "🔍 Modell suchen...",
      btn_clear_search_title: "Suche leeren",
      llm_model_none_found: "Keine passenden Modelle gefunden.",
      badge_llm_checking: "Prüfe...",
      badge_llm_online: "Online",
      badge_llm_offline: "⚠️ Kein LLM aktiv!",
      badge_llm_provider_offline: "⚠️ {provider} offline!",
      toast_llm_provider_offline: "Der gewählte LLM-Provider ({provider}) ist offline. Bitte Server starten, ein verfügbares Modell wählen oder LLM auf Aus stellen.",
      badge_llm_title_click: "Klicken, um Status von LM Studio / Ollama / Cloud-LLMs neu zu prüfen",
      llm_unavailable_title: "Weder lokaler LLM-Server (LM Studio / Ollama) noch Cloud-API-Key aktiv",
      lbl_i2i_ref: "I2I Referenzbild",
      i2i_ref_title: "Node 1880 – Bild laden",
      i2i_thumb_title: "In Haupt-Vorschau anzeigen",
      alt_reference: "Referenz",
      alt_preview: "Vorschau",
      alt_compare_after: "Nachher (SeedVR2)",
      alt_compare_before: "Vorher (Original)",
      badge_no_image: "Kein Bild gewählt",
      badge_uploading: "Wird hochgeladen...",
      badge_error: "Fehler",
      i2i_drop_title: "Klicken oder Referenzbild hierher ziehen",
      i2i_drop_sub: "PNG, JPG oder WEBP für Vision-Modell-Analyse",
      i2i_loaded: "✓ In ComfyUI geladen (Node 1880)",
      i2i_uploading: "⏳ Wird an ComfyUI gesendet...",
      i2i_upload_failed_status: "✗ Upload fehlgeschlagen (nicht in ComfyUI)",
      toast_i2i_missing_before_gen: "Bitte zuerst ein gültiges I2I-Referenzbild nach ComfyUI hochladen (aktuell ist kein Bild geladen).",
      btn_remove_i2i: "Entfernen",
      btn_remove_i2i_title: "Bild entfernen",
      lbl_llm_result: "✨ Generierter KI-Prompt (LLM Output)",
      btn_copy_llm: "📋 Kopieren",
      btn_copy_llm_title: "KI-Prompt kopieren",
      btn_adopt_llm: "📥 Als Bildidee übernehmen",
      btn_adopt_llm_title: "In Prompt-Hub als Haupt-Bildidee übernehmen",
      placeholder_llm_result: "Der vom LLM generierte Prompt wird hier nach der Generierung angezeigt...",
      llm_generating_prompt: "LLM generiert Prompt...",
      llm_no_prompt_warning: "⚠️ Kein Prompt vom LLM erhalten{reason}.\n\nBitte prüfen, ob dein LLM-Server (LM Studio / Ollama) oder ein Cloud-API-Key aktiv ist.",

      // Generate & Cancel
      btn_generate: "BILD GENERIEREN",
      btn_generate_sending: "Sende an ComfyUI...",
      btn_generate_computing: "ComfyUI rechnet...",
      btn_generate_step: "Generiere... Step",
      btn_generate_running: "Generiere...",
      btn_cancel_generate: "Aktion abbrechen",
      btn_cancel_generate_title: "Laufende Generierung in ComfyUI sofort abbrechen",
      btn_cancel_cancelling: "Breche ab...",

      // Viewer & Gallery Actions
      empty_state_title: "Bereit zum Generieren",
      empty_state_hint: "Wähle dein Modell-Preset, passe die Prompts an und drücke auf \"Bild generieren\".",
      btn_download: "📥 Download",
      btn_download_title: "Bild herunterladen",
      btn_copy_prompt: "📋 Prompt kopieren",
      btn_copy_prompt_title: "Prompt kopieren",
      btn_reuse_seed: "🔄 Seed übernehmen",
      btn_reuse_seed_title: "Seed in Eingabe übernehmen",
      btn_apply_all: "⚡ Parameter laden",
      btn_apply_all_title: "Alle Parameter dieses Bildes (Prompts, Modell, Sampler, Seed, Pixaroma-Auflösung, LoRAs) ins Cockpit laden",
      btn_send_to_videomaker: "🎬 An VideoMaker",
      btn_send_to_videomaker_title: "Aktuelles Bild an VideoMaker übergeben",
      btn_remove_bg: "✂️ Hintergrund entf.",
      btn_remove_bg_title: "Hintergrund des aktuellen Bildes entfernen (freistellen)",
      btn_remove_bg_busy: "⏳ Freistellen...",
      btn_generate_removing_bg: "Hintergrund wird entfernt...",
      bg_remove_help_title: "Warum inaktiv?",
      bg_remove_help_offline: "ComfyUI ist aktuell nicht verbunden. Starte ComfyUI, um zu prüfen, ob ein Background-Remover-Node installiert ist.",
      bg_remove_help_no_node: "Kein Background-Remover-Node in ComfyUI gefunden. Installiere z. B. ComfyUI-RMBG oder rembg über den ComfyUI Manager und starte ComfyUI neu.",
      bg_remove_success: "Hintergrund erfolgreich entfernt!",
      bg_remove_cancelled: "Hintergrundentfernung abgebrochen.",
      bg_remove_error: "Fehler beim Freistellen: ",
      bg_remove_no_image: "Kein Bild in der Vorschau ausgewählt.",
      btn_clear_gallery: "🧹 Galerie leeren",
      btn_clear_gallery_title: "Galerieansicht leeren (Dateien auf der Festplatte bleiben sicher erhalten)",
      btn_refresh_gallery: "🔄 Neu laden",
      btn_refresh_gallery_title: "Bilder aus Ausgabeordner neu laden",
      btn_collapse_gallery: "▼ Galerie einklappen",
      btn_expand_gallery: "▲ Galerie anzeigen",
      btn_collapse_gallery_title: "Galerieleiste ein- oder ausklappen",
      btn_expand_gallery_title: "Galerieleiste ausklappen",
      btn_open_folder: "📁 Im Ordner zeigen",
      btn_open_folder_title: "Im Explorer anzeigen",
      btn_fullscreen: "⛶ Vollbild",
      btn_fullscreen_title: "Vollbild-Vorschau",
      btn_zoom_reset_title: "Zoom zurücksetzen (Doppelklick)",
      gallery_empty: "Keine Bilder im Ausgabeordner vorhanden.",
      gallery_no_output_dir: "Kein Ausgabeordner konfiguriert (siehe Einstellungen).",
      gallery_cleared: "Galerieansicht geleert. (Alle Dateien bleiben sicher auf deiner Festplatte erhalten.)",
      gallery_restore_hint: "Bilder neu laden",
      delete_btn_title: '"{filename}" von Festplatte & Galerie löschen',
      delete_confirm_prompt: 'Soll das Bild "{filename}" wirklich von der Festplatte und aus der Galerie gelöscht werden?',

      // Modals
      nav_gallery: "🖼️ Galerie",
      settings_title: "⚙️ Einstellungen & Verbindungen",
      settings_sec_general: "🌐 Allgemein",
      settings_badge_general: "Oberfläche",
      settings_sec_comfy: "🎨 ComfyUI",
      settings_badge_comfy: "Bild-Backend & Pfade",
      settings_sec_llm: "🧠 TASmartLLM",
      settings_badge_llm: "Prompt-KI / LLM",
      settings_sec_video: "🎬 VideoMaker",
      settings_badge_video: "Video-Tab",
      settings_video_dir: "Video-Ausgabeordner (optional)",
      settings_video_dir_ph: "Standard: ComfyUI / Bilder-Ausgabeordner",
      settings_sec_music: "🎵 MusicMaker",
      settings_badge_music: "Musik-Tab",
      settings_music_dir: "Musik-Ausgabeordner (optional)",
      settings_music_dir_ph: "Standard: ComfyUI Output / App-Renders",
      settings_sec_gif: "👾 DiscordGIF",
      settings_badge_gif: "GIF-Tab",
      settings_desc: "Die GUI erkennt ein laufendes ComfyUI automatisch (z. B. auf Port 8188). Auch wenn ComfyUI in WSL oder auf einem anderen Rechner läuft, kannst du die Adresse hier anpassen.",
      settings_lang: "Sprache / Language",
      btn_theme_title: "Design & Akzentfarbe wechseln",
      theme_base_label: "Hintergrund / Design",
      theme_accent_label: "Akzentfarbe",
      theme_base_midnight: "Midnight",
      theme_base_obsidian: "Obsidian",
      theme_base_charcoal: "Charcoal",
      theme_base_plum: "Plum",
      theme_base_solar_noir: "Solar Noir",
      theme_base_matrix_green: "Neon Green",
      theme_base_pastel_pink: "Pastel Pink",
      theme_base_light: "Light",
      theme_base_midnight_full: "Midnight Blue (Standard)",
      theme_base_obsidian_full: "Obsidian Dark (Neutral)",
      theme_base_charcoal_full: "Warm Charcoal",
      theme_base_plum_full: "Plum / Aubergine",
      theme_base_solar_noir_full: "Solar Noir (Dunkel + Gold)",
      theme_base_matrix_green_full: "Neon Green (Cyber)",
      theme_base_pastel_pink_full: "Pastel Pink (Blasses Pink)",
      theme_base_light_full: "Studio Light (Hell)",
      theme_accent_custom: "Eigene Farbe (Custom)",
      theme_accent_custom_title: "Eigene Akzentfarbe frei wählen",
      theme_popover_aria: "Design & Farben",
      theme_accent_violet: "Studio-Violett",
      theme_accent_lavender: "Sanftes Lavendel",
      theme_accent_cyan: "Mitternachts-Cyan",
      theme_accent_emerald: "Dunkelkammer-Smaragd",
      theme_accent_neon_green: "Neon-Grün",
      theme_accent_amber: "Solar-Bernstein",
      theme_accent_rose: "Karmesin-Rosa",
      theme_accent_blush_pink: "Zartes Rosa",
      theme_accent_titanium: "Stealth-Titan",
      theme_custom_slot_1: "Eigener Slot 1",
      theme_custom_slot_2: "Eigener Slot 2",
      bg_remove_help_aria: "Info",
      custom_res_snap_title: "Einrasten {snap}",
      theme_reset_btn: "↺ Standard-Theme wiederherstellen",
      settings_comfy_url: "ComfyUI URL",
      settings_output_dir: "Bilder-Ausgabeordner (Windows-Pfad)",
      settings_lms_url: "LM Studio URL",
      settings_ollama_url: "Ollama URL",
      settings_cloud_keys_title: "☁️ Externe Cloud-LLM API-Keys (optional)",
      settings_cloud_keys_hint: "🔒 Keys werden lokal per Windows-DPAPI verschlüsselt gespeichert, nicht in Releases geteilt und beim ComfyUI-Start automatisch übergeben. Nach Änderung ComfyUI ggf. neu starten.",
      settings_cloud_key_set_studio: "Gespeichert ({masked})",
      settings_cloud_key_set_env: "Windows-Env ({masked})",
      settings_cloud_key_change_hint: "{status} – neuen Key eingeben zum Ändern",
      btn_clear_key_title: "Key entfernen",
      settings_launch_cmd: "ComfyUI Start-Befehl / Skript (WSL oder Windows .bat)",
      settings_launch_placeholder: "z. B. C:\\ComfyUI\\run_nvidia_gpu.bat",
      settings_launch_hint: "Hinweis: Trage hier den Pfad zu deiner eigenen Windows-.bat (z. B. run_nvidia_gpu.bat) oder deinem Start-Skript ein – wird beim Klick auf '⚡ ComfyUI starten' geöffnet.",
      settings_extra_models_dir: "Zusätzlicher Modelle- & LoRA-Ordner (optional)",
      settings_extra_models_ph: "z. B. D:\\AI\\Models",
      settings_extra_models_hint: "Optional: Ordner auf einer anderen Festplatte (mit Unterordnern wie checkpoints, loras, unet, vae). Wird beim Start über '⚡ ComfyUI starten' separat per --extra-model-paths-config übergeben, ohne deine bestehende extra_model_paths.yaml zu überschreiben.",
      settings_confirm_close: "Sicherheitsabfrage beim Schließen des Cockpits anzeigen",
      app_close_modal_title: "Cockpit schließen?",
      app_close_modal_desc: "Möchtest du thomo.ART StudioCockpit wirklich schließen?",
      app_close_confirm_btn: "Schließen",
      card_pc_delimiter_toggle_title: "Delimiter ein-/ausklappen",
      plato_key_toggle_title: "Plato's Key ein-/ausklappen",
      btn_browse: "📁 Durchsuchen",
      toast_launch_missing: "Bitte trage zuerst deine ComfyUI-Startdatei (z. B. run_nvidia_gpu.bat) ein und speichere.",
      toast_launch_error: "Fehler beim Starten von ComfyUI: ",
      toast_network_error: "Netzwerkfehler: ",
      toast_gen_failed: "Fehler bei Generierung: ",
      comfy_offline_modal_title: "ComfyUI ist nicht gestartet",
      comfy_offline_modal_desc: "Um ein Bild zu generieren, muss ComfyUI zuerst gestartet werden. Möchtest du ComfyUI jetzt starten?",
      comfy_offline_btn_settings: "⚙️ Einstellungen",
      comfy_offline_btn_start: "⚡ ComfyUI jetzt starten",
      app_loading_text: "StudioCockpit wird geladen...",
      gal_loading_text: "Bilder werden geladen...",
      btn_compare: "↔️ Vergleich",
      btn_compare_title: "Vorher/Nachher-Vergleich (Original vs. SeedVR2)",
      compare_before: "Original",
      compare_after: "SeedVR2",
      settings_test_btn: "Verbindung testen",
      settings_save_btn: "Speichern",
      settings_conn_testing: "Prüfe...",
      settings_conn_ok: "✓ Erfolgreich verbunden!",
      settings_conn_fail: "✕ Nicht erreichbar",

      delete_modal_title: "Bild löschen?",
      delete_modal_warning: "Dieses Bild wird dauerhaft von der Festplatte und aus der Galerie entfernt.",
      btn_cancel: "Abbrechen",
      btn_delete: "🗑️ Löschen",

      preset_modal_default_title: "Preset-Editor",
      preset_modal_title_model: "🧠 TA Model Preset Editor (Neues Preset anlegen & verwalten)",
      preset_modal_title_sampler: "⚡ TA Sampler Preset Editor (Neues Preset anlegen & verwalten)",
      preset_editor_offline_title: "ComfyUI ist nicht gestartet",
      preset_editor_offline_desc: "Der Preset-Editor wird direkt von ComfyUI bereitgestellt. Bitte starte zuerst ComfyUI, um Presets anzulegen oder zu bearbeiten.",
      preset_editor_retry: "↻ Erneut versuchen",
      toast_comfy_offline_preset_editor: "ComfyUI läuft nicht — bitte zuerst ComfyUI starten.",
      btn_open_external: "↗ Im Tab öffnen",
      btn_open_external_title: "In neuem Browser-Tab öffnen",

      drop_title: "Bild hier ablegen",
      drop_sub: "Liest alle Prompts, Modell, Sampler, Seed, Pixaroma-Auflösung & LoRAs aus den Bild-Metadaten",
      drop_sub_i2i: "Als Referenzbild für Vision (Image -> Prompt) ablegen oder Metadaten laden",
      btn_adopt_preview_i2i: "🖼️ Aus Vorschau übernehmen",
      btn_adopt_preview_i2i_title: "Aktuell in der Vorschau angezeigtes Bild als I2I-Referenzbild übernehmen",
      btn_browse_i2i: "📁 Durchsuchen…",
      btn_browse_i2i_title: "Referenzbild per Datei-Dialog auswählen (merkt sich den letzten Ordner)",

      // Toasts & Alerts
      toast_copied: "✓ Kopiert!",
      toast_adopted: "✓ Übernommen!",
      toast_loaded: "✓ Geladen!",
      toast_cleared: "✓ Geleert!",
      toast_seed_active: "✓ Seed aktiv!",
      toast_meta_reading: "Lese Bild-Metadaten...",
      toast_meta_success: 'Bild geladen & alle Parameter übernommen!',
      toast_meta_success_file: 'Bild geladen & alle Parameter aus "{filename}" übernommen!',
      toast_meta_fail: "Metadaten konnten nicht gelesen werden.",
      toast_meta_no_workflow: 'Bild "{filename}" in Vorschau geladen (keine ComfyUI-Metadaten).',
      toast_i2i_empty: "Die gewählte Bilddatei ist leer (0 Bytes) und kann nicht verwendet werden.",
      toast_i2i_uploaded: 'I2I-Referenzbild "{filename}" geladen & in ComfyUI bereitgestellt!',
      toast_i2i_upload_fail: "Fehler beim Hochladen nach ComfyUI.",
      toast_i2i_adopt_error: "Fehler beim Übernehmen aus der Vorschau: ",
      toast_logo_uploaded: 'Logo "{filename}" geladen & unten rechts eingepasst!',
      toast_logo_upload_first: "Bitte zuerst ein Logo hochladen.",
      toast_no_preview_image: "Kein Bild in der Vorschau vorhanden.",
      toast_no_params: "Keine Parameter gefunden.",
      toast_no_gallery_selection: "Kein Bild in der Galerie ausgewählt.",
      toast_drop_invalid: "Bitte ein Bild (PNG oder WebP) ablegen.",
      toast_image_deleted: 'Bild "{filename}" wurde gelöscht.',
      toast_delete_error: "Fehler beim Löschen: ",
      toast_cancel_request: "Generierung wird abgebrochen...",
      toast_cancelled: "Generierung wurde abgebrochen.",
      toast_cancel_error: "Fehler beim Abbrechen: ",
      toast_gen_error: "Fehler bei der Generierung in ComfyUI.",
      toast_lora_synced: "LoRAs synchronisiert ({count} verfügbar)",
      toast_lora_sync_error: "Fehler beim LoRA-Sync: ",
      toast_lora_auto_deactivated: "{count} inkompatible(s) LoRA(s) für {model} automatisch deaktiviert",
      toast_net_error: "Netzwerkfehler: Ist der Cockpit-Server (server.py) gestartet?",
      err_invalid_lora_format: "Ungültiges LoRA-Format",
      err_image_load_failed: "Konnte Bild nicht laden",
      err_unknown: "Unbekannter Fehler",
      err_timeout: "Zeitüberschreitung (Timeout)",
      loading_status: "Lade...",
      missing_nodes_title: "Fehlende ComfyUI Custom Nodes",
      missing_nodes_desc: "Für den Workflow fehlen in deiner ComfyUI-Installation benötigte Custom-Node-Packs. Sollen die ausgewählten Packs jetzt automatisch installiert werden?",
      missing_nodes_dir_label: "ComfyUI-Verzeichnis (z. B. C:\\ComfyUI_windows_portable)",
      missing_nodes_btn_later: "Später",
      missing_nodes_btn_recheck: "🔄 Neu prüfen",
      missing_nodes_btn_install: "⬇️ Jetzt installieren",
      missing_nodes_btn_browse: "📁 Ordner wählen",
      install_nodes_installing: "Installiere…",
      missing_nodes_install_failed: "Installation fehlgeschlagen.",
      missing_nodes_remote_title: "Remote-ComfyUI kann nicht lokal installiert werden",
      missing_nodes_badge_restart: "Neustart nötig",
      missing_nodes_badge_required: "Erforderlich",
      missing_nodes_badge_optional: "Optional",
      missing_nodes_missing_prefix: "Fehlt: ",
      missing_nodes_all_installed: "Alle benötigten Custom Nodes sind installiert!",
      missing_nodes_select_one: "Bitte wähle mindestens ein Pack aus.",
      missing_nodes_starting: "Starte Installation...",
      missing_nodes_installing_pack: "Installiere: {pack}",
      missing_nodes_done_restart: "Fertig – bitte ComfyUI neu starten!",
      missing_nodes_done_warnings: "Mit Hinweisen beendet",
      missing_nodes_row_ok: "✓ Installiert (ComfyUI neu starten)",
      missing_nodes_row_err: "✖ Fehler",
      missing_nodes_desc_done: "Installation abgeschlossen! Bitte starte ComfyUI jetzt neu, damit die neuen Custom Nodes geladen werden.",
      missing_nodes_btn_close: "Schließen",
      missing_nodes_btn_recheck_restart: "🔄 Nach Neustart prüfen",
      missing_nodes_toast_done: "Custom Nodes installiert! Bitte starte ComfyUI neu.",
      missing_nodes_toast_some_errors: "Einige Packs hatten Fehler.",
      update_modal_title: "Update verfügbar",
      update_current_ver: "Aktuell: v{ver}",
      update_new_ver: "Neu: v{ver}",
      update_question: "Eine neue Version ist auf GitHub verfügbar. Möchtest du das Update jetzt herunterladen und installieren?",
      update_release_notes: "Versionshinweise",
      update_source_hint_html: "Hinweis: Die automatische 1-Klick-Installation ist nur in der kompilierten <code>StudioCockpit.exe</code> verfügbar. Du kannst das Release direkt auf GitHub öffnen.",
      update_downloading: "Update wird heruntergeladen…",
      update_installing: "Installiere…",
      update_starting_download: "Starte Download…",
      update_btn_later: "Später",
      update_btn_github: "Auf GitHub öffnen",
      update_btn_install: "⬇️ Jetzt installieren",
      toast_update_uptodate: "StudioCockpit ist auf dem neuesten Stand (v{ver}).",
      toast_update_check_failed: "Update-Prüfung fehlgeschlagen.",
      toast_update_offline: "Konnte nicht nach Updates suchen (offline?).",
      toast_update_failed: "Update fehlgeschlagen.",
      update_start_failed: "Installation konnte nicht gestartet werden.",
      ctx_copy: "📋 Kopieren",
      ctx_cut: "✂️ Ausschneiden",
      ctx_paste: "📥 Einfügen",
      ctx_select_all: "🔘 Alles auswählen",
    },
    en: {
      brand_wf_title: "Active ComfyUI Workflow",
      gpu_checking: "GPU…",
      gpu_connected: "GPU",
      gpu_offline: "GPU: —",
      gpu_toggle_title: "Show GPU & VRAM details",
      gpu_vram_label: "VRAM free",
      gpu_device_label: "Device",
      gpu_allocator_label: "Allocator",
      gpu_offline_detail: "ComfyUI is not connected.",
      gpu_peak_label: "Peak",
      gpu_ram_label: "System RAM",
      gpu_load_label: "GPU",
      cpu_load_label: "CPU",
      gpu_temp_label: "Temp",
      gpu_power_label: "Power",
      btn_free_vram: "🧹 Free VRAM",
      btn_free_vram_busy: "⏳ Freeing VRAM…",
      btn_free_vram_done: "✓ VRAM freed",
      btn_reset_peak: "↺ Peak",
      btn_reset_peak_title: "Reset VRAM peak",
      gpu_free_suffix: "free",
      custom_slot_filled_title: "Custom Slot {slot} ({color}) – Left-click: Apply · Right-click: Clear",
      custom_slot_empty_title: "Custom Slot {slot} (empty) – Click to save current accent color",
      col_resizer_title: "Drag to resize · Double-click to reset",
      aria_studio_nav: "Studio Modules",
      aria_gpu_details: "GPU Details",
      aria_custom_accent: "Custom Accent Color",
      aria_resize_setup: "Resize setup column",
      aria_resize_prompt: "Resize prompt column",
      nav_images: "🎨 Images",
      brand_version_title: "Click to check for updates on GitHub",
      update_badge_text: "⬆️ Update",
      update_badge_title: "New update available – click to install",
      comfy_connecting: "Connecting to ComfyUI...",
      comfy_connected: "ComfyUI connected",
      comfy_disconnected: "ComfyUI disconnected",
      btn_launch_comfy: "⚡ Launch ComfyUI",
      btn_launch_comfy_running: "✓ ComfyUI running",
      btn_restart_comfy: "🔄 Restart ComfyUI",
      btn_restart_comfy_title: "Stop and restart running ComfyUI",
      btn_restart_comfy_restarting: "⏳ Restarting…",
      restart_comfy_modal_title: "Restart ComfyUI?",
      restart_comfy_modal_desc: "Do you really want to restart ComfyUI? Any running generations will be interrupted.",
      restart_comfy_confirm_btn: "Restart",
      preset_confirm_title: "Confirm Action",
      btn_confirm_ok: "OK",
      btn_launch_comfy_opening: "⏳ Opening terminal…",
      btn_launch_comfy_tab: "⏳ New tab opened…",
      btn_launch_comfy_started: "⏳ Terminal started…",
      btn_launch_comfy_title: "Launch ComfyUI in a terminal window",
      btn_launch_comfy_running_title: "ComfyUI is connected and running",
      btn_settings_title: "ComfyUI Connection Settings",
      btn_reload_title: "Reload UI (F5)",
      btn_reload_app: "🔄 Reload App",

      // Setup
      card_model: "Model Preset",
      badge_custom_model: "Custom Model",
      badge_custom_sampler: "Custom Sampler",
      models_none_installed: "— No installed models found —",
      samplers_none_found: "— No matching sampler presets —",
      btn_edit_preset: "✏️ Editor / + New",
      btn_edit_preset_title: "Create or edit presets",
      card_sampler: "Sampler Preset",
      help_btn_title: "Show/hide help for this section",
      help_model_html: "<p><b>What is this for?</b> Choose the base AI model used for image generation.</p><ul><li><b>Select:</b> Use the dropdown or the quick-favorite pills below it.</li><li><b>Auto-sync:</b> Switching models automatically updates matching sampler suggestions, LoRA filters, and Flux Guidance.</li><li><b>Customize:</b> Click <b>✏️ Editor / + New</b> to create your own model presets or manage quick-favorite pills.</li></ul>",
      help_sampler_html: "<p><b>What is this for?</b> Controls how the image is sampled (<b>Steps</b>, <b>Sampler/Scheduler</b>, and <b>CFG</b>).</p><ul><li><b>Select:</b> Pick a preset matching your model (Turbo models usually use 4–9 steps &amp; CFG 1; standard/dev models often use 20–25 steps).</li><li><b>Status badge:</b> The status badge at top left always shows the currently active parameters.</li><li><b>Customize:</b> Use <b>✏️ Editor / + New</b> to create custom presets or directly edit Steps, Sampler, Scheduler, and CFG.</li></ul>",
      help_lora_html: "<p><b>What is this for?</b> LoRAs add specific styles, characters, details, or effects on top of your selected base model.</p><ul><li><b>Enable &amp; strength:</b> Toggle LoRAs in the list and adjust their weight as needed. The header badge shows active LoRAs and warns if any are incompatible with the current model.</li><li><b>Filter &amp; search:</b> Use <b>All</b>, <b>🎯 Match Model</b>, or <b>⚡ Active Only</b>, plus search, category filter, and <b>Toggle All</b>.</li><li><b>Manager &amp; sync:</b> Click <b>L</b> to open the ComfyUI LoRA Manager, or <b>🔄 Sync</b> to reload LoRAs from the active workflow.</li></ul>",
      help_tuning_html: "<p><b>What is this for?</b> Configure seed behavior, acceleration, upscaling &amp; FX, file export, and overlays across 4 tabs:</p><ul><li><b>⚙️ Sampling:</b> Seed mode (Random/Fixed/Last), Flux Guidance (for FLUX models), Attention Engine (Sage/Kitchen), and SeedVarianceEnhancer.</li><li><b>🔍 Upscale &amp; FX:</b> Upscale (SeedVR2), sharpen, and add film grain to generated images.</li><li><b>💾 Export:</b> Save prompt <code>.txt</code> files, extra image copies, and output folder/filename patterns.</li><li><b>✒️ Signature:</b> Configure signature, watermark, and AI-label overlays.</li></ul>",
      help_prompthub_html: "<p><b>What is this for?</b> Write your image description and set the output aspect ratio and batch count:</p><ul><li><b>Main Prompt (Positive):</b> Describe the subject, scene, lighting, and style.</li><li><b>Additional Prompt:</b> Optional quality and style boosters appended automatically.</li><li><b>Negative Prompt:</b> Elements to avoid in the generated image (e.g., borders, text, artifacts).</li><li><b>Resolution Pixaroma &amp; Batch:</b> Pick the aspect ratio and use <b>batch</b> (1–64) to set how many images are generated per run.</li></ul>",
      help_prompt_controller_html: "<p><b>What is this for?</b> Controls whether generation uses your manual Prompt Hub input, the AI-generated LLM prompt, or a combination of both.</p><ul><li><b>Controller Mode:</b> Choose <b>Manual Only</b> (your input), <b>Generated Only</b> (LLM output), a <b>Combine</b> mode, or <b>Clear / Empty</b>.</li><li><b>Auto-sync:</b> Switching the LLM mode (T2I/I2I/Off) automatically adjusts the controller mode to match.</li><li><b>Delimiter:</b> Defines the separator placed between manual and generated prompts when combining (default: <code>, </code>).</li></ul>",
      help_llm_html: "<p><b>What is this for?</b> Automatically expands or creates prompts using a local LLM (LM Studio / Ollama) or a cloud API.</p><ul><li><b>Modes:</b> <b>🚫 LLM Off</b> uses your prompt directly, <b>✨ Text2Prompt (T2I)</b> enriches your text idea, and <b>🖼️ Image2Prompt (I2I)</b> describes a reference image using a vision model.</li><li><b>Model &amp; status:</b> Pick an available model; the badges show its source (Local/Cloud) and online status.</li><li><b>Fine-Tuning:</b> Expand <b>⚙️ LLM Fine-Tuning</b> to adjust temperature, max tokens, system/user prompts, and automatic VRAM unloading.</li></ul>",
      card_lora: "LoRA Stack",
      card_lora_title: "Click to collapse/expand",
      btn_lora_manager_title: "Open LoRA Manager in ComfyUI (http://127.0.0.1:8188/loras)",
      lora_mgr_modal_title: "ComfyUI LoRA Manager",
      lora_mgr_btn_sync: "🔄 Sync",
      lora_mgr_btn_sync_title: "Synchronize LoRAs into Cockpit",
      lora_mgr_btn_reload: "↻ Reload",
      lora_mgr_btn_reload_title: "Reload LoRA Manager",
      lora_mgr_btn_external: "↗ Browser",
      lora_mgr_btn_external_title: "Open in external browser",
      lora_mgr_loading: "Loading LoRA Manager...",
      btn_sync_loras: "🔄 Sync",
      btn_sync_loras_title: "Re-synchronize LoRAs from active workflow",
      lora_filter_all: "All",
      lora_filter_match: "🎯 Match Model",
      lora_filter_match_title: "Show only LoRAs matching the currently selected model preset",
      lora_filter_active: "⚡ Active Only",
      lora_filter_active_title: "Show activated LoRAs only",
      lora_search_placeholder: "🔍 Search LoRA...",
      lora_cat_all: "All Categories",
      lora_cat_other: "Other",
      lora_cat_title: "Filter by category / architecture",
      lora_toggle_all: "Toggle All",
      lora_toggle_all_title: "Toggle all visible LoRAs on or off",
      lora_none_found: "No LoRAs found matching current filter.",
      lora_none_found_sub: "Click <b>All</b> or adjust your search.",
      lora_active_none: "0 active",
      lora_active_some: "{count} active",
      lora_active_incompatible: "{count} active (⚠️ Incompatible)",
      lora_trigger_title: "Trigger word: {trigger}",
      lora_cat_badge_title: "Architecture/Category: {cat}",

      // Fine-Tuning
      card_tuning: "Fine-Tuning & Finish",
      tab_sampling: "⚙️ Sampling",
      tab_sampling_title: "Sampling & Seed",
      tab_upscale: "🔍 Upscale & FX",
      tab_upscale_title: "Upscaling, Sharpness & Film Grain",
      tab_export: "💾 Export",
      tab_export_title: "Save & Export",
      tab_overlay: "✒️ Signature",
      tab_overlay_title: "Signature & Text Overlays",
      export_main_header: "Main Output (Node 1229)",
      save_txt_main: "📄 Save prompt as .txt file",
      save_extra_image: "🖼️ Save additional copy (Node 1619)",
      extra_format_label: "Format",
      extra_quality_label: "Quality",
      extra_subfolder_label: "Subfolder",
      save_extra_txt: "📄 Also create .txt file for this copy",
      fn_gen_header: "📁 Filenames & Folders",
      fn_output_folder_label: "Output Folder",
      fn_subfolder_label: "Subfolder (Main)",
      fn_prefix_label: "Prefix",
      fn_wf_version_label: "Workflow Tag",
      fn_upscaled_suffix_label: "Upscale Suffix",
      fn_delimiter_label: "Delimiter",
      fn_date_format_label: "Date Format (strftime)",
      overlay_status_title: "Signature / watermark status",
      extra_qual_95: "95% (Recommended)",
      extra_qual_90: "90% (Compact)",
      extra_qual_100: "100% (Maximum)",
      fn_output_ph: "(ComfyUI Default)",
      fn_subfolder_ph: "e.g. 2026",
      fn_prefix_ph: "e.g. TA",
      fn_preview_prefix: "Preview:",
      seed_mode: "Seed Mode",
      seed_random: "🎲 Random",
      seed_fixed: "🔒 Fixed",
      seed_last: "🔄 Last Seed",
      seed_badge_random: "Random",
      seed_badge_fixed: "Fixed",
      seed_badge_last: "Repeat",
      flux_guidance_gate: "Flux Guidance Gate",
      flux_guidance_bypassed: "Inactive (Bypassed)",
      flux_guidance_hint_inactive: "Automatically inactive in workflow (only active for FLUX models)",
      flux_guidance_hint_active: "Active for selected FLUX model",
      lbl_attention_toggler: "⚡ Attention Engine",
      attn_none: "Standard",
      attn_sage: "SageAttention",
      attn_kitchen: "Kitchen INT8",
      lbl_sage_mode: "Kernel Variant",
      sage_mode_auto: "auto (default sageattn)",
      lbl_torch_enable: "🚀 PyTorch FP16 Matmul (torch_enable)",
      badge_kitchen_on: "Kitchen ON",
      badge_sage_on: "Sage ON",
      badge_attn_standard: "Standard",
      sve_title: "🧬 SeedVarianceEnhancer",
      sve_off: "Off",
      sve_badge_manual: "Manual",
      sve_auto: "✨ Auto-preset per model (recommended)",
      sve_adv_title: "⚙️ Advanced Settings",
      sve_strength: "Strength",
      sve_rand_pct: "Randomize (%)",
      sve_switch_pct: "Switchover (%)",
      sve_noise_insert: "Noise Phase",
      sve_noise_begin: "Beginning Steps",
      sve_noise_end: "Ending Steps",
      sve_noise_all: "All Steps",
      sve_noise_disabled: "Disabled",
      sve_mask_start: "Mask Protect From",
      sve_mask_begin: "Beginning",
      sve_mask_end: "End",
      sve_mask_pct: "Mask Protect (%)",
      sharpen_disabled: "Off",
      use_seedvr2: "Use SeedVR2 Video/Image Upscaler",
      seedvr2_off: "Off",
      seedvr2_model: "DiT Model (Node 1593)",
      seedvr2_res: "Resolution (short edge)",
      seedvr2_max_res: "Max Resolution",
      seedvr2_color_corr: "Color Correction",
      seedvr2_cc_lab: "lab (Recommended)",
      seedvr2_cc_none: "None",
      seedvr2_adv_title: "⚙️ Advanced SeedVR2 Options (VRAM & Noise)",
      seedvr2_blocks: "Blocks to Swap (0–36)",
      seedvr2_attn: "Attention Mode",
      seedvr2_in_noise: "Input Noise Scale",
      seedvr2_lat_noise: "Latent Noise Scale",
      seedvr2_tiled: "VAE Tiled (Encode/Decode)",
      seedvr2_cache: "Cache Model",
      laplacian_sharpen: "Laplacian Sharpness (TAFastLaplacianSharpen)",
      film_grain: "🎞️ Film Grain (ProPostFilmGrain)",
      film_grain_off: "Off",
      film_grain_type: "Grain Type",
      fg_type_fine: "Fine",
      fg_type_fine_simple: "Fine Simple",
      fg_type_coarse: "Coarse",
      fg_type_coarser: "Coarser",
      film_grain_gray: "Grayscale",
      film_grain_power: "Power",
      film_grain_sat: "Saturation",
      film_grain_shadows: "Shadows",
      film_grain_highs: "Highlights",
      film_grain_scale: "Scale",
      film_grain_gamma: "Source Gamma",
      film_grain_sharpen: "Grain Sharpen",
      llm_adv_title: "⚙️ LLM Fine-Tuning (1878 / 1879)",
      llm_temperature: "Temperature",
      llm_max_tokens: "Max Tokens",
      llm_thinking_mode: "🧠 Thinking Mode (thinking_mode)",
      llm_unload_img_first: "🧹 Unload image models first (unload_image_models_first)",
      llm_unload_after: "♻️ Unload LLM after (unload_llm_after)",
      llm_system_prompt: "System Prompt (T2I / I2I)",
      llm_system_prompt_ph: "Loaded from workflow...",
      llm_timeout: "Timeout (s)",
      llm_reset_defaults: "↺ Workflow Default",
      llm_user_prompt_i2i: "User Prompt (I2I · Node 1879)",
      save_format: "Save Format",
      save_webp: "WebP (95% Quality - recommended)",
      save_jpg: "JPEG (95% Quality)",
      save_png: "PNG (Lossless)",
      overlay_sig: "✒️ Artist Signature",
      pos_bottom_right: "Bottom right",
      pos_bottom_left: "Bottom left",
      pos_bottom_center: "Bottom center",
      pos_top_right: "Top right",
      pos_top_left: "Top left",
      pos_top_center: "Top center",
      pos_center: "Center",
      pos_center_center: "Center",
      pos_center_left: "Center left",
      pos_center_right: "Center right",
      sig_placeholder: "Signature text...",
      font_label: "Font (Typeface)",
      font_caveat: "Caveat (Handwriting / Signature)",
      font_roboto: "Roboto (Clean & Modern)",
      font_quicksand: "Quicksand (Bold & Rounded)",
      font_young_serif: "Young Serif (Classic)",
      font_oswald: "Oswald (Compact / Bold)",
      font_impact: "Impact (Heavy)",
      font_pixelify: "Pixelify (Retro Pixel)",
      size_label: "Size (px)",
      color_label: "Color",
      color_auto: "Auto (Contrast)",
      color_white: "White",
      color_black: "Black",
      color_red: "Red",
      color_yellow: "Yellow",
      align_label: "Vertical (Align)",
      justify_label: "Horizontal (Justify)",
      offset_x_label: "Offset X (px)",
      offset_y_label: "Offset Y (px)",
      rotation_label: "Rotation (°)",
      margins_label: "Margins (px)",
      align_bottom: "Bottom",
      align_top: "Top",
      align_center: "Center",
      justify_left: "Left",
      justify_center: "Center",
      justify_right: "Right",
      overlay_ai: "🤖 AI Disclaimer",
      ai_disclaimer_placeholder: "AI disclaimer text...",
      badge_overlay_both: "✒️ Sig + AI",
      badge_overlay_ai: "🤖 AI Note",
      badge_overlay_off: "Off",
      overlay_img: "🖼️ Image Signature / Logo",
      btn_overlay_img_upload: "📁 Choose Logo (PNG)",
      btn_overlay_img_clear_title: "Remove logo",
      pos_x_label: "Position X (px)",
      pos_y_label: "Position Y (px)",
      scale_max_label: "Scale (max. 0.50)",
      overlay_img_xy_hint: "0, 0 = Top left",
      btn_overlay_img_br: "↘️ Bottom right",
      btn_overlay_img_preview: "👁️ Preview",

      // Prompt Hub
      card_prompthub: "Prompt Hub",
      lbl_positive_prompt: "Main Image Idea (Positive Prompt)",
      placeholder_positive_prompt: "Describe your image...",
      lbl_additional_prompt: "Additional Prompt / Style Booster",
      badge_quality_style: "Quality & Style",
      placeholder_additional_prompt: "Additional style cues / quality boosters...",
      lbl_neg_prompt: "Negative Prompt",
      badge_exclude: "Exclude",
      placeholder_neg_prompt: "What should be avoided...",
      pix_batch_title: "Batch Size: Number of images generated per run (1 to 64)",
      pix_batch_dec_title: "Decrease batch size",
      pix_batch_inc_title: "Increase batch size",
      pix_custom_ratio: "Custom Ratio",
      pix_custom_res: "Custom Resolution",
      pix_ratio_w: "Ratio W",
      pix_ratio_h: "Ratio H",
      pix_lbl_resolution: "Resolution:",
      pix_swap_ratio_title: "Swap aspect ratio",
      pix_lbl_width: "Width",
      pix_lbl_height: "Height",
      pix_placeholder_custom_w: "e.g. 1024+128",
      pix_placeholder_custom_h: "e.g. 512*2",
      pix_swap_res_title: "Swap width & height",
      pix_save_custom_res: "💾 Save",
      pix_save_custom_res_title: "Save current custom resolution as preset",
      pix_remove_custom_res: "Remove preset",

      // Prompt Controller
      card_prompt_controller: "Prompt Controller",
      lbl_controller_mode: "Controller Mode",
      opt_mode_manual: "Manual Only (Prompt Hub input only)",
      opt_mode_gen: "Generated Only (AI Prompt only)",
      opt_mode_combo_mg: "Combine: Manual + Generated",
      opt_mode_combo_gm: "Combine: Generated + Manual",
      opt_mode_clear: "Clear / Empty (Blank prompt)",
      ctrl_badge_manual: "Manual Only",
      ctrl_badge_gen: "Generated Only",
      ctrl_badge_combo_mg: "Manual + AI",
      ctrl_badge_combo_gm: "AI + Manual",
      ctrl_badge_clear: "Empty",
      lbl_delimiter: "Delimiter",

      // LLM
      card_llm: "LLM (Local / Cloud) – T2I & I2I",
      badge_llm_off: "Off (Manual)",
      badge_llm_t2i: "✨ Text2Prompt (T2I) Active",
      badge_llm_i2i: "🖼️ Image2Prompt (I2I) Active",
      btn_llm_off: "🚫 LLM Off",
      btn_llm_t2i: "✨ Text2Prompt (T2I)",
      btn_llm_i2i: "🖼️ Image2Prompt (I2I)",
      lbl_llm_model: "LLM Model (LM Studio / Ollama / Cloud)",
      badge_llm_ready: "Ready",
      badge_llm_ready_inactive: "Ready (Inactive)",
      badge_llm_text_model: "Text Model",
      badge_llm_vision_model: "Vision Model",
      badge_llm_source_local: "🖥️ Local",
      badge_llm_source_cloud: "☁️ Cloud",
      llm_model_search_placeholder: "🔍 Search model...",
      btn_clear_search_title: "Clear search",
      llm_model_none_found: "No matching models found.",
      badge_llm_checking: "Checking...",
      badge_llm_online: "Online",
      badge_llm_offline: "⚠️ No LLM active!",
      badge_llm_provider_offline: "⚠️ {provider} offline!",
      toast_llm_provider_offline: "The selected LLM provider ({provider}) is offline. Please start the server, choose an available model, or turn LLM off.",
      badge_llm_title_click: "Click to re-check LM Studio / Ollama / Cloud LLM status",
      llm_unavailable_title: "Neither local LLM server (LM Studio / Ollama) nor cloud API key active",
      lbl_i2i_ref: "I2I Reference Image",
      i2i_ref_title: "Node 1880 – Load Image",
      i2i_thumb_title: "Show in main preview",
      alt_reference: "Reference",
      alt_preview: "Preview",
      alt_compare_after: "After (SeedVR2)",
      alt_compare_before: "Before (Original)",
      badge_no_image: "No image chosen",
      badge_uploading: "Uploading...",
      badge_error: "Error",
      i2i_drop_title: "Click or drag reference image here",
      i2i_drop_sub: "PNG, JPG or WEBP for vision model analysis",
      i2i_loaded: "✓ Loaded into ComfyUI (Node 1880)",
      i2i_uploading: "⏳ Uploading to ComfyUI...",
      i2i_upload_failed_status: "✗ Upload failed (not in ComfyUI)",
      toast_i2i_missing_before_gen: "Please upload a valid I2I reference image to ComfyUI first (no image is currently loaded).",
      btn_remove_i2i: "Remove",
      btn_remove_i2i_title: "Remove image",
      lbl_llm_result: "✨ Generated AI Prompt (LLM Output)",
      btn_copy_llm: "📋 Copy",
      btn_copy_llm_title: "Copy AI prompt",
      btn_adopt_llm: "📥 Use as Main Prompt",
      btn_adopt_llm_title: "Transfer to Prompt Hub as main image idea",
      placeholder_llm_result: "The LLM-generated prompt will appear here once ready...",
      llm_generating_prompt: "LLM generating prompt...",
      llm_no_prompt_warning: "⚠️ No prompt received from LLM{reason}.\n\nPlease ensure your LLM server (LM Studio / Ollama) or a cloud API key is active.",

      // Generate & Cancel
      btn_generate: "GENERATE IMAGE",
      btn_generate_sending: "Sending to ComfyUI...",
      btn_generate_computing: "ComfyUI processing...",
      btn_generate_step: "Generating... Step",
      btn_generate_running: "Generating...",
      btn_cancel_generate: "Cancel Generation",
      btn_cancel_generate_title: "Immediately cancel active ComfyUI generation",
      btn_cancel_cancelling: "Cancelling...",

      // Viewer & Gallery Actions
      empty_state_title: "Ready to Generate",
      empty_state_hint: "Choose your model preset, tune your prompts and press \"Generate Image\".",
      btn_download: "📥 Download",
      btn_download_title: "Download image",
      btn_copy_prompt: "📋 Copy Prompt",
      btn_copy_prompt_title: "Copy prompt to clipboard",
      btn_reuse_seed: "🔄 Use Seed",
      btn_reuse_seed_title: "Apply seed to input",
      btn_apply_all: "⚡ Load Parameters",
      btn_apply_all_title: "Load all parameters from this image (prompts, model, sampler, seed, resolution, LoRAs) into Cockpit",
      btn_send_to_videomaker: "🎬 To VideoMaker",
      btn_send_to_videomaker_title: "Send current image to VideoMaker",
      btn_remove_bg: "✂️ Remove BG",
      btn_remove_bg_title: "Remove background from the current image",
      btn_remove_bg_busy: "⏳ Removing BG...",
      btn_generate_removing_bg: "Removing Background...",
      bg_remove_help_title: "Why is this disabled?",
      bg_remove_help_offline: "ComfyUI is currently offline. Start ComfyUI to check if a background remover node is installed.",
      bg_remove_help_no_node: "No background remover node found in ComfyUI. Install e.g. ComfyUI-RMBG or rembg via ComfyUI Manager and restart ComfyUI.",
      bg_remove_success: "Background removed successfully!",
      bg_remove_cancelled: "Background removal cancelled.",
      bg_remove_error: "Background removal failed: ",
      bg_remove_no_image: "No image selected in preview.",
      btn_clear_gallery: "🧹 Clear Gallery",
      btn_clear_gallery_title: "Clear gallery view (files remain safely preserved on disk)",
      btn_refresh_gallery: "🔄 Reload",
      btn_refresh_gallery_title: "Reload images from output directory",
      btn_collapse_gallery: "▼ Collapse Gallery",
      btn_expand_gallery: "▲ Expand Gallery",
      btn_collapse_gallery_title: "Collapse or expand gallery filmstrip",
      btn_expand_gallery_title: "Expand gallery filmstrip",
      btn_open_folder: "📁 Show in Folder",
      btn_open_folder_title: "Show in Windows Explorer",
      btn_fullscreen: "⛶ Fullscreen",
      btn_fullscreen_title: "Fullscreen preview",
      btn_zoom_reset_title: "Reset zoom (double-click)",
      gallery_empty: "No images found in output folder.",
      gallery_no_output_dir: "No output folder configured (see Settings).",
      gallery_cleared: "Gallery view cleared. (All files remain safely preserved on your disk.)",
      gallery_restore_hint: "Reload images",
      delete_btn_title: 'Permanently delete "{filename}" from disk and gallery',
      delete_confirm_prompt: 'Do you really want to permanently delete "{filename}" from disk and gallery?',

      // Modals
      nav_gallery: "🖼️ Gallery",
      settings_title: "⚙️ Settings & Connections",
      settings_sec_general: "🌐 General",
      settings_badge_general: "Interface",
      settings_sec_comfy: "🎨 ComfyUI",
      settings_badge_comfy: "Image Backend & Paths",
      settings_sec_llm: "🧠 TASmartLLM",
      settings_badge_llm: "Prompt AI / LLM",
      settings_sec_video: "🎬 VideoMaker",
      settings_badge_video: "Video Tab",
      settings_video_dir: "Video Output Folder (optional)",
      settings_video_dir_ph: "Default: ComfyUI / Image Output Folder",
      settings_sec_music: "🎵 MusicMaker",
      settings_badge_music: "Music Tab",
      settings_music_dir: "Music Output Folder (optional)",
      settings_music_dir_ph: "Default: ComfyUI Output / App Renders",
      settings_sec_gif: "👾 DiscordGIF",
      settings_badge_gif: "GIF Tab",
      settings_desc: "The GUI automatically detects running ComfyUI instances (e.g. on port 8188). If ComfyUI is running in WSL or another machine, customize the address here.",
      settings_lang: "Language / Sprache",
      btn_theme_title: "Switch theme & accent color",
      theme_base_label: "Background / Theme",
      theme_accent_label: "Accent Color",
      theme_base_midnight: "Midnight",
      theme_base_obsidian: "Obsidian",
      theme_base_charcoal: "Charcoal",
      theme_base_plum: "Plum",
      theme_base_solar_noir: "Solar Noir",
      theme_base_matrix_green: "Neon Green",
      theme_base_pastel_pink: "Pastel Pink",
      theme_base_light: "Light",
      theme_base_midnight_full: "Midnight Blue (Default)",
      theme_base_obsidian_full: "Obsidian Dark (Neutral)",
      theme_base_charcoal_full: "Warm Charcoal",
      theme_base_plum_full: "Plum / Aubergine",
      theme_base_solar_noir_full: "Solar Noir (Dark Gold)",
      theme_base_matrix_green_full: "Neon Green (Cyber)",
      theme_base_pastel_pink_full: "Pastel Pink (Soft Rose)",
      theme_base_light_full: "Studio Light",
      theme_accent_custom: "Custom Color",
      theme_accent_custom_title: "Pick custom accent color",
      theme_popover_aria: "Theme",
      theme_accent_violet: "Studio Violet",
      theme_accent_lavender: "Soft Lavender",
      theme_accent_cyan: "Midnight Cyan",
      theme_accent_emerald: "Darkroom Emerald",
      theme_accent_neon_green: "Neon Green",
      theme_accent_amber: "Solar Amber",
      theme_accent_rose: "Crimson Rose",
      theme_accent_blush_pink: "Blush Pink",
      theme_accent_titanium: "Stealth Titanium",
      theme_custom_slot_1: "Custom Slot 1",
      theme_custom_slot_2: "Custom Slot 2",
      bg_remove_help_aria: "Info",
      custom_res_snap_title: "Snap {snap}",
      theme_reset_btn: "↺ Reset to Default Theme",
      settings_comfy_url: "ComfyUI URL",
      settings_output_dir: "Image Output Folder (Windows Path)",
      settings_lms_url: "LM Studio URL",
      settings_ollama_url: "Ollama URL",
      settings_cloud_keys_title: "☁️ External Cloud LLM API Keys (optional)",
      settings_cloud_keys_hint: "🔒 Keys are stored locally encrypted with Windows DPAPI, never shared in releases, and passed automatically when launching ComfyUI. Restart ComfyUI after changes if needed.",
      settings_cloud_key_set_studio: "Saved ({masked})",
      settings_cloud_key_set_env: "Windows env ({masked})",
      settings_cloud_key_change_hint: "{status} – enter a new key to change",
      btn_clear_key_title: "Remove key",
      settings_launch_cmd: "ComfyUI Launch Command / Script (WSL or Windows .bat)",
      settings_launch_placeholder: "e.g. C:\\ComfyUI\\run_nvidia_gpu.bat",
      settings_launch_hint: "Note: Enter the path to your own Windows .bat (e.g. run_nvidia_gpu.bat) or launch script here – opened when clicking '⚡ Launch ComfyUI'.",
      settings_extra_models_dir: "Extra Models & LoRAs Folder (optional)",
      settings_extra_models_ph: "e.g. D:\\AI\\Models",
      settings_extra_models_hint: "Optional: Folder on another drive (with subfolders like checkpoints, loras, unet, vae). Passed separately via --extra-model-paths-config when clicking '⚡ Launch ComfyUI' without overwriting any existing extra_model_paths.yaml.",
      settings_confirm_close: "Show confirmation dialog when closing Cockpit",
      app_close_modal_title: "Close Cockpit?",
      app_close_modal_desc: "Do you really want to close thomo.ART StudioCockpit?",
      app_close_confirm_btn: "Close",
      card_pc_delimiter_toggle_title: "Toggle Delimiter field",
      plato_key_toggle_title: "Toggle Plato's Key",
      btn_browse: "📁 Browse",
      toast_launch_missing: "Please enter your ComfyUI launch file (e.g. run_nvidia_gpu.bat) first and save.",
      toast_launch_error: "Error launching ComfyUI: ",
      toast_network_error: "Network error: ",
      toast_gen_failed: "Generation error: ",
      comfy_offline_modal_title: "ComfyUI is not running",
      comfy_offline_modal_desc: "ComfyUI must be started before you can generate images. Would you like to start ComfyUI now?",
      comfy_offline_btn_settings: "⚙️ Settings",
      comfy_offline_btn_start: "⚡ Start ComfyUI now",
      app_loading_text: "Loading StudioCockpit...",
      gal_loading_text: "Loading images...",
      btn_compare: "↔️ Compare",
      btn_compare_title: "Before/After comparison (Original vs. SeedVR2)",
      compare_before: "Original",
      compare_after: "SeedVR2",
      settings_test_btn: "Test Connection",
      settings_save_btn: "Save",
      settings_conn_testing: "Testing...",
      settings_conn_ok: "✓ Connected successfully!",
      settings_conn_fail: "✕ Unreachable",

      delete_modal_title: "Delete Image?",
      delete_modal_warning: "This image will be permanently deleted from your hard drive and removed from the gallery.",
      btn_cancel: "Cancel",
      btn_delete: "🗑️ Delete",

      preset_modal_default_title: "Preset Editor",
      preset_modal_title_model: "🧠 TA Model Preset Editor (Create & Manage Presets)",
      preset_modal_title_sampler: "⚡ TA Sampler Preset Editor (Create & Manage Presets)",
      preset_editor_offline_title: "ComfyUI is not running",
      preset_editor_offline_desc: "The Preset Editor is served directly by ComfyUI. Please launch ComfyUI first to create or edit presets.",
      preset_editor_retry: "↻ Retry",
      toast_comfy_offline_preset_editor: "ComfyUI is not running — please launch ComfyUI first.",
      btn_open_external: "↗ Open in Tab",
      btn_open_external_title: "Open in new browser tab",

      drop_title: "Drop Image Here",
      drop_sub: "Reads all prompts, model, sampler, seed, resolution & LoRAs from image metadata",
      drop_sub_i2i: "Drop as reference image for Vision (Image -> Prompt) or load metadata",
      btn_adopt_preview_i2i: "🖼️ Use from Preview",
      btn_adopt_preview_i2i_title: "Use image currently in preview as I2I reference image",
      btn_browse_i2i: "📁 Browse…",
      btn_browse_i2i_title: "Pick reference image via file dialog (remembers last folder)",

      // Toasts & Alerts
      toast_copied: "✓ Copied!",
      toast_adopted: "✓ Applied!",
      toast_loaded: "✓ Loaded!",
      toast_cleared: "✓ Cleared!",
      toast_seed_active: "✓ Seed active!",
      toast_meta_reading: "Reading image metadata...",
      toast_meta_success: 'Image loaded & all parameters applied!',
      toast_meta_success_file: 'Image loaded & all parameters from "{filename}" applied!',
      toast_meta_fail: "Could not read image metadata.",
      toast_meta_no_workflow: 'Image "{filename}" loaded into preview (no ComfyUI metadata).',
      toast_i2i_empty: "The selected image file is empty (0 bytes) and cannot be used.",
      toast_i2i_uploaded: 'I2I reference image "{filename}" loaded & sent to ComfyUI!',
      toast_i2i_upload_fail: "Error uploading to ComfyUI.",
      toast_i2i_adopt_error: "Error adopting image from preview: ",
      toast_logo_uploaded: 'Logo "{filename}" loaded & placed bottom-right!',
      toast_logo_upload_first: "Please upload a logo first.",
      toast_no_preview_image: "No image in preview.",
      toast_no_params: "No parameters found.",
      toast_no_gallery_selection: "No image selected in gallery.",
      toast_drop_invalid: "Please drop an image file (PNG or WebP).",
      toast_image_deleted: 'Image "{filename}" has been deleted.',
      toast_delete_error: "Error deleting: ",
      toast_cancel_request: "Cancelling generation...",
      toast_cancelled: "Generation was cancelled.",
      toast_cancel_error: "Error cancelling: ",
      toast_gen_error: "Error during ComfyUI generation.",
      toast_lora_synced: "LoRAs synchronized ({count} available)",
      toast_lora_sync_error: "Error syncing LoRAs: ",
      toast_lora_auto_deactivated: "{count} incompatible LoRA(s) automatically deactivated for {model}",
      toast_net_error: "Network error: Is the Cockpit server (server.py) running?",
      err_invalid_lora_format: "Invalid LoRA format",
      err_image_load_failed: "Could not load image",
      err_unknown: "Unknown error",
      err_timeout: "Timeout",
      loading_status: "Loading...",
      missing_nodes_title: "Missing ComfyUI Custom Nodes",
      missing_nodes_desc: "Your ComfyUI installation is missing custom node packs required for this workflow. Would you like to install the selected packs automatically now?",
      missing_nodes_dir_label: "ComfyUI Directory (e.g. C:\\ComfyUI_windows_portable)",
      missing_nodes_btn_later: "Later",
      missing_nodes_btn_recheck: "🔄 Re-check",
      missing_nodes_btn_install: "⬇️ Install Now",
      missing_nodes_btn_browse: "📁 Choose Folder",
      install_nodes_installing: "Installing…",
      missing_nodes_install_failed: "Installation failed.",
      missing_nodes_remote_title: "Remote ComfyUI cannot be installed locally",
      missing_nodes_badge_restart: "Restart required",
      missing_nodes_badge_required: "Required",
      missing_nodes_badge_optional: "Optional",
      missing_nodes_missing_prefix: "Missing: ",
      missing_nodes_all_installed: "All required custom nodes are installed!",
      missing_nodes_select_one: "Please select at least one pack.",
      missing_nodes_starting: "Starting installation...",
      missing_nodes_installing_pack: "Installing: {pack}",
      missing_nodes_done_restart: "Completed – please restart ComfyUI!",
      missing_nodes_done_warnings: "Finished with warnings",
      missing_nodes_row_ok: "✓ Installed (Restart ComfyUI)",
      missing_nodes_row_err: "✖ Error",
      missing_nodes_desc_done: "Installation complete! Please restart ComfyUI now so the new custom nodes are loaded.",
      missing_nodes_btn_close: "Close",
      missing_nodes_btn_recheck_restart: "🔄 Check after restart",
      missing_nodes_toast_done: "Custom nodes installed! Please restart ComfyUI.",
      missing_nodes_toast_some_errors: "Some packs had errors.",
      update_modal_title: "Update available",
      update_current_ver: "Current: v{ver}",
      update_new_ver: "New: v{ver}",
      update_question: "A new version is available on GitHub. Would you like to download and install the update now?",
      update_release_notes: "Release Notes",
      update_source_hint_html: "Note: Automatic 1-click installation is only available in the compiled <code>StudioCockpit.exe</code>. You can open the release directly on GitHub.",
      update_downloading: "Downloading update…",
      update_installing: "Installing…",
      update_starting_download: "Starting download…",
      update_btn_later: "Later",
      update_btn_github: "Open on GitHub",
      update_btn_install: "⬇️ Install now",
      toast_update_uptodate: "StudioCockpit is up to date (v{ver}).",
      toast_update_check_failed: "Update check failed.",
      toast_update_offline: "Unable to check for updates (offline?).",
      toast_update_failed: "Update failed.",
      update_start_failed: "Could not start installation.",
      ctx_copy: "📋 Copy",
      ctx_cut: "✂️ Cut",
      ctx_paste: "📥 Paste",
      ctx_select_all: "🔘 Select All",
    }
  };

  let currentLang = "en";
  const selLanguage = document.getElementById("selLanguage");

  function t(key, fallback = "") {
    if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined) {
      return TRANSLATIONS[currentLang][key];
    }
    if (TRANSLATIONS["de"] && TRANSLATIONS["de"][key] !== undefined) {
      return TRANSLATIONS["de"][key];
    }
    return (fallback !== undefined && fallback !== null && fallback !== "") ? fallback : key;
  }

  function applyLanguage(lang, persist = false) {
    if (lang !== "de" && lang !== "en") lang = "en";
    currentLang = lang;
    document.documentElement.lang = currentLang;

    if (persist) {
      try {
        localStorage.setItem("tAStudio.language", currentLang);
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: currentLang })
        }).catch(() => {});
      } catch (e) {}
    }

    if (window.syncMusicMakerFrame) window.syncMusicMakerFrame();

    if (selLanguage && selLanguage.value !== currentLang) {
      selLanguage.value = currentLang;
    }

    // 1. Static i18n text
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const trans = t(key);
      if (trans && trans !== key) {
        if (el.children.length === 0) {
          el.textContent = trans;
        } else {
          el.innerHTML = trans;
        }
      }
    });

    // 1b. Static i18n HTML (e.g. inline card help boxes)
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const key = el.getAttribute("data-i18n-html");
      const trans = t(key);
      if (trans && trans !== key) {
        el.innerHTML = trans;
      }
    });

    // 2. Titles (tooltips)
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      const trans = t(key);
      if (trans && trans !== key) el.title = trans;
    });

    // 3. Placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const trans = t(key);
      if (trans && trans !== key) el.placeholder = trans;
    });

    // 3b. Aria-labels & alt texts
    document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria-label");
      const trans = t(key);
      if (trans && trans !== key) el.setAttribute("aria-label", trans);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(el => {
      const key = el.getAttribute("data-i18n-alt");
      const trans = t(key);
      if (trans && trans !== key) el.alt = trans;
    });

    // 4. Update dynamic states
    if (typeof renderCustomAccentSlots === "function") renderCustomAccentSlots();
    if (typeof updateGpuDisplay === "function" && typeof lastGpuState !== "undefined") {
      updateGpuDisplay(lastGpuState);
    }
    if (typeof updateOverlayImgUI === "function") {
      updateOverlayImgUI(typeof currentOverlayImgFilename !== "undefined" ? currentOverlayImgFilename : "");
    }
    updateOverlayStatusBadge();
    updateOverlayPositionBadges();
    if (typeof updateFilenamePreview === "function") updateFilenamePreview();
    if (typeof updateSharpenUI === "function") updateSharpenUI();
    if (typeof updateFilmGrainUI === "function") updateFilmGrainUI();
    if (typeof updateSVEUI === "function") updateSVEUI();
    if (typeof updateSeedVR2UI === "function") updateSeedVR2UI();
    if (typeof updateAttnEngineBadge === "function") updateAttnEngineBadge();
    updatePromptControllerBadge();
    updateFluxGuidanceState();
    updateActiveLorasCount();
    if (typeof filterAndRenderLoras === "function") {
      filterAndRenderLoras();
    }
    if (typeof renderCustomResChips === "function") {
      renderCustomResChips();
    }
    if (typeof applyCloudKeyStatusToInputs === "function" && typeof lastCloudKeyStatus !== "undefined" && lastCloudKeyStatus) {
      applyCloudKeyStatusToInputs(lastCloudKeyStatus, true);
    }
    if (typeof currentI2IImageFilename !== "undefined" && !currentI2IImageFilename && typeof i2iFileNameBadge !== "undefined" && i2iFileNameBadge) {
      i2iFileNameBadge.textContent = t("badge_no_image", "Kein Bild gewählt");
    }
    if (typeof updateBgRemoveUI === "function" && typeof bgRemoveState !== "undefined") {
      updateBgRemoveUI(bgRemoveState);
    }
    if (typeof selModelPreset !== "undefined" && selModelPreset) {
      const emptyModelOpt = selModelPreset.querySelector('option[data-empty="1"]');
      if (emptyModelOpt) emptyModelOpt.textContent = t("models_none_installed", "— Keine installierten Modelle gefunden —");
      if (typeof modelArchBadge !== "undefined" && modelArchBadge && modelArchBadge.dataset.custom === "1") {
        modelArchBadge.textContent = t("badge_custom_model", "Eigenes Modell");
      }
    }
    if (typeof selSamplerPreset !== "undefined" && selSamplerPreset) {
      const emptySamplerOpt = selSamplerPreset.querySelector('option[data-empty="1"]');
      if (emptySamplerOpt) emptySamplerOpt.textContent = t("samplers_none_found", "— Keine passenden Sampler-Presets —");
      if (typeof samplerDetailsBadge !== "undefined" && samplerDetailsBadge && samplerDetailsBadge.dataset.custom === "1") {
        samplerDetailsBadge.textContent = t("badge_custom_sampler", "Eigener Sampler");
      }
    }
    if (typeof llmModelBadge !== "undefined" && llmModelBadge) {
      llmModelBadge.title = t("badge_llm_title_click", "Klicken, um Status von LM Studio / Ollama / Cloud-LLMs neu zu prüfen");
    }
    if (typeof missingNodesModal !== "undefined" && missingNodesModal && missingNodesModal.style.display === "flex" && typeof lastMissingPacks !== "undefined" && lastMissingPacks) {
      if (typeof renderMissingPacks === "function") {
        renderMissingPacks(lastMissingPacks, lastMissingNodesPaths || {});
      }
    }
    if (filmstripGallery) {
      updateGalleryToggleUI(filmstripGallery.classList.contains("collapsed"));
      const emptyStateBox = filmstripGallery.querySelector("[data-empty-state]");
      if (emptyStateBox) {
        const stType = emptyStateBox.getAttribute("data-empty-state");
        const sp = emptyStateBox.querySelector("span");
        if (stType === "cleared") {
          if (sp) sp.textContent = `🧹 ${t("gallery_cleared", "Galerieansicht geleert. (Alle Dateien bleiben sicher auf deiner Festplatte erhalten.)")}`;
          const restoreBtn = emptyStateBox.querySelector("#btnRestoreGalleryHint");
          if (restoreBtn) restoreBtn.textContent = `🔄 ${t("gallery_restore_hint", "Bilder neu laden")}`;
        } else if (stType === "no_output_dir") {
          if (sp) sp.textContent = t("gallery_no_output_dir", "Kein Ausgabeordner konfiguriert (siehe Einstellungen).");
        } else if (stType === "empty") {
          if (sp) sp.textContent = t("gallery_empty", "Keine Bilder im Ausgabeordner vorhanden.");
        }
      }
      filmstripGallery.querySelectorAll(".filmstrip-item .filmstrip-del-btn").forEach(delBtn => {
        const fn = delBtn.dataset.filename || "";
        if (fn) {
          delBtn.title = t("delete_btn_title", '"{filename}" von Festplatte & Galerie löschen').replace("{filename}", fn);
        }
      });
    }
    if (typeof updateLLMModeUI === "function") {
      updateLLMModeUI(currentLLMMode);
    }
    checkComfyStatus();
    checkLLMStatus();

    window.dispatchEvent(new CustomEvent("studio-language-changed", { detail: { lang: currentLang } }));
  }

  if (selLanguage) {
    selLanguage.addEventListener("change", (e) => {
      applyLanguage(e.target.value, true);
    });
  }

  // Theme Switcher (Base Stage Theme + Accent Color)
  const VALID_BASE_THEMES = new Set(["midnight", "obsidian", "charcoal", "plum", "solar_noir", "matrix_green", "pastel_pink", "studio_light"]);
  const VALID_ACCENTS = new Set(["violet", "lavender", "cyan", "emerald", "neon_green", "amber", "rose", "blush_pink", "titanium", "custom"]);
  const THEME_DEFAULT_ACCENTS = {
    midnight: "violet",
    obsidian: "cyan",
    charcoal: "amber",
    plum: "lavender",
    solar_noir: "amber",
    matrix_green: "neon_green",
    pastel_pink: "blush_pink",
    studio_light: "violet",
  };
  let currentThemeBase = "midnight";
  let currentThemeAccent = "violet";
  let currentCustomAccent = "#8b5cf6";
  let customAccentSlots = [null, null];

  const themePickerWrap = document.getElementById("themePickerWrap");
  const btnThemePicker = document.getElementById("btnThemePicker");
  const themePopover = document.getElementById("themePopover");
  const selThemeBase = document.getElementById("selThemeBase");
  const selThemeAccent = document.getElementById("selThemeAccent");
  const themeAccentCustomWrap = document.getElementById("themeAccentCustomWrap");
  const inpThemeCustomAccent = document.getElementById("inpThemeCustomAccent");
  const customSlotBtns = [
    document.getElementById("btnCustomSlot0"),
    document.getElementById("btnCustomSlot1"),
  ];

  function renderCustomAccentSlots() {
    customSlotBtns.forEach((btn, idx) => {
      if (!btn) return;
      const col = customAccentSlots[idx];
      if (col && /^#[0-9a-fA-F]{6}$/.test(col)) {
        btn.classList.add("has-color");
        btn.style.background = col;
        btn.textContent = String(idx + 1);
        btn.classList.toggle("active", currentThemeAccent === "custom" && currentCustomAccent.toLowerCase() === col.toLowerCase());
        btn.title = t("custom_slot_filled_title", `Custom Slot ${idx + 1} (${col}) – Linksklick: Anwenden · Rechtsklick: Leeren`)
          .replace("{slot}", String(idx + 1))
          .replace("{color}", col);
      } else {
        btn.classList.remove("has-color", "active");
        btn.style.background = "";
        btn.textContent = String(idx + 1);
        btn.title = t("custom_slot_empty_title", `Custom Slot ${idx + 1} (leer) – Klick speichert aktuelle Akzentfarbe`)
          .replace("{slot}", String(idx + 1));
      }
    });
  }

  function saveCustomAccentSlots(persist = true) {
    renderCustomAccentSlots();
    if (!persist) return;
    try {
      localStorage.setItem("tAStudio.themeCustomSlots", JSON.stringify(customAccentSlots));
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_custom_slots: customAccentSlots })
      }).catch(() => {});
    } catch (e) {}
  }

  function getActiveAccentHex() {
    if (currentThemeAccent === "custom") return normalizeHexColor(currentCustomAccent);
    const cs = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return /^#[0-9a-fA-F]{6}$/.test(cs) ? cs.toLowerCase() : "#8b5cf6";
  }

  function normalizeHexColor(hex) {
    return /^#[0-9a-fA-F]{6}$/.test(hex || "") ? hex.toLowerCase() : "#8b5cf6";
  }

  function applyCustomAccentVars(hex) {
    const clean = normalizeHexColor(hex);
    const r = parseInt(clean.slice(1, 3), 16);
    const g = parseInt(clean.slice(3, 5), 16);
    const b = parseInt(clean.slice(5, 7), 16);
    const br = Math.min(255, Math.round(r + (255 - r) * 0.45));
    const bg = Math.min(255, Math.round(g + (255 - g) * 0.45));
    const bb = Math.min(255, Math.round(b + (255 - b) * 0.45));
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent", clean);
    rootStyle.setProperty("--accent-bright", `rgb(${br}, ${bg}, ${bb})`);
    rootStyle.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
  }

  function clearCustomAccentVars() {
    const rootStyle = document.documentElement.style;
    rootStyle.removeProperty("--accent");
    rootStyle.removeProperty("--accent-bright");
    rootStyle.removeProperty("--accent-rgb");
  }

  function applyTheme(base, accent, persist = false, customHex = null) {
    const safeBase = VALID_BASE_THEMES.has(base) ? base : "midnight";
    const safeAccent = VALID_ACCENTS.has(accent) ? accent : "violet";
    if (customHex) currentCustomAccent = normalizeHexColor(customHex);
    currentThemeBase = safeBase;
    currentThemeAccent = safeAccent;

    document.documentElement.setAttribute("data-theme", safeBase);
    document.documentElement.setAttribute("data-accent", safeAccent);
    if (safeAccent === "custom") {
      applyCustomAccentVars(currentCustomAccent);
    } else {
      clearCustomAccentVars();
    }

    if (selThemeBase && selThemeBase.value !== safeBase) selThemeBase.value = safeBase;
    if (selThemeAccent && selThemeAccent.value !== safeAccent) selThemeAccent.value = safeAccent;
    if (inpThemeCustomAccent && inpThemeCustomAccent.value !== currentCustomAccent) {
      inpThemeCustomAccent.value = currentCustomAccent;
    }

    document.querySelectorAll("#themeBaseGrid [data-theme-base]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-theme-base") === safeBase);
    });
    document.querySelectorAll("#themeAccentRow [data-theme-accent]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-theme-accent") === safeAccent);
    });
    if (themeAccentCustomWrap) {
      themeAccentCustomWrap.classList.toggle("active", safeAccent === "custom");
      if (safeAccent === "custom") {
        themeAccentCustomWrap.style.background = currentCustomAccent;
      } else {
        themeAccentCustomWrap.style.background = "";
      }
    }
    renderCustomAccentSlots();

    if (persist) {
      try {
        localStorage.setItem("tAStudio.themeBase", safeBase);
        localStorage.setItem("tAStudio.themeAccent", safeAccent);
        localStorage.setItem("tAStudio.themeCustomAccent", currentCustomAccent);
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme_base: safeBase,
            theme_accent: safeAccent,
            theme_custom_accent: currentCustomAccent
          })
        }).catch(() => {});
      } catch (e) {}
    }
    if (window.syncMusicMakerFrame) window.syncMusicMakerFrame();
  }

  // Initialize theme immediately from localStorage
  try {
    const lsSlots = JSON.parse(localStorage.getItem("tAStudio.themeCustomSlots") || "[]");
    if (Array.isArray(lsSlots)) {
      customAccentSlots = [
        /^#[0-9a-fA-F]{6}$/.test(lsSlots[0] || "") ? lsSlots[0].toLowerCase() : null,
        /^#[0-9a-fA-F]{6}$/.test(lsSlots[1] || "") ? lsSlots[1].toLowerCase() : null,
      ];
    }
    const lsBase = localStorage.getItem("tAStudio.themeBase") || "midnight";
    const lsAccent = localStorage.getItem("tAStudio.themeAccent") || "violet";
    const lsCustom = localStorage.getItem("tAStudio.themeCustomAccent") || "#8b5cf6";
    applyTheme(lsBase, lsAccent, false, lsCustom);
  } catch (e) {
    applyTheme("midnight", "violet", false);
  }

  if (btnThemePicker && themePopover && themePickerWrap) {
    btnThemePicker.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = themePopover.hasAttribute("hidden");
      if (willOpen) {
        themePopover.removeAttribute("hidden");
        btnThemePicker.setAttribute("aria-expanded", "true");
      } else {
        themePopover.setAttribute("hidden", "");
        btnThemePicker.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (e) => {
      if (!themePopover.hasAttribute("hidden") && !themePickerWrap.contains(e.target)) {
        themePopover.setAttribute("hidden", "");
        btnThemePicker.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !themePopover.hasAttribute("hidden")) {
        themePopover.setAttribute("hidden", "");
        btnThemePicker.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("#themeBaseGrid [data-theme-base]").forEach(btn => {
    btn.addEventListener("click", () => {
      const base = btn.getAttribute("data-theme-base");
      const pairedAccent = THEME_DEFAULT_ACCENTS[base] || currentThemeAccent;
      applyTheme(base, pairedAccent, true);
    });
  });
  document.querySelectorAll("#themeAccentRow [data-theme-accent]").forEach(btn => {
    btn.addEventListener("click", () => {
      applyTheme(currentThemeBase, btn.getAttribute("data-theme-accent"), true);
    });
  });
  if (selThemeBase) {
    selThemeBase.addEventListener("change", (e) => {
      const base = e.target.value;
      const pairedAccent = THEME_DEFAULT_ACCENTS[base] || currentThemeAccent;
      applyTheme(base, pairedAccent, true);
    });
  }
  if (selThemeAccent) {
    selThemeAccent.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "custom" && inpThemeCustomAccent) {
        applyTheme(currentThemeBase, "custom", true, inpThemeCustomAccent.value);
      } else {
        applyTheme(currentThemeBase, val, true);
      }
    });
  }
  if (inpThemeCustomAccent) {
    inpThemeCustomAccent.addEventListener("input", (e) => {
      applyTheme(currentThemeBase, "custom", false, e.target.value);
    });
    inpThemeCustomAccent.addEventListener("change", (e) => {
      applyTheme(currentThemeBase, "custom", true, e.target.value);
    });
  }
  customSlotBtns.forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const saved = customAccentSlots[idx];
      if (saved) {
        applyTheme(currentThemeBase, "custom", true, saved);
      } else {
        customAccentSlots[idx] = getActiveAccentHex();
        saveCustomAccentSlots(true);
      }
    });
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (customAccentSlots[idx]) {
        customAccentSlots[idx] = null;
        saveCustomAccentSlots(true);
      }
    });
  });
  const btnThemeReset = document.getElementById("btnThemeReset");
  if (btnThemeReset) {
    btnThemeReset.addEventListener("click", () => {
      applyTheme("midnight", "violet", true);
    });
  }

  // Elements
  const hwBadgeWrap = document.getElementById("hwBadgeWrap");
  const hwBadge = document.getElementById("hwBadge");
  const hwPopover = document.getElementById("hwPopover");
  const hwPopoverTitle = document.getElementById("hwPopoverTitle");
  const hwPopoverMeta = document.getElementById("hwPopoverMeta");
  const gpuText = document.getElementById("gpuText");
  let lastGpuState = null;
  let lastHwMonitor = null;
  let peakVramPct = 0;
  let peakVramGb = 0;
  let hwMonitorTimer = null;
  let freeVramBusy = false;

  function parseGpuInfo(rawGpu) {
    const raw = String(rawGpu || "").trim();
    if (!raw) return { shortName: "", device: "", allocator: "" };

    let rest = raw;
    let device = "";
    let allocator = "";

    const prefixMatch = rest.match(/^((?:cuda|cpu|mps|xpu|directml|rocm)(?::\d+)?)\s+(.+)$/i);
    if (prefixMatch) {
      device = prefixMatch[1];
      rest = prefixMatch[2].trim();
    }

    const suffixMatch = rest.match(/^(.+?)\s*:\s*([^:]+)$/);
    if (suffixMatch) {
      rest = suffixMatch[1].trim();
      allocator = suffixMatch[2].trim();
    }

    return {
      shortName: rest || raw,
      device,
      allocator,
    };
  }

  function addHwMetaRow(container, label, value) {
    const row = document.createElement("div");
    row.className = "hw-popover-row";
    const lbl = document.createElement("span");
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "hw-popover-val";
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    container.appendChild(row);
  }

  function buildHwBarBlock(label, usedGb, totalGb, pct, opts = {}) {
    const block = document.createElement("div");
    block.className = "hw-bar-block";

    const head = document.createElement("div");
    head.className = "hw-bar-head";
    const lbl = document.createElement("span");
    lbl.textContent = label;
    const val = document.createElement("strong");
    val.textContent = `${usedGb.toFixed(1)} / ${totalGb.toFixed(1)} GB (${Math.round(pct)}%)`;
    head.appendChild(lbl);
    head.appendChild(val);
    block.appendChild(head);

    const track = document.createElement("div");
    track.className = "hw-bar-track";
    const fill = document.createElement("div");
    fill.className = "hw-bar-fill" + (opts.isRam ? " is-ram" : (pct >= 90 ? " is-high" : (pct >= 75 ? " is-warn" : "")));
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    track.appendChild(fill);

    if (opts.peakPct && opts.peakPct > 0) {
      const peak = document.createElement("div");
      peak.className = "hw-bar-peak";
      peak.style.left = `calc(${Math.max(0, Math.min(100, opts.peakPct))}% - 1px)`;
      track.appendChild(peak);
    }
    block.appendChild(track);

    if (opts.subLeft || opts.subRight) {
      const sub = document.createElement("div");
      sub.className = "hw-bar-sub";
      const sl = document.createElement("span");
      sl.textContent = opts.subLeft || "";
      const sr = document.createElement("span");
      sr.textContent = opts.subRight || "";
      sub.appendChild(sl);
      sub.appendChild(sr);
      block.appendChild(sub);
    }
    return block;
  }

  function addHwStatPill(grid, label, value) {
    const pill = document.createElement("div");
    pill.className = "hw-stat-pill";
    const l = document.createElement("span");
    l.textContent = label;
    const v = document.createElement("span");
    v.textContent = value;
    pill.appendChild(l);
    pill.appendChild(v);
    grid.appendChild(pill);
  }

  async function triggerFreeVram(btn) {
    if (freeVramBusy) return;
    freeVramBusy = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("btn_free_vram_busy", "⏳ Gebe VRAM frei…");
    }
    try {
      const resp = await fetch("/api/free_vram", { method: "POST" });
      if (resp.ok) {
        const mon = await resp.json();
        lastHwMonitor = mon;
        if (lastGpuState) {
          lastGpuState = {
            ...lastGpuState,
            online: mon.online,
            vramFree: mon.vram_free_gb != null ? mon.vram_free_gb.toFixed(1) : lastGpuState.vramFree,
          };
          updateGpuDisplay(lastGpuState);
        }
        if (btn) {
          btn.textContent = t("btn_free_vram_done", "✓ VRAM freigegeben");
          setTimeout(() => {
            if (btn.isConnected) btn.textContent = t("btn_free_vram", "🧹 Free VRAM");
          }, 1500);
        }
      }
    } catch (e) {}
    finally {
      freeVramBusy = false;
      if (btn && btn.isConnected) btn.disabled = false;
    }
  }

  function updateGpuDisplay(state) {
    lastGpuState = state;
    if (!gpuText) return;

    const freeSuffix = t("gpu_free_suffix", "frei");
    const mon = lastHwMonitor;

    if (mon && mon.vram_pct != null && mon.vram_used_gb != null) {
      if (mon.vram_pct > peakVramPct) peakVramPct = mon.vram_pct;
      if (mon.vram_used_gb > peakVramGb) peakVramGb = mon.vram_used_gb;
    }

    if (hwPopoverMeta) hwPopoverMeta.innerHTML = "";

    if (!state || !state.online) {
      gpuText.textContent = t("gpu_offline", "GPU: —");
      if (hwPopoverTitle) hwPopoverTitle.textContent = t("gpu_offline", "GPU: —");
      if (hwPopoverMeta) {
        const msg = document.createElement("div");
        msg.textContent = t("gpu_offline_detail", "ComfyUI ist nicht verbunden.");
        hwPopoverMeta.appendChild(msg);
      }
      return;
    }

    if (state.gpu) {
      const vramVal = (mon && mon.vram_free_gb != null) ? mon.vram_free_gb.toFixed(1) : (state.vramFree || "16");
      const tempSuffix = (mon && mon.gpu_temp != null) ? ` · ${Math.round(mon.gpu_temp)}°C` : "";
      gpuText.textContent = `${vramVal} GB ${freeSuffix}${tempSuffix}`;
      const parsed = parseGpuInfo(state.gpu);
      if (hwPopoverTitle) hwPopoverTitle.textContent = parsed.shortName;
      if (hwPopoverMeta) {
        if (mon && mon.vram_total_gb != null && mon.vram_used_gb != null && mon.vram_pct != null) {
          const freeSub = `${mon.vram_free_gb != null ? mon.vram_free_gb.toFixed(1) : vramVal} GB ${freeSuffix}`;
          const peakSub = peakVramGb > 0 ? `${t("gpu_peak_label", "Peak")}: ${peakVramGb.toFixed(1)} GB` : "";
          hwPopoverMeta.appendChild(
            buildHwBarBlock("VRAM", mon.vram_used_gb, mon.vram_total_gb, mon.vram_pct, {
              peakPct: peakVramPct,
              subLeft: freeSub,
              subRight: peakSub,
            })
          );
        } else {
          addHwMetaRow(hwPopoverMeta, t("gpu_vram_label", "VRAM frei"), `${vramVal} GB ${freeSuffix}`);
        }

        if (mon && mon.ram_total_gb != null && mon.ram_used_gb != null && mon.ram_pct != null) {
          hwPopoverMeta.appendChild(
            buildHwBarBlock(t("gpu_ram_label", "System-RAM"), mon.ram_used_gb, mon.ram_total_gb, mon.ram_pct, {
              isRam: true,
            })
          );
        }

        if (mon && (mon.gpu_util != null || mon.cpu_util != null || mon.gpu_temp != null || mon.gpu_power_w != null)) {
          const grid = document.createElement("div");
          grid.className = "hw-stats-grid";
          if (mon.gpu_util != null) addHwStatPill(grid, t("gpu_load_label", "GPU"), `${Math.round(mon.gpu_util)}%`);
          if (mon.cpu_util != null) addHwStatPill(grid, t("cpu_load_label", "CPU"), `${Math.round(mon.cpu_util)}%`);
          if (mon.gpu_temp != null) addHwStatPill(grid, t("gpu_temp_label", "Temp"), `${Math.round(mon.gpu_temp)} °C`);
          if (mon.gpu_power_w != null) {
            const pLim = mon.gpu_power_limit_w != null ? `/${Math.round(mon.gpu_power_limit_w)}` : "";
            addHwStatPill(grid, t("gpu_power_label", "Power"), `${Math.round(mon.gpu_power_w)}${pLim} W`);
          }
          hwPopoverMeta.appendChild(grid);
        }

        if (parsed.device) {
          addHwMetaRow(hwPopoverMeta, t("gpu_device_label", "Device"), parsed.device);
        }
        if (parsed.allocator) {
          addHwMetaRow(hwPopoverMeta, t("gpu_allocator_label", "Allocator"), parsed.allocator);
        }

        const actions = document.createElement("div");
        actions.className = "hw-popover-actions";
        const freeBtn = document.createElement("button");
        freeBtn.type = "button";
        freeBtn.className = "hw-free-btn";
        freeBtn.disabled = freeVramBusy;
        freeBtn.textContent = freeVramBusy ? t("btn_free_vram_busy", "⏳ Gebe VRAM frei…") : t("btn_free_vram", "🧹 Free VRAM");
        freeBtn.addEventListener("click", () => triggerFreeVram(freeBtn));
        actions.appendChild(freeBtn);

        if (peakVramGb > 0) {
          const resetBtn = document.createElement("button");
          resetBtn.type = "button";
          resetBtn.className = "hw-peak-reset";
          resetBtn.title = t("btn_reset_peak_title", "VRAM-Peak zurücksetzen");
          resetBtn.textContent = t("btn_reset_peak", "↺ Peak");
          resetBtn.addEventListener("click", () => {
            peakVramPct = mon && mon.vram_pct != null ? mon.vram_pct : 0;
            peakVramGb = mon && mon.vram_used_gb != null ? mon.vram_used_gb : 0;
            updateGpuDisplay(lastGpuState);
          });
          actions.appendChild(resetBtn);
        }
        hwPopoverMeta.appendChild(actions);
      }
    } else {
      gpuText.textContent = t("gpu_connected", "GPU");
      if (hwPopoverTitle) hwPopoverTitle.textContent = t("gpu_connected", "GPU");
    }
  }

  async function fetchHwMonitor() {
    try {
      const resp = await fetch("/api/hw_monitor");
      if (!resp.ok) return;
      const mon = await resp.json();
      lastHwMonitor = mon;
      if (mon.online) {
        updateGpuDisplay({
          online: true,
          gpu: mon.gpu || (lastGpuState && lastGpuState.gpu) || "NVIDIA GPU",
          vramFree: mon.vram_free_gb != null ? mon.vram_free_gb.toFixed(1) : (lastGpuState && lastGpuState.vramFree),
        });
      }
    } catch (e) {}
  }

  function syncHwMonitorPolling() {
    const shouldPoll = (hwPopover && !hwPopover.hidden) || (typeof isGenerating !== "undefined" && isGenerating);
    if (shouldPoll && !hwMonitorTimer) {
      fetchHwMonitor();
      hwMonitorTimer = setInterval(fetchHwMonitor, 2000);
    } else if (!shouldPoll && hwMonitorTimer) {
      clearInterval(hwMonitorTimer);
      hwMonitorTimer = null;
    }
  }

  function setHwPopoverOpen(isOpen) {
    if (!hwBadgeWrap || !hwBadge || !hwPopover) return;
    hwBadgeWrap.classList.toggle("is-open", isOpen);
    hwBadge.setAttribute("aria-expanded", isOpen ? "true" : "false");
    hwPopover.hidden = !isOpen;
    syncHwMonitorPolling();
  }

  if (hwBadge && hwPopover) {
    hwBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      setHwPopoverOpen(hwPopover.hidden);
    });
    hwPopover.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    document.addEventListener("click", () => {
      if (!hwPopover.hidden) setHwPopoverOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !hwPopover.hidden) setHwPopoverOpen(false);
    });
  }

  if (selLanguage) {
    selLanguage.addEventListener("change", () => {
      if (lastGpuState) updateGpuDisplay(lastGpuState);
    });
  }

  // Resizable Setup & Prompt Columns (Image Module)
  (function initColumnResizers() {
    const layoutEl = document.getElementById("moduleImageView");
    const colSetup = document.getElementById("colSetup");
    const colPrompt = document.getElementById("colPrompt");
    const resizerSetup = document.getElementById("resizerSetup");
    const resizerPrompt = document.getElementById("resizerPrompt");
    if (!layoutEl || !colSetup || !colPrompt || !resizerSetup || !resizerPrompt) return;

    const COL_CONFIG = {
      setup: {
        el: colSetup,
        resizer: resizerSetup,
        otherEl: colPrompt,
        storageKey: "ta_col_setup_width",
        defaultWidth: 380,
        minWidth: 280,
        maxWidth: 620,
      },
      prompt: {
        el: colPrompt,
        resizer: resizerPrompt,
        otherEl: colSetup,
        storageKey: "ta_col_prompt_width",
        defaultWidth: 500,
        minWidth: 360,
        maxWidth: 780,
      },
    };
    const MIN_VIEWER_WIDTH = 300;
    const RESIZERS_TOTAL_WIDTH = 12;

    function getDynamicMax(cfg) {
      const containerW = layoutEl.clientWidth || window.innerWidth;
      const otherW = cfg.otherEl.getBoundingClientRect().width || 0;
      const available = containerW - otherW - MIN_VIEWER_WIDTH - RESIZERS_TOTAL_WIDTH;
      return Math.max(cfg.minWidth, Math.min(cfg.maxWidth, Math.floor(available)));
    }

    function applyColWidth(cfg, rawWidth, persist) {
      if (window.innerWidth <= 1100) return;
      const maxAllowed = getDynamicMax(cfg);
      const clamped = Math.max(cfg.minWidth, Math.min(maxAllowed, Math.round(rawWidth)));
      cfg.el.style.width = `${clamped}px`;
      if (persist) {
        try { localStorage.setItem(cfg.storageKey, String(clamped)); } catch (e) {}
      }
    }

    function restoreColWidths() {
      if (window.innerWidth <= 1100) {
        colSetup.style.width = "";
        colPrompt.style.width = "";
        return;
      }
      ["setup", "prompt"].forEach((key) => {
        const cfg = COL_CONFIG[key];
        let saved = null;
        try { saved = Number(localStorage.getItem(cfg.storageKey)); } catch (e) {}
        if (saved && Number.isFinite(saved)) {
          applyColWidth(cfg, saved, false);
        }
      });
    }

    function bindResizer(key) {
      const cfg = COL_CONFIG[key];
      let dragging = false;
      let startX = 0;
      let startWidth = 0;

      cfg.resizer.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || window.innerWidth <= 1100) return;
        e.preventDefault();
        dragging = true;
        startX = e.clientX;
        startWidth = cfg.el.getBoundingClientRect().width;
        cfg.resizer.classList.add("is-dragging");
        document.body.classList.add("is-resizing-cols");
      });

      window.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const delta = e.clientX - startX;
        applyColWidth(cfg, startWidth + delta, false);
      });

      function stopDrag() {
        if (!dragging) return;
        dragging = false;
        cfg.resizer.classList.remove("is-dragging");
        document.body.classList.remove("is-resizing-cols");
        const finalWidth = Math.round(cfg.el.getBoundingClientRect().width);
        try { localStorage.setItem(cfg.storageKey, String(finalWidth)); } catch (e) {}
      }

      window.addEventListener("pointerup", stopDrag);
      window.addEventListener("pointercancel", stopDrag);

      cfg.resizer.addEventListener("dblclick", () => {
        if (window.innerWidth <= 1100) return;
        try { localStorage.removeItem(cfg.storageKey); } catch (e) {}
        applyColWidth(cfg, cfg.defaultWidth, false);
      });
    }

    bindResizer("setup");
    bindResizer("prompt");
    restoreColWidths();
    window.addEventListener("resize", restoreColWidths);
  })();
  const brandVersion = document.getElementById("brandVersion");
  const brandWf = document.getElementById("brandWf");

  const selModelPreset = document.getElementById("selModelPreset");
  const modelQuickPills = document.getElementById("modelQuickPills");
  const modelArchBadge = document.getElementById("modelArchBadge");
  const selPlatoKey = document.getElementById("selPlatoKey");
  const platoKeyBadge = document.getElementById("platoKeyBadge");
  const btnInstallPlatoNodes = document.getElementById("btnInstallPlatoNodes");
  const btnOpenPlatoKeySettings = document.getElementById("btnOpenPlatoKeySettings");
  const settingsPlatoKeysSection = document.getElementById("settingsPlatoKeysSection");
  const platoH3NodeBadge = document.getElementById("platoH3NodeBadge");
  const platoNynxzNodeBadge = document.getElementById("platoNynxzNodeBadge");
  const btnInstallH3Node = document.getElementById("btnInstallH3Node");
  const btnInstallNynxzNode = document.getElementById("btnInstallNynxzNode");
  const selPlatoCatalogKey = document.getElementById("selPlatoCatalogKey");
  const btnDownloadPlatoKey = document.getElementById("btnDownloadPlatoKey");
  const platoDownloadStatus = document.getElementById("platoDownloadStatus");
  const platoRestartBanner = document.getElementById("platoRestartBanner");
  const platoRestartText = document.getElementById("platoRestartText");
  const btnRestartComfyFromPlato = document.getElementById("btnRestartComfyFromPlato");
  const nodesRestartBanner = document.getElementById("nodesRestartBanner");
  const nodesRestartText = document.getElementById("nodesRestartText");
  const btnRestartComfyFromNodes = document.getElementById("btnRestartComfyFromNodes");
  let lastPlatoKeysMeta = { h3_installed: false, nynxz_installed: false, catalog: [], paths: {} };

  const selSamplerPreset = document.getElementById("selSamplerPreset");
  const samplerDetailsBadge = document.getElementById("samplerDetailsBadge");

  const loraContainer = document.getElementById("loraContainer");
  const activeLorasCount = document.getElementById("activeLorasCount");
  const btnOpenLoraManager = document.getElementById("btnOpenLoraManager");
  const btnSyncLoras = document.getElementById("btnSyncLoras");
  const loraFilterPills = document.getElementById("loraFilterPills");
  const loraSearchInput = document.getElementById("loraSearchInput");
  const loraCategorySelect = document.getElementById("loraCategorySelect");
  const btnToggleAllLoras = document.getElementById("btnToggleAllLoras");

  // Pixaroma Resolution Constants & Defaults
  const PIXAROMA_SIZES = {
    "1:1":  [[512,512],[768,768],[1024,1024],[1280,1280],[1328,1328],[1408,1408],[1536,1536],[2048,2048]],
    "16:9": [[832,480],[1280,720],[1344,768],[1536,864],[1600,896],[1664,928],[1792,1008],[1920,1088]],
    "9:16": [[480,832],[720,1280],[768,1344],[864,1536],[896,1600],[928,1664],[1008,1792],[1088,1920]],
    "2:1":  [[512,256],[1024,512],[1280,640],[1536,768],[1600,800],[1792,896],[1920,960],[2048,1024]],
    "3:2":  [[768,512],[1024,680],[1152,768],[1344,896],[1536,1024],[1632,1088],[1728,1152],[1920,1280]],
    "2:3":  [[512,768],[680,1024],[768,1152],[896,1344],[1024,1536],[1088,1632],[1152,1728],[1280,1920]],
    "4:3":  [[512,384],[640,480],[768,576],[1024,768],[1280,960],[1408,1056],[1600,1200],[1920,1440]],
    "3:4":  [[384,512],[480,640],[576,768],[768,1024],[960,1280],[1056,1408],[1200,1600],[1440,1920]],
    "4:5":  [[512,640],[640,800],[768,960],[832,1040],[1024,1280],[1152,1440],[1280,1600],[1536,1920]],
  };

  function getHighestPixaromaSize(ratio) {
    const sizes = PIXAROMA_SIZES[ratio] || [];
    if (!sizes.length) return [1024, 1024];
    return sizes.reduce((best, cur) => ((cur[0] * cur[1]) > (best[0] * best[1]) ? cur : best), sizes[0]);
  }

  const PIXAROMA_DEFAULTS = Object.fromEntries(
    Object.keys(PIXAROMA_SIZES).map((ratio) => [ratio, getHighestPixaromaSize(ratio)])
  );

  // Pixaroma State
  let currentPixMode = "preset"; // "preset", "custom_ratio", "custom_res"
  let currentPixRatio = "16:9";
  let currentPixW = 1920;
  let currentPixH = 1088;
  let currentBatchSize = 1;
  let currentSnap = 16;
  let currentCustomRatioW = 16;
  let currentCustomRatioH = 9;

  // Pixaroma DOM Elements
  const pixResChips = document.getElementById("pixResChips");
  const pixResDropdownWrap = document.getElementById("pixResDropdownWrap");
  const selPixResolution = document.getElementById("selPixResolution");
  const pixCustomRatioPanel = document.getElementById("pixCustomRatioPanel");
  const pixCustomResPanel = document.getElementById("pixCustomResPanel");
  const aspectBadge = document.getElementById("aspectBadge");

  const inpBatchVal = document.getElementById("inpBatchVal");
  const btnBatchDec = document.getElementById("btnBatchDec");
  const btnBatchInc = document.getElementById("btnBatchInc");

  // Custom Ratio Panel Elements
  const inpCustomRatioW = document.getElementById("inpCustomRatioW");
  const inpCustomRatioH = document.getElementById("inpCustomRatioH");
  const btnSwapRatio = document.getElementById("btnSwapRatio");
  const inpRatioDriverW = document.getElementById("inpRatioDriverW");
  const inpRatioDriverH = document.getElementById("inpRatioDriverH");
  const snapBtnsRatio = document.getElementById("snapBtnsRatio");
  const lblRatioReadout = document.getElementById("lblRatioReadout");
  const previewRectRatio = document.getElementById("previewRectRatio");
  const previewLabelRatio = document.getElementById("previewLabelRatio");

  // Custom Res Panel Elements
  const inpCustomResW = document.getElementById("inpCustomResW");
  const inpCustomResH = document.getElementById("inpCustomResH");
  const btnSaveCustomRes = document.getElementById("btnSaveCustomRes");
  const customResChips = document.getElementById("customResChips");
  let savedCustomResolutions = [];
  const btnSwapRes = document.getElementById("btnSwapRes");
  const snapBtnsRes = document.getElementById("snapBtnsRes");
  const lblResReadout = document.getElementById("lblResReadout");
  const previewRectRes = document.getElementById("previewRectRes");
  const previewLabelRes = document.getElementById("previewLabelRes");

  const btnGenerate = document.getElementById("btnGenerate");
  const btnGenerateText = document.getElementById("btnGenerateText");
  const btnProgressFill = document.getElementById("btnProgressFill");
  const btnCancelGenerate = document.getElementById("btnCancelGenerate");

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  const chkSharpen = document.getElementById("chkSharpen");
  const rngSharpen = document.getElementById("rngSharpen");
  const sharpenVal = document.getElementById("sharpenVal");

  // ProPostFilmGrain Elements (Nodes 1980 & 1983)
  const chkFilmGrain = document.getElementById("chkFilmGrain");
  const chkSVE = document.getElementById("chkSVE");
  const sveBadge = document.getElementById("sveBadge");
  const sveOptions = document.getElementById("sveOptions");
  const chkSVEAuto = document.getElementById("chkSVEAuto");
  const inpSVEStrength = document.getElementById("inpSVEStrength");
  const inpSVERandPct = document.getElementById("inpSVERandPct");
  const inpSVESwitchPct = document.getElementById("inpSVESwitchPct");
  const selSVENoiseInsert = document.getElementById("selSVENoiseInsert");
  const selSVEMaskStart = document.getElementById("selSVEMaskStart");
  const inpSVEMaskPct = document.getElementById("inpSVEMaskPct");
  const filmGrainBadge = document.getElementById("filmGrainBadge");
  const filmGrainOptions = document.getElementById("filmGrainOptions");
  const selFilmGrainType = document.getElementById("selFilmGrainType");
  const chkFilmGrainGray = document.getElementById("chkFilmGrainGray");
  const rngFilmGrainPower = document.getElementById("rngFilmGrainPower");
  const valFilmGrainPower = document.getElementById("valFilmGrainPower");
  const rngFilmGrainSat = document.getElementById("rngFilmGrainSat");
  const valFilmGrainSat = document.getElementById("valFilmGrainSat");
  const rngFilmGrainShadows = document.getElementById("rngFilmGrainShadows");
  const valFilmGrainShadows = document.getElementById("valFilmGrainShadows");
  const rngFilmGrainHighs = document.getElementById("rngFilmGrainHighs");
  const valFilmGrainHighs = document.getElementById("valFilmGrainHighs");
  const rngFilmGrainScale = document.getElementById("rngFilmGrainScale");
  const valFilmGrainScale = document.getElementById("valFilmGrainScale");
  const rngFilmGrainGamma = document.getElementById("rngFilmGrainGamma");
  const valFilmGrainGamma = document.getElementById("valFilmGrainGamma");
  const rngFilmGrainSharpen = document.getElementById("rngFilmGrainSharpen");
  const valFilmGrainSharpen = document.getElementById("valFilmGrainSharpen");
  const rngFlux = document.getElementById("rngFluxGuidance");
  const fluxVal = document.getElementById("fluxGuidanceVal");

  // Attention Engine Elements (Node 1912: TASageAttentionToggler)
  const attnEnginePills = document.getElementById("attnEnginePills");
  const sageModeContainer = document.getElementById("sageModeContainer");
  const selSageMode = document.getElementById("selSageMode");
  const chkTorchEnable = document.getElementById("chkTorchEnable");
  const badgeSageAttention = document.getElementById("badgeSageAttention");
  let currentAttnEngine = "kitchen"; // "none", "sage", "kitchen"

  const seedPills = document.getElementById("seedPills");
  const txtSeed = document.getElementById("txtSeed");
  const seedValBadge = document.getElementById("seedValBadge");

  const txtPrompt = document.getElementById("txtPrompt");
  const txtAdditionalPrompt = document.getElementById("txtAdditionalPrompt");
  const txtNegPrompt = document.getElementById("txtNegPrompt");
  const chkSmartLLM = document.getElementById("chkSmartLLM");
  const chkSeedVR2 = document.getElementById("chkSeedVR2");
  const seedVR2Badge = document.getElementById("seedVR2Badge");
  const seedVR2Options = document.getElementById("seedVR2Options");
  const selSeedVR2Model = document.getElementById("selSeedVR2Model");
  const inpSeedVR2Res = document.getElementById("inpSeedVR2Res");
  const inpSeedVR2MaxRes = document.getElementById("inpSeedVR2MaxRes");
  const selSeedVR2ColorCorr = document.getElementById("selSeedVR2ColorCorr");
  const inpSeedVR2Blocks = document.getElementById("inpSeedVR2Blocks");
  const selSeedVR2Attn = document.getElementById("selSeedVR2Attn");
  const inpSeedVR2InNoise = document.getElementById("inpSeedVR2InNoise");
  const inpSeedVR2LatNoise = document.getElementById("inpSeedVR2LatNoise");
  const chkSeedVR2Tiled = document.getElementById("chkSeedVR2Tiled");
  const chkSeedVR2Cache = document.getElementById("chkSeedVR2Cache");
  const selSaveFormat = document.getElementById("selSaveFormat");

  // Export Settings Elements (Tab: Export)
  const chkSaveTxtMain = document.getElementById("chkSaveTxtMain");
  const chkExtraSave = document.getElementById("chkExtraSave");
  const extraSaveOptions = document.getElementById("extraSaveOptions");
  const selExtraSaveFormat = document.getElementById("selExtraSaveFormat");
  const selExtraSaveQuality = document.getElementById("selExtraSaveQuality");
  const inpExtraSaveSubfolder = document.getElementById("inpExtraSaveSubfolder");
  const chkExtraSaveTxt = document.getElementById("chkExtraSaveTxt");
  const inpFnOutputFolder = document.getElementById("inpFnOutputFolder");
  const inpFnSubfolder = document.getElementById("inpFnSubfolder");
  const inpFnPrefix = document.getElementById("inpFnPrefix");
  const inpFnWfVersion = document.getElementById("inpFnWfVersion");
  const inpFnUpscaledSuffix = document.getElementById("inpFnUpscaledSuffix");
  const inpFnDelimiter = document.getElementById("inpFnDelimiter");
  const inpFnDateFormat = document.getElementById("inpFnDateFormat");
  const fnPreviewText = document.getElementById("fnPreviewText");

  // Signatur & Text Overlay Elements
  const chkOverlaySig = document.getElementById("chkOverlaySig");
  const txtOverlaySig = document.getElementById("txtOverlaySig");
  const selOverlaySigFont = document.getElementById("selOverlaySigFont");
  const inpOverlaySigSize = document.getElementById("inpOverlaySigSize");
  const selOverlaySigColor = document.getElementById("selOverlaySigColor");
  const selOverlaySigAlign = document.getElementById("selOverlaySigAlign");
  const selOverlaySigJustify = document.getElementById("selOverlaySigJustify");
  const inpOverlaySigPosX = document.getElementById("inpOverlaySigPosX");
  const inpOverlaySigPosY = document.getElementById("inpOverlaySigPosY");
  const inpOverlaySigRotation = document.getElementById("inpOverlaySigRotation");
  const inpOverlaySigMargins = document.getElementById("inpOverlaySigMargins");
  const badgeOverlaySigPos = document.getElementById("badgeOverlaySigPos");

  const chkOverlayAI = document.getElementById("chkOverlayAI");
  const txtOverlayAI = document.getElementById("txtOverlayAI");
  const selOverlayAIFont = document.getElementById("selOverlayAIFont");
  const inpOverlayAISize = document.getElementById("inpOverlayAISize");
  const selOverlayAIColor = document.getElementById("selOverlayAIColor");
  const selOverlayAIAlign = document.getElementById("selOverlayAIAlign");
  const selOverlayAIJustify = document.getElementById("selOverlayAIJustify");
  const inpOverlayAIPosX = document.getElementById("inpOverlayAIPosX");
  const inpOverlayAIPosY = document.getElementById("inpOverlayAIPosY");
  const inpOverlayAIRotation = document.getElementById("inpOverlayAIRotation");
  const inpOverlayAIMargins = document.getElementById("inpOverlayAIMargins");
  const badgeOverlayAIPos = document.getElementById("badgeOverlayAIPos");

  const chkOverlayImg = document.getElementById("chkOverlayImg");
  const inpOverlayImgFile = document.getElementById("inpOverlayImgFile");
  const btnOverlayImgUpload = document.getElementById("btnOverlayImgUpload");
  const btnOverlayImgClear = document.getElementById("btnOverlayImgClear");
  const imgOverlayThumb = document.getElementById("imgOverlayThumb");
  const badgeOverlayImgFile = document.getElementById("badgeOverlayImgFile");
  const inpOverlayImgPosX = document.getElementById("inpOverlayImgPosX");
  const inpOverlayImgPosY = document.getElementById("inpOverlayImgPosY");
  const inpOverlayImgScale = document.getElementById("inpOverlayImgScale");
  const btnOverlayImgBottomRight = document.getElementById("btnOverlayImgBottomRight");
  const btnOverlayImgPreview = document.getElementById("btnOverlayImgPreview");
  const logoPreviewOverlay = document.getElementById("logoPreviewOverlay");
  const logoPreviewImg = document.getElementById("logoPreviewImg");
  let currentOverlayImgFilename = "";
  let overlayImgPreviewActive = false;

  const overlayStatusBadge = document.getElementById("overlayStatusBadge");

  function getPositionBadgeText(align, justify) {
    const key = `pos_${align}_${justify}`;
    const direct = t(key);
    if (direct && direct !== key) {
      return direct;
    }
    const aText = align === "top" ? (currentLang === "de" ? "Oben" : "Top") :
                  align === "center" ? (currentLang === "de" ? "Mitte" : "Center") :
                  (currentLang === "de" ? "Unten" : "Bottom");
    const jText = justify === "left" ? (currentLang === "de" ? "links" : "left") :
                  justify === "center" ? (currentLang === "de" ? "zentriert" : "center") :
                  (currentLang === "de" ? "rechts" : "right");
    return `${aText} ${jText}`;
  }

  function updateOverlayPositionBadges() {
    if (badgeOverlaySigPos && selOverlaySigAlign && selOverlaySigJustify) {
      const key = `pos_${selOverlaySigAlign.value}_${selOverlaySigJustify.value}`;
      badgeOverlaySigPos.setAttribute("data-i18n", key);
      badgeOverlaySigPos.textContent = getPositionBadgeText(selOverlaySigAlign.value, selOverlaySigJustify.value);
    }
    if (badgeOverlayAIPos && selOverlayAIAlign && selOverlayAIJustify) {
      const key = `pos_${selOverlayAIAlign.value}_${selOverlayAIJustify.value}`;
      badgeOverlayAIPos.setAttribute("data-i18n", key);
      badgeOverlayAIPos.textContent = getPositionBadgeText(selOverlayAIAlign.value, selOverlayAIJustify.value);
    }
  }

  function updateOverlayStatusBadge() {
    if (!overlayStatusBadge) return;
    const sigOn = chkOverlaySig ? chkOverlaySig.checked : false;
    const aiOn = chkOverlayAI ? chkOverlayAI.checked : false;
    const imgOn = (chkOverlayImg ? chkOverlayImg.checked : false) && Boolean(currentOverlayImgFilename);
    const imgSuffix = imgOn ? " + 🖼️" : "";

    if (sigOn && aiOn) {
      overlayStatusBadge.textContent = t("badge_overlay_both", "✒️ Sig + KI") + imgSuffix;
      overlayStatusBadge.style.color = "var(--accent)";
    } else if (sigOn) {
      const txt = (txtOverlaySig && txtOverlaySig.value.trim()) ? txtOverlaySig.value.trim() : t("overlay_sig", "Signatur");
      overlayStatusBadge.textContent = `✒️ ${txt}${imgSuffix}`;
      overlayStatusBadge.style.color = "var(--accent)";
    } else if (aiOn) {
      overlayStatusBadge.textContent = t("badge_overlay_ai", "🤖 KI-Hinweis") + imgSuffix;
      overlayStatusBadge.style.color = "var(--text)";
    } else if (imgOn) {
      overlayStatusBadge.textContent = `🖼️ ${currentOverlayImgFilename}`;
      overlayStatusBadge.style.color = "var(--accent)";
    } else {
      overlayStatusBadge.textContent = t("badge_overlay_off", "Aus");
      overlayStatusBadge.style.color = "var(--mute)";
    }
  }

  function getClampedLogoScale() {
    const raw = inpOverlayImgScale ? parseFloat(inpOverlayImgScale.value) : 0.25;
    if (isNaN(raw)) return 0.25;
    return Math.max(0.05, Math.min(0.50, raw));
  }

  function getLogoNaturalSize() {
    const lw = (imgOverlayThumb && imgOverlayThumb.naturalWidth > 0) ? imgOverlayThumb.naturalWidth : 786;
    const lh = (imgOverlayThumb && imgOverlayThumb.naturalHeight > 0) ? imgOverlayThumb.naturalHeight : 790;
    return { lw, lh };
  }

  function renderLogoPreviewOverlay() {
    if (!logoPreviewOverlay || !logoPreviewImg) return;
    if (!overlayImgPreviewActive || !currentOverlayImgFilename) {
      logoPreviewOverlay.style.display = "none";
      return;
    }
    const vc = document.getElementById("viewerCanvas");
    const mp = document.getElementById("mainPreview");
    if (!vc) return;
    const vcRect = vc.getBoundingClientRect();
    const W = Math.max(64, Number(currentPixW) || 1024);
    const H = Math.max(64, Number(currentPixH) || 1024);

    let boxLeft = 0, boxTop = 0, boxW = vcRect.width, boxH = vcRect.height;
    if (mp && mp.style.display !== "none" && mp.naturalWidth > 0) {
      const mpRect = mp.getBoundingClientRect();
      boxLeft = mpRect.left - vcRect.left;
      boxTop = mpRect.top - vcRect.top;
      boxW = mpRect.width;
      boxH = mpRect.height;
    } else {
      const targetRatio = W / H;
      const vcRatio = vcRect.width / Math.max(1, vcRect.height);
      if (vcRatio > targetRatio) {
        boxH = vcRect.height * 0.92;
        boxW = boxH * targetRatio;
      } else {
        boxW = vcRect.width * 0.92;
        boxH = boxW / targetRatio;
      }
      boxLeft = (vcRect.width - boxW) / 2;
      boxTop = (vcRect.height - boxH) / 2;
    }

    const { lw, lh } = getLogoNaturalSize();
    const s = getClampedLogoScale();
    const sw = lw * s;
    const sh = lh * s;
    const px = Math.max(0, parseInt(inpOverlayImgPosX?.value, 10) || 0);
    const py = Math.max(0, parseInt(inpOverlayImgPosY?.value, 10) || 0);

    logoPreviewOverlay.style.display = "block";
    logoPreviewOverlay.style.left = `${boxLeft}px`;
    logoPreviewOverlay.style.top = `${boxTop}px`;
    logoPreviewOverlay.style.width = `${boxW}px`;
    logoPreviewOverlay.style.height = `${boxH}px`;

    const srcUrl = (imgOverlayThumb && imgOverlayThumb.src) ? imgOverlayThumb.src : `/view?filename=${encodeURIComponent(currentOverlayImgFilename)}&type=input`;
    if (logoPreviewImg.src !== srcUrl) logoPreviewImg.src = srcUrl;
    logoPreviewImg.style.left = `${(px / W) * 100}%`;
    logoPreviewImg.style.top = `${(py / H) * 100}%`;
    logoPreviewImg.style.width = `${(sw / W) * 100}%`;
    logoPreviewImg.style.height = `${(sh / H) * 100}%`;
  }

  function fitOverlayImgBottomRight(autoScale = false) {
    const W = Math.max(64, Number(currentPixW) || 1024);
    const H = Math.max(64, Number(currentPixH) || 1024);
    const { lw, lh } = getLogoNaturalSize();
    let s = getClampedLogoScale();
    if (autoScale) {
      // Fit nicely (~15% of image width) and never exceed 0.50
      s = Math.min(0.50, Math.max(0.08, Math.round(((W * 0.15) / lw) * 100) / 100));
      if (inpOverlayImgScale) inpOverlayImgScale.value = s.toFixed(2);
    } else if (inpOverlayImgScale && parseFloat(inpOverlayImgScale.value) > 0.50) {
      s = 0.50;
      inpOverlayImgScale.value = "0.50";
    }
    const sw = Math.round(lw * s);
    const sh = Math.round(lh * s);
    const margin = Math.max(16, Math.round(Math.min(W, H) * 0.02));
    if (inpOverlayImgPosX) inpOverlayImgPosX.value = Math.max(0, W - sw - margin);
    if (inpOverlayImgPosY) inpOverlayImgPosY.value = Math.max(0, H - sh - margin);
    renderLogoPreviewOverlay();
    saveStateDebounced();
  }

  function updateOverlayImgUI(filename, previewUrl = "") {
    currentOverlayImgFilename = filename || "";
    if (badgeOverlayImgFile) {
      badgeOverlayImgFile.textContent = currentOverlayImgFilename || t("badge_no_image", "Kein Bild");
      badgeOverlayImgFile.title = currentOverlayImgFilename || "";
    }
    if (btnOverlayImgClear) {
      btnOverlayImgClear.style.display = currentOverlayImgFilename ? "inline-flex" : "none";
    }
    if (imgOverlayThumb) {
      if (currentOverlayImgFilename) {
        imgOverlayThumb.src = previewUrl || `/view?filename=${encodeURIComponent(currentOverlayImgFilename)}&type=input`;
        imgOverlayThumb.style.display = "block";
      } else {
        imgOverlayThumb.src = "";
        imgOverlayThumb.style.display = "none";
      }
    }
    if (!currentOverlayImgFilename && overlayImgPreviewActive) {
      overlayImgPreviewActive = false;
      if (btnOverlayImgPreview) btnOverlayImgPreview.classList.remove("active");
    }
    updateOverlayStatusBadge();
    renderLogoPreviewOverlay();
  }

  if (btnOverlayImgUpload && inpOverlayImgFile) {
    btnOverlayImgUpload.addEventListener("click", () => inpOverlayImgFile.click());
    inpOverlayImgFile.addEventListener("change", async () => {
      const file = inpOverlayImgFile.files && inpOverlayImgFile.files[0];
      if (!file) return;
      const localUrl = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("overwrite", "true");
      try {
        const resp = await fetch("/upload/image", { method: "POST", body: formData });
        if (resp.ok) {
          const data = await resp.json();
          const uploadedName = data.name;
          if (chkOverlayImg) chkOverlayImg.checked = true;
          updateOverlayImgUI(uploadedName, localUrl);
          // Wait briefly for thumbnail naturalWidth/Height so bottom-right coords are exact
          if (imgOverlayThumb) {
            imgOverlayThumb.onload = () => {
              fitOverlayImgBottomRight(true);
              imgOverlayThumb.onload = null;
            };
          }
          fitOverlayImgBottomRight(true);
          saveState();
          showToast(t("toast_logo_uploaded", 'Logo "{filename}" geladen & unten rechts eingepasst!').replace("{filename}", uploadedName), "success", 3000);
        } else {
          showToast(t("toast_i2i_upload_fail", "Fehler beim Hochladen nach ComfyUI (ist ComfyUI online?)"), "error", 4500);
        }
      } catch (e) {
        console.error("Overlay logo upload failed:", e);
        showToast(t("toast_i2i_upload_fail", "Verbindungsfehler beim Hochladen nach ComfyUI."), "error", 4500);
      }
    });
  }

  if (btnOverlayImgClear) {
    btnOverlayImgClear.addEventListener("click", () => {
      if (inpOverlayImgFile) inpOverlayImgFile.value = "";
      if (chkOverlayImg) chkOverlayImg.checked = false;
      updateOverlayImgUI("");
      saveState();
    });
  }

  if (btnOverlayImgBottomRight) {
    btnOverlayImgBottomRight.addEventListener("click", () => {
      fitOverlayImgBottomRight(false);
    });
  }

  if (btnOverlayImgPreview) {
    btnOverlayImgPreview.addEventListener("click", () => {
      if (!currentOverlayImgFilename) {
        showToast(t("toast_logo_upload_first", "Bitte zuerst ein Logo hochladen."), "info", 2500);
        return;
      }
      overlayImgPreviewActive = !overlayImgPreviewActive;
      btnOverlayImgPreview.classList.toggle("active", overlayImgPreviewActive);
      btnOverlayImgPreview.style.borderColor = overlayImgPreviewActive ? "var(--accent)" : "";
      btnOverlayImgPreview.style.color = overlayImgPreviewActive ? "var(--accent)" : "";
      renderLogoPreviewOverlay();
    });
  }

  // Dragging the logo inside the live preview updates X/Y live
  if (logoPreviewImg) {
    let dragState = null;
    logoPreviewImg.addEventListener("mousedown", (e) => {
      if (!overlayImgPreviewActive || !logoPreviewOverlay) return;
      e.preventDefault();
      const boxRect = logoPreviewOverlay.getBoundingClientRect();
      const startX = parseInt(inpOverlayImgPosX?.value, 10) || 0;
      const startY = parseInt(inpOverlayImgPosY?.value, 10) || 0;
      logoPreviewImg.style.cursor = "grabbing";
      dragState = { clientX: e.clientX, clientY: e.clientY, boxW: boxRect.width, boxH: boxRect.height, startX, startY };
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragState) return;
      const W = Math.max(64, Number(currentPixW) || 1024);
      const H = Math.max(64, Number(currentPixH) || 1024);
      const { lw, lh } = getLogoNaturalSize();
      const s = getClampedLogoScale();
      const dx = ((e.clientX - dragState.clientX) / Math.max(1, dragState.boxW)) * W;
      const dy = ((e.clientY - dragState.clientY) / Math.max(1, dragState.boxH)) * H;
      const maxX = Math.max(0, Math.round(W - lw * s));
      const maxY = Math.max(0, Math.round(H - lh * s));
      if (inpOverlayImgPosX) inpOverlayImgPosX.value = Math.max(0, Math.min(maxX, Math.round(dragState.startX + dx)));
      if (inpOverlayImgPosY) inpOverlayImgPosY.value = Math.max(0, Math.min(maxY, Math.round(dragState.startY + dy)));
      renderLogoPreviewOverlay();
    });
    window.addEventListener("mouseup", () => {
      if (!dragState) return;
      dragState = null;
      logoPreviewImg.style.cursor = "grab";
      saveStateDebounced();
    });
  }

  window.addEventListener("resize", renderLogoPreviewOverlay);

  [chkOverlaySig, chkOverlayAI, chkOverlayImg].forEach(chk => {
    if (chk) chk.addEventListener("change", () => {
      updateOverlayStatusBadge();
      saveStateDebounced();
    });
  });

  const overlayFormInputs = [
    txtOverlaySig, selOverlaySigFont, inpOverlaySigSize, selOverlaySigColor,
    selOverlaySigAlign, selOverlaySigJustify, inpOverlaySigPosX, inpOverlaySigPosY,
    inpOverlaySigRotation, inpOverlaySigMargins,
    txtOverlayAI, selOverlayAIFont, inpOverlayAISize, selOverlayAIColor,
    selOverlayAIAlign, selOverlayAIJustify, inpOverlayAIPosX, inpOverlayAIPosY,
    inpOverlayAIRotation, inpOverlayAIMargins,
    inpOverlayImgPosX, inpOverlayImgPosY, inpOverlayImgScale
  ];

  [inpOverlayImgPosX, inpOverlayImgPosY, inpOverlayImgScale].forEach(el => {
    if (el) el.addEventListener("input", () => {
      if (el === inpOverlayImgScale && parseFloat(el.value) > 0.50) {
        el.value = "0.50";
      }
      renderLogoPreviewOverlay();
    });
  });

  overlayFormInputs.forEach(el => {
    if (el) {
      el.addEventListener("input", () => {
        updateOverlayStatusBadge();
        updateOverlayPositionBadges();
        saveStateDebounced();
      });
      if (el.tagName === "SELECT") {
        el.addEventListener("change", () => {
          updateOverlayStatusBadge();
          updateOverlayPositionBadges();
          saveStateDebounced();
        });
      }
    }
  });
  updateOverlayStatusBadge();
  updateOverlayPositionBadges();

  // Export Settings listeners
  function updateExtraSaveVisibility() {
    if (extraSaveOptions && chkExtraSave) {
      extraSaveOptions.style.display = chkExtraSave.checked ? "flex" : "none";
    }
  }
  if (chkExtraSave) {
    chkExtraSave.addEventListener("change", () => {
      updateExtraSaveVisibility();
      saveStateDebounced();
    });
    updateExtraSaveVisibility();
  }
  function updateFilenamePreview() {
    if (!fnPreviewText) return;
    const del = inpFnDelimiter ? inpFnDelimiter.value : "-";
    const parts = [];
    if (inpFnPrefix && inpFnPrefix.value.trim()) parts.push(inpFnPrefix.value.trim());
    parts.push("MODEL");
    if (inpFnWfVersion && inpFnWfVersion.value.trim()) parts.push(inpFnWfVersion.value.trim());
    if (inpFnDateFormat && inpFnDateFormat.value.trim()) parts.push(inpFnDateFormat.value.trim());
    const folderParts = [];
    if (inpFnOutputFolder && inpFnOutputFolder.value.trim()) folderParts.push(inpFnOutputFolder.value.trim());
    if (inpFnSubfolder && inpFnSubfolder.value.trim()) folderParts.push(inpFnSubfolder.value.trim());
    const dir = folderParts.length ? folderParts.join("/") + "/" : "";
    const label = t("fn_preview_prefix", "Vorschau:");
    fnPreviewText.textContent = `${label} ${dir}${parts.join(del)}.png`;
  }

  [chkSaveTxtMain, selExtraSaveFormat, selExtraSaveQuality, chkExtraSaveTxt].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        saveStateDebounced();
      });
    }
  });
  [
    inpExtraSaveSubfolder, inpFnOutputFolder, inpFnSubfolder,
    inpFnPrefix, inpFnWfVersion, inpFnUpscaledSuffix, inpFnDelimiter, inpFnDateFormat
  ].forEach(el => {
    if (el) {
      el.addEventListener("input", () => {
        updateFilenamePreview();
        saveStateDebounced();
      });
    }
  });
  updateFilenamePreview();

  // Sharpen UI handler
  function updateSharpenUI() {
    if (!rngSharpen || !sharpenVal) return;
    const isEn = chkSharpen ? chkSharpen.checked : true;
    rngSharpen.disabled = !isEn;
    rngSharpen.style.opacity = isEn ? "1" : "0.4";
    if (isEn) {
      sharpenVal.textContent = parseFloat(rngSharpen.value).toFixed(2);
      sharpenVal.style.color = "var(--accent)";
    } else {
      sharpenVal.textContent = t("sharpen_disabled", "Aus");
      sharpenVal.style.color = "var(--mute)";
    }
  }
  if (chkSharpen) {
    chkSharpen.addEventListener("change", () => {
      updateSharpenUI();
      saveStateDebounced();
    });
  }
  if (rngSharpen) {
    rngSharpen.addEventListener("input", () => {
      updateSharpenUI();
      saveStateDebounced();
    });
  }
  updateSharpenUI();

  // ProPostFilmGrain UI handler
  function updateFilmGrainUI() {
    const isEn = chkFilmGrain ? chkFilmGrain.checked : false;
    if (filmGrainOptions) {
      filmGrainOptions.style.display = isEn ? "flex" : "none";
    }
    if (valFilmGrainPower && rngFilmGrainPower) valFilmGrainPower.textContent = parseFloat(rngFilmGrainPower.value).toFixed(2);
    if (valFilmGrainSat && rngFilmGrainSat) valFilmGrainSat.textContent = parseFloat(rngFilmGrainSat.value).toFixed(2);
    if (valFilmGrainShadows && rngFilmGrainShadows) valFilmGrainShadows.textContent = parseFloat(rngFilmGrainShadows.value).toFixed(2);
    if (valFilmGrainHighs && rngFilmGrainHighs) valFilmGrainHighs.textContent = parseFloat(rngFilmGrainHighs.value).toFixed(2);
    if (valFilmGrainScale && rngFilmGrainScale) valFilmGrainScale.textContent = parseFloat(rngFilmGrainScale.value).toFixed(2);
    if (valFilmGrainGamma && rngFilmGrainGamma) valFilmGrainGamma.textContent = parseFloat(rngFilmGrainGamma.value).toFixed(2);
    if (valFilmGrainSharpen && rngFilmGrainSharpen) valFilmGrainSharpen.textContent = String(parseInt(rngFilmGrainSharpen.value, 10) || 0);
    if (filmGrainBadge) {
      if (isEn) {
        const gt = selFilmGrainType ? selFilmGrainType.value : "Fine";
        const pwr = rngFilmGrainPower ? parseFloat(rngFilmGrainPower.value).toFixed(2) : "0.40";
        filmGrainBadge.textContent = `${gt} (${pwr})`;
        filmGrainBadge.style.color = "var(--accent)";
      } else {
        filmGrainBadge.textContent = t("film_grain_off", "Aus");
        filmGrainBadge.style.color = "var(--mute)";
      }
    }
  }
  if (chkFilmGrain) {
    chkFilmGrain.addEventListener("change", () => {
      updateFilmGrainUI();


      saveStateDebounced();
    });
  }
  [selFilmGrainType, chkFilmGrainGray].forEach(el => {
    if (el) el.addEventListener("change", () => { updateFilmGrainUI(); saveStateDebounced(); });
  });
  [
    rngFilmGrainPower, rngFilmGrainSat, rngFilmGrainShadows,
    rngFilmGrainHighs, rngFilmGrainScale, rngFilmGrainGamma, rngFilmGrainSharpen
  ].forEach(el => {
    if (el) el.addEventListener("input", () => { updateFilmGrainUI(); saveStateDebounced(); });
  });
  updateFilmGrainUI();



  // SeedVarianceEnhancer UI handler (Nodes 1995 & 1241)
  function getAutoSVEParams(modelPreset) {
    const mp = (modelPreset || "").toLowerCase();
    if (mp.includes("zimage") || mp.includes("z-image") || mp.includes("zit") || mp.includes("wan")) {
      return { strength: 25.0, rand: 60, sw: 20 };
    }
    if (mp.includes("krea")) return { strength: 0.35, rand: 50, sw: 15 };
    if (mp.includes("moss") || mp.includes("kromoss")) return { strength: 0.45, rand: 50, sw: 15 };
    if (mp.includes("flux")) return { strength: 0.30, rand: 50, sw: 20 };
    if (mp.includes("qwen")) return { strength: 0.50, rand: 50, sw: 20 };
    if (mp.includes("minimax")) return { strength: 0.25, rand: 40, sw: 35 };
    return { strength: 0.40, rand: 50, sw: 20 };
  }

  function updateSVEUI() {
    const isEn = chkSVE ? chkSVE.checked : false;
    const isAuto = chkSVEAuto ? chkSVEAuto.checked : true;
    if (sveOptions) sveOptions.style.display = isEn ? "flex" : "none";

    if (isAuto) {
      const autoP = getAutoSVEParams(selModelPreset ? selModelPreset.value : "");
      if (inpSVEStrength) inpSVEStrength.value = autoP.strength;
      if (inpSVERandPct) inpSVERandPct.value = autoP.rand;
      if (inpSVESwitchPct) inpSVESwitchPct.value = autoP.sw;
    }
    [inpSVEStrength, inpSVERandPct, inpSVESwitchPct].forEach(el => {
      if (el) {
        el.disabled = isAuto;
        el.style.opacity = isAuto ? "0.65" : "1";
      }
    });
    if (sveBadge) {
      if (isEn) {
        const sVal = inpSVEStrength ? parseFloat(inpSVEStrength.value).toFixed(2) : "0.35";
        sveBadge.textContent = isAuto ? `Auto: ${sVal}` : `${t("sve_badge_manual", "Manuell")}: ${sVal}`;
        sveBadge.style.color = "var(--accent)";
      } else {
        sveBadge.textContent = t("sve_off", "Aus");
        sveBadge.style.color = "var(--mute)";
      }
    }
  }
  if (chkSVE) chkSVE.addEventListener("change", () => { updateSVEUI(); saveStateDebounced(); });
  if (chkSVEAuto) chkSVEAuto.addEventListener("change", () => { updateSVEUI(); saveStateDebounced(); });
  [inpSVEStrength, inpSVERandPct, inpSVESwitchPct, selSVENoiseInsert, selSVEMaskStart, inpSVEMaskPct].forEach(el => {
    if (el) el.addEventListener("input", () => { updateSVEUI(); saveStateDebounced(); });
  });
  updateSVEUI();

  // SeedVR2 Detail UI handler (Nodes 2023, 1592, 1593, 1595)
  function updateSeedVR2UI() {
    const isEn = chkSeedVR2 ? chkSeedVR2.checked : false;
    if (seedVR2Options) seedVR2Options.style.display = isEn ? "flex" : "none";
    if (seedVR2Badge) {
      if (isEn) {
        const res = inpSeedVR2Res ? (parseInt(inpSeedVR2Res.value, 10) || 3840) : 3840;
        const cc = selSeedVR2ColorCorr ? selSeedVR2ColorCorr.value : "lab";
        seedVR2Badge.textContent = `${res}px · ${cc}`;
        seedVR2Badge.style.color = "var(--accent)";
      } else {
        seedVR2Badge.textContent = t("seedvr2_off", "Aus");
        seedVR2Badge.style.color = "var(--mute)";
      }
    }
  }
  if (chkSeedVR2) chkSeedVR2.addEventListener("change", () => { updateSeedVR2UI(); saveStateDebounced(); });
  [selSeedVR2Model, inpSeedVR2Res, inpSeedVR2MaxRes, selSeedVR2ColorCorr, inpSeedVR2Blocks, selSeedVR2Attn, inpSeedVR2InNoise, inpSeedVR2LatNoise, chkSeedVR2Tiled, chkSeedVR2Cache].forEach(el => {
    if (el) el.addEventListener("input", () => { updateSeedVR2UI(); saveStateDebounced(); });
  });
  updateSeedVR2UI();

  // Attention Engine (Node 1912: TASageAttentionToggler) handlers
  function updateAttnEngineBadge() {
    if (!badgeSageAttention) return;
    if (currentAttnEngine === "kitchen") {
      badgeSageAttention.textContent = t("badge_kitchen_on", "Kitchen AN");
      badgeSageAttention.style.color = "var(--accent)";
    } else if (currentAttnEngine === "sage") {
      badgeSageAttention.textContent = t("badge_sage_on", "Sage AN");
      badgeSageAttention.style.color = "var(--accent)";
    } else {
      badgeSageAttention.textContent = t("badge_attn_standard", "Standard");
      badgeSageAttention.style.color = "var(--mute)";
    }
  }

  function setAttnEngine(engine) {
    currentAttnEngine = engine || "kitchen";
    if (attnEnginePills) {
      attnEnginePills.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-attn") === currentAttnEngine);
      });
    }
    if (sageModeContainer) {
      sageModeContainer.style.display = (currentAttnEngine === "sage") ? "block" : "none";
    }
    updateAttnEngineBadge();
  }

  if (attnEnginePills) {
    attnEnginePills.querySelectorAll(".pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const engine = btn.getAttribute("data-attn");
        setAttnEngine(engine);
        saveStateDebounced();
      });
    });
  }
  if (selSageMode) {
    selSageMode.addEventListener("change", () => {
      saveStateDebounced();
    });
  }
  if (chkTorchEnable) {
    chkTorchEnable.addEventListener("change", () => {
      saveStateDebounced();
    });
  }
  setAttnEngine(currentAttnEngine);

  // Prompt Controller Elements
  const selPromptControllerMode = document.getElementById("selPromptControllerMode");
  const inpDelimiter = document.getElementById("inpDelimiter");
  const promptControllerBadge = document.getElementById("promptControllerBadge");

  function updatePromptControllerBadge() {
    if (!promptControllerBadge || !selPromptControllerMode) return;
    const mode = selPromptControllerMode.value;
    const badgeMap = {
      "Manual Only": ["ctrl_badge_manual", "Nur Manuell"],
      "Generated Only": ["ctrl_badge_gen", "Nur KI"],
      "Combine: Manual + Generated": ["ctrl_badge_combo_mg", "Manuell + KI"],
      "Combine: Generated + Manual": ["ctrl_badge_combo_gm", "KI + Manuell"],
      "Clear / Empty": ["ctrl_badge_clear", "Leer"],
    };
    const mapped = badgeMap[mode];
    promptControllerBadge.textContent = mapped ? t(mapped[0], mapped[1]) : mode;
    if (mode === "Manual Only") {
      promptControllerBadge.style.color = "";
    } else if (mode.startsWith("Combine")) {
      promptControllerBadge.style.color = "var(--accent)";
    } else if (mode === "Generated Only") {
      promptControllerBadge.style.color = "var(--accent2)";
    } else {
      promptControllerBadge.style.color = "var(--text-muted)";
    }
  }

  // LLM Engine Elements
  const llmModePills = document.getElementById("llmModePills");
  const llmStatusBadge = document.getElementById("llmStatusBadge");
  const llmSourceBadge = document.getElementById("llmSourceBadge");
  const llmModelBadge = document.getElementById("llmModelBadge");
  const llmSettingsPanel = document.getElementById("llmSettingsPanel");
  const selLLMModel = document.getElementById("selLLMModel");
  const llmModelCombo = document.getElementById("llmModelCombo");
  const btnLLMModelTrigger = document.getElementById("btnLLMModelTrigger");
  const llmModelTriggerLabel = document.getElementById("llmModelTriggerLabel");
  const llmModelMenu = document.getElementById("llmModelMenu");
  const inpLLMModelSearch = document.getElementById("inpLLMModelSearch");
  const btnClearLLMModelSearch = document.getElementById("btnClearLLMModelSearch");
  const llmModelList = document.getElementById("llmModelList");
  const selLLMControllerMode = document.getElementById("selLLMControllerMode");
  const llmAdvBadge = document.getElementById("llmAdvBadge");
  const rngLLMTemp = document.getElementById("rngLLMTemp");
  const valLLMTemp = document.getElementById("valLLMTemp");
  const inpLLMMaxTokens = document.getElementById("inpLLMMaxTokens");
  const chkLLMThinking = document.getElementById("chkLLMThinking");
  const chkLLMUnloadImgFirst = document.getElementById("chkLLMUnloadImgFirst");
  const chkLLMUnloadAfter = document.getElementById("chkLLMUnloadAfter");
  const txtLLMSystemPrompt = document.getElementById("txtLLMSystemPrompt");
  const inpLLMTimeout = document.getElementById("inpLLMTimeout");
  const btnResetLLMDefaults = document.getElementById("btnResetLLMDefaults");
  const i2iUserPromptGroup = document.getElementById("i2iUserPromptGroup");
  const txtLLMI2IUserPrompt = document.getElementById("txtLLMI2IUserPrompt");
  let workflowLLMDefaults = { t2i: {}, i2i: {} };

  const MODEL_LLM_PROMPT_PRESETS = {
    moss_8step: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for MOSS-Image 8-Step, a fast distilled image model.\n" +
          "Output ONLY the final English prompt (55-95 words). No explanations, no quotes, no markdown.\n" +
          "Rules:\n" +
          "- Start with the exact art style or medium (e.g. 2D dark fantasy anime illustration, digital painting, candid photograph).\n" +
          "- Clearly state the main subject, exact pose, held objects, and action.\n" +
          "- Describe key background elements, lighting, and color palette concisely.\n" +
          "- NEVER append generic tag spam like masterpiece, best quality, 8k, absurdres, or unrelated film-camera clichés."
      },
      i2i: {
        system_prompt:
          "You are a precise visual analyzer creating image-generation prompts for MOSS-Image 8-Step.\n" +
          "Output ONLY the final English prompt (60-105 words). No explanations, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Preserve the exact art style and medium of the reference image (if it is 2D anime or digital art, NEVER describe it as photorealistic or 70mm film).\n" +
          "- State the exact subject count, pose, facing direction, and held weapons/objects.\n" +
          "- Keep the key background motifs, lighting, and color palette faithful to the reference.\n" +
          "- Keep sentences direct and uncluttered so an 8-step model stays true to the composition.",
        user_prompt:
          "Analyze the reference image and write a concise, faithful prompt in this flow: 1) Art style & medium, 2) Main subject, exact pose & held objects, 3) Secondary creatures/props, 4) Background setting, 5) Color palette & lighting mood. Output only the prompt."
      }
    },
    moss_sft: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for MOSS-Image SFT (20-step model).\n" +
          "Output ONLY the final English prompt (80-130 words). No explanations, no quotes, no markdown.\n" +
          "Rules:\n" +
          "- Lead with art style/medium, main subject, pose, and composition.\n" +
          "- Add rich material textures, environment depth, lighting, and atmosphere.\n" +
          "- Avoid generic tag lists like masterpiece, absurdres, 8k."
      },
      i2i: {
        system_prompt:
          "You are a visual analyzer creating faithful prompts for MOSS-Image SFT.\n" +
          "Output ONLY the final English prompt (80-130 words). No explanations, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Match the exact medium/style of the reference image (never force photorealism onto illustrations).\n" +
          "- Accurately capture subject pose, spatial layout, key objects, textures, colors, and lighting.",
        user_prompt:
          "Describe the reference image accurately for recreation: art style, main subject and exact pose, key objects, background, and lighting/color mood. Output only the prompt."
      }
    },
    flux: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for FLUX models.\n" +
          "Output ONLY the final English prompt in 2-4 natural, fluent sentences (60-110 words). No tag lists, no explanations.\n" +
          "Rules:\n" +
          "- FLUX responds best to clear, descriptive natural prose rather than comma-separated booru tags or quality buzzwords (never use masterpiece, 8k, absurdres).\n" +
          "- Describe the medium/style, subject, pose, framing, textures, and natural lighting clearly."
      },
      i2i: {
        system_prompt:
          "You are a visual analyzer writing natural English prose prompts for FLUX.\n" +
          "Output ONLY 2-4 cohesive sentences (60-115 words). No tag lists, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Faithfully preserve the reference image's medium/style, subject, pose, spatial composition, colors, and lighting in natural prose.",
        user_prompt:
          "Describe this image in natural, cohesive English sentences covering art style, subject, exact pose, key elements, setting, and lighting. Output only the prompt."
      }
    },
    qwen: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for Qwen-Image models.\n" +
          "Output ONLY the final English prompt (60-120 words). No explanations, no markdown.\n" +
          "Rules:\n" +
          "- Specify art style, subject, pose, spatial layout, lighting, and atmosphere clearly.\n" +
          "- If any text or typography should appear in the image, enclose the exact text in double quotes."
      },
      i2i: {
        system_prompt:
          "You are a precise visual analyzer for Qwen-Image.\n" +
          "Output ONLY the final English prompt (65-125 words). No explanations, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Preserve the exact art style, subject pose, spatial relationships, colors, lighting, and any visible text in double quotes.",
        user_prompt:
          "Analyze the image and write a clear, accurate prompt preserving its art style, pose, spatial layout, objects, colors, and lighting. Output only the prompt."
      }
    },
    minimax: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for MiniMax H3 Image.\n" +
          "Output ONLY the final English prompt (70-125 words). No explanations, no markdown.\n" +
          "Rules:\n" +
          "- Describe the medium/style, main subject, pose, composition, environment, and lighting mood vividly without generic tag spam."
      },
      i2i: {
        system_prompt:
          "You are a visual analyzer for MiniMax H3 Image.\n" +
          "Output ONLY the final English prompt (70-125 words). No explanations, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Match the reference image's art style, subject, pose, key props, composition, and lighting mood faithfully.",
        user_prompt:
          "Describe the reference image faithfully, covering style, subject, pose, key elements, background, and lighting. Output only the prompt."
      }
    },
    krea2: {
      t2i: {
        system_prompt:
          "You are an expert prompt writer for Krea2-Turbo.\n" +
          "Output ONLY the final English prompt (65-115 words). No explanations, no markdown.\n" +
          "Rules:\n" +
          "- Focus on clear visual style, subject, pose, composition, and lighting without filler buzzwords."
      },
      i2i: {
        system_prompt:
          "You are a visual analyzer for Krea2-Turbo.\n" +
          "Output ONLY the final English prompt (65-115 words). No explanations, no headers, no markdown.\n" +
          "Rules:\n" +
          "- Stay faithful to the reference image's style, pose, key objects, colors, and lighting.",
        user_prompt:
          "Describe the reference image clearly (style, subject, pose, key elements, setting, and lighting) so it can be recreated faithfully. Output only the prompt."
      }
    }
  };

  let llmPromptsByModel = {};

  function getLLMPromptProfileKey(modelName) {
    const m = (modelName || "").toLowerCase();
    if (!m) return "default";
    if (m.includes("zimage") || m.includes("z-image") || m.includes("zit") || m.includes("wan")) return "zimage";
    if (m.includes("moss") || m.includes("kromoss")) {
      return m.includes("sft") ? "moss_sft" : "moss_8step";
    }
    if (m.includes("flux")) return "flux";
    if (m.includes("qwen")) return "qwen";
    if (m.includes("minimax")) return "minimax";
    if (m.includes("krea")) return "krea2";
    return "default";
  }

  function saveCurrentLLMPromptsToModelMap(modelName, mode) {
    if (mode !== "t2i" && mode !== "i2i") return;
    const profileKey = getLLMPromptProfileKey(modelName);
    if (!llmPromptsByModel[profileKey]) llmPromptsByModel[profileKey] = {};
    if (!llmPromptsByModel[profileKey][mode]) llmPromptsByModel[profileKey][mode] = {};
    if (txtLLMSystemPrompt) {
      llmPromptsByModel[profileKey][mode].system_prompt = txtLLMSystemPrompt.value;
    }
    if (mode === "i2i" && txtLLMI2IUserPrompt) {
      llmPromptsByModel[profileKey][mode].user_prompt = txtLLMI2IUserPrompt.value;
    }
  }

  function applyLLMDefaultsForMode(mode, force = false) {
    const key = (mode === "i2i") ? "i2i" : "t2i";
    const otherKey = (key === "i2i") ? "t2i" : "i2i";
    const profileKey = getLLMPromptProfileKey(selModelPreset ? selModelPreset.value : "");
    const modelPreset = (MODEL_LLM_PROMPT_PRESETS[profileKey] && MODEL_LLM_PROMPT_PRESETS[profileKey][key]) || {};
    const savedForModel = (!force && llmPromptsByModel[profileKey] && llmPromptsByModel[profileKey][key]) || {};
    const def = workflowLLMDefaults[key] || {};
    const otherDef = workflowLLMDefaults[otherKey] || {};
    if (i2iUserPromptGroup) {
      i2iUserPromptGroup.style.display = (mode === "i2i") ? "flex" : "none";
    }

    const targetSystemPrompt =
      (savedForModel.system_prompt !== undefined && savedForModel.system_prompt.trim() !== "")
        ? savedForModel.system_prompt
        : (modelPreset.system_prompt !== undefined ? modelPreset.system_prompt : def.system_prompt);

    const targetUserPrompt =
      (savedForModel.user_prompt !== undefined && savedForModel.user_prompt.trim() !== "")
        ? savedForModel.user_prompt
        : (modelPreset.user_prompt !== undefined ? modelPreset.user_prompt : def.user_prompt);

    if (txtLLMSystemPrompt && targetSystemPrompt !== undefined) {
      const cur = txtLLMSystemPrompt.value.trim();
      const otherSys = (otherDef.system_prompt || "").trim();
      if (force || cur === "" || cur === otherSys || savedForModel.system_prompt !== undefined || modelPreset.system_prompt !== undefined) {
        txtLLMSystemPrompt.value = targetSystemPrompt;
      }
    }
    if (txtLLMI2IUserPrompt && key === "i2i" && targetUserPrompt !== undefined) {
      if (force || txtLLMI2IUserPrompt.value.trim() === "" || savedForModel.user_prompt !== undefined || modelPreset.user_prompt !== undefined) {
        txtLLMI2IUserPrompt.value = targetUserPrompt;
      }
    }
    if (rngLLMTemp && def.temperature !== undefined) {
      const curT = parseFloat(rngLLMTemp.value);
      const otherT = parseFloat(otherDef.temperature);
      if (force || (!Number.isNaN(otherT) && Math.abs(curT - otherT) < 1e-4)) {
        rngLLMTemp.value = def.temperature;
      }
    }
    if (inpLLMMaxTokens && def.max_tokens !== undefined) {
      const curM = parseInt(inpLLMMaxTokens.value, 10);
      const otherM = parseInt(otherDef.max_tokens, 10);
      if (force || (!Number.isNaN(otherM) && curM === otherM)) {
        inpLLMMaxTokens.value = def.max_tokens;
      }
    }
    if (inpLLMTimeout && def.request_timeout !== undefined) {
      if (force || !inpLLMTimeout.value) {
        inpLLMTimeout.value = def.request_timeout;
      }
    }
    if (force) {
      if (chkLLMThinking && def.thinking_mode !== undefined) chkLLMThinking.checked = Boolean(def.thinking_mode);
      if (chkLLMUnloadImgFirst && def.unload_image_models_first !== undefined) chkLLMUnloadImgFirst.checked = Boolean(def.unload_image_models_first);
      if (chkLLMUnloadAfter && def.unload_llm_after !== undefined) chkLLMUnloadAfter.checked = Boolean(def.unload_llm_after);
    }
    updateLLMAdvUI();
  }

  fetch("/api/llm_defaults")
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d && (d.t2i || d.i2i)) {
        workflowLLMDefaults = d;
        applyLLMDefaultsForMode(currentLLMMode, false);
      }
    })
    .catch(() => {});

  function updateLLMAdvUI() {
    const tempVal = rngLLMTemp ? parseFloat(rngLLMTemp.value).toFixed(2) : "0.70";
    const tokVal = inpLLMMaxTokens ? (parseInt(inpLLMMaxTokens.value, 10) || 2048) : 2048;
    if (valLLMTemp) valLLMTemp.textContent = tempVal;
    if (llmAdvBadge) llmAdvBadge.textContent = `T: ${tempVal} · ${tokVal}`;
  }
  if (rngLLMTemp) {
    rngLLMTemp.addEventListener("input", () => { updateLLMAdvUI(); saveStateDebounced(); });
  }
  if (inpLLMMaxTokens) {
    inpLLMMaxTokens.addEventListener("input", () => { updateLLMAdvUI(); saveStateDebounced(); });
  }
  [chkLLMThinking, chkLLMUnloadImgFirst, chkLLMUnloadAfter].forEach(el => {
    if (el) el.addEventListener("change", () => saveStateDebounced());
  });
  if (txtLLMSystemPrompt) {
    txtLLMSystemPrompt.addEventListener("input", () => {
      saveCurrentLLMPromptsToModelMap(selModelPreset ? selModelPreset.value : "", currentLLMMode);
      saveStateDebounced();
    });
  }
  if (txtLLMI2IUserPrompt) {
    txtLLMI2IUserPrompt.addEventListener("input", () => {
      saveCurrentLLMPromptsToModelMap(selModelPreset ? selModelPreset.value : "", currentLLMMode);
      saveStateDebounced();
    });
  }
  if (inpLLMTimeout) {
    inpLLMTimeout.addEventListener("input", () => saveStateDebounced());
  }
  if (btnResetLLMDefaults) {
    btnResetLLMDefaults.addEventListener("click", () => {
      const profileKey = getLLMPromptProfileKey(selModelPreset ? selModelPreset.value : "");
      const modeKey = (currentLLMMode === "i2i") ? "i2i" : "t2i";
      if (llmPromptsByModel[profileKey]) {
        delete llmPromptsByModel[profileKey][modeKey];
      }
      applyLLMDefaultsForMode(currentLLMMode, true);
      saveStateDebounced();
    });
  }
  updateLLMAdvUI();
  const i2iUploadPanel = document.getElementById("i2iUploadPanel");
  const i2iDropzone = document.getElementById("i2iDropzone");
  const inpI2IFile = document.getElementById("inpI2IFile");
  const i2iEmptyState = document.getElementById("i2iEmptyState");
  const i2iPreviewState = document.getElementById("i2iPreviewState");
  const imgI2IThumb = document.getElementById("imgI2IThumb");
  const lblI2IFilename = document.getElementById("lblI2IFilename");
  const lblI2IStatus = document.getElementById("lblI2IStatus");
  const i2iFileNameBadge = document.getElementById("i2iFileNameBadge");
  const btnRemoveI2I = document.getElementById("btnRemoveI2I");
  const llmPromptResultGroup = document.getElementById("llmPromptResultGroup");
  const txtLLMGeneratedPrompt = document.getElementById("txtLLMGeneratedPrompt");
  const llmExecStatusBadge = document.getElementById("llmExecStatusBadge");
  const btnCopyLLMPrompt = document.getElementById("btnCopyLLMPrompt");
  const btnAdoptLLMPrompt = document.getElementById("btnAdoptLLMPrompt");

  function updateLLMExecStatusBadge(statusText) {
    if (!llmExecStatusBadge) return;
    const raw = (statusText || "").trim();
    if (!raw || raw.toUpperCase() === "DISABLED" || currentLLMMode === "off") {
      llmExecStatusBadge.style.display = "none";
      llmExecStatusBadge.textContent = "";
      return;
    }
    const low = raw.toLowerCase();
    const isWarn = /error|fail|warn|empty|timeout|fehler|leer|⚠️|❌/.test(low);
    llmExecStatusBadge.textContent = raw;
    llmExecStatusBadge.style.display = "block";
    if (isWarn) {
      llmExecStatusBadge.style.borderColor = "var(--danger)";
      llmExecStatusBadge.style.color = "#fca5a5";
    } else {
      llmExecStatusBadge.style.borderColor = "var(--border)";
      llmExecStatusBadge.style.color = "var(--text-muted)";
    }
  }

  const mainPreview = document.getElementById("mainPreview");
  const btnCopyPrompt = document.getElementById("btnCopyPrompt");
  const btnReuseSeed = document.getElementById("btnReuseSeed");
  const btnDownload = document.getElementById("btnDownload");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnToggleGallery = document.getElementById("btnToggleGallery");
  const btnClearGallery = document.getElementById("btnClearGallery");
  const btnRefreshGallery = document.getElementById("btnRefreshGallery");
  const btnApplyAllParams = document.getElementById("btnApplyAllParams");
  const dropOverlay = document.getElementById("dropOverlay");
  const dropOverlayTitle = document.getElementById("dropOverlayTitle");
  const dropOverlaySub = document.getElementById("dropOverlaySub");
  const btnAdoptPreviewAsI2I = document.getElementById("btnAdoptPreviewAsI2I");
  const btnBrowseI2I = document.getElementById("btnBrowseI2I");
  if (btnBrowseI2I) {
    btnBrowseI2I.addEventListener("click", async () => {
      try {
        const resp = await fetch("/api/browse_i2i_image");
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data || !data.b64 || !data.name) return;
        const bin = atob(data.b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], data.name, { type: data.mime || "image/png" });
        await uploadI2IImage(file);
      } catch (e) {
        console.warn("I2I browse failed:", e);
      }
    });
  }
  const compareContainer = document.getElementById("compareContainer");
  const compareBeforeWrap = document.getElementById("compareBeforeWrap");
  const compareBeforeImg = document.getElementById("compareBeforeImg");
  const compareAfterImg = document.getElementById("compareAfterImg");
  const compareDivider = document.getElementById("compareDivider");
  const btnToggleCompare = document.getElementById("btnToggleCompare");
  const comparePairsByUrl = new Map();
  let isCompareActive = false;
  const toastContainer = document.getElementById("toastContainer");

  // Settings & preset editor elements
  const btnLaunchComfy = document.getElementById("btnLaunchComfy");
  const btnRestartComfy = document.getElementById("btnRestartComfy");
  const comfyOfflineModal = document.getElementById("comfyOfflineModal");
  const btnCloseComfyOfflineModal = document.getElementById("btnCloseComfyOfflineModal");
  const btnCancelComfyOffline = document.getElementById("btnCancelComfyOffline");
  const btnSettingsComfyOffline = document.getElementById("btnSettingsComfyOffline");
  const btnStartComfyFromModal = document.getElementById("btnStartComfyFromModal");
  let isComfyOnline = false;
  let pendingLaunchAfterSettings = false;
  const inpComfyLaunchCmd = document.getElementById("inpComfyLaunchCmd");
  const btnBrowseLaunchCmd = document.getElementById("btnBrowseLaunchCmd");
  const inpExtraModelsDir = document.getElementById("inpExtraModelsDir");
  const chkConfirmClose = document.getElementById("chkConfirmClose");
  const btnBrowseExtraModelsDir = document.getElementById("btnBrowseExtraModelsDir");
  const btnReloadApp = document.getElementById("btnReloadApp");
  const btnSettings = document.getElementById("btnSettings");
  const settingsModal = document.getElementById("settingsModal");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const inpComfyUrl = document.getElementById("inpComfyUrl");
  const btnSaveSettings = document.getElementById("btnSaveSettings");
  const btnTestComfyConn = document.getElementById("btnTestComfyConn");
  const connTestResult = document.getElementById("connTestResult");

  const btnEditModelPresets = document.getElementById("btnEditModelPresets");
  const btnEditSamplerPresets = document.getElementById("btnEditSamplerPresets");
  const presetEditorModal = document.getElementById("presetEditorModal");
  const btnClosePresetEditor = document.getElementById("btnClosePresetEditor");
  const presetEditorModalTitle = document.getElementById("presetEditorModalTitle");
  const presetEditorIframe = document.getElementById("presetEditorIframe");
  const btnOpenExternalPreset = document.getElementById("btnOpenExternalPreset");

  const inpOutputDir = document.getElementById("inpOutputDir");
  const btnBrowseOutputDir = document.getElementById("btnBrowseOutputDir");
  const inpVideoOutputDir = document.getElementById("inpVideoOutputDir");
  const btnBrowseVideoOutputDir = document.getElementById("btnBrowseVideoOutputDir");
  const inpMusicOutputDir = document.getElementById("inpMusicOutputDir");
  const btnBrowseMusicOutputDir = document.getElementById("btnBrowseMusicOutputDir");
  const inpLmsUrl = document.getElementById("inpLmsUrl");
  const inpOllamaUrl = document.getElementById("inpOllamaUrl");
  const CLOUD_KEY_INPUTS = [
    { field: "gemini_api_key", input: document.getElementById("inpGeminiApiKey"), clearBtn: document.getElementById("btnClearGeminiKey"), defaultPh: "Optional: AIza..." },
    { field: "openai_api_key", input: document.getElementById("inpOpenaiApiKey"), clearBtn: document.getElementById("btnClearOpenaiKey"), defaultPh: "Optional: sk-..." },
    { field: "openrouter_api_key", input: document.getElementById("inpOpenrouterApiKey"), clearBtn: document.getElementById("btnClearOpenrouterKey"), defaultPh: "Optional: sk-or-..." },
    { field: "groq_api_key", input: document.getElementById("inpGroqApiKey"), clearBtn: document.getElementById("btnClearGroqKey"), defaultPh: "Optional: gsk_..." },
  ];

  let lastCloudKeyStatus = null;

  function applyCloudKeyStatusToInputs(statusMap, preserveDirty = false) {
    const map = statusMap || {};
    lastCloudKeyStatus = map;
    CLOUD_KEY_INPUTS.forEach(({ field, input, clearBtn, defaultPh }) => {
      if (!input) return;
      if (preserveDirty && input.dataset.dirty === "1") return;
      input.value = "";
      input.dataset.dirty = "0";
      input.dataset.cleared = "0";
      const st = map[field] || {};
      if (st.configured && st.source === "studio") {
        const statusPh = t("settings_cloud_key_set_studio", "Gespeichert ({masked})").replace("{masked}", st.masked || "••••");
        input.placeholder = statusPh;
        input.title = t("settings_cloud_key_change_hint", "{status} – neuen Key eingeben zum Ändern").replace("{status}", statusPh);
        if (clearBtn) clearBtn.style.display = "inline-flex";
      } else if (st.configured && st.source === "env") {
        input.placeholder = t("settings_cloud_key_set_env", "Windows-Env ({masked})").replace("{masked}", st.masked || "••••");
        input.title = input.placeholder;
        if (clearBtn) clearBtn.style.display = "none";
      } else {
        input.placeholder = defaultPh;
        input.title = "";
        if (clearBtn) clearBtn.style.display = "none";
      }
    });
  }

  CLOUD_KEY_INPUTS.forEach(({ input, clearBtn, defaultPh }) => {
    if (input) {
      input.addEventListener("input", () => {
        input.dataset.dirty = "1";
        input.dataset.cleared = "0";
        if (clearBtn) clearBtn.style.display = input.value.trim() ? "inline-flex" : "none";
      });
    }
    if (clearBtn && input) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        input.dataset.dirty = "1";
        input.dataset.cleared = "1";
        input.placeholder = defaultPh;
        clearBtn.style.display = "none";
      });
    }
  });
  const btnOpenFolder = document.getElementById("btnOpenFolder");
  const filmstripGallery = document.getElementById("filmstripGallery");

  let currentPresetEditorUrl = "";

  // Model arch metadata map
  const MODEL_META = {
    "Minimax H3 Image": "MiniMax H3 (DiT)",
    "Krea2-Turbo": "Wan2.1-Turbo / Lumina",
    "FLUX1-DEV-FP8": "FLUX.1-Dev (FP8)",
    "FLUX Dev (FP8)": "FLUX.1-Dev (FP8)",
    "ZImage (BF16)": "Z-Image / Wan2.1",
    "Z-Image": "Z-Image / Wan2.1",
    "Qwen-Image 2.1": "Qwen 2.1 Image",
    "Qwen-Image 2.1 Turbo": "Qwen 2.1 Turbo",
    "FLUX3-Klein-Image": "FLUX3 Klein",
    "MOSS-Image 8 Step": "MOSS-Image (8-Step)",
    "MOSS-Image JIB": "MOSS-Image JIB",
    "KROMOSS": "KROMOSS"
  };

  // Sampler details map
  const SAMPLER_META = {
    "Minimax H3 Image": "6 Steps · euler/simple · CFG 1",
    "Krea2-Turbo": "9 Steps · euler/beta · CFG 1",
    "Z-Image Turbo": "9 Steps · euler/beta · CFG 1",
    "FLUX1-DEV-FP8": "20 Steps · euler/simple · CFG 1",
    "Qwen-Image 2.1": "25 Steps · euler/simple · CFG 1",
    "Qwen-Image 2.1 Turbo": "8 Steps · euler/normal · CFG 1",
    "FLUX3-Klein-Image": "25 Steps · euler/normal · CFG 3.5",
    "MOSS-Image 8 Step": "8 Steps · er_sde/simple · CFG 2.5",
    "MOSS-Image SFT": "50 Steps · euler/sgm_uniform · CFG 3"
  };

  // Model family -> Suggested sampler mapping
  const SAMPLER_SUGGESTIONS = {
    "Minimax H3 Image": "Minimax H3 Image",
    "Krea2-Turbo": "Krea2-Turbo",
    "ZImage (BF16)": "Z-Image Turbo",
    "Z-Image": "Z-Image Turbo",
    "FLUX1-DEV-FP8": "FLUX1-DEV-FP8",
    "FLUX Dev (FP8)": "FLUX1-DEV-FP8",
    "Qwen-Image 2.1": "Qwen-Image 2.1",
    "Qwen-Image 2.1 Turbo": "Qwen-Image 2.1 Turbo",
    "FLUX3-Klein-Image": "FLUX3-Klein-Image",
    "MOSS-Image 8 Step": "MOSS-Image 8 Step",
    "MOSS-Image JIB": "MOSS-Image 8 Step",
    "MOSS-Image SFT": "MOSS-Image SFT",
    "KROMOSS": "MOSS-Image 8 Step"
  };

  // 1. Model Selection Sync
  function updateModelSelection(val, syncSampler = false) {
    if (!val) return;
    
    // Resolve architecture metadata with exact and normalized matching
    let arch = MODEL_META[val];
    if (!arch) {
      const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const [k, v] of Object.entries(MODEL_META)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normVal) {
          arch = v;
          break;
        }
      }
    }
    modelArchBadge.dataset.custom = arch ? "0" : "1";
    modelArchBadge.textContent = arch || t("badge_custom_model", "Eigenes Modell");
    
    // Normalize string for robust comparison (e.g. ZImage (BF16) matches ZImage (BF16) or Z-Image)
    const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, "");

    const pillBtns = Array.from(modelQuickPills.querySelectorAll(".pill-btn"));
    const hasExactPillMatch = pillBtns.some(b => {
      const pModel = b.getAttribute("data-model") || "";
      const normP = pModel.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (pModel === val) || (normVal.length > 0 && normP === normVal);
    });

    pillBtns.forEach(b => {
      const pModel = b.getAttribute("data-model") || "";
      const normP = pModel.toLowerCase().replace(/[^a-z0-9]/g, "");

      let isMatch = (pModel === val) || (normVal.length > 0 && normP === normVal);
      if (!hasExactPillMatch && !isMatch && normVal.length > 2) {
        if (normVal.includes("zimage") && normP.includes("zimage")) isMatch = true;
        else if (normVal.includes("minimax") && normP.includes("minimax")) isMatch = true;
        else if (normVal.includes("flux") && normP.includes("flux")) isMatch = true;
        else if (normVal.includes("krea") && normP.includes("krea")) isMatch = true;
        else if (normVal.includes("qwen") && normP.includes("qwen")) isMatch = true;
      }
      b.classList.toggle("active", isMatch);
    });

    if (syncSampler) {
      const samplerOpts = Array.from(selSamplerPreset.options).filter(o => !o.disabled && o.value);
      const normValClean = val.toLowerCase().replace(/[^a-z0-9]/g, "");

      // 1. Direct/fuzzy match with model name itself (works for any custom preset pair)
      let found = samplerOpts.find(o => {
        const normO = o.value.toLowerCase().replace(/[^a-z0-9]/g, "");
        return o.value === val || (normValClean.length > 2 && (normO === normValClean || normO.includes(normValClean) || normValClean.includes(normO)));
      });

      // 2. Explicit suggestion map
      if (!found) {
        let suggested = SAMPLER_SUGGESTIONS[val];
        if (!suggested) {
          for (const [k, v] of Object.entries(SAMPLER_SUGGESTIONS)) {
            if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normValClean) {
              suggested = v;
              break;
            }
          }
        }
        if (suggested) {
          const normSug = suggested.toLowerCase().replace(/[^a-z0-9]/g, "");
          found = samplerOpts.find(o => {
            const normO = o.value.toLowerCase().replace(/[^a-z0-9]/g, "");
            return o.value === suggested || normO === normSug || normO.includes(normSug) || normSug.includes(normO);
          });
        }
      }

      // 3. Family fallback (e.g. KROMOSS -> moss -> MOSS-Image 8 Step)
      if (!found) {
        const fam = getModelCategoryMatch(val);
        if (fam) {
          found = samplerOpts.find(o => getModelCategoryMatch(o.value) === fam);
        }
      }

      if (found) {
        selSamplerPreset.value = found.value;
        updateSamplerSelection(found.value);
      }
    }
    updateFluxGuidanceState();
    applyLLMDefaultsForMode(currentLLMMode, false);
  }

  function handleModelPresetChange(val) {
    updateModelSelection(val, true);
    updateSVEUI();

    const newMatchedCat = getModelCategoryMatch(val);
    if (newMatchedCat && Array.isArray(fullLoraMasterList)) {
      let deactivated = 0;
      fullLoraMasterList.forEach(l => {
        if (l.active && l.category && l.category !== "other" && l.category !== newMatchedCat) {
          l.active = false;
          deactivated++;
        }
      });
      if (deactivated > 0) {
        showToast(
          t("toast_lora_auto_deactivated", "{count} inkompatible(s) LoRA(s) für {model} automatisch deaktiviert")
            .replace("{count}", String(deactivated))
            .replace("{model}", val),
          "info"
        );
      }
    }

    if (typeof filterAndRenderLoras === "function") {
      filterAndRenderLoras();
    }
    saveState();
  }

  selModelPreset.addEventListener("change", (e) => {
    handleModelPresetChange(e.target.value);
  });

  modelQuickPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn || btn.disabled) return;
    const model = btn.getAttribute("data-model");
    
    // Find matching enabled option in select, even if named slightly differently
    const enabledOpts = Array.from(selModelPreset.options).filter(o => !o.disabled && o.value);
    let matchedVal = null;
    if (enabledOpts.some(o => o.value === model)) {
      matchedVal = model;
    } else {
      const normM = model.toLowerCase().replace(/[^a-z0-9]/g, "");
      const found = enabledOpts.find(o => {
        const normO = o.value.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normO === normM || normO.includes(normM) || normM.includes(normO);
      });
      if (found) matchedVal = found.value;
    }

    if (matchedVal) {
      selModelPreset.value = matchedVal;
      handleModelPresetChange(matchedVal);
    } else {
      handleModelPresetChange(model);
    }
  });

  // 2. Sampler Selection Sync
  function updateSamplerSelection(val) {
    if (!val) return;
    let meta = SAMPLER_META[val];
    if (!meta) {
      const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const [k, v] of Object.entries(SAMPLER_META)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normVal) {
          meta = v;
          break;
        }
      }
    }
    samplerDetailsBadge.dataset.custom = meta ? "0" : "1";
    samplerDetailsBadge.textContent = meta || t("badge_custom_sampler", "Eigener Sampler");
    updateFluxGuidanceState();
    applyLLMDefaultsForMode(currentLLMMode, false);
  }

  function updateFluxGuidanceState() {
    const m = (selModelPreset ? selModelPreset.value : "").toUpperCase();
    const s = (selSamplerPreset ? selSamplerPreset.value : "").toUpperCase();
    const isFlux = m.includes("FLUX") || s.includes("FLUX");
    const group = document.getElementById("fluxGuidanceGroup");
    const hint = document.getElementById("fluxGuidanceHint");
    if (!group) return;

    if (isFlux) {
      group.classList.remove("disabled-gate");
      if (rngFlux) rngFlux.disabled = false;
      if (fluxVal) {
        fluxVal.textContent = parseFloat(rngFlux ? rngFlux.value : 3.5).toFixed(1);
        fluxVal.style.color = "var(--accent2)";
      }
      if (hint) hint.textContent = t("flux_guidance_hint_active", "Aktiv für das gewählte FLUX-Modell");
    } else {
      group.classList.add("disabled-gate");
      if (rngFlux) rngFlux.disabled = true;
      if (fluxVal) {
        fluxVal.textContent = t("flux_guidance_bypassed", "Inaktiv (Bypassed)");
        fluxVal.style.color = "var(--mute)";
      }
      if (hint) hint.textContent = t("flux_guidance_hint_inactive", "Im Workflow automatisch inaktiv (nur bei FLUX-Modellen aktiv)");
    }
  }

  selSamplerPreset.addEventListener("change", (e) => {
    updateSamplerSelection(e.target.value);
    saveState();
  });

  // 3. LoRA sliders, toggles & Model Matching (Dynamically integrated with ComfyUI-Lora-Manager)
  let fullLoraMasterList = [];
  let activeLoraFilter = "all"; // "all" | "match" | "active"
  let activeLoraCategory = "all"; // "all" | "zimage" | "krea2" | "moss" | "minimax" | "qwen" | "other"
  let loraSearchQuery = "";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatLoraDisplayName(name) {
    if (!name) return "";
    return name.replace(/\.safetensors$/i, "");
  }

  function getModelCategoryMatch(modelPreset) {
    const m = (modelPreset || "").toLowerCase();
    if (m.includes("zimage") || m.includes("z-image") || m.includes("wan")) return "zimage";
    if (m.includes("krea")) return "krea2";
    if (m.includes("moss") || m.includes("kromoss")) return "moss";
    if (m.includes("minimax")) return "minimax";
    if (m.includes("qwen")) return "qwen";
    if (m.includes("flux")) return "flux";
    return "";
  }

  function updateActiveLorasCount() {
    if (!activeLorasCount) return;
    const activeList = fullLoraMasterList.filter(l => Boolean(l.active));
    const activeCount = activeList.length;

    const currentModel = selModelPreset ? selModelPreset.value : "";
    const matchedCategory = getModelCategoryMatch(currentModel);
    const hasIncompatible = matchedCategory && activeList.some(l => l.category && l.category !== "other" && l.category !== matchedCategory);

    if (activeCount === 0) {
      activeLorasCount.textContent = t("lora_active_none", "0 aktiv");
      activeLorasCount.style.borderColor = "";
      activeLorasCount.style.color = "";
    } else if (hasIncompatible) {
      activeLorasCount.textContent = t("lora_active_incompatible", `${activeCount} aktiv (⚠️ Inkompatibel)`).replace("{count}", activeCount);
      activeLorasCount.style.borderColor = "rgba(239, 68, 68, 0.4)";
      activeLorasCount.style.color = "#f87171";
    } else {
      activeLorasCount.textContent = t("lora_active_some", `${activeCount} aktiv`).replace("{count}", activeCount);
      activeLorasCount.style.borderColor = "";
      activeLorasCount.style.color = "";
    }
  }

  function renderLoraList(lorasToRender) {
    if (!loraContainer) return;
    loraContainer.innerHTML = "";
    const list = Array.isArray(lorasToRender) ? lorasToRender : [];

    if (list.length === 0) {
      loraContainer.innerHTML = `<div style="padding: 16px 8px; text-align: center; color: var(--text-dim); font-size: 12px;">${t("lora_none_found", "Keine LoRAs für den aktuellen Filter gefunden.")}<br><span style="font-size:11px; opacity:0.8;">${t("lora_none_found_sub", "Klicke auf <b>Alle</b> oder passe die Suche an.")}</span></div>`;
      return;
    }

    list.forEach(l => {
      if (!l || !l.name) return;
      const item = document.createElement("div");
      const isActive = Boolean(l.active);
      item.className = `lora-item ${isActive ? "active" : ""}`;
      item.setAttribute("data-lora", l.name);

      const strengthVal = l.strength !== undefined ? parseFloat(l.strength) : 1.0;
      const formattedStrength = isNaN(strengthVal) ? "1.00" : strengthVal.toFixed(2);
      const cleanName = formatLoraDisplayName(l.name);

      let badgeHtml = "";
      if (l.trigger && l.trigger.trim()) {
        const trigTitle = t("lora_trigger_title", "Trigger-Wort: {trigger}").replace("{trigger}", l.trigger);
        badgeHtml = `<span class="lora-badge" title="${escapeHtml(trigTitle)}">Trigger: ${escapeHtml(l.trigger)}</span>`;
      }

      let catBadge = "";
      if (l.category && l.category !== "other") {
        const catTitle = t("lora_cat_badge_title", "Architektur/Kategorie: {cat}").replace("{cat}", l.category);
        catBadge = `<span class="lora-category-tag" title="${escapeHtml(catTitle)}">${escapeHtml(l.category)}</span>`;
      }

      item.innerHTML = `
        <div class="lora-top">
          <label class="switch-label lora-title-wrap">
            <input type="checkbox" class="lora-toggle" ${isActive ? "checked" : ""}>
            <span class="lora-name" title="${escapeHtml(l.name)}">${escapeHtml(cleanName)}</span>
            ${catBadge}
          </label>
          ${badgeHtml}
        </div>
        <div class="lora-slider-row">
          <input type="range" min="0" max="2.0" step="0.05" value="${formattedStrength}" class="lora-range">
          <span class="lora-val">${formattedStrength}</span>
        </div>
      `;
      loraContainer.appendChild(item);
    });
  }

  function filterAndRenderLoras() {
    if (!loraContainer) return;

    const currentModel = selModelPreset ? selModelPreset.value : "";
    const matchedCategory = getModelCategoryMatch(currentModel);

    const filtered = fullLoraMasterList.filter(l => {
      // 1. Text Search
      if (loraSearchQuery) {
        const q = loraSearchQuery.toLowerCase();
        const matchesName = (l.name || "").toLowerCase().includes(q);
        const matchesTrigger = (l.trigger || "").toLowerCase().includes(q);
        if (!matchesName && !matchesTrigger) return false;
      }

      // 2. Category Select
      if (activeLoraCategory !== "all" && l.category !== activeLoraCategory) {
        return false;
      }

      // 3. Pill Filter
      if (activeLoraFilter === "active" && !l.active) {
        return false;
      }
      if (activeLoraFilter === "match") {
        if (matchedCategory && l.category && l.category !== matchedCategory) {
          return false;
        }
      }

      return true;
    });

    renderLoraList(filtered);
    updateActiveLorasCount();
  }

  async function syncWorkflowLoras(showToastNotice = false, stateToMerge = null) {
    try {
      if (btnSyncLoras) btnSyncLoras.disabled = true;
      const resp = await fetch(`/api/workflow/loras?_t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.success || !Array.isArray(data.loras)) {
        throw new Error(data.error || t("err_invalid_lora_format", "Ungültiges LoRA-Format"));
      }

      // Check current master list, stateToMerge, or DOM state
      let mergeSources = stateToMerge;
      if (!mergeSources && fullLoraMasterList.length > 0) {
        mergeSources = fullLoraMasterList;
      } else if (!mergeSources && loraContainer) {
        mergeSources = [];
        loraContainer.querySelectorAll(".lora-item").forEach(it => {
          const toggle = it.querySelector(".lora-toggle");
          const range = it.querySelector(".lora-range");
          const badge = it.querySelector(".lora-badge");
          let trigger = "";
          if (badge && badge.textContent) {
            trigger = badge.textContent.replace(/^Trigger:\s*/i, "").trim();
          }
          mergeSources.push({
            name: it.getAttribute("data-lora"),
            active: toggle ? toggle.checked : false,
            strength: range ? parseFloat(range.value) : 1.0,
            trigger: trigger,
          });
        });
      }

      const stateMap = new Map();
      if (Array.isArray(mergeSources)) {
        mergeSources.forEach(sl => {
          if (sl && sl.name) {
            stateMap.set(sl.name.toLowerCase().replace(/\.safetensors$/i, ""), sl);
          }
        });
      }

      fullLoraMasterList = data.loras.map(wl => {
        const norm = (wl.name || "").toLowerCase().replace(/\.safetensors$/i, "");
        const saved = stateMap.get(norm) || stateMap.get(norm.split("/").pop());
        if (saved) {
          return {
            ...wl,
            active: Boolean(saved.active),
            strength: saved.strength !== undefined ? saved.strength : wl.strength,
            clipStrength: saved.clipStrength !== undefined ? saved.clipStrength : wl.clipStrength,
            trigger: saved.trigger || wl.trigger,
          };
        }
        return wl;
      });

      // Dynamically add any newly discovered categories to category dropdown
      if (loraCategorySelect) {
        const existingCats = new Set(Array.from(loraCategorySelect.options).map(o => o.value));
        fullLoraMasterList.forEach(l => {
          if (l.category && l.category !== "other" && !existingCats.has(l.category)) {
            const opt = document.createElement("option");
            opt.value = l.category;
            opt.textContent = l.category.toUpperCase();
            loraCategorySelect.appendChild(opt);
            existingCats.add(l.category);
          }
        });
      }

      filterAndRenderLoras();

      if (showToastNotice) {
        showToast(t("toast_lora_synced", `LoRAs synchronisiert (${fullLoraMasterList.length} verfügbar)`).replace("{count}", fullLoraMasterList.length), "success");
      }
      return fullLoraMasterList;
    } catch (err) {
      console.warn("Fehler beim Synchronisieren der LoRAs:", err);
      if (showToastNotice) {
        showToast(t("toast_lora_sync_error", "Fehler beim LoRA-Sync: ") + err.message, "error");
      }
      return null;
    } finally {
      if (btnSyncLoras) btnSyncLoras.disabled = false;
    }
  }

  // Filter Pill buttons
  if (loraFilterPills) {
    loraFilterPills.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn) return;
      loraFilterPills.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeLoraFilter = btn.dataset.filter || "all";
      filterAndRenderLoras();
    });
  }

  // Search Input
  if (loraSearchInput) {
    loraSearchInput.addEventListener("input", (e) => {
      loraSearchQuery = e.target.value.trim();
      filterAndRenderLoras();
    });
  }

  // Category Dropdown
  if (loraCategorySelect) {
    loraCategorySelect.addEventListener("change", (e) => {
      activeLoraCategory = e.target.value || "all";
      filterAndRenderLoras();
    });
  }

  // Toggle All visible LoRAs
  if (btnToggleAllLoras) {
    btnToggleAllLoras.addEventListener("click", (e) => {
      e.stopPropagation();
      const items = loraContainer.querySelectorAll(".lora-item");
      if (items.length === 0) return;
      const anyUnchecked = Array.from(items).some(it => {
        const chk = it.querySelector(".lora-toggle");
        return chk && !chk.checked;
      });
      items.forEach(it => {
        const chk = it.querySelector(".lora-toggle");
        if (chk) {
          chk.checked = anyUnchecked;
          it.classList.toggle("active", anyUnchecked);
          const name = it.getAttribute("data-lora");
          const master = fullLoraMasterList.find(m => m.name === name);
          if (master) master.active = anyUnchecked;
        }
      });
      updateActiveLorasCount();
      saveState();
    });
  }

  const loraManagerModal = document.getElementById("loraManagerModal");
  const loraManagerFrame = document.getElementById("loraManagerFrame");
  const loraManagerLoading = document.getElementById("loraManagerLoading");
  const loraManagerModalUrl = document.getElementById("loraManagerModalUrl");
  const btnCloseLoraManagerModal = document.getElementById("btnCloseLoraManagerModal");
  const btnLoraMgrSync = document.getElementById("btnLoraMgrSync");
  const btnLoraMgrReload = document.getElementById("btnLoraMgrReload");
  const btnLoraMgrExternal = document.getElementById("btnLoraMgrExternal");
  let currentLoraManagerUrl = "http://127.0.0.1:8188/loras";

  function getLoraManagerUrl() {
    let targetBase = "http://127.0.0.1:8188";
    if (inpComfyUrl && inpComfyUrl.value.trim()) {
      targetBase = inpComfyUrl.value.trim().replace(/\/+$/, "");
    }
    return `${targetBase}/loras`;
  }

  function openLoraManagerModal() {
    currentLoraManagerUrl = getLoraManagerUrl();
    if (!loraManagerModal || !loraManagerFrame) {
      window.open(currentLoraManagerUrl, "_blank");
      return;
    }
    if (loraManagerModalUrl) loraManagerModalUrl.textContent = currentLoraManagerUrl;
    if (loraManagerLoading) loraManagerLoading.style.display = "flex";
    loraManagerFrame.src = currentLoraManagerUrl;
    loraManagerModal.style.display = "flex";
  }

  function closeLoraManagerModal() {
    if (!loraManagerModal) return;
    loraManagerModal.style.display = "none";
    if (loraManagerFrame) loraManagerFrame.src = "about:blank";
  }

  if (loraManagerFrame) {
    loraManagerFrame.addEventListener("load", () => {
      if (loraManagerLoading && loraManagerFrame.src !== "about:blank") {
        loraManagerLoading.style.display = "none";
      }
    });
  }

  if (btnCloseLoraManagerModal) {
    btnCloseLoraManagerModal.addEventListener("click", closeLoraManagerModal);
  }

  if (loraManagerModal) {
    loraManagerModal.addEventListener("click", (e) => {
      if (e.target === loraManagerModal) closeLoraManagerModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loraManagerModal && loraManagerModal.style.display === "flex") {
      closeLoraManagerModal();
    }
  });

  if (btnLoraMgrSync) {
    btnLoraMgrSync.addEventListener("click", () => {
      syncWorkflowLoras(true);
    });
  }

  if (btnLoraMgrReload) {
    btnLoraMgrReload.addEventListener("click", () => {
      if (!loraManagerFrame) return;
      if (loraManagerLoading) loraManagerLoading.style.display = "flex";
      loraManagerFrame.src = currentLoraManagerUrl;
    });
  }

  if (btnLoraMgrExternal) {
    btnLoraMgrExternal.addEventListener("click", () => {
      window.open(currentLoraManagerUrl, "_blank");
    });
  }

  if (btnOpenLoraManager) {
    btnOpenLoraManager.addEventListener("click", (e) => {
      e.stopPropagation();
      openLoraManagerModal();
    });
  }

  if (btnSyncLoras) {
    btnSyncLoras.addEventListener("click", (e) => {
      e.stopPropagation();
      syncWorkflowLoras(true);
    });
  }

  loraContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("lora-range")) {
      const val = parseFloat(e.target.value).toFixed(2);
      const valSpan = e.target.parentElement.querySelector(".lora-val");
      if (valSpan) valSpan.textContent = val;
      const item = e.target.closest(".lora-item");
      if (item) {
        const name = item.getAttribute("data-lora");
        const master = fullLoraMasterList.find(m => m.name === name);
        if (master) master.strength = parseFloat(val);
      }
      saveStateDebounced();
    }
  });

  loraContainer.addEventListener("change", (e) => {
    if (e.target.classList.contains("lora-toggle")) {
      const item = e.target.closest(".lora-item");
      if (item) {
        item.classList.toggle("active", e.target.checked);
        const name = item.getAttribute("data-lora");
        const master = fullLoraMasterList.find(m => m.name === name);
        if (master) master.active = e.target.checked;
        updateActiveLorasCount();
      }
      saveState();
    }
  });

  // 4. Pixaroma Resolution Node Integration (1:1 with ComfyUI Node 2120)
  function snapTo(n, step) {
    if (!step) return n;
    return Math.round(n / step) * step;
  }

  function clampDim(n) {
    return Math.max(64, Math.min(8192, n));
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  function calcRatioLabel(w, h) {
    if (!w || !h) return "16:9";
    const g = gcd(w, h);
    const rw = Math.round(w / g), rh = Math.round(h / g);
    const known = ["1:1","16:9","9:16","2:1","1:2","3:2","2:3","4:3","3:4","4:5","5:4","21:9"];
    const simple = `${rw}:${rh}`;
    if (known.includes(simple)) return simple;
    const r = w / h;
    for (const k of known) {
      const [kw, kh] = k.split(":").map(Number);
      const kr = kw / kh;
      if (Math.abs(r - kr) / kr < 0.008) return `~${k}`;
    }
    return r >= 1 ? `~${r.toFixed(2)}:1` : `~1:${(1 / r).toFixed(2)}`;
  }

  function calcMegapixels(w, h) {
    return ((w * h) / 1000000).toFixed(2);
  }

  function updateAspectBadge() {
    if (!aspectBadge) return;
    const ratioStr = (currentPixMode === "preset") ? currentPixRatio : calcRatioLabel(currentPixW, currentPixH);
    aspectBadge.textContent = `${currentPixW} × ${currentPixH} (${ratioStr})`;
  }

  function updatePreviewRect(rectEl, labelEl, w, h) {
    if (!rectEl || !labelEl) return;
    const maxBoxW = 90;
    const maxBoxH = 40;
    const r = (w && h) ? (w / h) : (16 / 9);
    let pw, ph;
    if (r >= (maxBoxW / maxBoxH)) {
      pw = maxBoxW;
      ph = Math.max(12, Math.round(maxBoxW / r));
    } else {
      ph = maxBoxH;
      pw = Math.max(12, Math.round(maxBoxH * r));
    }
    rectEl.style.width = `${pw}px`;
    rectEl.style.height = `${ph}px`;
    labelEl.textContent = `${w} × ${h} (${calcRatioLabel(w, h)})`;
  }

  function renderPresetDropdown(ratio, selectedW, selectedH) {
    if (!selPixResolution) return;
    const sizes = PIXAROMA_SIZES[ratio] || [];
    selPixResolution.innerHTML = "";
    sizes.forEach(([w, h]) => {
      const opt = document.createElement("option");
      opt.value = `${w}x${h}`;
      const mp = calcMegapixels(w, h);
      opt.textContent = `${w} × ${h}  (${mp} MP)`;
      if (w === selectedW && h === selectedH) {
        opt.selected = true;
      }
      selPixResolution.appendChild(opt);
    });
    selPixResolution.value = `${selectedW}x${selectedH}`;
    if (!selPixResolution.value && sizes.length > 0) {
      const highest = getHighestPixaromaSize(ratio);
      selPixResolution.value = `${highest[0]}x${highest[1]}`;
    }
  }

  if (selPixResolution) {
    selPixResolution.addEventListener("change", () => {
      const parts = selPixResolution.value.split("x");
      if (parts.length === 2) {
        currentPixW = parseInt(parts[0], 10);
        currentPixH = parseInt(parts[1], 10);
        updateAspectBadge();
        saveState();
      }
    });
  }

  function setPixMode(mode, ratio) {
    currentPixMode = mode;
    if (pixResChips) {
      pixResChips.querySelectorAll(".pix-res-chip").forEach(chip => {
        const cMode = chip.getAttribute("data-mode");
        const cRatio = chip.getAttribute("data-ratio");
        if (mode === "preset") {
          chip.classList.toggle("active", cMode === "preset" && cRatio === ratio);
        } else {
          chip.classList.toggle("active", cMode === mode);
        }
      });
    }

    if (mode === "preset") {
      if (pixResDropdownWrap) pixResDropdownWrap.style.display = "flex";
      if (pixCustomRatioPanel) pixCustomRatioPanel.style.display = "none";
      if (pixCustomResPanel) pixCustomResPanel.style.display = "none";
      currentPixRatio = ratio || currentPixRatio;
      const sizes = PIXAROMA_SIZES[currentPixRatio] || [];
      const match = sizes.find(([w, h]) => w === currentPixW && h === currentPixH);
      if (!match) {
        const def = PIXAROMA_DEFAULTS[currentPixRatio] || getHighestPixaromaSize(currentPixRatio);
        currentPixW = def[0];
        currentPixH = def[1];
      }
      renderPresetDropdown(currentPixRatio, currentPixW, currentPixH);
    } else if (mode === "custom_ratio") {
      if (pixResDropdownWrap) pixResDropdownWrap.style.display = "none";
      if (pixCustomRatioPanel) pixCustomRatioPanel.style.display = "flex";
      if (pixCustomResPanel) pixCustomResPanel.style.display = "none";
      syncCustomRatioUI();
    } else if (mode === "custom_res") {
      if (pixResDropdownWrap) pixResDropdownWrap.style.display = "none";
      if (pixCustomRatioPanel) pixCustomRatioPanel.style.display = "none";
      if (pixCustomResPanel) pixCustomResPanel.style.display = "flex";
      syncCustomResUI();
    }
    updateAspectBadge();
    saveState();
  }

  function evalSafeMath(val, fallback) {
    if (typeof val === "number") return val;
    if (!val) return fallback;
    const s = String(val).trim();
    if (/^[0-9+\-*/().\s]+$/.test(s)) {
      try {
        const res = Function(`"use strict"; return (${s})`)();
        if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
          return Math.round(res);
        }
      } catch (e) {}
    }
    const parsed = parseInt(s, 10);
    return (!isNaN(parsed) && isFinite(parsed)) ? parsed : fallback;
  }

  function syncCustomRatioUI() {
    if (!inpCustomRatioW || !inpCustomRatioH) return;
    inpCustomRatioW.value = currentCustomRatioW;
    inpCustomRatioH.value = currentCustomRatioH;
    inpRatioDriverW.value = currentPixW;
    inpRatioDriverH.value = currentPixH;
    const mp = calcMegapixels(currentPixW, currentPixH);
    const rl = `${currentCustomRatioW}:${currentCustomRatioH}`;
    if (lblRatioReadout) lblRatioReadout.textContent = `${rl} • ${mp} MP`;
    updatePreviewRect(previewRectRatio, previewLabelRatio, currentPixW, currentPixH);
  }

  function syncCustomResUI() {
    if (!inpCustomResW || !inpCustomResH) return;
    inpCustomResW.value = currentPixW;
    inpCustomResH.value = currentPixH;
    const mp = calcMegapixels(currentPixW, currentPixH);
    const rl = calcRatioLabel(currentPixW, currentPixH);
    if (lblResReadout) lblResReadout.textContent = `${rl} • ${mp} MP`;
    updatePreviewRect(previewRectRes, previewLabelRes, currentPixW, currentPixH);
  }

  function updateRatioFromW(rawW) {
    const rw = currentCustomRatioW || 16;
    const rh = currentCustomRatioH || 9;
    const snappedW = clampDim(snapTo(rawW, currentSnap));
    const snappedH = clampDim(snapTo(Math.round((snappedW * rh) / rw), currentSnap));
    currentPixW = snappedW;
    currentPixH = snappedH;
    syncCustomRatioUI();
    updateAspectBadge();
    saveState();
  }

  function updateRatioFromH(rawH) {
    const rw = currentCustomRatioW || 16;
    const rh = currentCustomRatioH || 9;
    const snappedH = clampDim(snapTo(rawH, currentSnap));
    const snappedW = clampDim(snapTo(Math.round((snappedH * rw) / rh), currentSnap));
    currentPixW = snappedW;
    currentPixH = snappedH;
    syncCustomRatioUI();
    updateAspectBadge();
    saveState();
  }

  // Ratio Chips Click
  if (pixResChips) {
    pixResChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".pix-res-chip");
      if (!chip) return;
      const mode = chip.getAttribute("data-mode");
      const ratio = chip.getAttribute("data-ratio");
      setPixMode(mode, ratio);
    });
  }

  // Batch Stepper
  function setBatchSize(val) {
    const num = Math.max(1, Math.min(64, parseInt(val, 10) || 1));
    currentBatchSize = num;
    if (inpBatchVal) inpBatchVal.value = num;
    saveState();
  }

  if (btnBatchDec) {
    btnBatchDec.addEventListener("click", () => setBatchSize(currentBatchSize - 1));
  }
  if (btnBatchInc) {
    btnBatchInc.addEventListener("click", () => setBatchSize(currentBatchSize + 1));
  }
  if (inpBatchVal) {
    inpBatchVal.addEventListener("change", () => setBatchSize(inpBatchVal.value));
  }

  // Custom Ratio Controls
  if (btnSwapRatio) {
    btnSwapRatio.addEventListener("click", () => {
      const tmp = currentCustomRatioW;
      currentCustomRatioW = currentCustomRatioH;
      currentCustomRatioH = tmp;
      updateRatioFromW(currentPixW);
    });
  }
  if (inpCustomRatioW) {
    inpCustomRatioW.addEventListener("change", () => {
      currentCustomRatioW = Math.max(1, parseInt(inpCustomRatioW.value, 10) || 16);
      updateRatioFromW(currentPixW);
    });
  }
  if (inpCustomRatioH) {
    inpCustomRatioH.addEventListener("change", () => {
      currentCustomRatioH = Math.max(1, parseInt(inpCustomRatioH.value, 10) || 9);
      updateRatioFromW(currentPixW);
    });
  }
  if (inpRatioDriverW) {
    inpRatioDriverW.addEventListener("change", () => {
      const w = evalSafeMath(inpRatioDriverW.value, currentPixW);
      updateRatioFromW(w);
    });
  }
  if (inpRatioDriverH) {
    inpRatioDriverH.addEventListener("change", () => {
      const h = evalSafeMath(inpRatioDriverH.value, currentPixH);
      updateRatioFromH(h);
    });
  }
  if (snapBtnsRatio) {
    snapBtnsRatio.addEventListener("click", (e) => {
      const btn = e.target.closest(".pix-snap-btn");
      if (!btn) return;
      snapBtnsRatio.querySelectorAll(".pix-snap-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSnap = parseInt(btn.getAttribute("data-snap"), 10) || 16;
      updateRatioFromW(currentPixW);
    });
  }
  document.querySelectorAll(".pix-quickpick").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pix-quickpick").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const w = parseInt(btn.getAttribute("data-w"), 10) || 1024;
      updateRatioFromW(w);
    });
  });

  // Custom Resolution Controls
  if (btnSwapRes) {
    btnSwapRes.addEventListener("click", () => {
      const tmp = currentPixW;
      currentPixW = currentPixH;
      currentPixH = tmp;
      syncCustomResUI();
      updateAspectBadge();
      saveState();
    });
  }
  if (inpCustomResW) {
    inpCustomResW.addEventListener("change", () => {
      const w = clampDim(snapTo(evalSafeMath(inpCustomResW.value, currentPixW), currentSnap));
      currentPixW = w;
      syncCustomResUI();
      updateAspectBadge();
      saveState();
    });
  }
  if (inpCustomResH) {
    inpCustomResH.addEventListener("change", () => {
      const h = clampDim(snapTo(evalSafeMath(inpCustomResH.value, currentPixH), currentSnap));
      currentPixH = h;
      syncCustomResUI();
      updateAspectBadge();
      saveState();
    });
  }
  if (snapBtnsRes) {
    snapBtnsRes.addEventListener("click", (e) => {
      const btn = e.target.closest(".pix-snap-btn");
      if (!btn) return;
      snapBtnsRes.querySelectorAll(".pix-snap-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSnap = parseInt(btn.getAttribute("data-snap"), 10) || 16;
      currentPixW = clampDim(snapTo(currentPixW, currentSnap));
      currentPixH = clampDim(snapTo(currentPixH, currentSnap));
      syncCustomResUI();
      updateAspectBadge();
      saveState();
    });
  }

  function persistCustomResPresets() {
    try {
      localStorage.setItem("tAStudio.customResPresets", JSON.stringify(savedCustomResolutions));
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_res_presets: savedCustomResolutions })
      }).catch(() => {});
    } catch (_) {}
  }

  function renderCustomResChips() {
    if (!customResChips) return;
    customResChips.innerHTML = "";
    savedCustomResolutions.forEach((item, idx) => {
      const chip = document.createElement("div");
      chip.style.cssText = "display:inline-flex;align-items:center;gap:4px;";
      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "pix-snap-btn";
      applyBtn.style.cssText = "padding:3px 7px;";
      const mp = ((item.w * item.h) / 1e6).toFixed(1);
      const ratio = calcRatioLabel(item.w, item.h);
      applyBtn.textContent = `${item.w}×${item.h} · ${ratio} (${mp}MP)`;
      applyBtn.title = t("custom_res_snap_title", "Snap {snap}").replace("{snap}", item.snap || 16);
      applyBtn.addEventListener("click", () => {
        currentPixW = clampDim(parseInt(item.w, 10) || currentPixW);
        currentPixH = clampDim(parseInt(item.h, 10) || currentPixH);
        if (item.snap) {
          currentSnap = parseInt(item.snap, 10) || 16;
          [snapBtnsRatio, snapBtnsRes].forEach(group => {
            if (group) {
              group.querySelectorAll(".pix-snap-btn").forEach(b => {
                b.classList.toggle("active", parseInt(b.getAttribute("data-snap"), 10) === currentSnap);
              });
            }
          });
        }
        syncCustomResUI();
        updateAspectBadge();
        saveState();
      });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "pix-snap-btn";
      delBtn.style.cssText = "padding:2px 5px;opacity:0.7;";
      delBtn.textContent = "×";
      delBtn.title = t("pix_remove_custom_res", "Preset entfernen");
      delBtn.addEventListener("click", () => {
        savedCustomResolutions.splice(idx, 1);
        renderCustomResChips();
        persistCustomResPresets();
        saveState();
      });
      chip.appendChild(applyBtn);
      chip.appendChild(delBtn);
      customResChips.appendChild(chip);
    });
  }

  if (btnSaveCustomRes) {
    btnSaveCustomRes.addEventListener("click", () => {
      const w = clampDim(snapTo(evalSafeMath(inpCustomResW ? inpCustomResW.value : currentPixW, currentPixW), currentSnap));
      const h = clampDim(snapTo(evalSafeMath(inpCustomResH ? inpCustomResH.value : currentPixH, currentPixH), currentSnap));
      currentPixW = w;
      currentPixH = h;
      syncCustomResUI();
      updateAspectBadge();
      const exists = savedCustomResolutions.some(r => r.w === w && r.h === h && (r.snap || 16) === currentSnap);
      if (!exists) {
        savedCustomResolutions.push({ w, h, snap: currentSnap });
        renderCustomResChips();
        persistCustomResPresets();
      }
      saveState();
    });
  }

  // 5. Seed Pills
  function updateSeedBadge(mode) {
    if (!seedValBadge) return;
    const map = {
      randomize: ["seed_badge_random", "Zufall"],
      fixed: ["seed_badge_fixed", "Fest"],
      last: ["seed_badge_last", "Wiederholen"],
    };
    const [key, fallback] = map[mode] || map.randomize;
    seedValBadge.setAttribute("data-i18n", key);
    seedValBadge.textContent = t(key, fallback);
  }

  seedPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;
    seedPills.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.getAttribute("data-seedmode");
    updateSeedBadge(mode);
    if (txtSeed) txtSeed.disabled = (mode === "randomize");
    saveState();
  });

  // 6. Range Sliders
  if (rngSharpen && sharpenVal) {
    rngSharpen.addEventListener("input", (e) => {
      sharpenVal.textContent = parseFloat(e.target.value).toFixed(2);
  saveStateDebounced();
    });
  }
  if (rngFlux && fluxVal) {
    rngFlux.addEventListener("input", (e) => {
      fluxVal.textContent = parseFloat(e.target.value).toFixed(1);
  saveStateDebounced();
    });
  }

  // 7. Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // LLM Engine State & Actions
  const VISION_MODEL_PATTERNS = [
    "vision", "-vl", "_vl", "qwen3.5", "qwen3.6", "qwen3.8",
    "qwen2.5-vl", "qwen2-vl", "gemma-3", "pixtral", "llava",
    "internvl", "minicpm-v", "gemini/", "gpt-4o"
  ];
  function isVisionModel(name) {
    const low = String(name || "").toLowerCase();
    return VISION_MODEL_PATTERNS.some(p => low.includes(p));
  }
  function formatLLMModelLabel(name) {
    const s = String(name || "");
    if (!s) return "";
    if (isVisionModel(s) && !s.toLowerCase().includes("[vision]")) {
      return `${s} [Vision]`;
    }
    return s;
  }

  let currentLLMMode = "off"; // "off", "t2i", "i2i"
  let currentI2IImageFilename = "";
  let llmModelsByMode = { t2i: "", i2i: "" };
  let hasLLMStatusChecked = false;
  let lastLLMStatus = { lm_studio: false, ollama: false, cloud: false, cloud_providers: [], reachable: false };

  function getLLMModelProviderInfo(modelName) {
    const low = String(modelName || "").trim().toLowerCase();
    if (low.startsWith("lmstudio/")) return { key: "lm_studio", label: "LM Studio" };
    if (low.startsWith("ollama/")) return { key: "ollama", label: "Ollama" };
    if (low.startsWith("gemini/")) return { key: "cloud:Gemini", label: "Gemini" };
    if (low.startsWith("openai/")) return { key: "cloud:OpenAI", label: "OpenAI" };
    if (low.startsWith("openrouter/")) return { key: "cloud:OpenRouter", label: "OpenRouter" };
    if (low.startsWith("groq/")) return { key: "cloud:Groq", label: "Groq" };
    if (
      low.startsWith("anthropic/") || low.startsWith("claude/") ||
      low.startsWith("deepseek/") || low.startsWith("mistral/") ||
      low.startsWith("xai/") || low.startsWith("cloud/")
    ) {
      return { key: "cloud", label: "Cloud" };
    }
    return { key: "any", label: "LLM" };
  }

  function isLLMModelAvailable(modelName, status = lastLLMStatus) {
    if (!status) return false;
    const { key } = getLLMModelProviderInfo(modelName);
    if (key === "lm_studio") return Boolean(status.lm_studio);
    if (key === "ollama") return Boolean(status.ollama);
    if (key.startsWith("cloud:")) {
      const provider = key.slice(6);
      if (Array.isArray(status.cloud_providers)) {
        return status.cloud_providers.includes(provider);
      }
      return Boolean(status.cloud);
    }
    if (key === "cloud") return Boolean(status.cloud);
    return Boolean(status.lm_studio || status.ollama || status.cloud);
  }

  function findBestAvailableLLMModel(mode = currentLLMMode, status = lastLLMStatus) {
    if (!selLLMModel || !selLLMModel.options.length) return "";
    const availableOpts = Array.from(selLLMModel.options).filter(o => isLLMModelAvailable(o.value, status));
    if (availableOpts.length === 0) return "";
    if (mode === "i2i") {
      const visionOpt = availableOpts.find(o => isVisionModel(o.value));
      return visionOpt ? visionOpt.value : availableOpts[0].value;
    }
    const textOpt = availableOpts.find(o => !isVisionModel(o.value));
    return textOpt ? textOpt.value : availableOpts[0].value;
  }

  function updateLLMModelBadge(status = lastLLMStatus) {
    if (!llmModelBadge) return;
    if (!hasLLMStatusChecked) {
      if (currentLLMMode === "t2i") {
        llmModelBadge.textContent = t("badge_llm_text_model", "Text-Modell");
        llmModelBadge.style.color = "var(--accent)";
      } else if (currentLLMMode === "i2i") {
        llmModelBadge.textContent = t("badge_llm_vision_model", "Vision-Modell");
        llmModelBadge.style.color = "var(--accent2)";
      } else {
        llmModelBadge.textContent = t("badge_llm_ready_inactive", "Bereit (Inaktiv)");
        llmModelBadge.style.color = "";
      }
      return;
    }

    const reachable = Boolean(status && status.reachable);
    const selectedModel = selLLMModel ? selLLMModel.value : "";
    const modelAvail = isLLMModelAvailable(selectedModel, status);
    const { label: providerLabel } = getLLMModelProviderInfo(selectedModel);

    if (currentLLMMode === "off") {
      if (!reachable) {
        llmModelBadge.textContent = t("badge_llm_offline", "⚠️ Kein LLM aktiv!");
        llmModelBadge.style.color = "var(--danger)";
      } else if (!modelAvail && selectedModel) {
        llmModelBadge.textContent = t("badge_llm_provider_offline", "⚠️ {provider} offline!").replace("{provider}", providerLabel);
        llmModelBadge.style.color = "var(--danger)";
      } else {
        llmModelBadge.textContent = t("badge_llm_ready_inactive", "Bereit (Inaktiv)");
        llmModelBadge.style.color = "";
      }
      return;
    }

    if (modelAvail) {
      const typeName = (currentLLMMode === "i2i")
        ? t("badge_llm_vision_model", "Vision-Modell")
        : t("badge_llm_text_model", "Text-Modell");
      llmModelBadge.textContent = `● ${typeName} (${t("badge_llm_online", "Online")})`;
      llmModelBadge.style.color = "#4ade80";
    } else if (reachable && selectedModel) {
      llmModelBadge.textContent = t("badge_llm_provider_offline", "⚠️ {provider} offline!").replace("{provider}", providerLabel);
      llmModelBadge.style.color = "var(--danger)";
    } else {
      llmModelBadge.textContent = t("badge_llm_offline", "⚠️ Kein LLM aktiv!");
      llmModelBadge.style.color = "var(--danger)";
    }
  }

  function updateLLMModeUI(mode = currentLLMMode) {
    if (llmModePills) {
      llmModePills.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-llmmode") === mode);
      });
    }
    if (llmStatusBadge) {
      if (mode === "t2i") {
        llmStatusBadge.textContent = t("badge_llm_t2i", "✨ Text2Prompt (T2I) Aktiv");
        llmStatusBadge.style.color = "var(--accent)";
      } else if (mode === "i2i") {
        llmStatusBadge.textContent = t("badge_llm_i2i", "🖼️ Image2Prompt (I2I) Aktiv");
        llmStatusBadge.style.color = "var(--accent2)";
      } else {
        llmStatusBadge.textContent = t("badge_llm_off", "Aus (Manuell)");
        llmStatusBadge.style.color = "";
      }
    }
    if (llmModelBadge) {
      if (mode === "t2i") {
        llmModelBadge.textContent = t("badge_llm_text_model", "Text-Modell");
        llmModelBadge.style.color = "var(--accent)";
      } else if (mode === "i2i") {
        llmModelBadge.textContent = t("badge_llm_vision_model", "Vision-Modell");
        llmModelBadge.style.color = "var(--accent2)";
      } else {
        llmModelBadge.textContent = t("badge_llm_ready_inactive", "Bereit (Inaktiv)");
        llmModelBadge.style.color = "";
      }
    }
    if (llmSettingsPanel) {
      llmSettingsPanel.style.display = "flex";
    }
    if (i2iUploadPanel) {
      i2iUploadPanel.style.display = (mode === "i2i") ? "block" : "none";
    }
    updateLLMSourceBadge();
  }

  function setLLMMode(mode) {
    if ((currentLLMMode === "t2i" || currentLLMMode === "i2i") && selLLMModel && selLLMModel.value) {
      llmModelsByMode[currentLLMMode] = selLLMModel.value;
    }
    currentLLMMode = mode;
    updateLLMModeUI(mode);
    applyLLMDefaultsForMode(mode, false);
    if (llmPromptResultGroup) {
      if (mode === "off") {
        llmPromptResultGroup.style.display = "none";
      } else if (txtLLMGeneratedPrompt && txtLLMGeneratedPrompt.value.trim() && !txtLLMGeneratedPrompt.value.startsWith("⏳")) {
        llmPromptResultGroup.style.display = "block";
      } else {
        llmPromptResultGroup.style.display = "none";
      }
    }
    // Restore per-mode remembered model, or pick an appropriate default only if none is remembered yet
    if (selLLMModel && selLLMModel.options.length > 0) {
      if (mode === "t2i" || mode === "i2i") {
        const remembered = llmModelsByMode[mode];
        const hasRemembered = remembered && Array.from(selLLMModel.options).some(o => o.value === remembered);
        if (hasRemembered && (!hasLLMStatusChecked || isLLMModelAvailable(remembered, lastLLMStatus))) {
          selLLMModel.value = remembered;
        } else {
          const bestAvail = hasLLMStatusChecked ? findBestAvailableLLMModel(mode, lastLLMStatus) : "";
          if (bestAvail) {
            selLLMModel.value = bestAvail;
          } else if (hasRemembered) {
            selLLMModel.value = remembered;
          } else if (!remembered) {
            if (mode === "i2i") {
              const visionOpt = Array.from(selLLMModel.options).find(o => isVisionModel(o.value));
              selLLMModel.value = visionOpt ? visionOpt.value : selLLMModel.options[0].value;
            } else {
              const textOpt = Array.from(selLLMModel.options).find(o => !isVisionModel(o.value));
              selLLMModel.value = textOpt ? textOpt.value : selLLMModel.options[0].value;
            }
          }
          llmModelsByMode[mode] = selLLMModel.value;
        }
      }
    }
    updateLLMSourceBadge();
    updateLLMModelBadge();
    // Live-check if LLM server is actually running
    checkLLMStatus();
    // Auto-adjust Prompt Controller mode when LLM is switched
    if (selPromptControllerMode) {
      selPromptControllerMode.value = (mode === "t2i" || mode === "i2i") ? "Generated Only" : "Manual Only";
      updatePromptControllerBadge();
    }
    saveStateDebounced();
  }

  if (llmModePills) {
    llmModePills.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn || btn.disabled) return;
      const mode = btn.getAttribute("data-llmmode") || "off";
      setLLMMode(mode);
    });
  }

  function setI2IStatusState(state) {
    if (!lblI2IStatus) return;
    if (state === "uploading") {
      lblI2IStatus.setAttribute("data-i18n", "i2i_uploading");
      lblI2IStatus.textContent = t("i2i_uploading", "⏳ Wird an ComfyUI gesendet...");
      lblI2IStatus.style.color = "var(--text-muted)";
    } else if (state === "error") {
      lblI2IStatus.setAttribute("data-i18n", "i2i_upload_failed_status");
      lblI2IStatus.textContent = t("i2i_upload_failed_status", "✗ Upload fehlgeschlagen (nicht in ComfyUI)");
      lblI2IStatus.style.color = "#ef4444";
    } else {
      lblI2IStatus.setAttribute("data-i18n", "i2i_loaded");
      lblI2IStatus.textContent = t("i2i_loaded", "✓ In ComfyUI geladen (Node 1880)");
      lblI2IStatus.style.color = "var(--accent2)";
    }
  }

  // I2I Upload Handler
  async function uploadI2IImage(file) {
    if (!file) return;
    if (file.size === 0) {
      showToast(t("toast_i2i_empty", "Die gewählte Bilddatei ist leer (0 Bytes) und kann nicht verwendet werden."), "error", 4500);
      return;
    }

    currentI2IImageFilename = "";
    // 1. Instant local preview in both thumbnail and main viewer
    const localBlobUrl = URL.createObjectURL(file);
    if (imgI2IThumb) imgI2IThumb.src = localBlobUrl;
    if (lblI2IFilename) lblI2IFilename.textContent = file.name;
    if (i2iEmptyState) i2iEmptyState.style.display = "none";
    if (i2iPreviewState) i2iPreviewState.style.display = "flex";
    if (i2iFileNameBadge) i2iFileNameBadge.textContent = t("badge_uploading", "Wird hochgeladen...");
    setI2IStatusState("uploading");

    if (mainPreview) {
      mainPreview.src = localBlobUrl;
      mainPreview.style.display = "block";
      const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
      if (emptyState) emptyState.style.display = "none";
      activeImageMeta = {
        filename: file.name,
        url: localBlobUrl,
        prompt: "",
        additional_prompt: "",
        neg_prompt: "",
        seed: "",
      };
    }

    // 2. Upload to ComfyUI /upload/image (for Node 1880 Load Image)
    const formData = new FormData();
    formData.append("image", file);
    formData.append("overwrite", "true");

    try {
      const resp = await fetch("/upload/image", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        const uploadedName = data.name;
        currentI2IImageFilename = uploadedName;
        if (lblI2IFilename) lblI2IFilename.textContent = uploadedName;
        if (i2iFileNameBadge) i2iFileNameBadge.textContent = uploadedName;
        setI2IStatusState("loaded");
        saveState();
        showToast(t("toast_i2i_uploaded", `I2I-Referenzbild "${uploadedName}" geladen & in ComfyUI bereitgestellt!`).replace("{filename}", uploadedName), "success", 3500);
      } else {
        currentI2IImageFilename = "";
        setI2IStatusState("error");
        saveState();
        showToast(t("toast_i2i_upload_fail", "Fehler beim Hochladen nach ComfyUI (ist ComfyUI online?)"), "error", 4500);
        if (i2iFileNameBadge) i2iFileNameBadge.textContent = t("badge_error", "Fehler");
      }
    } catch (e) {
      console.error("I2I upload failed:", e);
      currentI2IImageFilename = "";
      setI2IStatusState("error");
      saveState();
      showToast(t("toast_i2i_upload_fail", "Verbindungsfehler beim Hochladen nach ComfyUI."), "error", 4500);
      if (i2iFileNameBadge) i2iFileNameBadge.textContent = t("badge_error", "Fehler");
    }
  }

  function clearI2IImage() {
    currentI2IImageFilename = "";
    if (inpI2IFile) inpI2IFile.value = "";
    if (lblI2IFilename) lblI2IFilename.textContent = "";
    if (i2iFileNameBadge) i2iFileNameBadge.textContent = t("badge_no_image", "Kein Bild gewählt");
    if (imgI2IThumb) imgI2IThumb.src = "";
    if (i2iEmptyState) i2iEmptyState.style.display = "block";
    if (i2iPreviewState) i2iPreviewState.style.display = "none";
    saveState();
  }

  if (i2iEmptyState && inpI2IFile) {
    i2iEmptyState.addEventListener("click", () => inpI2IFile.click());
    inpI2IFile.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadI2IImage(e.target.files[0]);
      }
    });
  }

  if (btnRemoveI2I) {
    btnRemoveI2I.addEventListener("click", (e) => {
      e.stopPropagation();
      clearI2IImage();
    });
  }

  if (imgI2IThumb) {
    imgI2IThumb.addEventListener("click", () => {
      if (imgI2IThumb.src && mainPreview) {
        mainPreview.src = imgI2IThumb.src;
        mainPreview.style.display = "block";
        const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
        if (emptyState) emptyState.style.display = "none";
      }
    });
  }

  if (btnAdoptPreviewAsI2I) {
    btnAdoptPreviewAsI2I.addEventListener("click", async () => {
      if (!mainPreview || !mainPreview.src || mainPreview.src.includes("mockup")) {
        showToast(t("toast_no_preview_image", "Kein Bild in der Vorschau vorhanden."), "error", 3000);
        return;
      }
      try {
        const resp = await fetch(mainPreview.src);
        if (!resp.ok) throw new Error(t("err_image_load_failed", "Konnte Bild nicht laden"));
        const blob = await resp.blob();
        const ext = blob.type.split("/")[1] || "png";
        const fname = (activeImageMeta && activeImageMeta.filename)
          ? (activeImageMeta.filename.includes(".") ? activeImageMeta.filename : `${activeImageMeta.filename}.${ext}`)
          : `ref_${Date.now()}.${ext}`;
        const file = new File([blob], fname, { type: blob.type });
        uploadI2IImage(file);
      } catch (err) {
        showToast(t("toast_i2i_adopt_error", "Fehler beim Übernehmen aus der Vorschau: ") + err.message, "error", 4000);
      }
    });
  }

  if (i2iDropzone) {
    i2iDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      i2iDropzone.classList.add("dragover");
    });
    i2iDropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      i2iDropzone.classList.remove("dragover");
    });
    i2iDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      i2iDropzone.classList.remove("dragover");
      if (dropOverlay) dropOverlay.classList.remove("active");
      windowDragCounter = 0;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadI2IImage(e.dataTransfer.files[0]);
      }
    });
  }

  function updateLLMSourceBadge() {
    if (!llmSourceBadge || !selLLMModel) return;
    const m = (selLLMModel.value || "").trim().toLowerCase();
    const isCloud =
      m.startsWith("gemini/") ||
      m.startsWith("openai/") ||
      m.startsWith("openrouter/") ||
      m.startsWith("groq/") ||
      m.startsWith("anthropic/") ||
      m.startsWith("claude/") ||
      m.startsWith("deepseek/") ||
      m.startsWith("mistral/") ||
      m.startsWith("xai/") ||
      m.startsWith("cloud/");
    if (isCloud) {
      llmSourceBadge.textContent = t("badge_llm_source_cloud", "☁️ Cloud");
      llmSourceBadge.style.color = "#60a5fa";
      llmSourceBadge.style.background = "rgba(96, 165, 250, 0.10)";
      llmSourceBadge.style.borderColor = "rgba(96, 165, 250, 0.28)";
    } else {
      llmSourceBadge.textContent = t("badge_llm_source_local", "🖥️ Lokal");
      llmSourceBadge.style.color = "var(--accent2)";
      llmSourceBadge.style.background = "rgba(51, 214, 166, 0.08)";
      llmSourceBadge.style.borderColor = "rgba(51, 214, 166, 0.2)";
    }
    syncLLMModelCombobox();
  }

  let llmModelHighlightIdx = -1;

  function syncLLMModelCombobox() {
    if (!selLLMModel || !llmModelTriggerLabel) return;
    const selectedOpt = selLLMModel.options[selLLMModel.selectedIndex];
    const labelText = selectedOpt ? selectedOpt.textContent : (selLLMModel.value || "");
    llmModelTriggerLabel.textContent = labelText;
    llmModelTriggerLabel.title = labelText;
    if (llmModelMenu && llmModelMenu.style.display !== "none") {
      renderLLMModelList();
    }
  }

  function renderLLMModelList() {
    if (!selLLMModel || !llmModelList) return;
    const query = (inpLLMModelSearch ? inpLLMModelSearch.value : "").trim().toLowerCase();
    if (btnClearLLMModelSearch) {
      btnClearLLMModelSearch.style.display = query ? "inline-block" : "none";
    }
    const terms = query ? query.split(/\s+/).filter(Boolean) : [];
    const options = Array.from(selLLMModel.options);
    const filtered = terms.length > 0
      ? options.filter(o => {
          const hay = (o.textContent + " " + o.value).toLowerCase();
          return terms.every(term => hay.includes(term));
        })
      : options;

    llmModelList.innerHTML = "";
    llmModelHighlightIdx = -1;

    if (filtered.length === 0) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "llm-combo-empty";
      emptyEl.textContent = t("llm_model_none_found", "Keine passenden Modelle gefunden.");
      llmModelList.appendChild(emptyEl);
      return;
    }

    filtered.forEach((opt, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "llm-combo-item";
      const avail = !hasLLMStatusChecked || isLLMModelAvailable(opt.value, lastLLMStatus);
      if (!avail) {
        item.classList.add("is-offline");
        const { label: providerLabel } = getLLMModelProviderInfo(opt.value);
        item.title = t("badge_llm_provider_offline", "⚠️ {provider} offline!").replace("{provider}", providerLabel);
      }
      if (opt.value === selLLMModel.value) {
        item.classList.add("is-selected");
        llmModelHighlightIdx = idx;
      }
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", opt.value === selLLMModel.value ? "true" : "false");
      item.dataset.value = opt.value;
      const lblSpan = document.createElement("span");
      lblSpan.textContent = opt.textContent;
      item.appendChild(lblSpan);
      if (!avail) {
        const tag = document.createElement("span");
        tag.className = "llm-combo-offline-tag";
        tag.textContent = "offline";
        item.appendChild(tag);
      }
      item.addEventListener("click", () => {
        selLLMModel.value = opt.value;
        selLLMModel.dispatchEvent(new Event("change"));
        closeLLMModelMenu();
      });
      llmModelList.appendChild(item);
    });
  }

  function openLLMModelMenu() {
    if (!llmModelCombo || !llmModelMenu || !btnLLMModelTrigger) return;
    llmModelCombo.classList.add("is-open");
    llmModelMenu.style.display = "block";
    btnLLMModelTrigger.setAttribute("aria-expanded", "true");
    if (inpLLMModelSearch) {
      inpLLMModelSearch.value = "";
    }
    renderLLMModelList();
    if (inpLLMModelSearch) {
      setTimeout(() => inpLLMModelSearch.focus(), 0);
    }
    const selItem = llmModelList && llmModelList.querySelector(".llm-combo-item.is-selected");
    if (selItem) {
      selItem.scrollIntoView({ block: "nearest" });
    }
  }

  function closeLLMModelMenu() {
    if (!llmModelCombo || !llmModelMenu || !btnLLMModelTrigger) return;
    llmModelCombo.classList.remove("is-open");
    llmModelMenu.style.display = "none";
    btnLLMModelTrigger.setAttribute("aria-expanded", "false");
  }

  if (btnLLMModelTrigger) {
    btnLLMModelTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = llmModelMenu && llmModelMenu.style.display !== "none";
      if (isOpen) {
        closeLLMModelMenu();
      } else {
        openLLMModelMenu();
      }
    });
  }

  if (inpLLMModelSearch) {
    inpLLMModelSearch.addEventListener("input", () => {
      renderLLMModelList();
    });
    inpLLMModelSearch.addEventListener("keydown", (e) => {
      const items = llmModelList ? Array.from(llmModelList.querySelectorAll(".llm-combo-item")) : [];
      if (e.key === "Escape") {
        e.preventDefault();
        closeLLMModelMenu();
        if (btnLLMModelTrigger) btnLLMModelTrigger.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length === 0) return;
        llmModelHighlightIdx = (llmModelHighlightIdx + 1) % items.length;
        items.forEach((el, i) => el.classList.toggle("is-highlighted", i === llmModelHighlightIdx));
        items[llmModelHighlightIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;
        llmModelHighlightIdx = (llmModelHighlightIdx - 1 + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle("is-highlighted", i === llmModelHighlightIdx));
        items[llmModelHighlightIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items.length === 0) return;
        const target = items[llmModelHighlightIdx >= 0 ? llmModelHighlightIdx : 0];
        if (target) target.click();
      }
    });
  }

  if (btnClearLLMModelSearch) {
    btnClearLLMModelSearch.addEventListener("click", (e) => {
      e.stopPropagation();
      if (inpLLMModelSearch) {
        inpLLMModelSearch.value = "";
        inpLLMModelSearch.focus();
      }
      renderLLMModelList();
    });
  }

  document.addEventListener("click", (e) => {
    if (llmModelCombo && llmModelMenu && llmModelMenu.style.display !== "none" && !llmModelCombo.contains(e.target)) {
      closeLLMModelMenu();
    }
  });

  // LLM Models Fetcher
  async function loadLLMModelsFromComfy(preferredModel = null) {
    if (!selLLMModel) return;
    try {
      const res = await fetch("/api/llm_models");
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          const modeVal = (currentLLMMode === "t2i" || currentLLMMode === "i2i") ? llmModelsByMode[currentLLMMode] : "";
          const currentVal = modeVal || preferredModel || selLLMModel.value;
          selLLMModel.innerHTML = "";
          data.models.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = formatLLMModelLabel(m);
            if (m === currentVal) opt.selected = true;
            selLLMModel.appendChild(opt);
          });
          if (currentVal && data.models.includes(currentVal)) {
            selLLMModel.value = currentVal;
          } else if (data.models.length > 0) {
            selLLMModel.value = data.models[0];
          }
          if (hasLLMStatusChecked && !isLLMModelAvailable(selLLMModel.value, lastLLMStatus)) {
            const bestAvail = findBestAvailableLLMModel(currentLLMMode, lastLLMStatus);
            if (bestAvail) selLLMModel.value = bestAvail;
          }
          if ((currentLLMMode === "t2i" || currentLLMMode === "i2i") && !llmModelsByMode[currentLLMMode] && selLLMModel.value) {
            llmModelsByMode[currentLLMMode] = selLLMModel.value;
          }
          updateLLMSourceBadge();
          updateLLMModelBadge();
        }
      }
    } catch (e) {
      console.warn("Could not fetch LLM models:", e);
    }
  }

  // State Collection & Persistence
  function collectState() {
    const activeSeedMode = seedPills.querySelector(".pill-btn.active");

    // Sync current visible DOM states into master list first
    if (loraContainer) {
      loraContainer.querySelectorAll(".lora-item").forEach(item => {
        const toggle = item.querySelector(".lora-toggle");
        const range = item.querySelector(".lora-range");
        const badge = item.querySelector(".lora-badge");
        const name = item.getAttribute("data-lora");
        const target = fullLoraMasterList.find(m => m.name === name);
        if (target) {
          if (toggle) target.active = toggle.checked;
          if (range) target.strength = parseFloat(range.value);
          if (badge && badge.textContent) {
            target.trigger = badge.textContent.replace(/^Trigger:\s*/i, "").trim();
          }
        }
      });
    }

    const loras = fullLoraMasterList.map(l => ({
      name: l.name,
      active: Boolean(l.active),
      strength: l.strength !== undefined ? parseFloat(l.strength) : 1.0,
      clipStrength: l.clipStrength !== undefined ? parseFloat(l.clipStrength) : (parseFloat(l.strength) || 1.0),
      trigger: l.trigger || "",
      category: l.category || "",
    }));

    return {
      updated_at: Date.now(),
      model_preset: selModelPreset.value,
      plato_key: selPlatoKey ? selPlatoKey.value : "",
      sampler_preset: selSamplerPreset.value,
      prompt: txtPrompt ? txtPrompt.value : "",
      additional_prompt: txtAdditionalPrompt ? txtAdditionalPrompt.value : "",
      neg_prompt: txtNegPrompt ? txtNegPrompt.value : "",
      smart_llm: (currentLLMMode !== "off"),
      llm_mode: currentLLMMode,
      llm_model: selLLMModel ? selLLMModel.value : "",
      llm_models_by_mode: llmModelsByMode,
      llm_temperature: rngLLMTemp ? parseFloat(rngLLMTemp.value) : 0.7,
      llm_max_tokens: inpLLMMaxTokens ? (parseInt(inpLLMMaxTokens.value, 10) || 2048) : 2048,
      llm_request_timeout: inpLLMTimeout ? (parseInt(inpLLMTimeout.value, 10) || 120) : 120,
      llm_thinking_mode: chkLLMThinking ? chkLLMThinking.checked : false,
      llm_unload_image_models_first: chkLLMUnloadImgFirst ? chkLLMUnloadImgFirst.checked : true,
      llm_unload_llm_after: chkLLMUnloadAfter ? chkLLMUnloadAfter.checked : true,
      llm_system_prompt: txtLLMSystemPrompt ? txtLLMSystemPrompt.value : "",
      llm_user_prompt: txtLLMI2IUserPrompt ? txtLLMI2IUserPrompt.value : "",
      llm_prompts_by_model: llmPromptsByModel,
      llm_controller_mode: selPromptControllerMode ? selPromptControllerMode.value : "Generated Only",
      prompt_controller_mode: selPromptControllerMode ? selPromptControllerMode.value : "Manual Only",
      delimiter: inpDelimiter ? inpDelimiter.value : ", ",
      i2i_image: currentI2IImageFilename || "",
      batch_size: currentBatchSize,
      aspect_ratio: currentPixRatio,
      width: currentPixW,
      height: currentPixH,
      pix_mode: currentPixMode,
      custom_ratio_w: currentCustomRatioW,
      custom_ratio_h: currentCustomRatioH,
      snap: currentSnap,
      custom_res_presets: savedCustomResolutions,
      seedMode: activeSeedMode ? activeSeedMode.getAttribute("data-seedmode") : "randomize",
      seed: txtSeed ? txtSeed.value : "",
      flux_guidance: rngFlux ? parseFloat(rngFlux.value) : 3.5,
      sharpen_enabled: chkSharpen ? chkSharpen.checked : true,
      sharpen: rngSharpen ? parseFloat(rngSharpen.value) : 0.26,
      sve_enabled: chkSVE ? chkSVE.checked : false,
      sve_auto: chkSVEAuto ? chkSVEAuto.checked : true,
      sve_strength: inpSVEStrength ? (parseFloat(inpSVEStrength.value) || 0.35) : 0.35,
      sve_randomize_percent: inpSVERandPct ? (parseFloat(inpSVERandPct.value) || 50) : 50,
      sve_noise_insert: selSVENoiseInsert ? selSVENoiseInsert.value : "noise on beginning steps",
      sve_steps_switchover_percent: inpSVESwitchPct ? (parseFloat(inpSVESwitchPct.value) || 15) : 15,
      sve_mask_starts_at: selSVEMaskStart ? selSVEMaskStart.value : "beginning",
      sve_mask_percent: inpSVEMaskPct ? (parseFloat(inpSVEMaskPct.value) || 0) : 0,
      film_grain_enabled: chkFilmGrain ? chkFilmGrain.checked : false,
      film_grain_gray_scale: chkFilmGrainGray ? chkFilmGrainGray.checked : false,
      film_grain_type: selFilmGrainType ? selFilmGrainType.value : "Fine",
      film_grain_sat: rngFilmGrainSat ? parseFloat(rngFilmGrainSat.value) : 0.15,
      film_grain_power: rngFilmGrainPower ? parseFloat(rngFilmGrainPower.value) : 0.40,
      film_grain_shadows: rngFilmGrainShadows ? parseFloat(rngFilmGrainShadows.value) : 0.20,
      film_grain_highs: rngFilmGrainHighs ? parseFloat(rngFilmGrainHighs.value) : 0.20,
      film_grain_scale: rngFilmGrainScale ? parseFloat(rngFilmGrainScale.value) : 0.65,
      film_grain_sharpen: rngFilmGrainSharpen ? (parseInt(rngFilmGrainSharpen.value, 10) || 0) : 0,
      film_grain_src_gamma: rngFilmGrainGamma ? parseFloat(rngFilmGrainGamma.value) : 1.0,
      sage_enable: currentAttnEngine === "sage",
      torch_enable: chkTorchEnable ? chkTorchEnable.checked : false,
      sage_mode: selSageMode ? selSageMode.value : "sageattn_qk_int8_pv_fp16_cuda",
      kitchen_enable: currentAttnEngine === "kitchen",
      use_seed_vr2: chkSeedVR2 ? chkSeedVR2.checked : false,
      seedvr2_model: selSeedVR2Model ? selSeedVR2Model.value : "seedvr2_ema_7b_fp16.safetensors",
      seedvr2_resolution: inpSeedVR2Res ? (parseInt(inpSeedVR2Res.value, 10) || 3840) : 3840,
      seedvr2_max_resolution: inpSeedVR2MaxRes ? (parseInt(inpSeedVR2MaxRes.value, 10) || 3840) : 3840,
      seedvr2_color_correction: selSeedVR2ColorCorr ? selSeedVR2ColorCorr.value : "lab",
      seedvr2_blocks_to_swap: inpSeedVR2Blocks ? (parseInt(inpSeedVR2Blocks.value, 10) || 0) : 15,
      seedvr2_attention_mode: selSeedVR2Attn ? selSeedVR2Attn.value : "sageattn_2",
      seedvr2_input_noise_scale: inpSeedVR2InNoise ? (parseFloat(inpSeedVR2InNoise.value) || 0) : 0,
      seedvr2_latent_noise_scale: inpSeedVR2LatNoise ? (parseFloat(inpSeedVR2LatNoise.value) || 0) : 0,
      seedvr2_tiled: chkSeedVR2Tiled ? chkSeedVR2Tiled.checked : true,
      seedvr2_cache_model: chkSeedVR2Cache ? chkSeedVR2Cache.checked : false,
      save_format: selSaveFormat ? selSaveFormat.value : "webp",
      save_txt_main: chkSaveTxtMain ? chkSaveTxtMain.checked : true,
      extra_save_enabled: chkExtraSave ? chkExtraSave.checked : false,
      extra_save_format: selExtraSaveFormat ? selExtraSaveFormat.value : "webp",
      extra_save_quality: selExtraSaveQuality ? selExtraSaveQuality.value : "95",
      extra_save_txt: chkExtraSaveTxt ? chkExtraSaveTxt.checked : false,
      fn_output_folder: inpFnOutputFolder ? inpFnOutputFolder.value : "",
      fn_subfolder: inpFnSubfolder ? inpFnSubfolder.value : "",
      fn_extra_subfolder: inpExtraSaveSubfolder ? inpExtraSaveSubfolder.value : "JPEG",
      fn_name_prefix: inpFnPrefix ? inpFnPrefix.value : "",
      fn_wf_version: inpFnWfVersion ? inpFnWfVersion.value : "TA-FLEXMOD",
      fn_upscaled_suffix: inpFnUpscaledSuffix ? inpFnUpscaledSuffix.value : "UPSCALED",
      fn_delimiter: inpFnDelimiter ? inpFnDelimiter.value : "-",
      fn_date_format: inpFnDateFormat ? inpFnDateFormat.value : "%Y%m%d%H%M",
      overlay_ai_enabled: chkOverlayAI ? chkOverlayAI.checked : false,
      overlay_ai_text: txtOverlayAI ? txtOverlayAI.value : "Created with AI '26",
      overlay_ai_font: selOverlayAIFont ? selOverlayAIFont.value : "Caveat-VariableFont_wght.ttf",
      overlay_ai_size: inpOverlayAISize ? parseInt(inpOverlayAISize.value, 10) || 14 : 14,
      overlay_ai_color: selOverlayAIColor ? selOverlayAIColor.value : "white",
      overlay_ai_align: selOverlayAIAlign ? selOverlayAIAlign.value : "bottom",
      overlay_ai_justify: selOverlayAIJustify ? selOverlayAIJustify.value : "left",
      overlay_ai_pos_x: inpOverlayAIPosX ? parseInt(inpOverlayAIPosX.value, 10) || 0 : 10,
      overlay_ai_pos_y: inpOverlayAIPosY ? parseInt(inpOverlayAIPosY.value, 10) || 0 : -15,
      overlay_ai_rotation: inpOverlayAIRotation ? parseFloat(inpOverlayAIRotation.value) || 0 : 0,
      overlay_ai_margins: inpOverlayAIMargins ? parseInt(inpOverlayAIMargins.value, 10) || 0 : 0,

      overlay_sig_enabled: chkOverlaySig ? chkOverlaySig.checked : true,
      overlay_sig_text: txtOverlaySig ? txtOverlaySig.value : "thomo.ART",
      overlay_sig_font: selOverlaySigFont ? selOverlaySigFont.value : "Caveat-VariableFont_wght.ttf",
      overlay_sig_size: inpOverlaySigSize ? parseInt(inpOverlaySigSize.value, 10) || 14 : 14,
      overlay_sig_color: selOverlaySigColor ? selOverlaySigColor.value : "white",
      overlay_sig_align: selOverlaySigAlign ? selOverlaySigAlign.value : "bottom",
      overlay_sig_justify: selOverlaySigJustify ? selOverlaySigJustify.value : "right",
      overlay_sig_pos_x: inpOverlaySigPosX ? parseInt(inpOverlaySigPosX.value, 10) || 0 : -15,
      overlay_sig_pos_y: inpOverlaySigPosY ? parseInt(inpOverlaySigPosY.value, 10) || 0 : -15,
      overlay_sig_rotation: inpOverlaySigRotation ? parseFloat(inpOverlaySigRotation.value) || 0 : 0,
      overlay_sig_margins: inpOverlaySigMargins ? parseInt(inpOverlaySigMargins.value, 10) || 0 : 0,
      overlay_img_enabled: chkOverlayImg ? chkOverlayImg.checked : false,
      overlay_img_file: currentOverlayImgFilename || "",
      overlay_img_pos_x: inpOverlayImgPosX ? Math.max(0, parseInt(inpOverlayImgPosX.value, 10) || 0) : 0,
      overlay_img_pos_y: inpOverlayImgPosY ? Math.max(0, parseInt(inpOverlayImgPosY.value, 10) || 0) : 0,
      overlay_img_scale: getClampedLogoScale(),
      last_llm_prompt: (txtLLMGeneratedPrompt && !txtLLMGeneratedPrompt.value.startsWith("⏳")) ? txtLLMGeneratedPrompt.value : "",
      loras: loras,
    };
  }

  function saveState() {
    const state = collectState();
    try {
      localStorage.setItem("tAStudio.ui_state", JSON.stringify(state));
    } catch (e) {}

    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_state: state })
    }).catch(() => {});
  }

  let saveDebounceTimer = null;
  function saveStateDebounced() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(saveState, 300);
  }

  function restoreState(s) {
    if (!s) return;

    if (s.model_preset) {
      const found = Array.from(selModelPreset.options).find(o => o.value === s.model_preset);
      if (found) {
        selModelPreset.value = found.value;
      } else {
        const normSaved = s.model_preset.toLowerCase().replace(/[^a-z0-9]/g, "");
        const loose = Array.from(selModelPreset.options).find(o => {
          const normO = o.value.toLowerCase().replace(/[^a-z0-9]/g, "");
          return normO === normSaved || normO.includes(normSaved) || normSaved.includes(normO);
        });
        if (loose) selModelPreset.value = loose.value;
      }
      updateModelSelection(selModelPreset.value, false);
    }
    if (selPlatoKey && typeof s.plato_key === "string") {
      selPlatoKey.dataset.pendingValue = s.plato_key;
      const pkOpt = Array.from(selPlatoKey.options).find(o => o.value === s.plato_key);
      if (pkOpt) selPlatoKey.value = pkOpt.value;
      updatePlatoKeyBadge();
    }

    if (s.sampler_preset) {
      const found = Array.from(selSamplerPreset.options).find(o => o.value === s.sampler_preset);
      if (found) {
        selSamplerPreset.value = found.value;
      } else {
        const normSaved = s.sampler_preset.toLowerCase().replace(/[^a-z0-9]/g, "");
        const loose = Array.from(selSamplerPreset.options).find(o => {
          const normO = o.value.toLowerCase().replace(/[^a-z0-9]/g, "");
          return normO === normSaved || normO.includes(normSaved) || normSaved.includes(normO);
        });
        if (loose) selSamplerPreset.value = loose.value;
      }
      updateSamplerSelection(selSamplerPreset.value);
    }

    if (s.prompt !== undefined && txtPrompt) txtPrompt.value = s.prompt;
    if (s.additional_prompt !== undefined && txtAdditionalPrompt) txtAdditionalPrompt.value = s.additional_prompt;
    if (s.neg_prompt !== undefined && txtNegPrompt) txtNegPrompt.value = s.neg_prompt;
    if (s.llm_models_by_mode && typeof s.llm_models_by_mode === "object") {
      llmModelsByMode = {
        t2i: s.llm_models_by_mode.t2i || "",
        i2i: s.llm_models_by_mode.i2i || "",
      };
    }
    if (s.llm_mode) {
      setLLMMode(s.llm_mode);
    } else if (s.smart_llm) {
      setLLMMode("t2i");
    } else {
      setLLMMode("off");
    }
    const restoredModel = ((currentLLMMode === "t2i" || currentLLMMode === "i2i") && llmModelsByMode[currentLLMMode]) || s.llm_model;
    if (restoredModel && selLLMModel) {
      selLLMModel.value = restoredModel;
      if ((currentLLMMode === "t2i" || currentLLMMode === "i2i") && !llmModelsByMode[currentLLMMode]) {
        llmModelsByMode[currentLLMMode] = restoredModel;
      }
    }
    updateLLMSourceBadge();
    if (rngLLMTemp && s.llm_temperature !== undefined) rngLLMTemp.value = s.llm_temperature;
    if (inpLLMMaxTokens && s.llm_max_tokens !== undefined) inpLLMMaxTokens.value = s.llm_max_tokens;
    if (inpLLMTimeout && s.llm_request_timeout !== undefined) inpLLMTimeout.value = s.llm_request_timeout;
    if (chkLLMThinking && s.llm_thinking_mode !== undefined) chkLLMThinking.checked = Boolean(s.llm_thinking_mode);
    if (chkLLMUnloadImgFirst && s.llm_unload_image_models_first !== undefined) chkLLMUnloadImgFirst.checked = Boolean(s.llm_unload_image_models_first);
    if (chkLLMUnloadAfter && s.llm_unload_llm_after !== undefined) chkLLMUnloadAfter.checked = Boolean(s.llm_unload_llm_after);
    if (s.llm_prompts_by_model && typeof s.llm_prompts_by_model === "object") {
      llmPromptsByModel = JSON.parse(JSON.stringify(s.llm_prompts_by_model));
    }
    // Preserve existing Z-Image prompts if migrating from single-prompt config
    const curProfile = getLLMPromptProfileKey(selModelPreset ? selModelPreset.value : "");
    const isZImagePrompt = (s.llm_system_prompt || "").includes("Z-Image-Turbo") || curProfile === "zimage";
    if (isZImagePrompt && !llmPromptsByModel.zimage) {
      llmPromptsByModel.zimage = {};
      if (s.llm_system_prompt) {
        llmPromptsByModel.zimage.t2i = { system_prompt: s.llm_system_prompt };
        llmPromptsByModel.zimage.i2i = { system_prompt: s.llm_system_prompt };
      }
      if (s.llm_user_prompt) {
        if (!llmPromptsByModel.zimage.i2i) llmPromptsByModel.zimage.i2i = {};
        llmPromptsByModel.zimage.i2i.user_prompt = s.llm_user_prompt;
      }
    }
    if (txtLLMSystemPrompt && s.llm_system_prompt !== undefined) txtLLMSystemPrompt.value = s.llm_system_prompt;
    if (txtLLMI2IUserPrompt && s.llm_user_prompt !== undefined) txtLLMI2IUserPrompt.value = s.llm_user_prompt;
    applyLLMDefaultsForMode(currentLLMMode, false);
    updateLLMAdvUI();
    const restoredCtrlMode = s.prompt_controller_mode || s.llm_controller_mode;
    if (selPromptControllerMode) {
      if (currentLLMMode === "off") {
        selPromptControllerMode.value = "Manual Only";
      } else if (restoredCtrlMode) {
        selPromptControllerMode.value = restoredCtrlMode;
      }
    }
    if (s.delimiter !== undefined && inpDelimiter) {
      inpDelimiter.value = s.delimiter;
    }
    updatePromptControllerBadge();
    if (txtLLMGeneratedPrompt) {
      if (s.last_llm_prompt && !s.last_llm_prompt.startsWith("⏳")) {
        txtLLMGeneratedPrompt.value = s.last_llm_prompt;
        if (llmPromptResultGroup) {
          llmPromptResultGroup.style.display = (currentLLMMode !== "off") ? "block" : "none";
        }
      } else {
        txtLLMGeneratedPrompt.value = "";
        if (llmPromptResultGroup) {
          llmPromptResultGroup.style.display = "none";
        }
      }
    }
    if (s.i2i_image) {
      currentI2IImageFilename = s.i2i_image;
      if (lblI2IFilename) lblI2IFilename.textContent = s.i2i_image;
      if (i2iFileNameBadge) i2iFileNameBadge.textContent = s.i2i_image;
      if (imgI2IThumb) imgI2IThumb.src = `/view?filename=${encodeURIComponent(s.i2i_image)}&type=input`;
      setI2IStatusState("loaded");
      if (i2iEmptyState) i2iEmptyState.style.display = "none";
      if (i2iPreviewState) i2iPreviewState.style.display = "flex";
    }

    // Pixaroma Resolution & Batch Restoration
    if (s.batch_size !== undefined) {
      setBatchSize(s.batch_size);
    }
    if (s.snap !== undefined) {
      currentSnap = parseInt(s.snap, 10) || 16;
      [snapBtnsRatio, snapBtnsRes].forEach(group => {
        if (group) {
          group.querySelectorAll(".pix-snap-btn").forEach(b => {
            b.classList.toggle("active", parseInt(b.getAttribute("data-snap"), 10) === currentSnap);
          });
        }
      });
    }
    if (s.custom_ratio_w !== undefined) currentCustomRatioW = parseInt(s.custom_ratio_w, 10) || 16;
    if (s.custom_ratio_h !== undefined) currentCustomRatioH = parseInt(s.custom_ratio_h, 10) || 9;

    const restoredMode = s.pix_mode || "preset";
    const restoredRatio = s.aspect_ratio || "16:9";
    if (s.width) currentPixW = parseInt(s.width, 10);
    if (s.height) currentPixH = parseInt(s.height, 10);

    setPixMode(restoredMode, restoredRatio);
    if (savedCustomResolutions.length === 0 && Array.isArray(s.custom_res_presets) && s.custom_res_presets.length > 0) {
      savedCustomResolutions = s.custom_res_presets.filter(r => r && r.w && r.h);
      renderCustomResChips();
    }

    if (s.seedMode) {
      seedPills.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-seedmode") === s.seedMode);
      });
      updateSeedBadge(s.seedMode);
      if (txtSeed) txtSeed.disabled = (s.seedMode === "randomize");
    }
    if (s.seed !== undefined && txtSeed) txtSeed.value = s.seed;

    if (rngFlux && s.flux_guidance !== undefined) {
      rngFlux.value = s.flux_guidance;
      if (fluxVal) fluxVal.textContent = parseFloat(s.flux_guidance).toFixed(1);
    }
    if (rngSharpen && s.sharpen !== undefined) {
      rngSharpen.value = s.sharpen;
      if (sharpenVal) sharpenVal.textContent = parseFloat(s.sharpen).toFixed(2);
    }
    if (chkSharpen && s.sharpen_enabled !== undefined) chkSharpen.checked = Boolean(s.sharpen_enabled);
    updateSharpenUI();

    if (chkSVE && s.sve_enabled !== undefined) chkSVE.checked = Boolean(s.sve_enabled);
    if (chkSVEAuto && s.sve_auto !== undefined) chkSVEAuto.checked = Boolean(s.sve_auto);
    if (inpSVEStrength && s.sve_strength !== undefined) inpSVEStrength.value = s.sve_strength;
    if (inpSVERandPct && s.sve_randomize_percent !== undefined) inpSVERandPct.value = s.sve_randomize_percent;
    if (selSVENoiseInsert && s.sve_noise_insert) selSVENoiseInsert.value = s.sve_noise_insert;
    if (inpSVESwitchPct && s.sve_steps_switchover_percent !== undefined) inpSVESwitchPct.value = s.sve_steps_switchover_percent;
    if (selSVEMaskStart && s.sve_mask_starts_at) selSVEMaskStart.value = s.sve_mask_starts_at;
    if (inpSVEMaskPct && s.sve_mask_percent !== undefined) inpSVEMaskPct.value = s.sve_mask_percent;
    updateSVEUI();


    if (chkFilmGrain && s.film_grain_enabled !== undefined) chkFilmGrain.checked = Boolean(s.film_grain_enabled);
    if (chkFilmGrainGray && s.film_grain_gray_scale !== undefined) chkFilmGrainGray.checked = Boolean(s.film_grain_gray_scale);
    if (selFilmGrainType && s.film_grain_type) selFilmGrainType.value = s.film_grain_type;
    if (rngFilmGrainSat && s.film_grain_sat !== undefined) rngFilmGrainSat.value = s.film_grain_sat;
    if (rngFilmGrainPower && s.film_grain_power !== undefined) rngFilmGrainPower.value = s.film_grain_power;
    if (rngFilmGrainShadows && s.film_grain_shadows !== undefined) rngFilmGrainShadows.value = s.film_grain_shadows;
    if (rngFilmGrainHighs && s.film_grain_highs !== undefined) rngFilmGrainHighs.value = s.film_grain_highs;
    if (rngFilmGrainScale && s.film_grain_scale !== undefined) rngFilmGrainScale.value = s.film_grain_scale;
    if (rngFilmGrainSharpen && s.film_grain_sharpen !== undefined) rngFilmGrainSharpen.value = s.film_grain_sharpen;
    if (rngFilmGrainGamma && s.film_grain_src_gamma !== undefined) rngFilmGrainGamma.value = s.film_grain_src_gamma;
    updateFilmGrainUI();



    let restoredAttn = "kitchen";
    if (s.sage_enable === true || s.sage_enable === "true") {
      restoredAttn = "sage";
    } else if (s.kitchen_enable === false || s.kitchen_enable === "false") {
      restoredAttn = "none";
    } else if (s.kitchen_enable === true || s.kitchen_enable === "true") {
      restoredAttn = "kitchen";
    }
    setAttnEngine(restoredAttn);
    if (selSageMode && s.sage_mode) selSageMode.value = s.sage_mode;
    if (chkTorchEnable && s.torch_enable !== undefined) chkTorchEnable.checked = Boolean(s.torch_enable);

    if (chkSeedVR2 && s.use_seed_vr2 !== undefined) chkSeedVR2.checked = Boolean(s.use_seed_vr2);
    if (selSeedVR2Model && s.seedvr2_model) selSeedVR2Model.value = s.seedvr2_model;
    if (inpSeedVR2Res && s.seedvr2_resolution !== undefined) inpSeedVR2Res.value = s.seedvr2_resolution;
    if (inpSeedVR2MaxRes && s.seedvr2_max_resolution !== undefined) inpSeedVR2MaxRes.value = s.seedvr2_max_resolution;
    if (selSeedVR2ColorCorr && s.seedvr2_color_correction) selSeedVR2ColorCorr.value = s.seedvr2_color_correction;
    if (inpSeedVR2Blocks && s.seedvr2_blocks_to_swap !== undefined) inpSeedVR2Blocks.value = s.seedvr2_blocks_to_swap;
    if (selSeedVR2Attn && s.seedvr2_attention_mode) selSeedVR2Attn.value = s.seedvr2_attention_mode;
    if (inpSeedVR2InNoise && s.seedvr2_input_noise_scale !== undefined) inpSeedVR2InNoise.value = s.seedvr2_input_noise_scale;
    if (inpSeedVR2LatNoise && s.seedvr2_latent_noise_scale !== undefined) inpSeedVR2LatNoise.value = s.seedvr2_latent_noise_scale;
    if (chkSeedVR2Tiled && s.seedvr2_tiled !== undefined) chkSeedVR2Tiled.checked = Boolean(s.seedvr2_tiled);
    if (chkSeedVR2Cache && s.seedvr2_cache_model !== undefined) chkSeedVR2Cache.checked = Boolean(s.seedvr2_cache_model);
    updateSeedVR2UI();
    if (selSaveFormat && s.save_format) selSaveFormat.value = s.save_format;
    if (chkSaveTxtMain && s.save_txt_main !== undefined) chkSaveTxtMain.checked = Boolean(s.save_txt_main);
    if (chkExtraSave && s.extra_save_enabled !== undefined) {
      chkExtraSave.checked = Boolean(s.extra_save_enabled);
      updateExtraSaveVisibility();
    }
    if (selExtraSaveFormat && s.extra_save_format) selExtraSaveFormat.value = s.extra_save_format;
    if (selExtraSaveQuality && s.extra_save_quality) selExtraSaveQuality.value = String(s.extra_save_quality);
    if (chkExtraSaveTxt && s.extra_save_txt !== undefined) chkExtraSaveTxt.checked = Boolean(s.extra_save_txt);
    if (inpExtraSaveSubfolder && s.fn_extra_subfolder !== undefined) inpExtraSaveSubfolder.value = s.fn_extra_subfolder;
    if (inpFnOutputFolder && s.fn_output_folder !== undefined) inpFnOutputFolder.value = s.fn_output_folder;
    if (inpFnSubfolder && s.fn_subfolder !== undefined) inpFnSubfolder.value = s.fn_subfolder;
    if (inpFnPrefix && s.fn_name_prefix !== undefined) inpFnPrefix.value = s.fn_name_prefix;
    if (inpFnWfVersion && s.fn_wf_version !== undefined) inpFnWfVersion.value = s.fn_wf_version;
    if (inpFnUpscaledSuffix && s.fn_upscaled_suffix !== undefined) inpFnUpscaledSuffix.value = s.fn_upscaled_suffix;
    if (inpFnDelimiter && s.fn_delimiter !== undefined) inpFnDelimiter.value = s.fn_delimiter;
    if (inpFnDateFormat && s.fn_date_format !== undefined) inpFnDateFormat.value = s.fn_date_format;
    updateFilenamePreview();

    if (s.overlay_ai_enabled !== undefined && chkOverlayAI) chkOverlayAI.checked = Boolean(s.overlay_ai_enabled);
    if (s.overlay_ai_text !== undefined && txtOverlayAI) txtOverlayAI.value = s.overlay_ai_text;
    if (s.overlay_ai_font && selOverlayAIFont) selOverlayAIFont.value = s.overlay_ai_font;
    if (s.overlay_ai_size !== undefined && inpOverlayAISize) inpOverlayAISize.value = s.overlay_ai_size;
    if (s.overlay_ai_color !== undefined && selOverlayAIColor) selOverlayAIColor.value = s.overlay_ai_color;
    if (s.overlay_ai_align && selOverlayAIAlign) selOverlayAIAlign.value = s.overlay_ai_align;
    if (s.overlay_ai_justify && selOverlayAIJustify) selOverlayAIJustify.value = s.overlay_ai_justify;
    if (s.overlay_ai_pos_x !== undefined && inpOverlayAIPosX) inpOverlayAIPosX.value = s.overlay_ai_pos_x;
    if (s.overlay_ai_pos_y !== undefined && inpOverlayAIPosY) inpOverlayAIPosY.value = s.overlay_ai_pos_y;
    if (s.overlay_ai_rotation !== undefined && inpOverlayAIRotation) inpOverlayAIRotation.value = s.overlay_ai_rotation;
    if (s.overlay_ai_margins !== undefined && inpOverlayAIMargins) inpOverlayAIMargins.value = s.overlay_ai_margins;

    if (s.overlay_sig_enabled !== undefined && chkOverlaySig) chkOverlaySig.checked = Boolean(s.overlay_sig_enabled);
    if (s.overlay_sig_text !== undefined && txtOverlaySig) txtOverlaySig.value = s.overlay_sig_text;
    if (s.overlay_sig_font && selOverlaySigFont) selOverlaySigFont.value = s.overlay_sig_font;
    if (s.overlay_sig_size !== undefined && inpOverlaySigSize) inpOverlaySigSize.value = s.overlay_sig_size;
    if (s.overlay_sig_color !== undefined && selOverlaySigColor) selOverlaySigColor.value = s.overlay_sig_color;
    if (s.overlay_sig_align && selOverlaySigAlign) selOverlaySigAlign.value = s.overlay_sig_align;
    if (s.overlay_sig_justify && selOverlaySigJustify) selOverlaySigJustify.value = s.overlay_sig_justify;
    if (s.overlay_sig_pos_x !== undefined && inpOverlaySigPosX) inpOverlaySigPosX.value = s.overlay_sig_pos_x;
    if (s.overlay_sig_pos_y !== undefined && inpOverlaySigPosY) inpOverlaySigPosY.value = s.overlay_sig_pos_y;
    if (s.overlay_sig_rotation !== undefined && inpOverlaySigRotation) inpOverlaySigRotation.value = s.overlay_sig_rotation;
    if (s.overlay_sig_margins !== undefined && inpOverlaySigMargins) inpOverlaySigMargins.value = s.overlay_sig_margins;
    if (s.overlay_img_enabled !== undefined && chkOverlayImg) chkOverlayImg.checked = Boolean(s.overlay_img_enabled);
    if (s.overlay_img_file !== undefined) updateOverlayImgUI(s.overlay_img_file);
    if (s.overlay_img_pos_x !== undefined && inpOverlayImgPosX) inpOverlayImgPosX.value = s.overlay_img_pos_x;
    if (s.overlay_img_pos_y !== undefined && inpOverlayImgPosY) inpOverlayImgPosY.value = s.overlay_img_pos_y;
    if (s.overlay_img_scale !== undefined && inpOverlayImgScale) inpOverlayImgScale.value = Math.max(0.05, Math.min(0.50, parseFloat(s.overlay_img_scale) || 0.25));

    updateOverlayStatusBadge();
    updateOverlayPositionBadges();

    // Restore LoRA Stack with master list merging and filtering
    if (Array.isArray(s.loras) && s.loras.length > 0) {
      const stateMap = new Map();
      s.loras.forEach(l => {
        if (l && l.name) {
          stateMap.set(l.name.toLowerCase().replace(/\.safetensors$/i, ""), l);
        }
      });

      // Update existing entries in fullLoraMasterList
      fullLoraMasterList.forEach(m => {
        const norm = (m.name || "").toLowerCase().replace(/\.safetensors$/i, "");
        const saved = stateMap.get(norm);
        if (saved) {
          m.active = Boolean(saved.active);
          if (saved.strength !== undefined) m.strength = saved.strength;
          if (saved.clipStrength !== undefined) m.clipStrength = saved.clipStrength;
          if (saved.trigger) m.trigger = saved.trigger;
          stateMap.delete(norm);
        }
      });

      // Append any remaining entries from s.loras not yet in fullLoraMasterList
      stateMap.forEach(extra => {
        fullLoraMasterList.push({
          name: extra.name,
          active: Boolean(extra.active),
          strength: extra.strength !== undefined ? extra.strength : 1.0,
          clipStrength: extra.clipStrength !== undefined ? extra.clipStrength : 1.0,
          trigger: extra.trigger || "",
          category: extra.category || "",
        });
      });

      filterAndRenderLoras();
    }
  }

  // Persistent Change Listeners
  document.addEventListener("change", (e) => {
    if (e.target.closest(".controls-col")) saveState();
  });
  if (txtPrompt) txtPrompt.addEventListener("input", saveStateDebounced);
  if (txtAdditionalPrompt) txtAdditionalPrompt.addEventListener("input", saveStateDebounced);
  if (txtNegPrompt) txtNegPrompt.addEventListener("input", saveStateDebounced);
  if (selPromptControllerMode) {
    selPromptControllerMode.addEventListener("change", () => {
      updatePromptControllerBadge();
      saveState();
    });
  }
  if (inpDelimiter) inpDelimiter.addEventListener("input", saveStateDebounced);
  if (selLLMModel) {
    selLLMModel.addEventListener("change", () => {
      if (currentLLMMode === "t2i" || currentLLMMode === "i2i") {
        llmModelsByMode[currentLLMMode] = selLLMModel.value;
      }
      updateLLMSourceBadge();
      updateLLMModelBadge();
      saveState();
    });
  }
  if (selLLMControllerMode) selLLMControllerMode.addEventListener("change", saveState);
  window.addEventListener("beforeunload", saveState);

  // 8. Generate Button Action (Real ComfyUI Connection)
  let isGenerating = false;
  btnGenerate.addEventListener("click", () => {
    if (isGenerating) return;
    startGeneration();
  });

  if (btnCancelGenerate) {
    btnCancelGenerate.addEventListener("click", async () => {
      btnCancelGenerate.disabled = true;
      btnCancelGenerate.innerHTML = `<span class="icon">⏳</span><span data-i18n="btn_cancel_cancelling">${t("btn_cancel_cancelling", "Breche ab...")}</span>`;
      try {
        await fetch("/api/cancel_generation", { method: "POST" });
        showToast(t("toast_cancel_request", "Generierung wird abgebrochen..."), "info", 2000);
      } catch (e) {
        showToast(t("toast_cancel_error", "Fehler beim Abbrechen: ") + e.message, "error", 3000);
      }
    });
  }

  async function startGeneration() {
    if (!isComfyOnline && comfyOfflineModal) {
      comfyOfflineModal.style.display = "flex";
      return;
    }

    if (currentLLMMode === "i2i" && !currentI2IImageFilename) {
      showToast(
        t("toast_i2i_missing_before_gen", "Bitte zuerst ein gültiges I2I-Referenzbild nach ComfyUI hochladen (aktuell ist kein Bild geladen)."),
        "error",
        5000
      );
      return;
    }

    if (currentLLMMode !== "off" && selLLMModel && selLLMModel.value) {
      await checkLLMStatus();
      if (!isLLMModelAvailable(selLLMModel.value, lastLLMStatus)) {
        const { label: providerLabel } = getLLMModelProviderInfo(selLLMModel.value);
        showToast(
          t(
            "toast_llm_provider_offline",
            "Der gewählte LLM-Provider ({provider}) ist offline. Bitte Server starten, ein verfügbares Modell wählen oder LLM auf Aus stellen."
          ).replace("{provider}", providerLabel),
          "error",
          5000
        );
        return;
      }
    }

    isGenerating = true;
    peakVramPct = 0;
    peakVramGb = 0;
    syncHwMonitorPolling();
    saveState();
    btnGenerate.classList.add("generating");
    btnGenerateText.textContent = t("btn_generate_sending", "Sende an ComfyUI...");
    btnProgressFill.style.width = "10%";

    if (btnCancelGenerate) {
      btnCancelGenerate.style.display = "flex";
      btnCancelGenerate.disabled = false;
      btnCancelGenerate.innerHTML = `<span class="icon">🛑</span><span data-i18n="btn_cancel_generate">${t("btn_cancel_generate", "Aktion abbrechen")}</span>`;
    }

    updateLLMExecStatusBadge("");
    if (llmPromptResultGroup) {
      if (currentLLMMode !== "off" && txtLLMGeneratedPrompt) {
        llmPromptResultGroup.style.display = "block";
        txtLLMGeneratedPrompt.value = "⏳ " + t("llm_generating_prompt", "LLM generiert Prompt...");
      } else {
        llmPromptResultGroup.style.display = "none";
      }
    }

    const payload = collectState();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(t("toast_gen_failed", "Fehler bei Generierung: ") + (err.error || res.statusText), "error", 6000);
        if (err.error && /missing|node|does not exist|class_type/i.test(err.error)) {
          checkMissingNodes(true);
        }
        finishGeneration();
        return;
      }

      const data = await res.json();
      const promptId = data.prompt_id;
      if (data.seed !== undefined && txtSeed) {
        txtSeed.value = String(data.seed);
        saveStateDebounced();
      }
      btnGenerateText.textContent = t("btn_generate_computing", "ComfyUI rechnet...");
      btnProgressFill.style.width = "20%";

      // Poll until done (fast 800ms polling for live LLM prompt & sampling steps)
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        const elapsedSec = (pollCount * 0.8).toFixed(1);

        try {
          const pollRes = await fetch(`/api/poll_generation?prompt_id=${promptId}`);
          if (pollRes.ok) {
            const job = await pollRes.json();

            // 1. Live LLM prompt & status display immediately upon LLM execution (before image is finished!)
            if (currentLLMMode !== "off" && job.llm_prompt && txtLLMGeneratedPrompt) {
              if (txtLLMGeneratedPrompt.value !== job.llm_prompt) {
                txtLLMGeneratedPrompt.value = job.llm_prompt;
                txtLLMGeneratedPrompt.style.borderColor = "var(--accent)";
                if (llmPromptResultGroup) llmPromptResultGroup.style.display = "block";
                saveStateDebounced();
              }
            } else if (currentLLMMode === "off" && llmPromptResultGroup) {
              llmPromptResultGroup.style.display = "none";
            }
            if (job.llm_status) {
              updateLLMExecStatusBadge(job.llm_status);
              if (currentLLMMode !== "off" && llmPromptResultGroup && job.llm_status.toUpperCase() !== "DISABLED") {
                llmPromptResultGroup.style.display = "block";
              }
            }

            // 2. Real-time step progress
            if (job.progress && job.status === "running") {
              const val = job.progress.value;
              const max = job.progress.max;
              if (max > 0) {
                const stepPct = Math.min(95, Math.round(15 + (val / max) * 80));
                btnProgressFill.style.width = `${stepPct}%`;
                btnGenerateText.textContent = `${t("btn_generate_step", "Generiere... Step")} ${val}/${max} (${elapsedSec}s)`;
              }
            } else if (job.status === "running" && !job.progress) {
              const estPct = Math.min(20 + pollCount * 2, 90);
              btnProgressFill.style.width = `${estPct}%`;
              btnGenerateText.textContent = `${t("btn_generate_running", "Generiere...")} (${elapsedSec}s)`;
            }

            // 3. User cancel or interrupt
            if (job.status === "cancelled" || job.status === "interrupted") {
              clearInterval(pollInterval);
              finishGeneration();
              showToast(t("toast_cancelled", "Generierung wurde abgebrochen."), "warning", 3000);
              return;
            }

            // 4. Execution error
            if (job.status === "error") {
              clearInterval(pollInterval);
              finishGeneration();
              showToast(job.error || t("toast_gen_error", "Fehler bei der Generierung in ComfyUI."), "error", 5000);
              return;
            }

            // 5. Completion
            if (job.status === "done") {
              clearInterval(pollInterval);
              btnProgressFill.style.width = "100%";
              if (txtLLMGeneratedPrompt) {
                if (currentLLMMode !== "off" && job.llm_prompt) {
                  txtLLMGeneratedPrompt.value = job.llm_prompt;
                  txtLLMGeneratedPrompt.style.borderColor = "var(--accent)";
                  if (llmPromptResultGroup) llmPromptResultGroup.style.display = "block";
                  saveStateDebounced();
                } else if (currentLLMMode !== "off") {
                  const reason = job.llm_status ? ` (${job.llm_status})` : "";
                  txtLLMGeneratedPrompt.value = t("llm_no_prompt_warning", `⚠️ Kein Prompt vom LLM erhalten${reason}.\n\nBitte prüfen, ob der lokale Server ('lms server') auf Port 1234 aktiv ist.`).replace("{reason}", reason);
                  txtLLMGeneratedPrompt.style.borderColor = "var(--danger)";
                  if (llmPromptResultGroup) llmPromptResultGroup.style.display = "block";
                } else if (llmPromptResultGroup) {
                  llmPromptResultGroup.style.display = "none";
                }
                updateLLMExecStatusBadge(job.llm_status || "");
              }
              if (job.image_url) {
                const bust = `_t=${Date.now()}`;
                const freshUrl = job.image_url.includes("?") ? `${job.image_url}&${bust}` : `${job.image_url}?${bust}`;
                if (job.before_image_url) {
                  const freshBefore = job.before_image_url.includes("?") ? `${job.before_image_url}&${bust}` : `${job.before_image_url}?${bust}`;
                  comparePairsByUrl.set(normalizeImageUrlKey(job.image_url), freshBefore);
                }
                if (mainPreview) {
                  mainPreview.src = freshUrl;
                  mainPreview.style.display = "block";
                  const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
                  if (emptyState) emptyState.style.display = "none";
                }
                syncCompareAvailability(freshUrl);
                const newFilename = job.image || decodeURIComponent(job.image_url.split("/").pop().split("?")[0]);
                activeImageMeta = {
                  filename: newFilename,
                  url: job.image_url,
                  isComfyView: job.image_url.startsWith("/view?"),
                };
                loadHistoryGallery(true);
              } else {
                activeImageMeta = null;
                loadHistoryGallery();
              }
              setTimeout(() => { finishGeneration(); }, 400);
            }
          }
        } catch (err) {}

        if (pollCount > 300) { // timeout ~4 min
          clearInterval(pollInterval);
          finishGeneration();
        }
      }, 800);

    } catch (e) {
      showToast(t("toast_network_error", "Netzwerkfehler: ") + e.message, "error", 5000);
      finishGeneration();
    }
  }

  function finishGeneration() {
    isGenerating = false;
    fetchHwMonitor();
    syncHwMonitorPolling();
    btnGenerate.classList.remove("generating");
    btnGenerateText.textContent = t("btn_generate", "BILD GENERIEREN");
    btnProgressFill.style.width = "0%";
    if (btnCancelGenerate) {
      btnCancelGenerate.style.display = "none";
      btnCancelGenerate.disabled = false;
    }
    if ("vibrate" in navigator) navigator.vibrate(50);
    if (txtLLMGeneratedPrompt && txtLLMGeneratedPrompt.value.startsWith("⏳")) {
      txtLLMGeneratedPrompt.value = "";
      if (llmPromptResultGroup) llmPromptResultGroup.style.display = "none";
    }
  }

  // LLM Prompt Action Buttons
  if (btnCopyLLMPrompt && txtLLMGeneratedPrompt) {
    btnCopyLLMPrompt.addEventListener("click", () => {
      const val = txtLLMGeneratedPrompt.value;
      if (!val || val.startsWith("⏳")) return;
      navigator.clipboard.writeText(val).then(() => {
        const orig = btnCopyLLMPrompt.textContent;
        btnCopyLLMPrompt.textContent = t("toast_copied", "✓ Kopiert!");
        setTimeout(() => { btnCopyLLMPrompt.textContent = orig; }, 1500);
      });
    });
  }
  if (btnAdoptLLMPrompt && txtLLMGeneratedPrompt && txtPrompt) {
    btnAdoptLLMPrompt.addEventListener("click", () => {
      const val = txtLLMGeneratedPrompt.value;
      if (!val || val.startsWith("⏳")) return;
      txtPrompt.value = val;
      saveStateDebounced();
      const orig = btnAdoptLLMPrompt.textContent;
      btnAdoptLLMPrompt.textContent = t("toast_adopted", "✓ Übernommen!");
      setTimeout(() => { btnAdoptLLMPrompt.textContent = orig; }, 1500);
    });
  }

  // 9. Viewer Quick Actions
  if (btnCopyPrompt) {
    btnCopyPrompt.addEventListener("click", () => {
      const p = (activeImageMeta && activeImageMeta.prompt) ? activeImageMeta.prompt : (txtPrompt ? txtPrompt.value : "");
      if (p) {
        navigator.clipboard.writeText(p).then(() => {
          const lbl = btnCopyPrompt.querySelector(".btn-label") || btnCopyPrompt;
          lbl.textContent = t("toast_copied", "✓ Kopiert!");
          setTimeout(() => { lbl.textContent = t("btn_copy_prompt", "📋 Prompt kopieren"); }, 1500);
        });
      }
    });
  }

  if (btnReuseSeed) {
    btnReuseSeed.addEventListener("click", () => {
      const s = (activeImageMeta && activeImageMeta.seed) ? activeImageMeta.seed : (txtSeed ? txtSeed.value : "");
      if (s && txtSeed) {
        txtSeed.value = s;
        seedPills.querySelectorAll(".pill-btn").forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-seedmode") === "fixed");
        });
        updateSeedBadge("fixed");
        txtSeed.disabled = false;
        saveState();
        const lbl = btnReuseSeed.querySelector(".btn-label") || btnReuseSeed;
        lbl.textContent = t("toast_seed_active", "✓ Seed aktiv!");
        setTimeout(() => { lbl.textContent = t("btn_reuse_seed", "🔄 Seed übernehmen"); }, 1500);
      }
    });
  }

  // Background Remover (On-Demand Studio Viewer Action)
  const btnRemoveBg = document.getElementById("btnRemoveBg");
  const bgRemoveHelpWrap = document.getElementById("bgRemoveHelpWrap");
  const btnBgRemoveHelp = document.getElementById("btnBgRemoveHelp");
  const bgRemoveHelpPopover = document.getElementById("bgRemoveHelpPopover");
  let bgRemoveState = { available: false, reason: "comfy_offline", nodeType: null, checkedOnce: false, busy: false };

  function updateBgRemoveUI(state) {
    if (!btnRemoveBg) return;
    const isAvail = Boolean(state && state.available);
    const isBusy = Boolean(bgRemoveState.busy);
    btnRemoveBg.disabled = !isAvail || isBusy;
    if (bgRemoveHelpWrap) {
      bgRemoveHelpWrap.classList.toggle("is-hidden", isAvail);
      if (isAvail) bgRemoveHelpWrap.classList.remove("is-open");
    }
    if (bgRemoveHelpPopover) {
      const reason = (state && state.reason) || "comfy_offline";
      bgRemoveHelpPopover.textContent = reason === "no_node"
        ? t("bg_remove_help_no_node", "Kein Background-Remover-Node in ComfyUI gefunden. Installiere z. B. ComfyUI-RMBG oder rembg über den ComfyUI Manager und starte ComfyUI neu.")
        : t("bg_remove_help_offline", "ComfyUI ist aktuell nicht verbunden. Starte ComfyUI, um zu prüfen, ob ein Background-Remover-Node installiert ist.");
    }
    if (isAvail && state.nodeType) {
      btnRemoveBg.title = `${t("btn_remove_bg_title", "Hintergrund des aktuellen Bildes entfernen (freistellen)")} (${state.nodeType})`;
    } else {
      btnRemoveBg.title = t("btn_remove_bg_title", "Hintergrund des aktuellen Bildes entfernen (freistellen)");
    }
  }

  async function checkBgRemoveStatus() {
    try {
      const res = await fetch("/api/bg_remove/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      bgRemoveState.available = Boolean(data.available);
      bgRemoveState.reason = data.reason || (data.comfy_online ? "no_node" : "comfy_offline");
      bgRemoveState.nodeType = data.node_type || null;
      bgRemoveState.checkedOnce = Boolean(data.comfy_online);
      updateBgRemoveUI(bgRemoveState);
    } catch (e) {
      bgRemoveState.available = false;
      bgRemoveState.reason = "comfy_offline";
      bgRemoveState.nodeType = null;
      updateBgRemoveUI(bgRemoveState);
    }
  }

  if (btnBgRemoveHelp && bgRemoveHelpWrap) {
    btnBgRemoveHelp.addEventListener("click", (e) => {
      e.stopPropagation();
      bgRemoveHelpWrap.classList.toggle("is-open");
    });
    document.addEventListener("click", (e) => {
      if (!bgRemoveHelpWrap.contains(e.target)) {
        bgRemoveHelpWrap.classList.remove("is-open");
      }
    });
  }

  async function imageElementToBase64(imgEl) {
    const res = await fetch(imgEl.src);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  if (btnRemoveBg) {
    updateBgRemoveUI(bgRemoveState);
    btnRemoveBg.addEventListener("click", async () => {
      if (!bgRemoveState.available || bgRemoveState.busy || isGenerating) return;
      if (!mainPreview || !mainPreview.src || mainPreview.style.display === "none") {
        showToast(t("bg_remove_no_image", "Kein Bild in der Vorschau ausgewählt."), "error", 3000);
        return;
      }

      const labelEl = btnRemoveBg.querySelector(".btn-label");
      const origLabel = labelEl ? labelEl.textContent : btnRemoveBg.textContent;
      bgRemoveState.busy = true;
      isGenerating = true;
      syncHwMonitorPolling();
      updateBgRemoveUI(bgRemoveState);
      if (labelEl) labelEl.textContent = t("btn_remove_bg_busy", "⏳ Freistellen...");

      if (btnGenerate) btnGenerate.classList.add("generating");
      if (btnGenerateText) btnGenerateText.textContent = t("btn_generate_removing_bg", "Hintergrund wird entfernt...");
      if (btnProgressFill) btnProgressFill.style.width = "10%";
      if (btnCancelGenerate) {
        btnCancelGenerate.style.display = "flex";
        btnCancelGenerate.disabled = false;
        btnCancelGenerate.innerHTML = `<span class="icon">🛑</span><span data-i18n="btn_cancel_generate">${t("btn_cancel_generate", "Aktion abbrechen")}</span>`;
      }

      const resetBgRemoveUi = () => {
        bgRemoveState.busy = false;
        if (labelEl) labelEl.textContent = t("btn_remove_bg", "✂️ Hintergrund entf.");
        updateBgRemoveUI(bgRemoveState);
        finishGeneration();
      };

      try {
        const body = {};
        if (activeImageMeta && activeImageMeta.filename && !activeImageMeta.isDroppedFile && !activeImageMeta.isComfyView) {
          body.filename = activeImageMeta.filename;
          body.original_filename = activeImageMeta.filename;
        } else {
          body.image_base64 = await imageElementToBase64(mainPreview);
          body.original_filename = (activeImageMeta && activeImageMeta.filename) || "image.png";
        }

        const res = await fetch("/api/bg_remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.error || !data.prompt_id) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const promptId = data.prompt_id;
        const startMs = Date.now();
        let pollCount = 0;

        const pollInterval = setInterval(async () => {
          pollCount++;
          const elapsedSec = Math.round((Date.now() - startMs) / 1000);
          if (btnGenerateText) {
            btnGenerateText.textContent = `${t("btn_generate_removing_bg", "Hintergrund wird entfernt...")} (${elapsedSec}s)`;
          }
          if (btnProgressFill) {
            btnProgressFill.style.width = `${Math.min(15 + pollCount * 2, 90)}%`;
          }

          try {
            const stRes = await fetch(`/api/poll_generation?prompt_id=${encodeURIComponent(promptId)}`);
            if (!stRes.ok) return;
            const job = await stRes.json();

            if (job.status === "cancelled" || job.status === "interrupted") {
              clearInterval(pollInterval);
              resetBgRemoveUi();
              showToast(t("bg_remove_cancelled", "Hintergrundentfernung abgebrochen."), "warning", 3000);
              return;
            }

            if (job.status === "error") {
              clearInterval(pollInterval);
              resetBgRemoveUi();
              showToast(t("bg_remove_error", "Fehler beim Freistellen: ") + (job.error || t("err_unknown", "Unbekannter Fehler")), "error", 5000);
              return;
            }

            if (job.status === "done") {
              clearInterval(pollInterval);
              if (btnProgressFill) btnProgressFill.style.width = "100%";

              const resultUrl = job.image_url;
              if (resultUrl) {
                const bust = `_t=${Date.now()}`;
                const freshUrl = resultUrl.includes("?") ? `${resultUrl}&${bust}` : `${resultUrl}?${bust}`;
                mainPreview.src = freshUrl;
                mainPreview.style.display = "block";
                const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
                if (emptyState) emptyState.style.display = "none";

                activeImageMeta = {
                  ...(activeImageMeta || {}),
                  filename: job.filename,
                  url: resultUrl,
                  isDroppedFile: false,
                  isComfyView: resultUrl.startsWith("/view"),
                };

                if (resultUrl.startsWith("/output/") && typeof loadHistoryGallery === "function") {
                  loadHistoryGallery(true);
                }
              }
              showToast(t("bg_remove_success", "Hintergrund erfolgreich entfernt!"), "success", 3000);
              setTimeout(() => { resetBgRemoveUi(); }, 300);
            }
          } catch (err) {}

          if (pollCount > 360) { // timeout ~180s
            clearInterval(pollInterval);
            resetBgRemoveUi();
            showToast(t("bg_remove_error", "Fehler beim Freistellen: ") + t("err_timeout", "Zeitüberschreitung (Timeout)"), "error", 5000);
          }
        }, 500);
      } catch (e) {
        resetBgRemoveUi();
        showToast(t("bg_remove_error", "Fehler beim Freistellen: ") + e.message, "error", 5000);
      }
    });
  }

  // Toast notifications helper
  function showToast(message, type = "info", duration = 4000) {
    if (window.__studioUpdating && type === "error") return;
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast-msg ${type}`;
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    const iconEl = document.createElement("span");
    iconEl.textContent = icon;
    const msgEl = document.createElement("span");
    msgEl.textContent = String(message ?? "");
    toast.append(iconEl, msgEl);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  // Parse PNG ComfyUI metadata client-side directly in browser
  async function parsePngMetadataClientSide(file) {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      if (view.byteLength < 8) return null;
      if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
        return null;
      }
      let pos = 8;
      const chunks = {};
      const decoder = new TextDecoder("utf-8");
      const latin1Decoder = new TextDecoder("latin1");

      while (pos < buffer.byteLength) {
        if (pos + 8 > buffer.byteLength) break;
        const length = view.getUint32(pos);
        const type = latin1Decoder.decode(new Uint8Array(buffer, pos + 4, 4));
        if (type === "tEXt") {
          const chunkBytes = new Uint8Array(buffer, pos + 8, length);
          let nullIdx = -1;
          for (let i = 0; i < chunkBytes.length; i++) {
            if (chunkBytes[i] === 0) { nullIdx = i; break; }
          }
          if (nullIdx !== -1) {
            const key = latin1Decoder.decode(chunkBytes.subarray(0, nullIdx));
            const val = decoder.decode(chunkBytes.subarray(nullIdx + 1));
            chunks[key] = val;
          }
        } else if (type === "IEND") {
          break;
        }
        pos += 8 + length + 4;
      }

      if (!chunks.prompt && !chunks.workflow) return null;

      const pr = chunks.prompt ? JSON.parse(chunks.prompt) : {};
      const wf = chunks.workflow ? JSON.parse(chunks.workflow) : {};

      const params = {
        source_image: file.name,
        success: true,
      };

      // TAPromptHub (Node 2061 or by class_type) + fallbacks
      const promptHubNode = (pr["2061"] && pr["2061"].inputs)
        ? pr["2061"]
        : Object.values(pr).find(n => n && n.class_type === "TAPromptHub" && n.inputs);
      if (promptHubNode && promptHubNode.inputs) {
        const inp = promptHubNode.inputs;
        if (typeof inp.positive_prompt === "string") params.prompt = inp.positive_prompt;
        if (typeof inp.additional_prompt === "string") params.additional_prompt = inp.additional_prompt;
        if (typeof inp.negative_prompt === "string") params.neg_prompt = inp.negative_prompt;
      }
      if (params.prompt === undefined && wf.nodes && Array.isArray(wf.nodes)) {
        const wfHub = wf.nodes.find(n => n && (n.id === 2061 || n.type === "TAPromptHub"));
        if (wfHub) {
          const wvn = wfHub.widgets_values_named || {};
          if (typeof wvn.positive_prompt === "string") params.prompt = wvn.positive_prompt;
          if (typeof wvn.additional_prompt === "string" && params.additional_prompt === undefined) params.additional_prompt = wvn.additional_prompt;
          if (typeof wvn.negative_prompt === "string" && params.neg_prompt === undefined) params.neg_prompt = wvn.negative_prompt;
          if (params.prompt === undefined && Array.isArray(wfHub.widgets_values)) {
            if (typeof wfHub.widgets_values[0] === "string") params.prompt = wfHub.widgets_values[0];
            if (typeof wfHub.widgets_values[1] === "string" && params.additional_prompt === undefined) params.additional_prompt = wfHub.widgets_values[1];
            if (typeof wfHub.widgets_values[2] === "string" && params.neg_prompt === undefined) params.neg_prompt = wfHub.widgets_values[2];
          }
        }
      }
      if (params.prompt === undefined) {
        for (const ndata of Object.values(pr)) {
          if (!ndata || !ndata.inputs) continue;
          const ctype = ndata.class_type || "";
          if (ctype === "CLIPTextEncode" || ctype === "CLIPTextEncodeFlux" || ctype === "ShowText|pysssss") {
            const txt = ndata.inputs.text;
            if (typeof txt === "string" && txt) {
              params.prompt = txt;
              break;
            }
          }
        }
      }

      // Model & Sampler Presets
      const modelNode = (pr["2079"] && pr["2079"].inputs)
        ? pr["2079"]
        : Object.values(pr).find(n => n && n.class_type === "TAModelPreset" && n.inputs);
      if (modelNode && modelNode.inputs && typeof modelNode.inputs.preset === "string") {
        params.model_preset = modelNode.inputs.preset;
      }
      const samplerNode = (pr["2108"] && pr["2108"].inputs)
        ? pr["2108"]
        : Object.values(pr).find(n => n && n.class_type === "TASamplerPreset" && n.inputs);
      if (samplerNode && samplerNode.inputs && typeof samplerNode.inputs.preset === "string") {
        params.sampler_preset = samplerNode.inputs.preset;
      }

      // Seed
      if (pr["1204"] && pr["1204"].inputs) {
        params.seed = pr["1204"].inputs.seed;
        params.seedMode = "fixed";
      }

      // EmptyLatentImage (Node 2121)
      if (pr["2121"] && pr["2121"].inputs) {
        params.width = parseInt(pr["2121"].inputs.width, 10) || 1920;
        params.height = parseInt(pr["2121"].inputs.height, 10) || 1088;
        params.batch_size = parseInt(pr["2121"].inputs.batch_size, 10) || 1;
      }

      // Guidance & Sharpen
      if (pr["2109"] && pr["2109"].inputs) params.flux_guidance = parseFloat(pr["2109"].inputs.guidance) || 3.5;
      if (pr["2122"] && pr["2122"].inputs) {
        params.sharpen_enabled = true;
        params.sharpen = parseFloat(pr["2122"].inputs.strength) || 0.26;
      }
      if (pr["1980"] && pr["1980"].inputs) params.film_grain_enabled = Boolean(pr["1980"].inputs.switch);
      if (pr["1983"] && pr["1983"].inputs) {
        const fg = pr["1983"].inputs;
        if (fg.gray_scale !== undefined) params.film_grain_gray_scale = Boolean(fg.gray_scale);
        if (fg.grain_type !== undefined) params.film_grain_type = String(fg.grain_type);
        if (fg.grain_sat !== undefined) params.film_grain_sat = parseFloat(fg.grain_sat);
        if (fg.grain_power !== undefined) params.film_grain_power = parseFloat(fg.grain_power);
        if (fg.shadows !== undefined) params.film_grain_shadows = parseFloat(fg.shadows);
        if (fg.highs !== undefined) params.film_grain_highs = parseFloat(fg.highs);
        if (fg.scale !== undefined) params.film_grain_scale = parseFloat(fg.scale);
        if (fg.sharpen !== undefined) params.film_grain_sharpen = parseInt(fg.sharpen, 10) || 0;
        if (fg.src_gamma !== undefined) params.film_grain_src_gamma = parseFloat(fg.src_gamma);
      }
      if (pr["2023"] && pr["2023"].inputs) params.use_seed_vr2 = Boolean(pr["2023"].inputs.enabled);

      // TA SageAttention Toggler (Node 1912)
      if (pr["1912"] && pr["1912"].inputs) {
        params.sage_enable = Boolean(pr["1912"].inputs.sage_enable);
        params.torch_enable = Boolean(pr["1912"].inputs.torch_enable);
        params.sage_mode = String(pr["1912"].inputs.sage_mode);
        params.kitchen_enable = Boolean(pr["1912"].inputs.kitchen_enable);
      }

      // Text Overlays (Watermark & Signature)
      if (pr["1981"] && pr["1981"].inputs) params.overlay_ai_enabled = Boolean(pr["1981"].inputs.switch);
      if (pr["1978"] && pr["1978"].inputs) {
        if (pr["1978"].inputs.text !== undefined) params.overlay_ai_text = pr["1978"].inputs.text;
        if (pr["1978"].inputs.font_name !== undefined) params.overlay_ai_font = pr["1978"].inputs.font_name;
        if (pr["1978"].inputs.font_size !== undefined) params.overlay_ai_size = pr["1978"].inputs.font_size;
        if (pr["1978"].inputs.font_color !== undefined) params.overlay_ai_color = pr["1978"].inputs.font_color;
        if (pr["1978"].inputs.align !== undefined) params.overlay_ai_align = pr["1978"].inputs.align;
        if (pr["1978"].inputs.justify !== undefined) params.overlay_ai_justify = pr["1978"].inputs.justify;
        if (pr["1978"].inputs.position_x !== undefined) params.overlay_ai_pos_x = pr["1978"].inputs.position_x;
        if (pr["1978"].inputs.position_y !== undefined) params.overlay_ai_pos_y = pr["1978"].inputs.position_y;
        if (pr["1978"].inputs.rotation_angle !== undefined) params.overlay_ai_rotation = pr["1978"].inputs.rotation_angle;
        if (pr["1978"].inputs.margins !== undefined) params.overlay_ai_margins = pr["1978"].inputs.margins;
      }
      if (pr["1982"] && pr["1982"].inputs) params.overlay_sig_enabled = Boolean(pr["1982"].inputs.switch);
      if (pr["1979"] && pr["1979"].inputs) {
        if (pr["1979"].inputs.text !== undefined) params.overlay_sig_text = pr["1979"].inputs.text;
        if (pr["1979"].inputs.font_name !== undefined) params.overlay_sig_font = pr["1979"].inputs.font_name;
        if (pr["1979"].inputs.font_size !== undefined) params.overlay_sig_size = pr["1979"].inputs.font_size;
        if (pr["1979"].inputs.font_color !== undefined) params.overlay_sig_color = pr["1979"].inputs.font_color;
        if (pr["1979"].inputs.align !== undefined) params.overlay_sig_align = pr["1979"].inputs.align;
        if (pr["1979"].inputs.justify !== undefined) params.overlay_sig_justify = pr["1979"].inputs.justify;
        if (pr["1979"].inputs.position_x !== undefined) params.overlay_sig_pos_x = pr["1979"].inputs.position_x;
        if (pr["1979"].inputs.position_y !== undefined) params.overlay_sig_pos_y = pr["1979"].inputs.position_y;
        if (pr["1979"].inputs.rotation_angle !== undefined) params.overlay_sig_rotation = pr["1979"].inputs.rotation_angle;
        if (pr["1979"].inputs.margins !== undefined) params.overlay_sig_margins = pr["1979"].inputs.margins;
      }
      if (pr["2134"] && pr["2134"].inputs) params.overlay_img_enabled = Boolean(pr["2134"].inputs.switch);
      if (pr["2131"] && pr["2131"].inputs && pr["2131"].inputs.image !== undefined) params.overlay_img_file = pr["2131"].inputs.image;
      if (pr["2135"] && pr["2135"].inputs && pr["2135"].inputs.scale_by !== undefined) {
        params.overlay_img_scale = Math.max(0.05, Math.min(0.50, Number(pr["2135"].inputs.scale_by)));
      }
      if (pr["2133"] && pr["2133"].inputs) {
        if (pr["2133"].inputs.x !== undefined) params.overlay_img_pos_x = pr["2133"].inputs.x;
        if (pr["2133"].inputs.y !== undefined) params.overlay_img_pos_y = pr["2133"].inputs.y;
      }
      if (wf.nodes && Array.isArray(wf.nodes)) {
        const n1981 = wf.nodes.find(n => n.id === 1981);
        if (n1981 && Array.isArray(n1981.widgets_values) && n1981.widgets_values.length > 0 && params.overlay_ai_enabled === undefined) {
          params.overlay_ai_enabled = Boolean(n1981.widgets_values[0]);
        }
        const n1978 = wf.nodes.find(n => n.id === 1978);
        if (n1978 && Array.isArray(n1978.widgets_values) && n1978.widgets_values.length > 3) {
          if (params.overlay_ai_text === undefined) params.overlay_ai_text = n1978.widgets_values[0];
          if (params.overlay_ai_font === undefined) params.overlay_ai_font = n1978.widgets_values[1];
          if (params.overlay_ai_size === undefined) params.overlay_ai_size = n1978.widgets_values[2];
          if (params.overlay_ai_color === undefined) params.overlay_ai_color = n1978.widgets_values[3];
          if (n1978.widgets_values.length > 4 && params.overlay_ai_align === undefined) params.overlay_ai_align = n1978.widgets_values[4];
          if (n1978.widgets_values.length > 5 && params.overlay_ai_justify === undefined) params.overlay_ai_justify = n1978.widgets_values[5];
          if (n1978.widgets_values.length > 6 && params.overlay_ai_margins === undefined) params.overlay_ai_margins = n1978.widgets_values[6];
          if (n1978.widgets_values.length > 8 && params.overlay_ai_pos_x === undefined) params.overlay_ai_pos_x = n1978.widgets_values[8];
          if (n1978.widgets_values.length > 9 && params.overlay_ai_pos_y === undefined) params.overlay_ai_pos_y = n1978.widgets_values[9];
          if (n1978.widgets_values.length > 10 && params.overlay_ai_rotation === undefined) params.overlay_ai_rotation = n1978.widgets_values[10];
        }
        const n1982 = wf.nodes.find(n => n.id === 1982);
        if (n1982 && Array.isArray(n1982.widgets_values) && n1982.widgets_values.length > 0 && params.overlay_sig_enabled === undefined) {
          params.overlay_sig_enabled = Boolean(n1982.widgets_values[0]);
        }
        const n1979 = wf.nodes.find(n => n.id === 1979);
        if (n1979 && Array.isArray(n1979.widgets_values) && n1979.widgets_values.length > 3) {
          if (params.overlay_sig_text === undefined) params.overlay_sig_text = n1979.widgets_values[0];
          if (params.overlay_sig_font === undefined) params.overlay_sig_font = n1979.widgets_values[1];
          if (params.overlay_sig_size === undefined) params.overlay_sig_size = n1979.widgets_values[2];
          if (params.overlay_sig_color === undefined) params.overlay_sig_color = n1979.widgets_values[3];
          if (n1979.widgets_values.length > 4 && params.overlay_sig_align === undefined) params.overlay_sig_align = n1979.widgets_values[4];
          if (n1979.widgets_values.length > 5 && params.overlay_sig_justify === undefined) params.overlay_sig_justify = n1979.widgets_values[5];
          if (n1979.widgets_values.length > 6 && params.overlay_sig_margins === undefined) params.overlay_sig_margins = n1979.widgets_values[6];
          if (n1979.widgets_values.length > 8 && params.overlay_sig_pos_x === undefined) params.overlay_sig_pos_x = n1979.widgets_values[8];
          if (n1979.widgets_values.length > 9 && params.overlay_sig_pos_y === undefined) params.overlay_sig_pos_y = n1979.widgets_values[9];
          if (n1979.widgets_values.length > 10 && params.overlay_sig_rotation === undefined) params.overlay_sig_rotation = n1979.widgets_values[10];
        }

        const n1229 = wf.nodes.find(n => n.id === 1229);
        if (n1229 && Array.isArray(n1229.widgets_values) && n1229.widgets_values.length > 1 && params.save_txt_main === undefined) {
          params.save_txt_main = (n1229.widgets_values[1] === "enabled");
        }
        const n1619 = wf.nodes.find(n => n.id === 1619);
        if (n1619 && Array.isArray(n1619.widgets_values) && n1619.widgets_values.length >= 5) {
          if (params.extra_save_enabled === undefined) params.extra_save_enabled = Boolean(n1619.widgets_values[1]);
          if (params.extra_save_txt === undefined) params.extra_save_txt = (n1619.widgets_values[2] === "enabled");
          if (params.extra_save_format === undefined) params.extra_save_format = String(n1619.widgets_values[3]);
          if (params.extra_save_quality === undefined) params.extra_save_quality = String(n1619.widgets_values[4]);
        }
        const n2122 = wf.nodes.find(n => n.id === 2122);
        if (n2122) {
          if (params.sharpen_enabled === undefined) params.sharpen_enabled = (n2122.mode !== 4);
          if (params.sharpen === undefined && Array.isArray(n2122.widgets_values)) params.sharpen = parseFloat(n2122.widgets_values[0]) || 0.26;
        }
        const n1980 = wf.nodes.find(n => n.id === 1980);
        if (n1980 && Array.isArray(n1980.widgets_values) && n1980.widgets_values.length > 0 && params.film_grain_enabled === undefined) {
          params.film_grain_enabled = Boolean(n1980.widgets_values[0]);
        }
        const n1983 = wf.nodes.find(n => n.id === 1983);
        if (n1983 && Array.isArray(n1983.widgets_values) && n1983.widgets_values.length >= 9) {
          if (params.film_grain_gray_scale === undefined) params.film_grain_gray_scale = Boolean(n1983.widgets_values[0]);
          if (params.film_grain_type === undefined) params.film_grain_type = String(n1983.widgets_values[1]);
          if (params.film_grain_sat === undefined) params.film_grain_sat = parseFloat(n1983.widgets_values[2]);
          if (params.film_grain_power === undefined) params.film_grain_power = parseFloat(n1983.widgets_values[3]);
          if (params.film_grain_shadows === undefined) params.film_grain_shadows = parseFloat(n1983.widgets_values[4]);
          if (params.film_grain_highs === undefined) params.film_grain_highs = parseFloat(n1983.widgets_values[5]);
          if (params.film_grain_scale === undefined) params.film_grain_scale = parseFloat(n1983.widgets_values[6]);
          if (params.film_grain_sharpen === undefined) params.film_grain_sharpen = parseInt(n1983.widgets_values[7], 10) || 0;
          if (params.film_grain_src_gamma === undefined) params.film_grain_src_gamma = parseFloat(n1983.widgets_values[8]);
        }
        const n1912 = wf.nodes.find(n => n.id === 1912);
        if (n1912 && Array.isArray(n1912.widgets_values) && n1912.widgets_values.length >= 4) {
          if (params.sage_enable === undefined) params.sage_enable = Boolean(n1912.widgets_values[0]);
          if (params.torch_enable === undefined) params.torch_enable = Boolean(n1912.widgets_values[1]);
          if (params.sage_mode === undefined) params.sage_mode = String(n1912.widgets_values[2]);
          if (params.kitchen_enable === undefined) params.kitchen_enable = Boolean(n1912.widgets_values[3]);
        }
      }

      // Export & Save settings
      if (pr["1229"] && pr["1229"].inputs) {
        params.save_txt_main = (pr["1229"].inputs.save_txt === "enabled");
      }
      if (pr["1619"] && pr["1619"].inputs) {
        const inp1619 = pr["1619"].inputs;
        params.extra_save_enabled = Boolean(inp1619.enabled);
        if (inp1619.save_format) params.extra_save_format = inp1619.save_format;
        if (inp1619.jpeg_quality) params.extra_save_quality = String(inp1619.jpeg_quality);
        params.extra_save_txt = (inp1619.save_txt === "enabled");
      }

      // LoRAs
      let rawL = null;
      if (pr["1518"] && pr["1518"].inputs) {
        rawL = pr["1518"].inputs.loras;
        if (rawL && typeof rawL === "object" && Array.isArray(rawL.__value__)) {
          rawL = rawL.__value__;
        }
      }
      if (!Array.isArray(rawL) && wf.nodes && Array.isArray(wf.nodes)) {
        const n1518 = wf.nodes.find(n => n.id === 1518);
        if (n1518) {
          const wvn = n1518.widgets_values_named || {};
          if (Array.isArray(wvn.loras)) {
            rawL = wvn.loras;
          } else if (Array.isArray(n1518.widgets_values) && Array.isArray(n1518.widgets_values[2])) {
            rawL = n1518.widgets_values[2];
          }
        }
      }
      if (Array.isArray(rawL)) {
        params.loras = rawL.map(l => ({
          name: l.name || "",
          strength: parseFloat(l.strength) || 1.0,
          clipStrength: parseFloat(l.clipStrength !== undefined ? l.clipStrength : l.strength) || 1.0,
          active: Boolean(l.active),
        }));
      }

      // Pixaroma from workflow (Node 2120)
      if (wf.nodes && Array.isArray(wf.nodes)) {
        const n2120 = wf.nodes.find(n => n.id === 2120);
        if (n2120 && n2120.properties && n2120.properties.resolutionState) {
          try {
            const rs = typeof n2120.properties.resolutionState === "string" 
              ? JSON.parse(n2120.properties.resolutionState) 
              : n2120.properties.resolutionState;
            params.pix_mode = rs.mode || "preset";
            params.aspect_ratio = rs.ratio || "16:9";
            if (rs.custom_ratio_w) params.custom_ratio_w = rs.custom_ratio_w;
            if (rs.custom_ratio_h) params.custom_ratio_h = rs.custom_ratio_h;
            if (rs.snap) params.snap = rs.snap;
          } catch (e) {}
        }
      }

      return params;
    } catch (e) {
      console.warn("Client-side PNG parse error:", e);
      return null;
    }
  }

  function showDroppedFileInViewer(file, meta = {}) {
    if (!mainPreview || !(file instanceof File)) return;
    const reuseUrl = (activeImageMeta && activeImageMeta.isDroppedFile && activeImageMeta._fileRef === file && activeImageMeta.url)
      ? activeImageMeta.url
      : URL.createObjectURL(file);
    if (typeof setCompareMode === "function") setCompareMode(false);
    if (btnToggleCompare) btnToggleCompare.style.display = "none";
    if (mainPreview.src !== reuseUrl) {
      mainPreview.src = reuseUrl;
    }
    mainPreview.style.display = "block";
    const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
    if (emptyState) emptyState.style.display = "none";
    activeImageMeta = {
      filename: file.name,
      url: reuseUrl,
      prompt: meta.prompt !== undefined ? meta.prompt : (activeImageMeta ? activeImageMeta.prompt || "" : ""),
      additional_prompt: meta.additional_prompt !== undefined ? meta.additional_prompt : (activeImageMeta ? activeImageMeta.additional_prompt || "" : ""),
      neg_prompt: meta.neg_prompt !== undefined ? meta.neg_prompt : (activeImageMeta ? activeImageMeta.neg_prompt || "" : ""),
      seed: meta.seed !== undefined ? meta.seed : (activeImageMeta ? activeImageMeta.seed || "" : ""),
      isDroppedFile: true,
      _fileRef: file,
    };
  }

  // Extract ComfyUI metadata and apply parameters to Cockpit
  async function extractAndApplyImageMetadata(source) {
    if (source instanceof File) {
      showDroppedFileInViewer(source);
    }
    showToast(t("toast_meta_reading", "Lese Bild-Metadaten..."), "info", 2000);

    // 1. Try super-fast client-side parsing first if source is a File
    if (source instanceof File) {
      const clientExtracted = await parsePngMetadataClientSide(source);
      if (clientExtracted) {
        showDroppedFileInViewer(source, clientExtracted);
        restoreState(clientExtracted);
        saveState();
        showToast(t("toast_meta_success_file", `Bild geladen & alle Parameter aus "${source.name}" übernommen!`).replace("{filename}", source.name), "success", 4500);
        return;
      }
    }

    // 2. Fallback to server extraction endpoint
    try {
      let resp;
      if (source instanceof File) {
        resp = await fetch("/api/extract_image_params", {
          method: "POST",
          headers: { "Content-Type": source.type || "application/octet-stream" },
          body: source,
        });
      } else {
        resp = await fetch("/api/extract_image_params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(source),
        });
      }

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));

        // Gracefully handle images without ComfyUI metadata:
        if (source instanceof File) {
          showDroppedFileInViewer(source);

          // If in I2I / Vision mode, automatically use this image as reference
          if (currentLLMMode === "i2i") {
            uploadI2IImage(source);
            return;
          }

          showToast(t("toast_meta_no_workflow", `Bild "${source.name}" in Vorschau geladen (keine ComfyUI-Metadaten).`).replace("{filename}", source.name), "info", 5000);
          return;
        }

        showToast(err.error || t("toast_meta_fail", "Metadaten konnten nicht gelesen werden."), "error", 5000);
        return;
      }

      const data = await resp.json();
      if (!data.success) {
        if (source instanceof File) {
          showDroppedFileInViewer(source);
          if (currentLLMMode === "i2i") {
            uploadI2IImage(source);
            return;
          }
          showToast(t("toast_meta_no_workflow", `Bild "${source.name}" in Vorschau geladen (keine ComfyUI-Metadaten).`).replace("{filename}", source.name), "info", 5000);
          return;
        }
        showToast(data.error || t("toast_no_params", "Keine Parameter gefunden."), "error", 5000);
        return;
      }

      // Display dropped image in the main viewer
      if (source instanceof File) {
        showDroppedFileInViewer(source, data);
      } else if (mainPreview && data.source_image) {
        if (typeof setCompareMode === "function") setCompareMode(false);
        mainPreview.src = `/output/${encodeURIComponent(data.source_image)}`;
        mainPreview.style.display = "block";
        const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
        if (emptyState) emptyState.style.display = "none";
      }

      // Apply extracted parameters to UI
      restoreState(data);
      saveState();

      showToast(t("toast_meta_success", `Bild geladen & alle Parameter übernommen!`), "success", 4500);
    } catch (e) {
      console.error("Metadata extraction error:", e);
      if (source instanceof File) {
        showDroppedFileInViewer(source);
      }
      showToast(t("toast_net_error", "Netzwerkfehler: Ist der Cockpit-Server (server.py) gestartet?"), "error", 5000);
    }
  }

  window.loadGalleryImageIntoCockpit = (relPath, rootId = "primary") => {
    if (!relPath) return;
    extractAndApplyImageMetadata({ filename: relPath, root: rootId || "primary" });
    if (typeof window.switchStudioModule === "function") {
      window.switchStudioModule("image");
    }
  };

  window.loadGalleryImageAsI2I = async (imgUrl, fileName) => {
    if (!imgUrl) return;
    try {
      const resp = await fetch(imgUrl);
      if (!resp.ok) throw new Error(t("err_image_load_failed", "Konnte Bild nicht laden"));
      const blob = await resp.blob();
      const ext = (blob.type && blob.type.split("/")[1]) || "png";
      const safeName = fileName && fileName.includes(".") ? fileName : `${fileName || "ref_" + Date.now()}.${ext}`;
      const file = new File([blob], safeName, { type: blob.type || "image/png" });
      if (typeof setLLMMode === "function") setLLMMode("i2i");
      uploadI2IImage(file);
      if (typeof window.switchStudioModule === "function") {
        window.switchStudioModule("image");
      }
    } catch (err) {
      showToast(t("toast_i2i_adopt_error", "Fehler beim Übernehmen aus der Vorschau: ") + (err?.message || err), "error", 4000);
    }
  };

  window.loadGalleryPromptForT2I = (promptText, negPromptText = "", addPromptText = "") => {
    if (!promptText) return;
    if (txtPrompt) {
      txtPrompt.value = promptText;
      txtPrompt.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (txtNegPrompt && negPromptText) {
      txtNegPrompt.value = negPromptText;
      txtNegPrompt.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof txtAddPrompt !== "undefined" && txtAddPrompt && addPromptText) {
      txtAddPrompt.value = addPromptText;
      txtAddPrompt.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (typeof setLLMMode === "function") setLLMMode("off");
    if (typeof updatePromptControllerBadge === "function") updatePromptControllerBadge();
    if (typeof window.switchStudioModule === "function") {
      window.switchStudioModule("image");
    }
    showToast(t("toast_prompt_t2i_loaded", "📝 Prompt für T2I ins Image-Modul übernommen!"), "success", 2500);
  };

  if (btnApplyAllParams) {
    btnApplyAllParams.addEventListener("click", () => {
      if (activeImageMeta && (activeImageMeta.filename || activeImageMeta.url)) {
        const fname = activeImageMeta.filename || (activeImageMeta.url ? activeImageMeta.url.split("/").pop() : "");
        if (fname) {
          extractAndApplyImageMetadata({ filename: decodeURIComponent(fname) });
          const orig = btnApplyAllParams.textContent;
          btnApplyAllParams.textContent = t("toast_loaded", "✓ Geladen!");
          setTimeout(() => { btnApplyAllParams.textContent = orig; }, 1500);
          return;
        }
      }
      showToast(t("toast_no_gallery_selection", "Kein Bild in der Galerie ausgewählt."), "error", 3000);
    });
  }

  // Global Drag & Drop Support (Drag ComfyUI Image anywhere onto window)
  let windowDragCounter = 0;

  window.addEventListener("dragenter", (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      windowDragCounter++;
      if (dropOverlay) {
        if (dropOverlaySub) {
          if (currentLLMMode === "i2i") {
            dropOverlaySub.textContent = t("drop_sub_i2i", "Als Referenzbild für Vision (Image -> Prompt) ablegen oder Metadaten laden");
          } else {
            dropOverlaySub.textContent = t("drop_sub", "Liest alle Prompts, Modell, Sampler, Seed, Pixaroma-Auflösung & LoRAs aus den Bild-Metadaten");
          }
        }
        dropOverlay.classList.add("active");
      }
    }
  });

  window.addEventListener("dragleave", (e) => {
    windowDragCounter--;
    if (windowDragCounter <= 0) {
      windowDragCounter = 0;
      if (dropOverlay) dropOverlay.classList.remove("active");
    }
  });

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  window.addEventListener("drop", (e) => {
    e.preventDefault();
    windowDragCounter = 0;
    if (dropOverlay) dropOverlay.classList.remove("active");

    if (e.target && e.target.closest && (e.target.closest("#i2iDropzone") || e.target.closest("#i2iUploadPanel"))) {
      return;
    }

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (/\.(png|webp|jpg|jpeg)$/i.test(file.name)) {
        extractAndApplyImageMetadata(file);
      } else {
        showToast(t("toast_drop_invalid", "Bitte ein Bild (PNG, JPG oder WebP) ablegen."), "error", 4000);
      }
    }
  });

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = mainPreview.src;
      a.download = `tA-Studio-${Date.now()}.png`;
      a.click();
    });
  }

  // Fullscreen Viewer Toggle
  if (btnFullscreen && mainPreview) {
    btnFullscreen.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        const target = mainPreview.closest(".viewer-canvas") || mainPreview;
        target.requestFullscreen().catch(() => {});
      }
    });
  }

  // Image Viewer Mouse-Wheel Zoom & Pan
  const viewerCanvas = document.getElementById("viewerCanvas");
  const viewerZoomBadge = document.getElementById("viewerZoomBadge");
  if (viewerCanvas && mainPreview) {
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 8;
    let zoomScale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOriginX = 0;
    let panOriginY = 0;

    function getActiveZoomTarget() {
      if (isCompareActive && compareContainer && compareContainer.style.display !== "none") {
        return compareContainer;
      }
      if (mainPreview.style.display !== "none") {
        return mainPreview;
      }
      return null;
    }

    function clampPan(target) {
      if (!target || zoomScale <= 1) {
        panX = 0;
        panY = 0;
        return;
      }
      const maxPanX = (target.offsetWidth * zoomScale) / 2;
      const maxPanY = (target.offsetHeight * zoomScale) / 2;
      panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
      panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    }

    function applyViewerTransform() {
      const transformVal = zoomScale > 1 ? `translate(${panX}px, ${panY}px) scale(${zoomScale})` : "";
      mainPreview.style.transform = transformVal;
      if (compareContainer) {
        compareContainer.style.transform = transformVal;
      }
      viewerCanvas.classList.toggle("is-zoomed", zoomScale > 1);
      if (viewerZoomBadge) {
        if (zoomScale > 1) {
          viewerZoomBadge.textContent = `🔍 ${Math.round(zoomScale * 100)}% ✕`;
          viewerZoomBadge.style.display = "inline-flex";
        } else {
          viewerZoomBadge.style.display = "none";
        }
      }
    }

    function resetViewerZoom() {
      zoomScale = 1;
      panX = 0;
      panY = 0;
      isPanning = false;
      viewerCanvas.classList.remove("is-panning");
      applyViewerTransform();
    }

    function zoomAtPoint(nextScale, clientX, clientY) {
      const target = getActiveZoomTarget();
      if (!target) return;
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
      if (clamped <= 1.02) {
        resetViewerZoom();
        return;
      }
      const rect = viewerCanvas.getBoundingClientRect();
      const mx = clientX - (rect.left + rect.width / 2);
      const my = clientY - (rect.top + rect.height / 2);
      const ratio = clamped / zoomScale;
      panX = mx - ratio * (mx - panX);
      panY = my - ratio * (my - panY);
      zoomScale = clamped;
      clampPan(target);
      applyViewerTransform();
    }

    viewerCanvas.addEventListener("wheel", (e) => {
      const target = getActiveZoomTarget();
      if (!target) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAtPoint(zoomScale * factor, e.clientX, e.clientY);
    }, { passive: false });

    viewerCanvas.addEventListener("pointerdown", (e) => {
      if (e.target && e.target.closest("#viewerZoomBadge")) return;
      if (zoomScale <= 1) return;
      const allowLeftPan = e.button === 0 && (!isCompareActive || e.shiftKey);
      const allowMiddlePan = e.button === 1;
      if (!allowLeftPan && !allowMiddlePan) return;
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panOriginX = panX;
      panOriginY = panY;
      viewerCanvas.classList.add("is-panning");
      try { viewerCanvas.setPointerCapture(e.pointerId); } catch (_) {}
    });

    viewerCanvas.addEventListener("pointermove", (e) => {
      if (!isPanning) return;
      const target = getActiveZoomTarget();
      panX = panOriginX + (e.clientX - panStartX);
      panY = panOriginY + (e.clientY - panStartY);
      clampPan(target);
      applyViewerTransform();
    });

    const stopPan = (e) => {
      if (!isPanning) return;
      isPanning = false;
      viewerCanvas.classList.remove("is-panning");
      try { viewerCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    viewerCanvas.addEventListener("pointerup", stopPan);
    viewerCanvas.addEventListener("pointercancel", stopPan);

    viewerCanvas.addEventListener("dblclick", (e) => {
      if (e.target && e.target.closest("#viewerZoomBadge")) return;
      if (!getActiveZoomTarget()) return;
      if (zoomScale > 1) {
        resetViewerZoom();
      } else {
        zoomAtPoint(2.5, e.clientX, e.clientY);
      }
    });

    if (viewerZoomBadge) {
      viewerZoomBadge.addEventListener("click", resetViewerZoom);
    }
    mainPreview.addEventListener("load", resetViewerZoom);
  }

  // Before/After SeedVR2 Compare View
  function setCompareSplit(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    if (compareBeforeWrap) {
      compareBeforeWrap.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    }
    if (compareDivider) {
      compareDivider.style.left = `${clamped}%`;
    }
  }

  function setCompareMode(active) {
    isCompareActive = Boolean(active);
    if (!compareContainer || !mainPreview) return;
    if (isCompareActive) {
      mainPreview.style.display = "none";
      compareContainer.style.display = "inline-flex";
      setCompareSplit(50);
    } else {
      compareContainer.style.display = "none";
      mainPreview.style.display = "block";
    }
    if (btnToggleCompare) {
      btnToggleCompare.classList.toggle("active", isCompareActive);
    }
  }

  function normalizeImageUrlKey(url) {
    if (!url) return "";
    if (url.startsWith("/view?")) return url;
    return url.split("?")[0];
  }

  function syncCompareAvailability(afterUrl) {
    const key = normalizeImageUrlKey(afterUrl);
    const beforeUrl = key ? comparePairsByUrl.get(key) : null;
    if (beforeUrl && compareBeforeImg && compareAfterImg && btnToggleCompare) {
      compareBeforeImg.src = beforeUrl;
      compareAfterImg.src = afterUrl;
      btnToggleCompare.style.display = "inline-flex";
      if (isCompareActive) {
        setCompareMode(true);
      }
    } else {
      if (btnToggleCompare) btnToggleCompare.style.display = "none";
      setCompareMode(false);
    }
  }

  if (btnToggleCompare) {
    btnToggleCompare.addEventListener("click", () => {
      setCompareMode(!isCompareActive);
    });
  }

  if (compareContainer) {
    let isDraggingCompare = false;
    const updateSplitFromClientX = (clientX) => {
      const rect = compareContainer.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setCompareSplit(pct);
    };
    compareContainer.addEventListener("pointerdown", (e) => {
      isDraggingCompare = true;
      compareContainer.setPointerCapture(e.pointerId);
      updateSplitFromClientX(e.clientX);
    });
    compareContainer.addEventListener("pointermove", (e) => {
      if (!isDraggingCompare) return;
      updateSplitFromClientX(e.clientX);
    });
    const stopDrag = (e) => {
      if (!isDraggingCompare) return;
      isDraggingCompare = false;
      try { compareContainer.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    compareContainer.addEventListener("pointerup", stopDrag);
    compareContainer.addEventListener("pointercancel", stopDrag);
  }

  // Gallery Toolbar: Collapse, Clear, Refresh
  function updateGalleryToggleUI(isCollapsed) {
    if (!btnToggleGallery) return;
    const labelEl = btnToggleGallery.querySelector(".btn-label") || btnToggleGallery;
    const shortWord = t("nav_gallery", "🖼️ Galerie").replace(/^[^\s]+\s+/, "");
    if (isCollapsed) {
      labelEl.textContent = t("btn_expand_gallery", "▲ Galerie anzeigen");
      btnToggleGallery.dataset.compactLabel = `▲ ${shortWord}`;
      btnToggleGallery.title = t("btn_expand_gallery_title", "Galerieleiste ausklappen");
    } else {
      labelEl.textContent = t("btn_collapse_gallery", "▼ Galerie einklappen");
      btnToggleGallery.dataset.compactLabel = `▼ ${shortWord}`;
      btnToggleGallery.title = t("btn_collapse_gallery_title", "Galerieleiste einklappen");
    }
  }

  if (btnToggleGallery && filmstripGallery) {
    btnToggleGallery.addEventListener("click", () => {
      const isCollapsed = filmstripGallery.classList.toggle("collapsed");
      updateGalleryToggleUI(isCollapsed);
      try {
        localStorage.setItem("tAStudio.gallery_collapsed", isCollapsed ? "1" : "0");
      } catch (e) {}
    });
  }

  if (btnClearGallery && filmstripGallery) {
    btnClearGallery.addEventListener("click", () => {
      filmstripGallery.innerHTML = `
        <div data-empty-state="cleared" style="color:var(--text-muted); font-size:12px; padding: 0 16px; white-space:nowrap; display:flex; align-items:center; gap:10px;">
          <span>🧹 ${t("gallery_cleared", "Galerieansicht geleert. (Alle Dateien bleiben sicher auf deiner Festplatte erhalten.)")}</span>
          <button type="button" class="btn-action" id="btnRestoreGalleryHint" style="padding: 3px 8px; font-size: 11px;">🔄 ${t("gallery_restore_hint", "Bilder neu laden")}</button>
        </div>
      `;
      const restoreBtn = document.getElementById("btnRestoreGalleryHint");
      if (restoreBtn) {
        restoreBtn.addEventListener("click", () => loadHistoryGallery());
      }
      const lbl = btnClearGallery.querySelector(".btn-label") || btnClearGallery;
      lbl.textContent = t("toast_cleared", "✓ Geleert!");
      setTimeout(() => { lbl.textContent = t("btn_clear_gallery", "🧹 Galerie leeren"); }, 1500);
    });
  }

  if (btnRefreshGallery) {
    btnRefreshGallery.addEventListener("click", async () => {
      const lbl = btnRefreshGallery.querySelector(".btn-label") || btnRefreshGallery;
      lbl.textContent = t("loading_status", "Lade...");
      await loadHistoryGallery();
      lbl.textContent = t("toast_loaded", "✓ Geladen!");
      setTimeout(() => { lbl.textContent = t("btn_refresh_gallery", "🔄 Neu laden"); }, 1200);
    });
  }

  function updateLLMModeAvailability(reachable) {
    if (llmModePills) {
      llmModePills.querySelectorAll(".pill-btn").forEach(b => {
        const mode = b.getAttribute("data-llmmode");
        if (mode === "t2i" || mode === "i2i") {
          b.disabled = !reachable;
          b.title = reachable
            ? ""
            : t("llm_unavailable_title", "Weder lokaler LLM-Server (LM Studio / Ollama) noch Cloud-API-Key aktiv");
        }
      });
    }
    if (!reachable && currentLLMMode !== "off") {
      setLLMMode("off");
    }
  }

  // Live-check LLM Server status (LM Studio on 1234 / Ollama on 11434 / Cloud)
  async function checkLLMStatus() {
    try {
      const res = await fetch("/api/check_llm");
      if (res.ok) {
        const data = await res.json();
        const firstCheck = !hasLLMStatusChecked;
        hasLLMStatusChecked = true;
        lastLLMStatus = data;
        const reachable = Boolean(data.reachable);
        updateLLMModeAvailability(reachable);

        // On initial check or while LLM is off, auto-switch away from an offline model if another provider is available
        if (reachable && selLLMModel && selLLMModel.options.length > 0 && !isLLMModelAvailable(selLLMModel.value, data)) {
          if (firstCheck || currentLLMMode === "off") {
            const bestAvail = findBestAvailableLLMModel(currentLLMMode, data);
            if (bestAvail && bestAvail !== selLLMModel.value) {
              selLLMModel.value = bestAvail;
              if (currentLLMMode === "t2i" || currentLLMMode === "i2i") {
                llmModelsByMode[currentLLMMode] = bestAvail;
              }
              updateLLMSourceBadge();
            }
          }
        }

        updateLLMModelBadge(data);
        if (llmModelMenu && llmModelMenu.style.display !== "none") {
          renderLLMModelList();
        }
      }
    } catch (e) {
      hasLLMStatusChecked = true;
      lastLLMStatus = { lm_studio: false, ollama: false, cloud: false, cloud_providers: [], reachable: false };
      updateLLMModeAvailability(false);
      updateLLMModelBadge(lastLLMStatus);
    }
  }

  if (llmModelBadge) {
    llmModelBadge.style.cursor = "pointer";
    llmModelBadge.title = t("badge_llm_title_click", "Klicken, um Status von LM Studio / Ollama neu zu prüfen");
    llmModelBadge.addEventListener("click", () => {
      llmModelBadge.textContent = t("badge_llm_checking", "Prüfe...");
      checkLLMStatus();
    });
  }

  function updateLaunchButtonState(isOnline) {
    isComfyOnline = Boolean(isOnline);
    if (!btnLaunchComfy) return;
    btnLaunchComfy.style.display = "inline-flex";
    if (isOnline) {
      btnLaunchComfy.classList.remove("is-offline");
      btnLaunchComfy.classList.add("is-online");
      btnLaunchComfy.disabled = true;
      btnLaunchComfy.textContent = t("btn_launch_comfy_running", "✓ ComfyUI läuft");
      btnLaunchComfy.title = t("btn_launch_comfy_running_title", "ComfyUI ist verbunden und läuft");
      if (btnRestartComfy) {
        btnRestartComfy.style.display = "inline-flex";
        btnRestartComfy.disabled = false;
        btnRestartComfy.textContent = t("btn_restart_comfy", "🔄 ComfyUI neu starten");
      }
      const presetOffline = document.getElementById("presetEditorOfflineNotice");
      if (presetEditorModal && presetEditorModal.style.display === "flex" && presetOffline && presetOffline.style.display !== "none" && currentPresetEditorUrl) {
        presetOffline.style.display = "none";
        if (presetEditorIframe) {
          presetEditorIframe.style.display = "block";
          presetEditorIframe.src = currentPresetEditorUrl;
        }
      }
    } else {
      btnLaunchComfy.classList.remove("is-online");
      btnLaunchComfy.classList.add("is-offline");
      btnLaunchComfy.disabled = false;
      btnLaunchComfy.textContent = t("btn_launch_comfy", "⚡ ComfyUI starten");
      btnLaunchComfy.title = t("btn_launch_comfy_title", "ComfyUI im Terminal-Fenster starten");
      if (btnRestartComfy) {
        btnRestartComfy.style.display = "none";
      }
    }
  }

  // 10. Check ComfyUI Status & Missing Custom Nodes
  let lastComfyOnlineState = null;
  let missingNodesCheckedOnce = false;
  let missingNodesDismissed = false;

  const missingNodesModal = document.getElementById("missingNodesModal");
  const btnCloseMissingNodesModal = document.getElementById("btnCloseMissingNodesModal");
  const btnDismissMissingNodes = document.getElementById("btnDismissMissingNodes");
  const btnRecheckMissingNodes = document.getElementById("btnRecheckMissingNodes");
  const btnInstallMissingNodes = document.getElementById("btnInstallMissingNodes");
  const missingNodesDesc = document.getElementById("missingNodesDesc");
  const missingNodesList = document.getElementById("missingNodesList");
  const missingNodesDirGroup = document.getElementById("missingNodesDirGroup");
  const inpMissingNodesComfyDir = document.getElementById("inpMissingNodesComfyDir");
  const btnBrowseMissingNodesDir = document.getElementById("btnBrowseMissingNodesDir");
  const installNodesProgressWrap = document.getElementById("installNodesProgressWrap");
  const installNodesProgressText = document.getElementById("installNodesProgressText");
  const installNodesProgressCount = document.getElementById("installNodesProgressCount");
  const installNodesProgressBar = document.getElementById("installNodesProgressBar");
  const installNodesLog = document.getElementById("installNodesLog");

  let nodeInstallPollTimer = null;
  let lastMissingPacks = null;
  let lastMissingNodesPaths = null;

  function renderMissingPacks(packs, paths) {
    if (!missingNodesList) return;
    lastMissingPacks = packs;
    lastMissingNodesPaths = paths || {};
    missingNodesList.innerHTML = "";

    if (missingNodesDesc) {
      missingNodesDesc.textContent = t(
        "missing_nodes_desc",
        "Für den Workflow fehlen in deiner ComfyUI-Installation benötigte Custom-Node-Packs. Sollen die ausgewählten Packs jetzt automatisch installiert werden?"
      );
    }
    if (btnDismissMissingNodes) {
      btnDismissMissingNodes.textContent = t("missing_nodes_btn_later", "Später");
    }
    if (btnRecheckMissingNodes) {
      btnRecheckMissingNodes.textContent = t("missing_nodes_btn_recheck", "🔄 Neu prüfen");
    }
    if (installNodesProgressWrap) {
      installNodesProgressWrap.style.display = "none";
    }

    if (missingNodesDirGroup) {
      const needsDir = !paths?.is_remote && !paths?.custom_nodes_dir;
      missingNodesDirGroup.style.display = needsDir ? "block" : "none";
      if (inpMissingNodesComfyDir && paths?.comfy_root && !inpMissingNodesComfyDir.value) {
        inpMissingNodesComfyDir.value = paths.comfy_root;
      }
    }

    if (btnInstallMissingNodes) {
      btnInstallMissingNodes.style.display = "";
      btnInstallMissingNodes.disabled = Boolean(paths?.is_remote);
      btnInstallMissingNodes.title = paths?.is_remote
        ? t("missing_nodes_remote_title", "Remote-ComfyUI kann nicht lokal installiert werden")
        : "";
    }

    packs.forEach((pack) => {
      const item = document.createElement("label");
      item.className = "missing-pack-item";
      item.dataset.packId = pack.id;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = pack.id;
      cb.checked = !pack.folder_exists;

      const info = document.createElement("div");
      info.className = "missing-pack-info";

      const hdr = document.createElement("div");
      hdr.className = "missing-pack-header";

      const nameEl = document.createElement("span");
      nameEl.className = "missing-pack-name";
      nameEl.textContent = pack.name;

      const badge = document.createElement("span");
      badge.className = "missing-pack-badge";
      if (pack.folder_exists) {
        badge.classList.add("restart");
        badge.textContent = t("missing_nodes_badge_restart", "Neustart nötig");
      } else if (pack.required) {
        badge.textContent = t("missing_nodes_badge_required", "Erforderlich");
      } else {
        badge.classList.add("optional");
        badge.textContent = t("missing_nodes_badge_optional", "Optional");
      }

      hdr.appendChild(nameEl);
      hdr.appendChild(badge);

      const desc = document.createElement("div");
      desc.className = "missing-pack-desc";
      desc.textContent = (currentLang === "en" ? pack.description_en : pack.description_de) || "";

      const nodesEl = document.createElement("div");
      nodesEl.className = "missing-pack-nodes";
      nodesEl.textContent = t("missing_nodes_missing_prefix", "Fehlt: ") + (pack.missing_nodes || []).join(", ");

      info.appendChild(hdr);
      info.appendChild(desc);
      info.appendChild(nodesEl);

      item.appendChild(cb);
      item.appendChild(info);
      missingNodesList.appendChild(item);
    });
  }

  async function checkMissingNodes(forceShow = false) {
    if (!missingNodesModal) return false;
    try {
      const res = await fetch("/api/check_nodes");
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.comfy_online) return false;

      const missing = Array.isArray(data.missing_packs) ? data.missing_packs : [];
      if (missing.length === 0) {
        if (forceShow && missingNodesModal.style.display === "flex") {
          missingNodesModal.style.display = "none";
          showToast(
            t("missing_nodes_all_installed", "Alle benötigten Custom Nodes sind installiert!"),
            "success",
            3500
          );
          refreshPresetsFromComfy();
          loadLLMModelsFromComfy();
        }
        return true;
      }

      if (!forceShow && missingNodesDismissed) return true;
      renderMissingPacks(missing, data.paths || {});
      missingNodesModal.style.display = "flex";
      return true;
    } catch (e) {
      return false;
    }
  }

  if (missingNodesModal) {
    const closeMissingNodesModal = () => {
      missingNodesModal.style.display = "none";
      missingNodesDismissed = true;
    };
    if (btnCloseMissingNodesModal) btnCloseMissingNodesModal.addEventListener("click", closeMissingNodesModal);
    if (btnDismissMissingNodes) btnDismissMissingNodes.addEventListener("click", closeMissingNodesModal);
    missingNodesModal.addEventListener("click", (e) => {
      if (e.target === missingNodesModal) closeMissingNodesModal();
    });
    if (btnRecheckMissingNodes) {
      btnRecheckMissingNodes.addEventListener("click", () => checkMissingNodes(true));
    }
    function attachBrowseButton(btn, inputEl, endpoint) {
      if (!btn || !inputEl) return;
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const currentVal = inputEl.value.trim();
          const url = currentVal ? `${endpoint}?initial=${encodeURIComponent(currentVal)}` : endpoint;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.path) {
              inputEl.value = data.path;
              inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        } catch (e) {}
        btn.disabled = false;
      });
    }

    attachBrowseButton(btnBrowseOutputDir, inpOutputDir, "/api/browse_folder");
    attachBrowseButton(btnBrowseVideoOutputDir, inpVideoOutputDir, "/api/browse_folder");
    attachBrowseButton(btnBrowseMusicOutputDir, inpMusicOutputDir, "/api/browse_folder");
    attachBrowseButton(btnBrowseLaunchCmd, inpComfyLaunchCmd, "/api/browse_file");
    attachBrowseButton(btnBrowseExtraModelsDir, inpExtraModelsDir, "/api/browse_folder");
    attachBrowseButton(btnBrowseMissingNodesDir, inpMissingNodesComfyDir, "/api/browse_folder");
    if (btnInstallMissingNodes) {
      btnInstallMissingNodes.addEventListener("click", async () => {
        const selectedIds = Array.from(missingNodesList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) {
          showToast(
            t("missing_nodes_select_one", "Bitte wähle mindestens ein Pack aus."),
            "info",
            3000
          );
          return;
        }

        const comfyDir = inpMissingNodesComfyDir ? inpMissingNodesComfyDir.value.trim() : "";
        btnInstallMissingNodes.disabled = true;
        if (btnRecheckMissingNodes) btnRecheckMissingNodes.disabled = true;
        if (installNodesProgressWrap) installNodesProgressWrap.style.display = "block";
        if (installNodesProgressBar) installNodesProgressBar.style.width = "5%";
        if (installNodesLog) installNodesLog.textContent = t("missing_nodes_starting", "Starte Installation...");

        try {
          const res = await fetch("/api/install_nodes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pack_ids: selectedIds, comfy_dir: comfyDir, lang: currentLang }),
          });
          const data = await res.json();
          if (!res.ok) {
            if (installNodesProgressWrap) installNodesProgressWrap.style.display = "none";
            if (data.code === "NO_COMFY_DIR" && missingNodesDirGroup) {
              missingNodesDirGroup.style.display = "block";
              if (inpMissingNodesComfyDir) inpMissingNodesComfyDir.focus();
            }
            showToast(data.error || t("missing_nodes_install_failed", "Installation fehlgeschlagen."), "error", 5500);
            btnInstallMissingNodes.disabled = false;
            if (btnRecheckMissingNodes) btnRecheckMissingNodes.disabled = false;
            return;
          }

          if (nodeInstallPollTimer) clearInterval(nodeInstallPollTimer);
          nodeInstallPollTimer = setInterval(async () => {
            try {
              const sRes = await fetch("/api/install_nodes_status");
              if (!sRes.ok) return;
              const job = await sRes.json();
              const total = Math.max(1, job.total || 1);
              const done = job.completed || 0;
              const pct = Math.round((done / total) * 100);

              if (installNodesProgressBar) installNodesProgressBar.style.width = `${Math.max(8, pct)}%`;
              if (installNodesProgressCount) installNodesProgressCount.textContent = `${done} / ${total}`;
              if (installNodesProgressText) {
                installNodesProgressText.textContent = job.current_pack
                  ? t("missing_nodes_installing_pack", "Installiere: {pack}").replace("{pack}", job.current_pack)
                  : (job.status === "done"
                    ? t("missing_nodes_done_restart", "Fertig – bitte ComfyUI neu starten!")
                    : t("missing_nodes_done_warnings", "Mit Hinweisen beendet"));
              }
              if (installNodesLog && Array.isArray(job.logs)) {
                installNodesLog.textContent = job.logs.join("\n");
                installNodesLog.scrollTop = installNodesLog.scrollHeight;
              }

              if (job.results && missingNodesList) {
                Object.entries(job.results).forEach(([pid, r]) => {
                  const row = missingNodesList.querySelector(`.missing-pack-item[data-pack-id="${pid}"]`);
                  if (!row) return;
                  row.classList.remove("installed", "failed");
                  row.classList.add(r.ok ? "installed" : "failed");
                  const badge = row.querySelector(".missing-pack-badge");
                  if (badge) {
                    badge.className = `missing-pack-badge ${r.ok ? "ok" : ""}`;
                    badge.textContent = r.ok
                      ? t("missing_nodes_row_ok", "✓ Installiert (ComfyUI neu starten)")
                      : t("missing_nodes_row_err", "✖ Fehler");
                  }
                });
              }

              if (job.status === "done" || job.status === "error") {
                clearInterval(nodeInstallPollTimer);
                nodeInstallPollTimer = null;
                btnInstallMissingNodes.disabled = false;
                if (btnRecheckMissingNodes) btnRecheckMissingNodes.disabled = false;
                if (job.status === "done") {
                  btnInstallMissingNodes.style.display = "none";
                  if (nodesRestartBanner) nodesRestartBanner.style.display = "flex";
                  if (missingNodesDesc) {
                    missingNodesDesc.textContent = t(
                      "missing_nodes_desc_done",
                      "Installation abgeschlossen! Bitte starte ComfyUI jetzt neu, damit die neuen Custom Nodes geladen werden."
                    );
                  }
                  if (btnDismissMissingNodes) {
                    btnDismissMissingNodes.textContent = t("missing_nodes_btn_close", "Schließen");
                  }
                  if (btnRecheckMissingNodes) {
                    btnRecheckMissingNodes.textContent = t("missing_nodes_btn_recheck_restart", "🔄 Nach Neustart prüfen");
                  }
                }
                showToast(
                  job.status === "done"
                    ? t("missing_nodes_toast_done", "Custom Nodes installiert! Bitte starte ComfyUI neu.")
                    : (job.error || t("missing_nodes_toast_some_errors", "Einige Packs hatten Fehler.")),
                  job.status === "done" ? "success" : "error",
                  7000
                );
              }
            } catch (e) {}
          }, 700);
        } catch (e) {
          showToast(t("toast_net_error", "Netzwerkfehler"), "error", 4500);
          btnInstallMissingNodes.disabled = false;
          if (btnRecheckMissingNodes) btnRecheckMissingNodes.disabled = false;
        }
      });
    }
  }

  let consecutiveOfflineCount = 0;

  async function checkComfyStatus() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        if (data.online) {
          consecutiveOfflineCount = 0;
          const justCameOnline = lastComfyOnlineState === false;
          lastComfyOnlineState = true;
          updateLaunchButtonState(true);
          updateGpuDisplay({
            online: true,
            gpu: data.gpu,
            vramFree: data.vram_free,
          });
          fetchHwMonitor();
          if (!missingNodesCheckedOnce || justCameOnline) {
            if (justCameOnline) {
              refreshPresetsFromComfy();
              loadLLMModelsFromComfy();
            }
            const ok = await checkMissingNodes(false);
            if (ok) {
              missingNodesCheckedOnce = true;
            }
          }
          if (!bgRemoveState.checkedOnce || justCameOnline) {
            checkBgRemoveStatus();
          }
          return;
        }
      }
    } catch (e) {}

    consecutiveOfflineCount++;
    if (lastComfyOnlineState === true && consecutiveOfflineCount < 2) {
      return;
    }
    lastComfyOnlineState = false;
    updateLaunchButtonState(false);
    updateGpuDisplay({ online: false });
    if (bgRemoveState.available || bgRemoveState.reason !== "comfy_offline") {
      bgRemoveState.available = false;
      bgRemoveState.reason = "comfy_offline";
      bgRemoveState.nodeType = null;
      updateBgRemoveUI(bgRemoveState);
    }
  }

  if (comfyOfflineModal) {
    const closeComfyOfflineModal = () => {
      comfyOfflineModal.style.display = "none";
    };
    if (btnCloseComfyOfflineModal) btnCloseComfyOfflineModal.addEventListener("click", closeComfyOfflineModal);
    if (btnCancelComfyOffline) btnCancelComfyOffline.addEventListener("click", closeComfyOfflineModal);
    comfyOfflineModal.addEventListener("click", (e) => {
      if (e.target === comfyOfflineModal) closeComfyOfflineModal();
    });
    if (btnSettingsComfyOffline) {
      btnSettingsComfyOffline.addEventListener("click", () => {
        closeComfyOfflineModal();
        openSettingsModal({ focusLaunchCmd: true });
      });
    }
    if (btnStartComfyFromModal) {
      btnStartComfyFromModal.addEventListener("click", () => {
        closeComfyOfflineModal();
        if (btnLaunchComfy) btnLaunchComfy.click();
      });
    }
  }

  // ComfyUI Launcher Button Handler
  if (btnLaunchComfy) {
    btnLaunchComfy.addEventListener("click", async () => {
      if (inpComfyLaunchCmd && !inpComfyLaunchCmd.value.trim()) {
        openSettingsModal({ focusLaunchCmd: true, launchAfterSave: true });
        showToast(
          t("toast_launch_missing", "Bitte trage zuerst deine ComfyUI-Startdatei (z. B. run_nvidia_gpu.bat) ein und speichere."),
          "info",
          6000
        );
        return;
      }

      btnLaunchComfy.textContent = t("btn_launch_comfy_opening", "⏳ Öffne Terminal…");
      btnLaunchComfy.disabled = true;
      try {
        const launchCmdVal = inpComfyLaunchCmd ? inpComfyLaunchCmd.value.trim() : "";
        const res = await fetch("/api/launch_comfy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comfy_launch_cmd: launchCmdVal })
        });
        const data = await res.json();
        if (data.status === "launched") {
          btnLaunchComfy.textContent = data.terminal === "wt"
            ? t("btn_launch_comfy_tab", "⏳ Neuer Tab geöffnet…")
            : t("btn_launch_comfy_started", "⏳ Terminal gestartet…");
          // Poll faster for connection
          let tries = 0;
          const pollComfy = setInterval(async () => {
            tries++;
            try {
              const s = await fetch("/api/status");
              if (s.ok) {
                const d = await s.json();
                if (d.online) {
                  clearInterval(pollComfy);
                  updateLaunchButtonState(true);
                  checkComfyStatus();
                  await refreshPresetsFromComfy();
                  await loadLLMModelsFromComfy();
                }
              }
            } catch (err) {}
            if (tries > 60) {
              clearInterval(pollComfy);
              btnLaunchComfy.textContent = t("btn_launch_comfy", "⚡ ComfyUI starten");
              btnLaunchComfy.disabled = false;
            }
          }, 2000);
        } else {
          if (data.code === "NO_LAUNCH_CMD") {
            openSettingsModal({ focusLaunchCmd: true, launchAfterSave: true });
            showToast(
              t("toast_launch_missing", "Bitte trage zuerst deine ComfyUI-Startdatei (z. B. run_nvidia_gpu.bat) ein und speichere."),
              "info",
              6000
            );
          } else {
            showToast(
              t("toast_launch_error", "Fehler beim Starten von ComfyUI: ") + (data.error || t("err_unknown", "Unbekannter Fehler")),
              "error",
              6000
            );
            if (res.status === 400) {
              openSettingsModal({ focusLaunchCmd: true, launchAfterSave: true });
            }
          }
          btnLaunchComfy.textContent = t("btn_launch_comfy", "⚡ ComfyUI starten");
          btnLaunchComfy.disabled = false;
        }
      } catch (e) {
        showToast(t("toast_network_error", "Netzwerkfehler: ") + e.message, "error", 5000);
        btnLaunchComfy.textContent = t("btn_launch_comfy", "⚡ ComfyUI starten");
        btnLaunchComfy.disabled = false;
      }
    });
  }

  // Reusable Generic Themed Confirm Modal (centered, matches active theme)
  function showCockpitConfirm({ icon = "❓", title = "Bestätigung", message = "", confirmText = null, cancelText = null, danger = false } = {}) {
    const modal = document.getElementById("cockpitConfirmModal");
    const elIcon = document.getElementById("cockpitConfirmIcon");
    const elTitle = document.getElementById("cockpitConfirmTitle");
    const elMsg = document.getElementById("cockpitConfirmMessage");
    const btnOk = document.getElementById("btnOkCockpitConfirm");
    const btnCancel = document.getElementById("btnCancelCockpitConfirm");
    const btnClose = document.getElementById("btnCloseCockpitConfirm");
    if (!modal || !btnOk || !btnCancel) {
      return Promise.resolve(window.confirm(message || title));
    }
    if (elIcon) elIcon.textContent = icon;
    if (elTitle) elTitle.textContent = title;
    if (elMsg) elMsg.textContent = message;
    btnOk.textContent = confirmText || t("btn_confirm_ok", "OK");
    btnCancel.textContent = cancelText || t("btn_cancel", "Abbrechen");
    btnOk.style.background = danger ? "var(--danger, #ef4444)" : "var(--accent)";
    btnOk.style.borderColor = danger ? "var(--danger, #ef4444)" : "var(--accent)";
    modal.style.display = "flex";
    btnCancel.focus();

    return new Promise((resolve) => {
      const cleanup = (res) => {
        modal.style.display = "none";
        btnOk.removeEventListener("click", onOk);
        btnCancel.removeEventListener("click", onCancel);
        btnClose?.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKey, true);
        resolve(res);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onBackdrop = (e) => { if (e.target === modal) cleanup(false); };
      const onKey = (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cleanup(false); }
        else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); cleanup(document.activeElement === btnOk); }
      };
      btnOk.addEventListener("click", onOk);
      btnCancel.addEventListener("click", onCancel);
      btnClose?.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKey, true);
    });
  }

  // ComfyUI Restart Button Handler
  if (btnRestartComfy) {
    btnRestartComfy.addEventListener("click", async () => {
      const confirmed = await showCockpitConfirm({
        icon: "🔄",
        title: t("restart_comfy_modal_title", "ComfyUI neu starten?"),
        message: t("restart_comfy_modal_desc", "Möchtest du ComfyUI wirklich neu starten? Laufende Generierungen werden dadurch unterbrochen."),
        confirmText: t("restart_comfy_confirm_btn", "Neu starten"),
      });
      if (!confirmed) return;

      btnRestartComfy.disabled = true;
      btnRestartComfy.textContent = t("btn_restart_comfy_restarting", "⏳ Neustart…");
      try {
        const launchCmdVal = inpComfyLaunchCmd ? inpComfyLaunchCmd.value.trim() : "";
        const res = await fetch("/api/restart_comfy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comfy_launch_cmd: launchCmdVal })
        });
        const data = await res.json();
        if (data.status === "launched") {
          if (btnLaunchComfy) {
            btnLaunchComfy.classList.remove("is-online");
            btnLaunchComfy.classList.add("is-offline");
            btnLaunchComfy.textContent = t("btn_restart_comfy_restarting", "⏳ Neustart…");
          }
          let tries = 0;
          let sawOffline = false;
          const pollRestart = setInterval(async () => {
            tries++;
            try {
              const s = await fetch("/api/status");
              if (s.ok) {
                const d = await s.json();
                if (!d.online) sawOffline = true;
                if (d.online && (sawOffline || tries >= 3)) {
                  clearInterval(pollRestart);
                  updateLaunchButtonState(true);
                  checkComfyStatus();
                  await refreshPresetsFromComfy();
                  await loadLLMModelsFromComfy();
                }
              }
            } catch (err) {}
            if (tries > 60) {
              clearInterval(pollRestart);
              btnRestartComfy.disabled = false;
              btnRestartComfy.textContent = t("btn_restart_comfy", "🔄 ComfyUI neu starten");
            }
          }, 2000);
        } else {
          if (data.code === "NO_LAUNCH_CMD") {
            openSettingsModal({ focusLaunchCmd: true, launchAfterSave: false });
            showToast(t("toast_launch_missing", "Bitte trage zuerst deine ComfyUI-Startdatei (z. B. run_nvidia_gpu.bat) ein und speichere."), "info", 6000);
          } else {
            showToast(t("toast_launch_error", "Fehler beim Starten von ComfyUI: ") + (data.error || t("err_unknown", "Unbekannter Fehler")), "error", 6000);
          }
          btnRestartComfy.disabled = false;
          btnRestartComfy.textContent = t("btn_restart_comfy", "🔄 ComfyUI neu starten");
        }
      } catch (e) {
        showToast(t("toast_network_error", "Netzwerkfehler: ") + e.message, "error", 5000);
        btnRestartComfy.disabled = false;
        btnRestartComfy.textContent = t("btn_restart_comfy", "🔄 ComfyUI neu starten");
      }
    });
  }

  // 11. Settings & Preset Editors Management
  function getComfyUrl() {
    return localStorage.getItem("tAStudio.comfyUrl") || "http://127.0.0.1:8188";
  }

  if (inpComfyUrl) {
    inpComfyUrl.value = getComfyUrl();
  }

  try {
    const curUrl = new URL(window.location.href);
    if (curUrl.searchParams.has("_r")) {
      curUrl.searchParams.delete("_r");
      window.history.replaceState({}, "", curUrl.toString());
    }
  } catch (_) {}

  function reloadStudioUI() {
    try {
      if (typeof saveStateNow === "function") saveStateNow();
    } catch (_) {}
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", String(Date.now()));
      window.location.replace(url.toString());
    } catch (_) {
      window.location.reload();
    }
  }
  if (btnReloadApp) {
    btnReloadApp.addEventListener("click", reloadStudioUI);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) {
      e.preventDefault();
      reloadStudioUI();
    }
  });

  function openSettingsModal({ focusLaunchCmd = false, launchAfterSave = false } = {}) {
    if (!settingsModal) return;
    pendingLaunchAfterSettings = Boolean(launchAfterSave);
    if (inpComfyUrl) inpComfyUrl.value = getComfyUrl();
    if (connTestResult) connTestResult.textContent = "";
    settingsModal.style.display = "flex";
    refreshPlatoKeysFromComfy();
    if (focusLaunchCmd && inpComfyLaunchCmd) {
      setTimeout(() => {
        inpComfyLaunchCmd.focus();
        inpComfyLaunchCmd.style.borderColor = "var(--accent)";
        setTimeout(() => {
          inpComfyLaunchCmd.style.borderColor = "";
        }, 2500);
      }, 60);
    }
  }

  if (btnSettings && settingsModal) {
    btnSettings.addEventListener("click", () => {
      openSettingsModal();
    });
  }

  if (btnCloseSettings && settingsModal) {
    btnCloseSettings.addEventListener("click", () => {
      pendingLaunchAfterSettings = false;
      settingsModal.style.display = "none";
    });
  }

  if (btnTestComfyConn) {
    btnTestComfyConn.addEventListener("click", async () => {
      connTestResult.textContent = t("settings_conn_testing", "Prüfe...");
      connTestResult.style.color = "var(--warn)";
      try {
        const resp = await fetch(`/proxy/comfy/system_stats`);
        if (resp.ok) {
          connTestResult.textContent = t("settings_conn_ok", "✓ Erfolgreich verbunden!");
          connTestResult.style.color = "var(--accent2)";
          return;
        }
      } catch (err) {}
      connTestResult.textContent = t("settings_conn_fail", "✕ Nicht erreichbar");
      connTestResult.style.color = "var(--danger)";
    });
  }

  // Open Explorer Folder
  if (btnOpenFolder) {
    btnOpenFolder.addEventListener("click", async () => {
      try {
        await fetch("/api/open_folder", { method: "POST" });
      } catch (e) {}
    });
  }

  // Save Settings Modal
  if (btnSaveSettings && settingsModal) {
    btnSaveSettings.addEventListener("click", async () => {
      const chosenLang = selLanguage ? selLanguage.value : currentLang;
      applyLanguage(chosenLang, true);
      const cloudKeyUpdates = {};
      CLOUD_KEY_INPUTS.forEach(({ field, input }) => {
        if (!input || input.dataset.dirty !== "1") return;
        const val = input.value.trim();
        if (input.dataset.cleared === "1" || !val) {
          cloudKeyUpdates[field] = { action: "clear" };
        } else {
          cloudKeyUpdates[field] = { action: "set", value: val };
        }
      });
      const cfg = {
        comfy_url: inpComfyUrl.value.trim().replace(/\/+$/, ""),
        output_dir: inpOutputDir ? inpOutputDir.value.trim() : "",
        video_output_dir: inpVideoOutputDir ? inpVideoOutputDir.value.trim() : "",
        music_output_dir: inpMusicOutputDir ? inpMusicOutputDir.value.trim() : "",
        lms_url: inpLmsUrl ? inpLmsUrl.value.trim().replace(/\/+$/, "") : "",
        ollama_url: inpOllamaUrl ? inpOllamaUrl.value.trim().replace(/\/+$/, "") : "",
        comfy_launch_cmd: inpComfyLaunchCmd ? inpComfyLaunchCmd.value.trim() : "",
        extra_models_dir: inpExtraModelsDir ? inpExtraModelsDir.value.trim() : "",
        confirm_close: chkConfirmClose ? !!chkConfirmClose.checked : true,
        language: chosenLang,
        theme_base: selThemeBase ? selThemeBase.value : currentThemeBase,
        theme_accent: selThemeAccent ? selThemeAccent.value : currentThemeAccent,
        ...(Object.keys(cloudKeyUpdates).length > 0 ? { cloud_api_keys_updates: cloudKeyUpdates } : {})
      };
      localStorage.setItem("tAStudio.comfyUrl", cfg.comfy_url);
      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cfg)
        });
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.config && saved.config.cloud_api_keys_status) {
            applyCloudKeyStatusToInputs(saved.config.cloud_api_keys_status);
          }
        }
      } catch (e) {}
      settingsModal.style.display = "none";
      const shouldLaunch = pendingLaunchAfterSettings && Boolean(cfg.comfy_launch_cmd) && !isComfyOnline;
      pendingLaunchAfterSettings = false;
      checkComfyStatus();
      checkLLMStatus();
      loadHistoryGallery();
      if (shouldLaunch && btnLaunchComfy) {
        btnLaunchComfy.click();
      }
    });
  }

  if (presetEditorIframe) {
    presetEditorIframe.addEventListener("load", () => {
      try {
        const doc = presetEditorIframe.contentDocument;
        if (!doc || !doc.head) return;
        const bodyText = (doc.body && doc.body.textContent) ? doc.body.textContent.trim() : "";
        if (bodyText.startsWith("{") && bodyText.includes('"error"')) {
          const presetOffline = document.getElementById("presetEditorOfflineNotice");
          if (presetOffline && currentPresetEditorUrl) {
            presetEditorIframe.style.display = "none";
            presetOffline.style.display = "flex";
            return;
          }
        }
        const old = doc.getElementById("taCockpitThemeOverride");
        if (old) old.remove();
        const style = doc.createElement("style");
        style.id = "taCockpitThemeOverride";
        style.textContent = `
          :root {
            --bg: #0f1117;
            --panel: #171a23;
            --panel2: #1e2230;
            --line: #2a2f42;
            --text: #e7e9f0;
            --mute: #9097ad;
            --accent: #8b5cf6;
            --accent-glow: rgba(139, 92, 246, 0.25);
            --accent2: #33d6a6;
            --danger: #ff5d6c;
            color-scheme: dark;
          }
          * {
            scrollbar-width: thin !important;
            scrollbar-color: #2a2f42 transparent !important;
          }
          ::-webkit-scrollbar { width: 6px !important; height: 6px !important; }
          ::-webkit-scrollbar-thumb { background: #2a2f42 !important; border-radius: 4px !important; }
          ::-webkit-scrollbar-thumb:hover { background: #3b425c !important; }
          html, body {
            background: #171a23 !important;
            color: #e7e9f0 !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
            margin: 0 !important;
          }
          body > div, main, .container, .wrap, .wrapper, .app, #app {
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .card, .panel, .preset-item, .preset-card, details, section {
            background: #1e2230 !important;
            border-color: #2a2f42 !important;
            border-radius: 10px !important;
          }
          label, .label, .field-label {
            color: #9097ad !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
          }
          input, select, textarea {
            background: #12141c !important;
            border: 1px solid #2a2f42 !important;
            color: #e7e9f0 !important;
            border-radius: 8px !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
          }
          input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.22) !important;
          }
          button {
            border-radius: 8px !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
          }
          button[class*="save"], button[class*="add"], button[class*="primary"], button.btn-primary {
            background: #8b5cf6 !important;
            border-color: #8b5cf6 !important;
            color: #ffffff !important;
          }
          button[class*="del"], button[class*="remove"], button[class*="danger"], button.btn-danger {
            background: rgba(255, 93, 108, 0.16) !important;
            border: 1px solid rgba(255, 93, 108, 0.5) !important;
            color: #ff8a95 !important;
          }
          button[class*="del"]:hover, button[class*="remove"]:hover, button[class*="danger"]:hover {
            background: #ff5d6c !important;
            color: #ffffff !important;
          }
        `;
        doc.head.appendChild(style);

        // Replace browser-native window.confirm inside Preset Editor iframe with centered themed modal
        const win = presetEditorIframe.contentWindow;
        if (win && !win.__cockpitConfirmHooked) {
          win.__cockpitConfirmHooked = true;
          let lastIframeClickTarget = null;
          doc.addEventListener("click", (ev) => {
            lastIframeClickTarget = (ev.target && ev.target.closest)
              ? (ev.target.closest("button, [role='button'], a") || ev.target)
              : ev.target;
          }, true);
          const origConfirm = win.confirm.bind(win);
          win.confirm = (msg) => {
            if (win.__cockpitConfirmBypass) return true;
            const targetEl = lastIframeClickTarget;
            if (!targetEl) return origConfirm(msg);
            showCockpitConfirm({
              icon: "🗑️",
              title: t("preset_confirm_title", "Preset-Bestätigung"),
              message: String(msg || ""),
              confirmText: t("btn_confirm_ok", "OK"),
              danger: true,
            }).then((ok) => {
              if (!ok) return;
              win.__cockpitConfirmBypass = true;
              try { targetEl.click(); } finally { win.__cockpitConfirmBypass = false; }
            });
            return false;
          };
        }
      } catch (e) {
        console.warn("Could not style preset editor iframe:", e);
      }
    });
  }

  // Preset Editor Modals
  const presetEditorOfflineNotice = document.getElementById("presetEditorOfflineNotice");
  const btnLaunchComfyFromPreset = document.getElementById("btnLaunchComfyFromPreset");
  const btnRetryPresetEditor = document.getElementById("btnRetryPresetEditor");

  function showPresetEditorContent(online) {
    if (online) {
      if (presetEditorOfflineNotice) presetEditorOfflineNotice.style.display = "none";
      if (presetEditorIframe) {
        presetEditorIframe.style.display = "block";
        presetEditorIframe.src = currentPresetEditorUrl;
      }
    } else {
      if (presetEditorIframe) {
        presetEditorIframe.src = "";
        presetEditorIframe.style.display = "none";
      }
      if (presetEditorOfflineNotice) presetEditorOfflineNotice.style.display = "flex";
    }
  }

  function openPresetEditor(url, titleKey, titleFallback) {
    currentPresetEditorUrl = url;
    presetEditorModalTitle.setAttribute("data-i18n", titleKey);
    presetEditorModalTitle.textContent = t(titleKey, titleFallback);
    showPresetEditorContent(isComfyOnline);
    presetEditorModal.style.display = "flex";
  }

  if (btnEditModelPresets) {
    btnEditModelPresets.addEventListener("click", () => {
      openPresetEditor(
        `/proxy/comfy/ta_model_presets/ui`,
        "preset_modal_title_model",
        "🧠 TA Model Preset Editor (Neues Preset anlegen & verwalten)"
      );
    });
  }

  if (btnEditSamplerPresets) {
    btnEditSamplerPresets.addEventListener("click", () => {
      openPresetEditor(
        `/proxy/comfy/ta_sampler_presets/ui`,
        "preset_modal_title_sampler",
        "⚡ TA Sampler Preset Editor (Neues Preset anlegen & verwalten)"
      );
    });
  }

  if (btnLaunchComfyFromPreset) {
    btnLaunchComfyFromPreset.addEventListener("click", () => {
      if (btnLaunchComfy && !btnLaunchComfy.disabled) {
        btnLaunchComfy.click();
      }
    });
  }

  if (btnRetryPresetEditor) {
    btnRetryPresetEditor.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/presets");
        if (res.ok) {
          const data = await res.json();
          if (data.comfy_online) {
            updateLaunchButtonState(true);
            showPresetEditorContent(true);
            return;
          }
        }
      } catch (e) {}
      showToast(t("toast_comfy_offline_preset_editor", "ComfyUI läuft nicht — bitte zuerst ComfyUI starten."), "error");
    });
  }

  if (btnClosePresetEditor) {
    btnClosePresetEditor.addEventListener("click", () => {
      presetEditorModal.style.display = "none";
      presetEditorIframe.src = "";
      if (presetEditorOfflineNotice) presetEditorOfflineNotice.style.display = "none";
      refreshPresetsFromComfy();
    });
  }

  if (btnOpenExternalPreset) {
    btnOpenExternalPreset.addEventListener("click", () => {
      if (!isComfyOnline) {
        showToast(t("toast_comfy_offline_preset_editor", "ComfyUI läuft nicht — bitte zuerst ComfyUI starten."), "error");
        return;
      }
      if (currentPresetEditorUrl) {
        const comfyUrl = inpComfyUrl ? inpComfyUrl.value.trim().replace(/\/+$/, "") : "http://127.0.0.1:8188";
        const directUrl = currentPresetEditorUrl.startsWith("/proxy/comfy/")
          ? `${comfyUrl}/${currentPresetEditorUrl.replace(/^\/proxy\/comfy\//, "")}`
          : currentPresetEditorUrl;
        window.open(directUrl, "_blank");
      }
    });
  }

  let activeImageMeta = null;

  const confirmDeleteModal = document.getElementById("confirmDeleteModal");
  const btnCloseConfirmDelete = document.getElementById("btnCloseConfirmDelete");
  const btnCancelDeleteModal = document.getElementById("btnCancelDeleteModal");
  const btnConfirmDeleteModal = document.getElementById("btnConfirmDeleteModal");
  const confirmDeleteThumb = document.getElementById("confirmDeleteThumb");
  const confirmDeleteFilename = document.getElementById("confirmDeleteFilename");

  function promptConfirmDelete(fileObj) {
    return new Promise((resolve) => {
      if (!confirmDeleteModal) {
        resolve(confirm(t("delete_confirm_prompt", `Soll das Bild "${fileObj.filename}" wirklich von der Festplatte und aus der Galerie gelöscht werden?`).replace("{filename}", fileObj.filename)));
        return;
      }

      if (confirmDeleteThumb) confirmDeleteThumb.src = fileObj.url || `/output/${encodeURIComponent(fileObj.filename)}`;
      if (confirmDeleteFilename) confirmDeleteFilename.textContent = fileObj.filename;

      confirmDeleteModal.style.display = "flex";

      function cleanup(result) {
        confirmDeleteModal.style.display = "none";
        window.removeEventListener("keydown", onKeyDown);
        confirmDeleteModal.removeEventListener("click", onBackdrop);
        if (btnCloseConfirmDelete) btnCloseConfirmDelete.removeEventListener("click", onCancel);
        if (btnCancelDeleteModal) btnCancelDeleteModal.removeEventListener("click", onCancel);
        if (btnConfirmDeleteModal) btnConfirmDeleteModal.removeEventListener("click", onConfirm);
        resolve(result);
      }

      function onConfirm() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onBackdrop(e) {
        if (e.target === confirmDeleteModal) cleanup(false);
      }
      function onKeyDown(e) {
        if (e.key === "Escape") cleanup(false);
        else if (e.key === "Enter") cleanup(true);
      }

      if (btnCloseConfirmDelete) btnCloseConfirmDelete.addEventListener("click", onCancel);
      if (btnCancelDeleteModal) btnCancelDeleteModal.addEventListener("click", onCancel);
      if (btnConfirmDeleteModal) btnConfirmDeleteModal.addEventListener("click", onConfirm);
      confirmDeleteModal.addEventListener("click", onBackdrop);
      window.addEventListener("keydown", onKeyDown);

      setTimeout(() => {
        if (btnConfirmDeleteModal) btnConfirmDeleteModal.focus();
      }, 50);
    });
  }

  async function deleteHistoryImage(fileObj, itemElem) {
    if (!fileObj || !fileObj.filename) return;
    const confirmed = await promptConfirmDelete(fileObj);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/delete_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileObj.filename }),
      });
      if (res.ok) {
        showToast(t("toast_image_deleted", `Bild "${fileObj.filename}" wurde gelöscht.`).replace("{filename}", fileObj.filename), "info", 2500);
        await loadHistoryGallery();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(t("toast_delete_error", "Fehler beim Löschen: ") + (err.error || res.statusText), "error", 4000);
      }
    } catch (e) {
      showToast(t("toast_delete_error", "Fehler beim Löschen: ") + e.message, "error", 4000);
    }
  }

  function selectHistoryItem(fileObj, elem) {
    if (!fileObj) return;
    activeImageMeta = fileObj;
    if (filmstripGallery) {
      filmstripGallery.querySelectorAll(".filmstrip-item").forEach(i => i.classList.remove("active"));
    }
    if (elem) elem.classList.add("active");
    const targetUrl = fileObj.url || `/output/${encodeURIComponent(fileObj.filename || fileObj)}`;
    mainPreview.src = targetUrl;
    mainPreview.style.display = "block";
    const emptyState = document.getElementById("emptyState") || document.querySelector(".viewer-empty");
    if (emptyState) emptyState.style.display = "none";
    syncCompareAvailability(targetUrl);

    // Sync prompt to editor so preview and prompt ALWAYS match
    if (fileObj.prompt && txtPrompt) {
      txtPrompt.value = fileObj.prompt;
    }
    if (fileObj.additional_prompt !== undefined && txtAdditionalPrompt) {
      txtAdditionalPrompt.value = fileObj.additional_prompt;
    }
    if (fileObj.neg_prompt && txtNegPrompt) {
      txtNegPrompt.value = fileObj.neg_prompt;
    }
    if (fileObj.seed && txtSeed) {
      txtSeed.value = fileObj.seed;
    }
    saveStateDebounced();
  }

  // Load History Gallery from Output Folder
  async function loadHistoryGallery(preserveActivePreview = false) {
    if (!filmstripGallery) return;
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        filmstripGallery.innerHTML = "";
        const files = Array.isArray(data.files) ? data.files : [];
        const keepCurrentPreview = Boolean(
          preserveActivePreview ||
          (activeImageMeta && activeImageMeta.url && (activeImageMeta.isComfyView || activeImageMeta.isDroppedFile))
        );

        if (files.length === 0 && !keepCurrentPreview) {
          const emptyStateKey = data.output_dir ? "empty" : "no_output_dir";
          const emptyMsg = data.output_dir
            ? t("gallery_empty", "Keine Bilder im Ausgabeordner vorhanden.")
            : t("gallery_no_output_dir", "Kein Ausgabeordner konfiguriert (siehe Einstellungen).");
          filmstripGallery.innerHTML = `
            <div data-empty-state="${emptyStateKey}" style="color:var(--text-muted); font-size:12px; padding: 0 16px; white-space:nowrap; display:flex; align-items:center;">
              <span>${emptyMsg}</span>
            </div>
          `;
          activeImageMeta = null;
          return;
        }

        let activeFound = false;
        let activeElem = null;

        files.forEach((file) => {
          const fileObj = typeof file === "string" 
            ? { filename: file, url: `/output/${encodeURIComponent(file)}` } 
            : file;
          const isCurrent = Boolean(activeImageMeta && activeImageMeta.filename === fileObj.filename);
          if (isCurrent) {
            activeFound = true;
            if (!activeImageMeta.isDroppedFile) {
              activeImageMeta = fileObj;
            }
          }

          const item = document.createElement("div");
          item.className = "filmstrip-item" + (isCurrent ? " active" : "");
          item.title = fileObj.prompt ? fileObj.prompt.slice(0, 120) : fileObj.filename;

          // Thumbnail image with error handler (auto-remove if deleted on disk)
          const img = document.createElement("img");
          img.src = fileObj.url;
          img.alt = fileObj.filename;
          img.loading = "lazy";
          img.onerror = () => {
            item.remove();
          };
          item.appendChild(img);

          // Delete button (overlay icon on top-right)
          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "filmstrip-del-btn";
          delBtn.dataset.filename = fileObj.filename;
          delBtn.title = t("delete_btn_title", `"${fileObj.filename}" von Festplatte & Galerie löschen`).replace("{filename}", fileObj.filename);
          delBtn.innerHTML = "🗑️";
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteHistoryImage(fileObj, item);
          });
          item.appendChild(delBtn);

          item.addEventListener("click", () => {
            selectHistoryItem(fileObj, item);
          });

          filmstripGallery.appendChild(item);

          if (isCurrent) activeElem = item;
        });

        // If previously active image is still present, keep it.
        // If we just generated or dropped an image (or preserveActivePreview is requested), keep it instead of overwriting with files[0].
        if (activeFound && activeElem) {
          // already selected
        } else if (keepCurrentPreview) {
          if (activeImageMeta && activeImageMeta.url) {
            const curItem = document.createElement("div");
            curItem.className = "filmstrip-item active";
            curItem.title = activeImageMeta.filename || "";
            const curImg = document.createElement("img");
            curImg.src = activeImageMeta.url;
            curImg.alt = activeImageMeta.filename || "Generated";
            curImg.loading = "lazy";
            curItem.appendChild(curImg);
            curItem.addEventListener("click", () => {
              selectHistoryItem(activeImageMeta, curItem);
            });
            filmstripGallery.prepend(curItem);
          }
        } else if (files.length > 0) {
          const firstObj = typeof files[0] === "string" 
            ? { filename: files[0], url: `/output/${encodeURIComponent(files[0])}` } 
            : files[0];
          selectHistoryItem(firstObj, filmstripGallery.firstElementChild);
        }
      }
    } catch (e) {}
  }

  // Auto-sync gallery when user returns to window (e.g. after deleting files in Explorer)
  window.addEventListener("focus", () => {
    if (!isGenerating) {
      loadHistoryGallery(true);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !isGenerating) {
      loadHistoryGallery(true);
    }
  });

  const QUICK_PILL_LABELS = {
    "Minimax H3 Image": "MiniMax H3",
    "FLUX1-DEV-FP8": "FLUX.1 Dev",
    "FLUX Dev (FP8)": "FLUX.1 Dev",
    "Krea2-Turbo": "Krea2-Turbo",
    "ZImage (BF16)": "Z-Image",
    "Z-Image": "Z-Image",
    "Qwen-Image 2.1": "Qwen 2.1",
    "Qwen-Image 2.1 Turbo": "Qwen Turbo",
    "FLUX3-Klein-Image": "FLUX3 Klein",
    "MOSS-Image 8 Step": "MOSS 8-Step",
    "MOSS-Image JIB": "MOSS JIB",
    "KROMOSS": "KROMOSS",
  };

  function getQuickPillLabel(name) {
    if (QUICK_PILL_LABELS[name]) return QUICK_PILL_LABELS[name];
    const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [k, label] of Object.entries(QUICK_PILL_LABELS)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === norm) return label;
    }
    return name;
  }

  function syncQuickPillsVisibility() {
    if (!modelQuickPills || !selModelPreset) return;
    const availableOpts = Array.from(selModelPreset.options).filter(o => !o.disabled && o.value);
    const currentVal = selModelPreset.value;
    modelQuickPills.innerHTML = "";
    availableOpts.forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill-btn" + (opt.value === currentVal ? " active" : "");
      btn.setAttribute("data-model", opt.value);
      btn.textContent = getQuickPillLabel(opt.value);
      modelQuickPills.appendChild(btn);
    });
    modelQuickPills.style.display = availableOpts.length > 0 ? "" : "none";
  }

  function updatePlatoKeyBadge() {
    if (!platoKeyBadge || !selPlatoKey) return;
    const val = selPlatoKey.value || "";
    if (!val) {
      platoKeyBadge.textContent = "Aus";
    } else if (val.startsWith("h3:")) {
      platoKeyBadge.textContent = "H3 Key";
    } else if (val.startsWith("nynxz:")) {
      platoKeyBadge.textContent = "PlatoKey";
    } else {
      platoKeyBadge.textContent = "Aktiv";
    }
  }

  if (selPlatoKey) {
    selPlatoKey.addEventListener("change", () => {
      selPlatoKey.dataset.pendingValue = selPlatoKey.value;
      updatePlatoKeyBadge();
      scheduleSave();
    });
  }

  async function refreshPlatoKeysFromComfy(preferredKey = null) {
    const target = preferredKey !== null ? preferredKey : (selPlatoKey ? (selPlatoKey.dataset.pendingValue ?? selPlatoKey.value ?? "") : "");
    try {
      const res = await fetch("/api/plato_keys");
      if (!res.ok) return;
      const data = await res.json();
      lastPlatoKeysMeta = data;
      const h3Keys = Array.isArray(data.h3_keys) ? data.h3_keys : [];
      const nynxzKeys = Array.isArray(data.nynxz_keys) ? data.nynxz_keys : [];
      const h3Inst = Boolean(data.h3_installed);
      const nynxzInst = Boolean(data.nynxz_installed);

      if (btnInstallPlatoNodes) {
        btnInstallPlatoNodes.style.display = (!h3Inst || !nynxzInst) ? "" : "none";
      }
      if (platoH3NodeBadge) {
        platoH3NodeBadge.textContent = h3Inst ? "✓ Installiert" : "Fehlt";
      }
      if (platoNynxzNodeBadge) {
        platoNynxzNodeBadge.textContent = nynxzInst ? "✓ Installiert" : "Fehlt";
      }
      if (btnInstallH3Node) btnInstallH3Node.style.display = h3Inst ? "none" : "";
      if (btnInstallNynxzNode) btnInstallNynxzNode.style.display = nynxzInst ? "none" : "";

      if (selPlatoCatalogKey && Array.isArray(data.catalog)) {
        const prevCat = selPlatoCatalogKey.value;
        selPlatoCatalogKey.innerHTML = "";
        data.catalog.forEach(item => {
          const opt = document.createElement("option");
          opt.value = item.id;
          opt.textContent = item.installed ? `✓ ${item.label}` : item.label;
          if (item.id === prevCat) opt.selected = true;
          selPlatoCatalogKey.appendChild(opt);
        });
      }

      if (!selPlatoKey) return;
      selPlatoKey.innerHTML = '<option value="">Aus (Standard Text-Encoder)</option>';
      if (h3Keys.length > 0) {
        const grp = document.createElement("optgroup");
        grp.label = "MiniMax H3 (ComfyUI-H3-Text-Encoders)";
        h3Keys.forEach(k => {
          const opt = document.createElement("option");
          opt.value = `h3:${k}`;
          opt.textContent = k;
          if (opt.value === target) opt.selected = true;
          grp.appendChild(opt);
        });
        selPlatoKey.appendChild(grp);
      }
      if (nynxzKeys.length > 0) {
        const grp = document.createElement("optgroup");
        grp.label = "PlatoKeys (ComfyUI-PlatoKeys)";
        nynxzKeys.forEach(k => {
          const opt = document.createElement("option");
          opt.value = `nynxz:${k}`;
          opt.textContent = k;
          if (opt.value === target) opt.selected = true;
          grp.appendChild(opt);
        });
        selPlatoKey.appendChild(grp);
      }
      if (target && !Array.from(selPlatoKey.options).some(o => o.value === target)) {
        const opt = document.createElement("option");
        opt.value = target;
        opt.textContent = `${target} (nicht gefunden)`;
        opt.selected = true;
        selPlatoKey.appendChild(opt);
      }
      updatePlatoKeyBadge();
    } catch (e) {}
  }

  function openOptionalPlatoNodeInstaller(packIds) {
    if (!missingNodesModal || !missingNodesList) return;
    const packs = [
      {
        id: "ComfyUI-H3-Text-Encoders",
        name: "ComfyUI-H3-Text-Encoders",
        repo: "https://github.com/alisson-anjos/ComfyUI-H3-Text-Encoders",
        description_de: "Optional für Plato's Keys mit MiniMax H3 (Qwen 3.5 / Gemma 4)",
        missing_nodes: ["PlatosKeyPatchCLIP"],
        installed: Boolean(lastPlatoKeysMeta.h3_installed),
      },
      {
        id: "ComfyUI-PlatoKeys",
        name: "ComfyUI-PlatoKeys",
        repo: "https://github.com/Nynxz/ComfyUI-PlatoKeys",
        description_de: "Optional für Plato's Keys mit Krea 2, MOSS-Image & Z-Image",
        missing_nodes: ["plato_keys.Load", "plato_keys.PatchCLIP"],
        installed: Boolean(lastPlatoKeysMeta.nynxz_installed),
      },
    ].filter(p => !packIds || packIds.includes(p.id));

    if (missingNodesDesc) {
      missingNodesDesc.textContent = "Installiere die gewünschten optionalen Plato's-Keys-Erweiterungen in dein ComfyUI-Verzeichnis (danach ComfyUI neu starten):";
    }
    const paths = lastPlatoKeysMeta.paths || {};
    if (missingNodesDirGroup) missingNodesDirGroup.style.display = "block";
    if (inpMissingNodesComfyDir && paths.comfy_root && !inpMissingNodesComfyDir.value) {
      inpMissingNodesComfyDir.value = paths.comfy_root;
    }
    missingNodesList.innerHTML = packs.map(pack => `
      <label class="missing-node-item">
        <input type="checkbox" value="${escapeHtml(pack.id)}" ${pack.installed ? "" : "checked"}>
        <div class="missing-node-meta">
          <div class="missing-node-title">${escapeHtml(pack.name)} ${pack.installed ? "(bereits installiert)" : ""}</div>
          <div class="missing-node-desc">${escapeHtml(pack.description_de)}</div>
          <div class="missing-node-badges">${pack.missing_nodes.map(n => `<span class="missing-node-badge">${escapeHtml(n)}</span>`).join("")}</div>
        </div>
      </label>
    `).join("");
    if (installNodesProgressWrap) installNodesProgressWrap.style.display = "none";
    if (nodesRestartBanner) nodesRestartBanner.style.display = "none";
    if (installNodesLog) installNodesLog.textContent = "";
    if (btnInstallMissingNodes) {
      btnInstallMissingNodes.style.display = "";
      btnInstallMissingNodes.disabled = Boolean(paths.is_remote);
    }
    missingNodesModal.style.display = "flex";
  }

  if (btnInstallPlatoNodes) {
    btnInstallPlatoNodes.addEventListener("click", () => {
      const toInstall = [];
      if (!lastPlatoKeysMeta.h3_installed) toInstall.push("ComfyUI-H3-Text-Encoders");
      if (!lastPlatoKeysMeta.nynxz_installed) toInstall.push("ComfyUI-PlatoKeys");
      openOptionalPlatoNodeInstaller(toInstall.length ? toInstall : null);
    });
  }
  if (btnInstallH3Node) {
    btnInstallH3Node.addEventListener("click", () => openOptionalPlatoNodeInstaller(["ComfyUI-H3-Text-Encoders"]));
  }
  if (btnInstallNynxzNode) {
    btnInstallNynxzNode.addEventListener("click", () => openOptionalPlatoNodeInstaller(["ComfyUI-PlatoKeys"]));
  }
  if (btnOpenPlatoKeySettings) {
    btnOpenPlatoKeySettings.addEventListener("click", () => {
      if (typeof openSettingsModal === "function") {
        openSettingsModal(false);
        setTimeout(() => {
          if (settingsPlatoKeysSection) settingsPlatoKeysSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      }
    });
  }
  async function triggerComfyRestartFromBanner(btnEl, textEl, bannerEl) {
    if (!btnEl) return;
    const origBtnText = btnEl.textContent;
    btnEl.disabled = true;
    btnEl.textContent = "⏳ Starte neu…";
    if (textEl) textEl.textContent = "⏳ Sende Neustart-Signal an ComfyUI…";
    try {
      const res = await fetch("/api/comfy/restart", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (textEl) textEl.textContent = `✖ ${data.error || "Neustart fehlgeschlagen."}`;
        btnEl.disabled = false;
        btnEl.textContent = origBtnText;
        return;
      }
      const poll = setInterval(async () => {
        try {
          const sr = await fetch("/api/comfy/restart_status");
          const st = await sr.json();
          if (st.status === "running") {
            if (textEl && st.message) textEl.textContent = `⏳ ${st.message}`;
          } else if (st.status === "done") {
            clearInterval(poll);
            btnEl.disabled = false;
            btnEl.textContent = origBtnText;
            if (bannerEl) bannerEl.style.display = "none";
            showToast(st.message || "ComfyUI wurde neu gestartet!", "success");
            checkComfyStatus();
            refreshPresetsFromComfy();
            refreshPlatoKeysFromComfy();
          } else if (st.status === "error") {
            clearInterval(poll);
            btnEl.disabled = false;
            btnEl.textContent = origBtnText;
            if (textEl) textEl.textContent = `⚠️ ${st.error || "Bitte ComfyUI manuell neu starten."}`;
          }
        } catch (e) {}
      }, 800);
    } catch (e) {
      if (textEl) textEl.textContent = "✖ Netzwerkfehler beim ComfyUI-Neustart.";
      btnEl.disabled = false;
      btnEl.textContent = origBtnText;
    }
  }

  if (btnRestartComfyFromPlato) {
    btnRestartComfyFromPlato.addEventListener("click", () =>
      triggerComfyRestartFromBanner(btnRestartComfyFromPlato, platoRestartText, platoRestartBanner)
    );
  }
  if (btnRestartComfyFromNodes) {
    btnRestartComfyFromNodes.addEventListener("click", () =>
      triggerComfyRestartFromBanner(btnRestartComfyFromNodes, nodesRestartText, nodesRestartBanner)
    );
  }

  if (btnDownloadPlatoKey && selPlatoCatalogKey) {
    btnDownloadPlatoKey.addEventListener("click", async () => {
      const keyId = selPlatoCatalogKey.value;
      if (!keyId) return;
      btnDownloadPlatoKey.disabled = true;
      if (platoRestartBanner) platoRestartBanner.style.display = "none";
      if (platoDownloadStatus) platoDownloadStatus.textContent = "Starte Download…";
      try {
        const res = await fetch("/api/plato_keys/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: keyId }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (platoDownloadStatus) platoDownloadStatus.textContent = data.error || "Download fehlgeschlagen.";
          btnDownloadPlatoKey.disabled = false;
          return;
        }
        const poll = setInterval(async () => {
          try {
            const sr = await fetch("/api/plato_keys/download_status");
            const st = await sr.json();
            if (st.status === "running") {
              const mb = ((st.downloaded_bytes || 0) / 1048576).toFixed(1);
              const tot = st.total_bytes ? ` / ${(st.total_bytes / 1048576).toFixed(1)} MB` : " MB";
              if (platoDownloadStatus) platoDownloadStatus.textContent = `Lade ${st.filename}: ${mb}${tot}…`;
            } else if (st.status === "done") {
              clearInterval(poll);
              btnDownloadPlatoKey.disabled = false;
              if (platoDownloadStatus) platoDownloadStatus.textContent = `✓ Gespeichert: ${st.filename}`;
              if (platoRestartText) platoRestartText.textContent = "⚠️ ComfyUI-Neustart erforderlich, damit der neue Key geladen wird.";
              if (platoRestartBanner) platoRestartBanner.style.display = "flex";
              showToast(`Plato's Key '${st.filename}' heruntergeladen.`, "success");
              refreshPlatoKeysFromComfy();
            } else if (st.status === "error") {
              clearInterval(poll);
              btnDownloadPlatoKey.disabled = false;
              if (platoDownloadStatus) platoDownloadStatus.textContent = `✖ Fehler: ${st.error || "Unbekannt"}`;
            }
          } catch (e) {}
        }, 500);
      } catch (e) {
        if (platoDownloadStatus) platoDownloadStatus.textContent = "Netzwerkfehler beim Starten des Downloads.";
        btnDownloadPlatoKey.disabled = false;
      }
    });
  }

  // Dynamic Preset Fetcher via server (/api/presets filters to installed ComfyUI models)
  async function refreshPresetsFromComfy(preferredModel = null, preferredSampler = null) {
    refreshPlatoKeysFromComfy();
    const targetModel = preferredModel || selModelPreset.value;
    const targetSampler = preferredSampler || selSamplerPreset.value;

    try {
      const res = await fetch(`/api/presets`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.comfy_online) return;

      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        data.warnings.forEach(w => console.warn("[Presets]", w));
        if (!window._shownPresetWarning) {
          window._shownPresetWarning = true;
          showToast(data.warnings[0], "error");
        }
      }

      const models = Array.isArray(data.models) ? data.models : [];
      const installedModels = models.filter(m => m.installed !== false);

      selModelPreset.innerHTML = "";
      if (installedModels.length > 0) {
        let matchedTarget = false;
        installedModels.forEach(m => {
          const opt = document.createElement("option");
          opt.value = m.name;
          opt.textContent = m.name;
          if (m.name === targetModel) {
            opt.selected = true;
            matchedTarget = true;
          }
          selModelPreset.appendChild(opt);
        });
        if (!matchedTarget && selModelPreset.options.length > 0) {
          selModelPreset.selectedIndex = 0;
        }
        updateModelSelection(selModelPreset.value, !matchedTarget);
      } else {
        const opt = document.createElement("option");
        opt.value = "";
        opt.dataset.empty = "1";
        opt.textContent = t("models_none_installed", "— Keine installierten Modelle gefunden —");
        opt.disabled = true;
        opt.selected = true;
        selModelPreset.appendChild(opt);
      }
      syncQuickPillsVisibility();

      const entries = Object.entries(data.samplers || {});
      selSamplerPreset.innerHTML = "";
      if (entries.length > 0) {
        let matchedSampler = false;
        entries.forEach(([name, s]) => {
          SAMPLER_META[name] = `${s.steps} Steps · ${s.sampler_name}/${s.scheduler} · CFG ${s.cfg}`;
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = `${name} (${s.steps} Steps, CFG ${s.cfg}, ${s.sampler_name}/${s.scheduler})`;
          if (name === targetSampler) {
            opt.selected = true;
            matchedSampler = true;
          }
          selSamplerPreset.appendChild(opt);
        });
        if (!matchedSampler && selSamplerPreset.options.length > 0) {
          selSamplerPreset.selectedIndex = 0;
        }
        updateSamplerSelection(selSamplerPreset.value);
      } else {
        const opt = document.createElement("option");
        opt.value = "";
        opt.dataset.empty = "1";
        opt.textContent = t("samplers_none_found", "— Keine passenden Sampler-Presets —");
        opt.disabled = true;
        opt.selected = true;
        selSamplerPreset.appendChild(opt);
      }
    } catch (e) {
      console.warn("Could not refresh presets:", e);
    }
  }

  // Unified App Initialization
  function hideAppLoadingOverlay() {
    const overlay = document.getElementById("appLoadingOverlay");
    if (!overlay) return;
    overlay.classList.add("is-hidden");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 260);
  }

  async function initApp() {
    let state = null;
    let serverLang = null;

    try {
      try {
        const res = await fetch("/api/config");
      if (res.ok) {
        const cfg = await res.json();
        if (inpComfyUrl) inpComfyUrl.value = cfg.comfy_url || "http://127.0.0.1:8188";
        if (inpOutputDir) inpOutputDir.value = cfg.output_dir || "";
        if (inpVideoOutputDir) inpVideoOutputDir.value = cfg.video_output_dir || "";
        if (inpMusicOutputDir) inpMusicOutputDir.value = cfg.music_output_dir || "";
        if (inpLmsUrl) inpLmsUrl.value = cfg.lms_url || "http://127.0.0.1:1234";
        if (inpOllamaUrl) inpOllamaUrl.value = cfg.ollama_url || "http://127.0.0.1:11434";
        if (cfg.cloud_api_keys_status) applyCloudKeyStatusToInputs(cfg.cloud_api_keys_status);
        if (inpComfyLaunchCmd) inpComfyLaunchCmd.value = cfg.comfy_launch_cmd || "";
        if (inpExtraModelsDir) inpExtraModelsDir.value = cfg.extra_models_dir || "";
        if (chkConfirmClose) chkConfirmClose.checked = cfg.confirm_close !== false;
        if (cfg.app_version && brandVersion) brandVersion.textContent = `v${cfg.app_version}`;
        if (cfg.workflow_version && brandWf) brandWf.textContent = `WF ${cfg.workflow_version}`;
        if (cfg.language === "de" || cfg.language === "en") {
          serverLang = cfg.language;
        }
        if (Array.isArray(cfg.theme_custom_slots)) {
          customAccentSlots = [
            /^#[0-9a-fA-F]{6}$/.test(cfg.theme_custom_slots[0] || "") ? cfg.theme_custom_slots[0].toLowerCase() : customAccentSlots[0],
            /^#[0-9a-fA-F]{6}$/.test(cfg.theme_custom_slots[1] || "") ? cfg.theme_custom_slots[1].toLowerCase() : customAccentSlots[1],
          ];
          try {
            localStorage.setItem("tAStudio.themeCustomSlots", JSON.stringify(customAccentSlots));
          } catch (e) {}
          renderCustomAccentSlots();
        }
        if (cfg.theme_base || cfg.theme_accent || cfg.theme_custom_accent) {
          applyTheme(
            cfg.theme_base || currentThemeBase,
            cfg.theme_accent || currentThemeAccent,
            false,
            cfg.theme_custom_accent || currentCustomAccent
          );
          try {
            localStorage.setItem("tAStudio.themeBase", currentThemeBase);
            localStorage.setItem("tAStudio.themeAccent", currentThemeAccent);
            localStorage.setItem("tAStudio.themeCustomAccent", currentCustomAccent);
          } catch (e) {}
        }
        if (Array.isArray(cfg.custom_res_presets) && cfg.custom_res_presets.length > 0) {
          savedCustomResolutions = cfg.custom_res_presets.filter(r => r && r.w && r.h);
          try {
            localStorage.setItem("tAStudio.customResPresets", JSON.stringify(savedCustomResolutions));
          } catch (_) {}
          renderCustomResChips();
        }
        if (cfg.ui_state) state = cfg.ui_state;
      }
    } catch (e) {}

    // Resolve and apply initial language once (server config takes precedence, then localStorage, then 'en')
    let initialLang = serverLang;
    try {
      const savedLang = localStorage.getItem("tAStudio.language");
      if (!initialLang && (savedLang === "de" || savedLang === "en")) {
        initialLang = savedLang;
      }
      if (!initialLang) initialLang = "en";
      localStorage.setItem("tAStudio.language", initialLang);
    } catch (e) {
      if (!initialLang) initialLang = "en";
    }
    applyLanguage(initialLang, false);

    // Fallback: restore custom_res_presets from localStorage if not already loaded from config.json
    if (savedCustomResolutions.length === 0) {
      try {
        const lsPresets = JSON.parse(localStorage.getItem("tAStudio.customResPresets") || "[]");
        if (Array.isArray(lsPresets) && lsPresets.length > 0) {
          savedCustomResolutions = lsPresets.filter(r => r && r.w && r.h);
          renderCustomResChips();
        }
      } catch (_) {}
    }

    // Check localStorage as well; use whichever has more recent updated_at or fallback
    try {
      const savedStr = localStorage.getItem("tAStudio.ui_state");
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (!state || (saved.updated_at && (!state.updated_at || saved.updated_at > state.updated_at))) {
          state = saved;
        }
      }
    } catch (e) {}

    const prefModel = state ? state.model_preset : selModelPreset.value;
    const prefSampler = state ? state.sampler_preset : selSamplerPreset.value;

    await refreshPresetsFromComfy(prefModel, prefSampler);
    await loadLLMModelsFromComfy(state ? state.llm_model : null);
    await syncWorkflowLoras(false, state ? state.loras : null);

    if (state) {
      restoreState(state);
    } else {
      setPixMode("preset", "16:9");
    }
    // Always run synchronization to guarantee UI matches current active values
    updateModelSelection(selModelPreset.value, false);
    updateSamplerSelection(selSamplerPreset.value);
    updateActiveLorasCount();
    updateFluxGuidanceState();

    loadHistoryGallery();
    try {
      if (localStorage.getItem("tAStudio.gallery_collapsed") === "1" && filmstripGallery) {
        filmstripGallery.classList.add("collapsed");
        updateGalleryToggleUI(true);
      }
    } catch (e) {}
      await Promise.allSettled([checkComfyStatus(), checkLLMStatus()]);
      setInterval(checkComfyStatus, 15000);
      setInterval(checkLLMStatus, 10000);
    } finally {
      hideAppLoadingOverlay();
    }
  }

  // Collapsible cards & fields support (e.g. LoRA Stack, Feintuning, Prompt Controller Delimiter)
  document.querySelectorAll(".card.collapsible .card-header").forEach(hdr => {
    hdr.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("select") || e.target.closest("input")) return;
      const card = hdr.closest(".card");
      if (card) card.classList.toggle("collapsed");
    });
  });
  document.querySelectorAll(".field-collapsible .field-collapsible-toggle").forEach(lbl => {
    lbl.addEventListener("click", () => {
      const grp = lbl.closest(".field-collapsible");
      if (grp) grp.classList.toggle("collapsed");
    });
  });

  // App Close Confirmation Modal (triggered from pywebview on_closing)
  const confirmAppCloseModal = document.getElementById("confirmAppCloseModal");
  const btnCloseAppCloseModal = document.getElementById("btnCloseAppCloseModal");
  const btnCancelAppClose = document.getElementById("btnCancelAppClose");
  const btnConfirmAppClose = document.getElementById("btnConfirmAppClose");

  function hideAppCloseModal() {
    if (confirmAppCloseModal) confirmAppCloseModal.style.display = "none";
  }

  window.__requestCloseConfirm = () => {
    if (!confirmAppCloseModal) return false;
    confirmAppCloseModal.style.display = "flex";
    btnCancelAppClose?.focus();
    return true;
  };

  btnCloseAppCloseModal?.addEventListener("click", hideAppCloseModal);
  btnCancelAppClose?.addEventListener("click", hideAppCloseModal);
  confirmAppCloseModal?.addEventListener("click", (e) => {
    if (e.target === confirmAppCloseModal) hideAppCloseModal();
  });
  btnConfirmAppClose?.addEventListener("click", () => {
    window.__studioUpdating = true;
    hideAppCloseModal();
    fetch("/api/app/confirm_close", { method: "POST" }).catch(() => {});
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && confirmAppCloseModal && confirmAppCloseModal.style.display === "flex") {
      e.preventDefault();
      e.stopPropagation();
      hideAppCloseModal();
    }
  }, true);

  // Inline card help (?) toggle support
  document.querySelectorAll(".card-help-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute("data-help-target");
      const box = targetId ? document.getElementById(targetId) : null;
      if (!box) return;
      const willOpen = box.hidden;
      if (willOpen) {
        const collapsedCard = btn.closest(".card.collapsible.collapsed");
        if (collapsedCard) collapsedCard.classList.remove("collapsed");
      }
      box.hidden = !willOpen;
      btn.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  // GitHub Release Update Checker & Stage-3 Auto-Updater
  function initUpdateChecker() {
    const btnBadge = document.getElementById("btnUpdateBadge");
    const modal = document.getElementById("updateModal");
    const btnClose = document.getElementById("btnCloseUpdateModal");
    const btnDismiss = document.getElementById("btnDismissUpdate");
    const btnInstall = document.getElementById("btnInstallUpdate");
    const btnOpenRelease = document.getElementById("btnOpenReleaseUrl");
    const elCurVer = document.getElementById("updateCurrentVer");
    const elNewVer = document.getElementById("updateNewVer");
    const elNotesWrap = document.getElementById("updateNotesWrap");
    const elNotesText = document.getElementById("updateNotesText");
    const elSourceHint = document.getElementById("updateSourceHint");
    const elProgressWrap = document.getElementById("updateProgressWrap");
    const elProgressText = document.getElementById("updateProgressText");
    const elProgressPct = document.getElementById("updateProgressPct");
    const elProgressFill = document.getElementById("updateProgressFill");

    let latestUpdateInfo = null;
    let pollTimer = null;

    function updateUpdateVersionLabels() {
      if (!latestUpdateInfo) return;
      if (elCurVer) {
        elCurVer.textContent = t("update_current_ver", "Aktuell: v{ver}")
          .replace("{ver}", latestUpdateInfo.current_version || "?");
      }
      if (elNewVer) {
        elNewVer.textContent = t("update_new_ver", "Neu: v{ver}")
          .replace("{ver}", latestUpdateInfo.latest_version || "?");
      }
    }

    function openUpdateModal(info) {
      if (!modal || !info) return;
      latestUpdateInfo = info;
      updateUpdateVersionLabels();
      if (btnOpenRelease) btnOpenRelease.href = info.release_url || info.releases_url || "https://github.com/tmode-1960/TA-StudioCockpit/releases";

      if (elNotesWrap && elNotesText) {
        if (info.release_notes) {
          elNotesText.textContent = info.release_notes;
          elNotesWrap.style.display = "";
        } else {
          elNotesWrap.style.display = "none";
        }
      }

      const canAuto = Boolean(info.can_auto_install);
      if (btnInstall) {
        btnInstall.style.display = canAuto ? "" : "none";
        btnInstall.disabled = false;
      }
      if (elSourceHint) elSourceHint.style.display = canAuto ? "none" : "";
      if (elProgressWrap) elProgressWrap.style.display = "none";
      if (btnDismiss) btnDismiss.disabled = false;

      modal.style.display = "flex";
    }

    window.addEventListener("studio-language-changed", () => {
      updateUpdateVersionLabels();
    });

    function closeUpdateModal(rememberDismiss = false) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (rememberDismiss && latestUpdateInfo && latestUpdateInfo.latest_version) {
        try {
          sessionStorage.setItem("tAStudio.dismissedUpdate", latestUpdateInfo.latest_version);
        } catch (e) {}
      }
      if (modal) modal.style.display = "none";
    }

    async function checkUpdates(manual = false) {
      try {
        const res = await fetch(manual ? "/api/update/check?force=1" : "/api/update/check");
        if (!res.ok) return;
        const info = await res.json();
        if (info.update_available) {
          latestUpdateInfo = info;
          if (btnBadge) {
            btnBadge.textContent = `⬆️ v${info.latest_version}`;
            btnBadge.style.display = "inline-flex";
          }
          let dismissed = "";
          try { dismissed = sessionStorage.getItem("tAStudio.dismissedUpdate") || ""; } catch (e) {}
          if (manual || dismissed !== info.latest_version) {
            openUpdateModal(info);
          }
        } else if (manual) {
          if (info.ok) {
            showToast(
              t("toast_update_uptodate", "StudioCockpit ist auf dem neuesten Stand (v{ver}).")
                .replace("{ver}", info.current_version || "?"),
              "success",
              3500
            );
          } else {
            showToast(info.error || t("toast_update_check_failed", "Update-Prüfung fehlgeschlagen."), "info", 4000);
          }
        }
      } catch (e) {
        if (manual) showToast(t("toast_update_offline", "Konnte nicht nach Updates suchen (offline?)."), "error", 3500);
      }
    }

    async function pollInstallStatus() {
      try {
        const res = await fetch("/api/update/status");
        if (!res.ok) return;
        const st = await res.json();
        const pct = Math.max(0, Math.min(100, Number(st.progress || 0)));
        if (elProgressFill) elProgressFill.style.width = `${pct}%`;
        if (elProgressPct) elProgressPct.textContent = `${pct}%`;
        if (elProgressText) elProgressText.textContent = st.message || t("update_installing", "Installiere…");

        if (st.status === "restarting") {
          window.__studioUpdating = true;
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        } else if (st.status === "error") {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          if (btnInstall) btnInstall.disabled = false;
          if (btnDismiss) btnDismiss.disabled = false;
          showToast(st.error || t("toast_update_failed", "Update fehlgeschlagen."), "error", 5000);
        }
      } catch (e) {}
    }

    if (btnBadge) {
      btnBadge.addEventListener("click", () => {
        if (latestUpdateInfo) openUpdateModal(latestUpdateInfo);
        else checkUpdates(true);
      });
    }
    if (brandVersion) {
      brandVersion.addEventListener("click", () => checkUpdates(true));
    }
    if (btnClose) btnClose.addEventListener("click", () => closeUpdateModal(true));
    if (btnDismiss) btnDismiss.addEventListener("click", () => closeUpdateModal(true));
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal && !(btnInstall && btnInstall.disabled)) {
          closeUpdateModal(true);
        }
      });
    }
    if (btnInstall) {
      btnInstall.addEventListener("click", async () => {
        window.__studioUpdating = true;
        btnInstall.disabled = true;
        if (btnDismiss) btnDismiss.disabled = true;
        if (elProgressWrap) elProgressWrap.style.display = "";
        if (elProgressText) elProgressText.textContent = t("update_starting_download", "Starte Download…");
        if (elProgressPct) elProgressPct.textContent = "0%";
        if (elProgressFill) elProgressFill.style.width = "0%";

        try {
          const res = await fetch("/api/update/install", { method: "POST" });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            throw new Error(data.error || t("update_start_failed", "Installation konnte nicht gestartet werden."));
          }
          pollTimer = setInterval(pollInstallStatus, 400);
          pollInstallStatus();
        } catch (err) {
          const msg = String((err && err.message) || err || "");
          const isDisconnect = /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
          if (isDisconnect) {
            // Server likely closed or is restarting for the update — keep __studioUpdating = true
            // and suppress any error toast, while polling status in case the server is still up.
            if (elProgressText) elProgressText.textContent = t("update_restarting", "Update wird installiert – App startet neu…");
            if (!pollTimer) {
              pollTimer = setInterval(pollInstallStatus, 400);
            }
            return;
          }
          window.__studioUpdating = false;
          btnInstall.disabled = false;
          if (btnDismiss) btnDismiss.disabled = false;
          if (elProgressWrap) elProgressWrap.style.display = "none";
          showToast(msg || t("toast_update_failed", "Update fehlgeschlagen."), "error", 5000);
        }
      });
    }

    setTimeout(() => checkUpdates(false), 1500);
  }

  // Start application lifecycle
  initApp();
  initUpdateChecker();

})();
