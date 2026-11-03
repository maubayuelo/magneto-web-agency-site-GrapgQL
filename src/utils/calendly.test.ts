/// <reference types="vitest" />
import { CALENDLY_SCRIPT, calendlyConfig, openCalendlyPopup } from './calendly';

// 5d-lite, D-8 revised + Option A (Senior Architect, 2026-11-02): one Calendly event for every locale and trigger.
const EVENT = 'https://calendly.com/magnetomarketing/free-strategy-call';
const OTHER = 'https://calendly.com/mauriciobayuelo/free-discovery-call';

type CalendlyGlobal = { initPopupWidget: ReturnType<typeof vi.fn>; initBadgeWidget: ReturnType<typeof vi.fn> };
const w = window as unknown as { Calendly?: CalendlyGlobal };

const opened = (url: string) => new URL(url);

describe('openCalendlyPopup: single event (D-8 revised, Option A)', () => {
  beforeAll(() => {
    // loadCalendlyScript resolves when the script tag exists and the global is there (no network in jsdom).
    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT;
    document.head.appendChild(script);
  });

  beforeEach(() => {
    w.Calendly = { initPopupWidget: vi.fn(), initBadgeWidget: vi.fn() };
    document.getElementById('calendly-embedded-overlay')?.remove();
  });
  afterEach(() => {
    delete w.Calendly;
    vi.restoreAllMocks();
  });

  it('the code default is the one event', () => {
    expect(calendlyConfig.url).toBe(EVENT);
  });

  it('popup widget: opens the event even when a CMS customUrl points at another event', async () => {
    await openCalendlyPopup({ customUrl: OTHER, utmContent: 'hero', utmTerm: 'strategy_call' });
    const url = opened(w.Calendly!.initPopupWidget.mock.calls[0][0].url);
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    // Existing utm behaviour unchanged.
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'website', utm_medium: 'cta', utm_campaign: 'strategy_call', utm_content: 'hero', utm_term: 'strategy_call',
    });
  });

  it('popup widget without customUrl: same event and utm defaults', async () => {
    await openCalendlyPopup();
    const url = opened(w.Calendly!.initPopupWidget.mock.calls[0][0].url);
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(url.searchParams.get('utm_content')).toBeNull();
  });

  it('new window: opens the event, not the customUrl', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await openCalendlyPopup({ customUrl: OTHER, forceNewWindow: true });
    expect(open).toHaveBeenCalledTimes(1);
    const url = opened(String(open.mock.calls[0][0]));
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(w.Calendly!.initPopupWidget).not.toHaveBeenCalled();
  });

  it('iframe fallback (popup widget throws): the iframe loads the event, not the customUrl', async () => {
    w.Calendly!.initPopupWidget.mockImplementation(() => { throw new Error('widget failed'); });
    await openCalendlyPopup({ customUrl: OTHER });
    const iframe = document.querySelector<HTMLIFrameElement>('#calendly-embedded-overlay iframe');
    expect(iframe).not.toBeNull();
    const url = opened(iframe!.src);
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(iframe!.src).not.toContain('mauriciobayuelo');
  });
});

describe('openCalendlyPopup: booking answers a1–a3 (5d-lite §5.2, B2)', () => {
  beforeEach(() => {
    w.Calendly = { initPopupWidget: vi.fn(), initBadgeWidget: vi.fn() };
    document.getElementById('calendly-embedded-overlay')?.remove();
  });
  afterEach(() => {
    delete w.Calendly;
    vi.restoreAllMocks();
  });

  const widgetUrl = () => opened(w.Calendly!.initPopupWidget.mock.calls[0][0].url);

  it('sets a1–a3 on the popup widget URL, utm unchanged', async () => {
    await openCalendlyPopup({
      utmContent: 'header',
      prefill: { customAnswers: { a1: 'example.com', a2: 'Corriger ou améliorer mon site actuel', a3: 'Slow & old' } },
    });
    const url = widgetUrl();
    expect(`${url.origin}${url.pathname}`).toBe(EVENT);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'website', utm_medium: 'cta', utm_campaign: 'strategy_call', utm_content: 'header',
      a1: 'example.com', a2: 'Corriger ou améliorer mon site actuel', a3: 'Slow & old',
    });
  });

  it('only non-empty answers are set', async () => {
    await openCalendlyPopup({ prefill: { customAnswers: { a1: '', a2: '   ', a3: 'Need more leads' } } });
    const params = widgetUrl().searchParams;
    expect(params.has('a1')).toBe(false);
    expect(params.has('a2')).toBe(false);
    expect(params.get('a3')).toBe('Need more leads');
  });

  it('no prefill → no a1–a3 (existing callers unchanged)', async () => {
    await openCalendlyPopup({ utmContent: 'hero' });
    const keys = [...widgetUrl().searchParams.keys()];
    expect(keys.some((k) => /^a\d$/.test(k))).toBe(false);
  });

  it('new window and iframe fallback receive the same answers', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await openCalendlyPopup({ forceNewWindow: true, prefill: { customAnswers: { a1: 'example.com' } } });
    expect(new URL(String(open.mock.calls[0][0])).searchParams.get('a1')).toBe('example.com');

    w.Calendly!.initPopupWidget.mockImplementation(() => { throw new Error('widget failed'); });
    await openCalendlyPopup({ prefill: { customAnswers: { a2: 'Not sure yet' } } });
    const iframe = document.querySelector<HTMLIFrameElement>('#calendly-embedded-overlay iframe')!;
    expect(new URL(iframe.src).searchParams.get('a2')).toBe('Not sure yet');
  });
});

describe('Calendly iframe fallback dialog a11y (5d-lite D-10)', () => {
  beforeEach(() => {
    w.Calendly = { initPopupWidget: vi.fn(() => { throw new Error('widget failed'); }), initBadgeWidget: vi.fn() };
    document.getElementById('calendly-embedded-overlay')?.remove();
  });
  afterEach(() => {
    delete w.Calendly;
    vi.restoreAllMocks();
  });

  it('is named by the frame title, focuses its close button, and returns focus on close', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    await openCalendlyPopup({ labels: { closeDialog: 'Fermer', frameTitle: 'Planifier un appel' } });
    const overlay = document.getElementById('calendly-embedded-overlay')!;
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(overlay.getAttribute('aria-label')).toBe('Planifier un appel');
    const close = document.getElementById('calendly-embedded-close')!;
    expect(close.getAttribute('aria-label')).toBe('Fermer');
    expect(document.activeElement).toBe(close);

    close.click();
    expect(document.getElementById('calendly-embedded-overlay')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('Escape closes and returns focus too', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    await openCalendlyPopup();
    expect(document.getElementById('calendly-embedded-overlay')!.getAttribute('aria-label')).toBe('Calendly scheduling'); // EN default (en.calendly.frameTitle)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('calendly-embedded-overlay')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
