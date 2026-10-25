import { GridSkeleton, ToolbarSkeleton } from "@/components/ui/Skeleton";

/**
 * Shared skeleton for the browse routes (category / genre / az / search). They
 * all render a heading, a discovery toolbar and a poster Grid, so one
 * placeholder keeps the swap to real content jump-free across the group. The
 * toolbar reserves the board's height so the arriving toolbar doesn't push the
 * grid down.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <div className="h-8 w-56 rounded-md bg-surface-2 shimmer-loop" />
      <ToolbarSkeleton />
      <GridSkeleton count={24} />
    </div>
  );
}
