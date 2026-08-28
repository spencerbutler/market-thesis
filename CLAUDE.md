# market-thesis

@~/git/human-execution-engine/prompts/PROMPTING_RULES.md

**Real, required assumption:** the import above only resolves if this
machine follows the org's `~/git/<repo>` layout convention (`bin/init-org.sh`'s
`WORKSPACE_DIR="${HOME}/git"`). `~` is the most portable form Claude Code's
`@import` supports -- confirmed it does *not* expand `$HOME` or other env
vars, and there's no workspace-relative import mechanism. If it doesn't
resolve in this session, read `human-execution-engine/prompts/PROMPTING_RULES.md`
directly instead of assuming it loaded.

## This repo specifically

- **Source of truth**: HR markdown thesis files (`v*-HR_*.md`). JSON and
  AGENT JSON are *derived*, never hand-edited. `manifest_latest.json` is
  the stable entry point software reads.
- **Dashboard is spec-driven**: `DASHBOARD_SPEC*.json` defines pages/cards;
  `dashboard/app.py` implements `render_<type>(card_def)` per card type.
  If you touch the spec or add a card type, run
  `python3 scripts/validate_spec_integrity.py` and
  `pre-commit run --all-files` before committing -- both are real,
  installed (`.pre-commit-config.yaml`), not aspirational.
- **Never let the dashboard crash on missing/bad data.** Degrade
  gracefully: show `UNKNOWN`/a warning, skip the broken series, keep
  rendering everything else. This is the one principle worth carrying
  forward from this repo's old `.cursorrules`/`AGENTS.md` (removed
  2026-08-27 -- Claude Code never read either file; see below).
- Prefer minimal diffs; avoid touching many files for a change that
  doesn't need it.
- Versioned files follow `vX.Y-TYPE_YYYYMMDD.ext` -- don't change that
  format.

## Retired files (2026-08-27)

`AGENTS.md` and `.cursorrules` used to live here. Both were written for
tools other than Claude Code -- Claude Code never reads `.cursorrules` at
all, and never auto-loads `AGENTS.md` unless imported. An audit found
their rules were correspondingly unenforced in practice (`CHANGELOG.md`
and `DECISION_LOG.md` were each touched once, at initial commit, and never
again despite later dashboard/card changes; no commit ever matched the
mandated `"Wire <card_id> renderer (type=<type>)"` format). Their one real,
still-useful principle (graceful degradation, above) was kept; the rest
was dropped rather than carried forward as unenforced prose.
