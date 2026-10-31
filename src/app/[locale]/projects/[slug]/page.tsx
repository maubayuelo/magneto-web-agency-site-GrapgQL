import { Metadata } from 'next';
import { ProjectDetail } from '@/components/organisms';
import { notFound } from 'next/navigation';
import type { ProjectData } from '@/data/projects';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { getProjects } from '../api';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { getProjectBySlug } from './api';
import { caseStudyMeta, pageMetadata } from '@/utils/page-metadata';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  const project = await getProjectBySlug(slug, locale);

  if (!project) {
    return {
      title: t.projectNotFound.metaTitle,
    };
  }

  // The locale's project is resolved first (missing translation → 404 above); then the case copy by slug (5b §6).
  return pageMetadata(caseStudyMeta(t, slug, project.title));
}

export default async function ProjectPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const project = await getProjectBySlug(slug, locale);

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

  return (
    <>
      <ProjectDetail project={mappedProject} locale={locale} />
      <FinalCTASectionLoader source={{ kind: 'project', slug: project.slug }} locale={locale} />
    </>
  );
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
