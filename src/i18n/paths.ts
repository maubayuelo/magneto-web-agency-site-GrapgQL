// The single place that builds or parses locale paths (ADR 0003, D2). Pure.
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * "/fr/services" → { locale:'fr', path:'/services' } · "/services" → { locale:'en', path:'/services' }
 * "/en/contact" → { locale:'en', path:'/contact' } (internal rewritten path) · "/fr" → { 'fr', '/' }
 */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (match && isLocale(match[1])) {
    return { locale: match[1], path: match[2] || '/' };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || '/' };
}

/** "/services", 'fr' → "/fr/services" · "/", 'fr' → "/fr" · any path, 'en' → unchanged (no prefix). */
export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Same page in another locale. Slugs are the same in every locale (D2). */
export function switchLocalePath(pathname: string, target: Locale): string {
  return localizePath(splitLocalePath(pathname).path, target);
}
