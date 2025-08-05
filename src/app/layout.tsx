// Root layout (fonts, global styles, SEO defaults)
// src/app/layout.tsx

import '../main.scss'; // Import global styles at the root
import type { Metadata } from 'next';
import { Header, ConditionalPreFooter, Footer } from '../components/organisms';



export const metadata: Metadata = {
  title: 'Magneto Marketing - Web Solo Agency Portfolio and Services',
  description: 'A creative digital agency showcasing work and services.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="m-0">
        <Header
          className="header"
          logo="/assets/images/logo-magneto.svg"
        />
        {children}
        <ConditionalPreFooter />
        <Footer />
      </body>
    </html>
  );
}
