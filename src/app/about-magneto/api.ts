import { fetchWPGraphQL } from '@/utils/wp-graphql';

const ABOUT_PAGE_QUERY = `
  query GetAboutPageData {
    page(id: "about-magneto", idType: URI) {
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
        }
      }
      aboutData {
        sectionTitle
        description
        linkText
        linkUrl
        generalText
        calendlyText
        calendlyUrl
      }
    }
  }
`;

export async function getAboutPageData() {
  const data = await fetchWPGraphQL(ABOUT_PAGE_QUERY);
  //console.log('About page data:', data);
  return data?.page || {};
}
