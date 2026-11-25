# tA-Studio-Cockpit – Analyseergebnisse

Reichweite: gesamtes Projekt ohne Build-/Abhängigkeitsordner (`.git`, `node_modules`, `dist`, `build`, `venv`, `extern_resources`).

## KRITISCH
- `server.py:3698–3709` – `handle_bg_remove`: `rel_dir` aus POST-`filename` ohne Within-Check → Pfadtraversal-/arbitrary Write unterhalb/außerhalb `output_dir` (Lesezugriff 3580 abgesichert, Schreibpfad nicht).
- `modules/music_maker/music_service.py:2761–2765` (`/api/open_file`) & `:2756–2759` (`/api/reveal_file`) – `body["path"]` ungeprüft → `os.startfile`/`explorer /select` auf beliebigen Pfad → lokale Codeausführung.
- `server.py:3759–3761` & `:3774–3776` – `_install_single_pack`: `custom_nodes_dir`/`comfy_dir` (POST) unescaped in `bash -l -c`-f-String → Shell-Befehlsinjektion.
- `server.py:3848` – `zf.extractall(custom_nodes_dir)` ohne Zip-Slip-Schutz → Schreiben außerhalb des Zielordners.
- `modules/video_maker.py:844–851` – `adopt_studio_image`: `body["url"]`/`qs["path"]` als absoluter Pfad → beliebige Datei wird kopiert/veröffentlicht (arbitrary file read/exfil).
- `modules/video_maker.py:1739,1754,1742–1743,1757–1758` – `resolve_image_file`/`resolve_audio_file`: `os.path.isfile(img_ref)` akzeptiert beliebige absolute Pfade; `rel` mit `../` ohne `commonpath` → Traversal in FFmpeg.
- `server.py:363` – `save_config`: `current.update(updates_copy)` ohne Feld-Whitelist → `output_dir`/`comfy_dir`/`last_i2i_dir` beliebig persistiert (Root-Ursache mehrerer Traversierungen/Subprocess-Pfade).

## MITTEL
- `server.py:858` + `:4616` – `do_GET` ohne Origin-Check, `Host`-Header nirgends validiert → DNS-Rebinding; Lesezugriff auf `/api/config`, `/output/*`, `/proxy/comfy`.
- SSRF-Kette über konfigurierbare `comfy_url`: `server.py:4164` (`forward_to_comfy`), `modules/video_maker.py:924`, `modules/video_comfy.py:645` – per POST `/api/config` auf beliebige Ziele umbiegbar.
- `modules/video_comfy.py:1152,1167,1216` – `install_extension`: `folder_name` ohne `basename`, `git clone repo_url` ohne Schema-/Host-Check, ZIP ohne `..`-Prüfung (derzeit nur mit harten Konstanten aufgerufen → latent).
- `modules/video_stitcher.py:65` – Concat-Direktive `file '...'` maskiert keine `'` → FFmpeg-Syntax-Injection; `:84` `volume={...}` akzeptiert `inf`/`nan`; `:127` ohne Timeout.
- `server.py:2515` – `handle_extract_image_params`: absoluter Pfad wird nur gegen ggf. manipuliertes `out_dir` geprüft.
- `server.py:4071,4087` + `:75` – `_FORBIDDEN_LAUNCH_TOKENS` enthalten `%`/`^` nicht (cmd.exe-Expansion).
- `modules/music_maker/comfy_client.py:322–328` – WS-Frame-Länge `>Q` → Speicher-DoS; `buf += chunk` quadratisch.
- Race Conditions ohne Lock: `modules/video_maker.py:982,1229,2302,2603` (Download-/Render-Jobs), `server.py:2467` (`ACTIVE_JOBS`-Überschreibung verliert Progress).
- `modules/music_maker/voice_swap.py:251` – `f0_method` unescaped in `python -c` (vermutet user-controlled).
- `modules/music_maker/music_service.py:2380–2381` (`safe_font`) & `:3174` (WSL-Start) – Filter-/Befehlsinjektion.
- Fehlende `timeout=` (blockierender Handler/DoS): `modules/video_maker.py:1413,1486,2573`; `modules/music_maker/music_service.py:2193,2388`; `modules/music_maker/wsl_vocal_align.py:134`.
- `web/video_module.js:1208–1210,1416–1575,4585–4923` – `innerHTML`/`<img src="${url}">` ohne Escaping → DOM-XSS bei serverseitig gelieferten Pfaden/URLs.

## GERING
- `modules/video_models.py:656` – Walk-Tiefenprüfung Off-by-one; `:534` verschluckt alle Exceptions → „kein Platz“-Fehlurteil.
- `modules/video_maker.py:432` – Pre-Alloc aus `Content-Range` → DoS; `:570` Temp-Datei-Leck nach Cancel.
- `modules/video_comfy.py:1547` – `copyfileobj` ohne Größenlimit.
- `server.py:3628,2209` – Polling ohne Backoff; Daemon-Threads ohne Cleanup.
- `server.py:1034` – `delete_image` mit leerem `output_dir` → relativ zu CWD.
- `server.py:241` – DPAPI-Fallback `plain:<base64>` auf Nicht-Windows → Klartext-API-Keys.
- `modules/music_maker/music_service.py:3541` – `_view`-Fallback `endswith/in`-Suche → Informationsleck.

## Hinweis
App bindet standardmäßig an `127.0.0.1`; die meisten Findings setzen lokalen HTTP-Zugriff oder DNS-Rebinding voraus. Priorisierung: Traversierung (`bg_remove`, `video_maker`) und `open_file`/WSL-Injection zuerst beheben.
