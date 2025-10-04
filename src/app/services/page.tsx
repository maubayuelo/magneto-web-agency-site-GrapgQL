import { HeroLoader } from '@/components/organisms/Hero';
import ServicesList from './ServicesList';
import './Services.scss';
import { getServicesPageData } from './api';

// Service data structure
interface Service {
  pageintrotext: string;
}

// REMOVE top-level await usage and move fetching into the component
export default async function ServicesPage() {
  let introText = '';
  try {
    const servicesPageData = await getServicesPageData();
    introText = servicesPageData?.pageintrotext?.pageIntroText || '';
  } catch (err) {
    // Don't crash the page if the CMS/API is unreachable; render fallbacks.
    console.error('Failed to load services page data:', err);
    introText = '';
  }

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="services" variant="services" />
      {introText ? (
        <div className="main typo-center pb-md-responsive">
          <h3
            className="typo-3xl-bold m-0"
            dangerouslySetInnerHTML={{ __html: introText.replace(/\r?\n/g, '<br />') }}
          />
        </div>
      ) : null}
      <div className="main pb-md-responsive">
        <ServicesList />
      </div>
    </>
  );
}

// If you have a CMS API helper for services, call it here. Otherwise this
// generateMetadata will fetch a presumed endpoint at /api/pages/services.
export async function generateMetadata() {
  try {
    const res = await fetch(`${process.env.WP_API || ''}/pages/services`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed to fetch');
    const json = await res.json();
    const title = json.title ?? 'Services - Magneto Marketing';
    const desc = json.meta_description ?? 'Strategy, Web Development, UX/UI and growth services offered by Magneto Marketing.';
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  } catch (err) {
    const title = 'Services - Magneto Marketing';
    const desc = 'Strategy, Web Development, UX/UI and growth services offered by Magneto Marketing.';
    return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
  }
}