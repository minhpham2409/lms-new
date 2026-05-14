import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint rules are properly configured in eslint.config.mjs.
    // Errors will fail builds; warnings are allowed.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type errors must still be fixed — not ignored here.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      }
    ],
  },
};

export default nextConfig;
