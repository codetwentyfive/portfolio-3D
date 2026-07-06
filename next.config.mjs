import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://w.soundcloud.com https://*.sndcdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' blob: https://*.soundcloud.com https://*.sndcdn.com https://www.gstatic.com https://static.cloudflareinsights.com https://cloudflareinsights.com; frame-src 'self' https://w.soundcloud.com https://*.soundcloud.com; media-src 'self' https://*.soundcloud.com https://*.sndcdn.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/3d/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(llms|llms-full).txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old hash-anchor shortcuts; the browser carries the fragment through
      // the locale redirect that next-intl's middleware adds afterwards.
      { source: "/impressum", destination: "/rechtliches#impressum", permanent: true },
      { source: "/datenschutz", destination: "/rechtliches#datenschutz", permanent: true },
      { source: "/:locale(de|en)/impressum", destination: "/:locale/rechtliches#impressum", permanent: true },
      { source: "/:locale(de|en)/datenschutz", destination: "/:locale/rechtliches#datenschutz", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
