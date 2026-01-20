# Architecture (market-thesis)

## Overview
This repository maintains:
1) A versioned **Market Thesis** (HR markdown as the source of truth)
2) Derived machine-readable artifacts (JSON + AGENT JSON)
3) A spec-driven **Streamlit Dashboard** to monitor thesis health via live and macro data

Core principle: **HR markdown is authoritative. Everything else is derived or configured.**

---

## Repository Structure

### Thesis Artifacts (Versioned)
- `v*-HR_*.md`  
  Human-readable thesis. **Source of truth.**
- `v*-JSON_*.json`  
  Derived thesis JSON for software/agents.
- `v*-AGENT_*.json`  
  Derived agent-optimized JSON.
- `manifest_*.json`  
  Historical manifests.
- `manifest_latest.json`  
  **Stable entry point** to “current latest” artifacts.

### Dashboard
- `dashboard/app.py`  
  Streamlit entry point. Must be **spec-driven**.
- `dashboard/adapters/*`  
  External data access (yfinance, macro sources). Must handle messy real-world data.
- `dashboard/utils/*`  
  Indicators (RS vs SPY, SMA, status rules).
- `DASHBOARD_SPEC*.json`  
  UI contract: pages, card definitions, parameters.

### Tooling / Guardrails
- `scripts/validate_latest.py`  
  Validates latest thesis JSON/AGENT against schemas.
- `scripts/validate_spec_integrity.py`  
  Ensures dashboard pages only reference defined cards.
- `scripts/validate_manifest_latest.py`  
  Ensures manifest_latest points to real files.
- `.pre-commit-config.yaml`  
  Enforces validations before commit.
- `schemas/*.schema.json`  
  JSON schemas for thesis/agent artifacts.

---

## “Source of Truth” & Derivation Pipeline

### Source of Truth
- HR markdown (e.g., `v1.7-HR_20260118.md`) is the canonical thesis narrative and structure.

### Derived Artifacts
- JSON and AGENT JSON are generated from HR via scripts (e.g., regen tools) and must pass schema validation.

### Stable Pointer
- `manifest_latest.json` points to:
  - latest HR
  - latest JSON
  - latest AGENT
  - latest dashboard spec

All software (dashboard, agents) should read `manifest_latest.json` to find “current.”

---

## Dashboard Contract (Spec-Driven UI)

### The Spec
The dashboard spec defines:
- pages: `dashboard.layout.pages[]`
- cards: `dashboard.cards{card_id: {...}}`

Each page lists card IDs in display order:
- `pages[i].cards = ["thesis_health", "rotation_radar", ...]`

Spec integrity invariant:
- **Every card ID referenced by a page must exist in dashboard.cards.**

This is enforced by `scripts/validate_spec_integrity.py`.

### The App
`dashboard/app.py` must:
- read `manifest_latest.json` from repo root
- locate spec via `latest.dashboard_spec`
- render pages and cards from spec
- dispatch by card `type`

Renderer requirements:
- Validate required parameters
- Use cached data fetches
- Degrade gracefully:
  - Missing symbols → mark UNKNOWN and continue
  - Partial series alignment → warn and continue
  - No uncaught exceptions should crash the page

---

## Data Access Layer

### yfinance Reality
yfinance output can vary:
- standard OHLCV columns
- MultiIndex columns
- missing expected fields
- inconsistent alignment across symbols

Adapters must:
- normalize close series
- handle 1D/2D output safely
- avoid writing to read-only caches by configuring cache dirs if needed
- fail with explicit errors that the UI catches and displays without crashing

---

## Guardrails & Validation Model

### Pre-commit (Local)
Required hooks (recommended order):
1) validate manifest_latest.json
2) validate thesis artifacts (schemas)
3) validate dashboard spec integrity

### CI (GitHub Actions)
CI should run the same validations to prevent drift from passing locally.

### Philosophy
Guardrails allow aggressive iteration (including with Cursor agents) while preserving thesis integrity.

---

## Operational Modes

### “Before Market Open” Reliability Mode
Priority order:
1) App must render without crashing
2) Thesis Health and core slices work (FCX vs SPY, credit proxy)
3) Non-critical cards can remain placeholders temporarily

### “Development Mode”
- Wire placeholders incrementally
- Add stricter schema validation for dashboard spec over time
- Expand data sources and analytics carefully

---

## Decision Log
All durable architectural/process decisions should be recorded in:
- `DECISION_LOG.md`

Examples:
- Switching data provider
- Changing dashboard spec schema
- Changing regeneration pipeline
- Introducing new guardrails

