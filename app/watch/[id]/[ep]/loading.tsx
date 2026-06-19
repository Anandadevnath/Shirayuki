import { WatchSkeleton } from "@/components/ui/Skeleton";

/**
 * Watch route skeleton. Mirrors app/watch/[id]/[ep]/page.tsx's two-row
 * layout exactly — player + title + server strip + episode sidebar in row
 * 1, then the CinematicInfo block in row 2 — so the swap to the real
 * content produces zero layout shift.
 */
export default function Loading() {
  return <WatchSkeleton />;
}