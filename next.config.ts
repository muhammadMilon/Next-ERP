import type { NextConfig } from "next";

/**
 * Zero-config on Vercel: importing this repo deploys as-is, with no
 * environment variables and no build settings to fill in.
 */
const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,

  // Trailing slashes off so /purchase/... stays canonical.
  trailingSlash: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // The brand artwork never changes — let the CDN hold on to it.
        source: "/:file(company-logo\.png|company-mark\.png|og\.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
