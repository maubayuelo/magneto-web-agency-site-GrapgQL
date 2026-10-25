/// <reference types="vitest" />
import { toWpLanguage, wpLocaleVars } from './wp';

describe('toWpLanguage', () => {
  it.each([
    ['en', 'en'],
    ['fr', 'fr'],
    ['es', 'es'],
  ] as const)('%s → %s (WPML code)', (locale, code) => {
    expect(toWpLanguage(locale)).toBe(code);
  });
});

describe('wpLocaleVars', () => {
  it('en: no EN-original media lookup', () => {
    expect(wpLocaleVars('en')).toEqual({ language: 'en', mediaOriginal: false });
  });

  it.each(['fr', 'es'] as const)('%s: asks for the EN original of each image', (locale) => {
    expect(wpLocaleVars(locale)).toEqual({ language: locale, mediaOriginal: true });
  });
});
