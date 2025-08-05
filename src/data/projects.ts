export interface ProjectData {
  id: number;
  slug: string;
  title: string;
  tagText?: string;
  description: string;
  image: string;
  gallery?: string[];
  client?: string;
  category?: string;
  year?: string;
  duration?: string;
  technologies?: string[];
  challenges?: string[];
  solutions?: string[];
  results?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

export const projectsData: ProjectData[] = [
  {
    id: 1,
    slug: "shamanicca-ecommerce",
    title: "Shamanicca's Ecommerce",
    tagText: "Mystical Commerce & Spiritual E-commerce Platform - Connecting Ancient Wisdom with Modern Technology",
    description: "Comprehensive design UX-UI and full-stack development of an immersive ecommerce platform and content-rich blog dedicated to mysticism, wicca, tarot, crystal healing, and spiritual wellness subjects. The project focused on creating an authentic mystical experience that drives organic traffic from social media platforms like Instagram, TikTok, and Pinterest, while implementing a sophisticated affiliate marketing system through engaging blog articles, product reviews, and spiritual guidance content to maximize revenue generation.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "Shamanicca",
    category: "E-commerce & Blog",
    year: "2024",
    duration: "10 weeks",
    technologies: ["WordPress", "WooCommerce", "PHP", "SCSS", "Figma"],
    challenges: [
      "Creating an authentic mystical brand experience",
      "Integrating blog content with product sales",
      "Building trust in spiritual product market"
    ],
    solutions: [
      "Developed immersive mystical design language",
      "Created seamless blog-to-shop user journey",
      "Implemented affiliate marketing system"
    ],
    results: [
      "300% increase in social media traffic",
      "150% growth in affiliate commission revenue",
      "4.7/5 customer satisfaction rating"
    ],
    testimonial: {
      quote: "Magneto perfectly captured the essence of our mystical brand and created a platform that truly resonates with our spiritual community.",
      author: "Luna Shamanicca",
      role: "Founder, Shamanicca"
    }
  },
  {
    id: 2,
    slug: "mezcal-la-charenita-biopage",
    title: "Mezcal La Chareñita BioPage",
    tagText: "Artisan Spirits Digital Presence - Premium Mezcal Brand Instagram Bio Page & E-commerce Integration",
    description: "Strategic design UX-UI and development of a compelling Instagram bio page for an authentic mezcal company, seamlessly integrated with comprehensive product listings, direct e-commerce platform connections, detailed product descriptions highlighting traditional craftsmanship, and strategic call-to-action elements designed to facilitate distributor contact and partnership opportunities. The project emphasized showcasing the artisanal heritage and premium quality of traditional mezcal production while creating clear pathways for business growth and market expansion.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "Mezcal La Chareñita",
    category: "Bio Page",
    year: "2024",
    duration: "4 weeks",
    technologies: ["HTML5", "CSS3", "JavaScript", "Linktree API"],
    challenges: [
      "Maximizing impact in limited bio page space",
      "Showcasing premium mezcal heritage authentically",
      "Creating clear distributor contact flow"
    ],
    solutions: [
      "Designed elegant single-page showcase",
      "Integrated direct e-commerce connections",
      "Streamlined distributor inquiry system"
    ],
    results: [
      "200% increase in Instagram profile clicks",
      "180% growth in distributor inquiries",
      "85% improvement in product page visits"
    ],
    testimonial: {
      quote: "Our Instagram bio page now perfectly represents our premium mezcal brand and has significantly increased our distributor network.",
      author: "Carlos Mendoza",
      role: "Owner, Mezcal La Chareñita"
    }
  },
  {
    id: 3,
    slug: "drone-ami-landing",
    title: "Drone Ami",
    tagText: "Advanced Technology Innovation - Cutting-Edge Drone Solutions & Aerial Technology Landing Page",
    description: "Comprehensive design UX-UI and full development of a high-converting landing page for an innovative drone technology company, strategically crafted to integrate seamlessly with sophisticated sales funnel strategies and lead generation systems. The project focused on showcasing advanced drone capabilities, applications across industries, and technical specifications while maintaining user-friendly navigation and compelling call-to-action elements designed to capture qualified customer leads and drive business growth in the competitive drone technology market.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "Drone Ami",
    category: "Landing Page",
    year: "2024",
    duration: "6 weeks",
    technologies: ["Next.js", "TypeScript", "SCSS", "Figma"],
    challenges: [
      "Communicating complex drone technology simply",
      "Building trust in emerging tech market",
      "Creating high-converting lead capture system"
    ],
    solutions: [
      "Developed interactive drone showcase",
      "Created compelling use-case demonstrations",
      "Implemented multi-step lead qualification"
    ],
    results: [
      "250% increase in qualified leads",
      "65% improvement in conversion rate",
      "95% client satisfaction score"
    ],
    testimonial: {
      quote: "The landing page has transformed how we present our drone technology. Lead quality and quantity have exceeded all expectations.",
      author: "Miguel Rodriguez",
      role: "CEO, Drone Ami"
    }
  },
  {
    id: 4,
    slug: "luxx-miami-rentals",
    title: "LUXX Miami Rentals",
    tagText: "Ultra-Luxury Lifestyle Experiences - Premium Rental Services for Elite Cars, Villas, Yachts & Jets",
    description: "Sophisticated design UX-UI and development of an exclusive landing page for a premier luxury goods rental company specializing in high-end automobiles, stunning private villas, luxury yachts, and private jets in Miami. The project was strategically designed to integrate with comprehensive sales funnel systems and advanced lead generation strategies, targeting affluent clientele seeking extraordinary experiences. The platform emphasizes exclusivity, premium service, and seamless booking processes to capture qualified luxury rental inquiries and drive revenue growth.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "LUXX Miami Rentals",
    category: "Landing Page",
    year: "2024",
    duration: "8 weeks",
    technologies: ["React", "TypeScript", "SCSS", "Adobe XD"],
    challenges: [
      "Conveying ultra-luxury experience digitally",
      "Managing diverse rental categories effectively",
      "Creating exclusive, high-end brand perception"
    ],
    solutions: [
      "Designed premium visual storytelling",
      "Created seamless category navigation",
      "Implemented VIP inquiry system"
    ],
    results: [
      "400% increase in luxury rental inquiries",
      "150% growth in average booking value",
      "98% client retention rate"
    ],
    testimonial: {
      quote: "LUXX Miami Rentals now has a digital presence that matches our premium offerings. The results speak for themselves.",
      author: "Alexandra Vasquez",
      role: "Operations Director, LUXX Miami Rentals"
    }
  },
  {
    id: 5,
    slug: "house-renovations-company",
    title: "House Renovations Company",
    tagText: "Home Transformation Excellence - Professional Renovation Services & Construction Project Management",
    description: "Professional design UX-UI and comprehensive development of a conversion-focused landing page for a premier house renovation company specializing in residential transformations, kitchen remodeling, bathroom upgrades, and complete home makeovers. The project was strategically designed to integrate with proven sales funnel methodologies and lead generation systems, showcasing before-and-after portfolios, construction expertise, and project management capabilities to capture qualified homeowner leads and convert visitors into renovation consultation appointments.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "Premier Home Renovations",
    category: "Landing Page",
    year: "2024",
    duration: "6 weeks",
    technologies: ["WordPress", "Elementor", "CSS3", "PHP"],
    challenges: [
      "Showcasing renovation quality and craftsmanship",
      "Building trust for high-investment decisions",
      "Creating clear project estimation flow"
    ],
    solutions: [
      "Developed before/after portfolio showcase",
      "Created detailed service breakdown",
      "Implemented quote request system"
    ],
    results: [
      "300% increase in renovation consultations",
      "220% growth in project estimates requested",
      "92% lead-to-customer conversion rate"
    ],
    testimonial: {
      quote: "Our new landing page has revolutionized how we attract and convert homeowners. The quality of leads is outstanding.",
      author: "James Patterson",
      role: "Owner, Premier Home Renovations"
    }
  },
  {
    id: 6,
    slug: "zaida-fashion-ecommerce",
    title: "Zaida Fashion Ecommerce",
    tagText: "Contemporary Casual Fashion - Social Media Driven E-commerce Platform & Content Marketing Strategy",
    description: "Dynamic design UX-UI and full-scale development of a trendy ecommerce platform and engaging blog specifically tailored for a contemporary casual fashion brand targeting young, style-conscious consumers. The project emphasized creating a social media-first shopping experience designed to effectively drive traffic from Instagram, TikTok, Pinterest, and Facebook while implementing sophisticated marketing funnels, influencer collaboration features, and content marketing strategies to maximize conversion rates and build a loyal fashion community around the brand's aesthetic and values.",
    image: "https://placehold.co/800x600",
    gallery: [
      "https://placehold.co/800x600",
      "https://placehold.co/800x600",
      "https://placehold.co/800x600"
    ],
    client: "Zaida Fashion",
    category: "E-commerce & Blog",
    year: "2024",
    duration: "12 weeks",
    technologies: ["Shopify", "Liquid", "JavaScript", "SCSS", "Figma"],
    challenges: [
      "Standing out in competitive fashion market",
      "Integrating social media traffic effectively",
      "Creating engaging content marketing strategy"
    ],
    solutions: [
      "Developed social-first shopping experience",
      "Created influencer-friendly product pages",
      "Implemented content-driven sales funnels"
    ],
    results: [
      "500% increase in social media conversions",
      "280% growth in blog-driven sales",
      "4.6/5 customer satisfaction rating"
    ],
    testimonial: {
      quote: "Zaida Fashion's new platform perfectly captures our casual, trendy vibe while driving incredible results from our social media efforts.",
      author: "Zaida Martinez",
      role: "Founder, Zaida Fashion"
    }
  }
];
