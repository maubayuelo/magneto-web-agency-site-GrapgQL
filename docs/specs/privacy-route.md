# Privacy route — `/privacy-policy` in EN / FR-CA / ES (D-L)

- **Status: Approved** (rev 1.1, approved by Mauricio + Senior Architect, 2026-11-04)
- Author: Architect · Reviewed by: Mauricio (+ Senior Architect)
- Date: 2026-11-04
- Branch: `spec/privacy-route`, **stacked on `spec/phase-5c-rev3`** (`d10108e`, 5c rev 3.1 Approved). This spec cites 5c
  rev 3.1. **Merge order: the 5c spec PR first, then this one.**
- Depends on: [5b spec](phase-5b-services-packages-seo.md) rev 9 (§5.5 D-L, OQ-2, "Other specs" item 3, AC-20),
  [5b report](../reports/phase-5b-services-packages-seo.md) (release checklist D-L, restore patch),
  [5c loader](phase-5c-loader.md) rev 3.1 (§5 method, A3/A4, §8, calendar), [5d-lite spec](phase-5d-lite-contact-modal.md)
  (D-14 Privacy links already rendered), ADR [0003](../adr/0003-locale-routing.md), [0004](../adr/0004-localized-data.md),
  [0005](../adr/0005-ui-dictionaries.md), [0002](../adr/0002-brevo-replaces-mailchimp.md).
- Canonical copy: `docs/content/magneto-copy-{en,fr-CA,es}.md` **as of `ffec355`** (export 2026-11-02). Notion stays
  canonical. All `docs/content` line numbers refer to `ffec355`. If a later export moves them (the Sat 11-07/Sun 11-08
  re-export, §Gates), section titles govern.
- Calendar (estimates, from 5c rev 3.1): **Mauricio's gates before Thu 11-12** (G-8 may move to 12-01, Plan B) ·
  **implementation Thu 11-12** · 5e Mon 11-23 – Tue 11-24 · go/no-go Tue 12-01 · **release Thu 12-03** · fallback
  Thu 12-10. Plan B = EN + FR.

## Revision
- **rev 1.1 (2026-11-04) — Approved.** D-P1…D-P9 all **A** (D-P6 B acceptable). O-3 closed (ES decision at the 12-01
  go/no-go), O-2 closed by the 11-07/11-08 re-export. Branch stacked on 5c rev 3.1. Brevo: the lead magnet may go live
  at launch if 5e passes → new conditional gate **G-4b**, §8 / R-9 / §7 / AC-16 updated. Re-export rule added (§Gates).
  ADR 0002 amendment 1 (D-P7) written. Calendar: G-8 may slip to the 12-01 go/no-go; EN and FR gates are not optional.
- rev 1 (2026-11-04) — Draft.

## Goal
`/privacy-policy` renders the approved Privacy Policy in every locale enabled at launch: `/privacy-policy` (EN),
`/fr/privacy-policy`, `/es/privacy-policy` (ES only if ES launches). Each locale reads its own WordPress page through
WPML. The footer links to it in every locale. No consent banner and no "Privacy choices" link ship, because no
analytics loads. When this holds in production for every enabled locale, D-L is met and the email-less footer (5b §5.5)
ships as is.

## Evidence (facts verified 2026-11-04, unless stated)

**Repo state**
- E1. `git branch --show-current` → `spec/phase-5c-rev3`. `git branch -a | grep privacy` → nothing. `git log master..HEAD`
  → `01d7798`, `f24c90d`, `d10108e` (5c rev 3 / 3.1 + ADR 0006 am. 3). Working tree clean before this file.
- E2. No privacy route: `src/app/[locale]/` has `about-magneto, contact, packages, projects, services, [...rest]` only.
  Today `/privacy-policy` matches `[...rest]/page.tsx:5-7` and returns `notFound()`.
- E3. **Privacy links already point at the route (D-14, 5d-lite):** `ContactForm.tsx:204` and
  `EmailCollectorProvider/index.tsx:335` render `<a href={localizePath('/privacy-policy', locale)}>{t.common.privacyPolicy}</a>`.
  Until this phase ships they 404.
- E4. The dictionary key exists in all three locales with the approved values: `en.ts:13` "Privacy Policy", `fr.ts:12`
  "Politique de confidentialité", `es.ts:12` "Política de privacidad". It is locked by `en.test.ts:21` and the verbatim
  table `dictionary.test.ts:196` (`['common.privacyPolicy', 642, 780, 796, …]`).
- E5. Footer today (`Footer/index.tsx:8-32`): the line, LinkedIn (`<ul>` rendered **only** when the CMS URL is set,
  `:17-25`), copyright. No email (5b D-L, comment `:7`). No Privacy link (comment `:6`: "comes with the Privacy route").
- E6. Page pattern to reuse: `about-magneto/page.tsx` (`generateMetadata` → `pageMetadata(t.meta.about)` `:17-20`;
  `notFound()` when the loader returns null `:25-26`; DOMPurify before `dangerouslySetInnerHTML` `:57`) and
  `about-magneto/api.ts` (`pages(first: 1, where: { language: $language, name: "about-magneto" })` `:10`,
  `wpLocaleVars(locale)` `:82`, null → 404 `:84-85`). `fetchWPGraphQL` revalidates every 60 s (`utils/wp-graphql.ts:39`).
- E7. Metadata helper `utils/page-metadata.ts:14-21`. EN `meta.*` block `en.ts:190-230`; no `meta.privacy` key.
- E8. Sitemap `app/sitemap.xml/route.ts:12` and fallback `:35`: `['/', '/about-magneto', '/services', '/projects', '/contact']`.
  EN only, no `/packages` (pre-existing, not in scope). robots `app/robots.txt/route.ts:8-17`: `Allow: /` + sitemap,
  or `Disallow: /` with `NO_INDEX`. No change needed.
- E9. Locale gating: `middleware.ts:7-11` + `i18n/config.ts:18-27`. A disabled locale's `/fr/privacy-policy` → 404
  (ADR 0003). Build guard `layout.tsx:131-138` → `assertLocalesReady` fails `next build` if an enabled locale has
  `[FR TODO]`/`[ES TODO]` values. Today: 59 lines with `TODO` in `fr.ts`, 58 in `es.ts` (`grep -c`, includes the
  header comment). The Wed 11-11 fill is meant to clear them.
- E10. **ACF groups on any page** (`docs/acf/phase-5-field-groups.json`, location rules): `heroContent` (every page)
  and `finalCtaSection` (every page and project). A new `privacy-policy` page will show both groups in admin. The route
  below reads neither.
- E11. **Analytics never loads:** `loadAnalytics` (`utils/analytics.ts:17`) and `loadGtm` (`utils/gtm.ts:16`) have no
  callers (`grep -rn "loadAnalytics\|loadGtm" src` → only their definitions). `gtagEvent` calls are no-ops without
  `window.gtag` (`analytics.ts:30-34`). No `@vercel/analytics` / speed-insights in `package.json`. Locally the GA/GTM
  env vars are placeholders only (`.env.local.example:30`). → **"No consent banner while no analytics loads" holds in code
  today.**
- E12. Other third parties and storage found in code (input for gate G-4/G-5):
  - Google Fonts, loaded on **every page** by CSS: `styles/typography.scss:4`
    (`@import url("https://fonts.googleapis.com/css2?…")`). Each visit sends the visitor's IP to Google.
  - Calendly: `widget.js` / `widget.css` from `assets.calendly.com` (`utils/calendly.ts:68-69`). It loads on click, with
    a preconnect on hover/focus (`calendly.ts:141-166`). It does not load at page load.
  - `sessionStorage` key for UTM parameters (`utils/utm.ts:26,35,53`). No `localStorage`, no `document.cookie` in `src`.
  - SMTP via nodemailer (`pages/api/contact.ts:41-53`, `SMTP_HOST/USER/PASS/PORT`). The provider is not named in the repo.
    The handler does not persist submissions (no fs/DB access in `contact.ts`).
  - Mailchimp: `grep -i mailchimp src/pages/api/contact.ts` → no match (OQ-3 done in 5d-lite). Legacy
    `/api/mailchimp` is still called by `EmailCollectorProvider/index.tsx:208` (popup/lead magnet, hidden). Vercel has no
    Mailchimp env vars (HANDOFF.md:75, verified 2026-10-26).
  - Hosting: `vercel.json` sets no region (only `NPM_FLAGS`).
- E13. **Restore patch** `~/Documents/projects/magneto/backups/phase-5b/footer-email-restore.patch` (outside the repo,
  6469 B, 2026-10-31; 5b report :418). It patches `Footer/index.tsx` (the same `<ul>` block this phase changes),
  `Footer.test.tsx`, the three dictionaries and `en.test.ts`. One of its context lines is `fr.ts` `title: '[FR TODO] Client
  feedback'`, which the Wed 11-11 fill replaces. **After this phase, and after the dictionary fill, the patch as written
  will no longer apply.**

**Local CMS**
- E14. `curl http://magneto-cms-2.local/graphql` on 2026-11-04 → connection refused (exit 7, Local not running). **Not
  re-verified today.** Last evidence: 5b E16 (2026-10-31):
  ```graphql
  pages(first:1, where:{language:"en"|"fr"|"es", name:"privacy-policy"}) { nodes { databaseId slug } }
  ```
  ```
  privacy-policy: en [] · fr [] · es []
  ```
  Unauthenticated GraphQL only returns published posts. A WordPress-core draft "Privacy Policy" page (slug
  `privacy-policy`, created at install) would not show here. See A2.

**Copy (where the privacy text lives today)**

| Item | EN | FR-CA | ES |
|---|---|---|---|
| Policy body | `magneto-copy-en.md:737-857` "Consensus EN Source Copy v2", **frozen 8 Oct 2026**, "Publication is still gated by implementation verification" (:739) | `fr-CA.md:914-1032`, editorially final, "publication soumise aux vérifications" (:11) | `es.md:930-1042`, **BORRADOR (2026-10-30)** (:932) |
| SEO title / description | :861 / :863 | :1036 / :1038 | :1046 / :1048 |
| Banner + "Privacy choices" | :865-873, footers :135, 249, 423, 545, 672 | :1040-1050, footers :115, 208, 367, 484, 810 | :1050-1060 (BORRADOR) |
| Newsletter/lead-magnet consent | :887-893 (unchecked box) | (FR: gate list :1095) | :1062-1068 (hidden block) |
| Implementation constraints / gates | :897-906 | :1088-1100 "Vérifications avant publication" | :1072-1118 |
| Notion | EN page (WORKFLOW.md "Canonical copy") | FR-CA page | ES page; Privacy gate task `3fc702393b5e81769152d3f158979ab1` (es.md:1081) |

- The policy has no hero copy, no final-CTA copy and no Home-style sections: only a title, two dates, an intro and
  sections 1-11.
- **Lines that must never be published:** the internal compliance note (EN :739), "Publication gate" (EN :815), the SEO
  block, the interface-copy blocks, and every checklist.
- §1 already contains what D-L needs: Privacy Officer "Mauricio Bayuelo" plus `contact@magnetomarketing.co` (EN :758-764,
  FR :924-930, ES :944-950).
- HANDOFF.md:76 (2026-10-26): "No consent banner while no analytics loads; Mauricio removes 'Privacy choices' from the
  copy until analytics exists." **Not yet done in the export:** "Privacy choices" is still in the footers, in policy §5
  (EN :813) and in the banner block.

## Mauricio's Law 25 verification gates (before Thu 11-12 for G-1…G-7 in EN; FR/ES follow)
Agents write no legal copy (Hard rule 4). Each gate ends as a Notion edit, **EN first, then FR-CA, then ES** (FR
:1090). Not legal advice.

**Calendar rule (rev 1.1):** budget the gates for Fri 11-06 – Sun 11-08. The **EN and FR gates are not optional** before
Thu 11-12. If Mauricio can't close all of them by then, only **G-8 (ES final)** may move to the Tue 12-01 go/no-go
(Plan B decision, O-3).

**Re-export rule (rev 1.1):**
- **One** copy re-export to `docs/content`, Sat 11-07 or Sun 11-08 (Senior Architect), before 5c. It includes the
  lead-magnet copy changes (closes O-2).
- The policy **body never goes through the export**: Mauricio pastes it from Notion into WP (§6). Gate edits to the
  policy text may continue in Notion after the re-export.
- The implementation uses `meta.privacy` from that export. If later gate work changes the SEO lines, they enter with the
  5c-rest re-export (week of 11-16) as a dictionary follow-up.
- **Never re-export during 5c (Mon 11-09 – Wed 11-11).**

| Gate | What to verify / decide | Already known in the repo | Copy affected |
|---|---|---|---|
| **G-1 Legal business name** | That "Magneto MKTNG" is the exact registered name (Registraire des entreprises du Québec), and that "operated by Mauricio Bayuelo under the registered business name" describes the legal form | Stated in EN :753, :762. FR gate :1090 asks for exactly this. | Intro, §1 ×3 |
| **G-2 Privacy Officer + public contact** | Designation (Mauricio). Whether `contact@magnetomarketing.co` is monitored. Whether a public address is needed (FR :1090 mentions "l'adresse publique"; the copy has none) | §1 has name + email (E-copy). The footer has no email (5b D-L), so this page is the public contact. | §1 ×3 |
| **G-3 Effective date** | The copy shows "8 October 2026", the text's freeze date. It must be the real date the policy takes effect (the release day 12-03, or 12-10 on fallback), and the same in all three languages. "Last updated" = same day. | FR :1090 raises the question. | Header ×3 |
| **G-4 Providers (§4)** | Per provider: role, data, processing/storage location, agreement/DPA, and whether a transfer-outside-Quebec assessment is needed. Then replace the forward-looking sentence ("Before production launch, Magneto must verify…", EN :804, FR :971) with a factual statement. | See provider inventory below. | §4 (+ §2 if a flow changes) ×3 |
| **G-4b Brevo (conditional, for 5e)** | Now: verify Brevo's processing/storage location and DPA (transfer outside Quebec → assessment, as G-4). Prepare the §8 policy changes in Notion **EN → FR → ES** as a **ready block**, not yet part of the published text. Publish the block on the WP privacy pages (every enabled locale) **before the 5e deploy**, whether that is 12-03 or later. If 5e doesn't ship, the block stays in Notion. | Mauricio has a Brevo account (2026-11-04). ADR 0002 am. 1. §8 | §2, §3, §4, §6, §7 (+ §5 if Brevo runs scripts) ×3, at 5e |
| **G-5 Cookies / analytics (§5)** | No analytics at launch (E11). §5 currently promises a banner and a "Privacy choices" link (EN :806-815) that won't exist. Rewrite §5 to describe what really runs: necessary technologies, Google Fonts (E12), the UTM `sessionStorage` key (E12), and Calendly only on click. Remove "Privacy choices" from the footers. Park the banner copy for the analytics phase. Also check the analytics-dependent bullets in §2 (:774), §3 (:786) and §4 (:801). Confirm `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` are unset in Vercel Production. | E11, E12. HANDOFF :76. | §2-§5, footers ×3 |
| **G-6 Retention (§7)** | Keep the current wording (internal schedule after launch, no public periods; FR :1093 "ne pas inventer de délais"), or publish periods. Confirm the wording is true: where inquiry emails land (the SMTP recipient mailbox) and how long they stay; Calendly bookings; Vercel logs. | `/api/contact` stores nothing (E12). The recipient mailbox is not identifiable from the repo. | §7 ×3 |
| **G-7 Strategy Call flow (§2, §4)** | The B2 line is approved (EN :885): answers go to Calendly with the booking. Confirm that §2 "Strategy Call information" still matches the live 5d-lite flow. | 5d-lite merged (PR #24). | §2 ×3 |
| **G-8 ES final** | The ES draft becomes final, including G-1…G-7, before ES can launch. May move to the Tue 12-01 go/no-go (rev 1.1). If not final then, Plan B: no ES page, ES not enabled. | ES :932 BORRADOR | ES all |
| **G-9 Optional review** | Review by a privacy professional (FR :1093 "idéalement"). Mauricio's call. | — | — |

**Provider inventory** (what the repo shows; Mauricio fills location / agreement)

| Provider | Role | Personal data | Known in repo | Mauricio verifies |
|---|---|---|---|---|
| **Vercel** | Hosts the frontend; runs `/api/contact` (serverless) | IP / request logs; inquiry fields in transit | `vercel.json` sets no region (E12) | Function region, log retention, DPA |
| **SiteGround** | Hosts WordPress (`cms.magnetomarketing.co`) | No visitor submissions stored by the site (E12). Admin users only, unless mail is also hosted there | AGENTS.md (production CMS) | Data center, whether it also hosts mail/SMTP |
| **SMTP provider** | Delivers inquiry emails (nodemailer) | Every inquiry field | `contact.ts:41-53`; host only in env (value not read) | Which provider, location, DPA |
| **Mailbox for `contact@magnetomarketing.co`** | Receives inquiries and privacy requests | Inquiries and messages | Not in repo | Provider, location, retention (G-6) |
| **Calendly** | Strategy Call scheduling | B2 answers, name, email, booking details; cookies inside its widget | `calendly.ts:68-69`, loads on click | Location, DPA, which cookies its widget sets |
| **Google Fonts** | Web fonts | Visitor IP and user agent on every page | `typography.scss:4` | Mention in §4/§5, or self-host later (D-P9) |
| Email / file-storage / project-management tools | Replying and client work (EN §4 bullet 3) | Inquiry content, client files | Not in repo | Which tools, locations |
| GA / GTM | — | None today (never loaded, E11) | `analytics.ts`, `gtm.ts` | Vercel env unset |
| Mailchimp | — | None in production (no env in Vercel; contact no longer calls it) | E12 | Account closed or dormant; removed in 5e |
| **Brevo** | **Planned** (5e, possibly live at launch): guide delivery + optional newsletter | Email (+ name?), consent record | ADR 0002 (+ am. 1); account exists | G-4b, §8 |
| LinkedIn | Outbound link only | None from the site | Footer | — |
| WPML (wpml.org) | CMS licensing | No visitor data | 3b runbook | — |

## Assumptions and open questions
- **A1.** The page body goes in the WordPress **post content** (block editor), not in an ACF field. WPGraphQL exposes
  `Page.content` (rendered HTML) by default. *Not verified today (E14).* The Dev's first step is this query (expected:
  `content` is a non-null string for the EN page):
  `{ pages(first:1, where:{language:"en", name:"privacy-policy"}) { nodes { databaseId slug title content modified } } }`.
- **A2.** WordPress core may already have a **draft** "Privacy Policy" page with slug `privacy-policy`, locally and in
  production. A new page would then get `privacy-policy-2`. Mauricio checks Pages → Drafts/Trash first (step W-0).
- **A3.** The FR/ES `privacy-policy` pages can keep the EN slug. 5c §5 step 3 does this for 13 posts ("if WPML proposes
  `-2`, set it back"), and ADR 0004 / ADR 0003 D2 require it.
- **A4.** Gutenberg keeps headings, lists, bold and links when Mauricio pastes from Notion. The rendered HTML passes
  DOMPurify unchanged in structure (`mailto:` links are kept).
- **O-1.** Does `cms.magnetomarketing.co` show published pages through a theme (e.g. `/privacy-policy/` on the CMS
  domain)? If it does, publishing the production pages before the release exposes them there early. Mauricio checks
  read-only, in a browser.
- **O-2. Closed (rev 1.1).** Lead-magnet name: the human brief says "Fix, Rebuild or Maintain?". The `ffec355` export
  says "Fix or Rebuild? A Practical Website Checklist" (EN :113, :229, :401). The Sat 11-07/Sun 11-08 re-export
  includes the lead-magnet copy changes and settles it (5e input).
- **O-3. Closed (rev 1.1).** The ES Plan B decision is taken at the **Tue 12-01 go/no-go** (5b had Fri 12-04, against a
  12-10 release).

## Design

### 1. Route
`src/app/[locale]/privacy-policy/` with `page.tsx`, `api.ts`, `types.ts`, `api.test.ts`, `page.test.tsx`.
- `api.ts`: `getPrivacyPage(locale)` → `fetchWPGraphQL(QUERY, wpLocaleVars(locale))`, with the query
  `pages(first: 1, where: { language: $language, name: "privacy-policy" }) { nodes { title content } }`. Returns
  `{ title, html }` or `null` when there is no node or the content is empty. The GraphQL response type goes in `types.ts`.
  No `any`. Never `page(id, URI)` / `pageBy` (ADR 0004). If `wpLocaleVars` also declares `$mediaOriginal`, follow
  what `about-magneto/api.ts` does. No media is needed.
- `page.tsx` (server component): resolve the locale like `about-magneto/page.tsx:22-24`, then `null` → `notFound()`.
  Render:
  ```tsx
  <div className="main"><article className="privacy-policy">
    <h1 className="…">{title}</h1>
    <div className="privacy-policy__body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  </article></div>
  ```
  (no `lang` attribute: the root `<html lang>` is already per locale, `layout.tsx:154`). The title is plain text from
  WP, rendered as a text node (WP titles can hold entities: decode as the other routes do, or render `title` as
  returned. The Dev follows the existing pattern and tests "Politique de confidentialité").
- **Loading / error / empty states** (AGENTS.md): server-rendered, so there is no client loading state. Empty or missing
  page → `notFound()` (the localized 404). A fetch error follows `fetchWPGraphQL`'s existing behavior, as on About.
- **No Hero, no final CTA** (D-P2 A). The page is a document: H1 + body. The copy defines neither (Evidence, copy).
- Styles: `src/styles/pages/privacy.scss`, imported by the page as `about.scss` is. Readable measure (≈ 70ch), spacing
  for `h2`, `h3`, `p`, `ul/li`, link underline + visible focus, AA contrast. Kebab-case BEM. Use only existing variables
  and mixins.
- **Content contract for Mauricio** (W-steps): the WP title = "Privacy Policy" / "Politique de confidentialité" /
  "Política de privacidad" (rendered as the only H1). The body starts with the two date lines, then the intro, then
  sections "1. …" to "11. …" as **Heading H2** blocks, with lists as List blocks. Do **not** paste: the
  "Privacy Policy" heading line (it is the title), the internal note, "Publication gate", the SEO block, the
  interface/banner copy, checklists.

### 2. Data source (D-P1)
**Recommended: A — one WordPress page per language through WPML (post content).**
- Fits ADR 0004 (language + slug, missing translation → 404) and the brief ("backed by 3 WP pages").
- Mauricio can correct a legal text (date, provider) without a deploy: it is live within 60 s (E6). That matters for a
  policy that must change whenever a provider changes (EN :906).
- **No ACF or schema change**, so no production ACF runbook: the "CMS first" rule needs only page creation.
- Images: none.

Alternatives:
- B — static content in the repo (TS/MD per locale): no CMS dependency and testable verbatim. But every legal edit needs
  a deploy, agents would transcribe ~120 lines ×3 of legal text, and it departs from the brief. Not recommended.
- C — a new ACF WYSIWYG group on the page: no benefit over post content, and it needs an ACF JSON change + production
  runbook (ADR 0006). Not recommended.

### 3. Footer link
`Footer/index.tsx`: the `<ul className="footer__links">` is **always** rendered. It contains LinkedIn (only when the
CMS URL is set, unchanged) and then `<li><a href={localizePath('/privacy-policy', locale)} className="footer__link">
{t.common.privacyPolicy}</a></li>`. Use a plain `<a>` with `localizePath`, as the Header does (Known debt D1). No
`target`, no new dictionary key (E4). **No "Privacy choices" link** while no analytics loads (E11, G-5). The order
follows the copy: LinkedIn · Privacy Policy (EN :133-135). Update the comments `:5-7`. `Footer.test.tsx` changes from
"no list at all" to "Privacy link only" when there is no LinkedIn URL, and checks the href per locale (`/privacy-policy`,
`/fr/privacy-policy`, `/es/privacy-policy`).

### 4. Metadata, sitemap, robots
- `meta.privacy = { title, description }` in `en.ts`, `fr.ts`, `es.ts`, **verbatim** from EN :861/:863, FR :1036/:1038,
  ES :1046/:1048. No TODO values, so the guard is unaffected (E9). Add the verbatim rows to `dictionary.test.ts` (the
  pattern at `:196`) and the EN lock to `en.test.ts`. `generateMetadata` → `pageMetadata(t.meta.privacy)`. Indexable,
  like other pages. Canonical, hreflang and `og:locale` are Phase 7.
- The Dev uses `meta.privacy` from the Sat 11-07/Sun 11-08 re-export (Re-export rule). SEO-line changes after it enter
  with the 5c-rest re-export (week of 11-16), not in this phase.
- Sitemap (D-P3 A): add `'/privacy-policy'` to both `staticPaths` arrays (`route.ts:12`, `:35`). EN only, like every
  other entry. Per-locale sitemap is Phase 7.
- robots: no change.

### 5. 404 behavior and locale gating
| Case | Result |
|---|---|
| Locale disabled (`ENABLED_LOCALES` without it) | Middleware → 404 (ADR 0003), unchanged |
| Locale enabled, no published `privacy-policy` page in that language | `notFound()` → localized 404, **and** the footer, Contact and modal links in that locale point to a 404. This is the state D-L forbids at launch (§7). |
| Page exists, empty content | `notFound()` (treated as missing) |
| EN | Must exist before any promote that includes this route |

The route does not depend on dictionary TODOs and adds no build-time CMS check (D-P4 rationale). The prerender follows
the layout's `generateStaticParams` (one per enabled locale). A missing page at build time renders a 404 for that path
and becomes 200 on revalidation once the page is published.

### 6. Mauricio's WordPress steps (local first, production later)
The method is 5c rev 3.1 §5. The privacy pages are **3 posts outside the 13-row checklist**: `check-translations.php`
does not cover them, and this phase does not extend it (it belongs to 5c).

**W-0 (both environments, read-only):** Pages → All / Drafts / Trash: is there any page with slug `privacy-policy`
(A2)? If there is a WP-core draft: open it, check it is the core placeholder, and **delete it permanently** (local
first). Production gets the same check, with a backup first.

**W-1 EN original:** Pages → Add New, language EN. Title "Privacy Policy". Slug `privacy-policy`. Body per the content
contract (§1), from the **final** Notion EN after the gates. Leave `heroContent` / `finalCtaSection` empty (E10;
not rendered). Publish.

**W-2 FR, then W-3 ES (5c §5 method):**
1. WPML → Translation Management → Pages → tick "Privacy Policy" (EN) → *Duplicate content* for **one** language → Duplicate.
2. Pages → language switcher → open the copy → **Translate independently** (mandatory, see R-2 below).
3. Title "Politique de confidentialité" / "Política de privacidad". Slug = `privacy-policy` (reset if `-2`). Status Publish.
4. Replace the whole duplicated EN body with the FR-CA / ES body (same content contract). Don't edit any ACF field.
   Update **once**.
5. Check (read-only GraphQL, the Dev or Mauricio):
   `pages(first:1, where:{language:"fr"|"es", name:"privacy-policy"}) { nodes { databaseId slug status title } }`
   → one node, slug `privacy-policy`, `publish`. Also check that the WPML Translations box on the EN page lists FR/ES.

**Fit with the 5c rules:**
- **A3** (never Update EN Packages) is unaffected: the privacy pages are new, and no other EN original is opened.
- **A4** (no admin save of an FR/ES post after its *loader* load): the privacy pages are never loaded by the loader.
  Their content is the admin save itself (step 4). Later edits to an FR/ES privacy page in admin are allowed and expected
  (legal updates). The A4 risk (Copy re-sync of ACF rows) does not apply: the privacy pages' only ACF fields are the
  empty hero/final-CTA groups.
- **§8** (EN admin saves after FR/ES exist): a later EN privacy edit copies the **Copy** fields (empty) to FR/ES and
  writes no Translate field. The post content of a page translated independently is not synced. Rule: **step 2 must be
  done**. Otherwise a later EN Update overwrites the FR/ES text (5c R-2). The §8 follow-up (loader dry-runs) does not
  apply here. Instead, after any EN privacy edit, re-run the step 5 check and open `/fr|es/privacy-policy`.
- **Backups:** creating 3 pages is not a bulk write (Hard rule 10). Still: one `wp db export …/backups/privacy-route/
  magneto-cms-2_privacy-before_$(date +%Y%m%d-%H%M).sql` locally before W-0, and a production backup before W-0 in
  production.
- **Calendar collision:** Mon 11-09 (13 posts), Tue 11-10 (FR/ES loads), Wed 11-11 (dictionary fill). The 3 local
  privacy pages fit **Wed 11-11 afternoon** (≈ 45-60 min), **after** the FR/ES loads, so they can't disturb the loader
  runs. If the gates aren't done by then, the local pages are created from the **current** `ffec355` text, to unblock
  Thursday's implementation. They are re-pasted after the gates (local only; it is not production).
- **Production (Mauricio only):** after the gates pass, pasting the final texts from Notion (not from the export), at the latest before
  the PR's Vercel preview check (the preview builds against production WP: WORKFLOW "Release process"). This is
  invisible on the live frontend: production still serves the pre-5a site, which has no route for the path. Check O-1
  for the CMS domain. Run it in the same separate session as the 13 production posts (5c OQ-1), or right after.
  ES production page: only if ES launches (Plan B).

### 7. D-L check (release checklist; replaces the 5b report entry when this phase ships)
**Keep the email-less footer iff, on the deployment to be promoted, with the production `ENABLED_LOCALES`, for every
enabled locale L:**
1. `GET {L-prefix}/privacy-policy` → **200**, `<html lang>` = `en` / `fr-CA` / `es`, the H1 in L.
2. The body shows §1 with the Privacy Officer **Mauricio Bayuelo** and a working `mailto:contact@magnetomarketing.co`,
   and the effective date from G-3 (not "8 October 2026" unless G-3 decided it).
3. The body is the **final** text for L: gates G-1…G-7 applied (and G-8 for ES). No internal note, "Publication gate"
   line or forward-looking §4 sentence.
4. The footer on `/`, `/contact` and one project page in L shows "Privacy Policy" and links to that 200 page. The Contact
   form and booking modal privacy links resolve to the same page.
5. No "Privacy choices" link and no analytics request (`googletagmanager.com`) on those routes (E11).
6. **Only if the deployment includes 5e (Brevo live):** the body in L contains the published G-4b block (§8), and the
   lead magnet is not live in any locale whose page lacks it.

**If any item fails for a locale L** (D-P4):
- **Recommended (A):** don't launch L. For FR/ES that is Plan B (`ENABLED_LOCALES` without L). If EN fails, the release
  moves to the 12-10 fallback. Reason: Law 25 requires the policy to be published wherever personal information is
  collected, and the Contact and modal links in L would 404 anyway. Restoring the email fixes neither.
- (B) Launch L anyway with the email restored: apply the **refreshed** patch (D-P5) to the release, and accept that the
  Privacy links in L are broken. Only with an explicit decision by Mauricio.
- Patch validity (fact, E13): `footer-email-restore.patch` v1 will not apply after this phase (`Footer/index.tsx` `<ul>`
  block) nor after the dictionary fill (`fr.ts` context line). D-P5 refreshes it.

### 8. Brevo (lead magnet + optional newsletter) — policy impact only
Not part of this phase. The lead magnet **may go live at launch (12-03) if 5e passes** (plan: 5e implemented Mon 11-23 –
Tue 11-24), otherwise days later (EN :109 "Publish only when the guide is complete and the email flow is implemented").
Mauricio now has a Brevo account. The policy must describe only real flows (G-4), so the changes below are prepared now
as the **G-4b ready block** in Notion (EN → FR → ES) and published on the WP pages **before the 5e deploy**, whether
that is 12-03 or later (EN :906). Pasting them is a WP edit only (§6), no re-export and no code change.

**Brevo in the provider inventory** (5e adds it to §4 when live): role = sending the requested guide and, only with
separate consent, marketing emails. Data = email (plus name if the form asks), consent record, campaign events
(opens/clicks if enabled). Location / agreement = Mauricio verifies **now** (G-4b; Brevo is an EU company; transfer
outside Quebec → assessment per G-4).

**G-4b ready block — policy changes for 5e (Notion EN → FR → ES, Mauricio; published before the 5e deploy):**
| § | Change |
|---|---|
| §2 | New bullet: guide request / newsletter: email (+ name), the consent choice, and the date and source of the request |
| §3 | Purposes: send the requested guide; send occasional marketing emails **only** to people who checked the optional box |
| §4 | Brevo named, with its role and location |
| §6 | Already states separate consent + unsubscribe (EN :819-823). Add: guide delivery does not subscribe you; the optional box is unchecked by default (EN :887-893); every marketing email has an unsubscribe link, honoured promptly |
| §7 | Retention: guide-only contacts (purpose ends after delivery), subscribers (until they unsubscribe), and the suppression record kept after an unsubscribe so it can be honoured. Mauricio sets the periods. |
| Consent record | Keep proof of consent (date/time, form/page, checkbox wording and language, IP if Brevo stores it). Mention in §2/§7. |
| §5 | Only if Brevo tracking pixels or scripts run on the site: describe them |

**Conflict: ADR 0002 vs approved copy.** ADR 0002 (Context, line 10-11) says Mauricio "wants Calendly bookings to feed
the same Brevo list". The approved copy says "Booking a call does not subscribe you to marketing emails" (B2, EN :885),
and policy §6 says "Submitting an inquiry or booking a call does not automatically subscribe you to marketing emails"
(EN :821). The constraints are "Do not bundle Strategy Call / inquiry consent with newsletter consent" (EN :901) and "No
newsletter checkbox … for the first version" of the modal (EN :734). Approved copy wins (Hard rule 4). 5b OQ-3 already
applied the same principle to `/api/contact`.

**D-P7 — decided A (rev 1.1); ADR 0002 amendment 1 written:** Calendly bookings and Project Inquiries are **never**
added to a marketing list. The only path into the Brevo marketing list is the unchecked optional box. Alternatives:
(B) keep the ADR and change the approved copy + add a marketing checkbox to the booking flow. This contradicts EN :734
and reopens frozen copy; not recommended. (C) Later, bookings may go to a **non-marketing** Brevo contact list (CRM
only, never in campaigns). That would be a new data flow needing its own policy text in §2/§4. Possible in a future
phase; not needed for 5e.

**What a separate "5e — lead magnet + Brevo" spec must cover:**
1. ADR 0002 amendment 1 (D-P7, done) as a constraint, and Mailchimp removal: `pages/api/mailchimp.ts`, the `EmailCollectorProvider` call `:208`,
   consumers, env vars, tests (ADR 0002 Consequences).
2. Brevo list setup by Mauricio (the account exists; no agent access). Env vars in `.env.local.example`, server-only (no `NEXT_PUBLIC_`).
   A local mode that never calls Brevo (like `DISABLE_SMTP=1`).
3. Server route (Pages Router `pages/api/*`, the router split): validation, rate limit/abuse protection, two separate
   actions (deliver guide; subscribe only if the box is checked), idempotency, errors without leaking provider detail.
4. Guide delivery: the asset (final name, O-2), hosting, the email template ×3 languages, the existing
   `/api/download` / `download-check` routes reused or removed.
5. Consent: unchecked optional box (EN :891-893, ES :1064-1066, FR equivalent to export), separate from delivery.
   Consent record fields. Double opt-in decision. Language attribute per contact.
6. CASL items to verify (Mauricio): sender identification and a **mailing address** in every marketing email (copy has
   none today, G-2), unsubscribe link and timing, how long proof of consent is kept.
7. Policy update ×3 = the G-4b ready block, published on the WP pages before the 5e deploy (a deploy precondition).
   Re-run of this spec's §7 checks (incl. item 6) on the updated pages.
8. The lead-magnet section rebuild: server loader (Known debt I-9), the missing-env-var swallow (Known debt), copy ×3,
   hidden until the guide exists.
9. Tests: no Brevo request without the box checked; no marketing subscription from `/api/contact` or the booking modal
   (as OQ-3).
10. Production checks on a preview: a real end-to-end run by Mauricio only.

## Files the Dev may touch
- `src/app/[locale]/privacy-policy/page.tsx` — new: route, metadata, `notFound()`, sanitized body
- `src/app/[locale]/privacy-policy/api.ts` — new: language + slug query, mapper → `{ title, html } | null`
- `src/app/[locale]/privacy-policy/types.ts` — new: response and view types
- `src/app/[locale]/privacy-policy/api.test.ts` — new: query variables per locale, null on no node or empty content, mapper
- `src/app/[locale]/privacy-policy/page.test.tsx` — new: H1, sanitized body (a `<script>` in the content is stripped), `notFound` on null
- `src/styles/pages/privacy.scss` — new: document typography
- `src/components/organisms/Footer/index.tsx` — the list is always rendered; Privacy link; comments
- `src/components/organisms/Footer/Footer.test.tsx` — Privacy link per locale; no-LinkedIn case
- `src/i18n/dictionaries/en.ts`, `fr.ts`, `es.ts` — `meta.privacy` only
- `src/i18n/dictionaries/en.test.ts`, `src/i18n/dictionary.test.ts` — locks and verbatim rows for `meta.privacy`
- `src/app/sitemap.xml/route.ts` — add `/privacy-policy` to both arrays
- `docs/reports/privacy-route.md` — the report (including the D-L checklist from §7 and the CMS evidence for A1)
- `~/Documents/projects/magneto/backups/privacy-route/footer-email-restore-v2.patch` — **outside the repo**, D-P5 only:
  generated from the finished branch (email restored on top of the new footer + `footer.email` ×3 + test), proven with
  `git apply --check` on a clean checkout of the branch, and not applied. v1 is kept.

Anything else is out of scope.

## Out of scope
- Consent banner, "Privacy choices" link, any analytics loading (until an analytics phase).
- Legal text: writing, editing or translating policy copy (Mauricio + Notion, Hard rule 4). The Dev reports any gap.
- Brevo / Mailchimp code (5e). Further ADR 0002 edits (amendment 1 is part of rev 1.1).
- `check-translations.php` / loader changes (5c). Self-hosting Google Fonts (D-P9). `/packages` missing from the
  sitemap, per-locale sitemap, hreflang, canonical, `og:locale` (Phase 7). Nav links to `next/link` (Known debt D1).
- Any WordPress write by agents; any production action.
- WordPress Settings → Privacy (core "privacy policy page" setting): not needed by the headless site; leave unset.

## Acceptance criteria
Local, with `ENABLED_LOCALES=en,fr,es` (`ALLOW_UNTRANSLATED_LOCALES=1` only if the 11-11 fill hasn't landed, and only
locally) on the Dev's own port (3100), with the 3 local pages present (W-1…W-3):
- [ ] AC-1 Completion gate: `npm run lint && npm run typecheck && npm test -- --run && npm run build`. Lint does not exceed
  the baseline at the start of the phase (record the numbers). No new `any`.
- [ ] AC-2 A1 evidence in the report: the `content` query and a trimmed response for en/fr/es.
- [ ] AC-3 `/privacy-policy`, `/fr/privacy-policy`, `/es/privacy-policy` → 200; one `<h1>` = WP title in that language;
  `<html lang>` `en` / `fr-CA` / `es`; `<title>` and meta description = `meta.privacy` verbatim (EN :861/:863,
  FR :1036/:1038, ES :1046/:1048, or as moved by the 11-07/11-08 re-export; section titles govern).
- [ ] AC-4 Heading order: H1 then H2 sections, with no skipped level (axe or a manual outline). Links are underlined or
  otherwise distinct, focus is visible, contrast is AA. Check the `mailto:` link works.
- [ ] AC-5 Viewports 375 / 768 / 1440 for each of the 3 locales: no horizontal scroll, readable measure. Screenshots in
  the report.
- [ ] AC-6 Footer on `/`, `/contact`, `/projects/<one slug>` in en/fr/es: "Privacy Policy" / "Politique de
  confidentialité" / "Política de privacidad" → `/privacy-policy`, `/fr/privacy-policy`, `/es/privacy-policy` (200).
  No `mailto:` in the footer. No "Privacy choices".
- [ ] AC-7 Contact form + booking modal privacy links (E3) resolve to 200 in en/fr/es.
- [ ] AC-8 404: with the ES page unpublished (simulate by querying a slug that doesn't exist in a unit test, **not** by
  editing WP), the mapper returns null and the page calls `notFound()`. With `ENABLED_LOCALES=en,fr`,
  `/es/privacy-policy` → 404 (curl).
- [ ] AC-9 `/sitemap.xml` contains `/privacy-policy`; `/robots.txt` unchanged.
- [ ] AC-10 No network request to `googletagmanager.com` / `google-analytics.com` on the 3 privacy routes and `/`
  (browser network log). No banner rendered.
- [ ] AC-11 EN unchanged on `/`, `/services`, `/packages`, `/projects`, `/about-magneto`, `/contact`, one project page:
  same render as before at 1440, except the footer list (Privacy link added).
- [ ] AC-12 Guard: `ENABLED_LOCALES=en,fr,es npm run build` **without** `ALLOW_UNTRANSLATED_LOCALES` fails only because of
  pre-existing TODOs (if any), never because of `meta.privacy`. `grep -n "TODO" fr.ts es.ts` shows no `meta.privacy` line.
- [ ] AC-13 D-P5: v2 patch exists at the named path. `git apply --check` passes on the branch; the output is in the report.
- [ ] AC-14 The report contains the §7 D-L checklist as the release item, replacing the 5b report entry, for the
  release-day runbook.

Launch (Mauricio, production / preview, not the Dev):
- [ ] AC-15 Gates G-1…G-7 closed in Notion EN → FR before Thu 11-12 (ES: G-8 by the 12-01 go/no-go at the latest).
  Production pages W-0…W-3 pasted from Notion after a backup. G-4b block ready in Notion EN → FR → ES.
- [ ] AC-16 §7 items 1-5 pass on the deployment to be promoted, for every enabled locale; item 6 too if that deployment
  includes 5e (G-4b block published first). Otherwise apply D-P4 (or hold 5e).

## Mid-phase checkpoint — Thu 11-12, ≈ 13:00 (Mauricio, ≈ 15 min)
The Dev stops after the route works and before touching the footer:
1. A1 query output (en/fr/es) and AC-3 for the three locales (curl + one screenshot each at 1440).
2. `api.test.ts` + `page.test.tsx` green; AC-8 (404) proven.
3. Mauricio confirms the content contract renders correctly (H1/H2, lists, `mailto`) on the pasted text.
Go → footer, metadata, sitemap, patch v2, QA matrix, report (afternoon). No-go (content structure wrong) → Mauricio
fixes the WP body; no code change.

## Risks
| # | Risk | Mitigation |
|---|---|---|
| R-1 | Gates not closed by 12-01 (providers, ES final) | Local implementation does not wait for them (§6 calendar). D-P4 A / Plan B per locale. EN late → 12-10 |
| R-2 | FR/ES not "Translate independently" → a later EN Update overwrites FR/ES | §6 W-2 step 2 is mandatory. After any EN edit, re-check FR/ES text |
| R-3 | WP-core draft holds the slug → `privacy-policy-2` | W-0; step 5 slug check |
| R-4 | Policy describes flows that don't exist (banner, analytics) or omits real ones (Google Fonts, SMTP) | G-4, G-5; AC-10; Hard rule 4 (the agent reports, does not edit) |
| R-5 | Restore patch stale (E13) | D-P5 v2 + `git apply --check` |
| R-6 | Pages published early on the CMS domain (O-1) | Mauricio checks O-1 before production W-1 |
| R-7 | Pasted HTML carries Notion artefacts (empty paragraphs, odd headings) | Content contract; checkpoint item 3; WP-side fix only |
| R-8 | Preview fails "main routes 200" because the production EN page doesn't exist yet | Production W-1 before the preview check (§6) |
| R-9 | Brevo goes live (at launch or later) before the policy describes it | G-4b: location/DPA verified now, block ready in Notion EN → FR → ES; published on the WP pages before the 5e deploy; §7 item 6; 5e item 7; EN :906 |
| R-10 | Thu 11-12 collides with 5c follow-ups or 5c-rest prep | 6-9 h agent fits one long day. The footer part can slip to Fri 11-13 without affecting the release |

## Decisions needed
Decided 2026-11-04 (rev 1.1, Mauricio + Senior Architect).

| ID | Question | Options | Decision |
|---|---|---|---|
| **D-P1** | Data source | A WP page per language (post content) · B static repo content · C new ACF field | **A** |
| **D-P2** | Page layout | A document (H1 + body), no Hero, no final CTA · B Hero + final CTA (needs hero copy ×3 that doesn't exist) | **A** |
| **D-P3** | Sitemap | A add `/privacy-policy` (EN) · B leave out | **A** |
| **D-P4** | A locale fails the §7 D-L check at promote | A don't launch that locale (Plan B; EN → 12-10) · B launch with email restored (patch v2), links broken | **A** |
| **D-P5** | Restore patch | A Dev writes v2 outside the repo + `--check` · B regenerate only if needed on release day | **A** |
| **D-P6** | FR/ES page creation | A 5c §5 Duplicate → Translate independently → replace body · B WPML "+" with the native editor (blank page, no duplicate risk) | **A** (B acceptable if Mauricio prefers) |
| **D-P7** | ADR 0002 "bookings feed Brevo" vs approved copy | A amend ADR (never) · B change copy + checkbox · C non-marketing CRM list later | **A** — ADR 0002 amendment 1 |
| **D-P8** | When to create the production pages | A after gates, before the PR preview check, in the OQ-1 session · B on release day | **A** |
| **D-P9** | Google Fonts (visitor IP to Google on every page) | A name it in the policy (G-4/G-5) · B self-host fonts in a later phase, then drop it from the policy | **A** (B optional later) |

No ADR is needed for this phase: no dependency, routing or data-model change. D-P7 is ADR 0002 amendment 1.

## Estimate
| Work | Dev (agent) | Mauricio |
|---|---:|---:|
| Spec review | — | 30–45 min |
| Gates G-1…G-7 (research: registry, providers/locations/DPAs, retention wording, effective date) | — | 2.5–4 h |
| Notion edits EN → FR (→ ES final, G-8), incl. §4/§5 rewrite, "Privacy choices" removal | — | 1.5–2.5 h |
| G-4b: Brevo location/DPA + ready block EN → FR → ES | — | 1–1.5 h (not in the total) |
| Local pages W-0…W-3 (+ backup) | read-only check 10 min | 45–60 min |
| Route + api + types + tests | 2–3 h | — |
| Checkpoint | 0.25 h | 15 min |
| Footer + tests, `meta.privacy` ×3 + tests, sitemap | 1–1.5 h | — |
| SCSS + QA matrix (3 locales × 3 widths, AC-6/7/10/11) | 1.5–2 h | — |
| Patch v2 + `--check` | 0.25 h | — |
| Gate, report | 1–1.5 h | 20–30 min (review) |
| Production pages W-0…W-3 (+ backup, O-1 check) | — | 45–60 min |
| **Total** | **≈ 6–8.5 h** | **≈ 6.5–10 h** |

Against 5b §11 ("Privacy route EN/FR/ES (D-L)": 6–9 h agent / 5–8 h Mauricio): agent within range. Mauricio is +1–2 h
because of G-5 (the §5 rewrite and "Privacy choices" removal across the three languages) and the provider inventory.

**Calendar** (estimates):
- Wed 11-04: approved (rev 1.1). D-P1…D-P9 decided; ADR 0002 amendment 1.
- Fri 11-06 – Sun 11-08: Mauricio closes G-1…G-7 in Notion EN, then FR (not optional), and G-4b (Brevo check + ready
  block). G-8 (ES) may move to the 12-01 go/no-go. **Sat 11-07/Sun 11-08: the one re-export** (incl. lead-magnet copy).
  No re-export Mon 11-09 – Wed 11-11 (5c).
- Wed 11-11 afternoon: local pages W-0…W-3 (after the FR/ES loads and the dictionary fill).
- **Thu 11-12: implementation**, checkpoint ≈ 13:00, report end of day (footer part may slip to Fri 11-13).
- Week of 11-16: 5c-rest re-export carries any later `meta.privacy` change.
- By Sun 11-22 (with the OQ-1 session): production pages EN + FR (ES if G-8 is done). PR preview check, merge.
- Mon 11-23 – Tue 11-24: 5e. If it passes, paste the G-4b block on the WP pages before its deploy.
- Tue 12-01 go/no-go: §7 checklist (+ item 6 if 5e ships) + the ES decision (O-3). Thu 12-03 release.
