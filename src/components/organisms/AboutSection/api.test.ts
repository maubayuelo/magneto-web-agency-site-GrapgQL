/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomeAboutSection } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getHomeAboutSection', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('es: locale variables; reads the group of the ES home page', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ homeAboutSection: { aboutSectionTitle: 'T', description: 'D' } }] } });
    await expect(getHomeAboutSection('es')).resolves.toEqual({ aboutSectionTitle: 'T', description: 'D' });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "home" })');
    expect(query).not.toContain('$mediaOriginal'); // no images: declaring an unused variable is a GraphQL error
    expect(variables).toEqual({ language: 'es', mediaOriginal: true });
  });

  it('{} on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeAboutSection('en')).resolves.toEqual({});
  });
});
