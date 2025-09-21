export interface ImageNode {
  sourceUrl?: string;
}

export interface HomeHeader {
  logo?: ImageNode | null;
}

export interface HeaderProps {
  className?: string;
  siteTitle?: string;
}
