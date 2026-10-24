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

1. **Point at production.** `.env.local` must target the local CMS. `wp-graphql.ts`
   and `app/api/wp-graphql/route.ts` silently fall back to production if the env var
   is missing — confirm the target before any data work.
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
- `node_modules` installed for x64 while Node runs arm64 → `vitest` cannot start
  (missing `@rollup/rollup-darwin-arm64`).
- `.npmrc` and `vercel.json` use `legacy-peer-deps`.
- postcss 8.4.31 pinned inside next@15.5.28 — high advisory, fixed only by next@16 (future phase).
- `eslint.ignoreDuringBuilds: true`; lint baseline 146 errors / 119 warnings.
- `README.md` structure outdated (`about/`, `portfolio/`).

Code
- `react-hooks/rules-of-hooks` error: `CalendlyButton/index.tsx:44` calls `useEmailModal`
  conditionally — real bug risk.
- Hardcoded production CMS fallback in 3 files: `utils/wp-graphql.ts`,
  `app/api/wp-graphql/route.ts`, `LeadMagnetSection/api.ts`.
- `images.domains` (deprecated) duplicates `images.remotePatterns` in `next.config.ts`.
- `@apollo/client` used only in `src/data/projects.ts`; `graphql-request` unused.
- 6 files use `dangerouslySetInnerHTML`; only `ProjectDetail` sanitizes with DOMPurify.
- 122 `no-explicit-any` (102 outside test files).
- Leftovers: `Hero/index.tsx.bak`, `FinalCTASection/types.ts.new`.
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
