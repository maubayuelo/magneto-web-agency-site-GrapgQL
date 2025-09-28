"use client";
import React from 'react';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { gtagEvent } from '@/utils/analytics';
import { CalendlyButton } from '@/components/atoms';

type CTA = {
  text?: string;
  href?: string;
  type?: string;
  utmContent?: string | null;
  utmTerm?: string | null;
  downloadUrl?: string | null;
  onClick?: (() => void) | null;
};

export default function HeroCTA({ cta }: { cta?: CTA | null }) {
  const emailModal = useEmailModal();

  if (!cta) return null;

  const isCalendly = !!cta.type || (cta.href && cta.href.includes('calendly'));

  // Download behaviour: prefer explicit downloadUrl, otherwise treat PDF links as downloads
  const downloadUrl = cta.downloadUrl || (cta.href && cta.href.endsWith('.pdf') ? cta.href : undefined);

  if (isCalendly) {
    return (
      <CalendlyButton
        className="btn btn-primary typo-uppercase typo-extrabold"
        utmContent={cta.utmContent || undefined}
        utmTerm={cta.utmTerm || undefined}
        customUrl={cta.href}
      >
        {cta.text}
      </CalendlyButton>
    );
  }

  if (downloadUrl) {
    return (
      <button
        type="button"
        className="btn btn-secondary typo-extrabold"
        onClick={() => {
          try { gtagEvent('cta_clicked_mailchimp', { event_category: 'engagement', event_label: 'hero_download', utm_content: cta.utmContent || 'leadmagnet_home' }); } catch (e) {}
          emailModal.openModal({ downloadUrl, utmContent: cta.utmContent || 'leadmagnet_home' });
        }}
      >
        {cta.text}
      </button>
    );
  }

  if (cta.href) {
    return (
      <a href={cta.href} className="btn btn-primary typo-uppercase typo-extrabold">
        {cta.text}
      </a>
    );
  }

  return (
    <button type="button" className="btn btn-primary typo-uppercase typo-extrabold" onClick={() => cta.onClick && cta.onClick()}>
      {cta.text}
    </button>
  );
}
