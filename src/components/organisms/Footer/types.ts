export interface FooterSocialIconNode {
  node?: {
    sourceUrl?: string | null;
  } | null;
}

export interface FooterSocialIcon {
  iconUrl?: string | null;
  iconSvg?: FooterSocialIconNode | null;
  alt?: string | null;
}

export interface FooterResponse {
  footerLine1?: string | null;
  footerSocialIcons?: FooterSocialIcon[] | null;
  footerLine2?: string | null;
}

export interface FooterProps {
  className?: string;
  footerData?: FooterResponse | null;
}
  show?: boolean;
  debugData?: FooterResponse | null;
}