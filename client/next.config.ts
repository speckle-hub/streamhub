import withPWA from '@ducanh2912/next-pwa';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
};

export default (withPWA(pwaConfig) as any)(nextConfig);
