# qa-i18n: EN ↔ FR-CA / ES copy QA

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
