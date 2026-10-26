import React from 'react';
import ServiceIcon from '@/components/atoms/ServiceIcon';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import './ServiceCard.scss';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  anchorLink?: string;
  locale: Locale;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon,  anchorLink, locale }) => {
  const t = getDictionary(locale);
  return (
    <div className="service-card">
      <div className="service-card__icon">
        <ServiceIcon type={icon} />
      </div>
      <div className="service-card__content">
        <h3 className="typo-2xl-extrabold m-0">{title}</h3>
        <p className="typo-paragraph-medium m-0">{description}</p>
      </div>
      {anchorLink ? (
        <a
          href={`${localizePath('/services', locale)}#${anchorLink.toLowerCase().replace(/\s+/g, '-')}`}
          className="service-card__link typo-xl-extrabold typo-color-primary"
        >
          {t.featuredServices.learnMore}
        </a>
      ) : null}
    </div>
  );
};

export default ServiceCard;


// Sales Funnel Development
// Website & E-Commerce Development
// SEO & Performance Marketing
// UX/UI Design & Prototyping
// Email Marketing & Automation
// Branding & Visual Identity
// Content Strategy & Creation
