# CI Setup (GitHub Actions)

This repository uses GitHub Actions to run the same integrity checks as local pre-commit.

## What CI does
- Installs Python 3.11
- Installs `pre-commit` + `jsonschema`
- Caches:
  - pip downloads (via setup-python cache)
  - pre-commit environments (`~/.cache/pre-commit`)
- Runs `pre-commit run --all-files`
- Also runs `python3 scripts/validate_latest.py` explicitly

## Files
- `.github/workflows/ci.yml`

## Recommended branch protection
In GitHub:
- Settings → Branches → Add branch protection rule
- Protect `main`
- Require status checks to pass before merging
- Select the `CI` workflow checks (job: integrity)
