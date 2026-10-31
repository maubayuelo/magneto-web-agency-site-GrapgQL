# Phase 5b — Services, Packages, per-page SEO metadata and shared UI fixes

- **Status: Approved** (Senior Architect + Mauricio, 2026-10-31) — rev 9. Authorizes 5b Part 1 (with loader rev 2 and
  the §5.4 override).
- Author: Architect (Codex, rev 1–2; Claude, rev 3–9) · Reviewed by: Mauricio + Senior Architect · Date: 2026-10-31.
- Branch: **`feat/phase-5b`** = `master` @ `da68874` (5a merged, PR #22) + `f489d1b` (this spec rev 4, loader rev 2, S1
  report) + `01ff73f` (P-1 re-export of the three copy files). 5a is merged but **not promoted**: the production
  frontend still serves the pre-5a site.
- Depends on: [5a spec](phase-5a-structure-shared-home-about-cases.md) (Approved, merged), [ADR 0006](../adr/0006-phase-5-content-model.md)
  (Accepted, amendment 1), [5a report](../reports/phase-5a-structure-shared-home-about-cases.md),
  [S1 report](../reports/phase-5b-s1-acf-amendment.md), [production ACF runbook report](../reports/phase-5a-production-acf-runbook.md)
  (I-1…I-7), and the loader spec [phase-5c-loader.md](phase-5c-loader.md) rev 2, **approved together with this spec in
  one review**. §5.4 overrides two loader rev 2 values until the loader spec is revised (rev 3).
- Canonical content: [EN export](../content/magneto-copy-en.md), [FR-CA](../content/magneto-copy-fr-CA.md),
  [ES](../content/magneto-copy-es.md) **as of `01ff73f` (exported 2026-10-31)**; Notion stays canonical. Every
  `docs/content` line number in this spec refers to `01ff73f`; section titles govern if a later export moves them. The
  [gap analysis](phase-5-gap-analysis.md) is background only.
- **Release: ONE trilingual launch (EN/FR/ES), target ≈ Thu 2026-12-10** (Mauricio, 2026-10-30; an estimate, §11).
  `ENABLED_LOCALES=en,fr,es` at launch, **with Plan B** (§11): EN + FR on 12-10 if ES is not ready by Fri 12-04.

## Revision
**Rev 9 (2026-10-31 — approval):** Status → **Approved** (Senior Architect + Mauricio, 2026-10-31). Decisions recorded:
**OQ-1** the 13 FR/ES translation posts are created in production **before** release day, in a separate session by
Mauricio, only after the 5c rev 3 checklist is validated locally (§11, "Other specs" 1 and 6); **OQ-2** Privacy page
required only in the locales enabled at launch (D-L wording in §5.5, AC-20, launch scope, Plan B); **OQ-3** (Senior
Architect) `/api/contact` must never subscribe anyone to Mailchimp — a 5d-lite requirement with its own acceptance
criterion ("Other specs" 2). The early-start section is superseded by approval. No other change.

**Rev 8 (2026-10-31 — P-1 done, Mauricio's decisions of 2026-10-31):**
1. **P-1 done.** Re-export committed as `01ff73f`. The Architect ran the diff check against `f489d1b` (new E17): changed
   lines EN 59 / FR-CA 47 / ES 193 as expected; every hunk is an expected P-1 change; no SEO title/description changed.
   All `docs/content` line references updated to `01ff73f` (E6, E7, E13, §5.4, §6, tests). The Dev's P-1 diff check at
   entry becomes a hash confirmation only.
2. **Q-P1 decided:** `/projects` SEO blocks now exist in EN/FR/ES → `meta.projects.*` uses them verbatim in all three
   languages. The B2 exception ("Projects - Magneto Marketing") is withdrawn (§6, AC-10, AC-12, AC-25).
3. **Q-D1 decided:** the Dev drafts the remaining FR/ES dictionary values from the FR/ES exports, Mauricio approves;
   done **after 5d-lite**. 5b still fills only its own keys (now 13 TODO keys per locale, E14).
4. **Q-QA decided:** FR/ES Services and Packages are checked in the launch QA after 5c, together with the Privacy pages
   in EN/FR/ES.
5. **Phase 7** (hreflang, canonical, `openGraph.locale`) does **not** block the launch; it ships right after (§11).
6. **Contact form:** the 6-field Project Inquiry form ships **at launch** in EN/FR/ES; the reduced-form exception
   (rev 3 "Contact exception", old R1) is **cancelled**. 5d-lite scope, not 5b — recorded under "Other specs and docs"
   with an estimate; impact on 12-10 in §11.
7. **FR/ES translation posts (~13):** created by Mauricio in WPML admin from a checklist (local first, optionally with
   the assistant in his browser; production only by Mauricio on release day). No scripted post creation. Loader rev 3
   must define the checklist ("Other specs and docs" item 1).
8. **Plan B** added to §11: EN + FR on 12-10 with `ENABLED_LOCALES=en,fr` if ES isn't ready by 2026-12-04; ES enabled
   later by changing `ENABLED_LOCALES` (rebuild + promote).
9. **ES copy fix** (Dangel "el propietario", masculine) is in Notion and in `01ff73f` (ES 522, 546). No 5b impact.
10. Featured Services tablet **T1 stays provisional** until the visual review (unchanged).
11. New section **"Dev may start before final approval"** (five copy-independent items, gated by an explicit go).
12. E16 re-verified 2026-10-31, plus: no `privacy-policy` page exists locally in any language.

Rev 7 (2026-10-30): one trilingual launch (Q10); Q-R1 headers unchanged + new FR/ES main CTA label; Q-R2 FR/ES
metadata; T1 provisional; E16; §11 single track. Rev 6 (2026-10-30): Q-A1, Q-A3, Q-F (EN), option D, D-L, D-S, D-G6, Q9;
AC-24. Rev 5 (2026-10-30): main CTA label, footer, Law 25 coupling, I-5, I-6, fallback description. Rev 4 (2026-10-28),
still in force unless changed: combined 5b + loader checkpoint, four M unit-test groups, production safety, Hero CTA
rule (§5.3), anchors, metadata, gate and guard. Rev 3 / 3.1: B1 field (S1), state N = loader output, B2/B3, EN SEO pairs
approved as written, ES header "Reservar consulta".

## Goal
Services shows BUILD / FIX / CARE as the three core offers followed by four supporting capabilities. Packages shows the
three matching cards, then the Paid Website Diagnostic and the budgeting guidance; the Packages Hero CTA links to
Contact. Per-page metadata uses the exact approved copy **in EN, FR and ES**, including `/projects`. The main CTA reads
"Book a Free Strategy Call" / "Réserver un appel-conseil gratuit" / "Agendar una llamada de orientación gratuita"
wherever the frontend or the loader controls it, without overflow; the footer has no email link and one text size;
Packages and Projects cards sit in two columns at tablet width; Home Featured Services shows BUILD on its own row above
FIX + CARE. State C keeps working; state N matches the copy. Every 5b-owned surface is ready to run with
`ENABLED_LOCALES=en,fr,es` (and with `en,fr` under Plan B).

5b implements readers, presentation, dictionary and metadata. **Content replacement in production is 5c (release
day).** A successful local state N does not mean production is populated or that the launch is ready.

## Evidence
All `src` `file:line` references verified on `feat/phase-5b` on 2026-10-30 unless stated; `docs/content` lines on
`01ff73f` (2026-10-31).

**E1. Local CMS EN** (re-verified 2026-10-30, `http://magneto-cms-2.local/graphql`, read-only).
```graphql
{ s: pages(first:1, where:{language:"en", name:"services"}) { nodes {
    heroContent { ctaTextHero ctaPath } servicesServiceDetails { coreHeading services { title serviceGroup } } } }
  p: pages(first:1, where:{language:"en", name:"packages"}) { nodes {
    heroContent { ctaTextHero ctaPath } packagesPackageFeatures { packagesElements { name descriptionHtml } }
    packagesContentSections { sections { heading } } } }
  h: pages(first:1, where:{language:"en", name:"home"}) { nodes {
    heroContent { ctaTextHero ctaPath } finalCtaSection { ctaText ctaPath } } } }
```
```json
"s": { "heroContent": { "ctaTextHero": "Book a Free Strategy Call", "ctaPath": null }, "coreHeading": null,
       "services": [ 7 rows: "Sales Funnel Development" … "Ad Campaign Setup & Strategy", all "serviceGroup": null ] },
"p": { "heroContent": { "ctaTextHero": "Book a Free Strategy Call", "ctaPath": null },
       "packagesElements": [ "Funnel Launch", "Funnel + Website", "Growth Stack" — all "descriptionHtml": null ],
       "sections": null },
"h": { "heroContent": { "ctaTextHero": "Book a Free Strategy Call", "ctaPath": null },
       "finalCtaSection": { "ctaText": "Book a Strategy Call", "ctaPath": null } }
```
- `HeroContent.ctaPath` exists (S1), `null` everywhere → state C. Services 7 / Packages 3 / sections 0 rows.
- FR/ES `home`: `ctaTextHero` "Book a Free Strategy Call", `finalCtaSection.ctaText` "Get Your Free Strategy Call" — EN
  text inside the FR/ES translations.
- `generalSettings { title description }` → `"Magneto CMS"`, `""` locally.

**E2. Code** (re-verified on `master`):
- `Hero/HeroLoader.tsx:28`: `cta = ctaTextHero && ctaLinkHero ? { text, href } : undefined`.
- `Hero/HeroCTA.tsx:22-37`: href containing `calendly` → `CalendlyButton`; `:55-61`: other href → plain `<a href>`.
- `Hero/api.ts:9-35` `PAGE_HERO_QUERY` is shared by all six pages (production has `ctaPath`).
- `packages/page.tsx:15-21`: page data fetched before `HeroLoader` renders; `:24-29`: legacy intro via
  `dangerouslySetInnerHTML` without DOMPurify (D-S: fixed in 5b).
- `i18n/paths.ts:17-20` `localizePath('/contact','fr')` → `/fr/contact`.
- `vitest.config.ts`: default include → `scripts/**/*.test.ts` run in `npm test`.
- `styles/components/button.scss:18-37`: `.btn` is `inline-flex`, `overflow: hidden`, padding 15/30, sm bold; strategy
  CTAs add `typo-uppercase`. No `white-space` rule → text wraps, but content wider than the box is clipped silently.
- `i18n/config.ts:24-26`: `ENABLED_LOCALES` is read at build time; `.env.local.example:42` defaults to `en`.
- (2026-10-31) `dictionary.ts:44-63` `assertLocalesReady` checks **only enabled** non-EN locales;
  `[locale]/layout.tsx:135-137,149,166-167`: guard, `generateStaticParams` and `LanguageSwitcher` all use
  `getEnabledLocales()` → a disabled locale is neither built nor offered in the switcher (Plan B relies on this).

**E3. S0 and S1 done.** 5a merged (`da68874`); S1 (`58a9df1`, `8d2d313`) merged with it; S1 report: 13 → 14 groups,
Added 36 / Removed 0 / Changed 10, self-test 6/6, `HeroContent.ctaPath: String`. `phase-5-field-groups.json` sha256
`36ca235f…e842cd4`. The 5b WIP is in the outside-repo backup.

**E4. Facts kept from rev 2** (re-verified): `serviceGroup` is `[String]`; `PackagesGrid/index.tsx:19-23` forwards only
title/description/price/features/icon (legacy cards use the default label, `PackageCard/index.tsx:100`);
`services/page.tsx:75-83` metadata fetches a `WP_API` REST endpoint; case metadata uses the generic `meta.project.title`.

**E5. Production schema (closed).** Runbook rev 4 executed 2026-10-29 (38/38). Rev 4 lives on `spec/phase-5a-runbook`
@ `f45eba5`; `master` carries rev 2 (D-R).

**E6. Copy export `01ff73f` — line map** (title / description lines in parentheses).
| Block | EN | FR-CA | ES |
|---|---|---|---|
| Header CTA (unchanged) | 19 "Book a Strategy Call" | 19 "Réserver un appel-conseil" | 21 "Reservar consulta" |
| Main CTA, Home Hero | 27 | 27 | 29 |
| Main CTA, other occurrences | 127, 170, 243, 276, 415, 539, 577 (Contact secondary), 678 (modal heading), 969, 1080, 1215 | 109, 141, 202, 228, 359, 478, 559, 631, 703, 721 (Contact secondary), 812 + 857 (modal headings) | 121, 153, 214, 240, 371, 488, 571, 645, 719, 737 (Contact secondary), 828 + 873 (modal headings) |
| Footers (no email) | 135, 249, 423, 545, 648 | 115, 208, 367, 484, 792 | 127, 220, 379, 494, 808 |
| SEO Home | 139 (141 / 143) | 119 (121 / 123) | 131 (133 / 135) |
| **SEO `/projects` (new)** | 156 (158 / 160) | 125 (127 / 129) | 137 (139 / 141) |
| SEO About | 253 | 212 | 224 |
| SEO Services | 427 | 371 | 383 |
| SEO Packages | 549 | 488 | 498 |
| SEO Contact | 652 | 796 | 812 |
| SEO Dangel / Trépied / Shamanicca | 971 / 1082 / 1217 ("SEO — Final EN") | 561 / 633 / 705 | 573 / 647 / 721 |
| SEO Privacy (not 5b) | 835 | 1016 | 1026 (in the draft) |
| Home Featured Services structure line | 152 | — | — |
EN page SEO headings now read "SEO — Final (approved by Mauricio, 2026-10-27)". Body (title/description) of every SEO
block is byte-identical to `f489d1b` except the three new `/projects` blocks (E17).

**E7. Main CTA sources.**
| # | Surface | Source | Value today | Owner |
|---|---|---|---|---|
| 1 | Hero CTA: home, about, services, projects | CMS `heroContent.ctaTextHero` | EN "Book a Free Strategy Call" (also inside FR/ES home) | loader EN (5b, local); FR/ES and production: 5c |
| 2 | Final CTA strategy-call button | CMS `finalCtaSection.ctaText` / `secondaryCtaText` | local EN "Book a Strategy Call" (`local-fixtures.php:141-153`); production home "Get Your Free Strategy Call" | 5c-rest (all eight names together, 5a F-1) |
| 3 | Final CTA fallback | `common.bookStrategyCall` (`FinalCTASection/index.tsx:49`) | "Book a Strategy Call" | **5b** |
| 4 | About bottom CTA fallback | `common.bookStrategyCall` (`about-magneto/page.tsx:111`) | same | **5b** |
| 5 | Projects empty state | `common.bookStrategyCall` (`ProjectsGrid/index.tsx:39`) | same | **5b** |
| 6 | Package card default label (legacy) | `common.bookStrategyCall` (`PackageCard/index.tsx:100`) | same | **5b** |
| 7 | Contact Hero secondary (copy EN 577) | not built | — | **5d-lite** |
| 8 | Strategy-call modal heading (copy EN 678) | `emailModal.bookingTitle` | "Quick — before we book" | **5d-lite** |
| — | Header CTA | `header.scheduleCall` (`Header/index.tsx:129,139`) | EN/FR/ES as Q-R1 | **unchanged** |

Tests that pin labels: `en.test.ts:13`, `en.test.ts:24`, `dictionary.test.ts:58-64` (ES `bookStrategyCall` at `:61`),
`ProjectsGrid.test.tsx:23`. `en.test.ts:120` pins `meta.projects.title` (fingerprint; changes under Q-P1).

**E8. Footer** (`Footer/index.tsx:16-33`): LinkedIn (`:17-23`) and email `mailto:` (`:24-28`) in `<ul class=
"footer__links typo-md-medium">`; copyright `<p class="typo-md-medium">` (`:31-33`). `footer.email` in en/fr/es
(`fr.ts:42`, `es.ts:42`), `en.test.ts:36`, `dictionary.test.ts:109`. No Footer render test.

**E9. Footer font-size root cause.** Global `ul li { font-style(lg, medium, lg); margin-bottom }`
(`styles/typography.scss:320-328`) overrides the `<ul>`'s md: links render lg, copyright md.

**E10. I-5.** `PackageCard/index.tsx:136-145` + `PackageCard.scss:79-93`: the `<li>` inherits the global lg
line-height while the text is sm → the icon sits below the first line.

**E11. I-6.** Breakpoints phone 600 / tablet 601 / desktop 1024 (`variables.scss:41-43`). `PackagesGrid.scss:18-21`:
3 columns from 601 (`:1-4` stray block). `ProjectsGrid.scss:23-34`: 2 columns only at exactly 600 px (tablet query
declared twice); used by Home (`page.tsx:71`) and `/projects` (`projects/page.tsx:20`).

**E12. Home Featured Services** (`FeaturedServices.scss:41-56`): 1 column; 2 columns from 600 px (`sm` →
`media-phone-up`, `mixins.scss:24-28`); no span. CMS order BUILD, FIX, CARE (`FeaturedServices/index.tsx:19`).

**E13. Privacy.** No `privacy-policy` route, and (2026-10-31) no `privacy-policy` WP page locally in EN, FR or ES (E16
query). ADR 0006: WP page `privacy-policy` read through `content`. EN §1 (`magneto-copy-en.md:731-741`) names the
Privacy Officer and email; 871-879 require title + contact method and footer Privacy links; publication gated (715).
FR §1 at 914 (email). **ES draft now exported:** "POLÍTICA DE PRIVACIDAD — ES (BORRADOR)" at ES 912-1053, §1 at
926-932, gated like EN/FR (note at 916).

**E14. Dictionaries.** `fr.ts` 95 and `es.ts` 94 `[… TODO]` values (one key per line). Among them, 13 per locale are
5b keys: `meta.site.fallbackDescription` and `meta.{home,services,packages,projects,about,contact}.{title,description}`
(`fr.ts:154-180`, same in `es.ts`). `meta.project.title` (generic case title, no SEO source) stays TODO → Q-D1 step.
`common.bookStrategyCall` FR/ES are real values (old label, `fr.ts:7`, `es.ts:7`), not TODO. Expected after 5b:
**FR 82 / ES 81** (Dev measures). With `ENABLED_LOCALES=en,fr,es` and no override, `next build` fails until they are 0
(ADR 0005 guard, `dictionary.ts:59-63`). `meta.site.fallbackDescription` EN = old text (`en.ts:161`).

**E15. Dangel slug** (Mauricio): production post 270 = Dangel's case, slug `fashion-company-ecommerce` (same locally).

**E16. FR/ES translations in the local CMS** (2026-10-30, re-verified 2026-10-31).
```graphql
pages(first:1, where:{language:"fr"|"es", name:"services"|"packages"|"about-magneto"|"contact"|"projects"}) { nodes { databaseId slug status } }
pages(first:1, where:{language:"en"|"fr"|"es", name:"privacy-policy"}) { nodes { databaseId slug } }
projects(first:20, where:{language:"fr"|"es"}) { nodes { databaseId slug } }
```
```
fr: services [] · packages [] · about-magneto [] · contact [] · projects [558 publish]   projects: [550 trepied-trepied-ca]
es: services [] · packages [] · about-magneto [] · contact [] · projects []             projects: [541 trepied-trepied-ca]
privacy-policy: en [] · fr [] · es []                                                    (2026-10-31)
```
FR has `home` + `projects` pages and Trépied; ES has `home` and Trépied. FR/ES Services/Packages/About/Contact routes
`notFound()` today for lack of a translation. Dangel and Shamanicca have no FR/ES translation. Missing translation posts
= **13**: FR services, packages, about-magneto, contact (4); ES services, packages, about-magneto, contact, projects (5);
FR + ES Dangel and Shamanicca (4). The Privacy pages (EN original + FR/ES) are 3 more, owned by the Privacy spec.

**E17. P-1 diff check (Architect, 2026-10-31): `git diff f489d1b 01ff73f -- docs/content`.**
| File | +/− | Changed lines | Lines before → after |
|---|---|---:|---|
| `magneto-copy-en.md` | +33 / −26 | **59** | 1249 → 1256 |
| `magneto-copy-fr-CA.md` | +27 / −20 | **47** | 1101 → 1108 |
| `magneto-copy-es.md` | +171 / −22 | **193** | 951 → 1100 |
sha256 (full): EN `870b8573013427b3ba57afc3301d864f30c9ee32fb89363eeb243c265daee16d`, FR-CA
`9fc2ee334d7ba087289ed84f18cc58936dca2538ecd4bf27032dfcb1bc897408`, ES
`d5c3cb28d52b16520b526a67148e17bcdd497606bb2998a85ddad7e93e9ddecf`. Working tree = `01ff73f` for `docs/content`.

Every hunk classified — **no unexpected change**:
- **Header block** (all three): "last edited" / "Exported" lines replaced + one new "Method:" line (+1 line, shifts
  everything below by 1).
- **Main CTA label** (non-header): EN 13 lines (12 labels incl. Contact secondary 577 and modal heading 678, + the note at 663),
  FR 13 (incl. 721, 812, 857), ES 13 (incl. 737, 828, 873); full lists in E6. Totals reconcile exactly: EN −26 = 2 header
  + 13 CTA + 5 footer + 5 SEO heading + 1 line 152, +33 = the same + 1 Method line + 6 `/projects`; FR −20 / +27 and ES
  −22 / +171 likewise (ES adds 2 Dangel lines and the 142-line Privacy draft). Header lines EN 19 / FR 19 / ES 21 unchanged.
- **Footers:** email removed — EN 5, FR 5, ES 5. The email remains only in the Privacy sections (EN 741, 825; FR 914,
  1002; ES 932, 1016).
- **EN SEO headings:** 5 × "Draft" → "Final (approved by Mauricio, 2026-10-27)"; bodies identical (hash per block).
- **EN 152** (was 151, not 153 as rev 7 said): Featured Services line = option D wording.
- **New `/projects` SEO blocks:** EN 156-161 (own `##` section after the Home constraints), FR 125-130, ES 137-142 (both
  directly after the Home SEO block). Not listed in rev 7's expected set — added by Mauricio's Q-P1 decision; accepted.
- **ES Dangel:** "la propietaria" → "el propietario" (ES 522, 546).
- **ES Privacy draft:** +142 lines at ES 912-1053, incl. its own SEO block (1026).
- FR/ES SEO block bodies (title + description) unchanged; the FR "Accueil" / ES "Home ES" block hashes differ only
  because the inserted `/projects` heading now ends the block before the `---` separator (lines 121/123 FR, 133/135 ES
  byte-identical).
Observation (non-blocking, not public copy): ES internal checklist line 1078 still quotes « Agendar una llamada de
orientación » without "gratuita" (Notion tidy-up, Mauricio, optional). EN/FR "Strategy Call" / "appel-conseil" mentions
outside labels (privacy text, internal headings) are generic nouns, not the button label.

## Decisions recorded
| ID | Decision (Mauricio unless stated) | Date | Where |
|---|---|---|---|
| Q10 | One trilingual launch, ≈ 2026-12-10; `ENABLED_LOCALES=en,fr,es` | 10-30 | header, §11 |
| Q-A1 | New label on every strategy-call surface except the header | 10-30 | §5.4 |
| Q-R1 + Q-A2 | Headers unchanged (EN/FR/ES). Label: EN "Book a Free Strategy Call", FR "Réserver un appel-conseil gratuit", ES "Agendar una llamada de orientación gratuita" → as exported (E6) | 10-30 | §5.4, AC-24 |
| Q-A3 | Contact secondary CTA + modal heading use the label — 5d-lite | 10-30 | §5.4 handoff |
| Q-F / Q-R2 | Fallback description + FR/ES metadata from the SEO blocks | 10-30 | §6, AC-25 |
| Q-G | Option D; **tablet T1 provisional** (confirm at visual review) | 10-30, kept 10-31 | §5.7 |
| D-L | Email-less footer ships only with `/privacy-policy` live in **every locale enabled at launch** (EN + FR + ES; EN + FR under Plan B) | 10-30 (OQ-2 wording 10-31) | §5.5 |
| D-S | Sanitize the Packages legacy intro | 10-30 | §5.2 |
| D-G6 | Lone third card at 768 left-aligned | 10-30 | §5.6 |
| Q9 | Keep `fashion-company-ecommerce` in 5b; rename later | 10-30 | Backlog |
| P-1 | Notion edited + re-exported (`01ff73f`); diff checked (E17) | 10-31 | Preconditions |
| **Q-P1** | `/projects` SEO from the new EN/FR/ES blocks, verbatim; B2 withdrawn | 10-31 | §6 |
| **Q-D1** | Dev drafts remaining FR/ES dictionary values from the exports, Mauricio approves; after 5d-lite | 10-31 | Other specs 4 |
| **Q-QA** | FR/ES Services/Packages checked in the launch QA after 5c, with Privacy ×3 | 10-31 | §7, Other specs 5 |
| **Phase 7** | Not launch-blocking; ships right after launch | 10-31 | §11 |
| **Contact form** | 6-field form at launch in EN/FR/ES; reduced-form exception cancelled — 5d-lite | 10-31 | Other specs 2, §11 |
| **Translation posts** | ~13 FR/ES posts by Mauricio in WPML admin from a checklist; local first; no scripting. Production: see OQ-1 | 10-31 | Other specs 1 |
| **Plan B** | ES not ready by 12-04 → EN+FR on 12-10 (`ENABLED_LOCALES=en,fr`), ES later | 10-31 | §11 |
| **ES Dangel** | "el propietario" (masculine) — applied in Notion + export | 10-31 | E17 |
| **OQ-1** | The 13 FR/ES translation posts are created in **production before release day** (FR/ES stay disabled; allowed by ADR 0006 decision 4), in a separate session by Mauricio, only after the 5c rev 3 checklist has been validated locally | 10-31 | §11, Other specs 1, 6 |
| **OQ-2** | Privacy page required only in the locales enabled at launch: EN + FR under Plan B; EN + FR + ES otherwise | 10-31 | §5.5, AC-20, §11 |
| **OQ-3** (Senior Architect) | `/api/contact` stops subscribing anyone to Mailchimp (`contact.ts:129-136`); the contact form never subscribes to marketing email (approved privacy copy + CASL). Scope 5d-lite, not 5b | 10-31 | Other specs 2 |
| **Approval** | Spec approved (Senior Architect + Mauricio); early-start section superseded | 10-31 | header |

## Assumptions and open questions
- A3: a browser `<input type="text">` drops line breaks; saving Packages in WP admin would join the two `subtitleHero`
  paragraphs. Accepted; the 5c release-day runbook says "don't save Packages in admin". **Also applies to Mauricio's
  WPML translation-post checklist**: creating the FR/ES Packages translation must not re-save the EN original.
- A4: FR/ES `services`/`packages` translations do not exist locally (E16). The 5b readers must render a FR/ES
  state-C-shaped response without crash or EN fallback (unit tests with mocked responses) and `notFound()` when the
  translation is missing. Real FR/ES rendering is verified in the launch QA (Q-QA).
- A5 (new): Plan B needs no code: the guard, static params and language switcher only see enabled locales (E2,
  2026-10-31). To verify in the launch QA rehearsal with an `en,fr` build: `/es/*` → 404, no ES in the switcher, build
  passes with ES TODOs present.
- Q2 (rev 4, unchanged): Contact Hero scope in the loader = title + subtitle only.
- **OQ-1 — decided 2026-10-31:** production FR/ES translation posts before release day, separate Mauricio session,
  after local validation of the 5c rev 3 checklist (Decisions recorded).
- **OQ-2 — decided 2026-10-31:** Privacy page only in the locales enabled at launch (Decisions recorded).
- **OQ-3 — decided 2026-10-31 (Senior Architect):** no Mailchimp call from `/api/contact`; 5d-lite requirement
  (Decisions recorded, "Other specs" 2). Context: the approved privacy line says sending the form "does not subscribe
  you to marketing emails"; ADR 0002 forbids extending Mailchimp, not removing it.

## Decisions retained
- App Router pages; `src/pages/api/*` stay in Pages Router. `fetchWPGraphQL`, language + slug filters, EN-original
  media. No URI lookups, new CMS, new dependency or page builder.
- ADR 0006 expand/contract: additive fields, `new || legacy`, no retyping, no production content replacement before
  release day; `finalCtaSection` only written with all eight names together (title + subtitle included). FR/ES content
  may be loaded whenever ready (ADR 0006 decision 4) — locales are disabled in production until launch.
- Services core CTAs → `/packages#build|fix|care`; package card CTAs and the Packages Hero → `/contact`; all through
  `localizePath`. Home links → `/services#build|fix|care`.
- Per-page final CTAs, secondary buttons, whole-Home fallback and orphan protection unchanged. Lead magnet hidden.
  Header unchanged. Footer changes only as §5.5.
- Project order 10/20/40 (30 reserved). Projects index Hero = Home §4 via the loader.
- Visual identity, alternating Services rhythm and three-card Packages stay; I-5, I-6 and option D are in scope,
  redesign is not.
- ~~Contact exception (reduced form, 2026-10-27)~~ — **cancelled 2026-10-31**; the 6-field form ships at launch
  (5d-lite). 5b never touched the Contact form.

## Design

### Preconditions (before Part 1 step 3)
- **P-1 — done** (Notion edits 2026-10-30/31, re-export `01ff73f`, diff check E17 by the Architect).
- At Part 1 entry the Dev only confirms: `git diff --quiet 01ff73f -- docs/content` (exit 0) and the three sha256 of
  E17. Any mismatch → stop and report (a later export needs a new diff check and a spec line-map update).

### S0 — remaining step
At Part 1 entry the Dev re-applies the WIP from the outside-repo backup
onto `feat/phase-5b` as a starting point only. Record the WIP sha256s.

### S1 — done (E3, E5).

### 4. Data contracts
Unchanged from rev 4.

| Group | GraphQL | Presentation / fallback |
|---|---|---|
| `heroContent` | existing + `ctaPath` | §5.3 |
| `pageintrotext` | `pageIntroText`, `introBodyHtml` | Services: legacy heading kept, new body adds paragraphs. Packages: new body replaces the legacy intro block. |
| `servicesServiceDetails` | `coreHeading`, `supportingHeading`, `supportingIntro`, `services[]` | Optional headings; no hardcoded headings when empty. |
| `services[]` | legacy `title`, `description`, `featuredService`, `icon`, `image`; new `heading`, `descriptionHtml`, `ctaText`, `ctaPath`, `anchorId`, `serviceGroup: (string\|null)[]\|null` | Group = `serviceGroup?.[0]` → `core` / `supporting` / unclassified. Nonblank HTML replaces the legacy description; never both. |
| `packagesPackageFeatures.packagesElements[]` | legacy `name`, `description`, `price`, `popularChoise`, `icon`, `features[]`; new `heading`, `descriptionHtml`, `featuresTitle`, `ctaText`, `ctaPath`, `anchorId` | Rich body vs legacy body (§5.2). |
| `packagesContentSections.sections[]` | `heading`, `bodyHtml` | CMS order after the cards; empty rows omitted. |
| `finalCtaSection` | 5a contract | Unchanged. |

Typed view models in `types.ts`; editor-empty HTML counts as empty. Sanitize every new HTML fragment with
`isomorphic-dompurify`; CTAs only with nonblank text **and** an allowlisted path, localized once; anchors
`build`/`fix`/`care` only when valid and unique, with a sticky-header offset. Missing translation → `notFound()`; CMS
error ≠ missing translation; Services error state kept, dictionary-backed Packages one added. Empty repeaters → no
orphan headings or wrappers.

### 5. Page design and content mapping
**5.1 Services**: unchanged from rev 4.

**5.2 Packages**: unchanged from rev 4, plus §5.6 and **D-S**: the legacy intro passes through `isomorphic-dompurify`
after the existing `\n` → `<br />` transform. Unit test: `<script>` / `onerror` stripped; a plain two-line intro renders
the same `<br />` as today. Closes 1 of the 6 Known-debt `dangerouslySetInnerHTML` files (report it).

**5.3 Hero CTA (B1)**: unchanged from rev 4.

**5.4 Main CTA label (Q-A1, Q-R1)**
- Copy source: `01ff73f` (E6). Values are copied from it, never typed from this spec.
- `common.bookStrategyCall`: EN "Book a Free Strategy Call" (EN 27), FR "Réserver un appel-conseil gratuit" (FR 27), ES
  "Agendar una llamada de orientación gratuita" (ES 29). `header.scheduleCall` unchanged: EN "Book a Strategy Call"
  (EN 19), FR "Réserver un appel-conseil" (FR 19), ES "Reservar consulta" (ES 21).
- Tests: `en.test.ts:13` value → new label, comment → EN 27; `en.test.ts:24` unchanged (comment → EN 19);
  `dictionary.test.ts:58-64` — keep the three header assertions, update `:61` (ES), add FR `bookStrategyCall`, add
  `common.bookStrategyCall !== header.scheduleCall` per locale; `ProjectsGrid.test.tsx:23` → label from the EN dictionary.
- **Loader override (until loader rev 3):** `cta_text_hero` for `services`, `home`, `about-magneto` = "Book a Free
  Strategy Call"; `projects` also written. Packages keeps "Tell me about your project" + `/contact`; Contact unchanged
  (Q2); `cta_link_hero` never written. Locally already equal (E1) → dry-run `unchanged`.
- Not in 5b: final CTA CMS labels (5c-rest, all eight names); FR/ES CMS heroes and final CTAs (5c FR/ES).
- **Handoff to 5d-lite (Q-A3):** Contact Hero secondary = "Prefer to talk? " + label (EN 577, FR 721, ES 737) and modal
  heading = label (EN 678, FR 812/857, ES 828/873), in EN/FR/ES, reading `common.bookStrategyCall` (or a tested-equal
  key); AC-24 applies there.

**5.5 Footer and Privacy Officer contact (D-L)**
- `Footer/index.tsx`: remove the email `<li>`; keep LinkedIn (only when the CMS URL is set); no empty `<ul>`. Matches
  the exported footers (E6).
- Size: footer links take the copyright's typography (md), fixed at the footer scope, not the global `ul li` rule (E9).
- Dictionary: remove `footer.email` from en/fr/es, `en.test.ts:36` and `dictionary.test.ts:109`.
- **D-L mechanics:** the email removal is one self-contained commit (separate from the font-size fix). Release
  checklist item in the report: "`/privacy-policy` live **in every locale enabled at launch** (EN + FR + ES; EN + FR
  under Plan B — OQ-2) with §1 (Privacy Officer + email) and footer Privacy links → keep; otherwise revert the footer-email commit before
  promote." No legal copy by agents.

**5.6 Responsive fixes (I-5, I-6, D-G6)**: unchanged from rev 6 — I-5 CSS in `PackageCard.scss`; I-6 1 / 2 (601–1023) /
3 (≥ 1024) columns for Packages and Projects grids; lone third card left-aligned.

**5.7 Home Featured Services — option D (Q-G)**
- Desktop (≥ 1024): BUILD full width on row 1; FIX + CARE equal halves on row 2. Mobile (< 600): one column.
- **Tablet: T1 (provisional, confirm at visual review)** — same as desktop from 600 px: the first grid item spans all
  columns (`grid-column: 1 / -1`) at the existing `sm` breakpoint. T2 (stacked until 1024) stays the fallback if
  Mauricio rejects T1 at review.
- Positional rule (first item): relies on CMS order BUILD, FIX, CARE **in every language** (5c must keep it in FR/ES).
  No component/`ServiceCard` change; the Dev may cap the description measure of the first item inside
  `FeaturedServices.scss` if BUILD reads poorly at 1440; anything beyond → stop and report.
- Copy: EN 152 (option D wording, confirmed in E17). FR/ES exports have no equivalent structure line (EN governs).

### 6. Per-page metadata (EN/FR/ES)
Rev 4 rules kept (title + description + matching OG/Twitter, shared image/card/site defaults, helper, REST-override
removal, explicit case slug map incl. Dangel on `fashion-company-ecommerce`, locale's project resolved first, missing
translation → 404, unknown case → generic, no Phase 7 items). Values verbatim from `01ff73f` (line map E6):
- **EN:** Home, About, Services, Packages, Contact = the five "SEO — Final (approved …2026-10-27)" blocks; cases = the
  three "SEO — Final EN" blocks (971 / 1082 / 1217).
- **FR/ES (Q-R2):** `meta.home|about|services|packages|contact` and `meta.caseStudies.dangel|trepied|shamanicca` in
  `fr.ts`/`es.ts` = the FR/ES SEO blocks (E6) — title and description. No TODO for these keys.
- **`/projects` (Q-P1, new):** `meta.projects.title|description` = EN 158 / 160, FR 127 / 129, ES 139 / 141. Replaces
  the EN B2 value ("Projects - Magneto Marketing"); `en.test.ts:120` updated.
- **`meta.site.fallbackDescription`:** EN = EN 143 (Home meta description); FR = FR 123; ES = ES 135. Tests cite the
  source lines.
- `meta.project.title` (generic case title, no SEO source): EN unchanged; FR/ES stay TODO → Q-D1 step.
- The release-day runbook must check WP `generalSettings.description` (it wins over the fallback when set; WP options are
  not translated per language).

### 7. Verification states, tests and sequence
States C, N, M unchanged from rev 4. FR/ES:
- **Unit tests** (kept): per route, a mocked FR and ES state-C response renders without throwing and without EN strings
  from `en.json`; missing translation → `notFound()`.
- **FR/ES-enabled local build** (AC-15/24/25/26): command-local `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1`
  (never in `.env.local`), `next start -p 3100`, only when no other server uses the same `.next` (Mauricio stops his
  dev server for the window). One build serves AC-15, AC-24, AC-25 and AC-26.
- **FR/ES visual in 5b (AC-26):** the FR/ES routes that exist locally (E16): `/fr`, `/fr/projects`,
  `/fr/projects/trepied-trepied-ca`, `/es`, `/es/projects/trepied-trepied-ca` at 375/768/1440 — covers the shared
  surfaces 5b changes (footer, Featured Services option D, Projects grid where present, header label unchanged).
  `/fr|es/{services,packages,about-magneto,contact}` and `/es/projects` → 404 recorded as expected (E16), not a defect.
- Real FR/ES Services/Packages visual → launch QA (Q-QA, decided).

Additional unit tests (rev 5–8): Footer (LinkedIn when set, never `mailto:`, no empty `<ul>`); `FinalCTASection` empty
`ctaText` → locale's `common.bookStrategyCall` (EN/FR/ES); header renders `header.scheduleCall`; Packages legacy intro
sanitized; FR/ES metadata strings equal the dictionary values (route `generateMetadata` with locale `fr`/`es`, incl.
`/projects`).

**Part 1 — contracts, Services slice, loader**
1. Entry: P-1 hash confirmation (Preconditions); WIP re-applied (S0); hashes, branch,
   gate baseline, safety settings; introspection re-verified.
2. Typed queries/mappers; the four M groups and the FR/ES unit tests; §5.3 Hero rule + 5 tests; Services + anchors.
3. Loader per `phase-5c-loader.md` rev 2 with the §5.4 override: `en.json` (from `01ff73f`), `content.test.ts`,
   `load-content.php`, guard proofs, expected dry-run totals.
4. Capture Services + Packages **C** (EN 375/768/1440).
5. Mauricio: `wp db export` → dry-run → real run → `wp cache flush`; sends output tail + backup name.
6. Dev: read-back via GraphQL; capture Services **N** (EN 375/768/1440).
7. **Combined 5b + loader checkpoint — stop.**

**Part 2 — complete and verify:** Packages (I-5, I-6, D-S), main CTA EN/FR/ES (§5.4),
Footer (§5.5, two commits proposed), Projects grid, Featured Services option D, metadata EN/FR/ES (§6), FR/ES-enabled
build (AC-15/24/25/26), §8 acceptance, §9 QA, report. **Final review — stop.** No 5c production work, no staging or
commits.

## Dev may start before final approval
**No longer needed (rev 9):** the spec is approved, so ES-1…ES-5 (I-5, I-6 + D-G6, footer typography, Featured Services
option D, D-S) are simply part of Part 1/Part 2 under the normal sequence. The rev 8 table is withdrawn; S0 (WIP
re-apply) still comes first.

## Files the Dev may touch
- S0: the WIP files, only within the list below.
- `src/app/[locale]/services/{api.ts,api.test.ts,content.ts,types.ts,page.tsx,ServicesList.tsx,ServicesList.test.tsx,Services.scss}`;
- `src/app/[locale]/packages/{api.ts,api.test.ts,types.ts,page.tsx}` + scoped styles (incl. D-S);
- `src/components/molecules/PackageCard/{index.tsx,PackageCard.scss}` + types/tests (I-5: SCSS only);
- `src/components/organisms/PackagesGrid/{index.tsx,types.ts,PackagesGrid.scss}` + tests;
- one Packages-only content-sections component (index/types/scss/test) under `src/components/organisms/`;
- `src/components/organisms/Hero/{api.ts,api.test.ts,HeroLoader.tsx,index.tsx,Hero.scss,types.ts}` (§5.3 and the
  Packages paragraph split only; not `HeroCTA.tsx`);
- `src/components/organisms/Footer/{index.tsx,Footer.scss}` + new `Footer.test.tsx`;
- `src/components/organisms/ProjectsGrid/{ProjectsGrid.scss,ProjectsGrid.test.tsx}`;
- new `src/components/organisms/FinalCTASection/FinalCTASection.test.tsx` (fallback label only);
- `src/components/organisms/FeaturedServices/FeaturedServices.scss` (option D only);
- metadata parts only of `src/app/[locale]/{page.tsx,about-magneto/page.tsx,services/page.tsx,packages/page.tsx,contact/page.tsx,projects/page.tsx,projects/[slug]/page.tsx}`;
  optional `src/utils/page-metadata.ts` + test;
- `src/i18n/dictionaries/{en,fr,es}.ts` (only the keys of §5.4, §5.5, §6 — no other FR/ES TODO filled here, Q-D1),
  `en.test.ts`, `src/i18n/dictionary.test.ts` (incl. the done-keys lists for the FR/ES keys 5b fills);
- `scripts/phase-5c/*` as listed in `phase-5c-loader.md` (with the §5.4 override);
- `docs/reports/phase-5b-services-packages-seo.md`.
Anything else is out of scope (incl. `styles/typography.scss`, `styles/components/button.scss`, `HeroCTA.tsx`,
`Header/*`, `ServiceCard/*`, `ContactForm*`, `pages/api/*`, `docs/content/*`, `.env.local*`). If AC-24 fails, fix only
inside a listed component SCSS; a `button.scss` fix → stop and report with measurements.

## Out of scope
Contact form (6 fields)/API/consent, Contact secondary CTA and modal (5d-lite), Brevo, Privacy route (EN/FR/ES) and any
legal copy, new SEO copy, WP `generalSettings`, production imports or content writes, final CTA CMS labels and all FR/ES
CMS content (5c), **creating FR/ES translation posts** (Mauricio, 5c checklist), filling the remaining FR/ES dictionary
TODOs (Q-D1 step), deployment, `ENABLED_LOCALES` in Vercel, case-study bodies/media, Dangel slug rename (Backlog),
canonical/hreflang/sitemap/robots/OG locale (Phase 7, after launch), new artwork, 5a rework, `.env.local`,
staging/commits/pushes/merges.

## Acceptance criteria
| ID | Evidence |
|---|---|
| AC-1 | S0 recorded; at 5b end only listed files differ; index empty; no CMS/production writes by agents. |
| AC-2 | **Done** (S1 + runbook reports); re-checked locally at entry. |
| AC-3 | State C (EN): 7 legacy Services rows and 3 Packages cards with their text, media and CTAs (card label = new label); no badge; Hero output of all 6 pages unchanged (Hero test 5); 5a final CTAs unchanged except the fallback label. |
| AC-4 | State N Services (EN) matches every public heading/paragraph/list of §§1–9 in order: 3 core + 4 supporting, no legacy offer copy, no supporting price/CTA. |
| AC-5 | N links reach unique visible targets: Home → Services anchors; Services → Packages cards; cards and Packages Hero → `/contact`. Keyboard + sticky-header offset (EN). |
| AC-6 | N Packages: both Hero paragraphs, CTA "Tell me about your project" → `/contact`, tax note; 3 cards with all text, prices once, CTA labels. |
| AC-7 | Diagnostic below the cards with C$450; budget guidance after it; no fourth package, badge or internal prices. |
| AC-8 | The four M groups, the 5 Hero tests and the rev 5–8 unit tests pass. |
| AC-9 | Final CTAs, Home fallback/orphan handling unchanged; Contact has no final CTA; lead magnet absent. |
| AC-10 | EN metadata: 6 page pairs (incl. `/projects` = EN 158/160) + 3 case pairs match `01ff73f` in rendered title/description/OG/Twitter; fallback description = EN 143 (rendered on a route without its own description, e.g. unknown case, with WP tagline empty locally). |
| AC-11 | Case metadata by existing slug (`fashion-company-ecommerce` for Dangel) + locale; missing translation 404; unknown case generic. |
| AC-12 | EN fingerprint + parity pass; changed keys listed (metadata EN/FR/ES incl. `meta.projects`, `common.bookStrategyCall` EN/FR/ES, `footer.email` removed, fallback description EN/FR/ES); `header.scheduleCall` unchanged in EN/FR/ES; FR/ES TODO count decreases exactly by the 13 keys per locale 5b fills (report before/after; expected 95/94 → 82/81), guard effective. |
| AC-13 | §9 matrix: no clipping, overlap, horizontal scroll or unusable controls; screenshots; Mauricio's visual approval (incl. T1) pending until given. |
| AC-14 | lint (no new findings vs entry, no new `any`), typecheck, tests, build — each run and reported with counts. |
| AC-15 | EN build without override passes; EN/FR/ES build without override **fails** on the remaining TODOs (expected until the Q-D1 step) and passes with command-local `ALLOW_UNTRANSLATED_LOCALES=1`. |
| AC-16 | FR/ES unit tests of §7 pass (renders, no crash, no EN fallback; `notFound()` without translation). |
| AC-17 | Loader ACs met with the §5.4 override; combined checkpoint + final review recorded; no claim of launch readiness. |
| AC-18 | **Main CTA (EN):** "Book a Free Strategy Call" on the Hero of `/`, `/about-magneto`, `/services`, `/projects` (state N) and on the legacy Packages cards (state C); fallback and Projects empty state by unit test. Header "Book a Strategy Call" at 375 (menu) and 1440. `grep -rn "Book a Strategy Call" src --include=*.ts --include=*.tsx` → only `header.scheduleCall` in `en.ts` and its test lines. |
| AC-19 | **Footer (every §9 route, EN/FR/ES where the route exists):** no `footer a[href^="mailto:"]`; LinkedIn computed `font-size`/`line-height` = copyright's at 375 / 768 / 1440; focus visible; email removal is a separate proposed commit. |
| AC-20 | **D-L recorded** in the report's release checklist (Privacy page in every locale enabled at launch — EN/FR/ES, or EN/FR under Plan B (OQ-2) — or revert before promote). No legal copy by agents. |
| AC-21 | **I-5:** `/packages` at 375 and 768 (C and N): icon box within the first text line box of every multi-line feature; screenshots. |
| AC-22 | **I-6:** at 768, Packages (`/packages`) and Projects (`/`, `/projects`) grids have 2 tracks, third card at the first column's left edge; 1 column at 375; 3 at 1440; no horizontal scroll; screenshots. |
| AC-23 | **Option D:** `/` at 375 one column; at 768 (T1), 1024, 1440 BUILD spans the grid width and FIX + CARE share the next row (± 1 px); no clipping; screenshots at 375/768/1024/1440 (EN) and `/fr`, `/es` at 768/1440. |
| AC-24 | **Main CTA fit, EN/FR/ES at 375/768/1440.** Criteria for every measured `.btn`: `scrollWidth ≤ clientWidth`, rect inside the viewport and its container, label ≤ 2 lines (distinct line tops from a `Range` over the text). **EN (real):** the AC-18 buttons. **FR/ES in 5b (simulated):** no FR/ES page renders the label locally (E1, E16), so in the FR/ES-enabled build the Dev sets the text of the same EN buttons (Hero, legacy Packages card, final CTA) to the FR and ES labels from the dictionary via DevTools — local, read-only, no file change — and applies the criteria; recorded as "simulated". **FR/ES (real)** is re-run in the launch QA after 5c loads FR/ES content. |
| AC-25 | **FR/ES metadata (Q-R2, Q-P1):** unit tests — `generateMetadata` for `fr`/`es` on home/about/services/packages/contact/**projects** and the 3 cases returns title/description/OG/Twitter equal to the FR/ES SEO blocks of `01ff73f`; `fallbackDescription` FR/ES = FR 123 / ES 135. Rendered `<head>` checked on the FR/ES routes that exist locally (`/fr`, `/fr/projects`, `/es`, FR/ES Trépied). |
| AC-26 | **FR/ES visual (5b part):** the five FR/ES routes of §7 at 375/768/1440: footer (AC-19), Featured Services option D, Projects grid where present, header label unchanged; no EN fallback text introduced by 5b; screenshots. The FR/ES Services/Packages/About/Contact (and ES Projects) 404s are recorded as E16, not defects. |

Required regression tests (kept from rev 4) unchanged.

## 9. Responsive QA
| Surface | Coverage |
|---|---|
| `/services`, `/packages` | EN 375 / 768 / 1440, state C and N: grouping, cards (I-5, I-6), Diagnostic, final CTAs |
| Shared Hero regression | Home, About, Contact, Projects, EN 375 / 768 / 1440, state N (AC-18) |
| Home Featured Services | EN 375 / 768 / 1024 / 1440; FR/ES 768 / 1440 (AC-23) |
| Projects grid (I-6) | `/` and `/projects`, EN 375 / 768 / 1440 |
| Footer | every route above, EN; FR/ES routes of AC-26 |
| Header | one route per locale, 375 (menu) and 1440: label unchanged |
| Main CTA fit | AC-24 |
| FR/ES routes that exist | AC-26 |
| Cross-page links | Home → Services anchors; Services → Packages; Packages → Contact (EN, one width + keyboard) |
| Metadata | EN: 7 routes (incl. `/projects`) + 3 cases + 1 unknown case; FR/ES: AC-25 |
On Services/Packages/Footer/Featured Services: focus order, visible focus, Enter activation, names, 24×24 targets,
contrast, 200% zoom. Don't submit forms or complete bookings. Port 3100+, never a `.next` used by another server, stop
only own PIDs.

## Trilingual launch scope
| Item | Decision | Where |
|---|---|---|
| FR/ES visual verification | 5b: AC-24 (simulated FR/ES) + AC-26 (existing FR/ES routes). Services/Packages/About/Contact FR/ES + Privacy ×3: launch QA after 5c (Q-QA) | 5b, launch QA |
| FR/ES main CTA label | Decided (Q-R1), exported | 5b §5.4 |
| FR/ES metadata incl. fallback and `/projects` | From the FR/ES SEO blocks (Q-R2, Q-P1) | 5b §6 |
| FR/ES dictionaries (82/81 after 5b) | Must be 0 for every enabled locale before launch; Dev drafts, Mauricio approves, after 5d-lite (Q-D1) | Q-D1 step |
| FR/ES CMS content | Required; not 5b | 5c |
| FR/ES translation posts (13) | Mauricio, WPML admin, checklist in loader rev 3; local first; production **before release day** in a separate session, after local validation (OQ-1) | 5c |
| Contact 6-field form EN/FR/ES | At launch | 5d-lite |
| Privacy (D-L) | Privacy page in every locale enabled at launch (OQ-2; ES from the exported draft once final, required only if ES launches) | Privacy route spec |
| WPML production key / outbound access (3b O-1/O-2) | Required for FR/ES in production | release-day runbook |
| `ENABLED_LOCALES` in Vercel | `en,fr,es` (Plan B: `en,fr`) after the guard passes without override | release-day runbook |
| Phase 7 (hreflang, canonical, OG locale, per-locale sitemap) | **Not blocking**; right after launch | Phase 7 |

## Other specs and docs that must change (listed, not rewritten here)
1. **`docs/specs/phase-5c-loader.md` → rev 3:** the §5.4 override; FR/ES scope (`fr.json`/`es.json` transcribed from
   `01ff73f` with verbatim tests and sha256 pins); order of operations EN load → translation post → translation save
   (repeater row counts are Copy, ADR 0006) → FR/ES load; BUILD-first order in every language (§5.7); FR/ES probe
   semantics (FR/ES now targets); production mode for three languages; Plan B (an `en,fr` release must not depend on
   ES loads). **Translation-post checklist (Mauricio, WPML admin, no scripting)** — one row per post (13, E16), with:
   EN original (name + databaseId), target language, **slug** (same as EN for pages and the 4 cases, per ADR 0004 —
   incl. `fashion-company-ecommerce`), WPML link check (Translations metabox shows the EN original; GraphQL
   `pages|projects(where:{language,name})` returns it), status Publish, title (from the FR/ES export), **fields the
   loader fills afterwards** (listed per post so Mauricio leaves them empty: hero, intro, services/packages repeaters,
   content sections, final CTA, case bodies/SEO) and A3 ("don't re-save the EN Packages page"). Local run first (assistant
   may guide in Mauricio's browser). **Production (OQ-1):** only after the checklist has been validated locally (all 13
   rows pass the GraphQL link check), Mauricio runs the production rows in a **separate session before release day**
   (FR/ES disabled in production → invisible, ADR 0006 decision 4), with a fresh production backup first; agents never
   write to production. Release day then only verifies the 13 posts exist (read-only) before the FR/ES loads.
2. **5d-lite spec (not written) — scope widened 2026-10-31:** trilingual; Q-A3 label (Contact secondary CTA, modal
   headings); **6-field Project Inquiry form at launch** (EN 579-640 and the FR/ES equivalents): Name, Email, Website URL
   (optional), "What do you need help with?" (select, 4 options), message (textarea + helper), Approximate budget
   (select, 5 options + helper); submit label, supporting copy, privacy line with Privacy link, success message;
   `/api/contact` payload + server validation of the new fields + email body; **OQ-3 requirement (Senior Architect,
   2026-10-31): `/api/contact` makes no Mailchimp call — remove the subscribe step at `contact.ts:129-136`; the contact
   form never subscribes anyone to marketing email (approved privacy copy + CASL). Acceptance criterion: a unit test of
   the handler with Mailchimp env vars set shows no request to `*.api.mailchimp.com` (fetch mock not called with a
   Mailchimp URL) on a valid submit, and `grep -n -i mailchimp src/pages/api/contact.ts` → no match**; a11y
   (labels, error association, focus on error); dictionary keys EN/FR/ES filled verbatim from the exports in 5d-lite
   itself (not left to Q-D1). Today: 4 fields (`ContactForm.tsx:75-95`), Mailchimp subscribe in `contact.ts:129-136`.
   **Estimate of the form part: +7–10 h agent, +1.5–2.5 h Mauricio** (review ×3 languages; the only real-SMTP test is on
   a preview, by Mauricio) → 5d-lite total ≈ 12–17 h agent / 4.5–6.5 h Mauricio. Effect on 12-10: §11.
3. **Privacy route spec (not written):** `/privacy-policy` in EN/FR/ES (ES from the exported draft, ES 912-1053, once
   final), 3 WP pages (none exist locally, E16) — EN original + 2 translations, created by Mauricio like item 1; Privacy
   Officer + email (§1), footer "Privacy Policy" link (and "Privacy choices" only if analytics exists), D-L per locale enabled
   at launch (OQ-2), verification gates per launched locale; Plan B (ES page follows ES).
4. **FR/ES dictionary fill (Q-D1, decided):** short step after 5d-lite; Dev drafts every remaining FR/ES TODO from the
   exports ("no source" flagged), Mauricio approves; ends with the guard passing without override for `en,fr,es`.
5. **Launch QA (new or Phase 6 widened):** full route × EN/FR/ES × 375/768/1440 matrix incl. FR/ES Services/Packages
   and Privacy ×3 (Q-QA); real AC-24 on FR/ES heroes, final CTAs, Contact secondary and modal; Contact form ×3 (no
   submission locally unless `DISABLE_SMTP=1` confirmed); prerendered project paths per locale (AGENTS Known debt);
   FR/ES Dangel/Shamanicca present; a Plan B rehearsal build with `ENABLED_LOCALES=en,fr` (A5).
6. **Release-day runbook:** one run for three languages (EN rewrites + FR/ES loads; the 13 FR/ES posts already exist in
   production per OQ-1 — read-only presence check first), backups, dry-runs and
   read-back per language; WPML production key; WP tagline/title check; `ENABLED_LOCALES` in Vercel; preview check;
   go/no-go Tue 12-08 with the ES decision already taken on Fri 12-04 (Plan B branch: `en,fr`, skip ES loads or load
   them invisibly, D-L for EN + FR per OQ-2).
7. **Phase 7 spec:** after launch (decided); hreflang/canonical must list only enabled locales so Plan B and a later ES
   enablement need no code change.
8. **`docs/ai/HANDOFF.md`** (state as of 2026-10-26): R1/R2/R3 lines 62–64 (incl. "6-field Contact form" in R2),
   Privacy 76, sequence 102–107, the 11-20 date — obsolete.
9. **`docs/ai/WORKFLOW.md`:** "Launch" row (47, "EN → FR-CA → ES") and "Cleanup … after R3 (ES live)" (48).
10. **ADR 0006** wording (67, 138, 171, 189 mention R1/R3): no decision change; the cleanup phase runs "after the
    trilingual launch" (with Plan B: after ES is live). Senior Architect edits or annotates.
11. **`CLAUDE.md` "Current phase"** line (still Phase 4 closed / Phase 5 next).
12. **`docs/specs/phase-5a-production-acf-runbook.md`** on master = rev 2 (D-R).
13. **`docs/specs/phase-5-gap-analysis.md`** Contact row (420) and 5d row (593): background only, no edit required.

## Backlog (not 5b)
- **Dangel slug rename** (Q9): `fashion-company-ecommerce` → `dangel-wellness` + 301 from the old URL, at or after
  launch, own ADR, WPML FR/ES slugs included, plus the case-metadata slug map, sitemap and internal links.
- Notion copy-UX review of shorter CTA variants (a change = one dictionary value per locale + AC-24 re-run).
- Notion tidy-up: ES internal checklist line 1078 still quotes the old label (E17 observation).

## Decisions needed
- Early start, OQ-1, OQ-2, OQ-3: **decided 2026-10-31** (Decisions recorded).
- **T1** final confirmation (Mauricio, visual review).
- **D-R** (bookkeeping), **loader rev 3** (Architect, after approval; includes the translation-post checklist).
- No ADR needed in 5b. The Dangel rename needs one (Backlog).

## 10. Estimate (5b + loader)
| Work | Dev (agent) | Mauricio |
|---|---:|---:|
| Review of this spec + loader rev 2 | — | 30–45 min |
| P-1 re-export + diff check | **done** (Architect, E17); entry hash check 5 min | **done** |
| WIP re-apply, typed contracts, M (4 groups) + FR/ES unit tests | 1.5–2.5 h | — |
| Services rendering + anchors | 2–3 h | — |
| Hero rule + paragraphs + 5 tests | 1.5–2 h | — |
| Loader (EN Services/Packages/heroes) incl. §5.4 override | 6–8 h | 30–40 min |
| EN C/N capture + combined checkpoint | 1 h | 30–45 min |
| Packages cards, content sections, responsive, I-5, I-6, D-S | 4.75–7.25 h | — |
| Main CTA EN/FR/ES + tests | 0.5–1 h | — |
| Footer (two commits) + test | 0.5–1 h | — |
| Projects grid I-6 + Home/Projects QA | 0.5–1 h | — |
| Featured Services option D + QA | 1–1.5 h | — |
| Metadata EN (9 pairs incl. `/projects`, helper, REST removal, tests) | 2.5–3.5 h | — |
| Metadata FR/ES (18 pairs + 2 fallbacks, tests) | 1–1.5 h | 15 min (spot check) |
| FR/ES-enabled build: AC-15, AC-24 (EN real + FR/ES simulated), AC-25 | 1–1.5 h | 15 min (stop dev server) |
| AC-26 FR/ES visual on existing routes | 1–1.5 h | 15–20 min (approval) |
| Gates, EN QA matrix, report | 3–4.5 h | 45–60 min |
| **Total** | **≈ 29–42 h** (rev 7: 29–42 h) | **≈ 4–5 h** (rev 7: 4–5.5 h) |
Delta vs rev 7: P-1 check done by the Architect (−0.25 h agent, −15–20 min Mauricio); `/projects` metadata ×3 (+0.25 h
agent). Net ≈ 0.

## 11. Remaining work to the trilingual launch (from 2026-10-31)
Active time; agent figures include its own testing; ranges are rough beyond 5b.

| Block | Agent | Mauricio |
|---|---:|---:|
| 5b + loader (§10) | 29–42 h | 4–5 h |
| 5c rest EN/FR/ES: content files ×3, translation-post checklist (no scripting), order of operations, production mode, tests | 15–22 h | 5–8 h (13 local posts ≈ 2–3.5 h, dry-runs/runs ×3) |
| **5d-lite EN/FR/ES incl. the 6-field form** (modal, Contact secondary CTA, form + API + tests, SLA removal) | **12–17 h** (rev 7: 7–11) | **4.5–6.5 h** (rev 7: 3–4) |
| Privacy route EN/FR/ES (D-L) | 6–9 h | 5–8 h (verification gates ×3, ES draft final, effective date, providers, 3 WP pages) |
| FR/ES dictionary fill (Q-D1: ≈ 82 + 81 minus 5d-lite's keys) | 2.5–4 h (drafts) | 2.5–4 h (approve / write missing) |
| Launch QA (routes × 3 locales × 3 widths, Services/Packages FR/ES, Privacy ×3, Contact form ×3, real AC-24, prerender per locale, Plan B rehearsal build) | 7–10 h | 2.5–3.5 h |
| Release-day runbook + rehearsal (3 languages, Plan B branch, WPML key, Vercel env) | 4.5–6.5 h | 2–3 h |
| Production FR/ES translation posts (13), separate session before release day (OQ-1) | — | 2–2.5 h |
| Release day (posts presence check, CMS load ×3, promote, verification) | 3–4 h read-only | 4–6 h |
| Commits/PRs, reviews (≈ 6 specs/phases) | — | 4–6 h |
| Rework (≈ one round per phase) | 9–13 h | 4–6 h |
| **Total to launch** | **≈ 88–128 h** (rev 7: 85–126 h + Phase 7 if blocking) | **≈ 40–59 h direct** (+ ≈ 22–32 h supervising agent sessions) |
| Phase 7, after launch (not counted above) | 4–6 h | 1 h |

**Effect of the 6-field Contact form on 12-10.** +7–10 h agent, +1.5–2.5 h Mauricio direct, ≈ +2 h supervision
(≈ +3.5–4.5 h of Mauricio's time). Partly offset by Phase 7 leaving the launch path (it was a conditional +4–6 h / +1 h),
Q-P1/Q-D1/Q-QA closed, and no scripted post mechanism to build in 5c (−1–2 h). Net vs rev 7's base: agent ≈ +2–3 h,
Mauricio ≈ +1–2 h incl. supervision. The real effect is on the calendar, not the total: 5d-lite becomes the second-largest
block and must not start in W4 alone with 5c — its spec must be written in W2 and its implementation start in W3/W4 in
parallel with 5c. **New 12-17 trigger:** 5d-lite final review not done by Fri 11-27.

**Capacity check.** 10-31 → 12-10 is ≈ 5.7 weeks. Mauricio at 15–20 h/week = 85–114 h; needed ≈ 62–91 h incl.
supervision. Fits at the low/mid range; the high end touches the low capacity. Agent hours are bounded by Mauricio's
supervision, not by agent speed. Critical path is external: translation posts (local, then production) and content loads, privacy
verification ×3, WPML production key, review turnaround.

Milestones (weeks Mon–Sun; not committed):
- W1 (10-26 → 11-01): decisions done 10-30/31; P-1 done; 5b approved 10-31 (loader rev 2 with it).
- W2 (11-02 → 11-08): 5b Part 1 + loader EN; combined checkpoint by Sun 11-08. Architect: 5c rev 3 (trilingual +
  post checklist), **5d-lite spec (incl. 6-field form)** and Privacy spec.
- W3 (11-09 → 11-15): 5b Part 2, final review by Fri 11-13. Mauricio: 13 FR/ES translation posts locally (checklist);
  privacy inputs. 5d-lite implementation starts.
- W4 (11-16 → 11-22): 5c EN/FR/ES content + loads locally; 5d-lite continues.
- W5 (11-23 → 11-29): 5d-lite final review by **Fri 11-27**; Privacy EN/FR/ES; dictionary fill (Q-D1) starts.
  Mauricio: production FR/ES translation posts (separate session, after the local checklist is validated — OQ-1).
- W6 (11-30 → 12-06): dictionary fill closes; launch QA (full matrix + Plan B rehearsal); release-day runbook +
  rehearsal; WPML production key; **ES go/no-go Fri 12-04**.
- W7 (12-07 → 12-10): go/no-go Tue 12-08, **release Thu 12-10**. Phase 7 starts right after.

### Plan B — EN + FR launch (decided 2026-10-31)
- **Decision point: Fri 2026-12-04, Mauricio.** ES is "ready" only if all hold: ES Privacy final and its verification
  gate passed; ES content loaded + read-back in the rehearsal; ES launch QA passed; `es.ts` 0 TODO; ES translation-post
  checklist validated locally and the production ES posts created (OQ-1).
- **If not ready:** release 12-10 with `ENABLED_LOCALES=en,fr` (Vercel, then rebuild + preview check + promote). No code
  change (A5): ES is not built, `/es/*` → 404 (ADR 0003), no ES in the switcher, the guard ignores ES TODOs. D-L =
  Privacy in EN + FR only (OQ-2). ES CMS content may still be loaded in production (invisible, ADR 0006 decision 4) or later.
- **Enable ES later:** when the criteria above hold — `ENABLED_LOCALES=en,fr,es` in Vercel → new production build →
  preview check (incl. ES routes and guard) → promote; ES Privacy page live first (D-L). No spec change needed; a short
  runbook entry in the release-day runbook.
- If FR (not ES) is the late one, the same rule applies with `en,es`; if both slip, the 12-17 / early-January rule below
  applies to the whole launch.

**Verdict: 2026-12-10 stays plausible, conditionally**, with no buffer week; Plan B removes the ES-specific risks
(ES privacy verification, ES review) from the date. It moves to **Thu 12-17** if the 5b final review slips past Mon
11-16, the 13 local FR/ES translation posts aren't created by Sun 11-22 (or the production ones by Sun 11-29), the 5d-lite final review slips past Fri 11-27,
or EN/FR privacy verification or the WPML key aren't done by Fri 12-04. After 12-17, the holiday period makes early
January the next realistic window.

## Stopping point
Only this spec was changed by rev 9 (unstaged). No code, CMS, schema file, other doc, staging or commit. This spec is
approved (2026-10-31); with loader rev 2 (and the §5.4 override) it authorizes 5b Part 1. Next stops are the combined
checkpoint and the final review.
