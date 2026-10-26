import { Hero } from './index';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { getPageHero, heroPageName, type PageHero } from './api';


interface HeroLoaderProps {
  pageUri: string;
  locale: Locale;
  variant?: 'default' | 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages';
}

export default async function HeroLoader({ pageUri, locale, variant = 'default' }: HeroLoaderProps) {
  let about: PageHero | null = null;
  try {
    about = await getPageHero(heroPageName(pageUri), locale);
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
      // Only show the hero image on the home variant. Some pages provide a
      // CMS image but the design requires the visual only on the home page.
      showImage={variant === 'home' ? !!hero?.image?.node?.sourceUrl : false}
      image={
        variant === 'home' && hero?.image?.node?.sourceUrl
          ? { src: hero.image.node.sourceUrl, alt: about?.title || getDictionary(locale).cmsFallback.heroImageAlt }
          : undefined
      }
      imageNode={variant === 'home' ? hero?.image?.node : undefined}
  backgroundImage={hero?.backgroundImage?.node?.sourceUrl || undefined}
    />
  );
}