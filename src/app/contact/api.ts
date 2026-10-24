import { fetchWPGraphQL } from '@/utils/wp-graphql';

const CONTACT_PAGE_QUERY = `
  query GetContactPageData {
    page(id: "contact", idType: URI) {
      contactContactTexts {
        mainCopy
        tagText
        bodytext
      }
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
    }
  }
`;

export async function getContactPageData() {
  const data = await fetchWPGraphQL(CONTACT_PAGE_QUERY);
  const contact = data?.page?.contactContactTexts;
  const featuredImage = data?.page?.featuredImage?.node;
  return {
    mainCopy: contact?.mainCopy || "",
    tagText: contact?.tagText || "",
    bodytext: contact?.bodytext || "",
    featuredImage: featuredImage
      ? {
          sourceUrl: featuredImage.sourceUrl || "",
          altText: featuredImage.altText || "",
          // include mediaDetails.sizes so downstream image helpers can pick
          // the most appropriate variant (width/height) instead of falling
          // back to a loose/default measurement which can produce tiny
          // variants during SSR.
          mediaDetails: {
            sizes: (featuredImage.mediaDetails?.sizes || []).map((s: any) => ({
              sourceUrl: s.sourceUrl,
              width: s.width,
              height: s.height,
              name: s.name,
            })),
          },
        }
      : null,
  };
}