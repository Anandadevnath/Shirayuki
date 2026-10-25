# Premium Discovery Toolbars — Shirayuki

## Goal

Give the existing discovery routes a coherent, premium filtering layer: a shared,
configurable toolbar (search · context filters · sort · view toggle · real result
count · clear-filters) above the poster grid, plus consistent headings, spacing,
loading/empty/error states and glassmorphism — matching the supplied reference
screenshot's *feel* while only rendering controls the backend can actually back.

## Hard constraints discovered from the code (read before editing)

1. **The backend has NO filter/sort API.** Every list endpoint takes only `?page=`:
   - `search(q, page)` → `${V2}/search?q=&page=` (`lib/providers/hianime/index.ts:202`)
   - `getGenre(id, page)` → `${V2}/genre/{id}?page=`
   - `getCategory(id, page)` → `${V2}/browse/{id}?page=`
   - `getAZ(letter, page)` → `${V2}/browse/az-list?page=` (**ignores the letter**)
   Each returns `{ heading, pagination, results[] }` — a single ~24-card page.
   There is no `type/genre/status/year/sort/season/rating` param anywhere.
2. **Card normalization drops the useful fields.** `toCard` (`mappers.ts:50`) keeps
   only `id, title, jname, poster, type, episodes{sub,dub}, rank`; `score` is always
   `null`, `episodeNumber` always `null`, and `releaseDate`/`duration`/`banner`/
   `quality` are discarded. **So per-card, the only filterable/sortable attributes are
   `title` and `type` (+ `episodes`, `rank`).** Year/season/rating/genre/status do not
   exist client-side and must NOT be faked.
3. **Decision (user-approved): filter/sort the already-fetched page client-side.**
   No new fetches. Pagination stays server-rendered and unchanged. Filtering applies
   to the current page's ~24 items — the toolbar must say so honestly.
4. **Only render supported controls (user-approved).** Title search, Type filter,
   and Sort by Title (A–Z / Z–A). Everything else in the reference (Genre, Status,
   Year, Season, Rating dropdowns, "Most Viewed/Highest Rated", compact-grid view)
   is **omitted**, not stubbed. Rank badges already exist and render only when
   `card.rank` is present — leave that logic alone.
5. **View modes: Grid + List only (user-approved).** Both variants already exist in
   `AnimeCard.tsx` (`variant="poster"` default, `variant="row"` at line 51). No new
   card component. Compact-grid is dropped.
6. **Scope: existing routes only (user-approved)** — `/category/[id]` (covers
   Popular, Airing, Movies, TV, Completed, New, Favorites, OVA/ONA/Special),
   `/az/[letter]`, `/genre/[id]`, `/schedule`, `/search`. Do NOT invent `/latest`,
   `/upcoming`, `/completed`, `/movies` routes.
7. **Title search already fully works server-side** on `/search` (real query param,
   real results, real pagination). `/search` must NOT get the client board — it keeps
   its existing form + server grid. Its only change is presentational consistency.
8. **`/az/*` letters return identical content** (provider limitation; `getAZ` ignores
   the letter). `AlphabetNav` already highlights the active letter. Do not add fake
   per-letter counts.
9. **The shared `Grid` + `RankedGrid` + `GridSkeleton` column ladder is intentionally
   unified at 2/3/5/6/7** (just changed). The board must reuse `<Grid>` for grid view
   and must NOT re-introduce a divergent ladder. `GridSkeleton` mirrors it.
10. **Don't wrap grid/rail cards in `Reveal`** — they render opacity-0 until hydration
    (documented in `Grid.tsx`). The board's filtered re-render is client-side; cards
    must stay visible from frame 0.
11. **Nav uniqueness invariant** (`assertNavUniqueness()` at `config.ts:209`) runs at
    module load. Any new *nav* destination must be added to the typed config, never as
    stray `<Link>`s. The board adds no nav items.

## Supported control matrix (the honest toolbar)

| Page | Route | Search | Type filter | Sort | View toggle | Count | Notes |
|---|---|---|---|---|---|---|---|
| Popular / any category | `/category/[id]` | yes | yes | Title A–Z/Z–A, Rank (when present) | Grid/List | `results.length` of filtered | rank sort hidden if no ranks |
| Browse A–Z | `/az/[letter]` | yes | yes | Title A–Z/Z–A | Grid/List | filtered count + alphabet | keep `AlphabetNav` |
| Genre | `/genre/[id]` | yes | yes | Title A–Z/Z–A | Grid/List | filtered count | heading already exists |
| Airing | `/category/top-airing` | yes | yes | Title A–Z/Z–A | Grid/List | filtered count | same route as Popular |
| Schedule | `/schedule` | yes | yes | Title A–Z/Z–A | — | per-list counts | filters week/upcoming/airing lists |
| Search | `/search` | (server form) | no | no | no | server results | unchanged except styling |

Type options are derived from the **actual `type` values present on the fetched
cards** (e.g. `TV`, `Movie`, `OVA`, `ONA`, `Special`, `TV Special`), so the filter
never shows an empty option. If a page has ≤1 distinct type, the Type control is
hidden (nothing to filter).

## Deliverables (new files)

1. **`components/discovery/DiscoveryToolbar.tsx`** (`"use client"`)
   - The reusable, configurable toolbar. Props drive which controls render:
     ```ts
     type SortOption = { value: string; label: string };
     interface DiscoveryToolbarProps {
       query: string;
       onQueryChange: (q: string) => void;
       types: string[];                 // distinct types present; [] hides Type
       typeFilter: string | null;       // null = all
       onTypeChange: (t: string | null) => void;
       sortOptions: SortOption[];       // caller supplies only supportable sorts
       sort: string;
       onSortChange: (s: string) => void;
       view?: "grid" | "list";          // omit to hide the toggle
       onViewChange?: (v: "grid" | "list") => void;
       resultCount: number;             // real, post-filter
       totalOnPage: number;             // for the "of N on this page" caption
       active: boolean;                 // any filter active → show Clear
       onClear: () => void;
       className?: string;
     }
     ```
   - Visual target (from the reference, adapted to Shirayuki tokens — **no new colors**):
     - `glass` panel, `rounded-lg`, padding `p-3 sm:p-4`, restrained blur.
     - Row 1 (header, when the page passes a heading slot): count text left, view
       toggle right. Actually the **heading stays in the page** (server) and the board
       renders count + view toggle + toolbar; see board below.
     - Row 2: `flex flex-wrap gap-2 sm:gap-3` of controls. Search input with
       `Search` icon (leading), `h-10`, `rounded-[var(--radius-btn)]`, `border-line`,
       `bg-base/40`, `focus-within:border-frost/50`. Selects styled identically.
     - Primary action uses the site's accent pill (existing `bg-frost ... on-frost`
       pattern from `AnimeCard`'s Watch pill) rather than the reference's coral —
       **do not add a coral token**.
     - Clear-filters: a ghost `text-muted hover:text-frost` button with `X` icon,
       shown only when `active`.
   - Mobile: controls wrap; the panel stays a single column ≥ full-width controls.
   - A11y: real `<label>` (sr-only) per control, `aria-label` on icon buttons,
     visible `focus-visible:outline-frost`, view toggle is a `role="group"` of
     `aria-pressed` buttons.
2. **`components/discovery/DiscoveryBoard.tsx`** (`"use client"`)
   - Owns filter/sort/view state; receives already-fetched `items: AnimeCardModel[]`.
   - Derives `types` from items; renders `DiscoveryToolbar` + the filtered grid.
   - Grid view → `<Grid items={filtered} />` (reuse; keeps the 2/3/5/6/7 ladder).
   - List view → a simple `flex flex-col gap-1` of `<AnimeCard variant="row" />`.
   - Empty-after-filter → reuse `<EmptyState>` with a "Clear filters" affordance
     (`States.tsx`), NOT a new empty component.
   - Sort implementations (only these): `title-asc`, `title-desc`, and `rank`
     (only offered when ≥1 item has a `rank !== null`).
   - Sub-components (same folder): `ToolbarSelect.tsx` (styled native `<select>`
     wrapper for a11y + no-JS fallback) and `ViewToggle.tsx`.
3. **`lib/discovery/toolbar-utils.ts`** (pure, SSR/client-safe, unit-testable like
   `format.ts`):
   - `distinctTypes(items: AnimeCardModel[]): string[]`
   - `applyDiscoveryFilters(items, { query, type }): AnimeCardModel[]`
   - `sortItems(items, sort): AnimeCardModel[]`
   - `hasActiveFilters({ query, type }): boolean`
   - `compareTitle(a, b)` using `localeCompare` with `{ sensitivity: "base" }`.
   - **New test: `lib/discovery/toolbar-utils.test.ts`** (node:test, relative imports,
   `.ts` extensions) covering: empty query/type passthrough, case-insensitive title
   match, type filter exactness, stable title sort, rank sort ordering + null-last.

## Changes to existing files (small, independently revertable)

1. **`components/common/SectionHeader.tsx`** — no change needed beyond the `icon`
   prop already added this session. Reuse `PageHeader` for headings.
2. **`app/(browse)/category/[id]/page.tsx`** — wrap `<Grid …>` + `<Pagination>` block
   in `<DiscoveryBoard items={res.data.results} emptyState={<EmptyState/>}>` for the
   success branch only. Keep `categoryHeader(id)` heading, `safe()`, `pageNum`,
   pagination `basePath`, and the `top-airing` schedule link byte-for-byte. Board is
   placed **after** the server `<PageHeader>` and **before** `<Pagination>`.
3. **`app/(browse)/az/[letter]/page.tsx`** — insert the board between `AlphabetNav`
   (which stays) and `<Pagination>`; keep the count line driven by `res.data`.
4. **`app/(browse)/genre/[id]/page.tsx`** — same board wrap; keep heading + metadata.
5. **`app/(browse)/schedule/page.tsx`** — this page has 3 distinct lists (week
   calendar / upcoming / airing) and a working tabbed calendar. Do **not** wrap the
   calendar. Add a lightweight `ScheduleToolbar` (search + type filter + sort) that
   filters the **upcoming** and **airing** lists and the week buckets by title/type,
   reusing `applyDiscoveryFilters`. Preserve `withTimeout`, `WEEK_ORDER`,
   `ScheduleCalendar`, `ScheduleItemRow`, `toCard`, and the airing "More" link.
   The existing day-selector + timezone/`formatDate` UTC handling is untouched.
6. **`app/(browse)/search/page.tsx`** — leave the server search form + results grid
   as-is. Only align the empty state / spacing with the shared rhythm if trivially
   safe. No board (search is already a real server filter).
7. **`app/(browse)/loading.tsx` + `components/ui/Skeleton.tsx`** — add a
   `ToolbarSkeleton` (glass bar with 3–4 control-shaped placeholders) and render it
   above `GridSkeleton` in `loading.tsx` so the skeleton→board swap doesn't jump.
   Do not change `GridSkeleton`'s ladder.
8. **`app/globals.css`** — only if a `.glass` variant is needed for the toolbar's
   inner controls; prefer existing `.glass`, `bg-base/40`, `border-line`,
   `bg-frost-soft`. **Add no new color tokens.**

## Explicitly OUT of scope (do not implement)

- Server-side filtering/sorting; any provider/API/schema/mapper change.
- Year, season, rating, genre, status filters; "Most Viewed"/"Highest Rated" sorts.
- Compact-grid view; new card components.
- New routes (`/latest`, `/upcoming`, `/completed`, `/movies`, `/airing`).
- Per-letter A–Z counts (provider returns identical content).
- Any change to the player, watch routes, detail page, or episode navigation.
- `localStorage`/Continue-Watching integration (only `/watchlist` owns that; it is not
  a discovery page).

## Implementation order

1. `lib/discovery/toolbar-utils.ts` + its test (pure, no UI risk).
2. `components/discovery/ViewToggle.tsx`, `ToolbarSelect.tsx`, `DiscoveryToolbar.tsx`.
3. `components/discovery/DiscoveryBoard.tsx`.
4. Wire `/category/[id]` (covers Popular + Airing + all category variants) — verify.
5. Wire `/genre/[id]` — verify.
6. Wire `/az/[letter]` (keep `AlphabetNav`) — verify.
7. `ToolbarSkeleton` into `(browse)/loading.tsx`.
8. Schedule toolbar (most delicate — preserve all existing schedule logic).
9. Search page spacing only.
10. Remove dead code introduced during the work; re-check unused imports.

## Risks & mitigations

- **"Filters apply to this page" honesty.** With only ~24 items loaded, filtering
  shows a small subset. Mitigation: the toolbar always shows real
  `resultCount` and a caption like `Showing X of N on this page`; clearing restores.
  Pagination remains the way to see more.
- **Confusion with server `/search`.** Search filters the whole catalogue; the board
  filters one page. Keep `/search` as-is and label the board caption clearly so the
  two never read as the same mechanism.
- **Schedule triple-list coupling.** Filtering the calendar's week buckets could
  empty a day and hide real data. Mitigation: filter only when a search/type is
  active; when inactive render everything unchanged, and never drop a weekday bucket.
- **Hydration mismatch.** Board is client-only and receives server-rendered `items`;
  SSR renders the unfiltered grid first (identical markup to today) and filters on
  interaction, so FCR stays stable. No `Reveal` wrappers.
- **Grid ladder drift.** Reuse `<Grid>` verbatim; do not fork the 2/3/5/6/7 ladder.

## Validation (run, don't claim)

1. `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` (CI parity).
2. New `lib/discovery/toolbar-utils.test.ts` passes under `node --test`.
3. Route checks (min 1 successful render each): `/category/most-popular` (+`?page=2`),
   `/category/top-airing`, `/category/movie`, `/genre/action`, `/az/all`, `/az/0-9`,
   `/search?q=naruto`, `/schedule`.
   - NOTE: upstream `/api/v2/browse/*` currently 404s (scraper outage observed this
     session); affected routes render `ErrorState`. Verify board behavior on
     data-returning routes and confirm error states are unchanged.
4. Per-page: each rendered filter/sort actually changes the grid; count matches the
   visible cards; clear-filters restores the full page; pagination links unchanged.
5. View toggle: Grid ↔ List both render; cards still link to `/anime/[id]`.
6. Responsive: desktop toolbar one row; mobile wraps; no horizontal overflow;
   focus-visible rings on every control; keyboard-operable (Tab/Enter/Arrows).
7. Confirm zero changes to player/watch/detail/episode behavior and schedule
   timezone/premiere handling.

## Open questions

- None blocking. All capability, scope, view-mode and unsupported-control decisions
  are resolved above (all four "Recommended" options chosen by the user).
