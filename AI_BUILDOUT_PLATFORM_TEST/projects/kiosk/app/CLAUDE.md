# TCOS — AI Buildout Thesis Dashboard

## What this is

Dashboard for a Schwab thinkorswim account (57393667SCHW, "TCOS") holding an AI
infrastructure buildout portfolio. The thesis is a ground-up stack across seven
layers: Power Generation, Semiconductors, Data Center Infrastructure, Critical
Materials, Cybersecurity, Cloud/Software, and Mega-cap Anchors.

## Critical constraint

TCOS is explicitly separate from a second macro/capital-rotation dividend book
(CAT, SYY, LOW, O, PPL, PLD, DOW). **These two books must never be mixed** —
different holdings, different thesis, different tab/section if ever shown
together.

## Data hierarchy — always follow this order

1. **Fiscal.ai first.** Always check Fiscal.ai for live data before anything
   else. Use the latest Fiscal.ai skillset/API docs each time rather than
   relying on memory of field names — the schema has changed before.
2. **thinkorswim CSV exports** as fallback/verification when Fiscal.ai lags
   (common after heavy trading sessions) or for reconciliation.
3. **Web search** for anything Fiscal.ai doesn't carry — notably macro bond
   index data (HY OAS, IG OAS), which Fiscal.ai does not have.

## Current dashboard structure (as of the last claude.ai artifact version)

Tabbed React app, three tabs:
- **P&L** — position-level data, FIFO-reconstructed cost basis
- **Credit Spread Risks** — macro HY/IG OAS gauge, 2-panel layout, live
  trigger cards (progress bars for numeric thresholds, status pills for
  qualitative triggers), portfolio leverage checks from Fiscal.ai
  `company_ratios`, separate credit sync via web search
- **Critical Financials** — stub, not yet built out

Other features: market session indicator (Regular/Pre/After/Closed, computed
client-side from Eastern Time), font-size toggle (S/M/L/XL), null-safety
guards on all numeric formatters.

Day/swing trade book lives in the same artifact as a second tab, not a
separate artifact. General pattern: consolidate into one app with multiple
tabs/sections rather than splitting into separate deliverables.

## Known gotchas (learned the hard way — don't re-derive these)

- Fiscal.ai `terminal_get_portfolio` returns position data keyed by
  `tradingitemid` from the nested company object — **not** the stock's
  top-level `id`. Matching on the wrong key produces all misses.
- Fiscal.ai does not carry macro bond index data (HY/IG OAS) — use web search
  for that, not Fiscal.ai.
- `company_ratios` requires `companyKey` in `EXCHANGE_TICKER` format (e.g.
  `NASDAQ_AVGO`, `NYSE_DELL`) with `periodType: 'latest'`. Relevant leverage
  fields: `ratio_net_debt_to_ebitda`, `ratio_ebitda_to_interest_expense`,
  `ratio_debt_to_equity`, `ratio_current_ratio`, `calculated_total_debt`,
  `calculated_net_debt`.
- Fiscal.ai syncs can lag thinkorswim after heavy trading — CSV reconciliation
  is a necessary workflow step, not an edge case.

## Architecture note — this deployment vs. the original artifact

The original version lived as a claude.ai React artifact with a
"Claude-calls-Claude" pattern: client-side JS in the browser POSTs directly to
`api.anthropic.com` with the Fiscal.ai MCP attached, for live sync. **Don't
carry that pattern forward as-is** — it implies an API key reachable from
browser JS, which is a real exposure risk. In this deployment, Fiscal.ai sync
should move server-side (a scheduled job on this box, writing normalized data
to a small local store) so the dashboard itself just reads pre-synced data.

## Deployment

Runs on a dedicated kiosk ("touchy", 10.0.0.100) as the `claude` systemd
service `thesis-dashboard.service`, working directory
`/home/claude/projects/kiosk/app`. Source of truth is the WSL2 git repo on
Spencer's laptop (`~/git/market-thesis/AI_BUILDOUT_PLATFORM_TEST/projects/kiosk/app`);
deploys via `deploy-to-kiosk.sh` (rsync over SSH).

## Approach & principles

- Position reconciliation uses FIFO lot-matching against thinkorswim Account
  Trade History.
- Separate empirical fact from speculation; flag policy-dependent assumptions;
  maintain warnings on unverified claims.
- Data hierarchy above is not optional — Fiscal.ai first, CSV fallback, web
  search only for what Fiscal.ai structurally lacks.
