/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { FINAL_CTA_PAGE_QUERY, FINAL_CTA_PROJECT_QUERY, FINAL_CTA_QUERY, getFinalCta, getHomePrefooter } from './api';

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

describe('getFinalCta (per page / project, home fallback)', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  const HOME = { title: 'Home T', subtitle: 'Home S', ctaText: 'Book', ctaLink: 'https://calendly.com/x', ctaPath: null, secondaryCtaText: null, secondaryCtaPath: null, bgimage: { node: { sourceUrl: BG, mediaDetails: null } } };
  const homeResponse = { pages: { nodes: [{ finalCtaSection: HOME }] } };

  it('home: one request, the home values', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'page', name: 'home' }, 'en')).resolves.toEqual(HOME);
    expect(fetchWPGraphQL).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toBe(FINAL_CTA_QUERY);
  });

  it('state C: page title empty (orphan subtitle meta) → the home values, whole, never merged', async () => {
    vi.mocked(fetchWPGraphQL)
      .mockResolvedValueOnce({ pages: { nodes: [{ finalCtaSection: { title: null, subtitle: 'Montreal-based solo agency…', ctaText: null, ctaLink: null, ctaPath: null, secondaryCtaText: null, secondaryCtaPath: null, bgimage: null } }] } })
      .mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'page', name: 'about-magneto' }, 'fr')).resolves.toEqual(HOME);
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toBe(FINAL_CTA_PAGE_QUERY);
    expect(query).toContain('pages(first: 1, where: { language: $language, name: $name })');
    expect(variables).toEqual({ name: 'about-magneto', language: 'fr', mediaOriginal: true });
    expect(vi.mocked(fetchWPGraphQL).mock.calls[1][1]).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('whitespace-only title counts as empty', async () => {
    vi.mocked(fetchWPGraphQL)
      .mockResolvedValueOnce({ pages: { nodes: [{ finalCtaSection: { title: '  ', subtitle: 'x' } }] } })
      .mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'page', name: 'services' }, 'en')).resolves.toEqual(HOME);
  });

  it('state N: page with its own values and no background → own values + the home background', async () => {
    const own = { title: 'Own T', subtitle: 'Own S', ctaText: 'Primary', ctaLink: null, ctaPath: '/contact', secondaryCtaText: 'Second', secondaryCtaPath: null, bgimage: null };
    vi.mocked(fetchWPGraphQL)
      .mockResolvedValueOnce({ pages: { nodes: [{ finalCtaSection: own }] } })
      .mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'page', name: 'packages' }, 'en')).resolves.toEqual({ ...own, bgimage: HOME.bgimage });
  });

  it('state N: own values with their own background → one request, nothing from home', async () => {
    const own = { title: 'Own T', subtitle: 'Own S', ctaText: 'C', ctaLink: null, ctaPath: null, secondaryCtaText: null, secondaryCtaPath: null, bgimage: { node: { sourceUrl: 'https://x/own.png', mediaDetails: null } } };
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ finalCtaSection: own }] } });
    await expect(getFinalCta({ kind: 'page', name: 'services' }, 'en')).resolves.toEqual(own);
    expect(fetchWPGraphQL).toHaveBeenCalledTimes(1);
  });

  it('project: queries projects by language + slug; own values', async () => {
    const own = { title: 'Dangel T', subtitle: 'S', ctaText: 'C', ctaLink: null, ctaPath: null, secondaryCtaText: null, secondaryCtaPath: null, bgimage: null };
    vi.mocked(fetchWPGraphQL)
      .mockResolvedValueOnce({ projects: { nodes: [{ finalCtaSection: own }] } })
      .mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'project', slug: 'fashion-company-ecommerce' }, 'es')).resolves.toEqual({ ...own, bgimage: HOME.bgimage });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toBe(FINAL_CTA_PROJECT_QUERY);
    expect(query).toContain('projects(first: 1, where: { language: $language, name: $name })');
    expect(variables).toEqual({ name: 'fashion-company-ecommerce', language: 'es', mediaOriginal: true });
  });

  it('nodes: [] (page or project) → the home values; home missing too → {}', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } }).mockResolvedValueOnce(homeResponse);
    await expect(getFinalCta({ kind: 'project', slug: 'nope' }, 'en')).resolves.toEqual(HOME);
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } }).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getFinalCta({ kind: 'page', name: 'nope' }, 'en')).resolves.toEqual({});
  });
});
