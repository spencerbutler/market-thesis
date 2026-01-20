import json
import sys
from pathlib import Path
from typing import List, Dict

import pandas as pd
import streamlit as st

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from adapters.market_data import fetch_prices
from utils.indicators import rs_vs_spy, sma, last_non_nan, status_from_rs_sma

REPO_ROOT = THIS_DIR.parent

st.set_page_config(page_title="Market Thesis Dashboard", layout="wide")
st.title("Market Thesis Dashboard")
st.caption("Data-first monitoring UI. No narratives. No execution.")


@st.cache_data(ttl=1800, show_spinner=False)
def cached_fetch(symbols: List[str], period: str, interval: str):
    return fetch_prices(symbols, period=period, interval=interval)


def rs_sma50(asset_sym: str, bench_sym: str, period="2y", interval="1d"):
    series = cached_fetch([asset_sym, bench_sym], period, interval)
    a = series[asset_sym]
    b = series[bench_sym]

    df = pd.DataFrame(
        {
            "date": a.dates,
            asset_sym: a.close,
            bench_sym: b.close,
        }
    ).dropna()

    if len(df) < 80:
        return None, None, "Not enough aligned data"

    rs = rs_vs_spy(df[asset_sym].tolist(), df[bench_sym].tolist())
    rs_sma_50 = sma(rs, 50)
    last = last_non_nan(rs_sma_50)

    df["RS"] = rs
    df["RS_SMA_50"] = rs_sma_50
    return df.set_index("date"), last, a.as_of_utc


manifest_path = REPO_ROOT / "manifest_latest.json"
if not manifest_path.exists():
    st.error("manifest_latest.json not found in repo root.")
    st.stop()

manifest = json.loads(manifest_path.read_text())
latest = manifest["latest"]

c1, c2, c3, c4 = st.columns(4)
c1.metric("HR (source of truth)", latest["hr"])
c2.metric("JSON (derived)", latest["json"])
c3.metric("AGENT (derived)", latest["agent"])
c4.metric("Spec", latest["dashboard_spec"])

st.divider()

spec_path = REPO_ROOT / latest["dashboard_spec"]
spec = json.loads(spec_path.read_text())

pages = spec["dashboard"]["layout"]["pages"]
cards = spec["dashboard"]["cards"]

tabs = st.tabs([p["title"] for p in pages])


def render_status_summary(card: Dict):
    symbols = card.get("rotation_symbols", ["XLB", "XLI", "XLP", "XLY", "IWM", "KRE"])
    bench = card.get("benchmark", "SPY")
    yellow = float(card.get("yellow_band", 0.0002))

    statuses = []
    for sym in symbols:
        df, last, _ = rs_sma50(sym, bench)
        if last is None:
            statuses.append("UNKNOWN")
            continue
        stt, _ = status_from_rs_sma(last, yellow)
        statuses.append(stt)

    if "RED" in statuses:
        st.error("Thesis Health: RED")
    elif "YELLOW" in statuses:
        st.warning("Thesis Health: YELLOW")
    elif statuses.count("GREEN") >= 2:
        st.success("Thesis Health: GREEN")
    else:
        st.info("Thesis Health: UNKNOWN")


def render_live_market_slice(card: Dict):
    asset, bench = card.get("symbols", ["FCX", "SPY"])
    yellow = float(card.get("status_rule", {}).get("yellow_band", 0.0002))

    df, last, asof = rs_sma50(asset, bench)
    if df is None:
        st.warning("Not enough data")
        return

    status, reason = status_from_rs_sma(last, yellow)

    c1, c2, c3 = st.columns(3)
    c1.metric("As-of (UTC)", asof)
    c2.metric("RS SMA(50)", status)
    c3.metric("Last", f"{last:.4%}")

    if status == "GREEN":
        st.success(reason)
    elif status == "YELLOW":
        st.warning(reason)
    elif status == "RED":
        st.error(reason)

    st.line_chart(df[[asset, bench]])
    st.line_chart(df[["RS", "RS_SMA_50"]])


for i, page in enumerate(pages):
    with tabs[i]:
        st.caption(f"Page id: {page['id']}")
        for cid in page["cards"]:
            card = cards[cid]
            with st.container(border=True):
                st.subheader(card["title"])
                if card["type"] == "status_summary":
                    render_status_summary(card)
                elif card["type"] == "live_market_slice":
                    render_live_market_slice(card)
                else:
                    st.info("Card type wired later.")
