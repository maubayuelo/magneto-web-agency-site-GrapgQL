/// <reference types="vitest" />
import { HTML_LANG, LOCALES, isEnabledLocale, isLocale, parseEnabledLocales } from './config';

describe('isLocale', () => {
  it.each(['en', 'fr', 'es'])('accepts %s', (v) => expect(isLocale(v)).toBe(true));
  it.each(['de', '', 'EN', undefined, null, 1])('rejects %s', (v) => expect(isLocale(v)).toBe(false));
});

describe('parseEnabledLocales', () => {
  it('fails closed to en when unset or empty', () => {
    expect(parseEnabledLocales(undefined)).toEqual(['en']);
    expect(parseEnabledLocales('')).toEqual(['en']);
  });
  it('always includes en', () => {
    expect(parseEnabledLocales('fr')).toEqual(['en', 'fr']);
  });
  it('trims, drops unknown entries and duplicates, and orders by LOCALES', () => {
    expect(parseEnabledLocales(' es , fr ,de,fr')).toEqual(['en', 'fr', 'es']);
  });
});

describe('isEnabledLocale', () => {
  it('requires the locale to be in the enabled list', () => {
    expect(isEnabledLocale('fr', ['en', 'fr'])).toBe(true);
    expect(isEnabledLocale('es', ['en', 'fr'])).toBe(false);
    expect(isEnabledLocale('de', ['en', 'fr', 'es'])).toBe(false);
  });
});

describe('HTML_LANG', () => {
  it('has a value for every locale', () => {
    expect(Object.keys(HTML_LANG).sort()).toEqual([...LOCALES].sort());
    expect(HTML_LANG).toEqual({ en: 'en', fr: 'fr-CA', es: 'es' });
  });
});
