#!/usr/bin/env python3
"""
Validate DASHBOARD_SPEC integrity:
- Every card id referenced by pages[].cards[] must exist in dashboard.cards
- Basic required keys exist on cards
- Optional: warn on unused card defs
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


def load_json(path: Path) -> Dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise SystemExit(f"[FAIL] Could not parse JSON: {path} -> {e}")


def get_spec_path(repo_root: Path, spec_arg: str | None) -> Path:
    if spec_arg:
        return (repo_root / spec_arg).resolve()

    # Default: read manifest_latest.json -> latest.dashboard_spec
    manifest = repo_root / "manifest_latest.json"
    if manifest.exists():
        m = load_json(manifest)
        latest = m.get("latest", {}) or {}
        spec_rel = latest.get("dashboard_spec")
        if spec_rel:
            return (repo_root / spec_rel).resolve()

    # Fallback default
    return (repo_root / "DASHBOARD_SPEC_v1.0_20260118.json").resolve()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", default=None, help="Path to dashboard spec JSON (relative to repo root).")
    ap.add_argument("--repo-root", default=".", help="Repo root (default: .)")
    ap.add_argument("--strict", action="store_true", help="Fail on warnings (unused cards, missing optional fields).")
    args = ap.parse_args()

    repo_root = Path(args.repo_root).resolve()
    spec_path = get_spec_path(repo_root, args.spec)

    if not spec_path.exists():
        print(f"[FAIL] Spec file not found: {spec_path}")
        return 2

    spec = load_json(spec_path)

    # Basic structure
    try:
        dashboard = spec["dashboard"]
        pages: List[Dict[str, Any]] = dashboard["layout"]["pages"]
        cards: Dict[str, Dict[str, Any]] = dashboard["cards"]
    except Exception as e:
        print(f"[FAIL] Spec missing required structure under dashboard/layout/pages and dashboard/cards: {e}")
        return 2

    # Gather references
    referenced: Set[str] = set()
    missing: List[Tuple[str, str]] = []  # (page_id, card_id)
    for p in pages:
        pid = p.get("id", "<no id>")
        for cid in p.get("cards", []) or []:
            referenced.add(cid)
            if cid not in cards:
                missing.append((pid, cid))

    # Validate card definitions
    card_errors: List[str] = []
    for cid in referenced:
        c = cards.get(cid)
        if not c:
            continue
        # Required keys for a definition
        for k in ("title", "type"):
            if k not in c or c.get(k) in (None, ""):
                card_errors.append(f"Card '{cid}' missing required key '{k}'")

    # Unused definitions (warning)
    unused = sorted([cid for cid in cards.keys() if cid not in referenced])

    # Report
    ok = True
    if missing:
        ok = False
        print("[FAIL] Page references missing card definitions:")
        for pid, cid in missing:
            print(f"  - page='{pid}' card_id='{cid}' not found in dashboard.cards")

    if card_errors:
        ok = False
        print("[FAIL] Card definition errors:")
        for e in card_errors:
            print(f"  - {e}")

    if unused:
        print("[WARN] Unused card definitions (defined but not placed on any page):")
        for cid in unused:
            print(f"  - {cid}")
        if args.strict:
            ok = False

    if ok:
        print(f"[OK] Spec integrity valid: {spec_path.name}")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
