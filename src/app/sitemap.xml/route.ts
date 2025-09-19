import { NextResponse } from 'next/server';
import { SITE_URL, formatSitemapEntry, buildCanonical } from '@/utils/seo';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { GET_PROJECTS } from '@/data/projects';

export async function GET() {
  try {
    // fetch project data (slugs)
    const data = await fetchWPGraphQL(typeof GET_PROJECTS === 'string' ? GET_PROJECTS : GET_PROJECTS.loc?.source.body || '');
    const projects = data?.projects?.nodes || [];

    const staticPaths = ['/', '/about-magneto', '/services', '/projects', '/contact'];

    const projectUrls = (projects as any[]).map((p) => {
      const slug = p.slug;
      return formatSitemapEntry(`/projects/${slug}`, p.modified || new Date().toISOString());
    });

    const urlset = [
      ...staticPaths.map((p) => formatSitemapEntry(p, new Date().toISOString())),
      ...projectUrls,
    ].join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=3600',
      },
    });
  } catch (e) {
    console.error('Failed to build sitemap dynamically', e);
    // fallback to a minimal static sitemap
    const staticPaths = ['/', '/about-magneto', '/services', '/projects', '/contact'];
    const urlset = staticPaths.map((p) => formatSitemapEntry(p, new Date().toISOString())).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=3600',
      },
    });
  }
}
