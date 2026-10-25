"use client";

import React from 'react';
import PackageCard, { PackageCardProps } from '../../molecules/PackageCard';
import type { PackageItem } from './types';
import './PackagesGrid.scss';

export interface PackagesGridProps {
  packages: PackageItem[] | PackageCardProps[];
}

const PackagesGrid: React.FC<PackagesGridProps> = ({ packages }) => {
  return (
    <section className="packages-grid pt-md-responsive pb-lg-responsive">
      <div className="packages-grid__container">
        {packages.map((packageData, index) => (
          <PackageCard
            key={index}
            title={packageData.title || ''}
            description={packageData.description || ''}
            price={packageData.price ? String(packageData.price) : ''}
            features={(packageData.features || []).map((f) => ({ text: typeof f === 'string' ? f : (f && 'text' in f ? (f as { text?: string }).text || '' : '') }))}
            icon={packageData.icon || undefined}
          />
        ))}
      </div>
    </section>
  );
};

export default PackagesGrid;

// Named export for compatibility
export { PackagesGrid };
