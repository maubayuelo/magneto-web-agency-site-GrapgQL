/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getPageExists, PAGE_EXISTS_QUERY } from './wp-page';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

describe('getPageExists', () => {
  beforeEach(() => {
    vi.mocked(fetchWPGraphQL).mockReset();
  });

  it('true when the page exists in the locale; sends language + name', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ databaseId: 535 }] } });
    await expect(getPageExists('home', 'fr')).resolves.toBe(true);
    expect(fetchWPGraphQL).toHaveBeenCalledWith(PAGE_EXISTS_QUERY, { language: 'fr', name: 'home' });
    expect(PAGE_EXISTS_QUERY).toContain('pages(first: 1, where: { language: $language, name: $name })');
  });

  it('false on nodes: [] (missing translation)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getPageExists('services', 'es')).resolves.toBe(false);
    expect(fetchWPGraphQL).toHaveBeenCalledWith(PAGE_EXISTS_QUERY, { language: 'es', name: 'services' });
  });

  it('false on pages: null; errors propagate (a CMS failure is not a 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: null });
    await expect(getPageExists('contact', 'fr')).resolves.toBe(false);
    vi.mocked(fetchWPGraphQL).mockRejectedValueOnce(new Error('WP GraphQL fetch failed'));
    await expect(getPageExists('packages', 'fr')).rejects.toThrow('WP GraphQL fetch failed');
  });
});
