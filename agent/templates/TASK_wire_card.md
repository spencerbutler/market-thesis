# TASK: Wire a Dashboard Card (Spec-Driven)

## Objective
Wire a specific dashboard card_id from DASHBOARD_SPEC into the Streamlit app so it renders real data/logic.

## Inputs
- card_id: {{CARD_ID}}
- spec file: manifest_latest.json -> latest.dashboard_spec
- expected card.type: {{CARD_TYPE}}

## Hard Requirements (Guardrails)
- Dashboard must remain spec-driven (do not hardcode layout in Streamlit).
- Do not crash on missing/partial market data:
  - show UNKNOWN status, warnings, and continue rendering the page.
- Maintain spec integrity:
  - Every page.cards[] id must exist in dashboard.cards
  - Must pass: python3 scripts/validate_spec_integrity.py
- Must pass pre-commit:
  - pre-commit run --all-files

## Steps
1) Locate the card definition in DASHBOARD_SPEC and confirm:
   - id, title, type, required parameters
2) Implement renderer:
   - Prefer `render_<type>(card_def)` in dashboard/app.py
   - If code grows, move to dashboard/components/<type>.py, keep app.py as dispatcher.
3) Add any new utility functions into dashboard/utils/ (no duplication).
4) Ensure graceful degradation:
   - wrap external fetches with try/except
   - if a symbol fails, mark it UNKNOWN and continue
5) Run:
   - python3 scripts/validate_manifest_latest.py
   - python3 scripts/validate_spec_integrity.py
   - pre-commit run --all-files
6) Deliverable:
   - Commit message: "Wire {{CARD_ID}} (type={{CARD_TYPE}})"

## Output Requirements
- Provide:
  - Files changed (list)
  - Key behavior notes (how it fails gracefully)
  - Exact commands to run locally
