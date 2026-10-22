"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { hasTypeChoice, resultCaption } from "@/lib/discovery/toolbar-utils";
import { ToolbarSelect } from "./ToolbarSelect";
import { ViewToggle } from "./ViewToggle";

export type SortOption = { value: string; label: string };

/**
 * The shared discovery toolbar: one glass panel above the poster grid with a
 * title search, an optional Type filter, a sort, an optional Grid/List toggle,
 * a real result count and a Clear-filters affordance.
 *
 * Every control here is backed by data the fetched page actually carries
 * (`title`, `type`, `rank`) — the upstream list API takes only `?page=`, so
 * filtering is a client-side view over the current page. The count line says
 * so ("X of N titles on this page") rather than implying a catalogue-wide
 * filter. Controls the backend can't honour (year / season / status / rating)
 * are absent by design, not stubbed.
 */
export interface DiscoveryToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  /** distinct types present on the page; [] hides the Type control */
  types: string[];
  typeFilter: string | null;
  onTypeChange: (t: string | null) => void;
  /** caller supplies only the sorts the data supports */
  sortOptions: SortOption[];
  sort: string;
  onSortChange: (s: string) => void;
  /** omit to hide the Grid/List toggle */
  view?: "grid" | "list";
  onViewChange?: (v: "grid" | "list") => void;
  /** real, post-filter count */
  resultCount: number;
  /** total items on the current page */
  totalOnPage: number;
  /** any filter active → show Clear */
  active: boolean;
  onClear: () => void;
  className?: string;
}

export function DiscoveryToolbar({
  query,
  onQueryChange,
  types,
  typeFilter,
  onTypeChange,
  sortOptions,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  totalOnPage,
  active,
  onClear,
  className,
}: DiscoveryToolbarProps) {
  const showView = view != null && onViewChange != null;
  // Hide the Type control when the page has ≤1 distinct type — it would be a
  // select with a single real option and could never change the results.
  const showType = hasTypeChoice(types);

  return (
    <section
      aria-label="Filter and sort results"
      className={cn(className)}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Title search */}
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor="discovery-search" className="sr-only">
            Filter by title
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
          />
          <input
            id="discovery-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter this page by title…"
            autoComplete="off"
            className="h-10 w-full rounded-[var(--radius-btn)] border border-line bg-base/40 pl-9 pr-3 text-sm text-snow outline-none transition-colors duration-200 placeholder:text-faint hover:border-frost/40 focus-visible:border-frost/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          />
        </div>

        {showType && (
          <ToolbarSelect
            id="discovery-type"
            label="Filter by type"
            value={typeFilter ?? ""}
            onChange={(v) => onTypeChange(v === "" ? null : v)}
            options={[
              { value: "", label: "All types" },
              ...types.map((t) => ({ value: t, label: t })),
            ]}
            className="min-w-[9.5rem]"
          />
        )}

        <ToolbarSelect
          id="discovery-sort"
          label="Sort results"
          value={sort}
          onChange={onSortChange}
          options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
          className="min-w-[10.5rem]"
        />

        {active && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-btn)] border border-transparent px-3 text-sm font-medium text-muted transition-colors duration-200 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          >
            <X className="size-4" /> Clear
          </button>
        )}

        {showView && (
          <div className="ml-auto">
            <ViewToggle view={view} onChange={onViewChange} />
          </div>
        )}
      </div>

      <p className="mt-2.5 font-accent text-[11px] text-faint" aria-live="polite">
        {resultCaption(resultCount, totalOnPage)}
      </p>
    </section>
  );
}
