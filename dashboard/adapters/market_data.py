from dataclasses import dataclass
from typing import Dict, List, Optional, Union

import numpy as np
import pandas as pd
import yfinance as yf


@dataclass
class PriceSeries:
    dates: List[pd.Timestamp]
    close: List[float]
    as_of_utc: str


def _to_1d_series(x: Union[pd.Series, pd.DataFrame, np.ndarray], index=None) -> pd.Series:
    """
    Convert yfinance 'close' extraction output into a clean 1D pandas Series.
    Handles:
      - Series
      - single-column DataFrame
      - ndarray (n,) or (n,1)
    """
    if isinstance(x, pd.Series):
        return x

    if isinstance(x, pd.DataFrame):
        # if single column, unwrap; otherwise try to find a Close-like column
        if x.shape[1] == 1:
            return x.iloc[:, 0]
        # fallback: take first column (shouldn't happen for single ticker)
        return x.iloc[:, 0]

    arr = np.asarray(x)
    if arr.ndim == 2 and arr.shape[1] == 1:
        arr = arr[:, 0]
    if arr.ndim != 1:
        raise ValueError(f"Close data must be 1D after normalization, got shape {arr.shape}")
    return pd.Series(arr, index=index)


def _extract_close(df: pd.DataFrame) -> Optional[Union[pd.Series, pd.DataFrame, np.ndarray]]:
    """
    Normalize yfinance output to something representing a Close series.

    Handles:
    - Standard OHLCV: 'Close'
    - Alternative: 'Adj Close'
    - MultiIndex columns: pick any column that has a level equal to 'Close' (or 'Adj Close')
    """
    if df is None or df.empty:
        return None

    # Plain columns
    for col in ("Close", "Adj Close", "close", "adjclose"):
        if col in df.columns:
            return df[col]

    # MultiIndex columns
    if isinstance(df.columns, pd.MultiIndex):
        # Look for any column tuple containing "close"
        close_cols = [c for c in df.columns if any(str(level).lower() == "close" for level in c)]
        if close_cols:
            return df[close_cols[0]]

        adj_cols = [c for c in df.columns if any(str(level).lower() in ("adj close", "adjclose") for level in c)]
        if adj_cols:
            return df[adj_cols[0]]

    return None


def fetch_prices(symbols: List[str], period: str = "2y", interval: str = "1d") -> Dict[str, PriceSeries]:
    out: Dict[str, PriceSeries] = {}

    for sym in symbols:
        df = yf.download(
            sym,
            period=period,
            interval=interval,
            auto_adjust=False,  # keep output predictable
            progress=False,
            threads=False,
        )

        if df is None or df.empty:
            raise RuntimeError(f"yfinance returned empty data for {sym}")

        close_raw = _extract_close(df)
        if close_raw is None:
            raise RuntimeError(f"Could not extract Close series for {sym}. Columns={list(df.columns)[:10]}")

        close = _to_1d_series(close_raw, index=getattr(close_raw, "index", df.index)).dropna()

        out[sym] = PriceSeries(
            dates=list(close.index),
            close=[float(v) for v in close.tolist()],
            as_of_utc=pd.Timestamp.utcnow().isoformat(),
        )

    return out
