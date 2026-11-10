import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import type { PrivacyPageData, PrivacyPageResponse } from './types';

// Language + slug (ADR 0004): never page(id, URI) / pageBy, which fall back to EN.
// No media: only $language is declared. WPGraphQL rejects a declared-but-unused $mediaOriginal; the extra
// variable sent by wpLocaleVars is ignored (as in AboutSection/api.ts).
export const PRIVACY_PAGE_QUERY = `
  query GetPrivacyPage($language: String) {
    pages(first: 1, where: { language: $language, name: "privacy-policy" }) {
      nodes {
        title
        content
      }
    }
  }
`;

const nonEmpty = (value: string | null | undefined): value is string => typeof value === 'string' && value.trim() !== '';

/** Maps the response; null when there is no page in that language or its content is empty (→ 404). */
export function mapPrivacyPage(data: PrivacyPageResponse | null | undefined): PrivacyPageData | null {
  const page = data?.pages?.nodes?.[0];
  if (!page || !nonEmpty(page.content)) return null;
  return { title: page.title?.trim() ?? '', html: page.content };
}

/** The `privacy-policy` page in `locale`, or null when it has no translation or no content. */
export async function getPrivacyPage(locale: Locale): Promise<PrivacyPageData | null> {
  const data: PrivacyPageResponse = await fetchWPGraphQL(PRIVACY_PAGE_QUERY, wpLocaleVars(locale));
  return mapPrivacyPage(data);
}
