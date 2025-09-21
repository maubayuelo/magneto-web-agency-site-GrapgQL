"use client";
import React, { useEffect, useState } from 'react';
import ServiceCard from '@/components/molecules/ServiceCard';
import { getHomeFeaturedServices } from './api';
import type { FeaturedServicesResponse, FeaturedServiceItem } from './types';
import Link from 'next/link';
import './FeaturedServices.scss';

const HomeFeaturedServices: React.FC = () => {
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const [services, setServices] = useState<FeaturedServiceItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const data: FeaturedServicesResponse = await getHomeFeaturedServices();
      setSectionTitle(data.sectionTitle || 'Featured Services');
      setServices(data.service || []);
    }
    fetchData();
  }, []);

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

export default HomeFeaturedServices;
