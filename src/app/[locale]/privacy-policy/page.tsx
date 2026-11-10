import '@/styles/pages/privacy.scss';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { pageMetadata } from '@/utils/page-metadata';
import { getPrivacyPage } from './api';

type PrivacyPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale: rawLocale } = await params;
  return pageMetadata(getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE).meta.privacy);
}

export default async function PrivacyPolicyPage({ params }: PrivacyPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const page = await getPrivacyPage(locale);
  if (!page) notFound();

  // No `lang` here: the root <html lang> is already per locale. No Hero, no final CTA (D-P2 A).
  return (
    <div className="main">
      <article className="privacy-policy pt-lg-responsive pb-lg-responsive">
        <h1 className="privacy-policy__title typo-4xl-extrabold">{page.title}</h1>
        <div className="privacy-policy__body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.html) }} />
      </article>
    </div>
  );
}
