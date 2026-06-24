"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Latches true on first open so the lazy chunk mounts once, then stays.
  const [paletteMounted, setPaletteMounted] = useState(false);
  // The header's "scrolled" state toggles `glass` (backdrop-filter blur).
  // We mutate a CSS variable directly on the header so the swap happens
  // without a React re-render on every scroll tick — the threshold is a
  // single boolean, but a scroll handler firing dozens of times per second
  // would otherwise cause the Nav subtree to re-render with it.
  const headerRef = useRef<HTMLElement>(null);

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
           unlayered so they always outrank Tailwind's `bg-*` utilities that
           ship inside `@layer utilities` — the previous `bg-transparent`
           utility was the source of the deploy-only blur regression. */
        data-scrolled="0"
        className="nav-glass sticky top-0 z-40 w-full transition-[background-color,backdrop-filter,-webkit-backdrop-filter,border-color] duration-300"
      >
        <nav className="mx-auto flex h-16 w-full max-w-[1460px] items-center gap-2 px-4 sm:px-6 lg:px-8" aria-label="Primary">
          <Link
            href="/"
            className="group flex items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            aria-label="Shirayuki — Home"
          >
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
                /* The text logo is a non-critical chrome asset: deferring it
                   keeps the LCP image's preload slot free, so the spot­light
                   poster starts downloading a frame earlier. The image still
                   paints once it lands — just after the hero. */
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
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
                      "nav-link-glow",
                      active
                        ? "text-snow"
                        : "text-muted hover:text-snow",
                    )}
                  >
                    {l.label}
                    {/* Active frost underline — draws in via transform-origin
                        so the animation is GPU-only (no layout). Sits inside
                        the link's flex flow so it scales with the parent. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-2 -bottom-0.5 h-px origin-left bg-gradient-to-r from-frost via-frost-deep to-frost transition-transform duration-300 ease-out",
                        active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            onClick={openPalette}
            className="nav-cta-glass group ml-auto flex items-center gap-2 rounded-sm border border-line/70 px-3 py-2 text-sm text-faint transition-[border-color,color,background-color,backdrop-filter] duration-200 ease-out hover:border-frost/50 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            aria-label="Search anime"
            // A7 fix: expose the keyboard shortcut as a structured attribute
            // so screen readers can announce it consistently.
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Search className="size-4 transition-colors duration-200 group-hover:text-frost" />
            <span className="hidden lg:inline">Search anime…</span>
            <kbd className="ml-2 hidden rounded border border-line bg-base px-1.5 py-0.5 font-mono text-[10px] text-faint lg:inline">
              ⌘K
            </kbd>
          </button>

          {/* Mobile-only menu toggle — the primary links are hidden below md,
              so this is the only way to reach Popular / Airing / Schedule /
              Browse on a phone. */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="nav-cta-glass group flex items-center rounded-sm border border-line/70 p-2 text-faint transition-[border-color,color,background-color,backdrop-filter] duration-200 ease-out hover:border-frost/50 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            /* No `aria-controls` — the drawer is a sibling that's `md:hidden`
               (not in the layout tree above the breakpoint), so referencing
               it from a button that's visible at every breakpoint creates a
               dangling ARIA relationship on md+ viewports. The drawer keeps
               its `id="mobile-nav"` for in-page anchor targeting. */
          >
            {menuOpen ? (
              <X className="size-5 transition-colors duration-200 group-hover:text-frost" />
            ) : (
              <Menu className="size-5 transition-colors duration-200 group-hover:text-frost" />
            )}
          </button>
        </nav>

        {/* Mobile navigation drawer. Kept mounted so open/close cross-fades
            via CSS rather than a remount; `pointer-events-none` when closed so
            it never traps taps. Hidden entirely at md+ where the inline links
            return. */}
        <div
          id="mobile-nav"
          data-open={menuOpen ? "1" : "0"}
          className="glass overflow-hidden border-line/60 transition-[max-height,opacity] duration-300 ease-out data-[open=0]:max-h-0 data-[open=0]:opacity-0 data-[open=1]:max-h-96 data-[open=1]:border-t data-[open=1]:opacity-100 md:hidden"
          aria-hidden={!menuOpen}
        >
          <ul className="mx-auto flex w-full max-w-[1460px] flex-col gap-1 px-4 py-3 sm:px-6">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    tabIndex={menuOpen ? undefined : -1}
                    className={cn(
                      "block rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
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
      </header>

      {paletteMounted && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}