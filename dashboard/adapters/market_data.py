"""Market data adapter (stub).

Goal:
- Fetch historical prices for required tickers
- Return time series in a normalized schema usable by UI components
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class PriceSeries:
    symbol: str
    dates: List[str]          # ISO date strings
    close: List[float]
    as_of_utc: str

def fetch_prices(symbols: List[str]) -> Dict[str, PriceSeries]:
    # TODO: Implement (e.g., yfinance, polygon, etc.)
    raise NotImplementedError("Implement market price fetching")
