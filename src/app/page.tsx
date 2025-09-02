// Home page

import HeroLoader from '@/components/organisms/Hero/HeroLoader';
// Update the import path if the file is located elsewhere, for example:
import { GET_PROJECTS } from '@/data/projects';
// Or adjust the path to match the actual location of your projects query file.
import { fetchWPGraphQL } from '@/lib/wp-graphql'; // Your custom fetcher
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
      <ProjectsGrid
          projects={projects} 
          maxProjects={3}  
          title="Recent Projects"
          showButton={true}
        />
      <Testimonials testimonials={testimonials} />
    </>
  );
}

/*
ProjectsGrid
*/