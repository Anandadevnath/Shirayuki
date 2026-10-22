import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { getAZ, safe } from "@/lib/api";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { AlphabetNav } from "@/components/common/AlphabetNav";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/SectionHeader";
import { EmptyState, ErrorState } from "@/components/common/States";

/**
 * Full-catalogue browse. AnimeX's azlist ignores the letter and returns the
 * entire library (~20k titles, ~685 pages) sorted by popularity, so we expose
 * it as a single paginated "Browse all" surface. The letter strip is honest
 * navigation to the same catalogue, not a filter — see `AlphabetNav`.
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
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader
        eyebrow="THE ANIME LIBRARY"
        icon={Compass}
        title="Explore the Anime Universe"
        lede="From timeless classics to the latest releases, discover anime by title."
      />

      <div className="flex flex-col gap-4">
        <AlphabetNav />
        {res.ok && (
          <p className="text-sm text-muted">
            {res.data.totalPages.toLocaleString()} pages · sorted by popularity
          </p>
        )}
      </div>

      {!res.ok ? (
        <ErrorState retryHref={`/az/${encodeURIComponent(current)}`} />
      ) : !res.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <DiscoveryBoard items={res.data.results} />
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
