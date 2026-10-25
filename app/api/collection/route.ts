import { NextResponse } from "next/server";
import { getHome, safe } from "@/lib/api";
import { HOME_COLLECTION_KEYS, homeBucket } from "@/lib/discovery/collections";
import type { AnimeCardModel } from "@/lib/providers/types";

/**
 * Read-only proxy for the home-payload collections that have no `/browse/*`
 * listing (Trending, Top Airing, Latest Episodes). The unified Category page's
 * Status control switches to these in place, and the home payload is
 * server-only, so the client resolves them here.
 *
 * `key` is validated against the known home-collection set, so the route can
 * never be used to probe arbitrary buckets. Underlying `getHome` is Data-Cache
 * cached (revalidate 900, tag `home`), so this is an edge read, not upstream.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!HOME_COLLECTION_KEYS.has(key)) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  const res = await safe(() => getHome());
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });

  const bucket = homeBucket(res.data, key) as AnimeCardModel[];

  // Home buckets are a fixed snapshot (no pagination): report a single page so
  // the client treats it as a complete set.
  return NextResponse.json(
    { results: bucket, currentPage: 1, totalPages: 1, hasNextPage: false },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
