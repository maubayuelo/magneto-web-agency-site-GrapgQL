# Phase 5a — Production ACF import (runbook)

- Status: Draft (rev 2: D-a/D-b decided, SSH values filled in, step 4.2 expectation measured)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect) · **Executed by: Mauricio** (agents never write to production)
- Date: 2026-10-26
- Branch: `spec/phase-5a-runbook` (from `master` at `5d4c90f`). Nothing staged.
- Depends on:
  - `docs/specs/phase-5a-structure-shared-home-about-cases.md` (Approved): "Production ACF runbook — outline", AC-22, AC-23;
  - `docs/adr/0006-phase-5-content-model.md` (Accepted), decision 2;
  - the 5a Dev report, checkpoint section (`docs/reports/phase-5a-structure-shared-home-about-cases.md` on
    `feat/phase-5a`): D1 (CPT excluded), I-1 (orphan `subtitle` meta), checkpoint decisions 1–4;
  - the Phase 3b runbook and report (format, SSH access, Appendix A pattern).
- Must be done **before** the 5a PR's Vercel preview is checked (5a AC-22). "CMS first, frontend second"
  (`docs/ai/WORKFLOW.md`, Release process).

## Goal
Production WordPress (`cms.magnetomarketing.co`) gets the Phase 5 ACF schema by importing the **same reviewed file** that
was imported locally: `docs/acf/phase-5-field-groups.json` (field groups only). Afterwards:
- the 13 existing groups are updated in place, and `packagesContentSections` is created (14 groups);
- the ACFML dump equals the local post-import dump;
- introspection shows every Phase 5 field;
- the **currently live** frontend gets byte-identical EN GraphQL responses before and after.

Every step has a backup and a rollback. No content is written. The orphan meta that the widened `finalCtaSection` location
exposes is **reported, not fixed**.

## Evidence (facts verified now, 2026-10-26, local and repo, read-only)
No production request was made to write this spec. Production facts are collected by step 0.

**E1. Import artifacts** (Dev working tree on `feat/phase-5a`, untracked until the Dev's commit 1):
```
0477e8c9b6f07904683b36abbc5a0839e2159d6f99ee2ba894e12c4c8f6ed201  docs/acf/phase-5-before.json
690e734e59f8d6a49fc16ea8607317c9e97833f7af5c3e83411d17d7579c27bb  docs/acf/phase-5-field-groups.json
050c519005a5df475fc5bce1588f357f306c046b77a87ce66697a602b93c8e09  scripts/phase-5a/acf-json-diff.mjs
```
- `phase-5-before.json`: 14 entries = 13 field groups + the ACF post type `post_type_689bb2945f206` ("Projects",
  `post_type: project`, `modified: null`, `import_date: ""`).
- `phase-5-field-groups.json`: 14 field groups, no post type (D1).
- AC-7b diff before → field groups (Dev report E1): 35 added (34 fields + 1 group), removed 0, 10 changed keys (3 default
  removals, the `finalCtaSection` location + `graphql_types`, 6 legacy `instructions`), reordered 0. Approved at the
  checkpoint (decision 1).
- `acf-json-diff.mjs` self-test: `phase-5-before.json` against itself → `groups: 13 → 13`, the CPT listed under
  "Excluded by design" on both sides, Added 0, Removed 0, Changed 0, Reordered 0, exit 0. Step 0.6 expects exactly
  this output.

**E2. How ACF imports** (ACF PRO 6.8.10, local plugin source):
- `includes/admin/tools/class-acf-admin-tool-import.php:187-205`: each JSON entry is matched to an existing post **by
  `key`**. If one exists, its ID is reused (update in place); otherwise a new post is created. Entries absent from the
  file are left alone, so the CPT isn't touched by a groups-only file.
- `includes/post-types/class-acf-field-group.php:475-510`: when a group already exists, every field in the database
  whose key isn't in the file is **deleted** (`acf_delete_field`).
- So the import is safe **only if** production's groups equal `phase-5-before.json`. A production-only field would be
  deleted; a different key would create a duplicate group. That's what step 0.6 proves.
- Deleting or adding a field definition never deletes post meta.

**E3. Local post-import state** (the target production must match):
- Extended ACFML dump (Appendix C) on local: 120 lines, 14 groups, all `mode=translation`, 0 × `pref=-`,
  sha256 `c2b12bcd…a27c12164`. `finalCtaSection`:
  ```
  == finalCtaSection | key=group_689a58f582e2e | mode=translation | types=["Page","Project"] | loc=post_type==page OR post_type==project
     title [text] pref=2 · subtitle [text] pref=2 · prefooter_cta_text [text] pref=2 · prefooter_cta_link [url] pref=1
     cta_path [text] pref=2 · secondary_cta_text [text] pref=2 · secondary_cta_path [text] pref=2 · bgimage [image] pref=1
  ```
  (no `default=` on any `finalCtaSection` field; one line per field in the real output.)
- Schema check (Appendix B) on local: `schema checks 37/37 OK`.

**E3b. Before → after, measured on local** (step 4.2's expectation):
- Pre-import dump: `~/Documents/projects/magneto/backups/phase-3b/acfml-local.txt` (2026-10-25 14:49, 85 lines,
  sha256 `bf66e1ca…c058f`). That's the `WP-SETUP.md` dump format. Then, local = production: the Phase 3b step 5d `diff
  acfml-local.txt acfml-prod-after.txt` was empty.
- The extended dump (Appendix C) reduces exactly to that format with this filter (the group key, types and location, and
  the field defaults are removed):
  `sed -E 's/ \| key=[^|]* \|/ |/; s/ \| types=.*$//; s/ default=.*$//'`
  Checked: today's local extended dump, filtered = today's local `WP-SETUP.md`-format dump (`diff` empty).
- `diff acfml-local.txt <filtered post-import local dump>`: **0 lines removed, 35 added**, in 15 hunks, all
  additions (`3a4 8a10,11 12a16 17a22,24 36a44,47 39a51 43a56 55a69 59a74,75 61a78,80 63a83 74a95,96 79a102,104 81a107
  85a112,120`). The 35 lines = the 34 new fields + the `Packages - Content Sections` header. sha256 of the diff
  `6136656a…3916e`.
- This filtered format can't show the `finalCtaSection` location, types and defaults. Those are covered by step 4.1
  (the full extended dump must equal local).

**E4. The live frontend and its queries.**
- Production runs Phase 4 (`55d4350`, merged PR #14, promoted 2026-10-25, Phase 4 report). `git log 55d4350..master
  -- src` is empty, so `master` has the same frontend code.
- Appendix A extracts the 19 `query` templates from `55d4350` (it resolves `${mediaOriginalFields(…)}` and constants)
  and sends 31 EN requests:
  - every route `api.ts`;
  - hero × 6 page names, `PageExists` × 6;
  - project by slug × 3 slugs + `no-existe`;
  - the home sections, footer, final CTA, lead magnet, testimonials, `GetProjects` (with and without variables) and site
    metadata.
- Local run (after the local import), twice: `queries 31 total sha256 d307cf73…9711`, identical both times. Every
  request is `200 ok` except `GetAboutTexts` (`ERR`).
- `GetAboutTexts` (`src/data/about.ts`) has no importer at `55d4350`: dead code that queries a non-existent root field.
  It is expected to be `ERR` before and after, with the same hash.
- The live code reads `finalCtaSection` only on the home page (`FinalCTASection/api.ts`), and none of its queries
  select a Phase 5 field. So the widened location and the new fields can't change any live response, and the home
  values can't change because the home page has saved values (step 0.8).
- Local proof of the home part (Dev report E6): the home final CTA EN/FR/ES GraphQL `data` hash was identical before and
  after the local import.

**E5. Orphan meta exposed by the widened location** (Appendix D, local, read-only; Dev report I-1):
```
OWN 2 page home/en title="Ready to stop guessing and start converting?" ref=field_689a58f65e417
OWN 2 page home/en subtitle="Whether you need a full system or just one piece, we’ll guid…" ref=field_689a592f5e419
OWN 2 page home/en prefooter_cta_text="Get Your Free Strategy Call" ref=field_689a59405e41a
OWN 2 page home/en prefooter_cta_link="https://calendly.com/magnetomarketing/free-strategy-call" ref=field_689a594e5e41b
OWN 2 page home/en bgimage="52" ref=field_68c72ae49677b
ORPHAN 32 page about-magneto/en title=(empty) ref=field_689a30ee3e806
ORPHAN 32 page about-magneto/en subtitle="Montreal-based solo agency for websites and funnels that sel…" ref=field_689a2dbb60320
ORPHAN 34/36/38/41 (services, packages, projects, contact): the same pair, title=(empty), subtitle=<old hero subtitle>
OWN 535 / 536 (FR/ES home): same 5 rows as EN · ORPHAN 558 projects/fr: same pair as 38
posts 15 · rows 27
```
- `ref` = the field key stored in the `_<name>` meta. The `subtitle` orphans point at `heroContent.subtitle_hero`
  (`field_689a2dbb60320`); the empty `title` orphans point at other groups' fields.
- After the widening, GraphQL returns these values as `finalCtaSection.subtitle` on those pages. The 5a frontend hides
  them, because it falls back to the home values as a whole when the page's `title` is empty (unit-tested, Dev E8).
- **An orphan `title` with a value would not be hidden:** the 5a frontend would render that page's own final CTA. Locally
  every orphan `title` is empty. Step 0.8 checks production.

**E6. Access** (Phase 3b report; values from Mauricio, 2026-10-26): SSH works on SiteGround, `wp` is available, and `wp
db export` worked.
- SSH: `u3112-w527ltde781s@giowm1219.siteground.biz`, port `18765`, key `~/.ssh/siteground_magneto_v2`.
- WordPress root: `~/www/cms.magnetomarketing.co/public_html`. `wp eval-file -` (PHP from stdin) works with the local WP-CLI;
every PHP check below uses it, so nothing is uploaded to the server.

## Assumptions and open questions
- **A1:** `~/.ssh/siteground_magneto_v2.pub` is registered in Site Tools → Devs → SSH Keys Manager for the user in E6.
  Step 0.3 proves the connection and the WordPress root (`wp option get siteurl`).
- **A2:** production plugin versions still equal local (Phase 3b): WPGraphQL 2.25.0, WPGraphQL for ACF 3.0.0, ACF PRO
  6.8.10, WPML 4.7.6, ACFML 2.1.5, WPML GraphQL 1.1.3. Step 0.3 checks; any difference → stop.
- **A3:** production has no FR/ES pages yet (Phase 3b E3; content is 5c). Step 0.8's expected output is therefore the
  EN rows of E5 only. More rows are reported, not a stop by themselves.
- **D-a (decided):** the Dev keeps the Phase 3b D3 read-only production access: GraphQL `query` POSTs and GETs. No
  SSH, no admin, no REST writes.
- **A5:** nobody edits WordPress content during the window (the step 1 DB backup is the rollback point).

## Design — the runbook

**Roles:**
- **Mauricio** runs every production command (SSH) and every admin action. Each step below is **one** command or one
  admin action.
- **The Dev** runs the read-only GraphQL checks (Appendices A and B) and local comparisons, and answers each "step N
  done" with pass/fail **before** Mauricio continues. Mauricio can run them himself if the Dev isn't available.
- Read-only means: `wp option get`, `wp plugin list`, `wp eval-file` with the read-only scripts below, `wp db export`,
  GraphQL queries, GETs. The only production writes are step 3 (import), step 6.1 (cache flush) and, if needed, the
  rollback.

**Rules for the window:**
- Work in a quiet window. Nobody edits WordPress content until step 8 is done.
- Before every admin action, check that the address bar shows `cms.magnetomarketing.co/wp-admin`.
- Run the steps in order. A **STOP** means: do nothing more in production, write it in the notes, tell the Dev/Architect.
- Keep notes (times, anything unexpected) in `$RB/notes.md`. The Dev turns them into the report.

### Preparation (before the window)
- **P1 (Dev):** the Dev's commit 1 (`feat(acf): …`) is pushed on `feat/phase-5a`. Note its short SHA in the notes. The
  runbook runs from a checkout of that commit (`$REPO`).
- **P2 (Dev):** save Appendix A as `$RB/live-capture.mjs`, Appendix B as `$RB/schema.mjs`, Appendix C as
  `$RB/acfml-dump.php` and Appendix D as `$RB/orphans.php`. They live outside the repo.
- **P3 (Dev, local, read-only):**
  - run Appendices C and D against **local** with Local's WP-CLI (as in the Dev report) into
    `$RB/acfml-local-after.txt` and `$RB/orphans-local.txt`. Expected: E3 (120 lines, sha256 `c2b12bcd…`) and E5;
  - write the measured local before → after diff (E3b) as step 4.2's reference:
    ```bash
    diff ~/Documents/projects/magneto/backups/phase-3b/acfml-local.txt <(sed -E 's/ \| key=[^|]* \|/ |/; s/ \| types=.*$//; s/ default=.*$//' "$RB/acfml-local-after.txt") > "$RB/4.2-local.diff"; shasum -a 256 "$RB/4.2-local.diff"
    ```
    Expected: `6136656a…3916e`.
- **P4 (Mauricio, every new terminal):** one line:
  ```bash
  export SG_HOST='u3112-w527ltde781s@giowm1219.siteground.biz' WP_ROOT='~/www/cms.magnetomarketing.co/public_html' RB="$HOME/Documents/projects/magneto/backups/phase-5a-prod" REPO="$HOME/Documents/projects/magneto/web-app-GrapgQL"; mkdir -p "$RB"
  ```
  `WP_ROOT` keeps a literal `~`: it's expanded by the **server** shell inside `"cd $WP_ROOT && …"`, so it resolves to
  the SiteGround home, not the laptop's.
  Every SSH command below has the form `ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && …"`.
  If the key has a passphrase, `ssh-add --apple-use-keychain ~/.ssh/siteground_magneto_v2` once avoids retyping it.

### Step 0 — Preconditions (read-only, ≈15 min). Any STOP here: nothing has changed.
**0.1 (Dev) Artifacts.**
```bash
cd "$REPO" && git status --short docs/acf scripts/phase-5a/acf-json-diff.mjs && shasum -a 256 docs/acf/phase-5-before.json docs/acf/phase-5-field-groups.json scripts/phase-5a/acf-json-diff.mjs
```
Expected: no `git status` lines (committed) and the three hashes of E1. Otherwise STOP: the file to import isn't the
approved one.

**0.2 (Mauricio, admin) Live frontend commit.** Vercel → Project → Deployments → the **Production** deployment → its
commit. Expected: `55d4350`, or a later commit for which `git log 55d4350..<sha> -- src` is empty. Otherwise STOP and
tell the Dev (Appendix A's commit must change).

**0.3 SSH + inventory.**
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp option get siteurl && wp plugin list --fields=name,status,version --format=csv" | tee "$RB/0.3-inventory.txt"
```
Expected: a `cms.magnetomarketing.co` URL, and the A2 plugins `active` at those versions. A version difference → STOP.

**0.4 ACFML dump, before.**
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp eval-file -" < "$RB/acfml-dump.php" | tee "$RB/0.4-acfml-prod-before.txt" | grep -c '^=='
```
Expected: `13`. The Dev checks: all `mode=translation`, no `pref=-`, `finalCtaSection` location `post_type==page AND
page==2` with `default=` on `title`, `subtitle`, `prefooter_cta_text`. This file is the "before" of step 4.2.

**0.4b (Dev) Production still = the Phase 3b state.**
```bash
diff ~/Documents/projects/magneto/backups/phase-3b/acfml-local.txt <(sed -E 's/ \| key=[^|]* \|/ |/; s/ \| types=.*$//; s/ default=.*$//' "$RB/0.4-acfml-prod-before.txt") && echo IDENTICAL
```
Expected: `IDENTICAL` (Phase 3b 5d left production = this file). Otherwise STOP: someone changed production's ACF since
2026-10-25, and 0.6 will very likely fail too.

**0.5 (Mauricio, admin) Production ACF export, everything.** ACF → Tools → Export → select **all field groups and the
"Projects" post type** (everything listed) → Export As JSON. Then:
```bash
mv ~/Downloads/acf-export-*.json "$RB/acf-prod-before.json" && ls -l "$RB/acf-prod-before.json"
```
(If `~/Downloads` holds older `acf-export-*.json` files, move the newest one by its exact name.) Exporting writes
nothing; the file is also a backup of production's definitions.

**0.6 (Dev or Mauricio) Field groups: production = `phase-5-before.json`.**
```bash
cd "$REPO" && node scripts/phase-5a/acf-json-diff.mjs docs/acf/phase-5-before.json "$RB/acf-prod-before.json" | tee "$RB/0.6-diff-groups.txt"
```
Expected, exactly (the E1 self-test output):
- `groups: 13 → 13`;
- Excluded: `before: post_type_689bb2945f206 [post_type] Projects` and `after: post_type_689bb2945f206 [post_type] Projects`;
- `Added (0)`, `Removed (0)`, `Changed settings (0 keys)`, `Existing keys reordered (0)`.

**Any other line → STOP** (E2: the import would delete or duplicate something). If `after:` has no post type, the export
missed it: redo 0.5.

**0.7 (Dev or Mauricio) Project post type: production = `phase-5-before.json`** (D1; the diff script doesn't compare it).
```bash
cd "$REPO" && node -e 'const fs=require("fs");const pick=p=>JSON.parse(fs.readFileSync(p,"utf8")).filter(e=>!String(e.key).startsWith("group_")).map(({modified,...r})=>r).sort((x,y)=>x.key<y.key?-1:1);const [a,b]=process.argv.slice(1).map(pick);const ka=a.map(e=>e.key).join(",")||"-",kb=b.map(e=>e.key).join(",")||"-";const diff=a.flatMap((e,i)=>Object.keys({...e,...b[i]}).filter(k=>JSON.stringify(e[k])!==JSON.stringify((b[i]||{})[k])).map(k=>e.key+"."+k));console.log("non-group entries:",ka,"/",kb,"· equal (ignoring modified):",ka===kb&&diff.length===0,diff.length?"· differ: "+diff.join(" "):"")' docs/acf/phase-5-before.json "$RB/acf-prod-before.json" | tee "$RB/0.7-cpt.txt"
```
Expected: `non-group entries: post_type_689bb2945f206 / post_type_689bb2945f206 · equal (ignoring modified): true`.
`false` → STOP, even though the import doesn't contain the CPT: it means production's definitions aren't the reviewed
baseline. (Checked locally: the same file against itself → `true`; against the groups-only file → `false` with every
setting listed.)

**0.8 Orphan meta + home saved values (report, don't fix).**
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp eval-file -" < "$RB/orphans.php" | tee "$RB/0.8-orphans.txt"
```
Expected (A3): the EN rows of E5.
The Dev classifies every row:

| Row | Rule |
|---|---|
| `OWN 2 … title` / `subtitle` / `prefooter_cta_text` present | **Required.** If any is missing, removing the defaults would change the live home → **STOP**. |
| `ORPHAN … subtitle` / `prefooter_*` / `bgimage` with a value, `title` empty or absent on that post | Report only. Hidden by the 5a whole-object fallback. Cleanup phase. |
| `ORPHAN … title` **with a value** (any post) | Report. **Doesn't block this import** (the live frontend reads only home), but **blocks the 5a promote**: that page would render its own wrong final CTA. Mauricio + Senior Architect decide (5c loader writes `title` + `subtitle` for that page, or the 5a frontend ignores orphans). |
| `OWN` rows on a post other than home (2) | Report (saved under an older location). Same rule as above for `title`. |
| Rows on FR/ES posts | Report (A3 didn't expect them). |

Nothing in this step is fixed in production. The 5c loader rule stands: it always writes `finalCtaSection` `title` and
`subtitle` together.

**0.9 (Dev) Schema baseline.**
```bash
node "$RB/schema.mjs" https://cms.magnetomarketing.co/graphql | tee "$RB/0.9-schema-before.txt"
```
Expected: fewer than 37 OK, with `MISSING` listing the Phase 5 fields (proves step 5 measures a real change).

### Step 1 — Backups (≈10 min). Nothing changes before both exist.
**1.1 (Mauricio, admin)** Site Tools → Security → Backups → Create Backup, named `phase-5a-acf-before-<yyyymmdd-hhmm>`.
Wait until it's listed.

**1.2 DB export to the laptop** (stdout, so no copy stays on the server):
```bash
F="$RB/phase-5a-acf-before-$(date +%Y%m%d-%H%M).sql"; ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp db export -" > "$F" && ls -l "$F" && tail -n 1 "$F"
```
Expected: a few MB (Phase 3b: ≈3.7 MB) and a last line `-- Dump completed on …`. Otherwise repeat; don't continue
without it. Note both backup names and times.

### Step 2 — Before-capture (Dev, read-only, ≈3 min)
```bash
cd "$REPO" && node "$RB/live-capture.mjs" https://cms.magnetomarketing.co/graphql . 55d4350 | tee "$RB/2-before.txt" | tail -1
```
Run it **twice** (second time into `$RB/2-before-2.txt`). Expected: `queries 31 total sha256 <X>` with the same `<X>`
both times. Every line `200 ok`, except `GetAboutTexts` `ERR` (E4). If the two runs differ, content is changing: STOP
until it's quiet. `<X>` is the baseline for step 7.

### Step 3 — Import (Mauricio, admin, ≈5 min) — the only schema write
ACF → Tools → **Import Field Groups** → choose `$REPO/docs/acf/phase-5-field-groups.json` → **Import JSON**.
- Expected notice: **"Imported 14 items"**, listing the 13 existing group titles and "Packages - Content Sections".
- Then ACF → Field Groups: **14** groups, each title once (no duplicates), all active. Don't click "Sync" or
  anything else.
- Tell the Dev "step 3 done". Different count or a duplicate title → rollback row 2.

### Step 4 — ACFML check (≈5 min)
**4.1 Dump, after.**
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp eval-file -" < "$RB/acfml-dump.php" > "$RB/4-acfml-prod-after.txt"; diff "$RB/acfml-local-after.txt" "$RB/4-acfml-prod-after.txt" && echo IDENTICAL
```
Expected: `IDENTICAL` (production = local post-import, E3).
- If only `pref=` values differ, fix those fields by hand (ACF → the group → Multilingual Setup / field preference),
  as in Phase 3b step 5c, then repeat 4.1.
- Any other difference → STOP, the Dev reads it, then the rollback table.

**4.2 (Dev) Production before → after = the measured local before → after (E3b).**
```bash
diff <(sed -E 's/ \| key=[^|]* \|/ |/; s/ \| types=.*$//; s/ default=.*$//' "$RB/0.4-acfml-prod-before.txt") <(sed -E 's/ \| key=[^|]* \|/ |/; s/ \| types=.*$//; s/ default=.*$//' "$RB/4-acfml-prod-after.txt") > "$RB/4.2-prod.diff"; diff "$RB/4.2-local.diff" "$RB/4.2-prod.diff" && echo IDENTICAL
```
Expected: `IDENTICAL`: production gained exactly the 35 lines local gained (0 removed, 15 hunks, same positions).
The `finalCtaSection` location, types and defaults are invisible in this filtered format; step 4.1 already proved them.
A difference → STOP, the Dev reads `4.2-prod.diff`, then the rollback table (row 4).

### Step 5 — Schema check (Dev, read-only)
```bash
node "$RB/schema.mjs" https://cms.magnetomarketing.co/graphql | tee "$RB/5-schema-after.txt"
```
Expected: `schema checks 37/37 OK` (includes `Project.finalCtaSection` and `Page.packagesContentSections`).

### Step 6 — Caches (≈3 min)
**6.1** `wp cache flush`:
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp cache flush"
```
Expected: `Success: The cache was flushed.`

**6.2 (admin)** Site Tools → Speed → Caching → Dynamic Cache → Flush.

### Step 7 — After-capture + live site (Dev, read-only, ≈5 min)
**7.1**
```bash
cd "$REPO" && node "$RB/live-capture.mjs" https://cms.magnetomarketing.co/graphql . 55d4350 > "$RB/7-after.txt"; diff "$RB/2-before.txt" "$RB/7-after.txt" && echo IDENTICAL
```
Expected: `IDENTICAL`. Any difference → rollback row 1.

**7.2**
```bash
for u in / /services /packages /projects /about-magneto /contact /projects/trepied-trepied-ca /esto-no-existe; do curl -s -o /dev/null -w "%{http_code} $u\n" "https://www.magnetomarketing.co$u"; done
```
Expected: 7 × `200` and `/esto-no-existe` `404`. Wait 2 min (ISR 60 s), then Mauricio looks at `/`, `/about-magneto`
and one project in a browser: unchanged, including the home final CTA "Ready to stop guessing and start converting?".

### Step 8 — After backup (≈3 min)
```bash
F="$RB/phase-5a-acf-after-$(date +%Y%m%d-%H%M).sql"; ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp db export -" > "$F" && ls -l "$F" && tail -n 1 "$F"
```
Expected: as 1.2. The window is over; content editing may resume.

### Step 9 — Preview (not a CMS step)
Redeploy the 5a PR preview and run 5a AC-23 (WORKFLOW checklist + 5a AC-8 to AC-12 against production data, state C).
Record the result in the PR. If 0.8 found an orphan `title` with a value, the PR must not merge until that decision is
made.

### Rollback (decide by symptom, least invasive first)
| # | Symptom | Action (Mauricio) |
|---|---|---|
| 0 | STOP in step 0, 1 or 2 | Nothing has changed. Write the notes, tell the Dev/Architect. |
| 1 | Step 7.1 not `IDENTICAL`, or a live page changed | Restore the step 1.2 dump (one command, below), then step 6, then re-run 7.1: it must equal `2-before.txt`. If the restore fails: SiteGround → Backups → `phase-5a-acf-before-…` → Restore → **Databases** only. |
| 2 | Step 3: not "Imported 14 items", duplicate group titles, or an import error | Don't retry. Rollback as row 1. |
| 3 | Step 4.1: only `pref=` differences | Fix by hand (step 4.1), no rollback. |
| 4 | Step 4.1/4.2/5: other differences, live site OK (7.1 IDENTICAL) | STOP and decide with the Architect. The live site is safe; a rollback (row 1) is optional and only undoes the schema. |
| 5 | Problem only in the 5a preview | No CMS rollback (the change is additive). Fix the frontend. |

Restore command (production write, Mauricio only, nobody else editing):
```bash
ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && wp db import -" < "$RB/phase-5a-acf-before-<yyyymmdd-hhmm>.sql"
```

### Step 10 — Records (Dev, after the run)
- `docs/reports/phase-5a-production-acf-runbook.md`: from `$RB/notes.md` and the step files, Phase 3b report format,
  including every command run against production.
- `docs/ai/WP-SETUP.md`: "(prod)" change-log rows (backups, import, cache flush) and the production line "ACFML: 14
  groups …".
- The 0.8 orphan list goes in the report's "Issues found" and is linked from the cleanup phase row in WORKFLOW (by the
  Dev's report, not by editing WORKFLOW).

## Files touched by this task
- `docs/specs/phase-5a-production-acf-runbook.md`: this runbook (Architect).
- After execution (separate instruction, Dev): the report and the `WP-SETUP.md` rows above. Outside the repo: `$RB/*`.
- No code changes. No change to `docs/acf/*` (if step 0 fails, the JSON is **not** edited to fit production without a new
  checkpoint decision).

## Out of scope
- Any content write: final CTA values, testimonials, `displayOrder`, heroes (5c loader, release day).
- Fixing orphan meta (cleanup phase; 5c writes `title` + `subtitle` together).
- WP `generalSettings.title` → "Magneto Web Consulting" (release-day runbook, 5a spec O3).
- The project CPT (excluded by D1), WPML settings, plugins, the WPML Production key (Phase 3b O-1/O-2).
- Vercel settings; merging or promoting the 5a PR.

## Acceptance criteria
- [ ] P3: local dump = E3 (120 lines, `c2b12bcd…`); local orphan list = E5; `4.2-local.diff` = `6136656a…`.
- [ ] 0.1: artifacts committed, hashes = E1.
- [ ] 0.2: production frontend commit recorded; Appendix A's commit matches.
- [ ] 0.3: siteurl is `cms.magnetomarketing.co`; plugin versions = A2.
- [ ] 0.4b: production's filtered dump = `phase-3b/acfml-local.txt` (`IDENTICAL`).
- [ ] 0.6: the diff output is exactly the expected one (13 → 13, the CPT excluded on both sides, 0 / 0 / 0 / 0).
- [ ] 0.7: `equal (ignoring modified): true`.
- [ ] 0.8: home 2 has saved `title`, `subtitle`, `prefooter_cta_text`. Every orphan row is listed in the report and
  classified. Any orphan `title` with a value is escalated before the 5a promote.
- [ ] Two backups exist before step 3 (names, times, the `Dump completed` line).
- [ ] Step 2: two identical before-captures (31 requests).
- [ ] Step 3: "Imported 14 items"; 14 groups, no duplicates.
- [ ] Step 4.1 `IDENTICAL` (or only pref fixes, recorded). Step 4.2 `IDENTICAL` (0 removed, 35 added, as measured
  locally).
- [ ] Step 5: 37/37 OK (0.9 showed fewer before).
- [ ] Step 7.1 `IDENTICAL`; 7.2: 7 × 200 + 404; Mauricio's visual check unchanged.
- [ ] After backup taken (step 8).
- [ ] The Dev's production access was read-only (queries and GETs). The report lists every command run against
  production, by whom.

## Decisions (resolved — 2026-10-26, Mauricio)
- **D-a — yes:** the Dev has read-only production access for this run, as in Phase 3b D3: GraphQL queries and GETs. No
  SSH, no admin.
- **D-b — yes:** an orphan `title` with a value (step 0.8) doesn't block the import, but blocks the 5a promote. The fix
  is chosen when it happens (5c loader write, or the frontend ignoring orphans).
- SSH values and the WordPress root: filled in (E6).
- No ADR needed: this executes ADR 0006 decision 2.

## Estimate
- Mauricio's active time: **≈ 45–70 min** (step 0: 15–20 · backups: 10 · import: 5 · ACFML: 5–10 · caches: 3 · visual:
  5 · after backup: 3), plus the first SSH with the new key (≈ 5 min).
- Dev: prep P1–P3 ≈ 20 min; read-only checkpoints during the run ≈ 2–3 min each; report + `WP-SETUP.md` ≈ 30 min.

## Appendix A — live-frontend EN capture (read-only)
Run it from the repo (it reads the queries of the pinned commit with `git`). It sends only `query` operations and throws
if it finds a mutation. `NORM=1` replaces the CMS host so a local and a production run can be compared.
```js
// Read-only. Replays the EN GraphQL queries of the live frontend (pinned commit) against a CMS and prints one
// sha256 per request plus a total. Usage: node live-capture.mjs <graphql-url> [repo-dir] [commit]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const [EP, REPO = ".", REF = "55d4350"] = process.argv.slice(2);
if (!EP) { console.error("usage: node live-capture.mjs <graphql-url> [repo] [commit]"); process.exit(2); }
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" });
// Every non-test source file at REF that defines a `query Name` template.
const FILES = git("grep", "-l", "-E", "query [A-Za-z]+ *[({]", REF, "--", "src", ":!*.test.*")
  .trim().split("\n").map((l) => l.slice(REF.length + 1));
// Same output as src/utils/wp-media.ts mediaOriginalFields() at REF (checked below).
const mediaOriginalFields = (s) => `databaseId languageCode translations @include(if: $mediaOriginal) { languageCode ${s} }`;
if (!git("show", `${REF}:src/utils/wp-media.ts`).includes("return `databaseId languageCode translations @include(if: $mediaOriginal) { languageCode ${subfields} }`;"))
  throw new Error("mediaOriginalFields changed at REF; update this script");
const PAGES = ["home", "services", "projects", "packages", "about-magneto", "contact"];
const SLUGS = ["trepied-trepied-ca", "shamaniccas-ecommerce", "fashion-company-ecommerce", "no-existe"];
const jobs = [];
for (const f of FILES) {
  const src = git("show", `${REF}:${f}`);
  const consts = {};
  for (const m of src.matchAll(/const ([A-Z_]+) = (['`])([^'`]*)\2/g)) consts[m[1]] = m[3];
  const resolve = (expr) => {
    const call = expr.match(/^mediaOriginalFields\((?:'([^']*)'|([A-Z_]+))\)$/);
    if (call) return mediaOriginalFields(call[1] ?? consts[call[2]]);
    if (expr in consts) return consts[expr];
    throw new Error(`${f}: cannot resolve \${${expr}}`);
  };
  // Templates may start with `# comment` lines (GET_PROJECTS).
  for (const m of src.matchAll(/`((?:\s*#[^\n]*)*\s*query [A-Za-z][\s\S]*?)`/g)) {
    const query = m[1].replace(/\$\{([^}]+)\}/g, (_, e) => resolve(e.trim()));
    if (/\bmutation\b/i.test(query)) throw new Error("mutation found");
    const vars = { language: "en", mediaOriginal: false };
    const name = query.match(/query (\w+)/)[1];
    if (/\$slug\b/.test(query)) for (const slug of SLUGS) jobs.push([`${name} slug=${slug}`, query, { ...vars, slug }]);
    else if (/\$name\b/.test(query)) for (const n of PAGES) jobs.push([`${name} name=${n}`, query, { ...vars, name: n }]);
    else jobs.push([name, query, vars]);
    // sitemap.xml sends GET_PROJECTS without variables.
    if (name === "GetProjects") jobs.push([`${name} (no variables)`, query, {}]);
  }
}
const sha = (s) => createHash("sha256").update(s).digest("hex");
const all = createHash("sha256");
for (const [name, query, variables] of jobs) {
  const r = await fetch(EP, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json",
    "User-Agent": "MagnetoProxy/1.0 (+https://www.magnetomarketing.co)" }, body: JSON.stringify({ query, variables }) });
  const j = await r.json(); delete j.extensions;
  let body = JSON.stringify(j);
  if (process.env.NORM === "1") body = body.replace(/https?:\\?\/\\?\/(cms\.magnetomarketing\.co|magneto-cms-2\.local)/g, "HOST");
  all.update(name + "\n" + body + "\n");
  console.log(r.status, j.errors ? "ERR" : "ok ", String(body.length).padStart(6), sha(body).slice(0, 16), name);
}
console.log("queries", jobs.length, "total sha256", all.digest("hex"));
```

## Appendix B — schema check (read-only)
```js
// Read-only introspection: every Phase 5 GraphQL field exists. Usage: node schema.mjs <graphql-url>
const EP = process.argv[2];
const EXPECT = {
  Project: ["finalCtaSection"], Page: ["packagesContentSections", "finalCtaSection"],
  FinalCtaSection: ["ctaPath", "secondaryCtaText", "secondaryCtaPath"],
  HomeAboutSection: ["descriptionHtml"], AboutData: ["descriptionHtml", "ctaText", "ctaPath"],
  ProjectsProjectData: ["cardDescription", "displayOrder"], Pageintrotext: ["introBodyHtml"],
  ServicesServiceDetails: ["coreHeading", "supportingHeading", "supportingIntro"],
  ContactContactTexts: ["supportingHtml"], HomeFeaturedServicesService: ["serviceTagline"],
  HomeTestimonialsSectionTestimonials: ["role", "company", "city", "note"],
  ServicesServiceDetailsServices: ["heading", "descriptionHtml", "ctaText", "ctaPath", "anchorId", "serviceGroup"],
  PackagesPackageFeaturesPackagesElements: ["heading", "descriptionHtml", "featuresTitle", "ctaText", "ctaPath", "anchorId"],
  PackagesContentSections: ["sections"], PackagesContentSectionsSections: ["heading", "bodyHtml"],
};
const q = "query {" + Object.keys(EXPECT).map((t, i) => `t${i}: __type(name: "${t}") { fields { name } }`).join(" ") + "}";
const r = await fetch(EP, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
const j = await r.json();
let ok = 0, missing = [];
Object.entries(EXPECT).forEach(([t, fs], i) => {
  const have = new Set((j.data?.[`t${i}`]?.fields ?? []).map((f) => f.name));
  for (const f of fs) have.has(f) ? ok++ : missing.push(`${t}.${f}`);
});
console.log(`schema checks ${ok}/${ok + missing.length} OK`, missing.length ? `MISSING: ${missing.join(", ")}` : "", j.errors ? "ERRORS" : "");
```

## Appendix C — ACFML dump, extended (read-only, `wp eval-file -`)
The `WP-SETUP.md` dump plus the group key, GraphQL types, location and each field's default (first 60 characters).
```php
<?php
// Read-only. ACFML mode + key + GraphQL types + location per group; name, type, pref and default per field.
foreach ( acf_get_field_groups() as $g ) {
  $loc = implode( ' OR ', array_map( fn( $and ) => implode( ' AND ', array_map( fn( $r ) => $r['param'] . $r['operator'] . $r['value'], $and ) ), $g['location'] ) );
  echo '== ' . $g['title'] . ' | key=' . $g['key'] . ' | mode=' . ( $g['acfml_field_group_mode'] ?? '-' ) . ' | types=' . wp_json_encode( $g['graphql_types'] ?? '' ) . ' | loc=' . $loc . PHP_EOL;
  $walk = function ( $f, $p = '' ) use ( &$walk ) {
    $d = $f['default_value'] ?? '';
    echo '   ' . $p . $f['name'] . ' [' . $f['type'] . '] pref=' . ( $f['wpml_cf_preferences'] ?? '-' ) . ( is_string( $d ) && $d !== '' ? ' default=' . wp_json_encode( mb_substr( $d, 0, 60 ) ) : '' ) . PHP_EOL;
    foreach ( ( $f['sub_fields'] ?? [] ) as $s ) { $walk( $s, $p . $f['name'] . ' > ' ); }
  };
  foreach ( acf_get_fields( $g['key'] ) as $f ) { $walk( $f ); }
}
```

## Appendix D — orphan meta check (read-only, `wp eval-file -`)
Lists every page/project meta whose name is a `finalCtaSection` field. `OWN` = its `_<name>` reference is that field's
key; `ORPHAN` = it references another field (an older or different group) but would still surface through the widened
location. Every post of every language, statuses other than auto-draft/trash/revision.
```php
<?php
// Read-only. Lists page/project meta that the widened finalCtaSection location would expose.
$own = [ 'title' => 'field_689a58f65e417', 'subtitle' => 'field_689a592f5e419',
  'prefooter_cta_text' => 'field_689a59405e41a', 'prefooter_cta_link' => 'field_689a594e5e41b',
  'cta_path' => 'field_p5_finalctasection_cta_path', 'secondary_cta_text' => 'field_p5_finalctasection_secondary_cta_text',
  'secondary_cta_path' => 'field_p5_finalctasection_secondary_cta_path', 'bgimage' => 'field_68c72ae49677b' ];
$ids = array_map( "intval", $GLOBALS["wpdb"]->get_col( "SELECT ID FROM {$GLOBALS["wpdb"]->posts} WHERE post_type IN ('page','project') AND post_status NOT IN ('auto-draft','trash','inherit') ORDER BY ID" ) );
$n = 0;
foreach ( $ids as $id ) {
  $lang = apply_filters( 'wpml_post_language_details', null, $id )['language_code'] ?? '-';
  foreach ( $own as $name => $key ) {
    if ( ! metadata_exists( 'post', $id, $name ) ) continue;
    $v = get_post_meta( $id, $name, true );
    $ref = get_post_meta( $id, '_' . $name, true );
    $kind = $ref === $key ? 'OWN' : 'ORPHAN';
    $s = is_scalar( $v ) ? (string) $v : wp_json_encode( $v );
    printf( "%s %d %s %s/%s %s=%s ref=%s\n", $kind, $id, get_post_type( $id ), get_post_field( 'post_name', $id ), $lang, $name,
      $s === '' ? '(empty)' : '"' . mb_substr( $s, 0, 60 ) . ( mb_strlen( $s ) > 60 ? '…' : '' ) . '"', $ref ?: '(none)' );
    $n++;
  }
}
echo "posts " . count( $ids ) . " · rows $n\n";
```
