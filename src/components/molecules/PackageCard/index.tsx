import React from 'react';
import { IconComponent, CalendlyButton } from '@/components/atoms';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import './PackageCard.scss';

type InternalCTAProps = {
  ctaType?: 'link' | 'calendly' | string;
  ctaHref?: string;
  ctaText?: string;
  utmContent?: string;
};

function PackageCardCTA({ ctaType, ctaHref, ctaText, utmContent }: InternalCTAProps) {
  const emailModal = useEmailModal();

  const isCalendly = ctaType === 'calendly' || (ctaHref && ctaHref.includes('calendly'));
  const downloadUrl = ctaHref && ctaHref.endsWith('.pdf') ? ctaHref : undefined;
  // For strategy call booking we open the pre-CTA modal (origin='package') so user fills form before Calendly
  if (isCalendly) {
    return (
      <button
        type="button"
        className="btn btn-primary btn-medium"
        onClick={() => {
          try { gtagEvent('cta_clicked', { event_category: 'engagement', event_label: `package_${utmContent || 'package'}`, utm_content: utmContent || null }); } catch (e) {}
          emailModal.openModal({ origin: 'package', utmContent });
        }}
      >
        {ctaText}
      </button>
    );
  }

  if (downloadUrl) {
    return (
      <button
        type="button"
        className="btn btn-secondary btn-medium"
        onClick={() => {
          try { gtagEvent('cta_clicked_mailchimp', { event_category: 'engagement', event_label: `package_download_${utmContent || 'package'}`, utm_content: utmContent || null }); } catch (e) {}
          emailModal.openModal({ downloadUrl, utmContent });
        }}
      >
        {ctaText}
      </button>
    );
  }

  if (ctaHref) {
    return (
      <a href={ctaHref} className="btn btn-primary btn-medium">
        {ctaText}
      </a>
    );
  }

  return (
    <button type="button" className="btn btn-primary btn-medium">
      {ctaText}
    </button>
  );
}

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
              <div className="badge">
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
      
      {/* CTA behaviour mirrors HeroCTA / LeadMagnetSection: Calendly -> CalendlyButton; PDF/download -> open modal; href -> anchor; fallback -> button */}
      <PackageCardCTA
        ctaType={ctaType}
        ctaHref={ctaHref}
        ctaText={ctaText}
        utmContent={utmContent || `package_${title.toLowerCase()}`}
      />
      
      <div className="package-card__features">
        <h4 className="typo-md-extrabold m-0">What&apos;s included:</h4>
        <ul className="package-card__features-list">
          {features.map((feature, index) => (
            <li key={index} className="package-card__feature-item">
              <div className="package-card__check-icon">
                <IconComponent src="/assets/images/ico-check.svg" alt="Check icon" size="sm" className="package-card__check" />
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
