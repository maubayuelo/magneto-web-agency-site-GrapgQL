/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getProjects, getProjectsPageData } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const UP = 'http://magneto-cms-2.local/wp-content/uploads';

describe('getProjectsPageData', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('reads the projects page by language + name and sends the locale variables', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [{ pageintrotext: { pageIntroText: 'Intro' } }] } });
    await expect(getProjectsPageData('fr')).resolves.toEqual({ introText: 'Intro' });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "projects" })');
    expect(variables).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('en variables; null on nodes: [] (→ 404)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getProjectsPageData('en')).resolves.toBeNull();
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false });
  });
});

describe('getProjects', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('filters GET_PROJECTS by language and maps to the ProjectsGrid shape (image from the EN original)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      projects: {
        nodes: [
          {
            id: 'cG9zdDo1NDE=',
            slug: 'trepied-trepied-ca',
            title: '[ES TEST] TRÉPIED — trepied.ca',
            featuredImage: {
              node: {
                sourceUrl: `${UP}/es-copy.png`, altText: 'ES alt', mediaDetails: { sizes: [] }, databaseId: 542, languageCode: 'es',
                translations: [{ languageCode: 'en', sourceUrl: `${UP}/trepied.png`, altText: 'EN alt', mediaDetails: { sizes: [{ sourceUrl: `${UP}/t-800.png`, width: '800', height: '400', name: 'm' }] } }],
              },
            },
            projectsProjectData: { cardDescription: null, displayOrder: null, projectData: { projectSubtitle: 'Sub', solutions: [{ item: 'Sol' }], results: [{ item: 'Res' }] } },
          },
        ],
      },
    });
    const projects = await getProjects('es');
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('projects(first: 12, where: { language: $language })');
    expect(variables).toEqual({ language: 'es', mediaOriginal: true });
    expect(projects).toEqual([
      {
        id: 'cG9zdDo1NDE=',
        slug: 'trepied-trepied-ca',
        title: '[ES TEST] TRÉPIED — trepied.ca',
        featuredImage: { node: { sourceUrl: `${UP}/trepied.png`, altText: 'ES alt', mediaDetails: { sizes: [{ sourceUrl: `${UP}/t-800.png`, width: '800', height: '400', name: 'm' }] } } },
        description: 'Sub',
        solutions: ['Sol'],
        results: ['Res'],
      },
    ]);
  });

  const node = (slug: string, displayOrder: number | null, cardDescription: string | null = null, projectSubtitle: string | null = null) => ({
    id: slug, slug, title: slug, featuredImage: null,
    projectsProjectData: { cardDescription, displayOrder, projectData: { projectSubtitle, solutions: [], results: [] } },
  });

  it('queries cardDescription and displayOrder', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await getProjects('en');
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][0]).toMatch(/projectsProjectData \{\s+cardDescription\s+displayOrder/);
  });

  it('state N: sorts by displayOrder ascending (10/20/40), null last', async () => {
    // GraphQL order as recorded locally: Trépied, Shamanicca, Dangel; plus an unordered project first.
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      projects: { nodes: [node('kinelibelula', null), node('trepied-trepied-ca', 40), node('shamaniccas-ecommerce', 20), node('fashion-company-ecommerce', 10)] },
    });
    const slugs = (await getProjects('en')).map((p) => p.slug);
    expect(slugs).toEqual(['fashion-company-ecommerce', 'shamaniccas-ecommerce', 'trepied-trepied-ca', 'kinelibelula']);
  });

  it('state C: no displayOrder anywhere → the GraphQL order; ties keep the GraphQL order', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      projects: { nodes: [node('trepied-trepied-ca', null), node('shamaniccas-ecommerce', null), node('fashion-company-ecommerce', null)] },
    });
    expect((await getProjects('en')).map((p) => p.slug)).toEqual(['trepied-trepied-ca', 'shamaniccas-ecommerce', 'fashion-company-ecommerce']);
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [node('b', 10), node('a', 10), node('c', 0)] } });
    expect((await getProjects('en')).map((p) => p.slug)).toEqual(['c', 'b', 'a']);
  });

  it('description: cardDescription (state N) → projectSubtitle (state C) → ""', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      projects: { nodes: [node('n', 10, 'Card text', 'Subtitle'), node('c', 20, '  ', 'Subtitle'), node('e', 30, null, null)] },
    });
    expect((await getProjects('en')).map((p) => p.description)).toEqual(['Card text', 'Subtitle', '']);
  });

  it('[] on nodes: [] and on projects: null (nothing throws)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await expect(getProjects('fr')).resolves.toEqual([]);
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: null });
    await expect(getProjects('fr')).resolves.toEqual([]);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[1][1]).toEqual({ language: 'fr', mediaOriginal: true });
  });
});
