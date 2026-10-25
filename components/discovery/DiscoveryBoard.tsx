"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  className?: string;
}) {
  // The server page's listing, kept as the base to restore when filters clear.
  const [baseItems, setBaseItems] = useState(items);
  // Cards a collection switch resolved to (null → the route's own collection).
  const [collectionItems, setCollectionItems] = useState<AnimeCardModel[] | null>(null);
  // Cards the genre filter resolved to (null → no genre applied).
  const [genreItems, setGenreItems] = useState<AnimeCardModel[] | null>(null);

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

  // Source = base page listing, replaced by an applied collection, then that
  // intersected with an applied genre set:
  //   collection applied → collectionItems; else baseItems.
  //   genres applied     → keep only cards in the genre union (within the
  //                        current collection).
  const collectionSource = collectionItems ?? baseItems;
  const source = useMemo(() => {
    if (genreItems === null) return collectionSource;
    const ids = new Set(genreItems.map((c) => c.id));
    return collectionSource.filter((c) => ids.has(c.id));
  }, [collectionSource, genreItems]);

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

  const fetchListing = useCallback(async (slug: string) => {
    const res = await fetch(`/api/browse?genre=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as Paginated<AnimeCardModel>).results;
  }, []);

  const applyDrafts = useCallback(async () => {
    const token = ++applyTokenRef.current;
    setLoading(true);
    try {
      let nextCollection = collectionItems;
      let nextCollectionId = appliedCollection;
      if (collectionPending) {
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
      }

      let nextGenres = genreItems;
      if (genresPending) {
        nextGenres = draftGenres.length
          ? unionById(await Promise.all(draftGenres.map(fetchListing)))
          : null;
      }

      if (token !== applyTokenRef.current) return; // superseded
      setCollectionItems(nextCollection);
      setGenreItems(nextGenres);
      setAppliedCollection(nextCollectionId);
      setAppliedGenres(draftGenres);

      // Sync the URL to the applied collection so a refresh or a shared link
      // reproduces this view without an RSC swap that would reset state.
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
    draftGenres,
    genreItems,
    fetchListing,
    syncUrl,
  ]);

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
    if (hasGenreFilter) setGenreItems(null);
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
    </div>
  );
}
