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
// A row with an empty title is skipped: WPML Copy sync can leave an untitled FR/ES row before its load (5c-rest §6).
const FeaturedServices: React.FC<FeaturedServicesProps> = ({ services = [], locale }) => {
  const rows = services.filter((service) => (service.serviceTitle ?? '').trim() !== '');
  if (rows.length === 0) return null;
  return (
    <section className="main pb-lg-responsive">
      <div className="services-section pt-lg-responsive">
        <div className="services-section__grid">
          {rows.map((service, idx) => (
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
