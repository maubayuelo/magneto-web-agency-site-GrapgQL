import React from 'react';
import ServiceIcon from '../../atoms/ServiceIcon';
import './ServiceCard.scss';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon }) => {
  return (
    <div className="service-card">
      <div className="service-card__icon">
        <ServiceIcon type={icon} />
      </div>
      <div className="service-card__content">
        <h3 className="typo-2xl-extrabold m-0">{title}</h3>
        <p className="typo-paragraph-medium m-0">{description}</p>
      </div>
      <a href='#' className="service-card__link typo-xl-extrabold typo-color-primary">
        Learn More
      </a>
    </div>
  );
};

export default ServiceCard;
