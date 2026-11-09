// ES UI microcopy. Every value is approved copy (Q-D1 fill approved by Mauricio, 2026-11-09; sources per key in
// docs/reports/i18n-dictionary-fill.md). The build refuses to enable this locale if a "[ES TODO]" marker ever
// comes back (assertLocalesReady, spec §2.1a).
import type { Dictionary } from '../dictionary';

export const es: Dictionary = {
  common: {
    bookStrategyCall: 'Agendar una llamada de orientación gratuita',
    goHome: 'Volver al inicio',
    checkIconAlt: 'Ícono de verificación',
    loading: 'Cargando...',
    close: 'Cerrar',
    privacyPolicy: 'Política de privacidad',
  },
  nav: {
    about: 'Sobre Magneto',
    services: 'Servicios',
    packages: 'Paquetes',
    projects: 'Proyectos',
    contact: 'Contacto',
  },
  header: {
    logoAlt: 'Logo',
    scheduleCall: 'Reservar consulta',
    menuOpen: 'Menú',
    menuClose: 'Cerrar',
    languageSwitcher: 'Idioma',
  },
  home: {
    recentProjects: 'Proyectos web destacados',
    projectsIntro: 'Experiencias web para el sector del bienestar, los servicios profesionales y el comercio digital, desarrolladas según las necesidades de cada negocio.',
  },
  services: {
    errorTitle: 'Servicios',
    errorBody: 'Lo sentimos, no pudimos cargar los servicios en este momento. Inténtalo de nuevo más tarde.',
    featuredBadge: 'Servicio destacado',
  },
  about: {
    linkedinIconAlt: 'Ícono de LinkedIn',
  },
  footer: {
    copyright: 'Magneto Web Consulting © {year}',
    linkedin: 'Mauricio Bayuelo en LinkedIn',
  },
  testimonials: {
    title: 'Opinión de clientes',
  },
  featuredServices: {
    explore: 'Conocer {name}',
  },
  projects: {
    emptyTitle: 'Todo se despliega en su tiempo sagrado.',
    emptySubtitle: 'Estamos sembrando y cultivando nuevos proyectos digitales con clientes maravillosos.',
    emptyQuestion: '¿Tienes un proyecto en mente?',
  },
  projectDetail: {
    challenges: 'Retos',
    solutions: 'Soluciones',
    results: 'Entregables',
    viewLiveSite: 'Ver {domain}',
    backToProjects: '← Volver a proyectos',
  },
  packages: {
    popularBadge: 'Popular',
    included: 'Qué incluye:',
    errorTitle: 'Paquetes',
    errorBody: 'Lo sentimos, no pudimos cargar los paquetes en este momento. Inténtalo de nuevo más tarde.',
  },
  calendly: {
    closeDialog: 'Cerrar la ventana de reserva',
    frameTitle: 'Reserva en Calendly',
  },
  forms: {
    namePlaceholder: 'Tu nombre',
    emailPlaceholder: 'tu@empresa.com',
  },
  contactForm: {
    requiredNote: 'Los campos marcados con * son obligatorios.',
    nameLabel: 'Nombre',
    emailLabel: 'Correo electrónico',
    websiteLabel: 'Tu sitio web (si tienes uno)',
    websiteHelp: 'Opcional.',
    needLabel: '¿Con qué necesitas ayuda?',
    needOptions: {
      newSite: 'Un sitio web nuevo o un rediseño',
      fixImprove: 'Corregir o mejorar mi sitio web actual',
      care: 'Mantenimiento continuo de mi sitio web',
      notSure: 'Todavía no lo sé',
    },
    messageLabel: '¿Qué está pasando con tu sitio web y qué te gustaría mejorar?',
    messageHelp: 'Basta con unas pocas frases.',
    budgetLabel: 'Presupuesto aproximado',
    budgetOptions: {
      under1000: 'Menos de 1 000 CAD',
      from1000to3500: 'Aproximadamente 1 000–3 500 CAD',
      from3500to8000: 'Aproximadamente 3 500–8 000 CAD',
      over8000: 'Más de 8 000 CAD',
      notSure: 'Todavía no lo sé',
    },
    budgetHelp: 'Un rango aproximado es suficiente. Me ayuda a recomendarte un siguiente paso realista y no constituye una cotización. Si estás consultando por mantenimiento continuo, elige « Todavía no lo sé ».',
    selectPlaceholder: 'Elige una opción',
    submit: 'Enviar los detalles de mi proyecto',
    privacyText: 'Usaré la información que compartas para revisar tu solicitud de proyecto y responderte. Enviar el formulario no te suscribe a correos promocionales.',
    successTitle: 'Gracias. Los detalles de tu proyecto se enviaron correctamente.',
    successBody: 'Los revisaré y te responderé por correo electrónico con una recomendación sobre el siguiente paso.',
    errors: {
      nameRequired: 'Escribe tu nombre.',
      emailInvalid: 'Escribe un correo electrónico válido.',
      needRequired: 'Elige con qué necesitas ayuda.',
      messageRequired: 'Cuéntame brevemente sobre tu sitio web o tu proyecto.',
      budgetRequired: 'Elige un presupuesto aproximado, o « Todavía no lo sé ».',
      sendFailed: 'Ocurrió un error y tu mensaje no se envió. Inténtalo de nuevo o agenda una llamada de orientación gratuita.',
      sendFailedCta: 'agenda una llamada de orientación gratuita',
    },
  },
  contactPage: {
    preferToTalk: '¿Prefieres conversar?',
    supporting: {
      reply: 'Leo personalmente cada solicitud y respondo por correo electrónico con una recomendación sobre el siguiente paso.',
      languages: 'Puedes escribirme en español, francés o inglés.',
      notAQuote: 'Esto no es una cotización ni da lugar a una llamada comercial automática.',
    },
  },
  emailModal: {
    errors: {
      emailInvalid: 'Escribe un correo electrónico válido.',
      subscribeFailed: 'Error en la suscripción ({status})',
      unknown: 'La suscripción falló',
    },
    downloadTitle: 'Obtén tu guía gratuita',
    downloadReady: 'Gracias, tu guía está lista.',
    // Neutral on purpose (not a translation of EN): matches the approved privacy copy. True only after 5e (Brevo);
    // the current Mailchimp flow subscribes. Keep the lead magnet hidden until then.
    downloadBody: 'Escribe tu nombre y tu correo electrónico para recibir la guía. Solicitar una guía no te suscribe a correos promocionales.',
    checking: 'Verificando...',
    download: 'Descargar la guía gratuita',
    openInNewTab: 'Abrir la guía en una pestaña nueva',
    downloadUnavailable: 'Descarga no disponible',
    preparing: 'Preparando la descarga...',
    pdfNotFound: 'Lo sentimos: no encontramos el PDF en el sitio de origen. Si esto sigue ocurriendo, escríbenos a contact@magnetomarketing.co',
    botChallenge: 'El archivo parece estar protegido por el servidor (verificación contra bots). Haz clic en "Abrir la guía en una pestaña nueva" para que tu navegador complete la verificación y descargue el archivo.',
    nameLabel: 'Nombre',
    emailLabel: 'Correo electrónico',
    submitting: 'Enviando...',
    continueDownload: 'Continuar con la descarga',
  },
  // 5d-lite §5.1 / §8.1: booking dialog (variant B), verbatim from export 637fba7 (ES 911/917/928/932/934/944).
  // Heading = common.bookStrategyCall; website/need labels and options = contactForm.*.
  bookingModal: {
    body: 'Responde tres preguntas breves para que podamos concentrarnos en tu sitio web durante la conversación. Después elige un horario para una llamada gratuita de 30 minutos.',
    websiteHelp: 'Opcional.',
    problemLabel: '¿Cuál es el principal problema u objetivo de tu sitio web?',
    problemHelp: 'Una o dos frases son suficientes.',
    continue: 'Continuar a la reserva',
    // B2 (D-1): true only once V1 + V2 confirm the answers reach Calendly (spec §5.3, AC-13).
    privacyText:
      'Tus respuestas se transmiten a Calendly junto con tu reserva para preparar la llamada. Calendly te pedirá tu nombre y correo electrónico para realizarla. Agendar una llamada no te suscribe a correos promocionales.',
  },
  notFound: {
    metaTitle: '404: no se encontró esta página.',
    heading: '404',
    body: 'No se encontró esta página.',
  },
  projectNotFound: {
    metaTitle: 'Proyecto no encontrado',
    heading: 'Proyecto no encontrado',
    body: 'El proyecto que buscas no existe o es posible que se haya movido.',
    viewAll: 'Ver todos los proyectos',
  },
  cmsFallback: {
    leadMagnet: {
      overTitle: '¿Todavía no quieres agendar una llamada?',
      title: 'Descarga nuestra guía gratuita:',
      subtitle: '5 errores que arruinan las conversiones de tu embudo de ventas',
    },
    requestQuote: 'Solicitar una cotización gratuita',
    finalCta: {
      bgAlt: 'Fondo',
      title: 'Empecemos con una conversación.',
      subtitle: 'Explica qué funciona y qué no en tu sitio web. Magneto te ayudará a determinar si lo más conveniente es crear un sitio nuevo, hacer correcciones específicas, optar por mantenimiento continuo o, por ahora, no realizar cambios importantes.',
    },
    heroImageAlt: 'Imagen principal',
    socialIconAlt: 'Ícono de red social',
    galleryImageAlt: 'Imagen de la galería {n}',
  },
  meta: {
    site: {
      fallbackTitle: 'Magneto Web Consulting',
      fallbackDescription: 'Magneto crea, mejora y mantiene sitios web para empresas de servicios en Montreal. Estrategia, UX/UI y desarrollo con atención directa del fundador, en español, francés e inglés.',
    },
    home: {
      title: 'Diseño y desarrollo web en Montreal | Magneto',
      description: 'Magneto crea, mejora y mantiene sitios web para empresas de servicios en Montreal. Estrategia, UX/UI y desarrollo con atención directa del fundador, en español, francés e inglés.',
    },
    services: {
      title: 'Servicios web en Montreal | BUILD, FIX y CARE | Magneto',
      description: 'Diseño, desarrollo, optimización y mantenimiento web para empresas de servicios en Montreal. BUILD, FIX y CARE con atención directa del fundador.',
    },
    packages: {
      title: 'Precios de diseño web en Montreal | Magneto',
      description: 'Precios web en Montreal: páginas de destino desde 3 500 CAD, sitios completos habitualmente entre 5 000 y 8 000 CAD, FIX desde 1 000 CAD y CARE desde 200 CAD al mes.',
    },
    projects: {
      title: 'Proyectos web en Montreal | Magneto',
      description: 'Proyectos web de Magneto Web Consulting en Montreal: experiencias web para el sector del bienestar, los servicios profesionales y el comercio digital.',
    },
    about: {
      title: 'Sobre Magneto | Consultoría web en Montreal',
      // K2 (Q-D1, 2026-11-09): adds the kept term "Magneto Web Consulting", ≤ 160 chars. Differs from export ES 246.
      description: 'Mauricio Bayuelo, fundador de Magneto Web Consulting en Montreal: estrategia web, diseño UX/UI y desarrollo para empresas de servicios, en tres idiomas.',
    },
    contact: {
      title: 'Contacta a Magneto | Proyectos web en Montreal',
      // K3 (Q-D1, 2026-11-09): adds the kept term "Magneto Web Consulting". Differs from export ES 852.
      description: 'Contacta a Magneto Web Consulting en Montreal. Cuéntame qué necesitas crear, corregir o mantener en tu sitio web. Atención en español, francés e inglés.',
    },
    project: {
      title: '{title} | Proyectos Magneto',
    },
    // Case-study pages by slug (5b §6): see CASE_STUDY_KEYS in src/utils/page-metadata.ts.
    caseStudies: {
      dangel: {
        title: 'Dangel Wellness — Sitio web trilingüe | Magneto',
        description: 'Sitio web en español, francés e inglés para un profesional del bienestar en Montreal: servicios claros, reservas, contacto y contenido editable.',
      },
      trepied: {
        title: 'Trépied — Sitio web para estudio de video | Magneto',
        description: 'Sitio web trilingüe para un estudio de producción de video en Montreal, diseñado para presentar sus servicios y producciones y facilitar una llamada o solicitud de cotización.',
      },
      shamanicca: {
        title: 'Shamanicca — Tienda y blog (proyecto propio) | Magneto',
        description: 'Proyecto propio de Magneto, no un trabajo realizado para un cliente: tienda en línea y blog en un mismo sitio web, con buscador de productos y artículos y suscripción al boletín informativo.',
      },
    },
  },
};
