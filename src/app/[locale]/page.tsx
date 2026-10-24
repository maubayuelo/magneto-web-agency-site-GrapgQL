// Home page

// Home page (server component)
// This component fetches CMS data (projects and testimonials) and renders the main
// sections of the homepage. In Next.js app router, async server components can
// fetch data directly. Client-only behavior should be placed in components with
// "use client" at the top.
import { HeroLoader } from '@/components/organisms/Hero';
// `GET_PROJECTS` is a GraphQL query string defined in `src/data/projects` that asks the CMS for project posts.
import { GET_PROJECTS } from '@/data/projects';
import { fetchWPGraphQL } from '@/utils/wp-graphql'; // Centralized GraphQL fetch helper
import { getHomeTestimonials } from '@/components/organisms/Testimonials/api';
import { ProjectsGrid } from '@/components/organisms';
import AboutSection from '@/components/organisms/AboutSection';
import FeaturedServicesLoader from '@/components/organisms/FeaturedServices/FeaturedServicesLoader';

export default async function Home() {
  // Default values for the data we'll render
  let projects = [];
  let fetchError = false;
  let testimonialData = [];

  try {
    // Fetch projects using the GraphQL helper. `GET_PROJECTS` is a string query.
    const data = await fetchWPGraphQL(typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || '');

    // The CMS response format depends on your GraphQL schema. Here we expect
    // `data.projects.nodes` to be an array of project nodes.
    const projectsRaw = data?.projects?.nodes || [];

    // Normalize the CMS project objects into the shape the React components expect.
    projects = projectsRaw.map((project: any) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      featuredImage: project.featuredImage,
      // Example of mapping nested ACF fields if present
      solutions: (project.projectsProjectData?.projectData?.solutions || []).map((s: any) => s.item),
      results: (project.projectsProjectData?.projectData?.results || []).map((r: any) => r.item),
    }));

    // Fetch testimonials from a helper; this might call the CMS or return static data.
    testimonialData = await getHomeTestimonials();
  } catch (e) {
    // If any fetch fails, set a flag and continue rendering fallbacks.
    console.error('Error fetching projects:', e);
    fetchError = true;
  }

  // Map testimonials into the shape required by the `Testimonials` component.
  const testimonials = testimonialData.map((t: any, idx: number) => ({
    id: idx + 1,
    quote: t.testimonial,
    author: t.author,
    avatar: t.thumb?.node?.sourceUrl || 'https://placehold.co/54x54',
    role: '', // Optional: add role if available in the CMS
  }));

  return (
    <>
      {/* HeroLoader: server component that renders the hero for the page */}
      <HeroLoader pageUri="/" variant="home" />
      {/* AboutSection, FeaturedServices and other page sections: usually composed from smaller components */}
      <AboutSection />
      <FeaturedServicesLoader />
      {/* <Testimonials testimonials={testimonials} /> */}
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
  // This function can run server-side to provide page-specific metadata.
  // For the homepage we return a short title and description. If you need
  // dynamic metadata based on CMS content, you can fetch it here similarly
  // to the approach used in `layout.tsx`.
  return {
    title: 'Magneto Marketing - Home',
    description: 'Magneto Marketing — strategy, web development and UX services for solo founders and small teams.',
  };
}