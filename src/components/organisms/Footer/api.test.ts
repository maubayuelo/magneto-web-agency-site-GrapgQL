/// <reference types="vitest" />
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { getHomeFooter } from './api';

vi.mock('@/utils/wp-graphql', () => ({
  fetchWPGraphQL: vi.fn(),
}));

const ICON = 'http://magneto-cms-2.local/wp-content/uploads/2025/09/ico-social-linkedin.svg';

describe('getHomeFooter', () => {
  beforeEach(() => vi.mocked(fetchWPGraphQL).mockReset());

  it('fr: locale variables; maps the recorded node (icon from the EN original, helper fields stripped)', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({
      pages: {
        nodes: [
          {
            homeFooter: {
              footerLine1: 'Follows and Updates in',
              footerLine2: 'Based in Montreal | Serving clients worldwide',
              footerSocialIcons: [
                {
                  iconUrl: 'https://www.linkedin.com/in/maubayuelo/',
                  iconSvg: { node: { sourceUrl: ICON, databaseId: 333, languageCode: 'fr', translations: [{ languageCode: 'en', sourceUrl: ICON }, { languageCode: 'es', sourceUrl: ICON }] } },
                },
              ],
            },
          },
        ],
      },
    });
    await expect(getHomeFooter('fr')).resolves.toEqual({
      footerLine1: 'Follows and Updates in',
      footerLine2: 'Based in Montreal | Serving clients worldwide',
      footerSocialIcons: [{ iconUrl: 'https://www.linkedin.com/in/maubayuelo/', iconSvg: { node: { sourceUrl: ICON } } }],
    });
    const [query, variables] = vi.mocked(fetchWPGraphQL).mock.calls[0];
    expect(query).toContain('pages(first: 1, where: { language: $language, name: "home" })');
    expect(variables).toEqual({ language: 'fr', mediaOriginal: true });
  });

  it('en variables; {} when the locale has no home page (layout section renders its empty output)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({ pages: { nodes: [] } });
    await expect(getHomeFooter('en')).resolves.toEqual({});
    expect(vi.mocked(fetchWPGraphQL).mock.calls[0][1]).toEqual({ language: 'en', mediaOriginal: false });
    spy.mockRestore();
  });
});
