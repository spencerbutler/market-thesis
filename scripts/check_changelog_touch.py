#!/usr/bin/env python3
"""
Pre-commit gate: if this commit changes dashboard behavior (dashboard/ or
a DASHBOARD_SPEC*.json file), CHANGELOG.md or DECISION_LOG.md must also be
staged. Added 2026-08-27 after an audit found dashboard/card changes had
gone in for months with neither file touched since their initial commit,
despite the org's own AGENTS.md/.cursorrules saying this was mandatory.

Escape hatch: a change that genuinely doesn't warrant a changelog entry
(e.g. a comment fix, a typo) can skip this check with
`git commit --no-verify`, same as any other pre-commit gate.
"""

from __future__ import annotations

import subprocess
import sys


def staged_files() -> list[str]:
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True,
        text=True,
        check=True,
    )
    return [line for line in out.stdout.splitlines() if line]


def main() -> int:
    files = staged_files()
    touches_behavior = any(
        f.startswith("dashboard/") or f.startswith("DASHBOARD_SPEC")
        for f in files
    )
    if not touches_behavior:
        return 0

    touches_log = any(f in ("CHANGELOG.md", "DECISION_LOG.md") for f in files)
    if touches_log:
        return 0

    print(
        "[BLOCKED] This commit changes dashboard/ or a DASHBOARD_SPEC file "
        "but doesn't touch CHANGELOG.md or DECISION_LOG.md.\n"
        "          If this is a real behavior change, add an entry. If it "
        "genuinely isn't, commit with --no-verify.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
