import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Captions, Mic, ServerCog } from "lucide-react";
import { getAnime, getAnimeSeasons, getEpisodes, getServers, getSources, safe, withTimeout } from "@/lib/api";
import type { ServerModel, SourcesModel } from "@/lib/providers/types";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/Skeleton";
import CinematicInfo from "@/components/details/CinematicInfo";
import { EpisodeSidebar } from "@/components/details/EpisodeSidebar";
import { DetailBackdrop } from "@/components/details/DetailBackdrop";
import { FranchiseTimeline } from "@/components/details/FranchiseTimeline";
import { PlayerLoader } from "@/components/player/PlayerLoader";
import { cn } from "@/lib/utils/cn";

// Dynamic by necessity (SEC-02): this route resolves an ephemeral stream URL
// (`getSources`/`getServers` are `noStore`), which opts it out of static
// generation, so it cannot be shared-cached. No misleading cache config here.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; ep: string }>;
  searchParams: Promise<{ cat?: string; server?: string }>;
};

const epNumberOf = (episodeId: string) =>
  Number(episodeId.match(/ep-(\d+)/)?.[1] ?? episodeId.match(/(\d+)$/)?.[1] ?? 1);

/** Double-decode of a route segment. A malformed escape sequence (e.g.
 *  a raw invalid UTF-8 byte in the URL) makes decodeURIComponent throw, which
 *  would 500 the whole page — fall back to the raw segment instead. */
const safeDecode = (seg: string): string => {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, ep } = await params;
  const episodeId = safeDecode(ep);
  // Resolve title + the real episode number together; the number is NOT
  // derivable from the opaque id hash, so it must come from the episode list.
  const [animeRes, epsRes] = await Promise.all([
    safe(() => getAnime(id)),
    safe(() => getEpisodes(id)),
  ]);
  const title = animeRes.ok && animeRes.data ? animeRes.data.title : "Watch";
  const num =
    (epsRes.ok && epsRes.data.episodes.find((e) => e.episodeId === episodeId)?.number) ||
    epNumberOf(episodeId);
  return { title: `${title} · EP ${num}`, robots: { index: false } };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { id, ep } = await params;
  const { cat, server } = await searchParams;
  const episodeId = safeDecode(ep);
  const epNum = epNumberOf(episodeId);

  const [detailRes, epsRes, serversRes] = await Promise.all([
    safe(() => getAnime(id)),
    safe(() => getEpisodes(id)),
    safe(() => getServers(episodeId, epNum)),
  ]);

  if (!detailRes.ok || !detailRes.data) notFound();
  const anime = detailRes.data;
  const episodes = epsRes.ok ? epsRes.data.episodes : [];
  // New v2 episodeIds are opaque hashes — resolve the real episode number
  // from the episode list instead of trusting a regex on the id.
  const displayEp = episodes.find((e) => e.episodeId === episodeId)?.number ?? epNum;
  const servers = serversRes.ok
    ? serversRes.data
    : { sub: [], dub: [], animeId: id, episode: epNum };

  const category: "sub" | "dub" =
    cat === "dub" && servers.dub.length ? "dub" : "sub";
  const pool: ServerModel[] = category === "dub" ? servers.dub : servers.sub;
  const preferred = pool.find((s) => s.nameId === server) ?? pool[0] ?? null;

  const currentIdx = episodes.findIndex((e) => e.episodeId === episodeId);
  const nextEp = currentIdx >= 0 ? episodes[currentIdx + 1] : undefined;
  const nextHref = nextEp ? `/watch/${id}/${encodeURIComponent(nextEp.episodeId)}` : null;

  const ordered = preferred
    ? [preferred, ...pool.filter((s) => s.nameId !== preferred.nameId)]
    : [];
  let chosen: ServerModel | null = preferred;
  let sources: SourcesModel | null = null;
  // Server failover is a genuine SEQUENTIAL dependency: each candidate must be
  // tried (and fail) before the next is meaningful, so this cannot be raced.
  // To keep it from ever hanging the render on a stalled server, each attempt
  // gets an explicit deadline (12s) — long enough for the client's own retry
  // budget, short enough that a dead server only costs one bounded wait before
  // the loop moves on. Once a source resolves, the loop breaks and the player
  // renders; nothing after it waits on the remaining servers.
  for (const candidate of ordered) {
    const res = await withTimeout(
      getSources(episodeId, epNum, candidate.nameId, category),
      12_000,
      `sources:${candidate.nameId}`,
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

  // M4 fix: when switching SUB/DUB, preserve the user's current server
  // selection *if* the new category has it. If not, fall back to the
  // first server in that category. Pure URL-level change — no API call.
  const swHref = (c: "sub" | "dub", s?: string) => {
    const newPool = c === "sub" ? servers.sub : servers.dub;
    const target = (s && newPool.find((x) => x.nameId === s)?.nameId) || newPool[0]?.nameId || "";
    return `/watch/${id}/${encodeURIComponent(episodeId)}?cat=${c}&server=${target}`;
  };

  // HiAnime currently serves cover === poster. Preferring cover keeps the
  // backdrop contract identical to the detail page's (`app/anime/[id]`).
  const backgroundSrc = anime.cover ?? anime.poster ?? null;

  return (
    <>
      {/* The single fixed artwork layer for the whole route — the immersive
          blurred banner behind the player. No second background image or scrim
          stack anywhere else on this page. */}
      <DetailBackdrop src={backgroundSrc} />

      {/* ============== Row 1: Player + Episode Sidebar (synced height) ============== */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Player container ──────────────────────────────────────── */}
        <div className="laser-frame laser-live glass watch-glass relative flex min-w-0 flex-col overflow-hidden rounded-md">
          <div className="relative">
            {playerSrc && sources ? (
              <PlayerLoader
                src={playerSrc}
                poster={anime.poster}
                tracks={sources.tracks.map((t) => ({ src: t.file, label: t.label, default: t.default }))}
                intro={sources.intro}
                outro={sources.outro}
                nextHref={nextHref}
                referer={sources.referer}
                // Alternate servers for this episode (same category), minus the
                // one now playing. Lets the player fail over MID-PLAYBACK
                // without a navigation when the active source dies, preserving
                // the user's timestamp. Empty when there is only one server.
                failover={{
                  episodeId,
                  episodeNumber: epNum,
                  category,
                  servers: ordered
                    .filter((s) => s.nameId !== chosen?.nameId)
                    .map((s) => ({ name: s.name, nameId: s.nameId })),
                }}
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
          <div className="border-t border-white/10 bg-surface/40 px-5 py-4 backdrop-blur-sm sm:px-6">
            <h1 className="text-title text-snow sm:text-[1.375rem]">{anime.title}</h1>
            <p className="text-meta mt-0.5 text-muted">
              Episode {epNum}
              {episodes[currentIdx]?.title ? ` · ${episodes[currentIdx]?.title}` : ""}
            </p>
          </div>

          {/* ── Server switcher (transparent + glassy) ──────────────── */}
          <div className="space-y-3 border-t border-white/10 bg-surface/30 px-5 py-4 backdrop-blur-sm sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-caption flex items-center gap-1.5 text-faint">
                <Captions className="size-3.5" /> Subtitles / Dub
              </span>
              <div className="flex gap-1.5">
                {servers.sub.length > 0 && (
                  <Link
                    // M4 fix: pass the currently-selected server if it
                    // exists in the SUB pool, so the SUB tab preserves
                    // the user's server choice across category switches.
                    href={swHref("sub", preferred?.nameId)}
                    className={cn(
                      "flex items-center gap-1 rounded-sm border px-3 py-1 text-xs transition-colors",
                      category === "sub"
                        ? "border-frost/60 bg-frost-soft font-semibold text-frost"
                        : "border-white/10 bg-base/40 text-muted hover:border-frost/40 hover:bg-base/60 hover:text-snow",
                    )}
                  >
                    <Captions className="size-3" /> SUB
                  </Link>
                )}
                {servers.dub.length > 0 && (
                  <Link
                    href={swHref("dub", preferred?.nameId)}
                    className={cn(
                      "flex items-center gap-1 rounded-sm border px-3 py-1 text-xs transition-colors",
                      category === "dub"
                        ? "border-frost/60 bg-frost-soft font-semibold text-frost"
                        : "border-white/10 bg-base/40 text-muted hover:border-frost/40 hover:bg-base/60 hover:text-snow",
                    )}
                  >
                    <Mic className="size-3" /> DUB
                  </Link>
                )}
              </div>
            </div>

            {pool.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-caption flex items-center gap-1.5 text-faint">
                  <ServerCog className="size-3.5" /> Server
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pool.map((s) => (
                    <Link
                      key={s.nameId}
                      href={swHref(category, s.nameId)}
                      className={cn(
                        "rounded-sm border px-3 py-1 text-xs transition-colors",
                        s.nameId === chosen?.nameId
                          ? "border-frost/60 bg-frost-soft font-semibold text-frost"
                          : "border-white/10 bg-base/40 text-muted hover:border-frost/40 hover:bg-base/60 hover:text-snow",
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
        <EpisodeSidebar
          animeId={id}
          episodes={episodes}
          currentEpisodeId={episodeId}
          category={category}
          // Hrefs built here with the existing `swHref` (URL-level SUB/DUB
          // switch) so no routing logic moves into the client component.
          subHref={servers.sub.length ? swHref("sub", preferred?.nameId) : null}
          dubHref={servers.dub.length ? swHref("dub", preferred?.nameId) : null}
        />
      </div>

      {/* ============== Rows 2+: franchise, details ============== */}
      <div className="section-stack mt-[var(--space-section)]">
        {/* Franchise / watch order. Streamed behind Suspense (see
            <FranchiseRail>): the seasons scrape must never gate the player's
            first paint, so it awaits inside the island, not the page. */}
        <Suspense fallback={<FranchiseRailSkeleton />}>
          <FranchiseRail animeId={id} />
        </Suspense>

        {/* ============== Anime Details (Cinematic) ============== */}
        <CinematicInfo anime={anime} category={category} epNum={displayEp} />
      </div>
    </>
  );
}

/**
 * Streamed franchise island. `AnimeDetail.seasons` is hardcoded to [] by the
 * mapper, so the ordered timeline comes from its own ISR-cached getter
 * (`getAnimeSeasons`, tag `seasons:${id}`), awaited HERE rather than in the
 * page's blocking `Promise.all` — the player renders before this resolves.
 * Hidden below two entries (a lone "season" is not a timeline) and hidden
 * entirely on failure, matching the detail page.
 */
async function FranchiseRail({ animeId }: { animeId: string }) {
  const res = await safe(() => getAnimeSeasons(animeId));
  const seasons = res.ok ? res.data?.filter(Boolean) ?? [] : [];
  if (seasons.length <= 1) return null;
  return <FranchiseTimeline items={seasons} currentId={animeId} linkBase="watch" />;
}

/** Placeholder matching the franchise rail's footprint (header + landscape
 *  poster row) while the seasons scrape streams in, so its arrival causes no
 *  layout shift. */
function FranchiseRailSkeleton() {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-16 rounded" />
        <Skeleton className="h-6 w-36 rounded-md" />
      </div>
      <div className="flex gap-4 overflow-hidden pt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/2] w-44 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line sm:w-52 md:w-56"
          />
        ))}
      </div>
    </section>
  );
}
