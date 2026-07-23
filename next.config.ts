import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['103.200.23.54', 'checkin.aizenworld.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'date-fns', 'lucide-react'],
    serverActions: {
      allowedOrigins: ['103.200.23.54', 'checkin.aizenworld.com'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/courses/:path*',
        destination: '/portal/courses/:path*',
      },
      {
        source: '/blogs/:path*',
        destination: '/portal/blogs/:path*',
      },
      {
        source: '/instructors/:path*',
        destination: '/portal/instructors/:path*',
      },
      {
        source: '/my-courses/:path*',
        destination: '/portal/my-courses/:path*',
      },
      {
        source: '/learning-path/:path*',
        destination: '/portal/learning-path/:path*',
      },
      {
        source: '/resources/:path*',
        destination: '/portal/resources/:path*',
      },
    ];
  },
};

export default nextConfig;
