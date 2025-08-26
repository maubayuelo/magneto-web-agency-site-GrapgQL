import HeroLoader from '@/components/organisms/Hero/HeroLoader';

import { GET_PROJECTS } from '@/data/projects';
import { fetchWPGraphQL } from '@/lib/wp-graphql'; // Your custom fetcher
import { ProjectsGrid } from '../../components/organisms';

export default async function PortfolioPage() {
  const data = await fetchWPGraphQL(
    typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || ''
  );
  const projects = data?.projects?.nodes || [];
  

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="projects" variant="projects" />

        <ProjectsGrid
          projects={projects} 
          maxProjects={6} 
          showButton={false} 
          title=""
        />
      
    </>
  );
}