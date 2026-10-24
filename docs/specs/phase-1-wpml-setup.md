# Phase 1 — WPML setup (local CMS)

- Status: Approved — 2026-10-24 (Senior Architect: D1–D4 approved)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-24
- Depends on: `docs/reports/phase-0-5b-code-hygiene.md` (merged as PR #5, `c9f5f52`). Branch: `chore/phase-1-wpml-setup`.
- Refs: `docs/adr/0001-wpml-headless-i18n.md`, `docs/ai/WP-SETUP.md`, `.claude/rules/wordpress-graphql.md`

## Post-execution corrections — 2026-10-24
Found while Mauricio ran the checklist. The original text below is kept; these entries win where they differ.
Details: `docs/reports/phase-1-wpml-setup.md`.
- **C1 (step 0, step 8, rollback):** the Local site is **"Magneto CMS 2"** (Local → Magneto CMS 2 → Open site
  shell). "Magneto CMS" is the old site.
- **C2 (step 0, step 8, rollback):** backups go to `~/Documents/projects/magneto/backups/`, not `~/magneto-backups`.
- **C3 (step 4):** WPML 4.7.6 has no "Create translations manually" option. WPML → Settings → Translation
  Editor only offers *Advanced Translation Editor* (enabled, default) vs *Classic Translation Editor*. That
  section was **left unchanged**. The manual choice is made per page instead: in the page's **Language** box,
  "Translation Editor" → use the native WordPress editor (step 7), and "Duplicate" + "Translate
  independently" detaches the copy. "Translate Everything Automatically" is OFF and no job is sent to ATE,
  so the automatic engines listed as ON never run. D1 (manual translation, no ATE) still holds.
- **C4 (step 5):** verified with a read-only WP-CLI dump of every group's `acfml_field_group_mode` and every
  field's `wpml_cf_preferences` (command in `docs/ai/WP-SETUP.md`), instead of opening the 13 groups.
  12/13 groups were already "Same fields across languages". "Projects - Project Data" had no mode;
  Mauricio set it and saved. Accepted deviations from the step 5 table are listed in the report.

## Goal
The **local** CMS (`magneto-cms-2.local`) is set up for EN / FR-CA / ES:
- EN is the default; French uses locale `fr_CA`.
- Pages and projects are translatable and **never fall back to EN**.
- Every ACF field group has a translation preference.
- The translation workflow suits a WP-CLI bulk load in Phase 5.
- One home-page translation per language proves the whole chain through GraphQL, and Phase 3 has a
  recommended way to fetch content per language.

EN content and the EN frontend stay byte-identical. Production is not touched.

**Who does what:** Mauricio does every click and every `wp` command in WP admin or Local's site shell.
Agents never write to the CMS. The Dev verifies only through read-only GraphQL, then updates
`docs/ai/WP-SETUP.md` and writes the report.

## Evidence (facts verified now)
All queries are anonymous `POST http://magneto-cms-2.local/graphql` (read-only), run 2026-10-24 with the
site running. Responses are trimmed. `extensions` is removed.

### E1. WPML is active; languages and locales
```graphql
{ languages { id code language_code default_locale native_name url } defaultLanguage { code default_locale } }
```
```json
{"languages":[
  {"id":"1","code":"en","default_locale":"en_US","native_name":"English","url":"http://magneto-cms-2.local/"},
  {"id":"4","code":"fr","default_locale":"fr_FR","native_name":"Français","url":"http://magneto-cms-2.local/fr/"},
  {"id":"2","code":"es","default_locale":"es_ES","native_name":"Español","url":"http://magneto-cms-2.local/es/"}],
 "defaultLanguage":{"code":"en","default_locale":"en_US"}}
```
- Default EN ✅. FR and ES exist ✅. URL format is already **directories** (`/fr/`, `/es/`) ✅.
- **French locale is `fr_FR`. It must become `fr_CA`** (checklist step 2).
- `generalSettings.language` → `""`, i.e. the WP site language is the default `en_US`.

### E2. Language arguments (WPML GraphQL)
- Root fields: `languages`, `defaultLanguage`. Singles `page(id, idType: DATABASE_ID|ID|URI)` and
  `project(id, idType: DATABASE_ID|ID|SLUG|URI)` take **no** language argument.
- Connections `pages`, `projects`, `contentNodes`, `menus`, `menuItems` and `mediaItems` have
  `where.language: String`. **It is a lowercase `String`, not the uppercase `LanguageCodeFilterEnum` that
  Dangel used.** `"all"` is accepted. An unknown code gives an error:
  `{"message":"Internal server error","extensions":{"debugMessage":"Filtering by a non-active language"}}`.
- `Page`, `Project` and `MediaItem` have `language { code … }`, `languageCode: String`,
  `translationGroupId: ID` and `translations: [Page|Project|MediaItem]`. `translations` takes **no arguments**.

### E3. Content types and what is translatable today
```graphql
{ contentTypes { nodes { name graphqlSingleName } } taxonomies { nodes { name connectedContentTypes { nodes { name } } } } }
```
→ content types `post`, `page`, `attachment` (`mediaItem`), `project`. Taxonomies: only `category`,
`post_tag` and `post_format` (posts only). **There are no services, packages or testimonials CPTs.**
That content is ACF on pages.

| Type | Count (EN) | WPML state seen in GraphQL | Evidence |
|---|---|---|---|
| `page` | 7: home(2), about-magneto(32), services(34), packages(36), projects(38), contact(41), carte(533) | translatable, **only translated items** | each page has `languageCode:"en"` and a `translationGroupId`; `pages(where:{language:"fr"})` → `[]` |
| `project` | 3: trepied-trepied-ca(498), shamaniccas-ecommerce(224), fashion-company-ecommerce(270) | translatable, **falls back to EN** ⚠️ | `projects(where:{language:"fr"})` → the 3 EN projects, each with `languageCode:"en"`. Same for `es`. |
| `post` | 0 | n/a | `posts` → `[]` |
| `attachment` | 63 EN | translatable, **already duplicated**: 53 FR + 53 ES copies | `mediaItems(language:"fr")` → 53 nodes (`languageCode:"fr"`); 24 newer EN items (2025-10 portfolio PNGs, ids 502–528) have no copies; **0** copies whose `sourceUrl` differs from EN |
| menus | 0 visible | n/a | `menus` / `menuItems` → `[]`. The header nav is hardcoded (`Header/index.tsx:123-127`). |
| options pages | none | n/a | no ACF options field on `RootQuery` |

Also seen: PDFs 484 (EN), 485 (FR) and 486 (ES) have `sourceUrl: null` in all three languages. This
already happens in EN, which is why `LeadMagnetSection/api.ts` uses `guid`/REST. Not caused by WPML.

### E4. Header / Footer and shared sections
There are no WP menus and no options page. Header (`homeFooter.logo` lookup), Footer (`homeFooter`),
LeadMagnet, FinalCTA, About, FeaturedServices and Testimonials all read **ACF on the home page**
(`page(id:"home", idType: URI)`). So translating the home page translates those shared sections. There
is nothing separate to set up for menus.

### E5. ACF field groups (13) and field types
`AcfFieldGroup.possibleTypes`. 12 groups attach to `Page` (`WithAcf*` interfaces), and 1 attaches to `Project`.
The table shows the type of each field as GraphQL exposes it. `Media` = `AcfMediaItemConnectionEdge`.

| # | Group (GraphQL type / field) | Real content on | Fields |
|---|---|---|---|
| 1 | `HeroContent` / `heroContent` | every page except carte | heroTitle, subtitleHero, ctaTextHero: String · ctaLinkHero: String (URL) · image, backgroundImage: Media |
| 2 | `HomeAboutSection` / `homeAboutSection` | home | aboutSectionTitle, description: String |
| 3 | `HomeFeaturedServices` / `homeFeaturedServices` | home | title: String · service[]: serviceTitle, serviceDescription: String, anchorLink: String (URL), serviceIcon: Media |
| 4 | `HomeTestimonialsSection` / `homeTestimonialsSection` | home | testimonials[]: author, testimonial: String, thumb: Media |
| 5 | `LeadMagnetSection` / `leadMagnetSection` | home | overTitle…, title…, subtitle…, ctaText…: String · ctaLinkLeadMagnetSection: Media (PDF) |
| 6 | `FinalCtaSection` / `finalCtaSection` | home | title, subtitle, ctaText: String · ctaLink: String (URL) · bgimage: Media |
| 7 | `HomeFooter` / `homeFooter` | home | footerLine1, footerLine2: String · footerSocialIcons[]: iconUrl: String (URL), iconSvg: Media |
| 8 | `AboutData` / `aboutData` | about-magneto | sectionTitle, description, generalText, calendlyText, linkText: String · calendlyUrl, linkUrl: String (URL) |
| 9 | `ContactContactTexts` / `contactContactTexts` | contact | tagText, mainCopy, bodytext: String |
| 10 | `PackagesPackageFeatures` / `packagesPackageFeatures` | packages | packagesElements[]: name, description, price: String · popularChoise: Boolean · icon: Media · features[]: feature: String |
| 11 | `Pageintrotext` / `pageintrotext` | services, packages, projects | pageIntroText: String |
| 12 | `ServicesServiceDetails` / `servicesServiceDetails` | services | services[]: title, description: String · featuredService: Boolean · icon, image: Media |
| 13 | `ProjectsProjectData` / `projectsProjectData` | projects | projectData: projectSubtitle, projectDescription: String, projectUrl: String (URL), challenges[]/solutions[]/results[]: item: String · images[]: footNote: String, ismobilescreenshot: Boolean, image: Media |

**Fact (risk for Phase 5):** groups 2–9 return values on pages where they hold no real content. For
example `homeFooter.footerLine1` is "Check updates and news in so…" on every page except home ("Follows
and Updates in…"), and `aboutData.sectionTitle` is "The Founder" on all 7 pages. These are ACF field
**default values**: ACF returns the default when no value is saved. So a FR or ES translation with an
empty field will show the **EN default text**, silently. Phase 5 must write every text field. Phase 6 QA
must flag values equal to the EN default.

The frontend reads only home, the 5 route pages and the projects (`grep page(id: … idType: URI)` across
`src/**/api.ts`). Admin field-group **titles** may differ from the GraphQL type names above. Mauricio
matches them by the GraphQL field name, shown in ACF → field group → "GraphQL" settings.

### E6. EN content baseline (for the "EN unchanged" check)
Script in Appendix A (EN pages + projects, every ACF field above, media `databaseId` + `sourceUrl`,
sorted by `databaseId`). Run twice, same result both times:
```
pages 7 projects 3 bytes 43716 sha256 a9345a3b19f1821ef92c5dc79d790e2dd24cf3a9e29664987a0d982c57383743
home sha256 5e89fb5b4f6f1e778432a9b294d8260ac8be9acb3f329fb71784106b688c4beb
```
Current EN home hero (from `page(id:"home", idType:URI)`): heroTitle "Attract More Aligned Clients Online",
backgroundImage `databaseId 52` → `…/uploads/2025/08/hero-background.png`. `translations: []`.

### E7. URI lookups can silently resolve to EN
```graphql
{ a: page(id:"/", idType:URI){ databaseId }  b: page(id:"fr/home", idType:URI){ databaseId }
  c: nodeByUri(uri:"/fr/"){ __typename }      d: pages(where:{language:"en", name:"home"}){ nodes { databaseId } } }
```
→ `a: 2` · **`b: 2` (the EN home, although no FR page exists)** · `c: null` · `d: [2]`.
A `page(id:"fr/…", idType: URI)` lookup cannot be trusted to mean "FR or nothing". This feeds item 6.

### E8. Other findings (not in scope, for the report)
- `PackagesGrid/api.ts` queries `homePackages` and `PreFooter/api.ts` queries `homePrefooter`. Neither
  group exists in the schema (E5), so those queries would fail as a whole. `/packages` gets its data from
  `app/packages/api.ts`, which does work.
- Plugin versions are not visible to anonymous GraphQL (`plugins` → `[]`). Mauricio's `wp plugin list`
  (step 0) records them.

## Assumptions and open questions
- Assumption: the WPML / ACFML admin labels below match current versions (WPML 4.6+, ACFML 2.x). I
  cannot see WP admin. **If a screen differs, Mauricio stops, writes down what he sees, and picks the
  option with the same meaning.** The report records the real labels.
- Assumption: WPML's "Duplicate" creates FR/ES copies of the home page with the same slug (`home`) and
  copies every ACF value. Step 7 verifies it.
- Assumption: image fields set to Copy keep resolving to a file with the same `sourceUrl` in FR/ES (the
  media copies share files, E3). Verified in V5.
- Resolved (D2): Spanish locale stays `es_ES`; `hreflang` stays `es`.
- Resolved (D3): the FR/ES home pages with their `[FR TEST]` / `[ES TEST]` markers are kept as Phase 5's
  starting point. See "Notes for later phases" for the marker rule.
- Open (Phase 3, not now): the fallback for a missing translation (404 vs EN with notice) is decided in
  the Phase 3 spec. Phase 1 only guarantees the CMS never returns EN content for a FR or ES query.

## Design — Dev pre-capture (before Mauricio clicks anything)
- **V0 EN baseline:** before step 0, the Dev runs Appendix A and records its output in the report. It
  must equal E6 (`a9345a3b…` all, `5e89fb5b…` home).
  - If it differs, the CMS content changed after this spec was written. **Stop**, report the diff, and
    take the new hashes as the baseline only after Mauricio confirms that nobody edited EN content on
    purpose.
  - Then tell Mauricio "baseline captured". Only after that does he start step 0.
- Also save the raw JSON of the E1, E3 (projects FR) and E7 queries in the scratchpad, as the "before"
  state for the report.

## Design — Mauricio's WP-admin checklist
**Start only after the Dev reports V0 ("baseline captured").** Do the steps in order. Tick each one. Write down anything that differs. Never touch production.
Confirm the URL bar shows `magneto-cms-2.local` before every step.

### Step 0. Checkpoint "before" (Local → Magneto CMS → Open site shell) — *see C1, C2*
```bash
mkdir -p ~/magneto-backups
wp db export ~/magneto-backups/magneto-cms-2_phase1-before_$(date +%Y%m%d-%H%M).sql
wp plugin list --fields=name,status,version          # paste into the report (read-only)
wp eval 'echo wp_json_encode( apply_filters( "wpml_setting", null, "custom_posts_sync_option" ) ), PHP_EOL;'   # read-only; paste
```
- Backups go **outside the repo** (the repo's `.gitignore` blocks `*.sql` anyway).
- The last command prints the WPML translation mode per post type (`0` not translatable, `1`
  translatable, `2` translatable with EN fallback). It is read-only.
- Do not paste the WPML site key or license anywhere.

### Step 1. Finish or confirm the WPML wizard
WP admin → **WPML**. If the setup wizard opens:
1. Languages: default **English**; translation languages **French, Spanish**. Don't add others.
2. URL format: **Different languages in directories** (already active, E1).
3. Translation mode: choose **"Translate Some"** (manual). **Do not** choose "Translate Everything
   Automatically". Automatic or machine translation is forbidden (approved copy comes from Notion,
   AGENTS.md Hard rule 4).
4. Who translates: **Myself** (no translators, no translation service).
5. Registration: register as a **development** site (WPML → Register → site key for `magneto-cms-2.local`).
   Never commit or paste the key.
6. Recommended plugins: **skip** (don't install String Translation, Media Translation, etc.).

If there is no wizard, confirm the same values under WPML → Languages / Settings.

### Step 2. Languages: French locale → `fr_CA`
WPML → **Languages** → "Site Languages" → **Edit Languages** → row **French** → field
**Default locale**: `fr_FR` → `fr_CA` → **Save**. Do **not** add a new "French (Canada)" language. The
code stays `fr`.
On the same Languages page:
- **Browser language redirect** → "Disable browser language redirect". The site is headless; WP's
  front end is not the public site.
- **Language switcher** options: leave as they are (unused by the frontend).

### Step 3. Post types translation mode
WPML → **Settings** → **Post Types Translation**:

| Post type | Set to | Why |
|---|---|---|
| Pages | **Translatable – only show translated items** (should already be set, E3) | missing FR/ES must not show EN |
| Projects | **Translatable – only show translated items** (today: falls back to EN, E3) ⚠️ change | same. `projects(language:"fr")` must return `[]` until projects are translated |
| Posts | leave as is | no posts exist |
| Media | leave as is; write down the current value | 53 FR/ES copies already exist and share files (E3); changing it now risks broken IDs |
| ACF field groups (`acf-field-group` / "Field Groups"), if listed | **Not translatable** | field definitions are shared; ACFML translates values, not definitions |

→ **Save**. Taxonomies: leave them (posts only, unused).

### Step 4. Translation editor (decides Phase 5) — *see C3*
WPML → **Settings** → **Translation Editor** / "How to translate posts and pages":
- Choose **"Create translations manually"** (translate in the WordPress editor). Don't use WPML's
  Advanced or Classic Translation Editor.
- If asked, turn off "translate automatically".

**Why (item 5):** Phase 5 loads the approved FR/ES copy with a WP-CLI script.
- The script writes posts and ACF meta directly (`wp post create` / `update_field`) and links
  translations with WPML's `wpml_set_element_language_details` action.
- In manual mode those writes are the translation. WPML has no separate translation job.
- With the Advanced Translation Editor (ATE), translations belong to ATE jobs and its translation memory.
  Editing them in the WP editor triggers "this content was translated with the Translation Editor"
  warnings, and the next ATE sync can **overwrite** the WP-CLI values.
- ATE's main advantage is automatic translation and credits, which this project must not use (Hard
  rule 4). So manual mode removes a moving part without losing anything we need.
- Trade-off: no translation-status dashboard. Phase 6's QA script replaces it.

### Step 5. ACFML: translation preference per field group — *see C4*
Rule, from the scope:
- Text → **Translate**.
- Images/files, booleans and URLs that are the same in every language → **Copy**.
- URLs that may differ per language → **Copy once** (prefilled from EN, editable in FR/ES later).
- Repeater structure → kept in sync with EN.

For **each** of the 13 groups: ACF → **Field Groups** → open the group → box **"Multilingual Setup"**
(ACFML) → choose **"Same fields across languages"** → **Save**. Then check the per-field
**translation preference** that ACFML shows next to each field and compare it with this table. If any
field differs and can't be changed, switch that group to **"Expert"**, set the fields as listed, and save.

| # | Group | Translate | Copy | Copy once |
|---|---|---|---|---|
| 1 | Hero Content (`heroContent`) | heroTitle, subtitleHero, ctaTextHero | image, backgroundImage | ctaLinkHero (Calendly / internal URL) |
| 2 | Home About (`homeAboutSection`) | aboutSectionTitle, description | — | — |
| 3 | Home Featured Services (`homeFeaturedServices`) | title, service › serviceTitle, serviceDescription | service › serviceIcon | service › anchorLink |
| 4 | Home Testimonials (`homeTestimonialsSection`) | testimonials › testimonial | testimonials › author, thumb | — |
| 5 | Lead Magnet (`leadMagnetSection`) | overTitle…, title…, subtitle…, ctaText… | — | ctaLinkLeadMagnetSection (PDF; FR/ES guides may differ) |
| 6 | Final CTA (`finalCtaSection`) | title, subtitle, ctaText | bgimage | ctaLink |
| 7 | Home Footer (`homeFooter`) | footerLine1, footerLine2 | footerSocialIcons › iconSvg, iconUrl | — |
| 8 | About Data (`aboutData`) | sectionTitle, description, generalText, calendlyText, linkText | — | calendlyUrl, linkUrl |
| 9 | Contact Texts (`contactContactTexts`) | tagText, mainCopy, bodytext | — | — |
| 10 | Packages Features (`packagesPackageFeatures`) | packagesElements › name, description, **price** (number format differs: "1 500 $" in FR-CA), features › feature | packagesElements › icon, popularChoise | — |
| 11 | Page Intro Text (`pageintrotext`) | pageIntroText | — | — |
| 12 | Services Details (`servicesServiceDetails`) | services › title, description | services › icon, image, featuredService | — |
| 13 | Projects Data (`projectsProjectData`) | projectSubtitle, projectDescription, challenges/solutions/results › item, images › footNote | images › image, ismobilescreenshot | projectUrl (usually the same; editable) |

Notes:
- Testimonial `author` is a person's name, so it is copied.
- Do **not** retype or edit any EN value while you are in these screens.
- If ACFML asks to "synchronize translated fields" or offers a bulk sync for existing posts, **don't run
  it now**. There are no translations yet, except step 7.

### Step 6. Menus, options, strings
Nothing to do: no WP menus are used and there is no ACF options page (E3, E4). WPML String Translation
stays off (WP-SETUP plugin plan). UI microcopy is Phase 4, in code.

### Step 7. Proof of concept: FR and ES home pages with one test string each
1. Pages → **Home** (EN, id 2) → edit. In the **Language** box, tick **Français** and **Español**
   under "Duplicate" → **Duplicate**.
2. Open the **French** copy (Pages → language switcher FR → Home) → click **"Translate independently"**.
3. In **Hero Content → heroTitle**, replace the text with exactly:
   `[FR TEST] Attract More Aligned Clients Online`
   Change nothing else. Slug stays `home`. Status **Published** (this is local only). → **Update**.
4. Do the same for **Spanish** with `[ES TEST] Attract More Aligned Clients Online`.
5. The test strings are QA markers, not copy. Don't use translated text here.
6. Don't touch the EN home page. Close it **without** clicking Update.

### Step 8. Checkpoint "after" (site shell) — *see C1, C2*
```bash
wp db export ~/magneto-backups/magneto-cms-2_phase1-after_$(date +%Y%m%d-%H%M).sql
wp eval 'echo wp_json_encode( apply_filters( "wpml_setting", null, "custom_posts_sync_option" ) ), PHP_EOL;'   # paste: page and project should now be 1
```
Then tell the Dev "Phase 1 clicks done", plus anything that differed.

**Rollback** (*see C1, C2*)**:** in the site shell, `wp db import ~/magneto-backups/<before-file>.sql`. Or use the Local
snapshot "Magneto CMS" from the WP-SETUP change log.

## Design — Dev verification (read-only GraphQL, after step 8)
Use the query style of E1–E7 against `http://magneto-cms-2.local/graphql`. No WP-CLI, no admin, no
mutations. Save the raw responses under the session scratchpad, not in the repo.

- **V1 Languages:** E1 query → `fr.default_locale == "fr_CA"`; `en` is still the default; `es_ES` unchanged
  (unless D2 says otherwise).
- **V2 Pages per language:**
  - `pages(where:{language:"fr"})` → exactly 1 node: `slug:"home"`, `languageCode:"fr"`,
    `translationGroupId:"2"`, `status:"publish"`. Same for `es`.
  - `pages(where:{language:"en"})` → the same 7 EN pages as E3.
- **V3 No EN fallback:**
  - `projects(where:{language:"fr"})` → `[]`. Same for `es`.
  - `pages(where:{language:"fr", name:"services"})` → `[]`.
- **V4 EN unchanged:** Appendix A → **the same sha256 values as E6** (`a9345a3b…` for all, `5e89fb5b…`
  for home). Any difference is a blocker: report the diff, field by field.
- **V5 FR/ES content:** fetch the FR and ES home with the same field selection as Appendix A. Then:
  - `heroContent.heroTitle` must be exactly the test string.
  - **every other field must equal EN**. Diff the JSON with `heroTitle` removed. Media `databaseId` may
    differ (FR/ES attachment copies), but `sourceUrl` must be identical.
  - Report every difference.
- **V6 Fetch strategies (item 6):** run all three for `fr`, for `es`, for `en`, and for a missing case
  (`services` in `fr`). Record: correct node? | behaviour when missing | requests | response bytes | can
  it reuse today's EN query unchanged?
  - **A. `translations` (EN-anchored):** `page(id:"home", idType:URI){ translations { languageCode heroContent{…} } }`,
    then pick `languageCode` in code.
  - **B. Language where-arg:** `pages(where:{language:$lang, name:"home"}, first:1){ nodes { languageCode heroContent{…} } }`.
  - **C. Localized URI:** `page(id:"/fr/", idType:URI)` (FR front page), plus control
    `page(id:"fr/services", idType:URI)`. E7 predicts the control returns **EN** (wrong).

  **Provisional recommendation for Phase 3: B.**
  - It makes one request, carries a single-language payload, and returns `[]` when content is missing.
    With step 3 that means a clean "not found", never EN.
  - It matches ADR 0001 §4 (`locale` passed explicitly to every `api.ts`, here `language: $locale`).
  - It keeps the EN slug as the stable key, as the routes use today.
  - A pays for the EN payload plus every other language, needs EN first, and can't be filtered
    server-side.
  - C is unsafe because of E7.

  The Dev confirms or overturns B with the V6 numbers. Limitation: home is the front page, so B's slug
  behaviour for a normal page is verified only by the "missing" case. The Phase 3 spec re-checks it once
  a second page is translated.
- **V7 Frontend EN regression:** `npm run dev` (GET only).
  - HTTP smoke identical to 0.5b: the 9 routes → 200, `/projects/no-existe` 404, `/carte` 404, robots and
    sitemap 200, `/api/ping-cms` 404.
  - The `/` HTML contains "Attract More Aligned Clients Online" and **not** `[FR TEST]` / `[ES TEST]`.
  - `/projects/trepied-trepied-ca` still 200 (`project(id, SLUG)` unaffected).
- **V8 Docs:** update `docs/ai/WP-SETUP.md`:
  - plugin table: WPML / ACFML now active and configured, with the versions from step 0.
  - "Phase 1 order": mark the steps done.
  - change log: one row per checklist step (date, change, "Mauricio"), plus the backup file names (names
    only).
  - a new section **"WPML / ACFML settings (to repeat in production)"**: the values of steps 1–5,
    including the real admin labels.

## Files the Dev may touch
- `docs/ai/WP-SETUP.md`: as in V8.
- `docs/reports/phase-1-wpml-setup.md`: the report (V1–V7 evidence, Mauricio's step notes, deviations).
- `CLAUDE.md`: "Current phase" line → `Phase 1 — WPML setup (local CMS).` plus the scope pointer to this spec.
- `docs/adr/0001-wpml-headless-i18n.md`: add a short **"Translation workflow"** note (D1). Translations are
  created manually in the WordPress editor, not in WPML's Translation Editor (ATE) and with no automatic
  translation. Phase 5 bulk-loads approved FR/ES copy with WP-CLI. Keep it to 3–5 lines; nothing else
  in the ADR changes.
- `AGENTS.md`: Known debt (Code) only. Add one line: `PackagesGrid/api.ts` (`homePackages`) and
  `PreFooter/api.ts` (`homePrefooter`) query ACF groups that don't exist in the schema → for Phase 3.
  First check whether those components or functions are rendered or called anywhere
  (`grep -rn "PackagesGrid\|PreFooter\|getHomePackages\|getPrefooter" src`, adjusting for the real
  function names) and write the result into the line, e.g. "component rendered by `/packages`, but the
  `api.ts` function is unused".
(Anything not listed is out of scope. **No changes in `src/`**, config, dependencies or `.env.local`.)

## Out of scope
- Any frontend code: routing, `locale` in `api.ts`, switcher, dictionaries (Phases 2–4).
- Writing to the CMS by any agent; any production change (WPML on SiteGround is a separate, later task
  that follows the WP-SETUP section from V8).
- Translating real copy (Phase 5). Translating projects or pages other than home.
- WPML String Translation, Media Translation, Yoast SEO Multilingual (Phase 7).
- Fixing the `homePackages` / `homePrefooter` queries (E8). They are only recorded in Known debt, for Phase 3.
- ACF default values (E5 risk). See "Notes for later phases".
- The `carte` route.

## Acceptance criteria
- [ ] V0: the EN baseline was captured **before** step 0 and equals E6 (or the confirmed new baseline). The timestamp is in the report.
- [ ] Step 0 and step 8 backups exist (file names in the report, no contents). The `wp plugin list` output is in the report.
- [ ] V1: `fr` → `fr_CA`; default `en`.
- [ ] V2: FR and ES each have exactly one page (`home`, published, `translationGroupId:"2"`); EN still has 7.
- [ ] V3: `projects` FR/ES → `[]`; missing page in FR → `[]`. The `custom_posts_sync_option` output shows page = 1 and project = 1.
- [ ] V4: EN sha256 values are identical to E6.
- [ ] V5: FR/ES home equals EN except `heroTitle`. Image `sourceUrl`s are identical.
- [ ] V6: comparison table for A/B/C with numbers. Recommendation confirmed or overturned, with the reason.
- [ ] V7: HTTP smoke identical to 0.5b. The `/` HTML has no test markers.
- [ ] V8: `WP-SETUP.md` updated, including the "to repeat in production" section.
- [ ] ADR 0001 has the "Translation workflow" note (D1). AGENTS.md Known debt has the `homePackages` /
      `homePrefooter` line, with the usage result.
- [ ] Gate (sanity; no code changed): `npm run lint && npm run typecheck && npm test -- --run && npm run build`
      → equal to the 0.5b report (lint errors ≤ the 0.5b count; build 14/14).
- [ ] Production: no request to `cms.magnetomarketing.co` from any agent (state it in the report).

## Decisions (resolved — Senior Architect, 2026-10-24)
- **D1 → yes:** translations are created manually in the WordPress editor, not in WPML's Translation Editor.
  The Dev records it in ADR 0001 as a "Translation workflow" note.
- **D2 → yes:** keep `es_ES`; `hreflang` stays `es`.
- **D3 → yes:** keep the FR/ES test pages. The marker rule is under "Notes for later phases".
- **D4 → yes:** projects use "only show translated items". This matches ADR 0001 (never silently show EN under
  `/fr` or `/es`). Until Phase 5, `/fr` and `/es` have no projects.
- No new dependency. No frontend routing or data-model change in this phase.

## Notes for later phases
- **Phase 5 (content load):** no `[FR TEST]` or `[ES TEST]` string may remain in any FR/ES field when
  Phase 5 closes. The PoC home pages are overwritten with approved copy.
- **Phase 6 (QA script), required checks:**
  1. **Fail** (non-zero exit) if any `[FR TEST]` or `[ES TEST]` string is found in any language, in any field.
  2. **ACF default-value check (E5 risk):** flag any FR/ES text field whose value equals the EN field's
     *default value* or the EN value itself. Empty fields return ACF defaults, so EN text can show under
     `/fr` or `/es` without anyone noticing. Copy/Copy-once fields from step 5 (URLs, media, booleans,
     testimonial authors) are exempt.
- **Phase 3 (locale-aware data):**
  - Start from the V6 recommendation and re-check slug behaviour on a non-front page.
  - Fix or remove the `homePackages` / `homePrefooter` queries (Known debt line added in this phase).

## Estimate
- **Mauricio, active time: 75–110 min.**
  - Step 0 backup + reads: 5–10.
  - Wizard / registration: 10–15.
  - Languages: 5.
  - Post types: 5.
  - Translation editor: 5.
  - **ACFML, 13 groups × 2–3 min: 30–40.**
  - PoC duplicates + 2 edits: 10–15.
  - Step 8: 5.
  - Plus waiting for the Dev's verification.
- Dev agent time: 30–45 min (V1–V7 ≈ 20, docs ≈ 10, report ≈ 10).
- Review (Mauricio + Senior Architect): 15–20 min.

---

## Appendix A — EN baseline script (read-only)
Save it as `<scratchpad>/baseline.mjs` and run it with `node baseline.mjs`. Change `language:"en"` to
`"fr"` / `"es"` for V5. The FR/ES output will differ, so don't compare its hashes with E6; diff the JSON instead.
```js
import { createHash } from "node:crypto";
const U = "http://magneto-cms-2.local/graphql";
const post = async (q) => (await (await fetch(U, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) })).json());
const M = "node { databaseId sourceUrl }";
const PAGE = `databaseId slug uri status
 heroContent { heroTitle subtitleHero ctaTextHero ctaLinkHero image { ${M} } backgroundImage { ${M} } }
 homeAboutSection { aboutSectionTitle description }
 homeFeaturedServices { title service { serviceTitle serviceDescription anchorLink serviceIcon { ${M} } } }
 homeTestimonialsSection { testimonials { author testimonial thumb { ${M} } } }
 leadMagnetSection { overTitleLeadMagnetSection titleLeadMagnetSection subtitleLeadMagnetSection ctaTextLeadMagnetSection ctaLinkLeadMagnetSection { ${M} } }
 finalCtaSection { title subtitle ctaText ctaLink bgimage { ${M} } }
 homeFooter { footerLine1 footerLine2 footerSocialIcons { iconUrl iconSvg { ${M} } } }
 aboutData { sectionTitle description generalText calendlyText calendlyUrl linkText linkUrl }
 contactContactTexts { tagText mainCopy bodytext }
 packagesPackageFeatures { packagesElements { name description price popularChoise icon { ${M} } features { feature } } }
 pageintrotext { pageIntroText }
 servicesServiceDetails { services { title description featuredService icon { ${M} } image { ${M} } } }`;
const PROJ = `databaseId slug title featuredImage { ${M} } projectsProjectData { projectData { projectSubtitle projectDescription projectUrl challenges { item } solutions { item } results { item } } images { footNote ismobilescreenshot image { ${M} } } }`;
const q = `{ pages(first:100, where:{language:"en"}){ nodes { ${PAGE} } } projects(first:100, where:{language:"en"}){ nodes { ${PROJ} } } }`;
const r = await post(q);
if (r.errors) { console.log(JSON.stringify(r.errors)); process.exit(1); }
r.data.pages.nodes.sort((a, b) => a.databaseId - b.databaseId);
r.data.projects.nodes.sort((a, b) => a.databaseId - b.databaseId);
const s = JSON.stringify(r.data);
console.log("pages", r.data.pages.nodes.length, "projects", r.data.projects.nodes.length, "bytes", s.length,
  "sha256", createHash("sha256").update(s).digest("hex"));
const home = r.data.pages.nodes.find((p) => p.slug === "home");
console.log("home sha256", createHash("sha256").update(JSON.stringify(home)).digest("hex"));
```
