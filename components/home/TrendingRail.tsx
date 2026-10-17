"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { PortalSectionHeader } from "./PortalSectionHeader";

/**
 * "Trending Anime" — the reference's five ranked cards in one row with
 * carousel arrows seated OUTSIDE the card row. Rank numbers overlay the
 * artwork's top-left in the display serif; the title and a compact
 * score · type · episode meta sit in the card's lower band.
 *
 * The first card carries the icy-blue active highlight from the reference.
 */
export function TrendingRail({ items }: { items: AnimeCardModel[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth * 0.9, behavior: "smooth" });

  const cards = items.slice(0, 5);
  if (!cards.length) return null;

  return (
    <section aria-label="Trending anime">
      <PortalSectionHeader jp="人気のアニメ" title="Trending Anime" href="/category/most-popular" />

      <div className="relative">
        {/* Outside arrows — desktop pointers only; the rail scrolls natively
            on touch. Pure clientside, no autoplay. */}
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll trending left"
          className="absolute -left-3 top-[92px] z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line/80 bg-base/70 text-snow/80 backdrop-blur-md transition-colors hover:border-frost/50 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:grid"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll trending right"
          className="absolute -right-3 top-[92px] z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line/80 bg-base/70 text-snow/80 backdrop-blur-md transition-colors hover:border-frost/50 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost lg:grid"
        >
          <ChevronRight className="size-4" />
        </button>

        <div
          ref={railRef}
          style={{ maskImage: "linear-gradient(to right, transparent 0, #000 4px, #000 calc(100% - 4px), transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 4px, #000 calc(100% - 4px), transparent 100%)" }}
          className="no-scrollbar snap-x-rail -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1"
        >
          {cards.map((a, i) => {
            const rank = i + 1;
            const first = rank === 1;
            const eps = a.episodes.sub ?? a.episodes.dub ?? null;
            return (
              <Link
                key={a.id}
                href={`/anime/${a.id}`}
                aria-label={`Trending #${rank}: ${a.title}`}
                className={
                  "group block w-[220px] shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost " +
                  "sm:w-[calc((100%-4rem)/5)] sm:min-w-[180px]"
                }
              >
                {/* Card body — image band + title band inside one bordered
                    surface, like the reference. Gently rounded, hairline. */}
                <div className="overflow-hidden rounded-[14px] border border-line/80 bg-surface/60 transition-[border-color,box-shadow,transform] duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
                  style={{ borderColor: first ? "rgba(142,187,255,0.45)" : undefined, boxShadow: first ? "var(--shadow-frost)" : undefined }}
                >
                  <div className="relative aspect-[16/9.4] overflow-hidden bg-surface-2">
                    {a.poster && (
                      <SmartImage
                        src={a.poster}
                        alt=""
                        fill
                        sizes="(max-width:640px) 60vw, 220px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                      />
                    )}
                    {/* Rank numeral, top-left, display serif, big — the
                        reference's strongest signature on this row. */}
                    <span
                      aria-hidden
                      className="font-display pointer-events-none absolute left-3 top-1.5 text-[34px] font-semibold leading-none text-snow [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]"
                    >
                      {rank}
                    </span>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"
                    />
                  </div>
                  <div className="px-3 pb-3 pt-2.5">
                    <h3 className="truncate text-[14px] font-semibold text-snow transition-colors group-hover:text-frost">
                      {a.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
                      {!!a.score && (
                        <span className="flex items-center gap-1 font-semibold text-snow/90">
                          <Star className="size-3 fill-warning text-warning" /> {a.score}
                        </span>
                      )}
                      {a.type && (
                        <>
                          {!!a.score && <span aria-hidden>·</span>}
                          <span>{a.type}</span>
                        </>
                      )}
                      {eps != null && (
                        <>
                          <span aria-hidden>·</span>
                          <span>{eps} eps</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
