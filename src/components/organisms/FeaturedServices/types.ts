export interface IconNode {
  node?: {
    sourceUrl?: string | null;
  } | null;
}

export interface FeaturedServiceItem {
  serviceTitle?: string | null;
  serviceDescription?: string | null;
  serviceIcon?: IconNode | string | null;
  anchorLink?: string | null;
}

export interface FeaturedServicesResponse {
  sectionTitle?: string | null;
  service?: FeaturedServiceItem[] | null;
}

export interface FeaturedServicesProps {
  services?: FeaturedServiceItem[];
  className?: string;
}
