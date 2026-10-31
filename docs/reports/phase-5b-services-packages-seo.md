# Phase 5b report — Services, Packages, per-page SEO metadata and shared UI fixes

- Spec: `docs/specs/phase-5b-services-packages-seo.md` (Approved, rev 9) + `docs/specs/phase-5c-loader.md` rev 2 with the
  5b §5.4 override.
- Author: Dev (Claude) · Date: 2026-10-31 · Branch: `feat/phase-5b` @ `f9b9367` (nothing staged, nothing committed).

---

## Part 1 — combined 5b + loader checkpoint (2026-10-31)

### Checkpoint approval
**Part 1 APPROVED by Mauricio — technical and visual, 2026-10-31.** Part 2 may start.

Visual approval comes with **pre-launch design follow-ups** (not 5b blockers):
- New illustrations for the Services rows if needed (the rich rows show legacy art carried over by row index).
- Icon assignment per Services row (legacy icons carried over the same way).
- Spacing/margins of the plan CTAs and between sections. **On Packages this is Part 2 work:** card CTAs, card body and the
  content sections (Diagnostic, budgeting) are rebuilt in the Part 2 Packages presentation (§5.2, §5.6), so their spacing
  is fixed and screenshotted there. Section spacing on Services and the other pages stays a pre-launch design follow-up.

**Services row images — decision A (Mauricio):** he reassigns existing media-library images (and icons if wanted) per row
in WP admin — local now, production before launch. See the pre-launch checklist.

### Result
**Part 1 done — stopped at the combined checkpoint for review.** Steps 1–6 are complete. Loader run matched the expected
totals; GraphQL read-back 98/98 ok (run twice, before and after the CMS outage); the three builds were re-run cleanly;
state C and state N Services captured at 375/768/1440. A WIP layout bug found by the first N attempt (core and
supporting groups side by side) is fixed in `Services.scss` and verified. Visual approval (Mauricio) pending. No claim
of launch readiness; Packages presentation, metadata, footer, CTA label and the other Part 2 items are not started.

### Changes (unstaged)
| Path | What and why |
|---|---|
| `src/app/[locale]/services/{types,content,api,ServicesList,page}.ts(x)`, `Services.scss` | S0 WIP (typed query/mapper, sanitized rich bodies, groups core → unclassified → supporting, anchors `build/fix/care` with `scroll-margin-top`, allowlisted CTAs, error state kept) + layout fix `.main:has(> .services-group) { flex-direction: column; }` |
| `src/app/[locale]/services/{api.test.ts,ServicesList.test.tsx}` | S0 WIP tests rewired to state C + `en.json` (approved deviation D-1); + M tests (editor-empty intro, `<script>`/`onerror` in every new HTML field); + FR/ES state-C render without any `en.json` string; + FR/ES missing translation → `notFound()`, CMS error → error state |
| `src/app/[locale]/packages/{types,api}.ts`, `api.test.ts` | S0 WIP (rich vs legacy contract, sections, legacy adapter kept for the current page); tests rewired (D-1); + M tests, FR/ES grid render, FR/ES `notFound()`, `requireInternalCta` wiring C=false / N=true |
| `src/app/[locale]/packages/page.tsx` | §5.3: passes `requireInternalCta` (new intro or any rich card populated). No presentation change (Part 2). |
| `src/components/organisms/Hero/{api.ts,HeroLoader.tsx}` | §5.3 rule as pure `resolveHeroCta` + `ctaPath` in `PAGE_HERO_QUERY`; optional `requireInternalCta` prop (default false). `HeroCTA.tsx` untouched. |
| `src/components/organisms/Hero/api.test.ts` | The 5 §5.3 tests (+ query test), 23 cases |
| `scripts/phase-5c/content/en.json` | Loader transcription of `01ff73f` (6 posts, 95 values); single source of state N |
| `scripts/phase-5c/content.test.ts` | Verbatim check vs source lines, sha256 pin, scope (§5.4 override), Services/Packages structure |
| `scripts/phase-5c/load-content.php` | Loader per rev 2 + §5.4 override |
| `scripts/phase-5c/fixtures/state-c.json` | State-C snapshot (D-1), with provenance |

`git diff --stat`: 11 tracked files, +570 / −216; untracked: `scripts/phase-5c/` (4 files) + 4 new `src` files. Index empty.

### S0 — WIP re-apply
- Source: `../backups/phase-5b-wip-2026-10-27/` — `phase-5b-files.tgz` `2f705cad1f43be34719426941281e0e08a89441c779ba7c56bbc9489c236378e`,
  `full-tracked-worktree.patch` `adb58be0c80de86015d7462fbdcff973edbfe4bcc467b8bb93864824bfd65c1e`,
  `services-page.5a.tsx` `69665e33b20c891f68a1b13b0b7c45bd852343d41e61104e05c014c40334e5e7`.
- Applied **11** `src/` files (my plan first said 12 by mistake). Not applied: the old spec copy, `scripts/phase-5b/*`
  (agreed). Base check: 6 of the 7 files that already existed have patch base = `HEAD` blob. `services/page.tsx` was
  written on pre-5a `6ac6e34`, but 5a's only change to it (`FinalCTASectionLoader`) is in the WIP version (1 hunk) → clean.
- sha256 as applied:

| File | sha256 |
|---|---|
| packages/api.test.ts | `a4aff7ceabb99c4ccabd7af85c23605f67909bdb7ac4ea2231e35e6ae971ad53` |
| packages/api.ts | `d8d480e87340cc6bba80b9f47ccd69b8c49fb4098ff64629eda1d6bc41237a3f` |
| packages/types.ts | `b6b771e9672190e9fff78c14d8a8ac8e939d13f2a87664ccefc498e04387a82e` |
| services/Services.scss | `441bd5f69e3c56d3d047c29caf891b3ba3871581105c15ac7a0e0ee45e0a34fd` |
| services/ServicesList.test.tsx | `3b6c8a46396271ec1880b0fa819f79dfe9f8e682d42db95846596a2c8fe9c043` |
| services/ServicesList.tsx | `87a578dc93000b9e02c5f58e0a40b2bfa3002305d0c367e72cccc3266670db13` |
| services/api.test.ts | `1aa663c23351823ad0bd0d4ac035b0b67ec7bb111669373e7d5243e649d94496` |
| services/api.ts | `6e9c04c4f4afa0c5e4a45c814125c2c87d20c39cb5feeca187991b28f8a080b2` |
| services/content.ts | `23eccd29090b4f6719344f235c44b417b5af0c7261179fea1ec355f5377c7771` |
| services/page.tsx | `2313a17eee2d2df3c96c09073fe5a00c2330c668e4bc34da528948d7f96dd3d4` |
| services/types.ts | `8011fb375ea627e03bcffc0514c8d89c61b88273ce38997813ec51290031de6e` |

- S0 stop: the 3 WIP test files imported `scripts/phase-5b/fixtures/*` (not applied) and `state-n.json` was pinned to an
  older export (`33a0e12…`). Resolved by **D-1** (below). S0 exit condition met: 31/31 files, 333 tests; lint
  108/102/91 with no new findings; typecheck and `ENABLED_LOCALES=en` build pass.

### Entry checks (step 1)
- P-1: `git diff --quiet 01ff73f -- docs/content` → exit 0; sha256 EN `870b8573…ee16d`, FR-CA `9fc2ee33…97408`, ES
  `d5c3cb28…ddecf` = E17.
- `.env.local` (names/hosts only): `NEXT_PUBLIC_WORDPRESS_API_URL` host `magneto-cms-2.local`; `DISABLE_SMTP=1`;
  `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` empty; `ENABLED_LOCALES=en,fr,es` (so every EN-only build
  sets `ENABLED_LOCALES=en` on the command line); no `ALLOW_UNTRANSLATED_LOCALES`.
- Introspection (local, read-only): `HeroContent.ctaPath`, `Pageintrotext.introBodyHtml`, `ServicesServiceDetails.
  {coreHeading,supportingHeading,supportingIntro}`, service rows `{heading,descriptionHtml,ctaText,ctaPath,anchorId,
  serviceGroup:[String]}`, package rows `{heading,descriptionHtml,featuresTitle,ctaText,ctaPath,anchorId}`,
  `PackagesContentSections.sections{heading,bodyHtml}` — all present.

### Contracts and tests (step 2)
- §5.3 Hero rule: `/contact` + text → localized `<a>` (`/contact`, `/fr/contact`, `/es/contact`), rendered by the
  unchanged `HeroCTA` as a plain link, no Calendly; `requireInternalCta` → no CTA otherwise; legacy rule unchanged.
  Test 5 uses the six local EN heroes as read on 2026-10-31 (all `ctaPath` null).
- M groups: (1) editor-empty HTML → legacy (service description, card legacy mode, both intros); (2) `<script>` and
  `onerror` stripped from Services intro + service body, Packages intro + card body + section body; (3) invalid / partial
  CTA → none; (4) empty repeaters → no orphan headings or rows.
- FR/ES (AC-16): Services and Packages FR/ES state-C-shaped responses render without throwing and contain none of the
  ~70 `en.json` copy pieces; FR/ES missing translation → `notFound()` (Services, Packages); Services CMS error → error
  state, not 404.
- Packages error state (dictionary-backed) is **not** in Part 1: the page still throws on a CMS error. It comes with
  the Packages presentation in Part 2 (§4).

### Loader (step 3)
- `en.json`: source `docs/content/magneto-copy-en.md` @ `01ff73f`, sha256 `870b8573…ee16d` (test-pinned). Posts and planned
  values: services 57, packages 27, home 3, about-magneto 3, projects 3, contact 2 (95). §5.4 override:
  `ctaTextHero` "Book a Free Strategy Call" on services/home/about-magneto/projects; Packages "Tell me about your
  project" + `ctaPath` `/contact`; Contact title + subtitle only; `cta_link_hero` never written. Generated once by a
  scratch script (not committed), then checked by `content.test.ts` (each value's text appears verbatim in the source
  lines its `src` names; a one-word mutation fails the test).
- Format addition: repeater fields carry `subfields` (sub-field key → GraphQL name, `[]` = list). Additive; used by the
  loader output labels and the tests.
- `load-content.php` order: local guard → backup guard (real run) → ACF + content + `source.sha256` + every key/sub-key
  → each post resolved by type + slug + WPML `en` (exactly one) → row counts (services 7, packages 3, sections 0|2) →
  plan → dry-run returns → write (the only `update_field`, after every guard) → raw read-back incl. carried-over
  sub-fields → FR/ES probe. Optional `content=<path>` arg (for the guard proof). `php -l` (PHP 8.2.23, the site's
  version): no syntax errors.
- Guard proofs without WordPress: the script run under PHP CLI against a stub harness (scratchpad) seeded with state C.
  Dry-run → 0 writes; wrong sha256, non-local `home_url`, missing / stale / non-`.sql` backup, 6 service rows, 2 EN posts
  with one slug → each aborted with 0 writes; real run → 23 writes, 137 read-back ok; second dry-run → 0 changes;
  legacy sub-fields (featured flag, image/icon IDs, description, price, popular flag, features) carried over.
- Real-WordPress guard proof (Mauricio): dry-run with `en-wrong-sha.json` → "Error: Aborted before any write:
  source.sha256 does not match …".

### State C capture (step 4)
`next start -p 3100` (EN build), headless Chrome via the DevTools protocol with exact device metrics (the plain
`--screenshot` CLI enforces a ~500 px minimum width, so those 375 captures were discarded). Files:
`~/Documents/projects/magneto/backups/phase-5b/screenshots/C-en-{services,packages}-{375,768,1440}.png` (outside the
repo). No horizontal scroll at any of the 6 route × width combinations. Services: 7 legacy rows with images, icons,
"Featured Service" badge on the two featured rows, Hero CTA, final CTA. Packages: 3 legacy cards (label still "Book a
Strategy Call": the label change is Part 2, §5.4).

### Loader run (step 5, Mauricio, Local site shell)
- Backup: `~/Documents/projects/magneto/backups/phase-5b/magneto-cms-2_loader-before_20261031-1404.sql` (3,229,322 bytes)
  — also the state-C restore point.
- First dry-run = expected totals exactly: services 44/13, packages 27/0, home 2/1, about-magneto 2/1, projects 2/1,
  contact 2/0 → **79 changes, 16 unchanged**; FR/ES probe all 6 `no-translation` (E16).
- Real run: "Success: 23 field(s) written, all read back ok."; no FAIL; legacy sub-fields "(carried over)"; FR/ES probe
  identical before/after. `wp cache flush`: Success. Final dry-run: **0 changes, 95 unchanged**.

### Read-back (step 6, Dev, read-only GraphQL, language + slug)
**98 ok, 0 FAIL** (95 values + 3 row counts; HTML compared as visible text). `heroContent.ctaPath` = `/contact` on
Packages only (null on the other five); `ctaLinkHero` unchanged on all six; Packages legacy `price`/`description`/
`features`/`popularChoise` still present (suppressed by rich mode in Part 2); 17 legacy media URLs (service images +
icons, package icons) → HTTP 200.

### State N capture (step 6) — done
- First attempt invalid. (a) The local CMS went down during the capture: `http://magneto-cms-2.local/graphql` → ECONNREFUSED
  (server log), so the browser couldn't load the CMS-hosted icons, and the 1 min ISR revalidation re-rendered `/services`
  in its error state. (b) The capture still showed a WIP bug: `.main` (`globals.scss`) is a flex row, so the core and
  supporting `<section>`s sat side by side at every width. Fixed in `Services.scss` with
  `.main:has(> .services-group) { flex-direction: column; }` and a one-line comment on why (Mauricio: keep `:has()` in
  `Services.scss` only). Invalid captures moved out of the screenshots folder.
- Re-capture after Mauricio restarted Local (CMS checked = 200 before the build, before the capture and after it; 0
  ECONNREFUSED in the server log): read-back again 98/98 ok; port guard (no listener on 3000/3100, no `next dev`) before
  the build and before `next start`; `ENABLED_LOCALES=en` build (14 pages); `next start -p 3100`.
- Files: `~/Documents/projects/magneto/backups/phase-5b/screenshots/N-en-services-{375,768,1440}.png` — no horizontal
  scroll (scrollWidth = viewport at all three).
- DOM checks at 375 and 1440 (CDP):
  - **AC-4 copy:** 67 Services copy pieces from `en.json` (titles, headings, paragraphs, list items, intros, group
    headings) all present in order-independent text match; the one `innerText` miss was the Hero CTA (rendered uppercase
    by `typo-uppercase`), confirmed by `textContent` = "Book a Free Strategy Call". No legacy offer copy (Sales Funnel,
    Email Marketing, Branding, Content Strategy, Ad Campaign) on the page.
  - **Order/structure:** H1 Hero → H2 intro → H2 "Core Services" → H3 BUILD, FIX, CARE → H2 "Included Where Your Project
    Needs It" → H3 × 4 supporting → H2 final CTA. Groups stacked (second group starts below the first). Supporting grid:
    2 columns at 1440, 1 column at 768/375. Core rows alternate image side at 1440; stacked below 1024 (rich-row rule).
  - **Anchors:** `#build`, `#fix`, `#care` each exactly once, `scroll-margin-top: 90px`. No sticky/fixed header exists
    at 375 or 1440 (`<header>` is `position: static`, 58 / 51 px); after a `#fix` jump the target is 32–39 px from the
    top, not covered. The 90 px margin is headroom, not a needed offset (AC-5 keyboard check stays in Part 2 QA).
  - **CTAs:** "See BUILD pricing" → `/packages#build`, "See how FIX works" → `/packages#fix`, "Compare CARE plans" →
    `/packages#care`; 0 links in the supporting group; 0 "Featured Service" badges; 0 broken images.
- Visual observation for the review (content, not 5b scope): the rich rows keep the **legacy images and icons** (BUILD
  shows the old funnel art, FIX the e-commerce art, CARE the UX/UI art), because the loader carries media over by
  index. New artwork is out of scope (spec); flag for Mauricio.

### Gate (step 6, end of Part 1; lint/typecheck/tests re-run after the SCSS fix)
| Check | Result | Notes |
|---|---|---|
| lint | failed (pre-existing) — **108 errors / 102 warnings / 91 `no-explicit-any`** | master entry baseline 113 / 104 / 96; per file + rule, no finding absent from master; no new `any` |
| typecheck | passed | test files are excluded by `tsconfig.json` |
| tests | passed — **31 files, 377 tests** | master 29 / 293 |
| build `ENABLED_LOCALES=en` | passed (14 pages) | clean re-run |
| build `en,fr,es`, no override | **failed as expected** (guard) | "fr … 94 untranslated keys", "es … 93 untranslated keys" |
| build `en,fr,es` + `ALLOW_UNTRANSLATED_LOCALES=1` | passed (28 pages) | clean re-run |
| visual | C: 6 captures; N Services: 3 captures + DOM checks — passed; Mauricio's approval pending | EN only (Part 1 scope) |

**AC-12 baseline (before any 5b dictionary change; Part 1 changes no dictionary):** the guard counts **94 FR / 93 ES
keys**; `grep -c '[FR TODO]' fr.ts` / `'[ES TODO]' es.ts` gives **95 / 94 lines** (the spec's E14 numbers). One matching
line per file is not a key. AC-12 will report both counts: keys 94/93 → expected 81/80 after the 13 keys per locale, lines
95/94 → 82/81.

### Deviations from the spec
- **D-1 (approved by the Senior Architect, 2026-10-31, no spec revision):** state N in unit tests = state C snapshot +
  `scripts/phase-5c/content/en.json` (merged by index like the loader); new file `scripts/phase-5c/fixtures/state-c.json`
  (read-only snapshot of the local CMS EN GraphQL response; provenance in `_provenance`: capture time
  2026-10-31T17:43:17Z, endpoint, variables, query exports + sha256, git `HEAD` `f9b9367`; no secrets).
  `scripts/phase-5b/*` stays out of the tree. The pin tests check `en.json` against the current export hash.
- `content.json` format: additive `subfields` map on repeater fields (above).
- `load-content.php`: optional `content=<path>` argument (guard proof only; the guards still apply to it).
- The Dev's guard proof used an offline PHP stub harness (agents don't run WP-CLI), plus Mauricio's real wrong-sha256
  dry-run.
- Tests that call `HeroLoader` set `globalThis.React` (Known debt: classic JSX runtime), as `CalendlyButton.test.tsx` does.
- WIP choices kept: Services intro heading `h3` → `h2` (same `typo-3xl-bold` class, no visual change); intro rendered as
  text with `white-space: pre-line` instead of `dangerouslySetInnerHTML` + `<br />`.

### Incidents
1. **`node_modules` disappeared (~13:58) and was restored by Mauricio.** Gate commands run in that window failed with
   "command not found" (exit 127) and were discarded, not reported as results. npm logs: `npm i` in this repo at
   14:13:56 (exit 0). The deletion left no npm log. My commands in that window: stopping my two PIDs, deleting my own
   cropped screenshots, writing `en-wrong-sha.json` — none touch `node_modules`. `package.json` / `package-lock.json`
   unchanged.
2. **`.next` overlap.** A `next dev` (PID 13819 → 13822) started in this repo at 14:14:34 and listened on 3000. My 14:16
   gate printed the port-3000 listener but **didn't stop on it**, so three builds ran while that dev server shared `.next`
   (breaks the AGENTS.md rule). Those builds were marked provisional. After Mauricio stopped it, all three builds were
   **re-run cleanly** (14:19–14:20; no other Next process before, between or after) — the table above.
   **Origin investigation:** Mauricio confirmed no terminal, Codex task or VS Code Claude task of his was running, and
   the Architect session was closed. This session's tooling didn't start it: no `playwright.config*` or `webServer`
   anywhere in the repo; `vitest.setup.ts` only mocks DOM globals; Claude Code hooks (`~/.claude/settings.json`) only
   play sounds, `settings.local.json` has permissions only, no project `.claude/settings*`; my capture scripts start
   `next start -p 3100` and headless Chrome on 9333, each recorded by PID and stopped by PID; this session ran no
   command between asking about `node_modules` and the "try again" reply. npm logs show `npm i` (14:13:56) then
   `npm run dev` (14:14:34, log ends 14:19 when stopped), 38 s apart, in this repo — consistent with one actor restoring
   `node_modules` and then starting dev. The npm logs don't record the parent process. **Cause unknown; not this
   session.** Follow-up proposal below.
3. **Local CMS down during the state-N capture** (ECONNREFUSED; see State N). Not caused by this session (no
   WordPress or Local command was run). Mauricio restarted Local; from then on the CMS was checked before every build and
   capture, with the rule "stop and report, don't retry" if it went down again (it didn't).
4. **Printed a local config file.** While looking up the site's PHP version, one command printed all of Local's
   `sites.json` (local default DB credentials and a Live Link basic-auth pair for another site, Shamanicca) into this
   session's output. Not written to any file or repeated; Mauricio may rotate that Live Link pair if he wants.
   **Boundary set by Mauricio (2026-10-31):** agents read only the repo and `~/Documents/projects/magneto/backups/`.
   Before that rule, this session also read, outside both: Local's `sites.json` (above) and `lightning-services` folder
   (to find PHP 8.2.23, used for `php -l` and the offline harness), `~/.npm/_logs/` (npm debug logs, for the incident
   investigation), `~/.bash_history` (grep for npm/dev commands, no matches with timestamps), and
   `~/.claude/settings*.json` (hooks). Nothing outside the boundary has been read since the rule.
5. A first set of state-C captures (plain headless `--screenshot`) was wrong at 375 (min window width); discarded and
   re-taken via the DevTools protocol.

### Pre-launch checklist (from Part 1)
- [ ] **Services row media (decision A).** Mauricio reassigns `Image` / `icon` per row on the EN `services` page in WP
  admin. Rules:
  - Change only image/icon fields. Don't add, delete or reorder service rows (the loader writes by row index and aborts
    if the count isn't 7; a reorder would not be detected and would pair copy with the wrong row).
  - Saving the EN Services page doesn't touch legacy text, flags or the hero (no multi-line text field on this page, so
    the Packages A3 problem doesn't apply). WYSIWYG bodies may be re-formatted by the editor on save (same visible text);
    a later loader dry-run may then list those bodies as changes — review, then a real run restores the exact transcribed
    HTML.
  - WPML/ACFML: the media sub-fields and the repeater are **Copy** fields. Locally there are no FR/ES Services
    translations (E16), so nothing is copied. In production, if the FR/ES Services translations already exist (OQ-1:
    created before release day), saving the EN original may copy the media choices to them — intended, since translations
    use EN media; check FR/ES Services after the save in the launch QA.
  - Production order: the release-day loader hasn't run in production yet, so production rows still carry the legacy
    titles. Assign by **row position** (1 BUILD, 2 FIX, 3 CARE, 4 Landing Pages, 5 Multilingual, 6 Booking/Forms,
    7 Analytics), or do it right after the release-day loader run and before promote.
  - A later loader run keeps the choices: the loader writes only `title`, `heading`, `description_html`, `cta_text`,
    `cta_path`, `anchor_id`, `service_group` and carries every other sub-field over (read back as "(carried over)";
    proven in the stub harness and in the real run of 2026-10-31).
- [ ] D-L: `/privacy-policy` live in every locale enabled at launch, or revert the footer-email commit before promote
  (added with the footer work in Part 2).

### Follow-ups (not fixed)
- **Dev-server guard — approved as a Part 2 item (Mauricio, 2026-10-31):** agent gates must refuse to build or start when port 3000 or 3100 has a listener or a
  `next dev` runs in the repo (a check that exits non-zero, not just prints). Optionally a separate `distDir` for agent
  builds (`next.config.ts` change → its own spec) so agents never share `.next` with a dev server. No Playwright
  `webServer` exists; if one is added later: `reuseExistingServer: false`, port 3100.
- AGENTS.md Known debt lint numbers (115/110) are stale: measured 113/104 on `master` today (Mauricio's note).
- **Packages error state — explicit Part 2 acceptance criterion (Mauricio, 2026-10-31):** a CMS error on `/packages`
  renders a dictionary-backed error state (like Services), not a thrown 500; missing translation stays `notFound()`; unit
  test for both.
- Rendering a CMS error caches the error state under ISR (`/services` after the outage). Pre-existing pattern; report only.
- Spec E14 counts TODO lines (95/94); the guard counts keys (94/93). Spec wording for AC-12.

### Decisions at the checkpoint (Mauricio, 2026-10-31)
- Keep the `:has()` rule in `Services.scss` only, with its one-line comment.
- Packages error state → Part 2, explicit acceptance criterion (above).
- Dev-server guard → Part 2 item (above).
- Read boundary: repo + `~/Documents/projects/magneto/backups/` only.

### Open for the checkpoint review
1. Visual approval of state C and state N Services (screenshots above); the legacy images on the rich rows.
2. Part 2 entry: Packages presentation (rich mode, sections, Hero paragraphs, I-5/I-6/D-S, error state), main CTA label,
   footer, Projects grid, Featured Services option D (T1), metadata EN/FR/ES, FR/ES-enabled build, dev-server guard.

### Proposed commits (Part 1; nothing staged — Mauricio commits)
Reordered from the first proposal so each commit carries its own tests and its dependencies come first (a separate test
commit would leave the earlier commits with failing tests). Per-commit gate not run.
1. `feat(phase-5c): EN content loader for Services, Packages and heroes (local only)` — loader, `en.json`,
   `content.test.ts`, `fixtures/state-c.json`.
2. `feat(services): typed 2026 Services contract, grouped rows and build/fix/care anchors` — Services files + tests.
3. `feat(hero): internal /contact Hero CTA via ctaPath (requireInternalCta)` — Hero files + tests.
4. `feat(packages): typed rich/legacy Packages contract and content sections (presentation in Part 2)` — Packages files
   + tests.
5. `docs(phase-5b): Part 1 checkpoint report` — this report.

### Time
Agent ≈ 4 h active (estimated). Mauricio: loader run ≈ 15–20 min + incident handling (unknown).
