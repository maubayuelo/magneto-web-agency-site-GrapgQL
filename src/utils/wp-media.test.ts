/// <reference types="vitest" />
import { mediaOriginalFields, resolveMediaWrapper, resolveOriginalMedia } from './wp-media';

const UP = 'http://magneto-cms-2.local/wp-content/uploads/2025/08';
const size = (w: string) => ({ name: `rta_${w}`, width: w, height: '1', sourceUrl: `${UP}/hero-background-${w}.png` });
const EN_SIZES = ['480', '800', '1024', '1536'].map(size);
const FR_SIZES = ['480', '800'].map(size); // FR copy: stale, shorter size list (F4: 7 vs 11)

// Trimmed from the FR home backgroundImage response (node #53 fr, translations #52 en / #54 es).
const frNode = {
  id: 'cG9zdDo1Mw==',
  databaseId: 53,
  languageCode: 'fr',
  sourceUrl: `${UP}/hero-background.png`,
  altText: 'Arrière-plan',
  mediaDetails: { width: 1536, height: 1024, sizes: FR_SIZES },
  translations: [
    { languageCode: 'en', sourceUrl: `${UP}/hero-background.png`, altText: 'Background', mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES } },
    { languageCode: 'es', sourceUrl: `${UP}/hero-background.png`, altText: 'Fondo', mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES } },
  ],
};

describe('resolveOriginalMedia', () => {
  it('FR node with an EN translation → EN sourceUrl/mediaDetails, FR altText, helper fields stripped', () => {
    expect(resolveOriginalMedia(frNode)).toEqual({
      id: 'cG9zdDo1Mw==',
      sourceUrl: `${UP}/hero-background.png`,
      altText: 'Arrière-plan',
      mediaDetails: { width: 1536, height: 1024, sizes: EN_SIZES },
    });
  });

  it('EN node → unchanged apart from the helper fields', () => {
    const en = { databaseId: 52, languageCode: 'en', sourceUrl: `${UP}/hero-background.png`, mediaDetails: { sizes: EN_SIZES } };
    expect(resolveOriginalMedia(en)).toEqual({ sourceUrl: `${UP}/hero-background.png`, mediaDetails: { sizes: EN_SIZES } });
    expect(en).toHaveProperty('databaseId', 52); // input not mutated
  });

  it('FR node without translations (EN request shape or none fetched) → itself', () => {
    const fr = { databaseId: 333, languageCode: 'fr', sourceUrl: 'https://x/ico.svg' };
    expect(resolveOriginalMedia(fr)).toEqual({ sourceUrl: 'https://x/ico.svg' });
    expect(resolveOriginalMedia({ ...fr, translations: [{ languageCode: 'es', sourceUrl: 'https://x/es.svg' }] })).toEqual({
      sourceUrl: 'https://x/ico.svg',
    });
  });

  it('only replaces the fields the translation selected', () => {
    const fr = { languageCode: 'fr', sourceUrl: 'https://x/fr.svg', translations: [{ languageCode: 'en', sourceUrl: 'https://x/en.svg' }] };
    expect(resolveOriginalMedia(fr)).toEqual({ sourceUrl: 'https://x/en.svg' });
  });

  it('null / undefined → null', () => {
    expect(resolveOriginalMedia(null)).toBeNull();
    expect(resolveOriginalMedia(undefined)).toBeNull();
  });
});

describe('resolveMediaWrapper', () => {
  it('resolves the node inside { node } and keeps null wrappers', () => {
    expect(resolveMediaWrapper({ node: frNode })?.node?.mediaDetails).toEqual(frNode.translations[0].mediaDetails);
    expect(resolveMediaWrapper(null)).toBeNull();
    expect(resolveMediaWrapper(undefined)).toBeUndefined();
  });
});

describe('mediaOriginalFields', () => {
  it('adds the helper scalars and an @include-guarded translations selection', () => {
    expect(mediaOriginalFields('sourceUrl')).toBe(
      'databaseId languageCode translations @include(if: $mediaOriginal) { languageCode sourceUrl }',
    );
  });
});
