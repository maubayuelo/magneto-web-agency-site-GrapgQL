import DOMPurify from 'isomorphic-dompurify';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveOriginalMedia } from '@/utils/wp-media';

import { contentBody, internalLink, richBody, text, uniqueAnchor } from '../services/content';
import type { PackageContent, PackageNode, PackagesPageNode, PackagesPageData, PackagesResponse } from './types';

export const PACKAGES_QUERY = `
  query GetPackagesPageData($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "packages" }) {
      nodes {
    pageintrotext {
      pageIntroText
      introBodyHtml
    }
      packagesContentSections { sections { heading bodyHtml } }
      packagesPackageFeatures {
        packagesElements {
          name
          heading
          descriptionHtml
          featuresTitle
          ctaText
          ctaPath
          anchorId
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

export function mapPackagesPage(page: PackagesPageNode): PackagesPageData {
  const rows = (page.packagesPackageFeatures?.packagesElements ?? []).filter((row): row is PackageNode => row !== null);
  const used = new Set<string>();
  const issues: string[] = [];
  // popularChoise is read but never rendered: no badge in state C or N (AC-3, AC-7).
  const content = rows.map((row, index): PackageContent => {
    const body = contentBody(row.descriptionHtml, row.description);
    const rich = body?.kind === 'html';
    const cta = internalLink(row.ctaText, row.ctaPath, ['/contact']);
    const hasNewCta = text(row.ctaText) !== '' || text(row.ctaPath) !== '';
    if (!cta && (rich || hasNewCta)) issues.push(`packages[${index}]: missing, invalid or incomplete CTA`);
    const anchorId = uniqueAnchor(row.anchorId, used);
    if (text(row.anchorId) && !anchorId) issues.push(`packages[${index}]: invalid or duplicate anchor`);
    return {
      title: text(row.name), heading: text(row.heading), body,
      price: rich ? '' : row.price || '', currency: rich ? '' : 'CAD',
      features: rich ? [] : (row.features ?? []).flatMap((f) => f?.feature ? [{ text: f.feature }] : []),
      featuresTitle: rich ? '' : text(row.featuresTitle),
      anchorId, cta, ctaMode: cta ? 'link' : rich || hasNewCta ? 'none' : 'legacy',
      icon: resolveOriginalMedia(row.icon?.node)?.sourceUrl || '',
    };
  });
  const sections = (page.packagesContentSections?.sections ?? []).flatMap((row) => {
    if (!row) return [];
    const heading = text(row.heading);
    const body = richBody(row.bodyHtml);
    return heading || body ? [{ heading, body }] : [];
  });
  return { introText: page.pageintrotext?.pageIntroText || '',
    content: { introBody: richBody(page.pageintrotext?.introBodyHtml), packages: content, sections }, issues };
}

/** null = no page in this language (→ notFound); a CMS error is thrown and handled by the page (error state). */
export async function getPackagesPageData(locale: Locale): Promise<PackagesPageData | null> {
  const data: PackagesResponse | undefined = await fetchWPGraphQL(PACKAGES_QUERY, wpLocaleVars(locale));
  const page = data?.pages?.nodes?.[0];
  return page ? mapPackagesPage(page) : null;
}

/** Legacy intro (state C): newlines → <br />, then sanitized (D-S). */
export function legacyIntroHtml(introText: string): string {
  return DOMPurify.sanitize(introText.replace(/\r?\n/g, '<br />'));
}
