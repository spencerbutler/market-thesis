# Streamlit Dashboard Scaffold

This is a minimal Streamlit UI that reads:
- `manifest_latest.json` (stable entry point)
- `DASHBOARD_SPEC_v1.0_20260118.json` (UI contract)

## Quickstart

1. Copy into your repo root (or keep in a /dashboard-app folder).
2. Ensure these files are adjacent to `app.py`:
   - manifest_latest.json
   - DASHBOARD_SPEC_v1.0_20260118.json
   - (optional) latest thesis artifacts referenced by manifest

3. Create a virtualenv and install deps:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. Run:
```bash
streamlit run app.py
```

## Next Steps (recommended)
- Implement adapters in `dashboard/adapters/` to fetch and normalize:
  - market prices
  - commodities
  - macro series
  - credit proxies
- Replace placeholder charts with real series + thresholds from the spec.
