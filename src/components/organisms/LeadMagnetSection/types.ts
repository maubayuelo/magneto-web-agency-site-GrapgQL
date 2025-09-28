export interface LinkNode {
  node?: {
    id?: string | number;
    url?: string | null;
    uri?: string | null;
    link?: string | null;
  } | null;
}

export interface LeadMagnetSectionData {
  overTitleLeadMagnetSection?: string | null;
  titleLeadMagnetSection?: string | null;
  subtitleLeadMagnetSection?: string | null;
  ctaTextLeadMagnetSection?: string | null;
  ctaLinkLeadMagnetSection?: LinkNode | null;
  downloadUrl?: string | null;
  // Normalized/legacy fields - some templates expect these names
  ctaLink?: string | LinkNode | null;
  ctaType?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}

export interface LeadMagnetSectionProps {
  className?: string;
  show?: boolean;
}

export default LeadMagnetSectionProps;

