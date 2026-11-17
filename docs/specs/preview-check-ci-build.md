# Preview check script + CI build

- **Status: Draft** · Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-11-13 · Branch: `spec/preview-check-ci-build` (from `master` @ `faaeb42`)
- Depends on: `docs/ai/WORKFLOW.md` "Release process"; 3b and 5a runbook reports (preview checks)

## Goal
1. `node scripts/preview-check.mjs <baseUrl>` runs the manual preview checklist and exits 1 on any failure.
2. CI gets a `next build` signal without becoming flaky (the option is chosen in D-2).

## Evidence (read-only, 2026-11-13)
- **E1. The manual checklist** (`WORKFLOW.md:66-68`): "main routes 200, an unknown URL (e.g. `/esto-no-existe`) 404 —
  not 500 —, one project page 200 … CI does not build … the preview is the only test of the real Vercel runtime".
- **E2. Main routes:** `src/app/[locale]/` has `/`, `about-magneto`, `contact`, `packages`, `privacy-policy`,
  `projects`, `services`, plus `projects/[slug]`. The sitemap list (`sitemap.xml/route.ts:12`) omits `/packages`;
  the script uses the folder list, not the sitemap. Project slugs: `fashion-company-ecommerce`,
  `shamaniccas-ecommerce`, `trepied-trepied-ca` (5c-rest §8).
- **E3. Locale paths** (`src/i18n/paths.ts:17-20`): EN is unprefixed; others are `/fr`, `/fr/x`. Disabled locales →
  404 by the catch-all (`[...rest]/page.tsx:6`).
- **E4.** The `h1`s are rendered by server components (`Hero/index.tsx:75`, `ProjectDetail/index.tsx:34`,
  `privacy-policy/page.tsx:26`), so the raw HTML is enough. The 404 shell has no layout (Known debt), so `h1` is
  checked on 200 pages only. **E5.** The literal `<p>` check = 5a AC-10: `grep -c '&lt;p&gt;'` = 0 (5a spec :425).
- **E6. Previews are behind Vercel Deployment Protection.** They were checked in Chrome, not `curl`
  (`phase-3b…runbook.md:202-203`, `phase-5a-production-acf-runbook.md:200-201`).
- **E7. CI** (`.github/workflows/ci.yml:16-34`): one job `check` on push to `master` and on PRs: `npm ci` → lint
  (`continue-on-error`) → `next typegen` → typecheck → `npm test -- --run`. `:28`: "No `build` step: it would call
  the CMS, which SiteGround bot protection blocks from CI." I did not re-verify this (no production calls).
  `:25` still says "baseline 146 errors"; AGENTS says 115.
- **E8. Build env.** Required: `NEXT_PUBLIC_WORDPRESS_API_URL` (`getWpGraphqlUrl()` throws without it,
  `utils/wordpress.ts:14-21`). Behaviour only: `ENABLED_LOCALES` (unset → `['en']`, `i18n/config.ts:18-27`) with the
  ADR 0005 guard (`layout.tsx:131-137`; `ALLOW_UNTRANSLATED_LOCALES` never in CI), `NEXT_PUBLIC_SITE_URL` (default
  prod, `seo.ts:7`), `NO_INDEX` (`next.config.ts:5-6`). SMTP / Mailchimp / GA: runtime only (A2).
- **E9. The build fetches the CMS:** pages prerender with `revalidate: 60` (`wp-graphql.ts:39`), and
  `projects/[slug]` `generateStaticParams` calls `getProjects` (`:78-84`) with no catch. `fetchWPGraphQL` has no
  timeout (`wp-graphql.ts:33-43`). So a slow CMS slows or stalls the build, and an unreachable CMS likely fails it
  (A3).
- **E10.** vitest runs `*.test.ts` under `scripts/` too (`scripts/qa-i18n/*.test.ts`); tsc excludes tests. The
  `scripts/agent-gate.mjs` pattern = pure exports + injected I/O. Node 24.15.0 (`.nvmrc`): built-in `fetch`.

## Assumptions and open questions
- **A1.** With `redirect: 'manual'`, a main route that answers 3xx counts as a failure (the routes serve 200 directly).
- **A2.** `next build` needs no SMTP / Mailchimp / analytics values. The Dev confirms it from the first CI build log.
- **A3.** A build with an unreachable CMS fails. Not measured: the Dev measures it in step 2a before changing CI.
- **Open:** D-1, D-2, D-3 below.

## Design
### 1. `scripts/preview-check.mjs` (Node built-ins only)
- **CLI:** `node scripts/preview-check.mjs <baseUrl> [--locales=en,fr,es] [--project=fashion-company-ecommerce]`.
  The default locale list is `en`. Unknown flags, a bad URL or an unknown locale → usage message, exit 2.
- **Routes per locale L:** the 7 main routes (E2), `/projects/<project>` → 200, and `/esto-no-existe` → 404 (all
  localized with the E3 rule: 9 checks × locale).
- **Per 200 page:** status = 200, exactly one `<h1` (regex on the HTML with `<script>…</script>` removed), and 0
  `&lt;p&gt;` / `&lt;/p&gt;`. For the 404 route, the status only.
- **Fetch:** sequential, `redirect: 'manual'`, `AbortSignal.timeout(20000)`, no retry. A timeout or network error is a
  FAIL line.
- **Protection (D-1):** if `VERCEL_AUTOMATION_BYPASS_SECRET` is set, the script sends the
  `x-vercel-protection-bypass` header. It never prints the value, and it never sends it to a non-`*.vercel.app` host.
- **Output:** one line per check, e.g. `PASS 200 /fr/services h1=1 literal-p=0 412ms` or
  `FAIL 500 /esto-no-existe expected 404`, then `N/M passed`. Exit 0 if all pass, otherwise 1.
- **Structure:** export the pure functions `parseArgs`, `localize`, `buildChecks`, `countH1`, `countLiteralP` and
  `evaluate(check, status, html)`. `main()` runs only when the file is executed directly (an `import.meta.url` vs
  `process.argv[1]` guard), so the test can import it with no side effects.
- **`package.json`:** add `"preview:check": "node scripts/preview-check.mjs"`. No dependency changes.

### 2. Test: `scripts/preview-check.test.ts` (vitest, runs in `npm test`)
`localize` = `localizePath` (`src/i18n/paths.ts`) for every route × locale (drift guard); `buildChecks(['en','fr'])` →
18 checks; `countH1` 0/1/2, attributes, `<h1` inside `<script>` not counted; `countLiteralP` counts escaped text only;
`evaluate` FAILs on wrong status, `h1` 0 or 2, literal `<p>`, and ignores the body on the 404 check; `parseArgs`
defaults, unknown locale and bad URL → error.

### 3. CI build (option per D-2)
- **2a (Dev, first):** run, in a branch CI job, `next build` with `NEXT_PUBLIC_WORDPRESS_API_URL=http://127.0.0.1:9/graphql`
  (refused immediately). Record pass/fail, duration and the failing page. This decides between options C and B.
- **A — blocking build against the production CMS** (URL as a repo variable; public, not a secret). Per E7
  SiteGround blocks GitHub runners; allowlisting GitHub IP ranges is impractical. Fails or flakes. **Not recommended.**
- **Option B — separate non-blocking job** `build-prod-cms` against the production CMS, with `continue-on-error: true`,
  `timeout-minutes: 15`, and only on PRs whose paths touch `src/**`, `next.config.ts` or `package*.json`. It gives a
  signal when SiteGround lets it through, and is noise otherwise. It sends anonymous read-only GraphQL traffic to
  production from CI.
- **Option C (recommended if 2a passes) — blocking offline build** in the `check` job, after the tests:
  `NEXT_PUBLIC_WORDPRESS_API_URL` pointing at the refused local port, `ENABLED_LOCALES=en,fr,es`, no
  `ALLOW_UNTRANSLATED_LOCALES`. It is deterministic, needs no secrets and doesn't touch production. It catches compile,
  bundling, route-type and ADR 0005 locale-guard failures. CMS integration stays with the Vercel preview +
  `preview-check.mjs`.
- **If 2a fails:** C would need a stub GraphQL server or catch-all error handling in the loaders. That is a larger
  change, so it is out of scope here. Fall back to B, or to "no CI build" (status quo) per D-2.
- Update the `ci.yml:25` and `:28` comments to match the chosen option.

## Files the Dev may touch
- `scripts/preview-check.mjs` (new), `scripts/preview-check.test.ts` (new).
- `package.json`: the `preview:check` script only.
- `.github/workflows/ci.yml`: the build step or job per D-2, and the two comments.
- `.env.local.example`: `VERCEL_AUTOMATION_BYPASS_SECRET=` with a placeholder and comment (only if D-1 = yes).
- `docs/ai/WORKFLOW.md`: Release process step 1. Add "run `npm run preview:check -- <url> --locales=…`" and remove
  "CI does not build" if C ships.
- `docs/reports/preview-check-ci-build.md` (new).

## Out of scope
New dependencies (Playwright, cheerio, etc.); visual or a11y checks; changing loaders' error handling; a stub CMS;
Vercel settings (Mauricio only); the sitemap `/packages` gap (E2, reported only); the lint baseline.

## Acceptance criteria
- [ ] AC-1 Gate: `npm run lint && npm run typecheck && npm test -- --run && npm run build` green; lint ≤ the `master`
  count; the new test runs in `npm test`.
- [ ] AC-2 `git diff master -- package.json package-lock.json` shows only the new script line.
- [ ] AC-3 Local: against `next start -p 3100` (local CMS, `ENABLED_LOCALES=en,fr,es`),
  `node scripts/preview-check.mjs http://localhost:3100 --locales=en,fr,es` prints 27 lines + summary, exit 0.
- [ ] AC-4 Negative: `--project=does-not-exist` → that line FAILs, exit 1. A bad flag → exit 2.
- [ ] AC-5 Preview (Mauricio, if D-1 = yes): run against the PR's Vercel preview with the bypass secret in his shell →
  exit 0. The secret does not appear in the output or the report.
- [ ] AC-6 CI: the 2a result is in the report. The chosen option runs on the PR; for C, the `check` job is green and
  its log shows `next build` completing with `ENABLED_LOCALES=en,fr,es`. A deliberate `[FR TODO]` in a scratch
  commit fails it (then reverted, not pushed to `master`).

## Decisions needed
- **D-1. Vercel "Protection Bypass for Automation":** enable it (Mauricio, Vercel → Settings → Deployment
  Protection) so the script can reach previews? If not, the script is for localhost / unprotected URLs only, and
  previews stay a Chrome check. Recommended: yes. The secret lives only in Mauricio's shell, not in CI.
- **D-2. CI build option:** C if 2a passes, else B or the status quo. Recommended: C, with B rejected unless
  production-CMS signal is wanted despite the noise.
- **D-3. Default `--locales`:** `en` (the production state until 5c-rest ships) or `en,fr,es`? Recommended: `en`, and
  pass the flag explicitly.
- No ADR: no new dependency, routing or data-model change.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | A CI build against the production CMS is flaky (bot protection, slow SiteGround, no fetch timeout E9) | Reject A; B is non-blocking with a timeout; C never calls the CMS |
| R-2 | The offline build fails, or passes for the wrong reason (pages swallow errors and prerender empty) | 2a measures it; C only claims compile/guard coverage, and the preview check keeps content coverage |
| R-3 | The bypass secret leaks (log, report, wrong host) | Never printed; sent only to `*.vercel.app`; not stored in CI |
| R-4 | `localize` drifts from `paths.ts`; regex `h1` count fooled by scripts | Unit test compares both; `<script>` stripped |

## Estimate
| Task | Agent | Mauricio |
|---|---:|---:|
| Script + test | 2–3 h | — |
| 2a measurement + CI change + WORKFLOW/report | 1.5–2.5 h | — |
| Review, D-1 Vercel setting, AC-5 preview run | — | 30–45 min |
| **Total** | **3.5–5.5 h** | **≈ 0.5–0.75 h** |
