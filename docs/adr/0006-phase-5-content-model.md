# ADR 0006 — Phase 5 content model: expand/contract ACF fields, per-page final CTA, release-day content load

- Status: Proposed
- Date: 2026-10-26
- Deciders: Mauricio (lead), Senior Architect
- Spec: `docs/specs/phase-5a-structure-shared-home-about-cases.md` (first consumer).
  Evidence: `docs/specs/phase-5-gap-analysis.md` (rev 2, E1–E1c).

## Context

The 2026 copy (`docs/content/magneto-copy-{en,fr-CA,es}.md`) repositions the site. The gap analysis (scenario **B**)
found these mismatches with the current ACF model (13 groups, all `mode=translation`):
- several fields that must hold paragraphs or lists are single-line `text`;
- the final CTA exists only on the home page (`post_type==page AND page==2`) but differs per page in the copy;
- testimonials have no role, company, city or note;
- project cards have no description of their own, and the project order can't be controlled from GraphQL;
- Services, Packages and Contact need fields the groups don't have.

Three facts constrain *how* the model can change:

1. **Production content is live in about 60 s.** `utils/wp-graphql.ts:39` fetches with `next: { revalidate: 60 }`, and
   Vercel previews and production read the production CMS (`docs/ai/WORKFLOW.md`, Release process). An ACF change in
   production reaches the current frontend before any new frontend is promoted.
2. **Field type changes alter what the current frontend receives.** Verified on local, WPGraphQL for ACF 3.0.0,
   2026-10-26:
   - `wpgraphql-acf/src/FieldConfig.php:546-548` runs every `wysiwyg` value through `apply_filters('the_content', …)`.
     The `wysiwyg` registration is `src/FieldType/Wysiwyg.php:10-27`.
   - `textarea` values get `wpautop`/`nl2br` only when `new_lines` is set (`FieldConfig.php:535-541`).
     `contactContactTexts.bodytext` has `new_lines=""`.
   - Read-only simulation:
     `wp eval '$d=get_post_meta(32,"description",true); echo apply_filters("the_content",$d);'`
     → IN `"Magneto is a solo studio helping…"` → OUT `"<p>Magneto is a solo studio helping … overwhelm.</p>\n"`.
   - The existing `wysiwyg` field `aboutData.generalText` comes back from GraphQL **normalized by `the_content`** (raw
     meta 1 423 chars with `\r\n` → GraphQL 1 393 chars).
   - `about-magneto/page.tsx:77-79` renders `aboutData.description` as a **text node** inside `<p>`. React escapes
     it, so changing that field from `text` to `wysiwyg` would print literal `<p>…</p>` on the live About page within
     about 60 s. The same holds for `ServicesList.tsx:57-59` (`services › description`) and
     `PackageCard/index.tsx:123` (`packages_elements › description`).
   - `AboutSection` (`dangerouslySetInnerHTML`) would survive the change, but one rule for all fields is simpler and
     safer than a per-field exception.
   - **The expand/contract rule is confirmed.**
3. **ACF `url` fields reject relative paths.** `acf_validate_value('/contact', <prefooter_cta_link>)` → `false`, and
   `'https://x.co/contact'` → `true`. Internal, locale-aware links (`/contact`, `/packages#build`) must be stored as
   `text` paths and localized by the frontend (`localizePath`, ADR 0003).

Other facts used:
- Location rules are by EN page ID. Translations inherit groups through WPML ID mapping (FR 535/558/550 = EN
  2/38/498).
- Empty text fields return ACF **defaults** (old EN funnel copy).
- Repeater structure is Copy (1), so row counts are shared across languages.
- There's no `acf-json` folder, so groups move between environments by ACF → Tools export/import (`WP-SETUP.md`).
- The WPML Language-box "Duplicate" is unreliable (Phase 3 report).

## Decision

1. **Expand/contract for every ACF change until the release that uses it.**
   - **Never** change the type, meaning or location *narrowing* of an existing field before the release that switches
     the frontend.
   - Add **new** fields beside the old ones. The new frontend reads the new field and **falls back to the old field
     when the new one is empty**, so PR previews against production (old content, new fields empty) render the old
     content in the new layout instead of empty sections.
   - Allowed before release: adding fields, adding groups, **widening** a location rule, and removing a default only
     where step 0 of the runbook proves every live read of that field has a saved value (decision 3).
   - A **cleanup phase** after the last Phase 5 release (R3) removes the old fields, the fallbacks and the old defaults
     ("contract").
2. **One ACF export for all of Phase 5.**
   - Every field in the table below is created locally in Phase 5a part 1, exported once (ACF → Tools → Export,
     including ACFML settings) and committed as `docs/acf/phase-5-field-groups.json`.
   - It's imported into production **before** the 5a PR preview, following a runbook (backup, before/after capture,
     rollback).
   - Fields for 5b, 5d-lite and later are added now and stay unused until their phase. If a later phase needs one
     more field, it's another **additive** export with its own runbook. Never a retype.
3. **Per-page final CTA.**
   - `finalCtaSection`'s location widens from `(page==2)` to `(post_type==page) OR (post_type==project)`.
   - It renders from each route page (not from the layout), reading that page's or project's values, and **falls back
     to the locale's home values when the page's `title` is empty**.
   - The group's old defaults ("Stop losing leads. Start converting.", "Request your free funnel quote…", "Request Free
     Quote") are **removed** in the same export. Otherwise a page with no values would show them instead of falling
     back.
   - Internal links use new `text` path fields. A primary CTA with no path opens the strategy-call modal, so every
     "Book a Strategy Call" uses the same modal → Calendly flow.
4. **Content that rewrites existing values or repeater rows is loaded into production on release day only.**
   - This covers heroes, services 7 → 3 + 4, packages, featured services, testimonials, projects, the footer line,
     About `generalText` and post titles.
   - It goes through the Phase 5c loader, run against production with: `--dry-run` (prints the diff), a `wp db export`
     before and after, and a read-back of every written field by language + slug.
   - Values for **new** fields may be loaded earlier, because the current frontend doesn't read them.
   - FR/ES content may be loaded whenever ready, because disabled locales 404 at the middleware (ADR 0003).
5. **Ordering:** projects get `displayOrder` (number, Copy). The frontend sorts ascending, missing values last, with
   the GraphQL order as the tie-breaker. Post dates, Post Types Order and `menu_order` are not used for display order:
   `orderby: MENU_ORDER` didn't change the GraphQL order (gap analysis E1c).
6. **Testimonials render only rows that have a `role`.**
   - The 4 placeholder rows (Elena M., Marcus T., Sarah K., David R.) have no `role`, so the unhidden block can never
     render them, even against production data before release day.
   - Release day replaces them with Dangel + Isra in all three languages.
   - The "Translated from Spanish" line is a per-locale `note` field, because Isra wrote in all three languages.
7. **Packages get a generic "content sections" repeater** (heading + HTML body) for "Paid Website Diagnostic" and
   "Good to Know". About `generalText` stays as it is (structure untouched; content rewritten on release day).
8. **All new HTML fields render through `isomorphic-dompurify`** (AGENTS convention).

### Fields added by the Phase 5 export (all additive)
GraphQL names follow WPGraphQL ACF's camelCase of the ACF name. "Pref" = ACFML preference: the mode default for the
type, to be checked in the post-import dump; 2 = Translate, 1 = Copy.

| Group (GraphQL) | Change | ACF name → GraphQL | Type | Pref | Used by |
|---|---|---|---|---|---|
| `finalCtaSection` | location `(page==2)` → `(post_type==page) OR (post_type==project)`; **remove defaults** of `title`, `subtitle`, `prefooter_cta_text` | — | — | — | 5a |
| `finalCtaSection` | add | `cta_path` → `ctaPath` | text | 2 | 5a |
| `finalCtaSection` | add | `secondary_cta_text` → `secondaryCtaText` | text | 2 | 5a |
| `finalCtaSection` | add | `secondary_cta_path` → `secondaryCtaPath` | text | 2 | 5a |
| `homeAboutSection` | add | `description_html` → `descriptionHtml` | wysiwyg | 2 | 5a |
| `homeFeaturedServices.service` | add | `service_tagline` → `serviceTagline` | text | 2 | 5a |
| `homeTestimonialsSection.testimonials` | add | `role`, `company`, `city`, `note` | text ×4 | 2 | 5a |
| `aboutData` | add | `description_html` → `descriptionHtml` | wysiwyg | 2 | 5a |
| `aboutData` | add | `cta_text` → `ctaText`, `cta_path` → `ctaPath` | text ×2 | 2 | 5a |
| `projectsProjectData` (top level) | add | `card_description` → `cardDescription` | text | 2 | 5a |
| `projectsProjectData` (top level) | add | `display_order` → `displayOrder` | number | **1** | 5a |
| `pageintrotext` | add | `intro_body_html` → `introBodyHtml` | wysiwyg | 2 | 5b |
| `servicesServiceDetails` | add | `core_heading`, `supporting_heading`, `supporting_intro` | text ×3 | 2 | 5b |
| `servicesServiceDetails.services` | add | `heading`, `cta_text`, `cta_path`, `anchor_id` | text ×4 | 2 | 5b |
| `servicesServiceDetails.services` | add | `description_html` | wysiwyg | 2 | 5b |
| `servicesServiceDetails.services` | add | `service_group` (`core` \| `supporting`) | select | **1** | 5b |
| `packagesPackageFeatures.packages_elements` | add | `heading`, `features_title`, `cta_text`, `cta_path`, `anchor_id` | text ×5 | 2 | 5b |
| `packagesPackageFeatures.packages_elements` | add | `description_html` | wysiwyg | 2 | 5b |
| **new group** `packagesContentSections` (page==36) | add | `sections[]`: `heading` (text), `body_html` (wysiwyg) | repeater | 1 / 2 / 2 | 5b |
| `contactContactTexts` | add | `supporting_html` → `supportingHtml` | wysiwyg | 2 | 5d-lite / R1 Contact copy |

Not ACF:
- Privacy Policy is a WP page `privacy-policy` read through its `content`.
- UI microcopy stays in the dictionaries (ADR 0005).

The 5b/5d rows may be refined by their specs **only by adding**. Existing fields keep their type and meaning until the
cleanup phase.

## Consequences

- \+ The live site never shows half-migrated data. Each PR preview against production shows old content in the new
  layout, which is a real compatibility test.
- \+ One production import, one runbook, one rollback point for the schema.
- \+ The old copy disappears only when the release-day loader replaces it, verified by read-back.
- − Duplicate fields until cleanup (e.g. `description` + `descriptionHtml`). Editors see both in WP admin; the spec
  labels the old ones "(legacy — do not edit)" in their ACF instructions.
- − Fallback code paths must be tested in both states: new fields empty and new fields filled.
- − A cleanup phase is required after R3. It carries its own runbook (removing fields deletes their meta).
- − Release day carries a production content write with a dry-run, backups and read-back. Mauricio runs it; agents
  never write to production.
- − `displayOrder` must be written in every language (Copy only copies on a WPML translation save, not via
  `update_field`).

## Alternatives considered

- **Change field types in place (`text` → `wysiwyg`).** Rejected: literal `<p>` on the live About, Services and
  Packages pages within about 60 s (Context 2).
- **Load all content into production first, then promote the frontend.** Rejected: the current frontend would show
  the new text in the old layout (BUILD/FIX/CARE inside funnel package cards) and unhide nothing.
- **CPTs for services, packages and testimonials.** Cleaner long term, but a bigger migration: new GraphQL types,
  WPML settings, a production runbook for post types and every query rewritten. Out of proportion for R1.
- **ACF Flexible Content per page.** Heavy editing UX and a large component rewrite. The generic repeater covers the
  only open-ended case (Packages).
- **Order by `menu_order` / Post Types Order.** The GraphQL order didn't follow `orderby: MENU_ORDER` locally (gap
  analysis E1c). Explicit data is easier to verify.
- **Final CTA kept in the layout, choosing the page from the pathname.** The server layout doesn't receive the
  pathname, and ADR 0005 forbids taking the locale from it. Page-level rendering is explicit.
