'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.scss';
import Image from 'next/image';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <section className={`main ${className}`}>
        <footer className={`footer ${className} pt-lg-responsive pb-lg-responsive mt-lg-responsive mb-lg-responsive`}>
      <div className="footer__container">
        <div className="footer__content">
          {/* Social Media Icons */}
          <div className="footer__social">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="footer__social-icon">
              <Image
                src="/assets/images/ico-social-ig.svg"
                alt={`Instagram Icon`}
                className="footer__icon"
                width={24}
                height={24}
              />
            </a>
            <a href="https://www.linkedin.com/in/maubayuelo/" target="_blank" rel="noopener noreferrer" className="footer__social-icon">
              <Image
                src="/assets/images/ico-social-linkedin.svg"
                alt={`LinkedIn Icon`}
                className="footer__icon"
                width={24}
                height={24}
              />
            </a>
          </div>
          
          {/* Location Text */}
          <p className="footer__location typo-md-medium typo-center">
            Based in Montreal | Serving clients worldwide
          </p>
          
          {/* Legal Links */}
          <div className="footer__legal typo-md-medium typo-center">
            <Link href="/privacy" className="footer__legal-link">
              Privacy Policy
            </Link>
            <span className="footer__legal-separator"> · </span>
            <Link href="/terms" className="footer__legal-link">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </section>
  );
};

export default Footer;
