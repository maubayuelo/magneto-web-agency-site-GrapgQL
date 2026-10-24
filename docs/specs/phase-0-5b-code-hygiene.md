# Phase 0.5b — Code hygiene

- Status: Approved — 2026-10-24 (Senior Architect: D1, D2, D3 approved)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: `docs/reports/phase-0-5a-security-toolchain.md` (incl. Amendment A1). **0.5a must be
  committed and merged to `master` first**: today it is still uncommitted on
  `chore/phase-0-5a-security-toolchain` (`git status` shows 6 modified, 1 rename, 1 deletion, 4 untracked).
  0.5b starts from a fresh branch off `master`, e.g. `chore/phase-0-5b-code-hygiene` (Mauricio creates it).
  **The Dev starts only after PR #4 is merged.**

## Goal
Four Known-debt items are gone, with EN behaviour and visuals unchanged:
1. `CalendlyButton` no longer breaks `react-hooks/rules-of-hooks`.
2. No source file falls back to the production CMS. One helper resolves the WordPress URLs and
   throws a clear error when they are missing.
3. `/projects/[slug]` loads its project directly by slug, so it works however many projects exist.
4. `Hero/index.tsx.bak` and `FinalCTASection/types.ts.new` are deleted.

## Evidence (facts verified now)
Read-only commands on branch `chore/phase-0-5a-security-toolchain` (0.5a + A1 applied, uncommitted).

### Gate reference (from the 0.5a report, after A1)
lint 146 errors · 119 warnings · 47 files · typecheck pass (also after `next typegen`) · tests 2 files / 4 ·
build pass, 14/14 static pages. HTTP smoke: 9 routes 200, `/projects/no-existe` 404, `/carte` 404,
`/robots.txt` `/sitemap.xml` 200, `/api/ping-cms` **404** (changed by A1).

Lint lines today in the files this spec touches (from `npm run lint`, run now):
| File | Errors | Warnings |
|---|---|---|
| `atoms/CalendlyButton/index.tsx` | 2: `:41` no-explicit-any, `:44` **rules-of-hooks** | 5 (`:7` unused `loadCalendlyScript`, `:45 :62 :80 :97` unused catch vars) |
| `organisms/EmailCollectorProvider/index.tsx` | 5 | 5 |
| `utils/wp-graphql.ts` | 6 | 4 |
| `app/api/wp-graphql/route.ts` | 3 | 0 |
| `organisms/LeadMagnetSection/api.ts` | 2 | 3 |
| `app/projects/[slug]/page.tsx` | 8 (all no-explicit-any) | 0 |

### 1. CalendlyButton (`src/components/atoms/CalendlyButton/index.tsx`)
```
41  let openModal: ((opts?: any) => void) | undefined;
42  try {
43    // Attempt to read email modal; guard for usage outside provider
44    openModal = useEmailModal().openModal;
45  } catch (e) {
46    openModal = undefined;
47  }
…
67  if (forceNewWindow || skipCollector || !openModal) { …openCalendlyPopup({ utmContent, utmTerm, customUrl, forceNewWindow }) }
78  try { openModal({ utmContent, utmTerm, customUrl, forceNewWindow }) } catch { …openCalendlyPopup(…) }
```
`src/components/organisms/EmailCollectorProvider/index.tsx`:
```
22   const EmailModalContext = createContext<EmailModalContextValue | undefined>(undefined);   (not exported)
331  export const useEmailModal = () => {
332    const ctx = useContext(EmailModalContext);
333    if (!ctx) throw new Error('useEmailModal must be used within EmailCollectorProvider');
334    return ctx; };
```
- The hook does run on every render; the throw comes after `useContext`. The lint error fires because
  the call sits in a `try`. It is still a real smell: it relies on catching an exception to detect a
  missing provider.
- Behaviour to keep: with a provider, a click opens the email modal (unless `forceNewWindow` or
  `skipCollector` is set). Without a provider, a click opens Calendly directly, with no crash.
- Usage: `CalendlyButton` is rendered from `about-magneto/page.tsx`, `ProjectsGrid`, `HeroCTA`,
  `LeadMagnetSection`, `FinalCTASection`, `Header` and `PackageCard`. `app/layout.tsx:140-153` wraps
  Header, `{children}`, LeadMagnetSection, FinalCTA and Footer in `<EmailCollectorProvider>`, so in the
  running app **every button sits inside a provider**. The no-provider branch is reachable only from tests
  or from future usage.
- Existing test pattern: `EmailCollectorProvider.test.tsx` renders the provider, mocks
  `calendly.openCalendlyPopup` with `vi.spyOn`, and finds the modal by placeholder `you@company.com`.

### 2. Production CMS fallbacks
```
grep -rn "cms\.magnetomarketing" src
src/utils/wp-graphql.ts:7               process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.magnetomarketing.co/graphql/'
src/app/api/wp-graphql/route.ts:10      … same chain … || 'https://cms.magnetomarketing.co/graphql'
src/components/organisms/LeadMagnetSection/api.ts:79   process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.magnetomarketing.co'
```
(`next.config.ts` image hosts also name it. That is an allow-list, not a fallback, and out of scope.)

How each file uses the URL:
- `utils/wp-graphql.ts`: module-level const (`:6-7`). In the **browser** the helper posts to
  `/api/wp-graphql` (`:12-13, :32`) and never uses the CMS URL, except in log payloads (`:42 :58 :69`).
  On the **server** (RSC and build-time static generation) it fetches the CMS directly. It is imported
  by 22 files.
- `app/api/wp-graphql/route.ts`: module-level const (`:10`), used inside `POST` (`:33`) and in the 502
  payload (`:49`). `POST` already has a catch-all `try` → 500 `{ error: String(err) }` (`:64-65`).
- `LeadMagnetSection/api.ts` runs **in the browser**: `LeadMagnetSection/index.tsx:1` is `'use client'`
  and calls `getLeadMagnetSection()` from `useEffect` (`:47-52`, no catch). It builds a REST base from
  `NEXT_PUBLIC_WORDPRESS_URL`, strips `/graphql` and `/wp-json` (`:79-80`), and calls
  `${base}/wp-json/wp/v2/media/:id`. All of that sits inside a `try { } catch { /* ignore */ }` (`:78-90`).

Env vars present locally (names and host/path only):
```
NEXT_PUBLIC_WORDPRESS_API_URL = http://magneto-cms-2.local  path: /graphql
NEXT_PUBLIC_WORDPRESS_URL     = http://magneto-cms-2.local  path: (none)
WORDPRESS_URL                 = http://magneto-cms-2.local  path: (none)
```
`.env.local.example` documents only `NEXT_PUBLIC_WORDPRESS_API_URL`.
Other readers, which have **no** production fallback and are out of scope: `pages/api/download.ts:8` and
`pages/api/download-check.ts:5` (chain `…API_URL || …WORDPRESS_URL || WORDPRESS_URL || NEXT_PUBLIC_API_URL`).

`src/utils/wordpress.ts` exists, is **0 bytes**, is tracked (last touched in `c083a48 relocating files…`),
and nothing imports it (`grep -rn "utils/wordpress" src` → nothing). See D1.

### 3. Project detail lookup (`src/app/projects/[slug]/page.tsx`)
- `:15-22` (`generateMetadata`) and `:37-42` (page) both fetch `GET_PROJECTS` (an Apollo `gql` from
  `src/data/projects.ts:27-85`, `projects(first: 12)`), then `.find(p => p.slug === slug)`. If nothing
  matches, `notFound()` is called (`:44-46`).
- `:76-90` `generateStaticParams` uses the same list → pre-renders up to 12 slugs. There is no
  `dynamicParams` export (grep finds none in `src/app`), so it defaults to `true` and unknown slugs
  render on demand.
- `:31-32` metadata `description: project.description`. That field is **not** in the query, so today it
  is always `undefined`. It must stay that way (SEO is Phase 7).
- `ProjectDetail/api.ts` is a placeholder (`return { project: null }`).

Local schema (POST `http://magneto-cms-2.local/graphql`):
```
RootQuery.project(id: ID!, idType: ProjectIdType)       ProjectIdType = DATABASE_ID | ID | SLUG | URI
project(id:"no-existe", idType:SLUG)          → {"data":{"project":null}}
project(id:"trepied-trepied-ca", idType:SLUG) → {"data":{"project":{"id":"cG9zdDo0OTg=","slug":"trepied-trepied-ca","title":"TRÉPIED — trepied.ca"}}}
```
Equivalence check: the same node selection as `GET_PROJECTS`, fetched for each slug via
`project(id:$s, idType:SLUG)` and compared with `JSON.stringify` against the list node:
```
list count 3
trepied-trepied-ca        identical: true  errors: 0  bytes: 13104
shamaniccas-ecommerce     identical: true  errors: 0  bytes: 13202
fashion-company-ecommerce identical: true  errors: 0  bytes: 10855
projects(first:100) → hasNextPage:false, 3 nodes, all status "publish"
```
`RootQueryToProjectConnectionWhereArgs` includes `language` (WPML). The single `project` field takes no
language argument. That matters for Phase 3, not here.

### 4. Leftovers
```
git ls-files → src/components/organisms/Hero/index.tsx.bak (6 bytes) · src/components/organisms/FinalCTASection/types.ts.new (498 bytes)
grep -rn -E "index\.tsx\.bak|types\.ts\.new|\.bak['\"]|\.new['\"]" (repo, minus node_modules/.next/.git/docs)
  → only AGENTS.md:147 (Known debt line)
```
Imports resolve by extension (`.ts/.tsx/.js…`), and `tsconfig.include` `**/*.ts` / `**/*.tsx` does not
match `*.tsx.bak` or `*.ts.new`. Neither file can be compiled or imported.

## Assumptions and open questions
- Assumption: Vercel Production and Preview both define `NEXT_PUBLIC_WORDPRESS_API_URL` (production
  works today, but it **would also work with no env var at all**, because of the fallback). **Not
  verified.** Mauricio checks: Vercel → Project → Settings → Environment Variables, or `vercel env ls`
  (read-only). See "Vercel env" in Design.
- Assumption: `vi.stubEnv` (Vitest 1.6) is enough to test the helper; no new dependency.
- Open: project slugs are unique only per language once WPML is active. Out of scope until Phase 3.
- Resolved (review): `sitemap.xml/route.ts`, `projects/page.tsx`, `app/page.tsx` and
  `generateStaticParams` still use `projects(first: 12)`. A 13th project would render (after this phase)
  but would be missing from the sitemap and the grid. These are out of scope; the Dev records them in
  AGENTS.md Known debt (see Docs).

## Design

### Item 1 — CalendlyButton
- Add one non-throwing hook to `EmailCollectorProvider/index.tsx`, next to `useEmailModal`:
  ```ts
  /** Like useEmailModal, but returns undefined outside EmailCollectorProvider instead of throwing. */
  export const useOptionalEmailModal = () => useContext(EmailModalContext);
  ```
  This adds an export (Hard rule 5: allowed because this spec names it). `useEmailModal` stays unchanged.
- `CalendlyButton/index.tsx:41-47` becomes `const openModal = useOptionalEmailModal()?.openModal;`
  Import `useOptionalEmailModal` instead of `useEmailModal`. The `any` on `:41` and the unused `e`
  on `:45` disappear with it. Touch nothing else in the file: no props, no handlers, no markup.
- **Proof that behaviour is identical (characterization test first):**
  1. Write `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx` **before** changing the
     component, and run it against the current code. It must pass. Cases:
     - a. Inside `<EmailCollectorProvider>`: click → the modal appears (`findByPlaceholderText('you@company.com')`)
       and `openCalendlyPopup` is **not** called.
     - b. Without a provider: render does not throw; click → `openCalendlyPopup` is called once with
       `{ utmContent, utmTerm, customUrl, forceNewWindow }` matching the props, and no modal appears.
     - c. Inside a provider with `skipCollector`: click → `openCalendlyPopup` is called and no modal appears.
     - d. Inside a provider with `forceNewWindow`: same as c, and `forceNewWindow: true` is passed through.
     - e. `disabled`: click → neither the modal nor `openCalendlyPopup`.
     Mock `openCalendlyPopup` like `EmailCollectorProvider.test.tsx` does, or with `vi.mock('@/utils/calendly')`.
     **Never submit the modal form** in this test.
  2. Change the component. Run the same test unchanged. It must pass.
  3. Report both runs (before and after) in the report.
  4. Manual check (Mauricio or a Dev browser session), EN, `/` at 1440 px: click the hero CTA →
     the email modal opens. Close it. **Do not submit.** Repeat on `/about-magneto` (bottom CTA)
     and on the Header CTA.

### Item 2 — single WordPress URL helper
- Home (D1, approved): the existing empty `src/utils/wordpress.ts`.
- API (new types and no `any`):
  ```ts
  // NEXT_PUBLIC_* must be read as literal `process.env.NAME` so Next can inline them into
  // client bundles. Do not use process.env[name] here.
  export function getWpGraphqlUrl(): string
    // = NEXT_PUBLIC_WORDPRESS_API_URL || NEXT_PUBLIC_WORDPRESS_URL   (same precedence as today)
    // missing → throw new Error('Missing NEXT_PUBLIC_WORDPRESS_API_URL — the WPGraphQL endpoint,
    //   e.g. http://magneto-cms-2.local/graphql. Set it in .env.local (local) or in Vercel →
    //   Settings → Environment Variables (Production and Preview).')
  export function getWpBaseUrl(): string
    // = (NEXT_PUBLIC_WORDPRESS_URL || NEXT_PUBLIC_WORDPRESS_API_URL)
    //     .replace(/\/(?:graphql|wp-json)\/?$/i, '').replace(/\/$/, '')   (same strip as LeadMagnet today)
    // missing → throw a similar error naming NEXT_PUBLIC_WORDPRESS_URL
  ```
  Treat empty strings as missing (`||` already does). No caching, no module-level evaluation.
- `utils/wp-graphql.ts`: delete the module const. Inside `fetchWPGraphQL`, compute
  `const url = IS_BROWSER ? CLIENT_PROXY_PATH : getWpGraphqlUrl();` **before** the existing `try`, so the
  missing-env error is not re-wrapped as "fetch failed". Log payloads use `url`. In the browser,
  `getWpGraphqlUrl()` is never called, so a missing var cannot crash client code. Keep the signature,
  the return value and the `revalidate: 60`.
- `app/api/wp-graphql/route.ts`: delete the module const and call `getWpGraphqlUrl()` **inside**
  `POST`, within the existing `try`. A missing env var then gives 500 `{ "error": "Error: Missing
  NEXT_PUBLIC_WORDPRESS_API_URL …" }` at request time instead of breaking `next build` at import. The
  502 payload's `upstream` uses the local variable. Do not touch headers, UA, `runtime` or `dynamic`.
- `LeadMagnetSection/api.ts:79-80`: replace both lines with `const restBase = getWpBaseUrl();`, called
  **before** the inner `try` on `:78`, so the error is not swallowed by `catch { /* ignore */ }`. It
  reaches the `useEffect` in `index.tsx`, which has no catch, so it shows up as an unhandled rejection in
  the browser console. The section still renders its hardcoded EN defaults (`index.tsx:63-70`). That is
  acceptable for a misconfiguration and visually identical. Do not change `index.tsx`.
- Behaviour with env vars set: identical URLs. Locally the GraphQL URL is unchanged and the REST base
  stays `http://magneto-cms-2.local`. In Vercel, if only `…API_URL` is set, the REST base becomes that
  host minus `/graphql`, which is the same production host the old fallback used.
- Tests: `src/utils/wordpress.test.ts` with `vi.stubEnv` / `vi.unstubAllEnvs`:
  API_URL set → returned; only WORDPRESS_URL set → returned (graphql); both missing or empty → throws a
  message containing the var name; base strips `/graphql`, `/graphql/`, `/wp-json`, trailing `/`;
  base falls back to API_URL.
- `.env.local.example`: add `NEXT_PUBLIC_WORDPRESS_URL=https://cms.yourdomain.com` with a comment
  that both are required, the GraphQL one with `/graphql`, and that a missing var now throws.
  Placeholders only.

**Vercel env (Mauricio, before merging 0.5b):** both must exist in **Production and Preview**.
`NEXT_PUBLIC_*` values are inlined at build time, so a change needs a redeploy.
| Var | Used by | Expected value shape |
|---|---|---|
| `NEXT_PUBLIC_WORDPRESS_API_URL` | `fetchWPGraphQL` at build (static generation of the 14 pages) and at runtime (ISR), plus the `/api/wp-graphql` proxy | `https://cms.magnetomarketing.co/graphql` |
| `NEXT_PUBLIC_WORDPRESS_URL` | LeadMagnet REST media lookup (browser); also read by `pages/api/download*.ts` | `https://cms.magnetomarketing.co` (base, no path) |
Optional: `WORDPRESS_URL` is read only by `download*.ts`, with no change in this phase.
If `NEXT_PUBLIC_WORDPRESS_API_URL` is missing on Vercel, the build fails or pages render their EN
fallbacks (depending on each page's own catch). That is visible, unlike today's silent fallback.

### Item 3 — project by slug
- New `src/app/projects/[slug]/api.ts` (the route pattern: query + fetcher):
  - `GET_PROJECT_BY_SLUG_QUERY`, a plain string:
    `query GetProjectBySlug($slug: ID!) { project(id: $slug, idType: SLUG) { …the exact node selection from GET_PROJECTS… } }`.
    The same fields matter, because the mapping in `page.tsx` depends on them (verified identical above).
  - Typed response (`ProjectNode`, `GetProjectBySlugResponse`) declared in this file, with no `any`.
  - `export const getProjectBySlug = cache(async (slug: string): Promise<ProjectNode | null> => …)`,
    using `cache` from `react`. Today `generateMetadata` and the page each fetch the list, so this
    dedupes them into one request per render. No new dependency.
- `page.tsx`: `generateMetadata` and `ProjectPage` call `getProjectBySlug(slug)` in place of fetch + `.find`.
  `null` → same title `'Project Not Found'` and the same `notFound()`. Keep the mapping block
  (`:48-69`) as is. You may type it with `ProjectNode` to drop the `any`s, but the output must stay
  identical. Metadata `description` must stay `undefined`, the same as today.
- `generateStaticParams`: **unchanged** (still the 12-item list, pre-render only). Slugs past the first
  12 render on demand, because `dynamicParams` defaults to true. Do not touch `src/data/projects.ts`
  (Apollo removal is separate Known debt).
- Test: `src/app/projects/[slug]/api.test.ts` mocks `@/utils/wp-graphql`, and checks that
  `getProjectBySlug('x')` sends a query containing `project(id: $slug, idType: SLUG)` with variables
  `{ slug: 'x' }`, returns the node, and returns `null` for `{ project: null }`.
  The 13th-project case cannot be reproduced without writing WP content (forbidden). The test plus the
  removed list dependency are the proof.

### Item 4 — leftovers
`git rm src/components/organisms/Hero/index.tsx.bak src/components/organisms/FinalCTASection/types.ts.new`
(staging the deletion is fine; no commit). Before deleting, re-run the grep from Evidence §4 and paste
it. After deleting, the build must pass with 14/14 pages.

### Docs
- `AGENTS.md`:
  - Known debt: remove the `rules-of-hooks` line, the "Hardcoded production CMS fallback in 3 files"
    line and the "Leftovers" line.
  - Known debt (Code): add one line, e.g. "`projects(first: 12)` still used by `sitemap.xml/route.ts`,
    `projects/page.tsx` (grid), `app/page.tsx` (home) and `projects/[slug]` `generateStaticParams`.
    Projects past 12 are missing from the sitemap and the grid." Check the file list with
    `grep -rn "GET_PROJECTS" src` at implementation time and list what you find.
  - Hard rule 1: replace "`wp-graphql.ts` and `app/api/wp-graphql/route.ts` silently fall back to
    production if the env var is missing" with "the WordPress helpers in `utils/wordpress.ts` throw
    if `NEXT_PUBLIC_WORDPRESS_API_URL` is missing". Keep "confirm the target before any data work".
  - Nothing else.
- `CLAUDE.md`: "Current phase" → `Phase 0.5b — code hygiene.` plus the scope pointer to this spec.

## Files the Dev may touch
- `src/components/atoms/CalendlyButton/index.tsx`: hook swap only (`:9`, `:41-47`).
- `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx`: new.
- `src/components/organisms/EmailCollectorProvider/index.tsx`: add `useOptionalEmailModal` export only.
- `src/utils/wordpress.ts`: the helper (file exists, empty; D1).
- `src/utils/wordpress.test.ts`: new.
- `src/utils/wp-graphql.ts`: URL resolution only.
- `src/app/api/wp-graphql/route.ts`: URL resolution only.
- `src/components/organisms/LeadMagnetSection/api.ts`: `:79-80` only.
- `src/app/projects/[slug]/api.ts`: new.
- `src/app/projects/[slug]/api.test.ts`: new.
- `src/app/projects/[slug]/page.tsx`: lookup via `getProjectBySlug`; optional typing of the mapping.
- `src/components/organisms/Hero/index.tsx.bak`, `src/components/organisms/FinalCTASection/types.ts.new`: delete.
- `.env.local.example`: document `NEXT_PUBLIC_WORDPRESS_URL`.
- `AGENTS.md`, `CLAUDE.md`: the lines listed under Docs.
- `docs/reports/phase-0-5b-code-hygiene.md`: the report.
(Anything not listed is out of scope. `.env.local` is never touched.)

## Out of scope
- The `fashion-company-ecommerce` slug showing Dangel Wellness content (content + redirect decision, later).
- Lint cleanup beyond what the edits remove by themselves; `any` elsewhere; DOMPurify; Calendly event URLs.
- `pages/api/download*.ts` env chains; `next.config.ts` image hosts; `utils/seo.ts` `SITE_URL` fallback.
- `projects(first: 12)` in the sitemap (`sitemap.xml/route.ts`), the projects grid (`projects/page.tsx`),
  the home (`app/page.tsx`) and `generateStaticParams`. Not fixed here; **the Dev adds it to AGENTS.md
  Known debt** (see Docs). `src/data/projects.ts` / Apollo also stays.
- `projects/[slug]/not-found.tsx` links to `/portfolio` (a dead route). It is handled by the **new 404
  page task**.
- Project metadata description, always `undefined` today (Phase 7, SEO i18n).
- WPML language for the single `project` query (Phase 3).
- Other empty files: `src/styles/components/card.scss`, `src/styles/pages/contact.scss` (noted only).

## Acceptance criteria
- [ ] Preconditions recorded: PR #4 merged; on a branch from `master` that contains 0.5a;
      `grep -c '^DISABLE_SMTP=1$' .env.local` → `1`; WordPress env hosts → `magneto-cms-2.local` (names/hosts only).
- [ ] **Merge precondition (D3):** Mauricio confirms that **both** `NEXT_PUBLIC_WORDPRESS_API_URL` and
      `NEXT_PUBLIC_WORDPRESS_URL` exist in Vercel for **Production and Preview** before the 0.5b PR is merged.
      The Dev cannot check this. The report lists it as "pending — Mauricio" until confirmed.
- [ ] `grep -rn "cms\.magnetomarketing" src` → **0 hits**.
- [ ] `grep -rn "useEmailModal()" src/components/atoms/CalendlyButton` → 0. `npm run lint` shows no
      `rules-of-hooks` line.
- [ ] Gate vs the 0.5a baseline:
  - lint: **errors ≤ 145** (expected 144: rules-of-hooks + the `:41` any); warnings ≤ 119; no new
    lint line in any touched file. Give the per-file before/after for the touched files (table in Evidence).
  - `npm run typecheck`: 0 errors, also after `rm -rf .next && npx next typegen`.
  - `npm test -- --run`: the 2 existing files / 4 tests still pass, plus the new files (CalendlyButton,
    wordpress helper, projects api). Give counts. The CalendlyButton test passes **before and after** the change.
  - `npm run build`: passes, **14/14** static pages, `/projects/[slug]` pre-renders the same 3 slugs.
- [ ] HTTP smoke (`npm run dev`, GET only) identical to 0.5a after A1: `/` `/services` `/packages`
      `/projects` `/about-magneto` `/contact` + the 3 project pages → 200; `/projects/no-existe` → 404;
      `/carte` → 404; `/robots.txt` `/sitemap.xml` → 200; `/api/ping-cms` → 404.
- [ ] Project pages: for the 3 slugs, `<title>` and `<meta name="description">` (if any) are byte-identical
      before and after (capture before, with `curl` into the scratchpad). The visible `h1` and the gallery
      image count are unchanged.
- [ ] Data source: rendered HTML of the 7 routes → `magneto-cms-2.local` > 0, `cms.magnetomarketing.co` = 0.
- [ ] Proxy: `curl -s -X POST localhost:3000/api/wp-graphql -H 'Content-Type: application/json' --data '{"query":"{ generalSettings { title } }"}'`
      → 200 JSON from the local CMS (read-only query).
- [ ] LeadMagnet: on `/`, the "Download our free guide" button still opens the modal (do **not**
      submit). The browser console has no new errors compared with before.
- [ ] Leftovers: both files gone (`git status` shows `D`), the reference grep is clean, and the build passes.
- [ ] EN visual, unchanged: `/`, `/about-magneto`, `/projects/trepied-trepied-ca` at 375 / 768 / 1440 px,
      including the CalendlyButton manual steps in Item 1. "Not run — manual by Mauricio" is acceptable
      only if no browser tool is available. Say which.
- [ ] AGENTS.md Known debt has the new `projects(first: 12)` line, and the three resolved lines are removed.

## Decisions (resolved — Senior Architect, 2026-10-24)
- **D1: helper location → approved:** the existing empty `src/utils/wordpress.ts` holds
  `getWpGraphqlUrl()` / `getWpBaseUrl()`.
- **D2: `useOptionalEmailModal` → approved** as an additive export. `useEmailModal`, the default export
  and `EmailCollectorProvider` stay unchanged.
- **D3: fail-loud on missing env → approved**, with the explicit merge precondition in Acceptance criteria
  (Mauricio confirms both vars in Vercel Production and Preview).
- No ADR needed: no new dependency, no routing or data-model change (same WPGraphQL fields, single-node query).

## Estimate
- Agent time: 45–75 min (characterization test 10–15, helper + tests 15, project api + test 10,
  gate + before/after captures + smoke 15, report 10).
- Active human time: 20–40 min (review, D1–D3, check Vercel env vars, manual CTA / visual check, commit).
