import type { WpMediaNode } from '@/utils/wp-media';

/** One `mediaDetails.sizes` entry as WPGraphQL returns it. */
export interface ContactImageSize {
  sourceUrl?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  name?: string | null;
}

export type ContactMediaNode = WpMediaNode & { mediaDetails?: { sizes?: ContactImageSize[] | null } | null };

/** `CONTACT_PAGE_QUERY` response. 5d-lite (ADR 0006 Amendment 2): `contactContactTexts` is no longer requested. */
export interface ContactPageResponse {
  pages?: { nodes?: Array<{ featuredImage?: { node?: ContactMediaNode | null } | null } | null> | null } | null;
}

export interface ContactFeaturedImage {
  sourceUrl: string;
  altText: string;
  mediaDetails: { sizes: ContactImageSize[] };
}

export interface ContactPageData {
  featuredImage: ContactFeaturedImage | null;
}
