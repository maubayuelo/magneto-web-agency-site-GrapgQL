# Phase 3 — Locale-aware data

- Status: Approved — 2026-10-24 (Senior Architect: D1–D5 approved; H1/H2 approved as Mauricio's steps)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: `docs/reports/phase-2-locale-routing.md` (Done, merged as PR #9, `d0c09c4`), Phase 1 V6
  (fetch per language with `pages(where:{language, name})`), ADR 0001, ADR 0003

## Goal
Every page, every layout section and every project fetch reads WordPress in the request locale. A locale
page with no translation returns 404; it never shows EN under `/fr` or `/es`. Images always come from the
EN original files. Caching never mixes locales. EN output is byte-identical to Phase 2. No new copy, no UI
microcopy (Phase 4), no SEO tags (Phase 7).

## Evidence (facts verified now)
All queries went to `http://magneto-cms-2.local/graphql`, read-only, from `<scratchpad>/p3/*.mjs`.

**F1 — Branch.** `feat/phase-3-localized-data` at `d0c09c4` (PR #9 merge). The tree is clean.
`src/app/[locale]/`, `src/i18n/`, `src/middleware.ts` and `serverExternalPackages` (A2) are present.

**F2 — Which pages exist per language** (`pages(first:2, where:{language:$l, name:$n}){nodes{databaseId slug uri status}}`):
```
home           en:[2,"home","/"]          fr:[535,"home","/fr/"]   es:[536,"home","/es/"]
services       en:[34,"services","/services/"]     fr:[]  es:[]
packages       en:[36,…]  fr:[]  es:[]      projects  en:[38,…]  fr:[]  es:[]
about-magneto  en:[32,…]  fr:[]  es:[]      contact   en:[41,…]  fr:[]  es:[]      carte en:[533,…] fr:[] es:[]
```
Consequences:
- Only `home` is translated. Under a 404 rule, `/fr/projects` is **404**, not an empty state, because the
  `projects` *page* (hero + intro) has no FR translation. The acceptance item "/fr/projects → empty state"
  therefore needs a human step (H1).
- The FR/ES home kept the EN slug `home`, so WPML allows the same slug across languages for pages. This
  matches ADR 0003 D2.

**F3 — One project by slug, per language.**
- Schema: `project(id: ID, idType: ProjectIdType)` has **no language argument**.
  `RootQueryToProjectConnectionWhereArgs` has `language: String` and `name: String` (plus `nameIn`, `in`, …).
- Results for `projects(first:1, where:{language:$l, name:$n}){nodes{databaseId slug languageCode translationGroupId status}}`:
```
en  trepied-trepied-ca → [{498,"trepied-trepied-ca","en","399","publish"}]     en  no-existe → []
fr  trepied-trepied-ca → []      es  trepied-trepied-ca → []      fr/es no-existe → []
all trepied-trepied-ca → [498 en]                                no language → [498 en]
de  → errors: "Filtering by a non-active language", data.projects: null
project(id:"trepied-trepied-ca", idType:SLUG){databaseId languageCode translations{…}} → {498,"en",translations:[]}
projects(first:100, where:{language:"fr"}) → []      language:"en" → 498, 224, 270
```
- No project has a FR/ES translation yet, so only the "missing" case is proven. The positive case needs
  H2. This is the same limitation Phase 1 V6 had for non-front pages.

**F4 — WPML points FR/ES image fields at the attachment copies, and those copies have stale size lists**
(home, all ACF groups, `node{databaseId languageCode mediaDetails{sizes{name}}}`):
```
en: hero img #463/en/5 sizes · bg #52/en/11 · finalCta bg #52/en/11 · footer icon #332/en/9 · leadMagnet file #484/en
fr: hero img #464/fr/5       · bg #53/fr/7  · finalCta bg #53/fr/7  · footer icon #333/fr/9 · leadMagnet file #485/fr
es: hero img #465/es/5       · bg #54/es/11 · finalCta bg #54/es/11 · footer icon #334/es/6 · leadMagnet file #486/es
#52 vs #53 sizes: EN-only [mobile-scale, tablet-scale, desktop-scale, avatar]; sourceUrl identical (/wp-content/uploads/2025/08/hero-background.png)
```
- `WpResponsiveImage` builds `srcSet` from `mediaDetails.sizes` (`atoms/WpResponsiveImage/index.tsx:44-107`), so
  FR would ship a smaller `srcSet`.
- `MediaItem` has `language languageCode translationGroupId translations`.
- Test of `backgroundImage{node{… translations @include(if:$alt){databaseId languageCode sourceUrl altText mediaDetails{width height sizes{name}}}}}`:
```
en alt=false  563 B  node 52 en 11 sizes                       (no translations requested)
fr alt=true  1465 B  node 53 fr 7 sizes   tr 52 en 11 sizes · tr 54 es 11 sizes
es alt=true  1465 B  node 54 es 11 sizes  tr 52 en 11 sizes · tr 53 fr 7 sizes
fr alt=false  472 B  node 53 fr 7 sizes
```
  So `@include` works in this WPGraphQL, the EN original is reachable in the same request, and EN requests
  can skip it entirely.

**F5 — FR/ES home content today** (Phase 1 proof of concept):
- FR `heroTitle` = `"[FR TEST] Attract More Aligned Clients Online"`.
- ES `heroTitle` = `"[ES TEST] Attract More Aligned Clients Online."`, with the trailing period accepted in
  Phase 1 (D-a).
- All other FR/ES fields are copies of the EN values: subtitle, CTA, about, featured services, 4
  testimonials, lead magnet, final CTA, footer.

**F6 — `pageBy` is deprecated** (`__type(name:"RootQuery"){fields(includeDeprecated:true)}` →
`pageBy.isDeprecated: true`).
- It is used by `Hero/api.ts` and by `HeroLoader.tsx`, which interpolates `pageUri` into the query string:
  `pageBy(uri: "${pageUri}")`.
- Phase 1 V6: `page(id:"fr/…", URI)` and `pageBy(uri:"fr/…")` resolve to **EN**. URI lookups cannot be localized.

**F7 — Every CMS fetch today** (`grep fetchWPGraphQL` + callers). "S" = server component, "C" = client
(`useEffect` through `/api/wp-graphql`).

| Fetcher | Query root | Caller |
|---|---|---|
| `[locale]/about-magneto/api.ts` `getAboutPageData` | `page(id:"about-magneto",URI)` | page + generateMetadata (S) |
| `[locale]/contact/api.ts` `getContactPageData` | `page(id:"contact",URI)` | page (S) |
| `[locale]/packages/api.ts` `getPackagesPageData` | `page(id:"packages",URI)` | page (S) |
| `[locale]/projects/api.ts` `getProjectsPageData` | `page(id:"projects",URI)` | page (S) |
| `[locale]/services/api.ts` `getServicesPageData` | `page(id:"services",URI)` | page (S) |
| `[locale]/projects/[slug]/api.ts` `getProjectBySlug` (`cache`) | `project(id,SLUG)` | page + generateMetadata (S) |
| `GET_PROJECTS` (`src/data/projects.ts`, `gql`, `projects(first:12)`) | inline `fetchWPGraphQL` | `[locale]/page.tsx`, `[locale]/projects/page.tsx`, `[slug]` `generateStaticParams`, `sitemap.xml/route.ts` (S) |
| `HeroLoader.tsx` (inline query, not in an `api.ts`) | `pageBy(uri:"${pageUri}")` | 6 pages (S); home passes `pageUri="/"` |
| `Hero/api.ts` `getHomeHero` | `pageBy(uri:"home")` | `HeroWithData` (C) and `loadHomeHero`. **Neither is imported anywhere.** |
| `AboutSection/api.ts` `getHomeAboutSection` | `page(id:"home",URI)` | `AboutSection` (S, home) |
| `FeaturedServices/api.ts` `getHomeFeaturedServices` | same | `FeaturedServicesLoader` (S, home) |
| `Testimonials/api.ts` `getHomeTestimonials` | same | `[locale]/page.tsx` (S; the result is mapped but not rendered); `TestimonialsLoader` (imported nowhere) |
| `FinalCTASection/api.ts` `getHomePrefooter` | same | `FinalCTASectionLoader` (S, layout); `FinalCTASection` fallback (C) |
| `LeadMagnetSection/api.ts` `getLeadMagnetSection` | same | `LeadMagnetSection` (C, layout) |
| `Footer/api.ts` `getHomeFooter` | same | `FooterLoader` (S, layout) |
| `Header/api.ts` `getHomeHeader` | same | `Header` (C). The result never changes the output: `setLogoUrl(logoUrl \|\| logo \|\| default)` ignores `data` |
| `PackagesGrid/api.ts` `getHomePackages` | `homePackages` (**does not exist**) | `PackagesGridWithData` (C), imported nowhere |
| `PreFooter/api.ts` `getHomePrefooter` | `homePrefooter` (**does not exist**) | imported nowhere |

The remaining `api.ts` files (`CalendlyButton`, `IconComponent`, `ServiceIcon`, `WpResponsiveImage`,
`PackageCard`, `ServiceCard`, `ProjectDetail`, `ProjectsGrid`, `TestimonialCard`) are placeholders that don't
call the CMS. Out of scope.

**F8 — `ProjectData`** (`src/data/projects.ts:1`):
- It declares `id: number` and `gallery?: string[]`.
- `[slug]/page.tsx` builds `id: string` and gallery objects `{image, footNote, isMobileScreenshot}`, then casts
  `as unknown as ProjectData` (`:66`).
- `ProjectDetail/index.tsx:101` maps the gallery as `(img: any)` and branches on `typeof img === 'string'`.
- `ProjectDetail/types.ts` and `index.tsx` import `ProjectData`; nothing else does.

**F9 — Zero projects.** `ProjectsGrid` (`index.tsx:24-40`) already renders an empty-state block when the list is
empty and the locale-stripped path is `/projects`. Elsewhere (the home grid) it renders nothing.
`[locale]/projects/page.tsx` hides the intro text when there are 0 projects. The empty-state strings are
hardcoded EN (Phase 4).

**F10 — Caching today.**
- `fetchWPGraphQL` → `fetch(POST, { next: { revalidate: 60 } })` (`utils/wp-graphql.ts:33-40`); the
  browser path goes through the `force-dynamic` proxy with `no-store`.
- `[locale]/layout.tsx` `generateStaticParams` returns the enabled locales.
- `[slug]` `generateStaticParams` takes no params and returns EN slugs for every locale.
- No `revalidateTag`/`revalidatePath`, and no module-level data caches.

## Assumptions and open questions
- **A1 — Data cache keys.** Next 15's data cache key for a `fetch` includes method and body, so the same query
  with `language:"fr"` and `language:"en"` is cached separately. The Dev proves it in V5 (alternating
  requests); if not, stop and report.
- **A2 — Translated project slugs.** A FR/ES project translation can keep the EN slug, as pages do (F2). H2
  proves it. If WPML forces a suffix (e.g. `-2`), Mauricio sets the slug to the EN one by hand. If WordPress
  refuses, **stop**: strategy P-B needs revisiting (see D1).
- **A3 — Empty static params.** Next 15.5 accepts an empty `generateStaticParams` result for
  `[slug]` under `fr` (no prerender; on-demand → 404). The Dev confirms it in the build output.
- **Open:** none. The decisions below carry recommendations.

## Sequence (approved)
1. **Dev:** V0 baselines (Acceptance criteria, V0 a–d). No code changes before V0 is reported.
2. **Mauricio:** H1 + H2 (below), DB export before and after, local only.
3. **Dev:** implement, then run the remaining acceptance checks. If `phase-3-mauricio-notes.md` reports a slug
   problem (A2), stop before implementing and report.

## Human steps (Mauricio, local CMS only, after V0)
Agents never write to the CMS. Do these **after** the Dev reports V0. First run `wp db export` into
`~/magneto-backups/phase-3-before-<time>.sql` (as in Phase 1, `docs/ai/WP-SETUP.md`).

- **H1 — FR translation of the page `projects`** (≈5 min). Pages → Projects → WPML "+" for Français, in the
  native editor (ADR 0001 workflow).
  - Slug: `projects` (same as EN).
  - `heroTitle` = `[FR TEST] ` + the EN hero title.
  - Leave the other fields as copied.
  - Publish.
  - Needed for "/fr/projects → empty state": FR has 0 projects.
- **H2 — ES translation of the project `trepied-trepied-ca`** (≈5–10 min). Same flow.
  - Slug: **`trepied-trepied-ca`**, the EN slug; fix it by hand if WPML suggests another.
  - Title = `[ES TEST] ` + the EN title.
  - Leave the other fields as copied.
  - Publish.
  - Proves the positive case for project-by-slug, and gives the ES home grid one project while FR stays at
    zero.
- Afterwards, run `wp db export` to `phase-3-after-<time>.sql`, and note both times plus anything unexpected
  (slug suggested, fields not copied) in `docs/reports/phase-3-mauricio-notes.md`. The Dev folds this file
  into the report and deletes it.

## Design

### 0. Locale → WordPress variables: `src/i18n/wp.ts` (new, pure)
```ts
/** WPML language code for a frontend locale (same codes today; one place if they ever differ). */
export function toWpLanguage(locale: Locale): string;
/** Variables every localized query takes. mediaOriginal = locale !== DEFAULT_LOCALE (see section 3). */
export function wpLocaleVars(locale: Locale): { language: string; mediaOriginal: boolean };
```

### 1. Fetch method: Phase 1 strategy B, for pages and projects (D1)
- **Pages:** `page(id:"<slug>", idType: URI){…}` → `pages(first: 1, where: { language: $language, name: "<slug>" }) { nodes {…} }`.
  The node selection is **unchanged** apart from the media fragment (section 3). The mapper reads
  `nodes[0] ?? null`.
- **Projects, one by slug: P-B.**
  `projects(first: 1, where: { language: $language, name: $slug }) { nodes { …same fields… } }`.
  `getProjectBySlug(slug, locale)` stays wrapped in `cache()`; its key now includes the locale.
- **Projects, list:** `GET_PROJECTS` gains `where: { language: $language }` (`first: 12` stays, as Known debt).
  It is declared with `$language: String` (nullable) and `$mediaOriginal: Boolean = false`. **Omitting both gives
  today's EN result** (F3 "no language → EN"), so `sitemap.xml/route.ts` stays untouched (Phase 7).
- Project-by-slug options compared:

| | P-A `project(id:$slug, SLUG){ …, translations{ …all fields… } }` | **P-B `projects(where:{language, name})`** (recommended) | P-C `project(id:"fr/<slug>", URI)` |
|---|---|---|---|
| Correct node | Yes, picked in code from `translations` | Yes (F3: EN ✅, missing → `[]`) | Unsafe: URI lookups fall back to EN (F6) |
| Payload | Every language, always | One language | — |
| Needs | The EN anchor to exist | Same slug per language (ADR 0003 D2, A2) | — |
| Same as pages | No | **Yes**, one pattern everywhere | — |

- **Hero:** `HeroLoader` stops building queries with string interpolation. The query moves to `Hero/api.ts`
  as `getPageHero(name: string, locale: Locale)`, using `pages(where:{language, name})` and GraphQL variables.
  - `HeroLoader` gets a required `locale` prop and keeps `pageUri`. The page name is derived in one place:
    `'/'` → `'home'`, otherwise the value as is.
  - The rendered output stays as it is today.

### 2. Missing translation: 404 (D2)
- Rule for every page route and every locale:
  - The route's own WordPress page (or project) is missing in the request language → `notFound()`.
  - A fetch **error** (network or GraphQL) keeps today's handling. It is not turned into a 404, so a CMS hiccup
    can't cache a 404 for 60 s.
- Mechanism:
  - Every page `api.ts` returns `null` when `nodes` is empty.
  - Each `page.tsx` calls `notFound()` on `null` before rendering.
  - Home has no page `api.ts`, so it uses a new cached guard, `getPageExists('home', locale)`, in
    `src/utils/wp-page.ts` (≈150 B query: `pages(first:1, where:{language, name}){nodes{databaseId}}`).
  - EN pages all exist (F2), so EN output is unchanged.
- **Layout sections** (lead magnet, final CTA, footer) read the locale's home page. If it is missing they render
  exactly what they render today for an empty result. A locale without a home page must not be enabled in the
  first place (ADR 0001 §5).
- **Projects:**
  - `/fr/projects/<slug>` with no FR translation → 404. The existing `notFound()` in `[slug]/page.tsx` now
    receives `null` per locale.
  - Zero translated projects → the existing empty state (F9), with no new code.
  - The home grid renders nothing for an empty list.
  - Nothing may throw on `nodes: []` or `projects: null`: map from `?? []`.

### 3. Media: always the EN original (D3)
- One shared GraphQL fragment string and one pure resolver live in **`src/utils/wp-media.ts`** (new):
```ts
export const MEDIA_NODE_FIELDS = `sourceUrl altText mediaDetails { width height sizes { name width height sourceUrl } }`;
// Use as: image { node { databaseId languageCode ${MEDIA_NODE_FIELDS}
//           translations @include(if: $mediaOriginal) { languageCode ${MEDIA_NODE_FIELDS} } } }
export function resolveOriginalMedia<T extends WpMediaNode>(node: T | null | undefined): T | null;
```
- `resolveOriginalMedia`: if `node.languageCode` isn't `en` and an `en` translation is present, it returns
  that translation's `sourceUrl` and `mediaDetails`, but **keeps the locale copy's `altText`**, because alt
  text is translatable copy. Otherwise it returns the node unchanged, minus the
  `translations`/`languageCode`/`databaseId` helper fields, so mappers see today's shape.
- Each existing image selection keeps its own subfields. Some don't request `altText` or `width`, and that
  stays as it is. The Dev adds only
  `databaseId languageCode translations @include(if:$mediaOriginal){ languageCode <same subfields> }`, so
  EN responses (where `mediaOriginal` is false) carry just two extra scalars, which the resolver strips.
- Every mapper passes media nodes through `resolveOriginalMedia`. Covered: hero image and background,
  final-CTA bg, footer icons, featured-service icons, services icons and images, package icons, testimonial
  thumbs, about/contact featured images, project featured image and gallery.
- The lead-magnet file link (`ctaLinkLeadMagnetSection`) is a file, not an image. Its `guid`/REST lookup
  already returns the shared file URL (F4: same uploads path), so it is out of the resolver's scope.
- Rejected alternatives:
  - Re-syncing the copies' metadata in WordPress: a CMS write to repeat in production, and it recurs
    whenever image sizes change.
  - A second request for EN media: extra latency, and it relies on the EN page existing.

### 4. Threading `locale`
- Every CMS fetcher takes `locale: Locale` as its **last required** argument, passes `wpLocaleVars(locale)`
  as variables, and declares `$language: String, $mediaOriginal: Boolean!`. There is no default value, so a
  missing locale is a type error (ADR 0001 §4).
- Pages read `const { locale } = await params` and narrow it with `isLocale` (fallback `DEFAULT_LOCALE`,
  the layout's pattern). The same applies to `generateMetadata` where it fetches (about, project).
- Components that fetch get a required `locale: Locale` prop:
  - `AboutSection`, `FeaturedServicesLoader`, `FinalCTASectionLoader`, `FinalCTASection` (client fallback),
    `FooterLoader`, `LeadMagnetSection` (client) and `HeroLoader`. (`TestimonialsLoader` is deleted, section 6.)
  - The layout passes its `locale` to the three layout sections.
  - These are public-API additions that this spec allows (hard rule 5).
- Client fetches (`LeadMagnetSection`, the `FinalCTASection` fallback) still go through `/api/wp-graphql`;
  the locale travels in the GraphQL variables.

### 5. Caching / ISR per locale (no mixing)
- Per-locale isolation comes from three things:
  - Each prerendered path is its own ISR entry (`/en/x` ≠ `/fr/x`).
  - The data cache key includes the request body, which now holds `language` (A1).
  - React `cache()` keys include the `locale` argument.
- `[slug]` `generateStaticParams({ params: { locale } })` returns only the slugs that exist **in that locale**
  (`getProjects(locale)`). FR currently gets `[]` (A3).
- There are no module-level caches, and none may be added. `revalidate: 60` stays as it is.

### 6. Debt paid in this phase (D5)
- **`ProjectData`:** redefine it in `src/data/projects.ts` to the real shape (`id: string`, gallery items
  `{ image: string | null; footNote: string; isMobileScreenshot: boolean }`, string arrays). Keep only the
  fields `ProjectDetail` reads.
  - Remove the cast and its comment in `[slug]/page.tsx`.
  - Type the gallery map in `ProjectDetail/index.tsx` and drop the dead `typeof img === 'string'` branches.
    The output stays identical, since items were always objects.
- **Dead CMS code removed:**
  - `PackagesGrid/api.ts` and `PackagesGridWithData` (+ their imports).
  - `PreFooter/api.ts`.
  - `Hero/HeroWithData.tsx`, `loadHomeHero` and `getHomeHero`, all unused (F7); `getPageHero` replaces them.
  - `Testimonials/TestimonialsLoader.tsx`, imported nowhere (F7). `getHomeTestimonials` stays (called by
    `[locale]/page.tsx`) and gets `locale`.
  - The logo fetch in `Header` (the `useEffect` + `Header/api.ts` query), **only if it has no visible effect.**
    Proof: V0(b) HTML and V0(c) screenshots vs the after-capture, both identical, plus the browser console and
    network on `/` showing the request gone and nothing else changed. If any difference appears, keep the fetch,
    thread `locale` into it instead, and report.
  - Before deleting, the Dev re-greps each symbol and pastes the zero-hit output in the report.
- Untouched debt: `projects(first:12)`, `@apollo/client`/`gql` in `src/data/projects.ts` (the tag stays),
  `dangerouslySetInnerHTML`, `any`s outside the touched lines.

### 7. Tests (Vitest, `vi.mock('@/utils/wp-graphql')`, next to the code)
- `src/i18n/wp.test.ts`: `toWpLanguage` for 3 locales; `wpLocaleVars('en')` → `mediaOriginal:false`; `fr`/`es` → `true`.
- `src/utils/wp-media.test.ts`:
  - FR node with an EN translation → EN `sourceUrl`/`mediaDetails` and FR `altText`.
  - EN node → unchanged and helper fields stripped.
  - FR node without translations → itself.
  - `null` → `null`.
- `src/utils/wp-page.test.ts`: `getPageExists` → true / false on `nodes:[{…}]` / `[]`, with the variables asserted.
- One test file per localized fetcher, or extend the existing ones. At minimum `[slug]/api.test.ts` (updated),
  `[locale]/projects/api.test.ts`, `about-magneto/api.test.ts`, `Hero/api.test.ts` and `Footer/api.test.ts`. Each
  asserts:
  - (a) the variables sent for `fr` (`{language:'fr', mediaOriginal:true}`) and for `en`
  - (b) `null` on `nodes: []`
  - (c) the mapper output on a recorded fixture, trimmed from the F2/F4 responses
  - `[slug]` also asserts that `getProjectBySlug('x','fr')` and `('x','en')` are separate calls.
- The other fetchers follow the same pattern; the Dev covers them where it's cheap, and the report lists
  which.

## Files the Dev may touch
- New:
  - `src/i18n/wp.ts`, `src/i18n/wp.test.ts`
  - `src/utils/wp-media.ts`, `src/utils/wp-media.test.ts`
  - `src/utils/wp-page.ts`, `src/utils/wp-page.test.ts`
  - fetcher test files next to the `api.ts` files listed below
- Pages:
  - `src/app/[locale]/page.tsx`
  - `src/app/[locale]/{about-magneto,contact,packages,projects,services}/page.tsx` and their `api.ts`
  - `src/app/[locale]/projects/[slug]/{page.tsx,api.ts,api.test.ts}`
  - `src/app/[locale]/services/ServicesList.tsx`, only if the services image shape needs the resolver
  - `src/app/[locale]/layout.tsx`: pass `locale` to the 3 sections only
- Components:
  - `src/components/organisms/Hero/{HeroLoader.tsx,api.ts,index.tsx}`; delete `HeroWithData.tsx`
  - `src/components/organisms/{AboutSection,FeaturedServices,FinalCTASection,Footer,LeadMagnetSection,Testimonials}/`:
    `api.ts`, the loader/component that calls it, `types.ts`; delete `Testimonials/TestimonialsLoader.tsx`
  - `src/components/organisms/Header/{index.tsx,api.ts,types.ts}`: remove the logo fetch (proof required, section 6)
  - `src/components/organisms/PackagesGrid/{index.tsx,api.ts}`: remove `PackagesGridWithData` and the dead api
  - `src/components/organisms/PreFooter/api.ts`: delete
  - `src/components/organisms/ProjectDetail/{index.tsx,types.ts}`: gallery typing
- `src/data/projects.ts`: the `ProjectData` type + `$language`/`$mediaOriginal` in `GET_PROJECTS`
- Docs:
  - `docs/adr/0004-localized-data.md`: new; D1–D4 as approved, D4 referencing ADR 0003 D2. Same format as ADR 0003
  - `AGENTS.md`:
    - "Where text lives": the fetch method
    - Known debt: remove the `ProjectData` and `homePackages`/`homePrefooter` lines
    - keep it < 200 lines
  - `docs/reports/phase-3-localized-data.md`
  - `CLAUDE.md` "Current phase" line, at the close

Out of scope, notably: `sitemap.xml/`, `robots.txt/`, `src/app/api/**`, `src/pages/**`, `middleware.ts`,
`src/i18n/{config,paths,routing}.ts`, `next.config.ts`, `package.json`, and every `generateMetadata` text or
SEO field (Phase 7).

## Out of scope
- UI microcopy, including the EN empty-state text on `/fr/projects` and labels like "Solution:" / "Recent
  Projects" (Phase 4). This is the one place EN text appears under `/fr`. It is local only, since production
  stays EN-only (ADR 0003 D3).
- Localizing internal links (Phase 4). The ES home grid's project link still points to `/projects/<slug>`.
- SEO: localized `<title>`/description, `openGraph.locale`, `hreflang`, sitemap (Phase 7).
- Real FR/ES copy (Phase 5). The H1/H2 markers are test fixtures.
- The `projects(first:12)` limit, `@apollo/client`, a custom 404 page.

## Acceptance criteria

**V0 — "Before" (HEAD `d0c09c4`, worktree, `next build && next start -p 3100`, `:3000` untouched), before H1/H2:**
- (a) Statuses for the Phase 2 V1 URL list.
- (b) Normalized SSR HTML (Phase 2 normalization) of the 7 EN routes + `/carte`, built **twice**: with
  `ENABLED_LOCALES=` and with `ENABLED_LOCALES=en,fr,es`.
- (c) 375/768/1440 screenshots of the 8 EN routes (locales off).
- (d) The Phase 1 Appendix A EN SHA-256, so the check after H1/H2 can prove EN content didn't change.

**Then:**
- [ ] H1/H2 done by Mauricio with before/after DB exports. The EN SHA-256 is unchanged after them (V0d).
- [ ] **Completion gate passes:** `npm run lint && npm run typecheck && npm test -- --run && npm run build`.
  - Lint ≤ 164 errors / 118 warnings, with 0 errors in new files and no new `no-explicit-any`.
  - Typecheck green **without** `as unknown as` in `[slug]/page.tsx`.
- [ ] **New and updated tests pass** (section 7); the report lists the count per file.
- [ ] **EN byte-identical:** normalized SSR HTML of the 7 routes + `/carte` equals V0(b) for **both** builds
  (locales off and on). Statuses equal V0(a). Screenshots are pixel-identical to V0(c).
- [ ] **FR/ES content** (`ENABLED_LOCALES=en,fr,es`, `next start`):
  - `/fr` → 200; HTML contains `[FR TEST] Attract More Aligned Clients Online` and no `[ES TEST]`.
  - `/es` → 200; HTML contains `[ES TEST] Attract More Aligned Clients Online` (with the accepted trailing
    period) and no `[FR TEST]`.
  - `/` contains neither marker.
  - `/fr/services`, `/fr/packages`, `/fr/about-magneto`, `/fr/contact`, `/es/services`, `/es/projects`,
    `/es/contact` → **404**.
  - `/fr/projects` → **200** with the empty-state block and the `[FR TEST]` hero (H1), with no error in the server log.
  - `/fr/projects/trepied-trepied-ca` → 404; `/es/projects/trepied-trepied-ca` → 200 with `[ES TEST]` in `<h1>` (H2).
  - The `/es` home grid shows exactly 1 project; the `/fr` home grid renders nothing, with no crash.
- [ ] **Media from EN:**
  - On `/fr` and `/es`, every `src`/`srcset` URL of the hero, background, final-CTA and footer images equals
    the one on `/`.
  - The `srcset` entry counts match EN (e.g. the background has all 11 EN sizes, not FR's 7).
  - `alt` values come from the locale copy (today equal to EN, F5).
- [ ] **No locale mixing (A1):**
  - With one `next start`, request `/`, `/fr`, `/es`, `/`, `/fr` in sequence, then again after 65 s (ISR
    window). Each response keeps its own marker or no marker, and the server shows no errors.
  - In the build output, `[slug]` lists 3 EN paths, 0 FR paths and 1 ES path.
- [ ] **No hydration warnings** on `/`, `/fr`, `/es`, `/fr/projects` (headless console, as in Phase 2 V3).
- [ ] **No URI lookups left:** `git grep -n -E "pageBy\(|page\(id:|idType: ?(URI|SLUG)" -- src` → 0 hits outside
  comments. Every `fetchWPGraphQL(` call is in an `api.ts` or `src/utils/wp-page.ts`, except `sitemap.xml`
  (out of scope).
- [ ] **Dead code gone:** the zero-hit greps for `getHomePackages`, `PackagesGridWithData`, `homePrefooter`,
  `HeroWithData`, `loadHomeHero`, `getHomeHero`, `TestimonialsLoader` (and `getHomeHeader` if removed) are pasted
  in the report, with the Header before/after proof from section 6.
- [ ] **Release process** (`docs/ai/WORKFLOW.md`) on the PR's **Vercel preview** before merge, with
  `ENABLED_LOCALES` unset there:
  - the main routes → 200
  - `/esto-no-existe` and `/projects/no-existe` → 404
  - one project page → 200
  - `/fr` → 404
  - EN home shows `Attract More Aligned Clients Online`
  - Mauricio records the result in the PR.
- [ ] `.env.local` not edited; no secret printed; no agent write to the CMS; `cms.magnetomarketing.co` never queried.

## Decisions (resolved — 2026-10-24)
All approved by the Senior Architect. The Dev writes D1–D4 as **`docs/adr/0004-localized-data.md`**:
- **D1 — Fetch method:** `pages`/`projects(where:{language, name})` for every localized read (Phase 1 V6 B,
  P-B for projects). URI lookups (`page(id,URI)`, `pageBy`, `project(id,SLUG)`) are no longer used for
  content.
- **D2 — Missing translation → 404,** in every locale, for the route's own page or project. Layout sections
  render their existing empty output. Fetch errors are not 404s. This settles what ADR 0001 left open (and the
  `.claude/rules` "define the fallback" item). The alternative, EN with a visible notice, would put EN under
  `/fr`, which ADR 0001 rejects.
- **D3 — Media from the EN original** via `translations @include(if:$mediaOriginal)` +
  `resolveOriginalMedia`, keeping the locale's `altText`. WPML media copies are treated as alt-text
  carriers only.
- **D4 — Content rule for Phases 5/6:** every FR/ES translation keeps the **EN slug** (pages and projects).
  Phase 5's WP-CLI loader must set it explicitly. Phase 6's QA script fails if a translation's slug differs
  from its EN source. This applies **ADR 0003 D2** (EN slugs in every locale). If localized slugs come later
  (ADR 0003 D2 Revisit), the mapping goes through the single path helper `src/i18n/paths.ts`, and D1 needs a
  slug map, which goes in its own ADR.
- **D5 (no ADR, scope):** delete the dead code listed in section 6: `HeroWithData`, `loadHomeHero`/`getHomeHero`,
  `TestimonialsLoader`, `homePackages`, `homePrefooter`, and the Header CMS fetch only with the before/after
  proof.
- **Accepted:** the EN empty-state copy under `/fr/projects` until Phase 4 (local only).

## Notes for later phases
- **Phase 4:** the empty-state strings, the grid labels and the internal links (`localizePath`) under
  `/fr` and `/es`.
- **Phase 5:**
  - Remove every `[FR TEST]` / `[ES TEST]` marker, including H1's and H2's.
  - Load copy with the same slugs (D4).
  - Media alt text is loaded on the locale copies.
- **Phase 6:** the QA script checks the D4 slug rule and the markers, and checks that FR/ES fields aren't
  equal to EN (the Phase 1 note).
- **Phase 7:** sitemap per locale. `GET_PROJECTS` already accepts `$language`.

## Estimate
- Mauricio:
  - 25–40 min: review; H1 + H2 with two DB exports (≈15 min); add the preview check to the PR.
- Dev (agent):
  - 4–6 h: about 20 files, the shared media/page helpers, tests, and V0 + the after-captures in two env
    builds.
  - +1 h if A1 or A2 fail and need investigation.
