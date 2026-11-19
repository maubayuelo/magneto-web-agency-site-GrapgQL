// Phase 5f §2: consent storage validator, write fallback, cross-tab filter, GA cookie removal.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_KEY,
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
  clearGaCookies,
  clearMemoryConsent,
  getEffectiveConsent,
  isRelevantStorageEvent,
  msUntilExpiry,
  parseConsent,
  readConsent,
  writeConsent,
} from './consent';

const NOW = Date.parse('2026-11-18T12:00:00.000Z');
const iso = (t: number) => new Date(t).toISOString();
const rec = (o: Record<string, unknown>) => JSON.stringify({ v: CONSENT_VERSION, analytics: 'granted', at: iso(NOW), ...o });

beforeEach(() => {
  localStorage.clear();
  clearMemoryConsent();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseConsent (one validator, fails closed)', () => {
  it('accepts granted and denied at version 1', () => {
    expect(parseConsent(rec({}), NOW)).toEqual({ v: 1, analytics: 'granted', at: iso(NOW) });
    expect(parseConsent(rec({ analytics: 'denied' }), NOW)?.analytics).toBe('denied');
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['malformed JSON', '{"v":1,'],
    ['array', '[1]'],
    ['string', '"granted"'],
    ['null JSON', 'null'],
    ['wrong version (old)', rec({ v: 0 })],
    ['wrong version (bump)', rec({ v: CONSENT_VERSION + 1 })],
    ['version as string', rec({ v: '1' })],
    ['unknown choice', rec({ analytics: 'yes' })],
    ['missing choice', JSON.stringify({ v: 1, at: iso(NOW) })],
    ['missing at', JSON.stringify({ v: 1, analytics: 'granted' })],
    ['unparseable at', rec({ at: 'yesterday' })],
    ['non-ISO at', rec({ at: 'Wed, 18 Nov 2026 12:00:00 GMT' })],
    ['numeric at', rec({ at: NOW })],
    ['future at', rec({ at: iso(NOW + 1000) })],
  ])('%s → null', (_label, raw) => {
    expect(parseConsent(raw as string | null, NOW)).toBeNull();
  });

  it('expires at exactly 365 days, for both choices', () => {
    for (const analytics of ['granted', 'denied']) {
      expect(parseConsent(rec({ analytics, at: iso(NOW - CONSENT_MAX_AGE_MS + 1) }), NOW)).not.toBeNull();
      expect(parseConsent(rec({ analytics, at: iso(NOW - CONSENT_MAX_AGE_MS) }), NOW)).toBeNull();
    }
    expect(CONSENT_MAX_AGE_MS).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it('msUntilExpiry counts down to the boundary', () => {
    const r = parseConsent(rec({ at: iso(NOW - 1000) }), NOW)!;
    expect(msUntilExpiry(r, NOW)).toBe(CONSENT_MAX_AGE_MS - 1000);
  });
});

describe('readConsent / writeConsent', () => {
  it('round-trips through localStorage under magneto-consent', () => {
    const written = writeConsent('denied', NOW);
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toEqual({ v: 1, analytics: 'denied', at: iso(NOW) });
    expect(readConsent(NOW)).toEqual(written);
  });

  it('reading never refreshes at', () => {
    localStorage.setItem(CONSENT_KEY, rec({ at: iso(NOW - 5000) }));
    readConsent(NOW);
    getEffectiveConsent(NOW);
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!).at).toBe(iso(NOW - 5000));
  });

  it('storage that throws on read → null, no crash', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readConsent(NOW)).toBeNull();
    expect(getEffectiveConsent(NOW)).toBeNull();
  });

  it('a failed write never throws and holds the choice in memory for this page only', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeConsent('granted', NOW)).not.toThrow();
    expect(readConsent(NOW)).toBeNull();
    expect(getEffectiveConsent(NOW)?.analytics).toBe('granted');
    // same age limit as a stored record
    expect(getEffectiveConsent(NOW + CONSENT_MAX_AGE_MS)).toBeNull();
  });

  it('a successful write and a cross-tab event clear the memory choice', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    writeConsent('granted', NOW);
    spy.mockRestore();
    writeConsent('denied', NOW);
    expect(getEffectiveConsent(NOW)?.analytics).toBe('denied');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    writeConsent('granted', NOW);
    clearMemoryConsent();
    expect(getEffectiveConsent(NOW)?.analytics).toBe('denied');
  });
});

describe('isRelevantStorageEvent', () => {
  it('accepts our key and clear() on localStorage only', () => {
    expect(isRelevantStorageEvent(new StorageEvent('storage', { key: CONSENT_KEY, storageArea: localStorage }))).toBe(true);
    expect(isRelevantStorageEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))).toBe(true);
    expect(isRelevantStorageEvent(new StorageEvent('storage', { key: 'other', storageArea: localStorage }))).toBe(false);
    expect(isRelevantStorageEvent(new StorageEvent('storage', { key: CONSENT_KEY, storageArea: sessionStorage }))).toBe(false);
    expect(isRelevantStorageEvent(new StorageEvent('storage', { key: null, storageArea: sessionStorage }))).toBe(false);
  });
});

describe('clearGaCookies', () => {
  const cookieNames = () => document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean);

  it('removes _ga and _ga_<suffix>, keeps unrelated cookies', () => {
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_LOCALTEST00=GS1.1.456; path=/';
    document.cookie = '_ga_OTHER=keep; path=/';
    document.cookie = 'unrelated=1; path=/';
    clearGaCookies('G-LOCALTEST00');
    expect(cookieNames()).not.toContain('_ga');
    expect(cookieNames()).not.toContain('_ga_LOCALTEST00');
    expect(cookieNames()).toEqual(expect.arrayContaining(['_ga_OTHER', 'unrelated']));
    document.cookie = '_ga_OTHER=; max-age=0; path=/';
    document.cookie = 'unrelated=; max-age=0; path=/';
  });

  it('writes the host-only and every parent-domain variant', () => {
    const writes: string[] = [];
    vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation((v: string) => {
      writes.push(v);
    });
    clearGaCookies('G-N2YZ6SG2WM', 'www.magnetomarketing.co');
    const domains = writes.map((w) => w.match(/domain=([^;]+)/)?.[1] ?? 'host-only');
    expect(new Set(domains)).toEqual(new Set(['host-only', 'www.magnetomarketing.co', '.magnetomarketing.co', '.co']));
    expect(writes.every((w) => /^_ga(_N2YZ6SG2WM)?=; /.test(w) && w.includes('path=/'))).toBe(true);
    expect(writes).toHaveLength(8);
  });
});
