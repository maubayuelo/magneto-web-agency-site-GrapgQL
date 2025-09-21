"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendlyButton } from "../../atoms";
import "./Header.scss";
import { getHomeHeader } from "./api";
import { HomeHeader } from './types';

export const Header = ({ className = "", logo }: { className?: string; logo?: string }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(logo);

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
        const src = data?.logo?.sourceUrl;
        if (src) setLogoUrl(src);
      } catch (err) {
        // keep fallback
      }
    }
    fetchLogo();
  }, []);

  // Render the header content (same for both mounted states to ensure consistency)
  const renderHeaderContent = () => (
    <>
      <section className={`header ${className} ${scrolled ? "scrolled" : ""}`}>
        <header className={`${className} ${scrolled ? "scrolled" : ""}`}>
          <div className="main">
              <Link className="logo" href="/">
              <Image src={logoUrl || logo || "/logo.png"} alt="Logo" width={120} height={43} />
            </Link>
            <ul className="nav">
              <li><a href="/about-magneto/" className="typo-sm-bold">About</a></li>
              <li><a href="/services/" className="typo-sm-bold">Services</a></li>
              <li><a href="/packages/" className="typo-sm-bold">Packages</a></li>
              <li><a href="/projects/" className="typo-sm-bold">Projects</a></li>
              <li><a href="/contact/" className="typo-sm-bold">Contact</a></li>
              <li>
                <CalendlyButton 
                  variant="primary" 
                  size="sm"
                  className="btn-small"
                  utmContent="header_desktop"
                  utmTerm="schedule_call"
                >
                  Schedule Call
                </CalendlyButton>
              </li>
              {/* <li><a href="#" className="typo-sm-bold">FR</a></li>
              <li><a href="#" className="typo-sm-bold">ES</a></li> */}
            </ul>
            <ul className="nav_mobile">
              <li>
                <CalendlyButton 
                  variant="primary" 
                  size="sm"
                  className="btn-small"
                  utmContent="header_mobile"
                  utmTerm="schedule_call"
                >
                  Schedule Call
                </CalendlyButton>
              </li>
              <li>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setMenuOpen(prev => !prev);
                  }}
                >
                  <Image
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
        <li><a href="/projects/" onClick={() => setMenuOpen(false)}>Projects</a></li>
        <li><a href="/contact/" onClick={() => setMenuOpen(false)}>Contact</a></li>
        {/* <li><a href="#" onClick={() => setMenuOpen(false)}>FR</a></li>
        <li><a href="#" onClick={() => setMenuOpen(false)}>ES</a></li> */}
      </ul>
    </>
  );

  // Effects already guard access to window. Render the same content server and client
  return renderHeaderContent();
};