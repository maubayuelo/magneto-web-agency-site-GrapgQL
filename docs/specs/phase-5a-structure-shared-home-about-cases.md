# Phase 5a — Structure: shared sections, Home, About, case studies

- Status: Draft
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-26
- Branch: `spec/phase-5a` (from `master` at `7c13800`). Nothing staged.
- Depends on:
  - `docs/specs/phase-5-gap-analysis.md` (rev 2) and the decisions of 2026-10-26 (recorded in E0);
  - `docs/adr/0006-phase-5-content-model.md` (Proposed; this spec is its first consumer);
  - `docs/reports/phase-4-ui-microcopy.md`.
- Release: **R1 (EN 2026), target 2026-11-20.** R1 = 5a + 5b + 5c loader + 5d-lite + the EN Privacy route. FR/ES content
  is loaded, but those locales stay disabled.

## Goal
The frontend renders the 2026 EN structure for the shared sections, Home, About, the `/projects` index and the three
case studies, from **new** ACF fields. It falls back to the old fields when the new ones are empty (ADR 0006
expand/contract). So:
- against the **current** content (production preview), every route renders the old content in the new layout,
  without errors and without the placeholder testimonials;
- against the **2026 copy** (local fixtures), the touched sections match `docs/content/magneto-copy-en.md`.

The Phase 5 ACF model (all fields in ADR 0006, including 5b's) is created once, locally, exported, and has a
production runbook ready to run before this PR's preview.

## Evidence (facts verified now)

### E0. Decisions this spec implements (Mauricio + Senior Architect, 2026-10-26)
- Release plan:
  - R1 = EN 2026;
  - R2 = enable FR, plus Phase 6 QA FR, about 25 FR UI strings and the 6-field Contact form;
  - R3 = ES, after the ES Privacy copy exists.
- D1: the new EN acceptance is "matches `magneto-copy-en.md` section by section" plus Mauricio's visual approval.
  `en.test.ts` is regenerated on purpose.
- D2–D4: per-page final CTA (old ACF defaults removed); a "content sections" repeater for Packages only (About
  `generalText` untouched); **one** ACF export.
- Expand/contract rule. Confirmed with evidence in ADR 0006, Context 2: WPGraphQL ACF runs `wysiwyg` through
  `the_content`, so a plain value becomes `<p>…</p>\n`, and `about-magneto/page.tsx:77-79` would print it literally.
- Content that rewrites existing values or rows is loaded into production on **release day** only, by the 5c loader
  (dry-run, `wp db export` before/after, read-back).
- Q1–Q9 defaults:
  - lead magnet hidden;
  - package CTAs → `/contact`; Services CTAs → `/packages#build|fix|care`;
  - drop "Check All Services", "Check All Projects" and the "Featured Services" title; keep "← Back to Projects";
  - no testimonial avatars;
  - `/projects` index reuses the Home section 4 heading + intro;
  - Contact supporting copy as paragraphs;
  - every "Book a Strategy Call" uses the same modal → Calendly flow;
  - italic lines are notes, except "Translated from Spanish";
  - order Dangel → Trépied → Shamanicca through `displayOrder`.
- The fake testimonials (Elena M., Marcus T., Sarah K., David R.) are **never rendered**.
- Out of 5a (other R1 phases): Services/Packages pages (5b), the loader (5c), the modal variant B + SLA removal +
  hero CTA → modal (5d-lite), and the Privacy route.

### E1. CMS (local, live, read-only, 2026-10-26; details in the gap analysis E1–E1c)
- 13 ACF groups, all `mode=translation`, no `pref=-`. No `acf-json` in the theme `intentionally-blank`.
- Locations by EN page ID: `finalCtaSection`, `homeFooter`, `homeTestimonialsSection`, `homeAboutSection`,
  `homeFeaturedServices` and `LeadMagnetSection` are `post_type==page AND page==2`. Translations inherit (FR 535 =
  EN 2).
- `homeAboutSection.description` and `aboutData.description` are `text`. `aboutData.general_text` and
  `project_description` are `wysiwyg`.
- ACF `url` fields reject `/contact` (`acf_validate_value` → `false`), so internal links go in `text` path fields
  (ADR 0006).
- Current EN content:
  - featured services: 2 rows, `anchorLink: null`;
  - testimonials: 4 placeholder rows, no role field;
  - footer: `footerLine1` "Follows and Updates in", `footerLine2` "Based in Montreal | Serving clients worldwide",
    1 social row (LinkedIn `https://www.linkedin.com/in/maubayuelo/`);
  - projects: Dangel 270 (3/4/3, 5 images), Trépied 498 (3/4/4, 7), Shamanicca 224 (3/3/3, 7);
  - GraphQL order: Trépied, Shamanicca, Dangel.
- FR/ES fixtures (535/536/558/550/541) are EN copies with `[FR TEST]`/`[ES TEST]` hero titles.

### E2. Code (file:line on `7c13800`)
- Layout: `layout.tsx:178-180` renders `LeadMagnetSection`, `FinalCTASectionLoader` and `FooterLoader` on every
  route, including the 404s (`[...rest]/page.tsx`, `not-found.tsx` render inside the layout).
- Final CTA:
  - `FinalCTASection/api.ts:11` reads home only.
  - `index.tsx:42-49,100-110`: a primary CTA with `ctaLink` containing "calendly" → modal; another URL → `<a>`; **no
    link → a `<button>` with no handler**.
  - `index.tsx:52` hides on `/contact`.
- Home:
  - `page.tsx:51-57` maps testimonials with `any`, `role: ''` and the avatar placeholder;
  - `:66` `<Testimonials>` is commented out;
  - `:67-72` `ProjectsGrid` with title `home.recentProjects`, `showButton`.
- `Testimonials/index.tsx:7-18,42` truncates quotes to 111 chars; `:21` default title "Some Testimonials".
  `TestimonialCard/index.tsx:14-21` always renders an avatar; `:27` `{author}, {role}`.
- `FeaturedServices/index.tsx:28` renders the h2 title; `:46-50` renders "Check All Services".
  `ServiceCard/index.tsx:27-34` renders "Learn More" only when `anchorLink`.
- `ProjectsGrid/index.tsx`:
  - `:82-91` Solution/Outcome lines;
  - `:96-101` "Check All Projects";
  - empty state `:31-43` (kept).
- `projects/page.tsx:20-27` renders `pageIntroText` as an h3.
- `ProjectDetail/index.tsx`: `:80` results heading; `:125-148` "View live site"; `:155-157` "← Back to Projects".
- `about-magneto/page.tsx`:
  - `:77-79` `description` as a text node;
  - `:92` `generalText` HTML (unsanitized; untouched by decision);
  - `:95-97` `CalendlyButton` + `common.bookStrategyCall`.
- `AboutSection/index.tsx:19` `dangerouslySetInnerHTML` without sanitization.
- `Footer/index.tsx`: `:14,50` hardcoded `'Default Footer Line 1/2'`; `:20-44` icon links; `:53` copyright.
- Data: `data/projects.ts:29-87` `GET_PROJECTS` (also used by `sitemap.xml` and `generateStaticParams`).
  `projects/api.ts:54-65` maps it.
- i18n:
  - `en.test.ts` locks every EN value (Phase 4 V0 fingerprint).
  - `dictionary.test.ts:116` expects `common.bookStrategyCall` to be the first FR untranslated key (changes when FR
    gets that value).
  - Build guard: ADR 0005 §4.
- Tests in scope: `FinalCTASection/api.test.ts`, `Testimonials/api.test.ts`, `Footer/api.test.ts`,
  `AboutSection/api.test.ts`, `FeaturedServices/api.test.ts`, `about-magneto/api.test.ts`, `projects/api.test.ts`,
  `ProjectsGrid/ProjectsGrid.test.tsx`, `dictionary.test.ts`, `en.test.ts`.

## Assumptions and open questions
- A1: the frontend falls back to the **old** field only when the new field is empty (`null`/`''` after trim). It never
  merges the two.
- A2: the 5a fixtures are EN only. FR/ES routes are checked for "renders, no crash, dictionary values where the copy
  provides them". FR/ES content is 5c.
- A3: section labels in the copy ("Meet Magneto", "Featured Services", "Selected Projects") are not displayed. The
  visible headings are the `####` lines (the gap analysis and Q3 decision).
- Open O1: the Home section 4 heading + intro are **dictionary** keys here (UI-adjacent, already
  `home.recentProjects`). The `/projects` hero gets the same strings through `heroContent` from the loader (content).
  This duplicates two strings between the dictionary and the CMS. Alternative: a new ACF group on home. Accept?
- Open O2: the FR testimonial heading isn't in the copy (`[FR TODO]` until the R2 FR strings).
- Open O3: SEO meta (EN marked "Draft") is not in 5a. Which R1 phase owns `meta.*` + `siteName` (brand rename)? The
  proposal is 5c or a small Phase 7 slice before R1.
- Open O4: icons for BUILD/FIX/CARE. Fixtures reuse the 2 existing service icons (row 3 reuses web-dev). Final icons
  are Phase 8.

## Design

### Compatibility rule (applies to every item)
Each new field is read with `new || old`. Each section must render sensibly in two states:
- **State C (compat):** new fields empty, current content. This is what the production preview shows.
- **State N (new):** fixtures loaded.

Unit tests cover both states for every mapper that has a fallback.

### Part 1 — model + data layer (before the checkpoint)
1. **ACF, local (Mauricio, WP admin).**
   - Take a `wp db export` first.
   - Create **every** field in ADR 0006's table (5a, 5b and 5d rows), the `packagesContentSections` group and the
     `finalCtaSection` location widening.
   - Remove the 3 `finalCtaSection` defaults.
   - Set the ACF *Instructions* of every superseded field to "(legacy — do not edit; replaced by X)".
   - Run the ACFML dump (`WP-SETUP.md`): new fields get the mode default prefs; `display_order` and `service_group`
     must be `pref=1` (switch the group to Expert only if they aren't).
   - Export **all 14 groups** (ACF → Tools → Export → JSON) to `docs/acf/phase-5-field-groups.json`.
2. **Schema check (Dev, read-only):** introspection shows every new GraphQL field, plus `Project.finalCtaSection`.
3. **Data layer (Dev):**
   - **Final CTA:** `getFinalCta(source, locale)` with `source = { kind: 'page', name } | { kind: 'project', slug }`.
     - Page: `pages(first:1, where:{language,name}) { nodes { finalCtaSection {…} } }`.
     - Project: `projects(first:1, where:{language,name:$slug}) { nodes { finalCtaSection {…} } }`.
     - Fields: `title subtitle ctaText ctaLink ctaPath secondaryCtaText secondaryCtaPath bgimage`.
     - If `title` is empty → `getHomePrefooter(locale)` values (home). The background image always comes from home
       when the page has none.
     - Keep `getHomePrefooter` as the home reader.
   - **Testimonials:** query `author testimonial role company city note thumb`. The mapper returns **only rows with a
     non-empty `role`**, typed, no `any`.
   - **Featured services:** add `serviceTagline`.
   - **Home about:** add `descriptionHtml` (fallback `description`).
   - **About page:** add `descriptionHtml ctaText ctaPath` (fallback: `description` as a text node; no CTA fields →
     the current `CalendlyButton`).
   - **Projects:** `GET_PROJECTS` and `GET_PROJECT_BY_SLUG_QUERY` add `projectsProjectData { cardDescription
     displayOrder }`.
     - `getProjects` maps `description = cardDescription || projectSubtitle || ''`.
     - It sorts by `displayOrder` ascending, nulls last, with the GraphQL order as tie-breaker.
     - The sitemap and `generateStaticParams` ignore order.
4. **Local fixtures script (Dev writes, Mauricio runs).**
   - Path: `scripts/phase-5a/local-fixtures.php`, run with `wp eval-file`.
   - It **aborts unless `home_url()` is `http://magneto-cms-2.local`**.
   - Writes EN only, copy text **verbatim** from `magneto-copy-en.md` (line refs in the field map below).
   - Idempotent: it sets values; it doesn't append.
   - Mauricio takes a `wp db export` before running it (Hard rule 10).
   - It's superseded by the 5c loader.
5. Unit tests for every mapper: state C, state N, `nodes: []`, and the testimonial `role` filter.

### Checkpoint (mid-phase) — stop after Part 1
The Dev delivers:
- the JSON export path;
- the post-import ACFML dump;
- the introspection output;
- the diff of the data layer and tests (gate green);
- the fixtures script, **not yet run**.

Mauricio + Senior Architect:
- approve the field list as final for the production export;
- schedule the production ACF runbook (it can run during Part 2; it must be done before the PR preview).

No component change happens before this approval.

### Part 2 — components
1. **Final CTA per page.**
   - Remove `FinalCTASectionLoader` (and `LeadMagnetSection`, item 2) from `layout.tsx`.
   - Render `<FinalCTASectionLoader source=… locale=…/>` at the end of: home (`page`/`home`), `about-magneto`,
     `services`, `packages`, `projects` (index), `projects/[slug]` (`project`/slug). Not on `contact` or the 404s.
   - Rendering:
     - primary: `ctaPath` → `<a href={localizePath(ctaPath)}>`; otherwise → modal button (`openModal({ origin:
       'finalcta', customUrl: ctaLink })`). That removes the dead `<button>`.
     - secondary (when both text + path): a second link styled as the secondary button.
     - Fallback CTA text: `common.bookStrategyCall`, not `cmsFallback.requestQuote`.
2. **Lead magnet:** not rendered anywhere (removed from the layout; component and api untouched for the later
   rebuild).
3. **Footer:**
   - Line 1 = `footerLine2`: it keeps its meaning, "Based in Montreal …"; the loader rewrites it on release day.
   - Then a links row:
     - `footer.linkedin` label → `footerSocialIcons[0].iconUrl` (`target=_blank`, `rel=noopener noreferrer`);
     - `footer.email` → `mailto:`.
   - Then the copyright `Magneto Web Consulting © {year}`.
   - `footerLine1` and the icons are no longer rendered. The hardcoded `'Default Footer Line'` fallbacks are removed.
   - The Privacy Policy link is added by the Privacy phase.
4. **Header:** no code change. `header.scheduleCall` and `common.bookStrategyCall` → "Book a Strategy Call".
5. **Home "Meet Magneto"** (`AboutSection`): `aboutSectionTitle` + `descriptionHtml || description`, sanitized with
   DOMPurify.
6. **Featured services:**
   - no section `<h2>` and no "Check All Services";
   - card = icon · title · tagline (when set) · description · link `format(featuredServices.explore, {name: title})` →
     `localizePath('/services')#<anchorLink>`, only when `anchorLink` is set (the anchor targets come in 5b);
   - keep the 2-column grid (BUILD + FIX on top, CARE below). Check at 375/768/1440.
7. **Projects section (Home) and cards:**
   - `ProjectsGrid` gets an optional `intro` prop. Home passes `home.recentProjects` + `home.projectsIntro`.
   - Card = thumbnail · title · description (exactly 3 visible elements, the whole card linked to the case study).
   - Remove the Solution/Outcome lines and "Check All Projects" (`showButton` prop removed).
   - Home shows 3; `/projects` shows up to 6. The empty state is unchanged.
8. **`/projects` index:** stop rendering `pageIntroText` (the hero carries heading + intro after the 5c load).
   Final CTA = page `projects` (empty → home fallback).
9. **Testimonials on Home**, after the projects section (copy order):
   - title `testimonials.title`;
   - card = quote (no truncation) · `author · role · (company || city)` · optional `note` (small, muted);
   - no avatar;
   - `null` when no row survives the `role` filter;
   - the typed mapper replaces `page.tsx:51-57`.
10. **About page:**
    - founder `descriptionHtml || description` (sanitized when HTML);
    - LinkedIn link unchanged (content via `linkText`/`linkUrl`);
    - `generalText` untouched;
    - bottom button: `ctaText && ctaPath` → `<a className="btn btn-secondary" href={localizePath(ctaPath)}>`,
      otherwise the current `CalendlyButton`.
11. **Case study (`ProjectDetail`):**
    - results heading `projectDetail.results` → "What Was Delivered";
    - the live link reads `format(projectDetail.viewLiveSite, { domain })`, where `domain` = the hostname of
      `projectUrl` without `www.` (e.g. "View dangelwellness.ca");
    - "← Back to Projects" kept;
    - final CTA = the project's group (empty → home).
    - The project post titles change via the loader (content).
12. **Dictionaries:** the table below. FR/ES get values **only** where the copy has them; the rest stays `TODO`.
    `en.test.ts` is regenerated from the new `en.ts` and reviewed against the copy line refs. `dictionary.test.ts:116`
    is updated.

### Field map for the EN fixtures (state N) — copy refs in `magneto-copy-en.md`
| Target | Value from |
|---|---|
| `homeAboutSection.aboutSectionTitle` / `descriptionHtml` | 30 / 32, 34, 36 as 3 `<p>` |
| `homeFeaturedServices.service[0..2]` title / tagline / description / anchorLink | BUILD 40-44 / FIX 48-52 / CARE 56-60; anchors `build`, `fix`, `care`; icons reused (O4) |
| `homeTestimonialsSection.testimonials[0]` | quote 88; author "Dangel Manik", role "Holistic therapist", city "Montreal" (91); note "Translated from Spanish." (94) |
| `homeTestimonialsSection.testimonials[1]` | quote 98; author "Israel Valencia Vázquez", role "Founder & video producer", company "TRÉPIED" (100); no note |
| (4 placeholder rows) | deleted (local only) |
| home `finalCtaSection` | 120 / 122 / ctaText "Book a Strategy Call" (124), `ctaLink` unchanged |
| about-magneto `finalCtaSection` | 230 / 232 / 234 |
| services `finalCtaSection` | 400 / 402+404 / primary 406 (no path → modal) / secondary 408 → `/contact` |
| packages `finalCtaSection` | 522 / 524+526 / primary 528 → `/contact` / secondary 530 (no path → modal) |
| projects page `finalCtaSection` | empty (copy has none → home fallback) |
| project 270 / 498 / 224 `finalCtaSection` | 956+958+960 / 1067+1069+1071 / 1202+1204+1206 |
| project `cardDescription` | 74 / 78 / 82 |
| project `displayOrder` | Dangel 1, Trépied 2, Shamanicca 3 |
| `aboutData.descriptionHtml` | 167, 169 as 2 `<p>` (bold name as `<strong>`) |
| `aboutData.ctaText` / `ctaPath` | "Tell me about your project" (212) / `/contact` |
| `homeFooter.footerLine2` | "Based in Montreal · Available in English, French & Spanish" (128) |

Not in fixtures (5c): heroes, About `generalText`, case-study bodies (subtitle, overview, lists, captions), post titles,
the `/projects` hero.

### Dictionary changes (EN value · FR · ES; "TODO" = stays `[FR TODO]`/`[ES TODO]` + EN)
| Key | EN (copy line) | FR (line) | ES (line) |
|---|---|---|---|
| `common.bookStrategyCall` | Book a Strategy Call (18) | Réserver un appel-conseil (18) | Agendar una llamada de orientación (20) |
| `header.scheduleCall` | Book a Strategy Call (18) | same | same |
| `nav.about` … `nav.contact` | unchanged | À propos · Services · Forfaits · Réalisations · Contact (16) | Sobre Magneto · Servicios · Paquetes · Proyectos · Contacto (16) |
| `home.recentProjects` | Selected Web Projects (66) | Réalisations web (66) | Proyectos web destacados (68) |
| **new** `home.projectsIntro` | 68 | 68 | 70 |
| **new** `featuredServices.explore` (replaces `learnMore`) | Explore {name} (46/54/62) | Découvrir {name} (46) | Conocer {name} (48) |
| removed: `featuredServices.checkAll`, `projects.checkAll`, `projects.solutionLabel`, `projects.outcomeLabel`, `cmsFallback.featuredServicesTitle` | — | — | — |
| `projectDetail.challenges` / `solutions` | unchanged | Défis / Solutions (509/515) | Retos / Soluciones (519/525) |
| `projectDetail.results` | What Was Delivered (929) | Livrables (522) | Entregables (532) |
| `projectDetail.viewLiveSite` | View {domain} (952) | Voir {domain} (542) | Ver {domain} (554) |
| **new** `testimonials.title` | Client feedback (86) | TODO (O2) | Opinión de clientes (86) |
| `footer.copyright` | Magneto Web Consulting © {year} (134) | same (114) | same (126) |
| **new** `footer.linkedin` | Mauricio Bayuelo on LinkedIn (240) | Mauricio Bayuelo sur LinkedIn (112) | Mauricio Bayuelo en LinkedIn (124) |
| **new** `footer.email` | contact@magnetomarketing.co | same | same |
| `cmsFallback.finalCta.title` / `subtitle` | 120 / 122 | 102 / 104 | 114 / 116 |

`cmsFallback.requestQuote`, `cmsFallback.leadMagnet.*` and `emailModal.*` aren't touched in 5a (the lead magnet isn't
rendered; the modal is 5d-lite). `meta.*` aren't touched (O3).

## Files the Dev may touch
- `scripts/phase-5a/local-fixtures.php` — new; local only.
- `src/app/[locale]/layout.tsx` — remove the lead magnet + final CTA.
- `src/app/[locale]/page.tsx` — final CTA, testimonials, projects intro.
- `src/app/[locale]/about-magneto/{page.tsx,api.ts,api.test.ts}`.
- `src/app/[locale]/services/page.tsx`, `src/app/[locale]/packages/page.tsx` — final CTA render only.
- `src/app/[locale]/projects/{page.tsx,api.ts,api.test.ts}`.
- `src/app/[locale]/projects/[slug]/{page.tsx,api.ts}`.
- `src/data/projects.ts` — `GET_PROJECTS` fields.
- `src/components/organisms/FinalCTASection/{index.tsx,FinalCTASectionLoader.tsx,api.ts,api.test.ts,types.ts,FinalCTASection.scss}`.
- `src/components/organisms/Footer/{index.tsx,types.ts,Footer.scss,api.test.ts}`.
- `src/components/organisms/AboutSection/{index.tsx,api.ts,api.test.ts}`.
- `src/components/organisms/FeaturedServices/{index.tsx,FeaturedServicesLoader.tsx,api.ts,api.test.ts,types.ts}`.
- `src/components/molecules/ServiceCard/{index.tsx,ServiceCard.scss}`.
- `src/components/organisms/ProjectsGrid/{index.tsx,types.ts,ProjectsGrid.scss,ProjectsGrid.test.tsx}`.
- `src/components/organisms/ProjectDetail/index.tsx`.
- `src/components/organisms/Testimonials/{index.tsx,api.ts,api.test.ts,types.ts,Testimonials.scss}`.
- `src/components/organisms/TestimonialCard/{index.tsx,Testimonials.types.ts,TestimonialCard.scss}`.
- `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts`, `src/i18n/dictionary.test.ts`.
- `docs/reports/phase-5a-structure-shared-home-about-cases.md` — report.

Mauricio-owned artifacts (not Dev):
- `docs/acf/phase-5-field-groups.json` (export);
- the local ACF field creation;
- local DB exports;
- the production runbook spec `docs/specs/phase-5a-production-acf-runbook.md` (written by the Architect after the
  checkpoint, from the outline below).

Anything not listed is out of scope.

## Out of scope
- Services and Packages page structure (5b), the content loader and production content (5c), the strategy-call modal,
  the Contact SLA text, hero CTA → modal (5d-lite), the Privacy route + footer Privacy link, SEO meta (O3).
- Removing old fields, old defaults (except `finalCtaSection`'s 3), fallbacks or `LeadMagnetSection` code (cleanup
  phase).
- Sanitizing About `generalText` (untouched by decision), and Known-debt items.
- Any production write by an agent. Any FR/ES content write.

## Acceptance criteria
Gate and hygiene
- [ ] AC-1 `npm run lint && npm run typecheck && npm test -- --run && npm run build` pass, with lint ≤ the baseline
  115 errors / 110 warnings, reported as numbers.
- [ ] AC-2 No new `any`: the `@typescript-eslint/no-explicit-any` count is ≤ its value at the branch point (measure at
  start; report both).
- [ ] AC-3 `ENABLED_LOCALES=en npm run build` passes **without** `ALLOW_UNTRANSLATED_LOCALES`. With `en,fr,es` it fails
  without the override and passes with it (guard intact).
- [ ] AC-4 `git diff --stat master` lists only files from "Files the Dev may touch".
- [ ] AC-5 Every new `dangerouslySetInnerHTML` passes through DOMPurify (`grep -n dangerouslySetInnerHTML` on the touched
  files, each new one sanitized).

Model
- [ ] AC-6 Local introspection shows every ADR 0006 field and `Project.finalCtaSection`. The ACFML dump shows all
  14 groups `mode=translation`, no `pref=-`, and `display_order`/`service_group` `pref=1`. The output is attached to
  the report.
- [ ] AC-7 `finalCtaSection` `title`/`subtitle`/`prefooter_cta_text` have no default (dump). The EN home final CTA
  GraphQL values are unchanged before/after the local ACF change (captured JSON, identical).

State C (new fields empty, current content). Run **before** the fixtures, `next start -p 3100`, EN.
- [ ] AC-8 `/`, `/about-magneto`, `/services`, `/packages`, `/projects`, `/projects/{3 slugs}`, `/contact` → 200;
  `/esto-no-existe` → 404 (not 500).
- [ ] AC-9 The HTML of `/` contains none of "Elena M.", "Marcus T.", "Sarah K.", "David R.", "Some Testimonials"
  (`curl … | grep -c` = 0). Same for `/fr` and `/es` (local `en,fr,es` + override).
- [ ] AC-10 No route shows a literal `<p>` or `&lt;p&gt;` (`grep -c '&lt;p&gt;'` = 0 on every route).
- [ ] AC-11 Final CTA:
  - every non-home route listed in AC-8 (except `/contact`) shows the **home** final CTA text (fallback);
  - `/contact` and `/esto-no-existe` have no `final-cta-section`;
  - the primary button opens the modal (browser click at 1440).
- [ ] AC-12 No route renders `lead-magnet-section` (`grep -c` = 0).

State N (after `local-fixtures.php`; DB export taken first)
- [ ] AC-13 `/` at 375/768/1440, each section compared with `magneto-copy-en.md`:
  - header CTA "Book a Strategy Call" (18);
  - Meet Magneto heading + 3 paragraphs (30-36);
  - BUILD/FIX/CARE cards with tagline, description and "Explore BUILD/FIX/CARE" → `/services#build|fix|care`
    (38-62); no "Featured Services" heading; no "Check All Services";
  - "Selected Web Projects" + intro (66-68) and 3 cards in the order **Dangel, Trépied, Shamanicca**, each exactly
    thumbnail · title · description (72-82);
  - "Client feedback" with 2 testimonials, full quotes, attributions as in the copy, "Translated from Spanish." under
    Dangel only, no avatars (84-100);
  - final CTA (118-124);
  - footer (126-134; no Privacy link yet).
- [ ] AC-14 `/about-magneto` at 375/768/1440:
  - founder 2 paragraphs with **Mauricio Bayuelo** bold (165-169);
  - LinkedIn link unchanged in place;
  - bottom button "Tell me about your project" → `/contact`;
  - About's own final CTA body (232), which differs from Home's (122).
- [ ] AC-15 `/services` → final CTA 400-408 with 2 buttons (primary → modal, secondary → `/contact`).
  `/packages` → 522-530 (primary → `/contact`, secondary → modal).
- [ ] AC-16 `/projects` → grid in `displayOrder` order, no Solution/Outcome lines, no "Check All Projects", no intro h3.
  Final CTA = home fallback.
- [ ] AC-17 `/projects/fashion-company-ecommerce`, `/projects/trepied-trepied-ca`, `/projects/shamaniccas-ecommerce`:
  - "What Was Delivered";
  - "View dangelwellness.ca" / "View trepied.ca" / "View shamanicca.com";
  - "← Back to Projects";
  - each project's own final CTA (956 / 1067 / 1202).
- [ ] AC-18 FR/ES smoke (`en,fr,es` + override): `/fr`, `/es`, `/fr/projects`, `/fr/projects/trepied-trepied-ca`,
  `/es/projects/trepied-trepied-ca` → 200. Dictionary strings from the table are visible (e.g. "Réserver un
  appel-conseil", "Livrables", "Voir trepied.ca"). No testimonials (FR/ES rows have no `role`). The final CTA falls
  back to the FR/ES home.
- [ ] AC-19 Accessibility on the touched sections: every link has visible text; focus is visible on the new links and
  buttons; the testimonial attribution isn't color-only. `lang` per locale is unchanged.

Dictionary
- [ ] AC-20 `en.test.ts` fingerprint = new `en.ts` (test green). The report lists each changed EN key with its copy
  line, and Mauricio confirms them.
- [ ] AC-21 FR/ES: only the keys in the table changed from `TODO`. Key parity test green.

Release gate (after merge approval, before merge)
- [ ] AC-22 The production ACF runbook is executed and reported **before** the PR's Vercel preview is checked.
- [ ] AC-23 The preview passes the WORKFLOW list plus AC-8 to AC-12 against production data (state C).
- [ ] AC-24 Mauricio's visual approval of state N screenshots (D1), recorded in the report.

## Production ACF runbook — outline
To be expanded into `docs/specs/phase-5a-production-acf-runbook.md` after the checkpoint, in the Phase 3b format.
Mauricio executes; agents run only read-only checks.

0. **Preconditions** (read-only):
   - the field list is approved at the checkpoint;
   - `docs/acf/phase-5-field-groups.json` is committed;
   - the production plugin versions = local (WPGraphQL 2.25.0, WPGraphQL ACF 3.0.0, ACF PRO 6.8.10, ACFML 2.1.5,
     WPML 4.7.6);
   - the production group **keys** match the export's keys (ACF → Field Groups, or a `wp eval` listing keys).
     If they don't match, stop: an import would create duplicate groups.
   - Production EN home `finalCtaSection` `title`/`subtitle`/`prefooter_cta_text` have **saved** values (`wp eval
     get_post_meta(2, …)`). If not, removing the defaults would change the live home, so stop and decide.
1. **Backups:** a SiteGround manual backup + `wp db export phase-5a-acf-before-<ts>.sql`, with a local copy.
2. **Before-capture:** Phase 3b Appendix A live-capture of the EN queries of the **current production frontend
   commit**, plus a GraphQL capture of the home final CTA, footer, testimonials and featured services.
3. **Import:** ACF → Tools → Import `phase-5-field-groups.json` (updates the existing groups by key and creates
   `packagesContentSections`).
4. **ACFML check:** run the dump; `diff` it with the local post-import dump (expect empty). Fix any `pref`
   differences in the admin.
5. **Schema check** (read-only): introspection shows the new fields and `Project.finalCtaSection`.
6. **After-capture:** step 2 again. The hashes of the current frontend's queries must be **identical** (only additive
   changes). The home final CTA values are identical.
7. **Cache:** `wp cache flush` + SiteGround dynamic cache flush. Spot-check that the live site's `/`, `/about-magneto`
   and one project are unchanged.
8. **Preview:** redeploy the 5a PR preview; run AC-23.
9. **Rollback:**
   - if step 6 differs or the live site changes: `wp db import phase-5a-acf-before-<ts>.sql`, flush the caches,
     re-capture;
   - if the issue appears only in the preview: no CMS rollback (the changes are additive); fix the frontend.

Record everything in the `WP-SETUP.md` change log with "(prod)" rows.

## Decisions needed
- O1: the projects heading/intro live in the dictionary (proposed) or in a new home ACF group.
- O3: the owner of SEO meta + brand rename in R1.
- The cleanup phase (ADR 0006 "contract") gets a slot after R3. Add it to the WORKFLOW phase table?
- ADR 0006: Proposed → Accepted at spec approval.

## Estimate
| Task | Dev (agent) | Mauricio |
|---|---|---|
| Part 1.1 local ACF fields (all of ADR 0006) + dump + export | — | 60–90 min (incl. db export) |
| Part 1.2–1.3 schema check + data layer (6 mappers, fallbacks, sort) | 2.5–3.5 h | — |
| Part 1.4 fixtures script | 1–1.5 h | — |
| Part 1.5 unit tests (states C/N, role filter, order) | 1–1.5 h | — |
| **Checkpoint** review | 0.5 h (summary) | 30–45 min (+ Senior Architect) |
| Production runbook spec (Architect) | 1 h | — |
| Production runbook execution | read-only checks ≈ 30 min | 75–110 min |
| Part 2.1–2.2 final CTA per page + layout | 2–3 h | — |
| Part 2.3–2.8 footer, Meet Magneto, featured services, projects grid/index | 2.5–3.5 h | — |
| Part 2.9–2.11 testimonials, About, case study | 2–3 h | — |
| Part 2.12 dictionaries + fingerprint + FR/ES values | 1.5–2 h | 15 min (confirm EN keys) |
| Verification: state C, fixtures run, state N (3 viewports), FR/ES smoke, a11y | 3–4 h | 15 min (run fixtures) + 45–60 min (visual approval) |
| Report | 1 h | — |
| PR preview check | 0.5 h | 20 min |
| **Total** | **≈ 18–25 h** | **≈ 5–7 h** |

The gap analysis estimated 8–12 h for 5a. This spec adds Part 1 for **all** of Phase 5's fields (the one-export
decision), the fixtures script, final-CTA rendering on Services/Packages, and the two-state verification that makes
production previews safe.
