import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';
import type { FinalCTAData } from './types';

const BG_FIELDS = `sourceUrl mediaDetails { sizes { name width height sourceUrl } }`;

export const FINAL_CTA_QUERY = `
  query finalCtaSection($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      finalCtaSection {
        title
        subtitle
        ctaText
        ctaLink
        bgimage {
          node {
            sourceUrl
            mediaDetails {
              sizes {
                name
                width
                height
                sourceUrl
              }
            }
            ${mediaOriginalFields(BG_FIELDS)}
          }
        }
      }
      }
    }
  }
`;

/** The final-CTA group of the locale's home page; {} when the locale has no home page (layout section). */
export async function getHomePrefooter(locale: Locale): Promise<FinalCTAData> {
  const data = await fetchWPGraphQL(FINAL_CTA_QUERY, wpLocaleVars(locale));
  const section = data?.pages?.nodes?.[0]?.finalCtaSection as FinalCTAData | undefined;
  if (!section) return {};
  return { ...section, bgimage: resolveMediaWrapper(section.bgimage) as FinalCTAData['bgimage'] };
}
