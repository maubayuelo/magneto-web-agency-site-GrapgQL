# Design round — PR 3 (polish): UX/UI review of the PR 2 build + Mauricio's manual review

- Status: **Approved** (Mauricio, 2026-11-12)
- Revisions: rev 1 — Architect review (Groups A/B); rev 2 — Group M, options and measurements; **rev 3 — Mauricio's
  decisions (this file)**. All revisions are dated 2026-11-12.
- Author: Architect (senior UX/UI review) · Reviewed by: Mauricio (+ Senior Architect)
- Base: `feat/design-round-2-visual` `0305e5c` (PR 2)
- Depends on: `docs/specs/design-round.md` rev 4.1 (Part B decisions B1–B10). This spec **amends** two of its
  decisions:
  - **B5:** the home-hero fold rule no longer applies at ≤ 600 px (M1 phone);
  - **PR 3:** "no new item" is replaced by D-0.

## Goal
Last design pass before launch. Fix the measurable defects (Group A) and Mauricio's manual-review items (Group M).
CSS first, with className swaps where stated. No copy, dictionary, CMS or media change: those are listed under
"Routed to 5c-rest". Anything L-sized or changing an approved global pattern is listed under "Post-launch".

## Decisions (Mauricio, 2026-11-12)

| ID | Decision |
|---|---|
| D-0 | Group A is in scope for PR 3 through this spec. |
| M1 | **Option A**: the art scales with the hero height, up to 640 px; the 820 px cap is kept. **Gap under the CTA ≈ 32 px**. **The phone hero (≤ 600) is in scope:** the art grows to the content width, and the hero ends where the art ends (no fold min-height on phone). Zero overlap in EN/FR/ES is the hard rule; check 375 × 667, 390 × 844 and 360 × 640. |
| M2, M4 | Accepted as recommended. |
| M3 | **Both** group headings ("Core Services" and "Included Where Your Project Needs It") centered and uppercase. |
| M5 | Two columns at ≥ 1024; **the boxes keep their own heights** (`align-items: start`). |
| M6 | Weight 600 at **every width**. |
| A1–A10 | Accepted. |
| A11 + B7, B1, B2, B4, B6 | Post-launch. |
| B5 | 5c-rest (CMS field). |
| 5c-rest | The ES running text changes to match the new CTA wording ("reserva una consulta gratis"). The 1400 px+ hero-art export is optional. |

## Evidence (how it was measured)

**Build and server.** Mauricio's `next dev` was running on :3000 against this repo's `.next`. To avoid sharing
`.next`, commit `0305e5c` was exported (`git archive`) into the session scratchpad, with `node_modules` symlinked. It
was built there with the env passed inline (`env -i`):
- `ENABLED_LOCALES=en,fr,es`;
- the local CMS (`http://magneto-cms-2.local/graphql`);
- `DISABLE_SMTP=1`, `NO_INDEX=1`;
- no analytics or Mailchimp variables.

`.env.local` was not read or copied. `next start -p 3100` ran under its own PID, which was stopped afterwards. No form
was submitted.

**Capture.**
- Tools: Playwright 1.62.1 from the existing npx cache (nothing installed), Chromium, DPR 1, `reducedMotion: reduce`.
  Each page was scrolled in 70 % steps, and the script waited for images (4 s cap) before measuring.
- Rev 1: 8 routes × en/fr/es × 375/768/1024/1440 = 96 full pages.
- Rev 2:
  - home hero at 7 fold viewports × 3 locales;
  - home About, `/services`, `/packages` and `/contact` at 375/768/1024/1440 × 3 locales.

  Each was measured as built and with the proposal CSS injected (`addStyleTag`). No source file was changed.
- The rev 3 phone-hero design (M1 phone) is **computed, not yet measured**. It is the Dev's first verification step
  (see M1).

**Files** (`~/Documents/projects/magneto/backups/design-round/`):
- Rev 1 — `ux-review/`:
  - `full/*` (96);
  - `states/*`;
  - `crops/Axx-*.png`, `crops/Bxx-*.png`;
  - `data/measure.json`, `data/states.json`.
- Rev 2 — `ux-review-m/`:
  - `m-base.json`, `m-optA.json`, `m-optB.json` and `prop/m-prop.json`;
  - `shots/M1-hero_{base,optA,optB}_{en,fr,es}_{1920x1080,1440x900,1280x720,768x1024,390x844}.png`;
  - `pairs/M2…M6_{before,after,afterStart}_*.png`.

**Checks with no defect (rev 1):**
- 0 / 96 captures overflow horizontally.
- No text below 4.5:1 on solid backgrounds; the mobile menu is 4.67:1.
- A visible focus ring on every stop of a 14-stop tab run.
- **Booking modal:** opens in all 9 combinations; 44 px close button; focus goes to the first input; it scrolls at
  375 × 600.
- **Mobile toggle:** 44 × 44 at 375.

---

## Group M — Mauricio's manual review

### M1 — Home hero: larger art, CTA gap ≈ 32 px, at every width (decided: Option A + phone)

**Facts (measured, rev 2).**
- **Today's gap** from the CTA ring bottom to the visible art top (art top + 0.155·S), px:

  | Viewport | 1920 × 1080 | 1440 × 900 | 1280 × 720 | 1024 × 768 | 768 × 1024 | 390 × 844 | 375 × 667 |
  |---|---:|---:|---:|---:|---:|---:|---:|
  | Gap (EN) | 146 | 145 | 22 | 90 | 252 | 217 | 20 |
  | Gap (FR / ES) | = EN | = EN | = EN | = EN | ES 222 | 191 / 209 | 20 |

  At ≥ 1024 the H1 is 2 lines in all three locales.
- **Today's mechanism (`Hero.scss:55-147`):**
  - `min-height: min(100svh − fold offset, 820px)` (B5);
  - at ≥ 601 the art is absolutely positioned, at a fixed size per band (340 / 420 / 500 px);
  - `.hero-content` reserves `padding-bottom = 0.845·S − 0.128·S + 17`;
  - any min-height left over goes into the CTA → art gap;
  - at ≤ 600 the art is in flow (max 260 px), and `.hero-cta-wrapper { margin-bottom: auto }` pushes the leftover space
    into the gap.
- **The art asset (local CMS) is 1000 × 1000.** Query, trimmed:
  `pages(first:1, where:{name:"home", language:"en"}) { nodes { heroContent { image { node { sourceUrl mediaDetails { width height } } } } } }`
  → `".../2026/11/magneto-hero-phone-1.png"`, `{"width":1000,"height":1000}`.
  - `WpResponsiveImage` sends `sizes` of `100vw` at ≤ 600 and `1024px` at desktop, so the 1000w file is served.
  - Above 500 CSS px at DPR 2 (or about 333 px at DPR 3) the art is upscaled. It looks slightly soft, but nothing
    breaks. The optional 1400 px export is in 5c-rest.

**Design — ≥ 601 (Option A, measured in rev 2 with a 29 px reserve).**

```scss
// ≥ 1024 (replaces the 420 / 500 bands). 340 = padding-top 60 + text block 251 (H1 → CTA at 1280–1440) + 29.
--hero-h: min(calc(100svh - 81px), 820px);
--art: clamp(420px, calc((var(--hero-h) - 340px) / 0.717), 640px);
// 601–1023 (replaces 340). 349 = 45 + 275 + 29. The upper bound is raised to 640 (rev 2 measured it with 560).
--hero-h: min(calc(100svh - 61px), 820px);
--art: min(clamp(340px, calc((var(--hero-h) - 349px) / 0.717), 640px), calc(100vw - 60px));
// both bands
.hero-content { padding-bottom: calc(0.717 * var(--art) + 29px); }
.hero-image   { max-width: var(--art); max-height: var(--art); bottom: calc(-0.128 * var(--art)); }
```

- **Gap target ≈ 32 px.**
  - With the 29 px reserve, the measured gap was 33 px wherever the art was not clamped and the text block matched
    the constant (1280 × 720 in all locales). So **29 px is the starting value**.
  - The Dev tunes the reserve so that 1280 × 720 measures 32 ± 4.
- **Known limits (measured, so accepted rather than defects):**
  - **Art at its 640 cap:** at 1440 × 900 and 1920 × 1080 the art hits 640, and the gap is **44–45 px**. Reaching
    32 px there needs about 668 px of art, which is beyond the decided cap.
  - **Text block at 1024 is 20 px shorter** (231 vs 251), so 1024 × 768 measured **44**. The Dev may add one constant
    for the 1024–1279 sub-band (`K = 60 + T + reserve`, with T measured) to bring it to 32 ± 4. Same file; this is a
    value tweak.
  - **Tablet (768 × 1024):** rev 2 measured 93 px (ES 63) with the art capped at 560. With the upper bound now 640, the
    expected gap is about 45 px; it must be verified.
- **Overlap.** It is impossible by construction: the padding reserve is computed from the same `--art`. Longer text
  makes the hero taller, so the gap never shrinks below the reserve.

**Design — ≤ 600 (phone, new in rev 3; computed, verify first).**
- `.hero.hero-home { min-height: 0; }` at ≤ 600. The hero ends where the art ends; the B5 fold rule no longer applies
  to the home hero on phone.
- `.hero-cta-wrapper { margin-bottom: 0; }`, so no leftover space is pushed into the gap.
- `.hero-image` at ≤ 600:
  - `max-width: 100%; max-height: none; width: 100%` — the art = the content width: 330 at 360, 345 at 375,
    360 at 390, 570 at 600;
  - `margin: calc(28px − 15.5%) auto −12.8%`.
  - Vertical margin percentages resolve against the containing block's width, which equals S here. So:
    - `−15.5 %` cancels the art's transparent top;
    - `−12.8 %` keeps today's bottom crop (0.128·S);
    - the 28 px starting value plus the `.hero-content` `gap: 9px` gives a 37 px ring-bottom → art distance, i.e. a
      32 px gap after the 5 px ring.
  - The Dev tunes the 28 so that 390 × 844 measures 32 ± 4.
- The hero `padding-bottom` stays 0, and `overflow: hidden` keeps cropping the bleed.
- **Expected (computed, EN):**
  - 390 × 844: the hero ends at ≈ 710 px, so the next section starts in view;
  - 375 × 667: the hero ends at ≈ 725 px, and the CTA ring bottom (≈ 446) stays above the fold;
  - 360 × 640: verify.
- No overlap is possible: the art is in flow, under the CTA.

**Screenshots of the Option A decision:** `ux-review-m/shots/M1-hero_optA_*`. There are no phone screenshots yet; the
Dev attaches them.
- **Files:** `src/components/organisms/Hero/Hero.scss` (the `&.hero-home` block only). No TSX or prop change.
- **Effort:** M (two bands + phone + the viewport matrix) · **Risk to EN:** medium. It is the approved home hero; the
  change is intended.
- **Interactions:**
  - A5 (`text-wrap: balance`) and A8 (header height at ≤ 1023) can change the text block or the fold offset. Apply
    them **before** the final M1 tuning, and update the 81 / 61 px offsets if A8 changes the header height.
  - 5c-rest's shorter ES CTA label stops the ES CTA wrapping at 768; the gap stays ≥ the reserve either way.

### M2 — Home About: H2 on top at full width, body smaller (decided; includes A1's home part)
- **Before:**
  - H2 `typo-3xl-extrabold` and body `typo-3xl-medium`: the same size (30 / 24 / 24 / 20 px at 1440 / 1024 / 768 /
    375);
  - at ≥ 1024 the H2 is in a 250 px column: 6 lines at 1440, 4 at 1024.
- **Change:**
  - stack at every width (remove the ≥ 1024 row layout and the 250 px width); `gap: $spacing-15`;
  - body → `typo-xl-medium` (className only): 20 / 18 / 18 / 16 px;
  - body `max-width: 70ch`, left-aligned.
  - No copy change.
- **Measured after (EN):**

  | Width | H2 | Body | Section height |
  |---|---|---|---|
  | 1440 | 1 line, 1200 px | 20 px, 958 px wide | 370 → 265 |
  | 1024 | 1 line | 18 px | — |
  | 768 | 2 lines | 18 px | — |
  | 375 | 3 lines | 16 px | — |

  Crops: `pairs/M2-about_*`.
- **Files:** `AboutSection/index.tsx` (className only), `AboutSection.scss`. **Effort:** S · **Risk to EN:** medium
  (intended).
- **5c-rest note:** Mauricio may restructure this copy in all three languages (short title + lead sentence + shorter
  paragraph). Re-check the layout after the load.

### M3 — /services: both group headings centered and uppercase (decided)
- **Before:** `.services-group__heading` is `text-align: start; text-transform: none` for both groups, in en/fr/es
  at every width.
- **Change:** `.services-group__heading { text-align: center; text-transform: uppercase; }`. This covers "Core
  Services" and "Included Where Your Project Needs It" (FR "Inclus selon les besoins de votre projet", ES "Incluido
  según lo que necesite tu proyecto"). The DOM text is unchanged.
- **Not changed:** the "Included…" intro paragraph stays left-aligned, 70ch. The Dev attaches a 1440 crop of the
  heading + intro to the report so Mauricio can judge the alignment; any change to it is post-launch.
- **Measured (core heading, rev 2):** center + uppercase in en/fr/es; FR fits on one line at 375. Crops:
  `pairs/M3-core-heading_*`.
- **Files:** `Services.scss`. **Effort:** S · **Risk to EN:** low.

### M4 — /services stacked rows: proximity (decided)
- **Before** (core rows at ≤ 1023):

  | Width | Image → own text | Text → next image |
  |---|---:|---:|
  | 768 | **30** | **15** (inverted) |
  | 375 | 15 | 15 |

- **Change** (≤ 1023, core rows): `gap: 15px` inside a service. Between services, `padding-bottom` on
  `:not(:last-child)` of 45 px at ≤ 600 and 60 px at 601–1023. The last row's join to the next group stays with A4.
- **Measured after:** 768 → 15 / 60; 375 → 15 / 45, in en/fr/es. Crops: `pairs/M4-services_*`.
- **Files:** `Services.scss`. **Effort:** S · **Risk to EN:** low.

### M5 — /packages ≥ 1024: the grey boxes in two columns, natural heights (decided)
- **Before:** both boxes are full width (1200 px at 1440); the body is capped at 70ch (766 px). There are 2 sections in
  en/fr/es.
- **Change:**

  ```scss
  @include media-desktop-up {
    .packages-sections:has(> .packages-sections__item:nth-child(2):last-child) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $spacing-30;
      align-items: start;
    }
  }
  ```

  With 1 or 3+ sections the boxes stay stacked. CSS only; no markup or CMS change.
- **Measured after (1440):** columns 585 px wide with a 525 px body. The wrapper is EN 820 → 603 and ES 931 → 685.
  There is no grey void; the left box ends higher, by design. Crops: `pairs/M5-packages-boxes_afterStart_*`.
- **Files:** `PackagesContentSections.scss`. **Effort:** S · **Risk to EN:** low.

### M6 — /contact: intro paragraphs in weight 600 at every width (decided)
- **Before:** the three `.contact-form-header p` are `typo-lg-medium` (18/400 at 1440, 16/400 below). Labels are 16/400
  at 1440 and 14/400 at 375.
- **Change:** `typo-lg-medium` → `typo-lg-bold` on the three paragraphs (className only): 600 at every width.
- **Measured after:** 18/600 at 1440 in en/fr/es; labels unchanged. Crops: `pairs/M6-contact-intro_*`.
- **Files:** `app/[locale]/contact/page.tsx` (className only). **Effort:** S · **Risk to EN:** low.

---

## Group A — objective defects (accepted)

| # | Defect (evidence in rev 1 crops) | Fix | Files |
|---|---|---|---|
| A1 | `/about-magneto`: the lead paragraphs are 30 px vs H2 36 / H3 24 (`A01-about-lead_fr_1440.png`). The home part is M2. | Lead → `typo-xl-medium` (className only). | `app/[locale]/about-magneto/page.tsx:56,60` |
| A2 | Package cards: 213–287 px of grey void under BUILD/FIX at 1024/1440 (`A02-…`). | The last zone of `.package-card--rich` grows (`flex: 1` / `align-self: stretch`). | `PackageCard.scss` |
| A3 | Package title 1–4 px from its icon (ES 1024–1100, FR 1280) (`A03-…`). | `&__title-row { gap: 12px }`, `&__icon { flex-shrink: 0 }`. | `PackageCard.scss:30-38` |
| A4 | The "Included…" H2 is 15 px under the CARE CTA at 768 (35 px at 1440) (`A04-…`). | `mt-*-responsive` on the supporting group, to give the 30 / 30 / 60 rhythm. | `Services.scss` (or a class in `ServicesList.tsx`) |
| A5 | 103 / 191 multi-line headings end on one word (`A05-…`). | `h1–h4 { text-wrap: balance }`, `p { text-wrap: pretty }`. | `styles/typography.scss` |
| A6 | Services tablet lines run 80–98 characters (`A06-…`). | `max-width: 70ch` at 601–1023. | `Services.scss` |
| A7 | The final-CTA subtitle is 600 weight at 94–106 characters per line (`A07-…`). | Weight 400, `max-width: 60ch; margin-inline: auto`. | `FinalCTASection.scss` |
| A8 | Tap targets < 44 px: tablet header CTA ×32, toggle 24 × 24 at 768, menu links ×21, language links ×16–22 (`A08-…`). | 44 px toggle at ≤ 1023; links `min-height: 44px`; header CTA `min-height: 44px` at ≤ 1023. If the header height changes, update the fold offsets in `Hero.scss` (M1). | `Header.scss`, `LanguageSwitcher/*.scss` |
| A9 | Project-card descriptions are offset 30–34 px when a title wraps (`A09-…`). | `min-height: 2lh` on the title at ≥ 601. | `ProjectsGrid.scss` |
| A10 | About-page H3s are spaced 10 / 10 (`A10-…`). | `.about-section h3 { margin: 30px 0 10px }` (60 px top at ≥ 1025); the first child keeps 0. | `styles/pages/about.scss` |

## Group B and A11 — outcome
| # | Item | Outcome |
|---|---|---|
| A11 + B7 | Paired buttons 50 vs 54 px; one case for primary buttons | Post-launch |
| B1 | Sticky media (services rows, About photo) | Post-launch |
| B2 | A fixed price spot on package cards | Post-launch (content) |
| B3 | Narrow info-box panels | Superseded by M5 |
| B4 | Lone project card at tablet | Post-launch |
| B5 | FIX / CARE share an icon on home. **Fact:** ACF `homeFeaturedServices.service[].serviceIcon` on the EN home; FR/ES use the EN original (`FeaturedServices/api.ts:41`). | 5c-rest |
| B6 | Project page: early CTA, intro measure, gallery cap | Post-launch |

---

## Routed to 5c-rest (content/CMS — not PR 3)

1. **ES main CTA label (decided 2026-11-12): "Reservar consulta gratis"** (24 characters; it matches the header's
   "Reservar consulta").
   - Apply it in:
     - **Notion** (canonical) and `docs/content/magneto-copy-es.md`, which has 23 lines with "llamada de
       orientación", 10 of them "CTA:" lines;
     - **the dictionary** (`src/i18n/dictionaries/es.ts:8`, `common.bookStrategyCall`), and the assertions in
       `src/i18n/dictionary.test.ts:68` and `src/components/organisms/FinalCTASection/FinalCTASection.test.tsx:19`;
     - **the CMS CTA fields**: the 9 occurrences in `scripts/phase-5c/content/es.json`, plus
       `scripts/phase-5c/content.test.ts:25`, loaded with the 5c loader.
   - Change the dictionary and the CMS fields in the same change: the 5g `main-cta` check compares CMS CTA labels with
     the dictionary value at runtime (`scripts/qa-i18n/checks.ts:209`).
   - **QA glossary:**
     - `glossary.json` has no "llamada de orientación" term. The main CTA is checked through `ctaLabels` →
       `common.bookStrategyCall`, so it follows the new value.
     - Update the `header.scheduleCall` note ("differs from the main CTA on purpose") and the eval fixture
       `scripts/qa-i18n/evals/fixture/dictionaries/es.ts:4`.
     - The current label (43 characters) exceeds the `cta-label` limit of 38; the new one passes.
2. **ES running text (decided):** match the new CTA wording, "reserva una consulta gratis".
   - `es.ts:113` `contactForm…sendFailed`: "…Inténtalo de nuevo o agenda una llamada de orientación gratuita." →
     "…o **reserva una consulta gratis**."
   - `es.ts:114` `sendFailedCta`: → "reserva una consulta gratis". It must stay an exact substring of `sendFailed`.
   - `es.ts:158` booking-modal `privacyText`: "Agendar una llamada no te suscribe…" → the same wording in its
     infinitive form ("Reservar una consulta no te suscribe…"). Mauricio confirms the exact sentence in Notion first
     (AGENTS rule 4).
3. **Footer line on FR/ES:** "Based in Montreal | Serving clients worldwide" (EN text).
4. **/es/projects:** English text, plus "[ES TEST] TRÉPIED" and "[FR TEST]" prefixes on titles and descriptions; the
   ES project subtitle is in EN.
5. **The ES/FR home is missing the three core services:** the legacy cards are shown, plus an icon-only third card,
   with the legacy "Meet Magneto" and final-CTA copy. 5c-rest acceptance adds a code guard: `FeaturedServices` skips
   an item with no title.
6. **M2 copy restructure (optional):** short title + lead sentence + shorter paragraph, in 3 languages.
7. **B5:** a distinct CARE icon in the EN home's `serviceIcon` field.
8. **Hero art export (optional):** 1400 × 1400 or larger (media replace on the same attachment), for Retina sharpness
   above 500 px (desktop) and about 333 px (DPR 3 phones).

## Post-launch
- A11 + B7 — button height and case (a global pattern).
- B1 — sticky media.
- B2 — a price line on package cards (content).
- B4 — lone project card at tablet.
- B6 — project page: CTA, measure, gallery.
- The alignment of the "Included…" intro paragraph under the now-centered heading, if Mauricio wants it changed after
  seeing the M3 crop.

## Things that are fine — do not touch in PR 3
- The booking modal.
- The `/contact` form and its illustration column (only M6's className changes).
- The privacy page.
- The B3 type tokens.
- The B2 packages tablet columns.
- The B5 fold rule at ≥ 601 (kept by M1 Option A).

## What this review could not judge
- **Real phones:** the iOS dynamic toolbar vs `svh`; real taps; the Calendly hand-off.
- **Motion:** captures used reduced motion.
- **Brand feel.**
- **DPR 2–3 sharpness:** the M1 upscale figures are computed, not seen.
- **Fonts:** Windows/Firefox rendering was not checked.

---

## Decision table (final)

| # | Item | Effort | EN risk | Decision |
|---|---|---|---|---|
| D-0 | PR 3 takes new items via this spec | — | — | **In PR 3** |
| M1 | Home hero: Option A ≥ 601 (art ≤ 640, cap 820), gap ≈ 32; phone art = content width, no phone min-height | M | Med | **In PR 3** |
| M2 | Home About stacked, body `typo-xl-medium`, 70ch | S | Med | **In PR 3** |
| M3 | Both services group headings centered + uppercase | S | Low | **In PR 3** |
| M4 | Services stacked rows 15 inside / 45–60 between | S | Low | **In PR 3** |
| M5 | Packages boxes 2 columns ≥ 1024, natural heights | S | Low | **In PR 3** |
| M6 | Contact intro weight 600, every width | S | Low | **In PR 3** |
| A1 | About-page lead → `typo-xl-medium` | S | Low–Med | **In PR 3** |
| A2 | Package card grey void | S | Low | **In PR 3** |
| A3 | Package title / icon gap | S | None | **In PR 3** |
| A4 | "Included…" join 30 / 30 / 60 | S | Low | **In PR 3** |
| A5 | `text-wrap: balance / pretty` | S | Low | **In PR 3** |
| A6 | Services tablet measure 70ch | S | Low | **In PR 3** |
| A7 | Final-CTA subtitle 400, 60ch | S | Med | **In PR 3** |
| A8 | Tap targets ≥ 44 px | S–M | Low–Med | **In PR 3** |
| A9 | Project title `min-height: 2lh` | S | Low | **In PR 3** |
| A10 | About H3 spacing | S | Low | **In PR 3** |
| A11 + B7 | Button height / case | S | Med | Post-launch |
| B1 | Sticky media | S | Low | Post-launch |
| B2 | Package price spot | M | Med | Post-launch (content) |
| B3 | Info-box panels | — | — | Superseded by M5 |
| B4 | Lone project card | S | Low | Post-launch |
| B5 | Distinct FIX / CARE icons | S | Low | 5c-rest (CMS field) |
| B6 | Project page | M | Low–Med | Post-launch |

## Files the Dev may touch
- `src/components/organisms/Hero/Hero.scss` — M1 (the `&.hero-home` block only, all bands including ≤ 600)
- `src/components/organisms/AboutSection/index.tsx` (className only), `AboutSection.scss` — M2
- `src/app/[locale]/services/Services.scss` — M3, M4, A4, A6
- `src/app/[locale]/services/ServicesList.tsx` — class names only, and only if A4 uses a helper class
- `src/components/organisms/PackagesContentSections/PackagesContentSections.scss` — M5
- `src/app/[locale]/contact/page.tsx` (className only) — M6
- `src/app/[locale]/about-magneto/page.tsx` (className only) — A1
- `src/styles/pages/about.scss` — A10
- `src/components/molecules/PackageCard/PackageCard.scss` — A2, A3
- `src/styles/typography.scss` — A5
- `src/components/organisms/FinalCTASection/FinalCTASection.scss` — A7
- `src/components/organisms/Header/Header.scss`, `src/components/molecules/LanguageSwitcher/*.scss` — A8
- `src/components/organisms/ProjectsGrid/ProjectsGrid.scss` — A9
- `docs/reports/design-round-pr3.md` — the report

Any other file is out of scope. If an item cannot be done within these files, stop and report. Existing tests must
pass unchanged: no snapshot or test edits are expected, because only class names and CSS change.

## Out of scope
- Copy of any kind: the dictionaries, CMS content and media, and everything in "Routed to 5c-rest" (including the
  ES CTA and running-text changes).
- Props, exports, new components, dependencies, the `next/link` nav migration (Known debt D1).
- Everything in "Post-launch".

## Acceptance criteria
- [ ] Completion gate: `npm run lint && npm run typecheck && npm test -- --run && npm run build`. The lint count is
  ≤ the PR 2 baseline.
- [ ] Re-capture with the rev 1/2 method: 8 routes × en/fr/es × 375/768/1024/1440, plus the M1 viewport matrix
  below. Attach before/after crops for every item to the report.
- [ ] **M1 ≥ 601**, in en/fr/es:
  - [ ] **No overlap:** CTA ring bottom → visible art top **> 0** at 1920 × 1080, 1440 × 900, 1280 × 720, 1280 × 600,
    1024 × 768, 1023 × 768, 768 × 1024 and 601 × 900.
  - [ ] **Gap:** **32 ± 4 px** at 1280 × 720 and 1024 × 768; **≤ 50 px** at 1440 × 900, 1920 × 1080 and 768 × 1024 (the
    art is capped at 640 there).
  - [ ] **Art size:** 640 px at 1440 × 900.
  - [ ] **Fold:** hero bottom = viewport − 30 ± 2 px at 1440 × 900, 1280 × 720 and 1024 × 768 (B5 kept at ≥ 1024).
- [ ] **M1 ≤ 600**, in en/fr/es at 360 × 640, 375 × 667 and 390 × 844:
  - [ ] **No overlap:** gap > 0.
  - [ ] **Gap:** **32 ± 4 px**.
  - [ ] **Art width:** equals the content width (330 / 345 / 360 px).
  - [ ] **Hero bottom:** the hero ends at the art's visible bottom. No min-height space: hero bottom − art bottom
    ≤ 1 px, after the crop.
  - [ ] **CTA:** the CTA ring bottom is above the fold (≤ viewport height).
  - [ ] **Overflow:** 0 horizontal overflow.
- [ ] **M2:**
  - [ ] the H2 is above the body at every width;
  - [ ] the H2 is 1 line at 1440 and ≤ 2 lines at 768 (EN);
  - [ ] the body is 20 / 18 / 18 / 16 px at 1440 / 1024 / 768 / 375;
  - [ ] the body width is ≤ 70ch.
- [ ] **M3:**
  - [ ] both `.services-group__heading` elements compute `text-align: center` and `text-transform: uppercase` in
    en/fr/es at 375 and 1440;
  - [ ] their `textContent` is unchanged.
- [ ] **M4:** core rows at 768: 15 ± 1 / 60 ± 1; at 375: 15 ± 1 / 45 ± 1, in en/fr/es.
- [ ] **M5:**
  - [ ] at 1024 and 1440 the two boxes share a row (tops within 1 px) and are equal width;
  - [ ] each box's height = its content + padding (no stretch);
  - [ ] 768 and 375 are identical to today's.
- [ ] **M6:**
  - [ ] the intro paragraphs compute `font-weight: 600` at 375, 768, 1024 and 1440 in en/fr/es;
  - [ ] the labels are unchanged (400).
- [ ] **A1:** the About-page lead font-size is < the H3 font-size at every width.
- [ ] **A2–A10:**
  - [ ] A2: panel bottoms within 2 px;
  - [ ] A3: title-to-icon gap ≥ 12 px from 601 to 1440, in 20 px steps;
  - [ ] A4: join 30 / 30 / 60 ± 2;
  - [ ] A5: one-word last lines ≤ 15 % of multi-line h1–h4;
  - [ ] A6: ≤ 75 characters per line at 768;
  - [ ] A7: weight 400 and ≤ 70 characters per line at 1440;
  - [ ] A8: targets ≥ 44 px at 375/768/1024;
  - [ ] A9: description tops within 2 px;
  - [ ] A10: gap above ≥ 2 × the gap below.
- [ ] **No regressions:**
  - [ ] 0 horizontal overflow;
  - [ ] the B5 fold AC still pass at ≥ 601 (1440 × 900, 1280 × 720, 768 × 1024);
  - [ ] the EN pixel diff is limited to the regions of the items above.
- [ ] **Report:** list the final M1 constants (the reserve, the sub-band K if added, and the phone margin) and their
  measured gaps per viewport and locale.

## Decisions needed
None. Everything was decided on 2026-11-12. No ADR is needed (no dependency, routing or data-model change). The B5
amendment for phone is recorded in this spec's header; the Dev's report notes it for `design-round.md`.

## Estimate
- Agent: ≈ 6 h.
  - M1 ≈ 2 h: two bands plus phone, the tuning and the viewport matrix.
  - M2–M6 ≈ 1 h.
  - A1–A10 ≈ 2 h.
  - Re-capture and the report ≈ 1 h.
- Mauricio's review: ≈ 1 h (M1 crops first, then the M3 heading/intro crop).
