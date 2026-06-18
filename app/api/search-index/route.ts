import { NextResponse } from "next/server";
import { getHome, safe } from "@/lib/api";

/**
 * Tiny, deduped catalogue slice used to power the CommandPalette's local
 * fuzzy index. Pulls only the fields the palette needs (id, title, jname,
 * poster, type, episodes, score) and dedupes by id — the home payload
 * overlaps across spotlight / trending / topAiring / etc.
 *
 * Cached server-side via Next's Data Cache (`getHome` already uses
 * `revalidate: 900` + tag `home`), so after the first call this route is
 * essentially a cached JSON read with no upstream hop. Safe to prefetch.
 */
export async function GET() {
  const res = await safe(getHome);
  if (!res.ok) return NextResponse.json({ results: [] });

  const seen = new Set<string>();
  const out: {
    id: string;
    title: string;
    jname: string | null;
    poster: string | null;
    type: string | null;
    episodes: { sub: number | null; dub: number | null };
    score: number | null;
  }[] = [];

  const push = (
    a: { id: string; title: string; jname: string | null; poster: string | null; type: string | null; episodes: { sub: number | null; dub: number | null }; score?: number | null } | null | undefined,
  ) => {
    if (!a || !a.id || seen.has(a.id)) return;
    seen.add(a.id);
    out.push({
      id: a.id,
      title: a.title,
      jname: a.jname,
      poster: a.poster,
      type: a.type,
      episodes: a.episodes,
      score: a.score ?? null,
    });
  };

  const h = res.data;
  h.spotlight.forEach(push);
  h.trending.forEach(push);
  h.topAiring.forEach(push);
  h.mostPopular.forEach(push);
  h.newReleases.forEach(push);
  h.completed.forEach(push);

  return NextResponse.json(
    { results: out },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}