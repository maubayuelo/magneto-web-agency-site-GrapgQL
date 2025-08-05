import React from 'react';
import ServiceCard from '../../molecules/ServiceCard';
import './FeaturedServices.scss';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const services: Service[] = [
  {
    id: 'sales-funnel',
    title: 'Sales Funnel Development',
    description: 'Funnels that guide your audience from click to conversion.',
    icon: 'sales-funnel'
  },
  {
    id: 'web-development',
    title: 'Website & E-Commerce Development',
    description: 'Fast, responsive websites built for revenue.',
    icon: 'web-development'
  },
  {
    id: 'seo-marketing',
    title: 'SEO & Performance Marketing',
    description: 'Get found. Get traffic. Get results.',
    icon: 'seo-marketing'
  },
  {
    id: 'ux-ui-design',
    title: 'UX/UI Design & Prototyping',
    description: 'Clear, clean, and conversion-focused layouts.',
    icon: 'ux-ui-design'
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing & Automation',
    description: 'Automated email flows that nurture and convert.',
    icon: 'email-marketing'
  },
  {
    id: 'branding-content',
    title: 'Branding + Content Strategy & Creation',
    description: 'Build a bold visual system and content that drive engagement.',
    icon: 'branding-content'
  }
];

const HomeFeaturedServices: React.FC = () => {
  return (
    <section className="main">
      <div className="services-section pt-lg-responsive pb-lg-responsive">
        <h2 className="services-section__title typo-3xl-extrabold m-0">Featured Services</h2>
        <div className="services-section__grid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedServices;
