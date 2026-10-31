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
      pages: { nodes: [{ homeTestimonialsSection: { testimonials: [{ author: 'A', testimonial: 'Q', role: 'R', company: null, city: null, note: null, thumb: { node: { sourceUrl: 'https://x/es.png', altText: 'es', databaseId: 9, languageCode: 'es', translations: [{ languageCode: 'en', sourceUrl: 'https://x/en.png', altText: 'en' }] } } }] } }] },
    });
    await expect(getHomeTestimonials('es')).resolves.toEqual([{ author: 'A', testimonial: 'Q', role: 'R', company: null, city: null, note: null, thumb: { node: { sourceUrl: 'https://x/en.png', altText: 'es' } } }]);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toMatch(/testimonial\s+role\s+company\s+city\s+note/);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'es', mediaOriginal: true });
  });

  it('state C: the 4 placeholder rows (no role) are never returned', async () => {
    const placeholder = (author: string) => ({ author, testimonial: 'Great work!', role: null, company: null, city: null, note: null, thumb: null });
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ homeTestimonialsSection: { testimonials: ['Elena M.', 'Marcus T.', 'Sarah K.', 'David R.'].map(placeholder) } }] },
    });
    await expect(getHomeTestimonials('en')).resolves.toEqual([]);
  });

  it('state N: keeps rows with a role (whitespace-only role dropped), typed, empty optionals → null', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ homeTestimonialsSection: { testimonials: [
        { author: 'Dangel Manik', testimonial: 'Quote 1', role: 'Holistic therapist', company: '', city: 'Montreal', note: 'Translated from Spanish.', thumb: null },
        { author: 'Israel Valencia Vázquez', testimonial: 'Quote 2', role: 'Founder & video producer', company: 'TRÉPIED', city: null, note: '  ', thumb: null },
        { author: 'Elena M.', testimonial: 'Placeholder', role: '   ', company: null, city: null, note: null, thumb: null },
      ] } }] },
    });
    await expect(getHomeTestimonials('en')).resolves.toEqual([
      { author: 'Dangel Manik', testimonial: 'Quote 1', role: 'Holistic therapist', company: null, city: 'Montreal', note: 'Translated from Spanish.', thumb: null },
      { author: 'Israel Valencia Vázquez', testimonial: 'Quote 2', role: 'Founder & video producer', company: 'TRÉPIED', city: null, note: null, thumb: null },
    ]);
  });

  it('[] on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeTestimonials('en')).resolves.toEqual([]);
  });
});
