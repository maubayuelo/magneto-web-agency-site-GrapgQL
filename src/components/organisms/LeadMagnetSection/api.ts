import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { LeadMagnetSectionData, LinkNode } from './types';

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

export async function getLeadMagnetSection(): Promise<LeadMagnetSectionData> {
  const data = await fetchWPGraphQL(LEAD_MAGNET_SECTION_QUERY);
  const raw = (data?.page?.leadMagnetSection as LeadMagnetSectionData) || {};
  // Provide a normalized alias ctaLink to keep consuming code compatible
  const linkNode = raw.ctaLinkLeadMagnetSection as LinkNode | undefined | null;
  const normalized: LeadMagnetSectionData = {
    ...raw,
    ctaLink: linkNode?.node?.url || linkNode?.node?.uri || undefined,
  };
  return normalized;
}
