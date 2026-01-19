"""Indicator computations (stub).

Implement:
- RS vs SPY (50D)
- SMA 20/50/200
- Credit proxy trend
"""

from __future__ import annotations
from typing import List, Tuple

def sma(values: List[float], window: int) -> List[float]:
    if window <= 0:
        raise ValueError("window must be > 0")
    out = []
    for i in range(len(values)):
        if i + 1 < window:
            out.append(float("nan"))
        else:
            chunk = values[i+1-window:i+1]
            out.append(sum(chunk) / window)
    return out
