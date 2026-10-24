# Phase 2 — Locale routing (infrastructure only)

- Status: Approved — 2026-10-24 (Senior Architect: D1–D6 approved; Mauricio: Q1, Q2 approved)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: `docs/reports/phase-1-wpml-setup.md` (Done; V6 → Phase 3 fetches with `pages(where:{language, name})`),
  ADR 0001 (locale-prefixed routes, EN unprefixed)

## Goal
The App Router serves EN at the current URLs (same paths, same status codes, same HTML) and can serve FR
at `/fr/...` and ES at `/es/...`. An env list decides which locales are enabled. Disabled locales behave
exactly as today (404). `<html lang>` follows the locale. A language switcher appears only when 2+ locales
are enabled. No data, copy or CMS changes: pages under `/fr` and `/es` still render the EN data until Phase 3,
which is why they stay disabled outside local development.

## Evidence (facts verified now)

**F1 — Router layout today.** `find src/app src/pages -type f`:
```
src/app/layout.tsx  head.tsx  page.tsx
src/app/about-magneto/{api.ts,page.tsx}
src/app/contact/{api.ts,layout.tsx,page.tsx}
src/app/packages/{api.ts,layout.tsx,page.tsx}
src/app/projects/{api.ts,page.tsx}
src/app/projects/[slug]/{api.ts,api.test.ts,not-found.tsx,page.tsx}
src/app/services/{README.md,Services.scss,ServicesList.tsx,api.ts,page.tsx}
src/app/api/wp-graphql/route.ts   src/app/robots.txt/route.ts   src/app/sitemap.xml/route.ts
src/pages/api/{contact,download-check,download,mailchimp}.ts
```
- There is no `middleware.ts` (`ls src/middleware.ts middleware.ts` → both missing) and no `app/not-found.tsx`.
- `public/` holds only `assets/`.
- `next.config.ts` has no `i18n`, `trailingSlash`, `rewrites` or `redirects`. `next` is `15.5.28`.

**F2 — Root layout hardcodes EN.**
- `src/app/layout.tsx` renders `<html lang="en" …>` and wraps `children` with `EmailCollectorProvider`,
  `Header`, `LeadMagnetSection`, `FinalCTASectionLoader` and `FooterLoader`.
- `generateMetadata` fetches `GET_SITE_METADATA` and sets `openGraph.locale: 'en_US'`. That stays as it is
  (Phase 7).

**F3 — Rendering mode.**
- No route sets `dynamic`, `revalidate` or `dynamicParams`. Only `api/wp-graphql/route.ts` is
  `force-dynamic`.
- `fetchWPGraphQL` uses `next: { revalidate: 60 }` (`src/utils/wp-graphql.ts:39`).
- `projects/[slug]/page.tsx` has `generateStaticParams` over `GET_PROJECTS` and returns `{ slug }`.
- The 0.5b report records the build as "14/14" static pages.

**F4 — Components that compare `usePathname()` with EN paths.** These break under a prefix or a rewrite:
```
src/components/organisms/LeadMagnetSection/index.tsx:45  const shouldShow = show && pathname !== '/contact';
src/components/organisms/FinalCTASection/index.tsx:47    const shouldShow = show && pathname !== '/contact';
src/components/organisms/ProjectsGrid/index.tsx:22       const isProjectsRoot = pathname === '/projects' || pathname === '/projects/';
```

**F5 — `usePathname` under a middleware rewrite** (read in `node_modules/next`, 15.5.28):
- Client: `client/components/router-reducer/create-initial-router-state.js:42-44` sets
  `canonicalUrl = location ? createHrefFromUrl(location) : initialCanonicalUrl`. In the browser, the
  pathname is therefore the **browser URL** (`/contact`).
- Server: `server/app-render/app-render.js:1154` builds the URL from `req.url`, and `:641` sends it as the
  payload's canonical URL (`c`). For a page rendered at its internal path, the server value can be the
  **rewritten** path (`/en/contact`). See A1.
- Consequence: if F4 compared raw pathnames, EN `/contact` could SSR the lead magnet and final CTA and then
  hide them on hydration. That would be a hydration mismatch and a visible EN regression.

**F6 — Hardcoded internal links** (EN paths, not localized here; see Out of scope):
- `Header/index.tsx:123-127,169-173`: `/about-magneto/` `/services/` `/packages/` `/projects/` `/contact/`,
  plus `Link href="/"`.
- `ProjectsGrid:55,74,92` · `FeaturedServices:39` · `ServiceCard:24` · `PackageCard:92` (`ctaHref='/contact'`)
  · `ProjectDetail:149` · `projects/[slug]/not-found.tsx:21,24` (`/portfolio`: an existing broken link, not
  ours to fix).
- `Header` already has commented `FR` / `ES` `<li>` placeholders at `:135-136` and `:174-175`.

**F7 — Imports that break when files move.**
- `src/app/services/ServicesList.tsx:3` has `import IconComponent from '../../components/atoms/IconComponent'`.
  This is the only `../` import under `src/app`. Every other import is `@/…` or `./…` and moves with its
  folder.
- `git grep` finds no file outside `src/app` that imports from `src/app/<route>`.

**F8 — WPML codes (Phase 1 V1).** en `en_US` (default) · fr `fr_CA` · es `es_ES` · WP URLs `/`, `/fr/`, `/es/`.
The FR/ES home pages keep the slug `home` (V2: `{slug:"home", uri:"/fr/"}`). V6 shows that
`page(id:"fr/…", URI)` and `pageBy(uri:)` resolve to EN, so the frontend URL must not be passed to WP as a
URI. Phase 3 keys on the EN `name` (strategy B).

**F9 — EN HTTP baseline** (0.5b report, re-confirmed in the Phase 1 V7 report):
```
200  /  /services  /packages  /projects  /about-magneto  /contact
200  /projects/trepied-trepied-ca  /projects/shamaniccas-ecommerce  /projects/fashion-company-ecommerce
404  /projects/no-existe  ·  404 /carte  ·  200 /robots.txt  ·  200 /sitemap.xml  ·  404 /api/ping-cms
proxy POST /api/wp-graphql {"query":"{ generalSettings { title } }"} → 200 {"generalSettings":{"title":"Magneto CMS"}}
```
The capture script lives in the Dev's earlier scratchpad, not in the repo. This phase defines the list
explicitly instead (V1).

**F10 — Tests.** Vitest with jsdom and the `@` alias (`vitest.config.ts`). The existing tests sit next to the
code they test (`*.test.ts(x)`).

## Assumptions and open questions
- **A1:** On the server, `usePathname()` can return the internal `/en/...` path for rewritten EN requests
  (F5). The design is safe both ways: every pathname comparison strips any locale prefix, `en` included.
  The Dev confirms it in V3 (no hydration warning on `/contact` and `/projects`).
- **A2:** Middleware sees `ENABLED_LOCALES` both locally (`next dev` / `next start`) and on Vercel. Static
  params are computed at build time anyway, so **changing the list requires a rebuild/redeploy**. A shell
  variable overrides `.env.local` in Next's env loading, which lets the Dev test both values without editing
  `.env.local` (V4).
- **A3:** With `[locale]/layout.tsx` as the root layout and no `app/not-found.tsx`, `notFound()` from the
  catch-all renders Next's default 404 inside `[locale]/layout.tsx`, which keeps the header and footer as
  today. V2 checks this on `/carte`. If the normalized HTML differs, the Dev stops and reports. No custom 404
  page is added here (that task is separate).
- **Q1 — resolved (Mauricio, 2026-10-24):** visible `EN` / `FR` / `ES`; accessible names "English" /
  "Français" / "Español"; group label "Language". The Dev uses exactly these strings. The group label is EN
  only in this phase (`TODO(phase-4)`); see "Notes for later phases".
- **Q2 — resolved (Mauricio, 2026-10-24):** the switcher goes where the commented `FR`/`ES` placeholders are,
  in the desktop `ul.nav` and in the mobile menu. Styling is `typo-sm-bold` plus an underline for the
  current language. Mauricio approves the look from the V5 screenshots.

## Design

### Approach comparison (Next 15.5, App Router)

| | **A — `app/[locale]/…` + middleware rewrite** (recommended) | **B — route groups with duplicated trees** `app/(en)/…`, `app/(fr)/fr/…`, `app/(es)/es/…` |
|---|---|---|
| EN URLs | Unprefixed; middleware rewrites `/x` → `/en/x` internally. The browser URL is unchanged and there is no redirect. | Unprefixed by the filesystem; no middleware. |
| `<html lang>` | `[locale]/layout.tsx` is the root layout: `lang` comes from `params.locale`. | One root layout per group, with `lang` hardcoded per group. |
| Static generation | `generateStaticParams` on the layout: one prerender per enabled locale. Children (`projects/[slug]`) are crossed with the locale automatically. ISR (`revalidate: 60`) unchanged. | Each tree prerenders on its own; no params. |
| Vercel | Edge middleware runs on matched requests (a small cost per request); prerendered pages are still served from cache after the rewrite. Documented Next i18n pattern. | Nothing new at the edge. |
| How much code moves | Every page file moves once into `app/[locale]/` (`git mv`, ≈20 files, contents unchanged except F7). Each route is still defined **once**. | EN moves into `(en)/` (≈20 files). Then **2 × 7 wrapper pages + 2 layouts** re-export the EN pages. Every future route needs 3 files. |
| Phase 3 fit | `params.locale` arrives in every page, ready for `api.ts(locale)` (ADR 0001 §4). | The locale is hardcoded per wrapper and passed by prop; it works but is repetitive. |
| Risks | Pathname comparisons see the rewrite (F5); handled by `splitLocalePath`. A typo in the middleware matcher could catch `/api` or static files; covered by unit tests and V1. | The three trees can drift. Changing language swaps the root layout (full reload); the same is true for A. |

Rejected without a column:
- `next.config` `i18n` is Pages Router only and not supported by the App Router.
- `next-intl` / `next-i18n-router` are new dependencies, which ADR 0001 §3 rules out without proof.
- Reading the locale from a header in a single root layout (`headers()`) makes every page dynamic and loses
  static generation.

**Recommendation: A.** It has one route tree, the locale as a typed param for Phase 3, and it follows the
documented Next pattern. Its one real risk (F4/F5) is small and testable.

### 1. Locale config and helpers: `src/i18n/`
`src/i18n/config.ts`, pure with no Next imports, so it can be unit-tested and used in middleware, server and
client:
```ts
export const LOCALES = ['en', 'fr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export function isLocale(value: unknown): value is Locale;
/** Parses a comma list (e.g. "en,fr,es"). Unknown or blank entries are dropped, `en` is always included,
 *  duplicates are removed, order follows LOCALES. Unset or empty → ['en'] (fail closed). */
export function parseEnabledLocales(raw: string | undefined): Locale[];
export function getEnabledLocales(): Locale[];   // = parseEnabledLocales(process.env.ENABLED_LOCALES)
export function isEnabledLocale(value: unknown, enabled?: Locale[]): value is Locale;
export const HTML_LANG: Record<Locale, string> = { en: 'en', fr: 'fr-CA', es: 'es' }; // see D5
```
- `getEnabledLocales()` is the **only** place that reads `ENABLED_LOCALES`. It is called by
  `src/middleware.ts` and by `app/[locale]/layout.tsx` (`generateStaticParams` and the switcher list).
- `ENABLED_LOCALES` is **server-only** (no `NEXT_PUBLIC_`). The client switcher receives the list as a prop.

`src/i18n/paths.ts`, pure:
```ts
/** "/fr/services" → { locale:'fr', path:'/services' } · "/services" → { locale:'en', path:'/services' }
 *  "/en/contact" → { locale:'en', path:'/contact' } (internal rewritten path, see F5) · "/fr" → { 'fr', '/' } */
export function splitLocalePath(pathname: string): { locale: Locale; path: string };
/** "/services", 'fr' → "/fr/services" · "/", 'fr' → "/fr" · any path, 'en' → unchanged (no prefix). */
export function localizePath(path: string, locale: Locale): string;
/** Same page in another locale: localizePath(splitLocalePath(pathname).path, target). Same slugs (D2). */
export function switchLocalePath(pathname: string, target: Locale): string;
```
- A trailing slash is preserved as given.
- Query and hash are not handled; the switcher passes only the pathname.

### 2. Routing: `src/middleware.ts` + a pure decision function
`src/i18n/routing.ts`, pure and tested:
```ts
/** Internal path the request must render.
 *  - first segment is an ENABLED non-default locale (fr/es) → null (pass through, path already matches app/[locale])
 *  - anything else → '/en' + pathname  ('/' → '/en')
 *  This means /en/x → /en/en/x and disabled /fr/x → /en/fr/x. Both hit the catch-all → 404, as today (D4). */
export function resolveInternalPath(pathname: string, enabled: Locale[]): string | null;
```
`src/middleware.ts`:
- `null` → `NextResponse.next()`; otherwise `NextResponse.rewrite(new URL(internal + search, req.url))`.
- No redirects and no cookies or `Accept-Language` detection (D6).
- `config.matcher` excludes `api`, `_next`, `assets`, `robots.txt`, `sitemap.xml`, and any path with a dot:
  `'/((?!api|_next|assets|robots\\.txt|sitemap\\.xml|.*\\..*).*)'`. `src/app/api/wp-graphql`,
  `src/pages/api/*`, `robots.txt/route.ts` and `sitemap.xml/route.ts` therefore stay at the app root, untouched.
- Comment the one non-obvious constraint: `/en/*` is deliberately not exposed.

### 3. Route tree move: `app/[locale]/`
- `git mv` into `src/app/[locale]/`: `page.tsx`, `about-magneto/`, `contact/`, `packages/`, `projects/`
  (including `[slug]/` and its test and `not-found.tsx`), and `services/` (including `README.md`).
- Contents stay unchanged except `ServicesList.tsx:3` → `@/components/atoms/IconComponent` (F7).
- Pages don't read `params.locale` in this phase.
- `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`. Changes:
  - The props gain `params: Promise<{ locale: string }>`. `const { locale } = await params`, narrowed with
    `isLocale` (fallback `DEFAULT_LOCALE`).
  - `<html lang={HTML_LANG[locale]}>`. Every other attribute stays as it is.
  - `export function generateStaticParams() { return getEnabledLocales().map(locale => ({ locale })) }`.
  - Pass `switcher` to `Header` only when `enabled.length > 1` (section 4).
  - `generateMetadata` stays byte-identical; no per-locale metadata (Phase 7).
- `export const dynamicParams` is **not** set. On a layout it could cascade to `projects/[slug]` and 404 new
  projects until a rebuild. The middleware is the gate.
- New `src/app/[locale]/[...rest]/page.tsx`: `notFound()` only. It catches `/carte`, `/en/x`, disabled
  `/fr/x` and unknown paths so they render the 404 inside the layout (A3).
- `src/app/head.tsx` stays where it is, untouched. It is not a special file in the App Router.

### 4. Language switcher: `src/components/molecules/LanguageSwitcher/`
`index.tsx` (`'use client'`) · `types.ts` · `LanguageSwitcher.scss` · `LanguageSwitcher.test.tsx`
```ts
export interface LanguageSwitcherProps {
  locales: Locale[];        // enabled, from the layout
  currentLocale: Locale;    // from params, not from the pathname (F5)
  label?: string;           // group accessible name; default 'Language' — TODO(phase-4) dictionary
  className?: string;
}
```
- Returns `null` when `locales.length < 2`.
- Markup: `<div role="group" aria-label={label} className="language-switcher">`, then one `<a>` per locale.
  - `href={switchLocalePath(usePathname() ?? '/', l)}`
  - `hrefLang={HTML_LANG[l]}` and `lang={HTML_LANG[l]}`
  - visible text `EN` / `FR` / `ES`, accessible name `English` / `Français` / `Español` (Q1, approved)
  - the current locale gets `aria-current="true"`
- Plain `<a>`, not `next/link`, as the header does today. Changing locale changes the root layout, so it is
  a full load either way.
- Keyboard: native links (Tab / Enter). The visible focus style comes from the existing global link styles.
  The Dev checks it in V5 and adds a `:focus-visible` rule in `LanguageSwitcher.scss` if the global one
  doesn't show.
- Export it from `src/components/molecules/index.ts`.
- `Header`: add **one optional prop**, `switcher?: React.ReactNode`.
  - When it is set, render `<li className="nav__lang">{switcher}</li>` in place of the commented placeholders
    in `ul.nav`, and `<li>{switcher}</li>` in `ul.nav_mobile__menu`. Remove those two commented blocks.
  - When it is unset, the markup is **byte-identical to today**.
  - This is a public-API addition, allowed by this spec (hard rule 5).

### 5. Pathname comparisons (F4)
In `LeadMagnetSection`, `FinalCTASection` and `ProjectsGrid`, compare `splitLocalePath(pathname ?? '/').path`
instead of the raw `pathname`. Same conditions, same values; nothing else changes in those files. The
`ProjectsGrid` `'/projects/'` check is kept.

### 6. Env
`.env.local.example`:
```
# Locales served by the frontend, comma-separated (en is always on). Unset/empty → en only.
# Local development: en,fr,es. Production: leave unset until Phase 5 loads FR/ES copy (ADR 0001).
# Read only by src/i18n/config.ts. Changing it requires a rebuild.
ENABLED_LOCALES=en
```
- Mauricio adds `ENABLED_LOCALES=en,fr,es` to his own `.env.local`. Agents don't edit it (hard rule 3).
- Vercel needs **no change**: unset means EN only, the same as today.

### 7. Tests (Vitest, next to the code)
- `src/i18n/config.test.ts`:
  - `isLocale` (en/fr/es true; `'de'`, `''`, `'EN'`, `undefined` false)
  - `parseEnabledLocales`: unset → `['en']`; `''` → `['en']`; `'fr'` → `['en','fr']`;
    `' es , fr ,de,fr'` → `['en','fr','es']`
  - `HTML_LANG` has a key for every `LOCALES` entry
- `src/i18n/paths.test.ts`:
  - `splitLocalePath` for `/`, `/fr`, `/fr/`, `/es/projects/trepied-trepied-ca`, `/en/contact`, `/contact`,
    `/french` (not a locale), `/fr-ca/x` (not a locale)
  - `localizePath` for `/` and `/services` × 3 locales
  - `switchLocalePath` for `/services` → fr, `/fr/services` → en, `/fr/services` → es, `/` ↔ `/fr`,
    `/projects/trepied-trepied-ca` → es
- `src/i18n/routing.test.ts`, `resolveInternalPath`:
  - with `['en']`: `/` → `/en`, `/services` → `/en/services`, `/fr/services` → `/en/fr/services`,
    `/en/services` → `/en/en/services`
  - with `['en','fr','es']`: `/fr` → `null`, `/es/contact` → `null`, `/services` → `/en/services`,
    `/french` → `/en/french`
- `src/components/molecules/LanguageSwitcher/LanguageSwitcher.test.tsx` (mock `next/navigation`'s
  `usePathname`):
  - one locale → renders nothing
  - three locales on `/fr/services` → three links with hrefs `/services`, `/fr/services`, `/es/services`
  - `aria-current` only on FR
  - group has an accessible name
  - each link has `lang`/`hrefLang`
- No test for `middleware.ts` itself (a thin wrapper); V1/V4 cover it over HTTP.

## Files the Dev may touch
- `src/i18n/config.ts`, `src/i18n/paths.ts`, `src/i18n/routing.ts`: new
- `src/i18n/config.test.ts`, `src/i18n/paths.test.ts`, `src/i18n/routing.test.ts`: new
- `src/middleware.ts`: new
- `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`: move + the changes in section 3
- `src/app/page.tsx`, `src/app/{about-magneto,contact,packages,projects,services}/**` → `src/app/[locale]/…`:
  move only
- `src/app/[locale]/services/ServicesList.tsx`: the one import line (F7)
- `src/app/[locale]/[...rest]/page.tsx`: new
- `src/components/molecules/LanguageSwitcher/{index.tsx,types.ts,LanguageSwitcher.scss,LanguageSwitcher.test.tsx}`:
  new
- `src/components/molecules/index.ts`: one export line
- `src/components/organisms/Header/index.tsx`: the `switcher` prop + the two placeholder blocks
- `src/components/organisms/LeadMagnetSection/index.tsx`, `FinalCTASection/index.tsx`,
  `ProjectsGrid/index.tsx`: the pathname comparison only (section 5)
- `.env.local.example`: the `ENABLED_LOCALES` block
- `docs/reports/phase-2-locale-routing.md`: the report
- `docs/adr/0003-locale-routing.md`: new; records D1–D6 as approved below, including the D2 "Revisit" note.
  Same format as ADR 0001 (Status Accepted, Date 2026-10-24, Deciders: Mauricio, Senior Architect)
- `CLAUDE.md`: the "Current phase" line, at the close
- `AGENTS.md`:
  - Directory map: `app/[locale]/`, `src/i18n/`, `middleware.ts`
  - "Where text lives today": routes now under `[locale]`
  - Known debt: replace the "Locale hardcoded … `lang="en"`" line with the `openGraph.locale 'en_US'` part
    that is still true (Phase 7)
  - Keep it under 200 lines

Anything else is out of scope, notably `src/app/head.tsx`, `src/app/api/**`, `robots.txt/`, `sitemap.xml/`,
`src/pages/**`, `next.config.ts`, every `api.ts` and `package.json`.

## Out of scope
- Fetching localized data and passing `locale` to `api.ts` (Phase 3). Locally, `/fr/*` and `/es/*` show EN data
  in this phase. That is expected and is why production stays EN-only.
- **Localizing internal links** (F6: header nav, grids, cards, CTAs) → Phase 4, together with the header
  microcopy, using `localizePath`. Until then a FR visitor (local only) who clicks the nav lands on EN.
- UI microcopy dictionaries (Phase 4), including the switcher's group label.
- `hreflang`, canonical, `openGraph.locale`, the sitemap and robots per locale (Phase 7).
- A custom 404 page (separate task). The broken `/portfolio` link in `projects/[slug]/not-found.tsx` is
  reported, not fixed.
- Automatic language detection or redirects (`Accept-Language`, cookies) (D6).
- Any CMS change, and any Known-debt item (the 12-project limit, `ProjectData`, `any`s, …).

## Acceptance criteria

**V0 — "Before" capture.** On HEAD before any change, in a git worktree on port 3100 (as in Phases 0.5b and
1, with Mauricio's `:3000` and `.next` untouched), capture:
- (a) status + `Location` for every V1 URL, with `curl -s -o /dev/null -w '%{http_code} %{redirect_url}'`
- (b) normalized SSR HTML for the 7 page routes + `/carte`, with the same normalization as 0.5b: scripts,
  `<link>`s and `/_next/static` hashes removed
- (c) `<title>` and `<meta name="description">` for the 3 project pages

Then:
- [ ] **Completion gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build` passes.
  Lint is ≤ the baseline of 136 errors / 118 warnings, with **no new** errors in the touched or new files.
  The build lists `/[locale]` routes, and with `ENABLED_LOCALES` unset only `en` is prerendered (count
  recorded).
- [ ] **New tests pass:** `config`, `paths`, `routing`, `LanguageSwitcher`; existing tests still pass,
  including the moved `[locale]/projects/[slug]/api.test.ts`.
- [ ] **V1 — EN HTTP smoke identical to F9 / V0(a)** with `ENABLED_LOCALES` unset (`next build && next start -p 3100`
  in the worktree), plus the same run with `ENABLED_LOCALES=en,fr,es`:
  - 200: `/` `/services` `/packages` `/projects` `/about-magneto` `/contact` and the 3 project pages
  - 404: `/projects/no-existe` `/carte` `/api/ping-cms`
  - 200: `/robots.txt` `/sitemap.xml`
  - proxy `POST /api/wp-graphql` → 200 with the same body
  - extra rows, recorded in V0 and unchanged: `/services/` and `/about-magneto/` (whatever trailing-slash
    status they give today), `/en` and `/en/services` (404 today), `/assets/images/logo-magneto.svg` (200)
- [ ] **V2 — EN HTML unchanged:** the normalized SSR HTML of the 7 routes + `/carte` is identical to V0(b),
  with `ENABLED_LOCALES` unset. The `<html lang="en">` attribute is the same. The 3 projects' title and
  description match V0(c).
- [ ] **V3 — No hydration warnings:** in `next dev -p 3100`, the browser console shows no hydration warning on
  `/`, `/contact` and `/projects`. On `/contact` the lead magnet and final CTA are absent both in the SSR
  HTML and after hydration. With all three locales, the same holds on `/fr/contact`.
- [ ] **V4 — Enablement flag:**
  - With `ENABLED_LOCALES` unset, or `=en`: `/fr`, `/fr/services`, `/es`, `/es/projects/trepied-trepied-ca`
    → **404**, and `/` has no switcher in its HTML.
  - With `=en,fr,es`: those 4 → 200, with `<html lang="fr-CA">` / `lang="es"`; `/fr/no-existe` → 404
    and `/de/services` → 404.
  - With `=en,fr`: `/fr/services` 200 and `/es/services` 404.
- [ ] **V5 — Switcher** (`ENABLED_LOCALES=en,fr,es`, 375 / 768 / 1440 px):
  - Visible in the desktop nav and in the mobile menu.
  - Tab reaches each link with a visible focus ring; Enter navigates.
  - The current language is marked visually and with `aria-current`.
  - From `/projects/trepied-trepied-ca`, FR → `/fr/projects/trepied-trepied-ca`; from
    `/es/services`, EN → `/services`.
  - Screenshots go in the report; Mauricio approves the look (Q2).
- [ ] **EN visually unchanged** with `ENABLED_LOCALES` unset, at 375 / 768 / 1440 px, on `/`, `/services`,
  `/packages`, `/projects`, `/about-magneto`, `/contact`, `/projects/trepied-trepied-ca` and `/carte`,
  compared with V0 screenshots.
- [ ] No `ENABLED_LOCALES` or `NEXT_PUBLIC_*` value is printed in the report other than the test values above.
  `.env.local` is not edited.
- [ ] The report lists: the build route table before and after, the V1 table, and the V2 diff result.
- [ ] `docs/adr/0003-locale-routing.md` exists with D1–D6 and the D2 "Revisit" note.
- [ ] D2 single mapping point: `git grep -n -E "/(fr|es|en)(/|['\"])" -- src ':!src/i18n' ':!*.test.*'` returns no
  locale-path building or parsing outside `src/i18n/`. The report pastes the output.

## Decisions (resolved — 2026-10-24)
All approved by the Senior Architect. The Dev writes them as **`docs/adr/0003-locale-routing.md`**:
- **D1 Routing:** approach A (`app/[locale]` + middleware rewrite, EN unprefixed via an internal `/en`).
  This is a routing change, which ADR 0001's Consequences already anticipate.
- **D2 URL slugs:** the same (EN) slugs in every locale, e.g. `/fr/services` and
  `/fr/projects/trepied-trepied-ca`. This fits Phase 3 strategy B (keyed on the EN `name`) and keeps the
  switcher a pure path mapping. Translated slugs (`/fr/a-propos`) would need a slug map, from the CMS or code,
  and belong in their own ADR if wanted later (SEO trade-off for Phase 7).
  **Revisit:** localized slugs (e.g. `/fr/projets`) may come later for local SEO. To keep that change cheap,
  **all** locale-path mapping lives in `src/i18n/paths.ts` (`splitLocalePath` / `localizePath` /
  `switchLocalePath`). No other file may build or parse a locale path by string concatenation or regex; the
  middleware, the switcher and the section 5 comparisons go through these functions.
- **D3 Enablement:** a server-only `ENABLED_LOCALES`, fail-closed (unset → `en`), read only in
  `src/i18n/config.ts`, applied at build time (a rebuild is needed to change it). Production stays unset until
  Phase 5 + QA (ADR 0001 §5).
- **D4 `/en/*`:** returns 404, identical to today, rather than a 308 redirect to the unprefixed URL. Revisit in
  Phase 7, where a redirect may help canonicalization.
- **D5 `lang` values:** `en`, `fr-CA`, `es`. Is the Spanish copy neutral/LatAm, so `es` and not `es-ES`? WPML
  uses `es_ES` as its locale (F8), but the `lang` attribute describes the copy, not the plugin.
- **D6 No automatic detection:** no `Accept-Language` or cookie redirects. Users choose a language with the
  switcher. This avoids redirecting crawlers and keeps EN URLs stable.

## Notes for later phases
- **Phase 3:** read `params.locale` in each page and pass it to `api.ts`. Map frontend paths to CMS lookups
  only through `src/i18n/paths.ts` (D2 Revisit).
- **Phase 4:** localize the switcher's group label with the UI dictionaries (`Language` / `Langue` /
  `Idioma`), and localize internal links with `localizePath` (F6).
- **Phase 7:** `hreflang`, canonical, `openGraph.locale`, sitemap per locale; revisit D4 (`/en/*` 404 vs 308)
  and the D2 localized-slugs option.

## Estimate
- Mauricio:
  - 20–35 min: review D1–D6 and Q1/Q2, add `ENABLED_LOCALES=en,fr,es` to his `.env.local`, approve the
    switcher screenshots.
- Dev (agent):
  - 2.5–4 h: move, helpers, middleware, switcher, tests, V0–V5 with before/after captures, report.
  - +1 h if A1/A3 need investigation, e.g. if `/carte` 404 HTML differs.
