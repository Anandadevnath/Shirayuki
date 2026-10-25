import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { getAZ, getGenres, safe } from "@/lib/api";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { AlphabetNav } from "@/components/common/AlphabetNav";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";

/**
 * Full-catalogue browse. AnimeX's azlist ignores the letter and returns the
 * entire library (~20k titles, ~342 pages) sorted by popularity, so we expose
 * it as a single paginated "Browse all" surface. The letter strip is honest
 * navigation to the same catalogue, not a filter — see `AlphabetNav`.
 *
 * This page owns its hero, so the shared `DiscoveryBoard` is rendered WITHOUT
 * its own header (`showHeader={false}`) and without the collection/Status
 * switcher (`showCollection={false}`) — the two headers would otherwise
 * duplicate ("THE ANIME LIBRARY" + "THE WHOLE CATALOGUE").
 */

type Props = {
  params: Promise<{ letter: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page = "1" } = await searchParams;
  return { title: `Browse all anime · Page ${page}` };
}

export default async function BrowsePage({ params, searchParams }: Props) {
  const { letter } = await params;
  const current = decodeURIComponent(letter);
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const [res, genres] = await Promise.all([
    safe(() => getAZ(current, pageNum)),
    safe(() => getGenres()),
  ]);
  const genreList = genres.ok ? genres.data : [];

  return (
    <div className="flex flex-col">
      {/* ── Hero + alphabet, one centred block ── */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-label flex items-center gap-1.5 text-frost">
            <Compass className="size-3.5" aria-hidden />
            THE ANIME LIBRARY
          </p>
          <h1 className="text-page">Explore the Anime Universe</h1>
          <p className="max-w-2xl text-desc text-muted">
            From timeless classics to the latest releases, discover anime by title.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <AlphabetNav />
          {res.ok && (
            <p className="text-caption text-faint">
              Page {res.data.currentPage.toLocaleString()} of{" "}
              {res.data.totalPages.toLocaleString()} · sorted by popularity
            </p>
          )}
        </div>
      </header>

      {/* ── Listing ── */}
      <div className="mt-6">
        {!res.ok ? (
          <ErrorState retryHref={`/az/${encodeURIComponent(current)}`} />
        ) : !res.data.results.length ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            <DiscoveryBoard
              items={res.data.results}
              genres={genreList}
              showHeader={false}
              showCollection={false}
            />
            <Pagination
              basePath={`/az/${encodeURIComponent(current)}`}
              currentPage={res.data.currentPage}
              totalPages={res.data.totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}
