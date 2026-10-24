import { HeroLoader } from "@/components/organisms/Hero";
import { ContactForm } from '@/components/organisms';
import {getContactPageData} from '@/app/contact/api'; 
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';

export default async function ContactPage() {

  const contactData = await getContactPageData();
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
      <HeroLoader pageUri="contact" variant="contact" />

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

export async function generateMetadata() {
  try {
  await getContactPageData();
  const title = 'Contact - Magneto Marketing';
  const desc = 'Get in touch with Magneto Marketing to book a strategy call or ask about services.';
  return { title, description: desc, openGraph: { title, description: desc }, twitter: { title, description: desc } };
  } catch {
    return {
      title: 'Contact - Magneto Marketing',
      description: 'Get in touch with Magneto Marketing to book a strategy call or ask about services.',
    };
  }
}
