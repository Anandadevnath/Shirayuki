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
  Diamond,
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
  // Auto-advance pauses while hovered, focused, or dragging — single flag
  // mirrors LatestEpisodes so both carousels feel identical to the user.
  const [interacting, setInteracting] = useState(false);

  // Only the slides that have been shown (plus the one queued next) mount their
  // heavy key-art. The crossfade is unaffected — every slide's container stays
  // mounted and animates opacity; we just defer the <Image> network requests so
  // first paint fetches one slide's art instead of all N.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    setSeen((prev) => {
      const nextIdx = (active + 1) % n;
      if (prev.has(active) && prev.has(nextIdx)) return prev;
      const next = new Set(prev);
      next.add(active);
      next.add(nextIdx);
      return next;
    });
  }, [active, n]);

  const go = useCallback((idx: number) => setActive(((idx % n) + n) % n), [n]);
  // Wrap-around step used by both keyboard arrows and drag-to-swipe.
  const step = useCallback(
    (dir: 1 | -1) => setActive((p) => (p + dir + n) % n),
    [n],
  );
  // Drag-to-swipe: pointer-down captures the start X, any horizontal move past
  // the 60px threshold steps the carousel once (in the drag direction). The
  // slide change uses the existing opacity crossfade — no rubber-band
  // translation, the image stays put while the drag is in flight.
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  // Auto-rotate — gated on !interacting (hover/focus/drag) and reduced-motion.
  useEffect(() => {
    if (!n || interacting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, interacting]);

  // Keyboard arrows when the section has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  // Pointer / touch swipe. Pointer Events cover mouse + touch + pen in one
  // path; we DON'T capture the pointer on press so that clicks on the Watch
  // Now / My List buttons still fire normally — capture happens on the first
  // horizontal move past the threshold instead, which guarantees a pure
  // press-then-release with no movement still routes to the underlying button.
  // We also don't translate the slide under the cursor — the image stays put
  // while the drag is in flight, and the crossfade swaps to the next slide
  // once the threshold is crossed.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return; // primary button only
    drag.current = { x: e.clientX, moved: false };
    setInteracting(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 60) {
      d.moved = true;
      // Now that we've committed to a drag, capture the pointer so a release
      // outside the section still ends the gesture cleanly.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      step(dx < 0 ? 1 : -1);
    }
  };
  const endDrag = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    drag.current = null;
    setInteracting(false);
  };

  if (!n) return null;
  const a = list[active];
  const eps = totalEpisodes(a);

  return (
    <section
      // Full-bleed: break out of the centered <main> to the true viewport edges.
      // body has overflow-x-clip, so 100vw spans full width with no horizontal scroll.
      className="relative left-1/2 w-screen -translate-x-1/2 -mt-24 overflow-hidden focus:outline-none touch-pan-y select-none"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured anime"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => {
        // Don't release `interacting` mid-drag — the pointer may briefly leave
        // the section as it crosses an internal edge, and we don't want the
        // autoplay timer to restart under the user's finger.
        if (drag.current) return;
        setInteracting(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
    >
      <div className="relative flex h-[82svh] min-h-[600px] max-h-[1000px] w-full flex-col">
        {/* ── Background depth: a single sharp key art (priority on slide 0)
            sits over a CSS-only blurred backdrop painted from the same poster
            URL. The backdrop uses `background-image` (browser cache hit, no
            second `<Image>` pipeline / no extra optimizer pass), so the hero
            makes ONE network request per slide instead of two. Slides that
            haven't been seen yet keep their shimmer placeholder visible. ── */}
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
                {/* CSS-only blurred fill — same URL, browser-cached by the time
                    the sharp <Image> finishes decoding, painted with a single
                    GPU-composited background. */}
                {seen.has(idx) && (
                  <div
                    aria-hidden
                    style={{ backgroundImage: `url(${s.poster})` }}
                    className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
                  />
                )}
                {seen.has(idx) ? (
                  <Image
                    src={s.poster}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover object-[center_22%] brightness-[0.82]"
                    priority={idx === 0}
                  />
                ) : (
                  /* Skeleton-grade placeholder for unseen slides; matches the
                     exact dimensions of the sharp <Image> so when it swaps in
                     there's zero layout shift. */
                  <div className="absolute inset-0 bg-surface-2 shimmer" />
                )}
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

        {/* ── Right vertical diamond nav — one facet per slide ── */}
        {n > 1 && (
          <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 sm:right-7 sm:flex">
            {list.map((_, idx) => (
              <button
                key={idx}
                onClick={() => go(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === active}
                className="group grid place-items-center p-1 transition-transform hover:scale-125"
              >
                <Diamond
                  className={cn(
                    "transition-[color,fill]",
                    idx === active
                      ? "size-3.5 fill-frost text-frost drop-shadow-[var(--shadow-neon)]"
                      : "size-2.5 fill-snow/25 text-snow/25 group-hover:fill-snow/60 group-hover:text-snow/60",
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Copy + CTAs, anchored to the upper-left so the lower band stays
            clear for the Trending rail that tucks up beneath the hero. ── */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-xl flex-col gap-4">
              <h1 className="font-display text-3xl font-extrabold leading-[1.04] [text-shadow:0_2px_28px_rgba(0,0,0,0.8)] sm:text-4xl md:text-5xl">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}