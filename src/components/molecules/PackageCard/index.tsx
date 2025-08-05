import React from 'react';
import { IconComponent, CalendlyButton } from '../../atoms';
import Image from 'next/image';
import './PackageCard.scss';

export interface PackageFeature {
  text: string;
}

export interface PackageCardProps {
  title: string;
  price: string;
  currency?: string;
  description: string;
  features: PackageFeature[];
  isPopular?: boolean;
  ctaText?: string;
  ctaHref?: string;
  ctaType?: 'link' | 'calendly';
  utmContent?: string;
  variant?: 'default' | 'popular';
  icon?: string;
}

const PackageCard: React.FC<PackageCardProps> = ({
  title,
  price,
  currency = 'CAD',
  description,
  features,
  isPopular = false,
  ctaText = 'Book a Free Strategy Call',
  ctaHref = '/contact',
  ctaType = 'calendly',
  utmContent,
  variant = 'default',
  icon = '/assets/images/ico-services-web-dev.svg'
}) => {
  return (
    <div className={`package-card p-15 ${variant === 'popular' ? 'package-card--popular' : ''}`}>
      <div className="package-card__header background-white p-15">
        <div className="package-card__title-row">
          <h3 className="typo-xl-extrabold m-0">{title}</h3>
          <div className="package-card__icon">
            {isPopular && (
              <div className="package-card__popular-badge">
                <span className="typo-sm-bold">Popular</span>
              </div>
            )}
            <IconComponent 
              src={icon}
              alt={title}
              size="sm"
            />
          </div>
        </div>
        <div className="package-card__pricing">
          <div className="typo-2xl-extrabold">{price}</div>
          <div className="typo-sm-medium typo-gray-80">{currency}</div>
        </div>
        <p className="typo-md-medium m-0">{description}</p>
      </div>
      
      {ctaType === 'calendly' ? (
        <CalendlyButton 
          className="btn btn-primary btn-medium"
          utmContent={utmContent || `package_${title.toLowerCase()}`}
          utmTerm="strategy_call"
        >
          {ctaText}
        </CalendlyButton>
      ) : (
        <a href={ctaHref} className="btn btn-primary btn-medium">
          {ctaText}
        </a>
      )}
      
      <div className="package-card__features">
        <h4 className="typo-md-extrabold m-0">What&apos;s included:</h4>
        <ul className="package-card__features-list">
          {features.map((feature, index) => (
            <li key={index} className="package-card__feature-item">
              <div className="package-card__check-icon">
                <Image
                  src="/assets/images/ico-check.svg"
                  alt="Check icon"
                  width={18}
                  height={18}
                  className="package-card__check"
                />
              </div>
              <span className="typo-sm-medium">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PackageCard;
