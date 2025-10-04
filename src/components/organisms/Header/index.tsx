"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendlyButton } from "../../atoms";
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
import "./Header.scss";
import { getHomeHeader } from "./api";
import { HomeHeader } from './types';

export const Header = ({ className = "", logo }: { className?: string; logo?: string }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(logo);
  const [useImgFallback, setUseImgFallback] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const data: HomeHeader = await getHomeHeader();
        const src = logoUrl || logo || '/assets/images/logo-magneto.svg';
        if (src) setLogoUrl(src);
      } catch (err) {
        // keep fallback
      }
    }
    fetchLogo();
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
              <Link className="logo" href="/">
              {(() => {
                const src = logoUrl || logo || '/logo.png';
                const isSvg = typeof src === 'string' && src.toLowerCase().endsWith('.svg');
                const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
                // Use <img> for SVGs (external or local). Use next/image for raster local images.
                if (isSvg) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt="Logo" width={120} height={43} />;
                }

                // For external raster images, use plain img to avoid next/image domain config issues
                if (isExternal) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt="Logo" width={120} height={43} />;
                }

                // For local raster images, prefer Next/Image for performance. However, sometimes
                // dynamic/unoptimized or missing sources cause Next Image to fail to render.
                // Use onError to gracefully fall back to a plain <img> when that happens.
                if (useImgFallback) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt="Logo" width={120} height={43} />;
                }

                return (
                  <Image
                    src={src}
                    alt="Logo"
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
              <li><a href="/about-magneto/" className="typo-sm-bold">About</a></li>
              <li><a href="/services/" className="typo-sm-bold">Services</a></li>
              <li><a href="/packages/" className="typo-sm-bold">Packages</a></li>
              {/* <li><a href="/projects/" className="typo-sm-bold">Projects</a></li> */}
              <li><a href="/contact/" className="typo-sm-bold">Contact</a></li>
              <li>
                <HeaderCTA
                  utmContent="header_desktop"
                  utmTerm="schedule_call"
                  text="Free Schedule Call"
                />
              </li>
              {/* <li><a href="#" className="typo-sm-bold">FR</a></li>
              <li><a href="#" className="typo-sm-bold">ES</a></li> */}
            </ul>
            <ul className="nav_mobile">
              <li>
                <HeaderCTA
                  utmContent="header_mobile"
                  utmTerm="schedule_call"
                  text="Free Schedule Call"
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
                    alt={menuOpen ? "Close" : "Menu"}
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
        <li><a href="/about-magneto/" onClick={() => setMenuOpen(false)}>About</a></li>
        <li><a href="/services/" onClick={() => setMenuOpen(false)}>Services</a></li>
        <li><a href="/packages/" onClick={() => setMenuOpen(false)}>Packages</a></li>
        {/* <li><a href="/projects/" onClick={() => setMenuOpen(false)}>Projects</a></li> */}
        <li><a href="/contact/" onClick={() => setMenuOpen(false)}>Contact</a></li>
        {/* <li><a href="#" onClick={() => setMenuOpen(false)}>FR</a></li>
        <li><a href="#" onClick={() => setMenuOpen(false)}>ES</a></li> */}
      </ul>
    </>
  );

  // Effects already guard access to window. Render the same content server and client
  return renderHeaderContent();
};