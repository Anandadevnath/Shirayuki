"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";
import { useReducedMotionSSR } from "@/lib/utils/useReducedMotion";

// Marquee drift speed, px/s. The rail glides right-to-left so it reads as a
// "train" of posters — deliberately the opposite direction to Latest Episodes.
const SPEED = 34;

/** Read the live translateX of an element — works mid-animation, where the
 *  computed `transform` is an interpolated matrix. Used to freeze the marquee
 *  exactly where it is the instant an arrow is pressed. */
function readTranslateX(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  try {
    return new DOMMatrixReadOnly(t).m41;
  } catch {
    return 0;
  }
}

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
  const reduce = useReducedMotionSSR();
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  // Current eased offset of the manually-nudged marquee (px, ≤ 0) and the timer
  // that hands control back to the auto-drift once the user stops clicking.
  const offsetRef = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Continuous leftward drift, wrapped seamlessly at half the doubled track.
  // The animation runs as a pure CSS keyframe (off the main thread) and pauses
  // via a `:hover` rule on the container — see `.trend-marquee` in globals.css.
  // We measure the half-width here only so reduced-motion / paused branches
  // can fall back to a JS-driven offset if needed.
  useEffect(() => {
    if (reduce) return;
    const el = trackRef.current;
    if (!el) return;
    // Pre-compute the animation duration from the half-width so the linear
    // marquee speed matches the previous JS implementation (SPEED px/s). We
    // measure once on mount + on resize; if the track is empty the duration
    // is 0 and the CSS animation just doesn't move.
    const measure = () => {
      const half = el.scrollWidth / 2;
      const seconds = half > 0 ? half / SPEED : 0;
      el.style.setProperty("--trend-duration", `${seconds}s`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduce]);

  // Reduced-motion fallback: manual scroll by ~a viewport-worth.
  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  // Hand the marquee back to its endless CSS drift, picking up exactly where the
  // manual nudge left off: a negative `animation-delay` of offset/SPEED seeks
  // the keyframe (0 → −half over half/SPEED s) to the matching frame.
  const resumeDrift = () => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "";
    el.style.animation = "";
    el.style.animationDelay = `${offsetRef.current / SPEED}s`;
    el.style.animationPlayState = "running";
  };

  // Arrow-driven nudge for the live marquee. Freezes the drift at its current
  // position, then eases one viewport-worth in `dir`. The track is doubled, so
  // we normalise into a single content-set and shift by whole sets (invisible)
  // to keep both edges full — no blank rails however far you click.
  const nudgeMarquee = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    const view = el.parentElement?.clientWidth ?? 0;
    if (half <= 0 || view <= 0) return;

    let from = ((readTranslateX(el) % half) + half) % half - half; // (−half, 0]
    let to = from - dir * view * 0.85;
    while (to > 0) { from -= half; to -= half; }
    while (to < -half) { from += half; to += half; }

    if (idleRef.current) clearTimeout(idleRef.current);

    // Take over from the CSS keyframe with an eased manual transform.
    el.style.animation = "none";
    el.style.transition = "none";
    el.style.transform = `translate3d(${from}px, 0, 0)`;
    void el.offsetWidth; // commit the start frame before transitioning
    requestAnimationFrame(() => {
      el.style.transition = "transform 650ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      el.style.transform = `translate3d(${to}px, 0, 0)`;
    });
    offsetRef.current = to;
    idleRef.current = setTimeout(resumeDrift, 2600);
  };

  const onArrow = (dir: 1 | -1) =>
    reduce ? scrollRail(dir) : nudgeMarquee(dir);

  // Drop the resume timer if we unmount mid-nudge.
  useEffect(() => () => {
    if (idleRef.current) clearTimeout(idleRef.current);
  }, []);

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
              <span aria-hidden className="flame-wobble inline-flex">
                <Flame className="size-3.5 fill-frost/25" />
              </span>
              Hot right now
            </span>
            <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              Trending
            </h2>
          </div>
        </div>

        {/* Manual nudge arrows — frost-glass back / frost-filled forward, the
            same pairing the rest of the site uses. They drive the live marquee
            (or the reduced-motion rail) by ~a viewport per press. */}
        <div className="ml-auto hidden shrink-0 gap-1.5 sm:flex">
          <button
            onClick={() => onArrow(-1)}
            aria-label="Scroll trending left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-[color,border-color,transform] duration-200 hover:border-frost/40 hover:text-snow active:scale-90"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => onArrow(1)}
            aria-label="Scroll trending right"
            className="grid size-8 place-items-center rounded-full bg-frost text-base shadow-[var(--shadow-neon)] transition-transform duration-200 hover:scale-105 active:scale-90"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
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
        // The CSS keyframe animation runs entirely off the main thread; the
        // :hover pause + JS touch-pause give the user full control. The
        // container itself is masked on the left/right edges so cards
        // physically fade into transparency at the rails.
        <div
          className="trend-marquee-wrap group/marquee relative overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 120px, black calc(100% - 120px), transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0, black 120px, black calc(100% - 120px), transparent 100%)",
          }}
          onTouchStart={(e) => {
            const el = trackRef.current;
            if (el) el.style.animationPlayState = "paused";
          }}
          onTouchEnd={(e) => {
            const el = trackRef.current;
            if (el) el.style.animationPlayState = "running";
          }}
          onTouchCancel={(e) => {
            const el = trackRef.current;
            if (el) el.style.animationPlayState = "running";
          }}
        >
          <div
            ref={trackRef}
            className="trend-marquee flex w-max gap-3.5 px-0.5 pb-4 pt-3"
          >
            {/* Doubled track: the second copy is decorative (hidden from a11y).
                Both copies stay mounted so the seamless loop anchor exists,
                but every SmartImage below is rendered with `loading="lazy"`
                (the next/image default). The decorative copy starts ~50%
                off-screen left — modern browsers only fetch its posters as
                they translate into the viewport, so the LCP/INP path never
                pays for them upfront. */}
            {items.map((s, idx) => (
              <TrendCard key={`a-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} />
            ))}
            {items.map((s, idx) => (
              <TrendCard key={`b-${s.id}-${idx}`} s={s} rank={rankOf(s, idx)} ariaHidden />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}