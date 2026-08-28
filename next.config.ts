import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiTarget = (process.env.VOII_API_PROXY_TARGET ?? "http://localhost:8000/api").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${apiTarget}/:path*` }];
  },
};

export default nextConfig;
