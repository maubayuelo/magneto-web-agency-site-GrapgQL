import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // Ensure fast refresh is enabled
    forceSwcTransforms: false,
  },
  // Enable webpack polling for better file watching
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Suppress SASS deprecation warnings that slow down compilation
  sassOptions: {
    logger: {
      warn: function(message: string) {
        // Suppress deprecation warnings to improve performance
        if (message.includes('deprecated') || message.includes('Deprecation Warning')) {
          return;
        }
        console.warn(message);
      }
    },
    quietDeps: true, // Suppress warnings from dependencies
    silenceDeprecations: ['import', 'global-builtin', 'mixed-decls'] // Silence specific deprecations
  },
};

export default nextConfig;
