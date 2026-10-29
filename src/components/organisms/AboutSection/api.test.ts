/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomeAboutSection } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getHomeAboutSection', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('es, state C: locale variables; descriptionHtml empty → body from the legacy description', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ homeAboutSection: { aboutSectionTitle: 'T', description: 'D', descriptionHtml: null } }] } });
    await expect(getHomeAboutSection('es')).resolves.toEqual({ aboutSectionTitle: 'T', description: 'D', descriptionHtml: null, bodyHtml: 'D' });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "home" })');
    expect(query).not.toContain('$mediaOriginal'); // no images: declaring an unused variable is a GraphQL error
    expect(variables).toEqual({ language: 'es', mediaOriginal: true });
  });

  it('state N: descriptionHtml wins; whitespace-only descriptionHtml counts as empty', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ homeAboutSection: { aboutSectionTitle: 'Meet Magneto', description: 'old', descriptionHtml: '<p>a</p>\n<p>b</p>\n' } }] } });
    await expect(getHomeAboutSection('en')).resolves.toMatchObject({ descriptionHtml: '<p>a</p>\n<p>b</p>\n', bodyHtml: '<p>a</p>\n<p>b</p>\n' });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toContain('descriptionHtml');
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ homeAboutSection: { aboutSectionTitle: 'T', description: 'old', descriptionHtml: ' \n' } }] } });
    await expect(getHomeAboutSection('en')).resolves.toMatchObject({ descriptionHtml: null, bodyHtml: 'old' });
  });

  it('both empty → bodyHtml ""', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ homeAboutSection: { aboutSectionTitle: 'T', description: null, descriptionHtml: null } }] } });
    await expect(getHomeAboutSection('en')).resolves.toMatchObject({ bodyHtml: '' });
  });

  it('{} on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeAboutSection('en')).resolves.toEqual({});
  });
});
