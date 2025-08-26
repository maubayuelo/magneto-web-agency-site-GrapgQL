import { Hero } from './index';
import { fetchWPGraphQL } from '../../../lib/wp-graphql';

interface HeroLoaderProps {
  pageUri: string;
  variant?: string;
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
            subtitle
            ctaText
            ctaLink
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
      variant={variant}
      title={hero?.heroTitle || about?.title || "Magneto"}
      subtitle={hero?.subtitle || ""}
      cta={hero?.ctaText && hero?.ctaLink ? { text: hero.ctaText, href: hero.ctaLink } : undefined}
      showImage={!!hero?.image?.node?.sourceUrl}
      image={
        hero?.image?.node?.sourceUrl
          ? { src: hero.image.node.sourceUrl, alt: about?.title || "Hero Image" }
          : undefined
      }
      backgroundImage={hero?.backgroundImage?.node?.sourceUrl || undefined}
      calendlyModal={hero?.ctaLink === "https://calendly.com/mauriciobayuelo/free-discovery-call"}
    />
  );
}