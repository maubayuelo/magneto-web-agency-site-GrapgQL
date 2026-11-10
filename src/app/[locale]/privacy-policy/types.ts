/** `PRIVACY_PAGE_QUERY` response: the `privacy-policy` page in the request language (post content, D-P1 A). */
export interface PrivacyPageResponse {
  pages?: {
    nodes?: Array<{ title?: string | null; content?: string | null } | null> | null;
  } | null;
}

/** What the route renders: the WP title as the only H1, and the rendered post content (sanitize before rendering). */
export interface PrivacyPageData {
  title: string;
  html: string;
}
