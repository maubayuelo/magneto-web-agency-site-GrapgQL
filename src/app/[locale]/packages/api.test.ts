/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getPackagesPageData } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getPackagesPageData', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('en: locale variables; maps packages as before', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ pageintrotext: { pageIntroText: 'Intro' }, packagesPackageFeatures: { packagesElements: [{ name: 'P', popularChoise: true, icon: { node: { id: 'i', sourceUrl: 'https://x/en.svg', altText: '', databaseId: 1, languageCode: 'en' } }, price: '900', description: 'D', features: [{ feature: 'F' }] }] } }] },
    });
    await expect(getPackagesPageData('en')).resolves.toEqual({
      introText: 'Intro',
      packages: [{ title: 'P', price: '900', currency: 'CAD', description: 'D', icon: 'https://x/en.svg', isPopular: true, features: [{ text: 'F' }], variant: 'popular' }],
    });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false });
  });

  it('fr: icon from the EN original; null on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ pageintrotext: null, packagesPackageFeatures: { packagesElements: [{ name: 'P', popularChoise: false, icon: { node: { id: 'i', sourceUrl: 'https://x/fr.svg', altText: '', databaseId: 2, languageCode: 'fr', translations: [{ languageCode: 'en', id: 'e', sourceUrl: 'https://x/en.svg', altText: '' }] } }, price: '1', description: 'D', features: [] }] } }] },
    });
    const data = await getPackagesPageData('fr');
    expect(data?.packages[0].icon).toBe('https://x/en.svg');
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'fr', mediaOriginal: true });
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getPackagesPageData('fr')).resolves.toBeNull();
  });
});
