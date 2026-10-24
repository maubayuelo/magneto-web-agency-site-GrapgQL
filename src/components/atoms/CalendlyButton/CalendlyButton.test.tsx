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
    warmCalendlyResources: vi.fn(),
  };
});

// Vitest compiles JSX with the classic runtime (React.createElement), but CalendlyButton relies on
// Next's automatic runtime and does not import React. Expose React globally for this file only;
// vitest.config.ts is out of scope for Phase 0.5b.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const MODAL_EMAIL_PLACEHOLDER = 'you@company.com';
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

    expect(await screen.findByPlaceholderText(MODAL_EMAIL_PLACEHOLDER)).toBeInTheDocument();
    expect(openCalendlyPopup).not.toHaveBeenCalled();
  });

  it('b. without a provider: renders, and click opens Calendly directly with the props', async () => {
    expect(() => render(<CalendlyButton {...props}>Book</CalendlyButton>)).not.toThrow();

    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    await waitFor(() => expect(openCalendlyPopup).toHaveBeenCalledTimes(1));
    expect(openCalendlyPopup).toHaveBeenCalledWith({ ...props, forceNewWindow: undefined });
    expect(screen.queryByPlaceholderText(MODAL_EMAIL_PLACEHOLDER)).not.toBeInTheDocument();
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
    expect(screen.queryByPlaceholderText(MODAL_EMAIL_PLACEHOLDER)).not.toBeInTheDocument();
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
    expect(screen.queryByPlaceholderText(MODAL_EMAIL_PLACEHOLDER)).not.toBeInTheDocument();
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
    expect(screen.queryByPlaceholderText(MODAL_EMAIL_PLACEHOLDER)).not.toBeInTheDocument();
  });
});
