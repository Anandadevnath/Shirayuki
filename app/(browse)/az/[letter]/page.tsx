import type { Metadata } from "next";
import { getAZ, safe } from "@/lib/api";
import { Grid } from "@/components/anime/Grid";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";

/**
 * Full-catalogue browse. AnimeX's azlist ignores the letter and returns the
 * entire library (~20k titles, ~685 pages) sorted by popularity, so we expose
 * it as a single paginated "Browse all" surface rather than dead letter tabs.
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
  const res = await safe(() => getAZ(current, pageNum));

  return (
    <div className="pt-4">
      <p className="text-sm text-frost">Catalogue</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold">Browse all anime</h1>
      {res.ok && (
        <p className="mb-6 text-sm text-muted">
          {res.data.totalPages.toLocaleString()} pages · sorted by popularity
        </p>
      )}

      {!res.ok ? (
        <ErrorState retryHref={`/az/${encodeURIComponent(current)}`} />
      ) : !res.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <Grid items={res.data.results} />
          <Pagination
            basePath={`/az/${encodeURIComponent(current)}`}
            currentPage={res.data.currentPage}
            totalPages={res.data.totalPages}
          />
        </>
      )}
    </div>
  );
}
