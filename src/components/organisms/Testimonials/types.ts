export interface Testimonial {
  id: string | number;
  quote: string;
  author: string;
  avatar: string;
  role: string;
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
