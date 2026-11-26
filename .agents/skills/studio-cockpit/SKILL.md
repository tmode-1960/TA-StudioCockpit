---
name: studio-cockpit
description: >-
  Control all tA-Studio-Cockpit modules (Image Studio, VideoMaker, MusicMaker,
  and DiscordGIF) directly via the local HTTP JSON API on port 8095, including
  cross-module pipelines (e.g. generate an image, animate it as a Quick Clip or
  AI GIF, and create a matching MusicMaker soundtrack). Activate when the user
  asks to generate images, videos, GIFs, or multi-module media workflows in
  tA-Studio-Cockpit.
---

# tA-Studio-Cockpit Unified Skill

Use this skill to orchestrate **Image Studio**, **VideoMaker**, **MusicMaker**,
and **DiscordGIF** directly via `http://127.0.0.1:8095` (override with `--url`
or `STUDIO_COCKPIT_URL`).

## Prerequisites

- **tA-Studio-Cockpit** (`StudioCockpit.exe` or `server.py`) must be running.
- **ComfyUI** must be running for ComfyUI-backed generation (Image Studio,
  VideoMaker, MusicMaker, AI GIF).
- Python 3 (stdlib only; uses `ProxyHandler({})` so local requests bypass any
  system proxy).

## Helper Script

All commands live in `.agents/skills/studio-cockpit/scripts/cockpit_client.py`:

```powershell
# Overall status across all 4 modules
python .agents/skills/studio-cockpit/scripts/cockpit_client.py status
```

### 1. Image Studio (`image`)

```powershell
# List model & sampler presets
python .agents/skills/studio-cockpit/scripts/cockpit_client.py image presets

# Generate an image and wait for completion
python .agents/skills/studio-cockpit/scripts/cockpit_client.py image generate --file img.json --wait

# Poll an existing prompt_id
python .agents/skills/studio-cockpit/scripts/cockpit_client.py image poll <prompt_id>
```

Minimal `img.json`:
```json
{
  "prompt": "Cyberpunk rainy neon alley, cinematic lighting, ultra detailed",
  "neg_prompt": "blurry, lowres",
  "model_preset": "Minimax H3 Image",
  "sampler_preset": "Minimax H3 Image",
  "width": 1280,
  "height": 720,
  "aspect_ratio": "16:9",
  "seedMode": "randomize",
  "batch_size": 1
}
```
The completed poll response includes the generated image filename/URL (e.g. `/output/<rel_path>`).

### 2. VideoMaker (`video`)

```powershell
# Check VideoMaker status & active job
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video status
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video job

# Adopt an Image Studio output (/output/...) or local file into VideoMaker uploads
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video adopt "/output/..."

# Upload a MusicMaker audio output (/api/music/view?...) or local file into VideoMaker uploads
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video adopt-audio "/api/music/view?..."

# Render a Quick Clip (or Long Clip / Scene)
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video quick --file clip.json
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video long --file clip.json
python .agents/skills/studio-cockpit/scripts/cockpit_client.py video scene --file scene.json
```

Minimal `clip.json` for `video quick`:
```json
{
  "title": "Cyberpunk_Alley_Clip",
  "prompt": "The cyberpunk runner walks forward down the rain-soaked neon street, holographic signs flickering, mist drifting",
  "duration": 10.0,
  "resolution": "720p",
  "fps": 24,
  "first_frame": "/api/video/uploads/<filename_from_video_adopt>",
  "auto_sound": true,
  "audio_file": "/api/video/uploads/<filename_from_video_adopt_audio>",
  "audio_start": 15.0,
  "audio_volume": 1.0
}
```
*(Important: `first_frame` and `audio_file` MUST use the `/api/video/uploads/...` `url` or full `path` returned by `video adopt` / `video adopt-audio` — bare filenames are ignored. `video quick` / `video long` / `video scene` block until rendering finishes and return `{"ok": true, "video_url": "/api/video/output/...", "path": "..."}`; use a generous command timeout.)*

### 3. MusicMaker (`music`)

```powershell
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music status
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music options
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music defaults
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music draft --file draft.json --wait
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music render --file render.json --wait
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music new-take --wait
python .agents/skills/studio-cockpit/scripts/cockpit_client.py music job <job_id> --wait
```
See `.agents/skills/music-maker/SKILL.md` for full `brief` / `sheet` / `options` payload details.

### 4. DiscordGIF (`gif`)

```powershell
# List AI GIF workflows & existing GIFs
python .agents/skills/studio-cockpit/scripts/cockpit_client.py gif workflows
python .agents/skills/studio-cockpit/scripts/cockpit_client.py gif list

# Generate an AI GIF from a local image or Studio /output/... URL
python .agents/skills/studio-cockpit/scripts/cockpit_client.py gif generate --image-url "/output/..." --prompt "subtle neon flicker" --wait

# Send a GIF by ID to Discord
python .agents/skills/studio-cockpit/scripts/cockpit_client.py gif send <gif_id>
```

## Cross-Module Pipeline Example

For a request like *"Create a cyberpunk image, write a matching synthwave track for it, and animate it as a Quick Clip with the song"*:
1. Run `image presets` (if needed) and `image generate --file img.json --wait` → note the output `/output/...` `image_url`.
2. Run `music render` (with `mode: "auto"` or a custom `sheet`) → note the output `/api/music/view?...` audio `url`.
3. Run `video adopt "<image_url>"` and `video adopt-audio "<audio_url>"` → note both returned `/api/video/uploads/...` `url` values.
4. Run `video quick --file clip.json` with `first_frame` set to the adopted image `url`, `auto_sound: true`, `audio_file` set to the adopted audio `url`, and a motion prompt describing how the subject/camera moves.
5. Report all produced files/URLs cleanly to the user.
