/// <reference types="vitest" />
import { resolveInternalPath } from './routing';

describe('resolveInternalPath', () => {
  describe("with ['en']", () => {
    it.each([
      ['/', '/en'],
      ['/services', '/en/services'],
      ['/fr/services', '/en/fr/services'],
      ['/en/services', '/en/en/services'],
    ])('%s → %s', (pathname, expected) => {
      expect(resolveInternalPath(pathname, ['en'])).toBe(expected);
    });
  });

  describe("with ['en','fr','es']", () => {
    it.each([
      ['/fr', null],
      ['/es/contact', null],
      ['/services', '/en/services'],
      ['/french', '/en/french'],
      ['/en', '/en/en'],
    ])('%s → %s', (pathname, expected) => {
      expect(resolveInternalPath(pathname, ['en', 'fr', 'es'])).toBe(expected);
    });
  });

  it("with ['en','fr'], /es/services stays EN-internal (404 via the catch-all)", () => {
    expect(resolveInternalPath('/fr/services', ['en', 'fr'])).toBeNull();
    expect(resolveInternalPath('/es/services', ['en', 'fr'])).toBe('/en/es/services');
  });
});
