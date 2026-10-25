/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getContactPageData } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getContactPageData', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('fr: locale variables; featured image from the EN original', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ contactContactTexts: { mainCopy: 'M', tagText: 'T', bodytext: 'B' }, featuredImage: { node: { sourceUrl: 'https://x/fr.png', altText: 'fr', mediaDetails: { sizes: [] }, databaseId: 1, languageCode: 'fr', translations: [{ languageCode: 'en', sourceUrl: 'https://x/en.png', altText: 'en', mediaDetails: { sizes: [{ sourceUrl: 'https://x/en-800.png', width: '800', height: '600', name: 'm' }] } }] } } }] },
    });
    await expect(getContactPageData('fr')).resolves.toEqual({
      mainCopy: 'M', tagText: 'T', bodytext: 'B',
      featuredImage: { sourceUrl: 'https://x/en.png', altText: 'fr', mediaDetails: { sizes: [{ sourceUrl: 'https://x/en-800.png', width: '800', height: '600', name: 'm' }] } },
    });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "contact" })');
    expect(variables).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('null on nodes: [] (→ 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getContactPageData('es')).resolves.toBeNull();
  });
});
