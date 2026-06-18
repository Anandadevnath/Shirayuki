import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";

export function Grid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a, i) => (
        // Cinematic cascade — cards rise in sequence, capped so a long grid
        // doesn't wait seconds for the last card. Pure-CSS, plays once on mount.
        <div
          key={a.id}
          className="reveal"
          style={{ ["--reveal-delay" as string]: `${Math.min(i, 11) * 45}ms` }}
        >
          <AnimeCard anime={a} />
        </div>
      ))}
    </div>
  );
}
