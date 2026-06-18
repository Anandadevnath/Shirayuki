"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EpBadges } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

// Soft fade on the rail's right edge so the horizontally-clipped card reads as
// "more to come". A touch wider than the poster rail because the 3D cards lift
// and glow well past their own box.
const RAIL_FADE =
  "linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 3rem), transparent 100%)";

const MAX_TILT = 12; // degrees

/**
 * One 3D "floating poster" — the cinematic, depth-layered card the Latest
 * Episodes shelf is built from. Pointer position drives a perspective tilt
 * (rotateX/rotateY) while the artwork, glow and meta sit on separate Z planes
 * so the whole thing parallaxes like a physical card under glass. All motion is
 * GPU-composited (transform/opacity only) and disabled under reduced-motion.
 */
function Card3D({ anime, className }: { anime: AnimeCardModel; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const raf = useRef<number | null>(null);

  const epNum = typeof anime.episodeNumber === "number" ? anime.episodeNumber : null;

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    const { left, top, width, height } = el.getBoundingClientRect();
    const px = (e.clientX - left) / width; // 0..1
    const py = (e.clientY - top) / height; // 0..1
    raf.current = requestAnimationFrame(() => {
      // Center is (0.5, 0.5) → 0 tilt. Edges → ±MAX_TILT.
      const ry = (px - 0.5) * 2 * MAX_TILT;
      const rx = -(py - 0.5) * 2 * MAX_TILT;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      // Glare follows the pointer.
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <Link
      ref={ref}
      href={`/anime/${anime.id}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ perspective: "900px" }}
      className={cn("group relative block shrink-0 snap-start", className)}
    >
      {/* Ambient floor glow — a frost halo that blooms beneath/behind the card
          as it lifts, selling the "hovering above the page" depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_var(--mx,50%)_var(--my,40%),var(--color-frost)_0%,var(--color-frost-deep)_38%,transparent_72%)] opacity-0 blur-2xl transition-opacity duration-500 ease-out group-hover:opacity-30"
      />

      {/* Tilt stage — the only element that rotates. Children sit on their own
          translateZ planes for parallax. */}
      <div
        className={cn(
          "relative transform-gpu transition-transform duration-300 ease-out will-change-transform",
          "[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
          "[transform-style:preserve-3d] group-hover:duration-100",
          "motion-reduce:[transform:none]",
        )}
      >
        {/* Lift + frame */}
        <div className="relative aspect-[3/4] translate-z-0 overflow-hidden rounded-[1.4rem] bg-surface-2 ring-1 ring-line/80 shadow-[var(--shadow-soft)] transition-[box-shadow,transform] duration-300 ease-out [transform:translateZ(0px)] group-hover:-translate-y-1 group-hover:ring-frost/50 group-hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85),var(--shadow-frost)]">
          {/* Poster — pushed slightly BACK so the meta/glare float above it */}
          <div className="absolute inset-0 [transform:translateZ(-16px)] scale-[1.08] transform-gpu transition-transform duration-300 ease-out group-hover:scale-[1.14]">
            {anime.poster ? (
              <Image
                src={anime.poster}
                alt={anime.title}
                fill
                sizes="(max-width:640px) 60vw, (max-width:1024px) 32vw, 240px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-faint">No image</div>
            )}
          </div>

          {/* Scrim */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/55 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/80 to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />

          {/* Pointer-tracked glare — the wet-glass highlight that makes the tilt
              feel like light raking across a physical surface. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(40% 40% at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.55), transparent 60%)",
            }}
          />
          {/* Top hairline highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
          />

          {/* Badges — lifted forward */}
          <div className="absolute left-3 top-3 [transform:translateZ(40px)]">
            <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          </div>
          {epNum != null && (
            <span className="absolute right-3 top-3 rounded-md bg-frost-soft px-2 py-0.5 text-[10px] font-bold text-frost backdrop-blur-sm [transform:translateZ(40px)]">
              EP {epNum}
            </span>
          )}

          {/* Bottom content — lifted furthest forward for parallax */}
          <div className="absolute inset-x-0 bottom-0 p-4 [transform:translateZ(60px)]">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-snow drop-shadow-[0_1px_10px_rgba(0,0,0,0.95)] transition-colors group-hover:text-frost">
              {anime.title}
            </h3>

            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] motion-reduce:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <div className="flex translate-y-1 items-center gap-2 pt-3 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-frost to-frost-deep px-3 py-1 text-[11px] font-bold text-base shadow-[var(--shadow-neon)]">
                    <Play className="size-3 translate-x-px fill-current" /> Watch
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
      </div>
    </Link>
  );
}

export function LatestEpisodes({ items }: { items: AnimeCardModel[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <SectionHeader title="Latest Episodes" eyebrow="Just aired">
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </SectionHeader>

      <div
        ref={ref}
        style={{ maskImage: RAIL_FADE, WebkitMaskImage: RAIL_FADE }}
        className="no-scrollbar snap-x-rail -mx-2 flex gap-5 overflow-x-auto overflow-y-visible scroll-pl-2 px-2 pb-8 pt-5"
      >
        {items.map((a) => (
          <Card3D
            key={`${a.id}-${a.episodeNumber ?? ""}`}
            anime={a}
            className="w-[52vw] sm:w-[30vw] md:w-[220px]"
          />
        ))}
      </div>
    </section>
  );
}
