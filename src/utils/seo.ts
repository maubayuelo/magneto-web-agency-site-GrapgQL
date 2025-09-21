// SEO helpers and site constants
// These helpers are small utilities used by layout and page files to build
// canonical URLs, Open Graph defaults and simple sitemap entries.

// Base site URL for building absolute links. For local development, set
// NEXT_PUBLIC_SITE_URL in `.env.local` so generated links point to your dev host.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnetomktng.com';
export const siteName = 'Magneto Marketing';

// Default Open Graph image used when no page-specific image is available.
export const defaultOgImage = {
  url: '/assets/images/hero-main-visual.png',
  width: 1200,
  height: 630,
  alt: 'Magneto Marketing',
};

/**
 * buildCanonical
 * Build an absolute URL for a given path using SITE_URL. Returns a string.
 */
export function buildCanonical(path = '/') {
  try {
    return new URL(path, SITE_URL).toString();
  } catch (e) {
    return SITE_URL;
  }
}

/**
 * formatSitemapEntry
 * Helper for building a small XML sitemap entry for a path. This is used when
 * generating a simple sitemap manually; most sites use a sitemap generator or
 * Next.js built-in features instead.
 */
export function formatSitemapEntry(path: string, lastmod?: string) {
  const loc = buildCanonical(path);
  return `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`;
}

export default {
  SITE_URL,
  siteName,
  defaultOgImage,
  buildCanonical,
  formatSitemapEntry,
};
