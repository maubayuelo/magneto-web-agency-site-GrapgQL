# Design round report — PR 2: Part B visual decisions (B1–B8, B10)

- Spec: `docs/specs/design-round.md` rev 4.1, Part B (status: **Approved**, Mauricio 2026-11-11)
- Author: Dev · Date: 2026-11-11 · Branch: `feat/design-round-2-visual` (base `master` `74c9cd0` + spec commit `93cc697`)

## Result
Done locally. Nothing is committed: every change is in the working tree, staged.
- **Gate:** passes.
  - lint 83 / 81, within the 84 / 81 budget;
  - typecheck passes;
  - tests 698 / 698;
  - the 3-locale build passes.
- **Acceptance:** every PR 2 item AC passes, with two approved exceptions:
  - B1 "unchanged at 768" and B6 "52 px at 768" are superseded by B3. Agreed with Mauricio 2026-11-11 (Deviations D-2).
  - `cli.test.ts` was added to the file list for B8 (Mauricio, 2026-11-11; D-4).
- **Sweep and axe:** 96 / 96 route captures return 200 with no horizontal scroll. axe matches the PR 1b result exactly.
- **EN pixel diff:** every changed region maps to an item. There is no unmapped regression.
- **Still to do:**
  - the Vercel preview checks;
  - Mauricio's manual visual review, including a real phone (→ PR 3).

## Changes
`git diff --stat`: 18 files, all on the PR 2 list plus the approved test file.

| Item | File | Change |
|---|---|---|
| B2 | `PackagesGrid/PackagesGrid.scss` | At 601–1023 the 2-track rule is replaced by one centred track: `minmax(0, min(100%, clamp(30rem, 66vw, 33rem)))`. The desktop 3-column rule from 1024 is unchanged. |
| B3 | `src/styles/typography.scss` | **Phone tokens:** lg 16/24, xl 18/26, 2xl 20/28, 3xl 24/30, 4xl 28/34, 5xl 30/36.<br>**Tablet tokens:** sm 13/20, md 15/22.<br>**Desktop `5xl`:** 48/56 → **42/50**.<br>**New mixins:** `form-note-phone-tablet` (13/20 at ≤ 1024) and the `eyebrow` mixin, with `.typo-eyebrow` / `.typo-eyebrow--on-dark`. Both use plain `@media` rules, because 9 component files import `typography.scss` without `mixins`. |
| B3 | `src/styles/variables.scss` | Removed the unloaded `$font-weight-regular: 500` and `$font-weight-bold: 700`. `$font-weight-black: 900` stays. |
| B3 | `src/styles/components/form-field.scss` | `.form-field__control` is 16 px at every width; it now sets its size directly instead of using the `sm` mixin. `.form-field__help` uses `form-note-phone-tablet`. `.form-field__required` uses `map-get($font-weights, bold)` (600). |
| B3 | `src/styles/components/contact-form.scss` | `__required-note` and `__privacy` use `form-note-phone-tablet`. `.form-error__cta.btn` uses weight 600. |
| B3 | `src/styles/pages/privacy.scss` | h2 / h3: 700 → 600. |
| B3 | `PackagesContentSections.scss` | h3: 800 → 900. |
| B3 + B5 + B1 | `Hero/Hero.scss` | **B3:** removed the `.hero-title` / `.hero-subtitle` `line-height: 30px` / `inherit` overrides.<br>**B5:** the `.hero.hero-home` rules follow the spec sketch:<br>- `min-height: min(calc(100svh - var(--hero-fold-offset)), 820px)`, `height: auto`, no `max-height`, `box-sizing: border-box`;<br>- `.hero-content` `flex: 1 0 auto`;<br>- in flow at ≤ 600 (260 px, `margin: -24px auto -33px`);<br>- three absolute bands: 340 / −44 / R 261; 420 / −54 / R 318; 500 / −64 / R 376;<br>- the 1600 steps are gone for home.<br>**Fold offset:** 58+15 / **46**+15 / 51+30 (see D-3).<br>**B1:** at ≤ 600, `.hero-cta-wrapper .btn` and `.hero-secondary .btn` get `padding-inline: 15px` and `text-wrap: balance`. |
| B1 + B10 | `FinalCTASection/FinalCTASection.scss` | **B1:** at ≤ 600, the container and `.btn` get `padding-inline: 15px`; `.btn` also gets `text-wrap: balance`.<br>**B10:** `&__bg-image` is `object-fit: cover; object-position: center` (was `width/height: auto`). |
| B10 | `FinalCTASection/index.tsx` | The background is `next/image` `fill`, `sizes="(max-width: 1240px) 100vw, 1200px"` (the hero's string), `quality={90}`, `alt=""`, and no `priority`.<br>`src` comes from a local `bgSource()`: `node.sourceUrl`, or else the widest `mediaDetails.sizes[].sourceUrl`, or else no background.<br>The `WpResponsiveImage` import and the `as any` are removed (−1 lint error). It uses the existing `ImageNode` type, so `types.ts` is **not** changed. Props and exports are unchanged. |
| B4 | `src/styles/helpers.scss` | Removed the first `.mt-sm-responsive` / `.mb-sm-responsive` pair (5 / 15). The later 10 / 15 pair was already the one winning the cascade and matches the `pt/pb-sm` family, so nothing renders differently. |
| B4 | `ProjectDetail/index.tsx` (class names only) | `pt-sm-responsive` → `pt-lg-responsive` (header → title 30 / 30 / 60). Gallery `pb-md` (no CSS) → `pb-md-responsive`. Nav `mt-sm pb-md` (no CSS) → `mt-sm-responsive`; the nav's `pb-md` is dropped so the case → final-CTA join stays 30 / 30 / 60 (D-5). |
| B4 | `services/Services.scss` | `.services-intro.main` padding-bottom 30 / 60 (the markup's `pb-md-responsive` gave 15 / 30). |
| B4 | `packages/Packages.scss` | `.packages-intro` padding-bottom 15 / 30. Added to the grid's own `pt-md-responsive` it gives 30 / 60. |
| B4 | `src/styles/pages/home.scss` | `.about-section .about-content__body > :last-child { margin-bottom: 0 }`. `.projects-grid__grid` margin-bottom −10 / −15, which cancels the items' `mb-sm-responsive` under the last row (D-1). |
| B4 + B7 | `src/styles/pages/privacy.scss` | **B4:** `.privacy-policy.pb-lg-responsive { padding-bottom: 0 }` and `__body > :last-child { margin-bottom: 0 }`.<br>**B7:** `max-width: 35rem` at 601–1023. |
| B6 | `services/Services.scss` | `.service-cta { align-self: flex-start; }`, with `min-height: 44px` removed. The `:focus-visible` rule stays. |
| B6 | `docs/BUTTON_SYSTEM.md` | Rewritten from the code with the spec's 10 sections. It records the B3 tablet `.btn` size (13/20) and the `transition: all` measuring trap. |
| B8 | `scripts/qa-i18n/config/length-limits.json` | `status: "set"`, `set: { by: "Mauricio", on: "2026-11-11" }`, `statusNote` updated. Values: `ratioWarnAbove` 1.35, `cta-label` 38, `hero-title` 100, `button` 26. `common.bookStrategyCall` moved from `button` to `cta-label` (`select.dictionary`). |
| B8 (approved addition) | `scripts/qa-i18n/cli.test.ts` | AC-4b rewritten for the set config (D-4). |
| Report | `docs/reports/design-round-2.md` | This file. |

**Not touched** (as the spec says): `button.scss`, `WpResponsiveImage/*`, `Hero/index.tsx`, `ServicesList.tsx`,
`PackageCard`, `Header`, `EmailCollectorProvider`, `CalendlyButton.scss`, dictionaries, `FinalCTASection/types.ts`,
CMS. Nothing new uses `any`. No dependency was added.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | **passed (vs budget)** | **83 errors / 81 warnings** (budget ≤ 84 / 81). `next lint` exits 1 on the pre-existing baseline. The −1 is B10's `as any`. In changed files the only message is `FinalCTASection/index.tsx:38` (`'e'` unused in `catch (e) {}`), a pre-existing line, shifted. |
| typecheck | passed | exit 0 |
| tests | passed | 48 files, **698 / 698**, the same count as PR 1b. Before D-4 the result was 697 / 698, with AC-4b failing by design. `npm test -- --run scripts/qa-i18n`: 5 files, 74 / 74. |
| build | passed | `ENABLED_LOCALES=en,fr,es npm run agent:build`: exit 0. GraphQL returned 200 before the build. 35 / 35 static pages, 0 `ECONNREFUSED` / `fetch failed`. Prerendered project paths: 3 EN + "+6 more" (3 per locale), as in PR 1b. The build ran on the final source tree; the only later edit is the test file D-4, which isn't part of the build. |
| visual sweep (8 routes × en/fr/es × 375 / 768 / 1024 / 1440) | passed | 96 / 96 HTTP 200, 0 horizontal scroll (`screenshots-after-2/sweep.json`) |
| axe (48 runs) | passed | Compared with `axe-after-1b.json`: 82 → 82 nodes, **0 worse, 0 better** |
| EN pixel diff | passed (all regions mapped) | See "EN visual diff" |
| Vercel preview + Mauricio's review | **not run** | After the PR is opened (checklist below) |

## Method
- **Servers.** `next start -p 3100` through `npm run agent:start`. I started each server and stopped it by its own PID.
  Ports 3000 and 3100 were checked before each build.
  - One build was refused because a dev server held port 3000. I stopped and asked; Mauricio stopped that server.
- **Master baselines** came from `74c9cd0` itself: `git stash`, `agent:build`, `git stash pop` right after the build, then `next start` on the master `.next`.
  This was done twice:
  - first for items, rhythm and EN captures;
  - second for section boxes.

  Master today is **pixel-identical** to the post-1b captures on all 24 EN files (`analysis/rd-1b-master.json`: 0 differing rows). So "vs master" equals "vs post-1b" below.
- **Tools:** Playwright 1.62.1 from the npx cache (Chromium), and `axe-core` from `node_modules`. Every read waits ≥ 600 ms after load (the `.btn` transition).
- **Evidence folder:** `~/Documents/projects/magneto/backups/design-round/screenshots-after-2/`:
  - `en|fr|es/<route>_<w>.png`: 96 full-page captures, DPR 2 at ≤ 1024, DPR 1 at 1440;
  - `b5/overlap/` and `b5/fold/`: viewport captures `<lang>_<w>x<h>.png`;
  - `detail/`: crops;
  - `scripts/`, `analysis/`, plus JSON results (`items-after.json`, `rhythm-after.json`, `fcta-after.json`, `axe-after-2.json`, `en-section-diff.json`, `en-rowdiff-vs-1b.json`).

## Acceptance

### B1 — CTA labels at 375 (`analysis/b1-analysis.txt`)
**Rule:** at ≤ 600, `padding-inline: 15px` and `text-wrap: balance` on the hero and final-CTA buttons. Each cell below reads before → after, as width × height and number of lines.

| Location (375) | EN | FR | ES |
|---|---|---|---|
| Hero (`/`, about, services) | 235 → **205** × 46, 1 line | 292 → **262** × 46, 1 line | 315 × 62, 2 lines (148 / 162 px, Δ 9%) |
| Final CTA (about, services) | 204 → 174, 1 line | 285 × 62, 2 lines → **262 × 46, 1 line** | 285 → 315 × 62, 2 lines balanced (Δ 9%) |
| Packages final CTA, secondary | 208 → 178, 1 line | 285 × 66, 2 lines → **266 × 50, 1 line** | 285 → 315 × 66, 2 lines balanced |
| Contact "Prefer to talk?" | 208 → 178, 1 line | 258 → 228, 1 line | 315 × 66, 2 lines → **292 × 50, 1 line** |
| Packages hero / final CTA, primary | 245 → 215 | 244 → 214 | 254 → 224 |

The table matches the spec's prototype figures exactly.

| AC | Result |
|---|---|
| Every FR hero / final-CTA button on 1 line at 375 | **pass** |
| ES "Agendar…" ≤ 2 lines, line widths within 25% | **pass**: 2 lines, 148 / 162 px, Δ 9% |
| 1440 widths unchanged (±1) | **pass**: 33 / 33 unchanged |
| 768 widths unchanged (±1) | **superseded by B3** (D-2). Every 768 button is **+2 px tall** (e.g. 48 → 50, 52 → 54) and **12–26 px wider**: the tablet `sm` token makes the text 12 → 13 px and the line height 18 → 20. Padding is still 30 px, so B1 causes none of this. |

`/fr` and `/es` home final CTAs still show "Get Your Free Strategy Call" (5c-rest, known).

### B2 — Packages at tablet (`items-after.json` → `b2`)
| Width | Columns (master) | Card px | % of viewport | Left / right gap | Scroll |
|---|---|---:|---:|---|---|
| 375 | 1 (1) | 345 | 92 | 0 / 0 | none |
| 601 | **1** (2) | 480 = formula | 79.9 | 46 / 46 | none |
| 768 | **1** (2) | **507** = formula | **66.0** | 116 / 116 | none |
| 834 / 1023 | **1** (2) | 528 = formula | 63.3 / 51.6 | centred | none |
| 1024 / 1440 | 3 (3) | 301 / 380 | — | — | none |

All three locales give identical widths.
- **AC: 1 column at 375 / 601 / 768 / 1023, centred, width = the formula.** Pass.
- **AC: 3 columns at 1024 / 1440.** Pass. The grid at 1440 is **pixel-identical** to master (section diff: `div.main` 0 differing rows).
- At 1024 the 3 cards are taller (+110 px). That comes from **B3**, not B2: the 1024 font size still uses the tablet tokens.
- **Spec note "ES CARE title vs icon":** **it touches.**
  - At 768 the title text ends **0.4 px** from the icon circle (`detail/b2_es_care_title_768.png`). It is 0 px at 601, where the title wraps to 2 lines and meets the icon on the first, and 21 px at 900 / 1023.
  - The row has no `gap`. The fix is a gap on `.package-card__title-row` in `PackageCard.scss`, which is not a PR 2 file → **I-1**.

### B3 — Type scale (`analysis/items-analysis.txt`)
Computed size / line height / weight, master → after (en, fr and es identical). "=" means unchanged.

| Role | 375 | 768 | 1440 |
|---|---|---|---|
| Home H1 | 27/30 → **28/34** | 36/normal → **36/44** | 48/normal → **42/50** |
| Home subtitle | 18/30 → **18/26** | 20/normal → **20/30** | 24/normal → **24/34** |
| Page H1 (`/services`) | 22/30 → **24/30** | 30/normal → **30/38** | 36/normal → **36/46** |
| H2 | 20/26 → **20/28** | 24/34 = | 30/40 = |
| H3 | 18/22 → **18/26** | 20/30 = | 24/34 = |
| Body | 16/20 → **16/24** | 16/24 = | 18/28 = |
| Privacy H1 / H2 | 22/28 → 24/30 · H2 weight 700 → **600** | H2 700 → 600 | H2 700 → 600 |

- **Hierarchy table:** every value matches the spec at 375 / 768 / 1440. **Pass.**
- **`grep 5xl`:** only the token maps, the `.typo-5xl-*` classes and the one consumer (`Hero/index.tsx:38`). Desktop 5xl is 42 / 50. **Pass.**
- **Weights.** No `700` / `800` / `$font-weight-bold` is left in touched SCSS. **Pass for the SCSS.** Computed weights, though, still include **700**:
  - it comes from CMS `<strong>` elements (UA `font-weight: bolder`): 9 on services, 12 on packages, 25 on privacy, 1 on about and 1 on the case page;
  - it is the same on master, and no touched SCSS sets it;
  - 800 is gone. **I-2**.
- **Form controls:** 16 px at 375 / 768 / 1440 (desktop was 14). Help, required note and privacy are 13 / 20 at 375 and 768, and 14 / 24 at 1440. **Pass.**
  - Labels also follow the tokens: 14/20 → 14/24 at 375, 14 → 15 px at 768.
- **Eyebrow:** `.typo-eyebrow` compiled (28 rules in the page CSS: `typography.scss` is imported by 9 component stylesheets, an existing pattern). 0 elements use it on all 16 route × width runs. **Pass.**
- **Inner heroes:** heights change only through B3. The title line height went from `normal` / 30 to the tokens, and the phone 3xl from 22 to 24 px. Examples at 375: about 304 → 286; services 334 → 316; contact 339 → 290; ES services title 3 → 4 lines, ES projects 1 → 2 lines. At 768 / 1024 / 1440 they are +3 to +13 px.
  - No inner hero layout rule changed; the B5 rules are all scoped to `.hero.hero-home`. **Pass**: only the B3 fix and the B1 padding.

### B4 — Vertical rhythm (`analysis/rhythm-master.txt` → `rhythm-after.txt`)
**Method:** visible whitespace between consecutive top-level blocks of `#main-content`. A painted block counts by its box; otherwise by the boxes of its visible descendants. This method reproduces the spec's `detail.json` numbers exactly on master (15 / 15 / 30, 50 / 54 / 90, 10 / 10 / 15, 80 / 80 / 145).

| Join | Master (375 / 768 / 1440) | After, en / fr / es |
|---|---|---|
| Services intro → list | 15 / 15 / 30 | **30 / 30 / 60** |
| Packages intro → cards | 15 / 15 / 30 | **30 / 30 / 60** |
| Home about → featured (EN) | 50 / 54 / 90 | **30 / 30 / 60**. FR/ES were already 30 / 30 / 60: their CMS body has no trailing margin. |
| Projects grid → next block: home (EN → testimonials; FR/ES → final CTA) and `/projects` → final CTA | 40 / 40 / 75 | **30 / 30 / 60** |
| Header → case-page title | 10 / 10 / 15 | **30 / 30 / 60** |
| Privacy → footer | 80 / 80 / 145 | **30 / 30 / 60** |

- **AC: each join ±2 px.** Pass (exact).
- **AC: other joins unchanged ±2 px** (every join, 8 routes × 3 locales × 3 widths). Pass. The only joins that moved are the ones in the table.
- **AC: one definition each in `helpers.scss`.** Pass: `.mt-sm-responsive` at line 240 and `.mb-sm-responsive` at line 248.

### B5 — Home hero (`b5/overlap.json`, `b5/fold.json`, `b5/content-only.json`)
- **Zero overlap.** Pass.
  - Runs: `/`, `/fr`, `/es` × 375, 600, 601, 768, 1024, 1025, 1400, 1440, 1600 × heights 667 and 900, plus the 12 fold/cap viewports: 90 runs.
  - `ctaClear` ≥ **+20** everywhere (minimum +20 at 375 × 667, +21 at 1024–1600 × 667). Subtitle vs art ≤ **−96** everywhere.
  - Metric: the spec's own (α > 128, CTA ring included).
- **Above the fold:** **all 15 "yes"**, identical to the prototype.

  | Viewport | EN hero top–bottom | FR | ES | In fold | `ctaClear` en / fr / es |
  |---|---|---|---|---|---|
  | 1440 × 900 | 51–870 | 51–870 | 51–870 | yes ×3 | +144 / +144 / +144 |
  | 1280 × 720 | 51–690 | 51–690 | 51–690 | yes ×3 | +22 / +22 / +22 |
  | 768 × 1024 | 46–866 | 46–866 (3-line H1) | 46–866 | yes ×3 | +252 / +252 / +222 |
  | 375 × 667 | 58–658 | 58–658 | 58–666 (2-line CTA) | yes ×3 | +20 / +20 / +20 |
  | 390 × 844 | 58–829 | 58–829 | 58–829 | yes ×3 | +217 / +191 / +209 |

- **Not in fold (outside the named viewports): content-driven.** Content-only height (`min-height: 0`) = rendered height in every case:
  - 360 × 640: EN +18 / FR +78 / ES +60 below;
  - 320 × 568: +90 / +200 / +158;
  - 601 × 667: +43;
  - 1024 × 667: +2;
  - 1025 × 667: +22 (FR +72);
  - 1400–1600 × 667: +80.
- **Cap.** Pass: 1440 × 1200 and 1920 × 1080 give **820 px** (51–871) in all 3 locales, CTA → art 145. Screenshots: `b5/fold/<lang>_1440x1200.png`, `b5/fold/<lang>_1920x1080.png`.
- **Anchoring.** Pass. In every run the art reaches the hero's bottom edge and is cropped by it (art → hero bottom = 0). The crop by band follows the `bottom` value.
- **`Hero.scss`:** 0 `100vh` / `dvh`; `min-height` uses `100svh`. **Pass.**
- **The illustration box stays inside the hero's left/right edges** (`imgInside = true`, 90 / 90), and there is no horizontal scroll. **Pass.**
- **Inner heroes unchanged** except B3 / B1. **Pass** (see B3).
- **Mauricio's look at 1440:** illustration 500 px, `bottom: -64px`, H1 42px/50px (computed). **Pass.** Crop: `detail/diff_home_1440_hero.png` (master | PR 2).

### B6 — Services outline buttons
| | 375 | 768 | 1440 |
|---|---|---|---|
| `.service-cta` master | 78 | 78 | 78 |
| `.service-cta` after (×3, en/fr/es) | **50** | **54** | **54** |
| About "Tell me about your project", after | 50 | 54 | 54 |

- Computed background, colour, border, font size, weight, text-transform and min-height are **equal** to the About button at every width and locale. **Pass.**
- The spec's 52 at 768 is **superseded by B3** (D-2). Both buttons are 54 there; they stay equal.
- `docs/BUTTON_SYSTEM.md` spot check:
  - every class it lists as styled has a rule: `.btn-primary`, `.btn-secondary`, `.btn-small`, `.btn-large`, `.service-cta`, `.form-error__cta`, `.contact-form-submit`, the hero / final-CTA contexts, and `&__cta` nested in `PackageCard.scss`;
  - the classes with no CSS (`btn-medium` ×6, `btn-sm`, `btn-outline`, `btn-disabled`) appear only in its debt section;
  - `.cta` / `.cta-mobile` appear only under "Removed / never existed" (0 in `src`).

  **Pass.**

### B7 — Privacy measure
| | 375 | 768 | 834 / 1023 | 1440 |
|---|---|---|---|---|
| Average full-line characters, master → after | 40.2 = | 78.8 → **68.1** | 78.8 → 68.1 | 74.5 = |

- 768 after, all locales: EN 68.1 / FR 68.1 / ES 67.2, inside the 66–72 target. Column 640 → 560 px.
- 375 and 1440 are unchanged.
- **Pass.**

### B8 — Length limits
- `npm test -- --run scripts/qa-i18n`: **74 / 74 pass**, after D-4.
- `npx tsx scripts/qa-i18n/qa-i18n.ts --out <scratchpad>/qa-out` (deterministic, no `--llm`):
  - **exit 0**;
  - 329 units, 28 findings: 24 warnings, 4 info;
  - by check: 25 length, 3 kept-terms.
  - Report copy: `analysis/qa-i18n-out/`.

Length findings (FR/ES warnings; EN info):

| Lang | Unit | Reason |
|---|---|---|
| es | `common.bookStrategyCall` | **43 > cta-label max 38**; 43 > EN 25 × 1.35 (expected: the 5c-rest ES copy signal) |
| es | CMS `heroContent.ctaTextHero` on home, about-magneto, services, projects | 43 > cta-label max 38 (+ ratio) |
| es | CMS `finalCtaSection.ctaText` on about, services, fashion-company, shamaniccas; packages `secondaryCtaText` | 43 > cta-label max 38 |
| fr / es | `contactForm.submit` (33 / 34), `cmsFallback.requestQuote` (32 / 33) | > button max 26 (+ ratio) |
| fr | `emailModal.continueDownload` (32), `bookingModal.continue` (29) | > button max 26 |
| en (info) | `emailModal.continueDownload` (30) | > button max 26 |
| fr / es | `common.goHome` (18 / 16 vs EN 7), about `linkText` (35 / 37 vs 24), services / packages CMS `ctaText` (FR 26–29), ES packages `heroTitle` (36 vs 26) | ratio > 1.35 only |

The selectors used include `dictionary:common.bookStrategyCall`. `*.prefooterCtaText` and `*.aboutCtaText` match nothing (unchanged from before).

### B10 — Final-CTA background: before / after (cold cache, same method as `fcta.cjs`)
Requests are for `hero-background.png`, at q90. "Page total" is the sum of all responses (headers + body).

| Width | Route | Before: requests (bytes) | After: requests (bytes) | Page total before → after |
|---|---|---|---|---|
| 375 | `/` | w750 (8,008) + **w3840** (54,060) + **w1080** (21,246) | **w750 (8,008), shared with the hero** | 541,305 → 466,031 (**−75,274**) |
| 375 | `/about-magneto` | same 3 | w750 shared | 370,503 → 295,228 (−75,275) |
| 375 | `/es/about-magneto` | same 3 | w750 shared | 359,398 → 295,552 (−63,846) |
| 375 | case page | w3840 + w1080 (75,306) | **w750 (8,008)** | 841,347 → 774,579 (−66,768) |
| 768 | `/`, about, `/es/about` | w1920 (54,060) + **w3840** (54,060) | **w1920, shared** | 565,667 → 512,036 (−53,631); 368,875 → 315,281; 369,224 → 315,606 |
| 768 | case page | w3840 + w1920 (108,120) | **w1920 (54,060)** | 874,137 → 820,624 (−53,513) |
| 1440 | `/`, about, `/es/about` | w1200 (27,650), shared | w1200, shared | 417,213 → 418,071 (+858); 281,718 → 282,617 (+899); 282,065 → 282,938 (+873) |
| 1440 | case page | w1200 (27,650) | w1200 (27,650) | 712,068 → 713,046 (+978) |

- **Request count** for the background, per page: 375: 3 → 1 (case 2 → 1); 768: 2 → 1; 1440: 1 → 1.
- **At 1440 the image requests are identical.** The ~0.9 KB increase is in the other responses; I didn't isolate it. The most likely source is the slightly larger compiled CSS (B3 eyebrow / form rules, imported by several stylesheets).
- **AC: exactly one `hero-background.png` URL per page per width.** Pass (12 / 12).
- **AC: on hero routes, final-CTA `currentSrc` = hero `currentSrc`.** Pass (9 / 9).
- **AC: the final-CTA `<img>` attributes.** Pass: `sizes="(max-width: 1240px) 100vw, 1200px"`, `q=90`, `alt=""`, no `fetchpriority`, `loading="lazy"`, `object-fit: cover`. The case page has no image preload for it (no hero there).
- **AC: EN pixel diff limited to the final-CTA background.** Pass with a note:
  - At 375 the gradient is scaled to cover.
  - At 768 there are faint gradient pixels (17–36k pixels per final CTA).
  - **At 1024 the change is larger** than the spec expected (`detail/diff_home_1024_fcta.png`). On master the 768-px-wide image was drawn at its intrinsic size inside a 1,000-px container, leaving **flat dark bands on both sides**; it now covers the box.
  - This is a visible improvement owned by B10, but the spec didn't predict it → Mauricio checks it in the review.

## EN visual diff (all regions attributed)
- **Method:** each EN capture was split into sections (header, every `#main-content` child, footer), using each build's own section boxes. Each section was compared master vs PR 2 at 375 / 768 / 1024 / 1440. Output: `en-section-diff.json` and `analysis/secdiff.txt`.
- **Row diff vs post-1b** (requested): `en-rowdiff-vs-1b.json`. The first differing row is:
  - row 14 at 768 (the header text, B3);
  - row 89 at 1440 (inner hero title, B3), 51 on home (B5);
  - rows 116–186 at 375 (hero, B3 / B1).

| Region | Widths | Owner | Notes |
|---|---|---|---|
| Header text; header 45 → 46 px tall | 768, 1024 (1024 text only) | **B3** | `.btn-small` uses the tablet `sm` token. 375 / 1440 headers identical. |
| Footer text, +7 px | 768, 1024 | **B3** | Tablet `sm` / `md` tokens. 375 / 1440 footers identical. |
| Home hero (height + layout) | all | **B5** + B3 + B1 | 375: 510 → 850 (fold at 900 tall); 768: 555 → 850; 1440: 660 → 879. |
| Inner hero title / buttons | all | **B3** (+ **B1** at 375) | Heights in the B3 section above |
| Phone body text taller (all routes) | 375 | **B3** | Phone tokens |
| Tablet small text (cards, labels, projects grid, testimonials) | 768, 1024 | **B3** | Tablet `sm` / `md` tokens |
| Home about → featured, −24 / −30 | 768, 1024, 1440 | **B4** | About section otherwise identical (0 rows) |
| Projects grid bottom, −10 / −15 | 768, 1024, 1440 (home, `/projects`) | **B4** | |
| Services intro +15 / +30 | 768, 1024, 1440 | **B4** | Intro content identical (0 rows) |
| Services list −72 (768 / 1024), −48 (1440) | | **B6** | 3 × 24 px CTAs. At 1440 one service row is image-driven, so its height doesn't change. |
| Packages intro +17 / +30 | | **B4** | |
| Packages grid +283 at 768 | 768 | **B2** | 1 column |
| Packages grid +110 at 1024 | 1024 | **B3** | Still 3 columns |
| Packages grid at 1440 | 1440 | — | **Identical** (0 rows) |
| Case page +265 (375), +49 (768), +94 (1024), +90 (1440) | | **B4** (+45 top, +30 gallery `pb-md-responsive`, +15 nav `mt-sm-responsive` at 1440) + **B3** | |
| Final CTA | 375 | **B1** + **B10** + B3 | Case page −28 px: the wider text box (B1) means fewer lines. Home / services / packages +8 to +28: phone tokens. |
| Final CTA | 768, 1024 | **B10** + B3 | 1024: side bands gone (see B10) |
| Contact form | all | **B3** | Labels, help, controls 16 px at 1440 (+15 px) |
| Privacy | 375, 1024, 1440 | **B4** (−50 / −85) + **B3** | h2 600 instead of a synthetic 900 means fewer wraps |
| Privacy | 768 | **B7** (+320, narrower column) + B4 | |
| 1440 residuals: about-magneto (15 rows, 30 px), `/projects` grid images (8 rows, 151 px), 1–6-row single-pixel specks elsewhere | 1440 | **B3** (sub-pixel) | Visually identical (`detail/diff_about_1440_main.png`, `detail/diff_projects_1440_grid.png`). The B3 line-height fix turned `normal` (fractional px) into whole px, so content below sits at a different sub-pixel offset and photos and glyphs resample. |

**Unmapped regions: none.**

## Deviations from the spec
- **D-1 (B4 row mislabelled; approved by Mauricio 2026-11-11).**
  - The spec's "Home testimonials → final CTA 40 / 40 / 109" is in fact the join **above** testimonials: projects grid → testimonials, 40 / 40 / 75 today.
  - The real testimonials → final-CTA join was already 30 / 30 / 60.
  - Its cause is the same as `/projects` → final CTA: the grid items' `mb-sm-responsive` (10 / 15) under the last row.
  - Fixed once, in `home.scss`: `.projects-grid__grid` gets a negative bottom margin. `home.scss` is global; `ProjectsGrid.scss` isn't on the list.
- **D-2 (B3 vs B1 / B6 at 768; approved by Mauricio 2026-11-11).**
  - The B3 tablet `sm` token (12/18 → 13/20) also sizes every `.btn` at 601–1024.
  - At 768, buttons are +1 px text and +2 px tall, and 12–26 px wider.
  - Kept, with no `button.scss` override. The B1 "768 unchanged" and B6 "52 px at 768" criteria are **superseded by B3**.
  - B6's equality with the About button still holds (54 / 54).
- **D-3 (fold offset 45 → 46 at 601–1023).**
  - The same token makes the header **46 px** tall at 601–1023 (all locales; `scripts/hdr.cjs`).
  - The spec's rule is "a header change must update the offset", so `--hero-fold-offset` is `46px + 15px` in that band. Same file, same item.
  - Effect: the gap under the hero at 768 × 667 is 15 px (it would be 14 with 45). The B5 tables above were re-run after this change.
- **D-4 (file added; approved by Mauricio 2026-11-11).**
  - `scripts/qa-i18n/cli.test.ts` AC-4b asserted the *placeholder* behaviour on the real config, so B8 made it fail (697 / 698).
  - Rewritten for the set config: length findings are FR/ES warnings and EN info, with no placeholder marker; ES `common.bookStrategyCall` reports "cta-label max 38"; the selector is listed.
  - Placeholder behaviour stays unit-tested in `checks.test.ts:152-157`.
- **D-5 (B4, class choices).**
  - The spec says to replace `pb-md` / `mt-sm` "with existing helpers" without naming them. Chosen: gallery `pb-md` → `pb-md-responsive`; nav `mt-sm` → `mt-sm-responsive`.
  - The nav's `pb-md` is **dropped**: a `pb-md-responsive` there would push the case → final-CTA join from 30 / 30 / 60 to 45 / 45 / 90.
  - These add visible space inside the case page (gallery → external link, external link → back button).
- **D-6 (B4, helpers in SCSS).**
  - The services and privacy markup carries `pb-md-responsive` / `pb-lg-responsive`, but `page.tsx` isn't on the list. So the SCSS in the listed files overrides them with helper-equal values (`$spacing-30 / -60`, `0`).
  - Same result as swapping the class names.
- **D-7 (B3 form text, implementation).**
  - `.form-field__control` no longer includes the `sm` font mixin. Its `@media` rules are emitted after the base rule and would beat a plain `font-size: 16px`.
  - It sets `font-family`, `16px` and the `md` line height directly.
  - The 13/20 note rule is a mixin in `typography.scss`, so the two form stylesheets don't depend on each other.
- **D-8 (B3 weights in form CSS).**
  - `$font-weight-bold` (700) was also used by `.form-field__required` and `.form-error__cta`. Removing the variable required a value: **600**, the spec's 700 → 600 rule.
  - DM Sans doesn't load 700, so those rendered as a synthetic match (the browser picks 900). The red required asterisk and the inline booking link are now visibly 600.

## Issues found (not fixed)
- **I-1 (B2 follow-up).**
  - ES "CARE — Mantenimiento continuo de sitios web" touches its icon circle at 601–~800 px (0–0.4 px; `detail/b2_es_care_title_768.png`).
  - Fix: a `column-gap` on `.package-card__title-row` in `PackageCard.scss` (not a PR 2 file). Candidate for PR 3 only if Mauricio adds the file; otherwise a 5c-rest / packages follow-up.
- **I-2 (B3).**
  - CMS rich text `<strong>` computes to weight 700 (the UA's `bolder`). DM Sans has no 700, so it renders as 900. This is on 5 routes, as on master.
  - A global `strong, b { font-weight: 600 }` would satisfy "computed weights 400 / 600 / 900", but it's a visible copy-wide change the spec didn't decide.
  - `globals.scss:59` (`.skip-link`, PR 1b) also sets `font-weight: 700`; `globals.scss` isn't in PR 2.
- **I-3.** `typography.scss` is imported by 9 component stylesheets, so each new rule there (the eyebrow, 28 copies) is duplicated in the CSS bundle. This is pre-existing; consolidating the imports is a tooling-phase task.
- **I-4.** The B5 fold offset now depends on the header at three widths, and B3 already moved it once (D-3). A header change must re-run `b5.cjs` (kept in `scripts/`).
- **Carried, unchanged:**
  - `.btn-medium` / `.btn-sm` / `.btn-outline` have no CSS, and `.btn-large` has CSS but no use (recorded in `BUTTON_SYSTEM.md`);
  - `CalendlyButton.scss` is never imported;
  - PR 1b I-2 and I-3;
  - the EN final-CTA label on `/fr` and `/es` home;
  - the ES CTA label length (5c-rest; it now shows as a B8 warning).

## Visual checklist for Mauricio (Vercel preview → PR 3)
Check on desktop (≈ 1440), a tablet width (≈ 768, DevTools or iPad) and **one real phone**, in EN, then spot-check FR and ES.
1. **Home hero:**
   - It fills the first screen (desktop: about 820 px, with the illustration anchored at the bottom and cropped by the rounded edge).
   - The CTA never touches the illustration.
   - **Real phone:** with Safari's toolbars showing, the hero bottom may sit just below the fold on small iPhones. That's expected ("content wins"); say if it feels wrong.
2. **Home H1** is 42 px on desktop and still clearly the biggest heading. FR wraps to 2 lines at 1280–1600 and to 3 at 1025.
3. **Phone CTAs** (375, FR / ES):
   - FR buttons sit on one line;
   - ES "Agendar…" sits on 2 even lines;
   - EN buttons are a bit narrower.
4. **Tablet (768):**
   - Packages show one centred card per row; check ES CARE (I-1).
   - Buttons and the header are 2 px taller (B3, accepted).
   - The privacy text column is narrower.
5. **Spacing:** sections are evenly spaced (30 / 60):
   - services intro → list;
   - packages intro → cards;
   - home about → services;
   - projects → next block;
   - case-page top;
   - privacy → footer.

   On the case page, gallery → "Visit site" → "Back" now has spacing (D-5).
6. **Services:** the "See … pricing" buttons are the same size and look as "Tell me about your project" on About.
7. **Final CTA:** the gradient covers the whole box at every width (at 1024 the old dark side bands are gone).
8. **Forms** (`/contact`, the booking modal): field text is 16 px everywhere; help, privacy and required text are slightly larger on phones; the red `*` is lighter (600).
9. Anything to tweak (sizes, spacing, R/S/B, breakpoints in the same files) → the PR 3 list, or "none".

## Proposed commits
One per item in the spec's order. Several files carry more than one item (`Hero.scss`: B3 / B5 / B1; `privacy.scss`: B3 / B4 / B7; `FinalCTASection.scss`: B1 / B10; `typography.scss`: B3), so splitting needs `git add -p`. If PR 2 is squash-merged like #37 / #38, the list below is its body.
1. `style(packages): B2 one centred card column at 601–1023 (66vw at 768)`
2. `style(type): B3 phone/tablet tokens, home H1 42/50, form text, loaded weights, eyebrow class`
3. `style(hero): B5 home hero fills the fold (svh, 820 px cap), reserved illustration space, no overlap`
4. `style(cta): B1 15 px phone padding and balanced wrapping on hero and final-CTA buttons`
5. `style(layout): B4 normalize section rhythm to 30/30/60, dedupe sm helpers, fix ProjectDetail helper classes`
6. `style(services): B6 service CTA matches the secondary button height` + `docs(buttons): B6 rewrite BUTTON_SYSTEM.md from the code`
7. `style(privacy): B7 ~70-character measure at 601–1023`
8. `perf(images): B10 final-CTA background reuses the hero image (one download, right size)`
9. `chore(qa-i18n): B8 set length limits (38/26/100/1.35) and update AC-4b`

Each commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Time
- **Agent:** one session on 2026-11-11, not timed. It includes two master rebuilds for baselines and one pause for the port-3000 question.
- **Mauricio:** two answers in-session: the port / spec-issue reply, and the D-4 test decision. Report review and preview review are still to come (spec estimate: 45–60 min + 30–45 min).
