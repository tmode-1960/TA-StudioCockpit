/* =====================================================================
 * Gallery Module (Stufe 1 + 2 + 3A) for thomo.ART StudioCockpit
 * ===================================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const GAL_I18N = {
    de: {
      sidebar_title: "📚 Bibliothek",
      btn_add_root: "+ Ordner",
      btn_add_root_title: "Weiteren Ordner einbinden",
      btn_remove_root_title: "Eingebundenen Ordner entfernen",
      btn_rescan_title: "Ordner neu scannen",
      sel_root_title: "Aktiver Root-Ordner",
      folder_filter_ph: "🔍 Ordner filtern...",
      scope_all: "🗂️ Alle Medien",
      scope_fav: "⭐ Favoriten",
      scope_root: "📄 (Stammordner)",
      scope_purgatory: "🕯️ Purgatory",
      folders_header: "ORDNER",
      btn_new_folder: "+ Neu",
      btn_new_folder_title: "Neuen Unterordner anlegen",
      search_ph: "🔍 Prompt, Modell, Seed, Notiz oder Dateiname...",
      fmt_title: "Format",
      fmt_all: "Alle Formate",
      fmt_images: "🖼️ Nur Bilder",
      fmt_videos: "🎬 Nur Videos",
      wf_title: "Workflow-Filter",
      wf_all: "Alle Workflows",
      wf_with: "✨ Mit Prompt/WF",
      wf_without: "📷 Ohne Prompt/WF",
      btn_filter_notes: "📝",
      btn_filter_notes_title: "Nur Medien mit persönlicher Notiz",
      sort_title: "Sortierung",
      sort_newest: "Neueste zuerst",
      sort_oldest: "Älteste zuerst",
      sort_name: "Name (A–Z)",
      mode_masonry: "Masonry",
      mode_grid: "1:1 Raster",
      mode_rows: "Explorer-Liste",
      btn_select_mode: "☑ Auswahl",
      btn_select_mode_title: "Mehrfachauswahl zum Verschieben / Kopieren / Löschen (oder Strg+Klick)",
      btn_layout: "🎛️ Layout",
      btn_layout_title: "Layout- & Design-Regler ein-/ausblenden",
      batch_count: "{n} ausgewählt",
      batch_target_title: "Zielordner",
      batch_move: "📁 Verschieben",
      batch_copy: "📋 Kopieren",
      batch_rescue: "↩️ Wiederherstellen",
      batch_purgatory: "🕯️ Purgatory",
      batch_burn: "🔥 Endgültig löschen",
      batch_delete: "🗑️ Löschen",
      btn_shortcuts: "⌨️ Shortcuts",
      btn_shortcuts_title: "Aktive Tastenkürzel anzeigen",
      shortcuts_title: "Galerie-Tastenkürzel",
      shortcuts_close: "Schließen",
      shortcuts_grid: "Galerie-Raster",
      shortcuts_lb: "Lightbox (Einzelansicht)",
      sc_ctrl_click: "Strg + Klick",
      sc_ctrl_click_desc: "Bild auswählen / abwählen",
      sc_grid_purg: "X / Entf",
      sc_grid_purg_desc: "Ausgewählte in Purgatory verschieben (bzw. wiederherstellen)",
      sc_grid_burn: "Shift + X / Shift + Entf",
      sc_grid_burn_desc: "Ausgewählte endgültig von der Festplatte löschen",
      sc_lb_nav: "← / →",
      sc_lb_nav_desc: "Vorheriges / nächstes Bild",
      sc_lb_esc: "Esc",
      sc_lb_esc_desc: "Lightbox schließen (oder Pure View beenden)",
      sc_lb_zoom_fit: "0",
      sc_lb_zoom_fit_desc: "Zoom zurücksetzen (Einpassen)",
      sc_lb_zoom_11: "1",
      sc_lb_zoom_11_desc: "Originalgröße (1:1)",
      sc_lb_zoom_step: "+ / - / Mausrad",
      sc_lb_zoom_step_desc: "Hinein- / herauszoomen",
      sc_lb_pure: "H",
      sc_lb_pure_desc: "Pure View (Bedienelemente ausblenden)",
      sc_lb_strip: "T",
      sc_lb_strip_desc: "Filmstreifen ein-/ausblenden",
      sc_lb_purg: "X / Entf",
      sc_lb_purg_desc: "Bild in Purgatory verschieben (bzw. retten)",
      sc_lb_burn: "Shift + X / Shift + Entf",
      sc_lb_burn_desc: "Bild endgültig von der Festplatte löschen",
      batch_clear: "✕ Aufheben",
      empty_media: "Keine Medien gefunden.",
      load_more: "Mehr laden…",
      loading_text: "Bilder werden geladen...",
      tuning_title: "🎛️ Layout & Geometrie",
      btn_reset_layout_title: "Layout zurücksetzen",
      tune_cols: "Spalten",
      tune_width: "Canvas-Breite",
      tune_gap: "Abstand",
      tune_radius: "Eckenradius",
      tune_hover_info: "Hover-Infos auf Kacheln",
      lb_prev_title: "Vorheriges Bild (←)",
      lb_next_title: "Nächstes Bild (→)",
      lb_close_title: "Schließen (Esc)",
      lb_apply: "⚡ Parameter ins Cockpit laden",
      lb_fav: "☆ Favorit",
      lb_fav_active: "★ Favorit",
      lb_to_t2i: "📝 Prompt → T2I",
      lb_to_t2i_title: "Nur den Prompt für T2I ins Image-Modul übernehmen",
      lb_to_i2i: "🖼️ Als I2I-Bild",
      lb_to_i2i_title: "Bild als I2I-Referenz ins Image-Modul übernehmen",
      lb_folder: "📁 Ordner",
      lb_folder_title: "Im Explorer zeigen",
      lb_clean_png: "🧼 Clean PNG",
      lb_clean_png_title: "Metadatenfreies PNG herunterladen",
      lb_rescue: "↩️",
      lb_rescue_title: "Aus Purgatory retten",
      lb_purgatory: "🕯️ Purgatory",
      lb_purgatory_title: "In Purgatory verschieben (X)",
      lb_burn: "🔥 Endgültig löschen",
      lb_burn_title: "Endgültig löschen (Shift+X)",
      lb_delete_title: "Löschen",
      lb_zoom_fit_title: "Einpassen (0)",
      lb_filmstrip_title: "Filmstrip ein/aus (T)",
      lb_pure_title: "Pure View (H)",
      lb_model_seed: "Modell / Seed",
      lb_tech_details: "Technik & LoRAs",
      lb_positive_prompt: "Positiver Prompt",
      lb_additional_prompt: "Zusatz-Prompt",
      lb_negative_prompt: "Negativer Prompt",
      lb_note: "Persönliche Notiz",
      lb_note_ph: "Notiz hinzufügen (suchbar)...",
      lb_note_saved: "Gespeichert",
      card_apply_title: "Parameter ins Cockpit laden",
      card_fav_title: "Favorit umschalten",
      card_select_title: "Auswählen",
      primary_root_prefix: "ComfyUI-Ausgabe",
      root_offline: "(offline)",
      prompt_new_folder: "Name des neuen Unterordners:",
      confirm_delete_title: "Endgültig löschen?",
      confirm_cancel: "Abbrechen",
      confirm_delete_ok: "🔥 Löschen",
      confirm_batch_delete: "{n} ausgewählte Datei(en) endgültig von der Festplatte löschen?",
      confirm_single_delete: '"{name}" endgültig von der Festplatte löschen?',
    },
    en: {
      sidebar_title: "📚 Library",
      btn_add_root: "+ Folder",
      btn_add_root_title: "Mount another folder",
      btn_remove_root_title: "Remove mounted folder",
      btn_rescan_title: "Rescan folder",
      sel_root_title: "Active root folder",
      folder_filter_ph: "🔍 Filter folders...",
      scope_all: "🗂️ All Media",
      scope_fav: "⭐ Favorites",
      scope_root: "📄 (Root)",
      scope_purgatory: "🕯️ Purgatory",
      folders_header: "FOLDERS",
      btn_new_folder: "+ New",
      btn_new_folder_title: "Create new subfolder",
      search_ph: "🔍 Search prompt, model, seed, note or filename...",
      fmt_title: "Format",
      fmt_all: "All Formats",
      fmt_images: "🖼️ Images only",
      fmt_videos: "🎬 Videos only",
      wf_title: "Workflow Filter",
      wf_all: "All Workflows",
      wf_with: "✨ With Prompt/WF",
      wf_without: "📷 No Prompt/WF",
      btn_filter_notes: "📝",
      btn_filter_notes_title: "Only items with personal note",
      sort_title: "Sort order",
      sort_newest: "Newest first",
      sort_oldest: "Oldest first",
      sort_name: "Name (A–Z)",
      mode_masonry: "Masonry",
      mode_grid: "1:1 Grid",
      mode_rows: "Explorer Rows",
      btn_select_mode: "☑ Select",
      btn_select_mode_title: "Multi-select to move / copy / delete (or Ctrl+Click)",
      btn_layout: "🎛️ Layout",
      btn_layout_title: "Show/hide layout & design controls",
      batch_count: "{n} selected",
      batch_target_title: "Target folder",
      batch_move: "📁 Move",
      batch_copy: "📋 Copy",
      batch_rescue: "↩️ Rescue",
      batch_purgatory: "🕯️ Purgatory",
      batch_burn: "🔥 Delete Permanently",
      batch_delete: "🗑️ Delete",
      btn_shortcuts: "⌨️ Shortcuts",
      btn_shortcuts_title: "Show active keyboard shortcuts",
      shortcuts_title: "Gallery Keyboard Shortcuts",
      shortcuts_close: "Close",
      shortcuts_grid: "Gallery Grid",
      shortcuts_lb: "Lightbox (Single View)",
      sc_ctrl_click: "Ctrl + Click",
      sc_ctrl_click_desc: "Select / deselect item",
      sc_grid_purg: "X / Del",
      sc_grid_purg_desc: "Move selected to Purgatory (or rescue)",
      sc_grid_burn: "Shift + X / Shift + Del",
      sc_grid_burn_desc: "Permanently delete selected from disk",
      sc_lb_nav: "← / →",
      sc_lb_nav_desc: "Previous / next image",
      sc_lb_esc: "Esc",
      sc_lb_esc_desc: "Close Lightbox (or exit Pure View)",
      sc_lb_zoom_fit: "0",
      sc_lb_zoom_fit_desc: "Reset zoom (Fit)",
      sc_lb_zoom_11: "1",
      sc_lb_zoom_11_desc: "Original size (1:1)",
      sc_lb_zoom_step: "+ / - / Wheel",
      sc_lb_zoom_step_desc: "Zoom in / out",
      sc_lb_pure: "H",
      sc_lb_pure_desc: "Pure View (hide UI)",
      sc_lb_strip: "T",
      sc_lb_strip_desc: "Toggle filmstrip",
      sc_lb_purg: "X / Del",
      sc_lb_purg_desc: "Move image to Purgatory (or rescue)",
      sc_lb_burn: "Shift + X / Shift + Del",
      sc_lb_burn_desc: "Permanently delete image from disk",
      batch_clear: "✕ Clear",
      empty_media: "No media found.",
      load_more: "Load more…",
      loading_text: "Loading images...",
      tuning_title: "🎛️ Layout & Geometry",
      btn_reset_layout_title: "Reset layout",
      tune_cols: "Columns",
      tune_width: "Canvas Width",
      tune_gap: "Card Gap",
      tune_radius: "Corner Radius",
      tune_hover_info: "Hover info on cards",
      lb_prev_title: "Previous image (←)",
      lb_next_title: "Next image (→)",
      lb_close_title: "Close (Esc)",
      lb_apply: "⚡ Load parameters into Cockpit",
      lb_fav: "☆ Favorite",
      lb_fav_active: "★ Favorite",
      lb_to_t2i: "📝 Prompt → T2I",
      lb_to_t2i_title: "Send prompt only to Images module for T2I",
      lb_to_i2i: "🖼️ Use as I2I",
      lb_to_i2i_title: "Send image as I2I reference to Images module",
      lb_folder: "📁 Folder",
      lb_folder_title: "Show in Explorer",
      lb_clean_png: "🧼 Clean PNG",
      lb_clean_png_title: "Download metadata-stripped PNG",
      lb_rescue: "↩️",
      lb_rescue_title: "Rescue from Purgatory",
      lb_purgatory: "🕯️ Purgatory",
      lb_purgatory_title: "Move to Purgatory (X)",
      lb_burn: "🔥 Delete Permanently",
      lb_burn_title: "Delete permanently (Shift+X)",
      lb_delete_title: "Delete",
      lb_zoom_fit_title: "Fit to view (0)",
      lb_filmstrip_title: "Toggle Filmstrip (T)",
      lb_pure_title: "Pure View (H)",
      lb_model_seed: "Model / Seed",
      lb_tech_details: "Tech & LoRAs",
      lb_positive_prompt: "Positive Prompt",
      lb_additional_prompt: "Additional Prompt",
      lb_negative_prompt: "Negative Prompt",
      lb_note: "Personal Note",
      lb_note_ph: "Add note (searchable)...",
      lb_note_saved: "Saved",
      card_apply_title: "Load parameters into Cockpit",
      card_fav_title: "Toggle favorite",
      card_select_title: "Select",
      primary_root_prefix: "ComfyUI Output",
      root_offline: "(offline)",
      prompt_new_folder: "New subfolder name:",
      confirm_delete_title: "Permanently delete?",
      confirm_cancel: "Cancel",
      confirm_delete_ok: "🔥 Delete",
      confirm_batch_delete: "Permanently delete {n} selected file(s) from disk?",
      confirm_single_delete: 'Permanently delete "{name}" from disk?',
    },
  };

  function getLang() {
    if (document.documentElement.lang === "en") return "en";
    if (document.documentElement.lang === "de") return "de";
    try {
      return localStorage.getItem("tAStudio.language") === "de" ? "de" : "en";
    } catch (_) {
      return "en";
    }
  }

  function gt(key, vars = null) {
    const lang = getLang();
    let s = (GAL_I18N[lang] && GAL_I18N[lang][key] !== undefined)
      ? GAL_I18N[lang][key]
      : (GAL_I18N.de[key] !== undefined ? GAL_I18N.de[key] : key);
    if (vars && typeof vars === "object") {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  }

  function applyGalleryLanguage() {
    document.querySelectorAll("[data-gal-i18n]").forEach((el) => {
      const key = el.getAttribute("data-gal-i18n");
      if (key) el.textContent = gt(key);
    });
    document.querySelectorAll("[data-gal-i18n-ph]").forEach((el) => {
      const key = el.getAttribute("data-gal-i18n-ph");
      if (key) el.placeholder = gt(key);
    });
    document.querySelectorAll("[data-gal-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-gal-i18n-title");
      if (key) el.title = gt(key);
    });

    if ($("galLoadingText")) $("galLoadingText").textContent = gt("loading_text");
    updateBatchBar();
    renderBatchTargetFolders();
    renderRootsSelect();

    document.querySelectorAll("#galGrid .gal-card-apply, #galGrid .gal-row-apply").forEach((btn) => {
      btn.title = gt("card_apply_title");
    });
    document.querySelectorAll("#galGrid .gal-card-fav, #galGrid .gal-row-fav").forEach((btn) => {
      btn.title = gt("card_fav_title");
    });
    document.querySelectorAll("#galGrid .gal-card-select-dot").forEach((btn) => {
      btn.title = gt("card_select_title");
    });

    if (state.lbIndex >= 0 && state.items[state.lbIndex]) {
      const item = state.items[state.lbIndex];
      updateLightboxFavBtn(item);
      const metaEl = $("galLbMetaRow");
      if (metaEl) {
        const dims = item.width ? `${item.width} × ${item.height} · ` : "";
        metaEl.textContent = `${dims}${formatBytes(item.size)} · ${formatDate(item.mtime)}`;
      }
    }
  }

  function openShortcutsModal() {
    const modal = $("galShortcutsModal");
    const body = $("galShortcutsBody");
    const titleEl = $("galShortcutsTitle");
    const okBtn = $("btnGalShortcutsOk");
    if (!modal || !body) return;
    if (titleEl) titleEl.textContent = gt("shortcuts_title");
    if (okBtn) okBtn.textContent = gt("shortcuts_close");

    const sections = [
      {
        heading: gt("shortcuts_grid"),
        rows: [
          [gt("sc_ctrl_click"), gt("sc_ctrl_click_desc")],
          [gt("sc_grid_purg"), gt("sc_grid_purg_desc")],
          [gt("sc_grid_burn"), gt("sc_grid_burn_desc")],
        ],
      },
      {
        heading: gt("shortcuts_lb"),
        rows: [
          [gt("sc_lb_nav"), gt("sc_lb_nav_desc")],
          [gt("sc_lb_esc"), gt("sc_lb_esc_desc")],
          [gt("sc_lb_zoom_fit"), gt("sc_lb_zoom_fit_desc")],
          [gt("sc_lb_zoom_11"), gt("sc_lb_zoom_11_desc")],
          [gt("sc_lb_zoom_step"), gt("sc_lb_zoom_step_desc")],
          [gt("sc_lb_pure"), gt("sc_lb_pure_desc")],
          [gt("sc_lb_strip"), gt("sc_lb_strip_desc")],
          [gt("sc_lb_purg"), gt("sc_lb_purg_desc")],
          [gt("sc_lb_burn"), gt("sc_lb_burn_desc")],
        ],
      },
    ];

    body.innerHTML = "";
    sections.forEach((sec) => {
      const wrap = document.createElement("div");
      wrap.className = "gal-shortcuts-group";
      const h = document.createElement("div");
      h.className = "gal-shortcuts-heading";
      h.textContent = sec.heading;
      wrap.appendChild(h);

      sec.rows.forEach(([keyLabel, desc]) => {
        const row = document.createElement("div");
        row.className = "gal-shortcuts-row";
        const d = document.createElement("span");
        d.className = "gal-shortcuts-desc";
        d.textContent = desc;
        const k = document.createElement("kbd");
        k.className = "gal-kbd";
        k.textContent = keyLabel;
        row.appendChild(d);
        row.appendChild(k);
        wrap.appendChild(row);
      });
      body.appendChild(wrap);
    });

    modal.style.display = "flex";
  }

  function closeShortcutsModal() {
    const modal = $("galShortcutsModal");
    if (modal) modal.style.display = "none";
  }

  function galConfirm(message) {
    const modal = $("galConfirmModal");
    if (!modal) return Promise.resolve(window.confirm(message));
    const titleEl = $("galConfirmTitle");
    const msgEl = $("galConfirmMessage");
    const btnOk = $("btnGalConfirmOk");
    const btnCancel = $("btnGalConfirmCancel");
    const btnClose = $("btnGalConfirmClose");
    if (titleEl) titleEl.textContent = gt("confirm_delete_title");
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) btnCancel.textContent = gt("confirm_cancel");
    if (btnOk) btnOk.textContent = gt("confirm_delete_ok");

    modal.style.display = "flex";
    if (btnCancel) btnCancel.focus();

    return new Promise((resolve) => {
      const cleanup = (result) => {
        modal.style.display = "none";
        btnOk?.removeEventListener("click", onOk);
        btnCancel?.removeEventListener("click", onCancel);
        btnClose?.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKey, true);
        resolve(result);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onBackdrop = (e) => {
        if (e.target === modal) cleanup(false);
      };
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cleanup(false);
        } else if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          cleanup(document.activeElement === btnOk);
        }
      };
      btnOk?.addEventListener("click", onOk);
      btnCancel?.addEventListener("click", onCancel);
      btnClose?.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKey, true);
    });
  }

  const DEFAULT_LAYOUT = {
    mode: "masonry",
    cols: 5,
    width: 100,
    gap: 12,
    radius: 10,
    hoverInfo: true,
    tuningOpen: true,
  };

  function saveGalleryRootPref(rootId) {
    try {
      localStorage.setItem("tAStudio.galleryRoot", rootId || "primary");
    } catch (_) {}
  }

  function loadGalleryRootPref() {
    try {
      return localStorage.getItem("tAStudio.galleryRoot") || "primary";
    } catch (_) {
      return "primary";
    }
  }

  const state = {
    initialized: false,
    root: loadGalleryRootPref(),
    roots: [],
    folder: "",
    favOnly: false,
    purgatoryOnly: false,
    search: "",
    fmt: "all",
    hasWf: "all",
    hasNote: false,
    sort: "newest",
    mode: "masonry",
    layout: { ...DEFAULT_LAYOUT },
    selectMode: false,
    selectedPaths: new Set(),
    offset: 0,
    limit: 120,
    totalFiltered: 0,
    items: [],
    folders: [],
    lbIndex: -1,
    lbZoom: 1,
    lbPanX: 0,
    lbPanY: 0,
    lbPure: false,
    lbFilmstrip: false,
    lbPanning: false,
    lbPanStartX: 0,
    lbPanStartY: 0,
    searchTimer: null,
    fetchSeq: 0,
  };

  function setLoadingOverlay(show) {
    const overlay = $("galLoadingOverlay");
    if (!overlay) return;
    if (show) {
      const txt = $("galLoadingText");
      if (txt) {
        txt.textContent = gt("loading_text");
      }
      overlay.classList.remove("is-hidden");
    } else {
      overlay.classList.add("is-hidden");
    }
  }

  function waitForInitialImages(imgs, timeoutMs = 1500) {
    const pending = imgs.slice(0, 8).filter((img) => img && !img.complete);
    if (pending.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      let remaining = pending.length;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const onSettle = () => {
        remaining -= 1;
        if (remaining <= 0) finish();
      };
      const timer = setTimeout(finish, timeoutMs);
      pending.forEach((img) => {
        img.addEventListener("load", onSettle, { once: true });
        img.addEventListener("error", onSettle, { once: true });
      });
    });
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatDate(ts) {
    if (!ts) return "—";
    try {
      return new Date(ts * 1000).toLocaleString(getLang() === "en" ? "en-US" : "de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (_) {
      return "—";
    }
  }

  async function fetchItems(append = false, existingReqId = null) {
    const reqId = existingReqId || ++state.fetchSeq;
    if (!append) {
      setLoadingOverlay(true);
      state.loadingMore = false;
    }

    if (!append) state.offset = 0;
    const params = new URLSearchParams({
      root: state.root,
      folder: state.folder,
      q: state.search,
      fav: state.favOnly ? "1" : "0",
      purgatory: state.purgatoryOnly ? "1" : "0",
      fmt: state.fmt,
      has_wf: state.hasWf,
      has_note: state.hasNote ? "1" : "0",
      sort: state.sort,
      offset: String(state.offset),
      limit: String(state.limit),
    });

    try {
      const resp = await fetch(`/api/gallery/items?${params.toString()}`);
      if (!resp.ok || reqId !== state.fetchSeq) return;
      const data = await resp.json();
      if (reqId !== state.fetchSeq) return;

      if (Array.isArray(data.roots)) {
        state.roots = data.roots;
        renderRootsSelect();
      }
      state.folders = data.folders || [];
      state.totalFiltered = data.total_filtered || 0;
      if (append) {
        state.items = state.items.concat(data.items || []);
      } else {
        state.items = data.items || [];
        state.selectedPaths.clear();
        updateBatchBar();
      }

      if ($("galCountAll")) $("galCountAll").textContent = String(data.total_all || 0);
      if ($("galCountFav")) $("galCountFav").textContent = String(data.favorites_count || 0);
      if ($("galCountRoot")) $("galCountRoot").textContent = String(data.root_count || 0);
      if ($("galCountPurgatory")) $("galCountPurgatory").textContent = String(data.purgatory_count || 0);
      if ($("galStatsBadge")) {
        $("galStatsBadge").textContent = `${state.items.length} / ${state.totalFiltered}`;
      }

      renderFolderTree();
      renderBatchTargetFolders();
      const renderedImgs = renderGrid(append, data.items || []);

      const loadMoreWrap = $("galLoadMoreWrap");
      if (loadMoreWrap) {
        loadMoreWrap.hidden = state.items.length >= state.totalFiltered;
      }

      if (!append) {
        await waitForInitialImages(renderedImgs);
      }
    } catch (err) {
      console.error("[Gallery] fetchItems error:", err);
    } finally {
      if (reqId === state.fetchSeq && !append) {
        setLoadingOverlay(false);
      }
    }
  }

  async function loadMoreItems() {
    if (state.loadingMore) return;
    if (state.items.length >= state.totalFiltered) return;
    state.loadingMore = true;
    const btn = $("btnGalLoadMore");
    if (btn) btn.disabled = true;
    state.offset += state.limit;
    try {
      await fetchItems(true);
    } finally {
      state.loadingMore = false;
      if (btn) btn.disabled = false;
    }
  }

  function renderRootsSelect() {
    const sel = $("selGalRoot");
    const rmBtn = $("btnGalRemoveRoot");
    if (!sel) return;
    sel.innerHTML = "";
    state.roots.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      const displayName = r.primary
        ? r.name.replace(/^(ComfyUI Output|ComfyUI-Ausgabe)\s*/, `${gt("primary_root_prefix")} `)
        : r.name;
      opt.textContent = r.primary ? `🏠 ${displayName}` : `📂 ${displayName}`;
      if (!r.exists) opt.textContent += ` ${gt("root_offline")}`;
      sel.appendChild(opt);
    });
    if (state.roots.some((r) => r.id === state.root)) {
      sel.value = state.root;
    } else if (state.roots.length > 0) {
      state.root = state.roots[0].id;
      sel.value = state.root;
      saveGalleryRootPref(state.root);
    }
    if (rmBtn) {
      rmBtn.hidden = state.root === "primary";
    }
  }

  function renderBatchTargetFolders() {
    const sel = $("selGalBatchTarget");
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    const rootOpt = document.createElement("option");
    rootOpt.value = "";
    rootOpt.textContent = gt("scope_root");
    sel.appendChild(rootOpt);
    state.folders.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.path;
      opt.textContent = `📁 ${f.path}`;
      sel.appendChild(opt);
    });
    if (prev && Array.from(sel.options).some((o) => o.value === prev)) {
      sel.value = prev;
    }
  }

  function renderFolderTree() {
    const tree = $("galFolderTree");
    if (!tree) return;
    const filterTxt = ($("inpGalFolderFilter")?.value || "").trim().toLowerCase();

    $("btnGalScopeAll")?.classList.toggle("active", !state.favOnly && !state.purgatoryOnly && state.folder === "");
    $("btnGalScopeFav")?.classList.toggle("active", state.favOnly && !state.purgatoryOnly);
    $("btnGalScopeRoot")?.classList.toggle("active", !state.favOnly && !state.purgatoryOnly && state.folder === "__root__");
    $("btnGalScopePurgatory")?.classList.toggle("active", state.purgatoryOnly);

    tree.innerHTML = "";
    state.folders.forEach((f) => {
      if (filterTxt && !f.path.toLowerCase().includes(filterTxt)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-tree-item";
      if (!state.favOnly && state.folder === f.path) btn.classList.add("active");
      btn.style.paddingLeft = `${8 + f.depth * 14}px`;
      btn.title = f.path;

      const nameSpan = document.createElement("span");
      nameSpan.className = "gal-tree-name";
      nameSpan.textContent = `📁 ${f.name}`;

      const countSpan = document.createElement("span");
      countSpan.className = "gal-tree-count";
      countSpan.textContent = String(f.count);

      btn.appendChild(nameSpan);
      btn.appendChild(countSpan);
      btn.addEventListener("click", () => {
        state.favOnly = false;
        state.purgatoryOnly = false;
        state.folder = f.path;
        fetchItems(false);
      });
      tree.appendChild(btn);
    });
  }

  function updateBatchBar() {
    const bar = $("galBatchBar");
    const cnt = $("galBatchCount");
    const n = state.selectedPaths.size;
    if (bar) bar.hidden = n === 0;
    if (cnt) {
      cnt.textContent = gt("batch_count", { n });
    }
    if ($("btnGalBatchRescue")) $("btnGalBatchRescue").hidden = !state.purgatoryOnly;
    if ($("btnGalBatchDelete")) $("btnGalBatchDelete").hidden = state.purgatoryOnly;
  }

  function toggleCardSelection(item, cardEl) {
    if (state.selectedPaths.has(item.path)) {
      state.selectedPaths.delete(item.path);
      cardEl.classList.remove("is-selected");
    } else {
      state.selectedPaths.add(item.path);
      cardEl.classList.add("is-selected");
    }
    updateBatchBar();
  }

  function createCardElement(item, index) {
    const card = document.createElement("div");
    card.className = "gal-card";
    if (state.selectedPaths.has(item.path)) card.classList.add("is-selected");
    card.dataset.index = String(index);

    const isVideo = item.media_type === "video";

    const media = document.createElement("div");
    media.className = "gal-card-media";

    const img = document.createElement("img");
    img.src = item.thumb_url;
    img.alt = item.name;
    img.loading = "lazy";
    img.decoding = "async";
    if (isVideo) {
      img.onerror = () => {
        const vid = document.createElement("video");
        vid.src = item.url;
        vid.preload = "metadata";
        vid.muted = true;
        vid.playsInline = true;
        img.replaceWith(vid);
      };
    }
    media.appendChild(img);

    if (isVideo) {
      const vBadge = document.createElement("span");
      vBadge.className = "gal-video-badge";
      vBadge.textContent = `🎬 ${item.ext.toUpperCase()}`;
      media.appendChild(vBadge);
    } else {
      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "gal-card-apply";
      applyBtn.textContent = "⚡";
      applyBtn.title = gt("card_apply_title");
      applyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window.loadGalleryImageIntoCockpit === "function") {
          window.loadGalleryImageIntoCockpit(item.path, item.root);
        }
      });
      media.appendChild(applyBtn);
    }

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "gal-card-fav" + (item.favorite ? " is-fav" : "");
    favBtn.textContent = item.favorite ? "★" : "☆";
    favBtn.title = gt("card_fav_title");
    favBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleFavorite(item, favBtn);
    });
    media.appendChild(favBtn);

    const selDot = document.createElement("button");
    selDot.type = "button";
    selDot.className = "gal-card-select-dot";
    selDot.textContent = "✓";
    selDot.title = gt("card_select_title");
    selDot.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCardSelection(item, card);
    });
    media.appendChild(selDot);

    if (item.note) {
      const noteBadge = document.createElement("span");
      noteBadge.className = "gal-card-note-badge";
      noteBadge.textContent = "📝";
      noteBadge.title = item.note;
      media.appendChild(noteBadge);
    }

    const overlay = document.createElement("div");
    overlay.className = "gal-card-overlay";
    const nameEl = document.createElement("div");
    nameEl.className = "gal-card-name";
    nameEl.textContent = item.name;
    overlay.appendChild(nameEl);
    if (item.model) {
      const modelEl = document.createElement("div");
      modelEl.className = "gal-card-model";
      modelEl.textContent = item.model;
      overlay.appendChild(modelEl);
    }
    media.appendChild(overlay);
    card.appendChild(media);

    // Explorer Rows details & actions
    const rowInfo = document.createElement("div");
    rowInfo.className = "gal-row-info";
    const rowTop = document.createElement("div");
    rowTop.className = "gal-row-top";
    const rowName = document.createElement("span");
    rowName.className = "gal-row-name";
    rowName.textContent = isVideo ? `🎬 ${item.name}` : item.name;
    const rowMeta = document.createElement("span");
    rowMeta.className = "gal-row-meta";
    const dims = item.width ? `${item.width}×${item.height} · ` : "";
    rowMeta.textContent = `${dims}${formatBytes(item.size)} · ${item.model || item.ext.toUpperCase()}`;
    rowTop.appendChild(rowName);
    rowTop.appendChild(rowMeta);
    const rowPrompt = document.createElement("div");
    rowPrompt.className = "gal-row-prompt";
    rowPrompt.textContent = item.prompt || (item.folder ? `📁 ${item.folder}` : "—");
    rowInfo.appendChild(rowTop);
    rowInfo.appendChild(rowPrompt);
    card.appendChild(rowInfo);

    const rowActions = document.createElement("div");
    rowActions.className = "gal-row-actions";
    if (!isVideo && item.root === "primary") {
      const rowApplyBtn = document.createElement("button");
      rowApplyBtn.type = "button";
      rowApplyBtn.className = "btn-action gal-row-apply";
      rowApplyBtn.style.cssText = "padding:4px 8px; font-size:11px;";
      rowApplyBtn.textContent = "⚡";
      rowApplyBtn.title = gt("card_apply_title");
      rowApplyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window.loadGalleryImageIntoCockpit === "function") {
          window.loadGalleryImageIntoCockpit(item.path, item.root);
        }
      });
      rowActions.appendChild(rowApplyBtn);
    }
    const rowFavBtn = document.createElement("button");
    rowFavBtn.type = "button";
    rowFavBtn.className = "btn-action gal-row-fav";
    rowFavBtn.style.cssText = "padding:4px 8px; font-size:12px;";
    rowFavBtn.textContent = item.favorite ? "★" : "☆";
    rowFavBtn.title = gt("card_fav_title");
    if (item.favorite) rowFavBtn.style.color = "#fbbf24";
    rowFavBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleFavorite(item, favBtn);
      rowFavBtn.textContent = item.favorite ? "★" : "☆";
      rowFavBtn.style.color = item.favorite ? "#fbbf24" : "";
    });
    rowActions.appendChild(rowFavBtn);
    card.appendChild(rowActions);

    card.addEventListener("click", (e) => {
      if (state.selectMode || e.ctrlKey || e.metaKey) {
        toggleCardSelection(item, card);
        return;
      }
      openLightbox(index);
    });
    return card;
  }

  let masonryColHeights = [];

  function renderGrid(append, newItems) {
    const grid = $("galGrid");
    const empty = $("galEmpty");
    if (!grid) return [];

    const isMasonry = state.mode === "masonry";

    if (!append) {
      grid.innerHTML = "";
      masonryColHeights = [];
    }

    if (state.items.length === 0) {
      if (empty) empty.hidden = false;
      return [];
    }
    if (empty) empty.hidden = true;

    const startIdx = append ? state.items.length - newItems.length : 0;
    const listToRender = append ? newItems : state.items;

    if (isMasonry) {
      const colsCount = Math.max(1, parseInt(state.layout.cols, 10) || 5);
      let colEls = Array.from(grid.children).filter((el) => el.classList.contains("gal-masonry-col"));
      if (!append || colEls.length !== colsCount) {
        grid.innerHTML = "";
        colEls = [];
        masonryColHeights = new Array(colsCount).fill(0);
        for (let c = 0; c < colsCount; c++) {
          const col = document.createElement("div");
          col.className = "gal-masonry-col";
          grid.appendChild(col);
          colEls.push(col);
        }
        const frags = colEls.map(() => document.createDocumentFragment());
        state.items.forEach((item, idx) => {
          let targetCol = 0;
          if (idx < colsCount) {
            targetCol = idx;
          } else {
            for (let c = 1; c < colsCount; c++) {
              if (masonryColHeights[c] < masonryColHeights[targetCol]) targetCol = c;
            }
          }
          const ratio = item.width && item.height ? item.height / item.width : 1;
          masonryColHeights[targetCol] += ratio;
          frags[targetCol].appendChild(createCardElement(item, idx));
        });
        colEls.forEach((col, c) => col.appendChild(frags[c]));
        return [];
      }

      const frags = colEls.map(() => document.createDocumentFragment());
      listToRender.forEach((item, i) => {
        const idx = startIdx + i;
        let targetCol = 0;
        if (idx < colsCount) {
          targetCol = idx;
        } else {
          for (let c = 1; c < colsCount; c++) {
            if (masonryColHeights[c] < masonryColHeights[targetCol]) targetCol = c;
          }
        }
        const ratio = item.width && item.height ? item.height / item.width : 1;
        masonryColHeights[targetCol] += ratio;
        frags[targetCol].appendChild(createCardElement(item, idx));
      });
      colEls.forEach((col, c) => col.appendChild(frags[c]));
      return [];
    }

    const frag = document.createDocumentFragment();
    const imgs = [];
    listToRender.forEach((item, i) => {
      const card = createCardElement(item, startIdx + i);
      const img = card.querySelector("img");
      if (img) imgs.push(img);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    return imgs;
  }

  async function toggleFavorite(item, btnEl = null) {
    try {
      const resp = await fetch("/api/gallery/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, path: item.path }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      item.favorite = !!data.favorite;
      if (btnEl) {
        btnEl.classList.toggle("is-fav", item.favorite);
        btnEl.textContent = item.favorite ? "★" : "☆";
      }
      if (state.lbIndex >= 0 && state.items[state.lbIndex]?.path === item.path) {
        updateLightboxFavBtn(item);
      }
      const cntEl = $("galCountFav");
      if (cntEl) {
        const cur = parseInt(cntEl.textContent || "0", 10) || 0;
        cntEl.textContent = String(Math.max(0, cur + (item.favorite ? 1 : -1)));
      }
    } catch (_) {}
  }

  function updateLightboxFavBtn(item) {
    const btn = $("btnGalLbFav");
    if (!btn) return;
    btn.textContent = item.favorite ? gt("lb_fav_active") : gt("lb_fav");
    btn.style.color = item.favorite ? "#fbbf24" : "";
  }

  function applyLbTransform() {
    const canvas = $("galLbCanvas");
    if (!canvas) return;
    canvas.style.transform = `translate(${state.lbPanX}px, ${state.lbPanY}px) scale(${state.lbZoom})`;
    canvas.classList.toggle("is-zoomed", state.lbZoom > 1.01);
    const fitBtn = $("btnGalLbZoomFit");
    if (fitBtn) fitBtn.textContent = `${Math.round(state.lbZoom * 100)}%`;
  }

  function resetLbZoom() {
    state.lbZoom = 1;
    state.lbPanX = 0;
    state.lbPanY = 0;
    state.lbPanning = false;
    applyLbTransform();
  }

  function zoomLbAt(nextScale, clientX = null, clientY = null) {
    const clamped = Math.max(1, Math.min(8, nextScale));
    if (clamped <= 1.01) {
      resetLbZoom();
      return;
    }
    const stage = $("galLightboxStage");
    if (stage && clientX !== null && clientY !== null) {
      const rect = stage.getBoundingClientRect();
      const cx = clientX - (rect.left + rect.width / 2);
      const cy = clientY - (rect.top + rect.height / 2);
      const ratio = clamped / state.lbZoom;
      state.lbPanX = cx - (cx - state.lbPanX) * ratio;
      state.lbPanY = cy - (cy - state.lbPanY) * ratio;
    }
    state.lbZoom = clamped;
    applyLbTransform();
  }

  function setLbZoom11() {
    const imgEl = $("galLbImg");
    if (!imgEl || imgEl.hidden || !imgEl.naturalWidth) return;
    const rect = imgEl.getBoundingClientRect();
    const baseW = rect.width / (state.lbZoom || 1);
    if (baseW <= 0) return;
    const targetScale = Math.max(1, Math.min(8, imgEl.naturalWidth / baseW));
    state.lbZoom = targetScale;
    state.lbPanX = 0;
    state.lbPanY = 0;
    applyLbTransform();
  }

  function toggleLbPure(forceVal = null) {
    const lb = $("galLightbox");
    if (!lb) return;
    state.lbPure = forceVal !== null ? !!forceVal : !state.lbPure;
    lb.classList.toggle("pure-view", state.lbPure);
    $("btnGalLbPure")?.classList.toggle("active", state.lbPure);
  }

  function renderLbFilmstrip() {
    const strip = $("galLbFilmstrip");
    if (!strip) return;
    strip.hidden = !state.lbFilmstrip;
    $("btnGalLbFilmstrip")?.classList.toggle("active", state.lbFilmstrip);
    if (!state.lbFilmstrip) return;
    strip.innerHTML = "";
    state.items.forEach((it, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gal-lb-film-item" + (idx === state.lbIndex ? " active" : "");
      btn.title = it.name;
      const im = document.createElement("img");
      im.src = it.thumb_url;
      im.alt = it.name;
      im.loading = "lazy";
      btn.appendChild(im);
      btn.addEventListener("click", () => openLightbox(idx));
      strip.appendChild(btn);
    });
    const activeBtn = strip.querySelector(".gal-lb-film-item.active");
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  async function saveLbNote() {
    const item = state.items[state.lbIndex];
    const inp = $("galLbNoteInput");
    const statusEl = $("galLbNoteStatus");
    if (!item || !inp) return;
    const val = inp.value.trim();
    if (val === (item.note || "")) return;
    try {
      const resp = await fetch("/api/gallery/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, path: item.path, note: val }),
      });
      if (resp.ok) {
        const data = await resp.json();
        item.note = data.note || "";
        if (statusEl) {
          statusEl.textContent = gt("lb_note_saved");
          setTimeout(() => {
            if ($("galLbNoteStatus")) $("galLbNoteStatus").textContent = "";
          }, 1500);
        }
        renderGrid(false, state.items);
      }
    } catch (_) {}
  }

  async function stageOrRescuePurgatory(paths, action = "stage") {
    if (!paths || paths.length === 0) return false;
    try {
      const resp = await fetch("/api/gallery/purgatory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, paths, action }),
      });
      return resp.ok;
    } catch (_) {
      return false;
    }
  }

  async function burnItems(paths) {
    if (!paths || paths.length === 0) return false;
    try {
      const resp = await fetch("/api/gallery/delete_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, paths }),
      });
      return resp.ok;
    } catch (_) {
      return false;
    }
  }

  function openLightbox(index) {
    if (index < 0 || index >= state.items.length) return;
    state.lbIndex = index;
    const item = state.items[index];
    const lb = $("galLightbox");
    if (!lb) return;

    resetLbZoom();

    const isVideo = item.media_type === "video";
    const imgEl = $("galLbImg");
    const vidEl = $("galLbVideo");

    if (isVideo) {
      if (imgEl) {
        imgEl.hidden = true;
        imgEl.src = "";
      }
      if (vidEl) {
        vidEl.hidden = false;
        vidEl.src = item.url;
        vidEl.play().catch(() => {});
      }
    } else {
      if (vidEl) {
        vidEl.pause();
        vidEl.removeAttribute("src");
        vidEl.hidden = true;
      }
      if (imgEl) {
        imgEl.hidden = false;
        imgEl.src = item.url;
        imgEl.alt = item.name;
      }
    }

    if ($("galLbZoomBar")) $("galLbZoomBar").hidden = isVideo;
    if ($("btnGalLbApply")) {
      $("btnGalLbApply").hidden = isVideo;
    }
    if ($("btnGalLbToT2I")) {
      $("btnGalLbToT2I").hidden = !item.prompt;
    }
    if ($("btnGalLbToI2I")) {
      $("btnGalLbToI2I").hidden = isVideo;
    }
    if ($("btnGalLbGif")) {
      $("btnGalLbGif").hidden = isVideo;
    }
    if ($("btnGalLbVideoBtn")) {
      $("btnGalLbVideoBtn").hidden = isVideo;
    }
    if ($("btnGalLbCleanPng")) {
      $("btnGalLbCleanPng").hidden = isVideo;
    }
    if ($("btnGalLbRescue")) {
      $("btnGalLbRescue").hidden = !item.purgatory;
    }
    if ($("btnGalLbDelete")) {
      $("btnGalLbDelete").hidden = !!item.purgatory;
    }

    $("galLbFilename").textContent = item.name;
    const dims = item.width ? `${item.width} × ${item.height} · ` : "";
    $("galLbMetaRow").textContent = `${dims}${formatBytes(item.size)} · ${formatDate(item.mtime)}`;
    $("galLbModelSeed").textContent = `${item.model || "—"}  |  Seed: ${item.seed ?? "—"}`;
    $("galLbPrompt").textContent = item.prompt || "—";

    const techWrap = $("galLbTechWrap");
    const techChips = $("galLbTechChips");
    if (techWrap && techChips) {
      techChips.innerHTML = "";
      const chips = [];
      if (item.sampler) chips.push({ text: `Sampler: ${item.sampler}`, lora: false });
      if (item.scheduler) chips.push({ text: `Sched: ${item.scheduler}`, lora: false });
      if (item.steps !== null && item.steps !== undefined) chips.push({ text: `Steps: ${item.steps}`, lora: false });
      if (item.cfg !== null && item.cfg !== undefined) chips.push({ text: `CFG: ${item.cfg}`, lora: false });
      if (item.vae) chips.push({ text: `VAE: ${item.vae}`, lora: false });
      if (Array.isArray(item.loras)) {
        item.loras.forEach((l) => {
          if (l && l.name) chips.push({ text: `LoRA: ${l.name} (${l.weight ?? 1})`, lora: true });
        });
      }
      techWrap.hidden = chips.length === 0;
      chips.forEach((c) => {
        const span = document.createElement("span");
        span.className = "gal-lb-tech-chip" + (c.lora ? " is-lora" : "");
        span.textContent = c.text;
        techChips.appendChild(span);
      });
    }

    const addWrap = $("galLbAddWrap");
    if (addWrap) {
      addWrap.hidden = !item.additional_prompt;
      $("galLbAddPrompt").textContent = item.additional_prompt || "";
    }
    const negWrap = $("galLbNegWrap");
    if (negWrap) {
      negWrap.hidden = !item.neg_prompt;
      $("galLbNegPrompt").textContent = item.neg_prompt || "";
    }
    if ($("galLbNoteInput")) {
      $("galLbNoteInput").value = item.note || "";
    }
    if ($("galLbNoteStatus")) {
      $("galLbNoteStatus").textContent = "";
    }

    updateLightboxFavBtn(item);
    renderLbFilmstrip();
    lb.hidden = false;
  }

  function closeLightbox() {
    saveLbNote();
    toggleLbPure(false);
    resetLbZoom();
    const lb = $("galLightbox");
    if (lb) lb.hidden = true;
    const vidEl = $("galLbVideo");
    if (vidEl) {
      vidEl.pause();
      vidEl.removeAttribute("src");
      vidEl.hidden = true;
    }
    state.lbIndex = -1;
  }

  function bindEvents() {
    $("selGalRoot")?.addEventListener("change", (e) => {
      state.root = e.target.value;
      saveGalleryRootPref(state.root);
      state.folder = "";
      state.favOnly = false;
      state.purgatoryOnly = false;
      renderRootsSelect();
      fetchItems(false);
    });

    $("btnGalAddRoot")?.addEventListener("click", async () => {
      try {
        const bResp = await fetch("/api/browse_folder");
        if (!bResp.ok) return;
        const bData = await bResp.json();
        const folderPath = (bData.path || "").trim();
        if (!folderPath) return;
        const aResp = await fetch("/api/gallery/roots/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: folderPath }),
        });
        const aData = await aResp.json();
        if (aData.ok && aData.id) {
          state.root = aData.id;
          saveGalleryRootPref(state.root);
          state.folder = "";
          state.favOnly = false;
        }
        await fetchItems(false);
      } catch (_) {}
    });

    $("btnGalRemoveRoot")?.addEventListener("click", async () => {
      if (state.root === "primary") return;
      const resp = await fetch("/api/gallery/roots/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: state.root }),
      });
      if (resp.ok) {
        state.root = "primary";
        saveGalleryRootPref(state.root);
        state.folder = "";
        await fetchItems(false);
      }
    });

    $("btnGalNewFolder")?.addEventListener("click", async () => {
      const promptTxt = gt("prompt_new_folder");
      const name = window.prompt(promptTxt);
      if (!name || !name.trim()) return;
      const parent = state.folder && state.folder !== "__root__" ? state.folder : "";
      const resp = await fetch("/api/gallery/create_folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, parent, name: name.trim() }),
      });
      if (resp.ok) {
        await fetchItems(false);
      }
    });

    $("btnGalRescan")?.addEventListener("click", async () => {
      const reqId = ++state.fetchSeq;
      setLoadingOverlay(true);
      try {
        await fetch("/api/gallery/rescan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ root: state.root }),
        });
      } catch (_) {}
      if (reqId === state.fetchSeq) {
        await fetchItems(false, reqId);
      }
    });

    $("inpGalFolderFilter")?.addEventListener("input", () => renderFolderTree());

    $("btnGalScopeAll")?.addEventListener("click", () => {
      state.favOnly = false;
      state.purgatoryOnly = false;
      state.folder = "";
      fetchItems(false);
    });
    $("btnGalScopeFav")?.addEventListener("click", () => {
      state.favOnly = true;
      state.purgatoryOnly = false;
      state.folder = "";
      fetchItems(false);
    });
    $("btnGalScopeRoot")?.addEventListener("click", () => {
      state.favOnly = false;
      state.purgatoryOnly = false;
      state.folder = "__root__";
      fetchItems(false);
    });
    $("btnGalScopePurgatory")?.addEventListener("click", () => {
      state.favOnly = false;
      state.purgatoryOnly = true;
      state.folder = "";
      fetchItems(false);
    });

    $("inpGalSearch")?.addEventListener("input", (e) => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        state.search = e.target.value;
        fetchItems(false);
      }, 220);
    });

    $("selGalFormat")?.addEventListener("change", (e) => {
      state.fmt = e.target.value;
      fetchItems(false);
    });
    $("selGalWorkflow")?.addEventListener("change", (e) => {
      state.hasWf = e.target.value;
      fetchItems(false);
    });
    $("btnGalFilterNotes")?.addEventListener("click", () => {
      state.hasNote = !state.hasNote;
      $("btnGalFilterNotes")?.classList.toggle("active", state.hasNote);
      fetchItems(false);
    });
    $("selGalSort")?.addEventListener("change", (e) => {
      state.sort = e.target.value;
      fetchItems(false);
    });

    $("btnGalModeMasonry")?.addEventListener("click", () => setViewMode("masonry"));
    $("btnGalModeGrid")?.addEventListener("click", () => setViewMode("grid"));
    $("btnGalModeRows")?.addEventListener("click", () => setViewMode("rows"));

    $("btnGalSelectMode")?.addEventListener("click", () => {
      state.selectMode = !state.selectMode;
      $("btnGalSelectMode")?.classList.toggle("active", state.selectMode);
      $("galGrid")?.classList.toggle("select-mode", state.selectMode);
      if (!state.selectMode) {
        state.selectedPaths.clear();
        document.querySelectorAll(".gal-card.is-selected").forEach((c) => c.classList.remove("is-selected"));
        updateBatchBar();
      }
    });

    $("btnGalBatchClear")?.addEventListener("click", () => {
      state.selectedPaths.clear();
      document.querySelectorAll(".gal-card.is-selected").forEach((c) => c.classList.remove("is-selected"));
      updateBatchBar();
    });

    $("btnGalBatchMove")?.addEventListener("click", async () => {
      if (state.selectedPaths.size === 0) return;
      const target = $("selGalBatchTarget")?.value || "";
      const resp = await fetch("/api/gallery/move_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, paths: Array.from(state.selectedPaths), target_folder: target }),
      });
      if (resp.ok) await fetchItems(false);
    });

    $("btnGalBatchCopy")?.addEventListener("click", async () => {
      if (state.selectedPaths.size === 0) return;
      const target = $("selGalBatchTarget")?.value || "";
      const resp = await fetch("/api/gallery/copy_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, paths: Array.from(state.selectedPaths), target_folder: target }),
      });
      if (resp.ok) {
        state.selectedPaths.clear();
        await fetchItems(false);
      }
    });

    $("btnGalBatchRescue")?.addEventListener("click", async () => {
      if (state.selectedPaths.size === 0) return;
      if (await stageOrRescuePurgatory(Array.from(state.selectedPaths), "rescue")) {
        await fetchItems(false);
      }
    });

    $("btnGalBatchDelete")?.addEventListener("click", async () => {
      const n = state.selectedPaths.size;
      if (n === 0) return;
      if (await stageOrRescuePurgatory(Array.from(state.selectedPaths), "stage")) {
        await fetchItems(false);
      }
    });

    $("btnGalBatchBurn")?.addEventListener("click", async () => {
      const n = state.selectedPaths.size;
      if (n === 0) return;
      const msg = gt("confirm_batch_delete", { n });
      if (!(await galConfirm(msg))) return;
      if (await burnItems(Array.from(state.selectedPaths))) {
        await fetchItems(false);
      }
    });

    $("btnGalToggleTuning")?.addEventListener("click", () => {
      state.layout.tuningOpen = !state.layout.tuningOpen;
      applyLayoutToDOM(true);
    });
    $("btnGalShortcuts")?.addEventListener("click", () => openShortcutsModal());
    $("btnGalShortcutsClose")?.addEventListener("click", closeShortcutsModal);
    $("btnGalShortcutsOk")?.addEventListener("click", closeShortcutsModal);
    $("galShortcutsModal")?.addEventListener("click", (e) => {
      if (e.target === $("galShortcutsModal")) closeShortcutsModal();
    });
    $("btnGalResetLayout")?.addEventListener("click", () => {
      state.layout = { ...DEFAULT_LAYOUT, tuningOpen: state.layout.tuningOpen };
      setViewMode(state.layout.mode);
      applyLayoutToDOM(true);
    });
    $("rngGalCols")?.addEventListener("input", (e) => {
      state.layout.cols = parseInt(e.target.value, 10) || 5;
      applyLayoutToDOM(true);
      if (state.mode === "masonry") renderGrid(false, state.items);
    });
    $("rngGalWidth")?.addEventListener("input", (e) => {
      state.layout.width = parseInt(e.target.value, 10) || 100;
      applyLayoutToDOM(true);
    });
    $("rngGalGap")?.addEventListener("input", (e) => {
      state.layout.gap = parseInt(e.target.value, 10) || 12;
      applyLayoutToDOM(true);
    });
    $("rngGalRadius")?.addEventListener("input", (e) => {
      state.layout.radius = parseInt(e.target.value, 10);
      if (Number.isNaN(state.layout.radius)) state.layout.radius = 10;
      applyLayoutToDOM(true);
    });
    $("chkGalHoverInfo")?.addEventListener("change", (e) => {
      state.layout.hoverInfo = !!e.target.checked;
      applyLayoutToDOM(true);
    });

    $("btnGalLoadMore")?.addEventListener("click", () => {
      loadMoreItems();
    });

    const loadMoreWrap = $("galLoadMoreWrap");
    const galStage = $("galStage");
    if (loadMoreWrap && galStage && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            loadMoreItems();
          }
        },
        { root: galStage, rootMargin: "0px 0px 450px 0px", threshold: 0.01 }
      );
      io.observe(loadMoreWrap);
    }

    // Lightbox events
    $("btnGalLbClose")?.addEventListener("click", closeLightbox);
    $("galLightboxBackdrop")?.addEventListener("click", closeLightbox);
    $("btnGalLbPrev")?.addEventListener("click", () => {
      if (state.lbIndex > 0) openLightbox(state.lbIndex - 1);
    });
    $("btnGalLbNext")?.addEventListener("click", () => {
      if (state.lbIndex < state.items.length - 1) openLightbox(state.lbIndex + 1);
    });

    $("btnGalLbFav")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      const cardBtn = document.querySelector(`.gal-card[data-index="${state.lbIndex}"] .gal-card-fav`);
      await toggleFavorite(item, cardBtn);
    });

    $("btnGalLbFolder")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      await fetch("/api/gallery/open_folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, path: item.path }),
      });
    });

    $("btnGalLbApply")?.addEventListener("click", () => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      closeLightbox();
      if (typeof window.loadGalleryImageIntoCockpit === "function") {
        window.loadGalleryImageIntoCockpit(item.path, item.root);
      }
    });

    $("btnGalLbToT2I")?.addEventListener("click", () => {
      const item = state.items[state.lbIndex];
      if (!item || !item.prompt) return;
      closeLightbox();
      if (typeof window.loadGalleryPromptForT2I === "function") {
        window.loadGalleryPromptForT2I(item.prompt, item.neg_prompt || "", item.additional_prompt || "");
      }
    });

    $("btnGalLbToI2I")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      closeLightbox();
      if (typeof window.loadGalleryImageAsI2I === "function") {
        await window.loadGalleryImageAsI2I(item.url, item.name);
      }
    });

    $("btnGalLbGif")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      try {
        const resp = await fetch(item.url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          closeLightbox();
          if (typeof window.switchStudioModule === "function") {
            window.switchStudioModule("gif");
          }
          setTimeout(() => {
            const gifImg = $("gifAiSourcePreview");
            if (gifImg) {
              gifImg.src = e.target.result;
              gifImg.style.display = "block";
            }
          }, 120);
        };
        reader.readAsDataURL(blob);
      } catch (_) {}
    });

    $("btnGalLbVideoBtn")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      closeLightbox();
      if (typeof window.sendImageToVideoMaker === "function") {
        await window.sendImageToVideoMaker(item.url || item.path, "quick");
      }
    });

    $("btnGalLbCleanPng")?.addEventListener("click", () => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      const rQ = encodeURIComponent(state.root);
      const pQ = encodeURIComponent(item.path);
      const a = document.createElement("a");
      a.href = `/api/gallery/clean_png?root=${rQ}&path=${pQ}`;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    $("btnGalLbRescue")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      if (await stageOrRescuePurgatory([item.path], "rescue")) {
        closeLightbox();
        await fetchItems(false);
      }
    });

    $("btnGalLbDelete")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      if (await stageOrRescuePurgatory([item.path], "stage")) {
        closeLightbox();
        await fetchItems(false);
      }
    });

    $("btnGalLbBurn")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      const msg = gt("confirm_single_delete", { name: item.name });
      if (!(await galConfirm(msg))) return;
      if (await burnItems([item.path])) {
        closeLightbox();
        await fetchItems(false);
      }
    });

    $("galLbNoteInput")?.addEventListener("blur", () => saveLbNote());
    $("galLbNoteInput")?.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        saveLbNote();
      }
    });

    $("btnGalLbZoomIn")?.addEventListener("click", () => zoomLbAt(state.lbZoom * 1.35));
    $("btnGalLbZoomOut")?.addEventListener("click", () => zoomLbAt(state.lbZoom / 1.35));
    $("btnGalLbZoomFit")?.addEventListener("click", resetLbZoom);
    $("btnGalLbZoom11")?.addEventListener("click", setLbZoom11);
    $("btnGalLbPure")?.addEventListener("click", () => toggleLbPure());
    $("btnGalLbFilmstrip")?.addEventListener("click", () => {
      state.lbFilmstrip = !state.lbFilmstrip;
      renderLbFilmstrip();
    });

    const stage = $("galLightboxStage");
    const canvas = $("galLbCanvas");
    stage?.addEventListener("wheel", (e) => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      zoomLbAt(state.lbZoom * factor, e.clientX, e.clientY);
    }, { passive: false });

    canvas?.addEventListener("dblclick", (e) => {
      const item = state.items[state.lbIndex];
      if (!item || item.media_type === "video") return;
      if (state.lbZoom > 1.05) resetLbZoom();
      else zoomLbAt(2.5, e.clientX, e.clientY);
    });

    canvas?.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || state.lbZoom <= 1.01) return;
      state.lbPanning = true;
      state.lbPanStartX = e.clientX - state.lbPanX;
      state.lbPanStartY = e.clientY - state.lbPanY;
      canvas.classList.add("is-panning");
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!state.lbPanning) return;
      state.lbPanX = e.clientX - state.lbPanStartX;
      state.lbPanY = e.clientY - state.lbPanStartY;
      applyLbTransform();
    });

    window.addEventListener("mouseup", () => {
      if (!state.lbPanning) return;
      state.lbPanning = false;
      $("galLbCanvas")?.classList.remove("is-panning");
    });

    document.addEventListener("keydown", async (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const scModal = $("galShortcutsModal");
      if (scModal && scModal.style.display !== "none") {
        if (e.key === "Escape") closeShortcutsModal();
        return;
      }

      const lb = $("galLightbox");
      if (lb && !lb.hidden) {
        if (e.key === "Escape") {
          if (state.lbPure) toggleLbPure(false);
          else closeLightbox();
        } else if (e.key === "ArrowLeft" && state.lbIndex > 0) {
          openLightbox(state.lbIndex - 1);
        } else if (e.key === "ArrowRight" && state.lbIndex < state.items.length - 1) {
          openLightbox(state.lbIndex + 1);
        } else if (e.key === "0") {
          resetLbZoom();
        } else if (e.key === "1") {
          setLbZoom11();
        } else if (e.key === "+" || e.key === "=") {
          zoomLbAt(state.lbZoom * 1.35);
        } else if (e.key === "-") {
          zoomLbAt(state.lbZoom / 1.35);
        } else if (e.key === "h" || e.key === "H") {
          toggleLbPure();
        } else if (e.key === "t" || e.key === "T") {
          state.lbFilmstrip = !state.lbFilmstrip;
          renderLbFilmstrip();
        } else if (e.key === "x" || e.key === "X" || e.key === "Delete") {
          const item = state.items[state.lbIndex];
          if (!item) return;
          if (e.shiftKey) {
            if (await galConfirm(gt("confirm_single_delete", { name: item.name }))) {
              if (await burnItems([item.path])) {
                closeLightbox();
                await fetchItems(false);
              }
            }
          } else {
            const act = item.purgatory ? "rescue" : "stage";
            if (await stageOrRescuePurgatory([item.path], act)) {
              closeLightbox();
              await fetchItems(false);
            }
          }
        }
        return;
      }

      // Gallery grid shortcuts when gallery view is visible and items selected
      const galView = $("moduleGalleryView");
      if (galView && galView.style.display !== "none" && state.selectedPaths.size > 0) {
        if (e.key === "x" || e.key === "X" || e.key === "Delete") {
          const paths = Array.from(state.selectedPaths);
          if (e.shiftKey) {
            if (await galConfirm(gt("confirm_batch_delete", { n: paths.length }))) {
              if (await burnItems(paths)) await fetchItems(false);
            }
          } else {
            const act = state.purgatoryOnly ? "rescue" : "stage";
            if (await stageOrRescuePurgatory(paths, act)) await fetchItems(false);
          }
        }
      }
    });
  }

  function loadLayoutSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem("tAStudio.galleryLayout") || "null");
      if (saved && typeof saved === "object") {
        state.layout = { ...DEFAULT_LAYOUT, ...saved };
      }
    } catch (_) {}
    setViewMode(state.layout.mode || "masonry", false);
    applyLayoutToDOM(false);
  }

  function applyLayoutToDOM(persist = false) {
    const view = $("moduleGalleryView");
    const l = state.layout;
    if (view) {
      view.style.setProperty("--gal-cols", String(l.cols));
      view.style.setProperty("--gal-width", `${l.width}%`);
      view.style.setProperty("--gal-gap", `${l.gap}px`);
      view.style.setProperty("--gal-radius", `${l.radius}px`);
    }
    if ($("rngGalCols")) $("rngGalCols").value = String(l.cols);
    if ($("valGalCols")) $("valGalCols").textContent = String(l.cols);
    if ($("rngGalWidth")) $("rngGalWidth").value = String(l.width);
    if ($("valGalWidth")) $("valGalWidth").textContent = `${l.width}%`;
    if ($("rngGalGap")) $("rngGalGap").value = String(l.gap);
    if ($("valGalGap")) $("valGalGap").textContent = `${l.gap}px`;
    if ($("rngGalRadius")) $("rngGalRadius").value = String(l.radius);
    if ($("valGalRadius")) $("valGalRadius").textContent = `${l.radius}px`;
    if ($("chkGalHoverInfo")) $("chkGalHoverInfo").checked = !!l.hoverInfo;
    if ($("galGrid")) $("galGrid").classList.toggle("hide-hover-info", !l.hoverInfo);

    const sidebar = $("galTuningSidebar");
    const toggleBtn = $("btnGalToggleTuning");
    if (sidebar) sidebar.hidden = !l.tuningOpen;
    if (toggleBtn) toggleBtn.classList.toggle("active", !!l.tuningOpen);

    if (persist) {
      try {
        localStorage.setItem("tAStudio.galleryLayout", JSON.stringify(l));
      } catch (_) {}
    }
  }

  function setViewMode(mode, persist = true) {
    const valid = mode === "grid" || mode === "rows" ? mode : "masonry";
    state.mode = valid;
    state.layout.mode = valid;
    const grid = $("galGrid");
    if (grid) {
      grid.classList.toggle("mode-masonry", valid === "masonry");
      grid.classList.toggle("mode-grid", valid === "grid");
      grid.classList.toggle("mode-rows", valid === "rows");
    }
    $("btnGalModeMasonry")?.classList.toggle("active", valid === "masonry");
    $("btnGalModeGrid")?.classList.toggle("active", valid === "grid");
    $("btnGalModeRows")?.classList.toggle("active", valid === "rows");
    if (persist) {
      try {
        localStorage.setItem("tAStudio.galleryLayout", JSON.stringify(state.layout));
      } catch (_) {}
    }
    if (state.items.length > 0) {
      renderGrid(false, state.items);
    }
  }

  function initGallery() {
    if (!state.initialized) {
      state.initialized = true;
      loadLayoutSettings();
      bindEvents();
    }
    applyGalleryLanguage();
    fetchItems(false);
  }

  window.addEventListener("studio-language-changed", () => applyGalleryLanguage());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyGalleryLanguage());
  } else {
    applyGalleryLanguage();
  }

  window.addEventListener("studio-module-changed", (e) => {
    if (e.detail?.module === "gallery") {
      initGallery();
    }
  });
})();
