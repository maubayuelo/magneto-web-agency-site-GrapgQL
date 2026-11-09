# Phase 5g report — i18n copy QA tool (deterministic + opt-in LLM)

- Spec: `docs/specs/phase-5g-i18n-llm-qa.md` rev 0.3 (Approved) · ADR 0009
- Branch: `feat/phase-5g-i18n-llm-qa` (from `abfbb65`) · nothing committed, nothing staged
- Author: Dev · Date: 2026-11-09

## Result
Done, with AC-9 and AC-10 pending: Mauricio runs them on Wed 11-11. All six build steps are in, and the cut line was
not triggered because step 4 was done on Mon 11-09. Every agent command ran with the key removed. No `--llm` run was
made and no API request was sent.

## Changes

New, all under `scripts/qa-i18n/`:

**Pipeline**
- `schema.ts`: Unit, Finding, LLM output and Report schemas (zod is the single source). `toWireSchema()` strips the
  keywords that structured outputs don't support; local validation stays strict.
- `inputs.ts`: the adapters and the config schemas.
  - Adapters: `content-json` (§2.1), `dictionary` (§2.2, with an injectable module loader) and `export` (§2.3:
    `sliceSection` + `exportAdapter`).
  - Config schemas: glossary, pricing, length limits, export sections. `REPO_INPUTS` and `adaptersFor`.
- `checks.ts`: the deterministic layer (§3.1) and the D-10 `length` check (§3.4). Length counts graphemes after
  HTML → text.
- `llm.ts`: the LLM layer.
  - Prompts, eligibility and batching (§4.4).
  - Plan, caps and cost (§4.5).
  - Output validation: unknown id, schema, excerpt not found, keep-term only.
  - Sequential runner with one re-ask.
- `anthropic-client.ts`: the only file that imports the SDK. Structured outputs, retries 3, 60 s timeout, sanitized
  errors (the key is redacted).
- `report.ts`: `report.json` + `report.md` only, flags-only line first. Refuses any `--out` inside the repo
  (realpath).
- `qa-i18n.ts`: the CLI. Exit codes 0/1/2/3, key handling (§4.6), `--plan`, and the default sources
  `content-json, dictionary, export`.

**Config**
- `config/glossary.json`: approved by Mauricio on 2026-11-09.
  - Keep terms include WordPress, WooCommerce, Calendly, Brevo and Magneto MKTNG.
  - FR allow-list: Services, Contact, Solutions.
- `config/pricing.json`: Opus 5.5 and Haiku 5.5, with `source` and `date`.
- `config/length-limits.json`: `status: "placeholder"`, ratio 1.3, types `cta-label` 32, `hero-title` 70, `button` 24.
- `config/export-sections.json`: 14 sections, `reviewed: null`. **Mauricio reviews this map.**
  - `packages.card-{build,fix,care}`: `coveredBy: "content-json"`, so deterministic checks only (D-7).
  - `privacy.s1`–`privacy.s11`: LLM-eligible.
  - Not listed: structure/constraint blocks, VÉRIFICATIONS / VERIFICACIONES, Interne / Interno — NE PAS PUBLIER,
    case-study claims and verification gates, the modal variants (their copy is in the dictionaries).
  - Whole-line italic editor notes are stripped from listed sections.

**Eval**
- `evals/eval.ts`, `evals/defects.json` (6 deterministic + 8 LLM defects, 4 controls, D-8 thresholds 6 / 7 / 0 / 3).
- `evals/fixture/…`: labelled "MUTATED TEST DATA, NOT COPY".
- `evals/README.md`.

**Tests**
- `checks.test.ts` 28 · `inputs.test.ts` 9 · `llm.test.ts` 17 · `cli.test.ts` 14 · `evals/eval.test.ts` 6, for 74 in
  total.
- No test needs the network or a key. Every file deletes the variable in `beforeEach`.

**Docs**
- `README.md`: the tool README.

Modified:
- `package.json`:
  - scripts `qa:i18n` and `qa:i18n:eval`, both `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON …`;
  - devDependencies `@anthropic-ai/sdk` 1.6.0 and `zod` 4.6.7 (exact);
  - npm re-indented the `build` line (whitespace only).
- `package-lock.json`: the two packages (+93/−1).
- `tsconfig.json`: `allowImportingTsExtensions: true` (D-2 option A; no `tsx`).
- `.env.local.example`: a comment and `# MAGNETO_QA_ANTHROPIC_API_KEY=` (the value comes from the shell).

## Gate

| Check | Result | Notes |
|---|---|---|
| lint (`npm run lint`) | passed | 88 errors / 94 warnings, equal to the `master` ceiling measured at `abfbb65` (AC-1) |
| `npx eslint scripts/qa-i18n` | passed | 0 / 0 (AC-2) |
| any-grep `":\s*any\b\|as any\|<any>"` on `scripts/qa-i18n` | passed | no match (AC-2) |
| typecheck | passed | covers `scripts/qa-i18n/**` |
| tests (`env -u MAGNETO_QA_ANTHROPIC_API_KEY npm test -- --run`) | passed | 44 files / 651 tests. Before: 39 / 577 on `master`. +74 QA tests (AC-3) |
| build (`env -u … ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:build`) | passed | Exit 0, compiled. See note 1 |
| AC-11 isolation | passed | `grep -rnE "qa-i18n\|@anthropic-ai/sdk\|zod" src next.config.ts` → no match. Both packages in devDependencies only. No build warning mentions them |
| visual (routes · viewports · locales) | not run | No `src/` file changed; the tool renders nothing |

**Note 1, build.**
- `ALLOW_UNTRANSLATED_LOCALES=1` (local only) is needed because the ADR 0005 guard fails on the 58 FR / 57 ES
  dictionary TODO keys. The guard works as intended; Wednesday's fill resolves it.
- During this final run, Local WP was not running, so prerender logged `fetch failed … ECONNREFUSED` and used
  fallbacks.
- This is environment only: no `src/` file changed. The checkpoint build (Local WP up) was clean.

## Evidence

### Deterministic run (AC-4, AC-4b)
`env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --deterministic-only --out <scratchpad>` → **exit 1**.

```
qa-i18n: 327 units · 159 findings · mode deterministic-only
  by severity: {"info":41,"error":118}
  by check: {"kept-terms":6,"placeholder":115,"length":38}
  by language: fr 80 · es 76 · en 3
```

**placeholder: 115 errors.** FR 58 and ES 57, exactly `findTodoKeys(fr)` and `findTodoKeys(es)`. A test asserts the
equality on the live files (`cli.test.ts`, AC-4).

**kept-terms: 6.**
- 3 errors, real findings. Routed to Mauricio for Wednesday's dictionary fill; the dictionaries are not changed here:
  - FR `dict:meta.about.description`: "Magneto Web Consulting" in EN, not in FR;
  - ES `dict:meta.about.description`: same;
  - ES `dict:meta.contact.description`: same.
- 3 info.

**length: 38 info.**
- Every one is `info` and ends with "(placeholder limit)", in the reason and in the report.md check column (AC-4b,
  asserted by a test).
- Selectors used: `content-json:*.ctaText`, `content-json:*.ctaTextHero`, `content-json:*.secondaryCtaText`,
  `content-json:*.linkText`, `content-json:heroContent.heroTitle`, plus 10 dictionary keys:
  - `common.bookStrategyCall`, `header.scheduleCall`, `common.goHome`, `common.close`;
  - `contactForm.submit`, `bookingModal.continue`;
  - `emailModal.download`, `emailModal.continueDownload`, `emailModal.submitting`;
  - `cmsFallback.requestQuote`.
- **Unused selectors** (listed, not an error): `content-json:*.prefooterCtaText`, `content-json:*.aboutCtaText`.
  No current content value has those names; they stay for future content.

**Other checks.**
- identical-to-en: 0. The FR `projectDetail.solutions` warning from the checkpoint is gone after "Solutions" was
  added to the allow-list.
- The 14 export units add no deterministic finding.

### `--plan` (AC-7), with no key
```
$ env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --plan
Plan (no request sent): 42 batches (content-json 16, dictionary 4, export 22)
Estimated tokens: input 108085 (ceil(chars/3)×1.2), output ≤ 172032 (42 × 4096); re-asks not included
Caps: requests 60, input tokens 400000, output tokens/request 4096
est. before run: $0.10 · actual: n/a (no request sent) · model claude-haiku-5-5 · prices from https://platform.claude.com/docs/en/about-claude/pricing (2026-11-09)
exit 0
```
The same plan for Opus with `--max-output-tokens 16000` estimates **$13.87**. That is an upper bound, because every
request is assumed to use all 16000 output tokens (thinking included).

Eval plan for Opus at 16000:
```
6 batches (content-json 4, dictionary 2) · input 19059 · output ≤ 96000 · est. $2.00 per run
```
The eval plan for Haiku estimates $0.01 per run.

### Other acceptance checks
- **AC-5:** `git status --porcelain` is byte-identical before and after the deterministic run, both `--plan` runs and
  the eval `--plan`. `--out ./tmp-qa` → exit 2 ("--out must be outside the repository"), and nothing is created.
- **AC-6:** `env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --llm` → exit 2: "--llm needs
  MAGNETO_QA_ANTHROPIC_API_KEY in the environment. Run without --llm for the deterministic checks only." The client
  factory is never called. Tests cover the planted fake key (absent from stdout, stderr and both report files, also on
  a client error) and "key set, no `--llm`" (no client).
- **AC-8:** `report.json` is validated by the tool (`ReportSchema`, exit 3 on failure) and by a test. `report.md`
  starts with "Flags only. This tool changed no text. Mauricio decides every fix." Each finding row shows: file +
  location, layer + check, EN excerpt, target excerpt, reason.
- **Eval, deterministic half (no key):** PASS, 6/6, 0 control errors, 0 unplanted. A perfect fake LLM reviewer scores
  8/8 (`eval.test.ts`).

### AC-12: SDK, models, prices, D-3 (verified 2026-11-09)
- **SDK:** `@anthropic-ai/sdk` **1.6.0**, published 2026-11-05.
  - Retries and timeout come from the installed package's `README.md` and `client.d.ts`.
  - Default 2 retries, set to 3. Retried: 408 / 409 / 429 / 5xx and connection errors, exponential backoff
    0.5 s → max 8 s. Timeout set to 60 000 ms.
  - Errors expose `status`, `type`, `requestID`; responses carry `_request_id`.
- **Prices and model IDs:** https://platform.claude.com/docs/en/about-claude/pricing (accessed 2026-11-09).
  - `claude-opus-5-5`: $4 in / $20 out per MTok; cache write 5 m $5; cache read $0.20.
  - `claude-haiku-5-5`: $0.10 / $0.50 per MTok for prompts ≤ 100K tokens (over 100K: $0.50 / $2.50); cache write
    $0.125; cache read $0.01.
  - Recorded in `config/pricing.json`: `source` = the URL above, `date` = 2026-11-09.
- **D-3 mechanism: structured outputs** (`output_config: { format: { type: "json_schema", schema } }`).
  - Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs (accessed 2026-11-09).
  - Forced `tool_choice` (`any` / `tool`) is not available on `claude-opus-5-5` / `claude-sonnet-5-5`: the column is
    blank in the tool-choice table at https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview (accessed
    2026-11-09).
  - Mauricio approved the switch at the checkpoint.
  - Unsupported JSON Schema keywords are stripped from the wire schema; the full zod schema re-validates locally.
- **Opus 5.5 note (same docs):** thinking is always on and counts toward `max_tokens`. That is why the Opus eval uses
  `--max-output-tokens 16000` (approved, about $2 per run).
- **D-4 candidates:** `claude-opus-5-5` (top tier) and `claude-haiku-5-5` (cheaper).
  - The default is provisionally `claude-haiku-5-5`.
  - The final default is the cheapest model that meets D-8 on the worse of 2 runs (AC-9).

### AC-13: promise coverage (E6)

| Promise | Status | Where |
|---|---|---|
| Phase 1 note 1: non-zero exit on `[FR TEST]` / `[ES TEST]` in any language and field | Covered for the copy files | `placeholder` check (error → exit 1), all languages incl. EN, all three sources. Also matches `[FR\|ES TODO]`, `TODO`, `TBD`, lorem ipsum |
| Phase 1 note 1, CMS values (e.g. Trépied `[ES TEST]` titles, 5c E14) | Deferred | v2 read-only local GraphQL adapter (§2.4) |
| Phase 1 note 2: FR/ES equal to EN | Covered | `identical-to-en` (warning; allow-list and keep-term-only values exempt) |
| Phase 1 note 2: FR/ES equal to the EN ACF default | Deferred | v2 GraphQL adapter: ACF defaults are not in the copy files |
| Phase 3 / ADR 0004 D4: slug rule (FR/ES slug = EN slug) | Partly covered | `content-json` aligns posts by slug, so a FR/ES post under a different slug shows as `missing`. The rule in the CMS itself is deferred to the v2 GraphQL adapter |
| Phase 3: markers | Covered | `placeholder` |
| Phase 3: FR/ES ≠ EN | Covered | `identical-to-en` |

## Deviations from the spec
Deviations 1–5 were accepted by Mauricio at the checkpoint.

1. **D-3 uses structured outputs, not a forced tool call.** Forced `tool_choice` returns 400 on Opus 5.5 and Sonnet
   5.5 (AC-12). As a result, the client interface returns `output` instead of `toolInput`. The re-ask, validation and
   rejection rules are unchanged.
2. **Tests run in Vitest's default jsdom environment, not `node`.** `vitest.setup.ts` uses `window`, so the node
   pragma breaks the setup. Paths come from the `fileURLToPath(import.meta.url)` string, because jsdom replaces the
   global `URL`.
3. **npm scripts carry `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`.** Without it, Node prints a warning on every
   run (no `"type"` field in `package.json`; adding one is out of scope).
4. **The `currency` check is symmetric.** It flags `$` / `CAD` present in EN and absent in the target, and the
   reverse.
5. **Values that carry a placeholder are excluded from the LLM.** They already fail deterministically, and sending
   `[FR TODO] …` would pay for a known finding.

Other differences, recorded here (none changes behaviour that the spec fixes):

6. **Report extras, outside the spec's minimum.** `report.json` adds `options.failOn`, `batches[]` (per-batch status)
   and `lengthSelectors {used, unused}`. `ReportSchema` includes them.
7. **`dictionaryAdapter` takes an injectable `ModuleLoader`.** Vite can't import modules from the OS temp dir in tests.
   Production uses a plain dynamic `import()`.
8. **Prompt unit header.** The format is `unit <id> (<kind>)`. The `[<id>]` form clashed with ids that contain `[0]`.
9. **Provisional default model `claude-haiku-5-5`.** It is the cheaper candidate until AC-9 decides (D-4).
10. **Eval scoring ignores `length` findings.** They are placeholder `info` by design, not planted defects.
11. **The eval fixture has no export sections.** §6.2 mentions "two export sections", but none of the 14 planted
    defects is in an export section, and the eval runs `content-json` + `dictionary` only.
    - Effect: the LLM on export text (privacy §1–11) is not measured by AC-9. Its first exposure is AC-10.
    - Proposed follow-up: add two export sections, with a defect each, after AC-9 is stable.
12. **Fixture defects adapted to real units.** L1 is reworded on a real services row, and L4 (tax reversal) is on the
    packages intro. Both keep the defect class the spec names.
13. **`package.json` whitespace.** npm re-indented the `build` line when it added the dependencies.
14. **Role step "confirm `.env.local` targets the local CMS": not run.** Your hard rule for this phase was "never read
    `.env.local`". The tool doesn't read `.env.local` or contact the CMS.
15. **Export section ids.** They use `<page>.<slug>` (`privacy.s4`), as in the spec example `privacy.s4-providers`
    without the suffix.

## Issues found (not fixed)
- **Kept-terms errors, routed to Mauricio.** "Magneto Web Consulting" is missing in FR `meta.about.description`, ES
  `meta.about.description` and ES `meta.contact.description`. Fix in the Wed 11-11 dictionary fill.
- **58 FR / 57 ES dictionary TODO keys** (known; the 11-11 fill). They make the deterministic run exit 1 and need
  `ALLOW_UNTRANSLATED_LOCALES=1` for local builds.
- **`npm audit`** reports 14 vulnerabilities, all pre-existing; none is in `@anthropic-ai/sdk` or `zod`. No new peer
  warnings.
- **Opus first-run cost.** A full run at `--max-output-tokens 16000` is estimated at up to $13.87, against $0.10 for
  Haiku, mostly from output (42 requests). If Opus wins AC-9, consider:
  - running the first real run with `--sources content-json,dictionary` (20 batches, about $6.60 upper bound);
  - or relying on the cap; the request cap is 60.
- **Length limits are placeholders** until the Fri 11-13 design round. Applying them is a config edit
  (`status: "set"`, values, `set.by`/`on`) plus a re-run. After that, FR/ES length findings become warnings.
- **`config/export-sections.json` is unreviewed** (`reviewed: null`). Mauricio confirms which sections are comparable
  before the first `--llm` run sends privacy text.

## Pending (Mauricio, Wed 11-11)
- **AC-9.** Eval on both candidates after the dictionary fill. Paste `eval.md` and the cost lines here. The default
  model becomes the cheapest that passes D-8 on the worse run.
- **AC-10.** First real run with the winner; triage the `error` findings (real / false positive / accepted).
- **AC-5, full-run part.** `git status --porcelain` before and after the real run.

## Proposed commits
Nothing is staged.
- `chore(deps): add @anthropic-ai/sdk 1.6.0 and zod 4.6.7 as devDependencies for qa-i18n` (`package.json`
  devDependencies, `package-lock.json`)
- `chore(tsconfig): allow .ts import extensions for node-run scripts` (`tsconfig.json`)
- `feat(qa-i18n): deterministic + opt-in LLM copy QA for EN/FR-CA/ES` (`scripts/qa-i18n/` without `evals/`,
  `package.json` scripts, `.env.local.example`)
- `test(qa-i18n): seeded-defect eval fixture and scorer` (`scripts/qa-i18n/evals/`)
- `docs(report): phase 5g i18n LLM QA` (this file)

`package.json` carries both the devDependencies and the scripts. If one commit per concern matters more than hunk
staging, fold the scripts into the deps commit.

## Time
Agent time: about one working day across 11-09 (estimated; not measured). Active human time: checkpoint review and
decisions (unknown). Waiting: AC-9 / AC-10 on 11-11.
