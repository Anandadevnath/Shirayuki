"use client";

import { useEffect } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";
import { cn } from "@/lib/utils/cn";
import { useGridColumns } from "@/lib/utils/useGridColumns";

/**
 * Ranked poster grid — the home board's ranked grid section (Top Upcoming).
 * It renders the SAME shared <AnimeCard> as every other surface (Latest
 * Completed, browse grids, rails), so the poster, frost hover ring, badges and
 * hover meta row are identical to the rest of the site. The only addition is a
 * small `#N` rank chip seated in the card's TOP-LEFT slot via `topLeftBadge`
 * (the slot the top-left EpBadges normally occupy; upcoming cards carry no
 * EpBadges, so they never collide). The rank number is the positional index
 * (the upstream card payload carries no `rank` field — see mappers.toCard), so
 * it's derived here exactly as the home marquee derives it.
 *
 * Client component: it measures its own live column count (via `useGridColumns`)
 * to compute a WHOLE-ROW slice and reports it upward so a caller can show an
 * overflow toggle precisely. It lives in its own "use client" module so the
 * server-only <Grid> in ./Grid.tsx stays free of hooks.
 *
 * Responsive grid: uses the same 2→7 column track ladder as the shared <Grid>,
 * so a full-width Top Upcoming row matches the poster size of every other
 * browse grid. `visibleRows`, when set, collapses the raster to that many whole
 * rows of the ACTUAL responsive column count, so a collapsed view never shows a
 * partially cut-off row at any width. `expanded` renders everything.
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
  // Fallback = the grid's largest (xl) column count, so the SSR/first-paint
  // whole-row slice matches the widest layout before the live count is measured.
  const { ref, columns } = useGridColumns(7);
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
        // The same ladder as the shared <Grid> (2/3/5/6/7), with the slightly
        // wider x-gap / taller y-gap the ranked board uses. Top Upcoming spans
        // the FULL board width; keeping these tracks identical to <Grid> means
        // its posters match every other browse grid (~190px at xl). Keep this
        // ladder in sync with <Grid> if you touch the columns.
        //
        // `.grid-in`: the same opacity-only one-shot entrance as <Grid>, so the
        // arriving ranked grid cross-fades in as ONE unit and masks the
        // per-image decode burst. Additive only — cards stay visible from frame
        // 0, and being a pure CSS class it plays on mount identically in this
        // client component and the server <Grid>.
        "grid-in grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
      )}
    >
      {shown.map((a, i) => {
        const rank = typeof a.rank === "number" ? a.rank : i + 1;
        return (
          <AnimeCard
            key={`${a.id}-${i}`}
            anime={a}
            topLeftBadge={
              <span className="font-display rounded-[0.5rem] bg-base/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-snow tabular-nums ring-1 ring-white/10 backdrop-blur-sm">
                #{rank}
              </span>
            }
            // Tighter than a roomy grid, so the 3-item meta row (Watch / type /
            // score) can run out of width. Keep it on ONE
            // line: the pills hold intrinsic width and never wrap their labels
            // mid-word. Upcoming cards carry no score, so nothing is clipped;
            // were a score present, its `ml-auto` span is the item that drops
            // rather than forcing a wrap.
            revealRowClassName="flex-nowrap [&>span]:shrink-0 [&>span]:whitespace-nowrap"
          />
        );
      })}
    </div>
  );
}
