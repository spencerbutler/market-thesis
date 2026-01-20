# TASK: Regenerate Thesis Artifacts (HR → JSON/AGENT + manifest)

## Objective
Regenerate derived artifacts from the latest HR thesis file.

## Inputs
- HR file: {{HR_FILENAME}} (e.g., v1.7-HR_20260118.md)

## Hard Requirements
- HR is source of truth.
- JSON/AGENT/manifest are derived only (no manual edits).
- Must pass:
  - python3 scripts/validate_latest.py
  - python3 scripts/validate_manifest_latest.py
  - pre-commit run --all-files

## Steps
1) Run regen script(s) to produce:
   - v*-JSON_*.json
   - v*-AGENT_*.json
   - manifest_latest.json updates (if needed)
2) Validate schemas.
3) Update CHANGELOG entries if version changes.
4) Commit with message:
   - "Regen thesis artifacts from {{HR_FILENAME}}"

## Deliverable
- List generated files + validation output.
