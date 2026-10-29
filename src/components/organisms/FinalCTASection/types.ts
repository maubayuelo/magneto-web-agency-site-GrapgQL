import type { Locale } from '@/i18n/config';

export interface ImageNode {
  node?: {
    sourceUrl?: string | null;
    mediaDetails?: {
      sizes?: Array<{
        name?: string | null;
        width?: number | null;
        height?: number | null;
        sourceUrl?: string | null;
      } | null> | null;
    } | null;
  } | null;
}

export interface FinalCTAData {
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  /** Internal path (e.g. `/contact`), localized by the frontend. Empty → the primary button opens the modal. */
  ctaPath?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaPath?: string | null;
  bgimage?: ImageNode | null;
}

/** Whose final CTA to read: a WP page by `name` (slug) or a project by slug, in the request language. */
export type FinalCtaSource = { kind: 'page'; name: string } | { kind: 'project'; slug: string };

export interface FinalCTASectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
  show?: boolean;
  debugData?: FinalCTAData | null;
  /** Request locale; the client fallback fetch reads this locale's home page. */
  locale: Locale;
}

export default FinalCTASectionProps;
