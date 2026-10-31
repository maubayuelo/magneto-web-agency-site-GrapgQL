import { HeroLoader } from '@/components/organisms/Hero';
import { CalendlyButton } from '@/components/atoms';
import Image from 'next/image';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import '@/styles/pages/about.scss';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import DOMPurify from 'isomorphic-dompurify';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { getAboutPageData } from './api';

type AboutPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  try {
    const data = await getAboutPageData(locale);
    const title = data?.title ?? t.meta.about.title;
    const desc = data?.meta_description ?? t.meta.about.description;
    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
      },
      twitter: {
        title,
        description: desc,
      },
    };
  } catch (e) {
    const title = t.meta.about.title;
    const desc = t.meta.about.description;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  }
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const aboutData = await getAboutPageData(locale);
  if (!aboutData) notFound();
  const t = getDictionary(locale);
  //console.log('About page data from CMS:', aboutData);

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="about-magneto" variant="about" locale={locale} />

      <div className="main">
        <div className="about-content pb-lg-responsive">
          <div className="about-hero-section">
            <WpResponsiveImage
              className="about-profile-image"
              image={
                aboutData.featuredImage?.node || {
                  sourceUrl: aboutData.featuredImage?.sourceUrl,
                  altText: aboutData.featuredImage?.altText,
                }
              }
              omitSizeAttributes={true}
            />

            <div className="about-content-wrapper">
              <div className="about-section">
                <h2 className="typo-4xl-extrabold hero-title m-0">
                  {aboutData.aboutData.sectionTitle}
                </h2>
                {aboutData.founder?.kind === 'html' ? (
                  <div
                    className="typo-3xl-medium hero-title m-0 about-founder-text"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aboutData.founder.html) }}
                  />
                ) : (
                  <p className="typo-3xl-medium hero-title m-0">
                    {aboutData.founder?.kind === 'text' ? aboutData.founder.text : null}
                  </p>
                )}
                <a href={aboutData.aboutData.linkUrl} className="about-linkedin-link" target="_blank">
                  <span className="typo-lg-bold typo-primary-color">{aboutData.aboutData.linkText}</span>
                  <Image
                    src="/assets/images/ico-arrow-up-right.svg"
                    alt={t.about.linkedinIconAlt}
                    className="about-linkedin-icon"
                    width={24}
                    height={24}
                  />
                </a>
              </div>

              <div className="about-section" dangerouslySetInnerHTML={{ __html: aboutData.aboutData.generalText }} />

              <div className="about-section">
                {aboutData.cta ? (
                  <a className="btn btn-secondary" href={localizePath(aboutData.cta.path, locale)}>
                    {aboutData.cta.text}
                  </a>
                ) : (
                  <CalendlyButton variant="secondary" utmContent="about_bottom" utmTerm="strategy_call">
                    {t.common.bookStrategyCall}
                  </CalendlyButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FinalCTASectionLoader source={{ kind: 'page', name: 'about-magneto' }} locale={locale} />
    </>
  );
}