"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
// `prefetchSearchIndex` is a tiny, side-effect-free function — imported
// eagerly so the Nav can warm the local search index on mount. The palette
// component itself stays in the lazy chunk.
import { prefetchSearchIndex } from "@/components/search/CommandPalette";

// The search palette is only revealed on ⌘K / click, so keep it out of the
// initial JS bundle and mount it lazily the first time it's opened.
const CommandPalette = dynamic(
  () => import("@/components/search/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/category/most-popular", label: "Popular" },
  { href: "/category/top-airing", label: "Airing" },
  { href: "/schedule", label: "Schedule" },
  { href: "/az/all", label: "Browse" },
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Latches true on first open so the lazy chunk mounts once, then stays.
  const [paletteMounted, setPaletteMounted] = useState(false);

  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pre-warm the local search index in the background so the first ⌘K
  // resolves instantly from a synchronous in-memory scan rather than waiting
  // on the network. The endpoint is server-cached so this is cheap.
  useEffect(() => {
    prefetchSearchIndex();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-colors duration-300",
          scrolled ? "glass" : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex h-16 w-full max-w-[1460px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="Shirayuki — Home">
            <span className="relative h-16 w-14 shrink-0 drop-shadow-[0_4px_16px_rgba(120,180,255,0.25)]">
              <Image
                src="/logos/shirayuki2.png"
                alt=""
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </span>
            <span className="relative -ml-3 hidden h-16 w-44 sm:inline-block">
              <Image
                src="/logos/text.png"
                alt="Shirayuki"
                fill
                sizes="240px"
                className="object-contain object-left"
                priority
              />
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-snow" : "text-muted hover:text-snow",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            onClick={openPalette}
            className="group ml-auto flex items-center gap-2 rounded-sm border border-line bg-surface/60 px-3 py-2 text-sm text-faint transition-colors hover:border-frost/40 hover:text-muted"
            aria-label="Search anime (⌘K)"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Search anime…</span>
            <kbd className="ml-2 hidden rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px] text-faint lg:inline">
              ⌘K
            </kbd>
          </button>
        </nav>
      </header>

      {paletteMounted && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}