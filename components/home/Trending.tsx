"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { cn } from "@/lib/utils/cn";

/**
 * Trending rail — ranked landscape cards with oversized chart numbers. Lifted
 * out of the hero so it stands as its own section above Latest Episodes.
 */
export function Trending({ items }: { items: AnimeCardModel[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!items?.length) return null;

  return (
    <section className="relative">
      <SectionHeader title="Trending" eyebrow="Hot right now">
        <div className="hidden gap-1.5 sm:flex">
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
      </SectionHeader>

      <div ref={railRef} className="no-scrollbar flex gap-3.5 overflow-x-auto px-0.5 pb-4 pt-3">
        {items.map((s, idx) => {
          const rank = typeof s.rank === "number" ? s.rank : idx + 1;
          const top3 = rank <= 3;
          return (
            <Link
              key={`${s.id}-${idx}`}
              href={`/anime/${s.id}`}
              aria-label={s.title}
              className={cn(
                "group relative aspect-[3/2] w-44 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-frost)] sm:w-52 md:w-56",
                top3 ? "ring-frost/40 hover:ring-frost" : "ring-line hover:ring-frost/60",
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
                <span className="grid size-11 scale-75 place-items-center rounded-full bg-frost/90 text-base shadow-[var(--shadow-neon)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
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
    </section>
  );
}
