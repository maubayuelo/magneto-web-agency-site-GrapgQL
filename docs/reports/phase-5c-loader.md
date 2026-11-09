# Phase 5c report — Content loader: local FR-CA / ES load (rev 3.1)

- Spec: `docs/specs/phase-5c-loader.md` rev 3.1 (Approved 2026-11-03)
- Author: Dev · Date: 2026-11-07 · Branch: `feat/phase-5c-fr-es` (from `master` @ `af34db9`), all changes **unstaged**
- Copy source: export **`637fba7`** (per Mauricio's instruction; the spec's `ffec355` line numbers are superseded, and section
  titles govern). sha256: EN `d3516151…ecd0`, FR-CA `f52cf70e…435af`, ES `83332a1b…e857`.

## Result
**Done for AC-1 … AC-11. AC-12 (the Sat 11-14 EN media save) follows as an addendum.** Mauricio approved FR and ES on
2026-11-09 (AC-8). The fresh EN dry-run on 2026-11-08 printed 0 changes (AC-9). The gate was re-run on 2026-11-09. AC-8
also produced findings outside 5c's scope; they are routed to their owners under "AC-8 findings (routed)". Loader §3, the read-only `check-translations.php`, the EN parity content,
`fr.json` and `es.json` are written and pass the stub harness and the gate. Mauricio ran the three loads on the local CMS on
2026-11-07:
- EN parity: 20:31–20:48 ET;
- FR: from 21:11;
- ES: from 21:21, final backup 21:24.

Every count matched the predictions (see "FR run results" and "ES run results"). On 2026-11-07, later that evening:
- The real wrong-sha check aborted as expected (AC-3 closed).
- The Dev's read-only GraphQL read-back passed: 490 values, 106 structural and media checks, 0 differences (AC-6, AC-7).
- The `en,fr,es` build on port 3100 prerendered the FR/ES project pages (AC-10).
- That build served the 14 FR/ES routes with 200, and the 30-string EN sentinel scan found 0 hits.
- 78 screenshot files were captured, with no horizontal scroll (AC-8; approved 2026-11-09).

Agents wrote nothing to WordPress, and this report claims no production readiness.

## Changes
- `scripts/phase-5c/load-content.php`: rewritten per §3:
  - `lang=en|fr|es` is required; the content file and `source.file` must match it;
  - entries with the same type + slug are merged into one plan per post (EN only), and a key set twice aborts;
  - FR/ES target resolution through `wpml_object_id`, with guards (exists, language, EN slug, `publish`, no
    `_icl_lang_duplicate_of`); each abort names the checklist row;
  - D-1 B row rule, with one `+ append` line per row and appended rows counted apart from changes;
  - `project_data` group merge;
  - `↺ copy-sync` of `service_group` and `display_order` from EN;
  - a read-only media report;
  - a cross-language probe of the raw meta on the other two languages' posts, before and after the write;
  - read-back by key and by meta name, with `(carried over)` / `(appended)` marks.
  
  The local guard, backup guard, sha pin, key-existence check and dry-run are unchanged.
- `scripts/phase-5c/check-translations.php` (new, read-only, §4): 13 checklist rows (or one language), `N/13 PASS`, and the
  media report.
- `scripts/phase-5c/content/en.json`: **3 entries appended** (D-2 A). The original 334 lines are a byte-exact prefix of the new
  file (checked with a script: `json.dumps` round-trip identical, and the original text is a prefix). `git diff` shows only `+` lines.
  - `page/about-magneto/en` (2nd entry): `aboutData.sectionTitle`, `.linkText`, `.generalText` (§2 heading, §2 CTA label,
    §3-§5 body, D-6 template).
  - `project/fashion-company-ecommerce/en` and `project/shamaniccas-ecommerce/en`: the `project_data` group (subtitle,
    description, challenges / solutions / results) and `images[].foot_note = ""` (D-4).
  - Not added, as 5c-rest item 3 defers them: About `description_html` and the About CTA, `card_description`, and every EN final CTA.
- `scripts/phase-5c/content/fr.json`, `es.json` (new): 8 posts each (services, packages, home, about-magneto, projects, contact,
  Dangel, Shamanicca), with the full §2 scope including the final CTAs (D-3), in the same schema.
- `scripts/phase-5c/content.test.ts`: generalized to EN/FR/ES (AC-1; 25 tests).
- `docs/reports/phase-5c-loader.md`: this report.

How the values were produced: a generator in the scratchpad (not in the repo) turns `src` line ranges into values, applying the
§2 rules:
- `wysiwyg` gets Markdown → HTML;
- `text` gets plain text, with bold, link and `\$` markup removed;
- a final-CTA subtitle joins its paragraphs with one space.

I validated the generator first by regenerating all 31 rich values of the hand-made rev 2 `en.json` from their `src`
lines: **31/31 identical**. I then reviewed every FR/ES value against the export, and a scan found no leftover Markdown.

## Gate
Final re-run on **2026-11-09** on the final tree (the 7 unstaged files, which are unchanged since 2026-11-07):

| Check | Result | Notes |
|---|---|---|
| lint | passed (ceiling) | 2026-11-09: `npm run lint` printed **88 errors / 94 warnings**, which equals the ceiling and does not exceed it. Exit 1 comes from the baseline errors. Nothing under `scripts/phase-5c`; `npx eslint scripts/phase-5c/content.test.ts` is clean. |
| typecheck | passed | 2026-11-09: `tsc --noEmit` exit 0 |
| tests | passed | 2026-11-09: `npm test -- --run`: 39 files, **577 tests**. The three `src` tests that import `en.json` pass unchanged. |
| build | passed (2026-11-07, not re-run) | `npm run agent:build` **without** the flag fails on the ADR 0005 guard (FR 58 / ES 57 TODO keys). That shows the local env enables FR/ES, so I re-ran it with `ALLOW_UNTRANSLATED_LOCALES=1`: exit 0, 32 static pages. The AC-8 build (`ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1`, after the ES run) also exited 0. No source file changed after it, so the build was not repeated on 11-09. |
| `php -l` | passed | Local's PHP 8.2.30: `No syntax errors detected` on both PHP files |
| AC-4 grep | passed | `grep -nE "update_\|delete_\|add_(post_)?meta\|wp_(insert\|update\|delete)_\|do_action\|wpml_set\|->query\(" scripts/phase-5c/check-translations.php` → no match (exit 1) |
| visual | passed | Checked: 14 FR/ES routes + 2 EN cases × 375/768/1440, with no horizontal scroll and 0 broken images. **Mauricio approved FR and ES on 2026-11-09** for 5c content. The findings outside scope are routed (see "AC-8 findings (routed)"). |

Build side note (AC-10 precondition): `.next/server/app/{fr,es}/projects/` already contains
`fashion-company-ecommerce.html`, `shamaniccas-ecommerce.html` and `trepied-trepied-ca.html`, because every locale now has
projects.

`.env.local` was **not read**: Mauricio's instruction overrides the Dev role's host check. The FR/ES enablement above comes
from the build guard's own message, and the loader enforces the local host itself (`home_url()` guard).

## §7 Mid-phase checkpoint

### Status of the checkpoint items
| # | Item | Status |
|---|---|---|
| 1 | `check-translations.php` 13/13 PASS; the output before the EN run shows case rows = EN | **Done** (Mauricio, 2026-11-08 01:31:11 UTC) |
| 2 | Loader guard proofs (stub harness, AC-3) and `php -l` | **Done**: outputs below |
| 3 | EN parity: dry-run = expected (7 `+ append`), run all ok, probe unchanged, second dry-run 0 / 0 | **Done** (Mauricio, 2026-11-07 20:31–20:38 ET), including **8 accepted whitespace-only services changes** |
| 4 | After the EN run, `check-translations.php` shows FR/ES case rows below EN | **Done** (Mauricio, 2026-11-08 01:38:15 UTC) |
| 5 | `content.test.ts` green for `en` + `fr` | **Done**, and `es` too (25/25) |

**Go/no-go outcome:** all five items passed on 2026-11-07, so the FR and ES runs went ahead the same evening, ahead of the
spec calendar (Tue 11-10). Their results are below.

### EN parity results (Mauricio, local, 2026-11-07 20:31–20:38 ET)
Summarized from Mauricio's report of his terminal output; I have not seen the full output.

1. **check-translations BEFORE** (`2026-11-08 01:31:11 UTC`): `13/13 PASS`, `media WARN rows: 0`. ACF group counts were equal
   on every row, so the possible "ACF groups" false FAIL did not occur. Case rows matched the prediction (= EN).
2. **Backup:** `backups/phase-5c/magneto-cms-2_en-before_20261107-2031.sql`.
3. **Services re-format check** (read-only `wp eval` comparing the DB with `en.json` for `intro_body_html` and the 7
   `services_<i>_description_html`): all 8 printed `raw=diff ws=same text=same`, which means 1–7 bytes of whitespace only. Per
   spec §8 these are the 2026-11-06 admin-save normalizations, so the **8 extra services changes were accepted**.
4. **Dry-run:** `TOTAL: 45 changes (7 appended rows), 88 unchanged`. That equals the expected 37 + 8 changes and 96 − 8
   unchanged. `home/en` had 0 changes. The 7 `+ append` lines were exactly the ones listed below.
5. **Real run:** `Success: 8 field(s) written (45 changes, 7 appended rows), all read back ok.` That is the predicted 6 fields
   plus the 2 re-formatted services fields (`intro_body_html`, the `services` repeater). The read-back showed:
   - 7 lines marked `(appended)`;
   - `project_url`, `images[i].image` and `images[i].ismobilescreenshot` all `(carried over)`;
   - the cross-language probe equal before and after (16 entries).
6. **`wp cache flush`, then the second dry-run:** `TOTAL: 0 changes (0 appended rows), 140 unchanged` (as expected).
7. **check-translations AFTER** (`2026-11-08 01:38:15 UTC`): `13/13 PASS`, `media WARN rows: 0`.
   - #10 / #12 (Dangel): `project_data_results 3/6 (below EN)`;
   - #11 / #13 (Shamanicca): `project_data_solutions 3/4 (below EN)` and `project_data_results 3/6 (below EN)`.
8. **Post-run backup:** `backups/phase-5c/magneto-cms-2_en-after_20261107-2048.sql`.

The EN-side preconditions for the FR / ES runs are now met: EN case rows are 3/4/6 (Dangel) and 3/4/6 (Shamanicca), which
equal the content rows. The expectations below and in "Expected EN-parity dry-run" are kept as the record the run was
checked against.

### FR run results (Mauricio, local, 2026-11-07 from 21:11 ET)
Summarized from Mauricio's report of his terminal output; I have not seen the full output. Every count equals
"Expected FR / ES dry-runs" below.

1. **Backup:** `fr-before_20261107-2111.sql` in `backups/phase-5c/` (name as reported).
2. **Dry-run (`lang=fr dry-run`):**
   - `TOTAL: 122 changes (7 appended rows), 48 unchanged`;
   - the per-post totals as predicted;
   - 9 `↺ copy-sync` lines and 29 `media ok`, with 0 `media WARN`.
3. **Real run:** `Success: 54 field(s) written (122 changes, 7 appended rows), all read back ok.`
   - 7 read-back lines marked `(appended)`;
   - cross-language probe `(en, es)`: before == after.
4. **`wp cache flush`, then the second dry-run:** `TOTAL: 0 changes (0 appended rows), 177 unchanged` (as predicted:
   122 + 48 + 7).
5. **check-translations after the FR run:** `13/13 PASS`.
   - FR case rows (#10, #11): `project_data_solutions 4/4` and `project_data_results 6/6`.
   - ES case rows (#12, #13): still below EN, as expected before the ES run.

### ES run results (Mauricio, local, 2026-11-07 from 21:21 ET)
Summarized from Mauricio's report of his terminal output; I have not seen the full output.

1. **Backup:** `es-before_20261107-2121.sql` (name as reported). This is also the only backup of the state after the FR run
   (there is no separate `fr-after` file).
2. **Dry-run (`lang=es dry-run`):** the same counts as FR, as predicted:
   - `TOTAL: 122 changes (7 appended rows), 48 unchanged`;
   - cross-language probe `(en, fr)`.
3. **Real run:** `Success: 54 field(s) written (122 changes, 7 appended rows), all read back ok.`
   - 7 read-back lines marked `(appended)`;
   - probe before == after.
4. **`wp cache flush`, then the second dry-run:** `TOTAL: 0 changes (0 appended rows), 177 unchanged`.
5. **check-translations after the ES run:** `13/13 PASS`, `media WARN rows: 0`. All four case rows show
   `project_data_solutions 4/4 · project_data_results 6/6`.
6. **Post-run backup:** `es-after_20261107-2124.sql` (name as reported).

**Observation: ES Dangel (615) held Shamanicca text before the run.** Mauricio saw that ES Dangel (615) held Shamanicca
legacy text before the ES run. The run overwrote every loaded field correctly. The dry-run counts for 615 still matched the
prediction (21 changes, 3 appended rows, 4 unchanged), so the row shape was Dangel's (solutions 4). Copy text: Dangel is a
man, so FR "un thérapeute … établi" and ES "un terapeuta" are correct, and no copy change is needed.

The loader does **not** write some fields of 615: `project_url`, the `images` IDs, `ismobilescreenshot`, `prefooter_cta_link`
and `bgimage`. If the Shamanicca text came with Shamanicca Copy values, they are still there. The media report rules out
the gallery: 5 × `media ok` against EN 270's IDs.

**Resolved by AC-7:** 615 and 598 both have `projectUrl` `https://dangelwellness.ca/` (= EN 270), with
`ismobilescreenshot` and the gallery images equal to EN. Nothing from Shamanicca is left on 615.

### Overall result of the three runs
| Run | Backup before | Dry-run (changes / appended / unchanged) | Real run | Probe | Second dry-run | check-translations after |
|---|---|---|---|---|---|---|
| EN parity | `magneto-cms-2_en-before_20261107-2031.sql` | 45 / 7 / 88 (37 + 8 accepted whitespace changes) | 8 fields, all ok | (fr, es) equal | 0 / 0 / 140 | 13/13, FR/ES cases below EN |
| FR | `fr-before_20261107-2111.sql` | 122 / 7 / 48 | 54 fields, all ok | (en, es) equal | 0 / 0 / 177 | 13/13, FR cases 4/4 · 6/6 |
| ES | `es-before_20261107-2121.sql` | 122 / 7 / 48 | 54 fields, all ok | (en, fr) equal | 0 / 0 / 177 | 13/13, all cases 4/4 · 6/6, media WARN 0 |

Post-run backups: `magneto-cms-2_en-after_20261107-2048.sql` and `es-after_20261107-2124.sql`.

### Commands for Mauricio (Local → "Open site shell", one at a time)
`<repo>` = `/Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL`

```bash
# 1. Checklist check BEFORE the EN parity run (keep the full output + its timestamp line for the report)
wp eval-file <repo>/scripts/phase-5c/check-translations.php

# 2. Backup (the loader refuses a real run with a backup older than 3 h)
mkdir -p ~/Documents/projects/magneto/backups/phase-5c
wp db export ~/Documents/projects/magneto/backups/phase-5c/magneto-cms-2_en-before_$(date +%Y%m%d-%H%M).sql

# 3. EN parity dry-run: compare with "Expected EN-parity dry-run" below; send me the full output
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=en dry-run

# 4. Only if 3 matches: the real run, with the .sql from step 2
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=en backup=<the .sql from step 2>

# 5. Flush, then the second dry-run must print: TOTAL: 0 changes (0 appended rows), 140 unchanged
wp cache flush
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=en dry-run

# 6. Checklist check AFTER the EN run (FR/ES case rows must now be below EN)
wp eval-file <repo>/scripts/phase-5c/check-translations.php
```

Note: `load-content.php` now **requires** `lang=`. The rev 2 command without it aborts with
`lang=en|fr|es is required (one language per run).`

### Expected `check-translations.php` output
- Line 1: `home_url(): http://magneto-cms-2.local · <UTC timestamp>`.
- 13 lines `#N PASS …`, then `media WARN rows: 0` and `13/13 PASS`.
- IDs: 1→637, 2→636, 3→634, 4→635, 5→646, 6→645, 7→647, 8→643, 9→644, 10→598, 11→606, 12→615, 13→625.
- **Before the EN run**, the `rows (target/EN)` lines:
  - #10 / #12 (Dangel): `project_data_challenges 3/3 · project_data_solutions 4/4 · project_data_results 3/3 · images 5/5`;
  - #11 / #13 (Shamanicca): `3/3 · 3/3 · 3/3 · images 7/7`;
  - pages: `services 7/7` (rows 1, 5), `packages_elements 3/3 · sections 2/2` (rows 2, 6).
- **After the EN run**:
  - #10 / #12: `project_data_results 3/6 (below EN)`;
  - #11 / #13: `project_data_solutions 3/4 (below EN) · project_data_results 3/6 (below EN)`;
  - everything else unchanged.
- `media ok` lines: `services.Image` / `services.icon` (7 rows) on rows 1 and 5, `packages_elements.icon` (3 rows) on rows 2
  and 6, and `images.image` on rows 10-13.
- "groups x/y": the check compares `acf_get_field_groups(['post_id'=>T])` with EN. Several groups are located by page ID
  (`page == 34`, …). The ACFML source (`acfml/classes/class-wpml-acf-location-rules.php:50-63`, `rule_match_post`) matches
  such rules against every translation of the post, so FR/ES should show the same count as EN. **This comes from reading the
  source, not from a run.** If a page row FAILs only on `ACF groups`, send me the output before doing anything else.

### Expected EN-parity dry-run (`lang=en dry-run`)
Derived from the stub run of the real `en.json` and the local EN values read via GraphQL on 2026-11-07:
- About `linkText` = "Visit LinkedIn Profile" and `generalText` = legacy funnel HTML;
- Dangel 270: rows 3/4/3, 5 captions, legacy body;
- Shamanicca 224: rows 3/3/3, 7 captions, legacy body;
- rev 2 posts: final dry-run was 0 on 2026-10-31.

**Exactly these 7 `+ append` lines** (they print inside the Dangel / Shamanicca plans):
```
  + append fashion-company-ecommerce/en project_data_results[3] item="Editable website content with a written administration guide"
  + append fashion-company-ecommerce/en project_data_results[4] item="Cookie-consent controls"
  + append fashion-company-ecommerce/en project_data_results[5] item="Measurement of form submissions and booking-link clicks"
  + append shamaniccas-ecommerce/en project_data_solutions[3] item="Added a newsletter signup, cookie-consent choice and priv…"
  + append shamaniccas-ecommerce/en project_data_results[3] item="One search across products and articles"
  + append shamaniccas-ecommerce/en project_data_results[4] item="A newsletter signup"
  + append shamaniccas-ecommerce/en project_data_results[5] item="A cookie-consent choice and privacy policy"
```

**Per-post totals (exact, if the 11-06 admin saves changed nothing in the loaded values):**

| Totals line | Changes | Appended rows | Unchanged | Which values change |
|---|---:|---:|---:|---|
| `services/en: … (id 34)` | 0 | 0 | 57 | — |
| `packages/en: … (id 36)` | 0 | 0 | 27 | — |
| `home/en: … (id 2)` | 0 | 0 | 3 | — |
| `about-magneto/en: … (id 32)` (one line for both entries) | 2 | 0 | 4 | `aboutData.linkText`, `aboutData.generalText` (`sectionTitle` + 3 hero values are already equal) |
| `projects/en: … (id 38)` | 0 | 0 | 3 | — |
| `contact/en: … (id 41)` | 0 | 0 | 2 | — |
| `fashion-company-ecommerce/en: … (id 270)` | 17 | 3 | 0 | `project_subtitle`, `project_description`, `challenges[0-2]`, `solutions[0-3]`, `results[0-2]`, `images[0-4].foot_note` |
| `shamaniccas-ecommerce/en: … (id 224)` | 18 | 4 | 0 | `project_subtitle`, `project_description`, `challenges[0-2]`, `solutions[0-2]`, `results[0-2]`, `images[0-6].foot_note` |
| **`TOTAL:`** | **37** | **7** | **96** | |

Also expected:
- one `· raw shape` line per case, showing the `project_data` group keyed by sub-field key (A2);
- no `↺ copy-sync` and no media report (EN run);
- a `Cross-language probe (fr, es)` line with 16 entries, all with an ID (none `no-translation`);
- `Success: Dry run: nothing written.`

**Possible extra lines from the 2026-11-06 admin saves (spec §8), separate from the totals above:**

| Post | Possible extra `~ change` lines | Verdict |
|---|---|---|
| `services/en` (id 34; you saved row images) | up to **8**: `servicesServiceDetails.services[0..6].descriptionHtml` and `pageintrotext.introBodyHtml` | **Acceptable if only whitespace / markup normalization** (e.g. `<ul><li>` split onto lines, `\n` removed, `&nbsp;`), meaning the visible text is identical. Then the services line reads `N changes (0 appended rows), 57−N unchanged` and TOTAL reads `37+N changes (7 appended rows), 96−N unchanged`. |
| `home/en` (id 2; you saved the hero image) | **0**: `en.json` home holds only the 3 hero *text* fields (no wysiwyg), and a save does not re-format text inputs | Any `~ change` on home is **unexpected**: stop and send me the output. |
| any other `~ change` line | — | Unexpected: stop, don't run. |

The dry-run prints only 60 characters of the old and new values, which is not enough to judge "whitespace only". If any
services line appears, run read-only `wp post meta get 34 services_<i>_description_html` (or
`wp post meta get 34 intro_body_html`) for each such line and send me the output. I'll compare it with `en.json` before you
run step 4.

**Expected real run (step 4):**
- the same 7 `+ append` lines, then `wrote` lines for **6 fields** (+ the re-formatted services fields, if any):
  about-magneto `linkText` + `generalText`, and on each case `projectData` + `images`;
- every read-back line `ok`, including:
  - 7 lines marked `(appended)`;
  - `projectData.project_url (carried over)` on both cases;
  - `images[i].image (carried over)` and `images[i].ismobilescreenshot (carried over)` on every gallery row;
- `Cross-language probe before` = `after`;
- `Success: 6 field(s) written (37 changes, 7 appended rows), all read back ok.`

**Second dry-run (step 5):** `TOTAL: 0 changes (0 appended rows), 140 unchanged`. That is 133 values + the 7 appended items,
which now count as existing rows.

### Expected FR / ES dry-runs (`lang=fr dry-run`, `lang=es dry-run`)
*Written before the runs and kept as the record they were checked against. Both runs matched (see "FR run results" and "ES
run results").*

**How these were computed** (2026-11-07, after Mauricio's EN run and cache flush):
- I read every target and EN value with one read-only GraphQL query on `http://magneto-cms-2.local/graphql`: 6 pages and
  2 cases per language, including image `databaseId`s.
- A scratchpad script (`fres/sim.py`, not in the repo) replays the loader's plan rules against those values and `fr.json` /
  `es.json`:
  - scalar compare;
  - the D-1 B row rule, with appended rows counted separately;
  - group merge;
  - `service_group` and `displayOrder` copy-sync;
  - media lines in ACF sub-field order.
- The GraphQL data confirms the EN run landed: EN case rows are now 3/4/6 on both cases, matching the content rows, so no
  "content rows ≠ EN rows" abort is expected.

**Limits of the method:**
- GraphQL returns *formatted* WYSIWYG values. Every WYSIWYG value in the plan is a `~ change` (EN text → FR/ES text), so
  formatting cannot turn one into `unchanged`. Every `unchanged` below is a plain `text` / `select` / `number` value, where
  GraphQL equals the raw value, or an empty value (`null` and `''` compare equal in the loader).
- The media lines show attachment IDs **as GraphQL resolves them**. The `ok` verdict is backed by check-translations
  (`media WARN rows: 0`). If the stored target ID differs from what GraphQL returned, the line still reads `media ok`, with a
  different `target` number and the same `EN original` / `EN` numbers.

FR and ES have **the same structure**: the same values change and the same values stay unchanged, line for line (checked by
diffing the two simulations). Only the IDs and the text differ.

**Per-post totals (identical counts for FR and ES):**

| Totals line | FR id | ES id | Changes | Appended rows | Unchanged | The unchanged values |
|---|---:|---:|---:|---:|---:|---|
| `services/<lang>` | 637 | 646 | 36 | 0 | 27 | `services[0-6].ctaPath`, `.anchorId`, `.serviceGroup[]` (21); `services[3-6].ctaText` = `""` (4); `finalCtaSection.ctaPath` `""` and `.secondaryCtaPath` `/contact` (2) |
| `packages/<lang>` | 636 | 645 | 24 | 0 | 9 | `heroContent.ctaPath` `/contact`; `packages_elements[0-2].ctaPath`, `.anchorId` (6); `finalCtaSection.ctaPath` `/contact`, `.secondaryCtaPath` `""` |
| `home/<lang>` | 535 | 536 | 3 | 0 | 0 | — (the current hero still holds the `[FR TEST]` / `[ES TEST]` test values) |
| `about-magneto/<lang>` | 634 | 647 | 11 | 0 | 4 | `aboutData.ctaPath` `/contact`; `finalCtaSection.ctaPath`, `.secondaryCtaText`, `.secondaryCtaPath` (all `""`) |
| `projects/<lang>` | 558 | 644 | 3 | 0 | 0 | — (FR still `[FR TEST] Projects & Case Stu…`) |
| `contact/<lang>` | 635 | 643 | 2 | 0 | 0 | — |
| `fashion-company-ecommerce/<lang>` | 598 | 615 | 21 | 3 | 4 | `finalCtaSection.ctaPath`, `.secondaryCtaText`, `.secondaryCtaPath` (`""`); `projectsProjectData.displayOrder` (`10`) |
| `shamaniccas-ecommerce/<lang>` | 606 | 625 | 22 | 4 | 4 | same 3 final-CTA values; `displayOrder` (`20`) |
| **`TOTAL:`** | | | **122** | **7** | **48** | |

What the case changes are:
- **Dangel (21):** `project_subtitle`, `project_description`, `challenges[0-2]`, `solutions[0-3]`, `results[0-2]`,
  `cardDescription` (`""` → text), `images[0-4].footNote` (EN legacy caption → `""`, D-4), and the final CTA `title`,
  `subtitle`, `ctaText` (`""` → text).
- **Shamanicca (22):** the same set with `solutions[0-2]` and `images[0-6]`.

**Exactly these 7 `+ append` lines** in each run:
```
  + append fashion-company-ecommerce/fr project_data_results[3] item="Du contenu modifiable par le propriétaire, accompagné d'u…"
  + append fashion-company-ecommerce/fr project_data_results[4] item="Des outils de consentement aux témoins"
  + append fashion-company-ecommerce/fr project_data_results[5] item="La mesure des envois de formulaires et des clics sur les …"
  + append shamaniccas-ecommerce/fr project_data_solutions[3] item="Ajouter l'inscription à l'infolettre, un choix de consent…"
  + append shamaniccas-ecommerce/fr project_data_results[3] item="Une recherche commune aux produits et aux articles"
  + append shamaniccas-ecommerce/fr project_data_results[4] item="Une inscription à l'infolettre"
  + append shamaniccas-ecommerce/fr project_data_results[5] item="Un choix de consentement aux témoins et une politique de …"
```
```
  + append fashion-company-ecommerce/es project_data_results[3] item="Contenido editable por el propietario, acompañado de una …"
  + append fashion-company-ecommerce/es project_data_results[4] item="Controles de consentimiento para cookies."
  + append fashion-company-ecommerce/es project_data_results[5] item="Medición de envíos de formularios y clics en enlaces de r…"
  + append shamaniccas-ecommerce/es project_data_solutions[3] item="Incorporar la suscripción al boletín informativo, una opc…"
  + append shamaniccas-ecommerce/es project_data_results[3] item="Un buscador común para productos y artículos."
  + append shamaniccas-ecommerce/es project_data_results[4] item="Suscripción al boletín informativo."
  + append shamaniccas-ecommerce/es project_data_results[5] item="Opción de consentimiento para cookies y política de priva…"
```

**Exactly these 9 `↺ copy-sync` lines** in each run (`<lang>` = `fr` or `es`). Each is followed by `= unchanged`, because the
targets already hold the EN value:
```
  ↺ copy-sync  services/<lang> services[0].serviceGroup[] from EN "core"
  ↺ copy-sync  services/<lang> services[1].serviceGroup[] from EN "core"
  ↺ copy-sync  services/<lang> services[2].serviceGroup[] from EN "core"
  ↺ copy-sync  services/<lang> services[3].serviceGroup[] from EN "supporting"
  ↺ copy-sync  services/<lang> services[4].serviceGroup[] from EN "supporting"
  ↺ copy-sync  services/<lang> services[5].serviceGroup[] from EN "supporting"
  ↺ copy-sync  services/<lang> services[6].serviceGroup[] from EN "supporting"
  ↺ copy-sync  fashion-company-ecommerce/<lang> projectsProjectData.displayOrder from EN "10"
  ↺ copy-sync  shamaniccas-ecommerce/<lang> projectsProjectData.displayOrder from EN "20"
```

**Media report: 29 `media ok` lines and 0 `media WARN`** in each run. GraphQL returned the same IDs for FR, ES and EN:
```
Media report (read-only, never aborts):
  media ok   services/<lang> services[0].Image target 672 → EN original 672, EN 672
  media ok   services/<lang> services[0].icon target 76 → EN original 76, EN 76
  media ok   services/<lang> services[1].Image target 661 → EN original 661, EN 661
  media ok   services/<lang> services[1].icon target 71 → EN original 71, EN 71
  media ok   services/<lang> services[2].Image target 675 → EN original 675, EN 675
  media ok   services/<lang> services[2].icon target 99 → EN original 99, EN 99
  media ok   services/<lang> services[3].Image target 0 → EN original 0, EN 0
  media ok   services/<lang> services[3].icon target 103 → EN original 103, EN 103
  media ok   services/<lang> services[4].Image target 0 → EN original 0, EN 0
  media ok   services/<lang> services[4].icon target 84 → EN original 84, EN 84
  media ok   services/<lang> services[5].Image target 0 → EN original 0, EN 0
  media ok   services/<lang> services[5].icon target 156 → EN original 156, EN 156
  media ok   services/<lang> services[6].Image target 0 → EN original 0, EN 0
  media ok   services/<lang> services[6].icon target 478 → EN original 478, EN 478
  media ok   packages/<lang> packages_elements[0].icon target 395 → EN original 395, EN 395
  media ok   packages/<lang> packages_elements[1].icon target 392 → EN original 392, EN 392
  media ok   packages/<lang> packages_elements[2].icon target 389 → EN original 389, EN 389
  media ok   fashion-company-ecommerce/<lang> images[0].image target 620 → EN original 620, EN 620
  media ok   fashion-company-ecommerce/<lang> images[1].image target 621 → EN original 621, EN 621
  media ok   fashion-company-ecommerce/<lang> images[2].image target 622 → EN original 622, EN 622
  media ok   fashion-company-ecommerce/<lang> images[3].image target 624 → EN original 624, EN 624
  media ok   fashion-company-ecommerce/<lang> images[4].image target 619 → EN original 619, EN 619
  media ok   shamaniccas-ecommerce/<lang> images[0].image target 627 → EN original 627, EN 627
  media ok   shamaniccas-ecommerce/<lang> images[1].image target 628 → EN original 628, EN 628
  media ok   shamaniccas-ecommerce/<lang> images[2].image target 633 → EN original 633, EN 633
  media ok   shamaniccas-ecommerce/<lang> images[3].image target 629 → EN original 629, EN 629
  media ok   shamaniccas-ecommerce/<lang> images[4].image target 630 → EN original 630, EN 630
  media ok   shamaniccas-ecommerce/<lang> images[5].image target 631 → EN original 631, EN 631
  media ok   shamaniccas-ecommerce/<lang> images[6].image target 632 → EN original 632, EN 632
```
Gallery IDs are listed in row order, as GraphQL returns them (Dangel row 3 = 624, row 4 = 619). A `media WARN` line in either run blocks
the real run (§6).

**Also expected in each dry-run:**
- 2 `· raw shape` lines (one per case);
- a `Cross-language probe (en, es)` line for FR, or `(en, fr)` for ES, with 16 entries and none `no-translation`;
- `Success: Dry run: nothing written.`
- **No** `+ append` outside the 7 lines above. In particular, there must be none on `images`, `services` or
  `packages_elements`: the image-sub-field repeaters abort instead of growing.

**If a dry-run matches, the real run should then show** (for planning; not a command list):
- **54 field(s) written per language:**
  - services 13 (every field except the two unchanged final-CTA paths);
  - packages 10;
  - home 3;
  - about-magneto 11;
  - projects 3;
  - contact 2;
  - 6 per case: `projectData`, `cardDescription`, `images`, and the final-CTA `title` / `subtitle` / `ctaText`.
  
  `displayOrder` is not written, because it is unchanged.
- `Success: 54 field(s) written (122 changes, 7 appended rows), all read back ok.`
- 7 `(appended)` read-back lines, and the probe equal before and after.
- After `wp cache flush`, the second dry-run prints `TOTAL: 0 changes (0 appended rows), 177 unchanged` (122 + 48 + 7). That
  matches the stub run's 177.

Any other count, or any `~ change` on a value listed as unchanged above: stop and send me the full output.

AC-3's real wrong-sha check (Mauricio; **done 2026-11-07 21:41 ET**, aborted as expected, see "Acceptance criteria status"). It is a dry-run, so it needs no backup, and it must abort in
preflight:
```bash
sed 's/"sha256": "f52c/"sha256": "0000/' <repo>/scripts/phase-5c/content/fr.json > ~/Documents/projects/magneto/backups/phase-5c/fr-badsha.json
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=fr content=$HOME/Documents/projects/magneto/backups/phase-5c/fr-badsha.json dry-run
# expected: Error: Aborted before any write: source.sha256 does not match docs/content/magneto-copy-fr-CA.md (…)
```

## AC-3 guard proofs (stub harness)
The harness lives in the scratchpad, not in the repo (Mauricio's condition 4).
- `stubs.php`: in-memory WP / ACF / WPML / WP-CLI, using the **real ACF definitions** from
  `docs/acf/phase-5-field-groups.json`, a postmeta store and a write log. `update_field` appends to the log.
- `run.php`: the guard cases.
- `run_full.php`: the real content files, end to end.

Commands:
```bash
P="$HOME/Library/Application Support/Local/lightning-services/php-8.2.30+1/bin/darwin-arm64/bin/php"
"$P" -l scripts/phase-5c/load-content.php            # No syntax errors detected
"$P" -l scripts/phase-5c/check-translations.php      # No syntax errors detected
REPO=<repo> "$P" <scratchpad>/harness/run.php        # exit 0
REPO=<repo> "$P" <scratchpad>/harness/run_full.php
```

`run.php` output: every case aborts in preflight with `writes=0` (messages trimmed):
```
PROOF  wrong host                                    writes=0  home_url() is https://cms.magnetomarketing.co, expected http://magneto-cms-2.local. This loader is local only.
PROOF  missing backup (real run)                     writes=0  a real run needs backup=<path …> (or pass dry-run).
PROOF  stale backup (4 h)                            writes=0  backup is older than 3 hours (4 h): …/stale.sql
PROOF  sha mismatch                                  writes=0  source.sha256 does not match docs/content/magneto-copy-fr-CA.md (…)
PROOF  lang missing                                  writes=0  lang=en|fr|es is required (one language per run).
PROOF  lang ≠ source.file language                   writes=0  lang=es but source.file is docs/content/magneto-copy-fr-CA.md (expected …-es.md).
PROOF  lang ≠ post lang                              writes=0  lang=fr but project/fashion-company-ecommerce has lang es.
PROOF  missing translation                           writes=0  project/fashion-company-ecommerce/fr (checklist row #10): no fr translation of EN 270.
PROOF  translation not detached                      writes=0  … (checklist row #10): post 598 is still a WPML duplicate — click 'Translate independently'.
PROOF  slug ≠ EN                                     writes=0  … (checklist row #10): post 598 slug is 'fashion-company-ecommerce-2', expected the EN slug.
PROOF  wrong language                                writes=0  … (checklist row #10): post 598 has WPML language 'es'.
PROOF  status ≠ publish                              writes=0  … (checklist row #10): post 598 status is draft, expected publish.
PROOF  target rows > EN                              writes=0  fashion-company-ecommerce/fr project_data_results: target has 7 rows, more than EN (6); rows are never removed.
PROOF  content rows ≠ EN rows (FR before EN parity)  writes=0  … project_data_results: content has 6 rows, EN has 3 (content rows must equal EN rows; run lang=en first).
PROOF  growth on a repeater with an image sub-field  writes=0  fashion-company-ecommerce/fr images: would grow 4 → 5, but the repeater has an image sub-field (amendment 3).
PROOF  EN: two entries set the same key              writes=0  project/fashion-company-ecommerce/en: field_689bb68e09f8a (projectsProjectData.projectData) is set by two entries.
PROOF  FR: duplicate type+slug entries               writes=0  project/fashion-company-ecommerce/fr appears twice; duplicate entries are allowed only in en.json.
PROOF  forbidden key in content (cta_link_hero)      writes=0  heroContent.ctaLinkHero: key field_689a2e2960322 (text) may not be in a content file.
```

Positive cases (`run.php`):
```
EN, two entries for one post (different keys) → one plan, one totals line, 3 appends:
  + append fashion-company-ecommerce/en project_data_results[3] item="EN result 3"   (… [4], [5])
  fashion-company-ecommerce/en: 9 changes (3 appended rows), 0 unchanged (id 270)
EN run: 2 field(s) written (9 changes, 3 appended rows), all read back ok · second dry-run: 0 changes (0 appended rows), 12 unchanged
FR dry-run: 3 "+ append … project_data_results[3..5]" lines; "fashion-company-ecommerce/fr: 9 changes (3 appended rows), 1 unchanged";
  ↺ copy-sync displayOrder from EN "10"; 5 × "media ok images[i].image"; writes 0
FR real run: every read-back ok; results[3..5].item (appended); images[i].image and ismobilescreenshot (carried over);
  project_url, project_description, challenges, solutions (carried over); probe before == after; EN 270 and ES 615 meta byte-equal
FR second dry-run: fashion-company-ecommerce/fr: 0 changes (0 appended rows), 13 unchanged · re-run: Nothing to write
Negative probe (a stub update_field that also writes ES 615): ABORT · "FAIL values of en/es posts changed" · exit non-zero
```

`run_full.php` runs the **real** `en.json` → `fr.json` → `es.json` against a stub CMS seeded with the local IDs and row counts
(legacy text). Each language: dry-run with exactly 7 `+ append` lines, then a real run (`all read back ok`, 7 `(appended)`),
then a second dry-run with `0 changes (0 appended rows)` (EN 140 / FR 177 / ES 177 unchanged). about-magneto/en prints one
totals line. This run found one read-back defect, which is fixed: carried-over nested repeaters
(`packages_elements_N_features`, stored in meta as a row count) were compared against the raw row array. The leaf walker now
recurses into nested repeaters and groups.

## AC-1: what the structural test compares (Mauricio's condition 2)
`content.test.ts`, block "content files across languages":
- **FR vs ES (every post):** identical field-key lists, and an identical `shape()` per field. `shape()` covers:
  - row count;
  - the sorted sub-key set of every row (nested group repeaters included);
  - the values of the structural keys `*_cta_path`, `*_anchor_id`, `*_service_group` and `hero_cta_path`.
  
  Copy text is not compared.
- **EN vs FR/ES:** for **every field EN has**, the FR and ES field with the same key exists and has the same `shape()`. For
  about-magneto and the cases, the EN fields are the union of the rev 2 entry and the appended D-2 entry:
  - about-magneto: the 3 hero fields, `sectionTitle`, `linkText`, `generalText`;
  - cases: the `project_data` group (subtitle, description, challenges 3, and solutions and results 4/6 for Shamanicca and
    3/4/6 for Dangel), and `images` with 5 / 7 rows of `{foot_note}`.
- **Fields FR/ES have and EN lacks are not compared.** A separate test asserts they are **only** the 5c-rest item 3 set:
  - About `description_html`, `about_cta_text`, `about_cta_path`;
  - `card_description`;
  - the six final-CTA fields.
  
  EN is not forced to gain them. The same test asserts that the EN entries for one post set no key twice and that every EN
  key is loaded in FR.
- Per language: pins and `source.file`; verbatim check (links → text, FR `**CTA : X**` / ES `**CTA: X**` handled, final-CTA
  subtitle paragraphs joined); a one-word mutation fails; the forbidden-key check against the ACF export (image / url /
  true_false, `cta_link_hero`, `display_order`); main CTA labels; and the Services / Packages structure checks of rev 2.

## Acceptance criteria status (final, 2026-11-09)
| AC | Status | What is still missing | Who |
|---|---|---|---|
| AC-1 content tests | **Done** | — | — |
| AC-2 gate | **Done**: lint at the ceiling (88 / 94), typecheck and tests (577) re-run 2026-11-09; build 2026-11-07, including the `en,fr,es` AC-8 build | — | — |
| AC-3 guard proofs | **Done** | The real wrong-sha check ran 2026-11-07 21:41 ET (Mauricio). Output: `Error: Aborted before any write: source.sha256 does not match docs/content/magneto-copy-fr-CA.md (content: /Users/maubayuelo/Documents/projects/magneto/backups/phase-5c/fr-badsha.json).` The test file stays in `backups/`, outside the repo. | — |
| AC-4 read-only checker | **Done**, with summaries only | Optional: paste the full final output (after ES). | Mauricio (optional) |
| AC-5 runs | **Done**, with summaries only | Optional: paste the output tails of each run. | Mauricio (optional) |
| AC-6 media | **Done** | See "AC-6 / AC-7 GraphQL read-back". | — |
| AC-7 GraphQL read-back | **Done** | See "AC-6 / AC-7 GraphQL read-back". | — |
| AC-8 rendering | **Done**: Mauricio approved FR and ES on 2026-11-09 ("no transcription or loading errors") | The findings outside scope, including the 15 px caption gap, are routed (see "AC-8 findings (routed)"). | — |
| AC-9 EN unchanged | **Done** (option A): the fresh `lang=en dry-run` on 2026-11-08 (Mauricio) printed `TOTAL: 0 changes (0 appended rows), 140 unchanged` | — | — |
| AC-10 prerender per locale | **Done** | See "AC-10". The AGENTS.md Known-debt line is outside the Dev's files: the Architect or Mauricio updates it when the phase closes. | Architect / Mauricio |
| AC-11 report | **Done** (this report, final 2026-11-09) | — | — |
| AC-12 Sat 11-14 EN media save | **Open (scheduled)** | Follow the §8 rules and follow-up, then the Dev's GraphQL comparison and the addendum. | Mauricio, then Dev |

**D-8 A titles: done.** Mauricio set them on 2026-11-05, before any load: 535 "Accueil", 536 "Inicio", 558 "Réalisations".
He verified them with WP-CLI that day. The AC-7 GraphQL read-back confirms the three titles. No admin change was needed.

### AC-6 / AC-7 GraphQL read-back (Dev, read-only, 2026-11-07 after the ES run)
Method:
- One read-only query on `http://magneto-cms-2.local/graphql`: `pages` / `projects` with `where: { language }`, for EN, FR
  and ES.
- Two scratchpad scripts, not in the repo:
  - `readback.py` compares every value in `en.json` / `fr.json` / `es.json` with the CMS as visible text (tags removed,
    entities decoded, typographic quotes folded, whitespace collapsed);
  - `structure.py` checks structure and media with `resolveOriginalMedia` semantics (a non-EN media node takes the EN
    translation's `sourceUrl`).

Results:
- **Values: 490 compared (EN + FR + ES content files), 0 differ.** This covers the 13 checklist posts plus FR/ES home and
  FR/ES projects (heroes).
- **Structure and media: 106 checks ok, 0 FAIL.** For each of the 16 FR/ES posts (6 pages + 2 cases per language):
  - status `publish`;
  - row counts = EN: services 7, `packagesElements` 3, `sections` 2, cases 3/4/6, images 5 / 7;
  - media slots = EN, and every image `sourceUrl` = EN's: **90 slots** across heroes, background images, services
    `image` / `icon`, packages `icon` and galleries;
  - `ctaLinkHero` = EN;
  - `heroContent.ctaPath` = `/contact` on Packages only;
  - `serviceGroup` = EN (core ×3, supporting ×4).
  
  On the cases also:
  - `displayOrder` 10 / 20;
  - `projectUrl` = EN (`https://dangelwellness.ca/` on 598 / 615, `https://shamanicca.com/` on 606 / 625);
  - `ismobilescreenshot` = EN.
- **Titles:**
  - FR: 637 Services, 636 Forfaits, 634 À propos, 635 Contact, 598 Dangel Wellness, 606 Shamanicca, 535 Accueil, 558
    Réalisations;
  - ES: 646 Servicios, 645 Paquetes, 647 Sobre Magneto, 643 Contacto, 644 Proyectos, 615 Dangel Wellness, 625 Shamanicca,
    536 Inicio.
  
  All equal §5 / D-8.
- Not in scope, for the record: Trépied FR 550 / ES 541 still carry `[FR TEST]` / `[ES TEST]` titles (5c-rest item 1, R-8).
  Home `ctaLinkHero` is `magnetomarketing/free-strategy-call` and the other pages use `mauriciobayuelo/free-discovery-call`
  (Known debt, two Calendly events), identical in EN/FR/ES.

### AC-10
- Build:
  - `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:build` (2026-11-07, after the ES run): exit 0,
    `Generating static pages (32/32)`.
  - Stdout lists `/[locale]/projects/[slug]` with `/en/projects/{fashion-company-ecommerce,shamaniccas-ecommerce,trepied-trepied-ca}`
    and `[+6 more paths]`. Next collapses the list.
- `.next/server/app/fr/projects/` and `.next/server/app/es/projects/` each hold `fashion-company-ecommerce.html`,
  `shamaniccas-ecommerce.html` and `trepied-trepied-ca.html`. These are the 6 collapsed paths.
- **Every locale now prerenders its project pages**, so the Known-debt condition ("if any locale has 0 projects, no project
  pages prerender") no longer applies locally.

### AC-8 results (Dev, port 3100, 2026-11-07)
**Setup:**
- Mauricio stopped his dev server on 3000. The gate script checked that ports 3000 and 3100 were free and that no Next
  process was using this checkout.
- Build as in AC-10, then `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:start` on port 3100.
- `.env.local` was neither read nor edited: the env was passed on the command line.
- Processes I started, all stopped afterwards by PID (ports 3100 and 9333 free afterwards):
  - npm 12405, agent-gate 12419, next-server 12463;
  - headless Chrome instances 13260, 13501 and 13734, each with a private profile in the scratchpad.

**First responses were stale (finding):**
- The first request to each route served data from **before the loads**. For example, `/fr/projects` showed
  "[FR TEST] Projects & Case Studies", and FR Dangel showed the EN legacy body.
- Cause: `next build` reused `.next/cache/fetch-cache` (167 entries) from earlier builds. The pages revalidate every 60 s,
  so the first hit returned the cached render and regenerated it in the background.
- After one request per route, a second fetch (`x-nextjs-cache: HIT`) returned the loaded content. Every result below
  comes from that second fetch. The first, stale capture is kept in the scratchpad (`ssr-first-stale/`).
- Consequence for release and QA: after a CMS load, verify on a fresh render, not the first response.

**Routes:**
- **All 200 with the right `lang`.** The spec's 13 routes (`/{fr,es}/{services,packages,about-magneto,contact}`,
  `/es/projects`, `/{fr,es}/projects/{fashion-company-ecommerce,shamaniccas-ecommerce}`) plus `/fr/projects`, which makes
  14: FR pages have `lang="fr-CA"`, ES pages `lang="es"`.
- `/fr`, `/es` and the 8 EN routes also return 200.

**Sentinel scan:**
- The list is **30 EN strings from `en.json`**, in `evidence/sentinel2.out`. Each one is the first 7 words of an EN
  value, and **each was checked to be present on its own EN route**:
  - services 9, packages 6, about-magneto 3 (hero title and subtitle, `generalText`), projects 1, contact 1;
  - Dangel 5 and Shamanicca 5 (case bodies and lists).
- Region scanned: the page content between `</header>` and `<footer>`, because the app renders **no `<main>` element**
  (see Issues).
- **Result: 0 hits on all 14 FR/ES routes.**
- Informational scan of known legacy / test strings: only on `/fr/projects` and `/es/projects`:
  - "Ready to stop guessing" and "Get Your Free Strategy Call": the FR/ES home final-CTA fallback, the spec's exclusion
    (R-9, E15);
  - `[FR TEST]` / `[ES TEST]`: the Trépied card title (R-8, 5c-rest item 1).

**Screenshots:**
- Taken with headless Chrome over the DevTools protocol (no new dependency), as full pages. Pages taller than 4000 px are
  split into `_partN` tiles.
- **78 PNG files** = 16 routes × 375 / 768 / 1440, in **`/Users/maubayuelo/Documents/projects/magneto/qa/phase-5c-ac8/`**
  (outside the repo):
  - `fr/`: services, packages, about-magneto, contact, projects, and both cases;
  - `es/`: the same 7 routes;
  - `en/`: both cases, for the gallery check;
  - `measurements.json` (per shot: `lang`, width, height, overflow, captions, gaps);
  - `evidence/`: the sentinel output, the gap comparison, the AC-10 build lines, and the EN SSR text capture for AC-9.
- File name = `<route>_<width>[_partN].png`. Example: `fr/projects_shamaniccas-ecommerce_1440_part2.png`.
- **No horizontal scroll** at any width (`scrollWidth` = `clientWidth` on all 48 page/width combinations), and **0 broken
  images**.
- I looked at one shot myself (`fr/services_375_part1.png`): FR hero, intro, BUILD and FIX rows, FR labels and buttons,
  layout intact. The rest is for Mauricio's review.

**Gallery spacing with empty captions (D-4, E16):**
- Measured in the browser: every caption `<p>` is empty, with height 0 and `margin-top: 15px`.
- Then, in the headless tab only (no `src` change), I hid the `<p>` (`display: none`) and measured again (`evidence/gapcmp.out`):

| Width | Image → image gap with the empty `<p>` | Without the `<p>` | Last image → "View live site" (with / without) |
|---|---:|---:|---:|
| 375 | 30 px | 15 px | 40 / 25 px |
| 768 | 30 px | 15 px | 40 / 25 px |
| 1440 | 45 px (Shamanicca rows 5–6: 90 / 135, mobile-stage rows) | 30 px (75 / 120) | 60 / 45 px (Shamanicca 105 / 90) |

- **The empty `<p>` adds 15 px to every gap.** That doubles the gap on mobile and tablet. It is identical in EN, FR and ES,
  because all three have empty captions (D-4).
- Whether that looks wrong is Mauricio's call. If it does, it becomes a follow-up for a `src` spec, rendering the `<p>`
  only when `footNote` is non-empty. No `src` change in this phase.

**Approval (Mauricio, 2026-11-09):** FR ok, ES ok for 5c content: no transcription or loading errors. The gap goes to the
design round (below).

### AC-8 findings (routed)
Mauricio's visual review (2026-11-09) found the items below. All are **outside 5c's scope**, and none is fixed in this
phase. Each one is routed to the slot named.

| Slot | Finding |
|---|---|
| **Design round, Fri 11-13** | CTA labels wrap to 2 lines on phone in FR/ES: hero, final CTA, Packages final CTA |
| | Weak typographic hierarchy: eyebrow / subtitle / body / form text |
| | Packages cards: 1 column at tablet width, in all locales |
| | Services outline button proportions |
| | Empty-caption gallery gap: +15 px per gap (D-4, E16; measured above) |
| | Missing `<main>` landmark (see Issues) |
| **UI dictionary fill, Wed 11-11** | Footer "Based in Montreal \| Serving clients worldwide" still in EN on FR/ES |
| | `[FR TODO]` / `[ES TODO]` "← Back to Projects" on the case pages |
| **5c-rest, week of 11-16** | Trépied `[FR TEST]` / `[ES TEST]` card (item 1, R-8) |
| | EN legacy final CTA on `/fr/projects` and `/es/projects` (items 2 and 4, R-9) |
| **Post-launch** | Redesign of the grey info boxes below Packages |
| **Release-day runbook** | Validate a fresh render after any content load (the stale 60 s cache finding above) |

### AC-9: option A (approved by Mauricio, 2026-11-07)
Evidence that EN is unchanged by the FR and ES runs:
1. **Probes.** The EN hashes are identical in the FR dry-run probe and in the ES dry-run probe. Examples:
   - `page/services/en 34:92:caed9343f30979f2`;
   - `project 270:44:2ded72f970ec4ef0`;
   - `224:50:bad3445cdb13e9a0`.
   
   Each real run's probe was before == after.
2. **The loader writes nothing else on EN posts:** no titles, options or other posts (§3.8).
3. **Current EN capture** (Dev, port 3100, fresh render, `evidence/en-capture.txt`): `/`, `/services`, `/packages`,
   `/contact`, `/projects`, `/about-magneto` and both cases.
   - All return 200 with `lang="en"`, and contain no FR/ES text and no legacy body.
   - Content hashes (sha256, first 16 hex): `/` 18e15dd41b49ffd2 · `/services` 680b9682d2b833fd · `/packages`
     00db346464633aeb · `/contact` f50acbefffc0b4fa · `/projects` 2179a69c0c29b62e · `/about-magneto` c1bcb13993aa69e1 ·
     Dangel 236c7a9d433158dd · Shamanicca 84f08a2b0b75238f.
   - The 30 sentinels are present on their EN routes, and the AC-7 values show EN = `en.json` (D-2 included). EN About
     and the cases therefore changed only as D-2 says.
4. **Fresh EN dry-run (Mauricio, 2026-11-08):** `TOTAL: 0 changes (0 appended rows), 140 unchanged`. Command:
   ```bash
   wp eval-file /Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL/scripts/phase-5c/load-content.php lang=en dry-run
   ```

**AC-9 closed.**

### What is left
- **Sat 11-14:** AC-12 (§8 EN media save + follow-up, Mauricio), then the Dev's GraphQL comparison and the addendum
  (`docs(report): phase 5c Sat 11-14 EN media save addendum`).
- **Optional:** the output tails for AC-4 / AC-5 (Mauricio).

## Deviations from the spec
- **FR/ES runs on Sat 11-07 evening, not Tue 11-10** (the calendar is an estimate; the checkpoint passed first).
- **Copy source `637fba7` instead of `ffec355`** (Mauricio's instruction). `src` refs are line numbers at `637fba7`.
- **`.env.local` not read** (Mauricio's instruction). See the Gate notes.
- **Loader extras, all abort-only and covered by the harness:**
  - Mauricio's condition 1: same-slug merging, the overlap abort, and duplicates only in EN;
  - a preflight abort when a content file holds an image / url / true_false key, `cta_link_hero` or `display_order`
    (the test enforces the same rule).
- **Copy-sync `service_group`:** FR/ES rows keep the sub-key, so the sub-key sets equal EN (AC-1). The loader **writes EN's
  value** and aborts if the content file disagrees. `display_order` is in no content file; the loader adds it for FR/ES
  projects from EN.
- **Media WARN in `check-translations.php` is informational:** a WARN doesn't fail a row's PASS. It is printed, and
  `media WARN rows: N` is summed at the end. §6 still blocks a real run on any `media WARN`.
- **Cross-language probe granularity:** it hashes every postmeta key equal to, or prefixed by, a touched field's meta name
  (superset of "every touched key", e.g. `title` also covers `title_*`).
- **`content.test.ts` threshold:** `copyValues > 95` (EN) / `> 100` (FR/ES), instead of rev 2's `> 80`.
- **AC-9 by option A** (approved by Mauricio, 2026-11-07), not a before/after SSR diff. No EN capture existed before the FR
  run. The evidence is the probes, a fresh EN capture and a 0-change EN dry-run (see "AC-9: option A").
- **AC-8 sentinel region:** the content between `</header>` and `<footer>`, not `<main>`, because the app has no `<main>`.
  The route count is 14 = the spec's 13 + `/fr/projects` (the spec's list adds up to 13).
- **AC-8 screenshots** come from headless Chrome over the DevTools protocol, not the Chrome extension. Pages taller than
  4000 px are saved as tiles.

## Issues found (not fixed)
- **Lint is exactly at the 88 / 94 ceiling.** This phase adds nothing. Any future error elsewhere breaks the ceiling.
- **A5 / E13 still unobserved** (Sat 11-14, AC-12).
- **No `<main>` landmark on any page** (new, accessibility). The SSR has `<header>`, `<section>`s and `<footer>`, but no
  `<main>` element and no `role="main"`. That breaks the "semantic HTML" release requirement and skip-to-content
  navigation for screen readers. It needs a `src` change in the layout or the pages, so it belongs to a later spec, with
  the launch a11y QA.
- **A reused `.next` serves pre-load CMS data on the first request after a build** (new, verification method). `next build`
  reused `.next/cache/fetch-cache`, and the first response of each ISR route (60 s) was the old render. The second
  response was correct. Any post-load check (local, or on a Vercel build that restores its cache) must use a fresh render.
  This is a note for the release-day runbook, not a code change.
- **Empty caption `<p>` adds 15 px per gallery gap** (D-4 / E16, measured). See AC-8. Mauricio decides whether it becomes
  a `src` follow-up.
- ES Dangel (615) held Shamanicca legacy text before the ES run. **Resolved:** the loaded fields are overwritten, and AC-7
  shows `projectUrl`, images and `ismobilescreenshot` equal to EN 270.
- **No `fr-after` backup.** `es-before_20261107-2121.sql` is the state after FR. This isn't a problem, but rolling back
  only ES means importing that file.
- **ES Dangel captions:** the export's ES caption block has 6 captions plus an italic 7th-slot instruction (577). It doesn't
  matter under D-4 (captions empty).
- The FR export's Dangel/Shamanicca "Voir le site" CTA lines use `**CTA : Voir **[**…**](…)`. They are not loaded (the loader
  never writes `project_url`, and there's no field for the label), so nothing to do; noted for whoever wires that label.

## Proposed commits (not made; everything is unstaged)
Four commits, in this order. Each one leaves the gate green.

1. `feat(phase-5c): loader lang=en|fr|es with FR/ES targets, D-1 B row appends, group merge, copy-sync and cross-language probe`
   - `scripts/phase-5c/load-content.php`
2. `feat(phase-5c): read-only check-translations.php for the 13-post checklist`
   - `scripts/phase-5c/check-translations.php`
3. `feat(phase-5c): EN parity, FR-CA and ES content from the 637fba7 export, with three-language content tests`
   - `scripts/phase-5c/content/en.json`, `content/fr.json`, `content/es.json`, `scripts/phase-5c/content.test.ts`
   - **Why one commit and not three:** the test on `master` pins `en.json` to `ffec355` and expects exactly the 6 rev 2
     posts (`content.test.ts:76-78` on `master`). The appended `en.json` would therefore fail it on its own. The new test in
     turn needs `fr.json` / `es.json`. Splitting them leaves a red commit in the middle.
   - If you prefer the split anyway: `feat(phase-5c): EN parity content (append-only)`, then
     `feat(phase-5c): fr.json and es.json`, then `test(phase-5c): content checks for EN/FR/ES`. The first two would then be
     red on `npm test`.
4. `docs(report): phase 5c loader runs (EN parity, FR, ES) and verification (AC-3, AC-6 … AC-10)`
   - `docs/reports/phase-5c-loader.md`
   - The screenshots stay outside the repo (`magneto/qa/phase-5c-ac8/`, 61 MB) and are not committed.

Later, separate: `docs(report): phase 5c Sat 11-14 EN media save addendum` (AC-12).

Every message ends with the attribution line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Time
Agent time, all estimated:
- implementation: about one session (not measured);
- run report update: about 0.5 h;
- verification (AC-6, AC-7, AC-8, AC-10, the AC-9 capture, and this report): about 1.5 h, including the screenshot
  tooling retries;
- final gate re-run and report (2026-11-09): about 0.3 h.

Mauricio's checklist (2026-11-05/06) is not counted here. Mauricio's runs on 2026-11-07, from the backup timestamps:
- EN parity: about 20:31–20:48;
- FR: from 21:11;
- ES: 21:21–21:24.

The FR and ES windows run together, so the total is about 35–40 min of active time (estimated).
