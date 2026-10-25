# Local WordPress setup — magneto-cms-2.local

Source of truth for the local CMS state, so production can be reproduced later.
Every plugin or settings change made locally goes in the change log at the bottom.

## Environment

- Local site: `magneto-cms-2.local` (Local by WP Engine/Flywheel; site name **"Magneto CMS 2"** —
  "Magneto CMS" is the old site)
- DB backups: `~/Documents/projects/magneto/backups/` (outside the repo)
- GraphQL: `http://magneto-cms-2.local/graphql`
- Production CMS: `cms.magnetomarketing.co` (SiteGround) — **never written from local work**

## Plugin plan (inventory of 24 Oct 2026; versions from `wp plugin list`, Phase 1 step 0)

| Plugin | Version | State now | Action | Why |
|---|---|---|---|---|
| WPGraphQL | 2.25.0 | active | keep | core of the headless API |
| WPGraphQL for ACF | 3.0.0 | active | keep | exposes ACF groups |
| WPGraphQL IDE | 5.7.0 | active | keep (local) | needed to inspect the schema |
| Advanced Custom Fields PRO | 6.8.10 | active | keep | all page content lives in ACF |
| WPML Multilingual CMS (`sitepress-multilingual-cms`) | 4.7.6 | **active, configured (Phase 1)** | keep | WPML core; settings below |
| WPML GraphQL | 1.1.3 | active | keep | `where.language` (lowercase string) + `languageCode`/`translations` fields — verified Phase 1 |
| Advanced Custom Fields Multilingual (ACFML) | 2.1.5 | **active, configured (Phase 1)** | keep | translates ACF fields with WPML; settings below |
| WPML String Translation | 3.3.3 | inactive | leave off for now | only if site title/tagline or plugin strings need translating; UI microcopy goes in frontend dictionaries |
| Yoast SEO (`wordpress-seo`) | 28.7 | active | keep | SEO data |
| Add WPGraphQL SEO | 5.1.0 | active | keep | exposes Yoast data to GraphQL |
| Yoast SEO Multilingual (WPML) | — | not installed | install in Phase 7 | translated SEO meta with WPML |
| Post Types Order | 2.5.9 | active | keep | probably drives the order of projects/packages — verify before touching |
| Disable Media Sizes + Simple Image Sizes | 2.6 / 3.2.6 | active | keep, audit later | frontend reads `mediaDetails.sizes`; changing sizes can break images |
| SVG Support | 2.6.1 | active | keep | icons; SVG uploads are a security surface — admins only |
| Classic Editor | 1.7.0 | active | keep | harmless for an ACF-based headless site |
| Enable CORS | 2.1.0 | active | keep, review later | browser calls go through the Next proxy, so it may be unnecessary — verify before removing |
| Post Type Switcher | 4.1.1 | active | candidate to remove | low value; deactivate after Phase 1 if unused |
| All-in-One WP Migration | 7.112 | active | keep one migration tool | deactivate when not migrating |
| WP Migrate Lite | — | deleted (24 Oct) | — | overlapped with the above; WP-CLI also does search-replace |
| AI Agent by SiteGround (`sg-ai-studio`) | 1.3.1 | active | **delete locally** | hosting-specific; gives an AI agent write access to the site; no role here |
| WordPress Importer | — | deleted (24 Oct) | — | unused |

Production has its own decision for AI Agent by SiteGround (security) — separate task.

## Phase 1 order (WPML) — done 2026-10-24

Spec: `docs/specs/phase-1-wpml-setup.md`. Report: `docs/reports/phase-1-wpml-setup.md`.

1. ✅ `wp db export` backup (before and after).
2. ✅ WPML active; wizard was already completed earlier → confirmed in settings: default EN; French
   (locale changed `fr_FR` → `fr_CA`) and Spanish (`es_ES`); URL format "directories".
3. ✅ Site registered in WPML: "WPML is registered on this site" (lifetime account; key never committed).
4. ✅ ACFML active; every ACF field group has a mode and every field a translation preference (dump below).
5. ✅ Language arguments verified through GraphQL (spec E2, report V6).
6. ✅ FR and ES translations of `home` created with a test string; kept as the Phase 5 starting point.

## WPML / ACFML settings (to repeat in production)

Values set and verified locally in Phase 1 (WPML 4.7.6, ACFML 2.1.5, ACF PRO 6.8.10). Labels are the real
admin labels seen by Mauricio. Take a `wp db export` before and after, as in Phase 1.

| # | Where | Setting | Value |
|---|---|---|---|
| 1 | WPML → Translation Dashboard | "Translate Everything Automatically" | **OFF**. Never send jobs to ATE / automatic translation (Hard rule 4) |
| 1 | WPML → Languages | Default language · translation languages | English · French, Spanish (no others) |
| 1 | WPML → Languages | Language URL format | Different languages in directories (`/fr/`, `/es/`) |
| 1 | WPML → Register | Registration | Register the production site with its own key; never commit the key |
| 2 | WPML → Languages → Edit Languages → French | Default locale | `fr_CA` (code stays `fr`; do not add "French (Canada)") |
| 2 | WPML → Languages → Edit Languages → Spanish | Default locale | `es_ES` (unchanged) |
| 2 | WPML → Languages | Browser language redirect | Disable browser language redirect |
| 3 | WPML → Settings → Post Types Translation | Pages · Projects | Translatable – only show translated items (**Save this section** — each section has its own Save) |
| 3 | WPML → Settings → Post Types Translation | Media | leave as is (local value `1`, translatable) |
| 3 | WPML → Settings → Post Types Translation | ACF Field Groups | Not translatable |
| 4 | WPML → Settings → Translation Editor | ATE vs Classic | leave as is (ATE enabled, default). There is no "manual" option here in 4.7.6 |
| 4 | Each page → Language box | Translation Editor | use the native WordPress editor; for duplicates, "Translate independently" |
| 5 | ACF → Field Groups → each group → Multilingual Setup | Mode | **Same fields across languages** for all 13 groups (incl. "Projects - Project Data") |

Expected `custom_posts_sync_option` afterwards (`0` not translatable, `1` translatable, `2` with EN fallback):
`"page":"1"`, `"project":"1"`, `"attachment":1`, `"acf-field-group":0`.

```bash
wp eval 'echo wp_json_encode( apply_filters( "wpml_setting", null, "custom_posts_sync_option" ) ), PHP_EOL;'
```

ACFML verification (read-only; prints every group's mode and every field's preference: 0 ignore,
1 copy, 2 translate, 3 copy once). Expected: no `mode=-` and no `pref=-`, and values as in the Phase 1
report (text 2; image / url / file / true_false / repeater structure 1; package `price` 2).

```bash
wp eval '
foreach ( acf_get_field_groups() as $g ) {
  echo "== " . $g["title"] . " | mode=" . ( $g["acfml_field_group_mode"] ?? "-" ) . PHP_EOL;
  $walk = function ( $f, $p = "" ) use ( &$walk ) {
    echo "   " . $p . $f["name"] . " [" . $f["type"] . "] pref=" . ( $f["wpml_cf_preferences"] ?? "-" ) . PHP_EOL;
    foreach ( ( $f["sub_fields"] ?? [] ) as $s ) { $walk( $s, $p . $f["name"] . " > " ); }
  };
  foreach ( acf_get_fields( $g["key"] ) as $f ) { $walk( $f ); }
}'
```

**Replicating step 5 with an ACF JSON export** (checked in the plugin source, Phase 1 report): ACF →
Tools → Export Field Groups → JSON keeps `acfml_field_group_mode` (group) and `wpml_cf_preferences`
(each field); only IDs and internal keys are stripped. On import, ACFML re-applies the group mode's
default preference to every field unless the group is in Expert mode, so the result matches local
(all local preferences are the mode defaults). Before importing over production's existing groups,
confirm the group keys match and take a backup; run the verification command afterwards.

Known limitation: `cta_link_LeadMagnetSection` (file) is Copy → FR/ES cannot have their own guide PDF.
Revisit when the lead magnet is rebuilt (Copy once / Expert).

## Production — cms.magnetomarketing.co (Phase 3b, 2026-10-25)

Runbook `docs/specs/phase-3b-production-wpml-runbook.md`, report `docs/reports/phase-3b-production-wpml-runbook.md`.
All production writes were made by Mauricio (WP admin + SSH); agents only ran read-only checks. Rows marked
"(prod)" in the change log below.

| Plugin | Version | State (after Phase 3b) | Note |
|---|---|---|---|
| WPGraphQL | 2.25.0 | active | = local |
| WPGraphQL for ACF | 3.0.0 | active | = local |
| Advanced Custom Fields PRO | 6.8.10 | active | = local |
| WPML Multilingual CMS (`sitepress-multilingual-cms`) | 4.7.6 | active | installed in Phase 3b; registered with an inherited **Development** key — Production key pending (open item) |
| Advanced Custom Fields Multilingual (ACFML) | 2.1.5 | active | installed in Phase 3b |
| WPML GraphQL | 1.1.3 | active | was already active before Phase 3b (inert without core) |
| WPML String Translation | — | not installed | as local (inactive) |
| Add WPGraphQL SEO · Yoast SEO · WPGraphQL IDE · All-in-One WP Migration | 5.1.0 · 28.7 · 5.7.0 · 7.112 | state not recorded | listed in the step 1 inventory |
| AI Agent by SiteGround (`sg-ai-studio`) | 1.3.1 | active | separate security decision, not part of Phase 3b |

Only the rows above were inventoried; the full production plugin list is not recorded here yet.

Settings now equal to local (table above): default `en`, active `en, fr, es`, directories, browser redirect off,
`fr_CA`, `es_ES`, Translate Everything Automatically OFF, Translation Editor untouched (ATE),
`custom_posts_sync_option` `post` 1 · `page` 1 · `project` 1 · `attachment` 1 (left as found) · `acf-field-group` "0".
ACFML: all 13 groups `mode=translation`, field preferences identical to local (`diff` of the dump above: empty).

Open: WPML cannot connect to wpml.org from SiteGround (outbound); needed before switching to a Production key.

Backups (local copies in `~/Documents/projects/magneto/backups/phase-3b/`):
- SiteGround manual backups `phase3b-before` (13:31) and `phase-3b-before-20261025` (13:33).
- `phase-3b-before-20261025-1708.sql` (13:08 EDT), `phase-3b-after-20261025-1909.sql` (15:09 EDT, after step 6),
  `phase-3b-after-20261025-2309.sql` (19:09 EDT, after the frontend promote). File names use server time (UTC).

## Change log

| Date | Change | By |
|---|---|---|
| 2026-10-24 | Frontend `.env.local` pointed to `magneto-cms-2.local`; `next.config.ts` image host added (http) | Claude Code (Dev), reviewed by Mauricio |
| 2026-10-24 | Deleted WordPress Importer and WP Migrate Lite; All-in-One WP Migration kept | Mauricio |
| 2026-10-24 | Activated WPML Multilingual CMS and ACF Multilingual (setup wizard pending) | Mauricio |
| 2026-10-24 | Pre-WPML rollback points: Local site "Magneto CMS" + production | Mauricio |
| 2026-10-24 16:51 | Phase 1 step 0: backup `magneto-cms-2_phase1-before_20261024-1651.sql`; plugin list + `custom_posts_sync_option` recorded | Mauricio |
| 2026-10-24 17:03 | Phase 1 step 1: wizard already done; confirmed "Translate Everything Automatically" OFF | Mauricio |
| 2026-10-24 17:10 | Phase 1 step 2: French locale `fr_FR` → `fr_CA`; browser language redirect disabled; registration confirmed | Mauricio |
| 2026-10-24 17:16 | Phase 1 step 3: Projects → "only show translated items" (saved again 17:42, see step 8) | Mauricio |
| 2026-10-24 17:16 | Phase 1 step 4: Translation Editor section left unchanged (no manual option in 4.7.6) | Mauricio |
| 2026-10-24 17:34 | Phase 1 step 5: "Projects - Project Data" set to "Same fields across languages"; other 12 groups already set | Mauricio |
| 2026-10-24 | Phase 1 step 6: nothing to do (no menus, no options page) | Mauricio |
| 2026-10-24 | Phase 1 step 7: EN home duplicated to FR (535) and ES (536), "Translate independently", `heroTitle` test strings | Mauricio |
| 2026-10-24 17:45 | Phase 1 step 8: backup `magneto-cms-2_phase1-after_20261024-1745.sql`; `custom_posts_sync_option` page 1, project 1 | Mauricio |
| 2026-10-24 | Phase 1 verified read-only through GraphQL (V1–V7) | Claude Code (Dev) |
| 2026-10-25 13:08–13:33 | (prod) Phase 3b step 1–2: SSH set up; inventory (WPML core + ACFML not installed, WPML GraphQL 1.1.3 active, old WPML settings present); backups `phase-3b-before-20261025-1708.sql`, SiteGround `phase3b-before`, `phase-3b-before-20261025` | Mauricio |
| 2026-10-25 ≈13:56 | (prod) Phase 3b D-1: WPML GraphQL deactivated before step 3 (Senior Architect decision) | Mauricio |
| 2026-10-25 ≤14:04 | (prod) Phase 3b step 3: WPML 4.7.6, ACFML 2.1.5 installed (zip, `unzip -o`); WPML core activated (during a multi-command paste, D-2). Registration: inherited Development key; "cannot connect to wpml.org" | Mauricio |
| 2026-10-25 ≤14:42 | (prod) Phase 3b step 4: French locale `fr_FR` → `fr_CA`; Projects `2` → `1` (only show translated items); everything else already equal to local; Media `1` left as found | Mauricio |
| 2026-10-25 ≤14:46 | (prod) Phase 3b step 5a: ACFML activated | Mauricio |
| 2026-10-25 ≤15:01 | (prod) Phase 3b step 5c: "Projects - Project Data" → "Same fields across languages" (only group not in `translation` mode); 5d dump = local | Mauricio |
| 2026-10-25 ≤15:06 | (prod) Phase 3b step 6: WPML GraphQL reactivated; `wp cache flush` + SiteGround dynamic cache flushed; backup `phase-3b-after-20261025-1909.sql` | Mauricio |
| 2026-10-25 | (prod) Phase 3b verified read-only: Appendix A hash `b0517e27…aaa4` unchanged at 7 checkpoints; schema checks; live site and PR #10 preview/production routes | Claude Code (Dev) |
| 2026-10-25 19:09 | (prod) Backup `phase-3b-after-20261025-2309.sql` after the PR #10 promote | Mauricio |
