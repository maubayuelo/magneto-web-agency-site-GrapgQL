import { Hero, ContactForm } from '../../components/organisms';

export default function ContactPage() {
  return (
    <>
      <Hero 
        variant="contact"
        title="Get In Touch"
        subtitle="Ready to transform your digital presence? Let's start the conversation."
        showImage={false}
        cta={{
          text: "Start Your Project",
          href: "#contact-form"
        }}
      />
      <div className="main">
        <ContactForm />
      </div>
    </>
  );
}