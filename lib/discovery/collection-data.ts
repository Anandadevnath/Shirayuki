import { getCategory, getHome } from "@/lib/api";
import { homeBucket, type CollectionDef } from "./collections";
import type { AnimeCardModel } from "@/lib/providers/types";

/** A resolved listing + the pagination facts a browse surface reports. */
export interface CollectionListing {
  results: AnimeCardModel[];
  currentPage: number;
  totalPages: number;
}

/**
 * Load the listing a collection represents.
 *
 *   · browse-backed (Popular, Airing, All Anime, …) → the paginated
 *     `/browse/<key>` listing;
 *   · home-backed (Trending, Top Airing, Latest Episodes) → a fixed home
 *     bucket (no pagination).
 *
 * Shared by the `/category` and `/category/[id]` routes so the two surfaces can
 * never disagree about which endpoint backs a collection.
 */
export async function loadCollection(
  def: CollectionDef,
  page: number,
): Promise<CollectionListing> {
  if (def.source === "home") {
    const home = await getHome();
    return {
      results: homeBucket(home, def.key) as AnimeCardModel[],
      currentPage: 1,
      totalPages: 1,
    };
  }
  return getCategory(def.key, page);
}
