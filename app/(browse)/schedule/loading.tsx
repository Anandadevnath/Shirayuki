import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Tailored skeleton for the Airing Schedule page — a day strip then a bordered
 * list of broadcast rows. Overrides the group's grid skeleton so the swap to
 * real content (which is a list, not a poster grid) causes no layout shift.
 */
export default function Loading() {
  return (
    <div className="pt-4">
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="mb-6 mt-2 h-8 w-52 rounded-md" />

      <div className="mb-8 flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-16 shrink-0 rounded-md" />
        ))}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="reveal-fade flex items-center gap-4 px-4 py-3.5"
            style={{ ["--reveal-delay" as string]: `${i * 50}ms` }}
          >
            <Skeleton className="h-4 w-14 rounded" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-5 w-12 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
