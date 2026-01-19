# dashboard/utils/indicators.py
from __future__ import annotations

from typing import List, Tuple


def sma(values: List[float], window: int) -> List[float]:
    if window <= 0:
        raise ValueError("window must be > 0")
    if not values:
        return []

    out: List[float] = []
    running_sum = 0.0
    for i, v in enumerate(values):
        running_sum += v
        if i >= window:
            running_sum -= values[i - window]
        if i + 1 < window:
            out.append(float("nan"))
        else:
            out.append(running_sum / window)
    return out


def rs_vs_spy(asset_close: List[float], spy_close: List[float]) -> List[float]:
    """
    Relative strength series, expressed as "asset daily return - spy daily return".
    This matches the thesis intent (outperformance/underperformance signal).
    Output length = min(len(asset_close), len(spy_close)).
    """
    n = min(len(asset_close), len(spy_close))
    if n < 2:
        return [float("nan")] * n

    rs: List[float] = [float("nan")]
    for i in range(1, n):
        a0, a1 = asset_close[i - 1], asset_close[i]
        s0, s1 = spy_close[i - 1], spy_close[i]
        if a0 == 0 or s0 == 0:
            rs.append(float("nan"))
            continue
        a_ret = (a1 / a0) - 1.0
        s_ret = (s1 / s0) - 1.0
        rs.append(a_ret - s_ret)
    return rs


def last_non_nan(values: List[float]) -> float:
    for v in reversed(values):
        if v == v:  # NaN check
            return v
    return float("nan")


def status_from_rs_sma(rs_sma_last: float, yellow_band: float = 0.0002) -> Tuple[str, str]:
    """
    Simple status rule:
    - GREEN: rs_sma_last > +yellow_band
    - YELLOW: abs(rs_sma_last) <= yellow_band
    - RED: rs_sma_last < -yellow_band
    """
    if rs_sma_last != rs_sma_last:
        return ("UNKNOWN", "Insufficient data to compute RS SMA.")

    if rs_sma_last > yellow_band:
        return ("GREEN", f"RS SMA(50) positive ({rs_sma_last:.4%}).")
    if rs_sma_last < -yellow_band:
        return ("RED", f"RS SMA(50) negative ({rs_sma_last:.4%}).")
    return ("YELLOW", f"RS SMA(50) near zero ({rs_sma_last:.4%}).")
