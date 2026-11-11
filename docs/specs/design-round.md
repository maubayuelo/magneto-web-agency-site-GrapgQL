# Design round — accessibility fixes (Part A) and visual decisions (Part B)

- Status:
  - **Part A: Approved (Mauricio, 2026-11-10).** Round 2 settled D-A6c (→ A6-alt) and D-A7, so no Part A decision is
    open. Part A ships as **PR 1a** (A6 only) and **PR 1b** (the rest).
  - **Part B: Draft — awaiting decisions (B2 decided).**
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-11-10 (rev 3, same day: round-2 decisions) · Base: `master` `afe5d12`
- Depends on: `docs/reports/phase-5c-loader.md` ("AC-8 findings (routed)", gallery gap measurements),
  `docs/reports/i18n-dictionary-fill.md` (F-1, F-2), `docs/reports/phase-5g-i18n-llm-qa.md` (D-10),
  `docs/reports/privacy-route.md` (I-2), `docs/specs/phase-5d-lite-contact-modal.md` (D-9, D-10),
  `docs/specs/phase-5f-analytics-consent.md` (rev 1.1, checked for Calendly dependencies)

## Revision log
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
- **PR 1a (A6, blocking).** Booking opens in our own modal on every device. The modal can be closed on iPhone with a
  44×44 control, and it has notch-safe sizing, scroll lock, Escape and focus return. No Calendly script is loaded.
- **PR 1b (rest of Part A):**
  - A1: one `<main>` + a skip link;
  - A7: a header `<nav>`;
  - A2: logo alt "Magneto";
  - A3: decorative images `alt=""`;
  - A8: AA contrast on case lists;
  - A4: the optimized hero/final-CTA background;
  - A5: no empty gallery captions.
- **PR 2 (Part B).** The B2 layout (decided), then the other B items once Mauricio decides after the Senior Architect's
  review. `length-limits.json` gets set at that point.

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

### axe baseline (`axe-baseline.json`; 48 runs = 8 routes × 3 locales × 375/1440)
| Rule | Impact | Pages | Nodes | Where / owner |
|---|---|---:|---:|---|
| `landmark-one-main` | moderate | 48 | 48 | no `<main>` → A1 |
| `region` | moderate | 48 | 530 | content outside landmarks; the header has no `<nav>` → A1 + A7 |
| `color-contrast` | **serious** | 6 | 84 | case page: `.project-detail__list li` `$gray-80` #787878 = **4.42:1** (14 nodes per run) → A8 |
| `heading-order` | moderate | 6 | 6 | `/projects` and home grid `h3` after `h1` (not in scope) |
| `empty-heading` | minor | 4 | 4 | FR/ES home: empty 3rd `service-card` `h3` (content, 5c-rest) |

"No new violations" in the AC means: compared with this table, rule by rule and route by route.

---

# PART A — Approved (Mauricio, 2026-11-10)

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
- [ ] **Code:** `grep -rn "assets.calendly.com\|widget.js\|widget.css\|window.Calendly\|initPopupWidget\|loadCalendlyScript\|warmCalendlyResources\|useCalendly" src`
  returns 0, or only removal-proof lines inside tests.
- [ ] **Unit (`calendly.test.ts`, jsdom),** rewritten without `window.Calendly` mocks. The URL assertions move from
  `initPopupWidget` calls to the iframe `src`:
  - the a1–a3 / utm / single-event / `forceNewWindow` cases are kept;
  - no `<script>` / `<link>` for Calendly is added to `<head>`;
  - the close button sits in the toolbar before the iframe, with `aria-label` per locale;
  - Escape and the backdrop close the modal, and focus is restored;
  - `body` is `position: fixed` while open and restored after close, with the scroll position kept;
  - no inline `100vh`; `embed_domain` is present.
- [ ] **Unit (`scroll-lock.test.ts`):** lock/unlock restores the inline styles and the scroll position.
- [ ] **Unit (`CalendlyButton.test.tsx`):** the existing click / collector / `forceNewWindow` / disabled cases still
  pass, with the `warmCalendlyResources` mock removed.
- [ ] **Local Playwright, Chromium and WebKit; desktop 1440 and `iPhone 8` / `iPhone 13`; `/` and `/es`:**
  - no request to `assets.calendly.com`;
  - `#calendly-embedded-overlay` appears;
  - the close box is ≥ 44×44, and `elementFromPoint` at its centre and at ±14 px is the close button;
  - a tap closes the modal; Escape closes it (1440); Tab reaches it with a visible ring;
  - `scrollY` doesn't change while open;
  - a `message` listener records ≥ 1 `calendly.event_type_viewed` from `https://calendly.com`.
- [ ] **Real iPhone (Mauricio, before merging PR 1a).** On the Vercel preview, Safari with toolbars visible, `/` and
  `/es`:
  1. a screen recording of open → close;
  2. a screenshot with the modal open, showing the ✕ in its bar;
  3. whether the page behind scrolls;
  4. the iPhone model and the iOS version.

  The emulator can't show Safari's toolbars (the `dvh` question).

---

## PR 1b — the rest of Part A (after PR 1a is merged)

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

**AC:**
- [ ] SSR of every route × locale contains exactly 1 `<main id="main-content"`.
- [ ] axe `landmark-one-main` is 0.
- [ ] The first Tab shows the skip link; Enter moves focus to `<main>`.
- [ ] EN screenshots unchanged while the link is unfocused.

## A7 — header `<nav>` landmark
- `src/components/organisms/Header/index.tsx`:
  - wrap `ul.nav` (desktop) in `<nav aria-label={t.header.navLabel}>`;
  - wrap `ul.nav_mobile__menu` (the opened mobile menu) in `<nav aria-label={t.header.navLabel}>`;
  - `ul.nav_mobile` (CTA + menu toggle) stays as it is.

  Only one `<nav>` is displayed at a time; the other is `display: none`.
- **D-A7 decided:** new key `header.navLabel`:
  - EN **"Main"**;
  - FR **"Principal"**;
  - ES **"Principal"**.

  The landmark is already announced as navigation. Case pages have a second `<nav>` (`.project-detail__navigation`),
  so the label is required (axe `landmark-unique`). Add it to `en.test.ts`.
- **Layout risk:** `.header .main` is a flex row, and the `<nav>` becomes the flex item instead of the `<ul>`.
  `Header.scss` uses descendant selectors (`.header ul.nav`), so the `ul` styles still apply. The Dev moves any
  flex-item rule from `ul.nav` to the wrapping `nav` if needed, and proves a **0-pixel header diff** at 375/768/1440 ×
  EN/FR/ES. Don't use `display: contents` (older WebKit drops the landmark).

**AC:**
- [ ] axe `region` count drops versus the baseline, and `landmark-unique` is 0.
- [ ] SSR has the header `<nav aria-label="Main|Principal">` on every page.
- [ ] Header pixel diff = 0.

## A2 — `header.logoAlt` = "Magneto" (F-1)
- `src/i18n/dictionaries/{en,fr,es}.ts`: `header.logoAlt: 'Magneto'`.

| EN fingerprint / pins | Where | Action |
|---|---|---|
| `EN_FINGERPRINT["header.logoAlt"]` | `src/i18n/dictionaries/en.test.ts:27` | `"Logo"` → `"Magneto"` + `// design round A2 (F-1, Mauricio 2026-11-09)` |
| qa-i18n `identicalAllowed` `"Logo"` | `scripts/qa-i18n/config/glossary.json:30` | No edit (Mauricio-approved file); it becomes unused, and "Magneto" is a `keep` term |
| 5c AC-9 SSR hashes | `docs/reports/phase-5c-loader.md:694-696` | Historical evidence, not a test; not re-pinned |
| Snapshot / alt tests | — | none found |

## A3 — decorative images get `alt=""` (F-2 + service icons)
- `FinalCTASection/index.tsx:63` → `alt=""`. Today it is `data?.title || bgAlt`, which repeats the visible `h2`.
- `PackageCard/index.tsx:191` check icon → `alt=""`.
- `ProjectDetail/index.tsx:98` check icon → `alt=""`.
- `ServiceIcon/index.tsx:15` → `alt=""`. Today it is `${type} icon`, where `type` is the icon **URL**. It is shown on the
  home featured services.
- `ServicesList.tsx:30`, service icon `alt` → `""`. It repeats the heading next to it.
- Remove `common.checkIconAlt` and `cmsFallback.finalCta.bgAlt` from `en/fr/es.ts`, and their `en.test.ts` lines 18 and
  127. `IconComponent`'s `alt: string` prop is unchanged.

**AC:**
- [ ] SSR: the final-CTA bg `<img>`, `.project-detail__check`, `.service-icon__image` and the Services icons all have
  `alt=""`.
- [ ] `grep -rn "checkIconAlt\|finalCta.bgAlt" src` = 0.

## A8 — case-page contrast (WCAG AA)
- `src/components/organisms/ProjectDetail/ProjectDetail.scss`:
  - `.project-detail__list li` (line 121): `$gray-80` #787878 (4.42:1) → **`$gray-90` #606060 (6.29:1)**;
  - `.project-detail__external-link` (line 22): the same token change; its `:hover` goes to `$black`.
- **AC:**
  - [ ] axe `color-contrast` = 0 on the 3 case pages × en/fr/es × 375/1440.
  - [ ] EN change limited to those two text colours.

## A4 — image quality (reduced scope)
**Rule applied:** `quality={90}` only where q75 shows **visible** softness **and** the page grows ≤ 15%. The baseline
is the page weight after the hero-background fix.

**Evidence:**
- Page weight, cold cache, per route (`a4-weight-cold.json`).
- For every image the pages request: bytes at q75/q90 and PSNR against a q100 render (`a4-quality.json`).
- 1:1 crops q75 | q90 (`detail/a4_q75-vs-q90_*.png`).

### Applied
| Image | Change | Softness evidence | Bytes (measured) | Page weight |
|---|---|---|---|---|
| **Hero background** (both `Hero` branches; home, services, packages, projects, about, contact) | Render `next/image` `fill`, `priority`, `sizes="(max-width: 1240px) 100vw, 1200px"`, `quality={90}` in `.hero__bg`; keep `alt=""`, `.hero__bg-image` | Today it is the **raw PNG**. At q75 the gradient shows **visible blocky banding**; q90 keeps the grain (`a4_q75-vs-q90_hero-background_w1200.png`). PSNR q75 43.0 / q90 44.0 dB (PSNR under-weights banding) | Raw **1,691,847 B** today, `loading="lazy"`. After: w1200 q90 = 27,650 B (1440); about 6–10 KB at 375@2x | **Down about 1.62–1.64 MB per hero route** (home 1440: 2,040 → about 414 KB) |
| **Final CTA background** (same file) | `quality={90}` (via `WpResponsiveImage` `...rest`) | Same banding at q75 | w1200: 7,224 → 27,650 B. At 1440 it is the same URL as the hero bg, so one download serves both | Hero routes: about 0 extra (1440), ≤ 6% (375). Case pages: ≤ 3% |
| `next.config.ts` | `images.qualities: [75, 90]` | — | — | Keeps q90 valid on next@16; `images.domains` untouched (Known debt) |

### Not applied (reason)
| Image | Softness at q75 | Weight if q90 | Reason |
|---|---|---|---|
| Home hero illustration (PNG with alpha) | None visible at 1:1. PSNR 26 dB is not meaningful (alpha) | +5–9% | No visible softness |
| Case galleries (1280 px PNG) | None visible; PSNR 36.4–46.0 dB | Dangel 1440 **+35%** | Not visible, and > 15% |
| Services row images | None visible; PSNR 38.7–39.8 dB | **+18%** | Not visible, and > 15% |
| Project cards | None | — | No softness documented |
| About portrait, contact visual | None | contact +348% | No softness documented |
| SVG icons, logo | — | — | Vector |

**Recorded only:** at 768, case and services images are upscaled by 1.1–1.18× (1254–1350 px sources at 1476 device px).
That needs ≥ 1600 px exports → **Phase 8 Graphics**.

**AC:**
- [ ] The 6 hero routes: the hero bg uses `/_next/image?…&q=90` with no `loading="lazy"`.
- [ ] The final CTA bg uses `q=90`.
- [ ] No other image URL changes `q`.
- [ ] A cold-cache weight table before/after in the report.
- [ ] Mauricio's banding check at 1440 and 375.

## A5 — empty-caption gallery gap
- `ProjectDetail/index.tsx:128-130`: render `<p>` only when `img.footNote.trim()` is non-empty.
- Expected gaps:
  - image → image 30 → **15 px** (375/768) and 45 → **30 px** (1440);
  - last image → link 40 → 25 / 60 → 45 px.
- Trépied (7 captions) is unchanged.

**AC:**
- [ ] Dangel and Shamanicca × en/fr/es: 0 `.project-detail__image > p`.
- [ ] Trépied: 7.
- [ ] The gaps as above.
- [ ] `ProjectDetail.test.tsx` (new): `""`, `"  "` → no `<p>`; text → `<p>`.

## Part A — files the Dev may touch
| PR | Item | Files |
|---|---|---|
| **1a** | A6-alt | `src/utils/calendly.ts`, `src/utils/calendly.test.ts`, `src/styles/components/calendly.scss` (new), `src/utils/scroll-lock.ts` (new), `src/utils/scroll-lock.test.ts` (new), `src/components/organisms/EmailCollectorProvider/index.tsx` (moved helper, `calendly.scss` import, warm-up call removed), `src/components/atoms/CalendlyButton/index.tsx` (import + hover/focus warm-up removed; props unchanged), `src/components/atoms/CalendlyButton/CalendlyButton.test.tsx` (mock list), `src/hooks/useCalendly.ts` (**delete**; 0 importers), `docs/reports/design-round-1a.md` |
| **1b** | A1 | `src/app/[locale]/layout.tsx`, `src/styles/globals.scss`, `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts` |
| 1b | A7 | `src/components/organisms/Header/index.tsx`, `src/components/organisms/Header/Header.scss` (only if needed for the 0-pixel diff), `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts` |
| 1b | A2 | `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts` |
| 1b | A3 | `src/components/organisms/FinalCTASection/index.tsx`, `src/components/molecules/PackageCard/index.tsx`, `src/components/organisms/ProjectDetail/index.tsx`, `src/components/atoms/ServiceIcon/index.tsx`, `src/app/[locale]/services/ServicesList.tsx`, `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts` |
| 1b | A8 | `src/components/organisms/ProjectDetail/ProjectDetail.scss` |
| 1b | A4 | `src/components/organisms/Hero/index.tsx`, `src/components/organisms/FinalCTASection/index.tsx`, `next.config.ts` |
| 1b | A5 | `src/components/organisms/ProjectDetail/index.tsx`, `src/components/organisms/ProjectDetail/ProjectDetail.test.tsx` (new) |
| 1b | Report | `docs/reports/design-round-1b.md` |

- **Not touched:** `CalendlyButton.scss`. It is dead CSS, recorded as an issue for a cleanup phase.
- **Order:** PR 1a (merged after the real-iPhone check) → PR 1b in the order A1, A7, A2, A3, A8, A4, A5 → PR 2.
- Each item is its own Conventional Commit, proposed by the Dev and made by Mauricio.

---

# PART B — Draft, awaiting decisions (B2 decided) → PR 2

Button style at the phone breakpoint, measured: `.btn` = 12 px / 900 (CTA classes) or 600 / line-height 16 px /
padding 15 px 30 px, uppercase on hero and final-CTA buttons. Every CTA wrap happens only at 375.

## B1 — CTA labels wrap on phone (FR/ES) — *awaiting decision*
**Measured at 375:** available button width: hero **315 px**, final CTA **285 px**.

| Location | Locale | Label (chars) | Natural width | Rendered | Lines |
|---|---|---|---:|---|---:|
| Hero | EN | BOOK A FREE STRATEGY CALL (25) | 235 | 235×46 | 1 |
| | FR | RÉSERVER UN APPEL-CONSEIL GRATUIT (33) | 292 | 292×46 | 1 |
| | **ES** | AGENDAR UNA LLAMADA DE ORIENTACIÓN GRATUITA (43) | **372** | 315×**62** | **2** |
| Final CTA (about, services, case) | EN | BOOK A STRATEGY CALL (20) | 204 | 204×46 | 1 |
| | **FR** | RÉSERVER UN APPEL-CONSEIL GRATUIT | **292** | 285×**62** | **2** |
| | **ES** | AGENDAR UNA LLAMADA… | **372** | 285×**62** | **2** |
| Packages final CTA (secondary) | FR / ES | same as above | 292 / 372 | 285×**66** | **2** |
| Packages hero / final CTA (primary) | FR / ES | PARLEZ-MOI DE VOTRE PROJET / CUÉNTAME SOBRE TU PROYECTO (26) | 244 / 254 | — | 1 |
| Contact "Prefer to talk?" (600, not uppercase) | ES | Agendar una llamada de orientación gratuita | — | 315×66 | **2** |

- Width per character: EN 7.0, FR 7.03, ES 7.26 px.
- Crops: `detail/hero_home_es_375.png`, `detail/finalcta_about_{fr,es}_375.png`, `detail/finalcta_packages_{fr,es}_375.png`.

**Options:**
- **A — CSS at ≤600 px:** button `padding-inline: 15px`, final-CTA container `padding-inline: 15px`. That gives 285 px of
  text everywhere. FR → 1 line; ES → still 2. EN buttons get 30 px narrower.
- **B — copy limits:** ≤ 30 chars (final CTA) / ≤ 34 (hero) at today's CSS. It needs new FR/ES copy in the dictionary
  **and** in the CMS CTA fields.
- **C — 2 deliberate lines:** full-width buttons, `text-wrap: balance`, line height 18 px. A visible EN change.

**Recommendation:** A + `text-wrap: balance` (optionally an ES label ≤ 38 chars). **Trade-off:** a slight EN change at
375.

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
line. 70vw already passes 75 on the EN FIX card, and 75vw reaches 81–83. Titles are 1 line at all three widths.

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

- No horizontal scroll at any width.
- The rich-card subgrid keeps working with one track.
- **Screenshots at 768:**
  - `detail/b2_packages_{en,fr,es}_768_chosen.png` (the result);
  - `…_current.png`, `…_66vw.png`, `…_70vw.png`, `…_75vw.png` (the comparison).
- **Note:** in ES the CARE title ends 2–4 px from the icon at 768. The Dev checks it doesn't touch at 601–1023.
- **File:** `src/components/organisms/PackagesGrid/PackagesGrid.scss`.
- **AC:**
  - [ ] Packages × en/fr/es: 1 column at 375, 601, 768 and 1023 (centred, width = the formula);
  - [ ] 3 columns at 1024 and 1440 (pixel-identical to today at 1440);
  - [ ] no horizontal scroll.

## B3 — Typographic hierarchy (subtitle, body, form text, eyebrow) — *awaiting decision*
### Inventory (`typography.scss`, `variables.scss`)
- **Fonts and weights:** DM Sans is loaded at 400 / 600 / 900 only. `$font-weights`: medium 400, bold 600, extrabold
  900. `variables.scss` also declares 500 and 700, which are not loaded. Weights 700 (privacy h2) and 800
  (`PackagesContentSections` h3) are requested.
- **Breakpoints:** phone ≤ 600, tablet ≤ 1024, desktop. Letter-spacing `normal` everywhere.
- **Scale shift:** `.typo-xl…5xl` use one step down below 601 px.

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

### Rendered, EN (size / weight / line-height)
| Role | 375 | 768 | 1440 |
|---|---|---|---|
| Home H1 (`typo-5xl`) | 27/900/**30** | 36/900/**normal** | 48/900/**normal** |
| Page H1 (`typo-4xl`) | 22/900/30 | 30/900/normal | 36/900/normal |
| H2 (`typo-3xl`) | 20/900/26 | 24/900/34 | 30/900/40 |
| H3 (`typo-2xl`) | 18/900/22 | 20/900/30 | 24/900/34 |
| Hero subtitle (home) | 18/400/**30** | 20/400/normal | 24/400/normal |
| Subtitle (`service-heading`, `services-group__intro`) | **16/400/20** | 18/400/27 | 20/400/30 |
| Body (`typo-paragraph`, `li`) | **16/400/20** | 16/400/24 | 18/400/28 |
| Form label | 14/400/20 | 14/400/24 | 16/400/28 |
| Form control | 16 | 16 | **14** |
| Form help / privacy / required note | **12**/400/18 | 12/400/20 | 14/400/24 |

### Measured problems
1. At 375 the subtitle and the body are identical (16/400/20).
2. Body line height at 375 is 20 px (1.25).
3. **Bug:** `Hero.scss:139-158` sets `line-height: inherit` from 600 px, so the tokens are ignored (browser `normal`).
   On phone it forces 30 px for both the title and the subtitle.
4. Form help is 12 px on phone and tablet. Controls drop to 14 px on desktop, below the labels.
5. Weights 700 and 800 are requested but not loaded.

### The eyebrow (rev 3: the short lead-in line above a title)
**What it is today** (Mauricio's example; code read, not rendered, because the section is hidden):
- `LeadMagnetSection/index.tsx:66-68`: `<p class="typo-center typo-xl-extrabold m-0">` with
  `overTitleLeadMagnetSection` or `cmsFallback.leadMagnet.overTitle` ("Not sure where to start? Download our free
  guide:"), directly above `h2.typo-3xl-extrabold`.
- From the mixins: **16/900/20** (phone), **18/900/27** (tablet), **20/900/30** (desktop). The title below is 20 / 24 /
  30 px at 900. The lead-in has the title's weight and nearly its size, so the two compete. That is the hierarchy
  problem the eyebrow style solves.
- **Not the eyebrow:** `.badge` (`typography.scss:344-353`, a pill). It renders nowhere today and stays as it is in this
  round.

**Proposed eyebrow style** (part of B3-b; a reusable mixin + class in `src/styles/typography.scss`):

| Property | Phone ≤ 600 | Tablet 601–1024 | Desktop |
|---|---|---|---|
| Size / line-height | 14 / 20 px | 15 / 22 px | 16 / 24 px |
| Weight | 600 (`bold`, loaded) | 600 | 600 |
| Letter-spacing | 0.01em | 0.01em | 0.01em |
| Case | sentence (no uppercase: FR/ES lead-ins are full sentences, and uppercase lengthens them about 10–15%) | same | same |
| Colour on light | `$primary-color-dark` #371b97 (**11.89:1** on white) | same | same |
| Colour on dark/brand backgrounds | `$white` via a modifier `.typo-eyebrow--on-dark` | same | same |
| Space to the title below | 8 px (`margin-block-end`) | 8 px | 12 px |

```scss
// typography.scss — proposal (breakpoint mixins from src/styles/mixins.scss)
@mixin eyebrow {
  font-size: 14px; line-height: 20px; font-weight: map-get($font-weights, bold); letter-spacing: .01em;
  color: $primary-color-dark; margin: 0 0 8px;
  @include media-tablet-up { font-size: 15px; line-height: 22px; }
  @include media-desktop-up { font-size: 16px; line-height: 24px; margin-bottom: 12px; }
}
.typo-eyebrow { @include eyebrow; }
.typo-eyebrow--on-dark { color: $white; }
```
- Contrast: #371b97 on white 11.89:1 and on `$primary-color-light` 9.41:1 (computed); white on the final-CTA
  overlay must be checked with axe where used.
- **Where it could apply on current pages: nowhere today.**
  - A scan of every `<p>`/`<span>` within 4 lines above an `<h1>`–`<h3>` in `src/app` and `src/components` finds only
    the LeadMagnetSection over-title and an error-state paragraph on `/services` (`services/page.tsx:33`), which is
    not a lead-in.
  - `ServiceCard`'s `tagline` sits **below** its `h3`; the contact "Prefer to talk?" line leads into a button, not a
    title.
  - Using the eyebrow elsewhere would need new copy (CMS field or dictionary) per section → Mauricio decides, out of
    this round unless he names a place.
- **Note for the 5e spec:** when LeadMagnetSection is rebuilt, its over-title (`overTitleLeadMagnetSection`) uses
  `.typo-eyebrow` (or `@include eyebrow`) instead of `typo-xl-extrabold`. **No change to LeadMagnetSection in this
  round.**

### Options
- **B3-a — fixes only:**
  - remove the hero `line-height` overrides;
  - form help phone/tablet 13/20;
  - controls 16 px at every width;
  - map 700/800 to 600/900;
  - add the eyebrow mixin/class (unused until 5e).
- **B3-b — adjusted phone/tablet scale + B3-a.**
  - Phone: lg 16/**24**, xl **18/26**, 2xl 20/**28**, 3xl **24/30**, 4xl **28/34**, 5xl 30/36.
  - Tablet: sm **13**/20, md **15**/22.
  - At 375: home H1 28, page H1 24, H2 20–24, H3 20, subtitle **18** (≠ body 16), body line height **24**.
  - Desktop unchanged.
  - The eyebrow as specified above (14 / 15 / 16, one step below the body on tablet and desktop and clearly below the
    subtitle).
- **B3-c — B3-b + a desktop step:** subtitle 22, H3 26. EN 1440 changes visibly.

**Recommendation:** B3-b. **Trade-off:** taller phone pages, and every EN phone page changes. The eyebrow alone changes
nothing visible today.

## B4 — Spacing / vertical rhythm — *awaiting decision*
- **Measured** (`detail.json`, EN, px at 375 / 768 / 1440): the baseline is **30 / 30 / 60** on most joins.
- **Outliers:**
  - Services intro → list 15 / 17 / 32;
  - Packages intro → cards 15 / 15 / 30;
  - home About → featured 50 / 54 / 90;
  - home testimonials and `/projects` → final CTA 40 / 40 / 109;
  - header → case-page title 10 / 10 / 15;
  - privacy → footer 80 / 80 / 145.
- **Code facts:**
  - `helpers.scss` defines `.mt-sm-responsive` / `.mb-sm-responsive` twice (lines 174/180 vs 250/258);
  - `ProjectDetail` uses `pb-md` and `mt-sm`, which don't exist.
- **Options:**
  - **B4-0:** fix the bugs only;
  - **B4-a:** B4-0 + normalize the outliers to 30 / 60 with existing helpers;
  - **B4-b:** add a tablet step (30 / 45 / 60).
- **Recommendation:** B4-a.

## B5 — Home hero layout — *awaiting decision*
- **Measured:** the fixed-height home hero with an absolutely positioned illustration means the CTA overlaps the
  illustration in every locale and width:

| Home | 375 | 768 | 1440 |
|---|---|---|---|
| EN | 5 title lines; overlap **154 px** | 3; 79 | 2; 96 |
| FR | 5; 154 | 3; 79 | **3; 159** (subtitle over the image) |
| ES | 4 + **2-line CTA; 170** (subtitle over the image) | 3; 105 | 2; 96 |

  Crops: `detail/hero_home_*`. Inner heroes don't overlap; they only have the line-height bug (B3 #3).
- **Options:**
  - **a:** the illustration in flow below the CTA;
  - **b:** reserve space (`min-height` + bottom padding);
  - **c:** a at ≤ 600, b above.
- **Recommendation:** c. **Trade-off:** EN changes at every width.

## B6 — Services outline button — *awaiting decision*
- **Measured:** `.service-cta` is 78 px tall at every width. The cause is `min-height: 44px` on a `content-box` `.btn`
  (`Services.scss:123`): 44 + 30 + 4.
- **`docs/BUTTON_SYSTEM.md` is outdated:**
  - it lists `.cta` / `.cta-mobile` (they don't exist);
  - it says `.btn-secondary` was removed (it exists);
  - `.btn-outline`, `.btn-medium` and `.btn-sm` are used but undefined.
- **Options:**
  - **a:** `box-sizing: border-box` on `.service-cta` (→ 50 px);
  - **b:** the same globally on `.btn` + `min-height: 44px`;
  - **c:** a + rewrite the doc.
- **Recommendation:** c.

## B7 — Privacy measure at 768 — *awaiting decision*
- **Measured:** **79–80** characters per line at 768 (640 px column, 16 px), 75 at 1440, 40–41 at 375.
- **Options:**
  - **a:** `max-width: 35rem` at 601–1023 px → about 70;
  - **b:** 36rem → about 72;
  - **c:** 17 px from 601 px → about 75.
- **Recommendation:** a.

## B8 — Real length limits (D-10) → `scripts/qa-i18n/config/length-limits.json` — *awaiting B1/B5*
| Type | Placeholder | If B1-A | If B1 unchanged | Basis |
|---|---:|---:|---:|---|
| `cta-label` | 32 | **38** | 30 | 285 px ÷ 7.3 px per character |
| move `common.bookStrategyCall` → `cta-label` | — | yes | yes | It renders as the uppercase CTA; EN 25 > `button` 24 |
| `button` | 24 | **26** | 26 | FR `header.scheduleCall` (25) fits at 375 |
| `hero-title` | 70 | **100** with B5-a/c | 60 | EN home 73 > 70 today |
| `ratioWarnAbove` | 1.3 | **1.35** | 1.35 | FR/EN 1.32; ES/EN CTA 1.72 |

Then `status: "set"`, `set: { by: "Mauricio", on: "<date>" }`. Re-run `npm test -- --run scripts/qa-i18n`.

## B9 — Icons / Lucide — *awaiting decision*
- **Inventory:**
  - `IconComponent` (Services rows, Packages cards);
  - `ServiceIcon` (home);
  - 19 `ico-*.svg` files;
  - 3 inline SVGs.
- **What is CMS-driven:** the service and package icons are ACF image fields.
- **Broken:** only the `ServiceIcon` alt (fixed in A3).
- **Lucide** would need an install and, for the CMS icons, a data-model change (ADR + ACF + production runbook).
- **Recommendation:** no new dependency before launch.

## Part B — files the Dev may touch (only for decided options)
| Item | Files |
|---|---|
| **B2 (decided)** | `src/components/organisms/PackagesGrid/PackagesGrid.scss` |
| B1 | `src/components/organisms/Hero/Hero.scss`, `src/components/organisms/FinalCTASection/FinalCTASection.scss` |
| B3 | `src/styles/typography.scss` (scale + eyebrow mixin/class; **not** `.badge`), `src/styles/variables.scss` (weights only), `src/components/organisms/Hero/Hero.scss`, `src/styles/components/form-field.scss`, `src/styles/components/contact-form.scss`, `src/styles/pages/privacy.scss`, `src/components/organisms/PackagesContentSections/PackagesContentSections.scss`. **Not** `LeadMagnetSection/*` (5e). |
| B4 | `src/styles/helpers.scss`, `src/components/organisms/ProjectDetail/index.tsx` (class names only), `src/app/[locale]/services/Services.scss`, `src/app/[locale]/packages/Packages.scss`, `src/styles/pages/home.scss`, `src/styles/pages/privacy.scss` |
| B5 | `src/components/organisms/Hero/Hero.scss` (+ `Hero/index.tsx` with no prop change, only if a/c needs it) |
| B6 | `src/app/[locale]/services/Services.scss` or `src/styles/components/button.scss`; `docs/BUTTON_SYSTEM.md` |
| B7 | `src/styles/pages/privacy.scss` |
| B8 | `scripts/qa-i18n/config/length-limits.json` |
| B9 | none |
| Report | `docs/reports/design-round-2.md` |

---

## Decision table
| # | Item | Status | Decision / options | Recommendation |
|---|---|---|---|---|
| D-A1a | Skip-link copy | **Approved 2026-11-10** | EN/FR/ES as in A1 | — |
| A7 | Header `<nav>` | **Approved (PR 1b)** | — | — |
| D-A7 | `header.navLabel` | **Decided 2026-11-10 (round 2)** | "Main" / "Principal" / "Principal" | — |
| D-A3 | Service-icon alt | **Approved (PR 1b)** | — | — |
| A8 | Case-list contrast | **Approved (PR 1b)** | — | — |
| A4 scope | q90 rule | **Approved 2026-11-10** | hero/final-CTA background only | — |
| D-A6 | Calendly | **Decided 2026-11-10 (round 2): A6-alt.** Our hardened modal is the only path; widget script/CSS and preconnects removed; precondition verified (evidence 3); crossOrigin step moot | — | — |
| D-A6c | Patch Calendly's popup DOM | **Declined (round 2)** | — | — |
| PR split | Part A delivery | **Decided (round 2)** | PR 1a = A6, PR 1b = rest; order 1a → 1b → PR 2 | — |
| B1 | CTA wrap | awaiting | A CSS / B copy / C 2-line style | A + balance |
| **B2** | Packages tablet | **Decided 2026-11-10** | 1 column, centred, `clamp(30rem, 66vw, 33rem)` | — |
| B3 | Type scale + eyebrow | awaiting (eyebrow definition clarified) | a / b / c | b |
| B3-eyebrow use | Where the eyebrow applies now | awaiting (Mauricio) | none today / name a place (needs copy) | none until 5e |
| B4 | Rhythm | awaiting | 0 / a / b | a |
| B5 | Home hero | awaiting | a / b / c | c |
| B6 | Services button | awaiting | a / b / c | c |
| B7 | Privacy 768 | awaiting | 35rem / 36rem / 17 px | 35rem |
| B8 | Length limits | awaiting B1/B5 | values above | per choices |
| B9 | Lucide | awaiting | add / don't | don't |

## Assumptions and open questions
- **Assumption (A6):** `calendly.event_scheduled` arrives from the iframe on the same `message` channel as the observed
  `calendly.event_type_viewed`. It was not observed (it needs a real booking), and nothing consumes it today.
- **Open (A6, non-blocking):** production's Calendly behaviour on 2026-10-03. It no longer affects the fix.
- **Open (A6):** `dvh` / toolbar behaviour on real iOS Safari, settled by the real-iPhone check before PR 1a merges.
- **Assumption (A6):** `env(safe-area-inset-*)` is 0 without `viewport-fit=cover`, so the `max(…)` padding applies.
  That is correct either way.
- **Note for 5f:** its references to `utils/calendly.ts:310-315` (overlay `z-index: 10000`) will point at moved lines
  after PR 1a. The value and the overlay id stay, so 5f's behaviour is unaffected.
- **Note for 5e:** the LeadMagnetSection over-title uses the B3 eyebrow style when rebuilt.
- **Observed, out of scope (5c-rest):**
  - `/fr` home in EN;
  - EN legacy final CTA on `/fr|es` home and projects;
  - Trépied `[FR TEST]` / `[ES TEST]` and EN captions;
  - hero illustration alt "Home" / "Inicio" from the CMS.
- **Recorded issue, not fixed:** `CalendlyButton.scss` is never imported (dead CSS); `trackCalendlyEvent` has no
  caller.

## Out of scope
- Any CMS / ACF / WPML change.
- Any copy change beyond the approved dictionary keys (`skipToContent`, `navLabel`, `logoAlt`).
- New dependencies.
- A Calendly `message` listener or conversion tracking.
- Restyling LeadMagnetSection (5e).
- Tablet image resolution (Phase 8), `images.domains`, `heading-order`, the Header `next/link` (D1 debt).

## Acceptance criteria (every PR)
- [ ] **Gate:** lint ≤ **88 / 94**, with no message on changed lines; `npm run typecheck` exits 0;
  `npm test -- --run` passes (count recorded); `ENABLED_LOCALES=en,fr,es npm run agent:build` exits 0.
- [ ] **8 routes × en/fr/es × 375/768/1440:** 200, **no horizontal scroll** (new captures in
  `…/design-round/screenshots-after-<pr>/`).
- [ ] **EN visual regression limited to the PR's items:**
  - PR 1a: the booking overlay only;
  - PR 1b: A1 (focused skip link only), A7 (0 px), A3 (none visible), A8 (case-list text colour), A4 (background
    pixels), A5 (case gallery gaps);
  - PR 2: B2 (Packages at 601–1023) plus the B options decided later.
- [ ] **axe:** the same 48 runs. No rule/route pair worse than `axe-baseline.json`. After PR 1b:
  `landmark-one-main` = 0, `color-contrast` = 0 on case pages, `landmark-unique` = 0.
- [ ] Item ACs: A6 (PR 1a); A1–A5, A7, A8 (PR 1b); B2 (PR 2); the other B items once decided.
- [ ] **Vercel preview:** WORKFLOW release checks (routes 200, `/esto-no-existe` 404, a project page 200). For PR 1a,
  also Mauricio's real-iPhone check.

## Risks
- **A6-alt:**
  - Everyone gets our modal instead of Calendly's popup. In practice that is what users get today, because the widget
    is blocked.
  - If Calendly ever stops allowing the iframe, the modal shows an empty frame. The close button still works, and the
    new-tab path remains for `forceNewWindow` callers.
  - Booking events are not consumed. A later conversion-tracking phase must add a listener.
- **EN fingerprint:** A1 (+`common.skipToContent`), A7 (+`header.navLabel`), A2 (`header.logoAlt`), A3 (−2 keys).
  Each `en.test.ts` line carries its source comment.
- **A4:** check the gradient at q90 for banding by eye. If banding remains, use q95 for that image only, and record the
  bytes.
- **A7:** a possible header shift from the `<nav>` wrapper, guarded by the 0-pixel AC.
- **B2:** Packages at 601–1023 becomes longer (3 stacked cards).
- **CMS:** none.

## Estimate
| PR | Mauricio | Agent |
|---|---|---|
| **PR 1a** (A6-alt) | 20–30 min (real-iPhone check on the preview, review) | **4–5 h**: widget removal + callers 0.75; modal hardening + `calendly.scss` + scroll-lock 1.5–2; test rewrite (`calendly`, `scroll-lock`, `CalendlyButton`) 1; Playwright Chromium/WebKit verification + report 1 |
| **PR 1b** (A1, A7, A2, A3, A8, A4, A5) | 25–35 min (EN screenshots, banding check, review) | **6–7 h**: A1 1, A7 0.75–1, A2 + A3 1, A8 0.25, A4 1, A5 0.5, verification + report 1.5–2 |
| PR 2, B2 only (decided) | 10 min | 0.5–1 h |
| PR 2, remaining B items (after decisions) | 45–60 min | 5.5–8 h (B3 includes the eyebrow mixin, +0.25 h) |

**Order:** PR 1a → (real-iPhone check, merge) → PR 1b → PR 2. B2 can lead PR 2 on its own if Mauricio prefers.

## Decisions needed (ADR?)
- No ADR for A6-alt: Calendly stays as the booking provider, and only the embedding method changes (iframe instead of
  widget script). That is within the existing `calendly.ts` design, so there is no new dependency, routing change or
  data model change.
- Open for Part B: B1, B3 (+ where to use the eyebrow), B4–B9.
- An ADR would be needed only if B9 went ahead, or if a new eyebrow content field were added to the CMS.
