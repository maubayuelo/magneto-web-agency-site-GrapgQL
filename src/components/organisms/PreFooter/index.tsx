'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getHomePrefooter } from './api';
import { PreFooterProps } from './types';
import './PreFooter.scss';

export const PreFooter: React.FC<PreFooterProps> = ({
  className = '',
  show = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<any>(null);

  // Hide PreFooter on contact page
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
    <section className={`pre-footer main ${className} `}>
      <div className="pre-footer__container">
        <div className="pre-footer__content">
          <div className="pre-footer__text">
            <h2 className="typo-center typo-3xl-extrabold m-0 typo-primary-color">
              {data?.title || "Stop losing leads. Start converting."}
            </h2>
            <p className="typo-center typo-xl-bold m-0">
              {data?.subtitle || "Request your free funnel quote today and find out what's holding you back."}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => router.push(data?.ctaLink?.edges?.[0]?.node?.uri || '/contact')}
            type="button"
          >
            {data?.ctaText || "Request Free Quote"}
          </button>
        </div>
      </div>
    </section>
  );
};