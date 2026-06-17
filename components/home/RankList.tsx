import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { EpBadges, TypePill } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

/** A single numbered row — low visual weight, used inside RankList panels. */
export function RankRow({ anime, rank }: { anime: AnimeCardModel; rank: number }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-2/70"
    >
      <span
        className={cn(
          "w-7 shrink-0 text-center font-display text-lg font-bold tabular-nums",
          rank <= 3 ? "text-gradient-frost" : "text-faint",
        )}
      >
        {rank}
      </span>
      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-2 ring-1 ring-line">
        {anime.poster && (
          <Image src={anime.poster} alt="" fill sizes="48px" className="object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium text-snow group-hover:text-frost">
          {anime.title}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <TypePill type={anime.type} />
          <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
        </span>
      </span>
    </Link>
  );
}

/** Glass panel wrapping a numbered list. Hides itself when empty. */
export function RankList({
  title,
  items,
  href,
  action,
  className,
}: {
  title: string;
  items: AnimeCardModel[];
  href?: string;
  /** optional header control (e.g. Top10Tabs period switcher) */
  action?: ReactNode;
  className?: string;
}) {
  if (!items?.length) return null;

  return (
    <section className={cn("glass rounded-lg p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold sm:text-lg">{title}</h2>
        {action ??
          (href && (
            <Link href={href} className="text-xs text-muted transition-colors hover:text-frost">
              See all
            </Link>
          ))}
      </div>
      <div className="flex flex-col">
        {items.map((a, idx) => (
          <RankRow key={`${a.id}-${idx}`} anime={a} rank={a.rank ?? idx + 1} />
        ))}
      </div>
    </section>
  );
}
