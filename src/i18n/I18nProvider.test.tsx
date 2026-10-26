/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nProvider';
import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';

function Probe() {
  const { locale, t } = useI18n();
  return (
    <p>
      {locale}|{t.nav.about}
    </p>
  );
}

describe('I18nProvider / useI18n', () => {
  it('passes the provider locale and dictionary to useI18n()', () => {
    render(
      <I18nProvider locale="fr" dictionary={fr}>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText(`fr|${fr.nav.about}`)).toBeInTheDocument();
  });

  it('falls back to EN outside a provider', () => {
    render(<Probe />);
    expect(screen.getByText(`en|${en.nav.about}`)).toBeInTheDocument();
  });

  it('renders no DOM of its own', () => {
    const { container } = render(
      <I18nProvider locale="en" dictionary={en}>
        <span>child</span>
      </I18nProvider>,
    );
    expect(container.innerHTML).toBe('<span>child</span>');
  });
});
