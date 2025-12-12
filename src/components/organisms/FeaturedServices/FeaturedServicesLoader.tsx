import React from 'react';
import { getHomeFeaturedServices } from './api';
import FeaturedServices from './index';
import type { FeaturedServiceItem } from './types';

// Async server component loader that pre-fetches featured services data
// This ensures FeaturedServices renders on the server with data
export default async function FeaturedServicesLoader() {
  let sectionTitle: string = 'Featured Services';
  let services: FeaturedServiceItem[] = [];
  
  try {
    const data = await getHomeFeaturedServices();
    sectionTitle = (data.sectionTitle ?? 'Featured Services') as string;
    services = (data.service ?? []) as FeaturedServiceItem[];
  } catch (e) {
    console.error('FeaturedServicesLoader error:', e);
  }
  
  return <FeaturedServices sectionTitle={sectionTitle} services={services} />;
}
