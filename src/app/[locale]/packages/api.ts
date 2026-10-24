import { fetchWPGraphQL } from '@/utils/wp-graphql';

const PACKAGES_QUERY = `
  query GetPackagesPageData {
    page(id: "packages", idType: URI) {
    pageintrotext {
      pageIntroText
    }
      packagesPackageFeatures {
        packagesElements {
          name
          popularChoise
          icon {
            node {
              id
              sourceUrl
              altText
            }
          }
          price
          description
          features {
            feature
          }
        }
      }
    }
  }
`;

export async function getPackagesPageData() {
  const data = await fetchWPGraphQL(PACKAGES_QUERY);
  const pkg = data?.page?.packagesPackageFeatures;
  return {
    introText: data?.page?.pageintrotext?.pageIntroText || "",
    packages: (pkg?.packagesElements || []).map((el: any) => ({
      title: el.name,
      price: el.price,
      currency: "CAD",
      description: el.description,
      icon: el.icon?.node?.sourceUrl || "",
      isPopular: !!el.popularChoise,
      features: (el.features || []).map((f: any) => ({ text: f.feature })),
      variant: el.popularChoise ? "popular" : "default",
    })),
  };
}