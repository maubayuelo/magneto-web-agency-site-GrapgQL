// Localized WordPress page lookups shared by routes (ADR 0004, D1/D2).
import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { toWpLanguage } from '@/i18n/wp';
import { fetchWPGraphQL } from './wp-graphql';

export const PAGE_EXISTS_QUERY = `
  query PageExists($language: String, $name: String) {
    pages(first: 1, where: { language: $language, name: $name }) {
      nodes {
        databaseId
      }
    }
  }
`;

interface PageExistsResponse {
  pages: { nodes: { databaseId: number }[] | null } | null;
}

/**
 * True when the WordPress page `name` (slug) exists in `locale`. Used by routes without their own page
 * fetch (home) to return 404 for a missing translation. Errors propagate: a CMS failure is not a 404.
 */
export const getPageExists = cache(async (name: string, locale: Locale): Promise<boolean> => {
  const data: PageExistsResponse | undefined = await fetchWPGraphQL(PAGE_EXISTS_QUERY, {
    language: toWpLanguage(locale),
    name,
  });
  return (data?.pages?.nodes?.length ?? 0) > 0;
});
