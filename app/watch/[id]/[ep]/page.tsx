import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Captions, Mic, ServerCog } from "lucide-react";
import { getAnime, getEpisodes, getServers, getSources, safe } from "@/lib/api";
import type { ServerModel, SourcesModel } from "@/lib/providers/types";
import { ErrorState } from "@/components/common/States";
import CinematicInfo from "@/components/details/CinematicInfo";
import { PlayerLoader } from "@/components/player/PlayerLoader";
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
  const preferred = pool.find((s) => s.nameId === server) ?? pool[0] ?? null;

  const currentIdx = episodes.findIndex((e) => e.episodeId === episodeId);
  const nextEp = currentIdx >= 0 ? episodes[currentIdx + 1] : undefined;
  const nextHref = nextEp ? `/watch/${id}/${encodeURIComponent(nextEp.episodeId)}` : null;

  // Transparent server failover: individual HiAnime extractors frequently return
  // HTTP 500 / no source while others in the same category work. Try the
  // preferred server first, then fall back through the rest of the pool so one
  // dead server doesn't dead-end the page. `chosen` ends up reflecting the
  // server that actually played (so the switcher highlights it), or the
  // preferred one if every server failed.
  const ordered = preferred
    ? [preferred, ...pool.filter((s) => s.nameId !== preferred.nameId)]
    : [];
  let chosen: ServerModel | null = preferred;
  let sources: SourcesModel | null = null;
  for (const candidate of ordered) {
    const res = await safe(() =>
      getSources(episodeId, epNum, candidate.nameId, category),
    );
    if (res.ok && res.data) {
      chosen = candidate;
      sources = res.data;
      break;
    }
  }

  const playerSrc = sources
    ? `/api/stream?url=${encodeURIComponent(sources.m3u8)}${
        sources.referer ? `&referer=${encodeURIComponent(sources.referer)}` : ""
      }`
    : null;

  const swHref = (c: string, s: string) =>
    `/watch/${id}/${encodeURIComponent(episodeId)}?cat=${c}&server=${s}`;

  return (
    <>
      {/* ============== Row 1: Player + Episode Sidebar (synced height) ============== */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Player container ──────────────────────────────────────── */}
        <div className="laser-frame laser-live glass relative flex min-w-0 flex-col overflow-hidden rounded-md">
          <div className="relative">
            {playerSrc && sources ? (
              <PlayerLoader
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
              <div className="aspect-video rounded-t-md">
                <ErrorState
                  message={
                    pool.length === 0
                      ? "No streaming server is available for this episode yet. Try another episode."
                      : "This server didn't return a playable source. Pick a different server below."
                  }
                  retryHref={`/watch/${id}/${encodeURIComponent(episodeId)}`}
                />
              </div>
            )}
          </div>

          {/* ── Title strip ─────────────────────────────────────────── */}
          <div className="border-t border-line/60 bg-surface/60 px-5 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-snow sm:text-2xl">{anime.title}</h1>
            <p className="mt-0.5 text-sm text-muted">
              Episode {epNum}
              {episodes[currentIdx]?.title ? ` · ${episodes[currentIdx]?.title}` : ""}
            </p>
          </div>

          {/* ── Server switcher (transparent + glassy) ──────────────── */}
          <div className="space-y-3 border-t border-line/60 bg-surface/50 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-faint">
                <Captions className="size-3.5" /> Subtitles / Dub
              </span>
              <div className="flex gap-1">
                {servers.sub.length > 0 && (
                  <Link
                    href={swHref("sub", servers.sub[0].nameId)}
                    className={cn(
                      "flex items-center gap-1 rounded-sm px-3 py-1 text-xs transition-colors",
                      category === "sub"
                        ? "bg-frost-soft text-frost"
                        : "border border-line/60 text-muted hover:text-snow",
                    )}
                  >
                    <Captions className="size-3" /> SUB
                  </Link>
                )}
                {servers.dub.length > 0 && (
                  <Link
                    href={swHref("dub", servers.dub[0].nameId)}
                    className={cn(
                      "flex items-center gap-1 rounded-sm px-3 py-1 text-xs transition-colors",
                      category === "dub"
                        ? "bg-frost-soft text-frost"
                        : "border border-line/60 text-muted hover:text-snow",
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
                        "rounded-sm px-3 py-1 text-xs transition-colors",
                        s.nameId === chosen?.nameId
                          ? "bg-frost-soft text-frost"
                          : "border border-line/60 text-muted hover:text-snow",
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

        {/* ── Episode Sidebar (height syncs with player) ──────────── */}
        <aside className="laser-frame glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b border-line/60 bg-surface/60 px-5 py-4">
            <h2 className="text-sm font-semibold text-snow">
              Episodes <span className="text-faint">({episodes.length})</span>
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
              {category.toUpperCase()}
            </span>
          </div>
          <div className="no-scrollbar scroll-frost max-h-[640px] flex-1 space-y-1 overflow-y-auto p-2">
            {episodes.map((e) => (
              <Link
                key={e.episodeId}
                href={`/watch/${id}/${encodeURIComponent(e.episodeId)}`}
                className={cn(
                  "hover-snap flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
                  e.episodeId === episodeId
                    ? "bg-frost-soft text-frost"
                    : "text-muted hover:bg-surface-2/70 hover:text-snow",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-sm font-mono text-xs",
                    e.episodeId === episodeId
                      ? "bg-frost/20 text-frost"
                      : "bg-base text-faint",
                  )}
                >
                  {e.number}
                </span>
                <span className="line-clamp-1 flex-1">
                  {e.title ?? `Episode ${e.number}`}
                </span>
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

      {/* ============== Row 2: Full-width Anime Details (Cinematic) ============== */}
      <CinematicInfo anime={anime} category={category} epNum={epNum} />
    </>
  );
}
