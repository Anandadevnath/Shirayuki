import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";

/**
 * Poster grid.
 *
 * Cards render VISIBLE from the first paint — they are deliberately NOT wrapped
 * in <Reveal>. A hiding wrapper starts every card at `opacity: 0` pre-hydration
 * (the `html[data-anim="1"] [data-reveal]:not([data-shown])` rule), which means
 * the route skeleton's poster placeholders are replaced by an *invisible* grid
 * for the hydration window: the user sees the shimmering skeleton, then a black
 * hole, then the cards fade in — the first-load "flicker". The card's own
 * `bg-surface-2` frame + the SmartImage shimmer are the correct placeholder and
 * must stay on screen; the image's load-driven crossfade (SmartImage) is the
 * single entrance. Keeping the frame visible eliminates both the blank window
 * and the double opacity fade (wrapper rise + image fade).
 *
 * The visual cascade is preserved where it is safe — inside each card's
 * crossfade — while the grid itself never blinks out.
 */
export function Grid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} />
      ))}
    </div>
  );
}

/**
 * Ranked poster grid — a multi-row sibling of <Grid> for the home board's
 * ranked sections (Top Upcoming). It renders the SAME <AnimeCard> as every
 * other surface, so the poster, title, badges and hover actions are byte-for-
 * byte the standard browse card; the only addition is the provider's oversized
 * chart number seated in the bottom-left corner of the poster frame, the
 * "Top Upcoming" rank treatment. The number is the positional index: the
 * upstream card payload carries no `rank` field (see mappers.toCard), so it's
 * derived here exactly as the home marquee derives it.
 *
 * Column counts are the ONLY thing tuned for the "~3 rows" brief: 15 items
 * (the real section size) land 3 rows wide from md (4 cols) upward, while
 * small phones stack 2 per row. No item cap — if upstream ever widens the
 * section the grid simply grows a row, which is the correct behaviour for a
 * grid (unlike the marquee there is nothing to keep on screen).
 *
 * Never wrap this in <Reveal>: same opacity-0-until-hydration reasoning as
 * <Grid> above.
 */
export function RankedGrid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a, i) => {
        const rank = typeof a.rank === "number" ? a.rank : i + 1;
        return (
          <AnimeCard
            key={`${a.id}-${i}`}
            anime={a}
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
