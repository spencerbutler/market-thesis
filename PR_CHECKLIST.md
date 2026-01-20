# PR Checklist (market-thesis)

This checklist is the minimum standard for merging changes into `main`.

## 0) Scope & Intent
- [ ] PR title states *what changed* (not “updates”).
- [ ] PR description states *why* (problem) and *what* (solution).
- [ ] Diff is appropriately sized (prefer small PRs; if large, justify).

## 1) Integrity Guardrails (Required)
- [ ] `python3 scripts/validate_manifest_latest.py` passes
- [ ] `python3 scripts/validate_spec_integrity.py` passes
- [ ] `python3 scripts/validate_latest.py` passes (only required if HR/JSON/AGENT/manifest changed)
- [ ] `pre-commit run --all-files` passes

## 2) Dashboard Changes (If applicable)
- [ ] Dashboard remains **spec-driven** (no hardcoded page layout in Streamlit).
- [ ] Any new `page.cards[]` references exist in `dashboard.cards`.
- [ ] New/updated card types degrade gracefully:
  - [ ] Missing/partial market data → `UNKNOWN` + warning
  - [ ] No uncaught exceptions that crash the app
- [ ] Streamlit caches are used for data fetches (avoid repeated yfinance calls).
- [ ] App runs:
  - [ ] `python -m streamlit run dashboard/app.py` launches successfully
  - [ ] Overview page renders without red error blocks

## 3) Thesis Artifact Pipeline Changes (If applicable)
- [ ] HR markdown remains source of truth (no manual edits to derived JSON/AGENT).
- [ ] Regeneration performed via scripts (not by hand).
- [ ] `manifest_latest.json` updated only when “latest” changes.
- [ ] Versioned files follow naming convention:
  - `vX.Y-TYPE_YYYYMMDD.ext`

## 4) Documentation Updates (If applicable)
- [ ] CHANGELOG updated for user-visible behavior changes
- [ ] DECISION_LOG updated for architectural/process decisions
- [ ] README updated if onboarding steps change

## 5) Operational Readiness
- [ ] No secrets committed (API keys, tokens, cookies DBs).
- [ ] .gitignore covers local caches (.cache/, .tmp/, .venv/).
- [ ] CI passes on GitHub Actions.

## 6) Suggested Commit Message Patterns
- Dashboard: `Wire <card_id> (type=<type>)`
- Spec: `Add dashboard card <card_id> to <page_id>`
- Pipeline: `Regen thesis artifacts from <HR file>`
- Infra: `Add validator for <X>` / `Tighten pre-commit guardrails`

