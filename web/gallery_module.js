/* =====================================================================
 * Gallery Module (Stufe 1 + 2 + 3A) for thomo.ART StudioCockpit
 * ===================================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const DEFAULT_LAYOUT = {
    mode: "masonry",
    cols: 5,
    width: 100,
    gap: 12,
    radius: 10,
    hoverInfo: true,
    tuningOpen: true,
  };

  const state = {
    initialized: false,
    root: "primary",
    roots: [],
    folder: "",
    favOnly: false,
    search: "",
    fmt: "all",
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
    searchTimer: null,
    fetchSeq: 0,
  };

  function setLoadingOverlay(show) {
    const overlay = $("galLoadingOverlay");
    if (!overlay) return;
    if (show) {
      const txt = $("galLoadingText");
      if (txt) {
        txt.textContent = getLang() === "en" ? "Loading images..." : "Bilder werden geladen...";
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

  function getLang() {
    return document.documentElement.lang === "en" ? "en" : "de";
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
    setLoadingOverlay(true);

    if (!append) state.offset = 0;
    const params = new URLSearchParams({
      root: state.root,
      folder: state.folder,
      q: state.search,
      fav: state.favOnly ? "1" : "0",
      fmt: state.fmt,
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

      await waitForInitialImages(renderedImgs);
    } catch (err) {
      console.error("[Gallery] fetchItems error:", err);
    } finally {
      if (reqId === state.fetchSeq) {
        setLoadingOverlay(false);
      }
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
      opt.textContent = r.primary ? `🏠 ${r.name}` : `📂 ${r.name}`;
      if (!r.exists) opt.textContent += " (offline)";
      sel.appendChild(opt);
    });
    if (state.roots.some((r) => r.id === state.root)) {
      sel.value = state.root;
    } else if (state.roots.length > 0) {
      state.root = state.roots[0].id;
      sel.value = state.root;
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
    rootOpt.textContent = "📄 (Root)";
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

    $("btnGalScopeAll")?.classList.toggle("active", !state.favOnly && state.folder === "");
    $("btnGalScopeFav")?.classList.toggle("active", state.favOnly);
    $("btnGalScopeRoot")?.classList.toggle("active", !state.favOnly && state.folder === "__root__");

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
      cnt.textContent = getLang() === "en" ? `${n} selected` : `${n} ausgewählt`;
    }
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
      applyBtn.title = getLang() === "en" ? "Load parameters into Cockpit" : "Parameter ins Cockpit laden";
      applyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (item.root === "primary" && typeof window.loadGalleryImageIntoCockpit === "function") {
          window.loadGalleryImageIntoCockpit(item.path);
        }
      });
      if (item.root === "primary") {
        media.appendChild(applyBtn);
      }
    }

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "gal-card-fav" + (item.favorite ? " is-fav" : "");
    favBtn.textContent = item.favorite ? "★" : "☆";
    favBtn.title = getLang() === "en" ? "Toggle favorite" : "Favorit umschalten";
    favBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleFavorite(item, favBtn);
    });
    media.appendChild(favBtn);

    const selDot = document.createElement("button");
    selDot.type = "button";
    selDot.className = "gal-card-select-dot";
    selDot.textContent = "✓";
    selDot.title = getLang() === "en" ? "Select" : "Auswählen";
    selDot.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCardSelection(item, card);
    });
    media.appendChild(selDot);

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
      rowApplyBtn.className = "btn-action";
      rowApplyBtn.style.cssText = "padding:4px 8px; font-size:11px;";
      rowApplyBtn.textContent = "⚡";
      rowApplyBtn.title = getLang() === "en" ? "Load parameters into Cockpit" : "Parameter ins Cockpit laden";
      rowApplyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window.loadGalleryImageIntoCockpit === "function") {
          window.loadGalleryImageIntoCockpit(item.path);
        }
      });
      rowActions.appendChild(rowApplyBtn);
    }
    const rowFavBtn = document.createElement("button");
    rowFavBtn.type = "button";
    rowFavBtn.className = "btn-action";
    rowFavBtn.style.cssText = "padding:4px 8px; font-size:12px;";
    rowFavBtn.textContent = item.favorite ? "★" : "☆";
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

  function renderGrid(append, newItems) {
    const grid = $("galGrid");
    const empty = $("galEmpty");
    if (!grid) return [];

    if (!append) {
      grid.innerHTML = "";
    }

    if (state.items.length === 0) {
      if (empty) empty.hidden = false;
      return [];
    }
    if (empty) empty.hidden = true;

    const startIdx = append ? state.items.length - newItems.length : 0;
    const listToRender = append ? newItems : state.items;
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
    btn.textContent = item.favorite ? "★ Favorit" : "☆ Favorit";
    btn.style.color = item.favorite ? "#fbbf24" : "";
  }

  function openLightbox(index) {
    if (index < 0 || index >= state.items.length) return;
    state.lbIndex = index;
    const item = state.items[index];
    const lb = $("galLightbox");
    if (!lb) return;

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

    if ($("btnGalLbApply")) {
      $("btnGalLbApply").hidden = isVideo || item.root !== "primary";
    }
    if ($("btnGalLbGif")) {
      $("btnGalLbGif").hidden = isVideo;
    }

    $("galLbFilename").textContent = item.name;
    const dims = item.width ? `${item.width} × ${item.height} · ` : "";
    $("galLbMetaRow").textContent = `${dims}${formatBytes(item.size)} · ${formatDate(item.mtime)}`;
    $("galLbModelSeed").textContent = `${item.model || "—"}  |  Seed: ${item.seed ?? "—"}`;
    $("galLbPrompt").textContent = item.prompt || "—";

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

    updateLightboxFavBtn(item);
    lb.hidden = false;
  }

  function closeLightbox() {
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
      state.folder = "";
      state.favOnly = false;
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
        state.folder = "";
        await fetchItems(false);
      }
    });

    $("btnGalNewFolder")?.addEventListener("click", async () => {
      const promptTxt = getLang() === "en" ? "New subfolder name:" : "Name des neuen Unterordners:";
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
      state.folder = "";
      fetchItems(false);
    });
    $("btnGalScopeFav")?.addEventListener("click", () => {
      state.favOnly = true;
      state.folder = "";
      fetchItems(false);
    });
    $("btnGalScopeRoot")?.addEventListener("click", () => {
      state.favOnly = false;
      state.folder = "__root__";
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

    $("btnGalBatchDelete")?.addEventListener("click", async () => {
      const n = state.selectedPaths.size;
      if (n === 0) return;
      const msg = getLang() === "en"
        ? `Permanently delete ${n} selected file(s) from disk?`
        : `${n} ausgewählte Datei(en) endgültig von der Festplatte löschen?`;
      if (!window.confirm(msg)) return;
      const resp = await fetch("/api/gallery/delete_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: state.root, paths: Array.from(state.selectedPaths) }),
      });
      if (resp.ok) await fetchItems(false);
    });

    $("btnGalToggleTuning")?.addEventListener("click", () => {
      state.layout.tuningOpen = !state.layout.tuningOpen;
      applyLayoutToDOM(true);
    });
    $("btnGalResetLayout")?.addEventListener("click", () => {
      state.layout = { ...DEFAULT_LAYOUT, tuningOpen: state.layout.tuningOpen };
      setViewMode(state.layout.mode);
      applyLayoutToDOM(true);
    });
    $("rngGalCols")?.addEventListener("input", (e) => {
      state.layout.cols = parseInt(e.target.value, 10) || 5;
      applyLayoutToDOM(true);
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
      state.offset += state.limit;
      fetchItems(true);
    });

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
      if (item.root === "primary" && typeof window.loadGalleryImageIntoCockpit === "function") {
        window.loadGalleryImageIntoCockpit(item.path);
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

    $("btnGalLbDelete")?.addEventListener("click", async () => {
      const item = state.items[state.lbIndex];
      if (!item) return;
      const msg = getLang() === "en"
        ? `Permanently delete "${item.name}" from disk?`
        : `"${item.name}" endgültig von der Festplatte löschen?`;
      if (!window.confirm(msg)) return;
      try {
        const resp = await fetch("/api/gallery/delete_items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ root: state.root, paths: [item.path] }),
        });
        if (resp.ok) {
          closeLightbox();
          await fetchItems(false);
        }
      } catch (_) {}
    });

    document.addEventListener("keydown", (e) => {
      const lb = $("galLightbox");
      if (!lb || lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft" && state.lbIndex > 0) openLightbox(state.lbIndex - 1);
      else if (e.key === "ArrowRight" && state.lbIndex < state.items.length - 1) openLightbox(state.lbIndex + 1);
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
  }

  function initGallery() {
    if (!state.initialized) {
      state.initialized = true;
      loadLayoutSettings();
      bindEvents();
    }
    fetchItems(false);
  }

  window.addEventListener("studio-module-changed", (e) => {
    if (e.detail?.module === "gallery") {
      initGallery();
    }
  });
})();
