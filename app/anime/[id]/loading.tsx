import { Skeleton } from "@/components/ui/Skeleton";

/**
 * /anime/[id] route skeleton — mirrors the detail page's actual layout order:
 * breadcrumb → poster+info hero panel → franchise rails → episodes → art →
 * cast. Every block holds the real content's dimensions so the
 * skeleton → content swap never shifts layout.
 */
export default function AnimeDetailLoading() {
  return (
    <div className="pt-4">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Info hero panel — poster + copy column + info sidebar */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_clamp(260px,24vw,320px)]">
        <div className="glass relative overflow-hidden rounded-xl p-4 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="aspect-[3/4] w-40 shrink-0 rounded-xl bg-surface-2 shimmer-loop sm:w-52" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-9 w-3/4 max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <div className="mt-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-full max-w-lg" />
                <Skeleton className="h-3 w-11/12 max-w-lg" />
                <Skeleton className="h-3 w-9/12 max-w-lg" />
                <Skeleton className="h-3 w-7/12 max-w-lg" />
              </div>
              <div className="mt-auto flex items-center gap-3 pt-4">
                <Skeleton className="h-11 w-36 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
        {/* Anime info sidebar */}
        <aside className="glass rounded-xl p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <dl className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </aside>
      </div>

      {/* Franchise rails */}
      <div className="mt-12">
        <Skeleton className="mb-4 h-7 w-40" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] w-36 shrink-0 rounded-xl bg-surface-2 shimmer-loop sm:w-40 md:w-44"
            />
          ))}
        </div>
      </div>

      {/* Episode list panel */}
      <div className="mt-12">
        <Skeleton className="mb-4 h-7 w-32" />
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-9 w-64 rounded-sm" />
          <Skeleton className="h-9 w-40 rounded-sm" />
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="rounded-md border border-line/60 bg-surface/40 px-3 py-2.5">
              <Skeleton className="h-4 w-2/3" />
            </li>
          ))}
        </ul>
      </div>

      {/* Cast grid */}
      <div className="mt-12">
        <Skeleton className="mb-4 h-7 w-44" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="size-14 shrink-0 rounded-md bg-surface-2 shimmer-loop" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-4 w-10 rounded-sm" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-line/50 pt-3">
                <div className="size-14 shrink-0 rounded-md bg-surface-2 shimmer-loop" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
