/// <reference types="vitest" />
import { getWpBaseUrl, getWpGraphqlUrl } from './wordpress';

const API = 'NEXT_PUBLIC_WORDPRESS_API_URL';
const BASE = 'NEXT_PUBLIC_WORDPRESS_URL';

describe('wordpress URL helpers', () => {
  beforeEach(() => {
    vi.stubEnv(API, '');
    vi.stubEnv(BASE, '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getWpGraphqlUrl', () => {
    it('returns NEXT_PUBLIC_WORDPRESS_API_URL when set (it wins over WORDPRESS_URL)', () => {
      vi.stubEnv(API, 'http://cms.test/graphql');
      vi.stubEnv(BASE, 'http://other.test');
      expect(getWpGraphqlUrl()).toBe('http://cms.test/graphql');
    });

    it('falls back to NEXT_PUBLIC_WORDPRESS_URL when only that is set', () => {
      vi.stubEnv(BASE, 'http://cms.test/graphql');
      expect(getWpGraphqlUrl()).toBe('http://cms.test/graphql');
    });

    it('throws a message naming the variable when both are empty', () => {
      expect(() => getWpGraphqlUrl()).toThrow(/NEXT_PUBLIC_WORDPRESS_API_URL/);
    });

    it('throws when both are undefined', () => {
      // Vitest 1.x stubEnv(name, undefined) stores the string "undefined", so delete instead;
      // unstubAllEnvs() in afterEach restores the originals recorded by beforeEach.
      delete process.env[API];
      delete process.env[BASE];
      expect(() => getWpGraphqlUrl()).toThrow(/NEXT_PUBLIC_WORDPRESS_API_URL/);
    });

    it('never returns the production CMS', () => {
      expect(() => getWpGraphqlUrl()).toThrow();
      vi.stubEnv(API, 'http://magneto-cms-2.local/graphql');
      expect(getWpGraphqlUrl()).not.toMatch(/cms\.magnetomarketing\.co/);
    });
  });

  describe('getWpBaseUrl', () => {
    it.each([
      ['http://cms.test', 'http://cms.test'],
      ['http://cms.test/', 'http://cms.test'],
      ['http://cms.test/graphql', 'http://cms.test'],
      ['http://cms.test/graphql/', 'http://cms.test'],
      ['http://cms.test/wp-json', 'http://cms.test'],
      ['http://cms.test/wp-json/', 'http://cms.test'],
      ['http://cms.test/GraphQL', 'http://cms.test'],
    ])('strips suffixes: %s → %s', (input, expected) => {
      vi.stubEnv(BASE, input);
      expect(getWpBaseUrl()).toBe(expected);
    });

    it('prefers NEXT_PUBLIC_WORDPRESS_URL over the API URL', () => {
      vi.stubEnv(BASE, 'http://base.test');
      vi.stubEnv(API, 'http://api.test/graphql');
      expect(getWpBaseUrl()).toBe('http://base.test');
    });

    it('falls back to NEXT_PUBLIC_WORDPRESS_API_URL minus /graphql', () => {
      vi.stubEnv(API, 'http://api.test/graphql');
      expect(getWpBaseUrl()).toBe('http://api.test');
    });

    it('throws a message naming the variable when both are empty', () => {
      expect(() => getWpBaseUrl()).toThrow(/NEXT_PUBLIC_WORDPRESS_URL/);
    });
  });
});
