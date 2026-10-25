// Locale config. Pure (no Next imports): used by middleware, server components and tests.

export const LOCALES = ['en', 'fr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Value for `<html lang>` and `hreflang`. Describes the copy, not the WPML locale (es_ES). */
export const HTML_LANG: Record<Locale, string> = { en: 'en', fr: 'fr-CA', es: 'es' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Parses a comma list (e.g. "en,fr,es"). Unknown or blank entries are dropped, `en` is always included,
 * duplicates are removed, order follows LOCALES. Unset or empty → ['en'] (fail closed).
 */
export function parseEnabledLocales(raw: string | undefined): Locale[] {
  const requested = new Set<string>((raw ?? '').split(',').map((entry) => entry.trim()));
  requested.add(DEFAULT_LOCALE);
  return LOCALES.filter((locale) => requested.has(locale));
}

/** The only reader of ENABLED_LOCALES (server-only; applied at build time, so a change needs a rebuild). */
export function getEnabledLocales(): Locale[] {
  return parseEnabledLocales(process.env.ENABLED_LOCALES);
}

export function isEnabledLocale(value: unknown, enabled: Locale[] = getEnabledLocales()): value is Locale {
  return isLocale(value) && enabled.includes(value);
}
