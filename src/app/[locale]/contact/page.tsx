import type { ComponentProps } from 'react';
import { HeroLoader } from "@/components/organisms/Hero";
import { ContactForm } from '@/components/organisms';
import { CalendlyButton } from '@/components/atoms/CalendlyButton';
import {getContactPageData} from '@/app/[locale]/contact/api';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { pageMetadata } from '@/utils/page-metadata';

type ContactPageProps = { params: Promise<{ locale: string }> };
type WpImage = ComponentProps<typeof WpResponsiveImage>['image'];

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const contactData = await getContactPageData(locale);
  if (!contactData) notFound();
  const t = getDictionary(locale);
  // Keep mediaDetails.sizes: WpResponsiveImage needs them to pick the correct variant.
  const featuredImage = (contactData.featuredImage ?? undefined) as WpImage;

  return (
    <>
      {/* requireInternalCta: the CMS Calendly hero CTA is not rendered here (5d-lite D-3); the booking
          button below opens the booking modal instead. */}
      <HeroLoader pageUri="contact" variant="contact" locale={locale} requireInternalCta>
        <p className="hero-secondary">
          {t.contactPage.preferToTalk}{' '}
          <CalendlyButton variant="secondary" utmContent="contact_hero" utmTerm="strategy_call">
            {t.common.bookStrategyCall}
          </CalendlyButton>
        </p>
      </HeroLoader>

      <div className="main">
        <div className="contact-form-container" id="contact-area">
        <div className="contact-form-content">
          {/* Supporting copy from the dictionary (D-2 = C2). contactContactTexts is no longer rendered
              (ADR 0006 Amendment 2). */}
          <div className="contact-form-header">
            <p className="typo-lg-bold">{t.contactPage.supporting.reply}</p>
            <p className="typo-lg-bold">{t.contactPage.supporting.languages}</p>
            <p className="typo-lg-bold">{t.contactPage.supporting.notAQuote}</p>
          </div>
          <ContactForm />
        </div>
        <div className="contact-form-image">
          <WpResponsiveImage
            image={featuredImage}
            className="contact-form-img"
          />
        </div>
      </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;
  return pageMetadata(getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE).meta.contact);
}
