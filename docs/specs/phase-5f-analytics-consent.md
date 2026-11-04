# Phase 5f — Google Analytics 4 behind a consent banner (EN / FR-CA / ES)

- **Status: Pending final document verification** (rev 1.1, 2026-11-04).
- Approval record: Mauricio confirmed D-F1…D-F10 before this assignment. Senior Architect's supplied verdict is
  **CHANGES REQUIRED — Minor**. Corrections are incorporated below; final approval of rev 1.1 by both reviewers has
  not been explicitly supplied. After both approvals, record their dates and set **Status: Approved (rev 1.1)**.
  Decision confirmation and this revision do not substitute for final document approval.
- Author: Architect · Reviewers: Mauricio + Senior Architect
- Date: 2026-11-04
- Branch: `spec/phase-5f-analytics-consent`, originally from `master` `d990751`; draft + privacy rev 1.2 committed as
  `07ad962` (HEAD at the start of this revision). Code evidence below remains the historical `d990751` baseline.
- Architecture decision: [ADR 0007 — Consent-gated analytics](../adr/0007-consent-gated-analytics.md), Accepted by
  Mauricio's confirmed decisions; this does not claim Senior Architect approval of the revised spec.
- Depends on: [privacy-route](privacy-route.md) rev 1.2 (footer list, `/privacy-policy`, §7 D-L check), [5d-lite](phase-5d-lite-contact-modal.md)
  (booking `<dialog>`, D-9/D-10 focus rules), ADR [0005](../adr/0005-ui-dictionaries.md) (dictionaries + build guard),
  ADR [0003](../adr/0003-locale-routing.md) (`localizePath`). Implementation needs the privacy-route **report** (footer
  `<ul>` always rendered) merged first.
- Canonical copy: `docs/content/magneto-copy-{en,fr-CA,es}.md` **as of `637fba7`** (export 2026-11-04). Notion stays
  canonical. Line numbers below are at `637fba7`. If a later export moves them, section titles govern.
- Decision (Mauricio, 2026-11-04): **GA4 + consent banner live at launch (Thu 12-03).** Fallback: launch without GA using
  "§5 Version B" (EN :917-928, FR :1069-1080, ES :1073-1084, section "Internal — ready policy blocks").

## Revision
- rev 1.1 (2026-11-04) — D-F1…D-F10 recorded as confirmed by Mauricio. Senior Architect corrections: cross-tab
  fail-closed transitions, withdrawal/load race regression, deterministic non-modal focus restoration, privacy
  provenance, effective deployment configuration + verified Version B, G-8 and the December 10 effective-date gate.
  ADR 0007 created. Stopped for final document verification; joint approval remains unrecorded.
- rev 1 (2026-11-04) — Draft.

## Goal
On a deployment built with `NEXT_PUBLIC_GA_ID=G-N2YZ6SG2WM`, a first-time visitor in any enabled locale sees a
"Privacy choices" banner with the pinned copy (ES remains draft until G-8 closes). **Nothing is requested from Google
Analytics / Tag Manager** (no `gtag.js`, no preconnect, no Consent Mode default, no cookieless ping) until they click
"Accept analytics". "Reject
non-essential" is as easy as Accept and never loads anything. The choice persists, and the footer "Privacy choices"
control reopens the banner to change or withdraw it. A build **without** `NEXT_PUBLIC_GA_ID` renders no banner, no footer
control and loads nothing. That build is the Version B fallback, switched by env + redeploy, with no code revert.

## Evidence (facts verified 2026-11-04 on `d990751`, read-only)

**Analytics code today**
- E1. `src/utils/analytics.ts` (40 lines). `GA_ID` is read once at module load (`:4`). `GA_SCRIPT(id)` →
  `https://www.googletagmanager.com/gtag/js?id=…` (`:6`). `warmAnalytics` adds a **preconnect + dns-prefetch to
  googletagmanager.com** (`:8-15` → `thirdParty.warmResource`, `thirdParty.ts:13-33`), which would reach Google before
  consent if anything called it. `loadAnalytics` (`:17-28`) injects the script with `crossOrigin: 'anonymous'`, **then**
  creates `dataLayer`/`gtag` and calls `config` with **no options** (signals / ad personalization not disabled).
  `gtagEvent` (`:30-34`) is a no-op unless `window.gtag` exists. 7 `any` in the file.
- E2. `src/utils/gtm.ts` (37 lines): `warmGtm`, `loadGtm`, `gtmPush`. Same preconnect risk (`:7-14`).
- E3. **No callers** of `loadAnalytics`, `warmAnalytics`, `loadGtm`, `warmGtm`, `gtmPush`:
  `grep -rn "warmAnalytics\|warmGtm\|gtmPush\|loadAnalytics\|loadGtm" src` → only their definitions. `thirdParty.ts`
  is imported only by `analytics.ts` and `gtm.ts`. No `next/script` / `<Script` anywhere in `src`. No reference to
  `googletagmanager` or `google-analytics` outside these two files (`grep -rn … src public next.config.ts`).
  → **Today nothing from Google Analytics/GTM loads.**
- E4. `gtagEvent` callers (stay unchanged): `PackageCard/index.tsx:27,42`, `CalendlyButton/index.tsx:61`,
  `FinalCTASection/index.tsx:25`, `Hero/HeroCTA.tsx:46`, `EmailCollectorProvider/index.tsx:227,273`. `Header/index.tsx:42`
  has a dead `const { gtagEvent: _unused } = ({} as any);` (not touched).
- E5. **Global test mock:** `vitest.setup.ts:8-15` defines `window.gtag` before **every** test (records
  `window.__lastGtagEvent`). `EmailCollectorProvider.test.tsx:252-256` relies on it (`gtagEvent` reaching `window.gtag`).
  → New tests that prove "nothing before consent" must `delete window.gtag` in their own `beforeEach`. `gtagEvent`'s
  contract ("no-op without `window.gtag`") must not change, or that test breaks.
- E6. UTM: `utils/utm.ts` uses `sessionStorage` key `utm_params_v1` (`:2,26,35,53`). Unchanged by this phase.
  `grep -rn localStorage src` → nothing. `document.cookie` → nothing. This phase adds the first `localStorage` key.
- E7. `package.json` has a dependency `"gtag": "^1.0.1"`. `node_modules/gtag/package.json` → "Git tag shortcut"
  (a shell script, `bin: gtag.sh`), **not** Google's gtag. Never imported (`grep -rn "from 'gtag'" src` → nothing).
  Unrelated to analytics. Not removed here (Hard rule 6, see D-F9).
- E8. Env: `.env.local.example:30` `NEXT_PUBLIC_GA_ID=your_ga_id_here`, no comment. No `NEXT_PUBLIC_GTM_ID` line.
  `next.config.ts` sends no CSP (only `images.contentSecurityPolicy` for the image optimizer `:65`, and `X-Robots-Tag`
  under `NO_INDEX` `:76-86`). → No CSP change needed.
- E9. Google Fonts is still loaded by CSS on **every page**: `styles/typography.scss:4`
  `@import url("https://fonts.googleapis.com/css2?…")`. This is a request to Google before any consent. It is disclosed in
  policy §4 (EN :847) and D-P9 kept it. **It is outside this phase** but makes the literal wording "no request to Google
  before consent" false (see O-1, D-F8).

**Where the UI goes**
- E10. Root layout `app/[locale]/layout.tsx:157-180`: `<body>` → `I18nProvider` → `EmailCollectorProvider` → `Header`,
  `{children}`, `FooterLoader`. Client components read copy with `useI18n()` (`I18nProvider.tsx:31-33`; only the
  request locale's dictionary reaches the client).
- E11. `Footer/index.tsx` is a **server** component (`getDictionary`, `:3,9`), rendered by `FooterLoader.tsx:15`. On
  `master` the `<ul className="footer__links">` renders only with a LinkedIn URL (`:17-25`). The privacy-route phase
  (11-12) makes it always render with a Privacy Policy `<li>` (privacy-route §3). This phase appends one more `<li>`.
- E12. Booking dialog: native `<dialog>` + `showModal()` (`EmailCollectorProvider/index.tsx:78,140-148,428-436`). It sits
  in the top layer and makes the rest of the page **inert**, so a non-modal banner can't take focus or clicks while it is
  open and can't trap focus against it. It locks scroll with `position: fixed` on `<body>` for iOS Safari (`:33-62`).
  Calendly's embedded overlay is a `div role="dialog"` at `z-index: 10000` (`utils/calendly.ts:310-315`), close button
  `10002` (`:346`). Header uses `z-index: 10` (`Header.scss:14`).
- E13. Buttons: existing classes `btn btn-primary`, `btn btn-secondary`, `btn-medium`, `btn-small`
  (`styles/components/button.scss`). Focus styles use `:focus-visible` (e.g. `email-collector.scss:61`).
- E14. Dictionaries: `en.ts` has `common.privacyPolicy` (`:13`) and `footer.{copyright, linkedin}` (`:41-44`). TODO
  markers today: `grep -c "TODO\]"` → fr 59, es 58 (incl. comments). Verbatim-from-export tests read the committed export
  at runtime (`dictionary.test.ts:175-193`, helper `fromExport`, rows `:195-…` pinned to `637fba7`).
- E15. Local CMS: `curl http://magneto-cms-2.local/graphql` → connection refused (exit 7). **This phase reads no CMS
  data**, so no schema evidence is needed.

**Copy (export `637fba7`)**

| Item | EN | FR-CA | ES |
|---|---|---|---|
| Banner heading | :942 `**Heading:** Privacy choices` | :1094 `**Titre : Choix de confidentialité**` | :1098 `**Título:** Opciones de privacidad` |
| Banner body | :944 (after `**Body:**`) | :1096 | :1100 |
| Buttons (split on ` · `) | :946 Accept analytics · Reject non-essential · Privacy Policy | :1098 Accepter les outils d'analyse · Refuser les outils non essentiels · Politique de confidentialité | :1102 Aceptar la analítica · Rechazar lo no esencial · Política de privacidad |
| Footer control | :178 `Privacy Policy · Privacy choices` (footers :294, :470, :592, :719) | :1100 `Lien permanent du pied de page : Choix de confidentialité` | :1104 `Enlace permanente del pie de página: Opciones de privacidad` |
| Policy §5 with GA (published if 5f is live) | :853-863 | :999-1009 | :1009-1019 |
| §5 Version B (fallback) | :917-928 | :1069-1080 | :1073-1084 |
| Section status | final | final | **"Textos de interfaz — privacidad (BORRADOR)"** (:1094) |

- The third "button" is the existing `common.privacyPolicy` value in all three locales (en.ts:13 = EN :946 third item,
  likewise FR/ES). It is a link to `/privacy-policy`, not a button.
- §5 text the code must make true: "off by default and loads only if you select **Accept analytics**", "reject … without
  losing access", "change your choice at any time through the **Privacy choices** link in the footer", "kept for up to 14
  months", "Google signals is not enabled" (EN :859-861; FR :1005-1007; ES :1015-1017). FR checklist :1145: keep "Choix de
  confidentialité" identical in banner and footer, and "Accepter les outils d'analyse" identical in §5 and the button.
- Copy has **no** close-button label, no "current choice" text and no separate "settings" view. This spec invents none
  (Hard rule 4).

**GA property (Mauricio, 2026-11-04, not verifiable by agents):** Measurement ID `G-N2YZ6SG2WM` (public). Data retention
14 months, Google signals off, data sharing off, Data Processing Terms accepted. Vercel has a **legacy**
`NEXT_PUBLIC_GA_ID` from 2025 that Mauricio replaces.

## Assumptions and remaining release gates
- **A1.** `NEXT_PUBLIC_*` values are inlined at **build** time. Changing `NEXT_PUBLIC_GA_ID` in Vercel needs a
  redeploy. Instant Rollback restores the previous build with its inlined value. Inlining only works for the literal
  expression `process.env.NEXT_PUBLIC_GA_ID` (no destructuring, no dynamic key).
- **A2.** `next dev` / `next build` don't override a variable already set in the shell. So the Dev can run
  `NEXT_PUBLIC_GA_ID=G-LOCALTEST00 PORT=3100 npm run dev` without editing `.env.local` (Hard rule 3). The Dev confirms
  this on the first run (the banner appears).
- **A3.** GA4 sets first-party, JS-written cookies `_ga` and `_ga_<ID without "G-">` (here `_ga_N2YZ6SG2WM`), path
  `/`, on the highest settable domain (`cookie_domain: 'auto'`). That is `.magnetomarketing.co` in production and the
  full host on `*.vercel.app` (public suffix). JS can delete them.
- **A4.** Setting `window['ga-disable-G-N2YZ6SG2WM'] = true` stops `gtag.js` from sending further hits on the page
  (Google's documented opt-out flag). Enhanced-measurement page views on history changes cover App Router soft
  navigations, so no manual `page_view` is needed (and none must be sent, to avoid duplicates). Mauricio confirms
  enhanced measurement is on in the GA data stream.
- **A5.** Vercel exposes `NEXT_PUBLIC_VERCEL_ENV` (`production` / `preview` / `development`) to Next.js builds by default
  ("Automatically expose System Environment Variables"). Needed only for D-F4 A. Mauricio checks the project setting.
- **A6.** Safari/WebKit ITP caps script-written storage (`localStorage` and JS cookies) at 7 days without a visit. A
  Safari visitor who returns after more than 7 days sees the banner again, and GA counts them as a new user. This is
  accepted, not worked around.
- **O-1. Resolved by D-F8 A: Google Fonts vs "no request to Google before consent"** (E9). The brief and privacy AC-10 speak of "Google".
  Fonts remain disclosed in §4; these ACs cover **analytics** hosts only. Self-hosting is deferred until after launch.
- **O-2. ES banner copy is BORRADOR** (:1094). It goes into `es.ts` as written (guard-safe: no TODO marker). It is final
  only with explicit G-8 closure (privacy-route), covering the policy, banner and footer labels. A passing build,
  copy lock or TODO guard does not establish editorial approval. If wording changes, Mauricio approves it in Notion;
  re-export and re-pin the affected locks before ES launches. Without G-8 at the 12-01 go/no-go, launch EN + FR only,
  including when Version B is selected. No canonical copy is changed by this specification.
- **O-3. Resolved by D-F6 A:** no additional current-choice text on reopen; the copy supplies none.

## Design

### 1. Switch: "analytics configured"
`isAnalyticsConfigured()` = `getGaId() !== ''`, where `getGaId()` returns
`(process.env.NEXT_PUBLIC_GA_ID ?? '').trim()` and **is read at call time**, not at module load (testable with
`vi.stubEnv`, A1). If it is not configured, nothing in this phase renders, reads storage or touches cookies. That build
is the Version B state.

The ID must match `/^G-[A-Z0-9]+$/`. Otherwise `getGaId()` returns `''` and logs once in development only. This catches a
stray placeholder (`your_ga_id_here`) or a GTM ID.

### 2. Consent storage — `src/utils/consent.ts` (new)
- **`localStorage`**, key `magneto-consent`, value `{"v":1,"analytics":"granted"|"denied","at":"<ISO date>"}`.
- Why `localStorage`:
  - The choice must outlive the tab (`sessionStorage` would re-ask on every visit).
  - The server never needs it. Reading a cookie in a server component would make every route dynamic and break the
    static/ISR pages.
  - It isn't sent with every request (so it isn't in Vercel logs).
  - It is first-party, under "necessary technologies… remembering your privacy choice" (EN :857).
  - It is site-wide: one origin serves `/`, `/fr`, `/es`, so one choice covers every locale.
- `CONSENT_VERSION = 1`, `CONSENT_MAX_AGE_DAYS = 365` (D-F3 A), for both granted and denied. Use one validator for
  initial reads, cross-tab events and expiry checks. `readConsent()` returns `null` for missing data, malformed JSON,
  a non-object / invalid schema, a version mismatch, an unknown choice, or a missing, unparseable or future `at`.
  A record expires when `now - at >= 365 * 24 * 60 * 60 * 1000` (test the exact boundary). Storage access errors also
  return `null`. Restoring a choice, reopening the banner and receiving a storage event never renew its timestamp.
- `writeConsent(choice)` never throws. If storage fails, the choice still holds in memory for the current page, and the
  banner reappears on the next load (accepted).
- `clearGaCookies(id)` expires `_ga` and `_ga_<id minus "G-">` with `path=/`, for the host and every parent domain of
  `location.hostname` (`a.b.c` → `a.b.c`, `.b.c`, `.c`; the browser ignores invalid ones). It does not touch other
  cookies.
- Bump `CONSENT_VERSION` for a consent-version or material purpose change, including a new non-essential tool or a
  material policy change affecting consent. Old grants and denials become unknown; ask again before loading analytics.
- **Cross-tab fail-closed contract:** handle only this origin's `localStorage` events for `magneto-consent` and
  `key === null` (`localStorage.clear()`). Ignore unrelated keys and `sessionStorage` events. Deleted (`newValue ===
  null`), invalid, wrong-version or expired records immediately invalidate the in-memory grant, call
  `disableAnalytics()` and set `mode = first`. Valid denied records disable analytics and hide the banner; valid granted
  records may load and hide it. Before honoring a grant, re-read and validate current storage so a queued old grant
  event cannot override a newer withdrawal. A failed read closes analytics and asks again. Receiving tabs never write
  back, invent a denial record, refresh `at`, or steal focus merely because the banner appears.
- Revalidate the active choice at its expiry and on page visibility/focus return (including suspended tabs); expiry
  uses the same fail-closed transition. A local in-memory choice after a failed write has the same age limit.

### 3. Analytics loader — `src/utils/analytics.ts` (rewrite, same exports minus `warmAnalytics`)
- **Remove `warmAnalytics`**: a preconnect is a request to Google (E1). It has no callers.
- `loadAnalytics()`: no-op if not configured or there is no current valid grant. The provider owns consent
  transitions; the loader tracks the current authorization and a monotonically increasing generation/token.
  Repeated calls for the same grant share one script promise and initialize once. Set the opt-out flag to `true`
  before the first script request and keep it true while loading; consent permits that request, not premature collection.
  1. Capture the authorized generation; create `window.dataLayer ||= []` and the typed `window.gtag` queue stub before
     injection. Do not queue `config`, `js`, or application events while loading. The stub must drop events until
     initialization succeeds; keep the external `gtagEvent` no-op-without-gtag contract (E5).
  2. Await `thirdParty.loadScript({ src: GA_SCRIPT() })` with **no `crossOrigin`**. A load failure (ad blocker) is caught;
     no UI error. After the same generation check as step 3, keep opt-out true and remove only this generation's stub.
  3. Immediately after every asynchronous boundary, verify that the generation still matches and the current grant
     is valid. A stale completion must not clear opt-out, restore `gtag`, queue commands, or alter a newer grant's state.
  4. Only for the current grant, install the active queue wrapper and clear `window['ga-disable-<ID>']` to `false`.
     Call `gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
     analytics_storage: 'granted' })`, then `gtag('js', new Date())`, then `gtag('config', ID, {
     allow_google_signals: false, allow_ad_personalization_signals: false, ...(!isProd ? { debug_mode: true } : {}) })`.
     `isProd` uses the literal `process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'`; omit `debug_mode` in Production.
     Preview builds also use `NODE_ENV=production`, so that variable cannot distinguish deployment targets.
  Re-Accept after withdrawal uses the existing script/promise, a fresh generation and the same ad-denial/configuration
  protections; it never injects a duplicate script or replays events captured before withdrawal. Repeated Accept while
  already granted sends no duplicate initialization/page view.
- `disableAnalytics()` is synchronous: invalidate the grant/generation **first**, set `window['ga-disable-<ID>'] = true`,
  delete `window.gtag`, discard any unprocessed application analytics commands, and `clearGaCookies(ID)`. No reload.
  Do not treat a retained `dataLayer` as automatically harmless: stale commands must not replay on re-Accept. A retained
  wrapper reference must also check its generation before sending. Do not use a denied Consent Mode ping as withdrawal.
- **Pending-load invariant:** Accept → Reject (or cross-tab invalidation) → delayed script success/failure leaves
  analytics disabled. Removing a script element alone is not cancellation. An already-started script request may
  finish; it cannot initialize measurement, recreate GA cookies or start collection after withdrawal. Requests already
  sent cannot be recalled. A later explicit valid grant is the only way to resume. Prove this with deferred-promise
  unit tests and a throttled real-script browser check; the opt-out flag is not a substitute for race testing.
- `gtagEvent`: **contract unchanged** (no-op without `window.gtag`). Replace its `any` with
  `Record<string, unknown>`, and declare `gtag`/`dataLayer` on `Window` in a typed way. No new `any`.
- Typed globals go in `src/utils/analytics.ts` (`declare global { interface Window { … } }`), not in a new file.

### 4. `src/utils/gtm.ts` — delete (D-F1 A)
No callers (E3). It holds a pre-consent preconnect (`warmGtm`) and a second loader nobody configured. A GTM container
would let tags be added without a code review of consent, so it stays out. Deleting is the smallest safe state.

### 5. Provider + banner — `src/components/organisms/ConsentBanner/` (new)
`index.tsx` (`'use client'`) exports `ConsentProvider` and `usePrivacyChoices()`. `PrivacyChoicesButton.tsx`
(`'use client'`) is the footer control. Also `types.ts`, `ConsentBanner.scss`, tests.

**State** (`mode: 'hidden' | 'first' | 'reopened'`):
| On mount (client only, `useEffect`) | Result |
|---|---|
| not configured | render nothing, ever |
| `readConsent()` = granted | `loadAnalytics()`, `mode = hidden` |
| = denied | `disableAnalytics()` (including stale cookies), `mode = hidden` |
| `null` (none, expired, invalid, version bump) | `disableAnalytics()`, `mode = first` |

| Action | Result |
|---|---|
| Accept | `writeConsent('granted')`, `loadAnalytics()`, `mode = hidden` |
| Reject | `writeConsent('denied')`, `disableAnalytics()`, `mode = hidden` |
| Footer "Privacy choices" | `mode = reopened`, focus moves to the banner heading |
| Escape (only in `reopened`) | `mode = hidden`, choice unchanged, focus back to the footer control |
| Relevant cross-tab `storage` event (including clear) | §2 validator: current grant → load/hide; denial → disable/hide; deleted, invalid or expired → disable/first; never write back |

- **SSR:** the banner renders `null` on the server and on the first client render, then decides in `useEffect`. The
  provider always renders its children. There is no hydration mismatch and no consent decision on the server.
- **Markup:** `<section className="consent-banner" aria-labelledby={h} aria-describedby={b}>`, then
  `<h2 id={h} tabIndex={-1}>` heading, `<p id={b}>` body, two `<button type="button">` (Accept, Reject) and
  `<a href={localizePath('/privacy-policy', locale)}>` (`common.privacyPolicy`). It is a **non-modal region**, not a
  `role="dialog"`. No focus trap, no backdrop, no scroll lock, the page stays usable. There is no close button (the copy
  has none). Without a choice nothing loads, so ignoring the banner equals rejecting.
- **DOM order:** the provider renders the banner **before** `{children}`. So it is the first thing a screen reader or a
  Tab reaches, though it is shown at the bottom.
- **Focus (after the DOM commit that hides the banner):**
  - First show: no autofocus. Capture the last connected, visible, non-inert focused page element before focus enters
    the banner; do not count `body` as a reliable focus destination.
  - Reopened: focus the heading; retain the actual footer trigger element.
  - Accept / Reject in `reopened`, or Escape in `reopened`: restore the connected, visible, enabled, non-inert footer
    trigger. Escape is handled only while focus is inside the reopened banner; it must not intercept a dialog's Escape.
  - Accept / Reject in `first`: if focus was inside the banner, restore the captured page element if still usable;
    otherwise focus the first visible, enabled header link. If that is unavailable, focus the current main-content
    container using temporary `tabIndex=-1`, restoring its original attribute on blur/cleanup. Do not rely on
    `document.body.focus()`; it is not reliably focusable. No extra copy or permanent tab stop is introduced.
  - Use the same fallback when a reopening trigger unmounts (e.g. navigation) and when a cross-tab choice hides a banner
    that contains focus. If focus is already elsewhere, leave it there. Never steal focus from the booking dialog or
    Calendly overlay, including if one opens before a scheduled restoration runs.
  - Verify `document.activeElement` after dismissal and the next Tab / Shift+Tab destination in real browsers. The
    page's normal tab order continues from the restoration target, with no trap and no return to removed controls.
- **Equal prominence (D-F5 A):** Accept and Reject use the **same** class (`btn btn-secondary btn-medium`, existing
  styles), size and weight, side by side (stacked full-width at 375). Accept comes first, as in the copy. The Privacy
  Policy link is a text link.
- **Layout / CLS:** `position: fixed; inset-inline: 0; bottom: 0` (max-width container, centered), `z-index: 1000`. That
  is above the header (10) and below the Calendly overlay (10000). The booking `<dialog>` is in the top layer anyway.
  Bottom padding includes `env(safe-area-inset-bottom)`. A fixed element that appears doesn't move other content, so the
  banner adds no layout shift. Nothing is inserted into the page flow.
- **Focus Not Obscured (WCAG 2.2 2.4.11):** while the banner is visible, set `document.documentElement.style.
  scrollPaddingBottom` to its measured height (a `ResizeObserver` on the banner), and restore the previous value on hide.
  Focused elements then scroll into view above it. Scroll padding doesn't shift layout.
- **375 / iOS Safari:** body text wraps, buttons stack at 100% width, min target 44 px, and the banner is no taller than
  ~50% of the viewport (`max-height: 50vh; overflow-y: auto`). Test with the booking dialog open and closed: its
  `position: fixed` body lock must not move the banner (both are viewport-fixed).
- **Contrast / focus:** AA contrast for text and both buttons, visible `:focus-visible` ring on both buttons and the link.
  Use only existing variables and mixins (kebab-case BEM: `consent-banner__title`, `__body`, `__actions`, `__link`).

**Footer control — `PrivacyChoicesButton`:** a `<button type="button" className="footer__link footer__link--button">`
showing `consent.privacyChoices`. It calls `openPreferences(event.currentTarget)`, which stores the trigger for focus
return, and has `aria-expanded` = banner visible. It is a `<button>`, not an `<a>`, because it opens UI and goes nowhere.
The copy calls it a "link". The visual style matches the other footer links.

### 6. Layout and footer wiring
- `layout.tsx`: wrap `EmailCollectorProvider` with `<ConsentProvider>` (inside `I18nProvider`, which gives it the
  locale). No other change.
- `Footer/index.tsx` (server): append
  `{isAnalyticsConfigured() ? <li><PrivacyChoicesButton /></li> : null}` after the Privacy Policy `<li>` (copy order
  EN :178: Privacy Policy · Privacy choices). The label comes from `useI18n()` inside the button, and the server-rendered
  HTML has it, so there is no shift. Update the header comment.

### 7. Dictionaries (guard-safe)
New block `consent` in `en.ts`, `fr.ts`, `es.ts`, values **verbatim** from `637fba7`:

| Key | EN | FR-CA | ES |
|---|---|---|---|
| `consent.privacyChoices` (banner heading + footer control) | :942 | :1094 (= :1100) | :1098 (= :1104) |
| `consent.body` | :944 | :1096 | :1100 |
| `consent.accept` | :946 item 1 | :1098 item 1 | :1102 item 1 |
| `consent.reject` | :946 item 2 | :1098 item 2 | :1102 item 2 |
| (link) `common.privacyPolicy`, existing | :946 item 3 | :1098 item 3 | :1102 item 3 |

There are no TODO markers, so FR/ES TODO counts are unchanged and the readiness guard is unaffected. **ES remains
editorially draft until G-8 closes; guard-safe is not launch-approved** (O-2, AC-L7). In
`dictionary.test.ts`, add a `CONSENT_COPY` table in the style of `CONTACT_COPY`, using `fromExport`:
- FR heading/buttons: pick `after: ' : '` (the line is fully bold, so the label regex doesn't strip it).
- Buttons: split on `' · '` in the test.
- Assert that heading = footer line for FR (:1094/:1100), ES (:1098/:1104) and EN (:942 vs `:178` second item).
- Assert that the third button equals `common.privacyPolicy`.

Add `consent.*` to the `en.test.ts` fingerprint with source-line comments.

### 8. What does **not** change
`gtagEvent` call sites (E4), `utils/utm.ts` and its `sessionStorage` key, Calendly loading (on click), Google Fonts (E9),
`thirdParty.ts`, `vitest.setup.ts`, the booking dialog.

### 9. Version B fallback and kill switch (no code)
"5f live" means the promoted deployment contains this phase **and** was built with `NEXT_PUBLIC_GA_ID=G-N2YZ6SG2WM`.
| State | Code | Vercel env | Policy §5 on WP (every enabled locale) |
|---|---|---|---|
| 5f live | merged | Exact GA ID verified in each effective Preview / Production build | GA version (EN :853-863), §2/§3/§4 GA lines kept |
| Fallback | merged or not | **unset at build** in the fallback Preview and Production candidate | **Version B**, with its §2/§3/§4 edits (EN :919) |

**Effective build verification (Mauricio, not performed by this document revision):**
- Record deployment URL/ID, source commit, target (Preview / Production), build time, effective public GA ID (or absent),
  effective `NEXT_PUBLIC_VERCEL_ENV`, and observed debug behavior. Check Preview branch overrides and inherited values.
  Screenshots of current settings alone do not prove an existing artifact's configuration; pair build evidence with
  browser network evidence. No private environment values belong in the report.
- D-F4 A: Preview uses the real ID, `debug_mode: true` and a verified GA **Developer traffic / Exclude / Active** filter.
  Verify tagged test traffic while the filter is in Testing, then verify Active state and DebugView behavior; record
  evidence. Allow Google's documented 24–36 h filter propagation window. DebugView alone does not prove exclusion.
  See [Google's developer-traffic filter documentation](https://support.google.com/analytics/answer/13296662?hl=en-4).
- Verify Production independently: expected ID, production target, no debug marker on collected events, and an accepted
  visit in Realtime with debugging extensions disabled. A preview artifact with debug behavior cannot count as a
  passing Production build merely because its URL/domain changed. Vercel documents a rebuild for preview promotion,
  but no rebuild for promotion of a staged production deployment or Instant Rollback; record which path actually ran.
  See [Vercel promotion behavior](https://vercel.com/docs/deployments/promoting-a-deployment).
- For Version B, build a fallback Preview and Production candidate with the ID absent; remove applicable branch
  overrides too. Verify no banner/control, no analytics script/resource hint/network request and no analytics storage
  access, even with a pre-existing valid stored grant. No new GA cookies may appear; existing cookies can remain until
  expiry because the unconfigured build deliberately does not touch cookies. A rejection-only check is insufficient.
  Re-run on the live domain after promotion. Changing Production settings does not disable an older configured build.
- An environment change does not update an already-open page. If disabling an already-live GA release, record this
  limit and verify after reload/navigation to the new build; do not describe an environment toggle as instant revocation.
  Rollback candidates must also match the chosen policy/analytics state; do not restore a GA-on artifact with Version B.

Switching later from fallback to live: (1) publish the GA version of the policy on WP, every enabled locale ("this policy
will be updated first", EN :928); (2) set the env var; (3) redeploy and run AC-L1…L7. Turning GA off after launch is the
reverse order: unset the env var, redeploy, verify the actual served build has no analytics, then switch the policy to
Version B. Before an initial Version B launch, publish Version B in every enabled locale and verify the disabled
candidate before promotion. No environment or WordPress changes are authorized by this documentation assignment.

**December 10 fallback date:** the pinned export has an effective / last-updated date of **3 December 2026**. If launch
moves to **10 December 2026**, Mauricio must explicitly verify the approved effective date against actual publication
and launch timing, resolve any required change in canonical Notion copy for every enabled locale, and verify the
published WP dates before promote (privacy G-3 / §7 item 2). Neither retaining December 3 nor replacing it with December
10 is automatic. This gate applies to GA-on and Version B launches; agents do not edit legal copy.

## Files the Dev may touch
- `src/utils/consent.ts` — new: storage read/write, version, max age, `clearGaCookies`
- `src/utils/consent.test.ts` — new
- `src/utils/analytics.ts` — rewrite per §3 (remove `warmAnalytics`, typed globals, `getGaId`, `isAnalyticsConfigured`,
  `loadAnalytics`, `disableAnalytics`, `gtagEvent` unchanged in behavior)
- `src/utils/analytics.test.ts` — new
- `src/utils/gtm.ts` — **delete** (D-F1 A confirmed)
- `src/components/organisms/ConsentBanner/index.tsx`, `PrivacyChoicesButton.tsx`, `types.ts`, `ConsentBanner.scss`,
  `ConsentBanner.test.tsx` — new
- `src/app/[locale]/layout.tsx` — wrap with `ConsentProvider` only
- `src/components/organisms/Footer/index.tsx` — the conditional `<li>`, comment
- `src/components/organisms/Footer/Footer.scss` — `footer__link--button` (reset button styles to match links)
- `src/components/organisms/Footer/Footer.test.tsx` — the control per locale when configured, absent when not
- `src/i18n/dictionaries/en.ts`, `fr.ts`, `es.ts` — `consent.*` only
- `src/i18n/dictionaries/en.test.ts`, `src/i18n/dictionary.test.ts` — locks and the `CONSENT_COPY` table
- `.env.local.example` — comment for `NEXT_PUBLIC_GA_ID`: public GA4 Measurement ID (`G-…`), **leave empty locally**,
  set in Vercel only; empty = no banner, no analytics (Version B)
- `docs/reports/phase-5f-analytics-consent.md` — the report (incl. the release items AC-L1…L7 for the runbook)

Anything else is out of scope (in particular `vitest.setup.ts`, `thirdParty.ts`, `utm.ts`, `EmailCollectorProvider`,
`calendly.ts`, `package.json`).

## Out of scope
- Google Tag Manager, Consent Mode before consent, server-side tagging, any other analytics (Vercel Analytics etc.).
- Custom events beyond the existing `gtagEvent` calls; GA conversions/key events; GA admin (Mauricio).
- Self-hosting Google Fonts (D-P9 B, D-F8). Removing the `gtag` npm package (D-F9).
- Policy text (Notion → WP, Mauricio). Mailchimp/Brevo (5e). Playwright or any new test dependency.
- A "current choice" indicator or a settings view (no copy, D-F6).

## Acceptance criteria
Local, `ENABLED_LOCALES=en,fr,es`, Dev's own port 3100. "Analytics hosts" = any request whose host matches
`googletagmanager.com`, `google-analytics.com`, `analytics.google.com` or `doubleclick.net`, including their subdomains
(e.g. `region1.google-analytics.com`). Builds A and B:
- **A (configured, fake ID):** `NEXT_PUBLIC_GA_ID=G-LOCALTEST00 PORT=3100 npm run dev` (A2). Never the real ID locally.
- **B (not configured):** the plain `.env.local` (GA ID empty, Hard rule 2).

- [ ] AC-1 Completion gate passes: `npm run lint && npm run typecheck && npm test -- --run && npm run build`. Lint ≤ the
  baseline recorded at the start of the phase. `no-explicit-any` goes down (the `analytics.ts` `any` are removed) and
  never up. `gtm.ts` is gone and `grep -rn "warmAnalytics\|warmGtm\|loadGtm\|gtmPush" src` returns nothing.
- [ ] AC-2 Unit (jsdom, `window.gtag` deleted in `beforeEach`, E5):
  - Before Accept, no `<script src*="googletagmanager">`, no `<link>` to an analytics host, `window.gtag` undefined,
    `dataLayer` undefined. A `fetch` / `sendBeacon` spy is not called with an analytics host.
  - Accept → exactly one script with `src = https://www.googletagmanager.com/gtag/js?id=<ID>`, no `crossorigin`, and
    after script resolution, initialization in this order: consent default (all three ad types denied), `js`, then
    `config` with `allow_google_signals: false` and `allow_ad_personalization_signals: false`. No config or application
    event before successful load. Repeated Accept/Strict Mode effects initialize only once for the current grant.
  - Reject → nothing, including after a remount with stored `denied`.
  - Stored `granted` → loads with no banner. Expired / invalid / old-version value → banner, nothing loaded.
  - Storage that throws → banner, nothing loaded, no crash; failed write still honors the current page's explicit
    choice. Invalid schema/date, future timestamp, exact 365-day expiry and version/purpose bump ask again for both
    prior choices; restoration does not refresh `at`. Fake timers + visibility return prove expiry stops active GA.
  - `NEXT_PUBLIC_VERCEL_ENV=preview` → debug config; `production` → debug field omitted; missing/unknown → debug config
    and cannot pass the Production gate. Missing, empty, whitespace-only, placeholder and GTM IDs all disable the feature.
- [ ] AC-3 Withdraw (unit): Accept → reopen from the footer control → Reject sets `ga-disable-<ID>` to `true`, leaves
  `window.gtag` undefined, makes `gtagEvent` a no-op, and removes `_ga` and `_ga_<suffix>` (jsdom `document.cookie`) while
  an unrelated cookie stays. Re-Accept clears the flag and adds no second script or stale event replay; all ad types
  remain denied. Deferred loader regressions: Accept → withdraw → resolve, Accept → withdraw → reject, and Accept →
  withdraw → re-Accept before resolution. Stale success/failure cannot re-enable analytics or clobber the new grant;
  only the current grant initializes once. Assert opt-out, gtag, cookie and command/event state after settlement.
- [ ] AC-3b Cross-tab (unit + two browser tabs on the same origin): begin with an active grant in the receiving tab.
  Send denial, key deletion, `localStorage.clear()`, malformed JSON/schema/date, wrong version and expired grant/denial.
  All revoke the active grant and stop future collection; denial hides, invalid/deleted/expired shows the first banner
  without autofocus. Include these events during a deferred script load. Valid current grant loads once; stale queued
  grant after a newer denial cannot reload; unrelated keys/sessionStorage do nothing. No receiving-tab write-back.
- [ ] AC-4 Not configured (unit + build B): no banner, no footer control, no `localStorage` read/write, no cookie access,
  even with a pre-seeded valid grant.
- [ ] AC-5 Copy locks: `CONSENT_COPY` rows equal the `637fba7` export lines for en/fr/es. Heading = footer label per
  locale. The link text = `common.privacyPolicy`. The `en.test.ts` fingerprint is updated. FR/ES TODO counts are
  unchanged (AC-14 of 5d-lite still green).
- [ ] AC-6 Browser, build A, `/`, `/fr`, `/es`, clean profile (storage + cookies cleared), DevTools Network with
  "Preserve log": zero requests to analytics hosts on first load, after scrolling, after opening and closing the
  booking dialog, and after navigating to `/contact` and one project page. Then Accept → `gtag/js?id=G-LOCALTEST00`
  is requested (blocked or 404 is fine with the fake ID). Reload → it loads again with no banner. Network export or
  screenshot in the report.
- [ ] AC-7 Browser, build A: Reject in a clean profile → zero analytics-host requests on the same route list.
  `localStorage['magneto-consent']` = `denied`. Reload → no banner.
- [ ] AC-8 Reopen, build A: the footer "Privacy choices" / "Choix de confidentialité" / "Opciones de privacidad" opens
  the banner, focus lands on its heading, and Escape closes it with focus back on the control. Accept → Reject (withdraw)
  → no new analytics-host requests on the page and on the next navigation; `_ga*` cookies gone (Application panel).
  With script response delayed/throttled, Accept then withdraw before completion; release the response and verify no
  collection, cookie recreation or reactivation. An already-started script request finishing is recorded separately,
  not mistaken for a new request. Repeat after a cross-tab deletion/invalid record and confirm re-Accept works once.
- [ ] AC-9 Keyboard / screen reader (build A, 1440 + 375):
  - Tab from page load reaches the banner first.
  - Both buttons and the link are reachable and have visible focus.
  - No autofocus on first show, including cross-tab invalidation.
  - First-show Accept and Reject each restore a usable captured page target or the header/main fallback; assert
    `activeElement`, then Tab / Shift+Tab follows that target's normal order. Reopened Accept, Reject and Escape each
    return to the footer trigger. Repeat with the trigger removed and with focus already outside the banner; no
    lost focus, body-only fallback, or focus theft. Cover these transitions in unit tests and desktop Chrome + real
    iPhone Safari with a hardware keyboard; a synthetic event alone is not evidence of Safari tab order.
  - The region is announced with its heading.
  - With the banner visible, Tab through the whole page: no focused element is hidden behind it (2.4.11).
  - Booking dialog opened from a CTA while the banner is visible: the dialog works and Escape returns focus to the
    trigger (5d-lite behavior). The banner can't be focused while the dialog is open. The Calendly overlay covers the
    banner.
- [ ] AC-10 Viewports 375 / 768 / 1440 × en/fr/es (build A): the banner doesn't overflow horizontally, the buttons look
  the same (D-F5), the banner is ≤ 50vh at 375, and no text is clipped. Screenshots in the report (9).
- [ ] AC-11 CLS: a Lighthouse (mobile) run on `/` in build A, banner shown, has CLS ≤ the same run in build B + 0.01.
  Report both numbers.
- [ ] AC-12 EN unchanged in build B: `/`, `/services`, `/packages`, `/projects`, `/about-magneto`, `/contact`, one project
  page, `/privacy-policy` render as before at 1440 (no banner, footer unchanged from the privacy-route state).
- [ ] AC-13 Guard: `ENABLED_LOCALES=en,fr,es npm run build` without `ALLOW_UNTRANSLATED_LOCALES` fails only on pre-existing
  TODOs (if any), never on `consent.*`.
- [ ] AC-14 UTM: `/?utm_source=test` sets `sessionStorage['utm_params_v1']` as before, in builds A and B, with any consent
  state.

Launch (Mauricio; record evidence, not assumptions. Preview before merge, actual Production candidate and after promote):
- [ ] AC-L1 §9 build record complete for Preview and Production: correct commit/artifact/target, real ID
  `G-N2YZ6SG2WM` replacing the legacy value, effective environment and debug behavior. Record any promotion rebuild's
  new deployment ID and repeat checks on that artifact. No production pass inferred from the Preview settings.
- [ ] AC-L2 Desktop Chrome, clean profile, `/` + every enabled locale: AC-6/7/8 and AC-3b with the real ID, including the
  pending-load race. Preview: debug marker present, visit in DebugView, verified Developer traffic exclusion per §9.
  Production: debug marker absent, accepted visit in Realtime. Denied/withdrawn visits initiate no collection requests;
  absence from GA reports alone is not proof. Record filter testing/activation evidence and propagation time.
- [ ] AC-L3 iPhone Safari (real device): readable banner, both buttons, persistence after reload, reopen, withdrawal,
  booking-dialog coexistence and AC-9 focus/keyboard restoration pass.
- [ ] AC-L4 GA-on: WP policy in every enabled locale uses the GA version with matching Accept / Privacy choices labels,
  already published before GA activation. Version B: corresponding §5 plus §2/§3/§4 edits match the disabled build.
- [ ] AC-L5 Privacy-route §7 D-L check passes, including actual analytics state and the approved effective date. If launch
  moves to December 10, record Mauricio's date verification before promotion; do not silently carry over/change Dec 3.
- [ ] AC-L6 Version B rehearsal: unset-ID fallback Preview and Production candidate meet §9 and AC-4, including a
  pre-existing valid grant, navigation and reload. Evidence proves zero analytics requests and no banner/control; a
  toggle in settings or a rejected consent state is insufficient. If selected for launch, recheck the served domain.
- [ ] AC-L7 G-8 explicitly closed before ES is enabled: policy, banner and footer copy approved in canonical Notion and
  any changed dictionary copy re-exported/re-pinned. Otherwise EN + FR only, for either analytics state.

These launch checks are **not run** by this document revision: implementation and deployment evidence are still future
work. No access to WordPress, GA admin or Vercel configuration is implied by the cited code/export evidence.

## Mid-phase checkpoint (day 1, ≈ 15:00; Mauricio ≈ 15 min)
The Dev stops after `consent.ts`, `analytics.ts`, the provider and the banner in **EN only** (no footer control, no
FR/ES), and before Footer, dictionaries FR/ES and the QA matrix:
1. AC-2, AC-3 (including the pending-load race) and AC-3b green (test output); exercise reopen via a test harness
   until the footer is wired.
2. AC-6 + AC-7 in EN, build A: the network log before and after Accept, and after Reject.
3. One screenshot at 375 and 1440 with the banner. Mauricio confirms the layout and the equal button style.

Go → footer control, FR/ES, copy locks, a11y/viewport/CLS matrix, report. No-go (layout) → SCSS only. No-go (behavior) →
fix before continuing.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | Legacy GA ID still in Vercel at build → data goes to the 2025 property | AC-L1 checks `id=` in the request; replace before the preview build |
| R-2 | Something loads Google analytics before consent (a future `warm*` call, a GTM tag) | `warmAnalytics` and `gtm.ts` deleted; AC-2 and AC-6 tests; no GTM (§4) |
| R-3 | "No request to Google" read literally fails on Google Fonts (E9) | ACs name analytics hosts; D-F8 |
| R-4 | Policy says GA is on/off but the deployment does the opposite | §9 table; AC-L4; privacy §7 item 5 |
| R-5 | Preview pollutes reports, or Production is silently filtered | §9 / AC-L1–L2: effective build target, debug marker and tested Active developer filter; verify Production separately |
| R-6 | Safari ITP 7-day cap → banner re-shown, users re-counted (A6) | Accepted; noted in the report |
| R-7 | Banner hides focused elements or the footer at 375 | Scroll padding (2.4.11), ≤ 50vh, AC-9/10 |
| R-8 | Ad blockers block `gtag.js` → unhandled rejection | Load errors caught (§3); no UI |
| R-9 | Conflicts with 5e (both edit dictionaries; 5e may touch `EmailCollectorProvider` and the footer) | 5f edits only the files listed; the later branch rebases; the `consent` block is self-contained |
| R-10 | ES banner wording changes at G-8 (O-2) | Dictionary follow-up via re-export; copy-lock test catches drift |
| R-11 | 5f not accepted by Mon 11-30 | Fallback = GA ID unset + Version B (§9). The 12-03 release doesn't wait |
| R-12 | Hydration: the banner renders on the server | Banner renders `null` until `useEffect` (§5); unit test that SSR markup has no banner and still contains the page |
| R-13 | Pending load or stale storage event restores withdrawn consent | Generation checks, fail-closed validation, AC-3/3b/8 |
| R-14 | Launch moves to December 10 but policy dates are assumed | Mauricio re-verifies G-3 and published dates; AC-L5 |

## Decisions confirmed
Mauricio confirmed these decisions before this assignment (2026-11-04). They are no longer recommendations.
Final Senior Architect approval of the corrected document remains pending; see the approval record above.

| ID | Decision |
|---|---|
| **D-F1 A** | Delete unused `src/utils/gtm.ts`; no GTM container. |
| **D-F2 A** | Only after a valid analytics grant, deny `ad_storage`, `ad_user_data`, `ad_personalization`; disable signals and ad personalization. |
| **D-F3 A** | 365-day lifetime for grant and denial; re-ask on expiry or consent version / material purpose change. |
| **D-F4 A** | GA on Preview with verified debug tagging and Developer traffic exclusion; verify effective Production configuration independently. |
| **D-F5 A** | Equal Accept/Reject prominence: identical button styling, size and weight. |
| **D-F6 A** | No additional current-choice copy. |
| **D-F7 A** | Create [ADR 0007](../adr/0007-consent-gated-analytics.md), Status Accepted. |
| **D-F8 A** | Keep and disclose Google Fonts; defer self-hosting until after launch. |
| **D-F9 A** | Remove the unrelated `gtag` dependency in a separate PR; no dependency change in 5f. |
| **D-F10** | Implement November 25–26; November 30 fallback gate. |

## Estimate
| Work | Dev (agent) | Mauricio |
|---|---:|---:|
| Spec review + decisions | — | 30–45 min |
| GA admin (done 11-04); "Developer traffic" filter + enhanced measurement check (D-F4, A4) | — | 10–15 min |
| `consent.ts` + `analytics.ts` + tests | 1.5–2 h | — |
| Provider + banner (EN) + tests + SCSS | 2–2.5 h | — |
| Checkpoint | 0.25 h | 15 min |
| Footer control, dictionaries ×3, copy locks | 1–1.5 h | — |
| Browser matrix (AC-6…AC-14: 3 locales × 3 widths, keyboard, Lighthouse) | 1.5–2 h | — |
| Gate + report | 1 h | 20–30 min (review) |
| Vercel env (replace legacy ID, Preview per D-F4) + redeploy | — | 15 min |
| Deployment checks AC-L1…L7 (desktop + iPhone) | — | 45–60 min |
| Policy §5 state on WP at go/no-go (GA version or Version B, per locale) | — | 15–30 min |
| **Total** | **≈ 7.5–9.5 h** | **≈ 2.5–3.5 h** |

**Calendar** (D-F10 confirmed; dates in 2026):
- **Wed 11-25 – Thu 11-26:** implementation after 5e (Mon–Tue 11-23/24). Wed: EN behavior + race/storage tests,
  checkpoint ≈ 15:00. Thu: footer, FR/ES, copy locks, focus/viewport/CLS matrix and report.
- Start developer-filter validation early enough to allow its propagation window. Fri 11-27: Mauricio verifies
  Preview and prepares Production / Version B build evidence. Merge only after the required Preview checks pass.
- **Mon 11-30 hard fallback gate:** if the GA-on acceptance and Preview checks (AC-L1…L4 as applicable before release,
  including verified developer-traffic handling) have not passed, select Version B. Verify AC-L6 and publish matching
  policy before launch; 5f delay does not move the launch. Production-only checks remain mandatory at release.
- Tue 12-01 go/no-go: confirm GA-on or verified Version B, policy publication, G-8 (otherwise EN + FR), and effective
  date. Thu 12-03 release; if the wider release moves to Thu 12-10, re-verify the policy date per §9 / AC-L5.
- Later activation follows §9: policy published first, configured build second, deployment checks before release.
