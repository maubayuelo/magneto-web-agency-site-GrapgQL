// Home page

import HeroLoader from '@/components/organisms/Hero/HeroLoader';
// Update the import path if the file is located elsewhere, for example:
import { GET_PROJECTS } from '@/data/projects';
// Or adjust the path to match the actual location of your projects query file.
import { fetchWPGraphQL } from '@/lib/wp-graphql'; // Your custom fetcher
import { FeaturedServices, ProjectsGrid, Testimonials } from '../components/organisms';
import AboutSection from '../components/organisms/AboutSection';




const testimonialData = [
  {
    id: 1,
    quote: "Working with Magneto was a game-changer for my online coaching program. Their innovative funnel design doubled my lead generation in just a few weeks!",
    author: "Elena M.",
    role: "Wellness Coach",
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 2,
    quote: "Magneto completely transformed my coaching business. The new funnel brought in 3x more leads in just one month!",
    author: "Marcus T.",
    role: "biz. Coach", 
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 3,
    quote: "Magneto expertly crafted funnel not only streamlined my processes but also tripled my lead generation in just a month!",
    author: "Sarah K.",
    role: "Life Coach",
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 4,
    quote: "Partnering with Magneto was a transformative experience for my coaching business. Their expertly designed funnel increased my lead generation by 300% in just 30 days!",
    author: "David R.",
    role: "Exec. Coach",
    avatar: "https://placehold.co/54x54"
  }
];

export default async function Home() {
  let projects = [];
  let fetchError = false;
  try {
    const data = await fetchWPGraphQL(typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || '');
    // In your Home component, after fetching:
    console.log("Raw data from CMS:", data);
    const projectsRaw = data?.projects?.nodes || [];
    projects = projectsRaw.map((project: any) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      featuredImage: project.featuredImage,
    }));
    console.log("Projects loaded for ProjectsGrid:", projects);
  } catch (e) {
    console.error("Error fetching projects:", e);
    fetchError = true;
  }
  
  

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="/" variant="home" />
      <AboutSection />
      <FeaturedServices />
      <ProjectsGrid
          projects={projects} 
          maxProjects={3} 
          showButton={true} 
          title=""
        />
      <Testimonials testimonials={testimonialData} />
    </>
  );
}

/*
ProjectsGrid
*/