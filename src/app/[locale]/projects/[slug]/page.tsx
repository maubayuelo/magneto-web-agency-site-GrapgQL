import { Metadata } from 'next';
import { ProjectDetail } from '@/components/organisms';
import { notFound } from 'next/navigation';
import type { ProjectData } from '@/data/projects';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getProjects } from '../api';
import { getProjectBySlug } from './api';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const project = await getProjectBySlug(slug, isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);

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
  const { locale: rawLocale, slug } = await params;
  const project = await getProjectBySlug(slug, isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);

  if (!project) {
    notFound();
  }

  // Map GraphQL project node to ProjectData shape
  const acf = project.projectsProjectData?.projectData;
  const images = project.projectsProjectData?.images || [];

  const mappedProject: ProjectData = {
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
    // `?? ''` renders the same as the null it replaces (an empty list item).
    challenges: (acf?.challenges || []).map((c) => c.item ?? ''),
    solutions: (acf?.solutions || []).map((s) => s.item ?? ''),
    results: (acf?.results || []).map((r) => r.item ?? ''),
    // Add more fields as needed
  };

  return <ProjectDetail project={mappedProject} />;
}

// Only the slugs that exist in this locale (ADR 0004): a locale without translations prerenders none, and an
// on-demand request for a missing one gets notFound() above.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const projects = await getProjects(locale);
  return projects.map((project) => ({
    slug: project.slug,
  }));
}
