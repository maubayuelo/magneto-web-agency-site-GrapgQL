// filepath: [api.ts](http://_vscodecontentref_/0)
import { fetchWPGraphQL } from '@/lib/wp-graphql';

export const HOME_FOOTER_QUERY = `
  query HomeFooter {
    page(id: "home", idType: URI) {
      homeFooter {
        footerBgImage {
          node {
            sourceUrl
          }
        }
        footerLine1
        footerSocialIcons {
          iconSvg {
            node {
              sourceUrl
            }
          }
          iconUrl
        }
        footerLine2
      }
    }
  }
`;

export async function getHomeFooter() {
  const data = await fetchWPGraphQL(HOME_FOOTER_QUERY);
  //console.log('Full GraphQL response:', data);
  if (!data?.page) {
    console.error('No page data found. Check if the "home" page exists and has the ACF group.');
  }
  return data?.page?.homeFooter || {};
}