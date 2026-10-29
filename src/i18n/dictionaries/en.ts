// EN UI microcopy: the source of truth for every dictionary (ADR 0005). Values are byte-exact copies of the
// strings that were hardcoded in components (curly ’, em/en dashes, "...", trailing spaces included);
// `en.test.ts` locks them. Declared without `as const`, so `typeof en` widens every leaf to `string`.
// Placeholders: {year} {n} {title} {status} {name} {domain}.
// Phase 5a: values from docs/content/magneto-copy-en.md (line refs in docs/reports/phase-5a-…md).
export const en = {
  common: {
    bookStrategyCall: 'Book a Strategy Call',
    goHome: 'Go Home',
    checkIconAlt: 'Check icon',
    loading: 'Loading...',
    close: 'Close',
  },
  nav: {
    about: 'About',
    services: 'Services',
    packages: 'Packages',
    projects: 'Projects',
    contact: 'Contact',
  },
  header: {
    logoAlt: 'Logo',
    scheduleCall: 'Book a Strategy Call',
    menuOpen: 'Menu',
    menuClose: 'Close',
    languageSwitcher: 'Language',
  },
  home: {
    recentProjects: 'Selected Web Projects',
    projectsIntro: 'Web experiences for wellness, professional services and digital commerce — built around the needs of each business.',
  },
  services: {
    errorTitle: 'Services',
    errorBody: "Sorry, we couldn't load the services right now. Please try again later.",
    featuredBadge: 'Featured Service',
  },
  about: {
    linkedinIconAlt: 'LinkedIn Icon',
  },
  footer: {
    copyright: 'Magneto Web Consulting © {year}',
    linkedin: 'Mauricio Bayuelo on LinkedIn',
    email: 'contact@magnetomarketing.co',
  },
  testimonials: {
    title: 'Client feedback',
  },
  featuredServices: {
    explore: 'Explore {name}',
  },
  projects: {
    emptyTitle: 'Everything unfolds in its sacred time.',
    emptySubtitle: 'We’re planting and cultivating new digital projects with wonderful clients.',
    emptyQuestion: 'Do you have a project in mind?',
  },
  projectDetail: {
    challenges: 'Challenges',
    solutions: 'Solutions',
    results: 'What Was Delivered',
    viewLiveSite: 'View {domain}',
    backToProjects: '← Back to Projects',
  },
  packages: {
    popularBadge: 'Popular',
    included: "What's included:",
  },
  calendly: {
    closeDialog: 'Close scheduling dialog',
    frameTitle: 'Calendly scheduling',
  },
  forms: {
    namePlaceholder: 'Your name',
    emailPlaceholder: 'you@company.com',
  },
  contactForm: {
    // Labels only: the option values sent to the email stay EN in the component.
    businessTypes: {
      coach: 'Coach',
      therapist: 'Therapist',
      ecommerce: 'Ecommerce',
      realEstate: 'Real State',
      other: 'Other',
    },
    errors: {
      nameRequired: 'Please enter your name.',
      emailInvalid: 'Please enter a valid email address.',
      businessTypeRequired: 'Please select a business type.',
      submitFailed: 'Failed to submit form',
      unknown: 'Submission failed',
    },
    success: "Thanks! We'll get back to you within 24–48 hours.",
    ariaLabel: 'Contact form',
    nameLabel: 'Name',
    emailLabel: 'Email Address',
    businessTypeLabel: 'Business Type',
    businessTypePlaceholder: 'Choose an option',
    messageLabel: 'Message (optional)',
    messagePlaceholder: 'A short note about your project',
    sending: 'Sending...',
    send: 'Send',
  },
  emailModal: {
    errors: {
      emailInvalid: 'Please enter a valid email',
      subscribeFailed: 'Failed to subscribe ({status})',
      unknown: 'Subscription failed',
    },
    bookingTitle: 'Quick — before we book',
    calendlyBody: 'Tell us who you are so we can prep a smarter session tailored to your goals.',
    downloadTitle: 'Grab your free guide',
    downloadReady: 'Thanks — your guide is ready for you.',
    downloadBody: 'Enter your name and email, so we can send marketing ideas and tips.',
    defaultBody: 'Enter your name and email so we can send confirmation and reminders.',
    checking: 'Checking...',
    download: 'Download the free guide',
    openInNewTab: 'Open guide in new tab',
    downloadUnavailable: 'Download unavailable',
    preparing: 'Preparing download...',
    pdfNotFound:
      "Sorry — we couldn't find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co",
    botChallenge:
      'The file appears to be protected by the host (bot challenge). Click "Open guide in new tab" to let your browser complete the challenge and download the file.',
    nameLabel: 'Name',
    emailLabel: 'Email',
    submitting: 'Submitting...',
    continueDownload: 'Continue to Download the Guide',
    continueBooking: 'Continue to Book Call',
    subscribe: 'Subscribe',
  },
  notFound: {
    metaTitle: '404: This page could not be found.',
    heading: '404',
    body: 'This page could not be found.',
  },
  projectNotFound: {
    metaTitle: 'Project Not Found',
    heading: 'Project Not Found',
    body: "The project you're looking for doesn't exist or may have been moved.",
    viewAll: 'View All Projects',
  },
  // Shown only when a CMS field is empty or the fetch fails (spec §1b, Decision E).
  cmsFallback: {
    leadMagnet: {
      overTitle: 'Not ready to book a call?',
      title: 'Download our free guide:',
      subtitle: '5 Mistakes That Kill Funnel Conversions',
    },
    requestQuote: 'Request Free Quote',
    finalCta: {
      bgAlt: 'Background',
      title: 'Start with a conversation.',
      subtitle: 'Share what is and is not working with your website. Magneto will help determine whether the sensible next step is a new website, a focused fix, ongoing care — or no major intervention yet.',
    },
    heroImageAlt: 'Hero Image',
    socialIconAlt: 'Social Icon',
    galleryImageAlt: 'Gallery image {n}',
  },
  meta: {
    site: {
      fallbackTitle: 'Magneto Web Consulting',
      fallbackDescription: 'A creative digital agency showcasing work and services.',
    },
    home: {
      title: 'Magneto Marketing - Home',
      description: 'Magneto Marketing — strategy, web development and UX services for solo founders and small teams.',
    },
    services: {
      title: 'Services - Magneto Marketing',
      description: 'Strategy, Web Development, UX/UI and growth services offered by Magneto Marketing.',
    },
    packages: {
      title: 'Packages - Magneto Marketing',
      description: 'Browse service packages and pricing for Magneto Marketing.',
    },
    projects: {
      title: 'Projects - Magneto Marketing',
      description: 'A curated selection of recent projects and case studies by Magneto Marketing.',
    },
    about: {
      title: 'About Magneto - About the Agency',
      description: 'Meet Magneto Marketing — a solo web agency focused on strategy, design and web development.',
    },
    contact: {
      title: 'Contact - Magneto Marketing',
      description: 'Get in touch with Magneto Marketing to book a strategy call or ask about services.',
    },
    project: {
      title: '{title} | Magneto Projects',
    },
  },
};
