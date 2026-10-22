import type { Metadata } from "next";
import Link from "next/link";
import { getCategory, safe } from "@/lib/api";
import { categoryHeader } from "@/lib/utils/category-copy";
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
  return { title: categoryHeader(id).title };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const res = await safe(() => getCategory(id, pageNum));

  const h = categoryHeader(id);

  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader
        eyebrow={h.eyebrow}
        icon={h.icon}
        title={h.title}
        lede={h.lede}
      >
        {id === "top-airing" && (
          <Link
            href="/schedule"
            className="shrink-0 text-sm text-muted transition-colors hover:text-frost"
          >
            View release schedule
          </Link>
        )}
      </PageHeader>
      {!res.ok ? (
        <ErrorState retryHref={`/category/${encodeURIComponent(id)}`} />
      ) : !res.data.results.length ? (
        <EmptyState />
      ) : (
        <>
          <DiscoveryBoard items={res.data.results} />
          <Pagination
            basePath={`/category/${encodeURIComponent(id)}`}
            currentPage={res.data.currentPage}
            totalPages={res.data.totalPages}
          />
        </>
      )}
    </div>
  );
}
