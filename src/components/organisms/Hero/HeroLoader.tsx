import { Hero } from './index';
import { fetchWPGraphQL } from '@/utils/wp-graphql';


interface HeroLoaderProps {
  pageUri: string;
  variant?: 'default' | 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'project' | 'packages';
}

export default async function HeroLoader({ pageUri, variant = 'default' }: HeroLoaderProps) {
  let about = null;
  try {
    const data = await fetchWPGraphQL(`
      query GetHeroContent {
        pageBy(uri: "${pageUri}") {
          title
          heroContent {
            heroTitle
            subtitleHero
            ctaTextHero
            ctaLinkHero
            image {
              node {
                id
                sourceUrl
                mediaDetails {
                  width
                  height
                  sizes {
                    name
                    width
                    height
                    sourceUrl
                  }
                }
              }
            }
            backgroundImage {
              node {
                id
                sourceUrl
                mediaDetails {
                  width
                  height
                  sizes {
                    name
                    width
                    height
                    sourceUrl
                  }
                }
              }
            }
          }
        }
      }
    `);
    about = data.pageBy;
  } catch (e) {
    console.error('GraphQL fetch error:', e);
  }

  const hero = about?.heroContent;

  return (
    <Hero
      variant={variant}
      title={hero?.heroTitle || about?.title || "Magneto"}
      subtitle={hero?.subtitleHero || ""}
      cta={hero?.ctaTextHero && hero?.ctaLinkHero ? { text: hero.ctaTextHero, href: hero.ctaLinkHero } : undefined}
      // Only show the hero image on the home variant. Some pages provide a
      // CMS image but the design requires the visual only on the home page.
      showImage={variant === 'home' ? !!hero?.image?.node?.sourceUrl : false}
      image={
        variant === 'home' && hero?.image?.node?.sourceUrl
          ? { src: hero.image.node.sourceUrl, alt: about?.title || 'Hero Image' }
          : undefined
      }
      imageNode={variant === 'home' ? hero?.image?.node : undefined}
  backgroundImage={hero?.backgroundImage?.node?.sourceUrl || undefined}
    />
  );
}