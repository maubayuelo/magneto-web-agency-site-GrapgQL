// Phase 5f §3 / AC-2 / AC-3: consent-gated GA4 loader. vitest.setup.ts defines window.gtag before every test (E5), so
// each test starts by deleting it. Fresh module state per test (vi.resetModules) for the generation counter and the
// thirdParty promise cache.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ID = 'G-LOCALTEST00';
const SRC = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
const FLAG = `ga-disable-${ID}` as const;
const ANALYTICS_HOST = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net/;

type Deferred = { promise: Promise<void>; resolve: () => void; reject: (e: Error) => void };
function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Real thirdParty loader (script element in <head>), or a deferred mock that, like thirdParty, shares one promise. */
async function setup(mode: 'real' | 'deferred' = 'real') {
  vi.resetModules();
  const d = deferred();
  const loadScript = vi.fn(() => d.promise);
  if (mode === 'deferred') {
    vi.doMock('./thirdParty', () => ({ default: { loadScript, warmResource: vi.fn() }, loadScript }));
  } else {
    vi.doUnmock('./thirdParty');
  }
  const analytics = await import('./analytics');
  const consent = await import('./consent');
  return { ...analytics, ...consent, d, loadScript };
}

const scripts = () => Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager"]'));
const commands = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
const names = () => commands().map((c) => (c[0] === 'consent' ? `consent:${String(c[1])}` : String(c[0])));
const cookieNames = () => document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean);
const flush = () => new Promise((r) => setTimeout(r, 0));

async function fireLoad() {
  const [s] = scripts();
  s.dispatchEvent(new Event('load'));
  await flush();
}

beforeEach(() => {
  delete window.gtag; // E5: the global mock would make every "nothing before consent" assertion meaningless
  delete window.dataLayer;
  delete window[FLAG];
  localStorage.clear();
  document.head.querySelectorAll('script, link').forEach((n) => n.remove());
  for (const name of cookieNames()) document.cookie = `${name}=; max-age=0; path=/`;
  vi.stubEnv('NEXT_PUBLIC_GA_ID', ID);
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('./thirdParty');
  vi.restoreAllMocks();
});

describe('getGaId / isAnalyticsConfigured (build switch)', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['whitespace-only', '   '],
    ['placeholder', 'your_ga_id_here'],
    ['GTM container', 'GTM-ABC123'],
    ['lowercase', 'g-localtest00'],
    ['UA property', 'UA-12345-1'],
  ])('%s → not configured', async (_label, value) => {
    if (value === undefined) {
      vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
      delete process.env.NEXT_PUBLIC_GA_ID;
    } else {
      vi.stubEnv('NEXT_PUBLIC_GA_ID', value);
    }
    const { getGaId, isAnalyticsConfigured } = await setup();
    expect(getGaId()).toBe('');
    expect(isAnalyticsConfigured()).toBe(false);
  });

  it('trims and accepts a GA4 Measurement ID, read at call time', async () => {
    const { getGaId, isAnalyticsConfigured } = await setup();
    expect(getGaId()).toBe(ID);
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '  G-N2YZ6SG2WM ');
    expect(getGaId()).toBe('G-N2YZ6SG2WM');
    expect(isAnalyticsConfigured()).toBe(true);
  });
});

describe('not configured (AC-4)', () => {
  it('loads nothing and touches neither storage nor cookies, even with a stored grant', async () => {
    localStorage.setItem('magneto-consent', JSON.stringify({ v: 1, analytics: 'granted', at: new Date().toISOString() }));
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    const { loadAnalytics, disableAnalytics } = await setup();
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const cookieSet = vi.spyOn(Document.prototype, 'cookie', 'set');
    await loadAnalytics();
    disableAnalytics();
    expect(scripts()).toHaveLength(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
    expect(getItem).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe('before consent (AC-2)', () => {
  it('no script, no hint, no gtag, no dataLayer, no analytics request', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const { loadAnalytics, disableAnalytics, gtagEvent, writeConsent } = await setup();
    await loadAnalytics(); // no record
    disableAnalytics(); // what the provider does on first show
    gtagEvent('cta_click', { location: 'hero' });
    writeConsent('denied');
    await loadAnalytics(); // denied
    expect(scripts()).toHaveLength(0);
    expect(document.querySelectorAll('link[href*="google"]')).toHaveLength(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
    const urls = [...fetchSpy.mock.calls.map((c) => String(c[0])), ...beacon.mock.calls.map((c) => String((c as unknown[])[0]))];
    expect(urls.filter((u) => ANALYTICS_HOST.test(u))).toEqual([]);
  });
});

describe('after Accept (AC-2)', () => {
  it('exactly one script, no crossorigin, opt-out on and events dropped until the script loads', async () => {
    const { loadAnalytics, gtagEvent, writeConsent } = await setup();
    writeConsent('granted');
    const p = loadAnalytics();
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].getAttribute('src')).toBe(SRC);
    expect(scripts()[0].hasAttribute('crossorigin')).toBe(false);
    expect(window[FLAG]).toBe(true);
    gtagEvent('cta_click', { location: 'hero' }); // dropped by the stub
    expect(commands()).toEqual([]);
    await fireLoad();
    await p;
    expect(names()).toEqual(['consent:default', 'js', 'config']);
    const [consentCmd, jsCmd, configCmd] = commands();
    expect(consentCmd[2]).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    expect(jsCmd[1]).toBeInstanceOf(Date);
    expect(configCmd[1]).toBe(ID);
    expect(configCmd[2]).toEqual({ allow_google_signals: false, allow_ad_personalization_signals: false, debug_mode: true });
    expect(window[FLAG]).toBe(false);
    gtagEvent('cta_click', { location: 'hero' });
    expect(names()).toEqual(['consent:default', 'js', 'config', 'event']);
  });

  it('repeated Accept (Strict Mode effects) initializes once', async () => {
    const { loadAnalytics, writeConsent } = await setup();
    writeConsent('granted');
    const a = loadAnalytics();
    const b = loadAnalytics();
    await fireLoad();
    await Promise.all([a, b, loadAnalytics()]);
    await loadAnalytics();
    expect(scripts()).toHaveLength(1);
    expect(names()).toEqual(['consent:default', 'js', 'config']);
  });
});

describe('debug flag per Vercel target', () => {
  it.each([
    ['preview', true],
    ['development', true],
    ['unknown', true],
    [undefined, true],
    ['production', false],
  ])('NEXT_PUBLIC_VERCEL_ENV=%s → debug_mode present: %s', async (env, debug) => {
    if (env === undefined) {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    } else {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', env);
    }
    const { loadAnalytics, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const p = loadAnalytics();
    d.resolve();
    await p;
    const config = commands().find((c) => c[0] === 'config')!;
    expect('debug_mode' in (config[2] as object)).toBe(debug);
  });
});

describe('withdrawal (AC-3)', () => {
  it('Reject after Accept: opt-out, no gtag, gtagEvent no-op, GA cookies gone, unrelated cookie kept', async () => {
    const { loadAnalytics, disableAnalytics, gtagEvent, writeConsent } = await setup();
    writeConsent('granted');
    const p = loadAnalytics();
    await fireLoad();
    await p;
    const retained = window.gtag!;
    document.cookie = '_ga=GA1.1.1; path=/';
    document.cookie = '_ga_LOCALTEST00=GS1.1.1; path=/';
    document.cookie = 'unrelated=1; path=/';

    writeConsent('denied');
    disableAnalytics();

    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    const before = commands().length;
    gtagEvent('cta_click', {});
    retained('event', 'stale_reference', {}); // a retained wrapper checks its generation
    expect(commands()).toHaveLength(before);
    expect(cookieNames()).not.toContain('_ga');
    expect(cookieNames()).not.toContain('_ga_LOCALTEST00');
    expect(cookieNames()).toContain('unrelated');
  });

  it('re-Accept clears the flag, reuses the script, replays nothing and re-denies all ad types', async () => {
    const { loadAnalytics, disableAnalytics, gtagEvent, writeConsent } = await setup();
    writeConsent('granted');
    const p = loadAnalytics();
    await fireLoad();
    await p;
    writeConsent('denied');
    disableAnalytics();
    gtagEvent('while_withdrawn', {});
    const before = commands().length;

    writeConsent('granted');
    await loadAnalytics();

    expect(scripts()).toHaveLength(1);
    expect(window[FLAG]).toBe(false);
    const added = commands().slice(before);
    expect(added.map((c) => c[0])).toEqual(['consent', 'js', 'config']);
    expect(added[0][2]).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    expect(commands().some((c) => c[1] === 'while_withdrawn')).toBe(false);
  });
});

describe('pending-load races (AC-3, deferred loader)', () => {
  it('Accept → withdraw → script success: stays disabled', async () => {
    const { loadAnalytics, disableAnalytics, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const p = loadAnalytics();
    window.gtag?.('event', 'during_load', {}); // dropped
    writeConsent('denied');
    disableAnalytics();
    document.cookie = '_ga=GA1.1.1; path=/';
    disableAnalytics(); // provider re-runs it on denial; cookies cleared again
    d.resolve();
    await p;
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(commands()).toEqual([]);
    expect(cookieNames()).not.toContain('_ga');
  });

  it('Accept → withdraw → script failure: stays disabled, no unhandled rejection', async () => {
    const { loadAnalytics, disableAnalytics, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const p = loadAnalytics();
    writeConsent('denied');
    disableAnalytics();
    d.reject(new Error('blocked'));
    await expect(p).resolves.toBeUndefined();
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(commands()).toEqual([]);
  });

  it('current-grant script failure (ad blocker): opt-out kept, stub removed, no UI error', async () => {
    const { loadAnalytics, gtagEvent, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const p = loadAnalytics();
    d.reject(new Error('blocked'));
    await expect(p).resolves.toBeUndefined();
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    gtagEvent('cta_click', {});
    expect(commands()).toEqual([]);
  });

  it('Accept → withdraw → re-Accept before resolution: only the new grant initializes, once', async () => {
    const { loadAnalytics, disableAnalytics, writeConsent, d, loadScript } = await setup('deferred');
    writeConsent('granted');
    const first = loadAnalytics();
    window.gtag?.('event', 'stale_event', {});
    writeConsent('denied');
    disableAnalytics();
    writeConsent('granted');
    const second = loadAnalytics();
    d.resolve();
    await Promise.all([first, second]);
    expect(loadScript).toHaveBeenCalledTimes(2); // same shared promise (thirdParty caches per src)
    expect(names()).toEqual(['consent:default', 'js', 'config']);
    expect(window[FLAG]).toBe(false);
    expect(typeof window.gtag).toBe('function');
    expect(commands().some((c) => c[1] === 'stale_event')).toBe(false);
  });

  it('Accept → withdraw → re-Accept → stale failure path cannot clobber the new grant', async () => {
    const { loadAnalytics, disableAnalytics, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const first = loadAnalytics();
    writeConsent('denied');
    disableAnalytics();
    writeConsent('granted');
    const second = loadAnalytics();
    const secondStub = window.gtag;
    d.reject(new Error('blocked'));
    await Promise.all([first, second]);
    // the stale continuation ran first and left the newer grant's state alone; the current one then failed safely
    expect(window[FLAG]).toBe(true);
    expect(window.gtag === undefined || window.gtag !== secondStub).toBe(true);
    expect(commands()).toEqual([]);
  });

  it('a storage change to denied (no disable yet) before resolution blocks initialization', async () => {
    const { loadAnalytics, writeConsent, d } = await setup('deferred');
    writeConsent('granted');
    const p = loadAnalytics();
    localStorage.setItem('magneto-consent', JSON.stringify({ v: 1, analytics: 'denied', at: new Date().toISOString() }));
    d.resolve();
    await p;
    expect(commands()).toEqual([]);
    expect(window[FLAG]).not.toBe(false);
  });
});
