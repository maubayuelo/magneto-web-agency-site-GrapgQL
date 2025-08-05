import { Hero, ProjectsGrid } from '../../components/organisms';

export default function PortfolioPage() {
  return (
    <>
      <Hero 
        variant="portfolio"
        title="Our Portfolio"
        subtitle="Explore our latest projects and see how we've helped businesses transform their digital presence."
        showImage={false}
        cta={{
          text: "View All Projects"
        }}
      />
      
        <ProjectsGrid 
          maxProjects={6} 
          showButton={false} 
          title=""
        />
      
    </>
  );
}