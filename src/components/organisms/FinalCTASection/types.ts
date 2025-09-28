export interface ImageNode {
  node?: {
    sourceUrl?: string | null;
    mediaDetails?: {
      sizes?: Array<{
        name?: string | null;
        width?: number | null;
        height?: number | null;
        sourceUrl?: string | null;
      } | null> | null;
    } | null;
  } | null;
}

export interface FinalCTAData {
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgimage?: ImageNode | null;
}

export interface FinalCTASectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
  show?: boolean;
  debugData?: FinalCTAData | null;
}

export default FinalCTASectionProps;
