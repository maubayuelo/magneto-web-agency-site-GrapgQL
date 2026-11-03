/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EmailCollectorProvider, { useEmailModal } from './index';
import * as calendly from '@/utils/calendly';
import * as utmUtil from '@/utils/utm';
import { I18nProvider } from '@/i18n/I18nProvider';
import { CalendlyButton } from '@/components/atoms/CalendlyButton';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';
import { es } from '@/i18n/dictionaries/es';

// CalendlyButton has no React import and Vitest uses the classic JSX runtime (Known debt; as in CalendlyButton.test.tsx).
(globalThis as unknown as { React: typeof React }).React = React;

const DICTS = { en, fr, es } as const;
// gtagEvent records its last call here in tests.
const gtagHook = window as unknown as { __lastGtagEvent?: unknown[] };
type Loc = keyof typeof DICTS;

// jsdom 21 has no showModal/close (spec E26). Minimal stand-ins: the browser behaviour is verified in Chrome (§6.0).
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
function closeDialog(this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
}
/** What a browser does on Escape for a modal dialog: `cancel`, then close unless prevented. */
function pressEscape(dialog: HTMLElement) {
  const notPrevented = fireEvent(dialog, new Event('cancel', { cancelable: true }));
  if (notPrevented) act(() => (dialog as HTMLDialogElement).close());
}

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: closeDialog });
  // jsdom has no scrollTo; the scroll-lock unlock calls it (tests that check it install their own spy).
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

type Opts = Parameters<ReturnType<typeof useEmailModal>['openModal']>[0];
function TestTrigger({ opts, label = 'Open Modal' }: { opts?: Opts; label?: string }) {
  const { openModal } = useEmailModal();
  return <button onClick={() => openModal(opts)}>{label}</button>;
}

function renderWith(ui: React.ReactNode, locale: Loc = 'en') {
  return render(
    <I18nProvider locale={locale} dictionary={DICTS[locale]}>
      <EmailCollectorProvider>{ui}</EmailCollectorProvider>
    </I18nProvider>,
  );
}

/** Clicks like a user: the trigger has focus when openModal runs. */
function openFrom(button: HTMLElement) {
  button.focus();
  fireEvent.click(button);
}

let fetchSpy: ReturnType<typeof vi.fn>;
let calendlySpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  showModal.mockClear();
  gtagHook.__lastGtagEvent = undefined;
  fetchSpy = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/mailchimp') || url.includes('/api/download-check')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
  global.fetch = fetchSpy as unknown as typeof fetch;
  calendlySpy = vi.spyOn(calendly, 'openCalendlyPopup').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EmailCollectorProvider: booking dialog, variant B (5d-lite §5)', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: named by the main label, 3 optional questions, no name or email', (locale) => {
    const t = DICTS[locale];
    renderWith(<TestTrigger opts={{ origin: 'header' }} />, locale);
    openFrom(screen.getByText('Open Modal'));

    const dialog = screen.getByRole('dialog', { name: t.common.bookStrategyCall });
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 2, name: t.common.bookStrategyCall })).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(t.bookingModal.body);

    expect(screen.getByLabelText(t.contactForm.websiteLabel)).toHaveAccessibleDescription(t.bookingModal.websiteHelp);
    expect(screen.getByLabelText(t.contactForm.needLabel).tagName).toBe('SELECT');
    expect(screen.getByLabelText(t.bookingModal.problemLabel)).toHaveAccessibleDescription(t.bookingModal.problemHelp);
    for (const opt of Object.values(t.contactForm.needOptions)) expect(screen.getByRole('option', { name: opt })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: t.contactForm.selectPlaceholder })).toBeDisabled();
    expect(dialog.querySelectorAll('[required]')).toHaveLength(0);
    expect(dialog.querySelector('input[type="email"], input[name="name"], input[name="email"]')).toBeNull();

    expect(screen.getByRole('button', { name: t.bookingModal.continue })).toBeInTheDocument();
    expect(dialog.textContent).toContain(t.bookingModal.privacyText);
    const prefix = locale === 'en' ? '' : `/${locale}`;
    expect(screen.getByRole('link', { name: t.common.privacyPolicy })).toHaveAttribute('href', `${prefix}/privacy-policy`);
    expect(screen.getByRole('button', { name: t.common.close })).toBeInTheDocument();
  });

  it('continue with answers: no Mailchimp call, Calendly gets only the non-empty answers (a2 = the label seen, FR)', async () => {
    renderWith(<TestTrigger opts={{ origin: 'hero', utmContent: 'hero_home' }} />, 'fr');
    openFrom(screen.getByText('Open Modal'));

    fireEvent.change(screen.getByLabelText(fr.contactForm.websiteLabel), { target: { value: '  example.com ' } });
    fireEvent.change(screen.getByLabelText(fr.contactForm.needLabel), { target: { value: 'fix-improve' } });
    fireEvent.click(screen.getByRole('button', { name: fr.bookingModal.continue }));

    await waitFor(() => expect(calendlySpy).toHaveBeenCalledTimes(1));
    const args = calendlySpy.mock.calls[0][0]!;
    expect(args.prefill).toEqual({ customAnswers: { a1: 'example.com', a2: fr.contactForm.needOptions.fixImprove } });
    expect(args.utmContent).toBe('hero_home');
    expect(args.labels).toEqual(fr.calendly);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(gtagHook.__lastGtagEvent).toBeUndefined(); // no mailchimp_* events
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('continue with nothing filled: straight to Calendly, without prefill', async () => {
    vi.spyOn(utmUtil, 'getUtm').mockReturnValue({ utm_source: 'newsletter', utm_content: 'hero_home' });
    renderWith(<TestTrigger opts={{ origin: 'header' }} />);
    openFrom(screen.getByText('Open Modal'));
    fireEvent.click(screen.getByRole('button', { name: en.bookingModal.continue }));

    await waitFor(() => expect(calendlySpy).toHaveBeenCalledTimes(1));
    const args = calendlySpy.mock.calls[0][0]!;
    expect(args).not.toHaveProperty('prefill');
    expect(args.utmContent).toBe('header');
    expect(args.utmParams).toEqual({ utm_source: 'newsletter', utm_content: 'hero_home' });
    expect(args).not.toHaveProperty('labels'); // EN uses calendly.ts defaults
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the problem answer is passed as a3; field limits are 2048 / 500', async () => {
    renderWith(<TestTrigger />);
    openFrom(screen.getByText('Open Modal'));
    expect(screen.getByLabelText(en.contactForm.websiteLabel)).toHaveAttribute('maxLength', '2048');
    const problem = screen.getByLabelText(en.bookingModal.problemLabel);
    expect(problem).toHaveAttribute('maxLength', '500');
    fireEvent.change(problem, { target: { value: 'Slow site' } });
    fireEvent.click(screen.getByRole('button', { name: en.bookingModal.continue }));
    await waitFor(() => expect(calendlySpy).toHaveBeenCalledTimes(1));
    expect(calendlySpy.mock.calls[0][0]!.prefill).toEqual({ customAnswers: { a3: 'Slow site' } });
  });
});

describe('EmailCollectorProvider: dialog accessibility (5d-lite §6, native <dialog>)', () => {
  it('open → focus on the first form control (booking: Website)', () => {
    renderWith(<TestTrigger />);
    openFrom(screen.getByText('Open Modal'));
    expect(document.activeElement).toBe(screen.getByLabelText(en.contactForm.websiteLabel));
  });

  it('Escape (cancel) closes and focus returns to the trigger', () => {
    renderWith(<TestTrigger />);
    const trigger = screen.getByText('Open Modal');
    openFrom(trigger);
    pressEscape(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('the close button closes and focus returns to the trigger', () => {
    renderWith(<TestTrigger />);
    const trigger = screen.getByText('Open Modal');
    openFrom(trigger);
    fireEvent.click(screen.getByRole('button', { name: en.common.close }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('continue: focus is back on the trigger before Calendly opens', async () => {
    let focusedWhenCalendlyOpened: Element | null = null;
    calendlySpy.mockImplementation(async () => {
      focusedWhenCalendlyOpened = document.activeElement;
    });
    renderWith(<TestTrigger />);
    const trigger = screen.getByText('Open Modal');
    openFrom(trigger);
    fireEvent.click(screen.getByRole('button', { name: en.bookingModal.continue }));
    await waitFor(() => expect(calendlySpy).toHaveBeenCalledTimes(1));
    expect(focusedWhenCalendlyOpened).toBe(trigger);
  });

  it.each(['en', 'fr', 'es'] as const)('%s: the send-failure booking button (A6) gets focus back after Escape (AC-21)', (locale) => {
    const t = DICTS[locale];
    renderWith(
      <CalendlyButton variant="secondary" size="sm" className="form-error__cta" utmContent="contact_send_failed" utmTerm="strategy_call">
        {t.contactForm.errors.sendFailedCta}
      </CalendlyButton>,
      locale,
    );
    const button = screen.getByRole('button', { name: t.contactForm.errors.sendFailedCta });
    openFrom(button);
    expect(screen.getByRole('dialog', { name: t.common.bookStrategyCall })).toBeInTheDocument();
    pressEscape(screen.getByRole('dialog'));
    expect(document.activeElement).toBe(button);
  });

  it('a trigger that is no longer rendered: focus is not left inside a removed dialog', () => {
    function Vanishing() {
      const { openModal } = useEmailModal();
      const [shown, setShown] = React.useState(true);
      return shown ? (
        <button onClick={() => { openModal(); setShown(false); }}>Menu item</button>
      ) : null;
    }
    renderWith(<Vanishing />);
    openFrom(screen.getByText('Menu item'));
    pressEscape(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('download branch: same shell (named <h2>, focus on Name), Escape returns focus', () => {
    renderWith(<TestTrigger opts={{ downloadUrl: '/assets/guides/free-guide.pdf' }} />);
    const trigger = screen.getByText('Open Modal');
    openFrom(trigger);
    expect(screen.getByRole('dialog', { name: en.emailModal.downloadTitle })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { level: 2, name: en.emailModal.downloadTitle })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByPlaceholderText(en.forms.namePlaceholder));
    pressEscape(screen.getByRole('dialog'));
    expect(document.activeElement).toBe(trigger);
  });
});

describe('EmailCollectorProvider: download branch unchanged (A5)', () => {
  it('fires mailchimp_subscribed and lead_download_ready on download flow', async () => {
    renderWith(<TestTrigger opts={{ downloadUrl: '/assets/guides/free-guide.pdf', utmContent: 'leadmagnet_home' }} />);
    openFrom(screen.getByText('Open Modal'));

    const emailInput = await screen.findByPlaceholderText('you@company.com');
    const nameInput = screen.getByPlaceholderText('Your name');
    const submit = screen.getByRole('button', { name: /Continue to Download the Guide|Submitting.../i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'Tester' } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(gtagHook.__lastGtagEvent).toBeDefined();
    });
    expect(fetchSpy).toHaveBeenCalledWith('/api/mailchimp', expect.objectContaining({ method: 'POST' }));

    const args = gtagHook.__lastGtagEvent!;
    expect(args[0]).toBe('event');
    expect(['lead_download_ready', 'mailchimp_subscribed'].includes(String(args[1]))).toBe(true);
    const payload = (args[2] || {}) as { event_category?: string; event_label?: string; utm_content?: string };
    expect(payload.event_category).toBe('engagement');
    expect(payload.event_label === 'leadmagnet_home' || payload.utm_content === 'leadmagnet_home' || payload.event_label === 'download').toBe(true);
    // Success state: the guide is ready, Calendly is never opened from this branch.
    expect(await screen.findByText(en.emailModal.downloadReady)).toBeInTheDocument();
    expect(calendlySpy).not.toHaveBeenCalled();
  });

  it('Escape is ignored while the download submit is in flight', async () => {
    let resolve!: (r: Response) => void;
    fetchSpy.mockImplementation(() => new Promise<Response>((r) => { resolve = r; }));
    renderWith(<TestTrigger opts={{ downloadUrl: '/assets/guides/free-guide.pdf' }} />);
    openFrom(screen.getByText('Open Modal'));
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: en.emailModal.continueDownload }));
    await screen.findByRole('button', { name: en.emailModal.submitting });
    pressEscape(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => resolve(new Response(JSON.stringify({ success: true }), { status: 200 })));
  });
});

describe('EmailCollectorProvider: page scroll lock and close button (5d-lite iOS fixes)', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;
  const html = document.documentElement;
  const body = document.body;

  beforeEach(() => {
    // The page was scrolled to y=420 before the dialog opened.
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 420 });
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 });
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;
    html.removeAttribute('style');
    body.setAttribute('style', 'color: red;'); // a pre-existing inline style must come back unchanged
  });

  afterEach(() => {
    html.removeAttribute('style');
    body.removeAttribute('style');
  });

  function expectLocked() {
    expect(html.style.overflow).toBe('hidden');
    expect(body.style.position).toBe('fixed');
    expect(body.style.top).toBe('-420px');
    expect(body.style.overflow).toBe('hidden');
  }
  function expectRestored() {
    expect(html.getAttribute('style')).toBeNull();
    expect(body.getAttribute('style')).toBe('color: red;');
    expect(scrollToSpy).toHaveBeenLastCalledWith(0, 420);
  }

  it('locks on open and restores exactly on Escape', () => {
    renderWith(<TestTrigger />);
    openFrom(screen.getByText('Open Modal'));
    expectLocked();
    expect(scrollToSpy).not.toHaveBeenCalled();
    pressEscape(screen.getByRole('dialog'));
    expectRestored();
  });

  it('restores on the close button and before focus returns to the trigger', () => {
    renderWith(<TestTrigger />);
    const trigger = screen.getByText('Open Modal');
    openFrom(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');
    fireEvent.click(screen.getByRole('button', { name: en.common.close }));
    expectRestored();
    expect(scrollToSpy.mock.invocationCallOrder[0]).toBeLessThan(focusSpy.mock.invocationCallOrder[0]);
    expect(document.activeElement).toBe(trigger);
  });

  it('restores before Calendly opens on Continue', async () => {
    renderWith(<TestTrigger />);
    openFrom(screen.getByText('Open Modal'));
    calendlySpy.mockImplementation(async () => {
      expect(body.style.position).toBe('');
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: en.bookingModal.continue }));
    });
    expect(calendlySpy).toHaveBeenCalledTimes(1);
    expectRestored();
  });

  it('restores if the provider unmounts with the dialog open', () => {
    const { unmount } = renderWith(<TestTrigger />);
    openFrom(screen.getByText('Open Modal'));
    expectLocked();
    unmount();
    expectRestored();
  });

  it.each(['en', 'fr', 'es'] as const)('%s: close button keeps its name; the icon is hidden from AT', (locale) => {
    renderWith(<TestTrigger />, locale);
    openFrom(screen.getByText('Open Modal'));
    const close = screen.getByRole('button', { name: DICTS[locale].common.close });
    expect(close).toHaveClass('ec-close');
    expect(close).toHaveAttribute('type', 'button');
    expect(close.textContent).toBe('');
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
