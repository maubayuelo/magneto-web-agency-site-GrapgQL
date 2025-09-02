import HeroLoader from '@/components/organisms/Hero/HeroLoader';
import { CalendlyButton } from '../../components/atoms';
import Image from 'next/image';
import '../../styles/pages/about.scss';
import { getAboutPageData } from './api';



export default async function AboutPage() {
  const aboutData = await getAboutPageData();
  console.log("About page data from CMS:", aboutData);
  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="about-magneto" variant="about" />
      <div className='main'>
        <div className="about-content pb-lg-responsive">
          <div className="about-hero-section">
            <Image className="about-profile-image" src={aboutData.featuredImage?.node?.sourceUrl} alt="Mauricio Bayuelo - Founder of Magneto" width={450} height={450} />
            <div className="about-content-wrapper">
              <div className="about-section">
                <h2 className="typo-4xl-extrabold hero-title m-0">{aboutData.aboutData.sectionTitle}</h2>
                <p className="typo-3xl-medium hero-title m-0">{aboutData.aboutData.description}</p>
                <a href={aboutData.aboutData.linkUrl} className="about-linkedin-link" target='_blank'>
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
              <div className="about-section"
     dangerouslySetInnerHTML={{ __html: aboutData.aboutData.generalText }} />
              <div className="about-section">

                <CalendlyButton 
                  variant="secondary"
                  utmContent="about_bottom"
                  utmTerm="strategy_call"
                >
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