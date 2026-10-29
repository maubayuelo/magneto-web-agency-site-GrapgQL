import React from 'react';
import { getFinalCta } from './api';
import { FinalCTASection } from './index';
import type { FinalCTASectionProps, FinalCTAData, FinalCtaSource } from './types';

// Async server component: reads the final CTA of one page or project (home values when its title is empty)
// and hands it to the client component, so there is no client fetch or layout shift.
// Rendered at the end of each route page (not in the layout): home, about-magneto, services, packages, projects,
// projects/[slug]. Not on contact or the 404s.
export default async function FinalCTASectionLoader({
  source,
  ...props
}: Omit<FinalCTASectionProps, 'debugData'> & { source: FinalCtaSource }) {
  let data: FinalCTAData | null = null;
  try {
    data = await getFinalCta(source, props.locale);
  } catch (e) {
    // A CMS error renders the dictionary fallback copy (as before).
    // eslint-disable-next-line no-console
    console.error('FinalCTASectionLoader error:', e);
  }
  return <FinalCTASection {...props} debugData={data} />;
}
