/* thomo.ART StudioCockpit - DiscordGIF Module Controller */
(() => {
  "use strict";

  const state = {
    initialized: false,
    activeModule: "image",
    source: "local", // local | tenor | ai
    filter: "all",
    gifs: [],
    tenorGifs: [],
    pendingFileBase64: null,
    aiImageBase64: null,
    aiResultGif: null,
    aiPollTimer: null,
    aiStatus: null,
    settings: {},
  };

  const $ = (id) => document.getElementById(id);

  const GIF_I18N = {
    de: {
      nav_images: "🎨 Bilder",
      nav_gif: "👾 DiscordGIF",
      btn_send_to_gif: "👾 Als Discord-GIF",
      btn_send_to_gif_title: "Aktuelles Bild im DiscordGIF AI-Studio animieren",
      tab_local: "📁 Meine GIFs",
      tab_tenor: "🌐 Tenor",
      tab_ai: "✨ AI-GIF",
      search_ph: "Suche nach Name, Tag oder Tenor...",
      filter_all: "Alle",
      filter_fav: "⭐ Favoriten",
      card_behavior: "Discord-Einfügen",
      paste_mode: "Einfüge-Modus",
      paste_file: "Datei (Clip)",
      paste_url: "Link (URL)",
      auto_send: "Sofort mit Enter absenden",
      hotkey_tip: "💡 Drücke Alt + G in Discord, klicke ein GIF an – es wird direkt eingefügt!",
      btn_gif_folder: "📁 GIF-Ordner",
      btn_reload: "🔄 Neu laden",
      card_add: "GIF hinzufügen",
      drop_gif: "📁 GIF hierher ziehen oder klicken",
      or_url: "Oder Web-URL",
      title_tags: "Titel & Tags",
      title_ph: "Titel (optional)",
      tags_ph: "Tags (kommagetrennt)",
      btn_save_gif: "💾 GIF speichern",
      card_ai_params: "AI-GIF Parameter",
      ai_model: "AI-Modell / Workflow",
      opt_minimax: "MiniMax H3 (Hailuo) • Action & Mimik",
      opt_ltx: "LTX-Video 2B • Fast Action",
      opt_svd: "SVD-XT • Sanfte Animation",
      ai_res: "Auflösung & VRAM",
      ai_motion: "Motion-Intensität",
      ai_pingpong: "Nahtloser Ping-Pong Loop",
      ai_reverse: "Rückwärts abspielen",
      gallery_title: "GIF-Sammlung",
      gallery_tenor: "Discord / Tenor Suche",
      ai_studio_title: "AI Image-to-GIF Studio",
      ai_source_img: "Ausgangsbild (PNG/JPG/WebP)",
      ai_drop_img: "Bild hierher ziehen oder klicken",
      ai_drop_sub: "Oder direkt aus dem Bilder-Studio senden",
      btn_remove: "✕ Entfernen",
      ai_motion_prompt: "Bewegungs-Prompt (Action)",
      ai_prompt_ph: "z. B. eating popcorn, chewing, smiling...",
      idea_popcorn: "🍿 Popcorn",
      idea_laugh: "😂 Lachen",
      idea_wave: "👋 Winken",
      idea_clap: "👏 Klatschen",
      idea_dance: "💃 Tanzen",
      ai_title_opt: "Titel (optional)",
      ai_title_ph: "z. B. Popcorn Snack",
      ai_overlay: "Text-Overlay hinzufügen",
      ov_bottom: "Unten",
      ov_top: "Oben",
      ov_fade: "✨ Fade-In",
      ov_delayed: "⏳ Verzögert",
      ov_static: "Statisch",
      ov_text_ph: "Text für Overlay...",
      btn_ai_generate: "🚀 Discord-GIF generieren",
      btn_cancel: "Abbrechen",
      ai_generating: "Generiere...",
      ai_result_done: "✅ Discord-GIF erstellt!",
      btn_send_discord: "💬 In Discord einfügen",
      btn_to_collection: "📁 Zur Sammlung",
      settings_gif_dir: "Lokaler GIF-Ordner (eigene GIFs)",
      btn_browse: "📁 Durchsuchen",
      ctx_copy: "📋 Kopieren",
      ctx_cut: "✂️ Ausschneiden",
      ctx_paste: "📥 Einfügen",
      ctx_select_all: "🔘 Alles auswählen",
      discord_connected: "Discord: Verbunden",
      discord_offline: "Discord: Nicht offen",
      comfy_online: "ComfyUI: Online",
      comfy_offline: "ComfyUI: Offline",
      models_ok: "✅ All required models installed",
      models_missing: "⚠️ Missing ComfyUI models:",
      models_ok: "✅ Alle benötigten Modelle installiert",
      models_missing: "⚠️ Fehlende ComfyUI-Modelle:",
      folder_default: "Standard-Sammlung (lokal)",
      folder_prefix: "Ordner:",
      no_gifs: "Keine GIFs gefunden.",
      searching_tenor: "Suche auf Tenor...",
      tenor_err: "Tenor-Suche fehlgeschlagen.",
      msg_need_img: "Bitte zuerst ein Ausgangsbild wählen.",
      msg_gif_done: "Discord-GIF erfolgreich generiert!",
      msg_gif_saved: "GIF gespeichert!",
      msg_gif_deleted: "GIF gelöscht",
      msg_gif_dl: "GIF heruntergeladen!",
      msg_folder_upd: "GIF-Ordner aktualisiert",
      msg_copied: "In Zwischenablage kopiert!",
      msg_need_file_url: "Bitte eine GIF-Datei oder URL angeben.",
      msg_adopted: "Bild an DiscordGIF AI-Studio übergeben!",
      msg_no_viewer_img: "Kein Bild im Viewer ausgewählt.",
      adopted_label: "Übernommen aus Bilder-Studio",
    },
    en: {
      nav_images: "🎨 Images",
      nav_gif: "👾 DiscordGIF",
      btn_send_to_gif: "👾 To Discord GIF",
      btn_send_to_gif_title: "Animate current image in DiscordGIF AI Studio",
      tab_local: "📁 My GIFs",
      tab_tenor: "🌐 Tenor",
      tab_ai: "✨ AI GIF",
      search_ph: "Search by name, tag or Tenor...",
      filter_all: "All",
      filter_fav: "⭐ Favorites",
      card_behavior: "Discord Insert",
      paste_mode: "Paste Mode",
      paste_file: "File (Clip)",
      paste_url: "Link (URL)",
      auto_send: "Auto-send with Enter",
      hotkey_tip: "💡 Press Alt + G in Discord, click a GIF – it pastes right in!",
      btn_gif_folder: "📁 GIF Folder",
      btn_reload: "🔄 Reload",
      card_add: "Add GIF",
      drop_gif: "📁 Drop GIF here or click",
      or_url: "Or Web URL",
      title_tags: "Title & Tags",
      title_ph: "Title (optional)",
      tags_ph: "Tags (comma-separated)",
      btn_save_gif: "💾 Save GIF",
      card_ai_params: "AI GIF Parameters",
      ai_model: "AI Model / Workflow",
      opt_minimax: "MiniMax H3 (Hailuo) • Action & Expressions",
      opt_ltx: "LTX-Video 2B • Fast Action",
      opt_svd: "SVD-XT • Gentle Animation",
      ai_res: "Resolution & VRAM",
      ai_motion: "Motion Intensity",
      ai_pingpong: "Seamless Ping-Pong Loop",
      ai_reverse: "Play in Reverse",
      gallery_title: "GIF Collection",
      gallery_tenor: "Discord / Tenor Search",
      ai_studio_title: "AI Image-to-GIF Studio",
      ai_source_img: "Source Image (PNG/JPG/WebP)",
      ai_drop_img: "Drop image here or click",
      ai_drop_sub: "Or send directly from Image Studio",
      btn_remove: "✕ Remove",
      ai_motion_prompt: "Motion Prompt (Action)",
      ai_prompt_ph: "e.g. eating popcorn, chewing, smiling...",
      idea_popcorn: "🍿 Popcorn",
      idea_laugh: "😂 Laugh",
      idea_wave: "👋 Wave",
      idea_clap: "👏 Clap",
      idea_dance: "💃 Dance",
      ai_title_opt: "Title (optional)",
      ai_title_ph: "e.g. Popcorn Snack",
      ai_overlay: "Add Text Overlay",
      ov_bottom: "Bottom",
      ov_top: "Top",
      ov_fade: "✨ Fade-In",
      ov_delayed: "⏳ Delayed",
      ov_static: "Static",
      ov_text_ph: "Overlay text...",
      btn_ai_generate: "🚀 Generate Discord GIF",
      btn_cancel: "Cancel",
      ai_generating: "Generating...",
      ai_result_done: "✅ Discord GIF created!",
      btn_send_discord: "💬 Paste to Discord",
      btn_to_collection: "📁 To Collection",
      settings_gif_dir: "Local GIF Folder (custom GIFs)",
      btn_browse: "📁 Browse",
      ctx_copy: "📋 Copy",
      ctx_cut: "✂️ Cut",
      ctx_paste: "📥 Paste",
      ctx_select_all: "🔘 Select All",
      discord_connected: "Discord: Connected",
      discord_offline: "Discord: Not open",
      comfy_online: "ComfyUI: Online",
      comfy_offline: "ComfyUI: Offline",
      models_ok: "✅ All required models installed",
      models_missing: "⚠️ Missing ComfyUI models:",
      models_ok: "✅ Alle benötigten Modelle installiert",
      models_missing: "⚠️ Fehlende ComfyUI-Modelle:",
      folder_default: "Default collection (local)",
      folder_prefix: "Folder:",
      no_gifs: "No GIFs found.",
      searching_tenor: "Searching Tenor...",
      tenor_err: "Tenor search failed.",
      msg_need_img: "Please select a source image first.",
      msg_gif_done: "Discord GIF generated successfully!",
      msg_gif_saved: "GIF saved!",
      msg_gif_deleted: "GIF deleted",
      msg_gif_dl: "GIF downloaded!",
      msg_folder_upd: "GIF folder updated",
      msg_copied: "Copied to clipboard!",
      msg_need_file_url: "Please provide a GIF file or URL.",
      msg_adopted: "Image sent to DiscordGIF AI Studio!",
      msg_no_viewer_img: "No image selected in viewer.",
      adopted_label: "Sent from Image Studio",
    },
  };

  function getLang() {
    const l = (document.documentElement.lang || "de").toLowerCase();
    return l.startsWith("en") ? "en" : "de";
  }

  function gt(key) {
    const lang = getLang();
    return (GIF_I18N[lang] && GIF_I18N[lang][key]) || GIF_I18N.de[key] || key;
  }

  function applyGifLanguage() {
    document.querySelectorAll("[data-gif-i18n]").forEach((el) => {
      const k = el.getAttribute("data-gif-i18n");
      if (k) el.textContent = gt(k);
    });
    document.querySelectorAll("[data-gif-i18n-ph]").forEach((el) => {
      const k = el.getAttribute("data-gif-i18n-ph");
      if (k) el.placeholder = gt(k);
    });
    document.querySelectorAll("[data-gif-i18n-title]").forEach((el) => {
      const k = el.getAttribute("data-gif-i18n-title");
      if (k) el.title = gt(k);
    });
    if ($("gifGalleryTitle")) {
      $("gifGalleryTitle").textContent = gt(state.source === "tenor" ? "gallery_tenor" : "gallery_title");
    }
    if ($("gifFolderHint")) {
      $("gifFolderHint").textContent = state.settings?.gif_dir
        ? `${gt("folder_prefix")} ${state.settings.gif_dir}`
        : gt("folder_default");
    }
    if (state.initialized) {
      renderCategoryPills();
      if (state.source !== "ai") renderGifGrid();
      refreshGifStatus();
      if (state.source === "ai") refreshAiStatus();
    }
  }

  function notify(msg, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
      return;
    }
    const container = $("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  async function apiGet(url) {
    const res = await fetch(url);
    return res.json();
  }

  async function apiPost(url, payload = {}) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  // -------------------------------------------------------------------------
  // Studio Header Module Switcher (Image is ALWAYS default on startup)
  // -------------------------------------------------------------------------
  function switchStudioModule(moduleName) {
    state.activeModule = moduleName;
    const imgView = $("moduleImageView");
    const gifView = $("moduleGifView");
    const galView = $("moduleGalleryView");
    const videoView = $("moduleVideoView");
    if (imgView) imgView.style.display = moduleName === "image" ? "" : "none";
    if (gifView) gifView.style.display = moduleName === "gif" ? "flex" : "none";
    if (galView) galView.style.display = moduleName === "gallery" ? "flex" : "none";
    if (videoView) videoView.style.display = moduleName === "video" ? "grid" : "none";

    document.querySelectorAll("#studioNav .studio-nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.module === moduleName);
    });

    if (moduleName === "gif") {
      initGifModule();
    }
    window.dispatchEvent(new CustomEvent("studio-module-changed", { detail: { module: moduleName } }));
  }
  window.switchStudioModule = switchStudioModule;

  // -------------------------------------------------------------------------
  // DiscordGIF Module Init & Data Loading
  // -------------------------------------------------------------------------
  async function initGifModule() {
    if (!state.initialized) {
      state.initialized = true;
      bindGifEvents();
    }
    await Promise.all([loadGifSettings(), refreshGifStatus(), loadLocalGifs()]);
  }

  async function refreshGifStatus() {
    try {
      const st = await apiGet("/api/gif/status");
      const badge = $("gifDiscordStatusBadge");
      if (badge) {
        badge.textContent = st.discord_found ? gt("discord_connected") : gt("discord_offline");
        badge.style.color = st.discord_found ? "var(--accent2)" : "var(--mute)";
      }
    } catch (_) {}
  }

  function renderAiModelStatusHint() {
    const hint = $("gifAiModelStatusHint");
    if (!hint) return;
    const st = state.aiStatus;
    if (!st || !st.online) {
      hint.style.display = "none";
      return;
    }
    const wfId = $("gifAiModelSelect")?.value || "minimax_h3";
    const wf = (st.workflows || []).find((w) => w.id === wfId);
    const reqs = wf?.required_files || [];
    if (!reqs.length) {
      hint.style.display = "none";
      return;
    }
    const byFolder = st.models_by_folder || {};
    const allModels = st.installed_models || [];
    const missing = [];
    for (const req of reqs) {
      const folder = req.folder_type || "";
      const pool = folder && byFolder[folder] ? byFolder[folder] : allModels;
      const cands = [req.filename || "", ...(req.alternatives || [])]
        .filter(Boolean)
        .map((c) => c.toLowerCase().replace(/\\/g, "/"));
      const found = pool.some((m) => {
        const ml = String(m).toLowerCase().replace(/\\/g, "/");
        return cands.some((c) => ml === c || ml.endsWith("/" + c));
      });
      if (!found) missing.push(req);
    }

    const escHtml = (s) =>
      String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    hint.style.display = "block";
    if (!missing.length) {
      hint.style.borderColor = "var(--accent2)";
      hint.style.color = "var(--accent2)";
      hint.textContent = gt("models_ok");
    } else {
      hint.style.borderColor = "var(--danger)";
      hint.style.color = "var(--text)";
      const itemsHtml = missing
        .map((mf) => {
          const fname = escHtml(mf.filename || mf.name || "?");
          const folder = escHtml(mf.folder_type || "checkpoints");
          const size = mf.size_str ? ` (${escHtml(mf.size_str)})` : "";
          const dl = mf.url
            ? ` · <a href="${escHtml(mf.url)}" target="_blank" rel="noopener" style="color:var(--accent); text-decoration:underline;">Download</a>`
            : "";
          return `<div style="margin-top:4px;">• <code>${fname}</code>${size}<br><span style="color:var(--mute);">→ ComfyUI/models/${folder}/</span>${dl}</div>`;
        })
        .join("");
      hint.innerHTML = `<div style="color:var(--danger); font-weight:600;">${escHtml(gt("models_missing"))}</div>${itemsHtml}`;
    }
  }

  async function refreshAiStatus() {
    try {
      const st = await apiGet("/api/gif/ai/status");
      state.aiStatus = st;
      const badge = $("gifAiStatusBadge");
      if (badge) {
        badge.textContent = st.online ? gt("comfy_online") : gt("comfy_offline");
        badge.style.color = st.online ? "var(--accent2)" : "var(--danger)";
      }
      renderAiModelStatusHint();
    } catch (_) {}
  }

  async function loadGifSettings() {
    try {
      const res = await apiGet("/api/gif/settings");
      if (res.ok && res.settings) {
        state.settings = res.settings;
        const mode = res.settings.paste_mode || "file";
        document.querySelectorAll("#gifPasteModeSeg button").forEach((b) => {
          b.classList.toggle("active", b.dataset.mode === mode);
        });
        const chkAuto = $("chkGifAutoSend");
        if (chkAuto) chkAuto.checked = Boolean(res.settings.auto_send);
        const hint = $("gifFolderHint");
        if (hint) {
          hint.textContent = res.settings.gif_dir ? `${gt("folder_prefix")} ${res.settings.gif_dir}` : gt("folder_default");
        }
      }
    } catch (_) {}
  }

  async function loadLocalGifs() {
    try {
      const res = await apiGet("/api/gif/list");
      if (res.ok) {
        state.gifs = res.gifs || [];
        renderCategoryPills();
        if (state.source === "local") renderGifGrid();
      }
    } catch (ex) {
      notify("Fehler beim Laden der GIFs", "error");
    }
  }

  async function searchTenor(query = "") {
    const grid = $("gifGrid");
    if (grid) grid.innerHTML = `<div style="color:var(--mute); padding:16px;">${gt("searching_tenor")}</div>`;
    try {
      const res = await apiGet(`/api/gif/tenor/search?q=${encodeURIComponent(query)}&limit=32`);
      state.tenorGifs = res.gifs || [];
      if (state.source === "tenor") renderGifGrid();
    } catch (_) {
      if (grid) grid.innerHTML = `<div style="color:var(--danger); padding:16px;">${gt("tenor_err")}</div>`;
    }
  }

  function renderCategoryPills() {
    const wrap = $("gifCategoryPills");
    if (!wrap) return;
    const cats = new Set();
    state.gifs.forEach((g) => {
      if (g.category) cats.add(g.category);
    });
    const base = [
      { key: "all", label: gt("filter_all") },
      { key: "fav", label: gt("filter_fav") },
      ...Array.from(cats).map((c) => ({ key: `cat:${c}`, label: c })),
    ];
    wrap.innerHTML = "";
    base.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill-btn" + (state.filter === item.key ? " active" : "");
      btn.textContent = item.label;
      btn.onclick = () => {
        state.filter = item.key;
        renderCategoryPills();
        renderGifGrid();
      };
      wrap.appendChild(btn);
    });
  }

  function renderGifGrid() {
    const grid = $("gifGrid");
    const countBadge = $("gifCountBadge");
    if (!grid) return;

    const query = ($("gifSearchInput")?.value || "").trim().toLowerCase();
    let list = state.source === "tenor" ? state.tenorGifs : state.gifs;

    if (state.source === "local") {
      list = list.filter((g) => {
        if (state.filter === "fav" && !g.favorite) return false;
        if (state.filter.startsWith("cat:") && g.category !== state.filter.slice(4)) return false;
        if (!query) return true;
        const hay = `${g.title || ""} ${(g.tags || []).join(" ")} ${g.category || ""}`.toLowerCase();
        return hay.includes(query);
      });
    }

    if (countBadge) countBadge.textContent = `${list.length} GIFs`;
    if (!list.length) {
      grid.innerHTML = `<div style="color:var(--mute); padding:18px;">${gt("no_gifs")}</div>`;
      return;
    }

    grid.innerHTML = "";
    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "gif-card";
      const thumbUrl = item.preview_url || item.url || "";
      const tagsText = Array.isArray(item.tags) ? item.tags.slice(0, 3).join(", ") : "";

      card.innerHTML = `
        <div class="gif-card-thumb">
          <img src="${thumbUrl}" alt="${(item.title || "GIF").replace(/"/g, "&quot;")}" loading="lazy">
          <div class="gif-card-overlay">
            ${
              state.source === "tenor"
                ? '<button type="button" class="gif-card-icon-btn" data-act="download" title="In Sammlung speichern">⬇️</button>'
                : `<button type="button" class="gif-card-icon-btn ${item.favorite ? "fav-active" : ""}" data-act="fav" title="Favorit">⭐</button>
                   <button type="button" class="gif-card-icon-btn" data-act="del" title="Löschen">🗑️</button>`
            }
          </div>
        </div>
        <div class="gif-card-meta">
          <div class="gif-card-title">${item.title || "GIF"}</div>
          <div class="gif-card-tags">${tagsText || (item.category || "Discord GIF")}</div>
        </div>
      `;

      card.addEventListener("click", async (ev) => {
        const actBtn = ev.target.closest("[data-act]");
        if (actBtn) {
          ev.stopPropagation();
          const act = actBtn.dataset.act;
          if (act === "fav") {
            await apiPost("/api/gif/update", { id: item.id, favorite: !item.favorite });
            item.favorite = !item.favorite;
            renderGifGrid();
          } else if (act === "del") {
            const res = await apiPost("/api/gif/delete", { id: item.id });
            if (res.ok) {
              notify("GIF gelöscht", "info");
              await loadLocalGifs();
            }
          } else if (act === "download") {
            const res = await apiPost("/api/gif/tenor/download", { url: item.url, title: item.title });
            if (res.ok) {
              notify("GIF heruntergeladen!", "success");
              await loadLocalGifs();
            } else {
              notify(res.error || "Download fehlgeschlagen", "error");
            }
          }
          return;
        }
        await sendGifToDiscord(item.id);
      });

      grid.appendChild(card);
    });
  }

  async function sendGifToDiscord(gifId) {
    try {
      const res = await apiPost("/api/gif/send", { id: gifId });
      if (res.ok) {
        notify(res.warning || res.message || "In Zwischenablage kopiert!", res.warning ? "warn" : "success");
      } else {
        notify(res.error || "Senden fehlgeschlagen", "error");
      }
    } catch (_) {
      notify("Fehler beim Senden an Discord", "error");
    }
  }

  function switchGifSource(source) {
    state.source = source;
    document.querySelectorAll("#gifSourceSeg button").forEach((b) => {
      b.classList.toggle("active", b.dataset.source === source);
    });

    const isAi = source === "ai";
    const isLocal = source === "local";
    if ($("gifAddCard")) $("gifAddCard").style.display = isLocal ? "" : "none";
    if ($("gifBehaviorCard")) $("gifBehaviorCard").style.display = isAi ? "none" : "";
    if ($("gifAiSettingsCard")) $("gifAiSettingsCard").style.display = isAi ? "" : "none";
    if ($("gifCategoryPills")) $("gifCategoryPills").style.display = isLocal ? "" : "none";
    if ($("gifSearchBox")) $("gifSearchBox").style.display = isAi ? "none" : "";
    if ($("gifGalleryCard")) $("gifGalleryCard").style.display = isAi ? "none" : "flex";
    if ($("gifAiCard")) $("gifAiCard").style.display = isAi ? "flex" : "none";
    if ($("gifGalleryTitle")) {
      $("gifGalleryTitle").textContent = gt(source === "tenor" ? "gallery_tenor" : "gallery_title");
    }

    if (source === "tenor") {
      searchTenor($("gifSearchInput")?.value || "");
    } else if (source === "ai") {
      refreshAiStatus();
    } else {
      renderGifGrid();
    }
  }

  function setAiSourceImage(dataUrl, infoText = "") {
    state.aiImageBase64 = dataUrl;
    const prev = $("gifAiSourcePreview");
    const ph = $("gifAiDropPlaceholder");
    const btnClr = $("btnGifAiClearImg");
    const info = $("gifAiImageInfo");
    if (prev) {
      prev.src = dataUrl || "";
      prev.style.display = dataUrl ? "block" : "none";
    }
    if (ph) ph.style.display = dataUrl ? "none" : "";
    if (btnClr) btnClr.style.display = dataUrl ? "" : "none";
    if (info) info.textContent = infoText;
  }

  function readFileAsDataUrl(file, cb) {
    const reader = new FileReader();
    reader.onload = (e) => cb(e.target.result);
    reader.readAsDataURL(file);
  }

  async function startAiGifGeneration() {
    if (!state.aiImageBase64) {
      notify("Bitte zuerst ein Ausgangsbild wählen.", "warn");
      return;
    }
    const resMap = {
      high: [576, 576],
      standard: [512, 512],
      fast: [480, 272],
    };
    const [width, height] = resMap[$("gifAiResSelect")?.value || "high"] || [512, 512];

    const payload = {
      image_data: state.aiImageBase64,
      workflow_id: $("gifAiModelSelect")?.value || "minimax_h3",
      width,
      height,
      motion_bucket: parseInt($("gifAiMotionRange")?.value || "100", 10),
      frames: parseInt($("gifAiFramesSelect")?.value || "44", 10),
      fps: parseInt($("gifAiFpsSelect")?.value || "12", 10),
      loop_mode: $("chkGifAiPingPong")?.checked ? "pingpong" : "normal",
      reverse: Boolean($("chkGifAiReverse")?.checked),
      prompt: $("gifAiPromptInput")?.value || "",
      title: $("gifAiTitleInput")?.value || "",
      overlay_enabled: Boolean($("chkGifAiOverlay")?.checked),
      overlay_text: $("gifAiOverlayText")?.value || "",
      overlay_position: $("gifAiOverlayPos")?.value || "bottom",
      overlay_effect: $("gifAiOverlayEff")?.value || "fade_in",
    };

    const res = await apiPost("/api/gif/ai/generate", payload);
    if (!res.ok) {
      notify(res.error || "Start fehlgeschlagen", "error");
      return;
    }

    if ($("gifAiProgressBox")) $("gifAiProgressBox").style.display = "block";
    if ($("gifAiResultBox")) $("gifAiResultBox").style.display = "none";
    if ($("btnGifAiGenerate")) $("btnGifAiGenerate").disabled = true;
    if ($("btnGifAiCancel")) $("btnGifAiCancel").style.display = "";

    clearInterval(state.aiPollTimer);
    state.aiPollTimer = setInterval(pollAiGifProgress, 700);
  }

  async function pollAiGifProgress() {
    try {
      const st = await apiGet("/api/gif/ai/progress");
      if ($("gifAiProgressText")) $("gifAiProgressText").textContent = st.status_text || "Arbeite...";
      if ($("gifAiProgressPct")) $("gifAiProgressPct").textContent = `${st.progress || 0}%`;
      if ($("gifAiProgressBar")) $("gifAiProgressBar").style.width = `${st.progress || 0}%`;

      if (!st.busy) {
        clearInterval(state.aiPollTimer);
        if ($("btnGifAiGenerate")) $("btnGifAiGenerate").disabled = false;
        if ($("btnGifAiCancel")) $("btnGifAiCancel").style.display = "none";

        if (st.error) {
          notify(st.error, "error");
        } else if (st.current_gif) {
          state.aiResultGif = st.current_gif;
          if ($("gifAiResultImg")) $("gifAiResultImg").src = st.current_gif.url;
          if ($("gifAiResultBox")) $("gifAiResultBox").style.display = "flex";
          notify("Discord-GIF erfolgreich generiert!", "success");
          await loadLocalGifs();
        }
      }
    } catch (_) {}
  }

  function bindGifEvents() {
    document.querySelectorAll("#gifSourceSeg button").forEach((btn) => {
      btn.addEventListener("click", () => switchGifSource(btn.dataset.source));
    });

    document.querySelectorAll("#gifPasteModeSeg button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const mode = btn.dataset.mode;
        document.querySelectorAll("#gifPasteModeSeg button").forEach((b) => b.classList.toggle("active", b === btn));
        await apiPost("/api/gif/settings", { paste_mode: mode });
      });
    });

    $("chkGifAutoSend")?.addEventListener("change", async (e) => {
      await apiPost("/api/gif/settings", { auto_send: e.target.checked });
    });

    let searchTimer = null;
    $("gifSearchInput")?.addEventListener("input", () => {
      if (state.source === "tenor") {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => searchTenor($("gifSearchInput").value), 450);
      } else {
        renderGifGrid();
      }
    });

    $("btnGifReload")?.addEventListener("click", () => {
      refreshGifStatus();
      if (state.source === "tenor") searchTenor($("gifSearchInput")?.value || "");
      else loadLocalGifs();
    });

    $("btnGifSelectFolder")?.addEventListener("click", async () => {
      const res = await apiPost("/api/gif/select_folder", {});
      if (res.ok && res.path) {
        await apiPost("/api/gif/settings", { gif_dir: res.path });
        await loadGifSettings();
        await loadLocalGifs();
        notify("GIF-Ordner aktualisiert", "success");
      }
    });

    // Local GIF upload dropzone
    const drop = $("gifDropZone");
    const fileIn = $("gifFileInput");
    drop?.addEventListener("click", () => fileIn?.click());
    drop?.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("dragover");
    });
    drop?.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop?.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
      const f = e.dataTransfer?.files?.[0];
      if (f) {
        readFileAsDataUrl(f, (url) => {
          state.pendingFileBase64 = url;
          if ($("gifDropPrompt")) $("gifDropPrompt").textContent = `✅ ${f.name}`;
        });
      }
    });
    fileIn?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) {
        readFileAsDataUrl(f, (url) => {
          state.pendingFileBase64 = url;
          if ($("gifDropPrompt")) $("gifDropPrompt").textContent = `✅ ${f.name}`;
        });
      }
    });

    $("btnGifSave")?.addEventListener("click", async () => {
      const url = ($("gifInputUrl")?.value || "").trim();
      if (!state.pendingFileBase64 && !url) {
        notify("Bitte eine GIF-Datei oder URL angeben.", "warn");
        return;
      }
      const res = await apiPost("/api/gif/add", {
        data: state.pendingFileBase64,
        url,
        title: $("gifInputTitle")?.value || "",
        tags: $("gifInputTags")?.value || "",
      });
      if (res.ok) {
        state.pendingFileBase64 = null;
        if ($("gifDropPrompt")) $("gifDropPrompt").textContent = "📁 GIF hierher ziehen oder klicken";
        if ($("gifInputUrl")) $("gifInputUrl").value = "";
        if ($("gifInputTitle")) $("gifInputTitle").value = "";
        if ($("gifInputTags")) $("gifInputTags").value = "";
        notify("GIF gespeichert!", "success");
        await loadLocalGifs();
      }
    });

    // AI Studio events
    $("gifAiMotionRange")?.addEventListener("input", (e) => {
      if ($("gifAiMotionVal")) $("gifAiMotionVal").textContent = e.target.value;
    });

    const aiDrop = $("gifAiDropZone");
    const aiFile = $("gifAiFileInput");
    aiDrop?.addEventListener("click", () => aiFile?.click());
    aiDrop?.addEventListener("dragover", (e) => {
      e.preventDefault();
      aiDrop.classList.add("dragover");
    });
    aiDrop?.addEventListener("dragleave", () => aiDrop.classList.remove("dragover"));
    aiDrop?.addEventListener("drop", (e) => {
      e.preventDefault();
      aiDrop.classList.remove("dragover");
      const f = e.dataTransfer?.files?.[0];
      if (f) readFileAsDataUrl(f, (url) => setAiSourceImage(url, f.name));
    });
    aiFile?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) readFileAsDataUrl(f, (url) => setAiSourceImage(url, f.name));
    });
    $("btnGifAiClearImg")?.addEventListener("click", () => setAiSourceImage(null, ""));

    document.querySelectorAll("#gifAiPromptPills .pill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if ($("gifAiPromptInput")) $("gifAiPromptInput").value = btn.dataset.prompt || "";
      });
    });

    $("chkGifAiOverlay")?.addEventListener("change", (e) => {
      const show = e.target.checked ? "" : "none";
      if ($("gifAiOverlayPos")) $("gifAiOverlayPos").style.display = show;
      if ($("gifAiOverlayEff")) $("gifAiOverlayEff").style.display = show;
      if ($("gifAiOverlayText")) $("gifAiOverlayText").style.display = show;
    });

    $("btnGifAiGenerate")?.addEventListener("click", startAiGifGeneration);
    $("gifAiModelSelect")?.addEventListener("change", () => {
      if (state.aiStatus) renderAiModelStatusHint();
      else refreshAiStatus();
    });
    $("btnGifAiCancel")?.addEventListener("click", async () => {
      await apiPost("/api/gif/ai/cancel", {});
    });
    $("btnGifAiSendResult")?.addEventListener("click", () => {
      if (state.aiResultGif?.id) sendGifToDiscord(state.aiResultGif.id);
    });
    $("btnGifAiOpenCollection")?.addEventListener("click", () => switchGifSource("local"));
  }

  // -------------------------------------------------------------------------
  // Bootstrap Header Navigation & Cross-Module Bridge (Image -> DiscordGIF)
  // -------------------------------------------------------------------------
  window.openDiscordGifFromHotkey = () => {
    switchStudioModule("gif");
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#studioNav .studio-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchStudioModule(btn.dataset.module));
    });

    // Settings modal integration for GIF directory
    $("btnSettings")?.addEventListener("click", async () => {
      try {
        const res = await apiGet("/api/gif/settings");
        if (res.ok && res.settings && $("inpGifDir")) {
          $("inpGifDir").value = res.settings.gif_dir || "";
        }
      } catch (_) {}
    });

    $("btnBrowseGifDir")?.addEventListener("click", async () => {
      const res = await apiPost("/api/gif/select_folder", {});
      if (res.ok && res.path && $("inpGifDir")) {
        $("inpGifDir").value = res.path;
      }
    });

    $("btnSaveSettings")?.addEventListener("click", async () => {
      const inp = $("inpGifDir");
      if (!inp) return;
      try {
        await apiPost("/api/gif/settings", { gif_dir: inp.value.trim() });
        if (state.initialized) {
          await loadGifSettings();
          await loadLocalGifs();
        }
      } catch (_) {}
    });

    $("btnSendToDiscordGif")?.addEventListener("click", async () => {
      const mainImg = $("mainPreview");
      const cmpImg = $("compareAfterImg");
      const imgEl = (mainImg && mainImg.style.display !== "none" && mainImg.src) ? mainImg : cmpImg;
      const src = imgEl?.src;
      if (!src) {
        notify("Kein Bild im Viewer ausgewählt.", "warn");
        return;
      }
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = async (e) => {
          switchStudioModule("gif");
          await initGifModule();
          switchGifSource("ai");
          setAiSourceImage(e.target.result, "Übernommen aus Bilder-Studio");
          notify("Bild an DiscordGIF AI-Studio übergeben!", "success");
        };
        reader.readAsDataURL(blob);
      } catch (_) {
        notify("Bild konnte nicht übernommen werden.", "error");
      }
    });

    $("btnSendToVideoMaker")?.addEventListener("click", async () => {
      const mainImg = $("mainPreview");
      const cmpImg = $("compareAfterImg");
      const imgEl = (mainImg && mainImg.style.display !== "none" && mainImg.src) ? mainImg : cmpImg;
      const src = imgEl?.src;
      if (!src) {
        notify("Kein Bild im Viewer ausgewählt.", "warn");
        return;
      }
      if (typeof window.sendImageToVideoMaker === "function") {
        await window.sendImageToVideoMaker(src, "quick");
      }
    });

    // Global right-click context menu for text selection & input/textarea fields
    initStudioTextContextMenu();

    // Sync language initially & on Studio language change
    applyGifLanguage();
    window.addEventListener("studio-language-changed", () => applyGifLanguage());
  });

  function initStudioTextContextMenu() {
    const menu = $("studioContextMenu");
    if (!menu) return;

    let ctxTarget = null;
    let ctxSelectedText = "";

    const hideMenu = () => {
      menu.style.display = "none";
    };

    const isEditableField = (el) => {
      if (!el) return false;
      if (el.tagName === "TEXTAREA") return !el.readOnly && !el.disabled;
      if (el.tagName === "INPUT") {
        const t = (el.type || "text").toLowerCase();
        return ["text", "search", "url", "email", "password", "number"].includes(t) && !el.readOnly && !el.disabled;
      }
      return Boolean(el.isContentEditable);
    };

    const isTextField = (el) =>
      Boolean(el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && ["text", "search", "url", "email", "password", "number"].includes((el.type || "text").toLowerCase()))));

    document.addEventListener("contextmenu", (ev) => {
      const target = ev.target;
      const editable = isEditableField(target);
      const textField = isTextField(target);

      let selText = "";
      if (textField && typeof target.selectionStart === "number") {
        selText = target.value.slice(target.selectionStart, target.selectionEnd);
      } else {
        selText = window.getSelection()?.toString() || "";
      }

      if (!selText && !textField) {
        hideMenu();
        return;
      }

      ev.preventDefault();
      ctxTarget = target;
      ctxSelectedText = selText;

      const copyBtn = menu.querySelector('[data-ctx="copy"]');
      const cutBtn = menu.querySelector('[data-ctx="cut"]');
      const pasteBtn = menu.querySelector('[data-ctx="paste"]');
      const selAllBtn = menu.querySelector('[data-ctx="selectAll"]');

      if (copyBtn) copyBtn.disabled = !selText;
      if (cutBtn) cutBtn.disabled = !editable || !selText;
      if (pasteBtn) pasteBtn.disabled = !editable;
      if (selAllBtn) selAllBtn.disabled = !textField;

      menu.style.display = "flex";
      const mw = menu.offsetWidth || 180;
      const mh = menu.offsetHeight || 140;
      const x = Math.min(ev.clientX, window.innerWidth - mw - 8);
      const y = Math.min(ev.clientY, window.innerHeight - mh - 8);
      menu.style.left = `${Math.max(6, x)}px`;
      menu.style.top = `${Math.max(6, y)}px`;
    });

    document.addEventListener("click", (ev) => {
      if (!menu.contains(ev.target)) hideMenu();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") hideMenu();
    });

    menu.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("[data-ctx]");
      if (!btn || btn.disabled) return;
      const act = btn.dataset.ctx;
      hideMenu();

      if (act === "copy") {
        try {
          await navigator.clipboard.writeText(ctxSelectedText);
        } catch (_) {
          document.execCommand("copy");
        }
      } else if (act === "cut" && isEditableField(ctxTarget)) {
        try {
          await navigator.clipboard.writeText(ctxSelectedText);
        } catch (_) {
          document.execCommand("copy");
        }
        if (typeof ctxTarget.selectionStart === "number") {
          const s = ctxTarget.selectionStart;
          const e = ctxTarget.selectionEnd;
          ctxTarget.setRangeText("", s, e, "end");
          ctxTarget.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else if (act === "paste" && isEditableField(ctxTarget)) {
        try {
          const clipText = await navigator.clipboard.readText();
          if (typeof ctxTarget.selectionStart === "number") {
            const s = ctxTarget.selectionStart;
            const e = ctxTarget.selectionEnd;
            ctxTarget.setRangeText(clipText, s, e, "end");
            ctxTarget.dispatchEvent(new Event("input", { bubbles: true }));
          }
        } catch (_) {
          ctxTarget.focus();
          document.execCommand("paste");
        }
      } else if (act === "selectAll" && isTextField(ctxTarget)) {
        ctxTarget.focus();
        ctxTarget.select();
      }
    });
  }
})();
