# Phase 4 report — UI microcopy dictionaries

- Spec: `docs/specs/phase-4-ui-microcopy.md` (Approved 2026-10-25, amendments 1–3) · ADR: `docs/adr/0005-ui-dictionaries.md`
- Author: Dev · Branch: `feat/phase-4-ui-microcopy` (from `master` `1bb704b`) · Date: 2026-10-25
- Evidence: `<scratchpad>/p4/` =
  `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/3f8144d7-33fc-47ed-9d3a-a358d2067960/scratchpad/p4/`

**Status: T0–T8 done; AC-11 passed on the PR preview; merged, promoted and verified on production (2026-10-25).** C1 was approved on 2026-10-25 by Mauricio and the Senior Architect,
with decisions: `format.ts` (a), required `locale` props, the Footer prop in `types.ts`.
- AC-11 (Vercel preview) **passed**, 11/11 URLs (details under AC-11 below).
- Live production after the promote **passed**, 11/11 URLs, and the new build is confirmed ("Production verification" below).
- The new `/esto-no-existe` look was **approved by Mauricio on 2026-10-25** (AC-5).
- Deviations 1–3 were accepted on 2026-10-25. The FR/ES-only popup labels (deviation 2) are recorded as minor debt.
- Nothing is staged or committed.

The final results are in **"T4–T8 and final verification"** below. The C1 section is kept as it was reported.

---

## Checkpoint C1 (after T0–T3)

### Result
**AC-2 passed.**
- 130/130 existing tests, unmodified, plus 137 new T1 tests.

**AC-3 passed in both builds.**
- Locales off and `en,fr,es` + override.
- Statuses, the build route table, normalized HTML (9 routes) and the metadata extract are identical to V0.
- Screenshots 27/27 pixel-identical. With locales off, that is against a V0 rerun; the original V0 capture has
  one image outlier, explained below.

**Lint and typecheck** (for information):
- typecheck is clean;
- lint is 148 errors / 110 warnings vs 149 / 110 at V0 (−1, explained). No new message.

### Pre-flight
- **Spec and ADR:** the spec is Approved and ADR 0005 is Accepted.
- **`.env.local` targets the local CMS:** `NEXT_PUBLIC_WORDPRESS_API_URL`, `NEXT_PUBLIC_WORDPRESS_URL` and
  `WORDPRESS_URL` all point to `http://magneto-cms-2.local`, which answered 200.
  - `ENABLED_LOCALES=en,fr,es`, `DISABLE_SMTP=1`.
  - `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` and `ALLOW_UNTRANSLATED_LOCALES` are absent.
  - Values were not printed, and `.env.local` was not edited.
- **Repo:** `master` = `origin/master` = `1bb704b`, and the working tree was clean.
  - `git diff 8065eae 1bb704b -- src` is empty (only docs), so V0 was taken at `8065eae` as the spec says.

### T0: V0 capture (`8065eae`)
- **Method:** throwaway worktree `<scratchpad>/p4/wt-v0`, `npm ci`, `.env.local` symlinked.
  - Each build: clean `.next`, `next build`, then `next start -p 3100`.
  - The two V0 builds: `ENABLED_LOCALES=` (empty, in the shell) and `=en,fr,es`.
- **Scripts** (in `<scratchpad>/p4/`):
  - `run.sh`: build, start, capture, stop by PID;
  - `cap.mjs`: statuses + `Location`, normalized HTML, metadata extract, raw 404 HTML;
  - `cdp.mjs`: headless Chrome over the DevTools protocol, for the hydrated 404 DOM and screenshots at
    375×812, 768×1024 and 1440×900;
  - `pngdiff.mjs`: pixel diff via `sharp`;
  - `fingerprint.mjs`: the EN table, see T1.
- **Normalization:** as in Phases 2 and 3. `<script>`, `<link>` and `/_next/static/*` hashes are removed, and
  the build-ID comment is replaced.

V0 results:
- **(a) Statuses:** 33 URLs + the proxy, same as the Phase 2 V1 table.
  - With locales on, `/fr`, `/es`, `/fr/projects`, `/fr/projects/trepied-trepied-ca` and
    `/es/projects/trepied-trepied-ca` are 200.
  - `/fr/services`, `/es/services` and `/fr/contact` are 404 (Phase 3 D2).
- **(b) and (c):** normalized HTML and the head/metadata extract for the 7 EN routes + the 2 other project pages.
- **(d) 404s,** the 8 URLs from the spec:
  - Raw HTML is the `__next_error__` shell with `<title>Magneto CMS</title>`, as in E2.
  - After hydration, `lang` is `en` everywhere except `/fr/*` (`fr-CA`), and the title is
    `404: This page could not be found.` or `Project Not Found`.
  - Robots is `["index, follow","noindex"]`. The only console message is the document's own
    `Failed to load resource … 404`.
- **(e) Screenshots:** 27 per build (the 7 routes + `/projects/no-existe` + `/esto-no-existe`, × 3 widths).
  Taken locales off and also locales on, so the on build has a like-for-like baseline (the switcher is in the
  header).

Build route table, V0: `● /[locale]` and its 5 page routes, plus `● /[locale]/projects/[slug]` with 3 slugs,
`ƒ /[locale]/[...rest]`, `○ /_not-found`, `ƒ /api/wp-graphql`, `○ /robots.txt`, `○ /sitemap.xml`. With
`en,fr,es`, the FR/ES variants are added (21 locale paths).

### T1–T3: what changed (diff summary)
`git status`: 19 files modified, 9 new files. Nothing staged. Totals: `+139 −74` in modified files.

**New (T1)**
| File | What |
|---|---|
| `src/i18n/dictionaries/en.ts` | 115 keys (§1a + §1b), plain object without `as const`, byte-exact EN values |
| `src/i18n/dictionaries/fr.ts`, `es.ts` | `fr: Dictionary` / `es: Dictionary`, every value `"[FR TODO] "` / `"[ES TODO] "` + the EN value (generated mechanically from `en.ts`, so keys and `{placeholders}` match) |
| `src/i18n/dictionary.ts` | `type Dictionary = typeof en` · `getDictionary` · `format` · `formatParts` · `flattenDictionary` · `findTodoKeys` · `assertLocalesReady` |
| `src/i18n/I18nProvider.tsx` | `'use client'` · `I18nProvider` (no DOM) · `useI18n()` (EN fallback outside a provider). Imports only `en.ts` |
| `src/i18n/dictionaries/en.test.ts` | EN fingerprint, 115 keys + exact key set (116 tests) |
| `src/i18n/dictionary.test.ts` | parity, non-empty leaves, placeholders, `getDictionary`, `format`, `formatParts` (incl. SSR markup equality with the original footer JSX), readiness guard (18 tests) |
| `src/i18n/I18nProvider.test.tsx` | provider value, EN fallback, renders no DOM (3 tests) |

**Modified**
- **T1:** `.env.local.example` gets a commented `# ALLOW_UNTRANSLATED_LOCALES=1`, with a comment: local builds
  only, never in Vercel, checked as `'1'`, `next dev` not affected.
- **T2:** `[locale]/layout.tsx`:
  - the `I18nProvider` with only this locale's dictionary;
  - `LanguageSwitcher label={t.header.languageSwitcher}`;
  - `generateMetadata({ params })` uses `t.meta.site.*` as its fallbacks;
  - the guard in `generateStaticParams`:
    ```ts
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      assertLocalesReady(getEnabledLocales(), { allowUntranslated: process.env.ALLOW_UNTRANSLATED_LOCALES === '1' });
    }
    ```
- **T2:** `generateMetadata` in `page.tsx`, `about-magneto`, `contact`, `packages`, `projects` and
  `projects/[slug]` (+ `services`) reads `t.meta.*` / `t.projectNotFound.metaTitle`.
  - `page.tsx`, `projects/page.tsx` and `services/page.tsx` now take `{ params }`.
  - The CMS-first logic (about, services REST) is unchanged.
  - Example (`projects/[slug]/page.tsx`): `` title: `${project.title} | Magneto Projects` `` →
    `title: format(t.meta.project.title, { title: project.title })`.
- **T2:** `LanguageSwitcher/types.ts`: only the `TODO(phase-4)` comment is removed.
- **T3, server components and server page bodies:**
  - `Footer` + `FooterLoader`: copyright via `formatParts`, social-icon alt fallback. Example:
    ```diff
    -            Magneto Marketing - All Rights Reserved, {new Date().getFullYear()}.
    +            {formatParts(t.footer.copyright, { year: new Date().getFullYear() })}
    ```
  - `FeaturedServices` (+ Loader, `api.ts` fallback title only), `ServiceCard`.
  - `ServicesList`: the badge.
  - `services/page.tsx`: the error block.
  - `ProjectDetail`: column headings, check-icon alt, gallery alt via `format`, "View live site",
    "← Back to Projects".
  - `HeroLoader`: the `'Hero Image'` alt.
  - Server page bodies: home `title={…home.recentProjects}`; about `LinkedIn Icon` alt and the CTA text.
- **Not touched yet** (T4–T6): client components, both `not-found.tsx` files, every `href`, `calendly.ts`,
  `AGENTS.md`.

### AC-2: tests (`npm test -- --run`)
**Passed:** 27 files, 267 tests.
- Existing: 24 files, 130 tests, every one passing, and no existing test file modified (`git status` lists none).
- New:

| File | Tests |
|---|---|
| `src/i18n/dictionaries/en.test.ts` | 116 |
| `src/i18n/dictionary.test.ts` | 18 |
| `src/i18n/I18nProvider.test.tsx` | 3 |

**AC-4 groundwork (EN fingerprint):**
- The table has 115 keys and was generated by `<scratchpad>/p4/fingerprint.mjs` from the **V0 sources**:
  - worktree `8065eae`, one regex per key on the original component or page;
  - for the 404 strings, Next's `builtin/not-found.js`;
  - not from `en.ts`.
- Transforms applied:
  - `&apos;` → `'`; `—` → `—`;
  - `{new Date().getFullYear()}` / `${i + 1}` / `${project.title}` / `${res.status}` → `{year}` / `{n}` / `{title}` / `{status}`.
- First run: 2 mismatches, both caused by my extractor (the menu ternary's `src` was matched instead of its
  `alt`). I fixed the regexes and regenerated: 115/115 match `en.ts`.

### AC-3: EN byte-identity, both builds
The C1 code is built in a second throwaway worktree (`wt-c1`, `master` + the working-tree `src/` synced; `diff
-r` identical, `npm ci`). The repo's own `.next` is untouched (BUILD_ID still `GdgelMczjUyCIzua04nkq`).

| Check | `ENABLED_LOCALES=` | `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1` |
|---|---|---|
| build | exit 0 | exit 0 (guard bypassed by the override, as designed) |
| route table (names + ○/●/ƒ markers) | identical to V0 | identical to V0 |
| V0(a) statuses, 33 URLs + proxy body | identical | identical |
| V0(b) normalized HTML, 7 routes + 2 projects | **9/9 identical** | **9/9 identical** |
| V0(c) head/metadata extract, same 9 | **9/9 identical** | **9/9 identical** |
| V0(e) screenshots, 27 | **27/27 identical** vs V0 rerun (24/27 vs the first V0 capture, see below) | **27/27 identical** |

**The `/projects` screenshot outlier (locales off).**
- Against the first V0 capture, `projects@375/768/1440` differed in one region: the first card's image
  (TRÉPIED, bbox x 122–496 at 1440; 30 614 / 26 116 / 13 223 px).
- The HTML was identical, and the crops look the same to the eye.
- I retook it 3× on the same C1 build, as the spec says: the same pixel counts every time.
- To separate code from environment, I rebuilt **V0** (`8065eae`, unchanged) and shot it again (`v0/off2`):
  - the V0 rerun differs from the first V0 capture in exactly the same 3 shots, by the same pixel counts;
  - the V0 rerun's normalized HTML is identical to the first capture;
  - **C1 vs the V0 rerun is 27/27 identical.**
- So the first V0 capture of that image was the outlier (first render of that image after the first build).
  It is not a code effect. The locales-on run (V0 and C1 both taken later) is 27/27 with no retake.
- Evidence: `v0/off/shots`, `v0/off2/shots`, `c1/off/shots`, `c1/off/reshoot{1,2,3}`,
  `c1/crop-projects-{v0,c1}.png`.

**404s (not in AC-3; recorded because T2 touches metadata):**
- Locales off: raw 404 heads, statuses and the hydrated 404 DOM are all identical to V0.
- Locales on: EN 404s are identical. The FR/ES ones differ only where T2 localizes on purpose:
  - `/fr/esto-no-existe`, `/fr/projects/no-existe`, `/es/esto-no-existe`: the layout's description fallback is
    now `[FR TODO] …` / `[ES TODO] …` in `description` / `og:` / `twitter:`. The local WordPress
    `generalSettings.description` is empty, so the fallback already showed in V0.
  - `/fr/projects/no-existe`, after hydration: title `[FR TODO] Project Not Found` (the `!project` branch of
    `generateMetadata`, spec §2.3.5).
  - The raw `<title>` is still `Magneto CMS` everywhere. The custom 404 metadata is T5.

### Lint and typecheck (for information)
- `npm run typecheck`: **passed** (exit 0).
- `npm run lint`: **148 errors / 110 warnings** (exit 1, as at the baseline). V0 in the same session was
  149 / 110.
  - Per-message diff V0 → C1: the only change is **−1 error**, `react/no-unescaped-entities` in
    `services/page.tsx`. The services error text's raw `'` is now a dictionary value.
  - **No new error or warning.**
  - New files: 0 errors, 0 warnings, no `any`. `@next/next/no-html-link-for-pages` is still 30 (D1).
  - The AGENTS.md baseline line is T8, and will use the number measured after the phase.

### Deviations and notes, for review
1. **Server page bodies are done in T2/T3.** The T3 task line in the spec doesn't name them, but §1a lists them
   and the files are in "Files the Dev may touch": home `Recent Projects`, about `LinkedIn Icon` and
   `Book a Free Strategy Call`, the services error block. They are server-rendered, so they belong before C1.
2. **`locale` props are optional, defaulting to EN** (`locale?: Locale = DEFAULT_LOCALE`) on `Footer`,
   `FeaturedServices`, `ServiceCard`, `ServicesList` and `ProjectDetail`. The spec says "take a `locale: Locale`
   prop". Optional keeps any caller that doesn't pass it (tests, future reuse) rendering EN instead of failing to
   compile. Every current caller passes it.
   - `Footer`'s prop is added inline (`FooterProps & { locale?: Locale }`), because `Footer/types.ts` is not in
     the file list.
3. **Small additions to the §2.1a API, for testability:**
   - `flattenDictionary` is exported;
   - `assertLocalesReady` has a third optional `dictionaries` parameter, used by the "fixture without markers"
     test;
   - `opts` defaults to `{}`, so `assertLocalesReady(['en'])` works as the spec's test list writes it.
4. **`ProjectDetail`'s "Back to Projects" `href` is still `/projects`, and `ServiceCard` and
   `FeaturedServices` hrefs are unchanged.** Only their strings changed; links are T6.

### Open question before T4 (needs a decision)
**`format` / `formatParts` vs bundle isolation (AC-9, R4).**
- §2.1 puts `format` and `formatParts` in `dictionary.ts`, and that module imports `fr.ts` and `es.ts`.
- In T4, two client components need interpolation:
  - `EmailCollectorProvider`: `Failed to subscribe ({status})`;
  - possibly `ProjectsGrid` / others.
- If a client file imports `format` from `dictionary.ts`, the FR/ES dictionaries can end up in client JS, and
  AC-9 fails.
- Options:
  - **(a) Recommended:** move `format` and `formatParts` into a new pure module `src/i18n/format.ts`, re-exported
    by `dictionary.ts` so server code and tests don't change, and imported directly by client files. It adds one
    file that is not in the spec's list, so it needs your OK.
  - **(b)** Duplicate a 3-line `replace` inside the client component. No new file, but two implementations.
  - **(c)** Re-export `format` from `I18nProvider.tsx`. That needs the function body to live there or in (a)'s
    module.

### Processes, worktrees, files
- Every server ran on port 3100 and every Chrome on 9333; I started all of them and stopped each by its PID.
  At the end, 3100 and 9333 were free, and nothing listened on 3000 at any point.
- The worktrees `<scratchpad>/p4/wt-v0` (`8065eae`) and `wt-c1` (`1bb704b` + synced `src/`) are still
  registered (`git worktree list`). I'm keeping them for T7 (V0 hydration console, AC-8). I'll remove them at
  the end of the phase, or now on request.
- `.env.local` was not edited. Production was not contacted, and the local CMS was only read.
- Staged: nothing. Commits: none.

### Time (agent)
≈ 20 min for pre-flight and the plan, then T0–C1 from 21:09 to 21:29 EDT on scripts and builds, plus this
report (measured from command timestamps; review wait not included).

---

## T4–T8 and final verification

### Result
**Done.**
- Every §1a/§1b string now comes from the typed dictionaries.
- EN is byte-identical on the 7 routes + 2 project pages, in both builds.
- The 404s are custom, dictionary-driven, and have a localized raw `<title>`.
- `next build` refuses an enabled locale that still has `[FR TODO]` / `[ES TODO]` values.

**Open:** none.

**Closed after the report (2026-10-25):**
- AC-11: the Vercel preview passed, 11/11 URLs (see "AC-11, Vercel preview" below).
- AC-5: the new `/esto-no-existe` look was approved by Mauricio (screenshots below).

**Deviations:** three, all accepted on 2026-10-25 (see "Deviations from the spec").

### C1 decisions applied (before T4)
- **`src/i18n/format.ts` (new, approved):** holds `format` and `formatParts`, has no dictionary import, and
  `dictionary.ts` re-exports both (`export { format, formatParts } from './format'`). Client code imports only
  `format.ts` (`EmailCollectorProvider`).
- **`locale: Locale` is now required** on `Footer` (in `Footer/types.ts` `FooterProps`, approved), `FeaturedServices`,
  `ServiceCard`, `ServicesList` and `ProjectDetail`.
  - No existing test renders any of them, so **no exception was needed**.
- **API additions, documented:**
  - `flattenDictionary(tree)` is exported from `dictionary.ts`; the tests use it.
  - `assertLocalesReady(enabled, opts = {}, dictionaries = DICTIONARIES)`: the third parameter is optional and
    lets a test pass a fixture without markers. Production calls use two arguments.

### Changes (T4–T8)
**T4, client components** (strings only, `useI18n()`; props unchanged):

| File | What |
|---|---|
| `components/organisms/Header/index.tsx` | logo alt ×4, nav ×10, schedule CTA ×2, menu toggle alt |
| `components/atoms/CalendlyButton/index.tsx` | `Loading...`; passes `labels: t.calendly` to `openCalendlyPopup` **only for non-EN locales** (see note) |
| `utils/calendly.ts` | optional `labels?: CalendlyLabels` (`closeDialog`, `frameTitle`), default `en.calendly`; the iframe title still prefers `utmContent` (I-7). Imports only `dictionaries/en` |
| `components/organisms/ContactForm.tsx` (+ new `ContactForm.test.tsx`) | labels, placeholders, option labels (values stay EN, incl. `Real State`, O1), validation/success/fallback errors, aria-label, button |
| `components/organisms/ProjectsGrid/index.tsx` | default title, empty state, `Solution: ` / `Outcome: `, CTA, "Check All Projects" |
| `components/molecules/PackageCard/index.tsx` | `Popular`, `What's included:`, check-icon alt, default `ctaText` (strings only, Decision C) |
| `components/organisms/LeadMagnetSection/index.tsx` | 4 fallback strings → `cmsFallback.*` (strings only; I-9 behaviour unchanged) |
| `components/organisms/FinalCTASection/index.tsx` | bg alt, title, subtitle, CTA fallbacks |
| `components/organisms/EmailCollectorProvider/index.tsx` | every modal string, `format(…subscribeFailed, { status })`, `labels` for non-EN (strings only, Decision C) |

Note on `labels`: the unmodifiable `CalendlyButton.test.tsx` asserts
`openCalendlyPopup` `toHaveBeenCalledWith({ ...props, forceNewWindow })`, exact keys.
- So the EN call keeps exactly its old arguments, and `calendly.ts` falls back to `en.calendly`, which holds the
  same strings.
- FR/ES calls add `labels`.
- `EmailCollectorProvider` uses the same pattern, for consistency.

**T5, 404s:**
- `components/organisms/NotFound/` (new: `index.tsx`, `types.ts`, `NotFound.scss`, `NotFound.test.tsx`) exports
  `NotFoundContent({ variant: 'page' | 'project' })`, a client component using `useI18n()`.
- The project variant keeps the old markup. Its inline styles moved to `.not-found` / `.not-found__actions` with
  the same values, and `/projects/no-existe` is pixel-identical to V0.
- The page variant uses the same structure: h1 `404`, body, "Go Home".
- `[locale]/not-found.tsx` and `projects/[slug]/not-found.tsx`: `generateMetadata({ params })` →
  `{ title: t.notFound.metaTitle | t.projectNotFound.metaTitle, robots: { index: false, follow: false } }`.
- **The broken `/portfolio` link is fixed:** it is now `localizePath('/projects', locale)`.
- **Found and fixed during T7:** after hydration, the generic 404's `document.title` became `Magneto CMS` (the
  layout's), because Next's built-in 404 rendered its own `<title>` and my component didn't.
  - The page variant now renders `<title>{t.notFound.metaTitle}</title>`, as the built-in does.
  - Result: `404: This page could not be found.` again, as in V0.
  - The project variant didn't need it, because the page's `generateMetadata` supplies its title.

**T6, links (D1):** `localizePath(<same path>, locale)` on the same elements. Header nav ×10 stays `<a>`; the logo
and other links stay `Link`.
- Header logo + nav ×10.
- `ProjectsGrid` cards ×2 + "Check All Projects".
- `FeaturedServices` `/services/`.
- `ServiceCard`: `` `${localizePath('/services', locale)}#${anchor}` ``.
- `ProjectDetail` "Back to Projects".
- `paths.ts` is unchanged. `PackageCard`'s unused `ctaHref='/contact'` default is left as is (E6).

**T8:** `AGENTS.md`, only the lines the spec lists (diff below). This report.

### Gate and acceptance
The final tree is the one in `git status`: 32 modified files, 9 new paths. Builds ran in a throwaway worktree of
`master` with this `src/` synced (`diff -r` identical, `npm ci`, `.env.local` symlinked), so Mauricio's `.next` was
never touched (BUILD_ID `GdgelMczjUyCIzua04nkq` before and after).

| AC | Result | Evidence |
|---|---|---|
| **AC-1** gate | **lint failed (pre-existing only)**; typecheck, tests, build passed | Same as the baseline: `npm run lint` exits 1 on pre-existing errors, so the `&&` chain stops there. Run separately: lint **115 errors / 110 warnings** (V0 149 / 110). Per-message diff V0 → final: only removals (−30 `no-html-link-for-pages`, see deviation 1; −4 `react/no-unescaped-entities`, strings moved to the dictionary). **0** messages in new files; `no-explicit-any` 98 → 98. `npm run typecheck` exit 0. `npm test -- --run` 29 files / 273 passed. Build: `ALLOW_UNTRANSLATED_LOCALES=1 npm run build` with `.env.local` as is (`ENABLED_LOCALES=en,fr,es`) → exit 0, 28/28 pages, 21 locale paths |
| **AC-1b** guard | **passed** | `ENABLED_LOCALES=` build → exit 0. `ENABLED_LOCALES=en,fr npm run build` (no override) → **exit 1**: `Error: ENABLED_LOCALES enables fr, but its dictionary has 115 untranslated keys ([FR TODO]): common.bookStrategyCall, common.goHome, common.checkIconAlt, common.loading, common.close, …. Translate them, or remove the locale from ENABLED_LOCALES. ALLOW_UNTRANSLATED_LOCALES=1 is for local builds only.` (thrown from the layout's `generateStaticParams`). `ENABLED_LOCALES=en,fr ALLOW_UNTRANSLATED_LOCALES=1 npm run build` → exit 0 (7 `/fr` paths, 0 `/es`). `ENABLED_LOCALES=en,fr,es next dev -p 3100`: `/fr` `/es` `/` → 200, no guard message in the log |
| **AC-2** tests | **passed** | 130 existing tests unmodified + 143 new (table below) = 273 |
| **AC-3** EN byte-identity | **passed, both builds** | Off and on (`en,fr,es` + override): route table names/markers identical; 33 statuses + proxy identical; normalized HTML 9/9 and metadata 9/9 identical. Screenshots 24/27 identical in both builds; the 3 differences are all `/esto-no-existe`, the new 404 look (AC-5). The 7 routes + `/projects/no-existe` are 24/24 pixel-identical (off vs the V0 rerun, see C1; on vs V0 on) |
| **AC-4** EN fingerprint | **passed** | `en.test.ts`: 115 keys + key-set check (116 tests). Table generated from the V0 sources (`8065eae` + Next's built-in 404), not from `en.ts` (C1, `fingerprint.mjs`). `format.ts` changed nothing in `en.ts` |
| **AC-5** 404s | **passed**; new look **approved by Mauricio (2026-10-25)** | All 8 URLs → 404 in both builds, no 500. Raw HTML: `<title>` from the layout locale's dictionary (`404: This page could not be found.` / `Project Not Found`; `[FR TODO] …` / `[ES TODO] …` on `/fr/*` and `/es/*` with locales on), robots `noindex` (shell) + `noindex, nofollow` (ours), **no `index, follow`**. After hydration: `lang` `en` on EN and disabled paths, `fr-CA` on `/fr/esto-no-existe` and `/fr/projects/no-existe`, `es` on `/es/esto-no-existe`; localized heading and body; header and footer present; project buttons → `/projects` `/` (EN), `/fr/projects` `/fr` (FR). `/projects/no-existe` screenshots = V0. `/esto-no-existe` screenshots (approved): `final/off/shots/esto-no-existe@{375,768,1440}.png`, FR/ES: `final/on/shots-locales/` |
| **AC-6** FR/ES SSR | **passed** | SSR HTML (scripts stripped) of `/fr`, `/fr/projects`, `/fr/projects/trepied-trepied-ca`, `/es`: nav ×5 (×2 each, desktop + mobile), `header.scheduleCall` ×2 and `footer.copyright` ×1 as `[FR TODO]` / `[ES TODO]` values; the project page also has `projectDetail.challenges/solutions/results`. EN `>About<`, `Free Schedule Call` and an unprefixed `All Rights Reserved`: **0** on all four |
| **AC-7** client-only | **passed** | `/fr`, header CTA clicked, modal opened, **not submitted**: title, body, labels, placeholders, close aria-label and button are all `[FR TODO] …`; `/` unchanged EN. FR validation: `/fr/contact` is 404 locally, so it is covered by `ContactForm.test.tsx` (FR provider, empty submit → `[FR TODO] Please enter your name.`, `fetch` not called). Hard rule 2 met (DISABLE_SMTP=1, no Mailchimp/GA/GTM vars) but no form was submitted |
| **AC-8** hydration | **passed** | Headless Chrome, both builds: 7 EN routes + `/esto-no-existe` + `/projects/no-existe` (+ `/fr`, `/es` with locales on): **0** hydration warnings; no console message except the 404 document's own `Failed to load resource … 404`, same as V0. Mobile toggle at 375: alt `Menu` → `Close` → `Menu`, menu `none` → `flex` → `none` |
| **AC-9** bundle | **passed** | `grep -rlF "[FR TODO]" .next/static` → 0 files; `[ES TODO]` → 0 (locales-on build and gate build) |
| **AC-10** links | **passed** | EN hrefs: covered by AC-3. `/fr`, `/fr/projects`, `/fr/projects/trepied-trepied-ca`, `/es`: every internal link outside the switcher starts with the locale (logo, nav, "Check All Services", project cards, "Back to Projects"); `/`: none prefixed. Nav elements are still `<a>`. Switcher maps the same page (`/projects` ↔ `/fr/projects` ↔ `/es/projects`, …). "Learn More" isn't rendered on `/fr`: the local FR home's featured services have no `anchorLink`, so it's EN-only locally (covered by AC-3) |
| **AC-11** Vercel preview | **passed** (2026-10-25) | PR preview, 11/11 URLs as expected; details in "AC-11, Vercel preview" below |
| **AC-12** AGENTS.md | **passed** | Exactly the listed lines (diff below); lint baseline = measured 115 / 110 (149 / 110 at V0) |
| **AC-13** I-9 | **passed** | Recorded below and in AGENTS.md Known debt. `LeadMagnetSection` logic unchanged; SSR covered by AC-3, and post-hydration CMS text identical to V0 (hydrated 404 DOM text: "Not sure where to start? Download our free guide: 6 Online Strategies…") |

**AC-2, test counts:**

| File | Tests |
|---|---|
| 24 existing files (unmodified) | 130 |
| `src/i18n/dictionaries/en.test.ts` | 116 |
| `src/i18n/dictionary.test.ts` | 18 |
| `src/i18n/I18nProvider.test.tsx` | 3 |
| `src/components/organisms/NotFound/NotFound.test.tsx` | 4 |
| `src/components/organisms/ContactForm.test.tsx` | 2 |
| **Total** | **29 files, 273** |

### AC-11, Vercel preview (2026-10-25)
- **Preview:** `https://magneto-web-agency-site-git-f61273-mauricios-projects-73547468.vercel.app/` (Ready).
- **Vercel env, checked by Mauricio:** `ALLOW_UNTRANSLATED_LOCALES` absent, `ENABLED_LOCALES` unset (EN only, so the
  guard can't trip).
- **Method:** Claude in Chrome in Mauricio's session (Vercel Deployment Protection), in a new tab.
  - URL navigation only: no clicks, no forms, no Vercel dashboard. The tab was closed afterwards.
  - Status is the Navigation Timing `responseStatus`.
  - Raw HTML comes from a same-origin `GET` of the page's own URL; content is read from the DOM after load.

| URL | Status | Checked | Result |
|---|---|---|---|
| `/` | 200 | `lang="en"`, raw and DOM title `Magneto Marketing - Home`, h1 "Attract More Aligned Clients Online", nav `About` `Services` `Packages` `Projects` `Contact` (hrefs `/about-magneto/` … unprefixed), CTA `Free Schedule Call`, footer `Magneto Marketing - All Rights Reserved, 2026.` | pass |
| `/services` | 200 | title `Services - Magneto Marketing`; same EN nav and footer | pass |
| `/packages` | 200 | title `Packages - Magneto Marketing`; same EN nav and footer | pass |
| `/projects` | 200 | title `Projects - Magneto Marketing`; same EN nav and footer | pass |
| `/about-magneto` | 200 | title `About Magneto - About the Agency`; same EN nav and footer | pass |
| `/contact` | 200 | title `Contact - Magneto Marketing`; same EN nav and footer | pass |
| `/projects/trepied-trepied-ca` | 200 | title `TRÉPIED — trepied.ca \| Magneto Projects`, h1 `TRÉPIED — trepied.ca`, headings `Challenges` `Solutions` `Results`, "Back to Projects" → `/projects`; same EN nav and footer | pass |
| `/esto-no-existe` | 404 | raw: `<html id="__next_error__">`, `<title>404: This page could not be found.</title>`, robots `noindex` + `noindex, nofollow` (no `index, follow`). After load: custom 404 (h1 `404`, `This page could not be found.`, `Go Home` → `/`), header and footer present, `lang="en"`, title unchanged | pass |
| `/projects/no-existe` | 404 | raw `<title>Project Not Found</title>`, same robots. After load: custom project 404 (h1, body, `View All Projects` → `/projects`, `Go Home` → `/`), header and footer present | pass |
| `/fr` | 404 | custom 404 (h1 `404`), `lang="en"` (locale disabled), no `TODO]` text on the page | pass |
| `/es` | 404 | same as `/fr` | pass |

### Production verification (after merge and promote, 2026-10-25 22:45 EDT)
- **Request:** Mauricio merged Phase 4 and promoted it; the Production rebuild was Ready.
- **Method:** plain HTTP `GET` of the same 11 URLs on `https://www.magnetomarketing.co`, no Chrome.
- **Evidence:** raw HTML + headers in `<scratchpad>/p4/prod-20261025-2245/`; log in `<scratchpad>/p4/prod-commands.log`.
- **Only reads:** no other request went to production.

| URL | Status | Raw HTML | Result |
|---|---|---|---|
| `/` | 200 | `<html lang="en">`, title `Magneto Marketing - Home`, nav `About` `Services` `Packages` `Projects` `Contact` (unprefixed hrefs, e.g. `/about-magneto/`), `Free Schedule Call` ×2, footer `Magneto Marketing - All Rights Reserved, <!-- -->2026<!-- -->.`, no `TODO]` | pass |
| `/services` | 200 | title `Services - Magneto Marketing`; same EN nav, CTA and footer | pass |
| `/packages` | 200 | title `Packages - Magneto Marketing`; same | pass |
| `/projects` | 200 | title `Projects - Magneto Marketing`; same | pass |
| `/about-magneto` | 200 | title `About Magneto - About the Agency`; same | pass |
| `/contact` | 200 | title `Contact - Magneto Marketing`; same | pass |
| `/projects/trepied-trepied-ca` | 200 | title `TRÉPIED — trepied.ca \| Magneto Projects`; same | pass |
| `/esto-no-existe` | 404 | `<html id="__next_error__">` shell; `<title>404: This page could not be found.</title>`; robots `noindex` + `noindex, nofollow` only (no `index, follow`); the payload carries the custom 404 (`Go Home`, `.not-found`) | pass |
| `/projects/no-existe` | 404 | same shell; `<title>Project Not Found</title>`; robots noindex only | pass |
| `/fr` | 404 | same shell; `<title>404: This page could not be found.</title>`; robots noindex only; no `TODO]` | pass |
| `/es` | 404 | same as `/fr` | pass |

**It is the new build.**
- The live RSC payload of `/` and of `/esto-no-existe` contains the dictionary keys `bookStrategyCall`,
  `cmsFallback`, `languageSwitcher` and `projectNotFound`, serialized by the `I18nProvider` prop. They exist only
  in the Phase 4 build.
- On the 404s, the raw `<title>` is the dictionary value instead of `Magneto CMS`, and the layout's
  `index, follow` meta is gone. Both were the pre-Phase-4 behaviour (spec E2, Phase 3b report).
- Headers: `/` → `x-vercel-cache: PRERENDER`, `age: 0`; `/esto-no-existe` → `MISS`, `age: 0`.
- The after-load rendering of the custom 404 (Chrome) was checked on the preview (AC-11); here it is visible only in
  the payload, by request.

### AGENTS.md diff (AC-12)
- **Commands:** + `ALLOW_UNTRANSLATED_LOCALES=1` is for local builds only; never set it in Vercel (and what the
  build does without it).
- **"Where text lives":** the UI microcopy row → `src/i18n/dictionaries/{en,fr,es}.ts`, `getDictionary(locale)` /
  `useI18n()`, ADR 0005.
- **Known debt, Toolchain:**
  - lint baseline 164 / 118 → `115 errors / 110 warnings (measured 2026-10-25, after Phase 4; 149 / 110 before it)`;
  - the `no-html-link-for-pages` line rewritten with the D1 sentence (see deviation 1).
- **Known debt, Code:** + the raw-404 shell line (the spec's wording) and + the I-9 lead-magnet line.
- AGENTS.md is now 201 lines, 1 over its "< 200" target.

### Deviations from the spec
All three were accepted by Mauricio and the Senior Architect on 2026-10-25.

1. **`no-html-link-for-pages`: 30 → 0, not "remain".**
   - AC-1 expected the 30 to remain. They disappeared because the rule only inspects string-literal `href`s, and the
     nav hrefs are now `localizePath(…)` expressions.
   - The elements are still plain `<a>` (D1). The debt is unchanged, but lint can't see it any more.
   - I kept the facts in AGENTS.md and said exactly this, instead of the spec's "keep the facts" text, which
     assumed the count stayed.
   - The lint baseline drop (149 → 115) is −30 from this and −4 `no-unescaped-entities`.
2. **`labels` is passed only for non-EN locales** (CalendlyButton, EmailCollectorProvider). The spec says "pass
   `t.calendly`". This keeps the unmodifiable `CalendlyButton.test.tsx` exact-argument assertions valid, with
   identical behaviour: the EN defaults are the same dictionary values.
   - **Accepted as minor debt:** always pass `labels: t.calendly`, and remove the locale condition in
     `CalendlyButton` and `EmailCollectorProvider`, when `CalendlyButton.test.tsx` can be changed.
3. **A `<title>` element in `NotFoundContent` (page variant)**, not in the spec. Without it, the generic 404's
   post-hydration title regressed to the WordPress site title. It mirrors Next's built-in 404, which also rendered
   one.
4. **From C1, all approved:** `format.ts`; `Footer/types.ts`; server page bodies in T2/T3; the `flattenDictionary`
   export and the third parameter of `assertLocalesReady`.

### Issues found (not fixed)
- **Minor debt (accepted, deviation 2):** the Calendly `labels` are passed only for FR/ES. Fix when
  `CalendlyButton.test.tsx` can change.
- **I-9, recorded (AC-13):** `LeadMagnetSection` never server-renders its CMS copy, so SSR ships the fallback and
  the client swaps it in. Fix with a server loader.
- **The raw 404 shell has two robots metas.** Both say noindex (`noindex` from Next's shell, `noindex, nofollow`
  from `not-found.tsx`); the conflicting `index, follow` (I-2) is gone. Next's shell tag can't be removed from app
  code.
- **`/fr/contact`, `/fr/services` and `/es/services` are 404 locally** (no FR/ES pages yet, Phase 3 D2). That's why
  AC-7's FR form check used the unit test (Phase 5).
- **The FR home has no "Learn More" links locally,** because its featured services have no anchors (CMS content,
  Phase 5).
- **The issues already listed in the spec are unchanged:** I-3 (`Default Footer Line 1/2`), I-4 (dead `Next.js`
  layout metadata), I-5 (raw EN server messages in forms), I-6 (`ServiceIcon` alt), I-7 (iframe title from
  `utmContent`), I-8 (social icon alt always the fallback).
- **The V0 `/projects` screenshot outlier** (C1) didn't recur: every later capture of that route is stable.

### Proposed commits (Conventional Commits; nothing is staged)
1. `feat(i18n): typed UI dictionaries, client provider and build readiness guard`
   - `src/i18n/{dictionary.ts,format.ts,I18nProvider.tsx}` and their tests;
   - `src/i18n/dictionaries/*`;
   - `.env.local.example`.
2. `feat(i18n): server components and metadata read the UI dictionary`
   - `app/[locale]/layout.tsx` and the 7 page files + `ServicesList.tsx`;
   - `Footer/*` (index, loader, types), `FeaturedServices/*`, `ServiceCard`, `ProjectDetail`, `HeroLoader`;
   - `LanguageSwitcher/types.ts`.
3. `feat(i18n): client components read the UI dictionary`
   - `Header`, `CalendlyButton`, `utils/calendly.ts`, `ContactForm` (+ test), `ProjectsGrid`, `PackageCard`,
     `LeadMagnetSection`, `FinalCTASection`, `EmailCollectorProvider`.
4. `feat(i18n): dictionary-driven 404 pages with localized title`
   - `components/organisms/NotFound/*`, `app/[locale]/not-found.tsx`, `projects/[slug]/not-found.tsx`.
5. `feat(i18n): locale-prefixed internal links (D1)`
   - The `localizePath` hunks in `Header`, `ProjectsGrid`, `FeaturedServices`, `ServiceCard`, `ProjectDetail`.
   - These share files with commits 2 and 3, so committing them separately needs hunk staging (`git add -p`).
     Otherwise fold them into 2 and 3.
6. `docs(phase-4): AGENTS.md microcopy row, lint baseline and known debt; phase 4 report`
   - `AGENTS.md`, `docs/reports/phase-4-ui-microcopy.md`.

### Evidence (`<scratchpad>/p4/`)
**Scripts:**
- `run.sh` / `run2.sh`: build, start on 3100, capture, plus the T7 browser checks; stop by PID.
- `reshoot.sh`: screenshots again on the existing build.
- `cap.mjs`, `cdp.mjs`: hydrated DOM and screenshots.
- `cdp2.mjs`: console, links, modal (open only) and mobile menu.
- `pngdiff.mjs`, `fingerprint.mjs`.

**Captures:**
- `v0/{off,off2,on}`; `c1/{off,on}` (C1); `final/{off,on}` (final).
  - Each has `status.txt`, `html/`, `meta/`, `raw404/`, `dom/dom.txt`, `shots/`, `console.json` and `menu.json`.
  - `final/on` also has `links.json`, `modal.json`, `locales/*.html` and `shots-locales/`.
- `final/guard/` (AC-1b logs, `next dev` check); `final/gate-build.log`.
- `final/{lint,lint2}.txt`, `final/test2.log`, `final/typecheck2.log`.
- `v0/lint.txt` (149 / 110).

### Processes and cleanup
- Every server I started ran on 3100, every Chrome on 9333 and `next dev` on 3100. Each was stopped by its own
  PID, and none is left (checked).
- Nothing listened on 3000 at any point. The repo's `.next` is untouched.
- Worktrees `wt-v0` and `wt-c1` were removed at the end of T7 (`git worktree list`: the repo only).
- `.env.local` was not edited, and no secret value was printed. The local CMS was only read. Production and
  Vercel were not contacted. No form was submitted.
- Staged: nothing. Commits: none.

### Time (agent, from command timestamps)
- C1 → end: 21:31–21:52 EDT for T4–T8, of which T7 builds and browser checks were ≈ 15 min.
- Whole phase: ≈ 65 min of agent time, plus the C1 review wait.
