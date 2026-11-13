# Home hero resize — desktop art at the tablet size, larger phone art

- **Status: Approved (Mauricio + Senior Architect, 2026-11-13)**
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-11-13 · Branch: `spec/hero-resize` (from `master` @ `faaeb42`). The Dev creates its own implementation
  branch.
- Depends on: [design-round PR 3 spec](design-round-pr3.md) M1 (:81-164); [report](../reports/design-round-3.md)
  M1 (:48-79), deviations 1-3 (:161-168), B5 note (:216-218).
- Ships before launch. One file, SCSS only.

## Goal
1. **Desktop (≥ 1024):** the art is the size portrait tablets render today (640 px) at every window height. The hero's
   height follows from the art size, not from the viewport height.
2. **Phone (≤ 600):** the art is ×1.15 its current size. The H1 stays 28 px.
3. **Tablet (601-1023):** unchanged, proved by measurement.

Hard rules kept from M1: zero CTA/art overlap; no horizontal scroll; gap under the CTA ≈ 32 px; EN/FR/ES all pass.

## Evidence (measured 2026-11-13 on `master` @ `faaeb42`)
**Method.** `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:build` (green) → `npm run agent:start`
(:3100, my PID, stopped afterwards; :3000 was free). Local CMS `{__typename}` → 200. Playwright 1.62.1, Chromium,
DPR 1, `reducedMotion: reduce`. The geometry is the same as PR 3's `m1.cjs`:
- ring bottom = CTA bottom + 5;
- visible art top = img top + 0.155·S;
- gap = visible art top − ring bottom;
- fold = viewport height − hero bottom.

Proposals were measured by injecting CSS into the page only (`page.addStyleTag`); `src` was not touched.

Evidence is in `~/Documents/projects/magneto/backups/design-round/hero-resize/`:
- `scripts/measure.cjs`, `scripts/alpha-bbox.cjs`;
- `css/*.css` (the overrides);
- `base.json`, `proposed.json` and the variant JSON/logs;
- `before-after.csv`;
- `shots/{label}_{locale}_{viewport}.png` (285 screenshots).

**E1. Current mechanism** (`src/components/organisms/Hero/Hero.scss`):
- `:67-95` phone (≤ 600): `min-height: 0`, art in flow, `width: 100%` of the content (W), margin
  `calc(28px − 15.5%) auto −12.8%`.
- `:99-117` ≥ 601: `--hero-h: min(100svh − fold offset, 820px)`, `min-height: var(--hero-h)`,
  `--hero-art: min(clamp(340, (hero-h − 349)/0.717, 640), 100vw − 60)`, reserve `padding-bottom: 0.717·art + 29`.
- `:122-126` ≥ 1024: fold offset 81, `--hero-art: clamp(400, (hero-h − 349)/0.717, 640)`.
- `:129-131` 1024-1031: K 329.

Breakpoints: `variables.scss:39-43` (600 / 601 / 1024 / 1400 / 1600). The H1 is `typo-5xl-extrabold`
(`typography.scss:263-268`): measured 28 px at ≤ 600, 36 px at 601-1024 and 42 px at 1031 and up.

**E2. Why desktop looks smaller than tablet.** On desktop the art follows the window **height**. Real laptop windows
lose about 110 px to browser chrome, so they land at the 400 floor or just above it. Portrait tablets are tall, so they
reach the 640 cap.

| Viewport (EN) | Art | Hero h | Gap | Fold | | Viewport (EN) | Art | Hero h | Gap | Fold |
|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|
| 1024 × 768 | 499 | 687 | 33 | 30 | | 768 × 1024 (iPad) | **640** | 820 | 36 | 146 |
| 1280 × 720 | 404 | 639 | 33 | 30 | | 820 × 1180 (iPad Air) | **640** | 820 | 36 | 302 |
| 1366 × 657 (1366 laptop) | **400** | 636 | 33 | −29 | | 834 × 1194 (iPad Pro 11) | **640** | 820 | 36 | 316 |
| 1440 × 789 (13" MacBook) | **501** | 708 | 33 | 30 | | 1023 × 768 | 483 | 695 | 68 | 15 |
| 1536 × 730 (1920 @125 %) | **418** | 649 | 33 | 30 | | 601 × 900 | 511 | 820 | 58 | 22 |
| 1440 × 900 | 640 | 819 | 44 | 30 | | 1180 × 820 (iPad landscape) | 544 | 739 | 33 | 30 |
| 1920 × 1080 | 640 | 820 | 45 | 209 | | | | | | |

FR and ES equal EN at ≥ 1024, except FR at 1031-1143, where the H1 takes 3 lines (text block 306 against 256): hero
757 at 1031 × 768. ES 768 × 1024 is 847 tall (gap 33).

**E3. Phone today** (EN / FR / ES; gap 32 in all 9 cells; H1 28):

| Viewport | Art (= W) | Hero bottom | Ring bottom | Fold |
|---|---:|---|---|---|
| 360 × 640 | 300 | 698 / 758 / 740 | 446 / 506 / 488 | −58 / −118 / −100 |
| 375 × 667 | 315 | 709 / 709 / 717 | 446 / 446 / 454 | −42 / −42 / −50 |
| 390 × 844 | 330 | 694 / 720 / 702 | 420 / 446 / 428 | 150 / 124 / 142 |
| 600 × 900 | 510 | 744 / 804 / 770 | 341 / 401 / 367 | 156 / 96 / 130 |

**E4. Art asset** (`alpha-bbox.json`, alpha > 8; the 640 w rendition): the transparent margins are left 6.09 %,
right **4.37 %**, top 12.0 % and bottom 2.2 %. The hero clips at its edges (`overflow: hidden`, `Hero.scss:15`). So
the art can be about 9 % wider than the hero box before opaque pixels are cut, and the right side is the tight one.
The 0.155 top constant from M1 is kept, so the gaps stay comparable with PR 3.

## Proposed values (measured with the injected CSS; `proposed.json`, 54 cells)

### Phone (≤ 600) — factor (D-4)
| Viewport (EN) | Art today → ×1.10 / **×1.15** / ×1.20 | Hero h today → ×1.15 | Opaque clearance R at ×1.10 / ×1.15 / ×1.20 |
|---|---|---|---|
| 360 × 640 | 300 → 330 / **345** / 360 | 640 → 672 (+32) | 14 / **8** / 1 |
| 375 × 667 | 315 → 347 / **362** / 378 | 651 → 685 (+34) | 14 / **7** / 0 |
| 390 × 844 | 330 → 363 / **380** / 396 | 636 → 671 (+35) | 14 / **7** / **−1 (clipped)** |
| 430 × 932 | 370 → — / **426** / — | 670 | — / **6** / — |

At every factor and in every locale: gap 32, H1 28, ring bottom unchanged, CTA above the fold, no horizontal scroll,
art centered (offset 0). FR/ES hero heights grow by the same amount as EN.

- **Uncapped ×1.15 jumps at the edge:** 600 → art 587, 601 → 511. **With a cap of 510** (today's art at 600), 600 =
  510 and 601 = 511, so the edge stays continuous. Up to about 474 px viewports (every phone) the cap has no effect.

### Desktop (≥ 1024) — art 640, hero height = content (D-1 A, D-2 A)
| Viewport | Art | Hero h (EN / FR / ES) | Gap | Fold (EN) | Art visible above the fold, today → proposed |
|---|---:|---|---:|---:|---|
| 1024 × 768 | 499 → **640** | 788 | 33 | 30 → −71 | 358 → 388 (of 459) |
| 1031 × 768 | 499 → 640 | 808 / **858** / 808 | 33 | 10 → −91 | 358 → 368 |
| 1032 × 768 | 471 → 640 | 808 / 858 / 808 | 33 | 30 → −91 | 338 → 368 |
| 1280 × 720 | 404 → 640 | 808 | 33 | 30 → −139 | 290 → 320 |
| 1366 × 657 | 400 → 640 | 808 | 33 | −29 → −202 | 257 → 257 |
| 1440 × 789 | 501 → 640 | 808 | 33 | 30 → −70 | 359 → 389 |
| 1536 × 730 | 418 → 640 | 808 | 33 | 30 → −129 | 300 → 330 |
| 1399 / 1400 / 1440 × 900 | 640 | 819 → 808 | **44 → 33** | 30 → 41 | 459 → 459 |
| 1920 × 1080 | 640 | 820 → 808 | **45 → 33** | 209 → 221 | 459 → 459 |

- The gap is **33 in every desktop cell and locale**. Fixing the art removes the 44-45 px "art at cap" exception and
  the need for the 1024-1031 K band (E1 `:129-131`).
- An explicit `min-height: calc(349px + 0.717·art)` (329 at 1024-1031) measured **identical** in all 27 desktop cells
  (`desk-minh.json`). The art reserve already makes the content that tall (D-3).
- Ring bottom 347-417, so the CTA stays above the fold in every cell, including 1366 × 657.

### Tablet (601-1023) — unchanged
`proposed.json` vs `base.json`, the 9 tablet cells (601 × 900, 768 × 1024 and 1023 × 768 in EN/FR/ES): **0
differences** in hero height, hero bottom, art, visible art, gap, ring bottom, fold, H1 size and text
block. The desktop-only run (`desk-intrinsic.json`) also left all 21 cells below 1024 identical. The gap stays 58 (601 × 900) / 68 (1023 × 768) / 36 (768 × 1024; ES 33). It is above 32 as in PR 3
(report :204-206), and out of scope.

## Design (`Hero.scss`, `&.hero-home` block only)
```scss
// ≤ 600 — scoped so it does not leak into ≥ 601. --hero-phone-art is used in width AND margins: both resolve % against
// the content width W, so S = min(1.15·W, 510px); top 28 − 0.155·S (gap 32), sides (W − S)/2, bottom −0.128·S.
@media (max-width: $breakpoint-phone) {
    .hero-image {
        --hero-phone-art: min(115%, 510px);
        width: var(--hero-phone-art);
        max-width: none;
        margin: calc(28px - 0.155 * var(--hero-phone-art)) calc((100% - var(--hero-phone-art)) / 2)
            calc(-0.128 * var(--hero-phone-art));
    }
}
// ≥ 1024 — the art is the tablet-portrait size; the hero height is the content: padding-top 60 + text block
// + 0.717·640 + 29 ≈ 808 (EN). No viewport unit, no 820 cap, no fold rule (D-2 A).
@media (min-width: $breakpoint-desktop) {
    --hero-art: 640px;
    min-height: 0;
    padding: 60px 30px 0 30px;
}
```
- **Remove:** the ≥ 1024 `--hero-fold-offset` / `clamp(400 …)` line (`:123-124`) and the 1024-1031 block (`:128-131`).
- **Keep:** the 601-1023 rules (`:99-117`) byte-identical. The phone base rules (`:87-95`) may keep `position`,
  `transform` and `max-height`; the width and margin move into the scoped block.
- **Trap:** an unscoped `width: var(--hero-phone-art)` would also apply at 601-1023, where it isn't reset (the tablet
  block sets only `max-width`). The scoped media query avoids that. The tablet AC catches it.
- Update the `:55-65` header comment: phone ×1.15 capped at 510; ≥ 1024 fixed art and content height; B5 now applies
  at 601-1023 only.
- No TSX, prop or image change. `WpResponsiveImage` and `sizes` stay unchanged.

## Decisions (Mauricio, 2026-11-13)
**Decided** (the options below are kept for the record):
- **D-1 → A:** a fixed 640 px art on desktop (≥ 1024).
- **D-2 → A:** the 820 px cap and the "hero fills the first viewport" rule (B5) are dropped at ≥ 1024. B5 stays at
  601-1023.
- **D-3 → A:** the height comes from the content, with no explicit min-height.
- **D-4 → ×1.15 with the 510 px cap.**

**Accepted trade-offs:**
- **(a) Fold on short desktop windows.** On desktop windows under ≈ 860 px tall, the hero runs 70-200 px past the
  fold. The CTA stays above the fold (AC-5).
- **(b) Image sharpness.** The 1000 px hero image is upscaled on high-density screens: 640 CSS px at DPR 2, and
  380 CSS px at DPR 3 on iPhone. Mauricio judges sharpness on the preview, on desktop and on a real iPhone (AC-8). A
  larger image file is a separate, optional follow-up, outside this spec.

**Options considered:**
- **D-1. Desktop art size.**
  - **A (recommended): fixed 640** = what every portrait tablet renders (E2) and today's cap. The same size at every
    desktop window.
  - **B: keep it height-driven with the floor raised 400 → 560** (`desk-floor560.json`): art 560 on laptops, hero 751,
    fold −12 at 1440 × 789. It shows exactly the same art above the fold as A in every measured laptop cell. It is
    still not "the tablet size", and it keeps the K constants and the 44-45 gap at ≥ 900 tall.
  - C: no change.
- **D-2. The 820 cap and "the hero fills the first viewport" (B5) at ≥ 1024.**
  - **A (recommended): drop both at ≥ 1024.** The hero is ≈ 808 (FR up to 858 at 1031-1143). It overruns the first
    viewport on windows shorter than ≈ 860 px (by 70-200 px on laptops), and fills it with 41 px to spare at 900 tall.
    The CTA stays above the fold everywhere. The rule is then "the hero ends where the art ends" on phone and desktop;
    B5 is kept at 601-1023 only.
  - B: keep B5 as a floor, `min-height: max(content, min(100svh − 81px, 820px))`. It only acts on windows taller than
    ≈ 890 px, where it re-adds space under the art (gap 33 → 45 at 1920 × 1080). It adds a rule for no visible gain.
  - C: keep the fold by shrinking the art. That is today's logic, which is what this phase replaces.
- **D-3. How the height is written.**
  - **A (recommended): content height** (`min-height: 0`; the art reserve already ties the height to the art).
  - B: an explicit `min-height: calc(349px + 0.717 * var(--hero-art))`, with 329 at 1024-1031. It measured identical
    and only differs if the text block gets shorter than 256. It brings back the two K constants.
- **D-4. Phone factor.**
  - **×1.15 with a 510 cap (recommended):** +45-50 px of art and +32-35 px of hero height at 360-390, with 7-8 px of
    air before the art's right edge meets the hero edge. The cap keeps 600/601 continuous.
  - ×1.10: 14 px of air.
  - ×1.20: the opaque art is clipped by 1 px at 390 and touches the edge at 375 (rejected by measurement).

No ADR: SCSS only, with no dependency, routing or data change.

## Files the Dev may touch
- `src/components/organisms/Hero/Hero.scss`: the `&.hero-home` block (`:55-131`) only.
- Hero tests: none test styles (`HeroLoader.test.tsx` and `api.test.ts` test data), so no test change is expected. If
  the Dev adds a style assertion, it goes in a new `src/components/organisms/Hero/Hero.styles.test.ts`, which needs
  approval first.
- `docs/reports/hero-resize.md` (new). It records the B5 amendment for `design-round.md`, but does not edit that file.

## Out of scope
Copy; the H1 size and the type scale; the hero image file (re-export or a larger asset); `HeroCTA`, the header and
the fold offsets at 601-1023; every other section, page and hero variant (`.hero-home` only); the tablet gaps 58/68.

## Acceptance criteria
Method as in Evidence (own build on :3100, Playwright DPR 1, EN/FR/ES). Re-run `scripts/measure.cjs` (no CSS
override) against the branch build, and attach `after.json` + screenshots.
- [ ] **AC-1 Gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build`; lint ≤ the `master`
  count.
- [ ] **AC-2 Phone**, at 360 × 640, 375 × 667, 390 × 844 and 600 × 900, in en/fr/es:
  - art = min(1.15·W, 510) ± 1: 345 / 362 / 380 / 510;
  - H1 `font-size` 28;
  - gap 32 ± 4;
  - CTA ring bottom = `base.json` (unchanged);
  - opaque clearance ≥ 5 on both sides;
  - art centered (± 1);
  - no horizontal scroll.
- [ ] **AC-3 Edges:** 600 × 900 art 510 and 601 × 900 art 511 (continuous). 1023 × 768 = `base.json`. 1024 × 768,
  1031 × 768 and 1032 × 768: art 640, gap 32 ± 4.
- [ ] **AC-4 Tablet unchanged:** at 601 × 900, 768 × 1024 and 1023 × 768 in en/fr/es, hero height, hero bottom, art, gap,
  ring bottom and fold equal `base.json` exactly (0 px).
- [ ] **AC-5 Desktop**, at 1024 × 768, 1280 × 720, 1366 × 657, 1399 × 900, 1400 × 900, 1440 × 789, 1440 × 900,
  1536 × 730 and 1920 × 1080, in en/fr/es:
  - art 640;
  - gap 32 ± 4;
  - hero height = the measured table ± 2 (788 at 1024 × 768, otherwise 808; FR 858 at 1031-1143);
  - CTA ring above the fold;
  - no horizontal scroll.
- [ ] **AC-6 Overlap:** gap > 0 in all 54 cells.
- [ ] **AC-7 Other routes:** `/services`, `/contact` and `/projects` heroes at 375 / 768 / 1440 in EN are pixel-equal
  to `master` (the `.hero-home` scope).
- [ ] **AC-8 Mauricio, real iPhone** (Safari, portrait, `/`, `/fr` and `/es`):
  1. on load, with the bottom toolbar shown, the whole CTA button is visible without scrolling;
  2. the illustration is clearly larger than on production and doesn't touch the hero's rounded edges;
  3. scroll down and back up so the Safari bars collapse and expand: the hero doesn't jump or resize (phone uses no
     viewport units, so no `svh` effect is expected);
  4. a sideways swipe doesn't scroll the page;
  5. rotate to landscape: tablet band, unchanged from production; note anything odd, but it doesn't block.

  On a laptop in a normal Chrome window: the art looks as big as on the iPad, the CTA is visible on load, and the
  illustration may continue below the fold (D-2 A).

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | The phone width rule leaks into 601-1023 | Scoped `max-width: 600px` block; AC-4 requires 0 px tablet difference |
| R-2 | Laptop windows no longer show the whole hero (fold −70 to −200) | Accepted trade-off (a) (D-2 A); the CTA stays visible; the art above the fold equals or beats today in every cell |
| R-3 | Softer art: 640 CSS at DPR 2 = 1280 px and the phone 380 at DPR 3 = 1140 px, from a 1000 px asset (today phone 990, no upscale) | Accepted trade-off (b). Mauricio judges it on the preview (desktop + real iPhone, AC-8); a larger file is a separate, optional follow-up, out of this spec |
| R-4 | FR 1031-1143 hero 858 | Content wins by design; gap 33 measured |
| R-5 | A later header-height change (A8 at 1024, post-launch) | It no longer affects the desktop hero (no fold offset at ≥ 1024) |
| R-6 | Stale measurements if the 5c-rest load changes the hero copy | AC re-measures on the branch; ES CTA "Reservar consulta gratis" is shorter, so the text block can only shrink: the gap at desktop stays 33 (A), at phone it stays 32 |

## Estimate
| Task | Agent | Mauricio |
|---|---:|---:|
| Spec review + D-1…D-4 | — | 20–30 min |
| SCSS change | 0.5 h | — |
| Gate, build, 54-cell matrix + edges + other-route diff, screenshots | 1.5–2 h | — |
| Report | 0.75–1 h | — |
| Preview check (laptop) + real iPhone (AC-8) | — | 15–20 min |
| **Total** | **≈ 2.75–3.5 h** | **≈ 35–50 min** |
