# Phase 2 report — Locale routing (infrastructure only)

- Spec: `docs/specs/phase-2-locale-routing.md` (Approved — 2026-10-24)
- Author: Dev · Date: 2026-10-24 · Branch: `feat/phase-2-locale-routing` (HEAD `22ab3f4`, **nothing staged**)

## Status after the Senior Architect decisions (2026-10-24, round 2)

**Phase 2 is done.** Mauricio approved the switcher look (2026-10-24) as shown in `<scratchpad>/p2/v5/`
(desktop nav and mobile menu), with no style changes. Every acceptance item now passes or is an approved
deviation. `CLAUDE.md` "Current phase" is updated. The merge precondition is still open: the Vercel preview
check (see below).

Decisions applied:
- **Q-A — approved, done.** Added `src/app/[locale]/not-found.tsx`: a one-line re-export of Next's built-in 404
  plus a comment marking it as the future home of the custom 404 page (separate task). The checks were re-run
  (below): every 404 keeps the header and footer, and the `/carte` screenshots match V0 at 375/768/1440.
- **Q-B — accepted as known debt.** AGENTS.md line added. Lint baseline is now **164 errors / 118 warnings**.
- **Production 500 — confirmed live** by the Senior Architect (`www.magnetomarketing.co/projects/no-existe`).
  Known debt line added. Phase 2 fixes the unknown-slug case (`/projects/no-existe` → 404 with the "Project Not
  Found" page). **Merge precondition: check `/projects/no-existe` and a prerendered project on the Vercel
  preview.**

## Result
**Done.** Switcher look approved by Mauricio (2026-10-24, no style changes). Merge after the Vercel preview check.
- Routing, enablement flag, `lang`, switcher and tests are in.
- EN pages: SSR HTML byte-identical on 7/7 routes; 24/24 screenshots pixel-identical, `/carte` included.
- V3, V4 and V5 (behaviour) pass.

## Changes (all unstaged; files moved with `mv`, not `git mv`)
- `src/i18n/config.ts`, `paths.ts`, `routing.ts` (new): as in spec sections 1–2.
- `src/i18n/config.test.ts`, `paths.test.ts`, `routing.test.ts` (new): 14 + 21 + 10 tests.
- `src/middleware.ts` (new): rewrite / pass-through, the spec's matcher, one comment on `/en/*`.
- `src/app/{page.tsx,about-magneto,contact,packages,projects,services}` → `src/app/[locale]/…`: moved; contents
  unchanged except `ServicesList.tsx:3` (F7) and the two fixes above.
- `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`:
  - `params`, `isLocale` narrowing, `lang={HTML_LANG[locale]}`, `generateStaticParams`.
  - `switcher` passed to `Header` only when 2+ locales are enabled.
  - `generateMetadata` unchanged.
- `src/app/[locale]/[...rest]/page.tsx` (new): `notFound()` only.
- `src/app/[locale]/not-found.tsx` (new, approved Q-A): `export { default } from 'next/dist/client/components/builtin/not-found';`
  plus a comment. It keeps 404s inside the layout, and the custom 404 page task will replace it.
- `src/components/molecules/LanguageSwitcher/{index.tsx,types.ts,LanguageSwitcher.scss,LanguageSwitcher.test.tsx}` (new).
  - `:focus-visible` rule added: outline in `currentColor`, so it works on the white header and on the purple
    mobile menu.
- `src/components/molecules/index.ts`: one export line.
- `src/components/organisms/Header/index.tsx`: optional `switcher?: React.ReactNode` (props are inline in this file);
  the two commented FR/ES placeholder blocks are replaced by `{switcher && <li …>{switcher}</li>}`. Unset →
  identical markup (V2).
- `LeadMagnetSection/index.tsx`, `FinalCTASection/index.tsx`, `ProjectsGrid/index.tsx`: compare
  `splitLocalePath(pathname ?? '/').path` (spec section 5).
- `.env.local.example`: the `ENABLED_LOCALES` block.
- `docs/adr/0003-locale-routing.md` (new): D1–D6 + the D2 "Revisit" note.
- `AGENTS.md`:
  - directory map (`app/[locale]`, `[...rest]`, `middleware.ts`, `i18n/`) and the "Where text lives" note;
  - Known debt: the `lang="en"` line → the `openGraph.locale 'en_US'` part (Phase 7);
  - lint baseline → 164 / 118, plus the `no-html-link-for-pages` line (Q-B);
  - the server-bundle sanitizer crash line.
  - 195 lines.
- `CLAUDE.md`: "Current phase" → `Phase 2 — Locale routing: done (2026-10-24); merge after the Vercel preview check.` + scope/report pointers.
- `.env.local`: not edited. `ENABLED_LOCALES` name confirmed present (value not printed).

## Gate (round 2, with `not-found.tsx`)
Run in a fresh worktree of `HEAD` + the working-tree `src/` synced in (`<scratchpad>/p2wt-after`, `npm ci`,
`.env.local` symlinked read-only). Port 3100 only; nothing was listening on 3000 at any point, and nothing was
touched there. Round-1 numbers were the same except where noted.

| Check | Result | Notes |
|---|---|---|
| lint | failed — **= new accepted baseline** | 164 errors / 118 warnings / 46 files. The only difference from the 0.5b baseline is +28 `no-html-link-for-pages` in Header (Q-B, known debt). New files: 0 errors |
| typecheck | passed | |
| tests | passed | 9 files / 77 tests (was 5 / 27); the moved `[locale]/projects/[slug]/api.test.ts` passes |
| build (`ENABLED_LOCALES` unset) | passed | 14/14; only `en` prerendered; Middleware 34.2 kB |
| build `=en,fr,es` / `=en,fr` | passed | 32/32 (round 2) / 23/23 (round 1) |
| V1 EN smoke | passed | identical to V0 except `/projects/no-existe` 500 → **404** (production bug fixed for unknown slugs) |
| V2 EN HTML | passed (approved deviation) | 7/7 routes byte-identical; `/carte` raw 404 HTML differs, but the status is 404 and the screenshots match (Q-A) |
| V3 hydration | passed | re-run in round 2: 0 hydration messages, 0 errors |
| V4 enablement | passed | all-locales status table identical to round 1 |
| V5 switcher | passed | behaviour verified; look approved by Mauricio as in `p2/v5/` (desktop + mobile menu), no style changes |
| EN visual 375/768/1440 | **passed 24/24** | `/carte` included |

## Evidence
`<scratchpad>` = `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/daecc535-73cf-4f93-9569-e12da35576e8/scratchpad`.
Captures in `<scratchpad>/p2/`.
- `cap.sh`: status + `Location`, normalized HTML, project meta, proxy.
- `shots.sh`: headless Chrome `--screenshot`.
- `cdp.mjs`: DevTools-protocol driver, used for V3/V5.
- `pngdiff.mjs`: pixel diff.

### V0 — "before" (HEAD `22ab3f4`, worktree `p2wt-before`, `next build && next start -p 3100`)
Captured twice (`v0a`, `v0b`), before any file was moved. Both runs are identical: status, normalized HTML,
and 24/24 screenshots pixel-identical.

Build route table, before: `○ /`, `○ /about-magneto`, `○ /contact`, `○ /packages`, `○ /projects`,
`● /projects/[slug]` (3 slugs), `○ /services`, `○ /_not-found`, `ƒ /api/wp-graphql`, `○ /robots.txt`,
`○ /sitemap.xml` → 14/14.

Build route table, after (unset):
- `● /[locale]` → `/en`; the same for `about-magneto`, `contact`, `packages`, `projects`, `services`.
- `● /[locale]/projects/[slug]` → 3 × `/en/projects/…`.
- `ƒ /[locale]/[...rest]`, `○ /_not-found`, `ƒ /api/wp-graphql`, `○ /robots.txt`, `○ /sitemap.xml`.
- 14/14 pages; `ƒ Middleware 34.2 kB`.
- With `=en,fr,es`, each page gets `/fr/…` and `/es/…` too → 32/32.

Normalization: as in 0.5b (`<script>`, `<link>`, `/_next/static/*` hashes removed). I also replaced the per-build
ID comment (`<!--{21 chars}-->`), which differs between any two builds.

### V1 — HTTP (status + redirect target)
| URL | V0 | after, unset | after `=en,fr,es` |
|---|---|---|---|
| `/` `/services` `/packages` `/projects` `/about-magneto` `/contact` + 3 projects | 200 | 200 | 200 |
| `/projects/no-existe` | **500** | **404** | 404 |
| `/carte` · `/api/ping-cms` | 404 | 404 | 404 |
| `/robots.txt` · `/sitemap.xml` | 200 | 200 | 200 |
| `/services/` · `/about-magneto/` | 308 → no slash | 308 → no slash | 308 → no slash |
| `/en` · `/en/services` | 404 | 404 | 404 |
| `/assets/images/logo-magneto.svg` | 200 | 200 | 200 |
| `/fr` `/fr/services` `/es` `/es/projects/trepied-trepied-ca` `/es/services` `/fr/contact` | 404 | 404 | **200** |
| `/fr/no-existe` · `/de/services` | 404 | 404 | 404 |
| proxy `POST /api/wp-graphql` | 200, body `{"generalSettings":{"title":"Magneto CMS"}}` | identical | identical |

F9 says `/projects/no-existe` → 404; that came from `next dev`. Under `next start`, HEAD returns **500**
(see Issues). After the change it is 404 with the proper "Project Not Found" page.

### V2 — EN HTML (unset)
`cmp` of normalized HTML vs V0: `home`, `services`, `packages`, `projects`, `about-magneto`, `contact`,
`projects/trepied-trepied-ca` **identical**; `carte` raw HTML **differs** (approved, Q-A): Next streams an error
shell (`<html id="__next_error__">`) and the layout arrives in the RSC payload. In the browser it is
pixel-identical to V0 at all three widths. `<html lang="en" data-lt-installed="true">`
unchanged on the 7. Project `<title>`/description for the 3 projects: identical (no `description` meta before
or after).

### 404 rendering (round 2, Q-A)
- `/carte` @ 375/768/1440: pixel-identical to V0 (`shots-r2-en/carte@*.png` vs `shots-v0a/carte@*.png`).
- Locales unset: `/en`, `/en/services`, `/fr/services` (disabled) @1440: **pixel-identical to V0 `/carte`**, i.e.
  header + 404 body (`shots-r2-404/`).
- All locales on: `/fr/no-existe`, `/de/services` @1440 differ from V0 `/carte` only in the nav strip
  (bbox x 740–1319, y 9–40). That strip holds the switcher, which is expected when 3 locales are on
  (`shots-r2-all404/`).
- `/projects/no-existe` → 404, "Project Not Found" page with header and footer (`shots-r2-404/projects_no-existe@1440.png`).

### V3 — Hydration (`next dev -p 3100`, `ENABLED_LOCALES=en,fr,es`, headless Chrome console)
| Route | Hydration messages | Console errors | Lead magnet / final CTA (SSR → after hydration) |
|---|---|---|---|
| `/` | 0 | 0 | present → present |
| `/contact` | 0 | 0 | **absent → absent** |
| `/projects` | 0 | 0 | present → present |
| `/fr/contact` | 0 | 0 | **absent → absent** |

The capture works: it recorded other messages, e.g. React DevTools info and an existing `next/image` warning on
`contact-visual.png`. Raw data: `v3/console.json`.

### V4 — Enablement
- Unset: `/fr`, `/fr/services`, `/es`, `/es/projects/trepied-trepied-ca` → 404; `/` has 0 `language-switcher` in its HTML.
- `=en,fr,es`: those 4 → 200; `lang="fr-CA"` on `/fr*`, `lang="es"` on `/es*`; `/fr/no-existe` and
  `/de/services` → 404.
- `=en,fr`: `/fr/services` 200, `/es/services` 404, `/es` 404; switcher shows EN, FR.

"Unset" was tested as `ENABLED_LOCALES=` (empty) in the shell, because `.env.local` sets the variable and Next
does not override a variable that already exists in the environment. Empty and unset both parse to `['en']`
(unit-tested).

### V5 — Switcher (`=en,fr,es`, `next start`)
- Markup on `/fr/services`: `role="group" aria-label="Language"`; three links: `/services` (`lang`/`hreflang`
  `en`, name "English"), `/fr/services` (`fr-CA`, "Français", `aria-current="true"`), `/es/services` (`es`,
  "Español").
- Keyboard at 1440, from `/projects/trepied-trepied-ca`:
  - 9 × Tab focuses **FR**: `href=/fr/projects/trepied-trepied-ca`, outline `solid 2px rgb(23,23,23)`.
  - Enter navigates to `/fr/projects/trepied-trepied-ca`, `lang=fr-CA`.
- From `/es/services`: the EN link is `/services`, and the current language is ES.
- Mobile menu at 375: Tab reaches the switcher, outline `solid 2px rgb(255,255,255)` on the purple menu.

**Screenshots, approved by Mauricio 2026-10-24 (Q2):**
- EN unchanged (unset), V0 vs after, 8 routes (incl. `/carte`) × 375/768/1440, pixel-identical (round 2):
  - V0: `<scratchpad>/p2/shots-v0a/{home,services,packages,projects,about-magneto,contact,projects_trepied-trepied-ca,carte}@{375,768,1440}.png`
  - after: `<scratchpad>/p2/shots-r2-en/…` (same names; round-1 `shots-v1-en/` predates `not-found.tsx`)
- Switcher (`<scratchpad>/p2/v5/`):
  - `v5-fr_services@1440.png`, `v5-en_home@1440.png`, `v5-es_project@1440.png`: desktop nav, right of the CTA.
  - `v5-fr_services@768.png`, `v5-fr_services@375.png`, `v5-en_home@768.png`, `v5-en_home@375.png`: header,
    menu closed.
  - `v5-fr_services-menu@768.png`, `v5-fr_services-menu@375.png`, `v5-en_home-menu@768.png`,
    `v5-en_home-menu@375.png`: mobile menu open, `EN FR ES` under Contact, current one underlined.
- Focus: `<scratchpad>/p2/v5k/v5-focus-FR@1440.png`, `v5-focus-mobile@375.png`.
- Look note for Mauricio: on desktop the switcher sits next to the CTA. In the mobile menu it inherits the
  menu's large uppercase white style (`.nav_mobile__menu li a` is more specific than `typo-sm-bold`). Change it
  only if you want it to differ.

Screenshots are viewport-height (375×812, 768×1024, 1440×900), so they cover the header area; below the fold,
V2's byte-identical HTML covers EN.

### D2 — single mapping point
```
$ git grep --untracked -n -E "/(fr|es|en)(/|['\"])" -- src ':!src/i18n' ':!*.test.*'
src/app/[locale]/[...rest]/page.tsx:3:// Catches /carte, /en/x (rewritten to /en/en/x), disabled /fr/x and unknown paths so they render
src/middleware.ts:5:// EN stays unprefixed: /x is rewritten to the internal /en/x (no redirect, browser URL unchanged).
src/middleware.ts:6:// /en/* itself is deliberately not exposed: it becomes /en/en/* and 404s, as before (ADR 0003, D4).
```
Comments only. No locale path is built or parsed outside `src/i18n/`.

## Deviations from the spec
Approved by the Senior Architect (2026-10-24):
1. **Q-A:** new `src/app/[locale]/not-found.tsx` (one-line re-export of Next's built-in 404). The raw `/carte` 404 HTML
   differs from V0; the status is 404 and the screenshots match. Future home of the custom 404 page.
2. **Q-B:** lint +28 (`no-html-link-for-pages`, Header) accepted as known debt; baseline now 164 / 118.
3. **Ratified import fixes** in moved files:
   - `src/app/[locale]/services/Services.scss:1-2`: relative `@import` `../../styles/…` → `../../../styles/…`.
   - `src/app/[locale]/contact/page.tsx:3`: `@/app/contact/api` → `@/app/[locale]/contact/api`.

Not yet reviewed (reported in round 1):

4. `:focus-visible` rule added pre-emptively. The spec makes it conditional on the global style not showing;
   there is no global link focus style, and the UA ring on the purple menu was the risk.
5. Screenshots and console checks used headless Chrome directly (CLI `--screenshot` + a small DevTools-protocol
   script in the scratchpad, no new dependency).
6. Process: I ran `git add -N .` once by mistake (intent-to-add) and reverted it at once with `git reset`.
   `git diff --cached` is empty.

## Issues found (not fixed)
- **Sanitizer crash in the server bundle**:
  - It is live in production (confirmed: `www.magnetomarketing.co/projects/no-existe` → 500). In HEAD it shows under
    `next start` as `TypeError: Right-hand side of 'instanceof' is not an object` from the chunk with `jsdom` /
    `isomorphic-dompurify` (`ProjectDetail`).
  - `next dev` doesn't show it, which is why earlier phases recorded 404.
  - **Phase 2 fixes the unknown-slug case** (→ 404 + "Project Not Found"). I didn't investigate the mechanism.
  - The crash itself is untouched: an on-demand render of a real project (e.g. the 13th) may still hit it.
  - Known debt line added. **Merge precondition:** Vercel preview check of `/projects/no-existe` and one project page.
- `projects/[slug]/not-found.tsx` still links `/portfolio` (known, spec F6).
- The switcher sits outside `ul.nav`'s visual rhythm on desktop (it's a group of 3 links in one `<li>`); purely a
  look question for Q2.

## Proposed commits (nothing staged; order matters, each builds on the previous one)
1. `feat(i18n): locale config, path helpers and routing decision`
   - `src/i18n/config.ts`, `src/i18n/paths.ts`, `src/i18n/routing.ts`, `src/i18n/config.test.ts`,
     `src/i18n/paths.test.ts`, `src/i18n/routing.test.ts`
2. `feat(i18n): language switcher, rendered by the header when 2+ locales are enabled`
   - `src/components/molecules/LanguageSwitcher/index.tsx`, `…/types.ts`, `…/LanguageSwitcher.scss`,
     `…/LanguageSwitcher.test.tsx`, `src/components/molecules/index.ts`, `src/components/organisms/Header/index.tsx`
3. `fix(i18n): compare pathnames without the locale prefix`
   - `src/components/organisms/LeadMagnetSection/index.tsx`, `src/components/organisms/FinalCTASection/index.tsx`,
     `src/components/organisms/ProjectsGrid/index.tsx`
4. `feat(routing): serve pages from app/[locale] with an EN-unprefixed middleware rewrite`
   - deleted: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about-magneto/{api.ts,page.tsx}`,
     `src/app/contact/{api.ts,layout.tsx,page.tsx}`, `src/app/packages/{api.ts,layout.tsx,page.tsx}`,
     `src/app/projects/{api.ts,page.tsx}`, `src/app/projects/[slug]/{api.test.ts,api.ts,not-found.tsx,page.tsx}`,
     `src/app/services/{README.md,Services.scss,ServicesList.tsx,api.ts,page.tsx}`
   - added: the same files under `src/app/[locale]/`, plus `src/app/[locale]/[...rest]/page.tsx`,
     `src/app/[locale]/not-found.tsx`, `src/middleware.ts`
   - modified: `.env.local.example`
   - (`git add -A src/app` stages the moves; git will detect the renames.)
5. `docs(phase-2): ADR 0003, agent map, phase report and current phase`
   - `docs/adr/0003-locale-routing.md`, `AGENTS.md`, `CLAUDE.md`, `docs/specs/phase-2-locale-routing.md`,
     `docs/reports/phase-2-locale-routing.md`

## Time
- Mauricio: switcher-look review and approval (time not measured).
- Dev: round 1 ≈ 2 h 15 min (estimated from timestamps), including ≈30 min on the A3 investigation and ≈20 min lost
  to a hung screenshot driver (replaced); round 2 ≈ 25 min.
