import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ponytail: no CSP yet — Next inline scripts and KaTeX need nonces/hashes first.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
      ],
    }];
  },
  async rewrites() {
    const apiTarget = (process.env.VOII_API_PROXY_TARGET ?? "http://localhost:8000/api").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${apiTarget}/:path*` }];
  },
};

export default nextConfig;
