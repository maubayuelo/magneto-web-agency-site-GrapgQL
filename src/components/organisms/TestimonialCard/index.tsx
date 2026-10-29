import React from 'react';
import { TestimonialCardProps } from './Testimonials.types';
import './TestimonialCard.scss';

// Quote (full, never truncated) · "author · role · company-or-city" · optional note. No avatar (Phase 5a).
export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  className = ''
}) => {
  const attribution = [testimonial.author, testimonial.role, testimonial.company || testimonial.city]
    .filter((part) => part && part.trim() !== '')
    .join(' · ');
  return (
    <figure className={`testimonial-card m-0 ${className}`.trim()}>
      <blockquote className="testimonial-card__quote">
        <p className="m-0">&ldquo;{testimonial.quote}&rdquo;</p>
      </blockquote>
      <figcaption className="testimonial-card__caption">
        <span className="testimonial-card__author">{attribution}</span>
        {testimonial.note ? <span className="testimonial-card__note">{testimonial.note}</span> : null}
      </figcaption>
    </figure>
  );
};
