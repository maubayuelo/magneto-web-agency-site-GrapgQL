/** One `packagesContentSections.sections` row after mapping: body HTML is already sanitized by the server mapper. */
export interface PackagesContentSection {
  heading: string;
  bodyHtml: string | null;
}

export interface PackagesContentSectionsProps {
  sections: PackagesContentSection[];
}
