// Project 404 (unknown slug or missing translation), driven by the UI dictionary (ADR 0005).
// See [locale]/not-found.tsx for the raw-HTML limit of runtime notFound() on Next 15.5.
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import NotFoundContent from '@/components/organisms/NotFound';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const t = getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);
  return { title: t.projectNotFound.metaTitle, robots: { index: false, follow: false } };
}

export default function NotFound() {
  return <NotFoundContent variant="project" />;
}
