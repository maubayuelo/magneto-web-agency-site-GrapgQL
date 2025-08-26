import React from 'react';
import Image from 'next/image';
import './ServiceIcon.scss';

interface ServiceIconProps {
  type: string;
  size?: number;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ type, size = 27 }) => {
  return (
    <div className={`service-icon service-icon--${type}`} data-size={size}>
      <Image
        src={type}
        alt={`${type} icon`}
        width={size}
        height={size}
        className="service-icon__image"
      />
    </div>
  );
};

export default ServiceIcon;
