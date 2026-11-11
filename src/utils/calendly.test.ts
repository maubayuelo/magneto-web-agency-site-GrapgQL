/// <reference types="vitest" />
import { calendlyConfig, openCalendlyPopup } from './calendly';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';
import { es } from '@/i18n/dictionaries/es';

// 5d-lite, D-8 revised + Option A (Senior Architect, 2026-11-02): one Calendly event for every locale and trigger.
const EVENT = 'https://calendly.com/magnetomarketing/free-strategy-call';
const OTHER = 'https://calendly.com/mauriciobayuelo/free-discovery-call';

// Design round A6-alt: no Calendly widget. Every in-page open is our iframe modal, so URLs are read from its src.
const overlayEl = () => document.getElementById('calendly-embedded-overlay');
const iframeEl = () => document.querySelector<HTMLIFrameElement>('#calendly-embedded-overlay iframe');
const iframeUrl = () => new URL(iframeEl()!.src);
const closeEl = () => document.getElementById('calendly-embedded-close');
const pressEscape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

beforeEach(() => {
  // jsdom doesn't implement scrollTo; scroll-lock calls it on unlock.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  // Close through the modal's own path so the scroll lock is released.
  closeEl()?.click();
  overlayEl()?.remove();
  delete (window as unknown as { gtag?: unknown }).gtag;
  vi.restoreAllMocks();
});

describe('openCalendlyPopup: single event (D-8 revised, Option A)', () => {
  it('the code default is the one event', () => {
    expect(calendlyConfig.url).toBe(EVENT);
  });

  it('modal: opens the event even when a CMS customUrl points at another event; utm unchanged', async () => {
    await openCalendlyPopup({ customUrl: OTHER, utmContent: 'hero', utmTerm: 'strategy_call' });
    const url = iframeUrl();
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(iframeEl()!.src).not.toContain('mauriciobayuelo');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'website', utm_medium: 'cta', utm_campaign: 'strategy_call', utm_content: 'hero', utm_term: 'strategy_call',
      embed_domain: window.location.hostname, embed_type: 'Inline',
    });
  });

  it('modal without customUrl: same event and utm defaults', async () => {
    await openCalendlyPopup();
    const url = iframeUrl();
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(url.searchParams.get('utm_content')).toBeNull();
  });

  it('new window: opens the event, not the customUrl, and no modal', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await openCalendlyPopup({ customUrl: OTHER, forceNewWindow: true });
    expect(open).toHaveBeenCalledTimes(1);
    const url = new URL(String(open.mock.calls[0][0]));
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(overlayEl()).toBeNull();
  });
});

describe('openCalendlyPopup: booking answers a1–a3 (5d-lite §5.2, B2)', () => {
  it('sets a1–a3 on the iframe URL, utm unchanged', async () => {
    await openCalendlyPopup({
      utmContent: 'header',
      prefill: { customAnswers: { a1: 'example.com', a2: 'Corriger ou améliorer mon site actuel', a3: 'Slow & old' } },
    });
    const url = iframeUrl();
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'website', utm_medium: 'cta', utm_campaign: 'strategy_call', utm_content: 'header',
      a1: 'example.com', a2: 'Corriger ou améliorer mon site actuel', a3: 'Slow & old',
      embed_domain: window.location.hostname, embed_type: 'Inline',
    });
  });

  it('only non-empty answers are set', async () => {
    await openCalendlyPopup({ prefill: { customAnswers: { a1: '', a2: '   ', a3: 'Need more leads' } } });
    const params = iframeUrl().searchParams;
    expect(params.has('a1')).toBe(false);
    expect(params.has('a2')).toBe(false);
    expect(params.get('a3')).toBe('Need more leads');
  });

  it('no prefill → no a1–a3 (existing callers unchanged)', async () => {
    await openCalendlyPopup({ utmContent: 'hero' });
    const keys = [...iframeUrl().searchParams.keys()];
    expect(keys.some((k) => /^a\d$/.test(k))).toBe(false);
  });

  it('new window and modal receive the same answers', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await openCalendlyPopup({ forceNewWindow: true, prefill: { customAnswers: { a1: 'example.com' } } });
    expect(new URL(String(open.mock.calls[0][0])).searchParams.get('a1')).toBe('example.com');

    await openCalendlyPopup({ prefill: { customAnswers: { a2: 'Not sure yet' } } });
    expect(iframeUrl().searchParams.get('a2')).toBe('Not sure yet');
  });
});

describe('A6-alt: no Calendly widget is loaded', () => {
  it('adds no Calendly <script> or <link> to <head>', async () => {
    const before = document.head.children.length;
    await openCalendlyPopup();
    expect(overlayEl()).not.toBeNull();
    expect(document.head.children.length).toBe(before);
    expect(document.querySelector('script[src*="calendly"], link[href*="calendly"]')).toBeNull();
    expect((window as unknown as { Calendly?: unknown }).Calendly).toBeUndefined();
  });

  it('sends calendly_popup_opened with method embedded_modal (no-op without gtag)', async () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    await openCalendlyPopup({ utmContent: 'hero' });
    expect(gtag).toHaveBeenCalledWith('event', 'calendly_popup_opened', {
      event_category: 'engagement', event_label: 'hero', method: 'embedded_modal',
    });
  });

  it('a second call while open neither adds an overlay nor re-sends the event', async () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    await openCalendlyPopup();
    await openCalendlyPopup();
    expect(document.querySelectorAll('#calendly-embedded-overlay')).toHaveLength(1);
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});

describe('Calendly modal structure and a11y (5d-lite D-10, design round A6)', () => {
  it.each([
    ['en', undefined, en.calendly],
    ['fr', fr.calendly, fr.calendly],
    ['es', es.calendly, es.calendly],
  ])('%s: named dialog; the close button sits in a toolbar before the iframe', async (_locale, labels, expected) => {
    await openCalendlyPopup(labels ? { labels } : undefined);
    const overlay = overlayEl()!;
    const dialog = overlay.querySelector('[role="dialog"]')!;
    expect(dialog.id).toBe('calendly-embedded-container');
    expect(dialog.parentElement).toBe(overlay);
    expect(overlay.getAttribute('role')).toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(expected.frameTitle);

    const close = closeEl()!;
    expect(close.tagName).toBe('BUTTON');
    expect(close.getAttribute('type')).toBe('button');
    expect(close.getAttribute('aria-label')).toBe(expected.closeDialog);
    expect(close.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');

    const bar = close.parentElement!;
    expect(bar.className).toBe('calendly-modal__bar');
    const [guardStart, , , guardEnd] = [...dialog.children];
    expect([...dialog.children]).toEqual([guardStart, bar, iframeEl(), guardEnd]);
    expect(guardStart.hasAttribute('data-focus-guard')).toBe(true);
    expect(guardEnd.hasAttribute('data-focus-guard')).toBe(true);
    expect(bar.compareDocumentPosition(iframeEl()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.activeElement).toBe(close);
  });

  it('no inline 100vh (sizing lives in calendly.scss); embed_domain is set', async () => {
    await openCalendlyPopup();
    const overlay = overlayEl()!;
    [overlay, ...overlay.querySelectorAll('*')].forEach((el) => {
      expect(el.getAttribute('style') ?? '').not.toMatch(/100vh/);
    });
    expect(overlay.outerHTML).not.toMatch(/100vh/);
    expect(iframeUrl().searchParams.get('embed_domain')).toBe(window.location.hostname);
  });

  it('the ✕ closes and returns focus to the trigger', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    await openCalendlyPopup({ labels: { closeDialog: 'Fermer', frameTitle: 'Planifier un appel' } });
    closeEl()!.click();
    expect(overlayEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('Escape closes and returns focus too', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    await openCalendlyPopup();
    pressEscape();
    expect(overlayEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('a backdrop tap does NOT close (Mauricio 2026-11-11: Calendly is multi-step)', async () => {
    await openCalendlyPopup();
    const overlay = overlayEl()!;
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(overlayEl()).toBe(overlay);
    pressEscape();
    expect(overlayEl()).toBeNull();
  });

  it('focus guards (design round 1b): Tab past the iframe and Shift+Tab before the ✕ both return focus to the ✕', async () => {
    await openCalendlyPopup();
    const guards = overlayEl()!.querySelectorAll<HTMLElement>('[data-focus-guard]');
    expect(guards).toHaveLength(2);
    guards.forEach((guard) => {
      expect(guard.tabIndex).toBe(0);
      expect(guard.textContent).toBe('');
    });
    // Tab out of the iframe lands on the end guard; Shift+Tab out of the iframe (or from the ✕) on the start guard.
    for (const guard of [guards[1], guards[0]]) {
      iframeEl()!.focus();
      guard.focus();
      expect(document.activeElement).toBe(closeEl());
    }
    pressEscape();
    expect(overlayEl()).toBeNull();
  });

  it('after closing, Escape no longer has a listener that acts', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    await openCalendlyPopup();
    pressEscape();
    const other = document.createElement('button');
    document.body.appendChild(other);
    other.focus();
    pressEscape();
    expect(document.activeElement).toBe(other);
    trigger.remove();
    other.remove();
  });
});

describe('Calendly modal scroll lock', () => {
  it('pins <body> while open and restores styles + scroll position on every close path', async () => {
    const scrollTo = vi.mocked(window.scrollTo);
    const ys = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    document.body.setAttribute('style', 'color: red;');

    try {
      for (const closeBy of ['button', 'escape'] as const) {
        scrollTo.mockClear();
        await openCalendlyPopup();
        expect(document.body.style.position).toBe('fixed');
        expect(document.body.style.top).toBe('-300px');
        expect(document.documentElement.style.overflow).toBe('hidden');

        if (closeBy === 'button') closeEl()!.click();
        else pressEscape();

        expect(document.body.getAttribute('style')).toBe('color: red;');
        expect(document.documentElement.getAttribute('style')).toBeNull();
        expect(scrollTo).toHaveBeenCalledWith(0, 300);
      }
    } finally {
      document.body.removeAttribute('style');
      if (ys) Object.defineProperty(window, 'scrollY', ys);
      else delete (window as unknown as { scrollY?: number }).scrollY;
    }
  });
});
