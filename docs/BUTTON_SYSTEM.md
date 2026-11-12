# Button system

What the code actually does, checked against `src/` on 2026-11-11 (design round PR 2, B6). If you change a button
class, update this file in the same PR.

Checked with:
```bash
grep -rn "\.btn\b\|\.btn-\|\.btn:" src --include=*.scss
grep -rn "btn-secondary\|btn-outline\|btn-medium\|btn-sm\b\|btn-small\|btn-large\|service-cta" src --include=*.tsx
```

## 1. Files
- `src/styles/components/button.scss`, imported once, globally, by `src/main.scss`.
- The same file also styles **every `a`**: `$black`, hover `$primary-color`, no underline, `transition: color 0.2s`.
- Context rules (section 6) live in the component or page stylesheet that owns the context.

## 2. Base `.btn`
- Type: `font-style(sm, bold, sm)` from `typography.scss`. Weight 600; size / line height:

  | Band | Size / line height |
  |---|---|
  | phone ≤ 600 | 12 / 16 px |
  | tablet 601–1024 | 13 / 20 px (B3 tablet `sm` token; was 12 / 18) |
  | desktop ≥ 1025 | 14 / 20 px |

- Layout: `display: inline-flex`, centred, `gap: 10px`, `padding: 15px 30px`, `border-radius: 10px`, `border: none`,
  `overflow: hidden`, antialiased text.
- `transition: all 0.2s ease`. This also animates **padding** and size, so a measurement taken right after a CSS
  change or a resize catches the button mid-animation. Wait ≥ 600 ms before measuring.
- `box-sizing` is the browser default: `content-box` on `<a>`, `border-box` on `<button>`. A 2 px border therefore
  makes an `<a>` secondary button 4 px taller than a `<button>` secondary (50 vs 46 px at 375). Avoid `min-height`
  on an `<a>` button: it adds to the padding (B6 removed a `min-height: 44px` that made `.service-cta` 78 px tall).

## 3. Variants
| Class | Default | Hover / active |
|---|---|---|
| `.btn-primary` | `$primary-color` background, white text | `$black` background, white text |
| `.btn-secondary` | white background, `$primary-color` text, 2 px `$primary-color` border | `$black` background and border, white text |

## 4. Sizes
| Class | Rule | Used |
|---|---|---|
| `.btn-small` | `padding: 6px 10px` (keeps the `.btn` type) | Header CTAs |
| `.btn-large` | `font-style(md, bold, md)`, `padding: 15px 30px` | **0 uses** (debt) |

There is no "medium" class: the base `.btn` is the default size.

## 5. CTA style = classes, not a CTA class
The hero and final-CTA buttons are `btn btn-primary|btn-secondary typo-uppercase typo-extrabold` (900, uppercase).
Their 5 px translucent white ring (`box-shadow: 0 0 0 5px rgba(white, 0.3)`) comes from the context, not a class:
`.hero-cta-wrapper .btn` (`Hero.scss`) and `.final-cta-section .btn` (`FinalCTASection.scss`).

**Phone padding (B1):** at ≤ 600 px those contexts (`.hero-cta-wrapper .btn`, `.hero-secondary .btn`,
`.final-cta-section .btn`) use `padding-inline: 15px` and `text-wrap: balance`, and the final-CTA container uses
`padding-inline: 15px`, so FR labels fit on one line and long labels wrap to balanced lines. Every other button
keeps 30 px.

## 6. Context rules
| Selector | File | What it does |
|---|---|---|
| `.hero-cta-wrapper .btn` | `Hero.scss` | 5 px ring; B1 phone padding |
| `.hero-secondary .btn:focus-visible` | `Hero.scss` | white 3 px outline on the dark hero (Contact "Prefer to talk?") |
| `.final-cta-section .btn` | `FinalCTASection.scss` | `z-index: 2` above the background, 5 px ring; B1 phone padding |
| `.package-card__cta` | `PackageCard.scss` | `align-self: stretch`; purple 3 px focus outline on the light card |
| `.service-cta` | `services/Services.scss` | `align-self: flex-start`; purple focus outline. Same look and height as the About secondary button (50 / 52 / 54 px on master's tablet token) |
| `.header … .btn` | `Header.scss` | `max-width: 100%`, `min-height: 44px` (mobile header) |
| `.form-error__cta.btn` | `contact-form.scss` | inline link-button inside the send-failure sentence (inline, 1 px border, wraps with the text) |
| `.contact-form-submit` | `contact-form.scss` | full width on phone, centred with `min-width: 200px` from tablet; spinner when `[disabled]`; focus outline |
| `.lead-magnet-section .btn` | `LeadMagnetSection.scss` | empty rule (ring commented out) |

## 7. Classes used in markup with no CSS (no effect; debt, not removed)
| Class | Where |
|---|---|
| `.btn-medium` | `PackageCard/index.tsx` (6×) |
| `.btn-sm` | `Header/index.tsx` (with `.btn-small`) |
| `.btn-outline` | `EmailCollectorProvider/index.tsx` (close button of the download step) |
| `.btn-disabled` | `CalendlyButton/index.tsx`; styled only in `CalendlyButton.scss`, which is never imported |

`CalendlyButton` also builds `btn-${variant}` / `btn-${size}` (`btn-outline`, `btn-link`, `btn-sm`, `btn-lg`); only
`btn-primary` / `btn-secondary` have CSS.

## 8. Removed / never existed
- `.cta`, `.cta-mobile`: listed by the previous version of this file; not in the code.
- `.btn-secondary` **exists** (the previous version said it was removed).
- `.btn-ghost`, `.btn-success`, `.btn-danger`, `.btn-extra-large`, `.btn-full-width`, `.btn-loading`,
  `.btn-with-icon`, `.cta-secondary`, `.cta-outline`, the legacy `.button`: not in the code.

## 9. Usage
| Component / page | Classes |
|---|---|
| `Hero/HeroCTA.tsx` | `btn btn-primary typo-uppercase typo-extrabold` (hero CTA); `btn btn-secondary typo-extrabold` (download variant) |
| `FinalCTASection/index.tsx` | primary `btn btn-primary typo-uppercase typo-extrabold`; secondary `btn btn-secondary typo-uppercase typo-extrabold` |
| `about-magneto/page.tsx` | `btn btn-secondary` ("Tell me about your project") |
| `services/ServicesList.tsx` | `btn btn-secondary service-cta` |
| `PackageCard/index.tsx` | `btn btn-primary btn-medium` (+ `package-card__cta`); `btn btn-secondary btn-medium` |
| `ProjectDetail/index.tsx` | `btn btn-secondary` (back to projects) |
| `NotFound/index.tsx` | `btn btn-primary`, `btn btn-secondary` |
| `ContactForm.tsx` | `btn btn-primary contact-form-submit`; `form-error__cta btn …` in the failure message |
| `Header/index.tsx` | `btn btn-primary btn-sm btn-small`; `btn-small btn-secondary`; `btn-small` |
| `EmailCollectorProvider/index.tsx` | `btn btn-primary`; `btn btn-outline` |
| `LeadMagnetSection/index.tsx` | `btn btn-secondary typo-extrabold` |
| `CalendlyButton/index.tsx` | `btn btn-${variant} [btn-${size}] [btn-disabled]` |

## 10. Adding new button styles
1. **Check first** whether existing classes can be combined (variant + context rule).
2. Add the rule to `button.scss` (global) or to the owning context's stylesheet (context rule), following the
   patterns above.
3. **Update this file in the same PR.**
4. Keep it minimal: no class without a use, no use without a class.
