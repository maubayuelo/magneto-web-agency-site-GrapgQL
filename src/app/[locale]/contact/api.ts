import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveOriginalMedia } from '@/utils/wp-media';
import type { ContactMediaNode, ContactPageData, ContactPageResponse } from './types';

const FEATURED_FIELDS = `sourceUrl altText mediaDetails { sizes { sourceUrl width height name } }`;

// 5d-lite (ADR 0006 Amendment 2): the page renders no contactContactTexts text, so the group is not requested.
// The query still checks that the page exists in the request language (ADR 0004 → 404 otherwise).
export const CONTACT_PAGE_QUERY = `
  query GetContactPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "contact" }) {
      nodes {
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
export async function getContactPageData(locale: Locale): Promise<ContactPageData | null> {
  const data = (await fetchWPGraphQL(CONTACT_PAGE_QUERY, wpLocaleVars(locale))) as ContactPageResponse | null;
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const featuredImage = resolveOriginalMedia<ContactMediaNode>(page.featuredImage?.node);
  return {
    featuredImage: featuredImage
      ? {
          sourceUrl: featuredImage.sourceUrl || "",
          altText: featuredImage.altText || "",
          // include mediaDetails.sizes so downstream image helpers can pick
          // the most appropriate variant (width/height) instead of falling
          // back to a loose/default measurement which can produce tiny
          // variants during SSR.
          mediaDetails: {
            sizes: (featuredImage.mediaDetails?.sizes || []).map((s) => ({
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
