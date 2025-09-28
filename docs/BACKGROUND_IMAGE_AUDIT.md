Background image & image usage audit

This document lists components that use large/background images or CMS-driven images and gives a recommendation whether to convert to next/image or to keep as CSS background.

Format: component → image path (static or CMS-driven) → current usage → available width/height → recommendation → priority

1) src/components/organisms/Hero
- image paths:
  - default visual (static): /assets/images/hero-main-visual.png
  - CSS background (static): /assets/images/hero-background.png
  - CMS-driven background: HomeHero.backgroundImage.sourceUrl (from GraphQL)
- current usage:
  - default visual: rendered with next/image with width/height
  - CSS background: `background-image: url('/assets/images/hero-background.png')` in `Hero.scss`
  - CMS background: previously applied via inline style `style={{ backgroundImage: `url(${backgroundImage})` }}`; now implemented to render through `WpResponsiveImage` (fill) when `backgroundImageNode` is present, or next/image.fill as a fallback for string URLs.
- available width/height:
  - default visual: 500x500 (code default)
  - background static/CMS: mediaDetails may be available via CMS and are mapped in `Hero/api.ts`; otherwise unknown.
- recommendation:
  - Convert CMS-driven background to `WpResponsiveImage` (fill) (implemented).
  - Keep static CSS background as decorative fallback OR convert to `next/image` fill if you want optimizer benefits. (Consider removing CSS background if CMS background exists.)
- priority: HIGH (CMS background conversion), MEDIUM (static CSS background conversion)

2) src/components/organisms/FinalCTASection
- image paths: CMS bgimage.node.sourceUrl
- current usage: `WpResponsiveImage` with `fill` inside `.final-cta-section__bg` (already implemented)
- available width/height: derived from mediaDetails via WpResponsiveImage
- recommendation: keep as-is (already optimized)
- priority: LOW

3) src/components/organisms/ProjectsGrid
- image paths: project.featuredImage.node.sourceUrl (CMS) / fallback placeholder
- current usage: `WpResponsiveImage` for CMS images; fallback `next/image` with explicit width/height
- available width/height: code passes width=390, height=270
- recommendation: keep as-is
- priority: LOW

4) src/components/organisms/FeaturedServices and ServiceCard
- image paths: service.image.node.sourceUrl (CMS) and service.serviceIcon.node.sourceUrl (CMS) or icon string
- current usage: main image uses `next/image` (675x675); icons use `IconComponent` (SVG => <img> or raster => next/image)
- available width/height: main image 675x675; icons small
- recommendation: consider switching main CMS images to `WpResponsiveImage` if you want WP-provided srcset; icons stay with `IconComponent` (done)
- priority: LOW

5) src/components/organisms/Footer
- image paths: footer social icons (icon.iconSvg.node.sourceUrl) or fallback /assets/images/default-icon.svg
- current usage: previously used next/image (now recommend IconComponent or <img> for SVGs)
- available width/height: 24x24 in markup
- recommendation: use `IconComponent` (SVG -> <img) for social icons to avoid next/image svg issues; if you want raster optimization and the images are remote, configure next.config or keep <img>.
- priority: MEDIUM

6) src/components/molecules/PackageCard
- image paths: icon prop default /assets/images/ico-services-web-dev.svg; check icon /assets/images/ico-check.svg
- current usage: icon via `IconComponent`; check icon switched to `IconComponent` (done)
- available width/height: handled by IconComponent defaults
- recommendation: keep using `IconComponent` for consistency
- priority: LOW

7) src/components/organisms/Testimonials / TestimonialCard
- image paths: item.thumb.node.sourceUrl (CMS) / placeholder
- current usage: avatar path passed from loader; rendering component uses next/image or <img> in TestimonialCard (avatars small)
- available width/height: approximately 54x54 (placeholders show 54x54)
- recommendation: use next/image with explicit small dimensions or WpResponsiveImage for CMS avatars; ensure optimized size and fallback handling.
- priority: MEDIUM

8) Misc small components and CSS
- Many component styles are local SCSS files imported by the component itself. `main.scss` should not import component-level SCSS (we removed `CalendlyButton` import from `main.scss`).
- recommendation: keep `variables.scss`, `mixins.scss`, `helpers.scss`, `typography.scss`, and page-level SCSS in `main.scss`. Remove direct component SCSS imports from `main.scss`. Components should import their own SCSS files.
- priority: MEDIUM (clean-up step)

Notes and next steps
- I implemented the Hero background conversion to `WpResponsiveImage fill` when a CMS image node is present, and fallback to next/image.fill if only a URL string exists.
- I removed the global import of `CalendlyButton` SCSS from `main.scss` so component-level styles are imported by components instead.

If you want, I can now:
- apply the sample conversion in the codebase (Hero change already implemented) and run a dev build/smoke test (if you'd like me to run a local Next build, tell me and I'll run commands here), or
- continue the CSS-import minimization sweep: scan `main.scss` and the codebase for other component-level SCSS imported globally and remove them in the same pattern.

If you'd like the per-file mapping as JSON or CSV, I can export this mapping into `docs/background-image-audit.json` or `.csv` next.
