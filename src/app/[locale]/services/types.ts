import type { WpMediaNode } from '@/utils/wp-media';

export type ContentBody = { kind: 'html'; html: string } | { kind: 'text'; text: string };
export interface InternalLink { text: string; path: string }
export interface MediaWrapper { node?: WpMediaNode | null }
export interface PageIntro { pageIntroText?: string | null; introBodyHtml?: string | null }
export interface ServiceNode {
  title?: string | null;
  heading?: string | null;
  description?: string | null;
  descriptionHtml?: string | null;
  featuredService?: boolean | null;
  serviceGroup?: (string | null)[] | null;
  ctaText?: string | null;
  ctaPath?: string | null;
  anchorId?: string | null;
  icon?: MediaWrapper | null;
  image?: MediaWrapper | null;
}
export interface ServicesPageNode {
  pageintrotext?: PageIntro | null;
  servicesServiceDetails?: {
    coreHeading?: string | null;
    supportingHeading?: string | null;
    supportingIntro?: string | null;
    services?: (ServiceNode | null)[] | null;
  } | null;
}
export interface ServicesResponse { pages?: { nodes?: (ServicesPageNode | null)[] | null } | null }
export interface ServiceItem {
  title: string;
  heading: string;
  body: ContentBody | null;
  group: 'core' | 'supporting' | 'unclassified';
  anchorId: string | null;
  cta: InternalLink | null;
  featured: boolean;
  icon: { src: string; alt: string } | null;
  image: { src: string; alt: string } | null;
}
export interface ServicesPageData {
  introTitle: string;
  introBody: ContentBody | null;
  coreHeading: string;
  supportingHeading: string;
  supportingIntro: string;
  services: ServiceItem[];
  issues: string[];
}
