# Phase 5b — Services, Packages and per-page SEO metadata

- **Status: Draft** (rev 4). Not approved; implementation not authorized.
- Author: Architect (Codex, rev 1–2; Claude, rev 3–4) · Reviewed by: Mauricio + Senior Architect · Date: 2026-10-28.
- Branch: **`feat/phase-5b`** (exists, at `75b05bf` = `feat/phase-5a` head). S1 lands on `feat/phase-5a` (see S1).
- Depends on: [5a spec](phase-5a-structure-shared-home-about-cases.md) (Approved), [ADR 0006](../adr/0006-phase-5-content-model.md)
  (Accepted, amendment 1), [5a report](../reports/phase-5a-structure-shared-home-about-cases.md), the 5a production ACF
  runbook rev 4 (see E5), and the loader spec [phase-5c-loader.md](phase-5c-loader.md) rev 2, **approved together with
  this spec in one review** (no separate loader review cycle).
- Canonical content: [EN export](../content/magneto-copy-en.md) (Notion stays canonical). Section titles govern if line
  numbers move. The [gap analysis](phase-5-gap-analysis.md) is background only and does not override ADR 0006.
- Release: **R1 = EN only, target Thu 2026-11-26** (Mauricio, decided 2026-10-28). FR/ES stay disabled in production.
  In 5b, FR/ES only need "renders, no crash" (unit tests + one smoke build). Full FR/ES verification is R2.

## Revision
**Rev 4 (2026-10-28, scope trim approved by Mauricio to target R1 on 2026-11-26):**
1. **Verification is EN-only**: EN at 375/768/1440 for Services, Packages and the shared Hero regression (Home, About,
   Contact, Projects). FR/ES screenshots, FR/ES browser checks and FR/ES locale fixtures are dropped from 5b; FR/ES are
   covered by unit tests and one smoke build (§7, §9). Full FR/ES verification moves to R2.
2. **Review gates merged.** One spec review (this spec + loader rev 2 together; it also authorizes S1), **one combined
   5b + loader checkpoint** (after the Services slice and the loader dry-run + real run locally) and **one final
   review**. No separate loader review cycle, no separate S1 go-ahead.
3. **State M reduced to four essential unit-test groups** (empty/editor-empty HTML fallback, DOMPurify, invalid CTA path,
   empty repeaters) plus the 5 Hero tests. No rendered M evidence.
4. **Kept unchanged:** production safety (runbook, dry-run, backups, read-back), the Hero CTA rule (§5.3), anchors,
   metadata (8 pairs), the completion gate and the build guard.
5. Re-estimated (§10, §11); **2026-11-26 confirmed conditionally** (milestones in §11).
6. Facts refreshed (E3, E5): S0 is done; S1 is not; local CMS was not reachable during this revision.

Rev 3 / 3.1 (2026-10-27), still in force: B1 field in the single Phase 5 export (S1, ADR 0006 amendment 1); one-rule Hero
CTA contract; state N = loader output; B2 (Projects metadata + global fallback retained) and B3 (3 case pairs);
5 EN SEO page pairs approved by Mauricio as written; Contact R1 exception owned by 5d-lite; ES "Reservar consulta".

## Goal
Services shows BUILD / FIX / CARE as the three core offers followed by four supporting capabilities. Packages shows the
three matching cards, then the Paid Website Diagnostic and the budgeting guidance. The Packages Hero CTA links to
Contact. Per-page metadata uses the exact approved copy (5 pages + 3 case studies). State C (current content) keeps
working, state N (loader output) matches the EN copy.

5b implements readers, presentation and metadata. **Content replacement in production is 5c (release day).** A
successful local state N does not mean production is populated or that R1 is ready.

## Evidence

**E1. Local CMS** (verified 2026-10-27; `http://magneto-cms-2.local/graphql`, introspection + query). Re-verify at Dev
entry: on 2026-10-28 the endpoint did not answer (`curl` exit 7, Local not running).
```graphql
query { t: __type(name: "HeroContent") { fields { name type { name } } }
  p: pages(where: {language: "en", name: "packages"}, first: 1) { nodes { databaseId
    heroContent { heroTitle subtitleHero ctaTextHero ctaLinkHero } pageintrotext { pageIntroText introBodyHtml } } } }
```
```json
"t": { "fields": [ "backgroundImage", "ctaLinkHero", "ctaTextHero", "heroTitle", "image", "subtitleHero" ] },
"p": { "databaseId": 36, "heroContent": { "heroTitle": "Funnel & Web Packages",
  "subtitleHero": "Choose the best-fit package based on your growth stage and goals.",
  "ctaTextHero": "Book a Free Strategy Call", "ctaLinkHero": "https://calendly.com/mauriciobayuelo/free-discovery-call" },
  "pageintrotext": { "pageIntroText": "Whether you're just starting or scaling up, …", "introBodyHtml": null } }
```
- `HeroContent` has **no `ctaPath`** yet. `introBodyHtml` exists and is empty → Packages is in state C locally.
- EN heroes of home/services/projects/about-magneto/contact: all `ctaTextHero = "Book a Free Strategy Call"`; home links
  `magnetomarketing/free-strategy-call`, the other five `mauriciobayuelo/free-discovery-call` (Known debt).
- `docs/acf/phase-5-field-groups.json`, group `heroContent` (`group_689a2d99bc46f`, `post_type==page`): `cta_link_hero`
  is **text** (not `url`). No field named `hero_cta_path` in any group (2026-10-28: `grep -c hero_cta_path` → `0`).

**E2. Code** (`feat/phase-5a`):
- `Hero/HeroLoader.tsx:28`: `cta = ctaTextHero && ctaLinkHero ? { text, href } : undefined`.
- `Hero/HeroCTA.tsx:22-37`: href containing `calendly` → `CalendlyButton`; `:55-61`: other href → plain `<a href>`
  (not localized). Writing `/contact` into `ctaLinkHero` would give the live site an unlocalized `<a href="/contact">`.
- `Hero/api.ts:9-35` `PAGE_HERO_QUERY` is shared by all six pages: adding `ctaPath` makes every Hero query depend on the
  amended schema.
- `packages/page.tsx:15-21`: page data is fetched **before** `HeroLoader` renders, so the page can pass a flag to it.
- `i18n/paths.ts:17-20` `localizePath('/contact','fr')` → `/fr/contact`.
- `vitest.config.ts` uses Vitest's default include, so `*.test.ts` under `scripts/` also run in `npm test`.

**E3. S0 done (2026-10-28, `git log`, `ls`).** 5a is committed on `feat/phase-5a` (`25dd9a9` … `75b05bf`); the 5a report
records "Gate re-run on the 5a-only tree" (lint 113/104, any 96, 29 files / 293 tests, builds pass; D12 accepted).
`services/` no longer contains `content.ts`/`types.ts`/`ServicesList.test.tsx`, `scripts/phase-5b/` is absent, and
`feat/phase-5b` exists at `75b05bf` with no commits of its own. The WIP is in a backup outside the repo (5a report).

**E4. Facts kept from rev 2** (re-verify at Dev entry): `serviceGroup` is `[String]` (5a I-7); `PackagesGrid` forwards
only title/description/price/features/icon and **not** `popularChoise`; Services metadata can be overridden by a
`WP_API` REST response; case studies use a generic title template; Services/Packages final CTAs are loaded by the 5a
fixtures; all nine EN routes respond 200.

**E5. Runbook location (open).** `docs/specs/phase-5a-production-acf-runbook.md` is not in this tree; the head of
`spec/phase-5a-runbook` (`46758d2`) is **rev 2**. Rev 4 (which carries `hero_cta_path`) is not found in any committed
history. Mauricio confirms where rev 4 lives before the production import (AC-2).

**E6. SEO export.** `docs/content/magneto-copy-en.md` still reads `### SEO — Draft` at lines 138/246/420/542/645 (re-export
of the approved text pending).

## Assumptions and open questions
- A1: after S1 + local re-import, `HeroContent.ctaPath` appears in introspection as `String` (the Dev checks).
- A2: the 5a production import (runbook rev 4) happens **before** any 5b PR preview. Without it, every Hero query of the
  5b frontend fails against production (E2). Hard precondition (AC-2).
- A3: a browser `<input type="text">` drops line breaks, so saving Packages in WP admin would join the two
  `subtitleHero` paragraphs the loader writes with `\n\n`. Accepted; the 5c release-day runbook says "don't save
  Packages in admin".
- A4: FR/ES translations of Services/Packages keep their current (state C) content; the 5b readers must render them
  without crash or EN fallback. This is checked by unit tests and the smoke build only (§7).
- Open Q1 (Mauricio): `/projects` Hero CTA — keep "Book a Free Strategy Call" or write "Book a Strategy Call"? Default:
  the loader leaves the Projects CTA fields untouched.
- Open Q2 (Mauricio): Contact Hero secondary CTA "Prefer to talk? Book a Strategy Call" is owned by 5d-lite. Default:
  the loader writes only the Contact Hero title + subtitle.

## Decisions retained
- App Router pages; `src/pages/api/*` stay in Pages Router. `fetchWPGraphQL`, language + slug filters, EN-original
  media. No URI lookups, new CMS, new dependency or page builder.
- ADR 0006 expand/contract: additive fields, `new || legacy`, no retyping, no production replacement before release day.
- Services core CTAs → `/packages#build|fix|care`; package card CTAs and the Packages Hero → `/contact`; all through
  `localizePath`. Home links → `/services#build|fix|care` (this phase supplies the targets).
- Per-page final CTAs, secondary buttons, whole-Home fallback and orphan protection unchanged. Lead magnet hidden.
  Header/Footer unchanged, including ES "Reservar consulta".
- Project order 10/20/40 (30 reserved). Projects index Hero = Home §4 via the loader.
- Visual identity, alternating Services rhythm and three-card Packages stay; responsive work needed by the full copy is
  in scope, redesign is not.

### Contact R1 exception (Mauricio, 2026-10-27) — owned by 5d-lite, not 5b
R1 may ship the reduced Contact form **if** consent, messaging and existing behavior are verified and corrected. 5d-lite
evidences: truthful messaging with no unsupported SLA; no implicit marketing subscription; validation, delivery and
failure handling with no false success; the agreed privacy notice/link. 5b changes only Contact metadata (§6).

## Design

### S0 — done (E3). Remaining step
At Part 1 entry the Dev re-applies the WIP from the outside-repo backup onto `feat/phase-5b` as a **starting point
only**: it was written against rev 2, so its fixture imports are replaced by the loader content (§7), Hero work follows
§5.3, and `scripts/phase-5b/` is not carried over. Record the WIP sha256s in the report.

### S1 — ACF amendment (authorized by the approval of this spec; no separate go-ahead)
On `feat/phase-5a` (so the 5a PR and the single production import carry it), before the 5a PR: append to
`heroContent.fields` (at the end, no existing key reordered) one field shaped like `field_p5_finalctasection_cta_path`:
key `field_p5_herocontent_hero_cta_path`, label "CTA Path", name `hero_cta_path`, type `text`, `wpml_cf_preferences: 2`,
`default_value: ""`, `show_in_graphql: 1`, `graphql_field_name: "ctaPath"`, instructions "Internal path. Only /contact
is used (Packages). The site adds the language prefix. Empty: the CTA keeps the CTA Link behavior." Nothing else changes.
Evidence: `acf-json-diff.mjs before → amended` = 13 → 14 groups, **Added 36** (35 fields + 1 group), Removed 0,
Changed 10, reordered 0, duplicates 0, exit 0; `--self-test` passes; old/new sha256. Mauricio: `wp db export`, re-import
locally, re-export, commit on `feat/phase-5a`, then bring it into `feat/phase-5b` (merge or rebase — his choice). Dev
diffs re-export → amended (0 changes) and checks introspection (A1). The 5a frontend doesn't select `ctaPath`.

### 4. Data contracts
Use the amended `docs/acf/phase-5-field-groups.json`; verify every field by read-only introspection at entry. Nullable
strings/lists; no new `any`.

| Group | GraphQL | Presentation / fallback |
|---|---|---|
| `heroContent` | existing + `ctaPath` | §5.3 |
| `pageintrotext` | `pageIntroText`, `introBodyHtml` | Services: legacy heading kept, new body adds paragraphs. Packages: new body replaces the legacy intro block. |
| `servicesServiceDetails` | `coreHeading`, `supportingHeading`, `supportingIntro`, `services[]` | Optional headings; no hardcoded headings when empty. |
| `services[]` | legacy `title`, `description`, `featuredService`, `icon`, `image`; new `heading`, `descriptionHtml`, `ctaText`, `ctaPath`, `anchorId`, `serviceGroup: (string\|null)[]\|null` | Group = `serviceGroup?.[0]` → `core` / `supporting` / unclassified. Nonblank HTML replaces the legacy description; never both. |
| `packagesPackageFeatures.packagesElements[]` | legacy `name`, `description`, `price`, `popularChoise`, `icon`, `features[]`; new `heading`, `descriptionHtml`, `featuresTitle`, `ctaText`, `ctaPath`, `anchorId` | Rich body vs legacy body (§5.2). |
| `packagesContentSections.sections[]` | `heading`, `bodyHtml` | CMS order after the cards; empty rows omitted. |
| `finalCtaSection` | 5a contract | Unchanged. |

Typed view models in the route/component `types.ts` (discriminated body `html | text`, optional anchor, optional
complete link, resolved media). Editor-empty HTML (`<p><br></p>`, `&nbsp;`) counts as empty.

Rendering and error rules: sanitize every new HTML fragment with `isomorphic-dompurify`; plain fields stay text; no rich
HTML inside `<p>`/headings. Service/package CTAs appear only with nonblank text **and** a path in their allowlist
(`/packages#build|fix|care`; `/contact`), compared after trim, localized once. Anchors are the literal
`build`/`fix`/`care`, applied only when valid and unique, with a scroll offset for the sticky header. Missing
translation → `notFound()`; CMS error ≠ missing translation; keep the existing Services error state and an equivalent
dictionary-backed Packages one. Empty repeaters → no orphan headings or empty wrappers.

### 5. Page design and content mapping
**5.1 Services** (copy lines 261–435): Hero from `heroContent`; intro heading + 3-paragraph `introBodyHtml`;
`coreHeading` "Core Services" and BUILD/FIX/CARE rows (anchors `build`/`fix`/`care`; CTAs "See BUILD pricing" →
`/packages#build`, "See how FIX works" → `/packages#fix`, "Compare CARE plans" → `/packages#care`); `supportingHeading` +
`supportingIntro` and the 4 supporting rows (no price, no CTA, visually subordinate). No "Featured Service" badge on rich
rows. Mixed data order: core, unclassified, supporting. Final CTA unchanged.

**5.2 Packages** (copy lines 437–560): Packages-variant Hero renders `subtitleHero` paragraphs split on a blank line
(other variants unchanged); Hero CTA per §5.3; `introBodyHtml` = currency/tax sentence, replacing the legacy intro block
when populated. Cards BUILD / FIX / CARE with `heading` = the "For…" line. **Rich mode** (`descriptionHtml` nonblank):
only the rich body — no legacy `price`, `description`, `features` or "What's included". **Legacy mode**: current
rendering. No popular badge in either mode. CTAs "Discuss a BUILD project", "Discuss a FIX project", "Ask about CARE" →
`/contact`; a rich card without a valid CTA pair renders no CTA (never the strategy-call default). Prices exactly as
written, once. Then `packagesContentSections`: "Paid Website Diagnostic" (incl. C$450) and "Good to Know Before You
Budget". Final CTA unchanged.

**5.3 Hero CTA (B1, approved; unchanged in rev 4)**
Why a new field: `ctaLinkHero` *could* store `/contact` (it is `text`, E1), but it means "booking link" to the live
frontend, which would render it unlocalized (E2), and rewriting it changes an existing value (ADR 0006 rule 1).

Rule, as one pure function (e.g. `resolveHeroCta` in `Hero/api.ts`), applied in `HeroLoader`:
1. If `ctaPath.trim() === '/contact'` **and** `ctaTextHero.trim()` is nonblank → internal link
   `{ text, href: localizePath('/contact', locale) }`. No Calendly, regardless of `ctaLinkHero`.
2. Otherwise, if `requireInternalCta` is true → **no CTA** (no wrapper, no button, no modal handler).
3. Otherwise → legacy behavior, exactly today's line 28 (`ctaTextHero && ctaLinkHero`).

`requireInternalCta` is a new optional `HeroLoader` prop (default `false`). Only `packages/page.tsx` sets it, to true
when its normalized `introBodyHtml` or any card `descriptionHtml` is populated. Nothing is repaired or guessed.
`HeroCTA` is not changed.

Tests (5):
1. `/contact` + text + stale Calendly URL → `<a>` to `/contact`, `/fr/contact`, `/es/contact`; no `CalendlyButton`.
2. Non-allowlisted `ctaPath` (`/packages`, `https://x.co`, `//x.co`, `/contact?x=1`, `/fr/contact`, `javascript:x`) with
   `requireInternalCta=false` → today's legacy CTA, unchanged.
3. `requireInternalCta=true` with `ctaPath` null / `''` / non-allowlisted and a stale Calendly URL → no CTA element.
4. `/contact` with blank/null `ctaTextHero` → no CTA in both modes.
5. Packages state C (`requireInternalCta=false`, `ctaPath` null) and the other five pages → Hero output identical to
   today (existing Hero/fingerprint assertions keep passing).

The loader always writes `hero_cta_path` and `cta_text_hero` together, so a preview can't pair `/contact` with a stale
booking label.

### 6. Per-page metadata (8 pairs; unchanged in rev 4)
Metadata stays in the locale dictionaries (ADR 0005). Title + description + matching OG/Twitter text; shared
image/card/site defaults preserved.

| Route / identity | Source (EN export) | Status |
|---|---|---|
| `/` | Home SEO, 138–142 | Eligible — approved by Mauricio 2026-10-27 |
| `/about-magneto` | About SEO, 246–250 | Eligible — same |
| `/services` | Services SEO, 420–424 | Eligible — same |
| `/packages` | Packages SEO, 542–546 | Eligible — same |
| `/contact` | Contact SEO, 645–649 | Eligible — same; metadata only |
| `/projects` | none | **B2: retain current metadata** (exception to record) |
| Dangel `fashion-company-ecommerce` | 964–968 Final | Eligible (B3) |
| Trépied `trepied-trepied-ca` | 1075–1079 Final | Eligible (B3) |
| Shamanicca `shamaniccas-ecommerce` | 1210–1214 Final | Eligible (B3), incl. own-project disclosure |

- The 5 page pairs are approved "as written": today's export text is the approved text (sha256 of each 5-line block,
  lines 138/246/420/542/645: `aed5ce95…`, `1ddcf6cf…`, `6b6f0817…`, `1e29d37a…`, `cc655335…`). When the re-export
  lands (E6), the Dev checks that only the heading changed; if any string differs, the re-export wins and the Dev stops
  and reports before changing the dictionary.
- `meta.site.fallbackDescription`: **B2: retain** until a canonical replacement exists.
- Reuse `meta.home|about|services|packages|contact|projects`; a pure helper (e.g. `src/utils/page-metadata.ts`) may
  build title/description/openGraph/twitter. Remove the Services `WP_API` REST metadata override.
- Cases: `meta.caseStudies.dangel|trepied|shamanicca.{title,description}` + an explicit slug → key map; locale's project
  resolved first; missing translation → 404; unknown case → current generic metadata.
- FR/ES: new keys as `[FR TODO]`/`[ES TODO]` (measure the TODO delta; the build guard must still reject enabled
  unfinished locales).
- No canonical/hreflang/sitemap/robots/OG locale/metadataBase/schema.org changes (Phase 7). If the B2 exception is not
  recorded by the end of 5b, Projects and the global fallback are reported as OPEN, never PASS.

### 7. Verification states, tests and sequence
- **C — current local content** (5a fixtures applied; Services/Packages new fields empty). Captured in EN **before** the
  loader run. Mauricio's pre-loader `wp db export` is its restore point. The 5b production PR preview is also state C.
- **N — loader output** (`phase-5c-loader.md` rev 2, EN, Services/Packages/heroes). The loader's `en.json` is the single
  transcription of the copy; 5b unit tests that need N data import it.
- **M — unit tests with mock responses only, four essential groups** (no rendered evidence):
  1. empty / editor-empty HTML (`null`, `''`, `<p><br></p>`, `&nbsp;`) → legacy fallback (Services description,
     Packages legacy mode, legacy intro);
  2. DOMPurify: a `<script>` / `onerror` in each new HTML field is stripped;
  3. invalid CTA path (outside the allowlist, or text without path / path without text) → no CTA;
  4. empty repeaters (services, packages, sections) → no orphan headings or empty wrappers.
- **FR/ES — "renders, no crash" only**: (a) a unit test per route mapping a state-C-shaped FR and ES response (legacy
  fields only) renders without throwing and without EN strings from `en.json`; (b) missing translation → `notFound()`
  (existing route tests, kept); (c) the one smoke build of AC-15 (EN/FR/ES with command-local
  `ALLOW_UNTRANSLATED_LOCALES=1`) exits 0. No FR/ES browser checks, screenshots or locale fixtures.

**Part 1 — contracts, Services slice, loader**
1. Entry: S1 done and imported locally, A1 checked; WIP re-applied (S0 remaining step); record hashes, branch, gate
   baseline, safety settings (no secrets).
2. Typed queries/mappers; the four M groups and the FR/ES unit tests for both routes; the Hero rule (§5.3) and its 5
   tests; Services rendering + anchors.
3. Loader per `phase-5c-loader.md` rev 2: `en.json`, `content.test.ts`, `load-content.php`, guard proofs, and the
   expected dry-run totals computed from `en.json`.
4. Capture Services + Packages **C** (EN 375/768/1440).
5. Mauricio: `wp db export` → loader dry-run (checks it against the expected totals and the scope table) → real run →
   `wp cache flush`; sends the output tail + backup name. He stops if the dry-run differs; that is the only extra loop.
6. Dev: loader read-back via GraphQL; capture Services **N** (EN 375/768/1440).
7. **Combined 5b + loader checkpoint — stop.** One report section: contracts, loader output and read-back, C/N
   screenshots, test list, diff, open questions. Wait for recorded approval.

**Part 2 — complete and verify**: Packages presentation, metadata, §8 acceptance, §9 QA, report
`docs/reports/phase-5b-services-packages-seo.md`. **Final review — stop.** No 5c production work, no staging or commits.

## Files the Dev may touch
- S0 remaining step: the WIP files, re-applied onto `feat/phase-5b` only within the 5b list below.
- S1 (on `feat/phase-5a`): `docs/acf/phase-5-field-groups.json` (one appended field). `scripts/phase-5a/acf-json-diff.mjs`
  only if its counts are hardcoded somewhere (expected: not touched).
- 5b on `feat/phase-5b`:
  - `src/app/[locale]/services/{api.ts,api.test.ts,content.ts,types.ts,page.tsx,ServicesList.tsx,ServicesList.test.tsx,Services.scss}`;
  - `src/app/[locale]/packages/{api.ts,api.test.ts,types.ts,page.tsx}` + scoped styles;
  - `src/components/molecules/PackageCard/{index.tsx,PackageCard.scss}` + types/tests;
  - `src/components/organisms/PackagesGrid/{index.tsx,types.ts,PackagesGrid.scss}` + tests;
  - one Packages-only content-sections component (index/types/scss/test) under `src/components/organisms/`;
  - `src/components/organisms/Hero/{api.ts,api.test.ts,HeroLoader.tsx,index.tsx,Hero.scss,types.ts}` (§5.3 and the
    Packages paragraph split only; not `HeroCTA.tsx`);
  - metadata parts only of `src/app/[locale]/{page.tsx,about-magneto/page.tsx,services/page.tsx,packages/page.tsx,contact/page.tsx,projects/page.tsx,projects/[slug]/page.tsx}`;
    optional `src/utils/page-metadata.ts` + test;
  - `src/i18n/dictionaries/{en,fr,es}.ts`, `en.test.ts`, `src/i18n/dictionary.test.ts` (metadata keys, parity, the
    Packages error state);
  - `scripts/phase-5c/*` as listed in `phase-5c-loader.md`;
  - `docs/reports/phase-5b-services-packages-seo.md`.
Anything else is out of scope.

## Out of scope
Contact form/API/consent, modal, Brevo, Privacy route, new SEO copy, WP `generalSettings`, production imports or
content writes, deployment, case-study bodies/media, Dangel slug, canonical/hreflang/sitemap/robots/OG locale, new
artwork, 5a rework, `.env.local`, staging/commits/pushes/merges. **FR/ES content, FR/ES fixtures, FR/ES visual or
browser verification (R2).**

## Acceptance criteria
| ID | Evidence |
|---|---|
| AC-1 | S0 recorded (E3 + WIP sha256s); at 5b end only listed files differ; index empty; no CMS/production writes by agents. |
| AC-2 | S1: diff 36/0/10/0, duplicates 0, local re-export = amended JSON, `HeroContent.ctaPath: String` locally. Production: the runbook rev 4 import done (38/38 schema checks) **before** any 5b preview; rev 4 location confirmed (E5). |
| AC-3 | State C (EN): 7 legacy Services rows and 3 Packages cards with their text, media and current CTAs; no badge; Hero output of all 6 pages unchanged (Hero test 5); 5a final CTAs unchanged. |
| AC-4 | State N Services (EN) matches every public heading/paragraph/list of §§1–9 in order: 3 core + 4 supporting, no legacy offer copy, no supporting price/CTA. |
| AC-5 | N links reach unique visible targets: Home → Services anchors; Services → Packages cards; cards and Packages Hero → `/contact`. Keyboard + sticky-header offset checked (EN). |
| AC-6 | N Packages: both Hero paragraphs, CTA "Tell me about your project" → `/contact`, tax note; 3 cards with all text, prices once, CTA labels. |
| AC-7 | Diagnostic below the cards with C$450; budget guidance after it; no fourth package, badge or internal prices. |
| AC-8 | The four M unit-test groups (§7) and the 5 Hero tests (§5.3) pass. |
| AC-9 | Final CTAs, Home fallback/orphan handling unchanged; Contact has no final CTA; lead magnet absent. |
| AC-10 | Metadata: the 5 page pairs and the 3 case pairs match the source exactly in rendered EN title/description/OG/Twitter (checked against the re-export, only headings changed); Projects + global fallback retained under the recorded B2 exception, else OPEN. |
| AC-11 | Case metadata by existing slug + locale; missing translation 404; unknown case generic (unit tests + one EN unknown-case `<head>` check). |
| AC-12 | EN fingerprint + dictionary parity pass; only approved keys change; ES "Reservar consulta" unchanged; TODO delta accounted for, guard effective. |
| AC-13 | §9 EN matrix: no clipping, overlap, horizontal scroll or unusable controls; screenshots recorded; visual approval by Mauricio pending until given. |
| AC-14 | lint (no new findings vs entry, no new `any`), typecheck, tests, build — each run and reported with counts. |
| AC-15 | EN build without override passes; EN/FR/ES build without override fails on TODOs and passes with command-local `ALLOW_UNTRANSLATED_LOCALES=1` (this is the FR/ES smoke build). |
| AC-16 | FR/ES unit tests of §7 pass (renders, no crash, no EN fallback). No FR/ES visual claim is made. |
| AC-17 | Loader ACs in `phase-5c-loader.md` rev 2 met; combined checkpoint approval and final review recorded; no claim of R1 readiness or of the Contact exception. |

Required regression tests (kept): locale + slug queries, `serviceGroup?.[0]`, EN media, full mapper → grid → card
forwarding, rich vs legacy suppression, the six cross-page anchors (valid/duplicate), metadata strings and REST-override
removal, and the existing 5a suites (final CTA fallbacks, testimonials, project order, About CTA collision, header copy,
EN fingerprints) unchanged.

## 9. Responsive QA (EN only)
| Surface | Coverage |
|---|---|
| `/services`, `/packages` | EN 375 / 768 / 1440, state C and state N: full page, grouping, cards, Diagnostic, final CTAs |
| Shared Hero regression | Home, About, Contact, Projects, EN 375 / 768 / 1440, state N (state C pinned by Hero test 5 + fingerprints) |
| Cross-page links | Home service links → Services anchors; Services → Packages; Packages → Contact (EN, one width + keyboard) |
| Metadata | 6 EN routes + 3 cases + 1 unknown case, `<head>` inspection: title once, one description, OG/Twitter match, default image/card kept |
On Services/Packages (EN): focus order, visible focus, Enter activation, names, 24×24 targets, contrast, 200% zoom.
Don't submit forms or complete bookings. Port 3100+, never a `.next` used by another server, stop only own PIDs.

## Decisions needed
- **B2 exception** (Mauricio): confirm retaining Projects metadata and `meta.site.fallbackDescription` for R1.
- **Q1/Q2** (Mauricio): Projects Hero CTA; Contact Hero scope (defaults above).
- **E5** (Mauricio): location of runbook rev 4.
- **R1 trim beyond 5b** (Senior Architect): the 11-26 estimate assumes 5c-rest and 5d-lite are also EN-only for R1
  (FR/ES loader content and FR/ES verification → R2), and that the WPML production key / outbound access (O-1/O-2) is
  not needed for an EN-only launch. Confirm or the date moves (§11).
- No ADR needed beyond ADR 0006 amendment 1 (S1), already recorded.

## 10. Estimate (5b + loader)
| Work | Dev (agent) | Mauricio |
|---|---:|---:|
| Combined review of this spec + loader rev 2 | — | 30–45 min |
| S1 JSON amendment + diff evidence | 0.5–1 h | 20 min (db export, re-import, re-export, commit) |
| WIP re-apply, typed contracts, M (4 groups) + FR/ES unit tests | 1.5–2.5 h | — |
| Services rendering + anchors | 2–3 h | — |
| Hero rule + paragraphs + 5 tests | 1.5–2 h | — |
| Loader (EN Services/Packages/heroes) — loader spec | 6–8 h | 30–40 min (dry-run check + run) |
| EN C/N capture + combined checkpoint | 1 h | 30–45 min |
| Packages cards, content sections, responsive | 4–6 h | — |
| Metadata (8 pairs, helper, REST removal, tests) | 2.5–3.5 h | 10 min (re-export) |
| Gates, EN QA matrix, report | 2.5–4 h | 45–60 min (final review + visual approval) |
| **Total** | **≈ 21.5–31 h** (rev 3: 26.5–40.5 h) | **≈ 3–4 h** (rev 3: 5–7 h) |
Saved by rev 4: FR/ES screenshots and fixtures (≈ 2–3 h), M matrix (≈ 1 h), one review/checkpoint cycle (≈ 1–2 h agent,
≈ 1 h Mauricio), S0 already done (≈ 1–1.5 h).

## 11. R1 re-estimate — target Thu 2026-11-26
Remaining R1 work, active time, assuming the "R1 trim beyond 5b" decision:

| Block | Dev / Architect (agent) | Mauricio |
|---|---:|---:|
| 5a close: 5a PR, runbook rev 4 review, production ACF import, preview | 2–3 h | 3–5 h |
| 5b + loader (§10) | 21.5–31 h | 3–4 h |
| 5c rest, EN only: loader for Home/About/cases/testimonials/order/footer, production mode, release-day runbook | 8–12 h | 2–3 h |
| 5d-lite (EN): modal variant B, SLA removal, Contact exception evidence | 5–8 h | 2–3 h |
| Privacy route EN | 4–6 h | 3–5 h (verification gates, effective date, providers) |
| Release day (CMS load, frontend promote, EN verification) | 2–3 h read-only | 3–4 h |
| Commits/PRs, reviews (4 phases) | — | 3–4 h |
| Rework (5a showed ≈ one round per phase) | 6–10 h | 3–4 h |
| **Total** | **≈ 48.5–73 h** | **≈ 22–32 h direct** |

Agent sessions also need Mauricio (prompts, permissions): ≈ 1 h per 4 agent hours = 12–18 h. **Mauricio total
≈ 34–50 h** over the 4 weeks from 10-28 to 11-26, i.e. ≈ 8.5–12.5 h/week, inside his 15–20 h/week. Effort fits; the
risk is serialization (production window, privacy inputs, review turnaround), not hours.

Plan and **milestones** (weeks Mon–Sun):
- W1 (10-26 → 11-01): approve this spec + loader rev 2 (one review); S1 on `feat/phase-5a`; 5a PR; runbook rev 4 review.
- W2 (11-02 → 11-08): **production ACF import by Fri 11-06**; 5b Part 1 + loader EN; **combined checkpoint by Sun 11-08**.
  Mauricio: privacy inputs start.
- W3 (11-09 → 11-15): 5b Part 2, **final review by Fri 11-13**; 5c-rest and 5d-lite specs.
- W4 (11-16 → 11-22): 5c-rest EN, 5d-lite, Privacy route EN; all merged-ready by **Sun 11-22**.
- W5 (11-23 → 11-26): preview against production + local release-day rehearsal (Mon–Tue), go/no-go Wed 11-25,
  **release Thu 11-26**.

**Verdict: 2026-11-26 confirmed, conditionally.** There is no buffer week (rev 3 had one), and the trim removes ≈ 5–10 h
of agent work and one review cycle per phase, which is what makes the date possible. If the production ACF import slips
past Mon 11-09, or the 5b final review past Mon 11-16, or the "R1 trim beyond 5b" decision is not confirmed, the date
moves to **Thu 2026-12-03** (then 12-10). External items that move it regardless of agent speed: privacy verification
gates and, if required, the WPML production key / outbound access. Note: 11-26 is US Thanksgiving; US vendor support
(Vercel, Calendly) may be slow that day — keep 11-27 as the fallback release day within the same week.

## Stopping point
Only docs were changed by this revision (this spec and `phase-5c-loader.md`). No code, CMS, schema file, staging or
commit. Approval of this spec + loader rev 2 authorizes S1 and 5b Part 1; the next stops are the combined checkpoint and
the final review.
