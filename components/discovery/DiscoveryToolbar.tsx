"use client";

import { Search, Funnel, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CANONICAL_TYPES, resultCaption, SORT_MENU } from "@/lib/discovery/toolbar-utils";
import { FilterPopover, type FilterOption } from "./FilterPopover";
import { FilterLink } from "./FilterLink";
import { ViewToggle } from "./ViewToggle";

export type SortOption = { value: string; label: string };

/** The full sort menu from the reference. A sort is only enabled when the
 *  caller's `sortOptions` actually supports it (e.g. `rank` only when a card
 *  carries a rank); the rest are shown disabled rather than silently doing
 *  nothing. */
function buildSortOptions(supported: SortOption[]): FilterOption[] {
  const supportedValues = new Set(supported.map((o) => o.value));
  return SORT_MENU.map((o) => ({
    value: o.value,
    label: o.label,
    disabled: !supportedValues.has(o.value),
    hint: supportedValues.has(o.value)
      ? undefined
      : "This sort needs catalogue-wide data that isn't available on this page.",
  }));
}

/**
 * The shared discovery toolbar, styled to the reference design: one row of
 * glass pills — Search, Type, Genre, Status, sort — then a sliders affordance
 * and a warm "Filter" action pill, with a `N anime` count and the Grid/List
 * toggle on the right of the count line.
 *
 * Honesty rules (repo constraint `ui_no_decorative_dead_controls`):
 * - Search / Type / sort are REAL client-side filters over the loaded page.
 * - Genre is a REAL multi-select: the Genre pill stages a draft (several
 *   genres, panel stays open) and the warm pill APPLIES it — the board loads
 *   the union of those genre listings in place (OR match). Once applied the
 *   pill becomes Clear. Nothing navigates to /genre/<slug> from this control.
 * - Status is a REAL collection switcher: each option maps to a distinct
 *   upstream collection (`lib/discovery/collections`), applied in place so the
 *   user never leaves the Category page.
 * - The count is real (`N anime`, catalogue total when the caller knows it).
 */
export interface DiscoveryToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  /** distinct types present on the page (kept for callers; the Type menu now
   *  shows the full canonical taxonomy, so this is no longer needed to build
   *  the options) */
  types?: string[];
  typeFilter: string[];
  onTypeChange: (t: string[]) => void;
  /** full genre taxonomy for the Genre control; [] hides it */
  genres: { slug: string; name: string }[];
  /** draft genre selection (not yet applied) */
  genreDraft: string[];
  /** set the full draft genre selection */
  onGenreChange: (g: string[]) => void;
  /** apply the draft genre selection (the warm pill, when a draft is pending) */
  onApplyGenres: () => void;
  /** true while an applied genre union is loading */
  genreLoading?: boolean;
  /** true when the draft differs from what is applied → the pill becomes
   *  "Filter"; otherwise an applied selection makes it "Clear". */
  genresPending?: boolean;
  /** The current collection (Status draft): a `COLLECTIONS[].id`. */
  collection: string;
  /** Change the collection draft (applied via the warm pill, like genres). */
  onCollectionChange: (id: string) => void;
  /** Status options; supplied by the board from `lib/discovery/collections`. */
  collectionOptions: FilterOption[];
  /** true while a switched collection is loading */
  collectionLoading?: boolean;
  /** apply the pending collection change (fires with the warm pill) */
  onApplyCollection?: () => void;
  /** true when the collection draft differs from what is applied */
  collectionPending?: boolean;
  /** Render the Status/collection pill. Off for routes scoped to one fixed
   *  catalogue (e.g. Browse A–Z). */
  showCollection?: boolean;
  /** caller supplies only the sorts the data supports */
  sortOptions: SortOption[];
  sort: string;
  onSortChange: (s: string) => void;
  /** omit to hide the Grid/List toggle */
  view?: "grid" | "list";
  onViewChange?: (v: "grid" | "list") => void;
  /** real, post-filter count on the page */
  resultCount: number;
  /** total items on the current page */
  totalOnPage: number;
  /** catalogue-wide count for the `N anime` line; falls back to page total */
  totalCount?: number;
  /** any filter active → the action pill becomes Clear */
  active: boolean;
  onClear: () => void;
  className?: string;
}

export function DiscoveryToolbar({
  query,
  onQueryChange,
  typeFilter,
  onTypeChange,
  genres,
  genreDraft,
  onGenreChange,
  onApplyGenres,
  genreLoading = false,
  genresPending = false,
  collection,
  onCollectionChange,
  collectionOptions,
  collectionLoading = false,
  onApplyCollection,
  collectionPending = false,
  showCollection = true,
  sortOptions,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  totalOnPage,
  totalCount,
  active,
  onClear,
  className,
}: DiscoveryToolbarProps) {
  const showView = view != null && onViewChange != null;
  // The Type control lists the full canonical taxonomy (not just the types on
  // this page), so it is always rendered — a fixed menu, not a page-derived
  // one.
  const showType = true;
  const typeOptions: FilterOption[] = CANONICAL_TYPES.map((t) => ({
    value: t,
    label: t,
  }));
  const count = totalCount ?? totalOnPage;

  // The warm pill applies any pending draft (genre and/or collection) or clears
  // active filters. `onApply` is chosen so a collection switch also goes through
  // the same single button.
  const pending = genresPending || collectionPending;
  const busy = genreLoading || collectionLoading;
  const onApply = () => {
    if (genresPending) onApplyGenres();
    if (collectionPending) onApplyCollection?.();
  };

  return (
    <section aria-label="Filter and sort results" className={cn(className)}>
      {/* Count + view toggle row */}
      <div className="mb-3 flex items-center justify-end gap-3">
        <p className="font-accent text-[11px] text-faint" aria-live="polite">
          {count.toLocaleString()} anime
        </p>
        {showView && <ViewToggle view={view} onChange={onViewChange} />}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:flex-nowrap">
        {/* Title search — one equal cell in the row */}
        <div className="relative min-w-0 flex-1 basis-40">
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
            placeholder="Search…"
            autoComplete="off"
            className="h-11 w-full rounded-[var(--radius-btn)] border border-line bg-base/40 pl-9 pr-3 text-sm text-snow outline-none transition-colors duration-200 placeholder:text-faint hover:border-frost/40 focus-visible:border-frost/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          />
        </div>

        {showType && (
          <FilterPopover
            label="Type"
            multiple
            allLabel="All types"
            options={typeOptions}
            value={typeFilter}
            onChange={onTypeChange}
            className="min-w-0 flex-1 basis-36"
          />
        )}

        {genres.length > 0 && (
          <FilterLink
            label="Genre"
            options={genres}
            value={genreDraft}
            onChange={onGenreChange}
            allLabel="All genres"
            className="min-w-0 flex-1 basis-36"
          />
        )}

        {/* Status: switches which COLLECTION the page shows (Most Popular,
            Airing, Trending, …). It is a single-select whose options are the
            real collections the data backs; applying loads that collection in
            place — the user never leaves the Category page. Hidden on routes
            scoped to a single fixed catalogue (Browse A–Z). */}
        {showCollection && (
          <FilterPopover
            label="Status"
            options={collectionOptions}
            value={[collection]}
            restingValue={[collectionOptions[0]?.value ?? collection]}
            onChange={(v) => onCollectionChange(v[0] ?? collection)}
            className="min-w-0 flex-1 basis-36"
          />
        )}

        <FilterPopover
          label="Default"
          options={buildSortOptions(sortOptions)}
          value={[sort]}
          restingValue={["default"]}
          onChange={(v) => onSortChange(v[0] ?? sort)}
          className="min-w-0 flex-1 basis-36"
        />

        {/* Sliders affordance — a visual echo of the reference bar. Non-
            interactive by design (the filter facets are the pills beside it),
            so it is `aria-hidden` and carries no control semantics. */}
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-btn)] border border-line bg-base/40 text-muted"
        >
          <SlidersHorizontal className="size-4" />
        </span>

        {/* The warm action pill. When a genre draft or collection draft is
            pending it APPLIES the selection ("Filter"); otherwise, with
            filters applied, it clears them ("Clear"). At rest with nothing
            pending or applied it is honestly dimmed and inert. */}
        <button
          type="button"
          onClick={pending ? onApply : onClear}
          disabled={!pending && !active}
          aria-busy={busy || undefined}
          className={cn(
            "flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-btn)] border px-4 text-sm font-semibold transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
            pending || active
              ? "border-coral bg-coral on-coral press"
              : "cursor-not-allowed border-coral/30 bg-coral/25 text-coral/70",
          )}
        >
          <Funnel className={cn("size-4", busy && "animate-pulse")} />
          {pending ? "Filter" : active ? "Clear" : "Filter"}
        </button>
      </div>

      <p className="mt-2.5 font-accent text-[11px] text-faint" aria-live="polite">
        {resultCaption(resultCount, totalOnPage)}
      </p>
    </section>
  );
}
