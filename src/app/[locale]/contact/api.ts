import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveOriginalMedia } from '@/utils/wp-media';

const FEATURED_FIELDS = `sourceUrl altText mediaDetails { sizes { sourceUrl width height name } }`;

const CONTACT_PAGE_QUERY = `
  query GetContactPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "contact" }) {
      nodes {
      contactContactTexts {
        mainCopy
        tagText
        bodytext
      }
        featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            sizes {
              sourceUrl
              width
              height
              name
            }
          }
          ${mediaOriginalFields(FEATURED_FIELDS)}
        }
      }
      }
    }
  }
`;

/** The `contact` page in `locale`, or null when it has no translation (→ 404). */
export async function getContactPageData(locale: Locale) {
  const data = await fetchWPGraphQL(CONTACT_PAGE_QUERY, wpLocaleVars(locale));
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const contact = page.contactContactTexts;
  const featuredImage = resolveOriginalMedia(page.featuredImage?.node);
  return {
    mainCopy: contact?.mainCopy || "",
    tagText: contact?.tagText || "",
    bodytext: contact?.bodytext || "",
    featuredImage: featuredImage
      ? {
          sourceUrl: featuredImage.sourceUrl || "",
          altText: featuredImage.altText || "",
          // include mediaDetails.sizes so downstream image helpers can pick
          // the most appropriate variant (width/height) instead of falling
          // back to a loose/default measurement which can produce tiny
          // variants during SSR.
          mediaDetails: {
            sizes: (featuredImage.mediaDetails?.sizes || []).map((s: any) => ({
              sourceUrl: s.sourceUrl,
              width: s.width,
              height: s.height,
              name: s.name,
            })),
          },
        }
      : null,
  };
}