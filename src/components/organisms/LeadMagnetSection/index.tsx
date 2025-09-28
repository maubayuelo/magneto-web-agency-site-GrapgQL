 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getLeadMagnetSection } from './api';
import type { LeadMagnetSectionProps, LeadMagnetSectionData, LinkNode } from './types';
import { CalendlyButton } from '../../atoms';
import './LeadMagnetSection.scss';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';

export const LeadMagnetSection: React.FC<LeadMagnetSectionProps> = ({
  className = '',
  show = true,
}) => {
  const { openModal } = useEmailModal();
  const router = useRouter();
  const pathname = usePathname();
  const [dataLeadMagnetSection, setDataLeadMagnetSection] = useState<LeadMagnetSectionData | null>(null);

  
  // Derive CTA object from fetched data (keeps backward compatibility with existing props)
  // The API sometimes returns `ctaLink` as a string or as an object (e.g. { node: { url, uri, id } }).
  const rawCtaLink: string | LinkNode | undefined | null = (dataLeadMagnetSection as LeadMagnetSectionData)?.ctaLink;
  let normalizedHref: string | undefined = undefined;
  if (typeof rawCtaLink === 'string') {
    normalizedHref = rawCtaLink;
  } else if (rawCtaLink && typeof rawCtaLink === 'object') {
    // try a few common fields that might contain a url
    normalizedHref = rawCtaLink.node?.url || rawCtaLink.node?.uri || rawCtaLink.node?.link || (rawCtaLink.node?.id ? String(rawCtaLink.node.id) : undefined) || undefined;
  }

  const isCalendly = typeof normalizedHref === 'string' && normalizedHref.includes('calendly');

  const cta = {
    type: dataLeadMagnetSection?.ctaType || (isCalendly ? 'calendly' : undefined),
    href: normalizedHref,
    onClick: undefined,
    utmContent: dataLeadMagnetSection?.utmContent,
    utmTerm: dataLeadMagnetSection?.utmTerm,
    // pass Calendly customUrl when it's a Calendly link
    customUrl: isCalendly ? normalizedHref : undefined,
  };

  // Hide on contact page
  const shouldShow = show && pathname !== '/contact';

  useEffect(() => {
    async function fetchData() {
      const section: LeadMagnetSectionData = await getLeadMagnetSection();
      setDataLeadMagnetSection(section || null);
    }
    fetchData();
  }, []);

  if (!shouldShow) return null;

  return (
    <section  className={`lead-magnet-section main  ${className} `}>
      <div className="lead-magnet-section__container mb-lg-responsive">
        <div className="lead-magnet-section__content">
          <div className="lead-magnet-section__text">
            <p className="typo-center typo-xl-extrabold m-0">
              {dataLeadMagnetSection?.overTitleLeadMagnetSection || "Not ready to book a call?"}
            </p>
            <h2 className="typo-center typo-3xl-extrabold m-0 typo-primary-color">
              {dataLeadMagnetSection?.titleLeadMagnetSection || "Download our free guide:"}
            </h2>
            <p className="typo-center typo-xl-bold m-0">
              {dataLeadMagnetSection?.subtitleLeadMagnetSection || "5 Mistakes That Kill Funnel Conversions"}
            </p>
          </div>
          

          <button
            onClick={() =>
              {
                try { (window as any)?.gtag && (window as any).gtag('event', 'cta_clicked_mailchimp', { event_category: 'engagement', event_label: 'leadmagnet_home', utm_content: 'leadmagnet_home' }); } catch (e) {}
                openModal({
                  downloadUrl: dataLeadMagnetSection?.downloadUrl || '/assets/guides/free-guide.pdf',
                  utmContent: 'leadmagnet_home',
                })
              }
            }
            className="btn btn-secondary typo-extrabold"
          >
            {dataLeadMagnetSection?.ctaTextLeadMagnetSection || "Request Free Quote"}
          </button>

        </div>
      </div>
    </section>
  );
};

export default LeadMagnetSection;
