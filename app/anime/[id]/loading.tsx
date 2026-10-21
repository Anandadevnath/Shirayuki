import { Skeleton } from "@/components/ui/Skeleton";

/**
 * /anime/[id] route skeleton — mirrors the detail page's composition and holds
 * the real content's dimensions so the skeleton → content swap never shifts
 * layout.
 *
 * Order (matching app/anime/[id]/page.tsx):
 *   1. hero + "Anime Info" sidecar share ONE grid row (poster/copy left, info
 *      panel right on desktop; stacked on mobile). The streamed "Next episode"
 *      strip lives inside the sidecar behind a Suspense boundary, so it is NOT
 *      pre-drawn here (it would shift layout for non-airing titles).
 *   2. then the `.section-stack` sections: episode grid → character cards →
 *      franchise rail.
 *
 * Note: several of those sections are conditional (no episodes → no explorer,
 * etc.); the skeleton draws the common case, and each section's own height is
 * held so its arrival never nudges the ones below it.
 */
export default function AnimeDetailLoading() {
  return (
    <div>
      {/* Breadcrumb — Home · Type · Title */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Hero + info sidecar share one grid row */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Hero — poster + copy column */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="mx-auto aspect-[2/3] w-40 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line sm:mx-0 sm:w-56" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-11 w-3/4 max-w-lg" />

            {/* metadata chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-sm" />
              ))}
            </div>

            {/* genre chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[26px] w-16 rounded-[var(--radius-btn)]" />
              ))}
            </div>

            {/* synopsis */}
            <div className="mt-5 flex flex-col gap-2">
              <Skeleton className="h-3 w-full max-w-xl" />
              <Skeleton className="h-3 w-11/12 max-w-xl" />
              <Skeleton className="h-3 w-9/12 max-w-xl" />
            </div>

            {/* actions: Watch now + My List + Share */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-10 w-32 rounded-[var(--radius-btn)]" />
              <Skeleton className="h-10 w-24 rounded-[var(--radius-btn)]" />
              <Skeleton className="h-10 w-20 rounded-[var(--radius-btn)]" />
            </div>
          </div>
        </div>

        {/* Info sidecar */}
        <aside className="glass h-full overflow-hidden rounded-md p-5 sm:p-6">
          <Skeleton className="mb-4 h-3 w-24" />
          <dl className="flex flex-col gap-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-3 w-16 shrink-0" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-line/60 pt-4">
            <Skeleton className="mb-2.5 h-3 w-16" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[18px] w-14 rounded-sm" />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Trailing sections share one vertical rhythm */}
      <div className="section-stack mt-[var(--space-section)]">
        {/* Episodes */}
        <section>
          <SectionHead />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-56 rounded-[var(--radius-btn)]" />
            <Skeleton className="ml-auto h-9 w-40 rounded-[var(--radius-btn)]" />
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 rounded-[0.5rem] border border-line bg-surface/40 px-3 py-2.5"
              >
                <Skeleton className="size-8 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-2/3" />
              </li>
            ))}
          </ul>
        </section>

        {/* Characters — mobile rail, desktop grid */}
        <section>
          <SectionHead />
          <div className="no-scrollbar flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex w-36 shrink-0 flex-col gap-2 sm:w-full">
                <div className="aspect-[3/4] w-full rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line" />
              </div>
            ))}
          </div>
        </section>

        {/* Franchise rail */}
        <section>
          <SectionHead />
          <div className="flex gap-4 overflow-hidden pt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] w-44 shrink-0 rounded-[0.5rem] bg-surface-2 shimmer-loop ring-1 ring-line sm:w-52 md:w-56"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Matches `SectionHeader`: a frost eyebrow line above the section title. */
function SectionHead() {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-6 w-40" />
    </div>
  );
}
