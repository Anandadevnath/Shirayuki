import Link from "next/link";
import type { ReactNode } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { EpBadges } from "@/components/anime/Badges";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils/cn";

/** A single row in the Top 10 panel — poster, title, then sub/dub + type. */
export function RankRow({ anime }: { anime: AnimeCardModel; rank?: number }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group -mx-2 flex items-center gap-4 rounded-none px-2 py-3 transition-colors hover:bg-white/[0.015]"
    >
      {/* Poster — softly rounded, full-bleed image */}
      <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {anime.poster && (
          <SmartImage
            src={anime.poster}
            alt=""
            fill
            sizes="56px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        )}
      </span>

      {/* Title + meta — takes the rest of the container width */}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-snow transition-colors group-hover:text-frost">
          {anime.title}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          {anime.type && (
            <>
              <span className="text-faint/60">•</span>
              <span className="font-medium text-muted">{anime.type}</span>
            </>
          )}
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
