import { HeroLoader } from '@/components/organisms/Hero';
import { CalendlyButton } from '@/components/atoms';
import Image from 'next/image';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import '@/styles/pages/about.scss';
import { getAboutPageData } from './api';

export async function generateMetadata() {
  try {
    const data = await getAboutPageData();
    const title = data?.title ?? 'About Magneto - About the Agency';
    const desc = data?.meta_description ?? 'Meet Magneto Marketing \u2014 a solo web agency focused on strategy, design and web development.';
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
    const title = 'About Magneto - About the Agency';
    const desc = 'Meet Magneto Marketing \u2014 a solo web agency focused on strategy, design and web development.';
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  }
}

export default async function AboutPage() {
  const aboutData = await getAboutPageData();
  //console.log('About page data from CMS:', aboutData);

  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="about-magneto" variant="about" />

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
                <p className="typo-3xl-medium hero-title m-0">
                  {aboutData.aboutData.description}
                </p>
                <a href={aboutData.aboutData.linkUrl} className="about-linkedin-link" target="_blank">
                  <span className="typo-lg-bold typo-primary-color">{aboutData.aboutData.linkText}</span>
                  <Image
                    src="/assets/images/ico-arrow-up-right.svg"
                    alt="LinkedIn Icon"
                    className="about-linkedin-icon"
                    width={24}
                    height={24}
                  />
                </a>
              </div>

              <div className="about-section" dangerouslySetInnerHTML={{ __html: aboutData.aboutData.generalText }} />

              <div className="about-section">
                <CalendlyButton variant="secondary" utmContent="about_bottom" utmTerm="strategy_call">
                  Book a Free Strategy Call
                </CalendlyButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}