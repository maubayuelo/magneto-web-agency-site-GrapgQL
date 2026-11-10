/// <reference types="vitest" />
// 5b §5.5 (D-L): LinkedIn only when the CMS URL is set, never a mailto: link.
// Privacy route (spec §3): the list is always rendered and ends with the Privacy Policy link; no "Privacy choices" (5f).
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getDictionary } from '@/i18n/dictionary';
import { Footer } from './index';

// Classic JSX runtime in Vitest (Known debt).
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const LINKEDIN = 'https://www.linkedin.com/in/example';
const PRIVACY_HREF = { en: '/privacy-policy', fr: '/fr/privacy-policy', es: '/es/privacy-policy' } as const;
const PRIVACY_CHOICES = /Privacy choices|Choix de confidentialit|Opciones de privacidad/i;

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
});
