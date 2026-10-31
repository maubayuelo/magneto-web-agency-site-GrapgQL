import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';
import type { FinalCTAData, FinalCtaSource } from './types';

const BG_FIELDS = `sourceUrl mediaDetails { sizes { name width height sourceUrl } }`;

const FINAL_CTA_FIELDS = `
      finalCtaSection {
        title
        subtitle
        ctaText
        ctaLink
        ctaPath
        secondaryCtaText
        secondaryCtaPath
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
      }`;

export const FINAL_CTA_QUERY = `
  query finalCtaSection($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {${FINAL_CTA_FIELDS}
      }
    }
  }
`;

export const FINAL_CTA_PAGE_QUERY = `
  query finalCtaSectionPage($name: String, $language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: $name }) {
      nodes {${FINAL_CTA_FIELDS}
      }
    }
  }
`;

export const FINAL_CTA_PROJECT_QUERY = `
  query finalCtaSectionProject($name: String, $language: String, $mediaOriginal: Boolean!) {
    projects(first: 1, where: { language: $language, name: $name }) {
      nodes {${FINAL_CTA_FIELDS}
      }
    }
  }
`;

interface FinalCtaResponse {
  pages?: { nodes?: Array<{ finalCtaSection?: FinalCTAData | null } | null> | null } | null;
  projects?: { nodes?: Array<{ finalCtaSection?: FinalCTAData | null } | null> | null } | null;
}

const nonEmpty = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim() !== '';

const resolveSection = (section: FinalCTAData | null | undefined): FinalCTAData | null =>
  section ? { ...section, bgimage: resolveMediaWrapper(section.bgimage) as FinalCTAData['bgimage'] } : null;

/** The final-CTA group of the locale's home page; {} when the locale has no home page. */
export async function getHomePrefooter(locale: Locale): Promise<FinalCTAData> {
  const data: FinalCtaResponse | undefined = await fetchWPGraphQL(FINAL_CTA_QUERY, wpLocaleVars(locale));
  return resolveSection(data?.pages?.nodes?.[0]?.finalCtaSection) ?? {};
}

/**
 * The final CTA of one page or project in `locale` (ADR 0006, decision 3).
 * - Its own `title` empty → the locale's home values, whole (never merged: pages carry orphan `subtitle`
 *   meta from an older hero field, which must not leak into the fallback).
 * - Its own values without a background image → the home background image.
 */
export async function getFinalCta(source: FinalCtaSource, locale: Locale): Promise<FinalCTAData> {
  if (source.kind === 'page' && source.name === 'home') return getHomePrefooter(locale);

  const isProject = source.kind === 'project';
  const data: FinalCtaResponse | undefined = await fetchWPGraphQL(isProject ? FINAL_CTA_PROJECT_QUERY : FINAL_CTA_PAGE_QUERY, {
    name: isProject ? source.slug : source.name,
    ...wpLocaleVars(locale),
  });
  const own = resolveSection((isProject ? data?.projects : data?.pages)?.nodes?.[0]?.finalCtaSection);

  if (own && nonEmpty(own.title) && own.bgimage?.node?.sourceUrl) return own;

  const home = await getHomePrefooter(locale);
  if (!own || !nonEmpty(own.title)) return home;
  return { ...own, bgimage: home.bgimage ?? null };
}
