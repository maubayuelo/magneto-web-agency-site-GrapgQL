import { HeroLoader } from '@/components/organisms/Hero';
import { notFound } from 'next/navigation';
import { ProjectsGrid } from '@/components/organisms';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { getProjects, getProjectsPageData } from './api';

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const mappedProjects = await getProjects(locale);
  // The page only decides 404 (missing translation); its intro text is no longer rendered: the hero carries the
  // heading + intro (Phase 5a, item 8).
  if (!(await getProjectsPageData(locale))) notFound();

  return (
    <>
      <HeroLoader pageUri="projects" variant="project" locale={locale} />
      <ProjectsGrid projects={mappedProjects} maxProjects={6} title="" />
      <FinalCTASectionLoader source={{ kind: 'page', name: 'projects' }} locale={locale} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const t = getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);
  const title = t.meta.projects.title;
  const desc = t.meta.projects.description;
  return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
}