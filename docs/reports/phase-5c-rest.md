# Phase 5c-rest report — FR/ES home body, Trépied, EN final CTAs, ES CTA label, re-export

- Spec: `docs/specs/phase-5c-rest.md` rev 0.3 (Approved), plus D-15 (2026-11-17)
- Author: Dev · Dates: 2026-11-17 (implementation, mid-phase checkpoint), 2026-11-18 (loads by Mauricio, verification)
- Branch: `feat/phase-5c-rest` · everything unstaged · nothing committed

## Result
**Done locally, pending AC-10 (Mauricio's FR-CA / ES approval).** AC-0 to AC-9 pass on the local CMS: the three loads
(by Mauricio) ended with 0-change dry-runs; the GraphQL read-back equals the content files; the AC-8 routes render the
approved copy at 375/768/1440 with 0 hits on the forbidden list. Open items:
- **R-12**: plugin gap (local WPML 5.4.0 vs production 4.7.6), to resolve before the production load (§10);
- the EN post-launch slug change for Dangel (Issues);
- the ES privacy terminology (routed to the ES privacy final review).

| AC | Status | Where |
|---|---|---|
| AC-P2 | Done, with a gap: parity **not achieved** (R-12) | Evidence → AC-P2 |
| AC-0 | Done | Evidence → AC-0 |
| AC-1 · AC-3 · AC-4 · AC-5 | ✅ | Evidence → AC-1 … AC-5; Gate |
| AC-2 | Done | Evidence → AC-2 |
| AC-6 | ✅ (one deviation: §7/§8 follow-up step 3 not run, see Deviations) | Evidence → §7, §8, loads |
| AC-7 | ✅ 711 values, 0 mismatches; structure, icons, titles | Evidence → AC-7 |
| AC-8 | ✅ 27 routes SSR, 12 routes × 3 widths in Chrome | Evidence → AC-8 |
| AC-9 | ✅ EN changes = planned values only | Evidence → AC-9 |
| AC-10 | **Mauricio** (FR-CA reader, ES) | — |
| 5c AC-12 step 5 + addendum | ✅ | Evidence → AC-12; `docs/reports/phase-5c-loader.md` addendum |

## Changes
Export (Mauricio, 2026-11-17, D-15 "Export → Markdown & CSV"):
- `docs/content/magneto-copy-{en,fr-CA,es}.md` — the re-export. sha256 en `364f661f…77606f5`, fr-CA `b79f5ff7…2d5a516b`,
  es `737b0084…24bdb6`.

Re-pin (`source.commit` = `"export 2026-11-17"`; the sha256 is the real pin):
- `scripts/phase-5c/content.test.ts` — `EXPORT_LABEL`, new `PINS`, `MAIN_CTA.es`; the normalizer drops its unescape step
  (D-15); `EN_DEFERRED` removed; post lists for the new entries; the D-2 test is now "every post has the same key set in
  EN, FR and ES"; structure EN = FR = ES on every post; `anchor_link` (`field_689a5402d1bcd`, hashed key) added to the
  structural keys; copy-value threshold > 155 (EN 160 / FR 160 / ES 159).
- `scripts/phase-5c/content/{en,fr,es}.json` — `source` re-pinned; every `src` range remapped (EN 34, FR 69, ES 69); ES
  CTA values → "Reservar consulta gratis" (9); **§4 additions** (below).
- `src/utils/page-metadata.test.ts` — `BLOCKS` re-pinned; `DESCRIPTION_EXCEPTIONS`, `exported()` and the K1-K3 guard
  test removed (callers use `fromExport()`); no unescape step.
- `src/i18n/dictionary.test.ts` — `CONTACT_COPY` / `PRIVACY_META` re-pinned; `:68` ES label; `fromExport` without
  unescape.
- `src/i18n/dictionaries/es.ts` — `:8` "Reservar consulta gratis"; `:113` / `:114` new send-failure line and CTA
  substring; `:158` privacy sentence (D-11); comment refs.
- `src/i18n/dictionaries/fr.ts` — `:189`, `:193` FR home description ("…l'implication directe du fondateur…"; double
  quotes for the apostrophe); comment refs.
- `src/i18n/dictionaries/en.ts`, `src/i18n/dictionaries/en.test.ts` — comment line references only (re-checked
  2026-11-18: 3 comment lines in `en.ts`, no value).
- `src/components/organisms/FinalCTASection/FinalCTASection.test.tsx` — ES label; refs.
- `scripts/qa-i18n/config/glossary.json` — header-CTA note; `emptyAllowed` (see Deviations).
- `scripts/qa-i18n/config/export-sections.json` — note "(export 2026-11-17, … D-15; anchors re-checked 2026-11-17)".
- `scripts/qa-i18n/evals/fixture/dictionaries/es.ts` — `bookStrategyCall` = "Reservar consulta gratis"; D6 is still
  detected (the fixture content holds the variant "Agenda una llamada gratuita").

§4 content additions (generated from the export lines by a scratchpad generator; values verbatim):
- **EN** (`en.json`, same-slug entries, EN only): `home` — About title (EN 23), `description_html` = 4 `<p>` (25, 27, 29,
  31), 3 service rows (title, tagline, description, anchor build/fix/care), 2 testimonial rows (6 text sub-keys),
  `footerLine2` (166), final CTA ×6; final CTAs on services (448-456), packages (570-578), about-magneto (276-280); About
  `description_html` (211-213) + `about_cta_text` (256) + `about_cta_path` `/contact`; `card_description` + final CTA on
  both cases; new post `project/trepied-trepied-ca` (project_data 3/4/6, card 75, `images[0-6].foot_note = ""` (D-4),
  final CTA).
- **FR / ES**: the same home fields inside the existing `home` post (no duplicate entries); new Trépied post. Testimonial
  `note` per Appendix A item 6: EN "Translated from Spanish.", FR "Traduit de l'espagnol.", ES `""`, Isra `""`.
- Generator check: the same converters regenerate 33 fields that were already in the files byte for byte.

Loader / checker / src:
- `scripts/phase-5c/load-content.php` — one line: `'project/trepied-trepied-ca' => array( 'project_data_results' => array( 4, 6 ) )`.
- `scripts/phase-5c/check-translations.php` — rows 14-17 (Trépied FR/ES "Trépied", home FR "Accueil" / ES "Inicio"),
  printed with "(info)", not counted in N/13; `service` and `testimonials` added to the page repeaters shown; a separate
  "info rows 14-17" media-WARN count.
- `src/components/organisms/FeaturedServices/index.tsx` — skips a row whose `serviceTitle` is empty or whitespace (no
  prop or export change).
- `src/components/organisms/FeaturedServices/FeaturedServices.test.tsx` (new) — 3 rows / 1 untitled → 2 cards; all
  empty or whitespace → `null`.

Outside the spec's file list (see Deviations): `scripts/qa-i18n/{inputs.ts,checks.ts,checks.test.ts,cli.test.ts}`,
`docs/specs/phase-5c-rest.md`, `docs/reports/phase-5c-loader.md` (AC-12 addendum).

## Gate
Final run 2026-11-18, after the loads, on the working tree.

| Check | Result | Notes |
|---|---|---|
| lint | passed (baseline) | 83 errors / 81 warnings = `master` measured before any change; exit 1 as on master |
| typecheck | passed | `tsc --noEmit` clean |
| tests | passed | 49 files / 701 tests |
| build | passed | `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1`; 35 static pages; 9 project paths prerendered (3 per locale); no other server used `.next` (checked: nothing on 3000/3100) |
| `php -l` | passed (2026-11-17) | both PHP files, Local's PHP 8.2.30; the PHP files were not changed since |
| qa-i18n deterministic | passed (2026-11-17) | 391 units, 0 errors; 0 `main-cta`, 0 `cta-label`. Not re-run: no input changed since |
| visual (routes · viewports · locales) | passed | AC-8: 12 routes × 375/768/1440 in Chrome (EN/FR/ES), 27 routes SSR; no console errors |

## Evidence

### AC-P2 — plugins, backup, gate re-run
- **Raw outputs arrived on 2026-11-18** (Mauricio, unedited, outside the repo):
  `~/Documents/projects/magneto/backups/phase-5c-rest/ac12-acp2-evidence-20261117.txt`. It holds the local
  `wp plugin list` **after** the update, the backup name, and the check-translations and dry-run outputs. There is still
  **no "before" `wp plugin list`**; a backup was taken before the plugin update (name not recorded).
- Local after the update (from that file): add-wpgraphql-seo 6.0.0 · acfml 5.4.0 · advanced-custom-fields-pro 6.8.11 ·
  all-in-one-wp-migration 7.113 · classic-editor 1.7.0 · disable-media-sizes 2.7 · enable-cors 2.1.0 ·
  post-types-order 2.5.9 · post-type-switcher 4.1.1 · simple-image-sizes 3.2.6 · svg-support 2.6.4 · wp-graphql 2.28.0 ·
  wpgraphql-acf 3.2.1 · wpgraphql-ide 5.9.0 · wpml-graphql 5.4.0 · sitepress-multilingual-cms 5.4.0 ·
  wp-seo-multilingual 5.4.0 · wpml-string-translation 5.4.0 · wordpress-seo 28.8 (all active).
- **P-2 parity was not achieved.** Local vs production:

  | Plugin | Production | Local |
  |---|---|---|
  | sitepress-multilingual-cms (WPML) | 4.7.6 | 5.4.0 |
  | acfml | 2.1.5 | 5.4.0 |
  | wpml-graphql | 1.1.3 | 5.4.0 |
  | enable-cors | 3.0.0 | 2.1.0 |
  | svg-support | 2.6.1 | 2.6.4 |
  | wp-seo-multilingual | — | 5.4.0 |
  | wpml-string-translation | — | 5.4.0 |
  | wp-graphql · wpgraphql-acf · ACF PRO · add-wpgraphql-seo · wordpress-seo | 2.28.0 · 3.2.1 · 6.8.11 · 6.0.0 · 28.8 | same |

- **GraphQL introspection (WPML 5.4.0 local)**: every field the site reads is present and nullable; media fields are
  `AcfMediaItemConnectionEdge { node }`; `pages`/`projects` where-args are `language: String`, `name: String`; empty
  wysiwyg/text values are `null`; `translations` on media works; no `errors`. Limit: no earlier schema snapshot to diff
  against.
- **Render** at 1440 on 2026-11-17: `/`, `/fr`, `/es`, `/projects/fashion-company-ecommerce` — one `h1`, no horizontal
  scroll, correct `lang`, no console messages.

### AC-0 (read-only GraphQL, 2026-11-17)
- Home: EN 2 "Home" 3 services / 2 testimonials; FR 535 "Accueil" and ES 536 "Inicio" 3/2, row 3 untitled; FR/ES
  testimonials legacy. FIX and CARE shared `2025/08/ico-services-web-dev.svg`.
- `homeAboutSection.aboutSectionTitle`: EN `"Meet Magneto"` · FR `"Découvrir Magneto"` · ES `"Conoce Magneto"`. Spec
  R14 (:222) expected the legacy "Meet Magneto" on FR/ES; locally they already held the export values. Production is
  unverified; there the FR/ES load will count this field as a change.
- EN home `descriptionHtml` lacked the lead sentence; EN `footerLine2` already correct; FR/ES footer legacy.
- Final CTAs: EN "Book a Strategy Call"; FR/ES home legacy "Ready to stop guessing…" / "Get Your Free Strategy Call".
- Trépied: EN 498, FR 550, ES 541, all 3/4/4 with 7 images; FR/ES titles "[FR TEST]" / "[ES TEST]"; legacy captions.
- Dangel 270 / 598 / 615 and Shamanicca 224 / 606 / 625: 3/4/6.

### AC-2 — export diff (old = 637fba7 export, new = 2026-11-17)
**Group (a), D-15 format only (no copy change), counted:**

| Artefact | EN | FR-CA | ES |
|---|---:|---:|---:|
| 9-line provenance header removed; new "# Magneto's Page Copy / …" title line | 9 + 1 | 9 + 1 | 9 + 1 |
| escapes removed (`\$`, `\[`, `\]`) | 28 | 21 | 7 |
| Notion links now full-title + `?pvs=21` | 1 | 1 | 2 |
| empty `>` quote lines (old → new) | 22 → 54 | 0 → 1 | 0 → 2 |
| checkbox lines with "`- [ ]  `" spacing | 13 | 38 | 46 |
| list indentation, blank lines, trailing spaces | normalized | normalized | normalized |
| trailing newline at EOF | removed | removed | removed |
| bold scope only, same visible text (FR 608 / 680 / 752 "Voir …" CTAs; FR 975 / 977 privacy dates) | — | 5 lines | — |

**Group (b), copy hunks after D-15 normalization, each mapped (EN 6, FR 10, ES 23):**

| Lang | New line(s) | Change | Appendix A |
|---|---|---|---|
| EN | 23, 25 | About visible heading "Meet Magneto" + former heading as first paragraph | item 8 |
| EN | 109; 113-114; 266; 440 | lead-magnet "checkup" wording | item 7 |
| EN | 133 | identification line: real mailing address (CASL) | item 7 |
| FR | 24, 26 | item 8 restructure | item 8 |
| FR | 82 | "Titre affiché (dictionnaire, testimonials.title)" annotation | unmapped, internal annotation (accepted by Mauricio) |
| FR | 88, 90 | public note "Traduit de l'espagnol." + internal provenance note | item 6 |
| FR | 102-140 | lead-magnet block aligned with EN | item 7 |
| FR | 180 | home meta description "…l'implication directe du fondateur…" | item 4 |
| FR | 273 | About meta description (K1) | item 5 |
| ES | 22, 164, 196, 257, 283, 414, 531, 614, 688, 762, 780, 889, 934 | "Reservar consulta gratis" (incl. 780 / 889 / 934 = old 755 / 864 / 909, D-14 A) | item 1 (×13) |
| ES | 26, 28 | item 8 restructure | item 8 |
| ES | 90 | internal note: no public note in ES | item 6 |
| ES | 100-138 | lead-magnet block aligned with EN | item 7 |
| ES | 271 (K2), 877 (K3) | meta descriptions | item 5 (×2) |
| ES | 863 | Contact send-failure line | item 2 |
| ES | 924, 928, 965, 969 | modal privacy sentence (D-11) | item 3 (×4) |

No unmapped hunk changes what a visitor reads. Item 8: only the visible-heading line and the new first paragraph changed
per language; the three paragraphs are byte-identical to `637fba7`. Normalizer verdict: **simpler** (unescape step
removed from all three normalizers).

### AC-1, AC-3, AC-4, AC-5
- AC-1: `content.test.ts` 25/25 — pins, verbatim check (EN 160 / FR 160 / ES 159 values), one-word mutation fails it,
  structure EN = FR = ES on every post, no `EN_DEFERRED`, `MAIN_CTA.es`, no forbidden keys.
- AC-3: grep 1 → 0 · grep 2 → 0 · `DESCRIPTION_EXCEPTIONS` absent · grep 3 (reworded per Mauricio, 2026-11-17, to CTA /
  button / label / heading contexts) → **0** (the same pattern matches 14 lines in `637fba7`).
- AC-4: ES `sendFailed` ends "…o reserva una consulta gratis.", `sendFailedCta` = "reserva una consulta gratis"; the
  ContactForm button-name test passes; ES `bookingModal.privacyText` ends "Reservar una consulta no te suscribe a correos
  promocionales." (also seen rendered, AC-8); FR `meta.home.description` contains "directe".
- AC-5: Gate above.

### Harness proofs (§5) and expected totals
Stub harness (scratchpad, not in the repo), calibrated: master's loader + master content on the seed → EN
`0 changes (0 appended rows), 140 unchanged`, the 5c figure.
- Proof 1: after the EN run, the FR dry-run prints `+ append trepied-trepied-ca/fr project_data_results[4]` and `[5]`.
- Proof 2: FR home cut to 2 service rows (EN 3) → `Aborted before any write: home/fr service: would grow 2 → 3, but the
  repeater has an image sub-field (amendment 3).` · `writes=0`.

### §7 (B5) and §8 (titles) — Mauricio, 2026-11-18
- **§7:** EN home (2), one admin Update. Backup taken first (Mauricio). The save set **all three** featured-service
  icons, not only CARE (meta diff, `_en-media-before_20261117-1740.sql` → `_before-titles_20261118-1747.sql`):
  `service_0_service_icon` 74 → **702** (`2026/11/ico-layout-template.svg`), `service_1` 69 → **708**
  (`ico-wrench.svg`), `service_2` 69 → **705** (`ico-shield-check.svg`), the same attachments as the Services page. WPML
  copied the three values to FR 535 / ES 536 (Copy field), and nothing else changed on 2, 535 or 536. No rows were
  added, deleted or reordered (EN 3 / 2).
- **§8:** `wp post update` titles only. Backup `magneto-cms-2_before-titles_20261118-1747.sql`. 270 "Dangel Wellness",
  224 "Shamanicca", 498 / 550 / 541 "Trépied". `post_name` and `post_status` verified unchanged before and after (Mauricio).
- **Follow-up (one for §7 + §8):** check-translations `lang=fr` 6/6 PASS, `lang=es` 7/7 PASS, 0 media WARN, info rows
  14-17 present, home `service_icon` and `testimonials.thumb` media ok. Step 3 (three dry-runs with master's content
  files) **was not run** — see Deviations.
- **The Dangel slug episode (2026-11-18, between 17:47 and 18:13).** EN 270's slug was found changed to
  `dangel-wellness-dangelwellness-ca` and reverted to `fashion-company-ecommerce` in admin before the loads, because the
  content files key on that slug and FR 598 / ES 615 still use it. Meta diff (`_before-titles_…1747` →
  `_5crest-en-before_…1813`) of that admin save:
  - EN 270 `project_data_project_description`: the loaded `<p>…</p>\n<p>…</p>` HTML was rewritten as plain text with
    `\r\n\r\n` (the classic-editor/ACF save; same effect as in 5c AC-12 on Services);
  - EN 270, FR 598, ES 615: two empty Copy fields were created, `bgimage = ""` and `prefooter_cta_link = ""` (plus their
    `_bgimage` / `_prefooter_cta_link` field-key rows). Empty, not read by the site;
  - EN 270 `_wp_old_slug` now holds `zaida-fashion-ecommerce` and `dangel-wellness-dangelwellness-ca`;
  - **No FR/ES translated value changed**: on 598 / 615 only the two empty Copy fields differ, and every other post in the
    content files (pages 2/32/34/36/38/41 and their FR/ES, 224/606/625, 498/550/541) has no meta change except the §7
    icons.

### Loads (AC-6) — Mauricio, 2026-11-18
Each: backup → dry-run = expectation → real run with read-back → `wp cache flush` → second dry-run 0 changes. Every
cross-language probe byte-identical before and after.

| Lang | Backup | Expected (2026-11-17) | Dry-run / real run | Second dry-run |
|---|---|---|---|---|
| EN | `magneto-cms-2_5crest-en-before_20261118-1813.sql` | 28 changes, 2 appended, 10 fields | **29 changes, 2 appended, 11 fields**; all read back ok | 0 changes (0 appended rows) |
| FR | `magneto-cms-2_5crest-fr-before_20261118-1816.sql` | 50 changes, 2 appended, 13 fields | 50, 2 appended, 13 fields — match | 0 changes (0 appended rows) |
| ES | `magneto-cms-2_5crest-es-before_20261118-1820.sql` | 58 changes, 2 appended, 22 fields | 58, 2 appended, 22 fields — match | 0 changes (0 appended rows) |

**EN 29 vs 28, reconciled.** The extra change and the extra field are EN 270 (Dangel)
`projectsProjectData.projectData.projectDescription`. My expectation was computed on the 2026-11-17 state, where that
value equalled `en.json`. The slug-episode admin save (above) rewrote it as plain text, so the EN dry-run counted it, and
the load restored the `<p>` HTML. Dangel was 2 changes (final-CTA label + description) instead of 1; every other post
matched its predicted line. The meta diff across the EN load (`…1813` → `…1820`; FR does not touch EN) shows exactly
the planned EN values and nothing else, adding up to 29 changes in 11 fields:
- home 2: `description_html` (lead sentence) and `prefooter_cta_text`; about-magneto 32, services 34, Shamanicca 224:
  `prefooter_cta_text`; packages 36: `secondary_cta_text`, all "Book a Strategy Call" → "Book a Free Strategy Call";
- Dangel 270: `prefooter_cta_text` and `project_data_project_description`;
- Trépied 498: 7 `foot_note` cleared (D-4), subtitle, description, challenges 3, solutions 4, results 4 changed + 2
  appended (`results` 4 → 6), `prefooter_cta_text` (21 changes, 2 appended, 3 fields).

### AC-7 — GraphQL read-back (read-only, 2026-11-18)
- **Every loaded value = the content files:** a read-back of all 27 posts × languages in `en.json` / `fr.json` /
  `es.json` (queried by `language` + `name`, as the site does) compared **711 values: 0 mismatches**. The comparison
  undoes only WPGraphQL's render filters: `wptexturize` entities / curly quotes (`&rsquo;`, `&#8217;`, `&nbsp;`),
  `wpautop` newlines between block tags, a trailing `\n`, and select fields returned as one-item lists. Without that
  normalization there were 51 differences, all of those kinds. Raw storage equality is shown by the three 0-change
  dry-runs.
- **Home rows 3 / 2 in EN, FR, ES.** BUILD `#build` / FIX `#fix` / CARE `#care`; testimonials Dangel Manik and Israel
  Valencia Vázquez with localized roles (FR "Thérapeute holistique", ES "Terapeuta holístico"); no thumbs in any language.
  About titles "Meet Magneto" / "Découvrir Magneto" / "Conoce Magneto"; footer lines = EN 166 / FR 137 / ES 143.
- **FIX and CARE `serviceIcon` differ:** EN originals `2026/11/ico-layout-template.svg` / `ico-wrench.svg` /
  `ico-shield-check.svg` (702 / 708 / 705); FR resolves 703 / 709 / 706 and ES 704 / 710 / 707, each translating to the
  same EN original. All three are distinct in every language.
- **Trépied 3/4/6 in EN 498, FR 550, ES 541; 7 images**, FR and ES equal to EN in order (EN originals
  `2026/07/trepied-{homepage,services,portfolio,about,contact-cta}-desktop.png`,
  `trepied-{homepage,portfolio}-mobile.png`); every `footNote` empty.
- **Titles / slugs / statuses:** T1 270 "Dangel Wellness" `fashion-company-ecommerce` · T2 224 "Shamanicca"
  `shamaniccas-ecommerce` · T3 498, T5 550, T6 541 "Trépied" `trepied-trepied-ca` · all `publish`. FR 598 / ES 615 Dangel
  `fashion-company-ecommerce`. **Post 32 = "About Magneto"**. Projects per language: 3 (EN 270/224/498, FR 598/606/550,
  ES 615/625/541).

### AC-8 — Rendering (port 3100, `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1`, fresh render)
`next build` then `next start -p 3100`. **The 5c stale-cache finding repeated:** the first two requests after the build
(a warm-up pass, then a check pass) still served pre-load data on 14 of 27 routes (`x-nextjs-cache: STALE`; e.g.
`/fr/projects/trepied-trepied-ca` "[FR TEST]", `/es` the legacy footer and CTA, EN cases "Book a Strategy Call"). The
next pass (every route `HIT`) served the loaded content. All
results below come from that pass and from the browser checks after it. The stale capture is kept in the scratchpad (`ssr-check1/`).
- **SSR, 27 routes** (`/`, `/fr`, `/es`, `/{,fr/,es/}projects`, the 3 Trépied routes, the 6 FR/ES/EN case routes,
  `/{,fr/,es/}{about-magneto,services,packages,contact}`): all 200, `lang` en / fr-CA / es, one `h1` each. **0 hits** for
  "[FR TEST]", "[ES TEST]", "Serving clients worldwide", "Ready to stop guessing", "Get Your Free Strategy Call",
  "llamada de orientación", "Meet Magneto" on `/fr` and `/es`, and "Book a Strategy Call" outside `<header>`.
- **Chrome, 12 AC-8 routes × 375 / 768 / 1440** (same-origin iframes at those widths): horizontal overflow 0 on all 36;
  one `h1` each; no page errors; console clean on `/`, `/es`, `/fr/projects/trepied-trepied-ca`, `/es/contact`.
- **FR/ES home:** 3 titled cards (BUILD, FIX, CARE) and 2 testimonial cards; wrench (FIX) and shield (CARE) icons
  visibly distinct (screenshot checked, `/es` at 1213 px).
- **Footer localized:** "Établi à Montréal · Services offerts en français, en anglais et en espagnol" / "Con sede en
  Montreal · Atención en español, francés e inglés"; EN "Based in Montreal · Available in English, French & Spanish".
- **ES Contact:** hero button and booking-modal title "Reservar consulta gratis" (modal opened, nothing submitted); modal
  text "…Reservar una consulta no te suscribe a correos promocionales."
- **Home About** (`/`, `/fr`, `/es`): section `h2` "Meet Magneto" / "Découvrir Magneto" / "Conoce Magneto", one `h2` in
  the section; body = 4 `<p>`, the first being the former heading ("Work directly with the person who plans, designs and
  builds your website." / "Collaborez directement…" / "Trabaja directamente…"). M2 layout at all three widths: `h2` above
  the body, same left edge, body `text-align: left`; at 1440 `h2` 1200 px wide, body 958 px = its `max-width` (70ch,
  957.6 px); at 375 / 768 both fill the container (345 / 738 px, under the max).
- **Cases and grid:** `/{,fr/,es/}projects` card titles "Dangel Wellness", "Shamanicca", "Trépied"; case `h1`s "Trépied" ×3,
  "Dangel Wellness", "Shamanicca"; EN final CTAs end "Book a Free Strategy Call".

### AC-9 — EN unchanged except the planned values
- **Data:** the EN meta diff across the EN load (above) contains only the planned values: final-CTA labels (6 posts),
  the home body (`description_html` with the lead sentence), Trépied, and Dangel's description restored. The footer line
  and the About title were already equal (no change). Titles T1-T3 come from §8 (AC-7).
- **Code:** the only `src` changes that reach EN are `FeaturedServices` (skips untitled rows; EN has none) and three
  comment lines in `en.ts`. EN header label unchanged ("Book a Strategy Call", in `<header>` only).
- **Rendered:** EN routes show the planned values (AC-8), no forbidden string.

### 5c AC-12 step 5 and addendum
Written into `docs/reports/phase-5c-loader.md` → "Addendum — AC-12" (spec 5c §8 step 6 puts it there). Summary: the
2026-11-17 follow-up passed (check-translations fr 6/6, es 7/7, `media ok` on rows 1 and 5; the EN dry-run's 8 changes
were the expected `<p>` re-format, then reloaded and 0; FR/ES dry-runs 0 / 177). Step 5, re-run read-only on 2026-11-18:
FR 637 / ES 646 Services 7/7 rows, 14 of 14 equal to EN in image / icon (EN original), `anchorId` and `serviceGroup`;
Translate values covered by AC-7 (63 values each, 0 mismatches).

## Deviations from the spec
- **§7/§8 follow-up step 3 not run.** The three dry-runs against master's content files (from
  `backups/phase-5c-rest/master-extract`) could not run: the loader aborts because the JSON's pinned sha does not match
  the new `docs/content` export. In their place:
  - Mauricio's check-translations results (fr 6/6, es 7/7, 0 media WARN, rows 14-17 as expected);
  - the Dev's meta diff of the backups (`…20261117-1740` → `…20261118-1813`) over every post in the content files: the
    only changes before the loads were the §7 icons (EN 2 → FR 535 / ES 536), the AC-12 icons (Services), and the Dangel
    slug-episode save (above). The EN load's +1 is fully explained by the last one.
- **Dangel slug episode** (above): an EN admin save of 270 outside §7/§8, made to revert the slug before the loads. Its
  side effects are recorded; the loads restored the description. Post-launch follow-up in Issues.
- **5c AC-12 addendum written to `docs/reports/phase-5c-loader.md`** (outside this spec's file list): 5c spec §8 step 6
  names that report.
- **`.next` incident (AC-P2, 2026-11-17):** I started a build while Mauricio's `next-server` used the same `.next`.
  Reported, rebuilt and served on 3100. Every later build first checked that nothing listened on 3000/3100.
- **`source.commit` = "export 2026-11-17"** instead of a commit hash (the export and the re-pin land in one commit).
- **`scripts/qa-i18n/cli.test.ts`** (approved by Mauricio): AC-4b inverted; **AC-4c** added (real limit 38: 39-char ES
  main CTA warns, 38 does not).
- **ES testimonial-note allowlist: 3 files outside the list** (`scripts/qa-i18n/inputs.ts`, `checks.ts`,
  `checks.test.ts`) plus `glossary.json` (listed). Scope: one exact unit ID in ES only
  (`content:home/homeTestimonialsSection.testimonials[0].note`); the row index follows row position, and rows are never
  reordered (§7).
- **Glossary header-CTA note** reworded; **`anchor_link` hashed key** listed in `STRUCTURAL_KEYS`.
- **Spec edits** (D-15, §10 plugin gap) were made on Mauricio's instruction.
- **AC-7 comparison is modulo render filters** (listed in AC-7); raw equality rests on the 0-change dry-runs.
- **AC-8 widths in Chrome via same-origin iframes**, not by resizing the window; the 1440 screenshot was taken at the
  window's 1213 px.
- **`php -l`:** Local's bundled PHP 8.2.30 (PHP is not on the PATH).

## Issues found (not fixed)
- **R-12 (OPEN):** plugin gap local 5.4.0 vs production 4.7.6 (WPML, acfml, wpml-graphql), enable-cors, svg-support and two
  extra WPML add-ons. Every local result here was measured on 5.4.0, including the Copy sync behind §7 / D-9 B. Resolve
  before the production load (spec §10: upgrade production, downgrade local, or accept + canary).
- **Post-launch: a proper Dangel slug change** to `dangel-wellness` in **all three languages** (EN 270, FR 598, ES 615 —
  production IDs differ), as one planned change:
  - a 301 redirect from `/projects/fashion-company-ecommerce` (and `/fr/…`, `/es/…`) to the new slug;
  - `sitemap.xml` output re-checked (it reads slugs from the CMS);
  - the content-file keys (`project/fashion-company-ecommerce` in `scripts/phase-5c/content/{en,fr,es}.json`) and the
    tests that list posts (`content.test.ts`);
  - the production runbook (it resolves the §8 titles by slug, §8 "Production");
  - backup first; never via admin on one language only (the 2026-11-18 episode shows the side effects: the
    `project_description` re-format and empty Copy fields on FR/ES).
- **Runbook: EN admin saves re-format loaded `wysiwyg`** (`<p>` HTML → plain text with line breaks). After any EN admin
  save, the next EN dry-run counts these fields; review and reload (see 5c addendum).
- **Runbook: verify on the second render** after a build (stale fetch cache, AC-8), as in 5c.
- **ES privacy final review (before the 12-01 go/no-go):** ES lines 1001, 1013, 1049 still say "llamada de orientación";
  reconcile with "Reservar consulta gratis" and remove the BORRADOR mark in Notion. Not rendered by `src` today.
- **Home testimonials have no thumbs** in any language (`thumb` null). Not an AC; noted for the design review.
- Spec R14 (:222) is out of date for local (FR/ES About titles already held the export values; AC-0).
- Internal checklist lines (ES 1159-1185) still say "Agendar una llamada de orientación" (internal, not rendered).
- R-8 (orphan testimonial meta after the production shrink) unchanged.

## Proposed commits (not made; everything is unstaged)
See the commit plan in the hand-off message; the same list, with explicit paths:
1. `feat(qa-i18n): allow an approved empty target value per unit and language` — `scripts/qa-i18n/inputs.ts`,
   `scripts/qa-i18n/checks.ts`, `scripts/qa-i18n/checks.test.ts`
2. `fix(home): skip untitled featured-service rows` —
   `src/components/organisms/FeaturedServices/index.tsx`, `src/components/organisms/FeaturedServices/FeaturedServices.test.tsx`
3. `feat(i18n): 2026-11-17 Notion export with re-pinned tests, ES main CTA "Reservar consulta gratis", home body, EN final CTAs and Trépied content (5c-rest)` —
   the export, the content files, dictionaries, tests and QA config (paths in the hand-off)
4. `feat(phase-5c): Trépied results growth entry and info rows 14-17 in check-translations` —
   `scripts/phase-5c/load-content.php`, `scripts/phase-5c/check-translations.php`
5. `docs(spec): 5c-rest D-15 and the local/production plugin gap` — `docs/specs/phase-5c-rest.md`
6. `docs(report): phase 5c Sat 11-14 EN media save addendum (AC-12)` — `docs/reports/phase-5c-loader.md`
7. `docs(report): phase 5c-rest loads and verification` — `docs/reports/phase-5c-rest.md`

Only the final tree was gated. Commits 1 and 2 are independent by construction; commit 3 needs 1 (the ES `""` note).

## Time
Agent: 2026-11-17 one long session (unknown exact); 2026-11-18 about 1.5 h (estimated: off-by-one reconciliation, AC-7,
gate, AC-8, AC-9, AC-12 step 5, report). Mauricio on 2026-11-18, from the backup timestamps: §7 before 17:47, §8 17:47,
loads 18:13-18:20 plus read-backs (estimated ≈ 1 h with the follow-up). AC-10 approval: pending.
