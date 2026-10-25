/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomeTestimonials } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getHomeTestimonials', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('es: locale variables; thumb from the EN original, locale altText', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ homeTestimonialsSection: { testimonials: [{ author: 'A', testimonial: 'Q', thumb: { node: { sourceUrl: 'https://x/es.png', altText: 'es', databaseId: 9, languageCode: 'es', translations: [{ languageCode: 'en', sourceUrl: 'https://x/en.png', altText: 'en' }] } } }] } }] },
    });
    await expect(getHomeTestimonials('es')).resolves.toEqual([{ author: 'A', testimonial: 'Q', thumb: { node: { sourceUrl: 'https://x/en.png', altText: 'es' } } }]);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'es', mediaOriginal: true });
  });

  it('[] on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeTestimonials('en')).resolves.toEqual([]);
  });
});
