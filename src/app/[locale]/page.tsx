// Home page

// Home page (server component)
// This component fetches CMS data (projects and testimonials) and renders the main
// sections of the homepage. In Next.js app router, async server components can
// fetch data directly. Client-only behavior should be placed in components with
// "use client" at the top.
import { notFound } from 'next/navigation';
import { HeroLoader } from '@/components/organisms/Hero';
import { getHomeTestimonials, type Testimonial } from '@/components/organisms/Testimonials/api';
import { ProjectsGrid } from '@/components/organisms';
import type { ProjectItem } from '@/components/organisms/ProjectsGrid/types';
import AboutSection from '@/components/organisms/AboutSection';
import FeaturedServicesLoader from '@/components/organisms/FeaturedServices/FeaturedServicesLoader';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getPageExists } from '@/utils/wp-page';
import { getProjects } from './projects/api';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Missing translation → 404 (ADR 0004, D2). A CMS error is not a 404: render the fallbacks as before.
  let homeExists = true;
  try {
    homeExists = await getPageExists('home', locale);
  } catch (e) {
    console.error('Error checking the home page:', e);
  }
  if (!homeExists) notFound();

  // Default values for the data we'll render
  let projects: ProjectItem[] = [];
  let fetchError = false;
  let testimonialData: Testimonial[] = [];

  try {
    // Projects in the request locale, already mapped to the ProjectsGrid shape.
    projects = await getProjects(locale);

    // Fetch testimonials from a helper; this might call the CMS or return static data.
    testimonialData = await getHomeTestimonials(locale);
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
      <HeroLoader pageUri="/" variant="home" locale={locale} />
      {/* AboutSection, FeaturedServices and other page sections: usually composed from smaller components */}
      <AboutSection locale={locale} />
      <FeaturedServicesLoader locale={locale} />
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