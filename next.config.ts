import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Builds the Nest rewrite target from NEXT_PUBLIC_API_URL. */
function apiRewriteDestination() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const base = raw.replace(/\/$/, "");
  const withApi = base.endsWith("/api") ? base : `${base}/api`;
  return `${withApi}/:path*`;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.36"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  /** Forwards same-origin /api calls to the invitation API. */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: apiRewriteDestination(),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
