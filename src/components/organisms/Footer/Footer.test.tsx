// 5b §5.5 (D-L): LinkedIn only when the CMS URL is set, never a mailto: link.
// Privacy route (spec §3): the list is always rendered: LinkedIn (if set) · Privacy Policy.
// Phase 5f §6: "Privacy choices" follows Privacy Policy only when NEXT_PUBLIC_GA_ID is a valid GA4 ID (Version B: absent).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDictionary } from '@/i18n/dictionary';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ConsentProvider } from '@/components/organisms/ConsentBanner';
import { Footer } from './index';

// Classic JSX runtime in Vitest (Known debt).
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const LINKEDIN = 'https://www.linkedin.com/in/example';
const PRIVACY_HREF = { en: '/privacy-policy', fr: '/fr/privacy-policy', es: '/es/privacy-policy' } as const;
const PRIVACY_CHOICES = /Privacy choices|Choix de confidentialit|Opciones de privacidad/i;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_ID', ''); // not configured unless a test says otherwise
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('Footer', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: LinkedIn then Privacy Policy, no mailto, no Privacy choices', (locale) => {
    const t = getDictionary(locale);
    const { container } = render(
      <Footer locale={locale} footerData={{ footerLine2: 'Based in Montreal', footerSocialIcons: [{ iconUrl: ` ${LINKEDIN} ` }] }} />,
    );
    const link = screen.getByRole('link', { name: t.footer.linkedin });
    expect(link).toHaveAttribute('href', LINKEDIN);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const privacy = screen.getByRole('link', { name: t.common.privacyPolicy });
    expect(privacy).toHaveAttribute('href', PRIVACY_HREF[locale]);
    expect(privacy).not.toHaveAttribute('target');
    const items = container.querySelectorAll('.footer__links li');
    expect(items).toHaveLength(2);
    expect(items[0]).toContainElement(link);
    expect(items[1]).toContainElement(privacy);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(PRIVACY_CHOICES);
  });

  it.each([[null], [[]], [[{ iconUrl: '  ' }]]])('no LinkedIn URL (%j) → Privacy link only', (icons) => {
    const { container } = render(<Footer locale="en" footerData={{ footerLine2: 'Line', footerSocialIcons: icons }} />);
    const items = container.querySelectorAll('.footer__links li');
    expect(items).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getByText(/Magneto Web Consulting ©/)).toBeInTheDocument();
  });

  it.each(['en', 'fr', 'es'] as const)('%s: renders without CMS data, with the Privacy link', (locale) => {
    const { container } = render(<Footer locale={locale} />);
    expect(container.querySelector('footer')).not.toBeNull();
    expect(container.querySelectorAll('.footer__links li')).toHaveLength(1);
    expect(screen.getByRole('link', { name: getDictionary(locale).common.privacyPolicy })).toHaveAttribute('href', PRIVACY_HREF[locale]);
  });

  it.each(['your_ga_id_here', 'GTM-ABC123', '   '])('invalid GA ID %j → no Privacy choices control', (id) => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', id);
    const { container } = render(<Footer locale="en" />);
    expect(container.textContent).not.toMatch(PRIVACY_CHOICES);
    expect(container.querySelector('.footer__link--button')).toBeNull();
  });

  describe('Phase 5f: analytics configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-LOCALTEST00');
    });

    it.each(['en', 'fr', 'es'] as const)('%s: LinkedIn · Privacy Policy · Privacy choices (a button, label = consent heading)', (locale) => {
      const t = getDictionary(locale);
      const { container } = render(
        <I18nProvider locale={locale} dictionary={t}>
          <Footer locale={locale} footerData={{ footerLine2: 'Line', footerSocialIcons: [{ iconUrl: LINKEDIN }] }} />
        </I18nProvider>,
      );
      const items = container.querySelectorAll('.footer__links li');
      expect(items).toHaveLength(3);
      const control = screen.getByRole('button', { name: t.consent.privacyChoices });
      expect(items[1]).toContainElement(screen.getByRole('link', { name: t.common.privacyPolicy }));
      expect(items[2]).toContainElement(control);
      expect(control).toHaveAttribute('type', 'button');
      expect(control).toHaveClass('footer__link', 'footer__link--button');
      expect(control).toHaveAttribute('aria-expanded', 'false');
    });

    it('reopens the banner from the footer and reports aria-expanded', async () => {
      localStorage.setItem('magneto-consent', JSON.stringify({ v: 1, analytics: 'denied', at: new Date().toISOString() }));
      const t = getDictionary('fr');
      render(
        <I18nProvider locale="fr" dictionary={t}>
          <ConsentProvider>
            <Footer locale="fr" />
          </ConsentProvider>
        </I18nProvider>,
      );
      await screen.findByRole('button', { name: t.consent.privacyChoices });
      expect(screen.queryByRole('region', { name: t.consent.privacyChoices })).toBeNull();
      const control = screen.getByRole('button', { name: t.consent.privacyChoices });
      fireEvent.click(control);
      expect(await screen.findByRole('region', { name: t.consent.privacyChoices })).toBeInTheDocument();
      expect(control).toHaveAttribute('aria-expanded', 'true');
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: t.consent.privacyChoices }));
    });
  });
});
