// Root layout (fonts, global styles, SEO defaults)
// src/app/layout.tsx

import '../main.scss'; // Import global styles at the root
import type { Metadata } from 'next';
import { Header, FinalCTASection, LeadMagnetSection, Footer } from '../components/organisms';
import { SITE_URL, siteName, defaultOgImage, buildCanonical } from '@/utils/seo';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { GET_SITE_METADATA } from '@/data/site';



const FALLBACK_TITLE = 'Magneto Marketing - Web Solo Agency Portfolio and Services';
const FALLBACK_DESCRIPTION = 'A creative digital agency showcasing work and services.';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await fetchWPGraphQL(GET_SITE_METADATA);
    const settings = data?.generalSettings || {};
    const siteTitle = settings.title || FALLBACK_TITLE;
    const siteDescription = settings.description || FALLBACK_DESCRIPTION;
    const siteUrl = settings.url || SITE_URL;

    return {
      metadataBase: new URL(siteUrl),
      title: siteTitle,
      description: siteDescription,
      applicationName: siteName,
      icons: {
        icon: [
          { url: '/assets/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
          { url: '/assets/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { url: '/assets/favicon/favicon.ico', sizes: 'any' }
        ],
        apple: [
          { url: '/assets/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ],
        other: [
          {
            rel: 'manifest',
            url: '/assets/favicon/site.webmanifest',
          }
        ]
      },
      openGraph: {
        title: siteTitle,
        description: siteDescription,
        url: buildCanonical('/'),
        siteName: siteName,
        images: [defaultOgImage],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: siteDescription,
        images: [defaultOgImage],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        }
      }
    };
  } catch (e) {
    console.error('Failed to fetch site metadata, using fallback', e);
    return {
      metadataBase: new URL(SITE_URL),
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        url: SITE_URL,
        siteName: siteName,
        images: [defaultOgImage],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        images: [defaultOgImage],
      },
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      {...({ 'data-lt-installed': 'true', 'suppresshydrationwarning': 'true', suppressHydrationWarning: true } as any)}
    >
      <body>
        <Header
          className="header"
          logo="/assets/images/logo-magneto.svg"
        />
        {children}
        <LeadMagnetSection/>
        <FinalCTASection/>
        <Footer />
      </body>
    </html>
  );
}
