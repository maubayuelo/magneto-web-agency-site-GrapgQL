import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';
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
    image: { node: (ImageNode & { id?: string }) | null } | null;
    backgroundImage: { node: (ImageNode & { id?: string }) | null } | null;
  } | null;
}

interface PageHeroResponse {
  pages: { nodes: PageHero[] | null } | null;
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
