---
paths:
  - "src/**/api.ts"
  - "src/utils/wp-graphql.ts"
  - "src/app/api/wp-graphql/**"
  - "src/i18n/**"
  - "src/middleware.ts"
---

# WordPress / WPGraphQL / WPML rules

Loaded when working on data fetching or i18n. Lessons carried over from the Dangel
project (WPGraphQL + ACF + WPML) — treat them as hypotheses to verify here, not facts.

## Verify before you query

- **Inspect the real local schema first** (WP admin → GraphQL IDE at
  `http://magneto-cms-2.local/wp-admin`). Never write a field from memory or another project.
- A single non-existent field makes the **whole query** fail. Add fields one at a time
  and run the query in the IDE before putting it in code.
- ACF names: WPGraphQL converts `snake_case` to `camelCase`, and lowercases after an
  acronym (`fg_faq` → `fgFaq`). A field group's custom `graphql_field_name` overrides the
  automatic name. Check the field's **Name** column, not its Label.
- ACF repeaters come back as plain arrays (`items || []`), not wrapped in `nodes`.
- Text fields may be wrapped in `<p>` by wpautop. Textareas contain `\n`
  (use `white-space: pre-line`).

## WPML

- Plugin here: **WPML GraphQL** (OnTheGoSystems). In Dangel the language argument was
  `$language: LanguageCodeFilterEnum` with uppercase codes (`EN`, `FR`, `ES`). **Confirm
  the argument names and enum values in this schema before using them.**
- Language codes: `en` (default), `fr` (locale `fr_CA`), `es`. The URL segment is the
  short code; `hreflang` uses `en`, `fr-CA`, `es`.
- Media is not translated (expected). ACF fields translate per the ACFML setting on
  each field group — check it before assuming a field differs per language.
- A missing translation must not silently show EN content under `/fr` or `/es`.
  Define the fallback in the spec (404, or EN with a visible notice) and test it.

## Fetching

- All calls go through `fetchWPGraphQL` (`src/utils/wp-graphql.ts`). Do not add a second client.
- Browser calls go through `/api/wp-graphql` (server proxy). Do not call the CMS from the client directly.
- `locale` is an explicit parameter of every `api.ts` function. No hidden global.
