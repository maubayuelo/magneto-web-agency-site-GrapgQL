import Image from 'next/image';
import { IconComponent } from '../../components/atoms';

// Service data structure
interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string; // Icon image path
  iconType?: string; // For future icon implementation
}

// Services data
const services: Service[] = [
  {
    id: 'sales-funnel',
    title: 'Sales Funnel Development',
    description: 'We craft funnels that convert — from lead magnet to upsell. Includes funnel strategy, user journey mapping, wireframes, conversion copy, A/B testing, and email/CRM integrations using tools like Mailchimp or ActiveCampaign.',
    icon: '/assets/images/ico-services-sales-funnel.svg',
    image: '/assets/images/services-sales-funnel.png',
  },
  {
    id: 'web-development',
    title: 'Website & E-Commerce Development',
    description: 'Tailored websites and shops built on WordPress, Shopify, or JAMstack. Whether you\'re launching a coaching brand or selling products, your site will be mobile-optimized, SEO-enhanced, and analytics-ready.',
    icon: '/assets/images/ico-services-web-dev.svg',
    image: '/assets/images/services-web-dev.png',
  },
  {
    id: 'seo-marketing',
    title: 'SEO & Performance Marketing',
    description: 'Improve your search visibility with on-page SEO, technical audits, local SEO setups, and schema integration. Pair that with Google and Meta Ads campaign management to drive targeted traffic.',
    icon: '/assets/images/ico-services-seo.svg',
    image: '/assets/images/services-seo.png',
  },
  {
    id: 'ux-ui-design',
    title: 'UX/UI Design & Prototyping',
    description: 'Beautiful layouts start with smart wireframes. Using Figma, we design responsive, conversion-focused interfaces backed by user flow insights and mobile-first strategy.',
    icon: '/assets/images/ico-services-uxui.svg',
    image: '/assets/images/services-uxui.png',
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing & Automation',
    description: 'Build relationships on autopilot. From newsletter templates to full drip sequences, we design and automate email systems that engage and convert your audience.',
    icon: '/assets/images/ico-services-email.svg',
    image: '/assets/images/services-email.png',
  },
  {
    id: 'branding',
    title: 'Branding & Visual Identity',
    description: 'Develop a cohesive and memorable brand look. Logo design, typography, color palette, social templates, and iconography included — all optimized for digital-first presence.',
    icon: '/assets/images/ico-services-branding.svg',
    image: '/assets/images/services-branding.png',
  },
  {
    id: 'content-strategy',
    title: 'Content Strategy & Creation',
    description: 'From blog posts to Instagram visuals and infographics, we plan and create content that supports your funnel and builds your brand. Includes asset planning, formatting, and repurposing strategies.',
    icon: '/assets/images/ico-services-content.svg',
    image: '/assets/images/services-content.png',
  },
];

// Service Item Component
interface ServiceItemProps {
  service: Service;
  variant: 'left' | 'right';
}

function ServiceItem({ service, variant }: ServiceItemProps) {
  const isRight = variant === 'right';
  
  return (
    <div className={`service-item ${isRight ? 'service-item--reverse' : ''} pb-md-responsive`}>
      <div className="service-image-wrapper">
        <Image
          src={service.image}
          alt={service.title}
          width={675}
          height={675}
          className="service-image"
          priority={false}
        />
      </div>
      <div className={`service-content ${isRight ? 'service-content--right' : ''}`}>
        <IconComponent 
          src={service.icon}
          alt={service.title}
          size="md"
          className=""
        />
        <h3 className={`typo-3xl-extrabold m-0 mb-15 ${isRight ? 'service-title--right' : ''}`}>
          {service.title}
        </h3>
        <p className={`typo-paragraph-medium m-0 ${isRight ? 'service-description--right' : ''}`}>
          {service.description}
        </p>
      </div>
    </div>
  );
}

// Main Services List Component
export default function ServicesList() {
  return (
    <div className="">
      {services.map((service, index) => (
        <ServiceItem
          key={service.id}
          service={service}
          variant={index % 2 === 0 ? 'left' : 'right'} // Pass 'left' or 'right' variant to alternate layout for each service
        />
      ))}
    </div>
  );
}
