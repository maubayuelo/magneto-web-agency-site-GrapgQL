import React from 'react';
import { getHomeFooter } from './api';
import { Footer } from './index';

// Async server component loader that pre-fetches footer data
// This ensures Footer renders on the server with data, avoiding client-side fetch delays
export default async function FooterLoader() {
  let footerData = null;
  try {
    footerData = await getHomeFooter();
  } catch (e) {
    console.error('FooterLoader error:', e);
  }
  return <Footer footerData={footerData} />;
}
