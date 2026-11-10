# Report — Privacy route `/privacy-policy` in EN / FR-CA / ES (D-L)

- Spec: `docs/specs/privacy-route.md` rev 1.2 (Approved 2026-11-04)
- Branch: `feat/privacy-route` (from `master` @ `076d92c`)
- Author: Dev · Date: 2026-11-10 (implementation moved from Thu 11-12 to Tue 11-10 by Mauricio)
- Mid-phase checkpoint: approved by Mauricio 2026-11-10, with notes (FR date lines fixed in WP, footer-line source,
  H1 spacing fix). Every note is handled below.

## Result
**Done (local).** `/privacy-policy`, `/fr/privacy-policy` and `/es/privacy-policy` render the local WP pages (one per
language, through WPML). The footer links to the page in every locale, `meta.privacy` is set ×3, and the sitemap
lists the route. The v2 restore patch exists and has been checked.
- Gate: lint 88 / 94 (= baseline), typecheck passes, 682 / 682 tests pass, and `agent:build` passes with
  `ENABLED_LOCALES=en,fr,es` and no override.
- AC-1 … AC-14 are met locally (table below). AC-15 / AC-16 are Mauricio's launch items.

## Changes
- `src/app/[locale]/privacy-policy/types.ts` (new): `PrivacyPageResponse` (GraphQL shape) and `PrivacyPageData`
  (`{ title, html }`).
- `src/app/[locale]/privacy-policy/api.ts` (new):
  - `PRIVACY_PAGE_QUERY` uses `pages(first: 1, where: { language: $language, name: "privacy-policy" }) { nodes { title content } }`
    (ADR 0004; no `page(id, URI)` / `pageBy`).
  - `mapPrivacyPage` returns null when there is no node or the content is empty or whitespace, and trims the title.
  - `getPrivacyPage(locale)` sends `wpLocaleVars(locale)`.
- `src/app/[locale]/privacy-policy/page.tsx` (new):
  - `generateMetadata` → `pageMetadata(t.meta.privacy)`.
  - Server page: null → `notFound()`. The WP title is the only `<h1>`; the body goes through `DOMPurify.sanitize`.
  - No `lang` attribute (the root `<html lang>` is already per locale), no Hero, no final CTA (D-P2 A).
- `src/app/[locale]/privacy-policy/api.test.ts` (new, 13 tests): query and variables per locale, a lock on the declared
  variables, null cases (AC-8), the mapper.
- `src/app/[locale]/privacy-policy/page.test.tsx` (new, 9 tests):
  - one H1 per locale (incl. "Politique de confidentialité"), H2, list and `mailto:`;
  - metadata = `meta.privacy` ×3, with no CMS call;
  - `<script>` and `onerror` stripped;
  - `notFound()` for a missing page and for empty content (AC-8).
- `src/styles/pages/privacy.scss` (new): document typography using existing variables and mixins only.
  - Width: `max-width: 40rem` (640 px) on the article, so the H1 and the body share one measure. Mauricio's measure fix,
    2026-11-10; it was `70ch`.
  - Spacing: H1 45 / 60 px below, H2 30 / 45 px above, paragraphs 20 / 25 px; the two date lines are grouped (5 px).
  - Lists: list items inherit the body font (the global `ul li` rule in `typography.scss` makes them `lg`).
  - Links: underlined `$primary-color-dark` with a 3 px focus outline.
- `src/components/organisms/Footer/index.tsx`:
  - The `<ul className="footer__links">` is always rendered: LinkedIn (only when the CMS URL is set, unchanged), then
    `<a href={localizePath('/privacy-policy', locale)} className="footer__link">{t.common.privacyPolicy}</a>`.
  - Plain `<a>` (Known debt D1); no new dictionary key; comments updated.
- `src/components/organisms/Footer/Footer.test.tsx`:
  - LinkedIn then Privacy per locale, with the href per locale; no `mailto:`; no "Privacy choices".
  - No LinkedIn URL → Privacy link only.
  - No CMS data → Privacy link, ×3 locales.
- `src/i18n/dictionaries/{en,fr,es}.ts`: `meta.privacy.{title,description}` only, verbatim from `637fba7` (EN :909 / :911,
  FR :1061 / :1063, ES :1065 / :1067).
- `src/i18n/dictionaries/en.test.ts`: two fingerprint lines with their export line refs.
- `src/i18n/dictionary.test.ts`: `PRIVACY_META` pins the six export lines and compares them through the existing
  `fromExport` helper. A later authorized re-export must re-pin them.
- `src/app/sitemap.xml/route.ts`: `'/privacy-policy'` added to both `staticPaths` arrays (D-P3 A).
- Outside the repo:
  - `~/Documents/projects/magneto/backups/privacy-route/footer-email-restore-v2.patch` (D-P5; v1 is kept).
  - Evidence in `…/backups/privacy-route/screenshots/` (41 PNG) and `…/backups/privacy-route/qa/` (A1 responses and
    QA JSON).

## Checkpoint notes (Mauricio, 2026-11-10) — handled
| Note | Outcome |
|---|---|
| FR date lines (only the labels bold) | Fixed in Notion FR and on local page 683 by the Senior Architect (12:16). Visible in `after-top-*-fr-privacy-policy.png`. No code change. |
| "Privacy choices" in §5 | **Recorded:** EN/FR/ES §5 is the GA version and says "…through the **Privacy choices** link in the footer". The control ships with 5f; if 5f isn't live at release, the pages must use §5 Version B (§7 item 5 below). |
| "Magneto MKTNG" | Registered business name confirmed by Mauricio. G-1 OK. |
| Footer line still EN on FR/ES | Source found (not a dictionary key). See Issues, I-1. Not fixed. |
| H1 needs more space; keep the dates grouped | Done in `privacy.scss` (spacing in the table below). Before/after at 375 and 1440 in Evidence. |
| Measure fix (follow-up, after the report): `max-width` ≈ 40rem, ~70 characters per line | Done: `70ch` → `40rem` in `privacy.scss`. Measured below (§AC-5). Gate re-run. |

**Spacing (computed styles, measured on the built page):**

| | 375 | 1440 |
|---|---|---|
| H1 margin-bottom | 45 px | 60 px |
| H2 margin-top | 30 px | 45 px |
| Paragraph gap | 20 px | 25 px |
| Gap between the two date lines | 5 px | 5 px |
| H1 gap ÷ paragraph gap | 2.25× | 2.4× |

- The H1 gap is larger than the space above every H2, at both widths.
- Root cause of the tight H1: it carried the `m-0` helper, which is `margin: 0 !important` (`helpers.scss:2`). The
  helper is removed from the H1; its margin is set in `privacy.scss`.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | **passed (88 errors / 94 warnings = baseline)** | `npm run lint` exits 1 on the pre-existing baseline (the Q-D1 report recorded 88 / 94; your limit was ≤ 88 / 94). No message in any new file. The 3 sitemap messages are pre-existing, on unchanged lines (`SITE_URL`/`buildCanonical` unused, `any` at :14). I did not re-measure lint at the start of the phase. |
| typecheck | passed | `npm run typecheck` → exit 0 |
| tests | passed | `npm test -- --run` → 46 files / 682 tests (privacy files: 22). Re-run after the report was drafted: 682 / 682. |
| gate re-run after the measure fix | passed | lint 88 / 94; typecheck exit 0; 682 / 682 tests; `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES= npm run agent:build` exit 0 |
| build | passed | `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES= npm run agent:build` → exit 0, 35 static pages including `/en|fr|es/privacy-policy` (● SSG, revalidate 1m) |
| visual (routes · viewports · locales) | passed | 3 privacy routes × 375 / 768 / 1440 (exact viewports through CDP device emulation); footer routes ×3 locales; EN AC-11 routes compared against a `master` build |

## Acceptance criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 Gate | Met | Gate table |
| AC-2 A1 evidence | Met | §A1 below |
| AC-3 200, one H1, `lang`, `<title>`/description = `meta.privacy` | Met | §AC-3 below |
| AC-4 H1 → H2, no skipped level; links distinct; focus; AA; `mailto:` | Met (see note) | The heading sequence is H1, then 11 × H2, with no H3, ×3 locales. Body links are `text-decoration-line: underline`, `rgb(55, 27, 151)` (#371B97 on white ≈ 11:1); body text is `$black` #171717 on white. The `mailto:` href is exact (3 per page). **Note:** the focus outline is verified from CSS (`:focus-visible` 3 px), not by keyboard. Opening a mail client from `mailto:` was not tested (headless). |
| AC-5 375 / 768 / 1440 × 3 locales, no horizontal scroll | Met | `scrollWidth === clientWidth` in all 9 cases, re-checked after the measure fix; `after-{375,768,1440}-*privacy-policy.png`. Line length in §AC-5 below. |
| AC-6 Footer on `/`, `/contact`, a project page ×3 locales | Met | §AC-6 below |
| AC-7 Contact form + booking modal links → 200 | Met | §AC-7 below |
| AC-8 404 | Met | Unit: `api.test.ts` (`nodes: []` → null), `page.test.tsx` (no page / empty content → `NEXT_HTTP_ERROR_FALLBACK;404`). curl with `ENABLED_LOCALES=en,fr`: `/es/privacy-policy 404`, `/privacy-policy 200`, `/fr/privacy-policy 200`. |
| AC-9 Sitemap has `/privacy-policy`; robots unchanged | Met | The sitemap gains exactly one `<loc>` against `master`; `robots.txt` is byte-identical to `master` |
| AC-10 No analytics hosts; no banner, no Privacy choices | Met | Network log on the 3 privacy routes and `/` (and every QA route): hosts are only `localhost`, `fonts.googleapis.com`, `fonts.gstatic.com` (Google Fonts, the disclosed exception). No consent element and no "Privacy choices" text. |
| AC-11 EN unchanged except the footer list | Met | §AC-11 below |
| AC-12 Guard | Met | The build passes with all 3 locales and `ALLOW_UNTRANSLATED_LOCALES` forced empty. `grep -n TODO fr.ts es.ts`: 0 lines, so no `meta.privacy` line has a TODO. |
| AC-13 Patch v2 + `git apply --check` | Met | §AC-13 below |
| AC-14 §7 D-L checklist in the report | Met | §Release checklist below |
| AC-15 / AC-16 | Mauricio (launch) | Not Dev items |

## Evidence

### A1 — local CMS query (2026-11-10, read-only, unauthenticated)
```graphql
{ pages(first:1, where:{language:"en"|"fr"|"es", name:"privacy-policy"}) { nodes { databaseId slug status title modified content } } }
```
| | databaseId | slug | status | title | modified | `content` | H1 / H2 / `<ul>` / `mailto:` |
|---|---|---|---|---|---|---|---|
| en | 681 | privacy-policy | publish | Privacy Policy | 2026-11-10T16:11:52 | string, 8 323 chars | 0 / 11 / 5 / 3 |
| fr | 683 | privacy-policy | publish | Politique de confidentialité | 2026-11-10T16:15:57 | string, 10 700 chars | 0 / 11 / 5 / 3 |
| es | 686 | privacy-policy | publish | Política de privacidad | 2026-11-10T16:20:11 | string, 9 670 chars | 0 / 11 / 5 / 3 |

- The first 200 chars of `content` (EN):
  `<p><strong>Effective date:</strong> 3 December 2026</p>\n<p><strong>Last updated:</strong> 3 December 2026</p>\n<p>Magneto Web Consulting is operated by Mauricio Bayuelo under the registered business na…`
- The FR `modified` above is from before the Senior Architect's 12:16 date-line fix.
- **A1 confirmed:** the body is in the post content, which WPGraphQL exposes as `Page.content` (rendered HTML).
- **Content scan:** none of the forbidden lines appear: no internal note, no "Publication gate", no SEO block, no
  checklist, no forward-looking §4 sentence. The scan's other hits are policy text: §5 "Privacy choices" (checkpoint
  note) and §7 "A detailed internal data-retention schedule…".
- Raw responses: `backups/privacy-route/qa/a1-{en,fr,es}.json`.

### AC-3 — curl and DOM (port 3100, `ENABLED_LOCALES=en,fr,es`)
| Route | Status | `<html lang>` | H1 (only one) | `<title>` |
|---|---|---|---|---|
| `/privacy-policy` | 200 | en | Privacy Policy | Privacy Policy \| Magneto Web Consulting |
| `/fr/privacy-policy` | 200 | fr-CA | Politique de confidentialité | Politique de confidentialité \| Magneto Web Consulting |
| `/es/privacy-policy` | 200 | es | Política de privacidad | Política de privacidad \| Magneto Web Consulting |

The meta description equals `meta.privacy.description` in each locale. Those values are locked to the export lines by
`dictionary.test.ts`.

### AC-5 — viewports and measure (after the `40rem` fix)
Method:
- Exact viewports through CDP device emulation.
- Characters per line are counted from each character's client rect, over the two intro paragraphs, excluding each
  paragraph's last line.

| Width | Body size | Measure | No horizontal scroll (`scrollWidth/clientWidth`) | Characters per line, avg (min–max): EN · FR · ES |
|---|---|---|---|---|
| 375 | 16 px | 345 px | 375/375 ×3 | 42 (38–47) · 42 (37–49) · 43 (38–47) |
| 768 | 16 px | 640 px | 768/768 ×3 | 81 (76–86) · 83 (81–86) · 84 (80–87) |
| 1440 | 17 px | 640 px | 1440/1440 ×3 | 76 (76–77) · 75 (69–84) · 75 (70–81) |

- With `70ch` the measure was 766 px at 1440. Characters per line were estimated at about 85–90 then; no measuring
  tool existed yet.
- At 768 the body is 16 px (the 17 px step starts at the 1024 px desktop breakpoint), so lines run about 82
  characters. That is above the ~70 target; see I-2.
- Data: `backups/privacy-route/qa/qa-privacy-measure.json`.

### AC-6 — footer (1440; LinkedIn URL set in the local CMS)
| Route | Footer links | `mailto:` | Privacy choices |
|---|---|---|---|
| `/`, `/contact`, `/projects/trepied-trepied-ca` | Mauricio Bayuelo on LinkedIn · **Privacy Policy → `/privacy-policy`** | none | none |
| `/fr`, `/fr/contact`, `/fr/projects/trepied-trepied-ca` | … sur LinkedIn · **Politique de confidentialité → `/fr/privacy-policy`** | none | none |
| `/es`, `/es/contact`, `/es/projects/trepied-trepied-ca` | … en LinkedIn · **Política de privacidad → `/es/privacy-policy`** | none | none |

The EN `/services`, `/packages`, `/projects` and `/about-magneto` pages show the same footer.

### AC-7 — Contact form and booking modal
- **Contact form:** each `/contact` page has a second privacy link (the form's), with the same localized href.
- **Booking modal:** opened with a click on the hero button on `/contact`, `/fr/contact` and `/es/contact` (no submit,
  no Calendly step). `dialog[open]` contains:
  - `Privacy Policy → /privacy-policy`
  - `Politique de confidentialité → /fr/privacy-policy`
  - `Política de privacidad → /es/privacy-policy`
- All three targets return 200.

### AC-11 — EN unchanged (branch vs `master` @ `076d92c`)
Method:
- `master` was extracted with `git archive` into the scratchpad (no worktree, no git state change), with the repo's
  `node_modules` and `.env.local` symlinked. `.env.local` was not opened.
- It was built with the same `ENABLED_LOCALES=en,fr,es` and served on 3100.
- The comparison covers the rendered `<body>` minus `<footer>`, scripts and build-hashed asset paths, plus the
  full-page height at 1440.

| Route | Body without footer | `<title>` | Page height | Footer links |
|---|---|---|---|---|
| `/` | identical | = | 3450 → 3450 | 1 → 2 |
| `/services` | identical | = | 4937 → 4937 | 1 → 2 |
| `/packages` | identical | = | 2626 → 2626 | 1 → 2 |
| `/projects` | identical | = | 1409 → 1409 | 1 → 2 |
| `/about-magneto` | identical | = | 2632 → 2632 | 1 → 2 |
| `/contact` | identical | = | 1962 → 1962 | 1 → 2 |
| `/projects/trepied-trepied-ca` | identical | = | 7355 → 7355 | 1 → 2 |

The footer diff is the added `<li><a href="/privacy-policy" class="footer__link">Privacy Policy</a></li>` only.
Screenshots: `before-1440-<route>.png` (master) and `after-1440-<route>.png` (branch).

### AC-13 — patch v2
- `footer-email-restore-v2.patch` (7 318 B, 6 files): restores the email link **on top of the new footer**
  (LinkedIn · Privacy Policy · `mailto:`).
  - Also adds `footer.email` ×3, the `en.test.ts` lock, and a matching `Footer.test.tsx`.
  - v1's `dictionary.test.ts` hunk is dropped: the `phase5a` list it targeted no longer exists since the Q-D1 fill.
- `git apply --check -v` on the branch working tree:
  ```
  Checking patch src/components/organisms/Footer/Footer.test.tsx...
  Checking patch src/components/organisms/Footer/index.tsx...
  Checking patch src/i18n/dictionaries/en.test.ts...
  Checking patch src/i18n/dictionaries/en.ts...
  Checking patch src/i18n/dictionaries/es.ts...
  Checking patch src/i18n/dictionaries/fr.ts...
  check-exit=0
  ```
- v1 for comparison: `patch failed: …Footer/index.tsx:4`, `…Footer.test.tsx:1`, `…fr.ts:39`, `…dictionary.test.ts:112`,
  exit 1 (as spec E13 predicted).
- Applied for real in a scratch copy equal to the branch (not in the repo): applied cleanly; Footer + i18n tests
  9 files / 239 tests pass; `tsc --noEmit` exit 0.
- **Re-run `git apply --check` after the branch is committed** (the spec asks for a clean checkout of the branch). The
  committed content is byte-identical to the working tree checked here.

### Screenshots (`~/Documents/projects/magneto/backups/privacy-route/screenshots/`)
- Checkpoint (AC-3, before the spacing fix), full page: `ac3-1440-{,fr-,es-}privacy-policy.png`.
- **Spacing before/after**, top of page: `before-top-{375,1440}-*privacy-policy.png` → `after-top-{375,1440}-*privacy-policy.png`
  (375 shots use an exact-width iframe). The `after-*` shots were retaken after the `40rem` measure fix (12:56), so
  they show both fixes.
- AC-5 full page, after the measure fix: `after-{375,768,1440}-{,fr-,es-}privacy-policy.png`.
- AC-11: `before-1440-{home,services,packages,projects,about-magneto,contact,projects-trepied-trepied-ca}.png` (master) and the
  matching `after-1440-*.png`.

## Release checklist — D-L (replaces the 5b report entry, `phase-5b-services-packages-seo.md:590-591`)
This is the §7 check, copied for the release-day runbook. **Keep the email-less footer iff**, on the deployment to be
promoted, with the production `ENABLED_LOCALES`, for every enabled locale L:
- [ ] 1. `GET {L-prefix}/privacy-policy` → **200**; `<html lang>` = `en` / `fr-CA` / `es`; the H1 in L.
- [ ] 2. §1 shows the Privacy Officer **Mauricio Bayuelo** and a working `mailto:contact@magnetomarketing.co`. The
  effective / last-updated dates are the approved G-3 dates (`637fba7`: 3 December 2026). **A 12-10 launch needs
  Mauricio's explicit re-verification of the effective date** and any canonical / published update.
- [ ] 3. The body is the **final** text for L: G-1…G-7 applied (G-8 for ES). No internal note, no "Publication gate"
  line, no forward-looking §4 sentence.
- [ ] 4. The footer on `/`, `/contact` and one project page in L shows the Privacy link to that 200 page. The Contact
  form and booking-modal privacy links resolve to the same page.
- [ ] 5. No request to `googletagmanager.com`, `google-analytics.com`, `analytics.google.com` or `doubleclick.net`
  (incl. subdomains) before Accept (clean profile, network log; Google Fonts is the disclosed exception). Then either:
  - **5f live** (the build contains 5f **and** `NEXT_PUBLIC_GA_ID`): "Privacy choices" is in the footer in L and works
    (reopens the banner; Accept loads, Reject never loads), and §5 is the GA version; or
  - **5f not live:** no banner, no "Privacy choices", and the page in L uses **§5 Version B** (with its §2 / §3 / §4
    edits).
  - Record the deployment ID / commit, build target, effective GA ID and debug behaviour (5f §9 / AC-L1…L6). A mismatch
    (GA on + Version B, or GA off + GA §5) fails this item. **Today's local pages carry the GA §5** (checkpoint note).
- [ ] 6. Only if the deployment includes 5e (Brevo): the published G-4b block is in the body in L, and the lead magnet is
  not live in any locale whose page lacks it.

**If an item fails for L (D-P4 A):** don't launch L (FR/ES → Plan B; EN → the 12-10 fallback). Option B (launch with the
email restored) needs an explicit decision by Mauricio and applies
`backups/privacy-route/footer-email-restore-v2.patch` (`git apply --check` first). v1 no longer applies.

**Production prerequisites (Mauricio):**
- W-0…W-3 in production after a backup, pasted from final Notion, before the PR's Vercel preview check (R-8 / D-P8).
- O-1: check whether the CMS domain exposes the pages.

## Deviations from the spec
1. **The query declares only `$language`.** Spec §1 said "if `wpLocaleVars` also declares `$mediaOriginal`, follow
   about-magneto". WPGraphQL rejects a declared-but-unused variable:
   `Variable "$mediaOriginal" is never used in operation "GetPrivacyPage"` failed the first build. The query now
   declares only `$language` and still receives `wpLocaleVars` (the extra variable is ignored), as `AboutSection/api.ts`
   does. A test locks it.
2. **Spacing values come from Mauricio's checkpoint instruction** (2026-11-10), beyond the spec's "spacing for h2, h3,
   p": H1 45 / 60, paragraphs 20 / 25, dates grouped.
   - The date grouping uses `.privacy-policy__body > p:first-child`, so it depends on the content contract ("the body
     starts with the two date lines").
   - The H1 no longer uses the `m-0` helper.
3. **Evidence stored outside the repo next to the patch.** `backups/privacy-route/screenshots/` and `…/qa/` are not
   named in the spec, which only names the patch path. This follows the 5b precedent
   (`backups/phase-5b/screenshots/`).
4. **Measure is `40rem`, not the spec's "≈ 70ch"**, by Mauricio's instruction (2026-11-10): `70ch` gave about 85–90
   characters per line in DM Sans.
5. **No start-of-phase lint measurement** (AC-1 asks to record it). I used your 88 / 94 baseline from the Q-D1 report;
   the end-of-phase count is 88 / 94.

## Issues found (not fixed)
- **I-1. FR/ES footer line is the legacy EN string (5c-rest item).**
  - Source: the ACF field `homeFooter.footerLine2` (group "home footer"; field key `field_68b33adfb508b`;
    `wpml_cf_preferences: 2` = Translate, per `docs/acf/phase-5-field-groups.json:387-398`).
  - It is read by `Footer/api.ts` (`HOME_FOOTER_QUERY`, `pages(where: {language, name: "home"}) { homeFooter { footerLine2 } }`).
    It is **not a dictionary key**, so PR #33 couldn't change it.
  - Local values today:

    | Locale | Page | Current value | Approved copy |
    |---|---|---|---|
    | EN | 2 | "Based in Montreal · Available in English, French & Spanish" (set by `scripts/phase-5a/local-fixtures.php:135`) | — |
    | FR | 535 | "Based in Montreal \| Serving clients worldwide" (V0 legacy) | `magneto-copy-fr-CA.md:137` "Établi à Montréal · Services offerts en français, en anglais et en espagnol" |
    | ES | 536 | "Based in Montreal \| Serving clients worldwide" (V0 legacy) | `magneto-copy-es.md:143` "Con sede en Montreal · Atención en español, francés e inglés" |

  - Already listed as deferred to 5c-rest in `phase-5c-loader.md` E14 (:236 / :242). The loader content does not
    include it today: `scripts/phase-5c/content/*.json` has no `footerLine2`.
  - 5c-rest must add `home.homeFooter.footerLine2` for FR/ES, and production EN needs the new line too (the EN value
    above is a local fixture).
- **I-2. Readable measure: fixed at 1440, tablet still ~82 characters.**
  - Fixed after the report: `max-width: 70ch` (766 px at 1440, about 85–90 characters per line; DM Sans's "0" is wide)
    → `40rem`.
  - Now: about 75 characters per line at 1440 and about 42 at 375.
  - Left as is: at 768 the body is still 16 px in the same 640 px, so lines average about 82 characters. If wanted, a
    tablet-only `max-width` (e.g. `36rem`) or the 17 px size from 601 px. Not changed (Mauricio: nothing else changes).
- **I-3. WP titles are rendered as returned**, like `ProjectDetail` (spec §1 allows it).
  - The three current titles have no HTML entities.
  - A future title with an apostrophe (WP's `wptexturize` gives `&#8217;`) would show the entity literally in the H1.
    Fix later with a small decode helper if needed.
- **I-4. `[FR TEST]` / `[ES TEST]` Trépied titles** on `/fr|es/projects/trepied-trepied-ca` (local FR 550 / ES 541):
  known 5c-rest item (5c E14). Seen during AC-6.
- **I-5. Tooling note.**
  - `.next` lost its production build mid-session (12:0x): `next start` → "Could not find a production build". Probably
    another process using the checkout. I rebuilt, with no impact.
  - Headless Chrome's `--window-size=375` lays the page out wider than 375 (minimum window width). The 375 evidence uses
    an exact-width iframe or CDP device emulation instead.

## Proposed commits
`meta.privacy` must exist before the route compiles, so the dictionary commit comes first. The one-line commands are
below; nothing is staged.

1. `feat(i18n): meta.privacy EN/FR/ES verbatim from export 637fba7`
   Files: `src/i18n/dictionaries/{en,fr,es}.ts`, `src/i18n/dictionaries/en.test.ts`, `src/i18n/dictionary.test.ts`
2. `feat(privacy): /privacy-policy route from the WP page per locale (D-L)`
   Files: `src/app/[locale]/privacy-policy/*`, `src/styles/pages/privacy.scss`
3. `feat(footer): Privacy Policy link in every locale`
   Files: `src/components/organisms/Footer/{index.tsx,Footer.test.tsx}`
4. `feat(seo): add /privacy-policy to the sitemap`
   Files: `src/app/sitemap.xml/route.ts`
5. `docs(report): privacy route report with D-L release checklist`
   Files: `docs/reports/privacy-route.md`

## Time
- Agent active: ≈ 2 h 45 (estimated).
  - Route + tests ≈ 30 min (09:40–10:10).
  - Checkpoint verification ≈ 45 min (after Local was restarted).
  - Post-go ≈ 1 h 30 (footer, meta, sitemap, spacing, QA matrix, AC-11 `master` comparison, patch v2, report;
    ~12:00–13:00 plus the report).
- Waiting: Local not running ≈ 1 h; checkpoint review (unknown).
- Mauricio: W-0…W-3 local pages + backups (11:08 / 11:12 dumps), checkpoint review (unknown).
