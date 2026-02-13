"""
mt_fetcher.normalize — normalize evidence manifest + context into items.jsonl (v1)

Defaults:
- emits NO raw file paths
- title defaults to artifact:<sha_prefix>
- optional include_names exposes filenames (still no full paths)
"""
from __future__ import annotations

import json
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

@dataclass(frozen=True)
class NormalizeResult:
    items_path: Path
    count: int

def _guess_content_type(p: str) -> str:
    t, _ = mimetypes.guess_type(p)
    return t or "application/octet-stream"

def normalize_run(
    *,
    run_id: str,
    source_id: str,
    raw_dir: Path,
    evidence_manifest: Path,
    out_dir: Path,
    include_names: bool = False,
    extra_meta: Optional[Dict[str, Any]] = None,
) -> NormalizeResult:
    raw_dir = Path(raw_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    ctx_path = raw_dir / "context.json"
    ctx: Dict[str, Any] = {}
    if ctx_path.is_file():
        try:
            ctx = json.loads(ctx_path.read_text(encoding="utf-8"))
        except Exception:
            ctx = {}

    tags = ctx.get("tags") if isinstance(ctx.get("tags"), list) else []
    retrieved_utc = ctx.get("retrieved_utc") or ctx.get("created_utc") or ""

    m = json.loads(Path(evidence_manifest).read_text(encoding="utf-8"))
    files = m.get("files", [])

    items_path = out_dir / "items.jsonl"
    count = 0

    meta: Dict[str, Any] = {
        "run_id": run_id,
        "source_id": source_id,
        "retrieved_utc": retrieved_utc,
        "tags": tags,
    }
    if extra_meta:
        meta.update(extra_meta)

    with items_path.open("w", encoding="utf-8") as f:
        for ent in files:
            sha = ent.get("sha256", "")
            size = ent.get("size_bytes", 0)
            raw_path = ent.get("path", "")
            ctype = _guess_content_type(raw_path)

            title = f"artifact:{sha[:12]}" if sha else "artifact:unknown"
            if include_names and raw_path:
                title = Path(raw_path).name

            item = {
                "schema": "mt.normalize.item.v1",
                "run_id": run_id,
                "source_id": source_id,
                "retrieved_utc": retrieved_utc,
                "title": title,
                "url": ctx.get("url", ""),
                "content_type": ctype,
                "raw_evidence_sha256": sha,
                "size_bytes": size,
                "tags": tags,
            }
            f.write(json.dumps(item, sort_keys=True) + "\n")
            count += 1

    (out_dir / "normalize.meta.json").write_text(
        json.dumps({"meta": meta, "count": count}, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return NormalizeResult(items_path=items_path, count=count)
