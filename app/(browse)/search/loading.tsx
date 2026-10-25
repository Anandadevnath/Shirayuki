import { GridSkeleton } from "@/components/ui/Skeleton";

/**
 * Route-level skeleton for /search. Search keeps its own server form + raw
 * <Grid> (it is a real server-side filter, not the client discovery board), so
 * it must NOT inherit the (browse) group skeleton's ToolbarSkeleton — that
 * placeholder has no counterpart on this page and would shift the grid up when
 * the real content swaps in.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <div className="h-8 w-56 rounded-md bg-surface-2 shimmer-loop" />
      <div className="h-12 rounded-md bg-surface-2 shimmer-loop" />
      <GridSkeleton count={24} />
    </div>
  );
}
