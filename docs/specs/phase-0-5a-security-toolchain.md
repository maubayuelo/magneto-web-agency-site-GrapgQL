# Phase 0.5a — Security & toolchain

- Status: Approved — 2026-10-24
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: `docs/reports/phase-0-baseline.md` (gate + HTTP smoke baseline)

## Goal
`next` and `eslint-config-next` are on **15.5.28**, every non-breaking `npm audit` fix is applied,
the repo pins Node 24.15.0 and has a `typecheck` script, `.gitignore` is honest about the lockfile
and blocks WP backups, and a GitHub Actions CI enforces `npm ci` + typecheck + test (lint reported,
not blocking). Gate and HTTP smoke are equal to or better than Phase 0.

## Evidence (facts verified now)

All commands read-only. Dependency simulation ran on a **copy** of `package.json` /
`package-lock.json` / `.npmrc` in the session scratchpad (`--package-lock-only --ignore-scripts`);
the repo was not touched (`md5 package-lock.json` = `42ab03e2c060786e260c10c65a4482ac`, same as Phase 0).

### Environment
```
node -v → v24.15.0 · npm -v → 11.12.1 · process.arch → arm64
git remote → github.com/maubayuelo/magneto-web-agency-site-GrapgQL · default branch: master
ls .github → No such file or directory
```

### Target version — `next@15.5.28`
```
npm view next dist-tags → latest 16.4.3 · backport 15.5.28 · next-15-3 15.3.9
npm view next versions (15.5.x) → … 15.5.27 15.5.28   (15.5.28 = highest 15.x)
npm view eslint-config-next versions (15.5.x) → … 15.5.28
npm view next@15.5.28 peerDependencies → react/react-dom ^18.2.0 || ^19.0.0 · sass ^1.3.0
npm view next@15.5.28 engines → node ^18.18.0 || ^19.8.0 || >= 20.0.0
npm view eslint-config-next@15.5.28 peerDependencies → eslint ^7.23 || ^8 || ^9 · typescript >=3.3.1
```
React 19.1.2, sass ^1.89.2, eslint ^9 already satisfy these. No React bump needed.

`npm audit` advisories on `next` (current 15.4.8), highest "fixed in" bound per severity:
```
critical  >=10.0.0 <=15.5.27  RCE in Image Optimization API when SVG files are used   GHSA-2464-fhr4-w9xw
critical  >=10.0.0 <15.5.24   RCE in Image Optimization API when AVIF files are used  GHSA-2xp9-vwfh-vxw4
critical  >=13.4.0 <15.5.24   RCE on windows-hosted servers                           GHSA-p293-qw3h-jr36
high      >=13.0.0 <=15.5.27  DoS in App Router using Server Actions                  GHSA-p3m5-59mp-jv5r
… 29 more (moderate/high/low), all with upper bound ≤ 15.5.27
```
→ **15.5.28 is the minimum version that clears every `next` advisory** (the SVG one is
`<=15.5.27`, so 15.5.27 is not enough). Relevant here: `next.config.ts` sets
`images.dangerouslyAllowSVG: true`.

### Simulation — step 1: `npm install next@15.5.28 eslint-config-next@15.5.28 --save-exact`
`package.json` diff: only `next` and `eslint-config-next` `15.4.8 → 15.5.28`.
Lockfile: `next`, `@next/env`, `@next/eslint-plugin-next`, `eslint-config-next` and the 8
`@next/swc-*` binaries `15.4.8 → 15.5.28`. Nothing else.
Audit after step 1: 23 total (1 low, 4 moderate, 16 high, 2 critical). `next` drops from critical
to moderate (only remaining reason: nested `postcss`, see residuals).

### Simulation — step 2: `npm audit fix` (no `--force`)
`package.json`: **no change** beyond step 1. Lockfile changes (version before → after):

| Package | Change | Pulled by |
|---|---|---|
| `sharp` + 21 `@img/sharp-*` | 0.34.3 → 0.35.5 (+ new `@img/colour`, freebsd/riscv64/webcontainers binaries) | `next` optionalDeps `^0.34.3 \|\| ^0.35.5` |
| `@img/sharp-libvips-*` (11) | 1.2.0 → 1.3.4 | sharp |
| `@emnapi/runtime` | 1.4.5 → 1.11.3 | sharp wasm |
| `color`, `color-string`, `simple-swizzle`, `is-arrayish` | removed | sharp 0.35 dropped them |
| `detect-libc` · `semver` | 2.0.4 → 2.1.2 · 7.7.2 → 7.8.5 | sharp |
| `postcss` (top-level) | 8.5.6 → 8.5.31 | sass/tooling |
| `nanoid` · `source-map-js` | 3.3.11 → 3.3.20 · 1.2.1 → 1.2.2 | postcss |
| `dompurify` | 3.2.7 → 3.4.17 | `isomorphic-dompurify` (runtime, used by `ProjectDetail`) |
| `nodemailer` | 7.0.6 → 7.0.13 | direct, within `^7` (still vulnerable, see residuals) |
| `rollup` + 21 `@rollup/rollup-*` | 4.52.3 → 4.65.0 (+ loong64-musl, ppc64-musl, openbsd-x64) | vite (dev) |
| `@napi-rs/lzma-linux-x64-gnu` | new 1.5.1 (optional, `engines.node ^22.20 \|\| ^24.12 \|\| >=25`) | rollup optional |
| `vite` | 5.4.20 → 5.4.21 | vitest 1.x (dev) |
| `ws` · `form-data` · `@tootallnate/once` | 8.18.3 → 8.22.0 · 4.0.4 → 4.0.6 · 2.0.0 → 2.0.1 | jsdom (dev) |
| `immutable` | 5.1.3 → 5.1.9 | sass (dev) |
| `js-yaml` · `ajv` · `flatted` | 4.1.0 → 4.3.2 · 6.12.6 → 6.15.0 · 3.3.3 → 3.4.4 | eslint (dev) |
| `@humanfs/core` · `@humanfs/node` | 0.19.1 → 0.19.2 · 0.16.6 → 0.16.8 (+ new `@humanfs/types`, nested `@humanwhocodes/retry` removed) | eslint (dev) |
| `minimatch` · `brace-expansion` · `picomatch` | 3.1.2 → 3.1.5 · 1.1.12 → 1.1.21 · 2.3.1 → 2.3.2 | eslint/glob tooling (dev) |
| nested `minimatch` / `brace-expansion` (`@typescript-eslint/typescript-estree`) | 9.0.5 → 9.0.9 · 2.0.2 → 2.1.7 | dev |
| nested `picomatch` (`tinyglobby`) · `hasown` · `@types/estree` | 4.0.3 → 4.0.7 · 2.0.2 → 2.0.4 · 1.0.8 → 1.0.9 | dev |

Audit after step 2: **8 total (3 moderate, 3 high, 2 critical)** — residuals:

| Package | Severity | Why it stays | Fix |
|---|---|---|---|
| `vitest` 1.6.1, `tinypool` | critical | needs `vitest@5` (major) | out of scope (dev-only) |
| `vite` 5.4.21, `vite-node`, `esbuild` | high / moderate | same chain | out of scope (dev-only) |
| `nodemailer` 7.0.13 | high | needs `nodemailer@10` (major) | out of scope (runtime — contact form) |
| `next/node_modules/postcss` 8.4.31 | high | `next@15.5.28` pins `postcss: 8.4.31` exactly; only `next@16` fixes it | accepted residual (build-time CSS processing of our own SCSS) |
| `next` | moderate | only via the nested `postcss` above | same |

### Next 15.5 side effects (from the 15.5.28 tarball, `npm pack` into scratchpad)
- `dist/lib/typescript/writeAppTypeDeclarations.js:52-53` — on `next dev` / `next build`, Next
  **rewrites `next-env.d.ts`** to add `/// <reference path="./.next/types/routes.d.ts" />`.
  `next-env.d.ts` is tracked in git (`git ls-files next-env.d.ts` → listed) and today has 3
  `/// <reference types>` lines and no path reference. In CI there is no `.next/`, so plain
  `tsc --noEmit` is expected to fail with "file not found" for that reference.
- `dist/bin/next:120` — 15.5 adds `next typegen` ("Generate TypeScript definitions for routes,
  pages, and layouts without running a full build"). This creates `.next/types/routes.d.ts`
  without building or calling the CMS.
- `dist/cli/next-lint.js:50` — `next lint` prints "`next lint` is deprecated and will be removed
  in Next.js 16". Warning only; `npm run lint` keeps working.

### Files today
- `package.json` — no `typecheck` script, no `engines`. `"test": "vitest"`.
- `.gitignore:13` — `package-lock.json` (dead rule; the file is tracked). No `*.wpress`, `*.sql`
  or backup patterns. `*.tsbuildinfo` already ignored.
- `.npmrc` = `legacy-peer-deps=true` (tracked → applies to `npm ci` in CI too).
- `tsconfig.json` `include` has `.next/types/**/*.ts`; `exclude` drops `*.test.ts(x)` and `vitest.setup.ts`.
- Tests: `contact.test.ts` deletes/sets `SMTP_*`, `CONTACT_RECIPIENT` itself → needs no secrets.
- Local branches `main` and `master` both exist; remote has only `master`.

## Assumptions and open questions
- Assumption: tests need no network and no env vars (true for `contact.test.ts` by reading it;
  `EmailCollectorProvider.test.tsx` passed in Phase 0 with only local env — the Dev confirms by
  running the suite with no `.env.local` loaded, see the CI dry-run acceptance criterion).
- Assumption: `next typegen` does not contact WordPress (it only scans `src/app` and loads
  `next.config.ts`, which has no network calls). Dev verifies with `rm -rf .next` first.
- Assumption: Vercel serves `next/image` through its own optimizer, so the `sharp` 0.35 bump
  only affects local `next start` / dev. Not verified (no Vercel access from here).
- Open: **Vercel Node version.** Vercel does not read `.nvmrc`; it uses the project setting or
  `engines.node`. `sharp@0.35.5` needs Node `>=20.9.0`. Mauricio checks the Vercel project
  setting (Settings → Build and Deployment → Node.js Version) — if it is 18.x, a build will
  fail. Not changed in this phase.
- Open: **backup folder names.** Proposed patterns below cover `wp db export` defaults
  (`*.sql`) and All-in-One WP Migration (`*.wpress`). Tell me if your backups use another name.
- Open: GitHub Actions must be enabled on the repo, and the action major versions
  (`actions/checkout`, `actions/setup-node`) should be the current majors when implemented — the
  Dev records which ones.

### Precondition: SMTP (names only, no values)
```
first check:  grep -n DISABLE_SMTP .env.local → 42:# DISABLE_SMTP=1   (commented → unset → SMTP on)
after fix:    grep -n DISABLE_SMTP .env.local → 42:DISABLE_SMTP=1
              grep -c '^DISABLE_SMTP=1$' .env.local → 1
active, uncommented: SMTP_HOST SMTP_USER SMTP_PASS SMTP_PORT SMTP_TLS_SERVERNAME CONTACT_RECIPIENT
no uncommented MAILCHIMP_*, NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_GTM_ID
src/pages/api/contact.ts:142  DISABLE_SMTP = String(process.env.DISABLE_SMTP || '').trim() === '1'
src/pages/api/contact.ts:145  if (!DISABLE_SMTP) { …send mail… }
```
Mauricio fixed it on 2026-10-24. **Hard rule 2 is now met** (the Phase 0 report recorded `DISABLE_SMTP=0`).
- Before starting, the Dev runs `grep -c '^DISABLE_SMTP=1$' .env.local` again (it prints a count,
  no values) and writes the result in the report. If it prints anything but `1`: stop
  submitting forms, run GET-only checks, and record the violation.
- Restart `npm run dev` after any `.env.local` change; Next reads it only at startup.
- This phase still needs no form submit: the smoke test is `curl` GET only, and the tests set their own env.

## Design

Order matters: upgrade `next` first, then `audit fix`, so the fix resolves against 15.5.28.

1. **Record before.** `md5 package-lock.json`, `npm audit` summary line.
2. **Upgrade Next (exact pin, as today):**
   `npm install next@15.5.28 eslint-config-next@15.5.28 --save-exact`
3. **Audit fix:** `npm audit fix` (never `--force`). Expect the lockfile table above; if the real
   diff differs (registry moved), list the differences in the report.
   Check `package.json` shows only the two version changes.
4. **Reproducibility:** `rm -rf node_modules && npm ci` must succeed with no lockfile change.
5. **`.nvmrc`:** one line, `24.15.0`.
6. **`package.json` scripts:** add `"typecheck": "tsc --noEmit"`. Do not change any other script,
   or the odd indentation of `prebuild` / `build` (cosmetic, out of scope).
7. **`.gitignore`:** delete the `package-lock.json` line (keep `yarn.lock`, `pnpm-lock.yaml`).
   Add a block:
   ```
   # WordPress backups / DB dumps — never commit
   *.wpress
   *.sql
   *.sql.gz
   /backups/
   /wp-backups/
   ```
   Check with `git check-ignore -v x.wpress x.sql backups/a` (paths need not exist) and
   `git ls-files --error-unmatch package-lock.json`.
8. **`next-env.d.ts`:** let Next rewrite it (run `npm run build` or `npx next typegen` once) and
   keep the generated file. Do not hand-edit it.
9. **`.github/workflows/ci.yml`:** new file, roughly:
   ```yaml
   name: CI
   on:
     push:
       branches: [master]
     pull_request:
   permissions:
     contents: read
   concurrency:
     group: ci-${{ github.ref }}
     cancel-in-progress: true
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version-file: .nvmrc
             cache: npm
         - run: npm ci
         - name: Lint (baseline 146 errors — informational, not blocking)
           run: npm run lint
           continue-on-error: true
         - name: Generate Next route types
           run: npx next typegen
         - run: npm run typecheck
         - run: npm test -- --run
   ```
   - No `build` step (SiteGround bot protection blocks CI calls to the CMS — same reasoning as Shamanicca).
   - No secrets, no `env:` with CMS URLs. The job must not reach any WordPress.
   - The `typegen` step is there because of the `next-env.d.ts` reference above. If the Dev
     shows `npm run typecheck` passes after `rm -rf .next` **without** typegen, drop the step
     and say so in the report (see Decision D1).
10. **`CLAUDE.md`:** change the "Current phase" line to `Phase 0.5a — security & toolchain.` (keep
    the "No code changes…" sentence out; replace with nothing or a one-line scope pointer to this spec).
11. **Verify** (acceptance criteria below), then write the report.

No changes to `src/`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`,
`.npmrc`, `vercel.json`.

## Files the Dev may touch
- `package.json` — `next`, `eslint-config-next` → `15.5.28`; add `typecheck` script.
- `package-lock.json` — regenerated by steps 2–3 only (no hand edits).
- `next-env.d.ts` — regenerated by Next only (no hand edits).
- `.nvmrc` — new, `24.15.0`.
- `.gitignore` — remove dead lockfile rule; add backup block.
- `.github/workflows/ci.yml` — new.
- `CLAUDE.md` — "Current phase" line only.
- `AGENTS.md` — **only if D2 is approved**: Known debt lines for "No CI, no `.nvmrc`, no
  `typecheck` script" and "`package-lock.json` … dead rule", plus the gate command
  `npx tsc --noEmit` → `npm run typecheck`. Nothing else.
- `docs/reports/phase-0-5a-security-toolchain.md` — the report.
- `node_modules/` — via `npm` only.
(Anything not listed is out of scope.)

## Out of scope
- `vitest@5`, `nodemailer@10`, `next@16`, any other major bump; `npm audit fix --force`.
- Lint fixes, migrating off `next lint` (deprecation warning is expected), `eslint.ignoreDuringBuilds`.
- Any change in `src/` (including `ping-cms.ts`, `CalendlyButton`, prod CMS fallbacks).
- `next.config.ts` (`images.domains`, `dangerouslyAllowSVG`), `.npmrc` / `vercel.json` `legacy-peer-deps`.
- `engines` field in `package.json`, Vercel settings, GitHub branch protection (Mauricio's call, later).
- Deleting the local `main` branch.
- `.env.local` — not touched by agents (Hard rule 3). See "Precondition: SMTP" above.

## Acceptance criteria
- [ ] `npm ls next eslint-config-next` → both `15.5.28`; `git diff package.json` shows only those two
      versions + the `typecheck` script.
- [ ] `npm audit` → no `next` advisory except the one via nested `postcss`; total ≤ 8 and every
      remaining item is in the residuals table. Paste the summary line.
- [ ] `rm -rf node_modules && npm ci` succeeds; `git diff --stat package-lock.json` unchanged by it.
- [ ] `cat .nvmrc` → `24.15.0`; `npm run typecheck` exists and passes.
- [ ] `git check-ignore -v x.wpress x.sql x.sql.gz backups/a wp-backups/a` → each matched;
      `grep -n '^package-lock.json$' .gitignore` → no match; `git ls-files package-lock.json` → listed.
- [ ] Completion gate vs Phase 0 baseline:
  - lint: runs; **errors ≤ 146** and warnings ≤ 119 (if `eslint-config-next` 15.5 changes the
    rule set, give the new per-rule breakdown and explain any rule whose count rose).
  - `npm run typecheck`: 0 errors. Also after `rm -rf .next && npx next typegen`.
  - `npm test -- --run`: 2 files · 4 tests passed.
  - `npm run build`: passes; static page count = 14.
- [ ] HTTP smoke (`npm run dev`, `curl -s -o /dev/null -w '%{http_code}'`, GET only) identical to
      Phase 0: the 9 routes `/` `/services` `/packages` `/projects` `/about-magneto` `/contact`
      `/projects/trepied-trepied-ca` `/projects/shamaniccas-ecommerce`
      `/projects/fashion-company-ecommerce` → 200; `/projects/no-existe` → 404; `/carte` → 404;
      `/robots.txt` `/sitemap.xml` → 200; `/api/ping-cms` → 500 (known debt).
- [ ] Data source unchanged: rendered HTML references `magneto-cms-2.local`, 0 references to
      `cms.magnetomarketing.co` (same method as Phase 0).
- [ ] One `next/image` from the local CMS loads through `/_next/image?url=…` → 200 with an image
      `content-type` (exercises the new `sharp`).
- [ ] CI file: `.github/workflows/ci.yml` parses (e.g. `npx --yes yaml-lint` is a new dependency —
      don't; use `ruby -ryaml -e 'YAML.load_file(".github/workflows/ci.yml")'` or `python3 -c` with
      the stdlib if available, else "not run"). Local dry run of the CI steps in order in a clean
      checkout (`git stash -u` is **not** allowed — use a `git worktree` in the scratchpad or state
      "not run"): `npm ci && npx next typegen && npm run typecheck && npm test -- --run` passes
      with no `.env.local` present.
- [ ] CI on GitHub: first run green on the pushed branch — **verified by Mauricio after he pushes**
      (agents don't push). Lint step shows red/annotated but the job is green.
- [ ] `CLAUDE.md` "Current phase" reads `Phase 0.5a — security & toolchain.`
- [ ] Visual: EN, 375 / 768 / 1440 px on `/` and one `/projects/[slug]` — "not run — manual by
      Mauricio" is acceptable (no browser tool in Dev sessions so far). EN must look unchanged.

## Decisions needed (if any)
- **D1 — `next typegen` in CI.** Proposed: yes, run it before `typecheck` (Next 15.5 makes
  `next-env.d.ts` reference `.next/types/routes.d.ts`). Alternative: drop `.next/types/**` from
  `tsconfig` / gitignore `next-env.d.ts` — both touch config outside scope, so not proposed.
- **D2 — AGENTS.md update.** Proposed: yes, in this phase, limited to the Known debt lines this
  phase resolves and the gate command (`npm run typecheck`). Otherwise Known debt becomes stale
  the moment the phase merges. If no, the Dev lists the stale lines in the report instead.
- **D3 — residual `postcss` 8.4.31 inside `next`.** Proposed: accept until a `next@16` phase
  (build-time only, processes our own SCSS). Needs a Senior Architect "yes", since it leaves one
  high advisory open on a production dependency.
- No ADR needed: no new dependency, no routing or data-model change. A `next@16` / `vitest@5` /
  `nodemailer@10` phase (0.5b?) would need its own spec.

## Estimate
- Agent time: 20–35 min (install + audit fix ≈ 2 min, two `npm ci` ≈ 2 min, gate ≈ 3 min,
  smoke ≈ 2 min, CI dry run in a worktree ≈ 5 min, report).
- Active human time: 15–30 min (review spec, check Vercel Node version, push branch, watch first
  CI run, optional visual check).

## Amendment A1 — 2026-10-24
Approved by the Senior Architect to clear the build blocker found during implementation
(`next@15.5.28` validates every `src/pages/api/*` file in `.next/types/validator.ts`; two Known-debt
files fail it, so `next build` fails).

Scope (adds to "Files the Dev may touch"):
1. Delete `src/pages/api/ping-cms.ts` (0 bytes, unreferenced; verify with grep). `/api/ping-cms` 500 → 404.
2. Move `src/pages/api/__tests__/contact.test.ts` → `src/__tests__/api/contact.test.ts`. Fix relative
   imports only; no test logic changes. Vitest must still find 2 files · 4 tests.
3. `.github/workflows/ci.yml` — restore `npx next typegen` before `npm run typecheck`. CI doesn't build,
   so typegen + typecheck is how CI catches route-type validation. Proof: `npm run typecheck` passes
   with `.next/types` present.
4. `AGENTS.md` — remove `ping-cms` from the directory map and the two Known-debt lines this fixes. Nothing else.
5. Read-only: `/projects/fashion-company-ecommerce` in dev — HTTP status, whether the body shows
   "Project Not Found" (possible soft 404), and what the CMS returns for that slug. No fix.
6. Full gate incl. `npm run build` (must pass; 14 static pages or explain) + HTTP smoke. Only expected
   smoke change: `/api/ping-cms` → 404.
7. Report: "Amendment A1" section in `docs/reports/phase-0-5a-security-toolchain.md`.
