import { fetchWPGraphQL } from '@/utils/wp-graphql';

const GET_PROJECTS_PAGE_QUERY = `
  query GetProjectsPageData {
    page(id: "projects", idType: URI) {
    pageintrotext {
      pageIntroText
    }
    }
  }
`;

export async function getProjectsPageData() {
  const data = await fetchWPGraphQL(GET_PROJECTS_PAGE_QUERY);
  return {
    introText: data?.page?.pageintrotext?.pageIntroText || "",
  };
}