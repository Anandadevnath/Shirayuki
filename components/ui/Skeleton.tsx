import { cn } from "@/lib/utils/cn";
import { revealDelay } from "@/lib/utils/reveal";

/**
 * Premium skeleton primitives — frost-sheened placeholders that mirror the real
 * content's geometry so that when data arrives the swap causes zero layout shift.
 * The shimmer (frost sweep + soft pulse) lives in globals.css: `.shimmer-loop`
 * loops for placeholders that persist until data arrives; `.shimmer` is the
 * one-shot variant reserved for SmartImage's cross-fade stack.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-surface-2 shimmer-loop", className)} />;
}

/** Staggered fade-in wrapper for skeleton groups so placeholders cascade in. */
function Stagger({
  count,
  children,
  className,
}: {
  count: number;
  children: (i: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="reveal-fade"
          style={revealDelay(i * 60)}
        >
          {children(i)}
        </div>
      ))}
    </div>
  );
}

// ── Poster card (matches AnimeCard "cinematic": 3/4 frame, folded caption) ────
// The frame geometry MUST mirror AnimeCard's poster frame exactly: 3/4 aspect,
// `rounded-[0.5rem]` (the card radius, kept in sync across the hover/shadow
// overlays), and the same `ring-1 ring-line/80` hairline. A stale radius here
// makes the placeholder box visibly differ from the arriving card → a corner
// jump on the skeleton→grid swap.
export function CardSkeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <Skeleton className="aspect-[3/4] w-full rounded-[0.5rem] ring-1 ring-line/80" />
    </div>
  );
}

// ── A poster Rail (header + horizontal row of cards) ──────────────────────────
export function RailSkeleton({ cards = 7 }: { cards?: number }) {
  return (
    <section className="relative">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-6 w-44 rounded-md" />
        </div>
        <div className="hidden gap-1 sm:flex">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden px-1 pb-4 pt-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton
            key={i}
            className="reveal w-[44vw] shrink-0 sm:w-[24vw] md:w-[200px]"
            style={revealDelay(i * 70)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Responsive poster Grid (matches components/anime/Grid) ────────────────────
export function GridSkeleton({ count = 18 }: { count?: number }) {
  // No per-card `.reveal` stagger here. A route skeleton is a *placeholder*,
  // not content: it must be stable and evenly shimmering from frame 0. A
  // staggered mount animation is still mid-flight when data resolves, and the
  // fast commit that swaps in the real <Grid> tears out those moving nodes →
  // the perceived "instant / flicker" cut. `.shimmer-loop` (on the shared
  // <Skeleton> primitive) is the only motion; the entering grid owns the fade.
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Spotlight hero (full-bleed art + copy block + CTAs) ───────────────────────
export function SpotlightSkeleton() {
  return (
    // The pull-up must match Spotlight's exactly (see the note there): the
    // header plus `.page-shell`'s top inset is what sits above the hero, so
    // anything less leaves a strip of bare page background behind the navbar
    // and makes the hero jump when the real artwork takes over.
    <section className="relative left-[calc(50%-50cqw)] -mt-[calc(4rem_+_var(--space-page-y))] w-[100cqw] overflow-hidden">
      <div className="relative flex h-[94svh] min-h-[min(680px,94svh)] max-h-[1120px] w-full flex-col">
        <div className="absolute inset-0 bg-surface-2 shimmer-loop" />
        {/* Match the hero scrims so the skeleton sits in the same light — the
            same three layers, same opacities, as <Spotlight>: copy-side
            readability bed, shallow base vignette, navbar band. */}
        <div className="absolute inset-0 bg-gradient-to-r from-base/95 via-base/55 via-45% to-base/45 lg:to-base/15" />
        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-base/45 via-base/12 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-base/80 via-base/45 via-38% to-transparent" />
        <div className="relative z-10 flex flex-1 items-center pb-[8vh]">
          <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-xl flex-col gap-5 reveal">
              <Skeleton className="h-10 w-3/4 rounded-lg sm:h-14" />
              <Skeleton className="h-10 w-2/3 rounded-lg sm:h-14" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-lg rounded" />
              <Skeleton className="h-4 w-5/6 max-w-lg rounded" />
              <div className="mt-2 flex gap-3">
                <Skeleton className="h-12 w-36 rounded-2xl" />
                <Skeleton className="h-12 w-32 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Trending rail (editorial header + landscape ranked cards) ─────────────────
export function TrendingSkeleton({
  cards = 6,
  offsetClassName = "-mt-48",
}: {
  cards?: number;
  /** hero-overlap pull-up; `-mt-48` matches the hero-adjacent <Trending>,
   *  `mt-0` for mid/bottom-page marquees such as Top Upcoming */
  offsetClassName?: string;
}) {
  // The pull-up mirrors the real <Trending> section's hero-overlap so the
  // route skeleton sits at the same Y as the content that replaces it — without
  // it the swap pushed the whole board up by 12rem (the vertical jump).
  return (
    <section className={cn("relative", offsetClassName)}>
      <div className="mb-5 flex items-end gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-1 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
        </div>
        <div className="ml-auto hidden shrink-0 gap-2 sm:flex">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3.5 overflow-hidden px-0.5 py-1">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="reveal relative w-44 shrink-0 sm:w-52 md:w-56"
            style={revealDelay(i * 70)}
          >
            <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Ranked poster grid (mirrors components/anime/Grid's RankedGrid) ───────────
export function RankedGridSkeleton({
  cards = 12,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // MUST mirror RankedGrid's denser column ladder (one step past <Grid>):
        // Top Upcoming spans the full board, so its poster width is tuned to
        // match the Latest Completed cards. A mismatch here makes the
        // skeleton→board swap visibly jump.
        "grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
        className,
      )}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="reveal relative"
          style={revealDelay(Math.min(i, 11) * 45)}
        >
          <Skeleton className="aspect-[3/4] w-full rounded-[0.5rem] ring-1 ring-line/80" />
        </div>
      ))}
    </div>
  );
}

// ── Latest Episodes coverflow (centred hero poster, side posters fanned) ──────
export function LatestEpisodesSkeleton() {
  return (
    <section className="relative">
      <div className="mb-4 flex flex-col items-center gap-2.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-8 w-56 rounded-md" />
      </div>
      <div className="relative grid h-[43vw] max-h-[296px] min-h-[224px] w-full place-items-center">
        {/* Fanned side posters echoing the coverflow geometry. */}
        {[-2, -1, 0, 1, 2].map((off) => {
          const abs = Math.abs(off);
          return (
            <div
              key={off}
              className="reveal absolute aspect-[3/4] h-full"
              style={{
                transform: `translateX(${off * 78}%) scale(${1 - abs * 0.12}) rotateY(${-Math.sign(off) * Math.min(abs, 2) * 28}deg)`,
                opacity: 1 - abs * 0.22,
                zIndex: 10 - abs,
                ...revealDelay(abs * 80),
              }}
            >
              <Skeleton
                className={cn(
                  "h-full w-full rounded-[1.5rem]",
                  off === 0 && "ring-1 ring-frost/40",
                )}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Dense list row (poster + 2 lines), used in rank/discover panels ───────────
function ListRowSkeleton({
  posterClass,
  rank = false,
}: {
  posterClass: string;
  rank?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Rank numeral slot — mirrors RankList's reserved `w-6` column. */}
      {rank && <Skeleton className="h-7 w-6 shrink-0 rounded-sm" />}
      <Skeleton className={cn("shrink-0 rounded-sm", posterClass)} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-4/5 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

// ── One glass panel of stacked rows (Top 10 / Discover column) ────────────────
export function PanelSkeleton({
  rows = 5,
  posterClass = "h-16 w-12",
  rank = false,
  footer = false,
  className,
}: {
  rows?: number;
  posterClass?: string;
  /** Render rank numeral placeholders (Top 10 style rows). */
  rank?: boolean;
  /** Reserve the "View more" footer row (Discover columns have one; Top 10
   *  does not) so the panel height matches the real section it stands in for. */
  footer?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("glass flex flex-col rounded-lg p-4 sm:p-5", className)}>
      {/* Header: DiscoverColumn uses `mb-1 font-display text-lg` (24px line +
       *  4px margin); Top 10's tabbed header is a touch taller. h-6/mb-1 keeps
       *  the common case within a couple of px. */}
      <Skeleton className="mb-1 h-6 w-36 rounded-md" />
      <Stagger count={rows} className="flex flex-1 flex-col divide-y divide-line/40">
        {() => <ListRowSkeleton posterClass={posterClass} rank={rank} />}
      </Stagger>
      {footer && <Skeleton className="mt-3 h-5 w-24 rounded" />}
    </section>
  );
}

// ── Schedule glass panel (header + day strip + broadcast rows) ────────────────
export function ScheduleSkeleton() {
  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-2xl glass p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-1 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-6 w-48 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
        <div className="mb-6 flex gap-2.5 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.25rem] min-w-[6.5rem] shrink-0 rounded-md" />
          ))}
        </div>
        <Stagger count={6} className="divide-y divide-line/40">
          {() => (
            <div className="flex items-center gap-4 py-4">
              <Skeleton className="h-3.5 w-12 rounded" />
              <Skeleton className="h-3.5 flex-1 rounded" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          )}
        </Stagger>
      </div>
    </section>
  );
}

// ── Watch page (player + title strip + server strip + episode sidebar) ────────
// Mirrors app/watch/[id]/[ep]/page.tsx's layout — row 1 (player + sidebar),
// then the `.section-stack` of episode explorer + franchise rail + Cinematic
// info — so the swap to the real content produces zero layout shift.
export function WatchSkeleton() {
  return (
    <div className="space-y-8">
      {/* Row 1: Player + Episode Sidebar (synced height) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player column */}
        <div className="laser-frame laser-live glass watch-glass relative flex min-w-0 flex-col overflow-hidden rounded-md">
          {/* Video frame */}
          <Skeleton className="aspect-video w-full rounded-t-md" />

          {/* Title strip */}
          <div className="border-t border-white/10 bg-surface/40 px-5 py-4 backdrop-blur-sm sm:px-6">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-1/3 rounded" />
          </div>

          {/* Server switcher strip */}
          <div className="space-y-3 border-t border-white/10 bg-surface/30 px-5 py-4 backdrop-blur-sm sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-3 w-28 rounded" />
              <div className="flex gap-1">
                <Skeleton className="h-6 w-14 rounded-sm" />
                <Skeleton className="h-6 w-14 rounded-sm" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-3 w-16 rounded" />
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-6 w-20 rounded-sm" />
                <Skeleton className="h-6 w-16 rounded-sm" />
                <Skeleton className="h-6 w-20 rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Episode sidebar */}
        <aside className="laser-frame laser-live glass watch-glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b border-white/10 bg-surface/40 px-5 py-4 backdrop-blur-sm">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <div className="max-h-[640px] flex-1 space-y-1.5 overflow-hidden p-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-2.5 py-2"
              >
                <Skeleton className="size-7 shrink-0 rounded-sm" />
                <div
                  className="h-3.5 rounded bg-surface-2 shimmer-loop"
                  style={{ width: `${65 - (i % 4) * 10}%` }}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Rows 2+: franchise rail + Cinematic info. Mirrors the real page's
          `.section-stack` block so the arriving franchise rail doesn't shift
          the info section downward on swap. */}
      <div className="section-stack mt-8">
        {/* Franchise rail: header + landscape poster row */}
        <section>
          <div className="mb-4 flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-6 w-36 rounded-md" />
          </div>
          <div className="flex gap-4 overflow-hidden pt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] w-44 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line sm:w-52 md:w-56"
              />
            ))}
          </div>
        </section>

        {/* Cinematic info (mirrors CinematicInfo layout) */}
        <section className="relative overflow-hidden rounded-md glass p-5 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            {/* Poster */}
            <Skeleton className="aspect-[3/4] w-full rounded-md" />

            {/* Info column */}
            <div className="min-w-0 space-y-5">
              {/* Title */}
              <div className="space-y-3">
                <Skeleton className="h-7 w-3/4 rounded-md sm:h-9" />
                <Skeleton className="h-7 w-1/2 rounded-md sm:h-9" />
              </div>

              {/* Meta pills row */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-5/6 rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-[4.5rem] rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
