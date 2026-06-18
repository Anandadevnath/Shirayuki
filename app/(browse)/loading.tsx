import { GridSkeleton } from "@/components/ui/Skeleton";

/**
 * Shared skeleton for the browse routes (category / genre / az / search). They
 * all render a heading then a poster Grid, so one placeholder keeps the swap to
 * real content jump-free across the group.
 */
export default function Loading() {
  return (
    <div className="pt-4">
      <div className="mb-6 h-8 w-56 rounded-md bg-surface-2 shimmer" />
      <GridSkeleton count={24} />
    </div>
  );
}
