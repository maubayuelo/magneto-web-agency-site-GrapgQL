/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getAboutPageData } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const PORTRAIT = 'http://magneto-cms-2.local/wp-content/uploads/2026/10/mauricio-bayuelo-portrait-02.png';
const aboutData = { sectionTitle: 'The Founder', description: 'D', linkText: 'Visit LinkedIn Profile', linkUrl: 'https://www.linkedin.com/in/maubayuelo/', generalText: '<p>G</p>', calendlyText: null, calendlyUrl: null, descriptionHtml: null, ctaText: null, ctaPath: null };

describe('getAboutPageData', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('fr: sends the locale variables and queries the page by language + name', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await getAboutPageData('fr');
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "about-magneto" })');
    expect(query).not.toContain('idType: URI');
    expect(variables).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('null on nodes: [] (→ 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getAboutPageData('es')).resolves.toBeNull();
  });

  it('en: maps the recorded node with helper fields stripped', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ featuredImage: { node: { sourceUrl: PORTRAIT, altText: '', mediaDetails: { sizes: [] }, databaseId: 528, languageCode: 'en' } }, aboutData }] },
    });
    await expect(getAboutPageData('en')).resolves.toEqual({
      featuredImage: { node: { sourceUrl: PORTRAIT, altText: '', mediaDetails: { sizes: [] } } },
      aboutData,
      founder: { kind: 'text', text: 'D' },
      cta: null,
    });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false });
  });

  it('state N: descriptionHtml → founder html; ctaText + ctaPath → cta', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ featuredImage: null, aboutData: { ...aboutData, descriptionHtml: '<p><strong>Mauricio Bayuelo</strong> …</p>\n', ctaText: 'Tell me about your project', ctaPath: '/contact' } }] },
    });
    const page = await getAboutPageData('en');
    expect(page?.founder).toEqual({ kind: 'html', html: '<p><strong>Mauricio Bayuelo</strong> …</p>\n' });
    expect(page?.cta).toEqual({ text: 'Tell me about your project', path: '/contact' });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toMatch(/descriptionHtml[\s\S]*ctaText\s+ctaPath/);
  });

  it('cta needs both text and path; founder null when both descriptions are empty', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: { nodes: [{ featuredImage: null, aboutData: { ...aboutData, description: '', descriptionHtml: ' ', ctaText: 'Tell me about your project', ctaPath: '' } }] },
    });
    const page = await getAboutPageData('en');
    expect(page?.founder).toBeNull();
    expect(page?.cta).toBeNull();
  });
});
