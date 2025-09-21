import type { FinalCTAData } from '../FinalCTASection/types';

export interface PreFooterProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
  show?: boolean;
  debugData?: FinalCTAData | null;
}