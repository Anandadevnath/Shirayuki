import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { EpBadges } from "@/components/anime/Badges";

/** A single compact row — poster, title, then sub/dub badges and the type. */
function DiscoverRow({ anime }: { anime: AnimeCardModel }) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group flex items-start gap-3 border-b border-line/40 py-3 transition-colors last:border-0 hover:bg-surface-2/40"
    >
      <span className="relative h-[68px] w-[48px] shrink-0 overflow-hidden rounded bg-surface-2 ring-1 ring-line/60">
        {anime.poster && (
          <Image
            src={anime.poster}
            alt=""
            fill
            sizes="48px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-snow transition-colors group-hover:text-frost">
          {anime.title}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />
          {anime.type && (
            <span className="flex items-center gap-2 text-xs text-faint">
              <span className="size-1 rounded-full bg-faint/60" />
              {anime.type}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

/** One glass column: gradient heading, rows, then a "View more" footer link. */
function DiscoverColumn({
  title,
  items,
  href,
}: {
  title: string;
  items: AnimeCardModel[];
  href: string;
}) {
  if (!items?.length) return null;

  return (
    <section className="laser-frame glass flex flex-col rounded-lg p-4 sm:p-5">
      <h3 className="text-gradient-frost mb-1 font-display text-lg font-extrabold">
        {title}
      </h3>
      <div className="flex flex-1 flex-col">
        {items.slice(0, 5).map((a, idx) => (
          <DiscoverRow key={`${a.id}-${idx}`} anime={a} />
        ))}
      </div>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-frost"
      >
        View more
        <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}

/**
 * Four compact discovery columns — Top Airing / Most Popular / New Releases /
 * Completed — laid out side by side on desktop and stacking down on mobile.
 * Dense counterpart to the poster rails above; each column hides when empty.
 */
export function DiscoverColumns({
  topAiring,
  mostPopular,
  newReleases,
  completed,
}: {
  topAiring: AnimeCardModel[];
  mostPopular: AnimeCardModel[];
  newReleases: AnimeCardModel[];
  completed: AnimeCardModel[];
}) {
  const columns = [
    { title: "Top Airing", items: topAiring, href: "/category/top-airing" },
    { title: "Most Popular", items: mostPopular, href: "/category/most-popular" },
    { title: "New Releases", items: newReleases, href: "/category/recently-added" },
    { title: "Completed", items: completed, href: "/category/completed" },
  ].filter((c) => c.items.length > 0);

  if (!columns.length) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((c) => (
        <DiscoverColumn key={c.title} title={c.title} items={c.items} href={c.href} />
      ))}
    </section>
  );
}
