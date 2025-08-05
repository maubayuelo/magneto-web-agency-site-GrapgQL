import React from 'react';
import { TestimonialCard } from '../TestimonialCard';
import { TestimonialsProps } from './types';
import './Testimonials.scss';

// Utility function to truncate testimonial text to 111 characters
const truncateText = (text: string, maxLength: number = 111): string => {
  if (text.length <= maxLength) return text;
  
  // Find the last space before the maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If there's a space, truncate at the space; otherwise, truncate at maxLength
  const finalText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  
  return finalText + '...';
};

export const Testimonials: React.FC<TestimonialsProps> = ({ 
  title = "Some Testimonials",
  testimonials = [],
  className = '' 
}) => {
  // Add safety check for testimonials
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className={`main testimonials ${className}`}>

        <h2 className="typo-3xl-extrabold  typo-center m-0">
          {title}
        </h2>
        <div className="testimonials__grid pb-lg-responsive pt-15">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={{
                ...testimonial,
                quote: truncateText(testimonial.quote, 111)
              }}
              className="testimonials__card"
            />
          ))}
        </div>

    </section>
  );
};