"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EpBadges } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

// ── Coverflow geometry ──────────────────────────────────────────────────────
// Each card is placed relative to the active one. Its offset (i - active) drives
// a 3D transform so neighbours rotate away, sink back on the Z axis and shrink —
// the "floating posters under glass" look from the reference shelves.
const STEP_X = 88; // horizontal travel per card, % of the card's own width
const STEP_Z = 120; // how far back each step sinks, px
const STEP_RY = 34; // yaw per step, deg (clamped so far cards don't over-rotate)
const STEP_SCALE = 0.12; // shrink per step
const VISIBLE = 3; // cards rendered each side of centre; beyond this they fade out

// Shortest signed distance from the active card to card `i` around a ring of
// `len` cards — so the posters at the "end" wrap around and fill the opposite
// side, making the shelf feel endless in both directions.
function wrapOffset(off: number, len: number): number {
  const half = len / 2;
  if (off > half) return off - len;
  if (off < -half) return off + len;
  return off;
}

type Pose = { transform: string; opacity: number; zIndex: number; blur: number };

function pose(offset: number): Pose {
  const abs = Math.abs(offset);
  const dir = Math.sign(offset);
  const x = offset * STEP_X;
  const z = -abs * STEP_Z;
  const ry = -dir * Math.min(abs, 2) * STEP_RY;
  const scale = Math.max(0.6, 1 - abs * STEP_SCALE);
  return {
    transform: `translate3d(calc(-50% + ${x}%), -50%, ${z}px) rotateY(${ry}deg) scale(${scale})`,
    opacity: abs > VISIBLE ? 0 : 1 - abs * 0.16,
    zIndex: 50 - abs,
    blur: abs === 0 ? 0 : Math.min(abs * 1.3, 4),
  };
}

/**
 * One poster in the coverflow. The centre card (`active`) blooms forward with a
 * frost halo and reveals its meta; side cards angle back, dim and, on click,
 * glide to the centre instead of navigating. All motion is transform/opacity
 * only (GPU-composited) and flattened under reduced-motion.
 */
function FlowCard({
  anime,
  offset,
  active,
  onSelect,
}: {
  anime: AnimeCardModel;
  offset: number;
  active: boolean;
  onSelect: () => void;
}) {
  const p = pose(offset);
  const epNum = typeof anime.episodeNumber === "number" ? anime.episodeNumber : null;
  const hidden = Math.abs(offset) > VISIBLE;

  return (
    <Link
      href={`/anime/${anime.id}`}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onClick={(e) => {
        // Side posters pull to centre first; only the focused one navigates.
        if (!active) {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        transform: p.transform,
        opacity: p.opacity,
        zIndex: p.zIndex,
        ["--blur" as string]: `${p.blur}px`,
      }}
      className={cn(
        "group absolute left-1/2 top-1/2 aspect-[3/4] h-full origin-center transform-gpu",
        "transition-[transform,opacity] duration-500 ease-out will-change-transform",
        "cursor-pointer [backface-visibility:hidden] motion-reduce:transition-none",
        hidden && "pointer-events-none",
      )}
    >
      {/* Frost floor-glow — only blooms beneath the centred hero */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-5 -z-10 rounded-[2.4rem] blur-2xl transition-opacity duration-500",
          "bg-[radial-gradient(60%_60%_at_50%_45%,var(--color-frost)_0%,var(--color-frost-deep)_40%,transparent_72%)]",
          active ? "opacity-30" : "opacity-0",
        )}
      />

      {/* The poster frame */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[1.5rem] bg-surface-2 ring-1 transition-[box-shadow,filter] duration-500 ease-out",
          "[filter:blur(var(--blur))]",
          active
            ? "ring-frost/60 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.9),var(--shadow-frost)]"
            : "ring-line/70 shadow-[var(--shadow-soft)]",
        )}
      >
        {anime.poster ? (
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            sizes="(max-width:640px) 60vw, (max-width:1024px) 38vw, 320px"
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              active && "scale-[1.04] group-hover:scale-[1.08]",
            )}
          />
        ) : (
          <div className="grid h-full place-items-center text-faint">No image</div>
        )}

        {/* Recede scrim — non-centre posters darken toward the back of the stack */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-base transition-opacity duration-500"
          style={{ opacity: active ? 0 : Math.min(Math.abs(offset) * 0.22 + 0.18, 0.7) }}
        />

        {/* Bottom gradient for legible meta */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/55 to-transparent"
        />

        {/* Top hairline + raking glare (centre only) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />
        {active && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(45% 45% at 50% 30%, rgba(255,255,255,0.5), transparent 60%)",
            }}
          />
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3">
          <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
        </div>
        {epNum != null && (
          <span className="absolute right-3 top-3 rounded-md bg-frost-soft px-2 py-0.5 text-[10px] font-bold text-frost backdrop-blur-sm">
            EP {epNum}
          </span>
        )}

        {/* Meta — collapsed on side cards, revealed on the hero */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3
            className={cn(
              "line-clamp-2 font-semibold leading-snug tracking-tight text-snow drop-shadow-[0_1px_10px_rgba(0,0,0,0.95)] transition-all duration-500",
              active ? "text-base sm:text-lg" : "text-sm opacity-0",
            )}
          >
            {anime.title}
          </h3>

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
              active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-frost to-frost-deep px-3.5 py-1.5 text-xs font-bold text-base shadow-[var(--shadow-neon)]">
                  <Play className="size-3.5 translate-x-px fill-current" /> Watch
                </span>
                {anime.type && (
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-snow/90">
                    {anime.type}
                  </span>
                )}
                {!!anime.score && (
                  <span className="ml-auto flex items-center gap-0.5 text-[11px] font-bold text-snow/90">
                    <Star className="size-3 fill-warning text-warning" /> {anime.score}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LatestEpisodes({ items }: { items: AnimeCardModel[] }) {
  // Open on the middle card so the fan is balanced on both sides at first paint.
  const [active, setActive] = useState(() => Math.floor(((items?.length ?? 1) - 1) / 2));
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const len = items?.length ?? 0;
  // Wrap-around navigation: stepping past either end loops back to the other.
  const go = useCallback((dir: 1 | -1) => setActive((a) => (a + dir + len) % len), [len]);

  // Keyboard arrows when the stage has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  // Pointer / touch swipe.
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 60 && !d.moved) {
      d.moved = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Keep active valid if the list length changes.
  useEffect(() => {
    setActive((a) => ((a % len) + len) % len);
  }, [len]);

  if (!len) return null;

  return (
    <section className="relative">
      <SectionHeader title="Latest Episodes" eyebrow="Just aired">
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs tabular-nums text-faint sm:block">
            <span className="text-snow">{String(active + 1).padStart(2, "0")}</span>
            {" / "}
            {String(len).padStart(2, "0")}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </SectionHeader>

      {/* 3D stage */}
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Latest episodes"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ perspective: "1800px" }}
        className="relative h-[46vw] max-h-[320px] min-h-[240px] w-full touch-pan-y select-none overflow-x-clip [transform-style:preserve-3d] focus:outline-none"
      >
        {items.map((a, i) => (
          <FlowCard
            key={`${a.id}-${a.episodeNumber ?? i}`}
            anime={a}
            offset={wrapOffset(i - active, len)}
            active={i === active}
            onSelect={() => setActive(i)}
          />
        ))}

        {/* Big edge arrows, like the reference shelf */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          className="absolute left-1 top-1/2 z-[60] hidden -translate-y-1/2 place-items-center rounded-full p-2 text-snow/70 transition hover:scale-110 hover:text-frost sm:grid"
        >
          <ChevronLeft className="size-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next"
          className="absolute right-1 top-1/2 z-[60] hidden -translate-y-1/2 place-items-center rounded-full p-2 text-snow/70 transition hover:scale-110 hover:text-frost sm:grid"
        >
          <ChevronRight className="size-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Progress track */}
      <div className="mx-auto mt-2 h-0.5 w-32 overflow-hidden rounded-full bg-line/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-frost to-frost-deep transition-[width] duration-500 ease-out"
          style={{ width: `${((active + 1) / len) * 100}%` }}
        />
      </div>
    </section>
  );
}
