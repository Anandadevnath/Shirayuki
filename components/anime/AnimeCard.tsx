import Link from "next/link";
import Image from "next/image";
import { Play, Star } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";
import { EpBadges, TypePill } from "./Badges";

/**
 * The ONE anime card. Replaces the old app's five near-identical cards.
 * variant: poster (grid/rail), row (compact list).
 */
export function AnimeCard({
  anime,
  variant = "poster",
  className,
}: {
  anime: AnimeCardModel;
  variant?: "poster" | "row";
  className?: string;
}) {
  if (variant === "row") {
    return (
      <Link
        href={`/anime/${anime.id}`}
        className={cn(
          "group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-2",
          className,
        )}
      >
        <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-2">
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

  return (
    <Link
      href={`/anime/${anime.id}`}
      className={cn("group block snap-start", className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 shadow-[var(--shadow-soft)] ring-1 ring-line transition-all duration-200 group-hover:-translate-y-1 group-hover:ring-frost/40 group-hover:shadow-[var(--shadow-frost)]">
        {anime.poster ? (
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            sizes="(max-width:640px) 40vw, (max-width:1024px) 22vw, 180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-faint">No image</div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-base/95 via-base/30 to-transparent opacity-80" />

        <div className="absolute left-2 top-2">
          <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
        </div>
        {typeof anime.episodeNumber === "number" ? (
          <span className="absolute right-2 top-2 rounded-sm bg-frost-soft px-1.5 py-0.5 text-[10px] font-semibold text-frost">
            EP {anime.episodeNumber}
          </span>
        ) : (
          !!anime.score && (
            <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-sm bg-base/80 px-1.5 py-0.5 text-[10px] font-semibold text-snow backdrop-blur-sm">
              <Star className="size-2.5 text-warning" /> {anime.score}
            </span>
          )
        )}

        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full glass text-frost">
            <Play className="size-5 translate-x-0.5 fill-current" />
          </span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-snow group-hover:text-frost">
          {anime.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-faint">
          {anime.type ?? "—"}
          {anime.jname ? ` · ${anime.jname}` : ""}
        </p>
      </div>
    </Link>
  );
}
