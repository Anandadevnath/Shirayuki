import type { AnimeCardModel } from "@/lib/providers/types";
import { AnimeCard } from "./AnimeCard";
import { Reveal } from "@/components/ui/Reveal";

export function Grid({ items }: { items: AnimeCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a, i) => (
        // Cinematic cascade, viewport-gated: each card rises once when it
        // actually reaches the viewport (shared IntersectionObserver —
        // see components/ui/Reveal). 28ms per index caps the visible
        // stagger; cards already on-screen at mount cascade immediately,
        // so above-fold grids keep their load-in rhythm.
        <Reveal key={a.id} delay={Math.min(i, 11) * 28}>
          <AnimeCard anime={a} />
        </Reveal>
      ))}
    </div>
  );
}
