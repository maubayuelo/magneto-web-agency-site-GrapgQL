import { fetchWPGraphQL } from "@/utils/wp-graphql";
import type { FeaturedServiceItem, FeaturedServicesResponse } from './types';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';

const SERVICE_SECTION_QUERY = `
  query GetHomeFeaturedServices($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      homeFeaturedServices {
        title
        service {
          serviceTitle
          serviceDescription
          serviceIcon {
            node {
              sourceUrl
              ${mediaOriginalFields('sourceUrl')}
            }
          }
          anchorLink
        }
      }
      }
    }
  }
`;

export async function getHomeFeaturedServices(locale: Locale): Promise<FeaturedServicesResponse> {
  try {
    const data = await fetchWPGraphQL(SERVICE_SECTION_QUERY, wpLocaleVars(locale));
    //console.log("Fetched data from GraphQL:", data);
    const result = data?.pages?.nodes?.[0]?.homeFeaturedServices || {};
    const services: FeaturedServiceItem[] = result.service || [];
    // Normalize the response to match expected structure
    return {
      sectionTitle: result.title,
      service: services.map((s) =>
        s.serviceIcon && typeof s.serviceIcon === 'object'
          ? { ...s, serviceIcon: resolveMediaWrapper(s.serviceIcon) as FeaturedServiceItem['serviceIcon'] }
          : s,
      ),
    };
  } catch (error) {
    //console.error("GraphQL fetch error:", error);
    return {
      sectionTitle: 'Featured Services',
      service: []
    };
  }
}