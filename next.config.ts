import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Only ship the lucide icons that are actually used (it's imported across many
  // client components) and keep barrel imports cheap to compile.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // AnimeX posters come from many rotating CDN hosts (anizara.store,
    // anipixcdn.co, anilist.co, …) that can't be exhaustively allow-listed, so
    // we let Next's own optimiser fetch + resize + re-encode any host. The
    // wildcard is required for the rotating hosts; the optimiser caches results
    // and serves WebP sized to each card (~95% smaller than the source).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Posters change rarely; cache optimised variants for a day to avoid
    // re-encoding the same URL on every request.
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
