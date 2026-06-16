import { redirect, notFound } from "next/navigation";
import { getEpisodes, safe } from "@/lib/api";

/** /watch/[id] → resolve the first episode and redirect into the player. */
export default async function WatchRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await safe(() => getEpisodes(id));
  const first = res.ok ? res.data.episodes[0]?.episodeId : null;
  if (!first) notFound();
  redirect(`/watch/${id}/${encodeURIComponent(first)}`);
}
