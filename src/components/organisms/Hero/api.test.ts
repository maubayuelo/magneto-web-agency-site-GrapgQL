/// <reference types="vitest" />
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getPageHero, heroPageName, resolveHeroCta, PAGE_HERO_QUERY } from './api';
import HeroLoader from './HeroLoader';
import HeroCTA from './HeroCTA';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));
// Vitest uses the classic JSX runtime (Known debt); HeroLoader.tsx has no React import.
(globalThis as { React?: typeof React }).React = React;
// HeroCTA reads the modal context; only the download branch uses it.
vi.mock('@/components/organisms/EmailCollectorProvider', () => ({ useEmailModal: () => ({ openModal: vi.fn() }) }));

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

// 5b §5.3 (B1): Hero CTA rule — the five required tests.
const STALE = 'https://calendly.com/mauriciobayuelo/free-discovery-call';
const LEGACY = { ctaTextHero: 'Book a Free Strategy Call', ctaLinkHero: STALE };
type HeroElement = React.ReactElement<{ cta?: { text: string; href: string } }>;
async function loaderCta(heroContent: object, locale: 'en' | 'fr' | 'es', requireInternalCta?: boolean) {
  vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ title: 'Packages', heroContent: { heroTitle: 'T', subtitleHero: 'S', image: null, backgroundImage: null, ...heroContent } }] } });
  const element = (await HeroLoader({ pageUri: 'packages', locale, variant: 'packages', requireInternalCta })) as HeroElement;
  return element.props.cta;
}

describe('Hero CTA rule (5b §5.3)', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('queries ctaPath next to the legacy CTA fields', () => {
    expect(PAGE_HERO_QUERY).toMatch(/ctaTextHero\s+ctaLinkHero\s+ctaPath/);
  });

  it.each([['en', '/contact'], ['fr', '/fr/contact'], ['es', '/es/contact']] as const)(
    '1. /contact + text + stale Calendly URL → localized internal <a>, no Calendly (%s)', async (locale, href) => {
      const hero = { ctaTextHero: 'Tell me about your project', ctaLinkHero: STALE, ctaPath: ' /contact ' };
      for (const required of [false, true]) {
        const cta = await loaderCta(hero, locale, required);
        expect(cta).toEqual({ text: 'Tell me about your project', href });
        const html = renderToStaticMarkup(React.createElement(HeroCTA, { cta }));
        expect(html).toBe(`<a href="${href}" class="btn btn-primary typo-uppercase typo-extrabold">Tell me about your project</a>`);
        expect(html).not.toMatch(/calendly/i);
      }
    });

  it.each(['/packages', 'https://x.co', '//x.co', '/contact?x=1', '/fr/contact', 'javascript:x'])(
    '2. non-allowlisted ctaPath %s without requireInternalCta → today\'s legacy CTA', async (ctaPath) => {
      expect(await loaderCta({ ...LEGACY, ctaPath }, 'en')).toEqual({ text: LEGACY.ctaTextHero, href: STALE });
    });

  it.each([null, '', '/packages', 'https://x.co', '/fr/contact'])(
    '3. requireInternalCta with ctaPath %s and a stale Calendly URL → no CTA', async (ctaPath) => {
      expect(await loaderCta({ ...LEGACY, ctaPath }, 'en', true)).toBeUndefined();
    });

  it.each([null, '', '   '])('4. /contact with blank ctaTextHero %s → no CTA in both modes', (ctaTextHero) => {
    for (const required of [false, true]) {
      expect(resolveHeroCta({ ctaTextHero, ctaLinkHero: STALE, ctaPath: '/contact' }, 'fr', required)).toBeUndefined();
    }
  });

  // Local EN heroes as read on 2026-10-31 (state C): ctaPath null on all six pages.
  it.each([
    ['home', 'https://calendly.com/magnetomarketing/free-strategy-call'],
    ['about-magneto', STALE], ['services', STALE], ['packages', STALE], ['projects', STALE], ['contact', STALE],
  ])('5. state C %s (ctaPath null, requireInternalCta false) → Hero CTA identical to the legacy rule', async (_page, link) => {
    const hero = { ctaTextHero: 'Book a Free Strategy Call', ctaLinkHero: link, ctaPath: null };
    expect(await loaderCta(hero, 'en')).toEqual({ text: 'Book a Free Strategy Call', href: link });
    expect(await loaderCta({ ...hero, ctaLinkHero: null }, 'en')).toBeUndefined();
    expect(await loaderCta({ ...hero, ctaTextHero: '' }, 'en')).toBeUndefined();
  });
});
