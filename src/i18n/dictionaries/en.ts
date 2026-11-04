// EN UI microcopy: the source of truth for every dictionary (ADR 0005). Values are byte-exact copies of the
// strings that were hardcoded in components (curly ’, em/en dashes, "...", trailing spaces included);
// `en.test.ts` locks them. Declared without `as const`, so `typeof en` widens every leaf to `string`.
// Placeholders: {year} {n} {title} {status} {name} {domain}.
// Phase 5a: values from docs/content/magneto-copy-en.md (line refs in docs/reports/phase-5a-…md).
export const en = {
  common: {
    bookStrategyCall: 'Book a Free Strategy Call',
    goHome: 'Go Home',
    checkIconAlt: 'Check icon',
    loading: 'Loading...',
    close: 'Close',
    privacyPolicy: 'Privacy Policy',
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
    errorTitle: 'Packages',
    errorBody: "Sorry, we couldn't load the packages right now. Please try again later.",
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
    // 5d-lite §8 (spec docs/specs/phase-5d-lite-contact-modal.md): verbatim from docs/content/magneto-copy-en.md (637fba7).
    // Option labels for the stable codes in src/utils/inquiry.ts.
    requiredNote: 'Fields marked * are required.',
    nameLabel: 'Name',
    emailLabel: 'Email',
    websiteLabel: 'Your website (if you have one)',
    websiteHelp: 'Optional if you do not have a website yet.',
    needLabel: 'What do you need help with?',
    needOptions: {
      newSite: 'A new website or rebuild',
      fixImprove: 'Fix or improve my current website',
      care: 'Ongoing website care',
      notSure: 'Not sure yet',
    },
    messageLabel: 'What is happening with your website, and what would you like to improve?',
    messageHelp: 'A few sentences is enough.',
    budgetLabel: 'Approximate budget',
    budgetOptions: {
      under1000: 'Under C$1,000',
      from1000to3500: 'Around C$1,000–3,500',
      from3500to8000: 'Around C$3,500–8,000',
      over8000: 'More than C$8,000',
      notSure: 'Not sure yet',
    },
    budgetHelp: 'A rough range is enough. It helps me suggest a realistic next step and does not create a quote. Choose Not sure yet if you are asking about ongoing care.',
    selectPlaceholder: 'Select an option',
    submit: 'Send project details',
    privacyText: 'I’ll use the information you provide to review and respond to your project inquiry. Sending this form does not subscribe you to marketing emails.',
    successTitle: 'Thank you. Your project details were sent.',
    successBody: 'I’ll review them and reply by email with a recommended next step.',
    errors: {
      nameRequired: 'Please enter your name.',
      emailInvalid: 'Please enter a valid email address.',
      needRequired: 'Please choose what you need help with.',
      messageRequired: 'Please tell me a little about your website or project.',
      budgetRequired: 'Please choose an approximate budget, or Not sure yet.',
      sendFailed: 'Something went wrong and your message was not sent. Please try again, or book a free strategy call instead.',
      // Derived (rev 3, A6): the booking phrase inside sendFailed, rendered as a button. Must be a substring of it.
      sendFailedCta: 'book a free strategy call',
    },
  },
  contactPage: {
    preferToTalk: 'Prefer to talk?',
    supporting: {
      reply: 'I read every inquiry personally and reply by email with a recommended next step.',
      languages: 'You can write in English, French or Spanish.',
      notAQuote: 'This is not a quote or an automatic sales call.',
    },
  },
  emailModal: {
    errors: {
      emailInvalid: 'Please enter a valid email',
      subscribeFailed: 'Failed to subscribe ({status})',
      unknown: 'Subscription failed',
    },
    downloadTitle: 'Grab your free guide',
    downloadReady: 'Thanks — your guide is ready for you.',
    downloadBody: 'Enter your name and email, so we can send marketing ideas and tips.',
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
  },
  // 5d-lite §5.1 / §8.1: booking dialog (variant B), verbatim from export 637fba7 (EN 751/756/762/763/765/958).
  // Heading = common.bookStrategyCall; website/need labels and options = contactForm.*.
  bookingModal: {
    body: 'Answer three short questions so we can focus the conversation on your website. Then choose a time for a free 30-minute call.',
    websiteHelp: 'optional',
    problemLabel: 'What is the main website problem or goal?',
    problemHelp: 'One or two sentences is enough.',
    continue: 'Continue to scheduling',
    // B2 (D-1): true only once V1 + V2 confirm the answers reach Calendly (spec §5.3, AC-13).
    privacyText:
      'Your answers are passed to Calendly with your booking to prepare for the call. Calendly will ask for your name and email to schedule it. Booking a call does not subscribe you to marketing emails.',
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
      fallbackDescription: 'Magneto builds, fixes and maintains websites for Montreal service businesses. Strategy, UX/UI and development with direct founder involvement, in English, French and Spanish.',
    },
    home: {
      title: 'Website Design & Development in Montreal | Magneto',
      description: 'Magneto builds, fixes and maintains websites for Montreal service businesses. Strategy, UX/UI and development with direct founder involvement, in English, French and Spanish.',
    },
    services: {
      title: 'Website Services in Montreal | Build, Fix & Care | Magneto',
      description: 'Website design, development, optimization and ongoing care for Montreal service businesses. BUILD, FIX and CARE with direct founder involvement.',
    },
    packages: {
      title: 'Website Design Pricing in Montreal | Magneto',
      description: 'Website pricing for Montreal service businesses. Landing pages from C$3,500, full websites typically C$5,000–8,000. Fixes start at C$1,000; care starts at C$200/month.',
    },
    projects: {
      title: 'Web Design Projects in Montreal | Magneto',
      description: 'Selected website projects by Magneto Web Consulting in Montreal: web experiences for wellness, professional services and digital commerce.',
    },
    about: {
      title: 'About Magneto | Montreal Web Consulting',
      description: 'Meet Mauricio Bayuelo, founder of Magneto Web Consulting in Montreal. Web strategy, UX/UI and development for service businesses in English, French and Spanish.',
    },
    contact: {
      title: 'Contact Magneto | Website Projects in Montreal',
      description: 'Contact Magneto Web Consulting in Montreal. Tell me what you need built, fixed or maintained and get a clear next step, in English, French or Spanish.',
    },
    project: {
      title: '{title} | Magneto Projects',
    },
    // Case-study pages by slug (5b §6): see CASE_STUDY_KEYS in src/utils/page-metadata.ts.
    caseStudies: {
      dangel: {
        title: 'Dangel Wellness — Trilingual Website | Magneto',
        description: 'A French, English and Spanish website for a Montreal wellness professional: clear service information, booking and contact paths, and owner-editable content.',
      },
      trepied: {
        title: 'Trépied — Video Studio Website | Magneto',
        description: 'A trilingual website for a Montreal video production studio, built to present its services and productions and lead clients to a call or quote request.',
      },
      shamanicca: {
        title: 'Shamanicca — Online Shop & Blog (Own Project) | Magneto',
        description: "Magneto's own project: an online shop and blog in one website, with one search across products and articles and a newsletter signup.",
      },
    },
  },
};
