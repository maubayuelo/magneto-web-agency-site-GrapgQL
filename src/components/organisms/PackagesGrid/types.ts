export interface PackageItem {
  title?: string | null;
  description?: string | null;
  price?: string | number | null;
  features?: Array<string | { text?: string | null }> | null;
  icon?: string | null;
}

export interface PackagesGridProps {
  packages?: PackageItem[];
  className?: string;
}

export default PackagesGridProps;
