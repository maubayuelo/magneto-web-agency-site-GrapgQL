import React from 'react';
import ServiceCard from '@/components/molecules/ServiceCard';
import type { FeaturedServiceItem } from './types';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import './FeaturedServices.scss';

interface FeaturedServicesProps {
  sectionTitle?: string;
  services?: FeaturedServiceItem[];
  locale: Locale;
}

const FeaturedServices: React.FC<FeaturedServicesProps> = ({ 
  sectionTitle, 
  services = [],
  locale,
}) => {
  const t = getDictionary(locale);
  const title = sectionTitle ?? t.cmsFallback.featuredServicesTitle;

  return (
    <>
    <section className="main">
      <div className="services-section pt-lg-responsive">
        <h2 className="services-section__title typo-3xl-extrabold m-0">{title}</h2>
        <div className="services-section__grid">
          {services.map((service, idx) => (
            <ServiceCard
              key={service.anchorLink || idx}
              title={service.serviceTitle || ''}
              description={service.serviceDescription || ''}
              icon={typeof service.serviceIcon === 'string' ? service.serviceIcon : (service.serviceIcon?.node?.sourceUrl || '')}
              anchorLink={service.anchorLink ? String(service.anchorLink) : undefined}
              locale={locale}
            />
          ))}

          

        </div>
      </div>
    </section>
    <section className="main pb-lg-responsive">
      <Link href={localizePath('/services/', locale)} className="btn btn-secondary mt-30 ">
              {t.featuredServices.checkAll}
      </Link>
    </section>
    
    </>
  );
};

export default FeaturedServices;
