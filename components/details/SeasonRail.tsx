import Link from "next/link";
import { Play } from "lucide-react";
import type { SeasonModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";

/**
 * Season rail — same landscape [3/2] card + oversized chart-number overlay
 * as the home Trending rail, so the two ranked rails share one visual
 * language. The number here is the season's position in the franchise
 * (derived from `order`/`season`/`part`) and is what makes the rail read
 * as a "seasons chart" rather than a flat poster strip.
 *
 * The current season keeps the "Current" pill (mirrors how Trending marks
 * its chart-top entry with "Hot") so the visual vocabulary stays parallel.
 */
export function SeasonRail({
  title = "Seasons",
  items,
  currentId,
}: {
  title?: string;
  items: SeasonModel[];
  currentId?: string;
}) {
  if (!items?.length) return null;

  // Sort by `order` so the provider can reorder without breaking the UI; fall
  // back to season+part as a deterministic secondary key.
  const ordered = [...items].sort((a, b) => {
    const ao = a.order ?? (a.season ?? 0) * 10 + (a.part ?? 0);
    const bo = b.order ?? (b.season ?? 0) * 10 + (b.part ?? 0);
    return ao - bo;
  });

  return (
    <RailShell title={title} eyebrow="Franchise">
      {ordered.map((s, i) => {
        const isCurrent = s.isCurrent || s.id === currentId;
        // Display label: prefer provider "season" (e.g. "2"), then part
        // ("Part 2"), then fall back to the sorted position. Falls back to
        // ordinal when the provider didn't supply a season number (some
        // movie/special entries), so the rail always reads as a ranked list.
        const label =
          s.season != null
            ? `S${s.season}${s.part != null && s.part > 1 ? `·${s.part}` : ""}`
            : s.part != null
              ? `Part ${s.part}`
              : String(i + 1);
        const top3 = i < 3;

        return (
          <Link
            key={s.id}
            href={`/anime/${s.id}`}
            style={{ ["--reveal-delay" as string]: `${Math.min(i, 9) * 60}ms` }}
            className="reveal group block w-44 shrink-0 snap-start sm:w-52 md:w-56"
          >
            <div
              className={cn(
                "relative aspect-[3/2] overflow-hidden rounded-2xl bg-surface-2 ring-1 transition-all duration-300 ease-out",
                isCurrent
                  ? "ring-frost shadow-[var(--shadow-frost)]"
                  : top3
                    ? "ring-frost/40 group-hover:-translate-y-1 group-hover:ring-frost group-hover:shadow-[var(--shadow-frost)]"
                    : "ring-line group-hover:-translate-y-1 group-hover:ring-frost/60 group-hover:shadow-[var(--shadow-frost)]",
              )}
            >
              {s.poster ? (
                <SmartImage
                  src={s.poster}
                  alt={s.title}
                  fill
                  sizes="(max-width:640px) 44vw, (max-width:1024px) 24vw, 224px"
                  className="object-cover brightness-[0.88] transition-[filter] duration-300 group-hover:brightness-110"
                />
              ) : (
                <div className="grid h-full place-items-center text-faint">No image</div>
              )}

              {/* Deep bottom scrim — seats the oversized number + title */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/35 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

              {/* Hover frost wash — tints the art instead of zooming it */}
              <div className="pointer-events-none absolute inset-0 bg-frost-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Year pill (top-right) — keeps the chronology legible at a
                  glance, same role as before but repositioned to match the
                  larger layout. */}
              {s.year && (
                <span className="absolute right-2 top-2 rounded-md bg-base/80 px-1.5 py-0.5 text-[10px] font-bold text-snow backdrop-blur">
                  {s.year}
                </span>
              )}

              {/* Current season pill (top-left) — mirrors Trending's "Hot" */}
              {isCurrent && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-frost/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-base shadow-[var(--shadow-neon)]">
                  <Play className="size-2.5 fill-current" /> Current
                </span>
              )}

              {/* Hover play affordance */}
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="grid size-11 scale-75 place-items-center rounded-full bg-frost/90 text-base shadow-[var(--shadow-neon)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
                  <Play className="size-5 fill-current" />
                </span>
              </span>

              {/* Season label (top) + title (bottom), stacked for room */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-2.5">
                <span
                  className={cn(
                    "font-display text-xl font-extrabold leading-none tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-2xl",
                    isCurrent || top3 ? "text-frost" : "text-snow",
                  )}
                  style={{
                    WebkitTextStroke: isCurrent || top3
                      ? "1px var(--color-frost)"
                      : "0.5px rgba(255,255,255,0.5)",
                  }}
                >
                  {label}
                </span>
                <span className="line-clamp-2 text-left text-[11px] font-semibold leading-tight text-snow drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
                  {s.title}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </RailShell>
  );
}