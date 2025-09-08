import { fetchWPGraphQL } from '@/utils/wp-graphql';

const SERVICES_PAGE_QUERY = `
  query GetServicesPageData {
    page(id: "services", idType: URI) {
      servicesServiceDetails {
        services {
          title
          description
          icon {
            node {
              id
              sourceUrl
              altText
            }
          }
          image {
            node {
              id
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

export async function getServicesPageData() {
  const data = await fetchWPGraphQL(SERVICES_PAGE_QUERY);
  //console.log('Services page data:', data);
  return data?.page || {};
}
