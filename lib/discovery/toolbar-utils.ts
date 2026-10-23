/**
 * Pure, framework-free discovery helpers.
 *
 * The upstream list endpoints take only `?page=` — there is NO server-side
 * filter/sort API — so the toolbar filters and sorts the *already-fetched*
 * page client-side. Everything here is synchronous and side-effect free so it
 * can run identically in an RSC, a client component and a `node --test` suite
 * (see toolbar-utils.test.ts).
 *
 * Only attributes the normalized card actually carries are used: `title`,
 * `type` and `rank`. `score` is always `null` post-normalization, so it is
 * deliberately never a sort/filter key.
 *
 * The match/sort helpers are structural over `{ title, type }` (and `rank`
 * for the rank sort) so the schedule's `ScheduleItem` rows — which share the
 * `title`/`type` shape — reuse them without an adapter.
 */

/** The minimum shape every filterable row must expose. */
export interface FilterableItem {
  title: string;
  type?: string | null;
}

/** The sort keys the toolbar may offer. `rank` is only offered by a caller
 *  when at least one visible card carries a non-null `rank`. `default` keeps
 *  the server's fetched order untouched — the SSR-safe initial value, so the
 *  first client render matches the server markup exactly. */
export type DiscoverySort = "default" | "title-asc" | "title-desc" | "rank";

/** The canonical anime type taxonomy, in the order the reference bar lists it.
 *  The upstream card `type` is uppercase (e.g. `TV`, `MOVIE`), so match
 *  case-insensitively against these labels. */
export const CANONICAL_TYPES: string[] = [
  "Movie",
  "Music",
  "ONA",
  "OVA",
  "Special",
  "TV",
  "TV_SHORT",
  "TV Special",
];

/** The full sort menu shown by the reference bar. Only `default`, the title
 *  sorts and `rank` are computable from the loaded page; the rest need
 *  catalogue-wide fields the API doesn't expose, so callers must render them
 *  disabled (see `DiscoveryToolbar`) rather than as silent no-ops. */
export const SORT_MENU: { value: string; label: string; supported: boolean }[] = [
  { value: "default", label: "Default", supported: true },
  { value: "latest-updated", label: "Latest Updated", supported: false },
  { value: "latest-added", label: "Latest Added", supported: false },
  { value: "score", label: "Score", supported: false },
  { value: "title-asc", label: "Name A–Z", supported: true },
  { value: "release-date", label: "Release Date", supported: false },
  { value: "most-viewed", label: "Most Viewed", supported: false },
  { value: "episodes", label: "Number of episodes", supported: false },
];

/** Type filter value: the selected concrete card `type`s, or `[]` for "all".
 *  A union — an empty array means "no restriction", a single entry means an
 *  exact match, and several entries mean "any of these" (the Type control is
 *  a multi-select). */
export type TypeFilter = string[];

export interface DiscoveryFilterState {
  query: string;
  type: TypeFilter;
}

/** Case-insensitive, locale-aware title comparison (accent/punctuation
 *  insensitive), so "étoile" and "etoile" collate together. */
export function compareTitle(a: FilterableItem, b: FilterableItem): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

/** Distinct `type` values present on the page, in first-seen order.
 *  Blank/null types are dropped — the Type control never offers an option
 *  that matches nothing. */
export function distinctTypes(items: FilterableItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const t = it.type?.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** The Type control is only worth rendering when the page actually mixes
 *  types (a single-type page has nothing to filter). Operates on an already
 *  de-duplicated `type` list, so it is the same predicate `DiscoveryToolbar`
 *  uses to gate the control. */
export function hasTypeChoice(types: string[]): boolean {
  return types.length > 1;
}

/** True when a rank sort can be offered — at least one card has a rank. */
export function hasRank(items: ({ rank?: number | null })[]): boolean {
  return items.some((it) => it.rank != null);
}

/** Case-insensitive substring match on the English title. An empty/blank
 *  query passes everything through. */
export function matchesQuery(item: FilterableItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.title.toLowerCase().includes(q);
}

/** Type filter match. The menu offers the canonical taxonomy ("Movie", "TV",
 *  "TV_SHORT"…), while the upstream card `type` is uppercase ("MOVIE", "TV"),
 *  so the comparison is case-insensitive. An empty array = all; otherwise the
 *  card's type must equal one of the selected types (union). */
export function matchesType(item: FilterableItem, type: TypeFilter): boolean {
  if (type.length === 0) return true;
  const cardType = (item.type?.trim() ?? "").toLowerCase();
  return type.some((t) => t.toLowerCase() === cardType);
}

/** When the query is set or at least one type is selected, a card may be
 *  hidden. */
export function hasActiveFilters({ query, type }: DiscoveryFilterState): boolean {
  return query.trim() !== "" || type.length > 0;
}

/** Apply the query + type filters in one pass, preserving input order. */
export function applyDiscoveryFilters<T extends FilterableItem>(
  items: T[],
  { query, type }: DiscoveryFilterState,
): T[] {
  if (!hasActiveFilters({ query, type })) return items;
  return items.filter((it) => matchesQuery(it, query) && matchesType(it, type));
}

/** Sort a *copy* (never mutates the input) by the given key.
 *  `title-asc` / `title-desc` use `compareTitle`; `rank` orders ascending by
 *  rank with null ranks pushed last (and a stable title tiebreak), so
 *  unranked cards never masquerade as #1. */
export function sortItems<T extends FilterableItem & { rank?: number | null }>(
  items: T[],
  sort: DiscoverySort,
): T[] {
  const out = items.slice();
  switch (sort) {
    case "title-desc":
      return out.sort((a, b) => compareTitle(b, a));
    case "rank":
      return out.sort((a, b) => {
        const ra = a.rank ?? Number.POSITIVE_INFINITY;
        const rb = b.rank ?? Number.POSITIVE_INFINITY;
        if (ra !== rb) return ra - rb;
        return compareTitle(a, b);
      });
    case "title-asc":
      return out.sort(compareTitle);
    case "default":
    default:
      return out;
  }
}

/** Caption text for the toolbar's honesty line. Filtered views say so. */
export function resultCaption(resultCount: number, totalOnPage: number): string {
  // Pluralize on the page total ("1 of 24 titles"), not on the filtered count.
  const noun = totalOnPage === 1 ? "title" : "titles";
  if (resultCount === totalOnPage) return `${totalOnPage} ${noun}`;
  return `${resultCount} of ${totalOnPage} ${noun} on this page`;
}
