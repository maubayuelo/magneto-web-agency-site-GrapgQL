import React from 'react';
import ServiceCard from '@/components/molecules/ServiceCard';
import type { FeaturedServiceItem } from './types';
import Link from 'next/link';
import './FeaturedServices.scss';

interface FeaturedServicesProps {
  sectionTitle?: string;
  services?: FeaturedServiceItem[];
}

const FeaturedServices: React.FC<FeaturedServicesProps> = ({ 
  sectionTitle = 'Featured Services', 
  services = [] 
}) => {

  return (
    <>
    <section className="main">
      <div className="services-section pt-lg-responsive">
        <h2 className="services-section__title typo-3xl-extrabold m-0">{sectionTitle}</h2>
        <div className="services-section__grid">
          {services.map((service, idx) => (
            <ServiceCard
              key={service.anchorLink || idx}
              title={service.serviceTitle || ''}
              description={service.serviceDescription || ''}
              icon={typeof service.serviceIcon === 'string' ? service.serviceIcon : (service.serviceIcon?.node?.sourceUrl || '')}
              anchorLink={service.anchorLink ? String(service.anchorLink) : undefined}
            />
          ))}

          

        </div>
      </div>
    </section>
    <section className="main pb-lg-responsive">
      <Link href="/services/" className="btn btn-secondary mt-30 ">
              Check All Services
      </Link>
    </section>
    
    </>
  );
};

export default FeaturedServices;
