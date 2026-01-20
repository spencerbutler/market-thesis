from __future__ import annotations

from pathlib import Path

APP_PY = r"""import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
import streamlit as st

# Ensure dashboard/ imports work whether you run from repo root or dashboard/
THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from adapters.market_data import fetch_prices  # noqa: E402
from utils.indicators import rs_vs_spy, sma, last_non_nan, status_from_rs_sma  # noqa: E402

REPO_ROOT = THIS_DIR.parent


# -------------------------
# Streamlit configuration
# -------------------------
st.set_page_config(page_title="Market Thesis Dashboard", layout="wide")
st.title("Market Thesis Dashboard")
st.caption("Data-first monitoring UI. No narratives. No execution.")


# -------------------------
# Helpers
# -------------------------
@st.cache_data(ttl=60 * 30, show_spinner=False)  # 30 min cache
def cached_fetch(symbols: List[str], period: str, interval: str):
    return fetch_prices(symbols, period=period, interval=interval)


def ensure_path(p: Path, err: str):
    if not p.exists():
        st.error(err)
        st.stop()


def rs_sma50_for_pair(asset_sym: str, bench_sym: str, period="2y", interval="1d") -> Tuple[pd.DataFrame, float, str, str]:
    """Return df with aligned series + RS + RS_SMA_50, and last RS_SMA_50."""
    series = cached_fetch([asset_sym, bench_sym], period=period, interval=interval)
    asset = series[asset_sym]
    bench = series[bench_sym]

    df_asset = pd.DataFrame({"date": asset.dates, asset_sym: asset.close})
    df_bench = pd.DataFrame({"date": bench.dates, bench_sym: bench.close})

    df = (
        df_asset.merge(df_bench, on="date", how="inner")
        .dropna()
        .sort_values("date")
        .reset_index(drop=True)
    )

    if len(df) < 80:
        return df, float("nan"), asset.as_of_utc, f"Not enough aligned rows ({len(df)})"

    asset_close = df[asset_sym].tolist()
    bench_close = df[bench_sym].tolist()

    rs = rs_vs_spy(asset_close, bench_close)
    rs_sma_50 = sma(rs, 50)
    last_val = last_non_nan(rs_sma_50)

    df_plot = pd.DataFrame(
        {
            "date": df["date"].tolist(),
            asset_sym: asset_close,
            bench_sym: bench_close,
            "RS": rs,
            "RS_SMA_50": rs_sma_50,
        }
    ).set_index("date")

    return df_plot, last_val, asset.as_of_utc, "OK"


def banner(status: str, msg: str):
    if status == "GREEN":
        st.success(msg)
    elif status == "YELLOW":
        st.warning(msg)
    elif status == "RED":
        st.error(msg)
    else:
        st.info(msg)


def compute_rotation_health(sectors: List[str], bench: str, yellow_band: float) -> Dict[str, Dict[str, str]]:
    """Compute RS SMA(50) status for each sector vs benchmark. Returns per-symbol status dict."""
    results = {}
    for sym in sectors:
        try:
            _, last_val, _, note = rs_sma50_for_pair(sym, bench)
            if note != "OK" or last_val != last_val:
                results[sym] = {"status": "UNKNOWN", "reason": note}
            else:
                stt, reason = status_from_rs_sma(last_val, yellow_band=yellow_band)
                results[sym] = {"status": stt, "reason": reason, "last": f"{last_val:.4%}"}
        except Exception as e:
            results[sym] = {"status": "UNKNOWN", "reason": str(e)}
    return results


def compute_credit_health(hyg: str, lqd: str, warn: float, danger: float, period="2y", interval="1d") -> Tuple[pd.DataFrame, str, str]:
    """
    Use ratio (HYG/LQD - 1) as a simple divergence proxy.
    thresholds are in percent points (e.g., 5.0, 7.0)
    """
    try:
        series = cached_fetch([hyg, lqd], period=period, interval=interval)
        h = pd.Series(series[hyg].close, index=pd.Index(series[hyg].dates, name="date"), name=hyg)
        l = pd.Series(series[lqd].close, index=pd.Index(series[lqd].dates, name="date"), name=lqd)

        df = pd.concat([h, l], axis=1).dropna().sort_index()
        if len(df) < 80:
            return df, "UNKNOWN", f"Not enough rows ({len(df)})"

        ratio = (df[hyg] / df[lqd] - 1.0) * 100.0
        df_out = pd.DataFrame({"Credit_Ratio_%": ratio})

        last = float(df_out["Credit_Ratio_%"].iloc[-1])
        if last >= danger:
            return df_out, "RED", f"Credit divergence {last:.2f}% ≥ danger {danger:.2f}%"
        if last >= warn:
            return df_out, "YELLOW", f"Credit divergence {last:.2f}% ≥ warn {warn:.2f}%"
        return df_out, "GREEN", f"Credit divergence {last:.2f}% < warn {warn:.2f}%"
    except Exception as e:
        return pd.DataFrame(), "UNKNOWN", str(e)


def overall_thesis_health(rotation: Dict[str, Dict[str, str]], credit_status: str) -> Tuple[str, str]:
    """
    Simple aggregate:
    - Any RED => RED
    - Else any YELLOW => YELLOW
    - Else GREEN if credit GREEN and at least 2 sectors GREEN
    - Else UNKNOWN
    """
    statuses = [v.get("status", "UNKNOWN") for v in rotation.values()]
    if "RED" in statuses or credit_status == "RED":
        return "RED", "At least one critical signal is RED."
    if "YELLOW" in statuses or credit_status == "YELLOW":
        return "YELLOW", "At least one signal is YELLOW. Monitor closely."
    green_count = sum(1 for s in statuses if s == "GREEN")
    if credit_status == "GREEN" and green_count >= 2:
        return "GREEN", "Rotation + credit conditions are supportive."
    return "UNKNOWN", "Insufficient confirmed signals for an aggregate call."


# -------------------------
# Load manifest + spec
# -------------------------
manifest_file = REPO_ROOT / "manifest_latest.json"
ensure_path(manifest_file, "manifest_latest.json not found in repo root.")
manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
latest = manifest.get("latest", {})

col1, col2, col3, col4 = st.columns(4)
col1.metric("HR (source of truth)", latest.get("hr", ""))
col2.metric("JSON (derived)", latest.get("json", ""))
col3.metric("AGENT (derived)", latest.get("agent", ""))
col4.metric("Spec", latest.get("dashboard_spec", ""))

st.divider()

spec_path = REPO_ROOT / latest.get("dashboard_spec", "")
ensure_path(spec_path, "Dashboard spec not found at path specified in manifest_latest.json.")
spec = json.loads(spec_path.read_text(encoding="utf-8"))

pages = spec.get("dashboard", {}).get("layout", {}).get("pages", [])
card_defs = spec.get("dashboard", {}).get("cards", {})

tab_titles = [p.get("title", p.get("id", "Page")) for p in pages] or ["Overview"]
tabs = st.tabs(tab_titles)


# -------------------------
# Card renderers
# -------------------------
def render_status_summary(card: dict):
    # Defaults if spec doesn't define them
    bench = card.get("benchmark", "SPY")
    sectors = card.get("rotation_symbols", ["XLB", "XLI", "XLU", "XLP", "XLY", "IWM", "KRE"])
    yellow_band = float(card.get("yellow_band", 0.0002))

    hyg = card.get("hyg", "HYG")
    lqd = card.get("lqd", "LQD")
    warn = float(card.get("credit_warn", 5.0))
    danger = float(card.get("credit_danger", 7.0))

    rotation = compute_rotation_health(sectors, bench, yellow_band=yellow_band)
    credit_df, credit_status, credit_reason = compute_credit_health(hyg, lqd, warn, danger)

    overall, msg = overall_thesis_health(rotation, credit_status)

    banner(overall, f"Thesis Health: {overall} — {msg}")

    with st.expander("Rotation details"):
        st.dataframe(
            pd.DataFrame.from_dict(rotation, orient="index").reset_index().rename(columns={"index": "symbol"}),
            width="stretch",
        )

    with st.expander("Credit details"):
        banner(credit_status, credit_reason)
        if not credit_df.empty:
            st.line_chart(credit_df, height=220)


def render_live_market_slice(card: dict):
    symbols = card.get("symbols", ["FCX", "SPY"])
    period = card.get("period", "2y")
    interval = card.get("interval", "1d")
    yellow_band = float((card.get("status_rule", {}) or {}).get("yellow_band", 0.0002))

    if not isinstance(symbols, list) or len(symbols) < 2:
        st.error("live_market_slice requires at least 2 symbols, e.g. ['FCX','SPY'].")
        return

    asset_sym, bench_sym = symbols[0], symbols[1]

    try:
        df_plot, last_val, asof, note = rs_sma50_for_pair(asset_sym, bench_sym, period=period, interval=interval)
        c1, c2, c3 = st.columns(3)
        c1.metric("As-of (UTC)", asof)

        if note != "OK" or last_val != last_val:
            c2.metric("RS SMA(50) Status", "UNKNOWN")
            c3.metric("RS SMA(50) Last", "N/A")
            st.warning(note)
            return

        status, reason = status_from_rs_sma(last_val, yellow_band=yellow_band)
        c2.metric("RS SMA(50) Status", status)
        c3.metric("RS SMA(50) Last", f"{last_val:.4%}")
        banner(status, reason)

        st.subheader(f"{asset_sym} & {bench_sym} Close Prices")
        st.line_chart(df_plot[[asset_sym, bench_sym]])

        st.subheader(f"Relative Strength: ({asset_sym} daily return - {bench_sym} daily return)")
        st.line_chart(df_plot[["RS", "RS_SMA_50"]])

    except Exception as e:
        st.error(f"Live data fetch failed: {e}")


def render_rotation_radar(card: dict):
    bench = card.get("benchmark", "SPY")
    sectors = card.get("symbols", ["XLB", "XLI", "XLU", "XLP", "XLY", "IWM", "KRE"])
    period = card.get("period", "2y")
    interval = card.get("interval", "1d")
    yellow_band = float(card.get("yellow_band", 0.0002))

    st.caption(f"RS SMA(50) vs {bench}. Computed from daily return differential.")

    frames = []
    status_rows = []
    for sym in sectors:
        try:
            df_plot, last_val, _, note = rs_sma50_for_pair(sym, bench, period=period, interval=interval)
            if note != "OK" or last_val != last_val:
                status_rows.append({"symbol": sym, "status": "UNKNOWN", "last": "N/A", "note": note})
                continue
            stt, reason = status_from_rs_sma(last_val, yellow_band=yellow_band)
            status_rows.append({"symbol": sym, "status": stt, "last": f"{last_val:.4%}", "note": reason})
            frames.append(df_plot[["RS_SMA_50"]].rename(columns={"RS_SMA_50": sym}))
        except Exception as e:
            status_rows.append({"symbol": sym, "status": "UNKNOWN", "last": "N/A", "note": str(e)})

    if frames:
        merged = pd.concat(frames, axis=1).dropna(how="all")
        st.line_chart(merged, height=300)

    st.dataframe(pd.DataFrame(status_rows), width="stretch")


def render_credit_panel(card: dict):
    hyg = card.get("hyg", "HYG")
    lqd = card.get("lqd", "LQD")
    warn = float(card.get("warn", 5.0))
    danger = float(card.get("danger", 7.0))
    period = card.get("period", "2y")
    interval = card.get("interval", "1d")

    df, stt, reason = compute_credit_health(hyg, lqd, warn, danger, period=period, interval=interval)
    banner(stt, reason)
    if df.empty:
        st.info("No credit data available.")
        return
    st.line_chart(df, height=300)
    st.caption(f"Thresholds: warn={warn:.2f}% danger={danger:.2f}% (higher is worse)")


def render_macro_panel(card: dict):
    symbols = card.get("symbols", ["^TNX", "DX-Y.NYB", "^VIX"])
    period = card.get("period", "2y")
    interval = card.get("interval", "1d")

    try:
        series = cached_fetch(symbols, period=period, interval=interval)
        frames = []
        for sym in symbols:
            s = series.get(sym)
            if not s or len(s.close) < 10:
                continue
            frames.append(pd.Series(s.close, index=pd.Index(s.dates, name="date"), name=sym))
        if not frames:
            st.info("No macro series available.")
            return
        df = pd.concat(frames, axis=1).dropna(how="all").sort_index()
        st.line_chart(df, height=300)
    except Exception as e:
        st.error(f"Macro panel failed: {e}")


def render_allocation_table(card: dict):
    rows = card.get("rows", [])
    if rows:
        st.dataframe(rows, width="stretch")
    else:
        st.info("No rows defined in spec.")


def render_card(card_id: str):
    card = card_defs.get(card_id, {})
    title = card.get("title", card_id)
    ctype = card.get("type", "unknown")

    with st.container(border=True):
        st.subheader(title)
        st.caption(f"Card type: {ctype}")

        if ctype == "status_summary":
            render_status_summary(card)
            return

        if ctype == "live_market_slice":
            render_live_market_slice(card)
            return

        if ctype == "multi_series_chart":
            # interpret as rotation radar if card requests RS
            if card.get("mode") == "rotation_radar" or "benchmark" in card:
                render_rotation_radar(card)
            else:
                st.info("multi_series_chart not yet bound for this card.")
            return

        if ctype == "chart_plus_thresholds":
            render_credit_panel(card)
            return

        if ctype == "macro_panel":
            render_macro_panel(card)
            return

        if ctype == "allocation_table":
            render_allocation_table(card)
            return

        # fallback
        st.code(json.dumps(card, indent=2), language="json")


# -------------------------
# Pages
# -------------------------
if not pages:
    pages = [{"id": "overview", "title": "Overview", "cards": []}]

for i, page in enumerate(pages):
    with tabs[i]:
        st.write(f"### {page.get('title','')}")
        st.caption(f"Page id: {page.get('id','')}")
        for card_id in page.get("cards", []):
            render_card(card_id)

st.divider()
with st.expander("Diagnostics"):
    st.code(json.dumps(manifest, indent=2), language="json")
    st.code(json.dumps(spec.get("meta", {}), indent=2), language="json")
"""

INDICATORS_PY = r"""from __future__ import annotations

from typing import List
import math


def rs_vs_spy(asset_close: List[float], bench_close: List[float]) -> List[float]:
    """
    Relative strength as daily return differential:
      RS[t] = (asset[t]/asset[t-1]-1) - (bench[t]/bench[t-1]-1)

    Returns list same length as inputs, with RS[0]=nan.
    """
    n = min(len(asset_close), len(bench_close))
    rs = [float("nan")] * n
    for i in range(1, n):
        a0, a1 = asset_close[i - 1], asset_close[i]
        b0, b1 = bench_close[i - 1], bench_close[i]
        if a0 == 0 or b0 == 0:
            rs[i] = float("nan")
            continue
        rs[i] = (a1 / a0 - 1.0) - (b1 / b0 - 1.0)
    return rs


def sma(values: List[float], length: int) -> List[float]:
    """
    Simple moving average over a list. Returns list same length with leading nans.
    """
    out = [float("nan")] * len(values)
    if length <= 0:
        return out
    window_sum = 0.0
    window = []
    for i, v in enumerate(values):
        window.append(v)
        if v == v:  # not nan
            window_sum += v
        if len(window) > length:
            old = window.pop(0)
            if old == old:
                window_sum -= old
        if len(window) == length:
            # average ignoring nans
            valid = [x for x in window if x == x]
            out[i] = sum(valid) / len(valid) if valid else float("nan")
    return out


def last_non_nan(values: List[float]) -> float:
    for v in reversed(values):
        if v == v:
            return v
    return float("nan")


def status_from_rs_sma(rs_sma_last: float, yellow_band: float = 0.0002):
    """
    GREEN: > +yellow_band
    RED: < -yellow_band
    YELLOW: inside band
    """
    if rs_sma_last != rs_sma_last:
        return "UNKNOWN", "No RS SMA value available."
    if rs_sma_last > yellow_band:
        return "GREEN", f"RS SMA(50) {rs_sma_last:.4%} > +{yellow_band:.4%}"
    if rs_sma_last < -yellow_band:
        return "RED", f"RS SMA(50) {rs_sma_last:.4%} < -{yellow_band:.4%}"
    return "YELLOW", f"RS SMA(50) {rs_sma_last:.4%} within ±{yellow_band:.4%}"
"""


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("WROTE", path)


def main():
    # Overwrite only the two necessary files
    write(Path("dashboard/app.py"), APP_PY)
    write(Path("dashboard/utils/indicators.py"), INDICATORS_PY)


if __name__ == "__main__":
    main()
