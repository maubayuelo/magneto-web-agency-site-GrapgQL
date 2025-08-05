'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PreFooterProps } from './types';
import './PreFooter.scss';

export const PreFooter: React.FC<PreFooterProps> = ({
  title = "Stop losing leads. Start converting.",
  subtitle = "Request your free funnel quote today and find out what's holding you back.",
  buttonText = "Request Free Quote",
  className = '',
  show = true
}) => {
  const router = useRouter();

  const handleQuoteRequest = () => {
    router.push('/contact');
  };

  if (!show) {
    return null;
  }

  return (
    <section className={`pre-footer main ${className} `}>
      <div className="pre-footer__container">
        <div className="pre-footer__content">
          <div className="pre-footer__text">
            <h2 className="typo-center typo-3xl-extrabold m-0 typo-primary-color">
              {title}
            </h2>
            <p className="typo-center typo-xl-bold m-0">
              {subtitle}
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleQuoteRequest}
            type="button"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};