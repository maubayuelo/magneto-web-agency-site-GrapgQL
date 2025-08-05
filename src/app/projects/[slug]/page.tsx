import { Metadata } from 'next';
import { ProjectDetail } from '../../../components/organisms';
import { notFound } from 'next/navigation';
import { projectsData } from '../../../data/projects';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projectsData.find(p => p.slug === slug);
  
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
  const { slug } = await params;
  const project = projectsData.find(p => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetail project={project} />
  );
}

export async function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}
