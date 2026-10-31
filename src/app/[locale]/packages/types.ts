import type { ContentBody, InternalLink, MediaWrapper, PageIntro } from '../services/types';

export interface PackageNode {
  name?: string | null;
  heading?: string | null;
  price?: string | null;
  description?: string | null;
  descriptionHtml?: string | null;
  featuresTitle?: string | null;
  features?: ({ feature?: string | null } | null)[] | null;
  ctaText?: string | null;
  ctaPath?: string | null;
  anchorId?: string | null;
  popularChoise?: boolean | null;
  icon?: MediaWrapper | null;
}
export interface PackagesPageNode {
  pageintrotext?: PageIntro | null;
  packagesPackageFeatures?: { packagesElements?: (PackageNode | null)[] | null } | null;
  packagesContentSections?: { sections?: ({ heading?: string | null; bodyHtml?: string | null } | null)[] | null } | null;
}
export interface PackagesResponse { pages?: { nodes?: (PackagesPageNode | null)[] | null } | null }
export interface PackageContent {
  title: string;
  heading: string;
  body: ContentBody | null;
  price: string;
  currency: string;
  features: { text: string }[];
  featuresTitle: string;
  anchorId: string | null;
  cta: InternalLink | null;
  ctaMode: 'link' | 'legacy' | 'none';
  icon: string;
}
export interface LegacyPackage {
  title: string;
  price: string;
  currency: string;
  description: string;
  icon: string;
  isPopular: boolean;
  features: { text: string }[];
  variant: 'popular' | 'default';
}
export interface PackagesPageData {
  introText: string;
  /** Part 1 adapter: preserves the current Packages presentation until checkpoint approval. */
  packages: LegacyPackage[];
  content: {
    introBody: ContentBody | null;
    packages: PackageContent[];
    sections: { heading: string; body: ContentBody | null }[];
  };
  issues: string[];
}
