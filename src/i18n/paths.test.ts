/// <reference types="vitest" />
import { localizePath, splitLocalePath, switchLocalePath } from './paths';

describe('splitLocalePath', () => {
  it.each([
    ['/', 'en', '/'],
    ['/fr', 'fr', '/'],
    ['/fr/', 'fr', '/'],
    ['/es/projects/trepied-trepied-ca', 'es', '/projects/trepied-trepied-ca'],
    ['/en/contact', 'en', '/contact'],
    ['/contact', 'en', '/contact'],
    ['/french', 'en', '/french'],
    ['/fr-ca/x', 'en', '/fr-ca/x'],
  ])('%s → %s %s', (input, locale, path) => {
    expect(splitLocalePath(input)).toEqual({ locale, path });
  });
});

describe('localizePath', () => {
  it.each([
    ['/', 'en', '/'],
    ['/', 'fr', '/fr'],
    ['/', 'es', '/es'],
    ['/services', 'en', '/services'],
    ['/services', 'fr', '/fr/services'],
    ['/services', 'es', '/es/services'],
  ] as const)('%s in %s → %s', (path, locale, expected) => {
    expect(localizePath(path, locale)).toBe(expected);
  });

  it('keeps a trailing slash as given', () => {
    expect(localizePath('/services/', 'fr')).toBe('/fr/services/');
  });
});

describe('switchLocalePath', () => {
  it.each([
    ['/services', 'fr', '/fr/services'],
    ['/fr/services', 'en', '/services'],
    ['/fr/services', 'es', '/es/services'],
    ['/', 'fr', '/fr'],
    ['/fr', 'en', '/'],
    ['/projects/trepied-trepied-ca', 'es', '/es/projects/trepied-trepied-ca'],
  ] as const)('%s → %s = %s', (pathname, target, expected) => {
    expect(switchLocalePath(pathname, target)).toBe(expected);
  });
});
