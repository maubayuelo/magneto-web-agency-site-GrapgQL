import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { HomeHero } from './types';

export const HOME_HERO_QUERY = `
  query HomeHero {
    page(id: "home", idType: URI) {
      homeHero {
        title
        subtitle
        backgroundImage {
          sourceUrl
        }
        heroImage {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        cta {
          text
          href
          type
          utmContent
          utmTerm
        }
      }
    }
  }
`;

export async function getHomeHero(): Promise<HomeHero> {
  const data = await fetchWPGraphQL(HOME_HERO_QUERY);
  return (data?.page?.homeHero as HomeHero) || {};
}
