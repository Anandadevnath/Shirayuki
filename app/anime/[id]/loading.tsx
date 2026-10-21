import { Skeleton } from "@/components/ui/Skeleton";

/**
 * /anime/[id] route skeleton — mirrors the NEW detail page order and holds the
 * real content's dimensions so the skeleton → content swap never shifts layout:
 * breadcrumb → hero (poster + copy) → details info grid → next-episode stub →
 * episode grid → character cards → franchise rail.
 */
export default function AnimeDetailLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Hero + info sidecar — poster/copy left, info panel right */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="mx-auto aspect-[2/3] w-40 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop sm:mx-0 sm:w-56" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-3/4 max-w-lg" />
            <div className="mt-1 flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-sm" />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-3 w-full max-w-xl" />
              <Skeleton className="h-3 w-11/12 max-w-xl" />
              <Skeleton className="h-3 w-9/12 max-w-xl" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-[var(--radius-btn)]" />
              <Skeleton className="h-10 w-24 rounded-[var(--radius-btn)]" />
              <Skeleton className="h-10 w-20 rounded-[var(--radius-btn)]" />
            </div>
          </div>
        </div>

        {/* Info sidecar */}
        <aside className="glass h-full rounded-md p-5 sm:p-6">
          <Skeleton className="mb-4 h-4 w-24" />
          <dl className="flex flex-col gap-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line/60 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-sm" />
            ))}
          </div>
        </aside>
      </div>

      {/* Episode grid */}
      <div className="mt-[var(--space-section)]">
        <Skeleton className="mb-4 h-7 w-36" />
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-9 w-56 rounded-[var(--radius-btn)]" />
          <Skeleton className="h-9 w-40 rounded-[var(--radius-btn)]" />
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 rounded-[0.5rem] border border-line/60 bg-surface/40 px-3 py-2.5"
            >
              <Skeleton className="size-8 shrink-0 rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
            </li>
          ))}
        </ul>
      </div>

      {/* Character cards */}
      <div className="mt-[var(--space-section)]">
        <Skeleton className="mb-4 h-7 w-36" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[3/4] w-full rounded-[0.5rem] bg-surface-2 shimmer-loop" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Franchise rail */}
      <div className="mt-[var(--space-section)]">
        <Skeleton className="mb-4 h-7 w-40" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] w-44 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop sm:w-52 md:w-56"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
