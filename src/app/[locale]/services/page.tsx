import React from 'react';
import { HeroLoader } from '@/components/organisms/Hero';
import ServicesList, { ServiceBody } from './ServicesList';
import './Services.scss';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { getServicesPageData } from './api';
import type { ServicesPageData } from './types';

type ServicesPageProps = { params: Promise<{ locale: string }> };

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  let data: ServicesPageData | null = null;
  let failed = false;
  try {
    data = await getServicesPageData(locale);
  } catch (error) {
    console.error('Failed to load services page data:', error);
    failed = true;
  }
  if (!failed && !data) notFound();
  if (data?.issues.length) console.warn('Incomplete Services content:', data.issues);
  const t = getDictionary(locale);
  return <>
    <HeroLoader pageUri="services" variant="services" locale={locale} />
    {failed ? <div className="main pb-md-responsive" role="status">
      <h2 className="typo-2xl-bold">{t.services.errorTitle}</h2>
      <p>{t.services.errorBody}</p>
    </div> : data ? <>
      {(data.introTitle || data.introBody) ? <div className="main services-intro typo-center pb-md-responsive">
        {data.introTitle ? <h2 className="typo-3xl-bold m-0 services-intro__title">{data.introTitle}</h2> : null}
        <ServiceBody body={data.introBody} />
      </div> : null}
      <div className="main pb-md-responsive"><ServicesList data={data} locale={locale} /></div>
    </> : null}
    <FinalCTASectionLoader source={{ kind: 'page', name: 'services' }} locale={locale} />
  </>;
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