import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';

const FEATURED_FIELDS = `sourceUrl altText mediaDetails { sizes { sourceUrl width height name } }`;

const ABOUT_PAGE_QUERY = `
  query GetAboutPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "about-magneto" }) {
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
      aboutData {
        sectionTitle
        description
        descriptionHtml
        linkText
        linkUrl
        generalText
        calendlyText
        calendlyUrl
        ctaText
        ctaPath
      }
      }
    }
  }
`;

// The shape WpResponsiveImage reads.
interface AboutImage {
  sourceUrl?: string;
  altText?: string;
  mediaDetails?: { sizes?: { sourceUrl?: string; width?: number; height?: number }[] };
}

// Optional strings: the page renders whatever WordPress returns (null included), as before.
export interface AboutPageData {
  // Not queried (always undefined, as before); generateMetadata falls back. Localized SEO is Phase 7.
  title?: string;
  meta_description?: string;
  featuredImage?: ({ node?: AboutImage | null } & { sourceUrl?: string; altText?: string }) | null;
  aboutData: {
    sectionTitle?: string;
    description?: string;
    linkText?: string;
    linkUrl?: string;
    generalText: string;
    calendlyText?: string;
    calendlyUrl?: string;
    descriptionHtml?: string | null;
    ctaText?: string | null;
    ctaPath?: string | null;
  };
  /**
   * Founder text: `descriptionHtml` as HTML (sanitize before rendering), else the legacy `description` as a
   * text node (it is a `text` field; ADR 0006 expand/contract). null when both are empty.
   */
  founder: { kind: 'html'; html: string } | { kind: 'text'; text: string } | null;
  /** Bottom button when both `ctaText` and `ctaPath` are set; otherwise null (→ the current CalendlyButton). */
  cta: { text: string; path: string } | null;
}

const nonEmpty = (value: string | null | undefined): value is string => typeof value === 'string' && value.trim() !== '';

/** The `about-magneto` page in `locale`, or null when it has no translation (→ 404). */
export async function getAboutPageData(locale: Locale): Promise<AboutPageData | null> {
  const data = await fetchWPGraphQL(ABOUT_PAGE_QUERY, wpLocaleVars(locale));
  //console.log('About page data:', data);
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  const about: AboutPageData['aboutData'] = page.aboutData ?? { generalText: '' };
  const founder: AboutPageData['founder'] = nonEmpty(about.descriptionHtml)
    ? { kind: 'html', html: about.descriptionHtml }
    : nonEmpty(about.description)
      ? { kind: 'text', text: about.description }
      : null;
  const cta = nonEmpty(about.ctaText) && nonEmpty(about.ctaPath) ? { text: about.ctaText.trim(), path: about.ctaPath.trim() } : null;
  return {
    ...page,
    featuredImage: resolveMediaWrapper(page.featuredImage) ?? page.featuredImage,
    founder,
    cta,
  } as AboutPageData;
}
