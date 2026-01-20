# Cursor Prompt Library (market-thesis)

Use these prompts in Cursor Composer/Chat. Replace bracketed tokens.

---

## Prompt: Wire a placeholder card to real logic
You are working in the repo `market-thesis`. Keep the dashboard spec-driven via manifest_latest.json -> latest.dashboard_spec.
Wire card_id `[CARD_ID]` with card.type `[CARD_TYPE]` to render real data and never crash on data errors.
If any symbol fetch fails, mark it UNKNOWN and continue. Run:
- python3 scripts/validate_manifest_latest.py
- python3 scripts/validate_spec_integrity.py
- pre-commit run --all-files
Deliver: minimal diff, list files changed, and exact run commands.

---

## Prompt: Fix spec integrity without changing layout
The dashboard spec has page.cards[] referencing missing card ids. Fix by adding placeholder card definitions in dashboard.cards for the missing ids. Do not remove cards from pages. Add type="placeholder" and a note. Ensure validate_spec_integrity passes.

---

## Prompt: Implement Rotation Radar card
Implement `multi_series_chart` renderer that plots RS_SMA_50 for symbols `[XLB,XLI,XLU,XLP,XLY,IWM,KRE]` vs SPY over 2y daily.
Show a small table: symbol, last RS_SMA_50, status (GREEN/YELLOW/RED) based on yellow_band.
Degrade gracefully per-symbol. Cache price fetches.

---

## Prompt: Implement Credit Conditions card
Implement `chart_plus_thresholds` renderer using symbols HYG and LQD (or spec-provided).
Compute ratio HYG/LQD or spread proxy; show thresholds, status, and chart.
Graceful degradation.

---

## Prompt: Implement Target Allocation card
Implement `allocation_table` renderer reading `targets` from the card definition and rendering a table.
Optional: compare current holdings from latest JSON if available; otherwise show targets only.

---

## Prompt: Add a new card and wire placeholder
Add a new card_id `[CARD_ID]` to page `[PAGE_ID]` in the dashboard spec, with title `[TITLE]` and type `[CARD_TYPE]`.
If renderer is missing, add placeholder support so the page renders.
Run validations and pre-commit.

