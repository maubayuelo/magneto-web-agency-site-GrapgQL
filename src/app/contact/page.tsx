import HeroLoader from "@/components/organisms/Hero/HeroLoader";
import { ContactForm } from "@/components/organisms";
import {getContactPageData} from '@/app/contact/api'; 

export default async function ContactPage() {

  const contactData = await getContactPageData();

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
          <img
            src={contactData.featuredImage?.sourceUrl || '/default-contact-image.jpg'}
            alt={contactData.featuredImage?.altText || 'Contact us'}
            className="contact-form-img"
          />
        </div>
      </div>
      </div>
    </>
  );
}
