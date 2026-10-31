// Per-page metadata (5b §6): title + description from the locale's dictionary (approved SEO copy, 01ff73f),
// mirrored to Open Graph and Twitter. A page's `openGraph` / `twitter` replace the layout's objects entirely
// (Next merges metadata per top-level key), so the shared site defaults are repeated here.
// Canonical, hreflang and og:locale are Phase 7.
import type { Metadata } from 'next';
import { format, type Dictionary } from '@/i18n/dictionary';
import { defaultOgImage, siteName } from '@/utils/seo';

export interface PageMeta {
  title: string;
  description: string;
}

export function pageMetadata({ title, description }: PageMeta): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, siteName, images: [defaultOgImage], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [defaultOgImage] },
  };
}

/** Case-study slugs → `meta.caseStudies` key. Slugs are the same in every language (Dangel keeps its old slug, Q9). */
export const CASE_STUDY_KEYS = {
  'fashion-company-ecommerce': 'dangel',
  'trepied-trepied-ca': 'trepied',
  'shamaniccas-ecommerce': 'shamanicca',
} as const satisfies Record<string, keyof Dictionary['meta']['caseStudies']>;

/** Metadata of an existing project in the request locale: its case-study copy, or the generic title. */
export function caseStudyMeta(t: Dictionary, slug: string, projectTitle: string): PageMeta {
  const key = Object.prototype.hasOwnProperty.call(CASE_STUDY_KEYS, slug)
    ? CASE_STUDY_KEYS[slug as keyof typeof CASE_STUDY_KEYS]
    : null;
  if (key) return t.meta.caseStudies[key];
  return { title: format(t.meta.project.title, { title: projectTitle }), description: t.meta.site.fallbackDescription };
}
