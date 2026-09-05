#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Resolve script location and default root relative to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$SCRIPT_DIR/../AI_BUILDOUT_PLATFORM_TEST}"

echo "Using ROOT: $ROOT"

# -----------------------------
# Create directory structure (safe + readable)
# -----------------------------

mkdir -p \
"$ROOT/00_ADMIN" \
"$ROOT/01_COMPANIES" \
"$ROOT/02_FINANCIALS" \
"$ROOT/03_HYPERSCALERS" \
"$ROOT/04_SUPPLY_CAPACITY" \
"$ROOT/05_INVENTORY" \
"$ROOT/06_BOTTLENECKS" \
"$ROOT/07_RESEARCH_EVENTS" \
"$ROOT/08_INVESTMENT_SCORES" \
"$ROOT/09_PLATFORM_TESTS/FISCAL" \
"$ROOT/09_PLATFORM_TESTS/KOYFIN" \
"$ROOT/09_PLATFORM_TESTS/AIRTABLE" \
"$ROOT/09_PLATFORM_TESTS/TRADESVIZ" \
"$ROOT/10_FINAL_RESULTS"

# -----------------------------
# Helper: only create file if missing
# -----------------------------
create_if_missing () {
  local file="$1"
  shift
  if [[ ! -f "$file" ]]; then
    cat > "$file" <<EOF
$*
EOF
    echo "Created: $file"
  else
    echo "Exists (skipped): $file"
  fi
}

# -----------------------------
# 00_ADMIN
# -----------------------------

create_if_missing "$ROOT/00_ADMIN/DATA_DICTIONARY.csv" \
"field,meaning,unit,frequency,source,notes
company_id,Unique internal company identifier,,Static,Master,
ticker,US-listed ticker or ADR,,Static,Master,
company_name,Company name,,Static,Master,
group,Primary AI group,,Static,Master,
subgroup,Subgroup,,Static,Master,
peer_rank,Peer rank,,Periodic,Model,
ai_role,Role in AI stack,,Static,Research,
period,Reporting period,,Quarterly,Source,
revenue,Revenue,USD,Quarterly,Financial,
revenue_yoy,Revenue YoY,%,Quarterly,Calculated,
eps,Earnings per share,USD,Quarterly,Financial,
eps_yoy,EPS YoY,%,Quarterly,Calculated,
capex,Capital expenditures,USD,Quarterly,Financial,
capex_yoy,Capex YoY,%,Quarterly,Calculated,
inventory,Inventory,USD,Quarterly,Financial,
inventory_yoy,Inventory YoY,%,Quarterly,Calculated,
inventory_days,Inventory days,Days,Quarterly,Calculated"

create_if_missing "$ROOT/00_ADMIN/README.md" \
"# AI Build-Out Platform Test
Canonical dataset for evaluating Fiscal, Koyfin, Airtable, TradesViz.
Do not modify structure during test."

# -----------------------------
# 01_COMPANIES (core universe)
# -----------------------------

create_if_missing "$ROOT/01_COMPANIES/COMPANIES.csv" \
"company_id,ticker,company_name,group,subgroup,cap_tier,peer_rank,ai_role
AI001,NVDA,NVIDIA,Compute,AI Accelerators,Large/Mega,,Compute
AI002,AMD,AMD,Compute,AI Accelerators,Large/Mega,,Compute
AI003,MSFT,Microsoft,Compute,Hyperscaler,Large/Mega,,Demand
AI004,AMZN,Amazon,Compute,Hyperscaler,Large/Mega,,Demand
AI005,GOOGL,Alphabet,Compute,Hyperscaler,Large/Mega,,Demand
AI006,META,Meta,Compute,Hyperscaler,Large/Mega,,Demand
AI007,AVGO,Broadcom,Compute,Custom Silicon,Large/Mega,,Compute
AI008,MU,Micron,Semis,Memory,Large/Mega,,Memory
AI009,TSM,TSMC,Semis,Foundry,Large/Mega,,Foundry
AI010,ASML,ASML,Semis,Lithography,Large/Mega,,Equipment
AI011,AMAT,Applied Materials,Semis,Equipment,Large/Mega,,Equipment
AI012,LRCX,Lam Research,Semis,Equipment,Large/Mega,,Equipment
AI013,KLAC,KLA,Semis,Inspection,Large/Mega,,Equipment
AI014,ANET,Arista,Networking,Switching,Large/Mega,,Networking
AI015,CSCO,Cisco,Networking,Switching,Large/Mega,,Networking
AI016,GLW,Corning,Optics,Fiber,Large/Mega,,Optics
AI017,LITE,Lumentum,Optics,Lasers,Large/Mega,,Optics
AI018,COHR,Coherent,Optics,Lasers,Mid/Small,,Optics
AI019,AAOI,Applied Opto,Optics,Transceivers,Mid/Small,,Optics
AI020,VRT,Vertiv,Infrastructure,Cooling,Large/Mega,,Cooling
AI021,DELL,Dell,Infrastructure,Servers,Large/Mega,,Compute Infra
AI022,HPE,HPE,Infrastructure,Servers,Large/Mega,,Compute Infra
AI023,EQIX,Equinix,Infrastructure,Data Centers,Large/Mega,,Data Centers
AI024,DLR,Digital Realty,Infrastructure,Data Centers,Large/Mega,,Data Centers
AI025,SMCI,Supermicro,Infrastructure,Servers,Mid/Small,,Compute Infra
AI026,STX,Seagate,Storage,Drives,Large/Mega,,Storage
AI027,WDC,Western Digital,Storage,Drives,Large/Mega,,Storage
AI028,NTAP,NetApp,Storage,Enterprise,Large/Mega,,Storage
AI029,VST,Vistra,Power,Generation,Large/Mega,,Power
AI030,CEG,Constellation,Power,Nuclear,Large/Mega,,Power
AI031,ETN,Eaton,Power,Electrical,Large/Mega,,Grid
AI032,PWR,Quanta,Power,Grid Build,Large/Mega,,Grid
AI033,OKLO,Oklo,Power,Nuclear,Mid/Small,,Power
AI034,BE,Bloom,Power,Fuel Cells,Mid/Small,,Power
AI035,FCX,Freeport,Materials,Copper,Large/Mega,,Materials
AI036,MP,MP Materials,Materials,Rare Earths,Mid/Small,,Materials
AI037,USAR,USA Rare Earth,Materials,Rare Earths,Mid/Small,,Materials
AI038,PANW,Palo Alto,Cyber,Security,Large/Mega,,Cyber
AI039,CRWD,CrowdStrike,Cyber,Security,Large/Mega,,Cyber
AI040,FTNT,Fortinet,Cyber,Security,Large/Mega,,Cyber
AI041,NET,Cloudflare,Software,Platform,Mid/Small,,AI Software
AI042,FIVN,Five9,Software,CCaaS,Mid/Small,,AI Software
AI043,NTNX,Nutanix,Software,Infra,Mid/Small,,AI Software
AI044,SPCX,SpaceX,Watch,New Listing,Watch,,Thesis Core"

# -----------------------------
# Empty datasets (safe)
# -----------------------------

create_if_missing "$ROOT/02_FINANCIALS/FINANCIALS.csv" \
"company_id,ticker,period,revenue,revenue_yoy,eps,eps_yoy,capex,capex_yoy,inventory,inventory_yoy"

create_if_missing "$ROOT/03_HYPERSCALERS/HYPERSCALER_CAPEX.csv" \
"company,ticker,period,capex,capex_yoy,capex_guidance,notes"

create_if_missing "$ROOT/04_SUPPLY_CAPACITY/SUPPLY_CAPACITY.csv" \
"component,company,ticker,period,capacity,utilization,lead_time"

create_if_missing "$ROOT/05_INVENTORY/INVENTORY.csv" \
"company,ticker,period,inventory,inventory_yoy,revenue,revenue_yoy"

create_if_missing "$ROOT/06_BOTTLENECKS/BOTTLENECKS.csv" \
"component,period,demand_score,supply_score,bottleneck_score,status"

create_if_missing "$ROOT/07_RESEARCH_EVENTS/EVENTS.csv" \
"date,company,ticker,event,category,importance"

create_if_missing "$ROOT/08_INVESTMENT_SCORES/SCORES.csv" \
"period,ticker,score,weight,action"

# -----------------------------
# Platform test scaffolding
# -----------------------------

for p in FISCAL KOYFIN AIRTABLE TRADESVIZ; do
  create_if_missing "$ROOT/09_PLATFORM_TESTS/$p/TEST_RESULTS.csv" \
"test_id,test_name,status,time_minutes,notes"
done

create_if_missing "$ROOT/10_FINAL_RESULTS/FINAL_DECISION.md" \
"# Final Decision
Keep:
Discard:
Conditional:
"

echo "----------------------------------"
echo "Setup complete."
echo "Root: $ROOT"
echo "----------------------------------"
