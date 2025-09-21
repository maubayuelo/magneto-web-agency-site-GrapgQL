"use client";

import React, { useEffect, useState } from 'react';
import { getHomeHero } from './api';
import { Hero } from './index';
import type { HomeHero, CTA } from './types';

export default function HeroWithData() {
  const [data, setData] = useState<HomeHero | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
  const hero = await getHomeHero();
  if (mounted) setData(hero as HomeHero);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (!data) return null;

  const image = (data.heroImage && data.heroImage.sourceUrl && data.heroImage.altText) ? {
    src: data.heroImage.sourceUrl,
    alt: data.heroImage.altText,
    // Hero component accepts width/height optionally; derive from sizes if available
    width: data.heroImage.mediaDetails?.sizes?.[0]?.width || undefined,
    height: data.heroImage.mediaDetails?.sizes?.[0]?.height || undefined,
  } : undefined;

  const ctaProp = data.cta ? {
    text: data.cta.text || '',
    href: data.cta.href || undefined,
    type: data.cta.type || undefined,
    utmContent: data.cta.utmContent || undefined,
    utmTerm: data.cta.utmTerm || undefined,
  } : null;

  return (
    <Hero
      title={data.title || ''}
      subtitle={data.subtitle || ''}
      image={image}
      cta={ctaProp}
      backgroundImage={data.backgroundImage?.sourceUrl || undefined}
      variant="home"
    />
  );
}
