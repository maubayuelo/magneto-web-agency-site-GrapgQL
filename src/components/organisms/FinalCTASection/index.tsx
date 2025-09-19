 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getHomePrefooter } from './api';
import { FinalCTASectionProps } from './types';
import { CalendlyButton } from '../../atoms';
import './FinalCTASection.scss';

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  className = '',
  show = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<any>(null);

  // Derive CTA object from fetched data (keeps backward compatibility with existing props)
  const cta = {
    type: data?.ctaType || (data?.ctaLink && data?.ctaLink.includes('calendly') ? 'calendly' : undefined),
    href: data?.ctaLink || undefined,
    onClick: undefined,
    utmContent: data?.utmContent,
    utmTerm: data?.utmTerm,
    // pass Calendly customUrl when it's a Calendly link
    customUrl: data?.ctaLink && data?.ctaLink.includes('calendly') ? data.ctaLink : undefined
  };

  // Hide on contact page
  const shouldShow = show && pathname !== '/contact';

  useEffect(() => {
    async function fetchData() {
      const prefooter = await getHomePrefooter();
      setData(prefooter);
    }
    fetchData();
  }, []);

  if (!shouldShow) return null;

  return (
    <section  className={`final-cta-section main mb-md-responsive typo-center ${className} `}>
      <div style={{ backgroundImage: `url(${data?.bgimage?.node?.sourceUrl || ''})` }}   className="final-cta-section__container">
        
          
            <h2 className="typo-center typo-3xl-extrabold m-0 typo-white">
              {data?.title || "Stop losing leads. Start converting."}
            </h2>
            <p className="typo-center typo-xl-bold m-0 typo-white">
              {data?.subtitle || "Request your free funnel quote today and find out what's holding you back."}
            </p>

          <div className="final-cta-section__button">
            {/* 
              If the CTA is for Calendly (either by explicit type or by matching the Calendly URL),
              render the CalendlyButton which opens the modal.
              Otherwise, render a normal link or button.
            */}
          </div>
            
      {(cta.type === 'calendly' || (data?.ctaLink && data?.ctaLink.includes('calendly'))) ? (
      <CalendlyButton 
        utmContent={cta.utmContent}
        utmTerm={cta.utmTerm}
        customUrl={cta.customUrl}
        className="btn btn-primary mt-30 typo-uppercase typo-extrabold"
      >
        {data?.ctaText || "Request Free Quote"}
      </CalendlyButton>
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
