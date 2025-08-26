export interface ProjectData {
  id: number;
  slug: string;
  title: string;
  tagText?: string;
  description: string;
  image: string;
  gallery?: string[];
  client?: string;
  category?: string;
  year?: string;
  duration?: string;
  technologies?: string[];
  challenges?: string[];
  solutions?: string[];
  results?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects(first: 12) {
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        projectsProjectData {
          projectData {
            projectSubtitle
            projectDescription
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
              }
            }
            footNote
          }
        }
      }
    }
  }
`;
