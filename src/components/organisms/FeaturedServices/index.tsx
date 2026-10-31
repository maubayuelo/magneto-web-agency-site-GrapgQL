import React from 'react';
import ServiceCard from '@/components/molecules/ServiceCard';
import type { FeaturedServiceItem } from './types';
import type { Locale } from '@/i18n/config';
import './FeaturedServices.scss';

interface FeaturedServicesProps {
  services?: FeaturedServiceItem[];
  locale: Locale;
}

// Home BUILD / FIX / CARE cards (Phase 5a): no section heading and no "all services" button (copy decision Q3).
const FeaturedServices: React.FC<FeaturedServicesProps> = ({ services = [], locale }) => {
  if (services.length === 0) return null;
  return (
    <section className="main pb-lg-responsive">
      <div className="services-section pt-lg-responsive">
        <div className="services-section__grid">
          {services.map((service, idx) => (
            <ServiceCard
              key={service.anchorLink || idx}
              title={service.serviceTitle || ''}
              tagline={service.serviceTagline || undefined}
              description={service.serviceDescription || ''}
              icon={typeof service.serviceIcon === 'string' ? service.serviceIcon : (service.serviceIcon?.node?.sourceUrl || '')}
              anchorLink={service.anchorLink ? String(service.anchorLink) : undefined}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
