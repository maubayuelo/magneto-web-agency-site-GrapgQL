// FR UI microcopy. Every value is approved copy (Q-D1 fill approved by Mauricio, 2026-11-09; sources per key in
// docs/reports/i18n-dictionary-fill.md). The build refuses to enable this locale if a "[FR TODO]" marker ever
// comes back (assertLocalesReady, spec §2.1a).
import type { Dictionary } from '../dictionary';

export const fr: Dictionary = {
  common: {
    bookStrategyCall: 'Réserver un appel-conseil gratuit',
    goHome: "Retour à l'accueil",
    loading: 'Chargement...',
    close: 'Fermer',
    privacyPolicy: 'Politique de confidentialité',
    skipToContent: 'Passer au contenu principal',
  },
  nav: {
    about: 'À propos',
    services: 'Services',
    packages: 'Forfaits',
    projects: 'Réalisations',
    contact: 'Contact',
  },
  header: {
    logoAlt: 'Magneto',
    scheduleCall: 'Réserver un appel-conseil',
    menuOpen: 'Menu',
    menuClose: 'Fermer',
    languageSwitcher: 'Langue',
    navLabel: 'Principal',
  },
  home: {
    recentProjects: 'Réalisations web',
    projectsIntro: 'Des expériences web pour le bien-être, les services professionnels et le commerce en ligne, adaptées aux besoins de chaque entreprise.',
  },
  services: {
    errorTitle: 'Services',
    errorBody: 'Impossible de charger les services pour le moment. Réessayez plus tard.',
    featuredBadge: 'Service en vedette',
  },
  about: {
    linkedinIconAlt: 'Icône LinkedIn',
  },
  footer: {
    copyright: 'Magneto Web Consulting © {year}',
    linkedin: 'Mauricio Bayuelo sur LinkedIn',
  },
  testimonials: {
    title: 'Témoignages de clients',
  },
  featuredServices: {
    explore: 'Découvrir {name}',
  },
  projects: {
    emptyTitle: 'Tout se déploie en son temps sacré.',
    emptySubtitle: 'Nous semons et cultivons de nouveaux projets numériques avec des clients formidables.',
    emptyQuestion: 'Vous avez un projet en tête?',
  },
  projectDetail: {
    challenges: 'Défis',
    solutions: 'Solutions',
    results: 'Livrables',
    viewLiveSite: 'Voir {domain}',
    backToProjects: '← Retour aux réalisations',
  },
  packages: {
    popularBadge: 'Populaire',
    included: 'Ce qui est inclus :',
    errorTitle: 'Forfaits',
    errorBody: 'Impossible de charger les forfaits pour le moment. Réessayez plus tard.',
  },
  calendly: {
    closeDialog: 'Fermer la fenêtre de réservation',
    frameTitle: 'Réservation Calendly',
  },
  forms: {
    namePlaceholder: 'Votre nom',
    emailPlaceholder: 'vous@entreprise.com',
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
      emailInvalid: 'Veuillez entrer une adresse courriel valide.',
      subscribeFailed: "Échec de l'inscription ({status})",
      unknown: "L'inscription a échoué",
    },
    downloadTitle: 'Obtenez votre guide gratuit',
    downloadReady: 'Merci — votre guide est prêt.',
    // Neutral on purpose (not a translation of EN): matches the approved privacy copy. True only after 5e (Brevo);
    // the current Mailchimp flow subscribes. Keep the lead magnet hidden until then.
    downloadBody: 'Entrez votre nom et votre adresse courriel pour recevoir le guide. Demander un guide ne vous abonne pas aux courriels promotionnels.',
    checking: 'Vérification...',
    download: 'Obtenir le guide gratuit',
    openInNewTab: 'Ouvrir le guide dans un nouvel onglet',
    downloadUnavailable: 'Téléchargement non disponible',
    preparing: 'Préparation du téléchargement...',
    pdfNotFound: "Désolé — nous n'avons pas trouvé le PDF sur le site source. Si le problème persiste, écrivez-nous à contact@magnetomarketing.co",
    botChallenge: "Le fichier semble protégé par l'hébergeur (vérification anti-robot). Cliquez sur « Ouvrir le guide dans un nouvel onglet » pour permettre à votre navigateur de terminer la vérification et de télécharger le fichier.",
    nameLabel: 'Nom',
    emailLabel: 'Courriel',
    submitting: 'Envoi en cours...',
    continueDownload: 'Continuer vers le téléchargement',
  },
  // 5d-lite §5.1 / §8.1: booking dialog (variant B), verbatim from export 637fba7 (FR 901/907/918/922/924/934).
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
    metaTitle: '404 : cette page est introuvable.',
    heading: '404',
    body: 'Cette page est introuvable.',
  },
  projectNotFound: {
    metaTitle: 'Réalisation introuvable',
    heading: 'Réalisation introuvable',
    body: "La réalisation que vous cherchez n'existe pas ou a peut-être été déplacée.",
    viewAll: 'Voir toutes les réalisations',
  },
  cmsFallback: {
    leadMagnet: {
      overTitle: 'Vous préférez attendre avant de réserver un appel?',
      title: 'Téléchargez notre guide gratuit :',
      subtitle: '5 erreurs qui nuisent aux conversions de votre tunnel de vente',
    },
    requestQuote: 'Demander une soumission gratuite',
    finalCta: {
      title: 'Commençons par en parler.',
      subtitle: 'Expliquez ce qui fonctionne et ce qui ne fonctionne pas sur votre site web. Magneto vous aidera à déterminer si la prochaine étape la plus sensée est un nouveau site, une correction ciblée, un entretien continu — ou aucune intervention majeure pour le moment.',
    },
    heroImageAlt: "Image d'en-tête",
    socialIconAlt: 'Icône de réseau social',
    galleryImageAlt: 'Image de la galerie {n}',
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
      // K1 (Q-D1, 2026-11-09): adds the kept term "Magneto Web Consulting", ≤ 160 chars. Differs from export FR 240.
      description: 'Mauricio Bayuelo, fondateur de Magneto Web Consulting à Montréal : stratégie web, UX/UI et développement pour entreprises de services, en trois langues.',
    },
    contact: {
      title: 'Contacter Magneto | Projets web à Montréal',
      description: "Contactez Magneto Web Consulting à Montréal. Présentez votre projet de création, d'amélioration ou d'entretien de site web et découvrez la prochaine étape, en français, en anglais ou en espagnol.",
    },
    // Privacy route (spec §4): magneto-copy-fr-CA.md:1061 / :1063 (637fba7).
    privacy: {
      title: 'Politique de confidentialité | Magneto Web Consulting',
      description: 'Découvrez comment Magneto Web Consulting recueille, utilise et protège les renseignements personnels transmis au moyen de son site web et comment joindre le responsable de leur protection.',
    },
    project: {
      title: '{title} | Réalisations Magneto',
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
