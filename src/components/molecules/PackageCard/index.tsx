import React from 'react';
import { IconComponent, CalendlyButton } from '@/components/atoms';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import { useI18n } from '@/i18n/I18nProvider';
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
  /** 5b rich card: "For…" line under the title. */
  heading?: string;
  /** 5b rich card: body HTML, already sanitized by the server mapper. Set → no price block, features or modal CTA. */
  bodyHtml?: string;
  /** `build` / `fix` / `care` target for Services links (validated and unique in the mapper). */
  anchorId?: string;
  /** Localized internal link. `null` = no CTA (rich card without a valid one); omitted = legacy strategy-call CTA. */
  cta?: { text: string; href: string } | null;
}

const PackageCard: React.FC<PackageCardProps> = ({
  title,
  price,
  currency = 'CAD',
  description,
  features,
  isPopular = false,
  ctaText: ctaTextProp,
  ctaHref = '/contact',
  ctaType = 'calendly',
  utmContent,
  variant = 'default',
  icon = '/assets/images/ico-services-web-dev.svg',
  heading,
  bodyHtml,
  anchorId,
  cta,
}) => {
  const { t } = useI18n();
  const ctaText = ctaTextProp ?? t.common.bookStrategyCall;

  if (bodyHtml !== undefined) {
    return (
      // Three stacked zones (D-6): name + heading · CTA · extended description. Two grey zones so that, in the grid,
      // the top boxes of a row share a height while each card still ends after its own description box.
      <article id={anchorId} className="package-card package-card--rich">
        <div className="package-card__zone package-card__zone--top">
          <div className="package-card__header background-white p-15">
            <div className="package-card__title-row">
              <h2 className="typo-xl-extrabold m-0">{title}</h2>
              <div className="package-card__icon">
                <IconComponent src={icon} alt="" size="sm" />
              </div>
            </div>
            {heading ? <p className="package-card__heading typo-md-bold m-0">{heading}</p> : null}
          </div>
        </div>
        <div className="package-card__zone package-card__zone--bottom">
          {cta ? (
            <a href={cta.href} className="btn btn-primary btn-medium package-card__cta">
              {cta.text}
            </a>
          ) : null}
          {bodyHtml ? (
            <div className="package-card__details background-white p-15">
              <div className="package-card__body typo-md-medium" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <div id={anchorId} className={`package-card p-15 ${variant === 'popular' ? 'package-card--popular' : ''}`}>
      <div className="package-card__header background-white p-15">
        <div className="package-card__title-row">
          <h3 className="typo-xl-extrabold m-0">{title}</h3>
          <div className="package-card__icon">
            {isPopular && (
              <div className="badge">
                <span className="typo-sm-bold">{t.packages.popularBadge}</span>
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
      {cta === null ? null : cta ? (
        <a href={cta.href} className="btn btn-primary btn-medium">
          {cta.text}
        </a>
      ) : (
        <PackageCardCTA
          ctaType={ctaType}
          ctaHref={ctaHref}
          ctaText={ctaText}
          utmContent={utmContent || `package_${title.toLowerCase()}`}
        />
      )}

      {features.length > 0 ? <div className="package-card__features">
        <h4 className="typo-md-extrabold m-0">{t.packages.included}</h4>
        <ul className="package-card__features-list">
          {features.map((feature, index) => (
            <li key={index} className="package-card__feature-item">
              <div className="package-card__check-icon">
                <IconComponent src="/assets/images/ico-check.svg" alt={t.common.checkIconAlt} size="sm" className="package-card__check" />
              </div>
              <span className="typo-sm-medium">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div> : null}
    </div>
  );
};

export default PackageCard;
