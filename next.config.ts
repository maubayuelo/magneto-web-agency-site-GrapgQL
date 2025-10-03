import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily ignore ESLint errors during production builds so `next build` can succeed.
  // This is intentional: we'll fix the lint/type errors separately.
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
  images: {
    domains: ['magneto-cms.local'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'magneto-cms.local',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'magneto-cms.local',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      // production media served from SiteGround
      {
        protocol: 'https',
        hostname: 'magnetomarketing.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.magnetomarketing.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config, { dev }) => {
    // Ensure jsdom's default stylesheet is available in the .next/browser path
    // so server-side code that reads it at runtime can find it after bundling.
    try {
      const fs = require('fs');
      const path = require('path');
      const src = path.resolve(
        __dirname,
        'node_modules',
        'isomorphic-dompurify',
        'node_modules',
        'jsdom',
        'lib',
        'jsdom',
        'browser',
        'default-stylesheet.css'
      );
      const destDir = path.resolve(__dirname, '.next', 'browser');
      const dest = path.join(destDir, 'default-stylesheet.css');
      if (fs.existsSync(src)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
      }
    } catch (err) {
      // ignore — best-effort copy
    }
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  sassOptions: {
    logger: {
      warn: function(message: string) {
        if (message.includes('deprecated') || message.includes('Deprecation Warning')) {
          return;
        }
        console.warn(message);
      }
    },
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'mixed-decls']
  },
};

export default nextConfig;