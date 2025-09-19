import { fetchWPGraphQL } from '@/utils/wp-graphql';

export const FINAL_CTA_QUERY = `
  query finalCtaSection {
    page(id: "home", idType: URI) {
      finalCtaSection {
        title
        subtitle
        ctaText
        ctaLink
        bgimage {
          node {
            sourceUrl
          }
        }
      }
    }
  }
`;

export async function getHomePrefooter() {
  const data = await fetchWPGraphQL(FINAL_CTA_QUERY);
  //console.log('Prefooter data:', data);
  // The GraphQL returns the fields under `page.finalCtaSection`
  return data?.page?.finalCtaSection || {};
}
