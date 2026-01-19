#!/usr/bin/env python3
"""scripts/validate_latest.py

Used by pre-commit/CI to validate the latest HR thesis' derived artifacts.

Behavior:
- Finds the latest v*-HR_*.md (lexicographically sorted)
- Runs: python3 scripts/regen.py <LATEST_HR> --validate-only
- Exits non-zero on failure.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

def find_latest_hr(repo_root: Path) -> Path:
    hrs = sorted(repo_root.glob("v*-HR_*.md"))
    if not hrs:
        raise FileNotFoundError("No HR files found matching v*-HR_*.md")
    return hrs[-1]

def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    latest_hr = find_latest_hr(repo_root)
    cmd = ["python3", str(repo_root / "scripts" / "regen.py"), str(latest_hr), "--validate-only"]
    print(f"[pre-commit] Validating latest HR: {latest_hr.name}")
    res = subprocess.run(cmd, cwd=str(repo_root))
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
