import React from 'react';
import Image from 'next/image';
import IconComponent from '../../components/atoms/IconComponent';

// Service data structure (matches GraphQL shape returned by the CMS)
interface Service {
  id?: string;
  title?: string;
  description?: string;
  image?: any; // GraphQL shape: could be string or { node: { sourceUrl, altText } }
  icon?: any; // GraphQL may return a nested node or a string
  featuredService?: boolean;
}

// Service Item Component
interface ServiceItemProps {
  service: Service;
  variant: 'left' | 'right';
}

function ServiceItem({ service, variant }: ServiceItemProps) {
  const isRight = variant === 'right';

  // Ensure icon is always a string path
  const iconSrc = typeof service.icon === 'string' ? service.icon : (service.icon?.node?.sourceUrl || '');

  const imageSrc = (service.image?.node?.sourceUrl) || (service.image as string) || '';
  const imageAlt = (service.image?.node?.altText) || service.title || '';

  return (
    <div className={`service-item ${isRight ? 'service-item--reverse' : ''} pb-md-responsive`}>
      <div className="service-image-wrapper">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={675}
            height={675}
            className="service-image"
            priority={false}
          />
        ) : null}
      </div>
      <div className={`service-content ${isRight ? 'service-content--right' : ''}`}>
        <IconComponent src={iconSrc} alt={service.title || ''} size="md" className="" />
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
export default function ServicesList({ services = [] }: { services?: Service[] }) {
  return (
    <div className="">
      {services.map((service, index) => (
        <ServiceItem
          key={service.id || service.title || index}
          service={service}
          variant={index % 2 === 0 ? 'left' : 'right'}
        />
      ))}
    </div>
  );
}
