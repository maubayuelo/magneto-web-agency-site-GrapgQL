import { Metadata } from 'next';
import { ProjectDetail } from '../../../components/organisms';
import { notFound } from 'next/navigation';
import { GET_PROJECTS } from '@/data/projects';
import { fetchWPGraphQL } from '@/lib/wp-graphql'; // Your custom fetcher

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
  const project = projects.find(p => p.slug === slug);
  
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
  const project = projects.find(p => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetail project={project} />
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
