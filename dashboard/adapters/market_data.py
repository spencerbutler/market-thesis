# dashboard/adapters/market_data.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List

import pandas as pd
import yfinance as yf


@dataclass
class PriceSeries:
    symbol: str
    dates: List[str]          # ISO dates
    close: List[float]
    as_of_utc: str


def fetch_prices(symbols: List[str], period: str = "2y", interval: str = "1d") -> Dict[str, PriceSeries]:
    """
    Fetch daily close prices via yfinance.
    - period: "1y", "2y", "5y", etc.
    - interval: "1d" recommended for dashboard
    """
    if not symbols:
        raise ValueError("symbols must not be empty")

    # yfinance accepts a space-separated string or list; we normalize to list
    data = yf.download(
        tickers=symbols,
        period=period,
        interval=interval,
        auto_adjust=False,
        progress=False,
        group_by="column",
        threads=True,
    )

    as_of_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    out: Dict[str, PriceSeries] = {}

    # Handle single vs multiple tickers shape differences
    if isinstance(data.columns, pd.MultiIndex):
        # MultiIndex: (Field, Ticker)
        for sym in symbols:
            if ("Close", sym) not in data.columns:
                raise RuntimeError(f"Missing Close for {sym}. Columns: {list(data.columns)[:10]}")
            s = data[("Close", sym)].dropna()
            out[sym] = PriceSeries(
                symbol=sym,
                dates=[d.date().isoformat() for d in s.index.to_pydatetime()],
                close=[float(x) for x in s.values],
                as_of_utc=as_of_utc,
            )
    else:
        # Single ticker: columns like Close/Open/...
        if "Close" not in data.columns:
            raise RuntimeError(f"Missing Close. Columns: {list(data.columns)}")
        s = data["Close"].dropna()
        sym = symbols[0]
        out[sym] = PriceSeries(
            symbol=sym,
            dates=[d.date().isoformat() for d in s.index.to_pydatetime()],
            close=[float(x) for x in s.values],
            as_of_utc=as_of_utc,
        )

    return out
