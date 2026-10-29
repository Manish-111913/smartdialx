import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // each screen runs its prototype script once on mount; strict mode would run it twice in dev
  reactStrictMode: false,
};

export default nextConfig;
