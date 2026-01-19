# Contributing Guidelines

## Purpose
This repository maintains an institutional-grade investment thesis. Contributions must preserve logical integrity, auditability, and version discipline.

## Core Rules
1. Human-Readable (HR) files are the only source of truth.
2. JSON and AGENT files are derived artifacts only.
3. DATA files may never introduce or alter logic.
4. No speculative claims without explicit flags.

## Allowed Contributions
- Data patches (`*-DATA_*.md`)
- Proposed diffs to HR files (never silent edits)
- Documentation improvements

## Prohibited Actions
- Direct edits to JSON or AGENT files
- Narrative-driven changes without data support
- Removing warnings without evidence

## Review Discipline
All logic changes must:
- Be scoped in a changelog draft
- Reference confirmation or contradiction metrics
- Be committed with clear messages
