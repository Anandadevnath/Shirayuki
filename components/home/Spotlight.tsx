"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Plus,
  Check,
  Star,
  Film,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
 * Unified cinematic hero. The featured anime and the trending carousel live in
 * ONE full-height section: left copy + CTAs, an integrated thumbnail carousel at
 * the bottom that swaps the feature, and right-edge slider indicators.
 */
export function Spotlight({
  items,
  trending = [],
}: {
  items: SpotlightModel[];
  trending?: AnimeCardModel[];
}) {
  const list = items ?? [];
  const n = list.length;
  // The bottom rail shows real trending anime; fall back to spotlight items.
  const rail = trending.length ? trending : list;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const go = useCallback((idx: number) => setActive(((idx % n) + n) % n), [n]);

  // Auto-rotate
  useEffect(() => {
    if (!n || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, paused]);

  // Scroll the trending rail by roughly a viewport of cards.
  const scrollRail = useCallback((dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }, []);

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
      <div className="relative flex h-svh min-h-[600px] max-h-[1080px] w-full flex-col">
        {/* ── Background depth: blurred fill + sharp edge-masked key art ── */}
        <div className="absolute inset-0 scale-[1.08]">
          {list.map((s, idx) =>
            s.poster ? (
              <div
                key={s.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                  idx === active ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={s.poster}
                  alt=""
                  fill
                  sizes="100vw"
                  className="scale-110 object-cover object-center opacity-70 blur-2xl"
                />
                <Image
                  src={s.poster}
                  alt=""
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover object-[center_18%]"
                />
              </div>
            ) : null,
          )}
        </div>

        {/* Cinematic scrims — left for legibility, bottom to seat the carousel.
            The bottom fade is tall with several colour stops so the hero melts
            into the page below with no visible seam line. */}
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[88%] bg-gradient-to-t from-base from-30% via-base/35 via-62% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-base/80 via-base/25 to-transparent" />

        {/* ── Left copy ── */}
        <div className="relative z-10 flex flex-1 items-center pt-28">
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
                {a.jname && <span className="line-clamp-1 text-faint">{a.jname}</span>}
              </div>

              {a.description && (
                <p className="max-w-lg text-sm leading-relaxed text-muted/90 sm:line-clamp-2">
                  {truncate(a.description, 180)}
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
            </div>
          </div>
        </div>

        {/* ── Right-edge slider indicators (diamonds on a connecting track) ── */}
        <div className="pointer-events-none absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
          {/* Vertical track that links the diamonds into one slider */}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 bottom-0 -z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-snow/30 to-transparent"
          />
          {list.map((_, idx) => (
            <button
              key={idx}
              onClick={() => go(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "pointer-events-auto size-2.5 rotate-45 rounded-[2px] border bg-base transition-all",
                idx === active
                  ? "scale-125 border-frost bg-frost shadow-[var(--shadow-neon)]"
                  : "border-snow/40 hover:border-snow/80",
              )}
            />
          ))}
        </div>

        {/* ── Integrated Trending carousel ── */}
        <div className="relative z-10 mx-auto w-full max-w-[1460px] px-4 pb-20 sm:px-6 lg:px-8">
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-4 px-0.5">
              <h2 className="font-display text-sm font-bold text-snow sm:text-base">
                Trending Anime
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={() => scrollRail(-1)}
                  aria-label="Scroll trending left"
                  className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => scrollRail(1)}
                  aria-label="Scroll trending right"
                  className="grid size-8 place-items-center rounded-full bg-frost text-base shadow-[var(--shadow-neon)] transition-transform hover:scale-105"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div
              ref={railRef}
              className="no-scrollbar flex gap-3.5 overflow-x-auto px-0.5 pb-4 pt-3"
            >
              {rail.map((s, idx) => {
                const rank = typeof s.rank === "number" ? s.rank : idx + 1;
                const top3 = rank <= 3;
                return (
                  <Link
                    key={s.id}
                    href={`/anime/${s.id}`}
                    aria-label={s.title}
                    className={cn(
                      "group relative aspect-[3/2] w-44 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-frost)] sm:w-52 md:w-56",
                      top3
                        ? "ring-frost/40 hover:ring-frost"
                        : "ring-line hover:ring-frost/60",
                    )}
                  >
                    {s.poster && (
                      <Image
                        src={s.poster}
                        alt=""
                        fill
                        sizes="224px"
                        className="object-cover brightness-[0.88] transition-[filter] duration-300 group-hover:brightness-110"
                      />
                    )}

                    {/* Scrim — deep at the bottom to seat the chart number + title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-base via-base/35 to-transparent" />

                    {/* Frost wash on hover — tints the art instead of zooming it */}
                    <div className="absolute inset-0 bg-frost-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Hover play affordance */}
                    <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="grid size-11 place-items-center rounded-full bg-frost/90 text-base shadow-[var(--shadow-neon)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-100 scale-75">
                        <Play className="size-5 fill-current" />
                      </span>
                    </span>

                    {/* Oversized chart rank + title, baseline-aligned */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-2.5">
                      <span
                        className={cn(
                          "font-display text-4xl font-extrabold leading-[0.78] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-5xl",
                          top3 ? "text-frost" : "text-snow",
                        )}
                        style={{
                          WebkitTextStroke: top3
                            ? "1.5px var(--color-frost)"
                            : "1px rgba(255,255,255,0.55)",
                        }}
                      >
                        {rank}
                      </span>
                      <span className="line-clamp-2 pb-0.5 text-left text-[12px] font-semibold leading-tight text-snow drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
                        {s.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
