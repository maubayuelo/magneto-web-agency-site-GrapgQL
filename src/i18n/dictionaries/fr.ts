// FR UI microcopy. Placeholder values (Decision B): "[FR TODO] " + the EN value, until Mauricio writes the
// real copy. The build refuses to enable this locale while any marker remains (assertLocalesReady, spec §2.1a).
import type { Dictionary } from '../dictionary';

export const fr: Dictionary = {
  common: {
    bookStrategyCall: 'Réserver un appel-conseil gratuit',
    goHome: '[FR TODO] Go Home',
    checkIconAlt: '[FR TODO] Check icon',
    loading: '[FR TODO] Loading...',
    close: '[FR TODO] Close',
    privacyPolicy: 'Politique de confidentialité',
  },
  nav: {
    about: 'À propos',
    services: 'Services',
    packages: 'Forfaits',
    projects: 'Réalisations',
    contact: 'Contact',
  },
  header: {
    logoAlt: '[FR TODO] Logo',
    scheduleCall: 'Réserver un appel-conseil',
    menuOpen: '[FR TODO] Menu',
    menuClose: '[FR TODO] Close',
    languageSwitcher: '[FR TODO] Language',
  },
  home: {
    recentProjects: 'Réalisations web',
    projectsIntro: 'Des expériences web pour le bien-être, les services professionnels et le commerce en ligne, adaptées aux besoins de chaque entreprise.',
  },
  services: {
    errorTitle: '[FR TODO] Services',
    errorBody: '[FR TODO] Sorry, we couldn\'t load the services right now. Please try again later.',
    featuredBadge: '[FR TODO] Featured Service',
  },
  about: {
    linkedinIconAlt: '[FR TODO] LinkedIn Icon',
  },
  footer: {
    copyright: 'Magneto Web Consulting © {year}',
    linkedin: 'Mauricio Bayuelo sur LinkedIn',
  },
  testimonials: {
    title: '[FR TODO] Client feedback',
  },
  featuredServices: {
    explore: 'Découvrir {name}',
  },
  projects: {
    emptyTitle: '[FR TODO] Everything unfolds in its sacred time.',
    emptySubtitle: '[FR TODO] We’re planting and cultivating new digital projects with wonderful clients.',
    emptyQuestion: '[FR TODO] Do you have a project in mind?',
  },
  projectDetail: {
    challenges: 'Défis',
    solutions: 'Solutions',
    results: 'Livrables',
    viewLiveSite: 'Voir {domain}',
    backToProjects: '[FR TODO] ← Back to Projects',
  },
  packages: {
    popularBadge: '[FR TODO] Popular',
    included: '[FR TODO] What\'s included:',
    errorTitle: '[FR TODO] Packages',
    errorBody: '[FR TODO] Sorry, we couldn\'t load the packages right now. Please try again later.',
  },
  calendly: {
    closeDialog: '[FR TODO] Close scheduling dialog',
    frameTitle: '[FR TODO] Calendly scheduling',
  },
  forms: {
    namePlaceholder: '[FR TODO] Your name',
    emailPlaceholder: '[FR TODO] you@company.com',
  },
  contactForm: {
    requiredNote: "Les champs marqués d'un * sont obligatoires.",
    nameLabel: 'Nom',
    emailLabel: 'Courriel',
    websiteLabel: 'Votre site web (si vous en avez un)',
    websiteHelp: 'Facultatif.',
    needLabel: 'De quoi avez-vous besoin?',
    needOptions: {
      newSite: 'Un nouveau site web ou une refonte',
      fixImprove: 'Corriger ou améliorer mon site actuel',
      care: 'Un entretien continu de mon site web',
      notSure: 'Je ne sais pas encore',
    },
    messageLabel: 'Que se passe-t-il avec votre site web et que souhaitez-vous améliorer?',
    messageHelp: 'Quelques phrases suffisent.',
    budgetLabel: 'Budget approximatif',
    budgetOptions: {
      under1000: 'Moins de 1 000 $ CA',
      from1000to3500: 'Environ 1 000 à 3 500 $ CA',
      from3500to8000: 'Environ 3 500 à 8 000 $ CA',
      over8000: 'Plus de 8 000 $ CA',
      notSure: 'Je ne sais pas encore',
    },
    budgetHelp: "Une fourchette suffit. Elle m'aide à vous proposer une prochaine étape réaliste et ne constitue pas une soumission. Si votre demande concerne l'entretien continu de votre site, choisissez « Je ne sais pas encore ».",
    selectPlaceholder: 'Choisissez une option',
    submit: 'Envoyer les détails de mon projet',
    privacyText: "J'utiliserai les renseignements fournis pour examiner votre demande de projet et y répondre. L'envoi du formulaire ne vous abonne pas aux courriels promotionnels.",
    successTitle: 'Merci. Les détails de votre projet ont bien été envoyés.',
    successBody: 'Je les examinerai et vous répondrai par courriel en vous recommandant une prochaine étape.',
    errors: {
      nameRequired: 'Veuillez indiquer votre nom.',
      emailInvalid: 'Veuillez entrer une adresse courriel valide.',
      needRequired: 'Veuillez indiquer de quoi vous avez besoin.',
      messageRequired: 'Décrivez brièvement votre site web ou votre projet.',
      budgetRequired: 'Veuillez choisir un budget approximatif, ou « Je ne sais pas encore ».',
      sendFailed: "Une erreur est survenue et votre message n'a pas été envoyé. Veuillez réessayer ou réserver un appel-conseil gratuit.",
      sendFailedCta: 'réserver un appel-conseil gratuit',
    },
  },
  contactPage: {
    preferToTalk: 'Vous préférez en discuter?',
    supporting: {
      reply: "Je lis personnellement chaque demande et j'y réponds par courriel en recommandant une prochaine étape.",
      languages: "Vous pouvez m'écrire en français, en anglais ou en espagnol.",
      notAQuote: "Ce n'est ni une soumission ni un appel commercial automatique.",
    },
  },
  emailModal: {
    errors: {
      emailInvalid: '[FR TODO] Please enter a valid email',
      subscribeFailed: '[FR TODO] Failed to subscribe ({status})',
      unknown: '[FR TODO] Subscription failed',
    },
    downloadTitle: '[FR TODO] Grab your free guide',
    downloadReady: '[FR TODO] Thanks — your guide is ready for you.',
    downloadBody: '[FR TODO] Enter your name and email, so we can send marketing ideas and tips.',
    checking: '[FR TODO] Checking...',
    download: '[FR TODO] Download the free guide',
    openInNewTab: '[FR TODO] Open guide in new tab',
    downloadUnavailable: '[FR TODO] Download unavailable',
    preparing: '[FR TODO] Preparing download...',
    pdfNotFound: '[FR TODO] Sorry — we couldn\'t find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co',
    botChallenge: '[FR TODO] The file appears to be protected by the host (bot challenge). Click "Open guide in new tab" to let your browser complete the challenge and download the file.',
    nameLabel: '[FR TODO] Name',
    emailLabel: '[FR TODO] Email',
    submitting: '[FR TODO] Submitting...',
    continueDownload: '[FR TODO] Continue to Download the Guide',
  },
  // 5d-lite §5.1 / §8.1: booking dialog (variant B), verbatim from export ffec355 (FR 877/883/894/898/900/910).
  // Heading = common.bookStrategyCall; website/need labels and options = contactForm.*.
  bookingModal: {
    body: 'Répondez à trois courtes questions pour préparer notre échange sur votre site web. Choisissez ensuite une plage horaire pour un appel gratuit de 30 minutes.',
    websiteHelp: 'Facultatif.',
    problemLabel: 'Quel est le principal problème ou objectif de votre site web?',
    problemHelp: 'Une ou deux phrases suffisent.',
    continue: 'Continuer vers la réservation',
    // B2 (D-1): true only once V1 + V2 confirm the answers reach Calendly (spec §5.3, AC-13).
    privacyText:
      'Vos réponses sont transmises à Calendly avec votre réservation afin de préparer l\'appel. Calendly vous demandera votre nom et votre adresse courriel pour effectuer la réservation. Réserver un appel ne vous abonne pas aux courriels promotionnels.',
  },
  notFound: {
    metaTitle: '[FR TODO] 404: This page could not be found.',
    heading: '[FR TODO] 404',
    body: '[FR TODO] This page could not be found.',
  },
  projectNotFound: {
    metaTitle: '[FR TODO] Project Not Found',
    heading: '[FR TODO] Project Not Found',
    body: '[FR TODO] The project you\'re looking for doesn\'t exist or may have been moved.',
    viewAll: '[FR TODO] View All Projects',
  },
  cmsFallback: {
    leadMagnet: {
      overTitle: '[FR TODO] Not ready to book a call?',
      title: '[FR TODO] Download our free guide:',
      subtitle: '[FR TODO] 5 Mistakes That Kill Funnel Conversions',
    },
    requestQuote: '[FR TODO] Request Free Quote',
    finalCta: {
      bgAlt: '[FR TODO] Background',
      title: 'Commençons par en parler.',
      subtitle: 'Expliquez ce qui fonctionne et ce qui ne fonctionne pas sur votre site web. Magneto vous aidera à déterminer si la prochaine étape la plus sensée est un nouveau site, une correction ciblée, un entretien continu — ou aucune intervention majeure pour le moment.',
    },
    heroImageAlt: '[FR TODO] Hero Image',
    socialIconAlt: '[FR TODO] Social Icon',
    galleryImageAlt: '[FR TODO] Gallery image {n}',
  },
  meta: {
    site: {
      fallbackTitle: 'Magneto Web Consulting',
      fallbackDescription: 'Magneto conçoit, améliore et entretient des sites web pour les entreprises de services à Montréal. Stratégie, UX/UI et développement avec son fondateur, en français, en anglais et en espagnol.',
    },
    home: {
      title: 'Conception et développement de sites web à Montréal | Magneto',
      description: 'Magneto conçoit, améliore et entretient des sites web pour les entreprises de services à Montréal. Stratégie, UX/UI et développement avec son fondateur, en français, en anglais et en espagnol.',
    },
    services: {
      title: 'Services web à Montréal | BUILD, FIX et CARE | Magneto',
      description: "Conception, développement, optimisation et entretien de sites web pour les entreprises de services à Montréal. BUILD, FIX et CARE avec l'implication directe du fondateur.",
    },
    packages: {
      title: 'Tarifs de création de sites web à Montréal | Magneto',
      description: 'Tarifs de sites web pour les entreprises de services à Montréal : pages de destination dès 3 500 $ CA, sites complets généralement de 5 000 à 8 000 $ CA, FIX dès 1 000 $ CA et CARE dès 200 $ CA/mois.',
    },
    projects: {
      title: 'Réalisations web à Montréal | Magneto',
      description: 'Réalisations web de Magneto Web Consulting à Montréal : des expériences web pour le bien-être, les services professionnels et le commerce en ligne.',
    },
    about: {
      title: 'À propos de Magneto | Consultation web à Montréal',
      description: 'Découvrez Mauricio Bayuelo, fondateur de Magneto à Montréal : stratégie web, UX/UI et développement pour les entreprises de services, en français, en anglais et en espagnol.',
    },
    contact: {
      title: 'Contacter Magneto | Projets web à Montréal',
      description: "Contactez Magneto Web Consulting à Montréal. Présentez votre projet de création, d'amélioration ou d'entretien de site web et découvrez la prochaine étape, en français, en anglais ou en espagnol.",
    },
    project: {
      title: '[FR TODO] {title} | Magneto Projects',
    },
    // Case-study pages by slug (5b §6): see CASE_STUDY_KEYS in src/utils/page-metadata.ts.
    caseStudies: {
      dangel: {
        title: 'Dangel Wellness — Site web trilingue | Magneto',
        description: 'Un site web en français, en anglais et en espagnol pour un professionnel du bien-être à Montréal : services clairs, réservation, contact et contenu modifiable par le propriétaire.',
      },
      trepied: {
        title: 'Trépied — Site web de studio vidéo | Magneto',
        description: 'Un site web trilingue pour un studio de production vidéo montréalais, conçu pour présenter ses services et ses productions et orienter les clients vers un appel ou une demande de soumission.',
      },
      shamanicca: {
        title: 'Shamanicca — Boutique en ligne et blogue (projet de Magneto) | Magneto',
        description: "Projet de Magneto, et non un projet client : une boutique en ligne et un blogue réunis dans un même site, avec une recherche commune aux produits et aux articles et une inscription à l'infolettre.",
      },
    },
  },
};
