import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Home route skeleton — mirrors the reference homepage structure exactly
 * (compact hero → trending five-card row → Latest Episodes / Seasonal Picks
 * panels → release calendar) so the skeleton → content swap never shifts
 * layout. Heights track the real page: hero ≈ 375px total including the
 * utility bar zone, cards ≈ 220px wide.
 */
export default function Loading() {
  return (
    <div>
      {/* Hero band (the utility bar floats over it) */}
      <div className="-mx-4 -mt-20 sm:-mx-6 lg:-mx-8" aria-hidden>
        <div className="relative h-[330px] w-full bg-surface/70 sm:h-[360px] md:h-[380px]">
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface-2/60 to-surface" />
          {/* copy block placeholders */}
          <div className="absolute bottom-8 left-6 w-full max-w-xl space-y-3 sm:left-10">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-72 sm:h-12" />
            <Skeleton className="h-3 w-96 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 pt-9 sm:gap-9" aria-hidden>
        {/* ── Trending Anime ── */}
        <section>
          <HeaderSkeleton />
          <div className="flex gap-4 overflow-hidden px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[220px] shrink-0">
                <div className="overflow-hidden rounded-[14px] border border-line/60 bg-surface/60">
                  <div className="relative aspect-[16/9.4] bg-surface-2 shimmer-loop" />
                  <div className="space-y-2 px-3 py-2.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Latest Episodes + Seasonal Picks ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5">
            <HeaderSkeleton />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="relative aspect-video bg-surface-2 shimmer-loop rounded-lg" />
                  <Skeleton className="mt-2 h-3.5 w-3/4" />
                  <Skeleton className="mt-1.5 h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5">
            <HeaderSkeleton />
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
              <div className="relative aspect-[4/3] min-h-[180px] bg-surface-2 shimmer-loop rounded-xl" />
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-line/50 bg-base/40 p-2">
                    <div className="h-[52px] w-[70px] shrink-0 rounded-md bg-surface-2 shimmer-loop" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Release Calendar ── */}
        <div className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5">
          <HeaderSkeleton />
          <div className="mb-4 flex gap-2.5 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.25rem] min-w-[6.5rem] shrink-0 rounded-lg" />
            ))}
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-16 shrink-0 rounded-md bg-surface-2 shimmer-loop" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Section-header placeholder pair (Japanese micro-label + serif title). */
function HeaderSkeleton() {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-1.5 h-7 w-44" />
      </div>
      <Skeleton className="hidden h-3 w-16 sm:block" />
    </div>
  );
}
