import React from 'react';
import Image from 'next/image';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import HeroCTA from './HeroCTA';
import './Hero.scss';
import { getHomeHero } from './api';
import type { HomeHero } from './types';

export interface HeroProps {
  variant?: 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages' | 'default';
  title: string;
  subtitle: string;
  titleSize?: string;
  subtitleSize?: string;
  image?: { src: string; alt: string; width?: number; height?: number } | null;
  imageNode?: any | null;
  cta?: { text: string; href?: string; onClick?: () => void; type?: string; utmContent?: string | null; utmTerm?: string | null } | null;
  backgroundImage?: string | null;
  backgroundImageNode?: any | null;
  showImage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Hero({
  variant = 'default',
  title = '',
  subtitle = '',
  titleSize,
  subtitleSize,
  image = null,
  cta = null,
  backgroundImage,
  backgroundImageNode = null,
  showImage,
  className = '',
  children,
  imageNode = null,
}: HeroProps) {
  const defaultTitleSize = variant === 'home' ? 'typo-5xl-extrabold' : 'typo-4xl-extrabold';
  const defaultSubtitleSize = variant === 'home' ? 'typo-2xl-medium' : 'typo-xl-medium';
  const defaultShowImage = variant === 'home';

  const finalTitleSize = titleSize || defaultTitleSize;
  const finalSubtitleSize = subtitleSize || defaultSubtitleSize;
  const finalShowImage = typeof showImage === 'boolean' ? showImage : defaultShowImage;

  const defaultHeroImage = { src: '/assets/images/hero-main-visual.png', alt: 'Mauricio - Web Designer & Developer', width: 500, height: 500 };

  const finalImage = image || (finalShowImage ? defaultHeroImage : null);
  const heroClasses = `hero hero-${variant} ${className}`.trim();

  return (
    <div className="main pb-lg-responsive">
      <section className={heroClasses}>
        {/* Render dynamic background images using WpResponsiveImage or next/image (fill) to
            enable optimization and responsive sources. The SCSS contains a `.hero__bg`
            wrapper so the image can be absolutely positioned underneath the content. */}
        {backgroundImageNode && (
          <div className="hero__bg">
            <WpResponsiveImage image={backgroundImageNode as any} alt={backgroundImageNode?.altText || ''} className="hero__bg-image" fill omitSizeAttributes={false} priority />
          </div>
        )}

        {/* Fallback: if there's a backgroundImage string (CMS remote URL or static path),
            render a positioned next/image with fill so it benefits from optimization. */}
        {!backgroundImageNode && backgroundImage && (
          <div className="hero__bg">
            <Image src={backgroundImage} alt="" fill className="hero__bg-image" />
          </div>
        )}
        <div className="hero-content">
          <h1 className={`${finalTitleSize} m-0 hero-title`}>{title}</h1>
          <p className={`${finalSubtitleSize} m-0 hero-subtitle`}>{subtitle}</p>
          {children}

          {cta && (
            <div className="hero-cta-wrapper">
              <HeroCTA cta={cta} />
            </div>
          )}

          {finalShowImage && finalImage?.src && !imageNode && (
            <Image src={finalImage.src} alt={finalImage.alt ?? ''} width={finalImage.width || 500} height={finalImage.height || 500} priority className="hero-image" />
          )}

          {finalShowImage && imageNode && (
            <WpResponsiveImage image={imageNode as any} alt={imageNode?.altText ?? finalImage?.alt ?? 'Hero Image'} className="hero-image" omitSizeAttributes={false} priority width={500} height={500} />
          )}
        </div>
      </section>
    </div>
  );
}

export async function loadHomeHero(): Promise<Partial<HeroProps>> {
  try {
    const hero: HomeHero = await getHomeHero();
    const imageNode = (hero as any)?.heroImage || undefined;
    const image = imageNode && (imageNode as any).sourceUrl ? { src: (imageNode as any).sourceUrl, alt: (imageNode as any).altText || '', width: (imageNode as any).mediaDetails?.sizes?.[0]?.width || undefined, height: (imageNode as any).mediaDetails?.sizes?.[0]?.height || undefined } : undefined;
    const cta = hero?.cta ? { text: hero.cta.text || '', href: hero.cta.href || undefined, type: hero.cta.type || undefined, utmContent: hero.cta.utmContent || undefined, utmTerm: hero.cta.utmTerm || undefined } : null;

    return {
      title: hero?.title || '',
      subtitle: hero?.subtitle || '',
      image,
      imageNode,
      cta,
      backgroundImage: (hero as any)?.backgroundImage?.sourceUrl || undefined,
      // Do NOT force a variant here; the caller (pages or HeroLoader) should
      // decide which variant to render. Forcing 'home' caused the hero image
      // to appear on other pages that used the home loader.
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('loadHomeHero error:', e);
    return {};
  }
}

// Backwards-compatibility: pages import { HeroLoader } from this module.
// We export an async server component named `HeroLoader` below that fetches
// the hero data and renders the `Hero` component. Do not export the loader
// helper as `HeroLoader` to avoid it being used as a JSX component.

export default Hero;

// Server component wrapper kept for backward compatibility with pages that
// render <HeroLoader pageUri="..." variant="..." />. It fetches the same
// home hero data and returns the Hero component.
export async function HeroLoader({ pageUri, variant }: { pageUri?: string; variant?: HeroProps['variant'] }) {
  // Currently this loader always uses the home hero content. If you need
  // different behavior per pageUri, we can expand this to fetch page-specific
  // hero data later.
  const props = await loadHomeHero();
  return <Hero {...(props as HeroProps)} variant={variant || (props as any)?.variant || 'default'} />;
}
