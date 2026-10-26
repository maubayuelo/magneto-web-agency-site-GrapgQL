# Phase 4 — UI microcopy dictionaries

- Status: Approved (2026-10-25: Mauricio; Senior Architect, with amendments 1–3, applied below)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-25 · Decisions A–F recorded 2026-10-25 (Mauricio); Senior Architect read: approved with amendments
- Branch: `spec/phase-4-ui-microcopy` (from `master` `8065eae`)
- ADR: `docs/adr/0005-ui-dictionaries.md`
- Depends on: `docs/reports/phase-3-localized-data.md`, `docs/reports/phase-3b-production-wpml-runbook.md`
  ("Issues found": raw 404 HTML, lead-magnet fallback), ADR 0001 §3, ADR 0003, ADR 0004

## Goal
Every hardcoded UI string that is rendered on a page (components, pages, not-found pages, forms, validation/success/error
messages, aria-labels, alt fallbacks, metadata fallbacks, footer) comes from a typed per-locale dictionary
(`en`, `fr`, `es`, same keys). The EN output stays byte-identical on the 7 EN routes. The 404 pages are custom and
use the dictionary, and they have a localized title. A build fails if `ENABLED_LOCALES` turns on a locale whose
dictionary still holds `[FR TODO]` / `[ES TODO]` placeholders.

---

## Evidence (facts verified now)

### E1 — Repository state
- `git log -1 master` → `8065eae Merge pull request #12 …docs/phase-3-close`. Working tree clean.
- `src/i18n/`: `config.ts` (LOCALES `en fr es`, `HTML_LANG`, `getEnabledLocales`), `paths.ts`
  (`splitLocalePath`, `localizePath`, `switchLocalePath`), `routing.ts`, `wp.ts`, plus tests. There are no dictionaries yet.
- Dependencies (`package.json`): no i18n library. ADR 0001 §3 says: "UI microcopy in typed dictionaries in code
  (`src/i18n/`), no i18n library unless a later spec proves the need."
- `npm test -- --run` → **24 files, 130 tests passed**.
- `npm run lint` → **149 errors / 110 warnings**, the figure the Phase 3 report measured. AGENTS.md still says 164 / 118.
  30 of the errors are `@next/next/no-html-link-for-pages`, all in `Header/index.tsx`: 10 `<a>` × 3 `[locale]` variants.
- `.env.local`: `NEXT_PUBLIC_WORDPRESS_API_URL=http://magneto-cms-2.local`, `ENABLED_LOCALES=en,fr,es`,
  `DISABLE_SMTP=1` (other values not printed).

### E2 — Raw 404 HTML, reproduced locally (Phase 3b issue)
On the existing local build (`.next`, BUILD_ID `GdgelMczjUyCIzua04nkq`, same `src/` as master), `next start -p 3100`:
```
404 /esto-no-existe         <html id="__next_error__"> <title>Magneto CMS</title>
404 /carte                  <html id="__next_error__"> <title>Magneto CMS</title>
404 /projects/no-existe     <html id="__next_error__"> <title>Magneto CMS</title>
404 /en/services            <html id="__next_error__"> <title>Magneto CMS</title>
404 /fr/esto-no-existe      <html id="__next_error__"> <title>Magneto CMS</title>
404 /fr/projects/no-existe  <html id="__next_error__"> <title>Magneto CMS</title>
404 /de/x                   <html id="__next_error__"> <title>Magneto CMS</title>
```
- The shell's `<head>` has `<meta name="robots" content="noindex"/>`, but the body also streams the layout's metadata,
  including `<meta name="robots" content="index, follow"/>` and `og:locale en_US`. Two conflicting robots tags.
- The RSC payload has the real tree: `["$","html",null,{"lang":"en",…}]` with the header, and
  `5:E{"digest":"NEXT_HTTP_ERROR_FALLBACK;404"}` for the page. After hydration the browser shows the layout plus Next's
  built-in 404, which matches the Phase 3b observation.
- The title "Magneto CMS" is the WordPress `generalSettings.title`, from `[locale]/layout.tsx` `generateMetadata`.

### E3 — Why: Next 15.5.28 source and a minimal repro
- `node_modules/next/dist/server/app-render/app-render.js:1402–1440`: when the SSR shell render throws an HTTP-fallback
  error (`notFound()`), Next sets the status and renders `ErrorApp` from `getErrorRSCPayload`. That payload's seed
  data is a hardcoded `<html id="__next_error__"><head/><body/></html>` (lines 709–727), with no `lang` and no layout.
- `dist/lib/metadata/resolve-metadata.js:330–361` (`collectMetadata` with `errorConvention`): in that error render,
  metadata is the layouts' metadata **plus the `not-found` module's `metadata`/`generateMetadata`**, pushed last
  (line 448), so the not-found metadata wins.
- Minimal repro in the scratchpad (the repo's `node_modules` symlinked, `next build && next start`, no repo files):

| App | Request | Status | Raw `<html>` | Raw `<title>` |
|---|---|---|---|---|
| A: `app/layout.tsx` (conventional root) + `app/not-found.tsx` (`metadata.title='NF title'`), `app/[slug]/page.tsx` calls `notFound()` | `/nope` | 404 | `<html id="__next_error__">` | `NF title` |
| A | `/a/b` (no route matches → static `_not-found`) | 404 | `<html lang="en">` + header + custom 404 | `NF title` |
| B: our shape, `app/[locale]/layout.tsx` root + `[locale]/not-found.tsx` + `[...rest]/page.tsx` `notFound()` | `/en/nope` | 404 | `<html id="__next_error__">` | `NF title` |
| B, `not-found.tsx` with `generateMetadata(props)` returning `'NF ' + JSON.stringify(await props.params)` | `/en/nope` | 404 | `<html id="__next_error__">` | `NF {"locale":"en"}` |

**Conclusion (fact):** on Next 15.5.28, **any runtime `notFound()`** gives a raw HTML shell with no `lang`, whether
or not the root layout sits under `[locale]`. Only requests that match **no** route get full server HTML. Our
middleware + `[...rest]` catch-all match everything, and project slugs are dynamic, so every 404 here is a runtime
`notFound()`. A `generateMetadata` in `[locale]/not-found.tsx` **does** receive `params.locale` and **does** set the
raw `<title>`. The missing raw `lang` can't be fixed in app code without changing routing (see Decision F).

### E4 — How strings render today (byte-identity traps)
From the built EN HTML (`.next/server/app/en*.html`):
- Footer: `Magneto Marketing - All Rights Reserved, <!-- -->2026<!-- -->.`. The JSX children
  `["…Reserved, ", year, "."]` produce React's text separators. A single interpolated string would drop them.
- `ProjectsGrid`: `Solution: </span>`. The trailing space is part of the string.
- `PackageCard`: `What&#x27;s included:`. JSX `&apos;` becomes `'`, which React escapes, so a plain `'` in a TS string gives the same bytes.
- `contact/layout.tsx` and `packages/layout.tsx` export `title:'Next.js'`/`description:'Generated by Next.js'`.
  The pages override them (`<title>Contact - Magneto Marketing</title>`, `<title>Packages - Magneto Marketing</title>`).
- The Phase 2/3 normalization strips `<script>`, `<link>`, `/_next/static` hashes and the build-ID comment. So changes
  to client-component props in the RSC payload don't count, but text and attribute changes do.

### E5 — Who renders what (server vs client)
- Client (`"use client"` or imported by a client parent): Header, CalendlyButton, ContactForm, ProjectsGrid,
  LeadMagnetSection, FinalCTASection, HeroCTA, PackagesGrid → PackageCard, EmailCollectorProvider, LanguageSwitcher.
- Server: `[locale]/layout.tsx`, all `page.tsx`, ServicesList, ProjectDetail, Footer (via FooterLoader),
  FeaturedServices + ServiceCard (via FeaturedServicesLoader), AboutSection, HeroLoader / Hero.
- `utils/calendly.ts` builds its modal with DOM APIs (not React). It is opened by CalendlyButton and EmailCollectorProvider.
- Mailchimp consumers (ADR 0002 "do not extend or refactor"): EmailCollectorProvider, LeadMagnetSection,
  PackageCard, HeroCTA, `pages/api/contact.ts`.
- Not rendered anywhere: `FormField` (exported only), `PreFooter`, `Loader` (via the unused `LoaderClientProvider`),
  `SimpleContactForm` (a re-export), `Testimonials` (commented out on home), `TestimonialCard`.
- Existing tests query EN text: `ProjectsGrid.test.tsx` ("Everything unfolds…", "Book a Free Strategy Call"),
  `EmailCollectorProvider.test.tsx` (placeholders, button names), `LanguageSwitcher.test.tsx` (group "Language"),
  `CalendlyButton.test.tsx` (modal placeholder). None of them wrap the component in a provider.

### E6 — Internal links (needed for FR/ES navigation)
Hardcoded EN paths, not localized: Header nav ×10 (`<a href="/about-magneto/">`…) and logo `Link href="/"`;
`FeaturedServices:39` `/services/`; `ServiceCard:24` `/services#…`; `ProjectsGrid:57,76,94`; `ProjectDetail:150`
`/projects`; `projects/[slug]/not-found.tsx:21` **`/portfolio`** (broken since Phase 2), `:24` `/`; `PackageCard:92`
default `ctaHref='/contact'` (only used as a Calendly test, never rendered as an href).

---

## 1. Inventory of hardcoded strings

Key column = proposed dictionary key (namespace.key). Several rows share a key on purpose. **EN values are copied
byte-exact** (curly ’, em dash —, en dash –, `...` vs `…`, trailing spaces).

### 1a. UI strings (in scope)

| File:line | String (EN, exact) | Key |
|---|---|---|
| `app/[locale]/page.tsx:69` · `ProjectsGrid/index.tsx:19` (default prop) | `Recent Projects` | `home.recentProjects` |
| `app/[locale]/page.tsx:82` | `Magneto Marketing - Home` | `meta.home.title` |
| `app/[locale]/page.tsx:83` | `Magneto Marketing — strategy, web development and UX services for solo founders and small teams.` | `meta.home.description` |
| `services/page.tsx:63` | `Services` | `services.errorTitle` |
| `services/page.tsx:64` | `Sorry, we couldn't load the services right now. Please try again later.` | `services.errorBody` |
| `services/page.tsx:92` (catch) | `Services - Magneto Marketing` | `meta.services.title` |
| `services/page.tsx:93` (catch) | `Strategy, Web Development, UX/UI and growth services offered by Magneto Marketing.` | `meta.services.description` |
| `services/ServicesList.tsx:51` | `Featured Service` | `services.featuredBadge` |
| `packages/page.tsx:41,50` | `Packages - Magneto Marketing` | `meta.packages.title` |
| `packages/page.tsx:42,51` | `Browse service packages and pricing for Magneto Marketing.` | `meta.packages.description` |
| `projects/page.tsx:40` | `Projects - Magneto Marketing` | `meta.projects.title` |
| `projects/page.tsx:41` | `A curated selection of recent projects and case studies by Magneto Marketing.` | `meta.projects.description` |
| `about-magneto/page.tsx:31` (catch) | `About Magneto - About the Agency` | `meta.about.title` |
| `about-magneto/page.tsx:32` (catch) | `Meet Magneto Marketing — a solo web agency focused on strategy, design and web development.` (source `—`) | `meta.about.description` |
| `about-magneto/page.tsx:80` | `LinkedIn Icon` | `about.linkedinIconAlt` |
| `about-magneto/page.tsx:92` · `ProjectsGrid:35` · `PackageCard:91` (default `ctaText`, always used: PackagesGrid never passes it) | `Book a Free Strategy Call` | `common.bookStrategyCall` |
| `contact/page.tsx:60,65` | `Contact - Magneto Marketing` | `meta.contact.title` |
| `contact/page.tsx:61,66` | `Get in touch with Magneto Marketing to book a strategy call or ask about services.` | `meta.contact.description` |
| `projects/[slug]/page.tsx:27` | `` `${project.title} \| Magneto Projects` `` | `meta.project.title` = `{title} \| Magneto Projects` |
| `projects/[slug]/page.tsx:22` | `Project Not Found` | `projectNotFound.metaTitle` |
| `projects/[slug]/not-found.tsx:16` | `Project Not Found` | `projectNotFound.heading` |
| `projects/[slug]/not-found.tsx:18` | `The project you're looking for doesn't exist or may have been moved.` (source `&apos;`) | `projectNotFound.body` |
| `projects/[slug]/not-found.tsx:22` | `View All Projects` | `projectNotFound.viewAll` |
| `projects/[slug]/not-found.tsx:25` | `Go Home` | `common.goHome` |
| `[locale]/not-found.tsx:3` (Next built-in, re-exported) | `404: This page could not be found.` (`<title>`) | `notFound.metaTitle` |
| ″ | `404` (h1) | `notFound.heading` |
| ″ | `This page could not be found.` (h2) | `notFound.body` |
| `Header/index.tsx:85,91,99,105` | `Logo` (alt) | `header.logoAlt` |
| `Header/index.tsx:117,162` | `About` | `nav.about` |
| `Header/index.tsx:118,163` | `Services` | `nav.services` |
| `Header/index.tsx:119,164` | `Packages` | `nav.packages` |
| `Header/index.tsx:120,165` | `Projects` | `nav.projects` |
| `Header/index.tsx:121,166` | `Contact` | `nav.contact` |
| `Header/index.tsx:126,136` | `Free Schedule Call` | `header.scheduleCall` |
| `Header/index.tsx:151` | `Menu` / `Close` (alt, toggled) | `header.menuOpen` / `header.menuClose` |
| `LanguageSwitcher/index.tsx:13` (default `label`; `types.ts:8` TODO(phase-4)) | `Language` | `header.languageSwitcher` |
| `Footer/index.tsx:51` | `Magneto Marketing - All Rights Reserved, {year}.` | `footer.copyright` |
| `FeaturedServices/index.tsx:40` | `Check All Services` | `featuredServices.checkAll` |
| `ServiceCard/index.tsx:27` | `Learn More` | `featuredServices.learnMore` |
| `ProjectsGrid/index.tsx:31` | `Everything unfolds in its sacred time.` | `projects.emptyTitle` |
| `ProjectsGrid/index.tsx:32` | `We’re planting and cultivating new digital projects with wonderful clients.` (curly ’) | `projects.emptySubtitle` |
| `ProjectsGrid/index.tsx:33` | `Do you have a project in mind?` | `projects.emptyQuestion` |
| `ProjectsGrid/index.tsx:80,82` | `Solution: ` (trailing space) | `projects.solutionLabel` |
| `ProjectsGrid/index.tsx:85,87` | `Outcome: ` (trailing space) | `projects.outcomeLabel` |
| `ProjectsGrid/index.tsx:95` | `Check All Projects` | `projects.checkAll` |
| `ProjectDetail/index.tsx:47` | `Challenges` | `projectDetail.challenges` |
| `ProjectDetail/index.tsx:61` | `Solutions` | `projectDetail.solutions` |
| `ProjectDetail/index.tsx:75` | `Results` | `projectDetail.results` |
| `ProjectDetail/index.tsx:83` · `PackageCard:137` | `Check icon` (alt) | `common.checkIconAlt` |
| `ProjectDetail/index.tsx:127` | `View live site` | `projectDetail.viewLiveSite` |
| `ProjectDetail/index.tsx:151` | `← Back to Projects` | `projectDetail.backToProjects` |
| `PackageCard/index.tsx:106` | `Popular` | `packages.popularBadge` |
| `PackageCard/index.tsx:132` | `What's included:` (source `&apos;`) | `packages.included` |
| `CalendlyButton/index.tsx:121` | `Loading...` | `common.loading` |
| `utils/calendly.ts:304` | `Close scheduling dialog` (aria-label) | `calendly.closeDialog` |
| `utils/calendly.ts:339` | `Calendly scheduling` (iframe title fallback) | `calendly.frameTitle` |
| `ContactForm.tsx:6–10` (labels only; `value`s stay EN, they go to the email) | `Coach` `Therapist` `Ecommerce` `Real State` `Other` | `contactForm.businessTypes.{coach,therapist,ecommerce,realEstate,other}` |
| `ContactForm.tsx:29` | `Please enter your name.` | `contactForm.errors.nameRequired` |
| `ContactForm.tsx:30` | `Please enter a valid email address.` | `contactForm.errors.emailInvalid` |
| `ContactForm.tsx:31` | `Please select a business type.` | `contactForm.errors.businessTypeRequired` |
| `ContactForm.tsx:48` (when the server sends no message) | `Failed to submit form` | `contactForm.errors.submitFailed` |
| `ContactForm.tsx:60` | `Submission failed` | `contactForm.errors.unknown` |
| `ContactForm.tsx:53` | `Thanks! We'll get back to you within 24–48 hours.` (en dash) | `contactForm.success` |
| `ContactForm.tsx:68` | `Contact form` (aria-label) | `contactForm.ariaLabel` |
| `ContactForm.tsx:70` | `Name` | `contactForm.nameLabel` |
| `ContactForm.tsx:71` | `Your name` (placeholder) | `forms.namePlaceholder` |
| `ContactForm.tsx:75` | `Email Address` | `contactForm.emailLabel` |
| `ContactForm.tsx:76` | `you@company.com` (placeholder) | `forms.emailPlaceholder` |
| `ContactForm.tsx:80` | `Business Type` | `contactForm.businessTypeLabel` |
| `ContactForm.tsx:82` | `Choose an option` | `contactForm.businessTypePlaceholder` |
| `ContactForm.tsx:90` | `Message (optional)` | `contactForm.messageLabel` |
| `ContactForm.tsx:91` | `A short note about your project` | `contactForm.messagePlaceholder` |
| `ContactForm.tsx:98` | `Sending...` / `Send` | `contactForm.sending` / `contactForm.send` |

**Email modal: `EmailCollectorProvider/index.tsx` (Decision C: strings-only exception to ADR 0002).**

| Line | String (EN, exact) | Key |
|---|---|---|
| 73 | `Please enter a valid email` | `emailModal.errors.emailInvalid` |
| 95 (when the server sends no message) | `` `Failed to subscribe (${res.status})` `` | `emailModal.errors.subscribeFailed` = `Failed to subscribe ({status})` |
| 198 | `Subscription failed` | `emailModal.errors.unknown` |
| 211, 274 | `Close` (aria-label; button) | `common.close` |
| 226, 246 | `Quick — before we book` | `emailModal.bookingTitle` |
| 227 | `Tell us who you are so we can prep a smarter session tailored to your goals.` | `emailModal.calendlyBody` |
| 235 | `Grab your free guide` | `emailModal.downloadTitle` |
| 238 | `Thanks — your guide is ready for you.` | `emailModal.downloadReady` |
| 239 | `Enter your name and email, so we can send marketing ideas and tips.` | `emailModal.downloadBody` |
| 247 | `Enter your name and email so we can send confirmation and reminders.` | `emailModal.defaultBody` |
| 257 | `Checking...` | `emailModal.checking` |
| 260 | `Download the free guide` | `emailModal.download` |
| 265 | `Open guide in new tab` | `emailModal.openInNewTab` |
| 268 | `Download unavailable` | `emailModal.downloadUnavailable` |
| 271 | `Preparing download...` | `emailModal.preparing` |
| 279 | `Sorry — we couldn't find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co` | `emailModal.pdfNotFound` |
| 284 | `The file appears to be protected by the host (bot challenge). Click "Open guide in new tab" to let your browser complete the challenge and download the file.` | `emailModal.botChallenge` |
| 291 | `Name` | `emailModal.nameLabel` |
| 297 / 309 | `Your name` / `you@company.com` | `forms.namePlaceholder` / `forms.emailPlaceholder` |
| 303 | `Email` | `emailModal.emailLabel` |
| 319 | `Submitting...` · `Continue to Download the Guide` · `Continue to Book Call` · `Subscribe` | `emailModal.submitting` · `.continueDownload` · `.continueBooking` · `.subscribe` |

### 1b. CMS-fallback strings (shown only when a CMS field is empty or the fetch fails), flagged separately
These are the EN fallbacks for ACF / WP fields. Policy: Decision E.

| File:line | String (EN, exact) | Shown when | Key |
|---|---|---|---|
| `LeadMagnetSection/index.tsx:65` | `Not ready to book a call?` | `overTitleLeadMagnetSection` empty, **and on every first render** (client fetch). That is why Phase 3b saw it on 404s | `cmsFallback.leadMagnet.overTitle` |
| `LeadMagnetSection/index.tsx:68` | `Download our free guide:` | same | `cmsFallback.leadMagnet.title` |
| `LeadMagnetSection/index.tsx:71` | `5 Mistakes That Kill Funnel Conversions` | same | `cmsFallback.leadMagnet.subtitle` |
| `LeadMagnetSection/index.tsx:88` · `FinalCTASection:22,101,105` | `Request Free Quote` | CTA text empty | `cmsFallback.requestQuote` |
| `FinalCTASection/index.tsx:80` | `Background` (alt) | `title` empty | `cmsFallback.finalCta.bgAlt` |
| `FinalCTASection/index.tsx:91` | `Stop losing leads. Start converting.` | `title` empty | `cmsFallback.finalCta.title` |
| `FinalCTASection/index.tsx:94` | `Request your free funnel quote today and find out what's holding you back.` | `subtitle` empty | `cmsFallback.finalCta.subtitle` |
| `FeaturedServices/index.tsx:13` · `FeaturedServicesLoader.tsx:10,15` · `FeaturedServices/api.ts:48` | `Featured Services` | `sectionTitle` empty / fetch error | `cmsFallback.featuredServicesTitle` |
| `HeroLoader.tsx:33` | `Hero Image` (alt) | page `title` empty | `cmsFallback.heroImageAlt` |
| `Footer/index.tsx:34` | `Social Icon` (alt) | icon has no `alt` (the query never selects one, so **always**) | `cmsFallback.socialIconAlt` |
| `ProjectDetail/index.tsx:108` | `` `Gallery image ${i + 1}` `` (alt) | `footNote` empty | `cmsFallback.galleryImageAlt` = `Gallery image {n}` |
| `layout.tsx:25` | `Magneto Marketing - Web Solo Agency Portfolio and Services` | WP `generalSettings.title` empty / fetch error | `meta.site.fallbackTitle` |
| `layout.tsx:26` | `A creative digital agency showcasing work and services.` | WP `description` empty / error | `meta.site.fallbackDescription` |
| `about-magneto/page.tsx:16,17` | (same values as `meta.about.*`) | `data.title` / `meta_description` empty | `meta.about.*` |
| `services/page.tsx:83,84` | (same values as `meta.services.*`) | REST `title` missing (`WP_API` unset → always the catch path) | `meta.services.*` |

### 1c. Excluded (with reason). The Dev leaves these as they are.
- **Brand / code:** `siteName` and the og:image alt `Magneto Marketing` (`utils/seo.ts:8,15`), the hero title fallback
  `"Magneto"` (`HeroLoader.tsx:25`), currency `'CAD'` (`PackageCard:87`), `SHORT_NAME`/`NATIVE_NAME` in
  LanguageSwitcher (each language names itself; there is a comment in the code saying so), `×` glyph.
- **Unreachable defaults:** `Hero/index.tsx:46` (`'Mauricio - Web Designer & Developer'`) and `:95` (`'Hero Image'`).
  HeroLoader always passes `image` + `alt` when `showImage` is true.
- **Dev placeholders, not copy:** `Footer/index.tsx:12,48` `Default Footer Line 1/2` (Issue I-3).
- **Not rendered:** `FormField:60` `Select option`, `Loader.tsx:12` `Loading…`, `Testimonials:21` `Some Testimonials`,
  `TestimonialCard:16`, `PreFooter`, `SimpleContactForm`.
- **Overridden, never output:** `contact/layout.tsx:3–4`, `packages/layout.tsx:3–4` (`Next.js` …), see E4 (Issue I-4).
- **Not UI:** console/`devConsoleError` text, `pages/api/*` response messages (ContactForm shows
  `payload.message` from `/api/contact` when present; that stays as is, Issue I-5), analytics event labels, env-var
  error messages in `utils/wordpress.ts`, `ServiceIcon` alt `${type} icon` (built from the icon URL, an a11y issue,
  I-6).

---

## Assumptions and open questions
- **Assumption A1:** No Notion copy exists yet for UI microcopy or 404 text. The Notion tools were not loaded
  in this session, so I couldn't check. If FR/ES microcopy exists in the Notion copy pages, Decision B gets cheaper.
- **Assumption A2:** The custom 404 introduces **no new EN copy**. It reuses `404`,
  `This page could not be found.`, `404: This page could not be found.` (Next's current strings) and `Go Home`
  (already approved, from the project 404). Any new wording comes from Mauricio (hard rule 4).
- **Assumption A3:** No CMS change: no new GraphQL field or ACF group. So no production runbook is needed, and the
  Vercel preview builds against production as is.
- **O1, decided (Senior Architect):** `Real State` stays **byte-exact** in Phase 4. Mauricio fixes it in a separate
  copy PR after the phase. The Dev must not change it, and the EN fingerprint (AC-4) keeps `Real State`.
- **O2, decided (Senior Architect):** Mauricio decides the FR/ES email placeholder when he writes the FR/ES values.
  No spec change: in Phase 4, `forms.emailPlaceholder` is `[FR TODO] you@company.com` / `[ES TODO] you@company.com` like every other key.

---

## 2. Design

### 2.1 Dictionary files (native, no dependency; Decision A)
```
src/i18n/dictionaries/en.ts   export const en = { common: {…}, nav: {…}, … }        // source of truth, plain object
src/i18n/dictionaries/fr.ts   export const fr: Dictionary = { … }                   // same keys
src/i18n/dictionaries/es.ts   export const es: Dictionary = { … }
src/i18n/dictionary.ts        export type Dictionary = typeof en  (widened: every leaf `string`)
                              export function getDictionary(locale: Locale): Dictionary   // sync, pure
                              export function format(template: string, vars: Record<string, string|number>): string
                              export function formatParts(template: string, vars: Record<string, ReactNode>): ReactNode[]
src/i18n/I18nProvider.tsx     'use client' · <I18nProvider locale dictionary> · useI18n(): { locale, t }
```
- `en` is declared **without** `as const`, so `typeof en` widens every leaf to `string`. `fr: Dictionary` /
  `es: Dictionary` object literals then fail `tsc` on a **missing** key (required property) and on an **extra** key
  (excess-property check on fresh nested literals). The runtime test (2.4) covers the same thing for anything a cast could hide.
- Placeholders use `{name}` (`{year}`, `{n}`, `{title}`, `{status}`). No ICU and no plurals: none are needed (§1).
- `format()` is for attributes and metadata (`alt`, `title`). `formatParts()` returns
  `["…Reserved, ", 2026, "."]` for JSX children, so React emits the same `<!-- -->` separators as today (E4).
  **Rule:** wherever the current JSX mixes text and `{expr}`, use `formatParts`, not `format`.
- **Server components / `generateMetadata`:** `const t = getDictionary(locale)`, with `locale` from `params`
  (Phase 3 pattern: `isLocale(raw) ? raw : DEFAULT_LOCALE`).
- **Client components:** `const { t, locale } = useI18n()`. `[locale]/layout.tsx` wraps the body content in
  `<I18nProvider locale={locale} dictionary={getDictionary(locale)}>`. The provider renders no DOM, so the HTML doesn't change.
  - Outside a provider (unit tests), `useI18n()` returns `{ locale: 'en', t: en }`. Existing tests then pass
    unchanged, as with `useOptionalEmailModal`.
  - **Client files never import `getDictionary`, `fr.ts` or `es.ts`.** That keeps the other locales out of the
    client bundle; acceptance check AC-9 verifies it.
  - Cost: the locale's dictionary is serialized once into each page's RSC payload, ≈ 5–7 KB raw (stripped by the
    normalization).
- **Locale source:** always the route `params.locale` (server) or the provider (client). Never derive it from
  `usePathname()`: disabled `/fr/x` renders the EN layout, and on the server the pathname may be internal (ADR 0003).
- `ENABLED_LOCALES` doesn't affect which dictionaries exist. All three always exist, and routing decides what is
  reachable. The one link between them is the readiness guard (§2.1a).
- **FR/ES values (Decision B):** every `fr.ts` value is `"[FR TODO] " + <EN value>`, and every `es.ts` value is
  `"[ES TODO] " + <EN value>`. Placeholders in a value (`{year}`…) are kept, so the parity test passes. Mauricio
  replaces the values later (outside this phase).

### 2.1a Readiness guard (Decision B): a build fails on an enabled locale with TODO markers
Vercel runs `next build`, not the tests, so the guard must run **inside the build**. A test alone can't see the
`ENABLED_LOCALES` Vercel builds with.
- In `src/i18n/dictionary.ts` (pure, unit-tested):
  - `findTodoKeys(dict): string[]` returns the flattened keys whose value contains `TODO]`.
  - `assertLocalesReady(enabled: Locale[], opts: { allowUntranslated: boolean }): void` throws an `Error` that names
    each enabled non-EN locale with markers, its count and the first 5 keys. For example:
    `ENABLED_LOCALES enables fr, but its dictionary has 93 untranslated keys ([FR TODO]): nav.about, …`.
    It is a no-op when `allowUntranslated` is true or when only `en` is enabled.
- **Call site:** the start of `generateStaticParams()` in `src/app/[locale]/layout.tsx`, which Next calls once
  during `next build`:
  ```ts
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    assertLocalesReady(getEnabledLocales(), { allowUntranslated: process.env.ALLOW_UNTRANSLATED_LOCALES === '1' });
  }
  ```
  - Fact: `next build` sets `process.env.NEXT_PHASE = PHASE_PRODUCTION_BUILD` (`node_modules/next/dist/build/index.js:1010`).
  - `next dev` is not affected: Mauricio's local `.env.local` (`en,fr,es`) keeps working, and the dev server never
    throws because of markers.
- **Override `ALLOW_UNTRANSLATED_LOCALES=1`:**
  - It is **local-only**, for the Dev's and Mauricio's own builds while placeholders exist.
  - It is added to `.env.local.example`, commented out, with a comment saying it must never be set in Vercel.
  - It is checked as `'1'`, like `DISABLE_SMTP`.
  - The Dev never edits `.env.local`. They pass the override on the command line, e.g.
    `ALLOW_UNTRANSLATED_LOCALES=1 npm run build`. Shell env takes precedence over `.env.local`.
- **EN-only builds** (production today, `ENABLED_LOCALES` unset) never throw. No production or preview behaviour changes.

### 2.2 Threading
- Server components that render strings take a `locale: Locale` prop (same as Phase 3), and their loaders pass it:
  `Footer` (from FooterLoader), `FeaturedServices` (from FeaturedServicesLoader) → `ServiceCard`, `ServicesList`,
  `ProjectDetail`. `FeaturedServices/api.ts` already has `locale` for its fallback title.
- Client components use `useI18n()`: Header, CalendlyButton, ContactForm, ProjectsGrid, LeadMagnetSection,
  FinalCTASection, PackageCard, EmailCollectorProvider (Decision C), NotFoundContent. Their props are **unchanged**.
- **Internal links (Decision D1):** every internal href listed in E6 becomes `localizePath(<same path>, locale)`
  on the **same element**: `<a>` stays `<a>` (Header nav) and `Link` stays `Link`.
  - The existing helper already returns the path **unchanged for EN** (`src/i18n/paths.ts:20`,
    `if (locale === DEFAULT_LOCALE) return path;`). It keeps the trailing slash as given (`/about-magneto/` →
    `/about-magneto/`, `/fr/about-magneto/`), and `paths.test.ts` covers both cases. The EN HTML stays byte-identical.
  - `paths.ts` is **not** modified. The Dev adds no new path helper and does no string concatenation (ADR 0003 D2).
  - Exception: the `ServiceCard` hash link is `` `${localizePath('/services', locale)}#${anchor}` ``, so the hash stays
    out of the path argument.
  - The `/portfolio` → `/projects` fix in the project 404 is the only href that changes in EN (a 404 page).
- `LanguageSwitcher`: the layout passes `label={t.header.languageSwitcher}`. The props are unchanged; only the
  `TODO(phase-4)` comment in `types.ts` is removed.
- `utils/calendly.ts`: `openCalendlyPopup(options)` gets an optional
  `labels?: { closeDialog: string; frameTitle: string }`, defaulting to the EN dictionary values. CalendlyButton
  and EmailCollectorProvider pass `t.calendly`. The current `iframe.title = label || …` behaviour
  (label = utmContent) is kept (Issue I-7).
- Metadata: every `generateMetadata` that returns a hardcoded title takes `{ params }` and reads `t.meta.*`. That includes
  `app/[locale]/page.tsx`, `projects/page.tsx` (both currently take no args) and the layout fallbacks. The CMS-first
  logic (about, services REST) stays; only the fallback literal changes. `openGraph.locale` stays as is (Phase 7).

### 2.3 Not-found pages (scope item 3)
Given E3, the design is:
1. **`[locale]/not-found.tsx`** replaces the built-in re-export:
   - `export async function generateMetadata({ params })`: picks the locale and returns
     `{ title: t.notFound.metaTitle, robots: { index: false, follow: false } }`.
     This sets the raw `<title>` (proved in E3, last table row). It also replaces the layout's `index, follow` with a
     consistent noindex.
   - The default export renders `<NotFoundContent variant="page" />`.
2. **`projects/[slug]/not-found.tsx`**: same pattern, with `t.projectNotFound.metaTitle` and
   `<NotFoundContent variant="project" />`. It keeps the current markup and look (heading, body, two buttons).
   **Fixes the broken `/portfolio` link** → `localizePath('/projects', locale)`. "Go Home" → `localizePath('/', locale)`.
3. **`src/components/organisms/NotFound/`** (`index.tsx` client + `types.ts` + `NotFound.scss`):
   - It uses `useI18n()`, because a not-found component gets no `params`. It renders inside `[locale]/layout.tsx`'s
     children, so it is inside the provider, and its locale is the layout's.
   - `variant="page"`: h1 `t.notFound.heading` ("404"), p `t.notFound.body`, `Link` `t.common.goHome`.
     It uses the same section structure and spacing as the project 404, so the site has one 404 look instead of
     Next's system-font page.
   - `variant="project"`: today's project 404 strings and layout.
   - The current inline styles of `projects/[slug]/not-found.tsx` move to `NotFound.scss` (BEM `not-found__*`) with
     the same values, so the project 404 looks the same.
4. **What stays (framework limit, Decision F1: accepted, recorded in AGENTS.md Known debt):**
   - The raw 404 HTML remains Next's `<html id="__next_error__">` shell without `lang`. The status is 404, with
     noindex. `lang`, header, body and footer arrive with hydration.
   - The fix gives a correct raw `<title>` and a single robots signal. After hydration: `lang` per locale, localized
     content, header and footer.
   - The Dev must **not** try to put `lang` into the shell (no `document` hacks, no custom server).
5. `generateMetadata` in `projects/[slug]/page.tsx` keeps its `!project` branch (now `t.projectNotFound.metaTitle`).
   E2 shows it isn't what reaches the raw 404, but it is harmless.

### 2.4 Tests (Vitest, new files only; existing tests are not edited)
- `src/i18n/dictionary.test.ts`:
  - **Key parity:** the flattened key sets of `en`, `fr`, `es` are equal. It fails listing missing and extra keys per locale.
  - Every leaf is a non-empty string.
  - The same `{placeholder}` set appears per key in every locale.
  - `getDictionary` returns the right object per `Locale`.
  - `format` / `formatParts` cases, including the footer → `["Magneto Marketing - All Rights Reserved, ", 2026, "."]`.
- `src/i18n/dictionaries/en.test.ts`, the **EN fingerprint**: a literal table of every §1a/§1b EN value
  (key → exact string, copied from the V0 sources). It asserts that the flattened `en` equals the table, so no EN
  value is altered: punctuation, dashes, ellipses and spaces included.
  - Any key added later must be added to the table too.
  - This covers client-only strings (modal, validation, Calendly) that never appear in SSR HTML.
- `src/i18n/dictionary.test.ts` (same file), **readiness guard**:
  - `findTodoKeys(en)` is `[]`; `findTodoKeys(fr)` lists every key while placeholders exist;
  - `assertLocalesReady(['en'])` and `assertLocalesReady(['en','fr'], { allowUntranslated: true })` don't throw;
  - `assertLocalesReady(['en','fr'], { allowUntranslated: false })` throws, and the message names `fr`;
  - a fixture dictionary without markers passes.
- `src/i18n/I18nProvider.test.tsx`: the provider value reaches `useI18n()`, and without a provider it falls back to `en`.
- `src/components/organisms/NotFound/NotFound.test.tsx`:
  - both variants with EN, in a provider with `fr`, and with project links localized for `fr`
    (`/fr/projects`, `/fr`);
  - the EN `/projects` link (no `/portfolio`).
- One rendering test per **client form** in FR: `ContactForm` in a provider with `fr` shows `fr` labels and the
  `fr` validation error on an empty submit. No network: the validation runs before `fetch`.

---

## Files the Dev may touch
New:
- `src/i18n/dictionaries/en.ts`, `fr.ts`, `es.ts`, `en.test.ts`
- `src/i18n/dictionary.ts`, `dictionary.test.ts`
- `src/i18n/I18nProvider.tsx`, `I18nProvider.test.tsx`
- `src/components/organisms/NotFound/index.tsx`, `types.ts`, `NotFound.scss`, `NotFound.test.tsx`
- `src/components/organisms/ContactForm.test.tsx`
- `docs/reports/phase-4-ui-microcopy.md`

Modified (strings → dictionary, `locale` threading, links per Decision D):
- `src/app/[locale]/layout.tsx`: provider, LanguageSwitcher `label`, `generateMetadata({ params })` fallbacks,
  readiness guard call in `generateStaticParams` (§2.1a)
- `.env.local.example`: commented `# ALLOW_UNTRANSLATED_LOCALES=1` with a local-only / never-in-Vercel comment
- `src/app/[locale]/not-found.tsx`, `src/app/[locale]/projects/[slug]/not-found.tsx`
- `src/app/[locale]/page.tsx`, `about-magneto/page.tsx`, `contact/page.tsx`, `packages/page.tsx`,
  `projects/page.tsx`, `projects/[slug]/page.tsx`, `services/page.tsx`, `services/ServicesList.tsx`
- `src/components/organisms/Header/index.tsx`
- `src/components/organisms/Footer/index.tsx`, `Footer/FooterLoader.tsx`
- `src/components/organisms/FeaturedServices/index.tsx`, `FeaturedServicesLoader.tsx`, `api.ts` (fallback title only)
- `src/components/molecules/ServiceCard/index.tsx`
- `src/components/organisms/ProjectsGrid/index.tsx`
- `src/components/organisms/ProjectDetail/index.tsx`
- `src/components/molecules/PackageCard/index.tsx` (strings only; ADR 0002 exception, Decision C)
- `src/components/organisms/LeadMagnetSection/index.tsx` (fallback strings only; ADR 0002 exception)
- `src/components/organisms/FinalCTASection/index.tsx`
- `src/components/organisms/Hero/HeroLoader.tsx` (`'Hero Image'` only)
- `src/components/atoms/CalendlyButton/index.tsx`
- `src/utils/calendly.ts` (optional `labels`, EN defaults)
- `src/components/organisms/ContactForm.tsx`
- `src/components/organisms/EmailCollectorProvider/index.tsx`: strings only (Decision C, ADR 0002 exception)
- `src/components/molecules/LanguageSwitcher/types.ts`: remove the TODO comment only
- `AGENTS.md` (only these lines):
  - Line 93, the "Where text lives" UI microcopy row → `src/i18n/dictionaries/{en,fr,es}.ts`, read with
    `getDictionary(locale)` (server) / `useI18n()` (client).
  - Line 145 → `lint baseline 149 errors / 110 warnings (measured 2026-10-25, Phase 4)`. If Phase 4 itself changes
    the count, use the number measured **after** Phase 4 and give both in the report.
  - Lines 146–147 (`no-html-link-for-pages`): keep the facts. Replace "resolved in Phase 4 when nav links move to
    localized `next/link`" with "Phase 4 kept plain `<a>` with `localizePath` (Decision D1); resolved when nav
    links move to `next/link` in a phase that verifies analytics with soft navigation."
  - New Known-debt line (Code): "Raw 404 HTML is Next 15.5's `<html id="__next_error__">` shell (no `lang`, no
    layout) for every runtime `notFound()`. The `<title>` is localized via `not-found.tsx` `generateMetadata`;
    `lang`, header and content arrive with hydration. Framework limit (Phase 4 spec E3); revisit with next@16."
  - New Known-debt line (Code): the lead-magnet SSR issue (I-9).
  - New line under Commands or Hard rules: "`ALLOW_UNTRANSLATED_LOCALES=1` is for local builds only; never set
    it in Vercel."

Anything not listed is out of scope. In particular: `Hero/index.tsx`, `HeroCTA.tsx`, `PackagesGrid`,
`pages/api/*`, `next.config.ts`, `middleware.ts`, `src/i18n/{config,paths,routing,wp}.ts`, every existing test file,
`package.json`.

## Out of scope
- CMS content translation, FR/ES pages and projects (Phase 5).
- SEO localization beyond the fallbacks: `openGraph.locale`, hreflang, canonical, sitemap, per-page localized
  descriptions from the CMS (Phase 7).
- Visual bugs, e.g. the mobile header overlap (Phase 8). Only the 404 body gets new styling.
- Mailchimp → Brevo logic (ADR 0002), server/API response messages, the `/carte` route, `Real State` wording (O1).
- Writing FR/ES values (Decision B). This phase ships marked placeholders.
- Server-rendering the lead-magnet CMS copy (I-9). Its behaviour is not changed in this phase.

---

## Acceptance criteria

**V0 — "before" capture.** Git worktree at `master` `8065eae`, `next build && next start -p 3100`, Mauricio's `:3000`
and `.next` untouched, two builds as in Phase 3: `ENABLED_LOCALES=` and `ENABLED_LOCALES=en,fr,es`.
- (a) Status (+ `Location`) for the Phase 2 V1 URL list.
- (b) Normalized SSR HTML (Phase 2 normalization) of the **7 EN routes**: `/`, `/services`, `/packages`, `/projects`,
  `/about-magneto`, `/contact`, `/projects/trepied-trepied-ca`, plus the other two project pages.
- (c) Head/metadata extract per route: `<title>`, `description`, all `og:*` and `twitter:*`, `robots`.
- (d) Raw HTML + post-hydration DOM (headless Chrome: `document.documentElement.lang`, `document.title`,
  `main` text) for the 404s `/esto-no-existe`, `/carte`, `/projects/no-existe`, `/en/services`, and (locales on)
  `/fr/esto-no-existe`, `/fr/projects/no-existe`, `/es/esto-no-existe`, `/de/x`.
- (e) Screenshots 375 / 768 / 1440 of the 7 routes and of `/projects/no-existe` and `/esto-no-existe` (locales off).

**Checkpoint C1 (Senior Architect amendment 1): after T0–T3, stop.**
- Done at this point: V0, the dictionaries + guard + provider (T1), the layout + all `generateMetadata` (T2), and
  the server components (T3). No client component, not-found page or link has been touched yet.
- The Dev runs and reports:
  - **AC-2:** the 130 existing tests unmodified, plus the T1 tests;
  - **AC-3**, in **both** builds (`ENABLED_LOCALES=` and `=en,fr,es` with `ALLOW_UNTRANSLATED_LOCALES=1`):
    normalized HTML, metadata extract, statuses and screenshots vs V0, for the 7 routes + the 2 other project pages;
  - `npm run lint` and `npm run typecheck` results, for information.
- The results go into `docs/reports/phase-4-ui-microcopy.md` under a "Checkpoint C1" heading. Nothing is staged.
- Then the Dev **stops** and waits for an explicit OK from Mauricio + Senior Architect before T4–T8.
- If AC-3 fails, the Dev reports the diff and does not continue or "fix forward".

**Then (after the C1 OK):**
- [ ] **AC-1 Gate:** `npm run lint && npm run typecheck && npm test -- --run && npm run build` passes.
  - Run it with the locales the Dev's `.env.local` has (`en,fr,es`), and with `ALLOW_UNTRANSLATED_LOCALES=1` on the
    command line because placeholders exist. The report states the exact command.
  - Lint ≤ **149 errors / 110 warnings** (measured 2026-10-25), with **0** errors in new files and no new `no-explicit-any`.
  - The 30 `no-html-link-for-pages` errors remain (D1).
- [ ] **AC-1b Readiness guard (§2.1a)**, three builds, exit code and message recorded:
  - `ENABLED_LOCALES= npm run build` → succeeds.
  - `ENABLED_LOCALES=en,fr npm run build` (no override) → **fails**, and the message names `fr` and the marker count.
  - `ENABLED_LOCALES=en,fr ALLOW_UNTRANSLATED_LOCALES=1 npm run build` → succeeds.
  - `next dev` with `en,fr,es` serves `/fr` without the error.
- [ ] **AC-2 Tests:** all 130 existing tests pass **unmodified**. The new tests (§2.4) pass. The report lists the count per file.
- [ ] **AC-3 EN byte-identity (both builds):**
  - V0(b) normalized HTML is identical for the 7 routes + 2 more project pages.
  - V0(c) metadata extract is identical.
  - V0(a) statuses are identical.
  - V0(e) screenshots of the 7 routes are pixel-identical. If one differs, retake 3× as in Phase 3 (font timing).
  - No attribute-order normalization is needed: D1 keeps every element as it is.
- [ ] **AC-4 EN fingerprint:** `en.test.ts` passes. The report states the number of keys and confirms the table was
  built from the V0 sources, not from `en.ts`.
- [ ] **AC-5 404s, every locale:**
  - Statuses equal V0(a): all 404, no 500.
  - Raw HTML: `<title>` = `t.notFound.metaTitle` / `t.projectNotFound.metaTitle` of the layout's locale, and **no**
    `index, follow` robots meta.
  - After hydration:
    - `lang` = `en` for EN and disabled-locale paths, `fr-CA` on `/fr/esto-no-existe`, `es` on `/es/esto-no-existe`;
    - the localized heading and body, with header and footer present;
    - project 404 buttons → `/projects` and `/` (EN), `/fr/projects` and `/fr` (FR).
  - `/projects/no-existe` screenshots match V0(e).
  - `/esto-no-existe` screenshots go to Mauricio for approval of the new 404 look.
- [ ] **AC-6 FR/ES UI** (`ENABLED_LOCALES=en,fr,es`, `next start`):
  - On `/fr`, `/fr/projects`, `/fr/projects/trepied-trepied-ca` and `/es` (the routes that exist in FR/ES locally), the
    SSR HTML contains the FR (or ES) dictionary values for:
    - the nav labels;
    - `header.scheduleCall`;
    - `footer.copyright`;
    - the `projectDetail.*` headings on the project page.
  - It contains none of the EN values `About`, `Free Schedule Call` or `All Rights Reserved`.
- [ ] **AC-7 Client-only strings:**
  - On `/fr` in the browser, open the header CTA: the modal shows `[FR TODO]` strings.
  - On `/fr/contact`, or with the FR ContactForm test if the FR contact page is still missing locally: an empty
    submit shows the FR validation message.
  - **Observe only, never submit** unless `.env.local` meets hard rule 2. It does today (`DISABLE_SMTP=1`), but
    the Mailchimp vars must be checked by name before any submit.
- [ ] **AC-8 Hydration:**
  - Headless Chrome console on the 7 EN routes, `/fr`, `/es` and two 404s: no hydration warnings and no new errors vs V0.
  - Mobile menu toggle alt `Menu` ↔ `Close` still works at 375 px.
- [ ] **AC-9 Bundle isolation:**
  - After `next build`, `grep -rlF "[FR TODO]" .next/static` → no file. Same for `[ES TODO]`.
  - So no FR/ES dictionary ships in client JS; FR/ES strings only arrive in FR/ES RSC payloads.
- [ ] **AC-10 Links (D1):**
  - EN hrefs unchanged: covered by AC-3. Header nav elements are still `<a>`.
  - On `/fr` every internal link checked (nav, logo, "Check All Services", "Learn More", project cards,
    "Back to Projects") starts with `/fr`.
  - The LanguageSwitcher still maps to the same page.
- [ ] **AC-11 Release process** (`docs/ai/WORKFLOW.md`), on the PR's Vercel preview (`ENABLED_LOCALES` unset):
  - the main routes → 200;
  - `/esto-no-existe` and `/projects/no-existe` → 404, showing the custom 404 after load, with `<title>` from the
    dictionary in the raw HTML;
  - one project page → 200;
  - `/fr` → 404;
  - the EN home shows the nav labels and `Magneto Marketing - All Rights Reserved, <year>.` unchanged.

  This is recorded in the PR before merging. No CMS change is needed first (A3). Vercel must **not** have
  `ALLOW_UNTRANSLATED_LOCALES` set. The preview build log shows only `en` paths, and no guard error, since EN-only never throws.
- [ ] **AC-12 AGENTS.md:** exactly the lines listed under "Files" changed (`git diff AGENTS.md`), lint baseline = measured.
- [ ] **AC-13 Issue I-9 recorded:** in the report and AGENTS.md Known debt. `LeadMagnetSection` logic and output are unchanged:
  AC-3 covers the SSR, and the post-hydration CMS text is the same as V0.

---

## Decisions (recorded 2026-10-25, Mauricio; approved by the Senior Architect)

| | Decision | Consequence in this spec |
|---|---|---|
| **A** | **Native typed dictionaries.** No library. Recorded in **ADR 0005** (Senior Architect amendment 2), together with the provider / `formatParts` pattern and the raw-404 limit. | §2.1, ADR 0005 |
| **B** | **`[FR TODO]` / `[ES TODO]` placeholders**, real FR/ES values from Mauricio later. **Plus a guard:** a build fails if `ENABLED_LOCALES` enables a locale whose dictionary still has markers. | §2.1, §2.1a, AC-1b |
| **C** | **Strings-only exception to ADR 0002** for the Mailchimp modal (`EmailCollectorProvider`), and the string edits in `PackageCard` / `LeadMagnetSection`. No logic, prop or flow change. | §2.2, Files, R5 |
| **D** | **Locale-prefixed plain `<a>`** (D1): `localizePath` on the existing elements. It returns unprefixed paths for EN (`paths.ts:20`), so the EN output stays byte-identical. Header nav stays `<a>`. | §2.2, AC-3, AC-10 |
| **E** | **CMS fallbacks into the dictionary** (`cmsFallback.*`). Separately record I-9 (lead magnet not server-rendered). It is out of scope and its behaviour is not changed. | §1b, I-9, AC-13 |
| **F** | **Accept the raw-404 `lang` limit;** record it in AGENTS.md Known debt. | §2.3 (4), Files (AGENTS.md) |
| — | **AGENTS.md lint baseline → measured 149 / 110** as part of this phase. | Files (AGENTS.md), AC-12 |

Rejected alternatives, kept for the record:
- A2 `next-intl` duplicates ADR 0003's middleware and `paths.ts` and is a new dependency.
- A3 `i18next`/`rosetta` is a dependency for what is 4 placeholders.
- B2 (copy before build) blocks on ≈ 90 × 2 strings. B3 (agent translates) violates hard rule 4.
- C1 (defer) leaves an EN modal on every FR/ES booking CTA until Brevo.
- D2 (`next/link`) brings soft navigation, an analytics page-view risk and attribute-order diffs.
- E2 (keep EN literals) shows EN UI text under `/fr`.
- F2 (unmatched-route 404 with `globalNotFound`) needs a routing ADR and covers only part of the 404s.

O1 and O2 are decided (see "Assumptions and open questions"). Nothing is open.

---

## Task breakdown and estimates (agent time unless noted)
| # | Task | Estimate |
|---|---|---|
| T0 | V0 capture (worktree, 2 builds, statuses, HTML, metadata, 404 raw + hydrated, screenshots) | 40–60 min |
| T1 | `dictionary.ts`, `I18nProvider.tsx`, `en.ts` + `fr`/`es` placeholders, readiness guard (§2.1a) + `.env.local.example`, parity/format/guard/provider tests, EN fingerprint table | 60–75 min |
| T2 | Layout provider + LanguageSwitcher label + all `generateMetadata` (7 files) | 30–40 min |
| T3 | Server components: Footer(+Loader), FeaturedServices(+Loader, api), ServiceCard, ServicesList, ProjectDetail, services error fallback, HeroLoader alt | 40–60 min |
| **C1** | **Checkpoint:** AC-2 + AC-3 (both builds), interim report, **stop** for the Mauricio + Senior Architect OK | 30–45 min + review wait |
| T4 | Client components: Header, CalendlyButton + `calendly.ts`, ContactForm (+ FR test), ProjectsGrid, PackageCard, LeadMagnetSection, FinalCTASection, EmailCollectorProvider | 60–90 min |
| T5 | NotFound component + both `not-found.tsx` + tests | 30–45 min |
| T6 | Links (D1) | 15–25 min |
| T7 | Verification AC-1…AC-13 (both builds, 3 guard builds, screenshots, hydration console, bundle grep) | 75–105 min |
| T8 | AGENTS.md lines (baseline, D1 note, raw-404 debt, I-9, override rule) + report | 25–35 min |
| | **Total (agent)** | **≈ 6.5–9 h** (plus the C1 wait) |

**Mauricio (by hand):**
- Spec review and decisions A–F: done (2026-10-25), approved by the Senior Architect with amendments.
- Checkpoint C1 review with the Senior Architect: 15–20 min.
- Approve the new `/esto-no-existe` look from screenshots: 10 min.
- Vercel preview check (AC-11): 15 min.
- Later, outside this phase (Decision B): FR/ES values ≈ 1–2 h. Until then the guard blocks enabling FR/ES.
- Optional, local only: add `ALLOW_UNTRANSLATED_LOCALES=1` to his own `.env.local` if he runs `npm run build`
  locally with `ENABLED_LOCALES=en,fr,es` before the FR/ES copy exists. Otherwise his local build fails by design (§2.1a).
  `next dev` is unaffected.
- **No WordPress, Vercel-settings or production changes.** Vercel keeps `ENABLED_LOCALES` unset and must never get the override.

## Risks
- **R1 Text-node structure:** merging `text {expr} text` into one string drops React's `<!-- -->` and breaks AC-3.
  Mitigation: `formatParts`, plus AC-3 diff.
- **R2 Exact characters:** ’ — – `...` and trailing spaces are easy to "normalize" by accident. Mitigation: AC-4
  table built from V0 sources.
- **R3 Hydration mismatch:** if a client component derives its locale from the pathname. Mitigation: provider locale
  only (§2.1), AC-8.
- **R4 Bundle leak:** a client file importing `getDictionary`/`fr.ts`. Mitigation: rule + AC-9.
- **R5 ADR 0002 scope creep** in Mailchimp files. Mitigation: Decision C is strings-only; the unmodified tests guard behaviour.
- **R6 404 behaviour is Next-version-specific** (E3). next@16 may change the error shell. Known-debt line with
  "revisit on next@16".
- **R7 Metadata `params`:** adding `{ params }` to `generateMetadata` in `page.tsx`/`projects/page.tsx` must not
  change EN output or static generation. AC-3(c) and the build route table (same ○/● markers as V0) check it.
- **R9 Guard bypass or false trip:**
  - Someone could set `ALLOW_UNTRANSLATED_LOCALES=1` in Vercel. Mitigation: the comment in `.env.local.example`,
    the AGENTS.md rule, and the AC-11 check that Vercel doesn't have it.
  - A real copy value could contain `TODO]`. Very unlikely; the marker is bracketed on purpose.
  - The guard depends on `NEXT_PHASE`, a Next-internal value, which could change in next@16. Mitigation: AC-1b
    shows it works on 15.5.28; re-check on the next@16 upgrade, and record it with R6.
- **R8 Test fallback hides wiring bugs:** `useI18n()` falls back to EN outside a provider. Mitigation: AC-6/AC-7
  check real FR pages; NotFound/ContactForm tests use an explicit `fr` provider.

## Issues found (not fixed; report only)
- **I-1:** AGENTS.md lint baseline (164 / 118) is stale; measured 149 / 110 (also noted in the Phase 3 report).
  **Fixed in this phase** (Decision; T8, AC-12).
- **I-2:** 404 shell has two robots metas (`noindex` + layout `index, follow`). Fixed by §2.3 for 404s.
- **I-3:** `Footer` renders the dev placeholders `Default Footer Line 1/2` if the CMS lines are empty.
- **I-4:** `contact/layout.tsx` and `packages/layout.tsx` contain dead `Next.js` metadata (overridden). Cleanup later.
- **I-5:** `ContactForm`/email modal show raw server messages (`payload.message`, e.g. "Failed to deliver contact
  message") in EN on every locale. Handle in the forms/Brevo phase.
- **I-6:** `ServiceIcon` alt is `"<icon URL> icon"`, which is meaningless for screen readers. A11y cleanup.
- **I-7:** `utils/calendly.ts` uses `utmContent` (e.g. `header_desktop`) as the Calendly iframe `title`, so the
  fallback string is rarely used. Kept as is (EN behaviour); a11y cleanup later.
- **I-8:** `Footer` social icon alt is always `Social Icon`, because the query selects no alt. CMS/a11y later.
- **I-9 (Decision E: record only, do not change):** the lead-magnet CMS copy never reaches the server render.
  - `LeadMagnetSection` is a client component. It is rendered directly by `[locale]/layout.tsx`, with no server
    loader (unlike `FinalCTASectionLoader` / `FooterLoader`), and fetches in `useEffect` (`index.tsx:49–55`).
  - Every SSR page therefore ships the hardcoded fallback. Verified in the built EN HTML of `/`, `/services` and
    `/projects/trepied-trepied-ca`: `Not ready to book a call?` / `Download our free guide:` /
    `5 Mistakes That Kill Funnel Conversions`.
  - The browser then swaps in the CMS copy. Local CMS, `pages(first:1, where:{language:"en", name:"home"})`
    `leadMagnetSection` → `overTitle: "Not sure where to start? Download our free guide:"`,
    `title: "6 Online Strategies To Get Clients As Therapist"`,
    `subtitle: "Learn the top funnel mistakes service businesses make — and how to fix them."`,
    `cta: "Get the PDF and join our tips newsletter"`.
  - Effects:
    - a visible text swap on load;
    - crawlers and no-JS users see stale copy;
    - the "fallback on 404s" seen in Phase 3b (where the client fetch may not complete).
  - The fix belongs with the lead-magnet rebuild (Known debt) or a dedicated phase: a server loader, as for the Final
    CTA. Phase 4 only moves the fallback strings into `cmsFallback.leadMagnet.*`, with output unchanged.
