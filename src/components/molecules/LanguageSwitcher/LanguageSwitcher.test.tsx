/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './index';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/fr/services');
  });

  it('renders nothing with a single locale', () => {
    const { container } = render(<LanguageSwitcher locales={['en']} currentLocale="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('links the same page in every enabled locale', () => {
    render(<LanguageSwitcher locales={['en', 'fr', 'es']} currentLocale="fr" />);
    const group = screen.getByRole('group', { name: 'Language' });
    expect(group).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/services', '/fr/services', '/es/services']);
    expect(links.map((a) => a.textContent)).toEqual(['EN', 'FR', 'ES']);
    expect(screen.getByRole('link', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Français' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Español' })).toBeInTheDocument();
  });

  it('marks only the current locale with aria-current', () => {
    render(<LanguageSwitcher locales={['en', 'fr', 'es']} currentLocale="fr" />);
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'true');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('FR');
  });

  it('sets lang and hrefLang on each link', () => {
    render(<LanguageSwitcher locales={['en', 'fr', 'es']} currentLocale="en" />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => [a.getAttribute('lang'), a.getAttribute('hreflang')])).toEqual([
      ['en', 'en'],
      ['fr-CA', 'fr-CA'],
      ['es', 'es'],
    ]);
  });

  it('falls back to / when the pathname is not available', () => {
    vi.mocked(usePathname).mockReturnValue(null as unknown as string);
    render(<LanguageSwitcher locales={['en', 'fr']} currentLocale="en" />);
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/', '/fr']);
  });
});
