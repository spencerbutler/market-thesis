"""
mt_fetcher.evidence

Interfaces-only v1 for hashing + manifest/provenance emission.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

@dataclass(frozen=True)
class EvidenceFile:
    path: str
    sha256: str
    size_bytes: int

@dataclass(frozen=True)
class EvidencePack:
    run_root: Path
    manifest_path: Path
    provenance_path: Path
    files: List[EvidenceFile]
    meta: Dict[str, Any]

def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def pack(run_root: Path, files: Iterable[Path], meta: Dict[str, Any]) -> EvidencePack:
    """
    Write:
      - manifest.json: list of files + sha256 + sizes
      - provenance.json: meta + timestamps + tool versions (filled later)

    Atomicity: best-effort (write temp then replace) — implement later if needed.
    """
    run_root = Path(run_root)
    run_root.mkdir(parents=True, exist_ok=True)

    ef: List[EvidenceFile] = []
    for fp in files:
        fp = Path(fp)
        if fp.is_file():
            ef.append(EvidenceFile(
                path=str(fp),
                sha256=sha256_file(fp),
                size_bytes=fp.stat().st_size,
            ))

    manifest_path = run_root / "manifest.json"
    provenance_path = run_root / "provenance.json"

    manifest = {"files": [e.__dict__ for e in ef]}
    provenance = {"meta": meta}

    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    provenance_path.write_text(json.dumps(provenance, indent=2, sort_keys=True), encoding="utf-8")

    return EvidencePack(
        run_root=run_root,
        manifest_path=manifest_path,
        provenance_path=provenance_path,
        files=ef,
        meta=meta,
    )
