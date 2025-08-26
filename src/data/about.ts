import { fetchWPGraphQL } from '@/lib/wp-graphql';

export const GET_ABOUT_TEXTS = `
  query GetAboutTexts {
    aboutTexts {
      sectionTitle
      description
      linkText
      linkUrl
      generalText
      calendlyText
      calendly_url
    }
  }
`;

export async function getAboutTexts() {
  const data = await fetchWPGraphQL(GET_ABOUT_TEXTS);
  return data?.aboutTexts;
}