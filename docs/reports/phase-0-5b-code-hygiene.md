# Phase 0.5b report — Code hygiene

- Spec: `docs/specs/phase-0-5b-code-hygiene.md` (Approved — 2026-10-24; D1, D2, D3 approved)
- Author: Dev · Date: 2026-10-24 · Branch: `chore/phase-0-5b-code-hygiene` (from `master` @ `b472698`)

## Result
**Done.** The four Known-debt items are gone. Gate green: lint went from 146 to **136** errors.
Server-rendered EN output is byte-identical before and after on every checked route.
Two things need attention:
- **Merge precondition D3 is still pending — Mauricio** (Vercel env vars, below).
- **One spec assumption was wrong** (LeadMagnet error propagation): see Deviations.

## Preconditions
| Check | Result |
|---|---|
| PR #4 merged | yes: `origin/master` = `b472698 Merge pull request #4 …`; `git merge-base --is-ancestor b472698 HEAD` → true |
| Branch | `chore/phase-0-5b-code-hygiene`, created from up-to-date `master` |
| `grep -c '^DISABLE_SMTP=1$' .env.local` | `1` |
| WordPress env hosts (names/hosts only) | `NEXT_PUBLIC_WORDPRESS_API_URL`, `NEXT_PUBLIC_WORDPRESS_URL`, `WORDPRESS_URL` → `magneto-cms-2.local` |
| Active `MAILCHIMP_*` / GA / GTM | 0 |
| **D3: Vercel has both `NEXT_PUBLIC_WORDPRESS_API_URL` and `NEXT_PUBLIC_WORDPRESS_URL` in Production and Preview** | **pending — Mauricio.** Must be confirmed before merging. Without them, Vercel builds now fail instead of silently using production. |

## Changes
Item 1: CalendlyButton
- `src/components/organisms/EmailCollectorProvider/index.tsx`: added
  `export const useOptionalEmailModal = () => useContext(EmailModalContext);` with a doc comment. `useEmailModal`,
  the default export and the provider are unchanged.
- `src/components/atoms/CalendlyButton/index.tsx`: import swapped to `useOptionalEmailModal`; `:41-47`
  (`let openModal: any…; try { useEmailModal() } catch`) became `const openModal = useOptionalEmailModal()?.openModal;`.
  Nothing else changed: no props, handlers or markup.
- `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx`: new characterization test, cases a–e from the spec.

Item 2: one WordPress URL helper (no production fallback)
- `src/utils/wordpress.ts` (was 0 bytes): `getWpGraphqlUrl()` and `getWpBaseUrl()`. Literal `process.env.NAME` reads,
  no module-level evaluation, no `any`. Both throw an error naming the missing variable.
- `src/utils/wp-graphql.ts`: the module constant is gone; `url` is resolved **before** the `try`, and the log
  payloads use `url`. Signature, return value and `revalidate: 60` are unchanged.
- `src/app/api/wp-graphql/route.ts`: the module constant is gone; `getWpGraphqlUrl()` is called inside `POST`, within
  the existing `try`. The 502 `upstream` uses the local value. Headers, UA, `runtime` and `dynamic` are untouched.
- `src/components/organisms/LeadMagnetSection/api.ts`: `:79-80` → `const restBase = getWpBaseUrl();`, placed
  before the inner `try` (see Deviations: the outer `try` still swallows the error).
- `src/utils/wordpress.test.ts`: new, 15 tests.
- `.env.local.example`: documents `NEXT_PUBLIC_WORDPRESS_URL` (placeholder) and states that both vars are required.

Item 3: project by slug
- `src/app/projects/[slug]/api.ts`: new. `GET_PROJECT_BY_SLUG_QUERY` (`project(id: $slug, idType: SLUG)`,
  same node selection as `GET_PROJECTS`), typed `ProjectNode` / `GetProjectBySlugResponse`, and
  `getProjectBySlug = cache(async (slug) => …)` using React `cache`.
- `src/app/projects/[slug]/page.tsx`: `generateMetadata` and `ProjectPage` use `getProjectBySlug`. `null` gives
  the same `'Project Not Found'` title and the same `notFound()`. The mapping is now typed (all 8 `any`s removed)
  with identical output. Metadata `description` is now an explicit `undefined`, which is the same value as before
  (`project.description` was never queried). `generateStaticParams` is unchanged.
- `src/app/projects/[slug]/api.test.ts`: new, 3 tests.

Item 4: leftovers
- `src/components/organisms/Hero/index.tsx.bak` (6 B) and `src/components/organisms/FinalCTASection/types.ts.new`
  (498 B) deleted with plain `rm` (not `git rm`; nothing is staged, per Mauricio).

Docs
- `AGENTS.md`:
  - Hard rule 1 now points at `utils/wordpress.ts` throwing.
  - Known debt: removed the rules-of-hooks, production-fallback and Leftovers lines.
  - Known debt: added the `projects(first: 12)` line. Its file list comes from `grep -rln GET_PROJECTS src`:
    `app/page.tsx`, `app/projects/page.tsx`, `app/sitemap.xml/route.ts`, `projects/[slug]/page.tsx`
    (`generateStaticParams`), plus `data/projects.ts` (definition) and `projects/[slug]/api.ts` (a comment only).
- `CLAUDE.md`: "Current phase" → `Phase 0.5b — code hygiene.` plus the scope pointer.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | failed (pre-existing), **improved** | 136 errors · 118 warnings · 46 files (was 146 · 119 · 47). 0 `rules-of-hooks` lines. |
| typecheck | passed | `npm run typecheck` exit 0; also after `rm -rf .next && npx next typegen` → exit 0 |
| tests | passed | **5 files · 27 tests** (was 2 · 4): wordpress 15, projects api 3, CalendlyButton 5, contact 2, EmailCollectorProvider 2 |
| build | passed | `✓ Generating static pages (14/14)`; `/projects/[slug]` pre-renders the same 3 slugs; no warnings |
| visual (routes · viewports · locales) | partial | EN only. CTAs and the modal checked in Chrome. Screenshots after the change at ~1258 px for `/`, `/about-magneto`, `/projects/trepied-trepied-ca`. **768 / 375 not run**: `resize_window` had no effect (`innerWidth` stayed 1258). The SSR DOM is byte-identical before/after (below). |

Lint per touched file, before → after (same script, same run conditions):
| File | Errors | Warnings | Notes |
|---|---|---|---|
| `CalendlyButton/index.tsx` | 2 → **0** | 5 → **4** | `:41` any, `:44` rules-of-hooks and the `:45` unused `e` are gone. The remaining warnings are pre-existing (`:7` `loadCalendlyScript`, catch vars), shifted by 5 lines. |
| `EmailCollectorProvider/index.tsx` | 4 → 4 | 5 → 5 | unchanged. The spec's table says 5 errors; my parser counts 4 (`:196` any, three `no-unescaped-entities`) in both runs. |
| `utils/wp-graphql.ts` | 6 → 6 | 4 → 4 | same rules, `:29` → `:27` |
| `app/api/wp-graphql/route.ts` | 3 → 3 | 0 → 0 | same rules, shifted by 3 lines |
| `LeadMagnetSection/api.ts` | 2 → 2 | 3 → 3 | same rules, shifted by 1 line |
| `projects/[slug]/page.tsx` | 8 → **0** | 0 → 0 | all `no-explicit-any` removed |
| new files (`wordpress.ts`, 3 tests, `projects/[slug]/api.ts`) | 0 | 0 | |
No new lint line in any touched file.

## Evidence

### CalendlyButton: characterization test before and after
1. Written **before** touching the component. First run: 5/5 failed with `ReferenceError: React is not defined`,
   thrown at `CalendlyButton/index.tsx:116`. Vitest compiles JSX with the classic runtime, and the component
   (written for Next's automatic runtime) doesn't import React. The fix is a test-only shim:
   `globalThis.React = React`, scoped to this file (see Deviations). `git diff src/components` was empty at this point.
2. **Before the refactor** (component unchanged): `Test Files 1 passed · Tests 5 passed` (a–e all ✓).
3. Refactor applied. Test file md5 checked unchanged.
4. **After the refactor**: `Test Files 1 passed · Tests 5 passed` (a–e all ✓).
5. `grep -rn "useEmailModal()" src/components/atoms/CalendlyButton` → no hits. Lint → 0 `rules-of-hooks`.

### Manual modal check (Chrome, EN, `npm run dev`, ~1258 px; **no submit, each modal closed with its "Close" button**)
| Page · CTA | Before | After |
|---|---|---|
| `/` Header "Free Schedule Call" | modal "Quick — before we book" | same |
| `/` Hero "Book a Free Strategy Call" | modal "Quick — before we book" | same |
| `/` LeadMagnet "Get the PDF and join our tips newsletter" | modal "Grab your free guide" | same |
| `/` Final CTA "Get Your Free Strategy Call" | modal "Quick — before we book" | same |
| `/about-magneto` Hero, middle and Final CTA (3 buttons) | modal "Quick — before we book" ×3 | same |
In every case no Calendly iframe opened and the modal closed afterwards. Note: the spec calls the LeadMagnet button
"Download our free guide"; locally its CMS copy is "Get the PDF and join our tips newsletter".

Console errors on `/` and `/about-magneto`: **before** 1, `Error: Could not establish connection. Receiving end
does not exist.` (a Chrome-extension message, not app code). **After** 0. No new errors.

Screenshots (after only, ~1258 px viewport):
`/var/folders/2d/88_tvn7j7ygbz6wxvdxgl7x80000gn/T/claude-chrome-screenshots-KUvz4k/screenshot-1792856498894-0.jpg` (`/about-magneto`),
`…-1792856498895-1.jpg` (`/`), `…-1792856498895-2.jpg` (`/projects/trepied-trepied-ca`). Copies are in the session scratchpad.

### No production fallback
```
grep -rn "cms\.magnetomarketing" src → (no output, exit 1)
```

### Project by slug: equivalence on the local CMS (read-only POSTs)
```
selection text identical to GET_PROJECTS nodes (whitespace-normalized): True
trepied-trepied-ca        identical: True errors: 0
shamaniccas-ecommerce     identical: True errors: 0
fashion-company-ecommerce identical: True errors: 0
no-existe → {'project': None} errors: 0
```

### HTTP smoke and page output (dev, GET only; captured before any code change and again after)
```
diff before/smoke.txt after/smoke.txt → identical
200 / /services /packages /projects /about-magneto /contact + the 3 project pages
404 /projects/no-existe · 404 /carte · 200 /robots.txt · 200 /sitemap.xml · 404 /api/ping-cms
data source (7 routes): before local 409 / prod 0 · after local 409 / prod 0
```
Project pages (before = after, `diff` identical):
```
trepied-trepied-ca         title "TRÉPIED — trepied.ca | Magneto Projects" · no meta description · h1 same · gallery imgs 9
shamaniccas-ecommerce      title "Shamanicca’s Ecommerce | Magneto Projects" · no meta description · h1 same · gallery imgs 9
fashion-company-ecommerce  title "Dangel Wellness — dangelwellness.ca | Magneto Projects" · no meta description · h1 same · gallery imgs 7
<title> + <meta name="description"> byte-compare (md5): 1 distinct hash per slug
```
Rendered SSR DOM, normalized (scripts, `<link>`s and `/_next/static` hashes removed), before vs after:
`/`, `/services`, `/packages`, `/projects`, `/about-magneto`, `/contact`, `/projects/trepied-trepied-ca` (90,310
chars) and the 3 project pages: **identical, 0 diff tokens**.

Proxy: `POST /api/wp-graphql {"query":"{ generalSettings { title } }"}` → `200 application/json`,
`{"generalSettings":{"title":"Magneto CMS"}}`, the same before and after.

### Leftovers
```
git ls-files → both listed · sizes 6 B / 498 B
grep -rn -E "index\.tsx\.bak|types\.ts\.new|\.bak['\"]|\.new['\"]" (minus node_modules/.next/.git/docs)
  → AGENTS.md:147 (the Known-debt line, now removed) only
after rm: git status → D for both; build passes 14/14
```

### Git
`git diff --cached --name-only` → empty (nothing staged). 12 tracked files changed (93+ / 83−), 4 new files, plus the
untracked spec.

## Deviations from the spec
1. **LeadMagnet error does not propagate (the spec's assumption was wrong).** The spec says that calling
   `getWpBaseUrl()` before the inner `try` (`:78`) lets the error reach the `useEffect`. In fact the whole block is
   inside an **outer** `try { … } catch { /* ignore */ }` (`api.ts:62` → `:97-99`), so a missing
   `NEXT_PUBLIC_WORDPRESS_URL` is still swallowed there. The download link then falls back to `possibleUrl`, the
   same as when REST fails. The production fallback is gone either way, so Goal 2 ("no source file falls back") holds.
   Making it fail loudly means moving the call above `:62`, outside the allowed `:79-80`, so I didn't do it.
   My code comment says this accurately. **Architect's call:** accept it, or make a one-line follow-up.
2. **Test-only React shim** in `CalendlyButton.test.tsx` (`globalThis.React = React`). The clean fixes (automatic JSX
   in `vitest.config.ts`, or `import React` in the component) are out of the file list. It was in place for both the
   before and after runs, so the comparison is valid.
3. **`ProjectData` cast in `page.tsx`.** Typing the mapping exposed that `ProjectData` (`src/data/projects.ts`, out of
   scope) doesn't match the real shape: `id` is a GraphQL `string`, and `gallery` items are objects with
   `isMobileScreenshot` (as `ProjectDetail` reads them). The old `any`s hid this. I used one commented
   `as unknown as ProjectData` cast at the `<ProjectDetail>` prop: no new `any`, same runtime value.
4. `wordpress.test.ts` "undefined" case uses `delete process.env[...]`, because Vitest 1.6 `stubEnv(name, undefined)`
   stores the string `"undefined"`. `unstubAllEnvs()` restores the originals.
5. `git rm` (spec Item 4) was replaced by plain `rm`, per Mauricio: nothing staged.
6. Visual: 768 / 375 px not run (window resize had no effect), and "1440" was really a ~1258 px viewport.
   Compensated by the byte-identical SSR DOM comparison. **Manual 375 / 768 / 1440 check by Mauricio is still recommended.**
7. Browser logs: in the browser, `fetchWPGraphQL` log payloads now show `url: "/api/wp-graphql"` (the URL actually
   called) instead of the CMS host. Dev logs only.

## Issues found (not fixed)
- **`ProjectData` type mismatch** (`src/data/projects.ts`: `id: number`, `gallery?: string[]`), as above. It belongs with the Apollo / `data/projects.ts` cleanup.
- Fail-loud on a missing env var is **not verified end to end**. Next always loads `.env.local`, and editing it is
  forbidden, so I didn't run a build or proxy request with the vars unset. Covered by the unit tests instead.
- The AGENTS.md Known-debt line "122 `no-explicit-any` (102 outside test files)" is now stale (9 fewer). D2 says
  "Nothing else", so I left it.
- Spec wording: the LeadMagnet button label in the spec ("Download our free guide") differs from the local CMS copy
  ("Get the PDF and join our tips newsletter"). This is a copy check for Mauricio, not a code issue.

## Proposed commits
Nothing staged. Suggested order (each leaves the gate green):

1. `refactor(calendly): read the email modal with a non-throwing hook (fixes rules-of-hooks)`
   - `src/components/organisms/EmailCollectorProvider/index.tsx`
   - `src/components/atoms/CalendlyButton/index.tsx`
   - `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx`
2. `fix(cms): resolve WordPress URLs in one helper and drop the production fallback`
   - `src/utils/wordpress.ts`
   - `src/utils/wordpress.test.ts`
   - `src/utils/wp-graphql.ts`
   - `src/app/api/wp-graphql/route.ts`
   - `src/components/organisms/LeadMagnetSection/api.ts`
   - `.env.local.example`
3. `fix(projects): load the project detail by slug instead of scanning the first 12`
   - `src/app/projects/[slug]/api.ts`
   - `src/app/projects/[slug]/api.test.ts`
   - `src/app/projects/[slug]/page.tsx`
4. `chore: remove leftover Hero/index.tsx.bak and FinalCTASection/types.ts.new`
   - `src/components/organisms/Hero/index.tsx.bak` (deleted)
   - `src/components/organisms/FinalCTASection/types.ts.new` (deleted)
5. `docs(phase-0.5b): spec, report, known debt and current phase`
   - `docs/specs/phase-0-5b-code-hygiene.md` (untracked; it isn't on `master` yet)
   - `docs/reports/phase-0-5b-code-hygiene.md`
   - `AGENTS.md`
   - `CLAUDE.md`

For the deletions in commit 4 use `git add -u src/components/organisms/Hero src/components/organisms/FinalCTASection`
(or `git rm --cached`), since `git add <deleted path>` also works on recent Git.

## Time
Agent time ≈ 60 min (estimated). Active human time: unknown. Waiting: PR #4 merge (≈ a few minutes).

---

## Re-check — 2026-10-24 (requested by Mauricio before Senior Architect review)
Same branch and working tree (`HEAD b472698` = `origin/master`, nothing staged, every changed path in the spec's file list).

| Check | Result |
|---|---|
| Preconditions | `DISABLE_SMTP=1` count 1; both WordPress vars → `magneto-cms-2.local` |
| `grep cms.magnetomarketing src` / `useEmailModal()` in CalendlyButton / leftovers | 0 / 0 / both absent |
| lint (from clean `.next`) | 136 errors · 118 warnings · 46 files · 0 `rules-of-hooks`, the same as the report |
| typecheck | exit 0 without `.next`; exit 0 after `next typegen` (CI order) |
| tests | 5 files · 27 tests passed |
| build | passed, 14/14, same 3 project slugs, 0 warning/error lines |
| **CI dry run (new)** | clean `git worktree` at HEAD + this working tree's changes, no `.env.local`, WordPress vars unset: `npm ci` → `next typegen` → `typecheck` → `test` = 5 / 27 passed. Worktree removed. |
| **Mutation check (new, in that worktree only)** | forcing `openModal` to `undefined` in `CalendlyButton` → case **a fails** (1 failed / 4 passed), so the characterization test detects a broken modal path. Repo file untouched. |
| HTTP smoke · data source · project title/meta/h1/gallery · proxy | identical to the "before" capture; local 409 / prod 0; proxy 200 JSON |
| SSR DOM (normalized) of the 7 routes + 3 project pages | byte-identical to "before" |

**Incident during the re-check (process hygiene, not a code issue).** While the gate ran, another process
(PID 30914, most likely Mauricio's own `npm run dev` for this repo) took port 3000. My dev server fell back to
:3001, and my capture script (hardcoded to :3000) measured the other server. It returned 500/404, plausibly
because my `rm -rf .next` + `next build` had rewritten the `.next` it was using. My cleanup loop (`kill` whatever
listens on :3000) then **stopped PID 30914, which was not mine.** I discarded those results and re-ran the smoke
against my own server, with the port read from its log and the PID recorded, and stopped only that PID.
Fixes for future runs: the capture script takes `BASE`; servers are stopped by recorded PID, never by port. If
you had a dev server running, restart it.
