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
      {/* Grid grows to fill the panel (matched to the Top 10 height beside it);
          rows space out evenly so there's no dead gap at the bottom. */}
      <div className="grid flex-1 grid-cols-2 content-between gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {completed.map((a) => (
          <AnimeCard key={a.id} anime={a} />
        ))}
      </div>
    </section>
  );
}
