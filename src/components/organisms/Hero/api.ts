import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';
import { localizePath } from '@/i18n/paths';
import type { ImageNode } from './types';

const HERO_IMAGE_FIELDS = `id sourceUrl mediaDetails { width height sizes { name width height sourceUrl } }`;

export const PAGE_HERO_QUERY = `
  query GetHeroContent($language: String, $name: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: $name }) {
      nodes {
        title
        heroContent {
          heroTitle
          subtitleHero
          ctaTextHero
          ctaLinkHero
          ctaPath
          image {
            node {
              ${HERO_IMAGE_FIELDS}
              ${mediaOriginalFields(HERO_IMAGE_FIELDS)}
            }
          }
          backgroundImage {
            node {
              ${HERO_IMAGE_FIELDS}
              ${mediaOriginalFields(HERO_IMAGE_FIELDS)}
            }
          }
        }
      }
    }
  }
`;

export interface PageHero {
  title: string | null;
  heroContent: {
    heroTitle: string | null;
    subtitleHero: string | null;
    ctaTextHero: string | null;
    ctaLinkHero: string | null;
    ctaPath?: string | null;
    image: { node: (ImageNode & { id?: string }) | null } | null;
    backgroundImage: { node: (ImageNode & { id?: string }) | null } | null;
  } | null;
}

interface PageHeroResponse {
  pages: { nodes: PageHero[] | null } | null;
}

export interface HeroCtaLink { text: string; href: string }

/**
 * Hero CTA rule (5b §5.3, B1). `ctaPath` is an internal path that wins over the legacy booking link:
 * 1. ctaPath "/contact" + nonblank text → internal link, localized once (no Calendly, whatever ctaLinkHero holds).
 * 2. otherwise, requireInternalCta → no CTA (a rich Packages page never falls back to the booking link).
 * 3. otherwise → legacy behavior, unchanged: text && ctaLinkHero.
 */
export function resolveHeroCta(
  hero: Pick<NonNullable<PageHero['heroContent']>, 'ctaTextHero' | 'ctaLinkHero' | 'ctaPath'> | null | undefined,
  locale: Locale,
  requireInternalCta = false,
): HeroCtaLink | undefined {
  const text = typeof hero?.ctaTextHero === 'string' ? hero.ctaTextHero.trim() : '';
  if (typeof hero?.ctaPath === 'string' && hero.ctaPath.trim() === '/contact') {
    return text ? { text, href: localizePath('/contact', locale) } : undefined;
  }
  if (requireInternalCta) return undefined;
  return hero?.ctaTextHero && hero?.ctaLinkHero ? { text: hero.ctaTextHero, href: hero.ctaLinkHero } : undefined;
}

/** Page name (slug) for a HeroLoader `pageUri`: '/' is the home page, anything else is used as is. */
export function heroPageName(pageUri: string): string {
  return pageUri === '/' ? 'home' : pageUri;
}

/** Hero fields of the WordPress page `name` in `locale` (images from the EN original), or null if missing. */
export async function getPageHero(name: string, locale: Locale): Promise<PageHero | null> {
  const data: PageHeroResponse | undefined = await fetchWPGraphQL(PAGE_HERO_QUERY, { ...wpLocaleVars(locale), name });
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const hero = page.heroContent;
  if (!hero) return page;
  return {
    ...page,
    heroContent: {
      ...hero,
      image: resolveMediaWrapper(hero.image) as NonNullable<PageHero['heroContent']>['image'],
      backgroundImage: resolveMediaWrapper(hero.backgroundImage) as NonNullable<PageHero['heroContent']>['backgroundImage'],
    },
  };
}
