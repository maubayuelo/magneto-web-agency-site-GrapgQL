import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';

const HOME_TESTIMONIALS_QUERY = `
  query GetHomeTestimonials($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      homeTestimonialsSection {
        testimonials {
          author
          testimonial
          thumb {
            node {
              sourceUrl
              altText
              ${mediaOriginalFields('sourceUrl altText')}
            }
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

export async function getHomeTestimonials(locale: Locale): Promise<Testimonial[]> {
  const data = await fetchWPGraphQL(HOME_TESTIMONIALS_QUERY, wpLocaleVars(locale));
  const testimonials: Testimonial[] = data?.pages?.nodes?.[0]?.homeTestimonialsSection?.testimonials || [];
  return testimonials.map((t) => ({ ...t, thumb: resolveMediaWrapper(t.thumb) as TestimonialThumb | null }));
}