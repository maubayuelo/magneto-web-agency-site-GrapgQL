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
