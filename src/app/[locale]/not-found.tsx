// Custom 404 inside [locale]/layout.tsx (header/footer), driven by the UI dictionary (ADR 0005).
// Next 15.5 streams runtime notFound() as a bare `<html id="__next_error__">` shell: this generateMetadata still
// sets the raw <title> and a single noindex; `lang` and the body arrive with hydration (Known debt).
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import NotFoundContent from '@/components/organisms/NotFound';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const t = getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE);
  return { title: t.notFound.metaTitle, robots: { index: false, follow: false } };
}

export default function NotFound() {
  return <NotFoundContent variant="page" />;
}
