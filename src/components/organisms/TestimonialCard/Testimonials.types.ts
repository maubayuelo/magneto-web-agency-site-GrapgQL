export interface Testimonial {
  id: string | number;
  author: string;
  role: string;
  /** Company, else city (shown after the role). */
  company?: string | null;
  city?: string | null;
  quote: string;
  /** Optional small line under the attribution, e.g. "Translated from Spanish." */
  note?: string | null;
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}
