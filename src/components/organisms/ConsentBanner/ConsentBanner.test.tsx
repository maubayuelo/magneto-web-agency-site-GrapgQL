// Phase 5f §5 / AC-2, AC-3, AC-3b, AC-4, R-12: ConsentProvider + banner + footer control (harness until the Footer is
// wired). Real analytics/consent modules; only the script loader is a deferred mock. vitest.setup.ts defines
// window.gtag before every test (E5), so each test deletes it first.
import React from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/dictionaries/en';
import { disableAnalytics } from '@/utils/analytics';
import { CONSENT_KEY, CONSENT_MAX_AGE_MS, clearMemoryConsent } from '@/utils/consent';
import { ConsentProvider } from './index';
import { PrivacyChoicesButton } from './PrivacyChoicesButton';

const loader = vi.hoisted(() => ({
  calls: 0,
  current: null as null | { promise: Promise<void>; resolve: () => void; reject: (e: Error) => void },
}));
vi.mock('@/utils/thirdParty', () => {
  const loadScript = () => {
    loader.calls += 1;
    return loader.current!.promise;
  };
  return { default: { loadScript, warmResource: () => {} }, loadScript };
});

const ID = 'G-LOCALTEST00';
const FLAG = `ga-disable-${ID}` as const;

function newDeferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  loader.current = { promise, resolve, reject };
}

const stored = (analytics: string, at = new Date().toISOString(), v: unknown = 1) =>
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ v, analytics, at }));
const commands = () => (window.dataLayer ?? []).map((e) => Array.from(e as ArrayLike<unknown>));
const cookieNames = () => document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean);
const banner = () => screen.queryByRole('region', { name: 'Privacy choices' });
const flush = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});
const resolveScript = () => act(async () => {
  loader.current!.resolve();
  await Promise.resolve();
  await Promise.resolve();
});
const storageEvent = (key: string | null, area: Storage = localStorage) =>
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, storageArea: area }));
  });

function App({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <I18nProvider locale="en" dictionary={en}>
      <ConsentProvider>
        {withHeader ? (
          <header>
            <a href="#top">Magneto</a>
          </header>
        ) : null}
        <main id="main-content" tabIndex={-1}>
          <button type="button">Page button</button>
        </main>
        <footer>
          <PrivacyChoicesButton />
        </footer>
      </ConsentProvider>
    </I18nProvider>
  );
}

async function mount(props: { withHeader?: boolean } = {}) {
  const view = render(<App {...props} />);
  await flush();
  return view;
}

beforeEach(() => {
  delete window.gtag;
  delete window.dataLayer;
  delete window[FLAG];
  localStorage.clear();
  clearMemoryConsent();
  for (const name of cookieNames()) document.cookie = `${name}=; max-age=0; path=/`;
  vi.stubEnv('NEXT_PUBLIC_GA_ID', ID);
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
  loader.calls = 0;
  newDeferred();
});

afterEach(() => {
  cleanup();
  disableAnalytics(); // reset the module's grant between tests
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.style.scrollPaddingBottom = '';
});

describe('SSR (R-12)', () => {
  it('server markup has no banner and still contains the page', () => {
    const html = renderToString(<App />);
    expect(html).not.toContain('consent-banner');
    expect(html).toContain('Page button');
  });
});

describe('not configured (AC-4)', () => {
  it('no banner, no storage read/write, no cookie access, even with a stored grant', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    stored('granted');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookieSet = vi.spyOn(Document.prototype, 'cookie', 'set');
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Privacy choices' }));
    await flush();
    expect(banner()).toBeNull();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
    expect(loader.calls).toBe(0);
  });
});

describe('first visit (AC-2)', () => {
  it('shows the banner without autofocus and loads nothing', async () => {
    await mount();
    const region = banner();
    expect(region).not.toBeNull();
    expect(region!.tagName).toBe('SECTION');
    expect(region).toHaveAccessibleDescription(en.consent.body);
    expect(screen.getByRole('heading', { level: 2, name: 'Privacy choices' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    expect(document.activeElement).toBe(document.body);
    expect(loader.calls).toBe(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it('renders the banner before the page in DOM order, with identical button classes (D-F5)', async () => {
    const { container } = await mount();
    expect(container.firstElementChild?.classList.contains('consent-banner')).toBe(true);
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    const reject = screen.getByRole('button', { name: 'Reject non-essential' });
    expect(accept.className).toBe(reject.className);
  });

  it('Accept stores granted, loads once, hides; a remount restores without a banner', async () => {
    const view = await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await flush();
    expect(banner()).toBeNull();
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toMatchObject({ v: 1, analytics: 'granted' });
    expect(loader.calls).toBe(1);
    await resolveScript();
    expect(commands().map((c) => c[0])).toEqual(['consent', 'js', 'config']);
    expect(window[FLAG]).toBe(false);
    const at = JSON.parse(localStorage.getItem(CONSENT_KEY)!).at;
    view.unmount();
    await mount();
    expect(banner()).toBeNull();
    expect(commands().map((c) => c[0])).toEqual(['consent', 'js', 'config']); // no second initialization
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!).at).toBe(at); // restoration does not refresh `at`
  });

  it('2.4.11: scroll padding and body end padding while visible, both restored on hide', async () => {
    document.body.style.paddingBottom = '7px';
    await mount();
    expect(document.documentElement.style.scrollPaddingBottom).toMatch(/^\d+px$/);
    expect(document.body.style.paddingBottom).not.toBe('7px');
    fireEvent.click(screen.getByRole('button', { name: 'Reject non-essential' }));
    await flush();
    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
    expect(document.body.style.paddingBottom).toBe('7px');
    document.body.style.paddingBottom = '';
  });

  it('Reject stores denied and loads nothing, including after a remount', async () => {
    const view = await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Reject non-essential' }));
    await flush();
    expect(banner()).toBeNull();
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toMatchObject({ v: 1, analytics: 'denied' });
    view.unmount();
    await mount();
    expect(banner()).toBeNull();
    expect(loader.calls).toBe(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it.each([
    ['expired grant', () => stored('granted', new Date(Date.now() - CONSENT_MAX_AGE_MS).toISOString())],
    ['expired denial', () => stored('denied', new Date(Date.now() - CONSENT_MAX_AGE_MS).toISOString())],
    ['old version', () => stored('granted', new Date().toISOString(), 0)],
    ['version bump (denied)', () => stored('denied', new Date().toISOString(), 2)],
    ['future date', () => stored('granted', new Date(Date.now() + 60_000).toISOString())],
    ['malformed', () => localStorage.setItem(CONSENT_KEY, '{nope')],
  ])('%s → banner, nothing loaded', async (_label, seed) => {
    seed();
    await mount();
    expect(banner()).not.toBeNull();
    expect(loader.calls).toBe(0);
    expect(window.gtag).toBeUndefined();
  });

  it('storage that throws → banner, no crash; the explicit choice still holds on this page', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    await mount();
    expect(banner()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await flush();
    expect(banner()).toBeNull();
    expect(loader.calls).toBe(1);
    await resolveScript();
    expect(window[FLAG]).toBe(false);
  });
});

describe('reopen + withdraw (AC-3, AC-8 harness)', () => {
  it('footer control reopens with focus on the heading; Escape closes, choice unchanged, focus back', async () => {
    stored('granted');
    await mount();
    expect(banner()).toBeNull();
    const control = screen.getByRole('button', { name: 'Privacy choices' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    control.focus();
    fireEvent.click(control);
    await flush();
    expect(banner()).not.toBeNull();
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Privacy choices' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await flush();
    expect(banner()).toBeNull();
    expect(document.activeElement).toBe(control);
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!).analytics).toBe('granted');
  });

  it('Escape outside the reopened banner is not intercepted', async () => {
    await mount(); // first show
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    accept.focus();
    fireEvent.keyDown(accept, { key: 'Escape' });
    await flush();
    expect(banner()).not.toBeNull(); // Escape only closes a reopened banner
  });

  it('Accept → reopen → Reject withdraws: opt-out, no gtag, GA cookies gone, focus back on the control', async () => {
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await flush();
    await resolveScript();
    document.cookie = '_ga=GA1.1.1; path=/';
    document.cookie = '_ga_LOCALTEST00=GS1.1.1; path=/';
    document.cookie = 'unrelated=1; path=/';
    const control = screen.getByRole('button', { name: 'Privacy choices' });
    fireEvent.click(control);
    await flush();
    const reject = screen.getByRole('button', { name: 'Reject non-essential' });
    reject.focus();
    fireEvent.click(reject);
    await flush();
    expect(banner()).toBeNull();
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(cookieNames()).not.toContain('_ga');
    expect(cookieNames()).not.toContain('_ga_LOCALTEST00');
    expect(cookieNames()).toContain('unrelated');
    expect(document.activeElement).toBe(control);
    // re-Accept: one script request in total, re-initialized once
    fireEvent.click(control);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await flush();
    expect(window[FLAG]).toBe(false);
    expect(commands().filter((c) => c[0] === 'config')).toHaveLength(2);
  });

  it('Accept → reopen → Reject while the script is still loading: delayed success stays disabled', async () => {
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Privacy choices' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Reject non-essential' }));
    await flush();
    await resolveScript();
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(commands()).toEqual([]);
  });
});

describe('focus restoration (§5)', () => {
  it('first show: Accept from inside the banner returns to the captured page element', async () => {
    await mount();
    const pageButton = screen.getByRole('button', { name: 'Page button' });
    pageButton.focus();
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    accept.focus();
    fireEvent.click(accept);
    await flush();
    expect(document.activeElement).toBe(pageButton);
  });

  it('first show: captured element gone → first visible header link', async () => {
    await mount();
    const pageButton = screen.getByRole('button', { name: 'Page button' });
    pageButton.focus();
    pageButton.remove();
    const reject = screen.getByRole('button', { name: 'Reject non-essential' });
    reject.focus();
    fireEvent.click(reject);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Magneto' }));
  });

  it('first show: no header → the main container, never body', async () => {
    await mount({ withHeader: false });
    const reject = screen.getByRole('button', { name: 'Reject non-essential' });
    reject.focus();
    fireEvent.click(reject);
    await flush();
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('focus outside the banner stays where it is', async () => {
    await mount();
    const pageButton = screen.getByRole('button', { name: 'Page button' });
    pageButton.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' })); // mouse click, focus not in banner
    await flush();
    expect(document.activeElement).toBe(pageButton);
  });

  it('reopened: trigger removed → page fallback instead of body', async () => {
    stored('denied');
    await mount();
    const control = screen.getByRole('button', { name: 'Privacy choices' });
    fireEvent.click(control);
    await flush();
    control.remove();
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    accept.focus();
    fireEvent.click(accept);
    await flush();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Magneto' }));
  });

  it('never steals focus from an open booking dialog', async () => {
    await mount();
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    accept.focus();
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);
    fireEvent.click(accept);
    await flush();
    expect(document.activeElement).toBe(document.body);
    dialog.remove();
  });
});

describe('cross-tab (AC-3b)', () => {
  async function activeGrant() {
    stored('granted');
    await mount();
    await resolveScript();
    expect(window[FLAG]).toBe(false);
  }

  it('a denial revokes and hides, without write-back', async () => {
    await activeGrant();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    stored('denied');
    setItem.mockClear();
    await storageEvent(CONSENT_KEY);
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(banner()).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([
    ['key deletion', () => localStorage.removeItem(CONSENT_KEY), CONSENT_KEY],
    ['localStorage.clear()', () => localStorage.clear(), null],
    ['malformed JSON', () => localStorage.setItem(CONSENT_KEY, '{'), CONSENT_KEY],
    ['invalid schema', () => localStorage.setItem(CONSENT_KEY, '{"v":1,"analytics":"maybe","at":"x"}'), CONSENT_KEY],
    ['invalid date', () => stored('granted', 'not-a-date'), CONSENT_KEY],
    ['wrong version', () => stored('granted', new Date().toISOString(), 2), CONSENT_KEY],
    ['expired grant', () => stored('granted', new Date(Date.now() - CONSENT_MAX_AGE_MS).toISOString()), CONSENT_KEY],
    ['expired denial', () => stored('denied', new Date(Date.now() - CONSENT_MAX_AGE_MS).toISOString()), CONSENT_KEY],
  ])('%s revokes and shows the first banner without autofocus or write-back', async (_label, change, key) => {
    await activeGrant();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    change();
    setItem.mockClear();
    removeItem.mockClear();
    const pageButton = screen.getByRole('button', { name: 'Page button' });
    pageButton.focus();
    await storageEvent(key);
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(banner()).not.toBeNull();
    expect(document.activeElement).toBe(pageButton);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it('unrelated keys and sessionStorage events do nothing', async () => {
    await activeGrant();
    localStorage.setItem('other', '1');
    await storageEvent('other');
    sessionStorage.setItem(CONSENT_KEY, 'x');
    localStorage.removeItem(CONSENT_KEY); // not announced to this tab via localStorage
    await storageEvent(CONSENT_KEY, sessionStorage);
    expect(window[FLAG]).toBe(false);
    expect(typeof window.gtag).toBe('function');
    sessionStorage.clear();
  });

  it('a valid grant from another tab loads once and hides the first banner', async () => {
    await mount();
    expect(banner()).not.toBeNull();
    stored('granted');
    await storageEvent(CONSENT_KEY);
    await storageEvent(CONSENT_KEY); // duplicate event
    expect(banner()).toBeNull();
    expect(loader.calls).toBe(1);
    await resolveScript();
    expect(commands().filter((c) => c[0] === 'config')).toHaveLength(1);
  });

  it('a stale queued grant event after a newer denial cannot reload', async () => {
    await activeGrant();
    stored('denied');
    await storageEvent(CONSENT_KEY); // denial
    await storageEvent(CONSENT_KEY); // the older grant's event arrives late; storage says denied
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(commands().filter((c) => c[0] === 'config')).toHaveLength(1);
  });

  it('deletion during a pending script load: delayed success cannot initialize', async () => {
    stored('granted');
    await mount();
    expect(loader.calls).toBe(1);
    localStorage.removeItem(CONSENT_KEY);
    await storageEvent(CONSENT_KEY);
    await resolveScript();
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(commands()).toEqual([]);
    expect(banner()).not.toBeNull();
  });
});

describe('expiry while active (AC-2)', () => {
  it('the expiry timer stops active GA and asks again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const now = Date.parse('2026-11-18T12:00:00.000Z');
    vi.setSystemTime(now);
    stored('granted', new Date(now - CONSENT_MAX_AGE_MS + 1000).toISOString());
    render(<App />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      loader.current!.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(window[FLAG]).toBe(false);
    expect(banner()).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(banner()).not.toBeNull();
  });

  it('visibility return after expiry (suspended tab, no timer fired) stops active GA', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const now = Date.parse('2026-11-18T12:00:00.000Z');
    vi.setSystemTime(now);
    stored('granted', new Date(now - CONSENT_MAX_AGE_MS + 60_000).toISOString());
    render(<App />);
    await act(async () => {
      loader.current!.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(window[FLAG]).toBe(false);
    vi.setSystemTime(now + 120_000); // clock jumps; the timer has not run
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(window[FLAG]).toBe(true);
    expect(window.gtag).toBeUndefined();
    expect(banner()).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!).at).toBe(new Date(now - CONSENT_MAX_AGE_MS + 60_000).toISOString());
  });
});
