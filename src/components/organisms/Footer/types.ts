export interface FooterProps {
  footerLine1?: string;
  footerLine2?: string;
  footerSocialIcons?: Array<{
    iconUrl: string;
    iconSvg: {
      node: {
        sourceUrl: string;
      };
    };
  }>;
  className?: string;
  show?: boolean;
  debugData?: any;
}