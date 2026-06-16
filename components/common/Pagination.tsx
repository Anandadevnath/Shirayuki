import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Builds a page href preserving the base path + existing query (minus page). */
export function Pagination({
  basePath,
  currentPage,
  totalPages,
  query = {},
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  const windowSize = 5;
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - windowSize + 1));
  const pages = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => start + i,
  ).filter((p) => p >= 1 && p <= totalPages);

  const btn =
    "grid h-9 min-w-9 place-items-center rounded-sm border border-line px-2 text-sm transition-colors";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {currentPage > 2 && (
        <Link href={href(1)} className={cn(btn, "text-muted hover:text-snow")} aria-label="First page">
          <ChevronsLeft className="size-4" />
        </Link>
      )}
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} className={btn} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={cn(
            btn,
            p === currentPage
              ? "border-frost/50 bg-frost-soft text-frost"
              : "text-muted hover:text-snow",
          )}
        >
          {p}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} className={btn} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      )}
      {currentPage < totalPages - 1 && (
        <Link
          href={href(totalPages)}
          className={cn(btn, "text-muted hover:text-snow")}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
