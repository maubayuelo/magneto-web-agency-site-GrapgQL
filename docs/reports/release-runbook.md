# Release runbook report — §B2 loader production mode

- Spec: `docs/specs/release-runbook.md` rev 0.3 (Approved), on branch `spec/release-runbook`. This report covers **§B2**
  and **§B3 RH-6** (section "RH-6" at the end). The other sections this report must later hold (Part A batch read-back,
  release-day evidence G-2 and V-1 … V-11) are added when those steps run.
- Author: Dev · Date: 2026-11-19 · Branch: `feat/release-runbook-b2` (from `master` @ `bc8688b1d5bf`)

## Result
**Done (Dev part).** The host guard is now a pure function with committed tests. The loader calls it first, and every
other guard behaves as on master (stub-harness comparison). Still open: AC-B2-4 (Mauricio's three local dry-runs) and
the real-WordPress proof (§B3 RH-4).

## Changes
- `scripts/phase-5c/target-guard.php` (new): `p5c_target_guard( ?string $target, string $home_url ): ?string`. It has
  no WordPress dependency. It returns `null` when the pair is allowed, otherwise the abort message. Allowed pairs, exact
  after stripping trailing `/` and `\` (the same as `untrailingslashit`):
  - no target → `http://magneto-cms-2.local`
  - `production` → `http://cms.magnetomarketing.co`
  - `rehearsal` → `http://magneto-prod-rehearsal.local`

  Everything else aborts, including an empty `target=`, any case variant and a production host with no target. No
  override exists.
- `scripts/phase-5c/target-guard.test.php` (new): plain PHP. Covers 25 cases: the nine §B2 step 3 cases plus variants.
  Exits 1 on any failure.
- `scripts/phase-5c/load-content.php`: only the header comment and the §1 guard block change.
  - The header documents the three targets, the `[target=…]` usage and the first log line.
  - The guard block calls `require_once __DIR__ . '/target-guard.php'` and then `p5c_target_guard( $p5c_opt( 'target' ), home_url() )`.
    A non-null result goes through the existing `$p5c_abort`, so the message keeps the `Aborted before any write:` prefix.
  - `$p5c_expected_home` is now `untrailingslashit( home_url() )`, set after the guard passes, so it equals the allowed
    host. The unchanged `Plan on {$p5c_expected_home}` line therefore keeps working.
  - It then logs `TARGET <local|production|rehearsal> · home_url <…> · lang <…> · DRY-RUN|REAL RUN`. `lang` is the raw
    argument, or `(none)`; the lang guard right after it still validates it.
  - Nothing after the guard block changed (diff below).
- `docs/reports/release-runbook.md` (new): this report.

## Gate
| Check | Result | Notes |
|---|---|---|
| `php -l` × 3 (PHP 8.2.35) | passed | "No syntax errors detected" for `load-content.php`, `target-guard.php`, `target-guard.test.php` |
| `target-guard.test.php` | passed | 25 cases, 25 passed, 0 failed, exit 0 |
| Mutation check (test catches a bad guard) | passed | a mutant that allows production with no target → case 2 FAIL ×2, exit 1 |
| Stub-harness integration proof | passed | 42 checks, `all passed`, exit 0 |
| lint | failed (pre-existing), **65 errors / 76 warnings** | at the ceiling of ≤ 65 / 76. Lint covers `src/` only, and this change touches no file under `src/` |
| typecheck | passed | `tsc --noEmit`, no output |
| tests | passed | 52 files, 812 tests |
| build | passed | Next 15.5.28, 35/35 static pages, `.env.local` loaded |
| visual (routes · viewports · locales) | not applicable | no user-visible change (scripts only) |
| AC-B2-4 local dry-runs `lang=en\|fr\|es` | **not run** | Mauricio's step (commands below) |

## Evidence

### PHP binary
`/Users/maubayuelo/Library/Application Support/Local/lightning-services/php-8.2.35+0/bin/darwin-arm64/bin/php`
(`--version` → `PHP 8.2.35 (cli) (built: Oct 22 2026 09:48:59) (NTS)`). PHP is not on the PATH.

### AC-B2-1 — `git diff master -- scripts/phase-5c/load-content.php`
There are two hunks: the header comment (lines 1-21) and the §1 guard block (lines 43-51). Guard block:
```diff
-// ---- 1. Local-only guard (no flag overrides it) ---------------------------------------------------------------------
-$p5c_expected_home = 'http://magneto-cms-2.local';
-if ( untrailingslashit( home_url() ) !== $p5c_expected_home ) {
-	$p5c_abort( 'home_url() is ' . home_url() . ", expected {$p5c_expected_home}. This loader is local only." );
+// ---- 1. Host / target guard (release runbook §B2; runs first, no flag or env var overrides it) ----------------------
+require_once __DIR__ . '/target-guard.php';
+$p5c_target       = $p5c_opt( 'target' );
+$p5c_target_error = p5c_target_guard( $p5c_target, home_url() );
+if ( null !== $p5c_target_error ) {
+	$p5c_abort( $p5c_target_error );
 }
+$p5c_expected_home = untrailingslashit( home_url() ); // equals the allowed host for this target (used by the Plan line)
+WP_CLI::log( 'TARGET ' . ( $p5c_target ?? 'local' ) . ' · home_url ' . home_url() . ' · lang ' . ( $p5c_opt( 'lang' ) ?? '(none)' ) . ' · ' . ( $p5c_dry_run ? 'DRY-RUN' : 'REAL RUN' ) );
```

### AC-B2-2 — `target-guard.test.php`
`"$P" scripts/phase-5c/target-guard.test.php` → exit 0:
```
PASS  case 1  no target + local host                               → allowed
PASS  case 1  no target + local host with trailing /               → allowed
PASS  case 2  no target + production host                          → abort: home_url() is http://cms.magnetomarketing.co, expected http://magneto-cms-2.local for no target (local).
PASS  case 2  no target + production host with trailing /          → abort: home_url() is http://cms.magnetomarketing.co/, expected http://magneto-cms-2.local for no target (local).
PASS  case 3  no target + rehearsal host                           → abort: home_url() is http://magneto-prod-rehearsal.local, expected http://magneto-cms-2.local for no target (local).
PASS  case 4  production + production host                         → allowed
PASS  case 4  production + production host with trailing /         → allowed
PASS  case 5  production + local host                              → abort: home_url() is http://magneto-cms-2.local, expected http://cms.magnetomarketing.co for target=production.
PASS  case 6  production + https production host                   → abort: … https://cms.magnetomarketing.co, expected http://cms.magnetomarketing.co for target=production.
PASS  case 6  production + https production host with trailing /   → abort
PASS  case 6  production + www production host                     → abort
PASS  case 6  production + production host with a path             → abort
PASS  case 7  rehearsal + rehearsal host                           → allowed
PASS  case 7  rehearsal + rehearsal host with trailing /           → allowed
PASS  case 8  rehearsal + production host                          → abort: … expected http://magneto-prod-rehearsal.local for target=rehearsal.
PASS  case +  rehearsal + local host                               → abort
PASS  case 9  PRODUCTION + production host                         → abort: target=PRODUCTION is not allowed. Use no target (local), target=production or target=rehearsal.
PASS  case 9  Production + production host                         → abort
PASS  case 9  prod + production host                               → abort
PASS  case 9  empty target + production host                       → abort: target= is not allowed. …
PASS  case 9  empty target + local host                            → abort
PASS  case +  REHEARSAL + rehearsal host                           → abort
PASS  case +  local (explicit) + local host                        → abort
PASS  case +  ' production' (leading space) + production host      → abort
PASS  case +  'production ' (trailing space) + production host     → abort
25 cases, 25 passed, 0 failed
```
Mutation check (scratchpad copy of the test plus a mutant guard that lets a production host through with no target):
`case 2 … → allowed` FAIL ×2, `25 cases, 23 passed, 2 failed`, **exit 1**.

### AC-B2-3 — stub-harness integration proof
The harness is in the scratchpad, not in the repo (as for 5c AC-3). It uses in-memory WP / ACF / WPML / WP-CLI stubs
with a write log: `update_field` appends to the log, and `WP_CLI::error` throws, then the harness catches it. It
compares **master's loader** (`git show master:…`, in a mirror directory with a copy of `magneto-copy-en.md`) with the
**branch loader** (in the repo). Command:
`REPO=<repo> "$P" <scratchpad>/harness/run.php` → `all passed`, exit 0.

**Part 1: the guard aborts.** In every case below the run aborts with `writes=0`, and the guard message is the only
output: no `TARGET` line and no other guard's output. Real runs had a fresh `.sql` backup unless noted:
```
PASS  no target + production host (real run)           writes=0  Error: Aborted before any write: home_url() is http://cms.magnetomarketing.co, expected http://magneto-cms-2.local for no target (local).
PASS  no target + production host (dry-run)            writes=0  (same)
PASS  no target + production host, no lang, no backup  writes=0  (same — the host guard runs before lang/backup)
PASS  no target + rehearsal host                       writes=0  … expected http://magneto-cms-2.local for no target (local).
PASS  target=production + local host                   writes=0  … expected http://cms.magnetomarketing.co for target=production.
PASS  target=production + https production host        writes=0  … expected http://cms.magnetomarketing.co for target=production.
PASS  target=PRODUCTION + production host              writes=0  target=PRODUCTION is not allowed. …
PASS  target=prod + production host                    writes=0  target=prod is not allowed. …
PASS  target= (empty) + local host                     writes=0  target= is not allowed. …
PASS  target=rehearsal + production host               writes=0  … expected http://magneto-prod-rehearsal.local for target=rehearsal.
```
**Part 2: the other guards, master vs branch, on the local host with no target.** For each case, the outcome, the
write count and the full log are identical between the two loaders. The only difference is the branch's extra first
line, `TARGET local · home_url http://magneto-cms-2.local · lang <…> · DRY-RUN|REAL RUN`:
```
PASS  lang missing               ABORT/writes=0 · lang=en|fr|es is required (one language per run).   [first line: … lang (none) · REAL RUN]
PASS  lang=xx                    ABORT/writes=0 · lang=en|fr|es is required (one language per run).
PASS  real run, no backup        ABORT/writes=0 · a real run needs backup=<…> (or pass dry-run).
PASS  real run, backup= empty    ABORT/writes=0 · a real run needs backup=<…> (or pass dry-run).
PASS  backup not .sql            ABORT/writes=0 · backup file not found or not a .sql file: …/notsql.txt
PASS  backup missing file        ABORT/writes=0 · backup file not found or not a .sql file: …/nope.sql
PASS  stale backup (4 h)         ABORT/writes=0 · backup is older than 3 hours (4 h): …/stale.sql
PASS  sha mismatch               ABORT/writes=0 · source.sha256 does not match docs/content/magneto-copy-en.md (…)   [DRY-RUN]
PASS  lang ≠ source.file         ABORT/writes=0 · lang=en but source.file is docs/content/magneto-copy-fr-CA.md (expected …-en.md).
PASS  positive dry-run           completed/writes=0 · Success: Dry run: nothing written.
```
**Part 2b: real run → read-back → second dry-run, master vs branch.** The logs are identical apart from the `TARGET`
and `Backup:` lines. The `Backup:` line holds a run-dependent age, so it is excluded from the comparison:
```
PASS  real run: writes master=1 branch=1 · Success: 1 field(s) written (1 changes, 0 appended rows), all read back ok. …
PASS  second dry-run: same log, about-magneto/en: 0 changes (0 appended rows), 1 unchanged
```
**Part 3: allowed targets run every other guard unchanged.** The 10 Part 2 cases are run with `target=production` on
`http://cms.magnetomarketing.co/`, then with `target=rehearsal` on `http://magneto-prod-rehearsal.local/` (trailing
`/` on purpose). Each output equals the local-run output once the host is normalised. The first line in each case is,
for example, `TARGET production · home_url http://cms.magnetomarketing.co/ · lang en · DRY-RUN`. 20/20 PASS.

### Commands for Mauricio — AC-B2-4 (Local's "Open site shell", one at a time)
```bash
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=en dry-run
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=fr dry-run
wp eval-file <repo>/scripts/phase-5c/load-content.php lang=es dry-run
```
Expected for each run:
- the first line is `TARGET local · home_url http://magneto-cms-2.local · lang <xx> · DRY-RUN`;
- every post line ends in `0 changes (0 appended rows)`;
- the run ends with `Success: Dry run: nothing written.`

Optional, a local negative check: `… load-content.php target=production lang=en dry-run` → `Error: Aborted before any
write: home_url() is http://magneto-cms-2.local, expected http://cms.magnetomarketing.co for target=production.`

## Guard input
The guard's only inputs are the `target=` argument and `home_url()` as read from WordPress. It reads nothing from
`.env.local`, which configures the Next.js app's GraphQL endpoint and is outside §B2.

## Deviations from the spec
None. The points below record decisions taken while implementing (Architect, 2026-11-19):
- **Abort wording (accepted).** The old message ended in "This loader is local only.". The new messages name the
  expected host for each target, for example `… expected http://cms.magnetomarketing.co for target=production.`
- **"First log line" means the first line of a run the guard allows. It is never printed before the guard runs.** When
  the guard aborts, the abort message is the only output, and the `TARGET` line is not logged. This is what §B2 step 4
  requires: `writes=0`, and no other guard's output changes (Part 1 above).
- **The harness does not exercise the "ACF is not active" guard (an accepted, documented gap).** The stubs define
  `update_field` / `acf_get_field` globally, and they can't be undefined within one process. That guard's code is
  unchanged in the diff. The rehearsal (§B3 RH-4 and RH-5) runs it on real WordPress with ACF active.

## Known behaviour (not a defect)
- **`target=` given twice:** the first value wins, because the existing `$p5c_opt` returns the first match. The host
  must still equal the first value's host, so a duplicate cannot widen the allowance; at worst the run aborts. Left
  as is: `$p5c_opt` is outside the allowed edit area.

## Risks
- **Lint has zero margin:** 65 / 76 equals the AC-B2-3 ceiling. Any new lint finding anywhere in `src/` breaks
  AC-B2-3. The limit stays as the regression gate.

## Issues found (not fixed)
- None.

## Merge order
Mauricio merges `spec/release-runbook` into `master` first. `feat/release-runbook-b2` stays off `master` @ `bc8688b`
with no rebase, because the two branches touch no file in common. This report's relative spec link resolves once both
are on `master`.

## Proposed commits
1. `feat(phase-5c): loader target guard with production and rehearsal allowances (runbook §B2)`:
   `scripts/phase-5c/target-guard.php`, `scripts/phase-5c/target-guard.test.php`, `scripts/phase-5c/load-content.php`
2. `docs(report): release runbook §B2 proofs and gate`: `docs/reports/release-runbook.md`

## Time
Agent time ≈ 45 min (estimated). Active human time: unknown. AC-B2-4 is ≈ 10 min of Mauricio's time (spec estimate).

---

# RH-6 — rehearsal Expected table and equality read-back (§B3)

- Author: Dev · Date: 2026-11-25 · `master` @ `1267b90` · read-only on both sites (GraphQL POSTs with no cookie or
  auth, to `http://magneto-cms-2.local/graphql` and `http://magneto-prod-rehearsal.local/graphql` only). No write to
  either site, no loader change.
- Inputs, all in `~/Documents/projects/magneto/backups/release/rehearsal/`, read with `grep` only (dumps also with a
  scratchpad meta-diff script):
  - outputs: RH-C4-en-dryrun, RH-C6-en-dryrun, RH-C6-en-run; RH-C7-check-fr / -es, RH-C7-en-dryrun, RH-C7-en-run,
    RH-C7-en-dryrun2; RH-C8b-fr-dryrun, RH-C8b-fr-run, RH-C8b-fr-dryrun2; RH-C9b-es-dryrun, RH-C9b-es-run,
    RH-C9b-es-dryrun2;
  - dumps: RH-C5-before-titles, RH-C6-before-en, RH-C7-before-svcmedia, RH-C7-before-load `.sql`.
- **Superseded, not used for any figure:** the first-pass `RH-C8-fr-dryrun`, `RH-C8-fr-run`, `RH-C9-es-dryrun`,
  `RH-C9-es-run`. They were measured without C-7, an order that will not occur on release day. A first RH-6 pass
  against that state (same day) found the 42 Services-media mismatches. Mauricio then restored `RH-C8-before-fr.sql`
  (the post-C-6 state), ran C-7, and ran C-8 and C-9 again in release order (C-8b / C-9b). Everything below is from
  that second state.
- Environment: the rehearsal ran on **PHP 8.2.35** (production 8.2.36, D1) and **without `sg-ai-studio`** (D4).
- `.env.local` was not checked: the read-only `grep` was denied. RH-6 doesn't use `.env.local` (both hosts are queried
  directly). No Next.js server or build was run.

## RH-6 result
**RH-6: 0 mismatches.** The read-back and the Expected table are complete for C-4 … C-9 in release order. From the Dev
side, the GNG-0 item "RH-6 0 mismatches" holds. The spec edits listed under "RH-6 deviations" are with the Architect.

| Check | Result |
|---|---|
| Every loaded value on the rehearsal = the content files (27 posts × languages, 5c-rest AC-7 normalization) | **762 values, 0 mismatches** |
| Rehearsal = local CMS, every queried leaf except IDs (27 posts × languages) | **969 leaves, 0 mismatches** (20 raw-only differences, removed by the normalization, see below) |
| FR/ES home rows: `service` 3, `testimonials` 2 | ✅ EN, FR, ES 3 / 2 |
| Trépied challenges / solutions / results | ✅ 3 / 4 / 6 in EN 498, FR 619, ES 677 (Dangel and Shamanicca are also 3 / 4 / 6) |
| `display_order` 10 / 20 / 40 on all nine project posts | ✅ Dangel 10, Shamanicca 20, Trépied 40, in EN, FR and ES |
| Titles | ✅ "Dangel Wellness", "Shamanicca", "Trépied" in all three languages; slugs `fashion-company-ecommerce`, `shamaniccas-ecommerce`, `trepied-trepied-ca`; all `publish` |
| Home media by EN-original file name | ✅ hero `2026/11/magneto-hero-phone-1.png`; featured icons `2026/11/ico-layout-template.svg`, `ico-wrench.svg`, `ico-shield-check.svg` (EN, FR, ES = local); testimonial thumbs empty on both sites |
| **Services media by EN-original file name** (the first pass's 42-mismatch block) | ✅ EN, FR, ES = local = the C-7 table (below) |
| Project images by EN-original file name | ✅ all 19 per language equal local (not required by RH-6; checked as well) |

Services media on the rehearsal after C-7, the same in EN 34, FR 582 and ES 644, and equal to local:

| Row | Image (EN original) | Icon (EN original) |
|---|---|---|
| 1 | `2026/11/magneto-build-1.jpg` | `2026/11/ico-layout-template.svg` |
| 2 | `2026/11/magneto-fix.jpg` | `2026/11/ico-wrench.svg` |
| 3 | `2026/11/magneto-care-1.jpg` | `2026/11/ico-shield-check.svg` |
| 4 | empty | `2025/10/icon-target.svg` |
| 5 | empty | `2026/11/ico-languages.svg` |
| 6 | empty | `2026/11/ico-calendar-check.svg` |
| 7 | empty | `2026/11/ico-chart-no-axes-column.svg` |

The rehearsal FR/ES rows point at the EN attachments themselves (C-8b media report: `services[0].Image target 739 →
EN original 739`). Locally, FR/ES resolve to translated attachment copies (5c-rest AC-7: 703 / 709 …). Both resolve to
the same EN-original file, which is what the site renders (`src/utils/wp-media.ts`).

### C-7 admin save (measured in the dumps `RH-C7-before-svcmedia.sql` → `RH-C7-before-load.sql`)
- **Intended:** EN 34 `services_0…6_Image` 134 / 138 / 142 / 145 / 148 / 151 / 473 → 739 / 745 / 742 / `''` ×4, and
  `services_0…6_icon` 74 / 69 / 97 / 101 / 82 / 154 / 476 → 694 / 700 / 697 / 476 / 691 / 685 / 688. **WPML Copy carried
  the same 14 values to FR 582 and ES 644** (rows re-inserted with new meta IDs).
- **The known re-format (F-10):** EN 34 `intro_body_html` + `services_0…6_description_html` went from `<p>` HTML to
  plain text with `\r\n\r\n`. These are exactly the 8 changes of the C-7 EN dry-run, and the C-7 load restored them.
- **Side effects, the same kind as F-10, not loaded values:**
  - EN 34 gained empty `hero_cta_path`, `prefooter_cta_link`, `cta_path`, `bgimage` (and their `_…` field-key rows),
    and lost `_yoast_wpseo_content_score` / `_yoast_wpseo_linkdex`;
  - FR 582 / ES 644 gained empty `bgimage` and `prefooter_cta_link` (and field keys).

  None of them was counted as a change by the C-7 EN or the C-8b / C-9b dry-runs, and the read-back shows no rendered
  difference.
- This save is why the FR/ES Services probe **hash** differs between the C-6 "after" line (`582:92:c9e1…`) and the C-7
  "before" line (`582:92:d8e0…`) while the count stays 92. It happened in the admin save, not in a load. The C-7 load
  itself left the probe byte-identical.

### Raw differences that the normalization removes (20, all FR, not a defect)
Site against site, 20 leaves differ raw, and 0 after normalization. All 20 are FR
wysiwyg fields (Services intro + 7 descriptions, Packages intro + 3 elements + 2 sections, home About, About
description and general text, the three project descriptions). Each one differs **only** in wptexturize's entity
form: local renders `&rsquo;`, the rehearsal renders `&#8217;`. That is render-filter output (an AC-7 normalization
item), not stored content: both sites equal the content files after normalization, and the loads' second dry-runs
were 0 / 0. Likely cause, not verified: the FR WordPress translation that wptexturize reads its quote characters from
differs between the two installs.

### How the read-back was done
A scratchpad script (not in the repo) reads `scripts/phase-5c/content/{en,fr,es}.json`. It builds one query per post
× language from the field labels: `pages|projects(first: 1, where: { language, name })`, the same lookup the site
uses. It runs that query on both hosts and flattens each result into leaf paths. It then compares rehearsal ↔ local on
every leaf except `databaseId`, and rehearsal ↔ content file on every loaded value, including the repeater row counts.
Media are compared by the EN original's path under `uploads/` (the `translations { languageCode sourceUrl }` of each
node), never by ID. The IDs differ between the sites, e.g. Services FR local 637 / rehearsal 582, home ES 536 / 642.
The normalization is 5c-rest AC-7's: HTML entities and curly quotes, `wpautop` newlines between block tags, a trailing
`\n`, and a select field returned as a one-item list.

## Expected table (release day, Part C, release order)
Every figure is measured from an output file in the rehearsal folder, except the **C-6 second dry-run**. That one has
no file: it was piped to `grep` at the time, and that state no longer exists. Its `237 unchanged` is Mauricio's
terminal observation only. It is backed independently by `RH-C7-en-dryrun2.txt`, which shows the same 237. The
unchanged totals also agree by arithmetic: first dry-run changes + unchanged + the appended rows' sub-field values.
EN: 186 + 38 + 13 (2 `sections` rows × 2 + 9 project rows × 1) = 237. FR: 189 + 42 + 9 = 240. ES: 188 + 43 + 9 = 240.

| Step | Per post (`changes (appended), unchanged`) | Total | Other lines |
|---|---|---|---|
| **C-4** EN dry-run (`RH-C4-en-dryrun`) | services 49 (0), 14 · packages 28 (2), 1 · home 28 (0), 8 · about-magneto 10 (0), 5 · projects 2 (0), 1 · contact 2 (0), 0 · fashion-company-ecommerce 21 (3), 3 · shamaniccas-ecommerce 22 (4), 3 · trepied-trepied-ca 24 (2), 3 | **186 changes (11 appended rows), 38 unchanged** | 11 `+ append` (below); no media report and no `↺` in EN (EN is the source) |
| **C-6** EN dry-run (`RH-C6-en-dryrun`) | identical to C-4 (byte-identical file except the probe line, see "C-5 probe drift") | **186 (11), 38** | as C-4 |
| **C-6** EN run (`RH-C6-en-run`) | same per-post lines | 186 changes, 11 appended; **66 fields written** (66 `wrote` lines), 346 `ok` read-back lines | ends `FAIL values of fr/es posts changed` + `Error: 1 read-back check(s) failed`: **expected**, see "C-6 probe" |
| **C-6** second dry-run | *terminal observation only* | **0 changes (0 appended rows), 237 unchanged** | — |
| **C-7** check-translations (`RH-C7-check-fr` / `-es`) | — | **fr 6/6 PASS · es 7/7 PASS**; `media WARN rows: 0` | rows 1 and 5: `media ok services.Image (7 rows)`, `media ok services.icon (7 rows)`; home rows 16 / 17 `service 3/3 · testimonials 2/2` |
| **C-7** EN dry-run (`RH-C7-en-dryrun`) | **services 8 (0), 55**; every other post 0 (0): packages 33 · home 36 · about-magneto 15 · projects 3 · contact 2 · fashion 27 · shamanicca 29 · trepied 29 unchanged | **8 changes (0 appended rows), 229 unchanged** | the 8 = `pageintrotext.introBodyHtml` + `services[0…6].descriptionHtml`, plain text → `<p>` HTML (the admin-save re-format); 0 WARN |
| **C-7** EN run (`RH-C7-en-run`) | same | `Success: 2 field(s) written (8 changes, 0 appended rows), all read back ok.` (`wrote` `pageintrotext.introBodyHtml`, `servicesServiceDetails.services`; 79 `ok` lines, 0 FAIL) | **probe before = after, byte-identical** |
| **C-7** second dry-run (`RH-C7-en-dryrun2`) | services 0 (0), 63; the rest as above | **0 changes (0 appended rows), 237 unchanged** | — |
| **C-8** FR dry-run (`RH-C8b-fr-dryrun`) | services 43 (0), 20 · packages 32 (0), 1 · home 30 (0), 6 · about-magneto 12 (0), 3 · projects 3 (0), 0 · contact 2 (0), 0 · fashion 21 (3), 4 · shamanicca 22 (4), 4 · trepied 24 (2), 4 | **189 changes (9 appended rows), 42 unchanged** | 9 `+ append`; **10 `↺ copy-sync`** (7 × `services[n].serviceGroup[]` core×3 / supporting×4, 3 × `displayOrder` 10/20/40); **41 `media ok`**, 0 WARN, with Services `Image` 739 / 745 / 742 / 0 ×4 and `icon` 694 / 700 / 697 / 476 / 691 / 685 / 688; `Success: Dry run: nothing written.` |
| **C-8** FR run (`RH-C8b-fr-run`) | same | `Success: 72 field(s) written (189 changes, 9 appended rows), all read back ok.` (72 `wrote` lines, 0 FAIL) | probe before = after, byte-identical |
| **C-8** second dry-run (`RH-C8b-fr-dryrun2`) | every post 0 (0) | **0 changes (0 appended rows), 240 unchanged** | — |
| **C-9** ES dry-run (`RH-C9b-es-dryrun`) | services 43 (0), 20 · packages 32 (0), 1 · home **29** (0), **7** · about-magneto 12 (0), 3 · projects 3 (0), 0 · contact 2 (0), 0 · fashion 21 (3), 4 · shamanicca 22 (4), 4 · trepied 24 (2), 4 | **188 changes (9 appended rows), 43 unchanged** | 9 `+ append`; 10 `↺ copy-sync` (as FR); 41 `media ok` (Services IDs as FR), 0 WARN; `Success: Dry run: nothing written.` |
| **C-9** ES run (`RH-C9b-es-run`) | same | `Success: 72 field(s) written (188 changes, 9 appended rows), all read back ok.` (72 `wrote` lines, 0 FAIL) | probe before = after, byte-identical |
| **C-9** second dry-run (`RH-C9b-es-dryrun2`) | every post 0 (0) | **0 changes (0 appended rows), 240 unchanged** | — |

On release day the media IDs are production's own (B1 notes). The rehearsal IDs above are a copy of production's,
because the rehearsal is a production dump, so they should be the same. Compare the counts, and `media ok` against
`WARN`, rather than relying on the IDs.

**C-7 doesn't change the FR/ES figures.** `RH-C8b-fr-dryrun` against the superseded first-pass `RH-C8-fr-dryrun`
(`diff`): the only differences are the 14 Services `media ok` lines (the new IDs) and the probe line. Every per-post
line, the totals, the 9 appends and the 10 copy-sync lines are identical. The same holds for ES. The Services media
that C-7 copies to the translations are media fields: the loader checks them (`media ok`) and does not write them.

**C-6 EN: 66 fields, not 72 (confirmed by Mauricio).** The run ended with `Error`, so it printed no
`Success: N field(s) written` line. There are 66 `wrote` lines. FR/ES write 72 because they also write the 6 fields
that are fully `= unchanged` in EN: `heroContent.ctaTextHero` on services, home, about-magneto and projects,
`homeAboutSection.aboutSectionTitle` and `aboutData.sectionTitle`.

**One correction to my first pass:** the first-pass FR/ES dry-runs also had 41 `media ok` lines, not the 42 I wrote
then.

`+ append` lines:
- EN (11): `packages/en sections[0]`, `[1]`; `fashion-company-ecommerce/en project_data_results[3]`, `[4]`, `[5]`;
  `shamaniccas-ecommerce/en project_data_solutions[3]`, `project_data_results[3]`, `[4]`, `[5]`;
  `trepied-trepied-ca/en project_data_results[4]`, `[5]`.
- FR and ES (9 each): the same list without the two `packages/<lang> sections` lines.

Two ES-only `~ change` lines (C-9b) show where production's ES posts held a different legacy value from FR:
`shamaniccas-ecommerce/es project_data_solutions[2].item` and `trepied-trepied-ca/es project_data_results[2].item`.
This also explains home 29 / 7 in ES against 30 / 6 in FR (one home field already equal in ES). The totals came out as
measured; these lines are context only.

### Cross-check against F-11 (11 appends per language)
F-11 predicted 11 per language: Dangel `results` +3, Shamanicca `solutions` +1 and `results` +3, Trépied `results`
+2, Packages `sections` +2. **Measured: EN 11, FR 9, ES 9.** The project appends match in every language (9). The
difference is the two Packages `sections` rows:
- **the EN load's WPML Copy sync creates the FR/ES `sections` counter.** In `RH-C6-before-en.sql`, FR 596 and ES 637
  have no `sections` meta. In `RH-C8-before-fr.sql` (after the EN load; it is also the state C-7 started from) both
  have `sections = 2` and `_sections = field_p5_packagescontentsections_sections`. No sub-field rows are created: the
  probe count for each post goes up by exactly 1.
- So when the FR/ES loads run, the repeater already has 2 (empty) rows. The loader writes them as changes, not appends:
  `~ change packages/fr sections[0].heading: "" → "Diagnostic payant de site web"`, `sections[0].bodyHtml`,
  `sections[1].heading`, `sections[1].bodyHtml` (`RH-C8b-fr-dryrun` lines 97-100; ES the same).
- F-11 is therefore right for EN, and correctly predicts 9 project appends for FR/ES. Its 2 Packages appends turn into
  4 changes in FR/ES. **The release-day Expected is the measured 11 / 9 / 9.** The spec's C-6 step 2 ("Cross-check: 11
  `+ append` lines") still holds for EN. C-8 step 2 ("11 `+ append`") should read 9 (C-9 says "the same"). This is
  the Architect's call; I have not edited the spec.

## C-6 probe: expected behaviour of the EN load, not a defect
The C-6 EN real run ended with:
```
  FAIL  values of fr/es posts changed
Error: 1 read-back check(s) failed. Restore with: wp db import <backup> && wp cache flush
```
Every field wrote (66), every read-back line is `ok` (346, 0 others), and the second dry-run was 0 / 0 (terminal
observation; `RH-C7-en-dryrun2` later shows the same 237 unchanged). The
cross-language probe before → after differs in exactly four of its eighteen entries (`id:count:hash`):

| Probe entry | Before | After |
|---|---|---|
| `page/services/fr` · `page/services/es` | `582:85:a010d4bde3d26a0c` · `644:85:a010d4bde3d26a0c` | `582:92:c9e1a54cb82f6f59` · `644:92:c9e1a54cb82f6f59` |
| `page/packages/fr` · `page/packages/es` | `596:71:5a68044f958225b5` · `637:71:5a68044f958225b5` | `596:72:c965d79f6b89162d` · `637:72:c965d79f6b89162d` |
| the other 14 (home, about-magneto, projects, contact, the 6 project posts, FR + ES) | — | byte-identical |

What changed, measured in the dumps either side of the EN load (`RH-C6-before-en.sql` → `RH-C8-before-fr.sql`):
- **Services FR 582 / ES 644, +7:** `services_0…6_service_group` = core, core, core, supporting, supporting,
  supporting, supporting (plus their `_services_n_service_group` field-key rows), absent before. This is WPML Copy
  sync of the 7 EN `serviceGroup` values that the EN load wrote. The FR/ES dry-runs then report the same 7 as
  `↺ copy-sync … from EN`.
- **Packages FR 596 / ES 637, +1:** the `sections` counter `2` (Copy sync of the EN repeater count), as above.

That is the WPML Copy behaviour of the EN load on a production copy, where the FR/ES posts were created from the
legacy EN (Part A). **It is not a defect, and the loader is not changed.**

**Confirmed by C-7:** the second EN load (`RH-C7-en-run`) writes Services fields again (`introBodyHtml` and the
`services` repeater), but it **left the probe byte-identical** before and after. The serviceGroup values and the
`sections` counter already exist on FR/ES by then, so the Copy sync has nothing to create. That, together with the
dump diff above, shows the C-6 probe failure comes only from the seven serviceGroup Copy values and the `sections`
counter. No other Copy path fires during the EN loads. The C-8b and C-9b runs also left their probes identical.

**On release day C-6 will exit non-zero** (`Error: 1 read-back check(s) failed`). Rule for Mauricio:
- **Continue** if, and only if, all of these hold:
  1. the run printed no `FAIL` other than `values of fr/es posts changed`;
  2. every read-back line is `ok`;
  3. the probe delta is **exactly** this one: `page/services/fr` and `/es` 85 → 92, `page/packages/fr` and `/es`
     71 → 72, the other 14 entries byte-identical. The before IDs and hashes are production's own: compare the
     counts and which entries changed, not the IDs;
  4. after `wp cache flush`, the second `lang=en dry-run` prints `0 changes (0 appended rows)` on every post.
- **Any other probe change remains a STOP** (another entry, another count, or a hash change on an entry whose count
  didn't change). Its rollback is unchanged: restore `$B`, or B0.
- Do **not** run the printed `Restore with: …` hint when the four conditions hold. It's the loader's generic message.
- The spec's C-6 stop list ("a read-back failure (`:545`), a probe change") needs this exception written into it.
  That is the Architect's edit, not mine.

### C-5 probe drift (between C-4 and C-6, before the EN load)
The C-4 and C-6 EN dry-runs are byte-identical except the probe line. Between them, each FR/ES project entry went
up by 1 (e.g. `project/fashion-company-ecommerce/fr` `584:40:274c…` → `584:41:cd1c…`). Dumps `RH-C5-before-titles.sql`
→ `RH-C6-before-en.sql`: `display_order` is absent on all six FR/ES project posts before C-5, and present after it as
584 / 659 = 10, 610 / 668 = 20, 619 / 677 = 40. This is the WPML Copy of the three C-5 admin saves, as C-5 step 4
intends (F-8). It explains why the release-day **C-4 probe line will not equal the C-6 "before" line**. C-6 compares
its own before/after, so this is expected.

## RH-6 deviations
- **Two passes.** The first pass ran against a rehearsal without C-7 and found 42 Services-media mismatches. The
  rehearsal was then restored to the post-C-6 dump, and C-7, C-8 and C-9 were run in release order. This report gives
  the second pass only. The first-pass `RH-C8-*` / `RH-C9-*` files are superseded and are not used for any figure.
- **C-6 second dry-run** has no output file (terminal observation only; independently matched by `RH-C7-en-dryrun2`).
- **Spec text** that RH-6 shows needs updating. Mauricio is collecting it for the Architect, and I didn't edit it:
  - the C-6 stop list needs the probe exception;
  - C-8 / C-9 say "11 `+ append`", which should be 9;
  - C-6 should note 66 fields;
  - C-7's admin-save side effects (empty Copy meta, the Yoast keys) could be noted like F-10.

## RH-6 issues found (not fixed)
- **wptexturize entity form differs** between local (`&rsquo;`) and the production copy (`&#8217;`) in FR. It is
  invisible once rendered as HTML, and normalized away here. The release-day G-2 / V-checks must use the same
  normalization, or they will report 20 FR differences.
- **The C-7 admin save adds empty Copy meta and drops two Yoast analysis keys** (EN 34; FR/ES `bgimage`,
  `prefooter_cta_link`). This is the F-10 pattern again. The site doesn't read the values (empty), and the loads
  don't count them. It is recorded so that a release-day meta diff doesn't read them as surprises.
- The loader's generic `Restore with:` hint appears on the expected C-6 exit (above). Runbook wording only.

## RH-6 proposed commit
`docs(report): release runbook RH-6 rehearsal Expected table and read-back` — `docs/reports/release-runbook.md`

## RH-6 time
Agent ≈ 1.5 h over two passes (estimated). Human time: the rehearsal itself is not measured here.
