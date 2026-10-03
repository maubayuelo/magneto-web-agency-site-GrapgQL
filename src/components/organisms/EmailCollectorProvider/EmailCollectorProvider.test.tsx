/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailCollectorProvider, { useEmailModal } from './index';
import * as calendly from '@/utils/calendly';
import * as utmUtil from '@/utils/utm';

// helper component to trigger modal open from tests
function TestTrigger({ opts }: { opts?: any }) {
  const { openModal } = useEmailModal();
  return <button onClick={() => openModal(opts)}>Open Modal</button>;
}

describe('EmailCollectorProvider analytics flows', () => {
  beforeEach(() => {
    // reset last gtag event
    // @ts-ignore
    window.__lastGtagEvent = undefined;
    // mock fetch default to success
    // @ts-ignore
    global.fetch = (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url.includes('/api/mailchimp')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      if (url.includes('/api/download-check')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    };

    // mock openCalendlyPopup so we don't load external script
    vi.spyOn(calendly, 'openCalendlyPopup').mockImplementation(async () => {
      // simulate Calendly opening
      // @ts-ignore
      window.__lastCalendly = true;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    // @ts-ignore
    delete window.__lastCalendly;
    vi.restoreAllMocks();
  });

  it('fires mailchimp_subscribed and lead_download_ready on download flow', async () => {
    render(
      <EmailCollectorProvider>
        <TestTrigger opts={{ downloadUrl: '/assets/guides/free-guide.pdf', utmContent: 'leadmagnet_home' }} />
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    // Modal should show and have an input for email
    const emailInput = await screen.findByPlaceholderText('you@company.com');
    const nameInput = screen.getByPlaceholderText('Your name');
    const submit = screen.getByRole('button', { name: /Continue to Download the Guide|Submitting...|Subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'Tester' } });

    fireEvent.click(submit);

    // wait for the download-check to be called and success message area
    await waitFor(() => {
      // @ts-ignore
      expect(window.__lastGtagEvent).toBeDefined();
    });

    // Check that the last gtag event corresponds to lead_download_ready or mailchimp_subscribed
    // @ts-ignore
    const args = window.__lastGtagEvent;
    expect(args[0]).toBe('event');
    const eventName = args[1];
    expect(['lead_download_ready', 'mailchimp_subscribed'].includes(eventName)).toBe(true);

    // Validate payload shape for the download event (args[2]) if present
    const payload = args[2] || {};
    expect(payload.event_category).toBe('engagement');
    // Either origin or utm_content should reflect the download origin
    expect(payload.event_label === 'leadmagnet_home' || payload.utm_content === 'leadmagnet_home' || payload.event_label === 'download').toBe(true);
  });

  it('fires mailchimp_subscribed_then_calendly and opens calendly on calendly flow', async () => {
    // Simulate URL has UTM params
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { search: '?utm_source=newsletter&utm_medium=email&utm_campaign=test_campaign&utm_content=hero_home' };

    // Ensure UTM util will read the location
    vi.spyOn(utmUtil, 'getUtm').mockImplementation(() => ({ utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'test_campaign', utm_content: 'hero_home' }));

    render(
      <EmailCollectorProvider>
        <TestTrigger opts={{ origin: 'hero', utmContent: 'hero_home', customUrl: undefined }} />
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    const emailInput = await screen.findByPlaceholderText('you@company.com');
    const nameInput = screen.getByPlaceholderText('Your name');
    const submit = screen.getByRole('button', { name: /Continue to Book Call|Submitting...|Subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'test2@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'Tester 2' } });
    // joining the list is opt-in in the booking flow
    fireEvent.click(screen.getByRole('checkbox', { name: /occasional tips from Magneto/i }));

    fireEvent.click(submit);

    // wait for calendly open to be called
    await waitFor(() => {
      // @ts-ignore
      expect(window.__lastCalendly).toBeTruthy();
    });

    // Validate gtag event was called for the mailchimp->calendly flow and check payload
    // @ts-ignore
  const argsCal = window.__lastGtagEvent;
    expect(argsCal[0]).toBe('event');
    expect(argsCal[1]).toBe('mailchimp_subscribed_then_calendly');
    const payloadCal = argsCal[2] || {};
    expect(payloadCal.event_category).toBe('engagement');
    expect(payloadCal.method).toBe('calendly');
    expect(payloadCal.origin === 'hero' || payloadCal.utm_content === 'hero_home' || payloadCal.event_label === 'hero_home').toBe(true);

    // The mock openCalendlyPopup should have received utmParams from the util
    // @ts-ignore
    const lastCalendlyCall = (calendly.openCalendlyPopup as any).mock.calls[0][0];
    expect(lastCalendlyCall).toBeTruthy();
    expect(lastCalendlyCall.utmParams).toBeDefined();
    expect(lastCalendlyCall.utmParams.utm_source).toBe('newsletter');
    // name and email typed in the modal are handed to Calendly
    expect(lastCalendlyCall.prefill).toEqual({ name: 'Tester 2', email: 'test2@example.com' });
  });

  it('books without subscribing when the opt-in box is left unticked', async () => {
    const fetchedUrls: string[] = [];
    const baseFetch = global.fetch;
    // @ts-ignore
    global.fetch = (input: any, init?: any) => {
      fetchedUrls.push(typeof input === 'string' ? input : String(input?.url || ''));
      return baseFetch(input, init);
    };

    render(
      <EmailCollectorProvider>
        <TestTrigger opts={{ origin: 'hero', utmContent: 'hero_home' }} />
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    const emailInput = await screen.findByPlaceholderText('you@company.com');
    const optIn = screen.getByRole('checkbox', { name: /occasional tips from Magneto/i }) as HTMLInputElement;
    expect(optIn.checked).toBe(false);

    fireEvent.change(emailInput, { target: { value: 'booker@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Booker' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Book Call/i }));

    await waitFor(() => {
      // @ts-ignore
      expect(window.__lastCalendly).toBeTruthy();
    });

    // nobody is added to the list, and no subscribe conversion is reported
    expect(fetchedUrls.some((u) => u.includes('/api/mailchimp'))).toBe(false);
    // @ts-ignore
    expect(window.__lastGtagEvent).toBeUndefined();

    const call = (calendly.openCalendlyPopup as any).mock.calls[0][0];
    expect(call.prefill).toEqual({ name: 'Booker', email: 'booker@example.com' });
  });

  it('does not show the opt-in box in the download flow, which always subscribes', async () => {
    render(
      <EmailCollectorProvider>
        <TestTrigger opts={{ downloadUrl: '/assets/guides/free-guide.pdf' }} />
      </EmailCollectorProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));
    await screen.findByPlaceholderText('you@company.com');

    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
