// Home page

import HeroLoader from '@/components/organisms/Hero/HeroLoader';
// Update the import path if the file is located elsewhere, for example:
import { GET_PROJECTS } from '@/data/projects';
// Or adjust the path to match the actual location of your projects query file.
import { fetchWPGraphQL } from '@/utils/wp-graphql'; // Your custom fetcher
import { getHomeTestimonials } from '../components/organisms/Testimonials/api';
import { FeaturedServices, ProjectsGrid, Testimonials } from '../components/organisms';
import AboutSection from '../components/organisms/AboutSection';

export default async function Home() {
  let projects = [];
  let fetchError = false;
  let testimonialData = [];
  try {
    const data = await fetchWPGraphQL(typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || '');
    // In your Home component, after fetching:
    //console.log("Raw data from CMS:", data);
    const projectsRaw = data?.projects?.nodes || [];
    projects = projectsRaw.map((project: any) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      featuredImage: project.featuredImage,
      // Extract solutions from ACF/projectData if available
      solutions: (project.projectsProjectData?.projectData?.solutions || []).map((s: any) => s.item),
      // Extract results (outcomes) from ACF/projectData if available
      results: (project.projectsProjectData?.projectData?.results || []).map((r: any) => r.item),
    }));
    //console.log("Projects loaded for ProjectsGrid:", projects);
    // Fetch testimonials from CMS
    testimonialData = await getHomeTestimonials();
    //console.log("Testimonials loaded:", testimonialData);
  } catch (e) {
    console.error("Error fetching projects:", e);
    fetchError = true;
  }

  // Map CMS data to TestimonialCard shape
  const testimonials = testimonialData.map((t: any, idx: number) => ({
    id: idx + 1,
    quote: t.testimonial,
    author: t.author,
    avatar: t.thumb?.node?.sourceUrl || "https://placehold.co/54x54",
    role: "", // Add role if available in CMS
  }));
  
  

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="/" variant="home" />
      <AboutSection />
      <FeaturedServices />
      <Testimonials testimonials={testimonials} />
      <ProjectsGrid
          projects={projects} 
          maxProjects={3}  
          title="Recent Projects"
          showButton={true}
        />
      
    </>
  );
}

export async function generateMetadata() {
  // Try to fetch a site-wide short description via GraphQL if available, otherwise fallback
  try {
    // Reuse fetchWPGraphQL/GET_PROJECTS logic if you have a site metadata query; keep a simple fallback for now
    return {
      title: 'Magneto Marketing - Home',
      description: 'Magneto Marketing — strategy, web development and UX services for solo founders and small teams.',
    };
  } catch (e) {
    return {
      title: 'Magneto Marketing - Home',
      description: 'Magneto Marketing — strategy, web development and UX services for solo founders and small teams.',
    };
  }
}

/*
ProjectsGrid
*/