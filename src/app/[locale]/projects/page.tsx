import { HeroLoader } from '@/components/organisms/Hero';
import { notFound } from 'next/navigation';
import { ProjectsGrid } from '@/components/organisms';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getProjects, getProjectsPageData } from './api';

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const mappedProjects = await getProjects(locale);
  const introTextData = await getProjectsPageData(locale);
  if (!introTextData) notFound();
  const introText = introTextData.introText || "";

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
  <HeroLoader pageUri="projects" variant="project" locale={locale} />
  {mappedProjects.length > 0 && introText ? (
        <div className="main typo-center pb-md-responsive">
          <h3
            className="typo-3xl-bold m-0"
            dangerouslySetInnerHTML={{ __html: introText.replace(/\r?\n/g, '<br />') }}
          />
        </div>
      ) : null}

        <ProjectsGrid
          projects={mappedProjects} 
          maxProjects={6} 
          showButton={false} 
          title=""
        />
      
    </>
  );
}

export async function generateMetadata() {
  const title = 'Projects - Magneto Marketing';
  const desc = 'A curated selection of recent projects and case studies by Magneto Marketing.';
  return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
}