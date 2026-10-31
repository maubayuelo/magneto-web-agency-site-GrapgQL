import React from 'react';
import { TestimonialCard } from '@/components/organisms/TestimonialCard';
import { TestimonialsProps } from './types';
import './Testimonials.scss';

// Full quotes (no truncation). Renders nothing without testimonials: rows without a role never reach here.
export const Testimonials: React.FC<TestimonialsProps> = ({
  title,
  testimonials = [],
  className = ''
}) => {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className={`main testimonials ${className}`.trim()}>
        {title ? (
          <h2 className="typo-3xl-extrabold typo-center m-0">
            {title}
          </h2>
        ) : null}
        <div className="testimonials__grid pb-lg-responsive pt-15">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              className="testimonials__card"
            />
          ))}
        </div>
    </section>
  );
};
