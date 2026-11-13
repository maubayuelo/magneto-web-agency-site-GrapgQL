/// <reference types="vitest" />
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ContactForm } from './ContactForm';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';
import { es } from '@/i18n/dictionaries/es';
import type { Locale } from '@/i18n/config';
import { BUDGET_CODES, NEED_CODES } from '@/utils/inquiry';

// CalendlyButton has no React import and Vitest uses the classic JSX runtime (Known debt; as in CalendlyButton.test.tsx).
(globalThis as unknown as { React: typeof React }).React = React;

const openModal = vi.fn();
vi.mock('@/components/organisms/EmailCollectorProvider', () => ({
  useOptionalEmailModal: () => ({ openModal }),
}));

const DICTS = { en, fr, es } as const;
const PRIVACY_HREF = { en: '/privacy-policy', fr: '/fr/privacy-policy', es: '/es/privacy-policy' } as const;

function renderForm(locale: Locale = 'en') {
  return render(
    <I18nProvider locale={locale} dictionary={DICTS[locale]}>
      <ContactForm />
    </I18nProvider>,
  );
}

function fillValid(t = en.contactForm) {
  fireEvent.change(screen.getByRole('textbox', { name: t.nameLabel }), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByRole('textbox', { name: t.emailLabel }), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByRole('textbox', { name: t.websiteLabel }), { target: { value: 'example.com' } });
  fireEvent.change(screen.getByRole('combobox', { name: t.needLabel }), { target: { value: 'care' } });
  fireEvent.change(screen.getByRole('textbox', { name: t.messageLabel }), { target: { value: 'Slow site' } });
  fireEvent.change(screen.getByRole('combobox', { name: t.budgetLabel }), { target: { value: 'not-sure' } });
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: en.contactForm.submit }));
const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as Response;

let fetchSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  openModal.mockReset();
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});
afterEach(() => fetchSpy.mockRestore());

describe('ContactForm copy (AC-4, AC-17)', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: every form string verbatim, fields in copy order, codes as values', (locale) => {
    const t = DICTS[locale].contactForm;
    const { container } = renderForm(locale);
    expect(screen.getByText(t.requiredNote)).toBeInTheDocument();
    const name = screen.getByRole('textbox', { name: t.nameLabel });
    const email = screen.getByRole('textbox', { name: t.emailLabel });
    const website = screen.getByRole('textbox', { name: t.websiteLabel });
    const need = screen.getByRole('combobox', { name: t.needLabel });
    const message = screen.getByRole('textbox', { name: t.messageLabel });
    const budget = screen.getByRole('combobox', { name: t.budgetLabel });
    const controls = [...container.querySelectorAll('input:not([name="company"]), select, textarea')];
    expect(controls).toEqual([name, email, website, need, message, budget]);

    expect(website).toHaveAccessibleDescription(t.websiteHelp);
    expect(message).toHaveAccessibleDescription(t.messageHelp);
    expect(budget).toHaveAccessibleDescription(t.budgetHelp);

    expect(within(need).getAllByRole('option').map((o) => [o.textContent, o.getAttribute('value')])).toEqual([
      [t.selectPlaceholder, ''],
      ...NEED_CODES.map((code, i) => [Object.values(t.needOptions)[i], code]),
    ]);
    expect(within(budget).getAllByRole('option').map((o) => [o.textContent, o.getAttribute('value')])).toEqual([
      [t.selectPlaceholder, ''],
      ...BUDGET_CODES.map((code, i) => [Object.values(t.budgetOptions)[i], code]),
    ]);

    expect(screen.getByRole('button', { name: t.submit })).toHaveAttribute('type', 'submit');
    const privacy = screen.getByRole('link', { name: DICTS[locale].common.privacyPolicy });
    expect(privacy).toHaveAttribute('href', PRIVACY_HREF[locale]);
    expect(privacy.parentElement).toHaveTextContent(`${t.privacyText} ${DICTS[locale].common.privacyPolicy}`);
  });

  it('a11y basics: required marks hidden, required attrs, website is text + inputMode url, no placeholders, no form aria-label', () => {
    const { container } = renderForm();
    for (const star of container.querySelectorAll('.form-field__required')) expect(star).toHaveAttribute('aria-hidden', 'true');
    for (const label of [en.contactForm.nameLabel, en.contactForm.emailLabel, en.contactForm.messageLabel]) {
      expect(screen.getByRole('textbox', { name: label })).toBeRequired();
    }
    expect(screen.getByRole('combobox', { name: en.contactForm.needLabel })).toBeRequired();
    const website = screen.getByRole('textbox', { name: en.contactForm.websiteLabel });
    expect(website).not.toBeRequired();
    expect(website).toHaveAttribute('type', 'text');
    expect(website).toHaveAttribute('inputmode', 'url');
    expect(container.querySelector('[placeholder]')).toBeNull();
    expect(container.querySelector('form')).not.toHaveAttribute('aria-label');
  });

  it('honeypot: off-screen wrapper hidden from AT, not focusable, no label', () => {
    const { container } = renderForm();
    const hp = container.querySelector('input[name="company"]')!;
    expect(hp).toHaveAttribute('tabindex', '-1');
    expect(hp).toHaveAttribute('autocomplete', 'off');
    expect(hp.closest('[aria-hidden="true"]')).toHaveClass('contact-form__hp');
    expect(container.querySelector('label[for]:not([for$="name"]):not([for$="email"]):not([for$="website"]):not([for$="need"]):not([for$="message"]):not([for$="budget"])')).toBeNull();
  });
});

describe('ContactForm validation (AC-5, AC-12)', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: empty submit → inline errors, aria-invalid, focus on the first invalid field, no fetch', (locale) => {
    const t = DICTS[locale].contactForm;
    renderForm(locale);
    fireEvent.click(screen.getByRole('button', { name: t.submit }));
    const name = screen.getByRole('textbox', { name: t.nameLabel });
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(t.errors.nameRequired);
    expect(screen.getByRole('textbox', { name: t.emailLabel })).toHaveAccessibleDescription(t.errors.emailInvalid);
    expect(screen.getByRole('combobox', { name: t.needLabel })).toHaveAccessibleDescription(t.errors.needRequired);
    expect(screen.getByRole('textbox', { name: t.messageLabel })).toHaveAccessibleDescription(`${t.messageHelp} ${t.errors.messageRequired}`);
    expect(screen.getByRole('combobox', { name: t.budgetLabel })).toHaveAccessibleDescription(`${t.budgetHelp} ${t.errors.budgetRequired}`);
    expect(screen.getByRole('textbox', { name: t.websiteLabel })).not.toHaveAttribute('aria-invalid');
    expect(document.activeElement).toBe(name);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('focus goes to the first invalid field in form order', () => {
    renderForm();
    fillValid();
    fireEvent.change(screen.getByRole('combobox', { name: en.contactForm.budgetLabel }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('combobox', { name: en.contactForm.needLabel }), { target: { value: '' } });
    submit();
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: en.contactForm.needLabel }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('website "example.com" is accepted; payload sends codes and the locale', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { success: true }));
    renderForm('fr');
    fillValid(fr.contactForm);
    fireEvent.click(screen.getByRole('button', { name: fr.contactForm.submit }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Ana', email: 'ana@example.com', website: 'example.com', need: 'care', message: 'Slow site', budget: 'not-sure', locale: 'fr', company: '',
    });
  });

  it('400 with fields → the same inline errors, focus on the first', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(400, { success: false, code: 'validation', fields: ['budget', 'email'] }));
    renderForm();
    fillValid();
    submit();
    const email = screen.getByRole('textbox', { name: en.contactForm.emailLabel });
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByRole('combobox', { name: en.contactForm.budgetLabel })).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(email);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ContactForm submit states (AC-6)', () => {
  it('sending: button disabled + aria-busy, label unchanged (D-11a)', async () => {
    let resolve!: (r: Response) => void;
    fetchSpy.mockReturnValue(new Promise<Response>((r) => { resolve = r; }));
    renderForm();
    fillValid();
    submit();
    const button = screen.getByRole('button', { name: en.contactForm.submit });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve(jsonResponse(200, { success: true })));
  });

  it.each(['en', 'fr', 'es'] as const)('%s: 200 success → success block only then, focused; form gone', async (locale) => {
    const t = DICTS[locale].contactForm;
    fetchSpy.mockResolvedValue(jsonResponse(200, { success: true, delivered: false }));
    renderForm(locale);
    expect(screen.queryByText(t.successTitle)).toBeNull();
    fillValid(t);
    fireEvent.click(screen.getByRole('button', { name: t.submit }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(`${t.successTitle}${t.successBody}`);
    // ContactForm focuses the status in a useEffect, after the node is in the DOM.
    await waitFor(() => expect(document.activeElement).toBe(status));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('200 without success:true is not a success', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { ok: 1 }));
    renderForm();
    fillValid();
    submit();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it.each([
    ['500', () => Promise.resolve(jsonResponse(500, { success: false, code: 'delivery' }))],
    ['network error', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['non-JSON', () => Promise.resolve({ ok: false, status: 502, json: () => Promise.reject(new SyntaxError('x')) } as unknown as Response)],
  ])('%s → role="alert" with sendFailed, no success text, values kept', async (_label, impl) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockImplementation(impl);
    renderForm();
    fillValid();
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent?.replace(/\s+/g, ' ')).toBe(en.contactForm.errors.sendFailed);
    expect(screen.queryByText(en.contactForm.successTitle)).toBeNull();
    expect(screen.getByRole('textbox', { name: en.contactForm.nameLabel })).toHaveValue('Ana');
    expect(screen.getByRole('textbox', { name: en.contactForm.messageLabel })).toHaveValue('Slow site');
    expect(screen.getByRole('combobox', { name: en.contactForm.budgetLabel })).toHaveValue('not-sure');
    vi.mocked(console.error).mockRestore();
  });
});

describe('ContactForm send-failure booking control (A6, AC-21)', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: alert text = sendFailed verbatim, one button named sendFailedCta that opens the booking modal', async (locale) => {
    const t = DICTS[locale].contactForm;
    fetchSpy.mockResolvedValue(jsonResponse(500, { success: false, code: 'delivery' }));
    renderForm(locale);
    fillValid(t);
    fireEvent.click(screen.getByRole('button', { name: t.submit }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent?.replace(/\s+/g, ' ')).toBe(t.errors.sendFailed);
    const buttons = within(alert).getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(t.errors.sendFailedCta);
    fireEvent.click(buttons[0]);
    expect(openModal).toHaveBeenCalledTimes(1);
    expect(openModal).toHaveBeenCalledWith(expect.objectContaining({ utmContent: 'contact_send_failed', utmTerm: 'strategy_call' }));
    expect(screen.getByRole('textbox', { name: t.nameLabel })).toHaveValue('Ana');
    expect(screen.getByRole('textbox', { name: t.websiteLabel })).toHaveValue('example.com');
  });
});
