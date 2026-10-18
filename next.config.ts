import type { NextConfig } from "next";

/* ──────────────────────────────────────────────────────────────────────
   Vercel-safe image config.
   Next.js 15 warns about wildcard `hostname: "**"` in `images.remotePatterns`
   because it lets the image optimiser fetch + re-encode arbitrary external
   URLs (SSRF + bandwidth amplification). On Vercel, the optimiser resolves
   server-side from the deployment region, so we lock the allowlist to the
   hosts the scraper actually serves posters from. Unknown hosts fall back
   to a plain `<img>` (we use this for the Player poster in PlayerLoader).
   ────────────────────────────────────────────────────────────────────── */
const POSTER_HOSTS = [
  "anizara.store",
  "cdn.anizara.store",
  "anipixcdn.co",
  "anilist.co",
  "cdn.anizone.tv",
  "asiancdn.com",
  "gogocdn.stream",
  "megaplay.cc",
  "asianload.cc",
  // The Ruby API serves every poster/backdrop from hianime.at's own storage.
  // Missing from the allowlist earlier → runtime "next-image-unconfigured-host"
  // exception on the home Spotlight slide 0 + any card using `<Image>`.
  "hianime.at",
  // Schedule detail-page posters sometimes resolve to MAL's CDN (the release
  // calendar enriches airing titles from their own pages, which occasionally
  // point at myanimelist artwork). Without this, those calendar cards throw
  // "next-image-unconfigured-host" and render broken.
  "myanimelist.net",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Gzip transport for HTML/JS/CSS responses. Vercel applies Brotli/gzip at
  // the edge already, but the flag is required for `next start` on other hosts
  // and makes the intent explicit.
  compress: true,
  // No source maps in production — pure build-output optimisation.
  productionBrowserSourceMaps: false,
  // Only ship the lucide icons that are actually used (it's imported across many
  // client components) and keep barrel imports cheap to compile. zustand's
  // barrel re-exports create/middleware, so tree-shaking the entry point also
  // helps on the watch page where the Player persists prefs. clsx/tw-merge
  // are re-exported via barrels in their entry points — same treatment.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "zustand",
      "clsx",
      "tailwind-merge",
    ],
  },
  images: {
    // Each allowlisted host gets BOTH an exact pattern and a `**.`-wildcard
    // subdomain pattern. The scraper's poster URLs use `cdn.anipixcdn.co`,
    // `cdn.anizara.store`, etc. and earlier exact-only matching threw
    // "next-image-unconfigured-host" at runtime for those. The wildcard is
    // bounded to the known CDN families below, so it stays SSRF-safe.
    remotePatterns: POSTER_HOSTS.flatMap((hostname) => [
      { protocol: "https", hostname },
      { protocol: "https", hostname: `**.${hostname}` },
    ]),
    // Prefer AVIF where the browser supports it; falls back to WebP, then the
    // source format. AVIF is ~30% smaller than WebP at equivalent visual quality.
    formats: ["image/avif", "image/webp"],
    // Posters change rarely and live at content-stable upstream URLs, so cache
    // optimised variants aggressively (31 days) — repeat visits and back/forward
    // navigations reuse the already-optimised AVIF/WebP from the optimizer cache
    // instead of paying for a re-fetch + re-encode of the same cover.
    minimumCacheTTL: 2678400,
    // Restrict the variant matrix so the optimizer's pre-compute cache stays
    // tight. A subset of the default ranges; the set still covers every
    // <Image sizes> used in the codebase.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 75 is next/image's built-in default quality: any <Image> that omits an
    // explicit `quality` prop requests `q=75`. With `qualities` configured, a
    // requested quality NOT in this list is rejected by the optimizer with a
    // 400 ("q parameter is not allowed") — which would silently break every
    // poster that doesn't set quality (the spotlight LCP, all cards, the rails,
    // Top 10, nav/footer logos, …). Keep 75 in the allowlist so those default
    // requests succeed, alongside the tuned values used by explicit-quality
    // images (50 detail hero, 85 detail poster info, 90 coverflow hero).
    qualities: [50, 70, 75, 80, 85, 90],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          // The player page embeds third-party HLS streams; pin frame ancestors
          // to ourselves even though /watch is noindex.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // CSP baseline (security headers only — deliberately no script-src
          // yet, since a strict one needs per-request nonces via middleware):
          //   frame-ancestors — clickjacking (doubles as modern X-Frame-Options)
          //   base-uri       — neutralises a hostile <base> hijacking relative
          //                    URLs (asset/redirect hijack)
          //   object-src     — blocks <object>/<embed> plugin injection
          //   form-action    — blocks form-post exfiltration to attacker origins
          //                    (the primary data-theft path if markup is ever
          //                    injected)
          { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'" },
          // Deny powerful features the app never uses (mic/camera/geolocation/
          // payment sensors) — limits the blast radius of any injected script.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), browsing-topics=()" },
          // HTTPS-only transport for one year. Browsers ignore this header
          // when it arrives over plain http (e.g. localhost dev), so it is
          // safe to declare unconditionally in next.config.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // CDN-side cache for the watch page HTML. The page itself stays
        // `force-dynamic` server-side (no stale rendering), but the response
        // can be reused at the edge for a short window — the typical
        // Lighthouse repeat-view case. 60s fresh + 5min SWR; same-URL repeat
        // visits serve from the edge cache with zero render work.
        source: "/watch/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
      {
        // Home page — the same edge-cache treatment as /watch, and the fix for
        // the "first response is slow" complaint. The route stays
        // `force-dynamic` server-side, so a flaky upstream never bakes a bad
        // page into a long-lived ISR entry (see app/page.tsx). But without this
        // header the response was `no-store`, so EVERY visitor paid a full
        // serverless render + both upstream fetches. Now the edge keeps the
        // rendered HTML for 60s and serves stale-while-revalidate for 5min, so
        // all but the first visitor after a window are served instantly with
        // zero render work, while the next request revalidates in the
        // background. `Vary` already includes `rsc`, so an RSC prefetch never
        // poisons the HTML cache entry (and vice versa).
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
