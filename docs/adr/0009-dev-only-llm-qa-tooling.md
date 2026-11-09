# ADR 0009 — Dev-only LLM QA tooling (Anthropic SDK + zod)

- Status: Accepted
- Date: 2026-11-09
- Decider: Mauricio (D-1 = A, D-2 = A with a `tsx` fallback, D-3 = A, D-5 = A; 2026-11-09).
- Spec: [Phase 5g](../specs/phase-5g-i18n-llm-qa.md), Approved rev 0.3 (§1, §4, D-1 to D-5).

## Context

Phase 5g adds a local QA script, `npm run qa:i18n`. It compares the EN / FR-CA / ES copy files with deterministic checks
and, when asked, with an LLM that returns structured findings. It flags problems only and never changes text. It needs
two things the repo doesn't have: an Anthropic API client and runtime schema validation. AGENTS Hard rule 6 requires a
recorded decision before adding dependencies. The script also calls an external paid API with a secret key, so key
handling, spend and isolation from the site must be explicit.

## Decision

1. **Dependencies:** `@anthropic-ai/sdk` (the official TypeScript SDK) and `zod`, both as **`devDependencies`** pinned
   to exact versions.
   - The SDK is imported in exactly one file, `scripts/qa-i18n/anthropic-client.ts`, and loaded with a dynamic
     `import()` only when the tool runs with `--llm`.
   - zod is the single schema source: the LLM tool `input_schema`, the validation of every response, and the
     report's own schema.
2. **Never part of the site.** Nothing under `src/`, `next.config.ts`, the build, `start`, the `agent:*` scripts or CI
   imports the tool or these packages.
   - The unit tests run in CI with a fake client: no network, no key.
   - The seeded-defect eval and the real LLM runs are local and manual.
3. **TypeScript execution:** Node's native type stripping (Node ≥ 24; `.nvmrc` = 24.15.0), with
   `"allowImportingTsExtensions": true` in `tsconfig.json` (valid with the existing `noEmit: true`).
   - **Fallback:** `tsx`, exact-pinned devDependency, and no `tsconfig` change. Only if Node is below 24 or type
     stripping fails for this code. The phase report says which one is used.
4. **Structured output:** forced tool use (`report_findings`), with every response re-validated locally. Findings
   must quote excerpts that exist in the input, or they are rejected. The schema has no field for replacement text.
5. **Key and spend:**
   - The key lives in the dedicated workspace "magneto-qa", which has a spend limit. It is read only from
     `MAGNETO_QA_ANTHROPIC_API_KEY` at runtime; the script never loads an `.env` file.
   - It is never printed, logged or written to a report.
   - LLM calls happen only with an explicit `--llm` flag, after a plan with hard caps on requests and tokens.
   - Agents never pass `--llm`, and they unset the variable for every run.
6. **Data:** the inputs are the site's copy files, with internal editor notes excluded. No user data is sent, so the
   privacy policy is unaffected.

## Consequences

- Two new devDependencies (three if the fallback is used). `.npmrc` keeps `legacy-peer-deps` (Known debt). Any peer
  warning is recorded in the 5g report.
- Vercel installs devDependencies for the build, but nothing imports them, so the bundle and runtime are unchanged.
  The 5g acceptance criteria verify this with a grep and the build.
- The `tsconfig` option applies repo-wide. It only permits `.ts` import extensions and doesn't change emitted output
  (there is none).
- Model IDs, SDK parameters and prices drift. The model is configurable, and the 5g report records the docs URLs,
  their date and the SDK version used.
- **Reuse needs a new decision.** Using these packages in `src/`, in CI with a key, or for anything that generates
  or edits copy needs its own spec decision, and this ADR must be amended or replaced.
