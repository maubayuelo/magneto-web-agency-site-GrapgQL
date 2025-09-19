"use client";
import React, { useEffect, useState } from 'react';
import ServiceCard from '../../molecules/ServiceCard';
import { getHomeFeaturedServices } from './api';
import Link from 'next/link';
import './FeaturedServices.scss';

interface Service {
  serviceTitle: string;
  serviceDescription: string;
  serviceIcon?: any; // could be string or object with node.sourceUrl
  anchorLink?: string;
}


const HomeFeaturedServices: React.FC = () => {
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchData() {
      const data = await getHomeFeaturedServices();
      //console.log("Fetched services data:", data); // <--- Add this
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
              title={service.serviceTitle}
              description={service.serviceDescription}
              icon={(service.serviceIcon?.node?.sourceUrl) || (typeof service.serviceIcon === 'string' ? service.serviceIcon : "")}
              anchorLink={service.anchorLink}
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
