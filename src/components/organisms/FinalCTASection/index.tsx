 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getHomePrefooter } from './api';
import type { FinalCTASectionProps, FinalCTAData } from './types';
import { CalendlyButton } from '@/components/atoms';
import Image from 'next/image';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import './FinalCTASection.scss';

function FinalCTAInner({ ctaText, ctaHref }: { ctaText?: string | null; ctaHref?: string | null }) {
  const { openModal } = useEmailModal();
  return (
    <button className="btn btn-primary mt-30 typo-uppercase typo-extrabold" onClick={() => {
      try { gtagEvent('cta_clicked', { event_category: 'engagement', event_label: 'finalcta', utm_content: ctaHref || null }); } catch (e) {}
      openModal({ origin: 'finalcta', utmContent: undefined, customUrl: ctaHref || undefined });
    }}>
      {ctaText || 'Request Free Quote'}
    </button>
  );
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  className = '',
  show = true,
  debugData = null,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  // Initialize with server-provided data (debugData) to avoid client fetch delay
  const [data, setData] = useState<FinalCTAData | null>(debugData || null);

  // Derive CTA object from fetched data (keeps backward compatibility with existing props)
  const cta = {
    type: data?.ctaLink && data?.ctaLink.includes('calendly') ? 'calendly' : undefined,
    href: data?.ctaLink || undefined,
    onClick: undefined,
    utmContent: undefined,
    utmTerm: undefined,
    customUrl: data?.ctaLink && data?.ctaLink.includes('calendly') ? data.ctaLink : undefined
  };

  // Hide on contact page
  const shouldShow = show && pathname !== '/contact';

  // Only fetch on the client if no data was provided by a server loader
  useEffect(() => {
    if (debugData) return; // skip fetch when server data is available
    let active = true;
    (async () => {
      try {
        const prefooter: FinalCTAData = await getHomePrefooter();
        if (active) setData(prefooter || null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('FinalCTASection fetch error:', e);
      }
    })();
    return () => { active = false; };
  }, [debugData]);

  if (!shouldShow) return null;

  // Use WpResponsiveImage to prefer CMS-provided sizes and render a positioned responsive image
  const hasBg = !!(data?.bgimage?.node?.mediaDetails?.sizes?.length || data?.bgimage?.node?.sourceUrl);

  return (
    <section className={`final-cta-section main mb-md-responsive typo-center ${className}`.trim()}>
      <div className="final-cta-section__container">
        {/* background image rendered with WpResponsiveImage (fills container and uses srcset/sizes) */}
        {hasBg && (
          <div className="final-cta-section__bg">
            <WpResponsiveImage
              image={data?.bgimage?.node as any}
              alt={data?.title || 'Background'}
              className="final-cta-section__bg-image"
              omitSizeAttributes={false}
              priority
              fill
            />
            <div className="final-cta-section__overlay" />
          </div>
        )}

          <h2 className="typo-center typo-3xl-extrabold m-0 typo-white">
            {data?.title || "Stop losing leads. Start converting."}
          </h2>
          <p className="typo-center typo-xl-bold m-0 typo-white">
            {data?.subtitle || "Request your free funnel quote today and find out what's holding you back."}
          </p>

          {(cta.type === 'calendly' || (data?.ctaLink && data?.ctaLink.includes('calendly'))) ? (
            <FinalCTAInner ctaText={data?.ctaText} ctaHref={cta.href} />
          ) : cta.href ? (
            <a href={cta.href} className="btn btn-primary typo-uppercase typo-extrabold">
              {data?.ctaText || 'Request Free Quote'}
            </a>
          ) : (
            <button onClick={cta.onClick} className="btn btn-primary typo-uppercase typo-extrabold">
              {data?.ctaText || 'Request Free Quote'}
            </button>
          )}

        </div>

    </section>
  );
};

export default FinalCTASection;
// Server-side async loader (import { FinalCTASectionLoader } ...) for SSR prefetch
export { default as FinalCTASectionLoader } from './FinalCTASectionLoader';
