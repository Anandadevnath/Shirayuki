import Link from "next/link";
import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { CinematicHeader } from "@/components/common/SectionHeader";

/**
 * Latest Completed as a grid that fills the left glass panel (matching the
 * Top 10 container beside it). New Releases / Upcoming are parked for now.
 * Hides itself when there's nothing to show.
 */
export function QuickLists({ completed }: { completed: AnimeCardModel[] }) {
  if (!completed.length) return null;

  return (
    <section className="laser-frame glass flex min-w-0 flex-col rounded-lg p-4 sm:p-5">
      <CinematicHeader title="Latest Completed" eyebrow="Finished">
        <Link
          href="/category/completed"
          className="text-sm text-muted transition-colors hover:text-frost"
        >
          View more
        </Link>
      </CinematicHeader>
      {/* Grid flows top-down with uniform row/column gaps so the cards "perfectly
          adjust" to the panel — no uneven content-between stretching the gap
          between row 1 and row 2. Slightly tighter column gap makes the cards
          a touch wider so they fill more of the panel width. */}
      <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {completed.map((a) => (
          <AnimeCard key={a.id} anime={a} />
        ))}
      </div>
    </section>
  );
}
