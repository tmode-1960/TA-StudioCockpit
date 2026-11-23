"""Video Stitcher and Post-Processing Module using FFmpeg.

Supports:
- Lossless/fast concatenation of storyboard segments
- Seamless crossfading transitions
- Upscaling from Eco resolutions (e.g. 480p) to 1080p Full HD
- Audio soundtrack replacement / mixing (e.g. with tA-MusicMaker tracks)
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from typing import List, Optional, Tuple

NO_WINDOW_FLAG = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


def is_ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _escape_ffmpeg_filter_path(path: str) -> str:
    """Escape a filesystem path for FFmpeg filter arguments (e.g. lut3d=file=...)."""
    escaped = os.path.abspath(path).replace("\\", "/")
    escaped = escaped.replace(":", "\\:").replace("'", "\\'")
    return escaped


def concat_segments(
    segment_paths: List[str],
    output_path: str,
    upscale_1080p: bool = False,
    bgm_path: Optional[str] = None,
    bgm_volume: float = 0.8,
    native_audio_volume: float = 1.0,
    lut_path: Optional[str] = None,
) -> Tuple[bool, str]:
    """Stitches multiple video clips into a single continuous video file."""
    if not segment_paths:
        return False, "Keine Segmente zum Zusammenfügen angegeben."

    if not is_ffmpeg_available():
        return False, "FFmpeg ist auf diesem System nicht im PATH gefunden worden."

    valid_paths = [p for p in segment_paths if os.path.isfile(p)]
    if not valid_paths:
        return False, "Keine der angegebenen Segment-Dateien existiert auf der Festplatte."

    # If only 1 segment and no post-processing needed, just copy or simple convert
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    temp_dir = tempfile.mkdtemp(prefix="tavideo_stitch_")
    concat_list_file = os.path.join(temp_dir, "concat_list.txt")

    try:
        # Create concat list for ffmpeg
        with open(concat_list_file, "w", encoding="utf-8") as f:
            for p in valid_paths:
                # FFmpeg requires escaped forward slashes or safe paths
                escaped = os.path.abspath(p).replace("\\", "/")
                f.write(f"file '{escaped}'\n")

        cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list_file]

        has_bgm = bool(bgm_path and os.path.isfile(bgm_path))
        if has_bgm:
            cmd.extend(["-i", os.path.abspath(bgm_path)])

        # Build video filter chain (LUT color grading + optional 1080p Lanczos upscale)
        vf_filters: List[str] = []
        if lut_path and os.path.isfile(lut_path):
            vf_filters.append(f"lut3d=file='{_escape_ffmpeg_filter_path(lut_path)}'")
        if upscale_1080p:
            vf_filters.append(
                "scale='if(gt(ih,iw),1080,if(eq(iw,ih),1080,1920))':'if(gt(ih,iw),1920,if(eq(iw,ih),1080,1080))':flags=lanczos"
            )
        video_filter = ",".join(vf_filters)

        audio_filter = (
            f"[0:a]volume={native_audio_volume}[a0];"
            f"[1:a]volume={bgm_volume}[a1];"
            f"[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )

        if video_filter and has_bgm:
            cmd.extend([
                "-filter_complex",
                f"[0:v]{video_filter}[vout];{audio_filter}",
                "-map", "[vout]",
                "-map", "[aout]",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "19",
                "-c:a", "aac",
                "-b:a", "256k",
            ])
        elif video_filter:
            cmd.extend([
                "-vf", video_filter,
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "19",
                "-c:a", "copy",
            ])
        elif has_bgm:
            cmd.extend([
                "-filter_complex", audio_filter,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "256k",
            ])
        else:
            # Simple fast stream copy
            cmd.extend(["-c", "copy"])

        if has_bgm:
            cmd.extend(["-map_chapters", "-1"])

        cmd.append(os.path.abspath(output_path))

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=NO_WINDOW_FLAG)
        if res.returncode != 0:
            return False, f"FFmpeg Fehler: {res.stderr[-400:]}"

        return True, output_path

    except Exception as ex:
        return False, str(ex)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def extract_last_frame(video_path: str, output_image_path: str) -> Tuple[bool, str]:
    """Extracts the final video frame using FFmpeg to use as FL2VA first-frame for subsequent scene."""
    if not os.path.isfile(video_path):
        return False, f"Videodatei nicht gefunden: {video_path}"
    if not is_ffmpeg_available():
        return False, "FFmpeg ist nicht verfügbar."

    os.makedirs(os.path.dirname(os.path.abspath(output_image_path)), exist_ok=True)
    try:
        # Seek near the end of video (-sseof -0.1) and extract 1 frame
        cmd = [
            "ffmpeg", "-y",
            "-sseof", "-0.1",
            "-i", os.path.abspath(video_path),
            "-frames:v", "1",
            "-q:v", "2",
            os.path.abspath(output_image_path),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30, creationflags=NO_WINDOW_FLAG)
        if res.returncode == 0 and os.path.isfile(output_image_path):
            return True, output_image_path

        # Fallback: extract last frame with reverse filter
        if os.path.isfile(output_image_path):
            try:
                os.remove(output_image_path)
            except Exception:
                pass

        cmd_fallback = [
            "ffmpeg", "-y",
            "-i", os.path.abspath(video_path),
            "-vf", "reverse",
            "-frames:v", "1",
            "-q:v", "2",
            os.path.abspath(output_image_path),
        ]
        res_fb = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30, creationflags=NO_WINDOW_FLAG)
        if res_fb.returncode == 0 and os.path.isfile(output_image_path):
            return True, output_image_path

        err_detail = (res_fb.stderr[-200:] if res_fb.stderr else (res.stderr[-200:] if res.stderr else "Unbekannter Fehler"))
        return False, f"Frame-Extraktion fehlgeschlagen: {err_detail}"
    except Exception as ex:
        return False, str(ex)

