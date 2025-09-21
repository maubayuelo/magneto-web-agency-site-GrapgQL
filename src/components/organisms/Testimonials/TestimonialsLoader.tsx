import { getHomeTestimonials, Testimonial } from './api';
import { Testimonials } from '.';

export default async function TestimonialsLoader({ title = "Testimonials", className = "" }) {
  const testimonialsRaw: Testimonial[] = await getHomeTestimonials();

  // Map CMS data to TestimonialsProps
  const testimonials = (testimonialsRaw || []).map((item, idx: number) => {
    return {
      id: idx,
      author: item.author || '',
      quote: item.testimonial || '',
      avatar: item.thumb?.node?.sourceUrl || '',
      role: "",
    };
  });

  return (
    <Testimonials
      title={title}
      testimonials={testimonials}
      className={className}
    />
  );
}