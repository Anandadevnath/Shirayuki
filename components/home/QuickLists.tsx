import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { SectionHeader } from "@/components/common/SectionHeader";

/**
 * Latest Completed as a grid that fills the left glass panel (matching the
 * Top 10 container beside it). New Releases / Upcoming are parked for now.
 * Hides itself when there's nothing to show.
 */
export function QuickLists({ completed }: { completed: AnimeCardModel[] }) {
  if (!completed.length) return null;

  return (
    <section className="glass min-w-0 rounded-lg p-4 sm:p-5">
      <SectionHeader
        title="Latest Completed"
        eyebrow="Finished"
        href="/category/completed"
        seeAllLabel="View more"
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {completed.map((a) => (
          <AnimeCard key={a.id} anime={a} />
        ))}
      </div>
    </section>
  );
}
