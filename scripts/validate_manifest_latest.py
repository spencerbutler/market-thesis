#!/usr/bin/env python3
"""
Validate manifest_latest.json:
- Required keys exist
- Referenced files exist and are readable
"""

from pathlib import Path
import json
import sys

REQUIRED_KEYS = ["hr", "json", "agent", "dashboard_spec"]

def fail(msg: str) -> None:
    print(f"[FAIL] {msg}")
    sys.exit(1)

def main() -> None:
    repo_root = Path(".").resolve()
    manifest_path = repo_root / "manifest_latest.json"

    if not manifest_path.exists():
        fail("manifest_latest.json not found at repo root")

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as e:
        fail(f"Could not parse manifest_latest.json: {e}")

    latest = manifest.get("latest")
    if not isinstance(latest, dict):
        fail("manifest_latest.json missing 'latest' object")

    for key in REQUIRED_KEYS:
        val = latest.get(key)
        if not val:
            fail(f"manifest_latest.latest missing '{key}'")

        path = repo_root / val
        if not path.exists():
            fail(f"{key} file does not exist: {val}")

        if not path.is_file():
            fail(f"{key} path is not a file: {val}")

    print("[OK] manifest_latest.json integrity valid")

if __name__ == "__main__":
    main()
