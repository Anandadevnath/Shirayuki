import type { AnimeCardModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { AnimeCard } from "./AnimeCard";
import { Reveal } from "@/components/ui/Reveal";

export function Rail({
  title,
  eyebrow,
  items,
  href,
}: {
  title: string;
  eyebrow?: string;
  items: AnimeCardModel[];
  href?: string;
}) {
  if (!items?.length) return null;

  return (
    <RailShell title={title} eyebrow={eyebrow} href={href}>
      {items.map((a, i) => (
        // Viewport-gated stagger inside the rail: the shared observer
        // watches horizontally too, so edge cards settle in as the user
        // scrolls the rail — not while they're off-screen at load.
        <Reveal
          key={`${a.id}-${a.episodeNumber ?? ""}`}
          delay={Math.min(i, 9) * 60}
          className="w-[44vw] shrink-0 snap-start sm:w-[24vw] md:w-[200px]"
        >
          <AnimeCard anime={a} />
        </Reveal>
      ))}
    </RailShell>
  );
}