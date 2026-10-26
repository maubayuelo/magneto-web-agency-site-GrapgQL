"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendlyButton } from "../../atoms";
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { localizePath } from '@/i18n/paths';
import "./Header.scss";

export const Header = ({
  className = "",
  logo,
  switcher,
}: {
  className?: string;
  logo?: string;
  /** Language switcher, rendered only when set (layout passes it when 2+ locales are enabled). */
  switcher?: React.ReactNode;
}) => {
  const { t, locale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoUrl] = useState<string | undefined>(logo);
  const [useImgFallback, setUseImgFallback] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Render the header content (same for both mounted states to ensure consistency)
  function HeaderCTA({ utmContent, utmTerm, text, href }: { utmContent?: string; utmTerm?: string; text?: string; href?: string }) {
    const { openModal } = useEmailModal();
    // Import analytics lazily to avoid SSR issues
    // eslint-disable-next-line no-unused-vars
    const { gtagEvent: _unused } = ({} as any);
    // We'll use the analytics util directly below when available
    // (import at top-level could be fine too, but keep consistent pattern)
    const isCalendly = href ? href.includes('calendly') : true; // default behaviour is calendly button
    const downloadUrl = href && href.endsWith('.pdf') ? href : undefined;

    if (isCalendly) {
      // keep original CalendlyButton visual by applying the same classes
      return (
        <button type="button" className={["btn","btn-primary","btn-sm","btn-small"].filter(Boolean).join(' ')} onClick={() => {
          try { (window as any)?.gtag && (window as any).gtag('event', 'cta_clicked', { event_category: 'engagement', event_label: 'header', utm_content: utmContent || 'header' }); } catch (e) {}
          openModal({ origin: 'header', utmContent });
        }}>
          {text}
        </button>
      );
    }

    if (downloadUrl) {
      return (
        <button type="button" className="btn-small btn-secondary" onClick={() => openModal({ downloadUrl, utmContent })}>
          {text}
        </button>
      );
    }

    if (href) {
      return <a href={href} className="btn-small">{text}</a>;
    }

    return <button type="button" className="btn-small">{text}</button>;
  }

  const renderHeaderContent = () => (
    <>
      <section className={`header ${className} ${scrolled ? "scrolled" : ""}`}>
        <header className={`${className} ${scrolled ? "scrolled" : ""}`}>
          <div className="main">
              <Link className="logo" href={localizePath('/', locale)}>
              {(() => {
                const src = logoUrl || logo || '/logo.png';
                const isSvg = typeof src === 'string' && src.toLowerCase().endsWith('.svg');
                const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
                // Use <img> for SVGs (external or local). Use next/image for raster local images.
                if (isSvg) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt={t.header.logoAlt} width={120} height={43} />;
                }

                // For external raster images, use plain img to avoid next/image domain config issues
                if (isExternal) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt={t.header.logoAlt} width={120} height={43} />;
                }

                // For local raster images, prefer Next/Image for performance. However, sometimes
                // dynamic/unoptimized or missing sources cause Next Image to fail to render.
                // Use onError to gracefully fall back to a plain <img> when that happens.
                if (useImgFallback) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt={t.header.logoAlt} width={120} height={43} />;
                }

                return (
                  <Image
                    src={src}
                    alt={t.header.logoAlt}
                    width={120}
                    height={43}
                    // When a dynamic/local image fails to load in Next Image, fall back to plain img
                    onError={() => setUseImgFallback(true)}
                    // allow using dynamic sources without requiring loader config in dev
                    unoptimized
                  />
                );
              })()}
            </Link>
            <ul className="nav">
              <li><a href={localizePath('/about-magneto/', locale)} className="typo-sm-bold">{t.nav.about}</a></li>
              <li><a href={localizePath('/services/', locale)} className="typo-sm-bold">{t.nav.services}</a></li>
              <li><a href={localizePath('/packages/', locale)} className="typo-sm-bold">{t.nav.packages}</a></li>
              <li><a href={localizePath('/projects/', locale)} className="typo-sm-bold">{t.nav.projects}</a></li>
              <li><a href={localizePath('/contact/', locale)} className="typo-sm-bold">{t.nav.contact}</a></li>
              <li>
                <HeaderCTA
                  utmContent="header_desktop"
                  utmTerm="schedule_call"
                  text={t.header.scheduleCall}
                />
              </li>
              {switcher && <li className="nav__lang">{switcher}</li>}
            </ul>
            <ul className="nav_mobile">
              <li>
                <HeaderCTA
                  utmContent="header_mobile"
                  utmTerm="schedule_call"
                  text={t.header.scheduleCall}
                />
              </li>
              <li>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setMenuOpen(prev => !prev);
                  }}
                >
                  {/* Use plain img for these simple SVG icons */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={menuOpen ? "/assets/images/ico-close.svg" : "/assets/images/ico-ham.svg"}
                    alt={menuOpen ? t.header.menuClose : t.header.menuOpen}
                    width={24}
                    height={24}
                  />
                </a>
              </li>
            </ul>
          </div>
        </header>
      </section>
      <ul className="nav_mobile__menu" style={{ display: menuOpen ? "flex" : "none" }}>
        <li><a href={localizePath('/about-magneto/', locale)} onClick={() => setMenuOpen(false)}>{t.nav.about}</a></li>
        <li><a href={localizePath('/services/', locale)} onClick={() => setMenuOpen(false)}>{t.nav.services}</a></li>
        <li><a href={localizePath('/packages/', locale)} onClick={() => setMenuOpen(false)}>{t.nav.packages}</a></li>
        <li><a href={localizePath('/projects/', locale)} onClick={() => setMenuOpen(false)}>{t.nav.projects}</a></li>
        <li><a href={localizePath('/contact/', locale)} onClick={() => setMenuOpen(false)}>{t.nav.contact}</a></li>
        {switcher && <li>{switcher}</li>}
      </ul>
    </>
  );

  // Effects already guard access to window. Render the same content server and client
  return renderHeaderContent();
};