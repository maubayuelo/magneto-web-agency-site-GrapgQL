/// <reference types="vitest" />
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import HeroLoader from './HeroLoader';

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));
// Vitest uses the classic JSX runtime (Known debt); HeroLoader.tsx has no React import.
(globalThis as { React?: typeof React }).React = React;
vi.mock('@/components/organisms/EmailCollectorProvider', () => ({ useEmailModal: () => ({ openModal: vi.fn() }), useOptionalEmailModal: () => undefined }));

// Trimmed from the local EN contact page (databaseId 41): CMS Calendly CTA, no ctaPath.
const contactHero = {
  title: 'Contact',
  heroContent: {
    heroTitle: 'Tell me about your website project.',
    subtitleHero: 'Share a few details.',
    ctaTextHero: 'Book a Free Strategy Call',
    ctaLinkHero: 'https://calendly.com/mauriciobayuelo/free-discovery-call',
    ctaPath: null,
    image: null,
    backgroundImage: null,
  },
};

describe('HeroLoader children (5d-lite §4)', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset().mockResolvedValue({ pages: { nodes: [contactHero] } }));

  it('renders children under the subtitle', async () => {
    const html = renderToStaticMarkup(
      await HeroLoader({ pageUri: 'contact', variant: 'contact', locale: 'en', children: <p className="hero-secondary">child</p> }),
    );
    expect(html).toContain('<p class="hero-secondary">child</p>');
    expect(html.indexOf('hero-subtitle')).toBeLessThan(html.indexOf('hero-secondary'));
  });

  it('without requireInternalCta the CMS Calendly CTA renders (other heroes unchanged)', async () => {
    const html = renderToStaticMarkup(await HeroLoader({ pageUri: 'contact', variant: 'contact', locale: 'en' }));
    expect(html).toContain('hero-cta-wrapper');
  });

  it('with requireInternalCta (as Contact passes) the CMS Calendly CTA is suppressed, children stay', async () => {
    const html = renderToStaticMarkup(
      await HeroLoader({ pageUri: 'contact', variant: 'contact', locale: 'en', requireInternalCta: true, children: <span>child</span> }),
    );
    expect(html).not.toContain('hero-cta-wrapper');
    expect(html).toContain('<span>child</span>');
  });
});
