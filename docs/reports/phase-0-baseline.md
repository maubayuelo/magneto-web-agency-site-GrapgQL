# Phase 0 report — Baseline

- Spec: `docs/specs/phase-0-baseline.md` (Approved with changes, 2026-10-24)
- Author: Dev · Date: 2026-10-24

## Result
Done — clean arm64 reinstall made the test suite runnable; the gate baseline below is the
reference for every later phase. Visual checks not run (no browser tool available).

## Changes
- `node_modules/` — `rm -rf node_modules && npm ci` (Decision 1, approved inside Phase 0).
  `package-lock.json` unchanged (md5 `42ab03e2c060786e260c10c65a4482ac` before and after).
- `docs/specs/phase-0-baseline.md` — review changes applied (status, `/carte/`, step 0, decisions outcome).
- `docs/reports/phase-0-baseline.md` — this report.
- No changes to `src/`, config, dependencies or `.env.local`.

## Gate

**Baseline — later phases must match or improve these numbers.**

| Check | Result | Notes |
|---|---|---|
| lint (`npm run lint`) | **failed** | 146 errors · 119 warnings · 47 files. Identical before and after reinstall. |
| typecheck (`npx tsc --noEmit`) | passed | 0 errors |
| tests (`npm test -- --run`) | passed | 2 files · 4 tests (`contact.test.ts` 2, `EmailCollectorProvider.test.tsx` 2). Before reinstall: could not start. |
| build (`npm run build`) | passed | 14 static pages; lint skipped by `ignoreDuringBuilds` |
| visual (routes · viewports · locales) | **not run — manual by Mauricio** | No browser tool available in this session; none installed (per spec). Routes 9 pages + 404 · 375 / 768 / 1440 px · EN |

Lint breakdown (baseline): `@typescript-eslint/no-explicit-any` 122 · `no-unused-vars` 92 ·
`ban-ts-comment` 13 · `react/no-unescaped-entities` 4 · `react-hooks/exhaustive-deps` 2 ·
`no-unused-expressions` 2 · `@next/next/no-html-link-for-pages` 2 · `no-empty-object-type` 1 ·
`react-hooks/rules-of-hooks` 1 (`CalendlyButton/index.tsx:44`).

HTTP smoke baseline (`npm run dev`, `curl`, no JS executed):

| Route | Status |
|---|---|
| `/` `/services` `/packages` `/projects` `/about-magneto` `/contact` | 200 |
| `/projects/trepied-trepied-ca` `/projects/shamaniccas-ecommerce` `/projects/fashion-company-ecommerce` | 200 |
| `/projects/no-existe` | 404 (expected) |
| `/carte` | 404 (expected — planned route, not built yet) |
| `/robots.txt` `/sitemap.xml` | 200 |
| `/api/ping-cms` | 500 (known debt: empty file) |

## Evidence

Environment
- `node -p process.arch` → `arm64`; Node v24.15.0, npm 11.12.1, Next 15.4.8, React 19.1.2.
- `.env.local` (names only): WordPress URL vars → `magneto-cms-2.local`; `MAILCHIMP_*`,
  `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` commented; **`DISABLE_SMTP=0`** at run time →
  no form was submitted.

Reinstall
```
rm -rf node_modules && npm ci
added 500 packages, and audited 501 packages in 47s
23 vulnerabilities (1 low, 3 moderate, 16 high, 3 critical)
node_modules/@rollup/ → rollup-darwin-arm64   (was rollup-darwin-x64)
git diff --stat package-lock.json → (empty)
```

Tests
```
✓ src/pages/api/__tests__/contact.test.ts  (2 tests)
✓ src/components/organisms/EmailCollectorProvider/EmailCollectorProvider.test.tsx  (2 tests)
Test Files  2 passed (2)
     Tests  4 passed (4)
```

Data source (dev server)
- Outbound TCP of the `next` processes, sampled every 250 ms during all requests: `[::1]` (local
  CMS) ×12 and `[2606:4700::6810:822]` ×1 = `registry.npmjs.org` (resolved by DNS; Next's dev
  version check). Production CMS IP `35.206.121.157`: 0 connections.
- Rendered HTML: `http://magneto-cms-2.local` 380 references, `cms.magnetomarketing.co` 0.
- Dev log errors: only `Page /api/ping-cms does not export a default function`.

## Deviations from the spec
- Visual checks at 375 / 768 / 1440 px not run (no browser tool; spec allows "not run — manual by Mauricio").
- Added `/carte` to the HTTP smoke list to record its current 404.
- `dev.md` asks to restate the plan and wait for "go"; the human's instruction to execute the
  approved spec was taken as the go.

## Issues found (not fixed)
- **`DISABLE_SMTP=0` in `.env.local`** with SMTP vars active → violates AGENTS.md Hard rule 2;
  any local contact-form submit would send real mail. Must be `1` before any phase that tests forms.
- **`npm audit`: 23 vulnerabilities (3 critical, 16 high)** — not in Known debt. Direct deps:
  - `next` 15.4.8 — critical, fix `next@15.5.28` (minor within 15.x; also clears `postcss`, `sharp`).
  - `vitest` 1.6.1 (+ `tinypool`) — critical, fix `vitest@5` (major).
  - `nodemailer` ^7 — high, fix `nodemailer@10.2.1` (major).
  - Transitive (fixable without majors): `dompurify`, `ws`, `vite`, `rollup`, `form-data`,
    `minimatch`, `picomatch`, `brace-expansion`, `nanoid`, `js-yaml`, `flatted`, `immutable`,
    `source-map-js`.
  Recommend scoping into Phase 0.5 (at least the `next` upgrade — it serves production traffic).
- `npm warn deprecated` for `abab`, `domexception` (from `jsdom@21`) — informational.
- Everything else observed matches the updated Known debt in `AGENTS.md`.

## Proposed commits
- `docs(ai): add agent harness (AGENTS.md, CLAUDE.md, .claude/, docs/ai, docs/adr, templates)`
- `docs(phase-0): add baseline spec and report`
- `chore(config): allow magneto-cms-2.local image host` (`next.config.ts` — separate concern, local only;
  consider whether it should ship to production at all)

## Time
Agent time ≈ 10 min (reinstall 47 s, gate ≈ 2 min, smoke ≈ 1 min) — measured roughly.
Active human time: unknown. Waiting: none.
