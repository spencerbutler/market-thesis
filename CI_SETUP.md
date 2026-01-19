# CI Setup (GitHub Actions)

This repository uses GitHub Actions to run the same integrity checks as local pre-commit.

## What CI does
- Installs Python
- Installs `pre-commit` + `jsonschema`
- Runs `pre-commit run --all-files`

If CI fails, the push/PR should be treated as invalid until fixed.

## Files
- `.github/workflows/ci.yml`

## Recommended branch protection
In GitHub:
- Settings → Branches → Add branch protection rule
- Protect `main`
- Require status checks to pass before merging
- Select the `CI` workflow checks
