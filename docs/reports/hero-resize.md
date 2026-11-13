# Report — Home hero resize (desktop art at the tablet size, larger phone art)

- Spec: `docs/specs/hero-resize.md` (Status: Approved, 2026-11-13). The file lives on `spec/hero-resize` @ `3a2b8e4`;
  it is not on `feat/hero-resize` (left as is, per Mauricio).
- Author: Dev · Date: 2026-11-13 · Branch: `feat/hero-resize` (= `master` @ `faaeb42` + this change, unstaged)

## Result
Done. All automated acceptance criteria (AC-1 to AC-7) pass. AC-8 (real iPhone) is waiting on Mauricio.

## Changes
- `src/components/organisms/Hero/Hero.scss`, `&.hero-home` block only:
  - **≤ 600:** new scoped `@media (max-width: $breakpoint-phone)` block. `--hero-phone-art: min(115%, 510px)` sets the
    width and all three margins: top `28 − 0.155·S`, sides `(W − S)/2`, bottom `−0.128·S`. The base `.hero-image`
    rule keeps only `position`, `transform` and `max-height`.
  - **≥ 1024:** `--hero-art: 640px; min-height: 0; padding: 60px 30px 0 30px`. Removed the `--hero-fold-offset` and
    `clamp(400 …)` lines and the 1024-1031 K-329 block.
  - **601-1023:** the tablet block (`@media (min-width: $breakpoint-tablet)`, with its 349 comment) is byte-identical
    to master (see `git diff`).
  - The header comment now reflects the new rules: phone ×1.15 capped at 510; ≥ 1024 fixed art and content height;
    B5 applies at 601-1023 only.
- No TSX, prop, image, test or other file changed.

**Amendment to record in `design-round.md` (not edited here):** B5 ("the hero fills the first viewport, capped at
820") now applies at 601-1023 only. At ≥ 1024 the hero height is its content: the art is fixed at 640 and the hero is
≈ 808 (EN/ES), or 858 for FR at 1031-1143 (D-2 A, D-3 A).

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | **passed** (no change) | 83 errors / 81 warnings on master **and** on the branch. The two outputs are byte-identical (`diff` empty), so lint ≤ master. These errors were already on master (Known debt); none come from this change. |
| typecheck | **passed** | `tsc --noEmit`, clean |
| tests | **passed** | 48 files, 698 tests |
| build | **passed** | `npm run build` (gate). Separately, `ENABLED_LOCALES=en,fr,es ALLOW_UNTRANSLATED_LOCALES=1 npm run agent:build` for the measurements (also green) |
| visual (routes · viewports · locales) | **passed** | Home: 18 viewports × en/fr/es (54 cells), DPR 1. `/services`, `/contact`, `/projects` at 375 / 768 / 1440, EN: pixel-equal to master |

## Acceptance criteria
| AC | Result | Evidence |
|---|---|---|
| AC-1 Gate | **pass** | See Gate. Lint 83/81 = master |
| AC-2 Phone (12 cells) | **pass** (84/84 checks) | Art 345 / 362 / 380 / 510 in every locale; H1 28; gap 32; ring bottom = base; opaque clearance L 13-14, R 7-8 (≥ 5; 61 / 52 at 600); centre offset 0; no horizontal scroll |
| AC-3 Edges | **pass** (18/18) | 600 × 900 → 510, 601 × 900 → 511 (continuous). 1023 × 768 equals `base.json` in every field. 1024 / 1031 / 1032 × 768: art 640, gap 33 |
| AC-4 Tablet unchanged (9 cells) | **pass** (0 px) | 601 × 900, 768 × 1024, 1023 × 768 × en/fr/es: hero height, hero bottom, art, gap, ring bottom and fold all equal `base.json` |
| AC-5 Desktop (27 cells) | **pass** (135/135) | Art 640; gap 33; hero 788 at 1024 × 768, otherwise 808; CTA ring (347-367) above the fold in every cell, including 1366 × 657; no horizontal scroll |
| AC-6 Overlap | **pass** (54/54) | Gap ≥ 32 in every cell (minimum 32 on phone) |
| AC-7 Other routes | **pass** (18/18) | Pixel diff master vs branch, hero element + viewport, 0 differing pixels |
| AC-8 Real iPhone | **not run (Mauricio)** | Steps below |

Selected values (EN, before → after; all cells are in `base-rerun.json` and `after.json`):

| Viewport | Art | Hero h | Gap | Fold |
|---|---|---|---|---|
| 360 × 640 | 300 → 345 | 640 → 672 | 32 → 32 | −58 → −90 |
| 390 × 844 | 330 → 380 | 636 → 671 | 32 → 32 | 150 → 115 |
| 1366 × 657 | 400 → 640 | 636 → 808 | 33 → 33 | −29 → −202 |
| 1440 × 789 | 501 → 640 | 708 → 808 | 33 → 33 | 30 → −70 |
| 1920 × 1080 | 640 → 640 | 820 → 808 | 45 → 33 | 209 → 221 |
| 768 × 1024 | 640 → 640 | 820 → 820 | 36 → 36 | 146 → 146 |

FR at 1031 / 1032 × 768: hero 858 (3-line H1), gap 33, as the spec predicts (R-4). ES at 768 × 1024: hero 847, unchanged.

### AC-8 — steps for Mauricio (real iPhone, Safari, portrait; `/`, `/fr`, `/es` on the preview)
1. On load, with the bottom toolbar shown, the whole CTA button is visible without scrolling.
2. The illustration is clearly larger than on production and doesn't touch the hero's rounded edges.
3. Scroll down and back up so the Safari bars collapse and expand: the hero doesn't jump or resize.
4. A sideways swipe doesn't scroll the page.
5. Rotate to landscape: the tablet band looks the same as production. Note anything odd; it doesn't block.

Also, on a laptop in a normal Chrome window: the art looks as big as on the iPad, the CTA is visible on load, and the
illustration may continue below the fold (accepted trade-off (a)). Check how sharp the image is on desktop and on the
iPhone (trade-off (b), R-3).

## Evidence
Folder `~/Documents/projects/magneto/backups/design-round/hero-resize/`:
- `base-rerun.json` (master build, this session; equals the spec's `base.json` in all 54 cells) and `after.json`
  (branch build). Screenshots are in `shots/base-rerun_*` and `shots/after_*` (54 each).
- `ac-results.json`: the output of `scripts/check-ac.cjs` (AC-2 to AC-6, plus a BASE check of `base-rerun` against
  `base`).
- `routes/master_*`, `routes/master2_*`, `routes/after_*`: AC-7 screenshots. Each file is the hero element, with a
  `_vp` version for the full viewport. `master2` is a second master pass that proves the method is stable (18/18
  equal before comparing the branch).
- New helper scripts: `scripts/routes.cjs`, `scripts/pixdiff.cjs` (decodes the PNGs on a Chromium canvas, so no new
  dependency) and `scripts/check-ac.cjs`.

Method: Playwright 1.62.1 (`~/.npm/_npx/e41f203b7505f1fb/node_modules`), Chromium, DPR 1, `reducedMotion: reduce`. The
server is `npm run agent:start` on :3100, started by me in a background task. I stopped it after each run; :3000 was
free throughout. `scripts/agent-gate.mjs check` passed before each build. The compiled CSS has the expected rule:
`.hero.hero-home .hero-image{--hero-phone-art:min(115%,510px);…}`.

## Deviations from the spec
1. **`max-width` moved too.** The spec says the width and margin move into the scoped phone block. I also removed
   `max-width: 100%` from the base rule: the scoped block sets `max-width: none`, and the tablet block already sets
   its own `max-width`. It has no visible effect: tablets differ by 0 px (AC-4) and the other routes are pixel-equal
   (AC-7).
2. **`.env.local` not read.** My role asks me to confirm the local CMS target in `.env.local`, but Mauricio told me
   not to read that file, and not to run the substitute check I offered.
3. **The spec file isn't on this branch.** It stays on `spec/hero-resize` @ `3a2b8e4`, per Mauricio's instruction.
4. **Stabilising the AC-7 screenshots.** The first master-vs-master pass differed on `/contact` 375 and `/services`
   768, because the hero background image was still decoding. `routes.cjs` now waits for `decode()` on the hero
   images (3 s cap each) plus 1 s. After that, master vs master was 18/18 equal, and only then did I compare the
   branch. This affects the tooling only.

## Issues found (not fixed)
- None in this scope. At ≥ 1024, `--hero-h` is still computed by the tablet block but no longer used (`min-height: 0`
  overrides it). It is harmless, and I left it alone because the spec keeps the tablet block byte-identical.

## Proposed commits
- `feat(hero): fixed 640 px desktop art and ×1.15 phone art on the home hero`. Covers `Hero.scss`.
- `docs(report): hero resize`. Covers `docs/reports/hero-resize.md`.

Nothing is staged or committed.

## Time
Agent ≈ 1.25 h (estimated): baseline, edit, gate, two builds, 2 × 54-cell measurement, AC-7 diff, report. Mauricio:
spec review (earlier), plus AC-8 still to do (15-20 min, per the spec estimate).
