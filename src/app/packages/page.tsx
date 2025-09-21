import React from 'react';
import { HeroLoader } from '@/components/organisms/Hero';
import { PackagesGrid } from '@/components/organisms';
import { getPackagesPageData } from './api';

export default async function PackagesPage() {
  const { introText, packages } = await getPackagesPageData();

  return (
    <>
      <HeroLoader pageUri="packages" variant="packages" />
      {introText ? (
        <div className="main typo-center">
          <h3
            className="typo-3xl-bold m-0"
            dangerouslySetInnerHTML={{ __html: introText.replace(/\r?\n/g, '<br />') }}
          />
        </div>
      ) : null}
      <div className="main">
        <PackagesGrid packages={packages} />
      </div>
    </>
  );
}

export async function generateMetadata() {
  try {
  await getPackagesPageData();
  const title = 'Packages - Magneto Marketing';
  const desc = 'Browse service packages and pricing for Magneto Marketing.';
  return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
  } catch (e) {
  const title = 'Packages - Magneto Marketing';
  const desc = 'Browse service packages and pricing for Magneto Marketing.';
  return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
  }
}