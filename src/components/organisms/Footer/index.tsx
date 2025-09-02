'use client';

import { useEffect, useState } from 'react';
import { getHomeFooter } from "./api";
import './Footer.scss';
import { FooterProps } from './types';
import Link from 'next/link';

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [footerData, setFooterData] = useState<any>(null);

  useEffect(() => {
    async function fetchFooter() {
      const data = await getHomeFooter();
      setFooterData(data);
      //console.log(data);
    }
    fetchFooter();
  }, []);

  return (
    <section className={`main ${className}`}>
      <footer style={{ backgroundImage: `url(${footerData?.footerBgImage?.node?.sourceUrl || ''})` }} className={`footer ${className} pt-lg-responsive pb-lg-responsive mt-lg-responsive mb-lg-responsive`}>
        <div className="footer__container">
          <div className="footer__content">
            {footerData && (
              <p className="footer__location typo-md-medium typo-center mb-md">
                {footerData?.footerLine1 || 'Default Footer Line 1'}
              </p>
            )}
            
            {/* Social Media Icons */}
            <div className="footer__social">
  {footerData?.footerSocialIcons?.map((icon: any, idx: number) => {
    const iconUrl = icon.iconSvg?.node?.sourceUrl;
    const isExternal = iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'));
    const src = isExternal ? iconUrl : '/assets/images/default-icon.svg';
    // Use <img> for SVGs, especially local ones
    return (
      <Link
        key={idx}
        href={icon.iconUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="footer__social-icon"
      >
        <img
          src={src}
          alt={icon.alt || 'Social Icon'}
          className="footer__icon"
        />
      </Link>
    );
  })}
</div>
            
            
            {footerData && (
              <p className="footer__location typo-md-medium typo-center mt-md-responsive">
                {footerData?.footerLine2 || 'Default Footer Line 2'}
              </p>
            )}
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Footer;