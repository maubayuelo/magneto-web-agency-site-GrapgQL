export interface WpImageSize {
  sourceUrl?: string;
  width?: number;
  height?: number;
}

export interface WpImage {
  sourceUrl?: string;
  altText?: string;
  mediaDetails?: {
    sizes?: WpImageSize[];
  };
}

export interface ProjectItem {
  id: string | number;
  slug: string;
  title: string;
  featuredImage?: { node?: WpImage } | null;
  solutions?: string[] | null;
  results?: string[] | null;
}

export interface ProjectsGridProps {
  projects: ProjectItem[];
  title?: string;
  maxProjects?: number;
  showButton?: boolean;
}

export default ProjectsGridProps;
