/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getProjectBySlug, GET_PROJECT_BY_SLUG_QUERY, type ProjectNode } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const UP = 'http://magneto-cms-2.local/wp-content/uploads';

// Trimmed from projects(where:{language:"es", name:"trepied-trepied-ca"}) after H2 (#541 es, image copy #542 es).
const esNode = {
  id: 'cG9zdDo1NDE=',
  slug: 'trepied-trepied-ca',
  title: '[ES TEST] TRÉPIED — trepied.ca',
  featuredImage: {
    node: {
      sourceUrl: `${UP}/trepied-es-copy.png`,
      altText: 'TRÉPIED ES',
      mediaDetails: { sizes: [] },
      databaseId: 542,
      languageCode: 'es',
      translations: [{ languageCode: 'en', sourceUrl: `${UP}/trepied.png`, altText: 'TRÉPIED', mediaDetails: { sizes: [{ sourceUrl: `${UP}/trepied-800.png`, width: '800', height: '400', name: 'm' }] } }],
    },
  },
  projectsProjectData: {
    projectData: { projectSubtitle: 'Sub', projectDescription: '<p>D</p>', projectUrl: 'https://trepied.ca', challenges: [{ item: 'c' }], solutions: [{ item: 's' }], results: [{ item: 'r' }] },
    images: [
      {
        image: { node: { sourceUrl: `${UP}/g1-es.png`, altText: '', mediaDetails: null, databaseId: 1, languageCode: 'es', translations: [{ languageCode: 'en', sourceUrl: `${UP}/g1.png`, altText: '', mediaDetails: null }] } },
        footNote: 'Home',
        ismobilescreenshot: false,
      },
    ],
  },
};

describe('getProjectBySlug', () => {
  beforeEach(() => {
    vi.mocked(fetchWPGraphQL).mockReset();
  });

  it('queries projects(where:{language, name}) with the locale variables (fr)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await getProjectBySlug('vars-fr', 'fr');

    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toBe(GET_PROJECT_BY_SLUG_QUERY);
    expect(query).toContain('projects(first: 1, where: { language: $language, name: $slug })');
    expect(query).not.toContain('idType: SLUG');
    expect(query).toContain('translations @include(if: $mediaOriginal)');
    expect(variables).toEqual({ slug: 'vars-fr', language: 'fr', mediaOriginal: true });
  });

  it('en: no EN-original media lookup', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await getProjectBySlug('vars-en', 'en');
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ slug: 'vars-en', language: 'en', mediaOriginal: false });
  });

  it('returns null on nodes: [] (missing translation), on projects: null and on no data', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [] } });
    await expect(getProjectBySlug('trepied-trepied-ca', 'fr')).resolves.toBeNull();
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: null });
    await expect(getProjectBySlug('null-projects', 'fr')).resolves.toBeNull();
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce(undefined);
    await expect(getProjectBySlug('empty-response', 'en')).resolves.toBeNull();
  });

  it('maps the node: images from the EN original, locale altText, helper fields stripped', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ projects: { nodes: [esNode] } });
    const project = (await getProjectBySlug('trepied-trepied-ca', 'es')) as ProjectNode;

    expect(project.title).toBe('[ES TEST] TRÉPIED — trepied.ca');
    expect(project.featuredImage).toEqual({
      node: { sourceUrl: `${UP}/trepied.png`, altText: 'TRÉPIED ES', mediaDetails: esNode.featuredImage.node.translations[0].mediaDetails },
    });
    expect(project.projectsProjectData?.images?.[0]).toEqual({
      image: { node: { sourceUrl: `${UP}/g1.png`, altText: '', mediaDetails: null } },
      footNote: 'Home',
      ismobilescreenshot: false,
    });
    expect(project.projectsProjectData?.projectData).toEqual(esNode.projectsProjectData.projectData);
  });

  it('the same slug in two locales is two separate requests', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue({ projects: { nodes: [] } });
    await getProjectBySlug('x', 'fr');
    await getProjectBySlug('x', 'en');
    expect(fetchWPGraphQL).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchWPGraphQL).mock.calls.map((c) => c[1]?.language)).toEqual(['fr', 'en']);
  });
});
