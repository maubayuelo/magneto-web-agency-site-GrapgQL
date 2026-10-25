import { fetchWPGraphQL } from "@/utils/wp-graphql";
import type { Locale } from "@/i18n/config";
import { wpLocaleVars } from "@/i18n/wp";

const ABOUT_SECTION_QUERY = `
  query GetHomeAboutSection($language: String) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      homeAboutSection {
        aboutSectionTitle
        description
      }
      }
    }
  }
`;

export async function getHomeAboutSection(locale: Locale) {
  const data = await fetchWPGraphQL(ABOUT_SECTION_QUERY, wpLocaleVars(locale));
  //console.log("Fetched data:", data); // Debug line
  return data?.pages?.nodes?.[0]?.homeAboutSection || {};
}
