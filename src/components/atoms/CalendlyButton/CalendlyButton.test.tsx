/// <reference types="vitest" />
// Characterization test: written before the useOptionalEmailModal refactor (Phase 0.5b) and run
// unchanged before and after it. It never submits the email modal.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendlyButton } from './index';
import EmailCollectorProvider from '@/components/organisms/EmailCollectorProvider';
import { openCalendlyPopup } from '@/utils/calendly';

vi.mock('@/utils/calendly', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/calendly')>();
  return {
    ...actual,
    openCalendlyPopup: vi.fn(async () => undefined),
  };
});

// Vitest compiles JSX with the classic runtime (React.createElement), but CalendlyButton relies on
// Next's automatic runtime and does not import React. Expose React globally for this file only;
// vitest.config.ts is out of scope for Phase 0.5b.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

// 5d-lite: the booking modal is a native <dialog> named by the main label (variant B). jsdom 21 has no showModal,
// so a spy stands in: "modal opened" = showModal called + a dialog with that name; "no modal" = neither.
const DIALOG_NAME = 'Book a Free Strategy Call';
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
});
const expectNoModal = () => {
  expect(showModal).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
};
const props = {
  utmContent: 'test_content',
  utmTerm: 'test_term',
  customUrl: 'https://calendly.com/example/test',
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('CalendlyButton', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.mocked(openCalendlyPopup).mockClear();
    showModal.mockClear();
    global.fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('a. inside the provider: click opens the email modal, not Calendly', async () => {
    render(
      <EmailCollectorProvider>
        <CalendlyButton {...props}>Book</CalendlyButton>
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByRole('dialog', { name: DIALOG_NAME })).toBeInTheDocument();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(openCalendlyPopup).not.toHaveBeenCalled();
  });

  it('b. without a provider: renders, and click opens Calendly directly with the props', async () => {
    expect(() => render(<CalendlyButton {...props}>Book</CalendlyButton>)).not.toThrow();

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    await waitFor(() => expect(openCalendlyPopup).toHaveBeenCalledTimes(1));
    expect(openCalendlyPopup).toHaveBeenCalledWith({ ...props, forceNewWindow: undefined });
    expectNoModal();
  });

  it('c. inside the provider with skipCollector: opens Calendly, no modal', async () => {
    render(
      <EmailCollectorProvider>
        <CalendlyButton {...props} skipCollector>
          Book
        </CalendlyButton>
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    await waitFor(() => expect(openCalendlyPopup).toHaveBeenCalledTimes(1));
    expect(openCalendlyPopup).toHaveBeenCalledWith({ ...props, forceNewWindow: undefined });
    await flush();
    expectNoModal();
  });

  it('d. inside the provider with forceNewWindow: opens Calendly with forceNewWindow, no modal', async () => {
    render(
      <EmailCollectorProvider>
        <CalendlyButton {...props} forceNewWindow>
          Book
        </CalendlyButton>
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    await waitFor(() => expect(openCalendlyPopup).toHaveBeenCalledTimes(1));
    expect(openCalendlyPopup).toHaveBeenCalledWith({ ...props, forceNewWindow: true });
    await flush();
    expectNoModal();
  });

  it('e. disabled: click opens neither the modal nor Calendly', async () => {
    render(
      <EmailCollectorProvider>
        <CalendlyButton {...props} disabled>
          Book
        </CalendlyButton>
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    await flush();
    expect(openCalendlyPopup).not.toHaveBeenCalled();
    expectNoModal();
  });
});
