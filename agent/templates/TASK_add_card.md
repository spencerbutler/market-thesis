# TASK: Add a New Card to Dashboard Spec + Wire Placeholder

## Objective
Add a new card definition to the dashboard spec, place it on a page, and ensure the app renders it at least as a placeholder.

## Inputs
- new card_id: {{CARD_ID}}
- page_id: {{PAGE_ID}}
- title: {{TITLE}}
- type: {{CARD_TYPE}}
- parameters: {{PARAMETERS_JSON}}

## Hard Requirements (Guardrails)
- Maintain spec-driven layout.
- Must pass:
  - python3 scripts/validate_spec_integrity.py
  - python3 scripts/validate_manifest_latest.py
  - pre-commit run --all-files
- If card.type is not implemented yet, render a consistent placeholder (no crashes).

## Steps
1) Edit DASHBOARD_SPEC referenced by manifest_latest.json
2) Add card definition under dashboard.cards[card_id]
3) Insert card_id into dashboard.layout.pages where page.id == page_id
4) If renderer missing:
   - implement stub handler that displays parameters + "wired later" message
5) Run validations and pre-commit

## Deliverable
- Commit message: "Add dashboard card {{CARD_ID}} (type={{CARD_TYPE}}) to {{PAGE_ID}}"
