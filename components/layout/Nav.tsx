"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
// Eagerly import only the tiny prefetch helper; the full CommandPalette stays
// in a lazy chunk and no longer inflates the initial Nav bundle.
import { prefetchSearchIndex } from "@/lib/search";
import { NAVBAR_ITEMS, isActive } from "@/lib/nav/config";
import { NavDrawer } from "@/components/layout/NavDrawer";

// The search palette is only revealed on ⌘K / click, so keep it out of the
// initial JS bundle and mount it lazily the first time it's opened.
const CommandPalette = dynamic(
  () => import("@/components/search/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

// Matches the Tailwind `md` breakpoint the horizontal rail is bound to
// (`hidden md:flex`). Kept as a literal so the JS `railVisible` state and the
// CSS class can never disagree.
const RAIL_QUERY = "(min-width: 768px)";

export function Nav() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Latches true on first open so the lazy chunk mounts once, then stays.
  const [paletteMounted, setPaletteMounted] = useState(false);
  // True once the viewport is wide enough for the horizontal rail. Drives the
  // drawer's destination set so a rail link is never also shown in the drawer
  // while the rail is on screen. SSR-safe: false on the server / first paint,
  // corrected in an effect — matching the rail's own CSS default (hidden).
  const [railVisible, setRailVisible] = useState(false);
  // The header's "scrolled" state toggles `glass` (backdrop-filter blur).
  // We mutate a CSS variable directly on the header so the swap happens
  // without a React re-render on every scroll tick.
  const headerRef = useRef<HTMLElement>(null);
  // Focus target for the drawer — restored when the drawer closes.
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);

  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      el.dataset.scrolled = window.scrollY > 8 ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the rail breakpoint so the drawer knows whether its "Navigate" group
  // would duplicate a visible navbar link.
  useEffect(() => {
    const mq = window.matchMedia(RAIL_QUERY);
    const sync = () => setRailVisible(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Pre-warm the local search index in the background so the first ⌘K
  // resolves instantly from a synchronous in-memory scan rather than waiting
  // on the network. Deferred via requestIdleCallback (setTimeout fallback) so
  // it never competes with the LCP image fetch; skipped on /watch/*.
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  // Close the drawer whenever navigation lands on a new route — the drawer
  // links push a new pathname, so this doubles as "close on select".
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        /* `data-scrolled` is flipped from the scroll handler above — no React
           state, no per-scroll re-render. The two unlayered CSS rules in
           globals.css (`.nav-glass` baseline + `header[data-scrolled="1"]`)
           toggle the visual from the dataset value and always outrank
           Tailwind's layered `bg-*` utilities. */
        data-scrolled="0"
        className="nav-glass sticky top-0 z-40 w-full transition-[background-color,backdrop-filter,-webkit-backdrop-filter,border-color] duration-300"
      >
        <nav
          className="mx-auto flex h-16 w-full max-w-[1460px] items-center gap-1.5 px-4 sm:px-6 lg:gap-3 lg:px-8"
          aria-label="Primary"
        >
          {/* ── Left: brand ── */}
          <Link
            href="/"
            className="group flex shrink-0 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            aria-label="Shirayuki — Home"
          >
            <span className="relative h-16 w-14 shrink-0">
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
              />
            </span>
          </Link>

          {/* ── Center: primary rail (wide viewports) ── */}
          <ul className="ml-1 hidden items-center gap-0.5 md:flex lg:ml-3">
            {NAVBAR_ITEMS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.id}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-meta nav-link-glow relative inline-flex items-center rounded-sm px-2.5 py-2 transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:px-3",
                      active ? "text-snow" : "text-muted hover:text-snow",
                    )}
                  >
                    {l.label}
                    {/* Active frost underline — GPU-only transform draw-in. */}
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

          {/* ── Right: search + always-visible hamburger ── */}
          <div className="ml-auto flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={openPalette}
              className="nav-cta-glass group text-meta flex items-center gap-2 rounded-sm border border-line/70 px-2.5 py-2 text-faint transition-[border-color,color,background-color,backdrop-filter] duration-200 ease-out hover:border-frost/50 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:px-3"
              aria-label="Search anime"
              aria-keyshortcuts="Meta+K Control+K"
            >
              <Search className="size-4 transition-colors duration-200 group-hover:text-frost" />
              <span className="hidden xl:inline">Search anime…</span>
              <kbd className="ml-2 hidden rounded border border-line bg-base px-1.5 py-0.5 font-accent text-[10px] text-faint xl:inline">
                ⌘K
              </kbd>
            </button>

            {/* Hamburger — ALWAYS visible at every breakpoint (desktop, tablet,
                mobile). It opens the drawer, which supplies secondary
                categories, utilities and legal destinations (and, on narrow
                viewports, the rail destinations the rail cannot fit). */}
            <button
              ref={drawerTriggerRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="nav-cta-glass group flex items-center rounded-sm border border-line/70 p-2 text-faint transition-[border-color,color,background-color,backdrop-filter] duration-200 ease-out hover:border-frost/50 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-controls="site-nav-drawer"
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          </div>
        </nav>
      </header>

      <NavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        railVisible={railVisible}
        triggerRef={drawerTriggerRef}
      />

      {paletteMounted && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}

/**
 * Three-line hamburger that morphs into an X when the drawer is open. Two
 * spans rotate, the middle bar fades/shrinks — a `transform`+`opacity`-only
 * animation (compositor friendly, no layout). The 40px hit area is the button
 * padding; the icon itself stays a crisp 20px. Reduced-motion is handled by
 * the global CSS catch-all since this rides `transition-*`, not Motion.
 */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative block size-5">
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-[transform,opacity] duration-300 ease-out",
          open ? "rotate-45" : "-translate-y-[6px]",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-[transform,opacity] duration-200 ease-out",
          open ? "scale-x-0 opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-[transform,opacity] duration-300 ease-out",
          open ? "-rotate-45" : "translate-y-[6px]",
        )}
      />
    </span>
  );
}
