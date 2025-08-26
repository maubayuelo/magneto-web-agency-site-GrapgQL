import HeroLoader from '@/components/organisms/Hero/HeroLoader';
import { ContactForm } from '@/components/organisms';

export default function ContactPage() {
  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
            <HeroLoader pageUri="contact" variant="contact" />
      <div className="main">
        <ContactForm />
      </div>
    </>
  );
}