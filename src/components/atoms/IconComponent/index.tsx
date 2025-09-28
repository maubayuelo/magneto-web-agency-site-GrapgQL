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
  const isSvg = src && src.toLowerCase().endsWith('.svg');

  return (
    <div className={`icon-component icon-component--${size} ${className}`}>
      <div className="icon-component__placeholder">
        {isSvg ? (
          // Use plain img for SVGs (keeps markup simple and avoids next/image optimizing SVGs)
          // src may be a remote URL or a local path like /assets/images/ico-*.svg
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="icon-component__image" width={30} height={30} />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={30}
            height={30}
            className="icon-component__image"
            priority={false}
          />
        )}
      </div>
    </div>
  );
};

export default IconComponent;
