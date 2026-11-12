'use client';

import React from 'react';
import { localizePath } from '@/i18n/paths';
import Image from 'next/image';
import type { FinalCTASectionProps, ImageNode } from './types';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import { useI18n } from '@/i18n/I18nProvider';
import './FinalCTASection.scss';

/**
 * Background source (design round B10): the original file, as the hero background, so both resolve to the same
 * optimizer URL. Fallback: the widest generated size. Null → no background.
 */
function bgSource(bg: ImageNode | null | undefined): string | null {
  const node = bg?.node;
  if (node?.sourceUrl) return node.sourceUrl;
  const sizes = (node?.mediaDetails?.sizes ?? []).filter((s) => !!s?.sourceUrl);
  if (!sizes.length) return null;
  const widest = sizes.reduce((a, b) => ((b?.width ?? 0) > (a?.width ?? 0) ? b : a));
  return widest?.sourceUrl ?? null;
}

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
  const bgSrc = bgSource(data?.bgimage);
  const primaryText = data?.ctaText?.trim() || t.common.bookStrategyCall;
  const primaryPath = internalPath(data?.ctaPath);
  const secondaryText = data?.secondaryCtaText?.trim() || '';
  const secondaryPath = internalPath(data?.secondaryCtaPath);
  const primaryClass = 'btn btn-primary typo-uppercase typo-extrabold';
  const secondaryClass = 'btn btn-secondary typo-uppercase typo-extrabold';

  return (
    <section className={`final-cta-section main mb-md-responsive typo-center ${className}`.trim()}>
      <div className="final-cta-section__container">
        {bgSrc && (
          <div className="final-cta-section__bg">
            {/* Design round B10: next/image `fill` with the hero background's exact `sizes`, so on hero routes the
                browser reuses the hero's file (one download). Below the fold → lazy, no priority. q90: q75 bands
                the gradient (A4). */}
            <Image
              src={bgSrc}
              alt=""
              className="final-cta-section__bg-image"
              fill
              sizes="(max-width: 1240px) 100vw, 1200px"
              quality={90}
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
