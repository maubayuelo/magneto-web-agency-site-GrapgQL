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
        descriptionHtml
      }
      }
    }
  }
`;

export interface HomeAboutSectionData {
  aboutSectionTitle?: string | null;
  /** Legacy `text` field (rendered as HTML by the current component). */
  description?: string | null;
  /** New `wysiwyg` field (ADR 0006); null when empty. */
  descriptionHtml?: string | null;
  /**
   * What the section body shows: `descriptionHtml`, else the legacy `description` (ADR 0006 expand/contract).
   * Empty string when both are empty. Must be sanitized before `dangerouslySetInnerHTML`.
   */
  bodyHtml?: string;
}

interface HomeAboutSectionResponse {
  pages?: { nodes?: Array<{ homeAboutSection?: HomeAboutSectionData | null } | null> | null } | null;
}

const nonEmpty = (value: string | null | undefined): value is string => typeof value === "string" && value.trim() !== "";

export async function getHomeAboutSection(locale: Locale): Promise<HomeAboutSectionData> {
  const data: HomeAboutSectionResponse | undefined = await fetchWPGraphQL(ABOUT_SECTION_QUERY, wpLocaleVars(locale));
  const section = data?.pages?.nodes?.[0]?.homeAboutSection;
  if (!section) return {};
  const descriptionHtml = nonEmpty(section.descriptionHtml) ? section.descriptionHtml : null;
  return {
    ...section,
    descriptionHtml,
    bodyHtml: descriptionHtml ?? (nonEmpty(section.description) ? section.description : ""),
  };
}
