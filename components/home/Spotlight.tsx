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
      aria-label={`${added ? "Remove from" : "Add to"} My List: ${anime.title}`}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold backdrop-blur-md transition-colors press",
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

  /** Staggered hero-copy chain — one increasing delay per content group. */
  const heroDelay = (ms: number) =>
    ({ "--hero-delay": `${ms}ms` }) as React.CSSProperties;

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
      <div className="relative flex h-[94svh] min-h-[min(680px,94svh)] max-h-[1120px] w-full flex-col">
        {/* ── Background depth: a single sharp key art (priority on slide 0)
            sits over a blurred backdrop painted from the same poster URL. The
            backdrop is a SECOND <Image> at quality={50} so it goes through
            the optimizer (AVIF/WebP, srcset) — the previous CSS
            background-image variant fetched the raw upstream bytes (no AVIF,
            no srcset, bypassed the remotePatterns allowlist). Slides that
            haven't been seen yet keep their shimmer placeholder visible. ── */}
        <div className="absolute inset-0">
          {list.map((s, idx) =>
            s.poster ? (
              <div
                key={s.id}
                className={cn(
                  // Slide swap crossfade — 800ms so the outgoing art lingers
                  // a beat and the change reads as a dissolve, not a blink.
                  "hero-slide-fade absolute inset-0",
                  idx === active ? "opacity-100" : "opacity-0",
                )}
              >
                {/* Blurred fill — same URL, AVIF/WebP via next/image, paints
                    underneath the sharp key art. quality=50 is small enough
                    to keep the blurred backdrop cheap; the 2.4x scale + blur
                    hides any softness. Its settle animation runs at a
                    different rate than the sharp art (9s vs 7.5s), which
                    separates the two planes into a restrained parallax. */}
                {seen.has(idx) && (
                  <Image
                    src={s.poster}
                    alt=""
                    aria-hidden
                    fill
                    sizes="100vw"
                    quality={50}
                    className={cn(
                      "scale-110 object-cover opacity-60 blur-2xl",
                      idx === active && "hero-backdrop-art",
                    )}
                  />
                )}
                {seen.has(idx) ? (
                  <Image
                    src={s.poster}
                    alt=""
                    fill
                    sizes="100vw"
                    className={cn(
                      "object-cover object-[center_22%] brightness-[0.82]",
                      // Cinematic settle: each activation starts from a 4.5%
                      // zoom and eases to rest over 7.5s — slower than the
                      // 7s autoplay cadence, so art is always winding down
                      // whenever a change lands. Transform-only; the art
                      // never drives layout. Removing the class on the
                      // inactive slide resets scale to 1 invisibly (opacity
                      // is 0), so the next activation zooms fresh.
                      idx === active && "hero-art",
                    )}
                    priority={idx === 0}
                  />
                ) : (
                  /* Skeleton-grade placeholder for unseen slides; matches the
                     exact dimensions of the sharp <Image> so when it swaps in
                     there's zero layout shift. */
                  <div className="absolute inset-0 bg-surface-2 shimmer-loop" />
                )}
              </div>
            ) : null,
          )}
        </div>

        {/* ── Atmospheric light — two low-opacity frost light fields that
            drift on long transform-only loops (26s / 32s). They sit ABOVE
            the art and BELOW every scrim + text layer, so they read as
            ambient scene lighting, never as a veil over the copy, and are
            frozen entirely under reduced-motion. ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-a absolute -left-[12%] top-[12%] h-[62%] w-[55%] rounded-full bg-frost/10 blur-[130px]" />
          <div className="aurora-b absolute -right-[10%] top-[38%] h-[58%] w-[46%] rounded-full bg-frost-deep/10 blur-[140px]" />
        </div>

        {/* Cinematic scrims — a gentle vignette so the art reads as one calm
            scene: darker at the edges and base, lighter through the middle. The
            top scrim extends well above the hero's visible top (h-56 / 14rem)
            and starts at full opacity, so the navbar region feels like part of
            the same downward-fading gradient rather than a separate "header
            zone". The leading edge sits at the absolute top of the section,
            so the navbar (which overlaps the section via -mt-24) blends into
            the gradient instead of clipping it. */}
        <div className="absolute inset-0 bg-gradient-to-r from-base/90 via-base/35 to-base/60" />
        {/* Bottom scrim — a tall, feathered cinematic fade so the key art melts
            into the dark page instead of ending in a hard band. Kept lighter
            and airier than before: the darkness stays seated near the very
            bottom edge (via sits at ~32% with a soft /30 tone), and the long
            transparent tail feathers out through the middle of the hero. So
            the art glows through the whole band, the Trending section below
            reads clearly, and the transition into the next section stays
            smooth — no dense pocket of darkness to trip the eye. */}
        <div className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-base/85 from-6% via-base/30 via-32% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-base/85 via-base/55 via-35% via-base/25 to-transparent" />

        {/* ── Left vertical "featured" strip — one-shot entrance alongside
            the first copy cascade ── */}
        <div
          className="hero-in pointer-events-none absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
          style={heroDelay(520)}
        >
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

        {/* ── Carousel nav happens via the right-edge diamond facets (direct-slide
            jumps), keyboard arrows and drag-to-swipe. The old prev / next arrow
            buttons were removed for a clean, chrome-free banner. ── */}

        {/* ── Copy + CTAs, centred in the full-height hero with a slight
            upward bias (pb-[8vh]) so the block sits comfortably above the
            bottom fade — balanced composition, nothing tucks under the hero.

            Choreography: the text stack is keyed by the active slide, so
            every change replays a staggered rise (title → meta → synopsis
            → stats, 90ms apart, ~0.7s each). The CTA row is intentionally
            NOT keyed — the buttons stay planted under the cursor between
            slide changes (remounting them both flickers the My List state
            and yanks click targets mid-interaction). ── */}
        <div className="relative z-10 flex flex-1 items-center pb-[8vh]">
          <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-xl flex-col gap-4">
              {/* Line-clamped rows keep per-slide text heights stable, so the
                  keyed re-render can never shift layout — the hero's own
                  height is viewport-fixed and everything inside is
                  height-capped. */}
              <div key={active} className="contents">
                <h2
                  className="hero-in font-display text-3xl font-extrabold leading-[1.04] [text-shadow:0_2px_28px_rgba(0,0,0,0.8)] sm:text-4xl md:text-5xl"
                  style={heroDelay(60)}
                >
                  <span className="line-clamp-2">{a.title}</span>
                </h2>

                {/* Metadata row — real fields only */}
                <div
                  className="hero-in flex flex-wrap items-center gap-2 text-xs text-muted sm:text-sm"
                  style={heroDelay(150)}
                >
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
                  <p
                    className="hero-in max-w-lg text-sm leading-relaxed text-muted/90 [@media(max-height:480px)]:hidden sm:line-clamp-2"
                    style={heroDelay(240)}
                  >
                    {truncate(a.description, 170)}
                  </p>
                )}

                {/* Stats row */}
                <div
                  className="hero-in flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-snow [@media(max-height:480px)]:hidden"
                  style={heroDelay(330)}
                >
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
              </div>

              {/* CTAs — stable across slide changes */}
              <div className="hero-in mt-1 flex items-center gap-3" style={heroDelay(430)}>
                <Link
                  href={`/watch/${a.id}`}
                  className="press flex items-center gap-2 rounded-2xl bg-frost px-7 py-3 text-sm font-semibold text-base shadow-[var(--shadow-neon)]"
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