import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Clock,
  Compass,
  Clapperboard,
  Film,
  Home,
  Info,
  LayoutGrid,
  ListOrdered,
  MonitorPlay,
  Layers,
  ShieldCheck,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";

/**
 * ── Navigation — single source of truth ───────────────────────────────────
 *
 * One typed configuration drives BOTH the horizontal desktop navbar and the
 * slide-in drawer, so the two surfaces can never drift into two route lists.
 *
 * The rule the brief cares about is *simultaneously visible duplication*:
 * a destination may only be on screen once at a time. We model that with an
 * explicit per-item `surfaces` set:
 *
 *   navbar  — rendered in the horizontal rail (wide viewports, ≥ md).
 *   drawer  — rendered in the slide-in drawer always.
 *   reach   — rendered in the drawer ONLY when the navbar rail is hidden
 *             (i.e. narrow viewports, < md). This is how the desktop-only
 *             rail destinations (Category, Schedule, Browse A–Z, Home) stay
 *             reachable on a phone without ever being duplicated next to the
 *             visible rail.
 *
 * `visibleDrawerGroups(railVisible)` resolves `reach` against the live
 * breakpoint, and `assertNavUniqueness()` proves the invariant for BOTH
 * responsive presentations at module load — the dev-time duplicate check.
 */

export type NavSurface = "navbar" | "drawer" | "reach";

export type NavItem = {
  /** Stable identifier — React key, never rendered. */
  id: string;
  label: string;
  /** Internal route. Every entry points at a route that exists. */
  href: string;
  icon: LucideIcon;
  /** Short description shown only in the drawer. */
  hint?: string;
  /** Where this item is allowed to render (see NavSurface). */
  surfaces: NavSurface[];
};

export type NavGroup = {
  id: string;
  /** Group heading in the drawer. */
  label: string;
  items: NavItem[];
};

/* ── Allocation ─────────────────────────────────────────────────────────────
 *
 * Navbar rail (wide viewports):      Home · Category · Schedule · Browse A–Z
 * Drawer "Reach" group (< md only):  the same four, so phones keep them
 * Drawer (all viewports):            Categories · Library · Info
 *
 * "Category" is the single entry point for every browse collection; the page's
 * own Status control switches collections in place, so Popular/Airing are no
 * longer separate rail destinations. The drawer's "reach" group is spread into
 * the drawer only when the rail is hidden, so at md+ the drawer never repeats a
 * navbar link. See `visibleDrawerGroups()`.
 * ------------------------------------------------------------------------- */

/** Wide-viewport navbar rail. `reach` keeps them reachable when the rail is hidden. */
export const NAVBAR_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: Home, surfaces: ["navbar", "reach"] },
  { id: "category", label: "Category", href: "/category", icon: LayoutGrid, surfaces: ["navbar", "reach"] },
  { id: "schedule", label: "Schedule", href: "/schedule", icon: CalendarClock, surfaces: ["navbar", "reach"] },
  { id: "browse", label: "Browse A–Z", href: "/az/all", icon: Compass, surfaces: ["navbar", "reach"] },
];

/**
 * Drawer groups. The first group ("Reach") is the responsive home for the
 * navbar rail items on narrow viewports; the rest are complementary
 * destinations that are never in the rail.
 */
export const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: "Navigate",
    /** Populated from the navbar rail at render time (see visibleDrawerGroups). */
    items: [],
  },
  {
    id: "categories",
    label: "Browse by category",
    items: [
      { id: "movies", label: "Movies", href: "/category/movie", icon: Film, surfaces: ["drawer"] },
      { id: "tv", label: "TV Series", href: "/category/tv", icon: Tv, surfaces: ["drawer"] },
      { id: "subbed", label: "Subbed Anime", href: "/category/subbed-anime", icon: MonitorPlay, surfaces: ["drawer"] },
      { id: "dubbed", label: "Dubbed Anime", href: "/category/dubbed-anime", icon: Layers, surfaces: ["drawer"] },
      { id: "new", label: "New Releases", href: "/category/new-anime", icon: Clock, surfaces: ["drawer"] },
      { id: "completed", label: "Completed", href: "/category/latest-completed", icon: ListOrdered, surfaces: ["drawer"] },
      { id: "favorites", label: "Top Favorites", href: "/category/most-favorite", icon: Star, surfaces: ["drawer"] },
      { id: "ova", label: "OVA", href: "/category/ova", icon: Clapperboard, surfaces: ["drawer"] },
      { id: "ona", label: "ONA", href: "/category/ona", icon: Clapperboard, surfaces: ["drawer"] },
      { id: "special", label: "Specials", href: "/category/special", icon: Sparkles, surfaces: ["drawer"] },
    ],
  },
  {
    id: "utilities",
    label: "Library",
    items: [
      { id: "watchlist", label: "My Watchlist", href: "/watchlist", icon: ListOrdered, surfaces: ["drawer"], hint: "Continue watching" },
      { id: "genres", label: "Genres", href: "/genre/action", icon: LayoutGrid, surfaces: ["drawer"], hint: "Browse by genre" },
    ],
  },
  {
    id: "info",
    label: "About",
    items: [
      { id: "terms", label: "Terms of Service", href: "/terms", icon: Info, surfaces: ["drawer"] },
      { id: "privacy", label: "Privacy Policy", href: "/privacy", icon: ShieldCheck, surfaces: ["drawer"] },
      { id: "dmca", label: "DMCA", href: "/dmca", icon: Info, surfaces: ["drawer"] },
    ],
  },
];

/** Every configured item across surfaces (config validation / consumers). */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAVBAR_ITEMS,
  ...DRAWER_GROUPS.flatMap((g) => g.items),
];

/**
 * Resolve the drawer groups to render for the current presentation.
 *
 * @param railVisible true when the horizontal navbar rail is on screen
 *        (wide viewport). When true, the "Navigate" group — whose items are
 *        the rail destinations — is dropped so the drawer never duplicates a
 *        visible navbar link. When false (narrow viewport) the rail is hidden
 *        and the drawer supplies those destinations under "Navigate".
 */
export function visibleDrawerGroups(railVisible: boolean): NavGroup[] {
  return DRAWER_GROUPS.map((group) => {
    if (group.id !== "main") return group;
    return railVisible ? { ...group, items: [] } : { ...group, items: NAVBAR_ITEMS };
  }).filter((group) => group.items.length > 0);
}

/**
 * Normalise an internal path for duplicate comparison: drop query/hash,
 * collapse trailing slashes, lowercase. `/az/all/` and `/az/all` collide;
 * `/search?q=x` and `/search` collide.
 */
export function normalizePath(href: string): string {
  const path = href.split(/[?#]/, 1)[0] ?? "";
  const trimmed = path.replace(/\/+$/, "");
  return (trimmed === "" ? "/" : trimmed).toLowerCase();
}

/**
 * Dev-time invariant: for EACH responsive presentation (rail visible, and
 * rail hidden) no path may appear twice across the currently-visible navbar +
 * drawer. Throws at module load so an accidental duplicate fails fast in
 * `next dev`, `next build`, and the test/typecheck gates.
 */
export function assertNavUniqueness(
  navbar: NavItem[] = NAVBAR_ITEMS,
): void {
  const occurrences = (items: NavItem[]) => {
    const seen = new Map<string, string>();
    for (const item of items) {
      const key = normalizePath(item.href);
      const prior = seen.get(key);
      if (prior) {
        throw new Error(
          `Nav duplicate: "${item.id}" and "${prior}" both resolve to ${key}.`,
        );
      }
      seen.set(key, item.id);
    }
    return seen;
  };

  // Presentation A — wide viewport: navbar rail + drawer (rail-visible set).
  const rail = occurrences(navbar.filter((i) => i.surfaces.includes("navbar")));
  for (const g of visibleDrawerGroups(true)) {
    for (const item of g.items) {
      const key = normalizePath(item.href);
      const clash = rail.get(key);
      if (clash) {
        throw new Error(
          `Nav duplicate (wide): drawer "${item.id}" duplicates navbar "${clash}" at ${key}.`,
        );
      }
    }
  }

  // Presentation B — narrow viewport: navbar rail hidden, drawer shows reach.
  for (const g of visibleDrawerGroups(false)) {
    occurrences(g.items);
  }
}

assertNavUniqueness();

/**
 * Is `href` the active route for `pathname`? Exact match for the homepage;
 * prefix match otherwise so nested routes (e.g. `/category/top-airing` while
 * on `/category/top-airing?page=2`) stay active. Query strings are ignored.
 */
export function isActive(pathname: string, href: string): boolean {
  const target = normalizePath(href);
  const current = normalizePath(pathname);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}
