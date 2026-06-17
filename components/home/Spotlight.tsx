"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, Star, Film, Flame } from "lucide-react";
import type { AnimeCardModel, SpotlightModel } from "@/lib/providers/types";
import { EpBadges } from "@/components/anime/Badges";
import { truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { isInList, toggleList, WATCHLIST_EVENT } from "@/lib/watchlist/local";

function totalEpisodes(a: SpotlightModel): number | null {
  return a.episodes.sub ?? a.episodes.dub ?? null;
}

/** Glass-outline "My List" toggle, backed by localStorage. */
function MyListButton({ anime }: { anime: SpotlightModel }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(isInList(anime.id));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [anime.id]);

  return (
    <button
      type="button"
      onClick={() =>
        toggleList({ id: anime.id, title: anime.title, poster: anime.poster, type: anime.type })
      }
      aria-pressed={added}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold backdrop-blur-md transition-colors",
        added
          ? "border-frost/60 bg-frost-soft text-frost"
          : "border-line glass text-snow hover:border-frost/50",
      )}
    >
      {added ? <Check className="size-4" /> : <Plus className="size-4" />}
      {added ? "In My List" : "My List"}
    </button>
  );
}

/**
 * Cinematic, calm hero. Full-bleed key art with a vertical "featured" strip on
 * the left, the title's Japanese name set as oversized vertical type on the
 * right, and the copy + CTAs anchored low-left. The trending rail now lives in
 * its own section below — the hero stays uncluttered and atmospheric.
 */
export function Spotlight({
  items,
}: {
  items: SpotlightModel[];
  /** Accepted for call-site compatibility; trending renders in its own section now. */
  trending?: AnimeCardModel[];
}) {
  const list = items ?? [];
  const n = list.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((idx: number) => setActive(((idx % n) + n) % n), [n]);

  // Auto-rotate
  useEffect(() => {
    if (!n || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (!n) return null;
  const a = list[active];
  const eps = totalEpisodes(a);

  return (
    <section
      // Full-bleed: break out of the centered <main> to the true viewport edges.
      // body has overflow-x-clip, so 100vw spans full width with no horizontal scroll.
      className="relative left-1/2 w-screen -translate-x-1/2 -mt-20 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured anime"
    >
      <div className="relative flex h-[82svh] min-h-[600px] max-h-[1000px] w-full flex-col">
        {/* ── Background depth: blurred fill + sharp edge-masked key art ── */}
        <div className="absolute inset-0">
          {list.map((s, idx) =>
            s.poster ? (
              <div
                key={s.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[1100ms] ease-out",
                  idx === active ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={s.poster}
                  alt=""
                  fill
                  sizes="100vw"
                  className="scale-110 object-cover object-center opacity-60 blur-2xl"
                />
                <Image
                  src={s.poster}
                  alt=""
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover object-[center_22%] brightness-[0.82]"
                />
              </div>
            ) : null,
          )}
        </div>

        {/* Cinematic scrims — a gentle vignette so the art reads as one calm
            scene: darker at the edges and base, lighter through the middle. */}
        <div className="absolute inset-0 bg-gradient-to-r from-base/95 via-base/45 to-base/70" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-base from-6% via-base/25 via-42% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-base/85 via-base/25 to-transparent" />

        {/* ── Left vertical "featured" strip ── */}
        <div className="pointer-events-none absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
          <span className="h-16 w-px bg-gradient-to-b from-transparent to-frost/60" />
          <span
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.5em] text-frost"
            style={{ writingMode: "vertical-rl" }}
          >
            Featured
          </span>
          <span
            className="font-display text-sm font-bold tabular-nums text-snow/80"
            style={{ writingMode: "vertical-rl" }}
          >
            {String(active + 1).padStart(2, "0")} — {String(n).padStart(2, "0")}
          </span>
          <span className="h-16 w-px bg-gradient-to-b from-frost/60 to-transparent" />
        </div>

        {/* ── Copy + CTAs, anchored to the upper-left so the lower band stays
            clear for the Trending rail that tucks up beneath the hero. ── */}
        <div className="relative z-10 flex flex-1 items-start pt-24 sm:pt-28">
          <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-xl flex-col gap-4">
              <h1 className="font-display text-4xl font-extrabold leading-[1.04] drop-shadow-[0_2px_28px_rgba(0,0,0,0.8)] sm:text-5xl md:text-6xl">
                <span className="line-clamp-2">{a.title}</span>
              </h1>

              {/* Metadata row — real fields only */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted sm:text-sm">
                {a.type && (
                  <span className="rounded-full border border-line bg-base/40 px-3 py-0.5 backdrop-blur-sm">
                    {a.type}
                  </span>
                )}
                {a.quality && (
                  <span className="rounded-full bg-frost-soft px-3 py-0.5 font-semibold text-frost">
                    {a.quality}
                  </span>
                )}
                <EpBadges sub={a.episodes.sub} dub={a.episodes.dub} />
              </div>

              {a.description && (
                <p className="max-w-lg text-sm leading-relaxed text-muted/90 sm:line-clamp-2">
                  {truncate(a.description, 170)}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-snow">
                {!!a.score && (
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-warning text-warning" /> {a.score}
                    <span className="text-faint">Rating</span>
                  </span>
                )}
                {eps != null && (
                  <span className="flex items-center gap-1.5">
                    <Film className="size-4 text-frost" /> {eps}
                    <span className="text-faint">Episodes</span>
                  </span>
                )}
                {typeof a.rank === "number" && (
                  <span className="flex items-center gap-1.5">
                    <Flame className="size-4 text-sakura" />
                    <span className="text-faint">Trending</span> #{a.rank}
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="mt-1 flex items-center gap-3">
                <Link
                  href={`/watch/${a.id}`}
                  className="flex items-center gap-2 rounded-2xl bg-frost px-7 py-3 text-sm font-semibold text-base shadow-[var(--shadow-neon)] transition-transform hover:scale-[1.04]"
                >
                  <Play className="size-4 fill-current" /> Watch Now
                </Link>
                <MyListButton anime={a} />
              </div>

              {/* Slide indicators — a quiet horizontal row under the CTAs */}
              {n > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  {list.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => go(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        idx === active
                          ? "w-8 bg-frost shadow-[var(--shadow-neon)]"
                          : "w-4 bg-snow/30 hover:bg-snow/60",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
