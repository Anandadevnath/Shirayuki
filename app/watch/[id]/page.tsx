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
