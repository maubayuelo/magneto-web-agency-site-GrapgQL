// Routing decision for src/middleware.ts. Pure.
import { DEFAULT_LOCALE, type Locale } from './config';
import { splitLocalePath } from './paths';

/**
 * Internal path the request must render.
 *  - first segment is an ENABLED non-default locale (fr/es) → null (pass through, path already matches app/[locale])
 *  - anything else → '/en' + pathname  ('/' → '/en')
 * So /en/x → /en/en/x and a disabled /fr/x → /en/fr/x: both hit the catch-all → 404, as today (D4).
 */
export function resolveInternalPath(pathname: string, enabled: Locale[]): string | null {
  const { locale } = splitLocalePath(pathname);
  if (locale !== DEFAULT_LOCALE && enabled.includes(locale)) return null;
  return pathname === '/' ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
}
