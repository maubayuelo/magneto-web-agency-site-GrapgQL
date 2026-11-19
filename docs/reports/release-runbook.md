# Release runbook report — §B2 loader production mode

- Spec: `docs/specs/release-runbook.md` rev 0.3 (Approved), on branch `spec/release-runbook`. This report covers **§B2
  only**. The other sections this report must later hold (RH-6 Expected table and read-back, Part A batch read-back,
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
