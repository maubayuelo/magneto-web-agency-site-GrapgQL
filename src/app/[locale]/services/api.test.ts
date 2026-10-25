/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getServicesPageData } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getServicesPageData', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('es: locale variables; icon and image from the EN original', async () => {
    const copy = (lc: string, f: string) => ({ node: { id: lc, sourceUrl: `https://x/${f}-${lc}.png`, altText: lc, databaseId: 1, languageCode: lc, translations: [{ languageCode: 'en', id: 'en', sourceUrl: `https://x/${f}-en.png`, altText: 'en' }] } });
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ pageintrotext: { pageIntroText: 'I' }, servicesServiceDetails: { services: [{ title: 'S', featuredService: true, description: 'D', icon: copy('es', 'icon'), image: copy('es', 'img') }] } }] },
    });
    const page = await getServicesPageData('es');
    expect(page.servicesServiceDetails.services[0]).toEqual({
      title: 'S', featuredService: true, description: 'D',
      icon: { node: { id: 'es', sourceUrl: 'https://x/icon-en.png', altText: 'es' } },
      image: { node: { id: 'es', sourceUrl: 'https://x/img-en.png', altText: 'es' } },
    });
    expect(page.pageintrotext).toEqual({ pageIntroText: 'I' });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'es', mediaOriginal: true });
  });

  it('null on nodes: [] (→ 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getServicesPageData('fr')).resolves.toBeNull();
  });
});
