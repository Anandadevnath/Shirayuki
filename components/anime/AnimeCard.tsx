import Link from "next/link";
import { Play, Star, Captions, Mic } from "lucide-react";
import { memo, type ReactNode } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";
import { SmartImage } from "@/components/ui/SmartImage";
import { EpBadges, TypePill } from "./Badges";

/**
 * Poster-card look. Flip this one line to compare the three concepts:
 *  - "minimal" — Apple/Linear: clean poster, title on a soft gradient.
 *  - "glass"   — frosted info bar floating inside the poster.
 *  - "saas"    — Stripe/Vercel: solid integrated bottom panel + tinted chips.
 * All three share an aspect-[3/4] frame with the caption folded INTO the card
 * (no external text block), which is what makes them ~22–26% shorter than the
 * old aspect-[2/3] poster + 2-line footer.
 */
const CARD_DESIGN: "minimal" | "glass" | "saas" | "cinematic" = "cinematic";

const FRAME =
  "relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2 shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-200 group-hover:-translate-y-0.5 group-hover:ring-frost/40 group-hover:shadow-[var(--shadow-frost)]";

/** Small tinted chip used by the SaaS concept's meta row. */
function Chip({
  icon: Icon,
  tint = "muted",
  children,
}: {
  icon?: typeof Captions;
  tint?: "frost" | "sakura" | "muted";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none",
        tint === "frost" && "bg-frost-soft text-frost",
        tint === "sakura" && "bg-sakura/15 text-sakura",
        tint === "muted" && "bg-surface-2 text-muted",
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

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
  const meta = [anime.type, anime.jname].filter(Boolean).join(" · ");

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

  const playGlyph = (
    <span className="grid size-10 place-items-center rounded-full glass text-frost shadow-[var(--shadow-neon)]">
      <Play className="size-4 translate-x-0.5 fill-current" />
    </span>
  );

  // ── Concept D: Cinematic Reveal (poster zoom + sliding meta/watch row) ─────
  // The look premium streaming boards converge on: a still poster with a calm
  // bottom scrim and an always-legible title; on hover the art zooms a touch,
  // the scrim deepens, and a meta + "Watch" row glides open beneath the title
  // using a 0fr→1fr grid expand (animates height with no magic pixel values).
  if (CARD_DESIGN === "cinematic") {
    return (
      <Link href={`/anime/${anime.id}`} style={style} className={cn("group block snap-start", className)}>
        {/* Lift wrapper carries the only transform on the card body. The two
            shadow layers live here (outside the frame's overflow clip) and
            cross-fade via opacity — far cheaper than re-rasterising a blurred
            box-shadow every frame. */}
        <div className="relative transform-gpu transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-1.5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] shadow-[var(--shadow-soft)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 shadow-[var(--shadow-frost)] transition-opacity duration-300 ease-out group-hover:opacity-100"
          />

          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-surface-2 ring-1 ring-line/80 transition-[box-shadow] duration-300 ease-out group-hover:ring-frost/50">
            {/* Poster — gentle cinematic push-in on hover */}
            <div className="absolute inset-0 transform-gpu transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.06]">
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
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-snow drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
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
            <div className="flex translate-y-1 transform-gpu items-center gap-2 pt-2.5 opacity-0 transition-[transform,opacity] duration-300 ease-out will-change-[transform,opacity] group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100">
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
  }

  // ── Concept A: Minimal Premium (clean borderless poster) ──────────────────
  if (CARD_DESIGN === "minimal") {
    return (
      <Link href={`/anime/${anime.id}`} className={cn("group block snap-start", className)}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2 shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:ring-frost/45 group-hover:shadow-[var(--shadow-frost)]">
          {poster}

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-base via-base/45 to-transparent" />

          <div className="absolute left-2.5 top-2.5">
            <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          </div>
          {topRight}

          <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {playGlyph}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-snow drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] transition-colors group-hover:text-frost">
              {anime.title}
            </h3>
            {meta && (
              <p className="mt-1 line-clamp-1 text-[11px] font-medium text-muted/90">{meta}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ── Concept B: Premium Glassmorphism ─────────────────────────────────────
  if (CARD_DESIGN === "glass") {
    return (
      <Link
        href={`/anime/${anime.id}`}
        className={cn("group relative block snap-start", className)}
      >
        {/* Ambient light — a soft coloured glow that blooms behind the card on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] bg-[radial-gradient(ellipse_at_center,var(--color-frost)_0%,var(--color-frost-deep)_40%,transparent_70%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
        />

        {/* Gradient border — light catches the top edge, brightens to frost on hover */}
        <div className="rounded-[20px] bg-gradient-to-b from-white/20 via-white/[0.06] to-white/[0.02] p-px shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7),0_2px_8px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:from-frost/50 group-hover:shadow-[0_22px_55px_-14px_rgba(0,0,0,0.8),0_0_0_1px_color-mix(in_oklch,var(--color-frost)_55%,transparent),var(--shadow-neon)]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[19px] bg-surface-2">
            {poster}

            {/* Depth scrim + inner top highlight (glass reflection) */}
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/25 to-base/5" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
            />

            {/* Diagonal light streak that sweeps across on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[160%] skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[260%] group-hover:opacity-100"
            />

            <div className="absolute left-2.5 top-2.5">
              <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
            </div>
            {topRight}

            {/* Frosted info bar — its own border + inner highlight + soft shadow */}
            <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] p-2.5 backdrop-blur-md shadow-[0_4px_18px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)]">
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-semibold tracking-tight text-snow transition-colors group-hover:text-frost">
                  {anime.title}
                </span>
                {meta && (
                  <span className="mt-0.5 line-clamp-1 text-[11px] text-muted">{meta}</span>
                )}
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-frost to-frost-deep text-base shadow-[var(--shadow-neon)] transition-transform duration-300 ease-out group-hover:scale-110">
                <Play className="size-4 translate-x-px fill-current" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Concept C: High-End SaaS ─────────────────────────────────────────────
  return (
    <Link href={`/anime/${anime.id}`} className={cn("group block snap-start", className)}>
      <div className={FRAME}>
        {poster}
        {topRight}

        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {playGlyph}
        </div>

        {/* Solid integrated panel attached to the image bottom */}
        <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/95 px-2.5 py-2 backdrop-blur-md">
          <h3 className="line-clamp-1 text-[13px] font-semibold leading-tight text-snow transition-colors group-hover:text-frost">
            {anime.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {!!anime.episodes.sub && (
              <Chip icon={Captions} tint="frost">
                {anime.episodes.sub}
              </Chip>
            )}
            {!!anime.episodes.dub && (
              <Chip icon={Mic} tint="sakura">
                {anime.episodes.dub}
              </Chip>
            )}
            {anime.type && <Chip>{anime.type}</Chip>}
          </div>
        </div>
      </div>
    </Link>
  );
});
