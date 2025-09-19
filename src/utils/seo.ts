export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnetomktng.com';
export const siteName = 'Magneto Marketing';

export const defaultOgImage = {
  url: '/assets/images/hero-main-visual.png',
  width: 1200,
  height: 630,
  alt: 'Magneto Marketing',
};

export function buildCanonical(path = '/') {
  try {
    return new URL(path, SITE_URL).toString();
  } catch (e) {
    return SITE_URL;
  }
}

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
