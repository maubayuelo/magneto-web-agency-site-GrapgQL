# ADR 0005 — UI microcopy: native typed dictionaries, a client provider, and the Next 15.5 raw-404 limit

- Status: Accepted
- Date: 2026-10-25
- Deciders: Mauricio (lead), Senior Architect
- Spec: `docs/specs/phase-4-ui-microcopy.md`

## Context

ADR 0001 §3 put UI microcopy in typed dictionaries in `src/i18n/`, with no library unless one proved necessary.
Phase 4 inventoried about 115 hardcoded strings: UI text, form messages, aria-labels and alt text, metadata, and
CMS fallbacks. They are split between server components and client components (Header, forms, the email modal).
Only 4 simple placeholders (`{year}`, `{n}`, `{title}`, `{status}`) appear. There are no plurals, dates or
numbers to format.

Constraints:
- the EN HTML must stay byte-identical;
- FR/ES copy does not exist yet;
- locale routing is our own middleware plus `src/i18n/paths.ts` (ADR 0003).

The 404s also showed a framework behaviour (Phase 4 spec, E2/E3). On Next 15.5.28, every runtime `notFound()`
sends a raw HTML shell `<html id="__next_error__">` with no `lang` and no layout; hydration then renders the real
tree. A minimal repro showed the same with a conventional root `app/layout.tsx`. Only requests that match no route
get full server HTML. Our middleware and `[...rest]` catch-all match every path.

## Decision

1. **Native dictionaries, no library.**
   - `src/i18n/dictionaries/{en,fr,es}.ts` are plain objects. `en` is the source.
   - `type Dictionary = typeof en`, with every leaf widened to `string`. `fr` and `es` are typed as `Dictionary`, so
     `tsc` rejects missing or extra keys, and a key-parity test checks the same thing at runtime.
2. **Access.**
   - Server components and `generateMetadata` call `getDictionary(locale)`, with `locale` from the route params.
   - Client components call `useI18n()`. Its value comes from `<I18nProvider locale dictionary>`, which
     `[locale]/layout.tsx` renders with the **current locale's dictionary only**.
   - Client files never import `getDictionary` or the FR/ES files, so other locales stay out of client bundles.
   - The locale is never taken from the pathname.
   - Outside a provider (unit tests), `useI18n()` falls back to EN.
3. **Interpolation.**
   - `format(template, vars)` is for attributes and metadata.
   - `formatParts(template, vars)` returns React children for text mixed with values. It keeps the SSR text-node
     separators (`<!-- -->`), so EN HTML doesn't change.
   - No ICU and no plural rules until a string needs them.
4. **Untranslated locales can't ship.**
   - FR/ES values start as `[FR TODO]` / `[ES TODO]` + EN.
   - During `next build` (`NEXT_PHASE === 'phase-production-build'`), `[locale]/layout.tsx` `generateStaticParams`
     calls `assertLocalesReady(getEnabledLocales())`. The build fails if an enabled locale still has markers.
   - `ALLOW_UNTRANSLATED_LOCALES=1` is a local-only override and is never set in Vercel.
5. **404s.**
   - `not-found.tsx` files render a dictionary-driven client component inside the layout. Their `generateMetadata`
     receives `params.locale`, so the raw 404 `<title>` is localized and robots is a single noindex.
   - The missing `lang` in the raw 404 shell is **accepted** as a framework limit. It is recorded in AGENTS.md Known
     debt, to revisit on next@16.

## Consequences

- + No dependency. The middleware and `paths.ts` (ADR 0003) stay the only routing logic.
- + Type and test errors on key drift. An EN fingerprint test locks every EN value byte-for-byte.
- + Placeholders can't reach production by accident (point 4).
- − Each page's RSC payload carries its locale's dictionary (≈ 5–7 KB raw).
- − The build guard relies on `NEXT_PHASE`, which Next sets internally. Re-check it when upgrading Next.
- − Raw 404 HTML has no `lang` until hydration. The status (404), noindex and the localized `<title>` are correct
  server-side.
- − If plurals or locale-aware number/date formatting are needed later, add `Intl.*` first. Revisit this ADR before
  adding a library.

## Alternatives considered

- **`next-intl`:** ICU messages and its own routing middleware. It would duplicate or replace ADR 0003's middleware
  and `paths.ts`, and it is a new dependency for 4 placeholders.
- **`i18next` / `rosetta`:** a dependency for interpolation that ~15 lines cover.
- **Passing strings as props from server parents to every client component:** many public-prop changes, and deep
  client trees (Header → CTA, modal) would need prop drilling.
- **Client components importing all dictionaries and choosing by locale:** every locale in every bundle.
- **Full server HTML for 404s:** make unknown paths "unmatched" (a middleware allow-list plus
  `experimental.globalNotFound` and `app/global-not-found.tsx`). It needs a routing ADR and an experimental flag,
  and it covers only unknown top-level paths. Unknown project slugs and missing translations still use runtime
  `notFound()`.
