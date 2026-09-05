import React, { useMemo, useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Standard 3-state status convention (Nagios-style) used everywhere in this
// dashboard: GOOD = bullish/healthy, WARN = neutral/caution, BAD = bearish/risk.
// ---------------------------------------------------------------------------
const STATUS = {
  good: "#2ECC71",
  warn: "#F1C40F",
  bad: "#E74C3C",
  mute: "#565d69",
};
const statusLabel = (s) => (s === "good" ? "Bullish" : s === "bad" ? "Bearish" : s === "warn" ? "Neutral" : "—");

const CASH = 61070.89;
const NET_LIQ = 96383.65;
const STATEMENT_WINDOW = "Aug 3–10, 2026";

const LAYER_META = {
  Power: { color: "#E8A33D", label: "Power" },
  Semis: { color: "#4FC3D9", label: "Semis" },
  "DC Infra": { color: "#6E8CC7", label: "DC Infra" },
  Materials: { color: "#B5703B", label: "Materials" },
  Cyber: { color: "#D9695F", label: "Cyber" },
  Cloud: { color: "#9B87D9", label: "Cloud" },
  "Mega-cap": { color: "#D4B94A", label: "Mega-cap" },
  "Off-thesis": { color: "#565d69", label: "Off-thesis" },
};

const POSITIONS = [
  { ticker: "SNOW", desc: "Snowflake", layer: "Cloud", qty: 10, avgCost: 325.356, opened: "2026-08-06T10:39:59", mark: 336.0, value: 3360.0, cost: 3253.56, gain: 106.44, gainPct: 3.27 },
  { ticker: "NET", desc: "Cloudflare", layer: "Cyber", qty: 10, avgCost: 303.575, opened: "2026-08-10T09:23:52", mark: 310.76, value: 3107.6, cost: 3035.75, gain: 71.85, gainPct: 2.37 },
  { ticker: "PANW", desc: "Palo Alto Networks", layer: "Cyber", qty: 7, avgCost: 360.6607, opened: "2026-08-06T12:04:16", mark: 385.67, value: 2699.69, cost: 2524.62, gain: 175.07, gainPct: 6.93 },
  { ticker: "AVGO", desc: "Broadcom", layer: "Semis", qty: 6, avgCost: 425.6442, opened: "2026-08-07T09:27:13", mark: 423.91, value: 2543.46, cost: 2553.87, gain: -10.41, gainPct: -0.41 },
  { ticker: "CRWD", desc: "CrowdStrike", layer: "Cyber", qty: 10, avgCost: 211.735, opened: "2026-08-06T14:42:54", mark: 225.25, value: 2252.5, cost: 2117.35, gain: 135.15, gainPct: 6.38 },
  { ticker: "NTAP", desc: "NetApp", layer: "DC Infra", qty: 10, avgCost: 189.465, opened: "2026-08-06T14:08:41", mark: 199.21, value: 1992.1, cost: 1894.65, gain: 97.45, gainPct: 5.14 },
  { ticker: "CRM", desc: "Salesforce", layer: "Cloud", qty: 10, avgCost: 193.29, opened: "2026-08-07T09:37:23", mark: 197.12, value: 1971.2, cost: 1932.9, gain: 38.3, gainPct: 1.98 },
  { ticker: "ZS", desc: "Zscaler", layer: "Cyber", qty: 10, avgCost: 161.1527, opened: "2026-08-06T08:56:11", mark: 177.1, value: 1771.0, cost: 1611.53, gain: 159.47, gainPct: 9.9 },
  { ticker: "PLTR", desc: "Palantir", layer: "Cloud", qty: 10, avgCost: 156.315, opened: "2026-08-06T10:39:28", mark: 173.26, value: 1732.6, cost: 1563.15, gain: 169.45, gainPct: 10.84 },
  { ticker: "USAR", desc: "USA Rare Earth", layer: "Off-thesis", qty: 80, avgCost: 18.1209, opened: "2026-08-10T15:13:10", mark: 17.55, value: 1404.0, cost: 1449.67, gain: -45.67, gainPct: -3.15 },
  { ticker: "SPCX", desc: "SpaceX", layer: "Mega-cap", qty: 10, avgCost: 111.345, opened: "2026-08-06T08:36:02", mark: 136.73, value: 1367.3, cost: 1113.45, gain: 253.85, gainPct: 22.8 },
  { ticker: "MP", desc: "MP Materials", layer: "Materials", qty: 25, avgCost: 53.3609, opened: "2026-08-07T12:49:05", mark: 54.66, value: 1366.5, cost: 1334.02, gain: 32.48, gainPct: 2.43 },
  { ticker: "DELL", desc: "Dell Technologies", layer: "DC Infra", qty: 2, avgCost: 435.18, opened: "2026-08-07T10:23:33", mark: 461.12, value: 922.24, cost: 870.36, gain: 51.88, gainPct: 5.96 },
  { ticker: "TXN", desc: "Texas Instruments", layer: "Off-thesis", qty: 3, avgCost: 281.8192, opened: "2026-08-10T12:11:23", mark: 282.48, value: 847.44, cost: 845.46, gain: 1.98, gainPct: 0.23 },
  { ticker: "APH", desc: "Amphenol", layer: "Off-thesis", qty: 5, avgCost: 170.1614, opened: "2026-08-10T09:37:28", mark: 168.01, value: 840.05, cost: 850.81, gain: -10.76, gainPct: -1.26 },
  { ticker: "FTNT", desc: "Fortinet", layer: "Cyber", qty: 5, avgCost: 163.425, opened: "2026-08-07T09:57:28", mark: 164.43, value: 822.15, cost: 817.12, gain: 5.03, gainPct: 0.61 },
  { ticker: "GLW", desc: "Corning", layer: "DC Infra", qty: 5, avgCost: 162.0358, opened: "2026-08-07T09:25:45", mark: 158.65, value: 793.25, cost: 810.18, gain: -16.93, gainPct: -2.09 },
  { ticker: "NVDA", desc: "Nvidia", layer: "Off-thesis", qty: 3, avgCost: 219.765, opened: "2026-08-10T11:15:16", mark: 219.05, value: 657.15, cost: 659.29, gain: -2.14, gainPct: -0.33 },
  { ticker: "NTNX", desc: "Nutanix", layer: "DC Infra", qty: 10, avgCost: 62.4297, opened: "2026-08-07T12:15:12", mark: 64.46, value: 644.6, cost: 624.3, gain: 20.3, gainPct: 3.25 },
  { ticker: "S", desc: "SentinelOne", layer: "Cyber", qty: 25, avgCost: 21.8997, opened: "2026-08-07T11:40:32", mark: 22.23, value: 555.75, cost: 547.49, gain: 8.26, gainPct: 1.51 },
  { ticker: "OKLO", desc: "Oklo", layer: "Power", qty: 11, avgCost: 45.4927, opened: "2026-08-07T11:49:56", mark: 44.52, value: 489.72, cost: 500.42, gain: -10.7, gainPct: -2.14 },
  { ticker: "CRDO", desc: "Credo Technology", layer: "Off-thesis", qty: 2, avgCost: 244.4525, opened: "2026-08-10T12:18:01", mark: 242.29, value: 484.58, cost: 488.9, gain: -4.32, gainPct: -0.88 },
  { ticker: "NTSK", desc: "Netskope", layer: "Cyber", qty: 30, avgCost: 14.629, opened: "2026-08-07T12:15:27", mark: 15.67, value: 470.1, cost: 438.87, gain: 31.23, gainPct: 7.12 },
  { ticker: "MRVL", desc: "Marvell", layer: "Semis", qty: 2, avgCost: 216.15, opened: "2026-08-07T11:33:27", mark: 211.38, value: 422.76, cost: 432.3, gain: -9.54, gainPct: -2.21 },
  { ticker: "MCHP", desc: "Microchip Technology", layer: "Semis", qty: 5, avgCost: 82.4859, opened: "2026-08-07T14:20:35", mark: 82.18, value: 410.9, cost: 412.43, gain: -1.53, gainPct: -0.37 },
  { ticker: "AAOI", desc: "Applied Optoelectronics", layer: "Semis", qty: 3, avgCost: 132.16, opened: "2026-08-10T10:09:03", mark: 132.4, value: 397.2, cost: 396.48, gain: 0.72, gainPct: 0.18 },
  { ticker: "ANET", desc: "Arista Networks", layer: "DC Infra", qty: 2, avgCost: 192.0325, opened: "2026-08-10T10:10:22", mark: 192.51, value: 385.02, cost: 384.06, gain: 0.95, gainPct: 0.25 },
  { ticker: "UEC", desc: "Uranium Energy Corp", layer: "Off-thesis", qty: 30, avgCost: 11.4214, opened: "2026-08-10T16:05:14", mark: 11.44, value: 343.2, cost: 342.64, gain: 0.56, gainPct: 0.16 },
  { ticker: "FIVN", desc: "Five9", layer: "Cloud", qty: 5, avgCost: 33.56, opened: "2026-08-07T14:19:36", mark: 34.48, value: 172.4, cost: 167.8, gain: 4.6, gainPct: 2.74 },
  { ticker: "POET", desc: "POET Technologies", layer: "Off-thesis", qty: 10, avgCost: 8.5981, opened: "2026-08-10T12:04:08", mark: 8.63, value: 86.3, cost: 85.98, gain: 0.32, gainPct: 0.37 },
];

const EXITED = ["VST", "SMR", "BE", "INTC", "WOLF", "COHR", "VRT", "UUUU", "OKTA", "DDOG", "ADBE", "AAPL", "GOOGL"];
const ALL_TICKERS = POSITIONS.map((p) => p.ticker);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
const fmtUsd = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUsd0 = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtOpened = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const fmtDebt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toLocaleString("en-US")}`;
};
const fmtVol = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};
// Full weekday + month + ordinal day + year, e.g. "Tuesday, Aug 11th, 2026"
const ordinal = (d) => {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};
const fmtFullDate = (date) => {
  if (!date) return "never";
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${weekday}, ${month} ${day}${ordinal(day)}, ${year} — ${time}`;
};
function timeAgo(date) {
  if (!date) return "never";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function toCSV(columns, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(c.get(r))).join(",")).join("\n");
  return `${header}\n${body}`;
}
function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function ExportButton({ columns, rows, filename }) {
  return (
    <button
      style={styles.exportBtn}
      onClick={() => downloadCSV(filename, toCSV(columns.filter((c) => c.visible !== false), rows))}
      title="Export visible columns to CSV"
    >
      ⬇ CSV
    </button>
  );
}

// ---------------------------------------------------------------------------
// Column picker: show/hide + reorder (up/down) — reused by every data table
// ---------------------------------------------------------------------------
function useColumnConfig(allColumns, defaultVisibleKeys) {
  const [order, setOrder] = useState(allColumns.map((c) => c.key));
  const [visible, setVisible] = useState(() => {
    const v = {};
    allColumns.forEach((c) => { v[c.key] = defaultVisibleKeys.includes(c.key); });
    return v;
  });
  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));
  const move = (key, dir) => {
    setOrder((o) => {
      const idx = o.indexOf(key);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= o.length) return o;
      const next = [...o];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };
  const orderedColumns = order.map((k) => allColumns.find((c) => c.key === k)).filter(Boolean);
  const visibleColumns = orderedColumns.filter((c) => visible[c.key]);
  return { orderedColumns, visibleColumns, visible, toggle, move };
}

function ColumnPicker({ orderedColumns, visible, toggle, move }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button style={styles.colBtn} onClick={() => setOpen((o) => !o)}>⚙ Columns</button>
      {open && (
        <div style={styles.colDropdown}>
          {orderedColumns.map((c, i) => (
            <div key={c.key} style={styles.colRow}>
              <label style={styles.colLabel}>
                <input type="checkbox" checked={!!visible[c.key]} onChange={() => toggle(c.key)} style={{ marginRight: 7 }} />
                {c.label}
              </label>
              <div style={styles.colMoveBtns}>
                <button style={styles.colMoveBtn} onClick={() => move(c.key, -1)} disabled={i === 0}>↑</button>
                <button style={styles.colMoveBtn} onClick={() => move(c.key, 1)} disabled={i === orderedColumns.length - 1}>↓</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credit spread data (macro) — ICE BofA HY/IG OAS via FRED, Aug 7, 2026 snapshot
// ---------------------------------------------------------------------------
const CREDIT_DEFAULT = {
  hyOas: 270,
  hyOasDate: "Aug 7, 2026",
  igOas: 81,
  bbbOas: 100,
  hyIgRatio: 3.5,
  history: [
    { d: "Jul 24", v: 279 }, { d: "Jul 27", v: 281 }, { d: "Jul 28", v: 284 },
    { d: "Jul 29", v: 287 }, { d: "Jul 30", v: 284 }, { d: "Jul 31", v: 285 },
    { d: "Aug 3", v: 278 }, { d: "Aug 4", v: 273 }, { d: "Aug 5", v: 275 },
    { d: "Aug 6", v: 271 }, { d: "Aug 7", v: 270 },
  ],
  levels: [
    { v: 233, label: "All-time tight" },
    { v: 300, label: "Carry / repricing line" },
    { v: 350, label: "Late-cycle complacency" },
    { v: 600, label: "Stress" },
    { v: 800, label: "Recession threshold" },
  ],
};
function creditZone(hyOas) {
  if (hyOas < 300) return "good";
  if (hyOas < 600) return "warn";
  return "bad";
}

// ---------------------------------------------------------------------------
// Portfolio leverage check — corrected Aug 11 to Fiscal.ai's quarterly-basis
// EBITDA convention (validated against user-provided Fiscal.ai screenshot).
// ---------------------------------------------------------------------------
const LEVERAGE = [
  { ticker: "AVGO", layer: "Semis", netDebtEbitda: 3.5, ebitdaInterest: 16.7, debtEquity: 0.74, currentRatio: 2.24, capexToRev: 1.0, fcfMargin: 46.3, grossDebt: 64907000000, netDebt: 45279000000, asOf: "2026-05-03" },
  { ticker: "DELL", layer: "DC Infra", netDebtEbitda: 4.4, ebitdaInterest: null, debtEquity: -22.19, currentRatio: 0.95, capexToRev: 2.2, fcfMargin: 7.1, grossDebt: 31161000000, netDebt: 19583000000, asOf: "2026-05-01", note: "Negative equity from buybacks, not distress" },
  { ticker: "GLW", layer: "DC Infra", netDebtEbitda: 5.4, ebitdaInterest: 11.6, debtEquity: 0.59, currentRatio: 1.81, capexToRev: 9.4, fcfMargin: 28.7, grossDebt: 8424000000, netDebt: 5920000000, asOf: "2026-06-30" },
  { ticker: "MCHP", layer: "Semis", netDebtEbitda: 10.3, ebitdaInterest: 10.1, debtEquity: 0.83, currentRatio: 1.92, capexToRev: 0.9, fcfMargin: 33.5, grossDebt: 5361300000, netDebt: 5089000000, asOf: "2026-06-30" },
  { ticker: "MRVL", layer: "Semis", netDebtEbitda: 1.7, ebitdaInterest: 12.5, debtEquity: 0.27, currentRatio: 3.28, capexToRev: 6.4, fcfMargin: 20.0, grossDebt: 4961300000, netDebt: 1117700000, asOf: "2026-05-02" },
  { ticker: "ANET", layer: "DC Infra", netDebtEbitda: null, ebitdaInterest: null, debtEquity: null, currentRatio: 2.96, capexToRev: 1.0, fcfMargin: 34.7, grossDebt: 0, netDebt: -13343300000, asOf: "2026-06-30" },
  { ticker: "NTNX", layer: "DC Infra", netDebtEbitda: null, ebitdaInterest: null, debtEquity: -2.06, currentRatio: 1.78, capexToRev: 1.5, fcfMargin: 28.0, grossDebt: 1528893000, netDebt: -489010000, asOf: "2026-04-30" },
  { ticker: "NTAP", layer: "DC Infra", netDebtEbitda: null, ebitdaInterest: null, debtEquity: 1.84, currentRatio: 1.44, capexToRev: 2.6, fcfMargin: 46.2, grossDebt: 2487000000, netDebt: -1097000000, asOf: "2026-04-24" },
  { ticker: "MP", layer: "Materials", netDebtEbitda: null, ebitdaInterest: null, debtEquity: 0.39, currentRatio: 9.51, capexToRev: null, fcfMargin: null, grossDebt: 934583000, netDebt: -518056000, asOf: "2026-06-30", note: "Thin/negative EBITDA base makes several ratios noisy; funded mainly by equity + gov't-backed financing, not leverage" },
  { ticker: "OKLO", layer: "Power", netDebtEbitda: null, ebitdaInterest: null, debtEquity: 0.0009, currentRatio: 48.46, capexToRev: null, fcfMargin: null, grossDebt: 3959000, netDebt: -2461199000, asOf: "2026-06-30", note: "Pre-revenue; funded almost entirely by cash, not debt" },
  { ticker: "S", layer: "Cyber", netDebtEbitda: null, ebitdaInterest: null, debtEquity: null, currentRatio: 1.44, capexToRev: 0.2, fcfMargin: 13.8, grossDebt: null, netDebt: -656787000, asOf: "2026-04-30" },
  { ticker: "PANW", layer: "Cyber", netDebtEbitda: null, ebitdaInterest: null, debtEquity: 0.07, currentRatio: 0.86, capexToRev: 2.8, fcfMargin: 26.2, grossDebt: 2071000000, netDebt: -1040000000, asOf: "2026-04-30" },
];

function leverageFlag(row) {
  if (row.netDebt <= 0) return { label: "Net Cash", status: "good" };
  if (row.netDebtEbitda === null) return { label: "N/M", status: "mute" };
  if (row.netDebtEbitda < 2) return { label: "Healthy", status: "good" };
  if (row.netDebtEbitda < 4) return { label: "Watch", status: "warn" };
  return { label: "Elevated", status: "bad" };
}
const statusColor = (s) => (s === "mute" ? STATUS.mute : STATUS[s]);

// ---------------------------------------------------------------------------
// Models — shared comparison universe. Hyperscale is the first model;
// Ad-hoc Compare uses the exact same column set/table so results are
// directly comparable across models.
// ---------------------------------------------------------------------------
const HYPERSCALE_MODEL = {
  name: "Hyperscale",
  refDate: "Aug 3, 2026 daily open",
  positions: [
    { ticker: "NVDA", company: "Nvidia", openAug3: 197.51, current: 217.55, currentAsOf: "Aug 11 open", netDebtEbitda: -1.25, ebitdaInterest: 534.6, capexToRev: 2.2, fcfMargin: 59.5, source: "live" },
    { ticker: "AVGO", company: "Broadcom", openAug3: 383.85, current: 422.4, currentAsOf: "Aug 11 open", netDebtEbitda: 3.5, ebitdaInterest: 16.7, capexToRev: 1.0, fcfMargin: 46.3, source: "live" },
    { ticker: "TSM", company: "Taiwan Semiconductor", openAug3: 400.24, current: 418.47, currentAsOf: "Aug 11 open", netDebtEbitda: -2.63, ebitdaInterest: null, capexToRev: 39.0, fcfMargin: 22.6, source: "live" },
    { ticker: "TXN", company: "Texas Instruments", openAug3: 272.83, current: 280.44, currentAsOf: "Aug 11 open", netDebtEbitda: 2.45, ebitdaInterest: 20.4, capexToRev: 9.4, fcfMargin: 40.1, source: "live" },
    { ticker: "2222.SR", company: "Saudi Aramco", openAug3: null, current: 26.62, currentAsOf: "~Aug 9-11, SAR", netDebtEbitda: 0.5, ebitdaInterest: 39.2, capexToRev: 10.0, fcfMargin: 8.8, source: "screenshot", currency: "SAR" },
  ],
};

const DEMAND_SIGNALS = [
  { ticker: "DELL", layer: "DC Infra", revenue: 43842000000, revenuePrior: 23378000000, margin: 17.75, marginPrior: 21.12, asOf: "2026-05-01" },
  { ticker: "ANET", layer: "DC Infra", revenue: 3035700000, revenuePrior: 2204800000, margin: 62.94, marginPrior: 65.26, asOf: "2026-06-30" },
  { ticker: "NTAP", layer: "DC Infra", revenue: 1948000000, revenuePrior: 1732000000, margin: 70.07, marginPrior: 68.88, asOf: "2026-04-24" },
  { ticker: "GLW", layer: "DC Infra", revenue: 4505000000, revenuePrior: 3862000000, margin: 36.14, marginPrior: 36.04, asOf: "2026-06-30" },
  { ticker: "NTNX", layer: "DC Infra", revenue: 703066000, revenuePrior: 638983000, margin: 86.87, marginPrior: 87.01, asOf: "2026-04-30" },
];
const SEMIS_CYCLE = [
  { ticker: "AVGO", layer: "Semis", revenue: 22187000000, revenuePrior: 15004000000, margin: 69.48, marginPrior: 67.96, asOf: "2026-05-03" },
  { ticker: "MRVL", layer: "Semis", revenue: 2417800000, revenuePrior: 1895300000, margin: 52.15, marginPrior: 50.25, asOf: "2026-05-02" },
  { ticker: "MCHP", layer: "Semis", revenue: 1484700000, revenuePrior: 1075500000, margin: 63.24, marginPrior: 53.62, asOf: "2026-06-30" },
  { ticker: "AAOI", layer: "Semis", revenue: 191922000, revenuePrior: 102952000, margin: 27.72, marginPrior: 30.27, asOf: "2026-06-30" },
];
const INPUT_COSTS = [
  { name: "Copper", unit: "$/lb", value: 6.6, changeLabel: "+48% YoY, +6.6% 1M", asOf: "Aug 11, 2026", trend: "bad", note: "Near record highs — AI infra + renewables demand outpacing supply. Direct input cost for DC Infra and grid buildout wiring." },
  { name: "Uranium (U3O8)", unit: "$/lb spot", value: 86.5, changeLabel: "Long-term contract ~$90-93, highest since 2008", asOf: "Aug 8, 2026", trend: "bad", note: "Spot roughly flat; long-term contract climbing on reactor build-out demand. Direct fuel-cost input for the Power layer (OKLO)." },
  { name: "PJM Capacity Price", unit: "$/MW-day", value: 329.17, changeLabel: "vs $28.92 two years ago (11x)", asOf: "2026/27 delivery year", trend: "good", note: "Hit the FERC-approved price cap two auctions running; data centers drove ~63% of the latest increase. Strongest confirming signal for the Power-layer thesis." },
];

// ---------------------------------------------------------------------------
// Market session (NYSE hours, from viewer's real clock, America/New_York)
// ---------------------------------------------------------------------------
function getMarketSession() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const weekday = get("weekday");
  const mins = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
  if (weekday === "Sat" || weekday === "Sun") return { session: "closed", label: "Market Closed · Weekend" };
  if (mins < 4 * 60) return { session: "closed", label: "Market Closed" };
  if (mins < 9 * 60 + 30) return { session: "pre", label: "Pre-Market" };
  if (mins < 16 * 60) return { session: "regular", label: "Regular Hours" };
  if (mins < 20 * 60) return { session: "after", label: "After Hours" };
  return { session: "closed", label: "Market Closed" };
}
const SESSION_META = {
  regular: { color: STATUS.good }, pre: { color: STATUS.warn }, after: { color: "#E8A33D" }, closed: { color: STATUS.mute },
};

// ---------------------------------------------------------------------------
// Live sync calls (Claude-calls-Claude pattern via the Anthropic API)
// ---------------------------------------------------------------------------
async function fetchOHLCV(tickers) {
  const prompt = `Using the Fiscal.ai tools available to you, for each of these US equity tickers get: the last traded price, the previous trading day's closing price, today's cumulative volume so far, and the 20-trading-day average daily volume: ${tickers.join(", ")}. Respond with ONLY a raw JSON array, no markdown fences, no commentary, in exactly this shape: [{"ticker":"XXXX","last":0,"prevClose":0,"curVol":0,"avgVol20":0}]. Use each ticker's primary US listing. If a field truly cannot be found for a ticker, use null for that field rather than guessing, but still include the ticker with whatever fields you do have.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      mcp_servers: [{ type: "url", url: "https://api.fiscal.ai/mcp/sse", name: "fiscal-ai" }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const cleaned = textBlocks.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON array in response");
  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  const map = {};
  for (const row of parsed) {
    if (row && row.ticker) map[row.ticker.toUpperCase()] = row;
  }
  return map;
}

async function fetchCreditSpreads() {
  const prompt = `Search the web for the current ICE BofA US High Yield Index Option-Adjusted Spread (FRED series BAMLH0A0HYM2, "HY OAS") and the ICE BofA US Corporate Index Option-Adjusted Spread (FRED series BAMLC0A0CM, "IG OAS"), plus the BBB OAS if available. These are commonly reported both as a percent (e.g. "2.70%") and in basis points (e.g. "270 bps") — they are the same value, just scaled differently (percent × 100 = bps). Respond with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape: {"hyOas":0,"hyOasDate":"Mon D, YYYY","igOas":0,"bbbOas":0}. Report every value in basis points (bps) as a whole or one-decimal number like 270 or 270.5 — NEVER as a percent like 2.70. If the source you find states a percent, multiply by 100 before returning it.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const cleaned = textBlocks.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
}

async function fetchCompare(tickers) {
  const prompt = `Using the Fiscal.ai tools available to you, for each of these equity tickers get: the company name, the Aug 3, 2026 daily opening price, the current/latest price, Net Debt/EBITDA (quarterly basis, most recent quarter), EBITDA/Interest Expense, CapEx to Revenue (as a percent), and Free Cash Flow Margin (as a percent): ${tickers.join(", ")}. Respond with ONLY a raw JSON array, no markdown fences, no commentary, in exactly this shape: [{"ticker":"XXXX","company":"Name","openAug3":0,"current":0,"netDebtEbitda":0,"ebitdaInterest":0,"capexToRev":0,"fcfMargin":0}]. Use null for any field you can't find rather than guessing. If a ticker can't be found at all, omit it.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
      mcp_servers: [{ type: "url", url: "https://api.fiscal.ai/mcp/sse", name: "fiscal-ai" }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const cleaned = textBlocks.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON array in response");
  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
const TAB_GROUPS = [
  { group: "Holdings", tabs: [
    { id: "pnl", label: "P&L" },
    { id: "credit", label: "Credit Spread Risks" },
    { id: "financials", label: "Critical Financials" },
  ]},
  { group: "Models", tabs: [
    { id: "hyperscale", label: "Hyperscale" },
    { id: "adhoc", label: "Ad-hoc Compares" },
  ]},
];
const TABS = TAB_GROUPS.flatMap((g) => g.tabs);

export default function Dashboard() {
  const [tab, setTab] = useState("pnl");
  const [sortKey, setSortKey] = useState("value");
  const [sortDir, setSortDir] = useState("desc");
  const [layerFilter, setLayerFilter] = useState(null);

  const [ohlcv, setOhlcv] = useState({});
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [session, setSession] = useState(getMarketSession());
  const [, forceTick] = useState(0);
  const [fontScale, setFontScale] = useState(1.3);
  const FONT_SCALES = [0.9, 1, 1.15, 1.3];
  const FONT_LABELS = ["S", "M", "L", "XL"];

  // Credit state lives here now (lifted) so the persistent strip and the
  // full Credit tab both read the same synced values.
  const [credit, setCredit] = useState(CREDIT_DEFAULT);
  const [creditSyncing, setCreditSyncing] = useState(false);
  const [creditSynced, setCreditSynced] = useState(null);
  const [creditError, setCreditError] = useState(null);

  useEffect(() => {
    const id = setInterval(() => { setSession(getMarketSession()); forceTick((n) => n + 1); }, 30000);
    return () => clearInterval(id);
  }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const map = await fetchOHLCV(ALL_TICKERS);
      setOhlcv(map);
      setLastSynced(new Date());
    } catch (err) {
      setSyncError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const runCreditSync = async () => {
    setCreditSyncing(true);
    setCreditError(null);
    try {
      const fresh = await fetchCreditSpreads();
      const toBps = (v) => (v !== null && v !== undefined && v > 0 && v < 20 ? +(v * 100).toFixed(1) : v);
      const hyOas = toBps(fresh.hyOas);
      const igOas = toBps(fresh.igOas);
      const bbbOas = toBps(fresh.bbbOas);
      setCredit((prev) => ({
        ...prev,
        hyOas: hyOas ?? prev.hyOas,
        hyOasDate: fresh.hyOasDate ?? prev.hyOasDate,
        igOas: igOas ?? prev.igOas,
        bbbOas: bbbOas ?? prev.bbbOas,
        hyIgRatio: hyOas && igOas ? +(hyOas / igOas).toFixed(1) : prev.hyIgRatio,
      }));
      setCreditSynced(new Date());
    } catch (err) {
      setCreditError(err.message || "Sync failed");
    } finally {
      setCreditSyncing(false);
    }
  };

  // Topline stats: use synced "last" price when available, fall back to
  // statement mark. This makes NAV/Equities/P&L reactive to every OHLCV sync.
  const livePrice = (p) => {
    const o = ohlcv[p.ticker];
    return o && o.last !== null && o.last !== undefined ? o.last : p.mark;
  };
  const equityValue = useMemo(() => POSITIONS.reduce((a, p) => a + livePrice(p) * p.qty, 0), [ohlcv]);
  const costTotal = useMemo(() => POSITIONS.reduce((a, p) => a + p.cost, 0), []);
  const gainTotal = equityValue - costTotal;
  const gainPct = (gainTotal / costTotal) * 100;
  const nav = equityValue + CASH;

  const byLayer = useMemo(() => {
    const map = {};
    for (const p of POSITIONS) {
      const val = livePrice(p) * p.qty;
      map[p.layer] = map[p.layer] || { layer: p.layer, value: 0, cost: 0, holdings: [] };
      map[p.layer].value += val;
      map[p.layer].cost += p.cost;
      map[p.layer].holdings.push(p);
    }
    return Object.values(map).map((l) => ({ ...l, gain: l.value - l.cost, pctOfBook: (l.value / equityValue) * 100 }));
  }, [ohlcv, equityValue]);

  const coreValue = useMemo(() => POSITIONS.filter((p) => p.layer !== "Off-thesis").reduce((a, p) => a + livePrice(p) * p.qty, 0), [ohlcv]);
  const offValue = equityValue - coreValue;

  // P&L table columns (column picker + CSV export)
  const PNL_COLUMNS = [
    { key: "ticker", label: "Ticker", get: (p) => p.ticker },
    { key: "layer", label: "Layer", get: (p) => p.layer },
    { key: "qty", label: "Shares", get: (p) => p.qty },
    { key: "avgCost", label: "Avg Cost", get: (p) => p.avgCost.toFixed(2) },
    { key: "opened", label: "Time Opened", get: (p) => fmtOpened(p.opened) },
    { key: "last", label: "Last", get: (p) => livePrice(p).toFixed(2) },
    { key: "pctChg", label: "% Chg (prev close)", get: (p) => { const o = ohlcv[p.ticker]; if (!o || !o.prevClose) return ""; return (((o.last - o.prevClose) / o.prevClose) * 100).toFixed(2) + "%"; } },
    { key: "curVol", label: "Cur Vol", get: (p) => { const o = ohlcv[p.ticker]; return o && o.curVol != null ? o.curVol : ""; } },
    { key: "avgVol20", label: "Avg Vol (20d)", get: (p) => { const o = ohlcv[p.ticker]; return o && o.avgVol20 != null ? o.avgVol20 : ""; } },
    { key: "volRatio", label: "Vol vs Avg", get: (p) => { const o = ohlcv[p.ticker]; if (!o || !o.curVol || !o.avgVol20) return ""; return (o.curVol / o.avgVol20).toFixed(2) + "x"; } },
    { key: "value", label: "Value", get: (p) => (livePrice(p) * p.qty).toFixed(2) },
    { key: "gain", label: "P&L $", get: (p) => (livePrice(p) * p.qty - p.cost).toFixed(2) },
    { key: "gainPct", label: "P&L %", get: (p) => (((livePrice(p) * p.qty - p.cost) / p.cost) * 100).toFixed(2) + "%" },
  ];
  const pnlDefaultVisible = ["ticker", "layer", "qty", "avgCost", "opened", "last", "pctChg", "curVol", "avgVol20", "volRatio", "value", "gain", "gainPct"];
  const pnlCols = useColumnConfig(PNL_COLUMNS, pnlDefaultVisible);

  const rows = useMemo(() => {
    let list = layerFilter ? POSITIONS.filter((p) => p.layer === layerFilter) : POSITIONS;
    list = [...list].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      if (sortKey === "opened") return dir * (new Date(a.opened) - new Date(b.opened));
      if (sortKey === "value") return dir * (livePrice(a) * a.qty - livePrice(b) * b.qty);
      if (sortKey === "mark" || sortKey === "last") return dir * (livePrice(a) - livePrice(b));
      if (sortKey === "gain") return dir * ((livePrice(a) * a.qty - a.cost) - (livePrice(b) * b.qty - b.cost));
      return dir * ((a[sortKey] ?? 0) - (b[sortKey] ?? 0));
    });
    return list;
  }, [sortKey, sortDir, layerFilter, ohlcv]);

  const layerCounts = useMemo(() => {
    const map = {};
    for (const l of byLayer) map[l.layer] = { value: l.value, count: l.holdings.length };
    return map;
  }, [byLayer]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div style={{ ...styles.page, zoom: fontScale }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #333842; border-radius: 4px; }
        .strata-band { transition: filter 0.15s ease, transform 0.15s ease; cursor: pointer; }
        .strata-band:hover { filter: brightness(1.15); }
        .row-hover:hover { background: rgba(255,255,255,0.035); }
        .tab-btn { transition: color 0.15s ease, border-color 0.15s ease; }
        .chip { cursor: pointer; transition: filter 0.15s ease, transform 0.1s ease; }
        .chip:hover { filter: brightness(1.2); }
        th.sortable { cursor: pointer; user-select: none; }
        th.sortable:hover { color: #c8cdd6; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>SCHWAB · 57393667SCHW · TCOS · thinkorswim statement, {STATEMENT_WINDOW}</div>
          <h1 style={styles.h1}>AI Infrastructure Buildout</h1>
          <div style={styles.subtitle}>capturing the stack from the ground-up</div>
        </div>
        <div style={styles.headerStats}>
          <Stat label="Net Liq Value" value={fmtUsd0(nav)} />
          <Stat label="Equities" value={fmtUsd0(equityValue)} />
          <Stat label="Cash" value={fmtUsd0(CASH)} />
          <Stat label="Unrealized P&L" value={`${gainTotal >= 0 ? "+" : ""}${fmtUsd(gainTotal)}`} sub={fmtPct(gainPct)} status={gainTotal >= 0 ? "good" : "bad"} />
        </div>
      </header>

      <div style={styles.syncRow}>
        <button style={styles.syncBtn} onClick={runSync} disabled={syncing}>
          <span style={{ ...styles.syncIcon, ...(syncing ? styles.syncIconSpin : {}) }}>⟳</span>
          {syncing ? "Syncing…" : "Sync OHLCV"}
        </button>
        <div style={styles.syncStatus}>
          <span style={{ ...styles.sessionDot, background: SESSION_META[session.session].color }} />
          <span style={{ color: SESSION_META[session.session].color, fontWeight: 600 }}>{session.label}</span>
          <span style={styles.syncDivider}>·</span>
          <span>Last synced: {fmtFullDate(lastSynced)}</span>
        </div>
        {syncError && <div style={styles.syncErr}>⚠ {syncError}</div>}
        <div style={styles.fontToggle}>
          <span style={styles.fontToggleLabel}>Text size</span>
          {FONT_SCALES.map((s, i) => (
            <button key={s} onClick={() => setFontScale(s)} style={{ ...styles.fontToggleBtn, ...(fontScale === s ? styles.fontToggleBtnActive : {}) }}>
              {FONT_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      <CreditStrip credit={credit} onSync={runCreditSync} syncing={creditSyncing} synced={creditSynced} error={creditError} />

      <nav style={styles.tabs}>
        {TAB_GROUPS.map((g, gi) => (
          <React.Fragment key={g.group}>
            {gi > 0 && <span style={styles.tabGroupDivider} />}
            <span style={styles.tabGroupLabel}>{g.group}</span>
            {g.tabs.map((t) => (
              <button key={t.id} className="tab-btn" style={{ ...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {}) }} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {tab === "pnl" ? (
        <>
          <div style={styles.alertBanner}>
            <strong>Drift check:</strong> of 30 positions currently held, {POSITIONS.length - 7} sit inside the original 7-layer
            thesis and 7 are trading overflow outside it ({POSITIONS.filter(p => p.layer === "Off-thesis").map(p => p.ticker).join(", ")}).
            {" "}{EXITED.length} original thesis names have been fully exited since the last sync: {EXITED.join(", ")}.
          </div>

          <section style={styles.chipRow}>
            {Object.entries(layerCounts).map(([layer, d]) => {
              const meta = LAYER_META[layer];
              const active = layerFilter === layer;
              return (
                <div key={layer} className="chip" onClick={() => setLayerFilter(active ? null : layer)} style={{ ...styles.chip, background: `${meta.color}22`, color: meta.color, outline: active ? `1.5px solid ${meta.color}` : "1px solid transparent" }}>
                  {meta.label} · {d.count} · {fmtUsd0(d.value)}
                </div>
              );
            })}
            {layerFilter && <div className="chip" onClick={() => setLayerFilter(null)} style={styles.clearChip}>clear ×</div>}
          </section>

          <section style={styles.panel}>
            <div style={styles.tableToolbar}>
              <ColumnPicker orderedColumns={pnlCols.orderedColumns} visible={pnlCols.visible} toggle={pnlCols.toggle} move={pnlCols.move} />
              <ExportButton columns={pnlCols.visibleColumns} rows={rows} filename="tcos-pnl.csv" />
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {pnlCols.visibleColumns.map((c) => (
                      <th key={c.key} className="sortable" style={{ ...styles.th, ...styles.thRight }} onClick={() => toggleSort(c.key)}>
                        {c.label}{sortKey === c.key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const o = ohlcv[p.ticker];
                    const pct = o && o.prevClose ? ((o.last - o.prevClose) / o.prevClose) * 100 : null;
                    const volRatio = o && o.curVol && o.avgVol20 ? o.curVol / o.avgVol20 : null;
                    const volStatus = volRatio === null ? "mute" : volRatio >= 3 ? "bad" : volRatio >= 1.5 ? "warn" : "mute";
                    const cellFor = (key) => {
                      switch (key) {
                        case "ticker": return <td key={key} style={{ ...styles.td, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{p.ticker}<div style={styles.tdSub}>{p.desc}</div></td>;
                        case "layer": return <td key={key} style={styles.td}><span style={{ ...styles.pill, background: `${LAYER_META[p.layer].color}22`, color: LAYER_META[p.layer].color }}>{LAYER_META[p.layer].label}</span></td>;
                        case "qty": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{p.qty}</td>;
                        case "avgCost": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: "#8b93a1" }}>{fmtUsd(p.avgCost)}</td>;
                        case "opened": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, fontSize: 12 }}>{fmtOpened(p.opened)}</td>;
                        case "last": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{fmtUsd(livePrice(p))}</td>;
                        case "pctChg": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: pct === null ? "#3a4048" : pct >= 0 ? STATUS.good : STATUS.bad }}>{pct === null ? "—" : fmtPct(pct)}</td>;
                        case "curVol": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{o && o.curVol != null ? fmtVol(o.curVol) : "—"}</td>;
                        case "avgVol20": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: "#8b93a1" }}>{o && o.avgVol20 != null ? fmtVol(o.avgVol20) : "—"}</td>;
                        case "volRatio": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{volRatio === null ? "—" : <span style={{ ...styles.pill, background: `${statusColor(volStatus)}22`, color: statusColor(volStatus) }}>{volRatio.toFixed(2)}x{volRatio >= 3 ? " heavy" : volRatio >= 1.5 ? " elevated" : ""}</span>}</td>;
                        case "value": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{fmtUsd(livePrice(p) * p.qty)}</td>;
                        case "gain": { const g = livePrice(p) * p.qty - p.cost; return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: g >= 0 ? STATUS.good : STATUS.bad }}>{g >= 0 ? "+" : ""}{fmtUsd(g)}</td>; }
                        case "gainPct": { const g = livePrice(p) * p.qty - p.cost; const gp = (g / p.cost) * 100; return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: gp >= 0 ? STATUS.good : STATUS.bad }}>{fmtPct(gp)}</td>; }
                        default: return <td key={key} style={styles.td}>—</td>;
                      }
                    };
                    return <tr key={p.ticker} className="row-hover">{pnlCols.visibleColumns.map((c) => cellFor(c.key))}</tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div style={styles.methodNote}>
            Avg cost and time opened are reconstructed via FIFO lot-matching across every TO OPEN / TO CLOSE
            execution in the statement's trade history, verified against the statement's own Equities summary.
            "Last" reflects the most recent OHLCV sync when available, otherwise the statement mark — topline
            NAV/Equities/P&L above update from the same sync.
          </div>
        </>
      ) : tab === "credit" ? (
        <CreditTab credit={credit} bookGainPct={gainPct} />
      ) : tab === "financials" ? (
        <FinancialsTab />
      ) : tab === "hyperscale" ? (
        <CompareTab model={HYPERSCALE_MODEL} />
      ) : (
        <AdhocCompareTab />
      )}

      <footer style={styles.footer}>
        Core buildout book only — separate from the macro/capital-rotation dividend book (CAT, SYY, LOW, O, PPL, PLD, DOW).
      </footer>
    </div>
  );
}

function Stat({ label, value, sub, status }) {
  const color = status === undefined ? "#EDEFF2" : statusColor(status);
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, ...styles.mono, color }}>{value}</div>
      {sub && <div style={{ ...styles.statSub, color }}>{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Persistent Credit Strip — pinned above tab content on every tab
// ---------------------------------------------------------------------------
function CreditStrip({ credit, onSync, syncing, synced, error }) {
  const zone = creditZone(credit.hyOas);
  return (
    <div style={styles.creditStrip}>
      <div style={styles.creditStripLeft}>
        <span style={{ ...styles.sessionDot, background: statusColor(zone) }} />
        <span style={styles.creditStripLabel}>HY OAS</span>
        <span style={{ ...styles.mono, fontSize: 15, fontWeight: 700 }}>{credit.hyOas} bps</span>
        <span style={{ ...styles.statusBadge, background: `${statusColor(zone)}22`, color: statusColor(zone) }}>{statusLabel(zone)}</span>
        <span style={styles.creditStripDivider}>·</span>
        <span style={styles.creditStripLabel}>IG OAS</span>
        <span style={{ ...styles.mono, fontSize: 13 }}>{credit.igOas} bps</span>
        <span style={styles.creditStripDivider}>·</span>
        <span style={styles.creditStripSynced}>Synced: {timeAgo(synced)}</span>
        {error && <span style={{ color: STATUS.bad, fontSize: 11, marginLeft: 8 }}>⚠ {error}</span>}
      </div>
      <button style={styles.syncBtnSmall} onClick={onSync} disabled={syncing}>
        <span style={{ ...styles.syncIcon, fontSize: 12, ...(syncing ? styles.syncIconSpin : {}) }}>⟳</span>
        {syncing ? "Syncing…" : "Sync"}
      </button>
    </div>
  );
}

function CreditTab({ credit, bookGainPct }) {
  const maxScale = 800;
  const pos = (v) => Math.min(100, (v / maxScale) * 100);
  const sparkMax = Math.max(...credit.history.map((h) => h.v), credit.hyOas);
  const sparkMin = Math.min(...credit.history.map((h) => h.v), credit.hyOas);
  const sparkSeries = [...credit.history, { d: "now", v: credit.hyOas }];
  const sparkPoints = sparkSeries.map((h, i) => {
    const x = (i / (sparkSeries.length - 1)) * 260;
    const y = 40 - ((h.v - sparkMin) / (sparkMax - sparkMin || 1)) * 36 - 2;
    return `${x},${y}`;
  }).join(" ");
  const lastY = 40 - ((sparkSeries[sparkSeries.length - 1].v - sparkMin) / (sparkMax - sparkMin || 1)) * 36 - 2;

  const elevatedCount = LEVERAGE.filter((r) => leverageFlag(r).label === "Elevated").length;
  const spreadTightening = credit.hyOas <= credit.history[credit.history.length - 1].v;
  const diverging = spreadTightening ? bookGainPct < 0 : bookGainPct > 0;
  const daysToSept = Math.ceil((new Date(new Date().getFullYear(), 8, 1) - new Date()) / 86400000);
  const zone = creditZone(credit.hyOas);

  const triggers = [
    { title: "HY OAS through 300 bps", kind: "gauge", current: credit.hyOas, threshold: 300, breached: credit.hyOas >= 300 },
    { title: "HY OAS through 350 bps", kind: "gauge", current: credit.hyOas, threshold: 350, breached: credit.hyOas >= 350 },
    { title: "Credit / equity divergence", kind: "status", ok: !diverging, detail: diverging ? `Spreads ${spreadTightening ? "tightening" : "widening"} while book is ${bookGainPct >= 0 ? "up" : "down"} — diverging` : `Spreads ${spreadTightening ? "tightening" : "widening"}, book ${bookGainPct >= 0 ? "up" : "down"} — aligned` },
    { title: "September issuance calendar", kind: "status", ok: daysToSept > 21, detail: daysToSept > 0 ? `${daysToSept} days out — heaviest post-summer new-issue window` : "Window is open now" },
    { title: "Energy-sector HY spread", kind: "status", ok: null, manual: true, detail: "~12% of HY index; Brent below $60 widens it first" },
    { title: "Single-name downgrade", kind: "status", ok: elevatedCount === 0, detail: elevatedCount === 0 ? "0 of 12 leverage-checked names flagged Elevated" : `${elevatedCount} name(s) now flagged Elevated — see table below` },
  ];

  return (
    <>
      <section style={styles.creditGrid}>
        <div style={styles.panel}>
          <div style={styles.sectionLabel}>MACRO CREDIT CONDITIONS</div>
          <div style={styles.creditStatsRow}>
            <div style={styles.creditStat}>
              <div style={styles.statLabel}>HY OAS</div>
              <div style={{ ...styles.mono, fontSize: 26, fontWeight: 700 }}>{credit.hyOas} bps</div>
              <div style={{ fontSize: 11, color: "#8b93a1" }}>as of {credit.hyOasDate}</div>
            </div>
            <div style={styles.creditStat}>
              <div style={styles.statLabel}>IG OAS</div>
              <div style={{ ...styles.mono, fontSize: 26, fontWeight: 700 }}>{credit.igOas} bps</div>
              <div style={{ fontSize: 11, color: "#8b93a1" }}>BBB {credit.bbbOas} bps</div>
            </div>
            <div style={styles.creditStat}>
              <div style={styles.statLabel}>HY / IG Ratio</div>
              <div style={{ ...styles.mono, fontSize: 26, fontWeight: 700 }}>{credit.hyIgRatio}x</div>
              <div style={{ fontSize: 11, color: "#8b93a1" }}>in line with long-run avg</div>
            </div>
            <div style={{ ...styles.creditStat, alignSelf: "center" }}>
              <span style={{ ...styles.statusBadgeLg, background: `${statusColor(zone)}22`, color: statusColor(zone) }}>
                {statusLabel(zone)} for thesis
              </span>
            </div>
          </div>

          <div style={{ marginTop: 4, marginBottom: 18 }}>
            <div style={styles.statLabel}>TREND</div>
            <svg viewBox="0 0 260 40" style={{ width: "100%", height: 50 }}>
              <polyline points={sparkPoints} fill="none" stroke="#E8A33D" strokeWidth="2" />
              <circle cx={260} cy={lastY} r="3.5" fill="#E8A33D" />
            </svg>
          </div>

          <div style={styles.gaugeWrap}>
            <div style={styles.gaugeTrack}>
              <div style={{ ...styles.gaugeZone, left: "0%", width: `${pos(300)}%`, background: STATUS.good }} />
              <div style={{ ...styles.gaugeZone, left: `${pos(300)}%`, width: `${pos(600) - pos(300)}%`, background: STATUS.warn }} />
              <div style={{ ...styles.gaugeZone, left: `${pos(600)}%`, width: `${100 - pos(600)}%`, background: STATUS.bad }} />
              <div style={{ ...styles.gaugeMarker, left: `${pos(credit.hyOas)}%` }} />
            </div>
            <div style={styles.gaugeLegend}>
              {credit.levels.map((l) => (
                <div key={l.v} style={styles.gaugeLegendItem}>
                  <span style={{ ...styles.gaugeLegendDot, background: l.v < 300 ? STATUS.good : l.v < 600 ? STATUS.warn : STATUS.bad }} />
                  <span style={styles.mono}>{l.v}</span>
                  <span style={styles.gaugeLegendLabel}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionLabel}>TRIGGERS TO WATCH — live where possible</div>
          <div style={styles.triggerGrid}>
            {triggers.map((t) => {
              if (t.kind === "gauge") {
                const dist = t.threshold - t.current;
                const pct = Math.min(100, (t.current / t.threshold) * 100);
                const s = t.breached ? "bad" : dist <= 30 ? "warn" : "good";
                const color = statusColor(s);
                return (
                  <div key={t.title} style={styles.triggerCard}>
                    <div style={styles.triggerCardHead}>
                      <span style={{ ...styles.triggerDot, background: color }} />
                      <span style={styles.triggerTitle}>{t.title}</span>
                      <span style={{ ...styles.triggerStatusPill, background: `${color}22`, color }}>{statusLabel(s)}</span>
                    </div>
                    <div style={styles.triggerBarTrack}>
                      <div style={{ ...styles.triggerBarFill, width: `${pct}%`, background: color }} />
                    </div>
                    <div style={styles.triggerFoot}>
                      <span style={{ ...styles.mono, color }}>{t.current} / {t.threshold} bps</span>
                      <span style={styles.triggerDetail}>{t.breached ? "breached" : `${dist} bps away`}</span>
                    </div>
                  </div>
                );
              }
              const s = t.manual ? "mute" : t.ok ? "good" : "bad";
              const color = statusColor(s);
              const label = t.manual ? "Static" : statusLabel(s);
              return (
                <div key={t.title} style={styles.triggerCard}>
                  <div style={styles.triggerCardHead}>
                    <span style={{ ...styles.triggerDot, background: color }} />
                    <span style={styles.triggerTitle}>{t.title}</span>
                    <span style={{ ...styles.triggerStatusPill, background: `${color}22`, color }}>{label}</span>
                  </div>
                  <div style={styles.triggerDetail}>{t.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div style={styles.alertBanner}>
        <strong>Why this matters for the buildout thesis:</strong> HY spreads at {credit.hyOas} bps sit in the
        richest decile of history — carry regimes like this can persist for quarters, but they leave little
        room to compress and substantial room to widen on any shock. A big share of AI datacenter and power
        buildout is financed off public balance sheets (private credit, project finance, ABS), so it doesn't
        show up in the leverage ratios below even though it's real capex-cycle debt. Watch the spread level
        itself more than any single holding's balance sheet.
      </div>

      <section style={styles.panel}>
        <div style={styles.sectionLabel}>PORTFOLIO LEVERAGE CHECK — capex-heavy holdings only</div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ticker</th>
                <th style={styles.th}>Layer</th>
                <th style={{ ...styles.th, ...styles.thRight }}>Gross Debt</th>
                <th style={{ ...styles.th, ...styles.thRight }}>Net Debt</th>
                <th style={{ ...styles.th, ...styles.thRight }}>Net Debt/EBITDA</th>
                <th style={{ ...styles.th, ...styles.thRight }}>EBITDA/Interest</th>
                <th style={{ ...styles.th, ...styles.thRight }}>CapEx/Revenue</th>
                <th style={{ ...styles.th, ...styles.thRight }}>FCF Margin</th>
                <th style={{ ...styles.th, ...styles.thRight }}>Debt/Equity</th>
                <th style={{ ...styles.th, ...styles.thRight }}>Current Ratio</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {LEVERAGE.map((row) => {
                const flag = leverageFlag(row);
                const color = statusColor(flag.status);
                return (
                  <tr key={row.ticker} className="row-hover">
                    <td style={{ ...styles.td, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{row.ticker}</td>
                    <td style={styles.td}><span style={{ ...styles.pill, background: `${LAYER_META[row.layer].color}22`, color: LAYER_META[row.layer].color }}>{LAYER_META[row.layer].label}</span></td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right, color: "#8b93a1" }}>{fmtDebt(row.grossDebt)}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right, color: row.netDebt <= 0 ? STATUS.good : "#EDEFF2" }}>{fmtDebt(row.netDebt)}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.netDebtEbitda === null ? "—" : `${row.netDebtEbitda.toFixed(1)}x`}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.ebitdaInterest === null ? "—" : `${row.ebitdaInterest.toFixed(1)}x`}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.capexToRev === null ? "—" : `${row.capexToRev.toFixed(1)}%`}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.fcfMargin === null ? "—" : `${row.fcfMargin.toFixed(1)}%`}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.debtEquity === null ? "—" : row.debtEquity.toFixed(2)}</td>
                    <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.currentRatio === null ? "—" : row.currentRatio.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.pill, background: `${color}22`, color }}>{flag.label}</span>
                      {row.note && <div style={styles.tdSub}>{row.note}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={styles.methodNote}>
          "Net Cash" means net debt (gross debt minus cash) is negative. Software/cyber holdings beyond PANW/S
          (SNOW, CRM, ZS, CRWD, NET, FTNT, NTSK, PLTR, FIVN) are asset-light and omitted. None of the capex-heavy
          names currently held are over-levered on their own balance sheets except MCHP, GLW, and DELL, now
          flagged Elevated — the broader credit risk in this thesis runs through the macro spread and
          off-balance-sheet project financing that these public filings don't capture.
        </div>
      </section>
    </>
  );
}

function GrowthRow({ row }) {
  const yoy = ((row.revenue - row.revenuePrior) / row.revenuePrior) * 100;
  const marginDelta = row.margin - row.marginPrior;
  const barPct = Math.min(100, (yoy / 100) * 100);
  return (
    <tr className="row-hover">
      <td style={{ ...styles.td, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{row.ticker}</td>
      <td style={styles.td}><span style={{ ...styles.pill, background: `${LAYER_META[row.layer].color}22`, color: LAYER_META[row.layer].color }}>{LAYER_META[row.layer].label}</span></td>
      <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{fmtDebt(row.revenue)}</td>
      <td style={styles.td}>
        <div style={styles.growthBarTrack}><div style={{ ...styles.growthBarFill, width: `${Math.max(4, barPct)}%`, background: yoy >= 0 ? STATUS.good : STATUS.bad }} /></div>
      </td>
      <td style={{ ...styles.td, ...styles.mono, ...styles.right, color: yoy >= 0 ? STATUS.good : STATUS.bad, fontWeight: 600 }}>{yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%</td>
      <td style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.margin.toFixed(1)}%</td>
      <td style={{ ...styles.td, ...styles.mono, ...styles.right, color: marginDelta >= 0 ? STATUS.good : STATUS.bad }}>{marginDelta >= 0 ? "+" : ""}{marginDelta.toFixed(1)}pp</td>
    </tr>
  );
}
function GrowthTable({ rows }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Ticker</th><th style={styles.th}>Layer</th>
            <th style={{ ...styles.th, ...styles.thRight }}>Latest Qtr Revenue</th>
            <th style={styles.th}>YoY Growth</th>
            <th style={{ ...styles.th, ...styles.thRight }}>YoY %</th>
            <th style={{ ...styles.th, ...styles.thRight }}>Gross Margin</th>
            <th style={{ ...styles.th, ...styles.thRight }}>Margin YoY</th>
          </tr>
        </thead>
        <tbody>{rows.map((row) => <GrowthRow key={row.ticker} row={row} />)}</tbody>
      </table>
    </div>
  );
}

function FinancialsTab() {
  return (
    <>
      <section style={styles.panel}>
        <div style={styles.sectionLabel}>DATA CENTER DEMAND — DC INFRA REVENUE GROWTH</div>
        <GrowthTable rows={DEMAND_SIGNALS} />
        <div style={styles.methodNote}>
          Quarterly revenue and gross margin, latest reported quarter vs. a year ago, live from Fiscal.ai. Every
          DC Infra holding is growing double digits — DELL's 87.5% YoY surge is the standout, though its margin
          compressed 3.4pp alongside it, consistent with a mix shift toward lower-margin AI server hardware.
        </div>
      </section>
      <section style={styles.panel}>
        <div style={styles.sectionLabel}>SEMIS CYCLE</div>
        <GrowthTable rows={SEMIS_CYCLE} />
        <div style={styles.methodNote}>
          MCHP's margin expansion (+9.6pp) alongside 38% revenue growth is the cleanest upcycle signal in the
          book. AAOI's 86% revenue growth with a 2.5pp margin compression suggests real price competition
          alongside the demand surge.
        </div>
      </section>
      <section style={styles.panel}>
        <div style={styles.sectionLabel}>INPUT COSTS</div>
        <div style={styles.inputCostGrid}>
          {INPUT_COSTS.map((c) => (
            <div key={c.name} style={styles.inputCostCard}>
              <div style={styles.inputCostName}>{c.name}</div>
              <div style={{ ...styles.mono, fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {c.value.toLocaleString("en-US")} <span style={{ fontSize: 13, color: "#8b93a1", fontWeight: 500 }}>{c.unit}</span>
              </div>
              <div style={{ fontSize: 11.5, color: statusColor(c.trend), marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{c.changeLabel}</div>
              <div style={styles.inputCostAsOf}>as of {c.asOf}</div>
              <div style={styles.inputCostNote}>{c.note}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared comparison table for Models — Hyperscale and Ad-hoc Compares both
// use this exact component so they're directly comparable.
// ---------------------------------------------------------------------------
const COMPARE_COLUMNS = [
  { key: "ticker", label: "Ticker", get: (r) => r.ticker },
  { key: "company", label: "Company", get: (r) => r.company },
  { key: "openAug3", label: "Aug 3 Open", get: (r) => r.openAug3 ?? "" },
  { key: "current", label: "Current", get: (r) => r.current ?? "" },
  { key: "sinceAug3", label: "Since Aug 3", get: (r) => (r.openAug3 && r.current) ? (((r.current - r.openAug3) / r.openAug3) * 100).toFixed(1) + "%" : "" },
  { key: "netDebtEbitda", label: "Net Debt/EBITDA", get: (r) => r.netDebtEbitda ?? "" },
  { key: "ebitdaInterest", label: "EBITDA/Interest", get: (r) => r.ebitdaInterest ?? "" },
  { key: "capexToRev", label: "CapEx/Revenue", get: (r) => r.capexToRev ?? "" },
  { key: "fcfMargin", label: "FCF Margin", get: (r) => r.fcfMargin ?? "" },
];
const compareDefaultVisible = COMPARE_COLUMNS.map((c) => c.key); // no "position size" concept for models — none included by design

function CompareTable({ rows, title, note, filename, emptyState }) {
  const cols = useColumnConfig(COMPARE_COLUMNS, compareDefaultVisible);
  if (!rows || rows.length === 0) {
    return <section style={styles.panel}><div style={styles.sectionLabel}>{title}</div><div style={styles.emptyState}>{emptyState}</div></section>;
  }
  return (
    <section style={styles.panel}>
      <div style={styles.tableToolbar}>
        <div style={styles.sectionLabel}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <ColumnPicker orderedColumns={cols.orderedColumns} visible={cols.visible} toggle={cols.toggle} move={cols.move} />
          <ExportButton columns={cols.visibleColumns} rows={rows} filename={filename} />
        </div>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>{cols.visibleColumns.map((c) => <th key={c.key} style={{ ...styles.th, ...styles.thRight }}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = row.openAug3 && row.current ? ((row.current - row.openAug3) / row.openAug3) * 100 : null;
              const ccy = row.currency ? ` ${row.currency}` : "";
              const cellFor = (key) => {
                switch (key) {
                  case "ticker": return <td key={key} style={{ ...styles.td, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{row.ticker}</td>;
                  case "company": return <td key={key} style={styles.td}>{row.company}</td>;
                  case "openAug3": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.openAug3 == null ? "—" : `${row.openAug3.toFixed(2)}${ccy}`}</td>;
                  case "current": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.current == null ? "—" : `${row.current.toFixed(2)}${ccy}`}<div style={styles.tdSub}>{row.currentAsOf || ""}</div></td>;
                  case "sinceAug3": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: pct === null ? "#565d69" : pct >= 0 ? STATUS.good : STATUS.bad, fontWeight: 600 }}>{pct === null ? "n/a" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}</td>;
                  case "netDebtEbitda": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right, color: row.netDebtEbitda != null && row.netDebtEbitda < 0 ? STATUS.good : "#EDEFF2" }}>{row.netDebtEbitda == null ? "—" : `${row.netDebtEbitda.toFixed(2)}x`}</td>;
                  case "ebitdaInterest": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.ebitdaInterest == null ? "—" : `${row.ebitdaInterest.toFixed(1)}x`}</td>;
                  case "capexToRev": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.capexToRev == null ? "—" : `${row.capexToRev.toFixed(1)}%`}</td>;
                  case "fcfMargin": return <td key={key} style={{ ...styles.td, ...styles.mono, ...styles.right }}>{row.fcfMargin == null ? "—" : `${row.fcfMargin.toFixed(1)}%`}</td>;
                  default: return <td key={key} style={styles.td}>—</td>;
                }
              };
              return (
                <tr key={row.ticker} className="row-hover">
                  {cols.visibleColumns.map((c) => cellFor(c.key))}
                  {row.source && (
                    <></>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.source === "screenshot") && (
        <div style={styles.methodNote}>
          Rows marked from a screenshot (not shown as a column here to keep the table clean) use fundamentals
          you provided rather than a live Fiscal.ai pull — Fiscal.ai doesn't cover that listing.
        </div>
      )}
      {note && <div style={styles.methodNote}>{note}</div>}
    </section>
  );
}

function CompareTab({ model }) {
  return (
    <>
      <section style={styles.panel}>
        <div style={styles.sectionLabel}>{model.name.toUpperCase()} — MODEL, NOT A HELD POSITION</div>
        <div style={styles.methodNote}>
          A paper-tracked basket, priced from the {model.refDate} as reference. Separate from TCOS — nothing
          here is actually held in 57393667SCHW. Position size isn't tracked for models by design (unlike the
          Holdings tabs), since these are comparison baskets, not sized positions.
        </div>
      </section>
      <CompareTable
        rows={model.positions}
        title="COMPARISON"
        filename={`${model.name.toLowerCase().replace(/\s+/g, "-")}.csv`}
        note="NVDA and AVGO net cash / leverage read very differently despite both being megacap semis — NVDA is deeply net cash funding growth from its own balance sheet, while AVGO carries real leverage from the VMware acquisition."
      />
    </>
  );
}

function AdhocCompareTab() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runCompare = async () => {
    const tickers = input.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchCompare(tickers);
      setRows(results.map((r) => ({ ...r, source: "live" })));
    } catch (err) {
      setError(err.message || "Compare failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section style={styles.panel}>
        <div style={styles.sectionLabel}>AD-HOC COMPARES — MODEL, NOT A HELD POSITION</div>
        <div style={styles.methodNote}>
          Type any tickers to compare on the exact same columns as Hyperscale — same table, same metrics, same
          Aug 3, 2026 reference price. Position size isn't tracked here either, consistent with Models generally.
        </div>
        <div style={styles.adhocInputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. MSFT, AMZN, META, GOOGL"
            style={styles.adhocInput}
            onKeyDown={(e) => { if (e.key === "Enter") runCompare(); }}
          />
          <button style={styles.syncBtn} onClick={runCompare} disabled={loading}>
            <span style={{ ...styles.syncIcon, ...(loading ? styles.syncIconSpin : {}) }}>⟳</span>
            {loading ? "Comparing…" : "Compare"}
          </button>
        </div>
        {error && <div style={styles.syncErr}>⚠ {error}</div>}
      </section>
      <CompareTable
        rows={rows}
        title="COMPARISON"
        filename="adhoc-compare.csv"
        emptyState="Enter tickers above and hit Compare to pull live Fiscal.ai fundamentals and Aug 3 reference pricing."
      />
    </>
  );
}

const styles = {
  page: { fontFamily: "'Space Grotesk', sans-serif", background: "#101318", color: "#EDEFF2", minHeight: "100%", padding: "28px 28px 40px" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, borderBottom: "1px solid #262b33", paddingBottom: 18 },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.06em", color: "#6E8CC7", marginBottom: 6 },
  h1: { fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  subtitle: { color: "#8b93a1", fontSize: 14, marginTop: 4 },
  headerStats: { display: "flex", gap: 26, flexWrap: "wrap" },
  stat: { textAlign: "right", minWidth: 96 },
  statLabel: { fontSize: 11, color: "#8b93a1", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: 19, fontWeight: 600, marginTop: 2 },
  statSub: { fontSize: 12, marginTop: 1 },
  syncRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 18 },
  syncBtn: { display: "flex", alignItems: "center", gap: 8, background: "#1c1f26", border: "1px solid #333842", color: "#EDEFF2", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 6, cursor: "pointer" },
  syncIcon: { display: "inline-block", fontSize: 15, color: "#6E8CC7" },
  syncIconSpin: { animation: "spin 0.8s linear infinite" },
  syncStatus: { display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#8b93a1", flexWrap: "wrap" },
  sessionDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px currentColor" },
  syncDivider: { color: "#333842" },
  syncErr: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: STATUS.bad },
  fontToggle: { display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" },
  fontToggleLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#565d69", marginRight: 2 },
  fontToggleBtn: { background: "#1c1f26", border: "1px solid #333842", color: "#8b93a1", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, width: 26, height: 26, borderRadius: 5, cursor: "pointer" },
  fontToggleBtnActive: { background: "#6E8CC722", borderColor: "#6E8CC7", color: "#6E8CC7" },

  creditStrip: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#171a20", border: "1px solid #262b33", borderRadius: 8, padding: "9px 14px", marginTop: 16 },
  creditStripLeft: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 },
  creditStripLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#8b93a1", textTransform: "uppercase" },
  creditStripDivider: { color: "#333842" },
  creditStripSynced: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#565d69" },
  statusBadge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.03em" },
  statusBadgeLg: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.03em" },

  tabs: { display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 4, marginTop: 18, marginBottom: 18, borderBottom: "1px solid #262b33" },
  tabBtn: { background: "none", border: "none", borderBottom: "2px solid transparent", color: "#8b93a1", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 500, padding: "10px 4px", marginRight: 20, cursor: "pointer" },
  tabBtnActive: { color: "#EDEFF2", borderBottomColor: "#6E8CC7" },
  tabGroupLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#565d69", textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center", marginRight: 10 },
  tabGroupDivider: { width: 1, height: 20, background: "#262b33", margin: "0 16px", alignSelf: "center" },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, padding: "5px 10px", borderRadius: 5 },
  clearChip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, padding: "5px 10px", borderRadius: 5, background: "#1c1f26", color: "#8b93a1", cursor: "pointer", border: "1px solid #333842" },
  panel: { background: "#15181e", border: "1px solid #262b33", borderRadius: 8, padding: 18, marginBottom: 16 },
  sectionLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: "#8b93a1", marginBottom: 12 },

  tableToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 },
  colBtn: { background: "#1c1f26", border: "1px solid #333842", color: "#c8cdd6", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 10px", borderRadius: 5, cursor: "pointer" },
  colDropdown: { position: "absolute", top: "110%", left: 0, zIndex: 20, background: "#1c1f26", border: "1px solid #333842", borderRadius: 8, padding: 10, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 320, overflowY: "auto" },
  colRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 2px" },
  colLabel: { fontSize: 12, color: "#c8cdd6", display: "flex", alignItems: "center", cursor: "pointer" },
  colMoveBtns: { display: "flex", gap: 2 },
  colMoveBtn: { background: "#262b33", border: "none", color: "#8b93a1", width: 20, height: 20, borderRadius: 3, fontSize: 10, cursor: "pointer" },
  exportBtn: { background: "#1c1f26", border: "1px solid #333842", color: "#c8cdd6", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 10px", borderRadius: 5, cursor: "pointer" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#8b93a1", fontWeight: 500, padding: "6px 10px", borderBottom: "1px solid #262b33", letterSpacing: "0.04em", whiteSpace: "nowrap" },
  thRight: { textAlign: "right" },
  td: { padding: "8px 10px", borderBottom: "1px solid #1c2028", verticalAlign: "top" },
  tdSub: { color: "#565d69", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 },
  right: { textAlign: "right" },
  pill: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" },
  methodNote: { marginTop: 12, fontSize: 11.5, color: "#565d69", lineHeight: 1.6, maxWidth: 780 },
  alertBanner: { marginBottom: 16, padding: "10px 14px", background: "#1c1f26", border: "1px solid #333842", borderLeft: "3px solid #D9695F", borderRadius: 6, fontSize: 12.5, color: "#c8cdd6", lineHeight: 1.6, maxWidth: 720 },

  creditGrid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, alignItems: "start" },
  creditStatsRow: { display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 12 },
  creditStat: { minWidth: 96 },

  gaugeWrap: { marginTop: 8 },
  gaugeTrack: { position: "relative", height: 12, borderRadius: 6, overflow: "hidden", background: "#1c1f26" },
  gaugeZone: { position: "absolute", top: 0, height: "100%", opacity: 0.45 },
  gaugeMarker: { position: "absolute", top: -5, width: 3, height: 22, background: "#EDEFF2", borderRadius: 2, boxShadow: "0 0 8px rgba(255,255,255,0.6)", transform: "translateX(-1.5px)" },
  gaugeLegend: { display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 },
  gaugeLegendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 },
  gaugeLegendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  gaugeLegendLabel: { color: "#8b93a1", fontSize: 11.5 },

  triggerGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  triggerCard: { background: "#191c22", border: "1px solid #262b33", borderRadius: 7, padding: "10px 12px" },
  triggerCardHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  triggerDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 5px currentColor" },
  triggerTitle: { fontSize: 12.5, fontWeight: 600, color: "#EDEFF2", flex: 1 },
  triggerStatusPill: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, padding: "1px 6px", borderRadius: 4, fontWeight: 600 },
  triggerBarTrack: { height: 5, background: "#262b33", borderRadius: 3, overflow: "hidden", marginBottom: 5 },
  triggerBarFill: { height: "100%", borderRadius: 3, transition: "width 0.3s ease" },
  triggerFoot: { display: "flex", justifyContent: "space-between", fontSize: 10.5 },
  triggerDetail: { fontSize: 11, color: "#8b93a1", lineHeight: 1.4 },

  growthBarTrack: { height: 8, background: "#262b33", borderRadius: 4, overflow: "hidden", minWidth: 80 },
  growthBarFill: { height: "100%", borderRadius: 4 },
  inputCostGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  inputCostCard: { background: "#191c22", border: "1px solid #262b33", borderRadius: 8, padding: "14px 16px", maxWidth: 320 },
  inputCostName: { fontSize: 12, fontWeight: 600, color: "#c8cdd6", textTransform: "uppercase", letterSpacing: "0.03em" },
  inputCostAsOf: { fontSize: 10.5, color: "#565d69", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 },
  inputCostNote: { fontSize: 11.5, color: "#8b93a1", lineHeight: 1.55, marginTop: 8 },

  emptyState: { fontSize: 12.5, color: "#565d69", lineHeight: 1.6, padding: "20px 0" },
  adhocInputRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  adhocInput: { flex: 1, minWidth: 240, background: "#1c1f26", border: "1px solid #333842", borderRadius: 6, color: "#EDEFF2", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, padding: "8px 12px" },

  footer: { marginTop: 24, fontSize: 11.5, color: "#565d69", fontFamily: "'JetBrains Mono', monospace" },
};
