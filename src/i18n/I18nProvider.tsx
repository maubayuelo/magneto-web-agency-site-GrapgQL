'use client';
// Client access to the current locale's dictionary (ADR 0005). `[locale]/layout.tsx` passes only that
// locale's dictionary, so other locales never reach client bundles. Import only the EN file here (the
// fallback), never `../dictionary` (getDictionary) or the FR/ES files. Renders no DOM.
import React, { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from './config';
import { en } from './dictionaries/en';

type DictionaryShape = typeof en;

export interface I18nValue {
  locale: Locale;
  t: DictionaryShape;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: DictionaryShape;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

/** Locale + dictionary from the nearest provider. Outside one (unit tests) it falls back to EN. */
export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? { locale: DEFAULT_LOCALE, t: en };
}
