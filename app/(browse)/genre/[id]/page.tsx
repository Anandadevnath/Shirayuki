import type { Metadata } from "next";
import { getGenre, safe } from "@/lib/api";
import { titleize } from "@/lib/utils/format";
import { DiscoveryBoard } from "@/components/discovery/DiscoveryBoard";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/SectionHeader";
import { EmptyState, ErrorState } from "@/components/common/States";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${titleize(id)} anime` };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const res = await safe(() => getGenre(id, pageNum));

  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader eyebrow="Genre" title={titleize(id)} />
      {!res.ok ? (
        <ErrorState retryHref={`/genre/${encodeURIComponent(id)}`} />
      ) : !res.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <DiscoveryBoard items={res.data.results} />
          <Pagination
            basePath={`/genre/${encodeURIComponent(id)}`}
            currentPage={res.data.currentPage}
            totalPages={res.data.totalPages}
          />
        </>
      )}
    </div>
  );
}
