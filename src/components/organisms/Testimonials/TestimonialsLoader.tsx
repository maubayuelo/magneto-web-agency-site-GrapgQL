import { getHomeTestimonials } from './api';
import { Testimonials } from '.';

export default async function TestimonialsLoader({ title = "Testimonials", className = "" }) {
  const testimonialsRaw = await getHomeTestimonials();

  // Map CMS data to TestimonialsProps
  const testimonials = (testimonialsRaw || []).map((item: any, idx: number) => {
  //console.log('Testimonial avatar:', item.thumb?.node?.sourceUrl);
  return {
    id: idx,
    author: item.author,
    quote: item.testimonial,
    avatar: item.thumb?.node?.sourceUrl,
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