// UI dictionaries (ADR 0005). Server-only entry point: client components use `useI18n()` from
// `I18nProvider.tsx` and must not import this file, which pulls in every locale.
import { DEFAULT_LOCALE, type Locale } from './config';
import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';
import { es } from './dictionaries/es';

// Interpolation lives in a dictionary-free module so client code can import it (format.ts).
export { format, formatParts } from './format';

/** Shape of every locale's dictionary: the EN object with every leaf widened to `string`. */
export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, es };

/** Sync and pure: the dictionaries are plain objects bundled with the server code. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

type Tree = { [key: string]: string | Tree };

/** "a.b.c" → value, for every string leaf. */
export function flattenDictionary(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, flattenDictionary(value, path));
  }
  return out;
}

/** Flattened keys whose value still holds a `[XX TODO]` marker (Decision B). */
export function findTodoKeys(dict: Dictionary): string[] {
  return Object.entries(flattenDictionary(dict as Tree))
    .filter(([, value]) => value.includes('TODO]'))
    .map(([key]) => key);
}

/**
 * Build-time readiness guard (spec §2.1a): throws if an enabled non-EN locale still has TODO markers.
 * No-op when only `en` is enabled or when `allowUntranslated` is true (local builds only).
 */
export function assertLocalesReady(
  enabled: Locale[],
  opts: { allowUntranslated?: boolean } = {},
  dictionaries: Record<Locale, Dictionary> = DICTIONARIES,
): void {
  if (opts.allowUntranslated) return;
  const problems = enabled
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .map((locale) => ({ locale, keys: findTodoKeys(dictionaries[locale]) }))
    .filter(({ keys }) => keys.length > 0);
  if (problems.length === 0) return;
  const details = problems
    .map(({ locale, keys }) => {
      const head = keys.slice(0, 5).join(', ');
      return `ENABLED_LOCALES enables ${locale}, but its dictionary has ${keys.length} untranslated keys ([${locale.toUpperCase()} TODO]): ${head}${keys.length > 5 ? ', …' : ''}`;
    })
    .join('; ');
  throw new Error(
    `${details}. Translate them, or remove the locale from ENABLED_LOCALES. ALLOW_UNTRANSLATED_LOCALES=1 is for local builds only.`,
  );
}
