/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomePrefooter } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const BG = 'http://magneto-cms-2.local/wp-content/uploads/2025/08/hero-background.png';

describe('getHomePrefooter (final CTA)', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('fr: locale variables; background from the EN original', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ finalCtaSection: { title: 'T', subtitle: 'S', ctaText: 'C', ctaLink: 'https://calendly.com/x', bgimage: { node: { sourceUrl: BG, mediaDetails: { sizes: [{ name: 'a' }] }, databaseId: 53, languageCode: 'fr', translations: [{ languageCode: 'en', sourceUrl: BG, mediaDetails: { sizes: [{ name: 'a' }, { name: 'b' }] } }] } } } }] },
    });
    const data = await getHomePrefooter('fr');
    expect(data.bgimage).toEqual({ node: { sourceUrl: BG, mediaDetails: { sizes: [{ name: 'a' }, { name: 'b' }] } } });
    expect(data.title).toBe('T');
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('en variables; {} on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomePrefooter('en')).resolves.toEqual({});
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false });
  });
});
