import { fetchWPGraphQL } from '@/utils/wp-graphql';

export const HOME_HEADER_QUERY = `
  query HomeHeader {
    page(id: "home", idType: URI) {
  # Historically the logo was exposed under 'homeFooter.logo' on some CMS installs.
  # Some WP GraphQL schemas on other environments don't expose a 'logo' field on
  # the 'HomeFooter' type which causes the query to error. To avoid a hard
  # failure in the dev overlay we only request the containing 'homeFooter' node
  # here and read the 'logo' property dynamically at runtime if present.
      homeFooter {
        footerLine1
        footerLine2
      }
    }
  }
`;

import type { HomeHeader } from './types';

export async function getHomeHeader(): Promise<HomeHeader> {
  try {
    const data = await fetchWPGraphQL(HOME_HEADER_QUERY);
    // Some CMS installs include `logo` under `page.homeFooter`. Read it if present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hf = data?.page?.homeFooter as any | undefined;
    if (hf && hf.logo && (hf.logo.sourceUrl || hf.logo?.node?.sourceUrl)) {
      // Support either { logo: { sourceUrl } } or nested node shapes
      const sourceUrl = hf.logo.sourceUrl || hf.logo?.node?.sourceUrl;
      return { logo: { sourceUrl } } as HomeHeader;
    }
    return {} as HomeHeader;
  } catch (err) {
    // Don't rethrow GraphQL errors here to avoid the dev overlay showing for
    // optional CMS fields (like logo). Log the error for debug, but return an
    // empty object so callers can fall back to a local asset.
    // Keep the console.error so developers can still see the failure details.
    // eslint-disable-next-line no-console
    console.error('Failed to fetch home header (logo may be missing from CMS schema):', err);
    return {} as HomeHeader;
  }
}
