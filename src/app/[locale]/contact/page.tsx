import { HeroLoader } from "@/components/organisms/Hero";
import { ContactForm } from '@/components/organisms';
import {getContactPageData} from '@/app/[locale]/contact/api'; 
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { pageMetadata } from '@/utils/page-metadata';

type ContactPageProps = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const contactData = await getContactPageData(locale);
  if (!contactData) notFound();
  // Preserve the full featuredImage object coming from the API (including
  // mediaDetails.sizes). Earlier we narrowed this to only sourceUrl/altText
  // which dropped the size metadata WpResponsiveImage needs to pick the
  // correct variant. Keep the shape loose here and let the image component
  // read the sizes.
  const featuredImage = contactData.featuredImage as
    | { sourceUrl?: string; altText?: string; mediaDetails?: { sizes?: any[] } }
    | undefined;

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="contact" variant="contact" locale={locale} />

      <div className="main">
        <div className="contact-form-container" id="contact-area">
        <div className="contact-form-content">
          <div className="contact-form-header">
            <h2 className="typo-4xl-extrabold m-0">{contactData.mainCopy}</h2>
            <h3 className="typo-2xl-extrabold mt-15">
              {contactData.tagText}
            </h3>
            <p className="typo-lg-medium">
              {contactData.bodytext}
            </p>
          </div>
          <ContactForm />
        </div>
        <div className="contact-form-image">
          <WpResponsiveImage
            // use a narrowed local `featuredImage` to avoid `any` casts
            image={featuredImage || undefined}
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
