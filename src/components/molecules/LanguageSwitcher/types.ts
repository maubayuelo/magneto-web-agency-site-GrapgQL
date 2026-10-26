import type { Locale } from '@/i18n/config';

export interface LanguageSwitcherProps {
  /** Enabled locales, from the layout. */
  locales: Locale[];
  /** From the route params, not from the pathname (the server may see the internal /en path). */
  currentLocale: Locale;
  /** Accessible name of the group. */
  label?: string;
  className?: string;
}
