import { cache } from 'react';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper, type WpMediaNode } from '@/utils/wp-media';

const PROJECT_MEDIA_FIELDS = `sourceUrl altText mediaDetails { sizes { sourceUrl width height name } }`;

// Single project by slug in one language (ADR 0004, D1: P-B). `project(id, SLUG)` takes no language
// argument, so the connection's `where: { language, name }` is used; a missing translation gives [].
// The node selection is identical to GET_PROJECTS (src/data/projects.ts) because page.tsx maps these fields.
export const GET_PROJECT_BY_SLUG_QUERY = `
  query GetProjectBySlug($slug: String, $language: String, $mediaOriginal: Boolean!) {
    projects(first: 1, where: { language: $language, name: $slug }) {
      nodes {
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
          ${mediaOriginalFields(PROJECT_MEDIA_FIELDS)}
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
              ${mediaOriginalFields(PROJECT_MEDIA_FIELDS)}
            }
          }
          footNote
          ismobilescreenshot
        }
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
  projects: { nodes: ProjectNode[] | null } | null;
}

const resolveImage = (wrapper: { node: MediaNode | null } | null) =>
  resolveMediaWrapper(wrapper as { node: (MediaNode & WpMediaNode) | null } | null) as { node: MediaNode | null } | null;

/**
 * Loads one project by slug in `locale` (images from the EN original), or null if that language has none.
 * Wrapped in React `cache` (keyed by slug and locale) so generateMetadata and the page share one request.
 */
export const getProjectBySlug = cache(async (slug: string, locale: Locale): Promise<ProjectNode | null> => {
  const data: GetProjectBySlugResponse | undefined = await fetchWPGraphQL(GET_PROJECT_BY_SLUG_QUERY, {
    slug,
    ...wpLocaleVars(locale),
  });
  const project = data?.projects?.nodes?.[0];
  if (!project) return null;
  const acf = project.projectsProjectData;
  return {
    ...project,
    featuredImage: resolveImage(project.featuredImage),
    projectsProjectData: acf
      ? { ...acf, images: acf.images ? acf.images.map((img) => ({ ...img, image: resolveImage(img.image) })) : acf.images }
      : acf,
  };
});
