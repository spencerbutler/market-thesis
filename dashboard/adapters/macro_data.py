"""Macro data adapter (stub)."""

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class MacroSeries:
    series: str
    dates: List[str]
    values: List[float]
    as_of_utc: str

def fetch_macro(series_ids: List[str]) -> Dict[str, MacroSeries]:
    # TODO: Implement (e.g., FRED, BLS API, BEA, etc.)
    raise NotImplementedError("Implement macro fetching")
