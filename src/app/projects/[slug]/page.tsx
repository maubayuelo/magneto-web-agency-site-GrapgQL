import { Metadata } from 'next';
import { ProjectDetail } from '@/components/organisms';
import { notFound } from 'next/navigation';
import { GET_PROJECTS } from '@/data/projects';
import { fetchWPGraphQL } from '@/utils/wp-graphql'; // Your custom fetcher

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

  const data = await fetchWPGraphQL(
    typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || ''
  );
  const projects = data?.projects?.nodes || [];


  const { slug } = await params;
  const project = (projects as any[]).find((p: any) => p.slug === slug);
  
  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.title} | Magneto Projects`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const data = await fetchWPGraphQL(
    typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || ''
  );
  const projects = data?.projects?.nodes || [];
  const { slug } = await params;
  const project = (projects as any[]).find((p: any) => p.slug === slug);

  if (!project) {
    notFound();
  }

  // Map GraphQL project node to ProjectData shape
  const acf = project.projectsProjectData?.projectData || {};
  const images = project.projectsProjectData?.images || [];

  const mappedProject = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    tagText: acf.projectSubtitle || "",
    description: acf.projectDescription || "",
    image: project.featuredImage?.node?.sourceUrl || "",
    gallery: images.map((img: any) => ({
      image: img.image?.node?.sourceUrl ?? null,
      footNote: img.footNote ?? "",
    })),
    challenges: (acf.challenges || []).map((c: any) => c.item),
    solutions: (acf.solutions || []).map((s: any) => s.item),
    results: (acf.results || []).map((r: any) => r.item),
    // Add more fields as needed
  };

  return (
    <ProjectDetail project={mappedProject} />
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
