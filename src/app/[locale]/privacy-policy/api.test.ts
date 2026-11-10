/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getPrivacyPage, mapPrivacyPage } from './api';

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));

const BODY = '<p>Effective date: 3 December 2026</p>\n<h2 class="wp-block-heading">1. Who we are</h2>\n<p><a href="mailto:contact@magnetomarketing.co">contact@magnetomarketing.co</a></p>';

describe('getPrivacyPage', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it.each([
    ['en', { language: 'en', mediaOriginal: false }],
    ['fr', { language: 'fr', mediaOriginal: true }],
    ['es', { language: 'es', mediaOriginal: true }],
  ] as const)('%s: queries the page by language + name with the locale variables', async (locale, expected) => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await getPrivacyPage(locale);
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "privacy-policy" })');
    expect(query).toMatch(/nodes\s*{\s*title\s+content\s*}/);
    expect(query).not.toMatch(/idType: URI|pageBy|page\(id/);
    // A declared-but-unused variable fails the whole query in WPGraphQL (seen in the local build).
    expect(query).toContain('query GetPrivacyPage($language: String) {');
    expect(query).not.toContain('$mediaOriginal');
    expect(variables).toEqual(expected);
  });

  it('maps title + content', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ title: 'Politique de confidentialité', content: BODY }] } });
    await expect(getPrivacyPage('fr')).resolves.toEqual({ title: 'Politique de confidentialité', html: BODY });
  });

  it('null when the slug has no page in that language (AC-8: unpublished ES → 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getPrivacyPage('es')).resolves.toBeNull();
  });
});

describe('mapPrivacyPage', () => {
  it.each([
    ['no data', null],
    ['no pages', {}],
    ['null nodes', { pages: { nodes: null } }],
    ['null node', { pages: { nodes: [null] } }],
    ['null content', { pages: { nodes: [{ title: 'Privacy Policy', content: null }] } }],
    ['empty content', { pages: { nodes: [{ title: 'Privacy Policy', content: '' }] } }],
    ['whitespace content', { pages: { nodes: [{ title: 'Privacy Policy', content: '\n  \n' }] } }],
  ])('null on %s', (_label, data) => {
    expect(mapPrivacyPage(data)).toBeNull();
  });

  it('trims the title; a missing title becomes an empty string', () => {
    expect(mapPrivacyPage({ pages: { nodes: [{ title: ' Privacy Policy ', content: BODY }] } })).toEqual({ title: 'Privacy Policy', html: BODY });
    expect(mapPrivacyPage({ pages: { nodes: [{ title: null, content: BODY }] } })).toEqual({ title: '', html: BODY });
  });
});
