import HeroLoader from '@/components/organisms/Hero/HeroLoader';
import ServicesList from './ServicesList';
import './Services.scss';

export default function ServicesPage() {
  return (
    <>
      {/* HeroLoader fetches and renders the Hero section for this page */}
      <HeroLoader pageUri="services" variant="services" />
      <div className="main">
        <ServicesList />
      </div>
    </>
  );
}