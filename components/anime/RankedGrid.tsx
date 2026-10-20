"use client";

import { useEffect } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";
import { cn } from "@/lib/utils/cn";
import { useGridColumns } from "@/lib/utils/useGridColumns";

/**
 * Ranked poster grid — a multi-row sibling of <Grid> for the home board's
 * ranked sections (Top Upcoming). It renders the SAME <AnimeCard> as every
 * other surface, so the poster, title, badges and hover actions are the
 * standard browse card; the only additions are the oversized chart number
 * seated in the bottom-left corner of the poster frame (the "Top Upcoming"
 * rank treatment) and a scoped title-spacing refinement (see `titleClassName`).
 * The number is the positional index: the upstream card payload carries no
 * `rank` field (see mappers.toCard), so it's derived here exactly as the home
 * marquee derives it.
 *
 * Client component: it measures its own live column count (via `useGridColumns`)
 * to compute a WHOLE-ROW slice and reports it upward so a caller can show an
 * overflow toggle precisely. It lives in its own "use client" module so the
 * server-only <Grid> in ./Grid.tsx stays free of hooks.
 *
 * Responsive grid: the SAME 2→6 column track list as <Grid> (unchanged).
 * `visibleRows`, when set, collapses the raster to that many whole rows of the
 * ACTUAL responsive column count, so a collapsed view never shows a partially
 * cut-off row at any width. `expanded` renders everything.
 *
 * Never wrap this in <Reveal>: same opacity-0-until-hydration reasoning as
 * <Grid>.
 */
export function RankedGrid({
  items,
  visibleRows,
  expanded = false,
  initialCount,
  onVisibleCountChange,
}: {
  items: AnimeCardModel[];
  /** When set (and not `expanded`), render only this many whole rows of the
   *  live responsive column count. */
  visibleRows?: number;
  /** Reveal every item, ignoring `visibleRows`. */
  expanded?: boolean;
  /** Fixed cap on the number of rendered items (alternative to `visibleRows`). */
  initialCount?: number;
  /** Reports how many items are currently rendered, so a caller can show/hide
   *  an overflow toggle precisely (after the live column count is measured). */
  onVisibleCountChange?: (count: number) => void;
}) {
  const { ref, columns } = useGridColumns(6);
  const cap = !expanded && typeof visibleRows === "number" ? columns * visibleRows : undefined;
  const shown =
    cap != null
      ? items.slice(0, cap)
      : typeof initialCount === "number"
        ? items.slice(0, initialCount)
        : items;

  useEffect(() => {
    onVisibleCountChange?.(shown.length);
  }, [shown.length, onVisibleCountChange]);

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      )}
    >
      {shown.map((a, i) => {
        const rank = typeof a.rank === "number" ? a.rank : i + 1;
        return (
          <AnimeCard
            key={`${a.id}-${i}`}
            anime={a}
            // Scoped title rhythm: a slightly looser, consistent leading than
            // the global `.text-title` (1.3) and balanced wrapping so the two
            // clamped lines sit evenly and clear of the oversized rank numeral
            // (whose clearance the card already reserves via its container
            // padding). Clamped to 2 lines with an ellipsis, identical across
            // cards regardless of title length.
            titleClassName="leading-[1.4] [text-wrap:balance]"
            badge={
              <span
                className="font-display text-3xl font-bold leading-[0.8] tracking-tight text-snow [text-shadow:0_2px_10px_rgba(0,0,0,0.85)] sm:text-4xl"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.55)" }}
              >
                {rank}
              </span>
            }
          />
        );
      })}
    </div>
  );
}
