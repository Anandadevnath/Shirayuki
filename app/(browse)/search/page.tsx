import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { search, safe } from "@/lib/api";
import { Grid } from "@/components/anime/Grid";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/SectionHeader";
import { EmptyState, ErrorState } from "@/components/common/States";

type SP = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: SP): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search · ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: SP) {
  const { q = "", page = "1" } = await searchParams;
  const query = q.trim();
  const pageNum = Math.max(1, Number(page) || 1);

  return (
    <div className="flex flex-col gap-[var(--space-header)]">
      <PageHeader title="Search" />
      {/* Refined focus state: the field's border warms to frost and the
          surface lifts on a soft, colourless shadow while typing — CSS-only,
          no JS, works with autofill. */}
      <form
        action="/search"
        className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-4 transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-frost/50 focus-within:shadow-[var(--shadow-soft)]"
      >
        <SearchIcon className="size-4 text-faint" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search anime…"
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-faint"
          aria-label="Search anime"
          autoFocus
        />
      </form>

      {!query ? (
        <EmptyState title="Search the catalogue" message="Type a title above to begin." />
      ) : (
        <Results query={query} page={pageNum} />
      )}
    </div>
  );
}

async function Results({ query, page }: { query: string; page: number }) {
  const res = await safe(() => search(query, page));
  if (!res.ok) return <ErrorState retryHref={`/search?q=${encodeURIComponent(query)}`} />;
  const data = res.data;
  if (!data.results.length)
    return <EmptyState message={`No results for “${query}”. Try another title.`} />;

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        Results for <span className="text-snow">“{query}”</span>
      </p>
      <Grid items={data.results} />
      <Pagination
        basePath="/search"
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        query={{ q: query }}
      />
    </>
  );
}
