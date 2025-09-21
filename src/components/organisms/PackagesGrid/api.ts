import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { PackageItem } from './types';

export const HOME_PACKAGES_QUERY = `
  query HomePackages {
    page(id: "home", idType: URI) {
      homePackages {
        packages {
          title
          description
          price
          features
          icon {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

export async function getHomePackages(): Promise<PackageItem[]> {
  const data = await fetchWPGraphQL(HOME_PACKAGES_QUERY);
  const raw = (data?.page?.homePackages?.packages as any[]) || [];
  const packages = raw.map((el) => ({
    title: el.title,
    description: el.description,
    price: el.price,
    features: el.features,
    icon: el.icon?.node?.sourceUrl || null,
  })) as PackageItem[];
  return packages;
}
