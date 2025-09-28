export interface WpImageSize {
  name?: string | null;
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ImageNode {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: {
    width?: number | null;
    height?: number | null;
    sizes?: WpImageSize[] | null;
  } | null;
}

export type CTAType = 'link' | 'calendly' | 'button' | null;

export interface CTA {
  text?: string | null;
  href?: string | null;
  type?: CTAType;
  utmContent?: string | null;
  utmTerm?: string | null;
}

export interface HomeHero {
  title?: string | null;
  subtitle?: string | null;
  backgroundImage?: ImageNode | null;
  heroImage?: ImageNode | null;
  cta?: CTA | null;
}

export interface HeroProps {
  variant?: 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages' | 'default';
  title?: string | null;
  subtitle?: string | null;
  titleSize?: string;
  subtitleSize?: string;
  image?: { src: string; alt?: string; width?: number; height?: number } | null;
  imageNode?: ImageNode | null;
  cta?: CTA | null;
  backgroundImage?: string | null;
  showImage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default HeroProps;
