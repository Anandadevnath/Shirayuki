"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Moon,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
// Eagerly import only the tiny prefetch helper; the full CommandPalette stays
// in a lazy chunk and no longer inflates the initial Nav bundle.
import { prefetchSearchIndex } from "@/lib/search";

// The search palette is only revealed on ⌘K / click, so keep it out of the
// initial JS bundle and mount it lazily the first time it's opened.
const CommandPalette = dynamic(
  () => import("@/components/search/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/az/all", label: "Browse" },
  { href: "/category/most-popular", label: "Trending" },
  { href: "/category/top-airing", label: "Airing" },
  { href: "/schedule", label: "Schedule" },
  { href: "/watchlist", label: "My List" },
];

const DIM_KEY = "shirayuki:dim";

/**
 * Top utility bar from the reference design: pill search field (opens the
 * ⌘K palette — the real search surface), notification bell → the release
 * schedule (the actual "new releases" data the site has), a moon toggle that
 * dims ambient page lights (real, persisted), and the profile avatar → My
 * List. At lg+ the left Sidebar owns navigation, so the bar holds only the
 * utility cluster + (mobile) the drawer toggle.
 */
export function Nav() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Latches true on first open so the lazy chunk mounts once, then stays.
  const [paletteMounted, setPaletteMounted] = useState(false);
  const [dim, setDim] = useState(false);
  // The header's "scrolled" state toggles `glass` (backdrop-filter blur).
  // We mutate a CSS variable directly on the header so the swap happens
  // without a React re-render on every scroll tick — the threshold is a
  // single boolean, but a scroll handler firing dozens of times per second
  // would otherwise cause the Nav subtree to re-render with it.
  const headerRef = useRef<HTMLElement>(null);
  // The search field is a button that opens the palette; the palette input
  // autofocuses itself, so no field ref is needed here.
  const searchRef = useRef<HTMLButtonElement>(null);

  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      // Single DOM write per scroll tick — no React reconciliation, no
      // subtree re-render. The CSS transition on the header still gives
      // the same 300ms color/glass cross-fade as before.
      el.dataset.scrolled = scrolled ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "Dim" mode: fewer ambient lights, calmer snowfall — persisted so the
  // choice survives reloads (theme-adjacent, honest: it changes the page's
  // lighting rather than faking an unlinked light theme).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DIM_KEY) === "1";
      setDim(stored);
      if (stored) document.documentElement.dataset.dim = "1";
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleDim = useCallback(() => {
    setDim((v) => {
      const next = !v;
      try {
        localStorage.setItem(DIM_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) document.documentElement.dataset.dim = "1";
      else delete document.documentElement.dataset.dim;
      return next;
    });
  }, []);

  // Pre-warm the local search index in the background so the first ⌘K
  // resolves instantly from a synchronous in-memory scan rather than waiting
  // on the network. The endpoint is server-cached so this is cheap.
  //
  // The fetch is deferred via `requestIdleCallback` (with a setTimeout
  // fallback) so it never competes with the LCP image fetch on the home /
  // detail / watch routes — the index bytes can arrive a few seconds later
  // and the user's first ⌘K still lands on a warm cache. We also skip the
  // prefetch entirely on `/watch/*`, where the user is focused on the
  // player and won't open the palette mid-session.
  useEffect(() => {
    if (pathname.startsWith("/watch/")) return;
    const ric = (cb: () => void, timeout: number) => {
      if (typeof (window as unknown as { requestIdleCallback?: (c: () => void, opts?: { timeout: number }) => number }).requestIdleCallback === "function") {
        (window as unknown as { requestIdleCallback: (c: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(cb, { timeout });
      } else {
        setTimeout(cb, timeout);
      }
    };
    ric(() => prefetchSearchIndex(), 1500);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  // Close the mobile menu whenever navigation lands on a new route — the
  // panel links push to a new pathname, so this doubles as "close on select".
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        /* `data-scrolled` is flipped from the scroll handler above — no React
           state, no per-scroll re-render. The two CSS rules in globals.css
           (`.nav-glass` baseline + `header[data-scrolled="1"]` enhancement)
           toggle the visual based on the dataset value. Both rules are
           unlayered so they always outrank Tailwind's `bg-*` utilities. */
        data-scrolled="0"
        className="nav-glass sticky top-0 z-40 w-full transition-[background-color,backdrop-filter,-webkit-backdrop-filter,border-color] duration-300"
      >
        <nav
          className="mx-auto flex h-16 w-full max-w-[1460px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8"
          aria-label="Utility"
        >
          {/* Brand — mobile/tablet only; the desktop sidebar owns the wordmark */}
          <Link
            href="/"
            className="group flex shrink-0 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:hidden"
            aria-label="Shirayuki — Home"
          >
            <span className="relative h-14 w-12 shrink-0 drop-shadow-[0_4px_16px_rgba(120,180,255,0.25)]">
              <Image
                src="/logos/shirayuki2.png"
                alt=""
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </span>
            <span className="relative -ml-2 hidden h-14 w-40 sm:inline-block">
              <Image
                src="/logos/text.png"
                alt="Shirayuki"
                fill
                sizes="200px"
                className="object-contain object-left"
              />
            </span>
          </Link>

          {/* ── Search pill — the reference's rounded field. It opens the real
              ⌘K palette (which owns the input, results, and keyboard model).
              The emoji-free placeholder comes straight from the reference. ── */}
          <button
            ref={searchRef}
            onClick={openPalette}
            /* Fluid width: flex-1 + min-w-0 lets the pill shrink on tight
               viewports instead of pushing the right cluster past the edge;
               below 480px it collapses to an icon circle (compact header). */
            className="group flex h-10 min-w-0 max-w-[440px] flex-1 items-center gap-2.5 rounded-full border border-line/80 bg-[#0A1930]/70 px-2 text-left backdrop-blur-md transition-[border-color,box-shadow] duration-200 hover:border-frost/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost max-[479px]:w-10 max-[479px]:flex-none max-[479px]:justify-center"
            aria-label="Search anime, genres, characters…"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-snow/90 transition-colors group-hover:bg-frost/25 group-hover:text-frost">
              <Search className="size-4" strokeWidth={1.8} />
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-sm text-faint/90 min-[480px]:block">
              Search anime, genres, characters…
            </span>
            <kbd className="mr-1 hidden shrink-0 rounded border border-line bg-base/60 px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
              Ctrl K
            </kbd>
          </button>

          {/* Available space in this flex row is used by the search pill via
              `mx-auto`; right cluster hugs the end. */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Bell → the release calendar, i.e. the site's actual new-releases
                surface. Kept as a link rather than a fake notification panel. */}
            <Link
              href="/schedule"
              aria-label="New releases schedule"
              className="nav-cta-glass hidden size-9 place-items-center rounded-full p-2 text-faint transition-[border-color,color] duration-200 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid"
            >
              <Bell className="size-[18px]" strokeWidth={1.7} />
            </Link>

            {/* Moon → dims ambient lights + drift elements (persisted). */}
            <button
              onClick={toggleDim}
              aria-pressed={dim}
              aria-label={dim ? "Restore ambient lighting" : "Dim ambient lighting"}
              className={cn(
                "nav-cta-glass hidden size-9 place-items-center rounded-full p-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:grid",
                dim ? "text-frost" : "text-faint hover:text-frost",
              )}
            >
              <Moon className="size-[18px]" strokeWidth={1.7} />
            </button>

            {/* Profile → My List. The mark is the site's own Shirayuki girl
                logo — the same circular avatar the reference shows. */}
            <Link
              href="/watchlist"
              aria-label="My List"
              title="My List"
              className="hidden items-center gap-1 rounded-full p-0.5 pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost sm:flex"
            >
              <span className="relative block size-8 overflow-hidden rounded-full ring-1 ring-frost/35 transition-shadow hover:ring-frost/70">
                <Image
                  src="/logos/shirayuki2.png"
                  alt=""
                  fill
                  sizes="32px"
                  className="scale-125 object-cover object-[50%_18%]"
                />
              </span>
              <ChevronDown className="size-3.5 text-faint" aria-hidden />
            </Link>

            {/* Mobile-only menu toggle — below lg the sidebar is hidden, so
                this drawer is the only way to reach the nav destinations. */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="nav-cta-glass group flex items-center rounded-sm border border-line/70 p-2 text-faint transition-[border-color,color,background-color,backdrop-filter] duration-200 ease-out hover:border-frost/50 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="size-5 transition-colors duration-200 group-hover:text-frost" />
              ) : (
                <Menu className="size-5 transition-colors duration-200 group-hover:text-frost" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile navigation drawer. Kept mounted and animated with the
            `grid-template-rows: 0fr → 1fr` technique: the row animates
            smoothly between collapsed and auto height with no max-height
            guessing, so the drawer glides open/closed at any content size.
            Links stagger in with 40ms delay steps on open; on close they fade
            immediately (delay 0) so the drawer never feels laggy. `pointer-
            events-none` when closed so it never traps taps. Hidden entirely
            at lg+ where the left sidebar owns navigation. */}
        <div
          id="mobile-nav"
          data-open={menuOpen ? "1" : "0"}
          /* Fades at rest too: the collapsed 0fr row still paints the inner
             glass panel's 2px of border, which would read as a stray
             hairline under the header when closed. */
          className="grid border-line/60 opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden data-[open=0]:grid-rows-[0fr] data-[open=1]:grid-rows-[1fr] data-[open=1]:border-t data-[open=1]:opacity-100"
          aria-hidden={!menuOpen}
        >
          <div className="glass overflow-hidden" style={{ pointerEvents: menuOpen ? undefined : "none" }}>
            <ul className="mx-auto flex w-full max-w-[1460px] flex-col gap-1 px-4 py-3 sm:px-6">
              {LINKS.map((l, i) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      tabIndex={menuOpen ? undefined : -1}
                      style={{ transitionDelay: menuOpen ? `${80 + i * 40}ms` : "0ms" }}
                      className={cn(
                        "block translate-y-1 rounded-sm px-3 py-2.5 text-sm font-medium opacity-0 transition-[opacity,translate,background-color,color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
                        menuOpen && "translate-y-0 opacity-100",
                        active
                          ? "bg-frost-soft text-frost"
                          : "text-muted hover:bg-surface-2/70 hover:text-snow",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </header>

      {paletteMounted && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}
