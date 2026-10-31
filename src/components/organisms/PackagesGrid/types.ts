export interface PackageItem {
  title?: string | null;
  description?: string | null;
  price?: string | number | null;
  features?: Array<string | { text?: string | null }> | null;
  icon?: string | null;
  /** 5b rich card fields (see PackageCardProps). */
  heading?: string | null;
  bodyHtml?: string | null;
  anchorId?: string | null;
  cta?: { text: string; href: string } | null;
}

export interface PackagesGridProps {
  packages?: PackageItem[];
  className?: string;
}

export default PackagesGridProps;
