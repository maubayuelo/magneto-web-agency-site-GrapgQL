/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import PrivacyPolicyPage, { generateMetadata } from './page';
import { getDictionary } from '@/i18n/dictionary';

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));
// Vitest uses the classic JSX runtime (Known debt).
(globalThis as { React?: typeof React }).React = React;

const TITLES = { en: 'Privacy Policy', fr: 'Politique de confidentialité', es: 'Política de privacidad' } as const;
const BODY =
  '<p>Effective date: 3 December 2026</p>' +
  '<h2 class="wp-block-heading">1. Who we are</h2>' +
  '<ul class="wp-block-list"><li>Item</li></ul>' +
  '<p><a href="mailto:contact@magnetomarketing.co">contact@magnetomarketing.co</a></p>';

const renderPage = async (locale: string) => render(await PrivacyPolicyPage({ params: Promise.resolve({ locale }) }));

describe('Privacy policy page', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it.each(['en', 'fr', 'es'] as const)('%s: the WP title is the only H1, then the body', async (locale) => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue({ pages: { nodes: [{ title: TITLES[locale], content: BODY }] } });
    const { container } = await renderPage(locale);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(TITLES[locale]);
    expect(screen.getByRole('heading', { level: 2, name: '1. Who we are' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Item');
    expect(screen.getByRole('link', { name: 'contact@magnetomarketing.co' })).toHaveAttribute('href', 'mailto:contact@magnetomarketing.co');
    expect(container.querySelector('article.privacy-policy')).not.toHaveAttribute('lang');
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toMatchObject({ language: locale });
  });

  it.each(['en', 'fr', 'es'] as const)('%s: metadata = meta.privacy (no CMS call)', async (locale) => {
    const { title, description } = getDictionary(locale).meta.privacy;
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    expect(meta.title).toBe(title);
    expect(meta.description).toBe(description);
    expect(meta.openGraph).toMatchObject({ title, description });
    expect(fetchWPGraphQL).not.toHaveBeenCalled();
  });

  it('sanitizes the body: <script> and inline handlers are stripped', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue({
      pages: { nodes: [{ title: 'Privacy Policy', content: `${BODY}<script>window.__pwned = 1</script><img src="x" onerror="alert(1)">` }] },
    });
    const { container } = await renderPage('en');
    const body = container.querySelector('.privacy-policy__body')!;
    expect(body.querySelector('script')).toBeNull();
    expect(body.innerHTML).not.toContain('__pwned');
    expect(body.innerHTML).not.toContain('onerror');
    expect(body.querySelector('a[href="mailto:contact@magnetomarketing.co"]')).not.toBeNull();
  });

  it.each([
    ['no page in that language', { pages: { nodes: [] } }],
    ['empty content', { pages: { nodes: [{ title: 'Política de privacidad', content: '' }] } }],
  ])('%s → notFound() (AC-8)', async (_label, response) => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue(response);
    await expect(PrivacyPolicyPage({ params: Promise.resolve({ locale: 'es' }) })).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });
});
