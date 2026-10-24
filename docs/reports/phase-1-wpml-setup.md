# Phase 1 report — WPML setup (local CMS)

- Spec: `docs/specs/phase-1-wpml-setup.md` (Approved — 2026-10-24, D1–D4; post-execution corrections C1–C4 added)
- Author: Dev · Date: 2026-10-24 · Branch: `chore/phase-1-wpml-setup` (HEAD `c9f5f52`, nothing staged)
- Input: Mauricio's checklist notes (folded into this report, then deleted, as instructed)

## Result
**Done, with one minor finding.** The local CMS serves EN / FR (`fr_CA`) / ES. Pages and projects never fall
back to EN. All 13 ACF groups have a translation mode. EN content is byte-identical to the baseline, and the
EN frontend is unchanged.
Finding: the ES test string has a trailing period (`…Clients Online.`), so V5 "exactly the test string"
fails for ES only. It is a QA marker that Phase 5 overwrites → decision below (D-a).
Recommended fetch strategy for Phase 3: **B (`pages(where:{language, name})`), confirmed.**

## Changes
- `docs/specs/phase-1-wpml-setup.md` — "Post-execution corrections — 2026-10-24" section (C1 Local site name
  "Magneto CMS 2", C2 backups folder, C3 step 4 labels in WPML 4.7.6, C4 step 5 verified by WP-CLI dump), plus
  "*see C…*" pointers on steps 0, 4, 5, 8 and rollback. Original text kept. *Not in the spec's file list;
  done on your explicit instruction.*
- `docs/ai/WP-SETUP.md` (V8) — Environment (site name, backups folder); plugin table with step-0 versions and
  current state (WPML/ACFML configured; WP Migrate Lite and WordPress Importer marked deleted, as the plugin list
  shows); "Phase 1 order" marked done; new section **"WPML / ACFML settings (to repeat in production)"** with
  real admin labels, both verification commands and the ACF JSON export route; change log, one row per step,
  plus backup file names.
- `docs/adr/0001-wpml-headless-i18n.md` — "Translation workflow" note (D1), 4 lines. Nothing else changed.
- `AGENTS.md` — Known debt (Code): one `homePackages` / `homePrefooter` line with the usage result. 181 lines.
- `CLAUDE.md` — Current phase → `Phase 1 — WPML setup (local CMS).` + scope pointer.
- `docs/reports/phase-1-mauricio-notes.md` — deleted after folding (it was untracked, so no commit is needed).
- No changes in `src/`, config, dependencies or `.env.local`. No agent wrote to the CMS.

## Gate
Run in a clean worktree of `HEAD` (`<scratchpad>/p1wt`, `npm ci`, `.env.local` symlinked read-only), so
Mauricio's dev server on :3000 (PID 35933) and its `.next` were never touched.

| Check | Result | Notes |
|---|---|---|
| lint | failed — **= 0.5b baseline** | 136 errors / 118 warnings / 46 files, 0 `rules-of-hooks` (identical to 0.5b) |
| typecheck | passed | |
| tests | passed | 5 files / 27 tests |
| build | passed | 14/14 static pages |
| V7 HTTP smoke (EN) | passed | identical to the 0.5b re-check capture (`b5/recheck/after3`) |
| visual (375/768/1440, locales) | not run | no frontend change in this phase; FR/ES routes don't exist yet (Phase 2) |

## Evidence
All CMS checks: anonymous `POST http://magneto-cms-2.local/graphql`, read-only. Raw responses in
`<scratchpad>/before/` (20:45Z = 16:45 local) and `<scratchpad>/after/` (21:48Z = 17:48 local).
`<scratchpad>` = `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/daecc535-73cf-4f93-9569-e12da35576e8/scratchpad`.

### V0 — EN baseline (before step 0) ✅
Appendix A run twice at ≈16:45 local, before Mauricio's step 0 (16:51). Equal to E6:
```
pages 7 projects 3 bytes 43716 sha256 a9345a3b19f1821ef92c5dc79d790e2dd24cf3a9e29664987a0d982c57383743
home sha256 5e89fb5b4f6f1e778432a9b294d8260ac8be9acb3f329fb71784106b688c4beb
```
"Before" snapshots saved: `before/e1-languages.json` (fr = `fr_FR`), `before/e3-projects-fr.json` (3 EN
projects, `languageCode:"en"` → EN fallback), `before/e7-uri-lookups.json` (`fr/home` → page 2).

### V1 — Languages ✅
`en` en_US (default) · `fr` **fr_CA** (was fr_FR) · `es` es_ES · URLs `/`, `/fr/`, `/es/` · `generalSettings.language` `""`.

### V2 — Pages per language ✅
- `fr` → 1 node: `{databaseId:535, slug:"home", uri:"/fr/", languageCode:"fr", translationGroupId:"2", status:"publish"}`
- `es` → 1 node: `{databaseId:536, slug:"home", uri:"/es/", languageCode:"es", translationGroupId:"2", status:"publish"}`
- `en` → the same 7 pages as E3 (2, 32, 34, 36, 38, 41, 533).

### V3 — No EN fallback ✅
`projects(language:"fr")` → `[]` · `es` → `[]` (before: the 3 EN projects) · `pages(fr, name:"services")` → `[]` ·
`projects(language:"en")` → still 498, 224, 270. `custom_posts_sync_option` after: `"page":"1"`, `"project":"1"`.

### V4 — EN unchanged ✅
Appendix A after step 8, run twice: **identical to E6/V0** (`a9345a3b…`, home `5e89fb5b…`, 43716 bytes).

### V5 — FR/ES home content ⚠️ (ES marker)
Same selection as Appendix A, flattened and diffed against EN home (71 leaf fields). Script: `<scratchpad>/v5-diff.mjs`.

| | FR (535) | ES (536) |
|---|---|---|
| `heroTitle` | `[FR TEST] Attract More Aligned Clients Online` ✅ exact | `[ES TEST] Attract More Aligned Clients Online.` ⚠️ **extra trailing "."** |
| other differences | `databaseId`, `uri` (`/fr/`) — expected | `databaseId`, `uri` (`/es/`) — expected |
| media `databaseId` | 11 differ (attachment copies) — allowed | 11 differ — allowed |
| media `sourceUrl` | **0 differ** ✅ | **0 differ** ✅ |
| every other text/URL/boolean field | equal to EN ✅ | equal to EN ✅ |

Side effect seen: the 4th testimonial thumb (EN 528, which had no copies in E3) now has copies 537 (FR) and 539 (ES),
created by the Duplicate. Same file (`sourceUrl` identical).

### V6 — Fetch strategies for Phase 3 ✅ (B confirmed)
Selection = today's `Hero/api.ts` `heroContent` block. Bytes = HTTP body (raw incl. `extensions` / data only).
Raw: `after/v6-*.json`, summary `after/v6-summary.txt`.

| Strategy · case | Correct node? | Missing case | Requests | Bytes raw / data | Reuses today's EN query unchanged? |
|---|---|---|---|---|---|
| **A** `page(id:"home",URI){… translations{…}}` | FR/ES ✅ (536, 535 in the array); EN = the anchor | `services` → `translations: []` ✅ | 1, but always EN + all others | **9975 / 9311** for one language's need | No: adds a `translations` block and picks the language in code; EN anchor must exist |
| **B** `pages(first:1, where:{language, name:"home"})` | en 2 ✅ · fr 535 ✅ · es 536 ✅ | `services` fr → `nodes: []` ✅ (en → 34 ✅) | 1 | en 3528/3114 · fr 2927/2537 · es 3545/3127 | Same field selection; root changes `page(id)` → `pages(where){nodes}` and the mapper reads `nodes[0]` |
| **C** `page(id:"/fr/", URI)` | ❌ `/fr/` → `null`, `/es/` → `null` (although the FR home's `uri` **is** `/fr/`); `/` → EN ✅ | ❌ `fr/services` → **EN page 34** | 1 | 260/22 (null) | Yes, but wrong results |
| extra: `page(id:"fr/home",URI)` / `pageBy(uri:"fr/home")` | ❌ both → **EN page 2** | — | 1 | ≈300/55 | — |

**Recommendation for Phase 3: B.** It is the only strategy that returns the right node in all three languages
and a clean empty result when a translation is missing. It is one request with a single-language payload
(FR 2.5 KB vs A 9.3 KB) and keeps the EN slug as the key. A works, but always ships every language and depends
on the EN node. C and `pageBy(uri:)` are unsafe both ways: they miss the real FR front page and silently return EN
for a missing one. Today's `Hero/api.ts` uses `pageBy(uri:"home")`, so Phase 3 must not localise by prefixing the URI.
Limitation (as the spec says): B on a non-front page is proven only by the missing case. Re-check once a second
page is translated.

### V7 — Frontend EN regression ✅
Own server `PORT=3100 npm run dev` in the worktree (PID 39361 + child 39382, stopped by those PIDs only; :3000
untouched). `<scratchpad>/b5/capture.sh` with `BASE=http://localhost:3100` → `<scratchpad>/p1/v7/`:
- smoke: 9 routes 200 · `/projects/no-existe` 404 · `/carte` 404 · robots + sitemap 200 · `/api/ping-cms` 404
- `smoke.txt`, `datasource.txt` (local 409 / prod 0), `projects.txt` (titles, h1, gallery counts), proxy status and
  body: **all identical to the 0.5b re-check**.
- `/` HTML: "Attract More Aligned Clients Online" ×3, `[FR TEST]` 0, `[ES TEST]` 0. No marker in the 7-route HTML.
- `/projects/trepied-trepied-ca` 200.

### ACF export check (item 3) — yes, the export includes both keys
**How I checked (read-only):** I read the plugin source in the Local install
(`~/Local Sites/magneto-cms-2/app/public/wp-content/plugins/`, ACF PRO 6.8.10, ACFML 2.1.5). There is no
`acf-json` folder in `wp-content`, so the groups live only in the DB and there was no existing export file to
inspect. I did not run WP-CLI or open WP admin.
- `acfml_field_group_mode` is a key of the field-group array (`acfml/classes/FieldGroup/Mode.php:11`, `KEY`).
  `wpml_cf_preferences` is a key of each field array (`class-wpml-acf-field-settings.php`, rendered as the
  field setting `name => 'wpml_cf_preferences'`).
- The export strips only `ID`, `local`, `_valid` from the group
  (`advanced-custom-fields-pro/includes/post-types/class-acf-field-group.php:396-398`) and `ID, prefix, value,
  menu_order, id, class, parent, _name, _prepare, _valid` from each field (`includes/acf-field-functions.php:1562-1565`).
  Both ACFML keys survive. ACFML's own export hook (`acfml/classes/Tools/Export.php`) only adds
  `wpml_field_group_language` when field groups are translatable. They are not (`acf-field-group: 0`), so it adds nothing.
- **Import caveat:** `import_post()` saves each field (`acf_update_field` → ACFML stores the exported preference
  in WPML) and then the group, which fires `acf/update_field_group`. ACFML's `SaveHooks::onUpdateFieldGroup` then
  **overwrites every field preference with the mode's default** unless the group is in Expert mode
  (`acfml/classes/FieldGroup/SaveHooks.php:42-63`, `ModeDefaults.php`). Locally every preference already equals
  the "translation" mode default (text 2, url/image/file 1, …), so the import reproduces the same values. If a
  group is ever switched to Expert, the exported per-field values are kept as-is.
- **Conclusion:** ACF → Tools → Export Field Groups (JSON) → import in production is a valid way to replicate
  step 5, provided production's groups have the same keys (the import updates by key and deletes fields missing
  from the JSON). Take a backup first and run the WP-SETUP verification command afterwards.
- Optional confirmation without the source (Mauricio, read-only, if wanted):
  `wp eval 'echo wp_json_encode( acf_prepare_field_group_for_export( acf_get_field_group( "<group_key>" ) ) );' | grep -o 'acfml_field_group_mode[^,]*\|wpml_cf_preferences[^,]*' | head`

### Mauricio's checklist (from his notes)
**Step 0 — 16:51.** Backup `magneto-cms-2_phase1-before_20261024-1651.sql`. A premature "after" export
(`…_phase1-after_20261024-1652.sql`, identical to "before") was later deleted.
`wp plugin list --fields=name,status,version`:
```
add-wpgraphql-seo active 5.1.0        · acfml active 2.1.5              · advanced-custom-fields-pro active 6.8.10
sg-ai-studio active 1.3.1             · all-in-one-wp-migration active 7.112 · classic-editor active 1.7.0
disable-media-sizes active 2.6        · enable-cors active 2.1.0        · post-types-order active 2.5.9
post-type-switcher active 4.1.1       · simple-image-sizes active 3.2.6 · svg-support active 2.6.1
wp-graphql active 2.25.0              · wpgraphql-acf active 3.0.0      · wpgraphql-ide active 5.7.0
wpml-graphql active 1.1.3             · sitepress-multilingual-cms active 4.7.6
wpml-string-translation inactive 3.3.3 · wordpress-seo active 28.7
```
`custom_posts_sync_option` before → after (only the changed key shown; everything else identical):
`"project":"2"` → `"project":"1"`. Unchanged: `"page":"1"`, `"post":"1"`, `"attachment":1`, `"acf-field-group":0`,
`"acf-post-type":0`, `"acf-taxonomy":0`, `"acf-ui-options-page":0`, `wp_*` 1, the rest `"0"`.

- **17:03 Step 1:** no wizard (already completed) → confirmed in settings. "Translate Everything Automatically" =
  **OFF**. Nothing sent from the Translation Dashboard.
- **17:10 Steps 1–2:** EN default + FR + ES; directories; French locale `fr_FR` → `fr_CA`; browser redirect disabled;
  "WPML is registered on this site" (lifetime account).
- **17:16 Step 3:** Pages + Projects → translatable, only show translated items. Media value read from the option: `1`.
- **17:16 Step 4:** label mismatch → C3 (left unchanged; native editor chosen per page).
- **17:31 Step 5:** WP-CLI dump instead of 13 screens → C4. 12/13 groups already `mode=translation`, with
  auto-assigned preferences matching the spec rule (text 2; image/url/file/true_false/repeater structure 1; package
  `price` 2). **Fixed:** "Projects - Project Data" had `mode=-` (`project_url`, `images`, `ismobilescreenshot` had no
  preference) → set to "Same fields across languages" + Save → re-run at 17:34: `mode=translation`, no `-` left.
- **Step 6:** nothing to do (no menus, no options page).
- **Step 7:** EN home duplicated to FR and ES, each "Translate independently", `heroTitle` set to the test strings,
  EN home closed without Update. Confirmed by V2/V4/V5 (except the ES period).
- **17:42 Step 8, first attempt:** `"project":"2"` still → the step 3 Projects change had not been saved (each WPML →
  Settings section has its own Save). Re-saved → `"project":"1"`.
- **17:45 Step 8:** real "after" backup `magneto-cms-2_phase1-after_20261024-1745.sql` (the 16:52 and 17:42 "after"
  files deleted).

## Deviations from the spec
1. **C3, step 4:** the WPML 4.7.6 labels differ. The Translation Editor section was left at ATE (default). Manual
   translation happens through the native editor per page. Senior Architect decision. D1 still holds.
2. **C4, step 5:** verified by a WP-CLI dump, not 13 screens. Accepted by the Senior Architect, differences from the
   step 5 table:
   - `cta_link_hero`, `anchor_link`, About `link_url` = 2 (translate), not copy once. They are ACF `text` fields,
     so the mode default is translate.
   - testimonial `author` = 2, not copy.
   - `prefooter_cta_link` and About `calendly_url` = 1 (copy), not copy once.
   - `cta_link_LeadMagnetSection` (file) = 1 (copy): FR/ES can't have their own guide PDF yet. Revisit at the
     lead-magnet rebuild (recorded in WP-SETUP).
3. **C1/C2:** Local site name and backups path corrected in the spec.
4. **ES test string** has a trailing period (V5). See D-a.
5. **Files outside the spec's list**, edited on your explicit instruction: the spec itself (corrections), and the
   deletion of `phase-1-mauricio-notes.md`.
6. Gate and V7 ran in a separate worktree on :3100, not in the main checkout, because of AGENTS.md "Dev servers".
   Same `HEAD`, no source difference.

## Decisions needed
- **D-a (ES marker):** (1) Mauricio removes the trailing "." from the ES `heroTitle` (1 min, local only; the Dev
  re-runs V5), or (2) accept it as is. It is a marker that Phase 5 overwrites, and Phase 6 checks for `[ES TEST]`,
  not the exact string. Recommendation: (2) accept, and record it here.

## Issues found (not fixed)
- **FR/ES media copies have stale `mediaDetails.sizes`.** The size list differs from EN on 14 FR copies and 7 ES
  copies. In 11 FR and 4 ES cases the copy is **missing** sizes, e.g. bg image 52 → FR 53 lacks `mobile-scale`,
  `tablet-scale`, `desktop-scale`, `avatar`. The other 3 per language only have extra sizes.
  `sourceUrl` is identical everywhere, so images still load; but
  `WpResponsiveImage` builds `srcSet` from `sizes`, so FR/ES would get a smaller or empty `srcSet` for those
  images. The copies predate Phase 1 (E3), except 537/539. → Phase 3 (fetch EN media, or re-sync the copies'
  metadata before Phase 5). Evidence: `<scratchpad>/after/media-sizes.json`, `<scratchpad>/media-sizes.mjs`.
- **`nodeByUri("/fr/")` and `page(id:"/fr/", URI)` return `null`** although the FR home exists with `uri:"/fr/"`;
  `fr/<slug>` URIs resolve to EN (E7 confirmed after setup). Covered by the V6 recommendation; noted for Phase 3.
- Known debt line added: `homePackages` / `homePrefooter` are dead code (see AGENTS.md).
- **Production:** no agent request to `cms.magnetomarketing.co`. All queries were to `magneto-cms-2.local`, and
  the V7 HTML has 0 production references.

## Proposed commits (nothing staged)
1. `docs(phase-1): WPML setup spec with post-execution corrections`
   - `docs/specs/phase-1-wpml-setup.md`
2. `docs(wp-setup): record Phase 1 WPML/ACFML settings and how to repeat them in production`
   - `docs/ai/WP-SETUP.md`
3. `docs(adr): add the translation workflow note to ADR 0001`
   - `docs/adr/0001-wpml-headless-i18n.md`
4. `docs(phase-1): report, known debt and current phase`
   - `docs/reports/phase-1-wpml-setup.md`, `AGENTS.md`, `CLAUDE.md`

(`docs/reports/phase-1-mauricio-notes.md` was never tracked, so its deletion needs no commit.)

## Time
- Mauricio, steps 0–8: ≈55 min (16:51–17:46, from chat timestamps; includes waiting for Senior Architect
  replies). The spec estimated 75–110 min; the WP-CLI dump for step 5 saved most of the 30–40 min ACFML estimate.
- Dev: V0 + snapshots ≈5 min; V1–V8, export check, docs and report ≈ 45–60 min (estimated, not measured).
