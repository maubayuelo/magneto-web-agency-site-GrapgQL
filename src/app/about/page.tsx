import { Hero } from '../../components/organisms';
import { CalendlyButton } from '../../components/atoms';
import Image from 'next/image';
import '../../styles/pages/about.scss';

export default function AboutPage() {
  return (
    <>
      <Hero 
        variant="about"
        title="About Magneto"
        subtitle="More than a web studio—Magneto is a mission to empower creators, coaches, and conscious brands through strategic design and digital transformation."
        titleSize="typo-4xl-extrabold"
        subtitleSize="typo-lg-medium"
        showImage={false}
        cta={{
          text: "Book a Free Strategy Call",
          type: "calendly",
          utmContent: "hero_about",
          utmTerm: "strategy_call"
        }}
      />
      <div className='main'>
        <div className="about-content pb-lg-responsive">
          <div className="about-hero-section">
            <Image className="about-profile-image" src="/assets/images/about-mauricio.png" alt="Mauricio Bayuelo - Founder of Magneto" width={450} height={450} />
            <div className="about-content-wrapper">
              <div className="about-section">
                <h2 className="typo-4xl-extrabold hero-title m-0">The Founder</h2>
                <p className="typo-3xl-medium hero-title m-0">I&apos;m Mauricio Bayuelo — designer, developer, and strategist based in Montreal. I started Magneto to help entrepreneurs turn their ideas into magnetic digital experiences that attract, convert, and scale.</p>
                <a href="https://www.linkedin.com/in/maubayuelo/" className="about-linkedin-link" target='_blank'>
                  <span className="typo-lg-bold typo-primary-color">Visit LinkedIn Profile</span>
                  <Image
                    src="/assets/images/ico-arrow-up-right.svg"
                    alt="LinkedIn Icon"
                    className="about-linkedin-icon"
                    width={24}
                    height={24}
                  />
                  
                </a>
              </div>
              
              <div className="about-section">
                <h3 className="typo-2xl-extrabold hero-title m-0">Why Magneto?</h3>
                <p className="typo-lg-medium hero-title m-0">You&apos;re not just getting a website — you&apos;re getting a conversion-focused system. From sales funnels to landing pages, from SEO to Google and social media ads, Magneto blends clean design with marketing strategy to drive real results.</p>
              </div>
              
              <div className="about-section">
                <h3 className="typo-2xl-extrabold hero-title m-0">What I Bring to the Table</h3>
                <ul className="typo-lg-medium m-0">
                  <li>Intuitive UX/UI design that enhances user navigation</li>
                  <li>Expert in WordPress and front-end development with a focus on good practices and site performance</li>
                  <li>Proven strategies for high-converting landing pages and sales funnels</li>
                  <li>Seamless integration with Google Ads and Meta Ads for effective marketing</li>
                  <li>Multilingual capabilities: English, French, Spanish</li>
                </ul>
              </div>
              
              <div className="about-section">
                <h3 className="typo-2xl-extrabold hero-title m-0">Ready to Bring Your Vision to Life?</h3>
                <p className="typo-lg-medium hero-title m-0">Let&apos;s talk about how we can build a bold, strategic online presence for your brand. Whether you&apos;re starting fresh or scaling up, I&apos;ll help you map out the next steps — clearly and confidently.</p>
                
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