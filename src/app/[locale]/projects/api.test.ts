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
            projectsProjectData: { projectData: { solutions: [{ item: 'Sol' }], results: [{ item: 'Res' }] } },
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
        solutions: ['Sol'],
        results: ['Res'],
      },
    ]);
  });

  it('[] on nodes: [] and on projects: null (nothing throws)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await expect(getProjects('fr')).resolves.toEqual([]);
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: null });
    await expect(getProjects('fr')).resolves.toEqual([]);
    expect(vi.mocked(fetchWPGraphQL).mock.calls[1][1]).toEqual({ language: 'fr', mediaOriginal: true });
  });
});
