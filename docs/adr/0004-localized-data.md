# ADR 0004 — Localized data: fetch by language + name, 404 on missing translations, EN-original media

- Status: Accepted
- Date: 2026-10-24
- Deciders: Mauricio (lead), Senior Architect
- Spec: `docs/specs/phase-3-localized-data.md`

## Context

ADR 0003 gave every page a `params.locale`; Phase 3 makes every WordPress read use it. Phase 1 (V6) showed
that URI lookups cannot be localized: `page(id:"fr/…", idType: URI)` and `pageBy(uri:"fr/…")` silently
resolve to the **EN** page, and `project(id, idType: SLUG)` takes no language argument. WPML also points
FR/ES image fields at attachment copies whose `mediaDetails.sizes` can be stale (FR background: 7 sizes vs
EN 11), and `WpResponsiveImage` builds its sources from that list. ADR 0001 left open what a locale shows
when a translation is missing.

## Decision

1. **D1 — Fetch method.** Every localized read uses the connection filter
   `pages(first: 1, where: { language: $language, name: "<slug>" })` (Phase 1 V6 strategy B), and for
   projects `projects(first: 1, where: { language: $language, name: $slug })` (P-B). The list uses
   `projects(first: 12, where: { language: $language })`. URI lookups (`page(id, URI)`, `pageBy`,
   `project(id, SLUG)`) are no longer used for content. Locale → variables lives in one place,
   `src/i18n/wp.ts` (`toWpLanguage`, `wpLocaleVars`); every fetcher takes `locale: Locale` as a required
   argument.
2. **D2 — Missing translation → 404,** in every locale, for the route's own page or project (`api.ts`
   returns `null` on `nodes: []`, the page calls `notFound()`; home uses `getPageExists('home', locale)` in
   `src/utils/wp-page.ts`). Layout sections (lead magnet, final CTA, footer) render their existing empty
   output. A fetch **error** keeps each route's previous handling and is never turned into a 404, so a CMS
   hiccup can't cache a 404. EN with a visible notice was rejected: it puts EN under `/fr`, which ADR 0001
   rejects.
3. **D3 — Media from the EN original.** Image selections add
   `databaseId languageCode translations @include(if: $mediaOriginal) { languageCode … }`
   (`mediaOriginalFields` in `src/utils/wp-media.ts`); `mediaOriginal` is true for non-EN locales only, so
   EN responses carry two extra scalars. `resolveOriginalMedia` swaps in the EN original's `sourceUrl` and
   `mediaDetails`, keeps the locale copy's `altText` (translatable copy) and strips the helper fields. WPML
   media copies are treated as alt-text carriers only. The lead-magnet file link is a file, not an image,
   and already resolves to the shared uploads URL.
4. **D4 — Content rule for Phases 5/6:** every FR/ES translation keeps the **EN slug** (pages and
   projects). This applies **ADR 0003 D2** (EN slugs in every locale) and is what makes D1's `name` filter
   work. Phase 5's WP-CLI loader sets the slug explicitly; Phase 6's QA script fails if a translation's slug
   differs from its EN source. If localized slugs come later (ADR 0003 D2 Revisit), the mapping goes
   through `src/i18n/paths.ts`, and D1 needs a slug map in its own ADR.

## Consequences

- + `/fr` and `/es` never show EN page content; EN output is unchanged (same queries' data, same HTML).
- + One query pattern for pages and projects; no string-interpolated GraphQL (HeroLoader now uses variables).
- + Images keep the EN file and its full size list in every locale.
- − GraphQL rejects declared-but-unused variables, so queries without images declare only `$language`
  (callers still send `wpLocaleVars(locale)`; undeclared variables are ignored).
- − Translations must keep the EN slug (D4) or they become unreachable.
- − `projects/[slug]` `generateStaticParams` returns per-locale slugs; on Next 15.5 an empty list for one
  enabled locale stops prerendering that route for every locale (on-demand ISR instead). See the Phase 3
  report, Q2.

## Alternatives considered

- `project(id, SLUG){ translations { … } }` (P-A) — every language's fields in every response, and it needs
  the EN anchor to exist.
- `project(id:"fr/<slug>", URI)` (P-C) and `page(id:"fr/…", URI)` — fall back to EN silently (Phase 1 V6).
- Re-syncing the WPML media copies' metadata in WordPress — a CMS write to repeat in production, and it
  recurs whenever image sizes change.
- A second request for EN media — extra latency, and it depends on the EN page existing.
