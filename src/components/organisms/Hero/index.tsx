import Image from "next/image";
import { CalendlyButton } from '../../atoms';
import './Hero.scss';

export interface HeroProps {
  variant?: 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages' | 'default';
  title: string;
  subtitle: string;
  titleSize?: string;
  subtitleSize?: string;
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  cta?: {
    text: string;
    href?: string;
    onClick?: () => void;
    type?: 'link' | 'calendly' | 'button';
    utmContent?: string;
    utmTerm?: string;
  } | null;
  backgroundImage?: string;
  showImage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Hero({
  variant = 'default',
  title,
  subtitle,
  titleSize,
  subtitleSize,
  image,
  cta = null,
  backgroundImage,
  showImage,
  className = '',
  children
}: HeroProps) {
  // Set default sizes based on variant
  const defaultTitleSize = variant === 'home' ? 'typo-5xl-extrabold' : 'typo-4xl-extrabold';
  const defaultSubtitleSize = variant === 'home' ? 'typo-2xl-medium' : 'typo-xl-medium';
  const defaultShowImage = variant === 'home' ? true : false;
  
  const finalTitleSize = titleSize || defaultTitleSize;
  const finalSubtitleSize = subtitleSize || defaultSubtitleSize;
  const finalShowImage = showImage !== undefined ? showImage : defaultShowImage;
  
  // Default hero image for home variant
  const defaultHeroImage = {
    src: "/assets/images/hero-main-visual.png",
    alt: "Mauricio - Web Designer & Developer",
    width: 500,
    height: 500
  };
  
  const finalImage = image || (finalShowImage ? defaultHeroImage : null);
  
  const heroClasses = `hero hero-${variant} ${className}`.trim();
  
  return (
    <div className='main pb-lg-responsive'>
        <section className={heroClasses} style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}>
      <div className="hero-content">
        <h1 className={`${finalTitleSize} m-0 hero-title`}>{title}</h1>
        <p className={`${finalSubtitleSize} m-0 hero-subtitle`}>{subtitle}</p>
        {children}
         {cta && (
          <div className="hero-cta-wrapper">
            {/* 
              If the CTA is for Calendly (either by explicit type or by matching the Calendly URL),
              render the CalendlyButton which opens the modal.
              Otherwise, render a normal link or button.
            */}
            {(cta.type === 'calendly' || cta.href === "https://calendly.com/mauriciobayuelo/free-discovery-call") ? (
              <CalendlyButton 
                utmContent={cta.utmContent}
                utmTerm={cta.utmTerm}
                className="btn btn-primary"
              >
                {cta.text}
              </CalendlyButton>
            ) : cta.href ? (
              // If CTA has an href and is not Calendly, render as a normal link
              <a href={cta.href} className="btn btn-primary">
                {cta.text}
              </a>
            ) : (
              // Otherwise, render as a button (e.g., for onClick actions)
              <button onClick={cta.onClick} className="btn btn-primary">
                {cta.text}
              </button>
            )}
          </div>
        )}
        {finalImage?.src && (
          <Image
            src={finalImage.src}
            alt={finalImage.alt}
            width={finalImage.width || 500}
            height={finalImage.height || 500}
            priority
            className="hero-image"
          />
        )}
      </div>
    </section>
    </div>
  );
}
