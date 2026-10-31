import React from 'react';
import { getHomeFeaturedServices } from './api';
import FeaturedServices from './index';
import type { FeaturedServiceItem } from './types';
import type { Locale } from '@/i18n/config';

// Async server component loader that pre-fetches featured services data
// This ensures FeaturedServices renders on the server with data
export default async function FeaturedServicesLoader({ locale }: { locale: Locale }) {
  let services: FeaturedServiceItem[] = [];

  try {
    const data = await getHomeFeaturedServices(locale);
    services = (data.service ?? []) as FeaturedServiceItem[];
  } catch (e) {
    console.error('FeaturedServicesLoader error:', e);
  }

  return <FeaturedServices services={services} locale={locale} />;
}
