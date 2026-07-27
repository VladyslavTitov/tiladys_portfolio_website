import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const control =
  process.env.NEXT_PUBLIC_CONTROL_API_URL ?? "http://localhost:3001";

const contentSecurityPolicy = [
  "default-src 'self'",
  `img-src 'self' data: blob: https: ${control}`,
  "style-src 'self' 'unsafe-inline'",

  isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",

  `connect-src 'self' ${control}`,
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action 'self' ${control}`,
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;