import json
from pathlib import Path

import streamlit as st
import pandas as pd

from adapters.market_data import fetch_prices
from utils.indicators import rs_vs_spy, sma, last_non_nan, status_from_rs_sma

REPO_ROOT = Path(__file__).resolve().parent

st.set_page_config(page_title="Market Thesis Dashboard", layout="wide")

st.title("Market Thesis Dashboard")
st.caption("Data-first monitoring UI. No narratives. No execution.")

# --- Load manifest_latest.json (repo root is source of truth) ---
manifest_file = REPO_ROOT.parent / "manifest_latest.json"
if not manifest_file.exists():
    st.error("manifest_latest.json not found in repo root (../manifest_latest.json).")
    st.stop()

manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
latest = manifest.get("latest", {})

col1, col2, col3, col4 = st.columns(4)
col1.metric("HR (source of truth)", latest.get("hr", ""))
col2.metric("JSON (derived)", latest.get("json", ""))
col3.metric("AGENT (derived)", latest.get("agent", ""))
col4.metric("Spec", latest.get("dashboard_spec", ""))

st.divider()

# --- Load dashboard spec from repo root ---
spec_path = REPO_ROOT.parent / latest.get("dashboard_spec", "")
if not spec_path.exists():
    st.error("Dashboard spec not found at path specified in manifest.")
    st.stop()

spec = json.loads(spec_path.read_text(encoding="utf-8"))

pages = spec.get("dashboard", {}).get("layout", {}).get("pages", [])
card_defs = spec.get("dashboard", {}).get("cards", {})

tab_titles = [p.get("title", p.get("id", "Page")) for p in pages] or ["Overview"]
tabs = st.tabs(tab_titles)

def render_card(card_id: str):
    card = card_defs.get(card_id, {})
    title = card.get("title", card_id)
    ctype = card.get("type", "unknown")

    with st.container(border=True):
        st.subheader(title)
        st.caption(f"Card type: {ctype}")

        if ctype in {"status_summary", "kpi_grid"}:
            st.info("Spec-driven card placeholder.")
        elif ctype in {"multi_series_chart", "chart_plus_thresholds"}:
            st.line_chart({"placeholder": [0, 1, 0, 1]})
        elif ctype in {"allocation_table"}:
            rows = card.get("rows", [])
            if rows:
                st.dataframe(rows, width="stretch")
            else:
                st.info("No rows defined in spec.")
        elif ctype in {"rule_list"}:
            rules = card.get("rules", [])
            if rules:
                for r in rules:
                    st.write(f"- **{r.get('id','rule')}**: IF `{r.get('if','')}` THEN `{r.get('then','')}` ({r.get('severity','')})")
            else:
                st.info("No rules defined in spec.")
        elif ctype in {"checklist"}:
            items = card.get("items", [])
            if items:
                for it in items:
                    st.checkbox(it.get("text", "Item"), value=False, key=f"chk_{card_id}_{it.get('text','')}")
            else:
                st.info("No checklist items in spec.")
        else:
            st.code(json.dumps(card, indent=2), language="json")

for idx, page in enumerate(pages or [{"id": "overview", "title": "Overview", "cards": []}]):
    with tabs[idx]:
        st.write(f"### {page.get('title','')}")
        st.caption(f"Page id: {page.get('id','')}")

        # --- Live Data Vertical Slice (always in Overview tab) ---
        if idx == 0:
            st.divider()
            st.header("Live Data: FCX vs SPY (Vertical Slice)")
            st.caption("Relative strength (daily returns) and RS SMA(50).")

            try:
                symbols = ["FCX", "SPY"]
                series = fetch_prices(symbols, period="2y", interval="1d")

                fcx = series["FCX"]
                spy = series["SPY"]

                n = min(len(fcx.close), len(spy.close))
                dates = fcx.dates[-n:]
                fcx_close = fcx.close[-n:]
                spy_close = spy.close[-n:]

                rs = rs_vs_spy(fcx_close, spy_close)
                rs_sma_50 = sma(rs, 50)

                rs_sma_last = last_non_nan(rs_sma_50)
                status, reason = status_from_rs_sma(rs_sma_last)

                c1, c2, c3 = st.columns(3)
                c1.metric("As-of (UTC)", fcx.as_of_utc)
                c2.metric("RS SMA(50) Status", status)
                c3.metric("RS SMA(50) Last", "N/A" if rs_sma_last != rs_sma_last else f"{rs_sma_last:.4%}")

                st.write(reason)

                df = pd.DataFrame({
                    "date": dates,
                    "FCX": fcx_close,
                    "SPY": spy_close,
                    "RS": rs,
                    "RS_SMA_50": rs_sma_50,
                }).set_index("date")

                st.subheader("FCX & SPY Close Prices")
                st.line_chart(df[["FCX", "SPY"]])

                st.subheader("Relative Strength vs SPY")
                st.line_chart(df[["RS", "RS_SMA_50"]])

            except Exception as e:
                st.error(f"Live data fetch failed: {e}")

        # --- Spec-driven cards ---
        cards = page.get("cards", [])
        if cards:
            for card_id in cards:
                render_card(card_id)
        else:
            st.info("No cards defined for this page in the dashboard spec.")

st.divider()
with st.expander("Diagnostics"):
    st.code(json.dumps(manifest, indent=2), language="json")
    st.code(json.dumps(spec.get("meta", {}), indent=2), language="json")

