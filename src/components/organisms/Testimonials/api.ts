import { fetchWPGraphQL } from "@/lib/wp-graphql";

const ABOUT_SECTION_QUERY = `
  query GetHomeTestimonials {
  homeTestimonials {
    testimonials {
      author
      testimonial
      thumb {
        sourceUrl
        altText
      }
    }
  }
}
`;

export async function GetHomeTestimonials() {
  const data = await fetchWPGraphQL(ABOUT_SECTION_QUERY);
  //console.log("Fetched data:", data); // Debug line
  return data?.page?.homeAboutSection || {};
}