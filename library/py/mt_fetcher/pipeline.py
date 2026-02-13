"""
mt_fetcher.pipeline

Interfaces-only v1 (implementation incremental).

Pipeline stages:
  fetch -> evidence -> normalize -> summarize

No targeted private-residence automation by default.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

Mode = Literal["manual", "http", "api"]

@dataclass(frozen=True)
class RunConfig:
    run_id: str
    source_id: str
    out_root: Path
    mode: Mode = "manual"
    inuid: Optional[str] = None
    tags: Optional[List[str]] = None

@dataclass(frozen=True)
class RunResult:
    run_id: str
    source_id: str
    raw_dir: Path
    evidence_dir: Path
    normalize_dir: Path
    summary_dir: Path
    meta: Dict[str, Any]

def run(cfg: RunConfig) -> RunResult:
    """
    Execute pipeline v1.

    Expected directory layout under cfg.out_root:
      var/mt/fetch/raw/<run_id>/
      var/mt/evidence/<run_id>/
      var/mt/normalize/<run_id>/
      var/mt/summaries/<run_id>/

    For v1, this is intentionally a thin orchestrator. The "fetch" step can be
    a no-op in 'manual' mode (oper drops files into raw_dir).
    """
    out_root = Path(cfg.out_root)
    raw_dir = out_root / "var/mt/fetch/raw" / cfg.run_id
    evidence_dir = out_root / "var/mt/evidence" / cfg.run_id
    normalize_dir = out_root / "var/mt/normalize" / cfg.run_id
    summary_dir = out_root / "var/mt/summaries" / cfg.run_id

    # Create dirs (best-effort, deterministic)
    raw_dir.mkdir(parents=True, exist_ok=True)
    evidence_dir.mkdir(parents=True, exist_ok=True)
    normalize_dir.mkdir(parents=True, exist_ok=True)
    summary_dir.mkdir(parents=True, exist_ok=True)

    meta: Dict[str, Any] = {
        "mode": cfg.mode,
        "inuid": cfg.inuid,
        "tags": cfg.tags or [],
    }

    return RunResult(
        run_id=cfg.run_id,
        source_id=cfg.source_id,
        raw_dir=raw_dir,
        evidence_dir=evidence_dir,
        normalize_dir=normalize_dir,
        summary_dir=summary_dir,
        meta=meta,
    )
