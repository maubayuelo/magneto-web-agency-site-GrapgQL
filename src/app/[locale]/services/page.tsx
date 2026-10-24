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
  try {
    let introText = '';
    let servicesArray: any[] = [];
    try {
      const servicesPageData = await getServicesPageData();
      introText = servicesPageData?.pageintrotext?.pageIntroText || '';
      // Extract services list to pass to the server-rendered ServicesList component
      servicesArray = servicesPageData?.servicesServiceDetails?.services || [];
    } catch (err) {
      // Don't crash the page if the CMS/API is unreachable; render fallbacks.
      console.error('Failed to load services page data:', err);
      introText = '';
      servicesArray = [];
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
          <ServicesList services={servicesArray} />
        </div>
      </>
    );
  } catch (err) {
    // Catch any unexpected rendering error and log it so Vercel shows the stacktrace.
    // Return a minimal fallback UI instead of letting Next return a 500 without logs.
    // This helps surface the real error in the Vercel deployment logs for debugging.
    // eslint-disable-next-line no-console
    console.error('ServicesPage render error:', err);
    return (
      <div className="main pb-md-responsive">
        <h2 className="typo-2xl-bold">Services</h2>
        <p>Sorry, we couldn't load the services right now. Please try again later.</p>
      </div>
    );
  }
}

// If you have a CMS API helper for services, call it here. Otherwise this
// generateMetadata will fetch a presumed endpoint at /api/pages/services.
export async function generateMetadata() {
  try {
    // Avoid attempting a relative fetch when WP_API is not configured in production
    const wpApiBase = process.env.WP_API;
    if (!wpApiBase) {
      throw new Error('WP_API not configured');
    }

    const res = await fetch(`${wpApiBase.replace(/\/+$/, '')}/pages/services`, { cache: 'no-store' });
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