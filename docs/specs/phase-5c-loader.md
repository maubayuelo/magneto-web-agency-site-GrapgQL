# Phase 5c — Content loader: local FR-CA / ES load + translation-post checklist (rev 3.1)

- **Status: Draft** (rev 3.1). Needs review by Mauricio + Senior Architect before Mon 11-09.
- Author: Architect · Reviewed by: Mauricio + Senior Architect · **Run by: Mauricio** (agents never write to WordPress)
- Date: 2026-11-03 · Branch: `spec/phase-5c-rev3` (from `master` @ `f6cd045`). Implementation branch: the Dev creates one.
- Depends on: rev 2 of this spec (EN loader, run 2026-10-31, [5b report](../reports/phase-5b-services-packages-seo.md)
  "Loader run"), [5b spec](phase-5b-services-packages-seo.md) rev 9 (§5.4 override, OQ-1, "Other specs" item 1, E16),
  [ADR 0006](../adr/0006-phase-5-content-model.md) (decisions 4, 5; amendments 2, **3**), [ADR 0004](../adr/0004-localized-data.md),
  Phase 3 report (WPML duplicate method), 5d-lite (merged, PR #24).
- Canonical copy: `docs/content/magneto-copy-{en,fr-CA,es}.md` **as of `ffec355`** (export 2026-11-02; Notion stays
  canonical). Every `docs/content` line number below is at `ffec355`; section titles govern if a later export moves them.

## Revision
**Rev 3.1 (2026-11-03, after Mauricio's review of rev 3):**
1. **Decisions recorded** (Decisions section): D-1 B with three additions, D-2 A, D-3 A, D-4 A, D-5 A (only together with
   the new "5c-rest" section), D-6 (a) + (b).
2. **D-1 B additions:**
   - (a) Locally, the 4 case posts (checklist rows 10-13) are created **before** the EN parity run, so the append path
     runs for real (§1, §5, §7, calendar).
   - (b) The dry-run prints each appended row on its own `+ append` line. Per-post totals count appended rows separately
     (§3.3, AC-3, AC-5).
   - (c) ADR 0006 amendment 3 records the append-only rule (written in this revision).
3. **D-4 A note:** `ProjectDetail/index.tsx:128-130` renders an empty `<p>` when `footNote` is empty (E16). AC-8 adds a
   screenshot check of that spacing. No `src` change.
4. **New section "5c-rest"**: every item this spec defers, with its local state, whether it blocks launch, an estimate,
   and a proposed slot in the week of 11-16.
5. **New section "EN admin saves after FR/ES loads"** (§8): what WPML/ACFML do when the EN Services page is saved in admin
   while FR/ES translations exist (E13), the required follow-up after Sat 11-14 (AC-12), and the production rule.
6. **Correction (E15):** the Contact page renders **no** final CTA, so rev 3's R-9 pointed at the wrong route. The
   FR/ES legacy final CTA appears on `/fr|es/projects` and on `/fr|es` (the home fallback). R-9, AC-8 and the §5 table
   are corrected.
7. Calendar: Wed 11-11 also holds the FR/ES dictionary fill. The Sat 11-14 EN image save and its follow-up are added.
8. New open decisions: D-7, D-8, D-9.

**Rev 3 (2026-11-03):**
1. **FR/ES content load, local only:** new `fr.json` / `es.json` for Services, Packages, About, Contact, Dangel,
   Shamanicca, and the heroes of every page that exists in FR/ES. Same loader, with one language per run.
2. **Translation-post checklist** for the 13 FR/ES posts. Mauricio creates them in WPML admin, and a new read-only
   `check-translations.php` verifies them.
3. **Media rule written down:** the loader never writes image/url fields. The row merge keeps them, and the read-back
   proves it.
4. **Release-day notes** (listed only; production mode is still not implemented).
5. **The 5b §5.4 override is folded in.** `cta_text_hero` is the main CTA label per language, and `cta_link_hero` is
   never written. The override is now a rule of this spec.
6. **Structural finding:** the FR/ES case studies cannot load unless the EN case rows grow first (E5). That forces
   decisions D-1 and D-2.

Rev 2 (2026-10-28) is kept below where it still applies: guards, backup, dry-run, plan, read-back by key, idempotent
re-run, merge by index, no deletes, no post/title/slug/status changes, and no WPML writes. **None of these is relaxed
except where D-1 says so explicitly.**

## Goal
On the **local** CMS, the 13 missing FR/ES translation posts exist, are correctly linked, and have been checked
read-only. One loader run per language writes the approved FR-CA and ES copy into them and into the FR/ES heroes. Every
run is idempotent and read back by key, and no EN or other-language value changes. Done means `/fr/*` and `/es/*` for
Services, Packages, About, Contact, `/es/projects` and the Dangel and Shamanicca cases render their own language with
EN media, on a local build with `ENABLED_LOCALES=en,fr,es`.

## Evidence (read-only, 2026-11-03, `master` @ `f6cd045`, local CMS `http://magneto-cms-2.local`)

**E1. The loader today** (`scripts/phase-5c/load-content.php`):
- local guard `:37-40`; backup guard `:43-56`; ACF check `:59-61`
- `content=` default `en.json` `:63`; sha256 pin `:68-71`; every key and sub-key exists `:75-86`
- **EN-only abort `:95-97`**; post resolution by type + slug + WPML `en` `:98-113`
- row rules services 7 / packages 3 / sections 0|2 `:120-142`
- merge by index, keeping un-listed sub-keys `:164-185`; totals `:204-207`
- FR/ES probe (row counts of 3 repeaters) `:210-221`; dry-run returns before any write `:223-227`
- the only `update_field` `:235-238`; read-back incl. "(carried over)" `:241-268`; probe compare `:269-275`

The header (`:5-7`) already applies the 5b §5.4 override.

**E2. Content and tests:**
- `en.json` holds 6 posts and 95 values: services, packages, home, about-magneto, projects, contact. Its source is
  pinned to `ffec355` with sha256 `9f9d57ee…`.
- `content.test.ts`: pin `:45-49`, verbatim check `:51-74` (normalizer `:15`: bold, `\$`, `- `, `#`), exact post list
  `:76-78`, label rules `:79-89`.
- **`src` tests import `en.json`:** `services/api.test.ts:5`, `services/ServicesList.test.tsx:12` and
  `packages/api.test.ts:12`, all with `fixtures/state-c.json`. Any change to `en.json` must therefore be additive.

**E3. Rev 2 run:** 79 changes, then 23 fields written, all read back ok, FR/ES probe unchanged, final dry-run
`0 changes, 95 unchanged` (5b report :129-135). Guard proofs ran under a PHP stub harness in the scratchpad (:114-117).

**E4. Translations in the local CMS.** Read-only SQL on Local's MySQL: `wp_posts` ⨝ `wp_icl_translations`, plus the
`_icl_lang_duplicate_of` meta.
```
ID  type     post_name                  lang trid src   dup_of
2   page     home                        en   2   -     -      535 fr / 536 es (same trid)
32  page     about-magneto               en   17  -     -      (no fr/es)
34  page     services                    en   18  -     -      (no fr/es)
36  page     packages                    en   19  -     -      (no fr/es)
38  page     projects                    en   20  -     -      558 fr (no es)
41  page     contact                     en   21  -     -      (no fr/es)
224 project  shamaniccas-ecommerce       en   56  -     -      (no fr/es)
270 project  fashion-company-ecommerce   en   332 -     -      (no fr/es)
498 project  trepied-trepied-ca          en   399 -     -      550 fr / 541 es
SELECT meta_key, COUNT(*) … LIKE '_icl_lang_duplicate%'  →  0 rows
```
GraphQL (`pages|projects(where:{language})`) agrees. FR has `home` 535 and `projects` 558. ES has `home` 536. Trépied
has FR 550 (title `[FR TEST] TRÉPIED — trepied.ca`) and ES 541 (`[ES TEST] …`). **The 13 missing posts are:**
- FR services, packages, about-magneto, contact
- ES services, packages, about-magneto, contact, projects
- FR + ES Dangel and Shamanicca

This matches 5b E16. Existing translations keep the EN slug (`projects`, `trepied-trepied-ca`), and none carries
`_icl_lang_duplicate_of`: every earlier duplicate was "translated independently".

**E5. Row counts and ACFML preferences** (read-only SQL on `wp_postmeta`, plus `wpml_cf_preferences` in the stored
`acf-field` posts; identical to `docs/acf/phase-5-field-groups.json`):

| Repeater (meta name) | Pref | EN local rows | Rows in the copy (EN = FR = ES) |
|---|---|---:|---:|
| `services` (34) | 1 Copy | 7 | 7 |
| `packages_elements` (36) | 1 | 3 | 3 |
| `sections` (36) | 1 | 2 | 2 |
| Dangel 270 `project_data_challenges` / `_solutions` / `_results` | 1 | 3 / 4 / **3** | 3 / 4 / **6** |
| Shamanicca 224 `project_data_challenges` / `_solutions` / `_results` | 1 | 3 / **3** / **3** | 3 / **4** / **6** |
| `images` 270 / 224 | 1 | 5 / 7 | captions 6 / 7 (EN Dangel: 6 + 1 optional) |

Counts were taken with `grep -c` on the list items under each case heading (EN 951-972 / 1191-1212, FR 518-539 /
661-682, ES 528-549 / 675-696) and on the numbered captions.

- Copy (1): `project_data` (group), `project_url`, `display_order`, `image`, `ismobilescreenshot`, `service_group`, and
  all repeater structures.
- Translate (2): every `text` and `wysiwyg` field, including `foot_note`, `general_text` and the `item`s.
- The case lists are nested in the `project_data` group. Their meta names are `project_data_<name>`, so they cannot be
  written by sub-field key alone (see Design §3).

**E6. EN case and About bodies are not loaded.** GraphQL, EN:
- Dangel `projectSubtitle` = "Conversion-focused landing page … built for paid traffic"; `results[0]` = "Ten
  disciplines presented on one page…".
- Captions include "42 verified reviews positioned directly above the conversion point". The copy forbids it
  (EN 1003-1013).
- About `generalText` = the old funnel HTML (`<h3 class="typo-2xl-extrabold hero-title m-0">What Magneto delivers?</h3>
  <ul>…Funnels that work while you sleep…`).
- 5a fixtures wrote only the About founder text and CTA, the case `cardDescription`, `displayOrder` and the final CTAs
  (`local-fixtures.php:143-180`). Rev 2 excluded case bodies and About `generalText` (rev 2 "Out of scope").
- A WPML Duplicate copies **all** meta, Translate fields included. A new FR/ES post therefore starts with EN text in
  every field the loader does not overwrite.

**E7. Media in the frontend.**
- `src/utils/wp-media.ts:41-55` `resolveOriginalMedia`: for a non-EN media node it takes `sourceUrl` and
  `mediaDetails` from the EN translation and keeps only the copy's `altText`. `:58-63` handles the `{ node }` wrapper.
- Every image query adds `mediaOriginalFields`, e.g. `projects/[slug]/api.ts:31,64` and `about-magneto/api.ts:24`.
- **The loader writes no image fields:** `en.json` contains no image or url key (5b report: "carried over").
- Gallery: `ProjectDetail/index.tsx:120-130` uses `footNote` as caption and as `alt`. An empty value falls back to
  `cmsFallback.galleryImageAlt`.

**E8. Readers that render the fields loaded here.**
- About (`about-magneto/api.ts:27-38`, `page.tsx:52-81`): `sectionTitle`, `descriptionHtml` (DOMPurify), `linkText`,
  `generalText` (unsanitized, Known debt), and `ctaText` + `ctaPath` → `localizePath`.
- Case (`projects/[slug]/page.tsx:51-58`): post `title`, `projectSubtitle`, `projectDescription`,
  `challenges/solutions/results`, `images.footNote`, `projectUrl`.
- Hero (`Hero/api.ts:10-14`, `HeroLoader.tsx:31,39`): the page `title` is the fallback hero title **and the hero image
  `alt`**, so FR/ES page titles are visible to assistive tech.
- Packages rich mode hides legacy `price`, `features` and `description` (`packages/api.test.ts:84-89`).
- Contact renders no `contactContactTexts` (ADR 0006 amendment 2).

**E9. WPML creation method that works here** (Phase 3 report :325-340, `WP-SETUP.md:72`). The EN item's Language box
**Duplicate** failed silently twice for `projects`. What worked: WPML → Translation Management → select the item →
*Duplicate content* for one language → open the copy → **Translate independently** → edit. Close the EN item without
Update.

**E10. EN `update_field` writes do not sync Copy meta to existing FR/ES posts.** The 5a fixtures wrote Copy repeaters
on EN home while FR/ES home existed, and the FR/ES row counts did not change (5a report :607, :711).

**E11. ES projects and page titles.** `/es/projects` is missing (no ES 38 translation). The dictionaries hold approved
nav labels: FR "À propos / Services / Forfaits / Réalisations / Contact" (`fr.ts:15-19`), ES "Sobre Magneto /
Servicios / Paquetes / Proyectos / Contacto" (`es.ts:15-19`).

**E12. Copy line map at `ffec355`** (heading lines; each block runs to the next heading).

| Block | EN | FR-CA | ES |
|---|---|---|---|
| Home Hero (title / subtitle / CTA) | 23/25/27 | 23/25/27 | 25/27/29 |
| Home §4 (projects hero title / intro; cards) | 67/69; 75-85 | 67/71; 73-83 | 69/73; 75-85 |
| About §1-§5, §7 | 164-221, 237-243 | 135-191, 196-203 | 147-203, 208-215 |
| Services §1, §2, core heading, §3-§9, §11 | 270-286, 288, 290-394, 407-417 | 222-238, 240, 242-345, 351-361 | 234-250, 252, 254-357, 363-373 |
| Packages §1 + tax note, §2-§4, §5-§6, §7 | 446-456, 460-501, 502-528, 529-539 | 383-393, 397-438, 439-467, 468-479 | 393-403, 407-448, 449-477, 478-489 |
| Contact §1 | 577-583 | 715-721 | 731-737 |
| Dangel: hero / overview / challenges / solutions / delivered / captions / final CTA | 933/941/951/957/964/973/989 | 500/508/518/524/531/540/553 | 510/518/528/534/541/550/565 |
| Shamanicca: same | 1173/1181/1191/1197/1204/1213/1235 | 643/651/661/667/674/683/697 | 657/665/675/681/688/697/713 |

sha256 at `ffec355`:
- EN `9f9d57eed41678f0441b91a338f086cfbcdc2834fb4812b095848be76e687ca9`
- FR-CA `138cbec37b7e3c337321b6ed4ddd15b816e001434e21c81179ced0920ec25551`
- ES `4fd0d5cb5985d912b88b185458c1ccff5854a1747591bbedba5e3d0f212e7b35`

Format differences the test must handle:
- CTA lines: EN `**CTA:** X`, FR `**CTA : X**`, ES `**CTA: X**`.
- Markdown links inside list items (Shamanicca delivered: `[shamanicca.com](https://…)`).
- FR/ES headings are one `#` shallower than EN.

**E13. What an EN admin save does to existing FR/ES translations** (rev 3.1; read-only reading of the plugin source in
`~/Local Sites/magneto-cms-2/app/public/wp-content/plugins/`, WPML 4.7.6, ACFML 2.1.5; plus a read-only `SELECT` of
`icl_sitepress_settings` → `translation-management.custom_fields_translation`):
- **Copy sync on save.** Saving an original in admin runs
  `wpml-post-translation.class.php:206` → `wpml-post-synchronization.class.php:262` (`sync_custom_fields`, once per
  translation) → `sitepress.class.php:1643-1655` `copy_custom_fields`. That function iterates **only** the meta keys
  whose preference is Copy (`WPML_COPY_CUSTOM_FIELD`). For each key, `class-wpml-sync-custom-fields.php:54-93` deletes
  the target values that differ from the source and adds the source values. The result is that every Copy key on the
  translation equals EN after the save.
- **Translate keys are not touched.** The only other path (`sitepress.class.php:1668-1683`) runs when the
  `wpml_sync_deleted_custom_fields` filter returns true. Its default is `false`, and no plugin here hooks it (grep of
  `acfml/`: no match).
- **Image IDs are remapped, not copied raw.** After each copied key, ACFML (`class-wpml-acf-worker.php:34, :45-87`)
  converts post/attachment IDs to the target language's translated object, when one exists. `resolveOriginalMedia`
  (E7) and the media report (§3.6) both compare by EN original, so either ID passes.
- **Repeater "shuffle".** `class-wpml-acf-repeater-shuffle.php:66-67, :102-117, :127-132` moves translated sub-field
  meta to new row indexes, but only when rows were **reordered**. It runs only if the repeater values hash the same
  before and after the save, and it acts only on keys whose value moved to another index. Changing an image changes
  the hash, so the shuffle is skipped. Adding, deleting or reordering rows is the case that could re-pair FR/ES text
  with the wrong row.
- **Preferences by concrete meta key** (local):
  - Copy (1): `services`, `services_N_Image`, `services_N_icon`, `services_N_featured_service`,
    `services_N_service_group`, `image`, `background_image`, `images_N_image`, `display_order`, `prefooter_cta_link`,
    `bgimage`, `project_data`, `project_data_{challenges,solutions,results}`, and the `_`-prefixed ACF reference keys
    (`_services`, `_services_0_Image`, …).
  - Translate (2): `services_N_{title,heading,description_html,cta_text,cta_path,anchor_id,description}`, `hero_title`,
    `cta_link_hero`, `hero_cta_path`, `title`, `subtitle`, `images_N_foot_note`, `project_data_*_N_item` (N ≤ 3).
  - Totals: 625 Copy / 332 Translate / 16 ignore / 2 copy-once.
  - `project_data_results_4_item` and `_5_item` have **no** entry yet. Keys that don't exist are never copied, so the
    rows appended by D-1 B are never overwritten by a sync either.
- **Consequence for Sat 11-14** (§8): an EN Services save that changes only `Image` / `icon` copies the new image IDs
  to FR/ES Services, and the other Copy keys are no-ops because they are already equal. No FR/ES text field is written.
  Two things not covered by this reading: WYSIWYG re-formatting of the **EN** bodies on save (5b report :241-243), and
  WPML marking the FR/ES posts "needs update" in Translation Management (a status only; see §8 rule 4).

**E14. Local state of the items deferred to 5c-rest** (GraphQL, read-only, `language` + `name`):
- **EN home (2)** was filled by the 5a fixtures, not by the loader (`en.json` home = hero only, 3 fields):
  - `aboutSectionTitle` "Work directly with the person…";
  - featured services: 3 rows (BUILD/FIX/CARE + taglines);
  - testimonials: 2 rows with `role`;
  - `footerLine2` "Based in Montreal · Available in English, French & Spanish";
  - final CTA "Start with a conversation." / `ctaText` "Book a Strategy Call".
- **FR 535 / ES 536 home:**
  - `aboutSectionTitle` "Meet Magneto";
  - featured services: **2** legacy rows ("Sales Funnel Development", …), with no tagline;
  - testimonials: **4** rows, all without `role`;
  - `footerLine2` "Based in Montreal | Serving clients worldwide";
  - final CTA "Ready to stop guessing and start converting?" / "Get Your Free Strategy Call";
  - hero title "[FR TEST] Attract More Aligned Clients Online" (rev 3 loads the hero).
  - So the FR/ES home row counts (2 / 4) differ from EN (3 / 2). The fixtures say production EN still has the legacy
    shape: `local-fixtures.php:88` "row 3 reuses the web-dev icon" (2 → 3) and `:112` "the 4 placeholder rows are
    replaced (local only)" (4 → 2).
- **Trépied:**
  - EN 498 `projectSubtitle` = the legacy "WordPress site … three conversion paths …". Rows: 3 / 4 / 4 challenges /
    solutions / results; 7 images with legacy captions. The copy (EN 1020-1107) has 3 / 4 / **6** and 7 captions.
  - FR 550 and ES 541: titles `[FR TEST] …` / `[ES TEST] …`, EN legacy body (ES subtitle prefixed `[ES TEST]`),
    `cardDescription` null, `finalCtaSection.title` null (→ FR/ES home fallback).
- **EN final CTAs:** `ctaText` / `secondaryCtaText` = "Book a Strategy Call" on 7 posts: home 2, services 34, packages
  36 (secondary), about-magneto 32, cases 270 / 224 / 498. The copy says "Book a Free Strategy Call" (EN 127, 243, 415,
  539, 995, 1106, 1241). Every EN final CTA, the About founder text and CTA, `cardDescription` and `displayOrder` exist
  only through `scripts/phase-5a/local-fixtures.php:137-180`, which is local only. `en.json` has none of them.
- **Post titles:**
  - EN: 270 "Dangel Wellness — dangelwellness.ca" (copy hero 937 "Dangel Wellness"); 224 "Shamanicca’s Ecommerce"
    (1177 "Shamanicca"); 498 "TRÉPIED — trepied.ca" (1044 "Trépied"); 32 "About Magneto".
  - FR 535 / ES 536 "Home" and FR 558 "Projects": EN titles on existing translations, used as the hero `alt` (E8). They
    are not in the 13-row checklist.

**E15. Contact renders no final CTA** (correction to rev 3 R-9). `FinalCTASectionLoader` is used only in
`[locale]/page.tsx:79`, `projects/page.tsx:22`, `projects/[slug]/page.tsx:71`, `packages/page.tsx:88`,
`about-magneto/page.tsx:93` and `services/page.tsx:41`, not under `contact/`. The Contact copy has no final CTA either
(EN 575-676 headings: Hero, Form, Supporting copy, Success, Form messages, Footer). The EN `projects` (38) and FR 558
final CTAs are empty, so `/projects` falls back to the locale's home final CTA, which in FR/ES is legacy EN text (E14).

**E16. Empty caption markup.** `ProjectDetail/index.tsx:128-130` renders `<p>{img.footNote}</p>` without a check, so
D-4 A leaves an empty `<p>` under every gallery image. (The review cited `:127-129`; at `f6cd045` the lines are
`:128-130`.)

## Assumptions and open questions
- **A1 (verify at the first post, Mon):** a fresh WPML duplicate carries `_icl_lang_duplicate_of` until *Translate
  independently* is clicked. E4 shows only that detached posts have none. `check-translations.php` reports the meta
  either way, and a post that still has it fails.
- **A2 (verify in the Dev's stub harness + first dry-run):** `get_field(<group key>, $id, false)` returns the group as
  an array keyed by sub-field key, with nested repeaters as rows keyed by sub-key. `update_field(<group key>, …)`
  writes `project_data_<sub>` meta. The dry-run prints the raw shape it read, and the read-back reads by meta name.
- **A3 (carried over from 5b):** saving the EN Packages page in admin joins the two `subtitleHero` paragraphs. Never
  open + Update an EN original during the checklist.
- **A4:** saving an FR/ES post in admin **after** its load can re-sync Copy structure or alter the HTML. Rule: after a
  load, don't save FR/ES posts in admin. A loader re-run restores them (idempotent), and the dry-run shows any drift.
- **A5 (rev 3.1):** E13 comes from reading the plugin source, not from a save. The Sat 11-14 follow-up (§8, AC-12) is
  the observation that confirms it. If any FR/ES Translate value differs after the save, E13 is wrong: stop and report.
- **A6 (rev 3.1):** production EN home row counts (featured 2, testimonials 4) are inferred from the fixture comments
  (E14), not measured. Release-day note 5 measures them read-only.
- **Open:** D-7, D-8, D-9 (below). D-1 … D-6 are decided.

## Design

### 1. Order of operations (local)
```
13 FR/ES posts created + checked (rows 10-13 included) ─┐
EN parity load (D-2; grows EN case rows)                ─┼─▶ FR load (dry-run → run → read-back → dry-run 0) ─▶ ES load (same)
                                                          │    one language per run; Plan B: FR never depends on ES
```
- **Rows 10-13 (the 4 case posts) must be created before the EN parity run** (D-1 B (a)). They then duplicate the
  current EN rows (Dangel results 3, Shamanicca solutions 3 and results 3). The EN run grows EN, and the FR/ES runs must
  append. This is the same order production will have (OQ-1), so the append path is rehearsed for real, not only in
  the stub harness.
- The 9 page posts may be created before or after the EN parity run: their rows already equal EN, and E10 shows that EN
  writes don't touch FR/ES. Creating all 13 first is simplest.
- The EN parity load **must** run before FR/ES: content rows = EN rows is a preflight rule.
- Before the EN parity run, `check-translations.php` must show the case rows equal to EN (3 / 4 / 3 and 3 / 3 / 3).
  After it, FR/ES case rows are below EN (informational) until the FR/ES runs append them. Both outputs go in the
  report.

### 2. Content files
- New `content/fr.json` and `content/es.json`, with the same schema as `en.json`. Each sets `source.file` to its own
  export, `source.commit` `ffec355` and `source.sha256` per E12. Every post has `"lang": "fr"|"es"`; `slug` = the
  **EN** slug (ADR 0004).
- `en.json` gains only the EN parity posts and fields of D-2, **appended** (E2: the `src` tests must pass unchanged).
- Transcription rules are those of rev 2: verbatim; Markdown → HTML for `wysiwyg` only; `text` gets plain text (bold and
  link markup removed, link text kept).
  - Final-CTA `subtitle` (text): paragraphs joined with one space (5a precedent, `local-fixtures.php:7-8`).
  - Packages `subtitleHero`: joined with `\n\n` (rev 2).
- **No content file may contain an image, url, true_false or `cta_link_hero` key.** This is enforced by the test.

**Scope of writes per language** (FR and ES identical in shape; EN columns only where D-2 adds them):

| Post (EN slug) | Fields |
|---|---|
| `services` | Hero title + subtitle + `cta_text_hero` (main CTA label); `pageintrotext` + `intro_body_html`; `core_heading`, `supporting_heading`, `supporting_intro`; 7 rows: `title`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id` (paths/anchors identical to EN); final CTA (D-3) |
| `packages` | Hero title, `subtitle_hero`, `cta_text_hero` + `hero_cta_path` `/contact`; `intro_body_html` (tax note); 3 rows: `name`, `heading`, `description_html`, `cta_text`, `cta_path` `/contact`, `anchor_id`; `sections` 2 rows; final CTA (D-3) |
| `about-magneto` | Hero title + subtitle + label; `section_title` (§2 heading), `description_html` (§2 body), `link_text` (§2 CTA label), `general_text` (§3-§5 body, D-6 template), `about_cta_text` + `about_cta_path` `/contact` (§5 CTA); final CTA (§7) |
| `contact` | Hero title + subtitle only (Q2 unchanged) |
| `home` | Hero title + subtitle + label (FR 535 / ES 536) |
| `projects` | Hero title + subtitle (Home §4 heading + intro) + label (FR 558, ES new) |
| `fashion-company-ecommerce` | `project_data` group: `project_subtitle` (hero line), `project_description` (overview paragraphs + capability line), `challenges` 3, `solutions` 4, `results` 6; `card_description` (Home §4 card); `images[].foot_note` per D-4; final CTA |
| `shamaniccas-ecommerce` | the same; `solutions` 4 |

Main CTA label (5b §5.4, now this spec's rule):
- EN "Book a Free Strategy Call", FR "Réserver un appel-conseil gratuit", ES "Agendar una llamada de orientación
  gratuita".
- Used for `cta_text_hero` on services, home, about-magneto and projects, and for the strategy-call final-CTA buttons.
- Packages hero: FR "Parlez-moi de votre projet" / ES as exported, + `/contact`.

Final CTA (D-3): the six `text` fields are written **together** on each post: `title`, `subtitle`, `prefooter_cta_text`,
`cta_path`, `secondary_cta_text`, `secondary_cta_path`. Paths are as in EN (Services: secondary `/contact`; Packages:
primary `/contact`). `prefooter_cta_link` (url, Copy) and `bgimage` are never written.

**Not written in any language:**
- post title, slug or status (titles are set by Mauricio in the checklist)
- `cta_link_hero`; `project_url`; every image and icon
- legacy `description` / `price` / `features` / `featured_service` / `Popular_Choise` / `calendly_*` / `link_url`
- `contactContactTexts`; Home body sections; Trépied (D-5); `display_order` (Copy-synced, below)

### 3. Loader changes (`load-content.php`)
1. **Language argument.** `lang=en|fr|es` is required and selects `content/<lang>.json` unless `content=` is given.
   Abort if any post's `lang` ≠ `lang`, or if `source.file` is not that language's export. One language per run.
   This replaces the EN-only abort (`:95-97`).
2. **Target resolution.** The EN original is resolved by type + slug + `en`, exactly one, as today (`:98-113`). For
   `fr`/`es` the target is `wpml_object_id(EN, type, false, lang)`. It must:
   - exist and differ from EN;
   - have WPML language = `lang`, `post_name` = EN slug, and status `publish`;
   - have **no** `_icl_lang_duplicate_of`.
   
   Each abort names the checklist row (#1-13). Read-only WPML filters only, so still no WPML writes.
3. **Row rule (D-1 B, approved; ADR 0006 amendment 3):** for every repeater in the content, content rows = **EN** rows.
   Then:
   - EN target: EN rows ∈ {current, content} for the D-2 growth repeaters only (`project_data_results` 3→6 on 270/224,
     `project_data_solutions` 3→4 on 224, `sections` 0|2); exact everywhere else.
   - FR/ES target: target rows ≤ EN rows. Missing rows are **appended**. Rows are never removed, and target rows > EN
     aborts. Appending is allowed only on repeaters with no image sub-field (challenges, solutions, results, sections);
     any other need aborts.
   - Existing rows merge by index as today. Appended rows get only the content sub-keys.
   - **Dry-run output (D-1 B (b)):** each appended row is its own line,
     `+ append <post>/<lang> <meta name>[<i>] <sub-key>=<first 60 chars>`, under the post's plan. The per-post totals
     line reads `<post>/<lang>: N changes (M appended rows), K unchanged`. Appended rows are **not** counted in N, and the
     run total adds them up the same way. The real run prints the same `+ append` lines before writing, and the
     read-back marks them `(appended)`.
   - **Expected appended rows** (the Dev puts the exact totals in the report before the runs):
     - EN parity: Dangel `results` +3, Shamanicca `solutions` +1, Shamanicca `results` +3 = **7**.
     - FR: the same 7. ES: the same 7.
     - Re-runs (second dry-run): 0 in every language.
4. **Group merge.** Fields nested in `project_data` are written as the whole group:
   - read raw `get_field(group, id, false)`;
   - overwrite only the content sub-keys, merging nested repeaters by index as in 3;
   - keep every other sub-key (`project_url`, …);
   - `update_field(group, merged, id)`.
   
   Read-back compares by key **and** by meta name (`project_data_results`).
5. **Copy-sync list (FR/ES only, declared once in the loader, printed in the plan as `↺ copy-sync`):**
   `service_group` per services row and `display_order`. These are copied from the EN value at the same index.
   - They are the only Copy-pref values the frontend needs per language.
   - Locally they already match after a Duplicate.
   - In production the posts are created **before** the EN load (OQ-1), so they won't match. Never images.
6. **Media report (read-only):** for each image sub-field on FR/ES rows, compare the attachment's EN original ID
   (`wpml_object_id(att, 'attachment', true, 'en')`) with the EN row's ID, and print `media ok` or
   `media WARN (row i differs from EN)`. A WARN never aborts and never writes. The fix is outside the loader
   (§8, release-day note 6).
7. **Cross-language probe (replaces `:210-221`):** before and after the write, hash the raw values of **every touched
   key** on the other two languages' posts (`no-translation` when absent). They must be equal, or FAIL with a non-zero
   exit. An FR run therefore proves EN and ES unchanged.
8. **Unchanged:** local-only guard (no override flag); backup guard; sha pin; key existence; dry-run with per-post
   totals; read-back with "(carried over)"; no deletes, no post/title/slug/status/option changes; `update_field` only
   after every guard.

### 4. `check-translations.php` (new, read-only)
`wp eval-file <repo>/scripts/phase-5c/check-translations.php [lang=fr|es]` prints one line per checklist row (13; or the
rows of one language) and ends with `N/13 PASS`. Each line shows:
- EN ID and slug, translation ID, language, `post_name`, status, title;
- same trid (via `wpml_object_id`), `dup_of` flag;
- whether ACF groups are attached: `acf_get_field_groups(['post_id'=>T])` count = EN count;
- Copy repeater rows (target vs EN, informational);
- the media report of §3.6.

It contains **no** write call (AC-4) and prints `home_url()` first. It has no host guard so that it can be reused
read-only in production (release-day note 2). For the first posts on Monday, before the script exists, Mauricio can
run the GraphQL link check instead:
```graphql
{ fr: pages(first:1, where:{language:"fr", name:"services"}) { nodes { databaseId slug status title
    language { code } translations { databaseId language { code } } } } }
# projects: projects(first:1, where:{language:"fr", name:"fashion-company-ecommerce"}) { … same … }
```
Pass = one node, `slug` = EN slug, `status` publish, and `translations` contains the EN ID.

### 5. Translation-post checklist (Mauricio, WPML admin, local first)
**Method (all 13 rows; E9):**
1. WPML → Translation Management → filter the type → tick the EN item → *Duplicate content* for **one** language →
   Duplicate.
2. Pages (or Projects) → language switcher → open the new copy → **Translate independently**.
3. Set **Title** (column below). Check that the permalink slug is the EN slug (if WPML proposes `-2`, set it back) and
   that the status is **Publish**.
4. **Don't edit any ACF field** (the loader fills them). Update.
5. **Never open + Update the EN original** (A3). After each post, run its check (§4).

**Order:** rows 10-13 (cases) **before the EN parity run** (D-1 B (a), §1). Rows 1-9 any time before the FR/ES runs.

**Rows** (local EN IDs; production IDs differ and are resolved by slug):

| # | EN original (ID) | Type | Lang | Slug (= EN) | Title (D-6) | Groups the post must show |
|---|---|---|---|---|---|---|
| 1 | services (34) | page | fr | `services` | Services | H, I, S, F |
| 2 | packages (36) | page | fr | `packages` | Forfaits | H, I, P, PS, F |
| 3 | about-magneto (32) | page | fr | `about-magneto` | À propos | H, A, F |
| 4 | contact (41) | page | fr | `contact` | Contact | H, C, F |
| 5 | services (34) | page | es | `services` | Servicios | H, I, S, F |
| 6 | packages (36) | page | es | `packages` | Paquetes | H, I, P, PS, F |
| 7 | about-magneto (32) | page | es | `about-magneto` | Sobre Magneto | H, A, F |
| 8 | contact (41) | page | es | `contact` | Contacto | H, C, F |
| 9 | projects (38) | page | es | `projects` | Proyectos | H, I, F |
| 10 | fashion-company-ecommerce (270) | project | fr | `fashion-company-ecommerce` | Dangel Wellness (FR 502) | PD, F |
| 11 | shamaniccas-ecommerce (224) | project | fr | `shamaniccas-ecommerce` | Shamanicca (FR 645) | PD, F |
| 12 | fashion-company-ecommerce (270) | project | es | `fashion-company-ecommerce` | Dangel Wellness (ES 512) | PD, F |
| 13 | shamaniccas-ecommerce (224) | project | es | `shamaniccas-ecommerce` | Shamanicca (ES 659) | PD, F |

**Copy vs Translate per group** (ACFML, E5; "loader" = the loader overwrites it; "Duplicate" = the value stays as
duplicated from EN):

| Group | Copy (1) — stays as duplicated, never edited | Translate (2) — loader fills | Translate — not loaded (keeps the EN duplicate; not rendered or legacy) |
|---|---|---|---|
| H `heroContent` | `image`, `background_image` | `hero_title`, `subtitle_hero`, `cta_text_hero`, `hero_cta_path` (Packages) | `cta_link_hero` (booking link, same in all languages) |
| I `pageIntroText` | — | `pageintrotext` (Services), `intro_body_html` (Services, Packages) | Projects page intro |
| S `servicesServiceDetails` | `services` rows, `featured_service`, `Image`, `icon`, `service_group` (copy-synced) | `core_heading`, `supporting_heading`, `supporting_intro`, rows `title`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id` | rows `description` (legacy) |
| P `packagesPackageFeatures` | `packages_elements` rows, `Popular_Choise`, `icon`, `features` rows | rows `name`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id` | `price`, `description`, `features_title`, `feature` (hidden in rich mode) |
| PS `packagesContentSections` | `sections` rows | `heading`, `body_html` | — |
| A `aboutData` | `calendly_url` | `section_title`, `description_html`, `link_text`, `general_text`, `about_cta_text`, `about_cta_path` | `description`, `link_url`, `calendly_text` |
| C `contactContactTexts` | — | — | all (not rendered, ADR 0006 am. 2) |
| PD `projectsProjectData` | `project_data` group, `project_url`, list rows, `display_order` (copy-synced), `images` rows, `image`, `ismobilescreenshot` | `project_subtitle`, `project_description`, `item` ×3 lists, `card_description`, `foot_note` (D-4) | — |
| F `finalCtaSection` | `prefooter_cta_link`, `bgimage` | the six text fields (D-3) on Services, Packages, About and the 2 cases | Contact: attached, never rendered (E15). ES `projects` (row 9): empty → home fallback |

**Done** = `check-translations.php` prints `13/13 PASS` locally. That is the OQ-1 precondition for creating the
production posts.

### 6. Run (Mauricio, Local "Open site shell", one command at a time; per language)
```bash
mkdir -p ~/Documents/projects/magneto/backups/phase-5c
wp eval-file <repo>/scripts/phase-5c/check-translations.php lang=<fr|es>         # FR/ES only: all rows PASS
wp db export ~/Documents/projects/magneto/backups/phase-5c/magneto-cms-2_<lang>-before_$(date +%Y%m%d-%H%M).sql
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<lang> dry-run       # compare with the Dev's expected totals
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<lang> backup=<that .sql>
wp cache flush
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<lang> dry-run       # must print 0 changes, 0 appended rows
```
- Order: `en` (parity, D-2) → `fr` → `es`. Before `en`: `check-translations.php` with rows 10-13 PASS (§1).
- Real run only if the dry-run shows exactly the expected posts, no other field, totals ≤ expected, **exactly 7
  `+ append` lines** (§3.3), and no `media WARN`.
- Rollback: `wp db import <that .sql>` + `wp cache flush`. This restores **all** languages to the state before that run,
  which is why there is one backup per language.

### 7. Mid-phase checkpoint — **Mon 11-09, end of day** (Mauricio + Senior Architect, ≈ 20 min)
Required before Tuesday's FR/ES runs:
1. `check-translations.php` 13/13 PASS (output in the report). The run **before** the EN parity load shows rows 10-13
   with case rows equal to EN.
2. Loader guard proofs (stub harness, AC-3) and `php -l` clean.
3. EN parity: dry-run = expected (7 `+ append` lines), real run all ok, cross-language probe unchanged, second dry-run
   0 / 0.
4. After the EN parity load, `check-translations.php` shows FR/ES case rows below EN (the append path is armed).
5. `content.test.ts` green for `en` + `fr`. `es.json` may still be in progress.

Go/no-go for Tue 11-10. If item 1, 3 or 4 fails, FR/ES runs move by a day. ES can slip to Wed 11-11 without blocking
FR (Plan B shape).

### 8. EN admin saves after FR/ES loads (rev 3.1)
**Plan.** On **Sat 11-14**, after the FR/ES loads, Mauricio sets the Services row `Image` and `icon` on the **EN**
`services` page (34) in WP admin (5b report "decision A", :236-253). FR Services and ES Services (rows 1, 5) exist and
are loaded by then.

**What the save does (E13, from the source; A5):**
- WPML copies every **Copy** key of page 34 to FR and ES Services. The changed `services_N_Image` / `services_N_icon`
  are copied (ACFML remaps the IDs to the translated attachments, if any). Every other Copy key is already equal to
  EN, so nothing changes: `services` = 7, `service_group`, `featured_service`, hero `image` / `background_image`,
  `prefooter_cta_link`, `bgimage`, and the `_` reference keys.
- **No Translate field is written** on FR/ES (titles, headings, bodies, CTAs, hero text, final CTA). The ACFML shuffle
  can re-pair Translate sub-fields only when rows are reordered (E13), which rule 1 forbids.
- The EN WYSIWYG bodies may be re-formatted by the editor (same visible text; 5b report :241-243).

**Rules for the save:**
1. Change only `Image` / `icon` fields. Don't add, delete or reorder rows, and don't touch any text field or the
   ACFML "Synchronise translations" checkbox.
2. Backup first: `wp db export …/phase-5c/magneto-cms-2_en-media-before_$(date +%Y%m%d-%H%M).sql`.
3. One Update. Close the page.
4. WPML may then show FR/ES Services as "needs update" in Translation Management. That is a status only. **Don't open
   the WPML translation editor** and don't re-duplicate: either would overwrite the loaded FR/ES text.
5. Every other EN admin save of a page that has FR/ES translations (e.g. an EN title change from 5c-rest) follows the
   same rules and the same follow-up. EN Packages is never saved in admin (A3).

**Required follow-up (same day, Mauricio runs, Dev reads back; AC-12):**
1. `wp cache flush`.
2. `check-translations.php lang=fr` and `lang=es`: 13 rows still PASS, and rows 1 and 5 print `media ok` on all 7
   Services rows.
3. `load-content.php lang=en dry-run`: expected 0 changes, or only `description_html` / `intro_body_html` re-formatting
   on `services`. In that case, review it, then run `lang=en` for real with the backup from rule 2, then a 0 dry-run.
4. `load-content.php lang=fr dry-run` and `lang=es dry-run`: **must print 0 changes, 0 appended rows**. Anything else
   means A5 is wrong. Stop, keep the output, and report to the Architect before any re-run. Only after that review, a
   re-run per §6 (backup, run, flush, dry-run 0) restores the loaded values.
5. Dev, read-only: GraphQL `services` rows FR/ES vs EN. `Image` / `icon` `sourceUrl` equal after `resolveOriginalMedia`
   semantics (AC-6 query), and Translate values equal to `fr.json` / `es.json` (AC-7 subset).
6. Results go into the phase report as an addendum ("Sat 11-14 EN media save").

**Production rule.** Set the Services row images and icons on the **production EN** page **before** the 13 production
FR/ES posts are created (OQ-1). The Duplicate then carries the final media, and no EN save is needed after the FR/ES
release-day loads. If an EN image is changed after the production posts exist, the same rules and follow-up apply in
production (read-only `check-translations.php`, FR/ES dry-run 0), with the media report as the check. See D-7 for the
live-site effect.

## Files the Dev may touch
- `scripts/phase-5c/load-content.php`: §3.
- `scripts/phase-5c/check-translations.php` (new): §4, read-only.
- `scripts/phase-5c/content/en.json`: **append only** (D-2 posts/fields); existing posts byte-identical.
- `scripts/phase-5c/content/fr.json`, `scripts/phase-5c/content/es.json` (new).
- `scripts/phase-5c/content.test.ts`: generalized to three languages (AC-1).
- `docs/reports/phase-5c-loader.md` (new): runs, outputs, checkpoint, ACs, the Sat 11-14 addendum.

Anything else is out of scope, including every `src/` file, the three `src` tests that import `en.json` (they must pass
unchanged), `state-c.json`, `local-fixtures.php`, the ACF JSON, the dictionaries and ADR 0006 (amendment 3 is written by
this spec revision, not by the Dev).

## Out of scope
- Production mode and any production write (release-day notes only).
- Everything listed in **5c-rest** below: Trépied in all three languages (D-5), Home body sections in any language, EN
  final-CTA labels and the other EN fixture-only values, EN post titles, the FR/ES home and projects titles.
- `generalSettings`.
- New screenshots (Phase 8 / Mauricio).
- Privacy pages; dictionary TODO fill (Q-D1, separate work on Wed 11-11); hreflang (Phase 7); Dangel slug rename
  (Backlog); orphan-meta cleanup.
- Sanitizing `generalText` (Known debt); the empty caption `<p>` (E16, observed only).

## Acceptance criteria
- [ ] **AC-1 `content.test.ts`** (runs in `npm test`):
  - **Pins:** en/fr/es pinned to their sha256 (E12), and each content file's `source.file` matches its `lang`.
  - **Verbatim:** every copy value appears verbatim in the `src` lines. The normalizer adds `[text](url)` → `text`
    and the FR/ES CTA forms, and a one-word mutation fails.
  - **Post lists:** EN = rev 2's 6 + D-2 posts, in order; FR = 8 posts; ES = 8 posts.
  - **Structural equality across languages:** row counts, `anchor_id`, `cta_path`, `hero_cta_path` and the sub-key
    sets are identical in EN/FR/ES.
  - **Labels:** main CTA label per language on the four heroes; Packages `/contact` only.
  - **Forbidden keys:** no key whose ACF type (from `docs/acf/phase-5-field-groups.json`) is `image`, `url` or
    `true_false`, and no `field_689a2e2960322`, in any content file.
- [ ] **AC-2 Gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build` passes. Lint ≤ the
  `master` count (no new errors in `scripts/`). `php -l` is clean on both PHP files.
- [ ] **AC-3 Guard proofs (stub harness, no WordPress write).** Each case below aborts with 0 writes; the stub's write
  log is empty:
  - wrong host; stale or missing backup; sha mismatch;
  - `lang` ≠ content language; missing translation; translation not detached;
  - slug ≠ EN; wrong language; status ≠ publish;
  - target rows > EN; content rows ≠ EN rows;
  - growth needed on a repeater with an image sub-field.
  
  Positive cases: an FR run appends results 3→6. The dry-run prints 3 `+ append` lines for it, and the totals line
  shows `(3 appended rows)` with the appended rows not counted in `changes`. Every image and other sub-key reads back
  "(carried over)", and a second dry-run prints `0 changes (0 appended rows)`. Plus one real dry-run by Mauricio with a
  wrong-sha copy of `fr.json`, which aborts in preflight.
- [ ] **AC-4 Read-only checker:** `grep -nE "update_|delete_|add_(post_)?meta|wp_(insert|update|delete)_|do_action|wpml_set|->query\(" scripts/phase-5c/check-translations.php`
  returns no match. Locally it prints 13/13 PASS, and the output is in the report.
- [ ] **AC-5 Runs (EN parity, FR, ES), each with:**
  - dry-run = the Dev's expected totals, including **7 `+ append` lines** (§3.3);
  - for FR and ES, the case posts existed before the EN parity run (`check-translations.php` output before the EN run,
    with its timestamp, in the report);
  - "all read back ok", with appended rows marked `(appended)`; exit 0;
  - cross-language probe unchanged;
  - `wp cache flush`, then a second dry-run with `0 changes (0 appended rows)`;
  - backup file names recorded.
- [ ] **AC-6 Media:** the read-back lists every image sub-field of touched rows as "(carried over)" and unchanged, and
  there is no `media WARN` locally. In the GraphQL read-back below, every FR/ES hero, service-row and gallery image
  `sourceUrl` equals the EN one after `resolveOriginalMedia` semantics (EN-original URL), with the same count per page.
- [ ] **AC-7 GraphQL read-back (Dev, read-only, `language` + `name`).** Covers the 13 posts plus FR/ES home and FR
  projects:
  - every loaded value equals the content as visible text, and row counts equal EN;
  - `ctaPath` is `/contact` on Packages only, and `ctaLinkHero` is unchanged;
  - `displayOrder` FR/ES = 10/20, and `serviceGroup` FR/ES = EN.
- [ ] **AC-8 Rendering (port 3100, `ENABLED_LOCALES=en,fr,es` + `ALLOW_UNTRANSLATED_LOCALES=1`, local only):**
  - These 14 routes return 200: `/{fr,es}/{services,packages,about-magneto,contact}`, `/es/projects`, and
    `/{fr,es}/projects/{fashion-company-ecommerce,shamaniccas-ecommerce}`.
  - Their SSR `<main>` contains none of a sentinel list of 30 EN strings taken from `en.json` and the EN case/About
    copy. Known exclusions: the lead-magnet fallback, and the FR/ES home final-CTA fallback on `/es/projects` (R-9,
    E15).
  - Screenshots at 375/768/1440 for FR and ES, with no horizontal scroll.
  - **Gallery spacing with empty captions (D-4, E16):** on both cases in EN, FR and ES at 375/768/1440, the screenshots
    show the gaps between gallery images and before "View live site". The report states whether the empty `<p>` adds
    a visible gap compared with the spacing of a page that has no captions. No `src` change; if Mauricio finds the gap
    wrong, it is recorded as a follow-up for a `src` spec.
  - Mauricio approves FR (FR-CA reader) and ES. The full matrix stays in the launch QA.
- [ ] **AC-9 EN unchanged:** the EN SSR `<main>` text of `/services`, `/packages`, `/contact`, `/projects` and `/` is
  identical before the FR run and after the ES run. EN About and the two cases change only as D-2 says.
- [ ] **AC-10 Known debt "prerender per locale":** the `en,fr,es` build output lists prerendered
  `/fr|es/projects/{fashion-company-ecommerce,shamaniccas-ecommerce,trepied-trepied-ca}` (AGENTS Known debt).
- [ ] **AC-11 Report** `docs/reports/phase-5c-loader.md`: checkpoint, outputs (tails), decisions applied, deviations.
  No claim of production readiness.
- [ ] **AC-12 Sat 11-14 EN media save (addendum, after the report):** the §8 follow-up ran. Its outputs are in the
  report: backup name, `check-translations` with `media ok` on rows 1 and 5, EN dry-run (0 or reviewed re-format + re-run
  + 0), FR and ES dry-runs `0 changes (0 appended rows)`, and the Dev's GraphQL comparison. Any FR/ES drift is reported
  as an A5 failure before it is fixed.

## Decisions

**Decided (Mauricio, 2026-11-03):**
- **D-1 → B**, plus (a) case posts before the EN parity run locally (§1, §5, §7, calendar), (b) one `+ append` line per
  appended row and separate totals (§3.3), and (c) ADR 0006 amendment 3: append-only, never shrink, never on repeaters
  with an image sub-field, abort if target rows > EN. *This is the explicit approval to change the rev 2 guard "row count
  fixed".*
- **D-2 → A.** EN parity for the Dangel and Shamanicca bodies and the About body, appended to `en.json`.
- **D-3 → A.** FR/ES final CTAs are loaded on Services, Packages, About and the 2 cases. EN final CTAs keep "Book a
  Strategy Call" locally until 5c-rest (5c-rest item 3).
- **D-4 → A.** `foot_note` = `""` on every existing gallery row of Dangel and Shamanicca in EN/FR/ES. Spacing check in
  AC-8 (E16).
- **D-5 → A, only together with the 5c-rest section below.** Trépied stays out of rev 3 (5c-rest item 1).
- **D-6 → (a) + (b).** FR/ES page titles = the dictionary nav labels, case titles = the export's hero heading; the
  `general_text` template reuses the existing classes for EN/FR/ES.

Rejected options are kept in the rev 3 text (git history of this file, `01d7798`).

**Open (new in rev 3.1):**

**D-7. Live effect of the production image rule (§8).** Setting the Services images on production EN before the FR/ES
posts are created (W5, by Sun 11-29) makes them visible on the live `/services` within ≈ 60 s (`revalidate: 60`, ADR
0006 context 1), next to the legacy row titles, about 10 days before release.
- **A (recommended if the new art reads well next to the legacy titles).** Accept it, and assign by row position (5b
  report :248-250).
- **B.** Create the production posts first, and set the EN images on release day right after the EN load and before
  promote. Each FR/ES Services post then receives the images through the EN save (E13), followed by the §8 follow-up in
  production. This adds steps to release day.

**D-8. Titles of the FR/ES posts that already exist** (FR 535 / ES 536 "Home", FR 558 "Projects"; E14). The titles are
the hero `alt` (E8), and A4 forbids saving FR/ES posts in admin after their load.
- **A (recommended).** Mauricio sets them on Monday with the checklist, before the FR/ES loads: FR "Réalisations", ES
  "Proyectos" already approved for projects (E11), and a home title per language that he approves (the dictionaries have
  no home nav label). ≈ 5 min.
- **B.** Leave them to 5c-rest. That requires a loader title write or an admin save after load (A4), which is why A is
  recommended.

**D-9. Home rows in 5c-rest** (decided in the 5c-rest spec, listed here so it isn't missed). E14 shows FR/ES home
testimonials 4 > EN 2, and featured services need 2 → 3 rows with an icon (image sub-field). Both are forbidden by
amendment 3, and production EN needs the same shrink/grow on release day (A6). Options for that spec: a one-off,
separately approved row rule for `home` only; a manual admin step (EN rows in admin, then the §8 follow-up for FR/ES);
or re-creating the FR/ES home translations. No choice is needed for rev 3.

No other ADR is needed: no new dependency, routing or schema change. ADR 0006 amendment 3 records D-1 B.

## 5c-rest (must be scheduled before the release-day runbook)
Everything this spec defers. The release-day runbook (W6, 11-30 → 12-06, 5b §11) assumes that EN, FR and ES content
exist as loader files for every post that release day writes. Today the items marked "blocking" below exist only locally
(5a fixtures), or nowhere.

| # | Item | Current local state (evidence) | Launch-blocking | Estimate agent / Mauricio |
|---|---|---|---|---|
| 1 | **Trépied EN/FR/ES body**, FR/ES titles, FR/ES `cardDescription` and final CTA, captions (D-4 rule) | EN 498: legacy subtitle, rows 3/4/4 vs copy 3/4/6, 7 legacy captions (E14; copy EN 1020-1107). FR 550 / ES 541: `[FR TEST]` / `[ES TEST]` titles, EN legacy body, `cardDescription` null, final CTA null. | **Yes.** EN: legacy text on a published case page in the grid (`displayOrder` 40). FR/ES: test titles in the grid. The copy note "Trépied does not block … publishing" (EN 1030) is about the client project; it lets Mauricio unpublish Trépied for launch instead. | 2–3 h / 30 min (titles 2 min in admin before load, 3 runs, FR/ES approval). Uses the D-1 B path: results +2 per language. |
| 2 | **Home body sections EN/FR/ES**: about, featured services + taglines, testimonials (Dangel + Isra, role/company/city/note), footer line, home final CTA | EN 2: from 5a fixtures only (`local-fixtures.php:77-141`), not in `en.json`. FR 535 / ES 536: legacy EN text, featured 2 rows, testimonials 4 roleless rows, legacy footer line and final CTA (E14). | **Yes.** EN: production home body has no loader content for release day. FR/ES: legacy EN text on `/fr`, `/es`. | 4–6 h (content, tests, and the D-9 row design) / 1–1.5 h |
| 3 | **EN final-CTA labels vs the approved main CTA**, and the other EN values that exist only in the 5a fixtures: final CTAs of 7 posts, About `description_html` + CTA, `cardDescription`, `displayOrder` | `ctaText` / `secondaryCtaText` "Book a Strategy Call" on home, services, packages (secondary), about, 3 cases; copy "Book a Free Strategy Call" (EN 127, 243, 415, 539, 995, 1106, 1241). Source: `local-fixtures.php:137-180` only (E14). | **Yes.** It contradicts approved EN copy (Hard rule 4), and production has no loader content for these new fields. | 1.5–2 h (append to `en.json`; the 5c-rest spec decides how fields are added to posts already in `en.json` without changing them byte-wise, E2) / 15 min |
| 4 | **FR/ES home final-CTA fallback** (was "Contact FR/ES final CTA fallback R-9", corrected by E15) | `/fr|es/projects` and `/fr|es` show the FR/ES home final CTA = "Ready to stop guessing and start converting?" / "Get Your Free Strategy Call" (E14). Contact has no final CTA. | **Yes for FR/ES enablement**; no effect on EN. | Included in item 2 |
| 5 | **EN post titles** | 270 "Dangel Wellness — dangelwellness.ca", 224 "Shamanicca’s Ecommerce", 498 "TRÉPIED — trepied.ca" vs copy heroes "Dangel Wellness" / "Shamanicca" / "Trépied" (937, 1177, 1044); 32 "About Magneto" (hero `alt`). ADR 0006 decision 4 lists post titles as release-day loader content. | **Yes** (case titles render, E8). | 0.5–1 h (loader title support, its own guard + read-back) / 10 min. An admin title change is an EN save and needs the §8 follow-up. |
| 6 | **FR/ES home and FR projects titles** (D-8) | FR 535 / ES 536 "Home", FR 558 "Projects" (E14). | Yes for FR/ES (hero `alt`), minor. | 0 h / 5 min (Monday, D-8 A). Only if D-8 = B. |
| 7 | Tracked elsewhere, listed so the runbook has them: production mode of the loader (release-day note 1), `generalSettings.title` (ADR 0006 consequences), Services media in production (§8, D-7), Privacy pages (D-L), FR/ES dictionary fill (Wed 11-11) | — | Yes, except the dictionary fill, which blocks only the locale that has TODOs (ADR 0005 guard; Plan B for ES) | Their own specs/runbooks |

**Total items 1-5:** agent ≈ 8–12 h, Mauricio ≈ 2–3 h (incl. runs and approval), plus Architect ≈ 1.5–2 h for the
5c-rest spec.

**Proposed slot, week of 11-16** (5b §11 W4 "5c EN/FR/ES content + loads locally"):
- **Mon 11-16:** Architect writes the 5c-rest spec (D-9 decided in it). Mauricio + Senior Architect review by Tue noon.
- **Tue 11-17 (afternoon) – Wed 11-18:** Dev implements items 1-3 and 5 (content, tests, loader title support, D-9 rule).
- **Thu 11-19:** Mauricio runs locally: EN → FR → ES, each with a backup, a dry-run, the run and a 0-change dry-run. Dev
  reads back and renders.
- **Fri 11-20:** report and approval. That leaves W5 for the production posts (OQ-1), with the media rule (§8) first,
  and W6 for the release-day runbook, which consumes `en.json` / `fr.json` / `es.json` as final.
- If 5c-rest slips past Fri 11-20, the release-day runbook rehearsal in W6 has no complete content files. That is a new
  trigger for the 12-17 rule (5b §11).

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | Duplicate fails silently (Phase 3) or leaves stray posts | Translation Management method; per-post check; `$wpdb`/GraphQL row in report |
| R-2 | Copy not detached → a later EN save overwrites FR/ES with EN | `dup_of` check (A1) blocks the loader; §8 step 2 re-checks before trusting the Sat save |
| R-3 | Group/nested write semantics differ from A2 | Stub harness + first dry-run prints raw shape; read-back by meta name; backup per language |
| R-4 | Admin save of EN Packages (A3) or of FR/ES after load (A4) | Checklist rule; re-run loader; dry-run shows drift |
| R-5 | EN duplicate text left in fields not loaded (legacy, Copy) | Readers use the new fields when filled (E8); AC-8 sentinel scan |
| R-6 | Calendar: ≈ 190 values × 2 languages in one Dev day, plus the dictionary fill on Wed 11-11 | Order of work in §7; ES may slip to Wed without blocking FR |
| R-7 | D-1 B appends rows that a later EN reorder would mismatch | Rows never reordered (5b report :238); growth only on text-only repeaters (amendment 3) |
| R-8 | Trépied test titles visible when FR/ES enabled | D-5; 5c-rest item 1; launch QA |
| R-9 | `/fr|es/projects` and `/fr|es` show the FR/ES home final CTA = legacy EN text until 5c-rest (corrected, E15) | Listed; excluded from the AC-8 sentinel; 5c-rest items 2 and 4 |
| R-10 | The Sat 11-14 EN save writes FR/ES text, contrary to E13 (A5), or WYSIWYG re-format on EN | §8 rules + follow-up: FR/ES dry-runs must be 0; backup before; stop and report on drift |
| R-11 | 5c-rest Home needs a row shrink/grow that amendment 3 forbids (D-9) | Decided in the 5c-rest spec before any Home load; no rev 3 effect |

## Release-day notes (production; list only, not implemented in rev 3)
1. **Production mode** needs its own runbook spec and a separate guard design: an explicit target host
   `https://cms.magnetomarketing.co`, an explicit `target=production` argument, and a backup guard on a SiteGround
   export. The local guard stays the default.
2. **OQ-1:** after 13/13 PASS locally, Mauricio creates the 13 production posts in a separate session before release
   day, with a fresh production backup. FR/ES stay disabled, so the posts are invisible (ADR 0006 decision 4).
   `check-translations.php` runs read-only in production to verify them, and again on release day.
3. **Release-day order:** backup → EN load (rev 2 + D-2 + 5c-rest: grows `sections` 0→2 and the case rows) → cache
   flush → FR load → ES load. Each step has dry-run, backup, read-back and a 0-change dry-run. **D-1 B is what makes the
   pre-created posts loadable**; the `+ append` lines are the expected evidence.
4. **Plan B:** with `ENABLED_LOCALES=en,fr`, the ES load is skipped or run invisibly. The FR run never depends on ES.
5. **Production preflight:** EN IDs are resolved by slug (Dangel = 270 per 5b E15; the others are unknown). Capture
   production EN row counts read-only first, including home featured services and testimonials (A6, D-9). The EN row
   rule must accept production's legacy counts.
6. **Images:** set the production EN Services images **before** the 13 production FR/ES posts are created (§8
   production rule, D-7). Posts created before an EN image change keep the old attachments until an EN save copies the
   new ones (E13). A `media WARN` is fixed by Mauricio setting that image on **EN** in admin, followed by the §8
   follow-up (the loader never writes images), **before** the FR/ES load.
7. WPML production key and outbound access (3b O-1/O-2). Flush the SiteGround cache after each run; Vercel revalidates
   in 60 s.
8. Never save FR/ES posts in admin after their load (A4), and never save EN Packages (A3). Any other EN admin save after
   the FR/ES loads follows §8.
9. Items not in rev 3: see **5c-rest**. The release-day runbook is written only after 5c-rest is approved and run
   locally.

## Estimate and calendar
| Task | Dev (agent) | Mauricio |
|---|---:|---:|
| Spec review (rev 3 + 3.1) | — | 45–60 min |
| Loader §3 (lang, targets, D-1 B with `+ append` output, group merge, copy-sync, media report, probe) + stub harness proofs | 4–5 h | — |
| `check-translations.php` | 0.75–1 h | — |
| EN parity content (D-2 A) | 1.5–2 h | — |
| `fr.json` (8 posts) | 3–4 h | — |
| `es.json` (8 posts) | 2.5–3.5 h | — |
| `content.test.ts` (3 languages, AC-1) | 1.5–2 h | — |
| 13 translation posts (local) + checks, cases before EN parity (+ D-8 A titles, 5 min) | — | 2–3 h |
| Runs EN / FR / ES (dry-run check, run, re-dry-run) | 0.5 h (expected totals) | 1–1.5 h |
| GraphQL read-back, rendering, screenshots incl. gallery spacing, EN-unchanged, build (AC-6…AC-10) | 2–3 h | 30–45 min (FR/ES approval) |
| Checkpoint + report | 1 h | 20–30 min |
| Sat 11-14 EN media save + §8 follow-up (AC-12) | 0.5 h (read-back, addendum) | 45–60 min (incl. the image work's save, not the image choice) |
| **Total** | **≈ 17.5–24.5 h** | **≈ 6–8 h** |

Calendar:
- **Mon 11-09**
  - Dev, in this order: loader §3 + `check-translations.php` → EN parity content → `fr.json`.
  - Mauricio, morning: creates the **4 case posts first** (rows 10-13), then the 9 page posts, and runs
    `check-translations.php` (output kept: case rows = EN). D-8 A titles in the same session.
  - Mauricio runs the EN parity load in the afternoon, only after rows 10-13 PASS. **Checkpoint at end of day.**
- **Tue 11-10**
  - Dev: `es.json` + tests.
  - Mauricio: **FR run** (morning) and **ES run** (afternoon).
  - Dev: read-back, rendering, report.
- **Wed 11-11:** buffer, **and the FR/ES dictionary fill**: Mauricio approves 58 FR / 57 ES strings (the `[FR TODO]` /
  `[ES TODO]` values in `fr.ts` / `es.ts`, ADR 0005; separate work, not in this spec). The ES run moves here if
  `es.json` is late (no effect on FR). If both don't fit, the ES run and the ES strings may slip together (Plan B
  shape); the FR run and FR strings have priority.
- **Sat 11-14:** Mauricio sets the EN Services images/icons (§8), then runs the follow-up. The Dev adds the AC-12
  addendum.
- **Week of 11-16:** 5c-rest (section above).

The agent total exceeds one working day, and the calendar holds only if Monday's order is kept. Against 5b §11 ("5c
rest EN/FR/ES" 15–22 h agent / 5–8 h Mauricio), rev 3 uses most of that budget. 5c-rest (≈ 8–12 h agent / 2–3 h
Mauricio) is therefore **additional** to that line, and the 5b §11 totals should be re-read with it at the 11-09
checkpoint.
