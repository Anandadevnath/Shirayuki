import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SnowLayer } from "@/components/layout/SnowLayer";
import { Ambient } from "@/components/layout/Ambient";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
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

export const viewport: Viewport = {
  themeColor: "#0E1116",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${zen.variable}`}>
      <body className="min-h-dvh overflow-x-clip antialiased">
        <Ambient />
        <SnowLayer />
        <Nav />
        <main className="relative mx-auto w-full max-w-[1460px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
