import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config, { dev }) => {
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