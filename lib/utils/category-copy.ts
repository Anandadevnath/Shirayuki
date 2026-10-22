import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Clock,
  Flame,
  Layers,
  ListOrdered,
  MonitorPlay,
  Sparkles,
  Star,
  Tv,
  Film,
} from "lucide-react";
import { titleize } from "./format";

/**
 * Page-header copy for the `/category/{id}` surface, keyed by the upstream
 * category id. One route (`app/(browse)/category/[id]/page.tsx`) serves both
 * the navbar destinations (Popular, Airing) and every drawer category, so the
 * eyebrow / title / lede cannot live in the route itself.
 *
 * Ids mirror the ones the UI actually links to (`lib/nav/config.ts`). Any id
 * not listed falls back to `titleize(id)` with no eyebrow or lede, so an
 * unlisted upstream category renders exactly as it did before.
 */
export type CategoryHeaderCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  icon: LucideIcon;
};

export const CATEGORY_HEADERS: Record<string, CategoryHeaderCopy> = {
  "most-popular": {
    eyebrow: "DISCOVER SHIRAYUKI",
    title: "Most Popular Anime",
    lede: "Discover fan favorites, all-time classics, and the anime everyone is talking about.",
    icon: Flame,
  },
  "top-airing": {
    eyebrow: "THIS SEASON",
    title: "Currently Airing Anime",
    lede: "Follow ongoing series, discover seasonal standouts, and find your next weekly watch.",
    icon: Sparkles,
  },
  movie: {
    eyebrow: "ON THE BIG SCREEN",
    title: "Anime Movies",
    lede: "Feature films and theatrical releases, from studio classics to recent blockbusters.",
    icon: Film,
  },
  tv: {
    eyebrow: "SERIES",
    title: "TV Series",
    lede: "Long-running and seasonal series across every genre.",
    icon: Tv,
  },
  "subbed-anime": {
    eyebrow: "SUBTITLED",
    title: "Subbed Anime",
    lede: "Watch in the original Japanese audio with subtitles.",
    icon: MonitorPlay,
  },
  "dubbed-anime": {
    eyebrow: "DUBBED",
    title: "Dubbed Anime",
    lede: "Enjoy anime in English and other dubbed languages.",
    icon: Layers,
  },
  "new-anime": {
    eyebrow: "FRESH RELEASES",
    title: "New Releases",
    lede: "The latest additions to the catalogue, newest first.",
    icon: Clock,
  },
  "latest-completed": {
    eyebrow: "FINISHED SERIES",
    title: "Latest Completed",
    lede: "Series that have wrapped — binge the full story without waiting for new episodes.",
    icon: ListOrdered,
  },
  "most-favorite": {
    eyebrow: "FAN FAVORITES",
    title: "Top Favorites",
    lede: "The titles the community keeps coming back to.",
    icon: Star,
  },
  ova: {
    eyebrow: "ORIGINAL VIDEO",
    title: "OVA",
    lede: "Original Video Animation — bonus episodes and side stories.",
    icon: Clapperboard,
  },
  ona: {
    eyebrow: "WEB ORIGINAL",
    title: "ONA",
    lede: "Original Net Animation — titles released primarily online.",
    icon: Clapperboard,
  },
  special: {
    eyebrow: "EXTRAS",
    title: "Specials",
    lede: "Specials, recaps and one-off episodes.",
    icon: Sparkles,
  },
};

/**
 * Header copy for a category id, falling back to a bare titleized title (no
 * eyebrow, no lede, no icon) for ids the map does not cover.
 */
export function categoryHeader(id: string): Partial<CategoryHeaderCopy> & { title: string } {
  return CATEGORY_HEADERS[id] ?? { title: titleize(id) };
}
