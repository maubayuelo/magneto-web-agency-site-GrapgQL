# Phase 3b report — Production WPML rollout (runbook)

- Spec: `docs/specs/phase-3b-production-wpml-runbook.md` (Approved 2026-10-25)
- Author: Dev (read-only production access, D3) · Executed by: Mauricio · Date: 2026-10-25
- Raw evidence (outside the repo): `~/Documents/projects/magneto/backups/phase-3b/` — `dev-notes.md`,
  `dev-commands.log`, every capture file named below.

## Result
Done, with two open items. Production WordPress now has WPML 4.7.6 + ACFML 2.1.5 + WPML GraphQL 1.1.3 with
the same settings and field-group modes as local. The live site's EN GraphQL responses are unchanged:
the Appendix A hash was `b0517e27…aaa4` at all 7 checkpoints. PR #10's preview built and passed. PR #10 is
merged, promoted and verified on `www.magnetomarketing.co`.

Mauricio confirmed the step 7 checks (visual, build-log route table, PR description). Still open:
- WPML is registered with an inherited **Development** key, not a Production key (D-3).
- WPML can't reach wpml.org (D-4).

## Changes
- `docs/reports/phase-3b-production-wpml-runbook.md`: this report.
- `docs/ai/WP-SETUP.md`: a new "Production" section (plugin table, backups, settings as found and set) and
  the production change-log rows for this run.
- No code changes.
- Production WordPress was changed by Mauricio only, through WP admin and SSH. The Dev made no writes.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | not run | docs-only change; no `src/` file touched |
| typecheck | not run | same |
| tests | not run | same |
| build | not run locally | the PR #10 Vercel preview build passed, and so did the Production build (Ready 19:07, per Mauricio) |
| visual (routes · viewports · locales) | passed | Dev: 11 URLs on the preview (rendered DOM) and 11 on production (raw HTML), EN only (locales not enabled). Mauricio: step 7.3 comparison at 375 / 1440 px, preview = live |

### Acceptance criteria
| Criterion | Result |
|---|---|
| Step 0 before-hash = `b0517e270008…aaa4` | **Pass**: 00:26 (×2) and recheck 13:53 |
| Plugin inventory recorded; core versions = local (A1) | **Pass**: wp-graphql 2.25.0, wpgraphql-acf 3.0.0, ACF PRO 6.8.10 |
| Two backups before the first activation | **Pass**: SiteGround ×2 (13:31, 13:33) + `wp db export` (13:08 EDT) |
| Appendix A unchanged after steps 3, 4, 5a, 5d, 6 and at the end | **Pass**: 7/7 checkpoints, `diff before.txt after.txt` IDENTICAL |
| WPML "registered" as a **production** site; key nowhere | **Not met**: registered with an inherited Development key (D-3, O-1). The key appears nowhere in the repo, notes or chat |
| Step 4 settings = local; `custom_posts_sync_option` page 1 / project 1 | **Pass** |
| 5b lists groups to fix; 5c only those; 5d diff = local | **Pass**: 1 group; `diff acfml-local.txt acfml-prod-after.txt` empty |
| Plan B | **Not used** |
| Dev access read-only; every production command listed | **Pass**: see "Commands run against production" |
| Step 6 schema: no errors; languages en/fr(fr_CA)/es; FR projects `[]` | **Pass with deviation**: the runbook query is invalid (D-5); the corrected query passes and matches local |
| Live: 7 routes 200, `/esto-no-existe` 404, media 484 unchanged | **Pass**: at step 6 and again after the promote |
| PR #10 preview builds and passes the release checklist + Phase 3 checks; result in the PR | **Pass**: Dev's 11 URLs; build-log route table shows only `/en/…` prerendered (9 pages, 3 projects); visual check preview = live; PR #10 description updated (Mauricio) |

## Evidence

### Checkpoints (Appendix A, 25 query POSTs each, all `200 ok`)
| When (EDT) | State | Total sha256 | Result | File |
|---|---|---|---|---|
| 00:26 | before, run 1 and run 2 | `b0517e270008bbb445bec4f308d908be930789fe243d55657e77eb72e725aaa4` | baseline | `before.txt`, `before-2.txt` |
| 13:53 | step 0 recheck | same | IDENTICAL | `recheck-step0-20261025-1353.txt` |
| 13:56 | WPML GraphQL deactivated (D-1) | same | IDENTICAL | `check-pre3-20261025-1356.txt` |
| 14:04 | step 3: core active; WPML GraphQL and ACFML inactive | same | IDENTICAL | `check-step3-20261025-1404.txt` |
| 14:42 | step 4: settings | same | IDENTICAL | `check-step4-20261025-1442.txt` |
| 14:46 | step 5a: ACFML active | same | IDENTICAL | `check-step5a-20261025-1446.txt` |
| 15:01 | step 5d: field-group modes fixed | same | IDENTICAL | `check-step5d-20261025-1501.txt` |
| 15:06 | step 6: WPML GraphQL active, caches flushed | same | IDENTICAL | `after.txt` |

At 14:04, 14:42, 14:46 and 15:01, an introspection query confirmed that production still showed no WPML
schema: no `language` argument on projects, no language fields on `MediaItem`, no `Language` type. That
was the expected state until step 6.

### Step 1: inventory (SSH, reported by Mauricio)
| Plugin | Version | State before | State after |
|---|---|---|---|
| WPGraphQL | 2.25.0 | active | active |
| WPGraphQL for ACF | 3.0.0 | active | active |
| Advanced Custom Fields PRO | 6.8.10 | active | active |
| WPML Multilingual CMS (`sitepress-multilingual-cms`) | 4.7.6 | not installed | active |
| ACFML | 2.1.5 | not installed | active |
| WPML GraphQL | 1.1.3 | **active** (inert without core) | active |
| Add WPGraphQL SEO · Yoast SEO · WPGraphQL IDE · All-in-One WP Migration | 5.1.0 · 28.7 · 5.7.0 · 7.112 | listed, state not recorded | unchanged |
| AI Agent by SiteGround (`sg-ai-studio`) | 1.3.1 | **active** | unchanged: out of scope, recorded only |

Old WPML settings (`icl_sitepress_settings`) existed in the database (A2 confirmed); the content was not
printed. The full production plugin list was not handed to the Dev, only the rows above.

### Step 2: backups
- SiteGround manual backup `phase3b-before`, 13:31 EDT.
- SiteGround manual backup `phase-3b-before-20261025`, 13:33 EDT.
- `phase-3b-before-20261025-1708.sql`:
  - 3,550,885 bytes; trailer "Dump completed on 2026-10-25 17:08:08" (server UTC = 13:08 EDT);
  - downloaded at 13:12 and the server copy deleted (confirmed by Mauricio).
- After the run, both found in the backup folder, both complete (they have the trailer):
  - `phase-3b-after-20261025-1909.sql`: 3,700,277 bytes, 15:09 EDT, the step 6.4 "after" export.
  - `phase-3b-after-20261025-2309.sql`: 3,700,346 bytes, 19:09 EDT, after the promote. This is the
    "after" copy Mauricio keeps.
  - Server copies of both "after" dumps deleted (confirmed by Mauricio).
  - At the time of writing, `phase-3b-after-20261025-1909.sql` was also still in the local folder.

### Step 4: WPML settings (Mauricio; read with `wp eval` first, then changed only what differed)
- **Already correct** (old DB settings):
  - default `en`; active `en, fr, es`;
  - URL format directories (`1`); browser redirect off (`0`);
  - Spanish `es_ES`; `page` 1; `acf-field-group` 0.
- **Changed:** French locale `fr_FR` → **`fr_CA`**; Projects `2` → **`1`** ("only show translated items").
- **Translate Everything Automatically:** OFF.
- **Translation Editor:** untouched (ATE default).
- **String Translation:** not installed.
- **Media** (`attachment`) = `1`, left as found (D2); equal to local.
- **After:** `{"post":"1","page":"1","acf-field-group":"0","attachment":1,…,"project":"1"}`.
  - `"0"` is now a string after the section was re-saved (same meaning).
  - `post` = `1` equals local.

### Step 5: ACFML
- **5b:** compared `acfml-prod-before.txt` with `acfml-local.txt` (85 lines each).
  - Same 13 groups, field names, types and order.
  - 12 groups were identical to local.
  - Only **"Projects - Project Data"** differed: mode `-` (local `translation`), and `pref=-` (local `1`) on
    `project_data > project_url`, `images` and `images > ismobilescreenshot`.
- **5c:** Mauricio set only that group to "Same fields across languages".
- **5d:** `diff acfml-local.txt acfml-prod-after.txt` → empty. 13 × `mode=translation`, 0 × `pref=-`.
  - Before → after changed exactly those 4 lines. ACFML set the 3 preferences itself.

### Step 6: schema and live checks (15:06 EDT)
1. EN projects: `trepied-trepied-ca`, `shamaniccas-ecommerce`, `fashion-company-ecommerce`, all `languageCode "en"`.
2. `mediaItems(first:1)`: `{languageCode:"en", translations:[]}`, no errors.
3. **As written:** `languages{code locale default}` → `Cannot query field "locale"` / `"default" on type "Language"`.
   - **Corrected:** `languages{code default_locale} defaultLanguage{code default_locale}` → en `en_US` (default), fr `fr_CA`, es `es_ES`.
   - The result is byte-identical to local, and the `Language` type has the same fields on production and local (D-5).
4. FR projects: `[]`.
- **Live `www`:** 7 × 200 and `/esto-no-existe` 404.
- **Media 484:** `…/uploads/2025/10/6-killers-strategies-to-get-clients-as-therapeut-online.pdf`, unchanged from E4.
- **Hero:** `GET /` contains "Attract More Aligned Clients Online".

### Step 7: PR #10 preview and production
**Preview access:** the preview is behind Vercel Deployment Protection; plain requests got `302` →
`vercel.com/sso-api`. With Mauricio's approval, the Dev used Claude in Chrome in Mauricio's logged-in session:
- a new tab, URL navigation only (no clicks, no forms, no Vercel dashboard);
- status codes read from the Navigation Timing `responseStatus`;
- the tab closed afterwards.

**Production:** read with plain HTTP after the merge (`6ed7eff`) and the promote (Ready 19:07). Raw HTML is
saved in `live-prod-20261025-1909/`.

| URL | Preview | Production | Key content (identical on both) |
|---|---|---|---|
| `/` | 200 | 200 | `lang="en"`, "Magneto Marketing - Home", h1 "Attract More Aligned Clients Online" |
| `/services` | 200 | 200 | "Web & Funnel Services" |
| `/packages` | 200 | 200 | "Funnel & Web Packages" |
| `/projects` | 200 | 200 | "Projects & Case Studies" |
| `/about-magneto` | 200 | 200 | "About Magneto Web Agency" |
| `/contact` | 200 | 200 | "Contact Magneto Now!" |
| `/projects/trepied-trepied-ca` | 200 | 200 | "TRÉPIED — trepied.ca" |
| `/esto-no-existe` | 404 | 404 | Next not-found, not 500 |
| `/projects/no-existe` | 404 | 404 | "Project Not Found" |
| `/fr` | 404 | 404 | Next not-found (`ENABLED_LOCALES` unset) |
| `/es` | 404 | 404 | same |

**Production runs the new build:**
- The Header client code is in the live chunks.
- But `query HomeHeader` / `idType: URI` appear in none of the 11 client chunks that `/` references. Phase 3
  (`eae3c2c`) removed that query; the `d0c09c4` build shipped it in the client Header.
- Unprefixed EN is rewritten to `/en` (7 × 200, `lang="en"`). `/en` and `/en/services` return 404, as
  designed (ADR 0003 D4).

### Commands run against production (all read-only; full log in `dev-commands.log`)
- **Appendix A** (`live-capture.mjs`, 25 GraphQL `query` POSTs each): 9 runs.
  - 00:26 ×2, 13:53, 13:56, 14:04, 14:42, 14:46, 15:01, 15:06.
- **Introspection queries** (`__type`): 4 × 3 types at 14:04, 14:42, 14:46, 15:01; `__type(Language)` at 15:06.
- **Step 6 queries:** the 4 runbook schema queries; `{languages{code} defaultLanguage{code}}`; the corrected
  languages query. The last two were also run on local.
- **GETs to `www.magnetomarketing.co`:**
  - 8 routes + `/` hero grep (15:06);
  - `/projects/no-existe` and 3 × "free guide" grep (15:26);
  - 11 routes (19:09); 11 JS chunks under `/_next/static` (19:10, fetched twice); `/en`, `/en/services` (19:11).
- **GET `cms…/wp-json/wp/v2/media/484`** (15:06).
- **PR #10 preview:**
  - 11 GETs + 1 GET to read the redirect (≈15:23; the redirect GET was logged late);
  - 11 navigations in Chrome (≈15:25).
- No mutations, no WP admin, no SSH, no REST writes.

## Deviations from the spec
- **D-1, WPML GraphQL was already active** (Senior Architect, option a).
  - It was active in production without WPML core. Left that way, activating core in step 3 would have
    exposed the WPML schema and filters before step 4 had verified the old settings.
  - Mauricio deactivated it before step 3 and reactivated it in step 6.
  - Extra checkpoint at 13:56.
- **D-2, core was activated during a multi-command paste,** close to the D-1 deactivation, so the two have no
  separate checkpoints.
  - It is unknown whether core was already active at 13:56.
  - The plugin files were re-extracted from the zips (`unzip -o`), same versions.
  - The 14:04 check covers the intended post-step-3 state.
- **D-3, licensing:** "WPML is registered on this site (Lifetime)", but with a **Development** key, almost
  certainly the old key left in the database (A2). No new key was entered. The Senior Architect deferred
  the switch → O-1.
- **D-4, no connection:** "WPML plugin cannot connect to wpml.org" (outbound connection blocked or failing).
  The Senior Architect said proceed → O-2.
- **D-5, runbook bug:** the step 6 check 3 query `languages{code locale default}` is invalid in WPML GraphQL
  1.1.3, locally too. The fields are `default_locale` (on `Language`) and the root `defaultLanguage`. The
  corrected query was used. The Dev did not edit the spec.
- **Minor (accepted by Mauricio):**
  - The SiteGround backup names have no `-hhmm` suffix.
  - A second SiteGround backup (`phase3b-before`) was taken.
- **Step 6.1 cache flush:** the runbook names "dynamic + memcached". Mauricio ran `wp cache flush` (Success),
  which covers memcached, and flushed the SiteGround dynamic cache. The method differs; the result is the same.
- **Step 7, preview access:** the preview was checked in Chrome rather than with `curl`, because of Vercel
  Deployment Protection (approved by Mauricio).

## Issues found (not fixed)
- **O-1:** replace the inherited Development key with a Production site key for
  `https://cms.magnetomarketing.co`. Needs O-2.
- **O-2:** check or allow outbound HTTPS from SiteGround to wpml.org.
- **404 raw HTML** (production, all four 404 URLs):
  - The server HTML is the streamed `<html id="__next_error__">` shell: no `lang` attribute, and
    `<title>Magneto CMS</title>` (the WordPress site title, from the layout metadata) until hydration.
  - After hydration (preview DOM) it is `lang="en"` and "404: This page could not be found.".
    `robots: noindex` is present.
  - Not known whether the `d0c09c4` build behaved the same; no raw 404 HTML was captured before.
  - Relevant to "`lang` per locale" (AGENTS.md) and the custom 404 page item in WORKFLOW.md.
- **Lead-magnet fallback on the project 404:** `/projects/no-existe` renders the h2 "Download our free guide:",
  the hardcoded fallback in `LeadMagnetSection`. Mauricio's visual check: present on both preview and live,
  so it was there before PR #10 and isn't a regression. The lead magnet is Known debt.
- **Spec fix for the Architect:** the D-5 query in step 6.2 of
  `docs/specs/phase-3b-production-wpml-runbook.md`.
- **Not reported to the Dev:** the step 6 browser hero spot-check. The Dev's `GET /` found the hero text, and
  Mauricio's visual check found preview = live.

## Proposed commits
The Phase 3 branch is merged; commit these on a fresh branch from `master`.
- `docs(phase-3b): production WPML rollout report`
- `docs(wp-setup): production plugin table and phase 3b change log`

## Time
- Mauricio:
  - backups from 13:08;
  - steps 3–6 from ≈13:56 to 15:11 (≈ 75 min);
  - step 7 to 19:07.
  - Active time is not measured (≈ 2 h, estimated).
- Dev:
  - step 0 the night before (≈ 5 min);
  - checkpoints ≈ 2–5 min each;
  - preview + production checks ≈ 15 min;
  - report ≈ 20 min (estimated).
- Waiting: the gap between the step 7 preview check (15:26) and the promote (19:07).
