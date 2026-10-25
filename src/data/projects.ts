// The shape ProjectDetail renders (mapped in app/[locale]/projects/[slug]/page.tsx from the CMS node).
export interface ProjectGalleryItem {
  image: string | null;
  footNote: string;
  isMobileScreenshot: boolean;
}

export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  tagText?: string;
  description: string;
  image: string;
  gallery?: ProjectGalleryItem[];
  projectUrl?: string;
  challenges?: string[];
  solutions?: string[];
  results?: string[];
}

import { gql } from '@apollo/client';
import { mediaOriginalFields } from '@/utils/wp-media';

const LIST_MEDIA_FIELDS = `sourceUrl altText mediaDetails { sizes { sourceUrl width height name } }`;

export const GET_PROJECTS = gql`
  # Omitting both variables gives the EN list (WPML default language), as before (sitemap.xml relies on it).
  query GetProjects($language: String, $mediaOriginal: Boolean = false) {
    projects(first: 12, where: { language: $language }) {
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              sizes {
                sourceUrl
                width
                height
                name
              }
            }
            ${mediaOriginalFields(LIST_MEDIA_FIELDS)}
          }
        }
        projectsProjectData {
          projectData {
            projectSubtitle
            projectDescription
            projectUrl
            challenges {
              item
            }
            solutions {
              item
            }
            results {
              item
            }
          }
          images {
            image {
              node {
                sourceUrl
                altText
                mediaDetails {
                  sizes {
                    sourceUrl
                    width
                    height
                    name
                  }
                }
                ${mediaOriginalFields(LIST_MEDIA_FIELDS)}
              }
            }
            footNote
            ismobilescreenshot
          }
        }
      }
    }
  }
`;
