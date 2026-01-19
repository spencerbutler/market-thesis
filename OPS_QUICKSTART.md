# Ops Quickstart

This repo is run using a strict discipline.

## Golden Rules
- HR files are the only source of truth
- DATA files never change logic
- JSON/AGENT are always regenerated
- Narrative never overrides data

## Typical Workflow
1. Observe data
2. Record DATA patch
3. Compare against HR triggers
4. If logic change needed → new changelog draft
5. Only then create next HR version

## Tools
- Cursor (Free is sufficient)
- Git
- No API key required for integrity workflow

## When in Doubt
Do nothing. Wait for confirmation.
