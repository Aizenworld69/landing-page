import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['103.200.23.54', 'checkin.aizenworld.com'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['103.200.23.54', 'checkin.aizenworld.com'],
    },
  },
};

export default nextConfig;
