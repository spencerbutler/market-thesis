from dataclasses import dataclass
from typing import Dict, List

import pandas as pd
import yfinance as yf


@dataclass
class PriceSeries:
    dates: List[pd.Timestamp]
    close: List[float]
    as_of_utc: str


def fetch_prices(symbols: List[str], period: str = "2y", interval: str = "1d") -> Dict[str, PriceSeries]:
    """
    Robust single-ticker fetch. Avoids intermittent empty responses seen with multi-ticker yf.download([...]).
    """
    out: Dict[str, PriceSeries] = {}

    for sym in symbols:
        df = yf.download(
            sym,
            period=period,
            interval=interval,
            auto_adjust=True,
            progress=False,
            threads=False,
        )

        if df is None or df.empty:
            raise RuntimeError(f"yfinance returned empty data for {sym} (download failed).")

        if "Close" not in df.columns:
            raise RuntimeError(f"No Close column returned for {sym}.")

        df = df.dropna(subset=["Close"])

        out[sym] = PriceSeries(
            dates=list(df.index),
            close=[float(x) for x in df["Close"].tolist()],
            as_of_utc=pd.Timestamp.utcnow().isoformat(),
        )

    return out
