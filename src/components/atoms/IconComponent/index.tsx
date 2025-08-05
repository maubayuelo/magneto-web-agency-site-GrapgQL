import React from 'react';
import Image from 'next/image';
import './IconComponent.scss';

export interface IconComponentProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md';
  className?: string;
}

const IconComponent: React.FC<IconComponentProps> = ({ 
  src, 
  alt, 
  size = 'sm',
  className = '' 
}) => {
  return (
    <div className={`icon-component icon-component--${size} ${className}`}>
      <div className="icon-component__placeholder">
        <Image
          src={src}
          alt={alt}
          width={30}
          height={30}
          className="icon-component__image"
          priority={false}
        />
      </div>
    </div>
  );
};

export default IconComponent;
