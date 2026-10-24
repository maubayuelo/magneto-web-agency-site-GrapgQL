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

Phase 0 — baseline. No code changes until the Phase 0 report is reviewed.
(Update this line when a phase closes.)
