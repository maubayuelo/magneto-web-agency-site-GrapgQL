import { fetchWPGraphQL } from "@/lib/wp-graphql";

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

export async function getHomeFeaturedServices() {
  try {
    const data = await fetchWPGraphQL(SERVICE_SECTION_QUERY);
    //console.log("Fetched data from GraphQL:", data);
    return data?.page?.homeFeaturedServices || {};
  } catch (error) {
    //console.error("GraphQL fetch error:", error);
    return {};
  }
}