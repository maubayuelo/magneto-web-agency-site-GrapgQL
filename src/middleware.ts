import { NextResponse, type NextRequest } from 'next/server';
import { getEnabledLocales } from '@/i18n/config';
import { resolveInternalPath } from '@/i18n/routing';

// EN stays unprefixed: /x is rewritten to the internal /en/x (no redirect, browser URL unchanged).
// /en/* itself is deliberately not exposed: it becomes /en/en/* and 404s, as before (ADR 0003, D4).
export function middleware(req: NextRequest) {
  const internal = resolveInternalPath(req.nextUrl.pathname, getEnabledLocales());
  if (internal === null) return NextResponse.next();
  return NextResponse.rewrite(new URL(internal + req.nextUrl.search, req.url));
}

export const config = {
  matcher: ['/((?!api|_next|assets|robots\\.txt|sitemap\\.xml|.*\\..*).*)'],
};
