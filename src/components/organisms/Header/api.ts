import { fetchWPGraphQL } from '@/utils/wp-graphql';

export const HOME_HEADER_QUERY = `
  query HomeHeader {
    page(id: "home", idType: URI) {
      homeHeader {
        logo {
          sourceUrl
        }
      }
    }
  }
`;

import type { HomeHeader } from './types';

export async function getHomeHeader(): Promise<HomeHeader> {
  const data = await fetchWPGraphQL(HOME_HEADER_QUERY);
  // fallback shape
  return (data?.page?.homeHeader as HomeHeader) || {};
}
