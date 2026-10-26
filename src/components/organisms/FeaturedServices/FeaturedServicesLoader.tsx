import React from 'react';
import { getHomeFeaturedServices } from './api';
import FeaturedServices from './index';
import type { FeaturedServiceItem } from './types';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';

// Async server component loader that pre-fetches featured services data
// This ensures FeaturedServices renders on the server with data
export default async function FeaturedServicesLoader({ locale }: { locale: Locale }) {
  const fallbackTitle = getDictionary(locale).cmsFallback.featuredServicesTitle;
  let sectionTitle: string = fallbackTitle;
  let services: FeaturedServiceItem[] = [];
  
  try {
    const data = await getHomeFeaturedServices(locale);
    sectionTitle = (data.sectionTitle ?? fallbackTitle) as string;
    services = (data.service ?? []) as FeaturedServiceItem[];
  } catch (e) {
    console.error('FeaturedServicesLoader error:', e);
  }
  
  return <FeaturedServices sectionTitle={sectionTitle} services={services} locale={locale} />;
}
