# Phase 5d-lite — Contact form (6 fields), no Mailchimp, booking modal variant B + accessibility

- **Status: Approved** (Senior Architect + Mauricio, 2026-11-02) — rev 3. Dev implements **Mon–Tue 2026-11-09/10**.
- **Remaining preconditions (Mauricio):**
  - **P-2** — Calendly custom questions on both events, **before V1 on Tue 11-10**.
  - **P-3** — Vercel env names only (Production + Preview), **before AC-20**.
  - P-1 is done (`ffec355`).
- **ADR 0006 Amendment 2** (decided by the Senior Architect, 2026-11-02; text in "Other specs and docs affected"
  item 1). The Senior Architect adds it to `docs/adr/0006-phase-5-content-model.md`. The Architect role writes only
  this spec.
- Author: Architect (Claude) · Reviewed by: Mauricio + Senior Architect.
- Branch: `spec/phase-5d-lite` from `origin/master` @ `c85e45a` (5a + 5b merged, PR #23). This file is unstaged.
- Depends on: [5b spec](phase-5b-services-packages-seo.md) rev 9 ("Other specs and docs" item 2, OQ-3, Q-A3, §11),
  [5b report](../reports/phase-5b-services-packages-seo.md) ("Launch-blocking item for 5d-lite"), [ADR 0005](../adr/0005-ui-dictionaries.md),
  [ADR 0006](../adr/0006-phase-5-content-model.md) (`contactContactTexts.supportingHtml` row; Amendment 2), [ADR 0002](../adr/0002-brevo-replaces-mailchimp.md).
- Canonical copy: Notion. Exports `docs/content/*` as of **`ffec355`** ("docs(content): re-export EN/FR-CA/ES 2026-11-02
  …", this branch). sha256: EN `9f9d57ee…e687ca9`, FR-CA `138cbec3…ec25551`, ES `4fd0d5cb…212e7b35`.
  **Every `EN n` / `FR n` / `ES n` below is a line of that export.** If a later export moves lines, section titles
  govern. The P-1 strings (§8.2) are in this export (4b sections + EN B2 line). The previous export `01ff73f`
  (5b E17 hashes) is only the base for the P-1 diff check.

## Revision
**Rev 3 (2026-11-02 — Senior Architect review: APPROVED with resolutions).**
1. **OQ-7 confirmed** as closed in the rev 2 update: EN values are unchanged and only the comment goes; FR/ES stay TODO.
2. **A6 changed.** In the send-failure alert, the booking phrase is a **button-styled control that opens the booking
   modal**:
   - EN "book a free strategy call"
   - FR "réserver un appel-conseil gratuit"
   - ES "agenda una llamada de orientación gratuita"

   The copy text is unchanged: the full `sendFailed` value still renders verbatim. One derived key,
   `contactForm.errors.sendFailedCta`, is added; it holds the phrase and must be a substring of `sendFailed`. Design
   §3, §8.2 (M7a), tests §10 and new **AC-21**. Key total 41 → 42. TODO counts unchanged (the key is filled ×3).
3. **The `*` in the M9 legend is text:** confirmed (§8.1 note unchanged).
4. **ADR 0006 Amendment 2 decided:**
   - The Contact page no longer renders `contactContactTexts` (5d-lite, D-2).
   - The fields stay in the schema (expand/contract) and are removed in the Cleanup/Contract phase.
   - No schema change now.

   The text is in "Other specs and docs affected" item 1; the Senior Architect applies it to the ADR file.
5. Status → **Approved**. The header lists the remaining preconditions P-2 and P-3.
6. Clean-up: the stale "FR 56 / ES 55 if OQ-7" note in "Other specs" item 3 is removed.

**Rev 2 (2026-10-31 — Mauricio's decisions; D-2 by the Senior Architect).** All decisions as recommended except
D-2. In detail:
1. **D-1 = B2.** Answers are prefilled into Calendly custom questions. The B2 privacy line is enabled only after V1
   (Dev, local, no booking) and V2 (Mauricio: one real booking, confirm answers, cancel). The B1 design and the
   "B1 vs B2" branches are removed.
2. **D-2 = C2 (Senior Architect).** The 3 supporting lines live in the **dictionary**: 3 new keys, filled verbatim
   EN/FR/ES. The Contact page no longer renders any `contactContactTexts` text. There is no loader dependency, the
   loader rev 3 handoff is dropped, and an ADR 0006 annotation is needed (Senior Architect; became Amendment 2 in
   rev 3).
3. **D-3, D-4 (Need required), D-5 (length only), D-6 (modal questions optional), D-7 (both fallbacks removed),
   D-8 (same 3 questions on both Calendly events), D-10, D-11 ("* Required" legend, no "Sending…"), D-12 (honeypot
   only), D-13 (form `aria-label` removed), D-14 (Privacy link now; launch gated by D-L):** accepted as recommended.
4. **D-9.** Custom dialog, no new library. The Dev **first evaluates native `<dialog>` + `showModal()`** and uses it
   if it meets every a11y AC in the supported browsers; the choice and evidence are recorded (§6, AC-11).
5. **OQ-4.** The modal keeps its own Notion copy for the website hint ("optional") → new key
   `bookingModal.websiteHelp`. **OQ-5:** plain text for "Not sure yet" is acceptable.
6. **P-1 status: DONE.** Strings are Final in Notion (approved 2026-10-31): EN "4b. Form messages" + EN B2 modal
   privacy line; FR "4b. Messages du formulaire"; ES "4b. Mensajes del formulario"; FR/ES B2 lines already existed.
   Re-exported to `docs/content` in `ffec355` (2026-11-02). The Dev's P-1 diff check stays, against this export.
7. Key and TODO counts updated:
   - canonical keys 29 → **33** (+3 supporting, +1 modal website hint)
   - P-1 keys = M1–M7 + M9 (M8 dropped)
   - TODO after the phase **FR 58 / ES 57** (unchanged)
8. P-2 (Calendly questions) and P-3 (Vercel env names) remain Mauricio's preconditions.

**Rev 2 update (2026-11-02 — P-1 re-export landed, Architect).** No decision changed.
1. Copy references moved from `01ff73f` to `ffec355`. The Architect re-mapped every `EN/FR/ES n` in this spec by
   matching each old line's text in the new export (evidence: E27):
   - EN: old 573–642 → +6; old 660–859 → +24.
   - FR-CA: old ≤ 786 unchanged; old ≥ 857 → +18.
   - ES: old ≤ 802 unchanged; old ≥ 873 → +18.
2. §8.2 now holds the verbatim P-1 values and their export lines. The 4b set equals M1–M7 + M9 in EN, FR and ES, and
   the EN B2 line is EN 885. Nothing is missing, so AC-14 is exactly **FR 58 / ES 57**.
3. **OQ-7 closed by evidence.** EN Packages "System messages — Final" (EN 557/559) is byte-identical to the current
   `en.ts` values. The Dev only deletes the "wording pending Mauricio's approval" comment. FR/ES have no Packages
   messages in the export, so those keys stay TODO for Q-D1 and the counts don't change.
4. New assumption A6: the send-failure text (M7) mentions booking a call but is plain text, not a link.
   New note in §8.1: the `*` in the legend (M9) is literal and must not be stripped.
5. The P-1 step "Dev re-maps lines" is removed (done here). The P-1 diff check stays as an entry check.
   The estimate drops by 0.25 h.

Rev 1 (2026-10-31): first draft.

## Goal
At launch, `/contact` (EN/FR/ES) shows the approved 6-field Project Inquiry form. It shows the success message only
after the server confirms delivery, and shows a distinct error otherwise. `/api/contact` sends one email and never
calls Mailchimp. Every "Book a … Strategy Call" opens an accessible booking dialog (variant B, no email field). The
dialog collects the three approved questions and hands them to Calendly, and its privacy line is backed by a
documented verification. No "24–48 h" promise remains in code or in the rendered Contact page.

## Scope (decided by Mauricio / Senior Architect)
1. 6-field Contact form EN/FR/ES, copy verbatim; success only after a real server success; distinct error state.
2. `/api/contact` makes no Mailchimp call (OQ-3).
3. Booking modal variant B; heading and Contact secondary CTA use the main label. Privacy line = **B2** (decided),
   enabled only after V1/V2 verify that the answers reach Calendly.
4. Booking modal accessibility (launch blocker).
5. Remove every "24–48 h" response promise.
6. Validation and send-failure strings were not in the `01ff73f` export → precondition P-1. **Done: Final in
   Notion 2026-10-31, exported in `ffec355` (2026-11-02).**
Also: spam protection, email delivery verification, dictionary keys and TODO counts, privacy links.

---

## Evidence (facts verified 2026-10-31)

### Contact API — `src/pages/api/contact.ts`
- **E1. Mailchimp in the contact path.** `subscribeMailchimp()` (`:13-45`) POSTs to `https://${dc}.api.mailchimp.com/3.0/lists/…/members`
  (`:23-28`) and upserts with PUT (`:33-39`). The handler calls it on every valid submit (`:129-139`). `crypto`/`md5`
  (`:2`, `:9-11`) exist only for it.
- **E2. "Success" without delivery.** `overallSuccess` (`:162`) = SMTP result, or the **Mailchimp result when
  `DISABLE_SMTP=1`**. On failure, `NODE_ENV !== 'production'` **or** `ALLOW_CONTACT_FALLBACK=1` returns
  **200 `success: true`** "Contact submitted (fallback)" (`:169-174`). A failed delivery can therefore show the success
  message.
- **E3. Internals leak to the browser.** Responses include `details: { mailResult, mcResult, DISABLE_SMTP }` (`:173`,
  `:177`, `:180`). `mailResult.info` is nodemailer's info object. `sendEmail`'s "not configured" result carries
  env-presence flags and `CONTACT_RECIPIENT` (`:63`). The catch path returns raw `err.message` (`:184-185`).
- **E4. Unescaped HTML email.** User input is interpolated raw into the HTML body (`:87-95`). There is no `replyTo`. The
  subject is built from `name` (`:102`).
- **E5. Server validation** = email regex only (`:5-7`, `:126`). "name and businessType are validated clientside"
  (`:127`). The payload is `{ name, email, businessType, message }` (`:124`).
- **E6. Env flags undocumented.** `DISABLE_SMTP` and `ALLOW_CONTACT_FALLBACK` are not in `.env.local.example`
  (`grep` → no match). The `MAILCHIMP_*` placeholders are at `.env.local.example:18-20,27-29`.
- **E7. Existing tests:** `src/__tests__/api/contact.test.ts` (2 tests, `sendEmail` "SMTP not configured" +
  `CONTACT_RECIPIENT` fallback). No handler-level test.

### Contact form and page
- **E8. Current form = 4 fields.** `ContactForm.tsx:73-96`: Name, Email, Business Type (select, EN option values `:7-13`),
  Message (optional). Client validation `:33-35`. On error it shows **the server's `message`** (EN, e.g. "Invalid email") or
  `submitFailed` (`:51-55`, `:64-65`). One `role="alert"` region and one `role="status"` region (`:98-99`). No
  `aria-invalid`/`aria-describedby`, and no focus on error. Required marker `*` is not hidden from AT (`:74`). Exports:
  `ContactForm` (named + default), no props; re-exported by `organisms/index.ts:14` and `SimpleContactForm.tsx:1`.
- **E9. Contact page.** `contact/page.tsx:29` `<HeroLoader pageUri="contact" variant="contact" locale={locale} />`.
  `:35-41` renders CMS `mainCopy` (h2), `tagText` (h3), `bodytext` (p). `:43` `<ContactForm />`. `contact/layout.tsx:1-6`
  still exports "Next.js / Generated by Next.js" metadata (overridden by `page.tsx:58-61`; not touched).
- **E10. Local CMS, Contact page** (query, trimmed):
  ```graphql
  { pages(first:1, where:{language:"en"|"fr"|"es", name:"contact"}) { nodes { databaseId slug
      contactContactTexts { mainCopy tagText bodytext } heroContent { heroTitle subtitleHero ctaTextHero ctaLinkHero ctaPath } } } }
  ```
  ```
  en: databaseId 41 · mainCopy "Request Free Quote" · tagText "Let's Build Something Powerful Together"
      bodytext "Whether you need … Fill out the form below, and I'll get back to you within 48 hours."
      heroTitle "Tell me about your website project." · ctaTextHero "Book a Free Strategy Call"
      ctaLinkHero "https://calendly.com/mauriciobayuelo/free-discovery-call" · ctaPath null
  fr: nodes []    es: nodes []      (no FR/ES contact translation yet — 5b E16; created in 5c)
  ```
  So **a 48-hour promise lives in CMS `bodytext`** as well as in the dictionary (E13).
- **E11. `supportingHtml` exists, empty.** Introspection of `ContactContactTexts`: `bodytext`, `mainCopy`,
  `supportingHtml`, `tagText` (all `String`). EN page 41 `supportingHtml: null`. Imported to production with the
  Phase 5 JSON (5a report `:110`, production runbook report: 14 groups, 36 added). ADR 0006 assigns it to
  "5d-lite / R1 Contact copy" (wysiwyg, Translate). Loader rev 2 writes Contact **hero title + subtitle only**
  (`phase-5c-loader.md:73`). **Rev 2: unused by 5d-lite (D-2 = C2).**
- **E12. Hero CTA.** `HeroLoader.tsx:15-42` has no `children` prop, although `Hero` renders `children` (`Hero/index.tsx:93`).
  `resolveHeroCta` (`Hero/api.ts:64-75`): with `requireInternalCta` and no `ctaPath`, it returns no CTA. Without it, it
  returns `ctaTextHero` + `ctaLinkHero` → `HeroCTA` → `CalendlyButton` (`HeroCTA.tsx:22-37`).

### Dictionaries
- **E13. SLA strings.** `grep -rn -i "24.\{0,3\}48|48 h|48 hours|…" src docs/content` →
  `en.ts:93` `contactForm.success: "Thanks! We'll get back to you within 24–48 hours."`, `fr.ts:90`, `es.ts:90`
  (`[FR|ES TODO]` + EN), `en.test.ts:64`. **No canonical copy contains one** (EN 732: "Do not promise a response SLA").
- **E14. TODO counts now.** `findTodoKeys`: **FR 83 / ES 82** (5b report `:341`, pinned by `dictionary.test.ts:132-141`).
  `grep -c` lines: FR 84 / ES 83 (one comment line each). Every key in `contactForm` (**20**) and `emailModal` (**22**)
  is TODO in FR and ES.
- **E15. Labels already filled ×3:** `common.bookStrategyCall` EN/FR/ES = the main label (`en.ts:8`, `fr.ts:7`, `es.ts:7`,
  pinned by `dictionary.test.ts:64-66`). `common.close` (dialog close name) is still TODO in FR/ES.
- **E16. Old keys used only by what this phase replaces:** `contactForm.*` (form only); `emailModal.bookingTitle`,
  `calendlyBody`, `defaultBody`, `continueBooking`, `subscribe` (booking/default branches of the modal only,
  `EmailCollectorProvider/index.tsx:234-235,254-255,327`). `forms.namePlaceholder|emailPlaceholder` are also used by the
  modal's download branch (`:305`, `:317`) → they stay.

### Booking modal — `src/components/organisms/EmailCollectorProvider/index.tsx`
- **E17. Booking subscribes to Mailchimp today.** Every non-download open shows Name + Email (`:297-321`). Submit POSTs
  `{ email, name, utm }` to **`/api/mailchimp`** (`:88-92`) and fires `mailchimp_subscribed[_then_calendly]`
  (`:108`, `:178`). Only then does it call `openCalendlyPopup` (`:192-200`). HANDOFF §5: `MAILCHIMP_*` do not exist in
  Vercel, and booking works.
- **E18. Name/email/answers never reach Calendly.** `openCalendlyPopup` (`utils/calendly.ts:181-271`) builds the URL from
  `customUrl || calendlyConfig.url` + `utm_*` only (`:194-205`). It calls `initPopupWidget({ url })` (`:233`) with no
  `prefill`. The iframe fallback (`:277-393`) and the new-window path (`:210-212`) use the same URL. **Neither the B1 nor
  the B2 condition is true today.**
- **E19. Dialog a11y defects (5b report "Launch-blocking item").** Overlay `div role="dialog" aria-modal="true"` with
  **no accessible name** (`:217`). There is no `keydown` handler (no Escape, no Tab trap). Focus is not moved on open
  (`openModal` `:40-59`) and not restored on close (`closeModal` `:61-66`). Background is not inert. Close button
  `aria-label={t.common.close}` (`:219`). The `<h3>` headings have no id (`:234`, `:254`).
- **E20. Triggers (no change needed in them):** Header `openModal({ origin:'header' })` (`Header/index.tsx:50-54`),
  final CTA `origin:'finalcta'` + CMS `customUrl` (`FinalCTASection/index.tsx:26`), PackageCard `origin:'package'`
  (`PackageCard/index.tsx:28`), `CalendlyButton` → `openModal({ utmContent, utmTerm, customUrl })` (`CalendlyButton/index.tsx:79`;
  used by Hero, About bottom, ProjectsGrid empty state). The provider wraps the app in `app/[locale]/layout.tsx:161-178`.
- **E21. Two Calendly events (Known debt).** Code default `magnetomarketing/free-strategy-call` (`calendly.ts:51`, used by
  Header and any open without `customUrl`). CMS hero links → `mauriciobayuelo/free-discovery-call` (E10). Event
  configuration (custom questions) is in Calendly, not visible from the repo.
- **E22. Calendly iframe fallback dialog** (`calendly.ts:282-384`): `role="dialog" aria-modal="true"`, no name, Escape
  closes (`:370-379`), no focus move/trap/return.

### Copy (export `ffec355`, 2026-11-02)
| Item | EN | FR-CA | ES |
|---|---|---|---|
| Hero + secondary CTA "Prefer to talk? + label" | 579-583 | 717-721 | 733-737 |
| Form labels/fields (Name … Budget) | 585-630 | 723-768 | 739-784 |
| Website helper | 599 "Optional if you do not have a website yet." | 737 "Facultatif." | 753 "Opcional." |
| Need options (4) | 607-610 | 745-748 | 761-764 |
| Problem label + helper | 612, 616 | 750, 754 | 766, 770 |
| Budget options (5) + helper | 624-628, 630 | 762-766, 768 | 778-782, 784 |
| Submit | 632 | 770 | 786 |
| Supporting copy (3 lines) | 636, 638, 640 | 774, 776, 778 | 790, 792, 794 |
| Form privacy line + "Privacy Policy" | 642 | 780 | 796 |
| Success (2 lines) | 646, 648 | 784, 786 | 800, 802 |
| **4b form messages (P-1)** | 650-666 | 788-804 | 804-820 |
| Structure constraints | 684-699 (6 inputs; URL optional, no strict `https://`; problem required; budget required incl. "Not sure yet") | — | — |
| Modal heading = main label | 702 | 875 (variant B) | 891 (variant B) |
| Modal body (variant B) | 704 (no email mention → valid for B) | 877 | 893 |
| Modal website label + hint | 709 ("Your website (if you have one)" — "optional") | 879, 883 | 895, 899 |
| Modal problem label + helper | 715, 716 | 894, 898 | 910, 914 |
| Modal CTA "Continue to scheduling" | 718 | 900 | 916 |
| Modal privacy B1 (not used) | 883 ("Fallback implementation copy if Email is removed") | 904-906 | 920-922 |
| Modal privacy **B2** (chosen) | **885** (P-1) | 908-910 | 924-926 |
| Constraints | 722-737 (no SLA 732; never ask email twice; no budget in modal) | 1094, 1100 | 1080-1081 |
| Packages system messages (OQ-7) | 555-559 | — (absent) | — (absent) |

- **E23. P-1 strings verified in `ffec355`.** The `01ff73f` exports had no validation, error, "sending" or
  select-placeholder strings; the old EN dictionary values (`contactForm.errors.*`, `businessTypePlaceholder`,
  `sending`) are Phase 4 extractions of hardcoded strings. `ffec355` adds exactly 8 strings per language under "4b"
  (EN 652-666, FR 790-804, ES 806-820) plus the EN B2 line (EN 885). Values and key mapping: §8.2.
- **E24. Need (select) required?** The copy says the URL is optional, and that the problem and the budget are required
  (EN 689-691). It does not say whether the Need select is required. **Rev 2: required (D-4).**
- **E27. Re-export evidence (Architect, 2026-11-02).**
  ```
  $ shasum -a 256 docs/content/*
  9f9d57ee…e687ca9  magneto-copy-en.md   138cbec3…ec25551  magneto-copy-fr-CA.md   4fd0d5cb…212e7b35  magneto-copy-es.md
  $ git diff 01ff73f ffec355 --stat -- docs/content
  en.md 32 +++/---, es.md 24, fr-CA.md 24 — 71 insertions, 9 deletions
  ```
  The hunks are:
  - the 3-line header comment in each file (export date and method)
  - EN "System messages — Final" under Packages SEO (+6, EN 555-559)
  - "4b" after the Contact success lines (+18 each: EN 650-666, FR 788-804, ES 804-820)
  - EN "B2 implementation copy" (+2, EN 885)

  No other line changed. In particular, no Contact, Modal or SEO line changed text. Line re-map: each `01ff73f` line
  cited in rev 2 was matched by exact text in `ffec355` (EN +6 / +24, FR/ES +18 after the insertion, 0 before).

### Local environment (names/values that are not secrets)
- **E25.** `.env.local`: `NEXT_PUBLIC_WORDPRESS_API_URL=http://magneto-cms-2.local/graphql`, `DISABLE_SMTP=1`,
  `ENABLED_LOCALES=en,fr,es`. `SMTP_HOST/USER/PASS/PORT`, `EMAIL_FROM` and `CONTACT_RECIPIENT` are **set** (real values,
  not printed). No `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_GTM_ID` lines. → Local submits are safe **only
  while `DISABLE_SMTP=1`**.
- **E26. Tooling.** jsdom 21.1.2 (no `HTMLDialogElement.showModal`). There is no `@testing-library/user-event`
  (`fireEvent` only). `isomorphic-dompurify` is present (no longer needed by this phase after D-2 = C2). Lint on the files in scope: pre-existing `no-explicit-any` in
  `contact.ts` (2), `EmailCollectorProvider` (1), `calendly.ts` (6), `contact/api.ts` (1), `contact/page.tsx` (1).
  Gate baseline after 5b (report `:468-470`): lint 108 errors / 99 warnings / 91 `no-explicit-any`; 35 files / 446 tests.

---

## Preconditions (before the Dev starts)
- **P-1 — Non-canonical strings (Mauricio) — DONE.**
  - **Status.** Final in Notion (2026-10-31). Exported in **`ffec355`** (2026-11-02): EN "4b. Form messages"
    (EN 650-666) + EN B2 modal privacy line (EN 885); FR "4b. Messages du formulaire" (FR 788-804); ES "4b. Mensajes
    del formulario" (ES 804-820); FR/ES B2 lines already existed (FR 908-910, ES 924-926). Also EN Packages "System
    messages — Final" (EN 555-559, OQ-7). Architect verification: E27.
  - **Dev P-1 diff check at entry (kept, against `ffec355`).**
    1. `shasum -a 256 docs/content/*` equals the three hashes in the header. If not (a newer export landed):
       `git diff ffec355 -- docs/content` must not touch the Contact, Modal, 4b or SEO sections. If it does: **stop
       and ask**. Line numbers in this spec may then be off; section titles govern.
    2. `git diff 01ff73f ffec355 --stat -- docs/content` → 71 insertions / 9 deletions, the hunks of E27. Record
       the output in the report.
    3. Confirm the 4b → key mapping in §8.2 (8 strings × 3 languages, no extra, none missing). On any mismatch:
       **stop and ask** (the Architect reconciles). Do not invent or reword.
    4. Line re-mapping is already done in this spec (rev 2 update). The Dev does not re-map.
  - The Dev never copies strings from Notion directly. The committed export is the source.
- **P-2 — Calendly configuration (Mauricio, Calendly admin; agents never write to Calendly). Open; needed before
  V1 (Tue 11-10).** On **both events** (D-8: `magnetomarketing/free-strategy-call` and
  `mauriciobayuelo/free-discovery-call`), add 3 custom questions in this order: a1 Website URL (one line,
  optional), a2 "What do you need help with?" (one line, optional), a3 "Main website problem or goal" (multiple
  lines, optional). Use text types, not radio: Calendly is monolingual, and a radio prefill must match the option
  text exactly. Send the Architect/Dev a screenshot of each event's question list.
- **P-3 — Vercel environment check (Mauricio, read-only).** Check the Production and Preview env lists: `DISABLE_SMTP`
  absent; `ALLOW_CONTACT_FALLBACK` absent (or note it; it becomes dead after D-7); `SMTP_HOST/USER/PASS/PORT`, `EMAIL_FROM`, `CONTACT_RECIPIENT`
  present in **Preview** (needed for AC-20). Report names only. **Open.**

---

## Assumptions and open questions
- **Assumption A1:** Calendly's documented prefill (URL params `a1…a10`, `name`, `email`; or `initPopupWidget({ prefill })`)
  fills text custom questions in order and stores them with the booking. **Not verified.** V1/V2 (§5.4) verify it
  before the privacy line is enabled.
- **A2:** `/privacy-policy` is the Privacy route path in every locale (5b "Other specs" item 3; ADR 0004 same-slug rule).
  The Privacy spec is not written yet. Until it ships, the link 404s locally and on previews.
- **A3 (decided, OQ-4):** the modal reuses the form's Website **label** (same text in EN 595/709, FR 733/879,
  ES 749/895) but has its **own hint** `bookingModal.websiteHelp`. EN = "optional" as written in the modal section
  (EN 709, the part after "Website URL,"; `ffec355` adds no standalone EN hint line). FR 883 "Facultatif.", ES 899
  "Opcional.".
- **A4 (decided, OQ-5):** budget helper renders as plain text; the bold markers on "Not sure yet" (FR/ES « ») are
  dropped, and the quotes are kept as exported.
- **A5:** The modal download branch (lead magnet, hidden) keeps Name + Email + `/api/mailchimp` unchanged (ADR 0002:
  don't extend Mailchimp; removal belongs to Brevo/lead-magnet rebuild). It gets the same dialog a11y shell.
- **A6 (decided rev 3, Senior Architect):** the send-failure message (M7) names an alternative. That phrase renders
  as a **button-styled control that opens the booking modal**; the rest of the message is plain text, and the visible
  text is the full `sendFailed` value, unchanged. Design: §3 "Send failure"; key M7a (§8.2); AC-21.
- OQ-1…OQ-6: **closed in rev 2** (D-4 required; D-6 optional; D-8 both events; A3; A4; D-2 = C2).
- **OQ-7: closed by evidence (rev 2 update).** EN Packages "System messages — Final" (EN 557 "Packages", EN 559
  "Sorry, we couldn't load the packages right now. Please try again later.") is byte-identical to `en.ts:66-67`. The
  Dev only removes the "wording pending Mauricio's approval" comment (`en.ts:65`); the values don't change. FR/ES
  Packages messages are not in `ffec355` → `packages.errorTitle|errorBody` stay `[FR|ES TODO]` for Q-D1. TODO counts
  unchanged.

---

## Design

### 1. Shared inquiry model — new `src/utils/inquiry.ts` (+ `inquiry.test.ts`)
- Stable option **codes** (sent to the API, never translated):
  `NEED_CODES = ['new-site','fix-improve','care','not-sure']`,
  `BUDGET_CODES = ['under-1000','1000-3500','3500-8000','over-8000','not-sure']`.
  Labels come from the dictionary (§8). The server renders the **EN** labels in the email.
- `type InquiryPayload = { name; email; website?; need?; message; budget; locale; company? }` (`company` = honeypot, §7),
  and `type InquiryField = 'name'|'email'|'website'|'need'|'message'|'budget'`.
- `validateInquiry(input): { ok: true, value } | { ok: false, fields: InquiryField[] }`. One function, used by the form
  (before fetch) and the API (authoritative). Rules:
  - trim everything
  - name 1–200
  - email: the current client regex (`ContactForm.tsx:26`), ≤ 254
  - website: optional, ≤ 2048, **no format check**, no `https://` required (D-5)
  - need ∈ codes, **required** (D-4)
  - message 1–5000
  - budget ∈ codes (required)
  - locale ∈ `LOCALES`, else `en`

  The `maxLength` attributes on the inputs match these limits, so length never needs a message.
- No new `any`.

### 2. `/api/contact` — `src/pages/api/contact.ts`
- **Delete** `subscribeMailchimp`, `md5`, the `crypto` import, `mcResult` and every Mailchimp mention (OQ-3; AC-2).
- **Delete** the `NODE_ENV` and `ALLOW_CONTACT_FALLBACK` fallbacks (E2; D-7).
- Flow:
  1. 405 for non-POST (unchanged).
  2. Honeypot filled → 200 `{ success: true }`, no email, one `console.warn` (no PII).
  3. `validateInquiry` → 400 `{ success: false, code: 'validation', fields }`.
  4. `DISABLE_SMTP=1` → 200 `{ success: true, delivered: false }` + `console.warn('DISABLE_SMTP=1: inquiry not delivered')`.
     This is the local dry-run, checked **before** any transport is created.
  5. `sendEmail` → `success` ? 200 `{ success: true }` : 500 `{ success: false, code: 'delivery' }`.
  6. Any throw → 500 `{ success: false, code: 'server' }`.

  **No `details`, no `message` from errors, and no env info in any response** (E3); server logs keep the detail.
- `sendEmail(inquiry)` (export kept for tests):
  - `to: CONTACT_RECIPIENT` (fallback unchanged, `:56`), `from: EMAIL_FROM || SMTP_USER`
  - **`replyTo: email`**
  - subject `New project inquiry — {name}` with CR/LF stripped
  - text and HTML bodies list Name, Email, Website, Need (EN label), Problem/goal, Budget (EN label), Form language
  - **every value HTML-escaped** in the HTML body (E4); message newlines → `<br>` after escaping

  Server-side email text is internal (EN), not dictionary microcopy.
- The response contract is consumed only by `ContactForm` (E8). Nothing else calls `/api/contact` (`grep`).

### 3. Contact form — `src/components/organisms/ContactForm.tsx` (export names and no-props API unchanged)
- **Fields, in copy order:**
  1. Name — `autoComplete="name"`, required.
  2. Email — `type="email"`, `autoComplete="email"`, required.
  3. Website — **`type="text"` `inputMode="url"`** `autoComplete="url"`, optional, helper text. `type="url"` would
     reject `example.com`.
  4. Need — select; first option = placeholder (`value=""`, disabled); **required** (D-4).
  5. Problem/goal — textarea, required, helper text.
  6. Budget — select with placeholder, required, helper text.
  Then the submit button labelled "Send project details".

  Supporting copy (§4) sits beside the form; the privacy line + "Privacy Policy" link (§9) sits under the submit.
  **No placeholders** on the text inputs: the copy defines none, and placeholders are not labels. `forms.*Placeholder`
  stays for the download branch.
- **Labels and help:** each `<label htmlFor>` uses the visible heading text (EN 587-630). The `Field:` lines in the
  copy describe the control and are not displayed. Helper text has an id, referenced by `aria-describedby` (with the
  error id when one is shown). The required `*` is `aria-hidden="true"`; inputs carry `required` / `aria-required`.
  A **required legend** (M9, D-11b) sits above the first field, and the asterisk it explains is `aria-hidden`.
- **Validation and errors (client):**
  - On submit, run `validateInquiry`. For each invalid field, set `aria-invalid="true"` and show an inline message
    (`id` linked via `aria-describedby`), then **move focus to the first invalid field**.
  - No fetch on client-invalid input.
  - Messages are dictionary keys (§8.2), never server text.
- **Submit states:**
  - Idle.
  - Sending: button `disabled` + `aria-busy="true"`; **label unchanged, no "Sending…" text** (D-11a).
  - **Success:** only when `res.ok && payload.success === true`. Replace the form with the success block (title +
    body), a `role="status"` region that receives focus (`tabIndex={-1}`). Fields cleared.
  - **Validation error from server (400):** map `fields` to the same inline messages.
  - **Send failure** (500, network error, or non-JSON): a `role="alert"` block with `errors.sendFailed`; the form
    and the values are kept so the user can retry.
    - **Booking phrase as a control (A6, rev 3).** Split `sendFailed` at the **first** occurrence of
      `errors.sendFailedCta` and render: before, then
      `<CalendlyButton variant="secondary" size="sm" utmContent="contact_send_failed" utmTerm="strategy_call">{sendFailedCta}</CalendlyButton>`,
      then after.
    - **Visible text.** The alert's text content equals `sendFailed` exactly: no added words, no changed case, and
      the spaces around the control are kept.
    - **Why `CalendlyButton`.** It opens a dialog and doesn't navigate, so it is a `<button>` (the "button-styled
      link" of the review), as used as-is. No change to `CalendlyButton`. The click fires the existing `cta_clicked`
      event with the new label value `contact_send_failed`; there is no new event name.
    - **Fallback.** If the phrase is not found in the string (should never happen; a test pins it), render the plain
      message with no control and `console.warn` once in development.
    - **Styles.** The control sits inline within the sentence in `.contact-form` alert styles (`contact-form.scss`):
      - no line-break forcing; wraps naturally at 375 px
      - target ≥ 24×24
      - visible focus
      - contrast AA against the alert background
    - **Focus.** After a failed send, focus is not moved automatically (the `role="alert"` announces). When the
      modal closes, focus returns to this button (AC-11 trigger list).

  The success and error regions are separate elements with different styles (AC-6).
- Honeypot (§7) rendered inside the form.
- Styles in `contact-form.scss` / `form-field.scss`:
  - helper and error text
  - visible focus on inputs and selects (no reliance on browser default only)
  - error colour + icon or text prefix, so colour is not the only cue
  - contrast WCAG 2.2 AA
  - targets ≥ 24×24

### 4. Contact page — `src/app/[locale]/contact/page.tsx`, `api.ts`
- **Supporting copy (D-2 = C2, dictionary).**
  - Three keys `contactPage.supporting.{reply,languages,notAQuote}` = EN 636/638/640, FR 774/776/778, ES 790/792/794,
    verbatim.
  - They render as three `<p>` in the existing `.contact-form-header` block, beside the form (HANDOFF Q-defaults:
    "Contact supporting copy as paragraphs").
  - **The page renders no `contactContactTexts` text any more.** `mainCopy` ("Request Free Quote" framing, which the
    copy replaces, EN 686), `tagText` and `bodytext` (the 48-hour promise, E10) are not rendered in any state.
  - `CONTACT_PAGE_QUERY` drops `contactContactTexts`. It keeps the page existence check (→ 404 when the locale has no
    `contact` page, ADR 0004) and `featuredImage`.
  - Types move to a new `contact/types.ts`. The `any` at `api.ts:57` goes only if that is trivial.
  - No sanitizer is needed (plain dictionary strings).
  - **ADR 0006 Amendment 2 (decided rev 3; applied by the Senior Architect, not the Dev):** the Contact page no
    longer renders `contactContactTexts`. The fields stay in the schema (expand/contract) and are removed in the
    Cleanup/Contract phase. No ACF/schema change now.
- **Secondary CTA (Q-A3, D-3 decided):**
  - Contact calls `HeroLoader` with **`requireInternalCta`**, which suppresses the CMS Calendly CTA (E12, existing
    rule).
  - It passes a child: `<p className="hero-secondary">{t.contactPage.preferToTalk} <CalendlyButton variant="secondary" utmContent="contact_hero" utmTerm="strategy_call">{t.common.bookStrategyCall}</CalendlyButton></p>`.
    `preferToTalk` = "Prefer to talk?" (EN 583) / "Vous préférez en discuter?" (FR 721) / "¿Prefieres conversar?" (ES 737).
  - `HeroLoader` gains **one optional prop, `children`**, passed through to `Hero`. That is the only public API
    change, and it is additive.
  - The button opens the booking modal (no `customUrl` → the code default event, D-8).
  - The trailing space before the button and the `?` spacing follow each export (FR "discuter?" has no space before
    `?` in the export: keep it verbatim).
- `contact/layout.tsx`: untouched (E9; out of scope).

### 5. Booking modal variant B — `EmailCollectorProvider/index.tsx`, `utils/calendly.ts`
#### 5.1 Content
- **Booking branch** = every open without `downloadUrl` (today's `calendly` and `default` variants merge, E17).
- Contents:
  - Heading `common.bookStrategyCall`.
  - Body `bookingModal.body` (EN 704 / FR 877 / ES 893).
  - Fields:
    1. Website: label `contactForm.websiteLabel`, hint **`bookingModal.websiteHelp`** (A3). `type="text" inputMode="url"`.
    2. Need: select with the 4 shared options + placeholder (M1); optional here (D-6).
    3. Problem: textarea; `bookingModal.problemLabel` / `problemHelp` (EN 715/716).
  - CTA `bookingModal.continue` "Continue to scheduling".
  - Privacy line `bookingModal.privacyText` (**B2**) + link `common.privacyPolicy`.
  - **No name or email field.**
- All three fields optional (D-6). A submit with nothing filled goes straight to Calendly, without `a1..a3`.
- **No `/api/mailchimp` call** and no `mailchimp_*` gtag events on the booking branch. The existing
  `CalendlyButton` `cta_clicked` and `calendly_popup_opened` events stay. No new analytics events.
- On continue:
  1. Save the trigger reference.
  2. Close the dialog (focus returns to the trigger, §6).
  3. Call `openCalendlyPopup({ …existing args, prefill })`.
- Download branch: unchanged behaviour and strings (A5).

#### 5.2 Transport to Calendly (D-1 = B2)
- `openCalendlyPopup` gains an optional `prefill?: { customAnswers?: Partial<Record<'a1'|'a2'|'a3', string>> }`.
- Non-empty answers are set as **URL params `a1`, `a2`, `a3`** on `targetUrl`, so the widget, the iframe fallback
  and the new-window path all receive them (`calendly.ts:194-212`, `:249`, `:260`).
- Values:
  - a1 = website as typed
  - a2 = **localized** label of the chosen need (what the visitor saw)
  - a3 = problem text
- `maxLength`: website 2048, problem 500 (URL size).
- Existing callers are unaffected: the param is optional and the EN `labels` behaviour is unchanged.
- Both events (D-8) receive the same `a1..a3`; `customUrl` handling is unchanged.

#### 5.3 Privacy line (scope item 3)
- Evidence today: E18. No answer reaches Calendly, nor anything else, so no line is true **before** §5.2 ships.
- **Decided: B2** (D-1). It is enabled only after the V1/V2 gate (5.4). The order of work keeps the claim honest:
  1. §5.2 implemented.
  2. V1 passes.
  3. V2 passes.
  4. The B2 value goes into `bookingModal.privacyText` (EN 885, FR 910, ES 926).

  Until step 4, the Dev may keep the key filled with the B2 text on the branch, but **the PR must not be marked
  ready** without V1 + V2 evidence (AC-13).

#### 5.4 Verification (documented in the report with screenshots)
- **V1 (Dev, local, read-only, no booking).** For **both** events (D-8), after P-2:
  1. Open the modal and fill the 3 answers. Continue.
  2. In the Calendly popup, pick a slot. **Do not press "Schedule Event".**
  3. Screenshot the details form: the 3 custom questions are prefilled with the exact values.
  4. Record the iframe `src` with `a1..a3` (DevTools; values redacted to test strings).
  Repeat in FR and ES on `/fr` and `/es` (modal reachable from Header/final CTA).
- **V2 (Mauricio, production Calendly — a write).**
  1. Make one real test booking through the flow, with test answers.
  2. Confirm the answers appear on the booked event (Calendly event details or notification email).
  3. Cancel the booking.
  4. Send a screenshot.
- **Gate.** V1 + V2 pass → B2 stays. If V1 or V2 fails on either event, **stop** and report. Mauricio then decides
  between:
  - fixing the Calendly configuration and re-running;
  - the B1 design (new endpoint + `calendly.event_scheduled`, +4–6 h, re-spec);
  - the "no answers" fallback (modal = heading + body + continue; copy reconciled in Notion, ES 1080).

  The Dev does not choose.

### 6. Dialog accessibility (both branches) — `EmailCollectorProvider/index.tsx`, `email-collector.scss`
**D-9 (decided): custom dialog, no new library. Native `<dialog>` is evaluated first.**

**6.0 Native `<dialog>` evaluation (Dev, first ~1 h of Part 2, recorded in the report).**
- **Prototype.** Render the booking dialog as `<dialog aria-labelledby aria-describedby>`, opened with `showModal()`.
  Use the `cancel` event for Escape, `close` for cleanup, and restore focus explicitly to the recorded trigger.
- **Supported browsers to check:** current **Chrome**, **Safari (macOS)**, **Firefox**, and **iOS Safari** (simulator or
  device if available, else record "not checked"). In each, check AC-11's behaviours:
  1. Focus moves in on open.
  2. Tab/Shift+Tab stay inside. With `showModal()` the page is inert; note that browsers may let Tab reach the browser
     chrome — record it.
  3. Escape closes.
  4. Focus returns to the trigger.
  5. The dialog has a name from its heading.
  6. The background is inert to clicks and VoiceOver.
  7. No layout regression at 375/768/1440: top layer, `::backdrop` replaces `.ec-overlay`.
- **Tests.** jsdom 21 lacks `showModal`/`close` (E26). The tests stub `HTMLDialogElement.prototype.showModal/close`
  (set `open`, dispatch `close`). The behaviour that matters is then proven in the browser, not in jsdom.
- **Decision rule.** If **every** check passes in the checked browsers → use native `<dialog>`. Otherwise → the custom
  dialog below. Either way, record the browser × behaviour table, the choice and the reason in the report. Do not
  mix the two (no `<dialog>` + manual `inert`).
- If native is chosen, the custom-specific bullets below (portal + `inert` siblings, manual Escape) fall away. Focus
  move/return, naming, the heading level and the close button rules still apply. A Tab trap is not added unless a
  checked browser lets focus reach the page behind.

**6.1 Custom dialog (fallback if native fails any check):**
- **Rendering.** Render the overlay through `createPortal(…, document.body)`. While open, set `inert` on every other
  child of `<body>`; remove it on close.
- **Dialog element.** The dialog element has:
  - `role="dialog"` and `aria-modal="true"`
  - `aria-labelledby` = the visible heading `id` (`useId`)
  - `aria-describedby` = the body paragraph id
- **Open.**
  - Record `document.activeElement` as the trigger (`openModal`).
  - After render, focus the **first form control** (booking: Website; download: Name).
  - If there is none (download success state), focus the heading (`tabIndex={-1}`).
- **Tab trap.** `keydown` on the dialog: Tab from the last focusable → first; Shift+Tab from the first → last. The
  focusables are computed at keydown time, so disabled and success-state changes are handled.
- **Escape** closes (unless a submit is in flight: then ignore).
- **Close button.** Keeps `aria-label={t.common.close}`. Visible focus; target ≥ 24×24.
- **Close** (Escape, close button, booking continue, download "Close"): restore focus to the recorded trigger if it is
  still connected and visible; otherwise to `document.body`, and this fallback case is recorded in the report. Example:
  a trigger inside a collapsed mobile menu.
- **Heading level.** `<h3>` → `<h2>`: a dialog starts its own outline. Visual size is unchanged (class kept).
- **Calendly iframe fallback** (`calendly.ts:282-384`, D-10): `aria-label` = `labels.frameTitle` on the overlay; focus
  the close button on open; restore the previously focused element on close. Not a full trap: the iframe is
  cross-origin.
- **Third-party limit (record, don't fix).** The Calendly popup widget's own overlay and its focus behaviour after it
  closes are Calendly's. They are observed in the keyboard check and reported.

### 7. Spam protection (D-12 = S-a, decided)
- Honeypot: one text input `name="company"` in a wrapper that is visually hidden off-screen (not `display:none`) and
  `aria-hidden="true"`. The input has `tabIndex={-1}` and `autoComplete="off"`, and no visible or announced label.
  The input gets no dictionary key: it is never perceived.
- Server: non-empty → 200 success without sending (§2), so bots get no signal. A human never fills it.
- Post-launch, if spam appears: a Vercel WAF rate-limit rule on `/api/contact` (dashboard, Mauricio, no code), then
  Turnstile (needs an ADR, a Privacy Policy provider entry and consent review).

### 8. Dictionary changes (ADR 0005) — `en.ts`, `fr.ts`, `es.ts`, `en.test.ts`, `dictionary.test.ts`
#### 8.1 Canonical keys (filled verbatim in EN/FR/ES in this phase, not left to Q-D1; line numbers = `ffec355`)
| Key | EN | FR | ES |
|---|---|---|---|
| `common.privacyPolicy` | 642 "Privacy Policy" | 780 | 796 |
| `contactPage.preferToTalk` | 583 "Prefer to talk?" | 721 | 737 |
| `contactPage.supporting.{reply,languages,notAQuote}` (D-2 = C2) | 636 / 638 / 640 | 774 / 776 / 778 | 790 / 792 / 794 |
| `contactForm.nameLabel` / `emailLabel` | 587 / 591 | 725 / 729 | 741 / 745 |
| `contactForm.websiteLabel` / `websiteHelp` | 595 / 599 | 733 / 737 | 749 / 753 |
| `contactForm.needLabel` + `needOptions.{newSite,fixImprove,care,notSure}` | 601, 607-610 | 739, 745-748 | 755, 761-764 |
| `contactForm.messageLabel` / `messageHelp` | 612 / 616 | 750 / 754 | 766 / 770 |
| `contactForm.budgetLabel` + `budgetOptions.{under1000,from1000to3500,from3500to8000,over8000,notSure}` + `budgetHelp` | 618, 624-628, 630 | 756, 762-766, 768 | 772, 778-782, 784 |
| `contactForm.submit` | 632 | 770 | 786 |
| `contactForm.privacyText` (without the link text) | 642 | 780 | 796 |
| `contactForm.successTitle` / `successBody` | 646 / 648 | 784 / 786 | 800 / 802 |
| `bookingModal.body` | 704 | 877 | 893 |
| `bookingModal.websiteHelp` (OQ-4) | 709 "optional" (A3) | 883 | 899 |
| `bookingModal.problemLabel` / `problemHelp` | 715 / 716 | 894 / 898 | 910 / 914 |
| `bookingModal.continue` | 718 | 900 | 916 |
| `bookingModal.privacyText` (**B2**, without link text) | 885 | 910 | 926 |
Markdown markers are stripped (`**`, `*`), and the text is otherwise byte-exact (curly ’ in EN 642, 648; FR/ES « »
and non-breaking spaces as exported). **Exception: the `*` inside the M9 legend (§8.2) is literal text, not a
marker. Keep it.** Line labels such as "Helper text:", "**Submit CTA:**", "**Privacy line:**" and the 4b
"**…:**" prefixes are not part of the value. Total canonical keys: **33** (rev 1: 29; +3 supporting, +1 modal website hint).
The modal heading reuses `common.bookStrategyCall` (no new key).

#### 8.2 P-1 strings (Final in Notion 2026-10-31; exported in `ffec355`, "4b" sections)
Lines are EN / FR / ES of `ffec355`. The value is the text after the bold label, verbatim. FR values keep the export's
straight apostrophes; FR « » keep their inner spaces as exported.

| # | Key | Where shown | Lines | EN value | FR value | ES value |
|---|---|---|---|---|---|---|
| M1 | `contactForm.selectPlaceholder` | first, disabled option of Need and Budget (form) and Need (modal) | 652 / 790 / 806 | Select an option | Choisissez une option | Elige una opción |
| M9 | `contactForm.requiredNote` | legend above the first field (D-11b) | 654 / 792 / 808 | Fields marked * are required. | Les champs marqués d'un * sont obligatoires. | Los campos marcados con * son obligatorios. |
| M2 | `contactForm.errors.nameRequired` | inline, Name | 656 / 794 / 810 | Please enter your name. | Veuillez indiquer votre nom. | Escribe tu nombre. |
| M3 | `contactForm.errors.emailInvalid` | inline, Email (empty or invalid) | 658 / 796 / 812 | Please enter a valid email address. | Veuillez entrer une adresse courriel valide. | Escribe un correo electrónico válido. |
| M4 | `contactForm.errors.needRequired` | inline, Need (D-4) | 660 / 798 / 814 | Please choose what you need help with. | Veuillez indiquer de quoi vous avez besoin. | Elige con qué necesitas ayuda. |
| M5 | `contactForm.errors.messageRequired` | inline, Problem/goal | 662 / 800 / 816 | Please tell me a little about your website or project. | Décrivez brièvement votre site web ou votre projet. | Cuéntame brevemente sobre tu sitio web o tu proyecto. |
| M6 | `contactForm.errors.budgetRequired` | inline, Budget | 664 / 802 / 818 | Please choose an approximate budget, or Not sure yet. | Veuillez choisir un budget approximatif, ou « Je ne sais pas encore ». | Elige un presupuesto aproximado, o « Todavía no lo sé ». |
| M7 | `contactForm.errors.sendFailed` | `role="alert"` after a failed send (plain text, A6) | 666 / 804 / 820 | Something went wrong and your message was not sent. Please try again, or book a free strategy call instead. | Une erreur est survenue et votre message n'a pas été envoyé. Veuillez réessayer ou réserver un appel-conseil gratuit. | Ocurrió un error y tu mensaje no se envió. Inténtalo de nuevo o agenda una llamada de orientación gratuita. |
| M7a | `contactForm.errors.sendFailedCta` (derived, rev 3) | the button inside the M7 alert (A6) | substring of 666 / 804 / 820 | book a free strategy call | réserver un appel-conseil gratuit | agenda una llamada de orientación gratuita |
| ~~M8~~ | ~~`contactForm.sending`~~ | **dropped (D-11a)**: label unchanged + `aria-busy`; key removed | — | — | — | — |
| — | `bookingModal.privacyText` B2 (counted in §8.1) | modal, before the link | 885 / 910 / 926 | Your answers are passed to Calendly with your booking to prepare for the call. Calendly will ask for your name and email to schedule it. Booking a call does not subscribe you to marketing emails. | (FR 910, without « **Politique de confidentialité** ») | (ES 926, without « **Política de privacidad** ») |

Old Phase 4 EN values that these replace: "Choose an option" (`businessTypePlaceholder`), "Please enter your name.",
"Please enter a valid email address.", "Failed to submit form", "Sending...".

**M7a is derived, not new copy.** Its value must be byte-identical to a substring of that locale's M7 value (same
case, same accents). A dictionary test pins `sendFailed.includes(sendFailedCta)` for EN, FR and ES.

No website-format error (D-5) and no modal validation errors (D-6). The P-1 set is **M1–M7 + M9 = 8 keys × EN/FR/ES +
the EN B2 line**. Verified complete in `ffec355` (E27): no extra 4b string, and none missing in any language. The
table is a convenience copy. **The export governs**: the Dev copies from the export lines, and the tests compare the
dictionary with the export text. If the table and the export differ, the export wins, and the Dev records the
difference in the report.

#### 8.3 Keys removed (unused after this phase)
- `contactForm.*` old: `businessTypes.*` (5), `errors.{businessTypeRequired,submitFailed,unknown}`, `success` (**the
  24–48 h string**), `ariaLabel` (D-13), `businessTypeLabel`, `businessTypePlaceholder`, `messagePlaceholder`, `send`.
  Plus `nameLabel`, `emailLabel`, `messageLabel`, `errors.nameRequired`, `errors.emailInvalid`, `sending`, which are
  **replaced** with new values from §8.1/8.2. Net: all 20 current TODO leaves leave the TODO list.
- `emailModal.{bookingTitle,calendlyBody,defaultBody,continueBooking,subscribe}` (5).

#### 8.4 Effect on TODO counts (guard, `findTodoKeys`)
- Today: **FR 83 / ES 82** (E14).
- −25 (the 20 + 5 old TODO leaves above) + 0 (new keys are all filled: canonical from the exports, P-1 from Notion).
- New keys: 33 canonical + 8 P-1 + 1 derived (M7a, rev 3) = 42, all filled → +0. `contactForm.sending` is removed (it was TODO, counted in
  the 20).
- **After 5d-lite: FR 58 / ES 57** (unchanged from rev 1). This is exact: `ffec355` has every P-1 FR/ES string (E27),
  and OQ-7 adds no FR/ES Packages values.
- `common.close`, `calendly.*`, `forms.*` stay TODO (Q-D1).
- Tests to update:
  - `en.test.ts` fingerprint (incl. `:64`)
  - `dictionary.test.ts` readiness list (add a `phase5d` done-set) and the AC-12 pin `:132-141` (rewrite to the new
    numbers)
  - `dictionary.test.ts:77`, if `emailModal.errors.subscribeFailed` remains (it does; download branch)
- The Q-D1 fill (after 5d-lite) then starts from 58/57 (incl. `packages.errorTitle|errorBody`, OQ-7).

### 9. Privacy links
- Form and modal privacy lines end with `<a href={localizePath('/privacy-policy', locale)}>{t.common.privacyPolicy}</a>`.
  Normal link, same tab. From the modal, navigating closes it: page change.
- D-14 (decided): ship the link now. It resolves when the Privacy route ships (separate spec; D-L launch gate,
  OQ-2 of 5b). Until then it 404s locally and on previews. This is expected and recorded, not a defect.
- Footer Privacy link: Privacy spec, not here.

### 10. Tests (Vitest; `fireEvent`; mock `nodemailer` with `vi.mock`)
- **`inquiry.test.ts`**:
  - each rule (§1)
  - `example.com` and `www.example.com` accepted
  - all codes
  - locale fallback
- **`contact.test.ts`** (handler-level, keep the 2 existing tests):
  - **(a) OQ-3 AC.** `MAILCHIMP_API_KEY=x-us1`, `MAILCHIMP_LIST_ID=y`, SMTP env set, `sendMail` mocked OK, `fetch`
    spied. Valid POST → 200, and `fetch` was **never called with a URL matching `/api\.mailchimp\.com/`** (and not
    called at all).
  - (b) 405.
  - (c) invalid → 400 + `fields`, `sendMail` not called.
  - (d) honeypot → 200, `sendMail` not called.
  - (e) `DISABLE_SMTP=1` → 200 `delivered:false`, `createTransport` not called.
  - (f) `sendMail` rejects → 500 `code:'delivery'`, body has **no** `details`/`message`, and no
    `SMTP_*`/`CONTACT_RECIPIENT` values.
  - (g) `NODE_ENV=development` + failure → still 500 (fallback gone).
  - (h) the HTML body escapes `<script>`/`<b>` in `name`/`message`; `replyTo` = submitter; subject has no CR/LF; EN
    labels for need/budget codes.
- **`ContactForm.test.tsx`**:
  - EN/FR/ES render every §8.1 form string verbatim (labels via `getByLabelText`, options, helpers, submit, privacy
    link href `/privacy-policy`, `/fr/privacy-policy`, `/es/privacy-policy`)
  - empty submit → inline errors, `aria-invalid`, focus on first invalid, no fetch
  - 200 success → success block only then, focused
  - 500 and network error → `role="alert"` with `sendFailed`, no success text, values kept
  - **A6 (rev 3), EN/FR/ES:**
    - the alert's `textContent` (whitespace-normalised) equals `sendFailed`
    - it contains exactly one `button` named `sendFailedCta`
    - clicking it calls `openModal` with `utmContent: 'contact_send_failed'` (provider mocked, or a render inside
      `EmailCollectorProvider`)
    - the form values are still kept after the click
  - 400 `fields` → inline errors
  - `website: "example.com"` accepted
  - option values are codes
- **`EmailCollectorProvider.test.tsx`** (existing download tests kept):
  - booking branch has no Email/Name inputs
  - continue → `fetch` never called with `/api/mailchimp`; `openCalendlyPopup` called with `prefill.customAnswers`
    containing only the non-empty answers; empty submit → no `prefill`
  - heading = `common.bookStrategyCall` in EN/FR/ES
  - **a11y:**
    1. open → focus on the first control
    2. Tab on the last control → first; Shift+Tab on the first → last
    3. Escape closes
    4. focus returns to the trigger after Escape, close button and continue (incl. the send-failure button, A6)
    5. `aria-modal="true"`, accessible name = heading (`getByRole('dialog', { name })`)
    6. custom dialog: siblings of the portal carry `inert` while open and lose it on close; native dialog:
       `showModal` called (stub), `cancel` closes
- **`calendly.test.ts`** (new): `a1..a3` set only when non-empty; existing URL/utm behaviour unchanged; iframe fallback
  focuses close and restores focus (D-10).
- **`contact/api.test.ts`**: the query has no `contactContactTexts`; null page → null (404); `featuredImage` mapped.
- **Contact page** (render test in `contact/page.test.tsx`, new): EN/FR/ES supporting lines from the dictionary; no
  `mainCopy`/`tagText`/`bodytext` text and no "48 hours" even when the CMS mock returns them.
- **HeroLoader**: `children` rendered; Contact passes `requireInternalCta`.
- **`dictionary.test.ts`** (rev 3): for EN/FR/ES, `contactForm.errors.sendFailed` includes
  `contactForm.errors.sendFailedCta`, and the CTA string is non-empty and not TODO.
- **SLA guard test:** a test fails if `/24\s*[–-]\s*48|48\s*(h|hours|heures|horas)/i` appears in any dictionary value.

---

## Mid-phase checkpoint (end of Mon 2026-11-09)
**Part 1 (Mon):** §1, §2, §3, §4, §7, §8 (form keys), §9 for the form, tests. Gate run.
**Checkpoint (Mauricio, ≈ 30–45 min):**
- `/contact` EN at 375/768/1440 (states: empty, inline errors, sending, success, send failure).
- Failure state shown locally with **DevTools request blocking of `/api/contact`** (network-error path) and by the
  unit tests (500 path). Never by pointing SMTP at a bad host: with `DISABLE_SMTP` unset the local env holds real
  SMTP credentials (E25). Success shown with `DISABLE_SMTP=1`.
- API test output; P-1 diff-check result (against `ffec355`); TODO counts so far; supporting copy from the dictionary.
- Go/no-go for Part 2. Any visual change requests here, not at the end.

**Part 2 (Tue):** §6.0 native `<dialog>` evaluation first, then §5, §6, §8 (modal keys), §9 for the modal, D-10, tests,
V1 (after P-2; then V2 requested from Mauricio),
browser + keyboard + screen-reader checks, gate, report.

---

## Files the Dev may touch
- `src/pages/api/contact.ts` — §2.
- `src/__tests__/api/contact.test.ts` — §10.
- `src/utils/inquiry.ts` (new), `src/utils/inquiry.test.ts` (new) — §1.
- `src/components/organisms/ContactForm.tsx`, `src/components/organisms/ContactForm.test.tsx` — §3.
- `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/contact/api.ts`, `src/app/[locale]/contact/api.test.ts`,
  `src/app/[locale]/contact/types.ts` (new), `src/app/[locale]/contact/page.test.tsx` (new) — §4.
- `src/components/organisms/Hero/HeroLoader.tsx` — optional `children` passthrough only; `src/components/organisms/Hero/HeroLoader.test.tsx` (new).
- `src/components/organisms/EmailCollectorProvider/index.tsx`, `…/EmailCollectorProvider.test.tsx` — §5, §6.
- `src/utils/calendly.ts`, `src/utils/calendly.test.ts` (new) — §5.2, D-10.
- `src/i18n/dictionaries/en.ts`, `fr.ts`, `es.ts`, `en.test.ts`, `src/i18n/dictionary.test.ts` — §8. Also in `en.ts`:
  delete the `packages` "wording pending Mauricio's approval" comment (OQ-7; values unchanged).
- `src/styles/components/contact-form.scss`, `form-field.scss`, `email-collector.scss`, and `src/components/organisms/Hero/Hero.scss`
  (only `.hero-secondary`) — styles.
- `.env.local.example` — document `DISABLE_SMTP=1` (local dry-run, never in Vercel); remove nothing else. Do **not**
  add `ALLOW_CONTACT_FALLBACK` (removed).
- `docs/reports/phase-5d-lite-contact-modal.md` — report.

Anything else is out of scope. In particular:
- `Header/*`, `CalendlyButton/*`, `FinalCTASection/*`, `PackageCard/*`, `LeadMagnetSection/*`
- `pages/api/mailchimp.ts`, `SimpleContactForm.tsx`, `contact/layout.tsx`
- `docs/content/*` (the re-export is the Senior Architect's commit), `.env.local`, ACF/WP content, Calendly, Vercel, ADRs

---

## Out of scope
- Brevo (ADR 0002); `/api/mailchimp`, the modal **download** branch logic, `LeadMagnetSection` (A5).
- The Privacy route/page EN/FR/ES, footer Privacy link, "Privacy choices", consent banner (Privacy spec).
- A code-level canonical Calendly event or a change of `calendlyConfig.url` (D-8: both events kept), `customUrl` handling,
  Calendly event configuration (Mauricio, P-2).
- Loader changes (none needed after D-2 = C2) and any CMS write; ADR 0006 Amendment 2 (Senior Architect).
- Q-D1 FR/ES fill of other TODO keys (incl. `common.close`, `calendly.*`).
- Header label, other CTA labels, Phase 7, analytics events, `/carte`, `contact/layout.tsx` metadata stub.
- Moving `ContactForm.tsx` into a folder, `next/link` migration, Known-debt items not named here.

---

## Acceptance criteria
| # | Criterion | How |
|---|---|---|
| AC-1 | Gate: lint (no new finding vs the 5b baseline 108/99/91, per file + rule), typecheck, tests, build — all reported honestly | `npm run lint && npm run typecheck && npm test -- --run && npm run agent:build` |
| AC-2 | **No Mailchimp in `/api/contact`** | `grep -n -i mailchimp src/pages/api/contact.ts` → no match; test (a): with `MAILCHIMP_*` set, a valid submit makes no request to `*.api.mailchimp.com` |
| AC-3 | **Booking never subscribes** | test: booking continue → no `fetch('/api/mailchimp')`; `grep -n "api/mailchimp" EmailCollectorProvider/index.tsx` → only inside the download branch |
| AC-4 | Six fields in copy order, labels/helpers/options/submit/supporting/privacy/success verbatim, EN/FR/ES | unit tests EN/FR/ES; browser EN `/contact` |
| AC-5 | URL optional and tolerant (length limit only): `example.com`, `www.example.com`, empty → accepted; **Need, problem and budget required**; budget includes "Not sure yet"; required legend (M9) present | unit tests (`inquiry`, form) |
| AC-6 | **Success only after real server success**; distinct error state; values kept on failure | tests (200 / 400 / 500 / network); browser: success with `DISABLE_SMTP=1`, network error via DevTools request blocking |
| AC-7 | Server: validation 400 with `fields`; honeypot silent 200 without send; no `details`/env/error text in any response; HTML escaped; `replyTo`; dev/`ALLOW_CONTACT_FALLBACK` fallback gone | `contact.test.ts` (b)–(h) |
| AC-8 | **No 24–48 h promise**: `grep -rn -i -E "24\s*[–-]\s*48\|48 ?h(ours)?\|48 heures\|48 horas" src` → only the SLA-guard test pattern; `/contact` EN rendered HTML has no "48 hours" and no "Request Free Quote" (CMS still holds both locally, E10) | grep + `curl -s localhost:3100/contact \| grep -c -e "48 hours" -e "Request Free Quote"` → 0 |
| AC-9 | Contact secondary CTA: "Prefer to talk? " + main label (EN/FR/ES strings by test); opens the booking modal; CMS Calendly hero CTA not rendered on Contact; other heroes unchanged | tests + browser EN; Home/About/Packages hero unchanged (screenshots 1440) |
| AC-10 | Modal variant B: heading = main label EN/FR/ES; 3 optional fields (own website hint), no name/email; "Continue to scheduling"; B2 privacy line + link | tests; browser EN `/`, FR `/fr`, ES `/es` (FR/ES-enabled local build) |
| AC-11 | **Modal a11y** (5b report items 1–6): focus into dialog on open; Tab/Shift+Tab trapped; Escape closes; focus returns to trigger (Header, Hero, final CTA, Contact secondary, Package card, send-failure button); `role=dialog` + `aria-modal` + name from heading; close button named; background inert | unit tests + keyboard-only run EN at 1440 and 375 (mobile menu trigger); **VoiceOver** (macOS Safari) spot check EN + FR: announces "dialog, Book a Free Strategy Call", fields with labels/helpers, cannot leave dialog with VO navigation; results in the report. **Plus the §6.0 browser × behaviour table and the native-vs-custom choice with its reason.** |
| AC-12 | Form a11y: labels, `aria-describedby` helpers/errors, `aria-invalid`, focus to first invalid, success focused/announced, `*` hidden, visible focus, contrast AA, targets ≥ 24 px | tests + keyboard + VoiceOver EN `/contact`; axe/Lighthouse a11y on `/contact` and an open modal: no new violations |
| AC-13 | **B2 backed by evidence**: V1 screenshots on both events (EN, plus FR and ES on one event); V2 by Mauricio (booking + answers visible + cancel). Without both, the PR is not marked ready; on failure, the stop path is recorded | report |
| AC-14 | TODO counts exactly **FR 58 / ES 57**; EN 0; key parity; `ENABLED_LOCALES=en,fr,es npm run agent:build` without override fails listing exactly those counts | `dictionary.test.ts`; guard build output |
| AC-15 | Responsive: `/contact` EN at 375/768/1440 (all states) and the modal at 375/768/1440 EN + FR + ES: no clipping, no horizontal scroll; main-label buttons pass the 5b AC-24 fit criteria (Contact secondary real in EN; FR/ES modal heading real; FR/ES Contact secondary simulated as in 5b) | screenshots |
| AC-16 | EN unchanged elsewhere: Home, Services, Packages, Projects, About, a case page — no visual diff except the dialog (1440 + 375) | screenshots |
| AC-17 | P-1 diff check recorded: sha256 = header values (or the `ffec355` diff check if a newer export landed); `git diff 01ff73f ffec355 --stat` output; 4b → key mapping confirmed (8 × 3 + EN B2). Every §8.1/§8.2 dictionary value equals its `ffec355` line (tests). Privacy links point to `localizePath('/privacy-policy', locale)` from form and modal (404 until the Privacy route ships = expected) | report + tests + browser |
| AC-18 | No real email sent from local runs: every local submit with `DISABLE_SMTP=1` (verified before the first submit, value only) | report |
| AC-19 | FR/ES Contact form in the browser: **launch QA** (FR/ES contact posts don't exist locally, E10), unless Mauricio creates them locally before Tue 11-10 — then checked here | report |
| AC-20 | **Real delivery (Mauricio, PR preview, after P-3):** one EN submit with test text incl. `<b>x</b>` → email arrives at `CONTACT_RECIPIENT` (not spam), From = `EMAIL_FROM`, Reply-To = test address, 6 fields + language, `<b>` shown literally; success UI shown. FR/ES real submits in launch QA. | Mauricio, report addendum |
| AC-21 | **Send-failure booking control (A6, rev 3):** the alert text equals `sendFailed` verbatim in EN/FR/ES. The booking phrase (`sendFailedCta`, a substring of it) is a button-styled `<button>` that opens the booking modal; focus returns to it on close. The form values are kept. The control wraps inline at 375/768/1440 with no overflow, target ≥ 24 px, visible focus | `ContactForm.test.tsx` + `dictionary.test.ts`; browser EN `/contact` with DevTools request blocking of `/api/contact`: click the button → modal opens; Escape → focus back on it (screenshots 375/768/1440) |

---

## Decisions (recorded 2026-10-31, rev 2; rev 3 2026-11-02)
| # | Decision | By |
|---|---|---|
| D-1 | **B2**: answers prefilled into Calendly custom questions (§5.2). Enabled only after V1 + V2 (§5.4). On failure: stop; Mauricio picks a fix, B1 or the "no answers" fallback | Mauricio |
| D-2 | **C2**: 3 supporting lines in the dictionary; no `contactContactTexts` text rendered; no loader dependency. ADR 0006 Amendment 2 (rev 3) | Senior Architect |
| D-3 | Secondary CTA: dictionary label + `CalendlyButton` as `HeroLoader` children; CMS CTA suppressed via `requireInternalCta`; secondary style (confirm at the checkpoint) | Mauricio |
| D-4 | Need select **required** (M4) | Mauricio |
| D-5 | Website: no format check, length limit only | Mauricio |
| D-6 | Modal questions **optional** | Mauricio |
| D-7 | Remove both success-without-delivery fallbacks (`NODE_ENV`, `ALLOW_CONTACT_FALLBACK`) | Mauricio |
| D-8 | Both Calendly events kept, same 3 questions on both (P-2); no code change | Mauricio |
| D-9 | Custom dialog, no new library; **native `<dialog>` + `showModal()` evaluated first** and used if it meets every AC-11 check in the supported browsers (§6.0); choice recorded | Mauricio |
| D-10 | Minimal a11y fix for the Calendly iframe fallback | Mauricio |
| D-11 | (a) no "Sending…" text (button disabled + `aria-busy`); (b) "* Required" legend (M9) | Mauricio |
| D-12 | Honeypot only | Mauricio |
| D-13 | Form `aria-label` removed | Mauricio |
| D-14 | Privacy link rendered now; launch gated by D-L | Mauricio |
| OQ-4 | Modal keeps its own website hint ("optional") → `bookingModal.websiteHelp` | Mauricio |
| OQ-5 | Plain text for "Not sure yet" in the budget helper | Mauricio |
| OQ-7 | Closed by evidence (2026-11-02): EN values already match the export; comment removed only; FR/ES stay TODO | Architect (evidence E27) |
| P-1 | Done: Final in Notion 2026-10-31; exported in `ffec355` 2026-11-02 | Mauricio / Senior Architect |
| A6 | Booking phrase in the send-failure alert = button-styled control opening the booking modal; copy unchanged; derived key M7a; AC-21 | Senior Architect (rev 3) |
| ADR 0006 Am. 2 | Contact no longer renders `contactContactTexts`; fields stay (expand/contract), removed in Cleanup/Contract; no schema change now | Senior Architect (rev 3) |
| Approval | **Approved** rev 3 | Senior Architect + Mauricio, 2026-11-02 |

**Still open:** no design question. Preconditions P-2 (Calendly questions, both events, before V1 on 11-10) and P-3
(Vercel env names only, before AC-20) remain Mauricio's. No new ADR. ADR 0006 Amendment 2 is applied to the ADR file
by the Senior Architect.

---

## Risks
| Risk | Effect | Mitigation |
|---|---|---|
| Notion edited again after `ffec355` and re-exported before the Dev starts | Line numbers or values drift from this spec | P-1 step 1 (hash check, then diff against `ffec355`); section titles govern; stop and ask if Contact/Modal/4b changed |
| Calendly prefill does not attach answers (A1 false) | B2 privacy line untrue | V1/V2 gate; PR not ready without both; stop and ask |
| Two events, one not configured | Answers lost for some triggers | D-8 + P-2 screenshots of both events; V1 per event |
| Calendly questions monolingual | FR/ES visitors see EN question labels in Calendly | Accept for launch (record); Calendly per-language events = later |
| SMTP deliverability (SPF/DKIM/DMARC for `EMAIL_FROM`) unknown | Inquiries land in spam | AC-20 on preview, inbox + spam check; fix in DNS is Mauricio's (outside this repo) |
| Removing fallbacks exposes a broken production SMTP | Users see the error (correct), leads lost until fixed | AC-20 before merge; send-failure copy (M7) points to an alternative |
| D-2 = C2: CMS `contactContactTexts` edits in WP no longer show | Mauricio edits a field the site ignores | ADR 0006 Amendment 2 + ACF "legacy" instruction at cleanup; noted in the report |
| FR/ES `/contact` not local | FR/ES form only unit-tested in 5d-lite | AC-19 → launch QA |
| Privacy link 404 until the Privacy route ships | Broken link on previews | D-14; launch gated by D-L |
| Native `<dialog>` behaves differently across browsers (focus return, iOS) | a11y regression in one browser | §6.0 browser table decides; custom fallback |
| `inert` siblings + portal interplay with layout providers (custom path) | Focus or click issues | Unit test + keyboard check on all trigger types |
| Calendly widget focus after close | Focus lost to `body` | Third-party; observed and reported (§6) |
| 2-day implementation window | Spill to Wed 11-11 | Checkpoint Mon; P-1/P-2/P-3 done before Mon; final review well before the 11-27 trigger (5b §11) |

---

## Estimate (active time)
| Block | Agent | Mauricio |
|---|---:|---:|
| Spec review + decisions D-1…D-14 (done 10-31) | — | 1–1.5 h (spent) |
| P-1 strings in Notion (done 10-31) + re-export `ffec355` (done 11-02, Senior Architect) | — | 1–1.5 h (spent) |
| P-2 Calendly questions (both events) + P-3 Vercel env check | — | 0.5–0.75 h |
| §1–§2 inquiry model + API + tests | 2–3 h | — |
| §3–§4 form, contact page (C2), secondary CTA, styles, tests | 3–4.5 h | — |
| §8 dictionary EN/FR/ES verbatim + guard/fingerprint tests | 1.5–2 h | — |
| Checkpoint (Mon) | 0.25 h | 0.5–0.75 h |
| §6.0 native `<dialog>` evaluation (4 browsers) | 1–1.5 h | — |
| §5–§6 modal variant B + prefill + dialog a11y (+ D-10) + tests | 3.5–4.5 h | — |
| Browser checks (375/768/1440, EN + FR/ES modal), keyboard, VoiceOver, V1, AC-24-style fit | 2–3 h | — |
| V2 test booking + cancel; AC-20 real email on preview | — | 0.5–0.75 h |
| P-1 diff check (re-map done in spec); OQ-7 comment | 0.25 h | — |
| Gate + report | 1–1.5 h | — |
| Final review (visual, keyboard/VO spot), commits/PR | — | 1–1.5 h |
| **Total** | **≈ 14.75–20 h** (rev 1: 14–19 h; 5b §11: 12–17 h) | **≈ 5–7 h** (≈ 2.5 h already spent) |
Rev 2 delta: +1–1.5 h agent (native `<dialog>` evaluation), +0.25 h (P-1 diff check), −0.5 h (C2 instead of C1). Two agent days (Mon–Tue) fit at the low end only. **Plan for Wed 11-11 as the realistic end** of Part 2, with the
final review Fri 11-13 unchanged. No effect on the 12-10 date unless the final review slips past Fri 11-27 (5b §11 trigger).

**Calendar:**
- Approval Sun 11-08.
- P-1: **done** (Notion 10-31; export `ffec355` 11-02).
- P-2 by Tue 11-10 morning (needed for V1); P-3 by Mon 11-09.
- Part 1 Mon 11-09 + checkpoint.
- Part 2 Tue 11-10 (→ Wed 11-11 if needed).
- V2 + AC-20 on the PR preview by Thu 11-12.
- Final review Fri 11-13.

---

## Other specs and docs affected (listed, not edited here)
1. **Loader rev 3** (Architect): **no Contact supporting row** (D-2 = C2). The Contact post checklist notes that
   `contactContactTexts` fields are not read (leave them empty in FR/ES).
   **ADR 0006 Amendment 2** (decided rev 3). The Senior Architect applies it; the Architect role doesn't write ADRs.
   Proposed text, matching the ADR's existing "Amendments" format:
   - Header bullet, after Amendment 1: `- Amendment 2 (2026-11-02, Senior Architect, approved by Mauricio): the
     Contact page no longer renders contactContactTexts (see "Amendments").`
   - Under "## Amendments":
     > **2. Contact page stops rendering `contactContactTexts` (2026-11-02).** Phase 5d-lite (D-2) moves the three
     > Contact supporting lines to the UI dictionaries (ADR 0005), so they ship in EN/FR/ES without a release-day
     > loader dependency. The Contact page no longer renders `contactContactTexts` (`mainCopy`, `tagText`,
     > `bodytext`, `supportingHtml`), and `CONTACT_PAGE_QUERY` no longer requests the group. Following
     > expand/contract, the fields stay in the schema and are removed in the Cleanup/Contract phase. No schema change
     > now. The `supportingHtml` row above ("5d-lite / R1 Contact copy") is therefore unused. Spec:
     > `docs/specs/phase-5d-lite-contact-modal.md` rev 3.
2. **Privacy route spec:** the `/privacy-policy` slug must match §9. D-1 = B2 → review Privacy Policy §§2/4 (EN first,
   then FR/ES) for "answers transmitted to Calendly" (FR 1060, ES 1081). List Calendly custom questions as data
   collected.
3. **Q-D1 dictionary fill:** starts from FR 58 / ES 57 (incl. `packages.errorTitle|errorBody`, OQ-7).
4. **Launch QA:**
   - FR/ES `/contact` form (AC-19), FR/ES real submits
   - real AC-24 on the FR/ES Contact secondary
   - modal keyboard/VO in FR/ES on production data
   - Privacy links resolve
5. **AGENTS.md Known debt** (Mauricio/Senior Architect): remove "Mailchimp … 4 components" wording only after Brevo.
   After 5d-lite, the contact route and the booking branch no longer use Mailchimp, so the debt line should say
   "download branch + `LeadMagnetSection` + `/api/mailchimp`".
6. **WORKFLOW.md "Later" line** "Calendly modal A/B": variant B is done here; the canonical event remains (D-8 kept
   both events).

## Stopping point
This spec is the only file written (unstaged, branch `spec/phase-5d-lite`). No code, CMS, Calendly, Vercel, or other
doc changed. Rev 3 is **Approved** (Senior Architect + Mauricio, 2026-11-02). Next:
1. ADR 0006 Amendment 2 applied to the ADR file (Senior Architect; text in "Other specs" item 1).
2. Dev Part 1 on Mon 11-09.
3. P-2 before V1 on Tue 11-10; P-3 before AC-20.
