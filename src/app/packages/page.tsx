import React from 'react';
import HeroLoader from '@/components/organisms/Hero/HeroLoader';
import { PackagesGrid } from '@/components/organisms';
import { PackageCardProps } from '@/components/molecules/PackageCard';

const packagesData: PackageCardProps[] = [
  {
    title: "Starter",
    price: "$2,000 – $4,000",
    currency: "CAD",
    description: "For solo entrepreneurs & small businesses taking their first digital leap.",
    icon: "/assets/images/ico-services-web-dev.svg",
    features: [
      { text: "5-page responsive website (WordPress or custom stack)" },
      { text: "Basic SEO setup (metadata, speed, mobile optimization)" },
      { text: "1 high-converting lead magnet funnel (email opt-in + thank you page)" },
      { text: "Email marketing tool integration (Mailchimp)" },
      { text: "Contact form + Google Analytics setup" }
    ],
    variant: "default"
  },
  {
    title: "Pro",
    price: "$4,000 – $7,000",
    currency: "CAD",
    description: "For coaches, creators, and service pros building thought leadership and passive income.",
    icon: "/assets/images/ico-services-sales-funnel.svg",
    features: [
      { text: "Complete Sales Funnel (Lead Magnet → Tripwire → Core Offer)" },
      { text: "Branded Blog Setup + Content Strategy Guide" },
      { text: "1 Email Nurture Campaign (drip sequence)" },
      { text: "Infographics + branded visual assets (for content marketing)" },
      { text: "Google Search Console + SEO tools integration" }
    ],
    isPopular: true,
    variant: "popular"
  },
  {
    title: "Ecom Premium",
    price: "$6,000 – $12,000",
    currency: "CAD",
    description: "For e-commerce businesses ready to scale with automation and digital ads.",
    icon: "/assets/images/ico-services-seo.svg",
    features: [
      { text: "Customized eCommerce platform options (WooCommerce)" },
      { text: "SEO optimization for 21 products to enhance visibility" },
      { text: "Automated email workflows (including cart abandonment, welcome series, and order confirmations)" },
      { text: "Configuration for Google and Meta advertising campaigns" },
      { text: "Detailed analytics dashboards with monthly performance reports" },
      { text: "Ecom Premium Pack" }
    ],
    variant: "default"
  },
  {
    title: "Custom Bundle",
    price: "From $7,000",
    currency: "CAD",
    description: "For premium creators, educators, or visionaries launching a brand or ecosystem.",
    icon: "/assets/images/ico-services-branding.svg",
    features: [
      { text: "Custom Sales Funnels, UX/UI design, Brand Identity" },
      { text: "Web App, Community Space, or LMS setup (optional)" },
      { text: "Full-stack Dev (Next.js, JAMstack, WordPress, etc.)" },
      { text: "Strategy workshops + roadmap session" },
      { text: "Ongoing maintenance or growth plan available" }
    ],
    variant: "default"
  }
];

export default function PackagesPage() {
  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="packages" variant="packages" />
      
      <div className="main typo-center" id='packages'>
        <h3 className="typo-3xl-bold m-0">
          All packages are customizable. Multilingual support available.<br />
          Payment plans upon request.
        </h3>
      </div>
      <div className="main">
        <PackagesGrid packages={packagesData} />
      </div>
    </>
  );
}