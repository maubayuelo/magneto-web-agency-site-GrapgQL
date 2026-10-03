/// <reference types="vitest" />
import { calendlyConfig, openCalendlyPopup } from './calendly';

describe('openCalendlyPopup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // The new-tab path builds the same link as the popup without loading Calendly's script.
  const openInNewTab = async (options: Parameters<typeof openCalendlyPopup>[0]) => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    await openCalendlyPopup({ ...options, forceNewWindow: true });
    return new URL(String(open.mock.calls[0][0]));
  };

  it('uses the Magneto strategy-call event by default', async () => {
    const url = await openInNewTab({});

    expect(calendlyConfig.url).toBe('https://calendly.com/magnetomarketing/free-strategy-call');
    expect(url.origin + url.pathname).toBe(calendlyConfig.url);
  });

  it('adds name and email to the link so Calendly opens with them filled in', async () => {
    const url = await openInNewTab({ prefill: { name: 'Ana María', email: 'ana+web@example.com' } });

    expect(url.searchParams.get('name')).toBe('Ana María');
    expect(url.searchParams.get('email')).toBe('ana+web@example.com');
  });

  it('leaves name and email off the link when nothing was collected', async () => {
    const url = await openInNewTab({ prefill: { name: '', email: '' } });

    expect(url.searchParams.has('name')).toBe(false);
    expect(url.searchParams.has('email')).toBe(false);
  });
});
