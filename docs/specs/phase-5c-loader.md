# Phase 5c (part 1) — Content loader, local EN: Services, Packages, heroes

- **Status: Draft** (rev 2). **Approved together with `phase-5b-services-packages-seo.md` rev 4 in one review**; no
  separate loader review cycle. Its run is reviewed at the combined 5b + loader checkpoint (5b §7, Part 1 step 7).
- Author: Architect · Reviewed by: Mauricio + Senior Architect · **Run by: Mauricio** (agents never write to WordPress)
- Date: 2026-10-28 · Branch: `feat/phase-5b` (built during 5b Part 1).
- Depends on: ADR 0006 decision 4 (release-day load with dry-run, before/after export, read-back), the 5a fixtures
  script (`scripts/phase-5a/local-fixtures.php`, the pattern reused here), 5a report F-1..F-3 and I-1.

## Revision
**Rev 2 (2026-10-28, R1 trim):** review merged into the 5b rev 4 review; the dry-run is checked by Mauricio against
expected totals the Dev provides (no extra Dev review round); the run is reported at the combined checkpoint. Scope,
guards, backup, dry-run, read-back and the FR/ES no-change probe are **unchanged** (production safety). EN only, as before.

## Why a separate file (trade-off)
- **Chosen: own spec.** The loader outlives 5b: 5c extends it (Home/About/cases/testimonials/order/footer) and adds a
  production mode for release day. Those revisions edit one document with its own ACs, and the data-write rules stay
  apart from UI review.
- Cost: one more document to read (≈ 15 min) within the same review; 5b's state N points to another file.
- Rejected: a section in 5b — 5c would extend a section buried in a UI spec.

## Goal
One idempotent WP-CLI script, run by Mauricio on **local only**, writes the approved EN copy for Services, Packages and
the page heroes, prints a dry-run diff first and reads back every written value. Its output is 5b's state N. It
supersedes `local-fixtures.php` for these fields (that script stays as it is; it doesn't touch them).

## Evidence (read-only, 2026-10-27; re-verify at Dev entry)
- Pattern (`scripts/phase-5a/local-fixtures.php`): `home_url()` guard (`:24-27`), EN post check by ID + type + slug +
  language (`:35-49`), write list, `dry-run` arg (`:32`), writes by **field key** (`:208`), raw read-back by key
  (`:213-232`), FR/ES Copy-meta probe (`:183-193`). Result in the 5a report: 55/55 written and read back.
- ACF keys (`docs/acf/phase-5-field-groups.json`, after 5b S1):
  - `heroContent` (all pages): `hero_title` `field_689a2d9a6031f`, `subtitle_hero` `field_689a2dbb60320`,
    `cta_text_hero` `field_689a2e0960321`, new `hero_cta_path` `field_p5_herocontent_hero_cta_path`.
  - `pageIntroText` (pages 34/36/38): `pageintrotext` `field_68cb1f8940e08`, `intro_body_html`
    `field_p5_pageintrotext_intro_body_html`.
  - `Services - Service Details` (34): `core_heading`, `supporting_heading`, `supporting_intro`
    (`field_p5_servicesservicedetails_*`), repeater `services` `field_689a5f0dc2a9b` (pref 1); rows: `title`
    `field_689a5f28c2a9c`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id`, `service_group` (select,
    pref 1) — `field_p5_servicesservicedetails_services_*`; legacy `featured_service`, `Image`, `icon`, `description`.
  - `Packages - Package Features` (36): repeater `packages_elements` `field_689a4b0bfdf48` (pref 1); rows: `name`
    `field_689a4b21fdf49`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id`
    (`field_p5_packagespackagefeatures_packages_elements_*`); legacy `price`, `description`, `Popular_Choise`, `icon`,
    `features[]`.
  - `Packages - Content Sections` (36): repeater `sections` `field_p5_packagescontentsections_sections`, rows `heading`,
    `body_html`.
- Local EN row counts: services 7, packages 3, content sections 0 (5b E1/E4). The copy needs 7 / 3 / 2.
- Repeaters are Copy (pref 1): row counts are shared across languages only on a WPML translation save, not through
  `update_field` (ADR 0006; 5a fixtures probe: FR/ES counts unchanged).

## Design
**Files:**
- `scripts/phase-5c/load-content.php` — the loader (`wp eval-file`).
- `scripts/phase-5c/content/en.json` — the transcription: the only place the copy is turned into field values.
- `scripts/phase-5c/content.test.ts` — Vitest: verbatim check of `en.json` against the source (runs in `npm test`).

**Content file** (`en.json`): `{ "source": { "file": "docs/content/magneto-copy-en.md", "sha256": "…" }, "posts":
[ { "type": "page", "slug": "services", "lang": "en", "fields": [ { "key", "label", "src", "value" } ] } ] }`.
- `label` = GraphQL path for humans (`heroContent.heroTitle`), `src` = source line(s).
- Repeaters: `value` is an array of rows keyed by **sub-field key**, only the sub-fields this loader writes.
- Values verbatim. Markdown → HTML for `wysiwyg` fields only (`**x**` → `<strong>`, paragraphs → `<p>`, `- ` lists →
  `<ul><li>`, `####` inside a body → `<h3>`); `text` fields get plain text (bold markers removed). Packages
  `subtitle_hero` = the two paragraphs joined by `\n\n` (5b §5.2; A3 there).
- The Dev may generate the first version with a script (the 5b WIP `build-fixtures.mjs` is a candidate), but the
  committed artifact is the JSON, reviewed against the source.

**Scope of writes (EN only):**
| Post | Fields |
|---|---|
| `services` | Hero title + subtitle (+ `cta_text_hero` "Book a Strategy Call"); `pageintrotext` + `intro_body_html`; `core_heading`, `supporting_heading`, `supporting_intro`; 7 rows: `title`, `heading`, `description_html`, `cta_text`, `cta_path`, `anchor_id`, `service_group` (BUILD/FIX/CARE `core` + anchors/CTAs; 4 rows `supporting`, empty CTA/anchor) |
| `packages` | Hero title, `subtitle_hero`, `cta_text_hero` "Tell me about your project" **and** `hero_cta_path` `/contact` (always together); `intro_body_html` (tax note); 3 rows: `name`, `heading`, `description_html`, `cta_text`, `cta_path` `/contact`, `anchor_id`; `sections` 2 rows |
| `home`, `about-magneto` | Hero title + subtitle (+ `cta_text_hero` "Book a Strategy Call") |
| `projects` | Hero title + subtitle = Home §4 heading + intro (CTA untouched: 5b Q1) |
| `contact` | Hero title + subtitle only (5b Q2) |
Not written: `cta_link_hero` (booking behavior is 5d-lite), legacy `description`/`price`/`features`/`featured_service`/
`Popular_Choise`, images/icons, final CTAs (5a fixtures already wrote them; 5c writes **all eight** `finalCtaSection`
names together, 5a F-1), FR/ES.

**Rules (unchanged from rev 1):**
1. **Local-only guard:** abort unless `untrailingslashit(home_url()) === 'http://magneto-cms-2.local'`. No flag
   overrides it in this revision; production mode is a later 5c revision with its own runbook.
2. **Backup guard:** a real run requires `backup=<path>`: an existing `.sql` file modified in the last 3 hours.
   `dry-run` doesn't need it.
3. **Preflight, before any write; any failure aborts with nothing written:** ACF active; every key exists
   (`acf_get_field`); each post resolved by `post_type` + `post_name` + WPML language `en` to exactly one ID (no
   hardcoded IDs); `source.sha256` equals the current source file; EN row counts: services = 7 and packages = 3 (equal
   to the content rows), sections = 0 or 2.
4. **Repeaters merge by index:** read the raw rows (`get_field($key, $id, false)`), overwrite only the sub-keys in the
   content file, keep every other sub-field (images, icons, legacy text, flags), write the whole repeater. The row count
   never changes, except `sections` (new group, 0 → 2).
5. **Dry-run** prints, per field: `post/lang label: <old> → <new>` (truncated), or `= unchanged`; totals
   `N changes, M unchanged`, and per-post totals. A second dry-run after a real run must print `0 changes`.
6. **Read-back** after writing: every written value, plus the carried-over repeater sub-fields, compared raw by key;
   `ok`/`FAIL` per line; exit non-zero on any FAIL. Then the FR/ES probe: row counts of `services`,
   `packages_elements`, `sections` on the FR/ES translations of 34/36, before vs after (expected unchanged).
7. No deletes, no post/title/slug/status changes, no options, no WPML calls.

**Expected totals (Dev, at hand-off).** With the dry-run command the Dev gives Mauricio the expected per-post field
counts computed from `en.json` (posts: services, packages, home, about-magneto, projects, contact). Mauricio runs the
real run **only if** the dry-run shows exactly these posts, no other field, and totals ≤ the expected counts (fields
already equal show as `unchanged`). Otherwise he stops and sends the output; that is the only extra loop.

**Run (Mauricio, Local "Open site shell", one command at a time):**
```bash
mkdir -p ~/Documents/projects/magneto/backups/phase-5b
wp db export ~/Documents/projects/magneto/backups/phase-5b/magneto-cms-2_loader-before_$(date +%Y%m%d-%H%M).sql
wp eval-file <repo>/scripts/phase-5c/load-content.php dry-run
wp eval-file <repo>/scripts/phase-5c/load-content.php backup=<the .sql file above>
wp cache flush
wp eval-file <repo>/scripts/phase-5c/load-content.php dry-run    # must print 0 changes
```
Rollback: `wp db import <that .sql file>` + `wp cache flush`. That export is also 5b's state C restore point.

## Files the Dev may touch
- `scripts/phase-5c/load-content.php`, `scripts/phase-5c/content/en.json`, `scripts/phase-5c/content.test.ts`.
- The loader section of `docs/reports/phase-5b-services-packages-seo.md`.
Anything else is out of scope.

## Out of scope
Production mode; FR/ES content; Home sections, About body, case studies, testimonials, `displayOrder`, footer,
final CTAs; `generalSettings`; orphan-meta cleanup; changes to `local-fixtures.php` or the ACF JSON.

## Acceptance criteria
- [ ] `content.test.ts`: every text value (tags stripped, entities decoded) appears verbatim in the source section named
  by `src`; `source.sha256` matches; 3 core + 4 supporting rows; anchors `build|fix|care`; CTA paths in their allowlists.
- [ ] Guards proven by the Dev without writing: the script source shows the guards run before any write, and a dry-run
  with a wrong `source.sha256` (scratch copy of the JSON) aborts in preflight.
- [ ] Expected totals handed to Mauricio with the dry-run command; his dry-run matches them (posts, fields, totals).
- [ ] Real run: all `ok`, exit 0; FR/ES probe unchanged; second dry-run `0 changes`.
- [ ] Read-only GraphQL check by the Dev (language + slug) of Services/Packages/heroes: values present, `HeroContent.
  ctaPath` = `/contact` on Packages only; legacy images still resolve.
- [ ] Backup file name and output tail recorded in the 5b report; reviewed at the combined checkpoint.

## Decisions needed
None beyond 5b Q1/Q2. Production mode (guard design, IDs, row-count rules with real production data) is decided in the
5c-rest spec with the release-day runbook.

## Estimate
| Task | Dev (agent) | Mauricio |
|---|---:|---:|
| `en.json` transcription (Services, Packages, 6 heroes) + review against source | 3–4 h | — |
| `load-content.php` (guards, preflight, merge, dry-run, read-back, probe) | 2–3 h | — |
| `content.test.ts` | 0.5–1 h | — |
| Expected totals, run support, read-back check | 0.5 h | 30–40 min (dry-run check + run) |
| **Total** | **6–8.5 h** (≈ 6–8 h in 5b §10) | **30–40 min** |
