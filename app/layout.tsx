import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SnowLayerIsland } from "@/components/layout/SnowLayerIsland";
import { Ambient } from "@/components/layout/Ambient";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  // 500/700 cover all observed usage (medium/bold). Other weights fall back
  // to browser-synthesised bold via the `--font-zen` stack. Adding 900 saves
  // a woff2 file (~12KB) since no element uses `font-black`.
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sode no Shirayuki — Anime, in pure focus",
    template: "%s · Shirayuki",
  },
  description:
    "A premium anime streaming experience with the cold elegance of fresh snow. Browse, discover, and watch with skip-intro, continue-watching, and a player that just works.",
  applicationName: "Sode no Shirayuki",
  openGraph: {
    title: "Sode no Shirayuki",
    description: "Anime, in pure focus.",
    type: "website",
  },
};

/**
 * Warm up TLS to the most common image CDN hosts before the HTML parses
 * posters, so the first <Image> request skips DNS + TCP + TLS round-trips.
 * The hosts are the dominant ones returned by the upstream API (anizara
 * for posters, anipixcdn for banners). DNS-prefetch covers the long tail
 * of rotating hosts the API may pick for individual titles.
 *
 * Note: posters are served from `cdn.anizara.store` (the *cdn.* subdomain)
 * even though the upstream homepage and bulk-cover API live on the bare
 * `anizara.store` host. Both are preconnect'd so the LCP image fetch skips
 * the TLS handshake — the handshake is the biggest single LCP cost on a
 * cold connection (~150-300ms), and the page only needs one of these.
 */
const PRECONNECT_HOSTS = [
  "https://anizara.store",
  "https://cdn.anizara.store",
  "https://anipixcdn.co",
];
const DNS_PREFETCH_HOSTS = [
  "https://cdn.anizone.tv",
  "https://asiancdn.com",
];

export const viewport: Viewport = {
  themeColor: "#0E1116",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${zen.variable}`}>
      <head>
        {PRECONNECT_HOSTS.map((href) => (
          <link key={href} rel="preconnect" href={href} crossOrigin="anonymous" />
        ))}
        {DNS_PREFETCH_HOSTS.map((href) => (
          <link key={href} rel="dns-prefetch" href={href} />
        ))}
      </head>
      <body className="min-h-dvh overflow-x-clip antialiased">
        <Ambient />
        <SnowLayerIsland />
        <Nav />
        <main className="relative mx-auto w-full max-w-[1460px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
