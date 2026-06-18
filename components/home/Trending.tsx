"use client";

import { useRef } from "react";
import Link from "next/link";
import { Play, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";

// Marquee drift speed, px/s. The rail glides right-to-left so it reads as a
// "train" of posters — deliberately the opposite direction to Latest Episodes.
const SPEED = 34;

/** One ranked landscape card. Pulled out so the marquee and the reduced-motion
 *  fallback rail can share the exact same markup. */
function TrendCard({
  s,
  rank,
  ariaHidden = false,
}: {
  s: AnimeCardModel;
  rank: number;
  ariaHidden?: boolean;
}) {
  const top3 = rank <= 3;
  return (
    <Link
      href={`/anime/${s.id}`}
      aria-label={s.title}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className={cn(
        "group relative aspect-[3/2] w-44 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-frost)] sm:w-52 md:w-56",
        top3 ? "ring-frost/40 hover:ring-frost" : "ring-line hover:ring-frost/60",
      )}
    >
      {s.poster && (
        <SmartImage
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
}

/**
 * Trending rail — ranked landscape cards with oversized chart numbers. The rail
 * auto-drifts as an endless right-to-left marquee (a doubled track wrapped at
 * its half-width) and freezes the instant a pointer or touch lands on it.
 * Reduced-motion users get the original arrow-driven scroll rail instead.
 */
export function Trending({ items }: { items: AnimeCardModel[] }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const paused = useRef(false);

  // Continuous leftward drift, wrapped seamlessly at half the doubled track.
  useAnimationFrame((_, delta) => {
    if (reduce || paused.current || !trackRef.current) return;
    const half = trackRef.current.scrollWidth / 2;
    if (!half) return;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -half) next += half; // loop back into the first copy
    x.set(next);
  });

  const setPaused = (v: boolean) => {
    paused.current = v;
  };

  // Reduced-motion fallback: manual scroll by ~a viewport-worth.
  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!items?.length) return null;

  const rankOf = (s: AnimeCardModel, i: number) =>
    typeof s.rank === "number" ? s.rank : i + 1;

  return (
    <section className="relative">
      {/* Editorial header — frost accent bar + stacked eyebrow/title, with
          scroll arrows on the right (reduced-motion only). */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-frost to-frost-deep shadow-[var(--shadow-neon)]" />
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-frost">
              <motion.span
                aria-hidden
                animate={reduce ? {} : { rotate: [0, -10, 10, -6, 0], scale: [1, 1.18, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Flame className="size-3.5 fill-frost/25" />
              </motion.span>
              Hot right now
            </span>
            <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              Trending
            </h2>
          </div>
        </div>

        {reduce && (
          <div className="ml-auto hidden shrink-0 gap-1.5 sm:flex">
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
        )}
      </div>

      {reduce ? (
        // Static, manually scrollable rail for reduced-motion users.
        <div ref={railRef} className="no-scrollbar flex gap-3.5 overflow-x-auto px-0.5 pb-4 pt-3">
          {items.map((s, idx) => (
            <TrendCard key={`${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} />
          ))}
        </div>
      ) : (
        // Auto-drifting marquee — pauses on any pointer/touch interaction.
        <div
          className="relative overflow-hidden"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onTouchCancel={() => setPaused(false)}
        >
          {/* Edge fades so cards melt in/out of the track instead of clipping */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-base to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-base to-transparent"
          />

          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex w-max gap-3.5 px-0.5 pb-4 pt-3 will-change-transform"
          >
            {/* Doubled track: the second copy is decorative (hidden from a11y). */}
            {items.map((s, idx) => (
              <TrendCard key={`a-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} />
            ))}
            {items.map((s, idx) => (
              <TrendCard key={`b-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} ariaHidden />
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
