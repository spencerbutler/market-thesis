import json
from pathlib import Path

import pandas as pd
import streamlit as st

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


def render_card(card_id: str) -> None:
    card = card_defs.get(card_id, {})
    title = card.get("title", card_id)
    ctype = card.get("type", "unknown")

    with st.container(border=True):
        st.subheader(title)
        st.caption(f"Card type: {ctype}")

        # --- Spec placeholders / basic renderers ---
        if ctype in {"status_summary", "kpi_grid"}:
            st.info("Spec-driven card placeholder.")
            return

        if ctype in {"multi_series_chart", "chart_plus_thresholds"}:
            st.line_chart({"placeholder": [0, 1, 0, 1]})
            return

        if ctype == "allocation_table":
            rows = card.get("rows", [])
            if rows:
                st.dataframe(rows, width="stretch")
            else:
                st.info("No rows defined in spec.")
            return

        if ctype == "rule_list":
            rules = card.get("rules", [])
            if rules:
                for r in rules:
                    st.write(
                        f"- **{r.get('id','rule')}**: "
                        f"IF `{r.get('if','')}` THEN `{r.get('then','')}` "
                        f"({r.get('severity','')})"
                    )
            else:
                st.info("No rules defined in spec.")
            return

        if ctype == "checklist":
            items = card.get("items", [])
            if items:
                for it in items:
                    st.checkbox(
                        it.get("text", "Item"),
                        value=False,
                        key=f"chk_{card_id}_{it.get('text','')}",
                    )
            else:
                st.info("No checklist items in spec.")
            return

        # --- Live market vertical slice (spec-driven) ---
        if ctype == "live_market_slice":
            symbols = card.get("symbols", ["FCX", "SPY"])

            if not isinstance(symbols, list) or len(symbols) < 2:
                st.error("live_market_slice requires at least 2 symbols, e.g. ['FCX','SPY'].")
                return

            asset_sym = symbols[0]
            bench_sym = symbols[1]
            period = card.get("period", "2y")
            interval = card.get("interval", "1d")

            status_rule = card.get("status_rule", {}) or {}
            yellow_band = float(status_rule.get("yellow_band", 0.0002))

            if not isinstance(symbols, list) or len(symbols) < 2:
                st.error("live_market_slice requires at least 2 symbols, e.g. ['FCX','SPY'].")
                return

            # FIX: define asset_sym / bench_sym before any use
            asset_sym = symbols[0]
            bench_sym = symbols[1]

            try:
                series = fetch_prices([asset_sym, bench_sym], period=period, interval=interval)
                asset = series[asset_sym]
                bench = series[bench_sym]

                # Align by date (inner join) to avoid NaN propagation / mismatched trading days.
                df_asset = pd.DataFrame({"date": asset.dates, asset_sym: asset.close})
                df_bench = pd.DataFrame({"date": bench.dates, bench_sym: bench.close})
                df = (
                    df_asset.merge(df_bench, on="date", how="inner")
                    .dropna()
                    .sort_values("date")
                    .reset_index(drop=True)
                )

                st.caption(f"[debug] aligned rows={len(df)}; {asset_sym} rows={len(df_asset)}; {bench_sym} rows={len(df_bench)}")

                if len(df) < 80:
                    st.warning("Not enough aligned price history to compute RS SMA(50).")
                    return

                asset_close = df[asset_sym].tolist()
                bench_close = df[bench_sym].tolist()
                dates = df["date"].tolist()

                rs = rs_vs_spy(asset_close, bench_close)
                rs_sma_50 = sma(rs, 50)

                rs_sma_last = last_non_nan(rs_sma_50)
                status, reason = status_from_rs_sma(rs_sma_last, yellow_band=yellow_band)

                c1, c2, c3 = st.columns(3)
                c1.metric("As-of (UTC)", asset.as_of_utc)
                c2.metric("RS SMA(50) Status", status)
                c3.metric(
                    "RS SMA(50) Last",
                    "N/A" if rs_sma_last != rs_sma_last else f"{rs_sma_last:.4%}",
                )

                # Highly-visible status "badge" (Streamlit-native colors)
                if status == "GREEN":
                    st.success(reason)
                elif status == "YELLOW":
                    st.warning(reason)
                elif status == "RED":
                    st.error(reason)
                else:
                    st.info(reason)

                df_plot = pd.DataFrame(
                    {
                        "date": dates,
                        asset_sym: asset_close,
                        bench_sym: bench_close,
                        "RS": rs,
                        "RS_SMA_50": rs_sma_50,
                    }
                ).set_index("date")

                st.subheader(f"{asset_sym} & {bench_sym} Close Prices")
                st.line_chart(df_plot[[asset_sym, bench_sym]])

                st.subheader(f"Relative Strength: ({asset_sym} daily return - {bench_sym} daily return)")
                st.line_chart(df_plot[["RS", "RS_SMA_50"]])

            except Exception as e:
                st.error(f"Live data fetch failed: {e}")
            return

        # --- Fallback: show raw card JSON ---
        st.code(json.dumps(card, indent=2), language="json")


for idx, page in enumerate(pages or [{"id": "overview", "title": "Overview", "cards": []}]):
    with tabs[idx]:
        st.write(f"### {page.get('title','')}")
        st.caption(f"Page id: {page.get('id','')}")

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
