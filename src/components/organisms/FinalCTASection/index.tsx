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
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<FinalCTAData | null>(null);

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

  useEffect(() => {
    async function fetchData() {
      const prefooter: FinalCTAData = await getHomePrefooter();
      setData(prefooter || null);
    }
    fetchData();
  }, []);

  if (!shouldShow) return null;

  // Use WpResponsiveImage to prefer CMS-provided sizes and render a positioned responsive image
  const hasBg = !!(data?.bgimage?.node?.mediaDetails?.sizes?.length || data?.bgimage?.node?.sourceUrl);

  return (
    <section  className={`final-cta-section main mb-md-responsive typo-center ${className} `}>
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

        <div className="final-cta-section__button">
          {/* CTA rendering handled below */}
        </div>

      {(cta.type === 'calendly' || (data?.ctaLink && data?.ctaLink.includes('calendly'))) ? (
        // open pre-CTA modal for final CTA strategy calls
        <FinalCTAInner ctaText={data?.ctaText} ctaHref={cta.href} />
      ) : cta.href ? (
            // If CTA has an href and is not Calendly, render as a normal link
            <a href={cta.href} className="btn btn-primary typo-uppercase typo-extrabold">
                {data?.ctaText || "Request Free Quote"}
            </a>
            ) : (
            // Otherwise, render as a button (e.g., for onClick actions)
            <button onClick={cta.onClick} className="btn btn-primary typo-uppercase typo-extrabold">
                {data?.ctaText || "Request Free Quote"}
            </button>
            )}

        </div>

    </section>
  );
};

export default FinalCTASection;
