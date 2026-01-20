from typing import List


def rs_vs_spy(asset_close: List[float], bench_close: List[float]) -> List[float]:
    n = min(len(asset_close), len(bench_close))
    rs = [float("nan")] * n
    for i in range(1, n):
        a0, a1 = asset_close[i - 1], asset_close[i]
        b0, b1 = bench_close[i - 1], bench_close[i]
        if a0 == 0 or b0 == 0:
            continue
        rs[i] = (a1 / a0 - 1.0) - (b1 / b0 - 1.0)
    return rs


def sma(values: List[float], length: int) -> List[float]:
    out = [float("nan")] * len(values)
    window = []
    for i, v in enumerate(values):
        window.append(v)
        if len(window) > length:
            window.pop(0)
        valid = [x for x in window if x == x]
        if len(valid) == length:
            out[i] = sum(valid) / length
    return out


def last_non_nan(values: List[float]) -> float:
    for v in reversed(values):
        if v == v:
            return v
    return float("nan")


def status_from_rs_sma(rs_sma_last: float, yellow_band: float = 0.0002):
    if rs_sma_last != rs_sma_last:
        return "UNKNOWN", "No RS SMA value available."
    if rs_sma_last > yellow_band:
        return "GREEN", f"RS SMA(50) {rs_sma_last:.4%} > +{yellow_band:.4%}"
    if rs_sma_last < -yellow_band:
        return "RED", f"RS SMA(50) {rs_sma_last:.4%} < -{yellow_band:.4%}"
    return "YELLOW", f"RS SMA(50) {rs_sma_last:.4%} within ±{yellow_band:.4%}"
