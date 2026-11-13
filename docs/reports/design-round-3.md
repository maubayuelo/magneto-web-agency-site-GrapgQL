# Design round report — PR 3 (polish): M1–M6, A1–A10

- Spec: `docs/specs/design-round-pr3.md` rev 3 (Approved, Mauricio, 2026-11-12)
- Branch: `feat/design-round-3-polish`, on `master` `1ae73f6` (PR 2 squash, #39)
- Author: Dev · Date: 2026-11-12

## Result
Done. M1–M6 and A1–A10 are implemented, and every acceptance criterion passes in en/fr/es except one: A8 at 1024 px.
That one is reported, not changed (Mauricio's decision). Four spec values were changed after measurement, each
decided by Mauricio; see "Deviations".

## Changes
| File | Item | What |
|---|---|---|
| `src/components/organisms/Hero/Hero.scss` | M1 | `&.hero-home` block only. ≤ 600: `min-height: 0`, art `width: 100%` in flow, margin `calc(28px − 15.5%) auto −12.8%`, CTA `margin-bottom: 0`. ≥ 601: `--hero-h` / `--hero-art` (Option A), reserve `padding-bottom: calc(0.717·art + 29px)`, art `bottom: −0.128·art`; the 340 / 420 / 500 bands are removed. ≥ 1024: K 349, floor 400. 1024–1031: K 329. Fold offsets read `--hero-fold-offset` (73 at ≤ 1023 after A8, 81 at ≥ 1024). |
| `src/components/organisms/AboutSection/index.tsx` | M2 | Body className `typo-3xl-medium` → `typo-xl-medium` (className only). |
| `src/components/organisms/AboutSection/AboutSection.scss` | M2 | Stacked at every width (`.main.about-section`, column, gap 15); the 120 / 250 px title column is removed; body `max-width: 70ch`, left-aligned. |
| `src/app/[locale]/services/Services.scss` | M3, M4, A4, A6 | M3: `.services-group__heading` center + uppercase. M4 (≤ 1023, core rows): gap 15; `:not(:last-child)` padding-bottom 45 (≤ 600) / 60 (601–1023). A4: `.services-group--supporting` margin-top 15 / 30 (≥ 1024). A6 (601–1023): `max-width: 46ch` on `.service-content > p`, `> .service-rich-body` and `.services-group__intro`. `.service-image { display: block }` (see Deviations). |
| `src/components/organisms/PackagesContentSections/PackagesContentSections.scss` | M5 + border | At ≥ 1024, `:has(> item:nth-child(2):last-child)` → 2-column grid, gap 30, `align-items: start` (spec CSS as written). **Added after the spec (Mauricio, 2026-11-12):** in that layout only, the two boxes ("Paid Website Diagnostic" / "Good to Know Before You Budget") are outlined instead of filled: `border: 1px solid $gray-50` (the design system's subtle card border, from the `card-base` mixin and project images) and `background-color: transparent` (no `$gray-30` fill). |
| `src/app/[locale]/contact/page.tsx` | M6 | 3 intro `<p>`: `typo-lg-medium` → `typo-lg-bold` (className only). |
| `src/app/[locale]/about-magneto/page.tsx` | A1 | 2 lead blocks: `typo-3xl-medium` → `typo-xl-medium` (className only). |
| `src/styles/pages/about.scss` | A10 | `.about-section h3`: `padding-top` 20 / 50 (≥ 1025), plus the flex gap 10 = 30 / 60; first child 0. |
| `src/components/molecules/PackageCard/PackageCard.scss` | A2, A3 | A2: `&__zone--bottom { flex: 1 }` and its `__details` `flex: 1`. A3: `&__title-row { gap: 12px }`, `&__icon { flex-shrink: 0 }`. |
| `src/styles/typography.scss` | A5 | `h1–h4 { text-wrap: balance }`, `p { text-wrap: pretty }`. |
| `src/components/organisms/FinalCTASection/FinalCTASection.scss` | A7 | Subtitle `font-weight: 400`; 46ch measure centered with `padding-inline: max(0px, calc((100% − 46ch) / 2))`. |
| `src/components/organisms/Header/Header.scss` | A8 | ≤ 1023: header CTA `min-height: 44px`, toggle 44 × 44, mobile menu `top: 58px` (was 44 at tablet); menu links `inline-flex`, min 44 × 44; desktop language links `margin-block: −4px`, so the 51 px desktop header is unchanged. |
| `src/components/molecules/LanguageSwitcher/LanguageSwitcher.scss` | A8 | `__link`: `inline-flex`, centered, `min-height: 44px`. |
| `src/components/organisms/ProjectsGrid/ProjectsGrid.scss` | A9 | `.projects-grid__item-title { min-height: 2lh }` at ≥ 601. |
| `src/components/organisms/ContactForm.test.tsx` | (approved addition) | The flaky "200 success → … focused" test now uses `await waitFor(() => expect(document.activeElement).toBe(status))`. `ContactForm` focuses the status in a `useEffect`. Test-only; `ContactForm.tsx` is unchanged. |

No copy, dictionary, CMS, media, prop, export or dependency change. Nothing from "Post-launch" or "Routed to 5c-rest".

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | **passed (vs budget)** | `next lint`: **83 errors / 81 warnings**, equal to the PR 2 budget (83 / 81). It exits 1 on the pre-existing baseline. No message is in a file changed here. |
| typecheck | **passed** | `tsc --noEmit` exit 0. |
| tests | **passed** | 48 files, **698 / 698**. `ContactForm.test.tsx`: 22 / 22. |
| build | **passed** | `ENABLED_LOCALES=en,fr,es npm run agent:build`. `.env.local` (confirmed by Mauricio as the local CMS) was not read; the local CMS GraphQL returned 200. |
| visual (routes · viewports · locales) | **passed** | 8 routes × en/fr/es × 375 / 768 / 1024 / 1440 = 96 runs: **all 200, 0 horizontal scroll**. Plus the M1 matrix (11 viewports × 3 locales). Real devices not checked (see the checklist). |
| axe | **passed** | 48 runs (8 routes × 3 locales × 375 / 1440), PR 2 build vs PR 3 build: **82 → 82 nodes, 0 worse, 0 better** (the pre-existing `region` / `heading-order` findings). |

## Acceptance criteria
Method: Playwright 1.62.1 (npx cache), Chromium, DPR 1, `reducedMotion: reduce`, scrolled, images awaited. The
server was `next start -p 3100` under my own PID, stopped afterwards; Mauricio's :3000 was off. The M1 geometry is
the spec's: CTA ring bottom = button bottom + 5, visible art top = image top + 0.155·S.

### M1 — home hero (final constants)
- **Phone (≤ 600):** margin `calc(28px − 15.5%) auto −12.8%`. The starting 28 measured 32 everywhere, so it is not
  tuned.
- **601–1023:** K 349, reserve 29 (spec values).
- **≥ 1024:** K **349** (spec 340), floor **400** (spec 420), cap 640, reserve 29.
- **1024–1031:** K **329**.

| Viewport | Gap EN / FR / ES | Art | Fold (vh − hero bottom) | AC |
|---|---|---|---|---|
| 1920 × 1080 | 45 / 45 / 45 | 640 | 209 (820 cap) | ≤ 50 ✓ |
| 1440 × 900 | 44 / 44 / 44 | **640** | **30** | ≤ 50 ✓ · art 640 ✓ · fold ✓ |
| 1280 × 720 | **33 / 33 / 33** | 404 | **30** | 32 ± 4 ✓ · fold ✓ |
| 1280 × 600 | 33 / 33 / 33 | 400 | −86 (content wins) | > 0 ✓ |
| 1024 × 768 | **33 / 33 / 33** | 499 | **30** | 32 ± 4 ✓ · fold ✓ |
| 1023 × 768 | 68 / 68 / 68 | 483 | 15 | > 0 ✓ |
| 768 × 1024 | 36 / 36 / 33 | 640 | 146 (820 cap) | ≤ 50 ✓ |
| 601 × 900 | 58 / 58 / 58 | 511 | 22 | > 0 ✓ |

Phone (EN / FR / ES; all 9 cells: gap **32**, CTA ring above the fold, 0 horizontal overflow):

| Viewport | Art = content width | Hero bottom (EN / FR / ES) | CTA ring bottom | Art bottom past hero bottom |
|---|---|---|---|---|
| 360 × 640 | 300 = 300 | 698 / 758 / 740 | 446 / 506 / 488 | 33 (= 0.128·S crop) |
| 375 × 667 | 315 = 315 | 709 / 709 / 717 | 446 / 446 / 454 | 35 |
| 390 × 844 | 330 = 330 | 694 / 720 / 702 | 420 / 446 / 428 | 37 |

- The hero ends where the art ends. The art runs past the hero bottom only by the intended 0.128·S crop, so there is
  no min-height space: hero bottom − art bottom = −0.128·S ≤ 1 ✓.
- **Content width is 300 / 315 / 330, not the spec's 330 / 345 / 360.** The spec counted one 15 px gutter per side,
  but `.main` and `.hero` each add 15 px. The rule (art = content width) holds; the computed hero bottoms are
  ≈ 15 px higher than the spec's (694 vs ≈ 710 at 390 × 844; 709 vs ≈ 725 at 375 × 667).
- Before (PR 2), for reference: gap EN 146 / 145 / 22 / 90 / 252 / 217 / 20 at 1920 / 1440 / 1280×720 / 1024 /
  768 / 390 / 375, identical to the spec's rev 2 figures.

### M2–M6, A1–A10 (en / fr / es unless noted)
| Item | Before (PR 2) | After | AC |
|---|---|---|---|
| M2 | H2 beside the body at ≥ 1024 (6 lines at 1440); body 30 / 24 / 24 / 20 | H2 on top at every width; EN H2 1 line at 1440, 2 at 768; body **20 / 18 / 18 / 16** px at 1440 / 1024 / 768 / 375; width 958 ≤ 70ch (958) at 1440; EN section 370 → 265 at 1440 | ✓ |
| M3 | `start` / `none` | both headings `center` / `uppercase` at 375 and 1440; `textContent` unchanged | ✓ |
| M4 | 768: 30 inside / 15 between; 375: 15 / 15 | 768: **15 / 60**; 375: **15 / 45** | ✓ |
| M5 | stacked, 1200 px wide (1440) | 1024 / 1440: same top, equal widths (467 / 585), height = content + padding; EN wrapper 820 → 603, ES 931 → 685; 375 and 768 heights unchanged (768 tops +12 from A8's header) | ✓ |
| M6 | 18/400 (1440), 16/400 | intro **600** at 375 / 768 / 1024 / 1440; labels 14–16 / 400, unchanged | ✓ |
| A1 | lead 30 > H3 24 (1440) | lead 16 / 18 / 18 / 20 < H3 18 / 20 / 20 / 24 at 375 / 768 / 1024 / 1440 | ✓ |
| A2 | panel bottoms spread 22–272 px | spread **0** at 1024 / 1440 | ✓ |
| A3 | min title → icon 0–2 px | min **30 / 17 / 13** (601–1440, 20 px steps) | ✓ ≥ 12 |
| A4 | join 15 / 15 / 30 / 35 (375 / 768 / 1024 / 1440) | **30 / 30 / 60 / 60** | ✓ |
| A5 | one-word last lines 100 / 196 multi-line h1–h4 | **5 / 199 (2.5 %)**, all at 375 / 768: the hero H1 "Development" in FR / ES (one long word), ES /projects "destacados" | ✓ ≤ 15 % |
| A6 | max 101 / 104 / 100 chars per line at 768 | **70 / 70 / 71** | ✓ ≤ 75 |
| A7 | 600 weight, 110 chars (EN 1440) | **400**, max **65 / 68 / 68** chars at 1440 | ✓ ≤ 70 |
| A8 | 375: menu links ×21, lang 16; 768: CTA ×32, toggle 24 × 24 | 375 / 768: CTA ×44, toggle 44 × 44, menu links ×44, lang 44 × 44; minimum side **44** | ✓ at 375 / 768 · **partial at 1024** (below) |
| A9 | description spread 30–34 px | **0** at 768 / 1024 / 1440 | ✓ |
| A10 | H3 above / below 10 / 10 | text box **31 / 11** (≤ 1024), **61 / 12** (1440) | ✓ ≥ 2× |

**A8 at 1024 (partial, reported per Mauricio).** The spec's fix limits the header CTA to ≤ 1023, so at 1024 the
measurements are:
- the desktop CTA is 32 px tall;
- the desktop nav links are 17 px tall, 15 px apart;
- the language links are now 44 px tall but 15–17 px wide (the fix is `min-height`).

WCAG 2.2 AA 2.5.8 still passes through the spacing exception. Routed to post-launch with A11 + B7 (buttons / header
pattern).

### No regressions
- 0 horizontal overflow in all 96 sweep runs and all 33 M1 cells.
- B5 fold at ≥ 601: 1440 × 900, 1280 × 720 and 1024 × 768 = 30 ✓. 768 × 1024 is capped at 820, as in PR 2
  (fold 146 vs 158; the −12 is A8's taller tablet header).
- **EN pixel diff** (`en-rowdiff-vs-2.json`, PR 2 vs PR 3 full pages, 375 / 768 / 1440). Every changed region maps
  to an item:

| Page | Changed regions → item |
|---|---|
| all pages, 768 | Everything from y ≈ 7 shifts 12 px: the tablet header 46 → 58 (**A8**). The other 768 changes are the per-page items below. |
| home | hero (**M1**); About (**M2**); final-CTA subtitle (**A7**) |
| /services | headings (**M3**); stacked rows (**M4**, image `display: block`); "Included…" join (**A4**); tablet measure (**A6**) |
| /packages | card title row (**A3**); white panels (**A2**); grey boxes in 2 columns at 1440 (**M5**); final CTA (**A7**) |
| /contact | intro weight (**M6**); final CTA (**A7**) |
| /about-magneto | lead size (**A1**); H3 spacing (**A10**); final CTA (**A7**) |
| /projects | title min-height, +30 at 1440 (**A9**); at 375 the final-CTA subtitle is one line shorter at weight 400 (**A7**, checked by crop) |
| project page | intro paragraph re-wrapped into 3 even lines (**A5** `pretty`, checked by crop); final CTA (**A7**) |
| /privacy-policy | one paragraph no longer ends on the orphan "secure." (**A5** `pretty`, checked by crop); other rag changes in long paragraphs (**A5**) |

No unmapped region was found. The A5 changes are re-wraps of the same text in the same width.

## Evidence
- Folder: `~/Documents/projects/magneto/backups/design-round/screenshots-after-3/`
  - `m1/`: hero viewport shots. `before_*` (PR 2), `phone1_*` (phone checkpoint), `wide1_*` (first ≥ 601 pass),
    `final_*`. Each set covers 11 viewports × en/fr/es.
  - `m1-{before,phone1,wide1,final}.json`, `items-{before,final}.json`, `a4-before.json`.
  - `before/` and `en|fr|es/`: 96 full pages each (8 routes × 3 locales × 375 / 768 / 1024 / 1440), with
    `before/sweep.json` and `sweep.json`.
  - `crops/`: before/after for M2–M6 and A7, plus **`M3-included-heading-intro_after_{en,fr,es}_1440.png`**, the
    heading + intro crop the spec asks Mauricio to judge.
  - `axe-before-3.json`, `axe-after-3.json`, `en-rowdiff-vs-2.json`.
  - `scripts/`: `m1.cjs`, `items.cjs`, `a4.cjs`, `tprobe.cjs`, `probe.cjs`, `crops.cjs`, `sweep.cjs` and
    `rowdiff-en.cjs` (from PR 2), `axe-run.cjs` (from PR 1b).
- **The PR 2 "before" set** was built in place from `1ae73f6`. The tree differed only by the test-only edit.
- **The PR 2 crops** came from a `git archive 1ae73f6` export in the session scratchpad, with `node_modules`
  symlinked and the env inline:
  - `ENABLED_LOCALES=en,fr,es`;
  - the local CMS URLs;
  - `DISABLE_SMTP=1`, `NO_INDEX=1`, `NEXT_PUBLIC_NO_INDEX=1`;
  - no analytics or Mailchimp variables.
- Commands (trimmed):
  ```
  npm run lint            → 83 errors / 81 warnings (budget 83 / 81); exit 1 (pre-existing baseline)
  npm run typecheck       → exit 0
  npm test -- --run       → Test Files 48 passed (48) · Tests 698 passed (698)
  ENABLED_LOCALES=en,fr,es npm run agent:build → ✓ Compiled successfully
  curl …/graphql (POST {__typename}) → 200
  ```
- No form was submitted. No `wp`, `--llm`, `npm install`, commit or push.

## Deviations from the spec
1. **M1, ≥ 1024: K 349 (spec 340) and floor 400 (spec 420).**
   - The spec's constant left out the 9 px `.hero-content` flex gap after the CTA.
   - With 349, 1280 × 720 needs ≈ 404 px of art. With the 420 floor the hero grew 11 px (fold 19).
   - Mauricio chose floor 400. Result at 1280 × 720: gap 33, fold 30.
2. **M1: the sub-band is 1024–1031 (K 329), not "1024–1279".**
   - The text block is 231 px only at 1024–1031; from 1032 it is 251 (FR 301 up to 1143).
   - A 1024–1279 constant would oversize the art from 1032 up. Mauricio's decision.
3. **M1 phone:** the spec's content-width numbers (330 / 345 / 360) are 30 px too wide (see M1). No code impact.
4. **A6 / A7: 46ch, not 70ch / 60ch.**
   - In DM Sans 1ch ≈ 1.45 average characters. At 768, 70ch = 862 px (wider than the 738 px column, a no-op), and
     60ch ≈ 87 characters at 1440.
   - 46ch meets the spec's ACs (≤ 75 / ≤ 70). Mauricio's decision.
   - A6 also covers `.services-group__intro` at 601–1023, for the same reason.
5. **A7: centered with `padding-inline`, not `margin-inline: auto`.** The `<p>` carries `m-0`
   (`margin: 0 !important`).
6. **A10: `padding-top` instead of margins.** The about H3s carry `m-0`. The flex gap 10 + padding 20 / 50 gives
   the spec's 30 / 60 above and 10 below.
7. **M4 / A4: `.service-image { display: block }`.**
   - It removes a 5 px inline descender gap under the service images. That gap made the "inside" spacing 20 / 35
     instead of 15 / 30, and the 1440 join 35 instead of 30.
   - It is in `Services.scss` (listed). /services is the only page affected.
8. **A8: the tablet header is now 58 px (was 46).** This is a consequence of the 44 px CTA / toggle, which the spec
   anticipates:
   - the ≤ 1023 fold offset is 58 + 15;
   - the tablet mobile menu now starts at 58 px (it was 44 under a 46 px header);
   - the desktop header stays 51 px through `margin-block: −4px` on the language links.
9. **Added after the spec (Mauricio, 2026-11-12): /packages boxes outlined, not filled.**
   - `1px solid $gray-50` and no grey fill (`background-color: transparent`) on the two `.packages-sections__item`
     boxes, only in M5's 2-column layout (≥ 1024).
   - Measured in en/fr/es: border + transparent background at 1024 / 1440; at 375 / 768 / 1023 no border and the
     `$gray-30` fill as before; no other element in `<main>` gained a border; box positions unchanged.
   - Mauricio checked it visually on his dev server.
   - Crop: `crops/M5-packages-boxes_border_en_1440.png`.
   - **Build for this change.** Mauricio's dev server was running on :3000 by then, so `agent:build` (correctly)
     refused to build in the repo's `.next`. The change was built and measured from a copy of the working tree in
     the session scratchpad (own `.next`, env inline as above, no `.env*` copied) and served on :3100 under my PID.
     It is SCSS only: lint, typecheck and tests are unaffected. Their results above are from the tree before this
     one rule.
10. **Approved file-list addition: `ContactForm.test.tsx`** (CI flake fix). This replaces "no test edits".
11. **Report path:** `docs/reports/design-round-3.md` (Mauricio) instead of the spec's `design-round-pr3.md`.

## Issues found (not fixed)
- **A8 at 1024:** desktop CTA 32 px, nav links 17 px, language links 15–17 px wide. Post-launch, with A11 + B7.
- **M1 tablet gaps are above the target:** 1023 × 768 = 68 and 601 × 900 = 58. No AC applies (> 0 only), and both
  are larger than the reserve because the tablet text block is shorter than the spec's 275. A per-band K like the
  1024 one would bring them to ≈ 32 if wanted.
- **A5:** "Development" is the last line of the FR / ES hero H1 at 375 / 768. It is a single long word that
  `balance` cannot pair, so it is not a defect of the rule.
- **`typography.scss` is `@import`ed by about 10 component stylesheets,** so every rule in it (now including the two
  A5 rules) is emitted once per importer. This is pre-existing. The copies are identical, so cascade order can't
  change them. A `@use`/partial split would fix it in a tooling phase.
- **FR/ES content (5c-rest):** the home About is the legacy short copy (FR/ES section 103–139 px), and ES /projects
  has the test prefixes. Re-check M2 after the 5c-rest load, as the spec notes.

## Note for `docs/specs/design-round.md`
B5 amendment: **the "home hero fills the first screen" rule no longer applies at ≤ 600 px.** On phone the hero ends
where the illustration ends (`min-height: 0`), and the next section can start in view, for example at 390 × 844 the
hero ends at 694 px. B5 still applies at ≥ 601 (1440 × 900, 1280 × 720 and 1024 × 768 fold = 30; capped at 820).

## Preview review — 10-minute checklist for Mauricio
Desktop (Chrome, about 1440 × 900, then resize):
1. **Home hero:**
   - the illustration is bigger (640 px);
   - the CTA → illustration gap is about 44 px;
   - the hero ends 30 px above the window bottom.
   Then shrink the window to about 1280 × 720: the gap is about 33 px and nothing overlaps.
2. **Home About:** the title is on one line above a smaller paragraph, and the section is shorter.
3. **/services:**
   - "CORE SERVICES" and "INCLUDED WHERE YOUR PROJECT NEEDS IT" are centered and uppercase.
   - Judge the left-aligned intro under the centered heading (crop `M3-included-heading-intro_after_en_1440.png`).
   - The space above "Included…" is 60 px.
4. **/packages:**
   - the BUILD / FIX / CARE white panels end on one line, with no grey void;
   - the two info boxes below sit side by side at their own heights, outlined with a 1 px border and no grey fill
     (≥ 1024 only; grey boxes below 1024).
5. **/contact:** the three intro lines are semi-bold.
6. **/about-magneto:** the lead text is smaller than the H3s, and the H3s sit closer to their own text.
7. **Final CTA:** the subtitle is regular weight on a narrower measure. Check that the two or three lines still read
   well.
8. **/projects:** in a row with a two-line title, the descriptions start on the same line.

Real phone (iPhone, Safari):

9. **Home:**
   - the illustration is full width under the CTA, about 32 px below the button ring;
   - the hero ends at the illustration's bottom, and the next section shows when you scroll.
   - Check with the Safari toolbar both shown and hidden (svh).
10. **Header:**
    - the "Reservar consulta" / CTA button and the ☰ toggle are easy to tap;
    - open the menu: the links and EN / FR / ES are easy to tap, and the menu starts right under the header.

Also open one FR and one ES page (home + /services) on each device.

## Proposed commits
1. `test(contact): wait for the success-status focus set in useEffect` — `ContactForm.test.tsx`
2. `feat(design): design round PR 3 — home hero art scales with height, phone hero ends at the art (M1)` —
   `Hero.scss`
3. `feat(a11y): design round PR 3 — 44 px header and menu tap targets (A8)` — `Header.scss`,
   `LanguageSwitcher.scss`
4. `style(design): design round PR 3 — about, services, packages, contact and type polish (M2–M6, A1–A7, A9, A10)` —
   all the other listed files
5. `style(packages): outline the two-column info boxes at ≥ 1024 (border, no fill)` — `PackagesContentSections.scss`
   (added after the spec)
6. `docs(report): design round PR 3 report` — `docs/reports/design-round-3.md`

(Commits 2 and 3 interact through the fold offset: 3 changes the header height that 2 reads. Squash-merge as one
PR.)

## Time
- Agent: about 4 h.
- Waiting on Mauricio's decisions: 3 questions (about 10 min).
- Active human time: unknown.
