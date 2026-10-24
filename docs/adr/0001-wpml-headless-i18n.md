# ADR 0001 — Trilingual site with WPML (headless) and locale-prefixed routes

- Status: Accepted
- Date: 2026-10-24
- Deciders: Mauricio (lead), Senior Architect

## Context

The site is English-only. Approved copy exists for EN, FR-CA and ES. Page content lives
in WordPress ACF fields read through WPGraphQL; UI microcopy is hardcoded in components.
A WPML license is available, and WPML + WPGraphQL was already used on Dangel.
Unlike Dangel (a single page, `?lang=` query param), Magneto has several pages that
should be indexed per language.

## Decision

1. **CMS translations with WPML + ACFML + WPML GraphQL.** Each page has EN/FR/ES
   versions; ACF fields are translated per field group.
2. **Locale in the URL path.** EN stays unprefixed (existing URLs and SEO unchanged);
   French at `/fr/...`, Spanish at `/es/...`.
3. **UI microcopy in typed dictionaries in code** (`src/i18n/`), no i18n library unless a
   later spec proves the need.
4. **Every `api.ts` takes `locale` explicitly.**
5. A locale appears in the switcher only when complete and QA-ready.

## Consequences

- + Same plugin stack as Dangel; known pitfalls are documented in `.claude/rules/`.
- + Crawlable URLs per language → proper `hreflang` and canonical.
- − WPML GraphQL schema must be verified here (different plugin than Dangel may expose
  different args).
- − Plugin and settings changes must be repeated in production → tracked in
  `docs/ai/WP-SETUP.md`.
- − Routing change touches every route; done in its own phase with EN regression checks.

## Alternatives considered

- Polylang + WPGraphQL Polylang — free, but third-party GraphQL integration and no
  prior experience in this codebase.
- `?lang=` query param (Dangel pattern) — simpler, weaker for multi-page SEO.
- All copy in code JSON — removes CMS editing, which the site relies on.
