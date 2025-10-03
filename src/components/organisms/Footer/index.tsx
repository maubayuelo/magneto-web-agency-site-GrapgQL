'use client';

import { useEffect, useState } from 'react';
import { getHomeFooter } from "./api";
import './Footer.scss';
import type { FooterProps, FooterResponse, FooterSocialIcon } from './types';
import Link from 'next/link';
import Image from 'next/image';

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [footerData, setFooterData] = useState<FooterResponse | null>(null);

  useEffect(() => {
    async function fetchFooter() {
      const data = await getHomeFooter();
      setFooterData(data || null);
    }
    fetchFooter();
  }, []);

  return (
    <section className={`main footer pt-lg-responsive ${className}`}>
        {footerData && (
          <p className="typo-md-medium typo-center m-0">
            {footerData?.footerLine1 || 'Default Footer Line 1'}
          </p>
        )}

        {/* Social Media Icons */}
        <div className="footer__social">
          {footerData?.footerSocialIcons?.map((icon: FooterSocialIcon, idx: number) => {
            const iconUrl = icon?.iconSvg?.node?.sourceUrl || '';
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
                {src ? (
                  <Image
                    src={src}
                    alt={(icon && (icon as any).alt) || 'Social Icon'}
                    className="footer__icon"
                    width={24}
                    height={24}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        {footerData && (
          <>
          <p className="typo-md-medium typo-center m-0">
            {footerData?.footerLine2 || 'Default Footer Line 2'}
          </p>
            <p className="typo-md-medium typo-center mb-lg-responsive">
            Magneto Marketing - All Rights Reserved, {new Date().getFullYear()}.
            </p>
          </>
        )}    

    </section>
  );
};

export default Footer;