# Phase 5b report — Services, Packages, per-page SEO metadata and shared UI fixes

- Spec: `docs/specs/phase-5b-services-packages-seo.md` (Approved, rev 9) + `docs/specs/phase-5c-loader.md` rev 2 with the
  5b §5.4 override.
- Part 1 author: Dev (Claude) · Date: 2026-10-31 · Entry branch: `feat/phase-5b` @ `f9b9367`.
  Part 1 subsequently committed through `4c3a2c5`; its historical change/commit lists below describe checkpoint-time state.

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
supporting groups side by side) is fixed in `Services.scss` and verified. Mauricio's technical and visual approval is
recorded above. No claim of launch readiness; Packages presentation, metadata, footer, CTA label and the other Part 2
items were not started at this checkpoint (current recovery status below).

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
| visual | C: 6 captures; N Services: 3 captures + DOM checks — passed; Mauricio approved at the checkpoint above | EN only (Part 1 scope) |

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

### Checkpoint review disposition
1. State C and state N Services approved as recorded above; legacy row media remains a pre-launch follow-up.
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

## Part 2 — recovery gate (Codex, 2026-10-31)

**Recovery gate complete; Part 2 implementation NOT approved. Stop for Senior Architect review before full Part 2 QA.**

### Ownership and preservation
- Mauricio confirmed closure of both Claude sessions. Independent process inspection before writes found neither PID
  1091 nor 9505, no other Claude editing process and no Next process. Claude's browser native host remained; it is not
  a checkout editing session. Ports 3000/3100 had no listeners. Exclusive ownership is confirmed for this work window,
  not guaranteed for future sessions.
- Entry: `feat/phase-5b` @ `4c3a2c57e24ccbc775ba975527ffdac7e423b898`, empty index, 28 modified tracked files
  (+555/−281) and 9 untracked files. SHA-256 baseline of 332 tracked/untracked files captured in session memory;
  unchanged from the preceding read-only recovery. Environment files were excluded and were not read or edited.
- Incremental changes only: `package.json`, `scripts/agent-gate.mjs`, `scripts/agent-gate.node-test.mjs`,
  `src/i18n/dictionary.test.ts`, and this report. Existing Packages implementation, copy, schema and other Part 2
  edits preserved. No staging, commits, CMS reads/writes or production operations.

### Fail-fast agent gate
- Use **`npm run agent:build`** and **`npm run agent:start`** for future agent build/start work. Start is fixed to 3100.
  `node scripts/agent-gate.mjs check` performs the preflight alone. Normal npm build/start and deployment commands
  remain unchanged; agents must use the guarded commands. No dependencies, environment variables or `distDir` changes.
- Before launching Next, refuse any listener on 3000/3100 or a Next process with this checkout's real working directory
  (includes dev on another port, a build and `next-server`). Process arguments are inspected internally, never printed.
  Missing tools, denied inspection or unresolved process ownership fail closed. No process is stopped by the guard.
- Limitation: this is a preflight, not a global lock against a human/other agent starting an unguarded command later.
  Exclusive ownership remains required throughout the build/server window. On a sandbox inspection failure, stop;
  do not bypass the guard. The separate `distDir` proposal remains out of scope.

### Actual verification results
| Check | Result |
|---|---|
| `node --test scripts/agent-gate.node-test.mjs` | PASS — 9 tests: idle; both ports; same-checkout dev/build/server; other checkout; inspection failures; launch order, fixed port, child exit propagation and invalid mode |
| `node scripts/agent-gate.mjs check` (process inspection permitted) | PASS — exit 0 on actual idle machine |
| Owned TCP listener on 127.0.0.1:3100, then guard `build` and `start` | PASS — both exit 1 with port-3100 STOP; no child output; no Next launched. Listener closed by its owner in `finally` |
| Focused Vitest: `src/i18n/dictionary.test.ts` and `src/app/[locale]/packages/api.test.ts` | PASS — 2 files, 53 tests (20 dictionary + 33 Packages) |
| `node --check` on both guard files; `git diff --check` | PASS |
| Full lint/typecheck/test suite/builds/browser matrix | NOT RUN — deferred to separately approved full Part 2 verification |

Guard tests use Node's built-in test runner; `.node-test.mjs` deliberately avoids Vitest's test glob. No application
server or build started. Focused tests emitted Vite/Sass deprecations, React key warnings from the existing Packages
render harness and the expected malformed-CTA diagnostic; no failures. These warnings are recorded, not fixed here.

### AC-12 reconciliation (translation guard unchanged)
| Measure | FR | ES |
|---|---:|---:|
| Part 1 TODO keys | 94 | 93 |
| Existing metadata keys filled by Part 2 | −13 | −13 |
| New `packages.errorTitle` / `packages.errorBody` TODO keys | +2 | +2 |
| Current TODO keys | **83** | **82** |
| Current matching text lines (includes one comment) | 84 | 83 |

The earlier 81/80-key (82/81-line) projection excluded the subsequently approved Packages error state. The six new
case-study metadata keys per locale are already translated and add no TODOs. The new regression test pins 83/82,
asserts both error keys remain TODO, and proves **each error key alone blocks its enabled locale** even if all other
keys are translated. No production override or exemption added. This documents the authorized reconciliation;
rev 9 itself was not edited and complete AC-12 acceptance still awaits Part 2 verification.

### Packages error handling and editorial approval
- Existing tests pass for CMS rejection in EN/FR/ES: dictionary-backed `role="status"`, heading/body, no package cards,
  no thrown page error. Missing FR/ES translation still throws `notFound()` (404). No Packages code changes needed.
- Verification limit: these tests render the page's synchronous content and strip async Hero/final-CTA loaders.
  Read inspection confirms both loaders catch their fetch failures; this is not an HTTP outage/browser verification.
- Mauricio's editorial approval remains required for EN `packages.errorTitle`: **“Packages”** and
  `packages.errorBody`: **“Sorry, we couldn't load the packages right now. Please try again later.”** Existing wording
  preserved, not marked approved. FR/ES error translations remain Q-D1 TODOs and block launch when those locales are enabled.
- Stale Part 1 visual-approval wording corrected using its already documented technical/visual checkpoint approval;
  this does not approve Part 2 or T1.

### Remaining work / stop
After Senior Architect review: full Part 2 gates with baseline lint comparison; C/N/M regressions; EN/FR/ES metadata
and rendered heads; cross-page anchor journeys with keyboard; complete responsive/footer/grid checks; simulated
FR/ES CTA fit; existing FR/ES route captures; T1 and final visual approval; reconcile existing screenshots and populate
the final AC table. D-L Privacy prerequisites, remaining translations and launch QA remain open. No new regression
was detected by the focused checks; full Part 2 correctness is not asserted.

## Part 2 — final (Dev, Claude, 2026-10-31)

Supersedes the recovery-gate status above. Author: Dev (Claude, fresh session) · Branch `feat/phase-5b` @ `4c3a2c5` + the
uncommitted Codex Part 2 work + the changes below. Nothing staged, nothing committed.

### Result
**Part 2 done — stopped for the final review.** Every Part 2 item is implemented; the full gate was run once at the end
(all green except lint, which has no new finding vs `4c3a2c5`); AC-19/21/22/23/24/26 and the §9 QA have browser
evidence. Human decisions closed 2026-10-31: T1 approved, Packages D-6 cards confirmed, EN error strings approved.
No claim of launch readiness.

### Entry
- Codex WIP verified against its backup `~/Documents/projects/magneto/backups/phase-5b-part2-codex-wip-20261031/`
  (`tracked.patch` `702f97e3…755a2`, `untracked.tgz` `be6431d2…57dc59`): reverse dry-run of the patch on the working
  tree = clean; the 11 untracked files byte-identical. Read-only review delivered first (Part 2 done/missing list).
- **Codex's reported results (446 tests, builds, lint 108/99, responsive evidence) were not in the repo** and were
  treated as unverified; every result below was re-run in this session. Codex's screenshots
  (`screenshots/{N-en-packages-*,P2-*}.png`) are not used as evidence.
- `.env.local` (names/hosts only): `NEXT_PUBLIC_WORDPRESS_API_URL` host `magneto-cms-2.local`; `DISABLE_SMTP=1`;
  `ENABLED_LOCALES=en,fr,es`; no `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `ALLOW_UNTRANSLATED_LOCALES`
  lines. No form submitted.
- Port guard at entry **stopped**: `next-server` PID 24062 (parent `node scripts/agent-gate.mjs start` PID 24018, started
  16:11:40, this checkout) on 3100 — a Codex leftover. Not touched; Mauricio stopped both PIDs; guard re-run → exit 0.

### Senior Architect decisions applied (2026-10-31)
| # | Decision | Applied |
|---|---|---|
| 1 | EN error wording accepted in principle; Mauricio approves the exact strings (Notion system copy); FR/ES TODO | Strings below |
| 2 | AC-12 = 83 FR / 82 ES TODO keys | Spec AC-12 row updated (the only spec edit, authorized by this decision); reconciliation below |
| 3 | No Header component test; the dictionary test (header ≠ main CTA per locale) covers §7 | Approved deviation |
| 4 | `scripts/agent-gate.mjs`, `scripts/agent-gate.node-test.mjs`, the two `package.json` scripts | Approved deviations; `node --test` added to the gate |
| 5 | Restore `min-height: 44px` on `.service-cta` | Done; `Services.scss` is again identical to `4c3a2c5` (drops out of the diff) |
| 6 | About metadata from the dictionary only | Accepted (§6) |
| 7 | Footer email: restore patch instead of hunk staging | Patch created + checked (D-L entry) |

**Packages error state — EN strings APPROVED by Mauricio (2026-10-31) as written** (`src/i18n/dictionaries/en.ts`):
- `packages.errorTitle`: `Packages`
- `packages.errorBody`: `Sorry, we couldn't load the packages right now. Please try again later.`
- [ ] Follow-up (Mauricio): add both strings to Notion EN as system copy **before the FR/ES dictionary fill (Q-D1)**.
FR/ES: `[FR TODO] …` / `[ES TODO] …` (Q-D1); each key alone blocks a locale's build (`dictionary.test.ts`).

### Changes in this session
| Path | What and why |
|---|---|
| `src/app/[locale]/services/Services.scss` | Decision 5: `.service-cta { …; min-height: 44px; }` restored (file = `4c3a2c5`) |
| `src/components/molecules/PackageCard/index.tsx` | D-6: rich card (state N) markup in three stacked zones — top white box (name + icon + heading), CTA, bottom white box `package-card__details` (`descriptionHtml`). Two grey zones (`package-card__zone--top` / `--bottom`) instead of a grey card. No prop/API change; legacy branch untouched. |
| `src/components/molecules/PackageCard/PackageCard.scss` | (a) Removed the fixed `min-height: 600/650px` + `height: -webkit-fill-available` (grey dead space). D-6: rich card transparent, zones grey (rounded top/bottom), details box radius as the legacy features box. |
| `src/components/organisms/PackagesGrid/PackagesGrid.scss` | (a) At ≥ 601 px, `grid-template-rows: subgrid`: legacy cards (state C) span 5 shared tracks (title, price, description, CTA, "What's included"; header subgrid of 3) → prices/CTAs aligned across a row even when a title wraps, features box fills the row. **D-6 rich cards:** 2 shared tracks — top zone (tallest in the row → CTAs aligned), bottom zone `align-self: start` at tablet (own height) and `stretch` at desktop ≥ 1024 (equal-height grey cards, description box keeps its height). |
| `docs/specs/phase-5b-services-packages-seo.md` | AC-12 row only (decision 2) |
| `docs/reports/phase-5b-services-packages-seo.md` | This section |
| `~/Documents/projects/magneto/backups/phase-5b/footer-email-restore.patch` | Decision 7 (outside the repo) |

Codex Part 2 code kept as reviewed: Packages presentation (rich cards, `PackagesContentSections`, state N intro, Hero
two-paragraph split in `Hero/index.tsx`, dictionary-backed error state, D-S `legacyIntroHtml`), I-5 icon sizing, I-6
grids, option D, main CTA label EN/FR/ES, footer (§5.5), metadata helper `src/utils/page-metadata.ts` + case slug map,
REST override removed, tests (`page-metadata.test.ts`, `Footer.test.tsx`, `FinalCTASection.test.tsx`,
`PackagesContentSections.test.tsx`, Packages/Hero/dictionary/ProjectsGrid test updates), agent gate. `HeroCTA.tsx`,
`Header/*`, `ContactForm*`, `pages/api/*`, `docs/content/*`, `.env.local*` untouched; `contact/page.tsx` changed in
`generateMetadata` only.

### Packages card fix (a) — before / after (EN, 375/768/1440)
Screenshots: `~/Documents/projects/magneto/backups/phase-5b/screenshots/` — before C = Part 1 `C-en-packages-*.png`;
before N = `part2-final/before-N-en-packages-*.png`; after N = `part2-final/after-N-en-packages-*.png` and
`P2F-en-packages-*.png`; after C (simulated) = `part2-final/after-Csim-en-packages-*.png`, `P2F-Csim-en-packages-*.png`.

| State · width | Before | After |
|---|---|---|
| N · 1440 | header panels BUILD/FIX 213 px empty below content; CTAs bottom-aligned | **Option A** (`optA-N-en-packages-1440.png`): panels end together at 1068, CTAs 1083–1133 directly below (15 px gap) in all 3 cards, card ends 15 px after the CTA. BUILD/FIX keep white space inside the panel (shorter copy). |
| N · 768 | FIX panel 35 px empty | **Option A** (`optA-N-en-packages-768.png`): row-1 panels end at 749, CTAs 764–812; lone CARE card same rule |
| N · 375 | 15 px (single column) | unchanged |
| C · 768 (Part 1 capture) | "Funnel + / Website" wraps → its price, description, CTA and features sit ~24 px lower than the neighbours; grey area under short cards (min-height 650) | simulated: title 417 / price 458 / description 518 / CTA 608 / features 671–998 identical in both row-1 cards; grey below features = 15 px |
| C · 1440 | grey area under "Funnel + Website" | simulated: all three cards title 487 / price 529 / description 595 / CTA 697 / features 762–1145 |

Notes for the visual review:
- **N layout — D-6 (Mauricio, 2026-10-31, final):** the previous three-zone card structure, restored for rich cards:
  (1) top white box = package name + heading, (2) CTA below it, (3) bottom white box = `descriptionHtml` (extended
  description, incl. the prices for now). In each row the top boxes share one height so the CTAs line up (as the legacy
  cards in state C); the bottom boxes take their own content height. **Adjustment (Mauricio, 2026-10-31): desktop
  (3 columns, ≥ 1024 px)** — the grey cards stretch to the full row height (equal-height grey cards), the bottom white box
  keeps its content height and the grey continues below it; **tablet (2 columns)** — each grey card ends after its own
  bottom box; **375** — stacked. Existing fields only, no schema change. Supersedes option A (`optA-N-en-packages-*.png`)
  and the content-height layout (`after-N-en-packages-*.png`).
  Measured (`D6-N-en-packages-{375,768,1024,1440}.png`): 1440 top boxes 472–646 and CTAs 661–711 in all 3 cards, grey
  ends 1205 in all 3 (grey below the description box 213 / 237 / 15 px); 1024 same pattern (top 452–608, grey ends
  1141); 768 row-1 top boxes 401–537, CTAs 552–600, grey ends 15 px after each description box (860 / 840); 375 stacked,
  15 px. No horizontal scroll, no console errors. Simulated state C unchanged (prices 458 / 529). **Confirmed by
  Mauricio (2026-10-31)** on the 768 and 1440 screenshots — D-6 verification done.
- **N prices:** in state N the prices are inside each card's approved body HTML (a list in BUILD, the first paragraph in
  CARE, the last paragraph in FIX). CSS cannot align them without changing the copy structure; a structured price field
  would be a schema/loader change (5c or later) — not done.
- **State C is simulated** (approved approach, no CMS restore): the local CMS holds state N since the Part 1 loader run.
  In DevTools only, the legacy cards were injected into the live `/packages` from `scripts/phase-5c/fixtures/state-c.json`
  with the markup `PackageCard` renders, against the real compiled CSS. State C rendering itself is covered by the unit
  test "state C: three legacy cards with price, description, features and the new default CTA label; no badge"
  (`packages/api.test.ts`).

### Gate (end of Part 2, one run, started 18:13)
| Check | Command | Result |
|---|---|---|
| port guard | `node scripts/agent-gate.mjs check` | passed (exit 0) before every build/start |
| lint | `npm run lint` | **failed (pre-existing)** — 108 errors / 99 warnings / 91 `no-explicit-any`. Baseline `4c3a2c5` (scratch copy rebuilt without git: reverse backup patch + untracked removed): 108 / 102 / 91. Per file + severity + rule: **0 new findings**, 3 fewer (`no-unused-vars` in about-magneto, packages, services `page.tsx` — the removed metadata `catch` vars). No new `any`. |
| typecheck | `npm run typecheck` | passed |
| tests | `npm test -- --run` | passed — **35 files, 446 tests** (Part 1: 31 / 377) |
| agent gate test | `node --test scripts/agent-gate.node-test.mjs` | passed — 9 tests, 0 fail |
| build EN | `ENABLED_LOCALES=en npm run agent:build` | passed (14 pages) |
| build EN/FR/ES, no override | `ENABLED_LOCALES=en,fr,es npm run agent:build` | **failed as expected** (guard): "fr … 83 untranslated keys", "es … 82 untranslated keys" |
| build EN/FR/ES + override | `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:build` | passed (28 pages) |
| visual | headless Chrome (DevTools protocol, exact widths), `next start -p 3100` via `npm run agent:start` on the override build | passed — details in Evidence; Mauricio approved (T1, D-6 cards) 2026-10-31 |

Order: lint → typecheck → tests → node test → 3 builds, no source change after the run. The evidence server ran on an
`en,fr,es` + override build of the same sources (my PIDs 25782, 26225 started by `agent:start`, stopped by their task;
the gate builds ran after both were gone). Local CMS checked = 200 before every capture batch.

### AC-12 reconciliation
| Measure | FR | ES |
|---|---:|---:|
| Guard keys at Part 1 end | 94 | 93 |
| 13 metadata keys filled (§6) | −13 | −13 |
| `packages.errorTitle` / `errorBody` (new, TODO) | +2 | +2 |
| **Guard keys now** (build output) | **83** | **82** |
| `grep -c` text lines (one comment line each) | 84 | 83 |
`meta.caseStudies.*` (6 keys per locale) are new and translated: no TODO. `meta.project.title` stays TODO (Q-D1).

### Evidence
Files: `~/Documents/projects/magneto/backups/phase-5b/screenshots/part2-final/` (74 PNG). Measurements: DOM probes
(scripts in the session scratchpad, not committed). All captures: HTTP 200 where expected, `scrollWidth = clientWidth`
(no horizontal scroll), no console errors except the ES case below.

- **AC-19 Footer** — EN 9 routes × 375/768/1440 (+ Home 1024), FR/ES 5 routes × 3 widths: `mailto:` links 0, empty
  `<ul>` 0; LinkedIn = copyright computed `font-size`/`line-height`: 14/18 px (375), 14/20 (768, 1024), 16/24 (1440)
  everywhere; LinkedIn text per locale ("on" / "sur" / "en LinkedIn"). Keyboard focus (real Tab): `solid 2px #705AF8`
  outline (EN `/packages`, FR `/fr`). Email removal reversible by the restore patch (D-L).
- **AC-21 I-5** — state C simulated at 375/768/1440: every multi-line feature (1/0/2 per card at 375, 1/0/2 at 768,
  1/0/4 at 1440) has its check icon inside the first line box (icon 20/18/16 px = line-height; measured against the line
  box, centre ± line-height/2). State N has no feature lists (rich body). Unit: `packages/api.test.ts`.
- **AC-22 I-6** — `/packages`: 1 / 2 / 3 tracks at 375 / 768 / 1440; third card left at 768 = 15 px = first column.
  Projects grid `/` and `/projects`: 1 / 2 / 3 tracks; third card at 768 left 15 = first column (Home and `/projects`).
  1024: 3 tracks.
- **AC-23 Option D** — `/` Featured Services: 375 one column (3 × 345 px); 768 BUILD 738 = grid 738, FIX + CARE 362 + 362
  on one row; 1024 964 / 467 + 467; 1440 1200 / 585 + 585. `/fr`, `/es` at 768/1440: BUILD spans (738 / 1200); **the
  FR/ES home has only 2 featured services in the local CMS**, so row 2 has one card (FR/ES content is 5c). T1 approved
  by Mauricio (2026-10-31).
- **AC-24 CTA fit** — criteria per `.btn` (hero, card, final CTA): `scrollWidth ≤ clientWidth`, inside viewport and
  container, ≤ 2 lines. **EN real**: Hero on `/`, `/about-magneto`, `/services`, `/projects` + final CTAs, all 1 line,
  0 failures at 375/768/1440; legacy card label on simulated C. **FR/ES simulated** (labels set in DevTools on the same
  buttons, incl. the 3 legacy cards): 0 failures; 2 lines at 375 (ES also on a card at 1440), 1 line otherwise.
  Screenshots `AC24-{fr,es}-*-375.png`. Real FR/ES → launch QA.
- **AC-26 FR/ES** — `/fr`, `/fr/projects`, `/fr/projects/trepied-trepied-ca`, `/es`, `/es/projects/trepied-trepied-ca` at
  375/768/1440 (`P2F-{fr,es}-*`): `lang` fr-CA / es; footer as AC-19; header label "Réserver un appel-conseil" /
  "Reservar consulta" (unchanged); option D and grid as above; no EN fallback from 5b strings. Expected 404 (E16):
  `/fr|es/{services,packages,about-magneto,contact}`, `/es/projects` — all 404. ES case page logs "Failed to load
  resource 404": Next prefetches of the ES nav links to those untranslated routes (each fetched with `RSC: 1` → 404;
  `/es` and the case pages → 200) — E16, not a 5b defect.
- **Metadata (AC-10, AC-25 rendered)** — 14 routes at 1440: `<title>`, description, `og:title`, `og:description`,
  `twitter:title`, `twitter:description` = dictionary values (verbatim from `01ff73f`, checked earlier this session:
  60/60 values; only difference is the Markdown `\$` escape), `twitter:card` `summary_large_image`, `og:image` set. EN:
  7 page routes + 3 cases; FR: `/fr`, `/fr/projects`, FR Trépied; ES: `/es`, ES Trépied. Fallback description EN 143
  rendered on `/does-not-exist` (404). Unknown-case title + fallback: no live route (all 3 local cases are mapped) → unit
  test `page-metadata.test.ts`.
- **§9 Header** — 375 menu opened by click: bar label EN "Book a Strategy Call" / FR "Réserver un appel-conseil" / ES
  "Reservar consulta", menu `display: flex` with the localized nav; 1440 same labels.
- **§9 Cross-page links (keyboard, EN 1440)** — focus + real Enter key: Home "Explore" → `/services#build|fix|care`;
  Services core CTAs → `/packages#build|fix|care`; Packages card CTA and Hero CTA → `/contact`. Each anchor target exists
  once, `scroll-margin-top: 90px`, lands 90 px from the top (header is static).
- **§9 a11y (Services, Packages, Home + footer)** — Tab trace 40 stops at 375 and 1440: logical order (header → Hero CTA
  → content CTAs → final CTA → footer → loop), 0 stops without a focus indicator; Packages card CTA settles to
  `solid 3px #705AF8` on `#E8E8E8`. Accessible names: 0 unnamed links/buttons. Contrast (text vs solid background,
  excluding image/gradient backgrounds): 8–9 colour pairs per page, min 4.66:1, 0 below AA. 200% zoom (viewport 720 and
  640): no horizontal scroll, no clipped `.btn`. Targets < 24 px (pre-existing, out-of-scope components, spacing
  exception likely but not measured): language switcher EN/FR/ES (16–18 × 18–20, `Header`), Featured Services "Explore
  …" links 313 × 20 at 375 (`ServiceCard`), case "View <site>" links (`ProjectDetail`).

### Final acceptance table
| AC | Status | Evidence / note |
|---|---|---|
| AC-1 | Met (pending commit) | Only listed files + approved deviations differ; index empty; no CMS/production writes |
| AC-2 | Met | Part 1 |
| AC-3 | Met | Unit (state C test); simulated C visual; Hero test 5; final CTA fallback test |
| AC-4 | Met | Part 1 N capture; unchanged since (Services only lost/regained one CSS line) |
| AC-5 | Met | Keyboard journeys above |
| AC-6 | Met | N `/packages`: two Hero paragraphs (`Hero/api.test.ts` + capture), CTA "Tell me about your project" → `/contact`, tax note, 3 cards, CTA labels |
| AC-7 | Met | Diagnostic (C$450) after cards, budget guidance after it; no 4th card, no badge |
| AC-8 | Met | 446 tests incl. M groups, Hero tests, rev 5–8 tests |
| AC-9 | Met | Final CTAs present; Contact without final CTA; no lead magnet |
| AC-10 | Met | Rendered heads + fallback on 404 |
| AC-11 | Met | Cases by slug; unit tests for missing translation / unknown case |
| AC-12 | Met (revised) | 83 / 82; fingerprint + parity tests; `header.scheduleCall` unchanged ×3 |
| AC-13 | **Met** — T1 approved; Packages D-6 cards confirmed (Mauricio, 2026-10-31) | No clipping/overlap/h-scroll found; D-6 re-checked at 375/768/1024/1440 |
| AC-14 | Met | Gate table (lint: no new findings) |
| AC-15 | Met | 3 builds as expected |
| AC-16 | Met | FR/ES unit tests in the suite |
| AC-17 | Met | Loader per Part 1; no launch-readiness claim |
| AC-18 | Met | EN labels in Hero captures; `grep -rn "Book a Strategy Call" src --include=*.ts --include=*.tsx` → `en.ts:23` (`header.scheduleCall`), `en.test.ts:24`, `dictionary.test.ts:61`, plus a code comment in `FinalCTASection/index.tsx:36` (unmodified file, comment only) |
| AC-19 | Met | Footer evidence; email removal reversible (patch) instead of a separate commit (decision 7) |
| AC-20 | Met | D-L entry below |
| AC-21 | Met (C simulated) | I-5 above |
| AC-22 | Met | I-6 above |
| AC-23 | Met; T1 approved | Option D above |
| AC-24 | Met (EN real; FR/ES simulated) | Real FR/ES in launch QA |
| AC-25 | Met | Unit + rendered heads |
| AC-26 | Met | FR/ES captures |

### Deviations from the spec (approved unless stated)
- D-2: agent gate (`scripts/agent-gate.mjs`, `scripts/agent-gate.node-test.mjs`, `package.json` `agent:build` /
  `agent:start`) outside the file list — checkpoint decision, Senior Architect decision 4. No dependency.
- D-3: no Header component test (decision 3).
- D-4: AC-12 83/82 with the Packages error keys (decision 2; spec AC-12 row updated).
- D-5: footer email removal ships inside normal commits; reversal via the restore patch (decision 7).
- D-6: rich Packages card = three stacked zones + desktop equal-height grey cards (Mauricio, 2026-10-31; supersedes
  option A). Markup change in the rich branch of `PackageCard/index.tsx` (listed file; no public API change).
  Verification done: confirmed by Mauricio on the 768/1440 screenshots.
- D-6 re-verification (after the full gate): affected tests `npx vitest run "src/app/[locale]/packages"
  src/components/organisms/PackagesGrid src/components/molecules/PackageCard src/components/organisms/PackagesContentSections`
  → 2 files, 35 tests passed; `npx eslint src/components/molecules/PackageCard/index.tsx` → the same 3 pre-existing
  warnings, 0 errors. First EN build attempt refused by the guard (port 3000: Mauricio's `npm run dev`, PID 28961,
  stopped by him). After the desktop adjustment (`PackagesGrid.scss` only): guard exit 0, `ENABLED_LOCALES=en npm run
  agent:build` → passed (14 pages); captures from `npm run agent:start` on 3100 (my PID 29971, stopped). Full gate not
  re-run (as instructed; SCSS + one rich-branch markup change since the full run).
- D-7 (**for review**): state C visual evidence is simulated in DevTools (approved approach), not a CMS restore.
- Evidence server ran on the override build (one build for EN + FR/ES captures), as §7 allows.
- One read-only git command, `git apply --check`, authorized for decision 7 only.

### Release checklist (D-L) — keep or revert before promote
- [ ] **D-L:** `/privacy-policy` live **in every locale enabled at launch** (EN + FR + ES; EN + FR under Plan B, OQ-2)
  with §1 (Privacy Officer + email) and the footer Privacy link → keep the email-less footer. **Otherwise apply the
  restore patch before promote:**
  `~/Documents/projects/magneto/backups/phase-5b/footer-email-restore.patch`
  (sha256 `458ceec83453510504715eaab4ac1cc08b01feb93408660a053bd4b74594bf5a`, 7 files, `diff -u`): restores the email `<li>`
  in `Footer/index.tsx`, `footer.email` in `en.ts`/`fr.ts`/`es.ts`, the fingerprint line in `en.test.ts`, the done-key in
  `dictionary.test.ts`, and flips `Footer.test.tsx` to expect the email link. Verified: `git apply --check -v` against the
  final tree → all 7 files OK (exit 0); applied to a scratch copy, Footer + i18n tests pass (9 files, 206 tests).
  Re-run `git apply --check` if any of those 7 files changes before release; the footer typography fix stays either way.

### Launch-blocking item for 5d-lite (not fixed in 5b)
**Booking modal a11y defect** (strategy-call email/booking modal opened by "Book a … Strategy Call" buttons — Hero,
legacy package cards, final CTA, header): focus is not trapped in the dialog and Escape does not close it. Acceptance
criteria for 5d-lite:
1. On open, focus moves into the dialog (first field or the dialog heading).
2. Tab / Shift+Tab cycle only within the dialog while it is open (background inert or `aria-hidden`).
3. Escape closes the dialog.
4. On close (Escape, close button, success), focus returns to the triggering control.
5. The dialog has `role="dialog"` (or native `<dialog>`), `aria-modal="true"` and is labelled by its visible heading
   (`aria-labelledby`); the close button has an accessible name.
6. Unit test(s) for 1–4 plus a keyboard check in the launch QA, EN/FR/ES.

### Post-launch follow-ups
- [ ] **Separate price field for the Packages top box** (D-6): today the prices live inside `descriptionHtml` (bottom
  box). Moving them to the top box needs an ACF field, a loader (5c) update and a copy change in Notion EN/FR/ES —
  own spec, after launch.

### Issues found (not fixed)
- Targets < 24 px in `Header` (language switcher), `ServiceCard` ("Explore …" at 375) and `ProjectDetail` ("View …")
  — pre-existing, out of scope; verify the WCAG 2.5.8 spacing exception in the launch QA.
- 404 `<title>` "[FR TODO] / [ES TODO] 404: …" on FR/ES (dictionary TODO, Q-D1). FR/ES 404s render the route's own
  meta description (dictionary) — same behaviour as before 5b.
- FR/ES home has 2 Featured Services locally (5c content); option D's BUILD-first rule still needs BUILD, FIX, CARE in
  every language (spec §5.7 → 5c).
- `/es` nav links prefetch untranslated routes → console 404s until the ES posts exist (E16).
- Final CTA secondary label in the local CMS still "Book a Strategy Call" (5c-rest, eight names together).
- Codex left a `next-server` on 3100 at the end of its session (stopped by Mauricio); the gate is a preflight, not a
  lock (as Codex reported).
- Focused Vitest runs print React key warnings from the Packages render harness (test-only, as Codex reported).

### Incidents (this session)
- Port guard stop at entry (Codex leftover server) → asked, Mauricio stopped it.
- A safety check refused one scratch-copy cleanup command (variable-based `rm`); re-run with a literal path and
  `${VAR:?}` guards as instructed; all its writes stayed in the scratchpad copy. In that copy, `patch -R` re-applied
  the `Services.scss` hunk forward (the file already equals `HEAD`) — SCSS is not linted, the comparison is unaffected.
- Reads stayed within the repo, `~/Documents/projects/magneto/backups/` and this session's scratchpad.

### Proposed commits (nothing staged; Mauricio commits; file-level staging only)
Order keeps each commit buildable as far as reviewed by reading (dependencies first); the per-commit gate was **not
run**, only the full gate on the final tree. Hunk staging is avoided, so multi-concern files group concerns.
1. `chore(tooling): guarded agent build/start with port and .next preflight`
   ```
   git add 'scripts/agent-gate.mjs'
   git add 'scripts/agent-gate.node-test.mjs'
   git add 'package.json'
   ```
2. `feat(i18n): 5b dictionary — main CTA label, SEO copy EN/FR/ES, Packages error keys, email-less footer (D-L)`
   ```
   git add 'src/i18n/dictionaries/en.ts'
   git add 'src/i18n/dictionaries/fr.ts'
   git add 'src/i18n/dictionaries/es.ts'
   git add 'src/i18n/dictionaries/en.test.ts'
   git add 'src/i18n/dictionary.test.ts'
   git add 'src/components/organisms/Footer/index.tsx'
   git add 'src/components/organisms/Footer/Footer.test.tsx'
   git add 'src/components/organisms/FinalCTASection/FinalCTASection.test.tsx'
   git add 'src/components/organisms/ProjectsGrid/ProjectsGrid.test.tsx'
   ```
3. `style(footer): footer links use the copyright typography (md)`
   ```
   git add 'src/components/organisms/Footer/Footer.scss'
   ```
4. `feat(packages): rich/legacy Packages presentation, content sections, error state and aligned cards`
   ```
   git add 'src/app/[locale]/packages/api.ts'
   git add 'src/app/[locale]/packages/api.test.ts'
   git add 'src/app/[locale]/packages/types.ts'
   git add 'src/app/[locale]/packages/page.tsx'
   git add 'src/app/[locale]/packages/Packages.scss'
   git add 'src/components/molecules/PackageCard/index.tsx'
   git add 'src/components/molecules/PackageCard/PackageCard.scss'
   git add 'src/components/organisms/PackagesGrid/index.tsx'
   git add 'src/components/organisms/PackagesGrid/types.ts'
   git add 'src/components/organisms/PackagesGrid/PackagesGrid.scss'
   git add 'src/components/organisms/PackagesContentSections/index.tsx'
   git add 'src/components/organisms/PackagesContentSections/types.ts'
   git add 'src/components/organisms/PackagesContentSections/PackagesContentSections.scss'
   git add 'src/components/organisms/PackagesContentSections/PackagesContentSections.test.tsx'
   git add 'src/components/organisms/Hero/index.tsx'
   git add 'src/components/organisms/Hero/api.test.ts'
   git add 'src/utils/page-metadata.ts'
   ```
   (`page-metadata.ts` is here because `packages/page.tsx` imports it.)
5. `feat(seo): per-page and case-study metadata from the approved copy (EN/FR/ES)`
   ```
   git add 'src/app/[locale]/page.tsx'
   git add 'src/app/[locale]/about-magneto/page.tsx'
   git add 'src/app/[locale]/services/page.tsx'
   git add 'src/app/[locale]/contact/page.tsx'
   git add 'src/app/[locale]/projects/page.tsx'
   git add 'src/app/[locale]/projects/[slug]/page.tsx'
   git add 'src/utils/page-metadata.test.ts'
   ```
6. `style(layout): two-column tablet grids for Projects (I-6) and BUILD-first Featured Services (option D)`
   ```
   git add 'src/components/organisms/ProjectsGrid/ProjectsGrid.scss'
   git add 'src/components/organisms/FeaturedServices/FeaturedServices.scss'
   ```
7. `docs(phase-5b): AC-12 revision and Part 2 final report`
   ```
   git add 'docs/specs/phase-5b-services-packages-seo.md'
   git add 'docs/reports/phase-5b-services-packages-seo.md'
   ```
`src/app/[locale]/services/Services.scss` is no longer modified (decision 5) and is not in any commit. After commit 7,
`git status` should be clean.

### Time
Agent ≈ 2.5 h active this session (estimated), plus Codex's Part 2 time (unknown). Mauricio: stopping the leftover
server + decisions (unknown).
