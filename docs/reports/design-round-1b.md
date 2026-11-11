# Design round report — PR 1b: rest of Part A (A1, A7, A2, A3, A8, A4, A5) + booking-modal focus guards

- Spec: `docs/specs/design-round.md` rev 3, Part A → "PR 1b — the rest of Part A" (status: Part A Approved, 2026-11-10)
- Author: Dev · Date: 2026-11-11 · Branch: `feat/design-round-1b-a11y` (rebased on `master` `34f2eed`, PR 1a squash)

## Result
Done locally.
- Every PR 1b item AC passes, and the gate passes.
- axe has 0 rule/route pairs worse than the baseline; 102 are better.
- The approved addition (focus guards in the booking modal) works in Chromium and WebKit.
- Still waiting on two things:
  - Mauricio's banding check (A4 AC);
  - the Vercel preview checks.

## Changes
This is the spec's PR 1b file list plus the approved addition. `git status` shows nothing else: 18 tracked files (+125 / −44) and 1 new file.

| Item | File | Change |
|---|---|---|
| A1 | `src/app/[locale]/layout.tsx` | Skip link `<a class="skip-link" href="#main-content">` is the first element in `<body>`. `{children}` is wrapped in `<main id="main-content" tabIndex={-1}>` between `<Header>` and `<FooterLoader>`. |
| A1 | `src/styles/globals.scss` | `.skip-link` is off-screen until `:focus-visible`. Then it's a fixed pill at (12, 12), `z-index: 1001`, `$primary-color-dark` on white, 2 px outline, `transition: none` (see Deviations). `#main-content` gets `outline: none` and `scroll-margin-top: 64px`; the header measures 58 px at 375 and 51 px at 1440. |
| A7 | `src/components/organisms/Header/index.tsx` | `ul.nav` is wrapped in `<nav class="nav-landmark" aria-label={t.header.navLabel}>`. `ul.nav_mobile__menu` is wrapped in `<nav aria-label hidden={!menuOpen}>`. `ul.nav_mobile` is unchanged. |
| A7 | `src/components/organisms/Header/Header.scss` | `.nav-landmark { display: none }`, and `display: block` at ≥ `$breakpoint-desktop`. Needed so that only one "Main" landmark is displayed at a time (see Deviations). |
| A1 / A7 / A2 / A3 | `src/i18n/dictionaries/{en,fr,es}.ts` | Added `common.skipToContent` (EN "Skip to main content" / FR "Passer au contenu principal" / ES "Saltar al contenido principal") and `header.navLabel` ("Main" / "Principal" / "Principal"). `header.logoAlt` is now "Magneto" in all three. Removed `common.checkIconAlt` and `cmsFallback.finalCta.bgAlt`. |
| same | `src/i18n/dictionaries/en.test.ts` | Fingerprint: +2 keys and `logoAlt` changed, each line with its design-round source comment. The lines for the 2 removed keys are deleted. |
| A3 | `FinalCTASection/index.tsx`, `PackageCard/index.tsx`, `ProjectDetail/index.tsx`, `ServiceIcon/index.tsx`, `services/ServicesList.tsx` | `alt=""` on the final-CTA background, the two check icons, the home service icon and the Services icon. `IconComponent`'s props are unchanged. |
| A8 | `ProjectDetail/ProjectDetail.scss` | `.project-detail__list li` and `__external-link` go from `$gray-80` to `$gray-90`. The link's `:hover` goes to `$black`. |
| A4 | `Hero/index.tsx` | Both background branches now render one `next/image` with `fill`, `priority`, `sizes="(max-width: 1240px) 100vw, 1200px"`, `quality={90}`, `alt=""` and `.hero__bg-image`. Its source is `backgroundImageNode?.sourceUrl` or the `backgroundImage` string. This removes the lazy raw-PNG `<img>` fallback path and one `as any`. |
| A4 | `FinalCTASection/index.tsx` | `quality={90}`, passed through `WpResponsiveImage`'s `...rest`. |
| A4 | `next.config.ts` | `images.qualities: [75, 90]`. `images.domains` is untouched (Known debt). |
| A5 | `ProjectDetail/index.tsx` | The caption `<p>` renders only when `img.footNote?.trim()` is non-empty. |
| A5 / A3 | `ProjectDetail/ProjectDetail.test.tsx` (new) | `""` and `"  "` render no `<p>`; text renders a `<p>`. The check icon has `alt=""`. |
| **Addition** (Mauricio 2026-11-11) | `src/utils/calendly.ts` | Two empty focus guards (`div[data-focus-guard]`, `tabIndex=0`) as the first and last children of the dialog. Focusing either one moves focus to the ✕. The "No Tab trap" comment is updated. |
| **Addition** | `src/utils/calendly.test.ts` | The structure test now expects `[guard, bar, iframe, guard]`. New test: both guards are empty and `tabIndex` 0, and focusing either one lands on the ✕. |
| Report | `docs/reports/design-round-1b.md` | This file. |

**PR 1b file list, as approved:** the spec's PR 1b rows, plus `src/utils/calendly.ts` and `src/utils/calendly.test.ts` (approved addition, Mauricio 2026-11-11).

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | passed (vs. budget) | **84 errors / 81 warnings**; budget ≤ 85 / 81 (master). `next lint` exits 1 on the pre-existing baseline. The −1 error is the `backgroundImageNode as any` removed from `Hero`. Messages in changed files are all on unchanged lines: `layout.tsx:155`, `FinalCTASection:25,62`, `PackageCard:2,27,42`, `Header:5,24,38,41,42,52`, `Hero:14,17,96`, `calendly.ts:122,268-270`. |
| typecheck | passed | exit 0 |
| tests | passed | 48 files, **698 / 698**: +1 calendly focus-guard test, +2 `ProjectDetail.test.tsx` |
| build | passed | `ENABLED_LOCALES=en,fr,es npm run agent:build` exit 0. CMS GraphQL returned 200 before the build. 35/35 static pages; 0 `ECONNREFUSED` / `fetch failed`. Prerendered project paths: 3 EN + 6 more (3 per locale). Run twice; the second run came after the last edit (`transition: none`), and the full gate was re-run then. |
| visual (8 routes × en/fr/es × 375/768/1440) | passed | 72 / 72 HTTP 200, 0 horizontal scroll. Diffs appear only where PR 1b intends (table below). |
| axe (48 runs + 18 case-page runs) | passed | 0 worse / 102 better; 672 → 82 nodes (details below) |
| Focus guards (Chromium + WebKit) | passed | 4 / 4 runs (below) |
| Mauricio's A4 banding check (1440 / 375) | **not run** | Crops are ready (Evidence) |
| Vercel preview (routes 200, `/esto-no-existe` 404, a project page 200) | **not run** | After the PR is opened |

## Acceptance

### A1 — `<main>` + skip link
| AC | Result | Evidence |
|---|---|---|
| SSR of every route × locale has exactly 1 `<main id="main-content"` | pass | `ssr.mjs`: 10 routes (8 + the 2 other case pages) × 3 locales = 30 / 30 `main=1`. `grep -rn "<main" src` finds only `layout.tsx`. |
| axe `landmark-one-main` = 0 | pass | 48 / 48 (was 48 / 48 failing) |
| The first Tab shows the skip link; Enter moves focus to `<main>` | pass | `skip.cjs`: Chromium + WebKit × 375 / 1440 × `/`, `/fr`, `/es/projects/…` = **12 / 12**. Focus on `.skip-link` with `:focus-visible`; box (12, 12, ~200–261 × 41); `elementFromPoint` hits it (above the header); colour `rgb(55,27,151)` = `$primary-color-dark`; 2 px outline. Enter gives `activeElement = #main-content` and hash `#main-content`. The next Tab lands inside `<main>`. WebKit is driven with Option+Tab, which is Safari's key for reaching links when "Press Tab to highlight each item" is off. |
| EN screenshots unchanged while the link is unfocused | pass | The header band is pixel-identical in every capture (A7 row). The link is off-screen until focused. |

### A7 — header `<nav>`
| AC | Result | Evidence |
|---|---|---|
| axe `region` drops; `landmark-unique` = 0 | pass | `region` 530 → 72 nodes over 48 runs. `landmark-unique` is 0 in all 66 runs, including the 18 case-page runs that also have `.project-detail__navigation`. |
| SSR has a header `<nav aria-label="Main\|Principal">` on every page | pass | 30 / 30: EN `Main/Main`, FR/ES `Principal/Principal`. There are 2 elements because the mobile one carries `hidden` while the menu is closed. |
| Header pixel diff = 0 | pass | Row diff of all 72 captures (en/fr/es) against the architect baseline. The first differing row is never above the header's bottom edge: 1440 → row 51 (header 51 px); 375 → ≥ 116 device rows (header 58 px × DPR 2); 768 → ≥ 90 device rows, the top of the hero. Privacy (no hero) is pixel-identical at all 3 widths in EN and FR. The one exception is `es/privacy-policy_768`: scattered sub-pixel glyph differences, no layout change. The crop looks identical (`detail/es_privacy_768_band.png`). It also differs where nothing changed, so it is rendering noise. |

### A2 — `header.logoAlt` "Magneto"
- **Pass.** SSR logo `alt="Magneto"` in 30 / 30. The `en.test.ts` line is changed with its source comment.
- `scripts/qa-i18n/config/glossary.json` is not edited, per the spec.

### A3 — decorative images
| AC | Result | Evidence |
|---|---|---|
| Final-CTA bg, `.project-detail__check`, `.service-icon__image` and the Services icons have `alt=""` | pass | Every page that renders a final CTA has `ctaBg alt=""`. Trépied has 4 × `project-detail__check alt=""`; home has 3 × `service-icon__image alt=""`. `/services` has 7 and `/packages` has 3 × `icon-component__image alt=""`. Each count is from the SSR HTML. |
| `grep -rn "checkIconAlt\|finalCta.bgAlt" src` = 0 | pass | 0 |

`src/app/[locale]/services/api.ts:77` still maps `icon.alt`, which is now unused by `ServicesList`. The file isn't in the list, so it's left as is (I-3).

### A8 — case-page contrast
| AC | Result | Evidence |
|---|---|---|
| axe `color-contrast` = 0 on the 3 case pages × en/fr/es × 375/1440 | pass | `axe-cases-after-1b.json`: 18 / 18 runs with 0 (Dangel was 14 nodes per run) |
| EN change limited to the two text colours | pass | `detail/en_case_1440_lists.png` (left: baseline, right: after). Only the list text is darker. |

### A4 — hero / final-CTA background
| AC | Result | Evidence |
|---|---|---|
| The 6 hero routes: hero bg uses `/_next/image?…&q=90`, no `loading="lazy"` | pass | 18 / 18 (6 routes × 3 locales): `next=true q=90 lazy=false` |
| The final CTA bg uses `q=90` | pass | Every route that renders it (24 / 24) |
| No other image URL changes `q` | pass | Every other `<img>` in the SSR has `q=75` only (`qOther=75` or none) |
| Cold-cache weight table, before / after | pass | Below |
| Mauricio's banding check at 1440 and 375 | **not run** | `detail/en_home_1440_hero.png`, `detail/en_home_375_hero.png` (left: baseline raw PNG, right: q90). Check on a real screen, too. |

**Cold-cache page weight, EN.**
- **Method:** fresh context, transfer (encoded) bytes, no scrolling. This matches the baseline: its totals only make sense as transfer sizes, and its image lists contain no below-the-fold lazy images.
- **Before:** the architect's `a4-weight-cold.json`.
- **After:** `screenshots-after-1b/a4-weight-cold-after-1b.json`.
- The "bg bytes" column is the exact A4 effect: the sum of every `hero-background.png` request (hero and final CTA).

| Route | Width | Total before (B) | Total after (B) | Δ | bg bytes before | bg bytes after |
|---|---|---:|---:|---:|---:|---:|
| `/` | 375 | 2,184,163 | 506,748 | −76.8% | 1,710,736 | 83,314 |
| `/services` | 375 | 2,078,412 | 436,409 | −79.0% | 1,710,736 | 83,314 |
| `/packages` | 375 | 1,947,653 | 308,307 | −84.2% | 1,710,736 | 83,314 |
| `/projects` | 375 | 2,071,399 | 431,022 | −79.2% | 1,710,736 | 83,314 |
| `/projects/fashion-company-ecommerce` | 375 | 783,486 | 818,357 | **+4.5%** | 18,553 | 75,306 |
| `/projects/shamaniccas-ecommerce` | 375 | 857,656 | 891,674 | **+4.0%** | 18,553 | 75,306 |
| `/projects/trepied-trepied-ca` | 375 | 863,820 | 898,337 | **+4.0%** | 18,553 | 75,306 |
| `/about-magneto` | 375 | 1,996,241 | 357,095 | −82.1% | 1,710,736 | 83,314 |
| `/contact` | 375 | 1,957,822 | 263,262 | −86.6% | 1,692,183 | 8,008 |
| `/` | 1440 | 2,088,560 | 378,029 | −81.9% | 1,699,838 | 27,650 |
| `/services` | 1440 | 2,006,173 | 319,407 | −84.1% | 1,699,836 | 27,650 |
| `/packages` | 1440 | 1,936,750 | 252,643 | −87.0% | 1,699,836 | 27,650 |
| `/projects` | 1440 | 2,029,445 | 344,306 | −83.0% | 1,699,836 | 27,650 |
| `/projects/fashion-company-ecommerce` | 1440 | 691,416 | 654,349 | −5.4%* | 7,653 | 27,650 |
| `/projects/shamaniccas-ecommerce` | 1440 | 773,314 | 661,556 | −14.5%* | 7,653 | 27,650 |
| `/projects/trepied-trepied-ca` | 1440 | 771,230 | 561,377 | −27.2%* | 7,653 | 27,650 |
| `/about-magneto` | 1440 | 1,953,085 | 269,621 | −86.2% | 1,699,836 | 27,650 |
| `/contact` | 1440 | 1,942,408 | 267,492 | −86.2% | 1,692,183 | 27,650 |

**How to read the table:**
- **Hero routes:** about 1.6 MB lighter at both widths, as the spec predicted. Home at 1440 is 2,089 → 378 KB, against the spec's estimate of about 414 KB.
- **The 1440 background is one request** (`w=1200&q=90`, 27,650 B) shared by the hero and the final CTA. This matches the spec's measurement exactly.
- **Case pages at 375 grow 4.0–4.5% (+56.8 KB)**, against the spec's "≤ 3%" estimate. It is still well under the 15% rule. The cause predates this PR: at 375 the final CTA requests the background twice, at `w=3840` (11,939 → 54,060 B) and at `w=1080` (6,614 → 21,246 B). See I-1.
- **\* Case pages at 1440:** the decrease isn't caused by this PR. The baseline run caught 1–3 gallery images that sit below the fold, lazy-loaded (e.g. `trepied-portfolio-mobile`, `shamanicca-product-page-mobile`). This run didn't. Only the background column is comparable there, at +20 KB.

### A5 — empty captions
| AC | Result | Evidence |
|---|---|---|
| Dangel and Shamanicca × en/fr/es: 0 `.project-detail__image > p` | pass | SSR `galleryP=0` (6 / 6). Browser: `caps 0` at all 3 widths. |
| Trépied: 7 | pass | 7 in all 3 locales × 3 widths |
| Gaps 30 → 15 (375/768), 45 → 30 (1440); last image → link 40 → 25 / 60 → 45 | pass | `a5-gaps.jsonl`, 27 / 27: image → image **15** (375, 768) / **30** (1440); last image → link **25** / **45**. The EN case pages are 75 CSS px shorter (rowdiff: 7206 → 7131 at 1440; 9576 → 9426 device rows at 375 @2×). |
| `ProjectDetail.test.tsx`: `""`, `"  "` → no `<p>`; text → `<p>` | pass | 2 tests |

### Approved addition — booking-modal focus guards
`trap.cjs`, at 1440, `/` and `/es`. The modal is opened with the keyboard: CTA → Enter → booking form → Enter. To leave the frame, the script focuses the last (or first) focusable element inside the Calendly frame, then presses Tab (or Shift+Tab). The frame had 10–17 focusables.

| Step | Chromium (`/`, `/es`) | WebKit (`/`, `/es`) |
|---|---|---|
| On open | ✕, `:focus-visible` | ✕, `:focus-visible` |
| Shift+Tab from ✕ | ✕ (start guard) | ✕ (start guard) |
| Tab from ✕ | iframe | iframe |
| **Tab out of the iframe** (from its last focusable) | **✕**, `fv=true` | **✕**, `fv=true` (was `<body>` in PR 1a) |
| **Shift+Tab out of the iframe** (from its first focusable) | **✕**, `fv=true` | **✕**, `fv=true` (was `<body>`, PR 1a I-2) |
| Escape on ✕ | closes; focus back on the hero CTA | closes; focus back on the hero CTA |

This resolves PR 1a I-2 (WebKit) and I-5 (Shift+Tab from the ✕ escaped to the page). Focus no longer leaves the dialog by keyboard. PR 1a I-1 is unchanged: Escape doesn't work while focus is inside the cross-origin frame.

## Visual regression — every EN diff (vs. the architect baseline)
The tolerance is a channel delta > 8, as in the PR 1a sweep. Before capture, the sweep now scrolls each page so that lazy images load (PR 1a I-4).

| Route | Widths | Where it differs | Cause | Intended |
|---|---|---|---|---|
| home, services, packages, projects, about, contact | 375 / 768 / 1440 | From the hero's top edge to its bottom (1440: rows 51–~650). At 768, also the final CTA further down. 289–1,891 differing pixels per capture, all faint gradient pixels. | A4 (hero bg, raw PNG → q90 optimized; final-CTA bg q75 → q90) | yes |
| project (Dangel) | 375 / 768 / 1440 | From the case lists (1440: row 1290) down. The page is 75 CSS px shorter. | A8 (list text colour), A5 (6 caption gaps removed), A4 (final-CTA bg) | yes |
| privacy-policy | 375 / 768 / 1440 | none (0 px) | — | — |
| header band (all routes) | all | none | A7 wrapper, A1 hidden link | yes (0 px) |
| A2 / A3 | — | none | alt text only | yes |

FR and ES follow the same pattern; see `rowdiff.json`. The only extra is the `es/privacy-policy_768` glyph noise above, plus an `es/project_768` band starting at row 124 (62 CSS px). I inspected it (`detail/es_project_768_band.png`): sub-pixel anti-aliasing in the title area, with no visible change.

## axe (axe-core 4.10.3 from `node_modules`, same 48 runs and key format as `axe-baseline.json`)
- **Worse: 0. Better: 102 rule/route pairs. Nodes: 672 → 82.**
- **Fixed:**
  - `landmark-one-main`: 48 pages → 0 (A1).
  - `color-contrast` (serious): 6 pages / 84 nodes → 0 (A8). The 18 extra case-page runs (3 case pages × 3 locales × 2 widths) are 0 too.
  - `region`: 530 → 72 nodes (A1 + A7).
- **Remaining:**
  - `region` on `.logo` (48) and `.nav_mobile > li:nth-child(2)` (the menu toggle, 24 at 375). See I-2.
  - `heading-order` (6, out of scope).
  - `empty-heading` (4, FR/ES home content, 5c-rest).
  - `landmark-unique`: 0.

## Evidence
Evidence folder (outside the repo): `~/Documents/projects/magneto/backups/design-round/screenshots-after-1b/`
- `en/ fr/ es/`: 72 full-page captures; `sweep.json` (statuses, h-scroll, EN diffs); `rowdiff.json` (72 row diffs).
- `axe-after-1b.json` (48 runs), `axe-cases-after-1b.json` (18 case-page runs).
- `a4-weight-cold-after-1b.json`, `a5-gaps.jsonl`, `kbd/skip-link.json`, `kbd/focus-trap.json`.
- `detail/` (baseline | after): `en_home_1440_hero.png`, `en_home_375_hero.png` (banding check), `en_about_1440_finalcta.png` (0 px), `en_case_1440_lists.png` (A8), `en_case_1440_gallery-gap.png` (A5), `es_privacy_768_band.png`, `es_project_768_band.png` (noise).
- `scripts/`: every script used. Run them with Playwright 1.62.1 from the npx cache: `NODE_PATH=~/.npm/_npx/705bc6b22212b352/node_modules node <script>`.

**Server:** `npm run agent:start` on :3100, my own PIDs (11712, then 13056 after the rebuild), both stopped with `kill <pid>`. Port 3000 was not touched.

**Not done or not read:** `.env.local` was not read; no `--llm`, `wp`, `npm install`, commit or push. No form was submitted to our APIs and nothing was booked. The booking form only builds the iframe URL.

**Commands (trimmed output):**
```
npm run lint                          → exit 1 (baseline), 84 errors / 81 warnings
npm run typecheck                     → exit 0
npm test -- --run                     → Test Files 48 passed (48) · Tests 698 passed (698)
ENABLED_LOCALES=en,fr,es npm run agent:build → exit 0 · ✓ Generating static pages (35/35)
node scripts/ssr.mjs                  → 30/30 main=1, nav=Main|Principal, logo=Magneto, heroBg q=90 lazy=false, ctaBg alt="" q=90
node scripts/routes-sweep.cjs …       → routes: 72, status!=200 or hScroll: 0
node scripts/axe-run.cjs …            → runs 48 · nodes total base 672 now 82 · WORSE 0 · BETTER 102
node scripts/axe-cases.cjs …          → 18 runs: color-contrast 0, landmark-unique 0
node scripts/skip.cjs …               → 12/12 focus=main-content
node scripts/trap.cjs …               → 4/4 tabOutOfFrame=✕, shiftTabOutOfFrame=✕
```

## Deviations from the spec
- **A7: `Header.scss` changed, and the mobile `<nav>` carries `hidden={!menuOpen}`.**
  - The spec assumed "only one `<nav>` is displayed at a time; the other is `display: none`". With plain wrappers that isn't true. Each wrapper is a displayed, empty "Main" landmark when its list is hidden: the desktop wrapper at < 1024 px, the mobile wrapper whenever the menu is closed. axe would flag `landmark-unique`.
  - The wrappers now own the visibility:
    - `.nav-landmark` is `display: none` below `$breakpoint-desktop`;
    - the mobile `<nav>` is `hidden` while closed.
  - Header pixel diff is still 0. `Header.scss` was allowed "only if needed"; it was needed for this rather than for pixels.
  - Edge case (pre-existing behaviour): open the menu at < 1024 px, then widen past 1024. Both lists show, as they did before.
- **A1: `.skip-link` has `transition: none`.** The global `a { transition: color 0.2s }` (`button.scss`) faded the pill in from black. The first probe measured `rgb(25,23,29)`.
- **A1, "first child of `<body>`":** in the HTML, Next 15 inserts its own `<div hidden>` streaming boundary first. The skip link is the first element we render and the first focusable element.
- **A4 estimate:** case pages at 375 grow +4.0–4.5%, against the spec's "≤ 3%". The rule (≤ 15%) still holds. The cause is the existing `w=3840` + `w=1080` double fetch (I-1).
- **Spec step "the `backgroundImageNode` branch":** it now uses `backgroundImageNode.sourceUrl` (the original) and `alt=""`, instead of `WpResponsiveImage`'s size pick and the node's `altText`. Today `HeroLoader` only passes the string prop, so nothing renders differently.

## Issues found (not fixed)
- **I-1: the final-CTA background requests two copies at 375** (`w=3840` and `w=1080`). That's 75 KB at q90 for a ~345 px-wide box.
  - Cause: `WpResponsiveImage` drops `fill` when a `className` is set and renders a sized `next/image` with no `sizes`, so the srcset is 1×/2× of the intrinsic width. `priority` adds a preload with its own candidate.
  - This predates PR 1b; q90 only makes it more visible.
  - Suggest: pass `sizes` to the final CTA, or render it like the new hero bg (`fill` + `sizes`), in a later image phase.
- **I-2: the logo and the mobile menu toggle are outside any landmark** (axe `region`, moderate).
  - `<header>` sits inside `<section class="header">`, so it isn't a page-level banner landmark.
  - Suggest: move the `<header>` element up (the `section` → `header` swap needs a CSS check), or label the region. It's out of A7's scope ("`ul.nav_mobile` stays as it is").
- **I-3: `src/app/[locale]/services/api.ts:77` still builds `icon.alt`,** which nothing renders now. It's harmless; remove it in a cleanup phase, since the file isn't in the PR 1b list.
- **I-4: on the case pages, the 1440 cold-weight capture depends on timing** for lazy below-the-fold gallery images. Future weight comparisons should either scroll in both runs or count only above-the-fold requests.
- **I-5: sub-pixel glyph noise** in `es/privacy-policy_768` and `es/project_768` against the baseline (no layout change). It's worth a stricter diff tolerance, or a re-baseline after PR 1b merges.
- **Still open from PR 1a:**
  - I-1 (Escape inside the iframe, accept);
  - I-3 (WebKit focus after a mouse/tap close goes to `<body>`).

## Proposed commits
Nothing staged (hard rules). One concern per commit, in the spec's order. Mauricio commits.
1. `feat(a11y): main landmark and skip link (A1)`
   - `src/app/[locale]/layout.tsx`, `src/styles/globals.scss`
   - the `common.skipToContent` hunks in `src/i18n/dictionaries/{en,fr,es}.ts` and `en.test.ts`
2. `feat(a11y): label the header navigation as a landmark (A7)`
   - `src/components/organisms/Header/index.tsx`, `src/components/organisms/Header/Header.scss`
   - the `header.navLabel` hunks
3. `fix(i18n): logo alt is "Magneto" (A2)` — the `header.logoAlt` hunks
4. `fix(a11y): decorative images get an empty alt (A3)`
   - `FinalCTASection/index.tsx` (alt hunk), `PackageCard/index.tsx`, `ProjectDetail/index.tsx` (check-icon hunk), `ServiceIcon/index.tsx`, `services/ServicesList.tsx`
   - the `checkIconAlt` / `finalCta.bgAlt` removals
5. `fix(a11y): AA contrast for case-page lists and link (A8)` — `ProjectDetail/ProjectDetail.scss`
6. `perf(images): optimized q90 hero and final-CTA background (A4)`
   - `Hero/index.tsx`, `FinalCTASection/index.tsx` (quality hunk), `next.config.ts`
7. `fix(projects): no empty gallery caption paragraphs (A5)`
   - `ProjectDetail/index.tsx` (caption hunk), `ProjectDetail/ProjectDetail.test.tsx`
8. `fix(booking): focus guards keep Tab inside the Calendly modal` — `src/utils/calendly.ts`, `src/utils/calendly.test.ts`
9. `docs(report): design round PR 1b` — `docs/reports/design-round-1b.md`

Commits 1–4 share hunks in the dictionary files, so stage them with `git add -p`. Alternatively, fold 1–3 into one `feat(a11y): main landmark, skip link, nav label and logo alt (A1, A7, A2)`.

## Time
Agent: ~2.5 h (implementation ~0.75 h; verification, including one rebuild and the method fix for weights, ~1.5 h; report ~0.25 h), estimated. Human active time: unknown (Mauricio: banding check and preview checks pending).
