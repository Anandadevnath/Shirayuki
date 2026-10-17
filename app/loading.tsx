import {
  SpotlightSkeleton,
  TrendingSkeleton,
  LatestEpisodesSkeleton,
  PanelSkeleton,
  ScheduleSkeleton,
} from "@/components/ui/Skeleton";
import { revealDelay } from "@/lib/utils/reveal";

/**
 * Home route skeleton. Mirrors page.tsx's section order and spacing exactly so
 * the transition from skeleton → content never shifts layout. The negative
 * top-shift matches the hero pull-up the real page uses.
 */
export default function Loading() {
  return (
    <div>
      <SpotlightSkeleton />
      <div className="relative">
        {/* Matches page.tsx: the real page's section stack sits in normal flow
            below the hero (no translate), so the skeleton must too — otherwise
            the skeleton→content swap jumps vertically. */}
        <div className="relative z-10 flex flex-col gap-12">
          <TrendingSkeleton />
          <LatestEpisodesSkeleton />

          {/* Discover columns */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PanelSkeleton key={i} rows={5} posterClass="h-[68px] w-[48px]" />
            ))}
          </div>

          {/* Latest Completed grid + Top 10 panel */}
          <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]">
            <section className="glass rounded-lg p-4 sm:p-5">
              <div className="mb-4 flex flex-col items-center gap-2.5">
                <div className="h-3 w-16 rounded bg-surface-2 shimmer-loop" />
                <div className="h-7 w-44 rounded-md bg-surface-2 shimmer-loop" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="reveal"
                    style={revealDelay(Math.min(i, 9) * 45)}
                  >
                    <div className="aspect-[3/4] w-full rounded-[1.25rem] bg-surface-2 shimmer-loop ring-1 ring-line/80" />
                  </div>
                ))}
              </div>
            </section>
            <PanelSkeleton rows={10} posterClass="h-20 w-14" rank />
          </div>

          <ScheduleSkeleton />
        </div>
      </div>
    </div>
  );
}
