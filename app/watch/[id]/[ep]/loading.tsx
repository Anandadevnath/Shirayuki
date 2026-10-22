import { WatchSkeleton } from "@/components/ui/Skeleton";

/**
 * Watch route skeleton. Mirrors app/watch/[id]/[ep]/page.tsx's layout — row 1
 * (player + title + server strip + episode sidebar), then the `.section-stack`
 * of episode explorer + franchise rail + CinematicInfo — so the swap to the
 * real content produces zero layout shift.
 */
export default function Loading() {
  return <WatchSkeleton />;
}