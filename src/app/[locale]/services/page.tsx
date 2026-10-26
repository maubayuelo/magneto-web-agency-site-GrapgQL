import { HeroLoader } from '@/components/organisms/Hero';
import ServicesList from './ServicesList';
import './Services.scss';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { getServicesPageData } from './api';

// Service data structure
interface Service {
  pageintrotext: string;
}

type ServicesPageProps = { params: Promise<{ locale: string }> };

// REMOVE top-level await usage and move fetching into the component
export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  let introText = '';
  let servicesArray: any[] = [];
  let pageMissing = false;
  try {
    const servicesPageData = await getServicesPageData(locale);
    pageMissing = servicesPageData === null;
    introText = servicesPageData?.pageintrotext?.pageIntroText || '';
    // Extract services list to pass to the server-rendered ServicesList component
    servicesArray = servicesPageData?.servicesServiceDetails?.services || [];
  } catch (err) {
    // Don't crash the page if the CMS/API is unreachable; render fallbacks.
    console.error('Failed to load services page data:', err);
    introText = '';
    servicesArray = [];
  }
  // Missing translation → 404 (ADR 0004, D2); outside the try below so its catch can't swallow it.
  if (pageMissing) notFound();

  try {
    return (
      <>
        {/* HeroLoader fetches and renders the Hero section for this page */}
        <HeroLoader pageUri="services" variant="services" locale={locale} />
        {introText ? (
          <div className="main typo-center pb-md-responsive">
            <h3
              className="typo-3xl-bold m-0"
              dangerouslySetInnerHTML={{ __html: introText.replace(/\r?\n/g, '<br />') }}
            />
          </div>
        ) : null}
        <div className="main pb-md-responsive">
          <ServicesList services={servicesArray} locale={locale} />
        </div>
      </>
    );
  } catch (err) {
    // Catch any unexpected rendering error and log it so Vercel shows the stacktrace.
    // Return a minimal fallback UI instead of letting Next return a 500 without logs.
    // This helps surface the real error in the Vercel deployment logs for debugging.
    // eslint-disable-next-line no-console
    console.error('ServicesPage render error:', err);
    const t = getDictionary(locale);
    return (
      <div className="main pb-md-responsive">
        <h2 className="typo-2xl-bold">{t.services.errorTitle}</h2>
        <p>{t.services.errorBody}</p>
      </div>
    );
  }
}

// If you have a CMS API helper for services, call it here. Otherwise this
// generateMetadata will fetch a presumed endpoint at /api/pages/services.
export async function generateMetadata({ params }: ServicesPageProps) {
  const { locale: rawLocale } = await params;
  const t = getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);
  try {
    // Avoid attempting a relative fetch when WP_API is not configured in production
    const wpApiBase = process.env.WP_API;
    if (!wpApiBase) {
      throw new Error('WP_API not configured');
    }

    const res = await fetch(`${wpApiBase.replace(/\/+$/, '')}/pages/services`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed to fetch');
    const json = await res.json();
    const title = json.title ?? t.meta.services.title;
    const desc = json.meta_description ?? t.meta.services.description;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  } catch (err) {
    const title = t.meta.services.title;
    const desc = t.meta.services.description;
    return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
  }
}