# ADR 0003 — Locale routing: `app/[locale]` + middleware, same slugs, env-gated locales

- Status: Accepted
- Date: 2026-10-24
- Deciders: Mauricio (lead), Senior Architect
- Spec: `docs/specs/phase-2-locale-routing.md`

## Context

ADR 0001 decided locale-prefixed routes (EN unprefixed, `/fr/…`, `/es/…`) and anticipated that the
routing change touches every route. Next 15.5 App Router has no built-in i18n routing (`next.config`
`i18n` is Pages Router only), and ADR 0001 §3 rules out new i18n dependencies without proof.

## Decision

1. **D1 Routing:** every page lives once under `src/app/[locale]/`, whose layout is the root layout
   (`<html lang>` from `params.locale`). `src/middleware.ts` rewrites unprefixed EN requests to the
   internal `/en/…` (no redirect; browser URL unchanged). `/fr/…` and `/es/…` pass through when enabled.
2. **D2 URL slugs:** the same (EN) slugs in every locale, e.g. `/fr/services`,
   `/fr/projects/trepied-trepied-ca`. Fits Phase 3's fetch strategy (keyed on the EN `name`) and keeps the
   switcher a pure path mapping.
   **Revisit:** localized slugs (e.g. `/fr/projets`) may come later for local SEO. To keep that cheap,
   **all** locale-path mapping lives in `src/i18n/paths.ts` (`splitLocalePath`, `localizePath`,
   `switchLocalePath`). No other file builds or parses a locale path by string concatenation or regex.
3. **D3 Enablement:** server-only `ENABLED_LOCALES` (comma list), fail-closed (unset → `en`), read only in
   `src/i18n/config.ts`, applied at build time (changing it needs a rebuild). Production stays unset
   until Phase 5 + QA (ADR 0001 §5).
4. **D4 `/en/*`:** 404, as before, not a 308 to the unprefixed URL. Revisit in Phase 7 (canonicalization).
5. **D5 `lang` values:** `en`, `fr-CA`, `es`. `lang` describes the copy, not the WPML locale (`es_ES`).
6. **D6 No automatic detection:** no `Accept-Language` or cookie redirects; users choose with the switcher.
   Crawlers are never redirected and EN URLs stay stable.

## Consequences

- + One route tree; `params.locale` is available to every page for Phase 3 (`api.ts(locale)`).
- + EN URLs, status codes and HTML unchanged; disabled locales 404 exactly as before.
- − Middleware runs on matched requests (Edge); the matcher excludes `api`, `_next`, `assets`,
  `robots.txt`, `sitemap.xml` and paths with a dot.
- − Server-side `usePathname()` can see the internal `/en/…` path: pathname comparisons go through
  `splitLocalePath`.
- − Changing `ENABLED_LOCALES` requires a rebuild/redeploy.

## Alternatives considered

- Route groups with duplicated trees (`(en)`, `(fr)/fr`, `(es)/es`) — no middleware, but three trees to keep
  in sync and 3 files per future route.
- `next-intl` / `next-i18n-router` — new dependencies (ADR 0001 §3).
- Locale from a request header in a single root layout — makes every page dynamic.
