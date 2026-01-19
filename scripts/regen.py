#!/usr/bin/env python3
"""scripts/regen.py

Regenerates derived artifacts (JSON + AGENT) from the canonical HR thesis and
validates them against JSON Schemas.

GOLDEN RULES
- HR (*.md) is the source of truth
- This script MUST NOT modify HR or DATA files
- JSON / AGENT outputs are derived and must be reproducible
- All generated outputs should validate against schemas/*

USAGE
  python scripts/regen.py v1.7-HR_20260118.md

OPTIONS
  --out-dir <dir>         Output directory (default: current directory)
  --schema-dir <dir>      Schema directory (default: ./schemas)
  --validate-only         Validate existing JSON/AGENT outputs inferred from HR (no regeneration)

NOTES
- This repo currently uses a placeholder transformation. Replace build_*() with the real
  HR → JSON mapping logic when ready.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

def infer_versions_from_hr(hr_path: Path) -> tuple[str, str, str]:
    """Return (base_version, json_filename, agent_filename)."""
    # HR filenames look like: v1.7-HR_20260118.md
    stem = hr_path.name.replace(".md", "")
    if "-HR_" not in stem:
        raise ValueError(f"HR filename must contain '-HR_': {hr_path.name}")
    base = stem.replace("-HR_", "_")  # v1.7_HR_20260118 (internal base)
    # We keep published artifacts as: v1.7-JSON_YYYYMMDD.json and v1.7-AGENT_YYYYMMDD.json
    published_base = stem.replace("-HR_", "-")  # v1.7-_20260118 (temporary)
    # Correct published naming:
    published_version_prefix = stem.split("-HR_")[0]  # v1.7
    date_suffix = stem.split("-HR_")[1]               # 20260118
    json_name = f"{published_version_prefix}-JSON_{date_suffix}.json"
    agent_name = f"{published_version_prefix}-AGENT_{date_suffix}.json"
    return (f"{published_version_prefix}_{date_suffix}", json_name, agent_name)

def build_thesis_json(hr_path: Path) -> dict:
    """Placeholder: build thesis JSON payload from HR."""
    # TODO: Replace with real parsing/structuring. Keep deterministic.
    return {
        "meta": {
            "document_type": "thesis",
            "source_hr": hr_path.name,
            "status": "REGENERATED",
            "note": "Placeholder transform: implement HR→JSON mapping"
        }
    }

def build_agent_json(hr_path: Path) -> dict:
    """Placeholder: build agent spec payload from HR."""
    # TODO: Replace with real parsing/structuring. Keep deterministic.
    return {
        "meta": {
            "document_type": "agent_spec",
            "source_hr": hr_path.name,
            "status": "REGENERATED",
            "note": "Placeholder transform: implement HR→AGENT mapping"
        },
        "permissions": {
            "read": ["*.md", "schemas/*.json"],
            "write": ["*-DATA_*.md", "*-JSON_*.json", "*-AGENT_*.json"]
        }
    }

def load_schema(schema_path: Path) -> dict:
    with schema_path.open("r", encoding="utf-8") as f:
        return json.load(f)

def validate_json(payload: dict, schema: dict, label: str) -> None:
    """Validate payload against schema using jsonschema (if available)."""
    try:
        import jsonschema  # type: ignore
    except Exception as e:
        print(f"[WARN] jsonschema not installed; skipping {label} schema validation. ({e})")
        return

    try:
        jsonschema.validate(instance=payload, schema=schema)
        print(f"[OK] {label} validates against schema")
    except jsonschema.ValidationError as ve:
        print(f"[FAIL] {label} schema validation failed:\n  {ve.message}")
        sys.exit(2)

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("hr_file", help="Canonical HR thesis markdown file (e.g., v1.7-HR_20260118.md)")
    ap.add_argument("--out-dir", default=".", help="Output directory (default: .)")
    ap.add_argument("--schema-dir", default="schemas", help="Schema directory (default: ./schemas)")
    ap.add_argument("--validate-only", action="store_true", help="Validate inferred outputs only (no regeneration)")
    args = ap.parse_args()

    hr_path = Path(args.hr_file).resolve()
    out_dir = Path(args.out_dir).resolve()
    schema_dir = Path(args.schema_dir).resolve()

    if not hr_path.exists():
        raise FileNotFoundError(f"HR file not found: {hr_path}")

    out_dir.mkdir(parents=True, exist_ok=True)

    _, json_name, agent_name = infer_versions_from_hr(hr_path)
    json_path = out_dir / json_name
    agent_path = out_dir / agent_name

    thesis_schema_path = schema_dir / "thesis.schema.json"
    agent_schema_path = schema_dir / "agent.schema.json"

    if not thesis_schema_path.exists():
        raise FileNotFoundError(f"Missing schema: {thesis_schema_path}")
    if not agent_schema_path.exists():
        raise FileNotFoundError(f"Missing schema: {agent_schema_path}")

    thesis_schema = load_schema(thesis_schema_path)
    agent_schema = load_schema(agent_schema_path)

    if args.validate_only:
        if not json_path.exists():
            raise FileNotFoundError(f"Missing inferred JSON output: {json_path}")
        if not agent_path.exists():
            raise FileNotFoundError(f"Missing inferred AGENT output: {agent_path}")
        thesis_payload = json.loads(json_path.read_text(encoding="utf-8"))
        agent_payload = json.loads(agent_path.read_text(encoding="utf-8"))
        validate_json(thesis_payload, thesis_schema, f"THESIS ({json_path.name})")
        validate_json(agent_payload, agent_schema, f"AGENT ({agent_path.name})")
        print("Validation complete.")
        return

    # Regenerate
    thesis_payload = build_thesis_json(hr_path)
    agent_payload = build_agent_json(hr_path)

    json_path.write_text(json.dumps(thesis_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    agent_path.write_text(json.dumps(agent_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Validate
    validate_json(thesis_payload, thesis_schema, f"THESIS ({json_path.name})")
    validate_json(agent_payload, agent_schema, f"AGENT ({agent_path.name})")

    print(f"Generated:\n  {json_path}\n  {agent_path}")

if __name__ == "__main__":
    main()
