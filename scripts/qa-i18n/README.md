# qa-i18n: EN ↔ FR-CA / ES copy QA

## How it works — overview

qa-i18n is a dev-only script that compares the FR-CA and ES copy with the EN copy and only flags problems. It never
translates or edits text, never touches WordPress and never writes in the repository.

Links: [spec](../../docs/specs/phase-5g-i18n-llm-qa.md) · [ADR 0009](../../docs/adr/0009-dev-only-llm-qa-tooling.md) ·
[phase 5g report](../../docs/reports/phase-5g-i18n-llm-qa.md)

### What it reads

| Source (`--sources`) | Files | What is in them |
|---|---|---|
| `content-json` | `scripts/phase-5c/content/{en,fr,es}.json` | Page and project copy (ACF fields) exported from the CMS |
| `dictionary` | `src/i18n/dictionaries/{en,fr,es}.ts` | UI microcopy: buttons, labels, form errors, aria-labels, metadata |
| `export` | `docs/content/magneto-copy-{en,fr-CA,es}.md`, sections listed in `config/export-sections.json` | Privacy policy §1–11 (and three package cards, deterministic checks only) |

### What happens in a run

1. **Read and pair.** Each FR-CA / ES value is paired with its EN value: by post slug + field, by dictionary key, or
   by export section id.
2. **Deterministic checks (no AI).** Plain code looks for things like placeholder markers (`[FR TODO]`, `TBD`),
   missing values, text identical to EN, kept terms (brand names), currency and length limits. These checks are
   free, fast and give the same result every time.
3. **Semantic checks, only with `--llm`.** The pairs are sent to Claude in batches. The model looks for meaning
   problems that code can't see: omissions, additions, meaning drift.
4. **Structured outputs.** The model must answer in a fixed JSON schema, not free text.
5. **Validation.** Each answer is checked with zod. An invalid answer is asked again once. If it is still invalid,
   the batch is marked failed and the run is reported as incomplete (exit 3).
6. **Report.** `report.json` + `report.md` are written outside the repo (default
   `~/Documents/projects/magneto/qa/i18n/<timestamp>/`).
7. **Human triage.** Mauricio reads every finding and decides: real fix, false positive or accepted transcreation.
   The tool fixes nothing.

### Why a script and not a chat

| | Pasting copy into a chat | This script |
|---|---|---|
| Input | Manual copy/paste, easy to miss a key | Every pair from the files, sent in batches by code |
| Output | Free text, format changes each time | Fixed JSON schema, validated |
| Reliability | Unknown | Measured with a seeded-defect eval (`evals/`) |
| Cost | Unknown | Estimated before the run (`--plan`), actual cost reported after |
| Side effects | A chat tool may offer to rewrite or write files | Read-only, tested: the repo's `git status` is identical before and after a run |

### Eval results (2026-11-09, worse of 2 runs)

The eval runs the tool on a fixture with 14 planted defects (6 deterministic, 8 LLM) and 4 clean controls.

| Model | Deterministic recall | LLM recall | Errors on clean controls | Unplanted findings (noise) | Actual cost |
|---|---|---|---|---|---|
| Claude Haiku 5.5 | 6/6 | 8/8 | 0 | 2 | $0.01 |
| Claude Opus 5.5 | 6/6 | 8/8 | 0 | 0 | $0.26 |

Both pass, so the default model is the cheaper one: **`claude-haiku-5-5`**.

### Known limits

- **The LLM layer is non-deterministic.** Two runs on identical input gave 13 and 16 warnings. That is why the eval
  scores the worse of `--repeat 2` runs, and why a human triages every finding.
- **No label context in batches.** A help text goes to the model without its field label, so a condition the label
  already states can look "dropped" (a false positive).
- **Files, not rendered pages.** The tool checks the copy files. It does not see the live site, the CMS or how text
  looks on screen (layout, truncation, ACF defaults).

### Quick start

```bash
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --deterministic-only   # no key, no network
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --plan                 # shows batches and cost estimate; sends nothing
npm run qa:i18n -- --llm                                                       # deterministic + LLM
```

`--llm` needs `MAGNETO_QA_ANTHROPIC_API_KEY` exported in your shell. Never put the key in `.env.local` or anywhere
in the repo: the tool loads no `.env` file.

The technical reference follows.

## Reference

**Flags only.** The tool never edits, rewrites or translates text, and it never writes in the repository. Mauricio
decides every fix. Spec: `docs/specs/phase-5g-i18n-llm-qa.md`. Decision: `docs/adr/0009-dev-only-llm-qa-tooling.md`.

Inputs (v1): `scripts/phase-5c/content/{en,fr,es}.json` (`content-json`), `src/i18n/dictionaries/{en,fr,es}.ts`
(`dictionary`) and the sections of `docs/content/magneto-copy-{en,fr-CA,es}.md` listed in `config/export-sections.json`
(`export`). Values are aligned by post slug + field + row + sub-key, by dictionary key, or by section id. An export
anchor is the exact heading line; a section runs to the next heading of the same or a higher level; an anchor found
0 or 2+ times → exit 2. Sections with `coveredBy: "content-json"` get deterministic checks only.

```bash
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n            # deterministic checks only (default; no key, no network)
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --plan  # LLM batches + token/cost estimate; sends nothing
npm run qa:i18n -- --llm                                      # Mauricio only: deterministic + LLM (needs the key)
```

Flags: `--llm`, `--deterministic-only`, `--plan`, `--langs fr,es`, `--sources content-json,dictionary,export`,
`--model <id>` (else `QA_I18N_MODEL`, else the default in `qa-i18n.ts`), `--max-requests <n>` (60, ceiling 150),
`--max-input-tokens <n>` (400000, ceiling 1000000), `--max-output-tokens <n>` (4096 per request),
`--fail-on error|warning|info`, `--out <dir>` (default `~/Documents/projects/magneto/qa/i18n/<timestamp>/`; inside
the repo → exit 2).

Exit codes: `0` no finding at or above `--fail-on` · `1` findings at or above it · `2` usage/config error (bad flag,
missing key with `--llm`, `--out` in the repo, plan over a cap, export anchor not found or duplicated) · `3` incomplete (a batch failed, a cap was hit
mid-run, or the report failed its own schema).

The key: only `MAGNETO_QA_ANTHROPIC_API_KEY`, read only with `--llm`, never printed or written. No `.env` file is
loaded. Agents never pass `--llm` and prefix every run with `env -u MAGNETO_QA_ANTHROPIC_API_KEY`.

Config (`config/`): `glossary.json` (keep terms, register, CTA dictionary keys, allow-lists; approved by Mauricio),
`pricing.json` (per-model prices with source and date), `length-limits.json` (D-10 limits; placeholders → `info`
until the design round sets `status: "set"`), `export-sections.json` (the comparable export sections; Mauricio
reviews it). Eval: `evals/README.md`.
