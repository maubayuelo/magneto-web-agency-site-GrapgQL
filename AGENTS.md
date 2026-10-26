# AGENTS.md

Instructions for AI coding agents working in this repository.
Read this file first. Keep it short (target < 200 lines) — it is loaded into every
session through the `@AGENTS.md` import in `CLAUDE.md`.

Human-facing explanation: `README.md` (partly outdated — trust the code).
Decisions: `docs/adr/`. Workflow and roles: `docs/ai/WORKFLOW.md`.

---

## Project

Magneto — solo web agency site (Montréal). Next.js frontend reads a headless
WordPress through WPGraphQL + ACF. Current goal: **trilingual EN / FR-CA / ES**
without changing the approved EN experience.

- Frontend: Vercel, deployed from `main`.
- CMS (production): `https://cms.magnetomarketing.co/graphql` (SiteGround).
- CMS (local): `http://magneto-cms-2.local/graphql` (Local by WP Engine/Flywheel).

---

## Stack

Next.js 15 (**App Router for pages**, **Pages Router only for `src/pages/api/*`**) ·
React 19 · TypeScript · SCSS (BEM-style, kebab-case) · WPGraphQL + ACF PRO ·
WPML + WPML GraphQL · Vitest + Testing Library + jsdom.

Exact versions live in `package.json`. Read it rather than trusting a number here.

**Keep the router split.** Do not move API routes to `app/`, and do not add pages to
`pages/`. If a task seems to need it, stop and ask.

---

## Commands and the completion gate

```bash
npm run dev          # localhost:3000 — requires Local WP running
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm test -- --run    # vitest, single run
npm run build        # next build
```

**Completion gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build`.

- `next.config.ts` sets `eslint.ignoreDuringBuilds: true` → a green build does
  **not** mean lint passes. Always run lint separately.
- A passing `dev` server is not evidence. For any change users can see, the gate is
  necessary but not sufficient: check the touched routes in the browser at
  375 / 768 / 1440 px, in EN (no regressions) and in every enabled locale.
- Report honestly: passed / failed / not run. Pre-existing failures recorded in the
  Phase 0 baseline are not caused by your change — but say which ones you saw.
- `ALLOW_UNTRANSLATED_LOCALES=1` is for local builds only; never set it in Vercel. Without it, `next build` fails
  when `ENABLED_LOCALES` enables a locale whose dictionary still has `[FR TODO]` / `[ES TODO]` values (ADR 0005).
- **Release process:** merging does not publish, and the PR's Vercel preview check is a merge precondition.
  See `docs/ai/WORKFLOW.md` → "Release process".

---

## Directory map

```
src/
├── app/
│   ├── [locale]/        App Router pages (root layout here). Each route has page.tsx + api.ts (query + mapper)
│   │   └── [...rest]/   notFound() catch-all: /carte, /en/*, disabled locales, unknown paths
│   ├── api/wp-graphql/  Server proxy for browser GraphQL calls
│   └── robots.txt/ sitemap.xml/   Route handlers, outside [locale]
├── middleware.ts        Locale routing: EN unprefixed → internal /en; /fr /es only if enabled (ADR 0003)
├── i18n/                config.ts (LOCALES, ENABLED_LOCALES reader), paths.ts (the only locale-path mapping), routing.ts
├── pages/api/           API routes only: contact, mailchimp, download, download-check
├── components/
│   ├── atoms/ molecules/ organisms/   Atomic design. Each: index.tsx, api.ts, types.ts, .scss
├── hooks/  utils/       utils/wp-graphql.ts = the only GraphQL helper (fetchWPGraphQL)
├── data/                Small static data
└── styles/              Global SCSS: variables, mixins, typography, components, pages
```

### Where text lives today

Routes live under `src/app/[locale]/` (EN served unprefixed via the middleware). Every CMS read takes the
request `locale` and filters by language + slug (ADR 0004): `pages(first: 1, where: { language, name })`,
`projects(where: { language, name })`; never `page(id, URI)` / `pageBy` / `project(id, SLUG)` (they fall back
to EN). Missing translation → `notFound()`. Images come from the EN original (`src/utils/wp-media.ts`).

| Route | Source (WP page `name`, in the request language) |
|---|---|
| `/` | `home` — ACF groups `heroContent`, `homeAboutSection`, `homeFeaturedServices`, `homeTestimonialsSection` |
| `/services` `/packages` `/projects` `/about-magneto` `/contact` | the page with that slug + ACF (hero via `Hero/api.ts`) |
| `/projects/[slug]` | projects CPT, same slug in every language |
| Lead magnet / final CTA / footer (layout) | the locale's `home` page, their own `api.ts` |
| UI microcopy (buttons, labels, form errors, aria-labels) | `src/i18n/dictionaries/{en,fr,es}.ts`, read with `getDictionary(locale)` (server) / `useI18n()` (client) — ADR 0005 |

---

## Conventions

- camelCase in TS, kebab-case in SCSS. Follow the per-component pattern
  `index.tsx` / `api.ts` / `types.ts` / `Name.scss`.
- New WPGraphQL response shapes go in the component's `types.ts`. **No new `any`**
  (122 pre-existing per ESLint — Known debt).
- WordPress HTML must pass through `isomorphic-dompurify` before
  `dangerouslySetInnerHTML` in new code.
- Every new data fetch has loading, error and empty states.
- Accessibility is a release requirement: semantic HTML, `lang` per locale,
  labelled controls, visible focus, WCAG 2.2 AA contrast.
- New env vars: add to `.env.local.example` with a placeholder and a comment.
  `NEXT_PUBLIC_` = readable by the browser → never a secret.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`,
  `refactor:`, optional scope, e.g. `feat(i18n): …`). One concern per commit.

---

## Hard rules

Do not, without an explicit instruction saying so:

1. **Point at production.** `.env.local` must target the local CMS. The WordPress
   helpers in `utils/wordpress.ts` throw if `NEXT_PUBLIC_WORDPRESS_API_URL` is
   missing — confirm the target before any data work.
2. **Write to production** WordPress, Vercel, DNS, Calendly, Mailchimp, Brevo or SMTP.
   Locally `.env.local` must have `DISABLE_SMTP=1` (the code checks `'1'`, not `'true'`)
   and empty `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`. If not, never
   submit a form — observe only — and report it.
3. **Edit `.env.local`** or print secret values. Use placeholders.
4. **Change, rewrite or retranslate approved copy.** Canonical copy is in Notion
   (links in `docs/ai/WORKFLOW.md`). Missing copy → marked TODO + report.
5. **Change component public APIs** (props, exports) outside the current spec.
6. **Add dependencies or migrate frameworks.** Propose first, wait.
7. **Commit, push or merge.** Stage and describe the diff instead.
8. **Write files during a READ / analysis task**, except where the spec names a path.
9. **Touch anything in Known debt** or unrelated problems. Report and continue.
10. **Bulk-write WordPress content** without a fresh local DB backup (`wp db export`).

---

## Known debt (report, don't fix unless a spec says so)

Verified in the Phase 0 baseline (`docs/specs/phase-0-baseline.md`, 2026-10-24).

Toolchain / repo
- `.npmrc` and `vercel.json` use `legacy-peer-deps`.
- postcss 8.4.31 pinned inside next@15.5.28 — high advisory, fixed only by next@16 (future phase).
- `eslint.ignoreDuringBuilds: true`; lint baseline 115 errors / 110 warnings (measured 2026-10-25, after Phase 4; 149 / 110 before it).
- `@next/next/no-html-link-for-pages` counted each Header nav `<a>` once per `[locale]` variant (30 errors before Phase 4).
  The hrefs are now `localizePath(…)` expressions, which the rule can't analyse, so lint reports 0 — the plain `<a>` remain.
  Phase 4 kept plain `<a>` with `localizePath` (Decision D1); resolved when nav links move to `next/link` in a phase that
  verifies analytics with soft navigation.
- `README.md` structure outdated (`about/`, `portfolio/`).

Code
- `projects(first: 12)` (`GET_PROJECTS`) still used by `sitemap.xml/route.ts`, `projects/page.tsx`
  (grid), `app/page.tsx` (home) and `projects/[slug]` `generateStaticParams`. Projects past 12
  are missing from the sitemap and the grid.
- With ENABLED_LOCALES on, if any locale has 0 projects, Next 15.5 prerenders no project pages for any locale
  (on-demand still works). Resolves in Phase 5 when every locale has projects; Phase 5 acceptance must verify
  prerendered project paths per locale.
- `images.domains` (deprecated) duplicates `images.remotePatterns` in `next.config.ts`.
- `LeadMagnetSection/api.ts`: an outer try/catch swallows the missing-env-var error, so the
  section silently renders nothing instead of failing loudly. Accepted while the lead magnet
  stays hidden (pending new guide copy); fix when the section is rebuilt.
- Vitest uses the classic JSX runtime; `CalendlyButton.test.tsx` sets `globalThis.React`. Fix
  with an automatic-JSX setting in `vitest.config.ts` in a tooling phase.
- `@apollo/client` used only in `src/data/projects.ts`; `graphql-request` unused.
- 6 files use `dangerouslySetInnerHTML`; only `ProjectDetail` sanitizes with DOMPurify.
- 122 `no-explicit-any` (102 outside test files).
- `openGraph.locale` hardcoded `'en_US'` in `app/[locale]/layout.tsx` `generateMetadata` (Phase 7).
- Raw 404 HTML is Next 15.5's `<html id="__next_error__">` shell (no `lang`, no layout) for every runtime `notFound()`.
  The `<title>` is localized via `not-found.tsx` `generateMetadata`; `lang`, header and content arrive with hydration.
  Framework limit (Phase 4 spec E3); revisit with next@16.
- `LeadMagnetSection` is a client component rendered by the layout without a server loader and fetches in `useEffect`,
  so every SSR page ships its hardcoded fallback copy (`cmsFallback.leadMagnet.*`) and swaps in the CMS copy after
  load (Phase 4 I-9). Fix with a server loader, as for the Final CTA, when the lead magnet is rebuilt.
- Mailchimp integration (`pages/api/mailchimp.ts` + 4 components + 1 test) is to be replaced
  by Brevo — see `docs/adr/0002-brevo-replaces-mailchimp.md`. Do not extend it.

Content / CMS
- Two Calendly events live: code default `magnetomarketing/free-strategy-call`
  (`utils/calendly.ts`) vs. ACF hero CTAs on 5 pages pointing to
  `mauriciobayuelo/free-discovery-call`.
- WP page `/carte/` exists with no frontend route — it is the business-card QR target
  (`magnetomarketing.co/carte`), a planned route, not dead content.

---

## Working style

READ → PROPOSE → approval → IMPLEMENT → VERIFY → REPORT.

- One phase at a time; stop at the end of each for review.
- Show the diff before applying anything that spans more than one file.
- Ambiguous? Ask one question instead of producing a large diff to throw away.
- Smallest change that satisfies the spec.
- Comment only non-obvious constraints (WPML quirks, proxy, hydration), not the obvious.
- **Dev servers:** Mauricio often runs `npm run dev` on port 3000. Agents start their own
  server on a fixed port (`PORT=3100 npm run dev` or `next start -p 3100`), never build while
  someone else's dev server uses the same `.next`, and stop **only the PID they started** —
  never kill by port. If 3100 is busy, stop and ask.
