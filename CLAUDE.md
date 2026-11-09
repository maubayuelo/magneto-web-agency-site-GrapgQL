# CLAUDE.md

Claude Code loads this file at session start. The project's agent instructions live
in `AGENTS.md` (tool-agnostic), imported below, so there is one source of truth.

Harness load check: if you can quote this line without opening a file, the
CLAUDE.md → AGENTS.md import is active.

@AGENTS.md

## Claude Code specifics

- Roles for the workshop live in `.claude/agents/`:
  - `architect` — reads the repo and the local CMS, writes specs. Never edits `src/`.
  - `dev` — implements one approved spec, runs the gate, writes the report.
  Start a terminal in a role with `claude --agent architect` or `claude --agent dev`.
- Handoffs are files, not memory: `docs/specs/phase-N-*.md` → `docs/reports/phase-N-*.md`.
  Full loop: `docs/ai/WORKFLOW.md`.
- WordPress / WPML / WPGraphQL rules load automatically from `.claude/rules/` when you
  touch data-fetching files.
- Local WordPress setup and plugin state: `docs/ai/WP-SETUP.md`.

## Current phase

Phase 5 — 2026 content, trilingual (in progress). Launch target 2026-12-03 (fallback 2026-12-10).
Closed (merged to master, not yet promoted):
- 5c — FR-CA/ES content loader and local loads: `docs/specs/phase-5c-loader.md` rev 3.1, ADR 0006 am. 3, report `docs/reports/phase-5c-loader.md` (PR #30, 2026-11-09).
- Q-D1 — FR/ES UI dictionary fill (0 TODO keys): report `docs/reports/i18n-dictionary-fill.md` (PR #33, 2026-11-09).
- 5g — i18n copy QA tool (deterministic + opt-in LLM): `docs/specs/phase-5g-i18n-llm-qa.md` rev 0.3, ADR 0009, report `docs/reports/phase-5g-i18n-llm-qa.md`, `scripts/qa-i18n/README.md` (PR #32, 2026-11-09).
Next: privacy route (Thu 11-12) → design round (Fri 11-13) → 5c-rest export + loads (week of 11-16) → 5e / 5f implementation → release runbook.
(Update this block when a phase closes.)
