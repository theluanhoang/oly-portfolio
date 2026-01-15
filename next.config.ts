import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:path': 'path',
        'node:process': 'process',
        'node:url': 'url',
      };
    } else {
      // Exclude sharp and related native modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        child_process: false,
      };
      
      // Exclude sharp from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        sharp: 'commonjs sharp',
        'detect-libc': 'commonjs detect-libc',
      });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'sharp'],
  },
};

export default withNextIntl(nextConfig);
