import React from 'react';
import Image from 'next/image';
import { TestimonialCardProps } from './Testimonials.types';


export const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  testimonial, 
  className = '' 
}) => {
  //console.log('TestimonialCard avatar:', testimonial.avatar);
  return (
    <div className={`testimonial-card ${className}`}>
      <div className="testimonial-card__avatar">
        <Image
          src={testimonial.avatar}
          alt={`${testimonial.author} avatar`}
          width={54}
          height={54}
          className="testimonial-card__avatar-image"
          priority
        />
      </div>
      <p className="testimonial-card__quote">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="testimonial-card__author">
        {testimonial.author}, {testimonial.role}
      </div>
    </div>
  );
};
