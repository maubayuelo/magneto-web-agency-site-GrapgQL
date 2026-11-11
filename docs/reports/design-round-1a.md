# Design round report — PR 1a: A6-alt (Calendly booking modal)

- Spec: `docs/specs/design-round.md` rev 3, Part A → A6 / "A6-alt fix (specified) — PR 1a"
- Author: Dev · Date: 2026-11-11 · Branch: `feat/design-round-1a-calendly` (base `master` `a70ce0a`)
- Implementation by a previous Dev session; this session re-ran the gate, ran the browser verification and wrote the report.

## Result
Done locally. Waiting on Mauricio's real-iPhone check on the Vercel preview before merge (spec AC).

Booking now opens only in our own modal; no Calendly script or stylesheet is loaded by our page.
- Every spec AC checked locally passes in Chromium.
- WebKit (Playwright's build) passes the touch and Escape checks and gives the right focus ring on open. It misses two
  focus details after the visitor leaves the ✕: see "Issues found".

## Changes
Exactly the PR 1a file list in the spec ("Part A — files the Dev may touch", row 1a). `git status` shows nothing else.

| File | Change |
|---|---|
| `src/utils/calendly.ts` | Widget path removed: `CALENDLY_CSS` / `CALENDLY_SCRIPT`, `loadCalendlyScript`, `warmCalendlyResources`, `window.Calendly` global, popup/badge option types, `initPopupWidget` branch, `closePopupWidget`. `openCalendlyPopup` keeps its signature + URL building; `forceNewWindow` / `preferNewWindow` → `window.open`; otherwise `openEmbeddedCalendlyModal`; error → new tab. `calendly_popup_opened` sent with `method: 'embedded_modal'` / `'new_tab'`. Modal rebuilt: overlay → `role="dialog"` container (`aria-modal`, `aria-label` = `frameTitle`) → 52 px bar with `#calendly-embedded-close` → iframe. Inline sizing removed. Escape closes; focus to ✕ on open, back to `previouslyFocused` on close; scroll lock on open, unlock on every close path; `embed_domain` / `embed_type` kept. `trackCalendlyEvent` kept. |
| `src/styles/components/calendly.scss` (new) | Overlay / dialog / bar / close / frame styles per spec: safe-area padding, `height: min(640px, 100%)`, `max-height: 100dvh`, `z-index: 10000`, 44×44 close, `$primary-color` focus-visible ring, `$gray-20` hover. No `100vh`. |
| `src/utils/scroll-lock.ts` (new) | `lockPageScroll()` moved unchanged from `EmailCollectorProvider`. |
| `src/utils/scroll-lock.test.ts` (new) | 4 tests: pin at offset, unlock without prior styles, unlock restores prior inline styles, scrollbar-width padding. |
| `src/components/organisms/EmailCollectorProvider/index.tsx` | Imports `calendly.scss` and `lockPageScroll` from `utils/scroll-lock`; local helper and `warmCalendlyResources()` call removed. |
| `src/components/atoms/CalendlyButton/index.tsx` | Loader/warm-up import, `handlePreload`, `onMouseEnter` / `onFocus` removed. Props unchanged. |
| `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx` | `warmCalendlyResources` mock removed. |
| `src/utils/calendly.test.ts` | Rewritten without `window.Calendly` mocks; URL assertions read the iframe `src`. |
| `src/hooks/useCalendly.ts` | Deleted (0 importers). |

Diff: 6 tracked files, +261 / −509; 3 new files (scss 74, scroll-lock 31, test 71 lines).

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | passed (vs. budget) | 85 errors / 81 warnings; budget ≤ 88 / 94. `next lint` exits 1 on the pre-existing baseline. Messages in changed files (`calendly.ts:122,255-257`, `CalendlyButton:62,80`, `EmailCollectorProvider:34,198,229,245`) are all on unchanged lines and already present on `master`. |
| typecheck | passed | exit 0 |
| tests | passed | 47 files, 695 / 695 |
| build | passed | `ENABLED_LOCALES=en,fr,es npm run agent:build` exit 0, CMS up (graphql 200 before build), 0 `ECONNREFUSED` / `fetch failed`. Prerendered project paths: 3 per locale (9). |
| visual (8 routes × en/fr/es × 375/768/1440) | passed | 72 / 72 HTTP 200, 0 horizontal scroll. EN 24 / 24 pixel-identical to the architect baseline (see note on the project page at 1440). |
| axe (48 runs) | passed | 0 rule/route pairs worse, 0 better; 672 nodes before and after (axe-core 4.10.3 from `node_modules`). |
| A6 browser (Chromium + WebKit × 1440 / iPhone 8 / iPhone 13 × `/`, `/es`) | passed in Chromium; WebKit partial | 12 / 12 runs complete. See the AC table. |
| Real iPhone | **not run** | Mauricio, on the Vercel preview (checklist below). |

## Acceptance (A6, PR 1a)
| AC | Result | Evidence |
|---|---|---|
| Code grep returns 0 (or removal-proof test lines) | **pass with 2 comment hits** | `calendly.ts:62` is the new doc comment ("widget.js / widget.css are not loaded"). `CalendlyButton.scss:96` is a pre-existing comment mentioning `initPopupWidget`, in a file outside the PR 1a list, so it is left alone. No code references. |
| Unit `calendly.test.ts`: a1–a3 / utm / single event / `forceNewWindow` kept | pass | `single event` (4), `booking answers a1–a3` (4) |
| No Calendly `<script>` / `<link>` in `<head>` | pass | `A6-alt: no Calendly widget is loaded` |
| ✕ in toolbar before iframe, `aria-label` per locale | pass | `it.each` en / fr / es |
| Escape closes and restores focus; ✕ closes and restores focus | pass | 2 tests |
| Backdrop closes | **changed by decision**: backdrop does *not* close | test `a backdrop tap does NOT close` (see Deviations) |
| `body` fixed while open, styles + scroll restored | pass | `Calendly modal scroll lock` |
| No inline `100vh`; `embed_domain` present | pass | test + `grep 100vh` (only a comment in `calendly.scss`) |
| Unit `scroll-lock.test.ts` | pass | 4 tests |
| Unit `CalendlyButton.test.tsx` a–e | pass | mock removed |
| PW: no request to `assets.calendly.com` | **pass from our page; see note** | `assetsCalendlyFromOurPage` = 0 in 12 / 12 runs. Our page's only Calendly request is the iframe document. The iframe *document itself* loads 7 assets from `assets.calendly.com` (Calendly's own JS/CSS). The spec's "Fact recorded in the report" assumed none; I treat the AC as applying to our page. |
| PW: `#calendly-embedded-overlay` appears | pass | 12 / 12 |
| PW: close box ≥ 44×44; `elementFromPoint` centre and ±14 px hit it | pass | 44×44 in all 12; 5 / 5 hits; in viewport. Positions: 1440 → (1052,134); iPhone 8 → (315,18); iPhone 13 → (330,16). Dialog 640 px tall, fits 667 / 664 px viewports. |
| PW: a tap closes the modal | pass | 8 / 8 phone runs (Chromium + WebKit), `touchscreen` tap on the ✕ |
| PW: Escape closes (1440) | pass | 4 / 4, with focus on the ✕ |
| PW: Tab reaches the ✕ with a visible ring | **Chromium pass; WebKit partial** | Chromium: ring `solid 2px rgb(112,90,248)`, offset 2px; Tab from the page reaches the ✕. WebKit: the ✕ gets focus with `:focus-visible` on open (keyboard flow), but Tab / Shift+Tab out of the iframe goes to `<body>`, not to the ✕ (I-2). |
| PW: `scrollY` unchanged while open | pass | 12 / 12: page offset equals the scroll at open (250 or 300) after wheel + `scrollBy(400)`; same `scrollY` after close; `body` style attribute empty after close |
| PW: ≥ 1 `calendly.event_type_viewed` from `https://calendly.com` | pass | 2 per run, 12 / 12 |
| Real iPhone | **not run** | checklist below |

Every-PR ACs: gate ✓; 72 captures ✓; EN regression limited to the booking overlay ✓ (0 px elsewhere); axe ✓; the
Vercel preview checks are pending (Mauricio).

## Evidence
Evidence folder (outside the repo): `~/Documents/projects/magneto/backups/design-round/screenshots-after-1a/`
- `a6/a6-verify.json` + `a6/*_open.png`, `a6/*_focus-ring.png` (12 runs). The open captures are taken 300 ms after open,
  before Calendly paints, so the frame is white. The `event_type_viewed` messages show it loads.
- `en/ fr/ es/` — 72 full-page captures; `sweep.json` (statuses, h-scroll, EN diffs).
- `en/project_fashion-company-ecommerce_1440_scrolled.png` — recapture after lazy images load (see below).
- `axe-after-1a.json` — 48 runs, same key format as `axe-baseline.json`.
- `scripts/` — the scripts used (copies; run with Playwright 1.62.1 from the npx cache, `NODE_PATH=…`).

Notes on running them:
- **`a6-verify.cjs` was adjusted from the previous session's version.** A flat `scrollTo(0, 300)` put the hero CTA under
  the fixed header (the hero also moves with scroll), so the click hit the header and 5 / 12 runs timed out. The script
  now picks the largest scroll ≤ 300 where `elementFromPoint` at the CTA centre is the CTA (250 or 300 here).
- **The script also tags each request with its frame,** to separate our page's requests from the iframe's.
- **EN diff, `project_fashion-company-ecommerce` at 1440:** the first sweep was 7053 px vs. the baseline's 7206 px. The
  difference band (y 5801→end) was the last gallery image (`loading="lazy"`), not yet loaded in the full-page capture.
  - Re-captured after scrolling the page: 7206 px, **0 differing rows**.
  - Capture timing, not this PR: `calendly.scss` only styles `.calendly-modal*`.
- Keyboard probes (`kbd.cjs`, `kbd2.cjs`, 1440, keyboard only: CTA → Enter → booking form → Enter):

  | Step | Chromium | WebKit |
  |---|---|---|
  | open | focus on ✕, `fv=true` | focus on ✕, `fv=true` |
  | Escape on ✕ | closes, focus back on CTA `fv=true` | closes, focus back on CTA `fv=true` |
  | Tab | iframe | iframe |
  | Shift+Tab from iframe | ✕ | `<body>` |
  | Escape with focus inside iframe | does not close | does not close |
- Mailing / forms: the booking form only builds the iframe URL (no `/api/*` call). Nothing was booked in Calendly. No
  form was submitted to our APIs. `.env.local` was not read.

## Deviations from the spec
- **Backdrop tap does not close the modal** (spec A6-alt step 2.4 said "Backdrop tap closes (kept)"). Decision:
  Mauricio, 2026-11-11.
  - Rationale: Calendly is a multi-step flow, so an accidental tap outside would lose the visitor's progress.
  - Only the ✕ and Escape close it. Code comment in `openEmbeddedCalendlyModal`; unit test
    `a backdrop tap does NOT close`; PW `backdropKeepsOpen` = true in 12 / 12.
- **`assets.calendly.com` fact:** the spec says no request goes there after the change. Our page makes none, but
  Calendly's iframe document loads its own assets from it (7 requests). This can't be changed from our side; recorded
  rather than "fixed".
- **Grep AC:** 2 comment-only hits (see table). Removing the `CalendlyButton.scss` comment would mean touching a file
  outside the PR 1a list.

## Issues found (not fixed)
- **I-1 — Escape doesn't work while focus is inside the Calendly iframe** (Chromium and WebKit). Key events in a
  cross-origin frame never reach our `keydown` listener. The ✕ stays visible and clickable. A fix would need Calendly to
  forward keys (it doesn't) or a Tab trap, which D-10 rules out. Suggest: accept, and note it in the a11y statement.
- **I-2 — WebKit: Shift+Tab out of the iframe lands on `<body>`, not on the ✕.** Chromium returns to the ✕. This is
  Playwright's WebKit build; real Safari on macOS only tabs to buttons with "Press Tab to highlight each item" on. Worth
  one manual check in desktop Safari; no change proposed without a spec.
- **I-3 — WebKit: after a mouse or tap close, focus goes to `<body>`, not back to the CTA.**
  - Cause: Safari doesn't focus a button on click, so when the modal opens `previouslyFocused` is `<body>`.
  - Keyboard users (above) do get focus back on the CTA, which is what D-10 requires.
- **I-4 — Sweep script:** full-page captures can miss `loading="lazy"` images (project gallery). Future sweeps should
  scroll the page before capturing, so lazy images don't produce false EN diffs.
- **I-5 — Shift+Tab from the ✕ moves focus to the page behind the modal** (footer link in Chromium). This follows from
  having no Tab trap (D-10, spec-approved); listed so the real-device check doesn't flag it as new.

## Real-iPhone checklist (Mauricio, Vercel preview, before merging PR 1a)
Safari, toolbars **visible** (don't scroll them away first). Repeat on `/` and `/es`:
1. Scroll down a little, tap "Book a Free Strategy Call", fill nothing, tap Continue.
2. **Screen recording** of open → close with the ✕.
3. **Screenshot** with the modal open: the ✕ is fully visible in its white bar, below the status bar / notch, and the
   bottom of the dialog is above Safari's bottom toolbar (the `dvh` question).
4. While open, try to scroll the page behind the modal: does it move? After closing, is the page at the same position?
5. Tap the grey backdrop: the modal should **stay open** (decision 2026-11-11).
6. Scroll inside the Calendly frame: does it scroll the frame and not the page?
7. Note the **iPhone model and iOS version**.
8. Optional, desktop Safari: open the modal with the keyboard, then Escape. Does it close, and is focus back on the
   button (I-2)?

Plus the WORKFLOW preview checks: routes 200, `/esto-no-existe` 404, a project page 200.

## Proposed commits
Staged nothing (per the hard rules). One concern, one commit:
- `fix(calendly): open booking only in a hardened in-page modal, drop widget.js (A6-alt)`
  - `src/utils/calendly.ts`, `src/utils/calendly.test.ts`, `src/styles/components/calendly.scss`,
    `src/utils/scroll-lock.ts`, `src/utils/scroll-lock.test.ts`,
    `src/components/organisms/EmailCollectorProvider/index.tsx`, `src/components/atoms/CalendlyButton/index.tsx`,
    `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx`, `src/hooks/useCalendly.ts` (deleted)
- `docs(report): design round PR 1a (A6-alt)` — `docs/reports/design-round-1a.md`

## Time
Implementation (previous session): unknown. This session (gate, browser verification, script fixes, report): ~1 h agent
time, estimated. Human active time: unknown.
