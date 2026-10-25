import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper, type WpMediaNode } from '@/utils/wp-media';

const SERVICE_IMAGE_FIELDS = 'id sourceUrl altText';

const SERVICES_PAGE_QUERY = `
  query GetServicesPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "services" }) {
      nodes {
    pageintrotext {
      pageIntroText
    }
      servicesServiceDetails {
        services {
          title
          featuredService
          description
          icon {
            node {
              id
              sourceUrl
              altText
              ${mediaOriginalFields(SERVICE_IMAGE_FIELDS)}
            }
          }
          image {
            node {
              id
              sourceUrl
              altText
              ${mediaOriginalFields(SERVICE_IMAGE_FIELDS)}
            }
          }
        }
      }
      }
    }
  }
`;

interface ServiceNode {
  icon?: { node?: WpMediaNode | null } | null;
  image?: { node?: WpMediaNode | null } | null;
}

/** The `services` page in `locale` (images from the EN original), or null when it has no translation (→ 404). */
export async function getServicesPageData(locale: Locale) {
  const data = await fetchWPGraphQL(SERVICES_PAGE_QUERY, wpLocaleVars(locale));
  //console.log('Services page data:', data);
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const services: ServiceNode[] | undefined = page.servicesServiceDetails?.services;
  if (!services) return page;
  return {
    ...page,
    servicesServiceDetails: {
      ...page.servicesServiceDetails,
      services: services.map((s) => ({ ...s, icon: resolveMediaWrapper(s.icon), image: resolveMediaWrapper(s.image) })),
    },
  };
}
