/// <reference types="vitest" />
// 5b §5.4 / E7 #3: an empty CMS ctaText falls back to the locale's common.bookStrategyCall (never header.scheduleCall).
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getDictionary } from '@/i18n/dictionary';
import type { Locale } from '@/i18n/config';
import { FinalCTASection } from './index';

// Classic JSX runtime in Vitest (Known debt): JSX in this file and in index.tsx needs a global React.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('@/components/organisms/EmailCollectorProvider', () => ({ useEmailModal: () => ({ openModal: vi.fn() }) }));
vi.mock('@/components/atoms/WpResponsiveImage', () => ({ default: () => null }));

const LABELS: Record<Locale, string> = {
  en: 'Book a Free Strategy Call', // magneto-copy-en.md:27 (01ff73f)
  fr: 'Réserver un appel-conseil gratuit', // magneto-copy-fr-CA.md:27
  es: 'Agendar una llamada de orientación gratuita', // magneto-copy-es.md:29
};

describe('FinalCTASection fallback label', () => {
  it.each(['en', 'fr', 'es'] as const)('empty ctaText → %s common.bookStrategyCall', (locale) => {
    const t = getDictionary(locale);
    render(
      <I18nProvider locale={locale} dictionary={t}>
        <FinalCTASection locale={locale} debugData={{ title: 'T', subtitle: 'S', ctaText: '   ', ctaPath: null }} />
      </I18nProvider>,
    );
    expect(t.common.bookStrategyCall).toBe(LABELS[locale]);
    expect(screen.getByRole('button', { name: LABELS[locale] })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.header.scheduleCall })).toBeNull();
  });

  it('keeps a CMS label when set', () => {
    render(<FinalCTASection locale="en" debugData={{ title: 'T', subtitle: 'S', ctaText: 'Start a project', ctaPath: '/contact' }} />);
    expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact');
  });
});
