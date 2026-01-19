# Pre-Commit Hooks Setup

This repository uses the **pre-commit framework** to enforce thesis integrity.

## What is enforced
- JSON and AGENT artifacts must validate against schemas
- HR remains the source of truth
- No commit can introduce structural drift

## Setup (one-time)

1. Install pre-commit:
```bash
pip install pre-commit
```

2. Install hooks:
```bash
pre-commit install
```

3. Test hooks manually:
```bash
pre-commit run --all-files
```

## How it works
- On every commit, the latest HR thesis is validated
- Commits fail if schema validation fails

## Updating versions
When a new HR version is created:
- Update `.pre-commit-config.yaml` to point to the new HR file
- Commit the change
