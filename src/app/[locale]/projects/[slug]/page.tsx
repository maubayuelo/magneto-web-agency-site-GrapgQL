import { Metadata } from 'next';
import { ProjectDetail } from '@/components/organisms';
import { notFound } from 'next/navigation';
import { GET_PROJECTS } from '@/data/projects';
import type { ProjectData } from '@/data/projects';
import { fetchWPGraphQL } from '@/utils/wp-graphql'; // Your custom fetcher
import { getProjectBySlug } from './api';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.title} | Magneto Projects`,
    // Not queried (always undefined, as before). Project meta descriptions are Phase 7 (SEO).
    description: undefined,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Map GraphQL project node to ProjectData shape
  const acf = project.projectsProjectData?.projectData;
  const images = project.projectsProjectData?.images || [];

  const mappedProject = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    tagText: acf?.projectSubtitle || "",
    description: acf?.projectDescription || "",
    projectUrl: acf?.projectUrl || "",
    image: project.featuredImage?.node?.sourceUrl || "",
    gallery: images.map((img) => ({
      image: img.image?.node?.sourceUrl ?? null,
      footNote: img.footNote ?? "",
      isMobileScreenshot: !!img.ismobilescreenshot,
    })),
    challenges: (acf?.challenges || []).map((c) => c.item),
    solutions: (acf?.solutions || []).map((s) => s.item),
    results: (acf?.results || []).map((r) => r.item),
    // Add more fields as needed
  };

  return (
    // ProjectData (src/data/projects.ts) does not match the real shape (id is a string, gallery
    // items are objects); the old `any`s hid this. Cast until that type is fixed (out of scope).
    <ProjectDetail project={mappedProject as unknown as ProjectData} />
  );
}

export async function generateStaticParams() {

  const data = await fetchWPGraphQL(
    typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || ''
  );
  const projects = data?.projects?.nodes || [];

  if (!Array.isArray(projects)) {
    throw new Error("Unexpected response structure");
  }

  return projects.map((project) => ({
    slug: project.slug,
  }));
}
