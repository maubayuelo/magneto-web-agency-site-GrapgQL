import { fetchWPGraphQL } from '@/utils/wp-graphql';

export const HOME_PREFOOTER_QUERY = `
  query HomePrefooter {
    page(id: "home", idType: URI) {
      homePrefooter {
        title
        subtitle
        ctaText
        ctaLink {
          edges {
            node {
              id
              uri
            }
          }
        }
      }
    }
  }
`;

export async function getHomePrefooter() {
  const data = await fetchWPGraphQL(HOME_PREFOOTER_QUERY);
  //console.log('Prefooter data:', data);
  return data?.page?.homePrefooter || {};
}