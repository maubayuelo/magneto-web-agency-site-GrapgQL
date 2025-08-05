import React from 'react';
import PackageCard, { PackageCardProps } from '../../molecules/PackageCard';
import './PackagesGrid.scss';

export interface PackagesGridProps {
  packages: PackageCardProps[];
}

const PackagesGrid: React.FC<PackagesGridProps> = ({ packages }) => {
  return (
    <section className="packages-grid pt-md-responsive pb-lg-responsive">
      <div className="packages-grid__container">
        {packages.map((packageData, index) => (
          <PackageCard
            key={index}
            {...packageData}
          />
        ))}
      </div>
    </section>
  );
};

export default PackagesGrid;

// Named export for compatibility
export { PackagesGrid };
