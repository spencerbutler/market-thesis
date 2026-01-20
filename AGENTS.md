# Agent Operating Contract (market-thesis)

## Mission
Maintain a spec-driven Market Thesis Dashboard and thesis artifact pipeline:
- HR markdown = source of truth
- JSON + AGENT JSON derived from HR
- manifest_latest.json is the stable entry point for software

## Files & Responsibilities
- v*-HR_*.md: authoritative thesis text
- v*-JSON_*.json: derived machine-readable thesis
- v*-AGENT_*.json: derived agent-oriented thesis
- manifest_latest.json: points to latest HR/JSON/AGENT/spec
- DASHBOARD_SPEC*.json: UI contract (pages/cards/types)
- dashboard/app.py: streamlit runner (spec-driven)
- dashboard/adapters/*: external data access (yfinance etc.)
- scripts/*: validation + regeneration

## Guardrails
- Never allow dashboard to crash due to missing symbols/data. Degrade gracefully:
  - UNKNOWN status, warnings, skip partial series
- Any spec edits must pass:
  - python3 scripts/validate_spec_integrity.py

## Development Workflow
1) Make the smallest change that works
2) Run:
   - python3 scripts/validate_spec_integrity.py
   - pre-commit run --all-files
3) Commit with an explicit message:
   - "Wire <card_id> renderer (type=<type>)"
4) Update CHANGELOG when adding/removing card types or behavior

## Card Implementation Pattern
- Spec defines:
  - id, title, type, parameters
- Code implements:
  - render_<type>(card_def)
- App maps:
  - card_def.type -> renderer
- Renderer responsibilities:
  - Fetch data (cached)
  - Validate inputs
  - Display charts + status
  - Never raise uncaught exceptions

## “Before Market Open” Mode
Prefer reliability over completeness:
- If data fetch fails: show explicit error + continue
- Keep Overview page functional with at least:
  - Thesis Health
  - FCX vs SPY live slice
  - Credit proxy (HYG/LQD)
