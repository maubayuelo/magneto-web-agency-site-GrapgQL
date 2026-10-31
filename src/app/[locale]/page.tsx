// Home page

// Home page (server component)
// This component fetches CMS data (projects and testimonials) and renders the main
// sections of the homepage. In Next.js app router, async server components can
// fetch data directly. Client-only behavior should be placed in components with
// "use client" at the top.
import { notFound } from 'next/navigation';
import { HeroLoader } from '@/components/organisms/Hero';
import { getHomeTestimonials, type Testimonial } from '@/components/organisms/Testimonials/api';
import { Testimonials } from '@/components/organisms/Testimonials';
import type { Testimonial as TestimonialItem } from '@/components/organisms/Testimonials/types';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { ProjectsGrid } from '@/components/organisms';
import type { ProjectItem } from '@/components/organisms/ProjectsGrid/types';
import AboutSection from '@/components/organisms/AboutSection';
import FeaturedServicesLoader from '@/components/organisms/FeaturedServices/FeaturedServicesLoader';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
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

  // Only rows with a role reach here (getHomeTestimonials), so the placeholder rows never render.
  const testimonials: TestimonialItem[] = testimonialData.map((row, idx) => ({
    id: idx + 1,
    quote: row.testimonial,
    author: row.author,
    role: row.role,
    company: row.company,
    city: row.city,
    note: row.note,
  }));
  const t = getDictionary(locale);

  // Section order follows the 2026 copy: hero · Meet Magneto · BUILD/FIX/CARE · projects · testimonials · final CTA.
  return (
    <>
      <HeroLoader pageUri="/" variant="home" locale={locale} />
      <AboutSection locale={locale} />
      <FeaturedServicesLoader locale={locale} />
      <ProjectsGrid
          projects={projects}
          maxProjects={3}
          title={t.home.recentProjects}
          intro={t.home.projectsIntro}
        />
      <Testimonials title={t.testimonials.title} testimonials={testimonials} />
      <FinalCTASectionLoader source={{ kind: 'page', name: 'home' }} locale={locale} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const t = getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);
  // This function can run server-side to provide page-specific metadata.
  // For the homepage we return a short title and description. If you need
  // dynamic metadata based on CMS content, you can fetch it here similarly
  // to the approach used in `layout.tsx`.
  return {
    title: t.meta.home.title,
    description: t.meta.home.description,
  };
}