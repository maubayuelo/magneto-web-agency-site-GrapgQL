// Locale → WordPress (WPML) query variables. Pure (ADR 0004, D1/D3).
import { DEFAULT_LOCALE, type Locale } from './config';

/** WPML language code for a frontend locale (same codes today; one place if they ever differ). */
export function toWpLanguage(locale: Locale): string {
  return locale;
}

/** Variables every localized query takes. mediaOriginal: also fetch the EN original of each image (D3). */
export function wpLocaleVars(locale: Locale): { language: string; mediaOriginal: boolean } {
  return { language: toWpLanguage(locale), mediaOriginal: locale !== DEFAULT_LOCALE };
}
