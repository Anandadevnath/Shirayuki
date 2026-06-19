import type { AnimeCardModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { AnimeCard } from "./AnimeCard";

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
        <AnimeCard
          key={`${a.id}-${a.episodeNumber ?? ""}`}
          anime={a}
          style={{ ["--reveal-delay" as string]: `${Math.min(i, 9) * 60}ms` }}
          className="reveal w-[44vw] shrink-0 sm:w-[24vw] md:w-[200px]"
        />
      ))}
    </RailShell>
  );
}