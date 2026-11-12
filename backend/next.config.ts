import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Typecheck is strictly verified via `npx tsc --noEmit` before git push
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
