import type { AnimeCardModel } from "@/lib/providers/types";

/**
 * Minimal card shape needed by local command-palette index.
 * Kept tiny so the cached payload stays cheap.
 */
export type SearchIndexEntry = Pick<
  AnimeCardModel,
  "id" | "title" | "jname" | "poster" | "type" | "episodes" | "score"
>;

let indexPromise: Promise<SearchIndexEntry[]> | null = null;
let indexEntries: SearchIndexEntry[] | null = null;

export function loadSearchIndex(): Promise<SearchIndexEntry[]> {
  if (indexEntries) return Promise.resolve(indexEntries);
  if (indexPromise) return indexPromise;

  indexPromise = fetch("/api/search-index")
    .then((r) => r.json() as Promise<{ results: SearchIndexEntry[] }>)
    .then((j) => {
      indexEntries = j.results ?? [];
      return indexEntries;
    })
    .catch(() => {
      indexEntries = [];
      indexPromise = null;
      return [];
    });

  return indexPromise;
}

export function prefetchSearchIndex() {
  void loadSearchIndex();
}

export function hasSearchIndexCache() {
  return indexEntries != null;
}
