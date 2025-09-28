import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { HomeHero } from './types';

export const HOME_HERO_QUERY = `
  query GetHeroContent {
    pageBy(uri: "home") {
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
            altText
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
`;

export async function getHomeHero(): Promise<HomeHero> {
  const data = await fetchWPGraphQL(HOME_HERO_QUERY);
  const page = data?.pageBy;
  const hc = page?.heroContent;

  // Map CMS shape (heroContent) to our HomeHero type
  const hero: HomeHero = {
    title: hc?.heroTitle || page?.title || undefined,
    subtitle: hc?.subtitleHero || undefined,
    heroImage: hc?.image?.node
      ? {
          sourceUrl: hc.image.node.sourceUrl || undefined,
          altText: hc.image.node.altText || undefined,
          mediaDetails: hc.image.node.mediaDetails || undefined,
        }
      : undefined,
    backgroundImage: hc?.backgroundImage?.node
      ? {
          sourceUrl: hc.backgroundImage.node.sourceUrl || undefined,
          mediaDetails: hc.backgroundImage.node.mediaDetails || undefined,
        }
      : undefined,
    cta: hc?.ctaTextHero
      ? {
          text: hc.ctaTextHero || undefined,
          href: hc.ctaLinkHero || undefined,
        }
      : null,
  };

  return hero || {};
}
