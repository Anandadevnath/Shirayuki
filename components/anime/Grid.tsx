import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";

export function Grid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a) => (
        <AnimeCard key={a.id} anime={a} />
      ))}
    </div>
  );
}
