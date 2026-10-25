'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { HTML_LANG, type Locale } from '@/i18n/config';
import { switchLocalePath } from '@/i18n/paths';
import type { LanguageSwitcherProps } from './types';
import './LanguageSwitcher.scss';

const SHORT_NAME: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
// Each language names itself, so these are not dictionary strings.
const NATIVE_NAME: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

export function LanguageSwitcher({ locales, currentLocale, label = 'Language', className = '' }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? '/';
  if (locales.length < 2) return null;

  return (
    <div role="group" aria-label={label} className={['language-switcher', className].filter(Boolean).join(' ')}>
      {locales.map((locale) => (
        // Plain <a>: changing locale swaps the root layout, so it is a full load anyway.
        <a
          key={locale}
          href={switchLocalePath(pathname, locale)}
          hrefLang={HTML_LANG[locale]}
          lang={HTML_LANG[locale]}
          aria-label={NATIVE_NAME[locale]}
          aria-current={locale === currentLocale ? 'true' : undefined}
          className="language-switcher__link typo-sm-bold"
        >
          {SHORT_NAME[locale]}
        </a>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
