# Local WordPress setup — magneto-cms-2.local

Source of truth for the local CMS state, so production can be reproduced later.
Every plugin or settings change made locally goes in the change log at the bottom.

## Environment

- Local site: `magneto-cms-2.local` (Local by WP Engine/Flywheel)
- GraphQL: `http://magneto-cms-2.local/graphql`
- Production CMS: `cms.magnetomarketing.co` (SiteGround) — **never written from local work**

## Plugin plan (from the inventory of 24 Oct 2026)

| Plugin | State now | Action | Why |
|---|---|---|---|
| WPGraphQL | active | keep | core of the headless API |
| WPGraphQL for ACF | active | keep | exposes ACF groups |
| WPGraphQL IDE | active | keep (local) | needed to inspect the schema |
| Advanced Custom Fields PRO | active | keep | all page content lives in ACF |
| WPML Multilingual CMS | **inactive** | **activate** (Phase 1) | WPML core; WPML GraphQL does nothing without it |
| WPML GraphQL | active | keep | language args in GraphQL — verify after WPML core is on |
| Advanced Custom Fields Multilingual (ACFML) | **inactive** | **activate** (Phase 1) | translates ACF fields with WPML |
| WPML String Translation | inactive | leave off for now | only if site title/tagline or plugin strings need translating; UI microcopy goes in frontend dictionaries |
| Yoast SEO | active | keep | SEO data |
| Add WPGraphQL SEO | active | keep | exposes Yoast data to GraphQL |
| Yoast SEO Multilingual (WPML) | not installed | install in Phase 7 | translated SEO meta with WPML |
| Post Types Order | active | keep | probably drives the order of projects/packages — verify before touching |
| Disable Media Sizes + Simple Image Sizes | active | keep, audit later | frontend reads `mediaDetails.sizes`; changing sizes can break images |
| SVG Support | active | keep | icons; SVG uploads are a security surface — admins only |
| Classic Editor | active | keep | harmless for an ACF-based headless site |
| Enable CORS | active | keep, review later | browser calls go through the Next proxy, so it may be unnecessary — verify before removing |
| Post Type Switcher | active | candidate to remove | low value; deactivate after Phase 1 if unused |
| All-in-One WP Migration | active | keep one migration tool | deactivate when not migrating |
| WP Migrate Lite | active | pick one with the above | two migration tools overlap; WP-CLI also does search-replace |
| AI Agent by SiteGround | active | **delete locally** | hosting-specific; gives an AI agent write access to the site; no role here |
| WordPress Importer | inactive | **delete** | unused; its update notice is noise |

Production has its own decision for AI Agent by SiteGround (security) — separate task.

## Phase 1 order (WPML)

1. `wp db export` backup.
2. Activate WPML Multilingual CMS → wizard: default EN; add French (locale `fr_CA`) and
   Spanish; URL format "directory" (the frontend owns URLs anyway).
3. Register the site in WPML as a **development** site (license key; never commit it).
4. Activate ACFML → for each ACF field group, choose the translation option
   (text fields: Translate; images/links shared across languages: Copy/Copy once).
5. In the GraphQL IDE, confirm the language arguments and fields WPML GraphQL exposes.
   Paste the evidence in the Phase 1 report.
6. Create FR and ES translations of one page (e.g. `home`) with a test string, query it
   per language, then delete or keep as the Phase 5 starting point.

## Change log

| Date | Change | By |
|---|---|---|
| 2026-10-24 | Frontend `.env.local` pointed to `magneto-cms-2.local`; `next.config.ts` image host added (http) | Claude Code (Dev), reviewed by Mauricio |
| 2026-10-24 | Deleted WordPress Importer and WP Migrate Lite; All-in-One WP Migration kept | Mauricio |
| 2026-10-24 | Activated WPML Multilingual CMS and ACF Multilingual (setup wizard pending) | Mauricio |
| 2026-10-24 | Pre-WPML rollback points: Local site "Magneto CMS" + production | Mauricio |
