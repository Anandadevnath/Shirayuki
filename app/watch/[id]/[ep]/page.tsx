import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Captions, Mic, ServerCog } from "lucide-react";
import { getAnime, getEpisodes, getServers, getSources, safe } from "@/lib/api";
import type { ServerModel } from "@/lib/providers/types";
import { Player } from "@/components/player/Player";
import { ErrorState } from "@/components/common/States";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; ep: string }>;
  searchParams: Promise<{ cat?: string; server?: string }>;
};

const epNumberOf = (episodeId: string) =>
  Number(episodeId.match(/ep-(\d+)/)?.[1] ?? episodeId.match(/(\d+)$/)?.[1] ?? 1);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, ep } = await params;
  const episodeId = decodeURIComponent(ep);
  const res = await safe(() => getAnime(id));
  const title = res.ok && res.data ? res.data.title : "Watch";
  return { title: `${title} · EP ${epNumberOf(episodeId)}`, robots: { index: false } };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { id, ep } = await params;
  const { cat, server } = await searchParams;
  const episodeId = decodeURIComponent(ep);
  const epNum = epNumberOf(episodeId);

  const [detailRes, epsRes, serversRes] = await Promise.all([
    safe(() => getAnime(id)),
    safe(() => getEpisodes(id)),
    safe(() => getServers(episodeId, epNum)),
  ]);

  if (!detailRes.ok || !detailRes.data) notFound();
  const anime = detailRes.data;
  const episodes = epsRes.ok ? epsRes.data.episodes : [];
  const servers = serversRes.ok
    ? serversRes.data
    : { sub: [], dub: [], hsub: [], animeId: id, episode: epNum };

  const category: "sub" | "dub" =
    cat === "dub" && servers.dub.length ? "dub" : "sub";
  const pool: ServerModel[] = category === "dub" ? servers.dub : servers.sub;
  // Honour the requested server, else fall back to the provider's first.
  const chosen = pool.find((s) => s.nameId === server) ?? pool[0] ?? null;

  const currentIdx = episodes.findIndex((e) => e.episodeId === episodeId);
  const nextEp = currentIdx >= 0 ? episodes[currentIdx + 1] : undefined;
  const nextHref = nextEp ? `/watch/${id}/${encodeURIComponent(nextEp.episodeId)}` : null;

  const sourcesRes = chosen
    ? await safe(() => getSources(episodeId, epNum, chosen.nameId, category))
    : null;
  const sources = sourcesRes && sourcesRes.ok ? sourcesRes.data : null;

  const playerSrc = sources
    ? `/api/stream?url=${encodeURIComponent(sources.m3u8)}${
        sources.referer ? `&referer=${encodeURIComponent(sources.referer)}` : ""
      }`
    : null;

  const swHref = (c: string, s: string) =>
    `/watch/${id}/${encodeURIComponent(episodeId)}?cat=${c}&server=${s}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {playerSrc && sources ? (
          <Player
            src={playerSrc}
            poster={anime.poster}
            tracks={sources.tracks.map((t) => ({ src: t.file, label: t.label, default: t.default }))}
            intro={sources.intro}
            outro={sources.outro}
            nextHref={nextHref}
            meta={{
              animeId: id,
              title: anime.title,
              poster: anime.poster,
              episodeId,
              episodeNumber: epNum,
              category,
              server: chosen?.nameId ?? "",
            }}
          />
        ) : (
          <div className="aspect-video">
            <ErrorState
              message={
                pool.length === 0
                  ? "No streaming server is available for this episode yet. Try another episode."
                  : "This server didn’t return a playable source. Pick a different server below."
              }
              retryHref={`/watch/${id}/${encodeURIComponent(episodeId)}`}
            />
          </div>
        )}

        <div className="mt-4">
          <h1 className="text-xl font-bold">{anime.title}</h1>
          <p className="text-sm text-muted">
            Episode {epNum}
            {episodes[currentIdx]?.title ? ` · ${episodes[currentIdx]?.title}` : ""}
          </p>
        </div>

        {/* Category + server switcher (transparent reliability) */}
        <div className="mt-4 space-y-3 rounded-lg border border-line bg-surface/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-faint">
              <Captions className="size-3.5" /> Subtitles / Dub
            </span>
            <div className="flex gap-1">
              {servers.sub.length > 0 && (
                <Link
                  href={swHref("sub", servers.sub[0].nameId)}
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-3 py-1 text-xs",
                    category === "sub" ? "bg-frost-soft text-frost" : "border border-line text-muted",
                  )}
                >
                  <Captions className="size-3" /> SUB
                </Link>
              )}
              {servers.dub.length > 0 && (
                <Link
                  href={swHref("dub", servers.dub[0].nameId)}
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-3 py-1 text-xs",
                    category === "dub" ? "bg-frost-soft text-frost" : "border border-line text-muted",
                  )}
                >
                  <Mic className="size-3" /> DUB
                </Link>
              )}
            </div>
          </div>

          {pool.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-faint">
                <ServerCog className="size-3.5" /> Server
              </span>
              <div className="flex flex-wrap gap-1">
                {pool.map((s) => (
                  <Link
                    key={s.nameId}
                    href={swHref(category, s.nameId)}
                    className={cn(
                      "rounded-sm px-3 py-1 text-xs",
                      s.nameId === chosen?.nameId
                        ? "bg-frost-soft text-frost"
                        : "border border-line text-muted hover:text-snow",
                    )}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episode sidebar */}
      <aside className="min-w-0">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Episodes ({episodes.length})
        </h2>
        <div className="no-scrollbar max-h-[70vh] space-y-1 overflow-y-auto rounded-lg border border-line bg-surface/40 p-2">
          {episodes.map((e) => (
            <Link
              key={e.episodeId}
              href={`/watch/${id}/${encodeURIComponent(e.episodeId)}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                e.episodeId === episodeId
                  ? "bg-frost-soft text-frost"
                  : "text-muted hover:bg-surface-2 hover:text-snow",
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-base font-mono text-xs">
                {e.number}
              </span>
              <span className="line-clamp-1 flex-1">{e.title ?? `Episode ${e.number}`}</span>
              {e.isFiller && (
                <span className="shrink-0 rounded-sm bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                  F
                </span>
              )}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
