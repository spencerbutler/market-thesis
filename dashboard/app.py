import json
from pathlib import Path

import streamlit as st

REPO_ROOT = Path(__file__).resolve().parent

st.set_page_config(page_title="Market Thesis Dashboard", layout="wide")

st.title("Market Thesis Dashboard")
st.caption("Data-first monitoring UI. No narratives. No execution.")

# --- Load manifest_latest.json (stable entry point) ---
manifest_file = REPO_ROOT.parent / "manifest_latest.json"
if not manifest_file.exists():
    st.error("manifest_latest.json not found in app directory. Place it next to app.py.")
    st.stop()

manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
latest = manifest.get("latest", {})

col1, col2, col3, col4 = st.columns(4)
col1.metric("HR (source of truth)", latest.get("hr", ""))
col2.metric("JSON (derived)", latest.get("json", ""))
col3.metric("AGENT (derived)", latest.get("agent", ""))
col4.metric("Spec", latest.get("dashboard_spec", ""))

st.divider()

spec_path = REPO_ROOT.parent / latest.get("dashboard_spec", "")
if not spec_path.exists():
    st.warning("Dashboard spec not found next to app.py. Place it in the app directory.")
    st.stop()

spec = json.loads(spec_path.read_text(encoding="utf-8"))

pages = spec.get("dashboard", {}).get("layout", {}).get("pages", [])
card_defs = spec.get("dashboard", {}).get("cards", {})

tab_titles = [p.get("title", p.get("id", "Page")) for p in pages] or ["Overview"]
tabs = st.tabs(tab_titles)

def render_card(card_id: str):
    card = card_defs.get(card_id, {})
    title = card.get("title", card_id)
    ctype = card.get("type", "unknown")

    with st.container(border=True):
        st.subheader(title)
        st.caption(f"Card type: {ctype}")

        # Placeholder content - wire data adapters later
        if ctype in {"status_summary", "kpi_grid"}:
            st.info("Placeholder. Wire live data via dashboard/adapters/*.")
        elif ctype in {"multi_series_chart", "chart_plus_thresholds"}:
            st.line_chart({"placeholder": [0, 1, 0, 1]})
        elif ctype in {"allocation_table"}:
            rows = card.get("rows", [])
            if rows:
                st.dataframe(rows, use_container_width="stretch")
            else:
                st.info("No rows defined in spec.")
        elif ctype in {"rule_list"}:
            rules = card.get("rules", [])
            if rules:
                for r in rules:
                    st.write(f"- **{r.get('id','rule')}**: IF `{r.get('if','')}` THEN `{r.get('then','')}` ({r.get('severity','')})")
            else:
                st.info("No rules defined in spec.")
        elif ctype in {"checklist"}:
            items = card.get("items", [])
            if items:
                for it in items:
                    st.checkbox(it.get("text", "Item"), value=False, key=f"chk_{card_id}_{it.get('text','')}")
            else:
                st.info("No checklist items in spec.")
        else:
            st.code(json.dumps(card, indent=2), language="json")

for idx, page in enumerate(pages or [{"id": "overview", "title": "Overview", "cards": []}]):
    with tabs[idx]:
        st.write(f"### {page.get('title','')}")
        st.caption(f"Page id: {page.get('id','')}")
        cards = page.get("cards", [])
        if not cards:
            st.info("No cards defined for this page in the dashboard spec.")
        else:
            for card_id in cards:
                render_card(card_id)

st.divider()
with st.expander("Diagnostics"):
    st.write("manifest_latest.json:")
    st.code(json.dumps(manifest, indent=2), language="json")
    st.write("Dashboard spec meta:")
    st.code(json.dumps(spec.get("meta", {}), indent=2), language="json")
