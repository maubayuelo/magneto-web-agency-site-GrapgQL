# Phase 5g — Multilingual QA script (deterministic checks + LLM with structured output)

- **Status: Approved** (rev 0.3, Mauricio, 2026-11-09)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect) · **LLM runs: Mauricio** (agents never hold the API key)
- Date: 2026-11-09 · Branch: `spec/phase-5g-i18n-llm-qa` (from `master` @ `1609a63`). Implementation branch: the Dev creates one.
- Depends on: [5c spec](phase-5c-loader.md) rev 3.1 and [5c report](../reports/phase-5c-loader.md) (content files, pins,
  `content.test.ts`), [ADR 0005](../adr/0005-ui-dictionaries.md) (dictionaries, TODO markers), [ADR 0004](../adr/0004-localized-data.md) D4,
  Phase 1 spec "Notes for later phases" and Phase 3 spec "Notes for later phases" (the checks promised to this script).
- Source decision: Mauricio, 2026-10-23 (Notion). It's an internal development tool. It **flags only**: it never
  retranslates or edits approved text, and Mauricio decides every fix. It processes no user data, so the privacy policy
  is unaffected. It never runs in the production build or at runtime. Estimate in Notion: 4–8 h, uncertain.
- Naming: `docs/ai/WORKFLOW.md:44` calls this "Phase 6 — Multilingual QA script". This spec is that phase, scheduled
  as 5g. Mauricio updates the table when the phase closes (not the Dev).

## Revision
**Rev 0.3 (2026-11-09, Mauricio's decisions):** D-1, D-3, D-4, D-6 and D-8 were approved as recommended. D-2 was
approved with a `tsx` fallback. D-5 is done. D-7 was approved with the cut line. D-9 rules are final. ADR 0009 is
written, OQ-1 and OQ-2 are closed, and the draft `glossary.json` is in §3.3. Three design changes follow from the
decisions:
1. **LLM mode is opt-in (`--llm`).** The key is now exported from `~/.bash_profile`, so any login shell, including an
   agent's, may hold it (§4.6). Without `--llm`, the tool never calls the API.
2. **`kept-terms` is a presence check.** A term in EN that is missing from the target is an `error`. A different count
   is `info`, because FR/ES may repeat or drop "Magneto" naturally.
3. **The eval's LLM glossary defect is replaced.** Glossary v1 has no "Packages → Forfaits" rule, so that defect
   becomes a second meaning drift (a tax condition reversed). The counts stay 6 + 8, and D-8 is unchanged.
4. **D-10 (new, Mauricio):** a deterministic `length` check, configured in `config/length-limits.json`. All its values
   are placeholders until the Fri 11-13 design round (§3.4). In the build order it comes before the `export` input
   (Schedule).

**Rev 0.2 (2026-11-09, Mauricio):** new schedule. Review today (Mon 11-09); approval + build on Tue 11-10; on Wed 11-11
the UI dictionary fill comes first, then the eval and the first real run. Thu 11-12 (privacy route) and Fri 11-13
(design round) are taken. Dates may move earlier as steps close. Changes: the "Proposed slot" (now "Schedule") under
Estimate, R-10, AC-9, AC-10, and a cut-line trigger for Tue 11-10. The design is unchanged.

**Rev 0.1 (2026-11-09):** first draft.

## Goal
Mauricio runs `npm run qa:i18n` locally and gets two outputs: a schema-validated JSON report and a readable Markdown
summary of every EN ↔ FR-CA / ES problem in the repo's copy files. A deterministic layer (no LLM, no key) catches
structural problems. An LLM layer catches semantic ones, and every LLM finding quotes its evidence. The script modifies
no file in the repo, and a seeded-defect eval shows how well it finds planted errors.

## Evidence (read-only, 2026-11-09, `master` @ `1609a63`)

**E1. Content files** (`scripts/phase-5c/content/{en,fr,es}.json`). Each has keys `source, spec, format, posts`. Each
post is `{type, slug, lang, fields[]}`, and each field is `{key, label, src, value, subfields?}`. A `value` is a
string, a list of rows (repeater, rows keyed by ACF sub-field key) or a group object.
```
en: 9 posts (services, packages, home, about-magneto, projects, contact, about-magneto [2nd entry], fashion-company-ecommerce, shamaniccas-ecommerce)
fr: 8 posts (same set, one about-magneto entry) · es: 8 posts
source pins: en d3516151…ecd0 · fr f52cf70e…435af · es 83332a1b…e857 (commit 637fba7)
shasum -a 256 docs/content/*.md → identical to the three pins (checked today)
sizes: en.json 33.8 KB · fr.json 46.6 KB · es.json 46.4 KB
```
Values are aligned across languages by post slug + field key + row index + sub-key. `content.test.ts:63-90` already
walks them this way (`copyValues`), and `STRUCTURAL = /_(cta_path|anchor_id|service_group)$/` (`:59`) marks the
non-copy keys. The test also pins the main CTA labels (`MAIN_CTA`, `:22-26`).

**E2. UI dictionaries** (`src/i18n/dictionaries/{en,fr,es}.ts`). Each file is a nested object of strings, and
`dictionary.ts:24` `flattenDictionary` turns it into `a.b.c` keys. `fr.ts` / `es.ts` contain only `import type
{ Dictionary } from '../dictionary'` (`:3`), which type stripping erases. `en.ts` has no import.
```
grep -c "TODO" fr.ts es.ts → 59 / 58 lines (incl. 1 header comment line each) = 58 / 57 TODO keys
  (matches the 5c report gate note "FR 58 / ES 57 TODO keys" from the ADR 0005 build guard)
findTodoKeys (dictionary.ts:35-39) matches the substring 'TODO]'
placeholders: en.ts header ":4" lists {year} {n} {title} {status} {name} {domain}; 7 lines in en.ts contain {x}
```
The FR/ES dictionary fill is scheduled for **Wed 11-11** (5c spec calendar, 5c report "AC-8 findings (routed)").

**E3. Copy exports** (`docs/content/magneto-copy-{en,fr-CA,es}.md`, export `637fba7`). Their heading structures do
**not** align by position:
```
en:    H1=3  H2=17 H3=100 H4=61  1355 lines  (pages as "## <Page> — Consensus EN Source Copy v2", plus "… structure / constraints" sections)
fr-CA: H1=10 H2=51 H3=91  H4=17  1176 lines  (pages as "# ACCUEIL", "# À PROPOS", …)
es:    H1=9  H2=51 H3=90  H4=17  1162 lines  (pages as "# HOME", "# SOBRE MAGNETO — ABOUT ES", …)
page order differs: EN Privacy (784) comes before the cases (982); FR cases (520) before Contact (737)
```
The exports also contain internal, non-published blocks. Examples: EN "Home structure / visual constraints" (188),
FR "# VÉRIFICATIONS AVANT PUBLICATION" (1136), FR "Interne — blocs de politique prêts (NE PAS PUBLIER…)" (1065), and
italic editor notes like EN 109 "*Publish only when the guide is complete…*". The exports contain no `[FR|ES]
TEST|TODO` markers (grep count 0).

**E4. Register, measured on the exports** (rough word counts, not a rule):
```
FR: vous/votre/vos 227 · tu/ton/tes/ta/toi 0
ES: tú/tu/tus/ti 115 · usted/ustedes 0   (su/sus not counted: ambiguous)
```
I found no glossary or tone/register guide in the repo
(`grep -rniE "glossa|vouvoiement|tutoiement|tuteo|copy guide|style guide"` → no match). The "copy guide" with the
tu/vous rules is therefore in Notion only (see OQ-1).

**E5. Labels that must stay consistent** (verified in files):
- Main CTA (`common.bookStrategyCall`): EN "Book a Free Strategy Call" · FR "Réserver un appel-conseil gratuit" ·
  ES "Agendar una llamada de orientación gratuita" (`en.ts:8`, `fr.ts:7`, `es.ts:7`, = `content.test.ts` `MAIN_CTA`).
- Header CTA (`header.scheduleCall`): EN "Book a Strategy Call" · FR "Réserver un appel-conseil" · ES "Reservar
  consulta" (`:24` / `:23` / `:23`).
- Nav: FR "À propos / Services / Forfaits / Réalisations / Contact" (`fr.ts:15-19`); ES as in 5c E11.
- Prices are formatted per locale. EN `$3,500`, `$5,000`, `$10,000`. FR `3 500 $ CA`, `5 000 à 8 000 $ CA`
  (`fr.json` services row 0 `description_html`). So a number check must normalize grouping separators and currency
  position.
- `BUILD, FIX et CARE` stay in English inside FR copy (`fr.json:43`, `:78`, `:81`).

**E6. Promised checks for this script** (earlier decisions this spec must honour or explicitly defer):
- Phase 1 spec, "Notes for later phases" (`phase-1-wpml-setup.md:413-419`):
  1. fail (non-zero exit) on any `[FR TEST]` / `[ES TEST]` in any language and any field;
  2. flag FR/ES values equal to the EN value or to the EN ACF default.
- Phase 3 spec (`phase-3-localized-data.md:439-440`) and ADR 0004 D4 (`:38-42`): the slug rule (FR/ES slug = EN slug),
  the markers, and FR/ES ≠ EN.
- Today `[ES TEST]` exists only in **CMS** values (Trépied titles, 5c E14) and in `src` test fixtures
  (`projects/api.test.ts:39,59`, `projects/[slug]/api.test.ts:15`). It is in no copy file.

**E7. Toolchain facts.**
- Node `v24.15.0` (`.nvmrc` = `24.15.0`): it runs `.ts` files natively through type stripping (erasable syntax only).
- `package.json` has no `"type"` field and no `tsx` / `ts-node`.
- `tsconfig.json`: `noEmit: true`, `include: ["**/*.ts", …]`, and test files excluded. So `scripts/**/*.ts` is
  type-checked by `npm run typecheck`, and relative imports with a `.ts` extension would fail (TS5097) without
  `allowImportingTsExtensions`.
- Vitest (`vitest.config.ts`) runs `scripts/**/*.test.ts` (that's how `content.test.ts` runs). The default environment
  is jsdom; a file can opt into `// @vitest-environment node`.
- `next lint` doesn't cover `scripts/` (5c report gate note). `npx eslint scripts/phase-5c/content.test.ts` → exit 0
  today.
- CI (`.github/workflows/ci.yml`) runs lint (informational), `next typegen`, typecheck and `npm test -- --run`, with no
  secrets and no build. So every unit test of this phase runs in CI and **must not need the network or a key**.
- Not installed: `@anthropic-ai/sdk`, `zod` (`ls node_modules/@anthropic-ai` → missing). `ajv@6` exists only as a
  transitive dependency of eslint; don't use it.
- Prior art for a tested script: `scripts/agent-gate.mjs` + `agent-gate.node-test.mjs` (dependency injection of
  `spawnSync`, so tests never launch processes). This spec uses the same pattern for the LLM client.

**E8. Not verified by the Architect (role restriction: no network except the local GraphQL endpoint):** the current
Anthropic TypeScript SDK API, model IDs, structured-output / tool-use parameters and prices. The Dev verifies all of
them against `docs.claude.com` (and the SDK's README for the installed version) **before writing the client**, and
records the URLs, the date and the SDK version in the report (AC-12). Nothing in this spec should be read as a model
name or SDK signature from memory.

## Assumptions and open questions
- **A1:** Node 24.15 runs the script as `node scripts/qa-i18n/qa-i18n.ts` without flags, if the code uses only erasable
  TS syntax (no `enum`, no parameter properties, no `namespace`) and imports with explicit `.ts` extensions. The Dev
  checks it first. D-2 covers the type-check side and the `tsx` fallback.
- **A2:** importing `src/i18n/dictionaries/{en,fr,es}.ts` from the script works under Node because the only import
  in them is `import type`. If not, the dictionary adapter reads them through Vitest's loader only in tests and falls
  back to a small TS-free parse at runtime. Report which one was used.
- **A3:** Claude Code (and other tools) use `ANTHROPIC_API_KEY` from the shell environment when it is set. A
  dedicated variable name therefore avoids accidental billing or a session switching accounts (D-5). Mauricio can
  confirm.
- **A4:** the copy in the input files is approved, published (or soon to be published) business text plus internal
  editor notes. It contains no personal data of users. The internal blocks are excluded from the LLM by the section map
  (§2.3).
- **OQ-1 — closed (rev 0.3, D-9):** Mauricio's rules are final: FR-CA = *vous*, ES = *tú*. They match the E4
  measurement.
- **OQ-2 — closed (rev 0.3):** EN is checked for markers (Phase 1 decision: "any language") and for empty values (the
  reverse `empty` case, a warning). Meaning checks stay EN → target only.

## Design

### 1. Shape: one CLI, a few modules, no framework
```
scripts/qa-i18n/
  qa-i18n.ts            CLI entry: args → plan → deterministic → (LLM) → report → exit code
  inputs.ts             input adapters → aligned Units
  checks.ts             deterministic checks (pure functions)
  llm.ts                batching, prompt, caps, retries, response validation; depends on the LlmClient interface only
  anthropic-client.ts   the ONLY file that imports @anthropic-ai/sdk; loaded with dynamic import() in LLM mode
  schema.ts             zod schemas: Unit, Finding, LLM tool input, Report (one source; JSON Schema derived from it)
  report.ts             JSON + Markdown writers, out-path guard
  config/glossary.json  keep-as-is terms, required renderings, register rules (approved by Mauricio, D-9)
  config/export-sections.json   EN/FR/ES heading anchors per comparable export section (§2.3)
  config/pricing.json   per-model prices with source URL and date (Dev fills from docs, AC-12)
  config/length-limits.json  per-field-type max characters + FR/ES-vs-EN ratio (D-10; placeholders until 11-13)
  evals/                seeded-defect fixture, defects.json, eval.ts (§6)
  *.test.ts             unit tests (§5)
  README.md             usage, flags, exit codes, the "flags only" rule (short)
```
The Dev may merge modules but must not add new ones beyond this list. Erasable TS only (A1), strict types, no `any`.

### 2. Inputs (v1 = files, not rendered pages)
Every adapter returns `Unit[]`:
```ts
type Lang = 'en' | 'fr' | 'es';
type UnitKind = 'text' | 'html' | 'label' | 'structural';   // structural = path / anchor / group, equality only
interface Unit {
  id: string;                    // stable: "<source>:<locator>", e.g. "content:services/servicesServiceDetails.services[0].ctaText"
  source: 'content-json' | 'dictionary' | 'export';
  location: { file: Record<Lang, string>; post?: string; field?: string; row?: number; subKey?: string; dictKey?: string; section?: string; lines?: Record<Lang, [number, number]> };
  kind: UnitKind;
  llm: boolean;                  // false → deterministic checks only
  values: Partial<Record<Lang, string>>;   // a missing language = missing value (a finding, not a crash)
}
```
**2.1 `content-json`:** reads the three files from E1 and aligns them by `slug` + field `key` (EN's two
`about-magneto` entries are merged by slug, as the loader does), then by row index + sub-key and group sub-key.
- `kind`: `structural` for keys matching `content.test.ts` `STRUCTURAL` plus `field_p5_herocontent_hero_cta_path`;
  `html` when the value contains a tag; `label` for CTA keys (`cta_text`, `ctaTextHero`, `prefooter_cta_text`,
  `secondary_cta_text`, `link_text`, `about_cta_text`); `text` otherwise.
- Adding 5c-rest posts (Trépied, Home body, EN final CTAs) to these files needs **no code change**.

**2.2 `dictionary`:** imports the three dictionary modules (A2) and flattens them with the tool's own flatten. It
doesn't import `dictionary.ts`, whose `./format` import has no extension. Unit per key; `kind: 'label'`.

**2.3 `export`:** uses `config/export-sections.json`. Each entry is a comparable section:
```json
{ "id": "privacy.s4-providers", "anchors": { "en": "### 4. …", "fr": "### 4. Fournisseurs de services …", "es": "### 4. …" },
  "coveredBy": null }
```
- An anchor is the exact heading text, with its level. A section runs to the next heading of the same or a higher
  level, which survives re-exports better than line numbers. An anchor that isn't found, or is found twice, is a
  **config error** (exit 2), never a silent skip.
- Only the listed sections are read. Internal blocks (E3: structure/constraint sections, "VÉRIFICATIONS…", "Interne —
  … NE PAS PUBLIER", italic editor-note paragraphs) are left out of the map, so they never reach the LLM.
- `coveredBy: "content-json"` marks sections whose text is already loaded into the content files (and verbatim-checked
  by `content.test.ts`). Those get deterministic checks only (`llm: false`), so the same copy isn't paid for twice
  (D-7).
- The Dev builds the map from the three exports; Mauricio reviews it (it encodes "which sections are comparable").

**2.4 Extensibility:** an adapter is `{ id: string; load(): Promise<Unit[]> }`. A later read-only local GraphQL adapter
(CMS values, the D4 slug rule in the CMS, ACF defaults; E6) fits here without touching the checks. It is out of scope
for v1.

### 3. Checks
**Finding** (zod, `.strict()`; the same shape for both layers):
```ts
interface Finding {
  id: string;                    // sha256(layer|check|unitId|lang|excerpt) first 12 hex: stable across runs for diffing
  layer: 'deterministic' | 'llm';
  check: DeterministicCheck | LlmCheck;
  severity: 'error' | 'warning' | 'info';
  lang: Lang;                    // the language that has the problem ('en' only for OQ-2 checks)
  unitId: string;
  location: Unit['location'];
  evidence: { en: string; target: string; reason: string };   // excerpts ≤ 300 chars each; reason ≤ 400 chars, in English
}
```
**There is no field for a replacement text.** The LLM schema rejects extra properties, so a "suggested translation"
can't be returned in a structured field (§4.3).

**3.1 Deterministic layer** (`checks.ts`; pure functions `(unit) => Finding[]`; runs in every mode, needs no key):

| Check | Rule | Severity |
|---|---|---|
| `missing` | EN has the unit, the target doesn't (key/row/sub-key/section absent) | error |
| `empty` | EN non-empty, target empty or whitespace (and the reverse: warning) | error |
| `placeholder` | `/\[(FR|ES) (TEST|TODO)\]/`, `/\bTODO\b/`, `TBD`, `lorem ipsum` in **any** language (E6 note 1, OQ-2) | error |
| `identical-to-en` | target === EN after whitespace normalization, and not allow-listed (`glossary.keep`, or `identicalAllowed` keys such as FR `nav.services` "Services") | warning |
| `numbers` | multiset of numbers per unit differs. Normalizer: digits with grouping by `,` / `.` / space / U+00A0 / U+202F → integer; decimals kept; `%` kept as a unit. Years count as numbers | error |
| `currency` | EN has `$` / `CAD` / `CA$` and the target has no `$`, or the reverse | error |
| `structural-equality` | `kind: structural` (cta_path, anchor_id, hero_cta_path, service_group) target ≠ EN | error |
| `urls` | multiset of `href` values (HTML) / Markdown link URLs (exports) differs. Exceptions only via `glossary.urlExceptions` | error |
| `interpolation` | set of `{name}` placeholders differs (dictionaries) | error |
| `kept-terms` | each `glossary.keep` term found in EN is present in the target (§3.3); a different count is `info` | error |
| `main-cta` | a `label` unit whose EN value equals EN `common.bookStrategyCall` must equal the target's `common.bookStrategyCall` (read from the dictionaries, not hard-coded); same for `header.scheduleCall` | error |
| `label-consistency` | the same EN `label` value rendered in two or more different ways in one target language, across all sources | warning |
| `list-items` | `<li>` count (HTML) or `- ` item count (exports) differs: likely omission | warning |
| `source-pin` | a content file's `source.sha256` ≠ the current export's sha256 (the content may be stale) | warning |
| `length` | D-10, §3.4: a typed unit over its type's `maxChars`, or an FR/ES value longer than EN × `ratioWarnAbove` | warning (`info` while the limits are placeholders) |

Allow-lists live in `config/glossary.json`, never in code, so Mauricio reviews them in one place.

**3.2 LLM layer** (semantic only; `llm.ts`). It sees only units with `llm: true` and `kind` ≠ `structural`, and only
target languages that passed `missing` / `empty` for that unit. Checks:

| Check | What the model is asked to flag |
|---|---|
| `meaning-drift` | the target says something different from EN (fact, offer, scope, who does what, conditions) |
| `omission` / `addition` | a claim, condition, list item or sentence missing from, or added to, the target |
| `glossary` | a `glossary.required` rendering not used (e.g. EN "Packages" → FR "Forfaits", not "Paquets"), or a `keep` term translated |
| `register` | the register rule of the language is broken (D-9; e.g. *tu* in FR, *usted* in ES), or it is mixed inside one page |
| `untranslated` | an EN fragment left inside target text (beyond allowed `keep` terms) |

Each finding needs `severity`, an EN excerpt, a target excerpt and a reason. The model assigns severity under fixed
rules in the prompt: `error` = the reader would get a wrong fact, price condition or commitment; `warning` = the
meaning is weakened, the glossary or register is broken, or a fragment is left untranslated; `info` = a stylistic
observation.

**3.3 `config/glossary.json` — draft v1 (D-9; Mauricio approves this content before the eval).**
```json
{
  "version": 1,
  "source": "Mauricio, D-9, 2026-11-09 (phase-5g spec rev 0.3)",
  "approved": { "by": null, "on": null },
  "register": {
    "fr": { "rule": "vous", "description": "Address the reader as vous (vous / votre / vos). Never tu / toi / ton / ta / tes." },
    "es": { "rule": "tú", "description": "Address the reader as tú (tú / tu / tus / te / ti). Never usted / ustedes, and never su / sus as a form of address." }
  },
  "keep": [
    { "term": "BUILD", "match": "word-exact-case" },
    { "term": "FIX", "match": "word-exact-case" },
    { "term": "CARE", "match": "word-exact-case" },
    { "term": "Magneto Web Consulting", "match": "exact" },
    { "term": "Magneto", "match": "word-exact-case" },
    { "term": "Mauricio Bayuelo", "match": "exact" },
    { "term": "Dangel Wellness", "match": "exact" },
    { "term": "Shamanicca", "match": "word-exact-case" },
    { "term": "Trépied", "match": "word-case-insensitive" }
  ],
  "ctaLabels": [
    { "dictKey": "common.bookStrategyCall", "note": "main CTA; value per locale read from the dictionaries at runtime" },
    { "dictKey": "header.scheduleCall", "note": "header CTA; ES 'Reservar consulta' differs from the main CTA on purpose" }
  ],
  "required": [],
  "identicalAllowed": { "fr": ["Services", "Contact"], "es": [] },
  "urlExceptions": []
}
```
How the checks use it:
- **`keep` (`kept-terms`):** a term found in the EN unit must be in the target unit, otherwise `error`. A different
  count is `info`. The longest term matches first, so "Magneto Web Consulting" isn't also counted as "Magneto".
  - `word-exact-case`: lowercase "fix" / "care" in EN prose is not the service name.
  - `word-case-insensitive`: matches the `TRÉPIED` headings.
- **`ctaLabels` (`main-cta`, `label-consistency`):** label values are never copied into this file. The tool reads
  them from `src/i18n/dictionaries/*.ts` at run time. ES uses two labels on purpose (E5), and they are not reported as
  an inconsistency, because their EN sources differ too.
- **`register`:** goes into the LLM prompt (`register` check). There is no deterministic register check in v1.
- **`required`:** empty in v1 (no term renderings beyond the CTA labels). The LLM `glossary` check then covers only
  translated `keep` terms and CTA labels.
- **`identicalAllowed`:** not a glossary rule. FR "Services" and "Contact" are approved dictionary values that are
  identical to EN (`fr.ts:16`, `:19`). Listing them stops `identical-to-en` warnings on them.
- **Not in v1** (Mauricio may add them when approving): Magneto MKTNG (the registered name, EN 798), Isra, WordPress,
  Calendly, Brevo.

**3.4 `length` check and `config/length-limits.json` (D-10).** A deterministic check, `content-json` and `dictionary`
units only; export text has no field type.
```json
{
  "version": 1,
  "status": "placeholder",
  "statusNote": "Placeholder values. The Fri 11-13 design round sets them; then status becomes \"set\" with by/on.",
  "set": { "by": null, "on": null },
  "ratioWarnAbove": 1.3,
  "types": {
    "cta-label":  { "maxChars": 32, "select": { "content-json": ["*.ctaText", "*.ctaTextHero", "*.prefooterCtaText", "*.secondaryCtaText", "*.linkText", "*.aboutCtaText"] } },
    "hero-title": { "maxChars": 70, "select": { "content-json": ["heroContent.heroTitle"] } },
    "button":     { "maxChars": 24, "select": { "dictionary": ["common.bookStrategyCall", "header.scheduleCall"] } }
  }
}
```
- **Selectors** match a unit's field label (the GraphQL path in the content files, e.g. `heroContent.heroTitle`; `*`
  = any prefix) or its dictionary key.
  - The Dev completes the `button` list with the dictionary keys rendered as buttons (form submit, dialog close, …).
    The report lists the final selector set.
  - A unit matched by two types takes the stricter `maxChars`.
- **Length** = grapheme count of the visible text (`Intl.Segmenter`, built into Node; HTML stripped, whitespace
  collapsed). So "é" counts as 1 whether composed or decomposed.
- **Rules**, per typed unit:
  - any language whose length is above `maxChars` → finding. For EN it is always `info`: EN is approved, so a long EN
    label is a design question, not a copy defect;
  - FR/ES length above EN length × `ratioWarnAbove` → finding.
- **Severity:**
  - while `status` is `"placeholder"`, every `length` finding is `info`, and the Markdown marks it "(placeholder
    limit)";
  - after the design round sets `status: "set"`, FR/ES findings are `warning`. EN stays `info`.
  - A `length` finding never changes the exit code under the default `--fail-on error`.
- **Values:** the numbers above are placeholders chosen by the Architect for the first run, not design decisions. The
  values from the design round are a config edit only, with no code change.
- **Tests (§6.1):**
  - a limit hit and a limit not hit, for each type;
  - the ratio exactly at the threshold (no finding) and just above it (finding);
  - EN over the limit → `info`;
  - `placeholder` → `info`, `set` → `warning`;
  - composed vs decomposed "é";
  - an HTML value measured as text;
  - a selector that matches nothing → listed in the report as unused (not an error).
- **Eval:** not part of the seeded set, so the D-8 counts stay 6 + 8.

### 4. LLM integration
**4.1 Client.** The official Anthropic TypeScript SDK (`@anthropic-ai/sdk`, D-1), behind a two-method interface, so
`llm.ts` and the tests never touch the SDK:
```ts
interface LlmClient {
  review(req: { model: string; system: string; user: string; toolSchema: JsonSchema; maxOutputTokens: number }):
    Promise<{ toolInput: unknown; usage: Usage; stopReason: string; requestId?: string }>;
}
```
`anthropic-client.ts` implements it and is loaded with `await import()` only in LLM mode (`--llm`). Runs without
`--llm`, and `--plan`, therefore never load the SDK (tested).

**4.2 Model.** The model comes from `--model <id>`, then `QA_I18N_MODEL`, then the default chosen in D-4. The ID is
printed in the report. An ID that is not in `config/pricing.json` still runs, with the cost line "unknown (no price
for <id>)". The tool never guesses a price.

**4.3 Structured output.** D-3 decides the mechanism (recommended: forced tool use). The tool `report_findings` has
this `input_schema`, derived from the zod schema in `schema.ts` (one source of truth):
```
{ findings: [ { unitId: string (enum of the batch's unit ids), check: enum(LlmCheck), severity: enum,
                enExcerpt: string ≤300, targetExcerpt: string ≤300, reason: string ≤400 } ],
  additionalProperties: false at every level }
```
The response is **always** re-validated with zod locally, whatever the API guarantees. After validation:
- **Evidence check:** `enExcerpt` must be a substring of the unit's EN text and `targetExcerpt` of its target text,
  after whitespace/quote normalization and with HTML reduced to text. If not, the finding goes to
  `rejectedLlmFindings` with the reason `excerpt-not-found`. This is the main defence against invented findings.
- An unknown `unitId`, or a `keep`-term-only "untranslated" finding, is rejected the same way.
- An LLM finding that duplicates a deterministic one (same unit, lang and an equivalent check) is dropped as a
  duplicate, and the drop is counted.

**Prompt rules** (system prompt, versioned in `llm.ts` as `PROMPT_VERSION`, printed in the report):
- You are a QA reviewer. EN is the source of meaning.
- Report problems only. Never propose, write or quote a new translation. Excerpts are copied verbatim from the input.
- An empty `findings` array is a valid answer.
- The glossary, the register rule of the target language and the severity rules follow, then the batch.

**4.4 Batching.**
- `content-json`: one request per (post, target language): 8 posts × 2 = 16 today.
- `dictionary`: one request per (top-level namespace group of ≤ 60 keys, language).
- `export`: one request per (section, language), for sections with `llm: true`.
- A unit in a request carries EN + the one target language. When it helps register checks, the request also carries a
  short page context (the post's other values, read-only).

**4.5 Caps and cost.**
- **Plan first:** before any request, the tool builds the full batch list and estimates input tokens
  (`ceil(chars / 3) × 1.2`, which is conservative) and output tokens (`maxOutputTokens` per request).
- `--plan` prints the plan, the totals and the cost estimate, then exits 0. It sends no request and needs no key.
- **Hard caps**, flags with defaults: `--max-requests 60`, `--max-input-tokens 400000`, `--max-output-tokens 4096`
  (per request). These absolute ceilings can't be raised by a flag: requests 150, input tokens 1,000,000. If the plan
  exceeds a cap, the tool exits 2 before the first request. During the run it counts the API's reported `usage`; when
  the next request would cross a cap, it stops, marks the remaining batches `skipped-cap`, writes the report with
  `incomplete: true` and exits 3.
- **Cost line** in both outputs: `est. before run: $X.XX · actual: $Y.YY (input N, output M[, cache …]) · model <id> ·
  prices from <url> (<date>)`.
- **Requests:** sequential (no concurrency) in v1.
- **Retries:** the SDK's own retry for 429 / 5xx / connection errors, with `maxRetries` set explicitly (3) and a
  per-request timeout (60 s). The Dev checks the SDK's backoff behaviour in its docs. Plus **one** application-level
  re-ask when the tool input fails zod validation or the model didn't call the tool. A second failure marks the batch
  `failed` (the report lists it) and the run continues. Any failed batch → `incomplete: true`, exit 3. No unbounded
  loop anywhere.
- Prompt caching of the shared system prompt and glossary is allowed if the docs support it for the chosen model. It
  is an optimization, not a requirement.

**4.6 The API key.**
- It is read **only** from `process.env.MAGNETO_QA_ANTHROPIC_API_KEY` at runtime (D-5), and passed explicitly to the
  SDK constructor.
- **LLM mode is opt-in** (rev 0.3). The default run is deterministic only. Only `--llm` reads the key and calls the
  API, and `--llm` together with `--deterministic-only` is exit 2. This matters because Mauricio exports the key from
  `~/.bash_profile` (D-5), so any login shell can hold it.
  - On 2026-11-09 the Architect's shell did **not** have it set. Only the presence was tested, not the value.
  - The variable's presence alone must never cause spend.
- The script loads **no** `.env*` file. It uses no `--env-file` and no dotenv.
- **Fail closed:** with `--llm`, if the variable is missing or empty, the tool exits 2 *before* building any client.
  The message says: "`--llm` needs MAGNETO_QA_ANTHROPIC_API_KEY in the environment. Run without `--llm` for the
  deterministic checks only." The message never includes any value.
- The key is never printed, logged, written to the report or included in error messages. SDK errors are reduced to
  `status`, `type`, `request_id` and the message before printing. A test plants a fake key and asserts it appears in
  no output (§5).
- **Agents never pass `--llm`**, never read, print or test the key's value, and never read `.env.local` (AGENTS rule).
  Every agent command that runs the tool or the tests is prefixed with `env -u MAGNETO_QA_ANTHROPIC_API_KEY`. The QA
  test files also `delete` the variable in `beforeEach`, so `npm test` is key-free even in Mauricio's shell. Mauricio
  runs the eval and the real runs, then passes the report paths to the Dev.

### 5. Output and exit codes
**5.1 Location.** Default `--out` is `~/Documents/projects/magneto/qa/i18n/<YYYYMMDD-HHMMSS>/`, a sibling of the
existing `qa/phase-5c-ac8/` (D-6). The tool writes `report.json` and `report.md` there and nothing else.
`report.ts` resolves the real path and **refuses (exit 2) any `--out` inside the repo root**. The script opens no repo
file for writing. AC-5 proves it with `git status`.

**5.2 `report.json`** (zod `ReportSchema`, `schemaVersion: 1`). The tool validates its own report before writing it;
an invalid report → exit 3. Content:
```
{ schemaVersion, tool: { name, version, promptVersion }, runId, startedAt, finishedAt, gitCommit, mode: 'full'|'deterministic-only',
  inputs: [{ file, sha256 }], options: { model?, caps, langs, sources },
  summary: { bySeverity, byLayer, byLang, byCheck, units, batches: { ok, failed, skippedCap } },
  findings: Finding[], rejectedLlmFindings: [{ raw, reason }], duplicatesDropped: number,
  usage: { inputTokens, outputTokens, cache?: {...}, requests }, cost: { estimatedUsd, actualUsd, priceSource } | { unknown: string },
  incomplete: boolean }
```
**5.3 `report.md`.**
- First line: **"Flags only. This tool changed no text. Mauricio decides every fix."**
- Then: the run line (commit, model, mode, cost line) and the summary table.
- Then the findings grouped by language → source → severity. Columns: location (file + post/field/key or section +
  line range), check, EN excerpt, target excerpt, reason. The layer is marked `[det]` / `[llm]`.
- Last: the failed, skipped and rejected counts.

**5.4 Exit codes** (precedence 2 > 3 > 1 > 0):

| Code | Meaning |
|---|---|
| 0 | completed, no finding at or above `--fail-on` (default `error`) |
| 1 | completed, ≥ 1 finding at or above `--fail-on` (e.g. today: the 58 + 57 dictionary TODO keys) |
| 2 | usage/config error: bad flag, `--llm` with `--deterministic-only`, missing key with `--llm`, `--out` in the repo, plan over a cap, section anchor not found, unreadable input |
| 3 | incomplete: a batch failed after its retries, a cap was reached mid-run, or the report failed its own schema. The report is still written with `incomplete: true` when possible |

**5.5 Flags** (complete list): `--llm` (opt-in LLM layer), `--deterministic-only` (the default, explicit form),
`--plan`, `--langs fr,es`,
`--sources content-json,dictionary,export`, `--model <id>`, `--max-requests <n>`, `--max-input-tokens <n>`,
`--max-output-tokens <n>`, `--fail-on error|warning|info`, `--out <dir>`.

### 6. Tests and evals
**6.1 Unit tests** (`scripts/qa-i18n/*.test.ts`, `// @vitest-environment node`, part of `npm test` and CI; no network,
no key). The LLM client is a fake `LlmClient`. Required cases:
- **Number normalizer:** `$3,500` = `3 500 $ CA` = `3 500 $` (U+00A0 and U+202F); `5 000 à 8 000` → {5000, 8000};
  `1,000.` with trailing punctuation; `3.5` decimal ≠ `35`; `%`.
- **Each deterministic check:** one positive and one negative case. `main-cta` reads the labels from a fixture
  dictionary, not from constants.
- **Adapters:**
  - content-json alignment: a missing row, an extra row, the merged EN `about-magneto` entries;
  - dictionary flatten: keys in EN only → `missing`;
  - export section map: an anchor not found → exit 2; a duplicate anchor → exit 2; the section boundary at the next
    heading of the same level.
- **LLM layer with the fake client:**
  - a valid tool input → findings;
  - an invalid tool input → exactly one re-ask, then the batch is `failed` and the exit code is 3;
  - an excerpt that is not a substring → `rejectedLlmFindings`;
  - an unknown `unitId` → rejected;
  - an extra `suggestion` property → rejected by the strict schema;
  - a cap reached mid-run → `skipped-cap`, `incomplete`, exit 3;
  - plan over a cap → exit 2 with no client call.
- **Key handling:**
  - `--llm` with a missing key → exit 2, the client factory is never called, and the message names the variable;
  - key **set** but no `--llm` → the client factory is never called and no request is made;
  - a planted fake key (`sk-test-…`) appears in no stdout, stderr or report output, including on a client error;
  - runs without `--llm`, and `--plan`, never import `anthropic-client.ts` (spy on the loader);
  - the QA test files `delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY` in `beforeEach`.
- **Output:**
  - the produced report validates against `ReportSchema`;
  - `report.md` starts with the "Flags only" line;
  - `--out` inside the repo → exit 2;
  - `--out` in a tmp dir writes exactly two files.
- **`length` (D-10):** the cases listed in §3.4.
- **Current repo files:** a `--deterministic-only` run on the real files reports `placeholder` findings exactly for
  the keys `findTodoKeys` returns for FR and ES. This is a cross-check against `dictionary.ts`; after the 11-11 fill
  it expects 0.

**6.2 Seeded-defect eval** (`npm run qa:i18n:eval`; needs the key; **not** in `npm test`, not in CI; run by Mauricio).
- **Fixture** `evals/fixture/`: small copies of real units (two content posts, about 30 dictionary keys, two export
  sections) in the same formats as the inputs, with planted defects in the FR/ES copies. The fixture is labelled in
  its README and `defects.json` as **mutated test data, not copy**. It is never loaded into WordPress and never
  imported by `src`.
- **`defects.json`:** one entry per planted defect, each `{id, layer, check, unitId, lang, description}`. There are
  14 defects plus 4 clean control units with no defect:
  - **Deterministic (6):** a price changed (`3 500` → `3 050`), a `cta_path` changed, `BUILD` translated, a leftover
    `[FR TODO]`, an empty value, and a main-CTA variant.
  - **LLM (8):**
    - meaning drift: "you approve the improvements" → the target says Magneto approves them;
    - a dropped condition sentence;
    - an added claim;
    - a second meaning drift: the tax condition reversed (FR "taxes en sus" → taxes included; rev 0.3 replaces the
      glossary defect, because glossary v1 has no "Packages" rule);
    - register: FR *tu* inside a *vous* page, and ES *usted* inside a *tú* page;
    - two untranslated EN fragments (one FR, one ES).
- **`eval.ts`:** runs the same pipeline on the fixture and matches findings to defects by `unitId` + `lang` +
  check family. It prints a table and writes `eval.json` / `eval.md` to the same out-dir root (outside the repo).
- **`eval.ts`** needs `--llm` for the LLM half, like the CLI. Without it, it runs and scores only the deterministic half.
- **Pass threshold** (D-8, approved):
  - deterministic recall **6/6** (100 %);
  - LLM recall **≥ 7/8**;
  - **0** `error`-severity findings on the 4 clean controls;
  - **≤ 3** unplanted findings of `warning` or above on the whole fixture.
  
  `--repeat 2` runs it twice and reports the worse run (non-determinism).
- **Deterministic half in CI:** the deterministic half of the eval (6/6 recall, 0 false errors on the controls) also
  runs inside `npm test`, with no key. CI therefore guards the deterministic layer against the same fixture.

### 7. Commands (local only)
```bash
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n            # agents: deterministic only (the default)
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --plan  # agents: no request: batches + estimate
npm run qa:i18n -- --llm                                      # Mauricio only (key from ~/.bash_profile, D-5)
npm run qa:i18n:eval -- --llm --repeat 2                      # Mauricio only
```
`package.json` scripts: `"qa:i18n": "node scripts/qa-i18n/qa-i18n.ts"`,
`"qa:i18n:eval": "node scripts/qa-i18n/evals/eval.ts"`. Neither is referenced by `build`, `start`, `agent:*`, CI,
`next.config.ts` or `src/`.

## Files the Dev may touch
- `scripts/qa-i18n/**` (new): the modules, configs, eval fixture, tests and README of §1.
- `package.json`: the two `qa:*` scripts; the devDependencies `@anthropic-ai/sdk` and `zod` (D-1, exact versions);
  `tsx` (exact version) **only** under the D-2 fallback.
- `package-lock.json`: only as `npm install` writes it for those packages.
- `tsconfig.json`: only `"allowImportingTsExtensions": true` (D-2 A; not under the fallback).
- `.env.local.example`: one commented entry, `# MAGNETO_QA_ANTHROPIC_API_KEY=` (no value), with the text "QA tool only
  (npm run qa:i18n -- --llm); do not put the value in this file; it comes from the shell". AGENTS requires new env
  vars to be listed here.
- `docs/reports/phase-5g-i18n-llm-qa.md` (new).

Anything else is out of scope, including every `src/` file, `scripts/phase-5c/**` (read, never written),
`docs/content/**`, the dictionaries, CI, `next.config.ts`, `vercel.json`, `AGENTS.md`, `CLAUDE.md` and `WORKFLOW.md`.

## Out of scope
- Rendered pages and the CMS / GraphQL as inputs (v2 adapter, §2.4). This includes the CMS-only parts of the E6
  promises: `[FR|ES] TEST` in CMS values (the Trépied titles), ACF default values, and the slug rule in WordPress (the
  slug rule is already checked read-only by `scripts/phase-5c/check-translations.php`). The report lists this coverage
  gap (AC-13).
- Fixing any finding. Every copy change goes through Notion → export → content files, decided by Mauricio.
- Running the LLM in CI, a pre-commit hook, a service, a UI or a dashboard.
- Translating, or generating "suggested" copy, in any form.
- Updating `WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` (Mauricio / Architect at phase close).

## Acceptance criteria
- [ ] **AC-1 Gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build` passes, with lint at or
  below the `master` ceiling. The Dev measures it on `master` before starting; the 5c report recorded 88 / 94 on
  2026-11-09. `npm run typecheck` covers `scripts/qa-i18n/**`.
- [ ] **AC-2 Lint and types in the tool:** `npx eslint scripts/qa-i18n` → 0 errors, 0 warnings.
  `grep -rnE ":\s*any\b|as any|<any>" scripts/qa-i18n` → no match.
- [ ] **AC-3 Unit tests:** every case in §6.1 and the `length` cases in §3.4 exist and pass. `env -u MAGNETO_QA_ANTHROPIC_API_KEY npm test -- --run`
  passes, and the QA tests also delete the variable themselves. The Dev states the test count before and after.
- [ ] **AC-4 Deterministic run on today's files:** `env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n` exits **1**. Its
  `placeholder` findings equal `findTodoKeys(fr)` + `findTodoKeys(es)` exactly (58 + 57 at `1609a63`, or the counts
  after the 11-11 fill). Every other finding is listed in the report with its count per check. The Dev doesn't judge
  whether those findings are real copy problems; Mauricio triages them (AC-10).
- [ ] **AC-4b Length check (D-10):** in that run, every `length` finding is `info` and marked "(placeholder limit)".
  The report lists the final selector set and any unused selector.
- [ ] **AC-5 No repo write:** `git status --porcelain` is byte-identical before and after an `--deterministic-only`
  run, a `--plan` run and (Mauricio) a full run. `--out ./tmp-qa` → exit 2.
- [ ] **AC-6 Key handling:** `env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n -- --llm` exits 2 with the §4.6
  message, before any network request. The tests "planted fake key" and "key set, no `--llm`" pass.
- [ ] **AC-7 Plan:** `npm run qa:i18n -- --plan` exits 0 with no key. It prints the batch count per source, the token
  estimate and the cost line, or "unknown" if D-4 isn't priced yet. The batch count is within the default caps.
- [ ] **AC-8 Outputs:** `report.json` validates against `ReportSchema` (test + the tool's own check). `report.md` starts
  with the "Flags only" line, and every finding in it shows file + location, check, EN excerpt, target excerpt and
  reason.
- [ ] **AC-9 Eval (Mauricio runs on Wed 11-11 after the dictionary fill, Dev reads the output):**
  `npm run qa:i18n:eval -- --llm --repeat 2` meets the D-8
  threshold on the worse run. `eval.md` and the cost line are pasted into the report. If it fails, the Dev may change
  the prompt or the batching (not the threshold, not the fixture) and Mauricio re-runs it, at most twice. After that
  it's reported as a fail.
- [ ] **AC-10 First real run (Mauricio, Wed 11-11, after the dictionary fill and AC-9):** one full run on the files
  as they are after the fill. The report gives the summary table, the
  cost line, failed / skipped / rejected counts, and Mauricio's triage of the `error` findings
  (real / false positive / accepted). Nothing is fixed in this phase.
- [ ] **AC-11 Isolation:** `grep -rnE "qa-i18n|@anthropic-ai/sdk|zod" src next.config.ts` → no match. The D-1
  packages are in `devDependencies` only. `npm run build` output has no new warning that mentions them.
- [ ] **AC-12 Verified against docs:** the report records:
  - the SDK version installed;
  - the docs URLs and the access date for the model IDs, the structured-output / tool-use parameters, the retry
    behaviour and the prices;
  - the D-3 mechanism used;
  - `config/pricing.json` with its `source` and `date`.
- [ ] **AC-13 Promise coverage:** the report has a table mapping each E6 promise to covered (which check) or deferred
  (to which adapter or script).

## Decisions (all decided, Mauricio, 2026-11-09)
- **D-1 → A.** `@anthropic-ai/sdk` + `zod` as `devDependencies`, exact versions. Recorded in
  [ADR 0009](../adr/0009-dev-only-llm-qa-tooling.md) (written by the Architect). `.npmrc` uses `legacy-peer-deps`
  (Known debt), so the Dev records any peer warnings.
- **D-2 → A, with a fallback.** Node type stripping plus `"allowImportingTsExtensions": true` in `tsconfig.json`.
  Mauricio's `node -v` is `v24.15.0`, so A applies.
  - **Fallback:** `tsx` as an exact-pinned devDependency, with extensionless imports and no `tsconfig` change. It
    applies only if the Node in use is below 24, or if the A1 check fails on Node 24.15.
  - The Dev records which path was used. With the fallback, the npm scripts become `tsx scripts/qa-i18n/…`.
- **D-3 → A.** Forced tool use (`report_findings`, `input_schema` from zod, strict mode if the docs offer it for the
  model), always re-validated with zod. If the docs make native structured output the recommended path for the chosen
  model, the Dev reports it and asks before switching.
- **D-4 → cheapest passing model.** The Dev proposes two candidates from the docs (one top tier, one cheaper tier).
  Mauricio runs the eval on both, and the default is the cheapest that meets D-8. The other stays available through
  `--model`.
- **D-5 → A, done.** Console workspace "magneto-qa" with a spend limit. The key is in the macOS Keychain and exported as
  `MAGNETO_QA_ANTHROPIC_API_KEY` from `~/.bash_profile` (Mauricio verified "key OK"). Agents never read it. The
  consequences for the design are opt-in `--llm` and `env -u` for agents (§4.6).
- **D-6 → A.** Reports go outside the repo, in `~/Documents/projects/magneto/qa/i18n/<timestamp>/`. An `--out` inside
  the repo → exit 2.
- **D-7 → A, with the cut line.** LLM only on export sections not already in the content files. The `export` adapter is
  the last build step, and it is dropped from v1 if step 4 is not done by the end of Tue 11-10 (Schedule).
- **D-8 → as recommended.** Deterministic 6/6; LLM ≥ 7/8; 0 `error`s on the 4 clean controls; ≤ 3 unplanted
  warnings or above; worse of 2 runs.
- **D-10 → length check (Mauricio, 2026-11-09), deterministic.** Design in §3.4. Limits and ratio come from
  `config/length-limits.json`. They are placeholders (findings are `info`) until the Fri 11-13 design round sets them.
  Build order: step 5, before the `export` input (Schedule). After 11-13, applying the design-round values is a config
  edit plus a re-run; it is outside this phase if it lands after the report.
- **D-9 → Mauricio's rules, final.**
  - FR-CA = *vous*, ES = *tú*.
  - BUILD / FIX / CARE are never translated.
  - Magneto, Magneto Web Consulting, Mauricio Bayuelo and the client/brand names (Dangel Wellness, Shamanicca,
    Trépied) stay unchanged.
  - CTA labels per locale are read from the dictionaries; ES has two labels on purpose.
  
  The draft file is §3.3. Mauricio approves its content (`approved.by` / `approved.on`) before the eval. Until then,
  `kept-terms` runs and the LLM `register` / `glossary` checks are off.

No routing, data-model or `src` change, so no other ADR is needed.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | LLM noise (false positives) wastes Mauricio's triage time | evidence substring check (§4.3); severity rules; 0-false-error controls in the eval; deterministic layer is authoritative |
| R-2 | LLM misses real problems | the deterministic layer catches every structural class; recall threshold; findings are advisory, not a sign-off. Mauricio's language review stays the release gate |
| R-3 | The model "fixes" text in `reason` despite the schema | the prompt rule; no replacement field; the `report.md` header; Mauricio decides. The text is never applied by any code |
| R-4 | Cost overrun or a runaway loop | opt-in `--llm`; plan + absolute caps; sequential; bounded retries; Console spend limit (D-5) |
| R-5 | Key leak or unintended spend (logs, report, agent sessions; the key is exported from `~/.bash_profile`) | dedicated variable; opt-in `--llm`; agents prefix `env -u` and never pass `--llm`; tests delete the variable; no `.env` loading; error redaction; the planted-key and "key set, no `--llm`" tests; Console spend limit |
| R-6 | SDK, model or price drift (and the Architect couldn't verify, E8) | exact pin; model configurable; AC-12 records the docs and date; unknown price → "unknown", never a guess |
| R-7 | Internal notes sent to the API | the section map excludes internal blocks (§2.3); Mauricio reviews the map |
| R-8 | The `tsconfig` change affects the Next build (D-2 A) | one permissive option with `noEmit`; the full gate + build in AC-1 |
| R-9 | Over the 4–8 h estimate (more with D-10) | the estimate below is honest about it; cut line: drop the `export` adapter from v1 (saves ≈ 2 h; D-7 then moot) |
| R-12 | Placeholder length limits read as design decisions, or noise before 11-13 | `status: "placeholder"` → `info` only, marked in `report.md`; never affects the exit code; values set by the design round |
| R-10 | The build doesn't fit in Tue 11-10 (agent estimate > one working day), or Wed 11-11 overruns into Thu (privacy route) / Fri (design round), which are taken | order of work + the Tue cut-line trigger (Schedule); D-9 and the key setup are done, so Wed only runs; the eval and first run move to the next free day, never into Thu/Fri |
| R-11 | Seeded fixture mistaken for copy | lives under `evals/fixture/` with a "mutated test data" README; never imported by `src` or the loader |

## Estimate
| Task | Dev (agent) | Mauricio |
|---|---:|---:|
| Spec review + D-1…D-9 | — | 30–45 min (done) |
| Verify SDK / models / prices in the docs; scaffold, schema, CLI, exit codes | 1–1.5 h | — |
| Input adapters (content-json, dictionary, export + section map) | 1.5–2 h | 15–20 min (section-map review) |
| Deterministic checks + tests | 1.5–2 h | — |
| LLM layer (client, batching, caps, retries, validation) + fake-client tests | 2–2.5 h | — |
| Glossary file (D-9; draft in §3.3) | 0.25 h | 10–15 min (approval) |
| Eval fixture, `defects.json`, `eval.ts` | 1–1.5 h | — |
| `length` check + `length-limits.json` + tests (D-10) | 0.75–1 h | — (values: Fri 11-13 design round, outside this phase) |
| Key setup (workspace, limit, Keychain) | — | done |
| Eval runs (2 models × `--repeat 2`) + at most 2 prompt iterations | 0.5–1 h | 20–40 min |
| First real run + triage | 0.25 h | 30–60 min |
| Report | 0.5–1 h | 10 min |
| **Total** | **≈ 9.5–13.25 h** | **≈ 2–3.5 h** (review already done) |

This exceeds the Notion estimate of 4–8 h. The quality bar (typed, tested, evaluated) costs most of the difference.
**Cut line:** without the `export` adapter, the agent total is ≈ 7.5–11.25 h. The `export` adapter can follow later as its
own adapter, with no change to the checks. API spend isn't estimated here: `--plan` prints it once the D-4 prices are
in.

**Schedule** (Mauricio, rev 0.2; dates may move earlier as steps close; Thu 11-12 and Fri 11-13 are taken):
- **Mon 11-09 (today):** review done, D-1…D-9 decided, ADR 0009 written, spec Approved (rev 0.3).
- **Tue 11-10:** the Dev builds, in this order, so that each step leaves something usable:
  1. docs verification (AC-12), scaffold, schema, CLI, exit codes;
  2. `content-json` + `dictionary` adapters and the deterministic checks with their tests: `--deterministic-only`
     works (AC-4, AC-5);
  3. the LLM layer with the fake-client tests, then `--plan` (AC-6, AC-7);
  4. `glossary.json` from §3.3, the eval fixture and `eval.ts`;
  5. the `length` check (D-10, §3.4);
  6. the `export` adapter and the section map, last.

  Mauricio, in the margins: approves `glossary.json` (before Wednesday's eval) and reviews the section map (only if
  step 6 is reached).
  **Cut-line trigger:** if step 4 isn't done by the end of Tue 11-10, step 6 (`export`) is cut from v1 (R-9). D-10
  adds ≈ 0.75–1 h, so in practice the cut is likely. The `length` check (step 5) stays in v1 either way. If it isn't
  done on Tuesday, the Dev finishes it on Wed morning while Mauricio fills the dictionaries; the eval doesn't depend
  on it. The tool ships
  with the `content-json` and `dictionary` inputs, and the `export` adapter becomes a follow-up. The Dev states this
  in the report.
- **Wed 11-11:**
  1. Mauricio fills the FR/ES UI dictionaries (separate work, not in this spec).
  2. Dev, right after: a deterministic run (`env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n`), which must show 0 `placeholder` findings for the filled keys
     (AC-4), and the gate.
  3. Mauricio: `npm run qa:i18n:eval -- --llm --repeat 2` on both D-4 candidates (AC-9), at most 2 prompt iterations by the
     Dev.
  4. Mauricio: the first real run on the filled files and the triage of the `error` findings (AC-10).
  5. Dev: the report.

  If the eval or the run doesn't fit on Wednesday, it moves to the next free day after Fri 11-13, not into Thu/Fri.
- **Fri 11-20:** re-run after 5c-rest as an input to launch QA.

The agent total (≈ 9.5–13.25 h) is more than one working day. Tuesday holds only with the order above and the cut-line
trigger. The run on Wednesday needs ≈ 1–1.5 h of Mauricio's time after the dictionary fill.
