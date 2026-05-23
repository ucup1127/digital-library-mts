import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  compress: true,
  // 🔥 NONAKTIFKAN TYPE CHECKING SEMENTARA
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;