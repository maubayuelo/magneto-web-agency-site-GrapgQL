'use client';

import React from 'react';
import { localizePath } from '@/i18n/paths';
import type { FinalCTASectionProps } from './types';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import { useI18n } from '@/i18n/I18nProvider';
import './FinalCTASection.scss';

/** Internal path stored in ACF (`/contact`, `/packages#build`); anything else (external, `//host`) is ignored. */
export function internalPath(path: string | null | undefined): string | null {
  const value = typeof path === 'string' ? path.trim() : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

function ModalButton({ text, calendlyUrl, className }: { text: string; calendlyUrl?: string | null; className: string }) {
  const { openModal } = useEmailModal();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        try { gtagEvent('cta_clicked', { event_category: 'engagement', event_label: 'finalcta', utm_content: calendlyUrl || null }); } catch (e) {}
        openModal({ origin: 'finalcta', utmContent: undefined, customUrl: calendlyUrl || undefined });
      }}
    >
      {text}
    </button>
  );
}

/**
 * Final CTA of one page or project (ADR 0006, decision 3). Data comes from FinalCTASectionLoader (server).
 * Each button: a path → a localized link; no path → the strategy-call modal (same flow as every "Book a Strategy Call").
 */
export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  className = '',
  show = true,
  debugData = null,
  locale,
}) => {
  const { t } = useI18n();
  if (!show) return null;

  const data = debugData;
  const hasBg = !!(data?.bgimage?.node?.mediaDetails?.sizes?.length || data?.bgimage?.node?.sourceUrl);
  const primaryText = data?.ctaText?.trim() || t.common.bookStrategyCall;
  const primaryPath = internalPath(data?.ctaPath);
  const secondaryText = data?.secondaryCtaText?.trim() || '';
  const secondaryPath = internalPath(data?.secondaryCtaPath);
  const primaryClass = 'btn btn-primary typo-uppercase typo-extrabold';
  const secondaryClass = 'btn btn-secondary typo-uppercase typo-extrabold';

  return (
    <section className={`final-cta-section main mb-md-responsive typo-center ${className}`.trim()}>
      <div className="final-cta-section__container">
        {hasBg && (
          <div className="final-cta-section__bg">
            <WpResponsiveImage
              image={data?.bgimage?.node as any}
              alt={data?.title || t.cmsFallback.finalCta.bgAlt}
              className="final-cta-section__bg-image"
              omitSizeAttributes={false}
              priority
              fill
            />
            <div className="final-cta-section__overlay" />
          </div>
        )}

        <h2 className="typo-center typo-3xl-extrabold m-0 typo-white">
          {data?.title || t.cmsFallback.finalCta.title}
        </h2>
        <p className="typo-center typo-xl-bold m-0 typo-white">
          {data?.subtitle || t.cmsFallback.finalCta.subtitle}
        </p>

        <div className="final-cta-section__actions">
          {primaryPath ? (
            <a href={localizePath(primaryPath, locale)} className={primaryClass}>{primaryText}</a>
          ) : (
            <ModalButton text={primaryText} calendlyUrl={data?.ctaLink} className={primaryClass} />
          )}
          {secondaryText &&
            (secondaryPath ? (
              <a href={localizePath(secondaryPath, locale)} className={secondaryClass}>{secondaryText}</a>
            ) : (
              <ModalButton text={secondaryText} calendlyUrl={data?.ctaLink} className={secondaryClass} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
// Server-side async loader (import { FinalCTASectionLoader } ...) for SSR prefetch
export { default as FinalCTASectionLoader } from './FinalCTASectionLoader';
