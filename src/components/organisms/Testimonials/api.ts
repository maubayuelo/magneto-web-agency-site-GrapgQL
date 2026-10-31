import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper, type WpMediaNode } from '@/utils/wp-media';

const HOME_TESTIMONIALS_QUERY = `
  query GetHomeTestimonials($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      homeTestimonialsSection {
        testimonials {
          author
          testimonial
          role
          company
          city
          note
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

export interface TestimonialThumb {
  node: {
    sourceUrl: string;
    altText: string;
  };
}

/** One testimonial row as the frontend uses it: only rows with a role survive (ADR 0006, decision 6). */
export interface Testimonial {
  author: string;
  testimonial: string;
  role: string;
  company: string | null;
  city: string | null;
  note: string | null;
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

interface TestimonialRow {
  author?: string | null;
  testimonial?: string | null;
  role?: string | null;
  company?: string | null;
  city?: string | null;
  note?: string | null;
  thumb?: { node?: (TestimonialThumb['node'] & WpMediaNode) | null } | null;
}

interface HomeTestimonialsResponse {
  pages?: { nodes?: Array<{ homeTestimonialsSection?: { testimonials?: TestimonialRow[] | null } | null } | null> | null } | null;
}

const text = (value: string | null | undefined): string => (typeof value === 'string' ? value.trim() : '');
const optional = (value: string | null | undefined): string | null => text(value) || null;

/**
 * Testimonials of the locale's home page. Rows without a `role` are dropped, so the 4 placeholder rows
 * (no role field before Phase 5) can never render, even against production data before release day.
 */
export async function getHomeTestimonials(locale: Locale): Promise<Testimonial[]> {
  const data: HomeTestimonialsResponse | undefined = await fetchWPGraphQL(HOME_TESTIMONIALS_QUERY, wpLocaleVars(locale));
  const rows = data?.pages?.nodes?.[0]?.homeTestimonialsSection?.testimonials ?? [];
  return rows
    .filter((row) => text(row?.role) !== '')
    .map((row) => ({
      author: text(row.author),
      testimonial: text(row.testimonial),
      role: text(row.role),
      company: optional(row.company),
      city: optional(row.city),
      note: optional(row.note),
      thumb: (resolveMediaWrapper(row.thumb) as TestimonialThumb | null | undefined) ?? null,
    }));
}
