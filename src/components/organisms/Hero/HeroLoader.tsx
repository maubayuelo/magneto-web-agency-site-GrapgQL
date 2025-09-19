import { Hero } from './index';
import { fetchWPGraphQL } from '../../../utils/wp-graphql';


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
                sourceUrl
              }
            }
            backgroundImage {
              node {
                sourceUrl
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
      variant={variant as any}
      title={hero?.heroTitle || about?.title || "Magneto"}
      subtitle={hero?.subtitleHero || ""}
      cta={hero?.ctaTextHero && hero?.ctaLinkHero ? { text: hero.ctaTextHero, href: hero.ctaLinkHero } : undefined}
      showImage={!!hero?.image?.node?.sourceUrl}
      image={
        hero?.image?.node?.sourceUrl
          ? { src: hero.image.node.sourceUrl, alt: about?.title || "Hero Image" }
          : undefined
      }
  backgroundImage={hero?.backgroundImage?.node?.sourceUrl || undefined}
    />
  );
}