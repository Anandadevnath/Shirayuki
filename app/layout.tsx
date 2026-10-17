import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Geist_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { RootEffects } from "@/components/layout/RootEffects";

// ── Typography system ─────────────────────────────────────────────────────
// Three self-hosted Google faces, each with ONE job (no duplicates):
//
//   Inter      — primary UI + body: nav, buttons, metadata, descriptions,
//                episode lists, forms. Neutral, superb hinting, strong
//                tabular figures. 400–700 only (nothing in the UI is heavier
//                than bold once headings use Manrope).
//   Manrope    — display / headings: hero + page + section titles, card
//                titles, rank numerals. A geometric grotesque with subtly
//                warmer curves than Inter, so headings read as a distinct,
//                intentional tier against the Inter body.
//   Geist Mono — sparing technical accent: eyebrows (FEATURED, HOT RIGHT
//                NOW), timestamps, kbd, episode counters. Never body copy.
//   Zen Kaku   — CJK fallback inside the display stack so Japanese titles
//                (袖白雪) render with deliberate, elegant glyphs. Latin is
//                never requested from it (Manrope covers latin).
//
// `next/font` self-hosts + preloads only the weights declared here; the
// previous Inter load shipped 6 weights (400–900) for a UI whose heaviest
// text is bold. We now request exactly what the tokens use.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  // 500/700 cover all observed usage (medium/bold). Other weights fall back
  // to browser-synthesised bold via the `--font-zen` stack.
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
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} ${zen.variable}`}
      // suppressHydrationWarning: the inline reveal-arm script below writes
      // a `data-anim` attribute onto <html> before React hydrates; it is
      // presentation-only state (see globals.css → "Viewport reveals").
      suppressHydrationWarning
    >
      <head>
        {/* Arm scroll-reveals before first paint. When JS never runs, the
            attribute stays unset and `html[data-anim="1"] [data-reveal]` CSS
            never hides anything — content is statically visible. The
            <noscript> style below is the belt to this suspenders. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute("data-anim","1")`,
          }}
        />
        {PRECONNECT_HOSTS.map((href) => (
          <link key={href} rel="preconnect" href={href} crossOrigin="anonymous" />
        ))}
        {DNS_PREFETCH_HOSTS.map((href) => (
          <link key={href} rel="dns-prefetch" href={href} />
        ))}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh overflow-x-clip antialiased">
        <RootEffects />
        <Nav />
        {/* <main> is intentionally full-width and acts as the page size
            container (`container-type: inline-size`), so `cqw` units inside it
            resolve to the scrollbar-excluded layout width. A full-bleed child
            (the home hero) breaks out with `w-[100cqw]` +
            `left-[calc(50%-50cqw)]` instead of `w-screen`: 100vw includes the
            classic vertical scrollbar, which made the hero protrude past the
            right edge by the scrollbar width. `100cqw` never overshoots, so no
            root-level overflow clip is needed to contain it. The centred,
            max-width content column lives on the inner wrapper, preserving
            every route's content geometry exactly. */}
        <main className="page-shell page-container relative w-full">
          <div className="mx-auto w-full max-w-[1460px] px-4 pb-24 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
