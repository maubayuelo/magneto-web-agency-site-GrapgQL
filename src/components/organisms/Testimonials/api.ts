import { fetchWPGraphQL } from '@/utils/wp-graphql';

const HOME_TESTIMONIALS_QUERY = `
  query GetHomeTestimonials {
    page(id: "home", idType: URI) {
      homeTestimonialsSection {
        testimonials {
          author
          testimonial
          thumb {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

// Define interfaces for the structure of your data
export interface TestimonialThumb {
  node: {
    sourceUrl: string;
    altText: string;
  };
}

export interface Testimonial {
  author: string;
  testimonial: string;
  thumb: TestimonialThumb | null;
}

export interface HomeTestimonialsSection {
  testimonials: Testimonial[];
}

export interface HomeTestimonialsQueryResult {
  page: {
    homeTestimonialsSection: HomeTestimonialsSection;
  };
}

export async function getHomeTestimonials() {
  const data = await fetchWPGraphQL(HOME_TESTIMONIALS_QUERY);
  
  return data?.page?.homeTestimonialsSection?.testimonials || [];
}