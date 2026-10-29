import React from 'react';
import ServiceIcon from '@/components/atoms/ServiceIcon';
import type { Locale } from '@/i18n/config';
import { format, getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import './ServiceCard.scss';

interface ServiceCardProps {
  title: string;
  /** Optional one-line promise under the title (Phase 5a). */
  tagline?: string;
  description: string;
  icon: string;
  anchorLink?: string;
  locale: Locale;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, tagline, description, icon, anchorLink, locale }) => {
  const t = getDictionary(locale);
  return (
    <div className="service-card">
      <div className="service-card__icon">
        <ServiceIcon type={icon} />
      </div>
      <div className="service-card__content">
        <h3 className="typo-2xl-extrabold m-0">{title}</h3>
        {tagline ? <p className="service-card__tagline typo-lg-bold m-0">{tagline}</p> : null}
        <p className="typo-paragraph-medium m-0">{description}</p>
      </div>
      {anchorLink ? (
        <a
          href={`${localizePath('/services', locale)}#${anchorLink.replace(/^#/, '').toLowerCase().replace(/\s+/g, '-')}`}
          className="service-card__link typo-xl-extrabold typo-color-primary"
        >
          {format(t.featuredServices.explore, { name: title })}
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
