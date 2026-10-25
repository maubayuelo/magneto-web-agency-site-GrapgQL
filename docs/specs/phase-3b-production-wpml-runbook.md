# Phase 3b — Production WPML rollout (runbook)

- Status: Approved — 2026-10-25 (Senior Architect: SSH check, D1 by-hand fix, D2 leave media as found, D3 Dev read-only access)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect) · **Executed by: Mauricio** (agents never write to production)
- Date: 2026-10-25
- Depends on: Phase 1 (local WPML, `docs/ai/WP-SETUP.md` "to repeat in production"), Phase 3 (PR #10, blocked)

## Goal
Production WordPress (`cms.magnetomarketing.co`) exposes the same WPML GraphQL schema and settings as
local Phase 1, so PR #10's Vercel preview builds. The **currently live** frontend sees byte-identical EN
GraphQL responses before and after. Every step has a backup and a rollback. Rule: **CMS first, frontend
second** (now in `docs/ai/WORKFLOW.md` → Release process).

## Evidence (facts verified now, 2026-10-25 ≈00:00, read-only)
This task's exception allowed read-only queries and GETs to production. No mutations. Scripts are in
`<scratchpad>/p3b/`; the capture script is reproduced in Appendix A.

**E1 — Production has no WPML schema** (introspection):
```
prod  RootQueryToProjectConnectionWhereArgs (lang|name): [name, nameIn]          ← no `language`
prod  RootQueryToPageConnectionWhereArgs:               [authorName, name, nameIn]
prod  MediaItem / Page lang|transl fields: []    root WPML fields: []    WPML types: []    types: 623
local same args + language · MediaItem/Page: language languageCode translationGroupId translations
      root: defaultLanguage languages · types: 624
generalSettings  prod {title:"Magneto CMS", url:"http://cms.magnetomarketing.co", language:""}
```
Vercel's errors reproduced on production:
```
{projects(first:1,where:{language:"en"}){…}} → Field "language" is not defined by type "RootQueryToProjectConnectionWhereArgs".
{mediaItems(first:1){nodes{languageCode translations{databaseId}}}} → Cannot query field "languageCode" / "translations" on type "MediaItem".
```

**E2 — ACF schema identical.** All 13 ACF groups exist in production. Recursive shape compare of the 13 root
types and their nested types (24 types; field names, kinds and type names): **0 differences**, prod vs local.
GraphQL does not expose ACF group/field **keys** (`group_…`/`field_…`), so key equality is not proven yet
(step 5a).

**E3 — Same content and IDs as local.**
```
pages     prod = local: 533 carte · 41 contact · 38 projects · 36 packages · 34 services · 32 about-magneto · 2 home
projects  prod = local: 498 trepied-trepied-ca · 224 shamaniccas-ecommerce · 270 fashion-company-ecommerce
media     prod 169 (ids 50–528) · local all-languages 185 · every prod id exists locally with the same file path
          local-only: 537, 539 (Phase 1) and 542–557 (created locally after Phase 1)
page 535 / 536 (local FR/ES home) → null in prod (expected) · mediaItem 53 (a FR copy locally) exists in prod
```
- Production already holds the **63 EN + 53 + 53 WPML media copies**. WPML was active on this DB at some point,
  so WPML tables and options may already exist (see A2).
- WPML is not filtering now: unfiltered `mediaItems` returns 169 in prod and 63 locally.

**E4 — "Before" capture of the live frontend's EN queries.**
- The 25 GraphQL requests the live code sends, extracted from `master` `d0c09c4` (Appendix A):
  - every route `api.ts`;
  - `HeroLoader` × 6 page URIs;
  - project by slug × 3 slugs + `no-existe`;
  - the home sections, footer, header, `GET_PROJECTS` and site metadata.
- Run twice on production; identical both times:
```
queries 25 total sha256 b0517e270008bbb445bec4f308d908be930789fe243d55657e77eb72e725aaa4      ← BEFORE (raw)
200 ok  2877 3037947cd598176c about-magneto · 1721 ae8242091bd89dcc contact · 2562 3f9525a426f5e1f4 packages
200 ok   154 99beb1e3fb5c1f71 projects page · 4196 6c101a6ae2a7dd81 services · 38047 ebd0117fcb5b4f4a GET_PROJECTS
200 ok 13435 2c978f53602bbc94 trepied · 13528 257bdeb1c2295ebf shamaniccas · 11111 4f4db55da9e17e6a fashion · 25 255fa231f082dd3a no-existe
200 ok  3160 fb3470a124d1cb2d HeroLoader "/" · 108 ec966768a706970a site metadata · (full list: <scratchpad>/p3b/prod-before-1.txt)
```
- **Dry-run evidence:** the same 25 queries against **local**, which has WPML + ACFML + WPML GraphQL
  configured, return the **same** data once the CMS host is normalized (`NORM=1`). The total is
  `f3d5a3e0d6dfb2cce5f2f7ba20e0f9b0489631184072ebefbdbe4315daa424d8` on both, **25/25 identical**.
- So activating and configuring WPML as in Phase 1 does not change any EN response the live site uses. This
  is proven on a copy of this database; the real proof is the after-capture in step 6.
- Other GETs:
  - `GET /wp-json/wp/v2/media/484` (lead-magnet PDF, used by the live lead magnet and `pages/api/download*`)
    → 200, `…/uploads/2025/10/6-killers-strategies-to-get-clients-as-therapeut-online.pdf`.
  - `/media/52` → 200, `…/2025/08/hero-background.png`, 12 sizes.
  - Live `www.magnetomarketing.co`: `/` 200, `/services` 200, `/projects/trepied-trepied-ca` 200,
    `/esto-no-existe` 404.

**E5 — Not visible to an agent:** the production plugin list, versions and active state. Anonymous GraphQL
doesn't expose them (Phase 1 E8). Also unknown: whether SiteGround SSH / WP-CLI is enabled. Step 1 collects
both.

## Assumptions and open questions
- **A1:** Production runs the same versions as local of WPGraphQL (2.25.0), WPGraphQL for ACF (3.0.0) and ACF
  PRO (6.8.10). The type count is 623 vs 624, and the one extra local type is WPML's `Language`. Step 1
  confirms. If a version differs, **stop**: WPML GraphQL 1.1.3 was only verified with the local versions.
- **A2:** WPML's old options and tables are still in the production DB (E3), so activation may skip the
  wizard and pick up old settings, as happened locally ("wizard was already completed earlier", Phase 1).
  Step 4 therefore **checks every setting**, not only the ones that look new.
- **A3:** WPML, ACFML and WPML GraphQL can be uploaded as zip files from the wpml.org account (Downloads),
  in the same versions as local: WPML 4.7.6, ACFML 2.1.5, WPML GraphQL 1.1.3. If production already has them
  installed but inactive, check the versions; update only to the local versions.
- **SSH — resolved:** Mauricio checks SiteGround (Site Tools → Devs → **SSH Keys Manager**) and sets SSH up if
  it is available (step 1). The `wp` commands below then give exact evidence. The admin-only fallbacks stay
  for each step, in case SSH isn't available.

## Design — the runbook

**Roles during the run (D3):**
- **Mauricio** does every click and every write in WP admin / SiteGround.
- **The Dev** has **read-only** production access for this runbook only: GraphQL `query` operations and page
  fetches (GET) to `cms.magnetomarketing.co` and `www.magnetomarketing.co`. No mutations, no WP admin, no
  SSH, no REST writes.
  - The Dev runs Appendix A, the step 6 schema checks and the live-route checks whenever Mauricio says "step N
    done".
  - The Dev answers with the hash and a pass/fail **before** Mauricio continues.
  - The Dev also runs the 5a/plan-B file comparison on local files.
- Mauricio can run the same commands himself if the Dev isn't available.

Preparation for Mauricio:
- Work in a quiet window and don't edit content during the run.
- Keep one terminal for SSH (if available) and a chat with the Dev open for the checkpoints.
- Before every admin step, check that the URL bar shows **`cms.magnetomarketing.co/wp-admin`**.
- Write each time and anything unexpected in `~/Documents/projects/magneto/backups/phase-3b/notes.md`, outside
  the repo. The Dev turns it into `docs/reports/phase-3b-production-wpml-runbook.md`.
- **Never paste the WPML site key** in notes, chat, terminal history or the repo.

### Step 0 — Before capture (Dev, read-only, ≈3 min)
The Dev runs this in the repo, or Mauricio does in his local terminal:
```bash
cd ~/Documents/projects/magneto/web-app-GrapgQL && git fetch && git cat-file -e d0c09c4 && echo ok
mkdir -p ~/Documents/projects/magneto/backups/phase-3b
# save Appendix A as ~/Documents/projects/magneto/backups/phase-3b/live-capture.mjs, then:
node ~/Documents/projects/magneto/backups/phase-3b/live-capture.mjs https://cms.magnetomarketing.co/graphql . d0c09c4 \
  | tee ~/Documents/projects/magneto/backups/phase-3b/before.txt | tail -1
```
- **Expected:** `queries 25 total sha256 b0517e27…aaa4` (E4).
- If it differs, production content changed since this spec. **Stop** and confirm nobody edited it; the new
  value then becomes the baseline.

### Step 1 — SSH + production inventory (≈5–20 min, read-only)
- **SSH first:** Site Tools → Devs → **SSH Keys Manager**. If it's available, create or import a key and
  connect (`ssh -p 18765 <user>@<host>`, as shown there). Then `cd` to the site's `public_html` and check that
  `wp --info` works. If SSH isn't available, use the "without SSH" lines in each step.
- **With SSH:**
  ```bash
  wp plugin list --fields=name,status,version
  wp option get icl_sitepress_settings --format=json | head -c 300; echo   # only shows whether old WPML settings exist; contains no key
  ```
  - Paste the plugin list into the notes.
  - For the second command, note only "exists / doesn't exist". **Don't paste its content**: it can contain
    the site key.
- **Without SSH:** Plugins → Installed Plugins, then screenshot or copy the name, version and state for every
  row.
- Stop and report if:
  - WPGraphQL, WPGraphQL for ACF or ACF PRO differ from local (A1);
  - "AI Agent by SiteGround" is active. That one is a separate security decision (`WP-SETUP.md`), not part of
    this runbook; just record it.

### Step 2 — Backups (≈10–15 min) — nothing changes before both exist
1. **SiteGround:** Site Tools → Security → **Backups** → Create Backup. Name it
   `phase-3b-before-<yyyymmdd-hhmm>` and wait until it is listed.
2. **Second copy**, either:
   - With SSH: `wp db export ~/phase-3b-before-$(date +%Y%m%d-%H%M).sql`, saved in the home directory, **not**
     in `public_html`. Then download it with SFTP to `~/Documents/projects/magneto/backups/phase-3b/` and
     delete the server copy.
   - Without SSH: All-in-One WP Migration → Export → File, if the plugin is active in production. Store the
     file in the same local folder.
3. Note both names and times.

### Rollback (decide by symptom, from least to most invasive)
| Symptom | Action |
|---|---|
| Something odd after a plugin activation, live site OK | Deactivate the plugin just activated, in reverse order: WPML GraphQL → ACFML → WPML. Re-run Appendix A. Deactivating keeps WPML data, so a retry is possible |
| Live site affected (Appendix A ≠ before, a live page not 200) | Deactivate all three at once (Plugins → bulk Deactivate). Re-run Appendix A. Then restore the step 2 backup if the hash still differs |
| Settings or field groups damaged (after 5c) | SiteGround → Backups → `phase-3b-before-…` → **Restore → Databases** only. This puts every setting back, including ACF groups |
| Anything else unclear | Stop, restore the database, write notes |

The live frontend is independent of the CMS build state. Vercel production keeps serving its current
deployment, and its ISR re-fetches every 60 s, which is exactly what Appendix A measures.

### Step 3 — Install, license, activate WPML core (≈10 min)
1. Upload/install at the local versions (A3): **WPML Multilingual CMS**, **Advanced Custom Fields
   Multilingual**, **WPML GraphQL**. **Do not** activate String Translation, Media Translation or others; they
   stay off, as locally.
2. Activate **WPML Multilingual CMS only**.
3. Tell the Dev "step 3 done". The Dev runs Appendix A: it must still be `b0517e27…`. If not → rollback row 1.
4. **Licensing:**
   - On wpml.org → Account → **Sites**, add `https://cms.magnetomarketing.co` as a **Production** site and
     generate its site key.
   - In WP admin → WPML → **Register** (or Plugins → "Register WPML"), paste the key **directly into that
     field**.
   - Expected: "WPML is registered on this site".
   - The key never goes in notes, chat, the repo or a terminal.
   - The local site stays registered separately as a development site (Phase 1).

### Step 4 — WPML settings, identical to local (≈15 min)
If the wizard opens:
- Languages: default **English**, translation languages **French, Spanish**.
- URL format: **directories**.
- Mode: **"Translate Some"**, never "Translate Everything Automatically".
- Who translates: **Myself**.
- Recommended plugins: **skip**.

Wizard or not (A2), then **verify every row** of `WP-SETUP.md` → "WPML / ACFML settings (to repeat in
production)":

| Where | Setting | Value |
|---|---|---|
| WPML → Translation Dashboard | Translate Everything Automatically | **OFF** |
| WPML → Languages | Default · translation languages | English · French, Spanish (nothing else) |
| WPML → Languages | URL format | Different languages in directories |
| WPML → Languages → Edit Languages → French | Default locale | **`fr_CA`** (code stays `fr`; don't add "French (Canada)") |
| WPML → Languages → Edit Languages → Spanish | Default locale | `es_ES` |
| WPML → Languages | Browser language redirect | **Disable browser language redirect** |
| WPML → Settings → Post Types Translation | Pages · Projects | **Translatable – only show translated items**, then **Save that section** |
| same | Media | **leave as found** (D2); only write the value down (local is `1`) |
| same | ACF Field Groups | **Not translatable** |
| WPML → Settings → Translation Editor | — | leave as is (ATE default) |
| Plugins | WPML String Translation | stays **inactive** / not installed |

- With SSH, check: `wp eval 'echo wp_json_encode( apply_filters( "wpml_setting", null, "custom_posts_sync_option" ) ), PHP_EOL;'`.
  Expected `"page":"1"`, `"project":"1"`, `"acf-field-group":0`; record `attachment`.
- Tell the Dev "step 4 done". The Dev runs Appendix A again: it must be `b0517e27…`.

### Step 5 — ACFML + field-group modes (≈15–25 min)
Production's DB comes from the same origin as local, so the groups are expected to be mostly set already
(locally 12 of 13 were). **Fix by hand only what is missing (D1).** The JSON import is plan B.

**5a. Activate ACFML** (Plugins → Advanced Custom Fields Multilingual → Activate). Tell the Dev "step 5a done".
The Dev runs Appendix A: it must be `b0517e27…`.

**5b. Read the modes (read-only):**
- **With SSH:** run the ACFML dump command from `WP-SETUP.md` and save the output to `phase-3b/acfml-prod-before.txt`.
  Run the same command locally (Local → site shell) into `phase-3b/acfml-local.txt`. The Dev compares the two.
- **Without SSH:** ACF → Field Groups → open **each of the 13** groups → "Multilingual Setup". Note the mode
  shown for each.
- List the groups whose mode is **not** `translation` ("Same fields across languages"), or that show `-`.
  The expected candidate is "Projects - Project Data", as locally (Phase 1 step 5).

**5c. Fix by hand only those groups:** ACF → Field Groups → the group → "Multilingual Setup" → **Same fields
across languages** → Update. Don't touch the groups that are already in `translation` mode.

**5d. Verify (read-only):**
- With SSH: re-run the dump into `phase-3b/acfml-prod-after.txt`. Expected: every group `mode=translation`, no
  `pref=-`, and the field preferences equal to `acfml-local.txt`. The Dev diffs them (`diff acfml-local.txt
  acfml-prod-after.txt`); only expected differences, if any, are allowed and must be explained.
- Without SSH: re-open the groups changed in 5c, plus "Projects - Project Data", and check that each shows "Same
  fields across languages".
- Tell the Dev "step 5 done". The Dev runs Appendix A: it must be `b0517e27…`.

**Plan B — JSON import, only if 5b–5d can't fix it by hand** (e.g. field preferences differ in a way the
admin screen can't set). Get Senior Architect OK first.
- Warning: an import replaces each group with the file's version and **deletes fields that are not in the
  file**.
- **Gate: prove the keys match first.**
  - ACF → Tools → **Export Field Groups** → all 13 → **Export as JSON**:
    - in **local** WP → save as `phase-3b/acf-local.json`;
    - in **production** → save as `phase-3b/acf-prod.json`.
    Exporting writes nothing, and the production file is also a backup of the definitions.
  - The Dev (or Mauricio) runs:
```bash
cd ~/Documents/projects/magneto/backups/phase-3b && node -e '
const strip=o=>JSON.parse(JSON.stringify(o,(k,v)=>["modified","acfml_field_group_mode","wpml_cf_preferences"].includes(k)?undefined:v));
const keys=g=>{const out=[g.key];(function w(fs){for(const f of fs||[]){out.push(f.key+":"+f.name+":"+f.type);w(f.sub_fields);w((f.layouts||[]).flatMap(l=>l.sub_fields||[]));}})(g.fields);return out;};
const L=require("./acf-local.json"),P=require("./acf-prod.json");
const kl=L.flatMap(keys).sort(),kp=P.flatMap(keys).sort();
console.log("groups",L.length,P.length,"keys equal:",JSON.stringify(kl)===JSON.stringify(kp));
console.log("rest equal (ignoring modified + ACFML keys):",JSON.stringify(strip(L))===JSON.stringify(strip(P)));'
```
  - **Both** lines must be `true`; otherwise **stop**:
    - Different keys → duplicate groups and orphaned values.
    - Different field settings → the import would overwrite or delete production fields.
- Only then: ACF → Tools → Import Field Groups → `acf-local.json`. ACF → Field Groups must show **13** groups.
  Then repeat 5d.

### Step 6 — WPML GraphQL + verification (≈10 min)
1. Activate **WPML GraphQL**. Flush SiteGround caches: Site Tools → Speed → Caching → Flush (dynamic + memcached).
2. **Schema check** (Dev, read-only):
   ```bash
   for q in '{projects(first:3,where:{language:"en"}){nodes{slug languageCode}}}' \
            '{mediaItems(first:1){nodes{languageCode translations{databaseId}}}}' \
            '{languages{code locale default}}' '{projects(first:1,where:{language:"fr"}){nodes{slug}}}'; do
     curl -s -X POST -H 'Content-Type: application/json' -d "{\"query\":$(node -e 'console.log(JSON.stringify(process.argv[1]))' "$q")}" \
       https://cms.magnetomarketing.co/graphql; echo; done
   ```
   Expected:
   - the 3 EN projects, all with `languageCode "en"`
   - a media node with `languageCode` and `translations` and **no errors**
   - `languages` = en `en_US` default, fr `fr_CA`, es `es_ES`
   - FR projects `[]` ("only show translated")
3. **Live site unaffected** (Dev, read-only):
   ```bash
   node ~/Documents/projects/magneto/backups/phase-3b/live-capture.mjs https://cms.magnetomarketing.co/graphql . d0c09c4 \
     | tee ~/Documents/projects/magneto/backups/phase-3b/after.txt | tail -1
   diff ~/Documents/projects/magneto/backups/phase-3b/before.txt ~/Documents/projects/magneto/backups/phase-3b/after.txt && echo IDENTICAL
   for u in / /services /packages /projects /about-magneto /contact /projects/trepied-trepied-ca /esto-no-existe; do
     curl -s -o /dev/null -w "%{http_code} $u\n" "https://www.magnetomarketing.co$u"; done
   curl -s https://cms.magnetomarketing.co/wp-json/wp/v2/media/484 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).source_url))'
   ```
   Expected:
   - `IDENTICAL` (total `b0517e27…`)
   - 7 × `200` and `/esto-no-existe` `404`
   - the PDF URL from E4
   - The live pages revalidate within 60 s, so wait 2 min and spot-check `/` in a browser: the hero says
     "Attract More Aligned Clients Online".
4. With SSH, also take an "after" backup: `wp db export ~/phase-3b-after-<time>.sql`, then download it and
   delete it from the server, as in step 2.

### Step 7 — Unblock PR #10 (≈15 min)
1. Vercel → Project → Deployments → PR #10's failed preview → **⋯ → Redeploy**. The build must pass. Note the
   route table in the build log: only `/en/…` paths should be prerendered.
2. **Release-process checklist** (`docs/ai/WORKFLOW.md`) on the preview URL:
   - main routes 200: `/` `/services` `/packages` `/projects` `/about-magneto` `/contact`
   - `/esto-no-existe` → 404 (not 500); `/projects/no-existe` → 404; `/projects/trepied-trepied-ca` → 200
3. **Phase 3's own checks** on the preview (`ENABLED_LOCALES` unset in Vercel):
   - `/fr` and `/es` → 404
   - the EN home hero = "Attract More Aligned Clients Online"
   - the preview's EN pages look the same as live `www.magnetomarketing.co` at 375 and 1440 px (visual)
4. Record the result in the PR #10 description. Only then merge, and then follow the release process steps 2–6.

### Step 8 — Records
- `docs/ai/WP-SETUP.md` gets a production change-log row per step, plus a production plugin table. The Dev
  writes it from your notes after the run; the Dev is not allowed to edit it before.
- Backups: the names in the notes.

## Files touched by this task
- `docs/specs/phase-3b-production-wpml-runbook.md`: this runbook (Architect).
- `docs/ai/WORKFLOW.md`: "CMS first, frontend second" rule in Release process (Architect, done).
- After execution, the Dev writes (separate instruction): `docs/reports/phase-3b-production-wpml-runbook.md`
  and the `docs/ai/WP-SETUP.md` production rows. No code changes.

## Out of scope
- Creating FR/ES content in production (Phase 5); enabling `ENABLED_LOCALES` in Vercel (Launch).
- String Translation, Yoast SEO Multilingual (Phase 7), the "AI Agent by SiteGround" decision, plugin cleanup.
- Any change to the frontend code or Vercel settings, apart from redeploying the PR #10 preview.

## Acceptance criteria
- [ ] Step 0 before-hash = `b0517e270008bbb445bec4f308d908be930789fe243d55657e77eb72e725aaa4`, or a
  re-baselined value confirmed by Mauricio.
- [ ] Plugin inventory recorded. Core plugin versions equal local (A1).
- [ ] Two backups exist **before** the first activation (names + times in the notes).
- [ ] The Appendix A hash is unchanged after **each** step (3, 4, 5a, 5d, 6) and at the end
  (`diff` → IDENTICAL).
- [ ] WPML shows "registered" as a production site. The key appears nowhere in the repo, notes or chat.
- [ ] Every setting in the step 4 table matches local. `custom_posts_sync_option` page 1 / project 1 (SSH).
- [ ] 5b lists which groups needed a fix; 5c changed only those. 5d: every group `mode=translation` with no `-`,
  and the field preferences equal local (SSH diff), or the admin re-check passes.
- [ ] Plan B used: only with Senior Architect OK and both comparison lines `true`, ending with 13 groups.
  Not used: the report says so.
- [ ] The Dev's production access was read-only: queries and GETs only. The report lists every command run
  against production.
- [ ] Step 6 schema checks: no errors. `languages` = en/fr(fr_CA)/es. FR projects `[]`.
- [ ] Live `www.magnetomarketing.co`: 7 routes 200, `/esto-no-existe` 404, and the media 484 URL unchanged.
- [ ] PR #10 preview builds and passes the release checklist + Phase 3 checks. The result is in the PR.

## Decisions (resolved — 2026-10-25, Senior Architect)
- **SSH:** Mauricio checks SiteGround's SSH Keys Manager and sets SSH up if available. The admin-only fallbacks
  stay.
- **D1 — Field-group modes:** neither path by default. After activating ACFML, read the modes (dump or admin),
  then fix by hand **only** the groups not in `translation` mode. The JSON import is plan B: it deletes fields
  that aren't in the file, so it is gated by the key comparison and needs a Senior Architect OK.
- **D2 — Media translation setting:** leave production's value as found; only record it.
- **D3 — Dev access:** the Dev gets the same **read-only** production access (GraphQL queries and page fetches,
  no mutations) for this runbook. The Dev re-runs the fingerprint after each step while Mauricio clicks.
- No ADR needed: this applies ADR 0001/0003/0004 to production. The "CMS first" rule is process, now in
  `WORKFLOW.md`.

## Estimate
- Mauricio's active time: **≈ 90–120 min**:
  - step 0–1: 10
  - backups: 10–15
  - install + license + activate: 10–15
  - settings: 15
  - ACF 5a–5d: 15–25 (plan B +15)
  - verification: 10
  - PR #10 preview + checklist: 15
- Plus 10–15 min for the first SSH setup. If SSH isn't available, add ≈ 15 min for the manual inventory and
  the 13-group admin check.
- Dev: in parallel with Mauricio during the run (read-only checkpoints, ≈ 2 min each). Afterwards, the report
  + `WP-SETUP.md` rows ≈ 30 min.

## Appendix A — live-frontend EN capture (read-only)
Run it from the repo (it reads the queries from commit `d0c09c4` with `git show`). It sends only `query`
operations and throws if it finds a mutation. With `NORM=1` it replaces the CMS host, so a local run and a
production run can be compared (E4 dry run).
```js
// Read-only. Replays the exact EN GraphQL queries of the live frontend (pinned commit) against a CMS
// and prints one sha256 per query plus a total. Usage: node live-capture.mjs <graphql-url> [repo-dir] [commit]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const [EP, REPO = ".", REF = "d0c09c4"] = process.argv.slice(2);
if (!EP) { console.error("usage: node live-capture.mjs <graphql-url> [repo] [commit]"); process.exit(2); }
const FILES = [
  "src/app/[locale]/about-magneto/api.ts", "src/app/[locale]/contact/api.ts", "src/app/[locale]/packages/api.ts",
  "src/app/[locale]/projects/api.ts", "src/app/[locale]/services/api.ts", "src/app/[locale]/projects/[slug]/api.ts",
  "src/components/organisms/AboutSection/api.ts", "src/components/organisms/FeaturedServices/api.ts",
  "src/components/organisms/FinalCTASection/api.ts", "src/components/organisms/Footer/api.ts",
  "src/components/organisms/Header/api.ts", "src/components/organisms/Hero/api.ts",
  "src/components/organisms/Hero/HeroLoader.tsx", "src/components/organisms/LeadMagnetSection/api.ts",
  "src/components/organisms/Testimonials/api.ts", "src/data/projects.ts", "src/data/site.ts",
];
const SLUGS = ["trepied-trepied-ca", "shamaniccas-ecommerce", "fashion-company-ecommerce", "no-existe"];
const HERO_URIS = ["/", "services", "projects", "packages", "about-magneto", "contact"];
const jobs = [];
for (const f of FILES) {
  const src = execFileSync("git", ["-C", REPO, "show", `${REF}:${f}`], { encoding: "utf8" });
  for (const m of src.matchAll(/`(\s*query[\s\S]*?)`/g)) {
    const text = m[1];
    if (/^\s*mutation/i.test(text)) throw new Error("mutation found");
    if (text.includes("${pageUri}")) { for (const u of HERO_URIS) jobs.push([`${f} pageUri=${u}`, text.replaceAll("${pageUri}", u), {}]); }
    else if (text.includes("$slug")) { for (const s of SLUGS) jobs.push([`${f} slug=${s}`, text, { slug: s }]); }
    else jobs.push([f, text, {}]);
  }
}
const sha = (s) => createHash("sha256").update(s).digest("hex");
const all = createHash("sha256");
for (const [name, query, variables] of jobs) {
  const r = await fetch(EP, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json",
    "User-Agent": "MagnetoProxy/1.0 (+https://www.magnetomarketing.co)" }, body: JSON.stringify({ query, variables }) });
  const j = await r.json(); delete j.extensions;
  let body = JSON.stringify(j);
  // NORM=1: replace the CMS host so a local and a production run can be compared.
  if (process.env.NORM === "1") body = body.replace(/https?:\\?\/\\?\/(cms\.magnetomarketing\.co|magneto-cms-2\.local)/g, "HOST");
  all.update(name + "\n" + body + "\n");
  console.log(r.status, j.errors ? "ERR" : "ok ", String(body.length).padStart(6), sha(body).slice(0, 16), name);
}
console.log("queries", jobs.length, "total sha256", all.digest("hex"));
```
