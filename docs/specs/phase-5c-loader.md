# Phase 5c — Content loader: local FR-CA / ES load + translation-post checklist (rev 3)

- **Status: Draft** (rev 3). Needs review by Mauricio + Senior Architect before Mon 11-09.
- Author: Architect · Reviewed by: Mauricio + Senior Architect · **Run by: Mauricio** (agents never write to WordPress)
- Date: 2026-11-03 · Branch: `spec/phase-5c-rev3` (from `master` @ `f6cd045`). Implementation branch: the Dev creates one.
- Depends on: rev 2 of this spec (EN loader, run 2026-10-31, [5b report](../reports/phase-5b-services-packages-seo.md)
  "Loader run"), [5b spec](phase-5b-services-packages-seo.md) rev 9 (§5.4 override, OQ-1, "Other specs" item 1, E16),
  [ADR 0006](../adr/0006-phase-5-content-model.md) (decisions 4, 5; amendment 2), [ADR 0004](../adr/0004-localized-data.md),
  Phase 3 report (WPML duplicate method), 5d-lite (merged, PR #24).
- Canonical copy: `docs/content/magneto-copy-{en,fr-CA,es}.md` **as of `ffec355`** (export 2026-11-02; Notion stays
  canonical). Every `docs/content` line number below is at `ffec355`; section titles govern if a later export moves them.

## Revision
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
- **Open:** D-1 … D-6 below.

## Design

### 1. Order of operations (local)
```
EN rows final (EN parity load, D-2)  ─┐
13 FR/ES posts created + checked     ─┼─▶ FR load (dry-run → run → read-back → dry-run 0) ─▶ ES load (same)
                                      │    one language per run; Plan B: FR never depends on ES
```
- Posts can be created before or after the EN parity load: E10 shows EN writes don't touch FR/ES, and D-1 aligns rows
  afterwards. That is what lets Mauricio create all 13 on Monday.
- The EN parity load **must** run before FR/ES: content rows = EN rows is a preflight rule.

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
3. **Row rule (D-1, recommended option B):** for every repeater in the content, content rows = **EN** rows. Then:
   - EN target: EN rows ∈ {current, content} for the D-2 growth repeaters only (`project_data_results` 3→6 on 270/224,
     `project_data_solutions` 3→4 on 224, `sections` 0|2); exact everywhere else.
   - FR/ES target: target rows ≤ EN rows. Missing rows are **appended** (never removed; target rows > EN aborts).
     Appending is allowed only on repeaters with no image sub-field (challenges, solutions, results, sections); any
     other need aborts.
   - Existing rows merge by index as today. Appended rows get only the content sub-keys.
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
   (release-day note 6).
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
| F `finalCtaSection` | `prefooter_cta_link`, `bgimage` | the six text fields (D-3) | — (Contact: EN empty → home fallback) |

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
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=<lang> dry-run       # must print 0 changes
```
- Order: `en` (parity, D-2) → `fr` → `es`.
- Real run only if the dry-run shows exactly the expected posts, no other field, totals ≤ expected, and no
  `media WARN`.
- Rollback: `wp db import <that .sql>` + `wp cache flush`. This restores **all** languages to the state before that run,
  which is why there is one backup per language.

### 7. Mid-phase checkpoint — **Mon 11-09, end of day** (Mauricio + Senior Architect, ≈ 20 min)
Required before Tuesday's FR/ES runs:
1. `check-translations.php` 13/13 PASS (output in the report).
2. Loader guard proofs (stub harness, AC-3) and `php -l` clean.
3. EN parity: dry-run = expected, real run all ok, cross-language probe unchanged, second dry-run 0.
4. `content.test.ts` green for `en` + `fr`. `es.json` may still be in progress.

Go/no-go for Tue 11-10. If item 1 or 3 fails, FR/ES runs move by a day. ES can slip to Wed 11-11 without blocking FR
(Plan B shape).

## Files the Dev may touch
- `scripts/phase-5c/load-content.php`: §3.
- `scripts/phase-5c/check-translations.php` (new): §4, read-only.
- `scripts/phase-5c/content/en.json`: **append only** (D-2 posts/fields); existing posts byte-identical.
- `scripts/phase-5c/content/fr.json`, `scripts/phase-5c/content/es.json` (new).
- `scripts/phase-5c/content.test.ts`: generalized to three languages (AC-1).
- `docs/reports/phase-5c-loader.md` (new): runs, outputs, checkpoint, ACs.

Anything else is out of scope, including every `src/` file, the three `src` tests that import `en.json` (they must pass
unchanged), `state-c.json`, `local-fixtures.php`, the ACF JSON and the dictionaries.

## Out of scope
- Production mode and any production write (release-day notes only).
- Trépied FR/ES/EN bodies (D-5).
- Home body sections (About, Featured, Testimonials, footer line, final CTA) in any language; EN final-CTA labels; EN
  post titles; `generalSettings`.
- New screenshots (Phase 8 / Mauricio).
- Privacy pages; dictionary TODO fill (Q-D1); hreflang (Phase 7); Dangel slug rename (Backlog); orphan-meta cleanup.
- Sanitizing `generalText` (Known debt).

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
  
  Positive cases: an FR run appends results 3→6 and keeps every image and other sub-key "(carried over)", and a second
  dry-run prints 0. Plus one real dry-run by Mauricio with a wrong-sha copy of `fr.json`, which aborts in preflight.
- [ ] **AC-4 Read-only checker:** `grep -nE "update_|delete_|add_(post_)?meta|wp_(insert|update|delete)_|do_action|wpml_set|->query\(" scripts/phase-5c/check-translations.php`
  returns no match. Locally it prints 13/13 PASS, and the output is in the report.
- [ ] **AC-5 Runs (EN parity, FR, ES), each with:**
  - dry-run = the Dev's expected totals;
  - "all read back ok", exit 0;
  - cross-language probe unchanged;
  - `wp cache flush`, then a second dry-run with `0 changes`;
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
    copy. Known exclusions: lead-magnet fallback, Contact's home final-CTA fallback (R-9).
  - Screenshots at 375/768/1440 for FR and ES, with no horizontal scroll.
  - Mauricio approves FR (FR-CA reader) and ES. The full matrix stays in the launch QA.
- [ ] **AC-9 EN unchanged:** the EN SSR `<main>` text of `/services`, `/packages`, `/contact`, `/projects` and `/` is
  identical before the FR run and after the ES run. EN About and the two cases change only as D-2 says.
- [ ] **AC-10 Known debt "prerender per locale":** the `en,fr,es` build output lists prerendered
  `/fr|es/projects/{fashion-company-ecommerce,shamaniccas-ecommerce,trepied-trepied-ca}` (AGENTS Known debt).
- [ ] **AC-11 Report** `docs/reports/phase-5c-loader.md`: checkpoint, outputs (tails), decisions applied, deviations.
  No claim of production readiness.

## Decisions needed

**D-1. Row counts on FR/ES targets.**
- **A.** Strict equality, with EN rows final before any translation is created. Locally this works if Mauricio creates
  the 4 case posts only after the EN parity run. **In production it conflicts with OQ-1.** Posts created before release
  day get EN production's old counts: `sections` 0, case lists 3. The FR/ES loads would then abort, unless every
  FR/ES post is re-created on release day.
- **B (recommended).** Append-only alignment up to EN (§3.3), never on repeaters with images, never shrinking. This
  rehearses the production path locally and lets all 13 posts be created Monday. Cost ≈ +1 h agent.
- **C.** Re-save each FR/ES translation in admin after the EN load so ACFML copies the structure. Rejected: unverified,
  13 manual saves on release day, and risk A4.

*This changes the rev 2 guard "row count fixed", so it needs explicit approval.*

**D-2. EN parity inside rev 3** (needed by D-1 in any option: content rows must equal EN rows).
- **A (recommended).** Append Dangel and Shamanicca EN bodies (subtitle, description, lists, `card_description`
  unchanged, captions per D-4) and the About body (`section_title`, `link_text`, `general_text`) to `en.json`. Cost
  ≈ +1.5–2 h agent, +20 min Mauricio. EN local becomes complete for these posts, and the EN release-day content is
  ready.
- **B.** Only the EN rows the FR/ES loads need, i.e. cases only. Cost ≈ +1–1.5 h. EN About stays on the funnel copy
  locally.
- **C.** Drop the FR/ES case bodies from rev 3. FR/ES cases would then show the EN legacy text, with unsupported claims
  (E6).

**D-3. FR/ES final CTAs on the 5 posts that have one.**
- **A (recommended).** Load them. Otherwise the Duplicate leaves EN text in the final CTA of every FR/ES page.
- **B.** Leave them to 5c-rest.

EN final CTAs keep "Book a Strategy Call" (5a fixtures) until 5c-rest. That is a visible EN/FR label difference
locally.

**D-4. Gallery captions.** The copy captions describe screenshots that don't exist yet (E6; the "current production
screenshots" rule).
- **A (recommended).** Write `foot_note` = `""` on every existing row in EN/FR/ES for Dangel and Shamanicca. That
  means no EN text on FR/ES pages and no unsupported EN claims. `alt` becomes the localized generic text (E7). The new
  captions load with the screenshot retake.
- **B.** New captions by position on the old screenshots: mismatched, and Dangel has 5 slots for 6 captions.
- **C.** Blank FR/ES only and keep the EN legacy captions.

**D-5. Trépied FR/ES** (posts exist with `[FR TEST]` / `[ES TEST]` titles and legacy body). Its rows are 3/4/4 against
the copy's 3/4/6.
- **A (recommended).** Not in rev 3 (outside the given scope). Defer to 5c-rest together with the EN Trépied body.
  Until then, enabling FR/ES shows the test titles in the FR/ES grid. Fixing the two titles in admin is a 2-minute
  manual step that Mauricio may do at any time.
- **B.** Include it now: ≈ +1.5 h agent, +10 min Mauricio.

**D-6. FR/ES titles and the About HTML template.**
- **(a) Page titles = the approved dictionary nav labels (E11, recommended).** Page titles render as the hero image
  `alt` (E8). The alternative is keeping the duplicated EN title (EN `alt` on FR/ES pages). Case titles = the export's
  hero heading.
- **(b) `general_text` template.** Reuse the classes already in the field: `h3.typo-2xl-extrabold.hero-title.m-0`,
  `p.typo-lg-medium.hero-title.m-0`, plain `ul/li`, defined once for EN/FR/ES (recommended). No `src` change.

No ADR needed: no new dependency, routing or schema change. D-1 B extends ADR 0006 decision 4's loader rules, so the
Senior Architect may annotate the ADR.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | Duplicate fails silently (Phase 3) or leaves stray posts | Translation Management method; per-post check; `$wpdb`/GraphQL row in report |
| R-2 | Copy not detached → a later EN save overwrites FR/ES with EN | `dup_of` check (A1) blocks the loader |
| R-3 | Group/nested write semantics differ from A2 | Stub harness + first dry-run prints raw shape; read-back by meta name; backup per language |
| R-4 | Admin save of EN Packages (A3) or of FR/ES after load (A4) | Checklist rule; re-run loader; dry-run shows drift |
| R-5 | EN duplicate text left in fields not loaded (legacy, Copy) | Readers use the new fields when filled (E8); AC-8 sentinel scan |
| R-6 | Calendar: ≈ 190 values × 2 languages in one Dev day | Order of work in §7; ES may slip to Wed without blocking FR |
| R-7 | D-1 B appends rows that a later EN reorder would mismatch | Rows never reordered (5b report :238); growth only on text-only repeaters |
| R-8 | Trépied test titles visible when FR/ES enabled | D-5; launch QA |
| R-9 | `/fr|es/contact` final CTA falls back to FR/ES home final CTA = old EN text until 5c-rest | Listed; excluded from AC-8 sentinel; 5c-rest |

## Release-day notes (production; list only, not implemented in rev 3)
1. **Production mode** needs its own runbook spec and a separate guard design: an explicit target host
   `https://cms.magnetomarketing.co`, an explicit `target=production` argument, and a backup guard on a SiteGround
   export. The local guard stays the default.
2. **OQ-1:** after 13/13 PASS locally, Mauricio creates the 13 production posts in a separate session before release
   day, with a fresh production backup. FR/ES stay disabled, so the posts are invisible (ADR 0006 decision 4).
   `check-translations.php` runs read-only in production to verify them, and again on release day.
3. **Release-day order:** backup → EN load (rev 2 + D-2: grows `sections` 0→2 and the case rows) → cache flush → FR
   load → ES load. Each step has dry-run, backup, read-back and a 0-change dry-run. **D-1 B is what makes the
   pre-created posts loadable.**
4. **Plan B:** with `ENABLED_LOCALES=en,fr`, the ES load is skipped or run invisibly. The FR run never depends on ES.
5. **Production preflight:** EN IDs are resolved by slug (Dangel = 270 per 5b E15; the others are unknown). Capture
   production EN row counts read-only first; the EN row rule must accept production's legacy counts.
6. **Images:** posts created before any EN image change keep the old attachments. A `media WARN` is fixed by Mauricio
   setting that image in admin (the loader never writes images) or by a WPML translation re-save **before** the FR/ES
   load.
7. WPML production key and outbound access (3b O-1/O-2). Flush the SiteGround cache after each run; Vercel revalidates
   in 60 s.
8. Never save FR/ES posts in admin after their load (A4), and never save EN Packages (A3).
9. Follow-ups that are not in rev 3: EN final-CTA label, EN post titles, Home body, Trépied (5c-rest).

## Estimate and calendar
| Task | Dev (agent) | Mauricio |
|---|---:|---:|
| Spec review (this rev) | — | 45–60 min |
| Loader §3 (lang, targets, D-1 B, group merge, copy-sync, media report, probe) + stub harness proofs | 4–5 h | — |
| `check-translations.php` | 0.75–1 h | — |
| EN parity content (D-2 A) | 1.5–2 h | — |
| `fr.json` (8 posts) | 3–4 h | — |
| `es.json` (8 posts) | 2.5–3.5 h | — |
| `content.test.ts` (3 languages, AC-1) | 1.5–2 h | — |
| 13 translation posts (local) + checks | — | 2–3 h |
| Runs EN / FR / ES (dry-run check, run, re-dry-run) | 0.5 h (expected totals) | 1–1.5 h |
| GraphQL read-back, rendering, screenshots, EN-unchanged, build (AC-6…AC-10) | 2–3 h | 30–45 min (FR/ES approval) |
| Checkpoint + report | 1 h | 20–30 min |
| **Total** | **≈ 17–24 h** | **≈ 5–7 h** |

Calendar:
- **Mon 11-09**
  - Dev, in this order: loader §3 + `check-translations.php` → EN parity content → `fr.json`.
  - Mauricio: creates the 9 page posts (morning), then the 4 case posts. The case posts may come before or after the
    EN parity run under D-1 B.
  - Mauricio runs the EN parity load in the afternoon. **Checkpoint at end of day.**
- **Tue 11-10**
  - Dev: `es.json` + tests.
  - Mauricio: **FR run** (morning) and **ES run** (afternoon).
  - Dev: read-back, rendering, report.
- **Wed 11-11:** buffer. The ES run moves here if `es.json` is late (no effect on FR).

The agent total exceeds one working day, and the calendar holds only if Monday's order is kept. Against 5b §11 ("5c
rest EN/FR/ES" 15–22 h agent / 5–8 h Mauricio), rev 3 uses most of that budget. Production mode, Home body and Trépied
are still left for 5c-rest.
