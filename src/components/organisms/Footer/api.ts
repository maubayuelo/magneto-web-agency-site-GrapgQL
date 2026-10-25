import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { Locale } from '@/i18n/config';
import { wpLocaleVars } from '@/i18n/wp';
import { mediaOriginalFields, resolveMediaWrapper } from '@/utils/wp-media';
import type { FooterResponse, FooterSocialIcon } from './types';

export const HOME_FOOTER_QUERY = `
  query HomeFooter($language: String, $mediaOriginal: Boolean!) {
    pages(first: 1, where: { language: $language, name: "home" }) {
      nodes {
      homeFooter {
        footerLine1
        footerSocialIcons {
          iconSvg {
            node {
              sourceUrl
              ${mediaOriginalFields('sourceUrl')}
            }
          }
          iconUrl
        }
        footerLine2
      }
      }
    }
  }
`;

export async function getHomeFooter(locale: Locale): Promise<FooterResponse> {
  const data = await fetchWPGraphQL(HOME_FOOTER_QUERY, wpLocaleVars(locale));
  //console.log('Full GraphQL response:', data);
  const page = data?.pages?.nodes?.[0];
  if (!page) {
    console.error(`No page data found. Check if the "home" page exists in "${locale}" and has the ACF group.`);
  }
  const footer = (page?.homeFooter as FooterResponse) || {};
  if (!footer.footerSocialIcons) return footer;
  return {
    ...footer,
    footerSocialIcons: footer.footerSocialIcons.map((icon: FooterSocialIcon) => ({
      ...icon,
      iconSvg: resolveMediaWrapper(icon.iconSvg) as FooterSocialIcon['iconSvg'],
    })),
  };
}
