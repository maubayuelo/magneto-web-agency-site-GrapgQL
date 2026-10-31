import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveOriginalMedia } from '@/utils/wp-media';

import { contentBody, internalLink, richBody, text, uniqueAnchor } from './content';
import type { ServiceNode, ServiceItem, ServicesPageNode, ServicesPageData, ServicesResponse } from './types';

const SERVICE_IMAGE_FIELDS = 'id sourceUrl altText';

export const SERVICES_PAGE_QUERY = `
  query GetServicesPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "services" }) {
      nodes {
    pageintrotext {
      pageIntroText
      introBodyHtml
    }
      servicesServiceDetails {
        coreHeading
        supportingHeading
        supportingIntro
        services {
          title
          heading
          descriptionHtml
          serviceGroup
          ctaText
          ctaPath
          anchorId
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

const SERVICE_PATHS = ['/packages#build', '/packages#fix', '/packages#care'];

export function mapServicesPage(page: ServicesPageNode): ServicesPageData {
  const details = page.servicesServiceDetails;
  const used = new Set<string>();
  const issues: string[] = [];
  const services = (details?.services ?? []).filter((row): row is ServiceNode => row !== null).map((row, index): ServiceItem => {
    const rawGroup = row.serviceGroup?.[0];
    const group = rawGroup === 'core' || rawGroup === 'supporting' ? rawGroup : 'unclassified';
    if (rawGroup && group === 'unclassified') issues.push(`services[${index}]: unknown group`);
    const body = contentBody(row.descriptionHtml, row.description);
    const anchorId = uniqueAnchor(row.anchorId, used);
    if (text(row.anchorId) && !anchorId) issues.push(`services[${index}]: invalid or duplicate anchor`);
    const cta = group === 'supporting' ? null : internalLink(row.ctaText, row.ctaPath, SERVICE_PATHS);
    if ((text(row.ctaText) || text(row.ctaPath)) && !cta) issues.push(`services[${index}]: invalid, incomplete or supporting CTA`);
    const image = resolveOriginalMedia(row.image?.node);
    const icon = resolveOriginalMedia(row.icon?.node);
    return {
      title: text(row.title), heading: text(row.heading), body, group, anchorId, cta,
      featured: Boolean(row.featuredService) && body?.kind !== 'html',
      image: image?.sourceUrl ? { src: image.sourceUrl, alt: image.altText || text(row.title) } : null,
      icon: icon?.sourceUrl ? { src: icon.sourceUrl, alt: icon.altText || text(row.title) } : null,
    };
  });
  return {
    introTitle: text(page.pageintrotext?.pageIntroText), introBody: richBody(page.pageintrotext?.introBodyHtml),
    coreHeading: text(details?.coreHeading), supportingHeading: text(details?.supportingHeading),
    supportingIntro: text(details?.supportingIntro), services, issues,
  };
}

/** Missing locale page is null; transport errors propagate to the route error state. */
export async function getServicesPageData(locale: Locale): Promise<ServicesPageData | null> {
  const data: ServicesResponse | undefined = await fetchWPGraphQL(SERVICES_PAGE_QUERY, wpLocaleVars(locale));
  const page = data?.pages?.nodes?.[0];
  return page ? mapServicesPage(page) : null;
}
