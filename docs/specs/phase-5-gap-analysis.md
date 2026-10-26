# Phase 5 prep — Gap analysis: 2026 copy vs ACF / components / dictionaries

- Status: Draft
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-10-26
- Branch: `spec/phase-5-gap-analysis` (cut from `master` at `b1e9fb8`, fast-forwarded to `d12dc9d` on 2026-10-26 after
  PR #18 "Isra testimonial approved"). Nothing staged.
- Revision 2026-10-26: both testimonials approved (PR #18). §T, Content not ready, R4, Decisions and Estimate updated.
  PR #18 edits lines in place, so the copy line numbers below are unchanged.
- Depends on: `docs/reports/phase-4-ui-microcopy.md` (Phase 4 closed); the copy files
  `docs/content/magneto-copy-{en,fr-CA,es}.md` (import `35c4870`, testimonials `b1e9fb8`, Isra approved `d12dc9d`;
  Notion last edited 2026-10-26T20:10Z).
- Type: **analysis only.** This is not an implementation spec. It feeds the Phase 5 spec(s) after review.
  No CMS writes and no code changes were made.

## Goal
Know, page by page, what in the 2026 copy fits the current CMS fields and components (text-only load), what needs an
ACF or component change, and what doesn't exist yet. Also know which content isn't ready to publish. Then pick a
phase split, a launch order, and the decisions that need an ADR.

## Evidence (facts verified now)

### E0. Inputs and environment
- Copy files (unedited Notion export, header comment lines 1–8 of each file):
  - EN: Home 10–151 · About 153–257 · Services 259–433 · Packages 435–558 · Contact + modal 560–702 · Privacy 704–872 ·
    case studies 874–1247.
  - FR-CA: Home 12–122 · About 124–209 · Services 211–370 · Packages 372–485 · case studies 487–702 · Contact 704–793 ·
    modal (variants A/B) 795–885 · Privacy 887–1043 · shared guide 1045–1057 · pre-publication checks 1059–1099.
  - ES: Home 12–134 · About 136–221 · Services 223–380 · Packages 382–495 · case studies 497–718 · Contact 720–809 ·
    modal (variants A/B) 811–901 · pre-publication checks 903–949. **There is no Privacy section in ES** (`grep -n '^#'`
    shows no `POLÍTICA` heading). ES line 10 lists the finished sections, and Privacy is not one of them.
- `.env.local` targets the local CMS: `NEXT_PUBLIC_WORDPRESS_API_URL=…magneto-cms-2.local/graphql`,
  `ENABLED_LOCALES=en,fr,es`, `DISABLE_SMTP=1` (values checked with `grep`; secrets not printed).
- **The local CMS was not running during this analysis.**
  `curl http://magneto-cms-2.local/graphql` → `Failed to connect to magneto-cms-2.local port 80 … Connection refused`.
  `wp` is not on PATH outside Local's site shell. So this document has **no live schema query and no WP-CLI dump
  from today.** The ACF model below comes from:
  - the Phase 1 schema evidence (`docs/specs/phase-1-wpml-setup.md` E3/E5, `55cc16e`, 2026-10-24);
  - the Phase 3b ACFML dump, local = production, `diff` empty (`docs/reports/phase-3b-production-wpml-runbook.md`
    line 117, 2026-10-25).

  Nothing in `docs/ai/WP-SETUP.md`'s change log after 2026-10-25 touches ACF. Re-running the read-only checks in
  Appendix A before the Phase 5 spec is **required** (AC-3).

### E1. CMS content model (Phase 1 E5, 13 ACF groups; all content is ACF on pages + the `project` CPT)
No CPTs for services, packages or testimonials. No WP menus. No options page (Phase 1 E3/E4). Shared sections read
the **locale's `home` page**.

| # | Group / GraphQL field | On | Fields (GraphQL types) |
|---|---|---|---|
| 1 | `heroContent` | every route page | heroTitle, subtitleHero, ctaTextHero: String · ctaLinkHero: String (URL) · image, backgroundImage: Media |
| 2 | `homeAboutSection` | home | aboutSectionTitle, description: String (rendered as HTML) |
| 3 | `homeFeaturedServices` | home | title · service[]: serviceTitle, serviceDescription, anchorLink, serviceIcon |
| 4 | `homeTestimonialsSection` | home | testimonials[]: author, testimonial: String · thumb: Media |
| 5 | `leadMagnetSection` | home | overTitle…, title…, subtitle…, ctaText… · ctaLink…: Media (PDF) |
| 6 | `finalCtaSection` | home | title, subtitle, ctaText · ctaLink (URL) · bgimage |
| 7 | `homeFooter` | home | footerLine1, footerLine2 · footerSocialIcons[]: iconUrl, iconSvg |
| 8 | `aboutData` | about-magneto | sectionTitle, description, generalText, calendlyText, linkText · calendlyUrl, linkUrl |
| 9 | `contactContactTexts` | contact | tagText, mainCopy, bodytext |
| 10 | `packagesPackageFeatures` | packages | packagesElements[]: name, description, price: String · popularChoise · icon · features[]: feature |
| 11 | `pageintrotext` | services, packages, projects | pageIntroText: String |
| 12 | `servicesServiceDetails` | services | services[]: title, description · featuredService · icon, image |
| 13 | `projectsProjectData` | project | projectData: projectSubtitle, projectDescription, projectUrl, challenges[]/solutions[]/results[] › item · images[]: image, footNote, ismobilescreenshot |

ACFML: all 13 groups `mode=translation` ("Same fields across languages"). Text fields are Translate (2). Images, URLs,
true/false and **repeater structure** are Copy (1). Package `price` is Translate (`WP-SETUP.md`, Phase 3b).
Consequence: **every language has the same number of repeater rows** (testimonials, services, packages, project
lists).

Known CMS facts that affect Phase 5:
- **Empty text fields return the ACF default value**, which is EN text (Phase 1 E5). A FR/ES field left empty shows EN
  silently.
- The WPML Language-box "Duplicate" is unreliable. It failed silently twice in Phase 3 (report, "Note for Phase 5").
- Local FR/ES fixtures exist from Phases 1–3: FR home 535 and ES home 536 (test `heroTitle`), FR `projects` page 558,
  FR project #550 (Trépied), and the ES Trépied translation. The loader must **update** these, not duplicate them.
- EN projects: `trepied-trepied-ca` (498), `shamaniccas-ecommerce` (224), `fashion-company-ecommerce` (270 = Dangel).

### E2. Code facts (file:line on `d12dc9d`; PRs #17–#18 changed only `docs/content/`)
Shared / layout
- `src/app/[locale]/layout.tsx:178-180` renders `LeadMagnetSection`, `FinalCTASectionLoader` and `FooterLoader` on
  **every** route. They read the `home` page only (`FinalCTASection/api.ts:11`, `Footer/api.ts:9`,
  `LeadMagnetSection/api.ts:9`). A route can't have its own final CTA today.
- `FinalCTASection/index.tsx:52` and `LeadMagnetSection/index.tsx:49` hide only on `/contact`.
- `LeadMagnetSection` shows by default (`show = true`). It has no hiding CSS (`LeadMagnetSection.scss`), and its
  fallback copy is the old funnel guide (`en.ts:140-144`). AGENTS.md says the lead magnet "stays hidden". **The code
  doesn't hide it.** This needs a browser check (open question Q1).
- `utils/wp-graphql.ts:39` sets `next: { revalidate: 60 }`. A production CMS edit reaches the live site within about
  60 s, without a deploy.
- `utils/seo.ts:8` `siteName = 'Magneto Marketing'`. `layout.tsx:36-39` takes the site title from WP
  `generalSettings.title`.
- `utils/analytics.ts` `loadAnalytics()` and `utils/gtm.ts` have **no caller** in `src/` (`grep initGA|loadGA|loadGTM`
  → only `gtagEvent` imports). Today no analytics script loads, and there is no consent banner (`grep -ri consent src`
  → none).
- `app/sitemap.xml/route.ts:12,35` static paths omit `/packages` (Phase 7).

Header / Footer
- `Header/index.tsx:120-130,165-169`: nav labels and CTA from the dictionary. The CTA opens the email modal
  (`openModal({origin:'header'})`, line 53).
- `Footer/index.tsx:14,50`: `footerLine1`/`footerLine2` with hardcoded EN fallbacks `'Default Footer Line 1/2'` (not in
  the dictionary). Social links are **icons only** (lines 20-44). The copyright comes from the dictionary (line 53).

Home
- `app/[locale]/page.tsx:66` — `<Testimonials>` is **commented out**. Lines 51-57 map the data with `any`, `role: ''`
  and the avatar placeholder `https://placehold.co/54x54`.
- `page.tsx:67-72` — the projects grid title comes from the dictionary (`home.recentProjects`). There's no intro text.
- `ProjectsGrid/index.tsx:82-91` — each card shows thumbnail, title, **"Solution:" + first solution** and
  **"Outcome:" + first result**. The copy wants thumbnail · title · description.
- `FeaturedServices/index.tsx:28,46-50` — section title from ACF, plus a "Check All Services" button (dictionary).
- `ServiceCard/index.tsx:24-34` — title, description and icon. The CTA is always `featuredServices.learnMore` ("Learn
  More"). It links to `/services#<anchor>`, but `ServicesList.tsx:34` gives the items **no `id`**, so the anchor
  doesn't land.
- `FeaturedServices.scss:45-55` — the grid is 1 column on mobile and 2 columns from `sm`. Three cards render as
  2 + 1.

Testimonials (details in §T)
- `Testimonials/index.tsx:7-18,42` — **every quote is truncated to 111 characters + "..."**. Line 21 has the
  default title `"Some Testimonials"`.
- `TestimonialCard/index.tsx:14-21` always renders an avatar `<Image>`. Line 27 renders `{author}, {role}`.
- `TestimonialCard/Testimonials.types.ts:5` has `company?`, but it isn't rendered.
- `Testimonials/api.ts:10-21` queries `author`, `testimonial` and `thumb` only.

About
- `about-magneto/page.tsx:74-79` — `sectionTitle` (h2) and `description` as a **plain `<p>`** (no HTML).
- Lines 80-89 — the LinkedIn link (`linkText`/`linkUrl`).
- Line 92 — `generalText` as **unsanitized** HTML.
- Lines 95-97 — a `CalendlyButton` with the dictionary text. `aboutData.calendlyText`/`calendlyUrl` are queried
  (`about-magneto/api.ts:33-34`) but **not used**.

Services
- `services/page.tsx:43-49` — `pageIntroText` is rendered **inside one `<h3>`**, with newlines turned into `<br />`.
- `ServicesList.tsx:47-60` — icon, title (h3), optional "Featured Service" badge, and `description` as a **plain
  `<p>`**. There's no subtitle, list, CTA or grouping.

Packages
- `packages/api.ts:48` hardcodes `currency: "CAD"`.
- `PackagesGrid/index.tsx:17-24` passes no `ctaText`/`ctaType`/`isPopular`/`variant`. So every card gets the default
  CTA "Book a Free Strategy Call" → email modal → Calendly (`PackageCard/index.tsx:92-100,18-33`).
- `PackageCard/index.tsx:119-123` — price (big), the `currency` label, and `description` as a plain `<p>`.
- Line 135 — the fixed heading "What's included:" above `features`.

Projects / case studies
- `projects/page.tsx:19-27` — hero + `pageIntroText` + grid (max 6).
- `ProjectDetail/index.tsx` sections:
  - title (h1)
  - `tagText` = projectSubtitle (h2)
  - featured image
  - `description` (HTML, **DOMPurify**, line 43)
  - Challenges / Solutions / Results columns (headings from the dictionary)
  - gallery with `footNote` captions
  - "View live site" (line 132)
  - "← Back to Projects"
- The final CTA after a case study is the layout's home final CTA.

Contact, modal, forms
- `contact/page.tsx:34-42`: `mainCopy` (h2), `tagText` (h3), `bodytext` (p), then `ContactForm`.
- `ContactForm.tsx:7-13,74-95` — fields: name\*, email\*, businessType\* (Coach / Therapist / Ecommerce / Real State /
  Other), message (optional).
- The success text promises "within 24–48 hours" (`en.ts:88`). The copy forbids a response SLA (EN 699).
- `pages/api/contact.ts:47` `sendEmail({ name, email, businessType, message })`.
- `EmailCollectorProvider/index.tsx:88-91` — the booking modal asks for name + email and **POSTs `/api/mailchimp`
  (subscribe) before opening Calendly**. That contradicts the new privacy lines: "Booking a call does not subscribe
  you to marketing emails" (EN 687, 848).
- `HeroCTA.tsx:22-38` — a Calendly `ctaLinkHero` opens **Calendly directly** (`CalendlyButton`), with no modal. The
  header, package and final CTAs open the modal.
- Unmerged branch `origin/feat/calendly-prefill-optin` (`b357bb4`, 2026-10-03, 1 commit ahead): Calendly prefill of
  name/email plus an opt-in checkbox instead of auto-subscribe (5 files, +177/−45). It is relevant to modal
  variant A.

i18n
- `src/i18n/dictionaries/en.ts` (189 lines) is the EN source. `en.test.ts` locks every EN value byte-for-byte
  (fingerprint from Phase 4 V0).
- `fr.ts`/`es.ts` have **116 `TODO` markers each** (`grep -c TODO`).
- The build guard fails `next build` when an enabled locale still has markers (ADR 0005 §4).
- `paths.ts:22-25`: slugs are the same in every locale (ADR 0003 D2). A new Privacy route would be
  `/privacy-policy`, `/fr/privacy-policy`, `/es/privacy-policy`.

## Assumptions and open questions
- Assumption A1: the Notion export in `docs/content/` is the canonical text for Phase 5. Wording is not changed here
  (Hard rule 4). Where the copy has no text for a UI element, it's listed as **not ready**, not invented.
- Assumption A2: italic lines in the copy are editorial/implementation notes, not public text. Examples: "Translated
  from Spanish." is public, but "Links to Mauricio's personal professional profile…" (EN 173) has no FR/ES
  counterpart, so it's treated as a note. **Confirm** (Q8).
- Assumption A3: the ACF model is unchanged since 2026-10-25 (E0). To be re-verified (Appendix A).
- Q1: Is the lead magnet visible in production right now? The code renders it on every route except `/contact`.
- Q2: What do the package-card CTAs ("Discuss a BUILD project", "Discuss a FIX project", "Ask about CARE") link to:
  `/contact`, or the strategy-call modal? And the Services CTAs ("See BUILD pricing", "See how FIX works", "Compare CARE
  plans"): `/packages#build|fix|care`? The copy doesn't say.
- Q3: Sections or buttons that exist today but are **not in the copy**: Featured Services section title ("Featured
  Services"), "Check All Services", "Check All Projects", "← Back to Projects", the `/projects` index hero + intro. Keep
  them, remove them, or ask for copy?
- Q4: Testimonial avatars: the copy has no photos. Render no avatar, or use real photos?
- Q5: `/projects` index page: the copy defines none (FR check line "l'EN canonique ne définit pas de page index
  autonome"). The nav keeps "Projects". What copy goes there in EN/FR/ES?
- Q6: Contact supporting copy (3 sentences + privacy line): fit it into `mainCopy` (h2) / `tagText` (h3) / `bodytext`
  (p), or restyle? The copy's sentences aren't headings.
- Q7: Hero CTA → Calendly direct (no modal) vs header/package CTA → modal. Should all "Book a Strategy Call" CTAs go
  through the new modal?
- Q8: Assumption A2 (italic notes).

## Page maps

Legend for **Fit**:
- **A** — an existing field/component holds it; content load only.
- **A\*** — the field holds it, with a small rendering change (sanitize HTML / no truncation).
- **B** — an ACF field and/or component change is needed.
- **NEW** — the page, route or component doesn't exist.
- **NR** — content not ready.

### Header (layout, all pages)
| Copy (EN line) | Holder today | Fit | Note |
|---|---|---|---|
| Nav About · Services · Packages · Projects · Contact (14) | `nav.*` dictionary | A | EN unchanged. FR/ES labels in the copy (FR 16, ES 16) |
| Language control EN \| FR \| ES (16) | `LanguageSwitcher` (shows when ≥ 2 locales enabled) | A | "only when that locale passed QA" = `ENABLED_LOCALES` |
| Primary CTA "Book a Strategy Call" (18) | `header.scheduleCall` "Free Schedule Call" | A (dict) | Opens the modal (see Modal) |

### Home — class **B**
| Copy section (EN line) | Holder today | Fit | Note |
|---|---|---|---|
| 1 Hero title, subtitle, CTA (20-26) | `heroContent` heroTitle / subtitleHero / ctaTextHero | A | Image → Phase 8 (147-148) |
| 2 Meet Magneto: heading + 3 paragraphs (28-36) | `homeAboutSection` title + description (HTML) | A\* | `AboutSection` renders unsanitized HTML; sanitize (convention) |
| 3 Featured Services: BUILD / FIX / CARE, each name + **bold tagline** + description + CTA "Explore X" (38-62) | `homeFeaturedServices.service[]` serviceTitle / serviceDescription; CTA = "Learn More" for all | **B** | No tagline field. The CTA text is fixed. The anchor target has no `id`. The 2-col grid already gives BUILD+FIX on top, CARE below (149) |
| 3 section heading | `homeFeaturedServices.title` | NR | The copy has no heading for this section (Q3) |
| 4 Selected Projects: heading + intro (64-68) | heading = `home.recentProjects` (dict); intro: none | **B** | Needs an intro field (or a dictionary key) |
| 4 Project cards: thumbnail · title · description (70-82) | `ProjectsGrid` shows Solution/Outcome lines | **B** | Card text ≠ case-study hero line (e.g. Dangel 74 vs 902) → new project field, e.g. `cardDescription` |
| Testimonials: heading "Client feedback" + 2 quotes (84-102) | `homeTestimonialsSection` + hidden `Testimonials` | **B** | See §T |
| 6 Lead magnet (104-116) | `leadMagnetSection` (rendered by the layout) | NR | Must be **hidden** until the guide + email flow exist (106) |
| 7 Final CTA "Start with a conversation." (118-124) | `finalCtaSection` (home) | A | Home wording differs from About's (232): per-page CTA, see Shared |
| 8 Footer (126-134) | see Footer | B | |
| SEO title/description (136-140) | `meta.home.*` dictionary | A (dict) / NR | Marked **Draft** in EN. Localized SEO is Phase 7 |

### About — class **B** (light)
| Copy section | Holder today | Fit | Note |
|---|---|---|---|
| 1 Hero (155-161) | `heroContent` | A | |
| 2 The Founder: title + 2 paragraphs with **bold name** + CTA "View Mauricio's LinkedIn" (163-171) | `aboutData.sectionTitle` / `description` (plain `<p>`) / `linkText` + `linkUrl` | A\* | 2 paragraphs + bold need HTML rendering of `description` (sanitized) |
| 3 What Magneto delivers (list) + Who Magneto works best with (175-189) | `aboutData.generalText` (HTML) | A\* | Sanitize. Headings + list fit in HTML |
| 4 Recommend first. Build second. (191-204) | `generalText` (same HTML) | A\* | |
| 5 Internal CTA: heading + body + "Tell me about your project" → Contact (206-212) | heading/body: `generalText`; button: page renders `CalendlyButton` + `common.bookStrategyCall` | **B** | Use the unused `calendlyText`/`calendlyUrl` as text + link (→ `/contact`), or new `ctaText`/`ctaLink` fields |
| 6 Lead magnet (214-226) | layout | NR | hidden |
| 7 Final CTA: same title as Home, **shorter body** (228-234) | home `finalCtaSection` | **B** | Needs a per-page final CTA |
| SEO (244-248) | `meta.about.*` | A (dict) / NR | Draft |

### Services — class **B**
| Copy section | Holder today | Fit | Note |
|---|---|---|---|
| 1 Hero (261-267) | `heroContent` | A | |
| 2 Intro: heading + 3 paragraphs (269-277) | `pageintrotext.pageIntroText` rendered inside one `<h3>` | **B** | Heading + body don't fit one h3. Split heading/body, or render the body as HTML |
| "Core Services" group heading (279) | — | **B** | No grouping today |
| 3–5 BUILD / FIX / CARE: label ("BUILD — Website Build / Rebuild"), heading, paragraphs, bullet list, investment / process line, CTA (281-342) | `servicesServiceDetails.services[]` title + `description` (plain `<p>`) + icon + image | **B** | Needs a heading/subtitle field, `description` as sanitized HTML (lists, bold, several paragraphs), CTA text + link |
| "Included Where Your Project Needs It" heading + intro (344-346) | — | **B** | Grouping: a `group` select on each service row or a second repeater. Supporting rows have no price and no CTA (429) |
| 6–9 four supporting capabilities (348-384) | same repeater | **B** | Same field changes. Subordinate styling (428) |
| Old services (Branding, Content, Email, Ads) | current rows | — | Replaced (432). With repeater structure Copy, the row count must change in all 3 languages together |
| 10 Lead magnet (386-396) | layout | NR | hidden |
| 11 Final CTA "Not sure which path fits your website?" + **primary and secondary CTA** (398-408) | home `finalCtaSection` (1 CTA) | **B** | Per-page + secondary CTA |
| SEO (418-422) | `meta.services.*` | A (dict) / NR | Draft |

### Packages — class **B** (+ new sections)
| Copy section | Holder today | Fit | Note |
|---|---|---|---|
| 1 Hero: title + 2 paragraphs + CTA "Tell me about your project" (437-445) | `heroContent` (1 subtitle string, CTA link) | A / B | 2 paragraphs in `subtitleHero` (plain `<p>`). CTA to `/contact` works with the `href` branch of `HeroCTA` |
| Price note "All prices are in Canadian dollars…" (447) | `pageintrotext` (as `<h3>`) | A\* / B | Small text, not a heading |
| 2 BUILD card: name, heading, **3 price tiers**, "Includes…", CTA (451-461) | `packagesElements[]` name / description / price / features + fixed "What's included:" | **B** | Tiers fit `features[]`, but the "What's included:" heading and the one big `price` + "CAD" label don't. Per-card CTA text/target needed (Q2) |
| 3 FIX card: heading, 2 paragraphs, "Starting at C$1,000…", CTA (463-473) | same | **B** | Paragraphs need HTML. "Starting at" prefix |
| 4 CARE card: heading, "Starting at C$200/month", Essential / Partner, 3 notes, CTA (475-491) | same | **B** | Visually lighter allowed (549). No badges (550): `popularChoise` unused |
| 5 Paid Website Diagnostic, below the cards, not a 4th package (493-501) | — | **NEW** | Section component (heading + HTML) |
| 6 Good to Know: 2 headed lists (503-518) | — | **NEW** | Same section component |
| 7 Final CTA: primary "Tell me about your project", secondary "Book a Strategy Call" (520-530) | home `finalCtaSection` | **B** | Per-page + secondary CTA |
| SEO (540-544) | `meta.packages.*` | A (dict) / NR | Draft |
| Price format per locale: "C$3,500" / "3 500 $ CA" (FR 392) / "3 500 CAD" (ES checks) | `price` String (Translate) + hardcoded "CAD" | **B** | Drop the separate currency label, or make it locale-aware. Non-breaking spaces (ES checks) |

### Projects index `/projects` — class **NR**
| Copy | Holder today | Fit | Note |
|---|---|---|---|
| — (no index-page copy in any language) | `heroContent` + `pageintrotext` on page `projects` | NR | Q5. FR page 558 has a `[FR TEST]` hero. ES has no `projects` page |

### Case studies (Dangel, Trépied, Shamanicca) — class **A** for the body, **B** for card + final CTA
| Copy section (Dangel EN line) | Holder today | Fit | Note |
|---|---|---|---|
| Hero title (900) | post title | A | |
| Hero line (902) | `projectSubtitle` → h2 | A | |
| Website link (904) / View Live Site CTA "View dangelwellness.ca" (952) | `projectUrl` + `projectDetail.viewLiveSite` "View live site" | A (dict) | Copy shows the domain: dictionary template `View {domain}` (FR "Voir {domain}", ES "Ver {domain}") or keep generic (decision) |
| Overview paragraphs + capability line (906-914) | `projectDescription` (HTML, DOMPurify) | A | |
| Challenges ×3 (916-920) | `challenges[]` | A | |
| Solutions ×4 (922-927) | `solutions[]` | A | |
| What Was Delivered (929-936) | `results[]`, heading "Results" | A (dict) | `projectDetail.results` → "What Was Delivered" / "Livrables" / "Entregables" |
| Screenshot captions (938-948; Trépied/Shamanicca: 7 slots) | `images[].footNote` | A / NR | Screenshots must be retaken from production (Mauricio / Phase 8). Slot count not verified (CMS down) |
| Final CTA, **title different per project** (954-960) | layout home final CTA | **B** | Per-page final CTA on the `project` type |
| Home card description (72-82) | — | **B** | New project field (see Home) |
| SEO "Final EN" (962-966) | `meta.project.title` template; no description | A / Phase 7 | |
| Dangel slug `fashion-company-ecommerce` → Dangel slug + redirect (982) | — | separate | WORKFLOW "Later" list. Redirect = routing change |

### Contact / Project Inquiry — class **B** (form rewrite)
| Copy section | Holder today | Fit | Note |
|---|---|---|---|
| 1 Hero title + subtitle (562-566) | `heroContent` | A | |
| Hero secondary CTA "Prefer to talk? **Book a Strategy Call**" (568) | `ctaTextHero` + `ctaLinkHero` | A / B | The "Prefer to talk?" prefix has no field |
| 2 Form: 6 inputs (Name, Email, Website URL optional, Need select ×4, Problem textarea required + helper, Budget select ×5 required + helper), submit "Send project details" (570-617) | `ContactForm` (name, email, businessType, message) + `/api/contact` | **B** | New fields, validation (URL lenient), payload + email template in `pages/api/contact.ts`. WORKFLOW lists the "Project Inquiry form" as a **separate scope** |
| 3 Supporting copy: 3 sentences + privacy line with link (619-627) | `contactContactTexts` mainCopy/tagText/bodytext | A / B | Q6. The privacy line needs a link → dictionary/HTML |
| 4 Success message, 2 lines (629-633) | `contactForm.success` (promises 24–48 h) | A (dict) | Remove the SLA |
| Validation / failure messages | `contactForm.errors.*` | **NR** | Not defined in EN (FR checks 1078, ES checks 908) |
| Structure: Hero + form/image only, no Final CTA (651-652) | Final CTA + lead magnet already hidden on `/contact` | A | |

### Strategy Call modal — class **B** (behaviour change)
| Copy | Holder today | Fit | Note |
|---|---|---|---|
| Title, intro, fields (Email? · Website URL · Need · Problem), CTA "Continue to scheduling", privacy line (667-687) | `EmailCollectorProvider` (name + email → Mailchimp subscribe → Calendly) | **B** | Variant A (email in modal + Calendly prefill) vs B (Calendly collects email) **not chosen** (FR 797, ES 813). Where the 3 answers go (A1/A2/B1/B2) is unverified. The current auto-subscribe conflicts with the copy. WORKFLOW lists the "Calendly modal A/B" as a **separate scope** |

### Privacy Policy — class **NEW**
| Copy | Holder today | Fit | Note |
|---|---|---|---|
| EN policy (704-830), FR policy (887-1011) | no route, no WP page known to the frontend | **NEW** | Route `[locale]/privacy-policy` reading the WP page `content` (sanitized). No ACF needed. WP may already have its default draft "Privacy Policy" page: check (Appendix A) |
| ES policy | — | **NR** | Missing in the copy |
| Consent banner "Privacy choices" + Accept / Reject (834-840; FR 1015-1021) | none; no analytics loads today (E2) | **NEW** / decision | ES banner copy missing |
| Publication gates: providers §4, consent behaviour §5, retention §7, dates, registered-name check (706, 782; FR 1061-1068) | — | **NR** | EN and FR are editorially frozen but **not publishable** until verified |

### Footer (layout) — class **B**
| Copy (EN 126-134) | Holder today | Fit | Note |
|---|---|---|---|
| "Based in Montreal · Available in English, French & Spanish" | `footerLine1` | A | |
| "Mauricio Bayuelo on LinkedIn" (text link) | `footerSocialIcons[]` (icon only, alt "Social Icon") | **B** | Text link: dictionary label + ACF `iconUrl`, or a new text field |
| contact@ email link | `footerLine2`? (plain text) | B | Needs `mailto:` |
| Privacy Policy · Privacy choices links | — | **B** / NEW | Depend on the Privacy route and the consent decision |
| "Magneto Web Consulting © 2026" | `footer.copyright` "Magneto Marketing - All Rights Reserved, {year}." | A (dict) | → `Magneto Web Consulting © {year}` (same in FR/ES) |

### Page classification summary
| Page | Class | Main reason |
|---|---|---|
| Header | A | dictionary only |
| Home | **B** | featured-service tagline + CTA, project-card description, testimonials, intro field, hide lead magnet |
| About | **B** (light) | HTML rendering + internal CTA button + per-page final CTA |
| Services | **B** | repeater fields (heading, HTML body, CTA, group), intro split, per-page final CTA with 2 CTAs |
| Packages | **B + NEW sections** | card structure (tiers, prefix, CTA, currency), Diagnostic + Good-to-know sections, per-page final CTA |
| Projects index | NR | no copy |
| Case studies | A (body) / **B** (card text, final CTA) | |
| Contact | **B** | Project Inquiry form (6 fields) + API |
| Modal | **B** | new qualification flow, no auto-subscribe, A/B undecided |
| Privacy | **NEW** (+ NR for ES) | route + page; consent banner decision |
| Footer | **B** | text links (LinkedIn, mailto, Privacy, Privacy choices) |

## §T Testimonials
Requirement (EN 84-102, FR 82-94, ES 84-98): 2 testimonials. Each has a quote, original language, name, role,
company/city, and a per-locale "translated from" note. They render on Home in every locale. The copy says to
**reuse the existing hidden component**.

- **2+ items: supported.** `Testimonials` maps any array into `testimonials__grid` (index.tsx:36-47). The ACF repeater
  holds any number of rows.
- **Fields: not supported.**
  - ACF has `author`, `testimonial` and `thumb` only (E1 #4). There's no role, company, city or note.
  - `TestimonialCard` renders `{author}, {role}`. With `role: ''` (page.tsx:56) that's a trailing comma.
  - `company` exists in the type but isn't rendered.
- **Blocking defects of the hidden component:**
  1. 111-character truncation. The Dangel quote is about 200 characters, so it would be cut with "...".
  2. A mandatory avatar with a `placehold.co` fallback (the copy has no photos, Q4).
  3. Default title "Some Testimonials". The copy heading is "Client feedback" / FR (none given; section label
     "Témoignage client") / ES "Opinión de clientes". The FR heading text is **not in the copy** → NR.
  4. The `any` mapping in `page.tsx:51`.
- **Attribution format in the copy:** `Name · Role · City` (Dangel) and `Name · Role · Company` (Isra). It's never
  both city and company.
- **Original language:**
  - Dangel is ES-original. EN and FR show "Translated from Spanish." / "Traduit de l'espagnol". ES shows no note.
  - Isra wrote in all three languages ("Client-written languages: ES, EN, FR", EN 102), so no note in any language.

  A single `originalLanguage` select can't express that, so a **per-locale note text field** fits the copy exactly.
- **Smallest change (proposal):**
  - ACF rows: add `role` (Translate), `company` (Copy), `city` (Translate: "Montreal"/"Montréal") and `note`
    (Translate, optional). Keep `author` and `thumb`.
  - Component: render `author · role · (company || city)` plus an optional note. Remove the truncation. Avatar only when
    `thumb` exists. Heading from ACF or the dictionary.
  - Un-comment it in `page.tsx`, with a typed mapper in `Testimonials/api.ts`.
- **Status: both approved.**
  - Dangel: verified against the original Spanish email of 2026-08-20 (EN 96, ES 92).
  - Isra / TRÉPIED: text and attribution approved by Isra on WhatsApp, 2026-10-26, in EN/FR/ES (EN 96, 102; FR 94;
    ES 84, 98).
  - So no `published` flag is needed. Both rows load together in all 3 languages (the repeater row count is Copy). The
    block shows **2** cards; the grid needs a 2-item check at 375/768/1440.
- **One leftover in the copy file:** the FR Dangel note still reads "Traduction proposée — à valider par Mauricio"
  (FR 88). EN and ES carry no such mark. If that validation is done, the Notion FR page (and then the export) should
  say so. Until then the FR quote is held by the copy file's own wording (Content not ready, item 1).

## Dictionary impact (`en.ts` → 2026 copy)
Only keys whose value the copy changes or supplies are listed. "—" = not in the copy (FR/ES stay `TODO` → NR).
Changing EN values means regenerating `en.test.ts`'s fingerprint on purpose (it locks Phase 4 EN).

| Key | EN today | EN 2026 | FR in copy | ES in copy |
|---|---|---|---|---|
| `common.bookStrategyCall` | Book a Free Strategy Call | Book a Strategy Call | Réserver un appel-conseil | Agendar una llamada de orientación |
| `header.scheduleCall` | Free Schedule Call | Book a Strategy Call | Réserver un appel-conseil | Agendar una llamada de orientación |
| `nav.*` (5) | About … Contact | unchanged | À propos · Services · Forfaits · Réalisations · Contact | Sobre Magneto · Servicios · Paquetes · Proyectos · Contacto |
| `home.recentProjects` | Recent Projects | Selected Web Projects | Réalisations web | Proyectos web destacados |
| `featuredServices.learnMore` | Learn More | Explore {name} (proposed template) | Découvrir {name} | Conocer {name} |
| `featuredServices.checkAll` | Check All Services | — (not in copy, Q3) | — | — |
| `projects.solutionLabel` / `outcomeLabel` | Solution: / Outcome: | removed from cards | n/a | n/a |
| `projects.empty*`, `projects.checkAll` | old copy | — | — | — |
| `projectDetail.challenges` / `solutions` | Challenges / Solutions | unchanged | Défis / Solutions | Retos / Soluciones |
| `projectDetail.results` | Results | What Was Delivered | Livrables | Entregables |
| `projectDetail.viewLiveSite` | View live site | View {domain} (if templated) | Voir {domain} | Ver {domain} |
| `projectDetail.backToProjects` | ← Back to Projects | — | — | — |
| `packages.included` | What's included: | — (no heading in copy) | — | — |
| `packages.popularBadge` | Popular | not used (no badges, 550) | n/a | n/a |
| `footer.copyright` | Magneto Marketing - All Rights Reserved, {year}. | Magneto Web Consulting © {year} | same | same |
| `contactForm.*` labels, options, helpers, submit, success | old form | new form (570-633) | FR 714-777 | ES 730-793 |
| `contactForm.errors.*` | 5 strings | **NR** (not defined in EN) | NR | NR |
| `contactForm.businessTypes.*` | 5 options | removed (→ need + budget options) | FR 734-760 | ES 750-776 |
| `forms.*Placeholder` | Your name / you@company.com | — (copy gives labels only) | — | — |
| `emailModal.*` booking keys | old modal | new modal (667-687), variant-dependent | FR A/B 803-883 | ES A/B 819-899 |
| `emailModal.*` download keys | old guide | hidden; guide copy exists | FR 1049-1057 | ES 102-110 |
| `cmsFallback.leadMagnet.*` | 5 Mistakes That Kill Funnel Conversions… | new guide copy (108-116) or remove | FR 1049-1057 | ES 102-110 |
| `cmsFallback.requestQuote` | Request Free Quote | framing removed (653) | — | — |
| `cmsFallback.finalCta.*` | Stop losing leads… | Start with a conversation. / body (120-122) | FR 102-104 | ES 114-116 |
| `cmsFallback.featuredServicesTitle` | Featured Services | — (Q3) | — | — |
| `meta.home|about|services|packages|contact.*` | Magneto Marketing… | SEO Draft titles/descriptions | FR 116-120, 203… | ES 128-132, 215… |
| `meta.site.*`, `utils/seo.ts siteName` | Magneto Marketing | Magneto Web Consulting (brand) | same | same |
| `notFound.*`, `projectNotFound.*`, `header.menu*`, `header.languageSwitcher`, `header.logoAlt`, `about.linkedinIconAlt`, `common.goHome/close/loading/checkIconAlt`, `calendly.*`, `services.error*` | Phase 4 values | unchanged | **NR** | **NR** |
| new: testimonial heading | — | Client feedback | — (NR) | Opinión de clientes |
| new: footer link labels | — | Mauricio Bayuelo on LinkedIn · Privacy Policy · Privacy choices | Mauricio Bayuelo sur LinkedIn · Politique de confidentialité · Choix de confidentialité | … en LinkedIn · Política de privacidad · Opciones de privacidad (provisional) |

Estimate: about 40 of the 116 FR/ES `TODO`s get a value from the copy. About 25 stay `TODO`: 404, menu, alt and aria
text, Calendly dialog, form errors, placeholders. Because of the build guard, **a locale can't be enabled until the
remaining FR (or ES) keys get approved copy in Notion.**

## Content not ready (publication blockers or holds)
1. Dangel FR quote only: the FR file still says "Traduction proposée — à valider par Mauricio" (FR 88). This is a
   one-line Notion update if it's already validated. (Isra's testimonial and Dangel's EN/ES quotes are approved, §T.)
2. Lead magnet: **hidden** on Home/About/Services until the guide and the email flow exist (EN 106, 216, 388).
   FR/ES copy exists. Today the code renders it (Q1).
3. **ES Privacy Policy, ES consent banner, ES newsletter consent: missing.** "Política / Opciones de privacidad"
   labels are provisional (ES 917, 947).
4. EN + FR Privacy Policy publication gates: provider list and locations (§4), tested consent behaviour (§5),
   retention wording (§7), effective date, the "Magneto MKTNG" registered-name check (EN 706, 771, 782; FR 1061-1068).
5. Modal: variant A or B and privacy line A1/A2/B1/B2 not chosen. It depends on a Calendly prefill / answer-
   association test (FR 1069-1072, ES 914-916).
6. Form validation and failure messages: not defined in EN, so not in FR/ES (FR 1078, ES 908).
7. SEO titles/descriptions for Home, About, Services, Packages and Contact are **"Draft"** in EN. Case studies and
   Privacy are "Final".
8. `/projects` index page: no copy in any language (Q5).
9. UI strings not in the copy (≈ 25 dictionary keys, table above) for FR/ES.
10. Headings/buttons that exist but aren't in the copy (Q3). Testimonial heading in FR.
11. Case-study screenshots: retake from production (all three). Trépied and Shamanicca pre-promotion gates (EN
    1093-1106, 1230-1240) **don't block** the build but do block active promotion.
12. Home hero illustration (EN 147-148) → Phase 8.
13. Dangel slug rename + redirect (EN 982) → WORKFLOW "Later".

## Overall scenario: **B**
Only the heroes, the Home "Meet Magneto" block, the About body and the case-study bodies load as text. Every page
except the Header needs at least one ACF or component change. Contact, the modal and Privacy need new behaviour or a
new route. A pure WP-CLI content load (scenario A) would leave:
- truncated testimonials;
- Solution/Outcome project cards;
- a Services page that can't show lists or CTAs;
- package cards with the wrong structure;
- the same final CTA on every page;
- an SLA promise and auto-subscribe behind privacy text that says the opposite.

## Proposed design direction (for the Phase 5 spec, not decided here)
Smallest set of model changes. All of them go in **one ACF JSON export**, so one production runbook covers them (CMS
first, per WORKFLOW "Release process"):

1. **Per-page final CTA.**
   - Extend the `finalCtaSection` location to all route pages and `project`. Add `secondaryCtaText` /
     `secondaryCtaLink`.
   - Move `FinalCTASectionLoader` out of the layout and into each page, with the page name. Fallback: the home group.
   - The layout keeps the footer.
2. **Featured services row:** add `serviceTagline` (Translate) and `ctaText` (Translate), or the dictionary template
   `Explore {name}`. Add an `id` on the Services items so anchors work.
3. **Project:** add `cardDescription` (Translate). `ProjectsGrid` shows thumbnail · title · description (the copy's
   "exactly three").
4. **Testimonials:** as in §T.
5. **Services row:** add `heading` (Translate), `group` (Copy: core | supporting), `ctaText` (Translate), `ctaLink`
   (Copy once). Render `description` as sanitized HTML. Split the intro into heading + HTML body (or render
   `pageIntroText` as HTML instead of one h3).
6. **Package row:**
   - add `heading`, `pricePrefix` ("Starting at" / "à partir de" / "desde"), `ctaText` and `ctaLink`;
   - render `description` as HTML;
   - make the "What's included" heading optional;
   - remove the fixed "CAD" label (the price string carries its own currency format per locale).
7. **Reusable "content sections" repeater** (heading + HTML body) for Packages "Paid Website Diagnostic" and
   "Good to Know". It could also replace About's single `generalText` if a structured layout is wanted. It's one new
   group and one component instead of several one-off fields.
8. **Footer:** text links with labels from the dictionary. The LinkedIn URL comes from the existing `footerSocialIcons`
   `iconUrl` or a new `linkedinUrl`, plus `mailto:` and Privacy links.
9. **Lead magnet:** don't render it (layout or a `show` flag) until the rebuild phase. Update the `cmsFallback`
   strings.
10. **Privacy:** a new route reading WP page `content`, sanitized. It goes in the sitemap at Phase 7.

Every new HTML render uses `isomorphic-dompurify` (AGENTS convention). The existing unsanitized `AboutSection`,
`about-magneto` `generalText` and the intro `dangerouslySetInnerHTML` are touched anyway, so sanitizing them is in
scope.

## Proposed phase split
| Phase | Scope | Gate |
|---|---|---|
| **5a — Structure, shared + Home + About + case studies** | per-page final CTA (1), featured services (2), project cards (3), testimonials (§T), About CTA, footer links (8), hide lead magnet (9), dictionary EN keys → 2026 + FR/ES from copy, `en.test.ts` refresh | local ACF JSON + EN/FR/ES fixtures; production ACF runbook **before** the PR preview |
| **5b — Structure, Services + Packages** | (5), (6), (7), price formatting | same; can share the 5a runbook if the ACF JSON is cut once |
| **5c — Content loader (local)** | an idempotent WP-CLI/PHP script from the three copy files (field map from this doc): writes every text field in EN/FR/ES, updates existing fixtures, creates translations explicitly (no Language-box Duplicate), reads every field back by language + slug, flags values equal to the EN default. `wp db export` before/after | Phase 6 QA consumes its output |
| **5d — Contact Project Inquiry + Strategy Call modal** (today on WORKFLOW "Later") | 6-field form + `/api/contact` payload; modal variant A/B after the Calendly test; remove auto-subscribe (relates to ADR 0002 Brevo and `feat/calendly-prefill-optin`) | needs items 5–6 of "Content not ready" |
| **Privacy + consent** (Launch gate or own phase) | Privacy route; banner only if analytics is enabled (D7) | ES policy copy; verification gates |
| Production content | runbook: ACF already there → load EN 2026 + FR (+ ES) **at release**, because EN edits go live in ≈ 60 s | Launch |

## Launch option comparison
| | **EN + FR first** (ES later) | **EN + FR + ES together** |
|---|---|---|
| Copy blockers | FR Privacy exists (still gated by verification, as is EN). FR UI leftovers (≈ 25 keys) | + **ES Privacy, ES banner, ES newsletter consent missing**; same ≈ 25 keys ×2 |
| Mechanism | `ENABLED_LOCALES=en,fr`. The build guard ignores ES `TODO`s. The switcher shows EN \| FR | `en,fr,es`. Every ES key must be filled |
| QA (Phase 6) load | 2 locales × ~9 routes × 3 viewports | ×1.5 |
| Prerender debt | resolved once FR has its projects | needs ES projects too |
| Copy rule | "Show each language only when that localized version is live and has passed QA" (EN 16): staggering is expected | same rule, all at once |
| Risk | lower; ES content can still be loaded into the CMS while the locale stays disabled | launch date tied to the ES legal copy |
| Market (assumption, not verified) | FR first serves the Quebec default audience | ES serves the Spanish-speaking Montreal audience on day 1 |

Recommendation: **EN + FR first, ES when its Privacy copy exists and passes QA.**
- Note: the EN 2026 copy itself changes the live EN site. Shipping **EN 2026 alone first** is also possible: EN
  Privacy is still gated, but the structure phases don't depend on FR/ES. That's a decision for Mauricio + the Senior
  Architect (D5).

## Risks
- R1 **The EN invariant flips.** Phases 2–4 accepted only "EN byte-identical". Phase 5 changes EN on purpose. The new
  EN baseline = the copy file, and the `en.test.ts` fingerprint must be regenerated deliberately (ADR 0005).
- R2 **Production CMS edits are live in ≈ 60 s** (`revalidate: 60`). Loading EN copy into production before the new
  frontend is promoted shows new text in the old layout. New ACF fields are invisible to the old frontend, so: fields
  first, EN content at release.
- R3 **ACF defaults leak EN** into empty FR/ES fields (Phase 1 E5). The loader must write every text field. Phase 6
  flags values equal to the EN defaults.
- R4 **Repeater structure is Copy.** Row counts must match across languages (services rows change from the old 7 to
  3 + 4). Testimonials go from 1 row to 2, loaded together in EN/FR/ES.
- R5 WPML Language-box Duplicate is unreliable (Phase 3), and local fixtures already exist → the loader must
  update-or-create and verify by reading back.
- R6 **Auto-subscribe on booking** (`EmailCollectorProvider:88`) and the "24–48 h" SLA (`en.ts:88`) contradict the new
  copy. Don't publish the new privacy lines or the policy while they're live.
- R7 Two Calendly paths (hero direct vs modal) and two Calendly events (Known debt).
- R8 Lead magnet visible with the old funnel copy (Q1). The new positioning forbids funnel language.
- R9 No sanitization on 5 of 6 HTML renders (Known debt). Phase 5 adds more HTML fields.
- R10 Brand rename "Magneto Marketing" → "Magneto Web Consulting" touches `siteName`, WP `generalSettings.title`, the
  dictionary meta and OG. SEO impact → coordinate with Phase 7.
- R11 Prices are locale-formatted strings in a Translate field. Wrong formats are easy to load (ES/FR checks ask for
  non-breaking spaces).
- R12 This analysis used dated ACF evidence (CMS down). A schema drift since 2026-10-25 would change the field map.

## Decisions needed
- D1 Accept that Phase 5 changes EN on purpose. Define the new EN acceptance as "matches `docs/content/magneto-copy-en.md`
  section by section", replacing byte-identity. (Senior Architect)
- D2 Per-page final CTA: move it from the layout into pages, plus the ACF location change. This is a structural/data-
  model change → **ADR 0006 proposed** ("Phase 5 content model"), covering D2–D4.
- D3 The ACF additions listed in "Proposed design direction" (one JSON, one production runbook).
- D4 Generic "content sections" repeater vs dedicated one-off fields.
- D5 Launch order: EN + FR first / all three / EN 2026 alone first.
- D6 Do Contact form + modal (WORKFLOW "Later") join Phase 5 (5d)? If not, the Contact page can only take its hero copy.
- D7 Privacy: route slug `privacy-policy` (same in all locales, ADR 0003 D2). Is a consent banner needed while no
  analytics loads, or does the policy text change first (EN source)?
- D8 Q2–Q6 answers (CTA targets, sections without copy, avatars, `/projects` copy, Contact supporting copy).

## Files the Dev may touch
None. This is an analysis document. The only file written is `docs/specs/phase-5-gap-analysis.md`.

For planning, the Phase 5 spec(s) will most likely list:
- `src/app/[locale]/{layout,page}.tsx`, `about-magneto/*`, `services/*`, `packages/*`, `contact/*`,
  `projects/[slug]/page.tsx`, `projects/api.ts`, `data/projects.ts`;
- the new `src/app/[locale]/privacy-policy/*`;
- organisms `FinalCTASection`, `FeaturedServices`, `ProjectsGrid`, `ProjectDetail`, `Testimonials`,
  `TestimonialCard`, `Footer`, `LeadMagnetSection`, `PackagesGrid`; molecules `PackageCard`, `ServiceCard`;
- `ContactForm`, `EmailCollectorProvider`, `pages/api/contact.ts` (5d only);
- `src/i18n/dictionaries/*` + `en.test.ts`; `utils/seo.ts`;
- a loader script path to be named by the spec.

## Out of scope
- Any CMS write (local or production), any `src/` change, any copy edit or retranslation.
- SEO i18n (Phase 7), graphics and screenshots (Phase 8), the Brevo migration (ADR 0002), the `/carte` route, the
  Dangel slug redirect, the lead-magnet rebuild.

## Acceptance criteria (for this analysis)
- [ ] AC-1 Every `##`/`###` section of the EN copy for Home, About, Services, Packages, Contact, modal, Privacy, the
  three case studies and the footer appears in exactly one page-map row (reviewer spot check against E0 line ranges).
- [ ] AC-2 Every page has a class (A / B / NEW / NR) with a reason.
- [ ] AC-3 Before the Phase 5 spec is approved, Appendix A is re-run with Local up, and its output matches E1 (or this
  doc is amended).
- [ ] AC-4 `git status` shows only `docs/specs/phase-5-gap-analysis.md` (untracked). Nothing staged.

## Estimate (ranges; agent = Dev wall-clock incl. verification at 375/768/1440 × enabled locales)
| Work | Agent | Mauricio |
|---|---|---|
| 5a structure (shared, Home, About, case studies, dictionary) | 8–12 h | 1.5–2.5 h (review, local ACF JSON import, browser spot checks) |
| 5b structure (Services, Packages) | 6–10 h | 1–2 h |
| Production ACF runbook (one JSON) | 1 h (runbook + read-only checks) | 1–1.5 h |
| 5c content loader + local load EN/FR/ES (~27 posts, a few hundred fields) | 6–10 h | 2–4 h (backups, FR/ES spot checks, Dangel FR note) |
| 5d Contact form + modal | 8–14 h | 2–3 h (Calendly prefill test, answers flow, local email test) |
| Privacy route (+ banner if D7 says so) | 3–5 h (+ 6–10 h banner) | 2–4 h verification/legal gates (outside the repo) |
| **Total** | **≈ 32–52 h (+ banner)** | **≈ 10–17 h** |

Not included: Notion copy for the NR items, screenshots, Phase 6–8, and the production release.

## Appendix A — read-only re-checks to run when Local is up
```bash
# 1. Schema still matches E1 (local GraphQL, read-only)
curl -s http://magneto-cms-2.local/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ __type(name:\"HomeTestimonialsSectionTestimonials\"){ fields { name } } }"}'
# 2. ACFML dump (WP-SETUP.md, unchanged) — compare with the Phase 3b dump
#    (run inside Local's "Open site shell")
wp eval 'foreach ( acf_get_field_groups() as $g ) { echo "== ".$g["title"]." | mode=".($g["acfml_field_group_mode"]??"-").PHP_EOL;
  $w=function($f,$p="") use (&$w){ echo "   ".$p.$f["name"]." [".$f["type"]."] pref=".($f["wpml_cf_preferences"]??"-").PHP_EOL;
  foreach(($f["sub_fields"]??[]) as $s){ $w($s,$p.$f["name"]." > "); } }; foreach ( acf_get_fields($g["key"]) as $f ) { $w($f); } }'
# 3. ACF field *types* (text vs textarea vs wysiwyg) — not visible in GraphQL; the dump above shows them
# 4. Pages and translations per language (incl. a WP "privacy-policy" draft), projects per language
wp post list --post_type=page,project --post_status=any --fields=ID,post_name,post_status --format=table
wp eval 'foreach (["en","fr","es"] as $l){ do_action("wpml_switch_language",$l); echo $l.": "; foreach (get_posts(["post_type"=>["page","project"],"post_status"=>"any","numberposts"=>-1,"suppress_filters"=>false]) as $p) echo $p->post_name."(".$p->ID.") "; echo PHP_EOL; }'
# 5. Current testimonial rows, service rows, package rows and project image counts (EN)
wp eval '$h=get_page_by_path("home"); var_export(get_field("homeTestimonialsSection",$h->ID) ?: get_field("testimonials",$h->ID));'
```
Field names in item 5 must be taken from the dump in item 2. ACF `get_field` uses field **names**, not GraphQL names.
