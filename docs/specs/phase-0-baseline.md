# Phase 0 — Baseline (diagnosis only)

- Status: Approved (with changes) — 2026-10-24
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: — (first phase; no previous report)

## Goal
Record the real, current state of the frontend and its link to the local CMS — toolchain,
completion gate, routes, data source, integrations, Known debt — so every later phase can be
judged against a known baseline. No code, config or dependency changes.

## Evidence (facts verified now)

All commands run on 2026-10-24 from the repo root, branch `master`, clean except
`M next.config.ts` (local image host, see WP-SETUP change log) and the untracked harness files.

### 1. Toolchain

| Item | Value | Source |
|---|---|---|
| Node | v24.15.0 (arch `arm64`) | `node -v`, `node -p process.arch` |
| npm | 11.12.1 | `npm -v` |
| Next | 15.4.8 (declared `15.4.8`, pinned) | `node_modules/next/package.json` |
| React / React DOM | 19.1.2 / 19.1.2 (pinned) | idem |
| TypeScript | 5.8.3 (declared `^5`) | idem |
| Vitest | 1.6.1 · ESLint 9.31.0 | idem |
| `.nvmrc` / `.node-version` / `engines` | **none** | `ls -a`, `package.json` |
| `.npmrc` | `legacy-peer-deps=true` | file |
| CI | **none** (`.github/workflows` does not exist) | `ls` |

Scripts: `dev`, `prebuild` (copies jsdom stylesheet), `build`, `start`, `lint` (`next lint`),
`test` (`vitest`). No `typecheck` script.

### 2. Environment target (names only, no values)

`.env.local` (read-only check):

- `NEXT_PUBLIC_WORDPRESS_API_URL` → `magneto-cms-2.local` ✅ (active line; older prod lines commented)
- `NEXT_PUBLIC_WORDPRESS_URL` → `magneto-cms-2.local` ✅
- `WORDPRESS_URL` → `magneto-cms-2.local` ✅
- `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`, `MAILCHIMP_SERVER_PREFIX` → commented ✅
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` → commented ✅
- `DISABLE_SMTP` → **`0`** ❌ (AGENTS.md Hard rule 2 requires `1`; `src/pages/api/contact.ts:142`
  checks `=== '1'`). `SMTP_HOST/USER/PASS/PORT/TLS_SERVERNAME`, `EMAIL_FROM`, `CONTACT_RECIPIENT`
  are **active**. → Forms were observed only, never submitted.

`/etc/hosts`: `magneto-cms-2.local` → `127.0.0.1` / `::1`.

### 3. Completion gate

| Check | Result | Detail |
|---|---|---|
| `npm run lint` | **FAIL** (exit 1) | 146 errors, 119 warnings across 47 files |
| `npx tsc --noEmit` | **PASS** (exit 0) | 0 errors |
| `npm test -- --run` | **FAIL — does not start** (exit 1) | `Cannot find module @rollup/rollup-darwin-arm64` |
| `npm run build` | **PASS** (exit 0) | 14 static pages generated; lint skipped (`ignoreDuringBuilds`) |

Lint by rule: `no-explicit-any` 122 (33 files; 20 of them in test/`vitest-globals.d.ts`) ·
`no-unused-vars` 92 · `ban-ts-comment` 13 · `react/no-unescaped-entities` 4 ·
`react-hooks/exhaustive-deps` 2 · `no-unused-expressions` 2 · `@next/next/no-html-link-for-pages` 2 ·
`no-empty-object-type` 1 · **`react-hooks/rules-of-hooks` 1** —
`src/components/atoms/CalendlyButton/index.tsx:44` (`useEmailModal` called conditionally: a real bug
risk, not style). Full log: rerun `npm run lint`.

Test failure root cause: `node_modules` was installed for **x64** — `node_modules/@rollup/` contains
only `rollup-darwin-x64`, while Node now runs `arm64` (install dated 2026-09-08, likely under
Rosetta / an x64 Node). `package-lock.json` does list `@rollup/rollup-darwin-arm64`. Fix requires a
reinstall → see Decisions needed. Test files present: 2
(`src/pages/api/__tests__/contact.test.ts`, `EmailCollectorProvider.test.tsx`).

Build route table (excerpt): `/`, `/about-magneto`, `/contact`, `/packages`, `/projects`,
`/services` static (revalidate 1m); `/projects/[slug]` SSG for `trepied-trepied-ca`,
`shamaniccas-ecommerce`, `fashion-company-ecommerce`; `ƒ /api/wp-graphql`.
Pages Router: `/api/contact`, `/api/download`, `/api/download-check`, `/api/mailchimp`,
`/api/ping-cms` **and `/api/__tests__/contact.test`** — the test file is shipped as a public API route.

### 4. `npm run dev` — routes and data source

`curl` against `localhost:3000` (no JS executed, so no client-side GA/Calendly calls):

| Route | Status |
|---|---|
| `/` `/services` `/packages` `/projects` `/about-magneto` `/contact` | 200 |
| `/projects/trepied-trepied-ca` `/shamaniccas-ecommerce` `/fashion-company-ecommerce` | 200 |
| `/projects/no-existe` | 404 (correct) |
| `/robots.txt` `/sitemap.xml` | 200 |
| `/api/ping-cms` | **500** — `src/pages/api/ping-cms.ts` is **0 bytes**; log: `Page /api/ping-cms does not export a default function` |

Content comes from the local CMS:
- Outbound TCP connections of the `next` processes sampled every 250 ms during all requests:
  only loopback (`[::1]`). No connection to the production IP (`cms.magnetomarketing.co` →
  35.206.121.157, DNS lookup only).
- Rendered HTML references `http://magneto-cms-2.local` 362 times (media), production CMS 0 times.
  `https://www.magnetomarketing.co` appears only as `og:url` (metadata, expected).
- The 3 SSG project slugs match the local query
  `{ projects { nodes { slug } } }` → `trepied-trepied-ca`, `shamaniccas-ecommerce`, `fashion-company-ecommerce`.

Local CMS facts (read-only `curl` to `http://magneto-cms-2.local/graphql`):
- `generalSettings` → title `Magneto CMS`, url `http://magneto-cms-2.local`.
- Pages: `/`, `/about-magneto/`, `/services/`, `/packages/`, `/projects/`, `/contact/`, and
  **`/carte/`** (modified 2026-10-18; no frontend route).
- WPML is already exposing data (relevant to Phase 1):
  `{ languages { code } defaultLanguage { code } }` →
  `{"languages":[{"code":"en"},{"code":"fr"},{"code":"es"}],"defaultLanguage":{"code":"en"}}`.
  `Language` fields: `code, country_flag_url, default_locale, id, language_code, native_name, translated_name, url`.
  `Page` has `language`, `languageCode`, `translationGroupId`, `translations`.
  `RootQueryToPageConnectionWhereArgs.language` is `String` (not an enum as in Dangel).

### 5. Forms, Calendly, Mailchimp (observed only — nothing submitted)

- Contact form: `src/components/organisms/ContactForm.tsx:36` → `POST /api/contact`. With current
  env it **would send real SMTP mail** (`DISABLE_SMTP=0`, SMTP vars active). Mailchimp step is a
  no-op (`contact.ts:16` returns "Mailchimp not configured").
- Email collector / lead magnet: `EmailCollectorProvider/index.tsx:82` → `/api/mailchimp`,
  `:123` → `/api/download-check`. With `MAILCHIMP_*` empty, `mailchimp.ts:85` returns
  `200 "Simulated subscribe (no provider configured)"` — safe locally.
- GA/GTM/Turnstile: no script tag in server HTML with the vars commented.
- Calendly — **two different event URLs are live**:
  - `https://calendly.com/magnetomarketing/free-strategy-call` — hardcoded default in
    `src/utils/calendly.ts:48`; on every page (header / final CTA).
  - `https://calendly.com/mauriciobayuelo/free-discovery-call` — **not in `src/`**; comes from
    WP ACF hero CTA (`cta.href`) on `/services`, `/packages`, `/projects`, `/about-magneto`,
    `/contact` (2 per page). Commit `deb83f5` moved code CTAs to the Magneto event, but local CMS
    content still points at the old one. Production CMS not checked (out of bounds).

### 6. Known debt in AGENTS.md — check

| Item | Verdict | Evidence |
|---|---|---|
| `package-lock.json` git-ignored → installs not reproducible | **Correct partly / misleading** | `.gitignore:12` lists it, **but the file is tracked** (`git ls-files` → present; last commit `f31e39f`). Changes are still committed; the ignore line has no effect. Real reproducibility issue is the arch mismatch above + `legacy-peer-deps`. |
| `vercel.json` uses `--legacy-peer-deps` | Confirmed | `vercel.json` `NPM_FLAGS`; also `.npmrc` |
| No CI, no `.nvmrc`, no `typecheck` script | Confirmed | §1 |
| `eslint.ignoreDuringBuilds: true` | Confirmed | `next.config.ts:11-13`; build log "Skipping linting" |
| Hardcoded prod fallback in `wp-graphql.ts` and `route.ts` | Confirmed, **plus a third** | `utils/wp-graphql.ts:7`, `app/api/wp-graphql/route.ts:10`, **`LeadMagnetSection/api.ts:79`** (`https://cms.magnetomarketing.co`) |
| `images.domains` duplicates `remotePatterns` | Confirmed | `next.config.ts:16` |
| `@apollo/client` only in `src/data/projects.ts`; `graphql-request` unused | Confirmed | grep |
| 6 files use `dangerouslySetInnerHTML`; 1 imports DOMPurify | Confirmed | `app/{projects,about-magneto,packages,services}/page.tsx`, `ProjectDetail`, `AboutSection`; DOMPurify only in `ProjectDetail` |
| Leftovers `Hero/index.tsx.bak`, `FinalCTASection/types.ts.new` | Confirmed | `find` |
| Mailchimp: `pages/api/mailchimp.ts` + 5 consumers | Confirmed (5 incl. 1 test) | `PackageCard`, `LeadMagnetSection`, `HeroCTA`, `EmailCollectorProvider`, its test |
| Locale hardcoded `en_US` in `app/layout.tsx` | Confirmed | `layout.tsx:68`, `:115`; `lang="en"` at `:135` |
| "57 pre-existing `any`" (Conventions) | **Incorrect** | ESLint reports 122 `no-explicit-any` in 33 files (102 outside test files) |

Missing from Known debt (proposed additions):
- `src/pages/api/ping-cms.ts` is empty → 500.
- `src/pages/api/__tests__/contact.test.ts` is built and served as `/api/__tests__/contact.test`.
- `node_modules` installed for x64 → test suite cannot start on arm64.
- `react-hooks/rules-of-hooks` error in `CalendlyButton/index.tsx:44`.
- Two Calendly events in use (code vs CMS content).
- Pages Router API list in AGENTS.md omits `download-check`.
- `README.md` structure still lists `about/`, `portfolio/` (`README.md:44,47`).

## Assumptions and open questions
- Assumption: the x64 `node_modules` came from an install under Rosetta / x64 Node; a clean
  `npm ci` on arm64 Node fixes the tests. Not verified (would modify `node_modules`).
- ~~Assumption: `/carte/` is unused.~~ Corrected in review: `/carte/` is the business-card QR
  target (`magnetomarketing.co/carte`) — a planned, pending frontend route. Do not delete it in WP.
- Open: which Calendly event is canonical — `magnetomarketing/free-strategy-call` or
  `mauriciobayuelo/free-discovery-call`? Does production CMS have the same hero `cta.href`?
- Open: the user reported `DISABLE_SMTP=1`, but disk shows `0` — unsaved editor buffer?
- Open: WP-SETUP says the WPML wizard is pending, yet GraphQL already returns `en/fr/es`.
  Phase 1 should confirm wizard state in WP admin before configuring.
- Not checked: browser rendering at 375 / 768 / 1440 px, client-side behaviour (Calendly modal,
  email modal), production CMS.

## Design
Phase 0 produces no code. The Dev:
0. Confirms `node -p process.arch` = `arm64`, then runs `rm -rf node_modules && npm ci`
   (Decision 1, approved inside Phase 0). `package-lock.json` must not change; if `npm ci`
   modifies it, stop and report.
1. Re-runs the gate (`npm run lint`, `npx tsc --noEmit`, `npm test -- --run`, `npm run build`)
   and confirms the numbers above (lint 146 E / 119 W; tsc 0; build OK); tests now run after the reinstall.
2. With `npm run dev`, opens the 9 page routes in a browser at 375 / 768 / 1440 px in EN and
   records visible errors (console, layout) — no form submission while `DISABLE_SMTP≠1`.
   Only if a browser tool is already available; never install one (no Playwright, no deps).
   Otherwise mark "not run — manual by Mauricio".
3. Writes `docs/reports/phase-0-baseline.md` (from `docs/reports/TEMPLATE.md`) with the baseline
   table that later phases compare against, and the proposed Known debt diff (text only).

## Files the Dev may touch
- `docs/reports/phase-0-baseline.md` — new, the baseline report.
(Anything not listed is out of scope — including `AGENTS.md`, `.gitignore`, `node_modules`, `src/`.)

## Out of scope
- Fixing any lint error, the empty `ping-cms.ts`, the test route, the hooks bug, or Calendly URLs.
- Changing dependencies or `package-lock.json` (the `npm ci` reinstall is the only allowed
  `node_modules` change); adding `.nvmrc`/CI/`typecheck` script.
- Editing `.env.local`, WP content, or WPML settings.
- Applying the `.gitignore` backup rules proposed in chat.

## Acceptance criteria
- [ ] Report exists at `docs/reports/phase-0-baseline.md` with pass/fail/not-run for each gate step and exact counts.
- [ ] Report states the data source evidence (local only) and the `DISABLE_SMTP` state at run time.
- [ ] Tests run after `npm ci` (arm64); `package-lock.json` unchanged (checksum before/after).
- [ ] All 9 page routes + 404 checked in browser at 375 / 768 / 1440 px (EN), or marked
      "not run — manual by Mauricio" if no browser tool is available.
- [ ] Known debt verdict table included; AGENTS.md itself unchanged.
- [ ] `git status` shows no changes outside `docs/reports/`.

## Decisions needed (if any)

Review outcome (Senior Architect, 2026-10-24): 1 → approved inside Phase 0 (see Design step 0).
2, 3, 4 → Phase 0.5 (separate spec). 5 → content fix in WP by Mauricio. 6 → done: Known debt
in `AGENTS.md` updated by the Senior Architect (current version; do not edit).

1. **Reinstall dependencies on arm64** (`rm -rf node_modules && npm ci`) so tests can run — changes
   `node_modules` only, but it is the only way to get a test baseline. Approve before Phase 1?
2. **Pin Node** (`.nvmrc` with `24` or the LTS chosen) — small ADR-worthy toolchain decision.
3. **`package-lock.json` in `.gitignore`**: remove the dead rule (keep tracking the lock) — recommended.
4. **Move `src/pages/api/__tests__/`** out of `pages/` (e.g. `src/__tests__/api/`) so it isn't served.
   Touches the router tree → AGENTS.md says ask first.
5. **Canonical Calendly event** (content decision, then a CMS edit, not code).
6. Update AGENTS.md Known debt with §6 corrections (human or Senior Architect edit).

## Estimate
Active human time: 20–40 min (review + browser checks if done by hand).
Agent time: 15–25 min to rerun the gate, browser pass, and write the report.
