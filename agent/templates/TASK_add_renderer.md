# TASK: Implement a New Card Type Renderer

## Objective
Implement rendering support for a new `card.type` used in the dashboard spec.

## Inputs
- card.type: {{CARD_TYPE}}
- examples of cards using it: {{CARD_IDS_LIST}}
- desired behavior: {{BEHAVIOR_DESCRIPTION}}

## Hard Requirements
- Must be spec-driven (renderer consumes card parameters).
- Must degrade gracefully on data issues (UNKNOWN + warning).
- Must not break existing card types.
- Must pass:
  - python3 scripts/validate_spec_integrity.py
  - pre-commit run --all-files

## Implementation Rules
- Add `render_<card_type>(card_def)` and register it in dispatcher.
- Validate required parameters up front and raise user-friendly Streamlit errors (not exceptions).
- Use caching for data fetch.
- Keep charts readable and consistent (dark-mode friendly).

## Deliverable
- Commit message: "Add renderer for card.type={{CARD_TYPE}}"
