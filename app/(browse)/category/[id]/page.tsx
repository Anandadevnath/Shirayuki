import type { Metadata } from "next";
import { getCategory, safe } from "@/lib/api";
import { Grid } from "@/components/anime/Grid";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState } from "@/components/common/States";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

const pretty = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: pretty(id) };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const res = await safe(() => getCategory(id, pageNum));

  return (
    <div className="pt-4">
      <h1 className="mb-6 text-2xl font-bold">{pretty(id)}</h1>
      {!res.ok ? (
        <ErrorState retryHref={`/category/${id}`} />
      ) : !res.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <Grid items={res.data.results} />
          <Pagination
            basePath={`/category/${id}`}
            currentPage={res.data.currentPage}
            totalPages={res.data.totalPages}
          />
        </>
      )}
    </div>
  );
}
