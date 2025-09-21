export interface WpImageSize {
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ImageNode {
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: {
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
  title?: string | null;
  subtitle?: string | null;
  imageNode?: ImageNode | null;
}
export interface HeroProps {
  heading?: string;
  subheading?: string;
  className?: string;
}

export default HeroProps;
