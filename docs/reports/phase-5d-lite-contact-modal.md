# Phase 5d-lite report — Contact form (6 fields), no Mailchimp, booking modal variant B + accessibility

- Spec: `docs/specs/phase-5d-lite-contact-modal.md` (rev 3, Approved 2026-11-02)
- Author: Dev (Claude) · Date: 2026-11-02 · Branch: `feat/phase-5d-lite` @ `d78c631` (working tree, nothing staged or committed)
- Status: **Mid-phase checkpoint. Part 1 + Option A approved technically (Senior Architect) and visually (Mauricio),
  2026-11-02. Test re-pin done (`page-metadata.test.ts`; `en.json` + `content.test.ts` approved and applied). Full gate
  green except the pre-existing lint baseline. Part 2 (§5–§6), V1 and V2 not started (fresh session).**

## Result
Part 1 is implemented, and so is Option A (the single Calendly event):
- the 6-field inquiry form in EN/FR/ES
- `/api/contact` hardened, with no Mailchimp call and no success-without-delivery fallback
- the Contact page with its dictionary supporting copy and the secondary CTA
- the honeypot
- the form dictionary keys
- the Privacy link on the form

Typecheck and build pass. Lint has no new finding. Tests: all new and changed tests pass. 9 tests fail, and they fail identically at `HEAD` (see Gate). The browser checks for `/contact` EN at 375/768/1440 pass for all five states.

---

## Mid-phase checkpoint (for Mauricio + Senior Architect)

Scope of this checkpoint is the Senior Architect's consolidated instructions of 2026-11-02, item 3:
- §1, §2, §3 (incl. AC-21), §4, §7
- §8 (form keys), §9 (form), and their §10 tests
- Option A

**Not done:** §5–§6 (booking modal variant B, the native `<dialog>` evaluation, dialog a11y), D-10, the modal keys, V1.

### What to look at
1. **`/contact` EN, all states, at 375 / 768 / 1440.** Screenshots are listed under Evidence. Run locally with `PORT 3100`, `agent:start`, and `DISABLE_SMTP=1`.
   - **Empty.** The hero shows "Prefer to talk?" + "Book a Free Strategy Call" (secondary style). Below it: the 3 supporting lines, the required legend, the 6 fields, the submit button, and the privacy line with its link.
   - **Inline errors.** Shown after an empty submit:
     - 5 messages; Website is optional, so it gets none
     - `aria-invalid` on the 5 invalid fields
     - focus on Name
     - no request sent
   - **Sending.** The button is disabled with `aria-busy="true"`. The label stays "Send project details" (D-11a). The existing spinner pseudo-element shows.
   - **Send failure.** The alert text is exactly `sendFailed`. "book a free strategy call" is an inline button: 29 px tall at 375/768, 32 px at 1440. The form values are kept.
   - **Success.** The form is replaced by the title and body block (`role="status"`), which receives focus. Server response: `{ success: true, delivered: false }`.
2. **AC-21 button → booking modal.** The button opens the **current (old) modal** ("Quick — before we book", Name + Email). It was checked to open only, then closed with its close button; it was not submitted (consolidated item 4).
   - After close, focus does not return to the button. This is the known E19 defect, fixed in Part 2 §6.
3. **Other heroes unchanged (AC-9).** Home, Services, Packages, About and Projects at 1440 still show their CMS hero CTA and no `.hero-secondary`. Home and Services screenshots are included.
4. **Visual decisions to confirm now, not at the end:**
   - Secondary CTA = `btn-secondary` (white button, purple text) beside "Prefer to talk?". It wraps under the text at 375 (D-3: "confirm at the checkpoint").
   - Error style: dark red text (#b42318) with a decorative icon, and a red border on the control.
   - Helper text and the required legend: #606060.
   - Privacy link: underlined, #371b97.
   - The send-failure control is an outlined inline button inside the red alert.
   - On `/contact` only, the required `*` now follows the label text inline (the long problem/goal label wrapped and pushed the `*` to the far right at 375).

### Numbers so far
- **P-1 diff check:** pass (Evidence §1).
- **API tests:** `contact.test.ts` 13/13 (the 2 existing tests are kept).
- **TODO counts now: FR 63 / ES 62.** The 20 old `contactForm` TODO leaves are gone. Part 2 removes the 5 `emailModal` booking keys → **FR 58 / ES 57** (AC-14). The guard build fails listing exactly 63 / 62.
- **Supporting copy** comes from the dictionary; the page renders no `contactContactTexts`. A test feeds the CMS mock with "Request Free Quote" and "48 hours" and asserts neither renders.

### Checkpoint review (Senior Architect, 2026-11-02)
- **Part 1: approved technically**, pending Mauricio's visual check of the screenshots in
  `~/Documents/projects/magneto/backups/phase-5d-lite/screenshots/`.
- **Decisions recorded:**
  - D-3: the secondary CTA wrapping below "Prefer to talk?" at 375 is accepted.
  - The `*` right after the label text is approved.
  - The AC-8 `curl` match on "Request Free Quote" in the RSC script data is accepted: it is not visible, and the key is removed later.
- **Authorized deviation: re-pin the tests broken by the `ffec355` re-export** (mechanical; no behaviour change). The line maps come from `git diff -U0 01ff73f ffec355 -- docs/content` and were verified on every line of each export; only the export-date header lines 5–6 differ, as expected.

  | Locale | Old lines | Shift |
  |---|---|---|
  | EN | ≤ 554 | unchanged |
  | EN | 555–643 | +6 |
  | EN | 644–860 | +24 |
  | EN | ≥ 861 | +26 |
  | FR | ≤ 787 | unchanged |
  | FR | ≥ 788 | +18 |
  | ES | ≤ 803 | unchanged |
  | ES | ≥ 804 | +18 |

  1. `src/utils/page-metadata.test.ts`: **done.** SEO block heading lines:
     - EN contact 652→676, dangel 971→997, trepied 1082→1108, shamanicca 1217→1243
     - FR contact 796→814
     - ES contact 812→830

     Each new line was checked to be an "SEO" heading. Header comment updated. 36/36 green.
  2. `scripts/phase-5c/content/en.json` (the loader's content file) + `scripts/phase-5c/content.test.ts`: **approved by the Senior Architect (source hash and line refs to `ffec355` only; EN copy written by the loader unchanged) and applied, 2026-11-02.** Diff:
     ```diff
     --- scripts/phase-5c/content/en.json
     -    "commit": "01ff73f",
     -    "sha256": "870b8573013427b3ba57afc3301d864f30c9ee32fb89363eeb243c265daee16d"
     +    "commit": "ffec355",
     +    "sha256": "9f9d57eed41678f0441b91a338f086cfbcdc2834fb4812b095848be76e687ca9"
          (contact) heroContent.heroTitle      -  "src": "EN 573"   +  "src": "EN 579"
          (contact) heroContent.subtitleHero   -  "src": "EN 575"   +  "src": "EN 581"
     --- scripts/phase-5c/content.test.ts
     -  it('is pinned to the current export (docs/content @ 01ff73f)', …
     +  it('is pinned to the current export (docs/content @ ffec355)', …
     -    expect(EN.source.sha256).toBe('870b8573…daee16d');
     +    expect(EN.source.sha256).toBe('9f9d57ee…e687ca9');
     ```
     - **The EN copy the loader writes is unchanged.** All 27 fields across the 6 posts were compared on (key, label, value, subfields) and are identical. Only `source.commit`, `source.sha256` and two `src` line refs change.
     - Old EN 573/575 and new EN 579/581 hold the same text ("Tell me about your website project." / "Share a few details … next step.").
     - `load-content.php` aborts unless `source.sha256` matches the export, so this sha must change for the loader to run against `ffec355` at all.
     - Dry run: on a clean `HEAD` snapshot with the two proposed files, `content.test.ts` + `ServicesList.test.tsx` are 16/16 green.
     - `ServicesList.test.tsx` needs **no edit**: it reads `EN.source.sha256` from `en.json`.

### Visual check (Mauricio, 2026-11-02): **APPROVED**
Pre-launch design follow-ups (not blockers, not done in Part 1):
1. Desktop `/contact`: make the illustration sticky so the right column isn't empty beside the long form.
2. The send-failure inline control could look more like a text link.
3. Contrast of the small grey text: verify ≥ 4.5:1 now, and fix in Part 1 if it fails → **done, results below.**

### Contrast check (follow-up 3; measured in the browser)
- Method: Chrome, built `/contact` on 3100 at 988 px wide (font sizes as rendered there).
- Each value is computed from the element's computed colour over its composited background. The failure and success states were triggered in-page; the success state came from 1 dry-run submit with `DISABLE_SMTP=1`, verified before.
- Every text is small (12–16 px), so the AA threshold is **4.5:1** throughout.

| Element | Colour / background | Size | Ratio | AA |
|---|---|---|---:|---|
| Required legend (`.contact-form__required-note`) | #606060 / #ffffff | 12 px | **6.29** | pass |
| Helper text (website, problem, budget) | #606060 / #ffffff | 12 px | **6.29** | pass |
| Privacy line text | #606060 / #ffffff | 12 px | **6.29** | pass |
| Privacy link (underlined) | #371b97 / #ffffff | 12 px | 11.89 | pass |
| Inline field error | #b42318 / #ffffff | 12 px, 600 | 6.57 | pass |
| Send-failure alert text | #991b1b / #fdecec | 12 px | 7.30 | pass |
| Send-failure inline control | #371b97 / #ffffff | 12 px, 700 | 11.89 | pass |
| Success title / body | #166534 / #e9f9ef | 14 / 12 px | 6.55 | pass |
| Labels, supporting copy | #171717 / #ffffff | 14–16 px | 17.93 | pass |
| **Required `*` on labels (`.form-field__required`)** | **#e74c3c / #ffffff** | 14 px, 700 | **3.82** | **fail → fixed** |

- **Fix (Part 1, `form-field.scss`):** `.form-field__required` changed from `#e74c3c` to `#b42318`, the error red already used. Re-measured after a rebuild: **6.57:1**.
  - The `*` is `aria-hidden`, but it is the visible required cue that the legend explains, so it is treated as text.
  - The class is also used by `molecules/FormField.tsx`, which is rendered nowhere (`grep`), so no other page changes.
- The hero secondary line ("Prefer to talk?", white) sits on the hero background **image**, so the measured #171717 is only the CSS fallback colour. It is visually the same white-on-dark treatment as the existing hero title and subtitle; not measured on the image.

### Final checkpoint gate (2026-11-02, after both re-pins and the `*` contrast fix)
| Check | Command | Result |
|---|---|---|
| lint | `npm run lint` | exit 1, **pre-existing only**: 104 errors / 96 warnings / 87 `no-explicit-any` (5b baseline 108 / 99 / 91); no new finding |
| typecheck | `npm run typecheck` | **passed** (exit 0) |
| tests | `npm test -- --run` | **passed**: 39 files / 528 tests, 0 failures |
| agent-gate node test | `node --test scripts/agent-gate.node-test.mjs` | **passed**: 9 / 9 |
| EN build (guard active) | `ENABLED_LOCALES=en npm run agent:build` (no `ALLOW_UNTRANSLATED_LOCALES`) | **passed** (exit 0), 14 static pages, `/en/contact` SSG |

### Next
Part 2 (§6.0 native `<dialog>` evaluation, §5, §6, modal keys, §9 modal, D-10, a1–a3 prefill, then V1 on the single event) starts in a fresh session. **Not started.**

---

## Changes (Part 1 + Option A)

| File | What |
|---|---|
| `src/utils/inquiry.ts` (new) | Need/budget codes, `validateInquiry` shared by the form and the API (§1); limits used as `maxLength`. |
| `src/utils/inquiry.test.ts` (new) | Each rule; `example.com` / `www.example.com`; all codes; locale fallback (11 tests). |
| `src/pages/api/contact.ts` | Mailchimp, `md5`/`crypto` and both fallbacks deleted. Flow: 405 → honeypot (silent 200) → 400 `fields` → `DISABLE_SMTP=1` dry-run (before any transport) → send → 200 / 500 `delivery` / 500 `server`. No `details`, error text or env info in any response. `replyTo` = submitter. Subject CR/LF stripped. HTML values escaped, newlines → `<br>`. EN labels for codes. 6 fields + form language. |
| `src/__tests__/api/contact.test.ts` | The 2 existing tests kept, plus handler tests (a)–(h), (f2) SMTP not configured, (g2) unexpected throw, and an AC-2 source grep. |
| `src/components/organisms/ContactForm.tsx` | Rewritten (§3), same exports and no props. 6 fields in copy order; labels with `aria-hidden` `*`; helpers and errors via `aria-describedby`; `aria-invalid`; focus on the first invalid field; `noValidate` (messages are ours). States: sending / success / failure. Send-failure alert with the inline `CalendlyButton` (A6). Honeypot. Privacy line + localized link. No placeholders. Form `aria-label` removed (D-13). |
| `src/components/organisms/ContactForm.test.tsx` | Rewritten: EN/FR/ES copy, order, codes, a11y attributes, honeypot, validation, 400 mapping, sending, success, 500 / network / non-JSON, AC-21 (EN/FR/ES) — 22 tests. |
| `src/app/[locale]/contact/page.tsx` | Supporting lines from the dictionary; no `contactContactTexts`; `HeroLoader requireInternalCta` + `.hero-secondary` child; `any` cast removed. |
| `src/app/[locale]/contact/api.ts`, `types.ts` (new) | Query without `contactContactTexts` (ADR 0006 Am. 2); typed response; `any` removed; null → 404 unchanged. |
| `src/app/[locale]/contact/api.test.ts`, `page.test.tsx` (new) | Query has no `contactContactTexts`. Page test: EN/FR/ES supporting lines, no CMS text, no "48 hours", `requireInternalCta`, secondary CTA, `openModal` without `customUrl`, 404. |
| `src/components/organisms/Hero/HeroLoader.tsx` | Optional `children` passed to `Hero` (the only public API change, additive). |
| `src/components/organisms/Hero/HeroLoader.test.tsx` (new) | `children` rendered; CMS CTA kept without `requireInternalCta`, suppressed with it. |
| `src/utils/calendly.ts` | **Option A:** `targetUrl` is always `calendlyConfig.url`; `customUrl` stays in the type (documented as ignored) so callers compile unchanged. |
| `src/utils/calendly.test.ts` (new) | Popup widget, new window, iframe fallback: always the single event, even with a CMS `customUrl`; utm behaviour unchanged. (a1–a3 and D-10 tests are Part 2.) |
| `src/i18n/dictionaries/en.ts`, `fr.ts`, `es.ts` | `common.privacyPolicy`; new `contactForm.*` (27 canonical + 8 P-1 + derived `sendFailedCta`); `contactPage.{preferToTalk,supporting.*}`; old `contactForm` keys removed (incl. the 24–48 h string). EN: OQ-7 comment removed, values unchanged. |
| `src/i18n/dictionaries/en.test.ts` | Fingerprint updated, with an export line reference on every new key. |
| `src/i18n/dictionary.test.ts` | `phase5d` done-set; AC-12 pin rewritten to 63/62 (Part 1). **New:** every Contact key equals its `ffec355` export line in EN/FR/ES (reads `docs/content`); `sendFailed` includes `sendFailedCta` ×3; M9 keeps its literal `*`; SLA guard. |
| `src/styles/components/form-field.scss` | `.form-field__help`, `.form-field__error` (colour + icon), `:focus-visible` outline on controls; required `*` colour #e74c3c → #b42318 (contrast 3.82 → 6.57, checkpoint follow-up 3). |
| `src/styles/components/contact-form.scss` | Required legend, privacy line + link, success block, off-screen honeypot, inline send-failure control, focus styles, inline `*` on contact labels. |
| `src/components/organisms/Hero/Hero.scss` | `.hero-secondary` only. |
| `.env.local.example` | `DISABLE_SMTP=1` documented (local dry-run, never in Vercel). |

Not touched: `docs/content/*`, `.env.local`, ADRs, CMS, Calendly, Vercel, Header / CalendlyButton / FinalCTA / PackageCard / LeadMagnet, `EmailCollectorProvider` (Part 2).

## Gate

| Check | Result | Notes |
|---|---|---|
| lint | **failed (pre-existing only)** | 104 errors / 96 warnings / 87 `no-explicit-any`, vs the 5b baseline 108 / 99 / 91. Removed: 2 `any` in `contact.ts`, 1 in `contact/api.ts`, 1 in `contact/page.tsx`. In touched files, only pre-existing findings remain (`calendly.ts` 6 `any` + unused vars; 2 `as any` in the kept `contact.test.ts` tests). No new finding. Per file + rule was compared against E26 and the earlier output; a stash-based diff was refused, so no automated before/after. |
| typecheck | **passed** | `tsc --noEmit` exit 0. |
| tests | **passed** (after the authorized re-pin) | 39 files / 528 tests, 0 failures. At first, 9 tests failed, and they failed identically on a clean `HEAD` (`d78c631`) snapshot because the `ffec355` re-export moved lines while the tests still pinned `01ff73f`. Fixed by the authorized re-pin (Deviation 11). |
| agent-gate node test | **passed** | `node --test scripts/agent-gate.node-test.mjs` 9/9. |
| build | **passed** | EN: `ENABLED_LOCALES=en npm run agent:build` (guard active) exit 0. Local trilingual: `ALLOW_UNTRANSLATED_LOCALES=1` build exit 0, `/[locale]/contact` SSG en/fr/es. Trilingual without the override: the guard fails as designed, `fr … 63`, `es … 62` (Part 1 numbers; 58/57 after Part 2). |
| visual | **passed for the checkpoint scope** | `/contact` EN, 375/768/1440, 5 states; other heroes EN 1440. FR/ES `/contact` → 404 locally (no FR/ES contact page, E10 → AC-19 launch QA). Modal checks are Part 2. |

## Evidence

### 1. P-1 diff check (AC-17)
```
$ shasum -a 256 docs/content/*
9f9d57ee…e687ca9  magneto-copy-en.md      (= header)
4fd0d5cb…212e7b35 magneto-copy-es.md      (= header)
138cbec3…ec25551  magneto-copy-fr-CA.md   (= header)
$ git diff 01ff73f ffec355 --stat -- docs/content
 3 files changed, 71 insertions(+), 9 deletions(-)
```
- The 4b → key mapping is confirmed: 8 strings × EN/FR/ES, none extra, none missing. Every §8.2 value equals the export.
- The values were extracted from the export by script and are pinned by a test that re-reads the export lines.
- One stripping rule beyond §8.1: the Markdown escape `\$` in the EN/FR budget options (EN 624–627, FR 762–765) becomes `$`.

### 2. API (AC-2, AC-7)
- `grep -n -i mailchimp src/pages/api/contact.ts` → no match.
- `contact.test.ts` 13/13, including:
  - (a) with `MAILCHIMP_*` set, `fetch` is never called
  - (e) `DISABLE_SMTP=1` → `createTransport` is not called
  - (f) the 500 body is exactly `{ success:false, code:'delivery' }`, without SMTP/recipient values
  - (g) the dev / `ALLOW_CONTACT_FALLBACK` fallback is gone
  - (h) escaping, `replyTo`, subject, EN labels

### 3. AC-8 (no response-time promise)
- `grep -rn -i -E "24\s*[–-]\s*48|48 ?h(ours)?|48 heures|48 horas" src` finds only `contact/page.test.tsx:27,37`: the CMS fixture that proves the text is *not* rendered, and the test title. The SLA guard test itself uses a regex that doesn't match this grep.
- `curl -s localhost:3100/contact | grep -c -e "48 hours" -e "Request Free Quote"` returns **1**. The match is inside the RSC `<script>` payload: the serialized dictionary key `cmsFallback.requestQuote` ("Request Free Quote", Phase 4 key used by the hidden `LeadMagnetSection`). Outside `<script>`: "48 hours" 0, "Request Free Quote" 0. **Nothing visible renders either string.** Recorded as a deviation from the literal AC command.

### 4. Local safety (AC-18)
- `DISABLE_SMTP=1` was verified (value only) before the first submit and again after the restart.
- 3 local submits (375 / 768 / 1440). The server log has 3 × `DISABLE_SMTP=1: inquiry not delivered` and no transport errors. No email was sent. No CMS, Calendly or production write.
- Servers: my own `agent:start` on 3100 (PIDs 11654, then 11982 after the rebuild). Both were stopped by PID; port 3000 was not used.
- CMS check before captures: `magneto-cms-2.local/graphql` 200. The trimmed contact query was run on the local schema: EN page returns its image; FR/ES have no node.

### 5. Browser method
- The Chrome window can't exceed 988 px on this display. So each width was rendered as a **same-origin iframe of exactly 375 / 768 / 1440 px** (scaled to fit for the screenshot) and driven by page scripts.
- `scrollWidth` equalled the width in every state (no horizontal scroll).
- The failure state used an in-page `fetch` override that rejects `/api/contact` (the network-error path). DevTools request blocking isn't reachable from the automation.

Screenshots (18 files, outside the repo) in `~/Documents/projects/magneto/backups/phase-5d-lite/screenshots/`:
- 375:
  - `375-01-empty-before-asterisk-fix.jpg` (hero + top of the form, before the `*` fix)
  - `375-02-empty.jpg`
  - `375-03-errors-top.jpg`, `375-04-errors-bottom.jpg`
  - `375-05-sending.jpg`
  - `375-06-send-failure.jpg`
  - `375-07-ac21-old-modal.jpg`
  - `375-08-success.jpg`
- 768: `768-01-empty.jpg`, `768-02-errors.jpg`, `768-03-send-failure.jpg`, `768-04-success.jpg`
- 1440: `1440-01-empty.jpg`, `1440-02-errors.jpg`, `1440-03-send-failure.jpg`, `1440-04-success.jpg`
- AC-9 / AC-16 heroes at 1440: `1440-ac9-services-hero.jpg`, `1440-ac9-home-hero.jpg`

## Deviations from the spec
1. **D-8 revised (approved, Senior Architect + Mauricio, 2026-11-02).** Calendly's free plan allows **one event** for all locales: `calendly.com/magnetomarketing/free-strategy-call`.
   - P-2 is done on that event: 3 optional one-line questions after Name/Email, in order: "Your website (if you have one)", "What do you need help with?", "What is the main website problem or goal?" (a1–a3).
   - This replaces "both events" in D-8, P-2, V1 and AC-13: V1 runs once per locale on the single event.
   - Post-launch backlog: one event per locale (paid plan), or trilingual question labels on the single event.
2. **Option A (approved, Senior Architect, 2026-11-02): Out of scope widened only for `calendly.ts` URL resolution.**
   - `openCalendlyPopup` always uses `calendlyConfig.url` and ignores `customUrl`, for the popup, the iframe fallback and the new window, whatever the trigger.
   - Tests are in `calendly.test.ts`. No component API changed (`customUrl` props remain, now inert).
3. **Checkpoint scope** = Part 1 + Option A (consolidated instructions item 3). The spec's checkpoint lists Part 1 only; Option A was added.
4. **TODO counts at the checkpoint are FR 63 / ES 62**, and the AC-12 pin in `dictionary.test.ts` says so. 58 / 57 follow in Part 2 when the 5 `emailModal` booking keys go.
5. **AC-8 `curl` count = 1**, not 0. It comes from the serialized dictionary in the RSC payload, not rendered HTML (Evidence §3).
6. **Browser method:** iframe at exact widths instead of resizing the window, and an in-page `fetch` rejection instead of DevTools request blocking (Evidence §5).
7. **`src/types/nodemailer.d.ts`** (not in my file list) declares neither `replyTo` nor `tls`. `contact.ts` extends the declared parameter types locally instead of editing that file (no `any`).
8. **Inline required `*` on `/contact` labels** (`.contact-form .form-field__label { display:block }`): a small layout choice not in the spec, scoped to the contact form.
9. **`:focus-visible` outline on every `.form-field__control`** (`form-field.scss`). This includes the download branch of the current modal, so that modal gets a visible focus ring. No other visual change.
10. **Vitest classic JSX runtime (Known debt).** New tests that render `CalendlyButton` / `HeroLoader` set `globalThis.React`, as `CalendlyButton.test.tsx` and `Hero/api.test.ts` already do.
11. **Authorized (Senior Architect, 2026-11-02): re-pin of the tests broken by the `ffec355` re-export.** Files outside the spec's list:
    - `src/utils/page-metadata.test.ts` (done)
    - `scripts/phase-5c/content/en.json` + `scripts/phase-5c/content.test.ts` (diff shown, approved, applied)

    Mechanical line and sha pins only. No behaviour change, and no change to the copy the loader writes.
12. **Accepted at the checkpoint:** D-3 wrapping at 375, the inline `*`, and the AC-8 script-data match (items 5 and 8 above).
13. **Required `*` colour changed** to meet 4.5:1 (checkpoint follow-up 3). This is a visible colour change of a pre-existing class, limited to `/contact` in practice.

## Issues found (not fixed)
1. **9 pre-existing test failures at `HEAD` `d78c631`.** They are caused by the `ffec355` re-export: line pins to `01ff73f`. Resolved by the authorized re-pin (Deviation 11). The suite is green.
2. **Stale Calendly links in the local CMS → Cleanup/Contract backlog** (read-only check, 2026-11-02). With Option A the site ignores them.

   | Locale | Page (id) | Field | Value |
   |---|---|---|---|
   | EN | services (34), about-magneto (32), projects (38), contact (41), packages (36), carte (533) | `heroContent.ctaLinkHero` | `mauriciobayuelo/free-discovery-call` |
   | FR | projects (558) | `heroContent.ctaLinkHero` | `mauriciobayuelo/free-discovery-call` |
   | EN/FR/ES | home (2/535/536) | `heroContent.ctaLinkHero`, `finalCtaSection.ctaLink` | `magnetomarketing/free-strategy-call` (the single event) |
   | EN | about-magneto (32) | `aboutData.calendlyUrl` | `magnetomarketing/free-strategy-call` (not read by the page) |

   Production was not checked (hard rule 1); it likely mirrors this.
3. `src/types/nodemailer.d.ts` is narrower than nodemailer's real options (no `replyTo`, `tls`). Widen it in a tooling phase.
4. `CalendlyButton size="sm"` emits the class `btn-sm`, but `button.scss` defines `.btn-small`, so `size="sm"` has no style. The send-failure control is styled through its own class.
5. The current (old) modal returns focus to an unrelated input after close, not to the trigger (E19). This is in Part 2's scope.
6. `AGENTS.md` Known debt quotes a lint baseline of 115 / 110 (after Phase 4); the 5b report and this spec use 108 / 99 / 91. Numbers here are compared with the spec's.
7. `/fr/contact` and `/es/contact` return 404 locally (no FR/ES contact page) → AC-19 launch QA, as the spec expects.
8. **Pre-launch design follow-ups (Mauricio, not blockers):**
   - a sticky illustration on desktop `/contact`
   - a more link-like send-failure control

   Both are for the Senior Architect to place: Part 2, or a later polish item.

## Commit plan (not staged; Mauricio runs it)
Order matters: each commit typechecks on its own. Commits 1 and 2 touch tests and test data only.

```bash
# 1. Re-pin (tests only)
git add 'src/utils/page-metadata.test.ts'
git commit -m "test(seo): re-pin SEO block lines to the ffec355 copy export"

# 2. Loader content re-pin (approved)
git add 'scripts/phase-5c/content/en.json'
git add 'scripts/phase-5c/content.test.ts'
git commit -m "test(content): re-pin phase-5c en.json source to the ffec355 export (copy unchanged)"

# 3. Inquiry model
git add 'src/utils/inquiry.ts'
git add 'src/utils/inquiry.test.ts'
git commit -m "feat(contact): shared inquiry model for the form and the API"

# 4. Form + dictionaries
git add 'src/i18n/dictionaries/en.ts'
git add 'src/i18n/dictionaries/fr.ts'
git add 'src/i18n/dictionaries/es.ts'
git add 'src/i18n/dictionaries/en.test.ts'
git add 'src/i18n/dictionary.test.ts'
git add 'src/components/organisms/ContactForm.tsx'
git add 'src/components/organisms/ContactForm.test.tsx'
git add 'src/styles/components/form-field.scss'
git add 'src/styles/components/contact-form.scss'
git commit -m "feat(contact): 6-field project inquiry form with EN/FR/ES dictionary copy"

# 5. API
git add 'src/pages/api/contact.ts'
git add 'src/__tests__/api/contact.test.ts'
git add '.env.local.example'
git commit -m "fix(api): contact sends one escaped email, no Mailchimp, no success without delivery"

# 6. Contact page + hero
git add 'src/app/[locale]/contact/page.tsx'
git add 'src/app/[locale]/contact/api.ts'
git add 'src/app/[locale]/contact/types.ts'
git add 'src/app/[locale]/contact/api.test.ts'
git add 'src/app/[locale]/contact/page.test.tsx'
git add 'src/components/organisms/Hero/HeroLoader.tsx'
git add 'src/components/organisms/Hero/HeroLoader.test.tsx'
git add 'src/components/organisms/Hero/Hero.scss'
git commit -m "feat(contact): dictionary supporting copy and secondary booking CTA"

# 7. Calendly (Option A)
git add 'src/utils/calendly.ts'
git add 'src/utils/calendly.test.ts'
git commit -m "fix(calendly): always open the single booking event (D-8 revised)"

# 8. Report
git add 'docs/reports/phase-5d-lite-contact-modal.md'
git commit -m "docs(phase-5d-lite): mid-phase checkpoint report"
```

## Time
Agent active time ≈ 2.5 h (estimate, includes the CMS check, browser checks and the report). Human time: unknown.
