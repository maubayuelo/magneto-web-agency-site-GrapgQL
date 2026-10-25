import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { GET_PROJECTS } from '@/data/projects';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { resolveMediaWrapper, type WpMediaNode } from '@/utils/wp-media';
import type { ProjectItem } from '@/components/organisms/ProjectsGrid/types';

const GET_PROJECTS_PAGE_QUERY = `
  query GetProjectsPageData($language: String) {
    pages(first: 1, where: { language: $language, name: "projects" }) {
      nodes {
    pageintrotext {
      pageIntroText
    }
      }
    }
  }
`;

interface ProjectsPageResponse {
  pages: { nodes: { pageintrotext: { pageIntroText: string | null } | null }[] | null } | null;
}

/** The `projects` page in `locale`, or null when it has no translation (→ 404). */
export async function getProjectsPageData(locale: Locale): Promise<{ introText: string } | null> {
  const data: ProjectsPageResponse | undefined = await fetchWPGraphQL(GET_PROJECTS_PAGE_QUERY, wpLocaleVars(locale));
  const page = data?.pages?.nodes?.[0];
  if (!page) return null;
  return {
    introText: page.pageintrotext?.pageIntroText || "",
  };
}

interface ProjectListNode {
  id: string;
  slug: string;
  title: string;
  featuredImage: { node: WpMediaNode | null } | null;
  projectsProjectData: {
    projectData: {
      solutions: { item: string | null }[] | null;
      results: { item: string | null }[] | null;
    } | null;
  } | null;
}

interface ProjectsResponse {
  projects: { nodes: ProjectListNode[] | null } | null;
}

const GET_PROJECTS_QUERY = typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || '';

/** Projects in `locale` (first 12, Known debt), mapped to the ProjectsGrid shape. [] when there are none. */
export async function getProjects(locale: Locale): Promise<ProjectItem[]> {
  const data: ProjectsResponse | undefined = await fetchWPGraphQL(GET_PROJECTS_QUERY, wpLocaleVars(locale));
  const nodes = data?.projects?.nodes ?? [];
  return nodes.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    featuredImage: resolveMediaWrapper(project.featuredImage) as ProjectItem['featuredImage'],
    solutions: (project.projectsProjectData?.projectData?.solutions || []).map((s) => s.item) as string[],
    results: (project.projectsProjectData?.projectData?.results || []).map((r) => r.item) as string[],
  }));
}
