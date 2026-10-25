# Discovery toolbar v2 — multi-select filters on the category page (advanced search)

## Goal

Rebuild the discovery toolbar on **`/category/[id]`** (e.g. `/category/most-popular`,
`/category/top-airing`) to match the reference screenshots: a **search box + Type +
Genre + Status dropdowns + a "Default" sort**, where each dropdown opens a **custom dark
popover** with checkbox items (multi-select for Type/Genre/Status; single-select radio
dots for Default). See:

- `Screenshot_20261023_191441.png` — overall bar layout.
- `Screenshot_20261023_194335.png` — Default sort popover (single-select, radio check).
- `Screenshot_20261023_194403.png` — Status popover (multi-select, green-accented).
- `Screenshot_20261023_194419.png` — Genre popover (multi-select, 4-column checkbox grid).
- `Screenshot_20261023_194604.png` — Type popover (multi-select checkbox list).

Filters must be **real, catalogue-wide, and server-backed** via the upstream
**`GET /search/advanced?q=&genres=&type=&page=`** endpoint (documented in
`docs/03-api-architecture.md:16`). This replaces the current **client-side, current-page-only**
`DiscoveryBoard` model on the category route: filtering becomes server-side and paginated,
and the "X of N titles on this page" honesty caption goes away (it is no longer true).

## Decisions (confirmed with user)

1. **Direction: wire `/search/advanced`** — genuine server-side filtering, not client-side
   over ~24 loaded cards. Genre/Status/Type filter the whole catalogue.
2. **Scope: `/category/[id]` only.** `/genre/[id]`, `/az/[letter]`, and `/search` are NOT
   changed in this plan (they keep their current `DiscoveryBoard`). Do not migrate them.
3. **Sort dropdown: only confirmed-working sorts.** Do not ship a sort the upstream ignores.
   Which sorts work is established by the probe (task 0), not assumed.
4. **Probe first.** The very first implementation task is a capability probe against the
   live API; the toolbar renders only controls/sorts the probe confirms. If
   `/search/advanced` is unavailable or ignores params, STOP and report back before
   building UI around it (re-plan).
5. **Accent: existing frost token** (`bg-frost` / `.on-frost`), not the reference's coral.
   No new color tokens. (Reference status popover is green; keep frost for consistency.)

## Hard constraints discovered from the code (read before editing)

1. **Cards carry almost nothing.** `toCard` (`lib/providers/hianime/mappers.ts:50`) keeps
   only `id, title, jname, poster, type, episodes, rank`; `score` is forced `null` and
   `episodeNumber` `null`. `AnimeCardModel` (`lib/providers/types.ts:12`) has **no genre,
   no status, no year**. ⇒ Genre/Status CANNOT be filtered client-side; the advanced
   endpoint is the only honest path. (This is why option A was chosen.)
2. **The upstream list API takes only `?page=`** for `search` / `genre` / `browse` /
   `az-list` (`lib/providers/hianime/index.ts:189-219`). The advanced endpoint is a
   *different, currently-unused* surface — grep confirms zero references to
   `advanced` / `genres=` anywhere in the repo.
3. **Provider boundary pattern is strict.** Raw shapes only in
   `lib/providers/hianime/` (`schemas.ts` zod → `mappers.ts` normalization); components
   only ever see `lib/providers/types.ts` models. A new endpoint must follow this:
   add a `searchAdvanced` raw schema (reuse `listData` shape if the payload matches —
   it returns `{ heading, pagination, results[] }` like the other list endpoints), add a
   provider fn in `index.ts`, and re-export via `lib/api/index.ts` wrapped in React
   `cache()`.
4. **`safe()` → `Result<T>` is mandatory.** Never let a provider error crash the page;
   render `ErrorState`. Filter fetches must go through `safe`.
5. **Genre taxonomy is static** — `GENRES` in `lib/providers/hianime/index.ts:28-118`
   (name + slug pairs), already surfaced via `getGenres()`. The Genre popover MUST use
   this list (slugs are the values passed to `genres=`). Do not invent genres or read
   genres off cards.
6. **Type options** in the screenshot are `Movie, Music, ONA, OVA, Special, TV, TV_SHORT,
   TV Special`. Decide the source: a small static list (mirrors the reference) vs.
   derived. Since cards can't provide full type coverage and the endpoint filters
   server-side, use a **static type list** matching the reference/hianime taxonomy.
7. **Status options** in the screenshot: `Finished Airing, Currently Airing, Not yet
   aired`. Reuse the existing status semantics in `lib/utils/detail.ts`
   (`isAiringStatus`, `isUnreleased`) as the source of truth for the label strings so the
   filter and the detail page agree.
8. **URL state is the filter state.** Filters live in the URL query (`?q=&type=&genres=&
   status=&sort=&page=`) so the page is shareable, back-button-correct, and server-fetchable.
   Requires the category page to read `searchParams` and pass them to the fetch, and the
   toolbar to be a **client component that pushes a new URL** (`useRouter` / `Link`), NOT
   local `useState` filtering. This is a behavior change from the current `DiscoveryBoard`.
9. **Do not break the nav invariant** (`assertNavUniqueness` in `lib/nav/config.ts`) — no
   new nav destinations are added.
10. **`/category/[id]` currently uses `DiscoveryBoard`** (`app/(browse)/category/[id]/page.tsx:51`).
    That is the only route this plan changes. Keep `categoryHeader(id)`, the `top-airing`
    schedule link, `safe()`, and `Pagination` (extend its `query` prop to carry filters).
11. **Loading skeleton.** `app/(browse)/loading.tsx` renders `ToolbarSkeleton` +
    `GridSkeleton`. `ToolbarSkeleton` (`components/ui/Skeleton.tsx:91`) currently mirrors
    the pill toolbar from the previous session; it must be updated to the new control set
    (search + 3 filter triggers + sort) so the skeleton→board swap doesn't jump. Keep
    `GridSkeleton`'s ladder unchanged.
12. **No test asserts toolbar markup**, but `lib/discovery/toolbar-utils.test.ts` exists.
    If client-side helpers are retired on this route, do not delete tests that other
    routes still rely on (`/genre`, `/az` still use `DiscoveryBoard` + those utils).
13. **A11y + no dead controls** (repo constraint `ui_no_decorative_dead_controls`): the
    popovers must be keyboard-operable (open/close, arrow/space, Esc), the trigger must
    expose `aria-expanded`/`aria-haspopup`, checkboxes must be real labelled inputs or
    `role="checkbox"` with `aria-checked`, and every option offered MUST actually affect
    the query. No option that maps to nothing.

## Task 0 — Capability probe (BLOCKING, do first)

Write a throwaway script (e.g. `scripts/probe-advanced.mjs`, delete after) or a one-off
`node --test`-style probe that hits, in development only, against `API_BASE_URL`:

1. `GET /api/v2/hianime/search/advanced?q=&page=1` → does it exist (200) and what is the
   response envelope/shape? Confirm `{ success, data: { heading, pagination, results[] } }`.
2. Add each param in turn and diff the result set to prove it is honoured:
   `&type=TV`, `&genres=action`, `&genres=action,comedy`, `&status=` (try the provider's
   own spellings: `finished-airing` / `currently-airing` / `not-yet-aired`, and free-text
   `Finished Airing` variants), and each candidate sort.
3. For sort: the reference lists `Default, Latest Updated, Latest Added, Score, Name A-Z,
   Release Date, Most Viewed, Number of episodes`. Probe plausible query keys
   (`sort=`, `sortBy=`, `orderBy=`) and values; **record which actually reorder the
   results** (compare first-page ids before/after).
4. Record the exact param names + value spellings that WORK. If the endpoint 404s, ignores
   params, or errors, STOP and report back (do not build UI on a dead endpoint).

**Deliverable:** a short written capability matrix (param → accepted? → value spelling →
evidence). The plan below is conditional on that matrix; the toolbar must only render
confirmed controls.

## Implementation tasks (after probe)

### 1. Provider: `searchAdvanced`
- `lib/providers/hianime/schemas.ts` — if the payload matches, reuse `listData` (it is
  already `{ heading, pagination, results[] }`). Only add a new schema if the shape differs.
- `lib/providers/hianime/index.ts` — add
  `export function searchAdvanced(params: { q?: string; type?: string; genres?: string[];
  status?: string; sort?: string; page?: number })` building
  `${V2}/search/advanced?...`, using ONLY the params the probe confirmed, URI-encoding
  values, joining `genres` with commas, and mapping results with `M.toCard`. Cache with
  `LIST_REVALIDATE` + a tag keyed on the serialized params.
- `lib/api/index.ts` — `export const searchAdvanced = cache(hianime.searchAdvanced);`
- Keep the provider boundary: no raw shapes leak past `index.ts`.

### 2. Filter metadata (static, single-source)
- `lib/discovery/filters.ts` (new, pure) — export the static option lists the toolbar
  renders, each `{ value, label }`:
  - `TYPE_OPTIONS` = Movie, Music, ONA, OVA, Special, TV, TV_SHORT, TV Special (values =
    upstream spellings confirmed by the probe).
  - `STATUS_OPTIONS` = Finished Airing, Currently Airing, Not yet aired (values = probe
    spellings; strings aligned with `lib/utils/detail.ts`).
  - `SORT_OPTIONS` = ONLY the sorts confirmed by the probe (label + value).
  - Genre options come from `getGenres()` (static `GENRES`, `name`/`slug`) — do NOT
    duplicate the taxonomy.
- Add `lib/discovery/filters.test.ts` covering: URL serialize/parse round-trip for
  multi-value params, and that every option value is non-empty (no dead values).

### 3. URL-state helpers (pure)
- In `lib/discovery/filters.ts`, add:
  - `parseFilterState(searchParams): FilterState` (arrays for type/genres/status, single
    `sort`, `q`, `page`; tolerant of junk/duplicates; drops unknown values not in the
    option lists so a hand-typed URL can't request a dead filter).
  - `toSearchParams(state): URLSearchParams` (omits defaults, comma-joins multi-values,
    drops `page=1` to match `Pagination` conventions).
  - `activeFilterCount(state): number` for the trigger badges/Clear affordance.

### 4. Toolbar UI — `components/discovery/` (client)
Build the popover filter bar to match the screenshots. Reuse and extend the previous
session's pill work (`ToolbarSelect.tsx`, `ViewToggle.tsx`, `DiscoveryToolbar.tsx`):
- **`FilterPopover.tsx`** (new) — a reusable popover trigger + panel:
  - Trigger = pill button showing the control label (or the selected values when active),
    `aria-haspopup="listbox"|"true"`, `aria-expanded`, chevron that flips. Idle style =
    border-line/bg-base-40; active (has selections) = frost accent (`border-frost/50
    bg-frost-soft text-frost`), matching `ViewToggle`'s pressed treatment.
  - Panel = dark rounded panel (`bg-base` / existing surface tokens, `border-line`, soft
    shadow), opens below the trigger, closes on Esc / outside click / select.
  - `CheckList` item = real `<input type="checkbox">` (visually hidden) + custom box +
    label, `role` implied by the input; keyboard: focus trap-lite (Tab within panel),
    Space toggles, Esc closes and returns focus to the trigger.
  - Single-select variant (for Default sort) = radio dots (see
    `Screenshot_20261023_194335.png`), same panel chrome.
  - Genre panel = the 4-column checkbox grid from `Screenshot_20261023_194419.png`.
  - **No new color tokens.** Accent = frost. (Reference green is intentionally not copied.)
- **`DiscoveryFilterBar.tsx`** (new) — assembles: Search input (debounced → pushes `?q=`),
  Type popover, Genre popover, Status popover, Default sort popover, a "Clear all" when
  `activeFilterCount > 0`, and the existing `ViewToggle` (grid/list may stay client-only —
  view is presentation, not a fetch param).
- **Do not delete `DiscoveryToolbar.tsx` / `DiscoveryBoard.tsx`** — `/genre` and `/az`
  still use them (decision 2). If any shared pill component is reused, keep its existing
  props backward-compatible.
- All controls are wrapped in a `<form>` OR push via `router.push(pathname + "?" + qs,
  { scroll: false })`; prefer `router.push` + `useTransition` so the grid shows a pending
  state instead of a full reload.

### 5. Wire the category page
- `app/(browse)/category/[id]/page.tsx`:
  - Extend `searchParams` type to the full filter set; `parseFilterState` it.
  - Fetch via `safe(() => searchAdvanced({ ...state, page: pageNum }))` (fall back to
    `getCategory` ONLY if probes proved advanced unusable AND user accepted — otherwise
    advanced is the single path so behavior is consistent).
  - Render `<DiscoveryFilterBar state={state} />` above the grid; pass the filtered
    `results` to `<Grid>`; keep `Pagination` and pass the active filters through its
    `query` prop so paging preserves them.
  - Metadata: keep `categoryHeader(id).title`; optionally append the active filter summary.
  - Preserve the `top-airing` → `/schedule` link and `ErrorState`/`EmptyState` handling.
  - Empty-after-filter → reuse `<EmptyState>` with a "Clear filters" affordance.
- Remove the now-unused `DiscoveryBoard` import from THIS page only (leave the component
  for the other routes).

### 6. Skeleton parity
- `components/ui/Skeleton.tsx` `ToolbarSkeleton` — mirror the new bar exactly: a search
  pill + four filter-trigger pills + (toggle chips). Same heights (`h-11`), same gaps,
  same borderless container. Keep the invariant **skeleton box == toolbar box**.
- `app/(browse)/loading.tsx` unchanged in structure (still toolbar + grid) — just inherits
  the updated `ToolbarSkeleton`.

## Failure modes / risks

- **Dead endpoint.** If `/search/advanced` is gone or ignores params, the whole design is
  unfounded → task 0 must stop the work, not paper over it. This is the top risk.
- **Dead controls.** Any option/sort the probe didn't confirm must NOT render. URL parse
  must drop unknown values so a stale bookmark can't request a filter the API ignores.
- **Behavior change to `/category/*`.** Filtering was client-only/current-page; it becomes
  server-side/catalogue-wide + paginated. Expected and approved, but it changes the
  empty/loading/pagination behavior — update skeletons and captions accordingly, and drop
  the "of N on this page" copy.
- **Filter+page interaction.** Changing a filter must reset `page` to 1, or users land on
  an empty page 7. `toSearchParams` must omit/default `page` whenever filters change.
- **Scope creep.** `/genre`, `/az`, `/search` must keep working with the OLD toolbar
  untouched. Do not refactor or delete `DiscoveryBoard`/`DiscoveryToolbar`/`toolbar-utils`.
- **A11y regressions.** Custom popovers can break keyboard/SR. Use real inputs, real
  labels, `aria-expanded`, Esc-to-close, focus return. Verify with keyboard only.
- **Static list drift.** Type/Status/Genre option values must match what the API accepts;
  a mismatch silently yields zero results. The probe is the guard; add the option values
  to `lib/discovery/filters.test.ts` as non-empty assertions and cross-check against the
  probe's matrix.
- **Grid/rail rule.** Never wrap the grid cards in `Reveal` (they render opacity-0 until
  hydration) — the filter bar's pending state must not do this either.

## Validation plan

1. `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` (CI parity). New
   `lib/discovery/filters.test.ts` passes under `node --test`.
2. Task 0 probe recorded; capability matrix attached to the PR/notes.
3. `npm run dev` → `/category/most-popular`:
   - Open each popover → matches the reference layout (checkbox lists; 4-col genre grid;
     radio-dot sort). Keyboard-only: Tab to trigger, Enter to open, Space toggles, Esc
     closes and restores focus.
   - Selecting Type/Genre/Status triggers a server refetch (URL updates, results change,
     pagination resets to page 1). Multi-select unions within a facet; facets AND together.
   - Sort dropdown changes order only for confirmed sorts.
   - Search box filters by title server-side; debounce works; URL reflects `q`.
   - "Clear all" appears only when a filter is active and restores the unfiltered page.
   - Pagination preserves active filters (check page 2 URL + results).
   - Empty result → `EmptyState` with a working "Clear filters".
   - Upstream failure → `ErrorState` (via `safe`), never a 500.
4. Reload to exercise the route skeleton → no visible jump when the real bar replaces
   `ToolbarSkeleton`.
5. Regression: `/genre/action`, `/az/all`, `/search?q=naruto` still render the OLD
   `DiscoveryBoard` toolbar and behave exactly as before. `/schedule`, player, watch,
   detail, home unchanged.
6. Responsive: desktop one row; mobile wraps; no horizontal overflow; popovers stay
   on-screen and scrollable when the genre list is long (`Screenshot_20261023_194419.png`
   shows ~5 rows visible with internal scroll).

## Out of scope

- `/genre/[id]`, `/az/[letter]`, `/search` (keep current client toolbar).
- `/schedule` (toolbar was intentionally removed earlier).
- Player, watch routes, detail page, home board.
- Any provider/schema/mapper change beyond the additive `searchAdvanced` above.
- Year/Season/rating filters not shown in the references; `Most Viewed`/`Highest Rated`
  sorts unless the probe confirms upstream support.
- New color tokens / coral accent (use frost).
- Client-side filtering over the current page (explicitly replaced on this route).
- Deleting `DiscoveryBoard`/`DiscoveryToolbar`/`toolbar-utils` (still used elsewhere).

## Open questions

- **Resolved:** direction (A), scope (category only), sort policy (confirmed-only), method
  (probe first), accent (frost).
- **Blocking on the implementer (task 0):** the exact param names, value spellings, and
  which sorts the live `/search/advanced` honours. The toolbar is built to the probe's
  matrix; if the endpoint is dead, stop and re-plan.
