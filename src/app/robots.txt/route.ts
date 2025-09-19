import { NextResponse } from 'next/server';
import { SITE_URL } from '@/utils/seo';

export async function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${SITE_URL.replace(/\/$/, '')}/sitemap.xml`,
  ];

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
