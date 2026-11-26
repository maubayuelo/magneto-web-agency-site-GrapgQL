/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { buildCanonical } from '@/utils/seo';
import { GET } from './route';

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));

const PAGES = ['/', '/about-magneto', '/services', '/packages', '/projects', '/contact', '/privacy-policy'];

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe('GET /sitemap.xml', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('lists every page route, /packages included, then the project URLs', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      projects: { nodes: [{ slug: 'trepied-trepied-ca', modified: '2026-11-20T00:00:00' }] },
    });
    const res = await GET();
    const xml = await res.text();
    expect(res.headers.get('Content-Type')).toBe('application/xml');
    expect(locs(xml)).toEqual([...PAGES, '/projects/trepied-trepied-ca'].map((p) => buildCanonical(p)));
  });

  it('fallback sitemap (CMS error) still lists /packages', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchWPGraphQL).mockRejectedValueOnce(new Error('CMS down'));
    const xml = await (await GET()).text();
    expect(locs(xml)).toEqual(PAGES.map((p) => buildCanonical(p)));
  });
});
