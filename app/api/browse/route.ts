import { NextResponse } from "next/server";
import { getCategory, getGenre, safe } from "@/lib/api";

/**
 * Read-only listing proxy for the discovery board's in-place collection and
 * multi-genre filtering. The provider getters are server-only (`API_BASE_URL`
 * is never exposed to the client), so the board resolves a switched collection
 * (or a genre page) through this route and swaps its grid without a full server
 * navigation.
 *
 *   ?category=<id>   → the `/browse/<id>` listing (Status collections)
 *   ?genre=<slug>    → the `/genre/<slug>` listing (multi-genre filter)
 *
 * Exactly one selector is honoured. Underlying provider calls are Data-Cache
 * cached (revalidate 900, tag <kind>:<key>), so a repeat selection is an edge
 * read, not an upstream hop.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category")?.trim() ?? "";
  const genre = params.get("genre")?.trim() ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const selector = category || genre;
  if (!selector) return NextResponse.json({ results: [] }, { status: 400 });

  const res = await safe(() =>
    category ? getCategory(category, page) : getGenre(genre, page),
  );
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });

  return NextResponse.json(res.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
