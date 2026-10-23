"use client";

import { useMemo, useState } from "react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { Grid } from "@/components/anime/Grid";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { EmptyState } from "@/components/common/States";
import {
  applyDiscoveryFilters,
  distinctTypes,
  hasActiveFilters,
  hasRank,
  sortItems,
  type DiscoverySort,
} from "@/lib/discovery/toolbar-utils";
import { DiscoveryToolbar, type SortOption } from "./DiscoveryToolbar";

/**
 * Client filter/sort/view layer over an already-fetched page of cards.
 *
 * The page fetches server-side (RSC) and hands the raw `items` down. SSR
 * renders the *unfiltered* grid — byte-identical to the pre-toolbar markup —
 * so first paint is stable and there is no hydration mismatch; filtering only
 * kicks in after interaction. Cards render through the shared <Grid> (which
 * owns the 2/3/5/6/7 ladder and the `.grid-in` entrance) so this adds a toolbar
 * without forking the grid.
 *
 * Sorting/filtering is deliberately limited to what the normalized card
 * carries: `title`, `type`, `rank`. We never fabricate year/score/status.
 */
export function DiscoveryBoard({
  items,
  genres = [],
  totalCount,
  className,
}: {
  items: AnimeCardModel[];
  /** genre taxonomy for the Genre navigator (from the provider) */
  genres?: { slug: string; name: string }[];
  /** catalogue-wide count for the `N anime` line */
  totalCount?: number;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<DiscoverySort>("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  const types = useMemo(() => distinctTypes(items), [items]);
  const rankAvailable = useMemo(() => hasRank(items), [items]);

  const filtered = useMemo(
    () => applyDiscoveryFilters(items, { query, type: typeFilter }),
    [items, query, typeFilter],
  );
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  const sortOptions: SortOption[] = useMemo(() => {
    const opts: SortOption[] = [
      { value: "default", label: "Default" },
      { value: "title-asc", label: "Title A–Z" },
      { value: "title-desc", label: "Title Z–A" },
    ];
    if (rankAvailable) opts.push({ value: "rank", label: "Rank" });
    return opts;
  }, [rankAvailable]);

  const active = hasActiveFilters({ query, type: typeFilter });

  const clear = () => {
    setQuery("");
    setTypeFilter([]);
  };

  return (
    <div className={className}>
      <DiscoveryToolbar
        query={query}
        onQueryChange={setQuery}
        types={types}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        genres={genres}
        sortOptions={sortOptions}
        sort={sort}
        onSortChange={(s) => setSort(s as DiscoverySort)}
        view={view}
        onViewChange={setView}
        resultCount={sorted.length}
        totalOnPage={items.length}
        totalCount={totalCount}
        active={active}
        onClear={clear}
      />

      <div className="mt-5">
        {sorted.length === 0 ? (
          <EmptyState
            title="No matches on this page"
            message={
              active
                ? "None of the titles on this page match your filters. Clear them to see everything again — or use the pages below to browse further."
                : "Nothing here yet."
            }
          />
        ) : view === "grid" ? (
          <Grid items={sorted} />
        ) : (
          <ul className="flex flex-col gap-1">
            {sorted.map((a) => (
              <li key={a.id}>
                <AnimeCard anime={a} variant="row" />
              </li>
            ))}
          </ul>
        )}
      </div>

      {active && sorted.length === 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={clear}
            className="press text-btn flex h-10 items-center gap-2 rounded-[var(--radius-btn)] border border-line px-4 text-muted hover:border-frost/40 hover:text-frost"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
