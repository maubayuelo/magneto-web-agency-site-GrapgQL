# Phase 3 report — Locale-aware data

- Spec: `docs/specs/phase-3-localized-data.md` (Approved — 2026-10-24)
- Author: Dev · Date: 2026-10-24 · Branch: `feat/phase-3-localized-data` at `d0c09c4` (**nothing staged**)

## Status after round 3 — Phase 3 done (2026-10-24)

**Every acceptance item passes,** as amended below. `CLAUDE.md` "Current phase" is updated. Nothing is staged. Merge
precondition: the Vercel preview check (last section).

Senior Architect decision on Q3, recorded as **approved changes to the acceptance criteria**:
- **Keep FR project #550** (translation of `trepied-trepied-ca`). It's the FR positive case, and every locale now has ≥ 1 project.
- `/fr/projects` → 200 with the `[FR TEST]` hero and a grid with #550. This replaces "the empty state".
- `/fr/projects/trepied-trepied-ca` → 200 with `[FR TEST]`. This replaces "→ 404".
- The `/fr` home grid has 1 project. This replaces "renders nothing".
- The zero-projects empty state is proven by a **unit test** instead of CMS data. None existed, so I added
  `src/components/organisms/ProjectsGrid/ProjectsGrid.test.tsx` (8 tests):
  - the empty state renders on `/projects`, `/fr/projects`, `/es/projects` and `/en/projects/`;
  - nothing renders on `/`, `/fr` or `/es`;
  - the grid, not the empty state, renders with one project.

  It uses the `globalThis.React` workaround (classic-JSX Known debt), like `CalendlyButton.test.tsx`.
- Mauricio fixed page 558's `heroTitle` after "Translate independently". Backup:
  `magneto-cms-2_phase3-after-h1fix3_<time>.sql`.

Re-run (`<scratchpad>/p3/r3/`; clean `.next`; `.env.local` → `en,fr,es`; `next start -p 3100`):

| Check | Result | Evidence |
|---|---|---|
| EN SHA-256 | passed | `a9345a3b…` / `5e89fb5b…`, 7 pages / 3 projects / 43 716 B, run twice, equal to V0d (`d1.txt`, `d2.txt`) |
| Page 558 edited | passed | REST `modified` `2025-08-11T18:33:06` → `2026-10-25T03:35:55`; GraphQL `heroTitle` `[FR TEST] Projects & Case Studies` |
| Completion gate | passed (lint at baseline) | lint 149 errors / 110 warnings, 0 in the new test file · typecheck ✓ · tests 24 files / 130 · build 28/28 |
| Prerendered `[slug]` paths per locale (Q2) | passed | en: `trepied-trepied-ca`, `shamaniccas-ecommerce`, `fashion-company-ecommerce` · fr: `trepied-trepied-ca` · es: `trepied-trepied-ca` (`prerendered.txt`, from `prerender-manifest.json`) |
| `/fr/projects` | passed | 200, `lang="fr-CA"`, `<h1>` `[FR TEST] Projects & Case Studies`, grid `[FR TEST] TRÉPIED — trepied.ca`, no empty state |
| `/fr/projects/trepied-trepied-ca` | passed | 200, `<h1>` `[FR TEST] TRÉPIED — trepied.ca`, no `[ES TEST]` |
| `/fr` home grid | passed | 1 project, `[FR TEST] TRÉPIED — trepied.ca` |
| Unchanged | passed | `/es` grid 1 (`[ES TEST] …`); `/es/projects/trepied-trepied-ca` 200 `[ES TEST]`; `/projects/trepied-trepied-ca` 200, no marker |
| Hydration / console | passed | 0 / 0 on `/fr`, `/fr/projects`, `/fr/projects/trepied-trepied-ca`; server errors 0 |
| EN, locales on, vs V0 (extra) | passed | normalized HTML 8/8 identical, so the round-1 stream-order difference on the project page is gone; EN statuses identical; only `/fr/services`, `/es/services`, `/fr/contact` 200 → 404 (D2) |

Q2 is still Known debt (`AGENTS.md`). It no longer occurs locally because every locale has projects; Phase 5 acceptance must
verify prerendered paths per locale.

My CDP capture script hit a temp-profile cleanup race (`ENOTEMPTY`) after writing its results. No Chrome process was left,
and the temp dir was removed. All servers were mine on port 3100 and stopped by PID; port 3000 was never touched.

## Round 2 — Senior Architect decisions (2026-10-24) and re-check

*(Round 2 status. Q3 was resolved in round 3, above.)*

Decisions applied:
- **Q1 — resolved in the CMS by Mauricio.** The Language-box "Duplicate" silently failed for this page (twice). He then
  used WPML → Translation Management → "Projects" → French: *Duplicate content* (Spanish: nothing) → Translate
  independently. He verified it via `$wpdb`: FR page ID 558, slug `projects`, publish, same trid as EN 38. Backup:
  `magneto-cms-2_phase3-after-h1fix2_<time>.sql`. Details are in the notes section.
- **Q2 — accepted as is.** The spec'd `generateStaticParams` is kept, with no fallback code. The Known-debt line is added to `AGENTS.md`
  (now 191 lines).
- **Deviations 1 and 3 — approved.** `src/data/about.ts` stays as a future cleanup (see Issues).

Re-run (only the two checks requested; same code and build as round 1, `ENABLED_LOCALES=en,fr,es`, `next start -p 3100`):

| Check | Result | Evidence (`<scratchpad>/p3/r2/`, `r2-d*.txt`) |
|---|---|---|
| EN SHA-256 | **passed** | `a9345a3b…` / `5e89fb5b…`, 7 pages / 3 projects / 43 716 B, run twice, equal to V0d |
| `/fr/projects` → 200 | passed | 1st request 404 (the build-time 404 is cached, STALE), then 200 after regeneration; `lang="fr-CA"`; 0 server errors |
| … with the `[FR TEST]` hero | **failed** | `<h1>` = `Projects & Case Studies` (EN text) |
| … with the empty state | **failed** | the grid shows 1 project: `[FR TEST] TRÉPIED — trepied.ca` |

**Q3 — what the CMS returns now** (read-only GraphQL/REST):
- **The hero edit isn't on page 558.**
  - `pages(where:{language:"fr", name:"projects"})` → `#558, projects, publish, fr`, `heroTitle: "Projects & Case Studies"`.
  - REST `wp/v2/pages/558` → `modified: 2025-08-11T18:33:06` (the duplicate kept the EN dates), so no edit was saved to 558 after
    the duplicate. The `[FR TEST] ` hero edit is missing.
  - Possible causes: it was saved on another copy (e.g. one of the failed attempts), or ACFML's Copy mode reset the field on save.
- **An unexpected FR project translation exists.**
  - `projects(where:{language:"fr"})` → `#550 trepied-trepied-ca "[FR TEST] TRÉPIED — trepied.ca" fr publish`.
  - It wasn't there at 22:31 (round-1 probe: FR projects `[]`). Its ID falls between ES #541 and FR page #558, so it was most likely
    created by one of the failed "Duplicate" attempts.
  - Effects:
    - `/fr/projects` is no longer empty.
    - `/fr/projects/trepied-trepied-ca` would now be 200, not the expected 404 (not re-run, per the instruction).
    - The `/fr` home grid would show 1 project.
- **Ask (Mauricio, local CMS):**
  - Set the FR `projects` (558) `heroTitle` to `[FR TEST] Projects & Case Studies`, and check that `modified` changes.
  - Decide on #550: trash it to restore the planned fixture (FR 0 projects, ES 1), or keep it and have the Architect amend
    the acceptance items (FR then has projects, which also removes the Q2 condition locally).
  - Take a DB export after.
- **Code:** no change needed. I re-run the same checks (plus `/fr/projects/trepied-trepied-ca` and the `/fr` grid if #550
  stays) on request.

## Round 1 questions (kept for the record)

**Q1 — H1 is not visible to the frontend: there is no published FR `projects` page.** *(Round 2: resolved; the page now exists, see Q3.)*
Mauricio's notes say H1 was done (slug `projects`, `[FR TEST]` hero). Read-only checks at ≈22:31 found nothing:
- `pages(where:{language:"fr", name:"projects"})` → `[]`
- `pages(where:{language:"fr"})` → only `home` (#535)
- EN `projects` (#38) → `translations: []`
- REST `wp/v2/pages?slug=projects&lang=fr` → `[]`
- `http://magneto-cms-2.local/fr/projects/` → 301 to the EN `/projects/`

ES H2 is visible and published (#541).
- **Most likely:** the FR duplicate was saved as a draft, or was created from a different page.
- **Not visible anonymously:** drafts and private posts.
- **Consequence:** `/fr/projects` → **404**, which is correct under D2 for today's data. The acceptance item
  "`/fr/projects` → 200 with the empty state and the `[FR TEST]` hero" is therefore **not met**.
- **Ask:** Mauricio checks Pages → Projects → Français in WP admin (status *Published*, slug `projects`).
- **No code change is needed.** After he fixes it, I re-run only that check: a running server picks it up within the 60 s revalidate window, with no rebuild.

**Q2 — A3 is false on Next 15.5: one locale with zero projects stops `[slug]` prerendering for all locales.** *(Round 2: accepted as Known debt.)*
- **What happens:** `generateStaticParams({ params: { locale } })` returns the right slugs (debug run: `en` 3, `fr` `[]`, `es` 1). But
  `node_modules/next/dist/build/static-paths/app.js` (`generateRouteStaticParams`) passes the parent
  `{ locale: 'fr' }` through **without `slug`** when the child returns `[]`. Then
  `hadAllParamsGenerated` is false, and **no** `[slug]` path is prerendered for any locale.
- **Build output** with `ENABLED_LOCALES=en,fr,es`: `● /[locale]/projects/[slug]` with no paths. V0 had 3 EN plus "+6 more".
- **Runtime is correct:** EN 200, `/es/projects/trepied-trepied-ca` 200 with `[ES TEST]`, `/fr/…` 404. Pages
  render on demand (ISR, revalidate 60).
- **Side effect:** in that build only, the EN project page's raw HTML streams `<head>` metadata after the body
  (Suspense placeholders) instead of before. The visible content is identical (diff in Evidence).
- **Production is unaffected:** `ENABLED_LOCALES` is unset there. With EN only, the build prerenders the 3 EN slugs as before, and V0(a)/(b)/(c) are identical.
- **Options** (I kept the spec'd code, option A, and did not improvise):
  - **A (current) — accept until every enabled locale has ≥ 1 project** (Phase 5). There is no code change.
    The acceptance item "3 EN / 0 FR / 1 ES paths" stays unmet in local all-locales builds.
  - **B — fall back for an empty locale** to the EN slug list. Those paths prerender as 404s, which
    become 200 within 60 s once the translation exists. Every locale then has params again, so EN and ES
    prerender. This is about a 3-line change in `[slug]/page.tsx`; it breaks "only slugs that exist in that locale".
  - **C — return all `{ locale, slug }` pairs from every call.** The merge `{...parent, ...item}` lets an item's
    `locale` override the parent's. This relies on an implementation detail; not recommended.
  - My recommendation is **A** now; B if local prerendering matters before Phase 5.

## Result
**Done (round 3).** Every acceptance item passes as amended. Rounds 1–2 below are kept for the record. Merge after the Vercel preview check.
- **Every CMS read is per locale:**
  - FR/ES pages without a translation → 404.
  - Images come from the EN original.
  - Locales don't mix.
  - EN output is unchanged.
- **Not met:** two acceptance items depend on Q1 (CMS data) and Q2 (Next behaviour).
- **Gate:** passes, with lint at the accepted baseline (now lower).
- **Merge precondition (Mauricio):** the Vercel preview check in the release process; see the last section.

## Changes (all unstaged)
New:
- `src/i18n/wp.ts`:
  - `toWpLanguage(locale)`
  - `wpLocaleVars(locale)` → `{ language, mediaOriginal: locale !== 'en' }`
- `src/utils/wp-media.ts`:
  - `MEDIA_NODE_FIELDS`
  - `mediaOriginalFields(subfields)`: the `databaseId languageCode translations @include(if: $mediaOriginal) {…}` helper
  - `resolveOriginalMedia`, which keeps the locale `altText`
  - `resolveMediaWrapper`, for the usual `{ node }` wrapper
- `src/utils/wp-page.ts`: `getPageExists(name, locale)`, wrapped in `cache()`, for the home 404 guard. Errors propagate.
- `docs/adr/0004-localized-data.md`: D1–D4 as approved. D4 references ADR 0003 D2.
- Tests:
  - helpers: `src/i18n/wp.test.ts`, `src/utils/wp-media.test.ts`, `src/utils/wp-page.test.ts`
  - fetchers: `{about-magneto,contact,packages,projects,services}/api.test.ts`, and `{AboutSection,FeaturedServices,FinalCTASection,Footer,Hero,Testimonials}/api.test.ts`

Pages (`src/app/[locale]/`): each reads `locale` from `params` and narrows it with `isLocale`, falling back to `DEFAULT_LOCALE` like the layout. Each fetch now takes the locale.
- **`page.tsx` (home):**
  - `getPageExists('home', locale)` → `notFound()`; a CMS error keeps today's fallbacks.
  - Projects come from `getProjects(locale)`.
  - `locale` is passed to `HeroLoader`, `AboutSection`, `FeaturedServicesLoader` and `getHomeTestimonials`.
- **`about-magneto`, `contact`, `packages`, `services` (`api.ts` + `page.tsx`):**
  - Each `api.ts` uses `pages(where:{language, name})`, returns `null` on `nodes: []`, and resolves media.
  - Each `page.tsx` calls `notFound()` on `null`.
  - `generateMetadata` passes the locale where it fetches (about, contact, packages); its text is unchanged.
  - In `services/page.tsx`, the 404 check sits outside the render `try`, so its `catch` can't swallow it.
- **`projects/api.ts`:**
  - Localized `getProjectsPageData`.
  - New `getProjects(locale)`: `GET_PROJECTS` with `wpLocaleVars`, mapped to `ProjectItem[]`. It's shared by home, `/projects` and `[slug]` params, so those pages no longer call `fetchWPGraphQL` inline.
- **`projects/page.tsx`:** 404 when the page is missing; with 0 projects, the existing empty state (F9).
- **`projects/[slug]/api.ts`:**
  - P-B: `projects(first:1, where:{language, name:$slug})`.
  - `getProjectBySlug(slug, locale)` stays wrapped in `cache()`.
  - Media is resolved.
- **`projects/[slug]/page.tsx`:**
  - Locale-aware.
  - `mappedProject: ProjectData`, with no cast; list items use `?? ''`, which renders the same as `null`.
  - `generateStaticParams({ params })` → `getProjects(locale)`.
- **`projects/[slug]/api.test.ts`:** updated (5 tests).
- **`layout.tsx`:** passes `locale` to the lead-magnet, final-CTA and footer sections. Nothing else changed.

Components (`src/components/organisms/`):
- **`Hero/api.ts`:** `getPageHero(name, locale)` with GraphQL variables, plus `heroPageName` (`'/'` → `home`).
  The deprecated `pageBy` and `getHomeHero` are gone.
- **`Hero/HeroLoader.tsx`:** required `locale` prop; output unchanged.
- **`Hero/index.tsx`:** `loadHomeHero` removed.
- **`Hero/HeroWithData.tsx`:** deleted.
- **`AboutSection`, `FeaturedServices` (+ loader), `Testimonials`:** localized `api.ts`; icons and thumbs
  resolved; `locale` prop. `Testimonials/TestimonialsLoader.tsx` deleted.
- **`FinalCTASection`, `Footer`, `LeadMagnetSection`:** localized `api.ts` (which returns `{}` when the locale has no `home` page)
  and a required `locale` prop (in `types.ts` / the loader). The client fallback fetches carry the locale in the variables.
- **`Header/index.tsx`:** the logo `useEffect` fetch is removed; it never changed the output (proof below).
  `Header/api.ts` is deleted, and `Header/types.ts` loses the unused `HomeHeader` and `ImageNode` types.
- **`PackagesGrid/index.tsx`:** `PackagesGridWithData` removed; `PackagesGrid/api.ts` and `PreFooter/api.ts` deleted.
- **`ProjectDetail/index.tsx`:** the gallery map is typed `ProjectGalleryItem`, and the dead `typeof img === 'string'`
  branches are removed.

Other:
- **`src/data/projects.ts`:**
  - `ProjectData` now has the real shape (`id: string`; `ProjectGalleryItem` gallery; `string[]` lists; unused fields dropped).
  - `GET_PROJECTS` declares `$language: String`, `$mediaOriginal: Boolean = false` and `where: { language }`. Omitting both gives
    the EN list, as before, so `sitemap.xml` is untouched.
- **`AGENTS.md`:**
  - "Where text lives" now describes the fetch method.
  - Known debt: the `ProjectData` and `homePackages`/`homePrefooter` lines are removed.
  - Round 2: the Q2 prerender line is added.
  - 191 lines.
- **`CLAUDE.md`:** "Current phase" set to Phase 3 done (round 3).
- **`src/components/organisms/ProjectsGrid/ProjectsGrid.test.tsx`** (new, round 3): the zero-projects empty-state test.
- **`docs/reports/phase-3-mauricio-notes.md`:** folded in below, then deleted.

## Gate (clean `.next`, `.env.local` as is → `en,fr,es`)
| Check | Result | Notes |
|---|---|---|
| EN SHA-256 after H1/H2 (V0d) | passed | `a9345a3b…` / `5e89fb5b…`, 7 pages / 3 projects / 43 716 B, run twice, equal to V0d |
| lint | failed (baseline only, as before) | **149 errors / 110 warnings** (cap 164 / 118). `no-explicit-any` 113 → 98. 0 problems in new files. Only decreases per file |
| typecheck | passed | no `as unknown as` in `[slug]/page.tsx` |
| tests | passed | 23 files / 122 tests (was 9 / 77), per file below |
| build | passed | `=en,fr,es` 23/23 · `ENABLED_LOCALES=` 14/14 (3 EN `[slug]` paths) |
| EN byte-identical, locales off | passed | status (27 URLs + proxy), normalized HTML 8/8, meta: identical to V0. Screenshots 24/24 identical (see Evidence) |
| EN byte-identical, locales on | partially | status of EN URLs and 7/8 HTML identical. The EN project page differs only in stream order (Q2) |
| FR/ES content | partially | all pass except `/fr/projects` → 404 (Q1) |
| media from EN | passed | |
| no locale mixing (A1) | passed for content; build-output item not met (Q2) | |
| hydration | passed | 0 on `/`, `/fr`, `/es`, `/fr/projects`, `/es/projects/trepied-trepied-ca` |
| no URI lookups | passed, with a note | see Evidence and Deviation 3 |
| dead code gone | passed | greps below |
| visual (routes · viewports · locales) | passed | EN 8 routes × 3 widths vs V0; FR/ES 4 routes × 3 widths for review |
| Vercel preview (release process) | not run | Mauricio, before merge |

Tests per file (new or updated):

| File | Tests |
|---|---|
| `i18n/wp.test.ts` | 6 |
| `utils/wp-media.test.ts` | 7 |
| `utils/wp-page.test.ts` | 3 |
| `projects/[slug]/api.test.ts` | 5 (updated) |
| `projects/api.test.ts` | 4 |
| `about-magneto/api.test.ts` | 3 |
| `Hero/api.test.ts` | 4 |
| `contact/api.test.ts`, `packages/api.test.ts`, `services/api.test.ts` | 2 each |
| `Footer`, `FinalCTASection`, `Testimonials`, `FeaturedServices`, `AboutSection` `api.test.ts` | 2 each |

Every fetcher is covered except `LeadMagnetSection/api.ts`. Its REST download lookup needs a second mock; the query and
variables follow the same pattern.

## Evidence (all in `<scratchpad>/p3/`)
**V0** (HEAD `d0c09c4`, worktree, before H1/H2): `v0/` (`off/`, `on/`, `shots-off/`, `d-run*.txt`, `SUMMARY.md`).

**After, locales off** (`after/off/`, `after/shots-off/`):
- `diff` against V0: status, `html-md5.txt`, `projects-meta.txt` and `proxy.json` are all identical.
- Screenshots: 22/24 matched on the first pass. `home@768` and `packages@768` differed (11 226 and 34 872 px). I retook
  both three times, and all three retakes are pixel-identical to V0 (`after/cmp{1,2,3}-*`), so it was capture timing
  (late layout/font). The HTML was identical.
- Note: at 375 px the Chrome CLI crops a wider layout (minimum window width), in V0 and after alike. This is a
  capture artifact, not a page bug.

**After, `en,fr,es`** (`after/on/`, `after/fres/`, `after/fres-checks.txt`):
```
/fr  200 lang=fr-CA  "[FR TEST] Attract More Aligned Clients Online" ✓  no [ES TEST] ✓
/es  200 lang=es     "[ES TEST] Attract More Aligned Clients Online." ✓  no [FR TEST] ✓
/    200 lang=en     neither marker ✓
404: /fr/services /fr/packages /fr/about-magneto /fr/contact /es/services /es/projects /es/contact ✓
/fr/projects 404 ✗ (Q1)        /fr/projects/trepied-trepied-ca 404 ✓
/es/projects/trepied-trepied-ca 200, <h1> "[ES TEST] TRÉPIED — trepied.ca" ✓
home grid: / 3 projects · /es 1 ("[ES TEST] TRÉPIED — trepied.ca") ✓ · /fr no grid section, no crash ✓
```
- **Status changes against V0 `on/status.txt`:** only `/fr/services`, `/es/services` and `/fr/contact` changed, from 200 (EN content under `/fr`) to 404 (D2).

**Media** (`fres-checks.txt`):
- On `/fr` and `/es`, the hero image, hero background, final-CTA background and footer icon all have `src` and `srcset` equal to `/`.
- `alt` is equal to EN, as expected today (F5).
- **Size list:** the SSR `srcset` only holds next/image 1x/2x entries; the CMS size list reaches `WpResponsiveImage` through the RSC
  props.
  - In the full page payloads, the background file-URL sets (9) and size-name sets (16) are identical for EN, FR and ES.
  - The FR payload contains the EN-only `mobile-scale`/`tablet-scale`/`desktop-scale` sizes.
  - The FR copy (#53) has 7 sizes and the EN original (#52) has 11, so FR now uses the EN list.

**A1** (`after/a1.txt`, one `next start`):
- `/ /fr /es / /fr`, three passes: STALE, then STALE again after 65 s (regeneration), then HIT 10 s later.
- Every response keeps its own marker: `/` none, `/fr` FR only, `/es` ES only.
- Server errors: 0.

**Hydration and network** (`after/net-on.json`, `after/net-off.json`, `net-before.json`):
- 0 hydration messages and 0 exceptions on `/`, `/fr`, `/es`, `/fr/projects`, `/es/projects/trepied-trepied-ca`.
- The only console line is the browser's own 404 resource log on `/fr/projects` (Q1).

**Header logo fetch, before and after (D5 proof):**
- **Browser requests to `/api/wp-graphql`:**
  - V0 (HEAD worktree): `/`, `/services` and `/projects/trepied-trepied-ca` each call `HomeHeader` + `LeadMagnetSection`.
  - After: `LeadMagnetSection` only, with `{language:"en", mediaOriginal:false}`.
  - `/fr` sends `language:"fr"`.
- **Output:** EN HTML 8/8 and screenshots 24/24 identical. The removed effect set `logoUrl` to the value it already held.

**URI-lookup grep** (`git grep -n -E "pageBy\(|page\(id:|idType: ?(URI|SLUG)" -- src`): 0 hits.

**`fetchWPGraphQL(` outside an `api.ts` / `wp-page.ts`:**
- `src/app/sitemap.xml/route.ts` (allowed).
- `src/app/[locale]/layout.tsx:35` (`generalSettings`, site metadata, out of scope; see Deviation 3).
- `src/data/about.ts:18` (dead; see Issues).

**Dead-code greps** (`grep -rn <symbol> src --include=*.ts --include=*.tsx | wc -l`):
```
getHomePackages 0 · PackagesGridWithData 0 · homePrefooter 0 · HeroWithData 0 · loadHomeHero 0
getHomeHero 0 · TestimonialsLoader 0 · getHomeHeader 0
```
(`src/components/organisms/Hero/README.md` still mentions `HeroWithData`/`loadHomeHero`; it isn't on the
spec's file list, so it's listed under Issues.)

**Build `[slug]` paths:**
- `after/build-off.txt`: 3 EN paths.
- `after/build-on.txt`: none (Q2).
- `after/on/html` vs `v0/on/html` for `projects_trepied-trepied-ca`: the same elements in a different stream order.

**FR/ES screenshots for review** (`after/shots-locales/`): `/fr`, `/es`, `/es/projects/trepied-trepied-ca` and
`/fr/projects` (404 page) at 375/768/1440.

Every server and Chrome instance was mine on port 3100 and was stopped by PID. Worktrees were removed, and port 3000 was never touched.
The CMS was only read; `cms.magnetomarketing.co` was never queried; `.env.local` was not edited.

## H1/H2 — Mauricio's notes (folded in from `phase-3-mauricio-notes.md`, now deleted)
- **Spec deviations approved by the Senior Architect:**
  - The backups folder is `~/Documents/projects/magneto/backups/`, not `~/magneto-backups`.
  - Translations weren't made with WPML's "+" button. Method: EN item → Language box → **Duplicate** (one language)
    → open the copy → **Translate independently** → edit in the native editor. The EN items were closed without Update.
- **Timeline:**
  - 22:20 before export `magneto-cms-2_phase3-before_20261024-2220.sql`
  - H1 (FR `projects`, slug `projects`, `[FR TEST] ` hero)
  - H2 (ES `trepied-trepied-ca`, slug confirmed, no WPML suggestion, `…/es/project/trepied-trepied-ca/`)
  - 22:28 after export `magneto-cms-2_phase3-after_20261024-2228.sql`
- **A2 slug problem:** none. Unexpected: nothing reported. (H1 isn't visible to the frontend; see Q1.)
- **H1 fix (round 2, from the Senior Architect):**
  - The Language-box "Duplicate" silently failed for `projects` (twice).
  - Mauricio created the FR page via WPML → Translation Management → "Projects" → French: *Duplicate content* (Spanish: nothing)
    → Translate independently → `heroTitle` "[FR TEST] …".
  - `$wpdb`: FR page 558, slug `projects`, publish, same trid as EN 38.
  - Backup: `magneto-cms-2_phase3-after-h1fix2_<time>.sql`.
  - The frontend doesn't see the hero edit yet, and an FR project #550 appeared (Q3).
- **Note for Phase 5:** the WPML **Language-box "Duplicate" is unreliable**; it silently failed here, and the failed attempts may
  leave stray translations (#550?). The Phase 5 WP-CLI loader must not depend on it. It should create translations explicitly
  and verify each one by reading it back by language + slug.

## Deviations from the spec
Round 2: 1 and 3 approved by the Senior Architect. 2, 4 and 5 not reviewed separately.

1. **`$mediaOriginal` is declared only where images are selected.** WPGraphQL rejects declared-but-unused variables
   (`Variable "$mediaOriginal" is never used.`, tested read-only), but ignores undeclared extra variables.
   - Every fetcher still sends `wpLocaleVars(locale)`, so the variables the tests assert are as specified.
   - The queries without images declare only `$language`: AboutSection, LeadMagnet and the projects page.
   - Recorded in ADR 0004 Consequences.
2. **`getProjects(locale)` lives in `src/app/[locale]/projects/api.ts`.** The spec names `getProjects(locale)` but not where it goes; that file is on the list. It is shared by
   home, `/projects` and `[slug]` params, which removes the inline `fetchWPGraphQL` calls from those pages.
3. **"Every `fetchWPGraphQL(` call is in an `api.ts`…" isn't fully met.** Two pre-existing callers aren't on the spec's F7 list or the file list:
   - `layout.tsx` (`generalSettings` for metadata, Phase 7 SEO);
   - `src/data/about.ts` (dead).

   I left both untouched.
4. **`mediaOriginalFields(subfields)` helper added** next to the specified `MEDIA_NODE_FIELDS`. It keeps each selection's own
   subfields, as the spec requires, instead of one fixed field list.
5. **`ProjectDetail` gallery `src={img.image as string}`:** a plain cast, not `as unknown as`. It keeps the old behaviour for a
   `null` image (none exist today) rather than changing output.

## Issues found (not fixed)
- `src/data/about.ts` is dead code (Senior Architect: future cleanup). Nothing imports it, it queries a non-existent `aboutTexts` field, and it calls
  `fetchWPGraphQL` outside an `api.ts`.
- `src/components/organisms/Hero/README.md` documents the removed `HeroWithData`/`loadHomeHero`.
- `Testimonials/api.ts` `HomeTestimonialsQueryResult` still describes the old `page { … }` shape. It's unused, and I left it as is.
- The AGENTS.md lint baseline (164 / 118) could be lowered to the measured **149 / 110**. I didn't edit it, because that line isn't on the
  spec's AGENTS.md list.
- `projects/[slug]/not-found.tsx` still links `/portfolio` (known since Phase 2).

## Proposed commits (nothing staged; in order)
1. `feat(i18n): locale → WordPress variables and EN-original media helpers`
   - `src/i18n/wp.ts`, `src/i18n/wp.test.ts`
   - `src/utils/wp-media.ts`, `src/utils/wp-media.test.ts`
   - `src/utils/wp-page.ts`, `src/utils/wp-page.test.ts`
2. `feat(i18n): fetch every page and project in the request locale, 404 on missing translations`
   - `src/data/projects.ts`
   - `src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`
   - `src/app/[locale]/{about-magneto,contact,packages,projects,services}/{api.ts,page.tsx}`
   - `src/app/[locale]/{about-magneto,contact,packages,projects,services}/api.test.ts`
   - `src/app/[locale]/projects/[slug]/{api.ts,api.test.ts,page.tsx}`
   - `src/components/organisms/Hero/{api.ts,api.test.ts,HeroLoader.tsx,index.tsx}`, `…/Hero/HeroWithData.tsx` (deleted)
   - `src/components/organisms/{AboutSection,FeaturedServices,FinalCTASection,Footer,Testimonials}/{api.ts,api.test.ts}`
   - `src/components/organisms/AboutSection/index.tsx`
   - `src/components/organisms/FeaturedServices/FeaturedServicesLoader.tsx`
   - `src/components/organisms/FinalCTASection/{FinalCTASectionLoader.tsx,index.tsx,types.ts}`
   - `src/components/organisms/Footer/FooterLoader.tsx`
   - `src/components/organisms/LeadMagnetSection/{api.ts,index.tsx,types.ts}`
   - `src/components/organisms/Testimonials/TestimonialsLoader.tsx` (deleted)
   - `src/components/organisms/ProjectDetail/index.tsx`
   - `src/components/organisms/ProjectsGrid/ProjectsGrid.test.tsx` (round 3)
3. `refactor(cms): remove dead CMS fetches (Header logo, homePackages, homePrefooter)`
   - `src/components/organisms/Header/{index.tsx,types.ts}`, `…/Header/api.ts` (deleted)
   - `src/components/organisms/PackagesGrid/index.tsx`, `…/PackagesGrid/api.ts` (deleted)
   - `src/components/organisms/PreFooter/api.ts` (deleted)
4. `docs(phase-3): ADR 0004, agent map, phase report and current phase`
   - `docs/adr/0004-localized-data.md`, `AGENTS.md`, `CLAUDE.md`
   - `docs/specs/phase-3-localized-data.md`, `docs/reports/phase-3-localized-data.md`
   - `docs/reports/phase-3-mauricio-notes.md` (deleted; it was never committed, so there's nothing to stage)

Use `git add -A <paths>` so the deletions are staged. Commit 2 is large because the `locale` argument is a required
type, so the fetchers and their callers have to change together.

## Merge precondition (Mauricio) — release process (`docs/ai/WORKFLOW.md`)
On the PR's Vercel preview, with `ENABLED_LOCALES` unset:
- the main routes → 200
- `/esto-no-existe` and `/projects/no-existe` → 404
- one project page → 200
- `/fr` → 404
- the EN home shows `Attract More Aligned Clients Online`

Record the result in the PR before merging.

## Time
- **Dev:**
  - V0 ≈ 15 min (22:00–22:15).
  - Implementation plus checks ≈ 25 min of wall time (22:30–22:55, from file timestamps), mostly builds.
  - ≈5 min went to the Q2 investigation (Next source).
- **Mauricio:** H1/H2 22:20–22:28, per his notes, plus the H1 fix (time not recorded).
- **Dev, round 2:** ≈ 10 min (two checks, one ISR window, docs).
- **Dev, round 3:** ≈ 15 min (gate, prerender check, FR checks, unit test, docs).
