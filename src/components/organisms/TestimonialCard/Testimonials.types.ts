export interface Testimonial {
  id: string | number;
  author: string;
  role: string;
  company?: string;
  quote: string;
  avatar: string;
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}
