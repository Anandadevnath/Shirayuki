import { cn } from "@/lib/utils/cn";

/**
 * Premium skeleton primitives — frost-sheened placeholders that mirror the real
 * content's geometry so that when data arrives the swap causes zero layout shift.
 * The shimmer (frost sweep + soft pulse) lives in globals.css `.shimmer`.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-surface-2 shimmer", className)} />;
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
          style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}
        >
          {children(i)}
        </div>
      ))}
    </div>
  );
}

// ── Poster card (matches AnimeCard "cinematic": 3/4 frame, folded caption) ────
export function CardSkeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <Skeleton className="aspect-[3/4] w-full rounded-[1.25rem]" />
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
      <div className="flex gap-4 overflow-hidden px-1">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton
            key={i}
            className="reveal w-[44vw] shrink-0 sm:w-[24vw] md:w-[200px]"
            style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
          />
        ))}
      </div>
    </section>
  );
}

// ── Responsive poster Grid (matches components/anime/Grid) ────────────────────
export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          className="reveal"
          style={{ ["--reveal-delay" as string]: `${Math.min(i, 11) * 45}ms` }}
        />
      ))}
    </div>
  );
}

// ── Spotlight hero (full-bleed art + copy block + CTAs) ───────────────────────
export function SpotlightSkeleton() {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 -mt-24 overflow-hidden">
      <div className="relative flex h-[82svh] min-h-[600px] max-h-[1000px] w-full flex-col">
        <div className="absolute inset-0 bg-surface-2 shimmer" />
        {/* Match the hero scrims so the skeleton sits in the same light. */}
        <div className="absolute inset-0 bg-gradient-to-r from-base/95 via-base/45 to-base/70" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-base from-6% via-base/25 via-42% to-transparent" />
        <div className="relative z-10 flex flex-1 items-center">
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
export function TrendingSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <section className="relative">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-9 w-1 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex gap-3.5 overflow-hidden px-0.5 pb-4 pt-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="reveal w-44 shrink-0 sm:w-52 md:w-56"
            style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
          >
            <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Latest Episodes coverflow (centred hero poster, side posters fanned) ──────
export function LatestEpisodesSkeleton() {
  return (
    <section className="relative">
      <div className="mb-4 flex flex-col items-center gap-2.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-7 w-56 rounded-md" />
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
                ["--reveal-delay" as string]: `${abs * 80}ms`,
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
function ListRowSkeleton({ posterClass }: { posterClass: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
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
  className,
}: {
  rows?: number;
  posterClass?: string;
  className?: string;
}) {
  return (
    <section className={cn("glass flex flex-col rounded-lg p-4 sm:p-5", className)}>
      <Skeleton className="mb-3 h-6 w-36 rounded-md" />
      <Stagger count={rows} className="flex flex-col divide-y divide-line/40">
        {() => <ListRowSkeleton posterClass={posterClass} />}
      </Stagger>
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
// Mirrors the row-1 + row-2 layout of app/watch/[id]/[ep]/page.tsx so the
// transition from skeleton → content causes zero layout shift.
export function WatchSkeleton() {
  return (
    <div className="space-y-8">
      {/* Row 1: Player + Episode Sidebar (synced height) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player column */}
        <div className="laser-frame glass relative flex min-w-0 flex-col overflow-hidden rounded-md">
          {/* Video frame */}
          <Skeleton className="aspect-video w-full rounded-t-md" />

          {/* Title strip */}
          <div className="border-t border-line/60 bg-surface/60 px-5 py-4 sm:px-6">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <Skeleton className="mt-2 h-3.5 w-1/3 rounded" />
          </div>

          {/* Server switcher strip */}
          <div className="space-y-3 border-t border-line/60 bg-surface/50 px-5 py-4 sm:px-6">
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
        <aside className="laser-frame glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b border-line/60 bg-surface/60 px-5 py-4">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <div className="max-h-[640px] flex-1 space-y-1 overflow-hidden p-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-2.5 py-2"
              >
                <Skeleton className="size-7 shrink-0 rounded-sm" />
                <div
                  className="h-3.5 rounded bg-surface-2 shimmer"
                  style={{ width: `${65 - (i % 4) * 10}%` }}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Row 2: Cinematic info (mirrors CinematicInfo layout) */}
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
  );
}
