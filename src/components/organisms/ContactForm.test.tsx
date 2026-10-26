/// <reference types="vitest" />
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ContactForm } from './ContactForm';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';

describe('ContactForm i18n', () => {
  it('renders EN labels outside a provider (unchanged)', () => {
    render(<ContactForm />);
    expect(screen.getByRole('form', { name: en.contactForm.ariaLabel })).toBeInTheDocument();
    expect(screen.getByLabelText(en.contactForm.nameLabel, { exact: false })).toHaveAttribute('placeholder', 'Your name');
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('renders FR labels, keeps EN option values, and shows the FR validation error on an empty submit', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(
      <I18nProvider locale="fr" dictionary={fr}>
        <ContactForm />
      </I18nProvider>,
    );

    const form = screen.getByRole('form', { name: fr.contactForm.ariaLabel });
    expect(screen.getByLabelText(fr.contactForm.nameLabel, { exact: false })).toHaveAttribute('placeholder', fr.forms.namePlaceholder);
    expect(screen.getByRole('option', { name: fr.contactForm.businessTypes.realEstate })).toHaveAttribute('value', 'Real State');
    expect(screen.getByRole('button', { name: fr.contactForm.send })).toBeInTheDocument();

    // Validation runs before fetch: no network.
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(fr.contactForm.errors.nameRequired);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
