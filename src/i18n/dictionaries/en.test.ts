// EN fingerprint (spec §2.4, AC-4). This table was generated from the V0 sources (master 8065eae: the
// components, pages and Next's built-in 404 as they were before Phase 4), not from en.ts. It locks every EN
// value byte-for-byte: punctuation, dashes, ellipses, trailing spaces. A key added to en.ts must be added here.
// Phase 5a (spec Part 2 item 12, D1): keys changed, added or removed on purpose for the 2026 copy. Each changed or
// added line carries its source line in docs/content/magneto-copy-en.md (commit 23b620a); Mauricio confirms them
// (AC-20). Every other line is still the V0 value.
// Phase 5d-lite (spec §8): Contact form/page keys from docs/content/magneto-copy-en.md at export 2026-11-17; the old contactForm
// keys (incl. the old response-time success string) are removed. Part 2: bookingModal.* added; the 5 old emailModal booking
// keys (bookingTitle, calendlyBody, defaultBody, continueBooking, subscribe) are removed.
// Transforms applied to the sources: JSX `&apos;` → ', `\u2014` → —, and `${expr}` / `{expr}` → {year} {n} {title} {status}.
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { flattenDictionary } from '../dictionary';

const EN_FINGERPRINT: Record<string, string> = {
  "common.bookStrategyCall": "Book a Free Strategy Call", // Phase 5b, magneto-copy-en.md:19 (export 2026-11-17)
  "common.goHome": "Go Home",
  "common.loading": "Loading...",
  "common.close": "Close",
  "common.privacyPolicy": "Privacy Policy", // Phase 5d-lite, magneto-copy-en.md:681 (export 2026-11-17)
  "common.skipToContent": "Skip to main content", // design round A1 (D-A1a, Mauricio 2026-11-10)
  "nav.about": "About",
  "nav.services": "Services",
  "nav.packages": "Packages",
  "nav.projects": "Projects",
  "nav.contact": "Contact",
  "header.logoAlt": "Magneto", // design round A2 (F-1, Mauricio 2026-11-09)
  "header.scheduleCall": "Book a Strategy Call", // Phase 5b, magneto-copy-en.md:11 (export 2026-11-17) (unchanged value)
  "header.menuOpen": "Menu",
  "header.menuClose": "Close",
  "header.languageSwitcher": "Language",
  "header.navLabel": "Main", // design round A7 (D-A7, Mauricio 2026-11-10)
  "home.recentProjects": "Selected Web Projects", // Phase 5a, magneto-copy-en.md:61
  "home.projectsIntro": "Web experiences for wellness, professional services and digital commerce — built around the needs of each business.", // Phase 5a, magneto-copy-en.md:63
  "services.errorTitle": "Services",
  "services.errorBody": "Sorry, we couldn't load the services right now. Please try again later.",
  "services.featuredBadge": "Featured Service",
  "about.linkedinIconAlt": "LinkedIn Icon",
  "footer.copyright": "Magneto Web Consulting © {year}", // Phase 5a, magneto-copy-en.md:172
  "footer.linkedin": "Mauricio Bayuelo on LinkedIn", // Phase 5a, magneto-copy-en.md:286
  "consent.privacyChoices": "Privacy choices", // Phase 5f, magneto-copy-en.md:930 (= :170 item 2), export 2026-11-17
  "consent.body": "Necessary technologies help this website function. With your permission, Magneto may also use analytics to understand how the site is used and improve the experience. You can accept or reject non-essential analytics.", // Phase 5f, magneto-copy-en.md:932
  "consent.accept": "Accept analytics", // Phase 5f, magneto-copy-en.md:934 item 1
  "consent.reject": "Reject non-essential", // Phase 5f, magneto-copy-en.md:934 item 2
  "testimonials.title": "Client feedback", // Phase 5a, magneto-copy-en.md:83
  "featuredServices.explore": "Explore {name}", // Phase 5a, magneto-copy-en.md:41/49/57 (name as a placeholder)
  "projects.emptyTitle": "Everything unfolds in its sacred time.",
  "projects.emptySubtitle": "We’re planting and cultivating new digital projects with wonderful clients.",
  "projects.emptyQuestion": "Do you have a project in mind?",
  "projectDetail.challenges": "Challenges",
  "projectDetail.solutions": "Solutions",
  "projectDetail.results": "What Was Delivered", // Phase 5a, magneto-copy-en.md:1029
  "projectDetail.viewLiveSite": "View {domain}", // Phase 5a, magneto-copy-en.md:1052 (domain as a placeholder)
  "projectDetail.backToProjects": "← Back to Projects",
  "packages.popularBadge": "Popular",
  "packages.included": "What's included:",
  "packages.errorTitle": "Packages", // Phase 5b, Packages CMS error state (no copy source; pattern of services.error*)
  "packages.errorBody": "Sorry, we couldn't load the packages right now. Please try again later.", // Phase 5b, idem
  "calendly.closeDialog": "Close scheduling dialog",
  "calendly.frameTitle": "Calendly scheduling",
  "forms.namePlaceholder": "Your name",
  "forms.emailPlaceholder": "you@company.com",
  "contactForm.requiredNote": "Fields marked * are required.", // Phase 5d-lite, magneto-copy-en.md:693 (export 2026-11-17)
  "contactForm.nameLabel": "Name", // Phase 5d-lite, magneto-copy-en.md:626 (export 2026-11-17)
  "contactForm.emailLabel": "Email", // Phase 5d-lite, magneto-copy-en.md:630 (export 2026-11-17)
  "contactForm.websiteLabel": "Your website (if you have one)", // Phase 5d-lite, magneto-copy-en.md:634 (export 2026-11-17)
  "contactForm.websiteHelp": "Optional if you do not have a website yet.", // Phase 5d-lite, magneto-copy-en.md:638 (export 2026-11-17)
  "contactForm.needLabel": "What do you need help with?", // Phase 5d-lite, magneto-copy-en.md:640 (export 2026-11-17)
  "contactForm.needOptions.newSite": "A new website or rebuild", // Phase 5d-lite, magneto-copy-en.md:646 (export 2026-11-17)
  "contactForm.needOptions.fixImprove": "Fix or improve my current website", // Phase 5d-lite, magneto-copy-en.md:647 (export 2026-11-17)
  "contactForm.needOptions.care": "Ongoing website care", // Phase 5d-lite, magneto-copy-en.md:648 (export 2026-11-17)
  "contactForm.needOptions.notSure": "Not sure yet", // Phase 5d-lite, magneto-copy-en.md:649 (export 2026-11-17)
  "contactForm.messageLabel": "What is happening with your website, and what would you like to improve?", // Phase 5d-lite, magneto-copy-en.md:651 (export 2026-11-17)
  "contactForm.messageHelp": "A few sentences is enough.", // Phase 5d-lite, magneto-copy-en.md:655 (export 2026-11-17)
  "contactForm.budgetLabel": "Approximate budget", // Phase 5d-lite, magneto-copy-en.md:657 (export 2026-11-17)
  "contactForm.budgetOptions.under1000": "Under C$1,000", // Phase 5d-lite, magneto-copy-en.md:663 (export 2026-11-17)
  "contactForm.budgetOptions.from1000to3500": "Around C$1,000–3,500", // Phase 5d-lite, magneto-copy-en.md:664 (export 2026-11-17)
  "contactForm.budgetOptions.from3500to8000": "Around C$3,500–8,000", // Phase 5d-lite, magneto-copy-en.md:665 (export 2026-11-17)
  "contactForm.budgetOptions.over8000": "More than C$8,000", // Phase 5d-lite, magneto-copy-en.md:666 (export 2026-11-17)
  "contactForm.budgetOptions.notSure": "Not sure yet", // Phase 5d-lite, magneto-copy-en.md:667 (export 2026-11-17)
  "contactForm.budgetHelp": "A rough range is enough. It helps me suggest a realistic next step and does not create a quote. Choose Not sure yet if you are asking about ongoing care.", // Phase 5d-lite, magneto-copy-en.md:669 (export 2026-11-17)
  "contactForm.selectPlaceholder": "Select an option", // Phase 5d-lite, magneto-copy-en.md:691 (export 2026-11-17)
  "contactForm.submit": "Send project details", // Phase 5d-lite, magneto-copy-en.md:671 (export 2026-11-17)
  "contactForm.privacyText": "I’ll use the information you provide to review and respond to your project inquiry. Sending this form does not subscribe you to marketing emails.", // Phase 5d-lite, magneto-copy-en.md:681 (export 2026-11-17)
  "contactForm.successTitle": "Thank you. Your project details were sent.", // Phase 5d-lite, magneto-copy-en.md:685 (export 2026-11-17)
  "contactForm.successBody": "I’ll review them and reply by email with a recommended next step.", // Phase 5d-lite, magneto-copy-en.md:687 (export 2026-11-17)
  "contactForm.errors.nameRequired": "Please enter your name.", // Phase 5d-lite, magneto-copy-en.md:695 (export 2026-11-17)
  "contactForm.errors.emailInvalid": "Please enter a valid email address.", // Phase 5d-lite, magneto-copy-en.md:697 (export 2026-11-17)
  "contactForm.errors.needRequired": "Please choose what you need help with.", // Phase 5d-lite, magneto-copy-en.md:699 (export 2026-11-17)
  "contactForm.errors.messageRequired": "Please tell me a little about your website or project.", // Phase 5d-lite, magneto-copy-en.md:701 (export 2026-11-17)
  "contactForm.errors.budgetRequired": "Please choose an approximate budget, or Not sure yet.", // Phase 5d-lite, magneto-copy-en.md:703 (export 2026-11-17)
  "contactForm.errors.sendFailed": "Something went wrong and your message was not sent. Please try again, or book a free strategy call instead.", // Phase 5d-lite, magneto-copy-en.md:705 (export 2026-11-17)
  "contactForm.errors.sendFailedCta": "book a free strategy call", // Phase 5d-lite rev 3 A6: derived substring of magneto-copy-en.md:705
  "contactPage.preferToTalk": "Prefer to talk?", // Phase 5d-lite, magneto-copy-en.md:622 (export 2026-11-17)
  "contactPage.supporting.reply": "I read every inquiry personally and reply by email with a recommended next step.", // Phase 5d-lite, magneto-copy-en.md:675 (export 2026-11-17)
  "contactPage.supporting.languages": "You can write in English, French or Spanish.", // Phase 5d-lite, magneto-copy-en.md:677 (export 2026-11-17)
  "contactPage.supporting.notAQuote": "This is not a quote or an automatic sales call.", // Phase 5d-lite, magneto-copy-en.md:679 (export 2026-11-17)
  "emailModal.errors.emailInvalid": "Please enter a valid email",
  "emailModal.errors.subscribeFailed": "Failed to subscribe ({status})",
  "emailModal.errors.unknown": "Subscription failed",
  "emailModal.downloadTitle": "Grab your free guide",
  "emailModal.downloadReady": "Thanks — your guide is ready for you.",
  "emailModal.downloadBody": "Enter your name and email, so we can send marketing ideas and tips.",
  "emailModal.checking": "Checking...",
  "emailModal.download": "Download the free guide",
  "emailModal.openInNewTab": "Open guide in new tab",
  "emailModal.downloadUnavailable": "Download unavailable",
  "emailModal.preparing": "Preparing download...",
  "emailModal.pdfNotFound": "Sorry — we couldn't find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co",
  "emailModal.botChallenge": "The file appears to be protected by the host (bot challenge). Click \"Open guide in new tab\" to let your browser complete the challenge and download the file.",
  "emailModal.nameLabel": "Name",
  "emailModal.emailLabel": "Email",
  "emailModal.submitting": "Submitting...",
  "emailModal.continueDownload": "Continue to Download the Guide",
  "bookingModal.body": "Answer three short questions so we can focus the conversation on your website. Then choose a time for a free 30-minute call.", // Phase 5d-lite, magneto-copy-en.md:743 (export 2026-11-17)
  "bookingModal.websiteHelp": "optional", // Phase 5d-lite, magneto-copy-en.md:748 (export 2026-11-17)
  "bookingModal.problemLabel": "What is the main website problem or goal?", // Phase 5d-lite, magneto-copy-en.md:754 (export 2026-11-17)
  "bookingModal.problemHelp": "One or two sentences is enough.", // Phase 5d-lite, magneto-copy-en.md:755 (export 2026-11-17)
  "bookingModal.continue": "Continue to scheduling", // Phase 5d-lite, magneto-copy-en.md:757 (export 2026-11-17)
  "bookingModal.privacyText": "Your answers are passed to Calendly with your booking to prepare for the call. Calendly will ask for your name and email to schedule it. Booking a call does not subscribe you to marketing emails.", // Phase 5d-lite, magneto-copy-en.md:946 (export 2026-11-17)
  "notFound.heading": "404",
  "notFound.body": "This page could not be found.",
  "notFound.metaTitle": "404: This page could not be found.",
  "projectNotFound.metaTitle": "Project Not Found",
  "projectNotFound.heading": "Project Not Found",
  "projectNotFound.body": "The project you're looking for doesn't exist or may have been moved.",
  "projectNotFound.viewAll": "View All Projects",
  "cmsFallback.leadMagnet.overTitle": "Not ready to book a call?",
  "cmsFallback.leadMagnet.title": "Download our free guide:",
  "cmsFallback.leadMagnet.subtitle": "5 Mistakes That Kill Funnel Conversions",
  "cmsFallback.requestQuote": "Request Free Quote",
  "cmsFallback.finalCta.title": "Start with a conversation.", // Phase 5a, magneto-copy-en.md:158
  "cmsFallback.finalCta.subtitle": "Share what is and is not working with your website. Magneto will help determine whether the sensible next step is a new website, a focused fix, ongoing care — or no major intervention yet.", // Phase 5a, magneto-copy-en.md:160
  "cmsFallback.heroImageAlt": "Hero Image",
  "cmsFallback.socialIconAlt": "Social Icon",
  "cmsFallback.galleryImageAlt": "Gallery image {n}",
  "meta.site.fallbackTitle": "Magneto Web Consulting", // Phase 5a O3 brand rename (spec 1.6)
  "meta.site.fallbackDescription": "Magneto builds, fixes and maintains websites for Montreal service businesses. Strategy, UX/UI and development with direct founder involvement, in English, French and Spanish.", // Phase 5b, magneto-copy-en.md:178 (export 2026-11-17)
  "meta.home.title": "Website Design & Development in Montreal | Magneto", // Phase 5b, magneto-copy-en.md:176 (export 2026-11-17)
  "meta.home.description": "Magneto builds, fixes and maintains websites for Montreal service businesses. Strategy, UX/UI and development with direct founder involvement, in English, French and Spanish.", // Phase 5b, magneto-copy-en.md:178 (export 2026-11-17)
  "meta.services.title": "Website Services in Montreal | Build, Fix & Care | Magneto", // Phase 5b, magneto-copy-en.md:468 (export 2026-11-17)
  "meta.services.description": "Website design, development, optimization and ongoing care for Montreal service businesses. BUILD, FIX and CARE with direct founder involvement.", // Phase 5b, magneto-copy-en.md:470 (export 2026-11-17)
  "meta.packages.title": "Website Design Pricing in Montreal | Magneto", // Phase 5b, magneto-copy-en.md:590 (export 2026-11-17)
  "meta.packages.description": "Website pricing for Montreal service businesses. Landing pages from C$3,500, full websites typically C$5,000–8,000. Fixes start at C$1,000; care starts at C$200/month.", // Phase 5b, magneto-copy-en.md:592 (export 2026-11-17)
  "meta.projects.title": "Web Design Projects in Montreal | Magneto", // Phase 5b, magneto-copy-en.md:193 (export 2026-11-17)
  "meta.projects.description": "Selected website projects by Magneto Web Consulting in Montreal: web experiences for wellness, professional services and digital commerce.", // Phase 5b, magneto-copy-en.md:195 (export 2026-11-17)
  "meta.about.title": "About Magneto | Montreal Web Consulting", // Phase 5b, magneto-copy-en.md:292 (export 2026-11-17)
  "meta.about.description": "Meet Mauricio Bayuelo, founder of Magneto Web Consulting in Montreal. Web strategy, UX/UI and development for service businesses in English, French and Spanish.", // Phase 5b, magneto-copy-en.md:294 (export 2026-11-17)
  "meta.contact.title": "Contact Magneto | Website Projects in Montreal", // Phase 5b, magneto-copy-en.md:717 (export 2026-11-17)
  "meta.contact.description": "Contact Magneto Web Consulting in Montreal. Tell me what you need built, fixed or maintained and get a clear next step, in English, French or Spanish.", // Phase 5b, magneto-copy-en.md:719 (export 2026-11-17)
  "meta.privacy.title": "Privacy Policy | Magneto Web Consulting", // Privacy route, magneto-copy-en.md:897 (export 2026-11-17)
  "meta.privacy.description": "How Magneto Web Consulting collects, uses and protects personal information submitted through this website, and how to contact the Privacy Officer.", // Privacy route, magneto-copy-en.md:899 (export 2026-11-17)
  "meta.project.title": "{title} | Magneto Projects",
  "meta.caseStudies.dangel.title": "Dangel Wellness — Trilingual Website | Magneto", // Phase 5b, magneto-copy-en.md:1064 (export 2026-11-17)
  "meta.caseStudies.dangel.description": "A French, English and Spanish website for a Montreal wellness professional: clear service information, booking and contact paths, and owner-editable content.", // Phase 5b, magneto-copy-en.md:1066 (export 2026-11-17)
  "meta.caseStudies.trepied.title": "Trépied — Video Studio Website | Magneto", // Phase 5b, magneto-copy-en.md:1185 (export 2026-11-17)
  "meta.caseStudies.trepied.description": "A trilingual website for a Montreal video production studio, built to present its services and productions and lead clients to a call or quote request.", // Phase 5b, magneto-copy-en.md:1187 (export 2026-11-17)
  "meta.caseStudies.shamanicca.title": "Shamanicca — Online Shop & Blog (Own Project) | Magneto", // Phase 5b, magneto-copy-en.md:1334 (export 2026-11-17)
  "meta.caseStudies.shamanicca.description": "Magneto's own project: an online shop and blog in one website, with one search across products and articles and a newsletter signup.", // Phase 5b, magneto-copy-en.md:1336 (export 2026-11-17)
};

describe('EN dictionary fingerprint', () => {
  it('has exactly the fingerprint keys', () => {
    expect(Object.keys(flattenDictionary(en)).sort()).toEqual(Object.keys(EN_FINGERPRINT).sort());
  });

  it.each(Object.entries(EN_FINGERPRINT))('%s is byte-identical to the approved source', (key, value) => {
    expect(flattenDictionary(en)[key]).toBe(value);
  });
});
