# Thesis Versioning & Integrity Rules

## Purpose
This document defines the **non-negotiable rules** governing thesis evolution, data updates, and agent interaction.  
Its role is to prevent silent drift, narrative contamination, and version confusion.

This file is **institutional control documentation**, not analysis.

---

## Canonical Source of Truth

- The **Human-Readable (HR) thesis** is always the source of truth.
- JSON and AGENT artifacts are **mechanically derived**.
- No system or agent may modify derived artifacts directly.

---

## Versioning Scheme

### Major Version (Structural Reset)
**Format:** vX.0-HR_YYYYMMDD  
**Use when:**
- Thesis framework is replaced
- Ontology spine is rewritten
- Time horizon or philosophy changes

**Example:** v2.0-HR_20270105

---

### Minor Version (Thesis Logic Change)
**Format:** vX.Y-HR_YYYYMMDD  
**Use when:**
- Sector weights change
- Rotation order changes
- New sectors added or removed
- Policy assumptions added, removed, or upgraded
- Risk framework materially changes

**Example:** v1.7-HR_20260210

**Rules:**
- Must include explicit changelog
- Prior version is frozen and archived
- JSON and AGENT must be regenerated

---

### Patch / Data Version (No Logic Changes)
**Format:** vX.Y.Z-DATA_YYYYMMDD  
**Use when:**
- Prices updated
- Dividend yields updated
- Portfolio weights recalculated
- Macro indicators refreshed

**Rules:**
- Narrative MUST NOT change
- Logic MUST NOT change
- Exists purely for auditability

**Example:** v1.6.1-DATA_20260118

---

## Freeze Rules

When a thesis version is frozen:
- No edits allowed except errata
- All future work occurs in:
  - DATA patches, or
  - a new minor/major version

Frozen versions are immutable.

---

## Research Required Discipline

Any unverified claim must be explicitly labeled:

- `RESEARCH REQUIRED`
- `SPECULATIVE`
- `NON-ACTIONABLE`

Agents must NEVER:
- Upgrade these labels without primary-source confirmation
- Treat speculative items as base-case inputs

---

## Policy Dependency Flagging

All policy-linked assumptions must be tagged:
- ⚠️ POLICY DEPENDENT: HIGH / MEDIUM / LOW

Agents must model reversal scenarios explicitly.

---

## Agent Interaction Rules

Agents may:
- Read HR thesis
- Read DATA patches
- Update DATA patches
- Propose diffs to HR thesis

Agents may NOT:
- Modify HR thesis directly
- Invent data
- Infer policy status
- Remove warnings or flags

All agent output must be **diff-oriented**, not overwrite-based.

---

## Manifest Requirements

A `manifest.json` must always exist and declare:
- Latest HR version
- Latest JSON version
- Latest AGENT version
- Available DATA patches

No ambiguity is permitted.

---

## Integrity Tests (Human Checklist)

Before accepting any update:
- Is the version increment correct?
- Is this logic or data?
- Are all speculative claims flagged?
- Does JSON match HR exactly?
- Does AGENT reference the correct HR version?

If any answer is “no”, the update is rejected.

---

## Enforcement Principle

**Data changes fast.  
Logic changes slowly.  
Narrative changes last.**

This system enforces that order.

