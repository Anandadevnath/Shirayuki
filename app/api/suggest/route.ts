import { NextResponse } from "next/server";
import { suggest, safe } from "@/lib/api";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const res = await safe(() => suggest(q));
  if (!res.ok) return NextResponse.json({ results: [] });
  // Per-query CDN cache: identical keystrokes within the same palette session
  // re-hit the edge instead of the upstream. Underlying provider call is
  // already Data-Cache cached (revalidate 300, tag suggest:<q>), so the
  // upstream hop is a no-op during the window.
  return NextResponse.json(
    { results: res.data.slice(0, 8) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
