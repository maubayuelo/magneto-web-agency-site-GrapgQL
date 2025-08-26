import { fetchWPGraphQL } from "@/lib/wp-graphql";

const ABOUT_SECTION_QUERY = `
  query GetHomeAboutSection {
    page(id: "home", idType: URI) {
      homeAboutSection {
        sectiontitle
        description
      }
    }
  }
`;

export async function getHomeAboutSection() {
  const data = await fetchWPGraphQL(ABOUT_SECTION_QUERY);
  //console.log("Fetched data:", data); // Debug line
  return data?.page?.homeAboutSection || {};
}