import React from 'react';
import { getHomeFooter } from './api';
import { Footer } from './index';
import type { Locale } from '@/i18n/config';

// Async server component loader that pre-fetches footer data
// This ensures Footer renders on the server with data, avoiding client-side fetch delays
export default async function FooterLoader({ locale }: { locale: Locale }) {
  let footerData = null;
  try {
    footerData = await getHomeFooter(locale);
  } catch (e) {
    console.error('FooterLoader error:', e);
  }
  return <Footer footerData={footerData} locale={locale} />;
}
