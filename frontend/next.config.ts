import type { NextConfig } from "next";

// the Python backend (python -m smartdialx.main serve); override with SMARTDIALX_API
const backend = process.env.SMARTDIALX_API ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
