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
 *
 * The container carries `.grid-in`: a single opacity-only one-shot so the
 * arriving grid cross-fades in as ONE unit. It is deliberately additive (an
 * animation on an already-visible tree), never a hidden-until-hydrated
 * wrapper — the cards are still visible from frame 0, and the fade just
 * masks the per-image optimizer decode burst behind one calm block. See the
 * `.grid-in` note in globals.css (and why it is opacity-only).
 *
 * NOTE: the ranked sibling <RankedGrid> lives in ./RankedGrid ("use client")
 * because it measures its live column count and drives the collapse toggle; it
 * is intentionally NOT defined here so this module stays a server component.
 *
 * The column ladder (2/3/5/6/7) is shared with <RankedGrid> on purpose so every
 * full-width browse grid renders posters at the same size as Top Upcoming. It
 * is consumed by ALL grid surfaces at once — /search, the browse routes via
 * <DiscoveryBoard>, /schedule and the home board — so this is a site-wide
 * poster-size change, deliberately NOT tuned to QuickLists' denser panel
 * (2/3/4/5). Keep it in lockstep with GridSkeleton and RankedGrid.
 */
export function Grid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid-in grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} />
      ))}
    </div>
  );
}
