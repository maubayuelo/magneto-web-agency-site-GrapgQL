import { HeroLoader } from '@/components/organisms/Hero';

import { GET_PROJECTS } from '@/data/projects';
import { fetchWPGraphQL } from '@/utils/wp-graphql'; // Your custom fetcher
import { ProjectsGrid } from '@/components/organisms';
import { getProjectsPageData } from './api';

export default async function PortfolioPage() {
  const projectsData = await fetchWPGraphQL(
    typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || ''
  );
  const introTextData = await getProjectsPageData();
  const introText = introTextData?.introText || "";
  
  const projects = projectsData?.projects?.nodes || [];
  // Normalize projects into the shape ProjectsGrid expects (id, slug, title, featuredImage, solutions, results)
  const mappedProjects = projects.map((project: any) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    featuredImage: project.featuredImage,
    solutions: (project.projectsProjectData?.projectData?.solutions || []).map((s: any) => s.item),
    results: (project.projectsProjectData?.projectData?.results || []).map((r: any) => r.item),
  }));
  
  

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
  <HeroLoader pageUri="projects" variant="project" />
  {introText ? (
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