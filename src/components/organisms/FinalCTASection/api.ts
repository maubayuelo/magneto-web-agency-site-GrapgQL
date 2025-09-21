import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { FinalCTAData } from './types';

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

export async function getHomePrefooter(): Promise<FinalCTAData> {
  const data = await fetchWPGraphQL(FINAL_CTA_QUERY);
  return (data?.page?.finalCtaSection as FinalCTAData) || {};
}
