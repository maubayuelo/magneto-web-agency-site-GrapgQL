import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveOriginalMedia } from '@/utils/wp-media';

const PACKAGES_QUERY = `
  query GetPackagesPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "packages" }) {
      nodes {
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
              ${mediaOriginalFields('id sourceUrl altText')}
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
  }
`;

/** The `packages` page in `locale`, or null when it has no translation (→ 404). */
export async function getPackagesPageData(locale: Locale) {
  const data = await fetchWPGraphQL(PACKAGES_QUERY, wpLocaleVars(locale));
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const pkg = page.packagesPackageFeatures;
  return {
    introText: page.pageintrotext?.pageIntroText || "",
    packages: (pkg?.packagesElements || []).map((el: any) => ({
      title: el.name,
      price: el.price,
      currency: "CAD",
      description: el.description,
      icon: resolveOriginalMedia(el.icon?.node)?.sourceUrl || "",
      isPopular: !!el.popularChoise,
      features: (el.features || []).map((f: any) => ({ text: f.feature })),
      variant: el.popularChoise ? "popular" : "default",
    })),
  };
}