"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CommandPalette } from "@/components/search/CommandPalette";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-colors duration-300",
          scrolled ? "glass" : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-[10px] bg-frost-soft text-frost">
              <Snowflake className="size-5" strokeWidth={2.2} />
            </span>
            <span className="hidden sm:inline">Shirayuki</span>
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
            onClick={() => setPaletteOpen(true)}
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

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
