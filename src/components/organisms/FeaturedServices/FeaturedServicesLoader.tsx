import React from 'react';
import { getHomeFeaturedServices } from './api';
import FeaturedServices from './index';

// Async server component loader that pre-fetches featured services data
// This ensures FeaturedServices renders on the server with data
export default async function FeaturedServicesLoader() {
  let sectionTitle = 'Featured Services';
  let services = [];
  
  try {
    const data = await getHomeFeaturedServices();
    sectionTitle = data.sectionTitle || 'Featured Services';
    services = data.service || [];
  } catch (e) {
    console.error('FeaturedServicesLoader error:', e);
  }
  
  return <FeaturedServices sectionTitle={sectionTitle} services={services} />;
}
