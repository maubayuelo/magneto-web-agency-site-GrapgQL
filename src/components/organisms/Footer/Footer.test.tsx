/// <reference types="vitest" />
// 5b §5.5 (D-L): LinkedIn only when the CMS URL is set, never a mailto: link, no empty list.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getDictionary } from '@/i18n/dictionary';
import { Footer } from './index';

// Classic JSX runtime in Vitest (Known debt).
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const LINKEDIN = 'https://www.linkedin.com/in/example';

describe('Footer', () => {
  it.each(['en', 'fr', 'es'] as const)('%s: LinkedIn link when the CMS URL is set, no mailto', (locale) => {
    const { container } = render(
      <Footer locale={locale} footerData={{ footerLine2: 'Based in Montreal', footerSocialIcons: [{ iconUrl: ` ${LINKEDIN} ` }] }} />,
    );
    const link = screen.getByRole('link', { name: getDictionary(locale).footer.linkedin });
    expect(link).toHaveAttribute('href', LINKEDIN);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelectorAll('.footer__links li')).toHaveLength(1);
  });

  it.each([[null], [[]], [[{ iconUrl: '  ' }]]])('no LinkedIn URL (%j) → no list at all', (icons) => {
    const { container } = render(<Footer locale="en" footerData={{ footerLine2: 'Line', footerSocialIcons: icons }} />);
    expect(container.querySelector('ul')).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getByText(/Magneto Web Consulting ©/)).toBeInTheDocument();
  });

  it('renders without CMS data', () => {
    const { container } = render(<Footer locale="fr" />);
    expect(container.querySelector('footer')).not.toBeNull();
    expect(container.querySelector('ul')).toBeNull();
  });
});
