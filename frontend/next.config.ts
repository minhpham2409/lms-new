import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Type errors in legacy files are tracked separately — don't block builds.
    // Run `next lint` separately to review them.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors must still be fixed — not ignored here.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
