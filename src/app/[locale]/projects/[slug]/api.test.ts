/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getProjectBySlug, GET_PROJECT_BY_SLUG_QUERY, type ProjectNode } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const node: ProjectNode = {
  id: 'cG9zdDo0OTg=',
  slug: 'x',
  title: 'X',
  featuredImage: null,
  projectsProjectData: null,
};

describe('getProjectBySlug', () => {
  beforeEach(() => {
    vi.mocked(fetchWPGraphQL).mockReset();
  });

  it('queries the single project by SLUG and returns the node', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ project: node });

    // Distinct slugs per test: React `cache` may memoize by argument.
    await expect(getProjectBySlug('x')).resolves.toEqual(node);

    expect(fetchWPGraphQL).toHaveBeenCalledTimes(1);
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toBe(GET_PROJECT_BY_SLUG_QUERY);
    expect(query).toContain('project(id: $slug, idType: SLUG)');
    expect(query).not.toContain('projects(first');
    expect(variables).toEqual({ slug: 'x' });
  });

  it('returns null when WordPress has no project for the slug', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ project: null });
    await expect(getProjectBySlug('no-existe')).resolves.toBeNull();
  });

  it('returns null when the response has no data', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce(undefined);
    await expect(getProjectBySlug('empty-response')).resolves.toBeNull();
  });
});
