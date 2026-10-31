export interface Testimonial {
  id: string | number;
  quote: string;
  author: string;
  role: string;
  /** Company, else city (shown after the role). */
  company?: string | null;
  city?: string | null;
  /** Optional small line under the attribution, e.g. "Translated from Spanish." */
  note?: string | null;
}

export interface TestimonialsProps {
  title?: string;
  testimonials?: Testimonial[];
  className?: string;
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}
