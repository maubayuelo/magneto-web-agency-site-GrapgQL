import { cache } from 'react';
import { fetchWPGraphQL } from '@/utils/wp-graphql';

// Single project by slug. The node selection is identical to GET_PROJECTS (src/data/projects.ts)
// because page.tsx maps these exact fields. WPML note: `project` takes no language argument.
export const GET_PROJECT_BY_SLUG_QUERY = `
  query GetProjectBySlug($slug: ID!) {
    project(id: $slug, idType: SLUG) {
      id
      slug
      title
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            sizes {
              sourceUrl
              width
              height
              name
            }
          }
        }
      }
      projectsProjectData {
        projectData {
          projectSubtitle
          projectDescription
          projectUrl
          challenges {
            item
          }
          solutions {
            item
          }
          results {
            item
          }
        }
        images {
          image {
            node {
              sourceUrl
              altText
              mediaDetails {
                sizes {
                  sourceUrl
                  width
                  height
                  name
                }
              }
            }
          }
          footNote
          ismobilescreenshot
        }
      }
    }
  }
`;

export interface MediaSize {
  sourceUrl: string | null;
  width: string | null;
  height: string | null;
  name: string | null;
}

export interface MediaNode {
  sourceUrl: string | null;
  altText: string | null;
  mediaDetails: { sizes: MediaSize[] | null } | null;
}

export interface ProjectListItem {
  item: string | null;
}

export interface ProjectAcfData {
  projectSubtitle: string | null;
  projectDescription: string | null;
  projectUrl: string | null;
  challenges: ProjectListItem[] | null;
  solutions: ProjectListItem[] | null;
  results: ProjectListItem[] | null;
}

export interface ProjectImage {
  image: { node: MediaNode | null } | null;
  footNote: string | null;
  ismobilescreenshot: boolean | null;
}

export interface ProjectNode {
  id: string;
  slug: string;
  title: string;
  featuredImage: { node: MediaNode | null } | null;
  projectsProjectData: {
    projectData: ProjectAcfData | null;
    images: ProjectImage[] | null;
  } | null;
}

export interface GetProjectBySlugResponse {
  project: ProjectNode | null;
}

/**
 * Loads one project by slug, or null if WordPress has none. Wrapped in React `cache` so
 * generateMetadata and the page share one request per render.
 */
export const getProjectBySlug = cache(async (slug: string): Promise<ProjectNode | null> => {
  const data: GetProjectBySlugResponse | undefined = await fetchWPGraphQL(GET_PROJECT_BY_SLUG_QUERY, { slug });
  return data?.project ?? null;
});
