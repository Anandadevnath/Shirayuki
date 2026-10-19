import { notFound } from "next/navigation";
import { getEpisodes, safe } from "@/lib/api";
import { WatchRedirectClient } from "./WatchRedirectClient";

/**
 * /watch/[id] → resolve the episode list server-side, then hand off to a
 * client component to pick the resume episode (first episode OR the user's
 * saved progress position, whichever is later) and router.replace into
 * the player route.
 *
 * H2 fix: previously this always picked `episodes[0]`, so a user mid-season
 * always restarted from episode 1. The redirect itself stays a server
 * component so the episode list fetch keeps its ISR/data-cache benefits;
 * the client island just chooses the target episode and replaces the URL.
 *
 * No API, endpoint, schema, or provider change. Pure frontend addition.
 *
 * Cacheability (SEC-02 / PERF-06): an earlier attempt added
 * `export const revalidate = 60` here, but it is a no-op — this route sits under
 * an UNBOUNDED dynamic segment (`[id]`) with no `generateStaticParams`, so
 * Next always renders it on demand and emits `Cache-Control: no-store`. It is
 * therefore left dynamic on purpose, with no misleading cache config. The only
 * edge-cached HTML route in the app is `/` (see app/page.tsx). The episode-list
 * read below is still Data-Cache backed, so a repeat view is cheap.
 */
export default async function WatchRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await safe(() => getEpisodes(id));
  const episodes = res.ok ? res.data.episodes : [];
  if (!episodes.length) notFound();
  const episodeIds = episodes.map((e) => e.episodeId);
  return <WatchRedirectClient animeId={id} episodeIds={episodeIds} />;
}
