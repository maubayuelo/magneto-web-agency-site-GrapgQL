// EN fingerprint (spec §2.4, AC-4). This table was generated from the V0 sources (master 8065eae: the
// components, pages and Next's built-in 404 as they were before Phase 4), not from en.ts. It locks every EN
// value byte-for-byte: punctuation, dashes, ellipses, trailing spaces. A key added to en.ts must be added here.
// Phase 5a (spec Part 2 item 12, D1): keys changed, added or removed on purpose for the 2026 copy. Each changed or
// added line carries its source line in docs/content/magneto-copy-en.md (commit 23b620a); Mauricio confirms them
// (AC-20). Every other line is still the V0 value.
// Transforms applied to the sources: JSX `&apos;` → ', `\u2014` → —, and `${expr}` / `{expr}` → {year} {n} {title} {status}.
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { flattenDictionary } from '../dictionary';

const EN_FINGERPRINT: Record<string, string> = {
  "common.bookStrategyCall": "Book a Strategy Call", // Phase 5a, magneto-copy-en.md:18
  "common.goHome": "Go Home",
  "common.checkIconAlt": "Check icon",
  "common.loading": "Loading...",
  "common.close": "Close",
  "nav.about": "About",
  "nav.services": "Services",
  "nav.packages": "Packages",
  "nav.projects": "Projects",
  "nav.contact": "Contact",
  "header.logoAlt": "Logo",
  "header.scheduleCall": "Book a Strategy Call", // Phase 5a, magneto-copy-en.md:18
  "header.menuOpen": "Menu",
  "header.menuClose": "Close",
  "header.languageSwitcher": "Language",
  "home.recentProjects": "Selected Web Projects", // Phase 5a, magneto-copy-en.md:66
  "home.projectsIntro": "Web experiences for wellness, professional services and digital commerce — built around the needs of each business.", // Phase 5a, magneto-copy-en.md:68
  "services.errorTitle": "Services",
  "services.errorBody": "Sorry, we couldn't load the services right now. Please try again later.",
  "services.featuredBadge": "Featured Service",
  "about.linkedinIconAlt": "LinkedIn Icon",
  "footer.copyright": "Magneto Web Consulting © {year}", // Phase 5a, magneto-copy-en.md:136
  "footer.linkedin": "Mauricio Bayuelo on LinkedIn", // Phase 5a, magneto-copy-en.md:242
  "footer.email": "contact@magnetomarketing.co", // Phase 5a, magneto-copy-en.md:242
  "testimonials.title": "Client feedback", // Phase 5a, magneto-copy-en.md:88
  "featuredServices.explore": "Explore {name}", // Phase 5a, magneto-copy-en.md:46/54/62 (name as a placeholder)
  "projects.emptyTitle": "Everything unfolds in its sacred time.",
  "projects.emptySubtitle": "We’re planting and cultivating new digital projects with wonderful clients.",
  "projects.emptyQuestion": "Do you have a project in mind?",
  "projectDetail.challenges": "Challenges",
  "projectDetail.solutions": "Solutions",
  "projectDetail.results": "What Was Delivered", // Phase 5a, magneto-copy-en.md:931
  "projectDetail.viewLiveSite": "View {domain}", // Phase 5a, magneto-copy-en.md:954 (domain as a placeholder)
  "projectDetail.backToProjects": "← Back to Projects",
  "packages.popularBadge": "Popular",
  "packages.included": "What's included:",
  "calendly.closeDialog": "Close scheduling dialog",
  "calendly.frameTitle": "Calendly scheduling",
  "forms.namePlaceholder": "Your name",
  "forms.emailPlaceholder": "you@company.com",
  "contactForm.businessTypes.coach": "Coach",
  "contactForm.businessTypes.therapist": "Therapist",
  "contactForm.businessTypes.ecommerce": "Ecommerce",
  "contactForm.businessTypes.realEstate": "Real State",
  "contactForm.businessTypes.other": "Other",
  "contactForm.errors.nameRequired": "Please enter your name.",
  "contactForm.errors.emailInvalid": "Please enter a valid email address.",
  "contactForm.errors.businessTypeRequired": "Please select a business type.",
  "contactForm.errors.submitFailed": "Failed to submit form",
  "contactForm.errors.unknown": "Submission failed",
  "contactForm.success": "Thanks! We'll get back to you within 24–48 hours.",
  "contactForm.ariaLabel": "Contact form",
  "contactForm.nameLabel": "Name",
  "contactForm.emailLabel": "Email Address",
  "contactForm.businessTypeLabel": "Business Type",
  "contactForm.businessTypePlaceholder": "Choose an option",
  "contactForm.messageLabel": "Message (optional)",
  "contactForm.messagePlaceholder": "A short note about your project",
  "contactForm.sending": "Sending...",
  "contactForm.send": "Send",
  "emailModal.errors.emailInvalid": "Please enter a valid email",
  "emailModal.errors.subscribeFailed": "Failed to subscribe ({status})",
  "emailModal.errors.unknown": "Subscription failed",
  "emailModal.bookingTitle": "Quick — before we book",
  "emailModal.calendlyBody": "Tell us who you are so we can prep a smarter session tailored to your goals.",
  "emailModal.downloadTitle": "Grab your free guide",
  "emailModal.downloadReady": "Thanks — your guide is ready for you.",
  "emailModal.downloadBody": "Enter your name and email, so we can send marketing ideas and tips.",
  "emailModal.defaultBody": "Enter your name and email so we can send confirmation and reminders.",
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
  "emailModal.continueBooking": "Continue to Book Call",
  "emailModal.subscribe": "Subscribe",
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
  "cmsFallback.finalCta.bgAlt": "Background",
  "cmsFallback.finalCta.title": "Start with a conversation.", // Phase 5a, magneto-copy-en.md:122
  "cmsFallback.finalCta.subtitle": "Share what is and is not working with your website. Magneto will help determine whether the sensible next step is a new website, a focused fix, ongoing care — or no major intervention yet.", // Phase 5a, magneto-copy-en.md:124
  "cmsFallback.heroImageAlt": "Hero Image",
  "cmsFallback.socialIconAlt": "Social Icon",
  "cmsFallback.galleryImageAlt": "Gallery image {n}",
  "meta.site.fallbackTitle": "Magneto Web Consulting", // Phase 5a O3 brand rename (spec 1.6)
  "meta.site.fallbackDescription": "A creative digital agency showcasing work and services.",
  "meta.home.title": "Magneto Marketing - Home",
  "meta.home.description": "Magneto Marketing — strategy, web development and UX services for solo founders and small teams.",
  "meta.services.title": "Services - Magneto Marketing",
  "meta.services.description": "Strategy, Web Development, UX/UI and growth services offered by Magneto Marketing.",
  "meta.packages.title": "Packages - Magneto Marketing",
  "meta.packages.description": "Browse service packages and pricing for Magneto Marketing.",
  "meta.projects.title": "Projects - Magneto Marketing",
  "meta.projects.description": "A curated selection of recent projects and case studies by Magneto Marketing.",
  "meta.about.title": "About Magneto - About the Agency",
  "meta.about.description": "Meet Magneto Marketing — a solo web agency focused on strategy, design and web development.",
  "meta.contact.title": "Contact - Magneto Marketing",
  "meta.contact.description": "Get in touch with Magneto Marketing to book a strategy call or ask about services.",
  "meta.project.title": "{title} | Magneto Projects",
};

describe('EN dictionary fingerprint', () => {
  it('has exactly the fingerprint keys', () => {
    expect(Object.keys(flattenDictionary(en)).sort()).toEqual(Object.keys(EN_FINGERPRINT).sort());
  });

  it.each(Object.entries(EN_FINGERPRINT))('%s is byte-identical to the approved source', (key, value) => {
    expect(flattenDictionary(en)[key]).toBe(value);
  });
});
