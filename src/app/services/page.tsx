import { Hero } from '../../components/organisms';
import ServicesList from './ServicesList';
import './Services.scss';

export default function ServicesPage() {
  return (
    <>
      <Hero 
        variant="services"
        title="Services"
        subtitle="Strategic design, powerful tech—crafted to grow your brand and revenue."
        showImage={false}
        cta={{
          text: "Book a Free Strategy Call",
          type: "calendly",
          utmContent: "hero_services",
          utmTerm: "strategy_call"
        }}
      />
      <div className="main">
        <ServicesList />
      </div>
    </>
  );
}