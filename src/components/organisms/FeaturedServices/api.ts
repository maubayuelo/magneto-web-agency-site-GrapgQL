import { fetchWPGraphQL } from "@/utils/wp-graphql";
import type { FeaturedServicesResponse } from './types';

const SERVICE_SECTION_QUERY = `
  query GetHomeFeaturedServices {
    page(id: "home", idType: URI) {
      homeFeaturedServices {
        title
        service {
          serviceTitle
          serviceDescription
          serviceIcon {
            node {
              sourceUrl
            }
          }
          anchorLink
        }
      }
    }
  }
`;

export async function getHomeFeaturedServices(): Promise<FeaturedServicesResponse> {
  try {
    const data = await fetchWPGraphQL(SERVICE_SECTION_QUERY);
    //console.log("Fetched data from GraphQL:", data);
    const result = data?.page?.homeFeaturedServices || {};
    // Normalize the response to match expected structure
    return {
      sectionTitle: result.title,
      service: result.service || []
    };
  } catch (error) {
    //console.error("GraphQL fetch error:", error);
    return {
      sectionTitle: 'Featured Services',
      service: []
    };
  }
}