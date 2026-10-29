# Phase 5a report — Structure: shared sections, Home, About, case studies

- Spec: `docs/specs/phase-5a-structure-shared-home-about-cases.md` (Approved 2026-10-26) · ADR 0006 (Accepted)
- Author: Dev (Claude Code) · Date: 2026-10-26
- Branch: `feat/phase-5a` from `master` @ `5d4c90f`. Nothing staged, nothing committed.

**Current status — final Spanish CTA, 2026-10-27 (Codex):** “Reservar consulta” is synchronized and locally
verified. The Local CMS blocker is resolved; both builds, 293 tests, TypeScript, browser checks and fresh screenshots
are complete. Lint retains the documented baseline. Final AC-24 approval remains pending; see the last section.

**Previous status — visual corrections, 2026-10-27 (Codex):** the Senior Architect returned **CHANGES REQUIRED** for
AC-24 (tablet Home heading and Spanish mobile header). Both requested fixes are now implemented and verified locally;
the final section contains replacement screenshots and evidence. **Architect re-review and Mauricio's AC-24 visual
approval remain pending.** AC-20 confirmation and AC-22/23 remain outstanding. Lint still exits 1 on unchanged
baseline findings. Earlier findings and screenshots below are preserved as history, not current visual acceptance.

---

## Part 1 — mid-phase checkpoint

### Result
**Part 1 done; stopped at the checkpoint.** The Phase 5 ACF schema is written as code, diffed (AC-7b) and imported
locally by Mauricio. The ACFML dump and introspection verify it (AC-6), and the home final CTA is unchanged (AC-7).
The data layer and tests are done (gate green, `no-explicit-any` unchanged). The fixtures script is written and **not
run**. The brand is renamed in code (O3). No component changes (Part 2) were made.

### Pre-flight (before any write)
- Spec status: Approved; ADR 0006: Accepted.
- `.env.local`:
  - `NEXT_PUBLIC_WORDPRESS_API_URL` host = `magneto-cms-2.local`;
  - `DISABLE_SMTP=1`;
  - `MAILCHIMP_*`, `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_GTM_ID` are absent (= empty). No form was submitted.
- **Baseline at the branch point (`master` 5d4c90f), measured first:**
  - lint: **115 errors / 110 warnings**;
  - `@typescript-eslint/no-explicit-any`: **98** (6 of them in test files, 92 elsewhere).
  - AGENTS.md says "122 `no-explicit-any` (102 outside test files)". That number is stale (see Issues).
- A3b holds: in `phase-5-before.json`, all 72 fields carry `wpml_cf_preferences` and all 13 groups carry
  `acfml_field_group_mode: translation`.
- **The before export has 14 entries, not 13:** the 13 field groups plus the ACF **post type** `project`
  (`post_type_689bb2945f206`). ACF 6.x exports post types alongside field groups. Mauricio's decision (2026-10-26) is
  recorded under Deviations, D1.

### Changes
| File | What |
|---|---|
| `docs/acf/phase-5-field-groups.json` (new) | The 13 groups from `phase-5-before.json` plus every ADR 0006 change, plus the new `packagesContentSections` group. Field groups only: the CPT entry is excluded (D1). It uses the same encoding as ACF's export (4-space pretty print, escaped `/`, unescaped unicode), so `git diff --no-index` against the before file stays readable. |
| `scripts/phase-5a/acf-json-diff.mjs` (new) | Node, no dependencies, read-only. It compares `group_*` entries and their fields by key, recursively, and prints Added / Removed / Changed settings (ignoring `modified`) / Existing keys reordered. Non-group entries go to an "Excluded by design" section and aren't compared. Exit code: 1 if anything was removed, 2 on bad input. |
| `scripts/phase-5a/local-fixtures.php` (new, **not run**) | EN fixtures for state N (field map). Aborts unless `home_url()` is `http://magneto-cms-2.local`, and checks every target post's type, slug and language before writing. Takes a `dry-run` argument, writes by field key, reads every value back and probes FR/ES Copy meta (see Issues I-6). |
| `src/components/organisms/FinalCTASection/{api.ts,types.ts}` | `getFinalCta(source, locale)`. `source` is `{kind:'page',name}` or `{kind:'project',slug}`. The query adds `ctaPath secondaryCtaText secondaryCtaPath`. When the source's own `title` is empty, it returns the locale's home values **whole** (A1). Own values without a background image get the home background. `getHomePrefooter` is kept as the home reader (its query gains the 3 new fields). New type `FinalCtaSource`. |
| `src/components/organisms/Testimonials/api.ts` | Queries `role company city note`. Typed rows (no `any`). **Only rows with a non-empty `role`** are returned; empty optional fields become `null`. |
| `src/components/organisms/AboutSection/api.ts` | Queries `descriptionHtml`. Returns typed `HomeAboutSectionData`; `bodyHtml` = `descriptionHtml` if set, else the legacy `description`. |
| `src/components/organisms/FeaturedServices/{api.ts,types.ts}` | Queries `serviceTagline` (no legacy fallback). |
| `src/app/[locale]/about-magneto/api.ts` | Queries `descriptionHtml ctaText ctaPath`. Adds `founder` (`{kind:'html'}` from `descriptionHtml`, else `{kind:'text'}` from `description`, else `null`) and `cta` (`{text,path}` only when both are set, else `null` → the current `CalendlyButton`). |
| `src/data/projects.ts`, `src/app/[locale]/projects/[slug]/api.ts` | `GET_PROJECTS` and `GET_PROJECT_BY_SLUG_QUERY` add `projectsProjectData { cardDescription displayOrder }`. `ProjectNode` type extended. |
| `src/app/[locale]/projects/api.ts`, `src/components/organisms/ProjectsGrid/types.ts` | `getProjects` maps `description = cardDescription \|\| projectSubtitle \|\| ''` and sorts by `displayOrder` ascending, nulls last, with the GraphQL order as tie-breaker. `ProjectItem.description?` added; `solutions/results` are kept until Part 2. |
| Tests: `FinalCTASection/api.test.ts`, `Testimonials/api.test.ts`, `AboutSection/api.test.ts`, `FeaturedServices/api.test.ts`, `about-magneto/api.test.ts`, `projects/api.test.ts` | State C, state N, `nodes: []` and edge cases for every mapper (see Evidence E7). |
| `src/utils/seo.ts` | `siteName` and `defaultOgImage.alt` → "Magneto Web Consulting" (O3). |
| `src/i18n/dictionaries/{en,fr,es}.ts` | `meta.site.fallbackTitle` → "Magneto Web Consulting" in all three locales (a proper name, so FR/ES leave `TODO`). |
| `src/i18n/dictionaries/en.test.ts` | The fingerprint line for `meta.site.fallbackTitle` only (full regeneration is Part 2, item 12). |
| `src/i18n/dictionary.test.ts` | Readiness test: FR/ES must list every key as TODO **except** an explicit set (`meta.site.fallbackTitle`). The guard test is otherwise unchanged; `:116` is updated in Part 2. |

### Local import (Mauricio) and backups
| Time (2026-10-26) | Step | Evidence |
|---|---|---|
| 18:23 | `docs/acf/phase-5-before.json` exported (13 groups + the project CPT) | the file (untracked) |
| 18:42:48 | `wp db export` → `backups/phase-5a/magneto-cms-2_phase5a-acf-before_20261026-1842.sql` | complete dump (`Dump completed on 2026-10-26 18:42:48`), **0** `field_p5_*` keys |
| 18:45 | ACF → Tools → Import `phase-5-field-groups.json` | 14 groups, no duplicates; "Packages - Content Sections" = post 583; the 13 existing groups kept their post IDs (updated in place) |
| 18:49 | Re-export (field groups only) → `~/Downloads/acf-export-2026-10-26.json` | diffed below (E3) |
| 18:55:20 | `wp db export` → `backups/phase-5a/magneto-cms-2_phase5a-acf-after_20261026-1855.sql` | complete, **34** `field_p5_*` keys |

**Backup discrepancy, for Mauricio to confirm.** Mauricio wrote that the import ran "without a prior db export" and named
`backups/magneto-cms-2_phase3-after_20261024-2228.sql` as the pre-import fallback. What's on disk differs:
- `phase-5a/…acf-before_20261026-1842.sql` exists. It finished 3 min before the import and contains no Phase 5 keys,
  so it looks like a valid pre-import restore point.
- `phase3-after_20261024-2228.sql` is **not** the latest pre-import state. Three later dumps exist:
  `phase3-after-h1fix_…2309`, `…h1fix2_…2329` and `…h1fix3_…2337`. Restoring 22:28 would undo the Phase 3 H1 fixes.
- Recommended rollback point for the ACF import: `acf-before_20261026-1842`, then `phase3-after-h1fix3_20261024-2337`
  as the next fallback. I checked only that each file is complete and has no Phase 5 keys. I didn't import or diff the
  contents (no DB writes).

### Gate
| Check | Result | Notes |
|---|---|---|
| lint | **failed (baseline)** | 115 errors / 110 warnings, exactly the branch-point numbers; same set of flagged files (diff of file lists empty). No new findings. |
| `no-explicit-any` (AC-2) | **passed** | 98 → **98** (6 in tests). |
| typecheck | passed | `tsc --noEmit` exit 0. |
| tests | passed | 29 files / **291 tests**. |
| build (`.env.local` as is: `en,fr,es`, no override) | failed **by design** | ADR 0005 guard: "enables fr, but its dictionary has 114 untranslated keys" (115 before; `fallbackTitle` is no longer TODO). This is the AC-3 negative case. |
| build `ENABLED_LOCALES=en` (no override) | passed | 14 static pages; `/en/projects/{trepied, shamaniccas, fashion-company}` prerendered (AC-3). |
| build `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1` | passed | 28 static pages (AC-3). |
| visual | not run | Part 1 has no component changes; states C/N are Part 2. |

The env overrides were shell-only. `.env.local` was not edited. No dev or start server was started (no PID to stop),
and no other server was using `.next` during the builds.

### Evidence

**E1. AC-7b — `node scripts/phase-5a/acf-json-diff.mjs docs/acf/phase-5-before.json docs/acf/phase-5-field-groups.json`** (exit 0)
```
groups: 13 → 14

== Excluded by design (non-group entries, not compared) ==
  before: post_type_689bb2945f206 [post_type] Projects

== Added (35) ==
  + field field_p5_pageintrotext_intro_body_html  pageIntroText > intro_body_html  [wysiwyg] gql=introBodyHtml pref=2
  + field field_p5_aboutdata_description_html  About - Data > description_html  [wysiwyg] gql=descriptionHtml pref=2
  + field field_p5_aboutdata_cta_text  About - Data > cta_text  [text] gql=ctaText pref=2
  + field field_p5_aboutdata_cta_path  About - Data > cta_path  [text] gql=ctaPath pref=2
  + field field_p5_contactcontacttexts_supporting_html  Contact - Contact Texts > supporting_html  [wysiwyg] gql=supportingHtml pref=2
  + field field_p5_projectsprojectdata_card_description  Projects - Project Data > card_description  [text] gql=cardDescription pref=2
  + field field_p5_projectsprojectdata_display_order  Projects - Project Data > display_order  [number] gql=displayOrder pref=1
  + field field_p5_homeaboutsection_description_html  homeAboutSection > description_html  [wysiwyg] gql=descriptionHtml pref=2
  + field field_p5_finalctasection_cta_path  finalCtaSection > cta_path  [text] gql=ctaPath pref=2
  + field field_p5_finalctasection_secondary_cta_text  finalCtaSection > secondary_cta_text  [text] gql=secondaryCtaText pref=2
  + field field_p5_finalctasection_secondary_cta_path  finalCtaSection > secondary_cta_path  [text] gql=secondaryCtaPath pref=2
  + field field_p5_homefeaturedservices_service_service_tagline  homeFeaturedServices > service > service_tagline  [text] gql=serviceTagline pref=2
  + field field_p5_hometestimonialssection_testimonials_role  Home - Testimonials > testimonials > role  [text] gql=role pref=2
  + field field_p5_hometestimonialssection_testimonials_company  Home - Testimonials > testimonials > company  [text] gql=company pref=2
  + field field_p5_hometestimonialssection_testimonials_city  Home - Testimonials > testimonials > city  [text] gql=city pref=2
  + field field_p5_hometestimonialssection_testimonials_note  Home - Testimonials > testimonials > note  [text] gql=note pref=2
  + field field_p5_packagespackagefeatures_packages_elements_heading  Packages - Package Features > packages_elements > heading  [text] gql=heading pref=2
  + field field_p5_packagespackagefeatures_packages_elements_description_html  Packages - Package Features > packages_elements > description_html  [wysiwyg] gql=descriptionHtml pref=2
  + field field_p5_packagespackagefeatures_packages_elements_features_title  Packages - Package Features > packages_elements > features_title  [text] gql=featuresTitle pref=2
  + field field_p5_packagespackagefeatures_packages_elements_cta_text  Packages - Package Features > packages_elements > cta_text  [text] gql=ctaText pref=2
  + field field_p5_packagespackagefeatures_packages_elements_cta_path  Packages - Package Features > packages_elements > cta_path  [text] gql=ctaPath pref=2
  + field field_p5_packagespackagefeatures_packages_elements_anchor_id  Packages - Package Features > packages_elements > anchor_id  [text] gql=anchorId pref=2
  + group group_p5_packagescontentsections  Packages - Content Sections  [group] gql=packagesContentSections pref=mode=translation
  + field field_p5_packagescontentsections_sections  Packages - Content Sections > sections  [repeater] gql=sections pref=1
  + field field_p5_packagescontentsections_sections_heading  Packages - Content Sections > sections > heading  [text] gql=heading pref=2
  + field field_p5_packagescontentsections_sections_body_html  Packages - Content Sections > sections > body_html  [wysiwyg] gql=bodyHtml pref=2
  + field field_p5_servicesservicedetails_core_heading  Services - Service Details > core_heading  [text] gql=coreHeading pref=2
  + field field_p5_servicesservicedetails_supporting_heading  Services - Service Details > supporting_heading  [text] gql=supportingHeading pref=2
  + field field_p5_servicesservicedetails_supporting_intro  Services - Service Details > supporting_intro  [text] gql=supportingIntro pref=2
  + field field_p5_servicesservicedetails_services_heading  Services - Service Details > services > heading  [text] gql=heading pref=2
  + field field_p5_servicesservicedetails_services_description_html  Services - Service Details > services > description_html  [wysiwyg] gql=descriptionHtml pref=2
  + field field_p5_servicesservicedetails_services_cta_text  Services - Service Details > services > cta_text  [text] gql=ctaText pref=2
  + field field_p5_servicesservicedetails_services_cta_path  Services - Service Details > services > cta_path  [text] gql=ctaPath pref=2
  + field field_p5_servicesservicedetails_services_anchor_id  Services - Service Details > services > anchor_id  [text] gql=anchorId pref=2
  + field field_p5_servicesservicedetails_services_service_group  Services - Service Details > services > service_group  [select] gql=serviceGroup pref=1

== Removed (0) ==
  (none)

== Changed settings (10 keys) ==
  ~ field field_68cb1f8940e08  pageIntroText > pageintrotext
      instructions: "" → "(legacy — do not edit; replaced by Intro Body (HTML))"
  ~ field field_689baea2c2661  About - Data > description
      instructions: "" → "(legacy — do not edit; replaced by Description (HTML))"
  ~ field field_689ba98084eaf  Contact - Contact Texts > bodytext
      instructions: "" → "(legacy — do not edit; replaced by Supporting Text (HTML))"
  ~ field field_689a5be67c99d  homeAboutSection > description
      instructions: "" → "(legacy — do not edit; replaced by Description (HTML))"
  ~ group group_689a58f582e2e  finalCtaSection
      location: [[{"param":"post_type","operator":"==","value":"page"},{"param":"page","operator":"==","value":"2"}]] → [[{"param":"post_type","operator":"==","value":"page"}],[{"param":"post_type","operator":"==","value":"project"}]]
      graphql_types: ["Page"] → ["Page","Project"]
  ~ field field_689a58f65e417  finalCtaSection > title
      default_value: "Stop losing leads. Start converting." → ""
  ~ field field_689a592f5e419  finalCtaSection > subtitle
      default_value: "Request your free funnel quote today and find out what's holding you back." → ""
  ~ field field_689a59405e41a  finalCtaSection > prefooter_cta_text
      default_value: "Request Free Quote" → ""
  ~ field field_689a4b95fdf4c  Packages - Package Features > packages_elements > description
      instructions: "" → "(legacy — do not edit; replaced by Description (HTML))"
  ~ field field_689a5f5fc2a9f  Services - Service Details > services > description
      instructions: "" → "(legacy — do not edit; replaced by Description (HTML))"

== Existing keys reordered (0) ==
  (none)
```
The changes fall only into the AC-7b categories:
- 35 additions = 34 ADR 0006 fields + the `packagesContentSections` group;
- 3 default removals;
- the location change and its explicit `graphql_types`;
- 6 legacy `instructions`.

Removed (groups): none, without exception (D1).

Key hygiene:
- `grep -c '_p5_' phase-5-before.json` = 0, so no new key collides with an existing one;
- there are no duplicate keys in the after file;
- no GraphQL field name collides under any parent (explicit `graphql_field_name`, or the camelCase of `name` when absent).

**E2. Legacy instructions: the superseded fields (for approval).** Only fields that a new field replaces one-for-one:
- `homeAboutSection.description` → `description_html`;
- `aboutData.description` → `description_html`;
- `pageintrotext` → `intro_body_html`;
- services `description` → `description_html`;
- packages `description` → `description_html`;
- contact `bodytext` → `supporting_html`.

Not marked, because the old field keeps its role:
- `finalCtaSection.prefooter_cta_link` (still the modal's Calendly URL);
- `aboutData.calendly_*` (still the CTA fallback);
- `project_subtitle` (case-study hero);
- `footerLine1` (no replacement field).

**E3. Re-export vs `phase-5-field-groups.json`** (`acf-json-diff.mjs`, exit 0):
- Added 0 · Removed 0 · **Changed settings 0** · Excluded none (the CPT wasn't exported).
- "Existing keys reordered: 2" is cosmetic:
  - Top level: the export lists groups by `menu_order`, and `packagesContentSections` (`menu_order` 1) comes last.
  - `testimonials` sub-fields: on import ACF gave `role` `menu_order` 2 but left the existing `thumb` at 2, so the tie
    sorts by ID and the admin shows `thumb` before `role` (read-only check: author 0, testimonial 1, thumb 2 (ID 90),
    role 2 (ID 573), company 3, city 4, note 5). Other repeaters were renumbered as written (services 0–10).
  - GraphQL and the frontend don't depend on field order. The JSON is left as written (see I-3).

**E4. AC-6 — ACFML dump after import** (WP-CLI with Local's binaries, read-only `eval-file`, the WP-SETUP walk plus
key, graphql types, location and defaults):
- **14 groups**, all `mode=translation`; `pref=-`: 0; `mode=-`: 0.
- `display_order [number] pref=1`, `services > service_group [select] pref=1`, `sections [repeater] pref=1`. Every
  other new field is pref=2. Before → after diff: 34 new field lines (3 pref=1, 31 pref=2) plus the 3 `finalCtaSection`
  lines that lost their defaults.
- `finalCtaSection`: `types=["Page","Project"]`, location `[[post_type==page],[post_type==project]]`; `title`,
  `subtitle`, `prefooter_cta_text` **have no default** (AC-7, dump half).
- Pre-import dump (same script, before 18:45): 13 groups, all `mode=translation`, no `pref=-`, and the group keys
  equal the `phase-5-before.json` group keys (sorted-list diff empty).

<details><summary>Full post-import dump</summary>

```
== About - Data | key=group_689bae6caa678 | mode=translation | gql=aboutData | types=["Page"] | loc=[[page==32]]
   section_title [text] pref=2 · description [text] pref=2 · description_html [wysiwyg] pref=2 · link_text [text] pref=2
   link_url [text] pref=2 · general_text [wysiwyg] pref=2 · calendly_text [text] pref=2 · calendly_url [url] pref=1
   cta_text [text] pref=2 · cta_path [text] pref=2
== Contact - Contact Texts | key=group_689ba94657393 | mode=translation | gql=contactContactTexts | loc=[[page==41]]
   main_copy [text] pref=2 · tag_text [text] pref=2 · bodytext [textarea] pref=2 · supporting_html [wysiwyg] pref=2
== finalCtaSection | key=group_689a58f582e2e | mode=translation | types=["Page","Project"] | loc=[[post_type==page],[post_type==project]]
   title [text] pref=2 · subtitle [text] pref=2 · prefooter_cta_text [text] pref=2 · prefooter_cta_link [url] pref=1
   cta_path [text] pref=2 · secondary_cta_text [text] pref=2 · secondary_cta_path [text] pref=2 · bgimage [image] pref=1
== heroContent | key=group_689a2d99bc46f | mode=translation | types="" | loc=[[post_type==page]]
   hero_title [text] pref=2 · subtitle_hero [text] pref=2 · cta_text_hero [text] pref=2 · cta_link_hero [text] pref=2
   image [image] pref=1 · background_image [image] pref=1
== Home - Footer | key=group_68b33adfafa9c | mode=translation | loc=[[page==2]]
   footerLine1 [text] pref=2 · footerSocialIcons [repeater] pref=1 (> iconSvg [image] pref=1 · > iconUrl [url] pref=1)
   footerLine2 [text] pref=2
== Home - Testimonials | key=group_689a37f06db47 | mode=translation | loc=[[page==2]]
   testimonials [repeater] pref=1 > author [text] 2 · testimonial [text] 2 · thumb [image] 1 · role [text] 2
   · company [text] 2 · city [text] 2 · note [text] 2
== homeAboutSection | key=group_689a5bb650fb6 | mode=translation | loc=[[page==2]]
   aboutSectionTitle [text] pref=2 · description [text] pref=2 · description_html [wysiwyg] pref=2
== homeFeaturedServices | key=group_689a539447013 | mode=translation | loc=[[page==2]]
   sectionTitle [text] pref=2 · service [repeater] pref=1 > service_title [text] 2 · service_tagline [text] 2
   · service_description [text] 2 · service_icon [image] 1 · anchor_link [text] 2
== LeadMagnetSection | key=group_68c87e7e6d796 | mode=translation | loc=[[page==2]]   (unchanged: 4 text pref=2, 1 file pref=1)
== Packages - Package Features | key=group_689a3176ba948 | mode=translation | loc=[[page==36]]
   packages_elements [repeater] pref=1 > name 2 · heading 2 · Popular_Choise [true_false] 1 · icon [image] 1 · price 2
   · description 2 · description_html [wysiwyg] 2 · features_title 2 · features [repeater] 1 (> feature 2)
   · cta_text 2 · cta_path 2 · anchor_id 2
== pageIntroText | key=group_68cb1f886eb9b | mode=translation | loc=[[page==34],[page==38],[page==36]]
   pageintrotext [text] pref=2 · intro_body_html [wysiwyg] pref=2
== Projects - Project Data | key=group_689a6d041e120 | mode=translation | types=["Project"]
   project_data [group] pref=1 (> project_subtitle 2 · project_url [url] 1 · project_description [wysiwyg] 2
   · challenges/solutions/results [repeater] 1 > item 2) · card_description [text] 2 · display_order [number] 1
   · images [repeater] 1 (> image 1 · foot_note 2 · ismobilescreenshot [true_false] 1)
== Services - Service Details | key=group_689a30edd36b7 | mode=translation | loc=[[page==34]]
   core_heading 2 · supporting_heading 2 · supporting_intro 2 · services [repeater] 1 > title 2 · heading 2
   · featured_service [true_false] 1 · Image [image] 1 · icon [image] 1 · description 2 · description_html [wysiwyg] 2
   · cta_text 2 · cta_path 2 · anchor_id 2 · service_group [select] 1
== Packages - Content Sections | key=group_p5_packagescontentsections | mode=translation | types=["Page"] | loc=[[page==36]]
   sections [repeater] pref=1 > heading [text] pref=2 · body_html [wysiwyg] pref=2
```
(Condensed from the raw output: one line per field, with the `post_type==page AND` part of the locations shortened.
The raw dump is kept in the session scratchpad.)
</details>

**E5. Schema check (Part 1.2, AC-6) — introspection after import:** 42/42 checks OK, 0 missing.
- `FinalCtaSection`: `ctaPath secondaryCtaText secondaryCtaPath` (+ the 5 existing).
- `HomeAboutSection.descriptionHtml`; `AboutData`: `descriptionHtml ctaText ctaPath`.
- `ProjectsProjectData`: `cardDescription`, `displayOrder` (**Float**).
- `Pageintrotext.introBodyHtml`.
- `ServicesServiceDetails`: `coreHeading supportingHeading supportingIntro`.
- `ContactContactTexts.supportingHtml`.
- `HomeFeaturedServicesService.serviceTagline`.
- `HomeTestimonialsSectionTestimonials`: `role company city note`.
- `ServicesServiceDetailsServices`: `heading descriptionHtml ctaText ctaPath anchorId serviceGroup` (`serviceGroup` is
  `[String]`, a LIST; note for 5b).
- `PackagesPackageFeaturesPackagesElements`: `heading descriptionHtml featuresTitle ctaText ctaPath anchorId`.
- `PackagesContentSections.sections` → `heading bodyHtml`.
- **`Project.finalCtaSection`** and **`Page.packagesContentSections`** present (before the import: `Project` had no
  `finalCtaSection`).

**E6. AC-7, GraphQL half: home final CTA before vs after the import.** Query `pages(first:1, where:{language, name:"home"})
{ finalCtaSection { title subtitle ctaText ctaLink bgimage } }` for EN (2), FR (535) and ES (536), captured before and
after. SHA-256 of `data`: before `b2f69fa0c61c…5e38f08` = after `b2f69fa0c61c…5e38f08` (**identical**). All three homes
have **saved** values ("Ready to stop guessing and start converting?", "Get Your Free Strategy Call"), so removing the
defaults changed nothing.

**E7. Data layer against the live local CMS (state C).** I ran the real `getFinalCta`, `getHomePrefooter`,
`getHomeTestimonials`, `getHomeAboutSection`, `getHomeFeaturedServices`, `getAboutPageData`, `getProjects` and
`getProjectBySlug` functions, unmocked, in EN/FR/ES. This used a throwaway vitest file in the scratchpad (node
environment, read-only queries). No GraphQL errors. Results:
- final CTA for `about-magneto` and for project `trepied-trepied-ca` → the home values (title empty → fallback);
- testimonials → `[]` in all 3 locales (the 4 placeholder rows have no `role`);
- home about `bodyHtml` = legacy `description`;
- About `founder` = `{kind:'text'}`, `cta` = `null`; FR/ES About page doesn't exist → null (the route 404s, as before);
- projects EN: Trépied, Shamanicca, Dangel (GraphQL order, `displayOrder` null), description = `projectSubtitle`;
- FR/ES: Trépied only.

**E8. Unit tests added or changed** (all mocked; 291 total, all green):
- `getFinalCta`, 7 cases:
  - home → one request;
  - state C with an orphan `subtitle` → home values, whole;
  - whitespace title → empty;
  - state N without a background → own values + home background;
  - own background → one request;
  - project query uses `projects(…name: $name)` with the slug;
  - `nodes: []` → home, then `{}`.
- Testimonials: the 4 placeholder rows → `[]`; state N with Dangel/Isra (whitespace role dropped, `''` → `null`);
  query fields.
- `getHomeAboutSection`: state C, state N, whitespace HTML → legacy, both empty → `''`.
- Featured services: `serviceTagline` in state N and C.
- About page: state C `founder` text / `cta` null; state N html + cta; cta needs both fields.
- Projects:
  - query fields;
  - **sort 10/20/40 + null → Dangel, Shamanicca, Trépied, then the null project**;
  - state C keeps the GraphQL order;
  - ties keep the GraphQL order;
  - description chain `cardDescription` → `projectSubtitle` → `''`.

**E9. Fixtures script checks (not run):**
- `php -l` → no syntax errors;
- every field key in it exists in `phase-5-field-groups.json`;
- every copy string in it is found verbatim in `magneto-copy-en.md` (`23b620a`) after removing `**` and “ ”
  (46 strings checked, 0 mismatches).

Target IDs, read-only:
- home 2 (fr 535, es 536); `about-magneto` 32, `services` 34, `packages` 36 (no FR/ES);
- projects 270 Dangel (`fashion-company-ecommerce`), 498 Trépied (fr 550, es 541), 224 Shamanicca (no FR/ES);
- featured-service icons 74 / 69.

**E10. Hygiene so far:**
- AC-4: `git diff --stat master` lists 23 modified files, all in the spec's list, plus the untracked `docs/acf/` and
  `scripts/phase-5a/`. `docs/acf/phase-5-before.json` is Mauricio's (untracked, unchanged).
- AC-5: no `dangerouslySetInnerHTML` added (the only diff hit is a doc comment).
- AC-7c (partial; complete after Part 2): `siteName`, the OG alt and `meta.site.fallbackTitle` (EN/FR/ES) now read
  "Magneto Web Consulting". `grep "Magneto Marketing"` still finds:
  - the per-page `meta.*` values (5b) and their fingerprint lines;
  - `footer.copyright` and its `dictionary.test.ts` assertion (Part 2, item 12);
  - the `format.ts:17` comment.

### Deviations from the spec
- **D1. The CPT entry is excluded from the Phase 5 JSON** (Mauricio, 2026-10-26). `phase-5-field-groups.json` holds
  field groups only (13 updated + `packagesContentSections`). The `project` post type entry
  (`post_type_689bb2945f206`) from the before export is left out on purpose, so the import never re-saves the CPT (no
  permalink or settings side effects, a smaller blast radius in production). `acf-json-diff.mjs` compares `group_*`
  entries only and lists non-group entries under "Excluded by design", so AC-7b's "Removed: none" holds for groups
  without an exception. **Production runbook flag:** step 0 must still diff production's **full** export (CPT
  included) against `phase-5-before.json`. The CPT appears there as an excluded entry on both sides; compare it by eye
  or with a one-line `jq`, and stop if it differs.
- **D2. Choices inside the JSON that the spec didn't fix (for approval):**
  - new `wysiwyg` fields use `toolbar: basic`, `media_upload: 0` (text bodies; DOMPurify on render);
  - `service_group` uses `allow_null: 1`, `default_value: false`, so existing rows stay unset instead of defaulting to
    "Core";
  - explicit `graphql_field_name` on every new field;
  - short editor `instructions` on the new path, order, role/city/note and anchor fields;
  - new fields are placed next to the field they extend (existing key order is unchanged; diff "reordered: 0");
  - `packagesContentSections` uses `menu_order: 1`.
- **D3. `format.ts:17` comment not changed in Part 1.** Its example is the footer copyright, which changes in Part 2
  (item 12). It'll be updated with that key so the comment matches the real value.
- **D4. `en.test.ts` / `dictionary.test.ts` touched in Part 1** (one line each) to keep the gate green after the 1.6
  brand rename. The full fingerprint regeneration stays in Part 2.
- **D5. Fixture values** follow the field map, with three mechanical adjustments documented in the script header:
  - Markdown `**` removed;
  - testimonial “ ” removed (`TestimonialCard` adds `&ldquo;…&rdquo;`);
  - two-paragraph final-CTA bodies (Services 404+406, Packages 526+528) joined with one space, because `subtitle` is a
    single-line `text` field.

### Issues found (not fixed)
- **I-1. Orphan `subtitle` meta on 6 pages.** `about-magneto` 32, `services` 34, `packages` 36, `projects` 38,
  `contact` 41 and FR `projects` 558 have a postmeta `subtitle` whose reference is `field_689a2dbb60320`
  (`heroContent.subtitle_hero`, evidently named `subtitle` earlier). Since the location was widened, GraphQL returns it
  as `finalCtaSection.subtitle` on those pages (e.g. About: "Montreal-based solo agency for websites and funnels that
  sell."). No page except home has a `title`, so the whole-object fallback hides it (unit-tested).
  - **5c loader rule:** whenever it writes a page's `finalCtaSection.title`, it must also write `subtitle` (even `''`).
  - Production likely has the same meta (step 0 can check it read-only). Candidate for the cleanup phase.
- **I-2. AC-18 can't hold as written locally.** FR/ES have only Trépied (550/541), so `/fr/projects` and `/es/projects`
  can't show "Dangel, Shamanicca, Trépied". Suggested reading for the checkpoint: same relative order for the projects
  that exist in that locale, with full order once 5c creates the translations. That's also when the Known-debt
  prerender caveat resolves (today every locale has ≥ 1 project, so it isn't triggered).
- **I-3. Admin field order after import:** `thumb` shows before the new testimonial fields (E3). It's cosmetic and the
  same will happen in production. If wanted, move the 4 fields after `thumb` in the JSON, re-run the diff, and
  re-import locally before the production runbook.
- **I-4. Backups (above):** the pre-import dump at 18:42 exists, and the stated fallback isn't the latest Phase 3 dump.
- **I-5. AGENTS.md Known debt is stale:** "122 `no-explicit-any` (102 outside test files)" is **98 (92)** at
  `5d4c90f`. Not edited (out of scope).
- **I-6. Possible WPML Copy-sync on fixture writes.** `update_field` on EN Copy fields (repeater row counts, icons,
  `display_order`) may be mirrored to FR/ES by WPML's custom-field sync. The script prints the FR/ES home row counts
  before and after so any side effect shows up. FR/ES testimonials would still render nothing (no `role`).
- **I-7. `serviceGroup` is `[String]` in GraphQL** (ACF select → list). 5b must read `serviceGroup?.[0]`.

### Proposed commits (Part 1; not made)
1. `feat(acf): Phase 5 field groups as code with a read-only export diff`: `docs/acf/phase-5-before.json` (Mauricio's
   export, committed unchanged as the diff baseline for the runbook), `docs/acf/phase-5-field-groups.json`,
   `scripts/phase-5a/acf-json-diff.mjs`.
2. `feat(data): per-page final CTA, typed testimonials with role filter, Phase 5 fields and project order`: the 11 data
   files and their 6 test files.
3. `chore(scripts): Phase 5a local EN fixtures (not run)`: `scripts/phase-5a/local-fixtures.php`.
4. `feat(brand): rename the site to Magneto Web Consulting in code (O3)`: `src/utils/seo.ts`,
   `src/i18n/dictionaries/{en,fr,es}.ts`, `en.test.ts`, `dictionary.test.ts`.
5. `docs(phase-5a): checkpoint report`: this file.

### For the checkpoint (Mauricio + Senior Architect)
1. Approve the field list and `phase-5-field-groups.json` as final for production (E1, E2, D1, D2), or ask for I-3.
2. Confirm the rollback point for the local import (I-4).
3. Decide the AC-18 wording (I-2).
4. Schedule the production ACF runbook (Architect writes `docs/specs/phase-5a-production-acf-runbook.md`; it must
   include the D1 flag and the I-1 read-only check).
5. Then: run `local-fixtures.php` (with a `wp db export` first, ideally `dry-run` first), and "go" for Part 2.

### Checkpoint decisions (Mauricio + Senior Architect, 2026-10-26)
1. **Field list and `phase-5-field-groups.json` approved for production as is**, including:
   - the 6 legacy fields (E2);
   - the `basic` wysiwyg toolbar;
   - `service_group` `allow_null`.
   The testimonial admin field order (I-3) is cosmetic: leave it, and note it for the cleanup phase.
2. **Rollback point for the local ACF import:** `backups/phase-5a/magneto-cms-2_phase5a-acf-before_20261026-1842.sql`
   (resolves I-4).
3. **AC-18 amended:** FR/ES only need to render (locally only Trépied exists in FR/ES). FR/ES order is verified in 5c.
   The order logic is covered by the unit tests (10/20/40 + null last).
4. **Production ACF runbook:** the Architect writes it in parallel with Part 2. It includes:
   - the full production export diff, project post type included (D1);
   - the read-only orphan-`subtitle` check (I-1).
   **5c loader rule:** always write `finalCtaSection` `title` and `subtitle` together.

### Time
- Agent: about 1 h 15 min wall time from pre-flight to this report (estimated), plus about 10 min waiting for the import.
- Mauricio: the before export (~18:23), backups at 18:42 and 18:55, import at 18:45, re-export at 18:49 (≈ 20–25 min,
  estimated).

---

## Part 2 — code, state C (CMS without fixtures)

### Result
Part 2 code is complete. The gate passes. State C (the new schema, the fixtures **not** run) was verified in the
browser. State N (after the fixtures) is pending: Mauricio runs `scripts/phase-5a/local-fixtures.php`, then I verify
AC-13 to AC-19 and take the screenshots for AC-24.

### Changes
- **Shared final CTA, per page (ADR 0006).**
  - Removed from `layout.tsx` (with the lead magnet).
  - Each route renders `<FinalCTASectionLoader source=…>` at its end: home, about-magneto, services, packages, projects
    and projects/[slug]. Not on contact or the 404s.
  - `getFinalCta(source, locale)` picks the values:
    - the home source uses home's values;
    - a page or project with a `title` and a background image uses its own values;
    - an empty `title` falls back to home's whole object (never a merge);
    - own values without a background image take home's `bgimage`.
  - The client component no longer fetches and no longer hides itself by pathname.
  - New buttons: the primary button goes to `ctaPath` when it's a site path, otherwise it opens the booking modal. The
    secondary button shows when it has text.
- **Testimonials:**
  - reads `role`, `company`, `city` and `note`;
  - rows without `role` are filtered out;
  - the card is `figure`/`blockquote`/`figcaption` with the attribution "author · role · company or city" and an
    optional note;
  - no avatar and no truncation; 2 columns on desktop.
- **Home:**
  - section order: Hero → About → Featured services → Projects → Testimonials → Final CTA;
  - About reads `descriptionHtml` (sanitized) with `description` as a fallback, and its heading is an h2;
  - Featured services has no section title and no "Check All"; each card shows its `serviceTagline` and an
    "Explore {name}" link to `/services#…`;
  - Projects has a title and intro and shows at most 3.
- **About:**
  - founder text: `descriptionHtml` (sanitized) or plain text;
  - `ctaText`/`ctaPath` give a secondary-button link; without them the button is the existing `CalendlyButton`;
  - adds the final CTA.
- **Projects:**
  - ordered by `displayOrder` ascending, then the rest in CMS order (null last);
  - each card is one link (thumbnail, title, `cardDescription` or the subtitle); no Solution/Outcome and no
    "Check All";
  - the `/projects` intro is no longer rendered (kept for the 404 check only); see D10.
- **Case study:**
  - "What Was Delivered";
  - the live link reads "View dangelwellness.ca" (`liveSiteDomain`);
  - adds the final CTA.
- **Footer:** a `<footer>` element with the line, LinkedIn (new tab, `rel="noopener noreferrer"`), the email
  (`mailto:`) and "Magneto Web Consulting © {year}".
- **Dictionaries:** the table in the spec ("Dictionary changes"); FR `testimonials.title` stays `[FR TODO]` (O2).

### Gate (2026-10-26, after Part 2)
| Step | Result |
|---|---|
| `npm run lint` | **passed with the baseline**: 113 errors / 104 warnings (master `5d4c90f`: 115 / 110). Diff vs master: removals only, 0 new findings. |
| `no-explicit-any` | 96 (baseline 98; AC-6 ≤ 98) |
| `npm run typecheck` | passed |
| `npm test -- --run` | passed: 29 files / 292 tests |
| `npm run build` (`.env.local`, `en,fr,es` + `ALLOW_UNTRANSLATED_LOCALES=1`) | passed, 28 pages |
| AC-3 `ENABLED_LOCALES=en ALLOW_UNTRANSLATED_LOCALES= npm run build` | passed, 14 pages |
| AC-3 `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES= npm run build` | **failed as designed** (the guard): "enables fr, but its dictionary has 94 untranslated keys … common.goHome …", es: 93 |

### Hygiene
- **AC-4:** `git diff --name-only master` lists 50 `src/` files. The untracked files are `docs/acf/`, `scripts/phase-5a/`
  and this report. Every path is in "Files the Dev may touch"; `docs/acf/phase-5-before.json` is Mauricio's export.
  - Not touched: `.env.local`, `Footer/types.ts`, `Footer/api.test.ts`, `ServiceCard.scss`.
- **AC-5:** the 2 new `dangerouslySetInnerHTML` (About founder, `AboutSection`) go through `DOMPurify.sanitize`.
  The other 3 unsanitized sinks are pre-existing (Known debt), unchanged: packages, about `generalText` (line 92 on
  master), services.
- **AC-7c:** "Magneto Marketing" remains only in the per-page `meta.*` titles and descriptions (en/fr/es) and their
  fingerprint lines. They are out of the 5a part of O3 (spec 1.6) and move in 5b; see I-9. Domains and
  emails (`magnetomarketing.co`) are unchanged.

### Evidence — state C (`next start -p 3100`, `en,fr,es` + override, local CMS, fixtures not run)
- **Status:** 200 on `/`, `/about-magneto`, `/services`, `/packages`, `/projects`, `/contact`, the 3 EN case studies,
  `/fr`, `/fr/projects`, the FR/ES Trépied pages and `/es`; `/esto-no-existe` returns 404. The HTML is saved in
  `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/e73a03e3-4504-4574-877e-61b19f90e76b/scratchpad/p5a/stateC/`.
- **Raw HTML checks:**
  - 0 placeholder testimonial names (no row has `role` yet, so the section renders nothing);
  - 0 escaped `&lt;p&gt;`;
  - 0 lead-magnet markup on any route.
- **Final CTA:**
  - routes with the final CTA show home's values (no page has its own `title` yet; the I-1 orphan `subtitle` never
    shows);
  - `/contact` and the 404 have none.
- **AC-11 (modal):** clicking the final CTA opens the booking modal ("Quick — before we book"). I closed it without
  submitting.
- **Layout:**
  - 375 / 768: no horizontal scroll on 8 routes (iframe probe, `scrollWidth ≤ clientWidth`);
  - 1440: screenshot of a scaled iframe, layout OK (D11).
- **Focus:** the final CTA button shows a visible ring (`auto 3px white` on the dark background).
- My server (PID 18731) is stopped, port 3100 is free and the Chrome tab is closed.

### AC-20 — EN keys changed or added (Mauricio confirms against `docs/content/magneto-copy-en.md`, commit `23b620a`)
| Key | Value | Copy line |
|---|---|---|
| `common.bookStrategyCall`, `header.scheduleCall` | Book a Strategy Call | :18 |
| `home.recentProjects` | Selected Web Projects | :66 |
| `home.projectsIntro` | Web experiences for wellness, professional services and digital commerce — built around… | :68 |
| `testimonials.title` | Client feedback | :88 |
| `cmsFallback.finalCta.title` / `.subtitle` | Start with a conversation. / Share what is and is not working… | :122 / :124 |
| `footer.copyright` | Magneto Web Consulting © {year} | :136 |
| `footer.linkedin` / `footer.email` | Mauricio Bayuelo on LinkedIn / contact@magnetomarketing.co | :242 |
| `featuredServices.explore` | Explore {name} | :46 / :54 / :62 |
| `projectDetail.results` | What Was Delivered | :931 |
| `projectDetail.viewLiveSite` | View {domain} | :954 |
| `meta.site.fallbackTitle` | Magneto Web Consulting | O3 (spec 1.6) |

Removed (no longer rendered):
- `featuredServices.checkAll`, `featuredServices.learnMore`;
- `projects.solutionLabel`, `projects.outcomeLabel`, `projects.checkAll`;
- `cmsFallback.featuredServicesTitle`.

### Deviations from the spec (Part 2)
- **D6. Secondary final CTA without a path opens the modal** (AC-15 reading). The spec gives the secondary button a
  `secondaryCtaPath`; when the text is set but the path is empty, the button opens the booking modal instead of
  rendering a dead link.
- **D7. Footer `<section>` → `<footer>`:** a semantic landmark (accessibility rule). Same classes, same look.
- **D8. `AboutSection` heading h3 → h2:** the home outline had an h3 directly under the h1.
- **D9. Empty states:** `FeaturedServices` and `Testimonials` return `null` when they have no items, instead of
  rendering an empty title.
- **D10. `/projects` intro text no longer rendered.** The 2026 copy has no page intro above the grid (the hero carries
  it). `pageIntroText` is still queried for the missing-translation 404 check. Revert if the intro should stay.
- **D11. 1440 px was checked in a scaled same-origin iframe:** the Chrome window is capped at a 948 px viewport and
  `resize_window` has no effect. 375 and 768 were measured the same way.
- **Accepted by Mauricio (2026-10-26): D6–D11.**
- **D12. `src/app/[locale]/services/page.tsx` rebuilt before commit (2026-10-27, Claude Code).** Phase 5b work began
  in this working tree before the 5b spec was approved and rewrote this file, which overwrote the 5a change (it was
  never committed). The 5a version was rebuilt as HEAD plus the two 5a lines (the `FinalCTASectionLoader` import and
  `<FinalCTASectionLoader source={{ kind: 'page', name: 'services' }} …/>` after the services list). Size check: the
  tree is again **53 files, +918/−442**, the total recorded above. The 5b work is backed up outside the repo, not
  committed. The gate was re-run on this 5a-only tree (see "Gate re-run on the 5a-only tree" below). **Accepted by Mauricio (2026-10-27).**

### Issues found (not fixed, Part 2)
- **I-8. FR `testimonials.title` stays `[FR TODO]`** (O2): the FR copy has no line for it. FR builds need the override
  until it's provided.
- **I-9. Per-page `meta.*` still say "Magneto Marketing"** in en/fr/es (11 EN values). O3 limited the rename to
  `siteName`, the OG image alt and `fallbackTitle` in 5a; the per-page `meta.*` belong to **5b** (O3; corrected by Mauricio, 2026-10-26).
- **I-10. 3 pre-existing unsanitized `dangerouslySetInnerHTML`** (packages, about `generalText`, services). Known
  debt, untouched.

### Proposed commits (Part 2; not made, all unstaged)
6. `feat(final-cta): per-page final CTA with home fallback, rendered by each route`: `FinalCTASection/*`, `layout.tsx`
   and the 6 route `page.tsx` files.
7. `feat(testimonials): attribution with role, company or city and note; semantic card`: `Testimonials/*` and
   `TestimonialCard/*`.
8. `feat(home): 2026 structure: about HTML, service taglines, projects intro`: `page.tsx`, `AboutSection/*`,
   `FeaturedServices/*` and `ServiceCard/index.tsx`.
9. `feat(projects): display order, card description, single-link cards, live-site domain`: `projects/*`,
   `projects/[slug]/*`, `src/data/projects.ts`, `ProjectsGrid/*` and `ProjectDetail/index.tsx`.
10. `feat(about): founder HTML and optional CTA`: `about-magneto/*`.
11. `feat(footer): LinkedIn and email links in a footer landmark`: `Footer/*`.
12. `feat(i18n): 2026 EN microcopy and FR/ES values from the copy table`: the dictionaries and their tests,
    `format.ts`. Commit 4 (brand) can fold into this one if preferred.
13. `docs(phase-5a): Part 2 report`: this file (after state N).

### Next: state N (needs Mauricio)
Run the fixtures in Local's site shell:
1. `wp db export`
2. `local-fixtures.php dry-run`
3. the real run
4. the read-back
5. `wp cache flush`

Then I verify:
- AC-13 to AC-17 against the copy lines, at 375/768/1440;
- AC-18 (amended: FR/ES render);
- AC-19;
- the screenshots for the D1 visual approval (AC-24).

---

## Fixtures run (Mauricio, 2026-10-26 ~20:00) — field-name collision found, fix pending approval

**Run:**
- Backup: `backups/phase-5a/magneto-cms-2_phase5a-fixtures-before_20261026-1959.sql`.
- Result: 54/55 ok; `wp cache flush` succeeded.
- FR/ES home row counts are unchanged (testimonials 4, services 2), so I-6 didn't happen.
- **FAIL:** `about-magneto finalCtaSection.ctaPath` (read-back mismatch).

### F-1. Cause confirmed (read-only `get_post_meta` + GraphQL)
ACF stores a top-level field's value in postmeta under its **name**, and reads it back by name; the `_name` key
reference is not checked on read. `aboutData.cta_path` and `finalCtaSection.cta_path` (both new in 5a) both apply to
page 32, so they share the meta key `cta_path`.

The fixtures wrote `finalCtaSection.ctaPath = ''` first, then `aboutData.ctaPath = '/contact'`, which overwrote it.
Page 32 now has `cta_path = '/contact'` with `_cta_path = field_p5_aboutdata_cta_path`.

GraphQL serves `finalCtaSection.ctaPath: "/contact"` on About, so its final CTA button would link to Contact instead of
opening the booking modal. In the admin, saving the About page would also make the two fields always equal.

### F-2. Systematic scan
- **Schema scan** (`phase-5-field-groups.json`, top-level names per post):
  - covers pages 2/32/34/36/38/41, any other page and the project post type;
  - finds **exactly one duplicate**, `cta_path` on page 32, and both fields are NEW.
  - `cta_text` doesn't collide: the final CTA field is named `prefooter_cta_text` (likewise `prefooter_cta_link`).
- **Data scan** (local DB, all 15 pages and projects in all languages): meta whose key matches a field that applies to
  the post, but whose `_ref` points to a different field. 7 rows:
  - page 32 `cta_path`: F-1;
  - pages 38 (en), 41 (en) and 558 (fr) `subtitle`: ref `heroContent.subtitle_hero`, i.e. I-1;
  - pages 38 and 41 `title` = `''`: refs `heroContent.hero_title` (38) and `contactContactTexts.main_copy` (41).
  - The I-1 rows on 32/34/36 are gone because the fixtures wrote a proper final-CTA `title` and `subtitle` there.
- **Root cause compared with I-1:** the mechanism is the same (one meta key per name per post). The trigger differs:
  - F-1 is two **live** fields with one name, a schema defect, fixable now by a rename;
  - I-1 is **stale** meta from earlier field renames, exposed when the `finalCtaSection` location was widened. Those
    are existing production fields, so expand/contract rules out a rename. They stay mitigated by the whole-object
    fallback (empty `title` → home) and the 5c loader rule (write `title` and `subtitle` together); deletion of the
    stale meta goes to the cleanup phase.

### F-3. Proposed fix (smallest; not applied)
1. In `docs/acf/phase-5-field-groups.json`, rename only the two new `aboutData` fields:
   - `cta_path` → `about_cta_path`;
   - `cta_text` → `about_cta_text` (renamed with it for consistency; it doesn't collide today).
   - The field **keys** (`field_p5_aboutdata_cta_*`) stay, so the import updates them in place.
   - **`graphql_field_name` stays `ctaPath` / `ctaText`.** That means no frontend or test change, and no fixtures-script
     change, because the script writes by key.
   - In-memory check: the schema scan gives 0 duplicates on every post, and `about_cta_*` appears nowhere else.
2. Re-run the gate's ACF diff: only `name` changes on 2 added fields; Removed stays "none".
3. Local (Mauricio), in this order:
   1. `wp db export`;
   2. re-import the JSON;
   3. re-export, and I diff it;
   4. re-run the fixtures. The final-CTA `cta_path` write resets `cta_path = ''` with the final CTA's reference.
4. Optional local tidy-up: the old `cta_text` meta on 32 (ref aboutData) is read by nothing after the rename. Production
   never had it.
5. Optional guard (spec-listed file): `acf-json-diff.mjs` fails on duplicate top-level names per location. Needs
   approval.
6. **Amendments:**
   - the checkpoint's field-list approval (2 names);
   - the production runbook: step 0's read-only check widens from `subtitle` to every `finalCtaSection` name (the data
     scan above), and the import uses the corrected JSON.

### F-1..F-3 resolution (approved by Mauricio, 2026-10-26)
**Decisions:**
1. Rename both new About fields. Field keys and GraphQL names are unchanged.
2. Add a duplicate-meta-name check to `acf-json-diff.mjs`, with a test.
3. Leave the local leftover `cta_text` meta on About (page 32) for the cleanup phase.

**Applied:**
- **`docs/acf/phase-5-field-groups.json`:**
  - `field_p5_aboutdata_cta_text`: `name` `cta_text` → `about_cta_text`;
  - `field_p5_aboutdata_cta_path`: `name` `cta_path` → `about_cta_path`;
  - `graphql_field_name` stays `ctaText` / `ctaPath`, so no change to `src/`, the tests or `local-fixtures.php`
    (it writes by key).
- **`scripts/phase-5a/acf-json-diff.mjs`:**
  - new section "Duplicate meta names per post, after file". For every page ID named in a location rule, "any other
    page" and every post type named in a rule, it takes the top-level field names of the groups that match. Rules on
    other params count as matching, so it over-reports rather than misses.
  - Exit 1 on any duplicate (as on any removal).
  - `--self-test` runs 6 built-in fixture cases: the F-1 shape (fails), the F-3 fix (passes), the same name on
    different pages (passes), a project collision, a `page != N` rule, and two fields with one name in one group.
  - The fixtures are inline: no new file, and the script stays outside `src/`, so it isn't part of the vitest run.

**Evidence:**
| Check | Result |
|---|---|
| `node scripts/phase-5a/acf-json-diff.mjs --self-test` | 6/6 passed, exit 0 |
| Pre-fix JSON (`about_cta_path` reverted to `cta_path`), from the before export | `✗ page 32: "cta_path" ← aboutData.cta_path, finalCtaSection.cta_path`, exit 1 |
| `phase-5-before.json` → corrected JSON | 13 → 14 groups, Added 35, **Removed 0**, Changed 10 (same as E1), reordered 0, **duplicates 0**, exit 0 |
| Current local re-export (`acf-export-2026-10-26.json`) → corrected JSON | Added 0, Removed 0, **Changed 2 keys: `name` only** (`cta_text`→`about_cta_text`, `cta_path`→`about_cta_path`), reordered 2 (the cosmetic E3 tie and export order), duplicates 0, exit 0 |

**Amended checkpoint decision 1 (field list):** approved as recorded above, except that the 2 About CTA fields are
stored as `about_cta_text` / `about_cta_path`. Their GraphQL names stay `aboutData.ctaText` / `aboutData.ctaPath`.

**Production runbook (Architect):**
- import the corrected JSON;
- step 0's read-only orphan check covers every `finalCtaSection` field name, not just `subtitle` (data scan F-2);
- run `acf-json-diff.mjs` on the production export plus the JSON, expecting duplicates 0.

**Local state now (before the re-import):** page 32 has `cta_path = '/contact'` (ref aboutData). After the re-import
and the fixtures re-run:
- `about_cta_path` gets `/contact`;
- `cta_path` gets `''` with the final CTA's reference;
- `cta_text` stays as harmless local leftover.

### Re-import after the rename (Mauricio, 2026-10-26 ~22:20) — verified
**Steps (Mauricio):**
- Backup before the import: `backups/phase-5a/magneto-cms-2_phase5a-rename-before_20261026-2218.sql` (22:18). I found it
  on disk; the name wasn't in the message.
- Import: 14 groups, no duplicates. About - Data shows `about_cta_text` / `about_cta_path`.
- Re-export: `~/Downloads/acf-export-2026-10-27.json` (22:26).
- Fixtures re-run: "55 writes planned … Success: 55 values written and read back." FR/ES home row counts were the
  same before and after (fr/es testimonials 4, services 2). `wp cache flush` succeeded. The checks below were also
  made independently and read-only.

**Checks:**
| Check | Result |
|---|---|
| `acf-json-diff.mjs` corrected JSON → re-export | 14 → 14 groups, Added 0, Removed 0, **Changed 0**, reordered 2 (the cosmetic E3 tie and export order), **duplicates 0**, exit 0 |
| Page 32 postmeta | `about_cta_path` = `/contact` (ref aboutData), `about_cta_text` = `Tell me about your project` (ref aboutData), **`cta_path` = `''` (ref `field_p5_finalctasection_cta_path`)**; `cta_text` is the accepted leftover, read by no field |
| GraphQL About (EN) | `aboutData.ctaPath` = `/contact`, `aboutData.ctaText` = `Tell me about your project`; **`finalCtaSection.ctaPath` = null** (title "Start with a conversation.", ctaText "Book a Strategy Call") |
| Data scan, all 15 pages and projects | 6 rows, all the known I-1 orphans: `title` = `''` and `subtitle` on 38 (en), 41 (en) and 558 (fr). Page 32 is gone from the list. These are hidden by the whole-object fallback, and contact renders no final CTA. |

**F-1 is resolved locally.** State N verification is next.

**Note for the production runbook (Architect, from Mauricio):** confirm the ACF PRO license is active on production
before the import. Locally ACF shows the license as "valid but not activated".

---

## State N verification (after the fixtures, 2026-10-26 ~22:40–23:20)

### Setup
- Build: `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run build` passed (28 pages).
- Server: `next start -p 3100`, PID 24946 (mine).
- **Stale fetch cache (I-11):** the first state N build served pre-fixture content (old service cards, no testimonials).
  - Cause: `fetchWPGraphQL` uses `revalidate: 60`, and Next 15 reused the stale entries in `.next/cache/fetch-cache`
    (last written 19:10, before the fixtures) during prerender (stale-while-revalidate).
  - Fix: I stopped my server, cleared only `.next/cache/fetch-cache` (a generated cache), and rebuilt. The second
    build fetched fresh data.
- HTML of every route saved in
  `/private/tmp/claude-501/-Users-maubayuelo-Documents-projects-magneto-web-app-GrapgQL/e73a03e3-4504-4574-877e-61b19f90e76b/scratchpad/p5a/stateN/`.
- **Status:**
  - 200 on `/`, `/about-magneto`, `/services`, `/packages`, `/projects`, the 3 EN case studies, `/contact`, `/fr`,
    `/es`, `/fr/projects` and the FR/ES Trépied pages;
  - 404 on `/esto-no-existe` (as designed) and `/es/projects`: there's no ES `projects` page in the local CMS (ES has
    only `home`), so this is the ADR 0004 missing-translation 404, not a regression. It isn't in AC-18's 200 list.

### Automated checks (SSR HTML, expected text read from `magneto-copy-en.md` by line number): 84/84 passed
`stateN-check.mjs` (scratchpad, read-only; jsdom from the repo):

| AC | Checks | What is covered |
|---|---|---|
| AC-13 `/` | 32/32 | header CTA (18); About h2 + 3 paragraphs (30–36); BUILD/FIX/CARE title, tagline, description, one "Explore X" link → `/services#build/fix/care` (40–62); no "Featured Services" / "Check All"; "Selected Web Projects" + intro (66–68); cards in the order Dangel, Shamanicca, Trépied (72), each exactly thumbnail · h3 · description (76/84/80), no Solution/Outcome; "Client feedback", 2 testimonials with full quotes (90/100), attributions (93/102), "Translated from Spanish." under Dangel only (96), no avatars; final CTA (122/124/126 → modal); footer line (130), LinkedIn (new tab, `noopener`) + mailto (132/134), "Magneto Web Consulting © 2026" (136), no Privacy link |
| AC-14 `/about-magneto` | 7/7 | founder 2 paragraphs (169/171), `<strong>Mauricio Bayuelo</strong>`; LinkedIn link identical to state C; "Tell me about your project" (214) → `/contact`; own final CTA 232/234 (differs from home 124), button 236 → modal |
| AC-15 | 6/6 | `/services`: 402, 404+406, `button` "Book a Strategy Call" (408, modal) + `a` → `/contact` "Tell me about your project" (410). `/packages`: 524, 526+528, `a` → `/contact` (530) + `button` (532, modal) |
| AC-16 `/projects` | 5/5 | order Dangel, Shamanicca, Trépied; no Solution/Outcome/"Check All"; no intro heading; final CTA = home (122/124) |
| AC-17 case studies | 18/18 | "What Was Delivered" (931); "View dangelwellness.ca" / "View trepied.ca" / "View shamanicca.com"; "← Back to Projects" → `/projects`; own final CTA 958/960/962, 1069/1071/1073, 1204/1206/1208 → modal |
| AC-18 FR/ES (amended) | 11/11 | `/fr` "Réserver un appel-conseil", `/es` "Agendar una llamada de orientación"; no testimonials on `/fr` or `/es`; final CTA = FR/ES home values; `lang` `fr-CA` / `es`; `/fr/projects` renders its card (only Trépied exists in FR); FR Trépied "Livrables" + "Voir trepied.ca", ES "Entregables" + "Ver trepied.ca" |
| AC-19 (static) | 5/5 | every link and button on 14 routes has an accessible name; the testimonial attribution is text in `<figcaption>` (not color-only); `lang` `en` / `fr-CA` / `es` |

### Browser checks (Chrome, `localhost:3100`)
- **Modal (AC-15, AC-14, AC-13):** each final CTA control without a path opens "Quick — before we book" and closes
  without submitting:
  - `/services` primary;
  - `/packages` secondary;
  - `/about-magneto` (the F-1 regression is gone: a button, not a link to `/contact`);
  - `/`.
- **Focus visible (AC-19)** on every new control:
  - "Explore BUILD/FIX/CARE": browser default ring, `auto 1px`;
  - the 3 project card links and the 2 footer links: `2px solid` `$primary-color`;
  - the final CTA button: `auto 3px` white + a 5px ring.
- **Layout:** no horizontal overflow at 375 / 768 / 1440 on 12 routes, measured with same-origin iframes at those
  exact widths.
- **Observed once, not reproduced (I-12):** during a scripted run on `/`, the tab ended on `/services#fix`. Unsandboxed
  `/` frames at all three widths don't navigate the host. It was probably my focus/click script (it focused
  "Explore FIX" just before); it isn't a site behavior I could reproduce.

---

## State N verification — Dev handoff continuation (2026-10-26, Codex)

### Execution context and preservation
- Continued the existing `feat/phase-5a` checkout at `5d4c90f`; no phase restart, fixture writes, code changes,
  staging, commits, pushes, merges, production operations or deployments.
- Read `AGENTS.md`, the approved spec, its exact acceptance criteria, this report and the supplied handoff.
  The checkpoint's recorded **AC-18 amendment** governs: FR/ES rendering in 5a; FR/ES content ordering in 5c.
- Entry state: 50 modified tracked source files plus the existing untracked ACF exports, two scripts and this report.
  The tracked binary diff remains byte-identical to the entry snapshot. Existing ACF/script files were preserved.
  **Only this report was edited in the repository during this continuation.**
- Confirmed the configured CMS is `http://magneto-cms-2.local/graphql`, SMTP is disabled with `DISABLE_SMTP=1`,
  Mailchimp variables are empty/absent, and GA/GTM IDs are empty. `.env.local` was neither edited nor copied into
  the verification snapshot. No form was submitted.
- Port 3100 was occupied by the prior session's PID 24946 and was left untouched. Builds ran from an isolated,
  source-identical copy at `/private/tmp/magneto-phase5a-verification/repo`, using the already installed dependencies
  and an independent `.next`. Local endpoint and locale settings were supplied through the command environment.
  No secrets were copied. This avoids the shared-cache hazard I-11 and disturbing the existing server.
- Served that build on **3101**, PID **27641**, then stopped that PID after verification. Browser processes launched
  for these checks were closed; the superseded capture process was stopped by its own PID, 27647.
- Evidence root: `/private/tmp/magneto-phase5a-verification/evidence/`. These are local review artifacts, not staged
  repository files; retain/copy them before temporary-directory cleanup if they are needed for later review.

### Corrected import and fixture evidence

Mauricio's confirmed execution evidence is retained as operator evidence (the writes were **not re-run**):
- corrected ACF JSON re-import completed in Local;
- backup: `phase5a-rename-before_20261026-2218.sql` (full path recorded in the preceding re-import section);
- `55 writes planned … Success: 55 values written and read back.`;
- FR/ES Home counts before = after, each locale: testimonials **4**, services **2**;
- `wp cache flush`: Success;
- re-export: `/Users/maubayuelo/Downloads/acf-export-2026-10-27.json`.

Independent checks in this continuation:

| Check | Actual result | Evidence under the evidence root |
|---|---|---|
| Corrected repository JSON → re-export, existing `acf-json-diff.mjs` | **PASS**, exit 0: 14 → 14 groups; added 0, removed 0, changed settings 0, duplicate meta names 0. Two cosmetic reorderings remain, as in E3. | `acf-reexport-diff.log` |
| Before export → corrected JSON | **PASS**, exit 0: 35 additions, 0 removals, 10 changed keys, 0 reordered keys, 0 duplicate meta names. Same approved expand/contract categories. | `acf-schema-diff.log` |
| Validator self-tests | **PASS**, 6/6, exit 0. | `acf-self-test.log` |
| About page 32, read-only WP-CLI metadata | `about_cta_path=/contact`, reference `field_p5_aboutdata_cta_path`; `about_cta_text=Tell me about your project`, reference `field_p5_aboutdata_cta_text`; `cta_path=''`, reference `field_p5_finalctasection_cta_path`. | `about-meta.json` |
| About GraphQL, read-only local query | `aboutData.ctaPath=/contact`, `aboutData.ctaText=Tell me about your project`; **`finalCtaSection.ctaPath=null`**, title `Start with a conversation.`, text `Book a Strategy Call`. | `about-graphql.json` |
| FR/ES current repeater counts | Independently read **4 testimonials / 2 services** for each locale. Before counts remain Mauricio's supplied execution evidence. | `about-meta.json` |
| Existing read-only orphan scan | **6 rows over 15 posts**, all the known `title`/`subtitle` orphans on EN Projects 38, EN Contact 41 and FR Projects 558. About 32 is absent. | `orphan-scan.log` |

**F-1 remains resolved.** The accepted leftover About `cta_text` metadata remains for cleanup. GraphQL names
`ctaPath`/`ctaText` were preserved; no frontend API change was necessary.

### AC-13 through AC-19 — results against the approved definitions

The existing `stateN-check.mjs` was reused on **fresh HTML** from the isolated local build: **84 passed, 0 failed**.
Expected EN text is read from the approved copy export by the spec's line references. Its historical State C About
HTML was retained only for the unchanged LinkedIn comparison. Evidence: `stateN-check.log`, `stateN/*.html`;
the reused checker is `/private/tmp/magneto-phase5a-verification/stateN-check.mjs`.

| Criterion | Result | Verified scope and evidence |
|---|---|---|
| **AC-13** | **PASS** | Home at 375/768/1440. Header CTA; Meet Magneto heading and all three paragraphs; BUILD/FIX/CARE titles, taglines, descriptions and `/services#build\|fix\|care` links; omitted section/check-all headings; project heading/intro and Dangel → Shamanicca → Trépied card structure/descriptions; two complete testimonials with exact attributions, Dangel-only note and no avatars; Home final CTA; footer links, line and copyright. **32/32** copy/structure assertions; Home modal opens/closes. Screenshot matrix below. |
| **AC-14** | **PASS** | About at all three widths: two founder paragraphs, bold Mauricio Bayuelo, LinkedIn href/text unchanged from State C and still beneath the founder text, bottom `/contact` link, distinct About CTA body. **7/7** assertions; About final CTA opens/closes the modal. |
| **AC-15** | **PASS** | Services CTA matches 402–410: primary modal, secondary `/contact`; Packages matches 524–532: primary `/contact`, secondary modal. **6/6** assertions plus actual browser modal clicks and closes. Both CTAs captured at all three widths. |
| **AC-16** | **PASS** | Projects shows Dangel → Shamanicca → Trépied, no Solution/Outcome/check-all or intro h3, and Home final CTA fallback. **5/5** current assertions. State C was already verified before fixtures (E7 and Part 2); the existing unit test again passes for null `displayOrder` preserving GraphQL order and for tie stability. No destructive fixture reversal was performed. |
| **AC-17** | **PASS** | All three specified EN case routes return 200, show What Was Delivered, their exact domain labels, Back to Projects, and their own CTA title/body/button. **18/18** assertions; all three final-CTA buttons open/close the modal; all widths captured. |
| **AC-18 (amended)** | **PASS** | `/fr`, `/es`, `/fr/projects`, FR Trépied and ES Trépied return 200 at every width. Expected localized UI appears; FR/ES Home shows no testimonials. **11/11** original smoke assertions. Additional comparison confirms FR Projects and FR/ES Trépied final-CTA text equals the respective locale's Home text (`locale-fallbacks.json`). **No claim of FR/ES content ordering or completed translation:** both belong to later work. |
| **AC-19** | **PASS** | Changed section links have visible text; keyboard modality + focused controls show `:focus-visible` and a nonzero outline. **180 checks across 48 route/viewport combinations**, 0 failures (`focus.json`, `focus.log`), plus About's bottom link at all three widths (`about-cta-focus.json`). Existing SSR checks confirm accessible names, textual `figcaption` attribution, and `lang=en/fr-CA/es`. This is the specified touched-section check, not a whole-site WCAG certification. |

Scope qualifications from the spec, not substitutions for checks:
- The fixture map excludes heroes, About `generalText`, case-study bodies, post titles and the Projects hero.
  Those remain current CMS content for 5c. In particular, the card still reads **Shamanicca’s Ecommerce** rather than
  the copy's future **Shamanicca** post title. AC-13's 5a card structure and new description are verified; this report
  does not claim every inherited string on the page already matches the final 2026 copy.
- `/es/projects` returns **404**, consistently with the documented absent ES Projects page (ADR 0004). It is not
  in AC-18's required 200 list. It was additionally captured to make the limitation reviewable.
- Contact returns 200 and the unknown EN route returns 404. Neither renders a final CTA; no checked route renders
  the lead magnet. The known 404 raw-HTML framework limitation remains unchanged.
- Browser clicks opened/closed seven final-CTA modals without submission (`modals.json`). No outbound live-site,
  email or booking action was invoked.

### AC-24 — captured screenshots; Mauricio approval still pending

**Capture: PASS. Acceptance/visual approval: BLOCKED pending Mauricio.**

Review gallery: [State N screenshots](/private/tmp/magneto-phase5a-verification/evidence/screenshots-final/index.html).
All filenames below are under **`/private/tmp/magneto-phase5a-verification/evidence/screenshots-final/`**.
`manifest.json` records each route, status, exact viewport, PNG dimensions, footer coverage and runtime checks;
`sha256.json` records the 48 image checksums.

| Route | 375px | 768px | 1440px |
|---|---|---|---|
| `/` | `375_home.png` | `768_home.png` | `1440_home.png` |
| `/about-magneto` | `375_about-magneto.png` | `768_about-magneto.png` | `1440_about-magneto.png` |
| `/services` | `375_services.png` | `768_services.png` | `1440_services.png` |
| `/packages` | `375_packages.png` | `768_packages.png` | `1440_packages.png` |
| `/projects` | `375_projects.png` | `768_projects.png` | `1440_projects.png` |
| `/projects/fashion-company-ecommerce` | `375_projects_fashion-company-ecommerce.png` | `768_projects_fashion-company-ecommerce.png` | `1440_projects_fashion-company-ecommerce.png` |
| `/projects/trepied-trepied-ca` | `375_projects_trepied-trepied-ca.png` | `768_projects_trepied-trepied-ca.png` | `1440_projects_trepied-trepied-ca.png` |
| `/projects/shamaniccas-ecommerce` | `375_projects_shamaniccas-ecommerce.png` | `768_projects_shamaniccas-ecommerce.png` | `1440_projects_shamaniccas-ecommerce.png` |
| `/fr` | `375_fr.png` | `768_fr.png` | `1440_fr.png` |
| `/es` | `375_es.png` | `768_es.png` | `1440_es.png` |
| `/fr/projects` | `375_fr_projects.png` | `768_fr_projects.png` | `1440_fr_projects.png` |
| `/fr/projects/trepied-trepied-ca` | `375_fr_projects_trepied-trepied-ca.png` | `768_fr_projects_trepied-trepied-ca.png` | `1440_fr_projects_trepied-trepied-ca.png` |
| `/es/projects/trepied-trepied-ca` | `375_es_projects_trepied-trepied-ca.png` | `768_es_projects_trepied-trepied-ca.png` | `1440_es_projects_trepied-trepied-ca.png` |
| `/contact` (additional shared-footer check) | `375_contact.png` | `768_contact.png` | `1440_contact.png` |
| `/esto-no-existe` (expected 404) | `375_esto-no-existe.png` | `768_esto-no-existe.png` | `1440_esto-no-existe.png` |
| `/es/projects` (documented missing translation, 404) | `375_es_projects.png` | `768_es_projects.png` | `1440_es_projects.png` |

- **48 full-page PNGs**, viewport height 900 CSS px, device scale 1, exact widths 375/768/1440; no scaled iframe.
  Across all captures: **0 horizontal overflow, 0 broken images, 0 browser runtime errors**. Every PNG includes
  the footer bottom within one pixel of fractional CSS rounding.
- Capture correction: initial images could lose the footer bottom while the sticky header switched back into flow
  after scrolling. Those images in `evidence/screenshots/` are **superseded**. Only `screenshots-final/` is the
  AC-24 set; it waits for fonts/images and a settled header, then validates dimensions/coverage.
- Representative images were visually inspected (Home mobile/desktop, About tablet, Packages tablet, FR/ES Home
  mobile). Automated geometry/content/focus checks cover the full matrix. These checks do not constitute
  Mauricio's visual approval.

### Verification gates — actual results, compared with the recorded baseline

Commands ran in the isolated source-identical snapshot. EN build had no inherited override and no `.env.local`.
The multilingual override was command-local only. Since lint exits 1, each remaining gate was explicitly run
separately instead of allowing `&&` to skip it.

| Gate | Result | Comparison / evidence |
|---|---|---|
| `npm run lint` | **FAIL, exit 1 (known baseline)** | **113 errors / 104 warnings**, unchanged from Part 2; branch point **115 / 110**. Within AC-1's numerical allowance, but the literal all-green command chain does not pass. `lint.log`. |
| `no-explicit-any` / AC-2 | **PASS** | **96**, unchanged from Part 2; branch point **98**. |
| `npm run typecheck` | **PASS**, exit 0 | `typecheck.log`. |
| `npm test -- --run` | **PASS**, exit 0 | **29 files / 292 tests**, unchanged from Part 2. Includes state C/N mapper tests, dictionary parity and EN fingerprint. `tests.log`. |
| `ENABLED_LOCALES=en npm run build`, no override | **PASS**, exit 0 | **14 generated pages**. `build-en.log`. |
| `ENABLED_LOCALES=en,fr,es npm run build`, override explicitly unset | **Expected FAIL**, exit 1 — guard **PASS** | FR **94** / ES **93** untranslated keys; failure occurs during page-data collection. Same Part 2 counts. `build-guard.log`. |
| `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run build` | **PASS**, exit 0 | **28 generated pages**. `build-all.log`. |
| Prerendered case-study paths | **PASS** | Manifest includes three EN projects and Trépied in FR and ES; all currently available locale projects prerender. No claim that missing translations exist. |
| ACF validator and duplicate-name self-tests | **PASS** | Re-export equality and 6/6 tests, as above. |
| `git diff --check` | **PASS** | No whitespace errors in tracked implementation diff. |

AC-20's fingerprint test passes and its earlier key-to-copy table is preserved; **Mauricio's confirmation is still
pending**. AC-21 parity tests pass; dictionaries were not changed in this continuation.

### Remaining findings, approvals and Architect handoff

- **AC-24:** Mauricio must review the screenshots and explicitly approve the visuals. No approval is inferred.
- **Mobile ES header review item:** at 375px the CTA wraps to two lines and leaves **0px gap** to the logo. An initial
  visual suspicion of overlap was checked: measured logo right and CTA left are both **97.375px**, so there is
  **no bounding-box overlap**. With the previous `[ES TODO] Free Schedule Call` label temporarily substituted in
  browser DOM, there is 32.625px separation. EN/FR current labels retain separation. This is a cramped-layout
  review item, not a verified overlap; approved ES copy and out-of-scope Header code were not edited.
  Evidence: `headers.json`, plus `375_es.png` in the final screenshot set.
- No functional State N regression was found. Visual acceptance remains open, including the ES header and the
  previously noted cramped Packages tablet layout. Existing content/debt findings I-1/I-8/I-9/I-10 remain; FR/ES
  TODOs and test content are expected until their later phases. FR/ES ordering is specifically **5c**, not a 5a pass.
- **AC-22/23:** production ACF execution and the Vercel preview remain **not run / blocked outside this local task**.
  Neither the separate runbook worktree nor production was modified or inspected.
- **Architect requirement — production ACF PRO license:** the production preflight must explicitly verify that the
  **ACF PRO license is active on production before any import**. Local's “valid but not activated” status is **not
  evidence of production activation**. An **inactive or unverifiable production license is a STOP condition until
  resolved**. Record evidence of production activation in the runbook execution report. This requirement is handed
  off for Architect review; it was not independently applied in the separate runbook worktree.
- Existing runbook requirements remain: corrected About field names with unchanged GraphQL names; orphan checks
  for every final-CTA field name; duplicate-name validator; 5c writes final-CTA title/subtitle together.

### Final working-tree state and stopping point

`git diff --stat` remains **50 files changed, 854 insertions(+), 441 deletions(-)**. All are the pre-existing tracked
implementation changes; this continuation changed none of them. The report is untracked, so Git's diff stat does
not include its appended verification evidence.

Relevant status remains:
- ` M` on the same 50 source files;
- `?? docs/acf/phase-5-before.json`;
- `?? docs/acf/phase-5-field-groups.json`;
- `?? docs/reports/phase-5a-structure-shared-home-about-cases.md`;
- `?? scripts/phase-5a/acf-json-diff.mjs`;
- `?? scripts/phase-5a/local-fixtures.php`.

Index diff is empty. Everything remains **unstaged**. Local verification/report work stops here; Phase 5b,
production import and release activities have not been started.

---

## AC-24 visual corrections — Architect review (2026-10-27, Codex)

### Review decision and authorized scope

Senior Architect review: **CHANGES REQUIRED** for the original AC-24 screenshots:
1. Home at 768px: the About heading was squeezed into a 120px column.
2. Spanish header at 375px: the approved CTA crowded/visually obscured the logo edge.

The earlier zero-overflow/bounding-box checks did not establish acceptable visual quality. The review supersedes
the earlier treatment of the Spanish header as a nonblocking cramped-layout observation. Both corrections were
explicitly authorized in this task, including the two SCSS files outside the original spec's implementation list.
No unrelated redesign, approved-copy change or component API change was made.

### Changes

| File | Smallest scoped correction |
|---|---|
| `src/components/organisms/AboutSection/AboutSection.scss` | Adds a Home-only `.main.about-section` override from 600–1023px: stack heading/body and give both full width. The original 375px stack and 1440px 250px heading column remain. The About page's other `.about-section` elements do not match this override. |
| `src/components/organisms/Header/Header.scss` | At ≤600px, keep the logo from shrinking, reserve a 10px gap, let the CTA item shrink within available space and wrap its unchanged text. CTA minimum height and menu target are 44px; the navigation gap becomes 5px. The open menu starts below the resulting 58px header (44px control + existing 7px padding each side) and can scroll. Tablet/desktop header rules remain unchanged. |
| This report | Records the review outcome, fixes, fresh evidence and pending approval. |

The proposed CSS additions were shown before applying them. Source changes are **CSS only: 56 added lines in two
files**. No new dependencies, JavaScript, tests, CMS writes or fixtures were introduced. The existing test suite and
real-browser layout/interaction checks provide verification for these reversible presentation changes.

### Local setup and verification

- Branch remains `feat/phase-5a`. All preceding tracked changes were preserved byte-for-byte after excluding the two
  newly edited stylesheets from the comparison. Existing untracked ACF/script artifacts were preserved.
- Confirmed local CMS endpoint and safe SMTP/Mailchimp/GA/GTM settings again; `.env.local` was not edited or copied.
- Builds used `/private/tmp/magneto-phase5a-visual-20261027/repo`, an isolated source copy with the existing installed
  dependencies and its own `.next`. The pre-existing port 3100 server (PID 24946) was left untouched.
- Corrected production build served locally on **3101**, PID **28746**, then that PID was stopped. Browser processes
  created for this verification were closed. No form was submitted.
- Evidence root: **`/private/tmp/magneto-phase5a-visual-20261027/evidence/`**. Retain these local review artifacts before
  temporary-directory cleanup. The prior evidence directory remains intact.

| Check | Result and measurements |
|---|---|
| Home About at 768px | **PASS:** heading **120×374px → 738×68px**, i.e. eleven lines → two lines at the unchanged 34px line height. Body sits below it, at full width. All approved text is unchanged. |
| Home About at 375px / 1440px | **PASS:** heading/body x positions, widths and heights equal their pre-fix values in EN/FR/ES. EN heading remains **345×78px** at 375 and **250×240px** at 1440. The intended taller phone header moves the section down in EN/FR but does not change its internal layout. |
| Spanish header at 375px | **PASS:** logo is the full **84px** wide instead of shrinking to 82.375px; CTA starts **10px** after its right edge instead of touching it. Full `Agendar una llamada de orientación` text remains visible on two lines. CTA and menu target are **44px high**, menu target **44px wide**. |
| EN/FR/ES headers at 768px / 1440px | **PASS:** logo, CTA and header x/y positions and width/height equal their pre-fix measurements in all three locales. |
| Phone headers at 320px (additional check) | **PASS:** EN/FR/ES fit without overflow; logo remains 84px; minimum 10px logo/CTA gap; CTA and menu controls remain 44px high. |
| Required route/viewport matrix | **PASS:** `/`, `/fr`, `/es`, `/about-magneto` at **375/768/1440** all return 200, with no horizontal overflow, broken images or browser runtime errors. Three additional 320px Home captures bring the total to **15 route/viewport combinations**. |
| Menu accessibility and behavior | **PASS:** **9 keyboard open/close checks** and **9 scrolled-header open/close checks** (EN/FR/ES at 320/375/768). Menu controls show a visible focus outline; menu links fit within the viewport, beneath the header. Phone menu begins at 58px and leaves the close control accessible. |
| Header CTA behavior | **PASS:** **12 keyboard-triggered modal open/close checks** (EN/FR/ES at 320/375/768/1440), exact approved labels and visible focus. No submissions or external booking actions. |

Raw evidence: `probe.json` records before/proposed geometry; `browser.json` and `browser.log` record checks against
the actual corrected build. The local browser harness is
`/private/tmp/magneto-phase5a-visual-20261027/verify.cjs`. Representative final images were also inspected visually:
tablet Home and its heading/body detail, desktop Home, Spanish mobile header and open menu.

### Fresh screenshots for Architect review

Review gallery: [Phase 5a visual corrections](/private/tmp/magneto-phase5a-visual-20261027/evidence/screenshots/index.html).
All filenames below are under **`/private/tmp/magneto-phase5a-visual-20261027/evidence/screenshots/`**.
The manifest records PNG dimensions and SHA-256 checksums. Full-page screenshots include the footer; the isolated
About detail was captured without scrolling it underneath the sticky header.

| Affected route | 375px | 768px | 1440px |
|---|---|---|---|
| `/` | `375_home.png` | `768_home.png` | `1440_home.png` |
| `/fr` | `375_fr.png` | `768_fr.png` | `1440_fr.png` |
| `/es` | `375_es.png` | `768_es.png` | `1440_es.png` |
| `/about-magneto` (shared-style regression check) | `375_about-magneto.png` | `768_about-magneto.png` | `1440_about-magneto.png` |

- Direct correction details: [tablet Home About](/private/tmp/magneto-phase5a-visual-20261027/evidence/screenshots/768_home_about.png),
  [Spanish phone header](/private/tmp/magneto-phase5a-visual-20261027/evidence/screenshots/375_es_header.png),
  [Spanish phone menu](/private/tmp/magneto-phase5a-visual-20261027/evidence/screenshots/375_es_menu.png).
- Every full-page filename also has a `_header.png` counterpart. EN/FR/ES Home at 320/375/768 have `_menu.png`
  counterparts. Additional full-page files: `320_home.png`, `320_fr.png`, `320_es.png`.
- **40 PNGs total:** 15 full-page, 15 header details, 9 open menus and 1 About detail. These replace the previous
  screenshots for the affected routes. Their capture is **not** Architect or Mauricio approval.

### Gate results

All commands ran on the isolated corrected source copy. Each command was run explicitly despite the known lint
exit 1; the locale override was command-local only.

| Gate | Actual result | Evidence |
|---|---|---|
| `npm run lint` | **FAIL, exit 1 (unchanged baseline): 113 errors / 104 warnings.** Exact file/line/message findings match the preceding verification; 0 new findings. `no-explicit-any` remains **96**. | `lint.log`, `lint-comparison.json` |
| `npm run typecheck` | **PASS**, exit 0. | `typecheck.log` |
| `npm test -- --run` | **PASS**, exit 0: **29 files / 292 tests**. | `tests.log` |
| EN build, override explicitly unset | **PASS**, exit 0: **14 generated pages**. | `build-en.log` |
| EN/FR/ES build, override explicitly unset | **Expected FAIL**, exit 1: guard rejects **94 FR / 93 ES** TODO keys. Guard **PASS**. | `build-guard.log` |
| EN/FR/ES build, local override `=1` | **PASS**, exit 0: **28 generated pages**. | `build-all.log` |
| `git diff --check` | **PASS**. | Terminal verification |

### Status for review and stopping point

**Both requested corrections: implemented and locally verified. AC-24: pending Architect re-review and Mauricio's
visual approval.** No approval is claimed. AC-20 and AC-22/23 remain outstanding as previously recorded; the
production ACF PRO activation STOP requirement remains in force. No production or Phase 5b work was started.

Only the two stylesheets and this existing report changed during this correction task. Whole-branch tracked diff:
**52 files changed, 910 insertions(+), 441 deletions(-)** (previously 50 / 854 / 441). The untracked report and four
existing untracked ACF/script files remain untracked. Index diff is empty; all work is **unstaged**. Stopped after
verification/report for Architect review.

## Final Spanish header CTA adjustment (2026-10-27, Codex)

### Approved copy and minimal implementation

Mauricio supplied the Senior Architect-approved replacement **“Reservar consulta”** and confirmed that
**Magneto’s Page Copy / ES** in Notion had already been updated and verified. This task synchronized only the
header line in `docs/content/magneto-copy-es.md` and `es.header.scheduleCall`. Notion was not independently
re-fetched; the supplied verified canonical change is the source for this partial synchronization. The document's
existing export provenance is preserved rather than implying a complete new export.

The regression assertion in `src/i18n/dictionary.test.ts` verifies the new ES header value, the unchanged
`es.common.bookStrategyCall` (“Agendar una llamada de orientación”), and the unchanged EN/FR header labels.
No ES fingerprint exists; the existing EN fingerprint remains unchanged and passes. Hero and Final CTA copy,
all EN/FR translations, and the preceding responsive CSS corrections were preserved. The copy document was
compared with HEAD: its sole difference is the approved header line.

### Verification completed and current blocker

Branch remains `feat/phase-5a`. All pre-existing work is retained and unstaged. Verification runs in an isolated
copy at `/private/tmp/magneto-phase5a-es-header-20261027/repo`; `.env.local` was neither edited nor copied.
Its target and safety flags were checked without exposing values: local CMS, SMTP disabled, and empty Mailchimp
and analytics settings. Build commands explicitly target `http://magneto-cms-2.local/graphql`.

Evidence root: **`/private/tmp/magneto-phase5a-es-header-20261027/evidence/`**.

| Check | Actual result | Evidence |
|---|---|---|
| `npm run lint` | **FAIL, exit 1 — known baseline:** 113 errors / 104 warnings; 96 `no-explicit-any`. Counts match the preceding Phase 5a report. Earlier temporary lint logs are no longer present, so no fresh exact-message comparison with those logs is claimed. | `lint.log`, `lint-comparison.json` |
| `npm run typecheck` | **PASS**, exit 0. | `typecheck.log` |
| `npm test -- --run` | **PASS**, exit 0: 29 files / **293 tests**, including the new CTA assertion and existing EN fingerprint/modal tests. | `tests.log` |
| EN build, override unset | **BLOCKED**, command exit 1: local CMS connection refused (`ECONNREFUSED`) during project page-data collection. This is not a successful build. | `build-en.log` |
| EN/FR/ES build, override unset | **PASS for guard**, expected command exit 1: rejects 94 FR / 93 ES untranslated dictionary keys. | `build-guard.log` |
| EN/FR/ES build, local override `=1` | **BLOCKED**, command exit 1: same local CMS connection refusal. | `build-all.log` |
| Browser: ES at 320/375/768, navigation, focus, Calendly entry modal | **BLOCKED / NOT RUN for the final label:** requires the local CMS and a successful local build. Prior-label checks above are historical evidence only. | Browser harness prepared at `../verify.cjs`; no browser result claimed. |
| Fresh `375_es_header.png` and `375_es.png` | **BLOCKED / NOT CAPTURED.** No new screenshot paths can be supplied as completed artifacts. | Intended destination: `evidence/screenshots/` under the task root. |
| `git diff --check` | **PASS**. | Terminal verification |

The earlier `/private/tmp/magneto-phase5a-visual-20261027/` evidence directory was absent when verification
resumed. Historical paths above are retained as recorded findings; their current availability is not asserted.
The current run's evidence is in the new directory listed here.

### Review status

**Copy adjustment implemented; final browser/build verification incomplete. AC-24 remains pending.** Mauricio
was asked to start the `magneto-cms-2` site in Local. Once available, finish both CMS-dependent builds and the
requested real-page interaction checks, then capture fresh screenshots before final Architect visual review.
No approval is inferred from the approved CTA wording alone.

Files changed for this request: `docs/content/magneto-copy-es.md`, `src/i18n/dictionaries/es.ts`,
`src/i18n/dictionary.test.ts`, and this report. No additional CSS changes, form submissions, CMS writes,
production actions, commits, staging, or Phase 5b work. No application server was started in this verification
attempt. Whole-branch tracked diff: **53 files changed, 918 insertions(+), 442 deletions(-)**; this existing report
remains untracked. The index is empty. Previous AC-20/22/23 blockers and the production ACF PRO activation STOP
requirement remain unchanged.

### Verification resumed — Local CMS restored (2026-10-27)

After Mauricio requested a recheck, the local GraphQL endpoint returned **HTTP 200** to a read-only query
(`cms-check.json`). The build/browser blockers in the preceding subsection are now **resolved**. No implementation
changes were required. All current `src/` files were compared byte-for-byte with the isolated build source and match.
The earlier 293-test, typecheck, dictionary/fingerprint and lint results therefore apply to the verified source.

| Gate | Final result | Evidence under the current evidence root |
|---|---|---|
| EN build, override unset | **PASS**, exit 0; **14 pages** generated. | `build-en-retry.log` |
| EN/FR/ES build, local override `=1` | **PASS**, exit 0; **28 pages** generated. | `build-all-retry.log` |
| Untranslated-locale build guard | **PASS**, expected exit 1; 94 FR / 93 ES TODO keys, as recorded above. | `build-guard.log` |
| TypeScript / tests | **PASS**, exit 0; **29 files / 293 tests**. No source changed after these checks. | `typecheck.log`, `tests.log` |
| Lint comparison | **FAIL, unchanged documented counts:** 113 errors / 104 warnings; 96 `no-explicit-any`. | `lint.log`, `lint-comparison.json` |
| Browser rendering | **PASS:** ES at 320/375/768/1440; EN and FR at 375/768/1440. All 10 Home responses are HTTP 200; no horizontal overflow, broken images or browser runtime errors. | `browser.json`, `browser.log` |
| Keyboard and navigation | **PASS:** at ES 320/375/768, Tab reaches the CTA, Enter opens the booking modal, Tab from the CTA reaches the menu control, and the control has visible focus. Menu opens/closes at the top and after scrolling. Actual keyboard language navigation ES → EN → ES succeeds. | `keyboard.json`, `keyboard.log`, `browser.json` |
| Booking modal | **PASS for the existing entry modal:** header CTA opens the strategy-call/Calendly entry dialog and keyboard activation of its close button dismisses it. Checked in all 10 locale/width combinations. No form submission, external calendar iframe or completed booking is claimed. | `browser.json`; existing provider/Calendly tests in `tests.log` |
| `git diff --check` | **PASS**. Index remains empty. | Final terminal check |

The ES label is exactly **“Reservar consulta”**. Measurements from the rendered page:

| ES viewport | Logo width | Gap between logo and CTA | CTA dimensions |
|---|---|---|---|
| 320px | 84px | 33.59px | 123.41 × 44px |
| 375px | 84px | 88.59px | 123.41 × 44px |
| 768px | 84px | 491.59px | 123.41 × 30px |

Phone menu controls retain the preceding 44px targets. Tablet dimensions are unchanged by this text-only update;
no additional CSS changes were made. The CTA shows a visible 3px automatic focus outline. EN/FR header labels
remain unchanged. Local ES Home still contains the existing fixture English Hero and Final CTA labels and
`[ES TEST]` content; the booking dialog retains its existing `[ES TODO]` copy. These were not translated or edited.
FR/ES rendering is checked here; their content ordering remains Phase 5c work.

### Final screenshots for AC-24 review

Fresh captures, with fonts/images loaded and the header settled at the top; full-page images were checked to
include the footer. The Spanish 375px header and full page were also inspected visually.

- [375_es_header.png](/private/tmp/magneto-phase5a-es-header-20261027/evidence/screenshots/375_es_header.png)
- [375_es.png](/private/tmp/magneto-phase5a-es-header-20261027/evidence/screenshots/375_es.png)
- [Review gallery](/private/tmp/magneto-phase5a-es-header-20261027/evidence/screenshots/index.html)

All files live under **`/private/tmp/magneto-phase5a-es-header-20261027/evidence/screenshots/`**:
ES full pages and header details at 320/375/768/1440; EN/FR full pages and header details at 375/768/1440;
ES open-menu captures at 320/375/768. **23 PNGs**, with dimensions and SHA-256 hashes in `manifest.json`.
These fresh ES images supersede the previous long-label captures for this adjustment. Preserve these temporary
artifacts for review before cleanup.

### Final stopping point

**Final Spanish CTA task implemented and verified; AC-24 remains pending Architect/Mauricio visual approval.**
Approval of the wording is not approval of these screenshots. No new regression was found in the requested scope;
known lint debt, unfinished FR/ES copy and earlier AC-20/22/23 requirements remain as documented.

Only the same four request-specific files changed: the ES copy document, ES dictionary, dictionary test, and this
report. All previous work remains unstaged. The local server started for this verification on port **3101**, PID
**2802**, was stopped after browser checks; browser processes created by the harnesses were closed. No other
server was stopped. No `.env.local` edits, CMS writes, form submissions, production actions or Phase 5b work.
Whole-branch tracked diff remains **53 files, 918 insertions(+), 442 deletions(-)**; the existing report remains
untracked. Stopped for final AC-24 review.

---

## Gate re-run on the 5a-only tree (2026-10-27, Claude Code)

Context: the 5b work was moved out of the tree (backup outside the repo) and `services/page.tsx` rebuilt (D12).
`git diff --stat`: **53 files changed, 918 insertions(+), 442 deletions(-)**. `.env.local` targets
`magneto-cms-2.local`; `DISABLE_SMTP=1`.

| Gate | Result |
|---|---|
| `npm run lint` | **FAIL, exit 1 (unchanged baseline): 113 errors / 104 warnings**; `no-explicit-any` **96**. Same counts as the AC-24 gate above. |
| `npm run typecheck` | **PASS**, exit 0. |
| `npm test -- --run` | **PASS**: 29 files / **293 tests**. |
| `npm run build` (EN/FR/ES, `ALLOW_UNTRANSLATED_LOCALES=1` for this command only) | **PASS**, exit 0: **28 generated pages**. Run after Mauricio confirmed the `next dev -p 3200` server (PID 5403, not started by this agent) had stopped. |
| `ENABLED_LOCALES=en npm run build`, override unset (AC-3) | **PASS**, exit 0: **14 generated pages**. |
| `/services` final CTA (`ENABLED_LOCALES=en next start -p 3100`, local CMS in state N) | **PASS as AC-15; the AC-11 home fallback was not observable.** `/services` 200, 0 `lead-magnet-section`. It renders the **Services page's own** final CTA: "Not sure which path fits your website?", body and both buttons as in `magneto-copy-en.md` 402–410; the secondary button → `/contact`. The Home CTA ("Start with a conversation.", 122–126) renders on `/`. The home fallback only shows when the page's `finalCtaSection.title` is empty (state C). Making it observable would need a CMS write, which this task didn't do; the fallback is still covered by `FinalCTASection/api.test.ts`. Server PID 10197 (npx) / 10218 (next-server), started and stopped by this agent. |

Only this report changed in this re-run. Nothing staged or committed; `docs/specs/phase-5b-services-packages-seo.md`
not touched. D12 accepted by Mauricio (2026-10-27).
