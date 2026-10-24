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

---

## Directory map

```
src/
├── app/                 App Router pages. Each route has page.tsx + api.ts (query + mapper)
│   └── api/wp-graphql/  Server proxy for browser GraphQL calls
├── pages/api/           API routes only: contact, mailchimp, download, download-check
├── components/
│   ├── atoms/ molecules/ organisms/   Atomic design. Each: index.tsx, api.ts, types.ts, .scss
├── hooks/  utils/       utils/wp-graphql.ts = the only GraphQL helper (fetchWPGraphQL)
├── data/                Small static data
└── styles/              Global SCSS: variables, mixins, typography, components, pages
```

### Where text lives today

| Route | Source |
|---|---|
| `/` | `pageBy(uri: "home")` — ACF groups `heroContent`, `homeAboutSection`, `homeTestimonialsSection`, `leadMagnetSection`, `finalCtaSection` |
| `/services` `/packages` `/projects` `/about-magneto` `/contact` | `page(id: "<slug>", idType: URI)` + ACF |
| `/projects/[slug]` | projects CPT |
| Header / Footer | their own `api.ts` |
| UI microcopy (buttons, labels, form errors, aria-labels) | hardcoded in components — to be extracted |

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
- `eslint.ignoreDuringBuilds: true`; lint baseline 136 errors / 118 warnings (after Phase 0.5b).
- `README.md` structure outdated (`about/`, `portfolio/`).

Code
- `projects(first: 12)` (`GET_PROJECTS`) still used by `sitemap.xml/route.ts`, `projects/page.tsx`
  (grid), `app/page.tsx` (home) and `projects/[slug]` `generateStaticParams`. Projects past 12
  are missing from the sitemap and the grid.
- `PackagesGrid/api.ts` (`homePackages`) and `PreFooter/api.ts` (`homePrefooter`) query ACF groups that
  don't exist in the schema. Both are dead code: `PackagesGrid` is rendered by `/packages` with props from
  `app/packages/api.ts`, and `getHomePackages` is only called by `PackagesGridWithData`, which nothing
  imports; `PreFooter/api.ts` is never imported (`FinalCTASection` has its own `api.ts`). Phase 3.
- `images.domains` (deprecated) duplicates `images.remotePatterns` in `next.config.ts`.
- `ProjectData` type doesn't match the real CMS data (`id` is a string, gallery items are
  objects); `projects/[slug]/page.tsx` uses a commented `as unknown as ProjectData` cast. Fix
  the type when Phase 3 touches the project `api.ts`.
- `LeadMagnetSection/api.ts`: an outer try/catch swallows the missing-env-var error, so the
  section silently renders nothing instead of failing loudly. Accepted while the lead magnet
  stays hidden (pending new guide copy); fix when the section is rebuilt.
- Vitest uses the classic JSX runtime; `CalendlyButton.test.tsx` sets `globalThis.React`. Fix
  with an automatic-JSX setting in `vitest.config.ts` in a tooling phase.
- `@apollo/client` used only in `src/data/projects.ts`; `graphql-request` unused.
- 6 files use `dangerouslySetInnerHTML`; only `ProjectDetail` sanitizes with DOMPurify.
- 122 `no-explicit-any` (102 outside test files).
- Locale hardcoded `en_US` / `lang="en"` in `app/layout.tsx` (replaced by i18n work).
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
