/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import ContactPage from './page';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';
import { es } from '@/i18n/dictionaries/es';

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));
// Vitest uses the classic JSX runtime (Known debt): CalendlyButton has no React import.
(globalThis as { React?: typeof React }).React = React;
const openModal = vi.fn();
vi.mock('@/components/organisms/EmailCollectorProvider', () => ({ useOptionalEmailModal: () => ({ openModal }) }));
// HeroLoader is an async server component: replaced by a stub that exposes its props.
vi.mock('@/components/organisms/Hero', () => ({
  HeroLoader: (props: { requireInternalCta?: boolean; pageUri: string; children?: React.ReactNode }) => (
    <section data-testid="hero" data-page={props.pageUri} data-require-internal-cta={String(!!props.requireInternalCta)}>{props.children}</section>
  ),
}));

// The local CMS still holds the old framing and the 48-hour promise (E10): the page must not render them.
const cmsPage = {
  contactContactTexts: {
    mainCopy: 'Request Free Quote',
    tagText: "Let's Build Something Powerful Together",
    bodytext: "Fill out the form below, and I'll get back to you within 48 hours.",
  },
  featuredImage: { node: { sourceUrl: 'https://x/contact.png', altText: 'Contact', mediaDetails: { sizes: [] } } },
};

const DICTS = { en, fr, es } as const;

describe('Contact page (5d-lite §4)', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset().mockResolvedValue({ pages: { nodes: [cmsPage] } }));

  it.each(['en', 'fr', 'es'] as const)('%s: supporting lines from the dictionary; no contactContactTexts, no "48 hours"', async (locale) => {
    const t = DICTS[locale];
    const { container } = render(await ContactPage({ params: Promise.resolve({ locale }) }));
    for (const line of Object.values(t.contactPage.supporting)) expect(screen.getByText(line)).toBeInTheDocument();
    const text = container.textContent ?? '';
    expect(text).not.toContain('Request Free Quote');
    expect(text).not.toContain('Something Powerful');
    expect(text).not.toMatch(/48\s*(h|hours|heures|horas)/i);
  });

  it.each(['en', 'fr', 'es'] as const)('%s: hero gets requireInternalCta and the "Prefer to talk?" + main-label booking button (AC-9)', async (locale) => {
    const t = DICTS[locale];
    render(await ContactPage({ params: Promise.resolve({ locale }) }));
    const hero = screen.getByTestId('hero');
    expect(hero).toHaveAttribute('data-page', 'contact');
    expect(hero).toHaveAttribute('data-require-internal-cta', 'true');
    const secondary = hero.querySelector('p.hero-secondary')!;
    expect(secondary.textContent).toBe(`${t.contactPage.preferToTalk} ${t.common.bookStrategyCall}`);
    const button = screen.getByRole('button', { name: t.common.bookStrategyCall });
    button.click();
    // No customUrl: the single code-default event (D-8 revised).
    expect(openModal).toHaveBeenLastCalledWith({ utmContent: 'contact_hero', utmTerm: 'strategy_call', customUrl: undefined, forceNewWindow: undefined });
  });

  it('missing translation → notFound()', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue({ pages: { nodes: [] } });
    await expect(ContactPage({ params: Promise.resolve({ locale: 'fr' }) })).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });
});
