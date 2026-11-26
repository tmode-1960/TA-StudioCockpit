---
name: music-maker
description: >-
  Send song prompts, briefs, lyrics, style tags, and render jobs directly to
  tA-Studio-Cockpit's local MusicMaker HTTP API (/api/music/*). Activate when
  the user asks to send a prompt, song idea, lyrics, or render request to
  MusicMaker / MusikMaker, generate a new take, or check a MusicMaker job.
---

# MusicMaker Direct API Skill

Use this skill to pass song ideas, briefs, lyrics, and render requests directly
to a running **tA-Studio-Cockpit** instance via its local HTTP JSON API
(`http://127.0.0.1:8095` by default).

## Prerequisites

- **tA-Studio-Cockpit** must be running locally (default port `8095`; override
  with `--url` or `STUDIO_COCKPIT_URL`).
- **ComfyUI** must be running/configured in Studio Cockpit for actual draft
  generation and audio rendering.
- If `run_command` cannot reach `127.0.0.1:8095` inside the sandbox, re-run the
  command with `BypassSandbox: true`.

## Helper Script

Use `.agents/skills/music-maker/scripts/music_client.py` (Python 3 stdlib only):

```powershell
# 1. Check server & ComfyUI status
python .agents/skills/music-maker/scripts/music_client.py status

# 2. Inspect valid combo options and workflow defaults
python .agents/skills/music-maker/scripts/music_client.py options
python .agents/skills/music-maker/scripts/music_client.py defaults

# 3. Start a draft (writer generates title, style, lyrics, artwork_prompt) and wait
python .agents/skills/music-maker/scripts/music_client.py draft --file payload.json --wait

# 4. Render a song directly (with title, style, lyrics in sheet, or mode="auto") and wait
python .agents/skills/music-maker/scripts/music_client.py render --file payload.json --wait

# 5. Generate a fresh vocal/instrumental take of the latest (or specified) song
python .agents/skills/music-maker/scripts/music_client.py new-take --wait

# 6. Check or wait on an existing job
python .agents/skills/music-maker/scripts/music_client.py job <job_id> --wait
```

You can also pass JSON inline via `--json "..."` or via stdin with `--file -`.

## Payload Reference

### 1. `POST /api/music/draft`

Generates `title`, `style`, `lyrics`, and `artwork_prompt` from a `brief`:

```json
{
  "brief": {
    "description": "Neon-lit midnight drive through a rainy cyberpunk city",
    "genre": "Dark Synthwave",
    "mood": "melancholic, driving, cinematic",
    "tempo": "108 BPM",
    "length": "standard (about 3:00)",
    "vocals": "sung",
    "vocals.theme": "loneliness and neon reflections",
    "vocals.language": "English",
    "vocals.voice": "warm male baritone",
    "vocals.lyrics_from": "written from the idea below",
    "arrangement": "standard",
    "creativity": 100
  }
}
```

- To supply **your own lyrics** for a draft or render, set:
  - `"vocals.lyrics_from": "my own, sung as written below"`
  - `"vocals.lyrics": "[Verse 1]\n..."`

### 2. `POST /api/music/render`

Renders audio. Two modes:

- **Manual/Reviewed Sheet** (recommended when you already wrote `title`, `style`, and `lyrics` — skips the writer step):

```json
{
  "brief": {
    "description": "Neon-lit midnight drive",
    "genre": "Dark Synthwave",
    "length": "standard (about 3:00)",
    "vocals": "sung",
    "arrangement": "standard"
  },
  "sheet": {
    "title": "Midnight Rain",
    "style": "dark synthwave, analog bass, gated reverb, 108 BPM, melancholic male vocals",
    "lyrics": "[Verse 1]\n..."
  }
}
```

- **Auto Mode** (writer + render in one run, optionally multiple variations):

```json
{
  "mode": "auto",
  "count": 1,
  "brief": {
    "description": "Neon-lit midnight drive",
    "genre": "Dark Synthwave",
    "length": "standard (about 3:00)",
    "vocals": "sung"
  }
}
```

## Recommended Agent Workflow

1. Run `status` first to confirm Studio Cockpit and ComfyUI are reachable.
2. If the user asks for specific parameters (length, vocals, arrangement, etc.)
   and you are unsure of exact enum strings, check `options` first.
3. Ask or decide whether the user wants:
   - a **draft** first (`draft`) so they can review/edit lyrics & style, or
   - a **direct render** (`render`) with `sheet` (`title`, `style`, `lyrics`)
     or `mode: "auto"`.
4. Pass `--wait` (or poll `job <id>`) and report the resulting job status,
   generated draft text, or output media URLs/filenames back to the user.
