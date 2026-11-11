# Design round — accessibility fixes (Part A) and visual decisions (Part B)

- Status:
  - **Part A: Done.** PR 1a (#37, A6-alt) and PR 1b (#38, A1–A5, A7, A8) are merged to `master`. Reports:
    `docs/reports/design-round-1a.md`, `docs/reports/design-round-1b.md`.
  - **Part B: Approved (Mauricio, 2026-11-11).** Every B item is decided. Part B ships as **PR 2**. A **PR 3**
    follow-up is reserved for small fixes from Mauricio's manual visual review of the PR 2 Vercel preview.
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-11-11 (rev 4.1: Mauricio's answers to Q-B5-ref, Q-B6, Q-B3) · Base: `master` `74c9cd0`
- Depends on: `docs/reports/design-round-1b.md` (I-1, the final-CTA background double download; lint budget),
  `docs/reports/phase-5c-loader.md` ("AC-8 findings (routed)", gallery gap measurements),
  `docs/reports/i18n-dictionary-fill.md` (F-1, F-2), `docs/reports/phase-5g-i18n-llm-qa.md` (D-10),
  `docs/reports/privacy-route.md` (I-2), `docs/specs/phase-5d-lite-contact-modal.md` (D-9, D-10),
  `docs/specs/phase-5f-analytics-consent.md` (rev 1.1, checked for Calendly dependencies)

## Revision log
- **Rev 4.1 (2026-11-11, Mauricio's answers):**
  - **Q-B5-ref = (i)**: keep his sizes. **Added requirement:** the home hero fills the first viewport.
    - `min-height` = `100svh` − header − bottom gap, capped at **820 px** (value proposed from the 1440 × 1200 and
      1920 × 1080 screenshots).
    - The illustration is anchored at the bottom.
    - Content still wins: zero overlap is the hard rule.
    - The B5 design, sketch, prototype table and AC are updated; the fold AC viewports are 1440 × 900, 1280 × 720,
      768 × 1024, 375 × 667 and 390 × 844, per locale.
  - **Q-B6 = the default:** the About style (`.btn.btn-secondary`, sentence case, 600), reusing the existing CSS. No
    `ServicesList.tsx` change.
  - **Q-B3 = the type scale:** desktop `5xl` 42/50; no hero-only override.
  - Evidence path: `~/Documents/projects/magneto/backups/design-round/b5-evidence/`.
  - Estimate updated. All Part B questions are closed.
- **Rev 4 (2026-11-11, Mauricio's Part B decisions):**
  - Part A is marked Done (PR 1a #37, PR 1b #38). Its text is unchanged below, as the record.
  - **B1:** option A + `text-wrap: balance`. ES stays on 2 balanced lines. A shorter ES label is a copy change
    routed to 5c-rest.
  - **B2:** unchanged (decided in rev 2).
  - **B3:** option b. The home H1 on desktop goes from 48 to **42 px** (from B5). The spec proposes how (the `5xl`
    desktop token) and checks the hierarchy. The eyebrow class is added, unused until 5e.
  - **B4:** option a.
  - **B5:** option c, using Mauricio's DevTools test as the desktop reference (≥ 1400 px: H1 42 px, illustration
    500 px, `bottom: -64px`). Values are derived for 1024–1399 and 601–1023, and the illustration goes in flow at
    ≤ 600. **New evidence:** the reference reproduced here still overlaps at 1400–1600 (see B5, Q-B5-ref).
  - **B6:** changed. `.service-cta` takes the secondary-button style of "Tell me about your project", at its fixed
    height. `docs/BUTTON_SYSTEM.md` is rewritten to match the real classes.
  - **B7:** option a. **B8:** set with B1-A + B5-c values, by Mauricio. **B9:** no new dependency.
  - **New item B10** (from PR 1b I-1): the final-CTA background gets a correct `sizes` and stops downloading twice.
  - The PR 2 file list, acceptance criteria and estimate are updated, and PR 3 is defined.
  - Fresh evidence for B1, B5, B6, B8 and B10 was measured on `74c9cd0` (see "Rev 4 measurements").
- **Rev 3 (2026-11-10, Mauricio round 2):**
  - **D-A6c → A6-alt.** We don't patch Calendly's popup DOM. Our hardened modal becomes the only booking path, and
    `widget.js` / `widget.css` and the preconnects are no longer loaded.
    - The precondition was verified: nothing depends on the widget beyond opening the popup. Evidence 3 below includes
      a new postMessage test.
    - Step (a), the crossOrigin removal, is therefore **moot**: the code that sets it is deleted.
  - **D-A7:** the nav label is "Main" / "Principal" / "Principal".
  - **PR split:** PR 1 becomes **PR 1a** (A6) and **PR 1b** (A1, A7, A2, A3, A8, A4, A5). Order: 1a → 1b → PR 2.
  - **B3:** the eyebrow is the short lead-in line above a title (e.g. LeadMagnetSection's over-title), not `.badge`.
    - A reusable eyebrow mixin + class is now proposed.
    - It applies to no current page.
    - There is a note for 5e.
    - LeadMagnetSection is not restyled in this round.
- **Rev 2 (2026-11-10):**
  - Part A approved.
  - A7 / A8 added and A3 extended.
  - A4 reduced to the hero/final-CTA background.
  - A6 crossOrigin hypothesis confirmed.
  - B2 decided.
  - Corrections:
    - `CalendlyButton.scss` is never imported;
    - the raw hero PNG loads on 6 routes.
- **Rev 1 (2026-11-10):** first draft.

## Goal
- **PR 1a (A6) — done.** Booking opens in our own modal on every device, closable on iPhone, with no Calendly script.
- **PR 1b (rest of Part A) — done.** One `<main>` + skip link, header `<nav>`, logo alt, decorative `alt=""`, AA
  contrast on case lists, the optimized hero/final-CTA background, no empty gallery captions.
- **PR 2 (Part B).** When PR 2 is merged:
  - FR CTA labels fit on one line at 375; ES CTAs wrap to 2 balanced lines (B1);
  - Packages cards are 1 column at 601–1023 (B2);
  - the type scale, form text and eyebrow class are fixed, and the home H1 is 42 px on desktop (B3);
  - the vertical rhythm outliers are normalized (B4);
  - the home hero's CTA, subtitle and illustration **never overlap**, in any locale, at any width. The home hero
    fills the first viewport (capped at 820 px) whenever its content fits (B5);
  - the Services outline buttons are 50–54 px tall, like the other secondary buttons, and `docs/BUTTON_SYSTEM.md`
    describes the real classes (B6);
  - the privacy text has a ~70-character measure at 768 (B7);
  - `length-limits.json` is set (B8);
  - the final-CTA background is downloaded once, at the right size (B10).
- **PR 3 (follow-up).** Small fixes from Mauricio's visual review of the PR 2 preview (see "PR 3").

EN changes only where an item says so.

---

## Evidence (facts verified now)

### How it was measured
- **Build:** `ENABLED_LOCALES=en,fr,es npm run agent:build` passed (35 static pages). The server ran with
  `next start -p 3100`, own PID, against the local CMS. Every route was requested twice before capture (stale-ISR note
  from 5c).
- **Tools:**
  - Playwright 1.62.1 from the npx cache, with Chromium 1234 and WebKit 2336 (no install, no repo change);
  - axe-core 4.10.3, the copy already in `node_modules`;
  - read-only scripts in the session scratchpad;
  - throwaway HTML pages served by `python3 -m http.server 3200` from the scratchpad.
- **Evidence folder** (outside the repo): `~/Documents/projects/magneto/backups/design-round/screenshots/`.
  - **72 full-page PNGs** `<lang>/<route>_<width>.png`:
    - 8 routes (`home`, `services`, `packages`, `projects`, `project_fashion-company-ecommerce`, `about-magneto`,
      `contact`, `privacy-policy`);
    - en/fr/es × 375 / 768 / 1440;
    - DPR 2 at 375/768, 1 at 1440.
  - `detail/`: crops, the A6 runs (`a6_*`, `a6x_*`), the A4 comparisons (`a4_q75-vs-q90_*`) and B2 (`b2_packages_*`).
  - `measurements.json`, `detail.json`, `axe-baseline.json`, `a4-quality.json`, `a4-weight-cold.json`.
- **All 72 page/width combinations:** HTTP 200 and **no horizontal scroll**.
- **Lint at the start:** **88 errors / 94 warnings** (`npm run lint`), the same as the privacy-route baseline.

### Rev 4 measurements (2026-11-11, `master` `74c9cd0`)
- **Build / server:** `ENABLED_LOCALES=en,fr,es npm run agent:build` exit 0, 0 `ECONNREFUSED` / `fetch failed`;
  `npm run agent:start` on 3100 (own PID, stopped after). Ports 3000 and 3100 were free before the build.
- **Lint now:** **84 errors / 81 warnings** (`npm run lint`), the PR 1b result. This is the PR 2 budget.
- **Prototype method:** CSS injected into the test browser only (`page.addStyleTag`), then a **600 ms settle**:
  `.btn` has `transition: all 0.2s` (`button.scss:29`), so a read taken right after injection catches the padding
  mid-animation. The first B1 run did exactly that (buttons 2 px narrower instead of 30); it was re-run.
- **Overlap metric (B5):** "art" = the illustration's pixels with alpha > 128. The script finds the first art row
  inside the CTA's x-range, ring included (the 5 px `box-shadow`, `Hero.scss:181`). `ctaClear` = that row − (CTA
  bottom + 5). `ctaClear ≥ 0` means no overlap. The subtitle is checked the same way, per text line box.
- **Scripts and outputs:** `~/Documents/projects/magneto/backups/design-round/b5-evidence/` (copied by Mauricio
  from the session scratchpad):
  - `measure.cjs` (+ `before.json`, `ref.json`, `proto.json`), `proto.css` (the B5 prototype), `ref1400.css`
    (Mauricio's reference), `alpha.cjs`, `b1.cjs` + `b1.css`, `btn.cjs`, `fcta.cjs` (+ `fcta-before.json`);
  - screenshots `shots_ref/` and `shots_proto/` (`<lang>_<width>.png`, hero only);
  - rev 4.1 (fold): `geo.cjs` (header / margins), `fold.css`, `cap820.css`, `fold.cjs` (+ `fold-nocap.json`,
    `fold-cap820.json`), screenshots `shots_fold/` and `shots_fold820/` (`<lang>_<w>x<h>.png`, viewport only).
  - The Dev re-runs them for PR 2 and keeps copies under `…/design-round/screenshots-after-2/`.

### Local CMS (read-only GraphQL)
```graphql
{ projects(first: 10, where: { language: "en" }) { nodes { slug projectsProjectData { images { footNote } } } } }
```
Trimmed response (FR and ES are identical):
```
trepied-trepied-ca        = ["Positioning first — stories that matter…", … 7 strings]
shamaniccas-ecommerce     = [null × 7]
fashion-company-ecommerce = [null × 5]
```
- `page.tsx:58` maps `null` to `""`, and `ProjectDetail/index.tsx:128-130` always renders `<p>{img.footNote}</p>`.
- **No item in this spec needs a CMS change.**

Rev 4, for B5 and B8:
```graphql
{ pages(first: 1, where: { language: "<en|fr|es>", name: "home" }) { nodes { heroContent { heroTitle } } } }
```
```
en 73 'Website strategy, design and development for Montreal service businesses.'
fr 96 'Stratégie, conception et développement de sites web pour les entreprises de services à Montréal.'
es 75 'Estrategia, diseño y desarrollo web para empresas de servicios en Montreal.'
```

### axe baseline (`axe-baseline.json`; 48 runs = 8 routes × 3 locales × 375/1440)
| Rule | Impact | Pages | Nodes | Where / owner |
|---|---|---:|---:|---|
| `landmark-one-main` | moderate | 48 | 48 | no `<main>` → A1 |
| `region` | moderate | 48 | 530 | content outside landmarks; the header has no `<nav>` → A1 + A7 |
| `color-contrast` | **serious** | 6 | 84 | case page: `.project-detail__list li` `$gray-80` #787878 = **4.42:1** (14 nodes per run) → A8 |
| `heading-order` | moderate | 6 | 6 | `/projects` and home grid `h3` after `h1` (not in scope) |
| `empty-heading` | minor | 4 | 4 | FR/ES home: empty 3rd `service-card` `h3` (content, 5c-rest) |

"No new violations" in the AC means: compared with this table, rule by rule and route by route. For PR 2 the
reference is the PR 1b result (`landmark-one-main` 0, `color-contrast` 0 on case pages, `landmark-unique` 0).

---

# PART A — Done (PR 1a #37, PR 1b #38)

The Part A text below is the approved spec as implemented. Results and deviations are in the two reports.

## A6 — BLOCKING: Calendly booking can't be closed on iPhone → **PR 1a**

### A6 evidence 1 — reproduction (current code)
WebKit (Playwright), local app. Flow: hero CTA → booking `<dialog>` → "Continue" with empty fields.

| Profile | Viewport | Path | Close control | Result |
|---|---|---|---|---|
| iPhone 8 | 375×667 | iframe fallback | ✕ glyph 24×29 px at (328, 22), drawn over Calendly's dark "Powered by" ribbon | Exact tap closes; **a tap 14 px off lands on the `IFRAME`**; the page behind scrolls (`scrollY` 300 → 700) |
| iPhone 13 | 390×664 | iframe fallback | ✕ 24×29 px at (343, 20) | Escape closes (no Escape key on a phone) |
| Chromium 375×667 | — | iframe fallback | ✕ 27×25 px | same |

Screenshots: `detail/a6_webkit_375x667_calendly-open.png`, `detail/a6_iphone-*`.

### A6 evidence 2 — why the official popup never opens (crossOrigin test, rev 2)
- **Method:** no `src/` change.
  - **E1, throwaway page.** `scratchpad/www/calendly-test.html` loads `widget.css` + `widget.js` with
    `crossOrigin='anonymous'` or with no attribute, then calls `initPopupWidget`.
  - **E2, real app on :3100.** A Playwright init script turns the `crossOrigin` setter into a no-op on `*.calendly.com`
    elements. That equals removing `calendly.ts:101/114/155`.
- **Commands:**
  ```bash
  NODE_PATH=~/.npm/_npx/705bc6b22212b352/node_modules node a6-crossorigin.cjs <detail dir>
  NODE_PATH=… node a6probe.cjs …
  ```
- **Trimmed output:**

E1 (throwaway page):
```
page_{chromium,webkit}_crossorigin=anonymous  calendlyGlobal=undefined popupOpened=false script=onerror  (CORS error)
page_{chromium,webkit}_crossorigin=none       calendlyGlobal=object    popupOpened=true  script=onload   errors=[]
```

E2 (real app):
```
{chromium,webkit}_1440_current   Calendly=undefined  path=iframe fallback  <script crossorigin="anonymous">
{chromium,webkit}_1440_patched   Calendly=object     path=official popup   close 19×19, tap closes: true
webkit iPhone 8 / iPhone 13 / chromium 375: current = fallback; patched = official popup, close 19×19
```

Official popup probe (WebKit iPhone 8, `/es`, patched):
```
.calendly-popup-close: DIV role=null aria-label=null tabIndex=-1 19×19
Escape → stays open; body overflow hidden but the page still scrolled 31 → 331
```
- **CDN:** `curl -sI -H "Origin: <o>" https://assets.calendly.com/assets/external/widget.js` returns
  `access-control-allow-origin: https://calendly.com` for every Origin tried, production domains included.
- **History:** `4eb6b7b` (2025-10-08) introduced `crossOrigin='anonymous'`; `2fed720` (2025-12-11) kept it.
- **Fact:** locally, the attribute blocks the widget in Chromium and WebKit, so users only ever get our iframe modal.
- **Fact:** Calendly's own popup fails the A6 bar: 19×19 close, not focusable, unnamed, no Escape, no scroll lock.
- **Open, no longer blocking:** what production did on 2026-10-03, when Mauricio recorded the popup working. A6-alt
  doesn't use the widget, so the answer doesn't change the fix.

### A6 evidence 3 — A6-alt precondition: does anything need the widget beyond opening the popup? (rev 3)
| Dependency checked | How | Result |
|---|---|---|
| Who calls the widget API | `grep -rn "window.Calendly\|initPopupWidget\|initBadgeWidget\|closePopupWidget" src` | Only `src/utils/calendly.ts`: `initPopupWidget` (`:254-256`), `closePopupWidget` inside the fallback's `close()` (`:385-387`), the `declare global` (`:7-15`), and `calendly.test.ts` mocks. **No badge widget, no inline widget, no other caller.** |
| Prefill (utm, a1–a3) | `calendly.ts:205-229` | The values are built **into the URL** before the path is chosen, so the iframe receives the same URL (`calendly.test.ts:115-120` already asserts a1–a3 in the iframe `src`). Neither name nor email is prefilled today (only a1–a3 + utm). |
| Iframe URL parity | `scratchpad/a6alt-params.cjs` (Chromium). It loads the same event via the widget and via a plain iframe with `embed_domain` + `embed_type` | `widget  embed_domain,embed_type,utm_source,a1,month` / `iframe  utm_source,a1,embed_domain,embed_type,month`: **the same parameter set**. The widget sends `embed_domain=host:port` (`localhost:3200`); ours sends `hostname` (`localhost`). |
| `calendly.*` postMessage events from an iframe | `scratchpad/www/iframe-msg.html` + `a6alt-msg.cjs`, Chromium + WebKit, 12 s each, `window.addEventListener('message')` | **iframe + `embed_domain`:** `calendly.event_type_viewed` ×2 and `calendly.page_height` ×5–6, all `@https://calendly.com`. **iframe without `embed_domain`:** none. **Official widget:** `calendly.event_type_viewed` ×2. So the iframe sends Calendly's events to the page on the same channel as the widget (more of them, in fact), as long as `embed_domain` is set. Our modal already sets it (`calendly.ts:361-363`). |
| `calendly.event_scheduled` | the same channel | **Not observed.** It needs a real booking, and agents don't write to Calendly. *Assumption:* Calendly sends it on the same `message` channel as `event_type_viewed` (its documented embed API). |
| Listeners that expect those events | `grep -rn "addEventListener('message'\|postMessage\|event_scheduled" src`; `grep -n -i "calendly\|postMessage\|event_scheduled" docs/specs/phase-5f-analytics-consent.md` | **No `message` listener in `src`.** 5f (Approved rev 1.1) defines **no Calendly event**. It only lists "Calendly loading (on click)" as unchanged (§8), puts `calendly.ts` out of its scope, and lists "custom events beyond the existing `gtagEvent` calls" as out of scope. Its only Calendly assumption is the overlay's stacking (`z-index: 10000`, above the 1000 consent banner, E12 / layout) and "the Calendly overlay covers the banner" (AC-9). |
| GA events tied to the widget | `calendly.ts:237-264` | `calendly_popup_opened` is sent via raw `gtag` on the widget path (`method: 'popup_widget'`) and the new-tab path. **The iframe path sends none today.** It's a no-op until 5f anyway (`window.gtag` absent). |
| Tests that mock `window.Calendly` | `grep` | `src/utils/calendly.test.ts:8-9, 22, 26, 36, 46, 57, 61, 73, 77, 81, 115, 124, 128` (3 `describe` blocks read the URL from `initPopupWidget` mock calls). `CalendlyButton.test.tsx:10-15` mocks `openCalendlyPopup` + `warmCalendlyResources` (not `window.Calendly`). `EmailCollectorProvider.test.tsx:77` spies `openCalendlyPopup` only. |
| Other importers of the loader / warm-up | `grep -rn "loadCalendlyScript\|warmCalendlyResources" src` | `CalendlyButton/index.tsx:7`: `loadCalendlyScript` is imported but unused; `warmCalendlyResources` runs on hover/focus (`:93-101`, `onMouseEnter` / `onFocus`). `EmailCollectorProvider/index.tsx:100` warms on dialog open. `src/hooks/useCalendly.ts:10,50,85,94` has **0 importers** (`grep -rn useCalendly src`). |
| CSP / headers | `next.config.ts` | No page CSP (`images.contentSecurityPolicy` applies to the image optimizer only), so the `calendly.com` iframe is not blocked. |

**Conclusion: the precondition holds.**
- The widget is used only to open the popup.
- Prefill travels in the URL.
- Calendly's events reach the page from the iframe embed with `embed_domain`, and nothing in the code or the approved
  5f spec listens for them.
- → **Specify A6-alt.** Step (a), removing `crossOrigin` at `:101/:114/:155`, is **moot**: those lines are deleted
  with the loader and the preconnects.
- **Open (non-blocking):** `calendly.event_scheduled` from the iframe was not observed. If a later phase
  (analytics/conversions) needs it, that phase adds the listener (`event.origin === 'https://calendly.com'`) and checks
  the event with a test booking that Mauricio makes.

### A6-alt fix (specified) — PR 1a
**1. Remove the widget (`src/utils/calendly.ts`).**
- Delete:
  - `CALENDLY_CSS`, `CALENDLY_SCRIPT`, `loadCalendlyScript` (and `_loadPromise`), `warmCalendlyResources` (and
    `_calendlyWarmed`);
  - the `declare global { Window.Calendly }` block;
  - `CalendlyPopupOptions` and `CalendlyBadgeOptions` (only used by that block);
  - the `initPopupWidget` branch in `openCalendlyPopup`;
  - the `closePopupWidget` call in `close()`.
- `openCalendlyPopup` keeps its **signature** and its URL building (utm, a1–a3, `customUrl` ignored per D-8):
  - `forceNewWindow` / `preferNewWindow` → `window.open` (unchanged);
  - otherwise → `openEmbeddedCalendlyModal(...)`;
  - on any error → the existing last-resort `window.open`.
- Send the existing `calendly_popup_opened` gtag event on the modal path with `method: 'embedded_modal'`. This keeps
  today's intent (an "opened" event); it is a no-op until 5f.
- Keep `trackCalendlyEvent` (unused; out of scope).
- **Callers:**
  - `CalendlyButton/index.tsx`: remove the `loadCalendlyScript` / `warmCalendlyResources` import, `handlePreload`, and
    the `onMouseEnter` / `onFocus` handlers on the `<button>`. The **props are unchanged**.
  - `EmailCollectorProvider/index.tsx:100`: remove the `warmCalendlyResources()` call and its import.
  - `src/hooks/useCalendly.ts`: **delete** the file (0 importers; it imports the removed loader).
- **Fact recorded in the report:** after the change, no request goes to `assets.calendly.com`. The only Calendly request
  is the iframe document on `calendly.com`, made on "Continue".

**2. Harden the modal (`openEmbeddedCalendlyModal`).** The same hardening specified in rev 2, now applied to the only
path:
1. **Structure (DOM APIs):**
   - `overlay` (fixed, `inset: 0`, backdrop, **`z-index: 10000` kept**: 5f's banner (1000) and AC-9 rely on it);
   - inside it, `container` (`role="dialog"`, `aria-modal="true"`, `aria-label` = `labels.frameTitle`; the role moves
     from the overlay to the container);
   - inside the container, a **52 px toolbar** with the close button, **above** the iframe;
   - then the iframe.
2. **Styles in a file that ships:**
   - a new `src/styles/components/calendly.scss`, imported by `EmailCollectorProvider/index.tsx` next to its
     `email-collector.scss` import;
   - remove the sizing inline styles from `calendly.ts`.
   - Overlay:
     ```scss
     display: flex;
     align-items: center;
     justify-content: center;
     box-sizing: border-box;
     padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
              max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
     ```
   - Container:
     ```scss
     width: 100%;
     max-width: 760px;
     height: min(640px, 100%);
     max-height: 100%;
     max-height: 100dvh;
     display: flex;
     flex-direction: column;
     background: $white;
     border-radius: 8px;
     overflow: hidden;
     ```
   - Iframe: `flex: 1 1 auto; min-height: 0; width: 100%; border: 0`.
   - **No `100vh` anywhere.**
3. **Close button `#calendly-embedded-close`:**
   - `type="button"`, `aria-label` = `labels.closeDialog` (existing key);
   - an inline SVG ✕ with `aria-hidden`, the same path as `.ec-close`;
   - **≥ 44×44 px**, white background, `$black` icon;
   - `:focus-visible` 2 px `$primary-color` outline, offset 2 px; `:hover` `$gray-20`.
4. **Escape** closes (kept). **Backdrop tap** closes (kept).
5. **Focus:** on open, focus the close button (kept). On close, restore `previouslyFocused` if it is still connected. No
   Tab trap (cross-origin iframe, D-10).
6. **Scroll lock:**
   - move `lockPageScroll()` unchanged from `EmailCollectorProvider/index.tsx` into a new `src/utils/scroll-lock.ts`;
   - import it in both places;
   - lock on open, unlock on every close path.
7. Iframe URL params (`embed_domain` = `location.hostname`, `embed_type=Inline`, utm, a1–a3): **unchanged**.
   `embed_domain` must stay, because Calendly's `postMessage` events depend on it (evidence 3).

**Not in this round:** Calendly's popup DOM patch (D-A6c, declined), and any `message` listener (no consumer).

### Acceptance (A6, PR 1a)
- [x] **Code:** `grep -rn "assets.calendly.com\|widget.js\|widget.css\|window.Calendly\|initPopupWidget\|loadCalendlyScript\|warmCalendlyResources\|useCalendly" src`
  returns 0, or only removal-proof lines inside tests.
- [x] **Unit (`calendly.test.ts`, jsdom),** rewritten without `window.Calendly` mocks. The URL assertions move from
  `initPopupWidget` calls to the iframe `src`:
  - the a1–a3 / utm / single-event / `forceNewWindow` cases are kept;
  - no `<script>` / `<link>` for Calendly is added to `<head>`;
  - the close button sits in the toolbar before the iframe, with `aria-label` per locale;
  - Escape and the backdrop close the modal, and focus is restored;
  - `body` is `position: fixed` while open and restored after close, with the scroll position kept;
  - no inline `100vh`; `embed_domain` is present.
- [x] **Unit (`scroll-lock.test.ts`):** lock/unlock restores the inline styles and the scroll position.
- [x] **Unit (`CalendlyButton.test.tsx`):** the existing click / collector / `forceNewWindow` / disabled cases still
  pass, with the `warmCalendlyResources` mock removed.
- [x] **Local Playwright, Chromium and WebKit; desktop 1440 and `iPhone 8` / `iPhone 13`; `/` and `/es`** (see the
  PR 1a report for results and the accepted Escape-inside-iframe limit).
- [x] **Real iPhone (Mauricio, before merging PR 1a).**

---

## PR 1b — the rest of Part A

## A1 — one `<main>` landmark + skip link
- **Fact:** no `<main>` and no `role="main"` in `src/`. axe `landmark-one-main` fails on 48/48 pages. No CSS targets the
  `main` element (`globals.scss:19` targets the `.main` class).
- `src/app/[locale]/layout.tsx`: wrap `{children}` in `<main id="main-content" tabIndex={-1}>` between `<Header>` and
  `<FooterLoader>`. Route content, including each route's final CTA, goes inside. No component renders `<main>` today;
  the Dev greps again before merge.
- **Skip link:** the first child of `<body>`: `<a className="skip-link" href="#main-content">{t.common.skipToContent}</a>`.
- `src/styles/globals.scss`:
  - `.skip-link`: hidden until `:focus-visible`, then a fixed pill at top left, above the fixed header
    (`z-index` > 10), `$primary-color-dark` on white, 2 px outline;
  - `#main-content`: `scroll-margin-top` equal to the header height, `outline: none`.
- **New key `common.skipToContent` (D-A1a approved):**
  - EN "Skip to main content";
  - FR "Passer au contenu principal";
  - ES "Saltar al contenido principal".

  Add it to `en.test.ts` `EN_FINGERPRINT`.

## A7 — header `<nav>` landmark
- `src/components/organisms/Header/index.tsx`:
  - wrap `ul.nav` (desktop) in `<nav aria-label={t.header.navLabel}>`;
  - wrap `ul.nav_mobile__menu` (the opened mobile menu) in `<nav aria-label={t.header.navLabel}>`;
  - `ul.nav_mobile` (CTA + menu toggle) stays as it is.
- **D-A7 decided:** new key `header.navLabel`: EN **"Main"**; FR **"Principal"**; ES **"Principal"**.
- **Layout risk:** guarded by a **0-pixel header diff** at 375/768/1440 × EN/FR/ES. No `display: contents`.

## A2 — `header.logoAlt` = "Magneto" (F-1)
- `src/i18n/dictionaries/{en,fr,es}.ts`: `header.logoAlt: 'Magneto'`; `EN_FINGERPRINT` updated with its source comment.

## A3 — decorative images get `alt=""` (F-2 + service icons)
- Final-CTA background, the `PackageCard` and `ProjectDetail` check icons, `ServiceIcon`, the Services list icons →
  `alt=""`. `common.checkIconAlt` and `cmsFallback.finalCta.bgAlt` removed.

## A8 — case-page contrast (WCAG AA)
- `.project-detail__list li` and `.project-detail__external-link`: `$gray-80` (4.42:1) → `$gray-90` #606060 (6.29:1).

## A4 — image quality (reduced scope)
- Hero background: `next/image` `fill`, `priority`, `sizes="(max-width: 1240px) 100vw, 1200px"`, `quality={90}`.
- Final-CTA background: `quality={90}` via `WpResponsiveImage` `...rest`.
- `next.config.ts`: `images.qualities: [75, 90]`.
- **Result (PR 1b report):** hero routes about 1.6 MB lighter. Case pages at 375 grew 4.0–4.5% because the final-CTA
  background is fetched twice (I-1) → **B10 in PR 2**.

## A5 — empty-caption gallery gap
- `ProjectDetail/index.tsx`: render `<p>` only when `img.footNote.trim()` is non-empty.

## Part A — files touched
| PR | Items | Files |
|---|---|---|
| 1a | A6-alt | `src/utils/calendly.ts`, `src/utils/calendly.test.ts`, `src/styles/components/calendly.scss` (new), `src/utils/scroll-lock.ts` (new), `src/utils/scroll-lock.test.ts` (new), `EmailCollectorProvider/index.tsx`, `CalendlyButton/index.tsx`, `CalendlyButton.test.tsx`, `src/hooks/useCalendly.ts` (deleted), `docs/reports/design-round-1a.md` |
| 1b | A1, A7, A2, A3, A8, A4, A5 | `layout.tsx`, `globals.scss`, dictionaries + `en.test.ts`, `Header/index.tsx`, `Header.scss`, `FinalCTASection/index.tsx`, `PackageCard/index.tsx`, `ProjectDetail/index.tsx`, `ProjectDetail.scss`, `ProjectDetail.test.tsx` (new), `ServiceIcon/index.tsx`, `services/ServicesList.tsx`, `Hero/index.tsx`, `next.config.ts`, `docs/reports/design-round-1b.md` |

---

# PART B — Approved (Mauricio, 2026-11-11) → PR 2

Button style at the phone breakpoint, measured: `.btn` = 12 px / 900 (CTA classes) or 600 / line-height 16 px /
padding 15 px 30 px, uppercase on hero and final-CTA buttons. Every CTA wrap happens only at 375.

Breakpoint facts that matter for the values below (`variables.scss:41-45`, `typography.scss:94-115`):
- The phone/tablet/desktop **font** steps are `max-width: 600px` / `max-width: 1024px`. So **1024 px still uses
  the tablet font size**, and the desktop size starts at 1025.
- The **layout** mixins are `min-width`: `$breakpoint-tablet` 601, `$breakpoint-desktop` 1024,
  `$breakpoint-desktop-lg` 1400, `$breakpoint-desktop-xl` 1600.
- `Hero.scss` uses `min-width: $breakpoint-phone` (600) for its first step, so 600 px is already "tablet" there
  (`Hero.scss:59, 101, 131, 144`).

## B1 — CTA labels wrap on phone — **DECIDED: option A + `text-wrap: balance`**
**Decision.** At ≤ 600 px:
- hero buttons and final-CTA buttons get `padding-inline: 15px`;
- the final-CTA container gets `padding-inline: 15px`;
- those buttons get `text-wrap: balance`.

ES stays on 2 balanced lines for now. A shorter ES label is a **copy change routed to 5c-rest** (dictionary
`common.bookStrategyCall` + CMS CTA fields), not this PR.

**Measured at 375, before → after (prototype, 600 ms settle; `b1.cjs`):**

| Location | EN | FR | ES |
|---|---|---|---|
| Hero (home, about, services) | 235 → **205** px, 1 line | 292 → **262**, 1 line | 315 × 62 → 315 × 62, **2 lines (balanced)** |
| Final CTA (about, services) | 204 → **174**, 1 line | 285 × 62 (2) → **262 × 46 (1)** | 285 × 62 (2) → 315 × 62, **2 (balanced)** |
| Packages final CTA, secondary | 208 → 178, 1 | 285 × 66 (2) → **266 × 50 (1)** | 285 × 66 → 315 × 66, 2 |
| Contact "Prefer to talk?" (`.hero-secondary .btn`) | 208 → 178, 1 | 258 → 228, 1 | 315 × 66 (2) → **292 × 50 (1)** |
| Packages hero / final CTA, primary | 245 → 215, 1 | 244 → 214, 1 | 254 → 224, 1 |

- Every FR CTA is 1 line at 375. ES has 2 balanced lines on the "Agendar una llamada de orientación gratuita"
  buttons, and the Contact one now fits on 1 line.
- **EN change:** buttons are 30 px narrower at ≤ 600 (label unchanged, height unchanged).
- `/fr` and `/es` home final CTAs still show the EN legacy label "Get Your Free Strategy Call" (5c-rest, known).

**Implementation:**
- `Hero.scss`: inside `.hero`, at `max-width: $breakpoint-phone` (600):
  `.hero-cta-wrapper .btn, .hero-secondary .btn { padding-inline: $spacing-15; text-wrap: balance; }`.
- `FinalCTASection.scss`: at `max-width: $breakpoint-phone`: `.final-cta-section__container { padding-inline: $spacing-15; }`
  and `.final-cta-section .btn { padding-inline: $spacing-15; text-wrap: balance; }`.
- No change to `button.scss` (other buttons keep 30 px).

**AC:**
- [ ] At 375 × en/fr/es on `/`, `/about-magneto`, `/services`, `/packages`, `/contact`: every FR hero/final-CTA
  button is 1 line; ES "Agendar…" buttons are ≤ 2 lines, with line widths differing by ≤ 25%
  (`Range.getClientRects()` per line).
- [ ] At 768 and 1440, button widths are unchanged versus `master` (±1 px).

## B2 — Packages cards at tablet — **DECIDED (Mauricio, 2026-11-10)**
**Decision:** 1 column on phone **and** at 768 (iPad portrait), centred, with a width between 66% and 75% of the
viewport at 768. At ≥ 1024 the current layout (3 columns) stays.

**Prototype** (CSS injected in the test browser only; `scratchpad/b2*.cjs`). Characters per line = full lines of the
card's bottom-box text (14 px), average / p90, for the 3 cards:

| 768 | Card width | EN | FR | ES | Titles |
|---|---:|---|---|---|---|
| current (2 columns) | 362 px (47%) | 37–45 / ≤ 49 | 41–43 / ≤ 48 | 35–42 / ≤ 48 | 2 lines |
| **66vw** | **507 px** | **55–68 / ≤ 74** | **63–67 / ≤ 71** | **60–67 / ≤ 70** | 1 line |
| 70vw | 538 px | 58–**76** / ≤ 78 | 67–68 / ≤ 75 | 56–70 / ≤ 76 | 1 line |
| 75vw | 576 px | 68–**81** / ≤ **83** | 70–**78** / ≤ 83 | 68–75 / ≤ 79 | 1 line |

**Chosen: 66% at 768.** It is the only candidate that keeps every card, in every locale, within about 75 characters per
line.

**Range rule:**
```scss
// PackagesGrid.scss — replace the 2-track rule at tablet-up, keep the desktop rule from 1024
@media (min-width: $breakpoint-tablet) and (max-width: #{$breakpoint-desktop - 1px}) {
  grid-template-columns: minmax(0, min(100%, clamp(30rem, 66vw, 33rem)));
  justify-content: center;
}
```
| Width | Card | % viewport | Characters per line, worst card (avg / p90) | Columns |
|---|---:|---:|---|---|
| 600 (phone, unchanged) | 570 | 95% | 78 / 83 (existing) | 1 |
| 601 | 480 | 80% | 62–64 / ≤ 69 | 1 |
| **768** | **507** | **66.0%** | EN 68/74 · FR 67/71 · ES 67/70 | **1, centred** |
| 834 / 1023 | 528 | 63% / 52% | EN 72/74 · FR 68/75 · ES 70/76 | 1, centred |
| 1024 (desktop, unchanged) | 301 | — | 35/40 | 3 |

- No horizontal scroll at any width. The rich-card subgrid keeps working with one track.
- **Screenshots at 768:** `detail/b2_packages_{en,fr,es}_768_chosen.png` (+ `…_current/66vw/70vw/75vw.png`).
- **Note:** in ES the CARE title ends 2–4 px from the icon at 768. The Dev checks it doesn't touch at 601–1023.
- **AC:**
  - [ ] Packages × en/fr/es: 1 column at 375, 601, 768 and 1023 (centred, width = the formula);
  - [ ] 3 columns at 1024 and 1440 (pixel-identical to `master` at 1440);
  - [ ] no horizontal scroll.

## B3 — Typographic hierarchy — **DECIDED: option b + home H1 42 px on desktop**
### Inventory (`typography.scss`, `variables.scss`) — unchanged from rev 3
- **Fonts and weights:** DM Sans is loaded at 400 / 600 / 900 only. `$font-weights`: medium 400, bold 600, extrabold
  900. `variables.scss` also declares 500 and 700, which are not loaded. Weights 700 (privacy h2) and 800
  (`PackagesContentSections` h3) are requested.
- **Scale shift:** `.typo-xl…5xl` use one step down below 601 px (e.g. `.typo-5xl-*` at phone = the `4xl` phone token).

| Token | Desktop | Tablet | Phone |
|---|---|---|---|
| xs | 12/18 | 10/16 | 10/14 |
| sm | 14/20 | 12/18 | 12/16 |
| md | 16/24 | 14/20 | 14/18 |
| lg | 18/28 | 16/24 | 16/20 |
| xl | 20/30 | 18/27 | 18/22 |
| 2xl | 24/34 | 20/30 | 20/26 |
| 3xl | 30/40 | 24/34 | 22/28 |
| 4xl | 36/46 | 30/38 | 27/30 |
| 5xl | 48/56 | 36/44 | 30/33 |

### Measured problems (rev 3)
1. At 375 the subtitle and the body are identical (16/400/20).
2. Body line height at 375 is 20 px (1.25).
3. **Bug:** `Hero.scss:124-147` sets `line-height: 30px`, then `inherit` from 600 px, so the tokens are ignored
   (browser `normal`). On phone it forces 30 px for both the title and the subtitle.
4. Form help is 12 px on phone and tablet. Controls drop to 14 px on desktop, below the labels.
5. Weights 700 and 800 are requested but not loaded.

### Decided changes (B3-b)
- **Phone tokens:** lg 16/**24**, xl **18/26**, 2xl 20/**28**, 3xl **24/30**, 4xl **28/34**, 5xl 30/36.
- **Tablet tokens:** sm **13**/20, md **15**/22.
- **Fixes (B3-a, included):**
  - remove the hero `line-height` overrides (`Hero.scss` `.hero-title` / `.hero-subtitle` `line-height: 30px` and
    `inherit`), so the tokens apply;
  - form help / privacy / required note: phone and tablet **13/20**;
  - form controls **16 px at every width**;
  - weights: 700 → 600 (privacy h2) and 800 → 900 (`PackagesContentSections` h3); remove the unloaded 500 / 700
    entries from `variables.scss`.
- **Desktop:** unchanged, **except the home H1 (below)**.

### Home H1 at 42 px on desktop — how
**Fact:** the `5xl` desktop token is reached only through the `.typo-5xl-*` classes, and the only consumer of those
classes is the home hero H1 (`Hero/index.tsx:38`, `defaultTitleSize` for `variant === 'home'`):
```
$ grep -rn "5xl" src --include=*.tsx --include=*.scss --include=*.ts | grep -v typography.scss
src/components/organisms/Hero/index.tsx:38:  const defaultTitleSize = variant === 'home' ? 'typo-5xl-extrabold' : 'typo-4xl-extrabold';
```

| Option | Change | Effect |
|---|---|---|
| **Token (recommended)** | `typography.scss`: `$font-sizes-desktop` `"5xl": 48px` → **`42px`**; `$line-heights-desktop` `"5xl": 56px` → **`50px`** | Only the home H1 changes, at ≥ 1025 px. One source of truth: the scale itself says the top step is 42. No specificity rule. |
| Hero-only override | `.hero.hero-home .hero-title { @media (min-width: 1025px) { font-size: 42px; line-height: 50px } }` | Same pixels today. The `5xl` token keeps saying 48, which nothing renders, so the next consumer would get 48 by surprise. Needs a 1025 px literal (the font step is `max-width: 1024`). |

**Decided (Q-B3, Mauricio 2026-11-11): the token.** No hero-only override. It is the same visual result with one
less rule, and the token stays truthful.
Line height 50 keeps the current ratio (48/56 = 1.17 → 42/50 = 1.19).

**Hierarchy check after B3-b + 42 px** (size / line height, px):

| Role | Phone (375) | Tablet (601–1024) | Desktop (≥ 1025) |
|---|---|---|---|
| Home H1 (`typo-5xl`) | **28/34** | 36/44 | **42/50** (was 48) |
| Page H1 (`typo-4xl`) | 24/30 | 30/38 | 36/46 |
| H2 (`typo-3xl`) | 20/28 | 24/34 | 30/40 |
| H3 (`typo-2xl`) | 18/26 | 20/30 | 24/34 |
| Home hero subtitle (`typo-2xl-medium`) | 18/26 | 20/30 | 24/34 |
| Body (`typo-paragraph`) | 16/24 | 16/24 | 18/28 |

- Steps home H1 → page H1 → H2: desktop 42 → 36 → 30 (×1.17, ×1.2); tablet 36 → 30 → 24 (×1.2, ×1.25); phone
  28 → 24 → 20 (×1.17, ×1.2). **The home H1 stays the largest heading at every width, one clear step above the page
  H1**, and the steps are now regular (today desktop is 48 → 36, ×1.33, then ×1.2).
- Home H1 vs its own subtitle at desktop: 42 / 24 = 1.75 (was 2.0). Weight 900 vs 400 keeps the contrast.
- Measured in the B5 prototype (`proto.json`): home H1 renders 28/34, 36/44, 42/50 at 375, 768, 1440, and FR wraps
  to 2 lines at 1280–1600 (3 lines at 48 px today), 3 lines at 1025.

### The eyebrow (rev 3 definition, unchanged)
The short lead-in line above a title (e.g. `LeadMagnetSection` over-title), not `.badge`. Mixin + class added to
`typography.scss`, **unused until 5e**:

| Property | Phone ≤ 600 | Tablet 601–1024 | Desktop |
|---|---|---|---|
| Size / line-height | 14 / 20 px | 15 / 22 px | 16 / 24 px |
| Weight | 600 | 600 | 600 |
| Letter-spacing | 0.01em | 0.01em | 0.01em |
| Case | sentence | same | same |
| Colour on light | `$primary-color-dark` #371b97 (11.89:1 on white) | same | same |
| Colour on dark | `$white` via `.typo-eyebrow--on-dark` | same | same |
| Space to the title below | 8 px | 8 px | 12 px |

```scss
@mixin eyebrow {
  font-size: 14px; line-height: 20px; font-weight: map-get($font-weights, bold); letter-spacing: .01em;
  color: $primary-color-dark; margin: 0 0 8px;
  @include media-tablet-up { font-size: 15px; line-height: 22px; }
  @include media-desktop-up { font-size: 16px; line-height: 24px; margin-bottom: 12px; }
}
.typo-eyebrow { @include eyebrow; }
.typo-eyebrow--on-dark { color: $white; }
```
- `typography.scss` must import `mixins` for `media-tablet-up` / `media-desktop-up` if it doesn't already; otherwise
  write the two `@media (min-width: $breakpoint-…)` rules directly. The Dev checks which compiles without a circular
  import (`mixins.scss` imports `variables`, not `typography`).
- **Note for 5e:** LeadMagnetSection's over-title uses `.typo-eyebrow` when rebuilt. No LeadMagnetSection change here.

**AC:**
- [ ] Computed styles at 375 / 768 / 1440 match the hierarchy table above (home `/`, `/services`, `/privacy-policy`).
- [ ] `grep -rn "5xl" src` shows only the token maps and the `.typo-5xl-*` classes; desktop 5xl = 42/50.
- [ ] No `font-weight: 700` / `800` left in the touched SCSS; computed weights are only 400 / 600 / 900.
- [ ] Form controls compute to 16 px at 375 / 768 / 1440 (`/contact`).
- [ ] `.typo-eyebrow` exists in the compiled CSS and is used by no element (`document.querySelectorAll('.typo-eyebrow').length === 0` on all 8 routes).

## B4 — Spacing / vertical rhythm — **DECIDED: option a**
- **Measured (rev 1, `detail.json`, EN, px at 375 / 768 / 1440):** the baseline is **30 / 30 / 60** on most joins.
- **Decision (B4-a):** fix the helper bugs and normalize these outliers to **30 / 30 / 60** with existing helpers:

| Join | Today (375 / 768 / 1440) | Target |
|---|---|---|
| Services intro → list | 15 / 17 / 32 | 30 / 30 / 60 |
| Packages intro → cards | 15 / 15 / 30 | 30 / 30 / 60 |
| Home About → featured | 50 / 54 / 90 | 30 / 30 / 60 |
| Home testimonials → final CTA; `/projects` → final CTA | 40 / 40 / 109 | 30 / 30 / 60 |
| Header → case-page title | 10 / 10 / 15 | 30 / 30 / 60 |
| Privacy → footer | 80 / 80 / 145 | 30 / 30 / 60 |

- **Bugs:** `helpers.scss` defines `.mt-sm-responsive` / `.mb-sm-responsive` twice (lines 174/180 vs 250/258) → keep
  one definition (the one whose values match the 30/30/60 rhythm; the Dev records which). `ProjectDetail` uses
  `pb-md` and `mt-sm`, which don't exist → replace with existing helpers (class names only).
- **AC:**
  - [ ] Each join above measures its target ±2 px at 375 / 768 / 1440, en/fr/es (same method as `detail.json`).
  - [ ] Other joins are unchanged versus `master` ±2 px.
  - [ ] `grep -n "mt-sm-responsive\|mb-sm-responsive" src/styles/helpers.scss` shows one definition each.

## B5 — Home hero layout — **DECIDED: option c + above the fold (Mauricio, 2026-11-11)**
**Decision (Q-B5-ref = (i), plus one requirement):**
- Keep Mauricio's sizes: home H1 42 px at desktop, illustration 500 px at ≥ 1400, `bottom: -64px`.
- **New requirement:** the **home** hero fills the first viewport ("above the fold"). Its `min-height` = the viewport
  height − the header − the hero's outer margins, in `svh` (no `100vh`, the same reason as the booking modal).
  The whole hero is visible on load without scrolling, and the illustration stays anchored at the hero's bottom.
- **Zero overlap is the hard rule and wins over "fits the fold".** When the content doesn't fit (short viewports,
  long FR/ES titles), the content drives the height and the hero runs past the fold.
- A cap stops the hero from growing without limit on very tall viewports.
- Inner-page heroes are unchanged.

**Evidence folder for B5, B1, B6, B10:** `~/Documents/projects/magneto/backups/design-round/b5-evidence/`
(copied by Mauricio from the session scratchpad). File names below are relative to it.

### Mauricio's reference (≥ 1400 px)
- Home H1 42 px; `.hero .hero-image` `max-width` / `max-height` 500 px; `bottom: -64px`.
- **Fact:** `Hero.scss:93` has `bottom: 15px` today; `-64px` is a value from Mauricio's DevTools session, kept as
  part of the reference.
- **Fact, the illustration** (`magneto-hero-phone-1.png`, 1000 × 1000 RGBA, served via `next/image`): alpha > 128
  starts at **15.5%** from the top (the halo above it is fainter glow, from 12.7%). The bottom 5.5% is transparent.

### Reference reproduced with today's fixed height (`ref1400.css`, `ref.json`, `shots_ref/`)
| Width | Hero box | CTA ring bottom | First art row under the CTA | `ctaClear` | Art cropped by the hero |
|---|---:|---:|---:|---:|---:|
| 1400 / 1440 (en/fr/es) | 600 | 361 | 293 | **−68** (CTA covers the phone's top) | 50 px |
| 1600 | 650 | 361 | 343 | **−18** | 50 px |

With today's fixed height (600 / 650 px), the reference overlaps (`shots_ref/fr_1440.png`). Mauricio chose (i):
keep the sizes and let the hero grow. The design below does that, and the fold rule usually gives it more room
than it needs anyway (1440 × 900: 819 px).

### Today (`before.json`, viewport height 900)
| | 375 | 600 | 768 | 1024 | 1025 | 1440 |
|---|---|---|---|---|---|---|
| Hero height | 480 | 525 | 525 | 570 | 570 | 600 |
| EN `ctaClear` (α > 16) | −124 | −3 | −45 | −21 | −128 | −52 |
| FR | −124 | −27 | −45 | −21 | −128 | −115 (subtitle on art) |
| ES | −140 (2-line CTA; subtitle on art) | −27 | −71 | −21 | −128 | −52 |

### Header and outer margins (measured, `geo.cjs`)
| Band | Header height = hero top | Hero side margin | Bottom gap G (chosen) |
|---|---:|---:|---:|
| ≤ 600 | 58 | 15 | 15 |
| 601–1023 | 45 | 15 | 15 |
| ≥ 1024 | 51 | 30–360 (centred, 1200 max) | 30 |

- The hero starts directly under the header (no gap). G is the visible space left under the hero's rounded bottom
  edge on load: the side margin at ≤ 1023, and 30 at ≥ 1024 (`pb-lg-responsive` is 30 / 60, too much for a fold).
- **Fact:** these heights are the `section.header` box today. They are literals in Hero.scss (below), so a header
  height change needs the same change here. The AC script checks it.

### Design
Three rules. Together they make overlap impossible and fill the fold when the content fits:
1. **Space reserved for the illustration (as rev 4).** Above 600 the illustration is absolutely positioned at the
   bottom of `.hero-content` (Mauricio's look: centred, cropped by the hero's bottom edge). `.hero-content` gets a
   `padding-bottom` R:

   `R = ceil(0.845 × S − B + 17)`
   - S = the illustration size, B = how far it sits below the hero's bottom edge.
   - 0.845 = 1 − 15.5% (the art's transparent top).
   - 17 = the CTA's 5 px ring + a 12 px gap.

   At ≤ 600 the illustration is **in flow** below the CTA.
2. **The fold.**
   `min-height: min(calc(100svh − header − G), 820px)`, with `box-sizing: border-box` so the hero's top padding is
   included.
   - `.hero-content` grows to fill the hero (`flex: 1 0 auto`), so the absolute illustration stays anchored at the
     hero's bottom.
   - At ≤ 600 the CTA wrapper takes `margin-bottom: auto`, so the free space goes between the CTA and the
     illustration, and the illustration sits at the bottom.
3. **Content wins.** The hero has `height: auto` and **no `max-height`**. If title + subtitle + CTA + R is taller
   than the `min-height`, the hero grows, and the overlap rule still holds. The 820 px cap applies to the
   `min-height` only, so it can never squeeze content.

**Why `svh`:**
- `svh` is the viewport height with the mobile browser toolbars shown: the smallest one, so the hero fits even when
  Safari's bars are visible.
- It does not change while scrolling, so there is no layout jump. `dvh` changes height as the toolbars hide.
- Browsers without `svh` support (Safari < 15.4, Chrome < 108) drop the declaration and fall back to the
  content-driven height. No `100vh` fallback.

**Cap = 820 px** (≥ 1024 and all bands).
- It is the hero height at Mauricio's reference viewport (1440 × 900: 900 − 51 − 30 = 819).
- On taller viewports the hero keeps the 1440 × 900 composition: CTA → art gap about 150 px, instead of growing
  empty space.
- Evidence:

| Viewport | Without a cap (`fold-nocap.json`, `shots_fold/`) | **Cap 820** (`fold-cap820.json`, `shots_fold820/`) |
|---|---|---|
| 1440 × 1200 | hero 1119 px, CTA → art gap **449 px** (the art floats at the bottom of a mostly empty box: `shots_fold/en_1440x1200.png`) | hero **820**, gap **150**, bottom at 871 (in the fold): `shots_fold820/en_1440x1200.png` |
| 1920 × 1080 | hero 999, gap 329 | hero **820**, gap 150: `shots_fold820/en_1920x1080.png` |
| 768 × 1024 | hero 964, gap 403 | hero **820**, gap 259 (FR 3-line H1 shown in `shots_fold820/fr_768x1024.png`) |
| 390 × 844 | 771, gap 196–222 | 771 (under the cap), gap 196–222 |

**Bands** (S, B and R as rev 4; the B / S = 0.128 proportion of the reference):

| Band | S (max-width / max-height) | B (`bottom`) | R (`.hero-content` `padding-bottom`) | Hero `padding-top` (unchanged) | header / G |
|---|---:|---:|---:|---:|---|
| ≤ 600 | 260 (today 240), **in flow** | `margin: -24px auto -33px` | 0 | 30 | 58 / 15 |
| 601–1023 | 340 (today 270) | −44 | **261** | 45 | 45 / 15 |
| 1024–1399 | 420 (today 330 / 350) | −54 | **318** | 60 | 51 / 30 |
| ≥ 1400 (reference) | **500** | **−64** | **376** | 60 | 51 / 30 |

- ≤ 600, in flow:
  - `margin-top: -24px` tucks only the transparent/glow top under the CTA ring. The CTA wrapper is z-index 2 and the
    image 1; both are flex items, so z-index applies.
  - `margin-bottom: -33px` (0.128 × 260) crops it like the desktop look.
- The 1600 steps (`Hero.scss:73-75`, `117-120`) are removed for the home hero: ≥ 1400 is one band.
- Inner heroes (`hero-about`, `-services`, …) are **not** changed by B5. Every new rule is scoped to
  `.hero.hero-home`; only the B3 line-height fix applies to inner heroes.

```scss
// Hero.scss — sketch for the Dev (values from the tables; names from the file)
.hero.hero-home {
  // Above the fold (Mauricio 2026-11-11): fill the first viewport, capped; content still wins (no max-height).
  // svh, not vh/dvh: stable with mobile toolbars shown. Header heights are the measured .header box per band.
  --hero-fold-offset: #{58px + 15px};             // header + bottom gap, ≤ 600
  box-sizing: border-box;
  height: auto;                                   // was calc(100vh) + max-height steps
  min-height: min(calc(100svh - var(--hero-fold-offset)), 820px);
  .hero-content { flex: 1 0 auto; height: auto; padding-bottom: 0; }
  .hero-cta-wrapper { margin-bottom: auto; }       // ≤ 600: free space goes above the illustration
  .hero-image {                                   // ≤ 600: in flow under the CTA
    position: static; transform: none;
    max-width: 260px; max-height: 260px;
    margin: -24px auto -33px;
  }
  @media (min-width: $breakpoint-tablet) {        // 601–1023
    --hero-fold-offset: #{45px + 15px};
    .hero-content { padding-bottom: 261px; }
    .hero-cta-wrapper { margin-bottom: 0; }
    .hero-image { position: absolute; left: 50%; transform: translateX(-50%); margin: 0;
                  bottom: -44px; max-width: 340px; max-height: 340px; }
  }
  @media (min-width: $breakpoint-desktop) {       // 1024–1399
    --hero-fold-offset: #{51px + 30px};
    .hero-content { padding-bottom: 318px; }
    .hero-image { bottom: -54px; max-width: 420px; max-height: 420px; }
  }
  @media (min-width: $breakpoint-desktop-lg) {    // ≥ 1400 (Mauricio's reference)
    .hero-content { padding-bottom: 376px; }
    .hero-image { bottom: -64px; max-width: 500px; max-height: 500px; }
  }
}
```
- Keep the existing `padding` steps of `.hero.hero-home`. They currently use `min-width: $breakpoint-phone` (600);
  the B5 bands use 601 (`$breakpoint-tablet`). At exactly 600 px the hero padding is the tablet one and the image is
  in flow. That was measured and is fine (rev 4 `600` rows).
- `Hero/index.tsx` needs **no change**: the image is already the last child of `.hero-content`, after the CTA.
- `grep -n "100vh" src/components/organisms/Hero/Hero.scss` must return 0 after the change.

### Prototype result — fold + cap 820 (`proto.css` + `fold.css` + `cap820.css`; `fold.cjs` → `fold-cap820.json`)
All values are in px; "in fold" = hero bottom ≤ viewport height on load. `ctaClear` uses α > 128 with the ring
included (≥ 0 = no overlap). The subtitle-vs-art value is ≤ −96 everywhere (clear).

| Viewport | EN: hero top–bottom · in fold · ctaClear | FR | ES |
|---|---|---|---|
| **1440 × 900** | 51–870 · **yes** · +144 | 51–870 · **yes** · +144 | 51–870 · **yes** · +144 |
| **1280 × 720** | 51–690 · **yes** · +22 | 51–690 · **yes** · +22 | 51–690 · **yes** · +22 |
| **768 × 1024** | 45–865 · **yes** · +254 | 45–865 · **yes** · +254 (3-line H1) | 45–865 · **yes** · +224 |
| **375 × 667** | 58–658 · **yes** · +20 (content-driven, 5-line H1) | 58–658 · **yes** · +20 | 58–666 · **yes** · +20 (2-line CTA) |
| **390 × 844** | 58–829 · **yes** · +217 | 58–829 · **yes** · +191 | 58–829 · **yes** · +209 |
| 1440 × 1200 (cap) | 51–871 · yes · +145 | same | same |
| 1920 × 1080 (cap) | 51–871 · yes · +145 | same | same |
| 1024 × 768 | 51–738 · yes · +92 | same | same |
| 1366 × 768 | 51–738 · yes · +70 | same | same |
| 1536 × 864 | 51–834 · yes · +108 | same | same |
| 360 × 640 | 58–658 · **no, 18 below** · +20 | 58–718 · **no, 78 below** (6-line H1) | 58–700 · **no, 60 below** |
| 320 × 568 | **no, 90 below** | **no, 200 below** (7-line H1) | **no, 158 below** |

- **Every viewport Mauricio named fits above the fold in all three locales, with zero overlap.**
- Small phones (360 × 640, 320 × 568) do not fit: the content is taller than the screen, so content wins, as
  decided. The overlap rule still holds there.
- 375 × 667 fits with 1–9 px to spare, because the content (600–608) is already taller than the fold minimum (594).
- Horizontal scroll: none (`scrollWidth` = viewport width in every run).
- **Height versus today (EN):** 1440 × 900 600 → 819; 1280 × 720 570 → 639; 768 × 1024 525 → 820;
  375 × 667 480 → 600.
- The rev 4 content-only prototype (`proto.json`, `shots_proto/`) remains valid as the "content wins" floor: the hero
  is never shorter than those heights.

**Assumption (emulation vs a real phone):** in Playwright the viewport height equals `svh`. On a real iPhone, `svh`
is the height with Safari's toolbars shown, which is smaller than the screen. Example: an iPhone SE / 8
(375 × 667 screen) shows about 550 px. There the content (600 px) is taller than the fold, so the hero bottom will be
just below the fold. That is correct under "content wins". Mauricio's preview review on a real phone (PR 2 → PR 3)
is the check.

**AC (B5):**
- [ ] **Zero overlap:** `/`, `/fr`, `/es` × 375, 768, 1024, 1440 (also 601, 1025, 1400 as edges), viewport heights
  667 and 900, plus the five fold viewports below: `ctaClear ≥ 0` and subtitle-vs-art ≤ 0 (rev 4 script, α > 128,
  ring included).
- [ ] **Above the fold:** report the hero top, the hero bottom and the viewport height, and whether
  bottom ≤ viewport height. Per locale (en/fr/es), at **1440 × 900, 1280 × 720, 768 × 1024, 375 × 667 and
  390 × 844**. Expected: all "yes" (as the prototype). A "no" is acceptable only when the content-only height
  (`min-height: 0`) is itself taller than the viewport; the report shows that number.
- [ ] **Cap:** at 1440 × 1200 and 1920 × 1080 the hero is 820 px (±1). Screenshots go in the report.
- [ ] **Anchoring:** the art's last visible row is within 0–60 px of the hero bottom at every measured viewport
  (cropped by design: 21 / 34 / 42 / 50 per band).
- [ ] `Hero.scss` has no `100vh` / `dvh` for the home hero; `min-height` uses `svh`.
- [ ] The illustration's box never extends past the hero's left/right edges; no horizontal scroll.
- [ ] Inner heroes (`/services`, `/packages`, `/projects`, `/about-magneto`, `/contact`): height and layout unchanged
  versus `master`, except the B3 line-height fix and the B1 button padding.
- [ ] Mauricio's look at 1440: illustration 500 px, `bottom` −64 px, H1 42 px (computed styles).

## B6 — Services outline buttons — **DECIDED (changed): match the secondary button**
**The real class** ("Tell me about your project", white background, purple text and 2 px purple border):
`.btn.btn-secondary` (`button.scss:58-76`, on top of `.btn` `:18-37`). It renders in two places:

| Where | Classes | Size at 375 / 768 / 1440 | Text |
|---|---|---|---|
| About page CTA (`about-magneto/page.tsx:80`) | `btn btn-secondary` | 215×**50** / 215×**52** / 240×**54** | 600, sentence case |
| Services final CTA, secondary (`FinalCTASection/index.tsx:54`) | `btn btn-secondary typo-uppercase typo-extrabold` (+ the final-CTA 5 px ring) | 249×50 / 249×52 / 280×54 | 900, uppercase |

**Fact:** `.service-cta` is **already** `btn btn-secondary service-cta` (`services/ServicesList.tsx:35`), with the
same colours and border. The only difference is `Services.scss:123`: `min-height: 44px` on an `<a>`, which is
`content-box`. So 44 + 30 padding + 4 border = **78 px** at every width (`btn.cjs`, en and es).

**Change:**
- `Services.scss:123`: `.service-cta { align-self: flex-start; }`, removing `min-height: 44px`.
- Result: **50 / 52 / 54 px**, the same as the About "Tell me about your project" button. Fixed by the `.btn`
  padding + line height, and always ≥ 44 px (target size).
- `Services.scss:124` (`:focus-visible` outline) stays.
- **Decided (Q-B6, Mauricio 2026-11-11):** the About variant. The text stays 600, sentence case ("See BUILD
  pricing" keeps its emphasis), reusing the existing `.btn.btn-secondary` CSS. No `ServicesList.tsx` change.

**`docs/BUTTON_SYSTEM.md` rewrite** (replace the whole file; facts from `button.scss` and the grep below):
```
grep -rn "\.btn\b\|\.btn-\|\.btn:" src --include=*.scss
grep -rn "btn-secondary\|btn-outline\|btn-medium\|btn-sm\b\|btn-small\|btn-large\|service-cta" src --include=*.tsx
```
Required content:
1. **Files:** `src/styles/components/button.scss`, imported once by `src/main.scss:29`. It also styles every `a`
   (black, hover `$primary-color`, `transition: color 0.2s`).
2. **Base `.btn`:**
   - `font-style(sm, bold, sm)`, i.e. 12/16 px phone, 12/18 tablet, 14/20 desktop, weight 600;
   - `inline-flex`, centred, `gap` 10, `padding: 15px 30px`, radius 10;
   - `transition: all 0.2s` (it also animates padding; note this for measurements).
   - `box-sizing` is the UA default: `content-box` on `<a>`, `border-box` on `<button>`. That is why an `<a>`
     secondary is 4 px taller than a `<button>` secondary (50 vs 46 at 375).
3. **Variants:**
   - `.btn-primary`: `$primary-color` background, white text; hover / active black.
   - `.btn-secondary`: white background, `$primary-color` text, 2 px border; hover / active black with a black
     border.
4. **Sizes:**
   - `.btn-small` (`padding: 6px 10px`, header);
   - `.btn-large` (defined, **0 uses**).
5. **CTA style = classes, not a CTA class:** `btn btn-primary|btn-secondary typo-uppercase typo-extrabold` (hero,
   final CTA). The 5 px translucent ring comes from context (`.hero-cta-wrapper .btn`, `.final-cta-section .btn`).
   B1 phone padding: 15 px inline in those two contexts at ≤ 600.
6. **Context rules:**
   - `.hero-secondary .btn:focus-visible` (white outline);
   - `.package-card__cta` (stretch + purple focus);
   - `.service-cta` (start-aligned, purple focus);
   - `.header … .btn` (`min-height: 44px`, max-width);
   - `.form-error__cta.btn` (inline link-button inside the error text);
   - `.contact-form-submit`;
   - `.final-cta-section .btn` (z-index + ring).
7. **Classes used in markup but with no CSS (no effect):**
   - `.btn-medium` (`PackageCard`, 6×);
   - `.btn-sm` (`Header`);
   - `.btn-outline` (`EmailCollectorProvider:331`).
   - `.btn-disabled` is styled only in the dead `CalendlyButton.scss`.

   They are listed as debt, **not removed in PR 2** (their files are out of scope).
8. **Removed / never existed:** `.cta`, `.cta-mobile` (the old doc listed them; they are not in the code).
   `.btn-secondary` **exists** (the old doc said it was removed).
9. **Usage table:** one row per component, with its classes, from the grep above.
10. Keep the "Adding new button styles" rule (check existing classes first; update this doc in the same PR).

**AC (B6):**
- [ ] `/services` × en/fr/es × 375 / 768 / 1440: every `.service-cta` is 50 / 52 / 54 px tall (±1). Its computed
  background, colour, border, font size and weight equal the About "Tell me about your project" button at the same
  width.
- [ ] `docs/BUTTON_SYSTEM.md` names no class that is absent from `src`, except in its "removed / never existed"
  section. Every class it lists as styled has a rule in the SCSS (spot-check: the grep above).

## B7 — Privacy measure at 768 — **DECIDED: option a**
- **Measured:** 79–80 characters per line at 768 (640 px column, 16 px), 75 at 1440, 40–41 at 375.
- **Change:** `privacy.scss`: `max-width: 35rem` on the text column at 601–1023 px (about 70 characters).
- **AC:** [ ] `/privacy-policy` × en/fr/es at 768: average full-line length 66–72 characters; 375 and 1440 unchanged.

## B8 — Real length limits (D-10) → `scripts/qa-i18n/config/length-limits.json` — **DECIDED (B1-A + B5-c)**
| Type | Placeholder | **Set** | Basis |
|---|---:|---:|---|
| `cta-label` | 32 | **38** | B1-A: text width 285 px at 375 (hero 315 − 30; final CTA 345 − 30 container − 30 button). 285 ÷ 7.3 px per uppercase character = 39 → 38 |
| move `common.bookStrategyCall` from `button` → `cta-label` (`select.dictionary`) | — | **yes** | It renders as the uppercase CTA. EN 25 > `button` 24 |
| `button` | 24 | **26** | FR `header.scheduleCall` (25) fits at 375 |
| `hero-title` | 70 | **100** | **Re-checked at 42 px:** FR (96) is 2 lines at 1280–1600 and 3 at 1025, ES (75) and EN (73) are 2 lines. With B5-c the hero grows with the title, so length can no longer cause overlap. 100 is an editorial cap: ≤ 3 lines at ≥ 1025 |
| `ratioWarnAbove` | 1.3 | **1.35** | FR/EN hero title 96/73 = 1.32 |

Then `"status": "set"`, `"statusNote"` removed or updated, `"set": { "by": "Mauricio", "on": "2026-11-11" }`.

- **Expected effect, not a failure:** with `status: "set"`, over-limit FR/ES units become **warnings** (not errors;
  `checks.test.ts:152-157`). The default `--fail-on error` keeps the exit code 0 (`qa-i18n.ts:68,168-170`). ES
  `common.bookStrategyCall` (43) > 38 will warn. That warning is the signal for the 5c-rest ES copy change (B1).
- **AC:**
  - [ ] `npm test -- --run scripts/qa-i18n` passes.
  - [ ] `npx tsx scripts/qa-i18n/qa-i18n.ts --out <tmp>` (deterministic, **no `--llm`**) exits 0. Its length
    findings are listed in the report (at least ES `common.bookStrategyCall`).

## B9 — Icons / Lucide — **DECIDED: no new dependency**
No change. An ADR would be needed only if icons ever become a dependency or a CMS data-model change.

## B10 — Final-CTA background: one download, right size (from PR 1b I-1) — **added in rev 4**
**Cause** (`WpResponsiveImage/index.tsx:317-336`, `FinalCTASection/index.tsx:61-70`):
- `fill` + a `className` makes `WpResponsiveImage` drop `fill` and render a sized `next/image` with **no `sizes`**.
  So the srcset is 1× / 2× of the intrinsic width.
- Its width comes from `useDevice()` / `devicePixelRatio`, which differ between SSR and the client. So the image
  re-renders after hydration with a different URL: **two downloads**.
- `priority` adds a preload for an image that is below the fold.

**Before** (cold cache, `fcta.cjs` → `fcta-before.json`; DPR 2 at 375/768, DPR 1 at 1440; scrolled to the final
CTA; bytes = encoded body). Every request is `hero-background.png` at q90:

| Width | Route | Hero bg | Final-CTA bg | Final-CTA extra bytes |
|---|---|---|---|---:|
| 375 | `/`, `/about-magneto`, `/es/about-magneto` | w=750 (8,008) | w=**3840** (54,060) + w=1080 (21,246) | **75,306** |
| 375 | `/projects/fashion-company-ecommerce` | — | w=3840 (54,060) + w=1080 (21,246) | **75,306** |
| 768 | `/`, `/about-magneto`, `/es/about-magneto` | w=1920 (54,060) | w=1920 (shared) + w=**3840** (54,060) | **54,060** |
| 768 | case page | — | w=3840 + w=1920 | **108,120** |
| 1440 | hero routes | w=1200 (27,650) | w=1200 (shared) | 0 |
| 1440 | case page | — | w=1200 | 27,650 |

- Rendered box: 345 × 242–320 at 375, 738 × 286–320 at 768, 1200 × 270–310 at 1440. Today the image is drawn at
  its intrinsic size (540 × 360 / 768 × 512 / 1200 × 800), centred by the flex wrapper.

**Change** (`FinalCTASection/index.tsx` + `FinalCTASection.scss`):
- Render the background like the hero background (PR 1b A4): `next/image` directly, not `WpResponsiveImage`, with:
  - `src` = `bgimage.node.sourceUrl` (the original, as the hero does);
  - `fill`, `sizes="(max-width: 1240px) 100vw, 1200px"` (**the hero's exact string**, so both resolve to the same
    URL and the browser reuses the hero's file);
  - `quality={90}`, `alt=""`, `className="final-cta-section__bg-image"`;
  - **no `priority`** (it is below the fold; the default lazy loading applies).
- If `sourceUrl` is missing, fall back to the widest `mediaDetails.sizes[].sourceUrl`. If neither exists, render no
  background (today's `hasBg` logic).
- Type the node read from `FinalCTASection/types.ts`. This removes the `as any` at `index.tsx:62` (−1 lint error);
  no new `any`.
- `FinalCTASection.scss` `&__bg-image`: replace `width: auto; height: auto` with
  `object-fit: cover; object-position: center;`.
- `WpResponsiveImage` itself is **not** changed (13 other callers).

**Expected after** (to be measured by the Dev with the same script):
- Hero routes: **0 extra bytes** at 375 / 768 / 1440. The final CTA reuses the hero's URL (w=750 / w=1920 /
  w=1200).
- Case pages: one request (375 ≈ w=750, about 8 KB; 768 w=1920, 54 KB; 1440 w=1200, 27.6 KB).
- That is −75 KB per page at 375, and −54 KB per page at 768.
- **Visible change:** at 375 the gradient is scaled to cover the box (423 × 282 instead of 540 × 360), so slightly
  less zoomed. At 768 / 1440 it is about the same (cover = 738 × 492 vs 768 × 512; 1200 × 800 identical).

**AC (B10):**
- [ ] Cold-cache table before/after in the report, same method: per route × 375 / 768 / 1440, the final-CTA
  background requests (w, q, bytes) and the page total. Routes: `/`, `/about-magneto`, `/es/about-magneto`,
  `/projects/fashion-company-ecommerce`.
- [ ] Exactly **one** `hero-background.png` URL per page per width. On hero routes, the final CTA's `currentSrc` equals
  the hero's.
- [ ] The final-CTA `<img>` has `sizes="(max-width: 1240px) 100vw, 1200px"`, `q=90`, `alt=""`, no
  `fetchpriority="high"`, and no preload `<link>` for it.
- [ ] EN pixel diff limited to the final-CTA background area at 375 (and ≤ faint gradient pixels at 768 / 1440).

---

## PR 2 — files the Dev may touch
| Item | Files |
|---|---|
| B1 | `src/components/organisms/Hero/Hero.scss`, `src/components/organisms/FinalCTASection/FinalCTASection.scss` |
| B2 | `src/components/organisms/PackagesGrid/PackagesGrid.scss` |
| B3 | `src/styles/typography.scss` (phone/tablet tokens, **desktop `5xl` 42/50**, eyebrow mixin/class; **not** `.badge`), `src/styles/variables.scss` (weights only), `src/components/organisms/Hero/Hero.scss` (line-height overrides removed), `src/styles/components/form-field.scss`, `src/styles/components/contact-form.scss`, `src/styles/pages/privacy.scss` (weight), `src/components/organisms/PackagesContentSections/PackagesContentSections.scss` (weight). **Not** `LeadMagnetSection/*` (5e). |
| B4 | `src/styles/helpers.scss`, `src/components/organisms/ProjectDetail/index.tsx` (class names only), `src/app/[locale]/services/Services.scss`, `src/app/[locale]/packages/Packages.scss`, `src/styles/pages/home.scss`, `src/styles/pages/privacy.scss` |
| B5 | `src/components/organisms/Hero/Hero.scss` (no `Hero/index.tsx` change needed) |
| B6 | `src/app/[locale]/services/Services.scss` (`.service-cta` `min-height` removed), `docs/BUTTON_SYSTEM.md` (rewrite) |
| B7 | `src/styles/pages/privacy.scss` |
| B8 | `scripts/qa-i18n/config/length-limits.json` |
| B9 | none |
| B10 | `src/components/organisms/FinalCTASection/index.tsx`, `src/components/organisms/FinalCTASection/types.ts` (node type only), `src/components/organisms/FinalCTASection/FinalCTASection.scss` |
| Report | `docs/reports/design-round-2.md` |

- **Not touched:** `button.scss` (B1 is context-scoped), `WpResponsiveImage/*`, `Hero/index.tsx`, `ServicesList.tsx`
  (Q-B6 closed: no change), `PackageCard`, `Header`, `EmailCollectorProvider` (the no-CSS classes
  stay as recorded debt), `CalendlyButton.scss`, dictionaries, CMS.
- **Commits** (proposed by the Dev, made by Mauricio), one per item, in this order (later items measure on top of
  earlier ones):
  1. `style(packages): B2 …`
  2. `style(type): B3 …`
  3. `style(hero): B5 …`
  4. `style(cta): B1 …`
  5. `style(layout): B4 …`
  6. `style(services): B6 …` + `docs(buttons): …`
  7. `style(privacy): B7 …`
  8. `perf(images): B10 …`
  9. `chore(qa-i18n): B8 …`

## PR 3 — follow-up after Mauricio's visual review
- After PR 2's Vercel preview is green, **Mauricio reviews it manually** (all 8 routes, en/fr/es, phone + desktop).
- Small fixes from that review go to **PR 3**. "Small" means:
  - value tweaks (sizes, spacing, R/S/B, breakpoints) in the **same files and items** as PR 2;
  - no new item, no copy change, no component API change.
- PR 3 is described by a short addendum to this spec (rev 4.x), with Mauricio's list. Anything bigger becomes its
  own spec.
- PR 3 re-runs the same AC for the items it touches, and the global AC.

---

## Decision table
| # | Item | Status | Decision |
|---|---|---|---|
| D-A1a | Skip-link copy | **Done (PR 1b)** | EN/FR/ES as in A1 |
| A7 / D-A7 | Header `<nav>`, label | **Done (PR 1b)** | "Main" / "Principal" / "Principal" |
| D-A3 / A8 / A4 / A5 | alt, contrast, q90, captions | **Done (PR 1b)** | — |
| D-A6 | Calendly | **Done (PR 1a)** | A6-alt |
| D-A6c | Patch Calendly's popup DOM | Declined | — |
| B1 | CTA wrap | **Decided 2026-11-11** | A + `text-wrap: balance`; ES label → 5c-rest |
| B2 | Packages tablet | **Decided 2026-11-10** | 1 column, centred, `clamp(30rem, 66vw, 33rem)` |
| B3 | Type scale + eyebrow | **Decided 2026-11-11** | b + home H1 42/50 desktop via the `5xl` token (Q-B3 closed: token) |
| B3-eyebrow use | Where the eyebrow applies | **Decided** | none until 5e (class added, unused) |
| B4 | Rhythm | **Decided 2026-11-11** | a |
| B5 | Home hero | **Decided 2026-11-11** | c, Mauricio's ≥ 1400 reference (Q-B5-ref closed: (i)); reserved space; above the fold `min(100svh − header − gap, 820px)`; content wins |
| B6 | Services button | **Decided 2026-11-11 (changed)** | About `.btn.btn-secondary` look (sentence case, 600), `min-height` removed (50–54 px); BUTTON_SYSTEM rewrite (Q-B6 closed) |
| B7 | Privacy 768 | **Decided 2026-11-11** | 35rem at 601–1023 |
| B8 | Length limits | **Decided 2026-11-11** | 38 / 26 / 100 / 1.35, set by Mauricio |
| B9 | Lucide | **Decided 2026-11-11** | no new dependency |
| B10 | Final-CTA bg sizes | **Added rev 4** | `next/image` `fill` + the hero's `sizes`, no `priority` |

## Assumptions and open questions
- **Closed 2026-11-11 (Mauricio):**
  - Q-B5-ref → (i) + above the fold (B5);
  - Q-B6 → the About variant (B6);
  - Q-B3 → the token (B3).

  No Part B question is open.
- **Assumption (B5):** the header heights (58 / 45 / 51) stay as measured. They are literals in the fold offset; if
  the header changes, the offset changes with it (the fold AC catches a mismatch).
- **Assumption (B5):** on real phones `svh` is smaller than the emulated viewport (Safari toolbars). On 375 × 667-class
  iPhones the hero will end just below the fold, because the content is taller than about 550 px. That follows
  "content wins"; Mauricio's real-phone preview review confirms.
- **Assumption (B5):** alpha > 128 is the visible edge of the illustration. The fainter halo above it (from 12.7%)
  may sit behind the CTA ring. If Mauricio wants the halo clear too, R grows by about 0.028 × S (14 px at 500).
- **Assumption (B5):** the CMS illustration stays `magneto-hero-phone-1.png` (or the same framing). A new image with
  different transparent margins needs the 0.845 / 0.128 factors re-measured (PR 3 or the image change's own spec).
- **Assumption (B10):** the final-CTA and hero backgrounds are the same file in every locale (true today:
  `2025/08/hero-background.png` on every route measured). If a page sets a different final-CTA image, it simply gets
  its own single download.
- **Assumption (A6, carried):** `calendly.event_scheduled` arrives from the iframe on the same `message` channel as
  the observed `calendly.event_type_viewed`. Nothing consumes it today.
- **Note for 5e:** the LeadMagnetSection over-title uses the B3 eyebrow style when rebuilt.
- **Routed to 5c-rest:** a shorter ES "Agendar una llamada de orientación gratuita" (≤ 38 chars, dictionary + CMS);
  the EN legacy final-CTA label on `/fr` and `/es` home and projects; Trépied `[FR TEST]` / `[ES TEST]` and EN
  captions; hero illustration alt "Home" / "Inicio" from the CMS.
- **Recorded issues, not fixed:**
  - `CalendlyButton.scss` is never imported (dead CSS);
  - `trackCalendlyEvent` has no caller;
  - `.btn-medium`, `.btn-sm` and `.btn-outline` are used in markup but have no CSS;
  - `.btn-large` has CSS but no use;
  - PR 1b I-2 (logo and menu toggle outside a landmark) and I-3 (`services/api.ts:77` `icon.alt`) are still open.

## Out of scope
- Any CMS / ACF / WPML change. Any copy change (including the ES CTA label).
- New dependencies.
- `WpResponsiveImage` refactor. Removing the no-CSS button classes from markup.
- Restyling LeadMagnetSection (5e). Inner hero layouts beyond the B3 line-height fix and B1 padding.
- Tablet image resolution (Phase 8), `images.domains`, `heading-order`, the Header `next/link` (D1 debt).

## Acceptance criteria (PR 2)
- [ ] **Gate:**
  - lint ≤ **84 / 81** (−1 error expected from B10), with no message on changed lines;
  - `npm run typecheck` exits 0;
  - `npm test -- --run` passes (count recorded);
  - `ENABLED_LOCALES=en,fr,es npm run agent:build` exits 0, with prerendered project paths per locale recorded.
- [ ] **8 routes × en/fr/es × 375 / 768 / 1024 / 1440:** HTTP 200, **no horizontal scroll**. New captures go in
  `…/design-round/screenshots-after-2/`. Every measurement waits ≥ 600 ms after load or CSS change (`.btn`
  transition).
- [ ] **EN visual changes limited to:**
  - B1 (CTA buttons 30 px narrower at ≤ 600);
  - B2 (Packages at 601–1023);
  - B3 (phone/tablet type, form text, home H1 at desktop);
  - B4 (the listed joins);
  - B5 (home hero);
  - B6 (`.service-cta` height);
  - B7 (privacy at 601–1023);
  - B10 (final-CTA background crop at 375).

  The report lists every diff region and its owner item, as in the PR 1b report.
- [ ] **axe:** the same 48 runs. No rule/route pair worse than the PR 1b result. `color-contrast` stays 0
  (B6 secondary text `$primary-color` on white was already in use; B3 eyebrow is unused).
- [ ] **Item ACs:** B1, B2, B3, B4, B5, B6, B7, B8, B10 above.
- [ ] **Vercel preview:** the WORKFLOW release checks (routes 200, `/esto-no-existe` 404, a project page 200). Then
  **Mauricio's manual visual review** → PR 3 list (or "none").

## Risks
- **B5:** the home hero now fills the first screen (up to 820 px), so the next section starts below the fold on
  every device. This is intended (Mauricio, 2026-11-11). On short or narrow screens the content-driven height takes
  over (EN 375: 480 → 600 px).
- **B5:** the fold offset hard-codes the header height per band; a header redesign must update it.
- **B5:** the values depend on this illustration's transparent margins. A CMS image swap can bring the overlap back.
  The AC script catches it.
- **B3 tokens:** every EN phone page changes (taller). Only the home H1 changes at desktop.
- **B10:** lazy loading the final-CTA background on case pages means it can appear a moment after scrolling. It is a
  dark gradient under a black container background, so there is no flash of white.
- **B8:** new warnings in `qa-i18n` output. They are expected (ES CTA), and they are not errors.
- **Measurement trap:** `.btn` `transition: all` (recorded in BUTTON_SYSTEM and here).
- **CMS:** none.

## Estimate
| PR | Mauricio | Agent |
|---|---|---|
| PR 1a, PR 1b | done | done |
| **PR 2** (B1–B8, B10) | 45–60 min (review of the report and screenshots) **+ 30–45 min manual visual review on the Vercel preview, including one real phone** | **10.5–14 h**: B2 0.5; B3 2–2.5 (tokens, hero line-height, forms, weights, 42 px, eyebrow); B5 2–3 (CSS incl. the fold rule; overlap script at 7 widths × 3 locales × 2 heights; fold table at 5 viewports × 3 locales; cap screenshots at 1440 × 1200 / 1920 × 1080); B1 0.5; B4 1–1.5; B6 0.25 + BUTTON_SYSTEM 0.75–1; B7 0.25; B8 0.25–0.5; B10 1–1.25 (component + types + weight table); full sweep (8 routes × 3 locales × 4 widths), axe, pixel-diff attribution, report 2–2.5 |
| **PR 3** (if needed) | 15–30 min | 1–3 h, depending on Mauricio's list |

**Order:** PR 2 → Vercel preview → Mauricio's visual review → PR 3 (if any) → release runbook.

## Decisions needed (ADR?)
- **No ADR.** No new dependency, routing change or data-model change. B10 changes how one component renders its
  image, within the existing `next/image` pattern (the same one PR 1b used for the hero).
- **None open.** Q-B5-ref, Q-B6 and Q-B3 were answered on 2026-11-11. The `svh` unit is plain CSS, not a
  dependency.
