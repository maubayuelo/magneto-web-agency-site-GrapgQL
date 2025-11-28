import React from 'react';
import { getHomePrefooter } from './api';
import { FinalCTASection } from './index';
import type { FinalCTASectionProps, FinalCTAData } from './types';

// Async server component loader (similar pattern to HeroLoader) that
// pre-fetches data so the client component can render immediately
// without a client-side fetch + layout shift.
export default async function FinalCTASectionLoader(props: Omit<FinalCTASectionProps, 'debugData'>) {
  let data: FinalCTAData | null = null;
  try {
    data = await getHomePrefooter();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('FinalCTASectionLoader error:', e);
  }
  return <FinalCTASection {...props} debugData={data} />;
}
