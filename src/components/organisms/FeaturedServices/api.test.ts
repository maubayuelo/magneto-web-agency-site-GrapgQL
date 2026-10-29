/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomeFeaturedServices } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getHomeFeaturedServices', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('fr: locale variables; icons from the EN original', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ homeFeaturedServices: { title: 'Featured', service: [{ serviceTitle: 'S', serviceDescription: 'D', anchorLink: '#a', serviceIcon: { node: { sourceUrl: 'https://x/fr.svg', databaseId: 1, languageCode: 'fr', translations: [{ languageCode: 'en', sourceUrl: 'https://x/en.svg' }] } } }] } }] },
    });
    await expect(getHomeFeaturedServices('fr')).resolves.toEqual({
      sectionTitle: 'Featured',
      service: [{ serviceTitle: 'S', serviceDescription: 'D', anchorLink: '#a', serviceIcon: { node: { sourceUrl: 'https://x/en.svg' } } }],
    });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('state N: serviceTagline is queried and passed through (state C: null)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ homeFeaturedServices: { title: null, service: [
        { serviceTitle: 'BUILD', serviceTagline: 'A website that works as hard as you do.', serviceDescription: 'D', anchorLink: 'build', serviceIcon: null },
        { serviceTitle: 'Old', serviceTagline: null, serviceDescription: 'D', anchorLink: null, serviceIcon: null },
      ] } }] },
    });
    const result = await getHomeFeaturedServices('en');
    expect(result.service?.map((s) => s.serviceTagline)).toEqual(['A website that works as hard as you do.', null]);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toMatch(/serviceTitle\s+serviceTagline\s+serviceDescription/);
  });

  it('empty list on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeFeaturedServices('en')).resolves.toEqual({ sectionTitle: undefined, service: [] });
  });
});
