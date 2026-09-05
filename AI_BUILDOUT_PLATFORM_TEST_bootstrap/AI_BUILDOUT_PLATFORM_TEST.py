from pathlib import Path
import textwrap, os

base = Path("/home/spencer/git/market-thesis/AI_BUILDOUT_PLATFORM_TEST")
script_path = base / "setup_ai_buildout.sh"
base.mkdir(parents=True, exist_ok=True)

script = r'''#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-AI_BUILDOUT_PLATFORM_TEST}"

mkdir -p "$ROOT"/{
00_ADMIN,
01_COMPANIES,
02_FINANCIALS,
03_HYPERSCALERS,
04_SUPPLY_CAPACITY,
05_INVENTORY,
06_BOTTLENECKS,
07_RESEARCH_EVENTS,
08_INVESTMENT_SCORES,
09_PLATFORM_TESTS/FISCAL,
09_PLATFORM_TESTS/KOYFIN,
09_PLATFORM_TESTS/AIRTABLE,
09_PLATFORM_TESTS/TRADESVIZ,
10_FINAL_RESULTS
}

# -----------------------------
# 00_ADMIN
# -----------------------------

cat > "$ROOT/00_ADMIN/DATA_DICTIONARY.csv" <<'EOF'
field,meaning,unit,frequency,source,notes
company_id,Unique internal company identifier,,Static,Master,
ticker,US-listed ticker or ADR,,Static,Master,
company_name,Legal/common company name,,Static,Master,
group,AI build-out primary group,,Static,Master,
subgroup,AI build-out subgroup,,Static,Master,
peer_rank,Peer ranking within subgroup,,Periodic,Model,
ai_role,Role in AI build-out,,Static,Research,
period,Reporting period,,Quarterly,Source,
revenue,Reported revenue,USD,Quarterly,Financial,
revenue_yoy,Revenue year-over-year growth,%,Quarterly,Calculated,
eps,Earnings per share,USD/share,Quarterly,Financial,
eps_yoy,EPS year-over-year growth,%,Quarterly,Calculated,
gross_margin,Gross margin,%,Quarterly,Financial,
operating_margin,Operating margin,%,Quarterly,Financial,
free_cash_flow,Free cash flow,USD,Quarterly,Financial,
capex,Capital expenditures,USD,Quarterly,Financial,
capex_yoy,Capex year-over-year growth,%,Quarterly,Calculated,
capex_guidance,Forward capex guidance,USD,Quarterly,Management,
inventory,Inventory,USD,Quarterly,Financial,
inventory_yoy,Inventory year-over-year growth,%,Quarterly,Calculated,
inventory_days,Inventory days,Days,Quarterly,Calculated,
backlog,Reported backlog,USD,Quarterly,Company,
cash,Cash and equivalents,USD,Quarterly,Financial,
debt,Debt,USD,Quarterly,Financial,
data_center_expansion,Data center expansion commentary/commitment,,Quarterly,Research,
power_requirement,Power requirement,MW/GW,Event/quarter,Research,
power_commitment,Power commitment,MW/GW,Event/quarter,Research,
capacity,Production/service capacity,,Quarterly,Company/industry,
capacity_growth,Capacity growth,%,Quarterly,Calculated,
utilization,Capacity utilization,%,Quarterly,Company/industry,
lead_time,Lead time,Days/weeks,Periodic,Industry,
pricing_trend,Pricing direction,,Periodic,Research,
demand,Demand assessment,,Periodic,Research,
supply,Supply assessment,,Periodic,Research,
demand_score,Demand score,0-100,Periodic,Model,
supply_score,Supply score,0-100,Periodic,Model,
inventory_score,Inventory condition score,0-100,Periodic,Model,
lead_time_score,Lead-time tightness score,0-100,Periodic,Model,
pricing_score,Pricing-power/tightness score,0-100,Periodic,Model,
bottleneck_score,Composite bottleneck score,0-100,Periodic,Model,
status,Bottleneck status,,Periodic,Model,
evidence,Supporting evidence,,Event,Research,
source,Source name,,Event/metric,Research,
source_date,Source publication/report date,,Event/metric,Research,
url,Source URL,,Event,Research,
confidence,Source/data confidence,,Event/metric,Model,
event_id,Unique research event identifier,,Event,Master,
date,Event date,,Event,Research,
category,Research event category,,Event,Research,
event,Description of event,,Event,Research,
old_state,Prior state,,Event,Research,
new_state,New state,,Event,Research,
importance,Event importance,Low/Medium/High,Event,Model,
fundamental_score,Fundamental score,0-100,Periodic,Model,
positioning_score,Positioning score,0-100,Periodic,Model,
technical_score,Technical score,0-100,Periodic,Model,
composite_score,Overall investment score,0-100,Periodic,Model,
current_weight,Current portfolio weight,%,Periodic,Portfolio,
target_weight,Target portfolio weight,%,Periodic,Portfolio,
action,Portfolio action,,Periodic,Model
EOF

cat > "$ROOT/00_ADMIN/TEST_PROTOCOL.md" <<'EOF'
# AI Build-Out Platform Trial

## Objective
Evaluate Fiscal.ai, Koyfin, Airtable, and TradesViz as components of a low-manual-input AI build-out research and portfolio workflow.

## Hard requirement
Individual record-by-record manual data entry is considered a failure for the core research database.

## Preferred ingestion order
1. Native automatic data
2. API / automated synchronization
3. CSV import
4. File import
5. Manual entry

## Core tests
- Initial data ingestion
- Structured financial data
- External research ingestion
- Hyperscaler capex tracking
- Supply/capacity tracking
- Inventory tracking
- Bottleneck identification
- Research-event tracking
- Peer ranking
- Capital rotation
- Thesis-kill conditions
- Incremental refresh
- Correction of existing data
- Addition of a new company
- Addition of a new subgroup
- Source traceability
- Time required per update

## Manual-touch standard
0 = automated/native
1 = one prepared import/sync
2-5 = marginal
6+ = poor
Individual record entry = fail for the core database
EOF

cat > "$ROOT/00_ADMIN/README.md" <<'EOF'
# AI Build-Out Platform Trial

This directory contains the canonical test dataset and platform evaluation structure.

Do not create platform-specific versions of the master company universe unless required by a platform's schema. The canonical files are the source of truth.

## Platform roles

- Fiscal.ai: financial/research data acquisition
- Airtable: relational research database and external research
- Koyfin: market analysis, screening, charts, custom data series
- TradesViz: trading execution/journal/performance layer

## Important
SPCX (SpaceX) is maintained in the thesis/watch universe but is separately flagged because it is a newly listed security with limited historical data. It should not be allowed to distort the core public-equity platform comparison until data availability is verified.
EOF

# -----------------------------
# 01_COMPANIES
# -----------------------------

cat > "$ROOT/01_COMPANIES/COMPANIES.csv" <<'EOF'
company_id,ticker,company_name,group,subgroup,cap_tier,peer_rank,ai_role
AI001,NVDA,NVIDIA,Hyperscalers / AI Compute / Cloud,AI accelerators,Large/Mega,,Compute
AI002,AMD,Advanced Micro Devices,Hyperscalers / AI Compute / Cloud,AI accelerators,Large/Mega,,Compute
AI003,AVGO,Broadcom,Hyperscalers / AI Compute / Cloud,AI accelerators / custom silicon,Large/Mega,,Compute/networking
AI004,MSFT,Microsoft,Hyperscalers / AI Compute / Cloud,Hyperscaler,Large/Mega,,AI demand
AI005,AMZN,Amazon,Hyperscalers / AI Compute / Cloud,Hyperscaler,Large/Mega,,AI demand
AI006,GOOGL,Alphabet,Hyperscalers / AI Compute / Cloud,Hyperscaler,Large/Mega,,AI demand
AI007,META,Meta Platforms,Hyperscalers / AI Compute / Cloud,Hyperscaler,Large/Mega,,AI demand
AI008,CRWV,CoreWeave,Hyperscalers / AI Compute / Cloud,AI cloud,Mid/Small,,Compute demand
AI009,NBIS,Nebius,Hyperscalers / AI Compute / Cloud,AI cloud,Mid/Small,,Compute demand
AI010,MU,Micron Technology,Semiconductor / Memory,Memory / HBM,Large/Mega,,Memory
AI011,INTC,Intel,Semiconductor / Memory,CPU / foundry,Large/Mega,,Compute/foundry
AI012,MRVL,Marvell Technology,Semiconductor / Memory,Custom silicon / connectivity,Large/Mega,,Compute/networking
AI013,ON,ON Semiconductor,Semiconductor / Memory,Power semiconductors,Large/Mega,,Power electronics
AI014,MCHP,Microchip Technology,Semiconductor / Memory,Embedded / semiconductors,Mid/Small,,Semiconductor
AI015,WOLF,Wolfspeed,Semiconductor / Memory,Power semiconductors,Mid/Small,,Power electronics
AI016,TSM,Taiwan Semiconductor Manufacturing,Foundry / Equipment / Packaging,Foundry,Large/Mega,,Foundry
AI017,AMAT,Applied Materials,Foundry / Equipment / Packaging,Semiconductor equipment,Large/Mega,,Equipment
AI018,LRCX,Lam Research,Foundry / Equipment / Packaging,Semiconductor equipment,Large/Mega,,Equipment
AI019,KLAC,KLA,Foundry / Equipment / Packaging,Process control,Large/Mega,,Equipment
AI020,ASML,ASML Holding,Foundry / Equipment / Packaging,Lithography,Large/Mega,,Equipment
AI021,ARM,Arm Holdings,Foundry / Equipment / Packaging,CPU architecture,Large/Mega,,Compute IP
AI022,AMKR,Amkor Technology,Foundry / Equipment / Packaging,Advanced packaging,Mid/Small,,Packaging
AI023,ONTO,Onto Innovation,Foundry / Equipment / Packaging,Advanced packaging / metrology,Mid/Small,,Equipment
AI024,ANET,Arista Networks,Networking / Optics / Photonics,Networking,Large/Mega,,Networking
AI025,CSCO,Cisco Systems,Networking / Optics / Photonics,Networking,Large/Mega,,Networking
AI026,APH,Amphenol,Networking / Optics / Photonics,Connectivity,Large/Mega,,Connectivity
AI027,CIEN,Ciena,Networking / Optics / Photonics,Optical networking,Large/Mega,,Optics
AI028,GLW,Corning,Networking / Optics / Photonics,Optical fiber / photonics,Large/Mega,,Optics
AI029,LITE,Lumentum,Networking / Optics / Photonics,Lasers / optical components,Large/Mega,,Lasers/optics
AI030,COHR,Coherent,Networking / Optics / Photonics,Lasers / optical components,Mid/Small,,Lasers/optics
AI031,AAOI,Applied Optoelectronics,Networking / Optics / Photonics,Optical transceivers,Mid/Small,,Optics
AI032,CRDO,Credo Technology,Networking / Optics / Photonics,High-speed connectivity,Mid/Small,,Networking/optics
AI033,VST,Vistra,Power / Grid / Nuclear / Generation,Power generation,Large/Mega,,Data-center power
AI034,CEG,Constellation Energy,Power / Grid / Nuclear / Generation,Nuclear,Large/Mega,,Nuclear power
AI035,GEV,GE Vernova,Power / Grid / Nuclear / Generation,Grid / generation equipment,Large/Mega,,Power/grid
AI036,ETN,Eaton,Power / Grid / Nuclear / Generation,Electrical equipment,Large/Mega,,Grid
AI037,PWR,Quanta Services,Power / Grid / Nuclear / Generation,Grid construction,Large/Mega,,Grid
AI038,OKLO,Oklo,Power / Grid / Nuclear / Generation,Advanced nuclear,Mid/Small,,Nuclear power
AI039,BE,Bloom Energy,Power / Grid / Nuclear / Generation,On-site power / fuel cells,Mid/Small,,Data-center power
AI040,VRT,Vertiv,Data Center / Physical Infrastructure,Power / cooling,Large/Mega,,Data-center infrastructure
AI041,DELL,Dell Technologies,Data Center / Physical Infrastructure,Servers / infrastructure,Large/Mega,,Compute infrastructure
AI042,HPE,Hewlett Packard Enterprise,Data Center / Physical Infrastructure,Servers / infrastructure,Large/Mega,,Compute infrastructure
AI043,EQIX,Equinix,Data Center / Physical Infrastructure,Data centers,Large/Mega,,Data-center infrastructure
AI044,DLR,Digital Realty,Data Center / Physical Infrastructure,Data centers,Large/Mega,,Data-center infrastructure
AI045,SMCI,Super Micro Computer,Data Center / Physical Infrastructure,Servers / liquid cooling,Mid/Small,,Compute infrastructure
AI046,MOD,Modine Manufacturing,Data Center / Physical Infrastructure,Cooling,Mid/Small,,Data-center cooling
AI047,STX,Seagate Technology,Storage / Data Infrastructure,Hard disk drives,Large/Mega,,AI storage
AI048,WDC,Western Digital,Storage / Data Infrastructure,Data storage,Large/Mega,,AI storage
AI049,NTAP,NetApp,Storage / Data Infrastructure,Enterprise storage,Large/Mega,,AI storage
AI050,FCX,Freeport-McMoRan,Materials / Critical Minerals / Substrate Inputs,Copper,Large/Mega,,Copper
AI051,USAR,USA Rare Earth,Materials / Critical Minerals / Substrate Inputs,Rare earths,Mid/Small,,Critical minerals
AI052,MP,MP Materials,Materials / Critical Minerals / Substrate Inputs,Rare earths,Mid/Small,,Critical minerals
AI053,PANW,Palo Alto Networks,Cybersecurity,Network/security,Large/Mega,,Cybersecurity
AI054,CRWD,CrowdStrike,Cybersecurity,Endpoint/cloud security,Large/Mega,,Cybersecurity
AI055,FTNT,Fortinet,Cybersecurity,Network security,Large/Mega,,Cybersecurity
AI056,NTSK,Netskope,Cybersecurity,SASE/cloud security,Mid/Small,,Cybersecurity
AI057,CRM,Salesforce,Software / AI Adoption,Enterprise software,Large/Mega,,AI software adoption
AI058,NOW,ServiceNow,Software / AI Adoption,Enterprise workflow software,Large/Mega,,AI software adoption
AI059,ADBE,Adobe,Software / AI Adoption,Creative/document software,Large/Mega,,AI software adoption
AI060,ORCL,Oracle,Software / AI Adoption,Enterprise software / cloud,Large/Mega,,AI software adoption
AI061,NET,Cloudflare,Software / AI Adoption,Cloud/application infrastructure,Mid/Small,,AI software adoption
AI062,FIVN,Five9,Software / AI Adoption,Contact center software,Mid/Small,,AI software adoption
AI063,NTNX,Nutanix,Software / AI Adoption,Enterprise infrastructure software,Mid/Small,,AI software adoption
AI064,SPCX,SpaceX,Thesis / Watch Only,Newly listed / aerospace,Watch Only,,Core thesis / external infrastructure
EOF

# -----------------------------
# Empty/template datasets
# -----------------------------

cat > "$ROOT/02_FINANCIALS/FINANCIALS.csv" <<'EOF'
company_id,ticker,period,revenue,revenue_yoy,eps,eps_yoy,gross_margin,operating_margin,free_cash_flow,capex,capex_yoy,capex_guidance,inventory,inventory_yoy,inventory_days,backlog,cash,debt,source,source_date,url,confidence
EOF

cat > "$ROOT/03_HYPERSCALERS/HYPERSCALER_CAPEX.csv" <<'EOF'
company_id,ticker,company_name,period,capex,capex_yoy,capex_guidance,data_center_expansion,power_requirement,power_commitment,ai_infrastructure_commentary,source,source_date,url,confidence
EOF

cat > "$ROOT/04_SUPPLY_CAPACITY/SUPPLY_CAPACITY.csv" <<'EOF'
period,component,company_id,ticker,product,capacity,capacity_growth,utilization,lead_time,pricing_trend,demand,supply,demand_score,supply_score,source,source_date,url,confidence
EOF

cat > "$ROOT/05_INVENTORY/INVENTORY.csv" <<'EOF'
company_id,ticker,period,inventory,inventory_yoy,inventory_days,revenue,revenue_yoy,inventory_revenue_ratio,inventory_minus_revenue_growth,interpretation,source,source_date,url,confidence
EOF

cat > "$ROOT/06_BOTTLENECKS/BOTTLENECKS.csv" <<'EOF'
period,component,demand_score,supply_score,inventory_score,lead_time_score,pricing_score,bottleneck_score,status,evidence,source,source_date,url,confidence
EOF

cat > "$ROOT/07_RESEARCH_EVENTS/EVENTS.csv" <<'EOF'
event_id,date,company_id,ticker,category,event,old_state,new_state,importance,evidence,source,source_date,url,confidence
EOF

cat > "$ROOT/08_INVESTMENT_SCORES/SCORES.csv" <<'EOF'
period,company_id,ticker,group,subgroup,peer_rank,fundamental_score,demand_score,supply_score,inventory_score,positioning_score,technical_score,composite_score,current_weight,target_weight,action,thesis_status,entry_trigger,hold_condition,reduce_trigger,exit_trigger,source,source_date,confidence
EOF

# -----------------------------
# Platform test templates
# -----------------------------

for platform in FISCAL KOYFIN AIRTABLE TRADESVIZ; do
  cat > "$ROOT/09_PLATFORM_TESTS/$platform/TEST_RESULTS.csv" <<EOF
test_id,test_name,status,manual_touches,time_minutes,data_coverage,data_quality,refreshability,notes
EOF
done

cat > "$ROOT/09_PLATFORM_TESTS/PLATFORM_SCORECARD.csv" <<'EOF'
platform,automated_native_data,external_data_ingestion,financial_data_quality,research_ai_quality,supply_chain_modeling,inventory_capacity,hyperscaler_tracking,screening_ranking,portfolio_rotation,alerts_refresh,cost_efficiency,manual_touch_score,overall_score,notes
EOF

cat > "$ROOT/09_PLATFORM_TESTS/MANUAL_TOUCH_LOG.csv" <<'EOF'
date,platform,test,action,manual_touches,time_minutes,description
EOF

# -----------------------------
# Final results
# -----------------------------

cat > "$ROOT/10_FINAL_RESULTS/FINAL_DECISION.md" <<'EOF'
# Final Platform Decision

## Keep

-

## Discard

-

## Conditional / Secondary

-

## Recommended Architecture

Research/data acquisition:
-

Research database:
-

Market analysis:
-

Trading journal/performance:
-

## Open Issues

-
EOF

cat > "$ROOT/10_FINAL_RESULTS/WEEKEND_CHECKLIST.md" <<'EOF'
# Weekend Checklist

## Accounts
- [ ] Fiscal.ai trial
- [ ] Koyfin trial
- [ ] Airtable trial/free plan
- [ ] TradesViz trial

## Data
- [ ] Review 64-row company universe
- [ ] Confirm ticker/company mappings
- [ ] Confirm SPCX handling as watch-only
- [ ] Run financial data extraction test
- [ ] Run hyperscaler test
- [ ] Run supply/capacity test
- [ ] Run inventory test
- [ ] Run bottleneck test
- [ ] Run research-event test
- [ ] Run scoring test

## Platform tests
- [ ] Fiscal
- [ ] Koyfin
- [ ] Airtable
- [ ] TradesViz

## Refresh test
- [ ] Add a new quarter
- [ ] Correct an existing value
- [ ] Add a company
- [ ] Add a research event
- [ ] Measure manual touches

## Final
- [ ] Score platforms
- [ ] Decide architecture
- [ ] Document workflow
EOF

echo "Created AI Build-Out platform trial structure in: $ROOT"
echo "Company universe: $ROOT/01_COMPANIES/COMPANIES.csv"
echo "Next step: review/validate the company universe before populating financial and research data."
'''

script_path.write_text(script)
script_path.chmod(0o755)

print(f"Created: {script_path}")

