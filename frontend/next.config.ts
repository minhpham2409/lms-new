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
};

export default nextConfig;
