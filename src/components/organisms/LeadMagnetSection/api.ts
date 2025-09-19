import { fetchWPGraphQL } from '@/utils/wp-graphql';

export const LEAD_MAGNET_SECTION_QUERY = `
  query LeadMagnetSection {
    page(id: "home", idType: URI) {
      leadMagnetSection {
        overTitleLeadMagnetSection
        titleLeadMagnetSection
        subtitleLeadMagnetSection
        ctaTextLeadMagnetSection
        ctaLinkLeadMagnetSection {
          node {
            id
          }
        }
      }
    }
  }
`;

export async function getLeadMagnetSection() {
  const data = await fetchWPGraphQL(LEAD_MAGNET_SECTION_QUERY);
  //console.log('getLeadMagnetSection data:', data);
  // The GraphQL returns the fields under `page.leadMagnetSection`
  return data?.page?.leadMagnetSection || {};
}
