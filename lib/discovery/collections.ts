import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Clock,
  Flame,
  ListOrdered,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
} from "lucide-react";

/**
 * ── Collections — the Status dropdown's single source of truth ─────────────
 *
 * The unified `/category/most-popular` page presents one browse COLLECTION at a
 * time; the Status control switches which. Every option here is backed by a
 * real upstream surface — nothing is fabricated, and Popular / Trending / Top
 * Airing are distinctly mapped (they are NOT interchangeable):
 *
 *   · `browse`  → the upstream `/browse/{id}` listing endpoint (paginated).
 *   · `home`    → a bucket only present in the home payload (Trending, Latest
 *                 Episodes); served to the client through `/api/collection`.
 *
 * Ids and buckets were verified against the live API — see the module tests.
 * `az-list` (the full library) is intentionally NOT a status: Browse A–Z owns
 * that surface, and keeping the two control surfaces independent is a brief
 * requirement.
 */

export type CollectionSource = "browse" | "home";

export interface CollectionDef {
  /** Stable id (React key / dropdown value). */
  id: string;
  /** Menu label. */
  label: string;
  /** Where the listing comes from. */
  source: CollectionSource;
  /** For `browse`: the upstream category id. For `home`: the bucket key. */
  key: string;
  /** Page-header eyebrow (uppercased by the header). */
  eyebrow: string;
  /** Page-header title. */
  title: string;
  /** Page-header lede. */
  lede: string;
  icon: LucideIcon;
}

/**
 * Ordered exactly as the Status menu renders. "All Anime" is the resting
 * option (the page's canonical collection) so it never appears as an active
 * deviation.
 */
export const COLLECTIONS: CollectionDef[] = [
  {
    id: "all",
    label: "All Anime",
    source: "browse",
    key: "most-popular",
    eyebrow: "DISCOVER SHIRAYUKI",
    title: "Most Popular Anime",
    lede: "Discover fan favorites, all-time classics, and the anime everyone is talking about.",
    icon: Flame,
  },
  {
    id: "popular",
    label: "Popular",
    source: "browse",
    key: "most-popular",
    eyebrow: "DISCOVER SHIRAYUKI",
    title: "Most Popular Anime",
    lede: "Discover fan favorites, all-time classics, and the anime everyone is talking about.",
    icon: Flame,
  },
  {
    id: "airing",
    label: "Airing",
    source: "browse",
    key: "top-airing",
    eyebrow: "THIS SEASON",
    title: "Currently Airing Anime",
    lede: "Follow ongoing series, discover seasonal standouts, and find your next weekly watch.",
    icon: Sparkles,
  },
  {
    id: "top-airing",
    label: "Top Airing",
    source: "home",
    key: "Top Airing",
    eyebrow: "TOP THIS SEASON",
    title: "Top Airing Anime",
    lede: "The highest-ranked series airing right now.",
    icon: TrendingUp,
  },
  {
    id: "trending",
    label: "Trending",
    source: "home",
    key: "trending",
    eyebrow: "WHAT'S HOT",
    title: "Trending Now",
    lede: "The titles gaining the most momentum across the community right now.",
    icon: TrendingUp,
  },
  {
    id: "most-favorite",
    label: "Most Favorite",
    source: "browse",
    key: "most-favorite",
    eyebrow: "FAN FAVORITES",
    title: "Most Favorited Anime",
    lede: "The titles the community keeps coming back to.",
    icon: Star,
  },
  {
    id: "recently-added",
    label: "Recently Added",
    source: "browse",
    key: "new-anime",
    eyebrow: "FRESH RELEASES",
    title: "Recently Added",
    lede: "The latest additions to the catalogue, newest first.",
    icon: Clock,
  },
  {
    id: "recently-updated",
    label: "Recently Updated",
    source: "browse",
    key: "recently-updated",
    eyebrow: "JUST UPDATED",
    title: "Recently Updated",
    lede: "Series that just gained new episodes.",
    icon: RefreshCw,
  },
  {
    id: "upcoming",
    label: "Upcoming",
    source: "browse",
    key: "top-upcoming",
    eyebrow: "COMING SOON",
    title: "Upcoming Anime",
    lede: "Announced and upcoming series worth marking on your calendar.",
    icon: CalendarClock,
  },
  {
    id: "completed",
    label: "Completed",
    source: "browse",
    key: "latest-completed",
    eyebrow: "FINISHED SERIES",
    title: "Latest Completed",
    lede: "Series that have wrapped — binge the full story without waiting for new episodes.",
    icon: ListOrdered,
  },
  {
    id: "latest-episodes",
    label: "Latest Episodes",
    source: "home",
    key: "Latest Episode",
    eyebrow: "NEW EPISODES",
    title: "Latest Episodes",
    lede: "The most recently released episodes across the catalogue.",
    icon: Tv,
  },
];

/** The page's canonical / resting collection id. */
export const DEFAULT_COLLECTION_ID = "all";

const BY_ID = new Map(COLLECTIONS.map((c) => [c.id, c]));
/** First collection whose browse id matches — used to seed the control when the
 *  page is opened directly at `/category/<id>`. */
const BY_BROWSE_KEY = new Map<string, CollectionDef>();
for (const c of COLLECTIONS) {
  if (c.source === "browse" && !BY_BROWSE_KEY.has(c.key)) BY_BROWSE_KEY.set(c.key, c);
}

export function collectionById(id: string): CollectionDef | undefined {
  return BY_ID.get(id);
}

export function defaultCollection(): CollectionDef {
  return BY_ID.get(DEFAULT_COLLECTION_ID) as CollectionDef;
}

/** Resolve the collection a `/category/<slug>` route represents, if any. */
export function collectionForBrowseKey(slug: string): CollectionDef | undefined {
  return BY_BROWSE_KEY.get(slug);
}

/** Home-backed buckets the client fetches through `/api/collection`. */
export const HOME_COLLECTION_KEYS = new Set(
  COLLECTIONS.filter((c) => c.source === "home").map((c) => c.key),
);

/** The home-payload field holding a home-backed collection's cards. Keeping the
 *  switch here (single source) means the page and `/api/collection` can never
 *  disagree about which bucket a key maps to. */
export function homeBucket(
  home: { trending: unknown[]; topAiring: unknown[]; latestEpisodes: unknown[] },
  key: string,
): unknown[] {
  switch (key) {
    case "trending":
      return home.trending;
    case "Top Airing":
      return home.topAiring;
    case "Latest Episode":
      return home.latestEpisodes;
    default:
      return [];
  }
}

/** The canonical `/category/<browse-slug>` the default collections live at
 *  (the navbar "Category" destination). */
export const CANONICAL_CATEGORY_PATH = `/category/${defaultCollection().key}`;

/**
 * The shareable URL a collection corresponds to. Browse-backed collections map
 * to their own `/category/<key>` route (refreshable, server-rendered); the
 * home-backed ones keep the canonical path and carry a `?collection=<id>` param
 * (the page seeds the board from it). Returns a path (no origin).
 */
export function collectionPath(id: string): string {
  const def = BY_ID.get(id);
  if (!def || def.id === DEFAULT_COLLECTION_ID) return CANONICAL_CATEGORY_PATH;
  if (def.source === "browse") return `/category/${def.key}`;
  return `${CANONICAL_CATEGORY_PATH}?collection=${encodeURIComponent(def.id)}`;
}
