# Phase 5c-rest — Trépied, Home body, EN final CTAs, post titles, ES CTA label, re-export and re-pin

- **Status: Draft (rev 0.2)**
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect) · **WordPress writes: Mauricio only** (agents never write
  to WordPress)
- Date: 2026-11-13 · Branch: `spec/phase-5c-rest` (from `master` @ `281f6f0`). The Dev creates its own implementation
  branch.
- Depends on:
  - [5c spec](phase-5c-loader.md) rev 3.1: §3 loader, §5 checklist, §8 EN admin saves, the "5c-rest" table, D-9;
  - [5c report](../reports/phase-5c-loader.md): runs; AC-12 still open;
  - [design-round PR 3 spec](design-round-pr3.md) "Routed to 5c-rest" (:274-309);
  - [i18n dictionary fill report](../reports/i18n-dictionary-fill.md): K1-K3, F-6;
  - [5g report](../reports/phase-5g-i18n-llm-qa.md): W2;
  - [privacy-route report](../reports/privacy-route.md): I-1;
  - ADR 0004, ADR 0005, ADR 0006 (decision 4, amendment 3).
- **Preconditions:**
  - **P-1.** 5c AC-12 (Sat 11-14 EN Services media save + §8 follow-up) has passed, which confirms A5/E13. If it fails,
    D-9 B is void and this spec goes back to review.
  - **P-2. Local plugin parity with production (new, 2026-11-13).** See §0. It must pass before AC-0 and before any
    load.

## Revision
**rev 0.2 (2026-11-13), Mauricio's decisions of 2026-11-13 (second set):**
- D-14 → **A**. Appendix A item 1 now always includes ES 755 / 864 / 909.
- T4 dropped. The About post keeps "About Magneto". §8 has T1-T3, T5 and T6.
- Appendix A status recorded: items 1-3 applied; items 4, 5 and 7 were already in Notion; item 6 is pending with its
  final shape; item 8 is specified (short title from the section labels). See §4 "Home About" and Appendix A.
- New precondition P-2 / §0: production plugin updates of 2026-11-13; local parity and gate re-run before any load.
  Risks R-12 and R-13 added.

**Draft (2026-11-13), decisions recorded:** D-9 → B with the explicit exception in §7; D-11 → confirmed wording;
D-12 → as recommended; D-13 → dropped; O-1 → in scope (§8).

No decision is open.

## Goal
On the **local** CMS, these items are loaded from one new, pinned Notion export through the existing 5c loader:
Trépied (EN/FR/ES), the Home body (EN/FR/ES, including the footer line and the final CTA) and every EN final CTA.

In the same phase:
- The case post titles match the approved copy.
- The ES main CTA reads "Reservar consulta gratis" in the dictionary and in the CMS at the same time.
- The FR home description gets "directe".
- The K1-K3 test exception is removed.
- FIX and CARE get distinct icons.

Done means:
- `content.test.ts` and the gate are green at the new export sha;
- the EN, FR and ES loads each end with a 0-change dry-run;
- the routes in AC-8 render the approved copy at 375/768/1440.

The content files and title list this phase produces are the final input to the release-day runbook.

## Evidence (read-only, 2026-11-13, `master` @ `281f6f0`)

**R0. The local CMS was unreachable during this analysis.**
`curl -s -m 10 http://magneto-cms-2.local/graphql -H 'content-type: application/json' -d '{"query":"{__typename}"}'` →
HTTP `000` (connection refused). `/etc/hosts` maps the host to 127.0.0.1, so Local was stopped. Every CMS state below
comes from the dated evidence cited next to it. **AC-0** measures it again before the Dev writes the expected totals.

**R1. Copy export pins.** Every pin is at `637fba7` (2026-11-04).
- sha256 (`shasum -a 256 docs/content/*.md`):
  - EN `d3516151842b7c099831ec6e99218c973120617eb3809996d532de251145ecd0`
  - FR-CA `f52cf70e30f43c857a01cb582fee8df7812c396c84183c3d6ea7d7c84bf435af`
  - ES `83332a1b84daecfdd041127cd5d8d752ddd5b9c5e671958690860a2f18c7e857`
  - Line counts: EN 1355, FR 1176, ES 1162.
- Where it is pinned:
  - `scripts/phase-5c/content.test.ts:17-21` (sha) and `:123-125` (commit);
  - each `scripts/phase-5c/content/*.json`: `source`, plus every field's `src` line range;
  - `src/utils/page-metadata.test.ts:24-28` (`BLOCKS`, SEO heading lines);
  - `src/i18n/dictionary.test.ts:183-237` (`CONTACT_COPY` EN/FR/ES line triples, including `sendFailed` `:218` → ES 838,
    `contactPage.preferToTalk` `:185` → ES 755, and `bookingModal.*` `:220-225` → ES 911-944);
  - `src/i18n/dictionary.test.ts:272-276` (`PRIVACY_META`);
  - `scripts/qa-i18n/config/export-sections.json`: exact heading anchors, and the note "export 637fba7".
- Line references in comments only:
  - `en.ts:79,151,219`, `es.ts:148,217`, `fr.ts:148,216`;
  - `en.test.ts:7-148`;
  - `FinalCTASection.test.tsx:17-19`.

**R2. The K1-K3 exception.**
- `src/utils/page-metadata.test.ts:32-37` holds `DESCRIPTION_EXCEPTIONS` (`fr:about`, `es:about`, `es:contact`).
- The guard test at `:76-83` asserts that each value still **differs** from the export.
- Notion has held the K1-K3 strings since 2026-11-09 (dictionary-fill report :131).
- Once a re-export carries them, the guard fails by design (F-6, :210).

**R3. The ES main CTA label.**
- **Dictionary:** `es.ts:8` `common.bookStrategyCall` = "Agendar una llamada de orientación gratuita".
  - It is 43 characters; the `cta-label` limit is 38 (design-round-2 report :230).
  - The header label `es.ts:24` "Reservar consulta" does not change.
- **Assertions:** `dictionary.test.ts:68`, `FinalCTASection.test.tsx:19`, `content.test.ts:25` (`MAIN_CTA.es`).
- **CMS:** 9 values in `scripts/phase-5c/content/es.json` (:31, 158, 301, 332, 357, 411, 454, 593, 737).
- **Export:** 22 lines in `magneto-copy-es.md` contain "llamada de orientación":
  - CTA lines 29, 139, 171, 232, 258, 389, 506, 589, 663, 737;
  - the Contact secondary CTA 755;
  - the modal headings 864 and 909;
  - running text 838, 899, 903, 940, 944;
  - internal checklist lines 1133, 1150, 1159.
- **QA tool:** `scripts/qa-i18n/checks.ts:205-210` (`main-cta`) compares CMS CTA labels with the dictionary value. The
  dictionary and the CMS must therefore change together. Also affected:
  - `scripts/qa-i18n/config/glossary.json:27` has the note "differs from the main CTA on purpose";
  - the eval fixture `scripts/qa-i18n/evals/fixture/dictionaries/es.ts:4` holds the old label.
- **Running text:**
  - `es.ts:113` `sendFailed` ends "…o agenda una llamada de orientación gratuita."; `:114` holds `sendFailedCta`.
  - `dictionary.test.ts:251-255` requires `sendFailedCta` to be a substring of `sendFailed`.
  - `ContactForm.test.tsx:221-231` names the button `sendFailedCta`.
  - `es.ts:158` `bookingModal.privacyText` ends "Agendar una llamada no te suscribe a correos promocionales." and is
    pinned to ES 944 (`dictionary.test.ts:225`).
- Where the label was decided: design-round-pr3.md:276-299 (2026-11-12).

**R4. Where the main-CTA label renders on the two D-14 surfaces.**
- **Contact hero secondary CTA:** `src/app/[locale]/contact/page.tsx:29-33` renders `t.contactPage.preferToTalk` and then
  a button labelled `t.common.bookStrategyCall`.
- **Booking-modal title:** it renders `common.bookStrategyCall` too (`es.ts:149` / `fr.ts:149` comment "Heading =
  common.bookStrategyCall").
- So both surfaces follow `es.ts:8` automatically. Only the export text can disagree with the site.
- FR is already consistent: FR 745 "Vous préférez en discuter? **Réserver un appel-conseil gratuit**", FR 854 and 899
  "### Réserver un appel-conseil gratuit", and the FR main CTA `fr.ts:8` are all the same label.

**R5. FR "directe".**
- 5g W2 (report :285): FR `meta.home.description` and `meta.site.fallbackDescription` dropped "directe". Notion was
  updated on 2026-11-09 to "avec l'implication directe du fondateur".
- Today `fr.ts:189,193` = export FR 147 "…Stratégie, UX/UI et développement avec son fondateur, en français…".
- `page-metadata.test.ts:66-74` reads both values from the export, so the test follows the re-export.

**R6. The footer line.**
- `Footer/index.tsx:13` renders the CMS field `homeFooter.footerLine2`, read from the home page in the request
  language (`Footer/api.ts:7-27`). The ACF field is text, Translate (`field_68b33adfb508b`).
- Local values (privacy-route report :290-294):
  - EN: "Based in Montreal · Available in English, French & Spanish" (5a fixture only);
  - FR 535 / ES 536: the legacy EN text "Based in Montreal | Serving clients worldwide".
- Approved copy: EN 174; FR 137 "Établi à Montréal · Services offerts en français, en anglais et en espagnol"; ES 143
  "Con sede en Montreal · Atención en español, francés e inglés".

**R7. Home body readers and their ACF fields** (`docs/acf/phase-5-field-groups.json`).
- **About** (`AboutSection/api.ts:5-17`): `aboutSectionTitle` (text) and `description_html` (wysiwyg).
- **Featured services** `homeFeaturedServices.service[]` (`FeaturedServices/api.ts:7-29`):
  - Translate: `service_title`, `service_tagline`, `service_description`, `anchor_link`;
  - Copy: **`service_icon` (image)**.
  - `FeaturedServices/index.tsx:19-29` renders every row, including a row with an empty title.
- **Testimonials** `homeTestimonialsSection.testimonials[]`:
  - Translate: `author`, `testimonial`, `role`, `company`, `city`, `note`;
  - Copy: **`thumb` (image)**.
  - Only rows with a `role` render.
- **Final CTA:** the six text fields (5c D-3).
- Both home repeaters have an image sub-field. The loader therefore never grows them (`load-content.php:275-277`,
  amendment 3), and it never shrinks anything.

**R8. Home row counts** (re-verify in AC-0).
- 5c E14 (2026-11-03):
  - EN 2: 3 featured services / 2 testimonials (from the fixtures, `local-fixtures.php:88-136`);
  - FR 535 / ES 536: 2 / 4 (legacy).
- On 2026-11-06 Mauricio saved the hero image on the **EN home** in admin (5c report :269). Per E13, that save copies
  every Copy key to FR/ES, including the repeater counts.
- Two later observations fit that sync:
  - design-round.md:164 (axe, rev 4): "FR/ES home: empty 3rd `service-card` h3";
  - design-round-pr3.md:303-305: "legacy cards plus an icon-only third card".
- **Inference (not measured, R0):** FR/ES home now have 3 featured rows, where row 3 has the EN icon and no text, and
  2 testimonials.
- Production EN is inferred to still have the legacy 2 / 4 (5c A6).

**R9. Trépied** (5c E14, 2026-11-03; re-verify in AC-0).
- EN 498:
  - title "TRÉPIED — trepied.ca";
  - rows 3/4/**4**, while the copy has 3/4/**6** (EN 1146-1153);
  - 7 images; legacy subtitle and captions.
- FR 550 / ES 541:
  - titles `[FR TEST] TRÉPIED — trepied.ca` / `[ES TEST] …`;
  - EN legacy body; `cardDescription` and final CTA null;
  - not checklist rows, and no `_icl_lang_duplicate_of` (5c E4).
- Approved hero headings: EN 1117, FR 597 and ES 603 all read "Trépied".
- The EN growth list in the loader (`load-content.php:209-213`) has no Trépied entry.

**R10. Post titles.**
- `ProjectsGrid/index.tsx:80` renders the post title as the card `h3`. `projects/[slug]/page.tsx:51` uses it as the case
  title.
- `HeroLoader.tsx:31,39`: the page title is the fallback hero title and the hero image `alt`.
- The loader has no title support (5c §2: "Not written: post title").
- Local EN titles (5c E14): 270 "Dangel Wellness — dangelwellness.ca", 224 "Shamanicca’s Ecommerce", 498 "TRÉPIED —
  trepied.ca", 32 "About Magneto" (kept, decided 2026-11-13).
- 5c D-6 (a) set the rule for FR/ES: page titles = the dictionary nav labels, case titles = the export's hero heading.
  It gave FR 634 "À propos" and ES 647 "Sobre Magneto".

**R11. EN final CTAs and the deferred EN fields.**
- Local EN `ctaText` / `secondaryCtaText` = "Book a Strategy Call" on 7 posts: home 2, services 34, packages 36
  (secondary), about 32, and the cases 270 / 224 / 498.
- They come only from `local-fixtures.php:137-163`. The copy says "Book a Free Strategy Call".
- `content.test.ts:113` `EN_DEFERRED` is exactly the 5c "5c-rest" item 3 set: About `description_html` + CTA,
  `card_description`, and the six final-CTA fields.

**R12. B5 (FIX and CARE share an icon).**
- `local-fixtures.php:108-109` reuses the web-dev icon for rows 2 and 3.
- FR/ES take the EN original (`FeaturedServices/api.ts:41`).
- Images are set in admin only; the loader never writes them.

**R13. Lead-magnet blocks.**
- EN "### 6. Lead Magnet" (EN 107-162) is the "10-Minute Website Checkup".
- FR "## 6. Guide gratuit" (FR 99-125) reads "Améliorer ou refaire votre site?".
- ES "## 6. Guía gratuita — BLOQUE OCULTO…" (ES 103-131) reads "¿Mejorar o rehacer tu sitio web?".
- No test and no `export-sections.json` entry reads these blocks (grep).
- The privacy-route spec (O-2) assigns the title alignment to "5e / 5c-rest and its authorized export".

**R14. Home About: component and content model (for Appendix A item 8).**
- `AboutSection/index.tsx:13-24` renders `aboutSectionTitle` as the section's `h2` (`typo-3xl-extrabold`) and
  `bodyHtml` (= `descriptionHtml`, else the legacy `description`) as sanitized HTML in one `typo-xl-medium` block,
  max 70ch (`AboutSection.scss`, M2). It has no separate "lead" slot.
- ACF: `aboutSectionTitle` is `text`, Translate (`wpml_cf_preferences: 2`, `phase-5-field-groups.json:1283-1303`);
  `description_html` is `wysiwyg` (ADR 0006).
- Export today (EN 29-37, FR 29-37, ES 31-39): a section label (EN `### 2. Meet Magneto`, FR `## 2. Découvrir
  Magneto`, ES `## 2. Conoce Magneto`), then a visible heading (EN `####` / FR-ES `###` "Work directly with…"), then 3
  paragraphs. 5a A3: section labels are not displayed; the visible heading line maps to `aboutSectionTitle`
  (`local-fixtures.php:78`).
- `content.test.ts:33-34` strips `#{1,4} ` from source lines; it does **not** strip the "2. " numbering. So a `src`
  that points at the section-label line would not match "Meet Magneto". A `src` that points at the visible-heading
  line does.
- Today, FR 535 / ES 536 `aboutSectionTitle` = the legacy "Meet Magneto" (5c spec :239). That is why AC-8 checks for
  "Meet Magneto" on FR/ES.

## Assumptions and open questions
- **A1.** The R8 inference holds: FR/ES home rows = EN, 3 / 2. AC-0 measures it. Either way, the §7 EN home save
  (needed for B5) re-syncs the counts.
- **A2.** Production FR/ES `home` and Trépied translations exist (Phase 3b). This is not verified. The release
  preflight checks it read-only. If they are missing, they join the production checklist as rows 14-17.
- **A3.** "EN final CTAs" means the whole `EN_DEFERRED` set (R11), so `EN_DEFERRED` is removed.
- **A4.** The new export keeps the `637fba7` formats: CTA line forms and heading levels. If it doesn't, the
  normalizer (`content.test.ts:33-34`) changes in the same PR.
- **A5.** `wp post update <ID> --post_title=…` fires `save_post`. On an EN post with translations, it therefore runs the
  WPML Copy sync of E13. The §8 follow-up covers it.
- **A6.** Appendix A item 1 "applied" (Mauricio, 2026-11-13) includes ES 755, 864 and 909 (D-14 A). AC-2 and the AC-3
  grep confirm it.
- **A7.** The plugin updates of §0 do not rename or remove any GraphQL field this site reads. Not verified (R0). The
  §0 gate re-run checks it.
- **O-2.** The Trépied pre-promotion gate (EN 1201-1214) does not block publication. Claims stay as approved.

## Design

### 0. Local plugin parity (precondition P-2) — Mauricio, before AC-0 and before any load
**Fact (Mauricio, 2026-11-13):** the **production** CMS was updated on 2026-11-13:

| Plugin | Before | Production now |
|---|---|---|
| WPGraphQL | 2.25.0 | **2.28.0** |
| WPGraphQL for ACF | 3.0.0 | **3.2.1** |
| ACF PRO | 6.8.10 | **6.8.11** |
| WPGraphQL IDE | — | **5.9.0** |
| Disable Media Sizes | — | **2.7** |
| WPML Multilingual CMS | 4.7.6 | 4.7.6 (unchanged) |
| ACFML | 2.1.5 | 2.1.5 (unchanged) |
| WPML GraphQL | 1.1.3 | 1.1.3 (unchanged) |

The production WPML site key is now a production key (no "Development Site" badge).

**Steps (Mauricio; agents never run `wp`):**
1. Fresh local backup (done by Mauricio): its name goes in the report.
2. Bring the local plugins to the "Production now" column. Record `wp plugin list --fields=name,version,status`
   before and after, and paste both into the report.
3. **Local keeps its own WPML key / development registration.** Never put the production site key on the local site.
4. `wp cache flush`.

**Gate re-run (before AC-0; any failure → stop, no load):**
- **Dev:** the completion gate `npm run lint && npm run typecheck && npm test -- --run && npm run build` at `master`,
  with the results compared with the last green run (lint ≤ baseline).
- **Dev, read-only GraphQL:** every query in AC-0 returns with no `errors` and the field names in R7 / R14.
  Introspect `HomeAboutSection`, `HomeFeaturedServices`, `HomeTestimonialsSection`, the final-CTA group and
  `ProjectData`, and paste the trimmed response into the report.
- **Mauricio:** `check-translations.php` = 13/13 PASS, and `load-content.php lang=en|fr|es dry-run` with the
  **current** content files = 0 changes each. Paste the outputs into the report.
- **Dev:** a fresh render on port 3100 of `/`, `/fr`, `/es`, `/projects/dangel-…` (EN slug from AC-0) at 1440, with
  no new console errors.

### 1. Notion edits by Mauricio **before** the export (cut-off Mon 11-16, 12:00)
The 8 items, with their current text, target text and **status**, are in **Appendix A**. At the cut-off, item 6 must
be done. Item 8 must be done in all three languages, or it is left out (D-12).

Export procedure: the same as for `637fba7`. The three files in `docs/content/` are replaced by the export, with no
hand edits.

### 2. Re-export and re-pin (one commit, gate green)
- **Export diff review (AC-2):** the Dev lists every changed hunk of `git diff 637fba7 -- docs/content` and maps each
  one to an Appendix A item. A hunk in approved copy that maps to no item means: stop and ask (Hard rule 4).
- **Re-pin in the same PR:**
  - sha and commit in `content.test.ts` and the three `content/*.json` files;
  - every `src` range;
  - `BLOCKS`, `CONTACT_COPY` and `PRIVACY_META`;
  - the `export-sections.json` anchors and its note;
  - the comment line references (R1).
- **Remove the K1-K3 exception:** delete `DESCRIPTION_EXCEPTIONS` and its guard test (`page-metadata.test.ts:32-37`,
  `:76-83`). Callers of `exported()` use `fromExport()` directly.

### 3. Dictionary changes (verbatim from the new export)
- **ES (`es.ts`):**
  - `:8` → "Reservar consulta gratis";
  - `:113` → the new ES "Fallo del envío" line;
  - `:114` → "reserva una consulta gratis", which must stay an exact substring of `:113`;
  - `:158` → the new ES 944 line (D-11).
- **FR (`fr.ts`):** `:189` and `:193` → the new FR "SEO — Accueil" description.
- **Tests:** `dictionary.test.ts:68` and `FinalCTASection.test.tsx:19`.
- **QA tool:**
  - `glossary.json:27`: the note no longer says "differs … on purpose"; the header label still differs from the main
    CTA.
  - The eval fixture `es.ts:4`. The eval tests must stay green.

### 4. Content files (loader schema unchanged)
**EN (`en.json`).** New entries are appended per post, using 5c's same-slug merge, which is allowed in EN only.
- `home`:
  - About title + `description_html` (see "Home About" below);
  - featured services, 3 rows: title, tagline, description, anchor;
  - testimonials, 2 rows: the 6 text sub-keys;
  - `footerLine2`;
  - the final CTA (6 fields).
- Final CTAs on services, packages, about-magneto and both cases.
- About `description_html` + `about_cta_text` / `about_cta_path`.
- `card_description` on all 3 cases.
- These entries remove `EN_DEFERRED`.
- `trepied-trepied-ca` (new post):
  - `project_data`: subtitle, description, rows 3/4/6;
  - `card_description`;
  - `images[0-6].foot_note = ""` (D-4);
  - the final CTA.

**FR / ES (`fr.json`, `es.json`).**
- `home` gains the same body, footer line and final CTA as EN.
- New post `trepied-trepied-ca`, with the same shape as EN.
- The ES CTA values take the new label.

**Home About (Appendix A item 8; no `src` change, no new ACF field).** This applies if item 8 is in the export.
Otherwise the current heading and paragraphs are loaded as they are.
- `homeAboutSection.aboutSectionTitle` (`field_689a5bb77c99c`) = the **visible-heading line** of the new export
  (EN `####`, FR/ES `###`), which Mauricio sets to "Meet Magneto" / "Découvrir Magneto" / "Conoce Magneto". `src`
  points at that line, **not** at the numbered section-label line (R14).
- `homeAboutSection.description_html` = `<p>`lead sentence`</p>` followed by one `<p>` per shortened paragraph, in
  export order. The lead sentence is the former heading ("Work directly with the person who plans, designs and builds
  your website." and its FR/ES equivalents, as written in Notion).
- If the lead is bold in Notion (`**…**`), the value is `<p><strong>…</strong></p>`. The verbatim check strips `**`
  and reads `textContent`, so it passes either way. Without bold, the lead renders in the same style as the
  paragraphs. A distinct lead style would need a `src` change (out of scope).
- Structure equality EN = FR = ES applies: the same number of `<p>` pieces in all three languages.

**Testimonial `note`:** the value comes from Appendix A item 6:
- EN: "Translated from Spanish." (Dangel row);
- FR: "Traduit de l'espagnol." only; the provenance note is internal and never loaded;
- ES: `""`;
- Isra row: `""` in all three languages.

An empty value is written as `""`.

**Never written** (5c rules, unchanged):
- images (`service_icon`, `thumb`), urls;
- titles, `display_order`, `cta_link_hero`.

**`content.test.ts` changes:**
- the post lists;
- `MAIN_CTA.es`;
- structure equality EN = FR = ES on every post, with no deferred set.

### 5. Loader and checker (minimal)
- **`load-content.php:209-213`:** add `'project/trepied-trepied-ca' => array( 'project_data_results' => array( 4, 6 ) )`.
  Nothing else changes. The home repeaters keep the current rules: exact in EN; ≤ EN and no growth (image sub-field)
  in FR/ES.
- **`check-translations.php`:** add rows 14-17. They are informational and not counted in "/13":
  - Trépied FR 550 / ES 541, expected title "Trépied";
  - home FR 535 / ES 536, expected titles "Accueil" / "Inicio".
  
  Each row prints the `service` / `testimonials` / case row counts and the media report.
- **Stub harness (scratchpad), new proofs:**
  - an FR Trépied run appends results 4 → 6;
  - an FR home run aborts when the `service` rows are below EN.

### 6. `src` change (design-round-pr3:303-305)
- `FeaturedServices/index.tsx`: skip a row whose `serviceTitle` is empty or whitespace. No prop or export change.
- New `FeaturedServices.test.tsx`:
  - 3 rows with one empty title → 2 cards;
  - all titles empty → renders `null`.

### 7. Home rows and B5 (D-9 B) — Mauricio, in admin, before any load
**The exception to 5c §8 rule 1 (decided 2026-11-13).** For the **EN `home`** page only:
- rows may be **added or deleted at the end** of `homeFeaturedServices.service` and
  `homeTestimonialsSection.testimonials`;
- rows are **never reordered**;
- **a fresh backup comes first**.

Every other §8 rule applies:
- one Update, then close the page;
- never open the WPML translation editor;
- never re-duplicate.

**Local:**
- In EN home (2), set the CARE row's `service_icon` to a distinct icon (B5). Locally no row changes are expected
  (EN 3 / 2).
- If AC-0 shows that FR/ES rows differ from EN, this same save re-syncs them.

**Follow-up (same session):**
1. `wp cache flush`.
2. `check-translations.php`: rows 16-17 show `service 3/3`, `testimonials 2/2` and `media ok`.
3. `load-content.php lang=en|fr|es dry-run` with the **current** content files: 0 changes each.

### 8. Post titles (O-1, decided 2026-11-13) — Mauricio runs `wp post update`, backup first
**Rule:** case titles = the export's hero heading. Page titles are not changed in this phase: the About post keeps
"About Magneto" (decided 2026-11-13). Change the title only. **Never pass `--post_name` or `--post_status`.**

| # | Local ID | Lang | Current title (5c E14, re-verify in AC-0) | Target title | Source |
|---|---:|---|---|---|---|
| T1 | 270 | en | Dangel Wellness — dangelwellness.ca | Dangel Wellness | EN 1008 |
| T2 | 224 | en | Shamanicca’s Ecommerce | Shamanicca | EN 1248 |
| T3 | 498 | en | TRÉPIED — trepied.ca | Trépied | EN 1117 |
| T5 | 550 | fr | [FR TEST] TRÉPIED — trepied.ca | Trépied | FR 597 |
| T6 | 541 | es | [ES TEST] TRÉPIED — trepied.ca | Trépied | ES 603 |

(T4, the About title, was dropped on 2026-11-13. The numbers are kept so that earlier references stay valid.)

Run it in the Local "Open site shell", in the same session as §7, before the loads (A4 of 5c: FR/ES posts are only
saved before their load):
```bash
wp db export ~/Documents/projects/magneto/backups/phase-5c/magneto-cms-2_titles-before_$(date +%Y%m%d-%H%M).sql
wp post update 270 --post_title="Dangel Wellness"
wp post update 224 --post_title="Shamanicca"
wp post update 498 --post_title="Trépied"
wp post update 550 --post_title="Trépied"
wp post update 541 --post_title="Trépied"
wp cache flush
wp post list --post_type=project --post__in=270,224,498,550,541 --fields=ID,post_title,post_name,post_status
```
- **Expected:** `post_name` and `post_status` are unchanged.
- **Follow-up:** T1-T3 are EN saves (A5), so the §7 follow-up steps 2-3 run after them (one follow-up covers §7 and §8).
- **Production:** the IDs differ. The runbook resolves each post by slug (`fashion-company-ecommerce`,
  `shamaniccas-ecommerce`, `trepied-trepied-ca`) and runs the same title updates, with a production backup first.

### 9. Order of local operations
0. Preconditions: P-1 (AC-12) passed; P-2 (§0 parity + gate re-run) passed; AC-0 measured; the Dev's expected totals
   written.
1. Backup → §7 (B5 icon) → §8 (titles) → one follow-up.
2. `check-translations.php`: 13/13 PASS, and rows 14-17 as expected.
3. **EN load:**
   1. backup;
   2. dry-run = expected, with exactly 2 `+ append` lines (Trépied `project_data_results[4]`, `[5]`);
   3. the real run;
   4. `wp cache flush`;
   5. a second dry-run with `0 changes (0 appended rows)`.
4. **FR load:** the same steps, plus Trépied +2 appends if FR is at 3/4/4.
5. **ES load:** the same steps.
6. Dev: GraphQL read-back, checks on a fresh render (the stale fetch-cache rule, 5c report :601-608), screenshots.

### 10. What release day needs from this phase (list for the runbook)
- The final `en.json` / `fr.json` / `es.json` at the new export sha, plus the expected dry-run totals per language
  from the local runs.
- **The plugin versions verified locally in §0**, as the production baseline. The runbook preflight confirms that
  production still runs the same versions (read-only, admin Plugins screen). If it doesn't, stop before any load.
- The 13 FR/ES production posts (OQ-1): created after this phase passes locally and before Sun 11-22. A read-only check
  confirms that FR/ES `home` and Trépied exist in production (A2).
- **D-9 B in production, before the EN load.** In admin, on EN home:
  - featured services 2 → 3 rows (append at the end; icons, including B5);
  - testimonials 4 → 2 (delete the last 2 rows; set or clear the thumbs);
  - never reorder; backup first.
  
  WPML copies the counts and icons to FR/ES. Then the §7 follow-up runs.
- The §8 title updates (T1-T3, T5, T6), by slug.
- Then: EN load → Services media (5c D-7 B) → FR load → ES load → promote.
- The production EN Trépied row counts are measured read-only first. The growth rule accepts 4 → 6 only.

## Files the Dev may touch
- `docs/content/magneto-copy-{en,fr-CA,es}.md`: replaced by Mauricio's export only.
- `scripts/phase-5c/content/{en,fr,es}.json`, `scripts/phase-5c/content.test.ts`.
- `scripts/phase-5c/load-content.php`: the growth entry only.
- `scripts/phase-5c/check-translations.php`: rows 14-17.
- `src/i18n/dictionaries/es.ts`, `fr.ts`: values per §3, plus the line-reference comments.
- `src/i18n/dictionaries/en.ts`: comments only.
- `src/i18n/dictionary.test.ts`.
- `src/i18n/dictionaries/en.test.ts`: comments only.
- `src/utils/page-metadata.test.ts`.
- `src/components/organisms/FinalCTASection/FinalCTASection.test.tsx`.
- `src/components/organisms/FeaturedServices/index.tsx` and `FeaturedServices.test.tsx` (new).
- `scripts/qa-i18n/config/glossary.json`, `scripts/qa-i18n/config/export-sections.json`.
- `scripts/qa-i18n/evals/fixture/dictionaries/es.ts`.
- `docs/reports/phase-5c-rest.md` (new).

Anything else is out of scope, including `AboutSection/*`, `local-fixtures.php`, the ACF JSON, the ADRs, `.env*`,
`AGENTS.md` and `CLAUDE.md`.

## Out of scope
- Hero-resize round; the hero illustration re-export (D-13 dropped).
- Any About post title change (T4 dropped).
- A distinct visual "lead" style in the Home About section (it would need a `src` change).
- The `/carte` route.
- 5e (lead-magnet rendering, Brevo, `emailModal.*` copy) and 5f.
- Any production write, including plugin updates (done by Mauricio on 2026-11-13).
- The empty caption `<p>`.
- `<main>` landmark work beyond PR 1b.

## Acceptance criteria
- [ ] **AC-P2 (before AC-0):** §0 is done. The report contains the backup name, `wp plugin list` before and after
  (local = the "Production now" column), and the gate re-run results: completion gate, GraphQL introspection with no
  `errors`, `check-translations.php` 13/13, three 0-change dry-runs, and the 1440 render check.
- [ ] **AC-0 (Dev, read-only, Local running, after AC-P2):** GraphQL row counts and titles are recorded for home
  EN/FR/ES, Trépied EN/FR/ES and posts 270 / 224. R8, R9 and R10 are confirmed or corrected before the expected totals
  are written.
- [ ] **AC-1 `content.test.ts` green:**
  - the new sha pins;
  - the verbatim check, and a one-word mutation fails it;
  - structure EN = FR = ES on every post;
  - no `EN_DEFERRED`;
  - `MAIN_CTA.es` = "Reservar consulta gratis";
  - no forbidden keys.
- [ ] **AC-2 Export diff table** in the report: every hunk is mapped to an Appendix A item, and no hunk in approved copy
  is unmapped. It also states whether item 8 is in the export.
- [ ] **AC-3 Greps:**
  - `grep -rn "637fba7\|d3516151\|f52cf70e\|83332a1b" src scripts` → 0 matches;
  - `grep -rn "llamada de orientación" src scripts/phase-5c` → 0 matches;
  - `grep -n "llamada de orientación" docs/content/magneto-copy-es.md` → only internal checklist lines, if any (none of
    755, 864, 909 or the CTA lines);
  - `DESCRIPTION_EXCEPTIONS` is absent.
- [ ] **AC-4 Dictionary:**
  - ES `sendFailed` ends "…o reserva una consulta gratis.", and `sendFailedCta` = "reserva una consulta gratis";
  - the ContactForm button's accessible name = that phrase;
  - ES `bookingModal.privacyText` ends "Reservar una consulta no te suscribe a correos promocionales.";
  - FR `meta.home.description` contains "directe".
- [ ] **AC-5 Gate:**
  - `npm run lint && npm run typecheck && npm test -- --run && npm run build` passes;
  - lint is ≤ the `master` count, measured by the Dev before any change;
  - `php -l` is clean on both PHP files;
  - the deterministic `qa-i18n` run shows no `main-cta` error and no ES `cta-label` length warning.
- [ ] **AC-6 Harness proofs and runs:**
  - the §5 harness proofs pass;
  - §7 + §8 are done, with the backup names and the follow-up outputs in the report;
  - each of the EN, FR and ES runs has:
    - a dry-run = expected;
    - a read-back that is all ok;
    - a cross-language probe unchanged;
    - a second dry-run with `0 changes (0 appended rows)`;
    - its backup named.
- [ ] **AC-7 GraphQL read-back:**
  - every loaded value = the content files;
  - home rows are 3 / 2 in EN, FR and ES;
  - Trépied is 3/4/6, with 7 images equal to EN;
  - FIX and CARE `serviceIcon` `sourceUrl`s differ;
  - titles T1-T3, T5 and T6 = targets, with slugs and statuses unchanged; post 32 still "About Magneto".
- [ ] **AC-8 Rendering** (port 3100, `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1`, fresh render):
  - Routes: `/`, `/fr`, `/es`, `/projects`, `/{fr,es}/projects`, the three Trépied routes, `/about-magneto` and the EN
    cases, each at 375/768/1440, with no horizontal scroll.
  - 0 hits for:
    - "[FR TEST]", "[ES TEST]";
    - "Serving clients worldwide", "Ready to stop guessing", "Get Your Free Strategy Call";
    - "Meet Magneto" on `/fr` and `/es`;
    - "Book a Strategy Call" outside the header;
    - "llamada de orientación".
  - FR/ES home shows 3 titled cards and 2 testimonials.
  - The footer line is localized.
  - The ES Contact hero and the booking-modal title show "Reservar consulta gratis".
  - **Home About:**
    - if item 8 is in the export: the section `h2` is "Meet Magneto" (`/`), "Découvrir Magneto" (`/fr`) or "Conoce
      Magneto" (`/es`); the first body paragraph is the lead sentence; the page still has exactly one `h1`, and the
      About section has one `h2`;
    - otherwise: the `h2` is the current visible heading in each language;
    - in both cases, the M2 layout (h2 full width on top, body ≤ 70ch, left-aligned) is re-checked at the three widths.
- [ ] **AC-9 EN unchanged except the planned values:** final-CTA labels, the home body (including Home About if item 8
  ships), Trépied, the footer line and titles T1-T3.
- [ ] **AC-10 Approval and report:** Mauricio approves FR (FR-CA reader) and ES. Report: `docs/reports/phase-5c-rest.md`.

## Mid-phase checkpoint — Wed 11-18, end of day (Mauricio + Senior Architect, ≈ 20 min)
**Required:**
1. AC-P2 is done (plugin parity + gate re-run).
2. The export is pinned, and the AC-2 table is done.
3. AC-1, AC-3, AC-4 and AC-5 are green.
4. AC-0 is done.
5. §7 + §8 are done, with the follow-up passed.
6. The expected dry-run totals per language are written.

**Outcome:** go/no-go for the Thu 11-19 loads. If the export is late, the loads move to Fri 11-20, and the trigger for
the 12-10 fallback release is checked again.

## Decisions

**Decided (Mauricio, 2026-11-13):**
- **D-9 → B.** Home rows are edited in admin on EN home, WPML Copy sync carries them to FR/ES, and the §7 follow-up
  runs. The loader is unchanged. The explicit exception to 5c §8 rule 1 is recorded in §7:
  - EN home only;
  - add or delete at the end only;
  - never reorder;
  - backup first.
  
  Condition: AC-12 passes. Rejected:
  - A: a one-off loader rule (deletes and image writes; ADR 0006 amendment 4);
  - C: re-creating the FR/ES home translations.
- **D-11 → confirmed.** The ES modal privacy sentence ends "Reservar una consulta no te suscribe a correos
  promocionales." It goes into Notion (Appendix A item 3), then into `es.ts:158` through the export.
- **D-12 → as recommended, now specified.** The Home About restructure (item 8) ships only if all three languages
  are in Notion at the export cut-off. Otherwise it is post-launch. It needs no `src` change and no new ACF field
  (§4 "Home About", R14).
- **D-13 → dropped.** The current hero illustration file is acceptable. It is out of this phase.
- **D-14 → A (match).** ES 755 (the label after "¿Prefieres conversar?") and the modal headings ES 864 / 909 read
  "Reservar consulta gratis" in Notion (Appendix A item 1). No code change: both surfaces already render
  `common.bookStrategyCall` (R4). FR is already consistent; no FR change.
- **O-1 → in scope, narrowed.** Mauricio updates the case post titles himself with `wp post update`, backup first
  (§8: T1-T3, T5, T6).
- **T4 → dropped.** The About post keeps "About Magneto".

No ADR is needed: no new dependency, routing or data-model change. The plugin updates (§0) were already applied in
production by Mauricio. This spec only requires local parity.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | The export brings copy changes nobody planned | AC-2 hunk mapping; stop on any unmapped change to approved copy |
| R-2 | The Notion edits are late (item 6 pending; item 8 optional), so the export is late | Cut-off Mon 12:00; item 8 drops to post-launch rather than delaying; Wed checkpoint; 12-10 fallback |
| R-3 | AC-12 / A5 fails, so D-9 B is invalid | It is a precondition; the spec goes back to review |
| R-4 | FR/ES home rows ≠ EN (A1 wrong) | AC-0; the §7 EN save re-syncs; the loader aborts on a mismatch |
| R-5 | The ES label changes in only one of dictionary / CMS | Same PR; `main-cta` QA check; AC-3 grep |
| R-6 | Re-pinning breaks unrelated tests | One commit; full gate; comment-only references listed |
| R-7 | A stale fetch-cache hides the loads | Fresh-render rule (5c report :601-608) |
| R-8 | Orphan testimonial meta (rows 2-3) stays on FR/ES after the production shrink | Harmless, because the count meta governs; noted for the runbook |
| R-9 | Production FR/ES home or Trépied is missing (A2) | Release preflight; checklist rows 14-17 |
| R-10 | Lint ceiling (88 / 94 at 5c) | Measure on `master` first; no new errors |
| R-11 | A title update also touches the slug, or an FR/ES post is saved after its load | Title-only commands; `wp post list` check; titles run before the loads |
| R-12 | **Plugin drift:** local runs older WPGraphQL / WPGraphQL for ACF / ACF PRO than production. The local results (schema, ACF field resolution, the WPML Copy sync behind D-9 B and A5) then don't predict production | P-2 / §0: parity before AC-0; gate re-run with GraphQL introspection, `check-translations` and 0-change dry-runs; the §10 runbook preflight re-checks the production versions |
| R-13 | **The update itself changes behaviour** (WPGraphQL 2.25 → 2.28, WPGraphQL for ACF 3.0 → 3.2.1): renamed or nullability-changed fields, or a different empty-value shape for `wysiwyg` / repeaters | Fresh backup before the update; §0 introspection of the groups the site reads; if a difference is found, stop and return the spec for review (no workaround in this phase) |
| R-14 | The WPML production key is copied to local, or local loses its dev registration, and WPML behaves differently | §0 step 3: local keeps its own key; WPML versions are unchanged |

## Estimate (ranges)
| Task | Agent | Mauricio |
|---|---:|---:|
| Spec review | — | 15–30 min |
| §0 local plugin parity (backup, update, `wp plugin list`, checks) | 1 h (gate re-run, introspection, render) | 30–45 min |
| Notion edits (Appendix A: item 6, optional item 8) + export | — | 0.5–1.5 h |
| Export diff table + re-pin (tests, JSON `src`, QA config) | 2–3 h | — |
| Dictionary: ES label set, K1-K3, "directe" | 1 h | — |
| Content: EN home / final CTAs / deferred fields; FR/ES home; Trépied ×3 | 4–5 h | — |
| Loader growth entry + checker rows + harness | 1 h | — |
| FeaturedServices guard + test | 0.5 h | — |
| AC-0 + expected totals | 1 h | — |
| §7 B5 icon + §8 titles + follow-up | 0.25 h (read-back) | 35–50 min |
| Loads EN / FR / ES | 0.5 h | 1–1.5 h |
| Read-back, rendering, screenshots, report | 3–4 h | 45–60 min (approval) |
| **Total** | **≈ 15–20 h** | **≈ 4.5–6.5 h** |

Calendar (estimates):
- **Sat 11-14:** 5c AC-12; §0 local plugin parity (after AC-12, so that AC-12 runs on the same versions as 5c).
- **Mon 11-16:** review, the last Notion edits, export.
- **Tue 11-17 – Wed 11-18:** gate re-run (AC-P2), then Dev implementation; checkpoint Wed end of day.
- **Thu 11-19:** loads.
- **Fri 11-20:** report and approval.
- **Before Sun 11-22:** the production FR/ES posts.
- **Week of 11-23:** release-day runbook.

## Appendix A — Notion edits before the export (Mauricio)
Line numbers are at `637fba7`. Agents never write or translate copy (Hard rule 4). Wherever a target says "Mauricio
writes", the wording comes from Notion.

**Status (Mauricio, 2026-11-13):**

| # | Item | Status |
|---|---|---|
| 1 | ES main CTA label (incl. 755 / 864 / 909, D-14 A) | Applied |
| 2 | ES Contact send-failure message | Applied |
| 3 | ES booking-modal privacy sentence | Applied |
| 4 | FR home meta description ("directe") | Already in Notion |
| 5 | K1-K3 meta descriptions | Already in Notion |
| 6 | Public testimonial `note` per language | **Pending** |
| 7 | FR/ES lead-magnet block | Already in Notion |
| 8 | Home About restructure (D-12) | **Pending** (optional; all three languages or none) |

1. **ES main CTA label**
   - **Where:** `magneto-copy-es.md`:
     - CTA lines 29, 139, 171, 232, 258, 589, 663, 737;
     - 389 "CTA principal" and 506 "CTA secundario";
     - 755 (the label after "¿Prefieres conversar?") and the modal headings 864, 909 (D-14 A).
   - **Current:** "Agendar una llamada de orientación gratuita"
   - **Target:** "Reservar consulta gratis"
2. **ES Contact send-failure message**
   - **Where:** ES 838 "Fallo del envío".
   - **Current:** "Ocurrió un error y tu mensaje no se envió. Inténtalo de nuevo o agenda una llamada de orientación
     gratuita."
   - **Target:** "Ocurrió un error y tu mensaje no se envió. Inténtalo de nuevo o reserva una consulta gratis."
3. **ES booking-modal privacy sentence (D-11)**
   - **Where:** ES 944 (the published variant B2), and the same sentence in variants 899, 903 and 940.
   - **Current:** "… Agendar una llamada no te suscribe a correos promocionales."
   - **Target:** "… Reservar una consulta no te suscribe a correos promocionales."
4. **FR home meta description ("directe", 5g W2)**
   - **Where:** FR 147 "SEO — Accueil".
   - **Current:** "Magneto conçoit, améliore et entretient des sites web pour les entreprises de services à Montréal.
     Stratégie, UX/UI et développement avec son fondateur, en français, en anglais et en espagnol."
   - **Target:** "…développement **avec l'implication directe du fondateur**, en français, en anglais et en espagnol."
5. **K1-K3 meta descriptions**
   - **K1, FR 240 "SEO — À propos":**
     - Current: "Découvrez Mauricio Bayuelo, fondateur de Magneto à Montréal : stratégie web, UX/UI et développement pour
       les entreprises de services, en français, en anglais et en espagnol."
     - Target: "Mauricio Bayuelo, fondateur de Magneto Web Consulting à Montréal : stratégie web, UX/UI et développement
       pour entreprises de services, en trois langues."
   - **K2, ES 246 "SEO — Sobre Magneto":**
     - Current: "Conoce a Mauricio Bayuelo, fundador de Magneto en Montreal. Estrategia web, diseño UX/UI y desarrollo
       para empresas de servicios, en español, francés e inglés."
     - Target: "Mauricio Bayuelo, fundador de Magneto Web Consulting en Montreal: estrategia web, diseño UX/UI y
       desarrollo para empresas de servicios, en tres idiomas."
   - **K3, ES 852 "SEO — Contacto":**
     - Current: "Contacta a Magneto en Montreal. Cuéntame qué necesitas crear, corregir o mantener en tu sitio web.
       Atención en español, francés e inglés."
     - Target: "Contacta a Magneto Web Consulting en Montreal. Cuéntame qué necesitas crear, corregir o mantener en tu
       sitio web. Atención en español, francés e inglés."
6. **Public testimonial `note` per language** (the field is rendered; Dangel row only) — **pending**
   - **EN 96:** "*Translated from Spanish.*", no change.
   - **FR 91:**
     - Current: "*Traduit de l'espagnol (original : courriel du 2026-08-20, vérifié). Traduction validée par Mauricio
       (2026-10-26).*"
     - Target: a separate public line "Traduit de l'espagnol.", plus the provenance kept as a clearly marked
       **internal** note (not loaded).
   - **ES 93:**
     - Current: an internal note only ("Original en español, verificado contra el correo del 2026-08-20; …").
     - Target: an explicit "no public note" line (the original is Spanish). The internal note may stay, marked as
       internal.
   - **Isra row:** no public note in any language.
7. **FR/ES lead-magnet block aligned with the EN "checkup"** — already in Notion
   - **Where:** FR 99-107 and ES 103-113.
   - **Target:** FR and ES equivalents of EN 109-115 (eyebrow "Free website checkup", heading "Fix, rebuild or
     maintain? Find out what your website really needs.", title "Fix, Rebuild or Maintain? The 10-Minute Website
     Checkup"). It is not rendered in this phase (5e).
8. **Home About restructure (optional, D-12)** — pending; all three languages or none
   - **Where:** EN 29-37, FR 29-37, ES 31-39.
   - **Current:** a section label (not displayed), then a visible heading "Work directly with the person who plans,
     designs and builds your website." (and its FR/ES equivalents), then three paragraphs.
   - **Target shape** (Mauricio writes the wording):
     - keep the section-label line as it is (`### 2. Meet Magneto` / `## 2. Découvrir Magneto` / `## 2. Conoce
       Magneto`);
     - the **visible-heading line** (EN `####`, FR/ES `###`) becomes the short title, without a number: "Meet
       Magneto" / "Découvrir Magneto" / "Conoce Magneto";
     - the first paragraph under it is the former heading sentence (the lead), as a plain paragraph (optionally in
       bold);
     - then the paragraphs, slightly shorter, with the same number of paragraphs in all three languages.
   - Mapping and rendering: §4 "Home About", AC-8. If it is not in all three languages at the cut-off, nothing
     changes and it moves to post-launch.

Any other Notion change made before the export must be listed for the Architect, so that AC-2 can map it.
