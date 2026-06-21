import Link from "next/link";
import { Play, Star } from "lucide-react";
import { memo } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";
import { SmartImage } from "@/components/ui/SmartImage";
import { EpBadges, TypePill } from "./Badges";

/**
 * Poster-card. The "cinematic reveal" look: a still poster with a calm bottom
 * scrim and an always-legible title; on hover the art zooms a touch, the scrim
 * deepens, and a meta + "Watch" row glides open beneath the title using
 * opacity + transform (GPU-composited, no layout invalidation of glass panels).
 */
export const AnimeCard = memo(function AnimeCard({
  anime,
  variant = "poster",
  className,
  style,
}: {
  anime: AnimeCardModel;
  variant?: "poster" | "row";
  className?: string;
  style?: React.CSSProperties;
}) {
  if (variant === "row") {
    return (
      <Link
        href={`/anime/${anime.id}`}
        style={style}
        className={cn(
          "group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-2",
          className,
        )}
      >
        <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-2">
          {anime.poster && (
            <SmartImage src={anime.poster} alt="" fill sizes="48px" className="object-cover" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium text-snow group-hover:text-frost">
            {anime.title}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <TypePill type={anime.type} />
            <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          </span>
        </span>
      </Link>
    );
  }

  const epNum = typeof anime.episodeNumber === "number" ? anime.episodeNumber : null;

  const poster = anime.poster ? (
    <SmartImage
      src={anime.poster}
      alt={anime.title}
      fill
      sizes="(max-width:640px) 40vw, (max-width:1024px) 22vw, 180px"
      className="object-cover"
    />
  ) : (
    <div className="grid h-full place-items-center text-faint">No image</div>
  );

  /** Top-right marker: current episode, else score. */
  const topRight = epNum != null ? (
    <span className="absolute right-2 top-2 rounded-md bg-frost-soft px-1.5 py-0.5 text-[10px] font-bold text-frost">
      EP {epNum}
    </span>
  ) : (
    !!anime.score && (
      <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-base/85 px-1.5 py-0.5 text-[10px] font-bold text-snow">
        <Star className="size-2.5 fill-warning text-warning" /> {anime.score}
      </span>
    )
  );

  return (
    <Link href={`/anime/${anime.id}`} style={style} className={cn("group block snap-start", className)}>
      {/* Lift wrapper carries the only transform on the card body. The two
          shadow layers live here (outside the frame's overflow clip) and
          cross-fade via opacity — far cheaper than re-rasterising a blurred
          box-shadow every frame. transform-gpu is enough to keep the lift
          on the compositor; a permanent `will-change` on every card adds
          up to hundreds of layers on the home page. */}
      <div className="relative transform-gpu transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.25rem] shadow-[var(--shadow-soft)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 shadow-[var(--shadow-frost)] transition-opacity duration-300 ease-out group-hover:opacity-100"
        />

        {/* Frame: static `ring-1 ring-line` so the resting state is identical
            to before, plus a sibling overlay that paints the frosted hover
            ring at opacity-0 → 100%. Avoids the box-shadow transition
            (which forces a full repaint of the card body on every hover
            frame) while preserving the visual. */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-surface-2 ring-1 ring-line/80">
          {/* Frosted hover ring — opacity cross-fade, GPU-composited */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] ring-1 ring-frost/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />
          {/* Poster — gentle cinematic push-in on hover */}
          <div className="absolute inset-0 transform-gpu transition-transform duration-300 ease-out group-hover:scale-[1.06]">
            {poster}
          </div>

          {/* Top hairline highlight — the light-catch that reads as "glass/premium" */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />

          {/* Bottom scrim — base layer + a deeper layer that fades in on hover
              (opacity cross-fade, no per-frame gradient repaint). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/55 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/75 to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />

          {/* Top badges */}
          <div className="absolute left-2.5 top-2.5">
            <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          </div>
          {topRight}

          {/* Bottom content */}
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-snow [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
              {anime.title}
            </h3>

            {/* Reveal row: composited fade + slide on hover. The wrapper takes its
                natural height at all times (so the row's footprint is always
                reserved inside the bottom content overlay → always inside the
                card frame, never below it). The inner strip is opacity-0 at
                rest and translates down a touch; on hover it fades and slides
                up. Both opacity and transform are GPU-composited — no layout
                invalidation of the parent's backdrop-filter, so hover stays
                smooth inside glass panels like QuickLists. */}
            <div className="flex translate-y-1 transform-gpu items-center gap-2 pt-2.5 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100">
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
    </Link>
  );
});
