# Phase 5a report — Production ACF import (runbook)

- Spec: `docs/specs/phase-5a-production-acf-runbook.md` rev 4 (branch `spec/phase-5a-runbook` @ `f45eba5`, sha256
  `84afa859…c0371`; approved by Mauricio + Senior Architect, D-b extension and the 0.8 table confirmed)
- Author: Dev (read-only production access, D-a) · Executed by: Mauricio · Date: 2026-10-29
- Frontend: `feat/phase-5a` @ `8d2d313` (import file committed in `58a9df1`)
- Raw evidence (outside the repo): `~/Documents/projects/magneto/backups/phase-5a-prod/` (`$RB`). It holds `notes.md`
  (timed log) and every capture file named below.

## Result
Done. Production WordPress (`cms.magnetomarketing.co`) now has the Phase 5 ACF schema: 14 field groups, imported from the
same reviewed file as local (`docs/acf/phase-5-field-groups.json`, sha256 `36ca235f…e842cd4`).
- The ACFML dump equals local's: 121 lines, `IDENTICAL`.
- Production's before → after change equals local's: 0 removed / 36 added.
- Introspection: 38/38.
- The live frontend's EN GraphQL responses are byte-identical before and after (`bdabf4a1…ac1c1f88`, 31 queries).

The 5a PR preview passed AC-23. Mauricio approved AC-24 (1440 / 768 / 375). Step 0.8 found nothing that blocks the 5a
promote.

## Changes
- `docs/reports/phase-5a-production-acf-runbook.md`: this report.
- `docs/ai/WP-SETUP.md`: production section "Phase 5a ACF import" and the "(prod)" change-log rows for this run.
- No code changes. Neither file is staged (Mauricio's instruction).
- Production WordPress was changed by Mauricio only:
  - step 3, the import (WP admin);
  - step 6.1, `wp cache flush` (SSH);
  - step 6.2, the SiteGround Dynamic Cache flush.
  The Dev made no writes.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | not run | docs-only change; no `src/` file touched |
| typecheck | not run | same |
| tests | not run | same |
| build | not run locally | the 5a PR Vercel preview built from `8d2d313` (Mauricio's build log: compiled, types OK, 14/14 static pages, EN only prerendered, 3 project pages) |
| visual (routes · viewports · locales) | passed | AC-23 on the preview (10 URLs). AC-24: 7 routes at 1440 / 768 / 375, EN only (FR/ES not enabled on the preview), approved by Mauricio |

### Acceptance criteria
| Criterion | Result |
|---|---|
| P1: diff exit 0 with 36 / 0 / 10 / 0; `about_cta_*` and `hero_cta_path` added; duplicate-name section `(none)` for both files; negative test fails on `cta_path` page 32; before hash = E1; three hashes recorded | **Pass, with a cosmetic deviation** (D-1) |
| P0b: amended JSON imported locally; re-export = amended JSON; `HeroContent.ctaPath` local | **Pass**: re-export copy `backups/phase-5a/acf-export-local-p0b-2026-10-29.json` (sha256 `8f9f1652…6802babe`); diff: Added/Removed/Changed 0, only the 2 known export reorders; local schema 38/38 |
| P3: local dump 121 lines, sha256 recorded; no `ORPHAN … cta_path` on 32; `4.2-local.diff` 0 / 36, sha256 recorded | **Pass**: dump `3cc47ce0…aa9050b82`; 32 has `OWN cta_path=(empty)`; diff `78747fb5…5fc499` |
| 0.1: artifacts committed, hashes = `P1-hashes.txt` | **Pass** |
| 0.2: production frontend commit = Appendix A's | **Pass**: Production (Current) = `55d4350` |
| 0.3: siteurl `cms.magnetomarketing.co`; plugin versions = A2 | **Pass**: A2 plugins at A2 versions. siteurl uses `http://` (I-3) |
| 0.3b: ACF PRO license active | **Pass**: Active, Lifetime – Developer; 6.8.10 = latest |
| 0.4b: production dump = `phase-3b/acfml-local.txt` | **Pass**: `IDENTICAL` |
| 0.6: 13 → 13, CPT excluded both sides, 0 / 0 / 0 / 0 | **Pass** |
| 0.7: `equal (ignoring modified): true` | **Pass** |
| 0.8: home `title`, `subtitle`, `prefooter_cta_text` present; every row listed and classified; promote blockers escalated | **Pass**: 15 rows below; 0 promote blockers |
| Two backups before step 3 | **Pass**: SiteGround 18:06 + dump 18:26 (`Dump completed on 2026-10-29 22:26:46`) |
| Step 2: two identical before-captures (31 requests) | **Pass** |
| Step 3: "Imported 14 items"; 14 groups, no duplicates | **Pass**: screenshot `3-imported-14-items.png` (D-6) |
| Step 4.1 `IDENTICAL`; 4.2 `IDENTICAL` (0 removed, 36 added) | **Pass**: no `pref=` fixes needed |
| Step 5: 38/38 (0.9 fewer) | **Pass**: 1/38 → 38/38 |
| Step 7.1 `IDENTICAL`; 7.2 7 × 200 + 404; visual unchanged | **Pass**: the 7.1 of record is 19:02, after 6.2 (D-3) |
| After backup (step 8) | **Pass**: 19:09 |
| Dev production access read-only; every command listed | **Pass**: see "Commands run against production" |

## Evidence

### Hashes and files of record
| Item | Value |
|---|---|
| `docs/acf/phase-5-before.json` | `0477e8c9…f8ed201` (= E1); byte-identical to the production export `acf-prod-before.json` (0.5, 87,764 B) |
| `docs/acf/phase-5-field-groups.json` (imported) | `36ca235f3d0c919fc53781400a5f4dca6e28e44e91edf83c731ba9163e842cd4` |
| `scripts/phase-5a/acf-json-diff.mjs` | `ccc572eb0bcb93241accf08597d22796a2ea1a09bb9e6b711d0fd0cb859a4644` |
| Local ACFML dump after (`acfml-local-after.txt`, 121 lines) | `3cc47ce02fd558f988e50c92e8b975c06ffb219d60156d26ec80798aa9050b82` |
| `4.2-local.diff` (0 removed / 36 added) | `78747fb55e95f8742445258baca959ed14c4bd831d865c1ab1c8ebe63d5fc499` |
| Production dump before (`0.4-acfml-prod-before.txt`, 85 lines, 13 groups) | `224107b49fdcc366b1074a4294033a92f18000cb7ecb1c798ee3f6146654cc4b` |
| Production dump after (`4-acfml-prod-after.txt`, 121 lines, 14 groups) | `3cc47ce0…aa9050b82` (= local) |
| Appendix A total, before (×2) and after (×3) | `bdabf4a13023e2d9e3d950df71d04e28a4c11fdcd06a10a61874e4d2ac1c1f88` |

### Timeline (EDT, 2026-10-29)
| Time | Step | By | Result | File |
|---|---|---|---|---|
| 17:07 | P1 diff + guard + negative test | Dev | exit 0; 13 → 14; Added 36, Removed 0, Changed 10 keys (E1 list), Reordered 0; duplicates `(none)` both files; self-test 6/6; negative test exit 1, `page 32: "cta_path" ← aboutData.cta_path, finalCtaSection.cta_path` | `P1-diff.txt`, `P1-guard.txt`, `P1-hashes.txt` |
| 17:07 | P2 appendices extracted | Dev | 4 scripts, JS syntax-checked | `P2-hashes.txt` |
| 17:08 | P3 local dump, orphans, 4.2 reference | Dev (local WP-CLI) | 121 lines, 14 groups, all `mode=translation`, 0 `pref=-`, `hero_cta_path [text] pref=2`; orphans 15 posts · 57 rows; local schema 38/38 | `acfml-local-after.txt`, `orphans-local.txt`, `4.2-local.diff` |
| 17:08 | 0.1 artifacts | Dev | clean, hashes match | `0.1-artifacts.txt` |
| 17:15 | 0.2 Vercel production commit | Mauricio | `55d4350` (PR #14 merge) | — |
| 17:20 | 0.3 SSH inventory | Mauricio | siteurl `http://cms.magnetomarketing.co`; A2 plugins active at A2 versions | `0.3-inventory.txt` |
| 17:24 | 0.3b ACF PRO license | Mauricio | Active | `~/Desktop/acf-updates.png` |
| 17:34 | 0.4 / 0.4b ACFML before | Mauricio / Dev | 13; `IDENTICAL` to Phase 3b | `0.4-…`, `0.4b-diff.txt` (empty) |
| 17:45 | 0.5 / 0.6 / 0.7 | Mauricio / Dev | export = `phase-5-before.json`; 0 / 0 / 0 / 0; CPT equal | `acf-prod-before.json`, `0.6-…`, `0.7-cpt.txt` |
| 17:49 | 0.8 orphans | Mauricio | posts 10 · rows 15, all EN | `0.8-orphans.txt` |
| 17:49 | 0.9 schema before | Dev | 1/38 OK, 37 MISSING incl. `HeroContent.ctaPath` | `0.9-schema-before.txt` |
| 18:06 | 1.1 SiteGround backup | Mauricio | `phase-5a-acf-before-20261029-1806` | — |
| 18:26 | 1.2 DB export | Mauricio | 3,484,075 B, `d1712034a11ae0076103edae09795ba975ad4ea80e4a11cbb12d3e128d933879` | `phase-5a-acf-before-20261029-1826.sql` |
| 18:28 | 2 before-capture ×2 | Dev | identical; 31 × 200; all `ok` except `GetAboutTexts` `ERR` (E4) | `2-before.txt`, `2-before-2.txt` |
| 18:48 | **3 import — production write** | Mauricio | "Imported 14 items"; 14 groups, no duplicate titles, all active; no Sync | `3-imported-14-items.png` |
| 18:52 | 4.1 ACFML after | Mauricio | `IDENTICAL` to local | `4-acfml-prod-after.txt` |
| 18:53 | 4.2 / 5 | Dev | `IDENTICAL`; 38/38 | `4.2-prod.diff`, `5-schema-after.txt` |
| 18:56 | **6.1 `wp cache flush` — production write** | Mauricio | `Success: The cache was flushed.` | — |
| 18:57 | 7.1 / 7.2 (run before 6.2, see D-3) | Dev | `IDENTICAL`; 7 × 200 + 404 | `7-after.txt`, `7.2-status.txt` |
| 19:00 | **6.2 Dynamic Cache flush — production write** | Mauricio | `cms.magnetomarketing.co` (site confirmed 19:08) | — |
| 19:00 | 7.1 / 7.2 re-run | Dev | `IDENTICAL`; 7 × 200 + 404 | `7-after-2.txt`, `7.2-status-2.txt` |
| 19:02 | **7.1 of record** | Dev | `IDENTICAL` | `7-after-3.txt` |
| 19:07 | 7.2 visual | Mauricio | unchanged: home final CTA "Ready to stop guessing and start converting?", /about-magneto, Trépied | — |
| 19:09 | 8 after backup | Mauricio | 3,526,468 B, `dd9058531f5a492c80fa27c8347ca22964ddc50e04fc6ce74b4f7332eac12d69`. Window closed | `phase-5a-acf-after-20261029-1909.sql` |
| 19:20–21:45 | 9 preview: AC-23, AC-24 | Dev (Chrome) + Mauricio | below | `ac24/` |

### Step 0.8: orphan meta (every row, classified with the runbook table)
| Post | Rows | Classification |
|---|---|---|
| 2 home/en | `OWN` title "Ready to stop guessing and start converting?", subtitle, prefooter_cta_text "Get Your Free Strategy Call", prefooter_cta_link (Calendly `magnetomarketing/free-strategy-call`), bgimage 52 | **Required**: all present (= E5) |
| 32 about-magneto/en | `ORPHAN` title=(empty) (ref `field_689a30ee3e806`), subtitle = old hero subtitle (ref `field_689a2dbb60320`) | Report only: title empty → hidden by the whole-object fallback. Cleanup phase |
| 34 services/en | same pattern (title ref `field_689a30ee3e806`) | Report only, cleanup phase |
| 36 packages/en | same pattern (title ref `field_689a30ee3e806`) | Report only, cleanup phase |
| 38 projects/en | same pattern (title ref `field_689a2d9a6031f`) | Report only, cleanup phase |
| 41 contact/en | same pattern (title ref `field_689ba94785963`) | Report only, cleanup phase |

- No `cta_path`, `secondary_cta_text` or `secondary_cta_path` row anywhere.
- No orphan `title` with a value.
- No `OWN` rows outside home, and no FR/ES posts in production (A3 holds).
- **Promote blockers: 0.** Every subtitle ref is `field_689a2dbb60320` (heroContent.subtitle_hero).

### Step 8: before → after database check (Dev, local files only)
- 44 tables in both dumps.
- `acf-field` posts 72 → 107: +35 fields, plus 1 group, which accounts for the 36 added.
- Size changes: `wp_posts` +35,855 B, `wp_options` +5,059 B, `wp_postmeta` +1,479 B.
- The only changed meta keys are plugin bookkeeping:
  - `_wpml_word_count`: 22 updated, 36 added;
  - `acfml_non_translatable_locations`: 1 updated, 1 added.
- No content meta changed.
- The before dump is ≈216 KB smaller than `phase-3b-after-20261025-2309.sql`. That is all `wp_options`: expired
  transients, 59 → 51 rows. Not a concern.

### Step 9: 5a PR preview (`8d2d313`)
- **Access:** the preview is behind Vercel Deployment Protection. Plain `curl` got `302` → `vercel.com/sso-api`. With
  Mauricio's approval, the Dev used Claude in Chrome in his session, within his limits:
  - new tabs only;
  - read-only;
  - one modal click, closed without typing;
  - no forms, no Vercel or WP changes;
  - tabs closed afterwards.
- **AC-23 (19:32): AC-8 to AC-12 and the WORKFLOW list pass.** Server HTML was fetched same-origin with `no-store`.
  - Routes: 9 × 200; `/esto-no-existe` 404, not 500.
  - Home: 0 testimonials (AC-9).
  - Every route: 0 literal `<p>` (AC-10) and 0 lead magnet (AC-12).
  - Final CTA on every route except /contact and the 404. Home shows "Ready to stop guessing…"; the other routes use
    the home fallback.
  - AC-11: the home final CTA button opens the "Quick — before we book" modal. It was closed with ×; Calendly was not
    reached.
- **AC-24: approved by Mauricio** (screenshots reviewed at 1440, 768 and 375; he checked the 375 menu and the modal
  himself).
  - Dev prep, confirmed with `innerWidth` on every route:
    - horizontal overflow (`scrollWidth > innerWidth`): none on the 7 routes at any width;
    - the modal at 1440 (`.ec-modal`, 540 × 435 at x 450–990, y 144–579) fits the viewport.
  - Screenshots: 105 PNGs in `$RB/ac24/<route>-<width>-NN.png`, plus `modal-1440-01.png`.
    - 1440: 40 segments;
    - 768: 29;
    - 375: 35.
  - Info: `img.final-cta-section__bg-image` is wider than the viewport at 768 and 375 (828 / 640 px), but its container
    clips it, so the page does not scroll sideways.

### Commands run against production
**Dev:** read-only queries and GETs only. No SSH, no WP admin, no REST writes, no mutations.
- Appendix A (`live-capture.mjs`, 31 GraphQL `query` POSTs each): 5 runs, at 18:28 (×2), 18:57, 19:00 and 19:02.
- Appendix B (`schema.mjs`, introspection): 17:49, 18:53.
- GETs to `www.magnetomarketing.co`: 8 URLs × 2, at 18:57 and 19:00.
- Preview:
  - 19:29: `curl` of the AC-8 routes (every one `302` to Vercel SSO);
  - from 19:32: Chrome navigations and same-origin GETs (AC-23, AC-24).

**Mauricio** (SSH key `siteground_magneto_v2`, port 18765), every command as written in the runbook:
- Read-only:
  - 0.3 `wp option get siteurl` + `wp plugin list`;
  - 0.4 / 4.1 `wp eval-file -` < `acfml-dump.php`;
  - 0.8 `wp eval-file -` < `orphans.php`;
  - 1.2 / 8 `wp db export -` to the laptop.
- Writes: 6.1 `wp cache flush`.
- WP admin:
  - 0.3b ACF → Updates, read only;
  - 0.5 ACF → Tools → Export;
  - **3, ACF → Tools → Import (the write).**
- SiteGround: 1.1 backup; **6.2 Dynamic Cache flush**.
- Vercel: 0.2 read the production deployment. No setting changes.

## Deviations from the spec
- **D-1 (P1, cosmetic):** the committed duplicate-name guard differs from the spec in three ways:
  - it checks only the **after** file;
  - its section is titled `Duplicate meta names per post, after file (N)`;
  - it exits `1`, not a new code such as 3.

  To cover the before file, the Dev ran the script with that file on both sides: `(none)`, exit 0. The negative test
  failed as required.
- **D-2 (0.5):** P0b's local re-export had the same file name as the production export
  (`acf-export-2026-10-29.json`). It had left `~/Downloads` before 0.5. Mauricio found it and moved it to
  `backups/phase-5a/acf-export-local-p0b-2026-10-29.json`, and the Dev verified it at 17:49 (hash and diff above).
  This didn't block the import.
- **D-3 (6.2 / 7):** the first 7.1 / 7.2 run (18:57) came before the 6.2 flush (19:00). 7.1 was re-run at 19:00 and
  19:02, both `IDENTICAL`; 19:02 is the result of record. Mauricio's first two 6.2 messages were unfilled templates.
  The time (19:00) and the site (`cms.magnetomarketing.co`) were confirmed by 19:08.
- **D-4 (AC-23 modal width):** AC-23's modal check ran at a 1096 px viewport, because the Chrome window could not reach
  1440. The 1440 modal check was done in the AC-24 prep (fits).
- **D-5 (preview access):** the preview was checked in Chrome, not with `curl`, because of Vercel Deployment
  Protection (approved by Mauricio, same as Phases 3b and 4).
- **D-6 (step 3 evidence): evidence saved.** Mauricio added the screenshot after the run (22:34):
  - file: `$RB/3-imported-14-items.png`, 334,985 B, sha256
    `3de471197d54f8de115cb59ee1c64a89452a5c9282e8df48c6ed070a0f5040a4`;
  - address bar: `cms.magnetomarketing.co/wp-admin/edit.php?post_type=acf-field-group&page=acf-tools`;
  - green notice: "Imported 14 items", followed by the 14 group titles;
  - the Export list shows 14 groups, each once, including "Packages - Content Sections".

  4.1, 4.2 and 5 independently confirm the result. An earlier file with the same name held an unrelated terminal
  capture (sha256 `b2dabe97…cd46b383`); it was replaced and is not evidence.

## Issues found (not fixed)
- **I-1, orphan final-CTA meta (0.8):** `title=(empty)` and the old hero `subtitle` on pages 32, 34, 36, 38 and 41
  (EN). The whole-object fallback hides them, so they don't block the promote. They belong to the cleanup phase; link
  this report from that WORKFLOW row. The 5c loader writes all eight `finalCtaSection` names together, `''` included.
- **I-2, "Development Site" badge:** the production admin bar shows a red badge. Likely `WP_ENVIRONMENT_TYPE` or a host
  or plugin flag; not checked. Relevant to the WPML Production-key item (Phase 3b O-1).
- **I-3, siteurl uses `http://`:** `http://cms.magnetomarketing.co`. GraphQL is reached over https, so the import was
  not affected.
- **I-4, plugin drift since Phase 3b (minor auto-updates):** `wordpress-seo` 28.7 → 28.8, `all-in-one-wp-migration`
  7.112 → 7.113. 4 updates are pending in WP admin; none were applied in this window. The full production plugin list
  is now in `0.3-inventory.txt`.
- **I-5, Packages feature list (5b, Packages rebuild; known, non-blocking):** the check icon sits a few px below the
  first text line. It is visible on multi-line items at 375 and 768. Align the icon to the first line.
- **I-6, cards at 768 (5b, Packages rebuild; known, non-blocking):** the Packages and Projects cards in 3 columns feel
  cramped. Evaluate 2 columns at `md`.
- **I-7, observed, expected:** page titles still read "… - Magneto Marketing" (AC-7c: per-page `meta.*` stays until
  5b). The footer reads "Magneto Web Consulting © 2026".
- **Spec note for the Architect:** the runbook header still says `Status: Draft`, while the approval is recorded in
  `$RB/notes.md`. The 5a spec's AC-22 can be ticked from this report.

## Proposed commits
On `feat/phase-5a` (the 5a PR is not merged). Nothing is staged.
- `docs(phase-5a): production ACF import runbook report`
- `docs(wp-setup): phase 5a production ACF import rows`

## Time
- Mauricio:
  - window from 0.2 (17:15) to the after backup (19:09), ≈ 1 h 55 min elapsed, including waits for Dev checks;
  - AC-24 visual review after 21:45.
  - Active time not measured.
- Dev:
  - P1–P3 ≈ 5 min of run time (scripts prepared earlier; preparation time unknown);
  - checkpoints ≈ 1–3 min each;
  - AC-23 ≈ 15 min;
  - AC-24 prep ≈ 30 min, plus several stops for window widths;
  - report ≈ 20 min (estimated).
- Waiting: 19:32 → 21:15, between AC-23 and the AC-24 prep.
