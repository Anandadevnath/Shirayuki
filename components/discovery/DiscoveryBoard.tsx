"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { AnimeCardModel, Paginated } from "@/lib/providers/types";
import { Grid } from "@/components/anime/Grid";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { EmptyState } from "@/components/common/States";
import { PageHeader } from "@/components/common/SectionHeader";
import {
  applyDiscoveryFilters,
  distinctTypes,
  hasActiveFilters,
  hasRank,
  sameSelection,
  sortItems,
  unionById,
  type DiscoverySort,
} from "@/lib/discovery/toolbar-utils";
import {
  COLLECTIONS,
  DEFAULT_COLLECTION_ID,
  collectionById,
  collectionPath,
} from "@/lib/discovery/collections";
import { DiscoveryToolbar, type SortOption } from "./DiscoveryToolbar";

/**
 * Client filter/sort/view layer over the unified Category page.
 *
 * The page fetches its canonical collection server-side (RSC) and hands the raw
 * `items` down. SSR renders the *unfiltered* grid, so first paint is stable and
 * there is no hydration mismatch; filtering only kicks in after interaction.
 * Cards render through the shared <Grid> so the card ladder is never forked.
 *
 * Collection + genre changes are staged and applied by the warm pill, and the
 * URL / header follow the APPLIED selection so a shared or refreshed link lands
 * on the same view:
 *
 *   · Status  — switches which COLLECTION is shown. Browse-backed collections
 *               load `/api/browse?category=…`; home-backed ones (Trending,
 *               Latest Episodes) load `/api/collection?key=…`.
 *   · Genre   — multi-select OR union of `/api/browse?genre=…` listings.
 *
 * The URL is synced with `history.replaceState` (NOT a router navigation), so
 * the RSC page is never re-rendered and the user's selection is never reset.
 * The page seeds the initial collection from its route id or `?collection=`.
 */
export function DiscoveryBoard({
  items,
  collectionId = DEFAULT_COLLECTION_ID,
  genres = [],
  totalCount,
  showHeader = true,
  showCollection = true,
  showToolbar = true,
  pagination,
  className,
}: {
  items: AnimeCardModel[];
  /** The collection the server-rendered page represents (route id or
   *  `?collection=` seed). */
  collectionId?: string;
  /** genre taxonomy for the Genre control (from the provider) */
  genres?: { slug: string; name: string }[];
  /** catalogue-wide count for the `N anime` line */
  totalCount?: number;
  /** Render the board's own page header. Off for routes that own their hero
   *  (e.g. Browse A–Z), so the two headers can't duplicate. */
  showHeader?: boolean;
  /** Offer the Status/collection switcher. Off for routes whose scope is a
   *  single fixed catalogue (e.g. Browse A–Z). */
  showCollection?: boolean;
  /** Render the whole filter/sort toolbar. Off for routes that just list the
   *  catalogue without client-side filtering (e.g. Browse A–Z). */
  showToolbar?: boolean;
  /** The route's own server <Pagination>. Rendered only while no genre is
   *  applied (a genre listing pages itself, client-side, with its own count). */
  pagination?: ReactNode;
  className?: string;
}) {
  // The server page's listing, kept as the base to restore when filters clear.
  const [baseItems, setBaseItems] = useState(items);
  // Cards a collection switch resolved to (null → the route's own collection).
  const [collectionItems, setCollectionItems] = useState<AnimeCardModel[] | null>(null);
  // The genre listing (OR-union of the selected genres) for the current genre
  // page, plus that page's pagination — null when no genre is applied.
  const [genreItems, setGenreItems] = useState<AnimeCardModel[] | null>(null);
  const [genrePage, setGenrePage] = useState(1);
  const [genreTotalPages, setGenreTotalPages] = useState(1);

  const [appliedCollection, setAppliedCollection] = useState(collectionId);
  const [draftCollection, setDraftCollection] = useState(collectionId);
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
  const [draftGenres, setDraftGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Guards a resolved fetch from overwriting a newer one.
  const applyTokenRef = useRef(0);

  // Re-seed ONLY when the server genuinely serves a different page/collection
  // (pagination, a new route). Keyed on identity, not array reference, so an
  // incidental re-render can never reset the user's selection.
  const serverKey = useMemo(
    () =>
      `${collectionId}::${items.length}::${items[0]?.id ?? ""}::${items[items.length - 1]?.id ?? ""}`,
    [collectionId, items],
  );
  const serverKeyRef = useRef(serverKey);

  useEffect(() => {
    if (serverKeyRef.current === serverKey) return;
    serverKeyRef.current = serverKey;
    setBaseItems(items);
    setCollectionItems(null);
    setGenreItems(null);
    setGenrePage(1);
    setGenreTotalPages(1);
    setAppliedCollection(collectionId);
    setDraftCollection(collectionId);
    setAppliedGenres([]);
    setDraftGenres([]);
    setLoading(false);
    applyTokenRef.current += 1;
  }, [serverKey, items, collectionId]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<DiscoverySort>("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Source = the cards the grid shows.
  //
  // Genre and collection are both "which listing" selectors, and neither the
  // genre listings nor the collection listings are guaranteed to be subsets of
  // the route's page (e.g. az-list page 1 is the alphabetically-first 30
  // titles, while /genre/comedy is a completely different set). So an applied
  // selector REPLACES the base rather than intersecting with it:
  //   · genres applied  → the OR-union of those genre listings;
  //   · else collection → the applied collection listing;
  //   · else            → the route's server page.
  // Applying a collection clears any applied genres (and vice-versa) so the two
  // never silently fight over the same slot.
  const collectionSource = collectionItems ?? baseItems;
  const source = genreItems ?? collectionSource;

  const types = useMemo(() => distinctTypes(source), [source]);
  const rankAvailable = useMemo(() => hasRank(source), [source]);

  const filtered = useMemo(
    () => applyDiscoveryFilters(source, { query, type: typeFilter }),
    [source, query, typeFilter],
  );
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  const collectionPending = draftCollection !== appliedCollection;
  const genresPending = useMemo(
    () => !sameSelection(draftGenres, appliedGenres),
    [draftGenres, appliedGenres],
  );

  // Write the APPLIED COLLECTION into the address bar via its canonical path
  // (or `?collection=` for home buckets). `replaceState` avoids an RSC
  // navigation, so the selection is never reset, and a refresh re-seeds the
  // page from the same URL.
  const syncUrl = useCallback((collectionIdValue: string) => {
    if (typeof window === "undefined") return;
    const path = collectionPath(collectionIdValue);
    if (path !== `${window.location.pathname}${window.location.search}`) {
      history.replaceState(null, "", path);
    }
  }, []);

  // The header follows the APPLIED collection, so it tracks the grid.
  const appliedDef = collectionById(appliedCollection);
  const header = appliedDef ?? COLLECTIONS[0];

  // Keep the browser tab title in step with the collection.
  useEffect(() => {
    document.title = `${header.title} · Shirayuki`;
  }, [header.title]);

  /**
   * Fetch the OR-union of the given genres' listings for one page.
   *
   * A single genre is paginated exactly as the upstream reports it. For
   * multiple genres (no multi-genre endpoint) we fetch the same page number of
   * each and union the results, and report the MAX page count so the controls
   * never promise more than one of the genres can serve.
   */
  const loadGenrePage = useCallback(
    async (
      slugs: string[],
      page: number,
    ): Promise<{ results: AnimeCardModel[]; totalPages: number }> => {
      const pages = await Promise.all(
        slugs.map(async (slug) => {
          const res = await fetch(
            `/api/browse?genre=${encodeURIComponent(slug)}&page=${page}`,
          );
          if (!res.ok) throw new Error(String(res.status));
          return (await res.json()) as Paginated<AnimeCardModel>;
        }),
      );
      return {
        results: unionById(pages.map((p) => p.results)),
        totalPages: Math.max(1, ...pages.map((p) => p.totalPages)),
      };
    },
    [],
  );

  const applyDrafts = useCallback(async () => {
    const token = ++applyTokenRef.current;
    setLoading(true);
    try {
      // Genres and the collection share the one "which listing" slot, so only
      // the control the user actually changed is applied:
      //   · a pending genre change replaces the listing with the genre union
      //     (the collection resets to the neutral default);
      //   · otherwise a pending collection change clears any applied genres.
      const genresWon = genresPending;
      const collectionWon = !genresPending && collectionPending;

      let nextCollection: AnimeCardModel[] | null = genreItems
        ? null
        : collectionItems;
      let nextCollectionId = genresWon ? DEFAULT_COLLECTION_ID : appliedCollection;
      let nextGenres: AnimeCardModel[] | null = genreItems;
      let nextAppliedGenres = appliedGenres;
      let nextGenreTotalPages = genreTotalPages;

      if (genresWon) {
        if (draftGenres.length) {
          const page = await loadGenrePage(draftGenres, 1);
          nextGenres = page.results;
          nextGenreTotalPages = page.totalPages;
        } else {
          nextGenres = null;
          nextGenreTotalPages = 1;
        }
        nextAppliedGenres = draftGenres;
      } else if (collectionWon) {
        const def = collectionById(draftCollection);
        if (!def || def.id === DEFAULT_COLLECTION_ID) {
          nextCollection = null; // back to the route's canonical listing
        } else if (def.source === "home") {
          const res = await fetch(
            `/api/collection?key=${encodeURIComponent(def.key)}`,
          );
          if (!res.ok) throw new Error(String(res.status));
          nextCollection = ((await res.json()) as Paginated<AnimeCardModel>).results;
        } else {
          const res = await fetch(
            `/api/browse?category=${encodeURIComponent(def.key)}`,
          );
          if (!res.ok) throw new Error(String(res.status));
          nextCollection = ((await res.json()) as Paginated<AnimeCardModel>).results;
        }
        nextCollectionId = def?.id ?? DEFAULT_COLLECTION_ID;
        // Switching collection supersedes the genre filter.
        nextGenres = null;
        nextAppliedGenres = [];
        nextGenreTotalPages = 1;
      }

      if (token !== applyTokenRef.current) return; // superseded
      setCollectionItems(nextCollection);
      setGenreItems(nextGenres);
      setGenrePage(1);
      setGenreTotalPages(nextGenreTotalPages);
      setAppliedCollection(nextCollectionId);
      setAppliedGenres(nextAppliedGenres);
      // Keep the drafts in step with what is now applied.
      setDraftGenres(nextAppliedGenres);
      if (genresWon) setDraftCollection(DEFAULT_COLLECTION_ID);
      syncUrl(nextCollectionId);
    } catch {
      // Keep the previous view on failure; the drafts remain for a retry.
    } finally {
      if (token === applyTokenRef.current) setLoading(false);
    }
  }, [
    collectionPending,
    draftCollection,
    appliedCollection,
    collectionItems,
    genresPending,
    appliedGenres,
    draftGenres,
    genreItems,
    genreTotalPages,
    loadGenrePage,
    syncUrl,
  ]);

  /** Move to another page of the applied genre listing, in place. */
  const goToGenrePage = useCallback(
    async (page: number) => {
      if (!appliedGenres.length) return;
      const target = Math.max(1, Math.min(page, genreTotalPages));
      if (target === genrePage) return;
      const token = ++applyTokenRef.current;
      setLoading(true);
      try {
        const next = await loadGenrePage(appliedGenres, target);
        if (token !== applyTokenRef.current) return;
        setGenreItems(next.results);
        setGenrePage(target);
        setGenreTotalPages(next.totalPages);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // Keep the current page on failure.
      } finally {
        if (token === applyTokenRef.current) setLoading(false);
      }
    },
    [appliedGenres, genrePage, genreTotalPages, loadGenrePage],
  );

  const sortOptions: SortOption[] = useMemo(() => {
    const opts: SortOption[] = [
      { value: "default", label: "Default" },
      { value: "title-asc", label: "Title A–Z" },
      { value: "title-desc", label: "Title Z–A" },
    ];
    if (rankAvailable) opts.push({ value: "rank", label: "Rank" });
    return opts;
  }, [rankAvailable]);

  const collectionOptions = useMemo(
    () => COLLECTIONS.map((c) => ({ value: c.id, label: c.label })),
    [],
  );

  const hasCollectionFilter = appliedCollection !== DEFAULT_COLLECTION_ID;
  const hasGenreFilter = appliedGenres.length > 0;
  const active =
    hasActiveFilters({ query, type: typeFilter }) ||
    hasGenreFilter ||
    hasCollectionFilter;

  const clear = () => {
    setQuery("");
    setTypeFilter([]);
    setDraftGenres([]);
    setDraftCollection(DEFAULT_COLLECTION_ID);
    if (hasGenreFilter) {
      setGenreItems(null);
      setGenrePage(1);
      setGenreTotalPages(1);
    }
    if (hasCollectionFilter) {
      setCollectionItems(null);
      setAppliedCollection(DEFAULT_COLLECTION_ID);
    }
    history.replaceState(null, "", collectionPath(DEFAULT_COLLECTION_ID));
  };

  return (
    <div className={className}>
      {showHeader && (
        <PageHeader
          eyebrow={header.eyebrow}
          icon={header.icon}
          title={header.title}
          lede={header.lede}
        />
      )}

      {showToolbar && (
        <div className={showHeader ? "mt-[var(--space-header)]" : undefined}>
          <DiscoveryToolbar
            query={query}
            onQueryChange={setQuery}
            types={types}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            genres={genres}
            genreDraft={draftGenres}
            onGenreChange={setDraftGenres}
            onApplyGenres={applyDrafts}
            genreLoading={loading}
            genresPending={genresPending}
            collection={draftCollection}
            onCollectionChange={setDraftCollection}
            collectionOptions={collectionOptions}
            collectionLoading={loading}
            onApplyCollection={applyDrafts}
            collectionPending={collectionPending}
            showCollection={showCollection}
            sortOptions={sortOptions}
            sort={sort}
            onSortChange={(s) => setSort(s as DiscoverySort)}
            view={view}
            onViewChange={setView}
            resultCount={sorted.length}
            totalOnPage={source.length}
            totalCount={totalCount}
            active={active}
            onClear={clear}
          />
        </div>
      )}

      <div
        className={
          (showToolbar ? "mt-5 " : "") +
          "transition-opacity duration-200 " +
          (loading ? "pointer-events-none opacity-50" : "opacity-100")
        }
        aria-busy={loading || undefined}
      >
        {sorted.length === 0 ? (
          <EmptyState
            title="No matches"
            message={
              hasGenreFilter || hasCollectionFilter
                ? "No titles matched that selection together with your other filters. Clear them to see everything again."
                : active
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

      {/* Genre pagination. The route's own <Pagination> describes the server
          listing (e.g. az-list's 342 pages), which is wrong once a genre is
          applied — the genre listing has its own page count (Action = 130). So
          the board pages the genre listing itself, in place. */}
      {hasGenreFilter && genreTotalPages > 1 && !loading && (
        <GenrePager
          currentPage={genrePage}
          totalPages={genreTotalPages}
          onPage={goToGenrePage}
        />
      )}

      {/* The route's server pagination, shown only while no genre overrides the
          listing. */}
      {!hasGenreFilter && pagination && <div className="mt-10">{pagination}</div>}
    </div>
  );
}

/**
 * Client-side pager for an applied genre listing. Mirrors the shared
 * <Pagination> visuals, but drives a callback (fetch page N in place) instead of
 * navigating to a route whose listing no longer matches the applied genres.
 */
function GenrePager({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const windowSize = 5;
  const start = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - windowSize + 1),
  );
  const pages = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => start + i,
  ).filter((p) => p >= 1 && p <= totalPages);

  const btn =
    "grid h-9 min-w-9 place-items-center rounded-sm border border-line px-2 text-sm transition-[color,border-color,transform,background-color] duration-200 ease-out active:scale-95 hover:-translate-y-px";

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Genre pagination"
    >
      {currentPage > 2 && (
        <button
          type="button"
          onClick={() => onPage(1)}
          className={`${btn} text-muted hover:text-snow`}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </button>
      )}
      {currentPage > 1 && (
        <button
          type="button"
          onClick={() => onPage(currentPage - 1)}
          className={btn}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={`${btn} ${
            p === currentPage
              ? "border-frost/50 bg-frost-soft text-frost"
              : "text-muted hover:text-snow"
          }`}
        >
          {p}
        </button>
      ))}
      {currentPage < totalPages && (
        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          className={btn}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
      {currentPage < totalPages - 1 && (
        <button
          type="button"
          onClick={() => onPage(totalPages)}
          className={`${btn} text-muted hover:text-snow`}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </button>
      )}
    </nav>
  );
}
