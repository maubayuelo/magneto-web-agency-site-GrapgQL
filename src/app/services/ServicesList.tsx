"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { IconComponent } from '../../components/atoms';
import { getServicesPageData } from './api';

// Service data structure
interface Service {
  id: string;
  title: string;
  description: string;
  image: any; // GraphQL shape: could be string or { node: { sourceUrl, altText } }
  icon?: any; // GraphQL may return a nested node or a string
  featuredService?: boolean;
  iconType?: string;
}



// Service Item Component
interface ServiceItemProps {
  service: Service;
  variant: 'left' | 'right';
}

function ServiceItem({ service, variant }: ServiceItemProps) {
  const isRight = variant === 'right';

  // Ensure icon is always a string path
  const iconSrc =
    typeof service.icon === 'string'
      ? service.icon
      : (service.icon?.node?.sourceUrl || '');
  
  return (
    <div className={`service-item ${isRight ? 'service-item--reverse' : ''} pb-md-responsive`}>
      <div className="service-image-wrapper">
        <Image
          src={(service.image?.node?.sourceUrl) || (service.image as string) || ''}
          alt={(service.image?.node?.altText) || service.title}
          width={675}
          height={675}
          className="service-image"
          priority={false}
        />
      </div>
      <div className={`service-content ${isRight ? 'service-content--right' : ''}`}>
        <IconComponent
          src={iconSrc}
          alt={service.title}
          size="md"
          className=""
        />
        <h3 className={`typo-3xl-extrabold m-0 mb-15 ${isRight ? 'service-title--right' : ''}`}>
          {service.title}
        </h3>
        {service.featuredService && (
          <div className="badge">
            <span className="typo-sm-bold">Featured Service</span>
          </div>
        )}
        <p className={`typo-paragraph-medium m-0 ${isRight ? 'service-description--right' : ''}`}>
          {service.description}
        </p>
      </div>
    </div>
  );
}

// Main Services List Component
export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getServicesPageData().then(data => {
      setServices(data?.servicesServiceDetails?.services || []);
    });
  }, []);

  return (
    <div className="">
      {services.map((service, index) => (
        <ServiceItem
          key={index}
          service={service}
          variant={index % 2 === 0 ? 'left' : 'right'} // Pass 'left' or 'right' variant to alternate layout for each service
        />
      ))}
    </div>
  );
}
