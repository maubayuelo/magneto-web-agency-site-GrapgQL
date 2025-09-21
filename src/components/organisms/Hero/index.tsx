import React from 'react';
import Image from "next/image";
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import { CalendlyButton } from '@/components/atoms';
import './Hero.scss';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { HOME_HERO_QUERY } from './api';
import type { HomeHero } from './types';

export interface HeroProps {
  variant?: 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages' | 'default';
  title: string;
  subtitle: string;
  titleSize?: string;
  subtitleSize?: string;
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  imageNode?: {
    sourceUrl?: string;
    altText?: string;
    mediaDetails?: {
      sizes?: {
        sourceUrl?: string;
        width?: number;
        height?: number;
      }[];
    };
  } | null;
  cta?: {
    text: string;
    href?: string;
    onClick?: () => void;
    type?: 'link' | 'calendly' | 'button';
    utmContent?: string;
    utmTerm?: string;
  } | null;
  backgroundImage?: string;
  showImage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Hero({
  variant = 'default',
  title,
  subtitle,
  titleSize,
  subtitleSize,
  image,
  cta = null,
  backgroundImage,
  showImage,
  className = '',
  children,
  imageNode
}: HeroProps) {
  // Set default sizes based on variant
  const defaultTitleSize = variant === 'home' ? 'typo-5xl-extrabold' : 'typo-4xl-extrabold';
  const defaultSubtitleSize = variant === 'home' ? 'typo-2xl-medium' : 'typo-xl-medium';
  const defaultShowImage = variant === 'home' ? true : false;
  
  const finalTitleSize = titleSize || defaultTitleSize;
  const finalSubtitleSize = subtitleSize || defaultSubtitleSize;
  const finalShowImage = showImage !== undefined ? showImage : defaultShowImage;
  
  // Default hero image for home variant
  const defaultHeroImage = {
    src: "/assets/images/hero-main-visual.png",
    alt: "Mauricio - Web Designer & Developer",
    width: 500,
    height: 500
  };
  
  const finalImage = image || (finalShowImage ? defaultHeroImage : null);
  
  const heroClasses = `hero hero-${variant} ${className}`.trim();
  
  return (
    <div className='main pb-lg-responsive'>
        <section className={heroClasses} style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}>
      <div className="hero-content">
        <h1 className={`${finalTitleSize} m-0 hero-title`}>{title}</h1>
        <p className={`${finalSubtitleSize} m-0 hero-subtitle`}>{subtitle}</p>
        {children}
         {cta && (
          <div className="hero-cta-wrapper">
            {/* 
              If the CTA is for Calendly (either by explicit type or by matching the Calendly URL),
              render the CalendlyButton which opens the modal.
              Otherwise, render a normal link or button.
            */}
            {(cta.type === 'calendly' || cta.href === "https://calendly.com/mauriciobayuelo/free-discovery-call") ? (
              <CalendlyButton 
                utmContent={cta.utmContent}
                utmTerm={cta.utmTerm}
                className="btn btn-primary typo-uppercase typo-extrabold"
              >
                {cta.text}
              </CalendlyButton>
            ) : cta.href ? (
              // If CTA has an href and is not Calendly, render as a normal link
              <a href={cta.href} className="btn btn-primary typo-uppercase typo-extrabold">
                {cta.text}
              </a>
            ) : (
              // Otherwise, render as a button (e.g., for onClick actions)
              <button onClick={cta.onClick} className="btn btn-primary typo-uppercase typo-extrabold">
                {cta.text}
              </button>
            )}
          </div>
        )}
        {finalImage?.src && !imageNode && (
          <Image
            src={finalImage.src}
            alt={finalImage.alt}
            width={finalImage.width || 500}
            height={finalImage.height || 500}
            priority
            className="hero-image"
          />
        )}

        {imageNode && (
          <WpResponsiveImage
            image={imageNode}
            alt={imageNode.altText || finalImage?.alt || 'Hero Image'}
            className="hero-image"
            omitSizeAttributes={false}
            priority
            // prefer a reasonably-sized rendered image for hero; Hero layout expects a fixed visual
            width={500}
            height={500}
          />
        )}
      </div>
    </section>
    </div>
  );
}
// ---------------------------
// Server-side loader helper
// ---------------------------
// This function can be used in server components to fetch the home hero content
// and return props suitable for the `Hero` component.
export async function loadHomeHero(): Promise<Partial<HeroProps>> {
  try {
    const data = await fetchWPGraphQL(HOME_HERO_QUERY);
    const hero: HomeHero = data?.page?.homeHero || {};

    const image = (hero.heroImage && hero.heroImage.sourceUrl && hero.heroImage.altText) ? {
      src: hero.heroImage.sourceUrl,
      alt: hero.heroImage.altText,
      // Derive width/height from mediaDetails.sizes if available (matches previous implementation)
      width: hero.heroImage.mediaDetails?.sizes?.[0]?.width || undefined,
      height: hero.heroImage.mediaDetails?.sizes?.[0]?.height || undefined,
    } : undefined;

    const ctaProp = hero.cta ? {
      text: hero.cta.text || '',
      href: hero.cta.href || undefined,
      type: hero.cta.type || undefined,
      utmContent: hero.cta.utmContent || undefined,
      utmTerm: hero.cta.utmTerm || undefined,
    } : null;

    return {
      title: hero.title || '',
      subtitle: hero.subtitle || '',
      image,
      cta: ctaProp,
      backgroundImage: hero.backgroundImage?.sourceUrl || undefined,
      variant: 'home'
    };
  } catch (e) {
    console.error('loadHomeHero error:', e);
    return {};
  }
}

// ---------------------------
// Client wrapper (previously HeroWithData)
// ---------------------------
// Keep as a small client component that fetches home hero on the client when used
// inside client-only pages.
export async function HeroLoader({ pageUri, variant = 'default' }: { pageUri: string; variant?: HeroProps['variant']; }) {
  // Preserve previous server-side loader behaviour by delegating to fetchWPGraphQL
  let about = null as any;
  try {
    const data = await fetchWPGraphQL(`
      query GetHeroContent {
        pageBy(uri: "${pageUri}") {
          title
          heroContent {
            heroTitle
            subtitleHero
            ctaTextHero
            ctaLinkHero
            image {
              node {
                id
                sourceUrl
                mediaDetails {
                  width
                  height
                  sizes {
                    name
                    width
                    height
                    sourceUrl
                  }
                }
              }
            }
            backgroundImage {
              node {
                id
                sourceUrl
                mediaDetails {
                  width
                  height
                  sizes {
                    name
                    width
                    height
                    sourceUrl
                  }
                }
              }
            }
          }
        }
      }
    `);
    about = data.pageBy;
  } catch (e) {
    console.error('GraphQL fetch error:', e);
  }

  const hero = about?.heroContent;

  return (
    <Hero
      variant={variant}
      title={hero?.heroTitle || about?.title || "Magneto"}
      subtitle={hero?.subtitleHero || ""}
      cta={hero?.ctaTextHero && hero?.ctaLinkHero ? { text: hero.ctaTextHero, href: hero.ctaLinkHero } : undefined}
      showImage={!!hero?.image?.node?.sourceUrl}
      image={
        hero?.image?.node?.sourceUrl
          ? { src: hero.image.node.sourceUrl, alt: about?.title || "Hero Image" }
          : undefined
      }
      imageNode={hero?.image?.node}
      backgroundImage={hero?.backgroundImage?.node?.sourceUrl || undefined}
    />
  );
}
