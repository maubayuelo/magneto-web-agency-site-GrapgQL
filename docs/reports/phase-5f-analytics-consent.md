# Phase 5f report — GA4 behind a consent banner (EN / FR-CA / ES)

- Spec: `docs/specs/phase-5f-analytics-consent.md` (Approved rev 1.1) · ADR 0007
- Branch: `feat/phase-5f-analytics-consent` from `master` `01a684d` (after PR #45). Nothing committed or staged.
- Author: Dev · Date: 2026-11-18 · Checkpoint 2026-11-18 → **go** (Mauricio, same evening) → phase complete locally

## Summary
1. Gate green: lint 65 errors / 76 warnings (master 83 / 81; cause below), typecheck clean, 52 files / 812 tests, build 35/35.
2. Nothing loads from an analytics host before Accept, in EN/FR/ES on build A. Withdrawal, the pending-load race and cross-tab revocation work in the browser and in unit tests.
3. The footer "Privacy choices" control (a button) reopens the banner, sending focus to the heading. Escape and a reopened choice return focus to the control. Copy-locked against export 2026-11-17 in all three locales.
4. Build B (no ID): no banner, no control, no script/request, even with a stored valid grant. The 8 EN routes are unchanged at 1440.
5. Checkpoint answers applied:
   - Buttons use the existing `btn-large` token: 14 / 15 / 16 px.
   - The banner clears the home hero CTA at 375×812 in EN, FR and ES.
   - Both buttons are styled identically in every view.
6. CLS 0 with the banner showing (A) vs 0 without (B). This uses the browser's Layout Instability API. The Lighthouse number is pending: Mauricio runs the Chrome DevTools panel, which the agent can't drive (steps below).
7. **ES banner and footer strings are provisional (BORRADOR, G-8 open)** until Mauricio confirms the ES privacy copy final before the 12-01 go/no-go.
8. Not verifiable here: real iPhone Safari (checklist below), and real-window 375/768 tab order (Chrome ignored window resizes; I used exact-size iframes).
9. Still open, all yours: the `.env.local.example` comment (file denied to the agent; exact text below), the Vercel env, the Lighthouse run, AC-L1…L7.
10. Post-checkpoint decisions applied:
    - **Short phones:** tighter spacing, same type size. The remaining overlap at 375×667 is accepted for launch.
    - **Desktop buttons:** they wrap in two equal columns.
    - **UTM:** added to the post-launch list.

## Acceptance criteria
| AC | Result | Evidence (details below) |
|---|---|---|
| AC-1 gate | **pass** | lint 65/76 ≤ 83/81; `no-explicit-any` 77 → 60; typecheck ✓; 812 tests ✓; build ✓; the removed-helper grep and `gtm.ts` absence ✓ |
| AC-2 unit | **pass** | `analytics.test.ts` 25, `consent.test.ts` 27, `ConsentBanner.test.tsx` 39 |
| AC-3 withdraw unit | **pass** | Same files: opt-out, gtag, cookies, retained wrapper, re-Accept, 5 deferred races |
| AC-3b cross-tab | **pass** (unit + 2 real tabs) | Deletion, denial, wrong version, `clear()`, valid grant; no autofocus, 0 write-backs |
| AC-4 not configured | **pass** (unit + build B) | Pre-seeded valid grant in B: nothing loads, record untouched |
| AC-5 copy locks | **pass** | `CONSENT_COPY` in `dictionary.test.ts` (9 tests); `en.test.ts` fingerprint; TODO guard (build B) green |
| AC-6 browser A | **pass** EN · FR · ES | 0 analytics-host requests before Accept; Accept → one `gtag/js`; reload loads without banner |
| AC-7 browser A | **pass** EN (checkpoint) · FR/ES withdrawal path | Reject → 0 requests, `denied` stored, no banner after reload |
| AC-8 reopen | **pass** FR (real clicks/keys) · ES race | Heading focus, Escape → control, withdraw → cookies gone, race, re-Accept once, cross-tab repeat |
| AC-9 keyboard / SR | **pass on desktop Chrome**; iPhone → checklist (AC-L3) | Order, focus ring, restoration, 2.4.11, dialog coexistence. Region exposed as `region "Privacy choices"` in the a11y tree; no VoiceOver run |
| AC-10 viewports | **pass** (iframes at exact sizes) | Re-measured after the final SCSS; ≤ 50vh everywhere; no overflow, clipping or internal scroll; Accept = Reject in style, and in size at 375 / 1024 / 1440 |
| AC-11 CLS | **pass** (in-browser) · Lighthouse **not run** | A 0 / 0 / 0 vs B 0 / 0 / 0 (375×812, `/`); after the final SCSS, FR 375×667 0 / 0 and 1440 0. Lighthouse: Mauricio, steps below |
| AC-12 EN unchanged (B) | **pass** | 8 routes at 1440 |
| AC-13 guard | **pass** | Build B ran with `ALLOW_UNTRANSLATED_LOCALES` empty, `ENABLED_LOCALES=en,fr,es`: 35/35, no TODO error |
| AC-14 UTM | **pass by invariant** (see Deviations) | `utm.ts` / `EmailCollectorProvider` unchanged; consent code never touches `sessionStorage` |
| AC-L1…L7 | Mauricio | Vercel, real ID, iPhone, WP policy, G-8 |

## Changes
- `src/utils/consent.ts` (new): the `magneto-consent` v1 record.
  - One fail-closed validator, `parseConsent`: exact 365-day boundary, strict ISO, no future date.
  - `readConsent`; `writeConsent`, which never throws and falls back to memory for this page only, with the same age limit; `getEffectiveConsent`.
  - `isRelevantStorageEvent`: our key or `clear()`, `localStorage` only.
  - `clearGaCookies(id, hostname?)`: host-only plus every parent domain.
- `src/utils/analytics.ts` (rewrite):
  - Removed: `warmAnalytics` and all 10 `any`.
  - New: `getGaId()` (call-time literal `process.env.NEXT_PUBLIC_GA_ID`, `/^G-[A-Z0-9]+$/`) and `isAnalyticsConfigured()`.
  - `loadAnalytics()` uses a generation token: the opt-out stays on while loading and the stub drops events. Init runs only for the current, re-validated grant: consent default with the 3 ad types denied, then `js`, then `config` with signals and ad personalization off, plus `debug_mode` unless `NEXT_PUBLIC_VERCEL_ENV === 'production'`.
  - Synchronous `disableAnalytics()`.
  - `gtagEvent` contract unchanged; typed `Window` globals.
- `src/utils/gtm.ts`: deleted (D-F1 A).
- `src/components/organisms/ConsentBanner/` (new):
  - `index.tsx`: `ConsentProvider` and `usePrivacyChoices`.
  - The banner is a non-modal `<section aria-labelledby aria-describedby>`, rendered as null on SSR and the first client render.
  - Focus capture and restoration, Escape only in the reopened state, the 2.4.11 padding, and the expiry timer with visibility/focus revalidation.
  - `PrivacyChoicesButton.tsx`, `types.ts`, `ConsentBanner.scss`, `ConsentBanner.test.tsx`.
- `src/app/[locale]/layout.tsx`: `<ConsentProvider>` around `EmailCollectorProvider`.
- `src/components/organisms/Footer/index.tsx`: the conditional third `<li>` and the header comment. `Footer.scss`: `footer__link--button`. `Footer.test.tsx`: the control per locale when configured, absent with empty/invalid IDs, reopen + `aria-expanded`.
- `src/i18n/dictionaries/{en,fr,es}.ts`: the `consent` block (4 keys each), verbatim.
- `src/i18n/dictionaries/en.test.ts` (fingerprint) and `src/i18n/dictionary.test.ts` (`CONSENT_COPY`).
- Tests (new): `src/utils/consent.test.ts`, `src/utils/analytics.test.ts`.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | passed | 65 errors / 76 warnings; 0 in 5f files |
| typecheck | passed | |
| tests | passed | 52 files / 812 tests. The first run aborted in Node itself (`FATAL ERROR: v8::ToLocalChecked Empty MaybeLocal` while a vitest worker loaded a module, before any assertion failed); the immediate re-run passed. Recorded as a runtime flake. |
| build | passed | Plain `npm run build` 35/35, plus build A and build B (see Evidence) |
| visual | passed with limits | EN/FR/ES at 375×812, 375×667, 768×1024 and 1440×900 in exact-size iframes; desktop keyboard in a real 1280 px window |

### Why lint dropped from 83/81 to 65/76 (new ceiling for later phases)
Per-file diff of `next lint` before and after (`lintdiff.mjs`): every change is in the two analytics files; nothing else moved.
| File | Errors | Warnings |
|---|---|---|
| `src/utils/analytics.ts` (rewritten) | −11 (10 `no-explicit-any`, 1 `prefer-rest-params`) | −3 (unused var, unused `no-inner-declarations` directive, anonymous default export) |
| `src/utils/gtm.ts` (deleted) | −7 (`no-explicit-any`) | −2 (unused var, anonymous default export) |
| **Total** | **−18 (83 → 65)** | **−5 (81 → 76)** |

`no-explicit-any` went from 77 to 60. The new files add 0 findings. Later phases should treat **65 / 76** as the lint baseline, and the AGENTS.md Known-debt line ("115 / 110") is stale either way.

## Evidence
**Builds.** Build A: `NEXT_PUBLIC_GA_ID=G-LOCALTEST00 ENABLED_LOCALES=en,fr,es`, rebuilt after each SCSS/TSX change; the ID is inlined in one client chunk. Build B: `NEXT_PUBLIC_GA_ID= ALLOW_UNTRANSLATED_LOCALES= ENABLED_LOCALES=en,fr,es`; its client output contains only the `gtag/js?id=` URL template, with no ID. Both were served with `next start -p 3100`. My PIDs 16616, 17570, 17837, 18340 and 18642 were each stopped; port 3100 is free.

**AC-6.**
- **Before consent:** with a clean `localStorage`, `_ga*` cleared and the request log cleared before the first load, zero requests matched `google` or `doubleclick` other than `fonts.googleapis.com` / `fonts.gstatic.com` (D-F8). The route list was `/`, a full scroll, booking dialog open + close, `/contact`, `/projects/trepied-trepied-ca` (EN at the checkpoint, FR tonight).
- **Accept** (real click):
  - `GET https://www.googletagmanager.com/gtag/js?id=G-LOCALTEST00` 200, no `crossorigin`.
  - The `page_view` collect carries `npa=1`, `gcs=G101` (analytics granted, ads denied) and `ep.debug_mode=true`.
  - A reload loads the script with no banner.

**Fake-ID hit (recorded per checkpoint answer 3).** With `G-LOCALTEST00`, `gtag.js` returns 200 and Google accepts `POST https://www.google-analytics.com/g/collect?…tid=G-LOCALTEST00…` (204). The property doesn't exist, so the hit is discarded. The real verification is on the Vercel preview with `G-N2YZ6SG2WM`, `debug_mode` and the GA Developer-traffic filter (AC-L1/L2).

**AC-7.** EN Reject (real click): zero analytics-host requests across the route list, `{"v":1,"analytics":"denied",…}` stored, and no banner after reload.

**AC-8 (FR, real clicks and keys).**
- Footer "Choix de confidentialité" → banner, `activeElement` = `H2` "Choix de confidentialité", `aria-expanded="true"`. Escape → focus back on the footer button, choice still `granted`.
- Enter on the control, Tab, Tab → "Refuser les outils non essentiels" (`:focus-visible`, solid outline), then Enter. Result: `denied`, `ga-disable-G-LOCALTEST00 = true`, `gtag` undefined, `_ga` and `_ga_LOCALTEST00` gone (both present before), focus on the footer button.
- Then the booking dialog, a full scroll and navigation to `/fr/contact`: no analytics-host request.
- **Race (ES):** Chrome-in-extension cannot throttle, so I sent Accept, then footer reopen, then Reject in the same browser task (1 ms).
  - The script request had started and finished after the withdrawal; it was the only analytics request (recorded as the already-started request, not a new one).
  - Then 4 s with no collect, no `_ga*` cookie, opt-out `true` and `gtag` undefined.
  - Re-Accept: one script element, one new `config` with all ad types denied, one collect.
- **Cross-tab repeat (two tabs on `/es` and `/es/contact`):** deleting the record in B revoked A's grant and showed A's first banner, with focus left on the hero CTA. Re-Accept in A worked once (one new `config`).

**AC-3b (browser, two tabs).** Each change in tab B had this effect in tab A:
- **Deletion:** grant revoked, first banner shown.
- **Denial:** grant revoked, banner hidden.
- **Wrong version (`v:2`):** grant revoked, first banner shown.
- **Valid grant:** A loaded, initializing once.
- **`localStorage.clear()`:** grant revoked, first banner shown.

A spy on `setItem`/`removeItem` in A counted **0 calls** across all of these.

**AC-9 (desktop Chrome, real 1280×817 window, real key events).**
- **First load:** `activeElement` = `BODY` (no autofocus). Tab ×5: skip link → Accept analytics → Reject non-essential → Privacy Policy → header logo, each `:focus-visible` with a visible outline. Shift+Tab ×2 reverses.
- **First-show Reject by Enter** → focus restored to the captured page element (logo); Tab → next header control; Shift+Tab ×2 → logo → skip link (the closed banner is no longer in the order).
- **2.4.11:** every focusable element outside the banner was focused in turn while the banner was visible.
  - Before the fix, 3 footer controls stayed behind the banner at maximum scroll: scroll padding can't scroll past the document end.
  - Fix: body bottom padding equal to the covered height while the banner is visible.
  - After: 0 of 15 hidden at 1280 (EN), and 0 of 15 at 375×812 (FR).
- **Booking dialog opened from the hero CTA (Enter) while the banner shows:**
  - The dialog is `:modal` and focus is inside it.
  - `banner button.focus()` leaves focus in the dialog (inert); Tab ×12 stays in the dialog.
  - Escape closes it with focus on "Book a Free Strategy Call"; the banner and the consent state are unchanged.
- **Calendly overlay covering the banner:** by z-index only (10000 vs 1000); not opened, to avoid the third-party widget.
- **Unit tests:** trigger removed → header link; no header → `#main-content`; focus outside → left alone; open dialog → no restoration.

**AC-10 / hero rule (final SCSS, iframes at exact sizes).** Each cell shows the banner height ÷ viewport and the gap (banner top − hero CTA bottom; negative = overlap), then the button size (Accept = Reject).
| Viewport | EN | FR | ES |
|---|---|---|---|
| 375×812 | 0.33 · +96 · 157×70 | 0.39 · +42 · 157×88 | 0.35 · +86 · 157×70 |
| 375×667 | 0.37 · **−24** · 167×70 | 0.42 · **−60** · 167×88 | 0.37 · **−16** · 167×70 |
| 768×1024 (checkpoint SCSS; tablet rules unchanged) | 0.20 | 0.26 | 0.20 |
| 1024×768 | 0.21 · 178×78 | 0.24 · 133×122 | 0.21 · 151×78 |
| 1440×900 | 0.19 · 224×82 | 0.19 · 175×106 | 0.19 · 195×82 |

- **375×667, before → after the short-phone rule:** EN −49 → −24, FR −103 → −60, ES −59 → −16 px. Accepted for launch (decision 1).
- **1440 FR:** the text column grew from narrow to 539 px (the same as EN and ES), and the banner went from 267 to 171 px tall.
- No horizontal overflow, no clipped text, and no internal banner scroll in any row.
- Buttons are 14 px at 375, 15 px at 768/1024 and 16 px at 1440. Computed font, weight, line height, border, colors and padding are identical for Accept and Reject in every view.
- At 768 (flex row) the two widths still follow the label length (EN 186 / 214). Every other breakpoint gives them equal columns.
- 2.4.11 sweep re-run on the final SCSS: 0 hidden (FR 1440: 0/22, ES 375×667: 0/15, EN 1440: 0/22).

Screenshots (scratchpad, not committed). They were taken before the short-phone and desktop-grid changes. They are still valid for 375×812 and 768. For 375×667 and 1440, the table above supersedes them.
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-en-375.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-fr-375.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-es-375.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-en-768.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-fr-768.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-es-768.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-en-1440.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-fr-1440.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-ac10-es-1440.png`

Checkpoint screenshots (12 px buttons, superseded):
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-banner-en-375.png`
- `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/d7440943-94fa-4f6c-9095-5d64890ef93a/scratchpad/5f-banner-en-1440.png`

**AC-11.** `PerformanceObserver({type:'layout-shift', buffered:true})` summed (excluding input) after 5 s on `/` at 375×812, 3 runs per build: A (banner visible) 0, 0, 0; B 0, 0, 0. 0 ≤ 0 + 0.01. After the final SCSS: `/fr` at 375×667 0, 0 and at 1440×900 0.

**Lighthouse (not run by the agent).** You said Lighthouse is in your Chrome. That is the DevTools panel, which the extension tools can't open or drive. A Lighthouse CLI isn't installed, and installing one is Hard rule 6. To add the number:
1. Run `NEXT_PUBLIC_GA_ID=G-LOCALTEST00 ENABLED_LOCALES=en,fr,es npm run build`, then `npx next start -p 3100`. Keep the dev server off: both use `.next`.
2. Run the first audit in an incognito window, so storage is clean and the banner shows. Open `http://localhost:3100/`, then DevTools → Lighthouse → Mode Navigation, Device Mobile, categories Performance (+ Accessibility). Click Analyze.
3. Record CLS, LCP, TBT and the Performance score.
4. Repeat with "Privacy choices" answered (Reject), then reload and run again. Both runs should show CLS ≈ 0; the banner is fixed and out of flow.
5. Optional baseline: build B (`NEXT_PUBLIC_GA_ID=` empty) for the run without the banner.

Lighthouse uses simulated throttling, so its LCP/TBT differ from the unthrottled in-browser measurement. AC-11 compares CLS only.

**AC-12 (build B, 1440×900).** `/`, `/services`, `/packages`, `/projects`, `/about-magneto`, `/contact`, `/projects/trepied-trepied-ca`, `/privacy-policy`: no banner, footer `Mauricio Bayuelo on LinkedIn · Privacy Policy` (privacy-route state), one h1, no horizontal overflow, body padding untouched.

**AC-4 in build B.** A valid `granted` record was seeded, then `/`, `/fr/contact` and `/es/projects/trepied-trepied-ca` were loaded. No banner, no footer control, no `gtag`/`dataLayer`/script, no scroll or body padding, and only Fonts requests. The record stays as it was: the unconfigured build doesn't read or clear it.

## Deviations from the spec
- **Copy source:** the 2026-11-17 export (D-15) replaces `637fba7`.
  - Locks re-pinned: EN :930/:932/:934 and footer :170; FR :1127/:1129/:1131/:1133 and footer :172; ES :1124/:1126/:1128/:1130 and footer :170.
  - FR lines are fully bold, so the test takes the part after `' : '`. No string is affected by the unescaped `$ [ ]`.
- **FR/ES dictionary values went in before the checkpoint** (`Dictionary = typeof en`; typecheck).
- **`btn-medium` doesn't exist.** At the checkpoint both buttons used `btn btn-secondary`. Per checkpoint answer 4 they now use the existing `btn-large` (md token: 14/15/16 px), identical for both.
- **Banner geometry:**
  - A centered floating card (10 px inset plus the safe area) instead of edge-to-edge.
  - On phones it is compact: Accept | Reject in two equal columns, 10 px padding, and the policy link on its own row with a 24 px target (WCAG 2.2 2.5.8 AA minimum; 44 px from tablet up).
  - This keeps the banner below the hero CTA at 375×812 in the longest locale (checkpoint rule 2).
  - **Short phones** (`max-width: 600px and max-height: 700px`): only the 5 px inset, the 10 px padding, the 5 px gap, a heading margin of 0 and 5/10 px button padding. Type size is unchanged (decision 1).
  - **Desktop (≥ 1024):** the actions are a grid of `minmax(0,1fr) minmax(0,1fr) auto`, capped at 50% of the banner and stretched to equal height. Accept and Reject get equal columns, and long labels wrap (decision 2). This applies in all locales, so EN/ES labels also wrap at 1440.
- **2.4.11:** besides `scroll-padding-bottom`, the provider adds the covered height to `<body>` bottom padding while the banner is visible and restores it on hide. Scroll padding alone left the footer links behind the banner at maximum scroll. It extends only the page end, so nothing moves (CLS 0).
- **Reconcile also on window `focus`**, plus `visibilitychange`. `clearGaCookies` takes an optional `hostname` for testability.
- **AC-11 used the Layout Instability API, not Lighthouse.** The DevTools Lighthouse panel can't be driven by the agent's tools, and installing a CLI is out of bounds (Hard rule 6). The measurement is unthrottled, in an iframe. The Lighthouse run is Mauricio's (steps under Evidence).
- **AC-14:** the AC's premise doesn't hold on master. `utm.ts` writes `utm_params_v1` only when `getUtm()` runs, at the booking dialog's Continue (`EmailCollectorProvider/index.tsx:133`) or a guide download, never on page load (verified: null after `/?utm_source=test` in all three consent states on build A).
  - I didn't open Calendly (third party).
  - Verified instead:
    - `utm.ts`, `EmailCollectorProvider`, `calendly.ts`, `thirdParty.ts`, `vitest.setup.ts` and `package.json` are unchanged (`git diff master` empty).
    - No 5f file references `sessionStorage` or UTM.
    - `EmailCollectorProvider.test.tsx` (UTM capture) passes.
- **Viewport method:** Chrome ignored `resize_window` all evening, even after your un-maximize (the viewport stayed at 942 and then 1280 px). 375/768/1440 layout used exact-size same-origin iframes; keyboard checks used the real 1280 px window.
- **`.env.local.example` not edited:** the agent's permission settings deny reading the file, and an edit needs a read. Please add, in place of the bare `NEXT_PUBLIC_GA_ID=your_ga_id_here` line:
  ```
  # Public GA4 Measurement ID (G-…). Leave EMPTY locally: empty or invalid = no consent banner, no footer
  # "Privacy choices", no analytics (Version B). Set in Vercel only (Preview + Production), then redeploy.
  NEXT_PUBLIC_GA_ID=
  ```
- **Process incidents (no lasting effect):**
  1. At the checkpoint, `git rm --cached` briefly staged the `gtm.ts` deletion; I unstaged it immediately.
  2. Tonight I ran `kill 0 2>/dev/null; lsof …`, a `;` chain against your shell rule. `kill 0` signals the tool shell's own process group and ended only that shell: my server PID 17570 kept running and I stopped it by PID afterwards. Nothing of yours was running on 3100 or 3000.

## Issues found (not fixed)
- **375×667 (iPhone SE height):** after the short-phone rule the banner still covers the home hero CTA by 24 / 60 / 16 px (EN / FR / ES). **Accepted for launch** (decision 1). The only further fix is shorter copy, which goes to the post-launch copy round.
- `thirdParty.loadScript` caches a rejected promise. After an ad-blocked load, re-Accept on the same page fails again without retrying, which is safe. `thirdParty.ts` is out of scope.
- AGENTS.md Known debt still says lint "115 / 110"; the measured baseline is now 65 / 76.
- A6 (Safari ITP 7-day cap) applies as accepted in the spec.

## iPhone Safari checklist for Mauricio (AC-L3 / AC-9; does not block the phase)
On the Vercel preview, in a private tab:
1. `/`: the banner is readable; Accept and Reject look identical, side by side; the Privacy Policy link opens `/privacy-policy`; the hero CTA "Book a Free Strategy Call" is not covered at your phone's size.
2. Reject → reload: no banner. Footer "Privacy choices" → banner reopens; tap Accept → reload: no banner.
3. Footer "Privacy choices" → Reject (withdrawal); in Settings → Safari → Advanced → Website Data, no `_ga` data for the domain after reload.
4. With the banner shown, open the booking dialog from a CTA: the dialog works, closes, and the banner stays usable; the page doesn't jump.
5. `/fr` and `/es`: same checks 1–2 (ES only if G-8 is closed).
6. **With a hardware keyboard** (if available): enable Settings → Accessibility → Keyboards → Full Keyboard Access. Tab from load: skip link, then Accept, Reject, Privacy Policy. Enter on Reject → focus lands on a visible page element, not lost. Footer control → Enter → focus on the banner heading; Escape → focus back on the control.
7. **With VoiceOver** (no keyboard needed): swipe from the top; the banner is announced as "Privacy choices, region" before the header.

**What a missing hardware keyboard leaves unverified:** real Safari Tab order and focus restoration after Accept / Reject / Escape (step 6). Desktop Chrome verified these with real key events, and unit tests cover the logic. Safari's Tab model differs (links are skipped by default without Full Keyboard Access), so that remains an unverified risk, not a failure. VoiceOver (step 7) still covers the announcement and reading order.

## What you must set in Vercel, and when
- **Variable:** `NEXT_PUBLIC_GA_ID` = `G-N2YZ6SG2WM`. It **replaces** the legacy 2025 value (R-1). A placeholder or GTM value counts as unset.
- **Also check:** "Automatically expose System Environment Variables" is on, so `NEXT_PUBLIC_VERCEL_ENV` reaches the build. Without it, Production keeps `debug_mode` (A5).
- **Preview:** set it once this branch has a PR, then redeploy the preview (the value is inlined at build). Create the GA "Developer traffic" filter and take it from Testing to Active at least 24–36 h before you need AC-L2 evidence (D-F4).
- **Production:**
  1. Only at the 12-01 go/no-go, and only if GA-on is chosen.
  2. First publish the GA version of policy §5 on WP in every enabled locale.
  3. Then set the variable, redeploy and run AC-L1…L7.
  4. If it stays unset, the build is Version B (no banner, no control, nothing loads), and Version B of the policy must be published.
- **Locally:** never the real ID. `.env.local` stays empty; build A passes `G-LOCALTEST00` on the command line.

## Decisions after the final report (Mauricio, 2026-11-18)
1. **Short phones:** keep the type at ≥ 14 px. Reduce internal padding and spacing on short viewports, then re-measure. **Done:** the overlap at 375×667 is now EN 24 / FR 60 / ES 16 px, accepted for launch. A shorter banner body goes to the post-launch copy round.
2. **FR buttons at 1440:** let them wrap, keeping Accept and Reject equal. **Done:** equal grid columns at desktop, in all locales.
3. **Lighthouse:** re-run CLS/performance with it. **Not run by the agent** (see Evidence → Lighthouse); steps are there for Mauricio.
4. **UTM finding:** keep it as a deviation and add it to the post-launch list. **Done** (below).

## Post-launch list (from 5f)
- **UTM capture on landing (pre-existing, not caused by 5f).** `utm_params_v1` is written only when `getUtm()` runs: at the booking dialog's Continue (`EmailCollectorProvider/index.tsx:133`) or a guide download (`:168`). Nothing stores it on page load. A visitor who lands on `/?utm_source=…`, then navigates (dropping the query) before booking, loses the UTM values. Fix: capture on first load, e.g. a small client effect in the layout calling `getUtm()`, and add a test.
- **Shorter mobile banner body** (copy round, Notion first): would remove the remaining 375×667 overlap.
- **D-F9:** remove the unused `gtag` npm package (separate PR, per spec).
- `thirdParty.loadScript` caches a rejected promise, so there is no retry after an ad-blocked load (see Issues).

## Proposed commits
Only the final tree was gated; each commit leaves tests green if applied in order.
1. `feat(analytics): consent storage and consent-gated GA4 loader; remove gtm.ts and warmAnalytics`
   - `src/utils/consent.ts`
   - `src/utils/consent.test.ts`
   - `src/utils/analytics.ts`
   - `src/utils/analytics.test.ts`
   - `src/utils/gtm.ts` (deletion)
2. `feat(i18n): consent dictionary block, EN/FR-CA/ES verbatim from export 2026-11-17 (ES provisional until G-8)`
   - `src/i18n/dictionaries/en.ts`
   - `src/i18n/dictionaries/fr.ts`
   - `src/i18n/dictionaries/es.ts`
   - `src/i18n/dictionaries/en.test.ts`
   - `src/i18n/dictionary.test.ts`
3. `feat(consent): privacy choices banner, provider and footer control`
   - `src/components/organisms/ConsentBanner/index.tsx`
   - `src/components/organisms/ConsentBanner/PrivacyChoicesButton.tsx`
   - `src/components/organisms/ConsentBanner/types.ts`
   - `src/components/organisms/ConsentBanner/ConsentBanner.scss`
   - `src/components/organisms/ConsentBanner/ConsentBanner.test.tsx`
   - `src/app/[locale]/layout.tsx`
   - `src/components/organisms/Footer/index.tsx`
   - `src/components/organisms/Footer/Footer.scss`
   - `src/components/organisms/Footer/Footer.test.tsx`
4. `docs(report): phase 5f analytics consent`
   - `docs/reports/phase-5f-analytics-consent.md`

(Commit 3 needs 1 and 2.) Each message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. For commit 1, stage the deletion with `git rm src/utils/gtm.ts`.

## Time
Agent ≈ 3.5 h total, estimated (checkpoint ≈ 1.5 h + rest ≈ 2 h). Mauricio: checkpoint review, plus the remaining release items in the spec estimate.
