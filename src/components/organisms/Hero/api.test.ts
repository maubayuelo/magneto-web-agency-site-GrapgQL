/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getPageHero, heroPageName, PAGE_HERO_QUERY } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const UP = 'http://magneto-cms-2.local/wp-content/uploads/2025/08';
const size = (w: string, h: string) => ({ name: `rta_thumb_no_cropped_${w}x9999`, width: w, height: h, sourceUrl: `${UP}/hero-background-${w}x${h}.png` });
const FR_SIZES = [size('480', '320'), size('800', '533')];
const EN_SIZES = [...FR_SIZES, size('1024', '683'), size('1536', '1024')];

// Trimmed from the FR home response: heroTitle "[FR TEST] …", background node #53 fr (7 sizes) with #52 en (11).
const frHome = {
  title: 'Home',
  heroContent: {
    heroTitle: '[FR TEST] Attract More Aligned Clients Online',
    subtitleHero: 'From launch to growth, we build soulful systems that convert.',
    ctaTextHero: 'Book a Free Strategy Call',
    ctaLinkHero: 'https://calendly.com/magnetomarketing/free-strategy-call',
    image: null,
    backgroundImage: {
      node: {
        id: 'cG9zdDo1Mw==',
        sourceUrl: `${UP}/hero-background.png`,
        mediaDetails: { width: 1536, height: 1024, sizes: FR_SIZES },
        databaseId: 53,
        languageCode: 'fr',
        translations: [
          { languageCode: 'en', id: 'cG9zdDo1Mg==', sourceUrl: `${UP}/hero-background.png`, mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES } },
          { languageCode: 'es', id: 'cG9zdDo1NA==', sourceUrl: `${UP}/hero-background.png`, mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES } },
        ],
      },
    },
  },
};

describe('heroPageName', () => {
  it("'/' is the home page; any other pageUri is the page name", () => {
    expect(heroPageName('/')).toBe('home');
    expect(heroPageName('about-magneto')).toBe('about-magneto');
  });
});

describe('getPageHero', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('uses GraphQL variables (no interpolation) and the locale variables', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await getPageHero('services', 'fr');
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toBe(PAGE_HERO_QUERY);
    expect(query).toContain('pages(first: 1, where: { language: $language, name: $name })');
    expect(query).not.toContain('pageBy');
    expect(variables).toEqual({ language: 'fr', mediaOriginal: true, name: 'services' });
  });

  it('en variables; null on nodes: []', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getPageHero('home', 'en')).resolves.toBeNull();
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false, name: 'home' });
  });

  it('maps the FR fixture: FR copy text, background from the EN original (all sizes)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [frHome] } });
    const hero = await getPageHero('home', 'fr');
    expect(hero?.heroContent?.heroTitle).toBe('[FR TEST] Attract More Aligned Clients Online');
    expect(hero?.heroContent?.image).toBeNull();
    expect(hero?.heroContent?.backgroundImage).toEqual({
      node: { id: 'cG9zdDo1Mw==', sourceUrl: `${UP}/hero-background.png`, mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES } },
    });
  });
});
