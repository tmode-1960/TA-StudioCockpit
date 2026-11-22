"""Gallery Indexer, Multi-Root Manager, Video Support & File Operations for thomo.ART StudioCockpit.

Adapted from HammelArt Gallery's zero-pollution incremental os.scandir indexer:
- Never writes cache or thumbnail files into the user's media folders.
- Stores index, favorites, mounted roots, and JPEG thumbnails under data/gallery_cache/.
- Supports images (.png, .jpg, .jpeg, .webp) and videos (.mp4, .webm, .mov, via ffmpeg thumbnails + Range streaming).
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import shutil
import subprocess
import threading
import time
import urllib.parse
import uuid
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from PIL import Image, ImageOps

SUPPORTED_IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp")
SUPPORTED_VIDEO_EXTS = (".mp4", ".webm", ".mov")
SUPPORTED_EXTS = SUPPORTED_IMAGE_EXTS + SUPPORTED_VIDEO_EXTS

_DATA_ROOT = ""
_GET_OUTPUT_DIR: Optional[Callable[[], str]] = None
_EXTRACT_META: Optional[Callable[[str], dict]] = None
_INDEXER_LOCK = threading.Lock()
_INDEXERS: Dict[str, "GalleryIndexer"] = {}


def init_module(
    data_root: str,
    get_output_dir_fn: Callable[[], str],
    extract_meta_fn: Callable[[str], dict],
) -> None:
    global _DATA_ROOT, _GET_OUTPUT_DIR, _EXTRACT_META
    _DATA_ROOT = os.path.abspath(data_root)
    _GET_OUTPUT_DIR = get_output_dir_fn
    _EXTRACT_META = extract_meta_fn


def _roots_file() -> str:
    return os.path.join(_DATA_ROOT, "data", "gallery_roots.json")


def _load_mounted_roots() -> List[Dict[str, str]]:
    rf = _roots_file()
    if os.path.isfile(rf):
        try:
            with open(rf, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return [
                    {"id": str(r.get("id", "")), "name": str(r.get("name", "")), "path": str(r.get("path", ""))}
                    for r in data
                    if isinstance(r, dict) and r.get("id") and r.get("path")
                ]
        except Exception:
            pass
    return []


def _save_mounted_roots(roots: List[Dict[str, str]]) -> None:
    rf = _roots_file()
    os.makedirs(os.path.dirname(rf), exist_ok=True)
    tmp = f"{rf}.{uuid.uuid4().hex[:6]}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(roots, f, ensure_ascii=False, indent=2)
    os.replace(tmp, rf)


def get_all_roots() -> List[Dict[str, Any]]:
    roots: List[Dict[str, Any]] = []
    primary_dir = _GET_OUTPUT_DIR() if _GET_OUTPUT_DIR else ""
    if primary_dir:
        roots.append({
            "id": "primary",
            "name": f"ComfyUI Output ({os.path.basename(primary_dir.rstrip(os.sep)) or primary_dir})",
            "path": os.path.abspath(primary_dir),
            "primary": True,
            "exists": os.path.isdir(primary_dir),
        })
    for r in _load_mounted_roots():
        p = os.path.abspath(r["path"])
        roots.append({
            "id": r["id"],
            "name": r["name"] or os.path.basename(p.rstrip(os.sep)) or p,
            "path": p,
            "primary": False,
            "exists": os.path.isdir(p),
        })
    return roots


def _get_indexer(root_id: str = "primary") -> Optional["GalleryIndexer"]:
    roots = get_all_roots()
    target = next((r for r in roots if r["id"] == root_id), None)
    if target is None and roots:
        target = roots[0]
    if target is None or not target.get("exists"):
        return None
    out_dir = target["path"]
    norm = os.path.normcase(os.path.abspath(out_dir))
    with _INDEXER_LOCK:
        idx = _INDEXERS.get(norm)
        if idx is None:
            cache_root = os.path.join(_DATA_ROOT, "data", "gallery_cache")
            idx = GalleryIndexer(out_dir, cache_root, root_id=target["id"])
            _INDEXERS[norm] = idx
        else:
            idx.root_id = target["id"]
        return idx


def _find_ffmpeg() -> Optional[str]:
    return shutil.which("ffmpeg")


class GalleryIndexer:
    def __init__(self, output_dir: str, cache_root: str, root_id: str = "primary") -> None:
        self.output_dir = os.path.abspath(output_dir)
        self.root_id = root_id
        dir_hash = hashlib.md5(self.output_dir.lower().encode("utf-8")).hexdigest()[:10]
        self.storage_dir = os.path.join(cache_root, f"workspace_{dir_hash}")
        self.thumb_dir = os.path.join(self.storage_dir, "thumbnails")
        self.index_file = os.path.join(self.storage_dir, "gallery_index.json")
        self.favorites_file = os.path.join(self.storage_dir, "favorites.json")
        os.makedirs(self.thumb_dir, exist_ok=True)

        self._lock = threading.Lock()
        self._last_scan_ts = 0.0
        self._index: Dict[str, Dict[str, Any]] = self._load_json(self.index_file, {})
        self._favorites: Set[str] = set(self._load_json(self.favorites_file, []))

    @staticmethod
    def _load_json(path: str, default: Any) -> Any:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return default
        return default

    @staticmethod
    def _save_json(path: str, data: Any) -> None:
        tmp_path = f"{path}.{os.getpid()}.{uuid.uuid4().hex[:8]}.tmp"
        try:
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            os.replace(tmp_path, path)
        except Exception:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    def resolve_safe_path(self, rel_path: str) -> Optional[str]:
        clean = (rel_path or "").replace("\\", "/").lstrip("/")
        if not clean:
            return None
        full = os.path.abspath(os.path.join(self.output_dir, clean.replace("/", os.sep)))
        base = os.path.abspath(self.output_dir)
        if not (full == base or full.startswith(base + os.sep)):
            return None
        return full

    def resolve_safe_folder(self, rel_folder: str) -> Optional[str]:
        clean = (rel_folder or "").replace("\\", "/").strip("/")
        if not clean:
            return os.path.abspath(self.output_dir)
        full = os.path.abspath(os.path.join(self.output_dir, clean.replace("/", os.sep)))
        base = os.path.abspath(self.output_dir)
        if not (full == base or full.startswith(base + os.sep)):
            return None
        return full

    def _scan_fast(self) -> Tuple[List[Tuple[str, str, str, float, int]], Set[str]]:
        found: List[Tuple[str, str, str, float, int]] = []
        dirs_seen: Set[str] = set()

        def _walk(curr: str, prefix: str) -> None:
            try:
                with os.scandir(curr) as it:
                    for entry in it:
                        name = entry.name
                        if name.startswith(".") or name == "__pycache__":
                            continue
                        if entry.is_dir(follow_symlinks=False):
                            sub = f"{prefix}/{name}" if prefix else name
                            dirs_seen.add(sub)
                            _walk(entry.path, sub)
                        elif entry.is_file(follow_symlinks=False):
                            if name.lower().endswith(SUPPORTED_EXTS):
                                try:
                                    st = entry.stat(follow_symlinks=False)
                                    rel = f"{prefix}/{name}" if prefix else name
                                    found.append((rel, prefix, entry.path, st.st_mtime, st.st_size))
                                except OSError:
                                    pass
            except OSError:
                pass

        _walk(self.output_dir, "")
        return found, dirs_seen

    def scan_and_index(self, force: bool = False) -> Set[str]:
        now = time.time()
        scanned, dirs_seen = self._scan_fast()
        if not force and (now - self._last_scan_ts) < 2.5 and self._index:
            return dirs_seen

        seen_keys: Set[str] = set()
        dirty = False

        with self._lock:
            for rel, folder, full_path, mtime, size in scanned:
                seen_keys.add(rel)
                existing = self._index.get(rel)
                if (
                    not force
                    and existing is not None
                    and abs(existing.get("mtime", 0) - mtime) < 0.01
                    and existing.get("size", 0) == size
                    and "media_type" in existing
                ):
                    continue

                is_video = rel.lower().endswith(SUPPORTED_VIDEO_EXTS)
                media_type = "video" if is_video else "image"
                w, h = 0, 0
                meta: dict = {}
                if not is_video:
                    try:
                        with Image.open(full_path) as im:
                            w, h = im.size
                    except Exception:
                        pass
                    meta = _EXTRACT_META(full_path) if _EXTRACT_META else {}

                ext = os.path.splitext(rel)[1].lstrip(".").lower()
                self._index[rel] = {
                    "path": rel,
                    "name": os.path.basename(rel),
                    "folder": folder,
                    "ext": ext,
                    "media_type": media_type,
                    "mtime": mtime,
                    "size": size,
                    "width": w,
                    "height": h,
                    "prompt": meta.get("positive_prompt", ""),
                    "additional_prompt": meta.get("additional_prompt", ""),
                    "neg_prompt": meta.get("negative_prompt", ""),
                    "model": meta.get("model", ""),
                    "seed": meta.get("seed"),
                }
                dirty = True

            stale = [k for k in self._index if k not in seen_keys]
            if stale:
                for k in stale:
                    del self._index[k]
                dirty = True

            self._last_scan_ts = time.time()
            if dirty:
                self._save_json(self.index_file, self._index)
        return dirs_seen

    def get_items(
        self,
        folder: str = "",
        search: str = "",
        fav_only: bool = False,
        fmt: str = "all",
        sort: str = "newest",
        offset: int = 0,
        limit: int = 120,
    ) -> Dict[str, Any]:
        dirs_seen = self.scan_and_index(force=False)

        with self._lock:
            all_items = list(self._index.values())
            favs = set(self._favorites)

        folder_counts: Dict[str, int] = {d: 0 for d in dirs_seen}
        root_count = 0
        for item in all_items:
            fld = item.get("folder", "")
            if not fld:
                root_count += 1
            else:
                parts = fld.split("/")
                for i in range(1, len(parts) + 1):
                    prefix = "/".join(parts[:i])
                    folder_counts[prefix] = folder_counts.get(prefix, 0) + 1

        folders_list = [
            {"path": k, "name": k.split("/")[-1], "depth": k.count("/"), "count": folder_counts[k]}
            for k in sorted(folder_counts.keys(), key=lambda s: s.lower())
        ]

        q = (search or "").strip().lower()
        fmt_l = (fmt or "all").strip().lower()
        fld_filter = (folder or "").strip().strip("/")
        r_q = urllib.parse.quote(self.root_id, safe="")

        filtered: List[Dict[str, Any]] = []
        for item in all_items:
            rel = item["path"]
            is_fav = rel in favs
            mtype = item.get("media_type", "image")

            if fav_only and not is_fav:
                continue
            if fld_filter == "__root__":
                if item.get("folder", "") != "":
                    continue
            elif fld_filter:
                item_fld = item.get("folder", "")
                if item_fld != fld_filter and not item_fld.startswith(fld_filter + "/"):
                    continue
            if fmt_l != "all":
                ext = item.get("ext", "")
                if fmt_l == "video":
                    if mtype != "video":
                        continue
                elif fmt_l == "image":
                    if mtype != "image":
                        continue
                elif fmt_l == "jpg":
                    if ext not in ("jpg", "jpeg"):
                        continue
                elif ext != fmt_l:
                    continue
            if q:
                hay = " ".join(
                    [
                        item.get("name", ""),
                        item.get("folder", ""),
                        item.get("prompt", ""),
                        item.get("additional_prompt", ""),
                        item.get("model", ""),
                        str(item.get("seed") or ""),
                    ]
                ).lower()
                if q not in hay:
                    continue

            enriched = dict(item)
            enriched["root"] = self.root_id
            enriched["favorite"] = is_fav
            p_q = urllib.parse.quote(rel, safe="")
            enriched["url"] = f"/api/gallery/media?root={r_q}&path={p_q}"
            enriched["thumb_url"] = f"/api/gallery/thumb?root={r_q}&path={p_q}&t={int(item.get('mtime', 0))}"
            filtered.append(enriched)

        if sort == "oldest":
            filtered.sort(key=lambda x: x.get("mtime", 0))
        elif sort == "name":
            filtered.sort(key=lambda x: x.get("name", "").lower())
        else:
            filtered.sort(key=lambda x: x.get("mtime", 0), reverse=True)

        total_filtered = len(filtered)
        page = filtered[offset : offset + limit]

        return {
            "root": self.root_id,
            "output_dir": self.output_dir,
            "total_all": len(all_items),
            "root_count": root_count,
            "favorites_count": sum(1 for it in all_items if it["path"] in favs),
            "total_filtered": total_filtered,
            "folders": folders_list,
            "items": page,
            "offset": offset,
            "limit": limit,
        }

    def get_or_create_thumbnail(self, rel_path: str, max_edge: int = 560) -> Optional[str]:
        full = self.resolve_safe_path(rel_path)
        if not full or not os.path.isfile(full):
            return None
        try:
            mtime = int(os.path.getmtime(full))
        except OSError:
            return None

        key_hash = hashlib.md5(f"{rel_path}|{mtime}|{max_edge}".encode("utf-8")).hexdigest()[:16]
        thumb_path = os.path.join(self.thumb_dir, f"{key_hash}.jpg")
        if os.path.isfile(thumb_path):
            return thumb_path

        if full.lower().endswith(SUPPORTED_VIDEO_EXTS):
            ffmpeg = _find_ffmpeg()
            if not ffmpeg:
                return None
            tmp = f"{thumb_path}.{uuid.uuid4().hex[:6]}.jpg"
            for seek in ("0.5", "0"):
                try:
                    cmd = [
                        ffmpeg,
                        "-y",
                        "-ss",
                        seek,
                        "-i",
                        full,
                        "-vframes",
                        "1",
                        "-vf",
                        f"scale='min({max_edge},iw)':'min({max_edge},ih)':force_original_aspect_ratio=decrease",
                        "-q:v",
                        "3",
                        tmp,
                    ]
                    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=12)
                    if res.returncode == 0 and os.path.isfile(tmp) and os.path.getsize(tmp) > 0:
                        os.replace(tmp, thumb_path)
                        return thumb_path
                except Exception:
                    pass
                finally:
                    if os.path.isfile(tmp):
                        try:
                            os.remove(tmp)
                        except Exception:
                            pass
            return None

        try:
            with Image.open(full) as im:
                im = ImageOps.exif_transpose(im)
                if im.mode in ("RGBA", "LA", "P"):
                    bg = Image.new("RGB", im.size, (18, 20, 28))
                    if im.mode == "P":
                        im = im.convert("RGBA")
                    bg.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
                    im = bg
                elif im.mode != "RGB":
                    im = im.convert("RGB")
                im.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
                tmp = f"{thumb_path}.{uuid.uuid4().hex[:6]}.tmp"
                im.save(tmp, "JPEG", quality=85, optimize=True)
                os.replace(tmp, thumb_path)
            return thumb_path
        except Exception:
            return None

    def toggle_favorite(self, rel_path: str) -> bool:
        with self._lock:
            if rel_path in self._favorites:
                self._favorites.remove(rel_path)
                state = False
            else:
                self._favorites.add(rel_path)
                state = True
            self._save_json(self.favorites_file, sorted(self._favorites))
            return state

    def create_folder(self, parent_rel: str, folder_name: str) -> Tuple[bool, str]:
        clean_name = re.sub(r'[<>:"/\\|?*]', "_", (folder_name or "").strip()).strip(". ")
        if not clean_name:
            return False, "Ungültiger Ordnername"
        parent_dir = self.resolve_safe_folder(parent_rel)
        if not parent_dir or not os.path.isdir(parent_dir):
            return False, "Zielordner nicht gefunden"
        new_dir = os.path.join(parent_dir, clean_name)
        try:
            os.makedirs(new_dir, exist_ok=True)
            rel = os.path.relpath(new_dir, self.output_dir).replace("\\", "/")
            return True, rel
        except Exception as e:
            return False, str(e)

    def _unique_dest(self, dest_dir: str, filename: str) -> str:
        candidate = os.path.join(dest_dir, filename)
        if not os.path.exists(candidate):
            return candidate
        stem, ext = os.path.splitext(filename)
        i = 1
        while True:
            cand = os.path.join(dest_dir, f"{stem}_{i}{ext}")
            if not os.path.exists(cand):
                return cand
            i += 1

    def transfer_items(self, rel_paths: List[str], target_folder: str, move: bool = True) -> int:
        dest_dir = self.resolve_safe_folder(target_folder)
        if not dest_dir or not os.path.isdir(dest_dir):
            return 0
        count = 0
        for rel in rel_paths:
            src = self.resolve_safe_path(rel)
            if not src or not os.path.isfile(src):
                continue
            if os.path.normcase(os.path.dirname(src)) == os.path.normcase(dest_dir):
                continue
            dst = self._unique_dest(dest_dir, os.path.basename(src))
            try:
                if move:
                    shutil.move(src, dst)
                    new_rel = os.path.relpath(dst, self.output_dir).replace("\\", "/")
                    with self._lock:
                        if rel in self._favorites:
                            self._favorites.discard(rel)
                            self._favorites.add(new_rel)
                            self._save_json(self.favorites_file, sorted(self._favorites))
                else:
                    shutil.copy2(src, dst)
                count += 1
            except Exception:
                pass
        if count:
            self.scan_and_index(force=True)
        return count

    def delete_items(self, rel_paths: List[str]) -> int:
        count = 0
        for rel in rel_paths:
            full = self.resolve_safe_path(rel)
            if not full or not os.path.isfile(full):
                continue
            try:
                os.remove(full)
                count += 1
                with self._lock:
                    self._index.pop(rel, None)
                    self._favorites.discard(rel)
            except Exception:
                pass
        if count:
            with self._lock:
                self._save_json(self.favorites_file, sorted(self._favorites))
                self._save_json(self.index_file, self._index)
        return count


def _serve_file_with_range(handler: Any, filepath: str) -> None:
    size = os.path.getsize(filepath)
    ctype, _ = mimetypes.guess_type(filepath)
    if not ctype:
        ext = os.path.splitext(filepath)[1].lower()
        ctype = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/quicktime",
            ".webp": "image/webp",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
        }.get(ext, "application/octet-stream")

    range_hdr = handler.headers.get("Range")
    if range_hdr and range_hdr.startswith("bytes="):
        try:
            spec = range_hdr[6:].split(",")[0].strip()
            start_s, end_s = spec.split("-", 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else size - 1
            start = max(0, min(start, size - 1))
            end = max(start, min(end, size - 1))
            length = end - start + 1
            handler.send_response(206)
            handler.send_header("Content-Type", ctype)
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            handler.send_header("Content-Length", str(length))
            handler.end_headers()
            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    handler.wfile.write(chunk)
                    remaining -= len(chunk)
            return
        except Exception:
            pass

    handler.send_response(200)
    handler.send_header("Content-Type", ctype)
    handler.send_header("Accept-Ranges", "bytes")
    handler.send_header("Content-Length", str(size))
    handler.end_headers()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            handler.wfile.write(chunk)


def handle_get(handler: Any, path: str, parsed: urllib.parse.ParseResult) -> bool:
    if path == "/api/gallery/roots":
        handler.send_json({"roots": get_all_roots()})
        return True

    if path == "/api/gallery/items":
        qs = urllib.parse.parse_qs(parsed.query)
        root_id = qs.get("root", ["primary"])[0]
        idx = _get_indexer(root_id)
        if idx is None:
            handler.send_json({"error": "No output directory configured", "items": [], "folders": [], "total_all": 0, "total_filtered": 0, "roots": get_all_roots()})
            return True
        folder = qs.get("folder", [""])[0]
        search = qs.get("q", [""])[0]
        fav_only = qs.get("fav", ["0"])[0] in ("1", "true", "yes")
        fmt = qs.get("fmt", ["all"])[0]
        sort = qs.get("sort", ["newest"])[0]
        try:
            offset = max(0, int(qs.get("offset", ["0"])[0]))
        except ValueError:
            offset = 0
        try:
            limit = max(1, min(300, int(qs.get("limit", ["120"])[0])))
        except ValueError:
            limit = 120
        data = idx.get_items(folder=folder, search=search, fav_only=fav_only, fmt=fmt, sort=sort, offset=offset, limit=limit)
        data["roots"] = get_all_roots()
        handler.send_json(data)
        return True

    if path == "/api/gallery/thumb":
        qs = urllib.parse.parse_qs(parsed.query)
        root_id = qs.get("root", ["primary"])[0]
        rel_path = qs.get("path", [""])[0]
        idx = _get_indexer(root_id)
        if idx is None:
            handler.send_response(404)
            handler.end_headers()
            return True
        thumb_path = idx.get_or_create_thumbnail(rel_path)
        if not thumb_path or not os.path.isfile(thumb_path):
            handler.send_response(404)
            handler.end_headers()
            return True
        try:
            size = os.path.getsize(thumb_path)
            handler.send_response(200)
            handler.send_header("Content-Type", "image/jpeg")
            handler.send_header("Cache-Control", "public, max-age=86400")
            handler.send_header("Content-Length", str(size))
            handler.end_headers()
            with open(thumb_path, "rb") as f:
                handler.wfile.write(f.read())
        except Exception:
            pass
        return True

    if path == "/api/gallery/media":
        qs = urllib.parse.parse_qs(parsed.query)
        root_id = qs.get("root", ["primary"])[0]
        rel_path = qs.get("path", [""])[0]
        idx = _get_indexer(root_id)
        if idx is None:
            handler.send_response(404)
            handler.end_headers()
            return True
        full = idx.resolve_safe_path(rel_path)
        if not full or not os.path.isfile(full):
            handler.send_response(404)
            handler.end_headers()
            return True
        try:
            _serve_file_with_range(handler, full)
        except Exception:
            pass
        return True

    return False


def handle_post(handler: Any, path: str, parsed: urllib.parse.ParseResult, post_body: Optional[bytes]) -> bool:
    try:
        payload = json.loads((post_body or b"{}").decode("utf-8"))
    except Exception:
        payload = {}

    if path == "/api/gallery/roots/add":
        folder_path = str(payload.get("path") or "").strip()
        if not folder_path or not os.path.isdir(folder_path):
            handler.send_json({"ok": False, "error": "Ordner existiert nicht."}, status=400)
            return True
        abs_p = os.path.abspath(folder_path)
        existing = get_all_roots()
        if any(os.path.normcase(r["path"]) == os.path.normcase(abs_p) for r in existing):
            handler.send_json({"ok": True, "roots": existing})
            return True
        mounted = _load_mounted_roots()
        new_id = f"root_{uuid.uuid4().hex[:8]}"
        mounted.append({
            "id": new_id,
            "name": os.path.basename(abs_p.rstrip(os.sep)) or abs_p,
            "path": abs_p,
        })
        _save_mounted_roots(mounted)
        handler.send_json({"ok": True, "id": new_id, "roots": get_all_roots()})
        return True

    if path == "/api/gallery/roots/remove":
        root_id = str(payload.get("id") or "").strip()
        if not root_id or root_id == "primary":
            handler.send_json({"ok": False, "error": "Primärer Ordner kann nicht entfernt werden."}, status=400)
            return True
        mounted = [r for r in _load_mounted_roots() if r.get("id") != root_id]
        _save_mounted_roots(mounted)
        handler.send_json({"ok": True, "roots": get_all_roots()})
        return True

    root_id = str(payload.get("root") or "primary").strip()
    idx = _get_indexer(root_id)

    if path == "/api/gallery/rescan":
        if idx is None:
            handler.send_json({"ok": False, "error": "No output directory configured"}, status=400)
            return True
        idx.scan_and_index(force=True)
        handler.send_json({"ok": True})
        return True

    if path == "/api/gallery/favorite":
        if idx is None:
            handler.send_json({"ok": False, "error": "No output directory"}, status=400)
            return True
        rel_path = str(payload.get("path") or "").strip()
        if not rel_path:
            handler.send_json({"ok": False, "error": "Missing path"}, status=400)
            return True
        fav = idx.toggle_favorite(rel_path)
        handler.send_json({"ok": True, "path": rel_path, "favorite": fav})
        return True

    if path == "/api/gallery/open_folder":
        if idx is None:
            handler.send_json({"ok": False}, status=400)
            return True
        rel_path = str(payload.get("path") or "").strip()
        full = idx.resolve_safe_path(rel_path)
        if full and os.path.isfile(full):
            try:
                subprocess.Popen(["explorer", "/select,", full])
                handler.send_json({"ok": True})
                return True
            except Exception:
                pass
        handler.send_json({"ok": False}, status=404)
        return True

    if path == "/api/gallery/create_folder":
        if idx is None:
            handler.send_json({"ok": False}, status=400)
            return True
        ok, res = idx.create_folder(str(payload.get("parent") or ""), str(payload.get("name") or ""))
        handler.send_json({"ok": ok, "folder": res if ok else "", "error": "" if ok else res}, status=200 if ok else 400)
        return True

    if path in ("/api/gallery/move_items", "/api/gallery/copy_items"):
        if idx is None:
            handler.send_json({"ok": False}, status=400)
            return True
        paths = payload.get("paths") or []
        target_folder = str(payload.get("target_folder") or "")
        move = path.endswith("move_items")
        cnt = idx.transfer_items([str(p) for p in paths], target_folder, move=move)
        handler.send_json({"ok": True, "count": cnt})
        return True

    if path == "/api/gallery/delete_items":
        if idx is None:
            handler.send_json({"ok": False}, status=400)
            return True
        paths = payload.get("paths") or []
        cnt = idx.delete_items([str(p) for p in paths])
        handler.send_json({"ok": True, "count": cnt})
        return True

    return False
