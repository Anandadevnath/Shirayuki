"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clapperboard,
  Compass,
  Eye,
  Ghost,
  Heart,
  Home,
  Laugh,
  LayoutGrid,
  ListVideo,
  Rocket,
  Snowflake,
  Sparkles,
  Swords,
  Trophy,
  Coffee,
  Tv,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The fixed left rail from the reference design ("A Winter Anime Portal"):
 * brand mark, primary navigation with an active pill, the genre list, and a
 * quiet winter scene with the site's motto sealed in crimson.
 *
 * Hidden below `lg` (the top bar + drawer own small screens) and on
 * /watch/*, where the player needs the full width — same gating the
 * ambient backdrop already uses.
 */

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/az/all", label: "Browse", icon: LayoutGrid },
  { href: "/category/most-popular", label: "Trending", icon: TrendingUp },
  { href: "/category/top-airing", label: "Airing", icon: Tv },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/watchlist", label: "My List", icon: ListVideo },
] as const;

/** The twelve genres from the reference, with the slug convention
 * /genre/[id] already accepts. Static site chrome — real listings still
 * come from the API. */
const GENRES = [
  { slug: "action", name: "Action", icon: Swords },
  { slug: "adventure", name: "Adventure", icon: Compass },
  { slug: "comedy", name: "Comedy", icon: Laugh },
  { slug: "drama", name: "Drama", icon: Clapperboard },
  { slug: "fantasy", name: "Fantasy", icon: Sparkles },
  { slug: "horror", name: "Horror", icon: Ghost },
  { slug: "mystery", name: "Mystery", icon: Eye },
  { slug: "romance", name: "Romance", icon: Heart },
  { slug: "sci-fi", name: "Sci-Fi", icon: Rocket },
  { slug: "slice-of-life", name: "Slice of Life", icon: Coffee },
  { slug: "sports", name: "Sports", icon: Trophy },
  { slug: "supernatural", name: "Supernatural", icon: Ghost },
] as const;

export function Sidebar() {
  const pathname = usePathname() || "/";
  // The player owns the full viewport. Same gate RootEffects uses.
  if (pathname.startsWith("/watch/")) return null;

  const isHome = pathname === "/";
  const navActive = (href: string) =>
    href === "/" ? isHome : pathname.startsWith(href);

  return (
    <aside
      data-sidebar
      className="fixed inset-y-0 left-0 z-40 hidden w-[225px] flex-col overflow-hidden border-r border-line/60 bg-[#040B18]/95 lg:flex"
    >
      {/* Ambient wash so the rail reads slightly deeper than the page.
          Intentionally NOT translucent over page content — the reference
          keeps the sidebar an opaque column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 0% 0%, rgba(18,36,62,0.55), transparent 60%), radial-gradient(100% 50% at 0% 100%, rgba(10,24,44,0.8), transparent 65%)",
        }}
      />

      {/* ── Brand ── */}
      <Link
        href="/"
        className="relative mt-6 flex items-center gap-2.5 px-6 py-2"
        aria-label="Shirayuki — home"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-frost/30 bg-frost/10 text-frost shadow-[var(--shadow-frost)]">
          <Snowflake className="size-5" strokeWidth={1.6} />
        </span>
        <span className="min-w-0">
          <span className="font-display block truncate text-[21px] font-semibold leading-none tracking-wide text-snow">
            Shirayuki
          </span>
          <span className="mt-1 block font-mono text-[10px] tracking-[0.35em] text-muted/80">
            白雪
          </span>
        </span>
      </Link>

      {/* ── Primary navigation ── */}
      <nav className="relative mt-4 px-3" aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = navActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
                    active
                      ? "bg-frost-soft text-snow ring-1 ring-frost/25"
                      : "text-muted hover:text-snow",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active ? "text-frost" : "text-faint group-hover:text-frost/80",
                    )}
                    strokeWidth={1.7}
                  />
                  {label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-frost"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Genres ── */}
      <div className="relative mt-5 flex items-center gap-2 px-6">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-faint">
          Genres
        </span>
        <span aria-hidden className="h-px flex-1 bg-line/70" />
      </div>
      <nav
        aria-label="Genres"
        className="no-scrollbar relative mt-2 flex-1 overflow-y-auto px-3 pb-2"
      >
        <ul className="flex flex-col">
          {GENRES.map(({ slug, name, icon: Icon }) => {
            const active = pathname === `/genre/${slug}`;
            return (
              <li key={slug}>
                <Link
                  href={`/genre/${slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3.5 py-[7px] text-[13.5px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
                    active ? "text-frost" : "text-muted/90 hover:text-snow",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active ? "text-frost" : "text-faint/80 group-hover:text-frost/70",
                    )}
                    strokeWidth={1.6}
                  />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Winter scene + motto (decorative, anchored to the rail bottom) ── */}
      <div aria-hidden className="relative h-36 shrink-0">
        <WinterScene />
        <p className="font-display absolute inset-x-0 bottom-9 px-4 text-center text-[14.5px] italic leading-snug text-snow/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">
          Even in the coldest winter, the purest snow finds its way.
        </p>
        <span className="absolute bottom-2.5 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-[3px] bg-crimson font-mono text-[11px] font-bold text-snow/95 shadow-[0_2px_10px_rgba(159,48,74,0.6)]">
          雪
        </span>
      </div>
    </aside>
  );
}

/**
 * Pure-CSS winter landscape for the rail bottom: layered mountain
 * silhouettes, a pale winter sky, drifting-dot snow, and a tiny torii-gate
 * accent. No image payload, honours reduced motion (dots simply don't drift).
 */
function WinterScene() {
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_28%)]">
      {/* sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #0A1626 45%, #122440 100%)",
        }}
      />
      {/* far mountains */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 opacity-70"
        style={{
          background: "#13233C",
          clipPath:
            "polygon(0 62%, 9% 40%, 20% 58%, 32% 34%, 46% 60%, 58% 42%, 72% 64%, 85% 44%, 100% 66%, 100% 100%, 0 100%)",
        }}
      />
      {/* near ridge */}
      <div
        className="absolute inset-x-0 bottom-0 h-14"
        style={{
          background: "#0C1830",
          clipPath:
            "polygon(0 70%, 14% 48%, 30% 72%, 47% 50%, 63% 74%, 80% 52%, 100% 76%, 100% 100%, 0 100%)",
        }}
      />
      {/* snow caps */}
      <div
        aria-hidden
        className="absolute bottom-1.5 left-6 size-1 rounded-full bg-snow/70"
      />
      <div
        aria-hidden
        className="absolute bottom-7 left-1/2 size-1 rounded-full bg-snow/50"
      />
      <div
        aria-hidden
        className="absolute bottom-4 right-8 size-1.5 rounded-full bg-snow/60"
      />
      {/* torii accent — two posts + lintel, tinted crimson */}
      <div aria-hidden className="absolute bottom-8 right-10 h-9 w-8">
        <span className="absolute inset-x-0 top-0 h-1 rounded-[1px] bg-crimson/80" />
        <span className="absolute left-0 top-1 h-full w-[3px] rounded-[1px] bg-crimson/70" />
        <span className="absolute right-0 top-1 h-full w-[3px] rounded-[1px] bg-crimson/70" />
      </div>
      <DogwoodDots />
    </div>
  );
}

/** Four slow-drifting snow points; pure transform loops. */
function DogwoodDots() {
  return (
    <div aria-hidden className="absolute inset-0">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute size-[3px] rounded-full bg-snow/60"
          style={{
            left: `${12 + i * 24}%`,
            top: `${20 + (i % 2) * 26}%`,
            animation: `hero-petal-drift ${9 + i * 3}s linear ${i * 1.7}s infinite`,
            opacity: 0.55,
          }}
        />
      ))}
    </div>
  );
}
